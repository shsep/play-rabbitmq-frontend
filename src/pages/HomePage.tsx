import { useState, useEffect } from 'react';
import { Button, TextField, Box, Typography, List, ListItem, ListItemButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../store/chatStore';
import { fetchChatRooms, createChatRoom } from '../services/apiService';

const HomePage = () => {
    const [newRoom, setNewRoom] = useState('');
    const { nickname, setNickname, chatRooms, setChatRooms } = useChatStore();
    const [tempNickname, setTempNickname] = useState(nickname);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const loadRooms = async () => {
            setLoading(true);
            try {
                const rooms = await fetchChatRooms();
                console.log(rooms);
                setChatRooms(rooms);
            } catch (err) {
                setError('Failed to load chat rooms.');
            } finally {
                setLoading(false);
            }
        };

        loadRooms();
    }, [setChatRooms]);



    const handleCreateRoom = async () => {
        if (newRoom) {
            await createChatRoom(newRoom);
            setChatRooms(await fetchChatRooms());
            setNewRoom('');
        }
    };

    const handleSaveNickname = () => {
        setNickname(tempNickname);
    };

    return (
        <Box p={3}>
            <Typography variant="h4" mb={2}>Welcome to Chat Service</Typography>
            <Box mb={3}>
                <TextField
                    label="Set Nickname"
                    value={tempNickname}
                    onChange={(e) => setTempNickname(e.target.value)}
                />
                <Button onClick={handleSaveNickname} variant="contained" sx={{ ml: 1 }}>
                    Save
                </Button>
            </Box>
            <Typography variant="h6">Chat Rooms</Typography>
            {loading ? (
                <Typography>Loading chat rooms...</Typography>
            ) : error ? (
                <Typography color="error">{error}</Typography>
            ) : (
                <List>
                    {chatRooms.map((room) => (
                        <ListItem key={room}>
                            <ListItemButton onClick={() => navigate(`/chatroom/${room}`)}>
                                {room}
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
                />
                <Button onClick={handleCreateRoom} variant="contained" sx={{ ml: 1 }}>
                    Create
                </Button>
            </Box>
        </Box>
    );
};

export default HomePage;