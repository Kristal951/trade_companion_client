import React from "react";
import { motion } from "framer-motion";
import EducationCard from "../EducationCard";

const Education = () => {
  const cardVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  const containerVariant = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.25,
      },
    },
  };
  return (
    <section id="education" className="py-20 bg-[#111827]">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: false }}
          className="text-center mb-16"
        >
          <h3 className="text-3xl md:text-4xl font-bold">Knowledge is Power</h3>
          <p className="text-mid-text mt-4">
            Our education hub is designed to help you grow, no matter your
            experience level.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false }}
          className="grid md:grid-cols-3 gap-8"
        >
          <EducationCard
            cardVariant={cardVariant}
            iconName="education"
            title="Forex 101"
            subText="Master the basics, from pips and lots to market structure."
          />

          <EducationCard
            cardVariant={cardVariant}
            iconName="analytics"
            title=" Technical Analysis"
            subText="Learn to read charts, identify patterns, and use indicators."
          />

          <EducationCard
            cardVariant={cardVariant}
            iconName="billing"
            title=" Risk Management"
            subText=" Discover strategies to protect your capital and trade
                  sustainably."
          />
        </motion.div>
      </div>
    </section>
  );
};

export default Education;
