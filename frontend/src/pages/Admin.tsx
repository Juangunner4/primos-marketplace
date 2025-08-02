import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import api from '../utils/api';
import {
  Box,
  Button,
  ButtonGroup,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Avatar,
  TextField,
} from '@mui/material';
import { Link } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useTranslation } from 'react-i18next';
import * as Tabs from '@radix-ui/react-tabs';
import { getNFTByTokenAddress, fetchCollectionNFTsForOwner } from '../utils/helius';
import { getMagicEdenStats } from '../utils/magiceden';
import { getPythSolPrice } from '../utils/pyth';
import Loading from '../components/Loading';

const ADMIN_WALLET =
  process.env.REACT_APP_ADMIN_WALLET ?? 'EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6';
const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;
const MAGICEDEN_SYMBOL = 'primos';

interface BetaCode {
  code: string;
  redeemed: boolean;
}

interface AdminStats {
  totalWallets: number;
  totalPoints: number;
  primoHolders: number;
  betaCodes: number;
  betaCodesRedeemed: number;
  primosHeld: number;
  walletsWithPrimos: number;
  dbMarketCap: number;
  floorPrice: number;
}

interface Member {
  publicKey: string;
  pfp: string;
  points: number;
  pesos: number;
}

interface AdminMember extends Member {
  owned: number;
  solPrice: number | null;
  totalValue: number;
  sold: number;
  pnl: number | null;
}

