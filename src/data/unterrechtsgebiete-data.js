/**
 * Vollständige Liste aller Unterrechtsgebiete
 * Gruppiert nach Hauptrechtsgebieten
 */

export const RECHTSGEBIET_LABELS = {
  'oeffentliches-recht': 'Öffentliches Recht',
  'zivilrecht': 'Zivilrecht',
  'strafrecht': 'Strafrecht',
  'querschnitt': 'Querschnitts- und Sonderrechtsgebiete'
};

export const RECHTSGEBIET_COLORS = {
  'oeffentliches-recht': 'bg-green-500',
  'zivilrecht': 'bg-blue-500',
  'strafrecht': 'bg-red-500',
  'querschnitt': 'bg-purple-500'
};

/**
 * Vollständige Unterrechtsgebiete-Datenbank
 */
export const ALL_UNTERRECHTSGEBIETE = {
  'oeffentliches-recht': [
    // Staats- und Verfassungsrecht
    { id: 'staatsorg', name: 'Staatsorganisationsrecht', kategorie: 'Staats- und Verfassungsrecht' },
    { id: 'grundrechte', name: 'Grundrechte', kategorie: 'Staats- und Verfassungsrecht' },
    { id: 'landesverfr', name: 'Landesverfassungsrecht', kategorie: 'Staats- und Verfassungsrecht' },
    { id: 'kommunalverfr', name: 'Kommunalverfassungsrecht', kategorie: 'Staats- und Verfassungsrecht' },
    { id: 'verfprozr', name: 'Verfassungsprozessrecht', kategorie: 'Staats- und Verfassungsrecht' },

    // Allgemeines Verwaltungsrecht
    { id: 'verwverf', name: 'Verwaltungsverfahrensrecht', kategorie: 'Allgemeines Verwaltungsrecht' },
    { id: 'va-vertrag', name: 'Verwaltungsakt und öffentlich-rechtlicher Vertrag', kategorie: 'Allgemeines Verwaltungsrecht' },
    { id: 'verwvollstr', name: 'Verwaltungsvollstreckungsrecht', kategorie: 'Allgemeines Verwaltungsrecht' },
    { id: 'verwprozr', name: 'Verwaltungsprozessrecht', kategorie: 'Allgemeines Verwaltungsrecht' },

    // Besonderes Verwaltungsrecht
    { id: 'polr', name: 'Polizei- und Ordnungsrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'kommunalr', name: 'Kommunalrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'baur-oeff', name: 'Baurecht öffentlich', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'raumord', name: 'Raumordnungs- und Landesplanungsrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'umweltr', name: 'Umweltrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'naturschutzr', name: 'Naturschutzrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'immschutzr', name: 'Immissionsschutzrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'wasserr', name: 'Wasserrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'abfallr', name: 'Abfallrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'energier-oeff', name: 'Energierecht öffentlich', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'atomr', name: 'Atomrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'strassenr', name: 'Straßen- und Wegerecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'beamtenr', name: 'Beamtenrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'oeff-dienstr', name: 'Öffentliches Dienstrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'hochschulr', name: 'Hochschulrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'schulr', name: 'Schulrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'sozverwaltungsr', name: 'Sozialverwaltungsrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'gesundheitsr-oeff', name: 'Gesundheitsrecht öffentlich', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'arzneimittelr', name: 'Arzneimittel- und Medizinprodukterecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'gewerber', name: 'Gewerberecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'handwerksr', name: 'Handwerksrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'gaststaettenr', name: 'Gaststättenrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'vergaber', name: 'Vergaberecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'subventionsr', name: 'Subventionsrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'regulierungsr', name: 'Regulierungsrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'telekomr', name: 'Telekommunikationsrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'medienr-oeff', name: 'Medienrecht öffentlich', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'rundfunkr', name: 'Rundfunkrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'datenschutzr-oeff', name: 'Datenschutzrecht öffentlich', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'inffreiheitr', name: 'Informationsfreiheitsrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'sicherheitsr', name: 'Sicherheitsrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'katastrophenschutzr', name: 'Katastrophenschutzrecht', kategorie: 'Besonderes Verwaltungsrecht' },

    // Steuerrecht
    { id: 'ao', name: 'Abgabenordnung', kategorie: 'Steuerrecht' },
    { id: 'estg', name: 'Einkommensteuerrecht', kategorie: 'Steuerrecht' },
    { id: 'kstg', name: 'Körperschaftsteuerrecht', kategorie: 'Steuerrecht' },
    { id: 'ustg', name: 'Umsatzsteuerrecht', kategorie: 'Steuerrecht' },
    { id: 'gewerbesteuerr', name: 'Gewerbesteuerrecht', kategorie: 'Steuerrecht' },
    { id: 'int-steuerr', name: 'Internationales Steuerrecht', kategorie: 'Steuerrecht' },
    { id: 'steuerverf', name: 'Steuerverfahrensrecht', kategorie: 'Steuerrecht' },
    { id: 'steuerstrafr', name: 'Steuerstrafrecht', kategorie: 'Steuerrecht' },

    // Sozialrecht
    { id: 'sozversr', name: 'Sozialversicherungsrecht', kategorie: 'Sozialrecht' },
    { id: 'arbeitsfoerd', name: 'Arbeitsförderungsrecht', kategorie: 'Sozialrecht' },
    { id: 'grundsicherungsr', name: 'Grundsicherungsrecht', kategorie: 'Sozialrecht' },
    { id: 'sozhilfer', name: 'Sozialhilferecht', kategorie: 'Sozialrecht' },
    { id: 'pflegeversr', name: 'Pflegeversicherungsrecht', kategorie: 'Sozialrecht' },
    { id: 'rentenversr', name: 'Rentenversicherungsrecht', kategorie: 'Sozialrecht' },
    { id: 'unfallversr', name: 'Unfallversicherungsrecht', kategorie: 'Sozialrecht' },

    // Europarecht
    { id: 'eu-primaerr', name: 'Primärrecht der EU', kategorie: 'Europarecht' },
    { id: 'eu-sekundaerr', name: 'Sekundärrecht der EU', kategorie: 'Europarecht' },
    { id: 'eu-verfr', name: 'Europäisches Verfassungsrecht', kategorie: 'Europarecht' },
    { id: 'eu-verwaltungsr', name: 'Europäisches Verwaltungsrecht', kategorie: 'Europarecht' },
    { id: 'eu-wirtschaftsr', name: 'Europäisches Wirtschaftsrecht', kategorie: 'Europarecht' },
    { id: 'eu-wettbewerbsr', name: 'Europäisches Wettbewerbsrecht', kategorie: 'Europarecht' },
    { id: 'eu-grundr', name: 'Europäisches Grund- und Menschenrecht', kategorie: 'Europarecht' },
    { id: 'eu-prozr', name: 'Europäisches Prozessrecht', kategorie: 'Europarecht' },

    // Völkerrecht
    { id: 'allg-voelkerr', name: 'Allgemeines Völkerrecht', kategorie: 'Völkerrecht' },
    { id: 'menschenr', name: 'Menschenrechte', kategorie: 'Völkerrecht' },
    { id: 'human-voelkerr', name: 'Humanitäres Völkerrecht', kategorie: 'Völkerrecht' },
    { id: 'voelkervertragsr', name: 'Völkervertragsrecht', kategorie: 'Völkerrecht' },
    { id: 'int-orgr', name: 'Internationales Organisationsrecht', kategorie: 'Völkerrecht' },
    { id: 'see-weltraumr', name: 'See- und Weltraumrecht', kategorie: 'Völkerrecht' },
    { id: 'diplomatenr', name: 'Diplomaten- und Konsularrecht', kategorie: 'Völkerrecht' },
  ],

  'zivilrecht': [
    // Allgemeiner Teil des BGB
    { id: 'rechtsgeschaeftsl', name: 'Rechtsgeschäftslehre', kategorie: 'Allgemeiner Teil des BGB' },
    { id: 'willenserklarung', name: 'Willenserklärung', kategorie: 'Allgemeiner Teil des BGB' },
    { id: 'geschaeftsfaehigkeit', name: 'Geschäftsfähigkeit', kategorie: 'Allgemeiner Teil des BGB' },
    { id: 'fristen-verjaehrung', name: 'Fristen und Verjährung', kategorie: 'Allgemeiner Teil des BGB' },

    // Schuldrecht
    { id: 'allg-schuldr', name: 'Allgemeines Schuldrecht', kategorie: 'Schuldrecht' },
    { id: 'bes-schuldr', name: 'Besonderes Schuldrecht', kategorie: 'Schuldrecht' },
    { id: 'kaufr', name: 'Kaufrecht', kategorie: 'Schuldrecht' },
    { id: 'miet-pachtr', name: 'Miet- und Pachtrecht', kategorie: 'Schuldrecht' },
    { id: 'werkvertragsr', name: 'Werkvertragsrecht', kategorie: 'Schuldrecht' },
    { id: 'dienstvertragsr', name: 'Dienstvertragsrecht', kategorie: 'Schuldrecht' },
    { id: 'reisevertragsr', name: 'Reisevertragsrecht', kategorie: 'Schuldrecht' },
    { id: 'deliktsr', name: 'Deliktsrecht', kategorie: 'Schuldrecht' },
    { id: 'bereicherungsr', name: 'Bereicherungsrecht', kategorie: 'Schuldrecht' },
    { id: 'goa', name: 'GoA', kategorie: 'Schuldrecht' },

    // Sachenrecht
    { id: 'eigentum', name: 'Eigentum', kategorie: 'Sachenrecht' },
    { id: 'besitz', name: 'Besitz', kategorie: 'Sachenrecht' },
    { id: 'sicherungsr', name: 'Sicherungsrechte', kategorie: 'Sachenrecht' },
    { id: 'hypo-grundschuld', name: 'Hypothek und Grundschuld', kategorie: 'Sachenrecht' },
    { id: 'pfandr', name: 'Pfandrecht', kategorie: 'Sachenrecht' },

    // Familienrecht
    { id: 'ehe-scheidung', name: 'Ehe und Scheidung', kategorie: 'Familienrecht' },
    { id: 'unterhaltsr', name: 'Unterhaltsrecht', kategorie: 'Familienrecht' },
    { id: 'gueterr', name: 'Güterrecht', kategorie: 'Familienrecht' },
    { id: 'abstammungsr', name: 'Abstammungsrecht', kategorie: 'Familienrecht' },
    { id: 'kindschaftsr', name: 'Kindschaftsrecht', kategorie: 'Familienrecht' },
    { id: 'vormundschaft-betreuung', name: 'Vormundschaft und Betreuung', kategorie: 'Familienrecht' },

    // Erbrecht
    { id: 'gesetzl-erbfolge', name: 'Gesetzliche Erbfolge', kategorie: 'Erbrecht' },
    { id: 'testament-erbvertrag', name: 'Testament und Erbvertrag', kategorie: 'Erbrecht' },
    { id: 'pflichtteilsr', name: 'Pflichtteilsrecht', kategorie: 'Erbrecht' },
    { id: 'erbengemeinschaft', name: 'Erbengemeinschaft', kategorie: 'Erbrecht' },

    // Handelsrecht
    { id: 'handelsstand', name: 'Handelsstand', kategorie: 'Handelsrecht' },
    { id: 'firmenname', name: 'Firmenname', kategorie: 'Handelsrecht' },
    { id: 'handelsregister', name: 'Handelsregister', kategorie: 'Handelsrecht' },
    { id: 'prokura-hvollm', name: 'Prokura und Handlungsvollmacht', kategorie: 'Handelsrecht' },
    { id: 'handelskauf', name: 'Handelskauf', kategorie: 'Handelsrecht' },

    // Gesellschaftsrecht
    { id: 'personenges', name: 'Personengesellschaften', kategorie: 'Gesellschaftsrecht' },
    { id: 'kapitalges', name: 'Kapitalgesellschaften', kategorie: 'Gesellschaftsrecht' },
    { id: 'konzernr', name: 'Konzernrecht', kategorie: 'Gesellschaftsrecht' },
    { id: 'umwandlungsr', name: 'Umwandlungsrecht', kategorie: 'Gesellschaftsrecht' },
    { id: 'corp-governance', name: 'Corporate Governance', kategorie: 'Gesellschaftsrecht' },

    // Arbeitsrecht
    { id: 'indiv-arbeitsr', name: 'Individualarbeitsrecht', kategorie: 'Arbeitsrecht' },
    { id: 'kollekt-arbeitsr', name: 'Kollektives Arbeitsrecht', kategorie: 'Arbeitsrecht' },
    { id: 'tarifvertragsr', name: 'Tarifvertragsrecht', kategorie: 'Arbeitsrecht' },
    { id: 'betriebsverfr', name: 'Betriebsverfassungsrecht', kategorie: 'Arbeitsrecht' },
    { id: 'mitbestimmungsr', name: 'Mitbestimmungsrecht', kategorie: 'Arbeitsrecht' },

    // Immaterialgüterrecht
    { id: 'urheberr', name: 'Urheberrecht', kategorie: 'Immaterialgüterrecht' },
    { id: 'patentr', name: 'Patentrecht', kategorie: 'Immaterialgüterrecht' },
    { id: 'markenr', name: 'Markenrecht', kategorie: 'Immaterialgüterrecht' },
    { id: 'designr', name: 'Designrecht', kategorie: 'Immaterialgüterrecht' },
    { id: 'wettbewerbsr-priv', name: 'Wettbewerbsrecht privat', kategorie: 'Immaterialgüterrecht' },
    { id: 'lizenzr', name: 'Lizenzrecht', kategorie: 'Immaterialgüterrecht' },

    // Wettbewerbs- und Kartellrecht
    { id: 'lauterkeitsr', name: 'Lauterkeitsrecht', kategorie: 'Wettbewerbs- und Kartellrecht' },
    { id: 'kartellr-nat', name: 'Kartellrecht national', kategorie: 'Wettbewerbs- und Kartellrecht' },
    { id: 'kartellr-eu', name: 'Kartellrecht europäisch', kategorie: 'Wettbewerbs- und Kartellrecht' },

    // Wirtschaftsrecht privat
    { id: 'bankr', name: 'Bankrecht', kategorie: 'Wirtschaftsrecht privat' },
    { id: 'kapitalmarktr', name: 'Kapitalmarktrecht', kategorie: 'Wirtschaftsrecht privat' },
    { id: 'versicherungsr', name: 'Versicherungsrecht', kategorie: 'Wirtschaftsrecht privat' },
    { id: 'transport-speditionsr', name: 'Transport- und Speditionsrecht', kategorie: 'Wirtschaftsrecht privat' },
    { id: 'insolvenzr', name: 'Insolvenzrecht', kategorie: 'Wirtschaftsrecht privat' },
    { id: 'verbraucherr', name: 'Verbraucherrecht', kategorie: 'Wirtschaftsrecht privat' },

    // Internationales Privatrecht
    { id: 'kollisionsr', name: 'Kollisionsrecht', kategorie: 'Internationales Privatrecht' },
    { id: 'int-vertragsr', name: 'Internationales Vertragsrecht', kategorie: 'Internationales Privatrecht' },
    { id: 'int-fam-erbr', name: 'Internationales Familien- und Erbrecht', kategorie: 'Internationales Privatrecht' },

    // Zivilverfahrensrecht
    { id: 'erkenntnisverf', name: 'Erkenntnisverfahren', kategorie: 'Zivilverfahrensrecht' },
    { id: 'zwangsvollstr', name: 'Zwangsvollstreckungsrecht', kategorie: 'Zivilverfahrensrecht' },
    { id: 'insolvenzverf', name: 'Insolvenzverfahrensrecht', kategorie: 'Zivilverfahrensrecht' },
    { id: 'schiedsverf', name: 'Schiedsverfahrensrecht', kategorie: 'Zivilverfahrensrecht' },
    { id: 'mediation-adr', name: 'Mediation und ADR', kategorie: 'Zivilverfahrensrecht' },
  ],

  'strafrecht': [
    // Materielles Strafrecht
    { id: 'strafr-at', name: 'Allgemeiner Teil', kategorie: 'Materielles Strafrecht' },
    { id: 'strafr-bt', name: 'Besonderer Teil', kategorie: 'Materielles Strafrecht' },
    { id: 'nebenstrafr', name: 'Nebenstrafrecht', kategorie: 'Materielles Strafrecht' },

    // Besonderes Strafrecht
    { id: 'wirtschaftsstrafr', name: 'Wirtschaftsstrafrecht', kategorie: 'Besonderes Strafrecht' },
    { id: 'steuerstrafr-bes', name: 'Steuerstrafrecht', kategorie: 'Besonderes Strafrecht' },
    { id: 'umweltstrafr', name: 'Umweltstrafrecht', kategorie: 'Besonderes Strafrecht' },
    { id: 'medizinstrafr', name: 'Medizinstrafrecht', kategorie: 'Besonderes Strafrecht' },
    { id: 'sexualstrafr', name: 'Sexualstrafrecht', kategorie: 'Besonderes Strafrecht' },
    { id: 'btmstrafr', name: 'Betäubungsmittelstrafrecht', kategorie: 'Besonderes Strafrecht' },
    { id: 'jugendstrafr', name: 'Jugendstrafrecht', kategorie: 'Besonderes Strafrecht' },

    // Strafverfahrensrecht
    { id: 'ermittlungsverf', name: 'Ermittlungsverfahren', kategorie: 'Strafverfahrensrecht' },
    { id: 'hauptverf', name: 'Hauptverfahren', kategorie: 'Strafverfahrensrecht' },
    { id: 'rechtsmittel', name: 'Rechtsmittel', kategorie: 'Strafverfahrensrecht' },
    { id: 'strafvollstr', name: 'Strafvollstreckungsrecht', kategorie: 'Strafverfahrensrecht' },

    // Internationales Strafrecht
    { id: 'voelkerstrafr', name: 'Völkerstrafrecht', kategorie: 'Internationales Strafrecht' },
    { id: 'eu-strafr', name: 'Europäisches Strafrecht', kategorie: 'Internationales Strafrecht' },
    { id: 'auslieferungsr', name: 'Auslieferungsrecht', kategorie: 'Internationales Strafrecht' },
  ],

  'querschnitt': [
    { id: 'medizinr', name: 'Medizinrecht', kategorie: 'Querschnittsgebiete' },
    { id: 'gesundheitsr', name: 'Gesundheitsrecht', kategorie: 'Querschnittsgebiete' },
    { id: 'sportr', name: 'Sportrecht', kategorie: 'Querschnittsgebiete' },
    { id: 'medien-presser', name: 'Medien- und Presserecht', kategorie: 'Querschnittsgebiete' },
    { id: 'itr', name: 'IT-Recht', kategorie: 'Querschnittsgebiete' },
    { id: 'internetr', name: 'Internetrecht', kategorie: 'Querschnittsgebiete' },
    { id: 'datenschutzr', name: 'Datenschutzrecht', kategorie: 'Querschnittsgebiete' },
    { id: 'kir', name: 'KI-Recht', kategorie: 'Querschnittsgebiete' },
    { id: 'compliance', name: 'Compliance', kategorie: 'Querschnittsgebiete' },
    { id: 'legaltech', name: 'Legal Tech', kategorie: 'Querschnittsgebiete' },
    { id: 'migrations-asylr', name: 'Migrations- und Asylrecht', kategorie: 'Querschnittsgebiete' },
    { id: 'religionsr', name: 'Religionsrecht', kategorie: 'Querschnittsgebiete' },
    { id: 'kirchenr', name: 'Kirchenrecht', kategorie: 'Querschnittsgebiete' },
    { id: 'kulturgueterschutzr', name: 'Kulturgüterschutzrecht', kategorie: 'Querschnittsgebiete' },
    { id: 'tierschutzr', name: 'Tierschutzrecht', kategorie: 'Querschnittsgebiete' },
    { id: 'agrarr', name: 'Agrarrecht', kategorie: 'Querschnittsgebiete' },
    { id: 'energier-priv', name: 'Energierecht privat', kategorie: 'Querschnittsgebiete' },
    { id: 'verkehrsr', name: 'Verkehrsrecht', kategorie: 'Querschnittsgebiete' },
    { id: 'luft-weltraumr', name: 'Luft- und Weltraumrecht', kategorie: 'Querschnittsgebiete' },
    { id: 'seer', name: 'Seerecht', kategorie: 'Querschnittsgebiete' },
  ]
};

