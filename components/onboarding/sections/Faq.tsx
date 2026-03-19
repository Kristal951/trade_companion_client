import React from "react";
import { Faqs } from "../utils";
import Icon from "@/components/ui/Icon";

const Faq = ({ toggleFaq, openFaq }) => {
  return (
    <section id="faq" className="py-20 bg-[#111827]">
      <div className="container mx-auto px-6 max-w-3xl">
        <h3 className="text-4xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          {Faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[#111827] rounded-lg shadow-md border border-light-gray"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex justify-between items-center text-left p-5 font-semibold"
              >
                <span>{faq.q}</span>
                <Icon
                  name="chevronDown"
                  className={`w-6 h-6 transform transition-transform ${
                    openFaq === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === index && (
                <div className="px-5 pb-5 text-mid-text">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;
