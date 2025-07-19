import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@solana/wallet-adapter-react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { getNFTByTokenAddress, fetchCollectionNFTsForOwner } from '../utils/helius';
import api from '../utils/api';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;

interface WorkRequest {
  requester: string;
  worker: string;
  group: string;
  description: string;
  createdAt: number;
  id: string;
}

const Work: React.FC = () => {
  const { t } = useTranslation();
  const { publicKey } = useWallet();
  const [requests, setRequests] = useState<WorkRequest[]>([]);
  const [desc, setDesc] = useState('');
  const [workGroups, setWorkGroups] = useState<string[]>([]);
  const [group, setGroup] = useState('');
  const [users, setUsers] = useState<Record<string, { pfp: string; domain?: string }>>({});

  useEffect(() => {
    if (!publicKey) return;
    api
      .get(`/api/user/${publicKey.toBase58()}`, { headers: { 'X-Public-Key': publicKey.toBase58() } })
      .then(res => {
        const groups = res.data.workGroups || [];
        setWorkGroups(groups);
        if (groups.length > 0) {
          setGroup(groups[0]);
        }
      })
      .catch(() => setWorkGroups([]));
  }, [publicKey]);

  const loadUser = async (key: string) => {
    if (!key || users[key]) return;
    try {
      const res = await api.get(`/api/user/${key}`);
      const u = res.data;
      let image = '';
      if (u.pfp) {
        const nft = await getNFTByTokenAddress(u.pfp.replace(/"/g, ''));
        image = nft?.image || '';
      } else {
        const nfts = await fetchCollectionNFTsForOwner(key, PRIMO_COLLECTION);
        image = nfts[0]?.image || '';
      }
      setUsers(prev => ({ ...prev, [key]: { pfp: image, domain: u.domain } }));
    } catch {
      setUsers(prev => ({ ...prev, [key]: { pfp: '', domain: undefined } }));
    }
  };

  useEffect(() => {
    if (!group) return;
    api.get<WorkRequest[]>(`/api/work?group=${group}`).then(res => setRequests(res.data)).catch(() => setRequests([]));
  }, [group]);

  useEffect(() => {
    requests.forEach(r => {
      loadUser(r.requester);
      if (r.worker) loadUser(r.worker);
    });
  }, [requests]);

  const submit = async () => {
    if (!publicKey || !group) return;
    await api.post(
      '/api/work',
      { group, description: desc },
      { headers: { 'X-Public-Key': publicKey.toBase58() } }
    );
    const res = await api.get<WorkRequest[]>(`/api/work?group=${group}`);
    setRequests(res.data);
    setDesc('');
  };

  const pickup = async (id: string) => {
    if (!publicKey) return;
    await api.put(
      `/api/work/${id}/assign`,
      {},
      { headers: { 'X-Public-Key': publicKey.toBase58() } }
    );
    const res = await api.get<WorkRequest[]>(`/api/work?group=${group}`);
    setRequests(res.data);
  };

  return (
    <Box>
      <h2>{t('work_title')}</h2>
      {workGroups.length === 0 ? (
        <Typography sx={{ my: 2 }}>{t('work_no_groups')}</Typography>
      ) : (
        <Box mb={2}>
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel id="group-label">{t('work_group_label')}</InputLabel>
            <Select
              labelId="group-label"
              value={group}
              label={t('work_group_label') || ''}
              onChange={e => setGroup(e.target.value)}
            >
              {workGroups.map(g => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder={t('work_request_placeholder') || ''}
          />
          <Button variant="contained" sx={{ mt: 1 }} onClick={submit}>
            {t('work_submit')}
          </Button>
        </Box>
      )}
      {requests.map((r, i) => {
        const reqUser = users[r.requester];
        const workerUser = r.worker ? users[r.worker] : undefined;
        const requesterName = reqUser?.domain
          ? reqUser.domain
          : r.requester.slice(0, 4) + '...' + r.requester.slice(-3);
        return (
          <Box key={i} sx={{ mb:1, p:1, border:'1px solid #ccc', display:'flex', alignItems:'center', gap:1 }}>
            <Avatar src={reqUser?.pfp || undefined} sx={{ width:32, height:32 }} />
            <Typography sx={{ fontWeight: 'bold' }}>{requesterName}</Typography>
            <Typography sx={{ mx:1 }}>:</Typography>
            <Typography sx={{ flexGrow:1 }}>{r.description}</Typography>
            {r.worker ? (
              <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                <Typography variant="body2">{t('work_assigned_to')}</Typography>
                <Avatar src={workerUser?.pfp || undefined} sx={{ width:24, height:24 }} />
              </Box>
            ) : (
              <Button size="small" onClick={() => pickup(r.id)}>{t('work_pick')}</Button>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default Work;
