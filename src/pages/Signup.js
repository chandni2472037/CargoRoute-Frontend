import { useState } from "react";
import { signupUser } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { USER_ROLES } from "../utils/constants";
import "../styles/Auth.css";

// All roles are available at public signup.
const SIGNUP_ROLES = USER_ROLES;

export default function Signup() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Dispatcher",
    password: "",
    status: "Active"
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await signupUser(form);
      setMessage({ type: "success", text: "Account created successfully! Redirecting to login…" });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Signup failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <h1>CargoRoute IQ</h1>
        <p>Build smarter logistics operations.</p>
      </div>

      <div className="auth-right">
        <form className="auth-card" onSubmit={handleSignup}>
          <h2>Create Account</h2>
          <p className="subtitle">Get started with CargoRoute IQ</p>

          <input
            placeholder="Full Name"
            required
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder="Email Address"
            required
            onChange={e => setForm({ ...form, email: e.target.value })}
          />

          <input
            placeholder="Phone Number"
            required
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />

          <select
            onChange={e => setForm({ ...form, role: e.target.value })}
            value={form.role}
          >
            {SIGNUP_ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>

          <input
            type="password"
            placeholder="Create Password"
            required
            onChange={e => setForm({ ...form, password: e.target.value })}
          />

          {message.text && (
            <div className={`auth-message auth-message-${message.type}`}>
              <span>{message.type === 'success' ? '✔' : '⚠'}</span> {message.text}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create'}
          </button>

          <span className="link">
            Already have an account?{" "}
            <a href="/login">Login</a>
          </span>
        </form>
      </div>
    </div>
  );
}
