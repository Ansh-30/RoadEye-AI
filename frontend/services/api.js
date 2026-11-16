
import axios from 'axios';

const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, '');

const API_BASE_URL = /\/api$/i.test(normalizedApiUrl)
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;

export const AI_BASE_URL = (
  process.env.NEXT_PUBLIC_AI_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const aiApi = axios.create({
  baseURL: AI_BASE_URL,
});

// Attach JWT token to authenticated requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('roadeye_token');

    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.delete('Authorization');
    }
  }

  // Let the browser set the multipart Content-Type boundary
  if (
    typeof FormData !== 'undefined' &&
    config.data instanceof FormData
  ) {
    config.headers.delete('Content-Type');
  }

  return config;
});

// Handle API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    const isAuthenticationRequest =
      /\/auth\/(login|register)\/?$/.test(url);

    const serverMessage = error.response?.data?.message;

    if (serverMessage) {
      error.message = serverMessage;
    } else if (!error.response) {
      error.message =
        'Unable to reach the RoadEye backend. Check that it is running and NEXT_PUBLIC_API_URL is correct.';
    }

    if (
      status === 401 &&
      !isAuthenticationRequest &&
      typeof window !== 'undefined'
    ) {
      window.dispatchEvent(new Event('roadeye:unauthorized'));
    }

    return Promise.reject(error);
  }
);

// Authentication APIs
export function registerUser(userData) {
  return api.post('/auth/register', userData);
}

export function loginUser(credentials) {
  return api.post('/auth/login', credentials);
}

// User APIs
export function getUserProfile() {
  return api.get('/users/profile');
}

// Detection API
export function detectImage(imageFile, location = null) {
  const formData = new FormData();
  formData.append('image', imageFile);

  if (
    Number.isFinite(location?.latitude) &&
    Number.isFinite(location?.longitude)
  ) {
    formData.append('latitude', String(location.latitude));
    formData.append('longitude', String(location.longitude));
  }

  if (typeof location?.address === 'string' && location.address.trim()) {
    formData.append('locationAddress', location.address.trim());
  }

  return api.post('/detection/image', formData);
}

// Reports APIs
export function getReports() {
  return api.get('/reports');
}

export function getNearbyReports(latitude, longitude) {
  return api.get('/reports/nearby', {
    params: { latitude, longitude }
  });
}

export function updateReportStatus(reportId, status) {
  const encodedReportId = encodeURIComponent(reportId);

  return api.patch(`/reports/${encodedReportId}/status`, { status });
}

export function getPendingDuplicateReviews() {
  return api.get('/reports/admin/duplicate-reviews');
}

export function submitDuplicateReview(reportAId, reportBId, decision) {
  return api.post('/reports/admin/duplicate-reviews', {
    reportAId,
    reportBId,
    decision
  });
}

export function getDuplicateReviewHistory() {
  return api.get('/reports/admin/duplicate-reviews/history');
}

// Error handling helper
export function getApiErrorMessage(
  error,
  fallback = 'The request could not be completed.'
) {
  return error.response?.data?.message || error.message || fallback;
}

export default api;
