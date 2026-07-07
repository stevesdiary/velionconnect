import { isValidE164, normalizePhone } from './phone';

describe('isValidE164', () => {
  it('accepts a well-formed E.164 number', () => {
    expect(isValidE164('+2348012345678')).toBe(true);
    expect(isValidE164('+14155552671')).toBe(true);
  });

  it('rejects numbers without a leading +', () => {
    expect(isValidE164('2348012345678')).toBe(false);
  });

  it('rejects numbers starting with +0', () => {
    expect(isValidE164('+0123456789')).toBe(false);
  });

  it('rejects numbers with non-digit characters', () => {
    expect(isValidE164('+234 801 234 5678')).toBe(false);
    expect(isValidE164('+234-801-234')).toBe(false);
  });

  it('rejects numbers longer than 15 digits', () => {
    expect(isValidE164('+1234567890123456')).toBe(false);
  });
});

describe('normalizePhone', () => {
  it('normalizes a number with formatting into E.164', () => {
    expect(normalizePhone('+234 801 234 5678')).toBe('+2348012345678');
    expect(normalizePhone('(415) 555-2671')).toBe('+4155552671');
  });

  it('strips all non-digit characters before validating', () => {
    expect(normalizePhone('234.801.234.5678')).toBe('+2348012345678');
  });

  it('returns null for too-short inputs', () => {
    expect(normalizePhone('12345')).toBeNull();
  });

  it('returns null for too-long inputs', () => {
    expect(normalizePhone('1234567890123456')).toBeNull();
  });

  it('returns null when nothing digit-like is present', () => {
    expect(normalizePhone('not a phone')).toBeNull();
  });
});
