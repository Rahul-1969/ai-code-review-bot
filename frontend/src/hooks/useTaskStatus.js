import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function useTaskStatus(taskId) {
  const [prevTaskId, setPrevTaskId] = useState(taskId);
  const [taskStatus, setTaskStatus] = useState("PENDING");
  const [taskResult, setTaskResult] = useState(null);

  if (taskId !== prevTaskId) {
    setPrevTaskId(taskId);
    setTaskStatus("PENDING");
    setTaskResult(null);
  }

  useEffect(() => {
    if (!taskId) return;

    let intervalId;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`${BASE_URL}/tasks/${taskId}`);
        if (response.ok) {
          const data = await response.json();
          setTaskStatus(data.status);

          if (data.status === "SUCCESS") {
            setTaskResult(data.result);
            clearInterval(intervalId);
          } else if (data.status === "FAILURE") {
            clearInterval(intervalId);
          }
        }
      } catch (error) {
        console.error("Error fetching task status:", error);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [taskId]);

  return { taskStatus, taskResult };
}
