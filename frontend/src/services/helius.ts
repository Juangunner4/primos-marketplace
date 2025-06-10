import { Helius } from 'helius-sdk';

export interface HeliusNFT {
  id: string;
  image: string;
  name: string;
  listed: boolean;
  attributes?: { trait_type: string; value: string }[];
}