import { RpcProvider } from 'starknet';
import { NETWORK } from './addresses';

export function getPublicRpcUrl(): string {
  // Correct mapping: sepolia testnet vs mainnet
  if (NETWORK === 'sepolia' || NETWORK === 'testnet') {
    return 'https://starknet-sepolia.public.blastapi.io';
  }
  return 'https://starknet-mainnet.public.blastapi.io';
}

export function getProvider() {
  return new RpcProvider({ nodeUrl: getPublicRpcUrl() });
}

