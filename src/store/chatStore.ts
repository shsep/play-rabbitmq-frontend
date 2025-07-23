import { create } from 'zustand';

interface ChatRoom {
    roomId: string;
    creator: string;
    title: string;
    createdAt: string; // ISO8601 문자열 타입
}

interface ChatStore {
    nickname: string;
    setNickname: (name: string) => void;
    chatRooms: ChatRoom[];
    setChatRooms: (rooms: ChatRoom[]) => void;
}

const useChatStore = create<ChatStore>((set) => ({
    nickname: '',
    setNickname: (name) => set({ nickname: name }),
    chatRooms: [],
    setChatRooms: (rooms) => set({ chatRooms: rooms }),
}));

export default useChatStore;