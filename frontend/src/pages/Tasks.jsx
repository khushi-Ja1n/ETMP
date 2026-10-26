import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import "./Tasks.css";


function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");

  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await api.get("/api/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);

      setError(
        error.response?.data?.message ||
        "Failed to fetch tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);


  const formatDate = (value) => {
    if (!value) return "—";

    const raw = String(value);

    // PostgreSQL DATE returned directly as a date string
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw;
    }

    // Convert timestamps to Indian Standard Time
    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const part = (type) =>
      parts.find((item) => item.type === type)?.value;

    return `${part("year")}-${part("month")}-${part("day")}`;
  };


  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "status completed";

      case "in_progress":
        return "status progress";

      case "pending":
        return "status pending";

      default:
        return "status";
    }
  };



  const handleStatusChange = async (task, newStatus) => {
    try {
      const response = await api.put(`/tasks/${task.id}`, {
        status: newStatus,
      });


      // Backend se updated task lo
      const updatedTask = response.data.task;
      console.log("Updated task:", updatedTask);
      console.log("Updated end date:", updatedTask?.end_date);

      // Agar response mein task nahi mila, fresh list fetch karo
      if (!updatedTask) {
        await fetchTasks();
        return;
      }
      console.log("Tasks API response:", response.data.tasks);
      console.log(
        "End dates from API:",
        response.data.tasks?.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          end_date: task.end_date
        }))
      );

      setTasks((previousTasks) =>
        previousTasks.map((item) =>
          item.id === task.id
            ? { ...item, ...updatedTask }
            : item
        )

      );
    } catch (error) {
      console.error("Status update failed:", error);
      alert(
        error.response?.data?.message ||
        "Unable to update task status."
      );
    }
  };


  const handleDelete = async () => {
    if (!taskToDelete || deleting) return;

    try {
      setDeleting(true);
      setDeleteError("");

      const token = localStorage.getItem("token");

      await api.delete(`/api/tasks/${taskToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskToDelete.id)
      );

      setTaskToDelete(null);
      setNotice("Task deleted successfully.");
    } catch (error) {
      console.error("Delete task error:", error);

      setDeleteError(
        error.response?.data?.message ||
        "Unable to delete task. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };


  return (
    <div className="tasks-page">

      {/* Header */}
      <div className="tasks-header">

        <div>
          <h1>My Tasks</h1>
          <p>Manage and track your daily tasks</p>
        </div>

        <button
          onClick={() => navigate("/add-task")}
        >
          + Add Task
        </button>
        <button
          className="back-dashboard-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

      </div>

      {/* Loading */}
      {loading && (
        <p>Loading tasks...</p>
      )}

      {/* Error */}
      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {/* No Tasks */}
      {!loading && !error && tasks.length === 0 && (
        <div className="empty-state">

          <h2>No tasks found</h2>

          <p>
            You haven't created any task yet.
          </p>

          <button
            onClick={() => navigate("/add-task")}
          >
            Create Your First Task
          </button>

        </div>
      )}

      {/* Task Table */}
      {!loading && tasks.length > 0 && (

        <div className="table-container">

          <table>

            <thead>
              <tr>
                <th>Task</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Progress</th>
                <th>START DATE</th>
                <th>End Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {tasks.map((task) => (

                <tr key={task.id}>

                  <td>
                    <div
                      className="task-title"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      style={{
                        cursor: "pointer",
                        color: "blue",
                      }}
                    >
                      {task.title}
                    </div>

                    <div className="task-description">
                      {task.description || "No description"}
                    </div>
                  </td>

                  <td>
                    <span
                      className={`priority ${task.priority}`}
                    >
                      {task.priority}
                    </span>
                  </td>

                  <td>
                    <span
                      className={getStatusClass(task.status)}
                    >
                      {task.status}
                    </span>
                  </td>

                  <td>

                    <div className="progress-container">

                      <div className="progress-bar">

                        <div
                          className="progress-fill"
                          style={{
                            width: `${task.progress || 0}%`,
                          }}
                        />

                      </div>

                      <span>
                        {task.progress || 0}%
                      </span>

                    </div>

                  </td>



                  <td>{formatDate(task.start_date)}</td>

                  <td>
                    {task.end_date
                      ? formatDate(task.end_date)
                      : "Not completed"}
                  </td>


                  <td className="task-actions-cell">
                    <div className="task-actions-layout">

                      <div className="task-status-row">
                        <select
                          className="task-status-dropdown"
                          value={String(task.status || "pending").toLowerCase()}
                          onChange={(e) =>
                            handleStatusChange(task, e.target.value)
                          }
                          aria-label={`Status for ${task.title}`}
                        >
                          <option value="pending">Not Done</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>

                        <span
                          className={`task-status-badge ${task.status === "completed"
                            ? "status-done"
                            : task.status === "in_progress"
                              ? "status-progress"
                              : "status-not-done"
                            }`}
                        >
                          {task.status === "completed"
                            ? "Done"
                            : task.status === "in_progress"
                              ? "In Progress"
                              : "Not Done"}
                        </span>
                      </div>

                      <div className="task-action-buttons">
                        <button
                          type="button"
                          className="view-btn"
                          onClick={() => navigate(`/tasks/${task.id}`)}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => {
                            setDeleteError("");
                            setTaskToDelete(task);
                          }}
                        >
                          Delete
                        </button>
                      </div>

                    </div>
                  </td>


                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

      {/* Success notification */}
      {notice && (
        <div className="task-notice" role="status">
          <span>✓</span>
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {taskToDelete && (
        <div
          className="delete-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !deleting
            ) {
              setTaskToDelete(null);
              setDeleteError("");
            }
          }}
        >
          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="delete-modal-icon">
              <span>!</span>
            </div>

            <h2 id="delete-modal-title">Delete Task?</h2>

            <p className="delete-modal-message">
              Are you sure you want to delete{" "}
              <strong>{taskToDelete.title}</strong>?
              This action cannot be undone.
            </p>

            {deleteError && (
              <p className="delete-modal-error" role="alert">
                {deleteError}
              </p>
            )}

            <div className="delete-modal-actions">
              <button
                type="button"
                className="cancel-delete-btn"
                disabled={deleting}
                onClick={() => {
                  setTaskToDelete(null);
                  setDeleteError("");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete-btn"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? "Deleting..." : "Delete Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default Tasks;