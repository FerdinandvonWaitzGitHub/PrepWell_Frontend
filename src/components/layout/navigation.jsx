import React, { useState } from 'react';
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
  const { isNavItemDisabled, isExamMode } = useAppMode();

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
      submenu: [
        { label: 'Leistungen', to: '/verwaltung/leistungen', key: 'verwaltung-leistungen' },
        { label: 'Aufgaben', to: '/verwaltung/aufgaben', key: 'verwaltung-aufgaben' },
      ]
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
    <nav className={`flex items-center gap-8 ${className}`}>
      {navItems.map((item, index) => {
        const active = isActive(item);
        const hasSubmenu = !!item.submenu;
        const disabled = isNavItemDisabled(item.key);

        // Disabled item styling
        const disabledClass = 'text-gray-300 cursor-not-allowed';
        const activeClass = 'text-gray-900 border-b border-gray-900 pb-1';
        const normalClass = 'text-gray-600 hover:text-gray-900';

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
                className={`text-sm font-normal transition-colors ${getItemClass()}`}
                aria-expanded={openDropdown === item.key}
                disabled={disabled}
              >
                {item.label}
              </button>
            ) : disabled ? (
              <span
                className={`text-sm font-normal ${disabledClass}`}
                title="Nur im Examen-Modus verfügbar"
              >
                {item.label}
              </span>
            ) : (
              <NavLink
                to={item.to}
                className={`text-sm font-normal transition-colors ${getItemClass()}`}
              >
                {item.label}
              </NavLink>
            )}

            {/* Dropdown Menu */}
            {hasSubmenu && openDropdown === item.key && !disabled && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded shadow-lg py-2 min-w-[180px] z-50">
                {item.submenu.map((subItem, subIndex) => (
                  <Link
                    key={subIndex}
                    to={subItem.to}
                    onClick={() => setOpenDropdown(null)}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      subItem.key === currentPage
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {subItem.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Navigation;
