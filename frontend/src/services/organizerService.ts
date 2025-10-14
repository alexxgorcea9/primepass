import { api } from './api';

export interface Organizer {
  id: number;
  user_id: number;
  organization_name?: string;
  phone?: string;
  bio?: string;
  created_at?: string;
}

/**
 * Service to handle organizer-related API calls
 */
const organizerService = {
  /**
   * Fetch organizer by user ID using the dedicated API endpoint
   * @param userId - The ID of the user who is an organizer
   * @returns Promise with organizer data
   */
  getOrganizerByUserId: async (userId: number): Promise<Organizer | null> => {
    try {
      console.log(
        `Attempting to fetch organizer data for user ID: ${userId || 'unknown'}`
      );

      // Use the dedicated endpoint we created in the backend
      const endpoint = `/api/organizers/user/${userId}/`;
      console.log('Fetching organizer data from endpoint:', endpoint);

      const response = await api.get(endpoint);

      if (response && response.data) {
        console.log('✅ Found organizer data:', response.data);

        // Ensure the organizer has a valid ID
        if (!response.data.id) {
          console.error(
            'Retrieved organizer does not have a valid ID:',
            response.data
          );
          return null;
        }

        return response.data;
      }

      console.error('No organizer data found in response');
      return null;
    } catch (error) {
      console.error('❌ Error fetching organizer data:', error);
      return null;
    }
  },

  /**
   * Store organizer data in session storage and localStorage for cross-browser compatibility
   * @param organizer - The organizer data to store
   */
  storeOrganizerInSession: (organizer: Organizer): void => {
    if (!organizer || typeof organizer.id === 'undefined') {
      console.error('Cannot store invalid organizer data in storage');
      return;
    }

    // Convert to JSON string once to avoid multiple stringify operations
    const organizerJson = JSON.stringify(organizer);

    // Try sessionStorage first (primary storage)
    let sessionStorageSuccess = false;
    try {
      sessionStorage.setItem('organizer_data', organizerJson);
      sessionStorageSuccess = true;
      console.log('Organizer data stored in session storage:', organizer);
    } catch (error) {
      console.error('Error storing organizer data in sessionStorage:', error);
    }

    // Also try localStorage as a fallback (especially for Safari)
    try {
      localStorage.setItem('organizer_data', organizerJson);
      console.log(
        'Organizer data also stored in local storage for cross-browser compatibility'
      );
    } catch (error) {
      console.error('Error storing organizer data in localStorage:', error);

      // If both storage attempts failed, log a critical error
      if (!sessionStorageSuccess) {
        console.error(
          'CRITICAL: Failed to store organizer data in any storage mechanism!'
        );
      }
    }
  },

  /**
   * Get organizer data from session storage or localStorage (for Safari compatibility)
   * @returns The organizer data or null if not found
   */
  getOrganizerFromSession: (): Organizer | null => {
    let organizerData: string | null = null;
    let source = 'none';

    // Try sessionStorage first
    try {
      organizerData = sessionStorage.getItem('organizer_data');
      if (organizerData) source = 'sessionStorage';
    } catch (sessionError) {
      console.warn('Error accessing sessionStorage:', sessionError);
    }

    // If not found in sessionStorage, try localStorage (Safari fallback)
    if (!organizerData) {
      try {
        organizerData = localStorage.getItem('organizer_data');
        if (organizerData) source = 'localStorage';
      } catch (localStorageError) {
        console.warn('Error accessing localStorage:', localStorageError);
      }
    }

    // If no data found in either storage, return null
    if (!organizerData) {
      return null;
    }

    // Try to parse the data
    try {
      const organizer = JSON.parse(organizerData) as Organizer;

      // Validate the parsed object has required fields
      if (!organizer || typeof organizer.id === 'undefined') {
        console.error(
          'Invalid organizer data found in ' + source + ':',
          organizer
        );
        return null;
      }

      console.log('Retrieved organizer data from ' + source + ':', organizer);
      return organizer;
    } catch (parseError) {
      console.error(
        'Error parsing organizer data from ' + source + ':',
        parseError,
        'Raw data:',
        organizerData
      );
      return null;
    }
  },
};

export default organizerService;
