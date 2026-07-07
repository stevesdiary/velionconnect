import { formatCurrency, toSmallestUnit } from './currency';

describe('toSmallestUnit', () => {
  it('converts a major-unit amount to the smallest unit', () => {
    expect(toSmallestUnit(15)).toBe(1500);
    expect(toSmallestUnit(0.1)).toBe(10);
  });

  it('rounds to avoid floating point drift', () => {
    // 19.99 * 100 is 1998.9999999999998 in IEEE-754
    expect(toSmallestUnit(19.99)).toBe(1999);
  });
});

describe('formatCurrency', () => {
  it('divides the smallest unit by 100 and formats the amount', () => {
    // 150000 kobo = ₦1,500.00
    expect(formatCurrency(150000, 'NGN')).toContain('1,500.00');
  });

  it('renders the currency symbol for the given locale', () => {
    expect(formatCurrency(150000, 'USD', 'en-US')).toContain('$1,500.00');
  });

  it('always shows two fraction digits', () => {
    expect(formatCurrency(100, 'USD', 'en-US')).toContain('1.00');
  });
});
