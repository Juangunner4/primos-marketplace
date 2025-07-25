// @ts-nocheck
import { executeBuyNow, BuyNowListing, executeList, ListNFT } from '../transaction';
import { getBuyNowInstructions, getListInstructions } from '../magiceden';
import api from '../api';

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
    (getBuyNowInstructions as jest.Mock).mockResolvedValue({
      txSigned: { data: Buffer.from('tx').toString('base64') },
    });
    const sendTransaction = jest.fn().mockResolvedValue('sig');
    const wallet: any = {
      publicKey: { toBase58: () => 'buyer' },
      sendTransaction,
    };
    const connection: any = {
      confirmTransaction: jest.fn().mockResolvedValue(null),
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
      expect.objectContaining({ buyer: 'buyer', splitFees: 'true' })
    );
    expect(sendTransaction).toHaveBeenCalledTimes(2);
    expect(api.post).toHaveBeenCalledWith('/api/transactions', expect.objectContaining({ mint: 'mint' }));
    expect(sig).toBe('sig');
  });
});

describe('executeList', () => {
  test('sends transaction', async () => {
    (getListInstructions as jest.Mock).mockResolvedValue({
      txSigned: { data: Buffer.from('tx').toString('base64') },
    });
    const sendTransaction = jest.fn().mockResolvedValue('sig');
    const wallet: any = {
      publicKey: { toBase58: () => 'seller' },
      sendTransaction,
    };
    const connection: any = {
      confirmTransaction: jest.fn().mockResolvedValue(null),
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
