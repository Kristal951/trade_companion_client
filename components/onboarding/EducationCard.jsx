import React from "react";
import { motion } from "framer-motion";
import Icon from "../ui/Icon";

const EducationCard = ({cardVariant, iconName, title, subText}) => {
  return (
      <motion.div
        variants={cardVariant}
        transition={{ duration: 0.6 }}
        className="bg-[#111827] p-8 rounded-xl shadow-md border border-light-gray text-center"
      >
        <Icon
          name={iconName}
          className="w-14 h-14 text-primary mx-auto mb-4"
        />
        <h4 className="text-2xl font-semibold">{title}</h4>
        <p className="text-mid-text mt-2">
         {subText}
        </p>
      </motion.div>
  );
};

export default EducationCard;
