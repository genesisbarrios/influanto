"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause, faXmark, faMusic } from "@fortawesome/free-solid-svg-icons";
import { getAutoplaySource, PAUSE_MUSIC_EVENT } from "@/libs/autoplay";

// Floating mini player for a link-in-bio autoplay song (SoundCloud or audio file).
// Browsers block audio with sound until the visitor interacts with the page, so
// it tries to start right away and otherwise starts on the visitor's first tap.
// It pauses whenever a YouTube embed or any other <video>/<audio> starts playing.

declare global {
  interface Window { SC?: any }
}

const SC_API = "https://w.soundcloud.com/player/api.js";

function loadScApi(): Promise<any> {
  if (window.SC?.Widget) return Promise.resolve(window.SC);
  return new Promise((resolve, reject) => {
    let s = document.querySelector<HTMLScriptElement>(`script[src="${SC_API}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = SC_API;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => resolve(window.SC));
    s.addEventListener("error", reject);
  });
}

export default function AutoplayPlayer({ url, accentColor = "#2563eb" }: { url: string; accentColor?: string }) {
  const source = getAutoplaySource(url);
  const audioRef = useRef<HTMLAudioElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [title, setTitle] = useState("");
  const [closed, setClosed] = useState(false);
  // Once the visitor pauses (or a video takes over), don't auto-resume on later taps
  const userStopped = useRef(false);
  const playingRef = useRef(false);
  playingRef.current = playing;

  const play = useCallback(() => {
    if (source === "audio") {
      audioRef.current?.play().then(() => setNeedsTap(false)).catch(() => setNeedsTap(true));
    } else {
      widgetRef.current?.play();
    }
  }, [source]);

  const pause = useCallback(() => {
    if (source === "audio") audioRef.current?.pause();
    else widgetRef.current?.pause();
  }, [source]);

  // Autoplay attempt + first-gesture fallback
  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    let tapTimer: number | undefined;

    const onFirstGesture = () => {
      if (!userStopped.current && !playingRef.current) play();
    };
    document.addEventListener("pointerdown", onFirstGesture, { once: true, capture: true });
    document.addEventListener("keydown", onFirstGesture, { once: true, capture: true });

    if (source === "audio") {
      play();
    } else {
      loadScApi().then((SC) => {
        if (cancelled || !iframeRef.current) return;
        const w = SC.Widget(iframeRef.current);
        widgetRef.current = w;
        w.bind(SC.Widget.Events.READY, () => {
          w.getCurrentSound((s: any) => s?.title && setTitle(s.title));
          w.play();
          // The widget doesn't report a blocked autoplay — if it isn't playing soon, ask for a tap
          tapTimer = window.setTimeout(() => !playingRef.current && setNeedsTap(true), 1500);
        });
        w.bind(SC.Widget.Events.PLAY, () => { setPlaying(true); setNeedsTap(false); });
        w.bind(SC.Widget.Events.PAUSE, () => setPlaying(false));
        w.bind(SC.Widget.Events.FINISH, () => setPlaying(false));
      }).catch(() => setNeedsTap(true));
    }

    return () => {
      cancelled = true;
      window.clearTimeout(tapTimer);
      document.removeEventListener("pointerdown", onFirstGesture, { capture: true } as any);
      document.removeEventListener("keydown", onFirstGesture, { capture: true } as any);
    };
  }, [source, play]);

  // Pause when other media starts: <video>/<audio> elements, YouTube embeds, or a custom event
  useEffect(() => {
    if (!source) return;
    const stopForOtherMedia = () => {
      if (!playingRef.current) return;
      userStopped.current = true;
      pause();
    };

    const onMediaPlay = (e: Event) => { if (e.target !== audioRef.current) stopForOtherMedia(); };
    document.addEventListener("play", onMediaPlay, true);
    window.addEventListener(PAUSE_MUSIC_EVENT, stopForOtherMedia);

    // YouTube iframes report state changes once we register as a listener
    const onMessage = (e: MessageEvent) => {
      if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
      try {
        const msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        const state = msg?.event === "onStateChange" ? msg.info : msg?.info?.playerState;
        if (state === 1) stopForOtherMedia(); // 1 = playing
      } catch { /* not a YouTube API message */ }
    };
    window.addEventListener("message", onMessage);
    const listened = new WeakSet<HTMLIFrameElement>();
    const registerYouTube = () => {
      document.querySelectorAll<HTMLIFrameElement>('iframe[src*="youtube.com/embed"], iframe[src*="youtube-nocookie.com/embed"]').forEach((f) => {
        if (listened.has(f)) return;
        const hello = () => f.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: Math.random().toString(36).slice(2) }), "*");
        f.addEventListener("load", hello);
        hello();
        listened.add(f);
      });
    };
    registerYouTube();
    const iv = window.setInterval(registerYouTube, 2000); // embeds can render after the player

    return () => {
      document.removeEventListener("play", onMediaPlay, true);
      window.removeEventListener(PAUSE_MUSIC_EVENT, stopForOtherMedia);
      window.removeEventListener("message", onMessage);
      window.clearInterval(iv);
    };
  }, [source, pause]);

  if (!source || closed) return null;

  const toggle = () => {
    if (playing) { userStopped.current = true; pause(); }
    else { userStopped.current = false; play(); }
  };
  const label = title || (source === "audio" ? decodeURIComponent(url.split("/").pop()?.split("?")[0] || "").replace(/\.[a-z0-9]+$/i, "") : "");

  return (
    <>
      {source === "audio" ? (
        <audio
          ref={audioRef}
          src={url}
          preload="auto"
          onPlay={() => { setPlaying(true); setNeedsTap(false); }}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      ) : (
        <iframe
          ref={iframeRef}
          title="Autoplay song"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&visual=false&show_comments=false&buying=false&sharing=false`}
          style={{ position: "fixed", width: 1, height: 1, opacity: 0, pointerEvents: "none", bottom: 0, left: 0, border: 0 }}
        />
      )}

      <div
        style={{
          position: "fixed", left: "50%", bottom: 16, transform: "translateX(-50%)", zIndex: 50,
          display: "flex", alignItems: "center", gap: 10, maxWidth: "calc(100vw - 32px)",
          background: "rgba(17,24,39,0.88)", color: "#fff", borderRadius: 999, padding: "6px 8px 6px 6px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", fontSize: 13,
        }}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause music" : "Play music"}
          style={{
            width: 36, height: 36, borderRadius: 999, border: 0, background: accentColor, color: "#fff", cursor: "pointer", flexShrink: 0,
            animation: needsTap && !playing ? "autoplayPulse 1.4s ease-in-out infinite" : undefined,
          }}
        >
          <FontAwesomeIcon icon={playing ? faPause : faPlay} />
        </button>
        <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <FontAwesomeIcon icon={faMusic} style={{ opacity: 0.7, flexShrink: 0 }} />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
            {needsTap && !playing ? "Tap to play music" : label || (playing ? "Now playing" : "Paused")}
          </span>
        </span>
        <button
          type="button"
          onClick={() => { userStopped.current = true; pause(); setClosed(true); }}
          aria-label="Close music player"
          style={{ width: 28, height: 28, borderRadius: 999, border: 0, background: "transparent", color: "#fff", opacity: 0.7, cursor: "pointer", flexShrink: 0 }}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
        <style>{`@keyframes autoplayPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.5); } 50% { box-shadow: 0 0 0 8px rgba(255,255,255,0); } }`}</style>
      </div>
    </>
  );
}
