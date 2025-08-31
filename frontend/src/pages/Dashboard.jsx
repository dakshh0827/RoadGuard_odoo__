import React, { useState, useEffect } from 'react';
import { FiPlus, FiMapPin, FiClock, FiUser, FiPhone, FiRefreshCw, FiAlertCircle, FiEye, FiX, FiCheck } from 'react-icons/fi';
import Layout from '../components/Layout/Layout';
import ServiceRequestModal from '../components/requests/ServiceRequestModal';
import { api } from '../services/api';
import { SERVICE_STATUS, SERVICE_TYPE_DISPLAY, VEHICLE_TYPE_DISPLAY, ERROR_MESSAGES } from '../utils/constants';

const Dashboard = () => {
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
    // Show confirmation dialog with optional reason
    const shouldCancel = window.confirm(
      'Are you sure you want to cancel this service request?\n\n' +
      'Note: If a mechanic has already accepted your request, they will be notified of the cancellation.'
    );

    if (!shouldCancel) {
      return;
    }

    // Optional: Ask for cancellation reason
    const reason = window.prompt(
      'Please provide a reason for cancellation (optional):'
    );

    console.log('🔄 Cancelling request:', requestId);
    
    const response = await api.cancelServiceRequest(requestId, { 
      reason: reason || undefined 
    });
    
    if (response.success) {
      addNotification('Service request cancelled successfully', 'success');
      fetchServiceRequests(); // Refresh the list
      
      // Close modal if it's open
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
        return <FiX className="text-red-500" size={20} />;
      case 'COMPLETED':
        return <FiCheck className="text-green-500" size={20} />;
      case 'CANCELLED':
        return <FiX className="text-red-500" size={20} />;
      case 'ACCEPTED':
        return <FiUser className="text-blue-500" size={20} />;
      case 'IN_PROGRESS':
        return <FiClock className="text-orange-500" size={20} />;
      default:
        return <FiClock className="text-yellow-500" size={20} />;
    }
  };

  const RequestCard = ({ request }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon(request.status)}
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {SERVICE_TYPE_DISPLAY[request.serviceType] || request.serviceType}
            </h3>
            <p className="text-gray-600 text-sm">
              {request.vehicleMake} {request.vehicleModel} ({VEHICLE_TYPE_DISPLAY[request.vehicleType]})
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          SERVICE_STATUS[request.status]?.bgColor || 'bg-gray-100'
        } ${SERVICE_STATUS[request.status]?.textColor || 'text-gray-800'}`}>
          {SERVICE_STATUS[request.status]?.label || request.status}
        </span>
      </div>

      {/* Special message for rejected requests */}
      {request.status === 'REJECTED' && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
          <div className="flex items-start gap-2">
            <FiAlertCircle className="text-red-500 mt-0.5" size={16} />
            <div>
              <p className="text-red-800 font-medium text-sm">Request Rejected</p>
              <p className="text-red-700 text-sm">
                {request.mechanicNotes || 'The mechanic was unable to accept your request.'}
              </p>
              <p className="text-red-600 text-xs mt-1">
                You can create a new service request or contact other mechanics.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3 text-sm text-gray-600">
        {/* Mechanic Info */}
        {request.mechanic && (
          <div className="flex items-center gap-2">
            <FiUser size={14} />
            <span>Mechanic: {request.mechanic.firstName} {request.mechanic.lastName}</span>
            {request.mechanic.phone && (
              <>
                <FiPhone size={14} className="ml-2" />
                <span>{request.mechanic.phone}</span>
              </>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <FiMapPin size={14} />
          <span className="truncate">{request.address}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <FiClock size={14} />
          <span>Requested {formatTimeAgo(request.createdAt)}</span>
        </div>

        {/* Cost display for completed requests */}
        {request.cost && request.status === 'COMPLETED' && (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <span>Total Cost: ₹{request.cost.toFixed(2)}</span>
          </div>
        )}
      </div>
      
      {request.description && (
        <p className="text-sm text-gray-700 mt-4 p-3 bg-gray-50 rounded">{request.description}</p>
      )}
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => handleViewRequest(request)}
          className="flex items-center gap-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
        >
          <FiEye size={14} />
          View Details
        </button>
        
        {(request.status === 'PENDING' || request.status === 'ACCEPTED') && (
          <button
            onClick={() => handleCancelRequest(request.id)}
            className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
          >
            <FiX size={14} />
            Cancel
          </button>
        )}

        {request.status === 'REJECTED' && (
          <button
            onClick={() => window.location.href = '/dashboard/new-request'}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            <FiPlus size={14} />
            Create New Request
          </button>
        )}
      </div>
    </div>
  );

  if (loading && serviceRequests.length === 0) {
    return (
      <Layout>
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FiRefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
                <p className="text-gray-600">Loading your service requests...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Notifications */}
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg shadow-lg max-w-sm ${
                  notification.type === 'success' ? 'bg-green-600' :
                  notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                } text-white`}
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
          {showRequestModal && selectedRequest && (
            <ServiceRequestModal
              isOpen={showRequestModal}
              onClose={() => setShowRequestModal(false)}
              request={selectedRequest}
              showCustomerView={true}
            />
          )}

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Service Requests</h1>
                <p className="text-gray-600">Track and manage your vehicle service requests</p>
              </div>
              
              <div className="flex items-center gap-3">
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="bg-white border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  {Object.entries(SERVICE_STATUS).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
                
                <button 
                  onClick={fetchServiceRequests}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
                >
                  <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>

                <button 
                  onClick={() => window.location.href = '/dashboard/new-request'}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                >
                  <FiPlus size={16} />
                  <span>New Request</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 flex items-center gap-2">
              <FiAlertCircle />
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto hover:bg-red-100 p-1 rounded"
              >
                <FiX />
              </button>
            </div>
          )}

          {/* Status Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(SERVICE_STATUS).map(([status, config]) => {
              const count = serviceRequests.filter(req => req.status === status).length;
              return (
                <div key={status} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{config.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                    <div className={`p-2 rounded-full ${config.bgColor}`}>
                      {getStatusIcon(status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Service Requests List */}
          <div className="space-y-4">
            {serviceRequests.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
                <FiMapPin size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Requests</h3>
                <p className="text-gray-600 mb-4">You haven't created any service requests yet.</p>
                <button 
                  onClick={() => window.location.href = '/dashboard/new-request'}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  <FiPlus size={16} />
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
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
              >
                Next
              </button>
            </div>
          )}

          {/* Help Section for Rejected Requests */}
          {serviceRequests.some(req => req.status === 'REJECTED') && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-6">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="text-orange-500 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-orange-800 mb-2">Some requests were rejected</h3>
                  <p className="text-orange-700 text-sm mb-3">
                    Don't worry! This can happen for various reasons like mechanic availability, 
                    location distance, or service specialization. You can:
                  </p>
                  <ul className="text-orange-700 text-sm space-y-1 ml-4">
                    <li>• Create a new service request</li>
                    <li>• Try different service types or times</li>
                    <li>• Contact mechanics directly</li>
                    <li>• Check for other available mechanics nearby</li>
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