// @ts-nocheck
import { executeBuyNow, BuyNowListing, executeList, ListNFT } from '../transaction';
import { getBuyNowInstructions, getListInstructions } from '../magiceden';
import api from '../api';
import { Transaction, Keypair } from '@solana/web3.js';

jest.mock('../magiceden', () => ({
  getBuyNowInstructions: jest.fn(),
  getListInstructions: jest.fn(),
}));

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));


describe('executeBuyNow', () => {
  test('sends transaction', async () => {
    const dummy = new Transaction();
    dummy.recentBlockhash = '11111111111111111111111111111111';
    dummy.feePayer = Keypair.generate().publicKey;
    const encoded = dummy
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString('base64');
    (getBuyNowInstructions as jest.Mock).mockResolvedValue({
      v0: { txSigned: { data: encoded } },
    });
    const sendTransaction = jest.fn().mockResolvedValue('sig');
    const wallet: any = {
      publicKey: { toBase58: () => 'buyer' },
      sendTransaction,
    };
    const connection: any = {
      confirmTransaction: jest.fn().mockResolvedValue(null),
      getLatestBlockhash: jest
        .fn()
        .mockResolvedValue({ blockhash: 'bh', lastValidBlockHeight: 1 }),
    };
    const listing: BuyNowListing = {
      tokenMint: 'mint',
      tokenAta: 'ata',
      seller: 'seller',
      price: 1,
      auctionHouse: 'ah',
    };
    const sig = await executeBuyNow(connection, wallet, listing);
    expect(getBuyNowInstructions).toHaveBeenCalledWith(
      expect.objectContaining({ buyer: 'buyer' })
    );
    expect(sendTransaction).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/api/transactions', expect.objectContaining({ mint: 'mint' }));
    expect(sig).toBe('sig');
  });
});

describe('executeList', () => {
  test('sends transaction', async () => {
    const dummy = new Transaction();
    dummy.recentBlockhash = '11111111111111111111111111111111';
    dummy.feePayer = Keypair.generate().publicKey;
    const encoded = dummy
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString('base64');
    (getListInstructions as jest.Mock).mockResolvedValue({
      txSigned: { data: encoded },
    });
    const sendTransaction = jest.fn().mockResolvedValue('sig');
    const wallet: any = {
      publicKey: { toBase58: () => 'seller' },
      sendTransaction,
    };
    const connection: any = {
      confirmTransaction: jest.fn().mockResolvedValue(null),
      getLatestBlockhash: jest
        .fn()
        .mockResolvedValue({ blockhash: 'bh', lastValidBlockHeight: 1 }),
    };
    const nft: ListNFT = {
      tokenMint: 'mint',
      tokenAta: 'ata',
      price: 1,
      auctionHouse: 'ah',
    };
    const sig = await executeList(connection, wallet, nft);
    expect(getListInstructions).toHaveBeenCalled();
    expect(sendTransaction).toHaveBeenCalled();
    expect(api.post).toHaveBeenCalledWith('/api/transactions', expect.objectContaining({ mint: 'mint' }));
    expect(sig).toBe('sig');
  });
});
