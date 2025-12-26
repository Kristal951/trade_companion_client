import React from "react";
import { motion } from "framer-motion";

const FeatureCard = ({
  title,
  description,
  image,
  imageAlt = "Illustration",
  reverse = false,
  variant,
}) => {
  return (
    <motion.div
      variants={variant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`max-w-6xl w-full min-h-[300px] md:min-h-[400px]
        grid grid-cols-1 md:grid-cols-2 gap-10 items-center
        ${reverse ? "md:flex-row-reverse" : ""}`}
    >
      {/* Image */}
      <div className={`flex justify-center ${reverse ? "md:order-2" : ""}`}>
        <img
          src={image}
          alt={imageAlt}
          className="w-[70%] sm:w-[60%] md:w-[80%] max-w-md"
        />
      </div>

      {/* Text */}
      <div
        className={`flex flex-col gap-4
          text-center md:text-left
          ${reverse ? "md:items-end md:text-right" : ""}`}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark-text">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-mid-text">{description}</p>
      </div>
    </motion.div>
  );
};

export default FeatureCard;
