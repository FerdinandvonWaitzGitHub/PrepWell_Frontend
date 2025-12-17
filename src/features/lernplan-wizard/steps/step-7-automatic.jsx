import { useState } from 'react';
import { useWizard } from '../context/wizard-context';
import { ChevronDown, Plus, GripVertical, Trash2 } from 'lucide-react';

/**
 * Step 7 - Automatic Path: Manual list creation
 * User creates Rechtsgebiete → Unterrechtsgebiete → Lerntage → Themen → Aufgaben
 * Based on Figma: Schritt_7_Alt_2_body (Listen-Editor)
 */

// Rechtsgebiet colors
const RECHTSGEBIET_COLORS = {
  'Zivilrecht': { bg: 'bg-blue-900', text: 'text-blue-100' },
  'Öffentliches Recht': { bg: 'bg-green-900', text: 'text-green-100' },
  'Strafrecht': { bg: 'bg-red-900', text: 'text-red-50' },
};

const Step7Automatic = () => {
  const { blocksPerDay, updateWizardData, manualLernplan } = useWizard();

  // Local state for the editor
  const [selectedRechtsgebiet, setSelectedRechtsgebiet] = useState('Zivilrecht');
  const [selectedUnterrechtsgebiet, setSelectedUnterrechtsgebiet] = useState(null);
  const [showRechtsgebietDropdown, setShowRechtsgebietDropdown] = useState(false);
  const [showUnterrechtsgebietDropdown, setShowUnterrechtsgebietDropdown] = useState(false);

  // Initialize lernplan data structure if not exists
  const lernplan = manualLernplan || {
    rechtsgebiete: {
      'Zivilrecht': { unterrechtsgebiete: {} },
      'Öffentliches Recht': { unterrechtsgebiete: {} },
      'Strafrecht': { unterrechtsgebiete: {} },
    }
  };

  // Get current Unterrechtsgebiete for selected Rechtsgebiet
  const currentUnterrechtsgebiete = Object.keys(
    lernplan.rechtsgebiete[selectedRechtsgebiet]?.unterrechtsgebiete || {}
  );

  // Get current Unterrechtsgebiet data
  const currentUnterrechtsgebietData = selectedUnterrechtsgebiet
    ? lernplan.rechtsgebiete[selectedRechtsgebiet]?.unterrechtsgebiete[selectedUnterrechtsgebiet]
    : null;

  // Update lernplan in context
  const updateLernplan = (newLernplan) => {
    updateWizardData({ manualLernplan: newLernplan });
  };

  // Add new Unterrechtsgebiet
  const addUnterrechtsgebiet = () => {
    const newName = `Neues Unterrechtsgebiet ${currentUnterrechtsgebiete.length + 1}`;
    const newLernplan = { ...lernplan };
    newLernplan.rechtsgebiete[selectedRechtsgebiet].unterrechtsgebiete[newName] = {
      beschreibung: '',
      lerntage: []
    };
    updateLernplan(newLernplan);
    setSelectedUnterrechtsgebiet(newName);
  };

  // Add new Lerntag
  const addLerntag = () => {
    if (!selectedUnterrechtsgebiet) return;
    const newLernplan = { ...lernplan };
    const lerntage = newLernplan.rechtsgebiete[selectedRechtsgebiet].unterrechtsgebiete[selectedUnterrechtsgebiet].lerntage;
    lerntage.push({
      id: `lt-${Date.now()}`,
      themen: [{
        id: `th-${Date.now()}`,
        titel: '',
        beschreibung: '',
        bloecke: 1,
        aufgaben: []
      }]
    });
    updateLernplan(newLernplan);
  };

  // Add Thema to Lerntag
  const addThema = (lerntagIndex) => {
    if (!selectedUnterrechtsgebiet) return;
    const newLernplan = { ...lernplan };
    const lerntag = newLernplan.rechtsgebiete[selectedRechtsgebiet].unterrechtsgebiete[selectedUnterrechtsgebiet].lerntage[lerntagIndex];

    // Check if we can add more Themen (based on blocksPerDay)
    const currentBlocks = lerntag.themen.reduce((sum, t) => sum + t.bloecke, 0);
    if (currentBlocks >= blocksPerDay) return;

    lerntag.themen.push({
      id: `th-${Date.now()}`,
      titel: '',
      beschreibung: '',
      bloecke: 1,
      aufgaben: []
    });
    updateLernplan(newLernplan);
  };

  // Update Thema
  const updateThema = (lerntagIndex, themaIndex, field, value) => {
    if (!selectedUnterrechtsgebiet) return;
    const newLernplan = { ...lernplan };
    newLernplan.rechtsgebiete[selectedRechtsgebiet].unterrechtsgebiete[selectedUnterrechtsgebiet].lerntage[lerntagIndex].themen[themaIndex][field] = value;
    updateLernplan(newLernplan);
  };

  // Add Aufgabe to Thema
  const addAufgabe = (lerntagIndex, themaIndex) => {
    if (!selectedUnterrechtsgebiet) return;
    const newLernplan = { ...lernplan };
    const thema = newLernplan.rechtsgebiete[selectedRechtsgebiet].unterrechtsgebiete[selectedUnterrechtsgebiet].lerntage[lerntagIndex].themen[themaIndex];
    thema.aufgaben.push({
      id: `auf-${Date.now()}`,
      titel: 'Neue Aufgabe',
      beschreibung: '',
      wichtig: false,
      erledigt: false
    });
    updateLernplan(newLernplan);
  };

  // Get colors for current Rechtsgebiet
  const colors = RECHTSGEBIET_COLORS[selectedRechtsgebiet] || { bg: 'bg-gray-900', text: 'text-gray-100' };

  return (
    <div className="flex flex-col items-center gap-9">
      {/* Dropdowns */}
      <div className="flex flex-col items-center gap-3.5">
        {/* Rechtsgebiet Dropdown */}
        <div className="flex items-center gap-3.5">
          <span className="text-gray-900 text-lg font-light">Rechtsgebiet auswählen</span>
          <div className="relative">
            <button
              onClick={() => setShowRechtsgebietDropdown(!showRechtsgebietDropdown)}
              className="h-9 pl-5 pr-4 py-2 bg-white rounded-lg border border-gray-300 flex items-center gap-2"
            >
              <span className="text-gray-900 text-sm font-light">{selectedRechtsgebiet}</span>
              <ChevronDown className="w-4 h-4 text-gray-900" />
            </button>
            {showRechtsgebietDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {Object.keys(RECHTSGEBIET_COLORS).map((rg) => (
                  <button
                    key={rg}
                    onClick={() => {
                      setSelectedRechtsgebiet(rg);
                      setSelectedUnterrechtsgebiet(null);
                      setShowRechtsgebietDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    {rg}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Unterrechtsgebiet Dropdown */}
        <div className="flex items-center gap-3.5">
          <span className="text-gray-900 text-lg font-light">Unterrechtsgebiet auswählen</span>
          <div className="relative">
            <button
              onClick={() => setShowUnterrechtsgebietDropdown(!showUnterrechtsgebietDropdown)}
              className="h-9 pl-5 pr-4 py-2 bg-white rounded-lg border border-gray-300 flex items-center gap-2"
            >
              <span className="text-gray-900 text-sm font-light">
                {selectedUnterrechtsgebiet || 'Neues Unterrechtsgebiet'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-900" />
            </button>
            {showUnterrechtsgebietDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                {currentUnterrechtsgebiete.map((urg) => (
                  <button
                    key={urg}
                    onClick={() => {
                      setSelectedUnterrechtsgebiet(urg);
                      setShowUnterrechtsgebietDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    {urg}
                  </button>
                ))}
                <button
                  onClick={() => {
                    addUnterrechtsgebiet();
                    setShowUnterrechtsgebietDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 border-t border-gray-100 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Neues Unterrechtsgebiet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full flex flex-col items-center gap-7">
        {/* Unterrechtsgebiet Header */}
        {selectedUnterrechtsgebiet && (
          <div className="flex flex-col items-center">
            <div className={`px-2 py-0.5 ${colors.bg} rounded-lg`}>
              <span className={`${colors.text} text-xs font-semibold`}>{selectedRechtsgebiet}</span>
            </div>
            <div className="bg-white flex flex-col items-center px-2.5 pt-1 pb-2.5 gap-2.5">
              <input
                type="text"
                value={selectedUnterrechtsgebiet}
                onChange={(e) => {
                  // Rename Unterrechtsgebiet
                  const newLernplan = { ...lernplan };
                  const data = newLernplan.rechtsgebiete[selectedRechtsgebiet].unterrechtsgebiete[selectedUnterrechtsgebiet];
                  delete newLernplan.rechtsgebiete[selectedRechtsgebiet].unterrechtsgebiete[selectedUnterrechtsgebiet];
                  newLernplan.rechtsgebiete[selectedRechtsgebiet].unterrechtsgebiete[e.target.value] = data;
                  updateLernplan(newLernplan);
                  setSelectedUnterrechtsgebiet(e.target.value);
                }}
                className="text-center text-gray-900 text-2xl font-extralight bg-transparent border-none outline-none"
                placeholder="Neues Unterrechtsgebiet..."
              />
              <input
                type="text"
                value={currentUnterrechtsgebietData?.beschreibung || ''}
                onChange={(e) => {
                  const newLernplan = { ...lernplan };
                  newLernplan.rechtsgebiete[selectedRechtsgebiet].unterrechtsgebiete[selectedUnterrechtsgebiet].beschreibung = e.target.value;
                  updateLernplan(newLernplan);
                }}
                className="w-[717px] text-center text-gray-400 text-sm font-normal bg-transparent border-none outline-none"
                placeholder="Beschreibung hinzufügen..."
              />
            </div>
          </div>
        )}

        {/* Lerntage Cards */}
        {selectedUnterrechtsgebiet && currentUnterrechtsgebietData && (
          <div className="w-full px-14 flex justify-center items-start gap-10 flex-wrap">
            {currentUnterrechtsgebietData.lerntage.map((lerntag, lerntagIndex) => {
              const totalBlocks = lerntag.themen.reduce((sum, t) => sum + t.bloecke, 0);

              return (
                <div
                  key={lerntag.id}
                  className="p-5 bg-white rounded-[5px] border border-neutral-200 flex flex-col gap-5 min-w-[400px]"
                >
                  {/* Lerntag Header */}
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-gray-100 rounded-lg">
                      <span className="text-gray-600 text-xs font-semibold">Lerntag {lerntagIndex + 1}</span>
                    </div>
                  </div>

                  {/* Themen */}
                  {lerntag.themen.map((thema, themaIndex) => (
                    <div key={thema.id} className="flex flex-col gap-5">
                      {/* Thema Header */}
                      <div className="px-2.5 pt-1 pb-2.5 flex flex-col gap-2.5">
                        <div className="flex items-center gap-5">
                          <span className="text-gray-900 text-lg font-semibold">
                            {themaIndex + 1}. Thema
                          </span>
                          <div className="px-2 py-0.5 bg-gray-100 rounded-lg">
                            <span className="text-gray-600 text-xs font-semibold">
                              {thema.bloecke}/{blocksPerDay} Blöcke
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const newLernplan = { ...lernplan };
                              newLernplan.rechtsgebiete[selectedRechtsgebiet].unterrechtsgebiete[selectedUnterrechtsgebiet].lerntage[lerntagIndex].themen.splice(themaIndex, 1);
                              updateLernplan(newLernplan);
                            }}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={thema.beschreibung}
                          onChange={(e) => updateThema(lerntagIndex, themaIndex, 'beschreibung', e.target.value)}
                          className="w-96 text-gray-400 text-sm font-normal bg-transparent border-none outline-none"
                          placeholder="Beschreibung hinzufügen..."
                        />
                      </div>

                      {/* Aufgaben */}
                      <div className="px-2.5 flex gap-4">
                        <div className="w-[5px] flex items-center">
                          <div className="w-0 h-full border-l-2 border-neutral-200" />
                        </div>
                        <div className="flex flex-col gap-2.5">
                          {thema.aufgaben.map((aufgabe, aufgabeIndex) => (
                            <div
                              key={aufgabe.id}
                              className="w-96 p-2.5 rounded-lg border border-gray-200 flex justify-between items-center"
                            >
                              <div className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={aufgabe.erledigt}
                                  onChange={(e) => {
                                    const newLernplan = { ...lernplan };
                                    newLernplan.rechtsgebiete[selectedRechtsgebiet].unterrechtsgebiete[selectedUnterrechtsgebiet].lerntage[lerntagIndex].themen[themaIndex].aufgaben[aufgabeIndex].erledigt = e.target.checked;
                                    updateLernplan(newLernplan);
                                  }}
                                  className="w-4 h-4 rounded border border-gray-300"
                                />
                                <div className="flex flex-col gap-1.5">
                                  <input
                                    type="text"
                                    value={aufgabe.titel}
                                    onChange={(e) => {
                                      const newLernplan = { ...lernplan };
                                      newLernplan.rechtsgebiete[selectedRechtsgebiet].unterrechtsgebiete[selectedUnterrechtsgebiet].lerntage[lerntagIndex].themen[themaIndex].aufgaben[aufgabeIndex].titel = e.target.value;
                                      updateLernplan(newLernplan);
                                    }}
                                    className="text-gray-900 text-sm font-medium bg-transparent border-none outline-none"
                                    placeholder="Aufgabe"
                                  />
                                  <input
                                    type="text"
                                    value={aufgabe.beschreibung}
                                    onChange={(e) => {
                                      const newLernplan = { ...lernplan };
                                      newLernplan.rechtsgebiete[selectedRechtsgebiet].unterrechtsgebiete[selectedUnterrechtsgebiet].lerntage[lerntagIndex].themen[themaIndex].aufgaben[aufgabeIndex].beschreibung = e.target.value;
                                      updateLernplan(newLernplan);
                                    }}
                                    className="text-gray-500 text-sm font-normal bg-transparent border-none outline-none"
                                    placeholder="Aufgabenbeschreibung"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center">
                                <button
                                  onClick={() => {
                                    const newLernplan = { ...lernplan };
                                    newLernplan.rechtsgebiete[selectedRechtsgebiet].unterrechtsgebiete[selectedUnterrechtsgebiet].lerntage[lerntagIndex].themen[themaIndex].aufgaben[aufgabeIndex].wichtig = !aufgabe.wichtig;
                                    updateLernplan(newLernplan);
                                  }}
                                  className={`h-8 px-0.5 rounded-lg ${aufgabe.wichtig ? 'text-red-500' : 'text-gray-300'}`}
                                >
                                  <span className="text-xl font-semibold">!</span>
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => addAufgabe(lerntagIndex, themaIndex)}
                            className="h-8 px-3 py-2 bg-white rounded-lg border border-gray-300 flex items-center gap-2"
                          >
                            <span className="text-gray-900 text-xs font-medium">Aufgabe hinzufügen</span>
                            <Plus className="w-4 h-4 text-gray-900" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Thema Button (if space available) */}
                  {totalBlocks < blocksPerDay && (
                    <div className="opacity-25">
                      <button
                        onClick={() => addThema(lerntagIndex)}
                        className="px-2.5 pt-1 pb-2.5"
                      >
                        <span className="text-gray-900 text-lg font-semibold">
                          {lerntag.themen.length + 1}. Neues Thema erstellen...
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Lerntag Button */}
            <button
              onClick={addLerntag}
              className="p-5 bg-white rounded-[5px] border border-dashed border-neutral-300 flex flex-col items-center justify-center gap-2 min-w-[400px] min-h-[200px] hover:bg-gray-50"
            >
              <Plus className="w-8 h-8 text-gray-400" />
              <span className="text-gray-400 text-sm">Lerntag hinzufügen</span>
            </button>
          </div>
        )}

        {/* Empty State - No Unterrechtsgebiet selected */}
        {!selectedUnterrechtsgebiet && (
          <div className="flex flex-col items-center gap-4 py-20">
            <p className="text-gray-500 text-lg">Wähle oder erstelle ein Unterrechtsgebiet, um Lerntage hinzuzufügen.</p>
            <button
              onClick={addUnterrechtsgebiet}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-3xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-light">Neues Unterrechtsgebiet erstellen</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step7Automatic;
