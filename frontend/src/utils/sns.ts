import { Connection, PublicKey } from '@solana/web3.js';
import { resolve } from '@bonfida/spl-name-service';

const RPC_URL = 'https://api.mainnet-beta.solana.com';

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
