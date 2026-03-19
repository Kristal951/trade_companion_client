import { MentorPost } from "@/types";
import React, { useState, useRef, useEffect } from "react";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { createPortal } from "react-dom";
import Icon from "../ui/Icon";
import {
  FaArrowLeft,
  FaArrowRight,
  FaTrash,
  FaEdit,
  FaShare,
} from "react-icons/fa";
import useMentorStore from "@/store/mentorStore";
import EditMentorPostModal from "./EditMentorPostModal";
import DeletePostModal from "./DeletePostModal";
import SignalDetails from "./SignalDetails";
import useAppStore from "@/store/useStore";

interface Props {
  post: MentorPost;
  deletingPostId: string;
  setDeletingPostId: React.Dispatch<React.SetStateAction<string>>;
  onDelete?: (postId: string) => void;
  onEdit?: (post: MentorPost) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  postOwnerUserId?: string;
}

const MentorPostCard: React.FC<Props> = ({
  post,
  onEdit,
  onDelete,
  showToast,
  deletingPostId,
  setDeletingPostId,
  postOwnerUserId,
}) => {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const { user } = useAppStore();

  const isSignal = post.type === "signal";
  const isBuy = post.signalDetails?.direction === "BUY";

  const isOwner =
    !!user?.id &&
    !!postOwnerUserId &&
    String(postOwnerUserId) === String(user.id);
    console.log(isOwner)

  useEffect(() => {
    setCurrentIndex(0);
  }, [post._id]);

  const formatPostDate = (dateString?: string) => {
    if (!dateString) {
      return {
        relative: "Just now",
        absolute: "",
      };
    }

    try {
      const date = parseISO(dateString);

      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        absolute: format(date, "MMM d, yyyy"),
      };
    } catch {
      return {
        relative: "Just now",
        absolute: "",
      };
    }
  };

  const { relative, absolute } = formatPostDate(post.createdAt);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !post.fileURLs?.length) return;

    const diff = touchStartX.current - e.changedTouches[0].clientX;

    if (diff > 50 && currentIndex < post.fileURLs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (diff < -50 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }

    touchStartX.current = null;
  };

  const nextSlide = () => {
    if (!post.fileURLs?.length) return;
    setCurrentIndex((prev) => Math.min(prev + 1, post.fileURLs.length - 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/mentor-post/${post._id}`;
      await navigator.clipboard.writeText(url);
      showToast("Post link copied", "success");
    } catch {
      showToast("Failed to copy post link", "error");
    }
  };

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {post.fileURLs?.length > 0 && (
        <div className="relative mb-4 overflow-hidden rounded-xl bg-black">
          {post.fileURLs.length > 1 && (
            <div className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
              {currentIndex + 1}/{post.fileURLs.length}
            </div>
          )}

          {currentIndex > 0 && (
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
            >
              <FaArrowLeft />
            </button>
          )}

          {currentIndex < post.fileURLs.length - 1 && (
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
            >
              <FaArrowRight />
            </button>
          )}

          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {post.fileURLs.map((url, idx) => (
              <div
                key={idx}
                className="h-[350px] w-full flex-shrink-0 cursor-pointer"
                onClick={() => setFullscreenImage(url)}
              >
                <img
                  src={url}
                  alt={`Post image ${idx + 1}`}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
            {post.title}
          </h4>
          <p className="text-xs text-gray-500">
            {relative}
            {absolute ? ` • ${absolute}` : ""}
          </p>
        </div>

        {isSignal && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              isBuy ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
            }`}
          >
            {post.signalDetails?.instrument} {post.signalDetails?.direction}
          </span>
        )}
      </div>

      <div
        className="prose prose-sm mb-2 max-w-none text-gray-700 dark:prose-invert dark:text-gray-300"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {isSignal && post.signalDetails && (
        <SignalDetails signal={post.signalDetails} showToast={showToast} />
      )}

      <div className="mt-4 flex justify-end gap-4">
        <button
          onClick={handleShare}
          className="flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <FaShare /> Share
        </button>

        {isOwner && (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-sm font-semibold text-yellow-600"
            >
              <FaEdit /> Edit
            </button>

            <button
              onClick={() => setDeletingPostId(post._id)}
              className="flex items-center gap-1 text-sm font-semibold text-red-600"
            >
              <FaTrash /> Delete
            </button>
          </>
        )}
      </div>

      {fullscreenImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
            onClick={() => setFullscreenImage(null)}
          >
            <Icon
              name="close"
              className="absolute right-4 top-4 h-6 w-6 text-white"
            />
            <img
              src={fullscreenImage}
              alt="Fullscreen preview"
              className="max-h-[90vh] max-w-[90%] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}

      {isEditing &&
        createPortal(
          <EditMentorPostModal
            post={post}
            showToast={showToast}
            onEdit={onEdit}
            onClose={() => setIsEditing(false)}
          />,
          document.body,
        )}

      {deletingPostId === post?._id &&
        createPortal(
          <DeletePostModal
            postId={post?._id}
            showToast={showToast}
            setDeletingPostId={setDeletingPostId}
            onDelete={onDelete}
          />,
          document.body,
        )}
    </div>
  );
};

export default MentorPostCard;
