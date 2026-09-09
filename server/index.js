import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { db, generateId } from "./db.js";
import { hashPassword, verifyPassword, createToken, getCurrentUser, COOKIE_NAME } from "./auth.js";
import { chatWithAI, explainConcept, summarizeTopic, generateQuiz, isAIConfigured } from "./ai.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ===== Auth =====
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || name.length < 2) return res.status(400).json({ error: "Name must be at least 2 characters" });
    if (!email || !/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: "Invalid email" });
    if (!password || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const existing = db.prepare("SELECT id FROM User WHERE email = ?").get(email);
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });
    const hashedPassword = await hashPassword(password);
    const id = generateId();
    db.prepare("INSERT INTO User (id, email, name, password) VALUES (?, ?, ?, ?)").run(id, email, name, hashedPassword);
    const token = await createToken({ userId: id, email });
    res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", maxAge: 604800000 });
    res.status(201).json({ user: { id, email, name }, token });
  } catch (e) { console.error("Register:", e); res.status(500).json({ error: "Failed to create account" }); }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = db.prepare("SELECT * FROM User WHERE email = ?").get(email);
    if (!user) return res.status(401).json({ error: "Invalid email or password" });
    const valid = await verifyPassword(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });
    const token = await createToken({ userId: user.id, email: user.email });
    res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", maxAge: 604800000 });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (e) { console.error("Login:", e); res.status(500).json({ error: "Failed to log in" }); }
});

app.post("/api/auth/logout", (req, res) => { res.clearCookie(COOKIE_NAME); res.json({ success: true }); });

app.get("/api/auth/me", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  res.json({ user });
});

// ===== Subjects =====
app.get("/api/subjects", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const subjects = db.prepare(`SELECT s.*, (SELECT COUNT(*) FROM Topic t WHERE t.subjectId = s.id) as topicCount, (SELECT COUNT(*) FROM Note n WHERE n.topicId IN (SELECT id FROM Topic WHERE subjectId = s.id)) as noteCount FROM Subject s WHERE s.userId = ? ORDER BY s.createdAt DESC`).all(user.id);
  res.json({ subjects });
});

app.post("/api/subjects", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ error: "Subject name is required" });
  const id = generateId();
  db.prepare("INSERT INTO Subject (id, name, description, color, userId) VALUES (?, ?, ?, ?, ?)").run(id, name, description || null, color || "#6366f1", user.id);
  res.status(201).json({ subject: db.prepare("SELECT * FROM Subject WHERE id = ?").get(id) });
});

app.get("/api/subjects/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const subject = db.prepare("SELECT * FROM Subject WHERE id = ? AND userId = ?").get(req.params.id, user.id);
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  const topics = db.prepare("SELECT * FROM Topic WHERE subjectId = ? ORDER BY createdAt ASC").all(req.params.id);
  res.json({ subject: { ...subject, topics } });
});

app.patch("/api/subjects/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const existing = db.prepare("SELECT * FROM Subject WHERE id = ? AND userId = ?").get(req.params.id, user.id);
  if (!existing) return res.status(404).json({ error: "Subject not found" });
  const { name, description, color } = req.body;
  const u = [], v = [];
  if (name !== undefined) { u.push("name = ?"); v.push(name); }
  if (description !== undefined) { u.push("description = ?"); v.push(description); }
  if (color !== undefined) { u.push("color = ?"); v.push(color); }
  u.push("updatedAt = datetime('now')"); v.push(req.params.id);
  if (u.length > 1) db.prepare(`UPDATE Subject SET ${u.join(", ")} WHERE id = ?`).run(...v);
  res.json({ subject: db.prepare("SELECT * FROM Subject WHERE id = ?").get(req.params.id) });
});

app.delete("/api/subjects/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const existing = db.prepare("SELECT * FROM Subject WHERE id = ? AND userId = ?").get(req.params.id, user.id);
  if (!existing) return res.status(404).json({ error: "Subject not found" });
  db.prepare("DELETE FROM Subject WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ===== Topics =====
app.get("/api/topics", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const sid = req.query.subjectId;
  const topics = db.prepare(`SELECT t.*, s.name as subjectName, s.color as subjectColor, (SELECT COUNT(*) FROM Note n WHERE n.topicId = t.id) as noteCount, (SELECT COUNT(*) FROM Quiz q WHERE q.topicId = t.id) as quizCount FROM Topic t JOIN Subject s ON t.subjectId = s.id WHERE s.userId = ? ${sid ? "AND t.subjectId = ?" : ""} ORDER BY t.createdAt ASC`).all(user.id, ...(sid ? [sid] : []));
  res.json({ topics });
});

app.post("/api/topics", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { name, description, subjectId } = req.body;
  if (!name) return res.status(400).json({ error: "Topic name is required" });
  const subject = db.prepare("SELECT * FROM Subject WHERE id = ? AND userId = ?").get(subjectId, user.id);
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  const id = generateId();
  db.prepare("INSERT INTO Topic (id, name, description, subjectId) VALUES (?, ?, ?, ?)").run(id, name, description || null, subjectId);
  res.status(201).json({ topic: db.prepare("SELECT t.*, s.name as subjectName, s.color as subjectColor FROM Topic t JOIN Subject s ON t.subjectId = s.id WHERE t.id = ?").get(id) });
});

