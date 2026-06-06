// Client-side helpers for deleting Cloudinary images via /api/delete-image.

// Extract the Cloudinary public_id (including folders) from a delivery URL.
// e.g. https://res.cloudinary.com/x/image/upload/v123/folder/name.png -> folder/name
export function cloudinaryPublicId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+(?:\?.*)?$/);
  return m ? m[1] : null;
}

// Best-effort delete — never throws (orphaned images are not worth blocking the UI).
export async function deleteCloudinaryImage(url?: string | null): Promise<void> {
  const publicId = cloudinaryPublicId(url || "");
  if (!publicId) return;
  try {
    await fetch("/api/delete-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });
  } catch {
    /* ignore */
  }
}
