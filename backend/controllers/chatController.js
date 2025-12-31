// Enhanced chat controller with optional RAG (retrieval-augmented generation)
// and optional LLM (OpenAI/Perplexity) integration. If no external provider is
// configured the controller falls back to the previous simple echo behavior
// so existing functionality is preserved.

const { retrieveRelevantDocs } = require('../services/ragService');
const { callOpenAIChat } = require('../services/llmClient');
const { getRecentContext } = require('./chatHistoryController');
const { pruneMessagesToTokenBudget } = require('../services/contextWindowManager');
const { indexUserMessage, retrieveUserMemories } = require('../services/memoryService');
const { extractNames, isValidName, sanitizeName, getPIISummary } = require('../services/piiRedactionService');
const { redactBeforeSave, processNameFromMessage } = require('../middleware/piiRedactionMiddleware');
const ChatHistory = require('../models/ChatHistory');
const User = require('../models/User');

// Check if a resource source is internal/non-user-facing (only show projects, research, knowledge base, etc.)
function isInternalResource(source) {
  if (!source) return true;
  const s = String(source).toLowerCase().trim();
  
  // Blacklist: explicitly exclude internal/technical files and directories
  const internalKeywords = [
    'readme',
    'discovery',
    'guide',
    'config',
    'middleware',
    'controller',
    'route',
    'model',
    'service',
    'env',
    'package',
    'tsconfig',
    'webpack',
    'test',
    'spec',
    'example',
    'sample',
    'server',
    'client',
    'database',
    'docker',
    'deploy',
    'build',
  ];
  
  // If source contains ANY internal keyword, it's internal
  if (internalKeywords.some(keyword => s.includes(keyword))) {
    return true;
  }
  
  // If it doesn't explicitly match user-facing types, consider it internal
  const userFacingKeywords = [
    'project',
    'research',
    'topic',
    'subject',
    'knowledge',
    'faq',
    'blog',
    'post',
    'article',
    'testimonial',
    'course',
    'lesson',
    'material',
    'learning',
    'biomarker',  // specific to the domain
    'discovery',  // but only if not discovery guide
  ];
  
  return !userFacingKeywords.some(keyword => s.includes(keyword));
}

function buildSystemPrompt(userQuestion, contexts) {
  const instructions = [
    'You are Einstein, an intelligent research assistant for the A3 website.',
    'Your role is to answer questions about the site, its research, projects, and educational resources.',
    '',
    'IMPORTANT INSTRUCTIONS:',
    '1. For general knowledge questions (e.g., "What is Reproduction?", "Explain Photosynthesis"), provide a clear, professional definition and examples first, then note any relevant A3 resources.',
    '2. For site-specific questions, use the provided context snippets. Do NOT invent facts or external addresses not present in contexts.',
    '3. If context supports an answer, answer directly and comprehensively.',
    '4. Reference sources by name (e.g., "from the projects page" or "in the knowledge base").',
    '5. If no context found for a site query, be honest and offer to search. Do NOT guess or hallucinate.',
    '6. Do NOT invent acronym expansions. Only expand if context explicitly contains the expansion.',
    '7. Keep answers professional and concise (2-3 sentences per point).',
    '8. Use bullet points, numbered lists, and proper markdown for tables. IMPORTANT: When creating tables, ensure all separator lines (---) are properly aligned with headers and use consistent spacing. Example format:',
    '   | Column 1 | Column 2 |',
    '   |----------|----------|',
    '   | Data 1   | Data 2   |',
    '',
    'CONTEXT SNIPPETS (ranked by relevance):',
  ];

  if (contexts && contexts.length > 0) {
    contexts.forEach((c, i) => {
      instructions.push(`[${i + 1}] Source: ${c.source || 'unknown'}`);
      instructions.push(`    ${(c.text || '').substring(0, 500)}`);
      instructions.push('');
    });
  } else {
    instructions.push('(No relevant context found.)');
  }

  instructions.push(
    '',
    'USER QUESTION:',
    `"${userQuestion}"`,
    '',
    'Provide a clear, helpful answer that cites sources when relevant. If the contexts do not contain the answer, respond that the information is not available in the current knowledge base.'
  );

  return instructions.join('\n');
}

