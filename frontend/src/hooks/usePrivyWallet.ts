import { usePrivy } from '@privy-io/react-auth';
import { PublicKey } from '@solana/web3.js';

export const usePrivyWallet = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const address = user?.wallet?.address ?? null;
  const publicKey = address ? new PublicKey(address) : null;
  const connected = !!address;
  return { ready, authenticated, publicKey, connected, login, logout };
};
