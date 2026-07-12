export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length === 0) {
    return '';
  }
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatPhoneDisplay(value?: string | null): string {
  if (!value?.trim()) {
    return '';
  }
  return formatPhoneInput(value);
}

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidBrazilianPhone(value: string): boolean {
  const digits = phoneDigits(value);
  return digits.length === 10 || digits.length === 11;
}

export function optionalPhoneValidator(value: unknown): { phone: true } | null {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }
  return isValidBrazilianPhone(raw) ? null : { phone: true };
}

export function normalizePhoneValue(value: string): string | undefined {
  const formatted = formatPhoneInput(value);
  return formatted || undefined;
}
