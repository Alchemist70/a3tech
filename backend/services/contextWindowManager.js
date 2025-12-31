// Utility to manage LLM context windows and summarize old conversation messages
// to prevent token explosion while maintaining conversation continuity.

const { callOpenAIChat } = require('./llmClient');

// Estimate tokens in a string (rough approximation: 1 token ~= 4 chars)
function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

// Summarize a list of messages into a concise summary to preserve context
async function summarizeMessages(messages) {
  if (!messages || messages.length === 0) return null;

  const text = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  const systemMsg = {
    role: 'system',
    content: 'Summarize the following conversation in 1-2 sentences, preserving key facts and user information (like their name or preferences).'
  };

  try {
    const ppKey = process.env.PERPLEXITY_API_KEY || process.env.PPLX_API_KEY;
    if (!ppKey) {
      // No LLM available; return null and rely on token-based truncation
      return null;
    }

    const summary = await callOpenAIChat([
      systemMsg,
      { role: 'user', content: text }
    ]);

    return summary || null;
  } catch (e) {
    // Silently fail; caller will handle missing summary
    return null;
  }
}

// Prune conversation history to fit within token budget
// Returns { messages: [...], summarized: boolean }
async function pruneMessagesToTokenBudget(messages, budgetTokens = 2000) {
  if (!messages || messages.length === 0) return { messages: [], summarized: false };

  // System message overhead
  const systemOverhead = 500;
  let currentTokens = systemOverhead;
  let kept = [];
  let pruned = [];

  // Keep messages from the end (most recent first)
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.content) + 20; // 20 for role/overhead
    if (currentTokens + msgTokens <= budgetTokens) {
      kept.unshift(msg);
      currentTokens += msgTokens;
    } else {
      pruned.unshift(msg);
    }
  }

  // If we pruned messages, attempt to summarize them
  let summarized = false;
  if (pruned.length > 0) {
    try {
      const summary = await summarizeMessages(pruned);
      if (summary) {
        kept.unshift({
          role: 'assistant',
          content: `[Earlier conversation summary: ${summary}]`
        });
        summarized = true;
      }
    } catch (e) {
      // ignore summary failure
    }
  }

  return { messages: kept, summarized };
}

module.exports = {
  estimateTokens,
  summarizeMessages,
  pruneMessagesToTokenBudget
};
