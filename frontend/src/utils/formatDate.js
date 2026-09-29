/**
 * WhatsApp-grade Date & Time Formatter for SwiftChat.
 * Fully compatible with React Native Hermes / Android JavaScript engine.
 * Never displays "Invalid Date".
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

/**
 * Bulletproof date parser supporting:
 * - ISO-8601 UTC ("2026-09-29T12:00:14.000Z")
 * - SQL Timestamps ("2026-09-29 12:00:14")
 * - Java Date.toString() or DateFormat.DEFAULT ("Sep 29, 2026, 12:46:08 PM") with non-breaking spaces
 * - Millisecond timestamps (numbers or numeric strings)
 */
export function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  // Numeric epoch
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Pure numeric string
    if (/^\d+$/.test(trimmed)) {
      const d = new Date(parseInt(trimmed, 10));
      if (!isNaN(d.getTime())) return d;
    }

    // Replace non-breaking spaces (\u202F, \u00A0) with standard space
    const cleaned = trimmed.replace(/[\u202F\u00A0]/g, ' ');

    // Try standard ISO / Date constructor first
    let d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d;

    // Try converting "YYYY-MM-DD HH:mm:ss" to ISO
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(cleaned)) {
      d = new Date(cleaned.replace(' ', 'T') + 'Z');
      if (!isNaN(d.getTime())) return d;
    }

    // Custom regex parser for localized strings: e.g. "Sep 29, 2026, 12:46:08 PM"
    const localizedMatch = cleaned.match(
      /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i
    );
    if (localizedMatch) {
      const monthStr = localizedMatch[1].substring(0, 3).toLowerCase();
      const monthIdx = MONTH_NAMES.findIndex(
        (m) => m.toLowerCase() === monthStr
      );
      if (monthIdx !== -1) {
        const day = parseInt(localizedMatch[2], 10);
        const year = parseInt(localizedMatch[3], 10);
        let hour = parseInt(localizedMatch[4], 10);
        const minute = parseInt(localizedMatch[5], 10);
        const second = localizedMatch[6] ? parseInt(localizedMatch[6], 10) : 0;
        const ampm = localizedMatch[7] ? localizedMatch[7].toUpperCase() : null;

        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;

        const manualDate = new Date(year, monthIdx, day, hour, minute, second);
        if (!isNaN(manualDate.getTime())) return manualDate;
      }
    }
  }

  return null;
}

/**
 * Formats time for chat bubbles: "10:15 AM", "12:04 PM"
 */
export function formatBubbleTime(rawDate) {
  const d = parseDate(rawDate);
  if (!d) return '';

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12 AM
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Formats date for conversation list rows in WhatsApp style:
 * - Today: "10:15 AM"
 * - Yesterday: "Yesterday"
 * - Within past 6 days: Day name ("Tuesday", "Wednesday")
 * - Older: "DD/MM/YYYY" (e.g. "25/09/2026")
 */
export function formatChatListDate(rawDate) {
  const d = parseDate(rawDate);
  if (!d) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffMs = today - targetDay;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return formatBubbleTime(d);
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays > 1 && diffDays < 7) {
    return DAYS_OF_WEEK[d.getDay()];
  } else {
    const day = d.getDate() < 10 ? '0' + d.getDate() : d.getDate();
    const month = d.getMonth() + 1 < 10 ? '0' + (d.getMonth() + 1) : d.getMonth() + 1;
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

/**
 * Formats sticky section headers / date separators inside chat rooms:
 * - "Today"
 * - "Yesterday"
 * - Older: "29 September 2026"
 */
export function formatDateDivider(rawDate) {
  const d = parseDate(rawDate);
  if (!d) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffMs = today - targetDay;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else {
    const day = d.getDate();
    const month = FULL_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }
}

/**
 * Backward-compatible formatTime export
 */
export function formatTime(timestamp) {
  return formatChatListDate(timestamp);
}

export default formatChatListDate;
