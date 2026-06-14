export type StoredUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
};

const tokenKey = "lf_token";
const userKey = "lf_user";

function hasWindow() {
  return typeof window !== "undefined";
}

export function getToken(): string | null {
  if (!hasWindow()) {
    return null;
  }

  return window.localStorage.getItem(tokenKey);
}

export function setToken(token: string): void {
  if (hasWindow()) {
    window.localStorage.setItem(tokenKey, token);
  }
}

export function removeToken(): void {
  if (hasWindow()) {
    window.localStorage.removeItem(tokenKey);
  }
}

export function getUser(): StoredUser | null {
  if (!hasWindow()) {
    return null;
  }

  const rawUser = window.localStorage.getItem(userKey);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    removeUser();
    return null;
  }
}

export function setUser(user: StoredUser): void {
  if (hasWindow()) {
    window.localStorage.setItem(userKey, JSON.stringify(user));
  }
}

export function removeUser(): void {
  if (hasWindow()) {
    window.localStorage.removeItem(userKey);
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function logout(): void {
  removeToken();
  removeUser();

  if (hasWindow()) {
    window.location.assign("/login");
  }
}
