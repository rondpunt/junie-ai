import { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw, Zap, Shield, Search } from 'lucide-react';
import { getAIConfig, fetchAvailableModels, type AIProvider, type ModelOption } from '../lib/ai';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [provider, setProvider] = useState<AIProvider>('groq');
  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [perplexityKey, setPerplexityKey] = useState('');
  
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const config = getAIConfig();
    setProvider(config.provider);
    
    const storedGroq = localStorage.getItem('groq_api_key') || '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';
    const storedGemini = localStorage.getItem('gemini_api_key') || '';
    const storedOpenRouter = localStorage.getItem('openrouter_api_key') || '';
    const storedPerplexity = localStorage.getItem('perplexity_api_key') || '';

    setGroqKey(storedGroq);
    setGeminiKey(storedGemini);
    setOpenRouterKey(storedOpenRouter);
    setPerplexityKey(storedPerplexity);

    setSelectedModel(config.model);
    loadModels(config.provider, getKeyForProvider(config.provider, storedGroq, storedGemini, storedOpenRouter, storedPerplexity));
  }, []);

  const getKeyForProvider = (prov: AIProvider, groq: string, gemini: string, openRouter: string, perp: string) => {
    if (prov === 'groq') return groq;
    if (prov === 'gemini') return gemini;
    if (prov === 'openrouter') return openRouter;
    if (prov === 'perplexity') return perp;
    return '';
  };

  const loadModels = async (prov: AIProvider, key: string) => {
    setIsDetecting(true);
    const models = await fetchAvailableModels(prov, key);
    setAvailableModels(models);
    setIsDetecting(false);
  };

  const handleProviderChange = (newProv: AIProvider) => {
    setProvider(newProv);
    const currentKey = getKeyForProvider(newProv, groqKey, geminiKey, openRouterKey, perplexityKey);
    loadModels(newProv, currentKey);
  };

  const handleSave = () => {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('groq_api_key', groqKey);
    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('openrouter_api_key', openRouterKey);
    localStorage.setItem('perplexity_api_key', perplexityKey);
    
    if (selectedModel) {
      if (provider === 'groq') localStorage.setItem('groq_model', selectedModel);
      else if (provider === 'gemini') localStorage.setItem('gemini_model', selectedModel);
      else if (provider === 'openrouter') localStorage.setItem('openrouter_model', selectedModel);
      else if (provider === 'perplexity') localStorage.setItem('perplexity_model', selectedModel);
      else localStorage.setItem('homeserver_model', selectedModel);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-pop-in">
      <div className="bg-white border border-[#e1e3e1] rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        {/* Google Light Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#e1e3e1] bg-[#f8fafd]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0b57d0]/10 flex items-center justify-center text-[#0b57d0]">
              <Sparkles size={17} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1f1f1f]">Model & Provider Hub</h2>
              <p className="text-xs text-[#444746]">Selecteer of wissel tussen cloud LPU's en lokale servers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#e9eef6] text-[#444746] transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] no-scrollbar">
          {/* Provider Select Tabs */}
          <div>
            <label className="block text-xs font-semibold text-[#444746] uppercase tracking-wider mb-2">Selecteer Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'groq', name: '⚡ Groq LPU', badge: '0.2s Respons' },
                { id: 'perplexity', name: '🌐 Perplexity', badge: 'Live Web' },
                { id: 'homeserver', name: '🏠 Homeserver', badge: 'Privé LAN' },
                { id: 'gemini', name: '✨ Gemini API', badge: 'Google Cloud' },
                { id: 'openrouter', name: '🔀 OpenRouter', badge: 'Multi-Model' }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleProviderChange(item.id as AIProvider)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    provider === item.id 
                      ? 'bg-[#c2e7ff] border-[#0b57d0] text-[#001d35] font-semibold shadow-xs' 
                      : 'bg-[#f0f4f9] border-[#e1e3e1] text-[#1f1f1f] hover:bg-[#e9eef6]'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{item.name}</div>
                  <div className="text-[10px] text-[#444746] mt-0.5">{item.badge}</div>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Section */}
          {provider !== 'homeserver' && (
            <div className="bg-[#f8fafd] border border-[#e1e3e1] rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[#1f1f1f]">
                  {provider.toUpperCase()} API Sleutel
                </label>
                <button 
                  type="button"
                  onClick={() => loadModels(provider, getKeyForProvider(provider, groqKey, geminiKey, openRouterKey, perplexityKey))}
                  className="text-[11px] text-[#0b57d0] hover:underline flex items-center gap-1 font-medium"
                >
                  <RefreshCw size={11} className={isDetecting ? 'animate-spin' : ''} />
                  <span>Herlaad Modellen</span>
                </button>
              </div>

              {provider === 'groq' && (
                <input 
                  type="password" 
                  value={groqKey} 
                  onChange={(e) => { setGroqKey(e.target.value); loadModels('groq', e.target.value); }} 
                  placeholder="gsk_..." 
                  className="w-full bg-white border border-[#e1e3e1] rounded-xl px-3.5 py-2 text-[#1f1f1f] text-xs outline-none focus:border-[#0b57d0]" 
                />
              )}
              {provider === 'perplexity' && (
                <input 
                  type="password" 
                  value={perplexityKey} 
                  onChange={(e) => { setPerplexityKey(e.target.value); loadModels('perplexity', e.target.value); }} 
                  placeholder="pplx-..." 
                  className="w-full bg-white border border-[#e1e3e1] rounded-xl px-3.5 py-2 text-[#1f1f1f] text-xs outline-none focus:border-[#0b57d0]" 
                />
              )}
              {provider === 'gemini' && (
                <input 
                  type="password" 
                  value={geminiKey} 
                  onChange={(e) => { setGeminiKey(e.target.value); loadModels('gemini', e.target.value); }} 
                  placeholder="AIzaSy..." 
                  className="w-full bg-white border border-[#e1e3e1] rounded-xl px-3.5 py-2 text-[#1f1f1f] text-xs outline-none focus:border-[#0b57d0]" 
                />
              )}
              {provider === 'openrouter' && (
                <input 
                  type="password" 
                  value={openRouterKey} 
                  onChange={(e) => { setOpenRouterKey(e.target.value); loadModels('openrouter', e.target.value); }} 
                  placeholder="sk-or-v1-..." 
                  className="w-full bg-white border border-[#e1e3e1] rounded-xl px-3.5 py-2 text-[#1f1f1f] text-xs outline-none focus:border-[#0b57d0]" 
                />
              )}
            </div>
          )}

          {/* Model Roster & Auto-Detect List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#444746] uppercase tracking-wider">
                Beschikbare Modellen ({availableModels.length})
              </label>
              <span className="text-[10px] text-[#0b57d0] font-mono">Status: Geverifieerd</span>
            </div>

            {isDetecting ? (
              <div className="py-6 text-center text-xs text-[#727775] flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-[#0b57d0]" />
                <span>Modellen ophalen van provider...</span>
              </div>
            ) : availableModels.length > 0 ? (
              <div className="space-y-2">
                {availableModels.map(m => (
                  <div 
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedModel === m.id 
                        ? 'bg-[#c2e7ff] border-[#0b57d0] text-[#001d35] font-semibold shadow-xs' 
                        : 'bg-[#f0f4f9] border-[#e1e3e1] text-[#1f1f1f] hover:bg-[#e9eef6]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        {m.category === 'power' && <Zap size={13} className="text-[#0b57d0]" />}
                        {m.category === 'uncensored' && <Shield size={13} className="text-rose-600" />}
                        {m.category === 'search' && <Search size={13} className="text-teal-600" />}
                        <span>{m.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#727775] mt-0.5">{m.id}</div>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white text-[#1f1f1f] border border-[#e1e3e1]">
                      {m.badge}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#f0f4f9] border border-[#e1e3e1] text-center text-xs text-[#727775]">
                Geen modellen gevonden. Controleer je verbinding of API-sleutel.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e1e3e1] bg-[#f8fafd] flex gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-2 rounded-xl bg-white border border-[#e1e3e1] text-[#444746] text-xs font-medium hover:bg-[#f0f4f9] transition-colors"
          >
            Annuleren
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            className="flex-1 py-2 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold transition-all shadow-xs"
          >
            Opslaan & Activeren
          </button>
        </div>
      </div>
    </div>
  );
}
