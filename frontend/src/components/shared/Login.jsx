import React, { useState, useEffect } from 'react';
import './Login.css';
import { authAPI } from '../../services/api';

function Login({ onLogin }) {
  const [activeTab, setActiveTab] = useState('signin');
  const [userType, setUserType] = useState('student'); // Only student registration allowed
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  
  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Sign Up form state
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setShowFooter(isNearBottom);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch classes when signup tab is active
  useEffect(() => {
    if (activeTab === 'signup') {
      fetchClasses();
    }
  }, [activeTab]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/public/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = await authAPI.login({
        email: signInEmail,
        password: signInPassword
      });

      if (data.error) {
        setError(data.error);
      } else if (data.user) {
        // Store user data
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        onLogin(data.user);
      }
    } catch (err) {
      setError('Failed to connect to server. Please ensure backend is running.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Validation
    if (!fullName || !signUpEmail || !signUpPassword) {
      setError('All fields are required');
      setLoading(false);
      return;
    }
    
    // Class is required for students
    if (!selectedClass) {
      setError('Please select your class');
      setLoading(false);
      return;
    }
    
    try {
      const data = await authAPI.register({
        fullName,
        email: signUpEmail,
        password: signUpPassword,
        department: selectedClass,
        class: selectedClass,
        division: selectedDivision || null,
        userType
      });

      if (data.error) {
        setError(data.error);
      } else {
        setFullName('');
        setSignUpEmail('');
        setDepartment('');
        setSelectedClass('');
        setSelectedDivision('');
        setSignUpPassword('');
        
        setSuccess('Account created successfully! Please sign in.');
        setActiveTab('signin');
      }
    } catch (err) {
      setError('Failed to connect to server. Please ensure backend is running.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="auth-container">
      <div className="auth-logo">
        <div className="logo-circle">
          <img src="/logo.svg" alt="Vidhyarth Logo" />
        </div>
      </div>
      <h1 className="auth-title">Vidhyarth</h1>
      
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'signin' ? 'active' : ''}`}
          onClick={() => setActiveTab('signin')}
        >
          Sign In
        </button>
        <button
          className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
          onClick={() => setActiveTab('signup')}
        >
          Sign Up
        </button>
      </div>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      {activeTab === 'signin' ? (
        <form onSubmit={handleSignIn}>
          <div className="form-group">
            <input
              type="text"
              placeholder="xyz@gmail.com"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="••••••••••"
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : 'Sign In'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignUp}>
          {/* Only Student Registration Allowed */}
          <div className="registration-info">
            <p className="info-text">Student Registration</p>
            <p className="info-subtext">Faculty accounts are created by Admin</p>
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              placeholder="Email Address"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="">
                {loadingClasses ? 'Loading classes...' : 'Select Your Class *'}
              </option>
              {classes.map((cls) => (
                <option key={cls.class_id} value={cls.class_name}>
                  {cls.class_name} - {cls.semester}
                </option>
              ))}
            </select>
            {!loadingClasses && classes.length === 0 && (
              <small style={{ color: '#f44336', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                No classes available. Contact admin.
              </small>
            )}
          </div>

          <div className="form-group">
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select Division (Optional)</option>
              <option value="A">Division A</option>
              <option value="B">Division B</option>
              <option value="C">Division C</option>
              <option value="D">Division D</option>
            </select>
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Student Account'}
          </button>
        </form>
      )}
    </div>
    
    <footer className={`login-footer ${showFooter ? 'show' : ''}`}>
      <div className="footer-bottom">
        <p>© 2026 Vidhyarth. All rights reserved. | Privacy Policy | Terms of Service</p>
      </div>
    </footer>
    </>
  );
}

export default Login;
