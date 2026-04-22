const IMAGE_VARIANT_SPECS = {
  card: { width: 640, height: 480, quality: 80, crop: "fill" },
  chat: { width: 160, height: 160, quality: 75, crop: "fill" },
  detail: { width: 1400, height: 1050, quality: 85, crop: "limit" },
};

function isCloudinaryUrl(url) {
  return /res\.cloudinary\.com/i.test(url);
}

function isUnsplashUrl(url) {
  return /images\.unsplash\.com/i.test(url);
}

function buildCloudinaryVariant(url, spec) {
  if (!url.includes("/upload/")) {
    return url;
  }

  const transformation = [
    "f_auto",
    "q_auto",
    `c_${spec.crop}`,
    `w_${spec.width}`,
    `h_${spec.height}`,
  ].join(",");

  return url.replace("/upload/", `/upload/${transformation}/`);
}

function buildUnsplashVariant(url, spec) {
  const nextUrl = new URL(url);
  nextUrl.searchParams.set("auto", "format");
  nextUrl.searchParams.set("fit", spec.crop === "limit" ? "max" : "crop");
  nextUrl.searchParams.set("w", String(spec.width));
  nextUrl.searchParams.set("h", String(spec.height));
  nextUrl.searchParams.set("q", String(spec.quality));
  return nextUrl.toString();
}

function buildVariantUrl(url, spec) {
  if (!url) {
    return "";
  }

  if (isCloudinaryUrl(url)) {
    return buildCloudinaryVariant(url, spec);
  }

  if (isUnsplashUrl(url)) {
    return buildUnsplashVariant(url, spec);
  }

  return url;
}

export function buildImageVariants(url) {
  return {
    original: url || "",
    card: buildVariantUrl(url, IMAGE_VARIANT_SPECS.card),
    chat: buildVariantUrl(url, IMAGE_VARIANT_SPECS.chat),
    detail: buildVariantUrl(url, IMAGE_VARIANT_SPECS.detail),
  };
}

export function buildGalleryVariants(urls = []) {
  return urls.map((url) => buildImageVariants(url));
}
