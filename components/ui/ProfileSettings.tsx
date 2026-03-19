import React, { useState, useEffect } from "react";
import Icon from "./Icon";
import { User } from "@/types";

interface SettingsProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  updateUser: (updatedData: Partial<User>) => void;
  loading: boolean;
}

const ProfileSettings: React.FC<SettingsProps> = ({
  user,
  updateUser,
  showToast,
  loading,
}) => {
  const [displayName, setDisplayName] = useState(user.name);
  const [avatarPreview, setAvatarPreview] = useState(
    user.avatar ||
      user.image ||
      user.picture ||
      `https://i.pravatar.cc/150?u=${user.email}`,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const hasChanges = displayName !== user.name || avatarFile !== null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file || null);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  useEffect(() => {
    return () => {
      if (avatarFile && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview, avatarFile]);

  const handleSave = async () => {
    try {
      await updateUser({
        name: displayName,
        avatar: avatarFile,
      });
      showToast("Profile updated successfully.", "success");
    } catch (error) {
      console.log(error);
      showToast("Profile update unsuccesful.", "error");
      setAvatarFile(null);
      setDisplayName(user.name);
    }
  };
  return (
    <div className="p-6 bg-light-surface rounded-lg border border-light-gray text-dark-text space-y-6">
      <h3 className="font-bold text-lg">My Profile</h3>

      <div className="flex items-center space-x-6">
        <div className="relative">
          <img
            src={avatarPreview}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-light-hover"
          />
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-hover shadow-md transition-transform transform hover:scale-110"
          >
            <Icon name="edit" className="w-4 h-4" />
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
        <div>
          <p className="text-sm text-mid-text mb-1">Profile Picture</p>
          <p className="text-xs text-mid-text">PNG, JPG up to 5MB</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Display Name / Username
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full p-3 rounded-lg bg-light-hover border border-light-gray focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email Address</label>
        <input
          type="text"
          value={user.email}
          readOnly
          className="w-full p-3 rounded-lg bg-light-hover border border-light-gray text-mid-text cursor-not-allowed"
        />
        <p className="text-xs text-mid-text mt-1">
          Email cannot be changed. Contact support for assistance.
        </p>
      </div>

      <button
        onClick={handleSave}
        className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-hover font-semibold shadow-sm transition-colors"
        disabled={!hasChanges || loading}
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
};

export default ProfileSettings;
