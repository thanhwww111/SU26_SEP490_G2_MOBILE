import { create } from "zustand";

import * as notificationApi from "../api/notificationApi";
import { BTMS_NOTI_READ_AT_KEY } from "../constants/notification";
import { getItem, removeItem, setItem } from "../utils/storage";

/**
 * Số thông báo chưa đọc hiển thị trên chuông ở header.
 *
 * Backend không có cột "đã đọc" — thay vào đó máy này giữ một mốc thời gian, và chưa đọc nghĩa
 * là "sinh ra sau mốc đó". Đổi lại sự đơn giản ấy, hai máy của cùng một người đếm độc lập nhau,
 * và gỡ app đi cài lại thì mọi thứ trở lại thành chưa đọc.
 *
 * Đếm để ở store riêng chứ không nằm trong màn danh sách: chuông sống trên header của mọi màn,
 * nó phải biết số chưa đọc mà không cần màn thông báo được mở.
 */
export const useNotificationStore = create((set, get) => ({
  /** ISO string hoặc null khi người dùng chưa từng mở màn thông báo */
  lastReadAt: null,
  unreadCount: 0,
  /** false cho tới khi đọc xong mốc đã lưu — tránh đếm nhầm bằng mốc null */
  ready: false,

  hydrate: async () => {
    if (get().ready) return;
    const stored = await getItem(BTMS_NOTI_READ_AT_KEY);
    set({ lastReadAt: stored || null, ready: true });
  },

  /**
   * Hỏi lại backend số chưa đọc. Nuốt lỗi có chủ đích: chuông là thứ phụ trên header, mất mạng
   * thì để nguyên số cũ chứ không được đẩy lỗi ra màn đang xem.
   */
  refreshUnread: async () => {
    if (!get().ready) await get().hydrate();

    try {
      const count = await notificationApi.getUnreadCount(get().lastReadAt);
      set({ unreadCount: Number(count) || 0 });
    } catch {
      /* giữ nguyên số đang hiện */
    }
  },

  /** Gọi khi mở màn thông báo — mọi thứ tới thời điểm này coi như đã xem. */
  markAllRead: async () => {
    const now = new Date().toISOString();
    await setItem(BTMS_NOTI_READ_AT_KEY, now);
    set({ lastReadAt: now, unreadCount: 0 });
  },

  /**
   * Xoá sạch khi đăng xuất.
   *
   * Phải xoá cả mốc đã đọc: người khác đăng nhập trên cùng máy mà giữ lại mốc của chủ trước thì
   * thông báo cũ hơn mốc đó sẽ bị coi là đã đọc dù họ chưa từng thấy.
   */
  reset: async () => {
    await removeItem(BTMS_NOTI_READ_AT_KEY);
    set({ lastReadAt: null, unreadCount: 0, ready: true });
  },
}));
