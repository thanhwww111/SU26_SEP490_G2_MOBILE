import { create } from "zustand";
import * as authApi from "../api/authApi";
import {
  buildSessionFromAuthPayload,
  clearStoredAuth,
  getRoleFromToken,
  normalizeUser,
  persistAuth,
  persistCredentials,
  readStoredAuth,
  rememberEmail,
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

  /**
   * @param password chỉ có ở luồng đăng nhập tay — giữ lại để tự lấy phiên mới khi JWT hết hạn,
   *   xem `readStoredCredentials` và interceptor 401 trong `src/api/axiosClient.js`. Bỏ trống thì
   *   phiên vẫn dùng được bình thường, chỉ là hết hạn sẽ phải đăng nhập lại bằng tay.
   */
  loginFromResponse: async (apiResponse, fallbackEmail, password) => {
    const session = buildSessionFromAuthPayload(apiResponse, fallbackEmail);
    await get().setSession(session);

    if (password) {
      await persistCredentials({ email: fallbackEmail || session.user?.email, password });
    }

    // Ghi nhớ email để lần sau gợi ý ở màn Đăng nhập. Đứng ngoài nhánh `password` vì hai việc này
    // độc lập nhau: mật khẩu chỉ lưu trên native, còn email thì lưu cả trên bản web.
    await rememberEmail({
      email: fallbackEmail || session.user?.email,
      name: session.user?.fullName || session.user?.name,
      role: session.user?.role,
    });

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

    // Đổi tên ở màn Hồ sơ xong thì dòng gợi ý ở màn Đăng nhập cũng phải mang tên mới, nếu không
    // lần đăng nhập sau người dùng vẫn thấy tên cũ mà không hiểu nó lấy từ đâu ra.
    if (patch?.fullName && next.email) {
      await rememberEmail({ email: next.email, name: next.fullName, role: next.role });
    }
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
