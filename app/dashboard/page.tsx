"use client";

import React, { useState } from 'react';

// Import or define your components here
import Profile from './Profile';
import LinkInBio from './LinkInBio';
import QRCodeGenerator from './QRCodeGenerator';
import PitchToSpotify from './PitchToSpotify';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export default function Dashboard() {
  const [activeComponent, setActiveComponent] = useState('profile');

  // Components mapping
  const components: { [key: string]: JSX.Element } = {
    'profile': <Profile />,
    'link-in-bio': <LinkInBio />,
    'qr-code-generator': <QRCodeGenerator />,
    'pitch-to-spotify': <PitchToSpotify />,
  };

  return (
    <div className="flex min-h-screen bg-base-200">
      {/* Sidebar menu */}
      <aside className="w-64 p-8 bg-base-100">
        <ul className="menu bg-base-100 w-56 p-2 rounded-box">
        <li>
            <button className="block p-4 hover:bg-blue-100" onClick={() => setActiveComponent('profile')}>Profile</button>
          </li>
          <li>
            <button className="block p-4 hover:bg-blue-100" onClick={() => setActiveComponent('link-in-bio')}>Link in Bio</button>
          </li>
          <li>
            <button className="block p-4 hover:bg-blue-100" onClick={() => setActiveComponent('qr-code-generator')}>QR Code Generator</button>
          </li>
          <li>
            <button className="block p-4 hover:bg-blue-100" onClick={() => setActiveComponent('pitch-to-spotify')}>Pitch to Spotify</button>
          </li>
        </ul>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 pb-24">
        <section className="max-w-xl mx-auto space-y-8">
          {/* Render the active component */}
          {components[activeComponent]}
        </section>
      </main>
    </div>
  );
}