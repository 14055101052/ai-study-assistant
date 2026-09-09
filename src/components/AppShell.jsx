import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "./Navbar.jsx";
import { Spinner } from "./Spinner.jsx";

export function AppShell({ children }) {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [userName, setUserName] = useState("");
  useEffect(() => {
    fetch("/api/auth/me").then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then((data) => { setUserName(data.user.name); setAuthChecked(true); }).catch(() => navigate("/login"));
  }, [navigate]);
  if (!authChecked) return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>;
  return (<div className="min-h-screen"><Navbar userName={userName} /><main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main></div>);
}
