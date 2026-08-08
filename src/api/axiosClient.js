import axios from "axios";
import { API_BASE_URL } from "../constants/config";
import { useAuthStore } from "../store/authStore";
import { buildSessionFromAuthPayload, readStoredCredentials } from "../utils/auth";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Mạng di động có thể chập chờn; timeout để không treo UI vô hạn khi sai IP
  timeout: 15000,
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Lấy phiên mới bằng thông tin đăng nhập đã lưu trên máy.
 *
 * Backend cấp JWT sống 24 giờ và không có refresh token. Không có lớp này thì cứ mỗi ngày người
 * dùng lại bị đá về màn đăng nhập — khó chịu nhất là lúc bấm vào một thông báo đẩy: thông báo
 * vẫn tới máy bình thường (push đi bằng device token, không liên quan JWT), nhưng mở ra thì
 * không xem được nội dung.
 *
 * Dùng `axios.post` trần chứ không phải `axiosClient`: đi qua chính instance này thì phản hồi
 * 401 của lời gọi đăng nhập lại rơi vào interceptor bên dưới và sinh đệ quy.
 */
let reauthPromise = null;

const reauthenticate = () => {
  // Nhiều request cùng hỏng vì hết hạn một lượt là chuyện thường (một màn gọi vài API song song).
  // Dùng chung một promise để chỉ đăng nhập lại đúng một lần.
  if (reauthPromise) return reauthPromise;

  reauthPromise = (async () => {
    const credentials = await readStoredCredentials();
    if (!credentials) return null;

    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      { email: credentials.email, password: credentials.password },
      { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );

    if (!response?.data?.success) return null;

    const session = buildSessionFromAuthPayload(response.data, credentials.email);
    await useAuthStore.getState().setSession(session);
    return session.token;
  })()
    // Mật khẩu đã đổi ở nơi khác, hoặc mất mạng — cả hai đều rơi về đăng nhập tay
    .catch(() => null)
    .finally(() => {
      reauthPromise = null;
    });

  return reauthPromise;
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const payload = error?.response?.data;
    const original = error?.config;
    const requestUrl = original?.url || "";
    const isAuthMe = requestUrl.includes("/auth/me");
    const isLogin = requestUrl.includes("/auth/login");

    if (status === 401) {
      // Thử lấy phiên mới rồi chạy lại đúng request vừa hỏng. Cờ _retried chặn vòng lặp khi
      // token mới cũng bị từ chối — ví dụ tài khoản đã bị khoá.
      if (!isAuthMe && !isLogin && original && !original._retried) {
        original._retried = true;

        const newToken = await reauthenticate();
        if (newToken) {
          // Gán thẳng vào headers thay vì dựng object mới: `headers` ở đây là AxiosHeaders,
          // trải nó ra thành object thường sẽ đánh rơi những gì không phải thuộc tính riêng
          // (Content-Type mặc định của instance chẳng hạn).
          if (original.headers) {
            original.headers.Authorization = `Bearer ${newToken}`;
          } else {
            original.headers = { Authorization: `Bearer ${newToken}` };
          }
          return axiosClient(original);
        }
      }

      // Khác web: không tự đổi URL ở đây.
      // Xoá phiên là đủ — guard trong app/(app)/_layout.jsx sẽ đẩy về màn Login.
      // Riêng /auth/me do hydrateAuth tự xử lý nên bỏ qua để tránh xoá phiên hai lần.
      if (!isAuthMe) {
        useAuthStore.getState().logout();
      }
    }

    const wrappedError = new Error(
      payload?.message || error.message || "Có lỗi xảy ra. Vui lòng thử lại."
    );
    wrappedError.code = payload?.code;
    wrappedError.response = error.response;
    return Promise.reject(wrappedError);
  }
);

export default axiosClient;
