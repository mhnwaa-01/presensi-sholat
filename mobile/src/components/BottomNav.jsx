import React from 'react';
import { Home, CheckSquare, History, Info } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'presensi', label: 'Presensi', icon: CheckSquare },
    { id: 'riwayat', label: 'Riwayat', icon: History },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={22} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
