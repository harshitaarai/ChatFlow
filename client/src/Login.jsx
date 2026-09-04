import { useState } from "react";

function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const endpoint = isRegistering
        ? "register"
        : "login";

      const body = isRegistering
        ? {
            username,
            email,
            password,
          }
        : {
            email,
            password,
          };

      const response = await fetch(
        `http://localhost:5001/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Something went wrong"
        );
      }

      if (isRegistering) {
        setSuccess(
          "Account created! You can now log in."
        );

        setUsername("");
        setPassword("");

        setIsRegistering(false);
      } else {
        localStorage.setItem(
          "chatflowUser",
          JSON.stringify(data.user)
        );

        onLogin();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <h1>ChatFlow</h1>

        <p>
          {isRegistering
            ? "Create your account"
            : "Welcome back"}
        </p>

        <form onSubmit={handleSubmit}>

          {isRegistering && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegistering
                ? "Create Account"
                : "Login"}
          </button>

        </form>

        {error && (
          <p className="auth-error">
            {error}
          </p>
        )}

        {success && (
          <p className="auth-success">
            {success}
          </p>
        )}

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError("");
            setSuccess("");
          }}
        >
          {isRegistering
            ? "Already have an account? Login"
            : "Don't have an account? Register"}
        </button>

      </div>
    </div>
  );
}

export default Login;