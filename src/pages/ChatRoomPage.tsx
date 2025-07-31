import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Stack,
    ThemeProvider,
    createTheme,
} from "@mui/material";
import useChatStore from "../store/chatStore";
import type { ChatRoom } from "../store/chatStore";
import { fetchChatRoom } from "../services/apiService";

// MUI 커스텀 테마 설정
const theme = createTheme({
    palette: {
        primary: {
            main: "#1976d2",
        },
        secondary: {
            main: "#ff9800",
        },
        background: {
            default: "#f4f6f8",
        },
    },
    typography: {
        fontFamily: "Roboto, Arial, sans-serif",
    },
});

const ChatRoomPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { nickname, setNickname } = useChatStore();
    const [roomDetails, setRoomDetails] = useState<ChatRoom>();
    const [messages, setMessages] = useState<string[]>([]);
    const [message, setMessage] = useState("");
    const messageInputRef = useRef<HTMLInputElement | null>(null);
    const [isComposing, setIsComposing] = useState(false);

    useEffect(() => {
        const savedNickname = localStorage.getItem("nickname");

        if (!savedNickname) {
            navigate("/");
            return;
        }

        setNickname(savedNickname);

        const loadRoom = async () => {
            try {
                if (!roomId) return;
                const room = await fetchChatRoom(roomId); // API 호출
                setRoomDetails(room);
            } catch (err) {
                console.error("Failed to load chat room:", err);
            }
        };

        loadRoom();
    }, [roomId, navigate, setNickname]);

    useEffect(() => {
        if (!nickname) return;

        let socket: WebSocket | null = null;
        let client: Client | null = null;

        const connectWebSocket = () => {
            console.log("Attempting to connect WebSocket...");
            socket = new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws`);

            client = new Client({
                webSocketFactory: () => socket!,
                debug: (str) => console.log(`STOMP: ${str}`),
                reconnectDelay: 5000,
                heartbeatIncoming: 10000,
                heartbeatOutgoing: 10000,
                connectHeaders: {
                    roomId: roomId || "",
                    nickname: nickname,
                },
                onConnect: () => {
                    console.log("STOMP connected successfully!");
                    client?.subscribe(`/topic/${roomId}`, (msg) => {
                        console.log("Received message:", msg.body);
                        setMessages((prev) => [...prev, msg.body]);
                    });
                },
                onStompError: (frame) => {
                    console.error(
                        `STOMP error: ${frame.headers["message"]} | details: ${frame.body}`
                    );
                },
                onDisconnect: () => {
                    console.log("Disconnected from STOMP server.");
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
                console.warn("Detected inactive WebSocket connection. Reinitializing...");
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
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname, message }),
            });
            setMessage("");
            messageInputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isComposing) return;

        if (e.key === "Enter") {
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
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    px: 2,
                    backgroundImage: "linear-gradient(to bottom, #e0f7fa, #ffffff)",
                }}
            >
                <Paper
                    elevation={6}
                    sx={{
                        p: 3,
                        width: "100%",
                        maxWidth: "800px",
                        borderRadius: "16px",
                    }}
                >
                    <Typography variant="h4" textAlign="center" mb={3} color="primary">
                        {roomDetails?.title || "채팅방"}
                    </Typography>

                    <Box
                        sx={{
                            mb: 3,
                            p: 2,
                            maxHeight: "300px",
                            overflowY: "auto",
                            border: "1px solid #ddd",
                            backgroundColor: "#f9f9f9",
                            borderRadius: "8px",
                        }}
                    >
                        {messages.map((msg, idx) => (
                            <Typography key={idx} variant="body1" gutterBottom>
                                {msg}
                            </Typography>
                        ))}
                    </Box>

                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="메시지 입력"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onCompositionStart={handleCompositionStart}
                            onCompositionEnd={handleCompositionEnd}
                            inputRef={messageInputRef}
                            fullWidth
                            size="small"
                            placeholder="메시지를 입력하세요..."
                            slotProps={{
                                input: {
                                    style: { height: "40px" },
                                },
                            }}
                        />
                        <Button
                            onClick={handleSendMessage}
                            variant="contained"
                            color="primary"
                            sx={{ height: "40px", minWidth: "100px" }}
                        >
                            보내기
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        </ThemeProvider>
    );
};

export default ChatRoomPage;