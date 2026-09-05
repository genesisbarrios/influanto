"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Footer from "@/components/Footer";
import * as Tone from "tone";
import nextDynamic from "next/dynamic";
import Header from "@/components/Header";
import { Stage, Layer, Line } from "react-konva";
import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";

type BlobPart = any; 

const SYNTH_TYPES = [
  { label: "Synth", value: "Synth" },
  { label: "AMSynth", value: "AMSynth" },
  { label: "FMSynth", value: "FMSynth" },
  { label: "MonoSynth", value: "MonoSynth" }
];

const OSC_TYPES = [
  { label: "Sine", value: "sine", svg: SineSVG },
  { label: "Triangle", value: "triangle", svg: TriangleSVG },
  { label: "Square", value: "square", svg: SquareSVG },
  { label: "Sawtooth", value: "sawtooth", svg: SawtoothSVG }
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// SVGs for oscillator waveforms
function SineSVG() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <path
        d="M0,16
           Q4,8 8,16
           Q12,24 16,16
           Q20,8 24,16
           Q28,24 32,16"
        fill="none"
        stroke="#6366f1"
        strokeWidth="3"
      />
    </svg>
  );
}
function TriangleSVG() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <polyline fill="none" stroke="#6366f1" strokeWidth="3" points="0,24 8,8 24,24 32,8" />
    </svg>
  );
}
function SquareSVG() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <polyline fill="none" stroke="#6366f1" strokeWidth="3" points="0,24 8,24 8,8 24,8 24,24 32,24" />
    </svg>
  );
}
function SawtoothSVG() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <polyline fill="none" stroke="#6366f1" strokeWidth="3" points="0,24 8,8 8,24 16,8 16,24 24,8 24,24 32,8" />
    </svg>
  );
}

// SVGs for transport controls
function RecordSVG({ overdub }: { overdub?: boolean }) {
  return (
    <span style={{ marginLeft: 16, display: "inline-block" }}>
      <svg width="32" height="32" viewBox="0 0 32 32">
        <circle
          cx="16"
          cy="16"
          r={overdub ? 9 : 12} // smaller when pink
          fill={overdub ? "#ff4dcb" : "#dc2626"}
        />
      </svg>
    </span>
  );
}

function PlaySVG() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <polygon points="10,6 26,16 10,26" fill="#22c55e" />
    </svg>
  );
}
function StopSVG() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <rect x="8" y="8" width="16" height="16" rx="3" fill="#dc2626" />
    </svg>
  );
}

function TrashSVG() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      {/* Lid */}
      <rect x="10" y="7" width="12" height="4" rx="2" fill="#e11d74" />
      {/* Lid handle */}
      <rect x="14" y="5" width="4" height="2" rx="1" fill="#e11d74" />
      {/* Body */}
      <rect x="10" y="12" width="12" height="12" rx="2" fill="#e11d74" />
      {/* Trash lines */}
      <rect x="13" y="16" width="2" height="6" rx="1" fill="#fff" />
      <rect x="17" y="16" width="2" height="6" rx="1" fill="#fff" />
      {/* Top rim */}
      <rect x="12" y="10" width="8" height="2" rx="1" fill="#fff" />
    </svg>
  );
}

function SaveSVG() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <rect x="6" y="6" width="20" height="20" rx="3" fill="#3f71cdff" />
      <rect x="10" y="10" width="12" height="8" rx="1" fill="#fff" />
      <rect x="14" y="20" width="4" height="4" rx="1" fill="#fff" />
    </svg>
  );
}

function SynthFader({
  label,
  value,
  onChange,
  displayValue,
  height = 70,
  width = 32,
  color = "#6366f1"
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  displayValue?: string;
  height?: number;
  width?: number;
  color?: string;
}) {
  // Allowed rolloff values for Tone.js
  const allowed = [-12, -24, -48, -96];
  const min = Math.min(...allowed);
  const max = Math.max(...allowed);

  // percent = 0 at min (-96), percent = 1 at max (-12)
  const percent = (value - min) / (max - min);
  const knobY = 12 + (height - 24) * (1 - percent);

  // Drag logic
  const dragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(value);

  function handlePointerDown(e: React.PointerEvent) {
    dragging.current = true;
    startY.current = e.clientY;
    startValue.current = value;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }
  function handlePointerMove(e: PointerEvent) {
    if (!dragging.current) return;
    const delta = startY.current - e.clientY;
    let newValue = startValue.current + ((max - min) / (height - 24)) * delta;
    // Snap to nearest allowed value
    newValue = allowed.reduce((prev, curr) =>
      Math.abs(curr - newValue) < Math.abs(prev - newValue) ? curr : prev
    );
    newValue = Math.max(min, Math.min(max, newValue));
    onChange(Number(newValue));
  }
  function handlePointerUp() {
    dragging.current = false;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }

  return (
    <div style={{ width, textAlign: "center", userSelect: "none" }}>
      <div
        style={{ cursor: "pointer", display: "inline-block" }}
        onPointerDown={handlePointerDown}
        tabIndex={0}
        aria-label={label}
      >
        <svg width={width} height={height}>
          {/* Fader track */}
          <rect x={width / 2 - 3} y={12} width={6} height={height - 24} rx={3} fill="#e5e7eb" stroke="#bbb" strokeWidth={1.5} />
          {/* Fader scale marks */}
          {allowed.map((v, i) => {
            const p = (v - min) / (max - min);
            return (
              <rect
                key={v}
                x={width / 2 - 8}
                y={12 + (height - 24) * (1 - p) - 1}
                width={16}
                height={2}
                fill="#bbb"
              />
            );
          })}
          {/* Fader knob */}
          <rect
            x={width / 2 - 10}
            y={knobY - 7}
            width={20}
            height={14}
            rx={4}
            fill={color}
            stroke="#222"
            strokeWidth={2}
            style={{ filter: "drop-shadow(0 1px 2px #2222)" }}
          />
        </svg>
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, color: "#181b20", marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color, marginTop: 1 }}>{displayValue ?? value}</div>
    </div>
  );
}

