
import { useState } from "react";
import axios from "axios";
import "./Auth.css";

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "login" : "signup";

      const response = await axios.post(
        `https://collabsphere-api-70ke.onrender.com/api/auth/${endpoint}`,
        { name, email, password }
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      onLogin(response.data.user);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>CollabSphere</h1>
        <p>Build something amazing together.</p>

        <h2>{isLogin ? "Welcome back!" : "Create your account"}</h2>

        {!isLogin && (
          <input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password (minimum 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {message && <div className="auth-message">{message}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : isLogin ? "Login" : "Sign up"}
        </button>

        <p className="auth-switch">
          {isLogin ? "New to CollabSphere?" : "Already have an account?"}
          {" "}
          <span onClick={() => {
            setIsLogin(!isLogin);
            setMessage("");
          }}>
            {isLogin ? "Create account" : "Login"}
          </span>
        </p>
      </form>
    </div>
  );
}
