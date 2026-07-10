import type { AuthResponse, CurrentUserResponse } from './types';

export type AuthSession = AuthResponse;

const STORAGE_KEY = 'foodadsai.session';
type Listener = () => void;

let currentSession = readSession();
const listeners = new Set<Listener>();

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    currentSession = readSession();
    emit();
  });
}

function readSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (session) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSession() {
  return currentSession;
}

export function setSession(session: AuthSession | null) {
  currentSession = session;
  persistSession(session);
  emit();
}

export function clearSession() {
  setSession(null);
}

export function getAccessToken() {
  return currentSession?.accessToken ?? null;
}

export function getRefreshToken() {
  return currentSession?.refreshToken ?? null;
}

export function toCurrentUser(session: AuthSession | null): CurrentUserResponse | null {
  if (!session) {
    return null;
  }

  return {
    userId: session.userId,
    email: session.email,
    displayName: session.displayName,
    roles: session.roles,
  };
}
