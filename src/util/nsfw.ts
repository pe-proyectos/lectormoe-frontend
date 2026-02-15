const NSFW_VERIFIED_KEY = 'nsfw_age_verified';

export function isNSFWContent(manga: any): boolean {
  return manga?.isNSFW === true || manga?.organization?.isNSFW === true;
}

export function hasAgeVerification(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(NSFW_VERIFIED_KEY) === 'true';
}

export function setAgeVerification(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NSFW_VERIFIED_KEY, 'true');
}
