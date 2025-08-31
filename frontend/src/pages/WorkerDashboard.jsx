import React, { useState, useEffect } from 'react';
import { FiCalendar, FiList, FiTrello, FiMapPin, FiClock, FiUser, FiPhone, FiCheck, FiX, FiRefreshCw, FiAlertCircle, FiFilter, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Layout from '../components/Layout/Layout';
import ServiceRequestModal from '../components/requests/ServiceRequestModal'; // Changed from AcceptRejectModal
import { api } from '../services/api';
import { SERVICE_STATUS, SERVICE_TYPE_DISPLAY, VEHICLE_TYPE_DISPLAY, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';

const WorkerDashboard = () => {
  const [viewMode, setViewMode] = useState('list');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    serviceType: '',
    vehicleType: '',
    maxDistance: 50,
    showOnlyAvailable: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  // Kanban columns state
  const [kanbanColumns, setKanbanColumns] = useState({
    'available': { name: 'Available', items: [] },
    'accepted': { name: 'Accepted', items: [] },
    'in-progress': { name: 'In Progress', items: [] },
    'completed': { name: 'Completed', items: [] },
    'rejected': { name: 'Rejected', items: [] }
  });
  
  // Calendar view state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    console.log('🔄 useEffect triggered - filters changed:', filters);
    fetchServiceRequests();
    if (filters.showOnlyAvailable) {
      fetchAvailableRequests();
    }
  }, [filters, pagination.page]);

  const fetchServiceRequests = async () => {
    try {
      console.log('🔄 Fetching service requests...');
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        maxDistance: filters.maxDistance
      };

      if (filters.status) params.status = filters.status;
      if (filters.serviceType) params.serviceType = filters.serviceType;
      if (filters.vehicleType) params.vehicleType = filters.vehicleType;
      
      const response = await api.getMechanicServiceRequests(params);
      console.log('📥 Service requests response:', response);

      if (response.success) {
        const requests = response.data.serviceRequests || [];
        setServiceRequests(requests);
        setPagination(response.data.pagination || pagination);
        updateKanbanColumns([...requests, ...availableRequests]);
      } else {
        throw new Error(response.message || 'Failed to fetch service requests');
      }
    } catch (err) {
      console.error('❌ Error fetching service requests:', err);
      setError(err.message || ERROR_MESSAGES.GENERIC_ERROR);
      setServiceRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRequests = async () => {
    try {
      console.log('🔄 Fetching available requests...');
      
      const params = {
        page: 1,
        limit: 50,
        maxDistance: filters.maxDistance
      };

      if (filters.serviceType) params.serviceType = filters.serviceType;
      if (filters.vehicleType) params.vehicleType = filters.vehicleType;
      
      const response = await api.getAvailableServiceRequests(params);
      console.log('📥 Available requests response:', response);

      if (response.success) {
        const available = response.data.serviceRequests || [];
        setAvailableRequests(available);
        updateKanbanColumns([...serviceRequests, ...available]);
      } else {
        console.warn('⚠️ Failed to fetch available requests:', response.message);
      }
    } catch (err) {
      console.error('❌ Error fetching available requests:', err);
    }
  };

  const updateKanbanColumns = (allRequests) => {
    console.log('🔄 Updating kanban columns with all requests:', allRequests);

    const grouped = allRequests.reduce((acc, request) => {
      let status = request.status;
      if (typeof status === 'string') {
        status = status.toLowerCase().replace('_', '-');
      }
      
      let columnKey = status;
      if (status === 'pending') {
        columnKey = 'available';
      }
      
      if (!acc[columnKey]) acc[columnKey] = [];
      
      const exists = acc[columnKey].find(r => r.id === request.id);
      if (!exists) {
        acc[columnKey].push(request);
      }
      
      return acc;
    }, {});

    setKanbanColumns(prev => ({
      available: { ...prev.available, items: grouped.available || [] },
      accepted: { ...prev.accepted, items: grouped.accepted || [] },
      'in-progress': { ...prev['in-progress'], items: grouped['in-progress'] || [] },
      completed: { ...prev.completed, items: grouped.completed || [] },
      rejected: { ...prev.rejected, items: grouped.rejected || [] }
    }));
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowServiceRequestModal(true);
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setActionLoading(true);
      console.log('🔄 Accepting request:', requestId);
      
      const response = await api.acceptServiceRequest(requestId);
      
      if (response.success) {
        addNotification('Service request accepted successfully!', 'success');
        setShowServiceRequestModal(false);
        await fetchServiceRequests();
        if (filters.showOnlyAvailable) {
          await fetchAvailableRequests();
        }
      } else {
        throw new Error(response.message || 'Failed to accept request');
      }
    } catch (err) {
      console.error('❌ Error accepting request:', err);
      addNotification(err.message || 'Failed to accept service request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // FIXED: Pass reason as an object with 'reason' property
  const handleRejectRequest = async (requestId, reason = '') => {
    try {
      setActionLoading(true);
      console.log('🔄 Rejecting request:', requestId, 'with reason:', reason);
      
      // FIXED: Pass reason as an object, not a string
      const response = await api.rejectServiceRequest(requestId, { reason });
      
      if (response.success) {
        addNotification('Service request rejected successfully!', 'success');
        setShowServiceRequestModal(false);
        await fetchServiceRequests();
        if (filters.showOnlyAvailable) {
          await fetchAvailableRequests();
        }
      } else {
        throw new Error(response.message || 'Failed to reject request');
      }
    } catch (err) {
      console.error('❌ Error rejecting request:', err);
      addNotification(err.message || 'Failed to reject service request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus, additionalData = {}) => {
    try {
      setActionLoading(true);
      console.log('🔄 Updating status:', requestId, newStatus, additionalData);
      
      const response = await api.updateMechanicServiceRequestStatus(requestId, {
        status: newStatus,
        ...additionalData
      });
      
      if (response.success) {
        addNotification(`Request status updated to ${newStatus.toLowerCase().replace('_', ' ')}`, 'success');
        setShowServiceRequestModal(false);
        fetchServiceRequests();
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('❌ Error updating status:', err);
      addNotification(err.message || 'Failed to update request status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const formatDistance = (distance) => {
    if (distance === undefined || distance === null) return '';
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const requestDate = new Date(date);
    const diffInMinutes = Math.floor((now - requestDate) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getActionButtons = (request) => {
    const actions = [];
    
    // View details button - always available
    actions.push(
      <button
        key="view"
        onClick={() => handleViewRequest(request)}
        className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
      >
        <FiEye size={14} />
        View
      </button>
    );

    // Accept/Reject buttons for PENDING requests without mechanic
    if (request.status === 'PENDING' && !request.mechanicId) {
      actions.push(
        <button
          key="accept"
          onClick={() => handleAcceptRequest(request.id)}
          disabled={actionLoading}
          className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded text-sm"
        >
          <FiCheck size={14} />
          Accept
        </button>
      );

      actions.push(
        <button
          key="reject"
          onClick={() => {
            const reason = prompt('Reason for rejection (optional):');
            if (reason !== null) { // User didn't cancel
              handleRejectRequest(request.id, reason);
            }
          }}
          disabled={actionLoading}
          className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded text-sm"
        >
          <FiX size={14} />
          Reject
        </button>
      );
    }

    // Status update buttons for assigned requests
    if (request.mechanicId && (request.isAssignedToMe || request.mechanicActions?.canUpdateStatus)) {
      if (request.status === 'ACCEPTED') {
        actions.push(
          <button
            key="start"
            onClick={() => handleUpdateStatus(request.id, 'IN_PROGRESS')}
            disabled={actionLoading}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded text-sm"
          >
            <FiRefreshCw size={14} />
            Start Work
          </button>
        );
      }

      if (request.status === 'IN_PROGRESS') {
        actions.push(
          <button
            key="complete"
            onClick={() => {
              const cost = prompt('Enter service cost (optional):');
              handleUpdateStatus(request.id, 'COMPLETED', { cost: cost || undefined });
            }}
            disabled={actionLoading}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded text-sm"
          >
            <FiCheck size={14} />
            Complete
          </button>
        );
      }
    }

    return actions;
  };

  const RequestCard = ({ request, compact = false }) => {
    const actions = getActionButtons(request);
    const canAccept = request.status === 'PENDING' && !request.mechanicId;
    const isAssignedToMe = request.mechanicId && request.isAssignedToMe;

    return (
      <div className={`bg-gray-700 rounded-lg ${compact ? 'p-2 mb-2' : 'p-4 mb-3'} hover:bg-gray-600 transition-colors`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className={`font-semibold text-white ${compact ? 'text-sm' : ''}`}>
              {SERVICE_TYPE_DISPLAY[request.serviceType] || request.serviceType}
            </h3>
            <p className={`text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
              {request.vehicleMake} {request.vehicleModel} ({VEHICLE_TYPE_DISPLAY[request.vehicleType]})
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-1 rounded-full ${compact ? 'text-xs' : 'text-xs'} font-medium ${
              SERVICE_STATUS[request.status]?.bgColor || 'bg-gray-100'
            } ${SERVICE_STATUS[request.status]?.textColor || 'text-gray-800'}`}>
              {SERVICE_STATUS[request.status]?.label || request.status}
            </span>
            {isAssignedToMe && (
              <span className="px-2 py-1 rounded-full text-xs bg-blue-600 text-white">
                Assigned to You
              </span>
            )}
            {canAccept && (
              <span className="px-2 py-1 rounded-full text-xs bg-yellow-600 text-white">
                Available
              </span>
            )}
          </div>
        </div>
        
        {!compact && (
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <FiUser size={14} />
              <span>{request.endUser?.firstName} {request.endUser?.lastName}</span>
              {request.endUser?.phone && (
                <>
                  <FiPhone size={14} className="ml-2" />
                  <span>{request.endUser.phone}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <FiMapPin size={14} />
              <span className="truncate">{request.address}</span>
              {request.distance && (
                <span className="text-blue-400">({formatDistance(request.distance)})</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <FiClock size={14} />
              <span>{formatTimeAgo(request.createdAt)}</span>
              {request.estimatedTravelTime && (
                <span className="text-gray-400">• ~{request.estimatedTravelTime}min travel</span>
              )}
            </div>
          </div>
        )}
        
        {request.description && !compact && (
          <p className="text-sm text-gray-300 mt-2 p-2 bg-gray-800 rounded">{request.description}</p>
        )}
        
        <div className={`flex gap-2 ${compact ? 'mt-2' : 'mt-3'} flex-wrap`}>
          {actions}
        </div>
      </div>
    );
  };

  // Calendar helper functions remain the same...
  const getCalendarDates = () => {
    const now = new Date(currentDate);
    
    if (calendarView === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      const dates = [];
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }
      return dates;
    } else if (calendarView === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }
      return dates;
    } else {
      return [new Date(now)];
    }
  };

  const getEventsForDate = (date) => {
    const allRequests = [...serviceRequests, ...availableRequests];
    return allRequests.filter(request => {
      const requestDate = new Date(request.createdAt);
      return (
        requestDate.getDate() === date.getDate() &&
        requestDate.getMonth() === date.getMonth() &&
        requestDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const formatCalendarTitle = () => {
    const options = { 
      year: 'numeric', 
      month: 'long',
      ...(calendarView === 'day' && { day: 'numeric' })
    };
    
    if (calendarView === 'week') {
      const dates = getCalendarDates();
      const start = dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${start} - ${end}`;
    }
    
    return currentDate.toLocaleDateString('en-US', options);
  };

  // Calendar Day Component
  const CalendarDay = ({ date, isCurrentMonth = true }) => {
    const events = getEventsForDate(date);
    const isToday = new Date().toDateString() === date.toDateString();
    
    return (
      <div className={`min-h-[120px] border border-gray-600 p-2 ${
        !isCurrentMonth ? 'bg-gray-800 opacity-50' : 'bg-gray-700'
      } ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
        <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>
          {date.getDate()}
        </div>
        <div className="space-y-1">
          {events.slice(0, 3).map((event, index) => (
            <div
              key={event.id}
              className="text-xs p-1 bg-blue-600 text-white rounded truncate cursor-pointer hover:bg-blue-700"
              onClick={() => handleViewRequest(event)}
            >
              {SERVICE_TYPE_DISPLAY[event.serviceType] || event.serviceType}
            </div>
          ))}
          {events.length > 3 && (
            <div className="text-xs text-gray-400">
              +{events.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading && serviceRequests.length === 0 && availableRequests.length === 0) {
    return (
      <Layout>
        <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FiRefreshCw className="animate-spin mx-auto mb-4" size={32} />
                <p>Loading service requests...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Notifications */}
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg shadow-lg max-w-sm ${
                  notification.type === 'success' ? 'bg-green-600' :
                  notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  {notification.type === 'error' && <FiAlertCircle size={16} />}
                  {notification.type === 'success' && <FiCheck size={16} />}
                  <p className="text-sm">{notification.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Service Request Modal */}
          {showServiceRequestModal && selectedRequest && (
            <ServiceRequestModal
              isOpen={showServiceRequestModal}
              onClose={() => setShowServiceRequestModal(false)}
              request={selectedRequest}
              onAccept={handleAcceptRequest}
              onReject={handleRejectRequest}
              onUpdateStatus={handleUpdateStatus}
              loading={actionLoading}
            />
          )}

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            {/* Header and filters remain the same... */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Service Requests</h1>
              
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showOnlyAvailable}
                    onChange={(e) => setFilters(prev => ({ ...prev, showOnlyAvailable: e.target.checked }))}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm">Show Available Only</span>
                </label>
                
                <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-md ${viewMode === 'calendar' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}> <FiCalendar size={20} /> </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}> <FiList size={20} /> </button>
                <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md ${viewMode === 'kanban' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}> <FiTrello size={20} /> </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 items-center mb-6">
              <select 
                value={filters.serviceType}
                onChange={(e) => setFilters(prev => ({ ...prev, serviceType: e.target.value }))}
                className="bg-gray-700 border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Services</option>
                {Object.entries(SERVICE_TYPE_DISPLAY).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              
              <select 
                value={filters.vehicleType}
                onChange={(e) => setFilters(prev => ({ ...prev, vehicleType: e.target.value }))}
                className="bg-gray-700 border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Vehicles</option>
                {Object.entries(VEHICLE_TYPE_DISPLAY).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              
              <select 
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="bg-gray-700 border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                {Object.entries(SERVICE_STATUS).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
              
              <div className="flex items-center gap-2">
                <label className="text-sm whitespace-nowrap">Max Distance:</label>
                <select 
                  value={filters.maxDistance}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
                  className="bg-gray-700 border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10km</option>
                  <option value={25}>25km</option>
                  <option value={50}>50km</option>
                  <option value={100}>100km</option>
                </select>
              </div>
              
              <button 
                onClick={() => {
                  fetchServiceRequests();
                  if (filters.showOnlyAvailable) fetchAvailableRequests();
                }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
              >
                <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-600 text-white p-4 rounded-lg mb-6 flex items-center gap-2">
                <FiAlertCircle />
                <span>{error}</span>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto hover:bg-red-700 p-1 rounded"
                >
                  <FiX />
                </button>
              </div>
            )}
            
            {/* Content based on view mode */}
            <div className="mt-4">
              {/* LIST VIEW */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {filters.showOnlyAvailable ? (
                    <>
                      <h2 className="text-xl font-semibold mb-4">Available Requests Near You</h2>
                      {availableRequests.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <FiMapPin size={48} className="mx-auto mb-4 opacity-50" />
                          <p>No available service requests in your area</p>
                          <p className="text-sm">Try increasing the distance filter or check back later</p>
                        </div>
                      ) : (
                        availableRequests.map(request => (
                          <RequestCard key={request.id} request={request} />
                        ))
                      )}
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold mb-4">All Service Requests</h2>
                      {serviceRequests.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <FiList size={48} className="mx-auto mb-4 opacity-50" />
                          <p>No service requests found</p>
                          <p className="text-sm">Check the "Show Available Only" option to see requests you can accept</p>
                        </div>
                      ) : (
                        serviceRequests.map(request => (
                          <RequestCard key={request.id} request={request} />
                        ))
                      )}
                    </>
                  )}
                  
                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                      >
                        Previous
                      </button>
                      
                      <span className="px-4 py-2">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* KANBAN VIEW */}
              {viewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {Object.entries(kanbanColumns).map(([columnId, column]) => (
                    <div key={columnId} className="bg-gray-900 rounded-lg p-4 min-h-[400px]">
                      <h3 className="font-bold text-lg mb-4 text-center flex items-center justify-between">
                        {column.name}
                        <span className="bg-gray-700 text-xs px-2 py-1 rounded-full">
                          {column.items.length}
                        </span>
                      </h3>
                      <div className="space-y-3">
                        {column.items.map((item) => (
                          <RequestCard 
                            key={item.id} 
                            request={item}
                            compact
                          />
                        ))}
                        {column.items.length === 0 && (
                          <div className="text-center text-gray-500 py-8">
                            <p className="text-sm">No {column.name.toLowerCase()} requests</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CALENDAR VIEW - remains the same... */}
              {viewMode === 'calendar' && (
                <div>
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => navigateCalendar('prev')}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                      >
                        <FiChevronLeft size={20} />
                      </button>
                      
                      <h2 className="text-xl font-semibold min-w-[200px] text-center">
                        {formatCalendarTitle()}
                      </h2>
                      
                      <button
                        onClick={() => navigateCalendar('next')}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                      >
                        <FiChevronRight size={20} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
                      >
                        Today
                      </button>
                      
                      <div className="flex rounded-md overflow-hidden">
                        <button
                          onClick={() => setCalendarView('month')}
                          className={`px-3 py-2 text-sm ${calendarView === 'month' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                          Month
                        </button>
                        <button
                          onClick={() => setCalendarView('week')}
                          className={`px-3 py-2 text-sm ${calendarView === 'week' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                          Week
                        </button>
                        <button
                          onClick={() => setCalendarView('day')}
                          className={`px-3 py-2 text-sm ${calendarView === 'day' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                          Day
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  {calendarView === 'month' && (
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                      {/* Day Headers */}
                      <div className="grid grid-cols-7 bg-gray-700">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="p-3 text-center font-medium text-gray-300 border-r border-gray-600 last:border-r-0">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar Days */}
                      <div className="grid grid-cols-7">
                        {getCalendarDates().map((date, index) => (
                          <CalendarDay
                            key={index}
                            date={date}
                            isCurrentMonth={date.getMonth() === currentDate.getMonth()}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {calendarView === 'week' && (
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-7 bg-gray-700">
                        {getCalendarDates().map((date, index) => (
                          <div key={index} className="p-3 text-center border-r border-gray-600 last:border-r-0">
                            <div className="font-medium text-gray-300">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}
                            </div>
                            <div className={`text-lg ${new Date().toDateString() === date.toDateString() ? 'text-blue-400 font-bold' : 'text-white'}`}>
                              {date.getDate()}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-7">
                        {getCalendarDates().map((date, index) => (
                          <CalendarDay key={index} date={date} isCurrentMonth={true} />
                        ))}
                      </div>
                    </div>
                  )}

                  {calendarView === 'day' && (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium mb-2">
                          {currentDate.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        {getEventsForDate(currentDate).map(request => (
                          <RequestCard 
                            key={request.id} 
                            request={request}
                          />
                        ))}
                        
                        {getEventsForDate(currentDate).length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <FiCalendar size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No service requests for this day</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkerDashboard;
