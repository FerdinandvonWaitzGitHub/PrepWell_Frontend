import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckIn, CHECKIN_QUESTIONS, CHECKOUT_QUESTIONS } from '../../contexts/checkin-context';
import { Header } from '../layout';

/**
 * CheckInQuestionnaire - Full-page questionnaire for Well Score check-in
 *
 * Shows all questions on one page with horizontal pill-button options
 * Design based on Figma "Check-In" screen
 * Responsive: fits on screen without scrolling
 */
const CheckInQuestionnaire = ({ onComplete, onSkip }) => {
  const navigate = useNavigate();
  const { submitCheckIn, skipCheckIn, getCurrentPeriod } = useCheckIn();

  // Determine if morning (Check-In) or evening (Check-Out)
  const currentPeriod = getCurrentPeriod();
  const isEvening = currentPeriod === 'evening';

  // Use appropriate questions based on period
  const questions = isEvening ? CHECKOUT_QUESTIONS : CHECKIN_QUESTIONS;

  // Answers: { [questionId]: value }
  const [answers, setAnswers] = useState({});

  const totalQuestions = questions.length;
  const allAnswered = Object.keys(answers).length === totalQuestions;

  // Handle option selection
  const handleOptionSelect = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Handle submit
  const handleSubmit = () => {
    if (!allAnswered) return;

    submitCheckIn(answers, getCurrentPeriod());
    if (onComplete) {
      onComplete();
    } else {
      navigate('/');
    }
  };

  // Handle skip
  const handleSkip = () => {
    skipCheckIn(getCurrentPeriod());
    if (onSkip) {
      onSkip();
    } else {
      navigate('/');
    }
  };

  // Get titles based on period
  const title = isEvening ? 'Dein Check-Out am Abend' : 'Dein Check-In am Morgen';
  const subtitle = isEvening
    ? 'Nimm dir einen Augenblick Zeit für dich, um zu reflektieren, wie dein Tag war.'
    : 'Nimm dir einen Augenblick Zeit für dich, um zu reflektieren, wie du heute in den Tag startest.';

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <Header userInitials="CN" currentPage="checkin" />

      {/* Main Content - fills remaining space */}
      <div className="flex-1 flex flex-col min-h-0 px-4 lg:px-8 pb-4">
        {/* Title Section */}
        <div className="shrink-0 bg-neutral-200 py-4 lg:py-6 px-4">
          <div className="max-w-[1389px] mx-auto flex flex-col items-center gap-2 lg:gap-4">
            <h1 className="text-center text-neutral-900 text-2xl lg:text-4xl xl:text-5xl font-extralight leading-tight">
              {title}
            </h1>
            <p className="max-w-[900px] text-center text-neutral-500 text-xs lg:text-sm font-light leading-5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="shrink-0 h-px bg-neutral-200 my-3 lg:my-4" />

        {/* Questions Section - flexible, takes remaining space */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 max-w-[1252px] w-full mx-auto bg-neutral-200 rounded-lg p-3 lg:p-6 flex flex-col gap-2 lg:gap-4 overflow-auto">
            {questions.map((question) => (
              <QuestionRow
                key={question.id}
                question={question}
                selectedValue={answers[question.id]}
                onSelect={(value) => handleOptionSelect(question.id, value)}
              />
            ))}
          </div>

          {/* Submit Button */}
          {allAnswered && (
            <div className="shrink-0 flex justify-center pt-3 lg:pt-4">
              <button
                onClick={handleSubmit}
                className="px-6 lg:px-8 py-2.5 lg:py-3 bg-slate-600 text-white rounded-full text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                {isEvening ? 'Check-Out absenden' : 'Check-In absenden'}
              </button>
            </div>
          )}
        </div>

        {/* Footer - Skip Button */}
        <div className="shrink-0 pt-3 lg:pt-4">
          <button
            onClick={handleSkip}
            className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-3xl border border-neutral-200 flex items-center gap-2 hover:bg-neutral-50 transition-colors"
          >
            <span className="text-neutral-700 text-xs lg:text-sm font-light">
              Mentor Quiz überspringen
            </span>
            <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-neutral-900" viewBox="0 0 16 16" fill="none">
              <path d="M3.33 8h9.33M9.33 4.67L12.67 8l-3.34 3.33" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * QuestionRow - Single question with horizontal pill options
 * Responsive: stacks on small screens, horizontal on larger
 */
const QuestionRow = ({ question, selectedValue, onSelect }) => {
  return (
    <div className="bg-white rounded-[5px] border border-neutral-200 flex flex-col lg:flex-row lg:items-stretch overflow-hidden">
      {/* Question Text */}
      <div className="shrink-0 lg:w-72 xl:w-96 p-3 lg:p-4 xl:p-6 flex items-center">
        <h2 className="text-neutral-900 text-base lg:text-lg xl:text-2xl font-extralight leading-snug">
          {question.question}
        </h2>
      </div>

      {/* Options */}
      <div className="flex-1 px-3 lg:px-4 xl:px-6 py-2 lg:py-3 xl:py-5 flex items-center">
        <div className="w-full flex flex-wrap lg:flex-nowrap gap-1.5 lg:gap-2 xl:gap-2.5">
          {question.options.map((option) => {
            const isSelected = selectedValue === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onSelect(option.value)}
                className={`flex-1 min-w-0 px-2 lg:px-3 xl:px-4 py-2 lg:py-3 xl:py-4 rounded-full lg:rounded-[30px] flex justify-center items-center transition-all ${
                  isSelected
                    ? 'bg-slate-600 text-white'
                    : 'border border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <span className="text-xs lg:text-sm font-normal leading-tight text-center whitespace-nowrap overflow-hidden text-ellipsis">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CheckInQuestionnaire;
