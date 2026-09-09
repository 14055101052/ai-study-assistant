import React from "react";
import { Link } from "react-router-dom";
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-gray-200"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between"><div className="flex items-center gap-2 font-bold text-lg text-indigo-700"><span className="text-xl">🎓</span> StudyAI</div><div className="flex items-center gap-3"><Link to="/login" className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all text-sm">Login</Link><Link to="/register" className="px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-sm">Get Started</Link></div></div></nav>
      <main className="flex-1 flex items-center justify-center px-4"><div className="max-w-3xl text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Your AI-Powered <span className="text-indigo-600">Study Companion</span></h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">Organize subjects, create notes, chat with an AI assistant, generate quizzes, and track your progress — all in one place.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center"><Link to="/register" className="px-6 py-3 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-base">Start Studying Free</Link><Link to="/login" className="px-6 py-3 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all text-base">I have an account</Link></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16">{[{"icon":"📚","title":"Organize Subjects","desc":"Create subjects, topics, and notes in a structured way"},{"icon":"🤖","title":"AI Assistant","desc":"Ask questions, get explanations, and summarize topics"},{"icon":"✅","title":"AI Quizzes","desc":"Generate quizzes from your topics and track your scores"}].map((f)=>(<div key={f.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left"><div className="text-3xl mb-2">{f.icon}</div><h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3><p className="text-sm text-gray-500">{f.desc}</p></div>))}</div>
      </div></main>
      <footer className="py-4 text-center text-sm text-gray-400">Built with Express, React, SQLite, and OpenAI</footer>
    </div>
  );
}
