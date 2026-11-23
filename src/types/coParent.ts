export type ParentId = 'claire' | 'david';

export type NavTab = 'overview' | 'calendar' | 'health' | 'tasks' | 'analytics';

export type EventCategory = 'custody' | 'pediatric' | 'preschool' | 'handover' | 'activity';

export interface ParentProfile {
  id: ParentId;
  name: string;
  fullName: string;
  roleLabel: string;
  avatarUrl: string;
  phone: string;
  iphoneSyncedAt: string;
  accentColor: 'rose' | 'amber';
}

export interface ChildProfile {
  name: string;
  ageYears: number;
  birthDate: string;
  bloodType: string;
  weightLbs: number;
  allergies: string[];
  pediatrician: string;
  clinic: string;
  preschool: string;
  avatarUrl: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: EventCategory;
  assignedParent: ParentId | 'both';
  location?: string;
  notes?: string;
  reminderMinutes?: number;
  syncedToICal: boolean;
}

export interface SwapRequest {
  id: string;
  date: string; // YYYY-MM-DD
  fromParent: ParentId;
  toParent: ParentId;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

export interface DoseLog {
  id: string;
  medicationId: string;
  givenAt: string; // ISO string
  givenBy: ParentId;
  note?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  intervalHours: number;
  purpose: string;
  instructions: string;
  active: boolean;
  lastGivenAt: string; // ISO string
  lastGivenBy: ParentId;
  dosesCompleted: number;
  totalCourseDoses: number;
}

export interface TemperatureReading {
  id: string;
  recordedAt: string; // ISO string
  fahrenheit: number;
  recordedBy: ParentId;
  symptoms: string;
}

export interface PediatricVisit {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  doctor: string;
  clinic: string;
  reason: string;
  status: 'upcoming' | 'completed';
  attendingParent: ParentId | 'both';
  recommendations: string;
  prescriptions?: string[];
}

export interface HandoverTask {
  id: string;
  title: string;
  group: 'bag' | 'routine' | 'health';
  assignedTo: ParentId | 'both';
  dueTime?: string;
  completed: boolean;
  completedBy?: ParentId;
}

export interface ExpenseItem {
  id: string;
  title: string;
  category: 'pediatric' | 'medication' | 'preschool' | 'clothing';
  amountUsd: number;
  paidBy: ParentId;
  date: string; // YYYY-MM-DD
  splitRatio: number; // 0.5 means 50/50
}

export interface MonthlyHealthStat {
  month: string;
  healthyDays: number;
  sickDays: number;
  pediatricVisits: number;
}
