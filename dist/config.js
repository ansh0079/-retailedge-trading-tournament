// API Configuration - automatically detects if running locally or on Render
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3002'
  : window.location.origin;

console.log('🌐 API Base URL:', API_BASE_URL);
