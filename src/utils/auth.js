import { BTMS_TOKEN_KEY, BTMS_USER_KEY, ROLES } from "../constants/auth";
import { getItem, removeItem, setItem } from "./storage";

/** Chuẩn hóa role phase 1: ADMIN | OWNER | MANAGER | STAFF | PLAYER */
export const normalizeRole = (role) => {
  if (role == null || role === "") return null;
  const value = String(role).trim().toUpperCase();
  if (value === "ROLE_ADMIN" || value === "ADMINISTRATOR") return ROLES.ADMIN;
  if (value === "ROLE_OWNER") return ROLES.OWNER;
  if (value === "ROLE_MANAGER") return ROLES.MANAGER;
  if (value === "ROLE_STAFF") return ROLES.STAFF;
  if (value === "ROLE_PLAYER" || value === "ROLE_USER") return ROLES.PLAYER;
  if ([ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF, ROLES.PLAYER].includes(value))
    return value;
  return value;
};

export const extractRoleFromUser = (user) => {
  if (!user) return null;
  if (user.role != null) return normalizeRole(user.role);
  if (user.roles?.code != null) return normalizeRole(user.roles.code);
  if (typeof user.roles === "string") return normalizeRole(user.roles);
  if (Array.isArray(user.roles)) {
    const codes = user.roles.map((r) =>
      normalizeRole(typeof r === "string" ? r : r?.code)
    );
    if (codes.includes(ROLES.ADMIN)) return ROLES.ADMIN;
    if (codes.includes(ROLES.OWNER)) return ROLES.OWNER;
    if (codes.includes(ROLES.MANAGER)) return ROLES.MANAGER;
    if (codes.includes(ROLES.STAFF)) return ROLES.STAFF;
    if (codes.includes(ROLES.PLAYER)) return ROLES.PLAYER;
  }
  return null;
};

export const normalizeUser = (user, fallbackEmail) => {
  const role = extractRoleFromUser(user) || ROLES.PLAYER;
  return {
    ...(user || {}),
    email: user?.email || fallbackEmail || "",
    role,
  };
};

const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Giải mã base64 thuần JS.
 * React Native không đảm bảo có sẵn `atob` trên mọi engine như trình duyệt,
 * nên tự cài đặt thay vì phụ thuộc global.
 */
const decodeBase64 = (input) => {
  const clean = String(input).replace(/[^A-Za-z0-9+/]/g, "");
  let output = "";
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = BASE64_ALPHABET.indexOf(clean[i]);
    const c1 = BASE64_ALPHABET.indexOf(clean[i + 1]);
    const c2 = BASE64_ALPHABET.indexOf(clean[i + 2]);
    const c3 = BASE64_ALPHABET.indexOf(clean[i + 3]);

    output += String.fromCharCode((c0 << 2) | (c1 >> 4));
    if (c2 !== -1) output += String.fromCharCode(((c1 & 15) << 4) | (c2 >> 2));
    if (c3 !== -1) output += String.fromCharCode(((c2 & 3) << 6) | c3);
  }
  return output;
};

/** Decode JWT payload (không verify chữ ký — chỉ đọc claim role khi mở lại app) */
export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const binary = decodeBase64(base64);
    // Payload JWT là UTF-8; giải mã lại để không vỡ tiếng Việt có dấu
    const utf8 = decodeURIComponent(
      binary
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(utf8);
  } catch {
    return null;
  }
};

export const getRoleFromToken = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return (
    normalizeRole(payload.role) ||
    normalizeRole(payload.roles?.code) ||
    normalizeRole(
      Array.isArray(payload.authorities) ? payload.authorities[0] : payload.authority
    )
  );
};

export const buildSessionFromAuthPayload = (apiResponse, fallbackEmail) => {
  const envelope = apiResponse?.data ?? apiResponse;
  const payload = envelope?.data ?? envelope;
  const accessToken = payload?.accessToken || payload?.token;
  if (!accessToken) {
    throw new Error("Không nhận được accessToken từ máy chủ.");
  }
  const user = normalizeUser(payload?.user, fallbackEmail);
  let role = user.role;
  if (!role || role === ROLES.PLAYER) {
    const fromToken = getRoleFromToken(accessToken);
    if (fromToken) role = fromToken;
  }
  return {
    token: accessToken,
    tokenType: payload?.tokenType || "Bearer",
    expiresIn: payload?.expiresIn,
    user: { ...user, role: role || ROLES.PLAYER },
  };
};

export const isAdminUser = (user) => normalizeRole(user?.role) === ROLES.ADMIN;
export const isOwnerUser = (user) => normalizeRole(user?.role) === ROLES.OWNER;
export const isManagerUser = (user) => normalizeRole(user?.role) === ROLES.MANAGER;
export const isStaffUser = (user) => normalizeRole(user?.role) === ROLES.STAFF;
export const isPlayerUser = (user) => normalizeRole(user?.role) === ROLES.PLAYER;

/** Nhãn tiếng Việt của role, dùng để hiển thị */
export const getRoleLabel = (role) => {
  const r = normalizeRole(role);
  if (r === ROLES.ADMIN) return "Quản trị viên";
  if (r === ROLES.OWNER) return "Chủ câu lạc bộ";
  if (r === ROLES.MANAGER) return "Quản lý";
  if (r === ROLES.STAFF) return "Nhân viên";
  if (r === ROLES.PLAYER) return "Người chơi";
  return "Người dùng";
};

/* --- Lưu trữ phiên đăng nhập (bất đồng bộ, khác localStorage của web) --- */

export const readStoredAuth = async () => {
  try {
    const token = await getItem(BTMS_TOKEN_KEY);
    const userRaw = await getItem(BTMS_USER_KEY);
    if (!token || !userRaw) return null;
    const user = normalizeUser(JSON.parse(userRaw));
    return { token, user };
  } catch {
    return null;
  }
};

export const persistAuth = async ({ token, user }) => {
  await setItem(BTMS_TOKEN_KEY, token);
  await setItem(BTMS_USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = async () => {
  await removeItem(BTMS_TOKEN_KEY);
  await removeItem(BTMS_USER_KEY);
};
