import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "@remix-run/react";
import {
  Home,
  Trophy,
  BarChart3,
  Search,
  Menu,
  X,
  Volleyball,
  NewspaperIcon,
  Settings,
  Star,
} from "lucide-react";

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Klick außerhalb schließt Menü
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/tournaments", label: "Turniere", icon: Trophy },
    { to: "/rankings", label: "Ranglisten", icon: BarChart3 },
    { to: "/", label: "Favouriten", icon: Star },
    { to: "/search", label: "Suche", icon: Search },
    { to: "/", label: "News", icon: NewspaperIcon },
    { to: "/", label: "Einstellungen", icon: Settings },
  ];

  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Desktop Menu */}
          <div className="hidden xl:flex gap-6">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;

              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition
          ${
            isActive
              ? "bg-slate-700 text-white font-bold"
              : "text-slate-300 font-medium hover:bg-slate-800 hover:text-white"
          }
        `}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </div>

          <Volleyball className="w-6 h-6 text-blue-600" />

          {/* Mobile Button */}
          <button
            onClick={() => setOpen(!open)}
            className="xl:hidden rounded-lg p-2 hover:bg-slate-800 transition"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <div
        ref={menuRef}
        className={`xl:hidden overflow-hidden transition-all duration-300 ${
          open ? "opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-slate-800 px-4 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
