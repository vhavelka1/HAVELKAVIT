"use server";

import { redirect } from "next/navigation";
import {
  clearPageAdminSession,
  setPageAdminSession,
  verifyPageAdminPassword,
  type PageAdminId,
} from "@/lib/page-admin";

export async function loginPageAdmin(formData: FormData) {
  const pageId = readPageId(formData);
  const password = String(formData.get("password") || "");
  const redirectTo = adminPath(pageId);
  const isValid = await verifyPageAdminPassword(pageId, password);

  if (!isValid) {
    redirect(`${redirectTo}?error=login`);
  }

  await setPageAdminSession(pageId);
  redirect(redirectTo);
}

export async function logoutPageAdmin(formData: FormData) {
  const pageId = readPageId(formData);
  await clearPageAdminSession(pageId);
  redirect(adminPath(pageId));
}

function readPageId(formData: FormData): PageAdminId {
  const value = String(formData.get("page_id") || "");

  return value === "adamek" ? "adamek" : "emicka";
}

function adminPath(pageId: PageAdminId) {
  return pageId === "adamek" ? "/adamek/admin" : "/emicka/admin";
}
