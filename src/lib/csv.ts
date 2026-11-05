const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCSV = (rows: unknown[][]) => rows.map(r => r.map(cell).join(",")).join("\n");
