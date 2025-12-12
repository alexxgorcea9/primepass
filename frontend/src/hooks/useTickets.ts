import { useQuery } from "@tanstack/react-query";
import { ticketsApi, type Ticket } from "@/api/tickets";

export const ticketKeys = {
  all: ["tickets"] as const,
  mine: () => [...ticketKeys.all, "mine"] as const,
};

export const useMyTickets = () => {
  return useQuery<Ticket[]>({
    queryKey: ticketKeys.mine(),
    queryFn: async () => {
      const data = await ticketsApi.getMyTickets();
      console.log("TICKETS API RESPONSE:", data);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: true,
  });
};
