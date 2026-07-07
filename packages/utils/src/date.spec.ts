import { formatRelative, nowUtc, toUtc } from './date';

describe('toUtc', () => {
  it('returns a Date with the same instant as the input', () => {
    const input = new Date('2026-07-07T12:34:56.000Z');
    expect(toUtc(input).getTime()).toBe(input.getTime());
  });
});

describe('nowUtc', () => {
  it('returns a Date within a second of now', () => {
    expect(Math.abs(nowUtc().getTime() - Date.now())).toBeLessThan(1000);
  });
});

describe('formatRelative', () => {
  it('formats a difference of seconds', () => {
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    expect(formatRelative(thirtySecondsAgo)).toMatch(/second/);
  });

  it('formats a difference of minutes', () => {
    const inFiveMinutes = new Date(Date.now() + 5 * 60 * 1000);
    expect(formatRelative(inFiveMinutes)).toMatch(/minute/);
  });

  it('formats a difference of hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelative(threeHoursAgo)).toMatch(/hour/);
  });

  it('formats a difference of days', () => {
    const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    expect(formatRelative(inTwoDays)).toMatch(/day/);
  });
});
