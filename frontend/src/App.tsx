import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";
import { RootLayout } from "@/layouts/RootLayout";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AdminCategoriesPage } from "@/pages/AdminCategoriesPage";
import { AdminCommentsPage } from "@/pages/AdminCommentsPage";
import { AdminPlaceholderPage } from "@/pages/AdminPlaceholderPage";
import { AdminPlacesPage } from "@/pages/AdminPlacesPage";
import { AdminPostsPage } from "@/pages/AdminPostsPage";
import { AdminReviewsPage } from "@/pages/AdminReviewsPage";
import { AdminUsersPage } from "@/pages/AdminUsersPage";
import { AiItineraryPage } from "@/pages/AiItineraryPage";
import { AiSearchPage } from "@/pages/AiSearchPage";
import { CommunityFeedPage } from "@/pages/CommunityFeedPage";
import { CreatePostPage } from "@/pages/CreatePostPage";
import { HomePage } from "@/pages/HomePage";
import { LoginRegisterPage } from "@/pages/LoginRegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { MyPostsPage } from "@/pages/MyPostsPage";
import { MyReviewsPage } from "@/pages/MyReviewsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { OAuthCallbackPage } from "@/pages/OAuthCallbackPage";
import { PlaceDetailPage } from "@/pages/PlaceDetailPage";
import { PlacesListPage } from "@/pages/PlacesListPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { PublicProfilePage } from "@/pages/PublicProfilePage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { SavedPostsPage } from "@/pages/SavedPostsPage";
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
        path: "ai/search",
        element: <AiSearchPage />,
      },
      {
        path: "ai/itinerary",
        element: <AiItineraryPage />,
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
          <ProtectedAdminRoute>
            <AdminDashboardPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <ProtectedAdminRoute>
            <AdminUsersPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/places",
        element: (
          <ProtectedAdminRoute>
            <AdminPlacesPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/posts",
        element: (
          <ProtectedAdminRoute>
            <AdminPostsPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/comments",
        element: (
          <ProtectedAdminRoute>
            <AdminCommentsPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/reviews",
        element: (
          <ProtectedAdminRoute>
            <AdminReviewsPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/categories",
        element: (
          <ProtectedAdminRoute>
            <AdminCategoriesPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/settings",
        element: (
          <ProtectedAdminRoute>
            <AdminPlaceholderPage
              description="System settings UI placeholder."
              endpoints={["GET /api/v1/admin/settings", "PATCH /api/v1/admin/settings"]}
              title="Settings"
            />
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
