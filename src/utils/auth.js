import { Platform } from "react-native";

import {
  BTMS_CREDENTIALS_KEY,
  BTMS_KNOWN_EMAILS_KEY,
  BTMS_TOKEN_KEY,
  BTMS_USER_KEY,
  MAX_KNOWN_EMAILS,
  ROLES,
} from "../constants/auth";
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

export const isStaffUser = (user) => extractRoleFromUser(user) === ROLES.STAFF;

/**
 * Màn đầu tiên sau khi đăng nhập, theo role.
 *
 * Port `getHomeRouteForRole` của web (`FE/src/utils/auth.js`) — trọng tài mở app là để chấm
 * trận, bắt họ đi qua trang chủ rồi tự tìm menu là thêm một lượt chạm mỗi ca làm.
 *
 * Ba role quản trị chưa có màn nào trên mobile (xem `docs/mobile/07-web-mapping.md`), nên tạm
 * rơi về trang chủ thay vì trỏ tới route không tồn tại — expo-router sẽ văng lỗi "unmatched
 * route" chứ không im lặng bỏ qua như react-router.
 */
export const getHomeRouteForRole = (role) => {
  const r = normalizeRole(role);
  if (r === ROLES.STAFF) return "/(app)/staff/matches";
  return "/(app)/home";
};

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
  await removeItem(BTMS_CREDENTIALS_KEY);
};

/* --- Thông tin đăng nhập để tự lấy phiên mới khi JWT hết hạn --- */

/**
 * Chỉ lưu trên native.
 *
 * Trên bản web (`npm run web`), lớp lưu trữ rơi về localStorage — nơi bất kỳ script nào cũng
 * đọc được. Mật khẩu nằm ở đó là rủi ro thật, trong khi web lại chẳng cần tính năng này: người
 * dùng đang ngồi trước máy, đăng nhập lại chỉ mất vài giây.
 */
export const persistCredentials = async ({ email, password }) => {
  if (Platform.OS === "web") return;
  if (!email || !password) return;

  await setItem(BTMS_CREDENTIALS_KEY, JSON.stringify({ email, password }));
};

export const readStoredCredentials = async () => {
  if (Platform.OS === "web") return null;

  try {
    const raw = await getItem(BTMS_CREDENTIALS_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.email || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearStoredCredentials = async () => {
  await removeItem(BTMS_CREDENTIALS_KEY);
};

/* --- Email đã từng đăng nhập, để gợi ý ở màn Đăng nhập --- */

/**
 * So email theo kiểu "cùng một tài khoản": bỏ khoảng trắng thừa và không phân biệt hoa thường.
 *
 * Backend coi `A@x.com` và `a@x.com` là một, nên danh sách gợi ý cũng phải vậy — nếu không, đăng
 * nhập hai lần với hai cách viết hoa khác nhau sẽ đẻ ra hai dòng gợi ý cho cùng một người.
 */
const sameEmail = (a, b) =>
  String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

/**
 * Đọc danh sách email đã lưu, mới nhất đứng đầu.
 *
 * Mọi lỗi đều trả mảng rỗng: đây là tính năng tiện lợi, hỏng thì màn đăng nhập chỉ mất phần gợi ý
 * chứ không được phép chặn người dùng gõ tay.
 */
export const readKnownEmails = async () => {
  try {
    const raw = await getItem(BTMS_KNOWN_EMAILS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry) => entry?.email);
  } catch {
    return [];
  }
};

/**
 * Ghi nhớ một email vừa đăng nhập thành công.
 *
 * Trùng email thì đẩy bản ghi cũ lên đầu thay vì thêm dòng mới — người dùng đăng nhập lần thứ mười
 * vẫn chỉ thấy một dòng. Tên hiển thị lấy bản mới nhất vì hồ sơ có thể đã đổi tên.
 *
 * Nuốt lỗi ghi: đăng nhập đã thành công rồi, không thể vì lưu gợi ý hỏng mà đá người dùng ra.
 */
export const rememberEmail = async ({ email, name, role }) => {
  const clean = String(email || "").trim();
  if (!clean) return;

  try {
    const current = await readKnownEmails();
    const rest = current.filter((entry) => !sameEmail(entry.email, clean));
    const next = [
      { email: clean, name: name || "", role: role || "", lastLoginAt: new Date().toISOString() },
      ...rest,
    ].slice(0, MAX_KNOWN_EMAILS);

    await setItem(BTMS_KNOWN_EMAILS_KEY, JSON.stringify(next));
  } catch {
    /* gợi ý là thứ phụ — không được làm hỏng luồng đăng nhập */
  }
};

/**
 * Quên một email (người dùng bấm × trên dòng gợi ý).
 *
 * Xoá hẳn key khi danh sách rỗng thay vì lưu `"[]"`: lần đọc sau đi thẳng vào nhánh `!raw`,
 * và máy không giữ lại dấu vết của tài khoản người dùng vừa bảo quên.
 *
 * @returns {Promise<Array>} danh sách còn lại, để nơi gọi dựng lại UI mà không phải đọc lần nữa
 */
export const forgetEmail = async (email) => {
  try {
    const current = await readKnownEmails();
    const next = current.filter((entry) => !sameEmail(entry.email, email));

    if (next.length === 0) await removeItem(BTMS_KNOWN_EMAILS_KEY);
    else await setItem(BTMS_KNOWN_EMAILS_KEY, JSON.stringify(next));

    return next;
  } catch {
    return [];
  }
};

/**
 * Lọc danh sách gợi ý theo những gì người dùng đã gõ.
 *
 * Khớp cả tiền tố email lẫn tên hiển thị — trọng tài nhớ tên mình nhanh hơn nhớ email công ty cấp.
 * Ô rỗng thì trả cả danh sách, đúng như cách trình duyệt gợi ý khi vừa chạm vào ô.
 *
 * Loại luôn dòng trùng khít với thứ đang gõ: gợi ý đúng bằng nội dung ô nhập thì chạm vào cũng
 * chẳng thay đổi gì, chỉ tổ che mất ô mật khẩu.
 */
export const filterKnownEmails = (entries, query) => {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return entries;

  return entries.filter((entry) => {
    const email = String(entry.email || "").toLowerCase();
    if (email === q) return false;

    return email.includes(q) || String(entry.name || "").toLowerCase().includes(q);
  });
};
