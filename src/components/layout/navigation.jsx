import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAppMode } from '../../contexts/appmode-context';

/**
 * Navigation component
 * Main navigation menu for the application based on Figma pages
 *
 * Adapts to app mode:
 * - Exam Mode: All navigation items active
 * - Normal Mode: "Lernplan" items disabled/grayed out
 */
const Navigation = ({ currentPage = 'kalender-monat', className = '' }) => {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);
  // FEAT-002: Use both disabled and hidden for dynamic navigation
  const { isNavItemDisabled, isNavItemHidden, isExamMode } = useAppMode();

  // FEAT-002: Build Verwaltung submenu dynamically based on mode
  const verwaltungSubmenu = [];

  // Übungsklausuren only in Exam mode
  if (isExamMode) {
    verwaltungSubmenu.push({
      label: 'Übungsklausuren',
      to: '/verwaltung/leistungen',
      key: 'verwaltung-leistungen'
    });
  } else {
    // Leistungen (Noten) in Normal mode - Coming Soon
    verwaltungSubmenu.push({
      label: 'Leistungen',
      to: '/verwaltung/leistungen',
      key: 'verwaltung-leistungen',
      comingSoon: true
    });
  }

  // Aufgaben in both modes
  verwaltungSubmenu.push({
    label: 'Aufgaben',
    to: '/verwaltung/aufgaben',
    key: 'verwaltung-aufgaben'
  });

  const navItems = [
    {
      label: 'Startseite',
      to: '/',
      key: 'startseite'
    },
    {
      label: 'Lernpläne',
      to: '/lernplan',
      key: 'lernplan'
    },
    {
      label: 'Kalender',
      key: 'kalender',
      submenu: [
        { label: 'Wochenansicht', to: '/kalender/woche', key: 'kalender-woche' },
        { label: 'Monatsansicht', to: '/kalender/monat', key: 'kalender-monat' },
      ]
    },
    {
      label: 'Verwaltung',
      key: 'verwaltung',
      submenu: verwaltungSubmenu
    },
    {
      label: 'Einstellungen',
      to: '/einstellungen',
      key: 'einstellungen'
    },
    {
      label: 'Mentor',
      to: '/mentor',
      key: 'mentor'
    },
  ];

  const isActive = (item) => {
    // Prefer explicit currentPage prop; otherwise match router location
    if (currentPage && item.key === currentPage) return true;
    if (item.submenu && currentPage) {
      return item.submenu.some((sub) => sub.key === currentPage);
    }

    if (location && item.to) {
      if (item.to === '/') {
        return location.pathname === '/';
      }
      return location.pathname.startsWith(item.to);
    }

    if (item.submenu && location) {
      return item.submenu.some((sub) => location.pathname.startsWith(sub.to));
    }

    return false;
  };

  const toggleDropdown = (key) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  return (
    <nav className={`flex items-center gap-6 ${className}`}>
      {navItems.map((item, index) => {
        const active = isActive(item);
        const hasSubmenu = !!item.submenu;
        const disabled = isNavItemDisabled(item.key);

        // Figma Design System:
        // - Active: font-medium (500), text-neutral-900, NO border
        // - Inactive: font-light (300), text-neutral-500
        // - Disabled: text-neutral-200, cursor-not-allowed
        const disabledClass = 'text-neutral-200 cursor-not-allowed font-light';
        const activeClass = 'text-neutral-900 font-medium';
        const normalClass = 'text-neutral-500 font-light hover:text-neutral-900';

        const getItemClass = () => {
          if (disabled) return disabledClass;
          if (active) return activeClass;
          return normalClass;
        };

        return (
          <div
            key={index}
            className="relative"
          >
            {/* Main Nav Item */}
            {hasSubmenu ? (
              <button
                onClick={() => !disabled && toggleDropdown(item.key)}
                className={`text-sm transition-colors ${getItemClass()}`}
                aria-expanded={openDropdown === item.key}
                disabled={disabled}
              >
                {item.label}
              </button>
            ) : disabled ? (
              <span
                className={`text-sm ${disabledClass}`}
                title="Nur im Examen-Modus verfügbar"
              >
                {item.label}
              </span>
            ) : (
              <NavLink
                to={item.to}
                className={`text-sm transition-colors ${getItemClass()}`}
              >
                {item.label}
              </NavLink>
            )}

            {/* Dropdown Menu */}
            {hasSubmenu && openDropdown === item.key && !disabled && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-neutral-200 rounded-md shadow-sm p-2 min-w-[228px] z-50">
                {item.submenu.map((subItem, subIndex) => {
                  // FEAT-002: Handle Coming Soon items
                  if (subItem.comingSoon) {
                    return (
                      <span
                        key={subIndex}
                        className="block p-2 text-sm text-neutral-200 cursor-not-allowed rounded-sm"
                      >
                        {subItem.label}
                        <span className="ml-2 text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
                          Coming Soon
                        </span>
                      </span>
                    );
                  }

                  return (
                    <Link
                      key={subIndex}
                      to={subItem.to}
                      onClick={() => setOpenDropdown(null)}
                      className={`block p-2 text-sm rounded-sm transition-colors ${
                        subItem.key === currentPage
                          ? 'bg-neutral-100 text-neutral-950 font-medium'
                          : 'text-neutral-500 font-light hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                    >
                      {subItem.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Navigation;
