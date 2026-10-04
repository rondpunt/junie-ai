import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import SettingsModal from '../components/SettingsModal';
import StudioModal, { type ProjectSpace } from '../components/StudioModal';
import AdminConsole from '../components/AdminConsole';
import PricingModal from '../components/PricingModal';
import { Menu } from 'lucide-react';
import { getRooms, type ChatRoom } from '../lib/rooms';

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [activeProject, setActiveProject] = useState<ProjectSpace | null>(null);

  const rooms = getRooms();
  const activeRoom: ChatRoom | undefined = activeRoomId ? rooms.find(r => r.id === activeRoomId) : undefined;
  const currentUserEmail = localStorage.getItem('junie_user_email') || 'ai';

  return (
    <div className="flex h-screen bg-[#ffffff] text-[#1f1f1f] overflow-hidden relative font-sans">
      {/* Mobile Top Menu Button */}
      <button 
        onClick={() => setSidebarOpen(true)}
        className="md:hidden absolute top-3.5 left-3.5 z-30 p-2 rounded-full bg-[#f0f4f9] text-[#444746] hover:bg-[#e9eef6] shadow-xs"
      >
        <Menu size={18} />
      </button>

      {/* Google Style Sidebar Drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-[280px] transform transition-transform duration-200 ease-in-out bg-[#f0f4f9] border-r border-[#e1e3e1]
        ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <Sidebar 
          currentChatId={currentChatId} 
          onSelectChat={(id) => {
            setCurrentChatId(id);
            setActiveRoomId(null);
            setSidebarOpen(false);
          }}
          activeRoomId={activeRoomId}
          onSelectRoom={(roomId) => {
            setActiveRoomId(roomId);
            setCurrentChatId(null);
            setSidebarOpen(false);
          }}
          onCloseMobile={() => setSidebarOpen(false)}
          onOpenStudio={() => setShowStudio(true)}
          onOpenAdmin={() => setShowAdmin(true)}
          onOpenPricing={() => setShowPricing(true)}
          activeProjectTitle={activeProject?.title}
        />
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Google Main Surface in White */}
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative bg-[#ffffff]">
        <ChatArea 
          chatId={currentChatId} 
          activeRoom={activeRoom || null}
          onOpenSettings={() => setShowSettings(true)} 
          onOpenStudio={() => setShowStudio(true)}
          onOpenPricing={() => setShowPricing(true)}
          activeProject={activeProject}
        />
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      
      {showStudio && (
        <StudioModal 
          onClose={() => setShowStudio(false)} 
          activeProject={activeProject}
          onSelectProject={(proj) => {
            setActiveProject(proj);
          }}
        />
      )}

      {showAdmin && (
        <AdminConsole onClose={() => setShowAdmin(false)} />
      )}

      {showPricing && (
        <PricingModal 
          onClose={() => setShowPricing(false)} 
          currentUserEmail={currentUserEmail}
        />
      )}
    </div>
  );
}
