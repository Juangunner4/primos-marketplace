import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import './DeFAI.css';

interface Msg { from: 'user' | 'eliza'; text: string; }

function elizaRespond(input: string): string {
  if (/mother|father|family/i.test(input)) {
    return 'Tell me more about your family.';
  }
  return `Why do you say "${input}"?`;
}

const DeFAI: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const user: Msg = { from: 'user', text: trimmed };
    const reply: Msg = { from: 'eliza', text: elizaRespond(trimmed) };
    setMessages((m) => [...m, user, reply]);
    setInput('');
  };

  return (
    <Box className="defai-container">
      <Typography variant="h6" className="defai-title">
        {t('defai_title')}
      </Typography>
      <Box className="defai-chat" data-testid="chat-window">
        {messages.map((m, i) => (
          <Box key={i} className={`msg ${m.from}`}>
            <span>{m.text}</span>
          </Box>
        ))}
      </Box>
      <Box className="defai-input">
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('defai_placeholder')}
          size="small"
          fullWidth
        />
        <Button variant="contained" onClick={sendMessage} sx={{ ml: 1 }}>
          {t('defai_send')}
        </Button>
      </Box>
    </Box>
  );
};

export default DeFAI;
