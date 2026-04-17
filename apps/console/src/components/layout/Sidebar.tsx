'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard',     icon: '📊', label: 'Dashboard' },
  { href: '/orders',        icon: '📦', label: 'Orders' },
  { href: '/restaurants',   icon: '🏪', label: 'Restaurants' },
  { href: '/riders',        icon: '🛵', label: 'Riders' },
  { href: '/zones',         icon: '🗺️',  label: 'Zones' },
  { href: '/kyc',           icon: '📋', label: 'KYC', badge: 'kyc' },
  { href: '/payments',      icon: '💳', label: 'Payments' },
  { href: '/notifications', icon: '🔔', label: 'Notifications' },
  { href: '/settings',      icon: '⚙️',  label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-neutral-900 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm font-dzongkha">ཞི</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Zhim Console</p>
            <p className="text-neutral-400 text-xs">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-amber-500 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-neutral-800">
        <p className="text-neutral-500 text-xs">ཞིམ། v0.1.0 — MVP</p>
        <p className="text-neutral-600 text-xs">Thimphu · BTN</p>
      </div>
    </aside>
  );
}
