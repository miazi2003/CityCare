const AUTH_TOKEN_STORAGE_KEY = "city-care.jwt";

const canUseStorage = () => typeof window !== "undefined";

export const getAuthToken = (): string | null => {
  if (!canUseStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string): void => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
};

export const clearAuthToken = (): void => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
};
