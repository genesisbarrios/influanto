import { getMusicNftContract } from './polkadot-api';
import { CONTRACT_CONFIG } from './contract-config';
import type { MusicNFTData, ContractResult } from '@/types/contract';

export class MusicNftContractInterface {
  
  // Mint a single track NFT
  async mintSingle(
    signer: any,
    nftData: {
      title: string;
      description: string;
      artist: string;
      metadataIpfs: string;
      imageIpfs?: string;
      audioIpfs: string;
      genres: string[];
      releaseDate?: number;
      bpm?: number;
      lyrics?: string;
      priceUsd: number;
      editionSize: number;
      royaltyPercentage: number;
      groupId?: string;
    }
  ): Promise<ContractResult<number>> {
    try {
      const contract = await getMusicNftContract();
      
      const gasLimit = CONTRACT_CONFIG.GAS_LIMITS.MINT_SINGLE;
      const storageDepositLimit = null;
      
      const result = await contract.tx.mintSingle(
        { gasLimit, storageDepositLimit },
        nftData.title,
        nftData.description,
        nftData.artist,
        nftData.metadataIpfs,
        nftData.imageIpfs || null,
        nftData.audioIpfs,
        nftData.genres,
        nftData.releaseDate || null,
        nftData.bpm || null,
        nftData.lyrics || null,
        nftData.priceUsd,
        nftData.editionSize,
        nftData.royaltyPercentage,
        nftData.groupId || null
      ).signAndSend(signer);

      return { success: true, data: result.toString() as unknown as number };
    } catch (error) {
      console.error('Error minting single:', error);
      return { success: false, error: error.message };
    }
  }

  // Mint an album NFT
  async mintAlbum(
    signer: any,
    albumData: {
      title: string;
      description: string;
      artist: string;
      metadataIpfs: string;
      imageIpfs?: string;
      tracks: Array<{
        title: string;
        artist: string;
        audioIpfs: string;
        imageIpfs?: string;
        bpm?: number;
        lyrics?: string;
        trackNumber: number;
        duration?: number;
      }>;
      genres: string[];
      releaseDate?: number;
      priceUsd: number;
      editionSize: number;
      royaltyPercentage: number;
      albumType: string;
      groupId?: string;
    }
  ): Promise<ContractResult<number>> {
    try {
      const contract = await getMusicNftContract();
      
      const gasLimit = CONTRACT_CONFIG.GAS_LIMITS.MINT_ALBUM;
      const storageDepositLimit = null;
      
      const result = await contract.tx.mintAlbum(
        { gasLimit, storageDepositLimit },
        albumData.title,
        albumData.description,
        albumData.artist,
        albumData.metadataIpfs,
        albumData.imageIpfs || null,
        albumData.tracks,
        albumData.genres,
        albumData.releaseDate || null,
        albumData.priceUsd,
        albumData.editionSize,
        albumData.royaltyPercentage,
        albumData.albumType,
        albumData.groupId || null
      ).signAndSend(signer);

      return { success: true, data: result.toString() as unknown as number };
    } catch (error) {
      console.error('Error minting album:', error);
      return { success: false, error: error.message };
    }
  }

  // Purchase a token
  async purchaseToken(
    signer: any,
    tokenId: number,
    paymentAmount: number
  ): Promise<ContractResult<number>> {
    try {
      const contract = await getMusicNftContract();
      
      const gasLimit = CONTRACT_CONFIG.GAS_LIMITS.PURCHASE;
      const storageDepositLimit = null;
      const value = paymentAmount;
      
      const result = await contract.tx.purchaseToken(
        { gasLimit, storageDepositLimit, value },
        tokenId
      ).signAndSend(signer);

      return { success: true, data: result.toString() as unknown as number };
    } catch (error) {
      console.error('Error purchasing token:', error);
      return { success: false, error: error.message };
    }
  }

  // Query functions
  async getNft(tokenId: number): Promise<ContractResult<MusicNFTData>> {
    try {
      const contract = await getMusicNftContract();
      
      const gasLimit = CONTRACT_CONFIG.GAS_LIMITS.QUERY;
      const storageDepositLimit = null;
      
      const result = await contract.query.getNft(
        '', // caller (empty string as default address)
        { gasLimit, storageDepositLimit },
        tokenId
      );

      if (result.result.isOk) {
        return { success: true, data: result.output?.toJSON() as unknown as MusicNFTData };
      } else {
        return { success: false, error: 'Query failed' };
      }
    } catch (error) {
      console.error('Error querying NFT:', error);
      return { success: false, error: error.message };
    }
  }

  async getNftsByArtist(artist: string): Promise<ContractResult<number[]>> {
    try {
      const contract = await getMusicNftContract();
      
      const gasLimit = CONTRACT_CONFIG.GAS_LIMITS.QUERY;
      const storageDepositLimit = null;
      
      const result = await contract.query.getNftsByArtist(
        '',
        { gasLimit, storageDepositLimit },
        artist
      );

      if (result.result.isOk) {
        return { success: true, data: result.output?.toJSON() as number[] };
      } else {
        return { success: false, error: 'Query failed' };
      }
    } catch (error) {
      console.error('Error querying NFTs by artist:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllTokens(): Promise<ContractResult<number[]>> {
    try {
      const contract = await getMusicNftContract();
      
      const gasLimit = CONTRACT_CONFIG.GAS_LIMITS.QUERY;
      const storageDepositLimit = null;
      
      const result = await contract.query.getAllTokens(
        '',
        { gasLimit, storageDepositLimit }
      );

      if (result.result.isOk) {
        return { success: true, data: result.output?.toJSON() as number[] };
      } else {
        return { success: false, error: 'Query failed' };
      }
    } catch (error) {
      console.error('Error querying all tokens:', error);
      return { success: false, error: error.message };
    }
  }
}

export const musicNftContract = new MusicNftContractInterface();