app.patch("/api/topics/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const existing = db.prepare("SELECT t.* FROM Topic t JOIN Subject s ON t.subjectId = s.id WHERE t.id = ? AND s.userId = ?").get(req.params.id, user.id);
  if (!existing) return res.status(404).json({ error: "Topic not found" });
  const { name, description, completed } = req.body;
  const u = [], v = [];
  if (name !== undefined) { u.push("name = ?"); v.push(name); }
  if (description !== undefined) { u.push("description = ?"); v.push(description); }
  if (completed !== undefined) { u.push("completed = ?"); v.push(completed ? 1 : 0); }
  u.push("updatedAt = datetime('now')"); v.push(req.params.id);
  db.prepare(`UPDATE Topic SET ${u.join(", ")} WHERE id = ?`).run(...v);
  res.json({ topic: db.prepare("SELECT t.*, s.name as subjectName, s.color as subjectColor FROM Topic t JOIN Subject s ON t.subjectId = s.id WHERE t.id = ?").get(req.params.id) });
});

app.delete("/api/topics/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const existing = db.prepare("SELECT t.* FROM Topic t JOIN Subject s ON t.subjectId = s.id WHERE t.id = ? AND s.userId = ?").get(req.params.id, user.id);
  if (!existing) return res.status(404).json({ error: "Topic not found" });
  db.prepare("DELETE FROM Topic WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ===== Notes =====
app.get("/api/notes", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { search, topicId, subjectId } = req.query;
  let q = `SELECT n.*, t.name as topicName, s.name as subjectName, s.color as subjectColor FROM Note n LEFT JOIN Topic t ON n.topicId = t.id LEFT JOIN Subject s ON t.subjectId = s.id WHERE n.userId = ?`;
  const p = [user.id];
  if (search) { q += ` AND (n.title LIKE ? OR n.content LIKE ?)`; p.push(`%${search}%`, `%${search}%`); }
  if (topicId && topicId !== "all") { q += ` AND n.topicId = ?`; p.push(topicId); }
  if (subjectId && subjectId !== "all") { q += ` AND t.subjectId = ?`; p.push(subjectId); }
  q += ` ORDER BY n.updatedAt DESC`;
  res.json({ notes: db.prepare(q).all(...p) });
});

app.post("/api/notes", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { title, content, topicId } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title and content are required" });
  if (topicId) { const t = db.prepare("SELECT t.* FROM Topic t JOIN Subject s ON t.subjectId = s.id WHERE t.id = ? AND s.userId = ?").get(topicId, user.id); if (!t) return res.status(404).json({ error: "Topic not found" }); }
  const id = generateId();
  db.prepare("INSERT INTO Note (id, title, content, userId, topicId) VALUES (?, ?, ?, ?, ?)").run(id, title, content, user.id, topicId || null);
  res.status(201).json({ note: db.prepare("SELECT n.*, t.name as topicName, s.name as subjectName, s.color as subjectColor FROM Note n LEFT JOIN Topic t ON n.topicId = t.id LEFT JOIN Subject s ON t.subjectId = s.id WHERE n.id = ?").get(id) });
});

app.get("/api/notes/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const note = db.prepare("SELECT n.*, t.id as topicId, t.name as topicName, s.id as subjectId, s.name as subjectName, s.color as subjectColor FROM Note n LEFT JOIN Topic t ON n.topicId = t.id LEFT JOIN Subject s ON t.subjectId = s.id WHERE n.id = ? AND n.userId = ?").get(req.params.id, user.id);
  if (!note) return res.status(404).json({ error: "Note not found" });
  res.json({ note });
});

app.patch("/api/notes/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const existing = db.prepare("SELECT * FROM Note WHERE id = ? AND userId = ?").get(req.params.id, user.id);
  if (!existing) return res.status(404).json({ error: "Note not found" });
  const { title, content, topicId } = req.body;
  const u = [], v = [];
  if (title !== undefined) { u.push("title = ?"); v.push(title); }
  if (content !== undefined) { u.push("content = ?"); v.push(content); }
  if (topicId !== undefined) { u.push("topicId = ?"); v.push(topicId); }
  u.push("updatedAt = datetime('now')"); v.push(req.params.id);
  db.prepare(`UPDATE Note SET ${u.join(", ")} WHERE id = ?`).run(...v);
  res.json({ note: db.prepare("SELECT n.*, t.name as topicName, s.name as subjectName, s.color as subjectColor FROM Note n LEFT JOIN Topic t ON n.topicId = t.id LEFT JOIN Subject s ON t.subjectId = s.id WHERE n.id = ?").get(req.params.id) });
});

