import React from 'react';

/**
 * Close Icon (X)
 */
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-70">
    <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
  </svg>
);

/**
 * Chevron Right Icon
 */
const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/**
 * TimerSelectionDialog - Select timer type (Pomodoro, Countdown, Count-up)
 */
const TimerSelectionDialog = ({ open, onOpenChange, onSelectType }) => {
  if (!open) return null;

  const timerOptions = [
    {
      type: 'pomodoro',
      title: 'Pomodoro Timer',
      description: 'Arbeite in fokussierten Sessions mit regelmäßigen Pausen',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      type: 'countdown',
      title: 'Countdown Timer',
      description: 'Setze ein Zeitziel und arbeite darauf hin',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 8 14" />
        </svg>
      ),
    },
    {
      type: 'countup',
      title: 'Stoppuhr',
      description: 'Tracke deine Lernzeit ohne festes Zeitlimit',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2 2" />
          <path d="M5 3L2 6" />
          <path d="M22 6l-3-3" />
          <path d="M12 5V3" />
          <path d="M10 3h4" />
        </svg>
      ),
    },
  ];

  const handleSelect = (type) => {
    onSelectType(type);
    onOpenChange(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="w-[500px] p-6 relative bg-white rounded-[10px] shadow-lg outline outline-1 outline-offset-[-1px] outline-neutral-200
                     inline-flex flex-col justify-start items-start gap-6 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="self-stretch flex flex-col justify-start items-start gap-1.5">
            <h2 className="self-stretch text-neutral-900 text-lg font-light font-['DM_Sans'] leading-4">
              Timer auswählen
            </h2>
            <p className="text-neutral-500 text-sm font-normal font-['DM_Sans'] leading-5">
              Wähle einen Timer-Typ für deine Lernsession
            </p>
          </div>

          {/* Timer Options */}
          <div className="self-stretch flex flex-col gap-3">
            {timerOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleSelect(option.type)}
                className="w-full flex items-center gap-4 p-4 rounded-lg
                           outline outline-1 outline-offset-[-1px] outline-neutral-200
                           hover:bg-neutral-50 transition-colors text-left"
              >
                <div className="flex-shrink-0 text-neutral-600">
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-neutral-900 text-sm font-light font-['DM_Sans']">
                    {option.title}
                  </h3>
                  <p className="text-neutral-500 text-xs font-light font-['DM_Sans'] mt-0.5">
                    {option.description}
                  </p>
                </div>
                <div className="flex-shrink-0 text-neutral-400">
                  <ChevronRightIcon />
                </div>
              </button>
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="w-4 h-4 absolute right-4 top-4 rounded-sm hover:bg-neutral-100 flex items-center justify-center"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </>
  );
};

export default TimerSelectionDialog;
