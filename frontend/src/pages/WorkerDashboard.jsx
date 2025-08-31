import React, { useState, useEffect } from 'react';
import { FiCalendar, FiList, FiTrello, FiMapPin, FiClock, FiUser, FiPhone, FiCheck, FiX, FiRefreshCw, FiAlertCircle, FiEye, FiChevronLeft, FiChevronRight, FiSun, FiMoon, FiSettings, FiFilter, FiBell } from 'react-icons/fi';
import Layout from '../components/Layout/Layout';
import { api } from '../services/api';
import { SERVICE_STATUS, SERVICE_TYPE_DISPLAY, VEHICLE_TYPE_DISPLAY, ERROR_MESSAGES } from '../utils/constants';

// Enhanced Theme-Aware Modal Component
const ThemedServiceRequestModal = ({ isOpen, onClose, request, theme }) => {
  if (!isOpen || !request) return null;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const styles = {
    light: {
      overlay: 'bg-black/50 backdrop-blur-sm',
      panel: 'bg-white text-gray-900 shadow-2xl',
      header: 'border-gray-200 bg-gradient-to-r from-gray-50 to-white',
      section: 'bg-gray-50/80 border border-gray-200 hover:bg-gray-50 hover:border-gray-300',
      sectionTitle: 'text-gray-600 font-bold uppercase tracking-wider text-xs',
      closeButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-105'
    },
    dark: {
      overlay: 'bg-black/70 backdrop-blur-sm',
      panel: 'bg-gray-900 text-gray-100 shadow-2xl border border-gray-700',
      header: 'border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800',
      section: 'bg-gray-800/80 border border-gray-700 hover:bg-gray-800 hover:border-gray-600',
      sectionTitle: 'text-gray-400 font-bold uppercase tracking-wider text-xs',
      closeButton: 'bg-gray-700 hover:bg-gray-600 text-gray-200 hover:scale-105'
    }
  };

  const s = styles[theme];
  const statusInfo = SERVICE_STATUS[request.status] || {};

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${s.overlay} animate-fade-in`}>
      <div className={`relative w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col ${s.panel} transform animate-scale-in transition-all duration-300`}>
        <header className={`p-6 border-b ${s.header} flex justify-between items-center flex-shrink-0 rounded-t-2xl`}>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Service Request Details
            </h2>
            <p className="text-sm text-gray-500 font-mono mt-1">ID: #{request.id}</p>
          </div>
          <button 
            onClick={onClose} 
            className={`p-3 rounded-full transition-all duration-200 ${s.closeButton}`}
          >
            <FiX size={20} />
          </button>
        </header>

        <main className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className={`p-5 rounded-xl flex items-center gap-4 ${statusInfo.bgColor} ${statusInfo.textColor} border-l-4 border-white/30`}>
            <div className="flex-shrink-0 p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              {statusInfo.icon || <FiClock size={24} />}
            </div>
            <div>
              <p className="font-bold text-lg">{statusInfo.label}</p>
              <p className="text-sm opacity-90 mt-1">{statusInfo.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-5 rounded-xl transition-all duration-200 ${s.section}`}>
              <h4 className={`mb-4 ${s.sectionTitle}`}>Service Information</h4>
              <div className="space-y-3">
                <p className="font-bold text-xl text-blue-600 dark:text-blue-400">
                  {SERVICE_TYPE_DISPLAY[request.serviceType] || request.serviceType}
                </p>
                <div className="flex items-center gap-3 text-lg">
                  <span className="font-semibold">{request.vehicleMake}</span>
                  <span className="text-gray-500">•</span>
                  <span className="font-semibold">{request.vehicleModel}</span>
                </div>
                <p className="text-sm px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-mono">
                  {request.vehicleNumber || 'Vehicle number not provided'}
                </p>
              </div>
            </div>

            <div className={`p-5 rounded-xl transition-all duration-200 ${s.section}`}>
              <h4 className={`mb-4 ${s.sectionTitle}`}>Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-semibold">Requested</p>
                    <p className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                </div>
                {request.acceptedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold">Accepted</p>
                      <p className="text-sm text-gray-500">
                        {new Date(request.acceptedAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-xl transition-all duration-200 ${s.section}`}>
            <h4 className={`mb-4 ${s.sectionTitle}`}>Customer Details</h4>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {request.endUser?.firstName?.charAt(0)}{request.endUser?.lastName?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-lg">
                  {request.endUser?.firstName} {request.endUser?.lastName}
                </p>
                <p className="text-gray-500">{request.endUser?.email}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-5 rounded-xl transition-all duration-200 ${s.section}`}>
            <h4 className={`mb-4 ${s.sectionTitle}`}>Problem Description</h4>
            <p className="text-base leading-relaxed bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
              {request.description}
            </p>
          </div>
        </main>
        
        <footer className={`p-6 border-t ${s.header} flex-shrink-0 rounded-b-2xl`}>
          <button 
            onClick={onClose} 
            className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-[1.02] hover:shadow-lg"
          >
            Close Details
          </button>
        </footer>
      </div>
    </div>
  );
};

