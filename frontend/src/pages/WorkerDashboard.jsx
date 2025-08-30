import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// FullCalendar Imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Layout and Component Imports
import Layout from '../components/Layout/Layout';
import Header from '../components/Layout/Header'; // Using your existing Header
import { FiCalendar, FiList, FiTrello } from 'react-icons/fi';

// --- Mock Data for Jobs/Services ---
const mockJobs = [
  { id: 'job-1', title: 'Brake Repair - John D.', start: '2024-07-22T10:00:00', vehicle: 'Toyota Camry 2021', status: 'Pending' },
  { id: 'job-2', title: 'Oil Change - Jane S.', start: '2024-07-23T14:00:00', vehicle: 'Honda Civic 2019', status: 'In Progress' },
  { id: 'job-3', title: 'Engine Diagnostic - Sam W.', start: '2024-07-24T09:00:00', vehicle: 'Ford F-150 2022', status: 'Completed' },
  { id: 'job-4', title: 'Tire Rotation - Emily B.', start: '2024-07-24T11:00:00', vehicle: 'Nissan Rogue 2020', status: 'In Progress' },
  { id: 'job-5', title: 'AC Service - Mike R.', start: '2024-07-25', vehicle: 'Chevrolet Equinox 2018', status: 'Pending' },
];

const initialKanbanColumns = {
  'pending': {
    name: 'Pending',
    items: mockJobs.filter(j => j.status === 'Pending'),
  },
  'in-progress': {
    name: 'In Progress',
    items: mockJobs.filter(j => j.status === 'In Progress'),
  },
  'completed': {
    name: 'Completed',
    items: mockJobs.filter(j => j.status === 'Completed'),
  },
};


// --- Main WorkerDashboard Component ---
const WorkerDashboard = () => {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar', 'list', 'kanban'
  const [notificationVisible, setNotificationVisible] = useState(true);
  const [columns, setColumns] = useState(initialKanbanColumns);

  const handleEventClick = (clickInfo) => {
    alert(`Details for: ${clickInfo.event.title}\nVehicle: ${clickInfo.event.extendedProps.vehicle}\nStatus: ${clickInfo.event.extendedProps.status}`);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceColumn, items: sourceItems },
        [destination.droppableId]: { ...destColumn, items: destItems },
      });
    } else {
      const column = columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: { ...column, items: copiedItems },
      });
    }
  };

  return (
    <Layout>
      <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-6 lg:p-8">
        {/* Your Header will go here. You might need to adapt it to include the "In Service" toggle */}
        {/* <Header />  */}

        <div className="max-w-7xl mx-auto mt-6 relative">
          {/* Notification Pop-up */}
          {notificationVisible && (
            <div className="absolute top-0 right-0 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg flex items-start gap-4 z-10">
              <div>
                <p className="font-semibold">New Request XXX Assigned.</p>
                <a href="#" className="text-blue-400 hover:underline text-sm">Click here to view more.</a>
              </div>
              <button onClick={() => setNotificationVisible(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
          )}

          {/* Main content area */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            {/* Filter Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 items-center mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-500"/>
                <span>Show open only</span>
              </label>
              <select className="bg-gray-700 border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Category</option>
              </select>
              <select className="bg-gray-700 border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Status</option>
              </select>
              <select className="bg-gray-700 border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Distance</option>
              </select>
              <div className="bg-gray-700 p-2 rounded-md">
                <p className="text-sm mb-1">Sort by:</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="sort" defaultChecked /> Most Recent</label>
                  <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="sort" /> Most Updated</label>
                </div>
              </div>
            </div>

            {/* Search and View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
              <div className="relative w-full sm:w-auto flex-grow">
                <input type="text" placeholder="Search Shop or Service" className="w-full bg-gray-700 border-gray-600 rounded-md py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-md ${viewMode === 'calendar' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}> <FiCalendar size={20} /> </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}> <FiList size={20} /> </button>
                <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md ${viewMode === 'kanban' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}> <FiTrello size={20} /> </button>
              </div>
            </div>
            
            {/* Conditional View Rendering */}
            <div className="mt-4">
              {viewMode === 'calendar' && <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
                events={mockJobs.map(job => ({ ...job, extendedProps: job }))} // Pass full job object
                eventClick={handleEventClick}
                height="650px"
                // Theming for dark mode
                eventColor="#2563eb"
                eventBackgroundColor="#2563eb"
                eventBorderColor="#1e40af"
              />}

              {viewMode === 'list' && (
                <div className="space-y-4">
                  {mockJobs.map(job => (
                    <div key={job.id} onClick={() => alert(`Details for ${job.title}`)} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-600">
                      <div>
                        <p className="font-bold">{job.title}</p>
                        <p className="text-sm text-gray-400">{job.vehicle}</p>
                      </div>
                      <span className="font-semibold text-blue-400">{job.status}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {viewMode === 'kanban' && (
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(columns).map(([columnId, column]) => (
                      <Droppable key={columnId} droppableId={columnId}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-900 rounded-lg p-4">
                            <h3 className="font-bold text-lg mb-4 text-center">{column.name}</h3>
                            {column.items.map((item, index) => (
                              <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-gray-700 p-3 rounded-lg mb-3 shadow-md">
                                    <p className="font-semibold">{item.title}</p>
                                    <p className="text-sm text-gray-400">{item.vehicle}</p>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    ))}
                  </div>
                </DragDropContext>
              )}
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkerDashboard;