/**
 * Utility helper: Formats timestamps for chat messages and conversation lists.
 */
export function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();

  // Same day -> show HH:MM
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Within past 7 days -> show Day name
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  // Older -> show Mon DD
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default formatTime;
