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
 * KHÔNG tự đặt header Content-Type: để axios tự sinh kèm `boundary`, đặt tay
 * sẽ thiếu boundary và backend không tách được phần file.
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
    .post("/storage/images", formData)
    .then((res) => getApiData(res));
};
