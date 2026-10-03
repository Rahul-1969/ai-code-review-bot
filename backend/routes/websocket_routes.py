import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from websocket_manager.connection_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/progress/{task_id}")
async def websocket_progress(websocket: WebSocket, task_id: str):
    await manager.connect(task_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(task_id)
    except Exception as e:
        logger.error(f"WebSocket error for task {task_id}: {str(e)}")
        manager.disconnect(task_id)
