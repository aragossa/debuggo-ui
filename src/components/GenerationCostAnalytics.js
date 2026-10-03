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

    const maxDaily = Math.max(...trends.map(t => t.daily_cost), 0) || 1;
    const st = stats ? stats.statistics : null;

    const statCards = st ? [
        ['Total Jobs', stats.total_jobs, 'Generations in the period', ''],
        ['Total Cost', formatCost(st.total_sum), 'Sum of all generation costs', 'accent'],
        ['Mean', formatCost(st.mean), 'Average cost of one generation', ''],
        ['Median (50th %ile)', formatCost(st.median), 'Half of the generations cost less than this', ''],
        ['90th Percentile', formatCost(st.percentile_90), '90% of generations cost less', ''],
        ['95th Percentile', formatCost(st.percentile_95), '95% of generations cost less', ''],
        ['99th Percentile', formatCost(st.percentile_99), 'Near worst case', ''],
        ['Min / Max', `${formatCost(st.min)} / ${formatCost(st.max)}`, 'Cheapest and most expensive', ''],
        ['Std Deviation', formatCost(st.std_dev), 'Spread of cost around the mean', ''],
    ] : [];

    return (
        <div className="cost-page">
            <div className="cost-card cost-header">
                <div>
                    <h1>Generation Cost Analytics</h1>
                    <p>Cost of AI requests during test generation, aggregated per generation job</p>
                </div>
                <div className="cost-period">
                    <label htmlFor="cost-period-select">Period</label>
                    <select id="cost-period-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
                        <option value="day">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last Year</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>

            {error && <div className="cost-error"><strong>Error:</strong> {error}</div>}

            {loading && !stats && <div className="cost-message">Loading cost analytics...</div>}

            {!loading && !error && (!stats || stats.total_jobs === 0) && (
                <div className="cost-message">No cost data for this period</div>
            )}

            {stats && stats.total_jobs > 0 && (
                <>
                    <div className="cost-grid">
                        {statCards.map(([label, value, hint, cls]) => (
                            <div className="cost-stat" key={label}>
                                <div className="cost-stat-label">{label}</div>
                                <div className={`cost-stat-value ${cls}`}>{value}</div>
                                <div className="cost-stat-hint">{hint}</div>
                            </div>
                        ))}
                    </div>

                    {trends.length > 0 && (
                        <div className="cost-card">
                            <h2 className="cost-title">Daily Cost Trends</h2>
                            <div className="cost-chart">
                                {trends.slice(0, 30).reverse().map((trend, index) => (
                                    <div key={index} className="cost-bar" title={`${trend.date}: ${formatCost(trend.daily_cost)}`}>
                                        <div className="cost-bar-fill" style={{ height: `${(trend.daily_cost / maxDaily) * 100}%` }}></div>
                                        <div className="cost-bar-label">
                                            {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="cost-table-wrap">
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

                    {stats.jobs && stats.jobs.length > 0 && (
                        <div className="cost-card">
                            <button className="cost-toggle" onClick={() => setShowJobs(!showJobs)}>
                                <span>Individual Generation Jobs ({stats.jobs.length})</span>
                                <span>{showJobs ? '▼' : '▶'}</span>
                            </button>

                            {showJobs && (
                                <div className="cost-table-wrap" style={{ marginTop: 12 }}>
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
                                                    <td className="mono" title={job.generation_job_id}>
                                                        {job.generation_job_id.substring(0, 8)}...
                                                    </td>
                                                    <td>{job.request_count}</td>
                                                    <td className="cost-cell">{formatCost(job.total_cost)}</td>
                                                    <td>{formatDuration(job.duration_seconds)}</td>
                                                    <td>{job.request_types}</td>
                                                    <td>{new Date(job.start_time).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GenerationCostAnalytics;
