import React, { useState, useEffect, useMemo } from "react";
import Icon from "../ui/Icon";
import useMentorStore from "@/store/mentorStore";
import { API } from "@/utils";
import FileUpload from "../ui/FileUpload";

const MAX_CERTS = 5;
const MAX_SIZE_MB = 10;

const MentorProfileSettings: React.FC<{
  showToast: (message: string, type?: "success" | "info" | "error") => void;
}> = ({ showToast }) => {
  const {
    mentor,
    updateMentorField,
    addInstrument,
    removeInstrument,
    addCertification,
    removeCertification,
    setMentor,
  } = useMentorStore();

  const [initialMentor, setInitialMentor] = useState<any>(null);
  const [newInstrument, setNewInstrument] = useState("");
  const [newCertName, setNewCertName] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  const [certificationFiles, setCertificationFiles] = useState<File[]>([]);
  const [certPreviews, setCertPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  /* ------------------ Initial Snapshot ------------------ */
  useEffect(() => {
    if (mentor && !initialMentor) {
      setInitialMentor(JSON.parse(JSON.stringify(mentor)));
    }
  }, [mentor, initialMentor]);

  /* ------------------ Cleanup previews ------------------ */
  useEffect(() => {
    return () => {
      certPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [certPreviews]);

  if (!mentor) return <p>Loading mentor data...</p>;

  /* ------------------ Change Detection ------------------ */
  const normalizeCerts = (certs: any[] = []) =>
    certs.map((c) => c.name).sort().join(",");

  const hasChanges = useMemo(() => {
    if (!initialMentor) return false;

    return (
      mentor.name !== initialMentor.name ||
      mentor.strategy !== initialMentor.strategy ||
      JSON.stringify(mentor.instruments) !==
        JSON.stringify(initialMentor.instruments) ||
      normalizeCerts(mentor.certifications) !==
        normalizeCerts(initialMentor.certifications) ||
      profileImageFile !== null ||
      certificationFiles.length > 0
    );
  }, [mentor, initialMentor, profileImageFile, certificationFiles]);

  /* ------------------ Share Profile ------------------ */
  const handleShareProfile = () => {
    const url = `${window.location.origin}/mentor/${mentor._id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => showToast("Profile link copied!", "success"))
      .catch(() => showToast("Failed to copy link.", "error"));
  };

  /* ------------------ Instruments ------------------ */
  const handleAddInstrument = () => {
    const instrument = newInstrument.toUpperCase().trim();
    if (instrument && !mentor.instruments.includes(instrument)) {
      addInstrument(instrument);
      setNewInstrument("");
    }
  };

  /* ------------------ Certification Upload ------------------ */
  const handleCertificationFiles = (files: File[]) => {
    if (!files.length) return;

    const remainingSlots = MAX_CERTS - certificationFiles.length;
    if (remainingSlots <= 0) {
      showToast(`Maximum of ${MAX_CERTS} certificates allowed`, "info");
      return;
    }

    const validFiles = files
      .filter(
        (file) =>
          file.type.startsWith("image/") &&
          file.size <= MAX_SIZE_MB * 1024 * 1024
      )
      .slice(0, remainingSlots);

    if (validFiles.length !== files.length) {
      showToast(
        `Some files were skipped (images only, max ${MAX_SIZE_MB}MB)`,
        "info"
      );
    }

    const previews = validFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setCertificationFiles((prev) => [...prev, ...validFiles]);
    setCertPreviews((prev) => [...prev, ...previews]);
  };

  const removeCertPreview = (index: number) => {
    URL.revokeObjectURL(certPreviews[index]);

    setCertificationFiles((prev) => prev.filter((_, i) => i !== index));
    setCertPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCertification = () => {
    if (!newCertName.trim()) {
      showToast("Certification name is required.", "error");
      return;
    }

    if (!certificationFiles.length) {
      showToast("Upload at least one certificate image.", "error");
      return;
    }

    if (mentor.certifications.length >= MAX_CERTS) {
      showToast(`Maximum of ${MAX_CERTS} certifications allowed`, "info");
      return;
    }

    addCertification({
      name: newCertName.trim(),
      url: "#",
    });

    setNewCertName("");
  };

  const handleRemoveCertification = (name: string) => {
    removeCertification(name);
  };

  /* ------------------ Save ------------------ */
  const handleSaveChanges = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!mentor?._id || saving) return;

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("name", mentor.name);
      formData.append("strategy", mentor.strategy);
      formData.append("instruments", JSON.stringify(mentor.instruments));

      const certMeta =
        mentor.certifications?.map((c: any) => ({ name: c.name })) || [];
      formData.append("certifications", JSON.stringify(certMeta));

      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      certificationFiles.forEach((file) => {
        formData.append("certFiles", file);
      });

      const res = await API.patch(
        `/api/mentor/updateMentor/${mentor._id}`,
        formData
      );

      setMentor(res.data.mentor, true);
      setProfileImageFile(null);
      setCertificationFiles([]);
      setCertPreviews([]);
      showToast("Profile updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------ UI ------------------ */
  return (
    <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray relative animate-fade-in-right">
      {/* Share */}
      <button
        onClick={handleShareProfile}
        className="absolute top-6 right-6 flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg"
      >
        <Icon name="link" className="w-4 h-4" />
        <span className="text-sm font-semibold">Share Profile</span>
      </button>

      <h3 className="text-xl font-bold mb-6">Profile & Settings</h3>

      <form className="space-y-8 divide-y" onSubmit={handleSaveChanges}>
        {/* Basic Info */}
        <div className="space-y-4 pt-4">
          <input
            value={mentor.name}
            onChange={(e) => updateMentorField("name", e.target.value)}
            className="w-full p-2 bg-light-hover rounded-md"
            placeholder="Display Name"
          />

          <textarea
            rows={4}
            value={mentor.strategy}
            onChange={(e) => updateMentorField("strategy", e.target.value)}
            className="w-full p-2 bg-light-hover rounded-md"
            placeholder="Trading strategy / bio"
          />

          <FileUpload
            label="Profile Image"
            hint="Upload profile image"
            onFileSelect={(files: File[]) =>
              setProfileImageFile(files[0] ?? null)
            }
          />
        </div>

        {/* Instruments */}
        <div className="space-y-4 pt-8">
          <div className="flex flex-wrap gap-2">
            {mentor.instruments.map((inst: string) => (
              <span key={inst} className="bg-primary/10 px-3 py-1 rounded-full">
                {inst}
                <button
                  type="button"
                  onClick={() => removeInstrument(inst)}
                  className="ml-2 text-danger"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={newInstrument}
              onChange={(e) => setNewInstrument(e.target.value)}
              className="flex-grow p-2 bg-light-hover rounded-md"
              placeholder="e.g. EURUSD"
            />
            <button
              type="button"
              onClick={handleAddInstrument}
              className="bg-secondary text-white px-4 rounded-lg"
            >
              Add
            </button>
          </div>
        </div>

        {/* Certifications */}
        <div className="space-y-4 pt-8">
          <div className="text-sm text-right">
            {mentor.certifications.length} / {MAX_CERTS}
          </div>

          {mentor.certifications.map((cert: any) => (
            <div
              key={cert.name}
              className="flex justify-between bg-light-hover p-2 rounded-md"
            >
              {cert.name}
              <button
                type="button"
                onClick={() => handleRemoveCertification(cert.name)}
                className="text-danger"
              >
                Remove
              </button>
            </div>
          ))}

          {/* Image Previews */}
          {certPreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {certPreviews.map((src, i) => (
                <div key={i} className="relative group">
                  <img
                    src={src}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeCertPreview(i)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            value={newCertName}
            onChange={(e) => setNewCertName(e.target.value)}
            className="w-full p-2 bg-light-hover rounded-md"
            placeholder="Certification name"
          />

          <FileUpload
            label="Certificates"
            hint="Upload certificate images (max 5)"
            onFileSelect={(files) => handleCertificationFiles(files)}
          />

          <button
            type="button"
            onClick={handleAddCertification}
            className="bg-primary w-full text-white py-2 rounded-lg"
          >
            Add Certification
          </button>
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={!hasChanges || saving}
          className={`w-full py-3 rounded-lg font-bold ${
            hasChanges && !saving
              ? "bg-primary text-white"
              : "bg-gray-300 text-gray-500"
          }`}
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </form>
    </div>
  );
};

export default MentorProfileSettings;
