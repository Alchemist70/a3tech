/**
 * Social media sharing utility functions
 * Provides platform-specific sharing with professional message composition
 */

export interface ShareOptions {
  title: string;
  url: string;
  text?: string;
}

/**
 * Generate a professional, generic share message
 */
export const generateShareMessage = (title: string, description?: string): string => {
  const message = `📚 ${title}`;
  if (description) {
    return `${message}\n${description.substring(0, 100)}...`;
  }
  return message;
};

/**
 * Generate platform-specific CTAs
 */
const getPlatformCTA = (platform: string): string => {
  const ctas: { [key: string]: string } = {
    whatsapp: 'Share on WhatsApp',
    facebook: 'Share on Facebook',
    twitter: 'Share on Twitter',
    linkedin: 'Share on LinkedIn',
    email: 'Share via Email',
  };
  return ctas[platform] || 'Share';
};

export const shareToSocialMedia = {
  whatsapp: (options: ShareOptions) => {
    // Professional message: Title + optional description + URL
    const body = options.text
      ? `📚 ${options.title}\n\n${options.text}\n\n${options.url}`
      : `📚 ${options.title}\n\n${options.url}`;
    const message = encodeURIComponent(body);
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
  },

  facebook: (options: ShareOptions) => {
    // Facebook handles preview from URL metadata
    const url = encodeURIComponent(options.url);
    const quote = options.text ? `${options.title} - ${options.text}` : options.title;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(quote)}`,
      '_blank',
      'noopener,noreferrer'
    );
  },

  twitter: (options: ShareOptions) => {
    // Professional tweet format with title and hashtag
    const tweetText = options.text
      ? `📚 ${options.title} - ${options.text} \n\n#learning #research`
      : `📚 ${options.title} \n\n#learning #research`;
    const text = encodeURIComponent(tweetText);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(options.url)}`, '_blank', 'noopener,noreferrer');
  },

  linkedin: (options: ShareOptions) => {
    // LinkedIn professional share
    const url = encodeURIComponent(options.url);
    const title = encodeURIComponent(`📚 ${options.title}`);
    const summary = options.text ? `&summary=${encodeURIComponent(options.text)}` : '';
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}${summary}`,
      '_blank',
      'noopener,noreferrer'
    );
  },

  email: (options: ShareOptions) => {
    // Email with subject and professional body
    const subject = encodeURIComponent(`Check out: ${options.title}`);
    const content = options.text ? `${options.title}\n\n${options.text}\n\n${options.url}` : `${options.title}\n\n${options.url}`;
    const body = encodeURIComponent(`Hi,\n\nI found this great article that you might enjoy:\n\n${content}\n\nHope you find it interesting!\n\nBest regards`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  },

  copyToClipboard: async (url: string, title?: string) => {
    try {
      // Copy URL with title context
      const textToCopy = title ? `${title}\n${url}` : url;
      await navigator.clipboard.writeText(textToCopy);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  },
};

export default shareToSocialMedia;
