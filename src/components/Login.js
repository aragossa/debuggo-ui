import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import GoogleLoginButton from './GoogleLoginButton';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Invalid email or password');
      }

      const data = await response.json();
      if (data.access_token) {
        // Pass the token data to login
        await login(data);
        navigate('/dashboard');
      } else {
        throw new Error('Authentication token not received');
      }
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
    }
  };

  // Check for token in URL when component mounts
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    
    if (token) {
      // Remove the token from URL to prevent it from being visible
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Login with the token
      const handleTokenLogin = async () => {
        try {
          await login({ access_token: token });
          navigate('/dashboard');
        } catch (err) {
          setError('Failed to authenticate with Google. Please try again.');
          console.error('Google auth error:', err);
        }
      };
      
      handleTokenLogin();
    }
  }, [location, login, navigate]);

  return (
    <div className="login-form">
      <h2>Welcome To Debuggo.app</h2>
      {error && <div className="error-message">{error}</div>}
      <GoogleLoginButton />
    </div>
  );
};

export default Login;
