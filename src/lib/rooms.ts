export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  topic?: string;
  isPrivate?: boolean;
  memberCount: number;
}

const ROOMS_STORAGE_KEY = 'junie_chat_rooms';
const ROOM_MESSAGES_PREFIX = 'junie_room_msg_';

export const DEFAULT_ROOMS: ChatRoom[] = [
  {
    id: 'room-algemeen',
    name: '#algemeen',
    description: 'Centrale conversatieruimte voor algemene vragen en snelle assistentie',
    topic: 'Open AI conversatie',
    memberCount: 142
  },
  {
    id: 'room-psychologie',
    name: '#psychologie-dynamieken',
    description: 'Ongefilterde analyses van gedragspatronen, beïnvloeding en dynamieken',
    topic: 'Gedrag & Analyse',
    memberCount: 89
  },
  {
    id: 'room-code',
    name: '#code-architectuur',
    description: 'Full-stack engineering, TypeScript, Python en latency-optimalisatie',
    topic: 'Software Engineering',
    memberCount: 67
  },
  {
    id: 'room-onderzoek',
    name: '#onderzoek-synthese',
    description: 'NotebookLM gestuurde syntheses, documentextractie en validatie',
    topic: 'Onderzoek & Synthese',
    memberCount: 54
  }
];

export const getRooms = (): ChatRoom[] => {
  try {
    const raw = localStorage.getItem(ROOMS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(DEFAULT_ROOMS));
      return DEFAULT_ROOMS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ROOMS;
  }
};

export const createRoom = (name: string, description: string): ChatRoom => {
  const rooms = getRooms();
  const cleanName = name.startsWith('#') ? name : `#${name.toLowerCase().replace(/\s+/g, '-')}`;
  const newRoom: ChatRoom = {
    id: `room-${Date.now()}`,
    name: cleanName,
    description: description || 'Thematische discussieruimte',
    topic: cleanName.replace('#', ''),
    memberCount: 1
  };
  const updated = [...rooms, newRoom];
  localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(updated));
  return newRoom;
};

export const getRoomMessages = (roomId: string): { role: string; content: string }[] => {
  try {
    const raw = localStorage.getItem(`${ROOM_MESSAGES_PREFIX}${roomId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveRoomMessages = (roomId: string, messages: { role: string; content: string }[]) => {
  try {
    // Keep last 100 messages per room
    const trimmed = messages.slice(-100);
    localStorage.setItem(`${ROOM_MESSAGES_PREFIX}${roomId}`, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save room messages:', err);
  }
};
