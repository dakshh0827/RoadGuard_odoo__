// src/services/apiService.js - ADMIN BYPASS VERSION
import { 
  API_BASE_URL, 
  SERVICE_REQUEST_ENDPOINTS, 
  ERROR_MESSAGES 
} from '../utils/constants';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  // ============== ADMIN MOCK DATA ==============
  
  // Mock admin dashboard stats
  getMockDashboardStats() {
    return {
      success: true,
      data: {
        requests: {
          total: 25,
          pending: 3,
          accepted: 5,
          inProgress: 7,
          completed: 8,
          rejected: 1,
          cancelled: 1
        },
        timeframes: {
          today: 2,
          thisWeek: 8,
          thisMonth: 15
        },
        users: {
          totalCustomers: 45,
          totalMechanics: 12,
          activeMechanics: 8
        },
        recentActivity: [
          {
            id: 1,
            action: 'request_created',
            actionDescription: 'Service request created',
            userFullName: 'John Doe',
            timeAgo: '2m ago',
            createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            details: { requestId: 'REQ-001' }
          },
          {
            id: 2,
            action: 'request_accepted',
            actionDescription: 'Request accepted by mechanic',
            userFullName: 'Mike Smith',
            timeAgo: '15m ago',
            createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            details: { requestId: 'REQ-002' }
          }
        ]
      }
    };
  }

  // Mock service requests data
  getMockServiceRequests(params = {}) {
    const { page = 1, limit = 10, status, serviceType, search } = params;
    
    let mockRequests = [
      {
        id: '1',
        requestId: 'REQ-001',
        status: 'PENDING',
        serviceType: 'ENGINE_REPAIR',
        vehicleType: 'CAR',
        address: '123 Main Street, Downtown',
        cost: 1500,
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        endUser: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+91-9876543210',
          email: 'john.doe@email.com'
        },
        mechanic: null
      },
      {
        id: '2',
        requestId: 'REQ-002',
        status: 'ACCEPTED',
        serviceType: 'TIRE_CHANGE',
        vehicleType: 'CAR',
        address: '456 Oak Avenue, Midtown',
        cost: 800,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        endUser: {
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+91-9876543211',
          email: 'jane.smith@email.com'
        },
        mechanic: {
          firstName: 'Mike',
          lastName: 'Johnson',
          phone: '+91-9876543212',
          email: 'mike.johnson@email.com'
        }
      },
      {
        id: '3',
        requestId: 'REQ-003',
        status: 'IN_PROGRESS',
        serviceType: 'BATTERY_JUMP',
        vehicleType: 'CAR',
        address: '789 Pine Road, Uptown',
        cost: 500,
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        endUser: {
          firstName: 'Bob',
          lastName: 'Wilson',
          phone: '+91-9876543213',
          email: 'bob.wilson@email.com'
        },
        mechanic: {
          firstName: 'Sarah',
          lastName: 'Davis',
          phone: '+91-9876543214',
          email: 'sarah.davis@email.com'
        }
      },
      {
        id: '4',
        requestId: 'REQ-004',
        status: 'COMPLETED',
        serviceType: 'TOWING',
        vehicleType: 'TRUCK',
        address: '321 Elm Street, Suburb',
        cost: 2000,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        endUser: {
          firstName: 'Alice',
          lastName: 'Brown',
          phone: '+91-9876543215',
          email: 'alice.brown@email.com'
        },
        mechanic: {
          firstName: 'Tom',
          lastName: 'Anderson',
          phone: '+91-9876543216',
          email: 'tom.anderson@email.com'
        }
      },
      {
        id: '5',
        requestId: 'REQ-005',
        status: 'REJECTED',
        serviceType: 'FUEL_DELIVERY',
        vehicleType: 'MOTORCYCLE',
        address: '654 Maple Drive, City Center',
        cost: 300,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        endUser: {
          firstName: 'Charlie',
          lastName: 'Taylor',
          phone: '+91-9876543217',
          email: 'charlie.taylor@email.com'
        },
        mechanic: null
      }
    ];

    // Apply filters
    if (status) {
      mockRequests = mockRequests.filter(req => req.status === status);
    }
    if (serviceType) {
      mockRequests = mockRequests.filter(req => req.serviceType === serviceType);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      mockRequests = mockRequests.filter(req => 
        req.requestId.toLowerCase().includes(searchLower) ||
        req.endUser.firstName.toLowerCase().includes(searchLower) ||
        req.endUser.lastName.toLowerCase().includes(searchLower) ||
        req.address.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const total = mockRequests.length;
    const start = (page - 1) * limit;
    const paginatedRequests = mockRequests.slice(start, start + limit);

    return {
      success: true,
      data: {
        serviceRequests: paginatedRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        },
        stats: this.getMockDashboardStats().data.requests,
        filters: {
          status: status || null,
          serviceType: serviceType || null,
          search: search || null
        }
      }
    };
  }

  // Mock audit logs data
  getMockAuditLogs(params = {}) {
    const { page = 1, limit = 20 } = params;
    
    const mockLogs = [
      {
        id: 1,
        action: 'request_created',
        actionDescription: 'Service request created',
        userFullName: 'John Doe',
        timeAgo: '2m ago',
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        details: {
          requestId: 'REQ-001',
          serviceType: 'ENGINE_REPAIR',
          method: 'POST',
          ip: '192.168.1.100'
        },
        user: {
          firstName: 'John',
          lastName: 'Doe',
          role: 'END_USER'
        }
      },
      {
        id: 2,
        action: 'request_accepted',
        actionDescription: 'Request accepted by mechanic',
        userFullName: 'Mike Johnson',
        timeAgo: '15m ago',
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        details: {
          requestId: 'REQ-002',
          method: 'PATCH',
          ip: '192.168.1.101'
        },
        user: {
          firstName: 'Mike',
          lastName: 'Johnson',
          role: 'MECHANIC'
        }
      },
      {
        id: 3,
        action: 'login',
        actionDescription: 'User logged in',
        userFullName: 'Admin User',
        timeAgo: '30m ago',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        details: {
          method: 'POST',
          ip: '192.168.1.1'
        },
        user: {
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN'
        }
      }
    ];

    // Apply pagination
    const total = mockLogs.length;
    const start = (page - 1) * limit;
    const paginatedLogs = mockLogs.slice(start, start + limit);

    return {
      success: true,
      data: {
        activityLogs: paginatedLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  }

  // ============== CORE REQUEST HANDLING ==============

  getHeaders(includeAuth = true) {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const headers = {};
    
    // Only set Content-Type for non-FormData requests
    if (includeAuth && token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Check if this is an admin bypass request
  isAdminBypass() {
    const token = localStorage.getItem('accessToken');
    const isAdmin = localStorage.getItem('isAdmin');
    return token === 'ADMIN_BYPASS_TOKEN' && isAdmin === 'true';
  }

  async handleResponse(response) {
    console.log('API Response status:', response.status);
    console.log('API Response headers:', response.headers.get('content-type'));
    
    // Handle different content types
    let data;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType.includes('blob') || contentType.includes('octet-stream')) {
      // Handle file downloads
      return await response.blob();
    } else {
      // Handle non-JSON responses (plain text, HTML, etc.)
      const textResponse = await response.text();
      console.log('Non-JSON response:', textResponse);
      
      // Create standardized response format
      if (response.ok) {
        data = { 
          success: true, 
          message: textResponse || 'Operation completed successfully',
          data: textResponse 
        };
      } else {
        data = { 
          success: false, 
          message: textResponse || `HTTP error! status: ${response.status}` 
        };
      }
    }

    console.log('API Response data:', data);

    // Handle authentication errors
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    
    // Handle authorization errors
    if (response.status === 403) {
      // Special handling for email verification errors
      if (data.message && data.message.includes('verify your email')) {
        console.log('API - Detected email verification error');
        return {
          success: false,
          requiresVerification: true,
          message: data.message,
          data: data
        };
      }
      
      // Handle role-related errors
      if (data.message && data.message.includes('role')) {
        console.log('API - Detected role-related error');
        return {
          success: false,
          requiresRoleSelection: true,
          message: data.message,
          data: data
        };
      }
      
      throw new Error(data.message || 'Access denied');
    }
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  }

  async request(endpoint, options = {}) {
    // Check if this is an admin bypass request
    if (this.isAdminBypass()) {
      console.log('🔒 Admin bypass detected for endpoint:', endpoint);
      return this.handleAdminBypass(endpoint, options);
    }

    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    const config = {
      credentials: 'include',
      headers: {
        // Only set Content-Type for non-FormData requests
        ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle token refresh if needed
      if (response.status === 401 && token) {
        const refreshResult = await this.refreshToken();
        if (refreshResult) {
          // Retry the original request with new token
          config.headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
          const retryResponse = await fetch(url, config);
          return await this.handleResponse(retryResponse);
        } else {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
      }
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Handle admin bypass requests with mock data
  async handleAdminBypass(endpoint, options = {}) {
    console.log('🔒 Handling admin bypass for:', endpoint, options);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));

    // Route to appropriate mock data
    if (endpoint.includes('/admin/dashboard/stats')) {
      return this.getMockDashboardStats();
    }
    
    if (endpoint.includes('/admin/service-requests') && !endpoint.includes('/audit-logs')) {
      // Extract query parameters
      const urlParts = endpoint.split('?');
      const params = {};
      if (urlParts[1]) {
        const searchParams = new URLSearchParams(urlParts[1]);
        for (const [key, value] of searchParams) {
          params[key] = value;
        }
      }
      return this.getMockServiceRequests(params);
    }
    
    if (endpoint.includes('/admin/audit-logs')) {
      // Extract query parameters
      const urlParts = endpoint.split('?');
      const params = {};
      if (urlParts[1]) {
        const searchParams = new URLSearchParams(urlParts[1]);
        for (const [key, value] of searchParams) {
          params[key] = value;
        }
      }
      return this.getMockAuditLogs(params);
    }

    // Default response for unhandled admin endpoints
    return {
      success: true,
      message: 'Admin bypass - endpoint not implemented',
      data: {}
    };
  }

  async refreshToken() {
    // Skip refresh for admin bypass
    if (this.isAdminBypass()) {
      return true;
    }

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      const data = await this.handleResponse(response);
      
      if (response.ok && data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // ============== HTTP METHODS ==============

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ============== ADMIN METHODS ==============

  // Dashboard and Analytics
  async getDashboardStats() {
    try {
      return await this.get('/admin/dashboard/stats');
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Service Request Management (Admin View)
  async getAllServiceRequests(params = {}) {
    const { page = 1, limit = 10, status, serviceType, vehicleType, search, sortBy, sortOrder, mechanic, customer } = params;
    const queryParams = new URLSearchParams();
    
    // Add pagination
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    // Add filters
    if (status) queryParams.append('status', status);
    if (serviceType) queryParams.append('serviceType', serviceType);
    if (vehicleType) queryParams.append('vehicleType', vehicleType);
    if (search) queryParams.append('search', search);
    if (sortBy) queryParams.append('sortBy', sortBy);
    if (sortOrder) queryParams.append('sortOrder', sortOrder);
    if (mechanic) queryParams.append('mechanic', mechanic);
    if (customer) queryParams.append('customer', customer);

    try {
      return await this.get(`/admin/service-requests?${queryParams}`);
    } catch (error) {
      console.error('Error fetching service requests:', error);
      throw error;
    }
  }

  async getServiceRequestDetails(requestId) {
    try {
      return await this.get(`/admin/service-requests/${requestId}`);
    } catch (error) {
      console.error('Error fetching service request details:', error);
      throw error;
    }
  }

  // Audit Logs
  async getAuditLogs(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination
      queryParams.append('page', (params.page || 1).toString());
      queryParams.append('limit', (params.limit || 20).toString());
      
      // Add filters
      if (params.requestId) queryParams.append('requestId', params.requestId);
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.action) queryParams.append('action', params.action);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      return await this.get(`/admin/audit-logs?${queryParams}`);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  async getServiceRequestAuditLogs(requestId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', (params.page || 1).toString());
      queryParams.append('limit', (params.limit || 20).toString());

      return await this.get(`/admin/service-requests/${requestId}/audit-logs?${queryParams}`);
    } catch (error) {
      console.error('Error fetching service request audit logs:', error);
      throw error;
    }
  }

  // ============== AUTHENTICATION METHODS ==============

  async selectRole(role) {
    try {
      const response = await this.post('/auth/select-role', { role });
      
      if (response.success) {
        console.log('Role selected successfully:', role);
      }
      
      return response;
    } catch (error) {
      console.error('Error selecting role:', error);
      throw error;
    }
  }

  async getUserProfile() {
    try {
      return await this.get('/auth/profile');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // ============== SERVICE REQUEST METHODS (Customer) ==============

  async createServiceRequest(formData) {
    try {
      // Validate required fields
      this.validateServiceRequestData(formData);
      const formDataToSend = new FormData();
      
      // Append form fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('serviceType', formData.serviceType);
      formDataToSend.append('issue', formData.issue || '');
      
      // Vehicle details
      if (formData.vehicleType) formDataToSend.append('vehicleType', formData.vehicleType);
      if (formData.vehicleNumber) formDataToSend.append('vehicleNumber', formData.vehicleNumber);
      if (formData.vehicleMake) formDataToSend.append('vehicleMake', formData.vehicleMake);
      if (formData.vehicleModel) formDataToSend.append('vehicleModel', formData.vehicleModel);
      
      // Append location data
      if (formData.location) {
        formDataToSend.append('latitude', formData.location.lat);
        formDataToSend.append('longitude', formData.location.lng);
        formDataToSend.append('address', formData.location.address || 'Location address');
      }

      // Customer notes
      if (formData.customerNotes) {
        formDataToSend.append('customerNotes', formData.customerNotes);
      }
      
      // Handle image uploads
      if (formData.image) {
        this.validateImageFile(formData.image);
        formDataToSend.append('images', formData.image);
      }

      // Handle multiple images
      if (formData.images && Array.isArray(formData.images)) {
        formData.images.forEach((image, index) => {
          this.validateImageFile(image, index + 1);
          formDataToSend.append('images', image);
        });
      }

      return this.request('/service-requests', {
        method: 'POST',
        body: formDataToSend
      });
    } catch (error) {
      console.error('Error creating service request:', error);
      throw error;
    }
  }

  async getUserServiceRequests(params = {}) {
    const { page = 1, limit = 10, status } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });
    return this.get(`/service-requests?${queryParams}`);
  }

  async getServiceRequestById(id) {
    return this.get(`/service-requests/${id}`);
  }

  async updateServiceRequestStatus(id, statusData) {
    return this.patch(`/service-requests/${id}/status`, statusData);
  }

  async cancelServiceRequest(id, data = {}) {
    return this.patch(`/service-requests/${id}/cancel`, data);
  }

  // ============== MECHANIC METHODS ==============

  async getAvailableServiceRequests(params = {}) {
    const { page = 1, limit = 20, serviceType, vehicleType, maxDistance = 50 } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      maxDistance: maxDistance.toString(),
      ...(serviceType && { serviceType }),
      ...(vehicleType && { vehicleType })
    });
    return this.get(`/mechanic/service-requests/available?${queryParams}`);
  }

  async getMechanicServiceRequests(params = {}) {
    const { page = 1, limit = 10, status, serviceType, vehicleType, maxDistance } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(serviceType && { serviceType }),
      ...(vehicleType && { vehicleType }),
      ...(maxDistance && { maxDistance: maxDistance.toString() })
    });
    return this.get(`/mechanic/service-requests?${queryParams}`);
  }

  async getMechanicServiceRequestDetails(id) {
    return this.get(`/mechanic/service-requests/${id}`);
  }

  async acceptServiceRequest(requestId) {
    return this.post(`/mechanic/service-requests/${requestId}/accept`, {});
  }

  async rejectServiceRequest(requestId, data = {}) {
    return this.post(`/mechanic/service-requests/${requestId}/reject`, data);
  }

  async updateMechanicServiceRequestStatus(id, statusData) {
    return this.patch(`/mechanic/service-requests/${id}/status`, statusData);
  }

  async updateMechanicLocation(locationData) {
    return this.patch('/mechanic/location', locationData);
  }

  async updateMechanicAvailability(availability) {
    return this.patch('/mechanic/availability', { availability });
  }

  async getMechanicProfile() {
    return this.get('/mechanic/profile');
  }

  async updateMechanicProfile(profileData) {
    return this.put('/mechanic/profile', profileData);
  }

  // ============== UTILITY METHODS ==============

  validateServiceRequestData(formData) {
    const errors = [];
    
    if (!formData.name?.trim()) {
      errors.push('Name is required');
    }
    if (!formData.description?.trim()) {
      errors.push('Description is required');
    }
    if (!formData.serviceType) {
      errors.push('Service type is required');
    }
    if (!formData.location) {
      errors.push('Location is required');
    } else {
      const { lat, lng } = formData.location;
      
      if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
        errors.push('Invalid coordinates provided');
      }
      
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        errors.push('Invalid coordinates range');
      }
    }
    
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  validateImageFile(image, index = null) {
    const prefix = index ? `Image ${index}: ` : '';
    
    // Validate file size (5MB limit)
    if (image.size > 5 * 1024 * 1024) {
      throw new Error(`${prefix}${ERROR_MESSAGES.FILE_TOO_LARGE || 'File too large'}`);
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      throw new Error(`${prefix}${ERROR_MESSAGES.INVALID_FILE_TYPE || 'Invalid file type'}`);
    }
  }

  validateUserRole(requiredRoles = []) {
    const userRole = this.getUserRoleFromToken();
    
    if (!userRole) {
      throw new Error('User role not found. Please log in again.');
    }
    
    if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
      throw new Error('You do not have permission to perform this action.');
    }
    
    return true;
  }

  getUserRoleFromToken() {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch (error) {
      console.error('Error decoding token:', error);  
      return null;
    }
  }

  getUserIdFromToken() {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id || null;
    } catch (error) {
      console.error('Error decoding token:', error);  
      return null;
    }
  }

  isAuthenticated() {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  clearAuth() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
  }
}

// Create a singleton instance
const apiService = new ApiService();

// Export both default and named exports for compatibility
export default apiService;
export { apiService as api };