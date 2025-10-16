"use client";
import React, { useState, useEffect, useRef } from "react";
import Footer from "@/components/Footer";
import * as Tone from "tone";
import dynamic from "next/dynamic";
import Header from "@/components/Header";

// Dynamically import p5.js wrapper to avoid SSR issues
const P5Wrapper = dynamic(() => import("react-p5-wrapper").then(mod => mod.ReactP5Wrapper || mod.default), { ssr: false });

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
      <polyline fill="none" stroke="#6366f1" strokeWidth="3" points="0,16 8,24 16,8 24,24 32,16" />
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

export default function Synthfluanto() {
  const [synthType, setSynthType] = useState("Synth");
  const [oscType, setOscType] = useState("sine");
  const [decay, setDecay] = useState(0.4);
  const [glide, setGlide] = useState(0); // portamento
  const [gain, setGain] = useState(0.7);
  const [lowpass, setLowpass] = useState(20000); // Hz
  const [hipass, setHipass] = useState(20); // Hz
  const [reverb, setReverb] = useState(0.2);
  const [distortion, setDistortion] = useState(0); // 0 to 1
  const [chorus, setChorus] = useState(0); // 0 to 1
  const [tremolo, setTremolo] = useState(0); // 0 to 1 (depth)
  const [tremoloFreq, setTremoloFreq] = useState(5); // Hz
  const [pingPong, setPingPong] = useState(0); // 0 to 1 (wet)
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [meterLevel, setMeterLevel] = useState(-60);
  const [fftData, setFftData] = useState<number[]>([]);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Refs for synth and FX
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const meterRef = useRef<Tone.Meter | null>(null);
  const fftRef = useRef<Tone.FFT | null>(null);
  const waveformRef = useRef<Tone.Waveform | null>(null);

  // Setup synth and FX chain
  useEffect(() => {
    synthRef.current?.dispose();
    meterRef.current?.dispose();
    fftRef.current?.dispose();
    waveformRef.current?.dispose();

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

    // Set envelope, oscillator type, and portamento (glide)
    synth.set({
      envelope: { decay },
      oscillator: { type: oscType },
      portamento: glide
    });

    const hipassFilter = new Tone.Filter(hipass, "highpass");
    const lowpassFilter = new Tone.Filter(lowpass, "lowpass");
    const distortionNode = new Tone.Distortion(distortion);
    const chorusNode = new Tone.Chorus(4, 2.5, chorus).start();
    const tremoloNode = new Tone.Tremolo(tremoloFreq, tremolo).start();
    const pingPongNode = new Tone.PingPongDelay("8n", pingPong);
    const reverbNode = new Tone.Reverb({ decay: reverb });
    const gainNode = new Tone.Gain(gain);

    // Meter, FFT, and Waveform
    const meter = new Tone.Meter();
    const fft = new Tone.FFT(64);
    const waveform = new Tone.Waveform(256);

    // synth -> hipass -> lowpass -> distortion -> chorus -> tremolo -> pingpong -> reverb -> gain -> meter -> fft/waveform -> destination
    synth.chain(
      hipassFilter,
      lowpassFilter,
      distortionNode,
      chorusNode,
      tremoloNode,
      pingPongNode,
      reverbNode,
      gainNode,
      meter,
      Tone.Destination
    );
    gainNode.connect(fft);
    gainNode.connect(waveform);

    synthRef.current = synth;
    meterRef.current = meter;
    fftRef.current = fft;
    waveformRef.current = waveform;

    return () => {
      synth.dispose();
      gainNode.dispose();
      reverbNode.dispose();
      distortionNode.dispose();
      chorusNode.dispose();
      tremoloNode.dispose();
      pingPongNode.dispose();
      lowpassFilter.dispose();
      hipassFilter.dispose();
      meter.dispose();
      fft.dispose();
      waveform.dispose();
    };
  }, [
    synthType, oscType, decay, glide, gain, lowpass, hipass, reverb,
    distortion, chorus, tremolo, tremoloFreq, pingPong
  ]);

  // Meter/FFT/Waveform polling
  useEffect(() => {
    let raf: number;
    function update() {
      if (meterRef.current) setMeterLevel(meterRef.current.getValue() as number);
      if (fftRef.current) setFftData(fftRef.current.getValue() as number[]);
      if (waveformRef.current) setWaveformData(waveformRef.current.getValue() as number[]);
      raf = requestAnimationFrame(update);
    }
    update();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Play note (expects full note name, e.g. "C4", "D#5")
  const playNote = async (noteName: string) => {
    await Tone.start();
    setActiveNotes((prev) => [...prev, noteName]);
    synthRef.current?.triggerAttack(noteName);
  };

  const stopNote = (noteName: string) => {
    setActiveNotes((prev) => prev.filter(n => n !== noteName));
    synthRef.current?.triggerRelease(noteName);
  };

  // MIDI support only
  useEffect(() => {
    let midiAccess: WebMidi.MIDIAccess | null = null;
    function onMIDIMessage(event: WebMidi.MIDIMessageEvent) {
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
    const keyMap: { [key: string]: string } = {
      a: "C3", w: "C#3", s: "D3", e: "D#3", d: "E3",
      f: "F3", t: "F#3", g: "G3", y: "G#3", h: "A3",
      u: "A#3", j: "B3", k: "C4", o: "C#4", l: "D4", p: "D#4", ";": "E4",
      "'": "F4"
    };
    const downHandler = (e: KeyboardEvent) => {
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

  // Piano keys from C2 to C6
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
  function visualizerSketch(p: any) {
    p.setup = () => {
      p.createCanvas(340, 120);
    };
    p.draw = () => {
      p.background(245);
      // Draw waveform
      p.stroke(99, 102, 241);
      p.noFill();
      p.beginShape();
      for (let i = 0; i < waveformData.length; i++) {
        const x = p.map(i, 0, waveformData.length, 0, p.width);
        const y = p.map(waveformData[i], -1, 1, 0, p.height);
        p.vertex(x, y);
      }
      p.endShape();

      // Draw FFT bars
      const barWidth = p.width / fftData.length;
      p.noStroke();
      p.fill(180, 180, 255, 120);
      for (let i = 0; i < fftData.length; i++) {
        const amp = fftData[i];
        const y = p.map(amp, -100, 0, p.height, 0);
        p.rect(i * barWidth, y, barWidth - 2, p.height - y);
      }
    };
  }

  // --- Decibel Meter ---
  function MeterBar({ level }: { level: number }) {
    // level is in dB, -60 (silent) to 0 (max)
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
      <Header></Header>
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
        <h1 className="text-3xl font-bold text-center mt-8 text-black">Synthfluanto</h1>
        {/* Controls Row: 3 Segments */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "2rem",
          padding: "2rem 0 0.5rem 0",
          flexWrap: "wrap"
        }}>
          {/* Left: Synth & Oscillator */}
          <div style={{ minWidth: 180, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            {/* Synth Type */}
            <div style={{ textAlign: "center" }}>
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
            </div>
            {/* Oscillator Type */}
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <div style={{ color: "#181b20", fontWeight: 600, marginBottom: 4 }}>Oscillator</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <select
                  value={oscType}
                  onChange={e => setOscType(e.target.value)}
                  style={{ borderRadius: 8, padding: 4, fontWeight: 600 }}
                >
                  {OSC_TYPES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {/* SVG waveform */}
                <span style={{ display: "inline-block" }}>
                  {OSC_TYPES.find(o => o.value === oscType)?.svg()}
                </span>
              </div>
            </div>
          </div>
          {/* Middle: Meter and Visualizer */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: 380
          }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
              <P5Wrapper sketch={visualizerSketch} />
              <MeterBar level={meterLevel} />
            </div>
          </div>
          {/* Right: All Knobs */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16
          }}>
            {/* Main Controls */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "2rem",
              flexWrap: "wrap"
            }}>
              <SvgKnob label="Glide" min={0} max={1} step={0.01} value={glide} onChange={setGlide} displayValue={glide.toFixed(2) + "s"} />
              <SvgKnob label="Decay" min={0.01} max={1} step={0.01} value={decay} onChange={setDecay} />
              <SvgKnob label="Gain" min={0} max={1} step={0.01} value={gain} onChange={setGain} />
              <SvgKnob label="Lowpass" min={20} max={20000} step={1} value={lowpass} onChange={setLowpass} displayValue={Math.round(lowpass) + "Hz"} />
              <SvgKnob label="Hipass" min={20} max={5000} step={1} value={hipass} onChange={setHipass} displayValue={Math.round(hipass) + "Hz"} />
            </div>
            {/* FX Row */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "1rem",
              marginBottom: "1rem"
            }}>
              <div style={{ fontWeight: 700, color: "#6366f1", marginBottom: 8, fontSize: 18, letterSpacing: 2 }}>FX</div>
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "2rem"
              }}>
                <SvgKnob label="Reverb" min={0} max={1} step={0.01} value={reverb} onChange={setReverb} />
                <SvgKnob label="Distortion" min={0} max={1} step={0.01} value={distortion} onChange={setDistortion} />
                <SvgKnob label="Chorus" min={0} max={1} step={0.01} value={chorus} onChange={setChorus} />
                <SvgKnob label="Tremolo" min={0} max={1} step={0.01} value={tremolo} onChange={setTremolo} />
                <SvgKnob label="Trem Freq" min={0.1} max={20} step={0.1} value={tremoloFreq} onChange={setTremoloFreq} displayValue={tremoloFreq.toFixed(1) + "Hz"} />
                <SvgKnob label="PingPong" min={0} max={1} step={0.01} value={pingPong} onChange={setPingPong} />
              </div>
            </div>
          </div>
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