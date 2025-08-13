import { z } from 'zod';
import { VALIDATION } from '../constants';

// ==============================================================================
// BASE SCHEMAS
// ==============================================================================

export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// ==============================================================================
// USER SCHEMAS
// ==============================================================================

export const userProfileSchema = z.object({
  bio: z.string().max(VALIDATION.BIO_MAX_LENGTH).optional(),
  website: z.string().url().optional(),
  location: z.string().max(100).optional(),
  phoneNumber: z.string().regex(VALIDATION.PHONE_REGEX).optional(),
  timezone: z.string().default('UTC'),
  language: z.string().default('en'),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
});

export const userRegistrationSchema = z.object({
  email: z.string().email().max(VALIDATION.EMAIL_MAX_LENGTH),
  password: z.string()
    .min(VALIDATION.PASSWORD_MIN_LENGTH)
    .max(VALIDATION.PASSWORD_MAX_LENGTH),
  firstName: z.string().min(1).max(VALIDATION.NAME_MAX_LENGTH),
  lastName: z.string().min(1).max(VALIDATION.NAME_MAX_LENGTH),
  acceptTerms: z.boolean().refine(val => val, {
    message: 'You must accept the terms and conditions',
  }),
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false),
});

export const passwordResetSchema = z.object({
  email: z.string().email(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(VALIDATION.PASSWORD_MIN_LENGTH)
    .max(VALIDATION.PASSWORD_MAX_LENGTH),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ==============================================================================
// EVENT SCHEMAS
// ==============================================================================

export const eventLocationSchema = z.object({
  type: z.enum(['physical', 'virtual', 'hybrid']),
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  virtualUrl: z.string().url().optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});

export const eventTierSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  currency: z.string().length(3),
  capacity: z.number().min(1),
  isActive: z.boolean().default(true),
  saleStartDate: z.string().datetime().optional(),
  saleEndDate: z.string().datetime().optional(),
});

export const eventWaveSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  capacity: z.number().min(1),
  isActive: z.boolean().default(true),
  tiers: z.array(z.string().uuid()),
});

export const eventSettingsSchema = z.object({
  allowWaitlist: z.boolean().default(true),
  requireApproval: z.boolean().default(false),
  collectAdditionalInfo: z.boolean().default(false),
  additionalFields: z.array(z.object({
    id: z.string(),
    name: z.string(),
    label: z.string(),
    type: z.enum(['text', 'email', 'number', 'select', 'multiselect', 'textarea', 'checkbox', 'radio', 'date', 'file']),
    required: z.boolean(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    options: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })).optional(),
  })).default([]),
  emailReminders: z.boolean().default(true),
  reminderSchedule: z.array(z.number()).default([24, 1]), // hours before event
  socialSharing: z.boolean().default(true),
  analytics: z.boolean().default(true),
});

const baseEventSchema = z.object({
  title: z.string().min(1).max(VALIDATION.TITLE_MAX_LENGTH),
  description: z.string().min(1).max(VALIDATION.DESCRIPTION_MAX_LENGTH),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  timezone: z.string(),
  location: eventLocationSchema,
  visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
  capacity: z.number().min(1),
  tags: z.array(z.string()).default([]),
  featuredImage: z.string().url().optional(),
  tiers: z.array(eventTierSchema).min(1),
  waves: z.array(eventWaveSchema).default([]),
  settings: eventSettingsSchema.default({}),
});

export const createEventSchema = baseEventSchema.refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updateEventSchema = baseEventSchema.partial();

// ==============================================================================
// REGISTRATION SCHEMAS
// ==============================================================================

export const eventRegistrationSchema = z.object({
  tierId: z.string().uuid(),
  waveId: z.string().uuid().optional(),
  additionalInfo: z.record(z.any()).optional(),
});

// ==============================================================================
// NOTIFICATION SCHEMAS
// ==============================================================================

export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  eventReminders: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  weeklyDigest: z.boolean().default(true),
});

// ==============================================================================
// SEARCH AND FILTER SCHEMAS
// ==============================================================================

export const eventFilterSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.enum(['draft', 'published', 'active', 'completed', 'cancelled'])).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
});

export const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

// ==============================================================================
// FILE UPLOAD SCHEMAS
// ==============================================================================

export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['image', 'document']),
}).refine(data => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (data.type === 'image') {
    return allowedImageTypes.includes(data.file.type);
  }
  
  if (data.type === 'document') {
    return allowedDocumentTypes.includes(data.file.type);
  }
  
  return false;
}, {
  message: 'Invalid file type',
}).refine(data => data.file.size <= 10 * 1024 * 1024, {
  message: 'File size must be less than 10MB',
});

// ==============================================================================
// CONTACT SCHEMAS
// ==============================================================================

export const contactFormSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(2000),
});

// ==============================================================================
// ANALYTICS SCHEMAS
// ==============================================================================

export const analyticsDateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// ==============================================================================
// WEBHOOK SCHEMAS
// ==============================================================================

export const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(['event.created', 'event.updated', 'registration.created', 'registration.cancelled', 'payment.completed'])),
  secret: z.string().min(32),
  isActive: z.boolean().default(true),
});

// ==============================================================================
// EXPORT TYPES FROM SCHEMAS
// ==============================================================================

export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type PasswordChange = z.infer<typeof passwordChangeSchema>;
export type CreateEvent = z.infer<typeof createEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type EventRegistration = z.infer<typeof eventRegistrationSchema>;
export type EventFilter = z.infer<typeof eventFilterSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type ContactForm = z.infer<typeof contactFormSchema>;
export type AnalyticsDateRange = z.infer<typeof analyticsDateRangeSchema>;
export type Webhook = z.infer<typeof webhookSchema>;
