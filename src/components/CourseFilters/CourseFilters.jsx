import React from 'react';
import './CourseFilters.css';

const CourseFilters = ({ filters, onFilterChange, uniqueUsers, uniqueCourses, uniqueDates, uniqueInstructors, uniqueAudiences, totalRecords }) => {
  return (
    <div className="course-filters">
      <div className="filters-header">
        <h3>Filters & Search</h3>
        <span className="record-count">
          Showing {totalRecords} of {totalRecords} records
        </span>
      </div>
      
      <div className="filters-grid">
        {/* Search Filter */}
        <div className="filter-group">
          <label htmlFor="search">Search</label>
          <input
            type="text"
            id="search"
            placeholder="Search users or courses..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange('searchTerm', e.target.value)}
            className="filter-input"
          />
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={filters.statusFilter}
            onChange={(e) => onFilterChange('statusFilter', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Not Completed">Incomplete</option>
          </select>
        </div>

        {/* User Filter */}
        <div className="filter-group">
          <label htmlFor="user">User</label>
          <select
            id="user"
            value={filters.userFilter}
            onChange={(e) => onFilterChange('userFilter', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>

        {/* Course Filter */}
        <div className="filter-group">
          <label htmlFor="course">Course</label>
          <select
            id="course"
            value={filters.courseFilter}
            onChange={(e) => onFilterChange('courseFilter', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Courses</option>
            {uniqueCourses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="filter-group">
          <label htmlFor="date">Upload Date</label>
          <select
            id="date"
            value={filters.dateFilter}
            onChange={(e) => onFilterChange('dateFilter', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Dates</option>
            {uniqueDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </div>

        {/* Instructor Filter */}
        <div className="filter-group">
          <label htmlFor="instructor">Instructor</label>
          <select
            id="instructor"
            value={filters.instructorFilter}
            onChange={(e) => onFilterChange('instructorFilter', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Instructors</option>
            {uniqueInstructors.map(instructor => (
              <option key={instructor} value={instructor}>{instructor}</option>
            ))}
          </select>
        </div>

        {/* Audience Filter */}
        <div className="filter-group">
          <label htmlFor="audience">Targeted Audience</label>
          <select
            id="audience"
            value={filters.audienceFilter}
            onChange={(e) => onFilterChange('audienceFilter', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Audiences</option>
            {uniqueAudiences.map(audience => (
              <option key={audience} value={audience}>{audience}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      {(filters.searchTerm || filters.statusFilter !== 'all' || filters.userFilter !== 'all' || filters.courseFilter !== 'all' || filters.dateFilter !== 'all' || filters.instructorFilter !== 'all' || filters.audienceFilter !== 'all') && (
        <div className="clear-filters">
          <button 
            className="clear-btn"
            onClick={() => {
              onFilterChange('searchTerm', '');
              onFilterChange('statusFilter', 'all');
              onFilterChange('userFilter', 'all');
              onFilterChange('courseFilter', 'all');
              onFilterChange('dateFilter', 'all');
              onFilterChange('instructorFilter', 'all');
              onFilterChange('audienceFilter', 'all');
            }}
          >
            🗑️ Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseFilters;