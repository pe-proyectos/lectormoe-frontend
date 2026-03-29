/**
 * Get the organization-aware path
 * If we're in an organization context (e.g., /senshimanga), prepend the slug
 * Otherwise, use the path as-is
 */
export function getOrgPath(path: string, organizationSlug?: string | null): string {
  // If no organization slug, return path as-is
  if (!organizationSlug) {
    return path;
  }

  // Remove leading slash from path
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Check if we're in /red/ NSFW context
  const isNsfwContext = typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/red/');
  const prefix = isNsfwContext ? `/red/${organizationSlug}` : `/${organizationSlug}`;

  // If path is empty, return just the prefix
  if (!cleanPath) {
    return prefix;
  }

  // Construct path with organization slug (and /red/ prefix if needed)
  return `${prefix}/${cleanPath}`;
}

/**
 * Get the current organization slug from the pathname
 */
export function getOrgSlugFromPath(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0] || '';
  
  // Reserved routes that are not organization slugs
  const reservedRoutes = [
    'admin',
    'logout',
    '404',
    '500',
    'forgot',
    'search',
    'scans',
    'subscriptions',
    'organizations',
    'manga',
    'profile',
  ];

  // Handle /red/{slug}/... — return the actual org slug (second segment)
  if (firstSegment === 'red' && pathSegments.length > 1) {
    const secondSegment = pathSegments[1];
    if (secondSegment && !reservedRoutes.includes(secondSegment)) {
      return secondSegment;
    }
    return null;
  }

  // If first segment is a reserved route, no organization
  if (reservedRoutes.includes(firstSegment)) {
    return null;
  }

  // If path is just "/" or empty, no organization
  if (!firstSegment) {
    return null;
  }

  return firstSegment;
}

