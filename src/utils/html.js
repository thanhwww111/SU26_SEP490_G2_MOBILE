/**
 * Chuyển HTML của trình soạn thảo thành danh sách khối để React Native render.
 *
 * Vì sao tự viết: nội dung bài viết từ backend là HTML (web render bằng
 * `dangerouslySetInnerHTML`), mà React Native không có DOM. Hai thư viện thường
 * dùng đều có giá của nó — `react-native-webview` thì chữ không theo design
 * system và phải đo chiều cao thủ công khi nhúng vào trang cuộn,
 * `react-native-render-html` thì ngừng bảo trì từ 2022. Phạm vi HTML mà một
 * trình soạn thảo sinh ra khá hẹp nên tự xử lý được.
 *
 * PHẠM VI PHỦ: đoạn văn, tiêu đề h1–h6, in đậm, in nghiêng, liên kết, danh sách
 * có thứ tự và không thứ tự, ảnh, trích dẫn, đường kẻ ngang, xuống dòng.
 *
 * KHÔNG PHỦ: bảng, video nhúng, iframe, HTML tuỳ biến sâu. Những thẻ này bị bỏ
 * qua nhưng chữ bên trong vẫn giữ lại, nên bài viết không bao giờ mất nội dung —
 * cùng lắm là mất định dạng.
 *
 * Parser dùng stack thật chứ không dùng regex cắt khối: nội dung soạn thảo hay
 * lồng `div` trong `div`, mà regex lười sẽ khớp nhầm thẻ đóng của lớp trong.
 */

/** Thẻ mở ra khối mới. `li` xử lý riêng vì nó nằm trong danh sách. */
const BLOCK_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "div",
  "section",
  "article",
  "figure",
  "figcaption",
  "pre",
]);

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

/** Thẻ mà toàn bộ nội dung bên trong phải bỏ đi, không chỉ bỏ thẻ */
const DROP_CONTENT_TAGS = new Set(["script", "style", "head", "noscript", "svg"]);

const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
};

/** Giải mã entity HTML, cả dạng tên (`&amp;`) lẫn dạng số (`&#39;`, `&#x27;`). */
export const decodeEntities = (text) =>
  String(text).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, body) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named !== undefined ? named : match;
  });

