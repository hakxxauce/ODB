import React, { useState, useEffect } from 'react';
import './App.scss';
import CourseDashboard from './components/CourseDashboard/CourseDashboard';
import omniLogo from './assets/omniLogo.png';

function App() {
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats for header
  const [headerStats, setHeaderStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalCompletions: 0,
  });

  useEffect(() => {
    setLoading(false);
    setCourseData(null);
  }, []);

  // Animate stat numbers
  const AnimatedNumber = ({ value }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      let start = 0;
      const end = value || 0;
      if (start === end) return;
      let increment = Math.ceil(end / 30);
      let current = start;
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setDisplay(end);
          clearInterval(timer);
        } else {
          setDisplay(current);
        }
      }, 20);
      return () => clearInterval(timer);
    }, [value]);
    return <span className="stat-number">{display}</span>;
  };

  // Handler to receive stats from dashboard
  const handleStatsUpdate = (stats) => {
    setHeaderStats(stats);
  };

  if (loading) {
    return (
      <div className="loadingContainer">
        <div className="loadingSpinner"></div>
        <h2>Loading your EPIC course data...</h2>
        <p>Preparing the ultimate learning dashboard</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="errorContainer">
        <h2>🚨 Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="appHeader">
        <div className="headerBar">
          {/* <img src={omniLogo} alt="OmniLearn Logo" className="omniLogo" /> */}
          <div className="headerContent">
            <h1>OmniLearn Dashboard</h1>
            <p>Let's get it</p>
          </div>
        </div>
        <div className="headerStats">
          <div className="statCard">
            <AnimatedNumber value={headerStats.totalUsers} />
            <span className="statLabel">Total Users</span>
          </div>
          <div className="statCard">
            <AnimatedNumber value={headerStats.totalCourses} />
            <span className="statLabel">Total Courses</span>
          </div>
          <div className="statCard">
            <AnimatedNumber value={headerStats.totalCompletions} />
            <span className="statLabel">Completions</span>
          </div>
        </div>
      </header>
      <main className="appMain">
        <CourseDashboard onStatsUpdate={handleStatsUpdate} />
      </main>
    </div>
  );
}

export default App;
