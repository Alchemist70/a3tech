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

const tests = [
  { input: 'H~2~O', expected: 'H<sub>2</sub>O', name: 'Simple subscript' },
  { input: 'H~2~SO~4~', expected: 'H<sub>2</sub>SO<sub>4</sub>', name: 'Multiple subscripts' },
  { input: 'x^2^+y^2^=z^2^', expected: 'x<sup>2</sup>+y<sup>2</sup>=z<sup>2</sup>', name: 'Multiple superscripts' },
  { input: '**H2SO4** is acidic', expected: '<strong>H2SO4</strong> is acidic', name: 'Bold with number' },
  { input: 'H~2~O\nH~2~SO~4~', expected: 'H<sub>2</sub>O<br/>H<sub>2</sub>SO<sub>4</sub>', name: 'With line break' },
];

console.log('=== PROCESSMARKDOWN FUNCTION TESTS ===\n');

tests.forEach(test => {
  const result = processMarkdown(test.input);
  const pass = result === test.expected;
  console.log(`${pass ? '✓ PASS' : '✗ FAIL'} ${test.name}`);
  console.log(`  Input:    "${test.input}"`);
  console.log(`  Expected: "${test.expected}"`);
  console.log(`  Got:      "${result}"`);
  console.log('');
});
