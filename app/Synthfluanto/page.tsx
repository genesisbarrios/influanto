"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";


export default function Synthfluanto() {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octaves = [1, 2, 3, 4, 5, 6, 7];
    const def = 4;
    const synths = ['FM Synth', 'AM Synth', 'Mono Synth', 'Synth'];
    const defaultSynth = 'Synth';
 
  return (
    <>  
      <Suspense>
        <Header />
      </Suspense>
      <div
        id="bpm-bg"
        style={{
          display: "flex",
          minHeight: "80vh",
          width: "100%",
          textAlign: "center"
        }}
      >
        {/* Left: Calculator */}
        <div
          style={{
            width: "70%",
            padding: "2rem",
            background: "#f9fafb",
            borderRight: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <h1 className="text-3xl font-bold mb-4" style={{ color: "#181b20" }}>Synthfluanto</h1>
          <div id="midiPad">
            <div id="menu" className="container">
              <div className="row" style={{ paddingTop: 10 }}>
                <div className="col-2">
                  <div className="onoffswitch" id="monoOrPoly">
                    <input
                      type="checkbox"
                      name="onoffswitch"
                      className="onoffswitch-checkbox"
                      id="myonoffswitch"
                      tabIndex={0}
                    />
                    <label className="onoffswitch-label" htmlFor="myonoffswitch">
                      <span className="onoffswitch-inner"></span>
                      <span className="onoffswitch-switch"></span>
                    </label>
                  </div>
                </div>
                <div className="col-2">
                  <div style={{ color: "white", textAlign: "center" }}>Key</div>
                  <div className="select-box">
                    <select className="custom-select" id="keyInput">
                      {/* TODO: Populate options dynamically */}
                      <option value="0">C</option>
                      <option value="1">D</option>
                      <option value="2">E</option>
                      {/* ... */}
                    </select>
                  </div>
                </div>
                <div className="col-2">
                  <div style={{ color: "white", textAlign: "center" }}>Octave</div>
                  <div className="select-box">
                    <select className="custom-select" id="octaveInput">
                      {/* TODO: Populate options dynamically */}
                      <option>3</option>
                      <option>4</option>
                      <option>5</option>
                    </select>
                  </div>
                </div>
                <div className="col-4" id="synthSelection">
                  <div style={{ color: "white", textAlign: "center" }}>Synth</div>
                  <div className="select-box">
                    <select className="custom-select" id="synthInput">
                      {/* TODO: Populate options dynamically */}
                      <option>Default</option>
                      <option>Synth 1</option>
                      <option>Synth 2</option>
                    </select>
                  </div>
                </div>
                <div className="col-2" id="Brand">
                  <h2 className="padBrand">Wavy Pads</h2>
                </div>
              </div>
            </div>
            <div id="knobs" className="container">
              <div className="row">
                <div className="knob col-3" id="knob1">
                  <input type="range" className="input-knob" />
                  <p>Decay</p>
                </div>
                <div className="knob col-3" id="knob2">
                  <input type="range" className="input-knob" />
                  <p>EQ</p>
                </div>
                <div className="knob col-3" id="knob3">
                  <input type="range" className="input-knob" />
                  <p>Reverb</p>
                </div>
                <div className="knob col-3" id="knob4">
                  <input type="range" className="input-knob" />
                  <p>Gain</p>
                </div>
              </div>
            </div>
            <div className="row" style={{ height: 25 }}></div>
            <div id="pads" className="container">
              <div className="row">
                <div className="col-3">
                  <div className="pad" id="pad1">
                    <p className="keyMapping">w</p>
                  </div>
                </div>
                <div className="col-3">
                  <div className="pad" id="pad2">
                    <p className="keyMapping">e</p>
                  </div>
                </div>
                <div className="col-3">
                  <div className="pad" id="pad3">
                    <p className="keyMapping">r</p>
                  </div>
                </div>
                <div className="col-3">
                  <div className="pad" id="pad4">
                    <p className="keyMapping">t</p>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-3">
                  <div className="pad" id="pad5">
                    <p className="keyMapping">s</p>
                  </div>
                </div>
                <div className="col-3">
                  <div className="pad" id="pad6">
                    <p className="keyMapping">d</p>
                  </div>
                </div>
                <div className="col-3">
                  <div className="pad" id="pad7">
                    <p className="keyMapping">f</p>
                  </div>
                </div>
                <div className="col-3">
                  <div className="pad" id="pad8">
                    <p className="keyMapping">g</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Right: Sign up and info */}
        <div
          style={{
            width: "30%",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff"
          }}
        >
          <h3 className="text-xl font-bold mb-4">Join Influanto</h3>
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
          <div style={{ textAlign: "center" }}>
            <p>
              Get access to more tools, save your settings, and connect with other musicians and producers.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
