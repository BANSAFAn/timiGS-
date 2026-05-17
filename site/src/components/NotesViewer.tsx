import { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import 'highlight.js/styles/atom-one-dark.css';
import { FileText, Calendar } from '@phosphor-icons/react';

interface NoteEntry {
  id: string;
  title: string;
  file: string;
  date: string;
}

export default function NotesViewer({ lang = "en" }: { lang?: string }) {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const notesCache = useRef<Record<string, string>>({});

  useEffect(() => {
    marked.setOptions({
      highlight: function (code: string, lang: string) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    } as any);
  }, []);

  useEffect(() => {
    fetch("/notes.json")
      .then((res) => res.json())
      .then((data) => {
        setNotes(data);
        if (data.length > 0) {
          setActiveNote(data[0].id);
        }
      })
      .catch((err) => console.error("Failed to load notes config", err));
  }, []);

  useEffect(() => {
    if (!activeNote) return;
    
    const note = notes.find(n => n.id === activeNote);
    if (!note) return;

    if (notesCache.current[activeNote]) {
      setContent(notesCache.current[activeNote]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/Note-md-store/${note.file}`)
      .then((res) => res.text())
      .then((md) => {
        const html = marked.parse(md) as string;
        notesCache.current[activeNote] = html;
        setContent(html);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load note", err);
        setLoading(false);
      });
  }, [activeNote, notes]);

  return (
    <div className="max-w-5xl mx-auto py-12">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-sm font-semibold mb-6">
          <FileText className="w-4 h-4" />
          Release Notes
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Release Notes
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Detailed changelog and update information
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <nav className="space-y-2">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setActiveNote(note.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-all ${
                    activeNote === note.id
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="font-medium mb-1">{note.title}</div>
                  <div className="flex items-center gap-1.5 text-xs opacity-70">
                    <Calendar className="w-3 h-3" />
                    {note.date}
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          ) : (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
