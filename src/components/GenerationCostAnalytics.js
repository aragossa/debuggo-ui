import React, { useState, useEffect } from 'react';
import './GenerationCostAnalytics.css';

const GenerationCostAnalytics = () => {
    const [period, setPeriod] = useState('day');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [trends, setTrends] = useState([]);
    const [showJobs, setShowJobs] = useState(false);

    useEffect(() => {
        fetchCostData();
    }, [period]);

    const fetchCostData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            
            // Fetch statistics
            const statsResponse = await fetch(
                `${process.env.REACT_APP_API_URL}/api/generation-costs?period=${period}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (!statsResponse.ok) {
                throw new Error(`Failed to fetch statistics: ${statsResponse.statusText}`);
            }
            
            const statsData = await statsResponse.json();
            setStats(statsData.data);
            
            // Fetch trends
            const trendsDays = period === 'day' ? 7 : period === 'week' ? 30 : period === 'month' ? 90 : 365;
            const trendsResponse = await fetch(
                `${process.env.REACT_APP_API_URL}/api/generation-costs/trends?days=${trendsDays}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (!trendsResponse.ok) {
                throw new Error(`Failed to fetch trends: ${trendsResponse.statusText}`);
            }
            
            const trendsData = await trendsResponse.json();
            setTrends(trendsData.data);
            
        } catch (err) {
            console.error('Error fetching cost data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCost = (cost) => {
        if (cost === null || cost === undefined) return '$0.000000';
        return `$${cost.toFixed(6)}`;
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0s';
        if (seconds < 60) return `${seconds.toFixed(1)}s`;
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}m ${secs}s`;
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="generation-cost-analytics">
                    <div className="loading">Loading cost analytics...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="generation-cost-analytics">
                    <div className="error-message">
                        <strong>Error:</strong> {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="page-container">
                <div className="generation-cost-analytics">
                    <div className="no-data">No cost data available</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="generation-cost-analytics">
                <div className="analytics-header">
                    <h1>💰 Generation Job Cost Analytics</h1>
                    <p className="page-description">Comprehensive statistical analysis of AI generation job costs</p>
                <div className="period-selector">
                    <label>Time Period:</label>
                    <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                        <option value="day">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last Year</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Jobs</div>
                    <div className="stat-value">{stats.total_jobs}</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-label">Total Cost</div>
                    <div className="stat-value total-sum">{formatCost(stats.statistics.total_sum)}</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-label">Mean</div>
                    <div className="stat-value">{formatCost(stats.statistics.mean)}</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-label">Median (50th %ile)</div>
                    <div className="stat-value">{formatCost(stats.statistics.median)}</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-label">90th Percentile</div>
                    <div className="stat-value">{formatCost(stats.statistics.percentile_90)}</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-label">95th Percentile</div>
                    <div className="stat-value">{formatCost(stats.statistics.percentile_95)}</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-label">99th Percentile</div>
                    <div className="stat-value">{formatCost(stats.statistics.percentile_99)}</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-label">Min / Max</div>
                    <div className="stat-value">
                        {formatCost(stats.statistics.min)} / {formatCost(stats.statistics.max)}
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-label">Std Deviation</div>
                    <div className="stat-value">{formatCost(stats.statistics.std_dev)}</div>
                </div>
            </div>

            {/* Trends Chart */}
            {trends.length > 0 && (
                <div className="trends-section">
                    <h3>Daily Cost Trends</h3>
                    <div className="trends-chart">
                        {trends.slice(0, 30).reverse().map((trend, index) => (
                            <div key={index} className="trend-bar" title={`${trend.date}: ${formatCost(trend.daily_cost)}`}>
                                <div 
                                    className="trend-fill" 
                                    style={{
                                        height: `${(trend.daily_cost / Math.max(...trends.map(t => t.daily_cost))) * 100}%`
                                    }}
                                ></div>
                                <div className="trend-label">
                                    {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="trends-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Jobs</th>
                                    <th>Daily Cost</th>
                                    <th>Avg Cost/Request</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trends.slice(0, 10).map((trend, index) => (
                                    <tr key={index}>
                                        <td>{new Date(trend.date).toLocaleDateString()}</td>
                                        <td>{trend.jobs_count}</td>
                                        <td>{formatCost(trend.daily_cost)}</td>
                                        <td>{formatCost(trend.avg_cost_per_request)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Individual Jobs */}
            {stats.jobs && stats.jobs.length > 0 && (
                <div className="jobs-section">
                    <div className="jobs-header" onClick={() => setShowJobs(!showJobs)}>
                        <h3>Individual Generation Jobs ({stats.jobs.length})</h3>
                        <button className="toggle-btn">{showJobs ? '▼' : '▶'}</button>
                    </div>
                    
                    {showJobs && (
                        <div className="jobs-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Job ID</th>
                                        <th>Requests</th>
                                        <th>Total Cost</th>
                                        <th>Duration</th>
                                        <th>Request Types</th>
                                        <th>Start Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.jobs.map((job, index) => (
                                        <tr key={index}>
                                            <td className="job-id" title={job.generation_job_id}>
                                                {job.generation_job_id.substring(0, 8)}...
                                            </td>
                                            <td>{job.request_count}</td>
                                            <td className="cost-cell">{formatCost(job.total_cost)}</td>
                                            <td>{formatDuration(job.duration_seconds)}</td>
                                            <td className="request-types">{job.request_types}</td>
                                            <td>{new Date(job.start_time).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            </div>
        </div>
    );
};

export default GenerationCostAnalytics;
