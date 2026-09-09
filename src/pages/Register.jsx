import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../components/Toaster.jsx";
import { Spinner } from "../components/Spinner.jsx";
export default function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [loading, setLoading] = useState(false); const [errors, setErrors] = useState({});
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!name || name.length < 2) errs.name = "Name must be at least 2 characters";
    if (!email) errs.email = "Email is required"; else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email";
    if (!password || password.length < 6) errs.password = "Password must be at least 6 characters";
    setErrors(errs); if (Object.keys(errs).length) return;
    setLoading(true);
    try { const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) }); const data = await res.json(); if (!res.ok) { showToast(data.error || "Registration failed", "error"); return; } showToast("Account created!", "success"); navigate("/dashboard"); } catch { showToast("Network error", "error"); } finally { setLoading(false); }
  };
  return (<div className="min-h-screen flex items-center justify-center px-4"><div className="w-full max-w-md"><div className="text-center mb-8"><Link to="/" className="text-2xl font-bold text-indigo-700 inline-flex items-center gap-2"><span>🎓</span> StudyAI</Link></div><div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><h1 className="text-xl font-bold text-gray-900 mb-1">Create Account</h1><p className="text-sm text-gray-500 mb-6">Start your learning journey today</p><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="John Doe" value={name} onChange={(e)=>setName(e.target.value)} disabled={loading} />{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}</div><div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} disabled={loading} />{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}</div><div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="At least 6 characters" value={password} onChange={(e)=>setPassword(e.target.value)} disabled={loading} />{errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}</div><button type="submit" className="w-full px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-50" disabled={loading}>{loading ? <Spinner size="sm" /> : "Create Account"}</button></form><p className="text-sm text-center text-gray-500 mt-4">Already have an account? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Log in</Link></p></div></div></div>);
}
