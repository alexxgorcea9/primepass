// ==============================================================================
// API CONSTANTS
// ==============================================================================

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login/',
    LOGOUT: '/api/v1/auth/logout/',
    REGISTER: '/api/v1/auth/register/',
    REFRESH: '/api/v1/auth/token/refresh/',
    VERIFY: '/api/v1/auth/token/verify/',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password/',
    RESET_PASSWORD: '/api/v1/auth/reset-password/',
    PROFILE: '/api/v1/auth/profile/',
  },
  EVENTS: {
    LIST: '/api/v1/events/',
    CREATE: '/api/v1/events/',
    DETAIL: (id: string) => `/api/v1/events/${id}/`,
    UPDATE: (id: string) => `/api/v1/events/${id}/`,
    DELETE: (id: string) => `/api/v1/events/${id}/`,
    REGISTER: (id: string) => `/api/v1/events/${id}/register/`,
    UNREGISTER: (id: string) => `/api/v1/events/${id}/unregister/`,
    CHECKIN: (id: string) => `/api/v1/events/${id}/checkin/`,
    ANALYTICS: (id: string) => `/api/v1/events/${id}/analytics/`,
  },
  NOTIFICATIONS: {
    LIST: '/api/v1/notifications/',
    MARK_READ: (id: string) => `/api/v1/notifications/${id}/mark-read/`,
    MARK_ALL_READ: '/api/v1/notifications/mark-all-read/',
    PREFERENCES: '/api/v1/notifications/preferences/',
  },
  ANALYTICS: {
    DASHBOARD: '/api/v1/analytics/dashboard/',
    EVENTS: '/api/v1/analytics/events/',
    USERS: '/api/v1/analytics/users/',
    REVENUE: '/api/v1/analytics/revenue/',
  },
} as const;

// ==============================================================================
// EVENT CONSTANTS
// ==============================================================================

export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const EVENT_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  UNLISTED: 'unlisted',
} as const;

export const REGISTRATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  WAITLISTED: 'waitlisted',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// ==============================================================================
// NOTIFICATION CONSTANTS
// ==============================================================================

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

export const NOTIFICATION_CATEGORIES = {
  EVENT: 'event',
  REGISTRATION: 'registration',
  PAYMENT: 'payment',
  SYSTEM: 'system',
  MARKETING: 'marketing',
} as const;

// ==============================================================================
// USER CONSTANTS
// ==============================================================================

export const USER_ROLES = {
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
  ATTENDEE: 'attendee',
  STAFF: 'staff',
} as const;

// ==============================================================================
// FORM FIELD CONSTANTS
// ==============================================================================

export const FORM_FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  NUMBER: 'number',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  TEXTAREA: 'textarea',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  DATE: 'date',
  FILE: 'file',
} as const;

// ==============================================================================
// PAGINATION CONSTANTS
// ==============================================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

// ==============================================================================
// VALIDATION CONSTANTS
// ==============================================================================

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_MAX_LENGTH: 254,
  NAME_MAX_LENGTH: 150,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 5000,
  BIO_MAX_LENGTH: 500,
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  SLUG_REGEX: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

// ==============================================================================
// DATE/TIME CONSTANTS
// ==============================================================================

export const DATE_FORMATS = {
  ISO: 'yyyy-MM-dd',
  DATETIME: 'yyyy-MM-dd HH:mm:ss',
  DISPLAY: 'MMM d, yyyy',
  DISPLAY_WITH_TIME: 'MMM d, yyyy h:mm a',
  TIME: 'h:mm a',
} as const;

export const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
] as const;

// ==============================================================================
// CURRENCY CONSTANTS
// ==============================================================================

export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
} as const;

// ==============================================================================
// FILE UPLOAD CONSTANTS
// ==============================================================================

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// ==============================================================================
// WEBSOCKET CONSTANTS
// ==============================================================================

export const WEBSOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  EVENT_UPDATE: 'event_update',
  NOTIFICATION: 'notification',
  REGISTRATION_UPDATE: 'registration_update',
  CHECKIN_UPDATE: 'checkin_update',
} as const;

// ==============================================================================
// CACHE KEYS
// ==============================================================================

export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  EVENT_DETAIL: (eventId: string) => `event:detail:${eventId}`,
  EVENT_ANALYTICS: (eventId: string) => `event:analytics:${eventId}`,
  USER_EVENTS: (userId: string) => `user:events:${userId}`,
  NOTIFICATIONS: (userId: string) => `notifications:${userId}`,
} as const;

// ==============================================================================
// ERROR CODES
// ==============================================================================

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

// ==============================================================================
// FEATURE FLAGS
// ==============================================================================

export const FEATURE_FLAGS = {
  ANALYTICS_ENABLED: 'analytics_enabled',
  SOCIAL_LOGIN_ENABLED: 'social_login_enabled',
  PAYMENT_ENABLED: 'payment_enabled',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  WAITLIST_ENABLED: 'waitlist_enabled',
} as const;
