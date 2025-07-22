import { create } from 'zustand';

interface ChatStore {
    nickname: string;
    setNickname: (name: string) => void;
    chatRooms: string[];
    setChatRooms: (rooms: string[]) => void;
}

const useChatStore = create<ChatStore>((set) => ({
    nickname: '',
    setNickname: (name) => set({ nickname: name }),
    chatRooms: [],
    setChatRooms: (rooms) => set({ chatRooms: rooms }),
}));

export default useChatStore;