const WorkerDashboard = () => {
  const [theme, setTheme] = useState('light');
  const [viewMode, setViewMode] = useState('list');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);
  const [filters, setFilters] = useState({ status: '', serviceType: '', vehicleType: '', maxDistance: 50, showOnlyAvailable: false });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [kanbanColumns, setKanbanColumns] = useState({ 'available': { name: 'Available', items: [] }, 'accepted': { name: 'Accepted', items: [] }, 'in-progress': { name: 'In Progress', items: [] }, 'completed': { name: 'Completed', items: [] }, 'rejected': { name: 'Rejected', items: [] } });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [notifications, setNotifications] = useState([]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    fetchServiceRequests();
    if (filters.showOnlyAvailable) {
      fetchAvailableRequests();
    }
  }, [filters, pagination.page]);

  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: pagination.page, limit: pagination.limit, maxDistance: filters.maxDistance };
      if (filters.status) params.status = filters.status;
      if (filters.serviceType) params.serviceType = filters.serviceType;
      if (filters.vehicleType) params.vehicleType = filters.vehicleType;
      const response = await api.getMechanicServiceRequests(params);
      if (response.success) {
        const requests = response.data.serviceRequests || [];
        setServiceRequests(requests);
        setPagination(response.data.pagination || pagination);
        updateKanbanColumns([...requests, ...availableRequests]);
      } else {
        throw new Error(response.message || 'Failed to fetch service requests');
      }
    } catch (err) {
      setError(err.message || ERROR_MESSAGES.GENERIC_ERROR);
      setServiceRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRequests = async () => {
    try {
      const params = { page: 1, limit: 50, maxDistance: filters.maxDistance };
      if (filters.serviceType) params.serviceType = filters.serviceType;
      if (filters.vehicleType) params.vehicleType = filters.vehicleType;
      const response = await api.getAvailableServiceRequests(params);
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
    const uniqueRequests = Array.from(new Map(allRequests.map(item => [item.id, item])).values());
    const grouped = uniqueRequests.reduce((acc, request) => {
      let status = request.status?.toLowerCase().replace('_', '-') || 'rejected';
      let columnKey = status === 'pending' ? 'available' : status;
      if (!acc[columnKey]) acc[columnKey] = [];
      acc[columnKey].push(request);
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
      const response = await api.acceptServiceRequest(requestId);
      if (response.success) {
        addNotification('Service request accepted successfully!', 'success');
        setShowServiceRequestModal(false);
        await fetchServiceRequests();
        if (filters.showOnlyAvailable) await fetchAvailableRequests();
      } else {
        throw new Error(response.message || 'Failed to accept request');
      }
    } catch (err) {
      addNotification(err.message || 'Failed to accept service request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId, reason = '') => {
    try {
      setActionLoading(true);
      const response = await api.rejectServiceRequest(requestId, { reason });
      if (response.success) {
        addNotification('Service request rejected successfully!', 'success');
        setShowServiceRequestModal(false);
        const rejectedRequest = availableRequests.find(req => req.id === requestId) || serviceRequests.find(req => req.id === requestId);
        if (rejectedRequest) {
          const updatedRequest = { ...rejectedRequest, status: 'REJECTED' };
          setAvailableRequests(prev => prev.filter(req => req.id !== requestId));
          setServiceRequests(prev => [...prev.filter(req => req.id !== requestId), updatedRequest]);
          updateKanbanColumns([...serviceRequests.filter(req => req.id !== requestId), updatedRequest, ...availableRequests.filter(req => req.id !== requestId)]);
        } else {
          fetchServiceRequests();
          if (filters.showOnlyAvailable) fetchAvailableRequests();
        }
      } else {
        throw new Error(response.message || 'Failed to reject request');
      }
    } catch (err) {
      addNotification(err.message || 'Failed to reject service request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus, additionalData = {}) => {
    try {
      setActionLoading(true);
      const response = await api.updateMechanicServiceRequestStatus(requestId, { status: newStatus, ...additionalData });
      if (response.success) {
        addNotification(`Request status updated to ${newStatus.toLowerCase().replace('_', ' ')}`, 'success');
        setShowServiceRequestModal(false);
        fetchServiceRequests();
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (err) {
      addNotification(err.message || 'Failed to update request status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const addNotification = (message, type = 'info') => {
    const notification = { id: Date.now(), message, type, timestamp: new Date() };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== notification.id)), 5000);
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
    const buttonBaseClass = "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg disabled:transform-none disabled:shadow-none";
    
    actions.push(
      <button 
        key="view" 
        onClick={() => handleViewRequest(request)} 
        className={`${buttonBaseClass} bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-md`}
      >
        <FiEye size={16} /> View Details
      </button>
    );

    if (request.status === 'PENDING' && !request.mechanicId) {
      actions.push(
        <button 
          key="accept" 
          onClick={() => handleAcceptRequest(request.id)} 
          disabled={actionLoading} 
          className={`${buttonBaseClass} bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-400 disabled:to-green-500 text-white shadow-md`}
        >
          <FiCheck size={16} /> Accept Job
        </button>
      );
      actions.push(
        <button 
          key="reject" 
          onClick={() => { const reason = prompt('Reason for rejection (optional):'); if (reason !== null) handleRejectRequest(request.id, reason); }} 
          disabled={actionLoading} 
          className={`${buttonBaseClass} bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-400 disabled:to-red-500 text-white shadow-md`}
        >
          <FiX size={16} /> Decline
        </button>
      );
    }

    if (request.mechanicId && (request.isAssignedToMe || request.mechanicActions?.canUpdateStatus)) {
      if (request.status === 'ACCEPTED') {
        actions.push(
          <button 
            key="start" 
            onClick={() => handleUpdateStatus(request.id, 'IN_PROGRESS')} 
            disabled={actionLoading} 
            className={`${buttonBaseClass} bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-400 disabled:to-blue-500 text-white shadow-md`}
          >
            <FiRefreshCw size={16} /> Start Work
          </button>
        );
      }
      if (request.status === 'IN_PROGRESS') {
        actions.push(
          <button 
            key="complete" 
            onClick={() => { const cost = prompt('Enter final service cost (required):'); if (cost) handleUpdateStatus(request.id, 'COMPLETED', { cost }); }} 
            disabled={actionLoading} 
            className={`${buttonBaseClass} bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:from-teal-400 disabled:to-teal-500 text-white shadow-md`}
          >
            <FiCheck size={16} /> Complete
          </button>
        );
      }
    }
    return actions;
  };

  const getCalendarDates = () => {
    const now = new Date(currentDate);
    if (calendarView === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      const dates = [];
      for (let i = 0; i < 42; i++) { const date = new Date(startDate); date.setDate(date.getDate() + i); dates.push(date); }
      return dates;
    } else if (calendarView === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const dates = [];
      for (let i = 0; i < 7; i++) { const date = new Date(startOfWeek); date.setDate(date.getDate() + i); dates.push(date); }
      return dates;
    }
    return [new Date(now)];
  };

  const getEventsForDate = (date) => {
    const allRequests = [...serviceRequests, ...availableRequests];
    return allRequests.filter(request => new Date(request.createdAt).toDateString() === date.toDateString());
  };

  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    if (calendarView === 'month') newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    else if (calendarView === 'week') newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    else newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const formatCalendarTitle = () => {
    const options = { year: 'numeric', month: 'long', ...(calendarView === 'day' && { day: 'numeric' }) };
    if (calendarView === 'week') {
      const dates = getCalendarDates();
      const start = dates[0].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const end = dates[6].toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${start} - ${end}`;
    }
    return currentDate.toLocaleDateString('en-IN', options);
  };

  const RequestCard = ({ request, compact = false }) => {
    const actions = getActionButtons(request);
    const canAccept = request.status === 'PENDING' && !request.mechanicId;
    const isAssignedToMe = request.mechanicId && request.isAssignedToMe;

    return (
      <div className={`
        rounded-2xl border transition-all duration-300 hover:scale-[1.02] group
        ${compact ? 'p-4 shadow-sm' : 'p-6 shadow-md'}
        ${theme === 'light' 
          ? 'bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-xl hover:border-blue-400 hover:bg-white' 
          : 'bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:border-blue-500 hover:bg-gray-800 hover:shadow-xl hover:shadow-blue-500/10'
        }
      `}>
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className={`
              font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent
              ${compact ? 'text-lg' : 'text-xl'}
            `}>
              {SERVICE_TYPE_DISPLAY[request.serviceType] || request.serviceType}
            </h3>
            <div className="flex items-center gap-3 text-sm">
              <span className={`font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                {request.vehicleMake} {request.vehicleModel}
              </span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-lg text-xs font-medium">
                {VEHICLE_TYPE_DISPLAY[request.vehicleType]}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`
              px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 group-hover:scale-105
              ${SERVICE_STATUS[request.status]?.bgColor || 'bg-gray-200'} 
              ${SERVICE_STATUS[request.status]?.textColor || 'text-gray-800'}
              shadow-sm
            `}>
              {SERVICE_STATUS[request.status]?.label || request.status}
            </span>
            {isAssignedToMe && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                Your Job
              </span>
            )}
            {canAccept && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm animate-pulse">
                Available
              </span>
            )}
          </div>
        </div>

        {/* Details Section */}
        {!compact && (
          <div className={`
            space-y-4 text-sm border-t pt-4 mt-4
            ${theme === 'light' ? 'text-gray-600 border-gray-200' : 'text-gray-400 border-gray-700'}
          `}>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                <FiUser size={16} />
              </div>
              <div className="flex-1">
                <span className="font-bold text-base text-gray-900 dark:text-gray-100">
                  {request.endUser?.firstName} {request.endUser?.lastName}
                </span>
                {request.endUser?.phone && (
                  <div className="text-gray-500 font-mono text-xs mt-1">{request.endUser.phone}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
                <FiMapPin size={16} />
              </div>
              <div className="flex-1">
                <span className="truncate block">{request.address || "Location not specified"}</span>
                {request.distance !== undefined && (
                  <div className="text-blue-600 dark:text-blue-400 font-bold text-sm mt-1">
                    {formatDistance(request.distance)} away
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                <FiClock size={16} />
              </div>
              <div className="flex-1">
                <span>Requested {formatTimeAgo(request.createdAt)}</span>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(request.createdAt).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {request.description && !compact && (
          <div className={`
            mt-4 p-4 rounded-xl border-l-4 border-blue-500
            ${theme === 'light' ? 'bg-blue-50 text-gray-700' : 'bg-blue-900/20 text-gray-300'}
          `}>
            <h5 className="font-bold text-sm mb-2 text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Problem Description
            </h5>
            <p className="text-sm leading-relaxed">{request.description}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className={`
          flex gap-2 flex-wrap
          ${compact ? 'mt-4' : 'mt-6 border-t pt-4 ' + (theme === 'light' ? 'border-gray-200' : 'border-gray-700')}
        `}>
          {actions}
        </div>
      </div>
    );
  };

  const CalendarDay = ({ date, isCurrentMonth = true }) => {
    const events = getEventsForDate(date);
    const isToday = new Date().toDateString() === date.toDateString();
    
    return (
      <div className={`
        min-h-[120px] p-2 border-t border-r transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20
        ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
        ${!isCurrentMonth ? 'opacity-40' : ''}
        ${isToday ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : ''}
      `}>
        <div className={`
          text-sm font-bold mb-2
          ${isToday ? 'text-blue-600 dark:text-blue-400' : theme === 'light' ? 'text-gray-700' : 'text-gray-300'}
        `}>
          {date.getDate()}
        </div>
        <div className="space-y-1">
          {events.slice(0, 3).map((event, idx) => (
            <div
              key={idx}
              className="text-xs p-1 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 truncate cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/70"
              onClick={() => handleViewRequest(event)}
            >
              {SERVICE_TYPE_DISPLAY[event.serviceType] || event.serviceType}
            </div>
          ))}
          {events.length > 3 && (
            <div className="text-xs text-gray-500 font-medium">
              +{events.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  };

  const styles = {
    light: {
      bg: 'bg-gradient-to-br from-slate-50 to-blue-50/50',
      headerText: 'text-gray-900',
      subHeaderText: 'text-gray-600',
      panelBg: 'bg-white/80 backdrop-blur-sm',
      panelBorder: 'border-gray-200',
      filterInput: 'bg-white/90 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20',
      kanbanColumnBg: 'bg-slate-100/80',
      kanbanColumnBorder: 'border-slate-200',
      kanbanHeaderText: 'text-slate-800'
    },
    dark: {
      bg: 'bg-gradient-to-br from-gray-900 to-blue-900/20',
      headerText: 'text-white',
      subHeaderText: 'text-gray-400',
      panelBg: 'bg-gray-800/80 backdrop-blur-sm',
      panelBorder: 'border-gray-700',
      filterInput: 'bg-gray-700/90 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400/20',
      kanbanColumnBg: 'bg-gray-800/50',
      kanbanColumnBorder: 'border-gray-700',
      kanbanHeaderText: 'text-gray-200'
    }
  };
  const s = styles[theme];

  return (
    <Layout>
      <div className={`min-h-screen p-4 sm:p-6 lg:p-8 transition-all duration-500 ${s.bg}`}>
        <div className="max-w-7xl mx-auto">
          {/* Floating Theme Toggle */}
          <div className="fixed top-6 left-6 z-50">
            <button
              onClick={toggleTheme}
              className={`
                p-4 rounded-2xl shadow-xl transition-all duration-300 hover:scale-110 group
                ${theme === 'light' 
                  ? 'bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white' 
                  : 'bg-gray-800/90 backdrop-blur-sm border border-gray-700 hover:bg-gray-800'
                }
              `}
            >
              <div className="w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:rotate-12">
                {theme === 'light' ? (
                  <FiMoon size={20} className="text-gray-600 group-hover:text-blue-600" />
                ) : (
                  <FiSun size={20} className="text-yellow-400 group-hover:text-yellow-300" />
                )}
              </div>
            </button>
          </div>

          {/* Notifications */}
          <div className="fixed top-6 right-6 z-50 space-y-3 max-w-sm">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`
                  p-4 rounded-2xl shadow-xl backdrop-blur-sm text-white transform transition-all duration-500 animate-slide-in
                  ${n.type === 'success' ? 'bg-green-500/90' : n.type === 'error' ? 'bg-red-500/90' : 'bg-blue-500/90'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {n.type === 'error' ? (
                      <FiAlertCircle size={20} />
                    ) : (
                      <FiCheck size={20} />
                    )}
                  </div>
                  <p className="text-sm font-medium flex-1">{n.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Modal */}
          <ThemedServiceRequestModal
            isOpen={showServiceRequestModal}
            onClose={() => setShowServiceRequestModal(false)}
            request={selectedRequest}
            theme={theme}
          />

          {/* Header */}
          <header className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-8">
            <div className="flex-1">
              <h1 className={`text-4xl lg:text-5xl font-black mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent`}>
                Mechanic Dashboard
              </h1>
              <p className={`text-lg ${s.subHeaderText} font-medium`}>
                Manage your jobs, view schedules, and discover new opportunities
              </p>
            </div>
            
            {/* View Mode Selector */}
            <div className={`
              flex items-center p-2 rounded-2xl shadow-lg border
              ${s.panelBg} ${s.panelBorder}
            `}>
              {[
                { mode: 'list', icon: FiList, label: 'List View' },
                { mode: 'kanban', icon: FiTrello, label: 'Board View' },
                { mode: 'calendar', icon: FiCalendar, label: 'Calendar View' }
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
                    ${viewMode === mode 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105' 
                      : `${s.subHeaderText} hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400`
                    }
                  `}
                  title={label}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                </button>
              ))}
            </div>
          </header>

          {/* Enhanced Filters */}
          <div className={`
            p-6 mb-8 rounded-2xl shadow-lg border backdrop-blur-sm
            ${s.panelBg} ${s.panelBorder}
          `}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                <FiFilter size={20} />
              </div>
              <h3 className={`text-xl font-bold ${s.headerText}`}>Smart Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <label className={`text-sm font-bold ${s.subHeaderText} uppercase tracking-wider`}>Service Type</label>
                <select
                  value={filters.serviceType}
                  onChange={(e) => setFilters(p => ({ ...p, serviceType: e.target.value }))}
                  className={`w-full rounded-xl py-3 px-4 font-medium transition-all duration-200 hover:scale-[1.02] focus:scale-[1.02] focus:ring-4 ${s.filterInput}`}
                >
                  <option value="">All Services</option>
                  {Object.entries(SERVICE_TYPE_DISPLAY).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-bold ${s.subHeaderText} uppercase tracking-wider`}>Vehicle Type</label>
                <select
                  value={filters.vehicleType}
                  onChange={(e) => setFilters(p => ({ ...p, vehicleType: e.target.value }))}
                  className={`w-full rounded-xl py-3 px-4 font-medium transition-all duration-200 hover:scale-[1.02] focus:scale-[1.02] focus:ring-4 ${s.filterInput}`}
                >
                  <option value="">All Vehicles</option>
                  {Object.entries(VEHICLE_TYPE_DISPLAY).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-bold ${s.subHeaderText} uppercase tracking-wider`}>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}
                  className={`w-full rounded-xl py-3 px-4 font-medium transition-all duration-200 hover:scale-[1.02] focus:scale-[1.02] focus:ring-4 ${s.filterInput}`}
                >
                  <option value="">All Statuses</option>
                  {Object.entries(SERVICE_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-bold ${s.subHeaderText} uppercase tracking-wider`}>Distance Range</label>
                <select
                  value={filters.maxDistance}
                  onChange={(e) => setFilters(p => ({ ...p, maxDistance: parseInt(e.target.value) }))}
                  className={`w-full rounded-xl py-3 px-4 font-medium transition-all duration-200 hover:scale-[1.02] focus:scale-[1.02] focus:ring-4 ${s.filterInput}`}
                >
                  <option value={10}>Within 10km</option>
                  <option value={25}>Within 25km</option>
                  <option value={50}>Within 50km</option>
                  <option value={100}>Within 100km</option>
                </select>
              </div>

              <div className="space-y-2 lg:col-span-2">
                <label className={`text-sm font-bold ${s.subHeaderText} uppercase tracking-wider`}>Quick Filter</label>
                <label className={`
                  flex items-center gap-3 cursor-pointer rounded-xl py-3 px-4 font-bold transition-all duration-200 hover:scale-[1.02] border-2 border-dashed
                  ${filters.showOnlyAvailable 
                    ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white border-transparent shadow-lg' 
                    : `${s.filterInput} border-gray-300 dark:border-gray-600`
                  }
                `}>
                  <input
                    type="checkbox"
                    checked={filters.showOnlyAvailable}
                    onChange={(e) => setFilters(p => ({ ...p, showOnlyAvailable: e.target.checked }))}
                    className="w-5 h-5 text-green-600 rounded-lg border-2 border-gray-300 focus:ring-green-500 focus:ring-2"
                  />
                  <span>Show Available Jobs Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-8 p-6 rounded-2xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white">
                    <FiAlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Error Loading Data</h4>
                    <p className="text-sm opacity-90">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-800/50 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="space-y-8">
            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-6">
                {filters.showOnlyAvailable ? (
                  availableRequests.length > 0 ? (
                    availableRequests.map(r => <RequestCard key={r.id} request={r} />)
                  ) : (
                    <div className={`
                      text-center py-20 rounded-2xl border-2 border-dashed backdrop-blur-sm
                      ${s.subHeaderText} ${s.panelBg} ${s.panelBorder}
                    `}>
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white">
                        <FiMapPin size={32} />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">No Available Jobs</h3>
                      <p className="text-lg opacity-75 max-w-md mx-auto">
                        Try expanding your search distance or check back later for new opportunities.
                      </p>
                    </div>
                  )
                ) : (
                  serviceRequests.length > 0 ? (
                    serviceRequests.map(r => <RequestCard key={r.id} request={r} />)
                  ) : (
                    <div className={`
                      text-center py-20 rounded-2xl border-2 border-dashed backdrop-blur-sm
                      ${s.subHeaderText} ${s.panelBg} ${s.panelBorder}
                    `}>
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white">
                        <FiList size={32} />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">No Service Requests</h3>
                      <p className="text-lg opacity-75 max-w-md mx-auto">
                        Enable "Available Jobs Only" to discover new opportunities in your area.
                      </p>
                    </div>
                  )
                )}

                {/* Pagination */}
                {pagination.pages > 1 && !filters.showOnlyAvailable && (
                  <div className="flex items-center justify-center gap-4 mt-12">
                    <button
                      onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                      disabled={pagination.page === 1}
                      className={`
                        flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg
                        ${s.panelBg} ${s.panelBorder} border hover:scale-105 hover:shadow-xl
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg
                      `}
                    >
                      <FiChevronLeft size={16} />
                      Previous
                    </button>
                    
                    <div className={`px-6 py-3 rounded-xl font-bold border ${s.panelBg} ${s.panelBorder} shadow-lg`}>
                      Page {pagination.page} of {pagination.pages}
                    </div>
                    
                    <button
                      onClick={() => setPagination(p => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
                      disabled={pagination.page === pagination.pages}
                      className={`
                        flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg
                        ${s.panelBg} ${s.panelBorder} border hover:scale-105 hover:shadow-xl
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg
                      `}
                    >
                      Next
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Kanban View */}
            {viewMode === 'kanban' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {Object.entries(kanbanColumns).map(([columnId, column]) => (
                  <div
                    key={columnId}
                    className={`
                      rounded-2xl border shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl
                      ${columnId === 'rejected' 
                        ? (theme === 'light' 
                          ? 'bg-red-50/80 border-red-200 hover:bg-red-50' 
                          : 'bg-red-900/10 border-red-800/50 hover:bg-red-900/20'
                        ) 
                        : `${s.kanbanColumnBg} ${s.kanbanColumnBorder}`
                      }
                    `}
                  >
                    <div className={`
                      p-6 border-b flex items-center justify-between
                      ${columnId === 'rejected' 
                        ? (theme === 'light' 
                          ? 'border-red-200 bg-red-100/50' 
                          : 'border-red-800/50 bg-red-900/20'
                        ) 
                        : `${s.kanbanColumnBorder} bg-gradient-to-r ${theme === 'light' ? 'from-gray-50 to-white' : 'from-gray-800 to-gray-700'}`
                      }
                      rounded-t-2xl
                    `}>
                      <h3 className={`
                        font-black text-lg
                        ${columnId === 'rejected' 
                          ? (theme === 'light' ? 'text-red-800' : 'text-red-300') 
                          : `${s.kanbanHeaderText}`
                        }
                      `}>
                        {column.name}
                      </h3>
                      <div className={`
                        px-3 py-2 rounded-xl text-xs font-black shadow-sm
                        ${columnId === 'rejected' 
                          ? (theme === 'light' 
                            ? 'bg-red-200 text-red-800' 
                            : 'bg-red-500/20 text-red-300'
                          ) 
                          : (theme === 'light' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-blue-500/20 text-blue-300'
                          )
                        }
                      `}>
                        {column.items.length}
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-4 min-h-[500px]">
                      {column.items.length > 0 ? (
                        column.items.map(item => <RequestCard key={item.id} request={item} compact />)
                      ) : (
                        <div className={`text-center pt-20 ${s.subHeaderText}`}>
                          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-300 to-gray-500 rounded-2xl flex items-center justify-center text-white opacity-50">
                            <FiList size={24} />
                          </div>
                          <p className="text-sm font-medium">No requests in this stage</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <div className={`rounded-2xl p-6 shadow-lg backdrop-blur-sm ${s.panelBg} ${s.panelBorder} border`}>
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => navigateCalendar('prev')}
                      className={`
                        p-3 rounded-xl shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl
                        ${s.panelBg} ${s.panelBorder} border
                      `}
                    >
                      <FiChevronLeft size={20} />
                    </button>
                    
                    <h2 className={`text-2xl font-bold w-80 text-center ${s.headerText}`}>
                      {formatCalendarTitle()}
                    </h2>
                    
                    <button
                      onClick={() => navigateCalendar('next')}
                      className={`
                        p-3 rounded-xl shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl
                        ${s.panelBg} ${s.panelBorder} border
                      `}
                    >
                      <FiChevronRight size={20} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className={`
                        px-6 py-3 rounded-xl shadow-lg text-sm font-bold transition-all duration-200 hover:scale-105 hover:shadow-xl
                        bg-gradient-to-r from-blue-500 to-purple-600 text-white
                      `}
                    >
                      Today
                    </button>
                    
                    <div className={`flex items-center p-2 rounded-xl border shadow-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900/50'} ${s.panelBorder}`}>
                      {['month', 'week', 'day'].map((view) => (
                        <button
                          key={view}
                          onClick={() => setCalendarView(view)}
                          className={`
                            px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200
                            ${calendarView === view 
                              ? `shadow-lg transform scale-105 ${s.panelBg}` 
                              : 'hover:bg-black/5 dark:hover:bg-white/5'
                            }
                          `}
                        >
                          {view.charAt(0).toUpperCase() + view.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Calendar Grid */}
                {calendarView === 'month' && (
                  <div className={`border-2 rounded-xl overflow-hidden shadow-inner ${s.panelBorder}`}>
                    {/* Days of week header */}
                    <div className="grid grid-cols-7">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                        <div
                          key={day}
                          className={`
                            p-4 text-center font-black text-sm border-r border-b last:border-r-0
                            ${s.subHeaderText} ${s.panelBorder}
                            ${theme === 'light' ? 'bg-gradient-to-b from-gray-100 to-gray-50' : 'bg-gradient-to-b from-gray-900 to-gray-800'}
                          `}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar days */}
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
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${theme === 'light' ? '#f1f5f9' : '#374151'};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${theme === 'light' ? '#cbd5e1' : '#6b7280'};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'light' ? '#94a3b8' : '#9ca3af'};
        }
      `}</style>
    </Layout>
  );
};

export default WorkerDashboard;