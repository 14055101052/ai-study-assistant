import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS User (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS Subject (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, color TEXT DEFAULT '#6366f1', userId TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS Topic (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, completed INTEGER DEFAULT 0, subjectId TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (subjectId) REFERENCES Subject(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS Note (id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, userId TEXT NOT NULL, topicId TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE, FOREIGN KEY (topicId) REFERENCES Topic(id) ON DELETE SET NULL);
  CREATE TABLE IF NOT EXISTS Quiz (id TEXT PRIMARY KEY, title TEXT NOT NULL, topicId TEXT, userId TEXT NOT NULL, questions TEXT NOT NULL, score INTEGER, takenAt TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE, FOREIGN KEY (topicId) REFERENCES Topic(id) ON DELETE SET NULL);
  CREATE TABLE IF NOT EXISTS ChatMessage (id TEXT PRIMARY KEY, role TEXT NOT NULL, content TEXT NOT NULL, userId TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE);
  CREATE INDEX IF NOT EXISTS idx_subject_userId ON Subject(userId);
  CREATE INDEX IF NOT EXISTS idx_topic_subjectId ON Topic(subjectId);
  CREATE INDEX IF NOT EXISTS idx_note_userId ON Note(userId);
  CREATE INDEX IF NOT EXISTS idx_quiz_userId ON Quiz(userId);
  CREATE INDEX IF NOT EXISTS idx_chat_userId ON ChatMessage(userId);
`);

export function generateId() { return Date.now().toString(36) + Math.random().toString(36).substring(2, 10); }
export { db };
