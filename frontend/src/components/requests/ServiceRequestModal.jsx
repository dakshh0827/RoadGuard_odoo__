// src/components/requests/ServiceRequestModal.js - UPDATED
import React from 'react';
import { FiX, FiMapPin, FiClock, FiUser, FiPhone, FiDollarSign, FiMessageSquare, FiAlertTriangle } from 'react-icons/fi';
import { SERVICE_STATUS, SERVICE_TYPE_DISPLAY, VEHICLE_TYPE_DISPLAY } from '../../utils/constants';

const ServiceRequestModal = ({ 
  isOpen, 
  onClose, 
  request, 
  showCustomerView = false 
}) => {
  if (!isOpen || !request) return null;

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

  const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {getStatusIcon(request.status)}
            <div>
              <h2 className="text-xl font-semibold text-white">Service Request</h2>
              <p className="text-sm text-gray-400">ID: {request.requestId || request.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg border ${
            request.status === 'REJECTED' ? 'bg-red-50 border-red-200' :
            request.status === 'COMPLETED' ? 'bg-green-50 border-green-200' :
            request.status === 'CANCELLED' ? 'bg-red-50 border-red-200' :
            request.status === 'ACCEPTED' ? 'bg-blue-50 border-blue-200' :
            request.status === 'IN_PROGRESS' ? 'bg-orange-50 border-orange-200' :
            'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              {getStatusIcon(request.status)}
              <div>
                <h3 className={`font-semibold ${
                  request.status === 'REJECTED' ? 'text-red-800' :
                  request.status === 'COMPLETED' ? 'text-green-800' :
                  request.status === 'CANCELLED' ? 'text-red-800' :
                  request.status === 'ACCEPTED' ? 'text-blue-800' :
                  request.status === 'IN_PROGRESS' ? 'text-orange-800' :
                  'text-yellow-800'
                }`}>
                  {SERVICE_STATUS[request.status]?.label || request.status}
                </h3>
                <p className={`text-sm ${
                  request.status === 'REJECTED' ? 'text-red-600' :
                  request.status === 'COMPLETED' ? 'text-green-600' :
                  request.status === 'CANCELLED' ? 'text-red-600' :
                  request.status === 'ACCEPTED' ? 'text-blue-600' :
                  request.status === 'IN_PROGRESS' ? 'text-orange-600' :
                  'text-yellow-600'
                }`}>
                  {SERVICE_STATUS[request.status]?.description || 'Status update'}
                </p>
              </div>
            </div>

            {/* Show rejection reason if available */}
            {request.status === 'REJECTED' && request.mechanicNotes && (
              <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded">
                <div className="flex items-start gap-2">
                  <FiAlertTriangle className="text-red-500 mt-0.5" size={16} />
                  <div>
                    <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                    <p className="text-sm text-red-700">{request.mechanicNotes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Service Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Service Details</h4>
                <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                  <p className="text-white font-medium">
                    {SERVICE_TYPE_DISPLAY[request.serviceType] || request.serviceType}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {request.vehicleMake} {request.vehicleModel}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Vehicle Type: {VEHICLE_TYPE_DISPLAY[request.vehicleType]}
                  </p>
                  {request.vehicleNumber && (
                    <p className="text-gray-400 text-sm">
                      Vehicle Number: {request.vehicleNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              {(request.endUser || showCustomerView) && (
                <div>
                  <h4 className="font-semibold text-white mb-2">Customer Information</h4>
                  <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <FiUser size={14} />
                      <span>{request.endUser?.firstName} {request.endUser?.lastName}</span>
                    </div>
                    {request.endUser?.phone && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <FiPhone size={14} />
                        <span>{request.endUser.phone}</span>
                      </div>
                    )}
                    {request.endUser?.email && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <span className="text-sm">Email: {request.endUser.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Location Information */}
              <div>
                <h4 className="font-semibold text-white mb-2">Location</h4>
                <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                  <div className="flex items-start gap-2 text-gray-300">
                    <FiMapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{request.address}</span>
                  </div>
                  {request.distance && (
                    <p className="text-blue-400 text-sm">
                      Distance: {formatDistance(request.distance)}
                    </p>
                  )}
                  {request.estimatedTravelTime && (
                    <p className="text-gray-400 text-sm">
                      Estimated travel time: ~{request.estimatedTravelTime} minutes
                    </p>
                  )}
                </div>
              </div>

              {/* Timing Information */}
              <div>
                <h4 className="font-semibold text-white mb-2">Timeline</h4>
                <div className="bg-gray-700 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <FiClock size={14} />
                    <span>Requested: {formatDateTime(request.createdAt)}</span>
                  </div>
                  {request.acceptedAt && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <FiClock size={14} />
                      <span>Accepted: {formatDateTime(request.acceptedAt)}</span>
                    </div>
                  )}
                  {request.startedAt && (
                    <div className="flex items-center gap-2 text-orange-400">
                      <FiClock size={14} />
                      <span>Started: {formatDateTime(request.startedAt)}</span>
                    </div>
                  )}
                  {request.completedAt && (
                    <div className="flex items-center gap-2 text-green-400">
                      <FiClock size={14} />
                      <span>Completed: {formatDateTime(request.completedAt)}</span>
                    </div>
                  )}
                  {request.rejectedAt && (
                    <div className="flex items-center gap-2 text-red-400">
                      <FiClock size={14} />
                      <span>Rejected: {formatDateTime(request.rejectedAt)}</span>
                    </div>
                  )}
                  {request.cancelledAt && (
                    <div className="flex items-center gap-2 text-red-400">
                      <FiClock size={14} />
                      <span>Cancelled: {formatDateTime(request.cancelledAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mechanic Information */}
          {request.mechanic && (
            <div>
              <h4 className="font-semibold text-white mb-2">Assigned Mechanic</h4>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-300">
                  <FiUser size={16} />
                  <span>{request.mechanic.firstName} {request.mechanic.lastName}</span>
                </div>
                {request.mechanic.phone && (
                  <div className="flex items-center gap-2 text-gray-300 mt-2">
                    <FiPhone size={16} />
                    <span>{request.mechanic.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {request.description && (
            <div>
              <h4 className="font-semibold text-white mb-2">Problem Description</h4>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-300">{request.description}</p>
              </div>
            </div>
          )}

          {/* Customer Notes */}
          {request.customerNotes && request.customerNotes !== request.description && (
            <div>
              <h4 className="font-semibold text-white mb-2">Customer Notes</h4>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-300">{request.customerNotes}</p>
              </div>
            </div>
          )}

          {/* Mechanic Notes */}
          {request.mechanicNotes && request.status !== 'REJECTED' && (
            <div>
              <h4 className="font-semibold text-white mb-2">Mechanic Notes</h4>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiMessageSquare size={16} className="text-blue-400 mt-0.5" />
                  <p className="text-gray-300">{request.mechanicNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Cost Information */}
          {request.cost && request.status === 'COMPLETED' && (
            <div>
              <h4 className="font-semibold text-white mb-2">Service Cost</h4>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <FiDollarSign size={16} className="text-green-400" />
                  <span className="text-white font-medium">₹{request.cost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Images */}
          {request.images && request.images.length > 0 && (
            <div>
              <h4 className="font-semibold text-white mb-2">Images</h4>
              <div className="grid grid-cols-2 gap-4">
                {request.images.map((image, index) => (
                  <img
                    key={index}
                    src={`http://localhost:5001/${image}`}
                    alt={`Service request ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-600"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action Guide for Rejected Requests */}
          {request.status === 'REJECTED' && showCustomerView && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <FiAlertTriangle className="text-orange-500 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-orange-800">What's Next?</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Your request was rejected by the mechanic. You can create a new service request 
                    or try contacting other mechanics in your area.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestModal;