import { Connection, Transaction } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { getBuyNowInstructions } from './magiceden';

export interface BuyNowListing {
  tokenMint: string;
  tokenAta: string;
  seller: string;
  price: number;
  auctionHouse: string;
  sellerReferral?: string;
  sellerExpiry?: number;
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
