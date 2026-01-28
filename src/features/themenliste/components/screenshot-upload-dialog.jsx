import { useState, useCallback, useEffect } from 'react';
import { X, Upload, FileImage, Loader2, AlertCircle, Trash2 } from 'lucide-react';

/**
 * PW-203: Screenshot Upload Dialog
 *
 * Flow:
 * 1. idle - Drag & Drop area
 * 2. uploaded - "Upload erfolgreich" + "Extrahieren" button
 * 3. extracting - Loading state
 * 4. preview - Editable preview of extracted data
 * 5. error - Error message with retry option
 */

const STEPS = {
  IDLE: 'idle',
  UPLOADED: 'uploaded',
  EXTRACTING: 'extracting',
  PREVIEW: 'preview',
  ERROR: 'error',
};

export default function ScreenshotUploadDialog({
  open,
  onClose,
  onExtract,
  onAccept,
}) {
  const [step, setStep] = useState(STEPS.IDLE);
  const [file, setFile] = useState(null);
  const [fileSize, setFileSize] = useState(null);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  // Reset state when dialog closes
  const handleClose = () => {
    setStep(STEPS.IDLE);
    setFile(null);
    setFileSize(null);
    setError(null);
    setExtractedData(null);
    onClose();
  };

  // Handle file selection (drop or click)
  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile) return;

    // Validate file type
    if (!['image/png', 'image/jpeg'].includes(selectedFile.type)) {
      setError('Nur PNG und JPEG Dateien erlaubt.');
      setStep(STEPS.ERROR);
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Datei zu groß. Maximal 5MB erlaubt.');
      setStep(STEPS.ERROR);
      return;
    }

    setFile(selectedFile);
    setFileSize(Math.round(selectedFile.size / 1024));
    setError(null);
    setStep(STEPS.UPLOADED);
  }, []);

  // Drag & Drop handlers
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  }, [handleFile]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // PW-209: Handle clipboard paste (Strg+V)
  useEffect(() => {
    if (!open) return;

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            handleFile(blob);
          }
          return;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [open, handleFile]);

  // Extract text from image
  const handleExtract = async () => {
    if (!file) return;

    setStep(STEPS.EXTRACTING);
    setError(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);

      // Call parent extract function (OCR API)
      const result = await onExtract(base64);

      // Check for empty result (support both structured data and raw lines)
      const hasData = result?.kapitel?.length > 0 ||
                      result?.themen?.length > 0 ||
                      result?.lines?.length > 0;
      if (!hasData) {
        setError('Kein Text erkannt. Bitte versuche einen anderen Screenshot.');
        setStep(STEPS.ERROR);
        return;
      }

      setExtractedData(result);
      setStep(STEPS.PREVIEW);

      // PW-208: Clear file from memory after extraction
      setFile(null);

    } catch (err) {
      console.error('Extraction failed:', err);
      setError(err.message || 'Extraktion fehlgeschlagen. Bitte erneut versuchen.');
      setStep(STEPS.ERROR);
    }
  };

  // Accept and close
  const handleAccept = () => {
    if (extractedData) {
      onAccept(extractedData);
    }
    handleClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">
            Screenshot hochladen
          </h3>
          <button
            onClick={handleClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-center text-neutral-600 mb-6">
            Lade den Fachplan als Screenshot hoch.
          </p>

          {/* Step: Idle - Drag & Drop */}
          {step === STEPS.IDLE && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-neutral-300 rounded-lg p-12 text-center hover:border-neutral-400 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="hidden"
                id="screenshot-file-input"
              />
              <label htmlFor="screenshot-file-input" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
                <p className="text-neutral-600">
                  Datei hierher ziehen, <span className="text-primary-600 underline">auswählen</span> oder <span className="font-medium">Strg+V</span>
                </p>
                <p className="text-sm text-neutral-400 mt-2">
                  PNG oder JPEG, max 5MB
                </p>
              </label>
            </div>
          )}

          {/* Step: Uploaded - Show success + Extract button */}
          {step === STEPS.UPLOADED && (
            <div className="text-center">
              <div className="inline-flex items-center gap-3 bg-green-50 text-green-700 px-6 py-4 rounded-lg">
                <FileImage className="w-6 h-6" />
                <div className="text-left">
                  <p className="font-medium">Upload erfolgreich</p>
                  <p className="text-sm text-green-600">{fileSize} KB erkannt</p>
                </div>
              </div>
            </div>
          )}

          {/* Step: Extracting - Loading */}
          {step === STEPS.EXTRACTING && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 mx-auto text-primary-600 animate-spin mb-4" />
              <p className="text-neutral-600">Text wird extrahiert...</p>
              <p className="text-sm text-neutral-400 mt-1">Dies kann einige Sekunden dauern.</p>
            </div>
          )}

          {/* Step: Preview - Editable list */}
          {step === STEPS.PREVIEW && extractedData && (
            <PreviewEditor
              data={extractedData}
              onChange={setExtractedData}
            />
          )}

          {/* Step: Error */}
          {step === STEPS.ERROR && (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={() => {
                  setStep(STEPS.IDLE);
                  setError(null);
                  setFile(null);
                }}
                className="mt-4 text-primary-600 underline hover:text-primary-700"
              >
                Erneut versuchen
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-full transition-colors"
          >
            {step === STEPS.PREVIEW ? 'Verwerfen' : 'Abbrechen'}
          </button>

          {/* Extract button - only in uploaded state */}
          {step === STEPS.UPLOADED && (
            <button
              onClick={handleExtract}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-colors"
            >
              Extrahieren
            </button>
          )}

          {/* Accept button - only in preview state */}
          {step === STEPS.PREVIEW && (
            <button
              onClick={handleAccept}
              disabled={!extractedData || (
                !extractedData.kapitel?.length &&
                !extractedData.themen?.length &&
                !extractedData.lines?.length
              )}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
            >
              Übernehmen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper: Convert File to Base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data URL prefix to get pure base64
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * PW-211: Preview Editor Component
 * Shows extracted structure (fach → kapitel → themen) hierarchically
 */
function PreviewEditor({ data, onChange }) {
  const { fach, kapitel = [], themen = [], lines = [] } = data || {};

  // Check if we have structured data from Mistral
  const hasStructuredData = fach || kapitel.length > 0 || themen.length > 0;

  // Count total themes for display
  const totalThemen = kapitel.reduce((sum, k) => sum + (k.themen?.length || 0), 0) + themen.length;

  // Handle deletion of a thema within a kapitel
  const handleDeleteThemaInKapitel = (kapitelIdx, themaIdx) => {
    const updatedKapitel = [...kapitel];
    updatedKapitel[kapitelIdx] = {
      ...updatedKapitel[kapitelIdx],
      themen: updatedKapitel[kapitelIdx].themen.filter((_, i) => i !== themaIdx)
    };
    // Remove empty kapitel
    const filteredKapitel = updatedKapitel.filter(k => k.themen?.length > 0);
    onChange({ ...data, kapitel: filteredKapitel });
  };

  // Handle deletion of a direct thema
  const handleDeleteThema = (themaIdx) => {
    const updatedThemen = themen.filter((_, i) => i !== themaIdx);
    onChange({ ...data, themen: updatedThemen });
  };

  // Handle line change/delete for fallback mode
  const handleLineChange = (index, newValue) => {
    const updated = [...lines];
    updated[index] = newValue;
    onChange({ ...data, lines: updated });
  };

  const handleLineDelete = (index) => {
    const updated = lines.filter((_, i) => i !== index);
    onChange({ ...data, lines: updated });
  };

  // Structured preview (Mistral AI erkannt)
  if (hasStructuredData) {
    return (
      <div className="bg-neutral-100 rounded-lg p-4">
        <p className="text-sm font-medium text-neutral-700 mb-1">
          KI-Struktur erkannt:
        </p>
        <p className="text-xs text-neutral-500 mb-4">
          {totalThemen} Themen werden als Lerneinheiten importiert.
        </p>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {/* Fach (Subject) */}
          {fach && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Fach</span>
              </div>
              <p className="text-sm font-medium text-primary-900 mt-1">{fach}</p>
            </div>
          )}

          {/* Kapitel with nested Themen */}
          {kapitel.map((kap, kapIdx) => (
            <div key={kapIdx} className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              {/* Kapitel Header */}
              <div className="bg-neutral-50 px-3 py-2 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Kapitel</span>
                </div>
                <p className="text-sm font-medium text-neutral-800">{kap.name}</p>
              </div>

              {/* Themen im Kapitel */}
              <div className="p-2 space-y-1">
                {(kap.themen || []).map((thema, themaIdx) => (
                  <div
                    key={themaIdx}
                    className="flex items-center gap-2 pl-3 py-1.5 rounded hover:bg-neutral-50 group"
                  >
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-sm text-neutral-700">{thema.name}</span>
                    <button
                      onClick={() => handleDeleteThemaInKapitel(kapIdx, themaIdx)}
                      className="p-1 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      title="Thema entfernen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Direct Themen (without Kapitel) */}
          {themen.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <div className="bg-neutral-50 px-3 py-2 border-b border-neutral-200">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Themen</span>
              </div>
              <div className="p-2 space-y-1">
                {themen.map((thema, themaIdx) => (
                  <div
                    key={themaIdx}
                    className="flex items-center gap-2 pl-3 py-1.5 rounded hover:bg-neutral-50 group"
                  >
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-sm text-neutral-700">{thema.name}</span>
                    <button
                      onClick={() => handleDeleteThema(themaIdx)}
                      className="p-1 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      title="Thema entfernen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback: Raw lines preview (OCR without parsing)
  return (
    <div className="bg-neutral-100 rounded-lg p-4">
      <p className="text-sm font-medium text-neutral-700 mb-3">
        Erkannte Zeilen ({lines.length}):
      </p>
      <p className="text-xs text-neutral-500 mb-4">
        Du kannst die Zeilen bearbeiten oder löschen, bevor du sie übernimmst.
      </p>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {lines.map((line, index) => (
          <div
            key={index}
            className="flex items-center gap-2 bg-white p-2 rounded border border-neutral-200 group"
          >
            <div className="w-1 h-6 bg-primary-400 rounded-full flex-shrink-0" />
            <input
              type="text"
              value={line}
              onChange={(e) => handleLineChange(index, e.target.value)}
              className="flex-1 text-sm bg-transparent border-none focus:outline-none focus:ring-0 min-w-0"
            />
            <button
              onClick={() => handleLineDelete(index)}
              className="p-1 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              title="Zeile löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {lines.length === 0 && (
        <p className="text-center text-neutral-400 py-4">
          Keine Zeilen vorhanden.
        </p>
      )}
    </div>
  );
}
