import apiClient from './axios';

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: number;
  email: string;
  name: string;
  profilePicture: string | null;
  role: 'guest' | 'organizer' | 'team';
}

export interface SpecialRequestMessage {
  id: number;
  sender: User;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialRequest {
  id: number;
  guest: User;
  eventId: number;
  eventTitle: string;
  tierId: number;
  tierName: string;
  title: string;
  description: string;
  status: 'pending' | 'resolved';
  assignedTo: User | null;
  messages: SpecialRequestMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SpecialRequestListItem {
  id: number;
  guest: User;
  eventTitle: string;
  tierName: string;
  title: string;
  description: string;
  status: 'pending' | 'resolved';
  assignedTo: User | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CreateSpecialRequestData {
  eventId: number;
  tierId: number;
  title: string;
  description: string;
}

export interface UpdateSpecialRequestData {
  status?: 'pending' | 'resolved';
  assignedToId?: number | null;
}

export interface SendMessageData {
  message: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const conciergeApi = {
  // List special requests with filters
  listRequests: async (
    page = 1,
    pageSize = 20,
    filters?:
      | { status?: 'pending' | 'in_progress' | 'resolved'; eventId?: number }
      | undefined
  ): Promise<PaginatedResponse<SpecialRequestListItem>> => {
    try {
      const params: any = {
        page,
        page_size: pageSize,
      };

      if (filters?.status) {
        params.status = filters.status;
      }

      if (filters?.eventId) {
        params.event_id = filters.eventId;
      }

      const response = await apiClient.get('/concierge/special-requests/', {
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching special requests:', error);
      throw error;
    }
  },

  // Get single special request detail
  getRequestDetail: async (requestId: number): Promise<SpecialRequest> => {
    try {
      const response = await apiClient.get(
        `/concierge/special-requests/${requestId}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching special request detail:', error);
      throw error;
    }
  },

  // Create new special request (guests only)
  createRequest: async (
    data: CreateSpecialRequestData
  ): Promise<SpecialRequest> => {
    try {
      const response = await apiClient.post(
        '/concierge/special-requests/',
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error creating special request:', error);
      throw error;
    }
  },

  // Update special request (status/assignment)
  updateRequest: async (
    requestId: number,
    data: UpdateSpecialRequestData
  ): Promise<SpecialRequest> => {
    try {
      const response = await apiClient.patch(
        `/concierge/special-requests/${requestId}/`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error updating special request:', error);
      throw error;
    }
  },

  // Delete special request
  deleteRequest: async (requestId: number): Promise<void> => {
    try {
      await apiClient.delete(`/concierge/special-requests/${requestId}/`);
    } catch (error) {
      console.error('Error deleting special request:', error);
      throw error;
    }
  },

  // Get current guest's special requests
  getMyRequests: async (): Promise<SpecialRequestListItem[]> => {
    try {
      const response = await apiClient.get(
        '/concierge/special-requests/my-requests/'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching my special requests:', error);
      throw error;
    }
  },

  // Get special requests for a specific event (organizer/team only)
  getEventRequests: async (
    eventId: number
  ): Promise<SpecialRequestListItem[]> => {
    try {
      const response = await apiClient.get(
        `/concierge/special-requests/event/${eventId}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching event special requests:', error);
      throw error;
    }
  },

  // Send message in a special request
  sendMessage: async (
    requestId: number,
    data: SendMessageData
  ): Promise<SpecialRequestMessage> => {
    try {
      const response = await apiClient.post(
        `/concierge/special-requests/${requestId}/messages/`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // List all accessible messages
  listMessages: async (
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<SpecialRequestMessage>> => {
    try {
      const response = await apiClient.get('/concierge/messages/', {
        params: {
          page,
          page_size: pageSize,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Get single message detail
  getMessageDetail: async (
    messageId: number
  ): Promise<SpecialRequestMessage> => {
    try {
      const response = await apiClient.get(`/concierge/messages/${messageId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching message detail:', error);
      throw error;
    }
  },
};