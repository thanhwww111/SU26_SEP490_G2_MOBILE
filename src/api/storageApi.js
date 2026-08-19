import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

/**
 * POST /storage/images — tải ảnh lên MinIO.
 *
 * Khác web ở phần dựng FormData: trình duyệt có đối tượng `File`, còn React
 * Native chỉ có URI của ảnh trong máy, nên phần tử file phải là
 * `{ uri, name, type }`. Gửi nhầm chuỗi URI trần thì backend nhận được một
 * trường text chứ không phải file.
 *
 * PHẢI ghi đè `Content-Type` thành `multipart/form-data` cho riêng lời gọi này, y như
 * `FE/src/api/storageApi.js` làm. Không phải để tự thêm `boundary` — phần đó tầng native của
 * React Native tự lo — mà để THOÁT khỏi header mặc định của instance.
 *
 * `axiosClient` khai sẵn `Content-Type: application/json` cho mọi request. Gặp FormData mà header
 * lại là JSON, axios không gửi nguyên trạng: `transformRequest` chuyển nó thành
 * `JSON.stringify(formDataToJSON(data))`. Mà `formDataToJSON` chỉ làm việc khi FormData có
 * `entries()` — bản của React Native chỉ có `append`, `getAll`, `getParts`, nên nó trả `null`.
 *
 * Kết quả: body gửi đi đúng bằng chuỗi `"null"`, backend không thấy part nào và `@RequestParam
 * ("file") MultipartFile` báo thiếu tham số. Lỗi im lặng theo nghĩa xấu nhất — không ai ném
 * exception, chỉ là ảnh không bao giờ tới nơi.
 *
 * @returns {{ objectKey: string, url: string }} — `url` chỉ để xem trước,
 *   thứ đem lưu vào hồ sơ là `objectKey`.
 */
export const uploadImage = ({ uri, name, type }, folder = "avatars") => {
  const formData = new FormData();

  formData.append("file", {
    uri,
    name: name || "upload.jpg",
    type: type || "image/jpeg",
  });
  formData.append("folder", folder);

  return axiosClient
    .post("/storage/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => getApiData(res));
};
