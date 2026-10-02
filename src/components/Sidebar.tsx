"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, ShieldCheck, Clock, Code, Server } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Applications', path: '/tracking', icon: Clock },
    { name: 'Security Log', path: '/security', icon: ShieldCheck },
    { name: 'Code Scanner', path: '/scanner/code', icon: Code },
    { name: 'Infra Scanner', path: '/scanner/infra', icon: Server },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <ShieldCheck size={28} color="#8b5cf6" />
        OmniGuard Platform
      </div>
      <nav className="nav-links" style={{ marginTop: '2rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
