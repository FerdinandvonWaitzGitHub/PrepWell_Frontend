/**
 * StepHeader - Consistent header for each wizard step
 * Based on Figma: Schritt_X_header pattern
 * Centered layout with large extralight title
 */
const StepHeader = ({ step, title, description }) => {
  return (
    <div className="px-4 md:px-36 flex flex-col items-center gap-5 mb-8">
      {/* Step number */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-medium text-neutral-500">
          Schritt {step}
        </span>
      </div>

      {/* Title */}
      <div className="w-full py-[5px] flex justify-center items-center">
        <h1 className="text-center text-3xl md:text-5xl font-extralight text-neutral-900 leading-tight md:leading-[48px]">
          {title}
        </h1>
      </div>

      {/* Description */}
      {description && (
        <p className="w-full max-w-[900px] text-center text-sm font-light text-neutral-500 leading-5">
          {description}
        </p>
      )}
    </div>
  );
};

export default StepHeader;
