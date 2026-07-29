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
 */
const HEADING_CLASS = {
  1: "text-xl font-bold",
  2: "text-xl font-bold",
  3: "text-base font-bold",
  4: "text-base font-bold",
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
      const style = [
        chunk.bold ? "font-bold" : "",
        chunk.italic ? "italic" : "",
        chunk.href ? "text-info underline" : "",
      ]
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
              className={`${HEADING_CLASS[block.level] || HEADING_CLASS[3]} leading-snug text-slate-900`}
            />
          );
        }

        if (block.type === "quote") {
          return (
            <View
              key={index}
              className="border-l-[3px] border-accent bg-slate-50 px-4 py-3"
            >
              <Inlines
                inlines={block.inlines}
                className="text-base italic leading-7 text-slate-600"
              />
            </View>
          );
        }

        if (block.type === "list") {
          return (
            <View key={index} className="gap-2">
              {block.items.map((item, itemIndex) => (
                <View key={itemIndex} className="flex-row gap-2">
                  <Text className="text-base leading-7 text-slate-500">
                    {block.ordered ? `${itemIndex + 1}.` : "•"}
                  </Text>
                  <Inlines
                    inlines={item}
                    className="flex-1 text-base leading-7 text-slate-700"
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
                <Text className="text-center text-xs text-slate-400">
                  {block.alt}
                </Text>
              ) : null}
            </View>
          );
        }

        if (block.type === "rule") {
          return <View key={index} className="h-px bg-slate-200" />;
        }

        return (
          <Inlines
            key={index}
            inlines={block.inlines}
            className="text-base leading-7 text-slate-700"
          />
        );
      })}
    </View>
  );
}
