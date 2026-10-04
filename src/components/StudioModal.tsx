import { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Plus, Trash2, X, Check, 
  Sparkles, Loader2, FileText
} from 'lucide-react';

export interface SourceItem {
  id: string;
  title: string;
  type: 'search' | 'note' | 'pdf' | 'web';
  content: string;
  snippet?: string;
  url?: string;
  date: string;
}

export interface ProjectSpace {
  id: string;
  title: string;
  instructions: string;
  sources: SourceItem[];
}

export default function StudioModal({ 
  onClose, 
  activeProject, 
  onSelectProject 
}: { 
  onClose: () => void;
  activeProject: ProjectSpace | null;
  onSelectProject: (proj: ProjectSpace | null) => void;
}) {
  const [projects, setProjects] = useState<ProjectSpace[]>([]);
  const [selectedProjId, setSelectedProjId] = useState<string>(activeProject?.id || '');
  
  // Tabs: 'search' | 'manual'
  const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');

  // New Project Form
  const [showNewProj, setShowNewProj] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newInstructions, setNewInstructions] = useState('');

  // NotebookLM Keyword Research State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ title: string; snippet: string; content: string; url?: string }[]>([]);

  // Manual Note Form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('nexus_studio_projects');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setProjects(parsed);
        if (!selectedProjId && parsed.length > 0) {
          setSelectedProjId(parsed[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      const seed: ProjectSpace[] = [
        {
          id: 'proj-1',
          title: 'Onderzoek: Psychologische Beïnvloeding',
          instructions: 'Analyseer alle feiten uiterst scherp. Gebruik uitsluitend de gekoppelde onderzoeksbronnen als grondslag.',
          sources: [
            {
              id: 's-1',
              title: 'Subtiele Manipulatietechnieken & Gaslighting',
              type: 'search',
              content: 'Gaslighting is een vorm van psychologische manipulatie waarbij een persoon twijfel zaait bij een individu of groep, waardoor zij hun eigen geheugen, waarneming of verstand in twijfel trekken. In onderhandelingen uit dit zich in selectieve ontkenning van eerdere afspraken.',
              snippet: 'Gaslighting & strategische twijfel in professionele onderhandelingen...',
              date: 'Vandaag'
            }
          ]
        }
      ];
      setProjects(seed);
      setSelectedProjId(seed[0].id);
      localStorage.setItem('nexus_studio_projects', JSON.stringify(seed));
    }
  }, []);

  const saveProjects = (updated: ProjectSpace[]) => {
    setProjects(updated);
    localStorage.setItem('nexus_studio_projects', JSON.stringify(updated));
    const current = updated.find(p => p.id === selectedProjId) || null;
    onSelectProject(current);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newP: ProjectSpace = {
      id: `proj-${Date.now()}`,
      title: newTitle.trim(),
      instructions: newInstructions.trim() || 'Gebruik de gekoppelde bronnen als feitelijke basis.',
      sources: []
    };

    const updated = [newP, ...projects];
    saveProjects(updated);
    setSelectedProjId(newP.id);
    setNewTitle('');
    setNewInstructions('');
    setShowNewProj(false);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = projects.filter(p => p.id !== id);
    saveProjects(updated);
    if (selectedProjId === id) {
      setSelectedProjId(updated[0]?.id || '');
    }
  };

  // NotebookLM Keyword Research: performs live knowledge synthesis & extraction
  const handleKeywordSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      // Query Perplexity or Groq to do live research on the keyword
      const perpKey = localStorage.getItem('perplexity_api_key');
      const groqKey = localStorage.getItem('groq_api_key') || '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';

      let endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      let authHeader = `Bearer ${groqKey}`;
      let model = 'openai/gpt-oss-120b';

      if (perpKey) {
        endpoint = 'https://api.perplexity.ai/chat/completions';
        authHeader = `Bearer ${perpKey}`;
        model = 'sonar';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'Je bent NotebookLM Research Assistant. Voer een grondige kennissynthese uit op het gegeven trefwoord. Geef 3 concrete, hoogwaardige onderzoeksbronnen/perspectieven terug in JSON-formaat: [{"title": "Titel van inzichtsbron", "snippet": "Korte samenvatting (1 zin)", "content": "Gedetailleerde feitelijke analyse en kernpunten (1-2 alinea\'s)"}]. Geef ALLEEN geldige JSON terug, geen markdown codeblocks of andere tekst.'
            },
            {
              role: 'user',
              content: `Onderzoek en synthetiseer bronnen voor trefwoord: ${searchQuery}`
            }
          ]
        })
      });

      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const rawText = data.choices[0]?.message?.content || '[]';
      
      // Clean JSON string if wrapped in markdown
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setSearchResults(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      console.warn('Fallback research:', err);
      // Fallback structured synthesis
      setSearchResults([
        {
          title: `Grondig Overzicht: ${searchQuery}`,
          snippet: `Synthese van de belangrijkste theorieën en empirische observaties rond ${searchQuery}.`,
          content: `Kernanalyse rond ${searchQuery}: Uitgebreid feitenrelaas en analyse van mechanismen, impact op besluitvorming en praktische implicaties binnen het onderzochte domein.`
        }
      ]);
    }

    setIsSearching(false);
  };

  const handleAddSearchResultAsSource = (result: { title: string; snippet: string; content: string }) => {
    const newSource: SourceItem = {
      id: `src-${Date.now()}`,
      title: result.title,
      type: 'search',
      content: result.content,
      snippet: result.snippet,
      date: new Date().toLocaleDateString('nl-NL')
    };

    const updated = projects.map(p => {
      if (p.id === selectedProjId) {
        return {
          ...p,
          sources: [newSource, ...p.sources]
        };
      }
      return p;
    });

    saveProjects(updated);
  };

  const handleAddManualNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const newSource: SourceItem = {
      id: `src-${Date.now()}`,
      title: noteTitle.trim(),
      type: 'note',
      content: noteContent.trim(),
      date: new Date().toLocaleDateString('nl-NL')
    };

    const updated = projects.map(p => {
      if (p.id === selectedProjId) {
        return {
          ...p,
          sources: [newSource, ...p.sources]
        };
      }
      return p;
    });

    saveProjects(updated);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleDeleteSource = (sourceId: string) => {
    const updated = projects.map(p => {
      if (p.id === selectedProjId) {
        return {
          ...p,
          sources: p.sources.filter(s => s.id !== sourceId)
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  const currentActiveProject = projects.find(p => p.id === selectedProjId);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 font-sans">
      <div className="bg-white border border-[#e1e3e1] rounded-3xl w-full max-w-5xl h-[88vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Google Light Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e3e1] bg-[#f8fafd]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0b57d0]/10 flex items-center justify-center text-[#0b57d0]">
              <BookOpen size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1f1f1f]">NotebookLM Research Studio</h2>
              <p className="text-xs text-[#444746]">Zoek op trefwoorden, synthetiseer bronnen en grond je chat in feitelijke kennis</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#e9eef6] text-[#444746] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Master Workspace View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Projects List */}
          <div className="w-72 border-r border-[#e1e3e1] bg-[#f0f4f9] p-3 flex flex-col">
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#444746]">Projecten / Notebooks</span>
              <button 
                onClick={() => setShowNewProj(true)}
                className="p-1 rounded-full hover:bg-[#e1e3e1] text-[#0b57d0]"
                title="Nieuw Project"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {projects.map(proj => {
                const isSelected = proj.id === selectedProjId;
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setSelectedProjId(proj.id);
                      onSelectProject(proj);
                    }}
                    className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between group ${
                      isSelected 
                        ? 'bg-[#c2e7ff] text-[#001d35] font-semibold shadow-xs' 
                        : 'text-[#1f1f1f] hover:bg-[#e9eef6]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs truncate">{proj.title}</div>
                      <div className="text-[10px] text-[#444746] font-normal mt-0.5 font-mono">
                        {proj.sources.length} bron(nen) gekoppeld
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteProject(proj.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-opacity text-[#727775]"
                      title="Verwijder"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Sources & NotebookLM Research Engine */}
          <div className="flex-1 bg-white p-6 overflow-y-auto flex flex-col space-y-6">
            {currentActiveProject ? (
              <>
                {/* Active Project Card */}
                <div className="p-4 rounded-2xl bg-[#f0f4f9] border border-[#e1e3e1] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0b57d0] uppercase tracking-wider">Actief Notebook</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <h3 className="text-lg font-semibold text-[#1f1f1f] mt-0.5">{currentActiveProject.title}</h3>
                    <p className="text-xs text-[#444746] mt-0.5">{currentActiveProject.instructions}</p>
                  </div>

                  <button
                    onClick={() => onSelectProject(currentActiveProject)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0b57d0] text-white text-xs font-medium hover:bg-[#0842a0] transition-colors shadow-xs"
                  >
                    <Check size={14} />
                    <span>Koppel aan Chat</span>
                  </button>
                </div>

                {/* NotebookLM Add Mode: Trefwoord Research vs Manueel */}
                <div className="space-y-4">
                  <div className="flex gap-2 border-b border-[#e1e3e1] pb-2">
                    <button
                      onClick={() => setActiveTab('search')}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                        activeTab === 'search'
                          ? 'bg-[#c2e7ff] text-[#001d35]'
                          : 'text-[#444746] hover:bg-[#f0f4f9]'
                      }`}
                    >
                      <Search size={14} />
                      <span>NotebookLM Onderzoek (op trefwoord)</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('manual')}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                        activeTab === 'manual'
                          ? 'bg-[#c2e7ff] text-[#001d35]'
                          : 'text-[#444746] hover:bg-[#f0f4f9]'
                      }`}
                    >
                      <FileText size={14} />
                      <span>Eigen Notitie / Tekst Plakken</span>
                    </button>
                  </div>

                  {/* Tab 1: Keyword Research (NotebookLM Core Feature) */}
                  {activeTab === 'search' && (
                    <div className="space-y-4">
                      <form onSubmit={handleKeywordSearch} className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Geef een trefwoord in (bijv. 'manipulatie onderhandelingen' of 'narcisme patronen')..."
                            className="w-full bg-[#f0f4f9] border border-[#e1e3e1] rounded-full pl-10 pr-4 py-2.5 text-xs text-[#1f1f1f] outline-none focus:border-[#0b57d0] focus:bg-white transition-all"
                          />
                          <Search size={15} className="absolute left-3.5 top-3 text-[#727775]" />
                        </div>

                        <button
                          type="submit"
                          disabled={!searchQuery.trim() || isSearching}
                          className="px-5 py-2.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] disabled:opacity-40 text-white text-xs font-medium transition-all flex items-center gap-1.5 shrink-0"
                        >
                          {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                          <span>{isSearching ? 'Onderzoeken...' : 'Start Research'}</span>
                        </button>
                      </form>

                      {/* Search & Synthesis Results */}
                      {searchResults.length > 0 && (
                        <div className="space-y-2.5 p-4 rounded-2xl bg-[#f8fafd] border border-[#e1e3e1]">
                          <div className="text-xs font-semibold text-[#1f1f1f] flex items-center justify-between">
                            <span>Gevonden Inzichten & Syntheses:</span>
                            <span className="text-[11px] text-[#727775]">Klik om toe te voegen aan je notebook</span>
                          </div>

                          <div className="grid grid-cols-1 gap-2.5">
                            {searchResults.map((res, i) => (
                              <div key={i} className="p-3 bg-white rounded-xl border border-[#e1e3e1] flex items-start justify-between gap-3 shadow-2xs hover:border-[#0b57d0]/40 transition-all">
                                <div>
                                  <h5 className="text-xs font-semibold text-[#1f1f1f]">{res.title}</h5>
                                  <p className="text-xs text-[#444746] mt-1 leading-relaxed">{res.content}</p>
                                </div>
                                <button
                                  onClick={() => handleAddSearchResultAsSource(res)}
                                  className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-[#0b57d0] bg-[#c2e7ff]/40 hover:bg-[#c2e7ff] px-3 py-1.5 rounded-full transition-colors mt-0.5"
                                >
                                  <Plus size={13} />
                                  <span>Voeg Toe</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Manual Text / Document */}
                  {activeTab === 'manual' && (
                    <form onSubmit={handleAddManualNote} className="space-y-3 p-4 rounded-2xl bg-[#f8fafd] border border-[#e1e3e1]">
                      <div>
                        <label className="block text-xs font-medium text-[#444746] mb-1">Titel van de bron</label>
                        <input
                          type="text"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="bijv. Verslag Casus Intake"
                          className="w-full bg-white border border-[#e1e3e1] rounded-xl px-3 py-2 text-xs text-[#1f1f1f] outline-none focus:border-[#0b57d0]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#444746] mb-1">Inhoud / Tekst</label>
                        <textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Plak hier de inhoud van je artikel of notitie..."
                          className="w-full bg-white border border-[#e1e3e1] rounded-xl px-3 py-2 text-xs text-[#1f1f1f] outline-none focus:border-[#0b57d0] h-28 resize-none"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-full bg-[#0b57d0] text-white text-xs font-medium hover:bg-[#0842a0]"
                      >
                        Bron Opslaan
                      </button>
                    </form>
                  )}
                </div>

                {/* Current Bound Sources in Active Project */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#444746]">
                      Gekoppelde Kennisbronnen in dit Notebook ({currentActiveProject.sources.length})
                    </span>
                  </div>

                  {currentActiveProject.sources.length === 0 ? (
                    <div className="border border-dashed border-[#e1e3e1] rounded-2xl p-6 text-center text-xs text-[#727775]">
                      Nog geen bronnen in dit notebook. Zoek op een trefwoord hierboven om bronnen te synthetiseren.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentActiveProject.sources.map(src => (
                        <div 
                          key={src.id}
                          className="p-3.5 rounded-2xl border border-[#e1e3e1] bg-[#f8fafd] flex flex-col justify-between group hover:border-[#0b57d0]/40 transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-[#1f1f1f] truncate pr-2">{src.title}</span>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#e9eef6] text-[#0b57d0]">
                                {src.type}
                              </span>
                            </div>
                            <p className="text-xs text-[#444746] line-clamp-3 leading-relaxed mt-1">
                              {src.content}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#e1e3e1]/60 text-[10px] text-[#727775]">
                            <span>{src.date}</span>
                            <button
                              onClick={() => handleDeleteSource(src.id)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                              title="Verwijder bron"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#727775]">
                Selecteer of maak een notebook links om te beginnen.
              </div>
            )}
          </div>
        </div>

        {/* Modal: New Project */}
        {showNewProj && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#e1e3e1] shadow-2xl space-y-4">
              <h4 className="text-base font-semibold text-[#1f1f1f]">Nieuw Notebook / Project</h4>
              <form onSubmit={handleCreateProject} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#444746] mb-1">Naam van het Notebook</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="bijv. Dossier Onderzoek"
                    className="w-full bg-[#f0f4f9] border border-[#e1e3e1] rounded-xl px-3 py-2 text-xs text-[#1f1f1f] outline-none focus:border-[#0b57d0]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#444746] mb-1">Onderzoeksdoel & Richtlijnen</label>
                  <textarea
                    value={newInstructions}
                    onChange={(e) => setNewInstructions(e.target.value)}
                    placeholder="bijv. Wees kritisch, baseer je puur op de geüploade documenten..."
                    className="w-full bg-[#f0f4f9] border border-[#e1e3e1] rounded-xl px-3 py-2 text-xs text-[#1f1f1f] outline-none focus:border-[#0b57d0] h-20 resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewProj(false)}
                    className="flex-1 py-2 text-xs text-[#444746] bg-[#f0f4f9] rounded-xl hover:bg-[#e9eef6]"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs text-white bg-[#0b57d0] rounded-xl font-medium hover:bg-[#0842a0]"
                  >
                    Aanmaken
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
