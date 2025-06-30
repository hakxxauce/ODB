class DataProcessor {
  static async loadAndProcessData() {
    try {
      // Load all JSON files
      const [fullReport, completions, users, posts, usermeta] = await Promise.all([
        this.loadJSONFile('/src/ux/full_course_report.json'),
        this.loadJSONFile('/src/ux/completions.json'),
        this.loadJSONFile('/src/WordpressDB/wp_users.json'),
        this.loadJSONFile('/src/WordpressDB/wp_posts.json'),
        this.loadJSONFile('/src/WordpressDB/wp_usermeta.json')
      ]);

      // Process the data
      const processedData = this.processData(fullReport, completions, users, posts, usermeta);
      
      return processedData;
    } catch (error) {
      console.error('Error loading data:', error);
      throw new Error('Failed to load course data. Please ensure all JSON files are present.');
    }
  }

  static async loadJSONFile(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Warning: Could not load ${path}:`, error.message);
      return null;
    }
  }

  static hasLessonToCourseMapping(posts) {
    if (!posts || !Array.isArray(posts)) return false;
    const postsDataObj = posts.find(obj => Array.isArray(obj.data));
    if (!postsDataObj) return false;
    return postsDataObj.data.some(post => post.post_type === 'lesson');
  }

  static processData(fullReport, completions, users, posts, usermeta) {
    // Use full report as primary data source
    let processedCompletions = [];
    
    if (fullReport && Array.isArray(fullReport)) {
      processedCompletions = fullReport;
    } else if (completions && Array.isArray(completions)) {
      // Fallback to completions.json if full report is not available
      processedCompletions = completions.map(item => ({
        user: item.user,
        course: item.course,
        status: 'Completed' // Assume completed since it's in completions.json
      }));
    }

    // Extract unique users and courses
    const uniqueUsers = [...new Set(processedCompletions.map(item => item.user))];
    const uniqueCourses = [...new Set(processedCompletions.map(item => item.course))];

    // Calculate statistics
    const totalCompletions = processedCompletions.filter(item => item.status === 'Completed').length;
    const totalNotCompleted = processedCompletions.filter(item => item.status === 'Not Completed').length;
    const completionRate = processedCompletions.length > 0 ? 
      ((totalCompletions / processedCompletions.length) * 100).toFixed(1) : 0;

    // Process WordPress data if available
    let wpUsers = [];
    let wpPosts = [];
    let wpUsermeta = [];

    if (users && Array.isArray(users)) {
      const usersDataObj = users.find(obj => Array.isArray(obj.data));
      wpUsers = usersDataObj ? usersDataObj.data : [];
    }

    if (posts && Array.isArray(posts)) {
      const postsDataObj = posts.find(obj => Array.isArray(obj.data));
      wpPosts = postsDataObj ? postsDataObj.data : [];
    }

    if (usermeta && Array.isArray(usermeta)) {
      const usermetaDataObj = usermeta.find(obj => Array.isArray(obj.data));
      wpUsermeta = usermetaDataObj ? usermetaDataObj.data : [];
    }

    return {
      completions: processedCompletions,
      statistics: {
        totalUsers: uniqueUsers.length,
        totalCourses: uniqueCourses.length,
        totalCompletions,
        totalNotCompleted,
        completionRate: parseFloat(completionRate),
        totalRecords: processedCompletions.length
      },
      uniqueUsers,
      uniqueCourses,
      wordpressData: {
        users: wpUsers,
        posts: wpPosts,
        usermeta: wpUsermeta
      },
      hasLessonToCourseMapping: this.hasLessonToCourseMapping(posts),
      metadata: {
        lastUpdated: new Date().toISOString(),
        dataSources: {
          fullReport: !!fullReport,
          completions: !!completions,
          wpUsers: !!users,
          wpPosts: !!posts,
          wpUsermeta: !!usermeta
        }
      }
    };
  }

  static async refreshData() {
    // Clear any cached data and reload
    return await this.loadAndProcessData();
  }

  static exportToCSV(data, filename = 'course_completions') {
    if (!data || !Array.isArray(data)) {
      throw new Error('No data to export');
    }

    const headers = ['User', 'Course', 'Status'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => 
        `"${item.user.replace(/"/g, '""')}","${item.course.replace(/"/g, '""')}","${item.status}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static validateData(data) {
    if (!data || !Array.isArray(data)) {
      return { isValid: false, errors: ['Data is not an array'] };
    }

    const errors = [];
    const requiredFields = ['user', 'course', 'status'];

    data.forEach((item, index) => {
      requiredFields.forEach(field => {
        if (!item[field]) {
          errors.push(`Row ${index + 1}: Missing ${field}`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default DataProcessor; 