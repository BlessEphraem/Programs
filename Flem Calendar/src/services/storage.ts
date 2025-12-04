// src/services/storage.ts
import { BaseDirectory, readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { LocalDatabase } from '../types';

const DB_FILENAME = 'flem_db.json';

const DEFAULT_DB: LocalDatabase = {
  events: [],
  tasks: [],
  settings: { view: 'all' }
};

export const StorageService = {
  async init(): Promise<void> {
    // Vérifie si le fichier existe, sinon le crée
    const doesExist = await exists(DB_FILENAME, { baseDir: BaseDirectory.AppLocalData });
    if (!doesExist) {
      await this.save(DEFAULT_DB);
    }
  },

  async load(): Promise<LocalDatabase> {
    try {
      const content = await readTextFile(DB_FILENAME, { baseDir: BaseDirectory.AppLocalData });
      return JSON.parse(content);
    } catch (e) {
      console.error("Erreur lecture DB, retour par défaut", e);
      return DEFAULT_DB;
    }
  },

  async save(data: LocalDatabase): Promise<void> {
    await writeTextFile(DB_FILENAME, JSON.stringify(data, null, 2), { 
      baseDir: BaseDirectory.AppLocalData 
    });
  }
};