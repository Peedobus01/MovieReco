import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthVisualPanel from "../components/AuthVisualPanel";
import PasswordInput from "../components/PasswordInput";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    const result = await register(form);
    setSubmitting(false);
    if (result.success) {
      navigate("/home", { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AuthVisualPanel
        eyebrow="Get started"
        headline="Structured filters. Real ratings. Zero noise."
        sub="Tell the Movie Recommendation System what you love once, and every recommendation after that gets sharper."
      />

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-sm font-medium text-muted hover:text-cream transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>

          <h2 className="font-display text-3xl font-semibold text-cream mb-1">Create your account</h2>
          <p className="text-muted text-sm mb-8">
            Already have one? <Link to="/login" className="text-primary hover:text-primary-soft">Log in</Link>
          </p>

          {error && (
            <div className="mb-5 rounded-card border border-primary-dim/40 bg-primary/10 px-4 py-3 text-sm text-primary-soft">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm text-muted mb-1.5">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Alex Rivera"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-muted mb-1.5">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-muted mb-1.5">Password</label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary mt-2">
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}