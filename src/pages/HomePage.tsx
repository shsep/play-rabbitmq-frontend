import { useState, useEffect } from 'react';
import { TextField, Box, Typography, List, ListItem, ListItemButton, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../store/chatStore';
import { fetchChatRooms, createChatRoom } from '../services/apiService';

const HomePage = () => {
    const [newRoom, setNewRoom] = useState('');
    const { nickname, setNickname, chatRooms, setChatRooms } = useChatStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        // 로컬 스토리지에 저장된 닉네임 불러오기
        const savedNickname = localStorage.getItem('nickname');
        if (savedNickname) {
            setNickname(savedNickname);
        }
    }, [setNickname]);

    useEffect(() => {
        const loadRooms = async () => {
            setLoading(true);
            try {
                const rooms = await fetchChatRooms(); // API 호출
                setChatRooms(rooms);
            } catch (err) {
                setError('Failed to load chat rooms.');
            } finally {
                setLoading(false);
            }
        };

        loadRooms();
    }, [setChatRooms]);

    const handleNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newNickname = event.target.value;
        setNickname(newNickname); // Zustand store에 닉네임 업데이트
        localStorage.setItem('nickname', newNickname); // 로컬 스토리지에 닉네임 저장
    };

    const handleCreateRoom = async () => {
        // 닉네임과 방 이름 입력 여부 검사
        if (!nickname) {
            setFormError('Please set your nickname before creating a room.');
            return;
        }
        if (!newRoom) {
            setFormError('Please enter a room title.');
            return;
        }

        try {
            await createChatRoom(nickname, newRoom); // creator: nickname, title: newRoom
            setChatRooms(await fetchChatRooms());
            setNewRoom('');
            setFormError(''); // 오류 메시지 초기화
        } catch (err) {
            console.error('Failed to create chat room:', err);
            setFormError('Failed to create chat room. Please try again.');
        }
    };

    const handleRoomClick = (roomId: string) => {
        // 닉네임이 설정되지 않으면 방 접속 불가
        if (!nickname) {
            setFormError('Please set your nickname before joining a room.');
            return;
        }
        navigate(`/chatroom/${roomId}`);
    };

    return (
        <Box p={3}>
            <Typography variant="h4" mb={2}>Welcome to Chat Service</Typography>
            <Box mb={3}>
                <TextField
                    label="Nickname"
                    value={nickname}
                    onChange={handleNicknameChange}
                    fullWidth
                />
            </Box>

            {formError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {formError}
                </Alert>
            )}

            <Typography variant="h6">Chat Rooms</Typography>
            {loading ? (
                <Typography>Loading chat rooms...</Typography>
            ) : error ? (
                <Typography color="error">{error}</Typography>
            ) : (
                <List>
                    {chatRooms.map((room) => (
                        <ListItem key={room.roomId}>
                            <ListItemButton onClick={() => handleRoomClick(room.roomId)}>
                                <Box>
                                    <Typography variant="body1">
                                        <strong>{room.title}</strong>
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Created by {room.creator} at {new Date(room.createdAt).toLocaleString()}
                                    </Typography>
                                </Box>
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            )}

            <Box mt={3}>
                <TextField
                    label="New Room"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    fullWidth
                />
                <Button onClick={handleCreateRoom} variant="contained" sx={{ mt: 1 }}>
                    Create Room
                </Button>
            </Box>
        </Box>
    );
};

export default HomePage;