/**
 * Shared localStorage keys for device-local reader preferences (favourite
 * location/college, liked article/reel prefixes). Centralized so every
 * consumer (bottom nav, pickers, profile, home carousel, likes) stays in
 * sync — see useLocalStorage.ts for the read/write hook and prefix-clear
 * helper these are used with. AuthProvider.signOut() clears all of these so a
 * device starts clean after sign-out instead of carrying the previous
 * account's personalization forward.
 */
export const FAVOURITE_LOCATION_KEY = "campusnews:favouriteLocation";
export const FAVOURITE_COLLEGE_KEY = "campusnews:favouriteCollege";
export const LIKED_ARTICLE_PREFIX = "campusnews:liked:";
export const LIKED_REEL_PREFIX = "campusnews:reel-liked:";
