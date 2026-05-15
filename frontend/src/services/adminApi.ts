import { getCommunityFeed } from "@/services/postApi";
import { getPlaces } from "@/services/placeApi";
import { getAdminUsers } from "@/services/adminUserApi";

export async function getAdminOverview() {
  const [places, posts, users] = await Promise.all([
    getPlaces({ limit: 100 }),
    getCommunityFeed("latest"),
    getAdminUsers({}),
  ]);
  return { places, posts, users };
}
