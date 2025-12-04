// src/services/syncManager.ts
import { fetch } from '@tauri-apps/plugin-http'; // Fetch qui contourne CORS
import { useAppStore } from '../store';
import { StorageService } from './storage';

// NOTE: Pour un vrai OAuth device flow, il faut plus de code.
// Ici, je mets la structure logique pure décrite dans ta demande.

const GOOGLE_API_BASE = "https://www.googleapis.com";

export const SyncManager = {
    
    // --- API WRAPPERS ---
    async getGoogleTasks(token: string) {
        const res = await fetch(`${GOOGLE_API_BASE}/tasks/v1/lists/@default/tasks?showDeleted=true&showHidden=true`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.json();
    },

    async pushGoogleTask(token: string, task: any, method: 'POST' | 'PUT' | 'DELETE', googleId?: string) {
        const url = googleId 
            ? `${GOOGLE_API_BASE}/tasks/v1/lists/@default/tasks/${googleId}`
            : `${GOOGLE_API_BASE}/tasks/v1/lists/@default/tasks`;
            
        await fetch(url, {
            method,
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: method !== 'DELETE' ? JSON.stringify(task) : undefined
        });
    },

    // --- LOGIC CORE (L'algo demandé) ---
    async runSync() {
        const store = useAppStore.getState();
        const token = store.settings.googleToken; // Supposons qu'on l'a récupéré via Login
        
        if (!token) {
            console.error("Pas de token Google");
            return;
        }

        console.log("Début Synchro...");

        // 1. Get Google Data
        const googleData = await this.getGoogleTasks(token);
        const googleTasks = googleData.items || [];
        const localTasks = store.tasks;

        const newLocalTasks = [...localTasks];

        // 2. Traitement Scénario : Google existe
        for (const gTask of googleTasks) {
            const localMatchIndex = newLocalTasks.findIndex(l => l.meta.googleId === gTask.id);
            const localMatch = newLocalTasks[localMatchIndex];

            if (localMatch) {
                // CONFLIT : On compare les dates de maj
                const localDate = new Date(localMatch.meta.updatedAt).getTime();
                const googleDate = new Date(gTask.updated).getTime();

                if (localDate > googleDate) {
                    // Local gagne -> PUT Google
                    console.log(`Update Google : ${localMatch.title}`);
                    await this.pushGoogleTask(token, { title: localMatch.title, status: localMatch.status }, 'PUT', gTask.id);
                } else {
                    // Google gagne -> Update Local
                    console.log(`Update Local from Google : ${gTask.title}`);
                    newLocalTasks[localMatchIndex] = {
                        ...localMatch,
                        title: gTask.title,
                        status: gTask.status,
                        meta: { ...localMatch.meta, etag: gTask.etag, updatedAt: gTask.updated }
                    };
                }
            } else {
                // Existe Google, pas Local
                // Si supprimé localement (flag deleted), on delete Google
                // Sinon on crée en local
                 console.log(`Création locale depuis Google : ${gTask.title}`);
                 // ... Ajouter logique d'ajout ...
            }
        }

        // 3. Traitement Scénario : Local Only (Nouveaux items)
        for (const lTask of localTasks) {
            if (!lTask.meta.googleId && !lTask.meta.deleted) {
                // Nouveau -> POST Google
                console.log(`Envoi vers Google : ${lTask.title}`);
                // const res = await POST...
                // Mettre à jour l'ID local avec le retour Google
            }
            
            if (lTask.meta.deleted && lTask.meta.googleId) {
                // Supprimé localement -> DELETE Google
                console.log(`Suppression Google : ${lTask.title}`);
                await this.pushGoogleTask(token, null, 'DELETE', lTask.meta.googleId);
            }
        }

        // 4. Sauvegarde finale
        useAppStore.setState({ tasks: newLocalTasks });
        StorageService.save(useAppStore.getState());
        console.log("Synchro terminée.");
    }
};