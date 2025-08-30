import React, { useState } from "react";
import {
  Bell,
  Settings,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Car,
  Wrench,
  DollarSign,
  Search,
  Eye,
  UserCheck,
  BarChart3,
  Activity,
  Plus,
} from "lucide-react";

const AdminDashboard = () => {
  const [isAcceptingRequests, setIsAcceptingRequests] = useState(true);
  const [notificationVisible, setNotificationVisible] = useState(true);

  // Mock data
  const stats = {
    totalRequests: 156,
    activeRequests: 23,
    completedToday: 45,
    activeWorkers: 18,
  };

  const recentRequests = [
    {
      id: "RG001",
      customer: "John Doe",
      location: "Highway 101, Sector 45",
      serviceType: "Engine Repair",
      status: "pending",
      timeAgo: "5 mins ago",
      cost: 2500,
    },
    {
      id: "RG002",
      customer: "Sarah Johnson",
      location: "Main Street, Downtown",
      serviceType: "Tire Change",
      status: "assigned",
      assignedTo: "Alex Kumar",
      timeAgo: "12 mins ago",
      cost: 800,
    },
    {
      id: "RG003",
      customer: "Robert Smith",
      location: "Ring Road, Phase 2",
      serviceType: "Towing Service",
      status: "in_progress",
      assignedTo: "Mike Wilson",
      timeAgo: "18 mins ago",
      cost: 1500,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-800 border-red-200";
      case "assigned":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div
      className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${color} hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div
          className={`p-3 rounded-full ${color
            .replace("border-l-", "bg-")
            .replace("-500", "-100")}`}
        >
          <Icon className={`w-6 h-6 ${color.replace("border-l-", "text-")}`} />
        </div>
      </div>
    </div>
  );

  const RequestCard = ({ request }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {request.customer
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{request.customer}</h4>
            <p className="text-gray-500 text-sm">#{request.id}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
            request.status
          )}`}
        >
          {request.status.replace("_", " ").toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="truncate">{request.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Wrench className="w-4 h-4 text-gray-400" />
          <span>{request.serviceType}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span>₹{request.cost.toLocaleString()}</span>
          </div>
          <span className="text-gray-500">{request.timeAgo}</span>
        </div>
      </div>

      {request.assignedTo && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span className="text-blue-800 font-medium">
              Assigned to: {request.assignedTo}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {request.status === "pending" ? (
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors transform hover:scale-105">
            Assign Worker
          </button>
        ) : (
          <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
            View Details
          </button>
        )}
        <button className="px-3 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-600 hover:text-gray-800 transition-colors">
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    RoadGuard Admin
                  </h1>
                  <p className="text-sm text-gray-500">
                    Manage service requests
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Workshop Status Toggle */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isAcceptingRequests
                      ? "bg-green-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                ></span>
                <span className="text-sm font-medium text-gray-700">
                  {isAcceptingRequests
                    ? "Accepting Requests"
                    : "Requests Paused"}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isAcceptingRequests}
                    onChange={() =>
                      setIsAcceptingRequests(!isAcceptingRequests)
                    }
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                </label>
              </div>

              <button className="relative p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </button>

              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification Banner */}
        {notificationVisible && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-blue-900">
                  New service requests in your area!
                </p>
                <p className="text-sm text-blue-700">
                  3 urgent requests need immediate attention
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors transform hover:scale-105">
                View All
              </button>
              <button
                onClick={() => setNotificationVisible(false)}
                className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Activity}
            title="Total Requests"
            value={stats.totalRequests}
            color="border-l-blue-500"
          />
          <StatCard
            icon={Clock}
            title="Active Now"
            value={stats.activeRequests}
            color="border-l-yellow-500"
          />
          <StatCard
            icon={CheckCircle}
            title="Completed Today"
            value={stats.completedToday}
            color="border-l-green-500"
          />
          <StatCard
            icon={Users}
            title="Active Workers"
            value={stats.activeWorkers}
            color="border-l-purple-500"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Requests */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Service Requests
                    </h3>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      {
                        recentRequests.filter((r) => r.status === "pending")
                          .length
                      }{" "}
                      Pending
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search requests..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {recentRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg text-left transition-all duration-200 transform hover:scale-105">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">
                      Assign Workers
                    </div>
                    <div className="text-xs text-blue-600">
                      Manage assignments
                    </div>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg text-left transition-all duration-200 transform hover:scale-105">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900">
                      View Analytics
                    </div>
                    <div className="text-xs text-green-600">
                      Performance reports
                    </div>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-lg text-left transition-all duration-200 transform hover:scale-105">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-purple-900">
                      Manage Workers
                    </div>
                    <div className="text-xs text-purple-600">
                      Add or edit workers
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Priority Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Priority Alerts
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                  <p className="text-sm font-medium text-red-800">
                    3 Urgent Requests
                  </p>
                  <p className="text-xs text-red-600">
                    Need immediate assignment
                  </p>
                  <button className="mt-2 text-xs bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700 transition-colors">
                    View Now
                  </button>
                </div>
                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                  <p className="text-sm font-medium text-yellow-800">
                    Worker Delayed
                  </p>
                  <p className="text-xs text-yellow-600">
                    ETA exceeded by 20 mins
                  </p>
                  <button className="mt-2 text-xs bg-yellow-600 text-white px-3 py-1 rounded-full hover:bg-yellow-700 transition-colors">
                    Check Status
                  </button>
                </div>
              </div>
            </div>

            {/* Today's Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Today's Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      45
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">In Progress</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="w-1/2 h-full bg-yellow-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      12
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="w-1/4 h-full bg-red-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-800">8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;