app.delete("/api/notes/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const existing = db.prepare("SELECT * FROM Note WHERE id = ? AND userId = ?").get(req.params.id, user.id);
  if (!existing) return res.status(404).json({ error: "Note not found" });
  db.prepare("DELETE FROM Note WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ===== Chat =====
app.get("/api/chat", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const messages = db.prepare("SELECT * FROM ChatMessage WHERE userId = ? ORDER BY createdAt ASC LIMIT 50").all(user.id);
  res.json({ messages, aiConfigured: isAIConfigured() });
});

app.post("/api/chat", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { message, mode, topicId, context } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });
    let contextStr = context || "";
    if (topicId) {
      const topic = db.prepare("SELECT t.*, s.name as subjectName FROM Topic t JOIN Subject s ON t.subjectId = s.id WHERE t.id = ? AND s.userId = ?").get(topicId, user.id);
      if (topic) { const notes = db.prepare("SELECT content FROM Note WHERE topicId = ?").all(topicId); contextStr = `Subject: ${topic.subjectName}\nTopic: ${topic.name}\n${notes.map(n=>n.content).join("\n\n") ? `Notes:\n${notes.map(n=>n.content).join("\n\n")}` : ""}`; }
    }
    const history = db.prepare("SELECT role, content FROM ChatMessage WHERE userId = ? ORDER BY createdAt DESC LIMIT 10").all(user.id);
    history.reverse();
    db.prepare("INSERT INTO ChatMessage (id, role, content, userId) VALUES (?, ?, ?, ?)").run(generateId(), "user", message, user.id);
    let response;
    if (mode === "explain") response = await explainConcept(message, contextStr);
    else if (mode === "summarize") { let tn = message, tc = contextStr; if (topicId) { const t = db.prepare("SELECT * FROM Topic WHERE id = ?").get(topicId); if (t) { tn = t.name; tc = db.prepare("SELECT content FROM Note WHERE topicId = ?").all(topicId).map(n=>n.content).join("\n\n") || message; } } response = await summarizeTopic(tn, tc); }
    else response = await chatWithAI(message, history, contextStr);
    db.prepare("INSERT INTO ChatMessage (id, role, content, userId) VALUES (?, ?, ?, ?)").run(generateId(), "assistant", response, user.id);
    res.json({ response, aiConfigured: isAIConfigured() });
  } catch (e) { console.error("POST chat:", e.message); res.status(500).json({ error: e.message || "Failed to get AI response" }); }
});

app.delete("/api/chat", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  db.prepare("DELETE FROM ChatMessage WHERE userId = ?").run(user.id);
  res.json({ success: true });
});

// ===== Quiz =====
app.get("/api/quiz", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const quizzes = db.prepare("SELECT q.*, t.name as topicName, s.name as subjectName, s.color as subjectColor FROM Quiz q LEFT JOIN Topic t ON q.topicId = t.id LEFT JOIN Subject s ON t.subjectId = s.id WHERE q.userId = ? ORDER BY q.createdAt DESC").all(user.id);
  res.json({ quizzes });
});

app.post("/api/quiz", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { title, topicId, questions, score } = req.body;
  if (!title || !questions) return res.status(400).json({ error: "Title and questions are required" });
  if (topicId) { const t = db.prepare("SELECT t.* FROM Topic t JOIN Subject s ON t.subjectId = s.id WHERE t.id = ? AND s.userId = ?").get(topicId, user.id); if (!t) return res.status(404).json({ error: "Topic not found" }); }
  const id = generateId();
  const takenAt = score !== null && score !== undefined ? new Date().toISOString() : null;
  db.prepare("INSERT INTO Quiz (id, title, topicId, userId, questions, score, takenAt) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, title, topicId || null, user.id, JSON.stringify(questions), score ?? null, takenAt);
  res.status(201).json({ quiz: db.prepare("SELECT q.*, t.name as topicName, s.name as subjectName, s.color as subjectColor FROM Quiz q LEFT JOIN Topic t ON q.topicId = t.id LEFT JOIN Subject s ON t.subjectId = s.id WHERE q.id = ?").get(id) });
});

