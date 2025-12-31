import { useState, useMemo } from 'react';
import { useUnterrechtsgebiete } from '../../contexts/unterrechtsgebiete-context';
import { groupByKategorie } from '../../data/unterrechtsgebiete-data';

/**
 * UnterrechtsgebietPicker - Modal dialog for selecting Unterrechtsgebiete
 * Features:
 * - Search field with live filter
 * - Tabs for Rechtsgebiete
 * - Grouped by kategorie
 * - Checkbox multi-select
 * - Create new option
 */
const UnterrechtsgebietPicker = ({
  isOpen,
  onClose,
  onSelect,
  rechtsgebietId = null, // If provided, only show this Rechtsgebiet
  excludeIds = [], // IDs to exclude (already selected)
  multiSelect = true,
}) => {
  const {
    getAllByRechtsgebiet,
    addUnterrechtsgebiet,
    RECHTSGEBIET_LABELS,
    RECHTSGEBIET_COLORS,
  } = useUnterrechtsgebiete();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(rechtsgebietId || 'zivilrecht');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemKategorie, setNewItemKategorie] = useState('');

  // Get all Rechtsgebiete tabs
  const rechtsgebieteTabs = useMemo(() => {
    if (rechtsgebietId) {
      return [{ id: rechtsgebietId, label: RECHTSGEBIET_LABELS[rechtsgebietId] }];
    }
    return Object.entries(RECHTSGEBIET_LABELS).map(([id, label]) => ({ id, label }));
  }, [rechtsgebietId, RECHTSGEBIET_LABELS]);

  // Get and filter Unterrechtsgebiete for active tab
  const filteredItems = useMemo(() => {
    const allItems = getAllByRechtsgebiet(activeTab);

    // Filter out excluded IDs
    let items = allItems.filter(item => !excludeIds.includes(item.id));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.kategorie && item.kategorie.toLowerCase().includes(query))
      );
    }

    return items;
  }, [activeTab, getAllByRechtsgebiet, excludeIds, searchQuery]);

  // Group by kategorie
  const groupedItems = useMemo(() => {
    return groupByKategorie(filteredItems);
  }, [filteredItems]);

  // Get unique categories for new item dropdown
  const categories = useMemo(() => {
    const allItems = getAllByRechtsgebiet(activeTab);
    const cats = new Set(allItems.map(item => item.kategorie).filter(Boolean));
    return Array.from(cats).sort();
  }, [activeTab, getAllByRechtsgebiet]);

  // Handle item toggle
  const handleItemToggle = (item) => {
    if (!multiSelect) {
      // Single select mode - select and close
      onSelect([{ ...item, rechtsgebietId: activeTab }]);
      onClose();
      return;
    }

    setSelectedItems(prev => {
      const isSelected = prev.some(i => i.id === item.id);
      if (isSelected) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, { ...item, rechtsgebietId: activeTab }];
      }
    });
  };

  // Handle confirm selection
  const handleConfirm = () => {
    onSelect(selectedItems);
    setSelectedItems([]);
    onClose();
  };

  // Handle create new
  const handleCreateNew = () => {
    if (!newItemName.trim()) return;

    const newItem = {
      id: `custom-${Date.now()}`,
      name: newItemName.trim(),
      kategorie: newItemKategorie || 'Benutzerdefiniert',
      isCustom: true,
    };

    // Add to context
    addUnterrechtsgebiet(activeTab, newItem);

    // Add to selection
    if (multiSelect) {
      setSelectedItems(prev => [...prev, { ...newItem, rechtsgebietId: activeTab }]);
    } else {
      onSelect([{ ...newItem, rechtsgebietId: activeTab }]);
      onClose();
      return;
    }

    // Reset form
    setNewItemName('');
    setNewItemKategorie('');
    setShowCreateNew(false);
  };

  // Get color for Rechtsgebiet
  const getTabColor = (rgId) => {
    const colors = {
      'zivilrecht': 'border-blue-500 text-blue-700 bg-blue-50',
      'oeffentliches-recht': 'border-green-500 text-green-700 bg-green-50',
      'strafrecht': 'border-red-500 text-red-700 bg-red-50',
      'querschnitt': 'border-purple-500 text-purple-700 bg-purple-50',
    };
    return colors[rgId] || 'border-neutral-500 text-neutral-700 bg-neutral-50';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-xl shadow-2xl w-[700px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            Unterrechtsgebiet auswählen
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Wähle ein oder mehrere Unterrechtsgebiete aus der Datenbank
          </p>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-neutral-100">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Namen oder Kategorie..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Tabs */}
        {rechtsgebieteTabs.length > 1 && (
          <div className="px-6 py-2 border-b border-neutral-100 flex gap-2 overflow-x-auto">
            {rechtsgebieteTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? getTabColor(tab.id)
                    : 'border-transparent text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              {searchQuery ? 'Keine Ergebnisse gefunden' : 'Keine Unterrechtsgebiete verfügbar'}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([kategorie, items]) => (
                <div key={kategorie}>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    {kategorie}
                  </h3>
                  <div className="space-y-1">
                    {items.map(item => {
                      const isSelected = selectedItems.some(i => i.id === item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary-50 border border-primary-200'
                              : 'hover:bg-neutral-50 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleItemToggle(item)}
                            className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-400"
                          />
                          <span className={`text-sm ${isSelected ? 'text-primary-700 font-medium' : 'text-neutral-700'}`}>
                            {item.name}
                          </span>
                          {item.isCustom && (
                            <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                              Benutzerdefiniert
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create New Section */}
          <div className="mt-6 pt-4 border-t border-neutral-200">
            {!showCreateNew ? (
              <button
                onClick={() => setShowCreateNew(true)}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <PlusIcon size={16} />
                Neues Unterrechtsgebiet erstellen
              </button>
            ) : (
              <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-neutral-900">Neues Unterrechtsgebiet</h4>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Name eingeben..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  autoFocus
                />
                <select
                  value={newItemKategorie}
                  onChange={(e) => setNewItemKategorie(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                >
                  <option value="">Kategorie wählen (optional)</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Benutzerdefiniert">Benutzerdefiniert</option>
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowCreateNew(false);
                      setNewItemName('');
                      setNewItemKategorie('');
                    }}
                    className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleCreateNew}
                    disabled={!newItemName.trim()}
                    className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Erstellen & Hinzufügen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
          <div className="text-sm text-neutral-500">
            {selectedItems.length > 0 && (
              <span>{selectedItems.length} ausgewählt</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedItems.length === 0}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Hinzufügen {selectedItems.length > 0 && `(${selectedItems.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Icons
const SearchIcon = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const PlusIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default UnterrechtsgebietPicker;
