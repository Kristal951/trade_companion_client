import React from "react";

const Spinner = ({w, h, color="white"}) => {
  return (
    <div className={`h-${h} w-${w} animate-spin rounded-full border-2 border-${color} border-t-transparent`}/>
  );
};

export default Spinner;
