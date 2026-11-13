"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";
import { isAdmin } from "../../lib/permissions";
import { Avatar } from "../ui/Avatar";
import { Brand } from "../ui/Brand";
import { Button } from "../ui/Button";
import { RoleBadge } from "../ui/RoleBadge";

const NAV_ITEMS = [
  { href: "/tasks", label: "Tugas", adminOnly: false },
  { href: "/users", label: "Admin Users", adminOnly: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin(user));
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <div className="min-h-screen bg-bg">
      {menuOpen && (
        <div
          aria-hidden
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-6 border-r border-line bg-surface px-4 py-5 transition-transform md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Brand withTagline />
        <nav aria-label="Menu utama" className="space-y-1">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Menu
          </p>
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-surface-2 text-ink"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Buka menu"
            className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-ink md:hidden"
          >
            <svg
              aria-hidden
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="ml-auto flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <Avatar name={user.name} />
                <span className="hidden text-sm font-medium text-ink sm:inline">
                  {user.name}
                </span>
                <RoleBadge role={user.role} />
              </div>
            )}
            <Button
              variant="ghost"
              onClick={handleSignOut}
              loading={signingOut}
            >
              Keluar
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
