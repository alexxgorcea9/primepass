import apiClient, { API_BASE_URL } from './axios';
import axios from 'axios';

// Types for posts
export interface Post {
  id: number;
  title: string;
  text: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  text: string;
  image?: File;
}

export interface UpdatePostData {
  title?: string;
  text?: string;
  image?: File | null;
}

// Posts API
export const postsApi = {
  // Get all posts for an event
  getPosts: async (eventId: number): Promise<Post[]> => {
    try {
      const response = await apiClient.get(`/events/${eventId}/posts/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  // Get single post
  getPost: async (eventId: number, postId: number): Promise<Post> => {
    try {
      const response = await apiClient.get(`/events/${eventId}/posts/${postId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  // Create post
  createPost: async (eventId: number, data: CreatePostData): Promise<Post> => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('text', data.text);
      if (data.image) {
        formData.append('image', data.image);
      }

      // Don't set Content-Type - let axios handle multipart/form-data with boundary
      const response = await apiClient.post(`/events/${eventId}/posts/`, formData);
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Update post
  updatePost: async (
    eventId: number,
    postId: number,
    data: UpdatePostData
  ): Promise<Post> => {
    try {
      const formData = new FormData();
      if (data.title !== undefined) formData.append('title', data.title);
      if (data.text !== undefined) formData.append('text', data.text);
      if (data.image !== undefined) {
        if (data.image === null) {
          formData.append('image', '');
        } else {
          formData.append('image', data.image);
        }
      }

      // Don't set Content-Type - let axios handle multipart/form-data with boundary
      const response = await apiClient.patch(`/events/${eventId}/posts/${postId}/`, formData);
      return response.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  // Delete post
  deletePost: async (eventId: number, postId: number): Promise<void> => {
    try {
      await apiClient.delete(`/events/${eventId}/posts/${postId}/`);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },
};