import { usePrivy } from '@privy-io/react-auth';
import { PublicKey } from '@solana/web3.js';

export const usePrivyWallet = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  
  // Get Solana wallet from user's linked accounts
  const solanaWallet = user?.linkedAccounts?.find(
    (account) => account.type === 'wallet' && account.walletClientType === 'solana'
  );
  
  // Type guard to ensure solanaWallet has an 'address' property
  const address =
    solanaWallet && 'address' in solanaWallet && typeof solanaWallet.address === 'string'
      ? solanaWallet.address
      : null;
  const publicKey = address ? new PublicKey(address) : null;
  const connected = !!address;
  
  return { ready, authenticated, publicKey, connected, login, logout };
};