export default function Synthfluanto() {
  // --- Synth state ---
  const [synthType, setSynthType] = useState("Synth");
  const [oscType, setOscType] = useState("sine");
  const [attack, setAttack] = useState(0.01);
  const [decay, setDecay] = useState(0.4);
  const [sustain, setSustain] = useState(0.5);
  const [release, setRelease] = useState(1);
  const [glide, setGlide] = useState(0); // portamento
  const [gain, setGain] = useState(0.9);
  const [lowpass, setLowpass] = useState(20000); // Hz
  const [hipass, setHipass] = useState(20); // Hz

  // FX - Reverb/Delay
  const [reverb, setReverb] = useState(0.2);
  const [feedbackDelay, setFeedbackDelay] = useState(0); // wet
  const [feedbackDelayTime, setFeedbackDelayTime] = useState(0.25); 
  const [feedbackDelayFeedback, setFeedbackDelayFeedback] = useState(0.3); // 0-1
  const [pingPong, setPingPong] = useState(0); // wet
  const [pingPongDelayTime, setPingPongDelayTime] = useState(0.25); 
  const [pingPongFeedback, setPingPongFeedback] = useState(0.3); // 0-1

  // FX - Modulation
  const [distortion, setDistortion] = useState(0); // 0 to 1
  const [chorusWet, setChorusWet] = useState(0.5); // 0-1
  const [chorusFreq, setChorusFreq] = useState(1.5); // Hz
  const [chorusDepth, setChorusDepth] = useState(0.5); // 0-1
  const [tremolo, setTremolo] = useState(0); // depth
  const [tremoloFreq, setTremoloFreq] = useState(5); // Hz

  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [meterLevel, setMeterLevel] = useState(-60);
  const [fftData, setFftData] = useState<number[]>([]);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // --- Recording state ---
  const [recording, setRecording] = useState(false);
  const [recordedBlobs, setRecordedBlobs] = useState<{ [key: string]: Blob }>({});
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [currentMelody, setCurrentMelody] = useState("Melody 1");
  const [melodyList, setMelodyList] = useState(["Melody 1"]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [flash, setFlash] = useState(false);

  // --- Playback audio ref for stop ---
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- FX/filter/synth refs for parameter updates ---
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const gainRef = useRef<Tone.Gain | null>(null);
  const hipassRef = useRef<Tone.Filter | null>(null);
  const lowpassRef = useRef<Tone.Filter | null>(null);
  const [filterRolloff, setFilterRolloff] = useState(-24); // dB/octave, shared for both filters
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const feedbackDelayRef = useRef<Tone.FeedbackDelay | null>(null);
  const pingPongRef = useRef<Tone.PingPongDelay | null>(null);
  const distortionRef = useRef<Tone.Distortion | null>(null);
  const chorusRef = useRef<Tone.Chorus | null>(null);
  const tremoloRef = useRef<Tone.Tremolo | null>(null);
  const meterRef = useRef<Tone.Meter | null>(null);
  const fftRef = useRef<Tone.FFT | null>(null);
  const waveformRef = useRef<Tone.Waveform | null>(null);
  const waveformDataRef = useRef<number[]>([]);
  const fftDataRef = useRef<number[]>([]);

  // --- Recording stream ref ---
  const streamRef = useRef<MediaStream | null>(null);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  

  useEffect(() => {
        document.title = "Synthfluanto, the online Synthesizer | Influanto";
        
        // Update meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', 'Online Synthesizer, Online Synth, Web Synth, Free Synth, Web Synthesizer, Free Synthesizer - Synthfluanto by Influanto');
    
        // Update og:title
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
          ogTitle = document.createElement('meta');
          ogTitle.setAttribute('property', 'og:title');
          document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', 'Synthfluanto, the online Synthesizer | Influanto');
  
        // Update og:description
        let ogDescription = document.querySelector('meta[property="og:description"]');
        if (!ogDescription) {
          ogDescription = document.createElement('meta');
          ogDescription.setAttribute('property', 'og:description');
          document.head.appendChild(ogDescription);
        }
        ogDescription.setAttribute('content', 'Online Synthesizer - Synthfluanto by Influanto');
  
        // Update twitter:title
        let twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (!twitterTitle) {
          twitterTitle = document.createElement('meta');
          twitterTitle.setAttribute('name', 'twitter:title');
          document.head.appendChild(twitterTitle);
        }
        twitterTitle.setAttribute('content', 'Synthfluanto, the online Synthesizer | Influanto');
    
        // Update twitter:description
        let twitterDescription = document.querySelector('meta[name="twitter:description"]');
        if (!twitterDescription) {
          twitterDescription = document.createElement('meta');
          twitterDescription.setAttribute('name', 'twitter:description');
          document.head.appendChild(twitterDescription);
        }
        twitterDescription.setAttribute('content', 'Online Synthesizer - Synthfluanto by Influanto');
      }, []);

  // --- Synth/FX chain setup ---
  useEffect(() => {
    try { synthRef.current?.dispose(); } catch (e) { /* ignore error */ }
    try { gainRef.current?.dispose(); } catch (e) { /* ignore error */ }
    try { hipassRef.current?.dispose(); } catch (e) { /* ignore error */ }
    try { lowpassRef.current?.dispose(); } catch (e) { /* ignore error */ }
    try { reverbRef.current?.dispose(); } catch (e) { /* ignore error */ }
    try { feedbackDelayRef.current?.dispose(); } catch (e) { /* ignore error */ }
    try { pingPongRef.current && typeof pingPongRef.current.dispose === "function" && pingPongRef.current.dispose(); } catch (e) { /* ignore error */ }
    try { distortionRef.current?.dispose(); } catch (e) { /* ignore error */ }
    try { chorusRef.current && typeof chorusRef.current.dispose === "function" && chorusRef.current.dispose(); } catch (e) { /* ignore error */ }
    try { tremoloRef.current && typeof tremoloRef.current.dispose === "function" && tremoloRef.current.dispose(); } catch (e) { /* ignore error */ }
    try { meterRef.current?.dispose(); } catch (e) { /* ignore error */ }
    try { fftRef.current?.dispose(); } catch (e) { /* ignore error */ }
    try { waveformRef.current?.dispose(); } catch (e) { /* ignore error */ }

    let synth: Tone.PolySynth;
    switch (synthType) {
      case "AMSynth":
        synth = new Tone.PolySynth(Tone.AMSynth);
        break;
      case "FMSynth":
        synth = new Tone.PolySynth(Tone.FMSynth);
        break;
      case "MonoSynth":
        synth = new Tone.PolySynth(Tone.MonoSynth);
        break;
      default:
        synth = new Tone.PolySynth(Tone.Synth);
    }

   synth.set({
    envelope: { attack, decay, sustain, release },
    oscillator: { type: oscType } as any,
    portamento: glide
  });

    const hipassFilter = new Tone.Filter(hipass, "highpass");
    const lowpassFilter = new Tone.Filter(lowpass, "lowpass");
    const distortionNode = new Tone.Distortion(distortion);
    const chorusNode = new Tone.Chorus({
      frequency: chorusFreq,
      depth: chorusDepth,
      wet: chorusWet
    }).start();
    const tremoloNode = new Tone.Tremolo(tremoloFreq, tremolo).start();
    const pingPongNode = new Tone.PingPongDelay({
      delayTime: pingPongDelayTime,
      feedback: pingPongFeedback,
      wet: pingPong
    });
    const feedbackDelayNode = new Tone.FeedbackDelay({
      delayTime: feedbackDelayTime,
      feedback: feedbackDelayFeedback,
      wet: feedbackDelay
    });
    const reverbNode = new Tone.Reverb({ decay: reverb });
    const gainNode = new Tone.Gain(gain);

    // Meter, FFT, and Waveform
    const meter = new Tone.Meter();
    const fft = new Tone.FFT(64);
    const waveform = new Tone.Waveform(256);

    // Connect the chain: synth -> hipass -> lowpass -> distortion -> feedbackDelay -> pingPong -> reverb -> chorus -> tremolo -> gain
    synth.connect(hipassFilter);
    hipassFilter.connect(lowpassFilter);
    lowpassFilter.connect(distortionNode);
    distortionNode.connect(feedbackDelayNode);
    feedbackDelayNode.connect(pingPongNode);
    pingPongNode.connect(reverbNode);
    reverbNode.connect(chorusNode);
    chorusNode.connect(tremoloNode);
    tremoloNode.connect(gainNode);

    // Connect to destination
    gainNode.connect(Tone.getContext().destination);

    // Connect to meter/fft/waveform for visualization
    gainNode.connect(meter);
    gainNode.connect(fft);
    gainNode.connect(waveform);

    // Store refs for parameter updates
    synthRef.current = synth;
    gainRef.current = gainNode;
    hipassRef.current = hipassFilter;
    lowpassRef.current = lowpassFilter;
    reverbRef.current = reverbNode;
    feedbackDelayRef.current = feedbackDelayNode;
    pingPongRef.current = pingPongNode;
    distortionRef.current = distortionNode;
    chorusRef.current = chorusNode;
    tremoloRef.current = tremoloNode;
    meterRef.current = meter;
    fftRef.current = fft;
    waveformRef.current = waveform;

    // Reset recording stream so it reconnects to new gain node
    streamRef.current = null;

    return () => {
      try { synth.dispose(); } catch (e) { /* ignore error */ }
      try { gainNode.dispose(); } catch (e) { /* ignore error */ }
      try { reverbNode.dispose(); } catch (e) { /* ignore error */ }
      try { feedbackDelayNode.dispose(); } catch (e) { /* ignore error */ }
      try { pingPongNode && typeof pingPongNode.dispose === "function" && pingPongNode.dispose(); } catch (e) { /* ignore error */ }
      try { distortionNode.dispose(); } catch (e) { /* ignore error */ }
      try { chorusNode && typeof chorusNode.dispose === "function" && chorusNode.dispose(); } catch (e) { /* ignore error */ }
      try { tremoloNode && typeof tremoloNode.dispose === "function" && tremoloNode.dispose(); } catch (e) { /* ignore error */ }
      try { lowpassFilter.dispose(); } catch (e) { /* ignore error */ }
      try { hipassFilter.dispose(); } catch (e) { /* ignore error */ }
      try { meter.dispose(); } catch (e) { /* ignore error */ }
      try { fft.dispose(); } catch (e) { /* ignore error */ }
      try { waveform.dispose(); } catch (e) { /* ignore error */ }
    };
  }, [synthType, oscType, chorusFreq, chorusDepth, chorusWet, pingPongDelayTime, pingPongFeedback, feedbackDelayTime, feedbackDelayFeedback]);

  // --- Parameter updates ---
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.set({
        envelope: { attack, decay, sustain, release },
        portamento: glide
      });
    }
  }, [attack, decay, sustain, release, glide]);
  useEffect(() => { if (gainRef.current) gainRef.current.gain.value = gain; }, [gain]);
  useEffect(() => { if (lowpassRef.current) lowpassRef.current.frequency.value = lowpass; }, [lowpass]);
  useEffect(() => { if (hipassRef.current) hipassRef.current.frequency.value = hipass; }, [hipass]);
  useEffect(() => { if (reverbRef.current) reverbRef.current.decay = reverb; }, [reverb]);
  useEffect(() => { if (distortionRef.current) distortionRef.current.distortion = distortion; }, [distortion]);
  useEffect(() => {
    if (chorusRef.current) {
      chorusRef.current.frequency.value = chorusFreq;
      chorusRef.current.depth = chorusDepth;
      chorusRef.current.wet.value = chorusWet;
    }
  }, [chorusFreq, chorusDepth, chorusWet]);
  useEffect(() => {
    if (tremoloRef.current) {
      tremoloRef.current.depth.value = tremolo;
      tremoloRef.current.frequency.value = tremoloFreq;
    }
  }, [tremolo, tremoloFreq]);
  useEffect(() => {
    if (pingPongRef.current) {
      pingPongRef.current.delayTime.value = pingPongDelayTime;
      pingPongRef.current.feedback.value = pingPongFeedback;
      pingPongRef.current.wet.value = pingPong;
    }
  }, [pingPong, pingPongDelayTime, pingPongFeedback]);
  useEffect(() => {
    if (feedbackDelayRef.current) {
      feedbackDelayRef.current.delayTime.value = feedbackDelayTime;
      feedbackDelayRef.current.feedback.value = feedbackDelayFeedback;
      feedbackDelayRef.current.wet.value = feedbackDelay;
    }
  }, [feedbackDelay, feedbackDelayTime, feedbackDelayFeedback]);

   useEffect(() => {
  if (lowpassRef.current) {
    lowpassRef.current.frequency.value = lowpass;
    lowpassRef.current.rolloff = filterRolloff as Tone.FilterRollOff;
    lowpassRef.current.Q.value = 4; // moderate resonance
  }
}, [lowpass, filterRolloff]);

  useEffect(() => {
    if (hipassRef.current) {
      hipassRef.current.frequency.value = hipass;
      hipassRef.current.rolloff = filterRolloff as Tone.FilterRollOff;
    }
  }, [hipass, filterRolloff]);

  // --- Meter/FFT/Waveform polling ---
  useEffect(() => {
    let raf: number;
    function update() {
      if (meterRef.current) setMeterLevel(meterRef.current.getValue() as number);
      if (fftRef.current) {
        const fft = fftRef.current.getValue() as unknown as number[];
        setFftData(fft);
        fftDataRef.current = fft;
      }
      if (waveformRef.current) {
        const wave = waveformRef.current.getValue() as unknown as number[];
        setWaveformData(wave);
        waveformDataRef.current = wave;
      }
      raf = requestAnimationFrame(update);
    }
    update();
    return () => cancelAnimationFrame(raf);
  }, []);

  // --- Recording logic ---
  const setupStream = useCallback(() => {
    if (streamRef.current) return streamRef.current;
    // @ts-ignore
    const dest = Tone.getContext().rawContext.createMediaStreamDestination();
    if (gainRef.current) gainRef.current.connect(dest);
    streamRef.current = dest.stream;
    return streamRef.current;
  }, []);

  // Flashing effect for record button
  useEffect(() => {
    if (!recording) {
      setFlash(false);
      return;
    }
    setFlash(true);
    const interval = setInterval(() => {
      setFlash(f => !f);
    }, 500);
    return () => clearInterval(interval);
  }, [recording]);

