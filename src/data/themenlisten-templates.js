/**
 * Vorgefertigte Themenlisten-Templates
 * Diese können von Nutzern importiert werden
 */

export const THEMENLISTEN_TEMPLATES = [
  {
    id: 'examen-vollstaendig',
    name: 'Lernplan Examensvorbereitung',
    description: 'Vollständiger Lernplan für das erste Staatsexamen mit allen examensrelevanten Rechtsgebieten. Ideal für eine umfassende Vorbereitung über 12-18 Monate.',
    stats: {
      unterrechtsgebiete: 32,
      themen: 435,
    },
    gewichtung: {
      'oeffentliches-recht': 35,
      'zivilrecht': 45,
      'strafrecht': 20,
    },
    mode: 'examen',
    tags: ['Examen', 'Vollständig'],
    rechtsgebiete: [
      {
        rechtsgebietId: 'zivilrecht',
        name: 'Zivilrecht',
        unterrechtsgebiete: [
          {
            id: 'bgb-at',
            name: 'BGB AT',
            kapitel: [
              {
                id: 'bgb-at-1',
                title: 'Rechtsgeschäftslehre',
                themen: [
                  { id: 'bgb-at-1-1', title: 'Willenserklärung', aufgaben: [] },
                  { id: 'bgb-at-1-2', title: 'Vertragsschluss', aufgaben: [] },
                  { id: 'bgb-at-1-3', title: 'Anfechtung', aufgaben: [] },
                  { id: 'bgb-at-1-4', title: 'Stellvertretung', aufgaben: [] },
                ],
              },
              {
                id: 'bgb-at-2',
                title: 'Personen & Rechtsobjekte',
                themen: [
                  { id: 'bgb-at-2-1', title: 'Natürliche Personen', aufgaben: [] },
                  { id: 'bgb-at-2-2', title: 'Juristische Personen', aufgaben: [] },
                  { id: 'bgb-at-2-3', title: 'Sachen und Rechte', aufgaben: [] },
                ],
              },
            ],
          },
          {
            id: 'schuldrecht-at',
            name: 'Schuldrecht AT',
            kapitel: [
              {
                id: 'sr-at-1',
                title: 'Leistungsstörungen',
                themen: [
                  { id: 'sr-at-1-1', title: 'Unmöglichkeit', aufgaben: [] },
                  { id: 'sr-at-1-2', title: 'Verzug', aufgaben: [] },
                  { id: 'sr-at-1-3', title: 'Schlechtleistung', aufgaben: [] },
                  { id: 'sr-at-1-4', title: 'Schadensersatz', aufgaben: [] },
                ],
              },
            ],
          },
          {
            id: 'schuldrecht-bt',
            name: 'Schuldrecht BT',
            kapitel: [
              {
                id: 'sr-bt-1',
                title: 'Kaufrecht',
                themen: [
                  { id: 'sr-bt-1-1', title: 'Kaufvertrag', aufgaben: [] },
                  { id: 'sr-bt-1-2', title: 'Mängelgewährleistung', aufgaben: [] },
                  { id: 'sr-bt-1-3', title: 'Verbrauchsgüterkauf', aufgaben: [] },
                ],
              },
              {
                id: 'sr-bt-2',
                title: 'Mietrecht',
                themen: [
                  { id: 'sr-bt-2-1', title: 'Mietvertrag', aufgaben: [] },
                  { id: 'sr-bt-2-2', title: 'Mietmängel', aufgaben: [] },
                ],
              },
              {
                id: 'sr-bt-3',
                title: 'Deliktsrecht',
                themen: [
                  { id: 'sr-bt-3-1', title: '§ 823 I BGB', aufgaben: [] },
                  { id: 'sr-bt-3-2', title: '§ 823 II BGB', aufgaben: [] },
                  { id: 'sr-bt-3-3', title: 'Haftung für Dritte', aufgaben: [] },
                ],
              },
            ],
          },
          {
            id: 'sachenrecht',
            name: 'Sachenrecht',
            kapitel: [
              {
                id: 'sachr-1',
                title: 'Eigentum',
                themen: [
                  { id: 'sachr-1-1', title: 'Eigentumserwerb bewegliche Sachen', aufgaben: [] },
                  { id: 'sachr-1-2', title: 'Eigentumserwerb Grundstücke', aufgaben: [] },
                  { id: 'sachr-1-3', title: 'EBV', aufgaben: [] },
                ],
              },
            ],
          },
        ],
      },
      {
        rechtsgebietId: 'oeffentliches-recht',
        name: 'Öffentliches Recht',
        unterrechtsgebiete: [
          {
            id: 'staatsrecht',
            name: 'Staatsrecht',
            kapitel: [
              {
                id: 'staatsrecht-1',
                title: 'Grundrechte',
                themen: [
                  { id: 'staatsrecht-1-1', title: 'Grundrechtsprüfung', aufgaben: [] },
                  { id: 'staatsrecht-1-2', title: 'Art. 1-5 GG', aufgaben: [] },
                  { id: 'staatsrecht-1-3', title: 'Art. 12-14 GG', aufgaben: [] },
                ],
              },
              {
                id: 'staatsrecht-2',
                title: 'Staatsorganisationsrecht',
                themen: [
                  { id: 'staatsrecht-2-1', title: 'Verfassungsorgane', aufgaben: [] },
                  { id: 'staatsrecht-2-2', title: 'Gesetzgebung', aufgaben: [] },
                ],
              },
            ],
          },
          {
            id: 'verwaltungsrecht-at',
            name: 'Verwaltungsrecht AT',
            kapitel: [
              {
                id: 'vwrat-1',
                title: 'Verwaltungsakt',
                themen: [
                  { id: 'vwrat-1-1', title: 'VA-Begriff', aufgaben: [] },
                  { id: 'vwrat-1-2', title: 'Nebenbestimmungen', aufgaben: [] },
                  { id: 'vwrat-1-3', title: 'Bestandskraft', aufgaben: [] },
                ],
              },
            ],
          },
          {
            id: 'verwaltungsrecht-bt',
            name: 'Verwaltungsrecht BT',
            kapitel: [
              {
                id: 'vwrbt-1',
                title: 'Polizeirecht',
                themen: [
                  { id: 'vwrbt-1-1', title: 'Gefahrenabwehr', aufgaben: [] },
                  { id: 'vwrbt-1-2', title: 'Standardmaßnahmen', aufgaben: [] },
                ],
              },
              {
                id: 'vwrbt-2',
                title: 'Baurecht',
                themen: [
                  { id: 'vwrbt-2-1', title: 'Bauplanungsrecht', aufgaben: [] },
                  { id: 'vwrbt-2-2', title: 'Bauordnungsrecht', aufgaben: [] },
                ],
              },
            ],
          },
        ],
      },
      {
        rechtsgebietId: 'strafrecht',
        name: 'Strafrecht',
        unterrechtsgebiete: [
          {
            id: 'strafrecht-at',
            name: 'Strafrecht AT',
            kapitel: [
              {
                id: 'strat-1',
                title: 'Tatbestandsmäßigkeit',
                themen: [
                  { id: 'strat-1-1', title: 'Objektiver Tatbestand', aufgaben: [] },
                  { id: 'strat-1-2', title: 'Subjektiver Tatbestand', aufgaben: [] },
                  { id: 'strat-1-3', title: 'Kausalität', aufgaben: [] },
                ],
              },
              {
                id: 'strat-2',
                title: 'Rechtswidrigkeit',
                themen: [
                  { id: 'strat-2-1', title: 'Notwehr', aufgaben: [] },
                  { id: 'strat-2-2', title: 'Rechtfertigender Notstand', aufgaben: [] },
                ],
              },
            ],
          },
          {
            id: 'strafrecht-bt',
            name: 'Strafrecht BT',
            kapitel: [
              {
                id: 'strbt-1',
                title: 'Tötungsdelikte',
                themen: [
                  { id: 'strbt-1-1', title: '§§ 211, 212 StGB', aufgaben: [] },
                  { id: 'strbt-1-2', title: 'Fahrlässige Tötung', aufgaben: [] },
                ],
              },
              {
                id: 'strbt-2',
                title: 'Körperverletzungsdelikte',
                themen: [
                  { id: 'strbt-2-1', title: '§ 223 StGB', aufgaben: [] },
                  { id: 'strbt-2-2', title: 'Qualifikationen', aufgaben: [] },
                ],
              },
              {
                id: 'strbt-3',
                title: 'Vermögensdelikte',
                themen: [
                  { id: 'strbt-3-1', title: 'Diebstahl', aufgaben: [] },
                  { id: 'strbt-3-2', title: 'Betrug', aufgaben: [] },
                  { id: 'strbt-3-3', title: 'Unterschlagung', aufgaben: [] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'zivilrecht-schwerpunkt',
    name: 'Zivilrecht Intensiv',
    description: 'Fokussierter Lernplan mit Schwerpunkt auf dem examensrelevanten Zivilrecht. Optimal für die Vertiefung nach dem Grundstudium.',
    stats: {
      unterrechtsgebiete: 18,
      themen: 245,
    },
    gewichtung: {
      'oeffentliches-recht': 10,
      'zivilrecht': 80,
      'strafrecht': 10,
    },
    mode: 'standard',
    tags: ['Zivilrecht', 'Intensiv'],
    rechtsgebiete: [
      {
        rechtsgebietId: 'zivilrecht',
        name: 'Zivilrecht',
        unterrechtsgebiete: [
          {
            id: 'bgb-at-int',
            name: 'BGB AT',
            kapitel: [
              {
                id: 'bgb-at-int-1',
                title: 'Rechtsgeschäftslehre Vertiefung',
                themen: [
                  { id: 'bgb-at-int-1-1', title: 'Komplexe Willenserklärungen', aufgaben: [] },
                  { id: 'bgb-at-int-1-2', title: 'Mehrpersonenverhältnisse', aufgaben: [] },
                ],
              },
            ],
          },
          {
            id: 'schuldrecht-int',
            name: 'Schuldrecht Vertiefung',
            kapitel: [
              {
                id: 'sr-int-1',
                title: 'Komplexe Leistungsstörungen',
                themen: [
                  { id: 'sr-int-1-1', title: 'Mehrfache Störungen', aufgaben: [] },
                  { id: 'sr-int-1-2', title: 'Drittschadensliquidation', aufgaben: [] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'strafrecht-grundlagen',
    name: 'Strafrecht Basics',
    description: 'Grundlagenlernplan für Strafrecht. Ideal für Studienanfänger oder zur Auffrischung der strafrechtlichen Grundkenntnisse.',
    stats: {
      unterrechtsgebiete: 8,
      themen: 95,
    },
    gewichtung: {
      'oeffentliches-recht': 5,
      'zivilrecht': 5,
      'strafrecht': 90,
    },
    mode: 'standard',
    tags: ['Strafrecht', 'Grundlagen'],
    rechtsgebiete: [
      {
        rechtsgebietId: 'strafrecht',
        name: 'Strafrecht',
        unterrechtsgebiete: [
          {
            id: 'strat-basics',
            name: 'Strafrecht AT Grundlagen',
            kapitel: [
              {
                id: 'strat-basics-1',
                title: 'Deliktsaufbau',
                themen: [
                  { id: 'strat-basics-1-1', title: 'Prüfungsschema', aufgaben: [] },
                  { id: 'strat-basics-1-2', title: 'Tatbestand', aufgaben: [] },
                  { id: 'strat-basics-1-3', title: 'Rechtswidrigkeit', aufgaben: [] },
                  { id: 'strat-basics-1-4', title: 'Schuld', aufgaben: [] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'oeffentliches-recht-kompakt',
    name: 'Öffentliches Recht Kompakt',
    description: 'Komprimierter Überblick über das examensrelevante Öffentliche Recht mit Fokus auf Grundrechte und Verwaltungsrecht.',
    stats: {
      unterrechtsgebiete: 12,
      themen: 156,
    },
    gewichtung: {
      'oeffentliches-recht': 85,
      'zivilrecht': 10,
      'strafrecht': 5,
    },
    mode: 'standard',
    tags: ['Öffentliches Recht', 'Kompakt'],
    rechtsgebiete: [
      {
        rechtsgebietId: 'oeffentliches-recht',
        name: 'Öffentliches Recht',
        unterrechtsgebiete: [
          {
            id: 'grundrechte-kompakt',
            name: 'Grundrechte',
            kapitel: [
              {
                id: 'gr-kompakt-1',
                title: 'Grundrechtsprüfung',
                themen: [
                  { id: 'gr-kompakt-1-1', title: 'Schutzbereich', aufgaben: [] },
                  { id: 'gr-kompakt-1-2', title: 'Eingriff', aufgaben: [] },
                  { id: 'gr-kompakt-1-3', title: 'Rechtfertigung', aufgaben: [] },
                ],
              },
            ],
          },
          {
            id: 'vwr-kompakt',
            name: 'Verwaltungsrecht',
            kapitel: [
              {
                id: 'vwr-kompakt-1',
                title: 'Klagarten',
                themen: [
                  { id: 'vwr-kompakt-1-1', title: 'Anfechtungsklage', aufgaben: [] },
                  { id: 'vwr-kompakt-1-2', title: 'Verpflichtungsklage', aufgaben: [] },
                  { id: 'vwr-kompakt-1-3', title: 'Feststellungsklage', aufgaben: [] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Farben für die Rechtsgebiete
 */
export const RECHTSGEBIET_COLORS = {
  'oeffentliches-recht': {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    name: 'Öffentliches Recht',
  },
  'zivilrecht': {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    name: 'Zivilrecht',
  },
  'strafrecht': {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    name: 'Strafrecht',
  },
  'querschnitt': {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    name: 'Querschnittsrecht',
  },
};
