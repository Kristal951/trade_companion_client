// store/useMentorStore.js
import { API } from "@/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useMentorStore = create(
  persist(
    (set, get) => ({
      isMentorMode: false,
      mentor: null,

      isLoading: false,
      isCreatingPost: false,
      isGettingMentorPosts: false,
      isEditingPost: false,
      isDeletingPost: false,
      isSubscribingToMentor: false,

      error: null,
      posts: [],

      // ------------------ Basic Actions ------------------
      toggleMentorMode: () =>
        set((state) => ({ isMentorMode: !state.isMentorMode })),

      setMentor: (mentor, replace = false) =>
        set((state) => ({
          mentor:
            replace || !state.mentor ? mentor : { ...state.mentor, ...mentor },
        })),

      updateMentorField: (field, value) =>
        set((state) => ({
          mentor: { ...state.mentor, [field]: value },
        })),

      clearMentor: () => set({ mentor: null }),

      setMentorMode: (value) => set({ isMentorMode: value }),
      setPosts: (posts) => set({ posts }),

      // ------------------ Mentor Helpers ------------------
      addInstrument: (instrument) => {
        const upperInst = instrument.toUpperCase();
        const { mentor } = get();
        if (!mentor.instruments.includes(upperInst)) {
          set({
            mentor: {
              ...mentor,
              instruments: [...mentor.instruments, upperInst],
            },
          });
        }
      },

      removeInstrument: (instrument) => {
        const { mentor } = get();
        set({
          mentor: {
            ...mentor,
            instruments: mentor.instruments.filter((i) => i !== instrument),
          },
        });
      },

      addCertification: (cert) => {
        const { mentor } = get();
        set({
          mentor: {
            ...mentor,
            certifications: [...(mentor.certifications || []), cert],
          },
        });
      },

      removeCertification: (certName) => {
        const { mentor } = get();
        set({
          mentor: {
            ...mentor,
            certifications: (mentor.certifications || []).filter(
              (c) => c.name !== certName,
            ),
          },
        });
      },

      // ------------------ API Actions ------------------
      getMentorByUserID: async (userId) => {
        set({ isLoading: true });
        try {
          const res = await API.get(`/api/mentor/getMentorByUserID/${userId}`);
          set({ mentor: res.data.mentor });
          return res.data.mentor;
        } catch (error) {
          set({ mentor: null, error });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      createMentorPost: async (data) => {
        const tempId = `temp-${Date.now()}`;
        const optimisticPost = {
          _id: tempId,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isOptimistic: true,
        };

        set((state) => ({
          posts: [optimisticPost, ...state.posts],
          isCreatingPost: true,
        }));

        try {
          const res = await API.post("/api/mentor/createPost", data);
          const realPost = res.data.post;
          set((state) => ({
            posts: state.posts.map((p) => (p._id === tempId ? realPost : p)),
          }));
        } catch (error) {
          console.log(error);
          set((state) => ({
            posts: state.posts.filter((p) => p._id !== tempId),
            error,
          }));
          throw error;
        } finally {
          set({ isCreatingPost: false });
        }
      },

      getAllMentorPost: async (mentorId) => {
        set({ isGettingMentorPosts: true });
        try {
          const res = await API.get(`/api/mentor/getAllMentorPost/${mentorId}`);
          set({ posts: res.data.posts });
        } catch (error) {
          console.log(error);
          set({ error });
          throw error;
        } finally {
          set({ isGettingMentorPosts: false });
        }
      },

      getAllMentor: async () => {
        set({ isLoading: true });
        try {
          const mentors = await API.get("/api/mentor/getAllMentor");
          return mentors;
        } catch (error) {
          console.log(error);
          set({ error });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      editMentorPost: async (postID, data) => {
        set({ isEditingPost: true });
        try {
          const updatedPost = await API.patch(
            `/api/mentor/editMentorPost/${postID}`,
            data,
          );
          return updatedPost;
        } catch (error) {
          console.log(error);
          set({ error });
          throw error;
        } finally {
          set({ isEditingPost: false });
        }
      },

      deleteMentorPost: async (postID) => {
        set({ isDeletingPost: true });
        try {
          await API.delete(`/api/mentor/deteMentorPost/${postID}`);
        } catch (error) {
          console.log(error);
          set({ error });
          throw error;
        } finally {
          set({ isDeletingPost: false });
        }
      },
      getMentorByID: async (mentorID) => {
        set({ isDeletingPost: true });
        try {
          const res = await API.get(`/api/mentor/getMentorByID/${mentorID}`);
          return res.data.mentor;
        } catch (error) {
          console.log(error);
          set({ error });
          throw error;
        } finally {
          set({ isDeletingPost: false });
        }
      },
      submitUserReview: async (mentorID, rating, userId, review) => {
        set({ isLoading: true, error: "" });
        try {
          const res = await API.post(`/api/mentor/review/${mentorID}`, {
            rating,
            review: review,
            userId,
          });

          set((state) => {
            const updatedMentor = { ...state.mentor };
            if (!updatedMentor.reviews) updatedMentor.reviews = [];
            updatedMentor.reviews.push(res.data.review);
            updatedMentor.reviewsCount = updatedMentor.reviews.length;

            const total = updatedMentor.reviews.reduce(
              (acc, r) => acc + r.rating,
              0,
            );
            updatedMentor.rating = total / updatedMentor.reviews.length;

            return { mentor: updatedMentor };
          });

          return res.data;
        } catch (error) {
          console.error("Failed to submit review:", error);
          set({
            error: error?.response?.data?.message || "Something went wrong",
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      startMentorSubscription: async (mentorID) => {
        set({ isSubscribingToMentor: true });
        try {
          const res = await API.post("/api/mentor/checkout", {
            mentorId: mentorID,
          });
          window.location.href = res.data.url;
        } catch (err) {
          console.log(err);
        } finally {
          set({ isSubscribingToMentor: false });
        }
      },
    }),
    {
      name: "mentor-store",
      partialize: (state) => ({
        mentor: state.mentor,
        isMentorMode: state.isMentorMode,
      }),
    },
  ),
);

export default useMentorStore;
