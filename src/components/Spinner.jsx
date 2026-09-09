import React from "react";
export function Spinner({ size = "md" }) {
  const s = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return <div className="flex items-center justify-center"><div className={`${s[size]} border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin`} /></div>;
}
export function LoadingPage() {
  return <div className="flex items-center justify-center min-h-[60vh]"><div className="flex flex-col items-center gap-3"><Spinner size="lg" /><p className="text-gray-500 text-sm">Loading...</p></div></div>;
}
