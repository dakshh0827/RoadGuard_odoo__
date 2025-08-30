import React from 'react';
import ServiceRequestForm from '../components/requests/ServiceRequestForm';
import { ArrowLeft } from 'lucide-react'; // You can use an icon library like lucide-react
import { useNavigate } from 'react-router-dom';

const NewRequestPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 mr-2">
            {/* Replace with an actual icon component if you have one */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">New Service Request</h1>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
           <p className="text-sm text-gray-600 mb-4">
            Fill out the details below to find the nearest help.
           </p>
          <ServiceRequestForm />
        </div>
      </div>
    </div>
  );
};

export default NewRequestPage;