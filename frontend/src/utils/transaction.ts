import {
  Connection,
  Transaction,
  VersionedTransaction,
  SystemProgram,
  PublicKey,
  ComputeBudgetProgram,
  PACKET_DATA_SIZE,
} from '@solana/web3.js';
import { getBuyNowInstructions, getListInstructions } from './magiceden';
import api from './api';
import { calculateFees } from './fees';
import { WalletContextState } from '@solana/wallet-adapter-react';


export interface TxRecord {
  txId: string;
  mint: string;
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

type SolanaTx = Transaction | VersionedTransaction;

const decodeTransaction = (data: string): SolanaTx => {
  const buf = Buffer.from(data, 'base64');
  // versioned transactions set the top bit in the first byte
  if (buf[0] & 0x80) {
    try {
      return VersionedTransaction.deserialize(buf);
    } catch {
      // fall back to legacy parsing
    }
  }
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

const isLegacy = (t: SolanaTx): t is Transaction => 'instructions' in t;

const signAndSendTransaction = async (
  tx: SolanaTx,
  connection: Connection,
  wallet: WalletContextState
): Promise<string> => {
  // Convert versioned transactions to legacy for size optimization
  if (!isLegacy(tx)) {
    const legacy = Transaction.from(tx.serialize());
    tx = legacy;
  }
  // Strip compute budget instructions and prepare transaction
  stripComputeBudget(tx);
  if (!tx.recentBlockhash) {
    const latest = await connection.getLatestBlockhash();
    tx.recentBlockhash = latest.blockhash;
  }
  tx.feePayer ??= wallet.publicKey!;
  console.log('Tx size (bytes):', tx.serializeMessage().length);
  try {
    // wallet adapters can handle both legacy and versioned transactions
    const sig = await wallet.sendTransaction(tx as any, connection);
    console.log('Transaction hash:', sig);
    return sig;
  } catch (error: any) {
    console.error('sendTransaction failed', error);
    if (!error.message.includes('Transaction too large')) throw error;

    if (wallet.signAllTransactions) {
      try {
        const [signed] = await wallet.signAllTransactions([tx]);
        const sigAll = await connection.sendRawTransaction(signed.serialize());
        console.log('Transaction hash:', sigAll);
        return sigAll;
      } catch (e) {
        console.error('signAllTransactions failed', e);
        // ignore and fallback to single sign
      }
    }
    if (wallet.signTransaction) {
      try {
        const signedTx = await wallet.signTransaction(tx);
        const sigTx = await connection.sendRawTransaction(signedTx.serialize());
        console.log('Transaction hash:', sigTx);
        return sigTx;
      } catch (signErr: any) {
        console.error('signTransaction failed', signErr);
        throw new Error('Transaction too large to sign: ' + signErr.message);
      }
    }
    throw new Error('Wallet fallback unsupported');
  }
};

const sendFeeTransaction = async (
  connection: Connection,
  wallet: WalletContextState,
  listing: BuyNowListing,
  onStep?: (step: number) => void
): Promise<string | null> => {
  onStep?.(1);
  const { community, operations } = calculateFees(listing.price);
  const lamports = Math.round((community + operations) * 1e9);
  if (lamports > 0) {
    const txFee = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey!,
        toPubkey: new PublicKey(FEE_WALLET),
        lamports,
      })
    );
    const sigFee = await signAndSendTransaction(txFee, connection, wallet);
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      {
        signature: sigFee,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      'confirmed'
    );
    await recordTransaction({
      txId: sigFee,
      mint: listing.tokenMint,
      collection: process.env.REACT_APP_PRIMOS_COLLECTION || 'primos',
      source: 'DAO fee',
      timestamp: new Date().toISOString(),
    });
    return sigFee;
  }
  return null;
};

export const executeBuyNow = async (
  connection: Connection,
  wallet: WalletContextState,
  listing: BuyNowListing,
  onStep?: (step: number) => void
): Promise<string> => {
  const buyer = wallet.publicKey?.toBase58();
  if (!buyer) throw new Error('Wallet not connected');

  // 1) Send DAO fees (community + operations), if any
  await sendFeeTransaction(connection, wallet, listing, onStep);

  // 2) Magic Eden buy-now
  onStep?.(2);
  const params: Record<string, string> = {
    buyer,
    seller: listing.seller,
    tokenMint: listing.tokenMint,
    tokenATA: listing.tokenAta,
    price: listing.price.toString(),
    auctionHouseAddress: listing.auctionHouse || DEFAULT_AUCTION_HOUSE
  };
  if (listing.sellerReferral) params.sellerReferral = listing.sellerReferral;
  if (listing.sellerExpiry !== undefined)
    params.sellerExpiry = listing.sellerExpiry.toString();

  const resp = await getBuyNowInstructions(params);
  const data = resp.txSigned?.data;
  if (!data) throw new Error('Invalid response');

  const txBuy = decodeTransaction(data);
  const sigBuy = await signAndSendTransaction(txBuy, connection, wallet);

  const latest = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    {
      signature: sigBuy,
      blockhash: latest.blockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    },
    'confirmed'
  );

  await recordTransaction({
    txId: sigBuy,
    mint: listing.tokenMint,
    collection: process.env.REACT_APP_PRIMOS_COLLECTION || 'primos',
    source: 'magiceden',
    timestamp: new Date().toISOString(),
  });

  onStep?.(3);
  return sigBuy;
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

  // send and confirm optimized transaction
  const sig = await signAndSendTransaction(tx, connection, wallet);
  // confirm with blockhash and commitment
  const latest = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    { signature: sig, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
    'confirmed'
  );
  // record transaction
  await recordTransaction({
    txId: sig,
    mint: nft.tokenMint,
    collection: process.env.REACT_APP_PRIMOS_COLLECTION || 'primos',
    source: 'magiceden',
    timestamp: new Date().toISOString(),
  });
  return sig;
}
