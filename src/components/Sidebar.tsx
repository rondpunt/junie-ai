import { 
  Plus, MessageSquare, LogOut, X, Settings, 
  History, Hash, Shield, Sparkles, FolderKanban 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import SettingsModal from './SettingsModal';
import { getRooms, type ChatRoom, createRoom } from '../lib/rooms';

export default function Sidebar({ 
  currentChatId, 
  onSelectChat, 
  activeRoomId,
  onSelectRoom,
  onCloseMobile,
  onOpenStudio,
  onOpenAdmin,
  onOpenPricing,
  activeProjectTitle
}: { 
  currentChatId: string | null; 
  onSelectChat: (id: string | null) => void;
  activeRoomId?: string | null;
  onSelectRoom?: (roomId: string | null) => void;
  onCloseMobile: () => void;
  onOpenStudio?: () => void;
  onOpenAdmin?: () => void;
  onOpenPricing?: () => void;
  activeProjectTitle?: string;
}) {
  const [chats, setChats] = useState<any[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  const logoUrl = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/logo.svg`;
  const isAdmin = localStorage.getItem('nexus_admin_session') === 'true' || 
                  localStorage.getItem('junie_user_tier') === 'admin';
  const isPro = localStorage.getItem('junie_user_tier') === 'pro';

  useEffect(() => {
    setChats([
      { id: '1', title: 'Analyse: Intake dossier' },
      { id: '2', title: 'Borderline dynamieken' }
    ]);
    setRooms(getRooms());
  }, []);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const room = createRoom(newRoomName, newRoomDesc);
    setRooms(getRooms());
    if (onSelectRoom) {
      onSelectRoom(room.id);
    }
    setNewRoomName('');
    setNewRoomDesc('');
    setShowNewRoomModal(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem('nexus_admin_session');
    localStorage.removeItem('junie_user_email');
    localStorage.removeItem('junie_user_tier');
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <>
      <div className="flex flex-col h-full bg-[#f0f4f9] text-[#1f1f1f] p-3 select-none border-r border-[#e1e3e1]">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 mb-3">
          <div className="flex items-center gap-2.5">
            <img src={logoUrl} alt="Junie" className="w-7 h-7 rounded-lg shadow-2xs" />
            <span className="font-bold text-base tracking-tight text-[#1f1f1f]">Junie</span>
          </div>

          <button 
            onClick={onCloseMobile} 
            className="md:hidden p-1.5 rounded-full hover:bg-[#e9eef6] text-[#444746]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Google Pill: New Chat */}
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={() => {
              if (onSelectRoom) onSelectRoom(null);
              onSelectChat(null);
            }}
            className="flex items-center gap-3 bg-[#ffffff] hover:bg-[#e9eef6] active:scale-98 text-[#1f1f1f] px-4 py-2.5 rounded-full font-medium text-xs transition-all shadow-xs flex-1 border border-[#e1e3e1]"
          >
            <Plus size={16} className="text-[#0b57d0]" /> 
            <span>Nieuwe chat</span>
          </button>
        </div>

        {/* NotebookLM / Studio Button */}
        {onOpenStudio && (
          <button
            onClick={onOpenStudio}
            className="flex items-center justify-between bg-white border border-[#e1e3e1] hover:border-[#0b57d0]/40 px-3 py-2 rounded-2xl mb-3 text-xs font-semibold text-[#1f1f1f] transition-all shadow-2xs text-left"
          >
            <div className="truncate pr-1">
              <div className="text-[10px] text-[#0b57d0] font-mono uppercase tracking-wider flex items-center gap-1">
                <FolderKanban size={11} /> NotebookLM Studio
              </div>
              <div className="truncate text-xs text-[#1f1f1f] font-normal">{activeProjectTitle || 'Geen project actief'}</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0f4f9] text-[#444746] shrink-0 font-medium">Open</span>
          </button>
        )}

        {/* Chatrooms Section */}
        <div className="mb-2">
          <div className="flex items-center justify-between px-3 py-1.5 text-xs font-medium text-[#444746]">
            <div className="flex items-center gap-1.5">
              <Hash size={13} className="text-[#727775]" />
              <span>Chatrooms</span>
            </div>
            <button
              onClick={() => setShowNewRoomModal(true)}
              className="p-1 rounded-full hover:bg-[#e9eef6] text-[#444746]"
              title="Nieuwe room aanmaken"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-0.5 mt-0.5">
            {rooms.map(room => {
              const isActive = activeRoomId === room.id;
              return (
                <button
                  key={room.id}
                  onClick={() => {
                    onSelectChat(null);
                    if (onSelectRoom) onSelectRoom(room.id);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-full text-left text-xs transition-colors ${
                    isActive 
                      ? 'bg-[#c2e7ff] text-[#001d35] font-semibold' 
                      : 'text-[#1f1f1f] hover:bg-[#e9eef6]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={isActive ? 'text-[#001d35]' : 'text-[#727775]'}>#</span>
                    <span className="truncate">{room.name.replace('#', '')}</span>
                  </div>
                  {room.memberCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 text-[#727775] font-mono">
                      {room.memberCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Chats Section in Google Style */}
        <div className="flex-1 overflow-y-auto space-y-0.5 -mx-1 px-1">
          <div className="text-xs font-medium text-[#444746] px-3 py-1.5 flex items-center gap-1.5">
            <History size={13} className="text-[#727775]" />
            <span>Recente chats</span>
          </div>

          {chats.map(chat => {
            const isActive = !activeRoomId && currentChatId === chat.id;
            return (
              <button
                key={chat.id}
                onClick={() => {
                  if (onSelectRoom) onSelectRoom(null);
                  onSelectChat(chat.id);
                }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-full text-left text-xs transition-colors ${
                  isActive 
                    ? 'bg-[#c2e7ff] text-[#001d35] font-semibold' 
                    : 'text-[#1f1f1f] hover:bg-[#e9eef6]'
                }`}
              >
                <MessageSquare size={13} className={isActive ? 'text-[#001d35] shrink-0' : 'text-[#727775] shrink-0'} />
                <span className="truncate">{chat.title}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Utility Menu in Google Spec */}
        <div className="pt-2 border-t border-[#e1e3e1] space-y-0.5">
          {/* Pro Upgrade / Badge Button */}
          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-full transition-all text-xs font-semibold mb-1 ${
                isPro 
                  ? 'bg-amber-100/70 text-amber-900 border border-amber-200' 
                  : 'bg-gradient-to-r from-[#0b57d0] to-[#1a73e8] text-white shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} className={isPro ? 'text-amber-700' : 'text-amber-200'} />
                <span>{isPro ? 'Junie Pro Actief' : 'Upgrade naar Pro'}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 font-bold">
                {isPro ? 'Lid' : '€19'}
              </span>
            </button>
          )}

          {/* Master Admin Console button */}
          {isAdmin && onOpenAdmin && (
            <button 
              onClick={onOpenAdmin}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-[#0b57d0] bg-[#c2e7ff]/40 hover:bg-[#c2e7ff] rounded-full transition-colors text-xs font-semibold"
            >
              <Shield size={15} className="text-[#0b57d0]" /> 
              <span>Beheerconsole (Admin)</span>
            </button>
          )}

          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-[#1f1f1f] hover:bg-[#e9eef6] rounded-full transition-colors text-xs font-medium"
          >
            <Settings size={15} className="text-[#444746]" /> 
            <span>Instellingen</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-[#ba1a1a] hover:bg-rose-50 rounded-full transition-colors text-xs font-medium"
          >
            <LogOut size={15} className="text-[#ba1a1a]" /> 
            <span>Afmelden</span>
          </button>
        </div>
      </div>
      
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* New Room Modal */}
      {showNewRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#e1e3e1] shadow-xl text-[#1f1f1f]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Hash size={18} className="text-[#0b57d0]" />
                <h3 className="font-bold text-sm">Nieuwe Chatroom Maken</h3>
              </div>
              <button 
                onClick={() => setShowNewRoomModal(false)}
                className="p-1 rounded-full hover:bg-[#f0f4f9] text-[#727775]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1">Room Naam</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="bijv. psychologie-onderzoek of ai-agents"
                  className="w-full bg-[#f0f4f9] border border-[#e1e3e1] rounded-xl px-3 py-2 text-xs text-[#1f1f1f] outline-none focus:border-[#0b57d0]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1">Onderwerp / Doel</label>
                <input
                  type="text"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="Korte beschrijving van deze discussieruimte..."
                  className="w-full bg-[#f0f4f9] border border-[#e1e3e1] rounded-xl px-3 py-2 text-xs text-[#1f1f1f] outline-none focus:border-[#0b57d0]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewRoomModal(false)}
                  className="px-4 py-2 rounded-full text-xs text-[#444746] hover:bg-[#f0f4f9]"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="bg-[#0b57d0] hover:bg-[#0842a0] text-white px-5 py-2 rounded-full text-xs font-semibold transition-all"
                >
                  Room Maken
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
