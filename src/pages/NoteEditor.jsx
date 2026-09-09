import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppShell } from "../components/AppShell.jsx";
import { LoadingPage } from "../components/Spinner.jsx";
import { ErrorState } from "../components/States.jsx";
import { useToast } from "../components/Toaster.jsx";
export default function NoteEditorPage() {
  const { id } = useParams(); const navigate = useNavigate(); const { showToast } = useToast();
  const [note, setNote] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false); const [title, setTitle] = useState(""); const [content, setContent] = useState("");
  const [topics, setTopics] = useState([]); const [selectedTopic, setSelectedTopic] = useState("");
  useEffect(() => { fetch(`/api/notes/${id}`).then((r)=>r.json()).then((d)=>{if(d.error)throw new Error();setNote(d.note);setTitle(d.note.title);setContent(d.note.content);setSelectedTopic(d.note.topicId||"");}).catch(()=>setError(true)).finally(()=>setLoading(false)); fetch("/api/topics").then((r)=>r.json()).then((d)=>{if(d.topics)setTopics(d.topics.map(t=>({id:t.id,name:t.name,subjectName:t.subjectName})));}); }, [id]);
  const handleSave = async () => { if(!title.trim()||!content.trim()) return; setSaving(true); try { const res = await fetch(`/api/notes/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,content,topicId:selectedTopic||null})}); if(res.ok)showToast("Note saved!","success");else showToast("Failed","error"); } catch { showToast("Network error","error"); } finally { setSaving(false); } };
  const handleDelete = async () => { if(!confirm("Delete this note?")) return; const res = await fetch(`/api/notes/${id}`,{method:"DELETE"}); if(res.ok){showToast("Note deleted","success");navigate("/notes");} };
  if (loading) return <AppShell><LoadingPage /></AppShell>;
  if (error||!note) return <AppShell><ErrorState /></AppShell>;
  return (<AppShell><div className="max-w-3xl mx-auto space-y-4">
    <div className="flex items-center justify-between"><Link to="/notes" className="text-sm text-gray-500 hover:underline">← Back to Notes</Link><div className="flex gap-2"><button onClick={handleDelete} className="px-4 py-2 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 text-sm">Delete</button><button onClick={handleSave} className="px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 text-sm disabled:opacity-50" disabled={saving||!title.trim()||!content.trim()}>{saving?"Saving...":"Save"}</button></div></div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">{note.subjectName&&<div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full" style={{background:note.subjectColor||"#6366f1"}} /><span className="text-gray-600">{note.subjectName} {note.topicName&&`→ ${note.topicName}`}</span></div>}<input type="text" className="text-2xl font-bold w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-300" placeholder="Note title..." value={title} onChange={(e)=>setTitle(e.target.value)} /><div><label className="block text-sm font-medium text-gray-700 mb-1">Topic</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" value={selectedTopic} onChange={(e)=>setSelectedTopic(e.target.value)}><option value="">No topic</option>{topics.map((t)=>(<option key={t.id} value={t.id}>{t.name} ({t.subjectName})</option>))}</select></div><textarea className="w-full min-h-[400px] p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 resize-y" placeholder="Write your notes here..." value={content} onChange={(e)=>setContent(e.target.value)} /></div>
  </div></AppShell>);
}
