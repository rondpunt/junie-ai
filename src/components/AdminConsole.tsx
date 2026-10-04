import { useState, useEffect } from 'react';
import { 
  X, Shield, Users, Activity, Download, Trash2, Search, 
  CheckCircle2, RefreshCw, Sparkles, Server 
} from 'lucide-react';
import { 
  getAuditLogs, clearAuditLogs, getUsers, updateUserTier, 
  type AuditLogEntry, type UserProfile 
} from '../lib/auditLogger';

export default function AdminConsole({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'logs' | 'users' | 'system'>('logs');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadData = () => {
    setLogs(getAuditLogs());
    setUsers(getUsers());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearLogs = () => {
    if (window.confirm('Weet je zeker dat je alle audit logs wilt wissen?')) {
      clearAuditLogs();
      loadData();
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `junie_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Gebruiker', 'Room', 'Rol', 'Model', 'Provider', 'Tokens', 'Inhoud'];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      `"${l.userEmail}"`,
      `"${l.roomName || 'Direct'}"`,
      l.role,
      l.model,
      l.provider,
      l.tokensEstimated,
      `"${l.content.replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `junie_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleTierChange = (userId: string, newTier: 'free' | 'pro' | 'admin') => {
    updateUserTier(userId, newTier);
    setUsers(getUsers());
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.roomName && log.roomName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRoom = selectedRoom === 'all' || log.roomId === selectedRoom;
    const matchesRole = selectedRole === 'all' || log.role === selectedRole;
    return matchesSearch && matchesRoom && matchesRole;
  });

  const totalTokens = logs.reduce((acc, curr) => acc + (curr.tokensEstimated || 0), 0);
  const uniqueUsers = new Set(logs.map(l => l.userEmail)).size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs font-sans animate-fade-in">
      <div className="bg-[#ffffff] w-full max-w-5xl h-[90vh] rounded-3xl border border-[#e1e3e1] shadow-2xl flex flex-col overflow-hidden text-[#1f1f1f]">
        
        {/* Header in Google Material 3 Expressive Style */}
        <div className="px-6 py-4 bg-[#f8fafd] border-b border-[#e1e3e1] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0b57d0]/10 border border-[#0b57d0]/20 flex items-center justify-center text-[#0b57d0]">
              <Shield size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-[#1f1f1f]">Junie Beheerconsole</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#c2e7ff] text-[#001d35]">
                  Master Admin
                </span>
              </div>
              <p className="text-xs text-[#444746]">Centraal toezicht op chatlogs, gebruikers en realtime AI-infrastructuur</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={loadData}
              className="p-2 rounded-full hover:bg-[#e9eef6] text-[#444746] transition-colors"
              title="Vernieuwen"
            >
              <RefreshCw size={17} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#e9eef6] text-[#444746] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-[#f8fafd] border-b border-[#e1e3e1] flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'logs'
                ? 'border-[#0b57d0] text-[#0b57d0] bg-white shadow-2xs'
                : 'border-transparent text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e9eef6]/50'
            }`}
          >
            <Activity size={15} />
            <span>Live Chat Audit Logs</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#f0f4f9] text-[#444746] font-mono">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-[#0b57d0] text-[#0b57d0] bg-white shadow-2xs'
                : 'border-transparent text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e9eef6]/50'
            }`}
          >
            <Users size={15} />
            <span>Gebruikers & Abonnementen</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#f0f4f9] text-[#444746] font-mono">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'system'
                ? 'border-[#0b57d0] text-[#0b57d0] bg-white shadow-2xs'
                : 'border-transparent text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e9eef6]/50'
            }`}
          >
            <Server size={15} />
            <span>Infrastructuur & Failover</span>
            <span className="w-2 h-2 rounded-full bg-[#34a853] animate-pulse"></span>
          </button>
        </div>

        {/* Tab 1: Audit Logs */}
        {activeTab === 'logs' && (
          <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
            {/* Top Stat Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#f0f4f9] border border-[#e1e3e1]">
                <div className="text-[11px] text-[#444746] uppercase font-semibold">Totaal Logs</div>
                <div className="text-xl font-bold text-[#1f1f1f] mt-1">{logs.length}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f0f4f9] border border-[#e1e3e1]">
                <div className="text-[11px] text-[#444746] uppercase font-semibold">Geschatte Tokens</div>
                <div className="text-xl font-bold text-[#0b57d0] mt-1">{totalTokens.toLocaleString('nl-NL')}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f0f4f9] border border-[#e1e3e1]">
                <div className="text-[11px] text-[#444746] uppercase font-semibold">Actieve Gebruikers</div>
                <div className="text-xl font-bold text-[#1f1f1f] mt-1">{uniqueUsers || users.length}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f0f4f9] border border-[#e1e3e1] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#444746] uppercase font-semibold">AI Cloud Provider</div>
                  <div className="text-xs font-bold text-[#188038] mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#34a853]"></span> Groq 120B (LPU)
                  </div>
                </div>
                <span className="text-[10px] bg-white px-2 py-1 rounded-full border border-[#e1e3e1] font-mono">0.2s</span>
              </div>
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-[#e1e3e1]">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-3 text-[#727775]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Zoek in prompts of antwoorden..."
                    className="w-full bg-[#f0f4f9] rounded-full pl-9 pr-4 py-2 text-xs text-[#1f1f1f] outline-none focus:bg-white focus:ring-1 focus:ring-[#0b57d0] transition-all"
                  />
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-[#f0f4f9] rounded-full px-3 py-2 text-xs text-[#1f1f1f] outline-none border border-[#e1e3e1]"
                >
                  <option value="all">Alle Rollen</option>
                  <option value="user">Gebruiker</option>
                  <option value="assistant">AI Assistent</option>
                </select>

                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="bg-[#f0f4f9] rounded-full px-3 py-2 text-xs text-[#1f1f1f] outline-none border border-[#e1e3e1]"
                >
                  <option value="all">Alle Rooms</option>
                  <option value="room-algemeen">#algemeen</option>
                  <option value="room-psychologie">#psychologie</option>
                  <option value="room-code">#code</option>
                  <option value="room-onderzoek">#onderzoek</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  disabled={logs.length === 0}
                  className="flex items-center gap-1.5 bg-[#f0f4f9] hover:bg-[#e9eef6] text-[#1f1f1f] px-3 py-2 rounded-full text-xs font-medium border border-[#e1e3e1] transition-colors disabled:opacity-50"
                >
                  <Download size={13} />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  disabled={logs.length === 0}
                  className="flex items-center gap-1.5 bg-[#f0f4f9] hover:bg-[#e9eef6] text-[#1f1f1f] px-3 py-2 rounded-full text-xs font-medium border border-[#e1e3e1] transition-colors disabled:opacity-50"
                >
                  <Download size={13} />
                  <span>JSON</span>
                </button>
                <button
                  onClick={handleClearLogs}
                  disabled={logs.length === 0}
                  className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-[#ba1a1a] px-3 py-2 rounded-full text-xs font-medium border border-rose-200 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  <span>Wissen</span>
                </button>
              </div>
            </div>

            {/* Logs List Table */}
            <div className="flex-1 overflow-y-auto rounded-2xl border border-[#e1e3e1] bg-[#ffffff] divide-y divide-[#f0f4f9]">
              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center text-[#727775] text-xs">
                  Geen audit logs gevonden die overeenkomen met de filters.
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const dateStr = new Date(log.timestamp).toLocaleTimeString('nl-NL', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  });

                  return (
                    <div 
                      key={log.id} 
                      className={`p-3.5 transition-colors cursor-pointer hover:bg-[#f8fafd] ${isExpanded ? 'bg-[#f8fafd]' : ''}`}
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] text-[#727775]">{dateStr}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            log.role === 'user' 
                              ? 'bg-[#c2e7ff] text-[#001d35]' 
                              : 'bg-[#d3e3fd] text-[#0b57d0]'
                          }`}>
                            {log.role === 'user' ? 'Gebruiker' : 'Junie AI'}
                          </span>
                          <span className="text-xs font-semibold text-[#1f1f1f]">
                            {log.userEmail}
                          </span>
                          {log.roomName && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0f4f9] text-[#444746] font-medium border border-[#e1e3e1]">
                              {log.roomName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[#727775]">
                            ~{log.tokensEstimated} tkn
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0f4f9] text-[#444746] font-mono">
                            {log.model}
                          </span>
                        </div>
                      </div>

                      <div className={`text-xs text-[#303030] leading-relaxed ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
                        {log.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: User Management */}
        {activeTab === 'users' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1f1f1f]">Geregistreerde Gebruikers & Toegangsrechten</h3>
                <p className="text-xs text-[#444746]">Beheer wie toegang heeft tot Pro functies, 120B modellen en onbeperkte NotebookLM spaces</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e1e3e1] overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafd] border-b border-[#e1e3e1] text-[#444746] uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Gebruiker</th>
                    <th className="py-3 px-4">Abonnement (Tier)</th>
                    <th className="py-3 px-4">Berichten</th>
                    <th className="py-3 px-4">Laatst Actief</th>
                    <th className="py-3 px-4 text-right">Acties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4f9]">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#f8fafd] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1f1f1f]">{user.name}</div>
                        <div className="text-[11px] text-[#727775]">{user.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.tier === 'admin' 
                            ? 'bg-[#c2e7ff] text-[#001d35]' 
                            : user.tier === 'pro'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-[#f0f4f9] text-[#444746]'
                        }`}>
                          {user.tier === 'pro' && <Sparkles size={11} />}
                          {user.tier}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#444746]">
                        {user.messageCount} chats
                      </td>
                      <td className="py-3.5 px-4 text-[#727775]">
                        {new Date(user.lastActive).toLocaleDateString('nl-NL', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex rounded-full border border-[#e1e3e1] p-0.5 bg-[#f0f4f9]">
                          <button
                            onClick={() => handleTierChange(user.id, 'free')}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                              user.tier === 'free' ? 'bg-white text-[#1f1f1f] shadow-xs' : 'text-[#727775] hover:text-[#1f1f1f]'
                            }`}
                          >
                            Free
                          </button>
                          <button
                            onClick={() => handleTierChange(user.id, 'pro')}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                              user.tier === 'pro' ? 'bg-amber-500 text-white shadow-xs' : 'text-[#727775] hover:text-[#1f1f1f]'
                            }`}
                          >
                            Pro
                          </button>
                          <button
                            onClick={() => handleTierChange(user.id, 'admin')}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                              user.tier === 'admin' ? 'bg-[#0b57d0] text-white shadow-xs' : 'text-[#727775] hover:text-[#1f1f1f]'
                            }`}
                          >
                            Admin
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: System & Failover Health */}
        {activeTab === 'system' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#1f1f1f]">Realtime AI Cloud & On-Premises Status</h3>
              <p className="text-xs text-[#444746]">
                Automatische hybride routing: snelle reacties via Groq LPU en Perplexity met lokale homeserver als backup.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Groq Cloud */}
              <div className="p-5 rounded-3xl bg-[#f8fafd] border border-[#e1e3e1] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    ⚡
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Primair (Actief)
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1f1f1f]">Groq LPU Cloud</h4>
                  <p className="text-xs text-[#444746] mt-0.5">GPT-OSS 120B / Qwen 2.5 32B</p>
                </div>
                <div className="pt-2 border-t border-[#e1e3e1] space-y-1.5 text-xs text-[#444746]">
                  <div className="flex justify-between">
                    <span>Latency:</span>
                    <span className="font-mono text-emerald-700 font-semibold">~180ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Doorvoersnelheid:</span>
                    <span className="font-mono font-semibold">~450 tokens/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime SLA:</span>
                    <span className="font-mono font-semibold">99.98%</span>
                  </div>
                </div>
              </div>

              {/* Perplexity Live Web */}
              <div className="p-5 rounded-3xl bg-[#f8fafd] border border-[#e1e3e1] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    🌐
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Gereed
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1f1f1f]">Perplexity Sonar</h4>
                  <p className="text-xs text-[#444746] mt-0.5">Sonar Pro & Reasoning Live Web</p>
                </div>
                <div className="pt-2 border-t border-[#e1e3e1] space-y-1.5 text-xs text-[#444746]">
                  <div className="flex justify-between">
                    <span>Live Web Search:</span>
                    <span className="font-semibold text-blue-700">Geactiveerd</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Citaties & Bronnen:</span>
                    <span className="font-semibold">Realtime</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-mono font-semibold">Online</span>
                  </div>
                </div>
              </div>

              {/* Homeserver Node */}
              <div className="p-5 rounded-3xl bg-[#f8fafd] border border-[#e1e3e1] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                    🏠
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Standby Fallback
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1f1f1f]">Homeserver (Hoeve)</h4>
                  <p className="text-xs text-[#444746] mt-0.5">Tailscale Funnel / Ollama</p>
                </div>
                <div className="pt-2 border-t border-[#e1e3e1] space-y-1.5 text-xs text-[#444746]">
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <span className="font-mono text-xs">vrije-praat-snel</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failover modus:</span>
                    <span className="font-semibold text-amber-700">Standby (CPU safe)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tailscale Funnel:</span>
                    <span className="font-mono font-semibold">Actief</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Failover Protocol Explainer */}
            <div className="p-5 rounded-2xl bg-[#f0f4f9] border border-[#e1e3e1] text-xs text-[#444746] leading-relaxed">
              <div className="font-bold text-[#1f1f1f] mb-1 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#0b57d0]" />
                Zero-Downtime Architectuur
              </div>
              Wanneer de homeserver offline is of overbelast raakt door CPU-beperkingen, schakelt Junie automatisch en zonder hapering door naar Groq LPU (GPT-OSS 120B) of Perplexity Sonar. Alle audit logs worden lokaal gebufferd en gesynchroniseerd zodra de verbinding hersteld is.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
