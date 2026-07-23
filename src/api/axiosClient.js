import axios from "axios";
import { API_BASE_URL } from "../constants/config";
import { useAuthStore } from "../store/authStore";

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

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const payload = error?.response?.data;
    const requestUrl = error?.config?.url || "";
    const isAuthMe = requestUrl.includes("/auth/me");

    if (status === 401) {
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
