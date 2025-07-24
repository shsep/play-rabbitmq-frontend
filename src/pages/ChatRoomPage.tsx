import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Box, Typography, TextField, Button } from '@mui/material';
import useChatStore from '../store/chatStore';
import { joinChatRoom, leaveChatRoom } from '../services/apiService';

const ChatRoomPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { nickname, setNickname } = useChatStore();
    const [messages, setMessages] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const messageInputRef = useRef<HTMLInputElement | null>(null);
    const [isComposing, setIsComposing] = useState(false);

    useEffect(() => {
        const savedNickname = localStorage.getItem('nickname');

        if (!savedNickname) {
            navigate('/');
            return;
        }

        setNickname(savedNickname);

        // Join Chat Room (API 호출)
        const enterRoom = async () => {
            try {
                await joinChatRoom(roomId!, savedNickname);
            } catch (err) {
                console.error('Failed to join chat room:', err);
                navigate('/');
            }
        };

        enterRoom();
    }, [roomId, navigate, setNickname]);

    useEffect(() => {
        if (!nickname) return;

        let socket: WebSocket | null = null;
        let client: Client | null = null;

        const connectWebSocket = () => {
            console.log('Attempting to connect WebSocket...');
            socket = new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws`);
            client = new Client({
                webSocketFactory: () => socket!,
                debug: (str) => console.log(`STOMP: ${str}`),
                reconnectDelay: 5000,
                heartbeatIncoming: 10000,
                heartbeatOutgoing: 10000,
                onConnect: () => {
                    console.log('STOMP connected successfully!');
                    client?.subscribe(`/topic/${roomId}`, (msg) => {
                        console.log('Received message:', msg.body);
                        setMessages((prev) => [...prev, msg.body]);
                    });
                },
                onStompError: (frame) => {
                    console.error(`STOMP error: ${frame.headers['message']} | details: ${frame.body}`);
                },
                onWebSocketClose: () => {
                    console.warn('WebSocket connection has been forcibly closed.');

                    // Leave Chat Room (API 호출)
                    const exitRoom = async () => {
                        try {
                            await leaveChatRoom(roomId!, nickname);
                        } catch (err) {
                            console.error('Failed to leave chat room:', err);
                        }
                    };

                    exitRoom();
                },
            });

            client.activate();
        };

        const cleanupConnection = () => {
            client?.deactivate();
            socket?.close();
        };

        connectWebSocket();

        const reconnectInterval = setInterval(() => {
            if (client && !client.connected) {
                console.warn('Detected inactive WebSocket connection. Reinitializing...');
                cleanupConnection();
                connectWebSocket();
            }
        }, 10000);

        return () => {
            clearInterval(reconnectInterval);
            cleanupConnection();
        };
    }, [roomId, nickname]);

    const handleSendMessage = () => {
        if (message) {
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chatrooms/${roomId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname, message }),
            });
            setMessage('');
            messageInputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isComposing) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleCompositionStart = () => {
        setIsComposing(true);
    };

    const handleCompositionEnd = () => {
        setIsComposing(false);
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
                    onKeyDown={handleKeyDown}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    inputRef={messageInputRef}
                />
                <Button onClick={handleSendMessage} variant="contained" sx={{ mt: 1 }}>
                    Send
                </Button>
            </Box>
        </Box>
    );
};

export default ChatRoomPage;