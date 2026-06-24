"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { captainToSlug } from "@/data/quinielas";
import { uploadAvatar, isAvatarUploadAvailable } from "@/lib/supabase";
import { compressImage } from "@/lib/utils";

interface AvatarUploadProps {
  captain: string;
  onUploaded?: () => void;
}

export default function AvatarUpload({ captain, onUploaded }: AvatarUploadProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage(t("upload_error"));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage(t("upload_error"));
      return;
    }

    if (!isAvatarUploadAvailable()) {
      setMessage(t("supabase_not_configured"));
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const compressed = await compressImage(file);
      const slug = captainToSlug(captain);
      const result = await uploadAvatar(slug, compressed);
      if (result.ok) {
        setMessage(t("upload_success"));
        onUploaded?.();
      } else {
        setMessage(result.error);
      }
    } catch {
      setMessage(t("upload_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-pitch px-4 py-2 text-sm font-semibold text-black transition hover:bg-pitch/90">
        {loading ? t("loading") : t("upload_photo")}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
          disabled={loading}
        />
      </label>
      {message && (
        <p
          className={`mt-2 text-xs ${
            message === t("upload_success") ? "text-accent" : "text-red"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
