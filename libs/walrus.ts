const PUBLISHER =
  process.env.WALRUS_PUBLISHER_URL ?? "https://publisher.walrus-testnet.walrus.space";
const AGGREGATOR =
  process.env.WALRUS_AGGREGATOR_URL ?? "https://aggregator.walrus-testnet.walrus.space";

/**
 * Upload raw bytes to the Walrus Publisher.
 * Returns the blob ID assigned by the network.
 */
export async function uploadToWalrus(
  data: ArrayBuffer | Buffer | Uint8Array,
  epochs = 5
): Promise<string> {
  const res = await fetch(`${PUBLISHER}/v1/store?epochs=${epochs}`, {
    method: "PUT",
    body: data as BodyInit,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Walrus upload failed (${res.status}): ${text}`);
  }

  const json = await res.json();

  // Publisher returns either newlyCreated or alreadyCertified
  const blobId: string | undefined =
    json?.newlyCreated?.blobObject?.blobId ?? json?.alreadyCertified?.blobId;

  if (!blobId) {
    throw new Error(`Walrus upload returned no blobId — response: ${JSON.stringify(json)}`);
  }

  return blobId;
}

/** Upload a JSON object to Walrus. Returns the blob ID. */
export async function uploadJsonToWalrus(obj: unknown, epochs = 5): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  return uploadToWalrus(bytes, epochs);
}

/** Returns the public URL to read a blob via the aggregator. */
export function walrusUrl(blobId: string): string {
  return `${AGGREGATOR}/v1/${blobId}`;
}
