import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseDate,
  formatBubbleTime,
  formatChatListDate,
  formatDateDivider,
  formatTime,
} from '../utils/formatDate.js';

describe('formatDate Smoke & Unit Tests', () => {
  describe('parseDate()', () => {
    it('should return null for null, undefined, empty string, or whitespace', () => {
      assert.strictEqual(parseDate(null), null);
      assert.strictEqual(parseDate(undefined), null);
      assert.strictEqual(parseDate(''), null);
      assert.strictEqual(parseDate('   '), null);
    });

    it('should pass through existing valid Date objects and reject invalid ones', () => {
      const now = new Date();
      assert.strictEqual(parseDate(now), now);
      assert.strictEqual(parseDate(new Date('invalid-date-string')), null);
    });

    it('should parse numeric epochs (numbers and numeric strings)', () => {
      const epoch = 1727694000000;
      const parsedNum = parseDate(epoch);
      assert.ok(parsedNum instanceof Date);
      assert.strictEqual(parsedNum.getTime(), epoch);

      const parsedStr = parseDate(epoch.toString());
      assert.ok(parsedStr instanceof Date);
      assert.strictEqual(parsedStr.getTime(), epoch);
    });

    it('should parse standard ISO-8601 strings', () => {
      const iso = '2026-09-29T12:00:14.000Z';
      const parsed = parseDate(iso);
      assert.ok(parsed instanceof Date);
      assert.ok(!isNaN(parsed.getTime()));
    });

    it('should parse MySQL SQL timestamp format ("YYYY-MM-DD HH:mm:ss")', () => {
      const sqlTimestamp = '2026-09-30 06:21:22';
      const parsed = parseDate(sqlTimestamp);
      assert.ok(parsed instanceof Date);
      assert.ok(!isNaN(parsed.getTime()));
      assert.strictEqual(parsed.getUTCFullYear(), 2026);
    });

    it('should parse localized Java Date strings with standard or non-breaking spaces', () => {
      const javaDateStr = 'Sep 29, 2026, 12:46:08 PM';
      const parsed = parseDate(javaDateStr);
      assert.ok(parsed instanceof Date);
      assert.strictEqual(parsed.getFullYear(), 2026);
      assert.strictEqual(parsed.getMonth(), 8); // September is month index 8
      assert.strictEqual(parsed.getDate(), 29);
      assert.strictEqual(parsed.getHours(), 12);
      assert.strictEqual(parsed.getMinutes(), 46);

      // Non-breaking space version (\u202F) common in modern Java 17+ / Android locales
      const nbspStr = 'Sep 29, 2026,\u202F12:46:08\u202FPM';
      const parsedNbsp = parseDate(nbspStr);
      assert.ok(parsedNbsp instanceof Date);
      assert.strictEqual(parsedNbsp.getFullYear(), 2026);
    });
  });

  describe('formatBubbleTime()', () => {
    it('should return empty string for null or invalid inputs', () => {
      assert.strictEqual(formatBubbleTime(null), '');
      assert.strictEqual(formatBubbleTime('invalid'), '');
    });

    it('should format times correctly with 12-hour AM/PM and zero-padded minutes', () => {
      const dateMorning = new Date(2026, 8, 30, 9, 5, 0); // 09:05 AM
      assert.strictEqual(formatBubbleTime(dateMorning), '9:05 AM');

      const dateAfternoon = new Date(2026, 8, 30, 14, 30, 0); // 02:30 PM
      assert.strictEqual(formatBubbleTime(dateAfternoon), '2:30 PM');

      const dateNoon = new Date(2026, 8, 30, 12, 0, 0); // 12:00 PM
      assert.strictEqual(formatBubbleTime(dateNoon), '12:00 PM');

      const dateMidnight = new Date(2026, 8, 30, 0, 15, 0); // 12:15 AM
      assert.strictEqual(formatBubbleTime(dateMidnight), '12:15 AM');
    });
  });

  describe('formatChatListDate()', () => {
    it('should return bubble time for timestamps occurring today', () => {
      const today = new Date();
      today.setHours(10, 20, 0);
      const formatted = formatChatListDate(today);
      assert.strictEqual(formatted, '10:20 AM');
    });

    it('should return "Yesterday" for timestamps from exactly yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const formatted = formatChatListDate(yesterday);
      assert.strictEqual(formatted, 'Yesterday');
    });

    it('should return the day of week for dates 2 to 6 days ago', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const formatted = formatChatListDate(threeDaysAgo);
      const expectedDayNames = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
      ];
      assert.strictEqual(formatted, expectedDayNames[threeDaysAgo.getDay()]);
    });

    it('should return DD/MM/YYYY for dates older than 6 days', () => {
      const oldDate = new Date(2025, 0, 5); // 05/01/2025
      const formatted = formatChatListDate(oldDate);
      assert.strictEqual(formatted, '05/01/2025');
    });
  });

  describe('formatDateDivider()', () => {
    it('should return "Today" for current date', () => {
      assert.strictEqual(formatDateDivider(new Date()), 'Today');
    });

    it('should return "Yesterday" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      assert.strictEqual(formatDateDivider(yesterday), 'Yesterday');
    });

    it('should return full date representation for older dates', () => {
      const pastDate = new Date(2026, 8, 15); // 15 September 2026
      assert.strictEqual(formatDateDivider(pastDate), '15 September 2026');
    });
  });

  describe('formatTime() backwards compatibility', () => {
    it('should mirror formatChatListDate output', () => {
      const now = new Date();
      assert.strictEqual(formatTime(now), formatChatListDate(now));
    });
  });
});
