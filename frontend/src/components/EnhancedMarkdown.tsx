import React from 'react';
import { useTheme } from '@mui/material/styles';

interface EnhancedMarkdownProps {
  children: string;
  isDark?: boolean;
}

/**
 * EnhancedMarkdown component that renders markdown and HTML with support for:
 * - HTML tags: <sub>, <sup>, <u>, <span>, <mark>, <big>, <small>, <del>
 * - Strikethrough: ~~text~~
 * - Subscript: 2<sub>5</sub>
 * - Superscript: 2<sup>5</sup>
 * - Font color: <span style="color:red">text</span>
 * - Highlight: <mark style="background:yellow">text</mark>
 * - Markdown formatting: **bold**, *italic*, # headings, etc.
 */
const EnhancedMarkdown: React.FC<EnhancedMarkdownProps> = ({ children, isDark: isDarkProp }) => {
  const theme = useTheme();
  const isDark = isDarkProp !== undefined ? isDarkProp : theme.palette.mode === 'dark';

  // Process markdown and HTML content using a line-based parser for lists
  const processContent = (content: string): string => {
    // Inline transforms applied to text nodes
    const inlineTransform = (text: string) => {
      let r = text;
      r = r.replace(/~~([^~]+)~~/g, '<del>$1</del>');
      r = r.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      r = r.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      r = r.replace(/_([^_]+)_/g, '<em>$1</em>');
      r = r.replace(/`([^`]+)`/g, '<code>$1</code>');
      return r;
    };

    type Node =
      | { type: 'p'; text: string }
      | { type: 'h'; level: number; text: string }
      | { type: 'ul'; items: any[] }
      | { type: 'ol'; items: any[] };

    const lines = content.split(/\r?\n/);
    const nodes: Node[] = [];

    // stack of open lists with their indent level
    const stack: Array<{ type: 'ul' | 'ol'; indent: number; node: any; lastLi: any }> = [];

    const pushList = (type: 'ul' | 'ol', indent: number, attachToParentLi?: any) => {
      const listNode: any = { type, items: [] };
      if (attachToParentLi) {
        // attach as child list of parent li
        if (!attachToParentLi.children) attachToParentLi.children = [];
        attachToParentLi.children.push(listNode);
      } else {
        nodes.push(listNode);
      }
      stack.push({ type, indent, node: listNode, lastLi: null });
      return listNode;
    };

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const lineWithTabs = raw.replace(/\t/g, '    ');
      const leading = (lineWithTabs.match(/^\s*/)?.[0]) || '';
      const indent = leading.replace(/\t/g, '    ').length;
      const trimmedLine = lineWithTabs.trim();

      if (!trimmedLine) {
        // blank line: keep context to allow continuous lists, but otherwise ignore
        continue;
      }

      // Headings -> close all open lists
      const hMatch = lineWithTabs.match(/^\s*(#{1,6})\s+(.*)$/);
      if (hMatch) {
        stack.length = 0;
        nodes.push({ type: 'h', level: hMatch[1].length, text: inlineTransform(hMatch[2].trim()) });
        continue;
      }

      // Unordered list
      const ulMatch = lineWithTabs.match(/^\s*[-*]\s+(.*)$/);
      if (ulMatch) {
        const text = inlineTransform(ulMatch[1].trim());
        while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
        const parent = stack[stack.length - 1];
        if (parent && parent.lastLi) {
          // nested under previous li
          // check if last child's last element is a ul, reuse it
          const lastChild = parent.lastLi.children && parent.lastLi.children[parent.lastLi.children.length - 1];
          if (lastChild && lastChild.type === 'ul') {
            lastChild.items.push({ text, children: [] });
          } else {
            // create new child ul under lastLi
            const listNode = pushList('ul', indent, parent.lastLi);
            const li = { text, children: [] };
            listNode.items.push(li);
            listNode.lastLi = li;
            // ensure parent.lastLi remains pointing to the parent li
          }
        } else {
          // top-level ul
          if (!parent || parent.type !== 'ul') {
            pushList('ul', indent, undefined);
          }
          const top = stack[stack.length - 1];
          const li = { text, children: [] };
          top.node.items.push(li);
          top.lastLi = li;
        }
        continue;
      }

      // fallback paragraph: close lists
      stack.length = 0;
      nodes.push({ type: 'p', text: inlineTransform(trimmedLine) });
    }

    // Render nodes to HTML
    const renderNode = (node: any): string => {
      if (node.type === 'p') return `<p>${node.text}</p>`;
      if (node.type === 'h') return `<h${node.level}>${node.text}</h${node.level}>`;
      if (node.type === 'ul') {
        return `<ul>${node.items
          .map((it: any) => {
            const childrenHtml = it.children && it.children.length ? it.children.map((c: any) => renderNode(c)).join('') : '';
            return `<li>${it.text}${childrenHtml}</li>`;
          })
          .join('')}</ul>`;
      }
      if (node.type === 'ol') {
        return `<ol>${node.items
          .map((it: any) => {
            const childrenHtml = it.children && it.children.length ? it.children.map((c: any) => renderNode(c)).join('') : '';
            return `<li>${it.text}${childrenHtml}</li>`;
          })
          .join('')}</ol>`;
      }
      return '';
    };

    return nodes.map(n => renderNode(n)).join('');
  };

  const htmlContent = processContent(children);

  // Inject comprehensive styles for HTML elements into a style tag
  // These styles ensure that inline HTML tags like <sub>, <sup>, <del> are properly styled
  const styleContent = `
    /* Base text formatting */
    .enhanced-markdown { word-wrap: break-word; overflow-wrap: break-word; }
    
    /* Headings */
    .enhanced-markdown h1 { font-size: 2rem; font-weight: 700; margin: 12px 0 16px 0; }
    .enhanced-markdown h2 { font-size: 1.5rem; font-weight: 700; margin: 12px 0 12px 0; }
    .enhanced-markdown h3 { font-size: 1.25rem; font-weight: 700; margin: 12px 0 8px 0; }
    .enhanced-markdown h4 { font-size: 1.125rem; font-weight: 700; margin: 12px 0 8px 0; }
    .enhanced-markdown h5 { font-size: 1rem; font-weight: 700; margin: 12px 0 8px 0; }
    .enhanced-markdown h6 { font-size: 0.875rem; font-weight: 700; margin: 12px 0 8px 0; }
    
    /* Paragraphs and spacing */
    .enhanced-markdown p { margin: 0 0 16px 0; line-height: 1.6; }
    
    /* Lists */
    .enhanced-markdown ul, .enhanced-markdown ol { margin-left: 24px; margin-bottom: 12px; margin-top: 0; }
    .enhanced-markdown li { margin-bottom: 6px; line-height: 1.6; }
    
    /* Text formatting */
    .enhanced-markdown strong { font-weight: 700; }
    .enhanced-markdown em { font-style: italic; }
    
    /* Subscript and Superscript - CRITICAL FOR DISPLAY */
    .enhanced-markdown sub { 
      font-size: 0.8em; 
      vertical-align: sub; 
      line-height: 1;
    }
    .enhanced-markdown sup { 
      font-size: 0.8em; 
      vertical-align: super; 
      line-height: 1;
    }
    
    /* Other inline elements */
    .enhanced-markdown u { text-decoration: underline; }
    .enhanced-markdown del { 
      text-decoration: line-through; 
      opacity: 0.7;
      text-decoration-color: currentColor;
    }
    .enhanced-markdown mark {
      background-color: yellow;
      padding: 2px 4px;
    }
    .enhanced-markdown big { font-size: 1.2em; }
    .enhanced-markdown small { font-size: 0.8em; }
    
    /* Code and pre */
    .enhanced-markdown code { 
      background: ${isDark ? 'rgba(15, 23, 42, 0.8)' : '#eee'}; 
      color: ${isDark ? '#f1f5f9' : 'inherit'}; 
      border-radius: 4px; 
      padding: 2px 6px; 
      font-size: 90%;
      font-family: 'Courier New', monospace;
    }
    .enhanced-markdown pre { 
      background: ${isDark ? 'rgba(15, 23, 42, 0.8)' : '#eee'}; 
      padding: 12px; 
      border-radius: 4px; 
      overflow-x: auto; 
      margin-bottom: 16px;
      font-family: 'Courier New', monospace;
    }
    
    /* Blockquote */
    .enhanced-markdown blockquote { 
      border-left: 4px solid ${isDark ? '#475569' : '#ccc'}; 
      margin: 12px 0; 
      padding: 8px 16px; 
      color: ${isDark ? '#cbd5e1' : '#555'}; 
      background: ${isDark ? 'rgba(30, 41, 59, 0.5)' : '#f9f9f9'};
    }
    
    /* Span and other custom styles */
    .enhanced-markdown span { /* Allow inline styles on span elements */ }
  `;

  return (
    <>
      <style>{styleContent}</style>
      <div 
        className="enhanced-markdown"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </>
  );
};

export default EnhancedMarkdown;
