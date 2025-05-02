import { Metaplex } from '@metaplex-foundation/js';
import { Connection, PublicKey } from '@solana/web3.js';

export async function fetchNftMetadata(connection: Connection, mintAddress: string) {
    try {
        const metaplex = new Metaplex(connection);
        const nft = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(mintAddress) });

        return {
            name: nft.name,
            image: nft.json?.image || '',
            description: nft.json?.description || '',
        };
    } catch (err) {
        console.error(`Error fetching NFT metadata for mint ${mintAddress}:`, err);
        return null;
    }
}