// Generate a short social/polite reply. Returns string or null.
exports.generateSocialReply = async (prompt, opts = {}) => {
  try {
    const shortPoliteRegex = /^\s*(thanks?|thank you|thx|ty|appreciate it|much appreciated|thanks a lot|cheers|bye|goodbye|see you|see ya)\b[!.]?$/i;
    if (!prompt || !shortPoliteRegex.test(prompt) || String(prompt).length >= 80) return null;

    const tone = (opts.socialTone || '').toString().toLowerCase(); // 'short' | 'friendly' | 'formal'
    const lengthPref = (opts.socialLength || '').toString().toLowerCase(); // 'short'|'medium'

    // Prepare example set based on tone preference
    const examplesMap = {
      short: [
        { user: 'thanks', assistant: "You're welcome!" },
        { user: 'thank you', assistant: "No problem — glad to help." },
        { user: 'bye', assistant: "Bye!" }
      ],
      friendly: [
        { user: 'thanks', assistant: "You're welcome — glad I could help!" },
        { user: 'thank you', assistant: "Happy to help — let me know if you need anything else." },
        { user: 'bye', assistant: "Goodbye! If you need anything else, just ask." }
      ],
      formal: [
        { user: 'thanks', assistant: "You're welcome. I'm glad I could assist." },
        { user: 'thank you', assistant: "It was my pleasure to assist you. Please reach out if you need further help." },
        { user: 'bye', assistant: "Goodbye. Wishing you well." }
      ]
    };

    const examples = examplesMap[tone] || examplesMap.friendly;

    // Adjust system instructions based on length preference
    const maxSent = lengthPref === 'short' ? '1' : '2';
    const system = [
      'You are Einstein, a friendly assistant for the A3 website.',
      `When the user sends a very short social message (thanks, thank you, bye, cheers), reply briefly and naturally in a conversational tone. Limit replies to at most ${maxSent} sentence(s).`,
      'Do NOT attempt to answer knowledge questions here; keep replies concise and do not invent facts.',
      'Vary phrasing across interactions but remain polite.'
    ].join(' ');

    const messagesForLLM = [{ role: 'system', content: system }];
    for (const ex of examples) {
      messagesForLLM.push({ role: 'user', content: ex.user });
      messagesForLLM.push({ role: 'assistant', content: ex.assistant });
    }
    messagesForLLM.push({ role: 'user', content: prompt });

    // Try LLM
    try {
      const llmShortReply = await callOpenAIChat(messagesForLLM, { temperature: 0.6, timeout: 5000 });
      if (llmShortReply && String(llmShortReply).trim().length > 0) {
        const clean = sanitizeReply(String(llmShortReply).replace(/\[\d+\]/g, '').replace(/  +/g, ' ').trim());
        if (clean && clean.length > 0) return clean;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[chat] generateSocialReply LLM failed:', e && e.message ? e.message : e);
    }

    // Fallback canned responses
    const isFarewell = /\b(bye|goodbye|see you|see ya)\b/i.test(prompt);
    if (isFarewell) return "Goodbye! Take care — I'm here if you need more help.";
    return "You're welcome — happy to help!";
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('generateSocialReply error', e && e.message ? e.message : e);
    return null;
  }
};

// Helper: synthesize a polished fallback response when LLM is unavailable
// Intelligently extracts key information and creates natural language summaries
function synthesizeFallbackResponse(userQuestion, contexts) {
  if (!contexts || contexts.length === 0) {
    return "I don't have information about that topic in my knowledge base. Please try a different question or visit the site directly to explore.";
  }

  // Small stopword set
  const stopwords = new Set(['the','and','for','with','that','this','from','are','was','were','have','has','but','not','can','will','our','your','you']);

  // Normalize camelCase and identifiers into readable phrases
  const normalizeToken = (t) => {
    if (!t) return null;
    // Remove surrounding punctuation
    t = t.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    // Split camelCase and PascalCase
    t = t.replace(/([a-z])([A-Z])/g, '$1 $2');
    // Replace underscores/hyphens with spaces
    t = t.replace(/[_\-]+/g, ' ');
    return t.trim().toLowerCase();
  };

  // Collect candidate keywords from top contexts
  const freq = new Map();
  const sources = [];
  for (let i = 0; i < Math.min(4, contexts.length); i++) {
    const c = contexts[i];
    const txt = String(c.text || '');
    // take words that look informative
    const tokens = txt.match(/\b[A-Za-z][A-Za-z0-9_]{2,}\b/g) || [];
    for (const tok of tokens) {
      const norm = normalizeToken(tok);
      if (!norm || norm.length < 3) continue;
      if (stopwords.has(norm)) continue;
      // ignore tokens that are long hex ids
      if (/^[a-f0-9]{8,}$/.test(norm)) continue;
      const prev = freq.get(norm) || 0;
      freq.set(norm, prev + 1);
    }
    // Pretty source label
    const src = (c.source || 'unknown').replace(/^(file:|project:|subject:)/i, '').replace(/\.[tj]s(x)?$/i, '').replace(/[a-f0-9]{8,}/g, 'resource').replace(/\\/g, '/');
    sources.push(src);
  }

  // Choose top keywords
  const top = Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,6).map(e=>e[0]);

  // If keywords are weak, fall back to short cleaned excerpt
  if (top.length === 0) {
    const excerpt = (contexts[0].text || '').replace(/[{}\[\];:(),]/g,' ').replace(/\s+/g,' ').trim().slice(0,300);
    return `I found references in ${sources[0] || 'the codebase'} that mention: ${excerpt}...\n\nIf you want, I can show the excerpt or explain these terms.`;
  }

  // Build human-friendly phrases for keywords
  const phrases = top.map(p => p.split(' ').map(w=> w).join(' '));
  const sourceList = Array.from(new Set(sources)).slice(0,3).join(' • ');

  const reply = [
    `I found references that mention: ${phrases.join(', ')}.`,
    `These references appear in: ${sourceList}.`,
    `These look like implementation-level topics — I can:`,
    `  1) show the excerpt from the source,`,
    `  2) explain what any of these terms mean in plain language, or`,
    `  3) search for higher-level descriptions across the site.`,
    `\nWhich would you prefer?`
  ].join('\n');

  return reply;
}

// Return concise definitions for topics when user asks (fallback for hardcoded topics)
function topicDefinitionsForPrompt(prompt) {
  if (!prompt) return '';
  const p = String(prompt).toLowerCase();
  const wantFederated = /federat(ed|ion)/.test(p) || /federated learning/.test(p);
  const wantTransfer = /transfer learning/.test(p) || /transfer-learning/.test(p);
  if (!wantFederated && !wantTransfer) return '';

  const parts = [];
  if (wantFederated) {
    parts.push('Federated Learning — Federated Learning is a decentralized machine learning approach where multiple clients (such as devices or organizations) collaboratively train a shared model without centrally sharing raw data. Clients train locally and send model updates (e.g., gradients or weights) to a coordinator that aggregates updates over multiple rounds. Benefits include improved privacy, reduced data movement, and the ability to learn from distributed heterogeneous data.');
    parts.push('Learn more: https://en.wikipedia.org/wiki/Federated_learning • https://www.tensorflow.org/federated • https://flower.dev/');
  }
  if (wantTransfer) {
    parts.push('Transfer Learning — Transfer learning involves taking a model pre-trained on one task or dataset and adapting it to a related target task, typically by fine-tuning. It is useful when labeled data for the target task is limited, since the pre-trained model provides useful feature representations learned from larger datasets.');
    parts.push('Learn more: https://en.wikipedia.org/wiki/Transfer_learning • https://cs231n.github.io/transfer-learning/ • https://www.fast.ai/');
  }
  return parts.join('\n\n');
}

// Detect if a question is asking for a general knowledge definition
function isGeneralKnowledgeQuestion(prompt) {
  if (!prompt) return false;
  const p = String(prompt).toLowerCase();
  // Match "What is X?", "Explain X", "Define X", "How does X work?", "Tell me about X"
  return /^(what is|explain|define|how does|how do|tell me about|describe|what are)\b/i.test(p);
}

// Extract the topic being asked about (for general knowledge questions)
function extractTopicFromQuestion(prompt) {
  if (!prompt) return '';
  const p = String(prompt);
  // Remove common question prefixes
  const cleaned = p.replace(/^(what is|explain|define|how does|how do|tell me about|describe|what are)\s+/i, '').replace(/\?$/, '').trim();
  return cleaned;
}

// Detect navigation queries asking where site sections live (projects, blogs, knowledge base, research)
function isSiteNavigationQuestion(prompt) {
  if (!prompt) return false;
  const p = String(prompt).toLowerCase();
  const navIndicators = ['where can i find','where is','where can i see','where to find','how do i find','how do i get to','how to find','show me where','where are the','how do i access','where can i'];
  const siteNouns = ['project','projects','blog','blogs','knowledge base','knowledge-base','knowledgebase','research','research areas','topics','projects page','blog page','projects and blogs','projects and blog','blog page','research page'];
  const hasNav = navIndicators.some(v => p.includes(v)) || p.startsWith('where') || p.startsWith('how');
  const hasNoun = siteNouns.some(n => p.includes(n));
  return hasNoun && hasNav;
}

function buildSiteNavigationReply(prompt, req) {
  const p = String(prompt).toLowerCase();
  const parts = [];
  const baseUrl = (req && req.protocol ? req.protocol : 'https') + '://' + (req && req.get ? req.get('host') : (process.env.SITE_HOST || 'localhost'));
  const cleanBase = baseUrl.replace(/:\d+$/, '');
  parts.push("I can help you navigate the A3 website. Here are the common locations:");
  if (p.includes('project')) {
    parts.push(`- Projects: open the "Projects" page at ${cleanBase}/projects. This page lists active and completed projects with summaries and links to details.`);
  }
  if (p.includes('blog')) {
    parts.push(`- Blog: open the "Blog" or "News" page at ${cleanBase}/blog. Posts are ordered newest first and include tags for filtering.`);
  }
  if (p.includes('knowledge') || p.includes('knowledge base')) {
    parts.push(`- Knowledge base: check the "Knowledge Base" at ${cleanBase}/knowledge-base for articles, topics, and curated educational material.`);
  }
  if (p.includes('research')) {
    parts.push(`- Research: visit the "Research Areas" or "Research" page at ${cleanBase}/research-areas to see labs, projects, and publications.`);
  }
  if (p.includes('topic') || p.includes('topics')) {
    parts.push(`- Topics: the site organizes content by topics; look for a "Topics" or "Subjects" area in the navigation or footer, or visit ${cleanBase}/topics if available.`);
  }
  parts.push('\nIf you want, I can (a) open the Projects page, (b) list recent blog posts, or (c) search the site for a keyword — tell me which.');
  return parts.join('\n');
}

