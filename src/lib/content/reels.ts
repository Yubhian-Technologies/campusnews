/**
 * Demo reels (short vertical videos) for the public site. Static sample data —
 * there is no reels backend yet, so these are hard-coded placeholders using
 * open sample video clips. Swap for a Firestore-backed collection later.
 */
export interface Reel {
  id: string;
  title: string;
  thumbnail: string;
  /** Display date, e.g. "12 Aug". */
  date: string;
  videoUrl: string;
}

function thumb(seed: string): string {
  return `https://picsum.photos/seed/${seed}/600/900`;
}

const SAMPLE = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample";

export const DEMO_REELS: Reel[] = [
  {
    id: "campus-fest-60s",
    title: "Campus Fest 2026 in 60 seconds",
    thumbnail: thumb("reel-fest"),
    date: "12 Aug",
    videoUrl: `${SAMPLE}/ForBiggerBlazes.mp4`,
  },
  {
    id: "robotics-team",
    title: "Meet the robotics team behind the new lab",
    thumbnail: thumb("reel-robotics"),
    date: "11 Aug",
    videoUrl: `${SAMPLE}/ForBiggerFun.mp4`,
  },
  {
    id: "cricket-final-over",
    title: "The winning over: inter-college cricket final",
    thumbnail: thumb("reel-cricket"),
    date: "10 Aug",
    videoUrl: `${SAMPLE}/ForBiggerJoyrides.mp4`,
  },
  {
    id: "cultural-night",
    title: "Cultural Night: the best moments",
    thumbnail: thumb("reel-culture"),
    date: "9 Aug",
    videoUrl: `${SAMPLE}/ForBiggerMeltdowns.mp4`,
  },
  {
    id: "hostel-day",
    title: "A day in the life: hostel edition",
    thumbnail: thumb("reel-hostel"),
    date: "8 Aug",
    videoUrl: `${SAMPLE}/ForBiggerEscapes.mp4`,
  },
  {
    id: "library-tour",
    title: "Inside the new 24/7 library wing",
    thumbnail: thumb("reel-library"),
    date: "7 Aug",
    videoUrl: `${SAMPLE}/WeAreGoingOnBullrun.mp4`,
  },
];

export function getReel(id: string): Reel | null {
  return DEMO_REELS.find((r) => r.id === id) ?? null;
}
