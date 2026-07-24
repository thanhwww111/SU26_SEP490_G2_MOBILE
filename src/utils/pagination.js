/**
 * Chuẩn hóa phản hồi phân trang của backend (Spring Page nằm trong ApiResponse.data).
 * Chép từ FE web để hai nền tảng đọc cùng một shape.
 */

export const DEFAULT_PAGE_SIZE = 10;

const emptyPage = (size = DEFAULT_PAGE_SIZE) => ({
  content: [],
  page: 0,
  size,
  totalElements: 0,
  totalPages: 0,
});

/**
 * Backend có lúc trả mảng trần, có lúc trả object Page —
 * hàm này ép cả hai về cùng một dạng để component không phải đoán.
 */
export const parsePagedResponse = (data, fallbackSize = DEFAULT_PAGE_SIZE) => {
  if (!data) return emptyPage(fallbackSize);

  if (Array.isArray(data)) {
    return {
      content: data,
      page: 0,
      size: data.length || fallbackSize,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
    };
  }

  if (Array.isArray(data.content)) {
    const page = data.page ?? data.number ?? data.pageNumber ?? 0;
    const size = data.size ?? data.pageSize ?? data.pageable?.pageSize ?? fallbackSize;
    const totalElements = data.totalElements ?? data.content.length;

    return {
      content: data.content,
      page,
      size,
      totalElements,
      totalPages:
        data.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : 0),
    };
  }

  return emptyPage(fallbackSize);
};
