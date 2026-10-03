import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

import Dashboard from './pages/Dashboard';
import NewAnalysis from './pages/NewAnalysis';
import MyAnalyses from './pages/MyAnalyses';
import PatentLibrary from './pages/PatentLibrary';
import SimilaritySearch from './pages/SimilaritySearch';
import SavedPatents from './pages/SavedPatents';
import ReportsModule from './pages/ReportsModule';
import Settings from './pages/Settings';

// Dynamic details & pipeline
import Pipeline from './pages/Pipeline';
import AnalysisResult from './pages/AnalysisResult';
import PatentDetail from './pages/PatentDetail';
import AdminDashboard from './pages/AdminDashboard';

// Aliases for full backward compatibility
import SearchWorkspace from './pages/SearchWorkspace';
import AnalysisReport from './pages/AnalysisReport';
import Profile from './pages/Profile';

import { authAPI } from './utils/api';

function ConsoleShell({ user, setUser, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#000000] text-[#D4D4D4]">
      <Sidebar user={user} setUser={setUser} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar user={user} />
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check user authentication credentials on initial mount
    const storedUser = authAPI.getUser();
    if (storedUser && authAPI.isAuthenticated()) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#000000] text-[#A3A3A3]">
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Initializing PatentSense Intelligence Console...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public SaaS Landing Page */}
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <Landing />}
        />

        {/* Auth routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login setUser={setUser} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" replace /> : <Register setUser={setUser} />}
        />
        <Route
          path="/forgot-password"
          element={user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />}
        />

        {/* Protected Dashboard/Console Views */}
        <Route
          path="/dashboard"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <Dashboard />
            </ConsoleShell>
          }
        />
        <Route
          path="/new-analysis"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <NewAnalysis />
            </ConsoleShell>
          }
        />
        <Route
          path="/search"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <SearchWorkspace />
            </ConsoleShell>
          }
        />
        <Route
          path="/pipeline"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <Pipeline />
            </ConsoleShell>
          }
        />
        <Route
          path="/analysis/:id"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <AnalysisResult />
            </ConsoleShell>
          }
        />
        <Route
          path="/report/:id"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <AnalysisReport />
            </ConsoleShell>
          }
        />
        <Route
          path="/my-analyses"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <MyAnalyses />
            </ConsoleShell>
          }
        />
        <Route
          path="/patent-library"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <PatentLibrary />
            </ConsoleShell>
          }
        />
        <Route
          path="/similarity-search"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <SimilaritySearch />
            </ConsoleShell>
          }
        />
        <Route
          path="/saved-patents"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <SavedPatents />
            </ConsoleShell>
          }
        />
        <Route
          path="/reports"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <ReportsModule />
            </ConsoleShell>
          }
        />
        <Route
          path="/settings"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <Settings user={user} setUser={setUser} />
            </ConsoleShell>
          }
        />
        <Route
          path="/profile"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <Profile user={user} setUser={setUser} />
            </ConsoleShell>
          }
        />
        <Route
          path="/patent/:patentNumber"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <PatentDetail />
            </ConsoleShell>
          }
        />
        <Route
          path="/admin"
          element={
            <ConsoleShell user={user} setUser={setUser}>
              <AdminDashboard />
            </ConsoleShell>
          }
        />

        {/* Fallback routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
