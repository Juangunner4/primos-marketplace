import { Connection } from '@solana/web3.js';
import { resolve } from '@bonfida/spl-name-service';

// use Helius RPC if API key is provided, otherwise fallback to default Solana RPC
const HELIUS_API_KEY = process.env.REACT_APP_HELIUS_API_KEY;
if (!HELIUS_API_KEY) {
  console.error('Helius API key is missing; using default Solana RPC');
}
const RPC_URL = HELIUS_API_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';

// SNS RPC needs a provider that supports SNS methods (e.g. QuickNode)
const SNS_RPC_URL = process.env.REACT_APP_SNS_RPC_URL;
if (!SNS_RPC_URL) {
  console.error('SNS RPC URL is not configured; set REACT_APP_SNS_RPC_URL to a provider supporting SNS methods');
}

export const getDomainOwner = async (domain: string): Promise<string | null> => {
  try {
    const connection = new Connection(RPC_URL);
    const key = await resolve(connection, domain);
    return key.toBase58();
  } catch {
    return null;
  }
};

export const verifyDomainOwnership = async (
  domain: string,
  owner: string
): Promise<boolean> => {
  const domainOwner = await getDomainOwner(domain);
  return domainOwner === owner;
};

export const getOwnedDomains = async (owner: string): Promise<string[]> => {
  if (!SNS_RPC_URL) {
    return [];
  }
  try {
    const response = await fetch(SNS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sns_getAllDomainsForOwner',
        params: [owner],
      }),
    });
    const data = await response.json();
    if (!data.result) return [];
    return data.result.map((d: any) => {
      const name = d.name;
      return name.endsWith('.sol') ? name : `${name}.sol`;
    });
  } catch (e) {
    console.error('Failed to fetch SNS domains via RPC', e);
    return [];
  }
};
