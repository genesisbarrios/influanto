"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { polygonAmoy } from "viem/chains";

export default function PrivyClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // Render children without Privy if the app ID isn't configured yet
  if (!appId) return <>{children}</>;

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "google", "wallet"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: polygonAmoy,
        supportedChains: [polygonAmoy],
        appearance: {
          theme: "dark",
          walletList: ["detected_wallets", "metamask", "rainbow", "coinbase_wallet", "wallet_connect"],
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
