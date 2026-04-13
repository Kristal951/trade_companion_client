import Icon from "@/components/ui/Icon";
import { EducationArticle } from "@/types";
import { MOCK_EDUCATION_ARTICLES } from "@/utils";
import React from "react";

export const EducationPage: React.FC<{
  onViewContent: (article: EducationArticle) => void;
}> = ({ onViewContent }) => {
  const sections = [
    {
      title: "Beginner's Guide to Forex",
      category: "Forex Basics",
      description:
        "Start your journey here. Learn the terminology and fundamentals of the market.",
    },
    {
      title: "Technical Analysis Masterclass",
      category: "Technical Analysis",
      description:
        "Learn to read charts, identify patterns, and predict future market movements.",
    },
    {
      title: "Risk Management Essentials",
      category: "Risk Management",
      description: "Strategies to protect your capital and trade sustainably.",
    },
    {
      title: "Using Our Signals",
      category: "Using Our Signals",
      description:
        "A guide to interpreting and executing our AI-generated trade setups effectively.",
    },
  ];

  return (
    <div className="p-8 bg-light-bg min-h-full font-sans">
      <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-10 mb-12 text-white shadow-lg">
        <h1 className="text-4xl font-extrabold mb-4">Trading Academy</h1>
        <p className="text-lg opacity-90 max-w-2xl">
          Elevate your trading skills with our curated library of articles,
          books, and video tutorials. Structured for every level of trader.
        </p>
      </div>

      <div className="space-y-16">
        {sections.map((section) => {
          const articles = MOCK_EDUCATION_ARTICLES.filter(
            (a) => a.category === section.category,
          );
          if (articles.length === 0) return null;

          return (
            <section key={section.category} className="animate-fade-in-right">
              <div className="flex items-end justify-between mb-6 border-b border-light-gray pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-dark-text flex items-center">
                    <span className="w-2 h-8 bg-primary rounded-full mr-3"></span>
                    {section.title}
                  </h2>
                  <p className="text-mid-text mt-1 ml-5">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => onViewContent(article)}
                    className="bg-light-surface rounded-xl shadow-sm border border-light-gray overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full transform hover:-translate-y-1"
                  >
                    <div
                      className={`h-1.5 w-full ${
                        article.difficulty === "Beginner"
                          ? "bg-success"
                          : article.difficulty === "Intermediate"
                            ? "bg-warning"
                            : "bg-danger"
                      }`}
                    ></div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-3">
                        <span className="flex items-center text-xs font-bold text-primary uppercase tracking-wide">
                          <Icon
                            name={
                              article.type === "video"
                                ? "play"
                                : article.type === "book"
                                  ? "book"
                                  : "education"
                            }
                            className="w-3 h-3 mr-1"
                          />
                          {article.type}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            article.difficulty === "Beginner"
                              ? "bg-success/5 text-success border-success/20"
                              : article.difficulty === "Intermediate"
                                ? "bg-warning/5 text-warning border-warning/20"
                                : "bg-danger/5 text-danger border-danger/20"
                          }`}
                        >
                          {article.difficulty}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-dark-text mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-mid-text line-clamp-3 flex-1 mb-4">
                        {article.summary}
                      </p>
                      <div className="pt-4 border-t border-light-gray flex items-center text-xs font-bold text-primary uppercase tracking-wider">
                        Read Now{" "}
                        <Icon
                          name="arrowRight"
                          className="w-3 h-3 ml-2 transition-transform group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
