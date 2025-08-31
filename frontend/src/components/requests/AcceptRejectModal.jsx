// src/components/modals/AcceptRejectModal.js
import React, { useState } from 'react';
import { FiX, FiCheck, FiAlertTriangle, FiMapPin, FiClock, FiUser, FiPhone } from 'react-icons/fi';
import { SERVICE_TYPE_DISPLAY, VEHICLE_TYPE_DISPLAY } from '../../utils/constants';

const AcceptRejectModal = ({ 
  isOpen, 
  onClose, 
  request, 
  onAccept, 
  onReject, 
  loading = false 
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!isOpen || !request) return null;

  const handleAccept = () => {
    onAccept(request.id);
  };

  const handleReject = () => {
    if (!showRejectForm) {
      setShowRejectForm(true);
      return;
    }
    
    onReject(request.id, rejectReason.trim());
    setRejectReason('');
    setShowRejectForm(false);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Service Request Details</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Service Type */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {SERVICE_TYPE_DISPLAY[request.serviceType] || request.serviceType}
            </h3>
            <p className="text-gray-400">
              {request.vehicleMake} {request.vehicleModel} ({VEHICLE_TYPE_DISPLAY[request.vehicleType]})
            </p>
            {request.vehicleNumber && (
              <p className="text-sm text-gray-500">Vehicle: {request.vehicleNumber}</p>
            )}
          </div>

          {/* Customer Info */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-white mb-2">Customer Information</h4>
            <div className="space-y-2 text-sm">
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
            </div>
          </div>

          {/* Location & Time Info */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-start gap-2 text-gray-300">
              <FiMapPin size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm">{request.address}</p>
                {request.distance && (
                  <p className="text-xs text-blue-400">Distance: {formatDistance(request.distance)}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-gray-300">
              <FiClock size={14} />
              <span className="text-sm">
                Requested {formatTimeAgo(request.createdAt)}
                {request.estimatedTravelTime && (
                  <span className="text-gray-400"> • ~{request.estimatedTravelTime}min travel</span>
                )}
              </span>
            </div>
          </div>

          {/* Description */}
          {request.description && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2">Description</h4>
              <p className="text-gray-300 text-sm">{request.description}</p>
            </div>
          )}

          {/* Customer Notes */}
          {request.customerNotes && request.customerNotes !== request.description && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2">Customer Notes</h4>
              <p className="text-gray-300 text-sm">{request.customerNotes}</p>
            </div>
          )}

          {/* Images */}
          {request.images && request.images.length > 0 && (
            <div>
              <h4 className="font-medium text-white mb-2">Images</h4>
              <div className="grid grid-cols-2 gap-2">
                {request.images.map((image, index) => (
                  <img
                    key={index}
                    src={`${API_BASE_URL}/${image}`}
                    alt={`Service request ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <div className="bg-gray-700 p-4 rounded-lg border border-red-400">
              <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                <FiAlertTriangle className="text-red-400" />
                Reason for Rejection
              </h4>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this request..."
                className="w-full bg-gray-600 border border-gray-500 rounded-md p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-2">
                {rejectReason.length}/500 characters
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-700">
          {!showRejectForm ? (
            <>
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 px-4 rounded-md font-medium transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FiCheck size={16} />
                    Accept
                  </>
                )}
              </button>
              
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 px-4 rounded-md font-medium transition-colors"
              >
                <FiX size={16} />
                Reject
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason('');
                }}
                disabled={loading}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white py-3 px-4 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 px-4 rounded-md font-medium transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FiX size={16} />
                    Confirm Reject
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptRejectModal;