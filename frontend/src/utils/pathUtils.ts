/**
 * Converts a name to a URL-safe slug
 * @param name - The name to convert to a slug
 * @returns A URL-safe slug
 */
export const createSlugFromName = (name: string): string => {
  if (!name || name.trim() === '') {
    return '';
  }

  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Gets the redirect path based on user role and name
 * @param role - The user's role
 * @param name - The user's name
 * @returns The redirect path
 */
export const getRedirectPath = (role: string, name: string): string => {
  const slug = createSlugFromName(name);
  const normalizedRole = role.toLowerCase();

  if (normalizedRole === 'organizer') {
    return `/${slug}/dashboard`;
  } else if (normalizedRole === 'team') {
    return `/${slug}/home`;
  }
  
  return '/events'; // Default for guest
};
