import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, User, Lock, Sparkles, UserCheck } from 'lucide-react';

export const AuthModal = () => {
  const { login, register } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await register({ username, displayName, password });
      } else {
        await login(username, password);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px', borderRadius: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: 'white',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)'
            }}
          >
            <MessageSquare size={28} />
          </div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700 }}>
            {isSignup ? 'Create your Account' : 'Welcome back'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {isSignup ? 'Connect with friends in realtime' : 'Sign in to access your messages'}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              fontSize: '0.85rem',
              marginBottom: '18px',
              textAlign: 'center'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
              Username
            </label>
            <div className="search-input-wrapper">
              <User size={18} />
              <input
                type="text"
                required
                className="search-input"
                placeholder="e.g. alex123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {isSignup && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                Display Name
              </label>
              <div className="search-input-wrapper">
                <UserCheck size={18} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="e.g. Alex Rivera"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
              Password
            </label>
            <div className="search-input-wrapper">
              <Lock size={18} />
              <input
                type="password"
                required
                className="search-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              padding: '12px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.95rem',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
            }}
            style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
          >
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};
