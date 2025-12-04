// src/types/index.ts

export type AppView = 'all' | 'calendar' | 'tasks';

export interface SyncMeta {
  googleId?: string;
  etag?: string;
  updatedAt: string; // ISO String
  deleted: boolean; // Soft delete pour la synchro
  syncedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO String
  end: string; // ISO String
  allDay: boolean;
  color?: string;
  meta: SyncMeta;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string; // ISO String
  meta: SyncMeta;
}

export interface AppSettings {
  view: AppView;
  googleToken?: string;
  googleRefreshToken?: string;
  lastSync?: string;
}

export interface LocalDatabase {
  events: CalendarEvent[];
  tasks: Task[];
  settings: AppSettings;
}