import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { TODAY_ISO } from '../data/seedData';
import { CalendarEvent, EventCategory, ParentId } from '../types/coParent';

interface EventModalProps {
  isOpen: boolean;
  initialDate?: string;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  initialDate,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate || TODAY_ISO);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [category, setCategory] = useState<EventCategory>('pediatric');
  const [assignedParent, setAssignedParent] = useState<ParentId | 'both'>('claire');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setDate(initialDate || TODAY_ISO);
      setError('');
    }
  }, [isOpen, initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter an event title (e.g. ENT specialist follow-up).');
      return;
    }
    if (!date) {
      setError('Please select an event date.');
      return;
    }
    if (endTime <= startTime) {
      setError('End time must be later than start time.');
      return;
    }

    onSave({
      title: title.trim(),
      date,
      startTime,
      endTime,
      category,
      assignedParent,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      reminderMinutes,
      syncedToICal: true,
    });

    setTitle('');
    setLocation('');
    setNotes('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-white/10">
              <h2
                id="event-modal-title"
                className="font-display text-lg font-semibold text-[#101012] dark:text-[#F7F4EF]"
              >
                New shared schedule event
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="p-2 rounded-lg text-stone-500 hover:text-[#101012] dark:text-stone-400 dark:hover:text-[#F7F4EF] hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="ev-title"
                  className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
                >
                  Event title
                </label>
                <input
                  id="ev-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ENT checkup or Preschool pickup"
                  className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm text-[#101012] dark:text-[#F7F4EF] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="ev-date"
                    className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Date
                  </label>
                  <input
                    id="ev-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm font-mono tabular-nums text-[#101012] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ev-start"
                    className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Start
                  </label>
                  <input
                    id="ev-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm font-mono tabular-nums text-[#101012] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ev-end"
                    className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    End
                  </label>
                  <input
                    id="ev-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm font-mono tabular-nums text-[#101012] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="ev-category"
                    className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Category
                  </label>
                  <select
                    id="ev-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm text-[#101012] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="pediatric">Pediatric & Health</option>
                    <option value="handover">Custody Handover</option>
                    <option value="preschool">Preschool</option>
                    <option value="activity">Activities</option>
                    <option value="custody">Custody Day</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="ev-parent"
                    className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Assigned parent
                  </label>
                  <select
                    id="ev-parent"
                    value={assignedParent}
                    onChange={(e) => setAssignedParent(e.target.value as ParentId | 'both')}
                    className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm text-[#101012] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="claire">Claire</option>
                    <option value="david">David</option>
                    <option value="both">Both parents</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="ev-location"
                    className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Location (optional)
                  </label>
                  <input
                    id="ev-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Oakwood Pediatrics"
                    className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm text-[#101012] dark:text-[#F7F4EF] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ev-alarm"
                    className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    iCal Alert
                  </label>
                  <select
                    id="ev-alarm"
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm text-[#101012] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value={15}>15 min before</option>
                    <option value={30}>30 min before</option>
                    <option value={60}>1 hr before</option>
                    <option value={120}>2 hrs before</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="ev-notes"
                  className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
                >
                  Handoff notes for co-parent
                </label>
                <textarea
                  id="ev-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Bring immunization booklet and fever chart."
                  className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm text-[#101012] dark:text-[#F7F4EF] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white suno-gradient transition-all"
                >
                  Save & Sync to iCal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
