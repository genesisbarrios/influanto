const PUBLISHER =
  process.env.WALRUS_PUBLISHER_URL ?? "https://publisher.walrus-testnet.walrus.space";
const AGGREGATOR =
  process.env.WALRUS_AGGREGATOR_URL ?? "https://aggregator.walrus-testnet.walrus.space";

const UPLOAD_TIMEOUT_MS = 60_000; // 60 s — audio files can be large

/**
 * Upload raw bytes to the Walrus Publisher.
 * Returns the blob ID assigned by the network.
 */
export async function uploadToWalrus(
  data: ArrayBuffer | Buffer | Uint8Array,
  epochs = 5
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${PUBLISHER}/v1/blobs?epochs=${epochs}`, {
      method: "PUT",
      body: data as BodyInit,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Walrus publisher returned ${res.status}: ${text || "(no body)"}`);
  }

  const json = await res.json();

  // Publisher returns either newlyCreated or alreadyCertified
  const blobId: string | undefined =
    json?.newlyCreated?.blobObject?.blobId ?? json?.alreadyCertified?.blobId;

  if (!blobId) {
    throw new Error(
      `Walrus upload returned no blobId. Raw response: ${JSON.stringify(json).slice(0, 300)}`
    );
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
  return `${AGGREGATOR}/v1/blobs/${blobId}`;
}
