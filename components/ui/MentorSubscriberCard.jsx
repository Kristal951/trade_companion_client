import React from "react";

const MentorSubscriberCard = ({sub}) => {
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
          <p className="text-xs text-mid-text">Joined: {sub.subscribedDate}</p>
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
