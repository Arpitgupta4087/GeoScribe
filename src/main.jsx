
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import App from './App.jsx';
import LoginPage from './LoginPage.jsx';
import Analysis from './Analysis.jsx';
import Dashboard from './Dashboard.jsx';
import SignUpPage from './SignUpPage.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate replace to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} /> {}
        <Route path="/home" element={<App />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
