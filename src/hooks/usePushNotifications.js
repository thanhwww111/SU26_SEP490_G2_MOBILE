import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useRouter } from "expo-router";

import * as notificationApi from "../api/notificationApi";
import { BTMS_PUSH_TOKEN_KEY } from "../constants/notification";
import { useNotificationStore } from "../store/notificationStore";
import { getItem, removeItem, setItem } from "../utils/storage";

/**
 * Thông báo đẩy: xin quyền, ghi danh máy với backend, và xử lý lúc thông báo tới.
 *
 * KHÔNG chạy được trong Expo Go. Từ SDK 53 Expo đã gỡ remote push khỏi Expo Go, nên
 * `getExpoPushTokenAsync` sẽ ném lỗi ở đó. Toàn bộ hook được viết để thất bại trong im lặng:
 * không có token thì app vẫn chạy đủ, chỉ là thông báo chỉ thấy được khi mở màn thông báo.
 * Muốn thử push thật phải dùng development build của EAS.
 *
 * Push và JWT không liên quan nhau — backend gửi tới máy bằng push token, nên thông báo vẫn tới
 * kể cả khi phiên đăng nhập đã hết hạn.
 */

/**
 * Thông báo tới lúc app đang mở vẫn hiện lên trên cùng, thay vì rơi thẳng vào khay.
 *
 * Bỏ qua trên web: `npm run web` chỉ để soi giao diện, mà đăng ký handler ở đó lại kéo theo lời
 * xin quyền thông báo của trình duyệt — không phục vụ gì cho việc soi giao diện.
 */
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Android bắt buộc có kênh thông báo, không có thì thông báo bị xếp vào mức im lặng và
 * người dùng không thấy gì nổi lên.
 */
const ensureAndroidChannel = async () => {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "Thông báo chung",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: "#EF342A",
  });
};

const resolveProjectId = () =>
  Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId ?? null;

/**
 * Lấy push token của máy này.
 *
 * Trả null thay vì ném lỗi ở mọi nhánh không lấy được — máy ảo, người dùng từ chối quyền,
 * đang chạy Expo Go, chưa cấu hình EAS project. Không nhánh nào trong số đó đáng để chặn
 * người dùng vào app.
 */
const fetchExpoPushToken = async () => {
  if (Platform.OS === "web") return null;

  // Máy ảo không có dịch vụ đẩy thật, Expo cũng từ chối cấp token
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;

  if (status !== "granted") {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }

  if (status !== "granted") return null;

  const projectId = resolveProjectId();
  if (!projectId) {
    // Chưa chạy `eas init` thì chưa có projectId — in-app vẫn dùng được bình thường
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data ?? null;
};

/**
 * Ghi danh máy này với backend. Gọi sau khi đã đăng nhập.
 *
 * Lưu lại token vào máy để lúc đăng xuất còn biết phải gỡ token nào — sau khi đăng xuất thì
 * không xin lại được token nữa vì lời gọi cần quyền đã cấp cho phiên trước.
 */
export const registerPushToken = async () => {
  try {
    await ensureAndroidChannel();

    const token = await fetchExpoPushToken();
    if (!token) return null;

    await notificationApi.registerDeviceToken({
      expoToken: token,
      platform: Platform.OS,
    });
    await setItem(BTMS_PUSH_TOKEN_KEY, token);

    return token;
  } catch {
    // Expo Go, mất mạng, hay backend chưa bật — không nhánh nào đáng làm phiền người dùng
    return null;
  }
};

/**
 * Gỡ máy này khỏi danh sách nhận thông báo. Gọi TRƯỚC khi xoá phiên, vì lời gọi cần JWT.
 *
 * Không gỡ thì người mượn máy đăng nhập sau vẫn nhận thông báo của chủ trước.
 */
export const unregisterPushToken = async () => {
  try {
    const token = await getItem(BTMS_PUSH_TOKEN_KEY);
    if (!token) return;

    await notificationApi.unregisterDeviceToken(token);
  } catch {
    /* mất mạng lúc đăng xuất không được chặn việc đăng xuất */
  } finally {
    await removeItem(BTMS_PUSH_TOKEN_KEY);
  }
};

/**
 * Gắn vào layout của nhóm (app): ghi danh thiết bị và xử lý thông báo trong suốt phiên đăng nhập.
 *
 * @param enabled chỉ chạy khi đã đăng nhập — ghi danh lúc chưa có JWT chỉ tổ nhận 401
 */
export const usePushNotifications = (enabled) => {
  const router = useRouter();
  const refreshUnread = useNotificationStore((s) => s.refreshUnread);

  // Điều hướng và làm mới badge đọc qua ref: listener chỉ được gắn một lần, nếu đưa router vào
  // mảng phụ thuộc thì mỗi lần điều hướng lại gỡ và gắn lại listener
  const routerRef = useRef(router);
  routerRef.current = router;
  const refreshRef = useRef(refreshUnread);
  refreshRef.current = refreshUnread;

  useEffect(() => {
    if (!enabled) return undefined;

    registerPushToken();

    /**
     * Bấm vào thông báo đẩy thì mở thẳng giải liên quan.
     *
     * Thông báo không gắn giải nào chỉ mở app rồi dừng ở màn đang có: hộp thông báo là popup
     * trên header chứ không còn là màn riêng, nên không có đường dẫn nào để đẩy tới.
     */
    const openFromData = (data) => {
      const tournamentId = data?.tournamentId;
      if (tournamentId) {
        routerRef.current.push(`/(app)/event/${tournamentId}`);
      }
    };

    // Thông báo tới lúc app đang mở: cập nhật huy hiệu ngay, người dùng không phải kéo để tải lại
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      refreshRef.current();
    });

    // Người dùng bấm vào thông báo
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromData(response?.notification?.request?.content?.data);
    });

    // App mở lên từ trạng thái đã tắt hẳn do người dùng bấm thông báo — trường hợp này không
    // đi qua listener ở trên, phải hỏi lại thông báo đã mở app
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) openFromData(response?.notification?.request?.content?.data);
      })
      .catch(() => {
        /* không có gì để mở */
      });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [enabled]);
};
