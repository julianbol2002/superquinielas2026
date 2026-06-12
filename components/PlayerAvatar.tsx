"use client";

import { useState } from "react";
import Image from "next/image";
import { captainToSlug } from "@/data/quinielas";
import { getAvatarUrl } from "@/lib/supabase";
import { getInitials, cn } from "@/lib/utils";

interface PlayerAvatarProps {
  captain: string;
  size?: number;
  className?: string;
}

export default function PlayerAvatar({
  captain,
  size = 48,
  className,
}: PlayerAvatarProps) {
  const slug = captainToSlug(captain);
  const avatarUrl = getAvatarUrl(slug);
  const [error, setError] = useState(false);

  if (avatarUrl && !error) {
    return (
      <Image
        src={avatarUrl}
        alt={captain}
        width={size}
        height={size}
        className={cn("rounded-full object-cover ring-2 ring-pitch/30", className)}
        style={{ width: size, height: size }}
        onError={() => setError(true)}
        unoptimized
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-pitch/30 to-stadium-card font-accent font-bold text-pitch ring-2 ring-pitch/20",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {getInitials(captain)}
    </div>
  );
}
