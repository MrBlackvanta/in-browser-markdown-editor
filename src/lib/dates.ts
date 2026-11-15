const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const calendarDate = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function utcMidnight(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`);
}

export function isIsoDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const date = utcMidnight(value);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function formatIsoDate(isoDate: string) {
  return calendarDate.format(utcMidnight(isoDate));
}
