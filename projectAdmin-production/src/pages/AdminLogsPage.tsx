import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiClient } from '../lib/api-client';
import { Activity, Search } from 'lucide-react';

interface AdminLog {
  id: string;
  timestamp: string;
  admin_name: string;
  action: string;
  affected_item: string;
  description: string;
  metadata: any;
}

export const AdminLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, startDate, endDate, currentPage]);

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, actionFilter, startDate, endDate, currentPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: currentPage,
      };

      if (actionFilter !== 'all') {
        params.action = actionFilter;
      }

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      const response = await apiClient.getAdminLogs(params);

      // Map backend to frontend format
      const formattedLogs: AdminLog[] = (response.logs || []).map((log: any) => ({
        id: log.id,
        timestamp: log.createdAt || new Date().toISOString(),
        admin_name: log.user?.email || 'System',
        action: log.actionType?.toLowerCase() || '',
        affected_item: log.entityId || `${log.entityType || 'Unknown'}`,
        description: log.description || '',
        metadata: log.metadata || null,
      }));

      setLogs(formattedLogs);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error fetching admin logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.admin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.affected_item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (startDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(startDate));
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(log => new Date(log.timestamp) <= end);
    }

    const startIndex = (currentPage - 1) * logsPerPage;
    const endIndex = startIndex + logsPerPage;
    setFilteredLogs(filtered.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filtered.length / logsPerPage));
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'text-green-600 bg-green-50';
      case 'update':
      case 'edit':
        return 'text-blue-600 bg-blue-50';
      case 'delete':
        return 'text-red-600 bg-red-50';
      case 'approve':
        return 'text-green-600 bg-green-50';
      case 'reject':
        return 'text-red-600 bg-red-50';
      case 'confirm':
        return 'text-teal-600 bg-teal-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="text-teal-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-800">Admin Logs</h1>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="text-gray-400" size={20} />
            <h3 className="font-semibold text-gray-700">Search + Filters:</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search logs..."
            />

            <Select
              label="Action Type"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Actions' },
                { value: 'create', label: 'Create' },
                { value: 'update', label: 'Update' },
                { value: 'edit', label: 'Edit' },
                { value: 'delete', label: 'Delete' },
                { value: 'approve', label: 'Approve' },
                { value: 'reject', label: 'Reject' },
                { value: 'confirm', label: 'Confirm' },
                { value: 'cancel', label: 'Cancel' },
              ]}
            />

            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />

            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {filteredLogs.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Activity className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No admin logs found matching your filters.</p>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      View
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.admin_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={log.affected_item}>
                          {log.affected_item}
                        </div>
                        {log.description && (
                          <div className="text-xs text-gray-500 mt-1">{log.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="cursor-pointer">
                            <summary className="text-teal-600 hover:text-teal-700">
                              Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto max-w-md">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="p-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({logs.length} total logs)
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
