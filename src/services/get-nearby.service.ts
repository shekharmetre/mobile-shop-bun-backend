export function getPhotoUrlsFromPlace(place: any, apiKey: string, maxWidth = 800): string[] {
  if (!place?.photos || !Array.isArray(place.photos)) return [];

  return place.photos
    .filter((photo: any) => photo.photo_reference)
    .map((photo: any) => {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photo.photo_reference}&key=${apiKey}`;
    });
}

const DEFAULT_PLACE_IMAGE = "https://via.placeholder.com/800x600?text=No+Image";


export async function getNearbyMobileShopsget(lat: string, lng: string) {
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;
  const keyword = "mobile shop";
  const radius = 5000;

  // 1. First fetch the place details
  const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(
    keyword
  )}&key=${API_KEY}`;

  const placesRes = await fetch(placesUrl);
  if (!placesRes.ok) throw new Error("Failed to fetch nearby mobile shops");
  const placesData = await placesRes.json();

  // 2. Process each place to get photos
  const placesWithPhotos = await Promise.all(
    placesData.results.map(async (place: any) => {
      // Get the first photo URL if available
      const photoUrl = place.photos?.[0]?.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${place.photos[0].photo_reference}&key=${API_KEY}`
        : DEFAULT_PLACE_IMAGE;

      return {
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        rating: place.rating || "No rating",
        user_ratings_total: place.user_ratings_total || 0,
        open_now: place.opening_hours?.open_now ?? null,
        location: place.geometry?.location ?? { lat: null, lng: null },
        types: place.types || [],
        photo: photoUrl, // Single photo URL
        photos: getPhotoUrlsFromPlace(place, API_KEY), // Array of all photo URLs
        icon: place.icon,
        icon_background_color: place.icon_background_color,
        maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      };
    })
  );

  return placesWithPhotos;
}

export async function getNearbyMobileShops(
  lat?: string | number,
  lng?: string | number,
  radius?: string | number
) {
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;
  const keyword = "mobile shop";

  // Set default radius if not provided
  const searchRadius = radius ?? 5000;

  if (!lat || !lng) {
    throw new Error("Latitude and longitude are required");
  }

  // Convert lat, lng, radius to strings to be used in URL
  const latStr = String(lat);
  const lngStr = String(lng);
  const radiusStr = String(searchRadius);

  // 1. First fetch the place details
  const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latStr},${lngStr}&radius=${radiusStr}&keyword=${encodeURIComponent(
    keyword
  )}&key=${API_KEY}`;

  const placesRes = await fetch(placesUrl);
  if (!placesRes.ok) throw new Error("Failed to fetch nearby mobile shops");
  const placesData = await placesRes.json();

  // 2. Process each place to get photos
  const placesWithPhotos = await Promise.all(
    placesData.results.map(async (place: any) => {
      // Get the first photo URL if available
      const photoUrl = place.photos?.[0]?.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${place.photos[0].photo_reference}&key=${API_KEY}`
        : DEFAULT_PLACE_IMAGE;

      return {
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        rating: place.rating || "No rating",
        user_ratings_total: place.user_ratings_total || 0,
        open_now: place.opening_hours?.open_now ?? null,
        location: place.geometry?.location ?? { lat: null, lng: null },
        types: place.types || [],
        photo: photoUrl, // Single photo URL
        photos: getPhotoUrlsFromPlace(place, API_KEY), // Array of all photo URLs
        icon: place.icon,
        icon_background_color: place.icon_background_color,
        maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      };
    })
  );

  return placesWithPhotos;
}






