import {
  Connection,
  Transaction,
  SystemProgram,
  PublicKey,
  ComputeBudgetProgram,
  PACKET_DATA_SIZE,
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { getBuyNowInstructions, getListInstructions } from './magiceden';
import api from './api';
import { calculateFees, FEE_COMMUNITY, FEE_OPERATIONS } from './fees';

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

export interface DbTransaction {
  txId: string;
  buyer: string;
  seller?: string;
  mint: string;
  price?: number;
  collection: string;
  source: string;
  timestamp: string;
  status: string;
  solSpent?: number;
}

export const fetchRecentTransactions = async (
  hours = 24
): Promise<DbTransaction[]> => {
  const res = await api.get<DbTransaction[]>(`/api/transactions/recent?hours=${hours}`);
  return res.data;
};

export const fetchVolume24h = async (): Promise<number> => {
  try {
    const res = await api.get<{ volume: number }>('/api/transactions/volume24h');
    return res.data.volume;
  } catch {
    return 0;
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
// wallet receiving community + operations fees
const FEE_WALLET =
  process.env.REACT_APP_FEE_WALLET ??
  process.env.REACT_APP_ADMIN_WALLET ??
  'EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6';

const decodeTransaction = (data: string): Transaction => {
  const buf = Buffer.from(data, 'base64');
  // Always deserialize as a legacy Transaction
  return Transaction.from(buf);
};

const stripComputeBudget = (tx: Transaction) => {
  try {
    if (tx.serializeMessage().length <= PACKET_DATA_SIZE) return;
  } catch {
    return;
  }
  tx.instructions = tx.instructions.filter(
    (ix) => !ix.programId.equals(ComputeBudgetProgram.programId)
  );
};

const signAndSendTransaction = async (
  tx: Transaction,
  connection: Connection,
  wallet: WalletContextState
): Promise<string> => {
  stripComputeBudget(tx);
  console.log('Tx size (bytes):', tx.serializeMessage().length);
  try {
    return await wallet.sendTransaction(tx, connection);
  } catch (error: any) {
    console.error('sendTransaction failed', error);
    if (!error.message.includes('Transaction too large')) throw error;

    if (wallet.signAllTransactions) {
      try {
        const [signed] = await wallet.signAllTransactions([tx]);
        return await connection.sendRawTransaction(signed.serialize());
      } catch (e) {
        console.error('signAllTransactions failed', e);
        // ignore and fallback to single sign
      }
    }
    if (wallet.signTransaction) {
      try {
        const signedTx = await wallet.signTransaction(tx);
        return await connection.sendRawTransaction(signedTx.serialize());
      } catch (signErr: any) {
        console.error('signTransaction failed', signErr);
        throw new Error('Transaction too large to sign: ' + signErr.message);
      }
    }
    throw new Error('Wallet fallback unsupported');
  }
};

export const executeBuyNow = async (
  connection: Connection,
  wallet: WalletContextState,
  listing: BuyNowListing,
  onStep?: (step: number) => void
): Promise<string> => {
  const buyer = wallet.publicKey?.toBase58();
  if (!buyer) throw new Error('Wallet not connected');

  onStep?.(1);
  // first send operations/community fee separately
  try {
    const fees = calculateFees(listing.price);
    const lamports = Math.round((fees.community + fees.operations) * 1e9);
    if (lamports > 0) {
      const feeTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey!,
          toPubkey: new PublicKey(FEE_WALLET),
          lamports,
        })
      );
      onStep?.(2);
      const feeSig = await signAndSendTransaction(feeTx, connection, wallet);
      // @ts-ignore
      await connection.confirmTransaction(feeSig, 'confirmed');
    }
  } catch (e) {
    console.error('Fee transfer failed', e);
    throw e;
  }

  const params: Record<string, string> = {
    buyer,
    seller: listing.seller,
    tokenMint: listing.tokenMint,
    tokenATA: listing.tokenAta,
    price: listing.price.toString(),
    auctionHouseAddress: listing.auctionHouse || DEFAULT_AUCTION_HOUSE,
  };
  if (listing.sellerReferral) params.sellerReferral = listing.sellerReferral;
  if (listing.sellerExpiry !== undefined)
    params.sellerExpiry = listing.sellerExpiry.toString();
  params.splitFees = 'true';

  // Get primary and cleanup transaction payloads
  const resp = await getBuyNowInstructions(params);
  const payloads: string[] = [];
  if (resp.txSigned?.data) payloads.push(resp.txSigned.data);
  if (resp.cleanupTransaction?.data) payloads.push(resp.cleanupTransaction.data);
  if (payloads.length === 0) throw new Error('Invalid response');

  // Send each transaction sequentially and record separately
  let sig = '';
  onStep?.(2);
  for (const [i, data] of payloads.entries()) {
    const tx = decodeTransaction(data);
    sig = await signAndSendTransaction(tx, connection, wallet);
    // @ts-ignore
    await connection.confirmTransaction(sig, 'confirmed');
    // Log primary vs DAO fee tx with different sources
    await recordTransaction({
      txId: sig,
      mint: listing.tokenMint,
      buyer,
      collection: process.env.REACT_APP_PRIMOS_COLLECTION || 'primos',
      source: i === 0 ? 'magiceden' : 'losprimosdao.sol',
      timestamp: new Date().toISOString(),
    });
  }
  onStep?.(3);
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
    // use provided auctionHouse or default
    auctionHouseAddress: nft.auctionHouse || DEFAULT_AUCTION_HOUSE,
  };

  const resp = await getListInstructions(params);
  const encoded = resp.txSigned?.data;
  if (!encoded) throw new Error('Invalid response');
  const tx = decodeTransaction(encoded);

  let sig: string | null = null;
  try {
    sig = await wallet.sendTransaction(tx, connection);
    // @ts-ignore
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
