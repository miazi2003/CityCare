import Link from "next/link";
import { CityCareLogo } from "@/components/ui/city-care-logo";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <Link className="inline-block transition-opacity hover:opacity-90" href="/">
              <CityCareLogo showTagline={true} variant="dark" />
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              The municipal service and civic issue tracking platform connecting residents with city operational teams and administrators.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                City Operations Online
              </span>
            </div>
          </div>

          {/* Explore Portal */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link className="transition hover:text-white" href="/">
                  Home
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/departments">
                  Municipal Departments
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/categories">
                  Complaint Categories
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/services">
                  Public Services Catalog
                </Link>
              </li>
            </ul>
          </div>

          {/* Citizen Services */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Citizen Services
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link className="transition hover:text-white" href="/login">
                  Sign In
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/register">
                  Register Account
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/citizen/complaints/new">
                  Report an Issue
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/citizen/service-requests">
                  Track Service Requests
                </Link>
              </li>
            </ul>
          </div>

          {/* Accountability & Standards */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Service Standards
            </h3>
            <p className="text-xs leading-relaxed text-slate-400">
              City Care operates with transparent Service Level Agreements (SLA), direct department assignment, and citizen-verified issue resolution.
            </p>
            <div className="pt-2">
              <Link
                className="inline-flex items-center text-xs font-semibold text-slate-300 transition hover:text-white"
                href="/services"
              >
                Browse Municipal Services &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Subfooter */}
        <div className="mt-14 border-t border-slate-800/80 pt-8 flex flex-col items-center justify-between gap-4 text-xs text-slate-500 sm:flex-row">
          <p>© 2026 City Care. Municipal Complaint &amp; Service Management.</p>
          <div className="flex items-center gap-6 text-slate-400">
            <Link className="transition hover:text-white" href="/departments">
              Departments
            </Link>
            <Link className="transition hover:text-white" href="/categories">
              Categories
            </Link>
            <Link className="transition hover:text-white" href="/services">
              Services
            </Link>
            <Link className="transition hover:text-white" href="/login">
              Staff &amp; Admin Console
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
