import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebook, FaTwitter, FaLinkedin, FaPinterest, FaWhatsapp } from 'react-icons/fa';
import { MdOutlineMiscellaneousServices } from 'react-icons/md';

// --- VVV THIS IS THE CORRECTED SECTION VVV ---
// --- Mock Data: Now aligned with Dashboard.jsx ---
const allWorkshops = [
  // This is the full list of 8 workshops
  { id: 1, name: 'Automobile Work Shop', image: 'https://images.unsplash.com/photo-1599493356244-18a7c2514124?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200', rating: 4, isPremium: true, location: 'Silver Auditorium, Ahmedabad, Gujarat', status: 'Open', distance: 25, owner: 'Marc Demo', phone: '+1 555-555-5556', email: 'info@yourcompany.com', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.', services: ['Engine Diagnostics', 'Oil Change', 'Brake Repair', 'Tire Rotation', 'AC Service', 'Battery Check'], reviews: [{id: 1, user: 'Mitchell Admin', rating: 5, text: 'Very good service'}] },
  { id: 2, name: 'Quick Fix Auto', image: 'https://images.unsplash.com/photo-1553854314-38627c368db5?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200', rating: 5, isPremium: false, location: 'Downtown, Ahmedabad, Gujarat', status: 'Open', distance: 5, owner: 'Jane Doe', phone: '+1 555-123-4567', email: 'contact@quickfix.com', description: 'Fast and reliable service for all your car needs. We get you back on the road in no time!', services: ['Tire Repair', 'Oil Change', 'State Inspection'], reviews: [{id: 1, user: 'John Smith', rating: 5, text: 'Incredibly fast and professional.'}] },
  { id: 3, name: 'Car Care Center', image: 'https://images.unsplash.com/photo-1623905500851-9b6528789e96?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200', rating: 3, isPremium: true, location: 'Uptown, Ahmedabad, Gujarat', status: 'Closed', distance: 10, owner: 'Peter Jones', phone: '+1 555-987-6543', email: 'support@carcare.com', description: 'Premium car care services. We treat your car like our own.', services: ['Full Detailing', 'Ceramic Coating', 'Paint Correction'], reviews: [] },
  { id: 4, name: 'Speedy Garage', image: 'https://images.unsplash.com/photo-1617094544843-a60d0a51351b?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200', rating: 5, isPremium: true, location: 'West End, Ahmedabad, Gujarat', status: 'Open', distance: 2, owner: 'Susan Reid', phone: '+1 555-345-6789', email: 'info@speedygarage.com', description: 'Efficient service with a smile. We guarantee the fastest turnaround time.', services: ['Express Oil Change', 'Tire Rotation', 'Brake Check'], reviews: [{id: 1, user: 'Emily White', rating: 5, text: 'So fast and friendly!'}] },
  { id: 5, name: 'Engine Experts', image: 'https://images.unsplash.com/photo-1579751379299-195b1917f417?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200', rating: 4, isPremium: false, location: 'East Side, Ahmedabad, Gujarat', status: 'Open', distance: 15, owner: 'David Chen', phone: '+1 555-555-1212', email: 'engines@experts.com', description: 'Specializing in complex engine diagnostics and repair.', services: ['Engine Rebuild', 'Check Engine Light', 'Head Gasket Repair'], reviews: [] },
  { id: 6, name: 'The Wrench Masters', image: 'https://images.unsplash.com/photo-1581490282017-9f054854c693?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200', rating: 2, isPremium: false, location: 'Suburbia, Ahmedabad, Gujarat', status: 'Closed', distance: 30, owner: 'Frank Miller', phone: '+1 555-222-3333', email: 'frank@wrenchmasters.com', description: 'Old school mechanics with a passion for cars.', services: ['Classic Car Repair', 'Transmission Service', 'Suspension'], reviews: [] },
  { id: 7, name: 'Pro Auto Repair', image: 'https://images.unsplash.com/photo-1543038994-35b8712a8323?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200', rating: 5, isPremium: true, location: 'Industrial Park, Ahmedabad, Gujarat', status: 'Open', distance: 8, owner: 'Grace Kim', phone: '+1 555-777-8888', email: 'grace@proautorepair.com', description: 'Professional, certified technicians for all makes and models.', services: ['Full Service Repair', 'Fleet Maintenance', 'Electrical Diagnostics'], reviews: [{id: 1, user: 'Tom Harris', rating: 5, text: 'The only place I trust with my company vehicles.'}] },
  { id: 8, name: 'My Mechanic', image: 'https://images.unsplash.com/photo-1621998536294-b72e1e3b681e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200', rating: 4, isPremium: false, location: 'City Center, Ahmedabad, Gujarat', status: 'Open', distance: 1, owner: 'Leo Garcia', phone: '+1 555-444-5555', email: 'leo@mymechanic.com', description: 'Your friendly neighborhood mechanic. Honest work at a fair price.', services: ['General Maintenance', 'Brake Repair', 'Oil Change'], reviews: [] },
];
// --- ^^^ THIS IS THE CORRECTED SECTION ^^^ ---

// Helper components for this page (No changes here)
const InfoLine = ({ icon, text }) => ( <div className="flex items-center gap-3 text-gray-600"> {icon} <span>{text}</span> </div> );
const ServiceItem = ({ name }) => ( <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center"> <MdOutlineMiscellaneousServices className="mx-auto text-3xl text-blue-600 mb-2" /> <p className="font-semibold text-gray-700">{name}</p> </div> );
const Review = ({ review }) => ( <div className="flex gap-3 my-4"> <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div> <div> <p className="font-bold text-gray-800">{review.user}</p> <p className="bg-gray-100 rounded-lg p-3 mt-1">{review.text}</p> </div> </div> );

const WorkshopDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // This logic is now correct because `allWorkshops` is complete
  const workshop = allWorkshops.find(w => w.id === parseInt(id));

  // State for reviews
  const [reviews, setReviews] = useState(workshop?.reviews || []);
  const [newReviewText, setNewReviewText] = useState('');

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (newReviewText.trim()) {
        const newReview = { id: Date.now(), user: 'Current User', text: newReviewText, };
        setReviews([...reviews, newReview]);
        setNewReviewText('');
    }
  }

  if (!workshop) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold">Workshop not found</h1>
          <Link to="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">Go back to search</Link>
        </div>
      </Layout>
    );
  }

  // The rest of your component remains exactly the same
  return (
    <Layout>
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <header className="flex justify-between items-center mb-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>
            </header>
            
            <div className="lg:grid lg:grid-cols-3 lg:gap-12">
                {/* Main Content */}
                <main className="lg:col-span-2">
                    <img src={workshop.image} alt={workshop.name} className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg mb-6" />
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{workshop.name}</h1>
                    <p className="mt-4 text-gray-600 text-lg">{workshop.description}</p>
                    
                    <section className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Services We Provide</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {workshop.services.map(service => <ServiceItem key={service} name={service} />)}
                        </div>
                    </section>

                    <section className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Customer Reviews</h2>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                            {reviews.map(review => <Review key={review.id} review={review} />)}
                             <form onSubmit={handleReviewSubmit} className="mt-6 flex gap-3">
                                <input 
                                    type="text" 
                                    value={newReviewText}
                                    onChange={(e) => setNewReviewText(e.target.value)}
                                    placeholder="Write a review..." 
                                    className="w-full bg-white border-gray-300 rounded-md py-2 px-4 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button type="submit" className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-700">Send</button>
                            </form>
                        </div>
                    </section>
                </main>

                {/* Sidebar */}
                <aside className="mt-12 lg:mt-0">
                    <div className="sticky top-8 space-y-8">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-5 rounded-lg transition-colors text-lg shadow-sm">
                                Book Service
                            </button>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                            <h3 className="text-xl font-bold text-gray-800">Location & Contact</h3>
                            <InfoLine icon={<FaMapMarkerAlt className="text-red-500 text-xl" />} text={workshop.location} />
                             <img src="https://i.imgur.com/8O0Z0oM.png" alt="Map location" className="rounded-md border-2 border-gray-200" />
                            <h4 className="font-semibold text-gray-700 pt-2">Owner: {workshop.owner}</h4>
                            <InfoLine icon={<FaPhone className="text-blue-500 text-xl" />} text={workshop.phone} />
                            <InfoLine icon={<FaEnvelope className="text-blue-500 text-xl" />} text={workshop.email} />
                        </div>
                         <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Share</h3>
                            <div className="flex items-center justify-around text-2xl text-gray-600">
                                <a href="#" className="hover:text-blue-800"><FaFacebook /></a>
                                <a href="#" className="hover:text-sky-500"><FaTwitter /></a>
                                <a href="#" className="hover:text-blue-600"><FaLinkedin /></a>
                                <a href="#" className="hover:text-green-500"><FaWhatsapp /></a>
                                <a href="#" className="hover:text-red-600"><FaPinterest /></a>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkshopDetailPage;