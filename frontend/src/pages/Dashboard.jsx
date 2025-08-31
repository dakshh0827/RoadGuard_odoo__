import React, { useState, useEffect } from 'react';
import { FiPlus, FiMapPin, FiClock, FiUser, FiPhone, FiRefreshCw, FiAlertCircle, FiEye, FiX, FiCheck, FiSearch, FiSettings, FiList, FiGrid, FiSun, FiMoon, FiTrendingUp, FiActivity } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import ServiceRequestModal from '../components/requests/ServiceRequestModal';
import { api } from '../services/api';
import { SERVICE_STATUS, SERVICE_TYPE_DISPLAY, VEHICLE_TYPE_DISPLAY, ERROR_MESSAGES } from '../utils/constants';

// Mock workshops data for display
const mockWorkshops = [
  { 
    id: 1, 
    name: 'Automobile Work Shop', 
    image: 'https://images.unsplash.com/photo-1599493356244-18a7c2514124?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400',
    rating: 4.5, 
    location: 'Silver Auditorium, Ahmedabad, Gujarat', 
    distance: '2.5 km',
    services: ['Engine Repair', 'Oil Change', 'Brake Service'],
    status: 'Open',
    isPremium: true
  },
  { 
    id: 2, 
    name: 'Quick Fix Auto', 
    image: 'https://images.unsplash.com/photo-1553854314-38627c368db5?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400',
    rating: 4.8, 
    location: 'Downtown, Ahmedabad, Gujarat', 
    distance: '1.2 km',
    services: ['Tire Repair', 'Battery Service', 'AC Repair'],
    status: 'Open',
    isPremium: false
  },
  { 
    id: 3, 
    name: 'Car Care Center', 
    image: 'https://images.unsplash.com/photo-1623905500851-9b6528789e96?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400',
    rating: 4.2, 
    location: 'Uptown, Ahmedabad, Gujarat', 
    distance: '3.8 km',
    services: ['Full Service', 'Detailing', 'Paint Work'],
    status: 'Open',
    isPremium: true
  },
  { 
    id: 4, 
    name: 'Speedy Garage', 
    image: 'https://images.unsplash.com/photo-1617094544843-a60d0a51351b?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400',
    rating: 4.6, 
    location: 'West End, Ahmedabad, Gujarat', 
    distance: '0.8 km',
    services: ['Express Service', 'Emergency Repair', 'Towing'],
    status: 'Open',
    isPremium: false
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filters, setFilters] = useState({
    status: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    fetchServiceRequests();
  }, [filters, pagination.page]);

  const fetchServiceRequests = async () => {
    try {
      console.log('🔄 Fetching customer service requests...');
      setLoading(true);
      setError(null);
      
      const response = await api.getUserServiceRequests({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status })
      });

      console.log('📥 Customer service requests response:', response);

      if (response.success) {
        const requests = response.data.serviceRequests || [];
        setServiceRequests(requests);
        setPagination(response.data.pagination || pagination);
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

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const handleCancelRequest = async (requestId) => {
    try {
      const shouldCancel = window.confirm(
        'Are you sure you want to cancel this service request?\n\n' +
        'Note: If a mechanic has already accepted your request, they will be notified of the cancellation.'
      );

      if (!shouldCancel) {
        return;
      }

      const reason = window.prompt(
        'Please provide a reason for cancellation (optional):'
      );

      console.log('🔄 Cancelling request:', requestId);
      
      const response = await api.cancelServiceRequest(requestId, { 
        reason: reason || undefined 
      });
      
      if (response.success) {
        addNotification('Service request cancelled successfully', 'success');
        fetchServiceRequests();
        
        if (showRequestModal) {
          setShowRequestModal(false);
        }
      } else {
        throw new Error(response.message || 'Failed to cancel request');
      }
    } catch (err) {
      console.error('❌ Error cancelling request:', err);
      addNotification(err.message || 'Failed to cancel service request', 'error');
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

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const requestDate = new Date(date);
    const diffInMinutes = Math.floor((now - requestDate) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'REJECTED':
        return <FiX className="text-red-500" size={24} />;
      case 'COMPLETED':
        return <FiCheck className="text-green-500" size={24} />;
      case 'CANCELLED':
        return <FiX className="text-red-500" size={24} />;
      case 'ACCEPTED':
        return <FiUser className="text-blue-500" size={24} />;
      case 'IN_PROGRESS':
        return <FiActivity className="text-orange-500 animate-pulse" size={24} />;
      default:
        return <FiClock className="text-yellow-500 animate-spin" size={24} style={{ animationDuration: '3s' }} />;
    }
  };

  // Theme styles
  const themeStyles = {
    light: {
      bg: 'bg-gray-50',
      cardBg: 'bg-white',
      headerText: 'text-gray-900',
      bodyText: 'text-gray-700',
      mutedText: 'text-gray-500',
      border: 'border-gray-200',
      hoverBorder: 'hover:border-blue-300',
      hoverShadow: 'hover:shadow-lg',
      buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
      buttonSecondary: 'bg-gray-600 hover:bg-gray-700',
      inputBg: 'bg-white border-gray-300',
      cardHover: 'hover:bg-gray-50'
    },
    dark: {
      bg: 'bg-gray-900',
      cardBg: 'bg-gray-800',
      headerText: 'text-white',
      bodyText: 'text-gray-200',
      mutedText: 'text-gray-400',
      border: 'border-gray-700',
      hoverBorder: 'hover:border-blue-500',
      hoverShadow: 'hover:shadow-2xl',
      buttonPrimary: 'bg-blue-600 hover:bg-blue-500',
      buttonSecondary: 'bg-gray-700 hover:bg-gray-600',
      inputBg: 'bg-gray-700 border-gray-600 text-white',
      cardHover: 'hover:bg-gray-700'
    }
  };

  const styles = themeStyles[theme];

  const RequestCard = ({ request }) => (
    <div className={`${styles.cardBg} rounded-xl p-8 shadow-lg border-2 ${styles.border} ${styles.hoverBorder} ${styles.hoverShadow} transition-all duration-300 transform hover:-translate-y-2 ${styles.cardHover}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse">
            {getStatusIcon(request.status)}
          </div>
          <div>
            <h3 className={`font-bold text-xl ${styles.headerText} hover:text-blue-600 transition-colors cursor-pointer`}>
              {SERVICE_TYPE_DISPLAY[request.serviceType] || request.serviceType}
            </h3>
            <p className={`${styles.bodyText} text-lg font-medium mt-1`}>
              {request.vehicleMake} {request.vehicleModel} ({VEHICLE_TYPE_DISPLAY[request.vehicleType]})
            </p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 hover:scale-105 ${
          SERVICE_STATUS[request.status]?.bgColor || 'bg-gray-100'
        } ${SERVICE_STATUS[request.status]?.textColor || 'text-gray-800'}`}>
          {SERVICE_STATUS[request.status]?.label || request.status}
        </span>
      </div>

      {request.status === 'REJECTED' && (
        <div className={`${theme === 'dark' ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'} border-2 p-4 rounded-xl mb-6 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200`}>
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-red-500 mt-1 animate-bounce" size={20} />
            <div>
              <p className="text-red-800 dark:text-red-300 font-bold text-base">Request Rejected</p>
              <p className="text-red-700 dark:text-red-400 text-base mt-1">
                {request.mechanicNotes || 'The mechanic was unable to accept your request.'}
              </p>
              <p className="text-red-600 dark:text-red-500 text-sm mt-2">
                You can create a new service request or contact other mechanics.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className={`space-y-4 text-base ${styles.bodyText}`}>
        {request.mechanic && (
          <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200`}>
            <FiUser size={18} className="text-blue-500" />
            <span className="font-semibold">Mechanic: {request.mechanic.firstName} {request.mechanic.lastName}</span>
            {request.mechanic.phone && (
              <>
                <FiPhone size={16} className="ml-auto text-green-500" />
                <span className="font-mono font-bold">{request.mechanic.phone}</span>
              </>
            )}
          </div>
        )}
        
        <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200`}>
          <FiMapPin size={18} className="text-purple-500" />
          {request.address ? (
            <span className="font-medium">{request.address}</span>
          ) : (
            <span className={`${styles.mutedText} italic font-medium`}>Location not specified</span>
          )}
        </div>
        
        <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200`}>
          <FiClock size={18} className="text-orange-500" />
          <span className="font-semibold">Requested {formatTimeAgo(request.createdAt)}</span>
        </div>

        {request.cost && request.status === 'COMPLETED' && (
          <div className={`flex items-center gap-3 text-green-600 dark:text-green-400 font-bold text-lg p-3 rounded-lg ${theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50'} border-2 border-green-200 dark:border-green-800`}>
            <FiTrendingUp size={18} />
            <span>Total Cost: ${request.cost.toFixed(2)}</span>
          </div>
        )}
      </div>
      
      {request.description && (
        <p className={`text-base ${styles.bodyText} mt-6 p-4 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 font-medium`}>
          {request.description}
        </p>
      )}
      
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => handleViewRequest(request)}
          className={`flex items-center gap-2 px-6 py-3 ${styles.buttonSecondary} text-white rounded-xl text-base font-bold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 hover:scale-105`}
        >
          <FiEye size={18} />
          View Details
        </button>
        
        {(request.status === 'PENDING' || request.status === 'ACCEPTED') && (
          <button
            onClick={() => handleCancelRequest(request.id)}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-base font-bold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 hover:scale-105"
          >
            <FiX size={18} />
            Cancel
          </button>
        )}

        {request.status === 'REJECTED' && (
          <button
            onClick={() => navigate('/request-service')}
            className={`flex items-center gap-2 px-6 py-3 ${styles.buttonPrimary} text-white rounded-xl text-base font-bold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 hover:scale-105`}
          >
            <FiPlus size={18} />
            Create New Request
          </button>
        )}
      </div>
    </div>
  );

  const WorkshopCard = ({ workshop }) => (
    <div className={`${styles.cardBg} rounded-xl shadow-lg border-2 ${styles.border} overflow-hidden ${styles.hoverBorder} ${styles.hoverShadow} transition-all duration-300 transform hover:-translate-y-2`}>
      <div className="relative">
        <img 
          src={workshop.image} 
          alt={workshop.name}
          className="w-full h-56 object-cover hover:scale-110 transition-transform duration-300"
        />
        {workshop.isPremium && (
          <span className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            Premium
          </span>
        )}
        <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-bold ${
          workshop.status === 'Open' ? 'bg-green-500 text-white animate-pulse' : 'bg-red-500 text-white'
        }`}>
          {workshop.status}
        </span>
      </div>
      
      <div className="p-6">
        <h3 className={`font-bold text-xl ${styles.headerText} hover:text-blue-600 transition-colors cursor-pointer mb-2`}>
          {workshop.name}
        </h3>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex text-yellow-400 text-lg">
            {'★'.repeat(Math.floor(workshop.rating))}
            {'☆'.repeat(5 - Math.floor(workshop.rating))}
          </div>
          <span className={`text-base font-bold ${styles.bodyText}`}>({workshop.rating})</span>
        </div>
        
        <div className={`flex items-center gap-3 text-base ${styles.bodyText} mb-3 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}>
          <FiMapPin size={16} className="text-purple-500" />
          <span className="truncate font-medium">{workshop.location}</span>
        </div>
        
        <div className={`text-base ${styles.bodyText} mb-4 font-bold`}>
          <span className="text-blue-600 dark:text-blue-400">{workshop.distance}</span> away
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {workshop.services.slice(0, 3).map((service, index) => (
            <span key={index} className="px-3 py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-sm rounded-full font-bold hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors cursor-pointer">
              {service}
            </span>
          ))}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/workshop/${workshop.id}`)}
            className={`flex-1 px-4 py-3 ${styles.buttonPrimary} text-white rounded-xl text-base font-bold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1`}
          >
            View Details
          </button>
          <button
            onClick={() => navigate('/request-service')}
            className="px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-base font-bold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );

  if (loading && serviceRequests.length === 0) {
    return (
      <Layout>
        <div className={`${styles.bg} min-h-screen p-6`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FiRefreshCw className={`animate-spin mx-auto mb-6 text-blue-600`} size={48} />
                <p className={`${styles.bodyText} text-xl font-bold`}>Loading your dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`${styles.bg} min-h-screen transition-all duration-300`}>
        {/* Theme Toggle Button */}
        <div className="fixed top-6 left-6 z-50">
          <button
            onClick={toggleTheme}
            className={`p-4 ${styles.cardBg} ${styles.border} border-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110`}
          >
            {theme === 'light' ? 
              <FiMoon size={24} className="text-gray-700" /> : 
              <FiSun size={24} className="text-yellow-400" />
            }
          </button>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Notifications */}
          <div className="fixed top-6 right-6 z-50 space-y-3">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 rounded-xl shadow-xl max-w-sm transition-all duration-300 hover:shadow-2xl transform hover:scale-105 ${
                  notification.type === 'success' ? 'bg-green-600' :
                  notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                } text-white border-2 border-white/20`}
              >
                <div className="flex items-center gap-3">
                  {notification.type === 'error' && <FiAlertCircle size={20} />}
                  {notification.type === 'success' && <FiCheck size={20} />}
                  <p className="text-base font-bold">{notification.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Service Request Modal */}
          {showRequestModal && selectedRequest && (
            <ServiceRequestModal
              isOpen={showRequestModal}
              onClose={() => setShowRequestModal(false)}
              request={selectedRequest}
              showCustomerView={true}
            />
          )}

          {/* Header */}
          <div className={`${styles.cardBg} rounded-xl shadow-xl border-2 ${styles.border} p-8 mb-8 ${styles.hoverShadow} transition-shadow duration-300`}>
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              <div>
                <h1 className={`text-4xl font-black ${styles.headerText} hover:text-blue-600 transition-colors cursor-pointer`}>
                  Dashboard
                </h1>
                <p className={`${styles.bodyText} text-lg font-semibold mt-2`}>
                  Manage your service requests and find nearby workshops
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate('/request-service')}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
                >
                  <FiPlus size={20} />
                  <span>Request Service</span>
                </button>
                
                <button 
                  onClick={fetchServiceRequests}
                  disabled={loading}
                  className={`flex items-center gap-3 px-6 py-4 ${styles.buttonSecondary} disabled:bg-gray-400 text-white rounded-xl font-bold transition-all duration-200 hover:shadow-lg transform hover:scale-105`}
                >
                  <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className={`${theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800'} border-2 p-6 rounded-xl mb-8 flex items-center gap-4 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors`}>
              <FiAlertCircle size={24} className="animate-bounce" />
              <span className="font-bold text-lg">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto hover:bg-red-200 dark:hover:bg-red-800 p-2 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
          )}

          {/* Status Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {Object.entries(SERVICE_STATUS).map(([status, config]) => {
              const count = serviceRequests.filter(req => req.status === status).length;
              return (
                <div key={status} className={`${styles.cardBg} rounded-xl p-6 border-2 ${styles.border} ${styles.hoverBorder} ${styles.hoverShadow} transition-all duration-200 cursor-pointer transform hover:-translate-y-1 hover:scale-105`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-base font-bold ${styles.mutedText}`}>{config.label}</p>
                      <p className={`text-3xl font-black ${styles.headerText} mt-1`}>{count}</p>
                    </div>
                    <div className={`p-4 rounded-full ${config.bgColor} transition-transform hover:scale-125 animate-pulse`}>
                      {getStatusIcon(status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filter Options */}
          <div className={`${styles.cardBg} rounded-xl shadow-lg border-2 ${styles.border} p-6 mb-8`}>
            <div className="flex items-center gap-6">
              <label className={`font-bold text-lg ${styles.headerText}`}>Filter by status:</label>
              <select 
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className={`${styles.inputBg} border-2 rounded-xl py-3 px-4 focus:outline-none focus:ring-4 focus:ring-blue-500/50 hover:border-blue-400 transition-all duration-200 font-semibold text-base`}
              >
                <option value="">All Status</option>
                {Object.entries(SERVICE_STATUS).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Service Requests List */}
          <div className="space-y-6">
            {serviceRequests.length === 0 ? (
              <div className={`${styles.cardBg} rounded-xl p-16 text-center border-2 ${styles.border} ${styles.hoverShadow} transition-shadow`}>
                <FiMapPin size={64} className={`mx-auto mb-6 ${styles.mutedText} animate-bounce`} />
                <h3 className={`text-2xl font-bold ${styles.headerText} mb-4`}>No Service Requests</h3>
                <p className={`${styles.bodyText} mb-8 text-lg font-medium`}>You haven't created any service requests yet.</p>
                <button 
                  onClick={() => navigate('/request-service')}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 hover:scale-105"
                >
                  <FiPlus size={20} />
                  Create Your First Request
                </button>
              </div>
            ) : (
              serviceRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className={`px-6 py-3 ${styles.cardBg} border-2 ${styles.border} hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 hover:shadow-lg font-bold text-base`}
              >
                Previous
              </button>
              
              <span className={`px-6 py-3 ${styles.bodyText} font-bold text-lg`}>
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className={`px-6 py-3 ${styles.cardBg} border-2 ${styles.border} hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 hover:shadow-lg font-bold text-base`}
              >
                Next
              </button>
            </div>
          )}

          {/* Help Section for Rejected Requests */}
          {serviceRequests.some(req => req.status === 'REJECTED') && (
            <div className={`${theme === 'dark' ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-200'} border-2 rounded-xl p-8 mt-8 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors`}>
              <div className="flex items-start gap-4">
                <FiAlertCircle className="text-orange-500 mt-1 animate-bounce" size={24} />
                <div>
                  <h3 className="font-bold text-orange-800 dark:text-orange-300 mb-3 text-xl">Some requests were rejected</h3>
                  <p className="text-orange-700 dark:text-orange-400 text-base mb-4 font-medium">
                    Don't worry! This can happen for various reasons like mechanic availability, 
                    location distance, or service specialization. You can:
                  </p>
                  <ul className="text-orange-700 dark:text-orange-400 text-base space-y-2 ml-6 font-medium">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Create a new service request
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Try different service types or times
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Contact mechanics directly
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Check for other available mechanics nearby
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;