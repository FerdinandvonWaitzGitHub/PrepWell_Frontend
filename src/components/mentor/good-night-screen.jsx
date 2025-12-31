import { useNavigate } from 'react-router-dom';
import { Header } from '../layout';

/**
 * GoodNightScreen - Shown after completing evening Check-Out
 *
 * Simple centered message with logout option
 */
const GoodNightScreen = ({ userName = 'User', onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    // Navigate to login or home after logout
    navigate('/');
  };

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header - minimal */}
      <div className="shrink-0 h-20 px-12 py-2 flex items-center">
        <div className="w-24 h-9 flex flex-col justify-center items-center">
          <span className="text-black text-xl font-medium">PrepWell</span>
          <span className="text-black text-xs">®</span>
        </div>
      </div>

      {/* Main Content - centered message */}
      <div className="flex-1 px-12 flex flex-col justify-center items-center gap-10">
        <div className="max-w-[1058px] w-full flex justify-center items-center">
          <h1 className="text-center text-neutral-900 text-4xl lg:text-5xl font-extralight leading-tight">
            Gute Nacht, {userName}.
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-slate-600 text-white rounded-full text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Zurück zur Startseite
          </button>

          <button
            onClick={handleLogout}
            className="px-6 py-2.5 rounded-3xl border border-neutral-200 flex items-center gap-2 hover:bg-neutral-50 transition-colors"
          >
            <span className="text-neutral-700 text-sm font-light">
              Abmelden
            </span>
            <svg className="w-4 h-4 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Footer spacer */}
      <div className="shrink-0 h-14 px-2.5 py-5" />
    </div>
  );
};

export default GoodNightScreen;
