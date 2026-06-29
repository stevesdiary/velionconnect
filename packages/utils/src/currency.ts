export function formatCurrency(
  amountInSmallestUnit: number,
  currency: string,
  locale = 'en-NG',
): string {
  const amount = amountInSmallestUnit / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function toSmallestUnit(amount: number): number {
  return Math.round(amount * 100);
}
