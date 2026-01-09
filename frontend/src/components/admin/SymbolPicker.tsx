import React, { useState } from 'react';
import { Menu, MenuItem, IconButton, Tooltip } from '@mui/material';
import FunctionsIcon from '@mui/icons-material/Functions';

const SYMBOLS = ['π','α','β','γ','Δ','θ','λ','μ','σ','Ω','∑','∫','√','∞','≈','≠','≤','≥','±','°'];

interface Props {
  getTarget?: () => HTMLInputElement | HTMLTextAreaElement | null;
}


let _lastFocused: Element | null = null;
if (typeof document !== 'undefined') {
  document.addEventListener('focusin', (e) => { _lastFocused = e.target as Element; }, true);
}

const insertSymbolToTarget = (target: HTMLInputElement | HTMLTextAreaElement | null, sym: string) => {
  if (!target) return;
  try {
    const start = (target.selectionStart ?? target.value.length) as number;
    const end = (target.selectionEnd ?? start) as number;
    const newVal = target.value.slice(0, start) + sym + target.value.slice(end);
    // set native value in a way React recognizes for controlled components
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
    setNativeValue(target, newVal);
    target.selectionStart = target.selectionEnd = start + sym.length;
    target.focus();
    const evt = new Event('input', { bubbles: true });
    target.dispatchEvent(evt);
  } catch (e) {
    console.error('Failed to insert symbol', e);
  }
};

const SymbolPicker: React.FC<Props> = ({ getTarget }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const openingFocusedRef = React.useRef<Element | null>(null);

  const handleOpen = (el: HTMLElement) => {
    // capture the currently focused element before opening so we can insert into it
    openingFocusedRef.current = (document.activeElement as Element) || _lastFocused;
    setAnchorEl(el);
  };

  return (
    <>
      <Tooltip title="Insert math / Greek symbol">
        <IconButton size="small" onMouseDown={e => e.preventDefault()} onClick={e => handleOpen(e.currentTarget)}>
          <FunctionsIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        {SYMBOLS.map(s => (
          <MenuItem key={s} onMouseDown={e => e.preventDefault()} onClick={() => {
            const fromGetter = (getTarget && getTarget()) as (HTMLInputElement | HTMLTextAreaElement | null);
            const opener = openingFocusedRef.current as (HTMLInputElement | HTMLTextAreaElement | Element | null);
            const fallback = (_lastFocused as (HTMLInputElement | HTMLTextAreaElement) | null) || (document.activeElement as any);
            const candidate = fromGetter || (opener as any) || fallback;
            const resolvedTarget = (candidate instanceof HTMLInputElement || candidate instanceof HTMLTextAreaElement) ? candidate : null;
            insertSymbolToTarget(resolvedTarget, s);
            setAnchorEl(null);
          }}>{s}</MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default SymbolPicker;
