import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";
import { RootLayout } from "@/layouts/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { LoginRegisterPage } from "@/pages/LoginRegisterPage";

const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage").then((module) => ({ default: module.AdminDashboardPage })));
const AdminCategoriesPage = lazy(() => import("@/pages/AdminCategoriesPage").then((module) => ({ default: module.AdminCategoriesPage })));
const AdminAuditLogsPage = lazy(() => import("@/pages/AdminAuditLogsPage").then((module) => ({ default: module.AdminAuditLogsPage })));
const AdminAnalyticsPage = lazy(() => import("@/pages/AdminAnalyticsPage").then((module) => ({ default: module.AdminAnalyticsPage })));
const AdminCommentsPage = lazy(() => import("@/pages/AdminCommentsPage").then((module) => ({ default: module.AdminCommentsPage })));
const AdminPlacesPage = lazy(() => import("@/pages/AdminPlacesPage").then((module) => ({ default: module.AdminPlacesPage })));
const AdminPostsPage = lazy(() => import("@/pages/AdminPostsPage").then((module) => ({ default: module.AdminPostsPage })));
const AdminReportsPage = lazy(() => import("@/pages/AdminReportsPage").then((module) => ({ default: module.AdminReportsPage })));
const AdminReviewsPage = lazy(() => import("@/pages/AdminReviewsPage").then((module) => ({ default: module.AdminReviewsPage })));
const AdminSettingsPage = lazy(() => import("@/pages/AdminSettingsPage").then((module) => ({ default: module.AdminSettingsPage })));
const AdminUsersPage = lazy(() => import("@/pages/AdminUsersPage").then((module) => ({ default: module.AdminUsersPage })));
const AiHubPage = lazy(() => import("@/pages/AiHubPage").then((module) => ({ default: module.AiHubPage })));
const AiItineraryPage = lazy(() => import("@/pages/AiItineraryPage").then((module) => ({ default: module.AiItineraryPage })));
const AiChatPage = lazy(() => import("@/pages/AiChatPage").then((module) => ({ default: module.AiChatPage })));
const AiContentToolsPage = lazy(() => import("@/pages/AiContentToolsPage").then((module) => ({ default: module.AiContentToolsPage })));
const AiRecommendationsPage = lazy(() => import("@/pages/AiRecommendationsPage").then((module) => ({ default: module.AiRecommendationsPage })));
const AiSearchPage = lazy(() => import("@/pages/AiSearchPage").then((module) => ({ default: module.AiSearchPage })));
const CommunityFeedPage = lazy(() => import("@/pages/CommunityFeedPage").then((module) => ({ default: module.CommunityFeedPage })));
const CreatePostPage = lazy(() => import("@/pages/CreatePostPage").then((module) => ({ default: module.CreatePostPage })));
const ItinerariesPage = lazy(() => import("@/pages/ItinerariesPage").then((module) => ({ default: module.ItinerariesPage })));
const ItineraryDetailPage = lazy(() => import("@/pages/ItineraryDetailPage").then((module) => ({ default: module.ItineraryDetailPage })));
const ItineraryEditPage = lazy(() => import("@/pages/ItineraryEditPage").then((module) => ({ default: module.ItineraryEditPage })));
const MapPage = lazy(() => import("@/pages/MapPage").then((module) => ({ default: module.MapPage })));
const ModerationActionsPage = lazy(() => import("@/pages/ModerationActionsPage").then((module) => ({ default: module.ModerationActionsPage })));
const ModerationCommentsPage = lazy(() => import("@/pages/ModerationCommentsPage").then((module) => ({ default: module.ModerationCommentsPage })));
const ModerationDashboardPage = lazy(() => import("@/pages/ModerationDashboardPage").then((module) => ({ default: module.ModerationDashboardPage })));
const ModerationPostsPage = lazy(() => import("@/pages/ModerationPostsPage").then((module) => ({ default: module.ModerationPostsPage })));
const ModerationReportsPage = lazy(() => import("@/pages/ModerationReportsPage").then((module) => ({ default: module.ModerationReportsPage })));
const ModerationUserWarningsPage = lazy(() => import("@/pages/ModerationUserWarningsPage").then((module) => ({ default: module.ModerationUserWarningsPage })));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage").then((module) => ({ default: module.ForgotPasswordPage })));
const MyPostsPage = lazy(() => import("@/pages/MyPostsPage").then((module) => ({ default: module.MyPostsPage })));
const MyReviewsPage = lazy(() => import("@/pages/MyReviewsPage").then((module) => ({ default: module.MyReviewsPage })));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage").then((module) => ({ default: module.NotificationsPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));
const OAuthCallbackPage = lazy(() => import("@/pages/OAuthCallbackPage").then((module) => ({ default: module.OAuthCallbackPage })));
const PlaceDetailPage = lazy(() => import("@/pages/PlaceDetailPage").then((module) => ({ default: module.PlaceDetailPage })));
const PlacesListPage = lazy(() => import("@/pages/PlacesListPage").then((module) => ({ default: module.PlacesListPage })));
const PostDetailPage = lazy(() => import("@/pages/PostDetailPage").then((module) => ({ default: module.PostDetailPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const PublicProfilePage = lazy(() => import("@/pages/PublicProfilePage").then((module) => ({ default: module.PublicProfilePage })));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage").then((module) => ({ default: module.ResetPasswordPage })));
const SavedPostsPage = lazy(() => import("@/pages/SavedPostsPage").then((module) => ({ default: module.SavedPostsPage })));
const SocialFilteredFeedPage = lazy(() => import("@/pages/SocialFilteredFeedPage").then((module) => ({ default: module.SocialFilteredFeedPage })));
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmailPage").then((module) => ({ default: module.VerifyEmailPage })));

function RouteFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <LoadingSkeleton count={3} className="h-32" />
    </div>
  );
}

function lazyRoute(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

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
        element: lazyRoute(<PlacesListPage />),
      },
      {
        path: "map",
        element: lazyRoute(<MapPage />),
      },
      {
        path: "places/map",
        element: lazyRoute(<MapPage />),
      },
      {
        path: "places/:placeId",
        element: lazyRoute(<PlaceDetailPage />),
      },
      {
        path: "community",
        element: lazyRoute(<CommunityFeedPage />),
      },
      {
        path: "community/new",
        element: lazyRoute(<CreatePostPage />),
      },
      {
        path: "community/:postId",
        element: lazyRoute(<PostDetailPage />),
      },
      {
        path: "community/hashtag/:tag",
        element: lazyRoute(<SocialFilteredFeedPage mode="hashtag" />),
      },
      {
        path: "community/place/:placeId",
        element: lazyRoute(<SocialFilteredFeedPage mode="place" />),
      },
      {
        path: "community/saved",
        element: lazyRoute(<SavedPostsPage />),
      },
      {
        path: "community/following",
        element: lazyRoute(<CommunityFeedPage initialFeedType="following" />),
      },
      {
        path: "profile",
        element: lazyRoute(<ProfilePage />),
      },
      {
        path: "profile/edit",
        element: lazyRoute(<ProfilePage />),
      },
      {
        path: "profile/change-password",
        element: lazyRoute(<ProfilePage />),
      },
      {
        path: "notifications",
        element: lazyRoute(<NotificationsPage />),
      },
      {
        path: "u/:username",
        element: lazyRoute(<PublicProfilePage />),
      },
      {
        path: "users/:username",
        element: lazyRoute(<PublicProfilePage />),
      },
      {
        path: "u/:username/posts",
        element: lazyRoute(<PublicProfilePage />),
      },
      {
        path: "saved",
        element: lazyRoute(<SavedPostsPage />),
      },
      {
        path: "saved-posts",
        element: lazyRoute(<SavedPostsPage />),
      },
      {
        path: "my-posts",
        element: lazyRoute(<MyPostsPage />),
      },
      {
        path: "my-reviews",
        element: lazyRoute(<MyReviewsPage />),
      },
      {
        path: "ai",
        element: lazyRoute(<AiHubPage />),
      },
      {
        path: "ai/search",
        element: lazyRoute(<AiSearchPage />),
      },
      {
        path: "ai/recommendations",
        element: lazyRoute(<AiRecommendationsPage />),
      },
      {
        path: "ai/chat",
        element: lazyRoute(<AiChatPage />),
      },
      {
        path: "ai/chatbot",
        element: lazyRoute(<AiChatPage />),
      },
      {
        path: "ai/tools",
        element: lazyRoute(<AiContentToolsPage />),
      },
      {
        path: "ai/content-tools",
        element: lazyRoute(<AiContentToolsPage />),
      },
      {
        path: "ai/itinerary",
        element: lazyRoute(<AiItineraryPage />),
      },
      {
        path: "ai-itinerary",
        element: lazyRoute(<AiItineraryPage />),
      },
      {
        path: "itineraries",
        element: lazyRoute(<ItinerariesPage />),
      },
      {
        path: "itineraries/new",
        element: lazyRoute(<ItineraryEditPage />),
      },
      {
        path: "itineraries/:id",
        element: lazyRoute(<ItineraryDetailPage />),
      },
      {
        path: "itineraries/:id/edit",
        element: lazyRoute(<ItineraryEditPage />),
      },
      {
        path: "itineraries/shared/:shareSlug",
        element: lazyRoute(<ItineraryDetailPage shared />),
      },
      {
        path: "login",
        element: <LoginRegisterPage />,
      },
      {
        path: "forgot-password",
        element: lazyRoute(<ForgotPasswordPage />),
      },
      {
        path: "reset-password",
        element: lazyRoute(<ResetPasswordPage />),
      },
      {
        path: "verify-email",
        element: lazyRoute(<VerifyEmailPage />),
      },
      {
        path: "oauth/callback",
        element: lazyRoute(<OAuthCallbackPage />),
      },
      {
        path: "admin",
        element: (
          <ProtectedAdminRoute allowedRoles={["admin"]}>
            {lazyRoute(<AdminDashboardPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "moderation",
        element: (
          <ProtectedAdminRoute allowedRoles={["moderator", "admin"]}>
            {lazyRoute(<ModerationDashboardPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "moderation/reports",
        element: (
          <ProtectedAdminRoute allowedRoles={["moderator", "admin"]}>
            {lazyRoute(<ModerationReportsPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "moderation/posts",
        element: (
          <ProtectedAdminRoute allowedRoles={["moderator", "admin"]}>
            {lazyRoute(<ModerationPostsPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "moderation/comments",
        element: (
          <ProtectedAdminRoute allowedRoles={["moderator", "admin"]}>
            {lazyRoute(<ModerationCommentsPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "moderation/actions",
        element: (
          <ProtectedAdminRoute allowedRoles={["moderator", "admin"]}>
            {lazyRoute(<ModerationActionsPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "moderation/users/:userId/warnings",
        element: (
          <ProtectedAdminRoute allowedRoles={["moderator", "admin"]}>
            {lazyRoute(<ModerationUserWarningsPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/analytics",
        element: (
          <ProtectedAdminRoute allowedRoles={["admin"]}>
            {lazyRoute(<AdminAnalyticsPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <ProtectedAdminRoute allowedRoles={["admin"]}>
            {lazyRoute(<AdminUsersPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/places",
        element: (
          <ProtectedAdminRoute allowedRoles={["admin"]}>
            {lazyRoute(<AdminPlacesPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/posts",
        element: (
          <ProtectedAdminRoute allowedRoles={["moderator", "admin"]}>
            {lazyRoute(<AdminPostsPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/comments",
        element: (
          <ProtectedAdminRoute allowedRoles={["moderator", "admin"]}>
            {lazyRoute(<AdminCommentsPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/reviews",
        element: (
          <ProtectedAdminRoute allowedRoles={["moderator", "admin"]}>
            {lazyRoute(<AdminReviewsPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/reports",
        element: (
          <ProtectedAdminRoute allowedRoles={["moderator", "admin"]}>
            {lazyRoute(<AdminReportsPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/categories",
        element: (
          <ProtectedAdminRoute allowedRoles={["admin"]}>
            {lazyRoute(<AdminCategoriesPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/settings",
        element: (
          <ProtectedAdminRoute allowedRoles={["admin"]}>
            {lazyRoute(<AdminSettingsPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/audit-logs",
        element: (
          <ProtectedAdminRoute allowedRoles={["admin"]}>
            {lazyRoute(<AdminAuditLogsPage />)}
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "*",
        element: lazyRoute(<NotFoundPage />),
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