app.post("/api/quiz/generate", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { topicId, numQuestions = 5 } = req.body;
    if (!topicId) return res.status(400).json({ error: "Topic is required" });
    const topic = db.prepare("SELECT t.*, s.name as subjectName FROM Topic t JOIN Subject s ON t.subjectId = s.id WHERE t.id = ? AND s.userId = ?").get(topicId, user.id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    const notes = db.prepare("SELECT content FROM Note WHERE topicId = ?").all(topicId);
    const topicContent = notes.map(n=>n.content).join("\n\n") || `Topic: ${topic.name}. ${topic.description || "No additional notes available."}`;
    const questions = await generateQuiz(topic.name, topicContent, numQuestions);
    res.json({ questions, topicName: topic.name, subjectName: topic.subjectName, aiConfigured: isAIConfigured() });
  } catch (e) { console.error("Generate quiz:", e.message); res.status(500).json({ error: e.message || "Failed to generate quiz" }); }
});

app.get("/api/quiz/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const quiz = db.prepare("SELECT q.*, t.name as topicName, s.name as subjectName, s.color as subjectColor FROM Quiz q LEFT JOIN Topic t ON q.topicId = t.id LEFT JOIN Subject s ON t.subjectId = s.id WHERE q.id = ? AND q.userId = ?").get(req.params.id, user.id);
  if (!quiz) return res.status(404).json({ error: "Quiz not found" });
  res.json({ quiz: { ...quiz, questions: JSON.parse(quiz.questions) } });
});

app.patch("/api/quiz/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const existing = db.prepare("SELECT * FROM Quiz WHERE id = ? AND userId = ?").get(req.params.id, user.id);
  if (!existing) return res.status(404).json({ error: "Quiz not found" });
  db.prepare("UPDATE Quiz SET score = ?, takenAt = datetime('now'), updatedAt = datetime('now') WHERE id = ?").run(req.body.score ?? null, req.params.id);
  const quiz = db.prepare("SELECT * FROM Quiz WHERE id = ?").get(req.params.id);
  res.json({ quiz: { ...quiz, questions: JSON.parse(quiz.questions) } });
});

app.delete("/api/quiz/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const existing = db.prepare("SELECT * FROM Quiz WHERE id = ? AND userId = ?").get(req.params.id, user.id);
  if (!existing) return res.status(404).json({ error: "Quiz not found" });
  db.prepare("DELETE FROM Quiz WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ===== Dashboard =====
app.get("/api/dashboard", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const subjects = db.prepare("SELECT s.*, (SELECT COUNT(*) FROM Topic t WHERE t.subjectId = s.id) as topicCount, (SELECT COUNT(*) FROM Topic t WHERE t.subjectId = s.id AND t.completed = 1) as completedTopicCount, (SELECT COUNT(*) FROM Note n WHERE n.topicId IN (SELECT id FROM Topic WHERE subjectId = s.id)) as noteCount FROM Subject s WHERE s.userId = ? ORDER BY s.createdAt DESC").all(user.id);
  const recentNotes = db.prepare("SELECT id, title, updatedAt FROM Note WHERE userId = ? ORDER BY updatedAt DESC LIMIT 5").all(user.id);
  const recentQuizzes = db.prepare("SELECT id, title, score, takenAt FROM Quiz WHERE userId = ? ORDER BY createdAt DESC LIMIT 5").all(user.id);
  const chatCount = db.prepare("SELECT COUNT(*) as count FROM ChatMessage WHERE userId = ?").get(user.id);
  const totalQuizzes = db.prepare("SELECT COUNT(*) as count FROM Quiz WHERE userId = ?").get(user.id);
  const totalTopics = subjects.reduce((a, s) => a + s.topicCount, 0);
  const completedTopics = subjects.reduce((a, s) => a + s.completedTopicCount, 0);
  const totalNotes = subjects.reduce((a, s) => a + s.noteCount, 0);
  const scored = recentQuizzes.filter(q => q.score !== null);
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((a, q) => a + q.score, 0) / scored.length) : 0;
  const subjectProgress = subjects.map(s => ({ id: s.id, name: s.name, color: s.color, totalTopics: s.topicCount, completedTopics: s.completedTopicCount, noteCount: s.noteCount, progress: s.topicCount > 0 ? Math.round((s.completedTopicCount / s.topicCount) * 100) : 0 }));
  res.json({ stats: { totalSubjects: subjects.length, totalTopics, completedTopics, totalNotes, totalQuizzes: totalQuizzes.count, avgScore, chatCount: chatCount.count }, subjectProgress, recentNotes, recentQuizzes });
});

// ===== Static files =====
const publicPath = path.join(__dirname, "..", "public");
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.get("*", (req, res) => {
    const indexPath = path.join(publicPath, "index.html");
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).json({ error: "Not found" });
  });
}

app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`); });
