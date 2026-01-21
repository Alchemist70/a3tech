const testCases = [
  'H^2^O',
  'CO^2^',
  'test ^superscript^ text',
  'H~2~SO~4~',
  'test ~subscript~ text',
  '**bold** and *italic*'
];

const processMarkdown = (content) => {
  if (!content) return '';
  try {
    let html = String(content);
    
    // Superscript: ^text^ -> <sup>text</sup>
    html = html.replace(/\^([^^]+)\^/g, '<sup>$1</sup>');
    
    // Subscript: ~text~ -> <sub>text</sub>
    html = html.replace(/~([^~]+)~/g, '<sub>$1</sub>');
    
    // Bold: **text** -> <strong>text</strong>
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic: *text* -> <em>text</em>
    html = html.replace(/\*([^*\n]+)\*/g, (match, p1) => {
      if (match.includes('**')) {
        return match;
      }
      return `<em>${p1}</em>`;
    });
    
    // Line breaks: \n -> <br/>
    html = html.replace(/\n/g, '<br/>');
    
    return html;
  } catch (e) {
    console.warn('Error processing markdown:', e);
    return content;
  }
};

testCases.forEach(test => {
  console.log(`Input: '${test}'`);
  console.log(`Output: '${processMarkdown(test)}'`);
  console.log('---');
});
