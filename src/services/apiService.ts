import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/chatrooms`,
});

export const fetchChatRooms = async () => {
    const response = await api.get('');
    return response.data.map((room: any) => ({
        roomId: room.roomId,
        creator: room.creator,
        title: room.title,
        createdAt: room.createdAt,
    }));
};

export const fetchChatRoom = async (roomId: string) => {
    const response = await api.get('/' + roomId + '/details');
    const room = response.data;
    return {
        roomId: room.roomId,
        creator: room.creator,
        title: room.title,
        createdAt: room.createdAt,
    };
};

export const createChatRoom = async (creator: string, title: string) => {
    await api.post('', null, { params: { creator, title } });
};

export const joinChatRoom = async (roomId: string, nickname: string) => {
    await api.post(`/${roomId}/join`, null, { params: { nickname } });
};

export const leaveChatRoom = async (roomId: string, nickname: string) => {
    await api.post(`/${roomId}/leave`, null, { params: { nickname } });
};