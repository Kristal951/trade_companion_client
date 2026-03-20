import React, { useMemo, useState } from "react";
import Icon from "../ui/Icon";
import useMentorStore from "@/store/mentorStore";

const StarRating: React.FC<{ rating?: number }> = ({ rating }) => {
  if (rating === undefined || rating === null) {
    return (
      <span className="text-xs text-mid-text italic font-medium">
        Not Rated
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Icon
          key={i}
          name="star"
          className={`w-4 h-4 transition-colors ${
            i < Math.round(rating)
              ? "text-warning fill-current"
              : "text-light-gray"
          }`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-mid-text">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

const formatDate = (date?: string | Date) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return String(date);

  return parsedDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const FollowersPage: React.FC = () => {
  const { mentor } = useMentorStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "All" | "Active" | "Inactive"
  >("All");

  const followers = mentor?.subscribers || [];
  const reviews = mentor?.reviews || [];

  const processedData = useMemo(() => {
    const ratingsLookup = new Map<string, number>();

    reviews.forEach((rev) => {
      if (rev.user) ratingsLookup.set(String(rev.user), rev.rating);
    });

    const filteredFollowers = followers.filter((f) => {
      const matchesSearch = f.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "All" || f.status === filterStatus;

      return matchesSearch && matchesStatus;
    });

    const totalFollowers = followers.length;
    const activeFollowers = followers.filter(
      (f) => f.status === "Active",
    ).length;
    const inactiveFollowers = followers.filter(
      (f) => f.status !== "Active",
    ).length;
    const totalReviews = reviews.length;

    const avgRating =
      totalReviews > 0
        ? reviews.reduce((acc, rev) => acc + (rev.rating || 0), 0) /
          totalReviews
        : 0;

    return {
      filteredFollowers,
      ratingsLookup,
      totalFollowers,
      activeFollowers,
      inactiveFollowers,
      totalReviews,
      avgRating,
    };
  }, [followers, reviews, searchTerm, filterStatus]);

  const {
    filteredFollowers,
    ratingsLookup,
    totalFollowers,
    activeFollowers,
    inactiveFollowers,
    totalReviews,
    avgRating,
  } = processedData;

  return (
    <div className="min-h-screen bg-light-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-dark-text">
              Followers
            </h1>
            <p className="mt-1 text-sm text-mid-text">
              Track your subscribers, review activity, and engagement at a
              glance.
            </p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl border border-light-gray bg-light-surface p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col justify-between h-full">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-dark-text">
                  Active Followers
                </p>
                <p className="mt-2 text-3xl font-black text-dark-text">
                  {activeFollowers}
                </p>
              </div>
              <p className="mt-4 text-[10px] font-medium text-mid-text  pt-2">
                Currently subscribed and active
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-light-gray bg-light-surface p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col justify-between h-full">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-dark-text">
                  Total Followers
                </p>
                <p className="mt-2 text-3xl font-black text-dark-text">
                  {totalFollowers}
                </p>
              </div>
              <p className="mt-4 text-[10px] font-medium text-mid-text  pt-2">
                All subscribers in your audience
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-light-gray bg-light-surface p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col justify-between h-full">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-dark-text">
                  Total Reviews
                </p>
                <p className="mt-2 text-3xl font-black text-dark-text">
                  {totalReviews}
                </p>
              </div>
              <p className="mt-4 text-[10px] font-medium text-mid-text  pt-2">
                Ratings submitted by followers
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-light-gray bg-light-surface p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col justify-between h-full">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-dark-text">
                  Average Rating
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <p className="text-3xl font-black text-dark-text">
                    {avgRating.toFixed(1)}
                  </p>
                  <span className="text-sm font-bold text-mid-text">/ 5.0</span>
                </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-mid-text  pt-2">
                Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-2xl p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-mid-text">
              <Icon name="search" className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search follower by name..."
              className="h-11 w-full rounded-xl border border-light-gray bg-transparent pl-10 pr-4 text-sm text-dark-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["All", "Active", "Inactive"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  filterStatus === status
                    ? "bg-light-hover text-white border border-white shadow-sm"
                    : "bg-light-hover text-mid-text hover:text-dark-text"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-light-gray bg-light-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-light-hover text-xs uppercase tracking-wide text-mid-text">
                <tr>
                  <th className="px-6 py-4 font-semibold">Follower</th>
                  <th className="px-6 py-4 font-semibold">Subscribed Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Rating Given</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-light-gray">
                {filteredFollowers.map((follower, index) => (
                  <tr
                    key={follower.id || follower.userId || index}
                    className="transition hover:bg-light-bg/60"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={follower.avatar || "/api/placeholder/40/40"}
                          alt={follower.name}
                          className="h-11 w-11 rounded-full border border-light-gray object-cover"
                        />
                        <div>
                          <p className="font-semibold text-dark-text">
                            {follower.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-mid-text">
                      {formatDate(follower.subscribedDate)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          follower.status === "Active"
                            ? "bg-success/15 text-success"
                            : "bg-danger/15 text-danger"
                        }`}
                      >
                        {follower.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <StarRating
                        rating={ratingsLookup.get(String(follower.userId))}
                      />
                    </td>
                  </tr>
                ))}

                {filteredFollowers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-4 rounded-full bg-light-bg p-4">
                          <Icon
                            name="users"
                            className="h-8 w-8 text-mid-text"
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-dark-text">
                          No followers found
                        </h3>
                        <p className="mt-2 text-sm text-mid-text">
                          Try changing your search term or filter selection.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowersPage;
