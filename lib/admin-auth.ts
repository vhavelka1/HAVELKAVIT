import { createHash } from "crypto";
import { cookies } from "next/headers";

export const adminCookieName = "havelka_admin_session";

function adminPassword() {
  return process.env.ADMIN_PASSWORD || "admin";
}

function adminSecret() {
  return process.env.ADMIN_AUTH_SECRET || adminPassword();
}

export function adminSessionValue() {
  return createHash("sha256")
    .update(`${adminPassword()}:${adminSecret()}`)
    .digest("hex");
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(adminCookieName)?.value === adminSessionValue();
}

export function isValidAdminLogin(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME || "Admin";
  return username.trim() === expectedUser && password === adminPassword();
}
