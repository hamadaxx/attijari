import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

import LoginPage from './pages/shared/LoginPage';
import RegisterPage from './pages/shared/RegisterPage';
import ProfilePage from './pages/entrepreneur/ProfilePage';
import EventsPage from './pages/entrepreneur/EventsPage';
import PublicationsPage from './pages/entrepreneur/PublicationsPage';
import CMDashboard from './pages/cm/CMDashboard';
import ScoringConfigPage from './pages/cm/ScoringConfigPage';
import CMPublicationsPage from './pages/cm/CMPublicationsPage';
import CMProfilesPage from './pages/cm/CMProfilesPage';
import CMKybPage from './pages/cm/CMKybPage';
import ScorePage from './pages/entrepreneur/ScorePage';
import KybPage from './pages/entrepreneur/KybPage';
import FundDashboard from './pages/fund/FundDashboard';
import StartupDetailPage from './pages/fund/StartupDetailPage';
import MentorEventsPage from './pages/mentor/MentorEventsPage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/dashboard" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/events" element={<PrivateRoute><EventsPage /></PrivateRoute>} />
        <Route path="/publications" element={<PrivateRoute><PublicationsPage /></PrivateRoute>} />

        <Route path="/cm/dashboard" element={<PrivateRoute><CMDashboard /></PrivateRoute>} />
        <Route path="/cm/profiles" element={<PrivateRoute><CMProfilesPage /></PrivateRoute>} />
        <Route path="/cm/publications" element={<PrivateRoute><CMPublicationsPage /></PrivateRoute>} />
        <Route path="/cm/kyb" element={<PrivateRoute><CMKybPage /></PrivateRoute>} />
        <Route path="/cm/scoring" element={<PrivateRoute><ScoringConfigPage /></PrivateRoute>} />

        <Route path="/score" element={<PrivateRoute><ScorePage /></PrivateRoute>} />
        <Route path="/kyb" element={<PrivateRoute><KybPage /></PrivateRoute>} />

        <Route path="/fund/dashboard" element={<PrivateRoute><FundDashboard /></PrivateRoute>} />
        <Route path="/fund/startups" element={<PrivateRoute><FundDashboard /></PrivateRoute>} />
        <Route path="/fund/startups/:profileId" element={<PrivateRoute><StartupDetailPage /></PrivateRoute>} />

        <Route path="/mentor/events" element={<PrivateRoute><MentorEventsPage /></PrivateRoute>} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
