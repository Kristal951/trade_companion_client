import React, { useState, useEffect } from "react";
import Icon from "./Icon";
import { User } from "@/types";

interface SettingsProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  updateUser: (updatedData: {
    name?: string;
    avatar?: File | null;
  }) => Promise<void> | void;
  loading: boolean;
}

const getUserAvatar = (user: User) =>
  user.avatar || user.picture || user.image|| `https://i.pravatar.cc/150?u=${user.email}`;

const ProfileSettings: React.FC<SettingsProps> = ({
  user,
  updateUser,
  showToast,
  loading,
}) => {
  console.log(user)
  const [displayName, setDisplayName] = useState(user.name || "");
  const [avatarPreview, setAvatarPreview] = useState(getUserAvatar(user));
  const [originalAvatar, setOriginalAvatar] = useState(getUserAvatar(user));
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const hasChanges =
    displayName.trim() !== (user.name || "").trim() || avatarFile !== null;

  useEffect(() => {
    const avatar = getUserAvatar(user);

    setDisplayName(user.name || "");
    setAvatarPreview(avatar);
    setOriginalAvatar(avatar);
    setAvatarFile(null);
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be 5MB or less.", "error");
      return;
    }

    if (avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(previewUrl);
  };

  const handleSave = async () => {
    try {
      await updateUser({
        name: displayName.trim(),
        avatar: avatarFile,
      });

      showToast("Profile updated successfully.", "success");

      setOriginalAvatar(avatarPreview);
      setAvatarFile(null);
    } catch (error) {
      console.error(error);
      showToast("Profile update unsuccessful.", "error");

      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }

      setAvatarPreview(originalAvatar);
      setDisplayName(user.name || "");
      setAvatarFile(null);
    }
  };

  return (
    <div className="space-y-6 rounded-lg border border-light-gray bg-light-surface p-6 text-dark-text">
      <h3 className="text-lg font-bold">My Profile</h3>

      <div className="flex items-center space-x-6">
        <div className="relative">
          <img
            src={avatarPreview}
            alt="Profile"
            className="h-24 w-24 rounded-full border-4 border-light-hover object-cover"
          />

          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-primary p-2 text-white shadow-md transition-transform hover:scale-110 hover:bg-primary-hover"
          >
            <Icon name="edit" className="h-4 w-4" />
          </label>

          <input
            type="file"
            id="avatar-upload"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div>
          <p className="mb-1 text-sm text-mid-text">Profile Picture</p>
          <p className="text-xs text-mid-text">PNG, JPG, WEBP up to 5MB</p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Display Name / Username
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-light-gray bg-light-hover p-3 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Email Address</label>
        <input
          type="text"
          value={user.email}
          readOnly
          className="w-full cursor-not-allowed rounded-lg border border-light-gray bg-light-hover p-3 text-mid-text"
        />
        <p className="mt-1 text-xs text-mid-text">
          Email cannot be changed. Contact support for assistance.
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={!hasChanges || loading}
        className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
};

export default ProfileSettings;
