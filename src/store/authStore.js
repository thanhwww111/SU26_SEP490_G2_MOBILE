import { create } from "zustand";
import * as authApi from "../api/authApi";
import {
  buildSessionFromAuthPayload,
  clearStoredAuth,
  getRoleFromToken,
  normalizeUser,
  persistAuth,
  readStoredAuth,
} from "../utils/auth";

let hydratePromise = null;

const isAuthFailure = (err) => {
  const status = err?.response?.status;
  return status === 401 || status === 403;
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  tokenType: "Bearer",
  expiresIn: null,
  isAuthenticated: false,
  /** false cho tới khi đọc xong phiên đã lưu — dùng để hiện màn loading */
  authReady: false,

  setSession: async ({ token, user, tokenType, expiresIn }) => {
    await persistAuth({ token, user });
    set({
      token,
      user,
      tokenType: tokenType || "Bearer",
      expiresIn: expiresIn ?? null,
      isAuthenticated: true,
      authReady: true,
    });
  },

  loginFromResponse: async (apiResponse, fallbackEmail) => {
    const session = buildSessionFromAuthPayload(apiResponse, fallbackEmail);
    await get().setSession(session);
    return session.user;
  },

  /**
   * Vá thông tin người dùng đang lưu trong phiên, không đụng token.
   *
   * Dùng sau khi lưu hồ sơ: tên hiển thị nằm ở menu hồ sơ trên header, không
   * cập nhật ở đây thì người dùng đổi tên xong vẫn thấy tên cũ cho tới lần mở
   * app sau. Ghi cả xuống SecureStore để lần mở sau đọc ra đúng.
   */
  patchUser: async (patch) => {
    const { user, token } = get();
    if (!user) return;

    const next = { ...user, ...patch };
    if (token) await persistAuth({ token, user: next });
    set({ user: next });
  },

  logout: async () => {
    await clearStoredAuth();
    set({
      user: null,
      token: null,
      tokenType: "Bearer",
      expiresIn: null,
      isAuthenticated: false,
      authReady: true,
    });
  },

  hydrateAuth: async () => {
    if (get().authReady) return;
    if (hydratePromise) return hydratePromise;

    hydratePromise = (async () => {
      const stored = await readStoredAuth();

      if (!stored?.token) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          authReady: true,
        });
        return;
      }

      // Tin tạm phiên đã lưu để vào app ngay, rồi xác thực lại bằng /auth/me
      set({
        token: stored.token,
        user: stored.user,
        isAuthenticated: true,
        authReady: false,
      });

      try {
        const me = await authApi.getMe();
        const user = normalizeUser(me, stored.user.email);
        await persistAuth({ token: stored.token, user });
        set({ user, authReady: true });
      } catch (err) {
        if (isAuthFailure(err)) {
          await clearStoredAuth();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            authReady: true,
          });
          return;
        }

        // Lỗi mạng (rất hay gặp trên mobile): giữ phiên cũ, lấy role từ token
        const roleFromToken = getRoleFromToken(stored.token);
        const user = roleFromToken
          ? { ...stored.user, role: roleFromToken }
          : stored.user;
        if (roleFromToken) await persistAuth({ token: stored.token, user });
        set({ user, authReady: true });
      }
    })();

    try {
      await hydratePromise;
    } finally {
      hydratePromise = null;
    }
  },
}));
