import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./EditTask.css";

function EditTask() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await api.get(`/api/tasks/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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

  const handleChange = (e) => {
    setTask({
      ...task,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem("token");

      await api.put(`/api/tasks/${id}`,
        {
          title: task.title,
          status: task.status,
          priority: task.priority,
          progress: Number(task.progress) || 0,
          remarks: task.remarks || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Task updated successfully!");

    } catch (error) {
      console.error("Update task error:", error);
      console.error("Backend response:", error.response?.data);

      setError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to update task"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-loading">
        Loading task...
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="edit-error">
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
    <div className="edit-task-page">

      <div className="edit-task-container">

        <button
          className="back-btn"
          onClick={() => navigate(`/tasks/${id}`)}
        >
          ← Back to Task
        </button>

        <div className="edit-task-card">

          <div className="edit-header">
            <h1>Edit Task</h1>

            <p>
              Update the task status and progress.
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          {success && (
            <div className="success-message" role="status">
              <span className="success-icon">✓</span>
              <span>{success}</span>
            </div>
          )}
          <form onSubmit={handleSubmit}>

            {/* Task Title */}
            <div className="form-group">
              <label>Task Title</label>

              <input
                type="text"
                name="title"
                value={task.title || ""}
                onChange={handleChange}
                placeholder="Enter task title"
                required
              />
            </div>


            {/* Status */}
            <div className="form-group">
              <label>Status</label>

              <select
                name="status"
                value={task.status || "pending"}
                onChange={handleChange}
              >
                <option value="pending">
                  Pending
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="completed">
                  Completed
                </option>
              </select>
            </div>


            {/* Priority */}
            <div className="form-group">
              <label>Priority</label>

              <select
                name="priority"
                value={task.priority || "medium"}
                onChange={handleChange}
              >
                <option value="low">
                  Low
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="high">
                  High
                </option>

                <option value="urgent">
                  Urgent
                </option>
              </select>
            </div>


            {/* Progress */}
            <div className="form-group">

              <label>
                Progress: {task.progress || 0}%
              </label>

              <input
                type="range"
                name="progress"
                min="0"
                max="100"
                value={task.progress || 0}
                onChange={handleChange}
              />

            </div>


            {/* Remarks */}
            <div className="form-group">

              <label>Remarks</label>

              <textarea
                name="remarks"
                rows="5"
                value={task.remarks || ""}
                onChange={handleChange}
                placeholder="Enter your remarks..."
              />

            </div>


            {/* Buttons */}
            <div className="form-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={() =>
                  navigate(`/tasks/${id}`)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}

export default EditTask;