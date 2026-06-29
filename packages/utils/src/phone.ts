const E164_REGEX = /^\+[1-9]\d{1,14}$/;

export function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone);
}

export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 15) {
    const candidate = `+${digits}`;
    if (isValidE164(candidate)) return candidate;
  }
  return null;
}
