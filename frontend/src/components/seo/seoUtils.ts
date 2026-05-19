const defaultDescription = "Website khám phá du lịch Quảng Bình, địa điểm, review, lịch trình và cộng đồng du lịch.";

export function truncateMeta(value: string | null | undefined, maxLength = 155) {
  const compact = (value || defaultDescription).replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).trim()}…`;
}
