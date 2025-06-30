const fs = require('fs');

// Load users
const usersRaw = require('../WordpressDB/wp_users.json');
let users = [];
if (Array.isArray(usersRaw)) {
  const usersDataObj = usersRaw.find(obj => Array.isArray(obj.data));
  users = usersDataObj ? usersDataObj.data : [];
}

// Load courses
const postsRaw = require('../WordpressDB/wp_posts.json');
let posts = [];
if (Array.isArray(postsRaw)) {
  const postsDataObj = postsRaw.find(obj => Array.isArray(obj.data));
  posts = postsDataObj ? postsDataObj.data : [];
}
const courses = posts.filter(post => post.post_type === 'courses' && post.post_status !== 'trash');

// Load usermeta
const usermetaRaw = require('../WordpressDB/wp_usermeta.json');
let usermeta = [];
if (Array.isArray(usermetaRaw)) {
  const usermetaDataObj = usermetaRaw.find(obj => Array.isArray(obj.data));
  usermeta = usermetaDataObj ? usermetaDataObj.data : [];
}

// Build user-course completion map
const userCourseCompleted = {};
usermeta.forEach(entry => {
  // This key may vary depending on your LMS plugin!
  if (entry.meta_key === '_tutor_completed_course_id' || entry.meta_key === '_tutor_instructor_course_id') {
    if (!userCourseCompleted[entry.user_id]) userCourseCompleted[entry.user_id] = new Set();
    userCourseCompleted[entry.user_id].add(String(entry.meta_value));
  }
});

// Build report
const report = [];
users.forEach(user => {
  courses.forEach(course => {
    const completed = userCourseCompleted[user.ID] && userCourseCompleted[user.ID].has(String(course.ID));
    report.push({
      user: user.display_name || user.user_login || user.user_email || user.ID,
      course: course.post_title,
      status: completed ? 'Completed' : 'Not Completed'
    });
  });
});

fs.writeFileSync('../ux/full_course_report.json', JSON.stringify(report, null, 2));
console.log('Exported full report to ux/full_course_report.json');