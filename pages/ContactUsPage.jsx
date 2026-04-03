import React from "react";

const ContactUsPage = ({showToast}) => {
  return (
    <div className="p-8 bg-light-bg min-h-full flex items-center justify-center">
      <div className="bg-light-surface p-8 rounded-lg shadow-md border border-light-gray max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-6 text-dark-text">
          Contact Support
        </h2>
        <p className="text-mid-text mb-6">
          Have a question or need assistance? We're here to help.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-text mb-1">
              Subject
            </label>
            <select className="w-full bg-light-hover border-light-gray rounded-md p-2 text-dark-text">
              <option>General Inquiry</option>
              <option>Technical Support</option>
              <option>Billing Issue</option>
              <option>Report a Bug</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-text mb-1">
              Message
            </label>
            <textarea
              rows={5}
              className="w-full bg-light-hover border-light-gray rounded-md p-2 text-dark-text"
              placeholder="Describe your issue..."
            ></textarea>
          </div>
          <button
            onClick={() =>
              showToast(
                "Message sent! We will get back to you shortly.",
                "success"
              )
            }
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg"
          >
            Send Message
          </button>
          <div className="text-center mt-4">
            <p className="text-sm text-mid-text">
              Or email us directly at{" "}
              <a
                href="mailto:support@tradecompanion.app"
                className="text-primary hover:underline"
              >
                support@tradecompanion.app
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
