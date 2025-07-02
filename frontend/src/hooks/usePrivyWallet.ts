import { useWallet } from '@solana/wallet-adapter-react';

export const usePrivyWallet = () => {
  const { publicKey, connected, connect, disconnect } = useWallet();

  const ready = true;
  const authenticated = connected;

  const login = connect;
  const logout = disconnect;

  return { ready, authenticated, publicKey, connected, login, logout };
};
