import type { UserRole } from "./types/user";

const ROLE_REDIRECT_KEY = "priemman:dashboard-role-redirect";
const ROLE_REDIRECT_WINDOW_MS = 10_000;

export function dashboardPathForRole(role: UserRole) {
  if (role === "admin") return "/dashboard-admin";
  if (role === "creator") return "/dashboard-creator";
  return "/dashboard";
}

export function redirectToRoleDashboard(role: UserRole) {
  const target = dashboardPathForRole(role);
  if (window.location.pathname === target) return false;

  const now = Date.now();
  const previousRedirect = Number(
    window.sessionStorage.getItem(ROLE_REDIRECT_KEY) ?? "0",
  );
  if (now - previousRedirect < ROLE_REDIRECT_WINDOW_MS) return false;

  window.sessionStorage.setItem(ROLE_REDIRECT_KEY, String(now));
  window.location.replace(target);
  return true;
}

export function clearRoleRedirectGuard() {
  window.sessionStorage.removeItem(ROLE_REDIRECT_KEY);
}
