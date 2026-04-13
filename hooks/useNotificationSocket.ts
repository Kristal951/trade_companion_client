import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import useNotificationStore from "@/store/useNotificationStore";
import useAppStore from "@/store/useStore";
import { refreshAccessToken, setAccessToken } from "@/utils";

let socket: Socket | null = null;

export default function useNotificationSocket() {
  const pushRealtimeNotification = useNotificationStore(
    (state) => state.pushRealtimeNotification,
  );

  const accessToken = useAppStore((state) => state.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    if (!socket) {
      socket = io(import.meta.env.VITE_API_URL, {
        transports: ["websocket"],
        withCredentials: true,
        autoConnect: false,
      });
    }

    socket.auth = { token: accessToken };

    const handleConnect = () => {
      console.log("✅ Notification socket connected:", socket?.id);
    };

    const handleDisconnect = (reason: string) => {
      console.log("❌ Notification socket disconnected:", reason);
    };

    const handleNotification = (notification: any) => {
      console.log("🔥 RECEIVED NOTIFICATION:", notification);
      pushRealtimeNotification(notification);
    };

    const handleConnectError = async (err: any) => {
      console.error("❌ Socket connection error:", err.message);

      if (
        err.message === "jwt expired" ||
        err.message === "Authentication failed"
      ) {
        try {
          const newToken = await refreshAccessToken();

          if (newToken && socket) {
            setAccessToken(newToken);

            useAppStore.setState({ accessToken: newToken });

            socket.auth = { token: newToken };

            if (!socket.connected) {
              socket.connect();
            }
          }
        } catch (error) {
          console.error("Refresh failed:", error);
          useAppStore.setState({ accessToken: null });
          window.location.replace("/auth/signin");
        }
      }
    };

    socket.off("connect", handleConnect);
    socket.off("disconnect", handleDisconnect);
    socket.off("notification:new", handleNotification);
    socket.off("connect_error", handleConnectError);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("notification:new", handleNotification);
    socket.on("connect_error", handleConnectError);
    socket.on("trade:update", (data) => {
      console.log("Trade update:", data);
    });
    socket.on("trade_update", (event) => {
      alert('trade event received')
      console.log("Trade update received:", event);
    });

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      if (!socket) return;

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("notification:new", handleNotification);
      socket.off("connect_error", handleConnectError);
    };
  }, [accessToken, pushRealtimeNotification]);
}


