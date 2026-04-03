import React from "react";

function getRelativeTime(date) {
  const now = new Date();
  const past = new Date(date);

  const seconds = Math.floor((now - past) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);

    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
}

const MentorSubscriberCard = ({ sub }) => {
  const joinedAgo = getRelativeTime(sub.subscribedDate);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <img
          src={sub.avatar}
          alt={sub.name}
          className="w-10 h-10 rounded-full mr-3"
        />

        <div>
          <p className="font-semibold text-dark-text">{sub.name}</p>
          <p className="text-xs text-mid-text">Joined {joinedAgo}</p>
        </div>
      </div>

      <span
        className={`text-xs font-bold px-2 py-1 rounded-full ${
          sub.status === "Active"
            ? "bg-success/20 text-success"
            : "bg-danger/20 text-danger"
        }`}
      >
        {sub.status}
      </span>
    </div>
  );
};

export default MentorSubscriberCard;
