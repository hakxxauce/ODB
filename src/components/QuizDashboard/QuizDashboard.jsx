import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import * as XLSX from 'xlsx';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
}));

const QuizDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [quizCompletions, setQuizCompletions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const users = await fetch('/src/WordpressDB/split/wp_users.json').then(r => r.json());
        const posts = await fetch('/src/WordpressDB/split/wp_posts.json').then(r => r.json());
        const quizAttempts = await fetch('/src/WordpressDB/split/wp_tutor_quiz_attempts.json').then(r => r.json());
        const quizzes = posts.filter(p => p.post_type === 'tutor_quiz');
        const courses = posts.filter(p => p.post_type === 'courses');

        const userMap = {};
        users.forEach(u => { userMap[u.ID] = u.display_name; });
        const quizMap = {};
        quizzes.forEach(q => { quizMap[q.ID] = q.post_title; });
        const courseMap = {};
        courses.forEach(c => { courseMap[c.ID] = c.post_title; });

        const completions = quizAttempts.map(a => ({
          user_id: a.user_id,
          user_name: userMap[a.user_id] || a.user_id,
          quiz_id: a.quiz_id,
          quiz_title: quizMap[a.quiz_id] || a.quiz_id,
          course_id: a.course_id,
          course_title: courseMap[a.course_id] || a.course_id,
          earned_marks: a.earned_marks,
          total_marks: a.total_marks,
          attempt_status: a.attempt_status,
          completed_at: a.attempt_ended_at ? new Date(parseInt(a.attempt_ended_at, 10) * 1000).toLocaleString() : '',
        }));
        setQuizCompletions(completions);
      } catch (err) {
        setQuizCompletions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(quizCompletions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'QuizCompletions');
    XLSX.writeFile(wb, 'quiz_completions.xlsx');
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        🕹️ Quiz Completion Leaderboard
      </Typography>
      <Typography variant="body1" gutterBottom>
        See which users have completed which quizzes, their scores, and export to Excel!
      </Typography>
      <Box sx={{ mb: 2 }}>
        <button onClick={exportToExcel} style={{ padding: '8px 16px', fontWeight: 'bold', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Export to Excel
        </button>
      </Box>
      {loading ? (
        <CircularProgress />
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell>User</StyledTableCell>
                  <StyledTableCell>Course</StyledTableCell>
                  <StyledTableCell>Quiz</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell>Score</StyledTableCell>
                  <StyledTableCell>Completed At</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quizCompletions.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.user_name}</TableCell>
                    <TableCell>{row.course_title}</TableCell>
                    <TableCell>{row.quiz_title}</TableCell>
                    <TableCell>{row.attempt_status}</TableCell>
                    <TableCell>{row.earned_marks} / {row.total_marks}</TableCell>
                    <TableCell>{row.completed_at}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default QuizDashboard;
