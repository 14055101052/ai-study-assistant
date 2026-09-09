import React, { useEffect, useState, useRef } from "react";
import { AppShell } from "../components/AppShell.jsx";
import { LoadingPage } from "../components/Spinner.jsx";
import { EmptyState, ErrorState } from "../components/States.jsx";
import { useToast } from "../components/Toaster.jsx";
import { Spinner } from "../components/Spinner.jsx";
export default function ChatPage() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(false);
  const [input, setInput] = useState(""); const [sending, setSending] = useState(false); const [aiConfigured, setAiConfigured] = useState(true);
  const [mode, setMode] = useState("chat"); const [topics, setTopics] = useState([]); const [selectedTopic, setSelectedTopic] = useState("");
  const ref = useRef(null);
  const fetchMessages = () => { setLoading(true); setError(false); fetch("/api/chat").then((r)=>r.json()).then((d)=>{if(d.error)throw new Error();setMessages(d.messages||[]);setAiConfigured(d.aiConfigured!==false);}).catch(()=>setError(true)).finally(()=>setLoading(false)); };
  useEffect(() => { fetchMessages(); fetch("/api/topics").then((r)=>r.json()).then((d)=>{if(d.topics)setTopics(d.topics.map(t=>({id:t.id,name:t.name,subjectName:t.subjectName})));}); }, []);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const handleSend = async (e) => { e.preventDefault(); if(!input.trim()||sending) return; setSending(true); const um=input; setInput(""); const om={id:"temp-"+Date.now(),role:"user",content:um,createdAt:new Date().toISOString()}; setMessages(p=>[...p,om]); try { const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:um,mode,topicId:selectedTopic||null})}); const data=await res.json(); if(!res.ok){showToast(data.error||"Failed","error");setMessages(p=>p.filter(m=>m.id!==om.id));setInput(um);return;} fetchMessages(); } catch { showToast("Network error","error"); setMessages(p=>p.filter(m=>m.id!==om.id)); setInput(um); } finally { setSending(false); } };
  const handleClear = async () => { if(!confirm("Clear all chat?")) return; await fetch("/api/chat",{method:"DELETE"}); setMessages([]); showToast("Chat cleared","success"); };
  if (loading) return <AppShell><LoadingPage /></AppShell>;
  if (error) return <AppShell><ErrorState onRetry={fetchMessages} /></AppShell>;
  return (<AppShell><div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
    <div className="flex items-center justify-between mb-4"><div><h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1><p className="text-sm text-gray-500 mt-1">{aiConfigured?"Ask questions, get explanations":"⚠️ AI not configured — set OPENAI_API_KEY"}</p></div>{messages.length>0&&<button onClick={handleClear} className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm">Clear</button>}</div>
    <div className="flex gap-2 mb-3">{[{value:"chat",label:"💬 Chat"},{value:"explain",label:"💡 Explain"},{value:"summarize",label:"📋 Summarize"}].map((m)=>(<button key={m.value} onClick={()=>setMode(m.value)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${mode===m.value?"bg-indigo-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{m.label}</button>))}</div>
    {topics.length>0&&<select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3 text-sm" value={selectedTopic} onChange={(e)=>setSelectedTopic(e.target.value)}><option value="">No topic context</option>{topics.map((t)=>(<option key={t.id} value={t.id}>{t.name} ({t.subjectName})</option>))}</select>}
    <div className="flex-1 overflow-y-auto space-y-4 bg-gray-50 rounded-xl p-4">{messages.length===0?<div className="flex flex-col items-center justify-center h-full"><EmptyState icon="🤖" title="Start a conversation" description={mode==="explain"?"Ask me to explain any concept":mode==="summarize"?"Select a topic and I'll summarize it":"Ask me anything about your studies!"} /></div>:messages.map((msg)=>(<div key={msg.id} className={`flex ${msg.role==="user"?"justify-end":"justify-start"}`}><div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.role==="user"?"bg-indigo-600 text-white":"bg-white border border-gray-200 text-gray-800"}`}><p className="text-sm whitespace-pre-wrap">{msg.content}</p></div></div>))}{sending&&<div className="flex justify-start"><div className="bg-white border border-gray-200 rounded-2xl px-4 py-3"><Spinner size="sm" /></div></div>}<div ref={ref} /></div>
    <form onSubmit={handleSend} className="mt-3 flex gap-2"><input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={mode==="explain"?"What concept to explain?":mode==="summarize"?"What topic to summarize?":"Type your question..."} value={input} onChange={(e)=>setInput(e.target.value)} disabled={sending} /><button type="submit" className="px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50" disabled={sending||!input.trim()}>{sending?<Spinner size="sm"/>:"Send"}</button></form>
  </div></AppShell>);
}
