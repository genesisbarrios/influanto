import { PinataSDK } from "pinata-web3";

// Initialize Pinata client
const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!, // Optional: your custom gateway
});

// Alternative initialization if using API keys instead of JWT
// const pinata = new PinataSDK({
//   pinataApiKey: process.env.PINATA_API_KEY!,
//   pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY!,
//   pinataGateway: process.env.PINATA_GATEWAY!,
// });

export const uploadToPinata = async (file: File): Promise<string> => {
  try {
    console.log('Uploading file to Pinata:', file.name);
    
    const upload = await pinata.upload.file(file);
    
    console.log('Upload successful:', upload);
    
    // Return IPFS URL
    return `ipfs://${upload.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading file to Pinata:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const uploadMetadata = async (metadata: object): Promise<string> => {
  try {
    console.log('Uploading metadata to Pinata:', metadata);
    
    const upload = await pinata.upload.json(metadata);
    
    console.log('Metadata upload successful:', upload);
    
    // Return IPFS URL
    return `ipfs://${upload.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading metadata to Pinata:', error);
    throw new Error(`Failed to upload metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Upload file with additional options
export const uploadFileToPinata = async (
  file: File, 
  options?: {
    name?: string;
    keyvalues?: Record<string, string>;
    groupId?: string;
  }
): Promise<string> => {
  try {
    const uploadOptions: any = {};
    
    if (options?.name) {
      uploadOptions.metadata = {
        name: options.name,
        ...(options.keyvalues && { keyvalues: options.keyvalues })
      };
    }
    
    if (options?.groupId) {
      uploadOptions.groupId = options.groupId;
    }
    
    const upload = await pinata.upload.file(file, uploadOptions);
    
    return `ipfs://${upload.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading file to Pinata:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get file from Pinata (using gateway)
export const getFileFromPinata = (ipfsHash: string): string => {
  const gateway = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud';
  return `${gateway}/ipfs/${ipfsHash}`;
};

// Pin existing file by CID
// export const pinByCID = async (cid: string, name?: string): Promise<void> => {
//   try {
//     await pinata.pinByHash(cid, {
//       ...(name && { metadata: { name } })
//     });
//     console.log(`Successfully pinned CID: ${cid}`);
//   } catch (error) {
//     console.error('Error pinning CID:', error);
//     throw new Error(`Failed to pin CID: ${error instanceof Error ? error.message : 'Unknown error'}`);
//   }
//};

// List pinned files
export const listPinnedFiles = async (options?: {
  limit?: number;
  offset?: number;
  metadata?: Record<string, string>;
}) => {
  try {
    const files = await pinata.listFiles();
    
    return files;
  } catch (error) {
    console.error('Error listing pinned files:', error);
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Delete/unpin file
export const unpinFile = async (ipfsHash: string): Promise<void> => {
  try {
    await pinata.unpin([ipfsHash]);
    console.log(`Successfully unpinned: ${ipfsHash}`);
  } catch (error) {
    console.error('Error unpinning file:', error);
    throw new Error(`Failed to unpin file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Test Pinata connection
export const testPinataConnection = async (): Promise<boolean> => {
  try {
    const testData = await pinata.testAuthentication();
    console.log('Pinata connection test successful:', testData);
    return true;
  } catch (error) {
    console.error('Pinata connection test failed:', error);
    return false;
  }
};

// Batch upload multiple files
export const uploadMultipleFiles = async (
  files: File[],
  options?: { groupId?: string }
): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => 
      uploadToPinata(file)
    );
    
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw new Error(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export default pinata;