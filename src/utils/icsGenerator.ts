import { CalendarEvent, ParentId, PediatricVisit } from '../types/coParent';

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function formatIcsDateTime(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  const cleanTime = timeStr.replace(/:/g, '').padEnd(4, '0').slice(0, 4);
  return `${cleanDate}T${cleanTime}00`;
}

function formatUtcStamp(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) {
    return '20261121T120000Z';
  }
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

function foldIcsLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  chunks.push(line.slice(0, 75));
  let idx = 75;
  while (idx < line.length) {
    chunks.push(' ' + line.slice(idx, idx + 74));
    idx += 74;
  }
  return chunks.join('\r\n');
}

export interface IcsExportOptions {
  calendarName: string;
  filterParent?: ParentId | 'all';
  includeMedicalOnly?: boolean;
  nowIso?: string;
}

export function generateIcsFeed(
  events: CalendarEvent[],
  visits: PediatricVisit[],
  options: IcsExportOptions
): string {
  const stamp = formatUtcStamp(options.nowIso ?? '2026-11-21T15:30:00Z');
  const filteredEvents = events.filter((ev) => {
    if (options.includeMedicalOnly && ev.category !== 'pediatric') return false;
    if (options.filterParent && options.filterParent !== 'all') {
      return ev.assignedParent === options.filterParent || ev.assignedParent === 'both';
    }
    return true;
  });

  const existingKeys = new Set(filteredEvents.map((e) => `${e.date}_${e.startTime}_${e.title}`));

  const visitEvents: CalendarEvent[] = visits
    .filter((v) => v.status === 'upcoming')
    .filter((v) => {
      if (options.filterParent && options.filterParent !== 'all') {
        return v.attendingParent === options.filterParent || v.attendingParent === 'both';
      }
      return true;
    })
    .map((v) => ({
      id: `visit-${v.id}`,
      title: `Pediatrician: ${v.reason} (${v.doctor})`,
      date: v.date,
      startTime: v.time,
      endTime: addMinutesToTime(v.time, 45),
      category: 'pediatric' as const,
      assignedParent: v.attendingParent,
      location: v.clinic,
      notes: v.recommendations,
      reminderMinutes: 60,
      syncedToICal: true,
    }))
    .filter((ve) => !existingKeys.has(`${ve.date}_${ve.startTime}_${ve.title}`));

  const allItems = [...filteredEvents, ...visitEvents];

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Olli Co-Parenting OS//iPhone iCalendar Sync//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(options.calendarName)}`,
    'X-WR-TIMEZONE:America/New_York',
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
    'X-PUBLISHED-TTL:PT15M',
  ];

  for (const ev of allItems) {
    const dtStart = formatIcsDateTime(ev.date, ev.startTime);
    const dtEnd = formatIcsDateTime(ev.date, ev.endTime);
    const parentLabel =
      ev.assignedParent === 'both'
        ? 'Both parents'
        : ev.assignedParent === 'claire'
        ? 'Claire'
        : 'David';
    const fullDescription = [
      `Category: ${ev.category}`,
      `Parent: ${parentLabel}`,
      ev.notes ? `Notes: ${ev.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.id}@olli-coparent.app`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;TZID=America/New_York:${dtStart}`);
    lines.push(`DTEND;TZID=America/New_York:${dtEnd}`);
    lines.push(`SUMMARY:${escapeIcsText(ev.title)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(fullDescription)}`);
    if (ev.location) {
      lines.push(`LOCATION:${escapeIcsText(ev.location)}`);
    }
    lines.push(`CATEGORIES:${ev.category.toUpperCase()}`);
    lines.push('STATUS:CONFIRMED');

    const reminder = ev.reminderMinutes ?? 30;
    if (reminder > 0) {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${escapeIcsText(`Reminder: ${ev.title}`)}`);
      lines.push(`TRIGGER:-PT${reminder}M`);
      lines.push('END:VALARM');
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

export function generateSingleVisitIcs(visit: PediatricVisit, nowIso?: string): string {
  return generateIcsFeed([], [visit], {
    calendarName: `Pediatric Visit — ${visit.reason}`,
    nowIso,
  });
}

function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const [hhStr, mmStr] = timeStr.split(':');
  const hh = Number(hhStr) || 0;
  const mm = Number(mmStr) || 0;
  const total = Math.min(23 * 60 + 59, hh * 60 + mm + minutesToAdd);
  const nextH = String(Math.floor(total / 60)).padStart(2, '0');
  const nextM = String(total % 60).padStart(2, '0');
  return `${nextH}:${nextM}`;
}
