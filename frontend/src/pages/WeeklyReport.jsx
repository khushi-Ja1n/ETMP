
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "./WeeklyReport.css";

// Format a date without timezone shifting.
// Handles both YYYY-MM-DD strings and Date objects.

function formatDate(dateValue) {
  if (!dateValue) return "—";

  // Date-only string: preserve the original calendar date.
  if (
    typeof dateValue === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
  ) {
    return dateValue;
  }

  // Timestamp: convert to the browser's local date.
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// Return Monday of the selected week using local calendar dates.
function getMonday(date = new Date()) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);

  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));

  return formatDate(d);
}

// Shift between weeks without UTC conversion.
function shiftWeek(dateString, amount) {
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(year, month - 1, day, 12);
  date.setDate(date.getDate() + amount * 7);

  return formatDate(date);
}

function WeeklyReport() {
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weekStart, setWeekStart] = useState(() => getMonday());

  const fetchReport = useCallback(async (selectedWeek) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/weekly-report", {
        params: {
          week_start: selectedWeek,
        },
      });

      setReport(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load weekly report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(weekStart);
  }, [weekStart, fetchReport]);

  const changeWeek = (amount) => {
    setWeekStart((current) => shiftWeek(current, amount));
  };

  const goToCurrentWeek = () => {
    setWeekStart(getMonday());
  };

  const tasks = report?.tasks || [];

  return (
    <div className="weekly-report-page">
      <div className="weekly-report-header">
        <div className="weekly-report-heading">
          <h1>Weekly Task Report</h1>
          <p>Monday to Saturday task summary</p>

          <p className="weekly-date-range">
            <strong>Week:</strong>{" "}
            {report?.week_start || weekStart} to{" "}
            {report?.week_end || "—"}
          </p>
        </div>

        <div className="weekly-report-actions">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>

          <button
            type="button"
            onClick={() => changeWeek(-1)}
            disabled={loading}
          >
            ← Previous Week
          </button>

          <button
            type="button"
            onClick={goToCurrentWeek}
            disabled={loading}
          >
            Current Week
          </button>

          <button
            type="button"
            onClick={() => changeWeek(1)}
            disabled={loading}
          >
            Next Week →
          </button>

          <button
            type="button"
            onClick={() => fetchReport(weekStart)}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="report-error" role="alert">
          {error}
          <button
            type="button"
            onClick={() => fetchReport(weekStart)}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="report-loading">
          Loading weekly report...
        </div>
      ) : (
        <>
          <div className="weekly-report-summary">
            <div className="weekly-summary-card">
              <span>Total Tasks</span>
              <h2>{report?.total_tasks ?? 0}</h2>
            </div>

            <div className="weekly-summary-card">
              <span>Completed</span>
              <h2>{report?.completed_tasks ?? 0}</h2>
            </div>

            <div className="weekly-summary-card">
              <span>Pending</span>
              <h2>{report?.pending_tasks ?? 0}</h2>
            </div>

            <div className="weekly-summary-card">
              <span>In Progress</span>
              <h2>{report?.in_progress_tasks ?? 0}</h2>
            </div>
          </div>

          <div className="weekly-progress-card">
            <h2>Average Performance</h2>

            <div className="weekly-progress-track">
              <div
                className="weekly-progress-fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      Number(report?.average_progress || 0)
                    )
                  )}%`,
                }}
              />
            </div>

            <p>
              {Number(report?.average_progress || 0).toFixed(2)}%
            </p>
          </div>

          <div className="weekly-report-table-section">
            <h2>Task Details</h2>

            {tasks.length === 0 ? (
              <p className="report-empty">
                No tasks found for this week.
              </p>
            ) : (
              <div className="report-table-wrapper">
                <table className="weekly-report-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Description</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id}>
                        <td>{task.title}</td>
                        <td>{task.description || "—"}</td>
                        <td>{task.priority || "Normal"}</td>
                        <td>
                          {(task.status || "pending")
                            .replaceAll("_", " ")
                            .replace(/\b\w/g, (char) =>
                              char.toUpperCase()
                            )}
                        </td>
                        <td>
                          {Number(task.progress || 0)}%
                        </td>
                        <td>{formatDate(task.start_date)}</td>
                        <td>{formatDate(task.end_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default WeeklyReport;
