import apiClient from "./axios";

export interface Ticket {
  id: number;
  ticketCode: string;
  status: string;
  createdAt: string;

  event: number;
  eventTitle: string;
  eventShortDescription: string | null;
  eventLocation: string;
  eventDate: string;   // ISO date
  eventTime: string;   // "HH:MM:SS"

  heroImageUrl: string;

  organizerName: string;
  organizerProfilePicture: string;

  tier: number;
  tierName: string;

  perks: {
    id: number;
    title: string;
    description: string | null;
  }[];

  availableAddOns: {
    id: number;
    title: string;
    description: string | null;
    price: string;   // coming from DecimalField
  }[];

  purchasedAddOns: {
    id: number;
    title: string;
    description: string | null;
    price: string;
  }[];
}



export interface PaginatedTicketsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Ticket[];
}

export const ticketsApi = {
  // Get ALL tickets for the currently authenticated guest user
  getMyTickets: async (): Promise<Ticket[]> => {
    try {
      // apiClient has baseURL="/api", so this hits: /api/guest/tickets/
      const response = await apiClient.get("/guest/tickets/");

      const data = response.data;

      if (Array.isArray(data)) {
        return data as Ticket[];
      }
      if (data && Array.isArray(data.results)) {
        return data.results as Ticket[];
      }

      console.warn("Unexpected tickets response shape:", data);
      return [];
    } catch (error) {
      console.error("Error fetching tickets:", error);
      throw error;
    }
  },
};
