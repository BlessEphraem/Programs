// src/store.ts
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { LocalDatabase, CalendarEvent, Task, AppView } from './types';
import { StorageService } from './services/storage';

interface AppState extends LocalDatabase {
  isLoading: boolean;
  initApp: () => Promise<void>;
  
  // Actions UI
  setView: (view: AppView) => void;
  
  // Actions Data
  addEvent: (evt: Omit<CalendarEvent, 'id' | 'meta'>) => void;
  updateEvent: (evt: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  
  addTask: (tsk: Omit<Task, 'id' | 'meta'>) => void;
  toggleTask: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  events: [],
  tasks: [],
  settings: { view: 'all' },
  isLoading: true,

  initApp: async () => {
    await StorageService.init();
    const data = await StorageService.load();
    set({ ...data, isLoading: false });
  },

  setView: (view) => {
    set((state) => {
      const newSettings = { ...state.settings, view };
      StorageService.save({ ...state, settings: newSettings }); // Auto-save
      return { settings: newSettings };
    });
  },

  addEvent: (evt) => {
    set((state) => {
      const newEvent: CalendarEvent = {
        ...evt,
        id: uuidv4(),
        meta: { updatedAt: new Date().toISOString(), deleted: false }
      };
      const newEvents = [...state.events, newEvent];
      StorageService.save({ ...state, events: newEvents });
      return { events: newEvents };
    });
  },

  updateEvent: (evt) => {
    set((state) => {
        const newEvents = state.events.map(e => e.id === evt.id ? {...evt, meta: {...e.meta, updatedAt: new Date().toISOString()}} : e);
        StorageService.save({ ...state, events: newEvents });
        return { events: newEvents };
    })
  },

  deleteEvent: (id) => {
    set((state) => {
        // Soft delete pour sync google
        const newEvents = state.events.map(e => e.id === id ? { ...e, meta: { ...e.meta, deleted: true, updatedAt: new Date().toISOString() } } : e);
        StorageService.save({ ...state, events: newEvents });
        return { events: newEvents };
    })
  },

  addTask: (tsk) => {
    set((state) => {
      const newTask: Task = {
        ...tsk,
        id: uuidv4(),
        meta: { updatedAt: new Date().toISOString(), deleted: false }
      };
      const newTasks = [...state.tasks, newTask];
      StorageService.save({ ...state, tasks: newTasks });
      return { tasks: newTasks };
    });
  },

  toggleTask: (id) => {
      set((state) => {
          const newTasks = state.tasks.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'needsAction' : 'completed' as 'needsAction'|'completed', meta: { ...t.meta, updatedAt: new Date().toISOString() }} : t);
          StorageService.save({ ...state, tasks: newTasks });
          return { tasks: newTasks };
      })
  }
}));