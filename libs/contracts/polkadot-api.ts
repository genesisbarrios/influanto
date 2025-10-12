import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { CONTRACT_CONFIG } from './contract-config';
import musicNftAbiJson from './music-collectible-abi.json';

type AbiJson = { abi?: unknown };
const musicNftAbi = (musicNftAbiJson as AbiJson).abi ? (musicNftAbiJson as AbiJson).abi : musicNftAbiJson;

let api: ApiPromise | null = null;
let contract: ContractPromise | null = null;

export async function getPolkadotApi(): Promise<ApiPromise> {
  if (!api) {
    const provider = new WsProvider(CONTRACT_CONFIG.NETWORK.RPC_URL);
    api = await ApiPromise.create({ provider });
  }
  return api;
}

export async function getMusicNftContract(): Promise<ContractPromise> {
  if (!contract) {
    const apiInstance = await getPolkadotApi();
    contract = new ContractPromise(
      apiInstance,
      musicNftAbi,
      CONTRACT_CONFIG.CONTRACT_ADDRESS
    );
  }
  return contract;
}

export async function disconnectApi(): Promise<void> {
  if (api) {
    await api.disconnect();
    api = null;
    contract = null;
  }
}