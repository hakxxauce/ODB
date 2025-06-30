const completedRaw = require('../WordpressDB/completedCourses.json');
const postsRaw = require('../WordpressDB/wp_posts.json');

// Extract posts (phpMyAdmin export structure)
let posts = [];
if (Array.isArray(postsRaw)) {
  const postsDataObj = postsRaw.find(obj => Array.isArray(obj.data));
  posts = postsDataObj ? postsDataObj.data : [];
}

// Extract completed courses (phpMyAdmin export structure)
let completed = [];
if (Array.isArray(completedRaw)) {
  const completedDataObj = completedRaw.find(obj => Array.isArray(obj.data));
  completed = completedDataObj ? completedDataObj.data : [];
}

// Build course ID -> title map, only for non-trashed courses
const courseIdToTitle = {};
posts.forEach(post => {
  if (post.post_type === 'courses' && post.post_status !== 'trash') {
    courseIdToTitle[String(post.ID)] = post.post_title;
  }
});

// Build user ID -> name map from usermeta
const userIdToName = {};
completed.forEach(entry => {
  if (entry.meta_key === 'first_name') {
    if (!userIdToName[entry.user_id]) userIdToName[entry.user_id] = {};
    userIdToName[entry.user_id].first = entry.meta_value;
  }
  if (entry.meta_key === 'last_name') {
    if (!userIdToName[entry.user_id]) userIdToName[entry.user_id] = {};
    userIdToName[entry.user_id].last = entry.meta_value;
  }
});

// Print completions with user names and course titles (only for non-trashed courses)
completed.forEach(entry => {
  if (entry.meta_key === '_tutor_instructor_course_id') {
    const userId = entry.user_id;
    const courseId = String(entry.meta_value);
    const courseTitle = courseIdToTitle[courseId];
    
    if (!courseTitle) return; // skip trashed/missing courses
    const nameObj = userIdToName[userId] || {};
    const userName = (nameObj.first || '') + ' ' + (nameObj.last || '');
    console.log(`User ${userName.trim() || userId} finished course: ${courseTitle}`);
  }
});