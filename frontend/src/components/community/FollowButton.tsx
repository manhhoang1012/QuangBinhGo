import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { authStorage } from "@/services/api";
import { followUser, unfollowUser } from "@/services/followApi";

interface FollowButtonProps {
  username?: string | null;
  initialIsFollowing?: boolean;
  onChanged?: (next: { isFollowing: boolean; followersCount: number; message: string }) => void;
  className?: string;
}

export function FollowButton({ username, initialIsFollowing = false, onChanged, className }: FollowButtonProps) {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const currentUsername = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user") || "null")?.username as string | undefined;
    } catch {
      return undefined;
    }
  }, []);

  if (!username || username === currentUsername) return null;

  const toggle = async () => {
    if (isLoading) return;
    if (!authStorage.getToken()) {
      navigate("/login");
      return;
    }
    const previous = isFollowing;
    setIsLoading(true);
    setIsFollowing(!previous);
    try {
      const response = previous ? await unfollowUser(username) : await followUser(username);
      setIsFollowing(response.is_following);
      onChanged?.({
        isFollowing: response.is_following,
        followersCount: response.followers_count,
        message: response.message,
      });
    } catch {
      setIsFollowing(previous);
      onChanged?.({
        isFollowing: previous,
        followersCount: -1,
        message: "Khong the cap nhat theo doi. Vui long thu lai.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className={className}
      disabled={isLoading}
      onClick={() => void toggle()}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      variant={isFollowing ? "outline" : "default"}
    >
      {isLoading ? "Dang xu ly..." : isFollowing ? (isHovering ? "Bo theo doi" : "Dang theo doi") : "Theo doi"}
    </Button>
  );
}
