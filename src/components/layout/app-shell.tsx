import Link from "next/link";
import type { Route } from "next";
import {
  BarChart3,
  BriefcaseBusiness,
  CircleDollarSign,
  FileText,
  Landmark,
  LockKeyhole,
  Settings,
} from "lucide-react";

const navItems: {
  label: string;
  href: Route;
  icon: typeof BarChart3;
}[] = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Portfele", href: "/dashboard", icon: BriefcaseBusiness },
  { label: "Transakcje", href: "/dashboard", icon: CircleDollarSign },
  { label: "Instrumenty", href: "/dashboard", icon: Landmark },
  { label: "Raporty", href: "/dashboard", icon: FileText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-base-300 bg-white/90 px-5 py-6 lg:block">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-primary text-primary-content">
            <LockKeyhole size={20} aria-hidden />
          </span>
          <span>
            <span className="block text-base font-semibold text-ink">
              InvestorWeb
            </span>
            <span className="block text-xs text-neutral/60">
              private sync client
            </span>
          </span>
        </Link>

        <nav className="mt-10 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-neutral/70 transition hover:bg-base-200 hover:text-ink"
            >
              <item.icon size={18} aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 rounded-md border border-base-300 bg-base-100 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <Settings size={16} aria-hidden />
            Tryb MVP
          </div>
          <p className="mt-2 text-xs leading-5 text-neutral/60">
            Dane przykładowe. Realne payloady będą odszyfrowywane wyłącznie po stronie klienta.
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-base-300 bg-base-100/85 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/dashboard" className="text-base font-semibold text-ink">
            InvestorWeb
          </Link>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