/**
 * Standard-Auswahl für den Wizard (wichtigste Gebiete)
 */
export const DEFAULT_SELECTION = {
  'oeffentliches-recht': [
    { id: 'staatsorg', name: 'Staatsorganisationsrecht', kategorie: 'Staats- und Verfassungsrecht' },
    { id: 'grundrechte', name: 'Grundrechte', kategorie: 'Staats- und Verfassungsrecht' },
    { id: 'verwverf', name: 'Verwaltungsverfahrensrecht', kategorie: 'Allgemeines Verwaltungsrecht' },
    { id: 'verwprozr', name: 'Verwaltungsprozessrecht', kategorie: 'Allgemeines Verwaltungsrecht' },
    { id: 'polr', name: 'Polizei- und Ordnungsrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'kommunalr', name: 'Kommunalrecht', kategorie: 'Besonderes Verwaltungsrecht' },
    { id: 'baur-oeff', name: 'Baurecht öffentlich', kategorie: 'Besonderes Verwaltungsrecht' },
  ],
  'zivilrecht': [
    { id: 'rechtsgeschaeftsl', name: 'Rechtsgeschäftslehre', kategorie: 'Allgemeiner Teil des BGB' },
    { id: 'willenserklarung', name: 'Willenserklärung', kategorie: 'Allgemeiner Teil des BGB' },
    { id: 'allg-schuldr', name: 'Allgemeines Schuldrecht', kategorie: 'Schuldrecht' },
    { id: 'bes-schuldr', name: 'Besonderes Schuldrecht', kategorie: 'Schuldrecht' },
    { id: 'eigentum', name: 'Eigentum', kategorie: 'Sachenrecht' },
    { id: 'besitz', name: 'Besitz', kategorie: 'Sachenrecht' },
  ],
  'strafrecht': [
    { id: 'strafr-at', name: 'Allgemeiner Teil', kategorie: 'Materielles Strafrecht' },
    { id: 'strafr-bt', name: 'Besonderer Teil', kategorie: 'Materielles Strafrecht' },
  ],
  'querschnitt': []
};

/**
 * Hilfsfunktion: Alle Unterrechtsgebiete als flache Liste
 */
export function getAllUnterrechtsgebieteFlat(data = ALL_UNTERRECHTSGEBIETE) {
  const flat = [];
  Object.entries(data).forEach(([rechtsgebietId, items]) => {
    items.forEach(item => {
      flat.push({
        ...item,
        rechtsgebiet: rechtsgebietId,
        color: RECHTSGEBIET_COLORS[rechtsgebietId] || 'bg-gray-500'
      });
    });
  });
  return flat;
}

/**
 * Hilfsfunktion: Gruppiert nach Kategorie
 */
export function groupByKategorie(items) {
  return items.reduce((acc, item) => {
    const kategorie = item.kategorie || 'Sonstige';
    if (!acc[kategorie]) {
      acc[kategorie] = [];
    }
    acc[kategorie].push(item);
    return acc;
  }, {});
}
