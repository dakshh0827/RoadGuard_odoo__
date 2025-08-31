// src/services/api.js - FULLY FIXED VERSION
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
      
      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers.get('content-type'));
      
      // FIXED: Check if response has JSON content before parsing
      let data;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses (plain text, HTML, etc.)
        const textResponse = await response.text();
        console.log('Non-JSON response:', textResponse);
        
        // Try to create a standardized response format
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
      
      // Handle token refresh if needed
      if (response.status === 401 && token) {
        const refreshResult = await this.refreshToken();
        if (refreshResult) {
          // Retry the original request with new token
          config.headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
          const retryResponse = await fetch(url, config);
          
          // Handle retry response the same way
          const retryContentType = retryResponse.headers.get('content-type') || '';
          let retryData;
          
          if (retryContentType.includes('application/json')) {
            retryData = await retryResponse.json();
          } else {
            const retryText = await retryResponse.text();
            retryData = retryResponse.ok 
              ? { success: true, message: retryText, data: retryText }
              : { success: false, message: retryText };
          }
          
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

      // FIXED: Handle refresh token response properly
      const contentType = response.headers.get('content-type') || '';
      let data;
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { success: false, message: text };
      }
      
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

  // SERVICE REQUEST METHODS (Customer)
  
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
      
      // Append images if present
      if (formData.image) {
        // Validate file size (5MB limit)
        if (formData.image.size > 5 * 1024 * 1024) {
          throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE || 'File too large');
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(formData.image.type)) {
          throw new Error(ERROR_MESSAGES.INVALID_FILE_TYPE || 'Invalid file type');
        }
        
        formDataToSend.append('images', formData.image);
      }

      // Handle multiple images
      if (formData.images && Array.isArray(formData.images)) {
        formData.images.forEach((image, index) => {
          if (image.size > 5 * 1024 * 1024) {
            throw new Error(`Image ${index + 1}: File too large`);
          }
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
    return this.request(`/service-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData)
    });
  }

  // FIXED: Cancel service request method
  async cancelServiceRequest(id, data = {}) {
    return this.request(`/service-requests/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // MECHANIC-SPECIFIC METHODS
  
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

  // FIXED: Reject service request method with proper data handling
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

  // UTILITY METHODS

  // Helper method to validate service request data
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

  // Get user ID from token
  getUserIdFromToken() {
    const token = localStorage.getItem('accessToken');
    
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id || null;
    } catch (error) {
      console.error('Error decoding token:', error);  
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Clear authentication data
  clearAuth() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

// Create a singleton instance
const apiService = new ApiService();

// Export both default and named exports for compatibility
export default apiService;
export { apiService as api };
