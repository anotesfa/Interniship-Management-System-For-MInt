import { AttendanceWeekEntry } from '../../types/attendance.types';

const WEEKDAY_LABELS: Array<{ key: keyof AttendanceWeekEntry; label: string }> = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
];

export function AttendanceSheetDisplay({ weeks }: { weeks: AttendanceWeekEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface-page text-text-muted uppercase text-[11px] tracking-wider">
          <tr>
            <th className="px-4 py-3">Week</th>
            <th className="px-4 py-3">From</th>
            <th className="px-4 py-3">To</th>
            {WEEKDAY_LABELS.map((day) => (
              <th key={day.key} className="px-3 py-3 text-center">{day.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle bg-white">
          {weeks.map((week) => (
            <tr key={week.week} className="hover:bg-surface-page/60">
              <td className="px-4 py-3 font-semibold text-text-primary whitespace-nowrap">Week {week.week}</td>
              <td className="px-4 py-3 text-text-primary whitespace-nowrap">{week.from || '—'}</td>
              <td className="px-4 py-3 text-text-primary whitespace-nowrap">{week.to || '—'}</td>
              {WEEKDAY_LABELS.map((day) => (
                <td key={day.key} className="px-3 py-3 text-center">
                  <span className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-[11px] font-semibold ${week[day.key] ? 'bg-status-approved-bg text-status-approved-text' : 'bg-status-rejected-bg text-status-rejected-text'}`}>
                    {week[day.key] ? 'Yes' : 'No'}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AttendanceSheetDisplay;
