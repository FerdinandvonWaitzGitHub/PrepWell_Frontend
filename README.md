# PrepWell WebApp Frontend

Examensvorbereitung WebApp - Frontend Implementation

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── pages/                     # All application pages
│   ├── dashboard.jsx         # Startseite (Dashboard)
│   ├── lernplaene.jsx        # Lernpläne (placeholder)
│   ├── calendar-week.jsx     # Kalender Wochenansicht
│   ├── calendar-month.jsx    # Kalender Monatsansicht
│   ├── verwaltung-leistungen.jsx    # Verwaltung > Leistungen
│   ├── verwaltung-aufgaben.jsx      # Verwaltung > Aufgaben
│   ├── einstellungen.jsx     # Einstellungen
│   └── mentor.jsx            # AI Mentor
│
├── components/
│   ├── layout/               # Layout components
│   │   ├── header.jsx
│   │   ├── sub-header.jsx
│   │   └── navigation.jsx
│   │
│   ├── dashboard/            # Dashboard components
│   ├── settings/             # Settings components
│   ├── verwaltung/           # Administration components
│   └── mentor/               # Mentor components
│
├── features/                 # Feature modules
│   └── calendar/
│       └── components/
│
├── router.jsx                # React Router configuration
├── main.jsx                  # App entry point
└── index.css                 # Global styles with Tailwind
```

## 🎨 Design System

- **Framework**: React 18.3 with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Font**: DM Sans (Google Fonts)
- **Design Source**: Figma (PrepWell WebApp)

### Design Tokens

- **Colors**: Custom primary, gray, and blue palettes
- **Spacing**: Custom spacing scale (0.5 to 50)
- **Typography**: DM Sans with custom font sizes

## 📄 Pages

| Page | Route | Status | Description |
|------|-------|--------|-------------|
| Startseite | `/` | ✅ Implemented | Dashboard with learning blocks and schedule |
| Lernpläne | `/lernplaene` | ⏸️ Placeholder | Learning plans overview |
| Kalender Woche | `/kalender/woche` | ✅ Implemented | Weekly calendar view |
| Kalender Monat | `/kalender/monat` | ✅ Implemented | Monthly calendar view (fully functional) |
| Verwaltung > Leistungen | `/verwaltung/leistungen` | ✅ Implemented | Services administration |
| Verwaltung > Aufgaben | `/verwaltung/aufgaben` | ✅ Implemented | Tasks management (Kanban) |
| Einstellungen | `/einstellungen` | ✅ Implemented | User settings and preferences |
| Mentor | `/mentor` | ✅ Implemented | AI Mentor dashboard |

## 🔧 Tech Stack

- **React**: 18.3.1
- **React Router**: 6.22.0
- **Vite**: 5.4.11
- **Tailwind CSS**: 3.4.15
- **ESLint**: Code quality and consistency

## 📝 Implementation Status

All 9 pages have been implemented with base layouts and placeholder components:
- ✅ Navigation and routing fully functional
- ✅ Layout components (Header, SubHeader, Navigation)
- ✅ Feature components with placeholder data
- 🔄 Ready for detailed Figma implementation
- 🔄 Ready for backend API integration

## 🎯 Next Steps

1. **Backend Integration**: Connect to API endpoints
2. **State Management**: Implement Redux/Zustand
3. **Authentication**: Add login/logout functionality
4. **Detailed Implementation**: Extract exact designs from Figma
5. **Responsive Design**: Optimize for mobile/tablet
6. **Testing**: Add unit and integration tests

## 📚 Documentation

- `COMPONENTS.md` - Component documentation
- `FIGMA_PAGES.md` - Figma pages mapping
- `FIGMA_EXPORT.md` - Figma export guide
- `SETUP_INSTRUCTIONS.md` - Detailed setup guide

## 🔗 Links

- Figma Design: [PrepWell WebApp](https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp)

## 📄 License

© 2026 PrepWell GmbH
