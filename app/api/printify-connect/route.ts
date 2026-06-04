import { NextRequest, NextResponse } from "next/server";
import supabase from "@/libs/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, storeUrl } = body;

    if (!userId || !storeUrl) {
      return NextResponse.json({ error: "Missing userId or storeUrl" }, { status: 400 });
    }

    const shopId = extractShopIdFromUrl(storeUrl);
    const shopName = extractShopNameFromUrl(storeUrl);

    if (!shopId) {
      return NextResponse.json(
        { error: "Invalid store URL format. Please use format: yourstore.printify.me" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("users").update({
      printify_shop_id: shopId,
      printify_store_name: shopName,
      printify_store_url: storeUrl,
      printify_connected: true,
    }).eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true, shopId, shopName: `Store ${shopId}` });
  } catch (error) {
    console.error("❌ API error:", error);
    return NextResponse.json({ error: "Failed to connect store" }, { status: 500 });
  }
}

function extractShopNameFromUrl(url: string): string | null {
  try {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;
    const urlObj = new URL(cleanUrl);
    if (urlObj.hostname.includes("printify.me")) return urlObj.hostname.split(".")[0];
    if (urlObj.hostname.includes("printify.com")) {
      const parts = urlObj.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("shop");
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    }
    if (!url.includes(".") && !url.includes("/")) return url;
    return null;
  } catch {
    return null;
  }
}

function extractShopIdFromUrl(url: string): string | null {
  try {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;
    const urlObj = new URL(cleanUrl);
    if (urlObj.hostname.includes("printify.me")) return urlObj.hostname.split(".")[0];
    if (urlObj.hostname.includes("printify.com")) {
      const parts = urlObj.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("shop");
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    }
    if (!url.includes(".") && !url.includes("/")) return url;
    return null;
  } catch {
    return null;
  }
}
