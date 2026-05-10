"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  {
    href: "/",
    label: "냉장고",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="2" width="12" height="15" rx="1.5" />
        <line x1="3" y1="7" x2="15" y2="7" />
        <line x1="6" y1="10" x2="6" y2="13" />
      </svg>
    ),
  },
  {
    href: "/saved",
    label: "저장됨",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h12v13l-6-3-6 3V3z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "프로필",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="6" r="3" />
        <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" />
      </svg>
    ),
  },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around px-4 py-2"
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {LINKS.map(({ href, label, icon }) => {
        const active =
          pathname === href ||
          (href === "/" && pathname.startsWith("/step2")) ||
          (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 rounded-sm px-4 py-1.5 transition-all duration-150"
            style={{
              color: active ? "var(--accent)" : "var(--muted)",
              background: active ? "var(--accent-light)" : "transparent",
            }}
          >
            {icon}
            <span
              className="font-mono text-[10px] tracking-widest uppercase"
              style={{ fontWeight: active ? 600 : 400 }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
