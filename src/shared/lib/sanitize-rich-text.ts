// Dipakai di dua tempat: editor Creator Studio (saat menyimpan) dan renderer
// publik project (saat menampilkan). Satu sumber supaya aturan whitelist-nya
// tidak bisa diam-diam berbeda antara yang divalidasi saat disimpan dan yang
// dipercaya saat ditampilkan ke semua pengunjung.
export const RICH_TEXT_TAGS = new Set([
  "A",
  "B",
  "BR",
  "DIV",
  "EM",
  "FONT",
  "H1",
  "H2",
  "I",
  "P",
  "SPAN",
  "STRONG",
  "U",
]);

export const FONT_OPTIONS = [
  "Arial",
  "Arial Black",
  "Bookman Old Style",
  "Century Schoolbook",
  "Courier New",
  "Garamond",
  "Georgia",
  "Helvetica",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
];

// `value` bisa berasal dari rich text yang ditulis user lain dan dirender ke
// semua pengunjung — tanpa sanitasi ini, pemakaian lewat dangerouslySetInnerHTML
// akan jadi stored-XSS. Strategi: tag di luar whitelist dilepas (bukan
// dihapus — child text-nya tetap tampil), lalu SEMUA atribut dibuang dan hanya
// ditambahkan kembali setelah lolos validasi per-atribut: href wajib berskema
// http(s)/mailto/tel, warna harus hex valid, ukuran font 1-7, dan text-align
// hanya left/center/right. Tidak ada atribut event handler (onxxx) atau skema
// javascript: yang bisa lolos lewat jalur ini.
export function sanitizeRichText(value: string) {
  if (typeof document === "undefined") return value.replace(/<[^>]*>/g, "");
  const template = document.createElement("template");
  template.innerHTML = value;
  for (const element of Array.from(template.content.querySelectorAll("*"))) {
    if (!RICH_TEXT_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }
    const href = element.tagName === "A" ? element.getAttribute("href") : null;
    const face =
      element.tagName === "FONT" ? element.getAttribute("face") : null;
    const size =
      element.tagName === "FONT" ? element.getAttribute("size") : null;
    const color =
      element.tagName === "FONT" ? element.getAttribute("color") : null;
    const align = element instanceof HTMLElement ? element.style.textAlign : "";
    // fontSize dibaca sebelum atribut dilepas: ini jalur untuk ukuran font
    // pixel-presisi (13-64px) dari toolbar, terpisah dari atribut legacy
    // size="1-7" bawaan execCommand di bawah.
    const fontSize =
      element instanceof HTMLElement ? element.style.fontSize : "";
    const fontSizePx = /^(\d{1,3})px$/.exec(fontSize)?.[1];
    // Penanda gaya "caption" pada paragraf — satu-satunya nilai yang diterima.
    const isCaption =
      element.tagName === "P" &&
      element.getAttribute("data-style") === "caption";
    Array.from(element.attributes).forEach((attribute) =>
      element.removeAttribute(attribute.name),
    );
    if (href && /^(https?:|mailto:|tel:)/i.test(href.trim())) {
      element.setAttribute("href", href.trim());
      element.setAttribute("rel", "noopener noreferrer");
      element.setAttribute("target", "_blank");
    }
    if (face && FONT_OPTIONS.includes(face)) element.setAttribute("face", face);
    if (size && /^[1-7]$/.test(size)) element.setAttribute("size", size);
    if (color && /^#[0-9a-f]{3,8}$/i.test(color))
      element.setAttribute("color", color);
    const styleParts: string[] = [];
    if (align && ["left", "center", "right"].includes(align))
      styleParts.push(`text-align:${align}`);
    if (fontSizePx && Number(fontSizePx) >= 1 && Number(fontSizePx) <= 300)
      styleParts.push(`font-size:${fontSizePx}px`);
    if (styleParts.length) element.setAttribute("style", styleParts.join(";"));
    if (isCaption) element.setAttribute("data-style", "caption");
  }
  return template.innerHTML;
}

// Mengambil text bersih untuk validasi dan ringkasan project (dipakai schema
// dashboard-creator untuk memastikan konten tidak kosong setelah tag dilepas).
export function plainTextFromRichText(value: string) {
  if (typeof document === "undefined")
    return value
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const template = document.createElement("template");
  template.innerHTML = sanitizeRichText(value);
  return (template.content.textContent ?? "").replace(/\s+/g, " ").trim();
}
