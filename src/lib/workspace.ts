export type WorkspaceView = 'home' | 'chats' | 'projects' | 'settings';
export type SourceType = 'note' | 'web' | 'pdf' | 'conversation';
export interface SourceItem { id: string; title: string; type: SourceType; content: string; url?: string; date: string; origin?: string; snippet?: string }
export interface ProjectSpace { id: string; title: string; description: string; instructions: string; sources: SourceItem[]; accent?: 'blue' | 'green' | 'purple'; createdAt?: string }
export interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; error?: string; createdAt: string }
export interface ChatThread { id: string; title: string; projectId: string | null; messages: ChatMessage[]; updatedAt: string }
export interface WorkspaceData { projects: ProjectSpace[]; chats: ChatThread[]; activeProjectId: string | null }

export const WORKSPACE_KEY = 'junie_workspace_v1';
export const createId = () => crypto.randomUUID();
export const julieProject = (): ProjectSpace => ({ id: 'julie', title: 'Julie', description: 'Alle gesprekken, documenten en context op één plek.', instructions: 'Gebruik uitsluitend de toegevoegde informatie over Julie. Houd feiten, interpretaties en onzekerheden uit elkaar. Verzin geen dossier of gebeurtenissen. Analyseer een toegevoegd bericht direct en houd rekening met de aanwezige projectcontext.', sources: [], accent: 'purple', createdAt: new Date().toISOString() });

export function loadWorkspace(): WorkspaceData {
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as WorkspaceData;
      if (Array.isArray(saved.projects) && Array.isArray(saved.chats)) return saved;
    }
  } catch { /* Keep malformed input untouched; start a usable workspace. */ }
  let projects: ProjectSpace[] = [];
  try {
    const legacy = JSON.parse(localStorage.getItem('nexus_studio_projects') || '[]');
    if (Array.isArray(legacy)) projects = legacy.filter(p => p && typeof p.id === 'string' && typeof p.title === 'string').map(p => ({ ...p, description: p.description || 'Gesprekken en bronnen bij elkaar.', sources: Array.isArray(p.sources) ? p.sources : [] }));
  } catch { /* No destructive migration of the original project storage. */ }
  const julie = projects.find(p => /\bjulie\b/i.test(p.title));
  if (!julie) projects.unshift(julieProject());
  return { projects, chats: [], activeProjectId: julie?.id || 'julie' };
}

export function projectContext(project: ProjectSpace | null, chats: ChatThread[], currentChatId: string): string {
  if (!project) return '';
  const sources = project.sources.map(s => `[Bron: ${s.title}${s.url ? ` | ${s.url}` : ''}]\n${s.content}`).join('\n\n');
  const previous = chats.filter(c => c.projectId === project.id && c.id !== currentChatId).slice(0, 5).map(c => `[Eerder gesprek: ${c.title}]\n${c.messages.filter(m => !m.error && m.content).map(m => `${m.role}: ${m.content}`).join('\n')}`).join('\n\n');
  return `Project: ${project.title}\nInstructies: ${project.instructions}\n\nBronnen:\n${sources.slice(0, 18000)}\n\nEerdere gesprekken in dit project:\n${previous.slice(0, 12000)}`;
}
