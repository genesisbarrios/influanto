import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { ethers } from "ethers";

export const dynamic = "force-dynamic";

const AMOY_RPC = "https://rpc-amoy.polygon.technology";
const DRIP_AMOUNT = ethers.parseEther("0.015"); // covers gas at ~60 Gwei with auto-estimated gas

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const dripKey = process.env.INFLUANTO_ENS_OWNER_PRIVATE_KEY;
  if (!dripKey) {
    return NextResponse.json(
      { error: "Drip wallet not configured." },
      { status: 503 }
    );
  }

  // Get user's registered wallet addresses
  const { data: user } = await supabase
    .from("users")
    .select("wallet_addresses")
    .eq("id", session.user.id)
    .single();

  const registeredAddresses: string[] = user?.wallet_addresses ?? [];

  // Caller can specify which address to drip to (e.g. embedded Privy wallet).
  // Fall back to the primary stored address. Always validate against registered list.
  let to: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.to && ethers.isAddress(body.to)) {
      to = ethers.getAddress(body.to); // normalize checksum
    }
  } catch { /* ignore parse errors */ }

  if (!to) to = registeredAddresses[0];

  if (!to || !ethers.isAddress(to)) {
    return NextResponse.json({ error: "No wallet address on file" }, { status: 400 });
  }

  // Verify the requested address belongs to this user
  const isOwned = registeredAddresses.some(
    (a) => a.toLowerCase() === to!.toLowerCase()
  );
  if (!isOwned) {
    return NextResponse.json({ error: "Address not registered to this account" }, { status: 403 });
  }

  const provider = new ethers.JsonRpcProvider(AMOY_RPC, 80002);

  // Only skip drip if balance is already well above the drip amount itself
  const recipientBalance = await provider.getBalance(to);
  if (recipientBalance >= DRIP_AMOUNT) {
    return NextResponse.json({
      skipped: true,
      balance: ethers.formatEther(recipientBalance),
      message: "Wallet already has sufficient POL",
    });
  }

  const dripWallet = new ethers.Wallet(dripKey, provider);

  // Check drip wallet has enough to send
  const dripBalance = await provider.getBalance(dripWallet.address);
  if (dripBalance < DRIP_AMOUNT) {
    console.error(
      `Drip wallet ${dripWallet.address} is low: ${ethers.formatEther(dripBalance)} POL`
    );
    return NextResponse.json(
      { error: "Drip wallet is empty. Please refill it with Amoy testnet POL." },
      { status: 503 }
    );
  }

  try {
    const tx = await dripWallet.sendTransaction({ to, value: DRIP_AMOUNT });
    console.log(`Drip sent ${ethers.formatEther(DRIP_AMOUNT)} POL to ${to}, tx: ${tx.hash}`);
    await tx.wait();
    return NextResponse.json({ success: true, txHash: tx.hash, amount: "0.002" });
  } catch (err: any) {
    console.error("Drip failed:", err?.message);
    return NextResponse.json({ error: "Drip transaction failed", detail: err?.message }, { status: 500 });
  }
}
