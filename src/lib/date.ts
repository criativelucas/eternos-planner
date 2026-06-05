// Brazilian-format date helpers anchored at noon to avoid timezone shifts.

export const formatBR = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
};

export const daysUntil = (dateStr: string | null | undefined): number => {
  if (!dateStr) return 0;
  const target = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};
