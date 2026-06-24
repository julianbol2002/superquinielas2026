"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { captainToSlug } from "@/data/quinielas";
import { getAvatarBaseUrl } from "@/lib/supabase";
import { getInitials, cn } from "@/lib/utils";

interface PlayerAvatarProps {
  captain: string;
  size?: number;
  className?: string;
  ringColor?: string;
}

function resolveAvatarSrc(slug: string): string | null {
  const base = getAvatarBaseUrl(slug);
  if (!base) return null;
  const version = localStorage.getItem(`avatar-v:${slug}`);
  return version ? `${base}?v=${version}` : base;
}

export default function PlayerAvatar({
  captain,
  size = 48,
  className,
  ringColor,
}: PlayerAvatarProps) {
  const slug = captainToSlug(captain);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  const refreshUrl = useCallback(() => {
    setAvatarUrl(resolveAvatarSrc(slug));
    setError(false);
  }, [slug]);

  useEffect(() => {
    setMounted(true);
    refreshUrl();

    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ slug: string }>).detail;
      if (detail?.slug === slug) refreshUrl();
    };

    window.addEventListener("avatar-updated", onUpdate);
    return () => window.removeEventListener("avatar-updated", onUpdate);
  }, [slug, refreshUrl]);

  const borderStyle = ringColor
    ? { borderColor: ringColor, borderWidth: 2 }
    : { borderColor: "rgba(255,255,255,0.8)", borderWidth: 1 };

  if (mounted && avatarUrl && !error) {
    return (
      <Image
        src={avatarUrl}
        alt={captain}
        width={size}
        height={size}
        className={cn("rounded-full border object-cover", className)}
        style={{ width: size, height: size, ...borderStyle }}
        onError={() => setError(true)}
        unoptimized
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border bg-surface text-label font-medium text-secondary",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        ...borderStyle,
      }}
    >
      {getInitials(captain)}
    </div>
  );
}
