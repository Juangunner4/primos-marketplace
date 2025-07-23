import { Connection, Transaction } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { getBuyNowInstructions, getListInstructions } from './magiceden';
import api from './api';

export interface TxRecord {
  txId: string;
  mint: string;
  buyer: string;
  collection: string;
  source: string;
  timestamp: string;
}

export const recordTransaction = async (tx: TxRecord) => {
  try {
    await api.post('/api/transactions', tx);
  } catch (e) {
    console.error('Failed to record transaction', e);
  }
};

export interface BuyNowListing {
  tokenMint: string;
  tokenAta: string;
  seller: string;
  price: number;
  auctionHouse: string;
  sellerReferral?: string;
  sellerExpiry?: number;
}

export interface ListNFT {
  tokenMint: string;
  tokenAta: string;
  price: number;
  auctionHouse: string;
}

// Default Magic Eden AuctionHouse address
const DEFAULT_AUCTION_HOUSE = 'E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe';

export const executeBuyNow = async (
  connection: Connection,
  wallet: WalletContextState,
  listing: BuyNowListing
): Promise<string> => {
  const buyer = wallet.publicKey?.toBase58();
  if (!buyer) throw new Error('Wallet not connected');

  const params: Record<string, string> = {
    buyer,
    seller: listing.seller,
    tokenMint: listing.tokenMint,
    tokenATA: listing.tokenAta,
    price: listing.price.toString(),
    // use provided auctionHouse or default
    auctionHouseAddress: listing.auctionHouse || DEFAULT_AUCTION_HOUSE,
  };
  if (listing.sellerReferral) params.sellerReferral = listing.sellerReferral;
  if (listing.sellerExpiry !== undefined)
    params.sellerExpiry = listing.sellerExpiry.toString();

  const resp = await getBuyNowInstructions(params);
  const encoded = resp.txSigned?.data;
  if (!encoded) throw new Error('Invalid response');
  const tx = Transaction.from(Buffer.from(encoded, 'base64'));
  let sig: string | null = null;
  try {
    sig = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction(sig, 'confirmed');
    return sig;
  } finally {
    await recordTransaction({
      txId: sig ?? '',
      mint: listing.tokenMint,
      buyer,
      collection: process.env.REACT_APP_PRIMOS_COLLECTION || 'primos',
      source: 'magiceden',
      timestamp: new Date().toISOString(),
    });
  }
};

export const executeList = async (
  connection: Connection,
  wallet: WalletContextState,
  nft: ListNFT
): Promise<string> => {
  const seller = wallet.publicKey?.toBase58();
  if (!seller) throw new Error('Wallet not connected');

  const params: Record<string, string> = {
    seller,
    tokenMint: nft.tokenMint,
    tokenATA: nft.tokenAta,
    price: nft.price.toString(),
    // use provided auctionHouse or default
    auctionHouseAddress: nft.auctionHouse || DEFAULT_AUCTION_HOUSE,
  };

  const resp = await getListInstructions(params);
  const encoded = resp.txSigned?.data;
  if (!encoded) throw new Error('Invalid response');
  const tx = Transaction.from(Buffer.from(encoded, 'base64'));
  let sig: string | null = null;
  try {
    sig = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction(sig, 'confirmed');
    return sig;
  } finally {
    await recordTransaction({
      txId: sig ?? '',
      mint: nft.tokenMint,
      buyer: seller,
      collection: process.env.REACT_APP_PRIMOS_COLLECTION || 'primos',
      source: 'magiceden',
      timestamp: new Date().toISOString(),
    });
  }
};
