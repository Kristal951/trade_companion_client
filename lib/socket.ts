import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (token?: string) => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket"],
      withCredentials: true,
      autoConnect: false,
    });
  }

  if (token) {
    socket.auth = { token };
  }

  return socket;
};