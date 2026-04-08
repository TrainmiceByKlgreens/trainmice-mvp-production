import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiClient } from '../lib/api-client';
import { History, Search } from 'lucide-react';

interface ActivityLog {
    id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    action_type: string;
    entity_type: string;
    entity_id: string | null;
    description: string;
    metadata: any;
    created_at: string;
}

export const TrainerLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const logsPerPage = 20;

    useEffect(() => {
        fetchLogs();
    }, [actionFilter, currentPage]);

    const fetchLogs = async () => {
        try {
            setLoading(true);

            const params: any = {
                page: currentPage,
                limit: logsPerPage,
                userRole: 'TRAINER',
            };

            if (actionFilter !== 'all') {
                params.actionType = actionFilter.toUpperCase();
            }

            const response = await apiClient.getActivityLogs(params);

            // Map backend camelCase to frontend snake_case
            const formattedLogs: ActivityLog[] = (response.logs || []).map((log: any) => ({
                id: log.id,
                user_id: log.userId || '',
                user_email: log.user?.email || 'System',
                user_name: log.user?.fullName || 'N/A',
                action_type: log.actionType?.toLowerCase() || '',
                entity_type: log.entityType || '',
                entity_id: log.entityId || null,
                description: log.description || '',
                metadata: log.metadata || null,
                created_at: log.createdAt || new Date().toISOString(),
            }));

            setLogs(formattedLogs);
            setTotalPages(response.totalPages || 1);
        } catch (error) {
            console.error('Error fetching trainer logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActionBadgeVariant = (action: string) => {
        switch (action) {
            case 'create': return 'success';
            case 'update': return 'info';
            case 'delete': return 'danger';
            case 'login': return 'success';
            case 'approve': return 'success';
            case 'reject': return 'danger';
            default: return 'info';
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
                    <History className="text-green-600" size={32} />
                    <h1 className="text-3xl font-bold text-gray-800">Trainer Logs</h1>
                </div>
            </div>

            <Card>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <Search size={18} />
                            </span>
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search logs by trainer name, email, or description..."
                                className="pl-10"
                            />
                        </div>

                        <Select
                            value={actionFilter}
                            onChange={(e) => {
                                setActionFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            options={[
                                { value: 'all', label: 'All Actions' },
                                { value: 'login', label: 'Login' },
                                { value: 'create', label: 'Create' },
                                { value: 'update', label: 'Update' },
                                { value: 'delete', label: 'Delete' },
                            ]}
                        />
                    </div>
                </div>
            </Card>

            {filteredLogs.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <History className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-600">No trainer logs found matching your filters.</p>
                    </div>
                </Card>
            ) : (
                <>
                    <div className="space-y-4">
                        {filteredLogs.map((log) => (
                            <Card key={log.id} className="hover:shadow-md transition-shadow border-l-4 border-green-500">
                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <Badge variant={getActionBadgeVariant(log.action_type)}>
                                                    {log.action_type.toUpperCase()}
                                                </Badge>
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {log.user_name}
                                                </span>
                                                <span className="text-xs text-gray-500">({log.user_email})</span>
                                                <span className="text-sm text-gray-500">•</span>
                                                <span className="text-sm text-gray-500">{formatDate(log.created_at)}</span>
                                            </div>

                                            <p className="text-gray-800 font-medium">{log.description}</p>

                                            <div className="mt-2 text-xs text-gray-500 flex items-center space-x-2">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded">
                                                    Entity: {log.entity_type}
                                                </span>
                                                {log.entity_id && (
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                                                        ID: {log.entity_id.substring(0, 8)}...
                                                    </span>
                                                )}
                                            </div>

                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <details className="mt-2">
                                                    <summary className="text-xs text-green-600 cursor-pointer hover:text-green-700 font-medium">
                                                        View technical details
                                                    </summary>
                                                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                                                        {JSON.stringify(log.metadata, null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <div className="p-4 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing {filteredLogs.length} logs
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
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
