import api from './index';

export async function sendMessage(message: string, conversationId: string = 'default', userId?: string, previousUserMessage?: string) {
  try {
    const headers: Record<string,string> = {};
    if (userId) headers['x-user-id'] = String(userId);
    const res = await api.post('/chat', { 
      message, 
      conversationId,
      ...(userId && { userId }),
      ...(previousUserMessage && { previousUserMessage })
    }, { headers });
    return res.data;
  } catch (err) {
    // If the backend is unavailable or call fails, return a safe canned reply
    // so the UI can show a helpful message instead of an error state.
    console.error('chat api error', err);
    return {
      success: false,
      reply: 'Sorry — the chat service is currently unavailable. You can still browse the site or visit the Contact page to get in touch.'
    };
  }
}