/** Đọc các thuộc tính của một thẻ thành object, khoá viết thường. */
const parseAttrs = (raw) => {
  const attrs = {};
  const re = /([a-z0-9-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/gi;
  let m;
  while ((m = re.exec(raw))) {
    const value = m[3] ?? m[4] ?? m[5] ?? "";
    attrs[m[1].toLowerCase()] = decodeEntities(value);
  }
  return attrs;
};

/** Gộp khoảng trắng thừa; HTML coi mọi chuỗi khoảng trắng là một dấu cách. */
const collapse = (text) => text.replace(/\s+/g, " ");

/**
 * Phân tích HTML thành mảng khối.
 *
 * Mỗi khối là một trong:
 * - `{ type: "paragraph" | "heading" | "quote", level?, inlines }`
 * - `{ type: "list", ordered, items: inlines[][] }`
 * - `{ type: "image", src, alt }`
 * - `{ type: "rule" }`
 *
 * `inlines` là mảng `{ text, bold, italic, href }` — mỗi phần tử là một đoạn chữ
 * cùng định dạng, ghép lại thành một dòng.
 */
export const parseHtmlBlocks = (html) => {
  if (!html || typeof html !== "string") return [];

  const blocks = [];

  // Ngữ cảnh chữ đang mở: đếm theo tầng để `<b><b>x</b></b>` không tắt sớm
  let bold = 0;
  let italic = 0;
  let hrefStack = [];

  // Khối đang gom chữ
  let current = null;
  // Danh sách đang mở; hỗ trợ lồng nhau bằng stack, nhưng render phẳng
  let listStack = [];

  const currentHref = () => hrefStack[hrefStack.length - 1] || null;

  const startBlock = (type, extra = {}) => {
    flushBlock();
    current = { type, ...extra, inlines: [] };
  };

  const flushBlock = () => {
    if (!current) return;
    const inlines = trimInlines(current.inlines);
    if (inlines.length > 0) blocks.push({ ...current, inlines });
    current = null;
  };

  /**
   * Chữ trong `li` đi vào item cuối của danh sách, không đi vào khối thường.
   *
   * `literal` dành cho ký tự do `<br>` sinh ra: nó phải giữ nguyên dấu xuống
   * dòng, trong khi chữ lấy từ nguồn thì mọi khoảng trắng đều gộp thành một
   * dấu cách theo đúng cách HTML hiển thị.
   */
  const pushText = (raw, literal = false) => {
    const text = literal ? raw : decodeEntities(raw);
    if (!literal && !text.trim() && !current && listStack.length === 0) return;

    const chunk = {
      text: literal ? text : collapse(text),
      bold: bold > 0,
      italic: italic > 0,
      href: currentHref(),
    };

    const list = listStack[listStack.length - 1];
    if (list && list.items.length > 0) {
      appendInline(list.items[list.items.length - 1], chunk);
      return;
    }

    if (!current) current = { type: "paragraph", inlines: [] };
    appendInline(current.inlines, chunk);
  };

  const closeList = () => {
    const list = listStack.pop();
    if (!list) return;
    const items = list.items
      .map(trimInlines)
      .filter((item) => item.length > 0);
    if (items.length > 0) blocks.push({ type: "list", ordered: list.ordered, items });
  };

  const length = html.length;
  let i = 0;

  while (i < length) {
    const lt = html.indexOf("<", i);

    if (lt === -1) {
      pushText(html.slice(i));
      break;
    }

    if (lt > i) pushText(html.slice(i, lt));

    // Bỏ qua chú thích
    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt);
      i = end === -1 ? length : end + 3;
      continue;
    }

    const gt = html.indexOf(">", lt);
    if (gt === -1) {
      // Thẻ chưa đóng ở cuối chuỗi: coi phần còn lại là chữ thay vì bỏ trắng
      pushText(html.slice(lt));
      break;
    }

    const rawTag = html.slice(lt + 1, gt);
    i = gt + 1;

    const isClosing = rawTag[0] === "/";
    const body = isClosing ? rawTag.slice(1) : rawTag;
    const nameMatch = body.match(/^\s*([a-z0-9]+)/i);
    if (!nameMatch) continue;

    const tag = nameMatch[1].toLowerCase();
    const attrsRaw = body.slice(nameMatch[0].length);

    // Thẻ mà cả nội dung bên trong cũng phải bỏ
    if (!isClosing && DROP_CONTENT_TAGS.has(tag)) {
      const closeIdx = html.toLowerCase().indexOf(`</${tag}`, i);
      i = closeIdx === -1 ? length : html.indexOf(">", closeIdx) + 1 || length;
      continue;
    }

    if (isClosing) {
      if (tag === "b" || tag === "strong") bold = Math.max(0, bold - 1);
      else if (tag === "i" || tag === "em") italic = Math.max(0, italic - 1);
      else if (tag === "a") hrefStack.pop();
      else if (tag === "ul" || tag === "ol") closeList();
      else if (BLOCK_TAGS.has(tag)) flushBlock();
      continue;
    }

    switch (tag) {
      case "b":
      case "strong":
        bold += 1;
        break;

      case "i":
      case "em":
        italic += 1;
        break;

      case "a": {
        const { href } = parseAttrs(attrsRaw);
        hrefStack.push(href || null);
        break;
      }

      case "br":
        // Xuống dòng trong cùng một đoạn — giữ bằng ký tự newline thật
        pushText("\n", true);
        break;

      case "hr":
        flushBlock();
        blocks.push({ type: "rule" });
        break;

      case "img": {
        const { src, alt } = parseAttrs(attrsRaw);
        if (src) {
          flushBlock();
          blocks.push({ type: "image", src, alt: alt || "" });
        }
        break;
      }

      case "ul":
      case "ol":
        flushBlock();
        listStack.push({ ordered: tag === "ol", items: [] });
        break;

      case "li": {
        const list = listStack[listStack.length - 1];
        if (list) list.items.push([]);
        break;
      }

      default:
        if (HEADING_TAGS.has(tag)) {
          startBlock("heading", { level: Number(tag[1]) });
        } else if (tag === "blockquote") {
          startBlock("quote");
        } else if (BLOCK_TAGS.has(tag)) {
          flushBlock();
        }
        // Thẻ ngoài phạm vi (table, iframe, span...) chỉ bỏ thẻ, giữ chữ
        break;
    }
  }

  // Kết thúc chuỗi mà còn khối/danh sách đang mở thì vẫn phải đẩy ra
  while (listStack.length > 0) closeList();
  flushBlock();

  return blocks;
};

/** Nối chữ vào đoạn cuối nếu cùng định dạng, để bớt số phần tử phải render */
const appendInline = (inlines, chunk) => {
  if (!chunk.text) return;

  const last = inlines[inlines.length - 1];
  if (
    last &&
    last.bold === chunk.bold &&
    last.italic === chunk.italic &&
    last.href === chunk.href
  ) {
    last.text += chunk.text;
    return;
  }

  inlines.push(chunk);
};

/** Cắt khoảng trắng ở hai đầu một dòng và bỏ các đoạn rỗng */
const trimInlines = (inlines) => {
  const result = inlines
    .map((chunk) => ({ ...chunk }))
    .filter((chunk) => chunk.text !== "");

  if (result.length === 0) return [];

  result[0].text = result[0].text.replace(/^[ \t]+/, "");
  result[result.length - 1].text = result[result.length - 1].text.replace(
    /[ \t]+$/,
    ""
  );

  return result.filter((chunk) => chunk.text !== "");
};

/**
 * Rút chữ thuần từ HTML — dùng cho đoạn tóm tắt trong thẻ danh sách.
 *
 * Danh sách bài viết của backend không có trường tóm tắt riêng, mà đưa cả HTML
 * bài vào `content`; cắt thẳng chuỗi HTML sẽ lộ ra thẻ giữa chừng.
 */
export const htmlToPlainText = (html) => {
  if (!html || typeof html !== "string") return "";

  return collapse(
    decodeEntities(
      html
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
        .replace(/<[^>]*>/g, " ")
    )
  ).trim();
};
