import useAppStore from "@/store/useStore";
import { Mentor, MentorPost } from "@/types";
import React, { useState, useRef, useEffect } from "react";
import Icon from "../ui/Icon";
import MentorPostCard from "../ui/MentorPostCard";
import useMentorStore from "@/store/mentorStore";
import { createPortal } from "react-dom";
import { useOutletContext } from "react-router-dom";

const MentorPublisher: React.FC<{
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "isRead">,
  ) => void;
}> = ({ addNotification }) => {
  const [postType, setPostType] = useState<"analysis" | "signal">("analysis");
  const [postContent, setPostContent] = useState("");
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<MentorPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<MentorPost | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useOutletContext<{
    showToast: (msg: string, type?: string) => void;
  }>();
  const [signal, setSignal] = useState({
    instrument: "EUR/USD",
    direction: "BUY",
    entry: "",
    stopLoss: "",
    takeProfit: [""],
  });
  const {
    createMentorPost,
    isLoading,
    getAllMentorPost,
    isGettingMentorPosts,
    posts,
    isCreatingPost,
    mentor,
    setPosts,
  } = useMentorStore();
  const formRef = useRef<HTMLFormElement>(null);
  const MAX_TP = 5;

  useEffect(() => {
    if (mentor?._id) {
      getAllMentorPost(mentor._id);
    }
  }, [mentor?._id, getAllMentorPost]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreenImage(null);
      }
    };

    if (fullscreenImage) {
      window.addEventListener("keydown", onKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreenImage]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleEditClick = (post: MentorPost) => setEditingPost(post);
  const handleCloseModal = () => setEditingPost(null);

  const isLastTPFilled = () => {
    const lastTP = signal.takeProfit[signal.takeProfit.length - 1];
    return lastTP.trim() !== "";
  };

  const addTP = () => {
    setSignal((prev) => {
      if (prev.takeProfit.length >= MAX_TP) {
        showToast(`Maximum of ${MAX_TP} Take Profits allowed`, "info");
        return prev;
      }

      const lastTP = prev.takeProfit[prev.takeProfit.length - 1];

      if (!lastTP || lastTP.trim() === "") {
        showToast("Please fill the previous Take Profit first", "info");
        return prev;
      }

      return {
        ...prev,
        takeProfit: [...prev.takeProfit, ""],
      };
    });
  };

  const canAddTP =
    signal.takeProfit.length < MAX_TP &&
    signal.takeProfit[signal.takeProfit.length - 1].trim() !== "";

  const updateTP = (index: number, value: string) => {
    setSignal((prev) => {
      const updated = [...prev.takeProfit];
      updated[index] = value;
      return { ...prev, takeProfit: updated };
    });
  };

  const removeTP = (index: number) => {
    setSignal((prev) => ({
      ...prev,
      takeProfit: prev.takeProfit.filter((_, i) => i !== index),
    }));
  };

  const onEdit = async () => {
    await handleCloseModal();

    if (!mentor?._id) {
      console.warn("Mentor ID is missing, cannot fetch posts");
      return;
    }

    try {
      const res = await getAllMentorPost(mentor._id);
    } catch (err) {
      console.error("Failed to fetch posts after edit:", err);
    }
  };
  const onDelete = async () => {
    if (!mentor?._id) {
      console.warn("Mentor ID is missing, cannot fetch posts");
      return;
    }

    try {
      await getAllMentorPost(mentor._id);
    } catch (err) {
      console.error("Failed to fetch posts after edit:", err);
    }
  };

  const applyFormat = (format: "bold" | "italic" | "ul" | "ol") => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let formattedText = "";

    if (selectedText.length === 0) {
      showToast("Please select text to format.", "info");
      return;
    }

    switch (format) {
      case "bold":
        formattedText = `<b>${selectedText}</b>`;
        break;
      case "italic":
        formattedText = `<i>${selectedText}</i>`;
        break;
      case "ul":
        formattedText = `<ul>\n${selectedText
          .split("\n")
          .map((line) => `<li>${line}</li>`)
          .join("\n")}\n</ul>`;
        break;
      case "ol":
        formattedText = `<ol>\n${selectedText
          .split("\n")
          .map((line) => `<li>${line}</li>`)
          .join("\n")}\n</ol>`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent =
      textarea.value.substring(0, start) +
      formattedText +
      textarea.value.substring(end);
    setPostContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + formattedText.length,
        start + formattedText.length,
      );
    }, 0);
  };

  const hasEmptyTP = () => {
    return signal.takeProfit.some((tp) => tp.trim() === "");
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_FILES = 5;
    const MAX_SIZE_MB = 10;

    const selectedFiles = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > MAX_FILES) {
      showToast(`You can upload up to ${MAX_FILES} images`, "info");
    }

    if (!selectedFiles.length) return;

    const validFiles = selectedFiles.filter(
      (file) =>
        file.type.startsWith("image/") &&
        file.size <= MAX_SIZE_MB * 1024 * 1024,
    );

    if (validFiles.length !== selectedFiles.length) {
      showToast(
        `Some images were skipped (max ${MAX_SIZE_MB}MB per image)`,
        "info",
      );
    }

    const slicedFiles = validFiles.slice(0, MAX_FILES - files.length);

    const newPreviews = slicedFiles.map((file) => URL.createObjectURL(file));

    setFiles((prev) => [...prev, ...slicedFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);

    e.target.value = "";
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentor?._id) {
      showToast("Mentor not loaded", "error");
      return;
    }
    const formData = new FormData();
    formData.append("mentorID", mentor._id);
    formData.append("type", postType);
    formData.append("title", title);
    formData.append("content", postContent);

    files.forEach((file) => formData.append("attachments", file));

    if (postType === "signal") {
      if (signal.takeProfit.length === 0) {
        showToast("At least one Take Profit is required", "error");
        return;
      }

      if (hasEmptyTP()) {
        showToast("Please fill all Take Profit fields", "error");
        return;
      }
      formData.append(
        "signalDetails",
        JSON.stringify({
          ...signal,
          takeProfit: signal.takeProfit.filter(Boolean),
        }),
      );
    }

    if (!postContent.trim() && files.length === 0) {
      showToast("Post must contain text or images.", "error");
      return;
    }

    try {
      await createMentorPost(formData);

      addNotification({
        message: `New ${postType} from your mentor, ${mentor.name}.`,
        linkTo: "mentor_profile",
        type: "mentor",
      });

      if (postType === "signal") {
        const sendToTelegram = formData.get("sendTelegram") === "on";
        if (sendToTelegram) {
          showToast(
            "Signal published and sent to subscribers' Telegram.",
            "success",
          );
        } else {
          showToast("Signal published.", "info");
        }
      } else {
        showToast("Analysis published.", "info");
      }
    } catch (error) {
      showToast("could not create post", "error");
    } finally {
      previews.forEach((url) => URL.revokeObjectURL(url));
      setFiles([]);
      setPreviews([]);
      formRef.current?.reset();
      setPostContent("");
      setPostType("analysis");
      setSignal({
        instrument: "EUR/USD",
        direction: "BUY",
        entry: "",
        stopLoss: "",
        takeProfit: [""],
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-right h-max">
      <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray">
        <h3 className="text-xl font-bold mb-4 text-dark-text">
          Publish Exclusive Content
        </h3>
        <div className="flex border-b border-light-gray mb-4">
          <button
            onClick={() => setPostType("analysis")}
            className={`py-2 px-4 font-semibold transition-colors ${
              postType === "analysis"
                ? "border-b-2 border-primary text-primary"
                : "text-mid-text hover:text-dark-text"
            }`}
          >
            Analysis / Update
          </button>
          <button
            onClick={() => setPostType("signal")}
            className={`py-2 px-4 font-semibold transition-colors ${
              postType === "signal"
                ? "border-b-2 border-primary text-primary"
                : "text-mid-text hover:text-dark-text"
            }`}
          >
            Trade Signal
          </button>
        </div>
        <form ref={formRef} onSubmit={handlePublish} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder={
              postType === "signal"
                ? "Signal Title (e.g., EUR/USD Long Setup)"
                : "Title for your analysis or update"
            }
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-light-hover border-light-gray rounded-md p-3 focus:ring-primary focus:border-primary text-dark-text"
          />

          {postType === "signal" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <select
                name="instrument"
                required
                className="w-full bg-light-hover border-light-gray rounded-md p-3 focus:ring-primary focus:border-primary text-dark-text"
                value={signal.instrument}
                onChange={(e) =>
                  setSignal((s) => ({ ...s, instrument: e.target.value }))
                }
              >
                <option>EUR/USD</option>
                <option>GBP/USD</option>
                <option>USD/JPY</option>
                <option>XAU/USD</option>
              </select>
              <select
                name="direction"
                required
                className="w-full bg-light-hover border-light-gray rounded-md p-3 focus:ring-primary focus:border-primary text-dark-text"
                value={signal.direction}
                onChange={(e) =>
                  setSignal((s) => ({ ...s, direction: e.target.value }))
                }
              >
                <option>BUY</option>
                <option>SELL</option>
              </select>
              <input
                type="number"
                step="any"
                name="entry"
                placeholder="Entry Price"
                required
                value={signal.entry}
                onChange={(e) =>
                  setSignal((s) => ({ ...s, entry: e.target.value }))
                }
                className="w-full bg-light-hover outline-none border-light-gray rounded-md p-3 focus:ring-primary focus:border-primary text-dark-text"
              />
              <input
                type="number"
                step="any"
                name="stopLoss"
                placeholder="Stop Loss"
                required
                value={signal.stopLoss}
                onChange={(e) =>
                  setSignal((s) => ({ ...s, stopLoss: e.target.value }))
                }
                className="w-full bg-light-hover outline-none border-light-gray rounded-md p-3 focus:ring-primary focus:border-primary text-dark-text"
              />
              <div className="col-span-2 md:col-span-3 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-dark-text">
                    Take Profit Targets
                  </label>

                  <span className="text-xs text-mid-text">
                    {signal.takeProfit.length}/{MAX_TP}
                  </span>
                </div>

                <div className="space-y-3">
                  {signal.takeProfit.map((tp, index) => (
                    <div
                      key={index}
                      className="group flex items-center gap-3 rounded-lg border border-light-gray bg-light-hover px-3 py-2 focus-within:border-primary transition"
                    >
                      <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                        TP {index + 1}
                      </div>

                      <input
                        type="number"
                        step="any"
                        placeholder="Price"
                        value={tp}
                        required
                        onChange={(e) => updateTP(index, e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm text-dark-text placeholder:text-mid-text"
                      />

                      {signal.takeProfit.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTP(index)}
                          title="Remove TP"
                          className="
    flex items-center justify-center
    w-9 h-9
    rounded-xl
    text-red-600
    hover:bg-red-500/20
    transition
    active:scale-95
  "
                        >
                          <Icon name="close" className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {!canAddTP && (
                  <div className="w-full flex items-center gap-2 p-2 rounded-md">
                    <Icon name="info" className="w-5 h-5 text-info" />
                    <p className="text-xs text-info">
                      Fill the current TP before adding another
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={addTP}
                    disabled={!canAddTP}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition
        ${
          canAddTP
            ? "bg-primary text-white hover:bg-primary-hover"
            : "bg-primary/30 text-gray-500 cursor-not-allowed"
        }`}
                  >
                    <Icon name="plus" className="w-5 h-5" />
                    Add TP
                  </button>

                  <span className="text-xs text-mid-text">
                    {signal.takeProfit.length}/{MAX_TP} Take Profits
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="border border-light-gray rounded-md">
            <div className="flex items-center space-x-1 p-2 bg-light-hover border-b border-light-gray rounded-t-md">
              <button
                type="button"
                title="Bold"
                onClick={() => applyFormat("bold")}
                className="font-bold w-8 h-8 hover:bg-light-gray rounded text-dark-text"
              >
                B
              </button>
              <button
                type="button"
                title="Italic"
                onClick={() => applyFormat("italic")}
                className="italic w-8 h-8 hover:bg-light-gray rounded text-dark-text"
              >
                I
              </button>
              <button
                type="button"
                title="Bulleted List"
                onClick={() => applyFormat("ul")}
                className="w-8 h-8 hover:bg-light-gray rounded text-dark-text"
              >
                <Icon name="signals" className="w-4 h-4 mx-auto rotate-90" />
              </button>
              <button
                type="button"
                title="Numbered List"
                onClick={() => applyFormat("ol")}
                className="w-8 h-8 hover:bg-light-gray rounded text-dark-text"
              >
                1.
              </button>
            </div>
            <textarea
              name="content"
              ref={contentRef}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows={5}
              placeholder={
                postType === "signal"
                  ? "Reasoning behind the trade, chart analysis, etc..."
                  : "Share your insights, trade ideas, or educational content..."
              }
              required
              className="w-full bg-light-hover rounded-b-md p-3 focus:ring-0 focus:outline-none border-0 text-dark-text"
            />
          </div>

          <div className="flex justify-between items-center flex-wrap gap-4 pt-2">
            <label
              htmlFor="image-upload"
              className="text-sm text-primary hover:underline cursor-pointer flex items-center"
            >
              <Icon name="paperclip" className="w-5 h-5 mr-2" /> Attach Chart or
              File
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFilesChange}
                className="hidden"
                id="image-upload"
              />
            </label>

            <div className="w-full flex flex-col">
              <div>
                {previews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previews.map((src, index) => (
                      <div
                        key={index}
                        className="relative group overflow-hidden rounded-xl border border-light-gray bg-black shadow-md"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(src);
                            setPreviews((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                            setFiles((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                          }}
                          className="absolute top-2 right-2 z-10 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red"
                        >
                          <Icon name="trash" className="w-4 h-4" />
                        </button>

                        <img
                          src={src}
                          alt={`preview-${index}`}
                          className="h-40 w-full object-contain bg-black cursor-zoom-in"
                          onClick={() => setFullscreenImage(src)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-2 flex items-center justify-end w-full">
                <span className="ml-2 text-xs text-mid-text">
                  {files.length}/5 images
                </span>
              </div>
            </div>

            <div className="flex items-center w-full justify-between gap-4">
              {postType === "signal" && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendTelegram"
                    name="sendTelegram"
                    defaultChecked
                    className="h-4 w-4 rounded border-light-gray text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="sendTelegram"
                    className="ml-2 block text-sm text-dark-text"
                  >
                    Send Telegram Notification
                  </label>
                </div>
              )}
              <button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg"
                disabled={isLoading}
              >
                {isCreatingPost ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-4 border-white border-t-transparent" />
                ) : (
                  " Publish"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray">
        <h3 className="text-xl font-bold mb-4 text-dark-text">
          Your Recent Posts
        </h3>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {isGettingMentorPosts ? (
            <div className="w-full h-full flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : posts.length > 0 ? (
            [...posts]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .map((post) => (
                <MentorPostCard
                  onEdit={onEdit}
                  handleEditClick={handleEditClick}
                  handleCloseModal={handleCloseModal}
                  key={post._id}
                  post={post}
                  showToast={showToast}
                  editingPost={editingPost}
                  deletingPost={deletingPost}
                  onDelete={onDelete}
                  setDeletingPost={setDeletingPost}
                />
              ))
          ) : (
            <p className="text-center text-mid-text py-8">
              You haven't published any posts yet.
            </p>
          )}
        </div>
      </div>
      {fullscreenImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center w-full justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              className="absolute top-4 right-4 rounded-full bg-black/60 p-3 text-white hover:bg-red"
              onClick={() => setFullscreenImage(null)}
            >
              <Icon name="close" className="w-6 h-6" />
            </button>

            <img
              src={fullscreenImage}
              alt="Fullscreen preview"
              className="max-h-[90vh] max-w-[80%] rounded-xl object-contain shadow-2xl animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </div>
  );
};

export default MentorPublisher;
