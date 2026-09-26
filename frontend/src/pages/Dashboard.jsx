import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../api/api';

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await api.get('/api/visitors/logs', { params });
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Could not load visitor logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const clearFilters = () => {
    setSearch('');
    setActionFilter('');
    setFrom('');
    setTo('');
    setTimeout(fetchLogs, 0);
  };

  const exportToExcel = () => {
    const rows = logs.map((log) => ({
      Visitor: log.passId?.visitorId?.name || '',
      Phone: log.passId?.visitorId?.phone || '',
      Purpose: log.passId?.purpose || '',
      Action: log.action,
      Timestamp: new Date(log.timestamp).toLocaleString(),
      PassId: log.passId?._id || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Visitor Logs');
    XLSX.writeFile(workbook, 'Visitor_Logs.xlsx');
  };

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700"
        >
          Export to Excel
        </button>
      </div>

      <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded-lg border">
        <input
          type="text"
          placeholder="Search name / phone / email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded flex-1 min-w-[200px]"
        />
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="border p-2 rounded">
          <option value="">All Actions</option>
          <option value="Check-In">Check-In</option>
          <option value="Check-Out">Check-Out</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border p-2 rounded" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Apply Filters
        </button>
        <button type="button" onClick={clearFilters} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
          Clear
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="border rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 font-semibold">Visitor</th>
              <th className="p-3 font-semibold">Purpose</th>
              <th className="p-3 font-semibold">Action</th>
              <th className="p-3 font-semibold">Timestamp</th>
              <th className="p-3 font-semibold">Pass ID</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">Loading...</td>
              </tr>
            )}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">No logs found.</td>
              </tr>
            )}
            {!loading &&
              logs.map((log) => (
                <tr key={log._id} className="border-b">
                  <td className="p-3">{log.passId?.visitorId?.name || 'Unknown'}</td>
                  <td className="p-3">{log.passId?.purpose || '-'}</td>
                  <td className={`p-3 font-medium ${log.action === 'Check-In' ? 'text-green-700' : 'text-orange-700'}`}>
                    {log.action}
                  </td>
                  <td className="p-3">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3 text-xs text-gray-500">{log.passId?._id}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
