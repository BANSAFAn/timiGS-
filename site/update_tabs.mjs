import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DocsViewer
const docsPath = path.join(__dirname, 'src', 'components', 'DocsViewer.tsx');
let docs = fs.readFileSync(docsPath, 'utf8');

// Add Phosphor imports and update sectionIcons
docs = docs.replace(/import 'highlight\.js\/styles\/atom-one-dark\.css';/, 
`import 'highlight.js/styles/atom-one-dark.css';\nimport { BookOpen, DownloadSimple, Sparkle, CloudSun, Gear, GithubLogo, DockerLogo, FileText } from "@phosphor-icons/react";`);

docs = docs.replace(/const sectionIcons: Record<string, string> = \{[\s\S]*?\};/, 
`const sectionIcons: Record<string, React.ReactNode> = {
  intro: <BookOpen weight="duotone" />,
  installation: <DownloadSimple weight="duotone" />,
  features: <Sparkle weight="duotone" />,
  weather: <CloudSun weight="duotone" />,
  settings: <Gear weight="duotone" />,
  "github-api": <GithubLogo weight="duotone" />,
  docker: <DockerLogo weight="duotone" />
};`);

// Remove fallback emoji in JSX
docs = docs.replace(/sectionIcons\[section\.id\] \|\| "📄"/g, `sectionIcons[section.id] || <FileText weight="duotone" />`);

// Update renderer alerts to use SVGs instead of emojis
docs = docs.replace(/icon: "ℹ️"/g, `icon: "<svg viewBox='0 0 24 24' width='16' height='16' stroke='currentColor' stroke-width='2' fill='none'><circle cx='12' cy='12' r='10'></circle><line x1='12' y1='16' x2='12' y2='12'></line><line x1='12' y1='8' x2='12.01' y2='8'></line></svg>"`);
docs = docs.replace(/icon: "💡"/g, `icon: "<svg viewBox='0 0 24 24' width='16' height='16' stroke='currentColor' stroke-width='2' fill='none'><circle cx='12' cy='12' r='10'></circle><path d='M12 16v-4'></path><path d='M12 8h.01'></path></svg>"`); // Tip
docs = docs.replace(/icon: "💜"/g, `icon: "<svg viewBox='0 0 24 24' width='16' height='16' stroke='currentColor' stroke-width='2' fill='none'><circle cx='12' cy='12' r='10'></circle><path d='M12 16v-4'></path><path d='M12 8h.01'></path></svg>"`); // Important
docs = docs.replace(/icon: "⚠️"/g, `icon: "<svg viewBox='0 0 24 24' width='16' height='16' stroke='currentColor' stroke-width='2' fill='none'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'></path><line x1='12' y1='9' x2='12' y2='13'></line><line x1='12' y1='17' x2='12.01' y2='17'></line></svg>"`); // Warning
docs = docs.replace(/icon: "🛑"/g, `icon: "<svg viewBox='0 0 24 24' width='16' height='16' stroke='currentColor' stroke-width='2' fill='none'><circle cx='12' cy='12' r='10'></circle><line x1='15' y1='9' x2='9' y2='15'></line><line x1='9' y1='9' x2='15' y2='15'></line></svg>"`); // Error

// Add Caching to DocsViewer
docs = docs.replace(/const \[mobileMenuOpen, setMobileMenuOpen\] = useState\(false\);/, 
`const [mobileMenuOpen, setMobileMenuOpen] = useState(false);\n  const docsCache = useRef<Record<string, { html: string, toc: TocItem[] }>>({});`);

docs = docs.replace(/setLoading\(true\);\n\s*setReadProgress\(0\);\n\s*fetch\(\`\/docx\/\$\{section\.file\}\`\)/, 
`if (docsCache.current[activeDoc]) {
      setContent(docsCache.current[activeDoc].html);
      setToc(docsCache.current[activeDoc].toc);
      setLoading(false);
      setReadProgress(0);
      return;
    }

    setLoading(true);
    setReadProgress(0);
    fetch(\`/docx/\${section.file}\`)`);

docs = docs.replace(/setToc\(tocItems\);\n\s*\}\)/, 
`setToc(tocItems);
        docsCache.current[activeDoc] = { html: html as string, toc: tocItems };
      })`);


// NotesViewer
const notesPath = path.join(__dirname, 'src', 'components', 'NotesViewer.tsx');
let notes = fs.readFileSync(notesPath, 'utf8');

// Update NotesViewer emojis
notes = notes.replace(/icon="ℹ️"/g, `icon="<svg viewBox='0 0 24 24' width='14' height='14' stroke='currentColor' stroke-width='2' fill='none' style='display:inline;'><circle cx='12' cy='12' r='10'></circle><line x1='12' y1='16' x2='12' y2='12'></line><line x1='12' y1='8' x2='12.01' y2='8'></line></svg>"`);
notes = notes.replace(/icon="💡"/g, `icon="<svg viewBox='0 0 24 24' width='14' height='14' stroke='currentColor' stroke-width='2' fill='none' style='display:inline;'><path d='M12 16v-4'></path><path d='M12 8h.01'></path></svg>"`);
notes = notes.replace(/icon="💜"/g, `icon="<svg viewBox='0 0 24 24' width='14' height='14' stroke='currentColor' stroke-width='2' fill='none' style='display:inline;'><circle cx='12' cy='12' r='10'></circle><path d='M12 16v-4'></path><path d='M12 8h.01'></path></svg>"`);
notes = notes.replace(/icon="⚠️"/g, `icon="<svg viewBox='0 0 24 24' width='14' height='14' stroke='currentColor' stroke-width='2' fill='none' style='display:inline;'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'></path><line x1='12' y1='9' x2='12' y2='13'></line><line x1='12' y1='17' x2='12.01' y2='17'></line></svg>"`);
notes = notes.replace(/icon="🛑"/g, `icon="<svg viewBox='0 0 24 24' width='14' height='14' stroke='currentColor' stroke-width='2' fill='none' style='display:inline;'><circle cx='12' cy='12' r='10'></circle><line x1='15' y1='9' x2='9' y2='15'></line><line x1='9' y1='9' x2='15' y2='15'></line></svg>"`);

// Add Caching to NotesViewer
notes = notes.replace(/const contentRef = useRef<HTMLDivElement>\(null\);/, 
`const contentRef = useRef<HTMLDivElement>(null);\n  const notesCache = useRef<Record<string, string>>({});`);

notes = notes.replace(/setLoading\(true\);\n\s*fetch\(\`\/Note-md-store\/\$\{note\.file\}\`\)/, 
`if (notesCache.current[activeNote]) {
      setContent(notesCache.current[activeNote]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    fetch(\`/Note-md-store/\${note.file}\`)`);

notes = notes.replace(/setContent\(html as string\); \n\s*setLoading\(false\);/, 
`setContent(html as string); 
        notesCache.current[activeNote] = html as string;
        setLoading(false);`);

fs.writeFileSync(docsPath, docs, 'utf8');
fs.writeFileSync(notesPath, notes, 'utf8');

console.log("Updated DocsViewer and NotesViewer with cache and SVG icons.");
