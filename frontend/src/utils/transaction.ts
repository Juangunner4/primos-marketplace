import { Connection, Transaction } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { getBuyNowInstructions, getListInstructions } from './magiceden';

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
    auctionHouseAddress: listing.auctionHouse,
  };
  if (listing.sellerReferral) params.sellerReferral = listing.sellerReferral;
  if (listing.sellerExpiry !== undefined)
    params.sellerExpiry = listing.sellerExpiry.toString();

  const resp = await getBuyNowInstructions(params);
  const encoded = resp.txSigned?.data;
  if (!encoded) throw new Error('Invalid response');
  const tx = Transaction.from(Buffer.from(encoded, 'base64'));
  const sig = await wallet.sendTransaction(tx, connection);
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
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
    auctionHouseAddress: nft.auctionHouse,
  };

  const resp = await getListInstructions(params);
  const encoded = resp.txSigned?.data;
  if (!encoded) throw new Error('Invalid response');
  const tx = Transaction.from(Buffer.from(encoded, 'base64'));
  const sig = await wallet.sendTransaction(tx, connection);
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
};
