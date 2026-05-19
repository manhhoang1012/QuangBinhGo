interface ImageOptions {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit" | "thumb";
}

export function optimizeImageUrl(url: string | null | undefined, options: ImageOptions = {}) {
  if (!url) {
    return "";
  }
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  const transforms = ["f_auto", "q_auto"];
  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.crop) transforms.push(`c_${options.crop}`);

  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
}
