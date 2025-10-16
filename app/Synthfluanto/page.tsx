"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Footer from "@/components/Footer";
import * as Tone from "tone";
import nextDynamic from "next/dynamic";
import Header from "@/components/Header";
import { Stage, Layer, Line } from "react-konva";

type BlobPart = any; 

// Dynamically import p5.js wrapper to avoid SSR issues
//const P5Wrapper = nextDynamic(() => import("react-p5-wrapper").then(mod => mod.ReactP5Wrapper), { ssr: false });

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
function RecordSVG({ flashing }: { flashing?: boolean }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <circle
        cx="16"
        cy="16"
        r="12"
        fill={flashing ? "#ff4d4f" : "#dc2626"}
        style={flashing ? { filter: "drop-shadow(0 0 8px #ff4d4f)" } : {}}
      />
    </svg>
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
function SaveSVG() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <rect x="6" y="6" width="20" height="20" rx="3" fill="#22c55e" />
      <rect x="10" y="10" width="12" height="8" rx="1" fill="#fff" />
      <rect x="14" y="20" width="4" height="4" rx="1" fill="#fff" />
    </svg>
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
  const [gain, setGain] = useState(0.6);
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

  // const [showP5, setShowP5] = useState(false);

  // useEffect(() => {
  //   setShowP5(true);
  // }, []);
  
  useEffect(() => {
        document.title = "Release Pages | Influanto";
        
        // Update meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', 'Web Based Synthesizer - Synthfluanto by Influanto');
    
        // Update og:title
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
          ogTitle = document.createElement('meta');
          ogTitle.setAttribute('property', 'og:title');
          document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', 'Synthfluanto, the web based Synthesizer | Influanto');
  
        // Update og:description
        let ogDescription = document.querySelector('meta[property="og:description"]');
        if (!ogDescription) {
          ogDescription = document.createElement('meta');
          ogDescription.setAttribute('property', 'og:description');
          document.head.appendChild(ogDescription);
        }
        ogDescription.setAttribute('content', 'Web Based Synthesizer - Synthfluanto by Influanto');
  
        // Update twitter:title
        let twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (!twitterTitle) {
          twitterTitle = document.createElement('meta');
          twitterTitle.setAttribute('name', 'twitter:title');
          document.head.appendChild(twitterTitle);
        }
        twitterTitle.setAttribute('content', 'Synthfluanto, the web based Synthesizer | Influanto');
    
        // Update twitter:description
        let twitterDescription = document.querySelector('meta[name="twitter:description"]');
        if (!twitterDescription) {
          twitterDescription = document.createElement('meta');
          twitterDescription.setAttribute('name', 'twitter:description');
          document.head.appendChild(twitterDescription);
        }
        twitterDescription.setAttribute('content', 'Web Based Synthesizer - Synthfluanto by Influanto');
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

const startRecording = () => {
  const stream = setupStream();
  if (!stream) {
    alert("Audio stream is not available for recording.");
    return;
  }
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    setRecordedBlobs(prev => ({ ...prev, [currentMelody]: blob }));
    setAudioUrl(URL.createObjectURL(blob));
    setRecording(false);
  };
  recorder.start();
  setMediaRecorder(recorder);
  setRecording(true);
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

  const playRecording = () => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    playbackAudioRef.current = audio;
    setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.play();
  };

  // Save as .wav (or .mp3 fallback) using webm-to-wav conversion
  const saveRecording = async () => {
    const blob = recordedBlobs[currentMelody];
    if (!blob) return;

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
      a.download = `${currentMelody}.wav`;
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
      a.download = `${currentMelody}.${ext}`;
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

  const pianoKeys = getFullPianoKeys();
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

  // --- P5.js waveform/fft sketch ---
  // const visualizerSketch = useCallback((p: any) => {
  //   p.setup = () => {
  //     p.createCanvas(340, 120);
  //   };
  //   p.draw = () => {
  //     p.background(245);
  //     // Draw waveform
  //     p.stroke(99, 102, 241);
  //     p.noFill();
  //     p.beginShape();
  //     const waveform = waveformDataRef.current;
  //     for (let i = 0; i < waveform.length; i++) {
  //       const x = p.map(i, 0, waveform.length, 0, p.width);
  //       const y = p.map(waveform[i], -1, 1, 0, p.height);
  //       p.vertex(x, y);
  //     }
  //     p.endShape();

  //     // Draw FFT bars
  //     const fft = fftDataRef.current;
  //     const barWidth = p.width / fft.length;
  //     p.noStroke();
  //     p.fill(180, 180, 255, 120);
  //     for (let i = 0; i < fft.length; i++) {
  //       const amp = fft[i];
  //       const y = p.map(amp, -100, 0, p.height, 0);
  //       p.rect(i * barWidth, y, barWidth - 2, p.height - y);
  //     }
  //   };
  // }, []);


function VisualizerSketch({ data }: { data: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#6366f1";
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * canvas.width;
      const margin = 10;
      const amplitude = 40; // scale up the waveform
      const y = margin + ((1 - amplitude * data[i]) / 2) * (canvas.height - 2 * margin);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [data]);

  return <canvas ref={canvasRef} width={340} height={120} />;
}

  // --- Decibel Meter ---
  function MeterBar({ level }: { level: number }) {
  const percent = Math.min(1, Math.max(0, (level + 60) / 60));
  return (
    <div style={{
      width: 24,
      height: 120,
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
    <>
      <Header />
      <div
        style={{
          minHeight: "80vh",
          width: "100%",
          background: "#f9fafb",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start"
        }}
      >
        <h1 className="text-3xl font-bold text-right mt-8 mr-36 text-black">Synthfluanto</h1>
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
              gap: 32,
              flexWrap: "wrap"
            }}
          >
            {/* Synth & Oscillator */}
            <div>
              <div style={{ color: "#181b20", fontWeight: 600, marginBottom: 4 }}>Synth</div>
              <select
                className="custom-select"
                value={synthType}
                onChange={e => setSynthType(e.target.value)}
                style={{ borderRadius: 8, padding: 4 }}
              >
                {SYNTH_TYPES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <div style={{ color: "#181b20", fontWeight: 600, margin: "12px 0 4px 0" }}>Oscillator</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select
                  value={oscType}
                  onChange={e => setOscType(e.target.value)}
                  style={{ borderRadius: 8, padding: 4, fontWeight: 600 }}
                >
                  {OSC_TYPES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <span style={{ display: "inline-block" }}>
                  {OSC_TYPES.find(o => o.value === oscType)?.svg()}
                </span>
              </div>
            </div>
          {/* Middle: Visualizer and Meter */}
          {/* <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
            {showP5 && <P5Wrapper sketch={visualizerSketch} />}
            <MeterBar level={meterLevel} />
          </div> */}
         <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          <VisualizerSketch data={waveformData} />
          <MeterBar level={meterLevel} />
        </div>

            {/* Envelope */}
            <div>
              <div style={{ fontWeight: 700, color: "#6366f1", marginBottom: 4, fontSize: 16, letterSpacing: 2, textAlign: "center" }}>Envelope</div>
              <div style={{ display: "flex", gap: 16 }}>
                <SvgKnob label="Attack" min={0.001} max={2} step={0.001} value={attack} onChange={setAttack} displayValue={attack.toFixed(2) + "s"} />
                <SvgKnob label="Decay" min={0.01} max={2} step={0.01} value={decay} onChange={setDecay} displayValue={decay.toFixed(2) + "s"} />
                <SvgKnob label="Sustain" min={0} max={1} step={0.01} value={sustain} onChange={setSustain} displayValue={sustain.toFixed(2)} />
                <SvgKnob label="Release" min={0.01} max={4} step={0.01} value={release} onChange={setRelease} displayValue={release.toFixed(2) + "s"} />
              </div>
            </div>
            {/* Volume + EQ */}
            <div>
              <div style={{ fontWeight: 700, color: "#6366f1", marginBottom: 4, fontSize: 16, letterSpacing: 2, textAlign: "center" }}>Volume + EQ</div>
              <div style={{ display: "flex", gap: 16 }}>
                <SvgKnob label="Gain" min={0} max={1} step={0.01} value={gain} onChange={setGain} displayValue={gain.toFixed(2)} />
                <SvgKnob label="Glide" min={0} max={1} step={0.01} value={glide} onChange={setGlide} displayValue={glide.toFixed(2) + "s"} />
                <SvgKnob label="Hipass" min={20} max={5000} step={1} value={hipass} onChange={setHipass} displayValue={Math.round(hipass) + "Hz"} />
                <SvgKnob label="Lowpass" min={20} max={20000} step={1} value={lowpass} onChange={setLowpass} displayValue={Math.round(lowpass) + "Hz"} />
              </div>
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
              <SvgKnob label="Reverb" min={0} max={1} step={0.01} value={reverb} onChange={setReverb} displayValue={reverb.toFixed(2)} />
              <SvgKnob label="FB Delay" min={0.01} max={1} step={0.01} value={feedbackDelayTime} onChange={setFeedbackDelayTime} displayValue={feedbackDelayTime.toFixed(2)} />
              <SvgKnob label="FB Feedback" min={0} max={0.95} step={0.01} value={feedbackDelayFeedback} onChange={setFeedbackDelayFeedback} displayValue={feedbackDelayFeedback.toFixed(2)} />
              <SvgKnob label="FB Delay Wet" min={0} max={1} step={0.01} value={feedbackDelay} onChange={setFeedbackDelay} displayValue={feedbackDelay.toFixed(2)} />
              <SvgKnob label="PP Delay" min={0.01} max={1} step={0.01} value={pingPongDelayTime} onChange={setPingPongDelayTime} displayValue={pingPongDelayTime.toFixed(2)} />
              <SvgKnob label="PP Feedback" min={0} max={0.95} step={0.01} value={pingPongFeedback} onChange={setPingPongFeedback} displayValue={pingPongFeedback.toFixed(2)} />
              <SvgKnob label="PingPong Wet" min={0} max={1} step={0.01} value={pingPong} onChange={setPingPong} displayValue={pingPong.toFixed(2)} />
            </div>
          </div>
          {/* Right: Modulation */}
          <div>
            <div style={{ fontWeight: 700, color: "#6366f1", marginBottom: 8, fontSize: 18, letterSpacing: 2, textAlign: "center" }}>Modulation</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "center" }}>
              <SvgKnob label="Distortion" min={0} max={1} step={0.01} value={distortion} onChange={setDistortion} displayValue={distortion.toFixed(2)} />
              <SvgKnob label="Chorus Wet" min={0} max={1} step={0.01} value={chorusWet} onChange={setChorusWet} displayValue={chorusWet.toFixed(2)} />
              <SvgKnob label="Chorus Freq" min={0.1} max={8} step={0.1} value={chorusFreq} onChange={setChorusFreq} displayValue={chorusFreq.toFixed(1) + "Hz"} />
              <SvgKnob label="Chorus Depth" min={0} max={1} step={0.01} value={chorusDepth} onChange={setChorusDepth} displayValue={chorusDepth.toFixed(2)} />
              <SvgKnob label="Tremolo" min={0} max={1} step={0.01} value={tremolo} onChange={setTremolo} displayValue={tremolo.toFixed(2)} />
              <SvgKnob label="Trem Freq" min={0.1} max={20} step={0.1} value={tremoloFreq} onChange={setTremoloFreq} displayValue={tremoloFreq.toFixed(1) + "Hz"} />
            </div>
          </div>
        </div>
        {/* Melody/Recording Controls - under FX, above piano */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          margin: "2rem 0 0.5rem 0"
        }}>
          {/* Melody Dropdown */}
          <select
            value={currentMelody}
            onChange={e => setCurrentMelody(e.target.value)}
            style={{ borderRadius: 8, padding: "4px 12px", fontWeight: 600, fontSize: 16 }}
          >
            {melodyList.map(mel => (
              <option key={mel} value={mel}>{mel}</option>
            ))}
          </select>
          {/* Add Melody Button */}
          <button
            style={{
              marginLeft: 4,
              background: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              fontSize: 22,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Add Melody"
            onClick={handleAddMelody}
          >+</button>
          {/* Record Button */}
          <button
            onClick={recording ? stopAll : startRecording}
            style={{
              marginLeft: 16,
              background: "transparent",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              padding: 0,
              cursor: "pointer",
              outline: recording ? "2px solid #ef4444" : "none",
              animation: recording ? "recordFlash 1s infinite" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title={recording ? "Stop Recording" : "Record"}
          >
            <RecordSVG flashing={recording && flash} />
          </button>
          {/* Play Button */}
          <button
            onClick={playRecording}
            disabled={!audioUrl || playing || recording}
            style={{
              marginLeft: 8,
              background: "transparent",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              padding: 0,
              cursor: !audioUrl || playing || recording ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Play"
          >
            <PlaySVG />
          </button>
          {/* Stop Button */}
          <button
            onClick={stopAll}
            disabled={(!playing && !recording)}
            style={{
              marginLeft: 8,
              background: "transparent",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              padding: 0,
              cursor: (!playing && !recording) ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Stop"
          >
            <StopSVG />
          </button>
          {/* Save Button */}
          <button
            onClick={saveRecording}
            disabled={!audioUrl}
            style={{
              marginLeft: 8,
              background: "transparent",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              padding: 0,
              cursor: !audioUrl ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Save"
          >
            <SaveSVG />
          </button>
        </div>
        {/* Piano */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          margin: "3rem 0 2rem 0",
          position: "relative",
          height: 140,
          userSelect: "none",
          overflowX: "auto",
          borderRadius: 8,
          padding: "0 16px"
        }}>
          <div style={{ display: "flex", position: "relative" }}>
            {groupedKeys.map((key, idx) => (
              <div key={key.white.note + key.white.octave + idx} style={{ position: "relative", width: 42 }}>
                {/* Black key */}
                {key.black && (
                  <div
                    style={{
                      position: "absolute",
                      left: 28,
                      top: 0,
                      width: 28,
                      height: 80,
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
                    onTouchStart={e => { e.preventDefault(); playNote(`${key.black!.note}${key.black!.octave}`); }}
                    onTouchEnd={e => { e.preventDefault(); stopNote(`${key.black!.note}${key.black!.octave}`); }}
                  />
                )}
                {/* White key */}
                <div
                  style={{
                    width: 40,
                    height: 120,
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
                    fontSize: 13,
                    cursor: "pointer"
                  }}
                  onMouseDown={() => playNote(`${key.white.note}${key.white.octave}`)}
                  onMouseUp={() => stopNote(`${key.white.note}${key.white.octave}`)}
                  onMouseLeave={() => stopNote(`${key.white.note}${key.white.octave}`)}
                  onTouchStart={e => { e.preventDefault(); playNote(`${key.white.note}${key.white.octave}`); }}
                  onTouchEnd={e => { e.preventDefault(); stopNote(`${key.white.note}${key.white.octave}`); }}
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
    </>
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