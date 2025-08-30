import React, { useState } from 'react';
import { FiX, FiMapPin, FiClock, FiUser, FiPhone, FiMail, FiTruck, FiTool, FiImage, FiCheck, FiRefreshCw, FiDollarSign } from 'react-icons/fi';
import { SERVICE_STATUS, SERVICE_TYPE_DISPLAY, VEHICLE_TYPE_DISPLAY } from '../../utils/constants';

const ServiceRequestModal = ({ 
  isOpen, 
  onClose, 
  request, 
  onAccept, 
  onUpdateStatus, 
  isLoading = false 
}) => {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [mechanicNotes, setMechanicNotes] = useState(request?.mechanicNotes || '');
  const [cost, setCost] = useState(request?.cost || '');

  if (!isOpen || !request) return null;

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleStatusUpdate = (status) => {
    const additionalData = {};
    
    if (status === 'COMPLETED') {
      const serviceCost = prompt('Enter service cost (optional):');
      if (serviceCost) additionalData.cost = parseFloat(serviceCost);
    }
    
    if (mechanicNotes.trim()) {
      additionalData.mechanicNotes = mechanicNotes.trim();
    }
    
    onUpdateStatus(request.id, status, additionalData);
  };

  const canAccept = request.status === 'PENDING' && !request.mechanicId;
  const canStartWork = request.status === 'ACCEPTED' && request.mechanicId;
  const canComplete = request.status === 'IN_PROGRESS' && request.mechanicId;
  const isOwnRequest = request.mechanicId; // Assuming current user's request

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              {SERVICE_TYPE_DISPLAY[request.serviceType] || request.serviceType}
            </h2>
            <p className="text-gray-400 text-sm">Request ID: {request.requestId}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              SERVICE_STATUS[request.status]?.bgColor || 'bg-gray-100'
            } ${SERVICE_STATUS[request.status]?.textColor || 'text-gray-800'}`}>
              {SERVICE_STATUS[request.status]?.label || request.status}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <FiUser size={18} />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Name</p>
                <p className="text-white">
                  {request.endUser?.firstName} {request.endUser?.lastName}
                </p>
              </div>
              {request.endUser?.phone && (
                <div>
                  <p className="text-gray-400">Phone</p>
                  <div className="flex items-center gap-2">
                    <FiPhone size={14} />
                    <a 
                      href={`tel:${request.endUser.phone}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {request.endUser.phone}
                    </a>
                  </div>
                </div>
              )}
              {request.endUser?.email && (
                <div>
                  <p className="text-gray-400">Email</p>
                  <div className="flex items-center gap-2">
                    <FiMail size={14} />
                    <a 
                      href={`mailto:${request.endUser.email}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {request.endUser.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <FiTruck size={18} />
              Vehicle Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Vehicle Type</p>
                <p className="text-white">
                  {VEHICLE_TYPE_DISPLAY[request.vehicleType] || request.vehicleType}
                </p>
              </div>
              {request.vehicleMake && (
                <div>
                  <p className="text-gray-400">Make & Model</p>
                  <p className="text-white">
                    {request.vehicleMake} {request.vehicleModel || ''}
                  </p>
                </div>
              )}
              {request.vehicleNumber && (
                <div>
                  <p className="text-gray-400">Vehicle Number</p>
                  <p className="text-white">{request.vehicleNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <FiTool size={18} />
              Service Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400">Service Type</p>
                <p className="text-white">
                  {SERVICE_TYPE_DISPLAY[request.serviceType] || request.serviceType}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Description</p>
                <p className="text-white bg-gray-800 p-3 rounded">
                  {request.description || 'No description provided'}
                </p>
              </div>
              {request.customerNotes && (
                <div>
                  <p className="text-gray-400">Customer Notes</p>
                  <p className="text-white bg-gray-800 p-3 rounded">
                    {request.customerNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <FiMapPin size={18} />
              Location
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400">Address</p>
                <p className="text-white">{request.address}</p>
              </div>
              {request.distance && (
                <div>
                  <p className="text-gray-400">Distance from you</p>
                  <p className="text-white">
                    {request.distance < 1 
                      ? `${Math.round(request.distance * 1000)}m` 
                      : `${request.distance.toFixed(1)}km`}
                    {request.estimatedTravelTime && (
                      <span className="text-gray-400"> • ~{request.estimatedTravelTime}min travel</span>
                    )}
                  </p>
                </div>
              )}
              <button 
                onClick={() => window.open(`https://maps.google.com/?q=${request.latitude},${request.longitude}`)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Open in Google Maps
              </button>
            </div>
          </div>

          {/* Images */}
          {request.images && request.images.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <FiImage size={18} />
                Problem Images
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {request.images.map((image, index) => (
                  <img
                    key={index}
                    src={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001'}/${image}`}
                    alt={`Problem ${index + 1}`}
                    className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-75"
                    onClick={() => window.open(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001'}/${image}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <FiClock size={18} />
              Timeline
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Requested</span>
                <span className="text-white">{formatDateTime(request.createdAt)}</span>
              </div>
              {request.acceptedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Accepted</span>
                  <span className="text-white">{formatDateTime(request.acceptedAt)}</span>
                </div>
              )}
              {request.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Completed</span>
                  <span className="text-white">{formatDateTime(request.completedAt)}</span>
                </div>
              )}
              {request.cancelledAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Cancelled</span>
                  <span className="text-white">{formatDateTime(request.cancelledAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cost Information */}
          {request.cost && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <FiDollarSign size={18} />
                Service Cost
              </h3>
              <p className="text-white text-lg font-semibold">₹{request.cost}</p>
            </div>
          )}

          {/* Mechanic Notes */}
          {isOwnRequest && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">Mechanic Notes</h3>
              <textarea
                value={mechanicNotes}
                onChange={(e) => setMechanicNotes(e.target.value)}
                placeholder="Add notes about the service..."
                className="w-full p-3 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            {canAccept && (
              <button
                onClick={() => onAccept(request.id)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded font-medium"
              >
                <FiCheck size={16} />
                {isLoading ? 'Accepting...' : 'Accept Request'}
              </button>
            )}

            {canStartWork && (
              <button
                onClick={() => handleStatusUpdate('IN_PROGRESS')}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium"
              >
                <FiRefreshCw size={16} />
                Start Work
              </button>
            )}

            {canComplete && (
              <button
                onClick={() => handleStatusUpdate('COMPLETED')}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded font-medium"
              >
                <FiCheck size={16} />
                Mark Complete
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestModal;