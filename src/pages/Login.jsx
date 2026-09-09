import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../components/Toaster.jsx";
import { Spinner } from "../components/Spinner.jsx";
export default function LoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [loading, setLoading] = useState(false); const [errors, setErrors] = useState({});
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!email) errs.email = "Email is required"; else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email";
    if (!password) errs.password = "Password is required";
    setErrors(errs); if (Object.keys(errs).length) return;
    setLoading(true);
    try { const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); const data = await res.json(); if (!res.ok) { showToast(data.error || "Login failed", "error"); return; } showToast("Welcome back!", "success"); navigate("/dashboard"); } catch { showToast("Network error", "error"); } finally { setLoading(false); }
  };
  return (<div className="min-h-screen flex items-center justify-center px-4"><div className="w-full max-w-md"><div className="text-center mb-8"><Link to="/" className="text-2xl font-bold text-indigo-700 inline-flex items-center gap-2"><span>🎓</span> StudyAI</Link></div><div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><h1 className="text-xl font-bold text-gray-900 mb-1">Welcome Back</h1><p className="text-sm text-gray-500 mb-6">Log in to continue studying</p><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} disabled={loading} />{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}</div><div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} disabled={loading} />{errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}</div><button type="submit" className="w-full px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-50" disabled={loading}>{loading ? <Spinner size="sm" /> : "Log In"}</button></form><p className="text-sm text-center text-gray-500 mt-4">Don't have an account? <Link to="/register" className="text-indigo-600 font-medium hover:underline">Sign up</Link></p></div></div></div>);
}
