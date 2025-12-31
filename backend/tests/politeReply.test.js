jest.mock('../services/llmClient', () => ({
  callOpenAIChat: jest.fn()
}));

jest.mock('../services/piiRedactionService', () => ({
  extractNames: () => [],
  isValidName: () => true,
  sanitizeName: (s) => s,
  getPIISummary: () => null
}));

const { callOpenAIChat } = require('../services/llmClient');
const chatController = require('../controllers/chatController');

describe('generateSocialReply', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses LLM reply when available', async () => {
    callOpenAIChat.mockResolvedValue('No problem — happy to help!');
    const r = await chatController.generateSocialReply('thanks');
    expect(callOpenAIChat).toHaveBeenCalled();
    expect(typeof r).toBe('string');
    expect(r.length).toBeGreaterThan(0);
  });

  test('falls back to canned reply when LLM fails', async () => {
    callOpenAIChat.mockRejectedValue(new Error('network'));
    const r = await chatController.generateSocialReply('thank you');
    // Should return a canned fallback string
    expect(r).toMatch(/welcome|help|happy|goodbye/i);
  });

  test('returns null for non-polite input', async () => {
    const r = await chatController.generateSocialReply('what is transfer learning?');
    expect(r).toBeNull();
  });
});
