import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  conciergeApi,
  type SpecialRequest,
  type SpecialRequestListItem,
  type SpecialRequestMessage,
  type PaginatedResponse,
  type CreateSpecialRequestData,
  type UpdateSpecialRequestData,
  type SendMessageData,
} from '@/api/concierge';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const conciergeKeys = {
  all: ['concierge'] as const,
  requests: () => [...conciergeKeys.all, 'requests'] as const,
  requestsList: (filters?: {
    page?: number;
    pageSize?: number;
    status?: 'pending' | 'in_progress' | 'resolved';
    eventId?: number;
  }) => [...conciergeKeys.requests(), 'list', filters] as const,
  requestDetail: (requestId: number) => [...conciergeKeys.requests(), 'detail', requestId] as const,
  myRequests: () => [...conciergeKeys.requests(), 'my-requests'] as const,
  eventRequests: (eventId: number) => [...conciergeKeys.requests(), 'event', eventId] as const,
  messages: () => [...conciergeKeys.all, 'messages'] as const,
  messagesList: (page?: number, pageSize?: number) => 
    [...conciergeKeys.messages(), 'list', page, pageSize] as const,
  messageDetail: (messageId: number) => [...conciergeKeys.messages(), 'detail', messageId] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook for listing special requests with optional filters
 */
export const useSpecialRequests = (
  page = 1,
  pageSize = 20,
  filters?: {
    status?: 'pending' | 'in_progress' | 'resolved';
    eventId?: number;
  }
) => {
  return useQuery<PaginatedResponse<SpecialRequestListItem>>({
    queryKey: conciergeKeys.requestsList({ page, pageSize, ...filters }),
    queryFn: () => conciergeApi.listRequests(page, pageSize, filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

/**
 * Hook for fetching a single special request detail
 */
export const useSpecialRequestDetail = (requestId: number, enabled = true) => {
  return useQuery<SpecialRequest>({
    queryKey: conciergeKeys.requestDetail(requestId),
    queryFn: () => conciergeApi.getRequestDetail(requestId),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes (shorter since messages update frequently)
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook for fetching current guest's special requests
 */
export const useMySpecialRequests = () => {
  return useQuery<SpecialRequestListItem[]>({
    queryKey: conciergeKeys.myRequests(),
    queryFn: () => conciergeApi.getMyRequests(),
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

/**
 * Hook for fetching special requests for a specific event
 * Only accessible by organizers and team members
 */
export const useEventSpecialRequests = (eventId: number, enabled = true) => {
  return useQuery<SpecialRequestListItem[]>({
    queryKey: conciergeKeys.eventRequests(eventId),
    queryFn: () => conciergeApi.getEventRequests(eventId),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

/**
 * Hook for listing messages
 */
export const useMessages = (page = 1, pageSize = 50) => {
  return useQuery<PaginatedResponse<SpecialRequestMessage>>({
    queryKey: conciergeKeys.messagesList(page, pageSize),
    queryFn: () => conciergeApi.listMessages(page, pageSize),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook for fetching a single message detail
 */
export const useMessageDetail = (messageId: number, enabled = true) => {
  return useQuery<SpecialRequestMessage>({
    queryKey: conciergeKeys.messageDetail(messageId),
    queryFn: () => conciergeApi.getMessageDetail(messageId),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook for creating a new special request
 */
export const useCreateSpecialRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSpecialRequestData) => conciergeApi.createRequest(data),
    onSuccess: () => {
      // Invalidate all request lists to refetch
      queryClient.invalidateQueries({ queryKey: conciergeKeys.requests() });
    },
  });
};

/**
 * Hook for updating a special request
 */
export const useUpdateSpecialRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: number; data: UpdateSpecialRequestData }) =>
      conciergeApi.updateRequest(requestId, data),
    onSuccess: (updatedRequest) => {
      // Invalidate the specific request detail
      queryClient.invalidateQueries({ 
        queryKey: conciergeKeys.requestDetail(updatedRequest.id) 
      });
      
      // Invalidate all request lists
      queryClient.invalidateQueries({ queryKey: conciergeKeys.requests() });
    },
  });
};

/**
 * Hook for deleting a special request
 */
export const useDeleteSpecialRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: number) => conciergeApi.deleteRequest(requestId),
    onSuccess: (_, requestId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: conciergeKeys.requestDetail(requestId) });
      
      // Invalidate all request lists
      queryClient.invalidateQueries({ queryKey: conciergeKeys.requests() });
    },
  });
};

/**
 * Hook for sending a message in a special request
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: number; data: SendMessageData }) =>
      conciergeApi.sendMessage(requestId, data),
    onSuccess: (_, { requestId }) => {
      // Invalidate the request detail to show new message
      queryClient.invalidateQueries({ 
        queryKey: conciergeKeys.requestDetail(requestId) 
      });
      
      // Invalidate messages list
      queryClient.invalidateQueries({ queryKey: conciergeKeys.messages() });
    },
  });
};