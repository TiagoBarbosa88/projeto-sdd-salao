export type AgendaViewMode = 'day' | 'week' | 'month';

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPeriodRange(reference: Date, mode: AgendaViewMode): { start: Date; end: Date } {
  switch (mode) {
    case 'day': {
      return { start: startOfDay(reference), end: endOfDay(reference) };
    }
    case 'week': {
      const start = startOfWeek(reference);
      const end = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
      return { start, end };
    }
    case 'month': {
      const start = startOfDay(new Date(reference.getFullYear(), reference.getMonth(), 1));
      const end = endOfDay(new Date(reference.getFullYear(), reference.getMonth() + 1, 0));
      return { start, end };
    }
  }
}
