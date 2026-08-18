import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const navLinkClasses = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-primary" : "text-muted hover:text-cream"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-ink/90 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <NavLink to="/home" className="flex items-center gap-2.5 shrink-0 text-cream hover:text-primary transition-colors">
          <img src="/movie-reco-logo.png" alt="MovieReco Logo" className="h-9" />
          <span className="font-display font-semibold text-xl tracking-tight">
            MovieReco
          </span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-7">
          <NavLink to="/home" className={navLinkClasses}>
            Home
          </NavLink>
          <NavLink to="/discover" className={navLinkClasses}>
            Discover
          </NavLink>
          <NavLink to="/watchlist" className={navLinkClasses}>
            Watchlist
          </NavLink>
          <NavLink to="/recommendations" className={navLinkClasses}>
            For You
          </NavLink>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <NavLink
                to="/profile"
                className="text-sm font-medium text-muted hover:text-cream transition-colors"
              >
                {user.name?.split(" ")[0]}
              </NavLink>
              <button
                onClick={logout}
                className="text-sm font-medium text-muted hover:text-primary transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="text-sm font-semibold bg-primary text-ink px-4 py-2 rounded-card hover:bg-primary-soft transition-colors"
            >
              Log in
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
