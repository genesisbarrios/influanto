"use client";

import React, { useState } from 'react';
import { default as nextDynamic } from 'next/dynamic';

// Regular imports for components that don't use window
import Profile from './Profile';
import LinkInBio from './LinkInBio';
import QRCodeGenerator from './QRCodeGenerator';
import CuratorSearch from './CuratorSearch';
import Community from './Community';
import ReleasePage from './ReleasePage';

// Dynamic import ONLY for Collectibles to prevent SSR issues
const DynamicCollectibles = nextDynamic(() => import('./Collectibles'), {
  ssr: false,
  loading: () => (
    <div className="p-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collectibles...</p>
        </div>
      </div>
    </div>
  )
});

// Change this line - use 'dynamic' not 'dynamicRoute'
export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const [activeComponent, setActiveComponent] = useState('profile');

  // Components mapping - use DynamicCollectibles instead of Collectibles
  const components: any = {
    'profile': <Profile />,
    'link-in-bio': <LinkInBio />,
    'release-page': <ReleasePage />,
    'qr-code-generator': <QRCodeGenerator />,
    'curator-search': <CuratorSearch />,
    'community': <Community />,
    'collectibles': <DynamicCollectibles />
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
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => setActiveComponent('collectibles')}>Collectibles</button>
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