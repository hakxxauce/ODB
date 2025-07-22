import React, { useState, useMemo } from 'react';
import './CourseTable.scss';

const CourseTable = ({ data, totalRecords, filteredRecords }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [itemsPerPage] = useState(50);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Updated for new data structure
  const getStatusBadge = () => {
    return (
      <span className="statusBadge completed">
         Completed
      </span>
    );
  };

  return (
    <div className="courseTableContainer">
      {/* Table Header */}
      <div className="tableHeader">
        <div className="tableInfo">
          <h3> Course Completion Data</h3>
          <p>
            Showing {startIndex + 1}-{Math.min(endIndex, sortedData.length)} of {sortedData.length} records
            {totalRecords !== filteredRecords && ` (filtered from ${totalRecords} total)`}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="tableWrapper">
        <table className="courseTable">
          <thead>
            <tr>
              <th onClick={() => handleSort('user_name')} className="sortable">
                User Name {getSortIcon('user_name')}
              </th>
              <th onClick={() => handleSort('course_title')} className="sortable">
                Course Title {getSortIcon('course_title')}
              </th>
              <th onClick={() => handleSort('instructor_name')} className="sortable">
                Trainer {getSortIcon('instructor_name')}
              </th>
              <th className="sortable">
                Status
              </th>
              <th onClick={() => handleSort('completed_at')} className="sortable">
                Completed At {getSortIcon('completed_at')}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((item, index) => (
              <tr key={`${item.user_id}-${item.course_id}-${index}`} className="tableRow">
                <td className="userCell">{item.user_name || '-'}</td>
                <td className="courseCell">{item.course_title}</td>
                <td className="instructorCell">{item.instructor_name}</td>
                <td className="statusCell">
                  {item.status === 'Completed' ? getStatusBadge() : (
                    <span className="statusBadge incomplete"> Incomplete</span>
                  )}
                </td>
                <td className="completedAtCell">{item.completed_at || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="paginationBtn"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
             First
          </button>
          <button
            className="paginationBtn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="pageNumbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`paginationBtn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            className="paginationBtn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
          <button
            className="paginationBtn"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last 
          </button>
        </div>
      )}

      {/* Empty State */}
      {currentData.length === 0 && (
        <div className="emptyState">
          <div className="emptyIcon">📭</div>
          <h3>No data found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
};

export default CourseTable;