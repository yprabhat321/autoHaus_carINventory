import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const Login = () => {
  const { login, authError, loading, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { showToast } = useToast();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAuthError();
    const ok = await login(email, password);
    if (ok) {
      showToast('Welcome back. You are signed in.');
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-ink text-white p-14">
        <span className="font-display uppercase tracking-widest2 text-lg">AutoHaus</span>
        <div>
          <p className="eyebrow text-steel-400">Welcome back</p>
          <h1 className="font-display text-5xl leading-[1.05] mt-3 max-w-md">
            Every great drive starts with the right inventory decision.
          </h1>
        </div>
        <p className="text-xs text-steel-400 max-w-sm">
          Sign in to browse live stock, place holds, and manage inventory across the lot.
        </p>
      </div>

      <div className="flex items-center justify-center p-8 sm:p-14">
        <div className="w-full max-w-sm">
          <p className="eyebrow">Sign in</p>
          <h2 className="font-display text-3xl mt-1 mb-8">Access your account</h2>

          {authError && (
            <p className="text-ember-600 text-sm mb-6 border-l-2 border-ember pl-3">{authError}</p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="eyebrow" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="eyebrow" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength="8"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn-primary mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          <p className="text-sm text-steel-600 mt-8">
            New to AutoHaus?{' '}
            <Link to="/register" className="text-ink underline underline-offset-4 hover:text-ember">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
