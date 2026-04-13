import { formatDistanceToNow } from "date-fns";
import React from "react";

const MentorPostCard = ({ post }) => {
  if (!post) return null;

  const { mentor, fileURLs = [] } = post;

  const formattedDate = post?.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), {
        addSuffix: true,
      })
    : "";

  return (
    <div className="w-full rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <img
          src={mentor?.avatar || "/default-avatar.png"}
          alt="mentor avatar"
          className="w-10 h-10 rounded-full object-cover"
        />

        <div className="flex justify-between items-center w-full">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate">
              {mentor?.name || "Unknown Mentor"}
            </h2>
            <p className="text-xs text-gray-500 truncate">
              {mentor?.email || "No email"}
            </p>
          </div>

          <p className="text-xs text-gray-400 whitespace-nowrap">
            {formattedDate}
          </p>
        </div>
      </div>

      {post?.content && (
        <p className="text-sm line-clamp-4">
          {post.content}
        </p>
      )}

      {fileURLs.length > 0 && (
        <div className="mt-2">
          <img
            src={fileURLs[0]}
            alt="post"
            className="w-full max-h-[400px] object-cover rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default MentorPostCard;