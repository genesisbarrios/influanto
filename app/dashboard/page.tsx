"use client";

import React, { useState, useEffect } from 'react';
import posthog from "posthog-js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faUser,
  faLink,
  faCompactDisc,
  faBullhorn,
  faFileSignature,
  faHeadphones,
  faQrcode,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';

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

interface Tab {
  key: string;
  label: string;
  icon: IconDefinition;
}

// Shared by the desktop sidebar and the mobile bottom bar so both stay in sync.
const TABS: Tab[] = [
  { key: 'profile', label: 'Profile', icon: faUser },
  { key: 'link-in-bio', label: 'Link in Bio', icon: faLink },
  { key: 'release-page', label: 'Releases', icon: faCompactDisc },
  { key: 'outreach', label: 'Outreach', icon: faBullhorn },
  { key: 'split-sheets', label: 'Splits', icon: faFileSignature },
  { key: 'curator-search', label: 'Playlisting', icon: faHeadphones },
  { key: 'qr-code-generator', label: 'QR Codes', icon: faQrcode },
  { key: 'community', label: 'Community', icon: faUsers },
];

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
      {/* Sidebar menu — desktop only, the mobile bottom bar takes over below sm */}
      <aside className="hidden sm:block sm:w-1/5 lg:w-[180px] p-0.5 sm:p-4 bg-base-100 shrink-0">
        <ul className="menu bg-base-100 w-full p-2 rounded-box text-xs sm:text-sm md:text-base">
          {TABS.map(tab => (
            <li key={tab.key}>
              <button
                className="block p-2 hover:bg-blue-100 w-full"
                onClick={() => handleTabSwitch(tab.key)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main content */}
      <main className="flex-1 w-full p-4 sm:p-8 pb-24 min-w-0">
        <section className="max-w-5xl mx-auto space-y-8">
          {/* Render the active component */}
          {components[activeComponent]}
        </section>
      </main>

      {/* Bottom tab bar — mobile only, frees up the full width for content */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex sm:hidden border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]"
        aria-label="Dashboard navigation"
      >
        {TABS.map(tab => {
          const isActive = activeComponent === tab.key;
          return (
            <button
              key={tab.key}
              title={tab.label}
              onClick={() => handleTabSwitch(tab.key)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              className="flex flex-1 flex-col items-center justify-center gap-1.5 py-3 min-w-0"
            >
              <FontAwesomeIcon
                icon={tab.icon}
                className="h-5 w-5"
                style={{ color: isActive ? '#4f46e5' : '#9ca3af' }}
              />
              <span
                className="h-1 w-1 rounded-full transition-colors"
                style={{ backgroundColor: isActive ? '#4f46e5' : 'transparent' }}
              />
              <span className="sr-only">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
