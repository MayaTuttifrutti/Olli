import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCustodyBalance,
  calculateExpenseSettlement,
  calculateTaskProgress,
  getMedicationTimingStatus,
} from './coParentLogic';
import { generateIcsFeed, generateSingleVisitIcs } from './icsGenerator';
import { CalendarEvent, ExpenseItem, HandoverTask, Medication, PediatricVisit } from '../types/coParent';

test('calculateCustodyBalance computes split days and percentages accurately', () => {
  const map: Record<string, 'claire' | 'david'> = {
    '2026-11-01': 'claire',
    '2026-11-02': 'claire',
    '2026-11-03': 'david',
    '2026-11-04': 'david',
    '2026-11-05': 'claire',
  };
  const balance = calculateCustodyBalance(map);
  assert.equal(balance.claireDays, 3);
  assert.equal(balance.davidDays, 2);
  assert.equal(balance.totalDays, 5);
  assert.equal(balance.clairePercent, 60);
  assert.equal(balance.davidPercent, 40);
});

test('getMedicationTimingStatus detects due_now, soon, and scheduled states', () => {
  const baseMed: Medication = {
    id: 'm1',
    name: 'Amoxicillin',
    dosage: '4.5 ml',
    intervalHours: 8,
    purpose: 'Ear infection',
    instructions: 'After meal',
    active: true,
    lastGivenAt: '2026-11-21T07:00:00',
    lastGivenBy: 'claire',
    dosesCompleted: 4,
    totalCourseDoses: 14,
  };

  const nowDue = new Date('2026-11-21T15:15:00');
  const statusDue = getMedicationTimingStatus(baseMed, nowDue);
  assert.equal(statusDue.status, 'due_now');
  assert.equal(statusDue.minutesRemaining, -15);

  const nowSoon = new Date('2026-11-21T14:30:00');
  const statusSoon = getMedicationTimingStatus(baseMed, nowSoon);
  assert.equal(statusSoon.status, 'soon');
  assert.equal(statusSoon.minutesRemaining, 30);

  const nowSched = new Date('2026-11-21T11:00:00');
  const statusSched = getMedicationTimingStatus(baseMed, nowSched);
  assert.equal(statusSched.status, 'scheduled');
  assert.equal(statusSched.minutesRemaining, 240);
});

test('calculateExpenseSettlement computes 50/50 debt accurately', () => {
  const expenses: ExpenseItem[] = [
    {
      id: 'e1',
      title: 'Pediatric urgent visit',
      category: 'pediatric',
      amountUsd: 160,
      paidBy: 'claire',
      date: '2026-11-18',
      splitRatio: 0.5,
    },
    {
      id: 'e2',
      title: 'Antibiotic & probiotic',
      category: 'medication',
      amountUsd: 60,
      paidBy: 'david',
      date: '2026-11-19',
      splitRatio: 0.5,
    },
  ];
  const settlement = calculateExpenseSettlement(expenses);
  assert.equal(settlement.totalUsd, 220);
  assert.equal(settlement.clairePaidUsd, 160);
  assert.equal(settlement.davidPaidUsd, 60);
  assert.equal(settlement.owesParent, 'david');
  assert.equal(settlement.owedToParent, 'claire');
  assert.equal(settlement.settlementAmountUsd, 50);
});

test('calculateTaskProgress computes completion rate', () => {
  const tasks: HandoverTask[] = [
    { id: '1', title: 'Plush bunny', group: 'bag', assignedTo: 'both', completed: true },
    { id: '2', title: 'Immunization card', group: 'bag', assignedTo: 'claire', completed: false },
  ];
  const progress = calculateTaskProgress(tasks);
  assert.equal(progress.completed, 1);
  assert.equal(progress.total, 2);
  assert.equal(progress.percent, 50);
});

test('generateIcsFeed outputs valid RFC 5545 structure with VALARM and parent filtering', () => {
  const events: CalendarEvent[] = [
    {
      id: 'ev-1',
      title: 'Noah Handover, Oak Park',
      date: '2026-11-21',
      startTime: '17:30',
      endTime: '18:00',
      category: 'handover',
      assignedParent: 'both',
      location: 'Sunnybrook Preschool',
      notes: 'Pack inhaler',
      reminderMinutes: 30,
      syncedToICal: true,
    },
    {
      id: 'ev-2',
      title: 'Swim lesson with David',
      date: '2026-11-22',
      startTime: '10:00',
      endTime: '11:00',
      category: 'activity',
      assignedParent: 'david',
      syncedToICal: true,
    },
  ];

  const visits: PediatricVisit[] = [
    {
      id: 'v-1',
      date: '2026-11-24',
      time: '11:15',
      doctor: 'Dr. Hannah Brooks',
      clinic: 'Oakwood Pediatrics',
      reason: 'Ear infection follow-up',
      status: 'upcoming',
      attendingParent: 'claire',
      recommendations: 'Bring immunization card',
    },
  ];

  const fullIcs = generateIcsFeed(events, visits, {
    calendarName: 'Olli — Noah',
    filterParent: 'all',
  });

  assert.ok(fullIcs.includes('BEGIN:VCALENDAR'));
  assert.ok(fullIcs.includes('VERSION:2.0'));
  assert.ok(fullIcs.includes('SUMMARY:Noah Handover\\, Oak Park'));
  assert.ok(fullIcs.includes('BEGIN:VALARM'));
  assert.ok(fullIcs.includes('TRIGGER:-PT30M'));
  assert.ok(fullIcs.includes('Pediatrician: Ear infection follow-up'));
  assert.ok(fullIcs.includes('END:VCALENDAR'));

  const claireOnlyIcs = generateIcsFeed(events, visits, {
    calendarName: 'Olli — Claire',
    filterParent: 'claire',
  });
  assert.ok(!claireOnlyIcs.includes('Swim lesson with David'));
  assert.ok(claireOnlyIcs.includes('Ear infection follow-up'));

  const singleVisit = generateSingleVisitIcs(visits[0]);
  assert.ok(singleVisit.includes('SUMMARY:Pediatrician: Ear infection follow-up'));
});
