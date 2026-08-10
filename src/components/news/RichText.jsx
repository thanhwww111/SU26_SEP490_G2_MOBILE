import { useMemo } from "react";
import { Linking, Text, View } from "react-native";

import RemoteImage from "../home/RemoteImage";
import { parseHtmlBlocks } from "../../utils/html";

/**
 * Cỡ chữ tiêu đề trong bài.
 *
 * Web để h1 rất lớn, nhưng trong bài viết trên điện thoại thì h1 và h2 gần như
 * cùng vai trò (tiêu đề bài đã nằm riêng phía trên), nên gom lại còn ba bậc.
 * Mọi cỡ đều nằm trong thang ở 01-design-system.md.
 *
 * Hai bậc trên dùng `font-display` cho khớp web — bên đó h1–h6 đều đổi sang
 * phông tiêu đề. Bậc h5/h6 giữ phông chữ thường: ở cỡ 14 thì phông tiêu đề
 * condensed đọc mệt mà cũng chẳng còn ra dáng tiêu đề.
 */
const HEADING_CLASS = {
  1: "text-xl font-display",
  2: "text-xl font-display",
  3: "text-base font-display",
  4: "text-base font-display",
  5: "text-sm font-bold",
  6: "text-sm font-bold",
};

/** Mở link ra trình duyệt ngoài; link hỏng thì im lặng bỏ qua chứ không nổ */
const openLink = (href) => {
  if (!href) return;
  Linking.openURL(href).catch(() => {});
};

/**
 * Một dòng chữ có định dạng.
 *
 * Text lồng trong Text là cách duy nhất để trộn nhiều kiểu chữ trong cùng một
 * đoạn trên React Native — không có thẻ span.
 */
const Inlines = ({ inlines, className = "" }) => (
  <Text className={className}>
    {inlines.map((chunk, index) => {
      /* Đậm và nghiêng phải gộp thành MỘT lớp: mỗi tổ hợp là một họ font riêng
         trên React Native, gõ `font-bold font-italic` thì lớp sau đè lớp trước
         và mất vế kia — xem chú thích trong tailwind.config.js */
      const weight = chunk.bold
        ? chunk.italic
          ? "font-bold-italic"
          : "font-bold"
        : chunk.italic
          ? "font-italic"
          : "";

      const style = [weight, chunk.href ? "text-info underline" : ""]
        .filter(Boolean)
        .join(" ");

      if (chunk.href) {
        return (
          <Text
            key={index}
            className={style}
            onPress={() => openLink(chunk.href)}
            accessibilityRole="link"
          >
            {chunk.text}
          </Text>
        );
      }

      return (
        <Text key={index} className={style}>
          {chunk.text}
        </Text>
      );
    })}
  </Text>
);

/**
 * Render nội dung HTML của bài viết.
 *
 * Phân tích nằm ở `src/utils/html.js` (hàm thuần, có test); ở đây chỉ lo phần
 * hiển thị. Phạm vi phủ và giới hạn ghi trong file đó — tóm tắt: bảng và video
 * nhúng không giữ được định dạng, nhưng chữ bên trong vẫn hiện, nên bài viết
 * không bao giờ mất nội dung.
 */
export default function RichText({ html }) {
  const blocks = useMemo(() => parseHtmlBlocks(html), [html]);

  if (blocks.length === 0) return null;

  return (
    <View className="gap-4">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <Inlines
              key={index}
              inlines={block.inlines}
              className={`${HEADING_CLASS[block.level] || HEADING_CLASS[3]} leading-snug text-content`}
            />
          );
        }

        if (block.type === "quote") {
          return (
            <View
              key={index}
              className="border-l-[3px] border-accent bg-canvas px-4 py-3"
            >
              <Inlines
                inlines={block.inlines}
                className="text-base font-italic leading-7 text-content-2"
              />
            </View>
          );
        }

        if (block.type === "list") {
          return (
            <View key={index} className="gap-2">
              {block.items.map((item, itemIndex) => (
                <View key={itemIndex} className="flex-row gap-2">
                  <Text className="text-base leading-7 text-muted">
                    {block.ordered ? `${itemIndex + 1}.` : "•"}
                  </Text>
                  <Inlines
                    inlines={item}
                    className="flex-1 text-base leading-7 text-content-2"
                  />
                </View>
              ))}
            </View>
          );
        }

        if (block.type === "image") {
          return (
            <View key={index} className="gap-2">
              <RemoteImage
                uri={block.src}
                className="h-56 w-full rounded-xl"
                resizeMode="cover"
              />
              {block.alt ? (
                <Text className="text-center text-xs text-faint">
                  {block.alt}
                </Text>
              ) : null}
            </View>
          );
        }

        if (block.type === "rule") {
          return <View key={index} className="h-px bg-sunken-strong" />;
        }

        return (
          <Inlines
            key={index}
            inlines={block.inlines}
            className="text-base leading-7 text-content-2"
          />
        );
      })}
    </View>
  );
}
