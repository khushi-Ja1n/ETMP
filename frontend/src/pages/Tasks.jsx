import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  Eye,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

import api from "../services/api";
import "./Tasks.css";

function Tasks() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await api.get("/api/tasks", {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });

      const fetchedTasks = response.data?.tasks;

      setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(
        err.response?.data?.message || "Failed to fetch tasks."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const formatDate = (value) => {
    if (!value) return "—";

    const raw = String(value);

    // Keep PostgreSQL DATE values unchanged to avoid timezone shifts.
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw;
    }

    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) return "—";

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const getPart = (type) =>
      parts.find((part) => part.type === type)?.value;

    return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
  };

  const normalizeStatus = (status) => {
    const value = String(status || "pending")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

    if (["completed", "complete", "done"].includes(value)) {
      return "completed";
    }

    if (
      ["in_progress", "inprogress", "progress"].includes(value)
    ) {
      return "in_progress";
    }

    return "pending";
  };

  const getStatusLabel = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === "completed") return "Completed";
    if (normalized === "in_progress") return "In Progress";

    return "Pending";
  };

  const getPriority = (priority) => {
    const value = String(priority || "medium").toLowerCase();

    if (["low", "medium", "high"].includes(value)) {
      return value;
    }

    return "medium";
  };

  const getProgress = (task) => {
    const status = normalizeStatus(task.status);

    if (status === "completed") return 100;

    const progress = Number(task.progress);

    if (!Number.isFinite(progress)) return 0;

    return Math.min(100, Math.max(0, progress));
  };

  const handleStatusChange = async (task, newStatus) => {
    const oldStatus = normalizeStatus(task.status);

    if (
      newStatus === oldStatus ||
      updatingTaskId === task.id
    ) {
      return;
    }

    setUpdatingTaskId(task.id);
    setError("");
    setNotice("");

    // Update the display immediately; restore it if the API call fails.
    setTasks((previous) =>
      previous.map((item) =>
        item.id === task.id
          ? { ...item, status: newStatus }
          : item
      )
    );

    try {
      const response = await api.put(`/api/tasks/${task.id}`, {
        status: newStatus,
      });

      const updatedTask = response.data?.task;

      if (updatedTask) {
        setTasks((previous) =>
          previous.map((item) =>
            item.id === task.id
              ? { ...item, ...updatedTask }
              : item
          )
        );
      } else {
        await fetchTasks();
      }

      setNotice("Task status updated successfully.");
    } catch (err) {
      console.error("Status update failed:", err);

      setTasks((previous) =>
        previous.map((item) =>
          item.id === task.id
            ? { ...item, status: oldStatus }
            : item
        )
      );

      setError(
        err.response?.data?.message ||
          "Unable to update task status. Please try again."
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete || deleting) return;

    try {
      setDeleting(true);
      setDeleteError("");

      const token = localStorage.getItem("token");

      await api.delete(`/api/tasks/${taskToDelete.id}`, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });

      setTasks((previous) =>
        previous.filter((task) => task.id !== taskToDelete.id)
      );

      setTaskToDelete(null);
      setNotice("Task deleted successfully.");
    } catch (err) {
      console.error("Delete task error:", err);

      setDeleteError(
        err.response?.data?.message ||
          "Unable to delete task. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setTaskToDelete(null);
    setDeleteError("");
  };

  const completedCount = tasks.filter(
    (task) => normalizeStatus(task.status) === "completed"
  ).length;

  const inProgressCount = tasks.filter(
    (task) => normalizeStatus(task.status) === "in_progress"
  ).length;

  const pendingCount = tasks.filter(
    (task) => normalizeStatus(task.status) === "pending"
  ).length;

  return (
    <main className="tasks-page">
      <div className="tasks-content">
        {/* Page header */}
        <header className="tasks-header">
          <div className="tasks-heading">
            <div className="tasks-heading-icon">
              <ClipboardList size={25} strokeWidth={2} />
            </div>

            <div>
              <h1>My Tasks</h1>
              <p>Manage and track your daily tasks</p>
            </div>
          </div>

          <div className="tasks-header-actions">
            <button
              type="button"
              className="tasks-refresh-btn"
              onClick={fetchTasks}
              disabled={loading}
              aria-label="Refresh tasks"
              title="Refresh tasks"
            >
              <RefreshCw
                size={17}
                className={loading ? "spinning" : ""}
              />
            </button>

            <button
              type="button"
              className="add-task-btn"
              onClick={() => navigate("/add-task")}
            >
              <Plus size={18} />
              <span>Add Task</span>
            </button>

            <button
              type="button"
              className="back-dashboard-btn"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft size={17} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </header>

        {/* Summary cards */}
        <section className="task-summary-grid" aria-label="Task summary">
          <article className="task-summary-card">
            <div className="summary-icon summary-total">
              <ClipboardList size={21} />
            </div>
            <div>
              <p>Total Tasks</p>
              <strong>{tasks.length}</strong>
            </div>
          </article>

          <article className="task-summary-card">
            <div className="summary-icon summary-pending">
              <Clock3 size={21} />
            </div>
            <div>
              <p>Pending</p>
              <strong>{pendingCount}</strong>
            </div>
          </article>

          <article className="task-summary-card">
            <div className="summary-icon summary-progress">
              <RefreshCw size={21} />
            </div>
            <div>
              <p>In Progress</p>
              <strong>{inProgressCount}</strong>
            </div>
          </article>

          <article className="task-summary-card">
            <div className="summary-icon summary-completed">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <p>Completed</p>
              <strong>{completedCount}</strong>
            </div>
          </article>
        </section>

        {/* Error message */}
        {error && (
          <div className="tasks-error" role="alert">
            <CircleAlert size={19} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Task table panel */}
        <section className="tasks-table-card">
          <div className="tasks-table-heading">
            <div>
              <h2>All Tasks</h2>
              <p>View your tasks and update their progress.</p>
            </div>

            <span className="task-count">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            </span>
          </div>

          {loading ? (
            <div className="tasks-loading">
              <LoaderCircle size={28} className="spinning" />
              <p>Loading your tasks...</p>
            </div>
          ) : !error && tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <ClipboardList size={34} />
              </div>

              <h2>No tasks found</h2>
              <p>You haven't created any tasks yet.</p>

              <button
                type="button"
                className="add-task-btn"
                onClick={() => navigate("/add-task")}
              >
                <Plus size={18} />
                Create Your First Task
              </button>
            </div>
          ) : !error ? (
            <div className="table-container">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th className="task-column">Task</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {tasks.map((task) => {
                    const status = normalizeStatus(task.status);
                    const priority = getPriority(task.priority);
                    const progress = getProgress(task);

                    return (
                      <tr key={task.id}>
                        <td className="task-details-cell">
                          <button
                            type="button"
                            className="task-title"
                            onClick={() =>
                              navigate(`/tasks/${task.id}`)
                            }
                          >
                            {task.title || "Untitled task"}
                            <ArrowRight
                              size={14}
                              className="task-title-arrow"
                            />
                          </button>

                          <p className="task-description">
                            {task.description || "No description provided"}
                          </p>
                        </td>

                        <td>
                          <span className={`priority priority-${priority}`}>
                            {priority}
                          </span>
                        </td>

                        <td>
                          <span className={`status status-${status}`}>
                            <span className="status-dot" />
                            {getStatusLabel(status)}
                          </span>
                        </td>

                        <td>
                          <div className="progress-container">
                            <div
                              className="progress-bar"
                              role="progressbar"
                              aria-valuenow={progress}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`Progress for ${task.title}`}
                            >
                              <div
                                className={`progress-fill progress-${status}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>

                            <span className="progress-value">
                              {progress}%
                            </span>
                          </div>
                        </td>

                        <td className="date-cell">
                          <CalendarDays size={15} />
                          {formatDate(task.start_date)}
                        </td>

                        <td className="date-cell">
                          {task.end_date ? (
                            <>
                              <CalendarDays size={15} />
                              {formatDate(task.end_date)}
                            </>
                          ) : (
                            <span className="date-not-completed">
                              Not completed
                            </span>
                          )}
                        </td>
<td className="task-actions-cell">
  <div className="task-actions-inline">
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
</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>

      {/* Success notification */}
      {notice && (
        <div className="task-notice" role="status">
          <CheckCircle2 size={19} />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {taskToDelete && (
        <div
          className="delete-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteModal();
            }
          }}
        >
          <section
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="delete-modal-icon">
              <ShieldAlert size={28} />
            </div>

            <h2 id="delete-modal-title">Delete this task?</h2>

            <p className="delete-modal-message">
              Are you sure you want to delete{" "}
              <strong>{taskToDelete.title}</strong>? This action cannot
              be undone.
            </p>

            {deleteError && (
              <div className="delete-modal-error" role="alert">
                <CircleAlert size={17} />
                {deleteError}
              </div>
            )}

            <div className="delete-modal-actions">
              <button
                type="button"
                className="cancel-delete-btn"
                disabled={deleting}
                onClick={closeDeleteModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete-btn"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? (
                  <>
                    <LoaderCircle size={16} className="spinning" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Task
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default Tasks;