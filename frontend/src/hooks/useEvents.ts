import { useQuery, useQueries } from '@tanstack/react-query';
import { eventsApi, type Event, type PaginatedResponse, type EventMedia, type Tier } from '@/api/events';

// Query keys factory for better cache management
export const eventKeys = {
  all: ['events'] as const,
  upcoming: () => [...eventKeys.all, 'upcoming'] as const,
  finished: () => [...eventKeys.all, 'finished'] as const,
  myEvents: () => [...eventKeys.all, 'my-events'] as const,
  detail: (eventId: number) => [...eventKeys.all, 'detail', eventId] as const,
  media: (eventId: number) => [...eventKeys.all, 'media', eventId] as const,
  tiers: (eventId: number) => [...eventKeys.all, 'tiers', eventId] as const,
  tierDetail: (eventId: number, tierId: number) => [...eventKeys.all, 'tier-detail', eventId, tierId] as const,
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

// Hook for fetching event details
export const useEventDetail = (eventId: number) => {
  return useQuery<Event>({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => eventsApi.getEventDetail(eventId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Hook for fetching event media
export const useEventMedia = (eventId: number, enabled = true) => {
  return useQuery<EventMedia[]>({
    queryKey: eventKeys.media(eventId),
    queryFn: () => eventsApi.getEventMedia(eventId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled, // Only fetch if enabled
  });
};

// Hook for fetching media for multiple events
export const useEventsMedia = (events: Event[] | undefined) => {
  return useQueries({
    queries: (events || []).map((event) => ({
      queryKey: eventKeys.media(event.id),
      queryFn: () => eventsApi.getEventMedia(event.id),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    })),
  });
};

// Hook for fetching event tiers
export const useEventTiers = (eventId: number, enabled = true) => {
  return useQuery<Tier[]>({
    queryKey: eventKeys.tiers(eventId),
    queryFn: () => eventsApi.getEventTiers(eventId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled, // Only fetch if enabled
  });
};

// Hook for fetching tier detail with waves
export const useTierDetail = (eventId: number, tierId: number, enabled = true) => {
  return useQuery<Tier>({
    queryKey: eventKeys.tierDetail(eventId, tierId),
    queryFn: () => eventsApi.getTierDetail(eventId, tierId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled, // Only fetch if enabled
  });
};