import React, { useState, useEffect } from 'react';
import Login from './components/shared/Login.jsx';
import Dashboard from './components/shared/Dashboard.jsx';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import ResetPasswordModal from './components/shared/ResetPasswordModal.jsx';
import './App.css';
import './styles/animations.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      const parsed = JSON.parse(user);
      // If student hasn't reset password, clear session and show login
      if (parsed.userType === 'student' && parsed.isPasswordReset === false) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        return;
      }
      setCurrentUser(parsed);
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    // Force password reset for students who haven't done it yet
    if (user.userType === 'student' && user.isPasswordReset === false) {
      setShowResetModal(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    setShowResetModal(false);
  };

  const handlePasswordResetSuccess = () => {
    // Clear session and force re-login with new password
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    setShowResetModal(false);
    alert('Password updated successfully! Please login with your new password.');
  };

  return (
    <div className="App">
      {currentUser ? (
        <>
          {/* Block dashboard if password not reset */}
          {showResetModal && (
            <ResetPasswordModal
              user={currentUser}
              onSuccess={handlePasswordResetSuccess}
            />
          )}

          {/* Only render dashboard if password has been reset */}
          {!showResetModal && (
            currentUser.userType === 'admin' ? (
              <AdminDashboard user={currentUser} onLogout={handleLogout} />
            ) : (
              <Dashboard user={currentUser} onLogout={handleLogout} />
            )
          )}
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
