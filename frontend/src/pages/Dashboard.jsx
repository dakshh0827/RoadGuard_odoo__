import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom'; // 1. IMPORT THE LINK COMPONENT
import Layout from '../components/Layout/Layout'; 

// --- Mock Data ---
const allWorkshops = [
  { id: 1, name: 'Automobile Work Shop', image: 'https://images.unsplash.com/photo-1599493356244-18a7c2514124?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', rating: 4, isPremium: true, location: 'Silver Auditorium, Ahmedabad, Gujarat', status: 'Open', distance: 25 },
  { id: 2, name: 'Quick Fix Auto', image: 'https://images.unsplash.com/photo-1553854314-38627c368db5?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', rating: 5, isPremium: false, location: 'Downtown, Ahmedabad, Gujarat', status: 'Open', distance: 5 },
  { id: 3, name: 'Car Care Center', image: 'https://images.unsplash.com/photo-1623905500851-9b6528789e96?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', rating: 3, isPremium: true, location: 'Uptown, Ahmedabad, Gujarat', status: 'Closed', distance: 10 },
  { id: 4, name: 'Speedy Garage', image: 'https://images.unsplash.com/photo-1617094544843-a60d0a51351b?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', rating: 5, isPremium: true, location: 'West End, Ahmedabad, Gujarat', status: 'Open', distance: 2 },
  { id: 5, name: 'Engine Experts', image: 'https://images.unsplash.com/photo-1579751379299-195b1917f417?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', rating: 4, isPremium: false, location: 'East Side, Ahmedabad, Gujarat', status: 'Open', distance: 15 },
  { id: 6, name: 'The Wrench Masters', image: 'https://images.unsplash.com/photo-1581490282017-9f054854c693?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', rating: 2, isPremium: false, location: 'Suburbia, Ahmedabad, Gujarat', status: 'Closed', distance: 30 },
  { id: 7, name: 'Pro Auto Repair', image: 'https://images.unsplash.com/photo-1543038994-35b8712a8323?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', rating: 5, isPremium: true, location: 'Industrial Park, Ahmedabad, Gujarat', status: 'Open', distance: 8 },
  { id: 8, name: 'My Mechanic', image: 'https://images.unsplash.com/photo-1621998536294-b72e1e3b681e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', rating: 4, isPremium: false, location: 'City Center, Ahmedabad, Gujarat', status: 'Open', distance: 1 },
];

// --- Helper Components (No Changes Here) ---

const StarRating = ({ rating }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <svg key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const WorkshopItem = ({ workshop, viewMode }) => {
    const isListView = viewMode === 'List';
    return (
        <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${isListView ? 'flex items-center' : 'flex flex-col'}`}>
            <img 
                src={workshop.image} 
                alt={workshop.name} 
                className={`object-cover ${isListView ? 'w-40 h-full flex-shrink-0' : 'w-full h-48'}`} 
            />
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{workshop.name}</h3>
                    {workshop.isPremium && <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Premium</span>}
                </div>
                <div className="mb-3">
                    <StarRating rating={workshop.rating} />
                </div>
                <p className="text-gray-500 text-sm flex items-center gap-1.5 mb-4">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                    {workshop.location}
                </p>
                <div className={`mt-auto flex ${isListView ? 'flex-col items-start gap-2' : 'justify-between items-center'}`}>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${workshop.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {workshop.status}
                    </span>
                    <span className="text-sm text-gray-600 font-semibold">{workshop.distance}km away</span>
                </div>
            </div>
        </div>
    );
};


const Pagination = ({ currentPage, totalPages, onPageChange }) => (
    <div className="flex justify-center items-center space-x-1 mt-8">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-2 rounded-md bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => onPageChange(i + 1)} className={`px-4 py-2 rounded-md font-semibold text-sm ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                {i + 1}
            </button>
        ))}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-2 rounded-md bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
    </div>
)

// --- Main Component ---
const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Nearby');
  const [viewMode, setViewMode] = useState('List');
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = viewMode === 'List' ? 4 : 6;

  const filteredWorkshops = useMemo(() => {
    return allWorkshops
      .filter(workshop => {
        const matchesSearch = workshop.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || workshop.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'Nearby') return a.distance - b.distance;
        if (sortBy === 'Most Rated') return b.rating - a.rating;
        return 0;
      });
  }, [searchQuery, statusFilter, sortBy]);
  
  const totalPages = Math.ceil(filteredWorkshops.length / ITEMS_PER_PAGE);
  const paginatedWorkshops = filteredWorkshops.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search by name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                  </div>
                  <input id="search" type="text" placeholder="e.g. Quick Fix Auto" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border-gray-300 rounded-md py-2 pl-10 pr-3 focus:ring-blue-500 focus:border-blue-500"/>
                </div>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select id="status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-gray-50 border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500">
                  <option value="All">All Statuses</option>
                  <option value="Open">Open Now</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                <select id="sort" value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full bg-gray-50 border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500">
                  <option>Nearby</option>
                  <option>Most Rated</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-600">
                Showing <span className="font-bold">{paginatedWorkshops.length}</span> of <span className="font-bold">{filteredWorkshops.length}</span> results
            </p>
            <div className="flex items-center gap-2 p-1 bg-gray-200 rounded-lg">
                <button onClick={() => setViewMode('List')} className={`p-2 rounded-md ${viewMode === 'List' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'}`}>
                    <svg className={`w-5 h-5 ${viewMode === 'List' ? 'text-blue-600' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={() => setViewMode('Card')} className={`p-2 rounded-md ${viewMode === 'Card' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'}`}>
                    <svg className={`w-5 h-5 ${viewMode === 'Card' ? 'text-blue-600' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
            </div>
          </div>

          {/* ---vvv THIS IS THE ONLY SECTION THAT HAS CHANGED vvv--- */}
          <div className={viewMode === 'List' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'}>
              {paginatedWorkshops.length > 0 ? (
                paginatedWorkshops.map(workshop => (
                  // 2. WRAP THE WorkshopItem IN A LINK
                  <Link to={`/workshop/${workshop.id}`} key={workshop.id} className="block">
                    <WorkshopItem workshop={workshop} viewMode={viewMode} />
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-20 bg-white rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-700">No workshops found</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria.</p>
                </div>
              )}
          </div>
          {/* ---^^^ THIS IS THE ONLY SECTION THAT HAS CHANGED ^^^--- */}

          {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;