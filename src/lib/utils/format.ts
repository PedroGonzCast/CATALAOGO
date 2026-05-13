// FileMaker devuelve fechas como MM/DD/YYYY — convertir a ISO para display
export function fmDateToISO(fmDate: string): string {
  if (!fmDate) return '';
  const [month, day, year] = fmDate.split('/');
  if (!month || !day || !year) return fmDate;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Convertir ISO a formato FileMaker MM/DD/YYYY
export function isoToFMDate(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${month}/${day}/${year}`;
}

export function formatDate(dateStr: string, locale = 'es-CO'): string {
  if (!dateStr) return '—';
  try {
    const iso = fmDateToISO(dateStr);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(iso));
  } catch {
    return dateStr;
  }
}

export function formatPhone(phone: string): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}
