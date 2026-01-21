import { marked } from 'marked';

// Custom markdown extensions for superscript and subscript
const superscript = {
  name: 'superscript',
  level: 'inline' as 'inline',
  tokenizer(src: string) {
    const match = src.match(/^\^(.+?)\^/);
    if (match) {
      return {
        type: 'superscript',
        raw: match[0],
        text: match[1],
        tokens: [],
      };
    }
  },
  renderer(token: { text: string }) {
    return `<sup>${token.text}</sup>`;
  },
};

const subscript = {
  name: 'subscript',
  level: 'inline' as 'inline',
  tokenizer(src: string) {
    const match = src.match(/^~([^~]+?)~/);
    if (match) {
      return {
        type: 'subscript',
        raw: match[0],
        text: match[1],
        tokens: [],
      };
    }
  },
  renderer(token: { text: string }) {
    return `<sub>${token.text}</sub>`;
  },
};

// Configure marked with custom extensions
marked.use({
  extensions: [superscript, subscript],
  breaks: true,
  gfm: true,
});

export default marked;
