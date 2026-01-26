// API Configuration
// Use same-origin in production so Render deploys keep working.
// Fallback to local proxy server for local development.
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3002'
  : window.location.origin;
