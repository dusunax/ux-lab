export const sanitizeNodeLabel = (label: string): string => {
  if (!label) return "";

  let sanitized = label.trim().toLowerCase();
  sanitized = sanitized.replace(/[^a-z0-9가-힣 _-]/g, "_");
  sanitized = sanitized.replace(/\s+/g, "_");
  sanitized = sanitized.replace(/_+/g, "_");
  sanitized = sanitized.replace(/-+/g, "_");
  if (/^\d/.test(sanitized)) sanitized = "_" + sanitized;

  return sanitized;
};

