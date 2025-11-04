import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi, type Post, type CreatePostData, type UpdatePostData } from '@/api/posts';

// Query keys factory for better cache management
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (eventId: number) => [...postKeys.lists(), eventId] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (eventId: number, postId: number) =>
    [...postKeys.details(), eventId, postId] as const,
};

// Hook for fetching all posts of an event
export const usePosts = (eventId: number) => {
  return useQuery<Post[]>({
    queryKey: postKeys.list(eventId),
    queryFn: () => postsApi.getPosts(eventId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

// Hook for fetching a single post
export const usePost = (eventId: number, postId: number) => {
  return useQuery<Post>({
    queryKey: postKeys.detail(eventId, postId),
    queryFn: () => postsApi.getPost(eventId, postId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

// Hook for creating a post
export const useCreatePost = (eventId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostData) => postsApi.createPost(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.list(eventId) });
    },
    onError: (error: any) => {
      console.error('Create post error:', error);
    },
  });
};

// Hook for updating a post
export const useUpdatePost = (eventId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: number; data: UpdatePostData }) =>
      postsApi.updatePost(eventId, postId, data),
    onSuccess: (_, variables) => {
      // Invalidate both the list and the specific post detail
      queryClient.invalidateQueries({ queryKey: postKeys.list(eventId) });
      queryClient.invalidateQueries({
        queryKey: postKeys.detail(eventId, variables.postId)
      });
    },
    onError: (error: any) => {
      console.error('Update post error:', error);
    },
  });
};

// Hook for deleting a post
export const useDeletePost = (eventId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => postsApi.deletePost(eventId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.list(eventId) });
    },
    onError: (error: any) => {
      console.error('Delete post error:', error);
    },
  });
};