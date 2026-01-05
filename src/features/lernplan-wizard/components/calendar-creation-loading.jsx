/**
 * CalendarCreationLoading - Shown while creating the calendar learning plan
 * Based on Figma: Loading screen with square icon
 */

const LoadingIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    className="animate-spin"
    style={{ animationDuration: '2s' }}
  >
    <rect
      x="6"
      y="6"
      width="36"
      height="36"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      className="text-neutral-900"
    />
  </svg>
);

const CalendarCreationLoading = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col justify-center items-center gap-5 px-12">
      {/* Loading Icon */}
      <div className="flex justify-center items-center">
        <div className="w-12 h-12 relative">
          <LoadingIcon />
        </div>
      </div>

      {/* Text */}
      <div className="w-full flex flex-col items-center">
        <h1 className="text-center text-neutral-900 text-5xl font-extralight leading-[48px]">
          Dein Lernplan wird im Kalender erstellt...
        </h1>
      </div>
    </div>
  );
};

export default CalendarCreationLoading;
