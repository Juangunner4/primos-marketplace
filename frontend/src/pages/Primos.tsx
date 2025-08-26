import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';
import { enrichUsersWithPfp } from '../services/user';
import { getPrimaryDomainName } from '../utils/sns';
import './Primos.css';
import Loading from '../components/Loading';


interface Member {
  publicKey: string;
  pfp: string;
  pfpImage?: string;
  domain?: string;
  points: number;
  pesos: number;
  rank?: number;
}

const Primos: React.FC<{ connected?: boolean }> = ({ connected }) => {
  const { t } = useTranslation();
  const wallet = useWallet();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      setLoadingMembers(true);
      try {
        const headers = wallet.publicKey
          ? { headers: { 'X-Public-Key': wallet.publicKey.toBase58() } }
          : undefined;
        const res = await api.get<Member[]>('/api/user/primos', headers);
        // Sort by combined score (pesos + points) in descending order
        const sorted = res.data.slice().sort((a: Member, b: Member) => (b.pesos + b.points) - (a.pesos + a.points));
        const enriched = await enrichUsersWithPfp(
          sorted.map((m, index) => ({ ...m, rank: index + 1 })),
          { useCache: true }
        );
        
        // Fetch on-chain primary domain for each member
        const enrichedWithDomains = await Promise.all(
          enriched.map(async (m) => {
            const primary = await getPrimaryDomainName(m.publicKey);
            return { ...m, domain: primary || m.domain };
          })
        );
        setMembers(enrichedWithDomains);
      } catch {
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    }
    fetchMembers();
  }, [wallet.publicKey]);

  const filtered = members.filter((m) =>
    m.publicKey.toLowerCase().includes(search.toLowerCase()) ||
    m.domain?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box className="primos-container">
      <Typography variant="h4" className="primos-title">
        {t('primos_title')}
      </Typography>
      <TextField
        placeholder={t('primos_search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Box className="primos-list">
        {loadingMembers ? (
          <Loading message={t('primos_loading')} />
        ) : (
          <>
            {filtered.map((m) => (
              <Link
                key={m.publicKey}
                to={`/user/${m.publicKey}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Box className="primos-card">
                  <Box className="ranking-badge">
                    #{m.rank}
                  </Box>
                  <Avatar
                    src={m.pfpImage || undefined}
                    sx={{ width: 56, height: 56 }}
                  />
                  <Box ml={1}>
                    <Typography>
                      {(m.domain ? m.domain + ' ' : '') + m.publicKey.slice(0, 4) + '...' + m.publicKey.slice(-3)}
                    </Typography>
                    <Box className="primos-pills">
                      <span className="primos-pill">{t('points')}: {m.points}</span>
                      <span className="primos-pill">{t('pesos')}: {m.pesos}</span>
                      <span className="primos-pill total-score">Total: {m.points + m.pesos}</span>
                    </Box>
                  </Box>
                </Box>
              </Link>
            ))}
            {filtered.length === 0 && (
              <Typography className="no-members">
                {t('primos_no_members')}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default Primos;
