import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Box, Typography, TextField, Button } from '@mui/material';
import useChatStore from '../store/chatStore';

const ChatRoomPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate(); // 리다이렉트를 위해 useNavigate 사용
    const { nickname, setNickname } = useChatStore();
    const [messages, setMessages] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const messageInputRef = useRef<HTMLInputElement | null>(null);
    const [isComposing, setIsComposing] = useState(false); // IME 조합 상태 추적

    useEffect(() => {
        // 닉네임을 로컬 스토리지에서 가져오기
        const savedNickname = localStorage.getItem('nickname');

        // 닉네임이 없으면 홈으로 리다이렉트
        if (!savedNickname) {
            navigate('/');
            return;
        }

        // 닉네임이 있으면 Zustand store에 설정
        setNickname(savedNickname);
    }, [setNickname, navigate]);

    useEffect(() => {
        if (!nickname) return;

        let socket: WebSocket | null = null;
        let client: Client | null = null;

        const connectWebSocket = () => {
            console.log('Attempting to connect WebSocket...');

            // WebSocket 및 STOMP 클라이언트 생성
            socket = new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws`);
            client = new Client({
                webSocketFactory: () => socket!,
                debug: (str) => console.log(`STOMP: ${str}`),
                reconnectDelay: 5000, // 자동 재연결 간격(ms)
                heartbeatIncoming: 10000, // 서버->클라이언트 하트비트(ms)
                heartbeatOutgoing: 10000, // 클라이언트->서버 하트비트(ms)
                onConnect: () => {
                    console.log('STOMP connected successfully!');

                    // 구독 로직 및 메시지 핸들러
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
                }
            });

            // 클라이언트 활성화
            client.activate();
        };

        const cleanupConnection = () => {
            client?.deactivate();
            socket?.close();
        };

        // 초기 연결
        connectWebSocket();

        const reconnectInterval = setInterval(() => {
            if (client && !client.connected) {
                console.warn('Detected inactive WebSocket connection. Reinitializing...');
                cleanupConnection(); // 기존 연결 정리
                connectWebSocket(); // 새로운 WebSocket 연결 시도
            }
        }, 10000); // 매 10초마다 활성 상태 확인 및 재연결

        // 컴포넌트 언마운트 시 정리
        return () => {
            clearInterval(reconnectInterval);
            cleanupConnection();
        };
    }, [roomId, nickname]);

    const handleSendMessage = () => {
        if (message) {
            // /app/chat/{roomId}에 메시지 전달
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chatrooms/${roomId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname, message }),
            });
            setMessage('');
            messageInputRef.current?.focus(); // 입력 필드 포커싱
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // IME 조합 상태인 경우 Enter 키 이벤트 무시
        if (isComposing) return;

        if (e.key === 'Enter') {
            e.preventDefault(); // 기본 동작 방지
            handleSendMessage();
        }
    };

    const handleCompositionStart = () => {
        setIsComposing(true); // 조합 상태 시작
    };

    const handleCompositionEnd = () => {
        setIsComposing(false); // 조합 상태 종료
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
                    onKeyDown={handleKeyDown} // 엔터 키 이벤트 핸들러 추가
                    onCompositionStart={handleCompositionStart} // IME 조합 시작
                    onCompositionEnd={handleCompositionEnd} // IME 조합 종료
                    inputRef={messageInputRef} // 입력 필드를 참조
                />
                <Button onClick={handleSendMessage} variant="contained" sx={{ mt: 1 }}>
                    Send
                </Button>
            </Box>
        </Box>
    );
};

export default ChatRoomPage;