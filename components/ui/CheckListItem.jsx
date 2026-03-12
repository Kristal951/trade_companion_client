import React from "react";
import Icon from "./Icon";

const CheckListItem = ({ icon, title, description }) => {
  return (
    <div className="flex gap-4 p-2 rounded-xl bg-light-hover border border-light-gray">
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <div>
        <h4 className="font-semibold text-dark-text">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
};

export default CheckListItem;