import React from 'react';

/**
 * CalendarCreationSuccess - Shown when the calendar learning plan was created successfully
 * Based on Figma: Success screen with checkmark icon
 */

const CheckmarkIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
  >
    <polyline
      points="12 24 20 32 36 16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-900"
    />
  </svg>
);

const CalendarCreationSuccess = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col justify-center items-center gap-5 px-12">
      {/* Success Icon */}
      <div className="flex justify-center items-center">
        <div className="w-12 h-12 relative">
          <CheckmarkIcon />
        </div>
      </div>

      {/* Text */}
      <div className="w-full flex flex-col items-center">
        <h1 className="text-center text-gray-900 text-5xl font-extralight leading-[48px]">
          Dein Lernplan wurde erfolgreich erstellt!
        </h1>
      </div>
    </div>
  );
};

export default CalendarCreationSuccess;
