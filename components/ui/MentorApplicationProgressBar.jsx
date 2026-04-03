const labels = ["Start", "Identity", "Exp.", "Risk", "Logistics", "Review"];

const ProgressBar = ({ step }) => (
  <div className="mb-8 rounded-lg">
    <div className="flex justify-between text-xs font-bold mb-2">
      {labels.map((l, i) => (
        <span key={l} className={step >= i ? "text-primary" : ""}>
          {l}
        </span>
      ))}
    </div>
    <div className="h-2 bg-light-hover rounded-lg">
      <div
        className="h-full bg-primary transition-all rounded-lg"
        style={{ width: `${(step / (labels.length - 1)) * 100}%` }}
      />
    </div>
  </div>
);

export default ProgressBar;
