// src/App.tsx
import { useEffect, useState } from "react";
import { useAppStore } from "./store";
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import fr from 'date-fns/locale/fr';
import "react-big-calendar/lib/css/react-big-calendar.css";

// Configuration Calendrier
const locales = { 'fr': fr };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

function App() {
  const { initApp, isLoading, settings, setView, events, tasks, addEvent, addTask, toggleTask, deleteEvent } = useAppStore();
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => {
    initApp();
  }, []);

  if (isLoading) return <div>Chargement de Flem Calendar...</div>;

  // Filtrer les items supprimés (soft delete)
  const visibleEvents = events.filter(e => !e.meta.deleted).map(e => ({
    ...e,
    start: new Date(e.start),
    end: new Date(e.end)
  }));
  
  const visibleTasks = tasks.filter(t => !t.meta.deleted);

  // Handlers simples
  const handleAddEvent = () => {
    if(!newEventTitle) return;
    addEvent({
        title: newEventTitle,
        start: new Date().toISOString(),
        end: new Date(new Date().getTime() + 60*60*1000).toISOString(), // +1h
        allDay: false
    });
    setNewEventTitle("");
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newTaskTitle) return;
    addTask({ title: newTaskTitle, status: 'needsAction' });
    setNewTaskTitle("");
  };

  return (
    <div className="main-layout">
      {/* --- TOP BAR --- */}
      <div className="top-bar">
        <h3>Flem Calendar</h3>
        <div className="view-switcher">
            <button onClick={() => setView('calendar')} disabled={settings.view === 'calendar'}>Calendrier</button>
            <button onClick={() => setView('tasks')} disabled={settings.view === 'tasks'}>Tâches</button>
            <button onClick={() => setView('all')} disabled={settings.view === 'all'}>Split View</button>
        </div>
        <button onClick={() => alert("Sync déclenchée (voir Phase 6)")}>🔄 Sync</button>
      </div>

      {/* --- CONTENT --- */}
      <div className="content-area">
        
        {/* Panneau CALENDRIER */}
        <div className={`panel calendar ${settings.view === 'tasks' ? 'hidden' : ''}`} style={{ flex: settings.view === 'all' ? 2 : 1 }}>
            <div style={{marginBottom: 10, display: 'flex', gap: 10}}>
                <input 
                    value={newEventTitle} 
                    onChange={e => setNewEventTitle(e.target.value)} 
                    placeholder="Titre événement rapide..." 
                    style={{flex:1}}
                />
                <button onClick={handleAddEvent}>Ajouter Event</button>
            </div>
            
            <Calendar
                localizer={localizer}
                events={visibleEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '80vh' }}
                onSelectEvent={(e) => {
                    if(confirm(`Supprimer ${e.title} ?`)) deleteEvent(e.id);
                }}
            />
        </div>

        {/* Panneau TACHES */}
        <div className={`panel tasks ${settings.view === 'calendar' ? 'hidden' : ''}`}>
            <h2>Tâches</h2>
            <form onSubmit={handleAddTask} style={{display:'flex', gap: 5, marginBottom: 20}}>
                <input 
                    value={newTaskTitle} 
                    onChange={e => setNewTaskTitle(e.target.value)} 
                    placeholder="Nouvelle tâche..."
                    style={{flex: 1}}
                />
                <button type="submit">+</button>
            </form>

            <ul style={{listStyle: 'none', padding: 0}}>
                {visibleTasks.map(task => (
                    <li key={task.id} style={{
                        display:'flex', 
                        alignItems:'center', 
                        padding: '8px', 
                        borderBottom:'1px solid #eee',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        opacity: task.status === 'completed' ? 0.6 : 1
                    }}>
                        <input 
                            type="checkbox" 
                            checked={task.status === 'completed'} 
                            onChange={() => toggleTask(task.id)}
                            style={{marginRight: 10}}
                        />
                        <span>{task.title}</span>
                    </li>
                ))}
            </ul>
        </div>

      </div>
    </div>
  );
}

export default App;