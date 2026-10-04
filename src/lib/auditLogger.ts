export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  roomId?: string;
  roomName?: string;
  role: 'user' | 'assistant';
  content: string;
  provider: string;
  model: string;
  tokensEstimated: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'pro' | 'admin';
  joinedAt: string;
  lastActive: string;
  messageCount: number;
}

const AUDIT_STORAGE_KEY = 'junie_audit_logs';
const USERS_STORAGE_KEY = 'junie_registered_users';

export const logChatMessage = (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'tokensEstimated'>) => {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    const logs: AuditLogEntry[] = raw ? JSON.parse(raw) : [];

    const newLog: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      tokensEstimated: Math.ceil(entry.content.length / 4)
    };

    // Keep last 1000 logs locally
    const updated = [newLog, ...logs].slice(0, 1000);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));

    // Update user stats
    updateUserActivity(entry.userEmail, entry.userId);

    // Optional fire-and-forget push to homeserver or Supabase
    pushLogRemote(newLog);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearAuditLogs = () => {
  localStorage.removeItem(AUDIT_STORAGE_KEY);
};

export const getUsers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      // Seed default admin and sample users
      const initial: UserProfile[] = [
        {
          id: 'usr-admin',
          email: 'ai',
          name: 'Niels (Admin)',
          tier: 'admin',
          joinedAt: '2026-09-01T10:00:00Z',
          lastActive: new Date().toISOString(),
          messageCount: 42
        },
        {
          id: 'usr-demo-1',
          email: 'gast@junie.ai',
          name: 'Demo Bezoeker',
          tier: 'free',
          joinedAt: '2026-10-04T12:30:00Z',
          lastActive: '2026-10-04T19:40:00Z',
          messageCount: 5
        }
      ];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const updateUserTier = (userId: string, tier: 'free' | 'pro' | 'admin') => {
  const users = getUsers();
  const updated = users.map(u => u.id === userId ? { ...u, tier } : u);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
};

const updateUserActivity = (email: string, userId: string) => {
  const users = getUsers();
  const existing = users.find(u => u.email === email || u.id === userId);
  
  if (existing) {
    const updated = users.map(u => {
      if (u.id === existing.id) {
        return {
          ...u,
          lastActive: new Date().toISOString(),
          messageCount: u.messageCount + 1
        };
      }
      return u;
    });
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
  } else {
    const newUser: UserProfile = {
      id: userId || `usr-${Date.now()}`,
      email: email || 'anoniem@junie.local',
      name: email.split('@')[0] || 'Nieuwe Gebruiker',
      tier: 'free',
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      messageCount: 1
    };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...users, newUser]));
  }
};

const pushLogRemote = async (log: AuditLogEntry) => {
  // Graceful attempt to log to homeserver if reachable
  try {
    fetch('https://hoeve.taila6882a.ts.net/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
      mode: 'no-cors'
    }).catch(() => {});
  } catch {}
};
