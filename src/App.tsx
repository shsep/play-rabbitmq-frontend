import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatRoomPage from './pages/ChatRoomPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/chatroom/:roomId" element={<ChatRoomPage />} />
            </Routes>
        </Router>
    );
}

export default App;