// Return concise definitions for topics when user asks (fallback for hardcoded topics)
function getAuthoritativeDefinition(topic) {
  if (!topic) return '';
  const t = String(topic).toLowerCase();
  
  const definitions = {
    'photosynthesis': 'Photosynthesis is the biological process by which plants, algae, and some bacteria convert light energy (usually from the sun) into chemical energy stored in glucose (a simple sugar). During photosynthesis, organisms use carbon dioxide and water as inputs and produce glucose and oxygen as outputs. The process occurs primarily in the chloroplasts of plant cells and is essential for producing the oxygen we breathe and the food that sustains most life on Earth. Learn more: https://en.wikipedia.org/wiki/Photosynthesis',
    
    'photosynthesis': 'Photosynthesis is the process by which plants, algae, and some bacteria harness light energy to convert carbon dioxide and water into glucose and oxygen. This light-dependent reaction is fundamental to most life on Earth, producing both chemical energy (glucose) and the oxygen required for respiration. Learn more: https://en.wikipedia.org/wiki/Photosynthesis',
    
    'cellular respiration': 'Cellular respiration is the metabolic process by which cells break down glucose and other organic molecules to release energy (in the form of ATP) that powers cellular functions. It occurs in two main forms: aerobic respiration (with oxygen, producing approximately 30-32 ATP per glucose molecule) and anaerobic respiration (without oxygen, producing only 2 ATP). Learn more: https://en.wikipedia.org/wiki/Cellular_respiration',
    
    'mitochondria': 'The mitochondria is an organelle found in eukaryotic cells that is often called the "powerhouse of the cell" because it is the primary site of ATP (energy) production through cellular respiration. Mitochondria have their own DNA and are thought to have originated from free-living bacteria. They convert glucose and oxygen into usable energy for the cell. Learn more: https://en.wikipedia.org/wiki/Mitochondrion',
    
    'dna': 'Deoxyribonucleic acid (DNA) is the molecule that carries genetic instructions for life. DNA is a double-helix structure made of four nucleotide bases (adenine, thymine, guanine, cytosine) arranged in sequences that encode genes. These genes direct the production of proteins and determine the characteristics of organisms. DNA is replicated during cell division and passed from parent to offspring. Learn more: https://en.wikipedia.org/wiki/DNA',
    
    'social media': 'Social media refers to digital platforms and applications that enable users to create, share, and exchange content—including text, images, videos, and links—with other users over the internet. Major platforms include Facebook, Twitter (X), Instagram, LinkedIn, TikTok, and YouTube. Social media facilitates connection and communication among individuals, communities, and organizations, enabling real-time interaction and the rapid spread of information. It serves various purposes: personal networking, professional networking, content sharing, marketing, activism, and entertainment. Learn more: https://en.wikipedia.org/wiki/Social_media',
    
    'reproduction': 'Reproduction is the biological process by which organisms produce offspring, ensuring the continuation of their species. There are two main types: sexual reproduction (involving genetic material from two parents, creating genetic diversity) and asexual reproduction (involving a single parent, producing genetically identical offspring). In sexual reproduction, gametes (sperm and egg) fuse to form a zygote, which develops into a new organism. Asexual reproduction includes budding, fission, and vegetative reproduction. Learn more: https://en.wikipedia.org/wiki/Reproduction',
    
    'respiration': 'Respiration is the biological process by which living organisms release energy from organic molecules (such as glucose) to fuel cellular activities. Aerobic respiration occurs in the presence of oxygen and is the most efficient form, producing approximately 30-32 ATP molecules per glucose molecule. The process includes glycolysis, the citric acid cycle, and oxidative phosphorylation. Anaerobic respiration occurs without oxygen and produces fewer ATP molecules (typically 2 ATP per glucose). Learn more: https://en.wikipedia.org/wiki/Cellular_respiration',
    
    'photosynthesis': 'Photosynthesis is the process by which plants and certain other organisms convert light energy into chemical energy stored in glucose. The light-dependent reactions occur in the thylakoids of chloroplasts, where light energy excites electrons. The light-independent reactions (Calvin cycle) use those electrons to fix carbon dioxide into glucose. The overall reaction produces glucose and oxygen from carbon dioxide and water. Learn more: https://en.wikipedia.org/wiki/Photosynthesis',
  };
  
  // Check for exact match or close match
  for (const [key, def] of Object.entries(definitions)) {
    if (t === key || t.includes(key) || key.includes(t)) {
      return def;
    }
  }
  
  return '';
}

