import { create } from 'zustand';

/**
 * Safely decodes a JWT token to extract its payload.
 */
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  /**
   * Logs in the user by storing the token in state and localStorage.
   * Parses the JWT to extract user information.
   */
  login: (token) => {
    localStorage.setItem('access_token', token);
    const decoded = parseJwt(token);

    set({
      token: token,
      user: decoded ? { id: decoded.sub, ...decoded } : null,
      isAuthenticated: true,
    });
  },

  /**
   * Logs out the user by clearing state and localStorage.
   */
  logout: () => {
    localStorage.removeItem('access_token');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },

  /**
   * Loads the token from localStorage and hydrates the state if valid.
   * Will log out automatically if the token has expired.
   */
  loadToken: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const decoded = parseJwt(token);

    // Check if the token is valid and hasn't expired
    // The 'exp' claim is in seconds; Date.now() is in milliseconds
    if (decoded && decoded.exp * 1000 > Date.now()) {
      set({
        token: token,
        user: { id: decoded.sub, ...decoded },
        isAuthenticated: true,
      });
    } else {
      get().logout();
    }
  },
}));

// Automatically attempt to restore the session when the store is initialized (e.g. on page refresh)
useAuthStore.getState().loadToken();

export default useAuthStore;
