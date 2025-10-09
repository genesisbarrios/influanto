// libs/stoacha.ts
import { create } from "@storacha/client";

let clientPromise = create({
  token: process.env.NEXT_PUBLIC_STORACHA_API_KEY!,
});

export const uploadToStoracha = async (file: File): Promise<string> => {
  const result = await client.upload(file);
  // Stoacha returns the CID or URL depending on your configuration
  return result.cid ? `ipfs://${result.cid}` : result.url;
};

export const uploadMetadata = async (metadata: object): Promise<string> => {
  const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
  const file = new File([blob], "metadata.json");
  return uploadToStoacha(file);
};
