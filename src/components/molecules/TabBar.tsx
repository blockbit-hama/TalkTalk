"use client";
import { cn } from '@/lib/utils/utils';
import { useRouter, usePathname } from "next/navigation";

const tabList = [
  { key: "wallet", label: "지갑", path: "/", icon: (
    <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="8" width="22" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
      <rect x="18" y="13" width="4" height="2" rx="1" fill="currentColor"/>
    </svg>
  ) },
  { key: "chat", label: "채팅", path: "/chat-list", icon: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) },
  { key: "friends", label: "친구", path: "/friends", icon: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) },
  { key: "settings", label: "설정", path: "/settings", icon: (
    <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M14 10V14L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) },
];

export function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="tab-bar">
      {tabList.map(tab => {
        const isActive = pathname === tab.path;
        return (
          <button
            key={tab.key}
            onClick={() => router.push(tab.path)}
            className="bg-transparent border-0 flex flex-col items-center flex-1 cursor-pointer font-bold text-sm"
            style={{
              color: isActive ? '#F2A003' : '#888A92',
              fontSize: '13px',
              fontWeight: 700,
              gap: '2px'
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}