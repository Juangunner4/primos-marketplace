import React, { useState } from 'react';
import { TextField, Button, Paper, Card, CardContent, Typography, Divider, List, ListItem } from '@mui/material';
import api from '../utils/api';

interface TokenScanResult {
  tokenAddress: string;
  name?: string;
  symbol?: string;
  mintAuthorityRevoked?: boolean;
  freezeAuthorityRevoked?: boolean;
  lpBurned?: boolean;
  liquidityUSD?: number;
  volume24h?: number;
  holders?: number;
  isVerifiedPrimos?: boolean;
  daoEligible?: boolean;
  riskScore?: number;
  honeypotRisk?: string;
}

const TokenScanner: React.FC = () => {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<TokenScanResult | null>(null);

  const handleScan = async (addr: string) => {
    try {
      const res = await api.get<TokenScanResult>(`/api/token/scan/${addr}`);
      setResult(res.data);
    } catch {
      setResult(null);
    }
  };

  return (
    <div className="experiment-container">
      <Paper elevation={3} style={{ padding: '1rem', marginBottom: '1rem' }}>
        <TextField
          fullWidth
          label="Paste Token Address"
          variant="outlined"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleScan(address)}
          disabled={!address}
        >
          Scan Token
        </Button>
      </Paper>
      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6">
              {result.name} ({result.symbol})
            </Typography>
            <Divider sx={{ my: 1 }} />
            <List>
              <ListItem>
                Mint Authority Revoked: {result.mintAuthorityRevoked ? '✅' : '❌'}
              </ListItem>
              <ListItem>
                Freeze Authority Revoked: {result.freezeAuthorityRevoked ? '✅' : '❌'}
              </ListItem>
              <ListItem>Liquidity: ${result.liquidityUSD}</ListItem>
              <ListItem>Volume (24h): ${result.volume24h}</ListItem>
              <ListItem>Risk Score: {result.riskScore}/100</ListItem>
              <ListItem>Honeypot Risk: {result.honeypotRisk}</ListItem>
              <ListItem>Holders: {result.holders}</ListItem>
            </List>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TokenScanner;
