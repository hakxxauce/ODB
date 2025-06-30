import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import * as XLSX from 'xlsx';
import './CourseDashboard.scss';
import CourseTable from '../CourseTable/CourseTable';
import CourseFilters from '../CourseFilters/CourseFilters';
import AnalyticsPanel from '../AnalyticsPanel/AnalyticsPanel';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
}));

const CourseDashboard = ({ onStatsUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [completions, setCompletions] = useState([]);
  const [usersList, setUsersList] = useState([]); // Store all users
  const [filters, setFilters] = useState({
    searchTerm: '',
    statusFilter: 'all',
    userFilter: 'all',
    courseFilter: 'all',
    dateFilter: 'all',
    instructorFilter: 'all',
    audienceFilter: 'all',
  });

  const [viewMode, setViewMode] = useState('table'); // 'table' or 'analytics'

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!completions) return [];

    return completions.filter(item => {
      const matchesSearch = !filters.searchTerm || 
        item.user_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        item.course_title.toLowerCase().includes(filters.searchTerm.toLowerCase());

      let matchesStatus = true;
      if (filters.statusFilter === 'Completed') {
        matchesStatus = item.status === 'Completed';
      } else if (filters.statusFilter === 'Not Completed') {
        matchesStatus = item.status === 'Incomplete';
      }

      const matchesUser = filters.userFilter === 'all' || 
        item.user_name === filters.userFilter;
  

      const matchesCourse = filters.courseFilter === 'all' || 
        item.course_title === filters.courseFilter;

      const matchesDate = filters.dateFilter === 'all' || item.course_upload_date === filters.dateFilter;

      const matchesInstructor = filters.instructorFilter === 'all' || item.instructor_name === filters.instructorFilter;

      const matchesAudience = filters.audienceFilter === 'all' || item.target_audience === filters.audienceFilter;

      return matchesSearch && matchesStatus && matchesUser && matchesCourse && matchesDate && matchesInstructor && matchesAudience;
    });
  }, [completions, filters]);

  // Get unique users, courses, dates, instructors, audiences for filter options
  const uniqueUsers = useMemo(() => {
    if (!completions) return [];
    return [...new Set(completions.map(item => item.user_name))].sort();
  }, [completions]);

  const uniqueCourses = useMemo(() => {
    if (!completions) return [];
    return [...new Set(completions.map(item => item.course_title))].sort();
  }, [completions]);

  const uniqueDates = useMemo(() => {
    if (!completions) return [];
    return [...new Set(completions.map(item => item.course_upload_date))].sort();
  }, [completions]);

  const uniqueInstructors = useMemo(() => {
    if (!completions) return [];
    return [...new Set(completions.map(item => item.instructor_name))].sort();
  }, [completions]);

  const uniqueAudiences = useMemo(() => {
    if (!completions) return [];
    return [...new Set(completions.map(item => item.target_audience))].sort();
  }, [completions]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleExportCSV = () => {
    // Export all users x all courses, marking Completed/Incomplete
    if (!usersList.length || !completions.length) return;
    const userMap = {};
    usersList.forEach(u => { userMap[u.ID] = u.display_name; });
    const courseSet = new Set(completions.map(item => item.course_id));
    const courseTitleMap = {};
    completions.forEach(item => { courseTitleMap[item.course_id] = item.course_title; });
    const allCourseIds = Array.from(courseSet);
    // Build a map of completions: user_id+course_id => status
    const completionMap = {};
    completions.forEach(item => {
      if (item.user_id && item.course_id) {
        completionMap[`${item.user_id}_${item.course_id}`] = item.status === 'Completed' ? 'Completed' : 'Incomplete';
      }
    });
    const headers = ['User', ...allCourseIds.map(cid => courseTitleMap[cid] || cid)];
    const csvRows = [headers.join(',')];
    usersList.forEach(user => {
      const row = [user.display_name];
      allCourseIds.forEach(cid => {
        const status = completionMap[`${user.ID}_${cid}`] || 'Incomplete';
        row.push(status);
      });
      csvRows.push(row.map(val => `"${val.replace(/"/g, '""')}"`).join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full_course_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load split JSON files
        const users = await fetch('/src/WordpressDB/split/wp_users.json').then(r => r.json());
        setUsersList(users); // Store all users
        const posts = await fetch('/src/WordpressDB/split/wp_posts.json').then(r => r.json());
        const usermeta = await fetch('/src/WordpressDB/split/wp_usermeta.json').then(r => r.json());
        const postmeta = await fetch('/src/WordpressDB/split/wp_postmeta.json').then(r => r.json());

        // Map user IDs to names
        const userMap = {};
        users.forEach(u => { userMap[u.ID] = u.display_name; });

        // Map course IDs to titles, upload date, and instructor
        const courseMap = {};
        const courseDateMap = {};
        const courseInstructorMap = {};
        posts.filter(p => p.post_type === 'courses' || p.post_type === 'course').forEach(c => {
          courseMap[c.ID] = c.post_title;
          courseDateMap[c.ID] = c.post_date.split(' ')[0];
          courseInstructorMap[c.ID] = userMap[c.post_author] || c.post_author;
        });

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
          let currentId = lessonToCourseMap[startId];
          let safety = 0;
          while (currentId && !courseMap[currentId] && postById[currentId] && safety < 10) {
            currentId = postById[currentId].post_parent;
            safety++;
          }
          return courseMap[currentId] ? currentId : null;
        }

        // Map course ID to targeted audience
        const audienceMap = {};
        postmeta.forEach(meta => {
          if (meta.meta_key === '_tutor_course_target_audience') {
            audienceMap[meta.post_id] = meta.meta_value.replace(/\r?\n/g, ', ');
          }
        });

        // Find completions in usermeta
        const completionsArr = usermeta.filter(meta => meta.meta_key.startsWith('_tutor_completed_lesson_id_'));
        const completionsData = completionsArr.map(meta => {
          const lessonId = meta.meta_key.split('_').pop();
          const courseId = findCourseId(lessonId);
          return {
            user_id: meta.user_id,
            user_name: userMap[meta.user_id] || meta.user_id,
            course_id: courseId || 'Unknown',
            course_title: courseMap[courseId] || 'Unknown Course',
            completed_at: new Date(parseInt(meta.meta_value, 10) * 1000).toLocaleString(),
            course_upload_date: courseDateMap[courseId] || 'Unknown',
            instructor_name: courseInstructorMap[courseId] || 'Unknown',
            target_audience: audienceMap[courseId] || 'Unknown',
            status: 'Completed',
          };
        });

        // Add all courses with no completions as 'incomplete'
        const completedCourseIds = new Set(completionsData.map(c => c.course_id));
        const allCourseIds = Object.keys(courseMap);
        const incompleteCourses = allCourseIds
          .filter(cid => !completedCourseIds.has(cid))
          .map(cid => ({
            user_id: '',
            user_name: '',
            course_id: cid,
            course_title: courseMap[cid] || 'Unknown Course',
            completed_at: '',
            course_upload_date: courseDateMap[cid] || 'Unknown',
            instructor_name: courseInstructorMap[cid] || 'Unknown',
            target_audience: audienceMap[cid] || 'Unknown',
            status: 'Incomplete',
          }));

        setCompletions([...completionsData, ...incompleteCourses]);
        // Send stats to parent if callback exists
        if (onStatsUpdate) {
          const totalUsers = users.length; // Use all users
          const totalCourses = Object.keys(courseMap).length;
          const totalCompletions = completionsData.length;
          onStatsUpdate({
            totalUsers,
            totalCourses,
            totalCompletions,
          });
        }
      } catch (err) {
        setCompletions([]);
        setUsersList([]);
        if (onStatsUpdate) {
          onStatsUpdate({ totalUsers: 0, totalCourses: 0, totalCompletions: 0 });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const exportToExcel = () => {
    // Export all users x all courses, marking Completed/Incomplete
    if (!usersList.length || !completions.length) return;
    const userMap = {};
    usersList.forEach(u => { userMap[u.ID] = u.display_name; });
    const courseSet = new Set(completions.map(item => item.course_id));
    const courseTitleMap = {};
    completions.forEach(item => { courseTitleMap[item.course_id] = item.course_title; });
    const allCourseIds = Array.from(courseSet);
    const completionMap = {};
    completions.forEach(item => {
      if (item.user_id && item.course_id) {
        completionMap[`${item.user_id}_${item.course_id}`] = item.status === 'Completed' ? 'Completed' : 'Incomplete';
      }
    });
    const data = usersList.map(user => {
      const row = { User: user.display_name };
      allCourseIds.forEach(cid => {
        row[courseTitleMap[cid] || cid] = completionMap[`${user.ID}_${cid}`] || 'Incomplete';
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FullReport');
    XLSX.writeFile(wb, `full_course_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="courseDashboard">
      {/* Dashboard Controls */}
      <div className="dashboardControls">
        <div className="viewToggle">
          <button 
            className={`toggleBtn${viewMode === 'table' ? ' active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <span role="img" aria-label="table">📊</span> Table View
          </button>
          <button 
            className={`toggleBtn${viewMode === 'analytics' ? ' active' : ''}`}
            onClick={() => setViewMode('analytics')}
          >
            <span role="img" aria-label="analytics">📈</span> Analytics
          </button>
        </div>
        <div className="exportSection">
          <button className="exportBtn" onClick={handleExportCSV}>
            <span role="img" aria-label="csv">📥</span> Export CSV ({filteredData.length} records)
          </button>
          <button className="exportExcelBtn" onClick={exportToExcel}>
            <span role="img" aria-label="excel">📊</span> Export to Excel
          </button>
        </div>
      </div>
      {/* Filters */}
      <CourseFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        uniqueUsers={uniqueUsers}
        uniqueCourses={uniqueCourses}
        uniqueDates={uniqueDates}
        uniqueInstructors={uniqueInstructors}
        uniqueAudiences={uniqueAudiences}
        totalRecords={filteredData.length}
      />
      {/* Content */}
      <div className="dashboardContent">
        {viewMode === 'table' ? (
          <CourseTable 
            data={filteredData}
            totalRecords={completions.length}
            filteredRecords={filteredData.length}
          />
        ) : (
          <AnalyticsPanel 
            data={completions}
            filteredData={filteredData}
          />
        )}
      </div>
    </div>
  );
};

export default CourseDashboard;