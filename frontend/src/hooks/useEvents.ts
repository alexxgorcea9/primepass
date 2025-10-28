import { useQuery } from '@tanstack/react-query';
import { eventsApi, type Event, type PaginatedResponse } from '@/api/events';

// Query keys factory for better cache management
export const eventKeys = {
  all: ['events'] as const,
  upcoming: () => [...eventKeys.all, 'upcoming'] as const,
  finished: () => [...eventKeys.all, 'finished'] as const,
  myEvents: () => [...eventKeys.all, 'my-events'] as const,
};

// Hook for upcoming events
export const useUpcomingEvents = (page = 1, pageSize = 20) => {
  return useQuery<PaginatedResponse<Event>>({
    queryKey: [...eventKeys.upcoming(), page, pageSize],
    queryFn: () => eventsApi.getUpcoming(page, pageSize),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes (formerly cacheTime)
  });
};

// Hook for finished/past events
export const useFinishedEvents = (page = 1, pageSize = 20) => {
  return useQuery<PaginatedResponse<Event>>({
    queryKey: [...eventKeys.finished(), page, pageSize],
    queryFn: () => eventsApi.getFinished(page, pageSize),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

// Hook for authenticated organizer's upcoming events
export const useMyUpcomingEvents = (page = 1, pageSize = 100) => {
  return useQuery<PaginatedResponse<Event>>({
    queryKey: [...eventKeys.myEvents(), 'upcoming', page, pageSize],
    queryFn: () => eventsApi.getMyEvents(page, pageSize, false),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: true, // Always refetch when component mounts
  });
};

// Hook for authenticated organizer's finished events
export const useMyFinishedEvents = (page = 1, pageSize = 100) => {
  return useQuery<PaginatedResponse<Event>>({
    queryKey: [...eventKeys.myEvents(), 'finished', page, pageSize],
    queryFn: () => eventsApi.getMyEvents(page, pageSize, true),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: true, // Always refetch when component mounts
  });
};