import React, { useState, useEffect, useRef } from "react";
import Icon from "./Icon";
import useMentorStore from "@/store/mentorStore";
import Spinner from "./Spinner";

const EditMentorPostModal = ({ post, onClose, onEdit, showToast }) => {
  const [title, setTitle] = useState(post.title || "");
  const [postContent, setPostContent] = useState(post.content || "");
  const [postType] = useState(post.type || "update");

  const [signal, setSignal] = useState(
    post.signalDetails || {
      instrument: "EUR/USD",
      direction: "BUY",
      entry: "",
      stopLoss: "",
      takeProfit: "",
    }
  );

  const [existingFiles, setExistingFiles] = useState(post.fileURLs || []);

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [fullscreenImage, setFullscreenImage] = useState(null);
  const { editMentorPost, isEditingPost } = useMentorStore();

  const maxFiles = 5;
  const fileInputRef = useRef()

  const resetForm = () => {
  setTitle(post.title || "");
  setPostContent(post.content || "");
  setSignal(
    post.signalDetails || {
      instrument: "EUR/USD",
      direction: "BUY",
      entry: "",
      stopLoss: "",
      takeProfit: "",
    }
  );
  previews.forEach(URL.revokeObjectURL);
  setFiles([]);
  setPreviews([]);
  setExistingFiles(post.fileURLs || []);

  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
  setFullscreenImage(null);
};


  const handleFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (
      existingFiles.length + files.length + selectedFiles.length >
      maxFiles
    ) {
      showToast(`You can only upload up to ${maxFiles} files`, "info");
      return;
    }

    const newPreviews = selectedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setFiles((prev) => [...prev, ...selectedFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);

    e.target.value = "";
  };

  const removeExistingFile = (index) => {
    setExistingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index) => {
    URL.revokeObjectURL(previews[index]);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", postContent);
      formData.append("type", postType);

      if (postType === "signal") {
        formData.append("signalDetails", JSON.stringify(signal));
      }

      formData.append(
        "existingFiles",
        JSON.stringify(existingFiles)
      );

      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await editMentorPost(post._id, formData);

      onEdit?.(res.data.post);
      showToast("Post updated successfully", "success");
      resetForm()
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Failed to update post", "error");
    }
  };

  const isDirty =
    title !== post.title ||
    postContent !== post.content ||
    files.length > 0 ||
    existingFiles.length !== (post.fileURLs?.length || 0);

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl relative p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-full"
        >
          <Icon name="close" cssName="w-6 h-6" />
        </button>

        <h3 className="text-xl font-bold mb-4">Edit Post</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Post title"
            className="w-full rounded-md p-3 bg-light-hover dark:bg-gray-700"
          />

          {postType === "signal" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <select
                value={signal.instrument}
                onChange={(e) =>
                  setSignal((s) => ({
                    ...s,
                    instrument: e.target.value,
                  }))
                }
                className="p-3 rounded-md bg-light-hover dark:bg-gray-700"
              >
                <option>EUR/USD</option>
                <option>GBP/USD</option>
                <option>USD/JPY</option>
                <option>XAU/USD</option>
              </select>

              <select
                value={signal.direction}
                onChange={(e) =>
                  setSignal((s) => ({
                    ...s,
                    direction: e.target.value,
                  }))
                }
                className="p-3 rounded-md bg-light-hover dark:bg-gray-700"
              >
                <option>BUY</option>
                <option>SELL</option>
              </select>

              {["entry", "stopLoss", "takeProfit"].map((field) => (
                <input
                  key={field}
                  type="number"
                  step="any"
                  placeholder={field}
                  value={signal[field]}
                  onChange={(e) =>
                    setSignal((s) => ({
                      ...s,
                      [field]: e.target.value,
                    }))
                  }
                  className="p-3 rounded-md bg-light-hover dark:bg-gray-700"
                />
              ))}
            </div>
          )}

          <textarea
            rows={5}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            required
            placeholder="Post content"
            className="w-full rounded-md p-3 bg-light-hover dark:bg-gray-700"
          />

          
          <label className="cursor-pointer text-primary inline-flex items-center gap-2">
            <Icon name="paperclip" className="w-5 h-5" />
            Attach Files
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFilesChange}
              ref={fileInputRef}
            />
          </label>

        
          {(existingFiles.length > 0 || previews.length > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {existingFiles.map((src, i) => (
                <div key={`existing-${i}`} className="relative group border rounded-lg border-gray-300 dark:border-gray-600">
                  <img
                    src={src}
                    alt=""
                    onClick={() => setFullscreenImage(src)}
                    className="h-32 w-full object-contain rounded-md cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingFile(i)}
                    className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100"
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {previews.map((src, i) => (
                <div key={`new-${i}`} className="relative group border rounded-lg border-gray-300 dark:border-gray-600">
                  <img
                    src={src}
                    alt=""
                    onClick={() => setFullscreenImage(src)}
                    className="h-32 w-full object-contain rounded-md cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewFile(i)}
                    className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100"
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isDirty || isEditingPost}
              className={`bg-primary text-white font-bold py-2 px-4 rounded-lg ${!isDirty ? 'cursor-not-allowed bg-opacity-40' : 'cursor-pointer'}`}
            >
              {isEditingPost ? <Spinner h={5} w={5} /> : "Update Post"}
            </button>
          </div>
        </form>

        {fullscreenImage && (
          <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
            onClick={() => setFullscreenImage(null)}
          >
            <img
              src={fullscreenImage}
              className="max-h-[90vh] max-w-[90%] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditMentorPostModal;
