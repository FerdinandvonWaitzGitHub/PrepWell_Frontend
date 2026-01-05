/**
 * Logo component
 * PrepWell logo displayed in the header
 */
const Logo = ({ className = '' }) => {
  return (
    <div className={`flex items-center h-9 ${className}`}>
      {/* Logo SVG - simplified version */}
      {/* Replace this with your actual PrepWell logo SVG */}
      <div className="flex items-center gap-1">
        <svg
          width="103"
          height="24"
          viewBox="0 0 103 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-black"
        >
          {/* This is a placeholder - replace with actual PrepWell logo paths */}
          <text
            x="0"
            y="18"
            fontSize="18"
            fontWeight="600"
            fill="currentColor"
            fontFamily="DM Sans, sans-serif"
          >
            PrepWell
          </text>
        </svg>
      </div>
    </div>
  );
};

export default Logo;
