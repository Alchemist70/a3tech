import React, { useEffect, useRef } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import CodeIcon from '@mui/icons-material/Code';

type Props = {
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
};

const exec = (command: string, value?: string) => {
  try {
    // execCommand is deprecated but acceptable for a small in-app editor
    document.execCommand(command, false, value);
  } catch (e) {
    // no-op
  }
};

const RichTextEditor: React.FC<Props> = ({ value, onChange, readOnly = false }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const focused = useRef(false);

  useEffect(() => {
    // Only update innerHTML when the editor is not focused to avoid resetting the caret
    if (ref.current && !focused.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  return (
    <Box>
      <Box sx={{ mb: 1, display: 'flex', gap: 1 }}>
        <Tooltip title="Bold">
          <span>
            <IconButton size="small" onClick={() => { if (!readOnly) { exec('bold'); ref.current && onChange(ref.current.innerHTML); } }}>
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Italic">
          <span>
            <IconButton size="small" onClick={() => { if (!readOnly) { exec('italic'); ref.current && onChange(ref.current.innerHTML); } }}>
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Underline">
          <span>
            <IconButton size="small" onClick={() => { if (!readOnly) { exec('underline'); ref.current && onChange(ref.current.innerHTML); } }}>
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Bulleted list">
          <span>
            <IconButton size="small" onClick={() => { if (!readOnly) { exec('insertUnorderedList'); ref.current && onChange(ref.current.innerHTML); } }}>
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Numbered list">
          <span>
            <IconButton size="small" onClick={() => { if (!readOnly) { exec('insertOrderedList'); ref.current && onChange(ref.current.innerHTML); } }}>
              <FormatListNumberedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Insert link">
          <span>
            <IconButton size="small" onClick={() => {
              if (readOnly) return;
              const url = window.prompt('Enter URL');
              if (url) { exec('createLink', url); ref.current && onChange(ref.current.innerHTML); }
            }}>
              <LinkIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Insert image">
          <span>
            <IconButton size="small" onClick={() => {
              if (readOnly) return;
              const url = window.prompt('Enter image URL');
              if (url && ref.current) {
                const html = `<img src="${url}" style="max-width:100%;height:auto;border-radius:6px;" />`;
                exec('insertHTML', html);
                onChange(ref.current.innerHTML);
              }
            }}>
              <ImageIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Insert video">
          <span>
            <IconButton size="small" onClick={() => {
              if (readOnly) return;
              const url = window.prompt('Enter video URL (mp4 or embed)');
              if (url && ref.current) {
                // If it's a YouTube link, embed as iframe, otherwise use HTML5 video
                let html = '';
                if (/youtube\.com|youtu\.be/.test(url)) {
                  // convert to embed
                  let idMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
                  const id = idMatch ? idMatch[1] : url;
                  html = `<iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen style="width:100%;height:360px;border-radius:6px"></iframe>`;
                } else {
                  html = `<video controls style="max-width:100%;height:auto;border-radius:6px"><source src="${url}" /></video>`;
                }
                exec('insertHTML', html);
                onChange(ref.current.innerHTML);
              }
            }}>
              <MovieIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Insert code block">
          <span>
            <IconButton size="small" onClick={() => {
              if (readOnly) return;
              const code = window.prompt('Paste code here');
              if (code && ref.current) {
                const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const html = `<pre style="background:var(--card);padding:12px;border-radius:6px;overflow:auto"><code>${escaped}</code></pre>`;
                exec('insertHTML', html);
                onChange(ref.current.innerHTML);
              }
            }}>
              <CodeIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Clear formatting">
          <span>
            <IconButton size="small" onClick={() => { if (!readOnly) { exec('removeFormat'); ref.current && onChange(ref.current.innerHTML); } }}>
              <ClearAllIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box
        ref={ref}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onFocus={() => { focused.current = true; }}
        onBlur={() => { focused.current = false; if (ref.current) onChange(ref.current.innerHTML); }}
        onInput={() => {
          // Update internal content while typing but don't push to parent continuously to avoid caret resets.
          // Parent will be updated on blur. Still allow exec-command handlers to call onChange immediately.
        }}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        sx={{}}
        style={{
          minHeight: 140,
          border: '1px solid rgba(0,0,0,0.12)',
          padding: 12,
          borderRadius: 6,
          outline: 'none',
          background: readOnly ? 'var(--card)' : undefined,
        }}
      />
    </Box>
  );
};

export default RichTextEditor;
