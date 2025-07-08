import { resolve, getPrimaryDomain as sdkGetPrimaryDomain } from '@bonfida/spl-name-service';
import { Connection, PublicKey } from '@solana/web3.js';

const HELIUS_API_KEY = process.env.REACT_APP_HELIUS_API_KEY;
const RPC_URL = HELIUS_API_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';

const SNS_RPC_URL = process.env.REACT_APP_SNS_RPC_URL || RPC_URL;

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
  } catch {
    return [];
  }
};

export const getPrimaryDomainName = async (owner: string): Promise<string | null> => {
  try {
    const connection = new Connection(RPC_URL);
    const { reverse } = await sdkGetPrimaryDomain(connection, new PublicKey(owner));
    if (!reverse) return null;
    return reverse.endsWith('.sol') ? reverse : `${reverse}.sol`;
  } catch {
    return null;
  }
};
