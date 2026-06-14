import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { ethers } from "ethers";

export const dynamic = "force-dynamic";

const AMOY_RPC = "https://rpc-amoy.polygon.technology";
const DRIP_AMOUNT = ethers.parseEther("0.015"); // covers gas at ~60 Gwei with auto-estimated gas
const MIN_BALANCE  = ethers.parseEther("0.005"); // drip only if below this

export async function POST() {
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

  // Get user's primary wallet address
  const { data: user } = await supabase
    .from("users")
    .select("wallet_addresses")
    .eq("id", session.user.id)
    .single();

  const to = (user?.wallet_addresses ?? [])[0];
  if (!to || !ethers.isAddress(to)) {
    return NextResponse.json({ error: "No wallet address on file" }, { status: 400 });
  }

  const provider = new ethers.JsonRpcProvider(AMOY_RPC, 80002);

  // Check recipient balance — skip drip if already funded
  const recipientBalance = await provider.getBalance(to);
  if (recipientBalance >= MIN_BALANCE) {
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
