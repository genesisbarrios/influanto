import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify, faApple } from "@fortawesome/free-brands-svg-icons";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import UrlAnatomy from "./UrlAnatomy";

export default function ArtistIdHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col text-black">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">How to find your artist ID</h3>
            <p className="text-sm text-gray-500 mt-0.5">You only need to do this once per platform</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            <FontAwesomeIcon icon={faXmark} style={{ height: "1em" }} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          {/* Spotify */}
          <div>
            <p className="font-semibold text-sm flex items-center gap-2 mb-2">
              <FontAwesomeIcon icon={faSpotify} style={{ height: "1em", color: "#1DB954" }} /> Spotify
            </p>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1 mb-2">
              <li>Open <span className="font-medium">open.spotify.com</span> (or the app) and go to your artist profile</li>
              <li>Click the <span className="font-medium">••• (more)</span> button next to your name</li>
              <li>Choose <span className="font-medium">Share → Copy link to artist</span></li>
            </ol>
            <UrlAnatomy before="open.spotify.com/artist/" id="3TVXtAsR1Inumwj472S9r4" />
            <p className="text-xs text-gray-400 mt-1">The 22-character code after <span className="font-mono">/artist/</span> is your ID.</p>
          </div>

          {/* Apple Music */}
          <div>
            <p className="font-semibold text-sm flex items-center gap-2 mb-2">
              <FontAwesomeIcon icon={faApple} style={{ height: "1em" }} /> Apple Music
            </p>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1 mb-2">
              <li>Open <span className="font-medium">music.apple.com</span> and search for your artist page</li>
              <li>Copy the page's URL from your browser's address bar</li>
              <li>Paste everything after <span className="font-mono">music.apple.com/</span> into the field</li>
            </ol>
            <UrlAnatomy before="music.apple.com/" id="us/artist/your-artist-name/1440833725" />
            <p className="text-xs text-gray-400 mt-1">Include the locale, "artist", your name, and the number — all of it.</p>
          </div>

          {/* Tidal */}
          <div>
            <p className="font-semibold text-sm flex items-center gap-2 mb-2">
              <img src="/tidal.png" width={14} alt="" /> Tidal
            </p>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1 mb-2">
              <li>Open <span className="font-medium">tidal.com</span> and go to your artist page</li>
              <li>Click the <span className="font-medium">••• (more)</span> menu → <span className="font-medium">Share</span></li>
              <li>Copy the link — the number at the end is your ID</li>
            </ol>
            <UrlAnatomy before="tidal.com/artist/" id="4099663" />
          </div>

          <div className="border-t pt-4 text-sm">
            <p className="text-gray-500">
              Need Amazon Music, Pandora, Deezer, or Qobuz too?{" "}
              <Link href="/blog/how-to-find-your-spotify-artist-id" target="_blank" className="text-indigo-600 font-medium hover:underline">
                Read the full guide →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
