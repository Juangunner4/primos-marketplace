import { Connection, PublicKey } from '@solana/web3.js';
import { getPythProgramKeyForCluster, PythConnection } from '@pythnetwork/client';

const SOL_USD_PRICE_FEED = "FsSM8Qx5hG6ZbG8tFv7QqK8Qx5hG6ZbG8tFv7QqK8Qx5h"; // mainnet-beta

export const getPythSolPriceOnChain = async (): Promise<number | null> => {
    try {
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        const pythPublicKey = getPythProgramKeyForCluster('mainnet-beta');
        const pythConnection = new PythConnection(connection, pythPublicKey);

        return new Promise<number | null>((resolve) => {
            pythConnection.onPriceChange((product, price) => {
                if (product.symbol === "Crypto.SOL/USD" && price.price !== undefined) {
                    resolve(price.price);
                }
            });

            pythConnection.start();
            // Timeout after 5 seconds
            setTimeout(() => resolve(null), 5000);
        });
    } catch {
        return null;
    }
};