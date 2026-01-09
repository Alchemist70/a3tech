// ...existing code...
import React from 'react';
import { Box, Button, Tooltip, Menu, MenuItem, Divider } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import CodeIcon from '@mui/icons-material/Code';
import TitleIcon from '@mui/icons-material/Title';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import SubscriptIcon from '@mui/icons-material/Subscript';
import SuperscriptIcon from '@mui/icons-material/Superscript';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

export type MarkdownToolbarProps = {
  getTarget?: () => HTMLTextAreaElement | HTMLInputElement | null;
  handleAddChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};


const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ getTarget, handleAddChange }) => {
  // Dropdown state
  const [anchorElFont, setAnchorElFont] = React.useState<null | HTMLElement>(null);
  const [anchorElColor, setAnchorElColor] = React.useState<null | HTMLElement>(null);
  const [anchorElHighlight, setAnchorElHighlight] = React.useState<null | HTMLElement>(null);

  // Font size, color, highlight options
  const fontSizes = [
    { label: 'Small', markdown: '<small>' },
    { label: 'Normal', markdown: '' },
    { label: 'Large', markdown: '<big>' },
    { label: 'Huge', markdown: '<h1>' },
  ];
  const colors = [
    { label: 'Blue', markdown: '<span style="color:blue">', close: '</span>' },
    { label: 'Red', markdown: '<span style="color:red">', close: '</span>' },
    { label: 'Green', markdown: '<span style="color:green">', close: '</span>' },
    { label: 'Yellow', markdown: '<span style="color:gold">', close: '</span>' },
    { label: 'Black', markdown: '<span style="color:black">', close: '</span>' },
  ];
  const highlights = [
    { label: 'Yellow', markdown: '<mark style="background:yellow">', close: '</mark>' },
    { label: 'Red', markdown: '<mark style="background:red">', close: '</mark>' },
    { label: 'Green', markdown: '<mark style="background:lightgreen">', close: '</mark>' },
  ];

  function insertAroundSelection(
    textarea: HTMLTextAreaElement | HTMLInputElement,
    before: string,
    after: string = before,
    placeholder: string = ''
  ) {
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = textarea.value.substring(start, end) || placeholder;
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    const newVal = beforeText + before + selected + after + afterText;
    // set value in a way React recognizes for controlled components
    const setNativeValue = (el: any, value: string) => {
      const valueSetter = Object.getOwnPropertyDescriptor(el, 'value')?.set;
      const prototype = Object.getPrototypeOf(el);
      const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(el, value);
      } else if (valueSetter) {
        valueSetter.call(el, value);
      } else {
        el.value = value;
      }
    };
    setNativeValue(textarea, newVal);
    // restore selection and focus
    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = start + before.length + selected.length;
    textarea.focus();
  }
  function insertAtCursor(textarea: HTMLTextAreaElement | HTMLInputElement, text: string) {
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    const newVal = before + text + after;
    const setNativeValue = (el: any, value: string) => {
      const valueSetter = Object.getOwnPropertyDescriptor(el, 'value')?.set;
      const prototype = Object.getPrototypeOf(el);
      const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(el, value);
      } else if (valueSetter) {
        valueSetter.call(el, value);
      } else {
        el.value = value;
      }
    };
    setNativeValue(textarea, newVal);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
  }
  const handleButton = (action: () => void) => {
    const targetFromGetter = typeof getTarget === 'function' ? getTarget() : null;
    const target = targetFromGetter || (document.activeElement as HTMLTextAreaElement | HTMLInputElement | null);
    if (target && (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)) {
      action();
      // Fire native input event for non-React listeners
      const event = new Event('input', { bubbles: true });
      target.dispatchEvent(event);
      // Fire React onChange handler if provided
      if (handleAddChange) {
        // Create a synthetic event with the updated value
        const syntheticEvent = {
          target: Object.assign(target, { value: target.value }),
          currentTarget: target,
        } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
        handleAddChange(syntheticEvent);
      }
    }
  };
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
      {/* Font size dropdown */}
      <Tooltip title="Font Size">
        <span>
          <Button size="small" variant="outlined" onMouseDown={e => e.preventDefault()} onClick={e => setAnchorElFont(e.currentTarget)}>
            <FormatSizeIcon /> <ArrowDropDownIcon fontSize="small" />
          </Button>
        </span>
      </Tooltip>
      <Menu anchorEl={anchorElFont} open={!!anchorElFont} onClose={() => setAnchorElFont(null)}>
        {fontSizes.map(opt => (
          <MenuItem key={opt.label} onMouseDown={e => e.preventDefault()} onClick={() => {
            setAnchorElFont(null);
            handleButton(() => {
              const target = typeof getTarget === 'function' ? getTarget() : null;
              if (!target) return;
              if (opt.markdown) {
                insertAroundSelection(target, opt.markdown, opt.markdown.startsWith('<h') ? '</h1>' : opt.markdown.replace('<', '</'), 'text');
              }
            });
          }}>{opt.label}</MenuItem>
        ))}
      </Menu>
      {/* Bold */}
      <Tooltip title="Bold">
        <span>
          <Button size="small" variant="outlined" onMouseDown={e => e.preventDefault()} onClick={() => handleButton(() => {
            const target = typeof getTarget === 'function' ? getTarget() : null;
            if (!target) return;
            insertAroundSelection(target, '**', '**', 'bold');
          })}><FormatBoldIcon /></Button>
        </span>
      </Tooltip>
      {/* Italic */}
      <Tooltip title="Italic">
        <span>
          <Button size="small" variant="outlined" onMouseDown={e => e.preventDefault()} onClick={() => handleButton(() => {
            const target = typeof getTarget === 'function' ? getTarget() : null;
            if (!target) return;
            insertAroundSelection(target, '*', '*', 'italic');
          })}><FormatItalicIcon /></Button>
        </span>
      </Tooltip>
      {/* Underline */}
      <Tooltip title="Underline (HTML)" >
        <span>
          <Button size="small" variant="outlined" onMouseDown={e => e.preventDefault()} onClick={() => handleButton(() => {
            const target = typeof getTarget === 'function' ? getTarget() : null;
            if (!target) return;
            insertAroundSelection(target, '<u>', '</u>', 'underline');
          })}><FormatUnderlinedIcon /></Button>
        </span>
      </Tooltip>
      {/* Strikethrough */}
      <Tooltip title="Strikethrough">
        <span>
          <Button size="small" variant="outlined" onMouseDown={e => e.preventDefault()} onClick={() => handleButton(() => {
            const target = typeof getTarget === 'function' ? getTarget() : null;
            if (!target) return;
            insertAroundSelection(target, '~~', '~~', 'strikethrough');
          })}><StrikethroughSIcon /></Button>
        </span>
      </Tooltip>
      {/* Subscript */}
      <Tooltip title="Subscript (HTML)">
        <span>
          <Button size="small" variant="outlined" onMouseDown={e => e.preventDefault()} onClick={() => handleButton(() => {
            const target = typeof getTarget === 'function' ? getTarget() : null;
            if (!target) return;
            insertAroundSelection(target, '<sub>', '</sub>', 'sub');
          })}><SubscriptIcon /></Button>
        </span>
      </Tooltip>
      {/* Superscript */}
      <Tooltip title="Superscript (HTML)">
        <span>
          <Button size="small" variant="outlined" onMouseDown={e => e.preventDefault()} onClick={() => handleButton(() => {
            const target = typeof getTarget === 'function' ? getTarget() : null;
            if (!target) return;
            insertAroundSelection(target, '<sup>', '</sup>', 'sup');
          })}><SuperscriptIcon /></Button>
        </span>
      </Tooltip>
      {/* Font color dropdown */}
      <Tooltip title="Font Color">
        <span>
          <Button size="small" variant="outlined" onMouseDown={e => e.preventDefault()} onClick={e => setAnchorElColor(e.currentTarget)}>
            <FormatColorTextIcon /> <ArrowDropDownIcon fontSize="small" />
          </Button>
        </span>
      </Tooltip>
      <Menu anchorEl={anchorElColor} open={!!anchorElColor} onClose={() => setAnchorElColor(null)}>
        {colors.map(opt => (
          <MenuItem key={opt.label} onMouseDown={e => e.preventDefault()} onClick={() => {
            setAnchorElColor(null);
            handleButton(() => {
              const target = typeof getTarget === 'function' ? getTarget() : null;
              if (!target) return;
              insertAroundSelection(target, opt.markdown, opt.close, opt.label.toLowerCase());
            });
          }}>{opt.label}</MenuItem>
        ))}
      </Menu>
      {/* Highlight dropdown */}
      <Tooltip title="Highlight">
        <span>
          <Button size="small" variant="outlined" onMouseDown={e => e.preventDefault()} onClick={e => setAnchorElHighlight(e.currentTarget)}>
            <FormatColorFillIcon /> <ArrowDropDownIcon fontSize="small" />
          </Button>
        </span>
      </Tooltip>
      <Menu anchorEl={anchorElHighlight} open={!!anchorElHighlight} onClose={() => setAnchorElHighlight(null)}>
        {highlights.map(opt => (
          <MenuItem key={opt.label} onMouseDown={e => e.preventDefault()} onClick={() => {
            setAnchorElHighlight(null);
            handleButton(() => {
              const target = typeof getTarget === 'function' ? getTarget() : null;
              if (!target) return;
              insertAroundSelection(target, opt.markdown, opt.close, opt.label.toLowerCase());
            });
          }}>{opt.label}</MenuItem>
        ))}
      </Menu>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      {/* Heading */}
      <Tooltip title="Heading">
        <span>
          <Button size="small" variant="outlined" onMouseDown={e => e.preventDefault()} onClick={() => handleButton(() => {
            const target = typeof getTarget === 'function' ? getTarget() : null;
            if (!target) return;
            insertAtCursor(target, '## ');
          })}><TitleIcon /></Button>
        </span>
      </Tooltip>
      {/* Bulleted List */}
      <Tooltip title="Bulleted List">
        <span>
          <Button size="small" variant="outlined" onMouseDown={e => e.preventDefault()} onClick={() => handleButton(() => {
            const target = typeof getTarget === 'function' ? getTarget() : null;
            if (!target) return;
            insertAtCursor(target, '- ');
          })}><FormatListBulletedIcon /></Button>
        </span>
      </Tooltip>
      {/* Numbered List */}
      <Tooltip title="Numbered List">
        <span>
          <Button size="small" variant="outlined" onMouseDown={e => e.preventDefault()} onClick={() => handleButton(() => {
            const target = typeof getTarget === 'function' ? getTarget() : null;
            if (!target) return;
            insertAtCursor(target, '1. ');
          })}><FormatListNumberedIcon /></Button>
        </span>
      </Tooltip>
      {/* Inline Code */}
      <Tooltip title="Inline Code">
        <span>
          <Button size="small" variant="outlined" onMouseDown={e => e.preventDefault()} onClick={() => handleButton(() => {
            const target = typeof getTarget === 'function' ? getTarget() : null;
            if (!target) return;
            insertAroundSelection(target, '`', '`', 'code');
          })}><CodeIcon /></Button>
        </span>
      </Tooltip>
    </Box>
  );
};

export default MarkdownToolbar;