const Admin: React.FC = () => {
  const { publicKey } = useWallet();
  const { t } = useTranslation();
  const [codes, setCodes] = useState<BetaCode[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [filter, setFilter] = useState<'active' | 'inactive'>('active');
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [search, setSearch] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    if (publicKey?.toBase58() === ADMIN_WALLET) {
      api
        .get<BetaCode[]>(`/api/admin/beta/${filter}`, {
          headers: { 'X-Public-Key': publicKey.toBase58() },
        })
        .then((res) => setCodes(res.data))
        .catch(() => setCodes([]));
      api
        .get<AdminStats>('/api/admin/stats', {
          headers: { 'X-Public-Key': publicKey.toBase58() },
        })
        .then((res) => setStats(res.data))
        .catch(() => setStats(null));
    }
  }, [publicKey, filter]);

  useEffect(() => {
    if (publicKey?.toBase58() !== ADMIN_WALLET) return;

    async function fetchMembers() {
      setLoadingMembers(true);
      try {
        if (!publicKey) return;
        const res = await api.get<Member[]>("/api/user/primos", {
          headers: { "X-Public-Key": publicKey.toBase58() },
        });
        const sorted = res.data
          .slice()
          .sort((a: Member, b: Member) => b.pesos - a.pesos);
        const [solPrice, meStats] = await Promise.all([
          getPythSolPrice(),
          getMagicEdenStats(MAGICEDEN_SYMBOL),
        ]);
        const floor = meStats?.floorPrice ?? 0;
        const enriched = await Promise.all(
          sorted.map(async (m) => {
            let image = "";
            if (m.pfp) {
              const nft = await getNFTByTokenAddress(m.pfp.replace(/"/g, ""));
              image = nft?.image ?? "";
            } else {
              const nfts = await fetchCollectionNFTsForOwner(
                m.publicKey,
                PRIMO_COLLECTION
              );
              image = nfts[0]?.image || "";
            }
            let owned = 0;
            try {
              const nfts = await fetchCollectionNFTsForOwner(
                m.publicKey,
                PRIMO_COLLECTION
              );
              owned = nfts.length;
            } catch {}
            return {
              ...m,
              pfp: image,
              owned,
              solPrice,
              totalValue: owned * floor,
              sold: 0,
              pnl: null,
            } as AdminMember;
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
  }, [publicKey]);

  const createCode = () => {
    if (!publicKey) return;
    api
      .post<BetaCode>('/api/admin/beta', {}, {
        headers: { 'X-Public-Key': publicKey.toBase58() },
      })
      .then((res) => setCodes((c) => [...c, res.data]));
  };

  if (publicKey?.toBase58() !== ADMIN_WALLET) {
    return <Typography>{t('access_denied')}</Typography>;
  }

  if (loadingMembers) {
    return <Loading message={t('primos_loading')} />;
  }

  const filtered = members.filter((m) =>
    m.publicKey.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Tabs.Root defaultValue="codes">
      <Tabs.List style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Tabs.Trigger
          value="codes"
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '6px 12px',
            background: '#000',
            color: '#fff',
            border: '1px solid #000',
            borderRadius: 4,
          }}
        >
          <ListAltIcon fontSize="small" style={{ marginRight: 4 }} />
          {t('beta_codes')}
        </Tabs.Trigger>
        <Tabs.Trigger
          value="stats"
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '6px 12px',
            background: '#000',
            color: '#fff',
            border: '1px solid #000',
            borderRadius: 4,
          }}
        >
          <BarChartIcon fontSize="small" style={{ marginRight: 4 }} />
          {t('stats')}
        </Tabs.Trigger>
        <Tabs.Trigger
          value="members"
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '6px 12px',
            background: '#000',
            color: '#fff',
            border: '1px solid #000',
            borderRadius: 4,
          }}
        >
          {t('primos_title')}
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="codes">
        <Box mb={2} display="flex" gap={1} alignItems="center">
          <ButtonGroup>
            <Button
              variant={filter === 'active' ? 'contained' : 'outlined'}
              onClick={() => setFilter('active')}
              startIcon={<CheckIcon />}
              sx={{ background: filter === 'active' ? '#000' : undefined, color: filter === 'active' ? '#fff' : undefined }}
            >
              {t('active_codes')}
            </Button>
            <Button
              variant={filter === 'inactive' ? 'contained' : 'outlined'}
              onClick={() => setFilter('inactive')}
              startIcon={<CloseIcon />}
              sx={{ background: filter === 'inactive' ? '#000' : undefined, color: filter === 'inactive' ? '#fff' : undefined }}
            >
              {t('redeemed_codes')}
            </Button>
          </ButtonGroup>
          <Button variant="contained" onClick={createCode} sx={{ background: '#000', color: '#fff', ml: 1 }}>
            {t('create_code')}
          </Button>
        </Box>
        <Table sx={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: '#000', color: '#fff', border: '1px solid #000', fontWeight: 'bold' }}>
                {t('beta_code')}
              </TableCell>
              <TableCell align="center" sx={{ backgroundColor: '#000', color: '#fff', border: '1px solid #000', fontWeight: 'bold' }}>
                {t('redeemed')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {codes.map((c) => (
              <TableRow key={c.code}>
                <TableCell sx={{ border: '1px solid #000', padding: '8px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                  {c.code}
                </TableCell>
                <TableCell align="center" sx={{ border: '1px solid #000', padding: '8px' }}>
                  <Tooltip title={c.redeemed ? t('redeemed') : t('not_redeemed')}>
                    {c.redeemed ? <CheckIcon style={{ color: '#000' }} /> : <CloseIcon style={{ color: '#000' }} />}
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Tabs.Content>

      <Tabs.Content value="stats">
        {stats && (
          <Table sx={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{t('total_wallets')}</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>{stats.totalWallets}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{t('total_points')}</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>{stats.totalPoints}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{t('primo_holders')}</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>{stats.primoHolders}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{t('total_beta')}</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>{stats.betaCodes}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{t('total_beta_redeemed')}</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>{stats.betaCodesRedeemed}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{t('nfts_held')}</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>{stats.primosHeld}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{t('wallets_with_nfts')}</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>{stats.walletsWithPrimos}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{t('db_market_cap')}</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>{(stats.dbMarketCap / 1e9).toFixed(2)} SOL</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{t('floor_price')}</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>{(stats.floorPrice / 1e9).toFixed(2)} SOL</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Tabs.Content>

      <Tabs.Content value="members">
        <TextField
          placeholder={t('primos_search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Box className="primos-list">
          {filtered.map((m) => (
            <Link
              key={m.publicKey}
              to={`/user/${m.publicKey}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Box className="primos-card">
                <Avatar src={m.pfp || undefined} sx={{ width: 56, height: 56 }} />
                <Box ml={1}>
                  <Typography>
                    {m.publicKey.slice(0, 4)}...{m.publicKey.slice(-3)}
                  </Typography>
                  <Box className="primos-pills">
                    <span className="primos-pill">{t('points')}: {m.points}</span>
                    <span className="primos-pill">{t('pesos')}: {m.pesos}</span>
                    <span className="primos-pill">{t('owned')}: {m.owned}</span>
                    <span className="primos-pill">
                      {t('sol_price')}: {m.solPrice ? `$${m.solPrice.toFixed(2)}` : 'N/A'}
                    </span>
                    <span className="primos-pill">
                      {t('total_value')}: {m.solPrice ? `$${((m.totalValue / 1e9) * m.solPrice).toFixed(2)}` : 'N/A'}
                    </span>
                    <span className="primos-pill">{t('sold')}: {m.sold}</span>
                    <span className="primos-pill">
                      {t('pnl')}: {m.pnl !== null ? m.pnl.toFixed(2) : 'N/A'}
                    </span>
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
        </Box>
      </Tabs.Content>
    </Tabs.Root>
  );
};

export default Admin;
