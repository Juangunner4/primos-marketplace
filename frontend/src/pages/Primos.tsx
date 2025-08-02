import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';
import { getNFTByTokenAddress, fetchCollectionNFTsForOwner } from '../utils/helius';
import { getPrimaryDomainName } from '../utils/sns';
import './Primos.css';
import Loading from '../components/Loading';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;

interface Member {
  publicKey: string;
  pfp: string;
  domain?: string;
  points: number;
  pesos: number;
}

const Primos: React.FC<{ connected?: boolean }> = ({ connected }) => {
  const wallet = useWallet();
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      setLoadingMembers(true);
      try {
        const res = await api.get<Member[]>('/api/user/primos');
        const sorted = res.data.slice().sort((a: Member, b: Member) => b.pesos - a.pesos);
        const enriched = await Promise.all(
          sorted.map(async (m) => {
            let image = '';
            if (m.pfp) {
              const nft = await getNFTByTokenAddress(m.pfp.replace(/"/g, ''));
              image = nft?.image || '';
            } else {
              const nfts = await fetchCollectionNFTsForOwner(m.publicKey, PRIMO_COLLECTION);
              image = nfts[0]?.image || '';
            }
            // fetch on-chain primary domain for each member
            const primary = await getPrimaryDomainName(m.publicKey);
            return { ...m, pfp: image, domain: primary || m.domain };
          })
        );
        setMembers(enriched);
      } catch {
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    }
    fetchMembers();
  }, []);

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
                  <Avatar
                    src={m.pfp || undefined}
                    sx={{ width: 56, height: 56 }}
                  />
                  <Box ml={1}>
                    <Typography>
                      {(m.domain ? m.domain + ' ' : '') + m.publicKey.slice(0, 4) + '...' + m.publicKey.slice(-3)}
                    </Typography>
                    <Box className="primos-pills">
                      <span className="primos-pill">{t('points')}: {m.points}</span>
                      <span className="primos-pill">{t('pesos')}: {m.pesos}</span>
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
