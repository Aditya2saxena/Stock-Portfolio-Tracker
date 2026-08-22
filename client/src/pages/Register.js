import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { useToast } from "../context/ToastContext";
import { TrendingUp, UserPlus, Loader2, User, Mail, Lock } from "lucide-react";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
      };

      await API.post("/auth/register", cleanData);
      addToast("🎉 Account created successfully! Please log in.", "success");
      navigate("/login");
    } catch (err) {
      const errMsg = err.response?.data?.message || "Registration failed. Please try again.";
      setError(errMsg);
      addToast(`❌ ${errMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        backgroundColor: "var(--bg-main)",
      }}
    >
      <div
        className="fintech-card"
        style={{
          maxWidth: "440px",
          width: "100%",
          padding: "2.5rem 2rem",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "var(--color-accent)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
            }}
          >
            <TrendingUp size={26} />
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.25rem" }}>
            Create Account
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Join StockTracker to build and monitor your investments
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "var(--color-negative-bg)",
              color: "var(--color-negative)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              padding: "0.65rem 0.85rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem",
              marginBottom: "1.25rem",
              fontWeight: "500",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
              Full Name
            </label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }} />
              <input
                type="text"
                name="name"
                placeholder="Priya Verma"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
                style={{ paddingLeft: "2.35rem" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }} />
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
                style={{ paddingLeft: "2.35rem" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
              Password (min 6 chars)
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }} />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="form-input"
                style={{ paddingLeft: "2.35rem" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", height: "44px", marginTop: "0.5rem" }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin-loader" />
                <span>Registering...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: "1.75rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--color-accent)", fontWeight: "700", textDecoration: "none" }}>
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;