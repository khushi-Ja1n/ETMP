import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);

  const [tasks, setTasks] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState("");

  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    in_Progress: 0,
    completed: 0,
  });

  const loggedUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  // =========================
  // FETCH ALL EMPLOYEES
  // =========================

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setUserError("");

      const token = localStorage.getItem("token");

      const response = await api.get("api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error loading employees:", error);

      setUserError(
        error.response?.data?.message ||
        "Failed to load employees"
      );
    } finally {
      setLoadingUsers(false);
    }
  };


  // =========================
  // FETCH TASKS
  // =========================

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/api/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Tasks API response:", response.data);

      const tasks = response.data.tasks || [];
      setTasks(tasks);

      const pending = tasks.filter(
        (task) =>
          String(task.status).toLowerCase() === "pending"
      ).length;

      const in_Progress = tasks.filter(
        (task) =>
          String(task.status).toLowerCase() ===
          "in_progress"
      ).length;

      const completed = tasks.filter(
        (task) =>
          String(task.status).toLowerCase() ===
          "completed"
      ).length;

      setTaskStats({
        total: tasks.length,
        pending,
        in_Progress,
        completed,
      });
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };


  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    fetchUsers();
    fetchTasks();
  }, []);


  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };


  return (
    <div className="dashboard-page">

      {/* ================================= */}
      {/* DASHBOARD HEADER */}
      {/* ================================= */}

      <div className="dashboard-header">

        <div>
          <h1>Dashboard</h1>

          <p>
            Welcome back to your task management portal.
          </p>
        </div>


        <div className="user-profile">

          <div className="user-avatar">
            {loggedUser.name
              ? loggedUser.name
                .charAt(0)
                .toUpperCase()
              : "U"}
          </div>


          <div className="user-info">

            <strong>
              {loggedUser.name || "User"}
            </strong>

            <span>
              {loggedUser.role || "Employee"}
            </span>

          </div>

        </div>

      </div>


      {/* ================================= */}
      {/* WELCOME BANNER */}
      {/* ================================= */}

      <div className="welcome-banner">

        <div className="welcome-content">

          <h2>
            Welcome, {loggedUser.name || "User"} 👋
          </h2>

          <p>
            Here's an overview of your tasks and
            employees.
          </p>

        </div>


        <div className="welcome-icon">
          📋
        </div>

      </div>


      {/* ================================= */}
      {/* STATISTICS */}
      {/* ================================= */}

      <div className="stats-grid">

        {/* Total Employees */}

        <div className="stat-card">

          <div className="stat-icon">
            👥
          </div>

          <div>

            <p className="stat-title">
              Total Employees
            </p>

            <h2 className="stat-number">
              {users.length}
            </h2>

          </div>

        </div>


        {/* My Tasks */}

        <div
          className={`stat-card ${selectedFilter === "all" ? "active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => setSelectedFilter("all")}
          onKeyDown={(e) => e.key === "Enter" && setSelectedFilter("all")}
        >

          <div className="stat-icon">
            📋
          </div>

          <div>

            <p className="stat-title">
              My Tasks
            </p>

            <h2 className="stat-number">
              {taskStats.total}
            </h2>

          </div>

        </div>


        {/* Pending */}

        <div
          className={`stat-card ${selectedFilter === "pending" ? "active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => setSelectedFilter("pending")}
          onKeyDown={(e) => e.key === "Enter" && setSelectedFilter("pending")}
        >

          <div className="stat-icon">
            ⏳
          </div>

          <div>

            <p className="stat-title">
              Pending Tasks
            </p>

            <h2 className="stat-number">
              {taskStats.pending}
            </h2>

          </div>

        </div>


        {/* Completed */}

        <div
          className={`stat-card ${selectedFilter === "completed" ? "active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => setSelectedFilter("completed")}
          onKeyDown={(e) => e.key === "Enter" && setSelectedFilter("completed")}
        >

          <div className="stat-icon">
            ✓
          </div>

          <div>

            <p className="stat-title">
              Completed
            </p>

            <h2 className="stat-number">
              {taskStats.completed}
            </h2>

          </div>

        </div>

      </div>



      {selectedFilter !== "" && (
        <div className="filtered-tasks-section">
          <div className="task-filter-heading">
            <h2>
              {selectedFilter === "all"
                ? "My Tasks"
                : selectedFilter === "pending"
                  ? "Pending Tasks"
                  : selectedFilter === "completed"
                    ? "Completed Tasks"
                    : "In_Progress Tasks"}
            </h2>

            <button onClick={() => setSelectedFilter("")}>
              Clear Filter
            </button>
          </div>

          {tasks.filter((task) => {
            const status = String(task.status || "").toLowerCase();

            if (selectedFilter === "all") return true;
            return status === selectedFilter;
          }).length === 0 ? (
            <p>No tasks found in this category.</p>
          ) : (
            <div className="filtered-task-list">
              {tasks
                .filter((task) => {
                  const status = String(task.status || "").toLowerCase();

                  if (selectedFilter === "all") return true;
                  return status === selectedFilter;
                })
                .map((task) => (
                  <div className="filtered-task-card" key={task.id}>
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.description || "No description"}</p>
                    </div>

                    <div className="filtered-task-meta">
                      <span>Status: {task.status || "Pending"}</span>
                      <span>Priority: {task.priority || "Normal"}</span>
                      <span>
                        End: {task.end_date
                          ? String(task.end_date).slice(0, 10)
                          : "—"}
                      </span>
                    </div>

                    <button onClick={() => navigate(`/tasks/${task.id}`)}>
                      View Task
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ================================= */}
      {/* ALL EMPLOYEES */}
      {/* ================================= */}

      <div className="employees-section">

        <div className="section-header">

          <div>

            <h2>
              All Employees
            </h2>

            <p>
              View employee profiles and their tasks
            </p>

          </div>

        </div>


        {/* Loading */}

        {loadingUsers && (

          <div className="loading-box">
            Loading employees...
          </div>

        )}


        {/* Error */}

        {userError && (

          <div className="error-box">
            {userError}
          </div>

        )}


        {/* No employees */}

        {!loadingUsers &&
          !userError &&
          users.length === 0 && (

            <div className="empty-box">

              <div className="empty-icon">
                👥
              </div>

              <h3>
                No employees found
              </h3>

              <p>
                There are no employees registered yet.
              </p>

            </div>

          )}


        {/* Employee Cards */}

        {!loadingUsers &&
          !userError &&
          users.length > 0 && (

            <div className="employees-grid">

              {users.map((user) => (

                <div
                  className="employee-card"
                  key={user.id}
                >

                  {/* Avatar */}

                  <div className="employee-avatar">

                    {user.name
                      ? user.name
                        .charAt(0)
                        .toUpperCase()
                      : "U"}

                  </div>


                  {/* Employee Information */}

                  <div className="employee-info">

                    <h3>
                      {user.name}
                    </h3>


                    <p>
                      {user.designation ||
                        "Employee"}
                    </p>


                    <span>
                      {user.email}
                    </span>


                    <small>
                      Role:{" "}
                      {user.role || "employee"}
                    </small>

                  </div>


                  {/* View Profile */}

                  <button
                    className="view-employee-btn"
                    onClick={() =>
                      navigate(
                        `/employees/${user.id}`
                      )
                    }
                  >
                    View Profile →
                  </button>

                </div>

              ))}

            </div>

          )}

      </div>


      {/* ================================= */}
      {/* TASK MANAGEMENT */}
      {/* ================================= */}

      <div className="recent-tasks">

        <div className="recent-header">

          <div>

            <h2>
              Task Management
            </h2>

            <p>
              Manage and track all your tasks.
            </p>

          </div>


          <button
            className="btn btn-primary"
            onClick={() => navigate("/tasks")}
          >
            View All Tasks
          </button>

        </div>


        <div className="task-management-cards">

          <div className="management-card">

            <div className="management-icon">
              📋
            </div>

            <h3>
              All Tasks
            </h3>

            <p>
              View and manage your tasks.
            </p>

            <button
              onClick={() => navigate("/tasks")}
            >
              View Tasks →
            </button>

          </div>


          <div className="management-card">

            <div className="management-icon">
              ➕
            </div>

            <h3>
              Create Task
            </h3>

            <p>
              Create a new task for yourself.
            </p>

            <button
              onClick={() => navigate("/add-task")}
            >
              Add Task →
            </button>

          </div>


          <div className="management-card">

            <div className="management-icon">
              📊
            </div>

            <h3>
              Weekly Report
            </h3>

            <p>
              Monday to Saturday task cycle.
            </p>

            <button
              onClick={() => navigate("/weekly-report")}
            >
              View Report →
            </button>

          </div>

          <div className="task-management-card"> 
            <div className="task-card-icon">📅</div> 
            <h3>Monthly Report</h3> 
            <p> View your monthly work summary and download Excel report. </p>
             <button 
             className="task-card-button" onClick={() => navigate("/monthly-report")} 
              > View Report → 
              </button> 
              </div>
        </div>

      </div>


      {/* ================================= */}
      {/* LOGOUT */}
      {/* ================================= */}

      <div className="dashboard-footer">

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </div>
  );
}

export default Dashboard;