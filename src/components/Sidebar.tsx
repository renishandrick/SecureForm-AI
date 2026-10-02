"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, ShieldCheck, Clock, Code, Server, LogIn, LogOut } from 'lucide-react';
import { useSession, signIn, signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Applications', path: '/tracking', icon: Clock },
    { name: 'Security Log', path: '/security', icon: ShieldCheck },
    { name: 'Code Scanner', path: '/scanner/code', icon: Code },
    { name: 'Infra Scanner', path: '/scanner/infra', icon: Server },
  ];

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="brand">
        <ShieldCheck size={28} color="#8b5cf6" />
        OmniGuard Platform
      </div>
      <nav className="nav-links" style={{ marginTop: '2rem', flex: 1 }}>
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
      
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {session ? (
          <>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.5rem' }}>
              Signed in as<br/><b>{session.user?.email}</b>
            </div>
            <button onClick={() => signOut()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
              <LogOut size={18} /> Sign Out
            </button>
          </>
        ) : (
          <button onClick={() => signIn('google')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
            <LogIn size={18} /> Sign In
          </button>
        )}
      </div>
    </aside>
  );
}
