import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-ink text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-widest2 uppercase">AutoHaus</span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-widest2 text-steel-400">
            Inventory
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-6">
          {isAuthenticated ? (
            <>
              <Link to="/" className="hidden sm:inline font-display uppercase tracking-wide text-xs hover:text-brass-400 transition-colors">Inventory</Link>
              <Link to="/purchases" className="hidden sm:inline font-display uppercase tracking-wide text-xs hover:text-brass-400 transition-colors">Purchases</Link>
              <Link to="/invoices" className="hidden sm:inline font-display uppercase tracking-wide text-xs hover:text-brass-400 transition-colors">Invoices</Link>
              {isAdmin && <Link to="/admin/dashboard" className="hidden md:inline font-display uppercase tracking-wide text-xs hover:text-brass-400 transition-colors">Dashboard</Link>}
              <span className="hidden md:inline text-xs uppercase tracking-wide text-steel-400">
                {isAdmin ? 'Admin' : 'Customer'} · {user?.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="font-display uppercase tracking-wide text-xs border border-white/30
                           hover:bg-white hover:text-ink px-4 py-2 transition-colors duration-200"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-display uppercase tracking-wide text-xs hover:text-brass-400 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="font-display uppercase tracking-wide text-xs border border-white/30
                           hover:bg-white hover:text-ink px-4 py-2 transition-colors duration-200"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
