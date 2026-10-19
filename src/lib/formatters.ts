/**
 * Formats a number as Indonesian Rupiah without decimals (e.g. Rp18.000)
 */
export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount || 0);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(rounded);
  return `Rp${formatted}`;
}

/**
 * Parses user input string with dots/commas to integer Rupiah
 */
export function parseRupiahInput(value: string): number {
  const cleaned = value.replace(/[^0-9]/g, '');
  return parseInt(cleaned || '0', 10);
}

/**
 * Returns today's date string in Asia/Jakarta (WIB) timezone as YYYY-MM-DD
 */
export function getWibTodayString(): string {
  const now = new Date();
  // Format to Asia/Jakarta
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into readable Indonesian format
 * e.g. "12 Oktober 2026" or "12 Okt 2026"
 */
export function formatDateIndonesia(dateStr: string, short = false): string {
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00+07:00`);
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: short ? 'short' : 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Formats date relative to today: "Hari ini", "Kemarin", or formatted date
 */
export function formatRelativeDate(dateStr: string): string {
  const today = getWibTodayString();
  const datePart = dateStr.slice(0, 10);

  if (datePart === today) {
    return 'Hari ini';
  }

  // Check yesterday
  const todayDate = new Date(`${today}T12:00:00+07:00`);
  const targetDate = new Date(`${datePart}T12:00:00+07:00`);
  const diffDays = Math.round((todayDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return 'Kemarin';
  }

  return formatDateIndonesia(datePart, true);
}
