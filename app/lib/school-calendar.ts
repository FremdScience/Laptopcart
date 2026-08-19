const noSchoolRanges: [string, string, string][] = [
  ["2026-09-07", "2026-09-07", "Labor Day"],
  ["2026-10-12", "2026-10-13", "Holiday / Teacher Institute"],
  ["2026-11-25", "2026-11-27", "Fall Break"],
  ["2026-12-21", "2027-01-04", "Winter Break / Teacher Institute"],
  ["2027-01-18", "2027-01-18", "District holiday"],
  ["2027-02-15", "2027-02-15", "District holiday"],
  ["2027-03-22", "2027-03-26", "Spring Break"],
];

const scheduleLabels: Record<string, string> = {
  "2026-08-18": "Late start", "2026-08-27": "Early dismissal",
  "2026-09-01": "Late start", "2026-09-15": "Late start", "2026-09-29": "Late start",
  "2026-10-20": "Late start", "2026-11-03": "Late start", "2026-11-17": "Late start",
  "2026-12-01": "Late start", "2026-12-16": "Final exams", "2026-12-17": "Final exams", "2026-12-18": "Final exams",
  "2027-01-12": "Late start", "2027-01-26": "Late start", "2027-02-02": "Late start",
  "2027-02-16": "Late start", "2027-02-18": "Early dismissal", "2027-03-02": "Late start",
  "2027-03-04": "Early dismissal", "2027-03-16": "Late start", "2027-04-06": "Late start",
  "2027-04-20": "Late start", "2027-05-07": "Early dismissal", "2027-05-18": "Final exams",
  "2027-05-19": "Final exams", "2027-05-20": "Final exams",
};

export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function getMonday(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(12, 0, 0, 0);
  return result;
}

export function getDayInfo(date: string) {
  const closed = noSchoolRanges.find(([start, end]) => date >= start && date <= end);
  if (closed) return { closed: true, reason: closed[2], label: "No school" };
  return { closed: false, reason: "", label: scheduleLabels[date] || "" };
}

export function isBookableDate(date: string) {
  const value = new Date(`${date}T12:00:00`);
  const weekday = value.getDay();
  return date >= "2026-08-10" && date <= "2027-05-20" && weekday >= 1 && weekday <= 5 && !getDayInfo(date).closed;
}

export function formatDate(date: string, options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", options);
}
