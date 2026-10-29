
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const isAdmin =
    Boolean(token) &&
    String(user?.role || "").toLowerCase() === "admin";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Prevent non-admin users from accessing account creation
  

if (!isAdmin) {
  return (
    <div className="auth-page">
      <div className="access-denied-card">
        <div className="access-icon">
          <span>✓</span>
        </div>

        <span className="access-label">RESTRICTED ACCESS</span>

        <h2>Admin Access Required</h2>

        <p className="access-description">
          Account creation is restricted to authorized
          administrators. Please sign in with your
          administrator account to continue.
        </p>

        <div className="access-info">
          <span className="access-lock">🔒</span>
          <div>
            <strong>Protected Area</strong>
            <p>Your account does not have permission to access this page.</p>
          </div>
        </div>

        <Link to="/login" className="access-login-link">
          Go to Admin Login <span>→</span>
        </Link>

        <div className="access-footer">
          EMPLOYEE TASK PORTAL
        </div>
      </div>
    </div>
  );
}


  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post(
        "/api/auth/register",
        {
          name: name.trim(),
          email: email.trim(),
          password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data?.message || "Employee account created successfully."
      );

      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err.response?.data?.message ||
          "Account creation failed. Please try again."
      );
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon">ET</div>
          <h1>Employee Task Portal</h1>
          <p>Create an employee account</p>
        </div>

        <form onSubmit={handleRegister}>
          <h2>Create Account</h2>
          <p className="form-subtitle">
            Admin can register a new employee
          </p>

          {message && (
            <div className="success-message" role="status">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Employee Account"}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/dashboard">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
