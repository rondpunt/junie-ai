import { useState, useRef, useEffect } from 'react';
import { 
  User, Paperclip, Copy, Check, RotateCcw, 
  SlidersHorizontal, ArrowUp, Lightbulb, Compass, Code, Brain,
  Hash, Users, Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamChat, getAIConfig } from '../lib/ai';
import { logChatMessage } from '../lib/auditLogger';
import { type ChatRoom, getRoomMessages, saveRoomMessages } from '../lib/rooms';

export default function ChatArea({ 
  chatId, 
  activeRoom,
  onOpenSettings,
  onOpenStudio,
  onOpenPricing,
  activeProject
}: { 
  chatId: string | null; 
  activeRoom?: ChatRoom | null;
  onOpenSettings?: () => void;
  onOpenStudio?: () => void;
  onOpenPricing?: () => void;
  activeProject?: any;
}) {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const logoUrl = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/logo.svg`;
  const currentUserEmail = localStorage.getItem('junie_user_email') || 'ai';
  const isPro = localStorage.getItem('junie_user_tier') === 'pro' || 
                localStorage.getItem('nexus_admin_session') === 'true';

  // Load messages when chatId or activeRoom changes
  useEffect(() => {
    if (activeRoom) {
      const roomMsgs = getRoomMessages(activeRoom.id);
      setMessages(roomMsgs);
    } else if (!chatId) {
      setMessages([]);
    }
  }, [chatId, activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const handleQuickPrompt = (promptText: string) => {
    setInput(promptText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    if (activeRoom) {
      saveRoomMessages(activeRoom.id, []);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentPrompt = input.trim();
    const config = getAIConfig();
    const userMessage = { role: 'user', content: currentPrompt };
    
    // Log user chat message for audit trail
    logChatMessage({
      userId: currentUserEmail === 'ai' ? 'usr-admin' : `usr-${currentUserEmail}`,
      userEmail: currentUserEmail,
      roomId: activeRoom?.id,
      roomName: activeRoom?.name,
      role: 'user',
      content: currentPrompt,
      provider: config.provider,
      model: config.model
    });

    const updatedWithUser = [...messages, userMessage];
    setMessages(updatedWithUser);
    if (activeRoom) {
      saveRoomMessages(activeRoom.id, updatedWithUser);
    }

    setInput('');
    setIsLoading(true);

    const updatedWithAssistant = [...updatedWithUser, { role: 'assistant', content: '' }];
    setMessages(updatedWithAssistant);

    let contextString = '';
    if (activeProject && activeProject.sources && activeProject.sources.length > 0) {
      contextString = `Project: ${activeProject.title}\nInstructies: ${activeProject.instructions}\n\nBronnen:\n` + 
        activeProject.sources.map((s: any) => `[${s.title} (${s.type})]:\n${s.content}`).join('\n\n');
    }

    let fullAssistantResponse = '';

    await streamChat(updatedWithUser, (chunk) => {
      fullAssistantResponse += chunk;
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          content: fullAssistantResponse
        };
        return newMessages;
      });
    }, contextString);

    // Save final messages to room
    if (activeRoom) {
      const finalRoomMessages = [
        ...updatedWithUser,
        { role: 'assistant', content: fullAssistantResponse }
      ];
      saveRoomMessages(activeRoom.id, finalRoomMessages);
    }

    // Log assistant response for audit trail
    if (fullAssistantResponse) {
      logChatMessage({
        userId: currentUserEmail === 'ai' ? 'usr-admin' : `usr-${currentUserEmail}`,
        userEmail: currentUserEmail,
        roomId: activeRoom?.id,
        roomName: activeRoom?.name,
        role: 'assistant',
        content: fullAssistantResponse,
        provider: config.provider,
        model: config.model
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#ffffff] text-[#1f1f1f] font-sans">
      {/* Google App Header */}
      <header className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-[#ffffff] border-b border-[#f0f4f9]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Junie" className="w-6 h-6 rounded-md shadow-2xs" />
            <span className="text-lg font-bold text-[#1f1f1f] tracking-tight">Junie</span>
          </div>

          {/* Active Room Title or Project Badge */}
          {activeRoom ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#e1e3e1]">
              <span className="text-xs font-semibold text-[#1f1f1f] flex items-center gap-1">
                <Hash size={13} className="text-[#0b57d0]" />
                {activeRoom.name.replace('#', '')}
              </span>
              <span className="hidden sm:inline-block text-[11px] text-[#727775]">
                {activeRoom.topic || activeRoom.description}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0f4f9] text-[#444746] flex items-center gap-1 font-mono">
                <Users size={10} /> {activeRoom.memberCount}
              </span>
            </div>
          ) : activeProject ? (
            <button 
              onClick={onOpenStudio}
              className="text-xs text-[#0b57d0] font-medium px-3 py-1 rounded-full bg-[#c2e7ff]/50 border border-[#0b57d0]/30 hover:bg-[#c2e7ff] transition-colors flex items-center gap-1.5"
            >
              <span>📁 {activeProject.title}</span>
              <span className="text-[10px] bg-[#0b57d0] text-white px-1.5 py-0.2 rounded-full font-mono">
                {activeProject.sources?.length || 0} bronnen
              </span>
            </button>
          ) : (
            <button 
              onClick={onOpenStudio}
              className="text-xs text-[#444746] hover:text-[#0b57d0] font-medium px-2.5 py-1 rounded-full bg-[#f0f4f9] hover:bg-[#e9eef6] transition-colors"
            >
              + Koppel Notebook
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {onOpenPricing && !isPro && (
            <button
              onClick={onOpenPricing}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#0b57d0] bg-[#c2e7ff]/50 hover:bg-[#c2e7ff] px-3 py-1.5 rounded-full transition-colors"
            >
              <Sparkles size={13} />
              <span>Word Pro</span>
            </button>
          )}

          {messages.length > 0 && (
            <button
              onClick={handleResetChat}
              className="p-2 rounded-full hover:bg-[#f0f4f9] text-[#444746] transition-colors"
              title="Schoon scherm / Nieuwe chat"
            >
              <RotateCcw size={17} />
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full hover:bg-[#f0f4f9] text-[#444746] transition-colors"
              title="Instellingen"
            >
              <SlidersHorizontal size={17} />
            </button>
          )}
        </div>
      </header>

      {/* Main Conversation Canvas */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center max-w-3xl mx-auto py-6">
            {/* Google Welcome Hero */}
            <div className="mb-8 sm:mb-12">
              <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-[#1f1f1f] mb-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a73e8] via-[#8e24aa] to-[#d93025]">
                  {activeRoom ? activeRoom.name : 'Hallo, Niels'}
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-[#444746] font-normal">
                {activeRoom ? activeRoom.description : 'Hoe kan Junie je vandaag helpen?'}
              </p>
            </div>

            {/* Google Suggestion Cards in Clean White */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                {
                  title: 'Psychologische Analyse',
                  desc: 'Bespreek subtiele beïnvloedingstechnieken en gedragsdynamieken',
                  icon: Brain,
                  prompt: 'Leg 3 subtiele psychologische beïnvloedingstechnieken uit die in onderhandelingen worden gebruikt, zonder omwegen en zonder excuses:'
                },
                {
                  title: 'Scherpe Strategie',
                  desc: 'Vind de meest compromisloze tactiek voor je casus',
                  icon: Compass,
                  prompt: 'Analyseer het volgende vraagstuk en geef een uiterst scherpe, pragmatische strategie:'
                },
                {
                  title: 'Code Refactor',
                  desc: 'Optimaliseer TypeScript en Python voor minimale latency',
                  icon: Code,
                  prompt: 'Optimaliseer deze code voor maximale efficiëntie en geef direct een schone refactor:'
                },
                {
                  title: 'Ongefilterde Inzichten',
                  desc: 'Krijg een objectief antwoord zonder maatschappelijke remmen',
                  icon: Lightbulb,
                  prompt: 'Geef een ongecensureerde, feitelijke analyse over de volgende situatie:'
                }
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuickPrompt(card.prompt)}
                    className="p-4 rounded-2xl bg-[#f0f4f9] hover:bg-[#e9eef6] active:scale-98 transition-all text-left flex flex-col justify-between h-36 border border-[#e1e3e1] shadow-2xs"
                  >
                    <p className="text-xs text-[#1f1f1f] font-normal leading-relaxed line-clamp-3">
                      {card.desc}
                    </p>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#444746] shadow-xs self-end mt-2">
                      <Icon size={16} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 max-w-3xl mx-auto w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[#f8fafd] border border-[#e1e3e1] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs overflow-hidden">
                  <img src={logoUrl} alt="Junie" className="w-5 h-5 object-contain" />
                </div>
              )}

              <div className={`relative group max-w-[88%] sm:max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-[#e9eef6] text-[#1f1f1f] px-5 py-3 rounded-3xl'
                  : 'text-[#1f1f1f] px-1 py-1'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{msg.content}</div>
                ) : (
                  <div>
                    {msg.content ? (
                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-2 text-[#444746] text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#0b57d0] animate-pulse"></span>
                        <span>Junie formuleert antwoord...</span>
                      </div>
                    )}
                  </div>
                )}

                {msg.role === 'assistant' && msg.content && (
                  <div className="flex items-center gap-2 mt-3 pt-1 text-xs text-[#727775]">
                    <button
                      onClick={() => handleCopy(msg.content, i)}
                      className="p-1.5 rounded-full hover:bg-[#f0f4f9] hover:text-[#1f1f1f] transition-colors flex items-center gap-1.5"
                    >
                      {copiedIndex === i ? <Check size={14} className="text-[#0b57d0]" /> : <Copy size={14} />}
                      <span className="text-[11px]">{copiedIndex === i ? 'Gekopieerd' : 'Kopieer'}</span>
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-[#f0f4f9] border border-[#e1e3e1] flex items-center justify-center shrink-0 mt-0.5 text-[#444746]">
                  <User size={15} />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Floating Google Light Pill Input */}
      <footer className="p-3 sm:p-5 bg-[#ffffff] shrink-0">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 bg-[#f0f4f9] rounded-full p-2 pl-4 border border-[#e1e3e1] focus-within:bg-white focus-within:shadow-md focus-within:border-[#0b57d0] transition-all"
          >
            <button
              type="button"
              className="p-2 text-[#444746] hover:text-[#1f1f1f] rounded-full transition-colors shrink-0 mb-0.5"
              title="Bestand of PDF toevoegen"
              onClick={onOpenStudio}
            >
              <Paperclip size={18} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={activeRoom ? `Bericht in ${activeRoom.name}...` : "Vraag Junie..."}
              className="w-full bg-transparent text-[#1f1f1f] outline-none resize-none py-2 text-sm sm:text-base max-h-36 min-h-[38px] placeholder-[#727775]"
              rows={1}
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-[#1f1f1f] hover:bg-black active:scale-95 text-white transition-all disabled:opacity-20 disabled:scale-100 shrink-0 flex items-center justify-center shadow-xs"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
              ) : (
                <ArrowUp size={18} strokeWidth={2.5} />
              )}
            </button>
          </form>

          <div className="text-center mt-2.5 text-[11px] text-[#727775]">
            Junie kan onnauwkeurigheden bevatten. Controleer kritische informatie.
          </div>
        </div>
      </footer>
    </div>
  );
}
