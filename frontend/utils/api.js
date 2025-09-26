// API utility for handling different environments
const getApiBaseUrl = () => {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If accessing via IP address, use the same IP for API
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3002`;
    }
    // For localhost, always use localhost
    return 'http://localhost:3002';
  }
  // Default to environment variable or localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
};

const API_BASE_URL = getApiBaseUrl();

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`🔗 Making API call to: ${url}`);
  console.log(`🌐 Current hostname: ${typeof window !== 'undefined' ? window.location.hostname : 'server-side'}`);
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log(`✅ API call successful: ${response.status} ${response.statusText}`);
    return response;
  } catch (error) {
    console.error(`❌ API call failed for ${endpoint}:`, error);
    console.error(`🔍 Full URL attempted: ${url}`);
    throw error;
  }
};

export const getApiUrl = (path = '') => {
  return `${API_BASE_URL}${path}`;
};

export default API_BASE_URL;