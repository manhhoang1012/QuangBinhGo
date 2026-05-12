import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { RootLayout } from "@/layouts/RootLayout";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { CommunityFeedPage } from "@/pages/CommunityFeedPage";
import { CreatePostPage } from "@/pages/CreatePostPage";
import { HomePage } from "@/pages/HomePage";
import { LoginRegisterPage } from "@/pages/LoginRegisterPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PlaceDetailPage } from "@/pages/PlaceDetailPage";
import { PlacesListPage } from "@/pages/PlacesListPage";
import { ProfilePage } from "@/pages/ProfilePage";

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
        path: "login",
        element: <LoginRegisterPage />,
      },
      {
        path: "admin",
        element: <AdminDashboardPage />,
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
