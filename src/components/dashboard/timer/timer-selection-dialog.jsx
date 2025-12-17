import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from '../../ui/dialog';

/**
 * TimerSelectionDialog - Select timer type (Pomodoro, Countdown, Count-up)
 */
const TimerSelectionDialog = ({ open, onOpenChange, onSelectType }) => {
  const timerOptions = [
    {
      type: 'pomodoro',
      title: 'Pomodoro Timer',
      description: 'Arbeite in fokussierten Sessions mit regelmäßigen Pausen',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      color: 'bg-red-50 text-red-600 border-red-200',
      hoverColor: 'hover:bg-red-100 hover:border-red-300',
    },
    {
      type: 'countdown',
      title: 'Countdown Timer',
      description: 'Setze ein Zeitziel und arbeite darauf hin',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 8 14" />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      hoverColor: 'hover:bg-blue-100 hover:border-blue-300',
    },
    {
      type: 'countup',
      title: 'Stoppuhr',
      description: 'Tracke deine Lernzeit ohne festes Zeitlimit',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2 2" />
          <path d="M5 3L2 6" />
          <path d="M22 6l-3-3" />
          <path d="M12 5V3" />
          <path d="M10 3h4" />
        </svg>
      ),
      color: 'bg-green-50 text-green-600 border-green-200',
      hoverColor: 'hover:bg-green-100 hover:border-green-300',
    },
  ];

  const handleSelect = (type) => {
    onSelectType(type);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Timer auswählen</DialogTitle>
          <DialogDescription>
            Wähle einen Timer-Typ für deine Lernsession
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="pb-6">
          <div className="flex flex-col gap-3">
            {timerOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleSelect(option.type)}
                className={`
                  flex items-center gap-4 p-4 rounded-lg border transition-all
                  ${option.color} ${option.hoverColor}
                  text-left
                `}
              >
                <div className="flex-shrink-0">
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{option.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{option.description}</p>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="flex-shrink-0 text-gray-400"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default TimerSelectionDialog;
