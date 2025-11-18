import apiClient from './axios';


// Types based on your Django serializer
export interface TeamMember {
  id: number;
  email: string;
  name: string;
  profilePicture: string | null;
  role: string;
}

export interface Event {
  id: number;
  organizer: {
    id: number;
  };
  organizerProfilePicture?: string;
  title: string;
  description?: string;
  shortDescription: string;
  location: string;
  heroImageUrl: string;
  date: string;
  time: string;
  isFinished: boolean;
  accessCode?: string;
  teamMembers?: TeamMember[];
  mediaCount: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API functions
export const eventsApi = {
  // Get upcoming events (not finished) - using query params on main endpoint
  getUpcoming: async (page = 1, pageSize = 20): Promise<PaginatedResponse<Event>> => {
    try {
      const response = await apiClient.get('/events/', {
        params: {
          page,
          page_size:pageSize,
          is_finished: false, // Filter for upcoming events
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  },

  // Get finished events - using query params on main endpoint
  getFinished: async (page = 1, pageSize = 20): Promise<PaginatedResponse<Event>> => {
    try {
      const response = await apiClient.get('/events/', {
        params: {
          page,
          page_size:pageSize,
          is_finished: true, // Filter for finished events
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching finished events:', error);
      throw error;
    }
  },

  // Get current user's events (requires authentication)
  getMyEvents: async (page = 1, pageSize = 20, isFinished?: boolean): Promise<PaginatedResponse<Event>> => {
    try {
      const params: any = { 
        page, 
        page_size: pageSize,
      };
      
      // Add is_finished filter if specified
      if (isFinished !== undefined) {
        params.is_finished = isFinished;
      }
      
      const response = await apiClient.get('/events/my_events/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching my events:', error);
      throw error;
    }
  },

  // Get single event detail
  getEventDetail: async (eventId: number): Promise<Event> => {
    try {
      const response = await apiClient.get(`/events/${eventId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event detail:', error);
      throw error;
    }
  },

  // Join event team with access code
  joinTeam: async (accessCode: string): Promise<{ message: string; event: Event }> => {
    try {
      const response = await apiClient.post('/events/join_team/', {
        accessCode,
      });
      return response.data;
    } catch (error) {
      console.error('Error joining team:', error);
      throw error;
    }
  },

  // Leave event team
  leaveTeam: async (eventId: number): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post(`/events/${eventId}/leave_team/`);
      return response.data;
    } catch (error) {
      console.error('Error leaving team:', error);
      throw error;
    }
  },

  // Get team members for an event
  getTeamMembers: async (eventId: number): Promise<TeamMember[]> => {
    try {
      const response = await apiClient.get(`/events/${eventId}/team_members/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  },

  // Get event media for an event
  getEventMedia: async (eventId: number): Promise<EventMedia[]> => {
    try {
      const response = await apiClient.get(`/events/${eventId}/media/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event media:', error);
      throw error;
    }
  },

  // Upload media (image/video) to an event
  uploadMedia: async (eventId: number, file: File, mediaType: 'image' | 'video', isFeatured = false): Promise<EventMedia> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', mediaType);
      formData.append('isFeatured', isFeatured.toString());
      
      const response = await apiClient.post(`/events/${eventId}/upload_media/`, formData);
      return response.data;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  },

  // Create event with all related data (bulk creation)
  // Supports multipart/form-data for image upload
  bulkCreate: async (eventData: BulkEventCreateData): Promise<any> => {
    try {
      const formData = new FormData();
      
      // Add basic event fields
      formData.append('title', eventData.title);
      if (eventData.description) formData.append('description', eventData.description);
      if (eventData.shortDescription) formData.append('shortDescription', eventData.shortDescription);
      formData.append('location', eventData.location);
      formData.append('date', eventData.date);
      formData.append('time', eventData.time);
      
      // Add hero image file if present
      if (eventData.heroImage) {
        formData.append('heroImage', eventData.heroImage);
      }
      
      // Add tiers as JSON string
      formData.append('tiers', JSON.stringify(eventData.tiers));
      
      // Add media as JSON string if present
      if (eventData.media && eventData.media.length > 0) {
        formData.append('media', JSON.stringify(eventData.media));
      }
      
      // Use apiClient - it handles auth cookies, CSRF tokens, and FormData automatically
      const response = await apiClient.post('/events/bulk_create/', formData);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },
};

// Type definitions for bulk event creation
export interface BulkEventCreateData {
  title: string;
  description?: string;
  shortDescription?: string;
  location: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM:SS format
  heroImage?: File; // Actual image file for upload
  tiers: TierData[];
  media?: MediaData[];
}

export interface TierData {
  name: string;
  icon?: string;
  gradientId: string;
  specialRequests?: boolean;
  waves: WaveData[];
  privileges: PrivilegeData[];
  addOns: AddOnData[];
  tables: TableData[];
}

export interface WaveData {
  name: string;
  ticketCount: number;
  price: number;
}

export interface PrivilegeData {
  name: string;
  description: string;
}

export interface AddOnData {
  name: string;
  description: string;
  price: number;
  availability: number | 'Unlimited';
}

export interface TableData {
  name: string;
  count: number;
  seats: number;
  minimumSpend: number;
}

export interface MediaData {
  url: string;
  type: 'image' | 'video';
  isFeatured?: boolean;
}

// EventMedia from backend
export interface EventMedia {
  id: number;
  mediaType: 'image' | 'video';
  file: string;
  isFeatured: boolean;
  uploadedAt: string;
}