const startRecording = async () => {
  // Get the raw AudioContext from Tone.js
  const audioCtx = Tone.getContext().rawContext;

  // Create a MediaStreamDestination for recording
  const dest = (audioCtx as AudioContext).createMediaStreamDestination();

  // Connect synth output to the destination
  if (gainRef.current) {
    try {
      gainRef.current.disconnect();
    } catch (e) { /* ignore error */ }
    gainRef.current.connect(dest);
    gainRef.current.connect(audioCtx.destination); // so user hears output
  }

  // If previous recording exists, decode and play it through the same context
  let playbackSource: AudioBufferSourceNode | null = null;
  if (audioUrl) {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(arrayBuffer);

      playbackSource = audioCtx.createBufferSource();
      playbackSource.buffer = buffer;
      playbackSource.connect(dest);
      playbackSource.connect(audioCtx.destination); // so user hears it
      playbackSource.start();
      // Do not assign playbackSource to playbackAudioRef.current, as types are incompatible
      // If you need to keep track of playbackSource, use a separate ref:
      // playbackSourceRef.current = playbackSource;
    } catch (err) {
      console.error("Error decoding previous recording:", err);
    }
  }

  // Start recording the mixed stream
  const stream = dest.stream;
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    setRecordedBlobs(prev => ({ ...prev, [currentMelody]: blob }));
    setAudioUrl(URL.createObjectURL(blob));
    setLoadedMelodyName(null);
    setRecording(false);
  };
  recorder.start();
  setMediaRecorder(recorder);
  setRecording(true);

  // When playback ends, stop recording
  if (playbackSource) {
    playbackSource.onended = () => {
      if (recorder.state !== "inactive") {
        recorder.stop();
        setRecording(false);
      }
    };
  }
};

  // Stop button stops both recording and playback
  const stopAll = () => {
    if (recording) {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
      setRecording(false);
    }
    if (playing && playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current.currentTime = 0;
      setPlaying(false);
    }
  };

  const clearRecording = () => {
  // Stop playback if playing
  if (playing && playbackAudioRef.current) {
    playbackAudioRef.current.pause();
    playbackAudioRef.current.currentTime = 0;
    setPlaying(false);
  }
  // Stop recording if recording
  if (recording && mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    setRecording(false);
  }
  // Remove audioUrl for current melody
  setAudioUrl(null);
  setLoadedMelodyName(null);
  setRecordedBlobs(prev => {
    const copy = { ...prev };
    delete copy[currentMelody];
    return copy;
  });
  sessionStorage.removeItem(`melody_${currentMelody}`);
};

  // Save as .wav (or .mp3 fallback) using webm-to-wav conversion
  const saveRecording = async () => {
    let blob = recordedBlobs[currentMelody];
    if (!blob) {
      // Not recorded locally (e.g. loaded from Saved Melodies) - fetch from audioUrl instead
      if (!audioUrl) return;
      try {
        const res = await fetch(audioUrl);
        blob = await res.blob();
      } catch (err) {
        console.error("Error fetching audio to save:", err);
        return;
      }
    }

    const fileName = (saveMelodyName.trim() || loadedMelodyName || currentMelody).replace(/[^a-zA-Z0-9_-]/g, "_") || "melody";

    // Try to decode and encode as WAV
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      // Encode WAV
      const wavBuffer = encodeWAV(audioBuffer);
      const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
      const url = URL.createObjectURL(wavBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.wav`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      // Fallback: save as webm (or mp3 if browser supports)
      const ext = blob.type.includes("mp3") ? "mp3" : "webm";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }
  };

  // WAV encoding helper
  function encodeWAV(audioBuffer: AudioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    let samples;
    if (numChannels === 2) {
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      samples = interleave(left, right);
    } else {
      samples = audioBuffer.getChannelData(0);
    }

    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, format, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * numChannels * bitDepth / 8, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, numChannels * bitDepth / 8, true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    // Write PCM samples
    floatTo16BitPCM(view, 44, samples);

    return buffer;
  }
  function interleave(left: Float32Array, right: Float32Array) {
    const length = left.length + right.length;
    const result = new Float32Array(length);
    let inputIndex = 0;
    for (let index = 0; index < length;) {
      result[index++] = left[inputIndex];
      result[index++] = right[inputIndex];
      inputIndex++;
    }
    return result;
  }
  function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }
  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  const handleAddMelody = () => {
    const nextNum = melodyList.length + 1;
    const newMelody = `Melody ${nextNum}`;
    setMelodyList(list => [...list, newMelody]);
    setCurrentMelody(newMelody);
    setAudioUrl(null);
  };

  useEffect(() => {
    const sessionData = sessionStorage.getItem(`melody_${currentMelody}`);
    if (sessionData) {
      setAudioUrl(sessionData);
    } else if (recordedBlobs[currentMelody]) {
      setAudioUrl(URL.createObjectURL(recordedBlobs[currentMelody]));
    } else {
      setAudioUrl(null);
    }
  }, [currentMelody, recordedBlobs]);

  // --- Note logic ---
  const playNote = useCallback(async (noteName: string) => {
  await Tone.start();
  setActiveNotes((prev) => {
    if (!prev.includes(noteName)) {
      synthRef.current?.triggerAttack(noteName);
      return [...prev, noteName];
    }
    return prev;
  });
}, []);

const stopNote = useCallback((noteName: string) => {
  setActiveNotes((prev) => prev.filter(n => n !== noteName));
  synthRef.current?.triggerRelease(noteName);
}, []);


  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();

  const [savedPresets, setSavedPresets] = useState<{id: string; name: string; settings: any}[]>([]);
  const [savedMelodies, setSavedMelodies] = useState<{id: string; name: string; audio_url: string}[]>([]);
  const [loadedMelodyName, setLoadedMelodyName] = useState<string | null>(null);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [showSaveMelody, setShowSaveMelody] = useState(false);
  const [savePresetName, setSavePresetName] = useState("");
  const [saveMelodyName, setSaveMelodyName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);
  const [savingMelody, setSavingMelody] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingMelodyId, setEditingMelodyId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [tuningHz, setTuningHz] = useState(440);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 700);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- MIDI support ---
  useEffect(() => {
    let midiAccess: any = null;
    function onMIDIMessage(event: any) {
      const [status, noteNumber, velocity] = event.data;
      const noteOn = status === 144 && velocity > 0;
      const noteOff = status === 128 || (status === 144 && velocity === 0);
      const octaveNum = Math.floor(noteNumber / 12) - 1;
      const noteIdx = noteNumber % 12;
      const noteNames = NOTE_NAMES;
      const note = noteNames[noteIdx];
      const noteName = `${note}${octaveNum}`;
      if (noteOn) playNote(noteName);
      if (noteOff) stopNote(noteName);
    }
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(access => {
        midiAccess = access;
        for (const input of midiAccess.inputs.values()) {
          input.onmidimessage = onMIDIMessage;
        }
      });
    }
    return () => {
      if (midiAccess) {
        for (const input of midiAccess.inputs.values()) {
          input.onmidimessage = null;
        }
      }
    };
  }, [synthType, oscType]);

  useEffect(() => {
    if (!session) return;
    fetch('/api/synth/presets').then(r => r.json()).then(d => { if (Array.isArray(d)) setSavedPresets(d); });
    fetch('/api/synth/melodies').then(r => r.json()).then(d => { if (Array.isArray(d)) setSavedMelodies(d); });
  }, [session]);

// --- Keyboard support (robust fix for stuck notes) ---
useEffect(() => {
  const keyMap: { [key: string]: string } = {
    a: "C4", w: "C#4", s: "D4", e: "D#4", d: "E4",
    f: "F4", t: "F#4", g: "G4", y: "G#4", h: "A4",
    u: "A#4", j: "B4", k: "C5", o: "C#5", l: "D5", p: "D#5", ";": "E5",
    "'": "F5"
  };

  const downHandler = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const note = keyMap[e.key.toLowerCase()];
    if (note) playNote(note);
  };
  const upHandler = (e: KeyboardEvent) => {
    const note = keyMap[e.key.toLowerCase()];
    if (note) stopNote(note);
  };

  window.addEventListener("keydown", downHandler);
  window.addEventListener("keyup", upHandler);

  return () => {
    window.removeEventListener("keydown", downHandler);
    window.removeEventListener("keyup", upHandler);
  };
// eslint-disable-next-line
}, [synthType, oscType]);

  // --- Piano keys from C2 to C6 ---
  function getFullPianoKeys() {
    const keys = [];
    for (let octave = 2; octave <= 6; octave++) {
      for (let i = 0; i < NOTE_NAMES.length; i++) {
        keys.push({
          note: NOTE_NAMES[i],
          octave,
          isBlack: NOTE_NAMES[i].includes('#'),
          midi: 12 * (octave + 1) + i
        });
      }
    }
    // Remove notes above C6
    return keys.filter(k => !(k.octave === 6 && k.note !== 'C'));
  }
  
  function getMobilePianoKeys() {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const keys = [];
  for (let octave = 4; octave <= 5; octave++) {
    for (let i = 0; i < NOTE_NAMES.length; i++) {
      // Stop at A5
      if (octave === 5 && NOTE_NAMES[i] === 'B') break;
      keys.push({
        note: NOTE_NAMES[i],
        octave,
        isBlack: NOTE_NAMES[i].includes('#'),
        midi: 12 * (octave + 1) + i
      });
      if (octave === 5 && NOTE_NAMES[i] === 'E') break;
    }
  }
  return keys;
}

  const pianoKeys = isMobile ? getMobilePianoKeys() : getFullPianoKeys();
  const groupedKeys = [];
  for (let i = 0; i < pianoKeys.length; i++) {
    const key = pianoKeys[i];
    if (!key.isBlack) {
      const blackKey = pianoKeys[i + 1] && pianoKeys[i + 1].isBlack ? pianoKeys[i + 1] : null;
      groupedKeys.push({
        white: key,
        black: blackKey
      });
    }
  }

  const handlePlayToggle = async () => {
  if (playing) {
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current.currentTime = 0;
    }
    setPlaying(false);
  } else {
    if (!audioUrl) return;

    // Ensure AudioContext is started (required for mobile)
    await Tone.start();

    // Use Tone.Player for playback so we can route to analysis nodes
    const player = new Tone.Player(audioUrl).toDestination();

    // Connect to analysis nodes
    if (meterRef.current) player.connect(meterRef.current);
    if (fftRef.current) player.connect(fftRef.current);
    if (waveformRef.current) player.connect(waveformRef.current);

    setPlaying(true);

    player.autostart = true;

    player.onstop = () => {
      setPlaying(false);
      player.dispose();
    };

    // Store player ref if you want to stop it later
    playbackAudioRef.current = {
      pause: () => player.stop(),
      currentTime: 0
    } as any;
  }
};

  const getCurrentSettings = () => ({
    synthType, oscType, attack, decay, sustain, release, glide, gain, lowpass, hipass, filterRolloff,
    reverb, feedbackDelay, feedbackDelayTime, feedbackDelayFeedback,
    pingPong, pingPongDelayTime, pingPongFeedback, distortion, chorusWet, chorusFreq, chorusDepth, tremolo, tremoloFreq
  });

  const applySettings = (s: any) => {
    if (s.synthType != null) setSynthType(s.synthType);
    if (s.oscType != null) setOscType(s.oscType);
    if (s.attack != null) setAttack(s.attack);
    if (s.decay != null) setDecay(s.decay);
    if (s.sustain != null) setSustain(s.sustain);
    if (s.release != null) setRelease(s.release);
    if (s.glide != null) setGlide(s.glide);
    if (s.gain != null) setGain(s.gain);
    if (s.lowpass != null) setLowpass(s.lowpass);
    if (s.hipass != null) setHipass(s.hipass);
    if (s.filterRolloff != null) setFilterRolloff(s.filterRolloff);
    if (s.reverb != null) setReverb(s.reverb);
    if (s.feedbackDelay != null) setFeedbackDelay(s.feedbackDelay);
    if (s.feedbackDelayTime != null) setFeedbackDelayTime(s.feedbackDelayTime);
    if (s.feedbackDelayFeedback != null) setFeedbackDelayFeedback(s.feedbackDelayFeedback);
    if (s.pingPong != null) setPingPong(s.pingPong);
    if (s.pingPongDelayTime != null) setPingPongDelayTime(s.pingPongDelayTime);
    if (s.pingPongFeedback != null) setPingPongFeedback(s.pingPongFeedback);
    if (s.distortion != null) setDistortion(s.distortion);
    if (s.chorusWet != null) setChorusWet(s.chorusWet);
    if (s.chorusFreq != null) setChorusFreq(s.chorusFreq);
    if (s.chorusDepth != null) setChorusDepth(s.chorusDepth);
    if (s.tremolo != null) setTremolo(s.tremolo);
    if (s.tremoloFreq != null) setTremoloFreq(s.tremoloFreq);
  };

  useEffect(() => {
    if (!synthRef.current) return;
    const cents = 1200 * Math.log2(tuningHz / 440);
    synthRef.current.set({ detune: cents });
  }, [tuningHz]);

  const handleExportPresets = () => {
    const presets = session
      ? savedPresets.map(p => ({ name: p.name, settings: p.settings }))
      : [{ name: "Current Settings", settings: getCurrentSettings() }];
    const blob = new Blob([JSON.stringify({ version: 1, presets }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const baseName = presets.length === 1
      ? presets[0].name.replace(/[^a-zA-Z0-9_-]/g, "_")
      : "presets";
    a.href = url; a.download = `${baseName}_synthfluanto.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPresets = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const presets: { name: string; settings: any }[] = Array.isArray(data.presets)
        ? data.presets
        : Array.isArray(data) ? data : [];
      if (presets.length === 0) return;
      if (session) {
        for (const p of presets) {
          const res = await fetch("/api/synth/presets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: p.name || "Imported Preset", settings: p.settings || p })
          });
          if (res.ok) {
            const preset = await res.json();
            setSavedPresets(prev => [...prev, preset]);
          }
        }
      } else {
        if (presets[0]?.settings) applySettings(presets[0].settings);
      }
    } catch (err) { console.error("Import failed", err); }
    e.target.value = "";
  };

  const handleSavePreset = async () => {
    if (!savePresetName.trim()) return;
    setSavingPreset(true);
    const res = await fetch('/api/synth/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: savePresetName.trim(), settings: getCurrentSettings() })
    });
    if (res.ok) {
      const preset = await res.json();
      setSavedPresets(prev => [preset, ...prev]);
      setSavePresetName(""); setShowSavePreset(false);
    }
    setSavingPreset(false);
  };

  const handleDeletePreset = async (id: string) => {
    await fetch(`/api/synth/presets/${id}`, { method: 'DELETE' });
    setSavedPresets(prev => prev.filter(p => p.id !== id));
  };

  const handleRenamePreset = async (id: string) => {
    if (!editingName.trim()) return;
    await fetch(`/api/synth/presets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingName.trim() })
    });
    setSavedPresets(prev => prev.map(p => p.id === id ? { ...p, name: editingName.trim() } : p));
    setEditingPresetId(null);
  };

  const handleSaveMelody = async () => {
    if (!saveMelodyName.trim()) return;
    const blob = recordedBlobs[currentMelody];
    if (!blob) return;
    setSavingMelody(true);
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      const mimeType = blob.type || 'audio/webm';
      const res = await fetch('/api/synth/melodies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: saveMelodyName.trim(), audio: base64, mimeType })
      });
      if (res.ok) {
        const melody = await res.json();
        setSavedMelodies(prev => [melody, ...prev]);
        setSaveMelodyName(""); setShowSaveMelody(false);
      }
      setSavingMelody(false);
    };
  };

  const handleDeleteMelody = async (id: string) => {
    await fetch(`/api/synth/melodies/${id}`, { method: 'DELETE' });
    setSavedMelodies(prev => prev.filter(m => m.id !== id));
  };

  const handleRenameMelody = async (id: string) => {
    if (!editingName.trim()) return;
    await fetch(`/api/synth/melodies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingName.trim() })
    });
    setSavedMelodies(prev => prev.map(m => m.id === id ? { ...m, name: editingName.trim() } : m));
    setEditingMelodyId(null);
  };

  // --- Canvas waveform/fft visualizer ---
  function VisualizerSketch({ data }: { data: number[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isMobile = typeof window !== "undefined" ? window.innerWidth <= 700 : false;
    const width = isMobile ? 200 : 340;
    const height = isMobile ? 70 : 120;

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "#6366f1";
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = (i / data.length) * width;
        const margin = 10;
        const amplitude = 40;
        const y = margin + ((1 - amplitude * data[i]) / 2) * (height - 2 * margin);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }, [data, width, height]);

    return (
      <canvas
        ref={canvasRef}
        style={{
          width: width,
          height: height,
          maxWidth: "100%",
          display: "block",
          borderRadius: 8,
          background: "#fff"
        }}
      />
    );
  }

