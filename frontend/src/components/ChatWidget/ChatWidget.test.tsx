import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatWidget from './ChatWidget';
import * as chatApi from '../../api/chat';

jest.mock('../../api/chat');

test('opens Einstein chat and exposes live region and close label; announces typing and response', async () => {
  // mock sendMessage to resolve quickly
  (chatApi as any).sendMessage.mockResolvedValue({ reply: 'Test reply' });

  render(<ChatWidget />);
  const openBtn = screen.getByRole('button', { name: /open einstein chat/i });
  expect(openBtn).toBeInTheDocument();

  fireEvent.click(openBtn);

  const dialog = screen.getByRole('dialog', { name: /einstein chat widget/i });
  expect(dialog).toBeInTheDocument();

  const live = screen.getByRole('status');
  expect(live).toHaveTextContent(/einstein is ready to help/i);

  const input = screen.getByLabelText(/einstein chat input/i);
  fireEvent.change(input, { target: { value: 'Hello' } });

  const sendBtn = screen.getByRole('button', { name: /send message to einstein/i });
  fireEvent.click(sendBtn);

  // live region should announce typing, then response
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/einstein is typing/i));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/einstein has responded/i));

  const closeBtn = screen.getByRole('button', { name: /close einstein chat/i });
  expect(closeBtn).toBeInTheDocument();
});
