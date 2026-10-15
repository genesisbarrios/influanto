import type { Metadata } from "next";
import { verifyUnsubscribeToken } from "@/libs/unsubscribe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Unsubscribe | Influanto", robots: { index: false, follow: false } };

const COPY = {
  contact: "Stop receiving this artist's newsletter?",
  user: "Stop receiving product updates and tips from Influanto?",
  curator: "Stop receiving playlist pitches sent through Influanto?",
} as const;

// The footer link lands here and asks to confirm (a POST), so email link
// scanners and prefetchers can't unsubscribe anyone by just opening the URL.
export default function UnsubscribePage({ searchParams }: { searchParams: { token?: string; done?: string } }) {
  const card = "max-w-md mx-auto mt-24 bg-white text-gray-900 rounded-2xl shadow-lg p-8 text-center";
  if (searchParams.done) {
    return (
      <main className="min-h-screen px-4">
        <div className={card}>
          <h1 className="text-2xl font-bold mb-2">You&apos;re unsubscribed</h1>
          <p className="text-gray-600">You won&apos;t receive these emails anymore.</p>
        </div>
      </main>
    );
  }
  const parsed = verifyUnsubscribeToken(searchParams.token);
  if (!parsed) {
    return (
      <main className="min-h-screen px-4">
        <div className={card}>
          <h1 className="text-2xl font-bold mb-2">Link not valid</h1>
          <p className="text-gray-600">This unsubscribe link is invalid or incomplete. Try the link from the email again.</p>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen px-4">
      <div className={card}>
        <h1 className="text-2xl font-bold mb-2">Unsubscribe</h1>
        <p className="text-gray-600 mb-6">{COPY[parsed.kind]}</p>
        <form method="POST" action="/api/unsubscribe">
          <input type="hidden" name="token" value={searchParams.token} />
          <button type="submit" className="btn btn-primary w-full">Unsubscribe</button>
        </form>
      </div>
    </main>
  );
}
