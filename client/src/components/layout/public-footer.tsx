import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Description */}
          <div className="space-y-4">
            <Link className="flex items-center gap-2.5 text-slate-950" href="/">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                CC
              </span>
              <span className="text-base font-bold tracking-tight text-slate-950">
                City Care
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-600">
              The municipal complaint tracking and public service fulfillment portal connecting citizens, operational departments, and city administrators.
            </p>
          </div>

          {/* Platform Navigation */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Public Portal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="transition hover:text-slate-950 hover:underline" href="/">
                  Home
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-slate-950 hover:underline" href="/departments">
                  Municipal Departments
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-slate-950 hover:underline" href="/categories">
                  Complaint Categories
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-slate-950 hover:underline" href="/services">
                  Public Services Catalog
                </Link>
              </li>
            </ul>
          </div>

          {/* Citizen Access */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Citizen Access
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="transition hover:text-slate-950 hover:underline" href="/login">
                  Citizen Sign In
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-slate-950 hover:underline" href="/register">
                  Register as a Citizen
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-slate-950 hover:underline" href="/citizen/complaints/new">
                  Submit a Complaint
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-slate-950 hover:underline" href="/citizen/service-requests">
                  Service Request History
                </Link>
              </li>
            </ul>
          </div>

          {/* Municipal Operations & Standards */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Operations &amp; Standards
            </h3>
            <p className="text-xs leading-relaxed text-slate-500">
              City Care operates under strict Service Level Agreements (SLA) with direct departmental assignment, end-to-end status transparency, and citizen resolution feedback.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live Civic Resolution
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Subfooter */}
        <div className="mt-12 border-t border-slate-100 pt-8 flex flex-col items-center justify-between gap-4 text-xs text-slate-500 sm:flex-row">
          <p>© City Care. Municipal Complaint &amp; Service Management Platform.</p>
          <div className="flex items-center gap-6">
            <Link className="hover:text-slate-700" href="/departments">
              Departments
            </Link>
            <Link className="hover:text-slate-700" href="/categories">
              Categories
            </Link>
            <Link className="hover:text-slate-700" href="/services">
              Services
            </Link>
            <Link className="hover:text-slate-700" href="/login">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
