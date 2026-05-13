import React, { useState, useEffect } from 'react';
import './AdminAnalytics.css';
import { formatDateTimeTo12Hour } from '../../utils/timeUtils';

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState({
    userGrowth: [],
    assignmentStats: { completed: 0, pending: 0, total: 0 },
    attendanceStats: { present: 0, absent: 0, late: 0, total: 0 },
    activeUsers: { faculty: 0, students: 0, totalUsers: 0 },
    departmentStats: [],
    recentActivity: [],
    performanceMetrics: {
      avgAttendance: 0,
      avgGrades: 0,
      completionRate: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // Fetch all analytics data
      const [
        userGrowthRes,
        assignmentStatsRes,
        attendanceStatsRes,
        activeUsersRes,
        departmentStatsRes,
        activityRes,
        performanceRes
      ] = await Promise.all([
        fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/analytics/user-growth?range=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/analytics/assignments', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/analytics/attendance', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/analytics/active-users', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/analytics/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/analytics/recent-activity', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/analytics/performance', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const userGrowth = userGrowthRes.ok ? await userGrowthRes.json() : [];
      const assignmentStats = assignmentStatsRes.ok ? await assignmentStatsRes.json() : {};
      const attendanceStats = attendanceStatsRes.ok ? await attendanceStatsRes.json() : {};
      const activeUsers = activeUsersRes.ok ? await activeUsersRes.json() : {};
      const departmentStats = departmentStatsRes.ok ? await departmentStatsRes.json() : [];
      const recentActivity = activityRes.ok ? await activityRes.json() : [];
      const performanceMetrics = performanceRes.ok ? await performanceRes.json() : {};

      setAnalytics({
        userGrowth,
        assignmentStats,
        attendanceStats,
        activeUsers,
        departmentStats,
        recentActivity,
        performanceMetrics
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (value, total) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="admin-analytics-container">
        <div className="admin-analytics-loading">
          <div className="admin-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const completionRate = calculatePercentage(
    analytics.assignmentStats.completed,
    analytics.assignmentStats.total
  );

  const attendanceRate = calculatePercentage(
    analytics.attendanceStats.present,
    analytics.attendanceStats.total
  );

  return (
    <div className="admin-analytics-container">
      <div className="admin-analytics-header">
        <h2>📊 Analytics Dashboard</h2>
        <div className="admin-time-range">
          <button
            className={timeRange === 'week' ? 'active' : ''}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button
            className={timeRange === 'month' ? 'active' : ''}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
          <button
            className={timeRange === 'year' ? 'active' : ''}
            onClick={() => setTimeRange('year')}
          >
            Year
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="admin-metrics-grid">
        <div className="admin-metric-card blue">
          <div className="admin-metric-icon">👥</div>
          <div className="admin-metric-content">
            <div className="admin-metric-value">{analytics.activeUsers.totalUsers}</div>
            <div className="admin-metric-label">Total Users</div>
          </div>
        </div>
        <div className="admin-metric-card green">
          <div className="admin-metric-icon">✓</div>
          <div className="admin-metric-content">
            <div className="admin-metric-value">{attendanceRate}%</div>
            <div className="admin-metric-label">Attendance Rate</div>
          </div>
        </div>
        <div className="admin-metric-card orange">
          <div className="admin-metric-icon">📝</div>
          <div className="admin-metric-content">
            <div className="admin-metric-value">{completionRate}%</div>
            <div className="admin-metric-label">Assignment Completion</div>
          </div>
        </div>
        <div className="admin-metric-card purple">
          <div className="admin-metric-icon">📈</div>
          <div className="admin-metric-content">
            <div className="admin-metric-value">
              {analytics.performanceMetrics.avgGrades || 'N/A'}
            </div>
            <div className="admin-metric-label">Average Grade</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="admin-analytics-grid">
        {/* User Growth Chart */}
        <div className="admin-analytics-card large">
          <h3>📈 User Growth Trend</h3>
          <div className="admin-chart-container">
            {analytics.userGrowth.length > 0 ? (
              <div className="admin-bar-chart">
                {analytics.userGrowth.map((item, index) => {
                  const maxValue = Math.max(...analytics.userGrowth.map(i => i.count));
                  const height = (item.count / maxValue) * 100;
                  return (
                    <div key={index} className="admin-bar-wrapper">
                      <div className="admin-bar-value">{item.count}</div>
                      <div
                        className="admin-chart-bar"
                        style={{ height: `${height}%` }}
                        title={`${item.period}: ${item.count} users`}
                      ></div>
                      <div className="admin-bar-label">{item.period}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="admin-no-data">No growth data available</div>
            )}
          </div>
        </div>

        {/* Assignment Statistics */}
        <div className="admin-analytics-card">
          <h3>📝 Assignment Statistics</h3>
          <div className="admin-donut-container">
            <svg viewBox="0 0 100 100" className="admin-donut-svg">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="20"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#4caf50"
                strokeWidth="20"
                strokeDasharray={`${(completionRate * 251) / 100} 251`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="admin-donut-center">
              <div className="admin-donut-value">{completionRate}%</div>
              <div className="admin-donut-label">Completed</div>
            </div>
          </div>
          <div className="admin-stats-breakdown">
            <div className="admin-stat-item">
              <span className="admin-stat-dot green"></span>
              <span>Completed: {analytics.assignmentStats.completed}</span>
            </div>
            <div className="admin-stat-item">
              <span className="admin-stat-dot orange"></span>
              <span>Pending: {analytics.assignmentStats.pending}</span>
            </div>
            <div className="admin-stat-item">
              <span className="admin-stat-dot blue"></span>
              <span>Total: {analytics.assignmentStats.total}</span>
            </div>
          </div>
        </div>

        {/* Attendance Statistics */}
        <div className="admin-analytics-card">
          <h3>✓ Attendance Overview</h3>
          <div className="admin-donut-container">
            <svg viewBox="0 0 100 100" className="admin-donut-svg">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="20"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#2196f3"
                strokeWidth="20"
                strokeDasharray={`${(attendanceRate * 251) / 100} 251`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="admin-donut-center">
              <div className="admin-donut-value">{attendanceRate}%</div>
              <div className="admin-donut-label">Present</div>
            </div>
          </div>
          <div className="admin-stats-breakdown">
            <div className="admin-stat-item">
              <span className="admin-stat-dot green"></span>
              <span>Present: {analytics.attendanceStats.present}</span>
            </div>
            <div className="admin-stat-item">
              <span className="admin-stat-dot red"></span>
              <span>Absent: {analytics.attendanceStats.absent}</span>
            </div>
            <div className="admin-stat-item">
              <span className="admin-stat-dot orange"></span>
              <span>Late: {analytics.attendanceStats.late}</span>
            </div>
          </div>
        </div>

        {/* Department Statistics - MSCIT only */}
        <div className="admin-analytics-card large">
          <h3>🏢 Msc.IT Department Overview</h3>
          <div className="admin-department-list">
            {analytics.departmentStats.length > 0 ? (
              analytics.departmentStats.map((dept, index) => (
                  <div key={index} className="admin-department-item">
                    <div className="admin-department-info">
                      <span className="admin-department-name">{dept.department}</span>
                      <span className="admin-department-count">
                        {dept.faculty_count} Faculty, {dept.student_count} Students
                      </span>
                    </div>
                    <div className="admin-department-bar">
                      <div
                        className="admin-department-fill"
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                    <span className="admin-department-total">{dept.total}</span>
                  </div>
              ))
            ) : (
              <div className="admin-no-data">No data available</div>
            )}
          </div>
        </div>

        {/* Active Users */}
        <div className="admin-analytics-card">
          <h3>👥 Active Users</h3>
          <div className="admin-active-users">
            <div className="admin-user-stat">
              <div className="admin-user-icon faculty">👨‍🏫</div>
              <div className="admin-user-info">
                <div className="admin-user-count">{analytics.activeUsers.faculty}</div>
                <div className="admin-user-label">Faculty Members</div>
              </div>
            </div>
            <div className="admin-user-stat">
              <div className="admin-user-icon student">👨‍🎓</div>
              <div className="admin-user-info">
                <div className="admin-user-count">{analytics.activeUsers.students}</div>
                <div className="admin-user-label">Students</div>
              </div>
            </div>
            <div className="admin-user-stat">
              <div className="admin-user-icon total">📊</div>
              <div className="admin-user-info">
                <div className="admin-user-count">{analytics.activeUsers.totalUsers}</div>
                <div className="admin-user-label">Total Users</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="admin-analytics-card large">
          <h3>🕐 Recent Activity</h3>
          <div className="admin-activity-list">
            {analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="admin-activity-item">
                  <div className={`admin-activity-icon ${activity.type}`}>
                    {activity.type === 'user' && '👤'}
                    {activity.type === 'assignment' && '📝'}
                    {activity.type === 'attendance' && '✓'}
                    {activity.type === 'message' && '💬'}
                  </div>
                  <div className="admin-activity-content">
                    <div className="admin-activity-title">{activity.title}</div>
                    <div className="admin-activity-time">
                      {formatDateTimeTo12Hour(activity.created_at)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="admin-no-data">No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;