function FrequencyBarVisualizer({ data }: { data: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = typeof window !== "undefined" ? window.innerWidth <= 700 : false;
  const width = isMobile ? 200 : 340;
  const height = isMobile ? 70 : 120;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Tone.FFT returns decibels, typically -100 to 0
    const minDb = -100;
    const maxDb = 0;
    const barWidth = width / data.length;
    for (let i = 0; i < data.length; i++) {
      // Normalize dB to 0–1
      const norm = Math.max(0, Math.min(1, (data[i] - minDb) / (maxDb - minDb)));
      const barHeight = Math.min(norm * height * 2, height); // double the bar height, clamp to max height
      ctx.fillStyle = `hsl(${220 - norm * 180}, 80%, 60%)`;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
    }
  }, [data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: width,
        height: height,
        display: "block",
        borderRadius: 8,
        background: "transparent"
      }}
    />
  );
}

  // --- Decibel Meter ---
  function MeterBar({ level }: { level: number }) {
    const percent = Math.min(1, Math.max(0, (level + 60) / 60));
    const isMobile = typeof window !== "undefined" ? window.innerWidth <= 700 : false;
    const height = isMobile ? 70 : 120;
    return (
      <div style={{
        width: 24,
        height,
        background: "#e5e7eb",
        borderRadius: 8,
        border: "1px solid #bbb",
        display: "flex",
        alignItems: "flex-end",
        margin: "0 10px"
      }}>
        <div style={{
          width: "100%",
          height: `${percent * 100}%`,
          background: percent > 0.8 ? "#ef4444" : percent > 0.5 ? "#facc15" : "#22d3ee",
          borderRadius: 8,
          transition: "height 0.1s"
        }} />
      </div>
    );
  }

  return (
   <Suspense fallback={<div>Loading...</div>}>
      <Header />
     <div
      style={{
        minHeight: "80vh",
        width: "100vw",
        maxWidth: "100%",
        background: "#f9fafb",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center", // center vertically
        alignItems: "center",     // center horizontally
        padding: "0 8px",         // add horizontal padding for mobile
      }}
    >
      <p
        className="font-bold mt-8 mb-2 text-black"
        style={{
          textAlign: "right",
          width: isMobile ? "80%" : "90%",
          fontSize: isMobile ? 16 : 32,
          marginTop: isMobile ? 12 : 32,
          marginBottom: isMobile ? 6 : 8,
        }}
      >
        Synthfluanto
      </p>
        {/* Controls Row: Synth/osc/envelope/eq left, visualizer right */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: "2rem",
            padding: "2rem 0 0.5rem 0",
            flexWrap: "wrap"
          }}
        >
          {/* Left: Synth, Oscillator, Envelope, Volume+EQ */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {/* Synth & Oscillator */}
            <div
              style={{
              minWidth: isMobile ? 110 : 180,
              maxWidth: isMobile ? 120 : 220,
              padding: isMobile ? "2px 4px" : "8px 12px",
              fontSize: isMobile ? 13 : 16,
              marginRight: isMobile ? 2 : 12,
              marginBottom: isMobile ? 0 : 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              boxSizing: "border-box"
              }}
            >
              <div style={{ color: "#181b20", fontWeight: 600, marginBottom: 4, fontSize: isMobile ? 13 : 16 }}>Synth</div>
              <select
              className="custom-select"
              value={synthType}
              onChange={e => setSynthType(e.target.value)}
              style={{
                borderRadius: 8,
                padding: isMobile ? "2px 4px" : 4,
                fontSize: isMobile ? 13 : 16,
                width: isMobile ? 90 : undefined
              }}
              >
              {SYNTH_TYPES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
              </select>
              <div style={{ color: "#181b20", fontWeight: 600, margin: isMobile ? "8px 0 2px 0" : "12px 0 4px 0", fontSize: isMobile ? 13 : 16 }}>Oscillator</div>
              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 8 }}>
              <select
                value={oscType}
                onChange={e => setOscType(e.target.value)}
                style={{
                borderRadius: 8,
                padding: isMobile ? "2px 4px" : 4,
                fontWeight: 600,
                fontSize: isMobile ? 13 : 16,
                width: isMobile ? 90 : undefined
                }}
              >
                {OSC_TYPES.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {!isMobile && (
                <span style={{ display: "inline-block" }}>
                {OSC_TYPES.find(o => o.value === oscType)?.svg()}
                </span>
              )}
              </div>
            </div>
          {/* Middle: Visualizer and Meter */}
       <div
        style={{
          position: "relative",
          width: isMobile ? 200 : 340,
          height: isMobile ? 70 : 120,
          borderRadius: 8,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden"
        }}
      >
        <VisualizerSketch data={waveformData} />
        <FrequencyBarVisualizer data={fftData} />
      </div>
      <MeterBar level={meterLevel} />
          </div>
          {/* Envelope */}
          <div>
            <div style={{ fontWeight: 700, color: "#6366f1", marginBottom: 4, fontSize: 16, letterSpacing: 2, textAlign: "center" }}>Envelope</div>
            <div
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center", // <-- center knobs horizontally
                width: isMobile ? "100%" : undefined
              }}
            >
              <SvgKnob label="Attack" min={0.001} max={2} step={0.001} value={attack} onChange={setAttack} displayValue={attack.toFixed(2) + "s"}  size={isMobile ? 50 : 56}/>
              <SvgKnob label="Decay" min={0.01} max={2} step={0.01} value={decay} onChange={setDecay} displayValue={decay.toFixed(2) + "s"}  size={isMobile ? 50 : 56}/>
              <SvgKnob label="Sustain" min={0} max={1} step={0.01} value={sustain} onChange={setSustain} displayValue={sustain.toFixed(2)}  size={isMobile ? 50 : 56}/>
              <SvgKnob label="Release" min={0.01} max={4} step={0.01} value={release} onChange={setRelease} displayValue={release.toFixed(2) + "s"}  size={isMobile ? 50 : 56}/>
            </div>
          </div>
          {/* Volume + EQ */}
          <div>
            <div style={{ fontWeight: 700, color: "#6366f1", marginBottom: 4, fontSize: 16, letterSpacing: 2, textAlign: "center" }}>Volume + EQ</div>
            <div
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center", // <-- center knobs horizontally
                width: isMobile ? "100%" : undefined
              }}
            >
              <SvgKnob label="Gain" min={0} max={1} step={0.01} value={gain} onChange={setGain} displayValue={gain.toFixed(2)}  size={isMobile ? 50 : 56}/>
              <SvgKnob label="Glide" min={0} max={1} step={0.01} value={glide} onChange={setGlide} displayValue={glide.toFixed(2) + "s"}  size={isMobile ? 50 : 56}/>
              <SvgKnob label="Hipass" min={20} max={5000} step={1} value={hipass} onChange={setHipass} displayValue={Math.round(hipass) + "Hz"}  size={isMobile ? 50 : 56}/>
              <SvgKnob label="Lowpass" min={20} max={20000} step={1} value={lowpass} onChange={setLowpass} displayValue={Math.round(lowpass) + "Hz"}  size={isMobile ? 50 : 56}/>
                  <SynthFader
                    label="Rolloff"
                    value={filterRolloff}
                    onChange={setFilterRolloff}
                    displayValue={`${filterRolloff}dB/oct`}
                    height={70}
                    width={32}
                    color="#6366f1"
                  />

            </div>
          </div>
        </div>
        {/* FX Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          width: "100%",
          margin: "2rem 0 0 0",
          justifyContent: "center"
        }}>
          {/* Left: Reverb + Delay */}
          <div>
            <div style={{ fontWeight: 700, color: "#6366f1", marginBottom: 8, fontSize: 18, letterSpacing: 2, textAlign: "center" }}>Reverb + Delay</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "center" }}>
              <SvgKnob label="Reverb" min={0} max={1} step={0.01} value={reverb} onChange={setReverb} displayValue={reverb.toFixed(2)}  size={isMobile ? 36 : 56}/>
              <SvgKnob label="FB Delay" min={0.01} max={1} step={0.01} value={feedbackDelayTime} onChange={setFeedbackDelayTime} displayValue={feedbackDelayTime.toFixed(2)}  size={isMobile ? 36 : 56}/>
              <SvgKnob label="FB Delay Wet" min={0} max={1} step={0.01} value={feedbackDelay} onChange={setFeedbackDelay} displayValue={feedbackDelay.toFixed(2)}  size={isMobile ? 36 : 56}/>
              <SvgKnob label="FB Feedback" min={0} max={0.95} step={0.01} value={feedbackDelayFeedback} onChange={setFeedbackDelayFeedback} displayValue={feedbackDelayFeedback.toFixed(2)}  size={isMobile ? 36 : 56}/>
              <SvgKnob label="PingPong Delay" min={0.01} max={1} step={0.01} value={pingPongDelayTime} onChange={setPingPongDelayTime} displayValue={pingPongDelayTime.toFixed(2)}  size={isMobile ? 36 : 56}/>
              <SvgKnob label="PP Wet" min={0} max={1} step={0.01} value={pingPong} onChange={setPingPong} displayValue={pingPong.toFixed(2)}  size={isMobile ? 36 : 56}/>
              {/* Hide PP Feedback on mobile */}
              {!isMobile && (
                <SvgKnob label="PP Feedback" min={0} max={0.95} step={0.01} value={pingPongFeedback} onChange={setPingPongFeedback} displayValue={pingPongFeedback.toFixed(2)}  size={56}/>
              )}
            </div>
          </div>
          {/* Right: Modulation */}
          <div>
            <div style={{ fontWeight: 700, color: "#6366f1", marginBottom: 8, fontSize: 18, letterSpacing: 2, textAlign: "center" }}>Modulation</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "center" }}>
              <SvgKnob label="Distortion" min={0} max={1} step={0.01} value={distortion} onChange={setDistortion} displayValue={distortion.toFixed(2)}  size={isMobile ? 36 : 56}/>
              <SvgKnob label="Chorus Wet" min={0} max={1} step={0.01} value={chorusWet} onChange={setChorusWet} displayValue={chorusWet.toFixed(2)}  size={isMobile ? 36 : 56}/>
              <SvgKnob label="Chorus Freq" min={0.1} max={8} step={0.1} value={chorusFreq} onChange={setChorusFreq} displayValue={chorusFreq.toFixed(1) + "Hz"}  size={isMobile ? 36 : 56}/>
              <SvgKnob label="Chorus Depth" min={0} max={1} step={0.01} value={chorusDepth} onChange={setChorusDepth} displayValue={chorusDepth.toFixed(2)}  size={isMobile ? 36 : 56}/>
              <SvgKnob label="Tremolo" min={0} max={1} step={0.01} value={tremolo} onChange={setTremolo} displayValue={tremolo.toFixed(2)}  size={isMobile ? 36 : 56}/>
              <SvgKnob label="Trem Freq" min={0.1} max={20} step={0.1} value={tremoloFreq} onChange={setTremoloFreq} displayValue={tremoloFreq.toFixed(1) + "Hz"}  size={isMobile ? 36 : 56}/>
            </div>
          </div>
        </div>
        {/* Melody/Recording Controls - under FX, above piano */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 32,
          margin: "2rem 0 0.5rem 0",
          width: isMobile ? "95%" : "100%",
          flexWrap: "wrap"
        }}>
          {/* LEFT: Saved Presets & Melodies (logged-in only) */}
          {session && (
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {/* Presets */}
              <div style={{ minWidth: 220, background: "#f3f4f6", borderRadius: 10, padding: "10px 12px", border: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#6366f1", letterSpacing: 1 }}>PRESETS</span>
                  {showSavePreset ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        autoFocus
                        value={savePresetName}
                        onChange={e => setSavePresetName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleSavePreset(); if (e.key === "Escape") setShowSavePreset(false); }}
                        placeholder="Name..."
                        style={{ fontSize: 12, padding: "2px 6px", borderRadius: 6, border: "1px solid #6366f1", width: 90 }}
                      />
                      <button onClick={handleSavePreset} disabled={savingPreset} style={{ fontSize: 12, padding: "2px 8px", borderRadius: 6, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer" }}>
                        {savingPreset ? "…" : <FontAwesomeIcon icon={faCheck} />}
                      </button>
                      <button onClick={() => setShowSavePreset(false)} style={{ fontSize: 12, padding: "2px 6px", borderRadius: 6, background: "#e5e7eb", border: "none", cursor: "pointer" }}><FontAwesomeIcon icon={faXmark} /></button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => setShowSavePreset(true)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer" }}>Save</button>
                      <button onClick={handleExportPresets} title="Export presets as JSON" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "#0ea5e9", color: "#fff", border: "none", cursor: "pointer" }}>Export</button>
                      <button onClick={() => importFileRef.current?.click()} title="Import presets from JSON" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "#8b5cf6", color: "#fff", border: "none", cursor: "pointer" }}>Import</button>
                      <input ref={importFileRef} type="file" accept=".json,application/json" onChange={handleImportPresets} style={{ display: "none" }} />
                    </div>
                  )}
                </div>
                <div style={{ maxHeight: 110, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                  {savedPresets.length === 0 && <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No saved presets</span>}
                  {savedPresets.map(p => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", borderRadius: 6, padding: "3px 6px" }}>
                      {editingPresetId === p.id ? (
                        <>
                          <input
                            autoFocus
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleRenamePreset(p.id); if (e.key === "Escape") setEditingPresetId(null); }}
                            style={{ fontSize: 12, padding: "1px 4px", borderRadius: 4, border: "1px solid #6366f1", flex: 1, minWidth: 0 }}
                          />
                          <button onClick={() => handleRenamePreset(p.id)} style={{ fontSize: 11, padding: "1px 5px", borderRadius: 4, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer" }}><FontAwesomeIcon icon={faCheck} /></button>
                          <button onClick={() => setEditingPresetId(null)} style={{ fontSize: 11, padding: "1px 5px", borderRadius: 4, background: "#e5e7eb", border: "none", cursor: "pointer" }}><FontAwesomeIcon icon={faXmark} /></button>
                        </>
                      ) : (
                        <>
                          <span style={{ flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                          <button onClick={() => applySettings(p.settings)} style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#22c55e", color: "#fff", border: "none", cursor: "pointer" }}>Load</button>
                          <button onClick={() => { setEditingPresetId(p.id); setEditingName(p.name); }} style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#f59e0b", color: "#fff", border: "none", cursor: "pointer" }}>Edit</button>
                          <button onClick={() => handleDeletePreset(p.id)} style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#ef4444", color: "#fff", border: "none", cursor: "pointer" }}>Del</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Melodies */}
              <div style={{ minWidth: 220, background: "#f3f4f6", borderRadius: 10, padding: "10px 12px", border: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#6366f1", letterSpacing: 1 }}>MELODIES</span>
                  {showSaveMelody ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        autoFocus
                        value={saveMelodyName}
                        onChange={e => setSaveMelodyName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleSaveMelody(); if (e.key === "Escape") setShowSaveMelody(false); }}
                        placeholder="Name..."
                        style={{ fontSize: 12, padding: "2px 6px", borderRadius: 6, border: "1px solid #6366f1", width: 90 }}
                      />
                      <button onClick={handleSaveMelody} disabled={savingMelody || !recordedBlobs[currentMelody]} style={{ fontSize: 12, padding: "2px 8px", borderRadius: 6, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer" }}>
                        {savingMelody ? "…" : <FontAwesomeIcon icon={faCheck} />}
                      </button>
                      <button onClick={() => setShowSaveMelody(false)} style={{ fontSize: 12, padding: "2px 6px", borderRadius: 6, background: "#e5e7eb", border: "none", cursor: "pointer" }}><FontAwesomeIcon icon={faXmark} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setShowSaveMelody(true)} disabled={!recordedBlobs[currentMelody]} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: !recordedBlobs[currentMelody] ? "#d1d5db" : "#6366f1", color: "#fff", border: "none", cursor: !recordedBlobs[currentMelody] ? "not-allowed" : "pointer" }}>Save</button>
                  )}
                </div>
                <div style={{ maxHeight: 110, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                  {savedMelodies.length === 0 && <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No saved melodies</span>}
                  {savedMelodies.map(m => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", borderRadius: 6, padding: "3px 6px" }}>
                      {editingMelodyId === m.id ? (
                        <>
                          <input
                            autoFocus
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleRenameMelody(m.id); if (e.key === "Escape") setEditingMelodyId(null); }}
                            style={{ fontSize: 12, padding: "1px 4px", borderRadius: 4, border: "1px solid #6366f1", flex: 1, minWidth: 0 }}
                          />
                          <button onClick={() => handleRenameMelody(m.id)} style={{ fontSize: 11, padding: "1px 5px", borderRadius: 4, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer" }}><FontAwesomeIcon icon={faCheck} /></button>
                          <button onClick={() => setEditingMelodyId(null)} style={{ fontSize: 11, padding: "1px 5px", borderRadius: 4, background: "#e5e7eb", border: "none", cursor: "pointer" }}><FontAwesomeIcon icon={faXmark} /></button>
                        </>
                      ) : (
                        <>
                          <span style={{ flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                          <button onClick={() => { setAudioUrl(m.audio_url); setLoadedMelodyName(m.name); }} style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#22c55e", color: "#fff", border: "none", cursor: "pointer" }}>Load</button>
                          <button onClick={() => { setEditingMelodyId(m.id); setEditingName(m.name); }} style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#f59e0b", color: "#fff", border: "none", cursor: "pointer" }}>Edit</button>
                          <a href={m.audio_url} download={`${m.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.mp3`} style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer", textDecoration: "none" }}>MP3</a>
                          <button onClick={() => handleDeleteMelody(m.id)} style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#ef4444", color: "#fff", border: "none", cursor: "pointer" }}>Del</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RIGHT: Transport controls + tuning */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Record Button */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <button
                onClick={recording ? stopAll : startRecording}
                style={{ background: "transparent", border: "none", borderRadius: "50%", width: 40, height: 40, padding: 0, cursor: "pointer", outline: recording ? "2px solid #ef4444" : "none", animation: recording ? "recordFlash 1s infinite" : "none", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}
                title={recording ? "Stop Recording" : "Record"}
              >
                <RecordSVG overdub={!!recordedBlobs[currentMelody] && !recording} />
              </button>
              {recordedBlobs[currentMelody] && !recording && (
                <span style={{ fontSize: 10, color: "#e11d74", fontWeight: 500, marginTop: 0, letterSpacing: 1, textTransform: "uppercase", width: "40px", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center", marginLeft: 16 }}>layer</span>
              )}
            </div>
            {/* Play Button */}
            <button
              onClick={handlePlayToggle}
              disabled={!audioUrl || recording}
              style={{ marginLeft: 8, background: "transparent", border: "none", borderRadius: "50%", width: 40, height: 40, padding: 0, cursor: !audioUrl || recording ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title={playing ? "Stop" : "Play"}
            >
              {playing ? <StopSVG /> : <PlaySVG />}
            </button>
            {/* Clear Button */}
            {audioUrl && (
              <button
                onClick={clearRecording}
                disabled={recording || playing}
                style={{ marginLeft: 8, background: "transparent", border: "none", borderRadius: "50%", width: 40, height: 40, padding: 0, cursor: recording || playing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Clear"
              >
                <TrashSVG />
              </button>
            )}
            {/* Download Button */}
            <button
              onClick={saveRecording}
              disabled={!audioUrl}
              style={{ marginLeft: 8, background: "transparent", border: "none", borderRadius: "50%", width: 40, height: 40, padding: 0, cursor: !audioUrl ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Download"
            >
              <SaveSVG />
            </button>
            {/* New Melody Button */}
            <button
              onClick={handleAddMelody}
              style={{ marginLeft: 4, background: "transparent", border: "none", borderRadius: "50%", width: 40, height: 40, padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Start new melody"
            >
              <svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="4" y="4" width="24" height="24" rx="4" fill="#e0e7ff" />
                <path d="M10 16h12M16 10v12" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
            {/* Tuning knob */}
            <div style={{ marginLeft: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <SvgKnob
                label="A ="
                min={420}
                max={460}
                step={0.5}
                value={tuningHz}
                onChange={setTuningHz}
                displayValue={tuningHz.toFixed(1) + "Hz"}
                size={isMobile ? 46 : 52}
                color={tuningHz === 440 ? "#6366f1" : "#f59e0b"}
              />
            </div>
          </div>
        </div>

{/* Piano */}
<div style={{
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-end",
  margin: "1rem 0 2rem 0",
  position: "relative",
  height: isMobile ? 126 : 140, // 90% of 140
  userSelect: "none",
  overflowX: "auto",
  borderRadius: 8,
  padding: isMobile ? "0 8px" : "0 16px",
  touchAction: "manipulation"
}}>
  <div style={{ display: "flex", position: "relative" }}>
    {groupedKeys.map((key, idx) => (
      <div
        key={key.white.note + key.white.octave + idx}
        style={{
          position: "relative",
          width: isMobile ? 37.8 : 42 // 90% of 42
        }}
      >
        {/* Black key */}
        {key.black && (
          <div
            style={{
              position: "absolute",
              left: isMobile ? 25.2 : 28, // 90% of 28
              top: 0,
              width: isMobile ? 25.2 : 28, // 90% of 28
              height: isMobile ? 72 : 80, // 90% of 80
              background: activeNotes.includes(`${key.black.note}${key.black.octave}`) ? "#6366f1" : "#222",
              border: "1px solid #444",
              borderRadius: "0 0 4px 4px",
              zIndex: 2,
              display: "block",
              cursor: "pointer"
            }}
            onMouseDown={() => playNote(`${key.black!.note}${key.black!.octave}`)}
            onMouseUp={() => stopNote(`${key.black!.note}${key.black!.octave}`)}
            onMouseLeave={() => stopNote(`${key.black!.note}${key.black!.octave}`)}
            onTouchStart={() => playNote(`${key.black!.note}${key.black!.octave}`)}
            onTouchEnd={() => stopNote(`${key.black!.note}${key.black!.octave}`)}
          />
        )}
        {/* White key */}
        <div
          style={{
            width: isMobile ? 36 : 40, // 90% of 40
            height: isMobile ? 108 : 120, // 90% of 120
            background: activeNotes.includes(`${key.white.note}${key.white.octave}`) ? "#a5b4fc" : "#fff",
            border: "1px solid #bbb",
            borderRadius: "0 0 6px 6px",
            marginLeft: -1,
            zIndex: 1,
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: isMobile ? 11.7 : 13, // 90% of 13
            cursor: "pointer"
          }}
          onMouseDown={() => playNote(`${key.white.note}${key.white.octave}`)}
          onMouseUp={() => stopNote(`${key.white.note}${key.white.octave}`)}
          onMouseLeave={() => stopNote(`${key.white.note}${key.white.octave}`)}
          onTouchStart={() => playNote(`${key.white.note}${key.white.octave}`)}
          onTouchEnd={() => stopNote(`${key.white.note}${key.white.octave}`)}
        >
          {key.white.note}{key.white.octave}
        </div>
      </div>
    ))}
  </div>
</div>

      </div>
      <Footer />
      <style>{`
        .pad:active {
          background: #a5b4fc !important;
        }
        @keyframes recordFlash {
          0% { filter: drop-shadow(0 0 0px #ff4d4f); }
          50% { filter: drop-shadow(0 0 12px #ff4d4f); }
          100% { filter: drop-shadow(0 0 0px #ff4d4f); }
        }
      `}</style>
    </Suspense>
  );
}

// SVG Circular Knob Component
function SvgKnob({
  label,
  min,
  max,
  step,
  value,
  onChange,
  displayValue,
  size = 56,
  color = "#6366f1"
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  displayValue?: string;
  size?: number;
  color?: string;
}) {
  const angle = 135 + ((value - min) / (max - min)) * 270;
  const radius = size / 2 - 8;
  const center = size / 2;
  const pointerLength = radius - 8;
  const rad = (angle * Math.PI) / 180;
  const pointerX = center + pointerLength * Math.cos(rad);
  const pointerY = center + pointerLength * Math.sin(rad);

  const dragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(value);

  function handlePointerDown(e: React.PointerEvent) {
    dragging.current = true;
    startY.current = e.clientY;
    startValue.current = value;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }
  function handlePointerMove(e: PointerEvent) {
    if (!dragging.current) return;
    const delta = startY.current - e.clientY;
    let newValue = startValue.current + ((max - min) / 100) * delta;
    newValue = Math.max(min, Math.min(max, Math.round(newValue / step) * step));
    onChange(Number(newValue));
  }
  function handlePointerUp() {
    dragging.current = false;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }

  return (
    <div style={{ textAlign: "center", width: size + 8, userSelect: "none" }}>
      <div
        style={{ cursor: "pointer", display: "inline-block" }}
        onPointerDown={handlePointerDown}
        tabIndex={0}
        aria-label={label}
      >
        <svg width={size} height={size}>
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="#f3f4f6"
            stroke="#bbb"
            strokeWidth={3}
          />
          {/* Arc */}
          <path
            d={describeArc(center, center, radius, 135, angle)}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
          />
          {/* Pointer */}
          <line
            x1={center}
            y1={center}
            x2={pointerX}
            y2={pointerY}
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
          />
          {/* Center dot */}
          <circle cx={center} cy={center} r={5} fill={color} />
        </svg>
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, color: "#181b20" }}>{label}</div>
      <div style={{ fontSize: 13, color }}>{displayValue ?? value}</div>
    </div>
  );
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", r, r, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}
function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * Math.PI / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}