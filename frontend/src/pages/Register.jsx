import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const Register = () => {
  const { register, authError, loading, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [localError, setLocalError] = useState('');
  const { showToast } = useToast();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAuthError();
    setLocalError('');

    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }

    const ok = await register(form.name, form.email, form.password);
    if (ok) {
      showToast('Account created. Welcome to AutoHaus.');
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-ink text-white p-14">
        <span className="font-display uppercase tracking-widest2 text-lg">AutoHaus</span>
        <div>
          <p className="eyebrow text-steel-400">Join the floor</p>
          <h1 className="font-display text-5xl leading-[1.05] mt-3 max-w-md">
            Create an account to reserve vehicles the moment they land.
          </h1>
        </div>
        <p className="text-xs text-steel-400 max-w-sm">
          Registration takes less than a minute. Your customer account gives you access to live inventory and purchases.
        </p>
      </div>

      <div className="flex items-center justify-center p-8 sm:p-14">
        <div className="w-full max-w-sm">
          <p className="eyebrow">Create account</p>
          <h2 className="font-display text-3xl mt-1 mb-8">Register</h2>

          {(authError || localError) && (
            <p className="text-ember-600 text-sm mb-6 border-l-2 border-ember pl-3">
              {localError || authError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="eyebrow" htmlFor="name">Full name</label>
              <input
                id="name"
                required
                className="input-field"
                value={form.name}
                onChange={update('name')}
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="eyebrow" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                className="input-field"
                value={form.email}
                onChange={update('email')}
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
                value={form.password}
                onChange={update('password')}
                minLength="8"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="eyebrow" htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                required
                className="input-field"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn-primary mt-2" disabled={loading}>
              {loading ? 'Creating account…' : 'Register'}
            </button>
          </form>

          <p className="text-sm text-steel-600 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-ink underline underline-offset-4 hover:text-ember">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
