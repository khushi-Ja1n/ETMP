
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setError("");
    setMessage("");

    // Start loading
    setLoading(true);

    try {
      const response = await api.post("/api/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      // Show success message on registration page
      setMessage(
        response.data?.message || "Registration successful! You can now log in."
      );

      // Clear form fields
      setName("");
      setEmail("");
      setPassword("");

      // Do not navigate immediately.
      // Keep the success message visible on this page.
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
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

          <p>Create your employee account</p>
        </div>

        <form onSubmit={handleRegister}>
          <h2>Create Account</h2>

          <p className="form-subtitle">
            Register to manage your tasks
          </p>

          {/* Success message */}
          {message && (
            <div className="success-message" role="status">
              {message}
              <p>
                Already registered?{" "}
                <Link to="/login">Login here</Link>
              </p>
            </div>
          )}

          {/* Error message */}
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
              placeholder="Enter your full name"
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
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account?</p>

          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
