import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Box, Typography, TextField, Button } from '@mui/material';
import useChatStore from '../store/chatStore';

const ChatRoomPage = () => {
    const { roomId } = useParams();
    const { nickname } = useChatStore();
    const [messages, setMessages] = useState<string[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // WebSocket Endpoint 생성 (SockJS 사용)
        const socket = new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws`);
        const client = new Client({
            webSocketFactory: () => socket, // SockJS를 사용한 WebSocket 팩토리 설정
            debug: (str) => console.log(str), // 디버깅 로그
            onConnect: () => {
                console.log('Connected to WebSocket');

                // 특정 채팅방 구독
                client.subscribe(`/topic/${roomId}`, (msg) => {
                    setMessages((prev) => [...prev, msg.body]);
                });
            },
            onDisconnect: () => {
                console.log('Disconnected from WebSocket');
            },
        });

        // WebSocket 클라이언트 활성화
        client.activate();

        // 컴포넌트 언마운트 시 WebSocket 비활성화
        return () => { client.deactivate() };
    }, [roomId]);

    const handleSendMessage = () => {
        if (message) {
            // /app/chat/{roomId}에 메시지 전달
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chatrooms/${roomId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(`${nickname}: ${message}`),
            });
            setMessage('');
        }
    };

    return (
        <Box p={3}>
            <Typography variant="h4">{roomId} Chat Room</Typography>
            <Box mt={2} height={300} overflow="auto" border={1} p={2}>
                {messages.map((msg, idx) => (
                    <Typography key={idx}>{msg}</Typography>
                ))}
            </Box>
            <Box mt={2}>
                <TextField
                    label="Message"
                    fullWidth
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <Button onClick={handleSendMessage} variant="contained" sx={{ mt: 1 }}>
                    Send
                </Button>
            </Box>
        </Box>
    );
};

export default ChatRoomPage;