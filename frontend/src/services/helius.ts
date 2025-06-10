// Work In Progress service wrapper around the helius-sdk
import { Helius } from 'helius-sdk';

export interface HeliusNFT {
  id: string;
  image: string;
  name: string;
  listed: boolean;
  attributes?: { trait_type: string; value: string }[];
}

// TODO: Implement HeliusService methods
// This module currently only defines types and is subject to change.
