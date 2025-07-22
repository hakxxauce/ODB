import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './analyticsPanel.scss';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AnalyticsPanel = () => {
  const [courseStats, setCourseStats] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const COURSES_PER_PAGE = 10;
  const [coursePage, setCoursePage] = useState(0);
  const totalCoursePages = Math.ceil(courseStats.length / COURSES_PER_PAGE);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const users = await fetch('/src/WordpressDB/split/wp_users.json').then(r => r.json());
        const posts = await fetch('/src/WordpressDB/split/wp_posts.json').then(r => r.json());
        const usermeta = await fetch('/src/WordpressDB/split/wp_usermeta.json').then(r => r.json());

        const userMap = {};
        users.forEach(u => { userMap[u.ID] = u.display_name; });
        const courseMap = {};
        posts.filter(p => p.post_type === 'courses' || p.post_type === 'course').forEach(c => { courseMap[c.ID] = c.post_title; });
        // Map all posts by ID for traversal
        const postById = {};
        posts.forEach(p => { postById[p.ID] = p; });
        // Map lesson IDs to course IDs
        const lessonToCourseMap = {};
        posts.filter(p => p.post_type === 'lesson').forEach(lesson => {
          lessonToCourseMap[lesson.ID] = lesson.post_parent;
        });
        // Helper: find courseId by traversing up the post tree
        function findCourseId(startId) {
          let currentId = lessonToCourseMap[startId] || startId;
          let safety = 0;
          while (currentId && !courseMap[currentId] && postById[currentId] && safety < 10) {
            currentId = postById[currentId].post_parent;
            safety++;
          }
          return courseMap[currentId] ? currentId : null;
        }
        // Course completions
        const completionsArr = usermeta.filter(meta => meta.meta_key.startsWith('_tutor_completed_lesson_id_'));
        const courseCounts = {};
        const userCounts = {};
        completionsArr.forEach(meta => {
          const lessonId = meta.meta_key.split('_').pop();
          const courseId = findCourseId(lessonId);
          if (courseId) {
            courseCounts[courseId] = (courseCounts[courseId] || 0) + 1;
          }
          userCounts[meta.user_id] = (userCounts[meta.user_id] || 0) + 1;
        });
        // Merge all courses, even those with 0 completions
        const allCourseStats = Object.entries(courseMap).map(([id, title]) => ({
          course: title || id,
          count: courseCounts[id] || 0,
        }));
        setCourseStats(allCourseStats);
        // Use all users from users.json for total users
        setUserStats(users.map(u => ({ user: u.display_name, count: userCounts[u.ID] || 0 })));
      } catch (err) {
        setCourseStats([]);
        setUserStats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reset coursePage to 0 whenever courseStats changes
  useEffect(() => {
    setCoursePage(0);
  }, [courseStats.length]);

  const pagedCourseStats = courseStats.slice(coursePage * COURSES_PER_PAGE, (coursePage + 1) * COURSES_PER_PAGE);

  const courseData = {
    labels: pagedCourseStats.map(c => c.course),
    datasets: [
      {
        label: 'Completions per Course',
        data: pagedCourseStats.map(c => c.count),
        backgroundColor: '#1976d2',
      },
    ],
  };

  const userData = {
    labels: userStats.map(u => u.user),
    datasets: [
      {
        label: 'Completions per User',
        data: userStats.map(u => u.count),
        backgroundColor: '#43a047',
      },
    ],
  };

  const analytics = useMemo(() => {
    if (!courseStats.length || !userStats.length) return null;

    const totalCompletions = courseStats.reduce((sum, item) => sum + item.count, 0);
    const totalNotCompleted = userStats.reduce((sum, item) => sum + item.count, 0) - totalCompletions;
    const completionRate = ((totalCompletions / (totalCompletions + totalNotCompleted)) * 100).toFixed(1);

    // Top users by completions
    const topUsers = userStats
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top courses by completions
    const topCourses = courseStats
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalCompletions,
      totalNotCompleted,
      completionRate,
      topUsers,
      topCourses,
      totalUsers: userStats.length,
      totalCourses: courseStats.length
    };
  }, [courseStats, userStats]);

  if (!analytics) {
    return (
      <div className="analytics-panel">
        <div className="empty-state">
          <div className="empty-icon"></div>
          <h3>No analytics data available</h3>
          <p>Please check your data files</p>
        </div>
      </div>
    );
  }

  return (
    <Box sx={{ p: 4 }} className="analyticsPanel">
      <Typography variant="h4" gutterBottom>
        Analytics Panel
      </Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6">Course Completions</Typography>
            <Bar data={courseData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button
                onClick={() => setCoursePage(p => Math.max(p - 1, 0))}
                disabled={coursePage === 0}
                style={{ marginRight: 8 }}
              >
                Previous
              </button>
              <span style={{ alignSelf: 'center' }}>
                Page {coursePage + 1} of {totalCoursePages}
              </span>
              <button
                onClick={() => setCoursePage(p => Math.min(p + 1, totalCoursePages - 1))}
                disabled={coursePage === totalCoursePages - 1}
                style={{ marginLeft: 8 }}
              >
                Next
              </button>
            </div>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">User Completions</Typography>
            <Bar data={userData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </Paper>
        </>
      )}

      {/* Overview Stats */}
      <div className="analyticsOverview">
        <div className="overviewCard">
          <span className="overviewIcon" style={{ background: '#1976d2' }}></span>
          <div className="overviewContent">
            <h3>{analytics.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="overviewCard">
          <span className="overviewIcon" style={{ background: '#43a047' }}></span>
          <div className="overviewContent">
            <h3>{analytics.totalCourses}</h3>
            <p>Total Courses</p>
          </div>
        </div>
        <div className="overviewCard">
          <span className="overviewIcon" style={{ background: '#00bcd4' }}></span>
          <div className="overviewContent">
            <h3>{analytics.totalCompletions}</h3>
            <p>Total Completions</p>
          </div>
        </div>
        <div className="overviewCard">
          <span className="overviewIcon" style={{ background: '#ff9800' }}></span>
          <div className="overviewContent">
            <h3>{analytics.completionRate}%</h3>
            <p>Completion Rate</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="analytics-grid">
        {/* Top Users */}
        <div className="chartCard">
          <h3>🏆 Top Users by Completions</h3>
          <div className="userCompletionsTableWrapper">
            <table className="userCompletionsTable">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User Name</th>
                  <th>Completions</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topUsers.map((item, index) => (
                  <tr key={item.user}>
                    <td>#{index + 1}</td>
                    <td>{item.user}</td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Courses */}
        <div className="chartCard">
          <h3> Most Completed Courses</h3>
          <div className="courseCompletionsTableWrapper">
            <table className="courseCompletionsTable">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Course Title</th>
                  <th>Completions</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topCourses.map((item, index) => (
                  <tr key={item.course}>
                    <td>#{index + 1}</td>
                    <td>{item.course}</td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Box>
  );
};

export default AnalyticsPanel;