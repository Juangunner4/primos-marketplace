import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import api from '../utils/api';

interface WorkRequest {
  requester: string;
  description: string;
  createdAt: number;
}

const Work: React.FC = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<WorkRequest[]>([]);
  const [desc, setDesc] = useState('');

  useEffect(() => {
    api.get<WorkRequest[]>('/api/work').then(res => setRequests(res.data)).catch(() => setRequests([]));
  }, []);

  const submit = async () => {
    await api.post('/api/work', { description: desc });
    const res = await api.get<WorkRequest[]>('/api/work');
    setRequests(res.data);
    setDesc('');
  };

  return (
    <Box>
      <h2>{t('work_title')}</h2>
      <Box mb={2}>
        <TextField fullWidth value={desc} onChange={e => setDesc(e.target.value)} placeholder={t('work_request_placeholder') || ''} />
        <Button variant="contained" sx={{ mt: 1 }} onClick={submit}>{t('work_submit')}</Button>
      </Box>
      {requests.map((r, i) => (
        <Box key={i} sx={{ mb:1, p:1, border:'1px solid #ccc' }}>
          <strong>{r.requester}</strong>: {r.description}
        </Box>
      ))}
    </Box>
  );
};

export default Work;
