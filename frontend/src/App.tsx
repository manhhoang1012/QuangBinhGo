import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";
import { RootLayout } from "@/layouts/RootLayout";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AdminCategoriesPage } from "@/pages/AdminCategoriesPage";
import { AdminCommentsPage } from "@/pages/AdminCommentsPage";
import { AdminPlacesPage } from "@/pages/AdminPlacesPage";
import { AdminPostsPage } from "@/pages/AdminPostsPage";
import { AdminReviewsPage } from "@/pages/AdminReviewsPage";
import { AdminSettingsPage } from "@/pages/AdminSettingsPage";
import { AdminUsersPage } from "@/pages/AdminUsersPage";
import { AiHubPage } from "@/pages/AiHubPage";
import { AiItineraryPage } from "@/pages/AiItineraryPage";
import { AiChatPage } from "@/pages/AiChatPage";
import { AiContentToolsPage } from "@/pages/AiContentToolsPage";
import { AiRecommendationsPage } from "@/pages/AiRecommendationsPage";
import { AiSearchPage } from "@/pages/AiSearchPage";
import { CommunityFeedPage } from "@/pages/CommunityFeedPage";
import { CreatePostPage } from "@/pages/CreatePostPage";
import { HomePage } from "@/pages/HomePage";
import { ItinerariesPage } from "@/pages/ItinerariesPage";
import { ItineraryDetailPage } from "@/pages/ItineraryDetailPage";
import { ItineraryEditPage } from "@/pages/ItineraryEditPage";
import { LoginRegisterPage } from "@/pages/LoginRegisterPage";
import { MapPage } from "@/pages/MapPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { MyPostsPage } from "@/pages/MyPostsPage";
import { MyReviewsPage } from "@/pages/MyReviewsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { OAuthCallbackPage } from "@/pages/OAuthCallbackPage";
import { PlaceDetailPage } from "@/pages/PlaceDetailPage";
import { PlacesListPage } from "@/pages/PlacesListPage";
import { PostDetailPage } from "@/pages/PostDetailPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { PublicProfilePage } from "@/pages/PublicProfilePage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { SavedPostsPage } from "@/pages/SavedPostsPage";
import { SocialFilteredFeedPage } from "@/pages/SocialFilteredFeedPage";
import { VerifyEmailPage } from "@/pages/VerifyEmailPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "places",
        element: <PlacesListPage />,
      },
      {
        path: "map",
        element: <MapPage />,
      },
      {
        path: "places/map",
        element: <MapPage />,
      },
      {
        path: "places/:placeId",
        element: <PlaceDetailPage />,
      },
      {
        path: "community",
        element: <CommunityFeedPage />,
      },
      {
        path: "community/new",
        element: <CreatePostPage />,
      },
      {
        path: "community/:postId",
        element: <PostDetailPage />,
      },
      {
        path: "community/hashtag/:tag",
        element: <SocialFilteredFeedPage mode="hashtag" />,
      },
      {
        path: "community/place/:placeId",
        element: <SocialFilteredFeedPage mode="place" />,
      },
      {
        path: "community/saved",
        element: <SavedPostsPage />,
      },
      {
        path: "community/following",
        element: <CommunityFeedPage initialFeedType="following" />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "profile/edit",
        element: <ProfilePage />,
      },
      {
        path: "profile/change-password",
        element: <ProfilePage />,
      },
      {
        path: "u/:username",
        element: <PublicProfilePage />,
      },
      {
        path: "users/:username",
        element: <PublicProfilePage />,
      },
      {
        path: "u/:username/posts",
        element: <PublicProfilePage />,
      },
      {
        path: "saved",
        element: <SavedPostsPage />,
      },
      {
        path: "saved-posts",
        element: <SavedPostsPage />,
      },
      {
        path: "my-posts",
        element: <MyPostsPage />,
      },
      {
        path: "my-reviews",
        element: <MyReviewsPage />,
      },
      {
        path: "ai",
        element: <AiHubPage />,
      },
      {
        path: "ai/search",
        element: <AiSearchPage />,
      },
      {
        path: "ai/recommendations",
        element: <AiRecommendationsPage />,
      },
      {
        path: "ai/chat",
        element: <AiChatPage />,
      },
      {
        path: "ai/chatbot",
        element: <AiChatPage />,
      },
      {
        path: "ai/tools",
        element: <AiContentToolsPage />,
      },
      {
        path: "ai/content-tools",
        element: <AiContentToolsPage />,
      },
      {
        path: "ai/itinerary",
        element: <AiItineraryPage />,
      },
      {
        path: "ai-itinerary",
        element: <AiItineraryPage />,
      },
      {
        path: "itineraries",
        element: <ItinerariesPage />,
      },
      {
        path: "itineraries/new",
        element: <ItineraryEditPage />,
      },
      {
        path: "itineraries/:id",
        element: <ItineraryDetailPage />,
      },
      {
        path: "itineraries/:id/edit",
        element: <ItineraryEditPage />,
      },
      {
        path: "itineraries/shared/:shareSlug",
        element: <ItineraryDetailPage shared />,
      },
      {
        path: "login",
        element: <LoginRegisterPage />,
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "reset-password",
        element: <ResetPasswordPage />,
      },
      {
        path: "verify-email",
        element: <VerifyEmailPage />,
      },
      {
        path: "oauth/callback",
        element: <OAuthCallbackPage />,
      },
      {
        path: "admin",
        element: (
          <ProtectedAdminRoute allowedRoles={["admin"]}>
            <AdminDashboardPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <ProtectedAdminRoute allowedRoles={["admin"]}>
            <AdminUsersPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/places",
        element: (
          <ProtectedAdminRoute allowedRoles={["admin"]}>
            <AdminPlacesPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/posts",
        element: (
          <ProtectedAdminRoute allowedRoles={["moderator", "admin"]}>
            <AdminPostsPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/comments",
        element: (
          <ProtectedAdminRoute allowedRoles={["moderator", "admin"]}>
            <AdminCommentsPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/reviews",
        element: (
          <ProtectedAdminRoute allowedRoles={["moderator", "admin"]}>
            <AdminReviewsPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/categories",
        element: (
          <ProtectedAdminRoute allowedRoles={["admin"]}>
            <AdminCategoriesPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/settings",
        element: (
          <ProtectedAdminRoute allowedRoles={["admin"]}>
            <AdminSettingsPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
