import { executeBuyNow, BuyNowListing } from '../transaction';
import { getBuyNowInstructions } from '../magiceden';
import { Transaction } from '@solana/web3.js';

jest.mock('../magiceden', () => ({
  getBuyNowInstructions: jest.fn(),
}));

jest.mock('@solana/web3.js', () => ({
  Transaction: { from: jest.fn(() => ({ decoded: true })) },
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
    expect(getBuyNowInstructions).toHaveBeenCalled();
    expect(sendTransaction).toHaveBeenCalled();
    expect(sig).toBe('sig');
  });
});
