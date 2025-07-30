import React, { useState, useEffect } from "react";
import {
    TextField,
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    Button,
    Alert,
    Paper,
    Stack,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import useChatStore from "../store/chatStore";
import { fetchChatRooms, createChatRoom } from "../services/apiService";

// MUI 커스텀 테마 설정
const theme = createTheme({
    palette: {
        primary: {
            main: "#4CAF50",
        },
        secondary: {
            main: "#FFC107",
        },
        background: {
            default: "#f4f6f8",
        },
    },
    typography: {
        fontFamily: "Roboto, Arial, sans-serif",
    },
});

export default function HomePage() {
    const [newRoom, setNewRoom] = useState("");
    const { nickname, setNickname, chatRooms, setChatRooms } = useChatStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [formError, setFormError] = useState("");

    useEffect(() => {
        const savedNickname = localStorage.getItem("nickname");
        if (savedNickname) {
            setNickname(savedNickname);
        }
    }, [setNickname]);

    useEffect(() => {
        const loadRooms = async () => {
            setLoading(true);
            try {
                const rooms = await fetchChatRooms();
                setChatRooms(rooms);
            } catch (err) {
                setError("채팅방 목록을 불러오는 데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        loadRooms();
    }, [setChatRooms]);

    const handleNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newNickname = event.target.value;
        setNickname(newNickname);
        localStorage.setItem("nickname", newNickname);
    };

    const handleCreateRoom = async () => {
        if (!nickname) {
            setFormError("닉네임을 설정해주세요.");
            return;
        }
        if (!newRoom) {
            setFormError("채팅방 제목을 입력하세요.");
            return;
        }

        try {
            await createChatRoom(nickname, newRoom);
            setChatRooms(await fetchChatRooms());
            setNewRoom("");
            setFormError("");
        } catch (err) {
            console.error("Failed to create chat room:", err);
            setFormError("채팅방 생성이 실패했습니다. 다시 시도해주세요.");
        }
    };

    const handleRoomClick = (roomId: string) => {
        if (!nickname) {
            setFormError("닉네임을 설정해주세요.");
            return;
        }
        navigate(`/chatroom/${roomId}`);
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
                    backgroundImage: "linear-gradient(to bottom, #e3f2fd, #ffffff)",
                }}
            >
                <Paper
                    elevation={6}
                    sx={{
                        width: "100%",
                        maxWidth: "800px",
                        borderRadius: "16px",
                        overflow: "hidden",
                        p: 4,
                        backgroundColor: "#ffffff",
                    }}
                >
                    <Typography
                        variant="h4"
                        textAlign="center"
                        mb={4}
                        color="primary"
                        sx={{ fontWeight: "bold" }}
                    >
                        오픈 채팅방
                    </Typography>

                    {/* 닉네임 설정 섹션 */}
                    <Box mb={3}>
                        <Typography variant="h6" mb={1}>
                            닉네임 설정
                        </Typography>
                        <TextField
                            label="닉네임"
                            value={nickname}
                            onChange={handleNicknameChange}
                            fullWidth
                            size="small" // TextField 높이 줄이기
                            slotProps={{
                                input: {
                                    style: { height: "40px" }, // 텍스트 필드 높이 지정
                                },
                            }}
                        />
                    </Box>

                    {/* 오류 출력 섹션 */}
                    {formError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {formError}
                        </Alert>
                    )}

                    {/* 채팅방 생성 섹션 */}
                    <Box mb={3}>
                        <Typography variant="h6" mb={1}>
                            새 채팅방 만들기
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <TextField
                                label="새 채팅방 제목"
                                value={newRoom}
                                onChange={(e) => setNewRoom(e.target.value)}
                                fullWidth
                                size="small" // TextField 높이 줄이기
                                slotProps={{
                                    input: {
                                        style: { height: "40px" }, // 텍스트 필드 높이 지정
                                    },
                                }}
                            />
                            <Button
                                onClick={handleCreateRoom}
                                variant="contained"
                                color="primary"
                                sx={{ height: '40px', minWidth: '100px' }} // Button 높이 및 넓이 조정
                            >
                            생성
                            </Button>
                        </Stack>
                    </Box>

                    {/* 채팅방 리스트 섹션 */}
                    <Typography variant="h6" mb={2}>
                        채팅방 목록
                    </Typography>
                    {loading ? (
                        <Typography>채팅방 목록을 불러오는 중...</Typography>
                    ) : error ? (
                        <Typography color="error">{error}</Typography>
                    ) : (
                        <List
                            sx={{
                                borderRadius: "8px",
                                overflowY: "auto",
                                maxHeight: "300px",
                                border: "1px solid #ddd",
                                backgroundColor: "#fafafa",
                            }}
                        >
                            {chatRooms.map((room) => (
                                <ListItem
                                    key={room.roomId}
                                    disablePadding
                                    sx={{ "&:hover": { backgroundColor: "#f1f1f1" } }}
                                >
                                    <ListItemButton onClick={() => handleRoomClick(room.roomId)}>
                                        <Box>
                                            <Typography variant="body1" fontWeight="bold">
                                                {room.title}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="textSecondary"
                                                sx={{ fontStyle: "italic" }}
                                            >
                                                {`생성자: ${room.creator} (${new Date(
                                                    room.createdAt
                                                ).toLocaleString()})`}
                                            </Typography>
                                        </Box>
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Paper>
            </Box>
        </ThemeProvider>
    );
}