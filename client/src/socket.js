import { io } from 'socket.io-client';

// Environment variable se backend URL lo (deployment ke liye)
// Agar env variable set nahi hai, to localhost fallback use karo (local development ke liye)
const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const socket = io(socketUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

export default socket;