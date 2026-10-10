import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "note_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export function authEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

function secret(): string {
  return process.env.APP_SECRET || process.env.APP_PASSWORD || "";
}

function sign(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("hex");
}

export function makeToken(): string {
  const exp = Date.now() + MAX_AGE * 1000;
  return `${exp}.${sign(String(exp))}`;
}

export function validToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Date.now()) return false;
  const expected = sign(exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function checkPassword(input: unknown): boolean {
  if (typeof input !== "string") return false;
  const pw = process.env.APP_PASSWORD || "";
  const a = Buffer.from(input);
  const b = Buffer.from(pw);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function isAuthed(): Promise<boolean> {
  if (!authEnabled()) return true;
  const store = await cookies();
  return validToken(store.get(SESSION_COOKIE)?.value);
}

// Returns a 401 response when the caller is not allowed, otherwise null.
export async function guard(): Promise<NextResponse | null> {
  if (await isAuthed()) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const SESSION_MAX_AGE = MAX_AGE;
