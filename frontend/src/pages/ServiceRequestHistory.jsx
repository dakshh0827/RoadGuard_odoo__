import React, { useState } from 'react';
import Layout from '../components/Layout/Layout';
import Header from '../components/Layout/Header'; // Using your existing Header
import { FiCheckCircle, FiClock, FiTool } from 'react-icons/fi';

// --- Mock Data: In a real app, this would come from an API ---
const initialRequests = [
  { id: 1, serviceName: 'Service 1', customerName: 'John Doe', location: '123 Main St, Anytown', assignedWorker: null, status: 'Pending' },
  { id: 2, serviceName: 'Service 2', customerName: 'Jane Smith', location: '456 Oak Ave, Somecity', assignedWorker: 'Mike Ross', status: 'In Progress' },
  { id: 3, serviceName: 'Service 3', customerName: 'Sam Wilson', location: '789 Pine Ln, Villagetown', assignedWorker: 'Sarah K.', status: 'Completed' },
  { id: 4, serviceName: 'Service 4', customerName: 'Emily White', location: '101 Maple Dr, Bigcity', assignedWorker: null, status: 'Pending' },
];

// --- Helper Component for a single list item ---
const ServiceRequestItem = ({ request, onAccept }) => {
  // Define styles based on the request status
  const statusStyles = {
    Pending: {
      borderColor: 'border-yellow-500',
      bgColor: 'bg-yellow-900/20',
      textColor: 'text-yellow-400',
      icon: <FiClock className="mr-2" />
    },
    'In Progress': {
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-900/20',
      textColor: 'text-blue-400',
      icon: <FiTool className="mr-2 animate-spin" style={{ animationDuration: '3s' }}/>
    },
    Completed: {
      borderColor: 'border-green-500',
      bgColor: 'bg-green-900/20',
      textColor: 'text-green-400',
      icon: <FiCheckCircle className="mr-2" />
    },
  };

  const currentStyle = statusStyles[request.status];

  return (
    <div className={`border-l-4 ${currentStyle.borderColor} ${currentStyle.bgColor} rounded-r-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
      {/* Request Details */}
      <div className="flex-1">
        <h3 className="text-lg font-bold text-white">{request.serviceName}</h3>
        <p className="text-sm text-gray-300">Name: {request.customerName}</p>
        <p className="text-sm text-gray-400">Location: {request.location}</p>
      </div>

      {/* Worker & Status */}
      <div className="flex-1">
        <p className="text-sm text-gray-300">
          Assigned Worker: <span className="font-semibold text-white">{request.assignedWorker || 'Unassigned'}</span>
        </p>
        <div className={`flex items-center mt-2 font-semibold ${currentStyle.textColor}`}>
          {currentStyle.icon}
          <span>{request.status}</span>
        </div>
        <a href="#" className="text-sm text-blue-400 hover:underline mt-1 inline-block">Track History</a>
      </div>

      {/* Action Button */}
      <div className="w-full md:w-auto">
        {request.status === 'Pending' && (
          <button 
            onClick={() => onAccept(request.id)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md"
          >
            Accept & Assign
          </button>
        )}
      </div>
    </div>
  );
};


// --- Main Page Component ---
const ServiceRequestHistory = () => {
  const [requests, setRequests] = useState(initialRequests);

  const handleAcceptRequest = (requestId) => {
    // In a real app, you would make an API call here to update the backend.
    // This would also trigger notifications.
    
    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId
          ? { ...req, status: 'In Progress', assignedWorker: 'Admin Assigned' } // Placeholder worker name
          : req
      )
    );
    
    // Simulate notification
    alert(`Request #${requestId} has been accepted and assigned. User and workers will be notified.`);
  };

  return (
    <Layout>
      <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-6 lg:p-8">
        <Header />

        <div className="max-w-7xl mx-auto mt-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h1 className="text-3xl font-bold text-white mb-8">Service Request History</h1>
            
            <div className="space-y-6">
              {requests.map(request => (
                <ServiceRequestItem
                  key={request.id}
                  request={request}
                  onAccept={handleAcceptRequest}
                />
              ))}
            </div>
            
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ServiceRequestHistory;