// server/src/middlewares/validation.js
export const validateServiceRequest = (req, res, next) => {
  const { 
    name, 
    description, 
    serviceType, 
    latitude, 
    longitude, 
    address 
  } = req.body;

  const errors = [];

  // Required fields validation
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!description || description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (!serviceType) {
    errors.push('Service type is required');
  }

  if (!latitude || isNaN(parseFloat(latitude))) {
    errors.push('Valid latitude is required');
  }

  if (!longitude || isNaN(parseFloat(longitude))) {
    errors.push('Valid longitude is required');
  }

  if (!address || address.trim().length === 0) {
    errors.push('Address is required');
  }

  // Validate coordinates range
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (lat < -90 || lat > 90) {
    errors.push('Latitude must be between -90 and 90');
  }
  
  if (lng < -180 || lng > 180) {
    errors.push('Longitude must be between -180 and 180');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};
