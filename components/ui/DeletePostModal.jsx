import React from "react";
import Icon from "./Icon";
import Spinner from "./Spinner";
import useMentorStore from "@/store/mentorStore";

const DeletePostModal = ({
  title = "Delete Post",
  message = "Are you sure you want to delete this post? This action cannot be undone.",
  confirmText = "Delete",
  onClose,
  showToast,
  post,
  onDelete
}) => {
  const { deleteMentorPost, isDeletingPost } = useMentorStore();

  const handleDelete = async () => {
    try {
      await deleteMentorPost(post._id);
      onDelete()
      showToast("Post deleted successfully", "success");
    } catch (error) {
      console.log(error);
      showToast("could not delete Post", "error");
    }
  };
  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl relative p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-full"
        >
          <Icon name="close" className="w-6 h-6" />
        </button>

        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red/10 text-red mb-4 mx-auto">
          <Icon name="danger" className="w-6 h-6 text-danger" />
        </div>

        <h3 className="text-lg font-bold text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeletingPost}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeletingPost}
            className="flex-1 bg-red w-full h-full text-white rounded-lg py-2 flex items-center justify-center font-semibold hover:bg-red-dark"
          >
            {isDeletingPost ? <Spinner h={5} w={5} /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePostModal;
