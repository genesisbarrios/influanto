"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import Head from 'next/head';

const noteOptions = [
  { label: "Whole (1/1)", value: 4 },
  { label: "Half (1/2)", value: 2 },
  { label: "Quarter (1/4)", value: 1 },
  { label: "Eighth (1/8)", value: 0.5 },
  { label: "Sixteenth (1/16)", value: 0.25 },
  { label: "Thirty-second (1/32)", value: 0.125 },
  { label: "Dotted Quarter (1/4.)", value: 1.5 },
  { label: "Dotted Eighth (1/8.)", value: 0.75 },
  { label: "Triplet Quarter (1/4T)", value: 2 / 3 },
  { label: "Triplet Eighth (1/8T)", value: 1 / 3 },
];

// Calculate reverb pre-delay in ms for a given bpm and note fraction
function calculateReverbPreDelay(bpm: number, fraction: number) {
  if (!bpm || !fraction) return 0;
  const quarter = 60000 / bpm;
  return quarter / fraction;
}

const calcDelayMs = (bpm: number, note: number) => {
  if (!bpm || !note) return "";
  return ((60000 / bpm) * note).toFixed(2);
};


export default function ReverbandDelay() {
  const [bpm, setBpm] = useState<number>(120);
  const [preDelayOption, setPreDelayOption] = useState<"1/32" | "1/64">("1/64");
  const [delay1Bar, setDelay1Bar] = useState<string>(calcDelayMs(bpm, 4));

  return (
    <>  
     <Head>
        <title>Influanto | Delay & Reverb Calculator</title>
        <meta name="description" content="Free Musician Tools: Delay & Reverb Calculator, BPM Calculator, Split Sheet Generator + more" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="FREE Musician Tools" />
        <meta property="og:description" content="Free Musician Tools: Delay & Reverb Calculator, BPM Calculator, Split Sheet Generator + more" />
        <meta name="twitter:title" content="FREE Musician Tools" />
        <meta name="twitter:description" content="Free Musician Tools: Delay & Reverb Calculator, BPM Calculator, Split Sheet Generator + more" />
      </Head>
    <Suspense>
        <Header />
    </Suspense>
    <div 
      id="delay-bg"
      style={{ 
        display: "flex", 
        flexDirection: "column",
        minHeight: "80vh", 
        width: "100%", 
        color: "#181b20" 
      }}
    >
      {/* Left: Calculator */}
      <div
        style={{
          padding: "2rem",
          background: "#f9fafb",
          color: "#181b20",
          display: "flex",
          flexDirection: "column"
        }}
        className="w-full sm:w-3/4 p-8 sm:border-r sm:border-gray-300"
      >
        <div style={{ display: "flex", width: "100%", marginBottom: "1.5rem" }}>
          <div style={{ width: "50%" }}>
            <h2 className="text-2xl font-bold mb-4" style={{color: "#181b20"}}>Delay & Reverb Time Calculator</h2>
            <p style={{color: "#181b20"}}>
              Enter your song&apos;s BPM and select a note value to calculate delay times. If the provided settings do not fit your needs you can also tweak them. As long as you use values that divide into the total reverb time.
            </p>
          </div>
          <div style={{ width: "50%", display: "flex", alignItems: "flex-end", gap: "20px" }}>
            <div>
              <label className="block mb-2 font-semibold" style={{color: "#181b20"}}>BPM</label>
              <input
                type="number"
                min={1}
                max={400}
                value={bpm}
                onChange={e => setBpm(Number(e.target.value))}
                className="input"
                style={{ width: "120px", padding: "0.5rem", fontSize: "1rem", color: "white" }}
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold" style={{color: "#181b20"}}>Reverb Pre-Delay</label>
              <select
                value={preDelayOption}
                onChange={e => setPreDelayOption(e.target.value as "1/32" | "1/64")}
                className="input"
                style={{ width: "120px", padding: "0.5rem", fontSize: "1rem", color: "white" }}
              >
                <option value="1/32">1/32 Note</option>
                <option value="1/64">1/64 Note</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "2rem" }}>
          <h3 className="font-bold mb-2" style={{ color: "#f3f4f6", background: "#345ea7", padding: "8px", borderRadius: "6px" }}>Reverb Lengths</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", background: "#345ea7", color: "#f3f4f6", borderRadius: "8px", marginBottom: "2rem" }}>
              <thead>
                <tr style={{ background: "#2a4d89", color: "#f3f4f6" }}>
                  <th style={{ padding: "8px", border: "1px solid #444" }}>Reverb Size</th>
                  <th style={{ padding: "8px", border: "1px solid #444" }}>Pre-Delay</th>
                  <th style={{ padding: "8px", border: "1px solid #444" }}>Total Reverb Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{background: "#2a4d89", padding: "8px", border: "1px solid #444" }}>Hall (2 Bars)</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{calculateReverbPreDelay(bpm, 8).toFixed(2) + " ms"}</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(delay1Bar) * 2).toFixed(2)} ms</td>
                </tr>
                <tr>
                  <td style={{background: "#2a4d89",padding: "8px", border: "1px solid #444" }}>Large Room (1 Bar)</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{calculateReverbPreDelay(bpm, 16).toFixed(2) + " ms"}</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{delay1Bar} ms</td>
                </tr>
                <tr>
                  <td style={{background: "#2a4d89", padding: "8px", border: "1px solid #444" }}>Small Room (1/2 Note)</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{calculateReverbPreDelay(bpm, 32).toFixed(2)} ms</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{calcDelayMs(bpm, 2)} ms</td>
                </tr>
                <tr>
                  <td style={{background: "#2a4d89", padding: "8px", border: "1px solid #444" }}>Tight Ambience (1/4 Note)</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{calculateReverbPreDelay(bpm, 64).toFixed(2)} ms</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{calcDelayMs(bpm, 1)} ms</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3 className="font-bold mb-2" style={{ color: "#f3f4f6", background: "#345ea7", padding: "8px", borderRadius: "6px" }}>Delay Lengths for different note values</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", background: "#345ea7", color: "#f3f4f6", borderRadius: "8px"}}>
              <thead>
                <tr style={{ background: "#2a4d89", color: "#f3f4f6" }}>
                  <th style={{ padding: "8px", border: "1px solid #444" }}>Note Value</th>
                  <th style={{ padding: "8px", border: "1px solid #444" }}>Length</th>
                  <th style={{ padding: "8px", border: "1px solid #444" }}>Dotted</th>
                  <th style={{ padding: "8px", border: "1px solid #444" }}>Triplets</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ background: "#2a4d89", padding: "8px", border: "1px solid #444" }}>1/1 (1 Bar)</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{calcDelayMs(bpm, 4)} ms </td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(calcDelayMs(bpm, 4)) * 1.5).toFixed(2)} ms </td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(calcDelayMs(bpm, 4)) / 1.5).toFixed(2)} ms </td>
                </tr>
                <tr>
                  <td style={{ background: "#2a4d89", padding: "8px", border: "1px solid #444" }}>1/2 (2 Beats)</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{calcDelayMs(bpm, 2)} ms </td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(calcDelayMs(bpm, 2)) * 1.5).toFixed(2)} ms </td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(calcDelayMs(bpm, 2)) / 1.5).toFixed(2)} ms </td>
                </tr>
                <tr>
                  <td style={{ background: "#2a4d89", padding: "8px", border: "1px solid #444" }}>1/4 (1 Beat)</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{calcDelayMs(bpm, 1)} ms </td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(calcDelayMs(bpm, 1)) * 1.5).toFixed(2)} ms </td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(calcDelayMs(bpm, 1)) / 1.5).toFixed(2)} ms </td>
                </tr>
                <tr>
                  <td style={{ background: "#2a4d89", padding: "8px", border: "1px solid #444" }}>1/8</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{calcDelayMs(bpm, 0.5)} ms </td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(calcDelayMs(bpm, 0.5)) * 1.5).toFixed(2)} ms </td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(calcDelayMs(bpm, 0.5)) / 1.5).toFixed(2)} ms </td>
                </tr>
                <tr>
                  <td style={{ background: "#2a4d89", padding: "8px", border: "1px solid #444" }}>1/16</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{calcDelayMs(bpm, 0.25)} ms </td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(calcDelayMs(bpm, 0.25)) * 1.5).toFixed(2)} ms </td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(calcDelayMs(bpm, 0.25)) / 1.5).toFixed(2)} ms </td>
                </tr>
                <tr>
                  <td style={{ background: "#2a4d89", padding: "8px", border: "1px solid #444" }}>1/32</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{calcDelayMs(bpm, 0.125)} ms </td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(calcDelayMs(bpm, 0.125)) * 1.5).toFixed(2)} ms </td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(calcDelayMs(bpm, 0.125)) / 1.5).toFixed(2)} ms </td>
                </tr>
                <tr>
                  <td style={{ background: "#2a4d89", padding: "8px", border: "1px solid #444" }}>1/64</td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{calcDelayMs(bpm, 0.0625)} ms </td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(calcDelayMs(bpm, 0.0625)) * 1.5).toFixed(2)} ms </td>
                  <td style={{ padding: "8px", border: "1px solid #444" }}>{(Number(calcDelayMs(bpm, 0.0625)) / 1.5).toFixed(2)} ms </td>
                </tr>
                {/* Add more rows as needed */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Right: Sign up and info */}
      <div
        style={{
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          color: "#181b20"
        }}
        className="w-full sm:w-1/4 p-8"
      >
        <h3 className="text-xl font-bold mb-4" style={{color: "#181b20"}}>Join Influanto</h3>
        <button
          className="btn btn-primary"
          style={{
            padding: "0.75rem 2rem",
            fontSize: "1.1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => window.location.href = "api/auth/signin?callbackUrl=/dashboard"}
        >
          Sign Up
        </button>
        <div style={{ color: "#181b20", textAlign: "center" }}>
          <p>
            Get access to more tools, save your settings, and connect with other musicians and producers.
          </p>
        </div>
      </div>
    </div>
    <style>{`
      #delay-bg {
        background: #638bcf !important;
      }
      
      @media (min-width: 640px) {
        #delay-bg {
          flex-direction: row !important;
        }
      }
    `}</style>
     
    <Footer></Footer>
    </>
  );
}
