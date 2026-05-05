export const uid = (prefix = "id") =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;

export const nowIso = () => new Date().toISOString();

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));

export const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "resume";
