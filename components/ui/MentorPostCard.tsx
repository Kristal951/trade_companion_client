import { MentorPost } from "@/types";
import React, { useState, useRef, useEffect } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
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

interface Props {
  post: MentorPost;
  onDelete?: (postId: string) => void;
  onEdit?: (post: MentorPost) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

const MentorPostCard: React.FC<Props> = ({
  post,
  onEdit,
  showToast,
  deletingPost,
  onDelete,
  setDeletingPost,
}) => {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const { mentor } = useMentorStore();

  const isSignal = post.type === "signal";
  const isBuy = post.signalDetails?.direction === "BUY";
  const isOwner = post.mentor === mentor?._id;

  useEffect(() => {
    setCurrentIndex(0);
  }, [post._id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Just now";
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch {
      return "Just now";
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !post.fileURLs) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;

    if (diff > 50 && currentIndex < post.fileURLs.length - 1)
      setCurrentIndex((prev) => prev + 1);
    else if (diff < -50 && currentIndex > 0)
      setCurrentIndex((prev) => prev - 1);

    touchStartX.current = null;
  };

  const nextSlide = () => {
    if (!post.fileURLs) return;
    setCurrentIndex((prev) => Math.min(prev + 1, post.fileURLs.length - 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleShare = () => {
    const url = `${window.location.origin}/mentor-post/${post._id}`;
    navigator.clipboard.writeText(url);
    showToast("Post link copied", "success");
  };

  const handleDelete = async () => {};

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative">
      {/* IMAGE SLIDER */}
      {post.fileURLs?.length > 0 && (
        <div className="relative mb-4 overflow-hidden rounded-xl bg-black">
          {post.fileURLs.length > 1 && (
            <div className="absolute top-3 right-3 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {currentIndex + 1}/{post.fileURLs.length}
            </div>
          )}

          {currentIndex > 0 && (
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full"
            >
              <FaArrowLeft />
            </button>
          )}

          {currentIndex < post.fileURLs.length - 1 && (
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full"
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
                className="w-full flex-shrink-0 h-[350px] cursor-pointer"
                onClick={() => setFullscreenImage(url)}
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-xl font-semibold">{post.title}</h4>
          <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
        </div>

        {isSignal && (
          <span
            className={`px-2 py-0.5 text-xs font-bold rounded-full ${
              isBuy ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
            }`}
          >
            {post.signalDetails?.instrument} {post.signalDetails?.direction}
          </span>
        )}
      </div>

      {/* CONTENT */}
      <div
        className="text-sm mb-2"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {isSignal && post.signalDetails && (
        <SignalDetails signal={post.signalDetails} showToast={showToast} />
      )}

      <div className="flex gap-4 mt-4 justify-end">
        <button
          onClick={handleShare}
          className="flex items-center gap-1 text-primary text-sm font-semibold"
        >
          <FaShare /> Share
        </button>

        {isOwner && (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-yellow-600 text-sm font-semibold"
            >
              <FaEdit /> Edit
            </button>
            <button
              onClick={() => setDeletingPost(true)}
              className="flex items-center gap-1 text-red-600 text-sm font-semibold"
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
              className="absolute top-4 right-4 w-6 h-6 text-white"
            />
            <img
              src={fullscreenImage}
              className="max-h-[90vh] max-w-[90%] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        )}

      {isEditing &&
        createPortal(
          <EditMentorPostModal
            post={post}
            showToast={showToast}
            onEdit={onEdit}
            onClose={() => setIsEditing(false)}
          />,
          document.body
        )}

      {deletingPost &&
        createPortal(
          <DeletePostModal
            post={post}
            showToast={showToast}
            onClose={() => setDeletingPost(false)}
            onDelete={onDelete}
          />,
          document.body
        )}
    </div>
  );
};

export default MentorPostCard;
