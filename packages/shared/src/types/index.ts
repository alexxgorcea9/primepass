// ==============================================================================
// CORE TYPES
// ==============================================================================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// ==============================================================================
// USER TYPES
// ==============================================================================

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  isStaff: boolean;
  dateJoined: string;
  lastLogin?: string;
  profile: UserProfile;
}

export interface UserProfile extends BaseEntity {
  user: string;
  bio?: string;
  website?: string;
  location?: string;
  phoneNumber?: string;
  timezone: string;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export type UserRole = 'admin' | 'organizer' | 'attendee' | 'staff';

// ==============================================================================
// EVENT TYPES
// ==============================================================================

export interface Event extends BaseEntity {
  title: string;
  description: string;
  slug: string;
  organizer: User;
  startDate: string;
  endDate: string;
  timezone: string;
  location: EventLocation;
  status: EventStatus;
  visibility: EventVisibility;
  capacity: number;
  registeredCount: number;
  waitlistCount: number;
  tags: string[];
  featuredImage?: string;
  gallery: string[];
  tiers: EventTier[];
  waves: EventWave[];
  settings: EventSettings;
}

export interface EventLocation {
  type: 'physical' | 'virtual' | 'hybrid';
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  virtualUrl?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type EventStatus = 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
export type EventVisibility = 'public' | 'private' | 'unlisted';

export interface EventTier extends BaseEntity {
  event: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  capacity: number;
  soldCount: number;
  isActive: boolean;
  saleStartDate?: string;
  saleEndDate?: string;
  privileges: TierPrivilege[];
}

export interface TierPrivilege {
  id: string;
  name: string;
  description?: string;
  type: 'access' | 'perk' | 'discount';
}

export interface EventWave extends BaseEntity {
  event: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  capacity: number;
  registeredCount: number;
  isActive: boolean;
  tiers: string[];
}

export interface EventSettings {
  allowWaitlist: boolean;
  requireApproval: boolean;
  collectAdditionalInfo: boolean;
  additionalFields: FormField[];
  emailReminders: boolean;
  reminderSchedule: number[];
  socialSharing: boolean;
  analytics: boolean;
}

// ==============================================================================
// REGISTRATION TYPES
// ==============================================================================

export interface Registration extends BaseEntity {
  event: string;
  user: string;
  tier: string;
  wave?: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  checkedIn: boolean;
  checkedInAt?: string;
  additionalInfo?: Record<string, any>;
  qrCode: string;
}

export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlisted' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// ==============================================================================
// NOTIFICATION TYPES
// ==============================================================================

export interface Notification extends BaseEntity {
  recipient: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  isRead: boolean;
  readAt?: string;
  data?: Record<string, any>;
  actionUrl?: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 'event' | 'registration' | 'payment' | 'system' | 'marketing';

// ==============================================================================
// FORM TYPES
// ==============================================================================

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
}

export type FormFieldType = 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file';

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

// ==============================================================================
// ANALYTICS TYPES
// ==============================================================================

export interface EventAnalytics {
  eventId: string;
  views: number;
  registrations: number;
  conversions: number;
  revenue: number;
  refunds: number;
  checkIns: number;
  demographics: Demographics;
  timeSeriesData: TimeSeriesData[];
  topReferrers: Referrer[];
}

export interface Demographics {
  ageGroups: Record<string, number>;
  genders: Record<string, number>;
  locations: Record<string, number>;
  registrationSources: Record<string, number>;
}

export interface TimeSeriesData {
  date: string;
  views: number;
  registrations: number;
  revenue: number;
}

export interface Referrer {
  source: string;
  count: number;
  conversions: number;
}

// ==============================================================================
// WEBSOCKET TYPES
// ==============================================================================

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

export interface WebSocketEventUpdate {
  eventId: string;
  type: 'registration' | 'cancellation' | 'checkin' | 'update';
  data: any;
}

// ==============================================================================
// UTILITY TYPES
// ==============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
}[Keys];

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

// ==============================================================================
// ERROR TYPES
// ==============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}

export interface ValidationError extends ApiError {
  field: string;
  value: any;
}

// ==============================================================================
// FILTER AND SORT TYPES
// ==============================================================================

export interface FilterOptions {
  search?: string;
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}
