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
 * **Expo Go: iOS chạy được, Android thì không.** Giới hạn của SDK 53 chỉ gỡ remote push khỏi
 * Expo Go trên Android — xem `warnOfExpoGoPushUsage.ts` trong expo-notifications, thông báo ở đó
 * ghi rõ "Android" và chỉ `console.error` khi `Platform.OS === "android"`, còn iOS chỉ cảnh báo.
 * Trên iPhone thật với Expo Go vẫn xin được APNs token, nên **không cần development build EAS
 * để thử push trên iOS** — chỉ cần `extra.eas.projectId` trong `app.json`.
 *
 * Không lấy được token thì app vẫn chạy đủ, chỉ là thông báo chỉ thấy được khi mở màn thông báo.
 * Nhưng mọi nhánh thất bại đều phải nói ra lý do (xem `bail`) — trước đây hook thất bại hoàn toàn
 * im lặng, và cả nhóm mất thời gian đi tìm lỗi ở điện thoại trong khi nguyên nhân chỉ là thiếu
 * `projectId` trong `app.json`.
 *
 * Push và JWT không liên quan nhau — backend gửi tới máy bằng push token, nên thông báo vẫn tới
 * kể cả khi phiên đăng nhập đã hết hạn.
 */

/**
 * Ghi lý do không lấy được push token rồi trả null.
 *
 * Chỉ nói trong `__DEV__`: người dùng cuối không làm gì được với những lý do này, còn khi chạy
 * `expo start` thì đây là thứ duy nhất phân biệt "máy không hỗ trợ" với "cấu hình còn thiếu".
 */
const bail = (reason) => {
  if (__DEV__) {
    console.warn(`[push] Không ghi danh được thiết bị: ${reason}`);
  }
  return null;
};

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
 * Expo Go trên Android, chưa cấu hình EAS project. Không nhánh nào trong số đó đáng để chặn
 * người dùng vào app, nhưng nhánh nào cũng phải ghi lý do lại.
 */
const fetchExpoPushToken = async () => {
  if (Platform.OS === "web") return bail("đang chạy trên web, không có push");

  // Máy ảo không có dịch vụ đẩy thật, Expo cũng từ chối cấp token
  if (!Device.isDevice) return bail("đang chạy trên máy ảo, cần điện thoại thật");

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;

  if (status !== "granted") {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }

  // Trên iOS, từ chối một lần là popup không hiện lại nữa — phải tự bật trong Cài đặt
  if (status !== "granted") {
    return bail(
      `chưa được cấp quyền thông báo (trạng thái "${status}"). Trên iOS phải bật tay ở` +
        " Cài đặt > Expo Go > Thông báo, vì popup chỉ hiện đúng một lần"
    );
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    return bail(
      "thiếu extra.eas.projectId trong app.json. Chạy `npx eas init` để tạo project trên" +
        " expo.dev và ghi id vào app.json — đây là điều kiện bắt buộc, kể cả trên Expo Go iOS"
    );
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data ?? bail("Expo trả về token rỗng");
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

    if (__DEV__) {
      console.log(`[push] Đã ghi danh thiết bị với backend: ${token}`);
    }

    return token;
  } catch (error) {
    // Expo Go trên Android, mất mạng, hay backend chưa bật — không nhánh nào đáng làm phiền
    // người dùng, nhưng lý do phải ra được console để còn lần theo
    return bail(error?.message ?? String(error));
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
