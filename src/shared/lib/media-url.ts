export interface MediaDeliveryOptions {
  width?: number;
  height?: number;
  webp?: boolean;
}

// 1. URL canonical dari backend tidak pernah diubah; helper ini hanya membuat
// URL delivery Cloudinary baru saat media akan dirender di browser.
export function getMediaDeliveryUrl(
  url: string,
  options: MediaDeliveryOptions = {},
) {
  if (!url || url.startsWith("blob:") || url.startsWith("data:")) return url;
  const isImage = url.includes("/image/upload/");
  const isVideo = url.includes("/video/upload/");
  if (!isImage && !isVideo) return url;

  // 2. Video hanya menerima optimasi quality; image memakai format adaptif.
  const transforms = [
    options.width ? `w_${Math.max(1, Math.round(options.width))}` : "",
    options.height && isImage ? `h_${Math.max(1, Math.round(options.height))}` : "",
    isImage && options.webp ? "f_webp" : isImage ? "f_auto" : "",
    "q_auto",
  ].filter(Boolean);

  return url.replace(
    isImage ? "/image/upload/" : "/video/upload/",
    `${isImage ? "/image/upload/" : "/video/upload/"}${transforms.join(",")}/`,
  );
}