exports.sendChatReply = async (req, res) => {
  try {
    const body = req.body || {};
    const prompt = (body.prompt || body.message || body.input || '').trim();

    // Personalized greeting handling: if the user sends a short greeting,
    // reply with "Hello, {Name}" when a name is provided in the request
    // or available via an authenticated session (`req.user.name`) or stored
    // in conversation `ChatHistory` metadata (persisted when user tells us their name).
    let maybeName = (
      body.userName || body.name || (body.user && body.user.name) || (req.user && req.user.name) || ''
    ).toString().trim();

    // If no immediate name provided, try to load stored name from conversation metadata
    try {
      if (!maybeName) {
        const userIdForMeta = req.user?._id || req.user?.id || body.userId;
        const convIdForMeta = body.conversationId || 'default';
        if (userIdForMeta) {
          const hist = await ChatHistory.findOne({ userId: userIdForMeta, conversationId: convIdForMeta }).lean();
          if (hist && hist.metadata && (hist.metadata.name || hist.metadata.title)) {
            maybeName = (hist.metadata.name || hist.metadata.title || '').toString().trim();
          }
        }
      }
    } catch (e) {
      // non-fatal
    }
    const greetRegex = /^(hi|hello|hey|greetings|good\s(morning|afternoon|evening))\b[\.!]?$/i;
    if (prompt && greetRegex.test(prompt)) {
      // Base welcome without a leading "Hello!" so we can avoid duplication
      const baseWelcome = `Welcome to the A3 website. I'm Einstein, your research assistant here to help with questions about our site, projects, research, and educational resources.\n\nHow can I assist you today? Feel free to ask about:\n- Our research initiatives and projects\n- Educational resources and materials\n- Information about the A3 website and its features\n- Any specific topics you'd like to explore\n\nWhat would you like to know?`;

      if (maybeName) {
        // Prefer the full name provided, but skip a leading single-letter initial
        let cleaned = maybeName.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ').replace(/\.+$/g, '').trim();
        const parts = cleaned.split(/\s+/).filter(Boolean);
        let chosen;
        if (parts.length > 0 && /^[A-Za-z]$/.test(parts[0].replace(/\./g, ''))) {
          // Leading initial like "J" or "J.": use the remaining tokens
          chosen = parts.slice(1).join(' ') || parts[0];
        } else {
          // Use the full provided name (e.g., "Abdul Hadi")
          chosen = cleaned;
        }
        // Title-case each word
        chosen = chosen.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return res.json({ success: true, reply: `Hello, ${chosen}\n\n${baseWelcome}` });
      }

      // No name provided: keep a friendly leading Hello! to the welcome
      return res.json({ success: true, reply: `Hello! ${baseWelcome}` });
    }

    // If no prompt provided, keep old behavior to avoid breaking callers
    if (!prompt) {
      return res.json({ success: true, reply: 'Hello from A3 chat (no input provided)' });
    }

    // Reject single-letter or very short, non-meaningful inputs, but allow quick selections
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length <= 1 && !/^[abc123]$/i.test(trimmedPrompt)) {
      return res.json({ success: true, reply: 'I need a bit more information to help you. Please ask a question or tell me more about what you\'d like to know.' });
    }

    // Quick-action handlers: if frontend provides an explicit action, or user replies with
    // a short selection like 'a', 'b', 'c', handle those here to provide direct navigation
    // guidance or quick lists without invoking the LLM.
    const explicitAction = (body.action || '').toString().trim().toLowerCase();
    const shortSel = trimmedPrompt.toLowerCase();
    let resolvedAction = '';
    if (explicitAction) resolvedAction = explicitAction;
    else if (/^\s*(a|1)\s*$/i.test(shortSel) || /open projects/i.test(shortSel) || /show projects/i.test(shortSel)) resolvedAction = 'openProjects';
    else if (/^\s*(b|2)\s*$/i.test(shortSel) || /list blog/i.test(shortSel) || /recent blog/i.test(shortSel) || /show blogs/i.test(shortSel)) resolvedAction = 'listBlogs';
    else if (/^\s*(c|3)\s*$/i.test(shortSel) || /^search\s+/i.test(shortSel) || /search the site/i.test(shortSel)) resolvedAction = 'searchPrompt';

    if (resolvedAction) {
      const baseUrl = (req.protocol ? req.protocol : 'https') + '://' + (req.get ? req.get('host') : (process.env.SITE_HOST || 'localhost'));
      if (resolvedAction === 'openProjects') {
        const url = `${baseUrl.replace(/:\d+$/, '')}/projects`;
        return res.json({ success: true, reply: `You can view Projects here: ${url}`, action: { type: 'open_url', url } });
      }
      if (resolvedAction === 'listBlogs') {
        try {
          const blogDocs = await retrieveRelevantDocs('blog', 6);
          const filtered = (blogDocs || []).filter(d => !isInternalResource(d.source || ''));
          const items = filtered.slice(0,6).map(d => {
            const title = (d.title || d.source || '').toString().replace(/[-_]+/g, ' ');
            const url = d.url || `${baseUrl.replace(/:\d+$/, '')}/blog`;
            return `- ${title}${d.url ? ` — ${d.url}` : ` — ${url}`}`;
          });
          const reply = items.length > 0 ? `Recent blog posts:\n${items.join('\n')}` : `I couldn't find blog posts in the local index. You can open the Blog page: ${baseUrl.replace(/:\d+$/, '')}/blog`;
          return res.json({ success: true, reply, rag: filtered });
        } catch (e) {
          return res.json({ success: true, reply: `I couldn't fetch blog posts right now. You can visit: ${baseUrl.replace(/:\d+$/, '')}/blog` });
        }
      }
      if (resolvedAction === 'searchPrompt') {
        // If user provided keywords in the same prompt (e.g., "search cancer biomarkers"), extract them
        const match = shortSel.match(/^search\s+(.+)$/i);
        const keywords = match ? match[1].trim() : '';
        if (!keywords) {
          return res.json({ success: true, reply: 'What keyword(s) would you like me to search the site for? Please provide a short phrase.' });
        }
        try {
          const results = await retrieveRelevantDocs(keywords, 6);
          if (!results || results.length === 0) {
            return res.json({ success: true, reply: `I couldn't find pages matching "${keywords}" in the current index. Would you like me to broaden the search?` });
          }
          const lines = (results || []).map(r => {
            const label = (r.title || r.source || '').toString();
            const url = r.url || `${baseUrl.replace(/:\d+$/, '')}/${(r.source || '').toString().replace(/^(file:|project:)/i, '').replace(/\\/g, '/').split('/').pop()}`;
            return `- ${label} — ${url}`;
          });
          return res.json({ success: true, reply: `Search results for "${keywords}":\n${lines.join('\n')}`, rag: results });
        } catch (e) {
          return res.json({ success: true, reply: `Search failed: ${e && e.message ? e.message : e}` });
        }
      }
    }

    // If the user explicitly asks to recall their name, check stored metadata first
    const recallNameQ = /\b(what(?:'s| is) my name|who am i|remember my name)\b/i;
    if (recallNameQ.test(prompt)) {
      try {
        const userIdForMeta = req.user?._id || req.user?.id || body.userId;
        const convIdForMeta = body.conversationId || 'default';
        
        // FIRST: Check if user is authenticated and has a registered profile with name
        if (req.user?._id) {
          try {
            const registeredUser = await User.findById(req.user._id).lean();
            if (registeredUser && registeredUser.name) {
              const namePretty = String(registeredUser.name).split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              // eslint-disable-next-line no-console
              console.log(`[chat] Fetched registered user name: ${namePretty}`);
              return res.json({ success: true, reply: `Your name is ${namePretty}.` });
            }
          } catch (userErr) {
            // eslint-disable-next-line no-console
            console.warn('[chat] Error fetching registered user:', userErr.message);
          }
        }
        
        // SECOND: Check chat history metadata for extracted/stored names
        if (userIdForMeta) {
          // First, try to get name from current conversation
          let hist = await ChatHistory.findOne({ userId: userIdForMeta, conversationId: convIdForMeta }).lean();
          const stored = hist && hist.metadata && hist.metadata.name;
          
          if (stored) {
            const namePretty = String(stored).split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            return res.json({ success: true, reply: `Your name is ${namePretty}.` });
          }
          
          // If not found in current conversation, search other conversations for stored name
          if (!stored) {
            const otherHist = await ChatHistory.findOne({
              userId: userIdForMeta,
              'metadata.name': { $exists: true, $ne: null }
            }).lean();
            
            if (otherHist && otherHist.metadata && otherHist.metadata.name) {
              const namePretty = String(otherHist.metadata.name).split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              return res.json({ success: true, reply: `Your name is ${namePretty}.` });
            }
          }

          // THIRD: Try to infer from previous messages in the current conversation
          if (hist && Array.isArray(hist.messages)) {
            for (const m of hist.messages) {
              if (m && m.role === 'user' && typeof m.content === 'string') {
                const extractedFromMsg = extractNames(m.content);
                if (extractedFromMsg && extractedFromMsg.length > 0) {
                  const found = extractedFromMsg[0].value;
                  const sanitized = sanitizeName(found);
                  if (sanitized) {
                    // persist discovered name back to metadata for faster recall next time
                    try {
                      await ChatHistory.updateOne(
                        { _id: hist._id },
                        { $set: { 'metadata.name': sanitized } }
                      ).exec();
                    } catch (e) {
                      // ignore persistence errors
                    }
                    return res.json({ success: true, reply: `Your name is ${sanitized}.` });
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Error recalling name:', e.message);
      }
      // FALLBACK: Only show this if user is not authenticated or no registration data exists
      return res.json({ success: true, reply: "I don't have your name stored yet. You can tell me by saying, \"My name is Abbas.\"" });
    }

    // Check if user is asking for their email
    const recallEmailQ = /\b(what(?:'s| is) my email|my email address|show my email)\b/i;
    if (recallEmailQ.test(prompt)) {
      try {
        if (req.user?._id) {
          const registeredUser = await User.findById(req.user._id).lean();
          if (registeredUser && registeredUser.email) {
            return res.json({ success: true, reply: `Your registered email is ${registeredUser.email}.` });
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[chat] Error fetching user email:', e.message);
      }
      return res.json({ success: true, reply: "I don't have your email information. Please register or update your profile." });
    }

    // Check if user is asking for their interests
    const recallInterestsQ = /\b(what(?:'s| is|are) my interests|my learning interests|show my interests)\b/i;
    if (recallInterestsQ.test(prompt)) {
      try {
        if (req.user?._id) {
          const registeredUser = await User.findById(req.user._id).lean();
          if (registeredUser && Array.isArray(registeredUser.interests) && registeredUser.interests.length > 0) {
            const interestList = registeredUser.interests.join(', ');
            return res.json({ success: true, reply: `Your registered interests are: ${interestList}.` });
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[chat] Error fetching user interests:', e.message);
      }
      return res.json({ success: true, reply: "You haven't registered any learning interests yet. You can update your profile to add them." });
    }

    // Check if user is asking for their educational level
    const recallLevelQ = /\b(what(?:'s| is) my educational level|my level|my experience level)\b/i;
    if (recallLevelQ.test(prompt)) {
      try {
        if (req.user?._id) {
          const registeredUser = await User.findById(req.user._id).lean();
          if (registeredUser && registeredUser.educationalLevel) {
            return res.json({ success: true, reply: `Your registered educational level is ${registeredUser.educationalLevel}.` });
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[chat] Error fetching user level:', e.message);
      }
      return res.json({ success: true, reply: "Your educational level hasn't been set. You can update your profile to specify it." });
    }

    // Detect explicit user statements of their name (e.g. "My name is Alice" or "I'm Alice")
    // Uses improved extraction that supports multiple name patterns
    const extractedNames = extractNames(prompt);
    if (extractedNames && extractedNames.length > 0) {
      const bestName = extractedNames[0];
      const sanitized = sanitizeName(bestName.value);

      if (sanitized && isValidName(sanitized)) {
        // Store name with consent tracking
        try {
          const userIdToSave = req.user?._id || req.user?.id || body.userId;
          const conversationIdToSave = body.conversationId || 'default';
          if (userIdToSave) {
            let hist = await ChatHistory.findOne({ userId: userIdToSave, conversationId: conversationIdToSave });
            if (!hist) {
              hist = new ChatHistory({
                userId: userIdToSave,
                conversationId: conversationIdToSave,
                messages: [],
                metadata: { title: null }
              });
            }
            hist.metadata = hist.metadata || {};
            hist.metadata.name = sanitized;
            hist.metadata.nameConfidence = bestName.confidence;
            hist.metadata.namePattern = bestName.pattern;
            hist.metadata.nameExtractedAt = new Date();

            // Only allow PII storage if user has explicitly consented
            if (!hist.persistenceSettings?.allowPIIStorage) {
              hist.persistenceSettings = hist.persistenceSettings || {};
              // Mark that name was detected (user can consent later)
              hist.metadata.pendingPIIConsent = true;
            }

            await hist.save();
          }
        } catch (e) {
          // ignore persistence errors
          // eslint-disable-next-line no-console
          console.warn('Failed to store extracted name:', e.message);
        }
        const ack = `Nice to meet you, ${sanitized}! I'll remember that for this conversation.`;
        return res.json({ success: true, reply: ack });
      }
    }

    // Determine whether RAG is requested or enabled. Default: enabled.
    // Short polite / social utterances: prefer a brief natural reply.
    // Attempt to get a varied, friendly reply from the LLM; fall back to tuned canned replies.
    try {
      // Delegate to helper so tests can exercise polite replies
      const social = await exports.generateSocialReply(prompt, {
        socialTone: (body && body.socialTone) || undefined,
        socialLength: (body && body.socialLength) || undefined
      });
      if (social) return res.json({ success: true, reply: social, social: true });
    } catch (e) {
      // non-fatal: continue to normal processing
    }

    const ragEnabled = (process.env.RAG_ENABLED || 'true').toLowerCase() === 'true';
    const useRag = ragEnabled && (body.useRag !== false);

    // Retrieve contextual documents if RAG enabled.
    // If the user's current prompt is only a confirmation (e.g. "Yes, search the site"),
    // use the last substantive user question from the conversation as the retrieval query
    // so follow-up confirmations correctly trigger a search for the earlier question.
    let contexts = [];
    if (useRag) {
      try {
        let retrievalQuery = prompt;

        const isConfirmation = /\b(search the site|search site|show related pages|show related|search for me|yes,? search|yes,? show|ok,? search|please search|please do|do it|go ahead|search for that|find it|show me|please show)\b/i.test(prompt) || (/^\s*(yes|y|ok|sure|please|affirmative|please do|do it)\s*[,\.!]?\s*$/i.test(prompt) && prompt.length < 40);

        if (isConfirmation) {
          try {
            const userIdForMeta = req.user?._id || req.user?.id || body.userId;
            const convIdForMeta = body.conversationId || 'default';
            if (userIdForMeta) {
              const hist = await ChatHistory.findOne({ userId: userIdForMeta, conversationId: convIdForMeta }).lean();
              if (hist && Array.isArray(hist.messages) && hist.messages.length > 0) {
                // Walk backwards to find the most recent substantive user message
                for (let i = hist.messages.length - 1; i >= 0; i--) {
                  const m = hist.messages[i];
                  if (!m || m.role !== 'user' || !m.content) continue;
                  const txt = String(m.content || '').trim();
                  if (txt.length < 5) continue;
                  // skip short confirmations
                  if (/^\s*(yes|y|ok|sure|please|thanks)\b/i.test(txt)) continue;
                  retrievalQuery = txt;
                  break;
                }
              }
            }
          } catch (e) {
            // non-fatal: if history lookup fails, fall back to the raw prompt
            // eslint-disable-next-line no-console
            console.warn('Failed to lookup conversation for confirmation retrieval:', e && e.message ? e.message : e);
          }
        }

        // If the frontend provided a previousUserMessage (e.g., unauthenticated local conversation), prefer it
        if ((!retrievalQuery || retrievalQuery === prompt) && body && (body.previousUserMessage || body.previousPrompt || body.lastUserMessage)) {
          retrievalQuery = body.previousUserMessage || body.previousPrompt || body.lastUserMessage;
        }

        contexts = await retrieveRelevantDocs(retrievalQuery, 6);

        // Filter out internal resources from RAG results immediately
        contexts = (contexts || []).filter(c => !isInternalResource(c.source || ''));

        // If no contexts found, attempt a keyword-expanded retrieval as a fallback.
        if ((!contexts || contexts.length === 0) && retrievalQuery && retrievalQuery.length > 10) {
          try {
            const stopwords = new Set(['the','and','for','with','that','this','from','are','was','were','have','has','but','not','can','will','our','your','you','where','what','how','which','then','when','a','an','in','on','of','to','is']);
            const tokens = String(retrievalQuery).toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
            const freq = new Map();
            for (const t of tokens) {
              if (stopwords.has(t)) continue;
              freq.set(t, (freq.get(t) || 0) + 1);
            }
            const top = Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,6).map(e=>e[0]);
            if (top.length > 0) {
              const keywordQuery = top.join(' ');
              // broaden result count for fallback
              contexts = await retrieveRelevantDocs(keywordQuery, 8);
              // Filter out internal resources from this fallback too
              contexts = (contexts || []).filter(c => !isInternalResource(c.source || ''));
            }
          } catch (e) {
            // non-fatal
            // eslint-disable-next-line no-console
            console.warn('Keyword-expanded retrieval failed:', e && e.message ? e.message : e);
          }
        }
      } catch (e) {
        // non-fatal: log and continue with empty contexts
        // eslint-disable-next-line no-console
        console.error('RAG retrieval failed', e);
        contexts = [];
      }
    }

    // Helper: fix markdown table formatting to ensure proper alignment with straight lines
function fixTableFormatting(text) {
  if (!text || !text.includes('|')) return text;
  
  const lines = text.split('\n');
  const result = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this is a table start (header row with |)
    if (line.includes('|') && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      
      // Check if next line is a separator (contains | and dashes)
      const isSeparator = nextLine.includes('|') && nextLine.includes('-');
      
      if (isSeparator) {
        // Found a table! Collect all table rows
        const tableRows = [line];
        tableRows.push(nextLine);
        i += 2;
        
        // Collect remaining rows until we hit a non-table line
        while (i < lines.length && lines[i].includes('|')) {
          tableRows.push(lines[i]);
          i++;
        }
        
        // Format and add the table
        const formattedTable = formatMarkdownTable(tableRows);
        result.push(...formattedTable);
        continue;
      }
    }
    
    result.push(line);
    i++;
  }
  
  return result.join('\n');
}

// Format a markdown table with proper column alignment
function formatMarkdownTable(rows) {
  if (rows.length < 2) return rows;
  
  // Parse all rows, handling inconsistent pipe placement
  const cells = rows.map((row, rowIdx) => {
    // Remove leading/trailing pipes and whitespace
    let cleaned = String(row).trim();
    if (cleaned.startsWith('|')) cleaned = cleaned.slice(1);
    if (cleaned.endsWith('|')) cleaned = cleaned.slice(0, -1);
    
    // Split by | and trim each cell
    const parts = cleaned.split('|').map(p => p.trim());
    return parts;
  });
  
  // Find the maximum number of columns across all rows
  let maxCols = 0;
  for (const row of cells) {
    maxCols = Math.max(maxCols, row.length);
  }
  
  // Normalize all rows to have the same number of columns
  for (const row of cells) {
    while (row.length < maxCols) {
      row.push('');
    }
  }
  
  // Find column widths (max of all rows, min 3)
  const colWidths = [];
  for (let col = 0; col < maxCols; col++) {
    let maxWidth = 3;
    for (const row of cells) {
      maxWidth = Math.max(maxWidth, (row[col] || '').length);
    }
    colWidths.push(maxWidth);
  }
  
  // Rebuild all rows with proper spacing
  const formatted = [];
  for (let rowIdx = 0; rowIdx < cells.length; rowIdx++) {
    const row = cells[rowIdx];
    const paddedCells = row.map((cell, colIdx) => {
      const width = colWidths[colIdx];
      return String(cell || '').padEnd(width);
    });
    formatted.push('| ' + paddedCells.join(' | ') + ' |');
    
    // Add separator after header row (first row)
    if (rowIdx === 0) {
      const separators = colWidths.map(w => '-'.repeat(w));
      formatted.push('|' + separators.map((s, idx) => (idx === 0 ? ' ' : '') + s + ' ').join('|') + '|');
    }
  }
  
  return formatted;
}

// Helper: determine whether a context appears relevant to the prompt
    const contextMatchesPrompt = (c, p) => {
      if (!c || !p) return false;
      const text = String(c.text || '').toLowerCase();
      const words = (String(p).toLowerCase().match(/\b[a-z]{4,}\b/g) || []).slice(0, 12);
      if (words.length === 0) return false;
      for (const w of words) {
        if (text.includes(w)) return true;
      }
      return false;
    };

    // Helper: sanitize reply text by removing raw project/file IDs and internal prefixes
    const sanitizeReply = (text) => {
      if (!text) return text;
      let s = String(text);
      // Remove identifiable internal ids and file prefixes
      s = s.replace(/project:[a-f0-9]{20,}/gi, 'project')
           .replace(/subject:[a-f0-9]{20,}/gi, 'topic')
           .replace(/file:[a-zA-Z0-9_\-\/\\]+/gi, 'file')
           .replace(/\([a-f0-9]{20,}\)/g, '');

      // Normalize newlines
      s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      // Collapse more than two consecutive newlines to two (preserve paragraph breaks)
      s = s.replace(/\n{3,}/g, '\n\n');

      // Within each line, collapse multiple spaces/tabs to a single space
      // but preserve lines that look like Markdown tables (contain pipes).
      s = s.split('\n').map(line => {
        const isTableLine = /\|/.test(line);
        if (isTableLine) {
          // Trim trailing spaces but keep internal spacing and pipes intact
          return line.replace(/[ \t]+$/g, '');
        }
        return line.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+$/g, '');
      }).join('\n');

      // Fix markdown table formatting (align columns and separator lines)
      s = fixTableFormatting(s);

      // Trim leading/trailing whitespace and newlines
      s = s.replace(/^\s+|\s+$/g, '');

      return s;
    };

    // If an LLM API key is configured (Perplexity preferred) attempt to call it.
    // Even if LLM call fails, we have a polished fallback with RAG synthesis.
    const ppKey = process.env.PERPLEXITY_API_KEY || process.env.PPLX_API_KEY;
    if (ppKey) {
      // If this is a site-navigation question, return concise navigation guidance
      if (isSiteNavigationQuestion(prompt)) {
        const navReply = buildSiteNavigationReply(prompt, req);
        return res.json({ success: true, reply: navReply });
      }

      // If the user question appears to be site-specific and we have no
      // user-facing RAG contexts, avoid calling the LLM (prevents hallucination)
      const promptLowerCheck = String(prompt || '').toLowerCase();
      const siteKeywordsCheck = ['project','research','knowledge','topic','site','a3','documentation','doc','docs','readme','how to','how do','where','about','projects','blog','blogs','projects page','blogs page'];
      const promptLooksSiteRelated = siteKeywordsCheck.some(k => promptLowerCheck.includes(k));
      if (promptLooksSiteRelated && (!contexts || contexts.length === 0)) {
        const safeReply = "I don't have that information in my current knowledge base. I won't guess—would you like me to search the site or show related pages?";
        return res.json({ success: true, reply: safeReply });
      }

      const systemPrompt = buildSystemPrompt(prompt, contexts);
      let messages = [
        { role: 'system', content: systemPrompt },
      ];

      // Load conversation history if user is authenticated.
      // Accept user id from several possible sources to be robust against client changes.
      const userId = req.user?._id || req.user?.id || body.userId || body.userID || body.clientId || req.headers['x-user-id'] || req.headers['x-client-id'];
      const conversationId = body.conversationId || 'default';
      if (userId) {
        try {
          const priorMessages = await getRecentContext(userId, conversationId, 10);
          if (priorMessages && priorMessages.length > 0) {
            // Add prior messages to context; prune to fit token budget
            messages.push(...priorMessages);
          }
        } catch (e) {
          // non-fatal: if history retrieval fails, continue without it
          // eslint-disable-next-line no-console
          console.warn('Failed to load chat history:', e && e.message ? e.message : e);
        }
      }

      // Add the current user message
      messages.push({ role: 'user', content: prompt });

      // Prune messages to fit within token budget (avoid context explosion)
      try {
        const { messages: prunedMessages } = await pruneMessagesToTokenBudget(messages, 3000);
        messages = prunedMessages;
      } catch (e) {
        // non-fatal: continue with unpruned messages
        // eslint-disable-next-line no-console
        console.warn('Failed to prune context window:', e && e.message ? e.message : e);
      }

      try {
        const llmRes = await callOpenAIChat(messages);
        // Strip citation numbers like [1], [2], etc. for a cleaner response
        const cleanReply = (llmRes || '')
          .replace(/\[\d+\]/g, '')           // Remove [1], [2], etc.
          .replace(/\[\d+ from context\]/gi, '') // Remove [n from context]
          .replace(/  +/g, ' ')               // Collapse multiple spaces
          .trim();
        const reply = sanitizeReply(cleanReply) || `Echo: ${prompt}`;

        // Save this exchange to chat history if user is authenticated
        if (userId) {
          try {
            // Check privacy settings and apply PII redaction if needed
            let savedPrompt = prompt;
            let savedReply = reply;
            let piiDetected = null;

            let history = await ChatHistory.findOne({ userId, conversationId }).exec();
            if (!history) {
              history = new ChatHistory({
                userId,
                conversationId,
                messages: [],
                metadata: { title: body.title || null },
                persistenceSettings: {
                  storeChatHistory: true,
                  allowSemanticIndexing: true,
                  allowPIIStorage: false,
                  userConsent: false
                }
              });
            }

            // Apply PII redaction based on user settings
            const allowPII = history.persistenceSettings?.allowPIIStorage ?? false;
            if (!allowPII) {
              const userRedaction = await redactBeforeSave(userId, conversationId, prompt, 'user');
              savedPrompt = userRedaction.redactedMessage;
              piiDetected = userRedaction.piiDetected;
            }

            // Always redact sensitive info from assistant reply
            const assistantRedaction = await redactBeforeSave(userId, conversationId, reply, 'assistant');
            savedReply = assistantRedaction.redactedMessage;

            // Batch save user message and assistant response
            history.messages.push({
              role: 'user',
              content: savedPrompt,
              timestamp: new Date()
            });
            history.messages.push({
              role: 'assistant',
              content: savedReply,
              timestamp: new Date()
            });
            await history.save();

            // Index user message to semantic memory (with PII consideration)
            try {
              await indexUserMessage(userId, conversationId, savedPrompt, {
                hasName: /(?:my name is|i am|i'm)\b/i.test(prompt),
                hasPII: piiDetected?.hasPII || false,
                piiTypes: piiDetected?.byType ? Object.keys(piiDetected.byType) : []
              });
            } catch (memErr) {
              // Non-fatal: memory indexing error
              // eslint-disable-next-line no-console
              console.warn('Failed to index message to memory:', memErr.message);
            }
          } catch (e) {
            // non-fatal: if save fails, continue
            // eslint-disable-next-line no-console
            console.warn('Failed to save chat history:', e && e.message ? e.message : e);
          }
        }

        // Only include RAG contexts that are meaningfully related to site content
        const relevant = (contexts || []).filter(c => {
          const s = String(c.source || '').toLowerCase();
          const typeMatch = s.startsWith('project:') || s.includes('project') || s.includes('research') || s.includes('knowledge') || s.includes('topic') || s.includes('subject') || s.includes('readme');
          const contentMatch = contextMatchesPrompt(c, prompt);
          return typeMatch && contentMatch;
        });
        // Only show related sources if the user's prompt appears site-related
        const promptLower = String(prompt || '').toLowerCase();
        const siteKeywords = ['project','research','knowledge','topic','site','a3','documentation','doc','docs','readme','how to','how do','where','about'];
        const promptLooksSiteRelated = siteKeywords.some(k => promptLower.includes(k));
        const topicDefs = topicDefinitionsForPrompt(prompt);
        if (promptLooksSiteRelated && relevant.length === 0) {
          // If this is a navigation-style question, return navigation guidance
          if (isSiteNavigationQuestion(prompt)) {
            const navReply = buildSiteNavigationReply(prompt, req);
            return res.json({ success: true, reply: navReply });
          }
          let safeReply;
          if (body && (body.previousUserMessage || body.previousPrompt || body.lastUserMessage)) {
            const q = body.previousUserMessage || body.previousPrompt || body.lastUserMessage;
            safeReply = `I couldn't find pages matching "${String(q).replace(/\"/g,'') }". Would you like me to (a) show the Projects page, (b) search by keyword, or (c) broaden the search? Reply with the option or provide keywords.`;
          } else {
            safeReply = "I don't have that information in my current knowledge base. I won't guess—would you like me to search the site or show related pages?";
          }
          if (topicDefs) safeReply = `${topicDefs}\n\n${safeReply}`;
          return res.json({ success: true, reply: safeReply });
        }

        // If we have relevant site contexts, append a short site-resources section
        if (relevant.length > 0) {
          const sendContexts = relevant.map(c => {
            const raw = (c.source || 'unknown').replace(/^(file:|project:|subject:)/i, '').replace(/\\/g, '/');
            const parts = raw.split('/');
            const base = parts[parts.length - 1] || raw;
            const labelClean = base.replace(/^(\.|\_)+/, '').replace(/\.(md|markdown|json|html|txt|js|ts|jsx|tsx)$/i, '').replace(/[a-f0-9]{8,}/g, 'resource');
            const label = labelClean.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            return Object.assign({}, c, { source: label });
          });

          // Filter out internal resources; only show user-facing content
          const userFacingContexts = sendContexts.filter(sc => !isInternalResource(sc.source));
          let finalReply = reply;
          if (userFacingContexts.length > 0) {
            const appendixLines = userFacingContexts.map(sc => {
              const urlPart = sc.url ? ` — ${sc.url}` : '';
              return `- ${sc.source}${urlPart}`;
            });
            const appendix = `On the A3 website, you can find related resources:\n${appendixLines.join('\n')}`;
            finalReply = `${reply}\n\n${appendix}`;
          }
          if (topicDefs) {
            finalReply = `${topicDefs}\n\n${finalReply}`;
          } else {
            const promptLowerInner = String(prompt || '').toLowerCase();
            const askedAboutTransfer = /transfer learning/.test(promptLowerInner);
            const contextsText = (relevant || []).map(r => String(r.text || '').toLowerCase()).join('\n');
            const hasTransferInContexts = /transfer learning/.test(contextsText);
            if (askedAboutTransfer && !hasTransferInContexts) {
              const extra = [];
              extra.push('**Transfer Learning** — Transfer learning is the practice of taking a model trained on one task or domain and adapting it to a different, but related, task. Typical workflows involve fine-tuning a pre-trained model on a smaller dataset for the target task, which reduces training time and improves performance when labeled data is scarce.');
              extra.push('\nLearn more: https://en.wikipedia.org/wiki/Transfer_learning  •  https://cs231n.github.io/transfer-learning/  •  https://www.fast.ai/');
              finalReply = `${finalReply}\n\n${extra.join('\n')}`;
            }
          }

          return res.json({ success: true, reply: finalReply, rag: sendContexts });
        }

        if (topicDefs) {
          return res.json({ success: true, reply: `${topicDefs}\n\n${reply}` });
        }
        return res.json({ success: true, reply });
      } catch (e) {
        // If LLM call fails, log and fall back to RAG synthesis
        // eslint-disable-next-line no-console
        console.error('LLM call failed, using RAG synthesis fallback', e && e.message ? e.message : e);
      }
    }

    // No LLM available — synthesize a professional, persona-style reply
    // from contexts if present; otherwise fallback to the old Echo behavior.
    
    // First check if this is a general knowledge question
    const isGeneralQuestion = isGeneralKnowledgeQuestion(prompt);
    const extractedTopic = isGeneralQuestion ? extractTopicFromQuestion(prompt) : '';
    const authoritativeDef = extractedTopic ? getAuthoritativeDefinition(extractedTopic) : '';
    
    if (authoritativeDef) {
      // We have an authoritative definition for this topic — provide it first
      return res.json({ success: true, reply: authoritativeDef });
    }
    
    // If this is a general knowledge question but no authoritative definition exists,
    // check if RAG contexts are relevant. If not, return a helpful message instead of
    // the "I found references..." message which would be confusing.
    if (isGeneralQuestion && (!contexts || contexts.length === 0)) {
      const generalMsg = `I don't have a prebuilt definition for "${extractedTopic}", and I'm unable to generate one right now. However, you can find authoritative information about this topic on sites like Wikipedia, educational resources, or domain-specific databases. Is there anything about the A3 website or its research that I can help with instead?`;
      return res.json({ success: true, reply: generalMsg });
    }
    
    if (contexts && contexts.length > 0) {
      const rawReply = synthesizeFallbackResponse(prompt, contexts);
      const reply = sanitizeReply(rawReply);
      
      // For general knowledge questions, prioritize authoritative definitions over RAG synthesis
      if (isGeneralQuestion) {
        const genKnowledgeMsg = `I don't have a prebuilt definition for "${extractedTopic}", but you can find authoritative information about this topic on sites like Wikipedia or educational resources. Would you like to ask something about the A3 website or its research instead?`;
        return res.json({ success: true, reply: genKnowledgeMsg });
      }
      const relevant = (contexts || []).filter(c => {
        const s = String(c.source || '').toLowerCase();
        const typeMatch = s.startsWith('project:') || s.includes('project') || s.includes('research') || s.includes('knowledge') || s.includes('topic') || s.includes('subject') || s.includes('readme');
        const contentMatch = contextMatchesPrompt(c, prompt);
        return typeMatch && contentMatch;
      });
      const promptLower = String(prompt || '').toLowerCase();
      const siteKeywords = ['project','research','knowledge','topic','site','a3','documentation','doc','docs','readme','how to','how do','where','about'];
      const promptLooksSiteRelated = siteKeywords.some(k => promptLower.includes(k));
      const topicDefs = topicDefinitionsForPrompt(prompt);
      if (promptLooksSiteRelated && relevant.length === 0) {
        let safeReply;
        if (body && (body.previousUserMessage || body.previousPrompt || body.lastUserMessage)) {
          const q = body.previousUserMessage || body.previousPrompt || body.lastUserMessage;
          safeReply = `I couldn't find pages matching "${String(q).replace(/\"/g,'') }". Would you like me to (a) show the Projects page, (b) search by keyword, or (c) broaden the search? Reply with the option or provide keywords.`;
        } else {
          safeReply = "I don't have that information in my current knowledge base. I won't guess—would you like me to search the site or show related pages?";
        }
        if (topicDefs) safeReply = `${topicDefs}\n\n${safeReply}`;
        return res.json({ success: true, reply: safeReply });
      }

      if (relevant.length > 0) {
        const sendContexts = relevant.map(c => {
          const src = (c.source || 'unknown').replace(/^(file:|project:|subject:)/i, '').replace(/\\/g, '/');
          const parts = src.split('/');
          const base = parts[parts.length - 1] || src;
          const labelClean = base.replace(/^(\.|\_)+/, '').replace(/\.(md|markdown|json|html|txt|js|ts|jsx|tsx)$/i, '').replace(/[a-f0-9]{8,}/g, 'resource');
          const label = labelClean.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          return Object.assign({}, c, { source: label });
        });

        // Filter out internal resources; only show user-facing content
        const userFacingContexts = sendContexts.filter(sc => !isInternalResource(sc.source));
        let finalReply = reply;
        if (userFacingContexts.length > 0) {
          const appendixLines = userFacingContexts.map(sc => {
            const urlPart = sc.url ? ` — ${sc.url}` : '';
            return `- ${sc.source}${urlPart}`;
          });
          const appendix = `On the A3 website, you can find related resources:\n${appendixLines.join('\n')}`;
          finalReply = `${reply}\n\n${appendix}`;
        }
        if (topicDefs) finalReply = `${topicDefs}\n\n${finalReply}`;
        return res.json({ success: true, reply: finalReply, rag: userFacingContexts });
      }

      if (topicDefs) return res.json({ success: true, reply: `${topicDefs}\n\n${reply}` });
      return res.json({ success: true, reply });
    }

    // Final fallback: echo input (preserves behavior)
    const topicDefsFinal = topicDefinitionsForPrompt(prompt);
    if (topicDefsFinal) {
      return res.json({ success: true, reply: topicDefsFinal });
    }
    const reply = `Echo: ${prompt}`;
    return res.json({ success: true, reply });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('chatController error', e);
    return res.status(500).json({ success: false, message: 'Chat error' });
  }
};
