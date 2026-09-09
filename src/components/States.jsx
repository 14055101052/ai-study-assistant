import React from "react";
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4 opacity-40">{icon || "📋"}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4">😕</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">Something went wrong</h3>
      <p className="text-sm text-gray-500 max-w-sm">{message || "An unexpected error occurred."}</p>
      {onRetry && <button onClick={onRetry} className="mt-4 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">Try Again</button>}
    </div>
  );
}
export function ProgressBar({ value }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
