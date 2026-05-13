import { getCommunityFeed } from "@/services/postApi";
import { getPlaces } from "@/services/placeApi";

export async function getAdminOverview() {
  const [places, posts] = await Promise.all([getPlaces(), getCommunityFeed("latest")]);
  return { places, posts };
}
