"use client";

import React, { useState, useEffect } from 'react';
import posthog from "posthog-js";

// Import or define your components here
import Profile from './Profile';
import LinkInBio from './LinkInBio';
import QRCodeGenerator from './QRCodeGenerator';
import CuratorSearch from './CuratorSearch';
import Community from './Community';
import ReleasePage from './ReleasePage';
import SplitSheets from './SplitSheets';
import Outreach from './Outreach';
// import Crossposting from './Crossposting'; // hidden until TikTok API approval

export default function Dashboard() {
  const [activeComponent, setActiveComponent] = useState('profile');

  // Allow deep-linking to a tab, e.g. /dashboard?tab=split-sheets (used after signing)
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab && tab in components) setActiveComponent(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabSwitch = (tab: string) => {
    setActiveComponent(tab);
    posthog.capture("dashboard_tab_switched", { tab });
  };

  // Components mapping
  const components: any = {
    'profile': <Profile />,
    'link-in-bio': <LinkInBio />,
    'release-page': <ReleasePage />,
    'qr-code-generator': <QRCodeGenerator />,
    'split-sheets': <SplitSheets />,
    'outreach': <Outreach />,
    'curator-search': <CuratorSearch />,
    // 'crossposting': <Crossposting />, // hidden until TikTok API approval
    'community': <Community />
  };

  return (
    <div className="flex min-h-screen bg-base-200">
      {/* Sidebar menu */}
      <aside className="w-1/4 sm:w-1/5 lg:w-[180px] p-0.5 sm:p-4 bg-base-100 shrink-0">
        <ul className="menu bg-base-100 w-full p-2 rounded-box text-xs sm:text-sm md:text-base">
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => handleTabSwitch('profile')}>Profile</button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => handleTabSwitch('link-in-bio')}>Link in Bio</button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => handleTabSwitch('release-page')}>Release Pages</button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => handleTabSwitch('qr-code-generator')}>QR Codes</button>
          </li>
          {/* <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => handleTabSwitch('curator-search')}>Curator Search</button>
          </li> */}
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => handleTabSwitch('split-sheets')}>
              Split Sheets
            </button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => handleTabSwitch('outreach')}>
              Outreach
            </button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => handleTabSwitch('curator-search')}>
              Curator Search
            </button>
          </li>
          <li>
            <button className="block p-2 hover:bg-blue-100 w-full" onClick={() => handleTabSwitch('community')}>Community</button>
          </li>
        </ul>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-8 pb-24 min-w-0">
        <section className="max-w-5xl mx-auto space-y-8">
          {/* Render the active component */}
          {components[activeComponent]}
        </section>
      </main>
    </div>
  );
}
