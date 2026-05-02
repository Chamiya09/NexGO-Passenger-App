import { io, Socket } from 'socket.io-client';

import { API_BASE_URL } from './api';

const SOCKET_SERVER_URL = API_BASE_URL.replace(/\/api$/, '');

const passengerSocket: Socket = io(SOCKET_SERVER_URL, {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionAttempts: Infinity,
});

passengerSocket.on('connect', () => {
  console.log('[PassengerSocket] Connected:', passengerSocket.id);
});

passengerSocket.on('disconnect', (reason) => {
  console.log('[PassengerSocket] Disconnected:', reason);
});

export default passengerSocket;
