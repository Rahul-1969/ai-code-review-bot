import logging

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


import asyncio

class ConnectionManager:
    """Manages active WebSocket connections by task ID."""

    def __init__(self) -> None:
        self.active_connections: dict[str, WebSocket] = {}
        self.main_loop = None

    async def connect(self, task_id: str, websocket: WebSocket) -> None:
        """Accept a websocket connection and store it by task_id."""
        if self.main_loop is None:
            self.main_loop = asyncio.get_running_loop()

        await websocket.accept()
        self.active_connections[task_id] = websocket
        logger.debug(f"WebSocket connected for task: {task_id}")

    def disconnect(self, task_id: str) -> None:
        """Safely remove a websocket connection from the active pool."""
        if task_id in self.active_connections:
            del self.active_connections[task_id]
            logger.debug(f"WebSocket disconnected for task: {task_id}")

    async def send_progress(self, task_id: str, message: dict) -> None:
        """Send a JSON payload to a specific task's websocket connection."""
        if task_id in self.active_connections:
            websocket = self.active_connections[task_id]
            try:
                await websocket.send_json(message)
            except WebSocketDisconnect:
                self.disconnect(task_id)
            except Exception as e:
                logger.error(f"Error sending progress to {task_id}: {str(e)}")
                self.disconnect(task_id)

    async def broadcast(self, message: dict) -> None:
        """Broadcast a JSON payload to all active websocket connections."""
        for task_id in list(self.active_connections.keys()):
            websocket = self.active_connections.get(task_id)
            if websocket:
                try:
                    await websocket.send_json(message)
                except WebSocketDisconnect:
                    self.disconnect(task_id)
                except Exception as e:
                    logger.error(f"Error broadcasting to {task_id}: {str(e)}")
                    self.disconnect(task_id)


manager = ConnectionManager()
