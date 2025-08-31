import React, { useState, useEffect } from "react";
import {
  Bell,
  Settings,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Car,
  Wrench,
  DollarSign,
  Search,
  Eye,
  UserCheck,
  BarChart3,
  Activity,
  Plus,
  Filter,
  Download,
  History,
  FileText,
  Calendar,
} from "lucide-react";
import { useAuth } from "../context/AuthContext"; // Add this import
import { api } from "../services/api"; // Add this import

const AdminDashboard = () => {
  const { user } = useAuth(); // Add auth context
  const [isAcceptingRequests, setIsAcceptingRequests] = useState(true);
  const [notificationVisible, setNotificationVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');

  // State for API data
  const [stats, setStats] = useState({
    totalRequests: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    activeMechanics: 0,
  });
  const [serviceRequests, setServiceRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [error, setError] = useState(null); // Add error state

  // API Functions - FIXED
  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching dashboard stats...');
      const response = await api.getDashboardStats(); // Use api service
      
      if (response.success && response.data) {
        setStats({
          totalRequests: response.data.requests?.total || 0,
          pending: response.data.requests?.pending || 0,
          inProgress: response.data.requests?.inProgress || 0,
          completed: response.data.requests?.completed || 0,
          activeMechanics: response.data.users?.activeMechanics || 0,
        });
        console.log('Dashboard stats fetched successfully:', response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard statistics');
    }
  };

  const fetchServiceRequests = async (page = 1) => {
    try {
      console.log('Fetching service requests...', { page, statusFilter, serviceTypeFilter, searchTerm });
      
      const params = {
        page: page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(serviceTypeFilter && { serviceType: serviceTypeFilter }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await api.getAllServiceRequests(params); // Use api service
      
      if (response.success && response.data) {
        setServiceRequests(response.data.serviceRequests || []);
        setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
        console.log('Service requests fetched successfully:', response.data.serviceRequests?.length);
      }
    } catch (error) {
      console.error('Error fetching service requests:', error);
      setError('Failed to load service requests');
      setServiceRequests([]); // Clear on error
    }
  };

  const fetchAuditLogs = async (page = 1) => {
    try {
      console.log('Fetching audit logs...');
      
      const params = {
        page: page,
        limit: 20
      };

      const response = await api.getAuditLogs(params); // Use api service
      
      if (response.success && response.data) {
        setAuditLogs(response.data.activityLogs || []);
        console.log('Audit logs fetched successfully:', response.data.activityLogs?.length);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError('Failed to load audit logs');
      setAuditLogs([]); // Clear on error
    }
  };

  // Load initial data - FIXED
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) {
        console.log('No user found, skipping data load');
        setLoading(false);
        return;
      }

      console.log('Loading dashboard data for user:', user.email);
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchDashboardStats(),
          fetchServiceRequests(),
          fetchAuditLogs()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]); // Depend on user

  // Refetch requests when filters change - FIXED
  useEffect(() => {
    if (!loading && user) {
      console.log('Filters changed, refetching requests...');
      fetchServiceRequests(1);
    }
  }, [statusFilter, serviceTypeFilter, searchTerm, user]);

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-red-100 text-red-800 border-red-200";
      case "ACCEPTED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "CANCELLED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div
      className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${color} hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div
          className={`p-3 rounded-full ${color
            .replace("border-l-", "bg-")
            .replace("-500", "-100")}`}
        >
          <Icon className={`w-6 h-6 ${color.replace("border-l-", "text-")}`} />
        </div>
      </div>
    </div>
  );

  const RequestCard = ({ request }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {request.endUser
              ? `${request.endUser.firstName[0]}${request.endUser.lastName[0]}`
              : "?"}
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">
              {request.endUser ? `${request.endUser.firstName} ${request.endUser.lastName}` : 'Unknown User'}
            </h4>
            <p className="text-gray-500 text-sm">#{request.requestId}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
            request.status
          )}`}
        >
          {request.status.replace("_", " ")}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="truncate">{request.address || 'Location not specified'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Wrench className="w-4 h-4 text-gray-400" />
          <span>{request.serviceType}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span>₹{request.cost ? request.cost.toLocaleString() : 'TBD'}</span>
          </div>
          <span className="text-gray-500">
            {new Date(request.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {request.mechanic && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span className="text-blue-800 font-medium">
              Assigned to: {request.mechanic.firstName} {request.mechanic.lastName}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button 
          onClick={() => handleViewRequestDetails(request.id)}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
        >
          View Details (Read-Only)
        </button>
        <button 
          onClick={() => handleViewRequestDetails(request.id)}
          className="px-3 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const AuditLogCard = ({ log }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800">{log.actionDescription}</h4>
            <p className="text-gray-500 text-sm">by {log.userFullName}</p>
          </div>
        </div>
        <span className="text-xs text-gray-500">{log.timeAgo}</span>
      </div>
      
      {log.details && Object.keys(log.details).length > 0 && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
          <pre className="whitespace-pre-wrap text-gray-600 text-xs">
            {JSON.stringify(log.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  // Add handler for view request details
  const handleViewRequestDetails = async (requestId) => {
    try {
      console.log('Viewing request details for:', requestId);
      const response = await api.getServiceRequestDetails(requestId);
      if (response.success) {
        // You can implement a modal or navigation here
        console.log('Request details:', response.data);
        // For now, just log the details
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
    }
  };

  // Add loading and error states
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin authentication required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    RoadGuard Admin
                  </h1>
                  <p className="text-sm text-gray-500">
                    Manage service requests
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Tab Navigation */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'audit'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveTab('audit')}
                >
                  Audit Logs
                </button>
              </div>

              {/* Workshop Status Toggle */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isAcceptingRequests
                      ? "bg-green-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                ></span>
                <span className="text-sm font-medium text-gray-700">
                  {isAcceptingRequests
                    ? "System Active"
                    : "System Paused"}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isAcceptingRequests}
                    onChange={() =>
                      setIsAcceptingRequests(!isAcceptingRequests)
                    }
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                </label>
              </div>

              <button className="relative p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {stats.pending}
                </span>
              </button>
              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-semibold text-red-900">Error Loading Data</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setError(null);
                fetchDashboardStats();
                fetchServiceRequests();
                fetchAuditLogs();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Notification Banner */}
        {notificationVisible && stats.pending > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-blue-900">
                  Pending service requests require attention!
                </p>
                <p className="text-sm text-blue-700">
                  {stats.pending} requests awaiting mechanic assignment
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors transform hover:scale-105"
                onClick={() => {
                  setActiveTab('overview');
                  setStatusFilter('PENDING');
                }}
              >
                View Pending
              </button>
              <button
                onClick={() => setNotificationVisible(false)}
                className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Activity}
            title="Total Requests"
            value={stats.totalRequests}
            color="border-l-blue-500"
          />
          <StatCard
            icon={Clock}
            title="Pending"
            value={stats.pending}
            color="border-l-red-500"
          />
          <StatCard
            icon={CheckCircle}
            title="Completed"
            value={stats.completed}
            color="border-l-green-500"
          />
          <StatCard
            icon={Users}
            title="Active Mechanics"
            value={stats.activeMechanics}
            color="border-l-purple-500"
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Service Requests */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Service Requests (Read-Only)
                      </h3>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {pagination.total} Total
                      </span>
                    </div>
                    <button 
                      onClick={() => fetchServiceRequests(pagination.page)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex flex-wrap gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                    <select
                      value={serviceTypeFilter}
                      onChange={(e) => setServiceTypeFilter(e.target.value)}
                      className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Services</option>
                      <option value="ENGINE_REPAIR">Engine Repair</option>
                      <option value="TIRE_CHANGE">Tire Change</option>
                      <option value="TOWING">Towing</option>
                      <option value="BATTERY_JUMP">Battery Jump</option>
                      <option value="FUEL_DELIVERY">Fuel Delivery</option>
                    </select>
                  </div>
                </div>

                <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                  {serviceRequests.length > 0 ? (
                    serviceRequests.map((request) => (
                      <RequestCard key={request.id} request={request} />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {loading ? 'Loading requests...' : 'No service requests found'}
                      </p>
                      {error && (
                        <button 
                          onClick={() => fetchServiceRequests()}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Retry Loading
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={pagination.page <= 1}
                        onClick={() => fetchServiceRequests(pagination.page - 1)}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded disabled:opacity-50 hover:bg-gray-200 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => fetchServiceRequests(pagination.page + 1)}
                        className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button 
                    className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg text-left transition-all duration-200 transform hover:scale-105"
                    onClick={() => setActiveTab('audit')}
                  >
                    <History className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-900">
                        View Audit Logs
                      </div>
                      <div className="text-xs text-blue-600">
                        System activity history
                      </div>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg text-left transition-all duration-200 transform hover:scale-105">
                    <Download className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium text-green-900">
                        Export Data
                      </div>
                      <div className="text-xs text-green-600">
                        Download reports
                      </div>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-lg text-left transition-all duration-200 transform hover:scale-105">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-purple-900">
                        Analytics
                      </div>
                      <div className="text-xs text-purple-600">
                        System performance
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Priority Alerts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Priority Alerts
                </h3>
                <div className="space-y-3">
                  {stats.pending > 0 && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                      <p className="text-sm font-medium text-red-800">
                        {stats.pending} Pending Requests
                      </p>
                      <p className="text-xs text-red-600">
                        Awaiting mechanic assignment
                      </p>
                      <button 
                        onClick={() => setStatusFilter('PENDING')}
                        className="mt-2 text-xs bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700 transition-colors"
                      >
                        View All
                      </button>
                    </div>
                  )}
                  {stats.inProgress > 0 && (
                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                      <p className="text-sm font-medium text-yellow-800">
                        {stats.inProgress} In Progress
                      </p>
                      <p className="text-xs text-yellow-600">
                        Active service calls
                      </p>
                      <button 
                        onClick={() => setStatusFilter('IN_PROGRESS')}
                        className="mt-2 text-xs bg-yellow-600 text-white px-3 py-1 rounded-full hover:bg-yellow-700 transition-colors"
                      >
                        Monitor
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Today's Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  System Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Requests</span>
                    <span className="text-sm font-medium text-gray-800">
                      {stats.totalRequests}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{
                            width: `${stats.totalRequests > 0 ? (stats.completed / stats.totalRequests) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {stats.completed}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full"
                          style={{
                            width: `${stats.totalRequests > 0 ? (stats.pending / stats.totalRequests) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {stats.pending}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  System Audit Logs
                </h3>
                <button 
                  onClick={() => fetchAuditLogs()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <AuditLogCard key={log.id} log={log} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {loading ? 'Loading audit logs...' : 'No audit logs found'}
                  </p>
                  {error && (
                    <button 
                      onClick={() => fetchAuditLogs()}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Retry Loading
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;