"use client";

import React, { useState } from 'react';

// Import or define your components here
import Profile from './Profile';
import LinkInBio from './LinkInBio';
import QRCodeGenerator from './QRCodeGenerator';
import CuratorSearch from './CuratorSearch';
import Community from './Community';
import Collectibles from './Collectibles';
import ReleasePage from './ReleasePage';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import User from "@/models/User";

export default function Dashboard() {
  const [activeComponent, setActiveComponent] = useState('profile');

  // Components mapping
  const components: any = {
    'profile': <Profile />,
    'link-in-bio': <LinkInBio />,
    'release-page': <ReleasePage />,
    'qr-code-generator': <QRCodeGenerator />,
    'curator-search': <CuratorSearch />,
    'community': <Community />,
    'collectibles': <Collectibles/>
  };

  return (
    <div className="flex min-h-screen bg-base-200">
      {/* Sidebar menu */}
      <aside className="w-1/4 sm:w-1/3 p-0.5 sm:p-4 bg-base-100 sm:p-8">
        <ul className="menu bg-base-100 w-full p-2 rounded-box text-xs sm:text-sm md:text-base lg:text-lg">
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => setActiveComponent('profile')}>Profile</button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => setActiveComponent('link-in-bio')}>Link in Bio</button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => setActiveComponent('release-page')}>Release Pages</button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => setActiveComponent('qr-code-generator')}>QR Codes</button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => setActiveComponent('curator-search')}>Curator Search</button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => setActiveComponent('community')}>Community</button>
          </li>
            <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => setActiveComponent('collectibles')}>Collectibles</button>
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
