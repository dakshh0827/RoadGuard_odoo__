// src/services/api.js - UPDATED WITH MECHANIC METHODS
import { 
  API_BASE_URL, 
  SERVICE_REQUEST_ENDPOINTS, 
  ERROR_MESSAGES 
} from '../utils/constants';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    
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
      const data = await response.json();
      
      console.log('API Response status:', response.status);
      console.log('API Response data:', data);
      
      // Handle token refresh if needed
      if (response.status === 401 && token) {
        const refreshResult = await this.refreshToken();
        if (refreshResult) {
          // Retry the original request with new token
          config.headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
          const retryResponse = await fetch(url, config);
          const retryData = await retryResponse.json();
          
          if (!retryResponse.ok) {
            throw new Error(retryData.message || `HTTP error! status: ${retryResponse.status}`);
          }
          return retryData;
        } else {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
      }

      // Special handling for email verification errors (403 status)
      if (response.status === 403 && data.message && data.message.includes('verify your email')) {
        console.log('API - Detected email verification error, returning special response');
        return {
          success: false,
          requiresVerification: true,
          message: data.message,
          data: data
        };
      }

      // Handle role-related errors
      if (response.status === 403 && data.message && data.message.includes('role')) {
        console.log('API - Detected role-related error');
        return {
          success: false,
          requiresRoleSelection: true,
          message: data.message,
          data: data
        };
      }

      if (!response.ok) {
        console.log('API - Throwing error for status:', response.status);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async refreshToken() {
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

      const data = await response.json();
      
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

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // AUTH-RELATED METHODS
  
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
      const response = await this.get('/auth/profile');
      return response;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateUserRole(userId, role) {
    try {
      const response = await this.patch(`/admin/users/${userId}/role`, { role });
      return response;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // SERVICE REQUEST METHODS (Role-based access)
  
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
      
      // Append location data
      if (formData.location) {
        formDataToSend.append('latitude', formData.location.lat);
        formDataToSend.append('longitude', formData.location.lng);
        formDataToSend.append('address', formData.location.address || 'Location address');
      }
      
      // Append image if present
      if (formData.image) {
        // Validate file size (5MB limit)
        if (formData.image.size > 5 * 1024 * 1024) {
          throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE);
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(formData.image.type)) {
          throw new Error(ERROR_MESSAGES.INVALID_FILE_TYPE);
        }
        
        formDataToSend.append('images', formData.image);
      }

      return this.request(SERVICE_REQUEST_ENDPOINTS.CREATE, {
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

    return this.get(`${SERVICE_REQUEST_ENDPOINTS.GET_USER_REQUESTS}?${queryParams}`);
  }

  async getServiceRequestById(id) {
    return this.get(`${SERVICE_REQUEST_ENDPOINTS.GET_BY_ID}/${id}`);
  }

  async updateServiceRequestStatus(id, statusData) {
    return this.request(`${SERVICE_REQUEST_ENDPOINTS.UPDATE_STATUS}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData)
    });
  }

  async cancelServiceRequest(id) {
    return this.request(`${SERVICE_REQUEST_ENDPOINTS.CANCEL}/${id}/cancel`, {
      method: 'PATCH'
    });
  }

  // MECHANIC-SPECIFIC METHODS
  
  async getAvailableServiceRequests(params = {}) {
    const { page = 1, limit = 10, status = 'PENDING', serviceType, vehicleType, maxDistance = 50 } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
      maxDistance: maxDistance.toString(),
      ...(serviceType && { serviceType }),
      ...(vehicleType && { vehicleType })
    });

    return this.get(`/mechanic/service-requests/available?${queryParams}`);
  }

  async getMechanicServiceRequests(params = {}) {
    const { page = 1, limit = 10, status } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });

    return this.get(`/mechanic/service-requests?${queryParams}`);
  }

  async getMechanicServiceRequestDetails(id) {
    return this.get(`/mechanic/service-requests/${id}`);
  }

  async acceptServiceRequest(requestId) {
    return this.post(`/mechanic/service-requests/${requestId}/accept`, {});
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

  // ADMIN-SPECIFIC METHODS
  
  async getAllUsers(params = {}) {
    const { page = 1, limit = 20, role, search } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(role && { role }),
      ...(search && { search })
    });

    return this.get(`/admin/users?${queryParams}`);
  }

  async getAllServiceRequests(params = {}) {
    const { page = 1, limit = 20, status, mechanic, customer } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(mechanic && { mechanic }),
      ...(customer && { customer })
    });

    return this.get(`/admin/service-requests?${queryParams}`);
  }

  async getSystemAnalytics() {
    return this.get('/admin/analytics');
  }

  async updateUserStatus(userId, status) {
    return this.patch(`/admin/users/${userId}/status`, { status });
  }

  async deleteUser(userId) {
    return this.delete(`/admin/users/${userId}`);
  }

  // Helper method to validate service request data
  validateServiceRequestData(formData) {
    const errors = [];

    if (!formData.name?.trim()) {
      errors.push(ERROR_MESSAGES.REQUIRED_FIELD('name'));
    }

    if (!formData.description?.trim()) {
      errors.push(ERROR_MESSAGES.REQUIRED_FIELD('description'));
    }

    if (!formData.serviceType) {
      errors.push(ERROR_MESSAGES.REQUIRED_FIELD('service type'));
    }

    if (!formData.location) {
      errors.push(ERROR_MESSAGES.LOCATION_REQUIRED);
    } else {
      const { lat, lng } = formData.location;
      
      if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
        errors.push(ERROR_MESSAGES.INVALID_COORDINATES);
      }
      
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        errors.push(ERROR_MESSAGES.INVALID_COORDINATES);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  // Helper method to check if user has required role for API call
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

  // Helper method to extract user role from token (if stored in JWT)
  getUserRoleFromToken() {
    const token = localStorage.getItem('accessToken');
    
    if (!token) return null;

    try {
      // Decode JWT token to get role (if role is stored in token)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch (error) {
      console.error('Error decoding token:', error);  
      return null;
    }
  }
}

// Create a singleton instance
const apiService = new ApiService();

// Export both default and named exports
export default apiService;
export { apiService as api };
