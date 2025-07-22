import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/chatrooms`,
});

export const fetchChatRooms = async () => {
    const response = await api.get('');
    return response.data;
};

export const createChatRoom = async (roomId: string) => {
    await api.post('', null, { params: { roomId } });
};

export const joinChatRoom = async (roomId: string, userId: string) => {
    await api.post(`/${roomId}/join`, null, { params: { userId } });
};