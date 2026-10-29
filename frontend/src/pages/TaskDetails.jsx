import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./TaskDetails.css";

const formatDate = (value) => {
  if (!value) return "—";

  // PostgreSQL DATE: preserve the calendar date
  const raw = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  // Timestamp: display the date in India time
  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};


function TaskDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await api.get(`/api/tasks/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

               
console.log("Task Details API:", response.data.task);
console.log("Raw start_date:", response.data.task?.start_date);
console.log("Raw end_date:", response.data.task?.end_date);

setTask(response.data.task);

            } catch (error) {
                console.error(error);

                setError(
                    error.response?.data?.message ||
                    "Failed to load task"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTask();
    }, [id]);

    if (loading) {
        return <h2>Loading task...</h2>;
    }

    if (error) {
        return (
            <div>
                <h2>{error}</h2>

                <button onClick={() => navigate("/tasks")}>
                    Back to Tasks
                </button>
            </div>
        );
    }

    if (!task) {
        return <h2>Task not found</h2>;
    }
    return (
        <div className="task-details-page">

            <div className="task-details-container">

                <button
                    className="back-btn"
                    onClick={() => navigate("/tasks")}
                >
                    ← Back to Tasks
                </button>

                <div className="task-card">

                    <div className="task-header">

                        <div>
                            <h1>{task.title}</h1>

                            <p className="task-description">
                                {task.description || "No description"}
                            </p>
                        </div>

                        <span className="task-status">
                            {task.status}
                        </span>

                    </div>

                    <div className="task-info-grid">

                        <div className="info-box">
                            <label>Priority</label>
                            <strong>{task.priority || "-"}</strong>
                        </div>

                        <div className="info-box">
                            <label>Assigned To</label>
                            <strong>
                                {task.assigned_to_name || "-"}
                            </strong>
                        </div>

                        <div className="info-box">
                            <label>Created By</label>
                            <strong>
                                {task.created_by_name || "-"}
                            </strong>
                        </div>

                        <div className="info-box">
                            <label>Department</label>
                            <strong>
                                {task.department_name || "-"}
                            </strong>
                        </div>

                        <div className="info-box">
                            <label>Project</label>
                            <strong>
                                {task.project_name || "-"}
                            </strong>
                        </div>

                        
<div className="info-box">
  <label>Start Date</label>
  <strong>{formatDate(task.start_date)}</strong>
</div>

<div className="info-box">
  <label>End Date</label>
  <strong>
    {task.end_date
      ? formatDate(task.end_date)
      : "Not completed yet"}
  </strong>
</div>

                        <div className="info-box">
                            <label>Remarks</label>
                            <strong>
                                {task.remarks || "No remarks"}
                            </strong>
                        </div>

                    </div>

                    <div className="progress-section">

                        <label>
                            Progress: {task.progress || 0}%
                        </label>

                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${task.progress || 0}%`
                                }}
                            />
                        </div>

                    </div>

                    <div className="task-actions">

                        <button
                            className="edit-btn"
                            onClick={() =>
                                navigate(`/edit-task/${task.id}`)
                            }
                        >
                            Edit Task
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default TaskDetails;