import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db.js";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-me-please-1234567890");
const COOKIE_NAME = "study_auth_token";

export async function hashPassword(password) { return bcrypt.hash(password, 10); }
export async function verifyPassword(password, hashedPassword) { return bcrypt.compare(password, hashedPassword); }
export async function createToken(payload) { return new SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(JWT_SECRET); }
export async function verifyToken(token) { try { const { payload } = await jwtVerify(token, JWT_SECRET); return { userId: payload.userId, email: payload.email }; } catch { return null; } }
export async function getCurrentUser(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = db.prepare("SELECT id, email, name FROM User WHERE id = ?").get(payload.userId);
  return user || null;
}
export { COOKIE_NAME };
