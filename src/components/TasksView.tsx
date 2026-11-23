import React, { useMemo, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PARENTS } from '../data/seedData';
import { HandoverTask, ParentId } from '../types/coParent';
import { calculateTaskProgress } from '../utils/coParentLogic';

interface TasksViewProps {
  activeParent: ParentId;
  tasks: HandoverTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Omit<HandoverTask, 'id'>) => void;
  onDeleteTask: (taskId: string) => void;
}

type FilterGroup = 'all' | HandoverTask['group'];

const GROUP_LABELS: Record<HandoverTask['group'], string> = {
  bag: 'Handover bag',
  health: 'Health & meds',
  routine: 'Toddler routine',
};

export const TasksView: React.FC<TasksViewProps> = ({
  activeParent,
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
}) => {
  const [filter, setFilter] = useState<FilterGroup>('all');
  const [title, setTitle] = useState('');
  const [group, setGroup] = useState<HandoverTask['group']>('bag');
  const [assignedTo, setAssignedTo] = useState<ParentId | 'both'>(activeParent);
  const [dueTime, setDueTime] = useState('17:15');
  const [formError, setFormError] = useState('');

  const progress = useMemo(() => calculateTaskProgress(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter((t) => t.group === filter);
  }, [tasks, filter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a task or item to pack.');
      return;
    }
    onAddTask({
      title: title.trim(),
      group,
      assignedTo,
      dueTime: dueTime || undefined,
      completed: false,
    });
    setTitle('');
    setFormError('');
  };

  return (
    <div className="space-y-8">
      {/* Header + Animated Progress */}
      <section className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] suno-aura p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-[#101012] dark:text-[#F7F4EF]">
              Daily tasks & handover checklist
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Shared between two households so essentials never stay behind
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono tabular-nums text-2xl font-bold text-[#101012] dark:text-[#F7F4EF]">
              {progress.percent}%
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">
              {progress.completed} of {progress.total} completed
            </div>
          </div>
        </div>

        <div className="mt-5 h-2 w-full rounded-full bg-stone-100 dark:bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.percent}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full suno-gradient"
          />
        </div>
      </section>

      {/* Add Task Form + Filtered List */}
      <section className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-3 pb-6 border-b border-stone-200 dark:border-white/10">
          {formError && <div className="text-xs text-rose-500 font-medium">{formError}</div>}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-5">
              <label htmlFor="new-task-title" className="sr-only">
                New task description
              </label>
              <input
                id="new-task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add item to bag or task (e.g. Spare fleece mittens)"
                className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm text-[#101012] dark:text-[#F7F4EF] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="lg:col-span-3">
              <label htmlFor="new-task-group" className="sr-only">
                Category
              </label>
              <select
                id="new-task-group"
                value={group}
                onChange={(e) => setGroup(e.target.value as HandoverTask['group'])}
                className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm text-[#101012] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="bag">Handover bag</option>
                <option value="health">Health & meds</option>
                <option value="routine">Toddler routine</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="new-task-parent" className="sr-only">
                Assigned parent
              </label>
              <select
                id="new-task-parent"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value as ParentId | 'both')}
                className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm text-[#101012] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="claire">Claire</option>
                <option value="david">David</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="lg:col-span-2 flex gap-2">
              <label htmlFor="new-task-time" className="sr-only">
                Due time
              </label>
              <input
                id="new-task-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-24 rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-2 py-2 text-xs font-mono text-[#101012] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="submit"
                aria-label="Add task"
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg suno-gradient text-xs font-semibold text-white transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>

        {/* Filter Tabs */}
        <div
          role="group"
          aria-label="Task filter"
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-stone-100 dark:bg-[#101012] border border-stone-200/80 dark:border-white/10"
        >
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'bag', label: 'Handover bag' },
              { id: 'health', label: 'Health & meds' },
              { id: 'routine', label: 'Toddler routine' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-white dark:bg-[#232329] text-[#101012] dark:text-[#F7F4EF] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-[#101012] dark:hover:text-[#F7F4EF]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="py-10 text-center text-sm text-stone-500 dark:text-stone-400">
            No tasks in this category.
          </div>
        ) : (
          <div className="divide-y divide-stone-200/80 dark:divide-white/10">
            <AnimatePresence initial={false}>
              {filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.16 }}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className="flex items-start gap-3 text-left flex-1 min-w-0 group"
                  >
                    <span
                      className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                        task.completed
                          ? 'suno-gradient border-transparent text-white'
                          : 'border-stone-300 dark:border-white/25 group-hover:border-rose-500'
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-medium ${
                          task.completed
                            ? 'line-through text-stone-400 dark:text-stone-500'
                            : 'text-[#101012] dark:text-[#F7F4EF]'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {GROUP_LABELS[task.group]} ·{' '}
                        {task.assignedTo === 'both'
                          ? 'Claire & David'
                          : PARENTS[task.assignedTo].name}
                        {task.dueTime ? ` · by ${task.dueTime}` : ''}
                        {task.completed && task.completedBy
                          ? ` · checked by ${PARENTS[task.completedBy].name}`
                          : ''}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    aria-label={`Delete task: ${task.title}`}
                    className="p-2 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
};
