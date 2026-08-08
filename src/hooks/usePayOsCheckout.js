import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as WebBrowser from "expo-web-browser";

import * as paymentApi from "../api/paymentApi";
import { getItem, removeItem, setItem } from "../utils/storage";

/**
 * Mã đơn PayOS đang chờ đối chiếu, giữ qua cả lần app bị đóng.
 *
 * Chỉ có một khoá chứ không phải danh sách: người dùng không thể mở hai phiên
 * thanh toán cùng lúc — trình duyệt trong app chiếm trọn màn hình.
 */
const PENDING_ORDER_KEY = "btms_pending_order";

/**
 * Luồng thanh toán PayOS, dùng chung cho màn đăng ký giải và màn chi tiết đăng ký.
 *
 * PayOS chỉ quay về `returnUrl` cấu hình sẵn trên server (`PayOSServiceImpl`
 * đọc từ config, KHÔNG nhận từ client), mà URL đó trỏ về bản web — nên mobile
 * không bắt được deep link `btms://` khi thanh toán xong. Cách vòng qua: mở
 * PayOS trong trình duyệt trong app, rồi hỏi backend "đơn này trả tiền chưa".
 * Backend gọi thẳng PayOS kiểm tra chứ không tin lời client.
 *
 * ## Vì sao phải lưu mã đơn xuống bộ nhớ
 *
 * `openBrowserAsync` chỉ resolve khi người dùng **đóng** trình duyệt. Trả tiền
 * xong rồi bấm Home, hoặc bị hệ điều hành thu hồi bộ nhớ, thì lời hứa đó không
 * bao giờ về và bước đối chiếu bị bỏ lỡ. Tiền không mất — webhook của PayOS
 * vẫn cập nhật ở server — nhưng người dùng quay lại app sẽ thấy trạng thái cũ
 * và tưởng mình trả hụt.
 *
 * Nên mã đơn được ghi xuống trước khi mở trình duyệt, và đối chiếu lại ở ba
 * thời điểm: khi trình duyệt đóng, khi app trở lại tiền cảnh, và khi hook được
 * gắn lần đầu (bắt trường hợp app đã bị đóng hẳn giữa chừng).
 *
 * @param {Function} onSettled — gọi sau mỗi lần đối chiếu xong, để màn tải lại
 *   dữ liệu. Nhận `true` nếu vừa đối chiếu một đơn có thật.
 */
export const usePayOsCheckout = ({ onSettled } = {}) => {
  const [paying, setPaying] = useState(false);

  const settling = useRef(false);
  const alive = useRef(true);
  // Giữ callback trong ref: component cha thường truyền hàm mũi tên mới mỗi lần
  // render, đưa thẳng vào deps là gắn lại listener AppState liên tục
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  /**
   * Hỏi backend về đơn đang treo, rồi xoá dấu vết.
   *
   * Xoá khoá NGAY sau khi đọc: lời gọi này có thể chạy đồng thời từ hai nguồn
   * (trình duyệt vừa đóng và app vừa về tiền cảnh), lần thứ hai phải thành
   * không-làm-gì thay vì đối chiếu lại một đơn đã xong.
   */
  const settlePending = useCallback(async () => {
    if (settling.current) return false;
    settling.current = true;

    try {
      const orderCode = await getItem(PENDING_ORDER_KEY);
      if (!orderCode) return false;

      await removeItem(PENDING_ORDER_KEY);

      try {
        await paymentApi.confirmReturn(orderCode);
      } catch {
        // Không chặn: webhook PayOS vẫn cập nhật ở phía server. Lời gọi này chỉ
        // để người dùng thấy kết quả ngay thay vì phải chờ
      }

      if (alive.current) onSettledRef.current?.(true);
      return true;
    } finally {
      settling.current = false;
    }
  }, []);

  /* Đơn treo từ phiên trước — app đã bị đóng giữa lúc đang trả tiền */
  useEffect(() => {
    alive.current = true;
    settlePending();

    return () => {
      alive.current = false;
    };
  }, [settlePending]);

  /* App trở lại tiền cảnh mà trình duyệt chưa kịp báo đóng */
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") settlePending();
    });

    return () => sub.remove();
  }, [settlePending]);

  /**
   * Tạo đơn, mở PayOS, đối chiếu kết quả.
   *
   * Ném lỗi nếu không tạo được đơn — màn gọi tự hiện thông báo. Người dùng bỏ
   * ngang thì không sao: đăng ký nằm nguyên ở "chờ thanh toán" và trả sau được
   * từ màn "Đăng ký của tôi".
   */
  const pay = useCallback(
    async (registrationId) => {
      setPaying(true);

      try {
        const checkout = await paymentApi.createCheckout(registrationId);

        // Ghi trước khi mở: mở xong mới ghi thì app bị thu hồi đúng lúc đó là mất dấu
        if (checkout?.orderCode != null) {
          await setItem(PENDING_ORDER_KEY, String(checkout.orderCode));
        }

        await WebBrowser.openBrowserAsync(checkout.checkoutUrl);
        await settlePending();
      } finally {
        if (alive.current) setPaying(false);
      }
    },
    [settlePending]
  );

  return { pay, paying };
};
