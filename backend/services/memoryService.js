/**
 * Memory Service: Indexes and retrieves user chat messages semantically
 * Allows the bot to recall and reference previous user statements across conversations
 */

const fs = require('fs');
const path = require('path');
const { createEmbedding } = require('./embeddingsClient');

const repoRoot = path.resolve(__dirname, '..', '..');
const memoryStorePath = path.join(repoRoot, 'backend', 'data', 'user_memory_index.json');

/**
 * Load user memory index from disk
 */
function loadMemoryStore() {
  try {
    if (fs.existsSync(memoryStorePath)) {
      const raw = fs.readFileSync(memoryStorePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load memory store:', e.message);
  }
  return { memories: [] };
}

/**
 * Save user memory index to disk
 */
function saveMemoryStore(store) {
  try {
    const dir = path.dirname(memoryStorePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(memoryStorePath, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to save memory store:', e.message);
  }
}

/**
 * Cosine similarity helper
 */
function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    s += (a[i] || 0) * (b[i] || 0);
  }
  return s;
}

function norm(a) {
  return Math.sqrt(dot(a, a) || 1e-12);
}

function cosine(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (na === 0 || nb === 0) return 0;
  return dot(a, b) / (na * nb);
}

/**
 * Extract key facts from a user message (simple heuristic)
 * Looks for patterns like "My name is", "I like", "I work", etc.
 */
function extractFacts(message) {
  const facts = [];

  // Name extraction
  const nameMatch = message.match(/(?:my name is|i am|i'm)\s+([A-Z][A-Za-z\-\s]+)/i);
  if (nameMatch) {
    facts.push({
      type: 'name',
      value: nameMatch[1].trim(),
      strength: 0.95
    });
  }

  // Job/Role extraction
  const jobMatch = message.match(/(?:i (?:am|work as|do)|i'm|my (?:job|role|work))\s+(?:a|an)?\s*([A-Za-z\s]+?)(?:\.|,|;|$)/i);
  if (jobMatch) {
    facts.push({
      type: 'occupation',
      value: jobMatch[1].trim(),
      strength: 0.85
    });
  }

  // Interest extraction
  const interestMatches = message.match(/(?:i (?:love|like|enjoy|interested in|fascinated by)|my (?:interest|passion|hobby))\s+([A-Za-z\s]+?)(?:\.|,|;|$)/gi);
  if (interestMatches) {
    interestMatches.forEach(m => {
      const match = m.match(/(?:i (?:love|like|enjoy|interested in|fascinated by)|my (?:interest|passion|hobby))\s+([A-Za-z\s]+?)(?:\.|,|;|$)/i);
      if (match) {
        facts.push({
          type: 'interest',
          value: match[1].trim(),
          strength: 0.8
        });
      }
    });
  }

  return facts;
}

/**
 * Index a user message into memory
 * Stores both raw message and extracted facts with embeddings
 */
async function indexUserMessage(userId, conversationId, messageText, metadata = {}) {
  try {
    if (!messageText || messageText.trim().length < 5) return null; // Skip very short messages

    const store = loadMemoryStore();
    const timestamp = new Date().toISOString();
    
    // Extract facts from message
    const facts = extractFacts(messageText);
    
    // Create embeddings for the message
    let embedding = null;
    try {
      const embResult = await createEmbedding(messageText);
      embedding = embResult && embResult.vector ? embResult.vector : null;
    } catch (e) {
      // Non-fatal: embeddings unavailable
      // eslint-disable-next-line no-console
      console.warn('Failed to create embedding for user message:', e.message);
    }

    const memoryEntry = {
      id: `${userId}::${conversationId}::${Date.now()}`,
      userId,
      conversationId,
      messageText: messageText.substring(0, 500), // Limit length
      embedding, // Vector representation for semantic search
      facts, // Extracted structured facts
      metadata, // Custom metadata (e.g., sentiment, topic)
      timestamp,
      indexed: !!embedding // Whether this entry can be semantically searched
    };

    store.memories.push(memoryEntry);
    saveMemoryStore(store);

    return memoryEntry;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error indexing user message:', err);
    return null;
  }
}

/**
 * Retrieve semantically similar memories for a user
 * Useful for long-term context and personalization
 */
async function retrieveUserMemories(userId, queryText, limit = 5, minSimilarity = 0.5) {
  try {
    const store = loadMemoryStore();
    
    // Filter memories for this user
    const userMemories = store.memories.filter(m => m.userId === userId);
    if (userMemories.length === 0) return [];

    // If no embedding capability, return recent memories
    let queryEmbedding = null;
    try {
      const embResult = await createEmbedding(queryText);
      queryEmbedding = embResult && embResult.vector ? embResult.vector : null;
    } catch (e) {
      // Non-fatal
      // eslint-disable-next-line no-console
      console.warn('Failed to create query embedding:', e.message);
    }

    if (!queryEmbedding) {
      // Fallback: return recent memories
      return userMemories
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
        .map(m => ({ ...m, similarity: 0.5 }));
    }

    // Score memories by semantic similarity
    const scored = userMemories
      .filter(m => m.embedding && m.indexed)
      .map(m => ({
        ...m,
        similarity: cosine(queryEmbedding, m.embedding)
      }))
      .filter(m => m.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return scored;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error retrieving user memories:', err);
    return [];
  }
}

/**
 * Extract facts about a user (consolidated from their memories)
 * Returns structured knowledge like their name, interests, occupation, etc.
 */
async function getUserProfile(userId) {
  try {
    const store = loadMemoryStore();
    const userMemories = store.memories.filter(m => m.userId === userId);

    const profile = {
      userId,
      name: null,
      occupations: [],
      interests: [],
      messageCount: userMemories.length,
      firstInteraction: null,
      lastInteraction: null,
      facts: []
    };

    // Aggregate facts from all memories
    const factMap = new Map();
    for (const memory of userMemories) {
      for (const fact of (memory.facts || [])) {
        const key = `${fact.type}::${fact.value}`;
        if (!factMap.has(key)) {
          factMap.set(key, { ...fact, count: 0 });
        }
        factMap.get(key).count += 1;
      }

      // Track first and last interaction
      if (!profile.firstInteraction || new Date(memory.timestamp) < new Date(profile.firstInteraction)) {
        profile.firstInteraction = memory.timestamp;
      }
      if (!profile.lastInteraction || new Date(memory.timestamp) > new Date(profile.lastInteraction)) {
        profile.lastInteraction = memory.timestamp;
      }
    }

    // Extract consolidated facts
    for (const [key, fact] of factMap.entries()) {
      const [type, value] = key.split('::');
      if (type === 'name') {
        profile.name = value; // Most recently stated name
      } else if (type === 'occupation') {
        profile.occupations.push(value);
      } else if (type === 'interest') {
        profile.interests.push(value);
      }
      profile.facts.push({
        type,
        value,
        frequency: fact.count,
        strength: fact.strength
      });
    }

    return profile;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching user profile:', err);
    return { userId, name: null, occupations: [], interests: [], messageCount: 0 };
  }
}

/**
 * Clear all memories for a user (privacy request)
 */
async function clearUserMemories(userId) {
  try {
    const store = loadMemoryStore();
    const initialCount = store.memories.length;
    store.memories = store.memories.filter(m => m.userId !== userId);
    saveMemoryStore(store);
    return {
      success: true,
      cleared: initialCount - store.memories.length
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error clearing user memories:', err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  indexUserMessage,
  retrieveUserMemories,
  getUserProfile,
  clearUserMemories,
  extractFacts
};
