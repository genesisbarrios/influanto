"use client";

import React, { useState } from 'react';

// Import or define your components here
import Profile from './Profile';
import LinkInBio from './LinkInBio';
import QRCodeGenerator from './QRCodeGenerator';
import PitchToSpotify from './PitchToSpotify';
import Community from './Community';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import User from "@/models/User";
import ButtonAccount from '@/components/ButtonAccount';

export default function Dashboard() {
  const [activeComponent, setActiveComponent] = useState('profile');

  // Components mapping
  const components: any = {
    'profile': <Profile />,
    'link-in-bio': <LinkInBio />,
    'qr-code-generator': <QRCodeGenerator />,
    'pitch-to-spotify': <PitchToSpotify />,
    'community': <Community />
  };

  return (
    <div className="flex min-h-screen bg-base-200">
      {/* Sidebar menu */}
      <aside className="w-1/4 sm:w-1/3 p-4 bg-base-100 sm:w-1/3 sm:p-8 xs:pr-8">
        <ul className="menu bg-base-100 w-full p-2 rounded-box text-[0.8em] md:text-base lg:text-lg">
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => setActiveComponent('profile')}>Profile</button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => setActiveComponent('link-in-bio')}>Link in Bio</button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => setActiveComponent('qr-code-generator')}>QR Codes</button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => setActiveComponent('pitch-to-spotify')}>Curator Search</button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => setActiveComponent('community')}>Community</button>
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
