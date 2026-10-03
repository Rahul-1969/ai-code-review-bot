import { useState, useEffect } from 'react';

export default function useTaskProgress(taskId) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Waiting...");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    const wsUrl = `ws://localhost:8000/ws/progress/${taskId}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.progress !== undefined) setProgress(data.progress);
        if (data.status !== undefined) setStatus(data.status);
      } catch (error) {
        console.error("Failed to parse websocket message", error);
      }
    };

    socket.onclose = () => {
      setConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [taskId]);

  return { progress, status, connected };
}
