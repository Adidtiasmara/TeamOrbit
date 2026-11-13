"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from "react";
import { useAuth } from "../../hooks/useAuth";
import type { Role } from "../../lib/types";
import { Avatar } from "../ui/Avatar";
import { Brand } from "../ui/Brand";
import {
  ChartIcon,
  LogoutIcon,
  MenuIcon,
  ShieldIcon,
  SpinnerIcon,
  TasksIcon,
  UserIcon,
  UsersIcon,
} from "../ui/Icons";
import { RoleBadge } from "../ui/RoleBadge";

interface NavItem {
  href: string;
  label: string;
  Icon: (props: { size?: number }) => ReactNode;
}

interface RoleLayout {
  heading: string;
  nav: NavItem[];
  /** Kelas menu aktif; Admin memakai aksen pengelola. */
  activeClass: string;
}

/** Satu-satunya pembeda tampilan Admin dan Member (Requirement 12). */
const LAYOUTS: Record<Role, RoleLayout> = {
  admin: {
    heading: "Panel Admin",
    nav: [
      { href: "/tasks", label: "Kelola tugas", Icon: TasksIcon },
      { href: "/users", label: "Kelola pengguna", Icon: UsersIcon },
      { href: "/profile", label: "Profil", Icon: UserIcon },
    ],
    activeClass: "bg-admin-soft text-admin",
  },
  member: {
    heading: "Menu",
    nav: [
      { href: "/tasks", label: "Tugas", Icon: TasksIcon },
      { href: "/summary", label: "Ringkasan", Icon: ChartIcon },
      { href: "/profile", label: "Profil", Icon: UserIcon },
    ],
    activeClass: "bg-surface-2 text-ink",
  },
};

/** Jeda sebelum rail melebar/menciut supaya tidak berkedip saat kursor melintas. */
const HOVER_DELAY_MS = 150;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const admin = user?.role === "admin";
  const layout = LAYOUTS[user?.role ?? "member"];
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  // Hanya berpengaruh di desktop (md ke atas); mobile memakai menuOpen.
  const [expanded, setExpanded] = useState(false);
  const hoverTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  const expandLater = (value: boolean) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(
      () => setExpanded(value),
      HOVER_DELAY_MS,
    );
  };

  const expandNow = (value: boolean) => {
    window.clearTimeout(hoverTimer.current);
    setExpanded(value);
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      expandNow(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  const collapsed = !expanded;

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
        onMouseEnter={() => expandLater(true)}
        onMouseLeave={() => expandLater(false)}
        onFocus={() => expandNow(true)}
        onBlur={handleBlur}
        data-expanded={expanded}
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-6 overflow-x-hidden border-r border-line bg-surface px-3 py-5 motion-safe:transition-[width,translate,box-shadow] motion-safe:duration-150 md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } ${expanded ? "md:w-64 md:shadow-xl" : "md:w-16"} ${
          admin ? "border-t-4 border-t-admin" : ""
        }`}
      >
        <div className="px-1">
          <Brand withTagline collapsed={collapsed} admin={admin} />
        </div>
        <nav aria-label="Menu utama" className="space-y-1">
          <p
            className={`flex items-center gap-1.5 whitespace-nowrap px-3 pb-1 text-xs font-semibold uppercase tracking-wide motion-safe:transition-opacity ${
              admin ? "text-admin" : "text-muted"
            } ${collapsed ? "md:opacity-0" : ""}`}
          >
            {admin && <ShieldIcon size={14} />}
            {layout.heading}
          </p>
          {layout.nav.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                title={label}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent ${
                  active
                    ? layout.activeClass
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon />
                {/* Label tetap ada (nama aksesibel), hanya transparan dan
                    terpotong oleh rail supaya posisi menu tidak bergeser. */}
                <span
                  className={`whitespace-nowrap motion-safe:transition-opacity ${
                    collapsed ? "md:opacity-0" : ""
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-16">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Buka menu"
            className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-ink md:hidden"
          >
            <MenuIcon />
          </button>
          {admin && (
            <span className="hidden items-center gap-1.5 rounded-full bg-admin-soft px-3 py-1 text-xs font-semibold text-admin sm:inline-flex">
              <ShieldIcon size={14} />
              Panel Admin
            </span>
          )}
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
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              aria-busy={signingOut || undefined}
              aria-label="Keluar"
              title="Keluar"
              className="inline-flex size-10 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signingOut ? <SpinnerIcon /> : <LogoutIcon />}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
