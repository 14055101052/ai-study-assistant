import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/subjects", label: "Subjects", icon: "📚" },
  { href: "/notes", label: "Notes", icon: "📝" },
  { href: "/chat", label: "AI Assistant", icon: "🤖" },
  { href: "/quizzes", label: "Quizzes", icon: "✅" },
];

export function Navbar({ userName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [name, setName] = useState(userName || "");

  useEffect(() => {
    if (!name) {
      fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((d) => d?.user?.name && setName(d.user.name)).catch(() => {});
    }
  }, [name]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg text-indigo-700">
              <span className="text-xl">🎓</span><span className="hidden sm:inline">StudyAI</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} to={item.href} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${location.pathname.startsWith(item.href) ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}>
                  <span className="mr-1">{item.icon}</span>{item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {name && <span className="hidden sm:inline text-sm text-gray-600">Hi, <span className="font-medium">{name}</span></span>}
            <button onClick={handleLogout} className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all text-sm">Logout</button>
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden pb-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)} className={`px-3 py-2 rounded-lg text-sm font-medium ${location.pathname.startsWith(item.href) ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}>
                <span className="mr-2">{item.icon}</span>{item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
