import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckIn, CHECKIN_QUESTIONS } from '../../contexts/checkin-context';

/**
 * CheckInQuestionnaire - Full-page questionnaire for Well Score check-in
 *
 * Shows 4 questions with 5-point scale answers
 * Can be submitted or skipped
 */
const CheckInQuestionnaire = ({ onComplete, onSkip }) => {
  const navigate = useNavigate();
  const { submitCheckIn, skipCheckIn, getCurrentPeriod } = useCheckIn();

  // Current question index
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Answers: { [questionId]: value }
  const [answers, setAnswers] = useState({});

  const currentQuestion = CHECKIN_QUESTIONS[currentQuestionIndex];
  const totalQuestions = CHECKIN_QUESTIONS.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const allAnswered = Object.keys(answers).length === totalQuestions;

  // Handle option selection
  const handleOptionSelect = (value) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));

    // Auto-advance to next question after short delay
    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300);
    }
  };

  // Handle submit
  const handleSubmit = () => {
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

  // Go to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Get period label for header
  const periodLabel = getCurrentPeriod() === 'evening' ? 'Abend' : 'Morgen';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-gray-900 mb-2">
            {periodLabel}-Check-In
          </h1>
          <p className="text-gray-500 text-sm">
            Beantworte kurz diese Fragen, um deinen Well-Score zu aktualisieren
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-8 justify-center">
          {CHECKIN_QUESTIONS.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-12 rounded-full transition-colors ${
                index < currentQuestionIndex
                  ? 'bg-blue-600'
                  : index === currentQuestionIndex
                  ? 'bg-blue-400'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          {/* Question number */}
          <div className="text-sm text-gray-400 mb-2">
            Frage {currentQuestionIndex + 1} von {totalQuestions}
          </div>

          {/* Question text */}
          <h2 className="text-xl font-normal text-gray-900 mb-8">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  className={`w-full py-4 px-5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Radio indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-blue-600' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span className="text-base">{option.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {/* Previous button */}
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-5 py-2.5 rounded-full text-sm transition-colors ${
                currentQuestionIndex === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Zurück
            </button>

            {/* Next/Submit button */}
            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  allAnswered
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Absenden
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                disabled={!answers[currentQuestion.id]}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  answers[currentQuestion.id]
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Weiter
              </button>
            )}
          </div>
        </div>

        {/* Skip button */}
        <div className="text-center mt-6">
          <button
            onClick={handleSkip}
            className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            Mentor Quiz überspringen
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInQuestionnaire;
