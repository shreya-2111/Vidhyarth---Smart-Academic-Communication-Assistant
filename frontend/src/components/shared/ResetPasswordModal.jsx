import React, { useState } from 'react';
import './ResetPasswordModal.css';

function ResetPasswordModal({ user, onSuccess }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      return 'All fields are required';
    }
    if (form.newPassword.length < 6) {
      return 'New password must be at least 6 characters';
    }
    if (form.newPassword !== form.confirmPassword) {
      return 'New password and confirm password do not match';
    }
    if (form.currentPassword === form.newPassword) {
      return 'New password must be different from current password';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        onSuccess();
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-modal-overlay">
      <div className="reset-modal">
        <div className="reset-modal-header">
          <div className="reset-icon">🔐</div>
          <h2>Reset Your Password</h2>
          <p>For security, you must set a new password before continuing.</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-modal-body">
          {error && <div className="reset-error">{error}</div>}

          <div className="reset-field">
            <label>Current Password</label>
            <div className="reset-input-wrap">
              <input
                type={showCurrent ? 'text' : 'password'}
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                placeholder="Enter your current password"
                autoComplete="current-password"
              />
              <button type="button" className="toggle-eye" onClick={() => setShowCurrent(p => !p)}>
                {showCurrent ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="reset-field">
            <label>New Password</label>
            <div className="reset-input-wrap">
              <input
                type={showNew ? 'text' : 'password'}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
              <button type="button" className="toggle-eye" onClick={() => setShowNew(p => !p)}>
                {showNew ? '🙈' : '👁️'}
              </button>
            </div>
            {form.newPassword && (
              <div className="password-strength">
                <div className={`strength-bar ${form.newPassword.length >= 8 ? 'strong' : form.newPassword.length >= 6 ? 'medium' : 'weak'}`}></div>
                <span>{form.newPassword.length >= 8 ? 'Strong' : form.newPassword.length >= 6 ? 'Medium' : 'Weak'}</span>
              </div>
            )}
          </div>

          <div className="reset-field">
            <label>Confirm New Password</label>
            <div className="reset-input-wrap">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
              <button type="button" className="toggle-eye" onClick={() => setShowConfirm(p => !p)}>
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <small className="mismatch">Passwords do not match</small>
            )}
          </div>

          <button type="submit" className="reset-submit-btn" disabled={loading}>
            {loading ? 'Updating...' : '🔒 Update Password'}
          </button>
        </form>

        <div className="reset-modal-footer">
          <small>⚠️ This step cannot be skipped. Contact admin if you need help.</small>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordModal;
