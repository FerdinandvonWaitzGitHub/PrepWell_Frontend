# Lernplan Wizard Refactoring - TODO

## Übersicht

Anpassung des Lernplan-Wizards, speziell Schritt 6 ("Als Liste erstellen") und folgende Schritte.

---

## Workflow

1. Du teilst mir den Figma-generierten React-Code für einen Schritt
2. **Code-Bereinigung:** Hardcodierte Design-Tokens werden durch Tailwind-Klassen ersetzt
   - Farben → `text-primary-500`, `bg-neutral-100`, etc. (aus tailwind.config.js)
   - Abstände → `p-4`, `gap-3`, `mt-6`, etc.
   - Schriftgrößen → `text-sm`, `text-2xl`, etc.
   - Keine inline `style={{}}` oder Hex-Werte wie `#FFE7E7`
3. Ich analysiere den Code und stelle Klärungsfragen (Interaktionen, State, etc.)
4. Nach Klärung implementiere ich den Schritt mit bereinigtem Code
5. Wir gehen zum nächsten Schritt

---

## Wizard-Struktur (aktuell)

```
Schritt 1: Willkommen
Schritt 2: Prüfungsdatum
Schritt 3: Bundesland
Schritt 4: Rechtsgebiete-Auswahl
Schritt 5: Kapitel-Auswahl
Schritt 6: Erstellungsmodus wählen
         ├─ "Als Liste erstellen" (= manuell)
         ├─ "Automatisch generieren"
         └─ "Vorlage verwenden"
Schritt 7+: Je nach gewähltem Pfad...
```

---

## Schritte zum Analysieren

---

### Schritt 6: Erstellungsmodus (Anpassung geplant)
**Status:** Ausstehend

**Figma Code:**
```jsx
// Hier Figma-generierten Code einfügen
```

**Notizen:**


---

### Schritt 7 (Pfad: Als Liste erstellen)
**Status:** Ausstehend

**Figma Code:**
import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.contentHeader}>
              							<div className={styles.contentHeader2}>
                								<div className={styles.schritt7Alt2Header}>
                  									<div className={styles.typographyH1}>
                    										<div className={styles.thisIsHeading}>{`Rechtsgebiete & Unterrechtsgebiete`}</div>
                  									</div>
                  									<div className={styles.beschreibungDesLernplans}>Beschreibung des Lernplans</div>
                								</div>
              							</div>
            						</div>
            						<img className={styles.lineIcon} alt="" />
            						<div className={styles.mainContentWrapper}>
              							<div className={styles.alertDialogWrapper}>
                								<div className={styles.alertDialog}>
                  									<div className={styles.alertdialogheader}>
                    										<div className={styles.alertdialogheader2}>
                      											<div className={styles.deineBisherDefinierten}>Deine bisher definierten Rechtsgebiete sind:</div>
                    										</div>
                  									</div>
                  									<div className={styles.tagsContainerWrapper}>
                    										<div className={styles.tagsContainer}>
                      											<div className={styles.tagesthemenAmount}>
                        												<div className={styles.tagsContainer}>
                          													<div className={styles.blocktyp}>
                            														<div className={styles.badge}>Zivilrecht</div>
                          													</div>
                          													<div className={styles.fach} />
                        												</div>
                      											</div>
                      											<div className={styles.fach} />
                    										</div>
                  									</div>
                  									<div className={styles.tagsContainer3}>
                    										<div className={styles.fach} />
                    										<div className={styles.tagesthemenAmount}>
                      											<div className={styles.tagsContainer}>
                        												<div className={styles.tagesthemenAmount}>
                          													<div className={styles.tagsContainer}>
                            														<div className={styles.blocktyp2}>
                              															<div className={styles.badge}>Öffentliches Recht</div>
                            														</div>
                            														<div className={styles.fach} />
                          													</div>
                        												</div>
                        												<div className={styles.fach} />
                      											</div>
                    										</div>
                  									</div>
                  									<div className={styles.tagsContainer6}>
                    										<div className={styles.fach} />
                    										<div className={styles.tagesthemenAmount}>
                      											<div className={styles.tagsContainer}>
                        												<div className={styles.tagesthemenAmount}>
                          													<div className={styles.tagsContainer}>
                            														<div className={styles.blocktyp3}>
                              															<div className={styles.badge}>Strafrecht</div>
                            														</div>
                            														<div className={styles.fach} />
                          													</div>
                        												</div>
                        												<div className={styles.fach} />
                      											</div>
                    										</div>
                  									</div>
                								</div>
              							</div>
              							<div className={styles.lernzeitraumBestimmen}>
                								<div className={styles.alertDialog2}>
                  									<div className={styles.alertdialogheader3}>
                    										<div className={styles.alertdialogheader4}>
                      											<div className={styles.unterrechtsgebieteSelbstErst}>Unterrechtsgebiete selbst erstellen</div>
                      											<div className={styles.fallsDuZu}>Falls du zu jedem Rechtsgebiet alle Unterrechtsgebiete selbst erstellen willst, dann wähle diese Funktion aus.</div>
                    										</div>
                  									</div>
                  									<div className={styles.alertdialogfooter}>
                    										<div className={styles.button}>
                      											<div className={styles.button2}>Auswählen</div>
                      											<img className={styles.iconCirclecheckbig} alt="" />
                    										</div>
                  									</div>
                								</div>
                								<div className={styles.alertDialog3}>
                  									<div className={styles.alertdialogheader3}>
                    										<div className={styles.alertdialogheader6}>
                      											<div className={styles.tagsContainer9}>
                        												<div className={styles.blocktyp4}>
                          													<div className={styles.badge}>Empfohlen</div>
                          													<img className={styles.iconBadgecheck} alt="" />
                        												</div>
                        												<div className={styles.fach} />
                      											</div>
                      											<div className={styles.mitEinerListe}>Mit einer Liste gänginger Unterrechtsgebiete beginnen</div>
                      											<div className={styles.fallsDuZu}>Zu jedem REchtsgebiet werden automatisch alle gängigen Unterrechtsgebiete erstellt. Du kannst diese Liste später bearbeiten und URGs löschen sowie eigene hinzufügen.</div>
                    										</div>
                  									</div>
                  									<div className={styles.alertdialogfooter2}>
                    										<div className={styles.button}>
                      											<div className={styles.button2}>Auswählen</div>
                      											<img className={styles.iconCirclecheckbig} alt="" />
                    										</div>
                  									</div>
                								</div>
              							</div>
              							<div className={styles.alert}>
                								<div className={styles.flex}>
                  									<img className={styles.divIcon} alt="" />
                  									<div className={styles.div}>
                    										<div className={styles.rechtsgebieteNdern}>Rechtsgebiete ändern</div>
                    										<div className={styles.duKannstDie}>Du kannst die Rechtsgebiete in den Einstellungen anpassen.</div>
                  									</div>
                								</div>
                								<div className={styles.button5} />
              							</div>
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter3}>
            						<div className={styles.button6}>
              							<div className={styles.button2}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter4}>
            						<div className={styles.button6}>
              							<div className={styles.button2}>{`Speichern & Schließen`}</div>
            						</div>
            						<div className={styles.button10}>
              							<div className={styles.button2}>Weiter</div>
              							<img className={styles.iconCirclecheckbig} alt="" />
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
    		</div>);
};

export default LernplanProzessBase as FunctionComponent;


**Notizen:**


---

### Schritt 8 (Pfad: Als Liste erstellen)
**Status:** Ausstehend

**Figma Code:**
import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.dashboard}>
              							<img className={styles.spinnerIcon} alt="" />
              							<div className={styles.mentorQuizHeader}>
                								<div className={styles.mitWelchemRechtsgebiet}>Mit welchem Rechtsgebiet möchtest du beginnen?</div>
                  									</div>
                  									<div className={styles.imNchstenSchritt}>Im nächsten Schritt kannst deinen Themen Aufgaben hinzufügen. Außerdem kannst du Blöcke unterschiedlicher Dauer erstellen, je nachdem wie viele Blöcke in deiner Tagesstruktur vorhanden sind, und alle Themen in diesen Blöcken unterbringen. So kannst du planen, wie lange du für die Bearbeitung brauchst und deinen Lernplan optimal zusammenstellen.</div>
                  									<div className={styles.contentWrapper}>
                    										<div className={styles.radioGroup}>
                      											<div className={styles.radiobutton}>
                        												<div className={styles.radio} />
                        												<div className={styles.fieldContent}>
                          													<div className={styles.description}>Semesterdurchschnitte über die Gesamtdauer anzeigen.</div>
                          													<div className={styles.lernblockTitel}>
                            														<div className={styles.zivilrecht}>Zivilrecht</div>
                          													</div>
                        												</div>
                        												<div className={styles.erledigtWrapper}>
                          													<div className={styles.erledigt}>erledigt</div>
                          													<img className={styles.iconCheck} alt="" />
                        												</div>
                      											</div>
                    										</div>
                    										<div className={styles.radioGroup2}>
                      											<div className={styles.radiobutton2}>
                        												<img className={styles.radioIcon} alt="" />
                        												<div className={styles.erledigtWrapper2}>
                          													<div className={styles.erledigt}>erledigt</div>
                          													<div className={styles.iconCheck2} />
                        												</div>
                        												<div className={styles.fieldContent2}>
                          													<div className={styles.description}>Semesterdurchschnitte über die Gesamtdauer anzeigen.</div>
                          													<div className={styles.lernblockTitel}>
                            														<div className={styles.zivilrecht}>Öffentliches Recht</div>
                          													</div>
                        												</div>
                      											</div>
                      											<div className={styles.radiobutton3} />
                      											<div className={styles.radiobutton3} />
                      											<div className={styles.radiobutton3} />
                    										</div>
                    										<div className={styles.radioGroup2}>
                      											<div className={styles.radiobutton6}>
                        												<div className={styles.radio} />
                        												<div className={styles.erledigtWrapper2}>
                          													<div className={styles.erledigt}>erledigt</div>
                          													<div className={styles.iconCheck2} />
                        												</div>
                        												<div className={styles.fieldContent2}>
                          													<div className={styles.description}>Semesterdurchschnitte über die Gesamtdauer anzeigen.</div>
                          													<div className={styles.lernblockTitel}>
                            														<div className={styles.zivilrecht}>Strafrecht</div>
                          													</div>
                        												</div>
                      											</div>
                      											<div className={styles.radiobutton7} />
                      											<div className={styles.radiobutton3} />
                      											<div className={styles.radiobutton3} />
                      											<div className={styles.radiobutton3} />
                    										</div>
                  									</div>
                  									</div>
                  									</div>
                  									<div className={styles.scrollBarContainer}>
                    										<img className={styles.progressIcon} alt="" />
                  									</div>
                  									</div>
                  									<div className={styles.buttonRowFooter}>
                    										<div className={styles.alertdialogfooter}>
                      											<div className={styles.button}>
                        												<div className={styles.erledigt}>Zurück</div>
                      											</div>
                    										</div>
                    										<div className={styles.alertdialogfooter2}>
                      											<div className={styles.button}>
                        												<div className={styles.erledigt}>{`Speichern & Schließen`}</div>
                      											</div>
                      											<div className={styles.button5}>
                        												<div className={styles.erledigt}>Weiter</div>
                        												<img className={styles.iconCheck} alt="" />
                      											</div>
                    										</div>
                  									</div>
                  									</div>
                  									<div className={styles.headerNoMenu}>
                    										<img className={styles.logoContainerIcon} alt="" />
                    										<div className={styles.navigationmenu} />
                    										<div className={styles.avatar}>
                      											<div className={styles.cn}>CN</div>
                    										</div>
                  									</div>
                  									</div>);
                								};
                								
                								export default LernplanProzessBase as FunctionComponent;
                								

**Notizen:**


---

### Schritt 9 (Pfad: Als Liste erstellen)
**Status:** Ausstehend

**Figma Code:**
import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.contentHeader}>
              							<div className={styles.contentHeader2}>
                								<div className={styles.schritt7Alt2Header}>
                  									<div className={styles.typographyH1}>
                    										<div className={styles.thisIsHeading}>Unterrechtsgebiete für Zivilrecht</div>
                  									</div>
                  									<div className={styles.beschreibungDesLernplans}>Beschreibung des Lernplans</div>
                								</div>
              							</div>
            						</div>
            						<img className={styles.lineIcon} alt="" />
            						<div className={styles.mainContentWrapper}>
              							<div className={styles.wrapper}>
                								<div className={styles.tagsContainer}>
                  									<div className={styles.blocktyp}>
                    										<div className={styles.badge}>3 Unterrechtsgebiete</div>
                  									</div>
                  									<div className={styles.fach} />
                								</div>
                								<div className={styles.lernblock}>
                  									<img className={styles.buttonminusIcon} alt="" />
                  									<div className={styles.lernblockTitel}>
                    										<div className={styles.bgbAt}>BGB AT</div>
                  									</div>
                  									<img className={styles.buttonminusIcon} alt="" />
                								</div>
                								<div className={styles.lernblock}>
                  									<img className={styles.buttonminusIcon} alt="" />
                  									<div className={styles.lernblockTitel}>
                    										<div className={styles.bgbAt}>Schuldrecht AT</div>
                  									</div>
                  									<img className={styles.buttonminusIcon} alt="" />
                								</div>
                								<div className={styles.lernblock}>
                  									<img className={styles.buttonminusIcon} alt="" />
                  									<div className={styles.lernblockTitel}>
                    										<div className={styles.bgbAt}>BGB BT</div>
                  									</div>
                  									<img className={styles.buttonminusIcon} alt="" />
                								</div>
                								<div className={styles.button}>
                  									<div className={styles.button2}>Neues Unterrechtsgebiet</div>
                  									<img className={styles.iconPlus} alt="" />
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button3}>
              							<div className={styles.button2}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter2}>
            						<div className={styles.button3}>
              							<div className={styles.button2}>{`Speichern & Schließen`}</div>
            						</div>
            						<div className={styles.button7}>
              							<div className={styles.button2}>Weiter</div>
              							<img className={styles.iconPlus} alt="" />
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
    		</div>);
};

export default LernplanProzessBase as FunctionComponent;


**Notizen:**

erst wenn zu allen in den einstellungen erstellten rechtsgebieten die unterrechtsgebiete zugeornet hat, geht es hier weiter. also man ordnet einem rechtsgbiet die unterrechtsgebiete zu und dann klickt man auf weiter und dann wird man wieder zu vorigem screen geleitet und dann muss man dem nächsten rechtsgebiet die unterrechtsgebiete zu ordnen. und wenn allen rechtsgebieten unterrechtsgebiete zugeordnet hat, dann geht man zu dem foglenden screen


### Schritt 10 (Pfad: Als Liste erstellen)
**Status:** Ausstehend

**Figma Code:**
import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.dashboard}>
              							<img className={styles.spinnerIcon} alt="" />
              							<div className={styles.mentorQuizHeader}>
                								<div className={styles.deineUnterrechtsgebieteWurde}>Deine Unterrechtsgebiete wurden erfolgreich in deinen Lernplan übernommen.</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button}>
              							<div className={styles.button2}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter2}>
            						<div className={styles.button}>
              							<div className={styles.button2}>{`Speichern & Schließen`}</div>
            						</div>
            						<div className={styles.button5}>
              							<div className={styles.button2}>Weiter</div>
              							<img className={styles.iconArrowright} alt="" />
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
      			<div className={styles.pageBody2}>
        				<div className={styles.contentBody}>
          					<div className={styles.content} />
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter2}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button}>
              							<div className={styles.button2}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter2}>
            						<div className={styles.button}>
              							<div className={styles.button2}>{`Speichern & Schließen`}</div>
            						</div>
            						<div className={styles.button5}>
              							<div className={styles.button2}>Weiter</div>
              							<img className={styles.iconArrowright} alt="" />
            						</div>
          					</div>
        				</div>
      			</div>
    		</div>);
};

export default LernplanProzessBase as FunctionComponent;


## schritt 10.1 

import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.dashboard}>
              							<img className={styles.spinnerIcon} alt="" />
              							<div className={styles.mentorQuizHeader}>
                								<div className={styles.achtungBeimBernehmen}>Achtung, beim übernehmen deiner Unterrechtsgebiete sind Probleme aufgetreten.</div>
              							</div>
              							<div className={styles.problemhinweise}>
                								<div className={styles.flex}>
                  									<img className={styles.divIcon} alt="" />
                  									<div className={styles.div}>
                    										<div className={styles.alertTitle}>Probleme</div>
                    										<div className={styles.thisIsAnContainer}>
                      											<ul className={styles.hierWerdenDieProblemeAufge}>
                        												<li>Hier werden die Probleme aufgelistet, die der Nutzer zu beheben hat.</li>
                      											</ul>
                    										</div>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button}>
              							<div className={styles.button2}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button}>
              							<div className={styles.button2}>{`Speichern & Schließen`}</div>
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
    		</div>);
};

export default LernplanProzessBase as FunctionComponent;


**Notizen:**

es gibt zwei versionen von diesem screen nur für den fall das ein fehler aufgetretten ist. 


*(Weitere Schritte nach Bedarf hinzufügen)*


## schritt 11 

import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.dashboard}>
              							<img className={styles.spinnerIcon} alt="" />
              							<div className={styles.mentorQuizHeader}>
                								<div className={styles.hinzufgenVonThemen}>{`Hinzufügen von Themen & Aufgaben`}</div>
              							</div>
              							<div className={styles.imNchstenSchritt}>{`Im nächsten Schritt kannst deinen Unterrechtsgebieten Themen & Aufgaben hinzufügen. `}</div>
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button}>
              							<div className={styles.button2}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter2}>
            						<div className={styles.button}>
              							<div className={styles.button2}>{`Speichern & Schließen`}</div>
            						</div>
            						<div className={styles.button5}>
              							<div className={styles.button2}>Weiter</div>
              							<img className={styles.iconArrowright} alt="" />
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
    		</div>);
};

export default LernplanProzessBase as FunctionComponent;

---

## schritt 12 

import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.dashboard}>
              							<img className={styles.spinnerIcon} alt="" />
              							<div className={styles.mentorQuizHeader}>
                								<div className={styles.hinzufgenVonThemen}>{`Hinzufügen von Themen & Aufgaben`}</div>
              							</div>
              							<div className={styles.imNchstenSchritt}>{`Im nächsten Schritt kannst deinen Unterrechtsgebieten Themen & Aufgaben hinzufügen. `}</div>
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button}>
              							<div className={styles.button2}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter2}>
            						<div className={styles.button}>
              							<div className={styles.button2}>{`Speichern & Schließen`}</div>
            						</div>
            						<div className={styles.button5}>
              							<div className={styles.button2}>Weiter</div>
              							<img className={styles.iconArrowright} alt="" />
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
    		</div>);
};

export default LernplanProzessBase as FunctionComponent;

## Notizen 

hier haben wir nicht klar ausgearbeitet wie man hier zwischen den rechtsgebieten wechseln soll, da muss noch was hin

## schritt 13 

import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.dashboard}>
              							<img className={styles.spinnerIcon} alt="" />
              							<div className={styles.mentorQuizHeader}>
                								<div className={styles.deineThemen}>{`Deine Themen & Aufgaben wurden erfolgreich in deinen Lernplan übernommen.`}</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button}>
              							<div className={styles.button2}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter2}>
            						<div className={styles.button}>
              							<div className={styles.button2}>{`Speichern & Schließen`}</div>
            						</div>
            						<div className={styles.button5}>
              							<div className={styles.button2}>Weiter</div>
              							<img className={styles.iconArrowright} alt="" />
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
    		</div>);
};

export default LernplanProzessBase as FunctionComponent;

## schritt 13.1

import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.dashboard}>
              							<img className={styles.spinnerIcon} alt="" />
              							<div className={styles.mentorQuizHeader}>
                								<div className={styles.achtungBeimBernehmen}>{`Achtung, beim übernehmen deiner Themen & Aufgaben sind Probleme aufgetreten.`}</div>
              							</div>
              							<div className={styles.problemhinweise}>
                								<div className={styles.flex}>
                  									<img className={styles.divIcon} alt="" />
                  									<div className={styles.div}>
                    										<div className={styles.alertTitle}>Probleme</div>
                    										<div className={styles.thisIsAnContainer}>
                      											<ul className={styles.hierWerdenDieProblemeAufge}>
                        												<li>Hier werden die Probleme aufgelistet, die der Nutzer zu beheben hat.</li>
                      											</ul>
                    										</div>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button}>
              							<div className={styles.button2}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button}>
              							<div className={styles.button2}>{`Speichern & Schließen`}</div>
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
    		</div>);
};

export default LernplanProzessBase as FunctionComponent;


## Notizen

auch hier wieder ein fehlerscreen, für den fall das irgendetwas wieder schief gelaufen ist

## schritt 14

import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.dashboard}>
              							<img className={styles.spinnerIcon} alt="" />
              							<div className={styles.mentorQuizHeader}>
                								<div className={styles.zielgewichtungDerRechtsgebie}>Zielgewichtung der Rechtsgebiete</div>
              							</div>
              							<div className={styles.damitDuWhrend}>Damit du während der folgenden Schritte deine grobe ZIelgewichtung der Rechtsgebiete nicht aus dem Blick verliest, hast du jetzt die Möglichkeit eine Zielverteilung anzugeben. Du musst diese beim Erstellen nicht zwingend einhalten, allerdings verschafft dsie dir ein GEf+hl dafür, wie viel Zeit du für deine URGs und Themen hast.</div>
              							<div className={styles.button}>
                								<div className={styles.button2}>Zielgewichtung festlegen</div>
              							</div>
              							<div className={styles.itemParent}>
                								<div className={styles.item}>
                  									<div className={styles.itemMedia} />
                  									<div className={styles.itemcontent}>
                    										<div className={styles.itemTitle}>Öffentliches Recht</div>
                  									</div>
                  									<div className={styles.itemActions} />
                  									<div className={styles.buttongroupSelection}>
                    										<img className={styles.buttonIcon} alt="" />
                    										<div className={styles.button3}>
                      											<div className={styles.button4}>20 %</div>
                    										</div>
                    										<div className={styles.button5}>
                      											<img className={styles.iconPlus} alt="" />
                    										</div>
                  									</div>
                								</div>
                								<div className={styles.item2}>
                  									<div className={styles.itemMedia} />
                  									<div className={styles.itemcontent}>
                    										<div className={styles.itemTitle}>Zivilrecht</div>
                  									</div>
                  									<div className={styles.itemActions} />
                  									<div className={styles.buttongroupSelection}>
                    										<img className={styles.buttonIcon} alt="" />
                    										<div className={styles.button3}>
                      											<div className={styles.button4}>60 %</div>
                    										</div>
                    										<div className={styles.button5}>
                      											<img className={styles.iconPlus} alt="" />
                    										</div>
                  									</div>
                								</div>
                								<div className={styles.item3}>
                  									<div className={styles.itemMedia} />
                  									<div className={styles.itemcontent}>
                    										<div className={styles.itemTitle}>Strafrecht</div>
                  									</div>
                  									<div className={styles.itemActions} />
                  									<div className={styles.buttongroupSelection}>
                    										<img className={styles.buttonIcon} alt="" />
                    										<div className={styles.button3}>
                      											<div className={styles.button4}>20 %</div>
                    										</div>
                    										<div className={styles.button5}>
                      											<img className={styles.iconPlus} alt="" />
                    										</div>
                  									</div>
                								</div>
              							</div>
              							<div className={styles.problemhinweise} />
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button12}>
              							<div className={styles.button2}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter2}>
            						<div className={styles.button12}>
              							<div className={styles.button2}>{`Speichern & Schließen`}</div>
            						</div>
            						<div className={styles.button16}>
              							<div className={styles.button2}>Weiter</div>
              							<img className={styles.iconArrowright} alt="" />
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
    		</div>);
};

export default LernplanProzessBase as FunctionComponent;

## schritt 14.1

import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.dashboard}>
              							<img className={styles.spinnerIcon} alt="" />
              							<div className={styles.mentorQuizHeader}>
                								<div className={styles.zielgewichtungDerRechtsgebie}>Zielgewichtung der Rechtsgebiete</div>
              							</div>
              							<div className={styles.damitDuWhrend}>Damit du während der folgenden Schritte deine grobe ZIelgewichtung der Rechtsgebiete nicht aus dem Blick verliest, hast du jetzt die Möglichkeit eine Zielverteilung anzugeben. Du musst diese beim Erstellen nicht zwingend einhalten, allerdings verschafft dsie dir ein GEf+hl dafür, wie viel Zeit du für deine URGs und Themen hast.</div>
              							<div className={styles.button}>
                								<div className={styles.button2}>Zielgewichtung entfernen</div>
              							</div>
              							<div className={styles.itemParent}>
                								<div className={styles.item}>
                  									<div className={styles.itemMedia} />
                  									<div className={styles.itemcontent}>
                    										<div className={styles.itemTitle}>Öffentliches Recht</div>
                  									</div>
                  									<div className={styles.itemActions} />
                  									<div className={styles.buttongroupSelection}>
                    										<img className={styles.buttonIcon} alt="" />
                    										<div className={styles.button3}>
                      											<div className={styles.button4}>20 %</div>
                    										</div>
                    										<div className={styles.button5}>
                      											<img className={styles.iconPlus} alt="" />
                    										</div>
                  									</div>
                								</div>
                								<div className={styles.item2}>
                  									<div className={styles.itemMedia} />
                  									<div className={styles.itemcontent}>
                    										<div className={styles.itemTitle}>Zivilrecht</div>
                  									</div>
                  									<div className={styles.itemActions} />
                  									<div className={styles.buttongroupSelection}>
                    										<img className={styles.buttonIcon} alt="" />
                    										<div className={styles.button3}>
                      											<div className={styles.button4}>54 %</div>
                    										</div>
                    										<div className={styles.button5}>
                      											<img className={styles.iconPlus} alt="" />
                    										</div>
                  									</div>
                								</div>
                								<div className={styles.item3}>
                  									<div className={styles.itemMedia} />
                  									<div className={styles.itemcontent}>
                    										<div className={styles.itemTitle}>Strafrecht</div>
                  									</div>
                  									<div className={styles.itemActions} />
                  									<div className={styles.buttongroupSelection}>
                    										<img className={styles.buttonIcon} alt="" />
                    										<div className={styles.button3}>
                      											<div className={styles.button4}>20 %</div>
                    										</div>
                    										<div className={styles.button5}>
                      											<img className={styles.iconPlus} alt="" />
                    										</div>
                  									</div>
                								</div>
              							</div>
              							<div className={styles.problemhinweise}>
                								<div className={styles.flex}>
                  									<img className={styles.divIcon} alt="" />
                  									<div className={styles.div}>
                    										<div className={styles.alertTitle}>Probleme</div>
                    										<div className={styles.thisIsAnContainer}>
                      											<ul className={styles.deineGewichtungenMssenInse}>
                        												<li>Deine Gewichtungen müssen insegesamt 100% ergeben.</li>
                      											</ul>
                    										</div>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button}>
              							<div className={styles.button2}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter2}>
            						<div className={styles.button}>
              							<div className={styles.button2}>{`Speichern & Schließen`}</div>
            						</div>
            						<div className={styles.button16}>
              							<div className={styles.button2}>Weiter</div>
              							<img className={styles.iconArrowright} alt="" />
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
    		</div>);
};

export default LernplanProzessBase as FunctionComponent;


## Notizen

hier wieder ein fehlerscreen 


## schritt 15

import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.contentHeader}>
              							<div className={styles.contentHeader2}>
                								<div className={styles.schritt7Alt2Header}>
                  									<div className={styles.typographyH1}>
                    										<div className={styles.thisIsHeading}>Füge den Unterrechtsgebieten Themen hinzu.</div>
                  									</div>
                  									<div className={styles.beschreibungDesLernplans}>Beschreibung des Lernplans</div>
                								</div>
              							</div>
            						</div>
            						<img className={styles.lineIcon} alt="" />
            						<div className={styles.mainContentWrapper}>
              							<div className={styles.alertDialogWrapper}>
                								<div className={styles.alertDialog}>
                  									<div className={styles.alertdialogheader}>
                    										<div className={styles.alertdialogheader2}>
                      											<div className={styles.erstelleDieThemen}>Erstelle die Themen für:</div>
                    										</div>
                  									</div>
                  									<div className={styles.tagsContainerWrapper}>
                    										<div className={styles.tagsContainer}>
                      											<div className={styles.tagesthemenAmount}>
                        												<div className={styles.tagsContainer}>
                          													<div className={styles.blocktyp}>
                            														<div className={styles.badge}>Zivilrecht</div>
                          													</div>
                          													<div className={styles.fach} />
                        												</div>
                      											</div>
                      											<div className={styles.fach} />
                    										</div>
                  									</div>
                  									<div className={styles.tagsContainer}>
                    										<div className={styles.fach} />
                    										<div className={styles.tagesthemenAmount}>
                      											<div className={styles.tagsContainer}>
                        												<div className={styles.tagesthemenAmount}>
                          													<div className={styles.tagsContainer}>
                            														<div className={styles.blocktyp2}>
                              															<div className={styles.badge}>Öffentliches Recht</div>
                            														</div>
                            														<div className={styles.fach} />
                          													</div>
                        												</div>
                        												<div className={styles.fach} />
                      											</div>
                    										</div>
                  									</div>
                  									<div className={styles.tagsContainer}>
                    										<div className={styles.fach} />
                    										<div className={styles.tagesthemenAmount}>
                      											<div className={styles.tagsContainer}>
                        												<div className={styles.tagesthemenAmount}>
                          													<div className={styles.tagsContainer}>
                            														<div className={styles.blocktyp2}>
                              															<div className={styles.badge}>Strafrecht</div>
                            														</div>
                            														<div className={styles.fach} />
                          													</div>
                        												</div>
                        												<div className={styles.fach} />
                      											</div>
                    										</div>
                  									</div>
                								</div>
              							</div>
              							<div className={styles.mainContentWrapper2}>
                								<div className={styles.navigationmenuPopover}>
                  									<div className={styles.navigationmenuMenuLink}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>BGB Allgemeiner Teil</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>BGB BT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink4}>
                    										<div className={styles.menuItemHolder}>
                      											<img className={styles.iconPencil} alt="" />
                      											<div className={styles.urgsAnpassen}>URGs anpassen</div>
                    										</div>
                  									</div>
                								</div>
                								<div className={styles.themaUndAufgaben}>
                  									<div className={styles.kapitelberschrift}>
                    										<div className={styles.lernplanKapitelMasterHeader}>
                      											<div className={styles.lernblockTitel}>
                        												<div className={styles.rechtsgeschftslehre}>BGB Allgemeiner Teil</div>
                      											</div>
                    										</div>
                  									</div>
                  									<div className={styles.frameParent}>
                    										<img className={styles.frameChild} alt="" />
                    										<div className={styles.aufgabenContainer}>
                      											<div className={styles.lernblock}>
                        												<img className={styles.buttonminusIcon} alt="" />
                        												<div className={styles.lernblockTitel2}>
                          													<div className={styles.rechtsgeschftslehre}>Rechtsgeschäftslehre</div>
                        												</div>
                        												<img className={styles.buttonminusIcon} alt="" />
                      											</div>
                      											<div className={styles.lernblock}>
                        												<img className={styles.buttonminusIcon} alt="" />
                        												<div className={styles.lernblockTitel2}>
                          													<div className={styles.rechtsgeschftslehre}>Anfechtung</div>
                        												</div>
                        												<img className={styles.buttonminusIcon} alt="" />
                      											</div>
                      											<div className={styles.button}>
                        												<div className={styles.button2}>Neues Thema hinzufügen</div>
                        												<img className={styles.iconPencil} alt="" />
                      											</div>
                    										</div>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button3}>
              							<div className={styles.button2}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter2}>
            						<div className={styles.button3}>
              							<div className={styles.button2}>{`Speichern & Schließen`}</div>
            						</div>
            						<div className={styles.button7}>
              							<div className={styles.button2}>Weiter</div>
              							<img className={styles.iconPencil} alt="" />
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
    		</div>);
};

export default LernplanProzessBase as FunctionComponent;


## schritt 16

import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.dashboard}>
              							<img className={styles.spinnerIcon} alt="" />
              							<div className={styles.mentorQuizHeader}>
                								<div className={styles.einteilungDerThemen}>Einteilung der Themen in Blöcke</div>
              							</div>
              							<div className={styles.deinLernplanIst}>Dein Lernplan ist derzeit eine Ansammlung von Unterrechtsgebieten, Themen und Aufgaben in Form einer Liste. Damit du deine Lerninhalte sinnvoll in deine Wochenstrukturen einsortieren kannst, musst du Lernblöcke in passender Länge erstellen und darin Themen unterbringen. Möchtest du ein Thema auf mehreren Blöcke aufteilen, kannst du es einfach  per Mausklick aufteilen.</div>
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button}>
              							<div className={styles.button2}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter2}>
            						<div className={styles.button}>
              							<div className={styles.button2}>{`Speichern & Schließen`}</div>
            						</div>
            						<div className={styles.button5}>
              							<div className={styles.button2}>Weiter</div>
              							<img className={styles.iconArrowright} alt="" />
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
    		</div>);
};

export default LernplanProzessBase as FunctionComponent;

## schritt 17

import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.dashboard}>
              							<img className={styles.spinnerIcon} alt="" />
              							<div className={styles.mentorQuizHeader}>
                								<div className={styles.mitWelchemRechtsgebiet}>Mit welchem Rechtsgebiet möchtest du beginnen?</div>
                  									</div>
                  									<div className={styles.imNchstenSchritt}>Im nächsten Schritt kannst deinen Themen Aufgaben hinzufügen. Außerdem kannst du Blöcke unterschiedlicher Dauer erstellen, je nachdem wie viele Blöcke in deiner Tagesstruktur vorhanden sind, und alle Themen in diesen Blöcken unterbringen. So kannst du planen, wie lange du für die Bearbeitung brauchst und deinen Lernplan optimal zusammenstellen.</div>
                  									<div className={styles.contentWrapper}>
                    										<div className={styles.radioGroup}>
                      											<div className={styles.radiobutton}>
                        												<div className={styles.radio} />
                        												<div className={styles.fieldContent}>
                          													<div className={styles.description}>Semesterdurchschnitte über die Gesamtdauer anzeigen.</div>
                          													<div className={styles.tagsContainerWrapper}>
                            														<div className={styles.tagsContainer}>
                              															<div className={styles.tagesthemenAmount}>
                                																<div className={styles.tagsContainer}>
                                  																	<div className={styles.blocktyp}>
                                    																		<div className={styles.badge}>Zivilrecht</div>
                                  																	</div>
                                  																	<div className={styles.fach} />
                                																</div>
                              															</div>
                              															<div className={styles.fach} />
                            														</div>
                          													</div>
                        												</div>
                        												<div className={styles.erledigtWrapper}>
                          													<div className={styles.erledigt}>erledigt</div>
                          													<img className={styles.iconCheck} alt="" />
                        												</div>
                      											</div>
                    										</div>
                    										<div className={styles.radioGroup2}>
                      											<div className={styles.radiobutton2}>
                        												<img className={styles.radioIcon} alt="" />
                        												<div className={styles.fieldContent}>
                          													<div className={styles.description}>Semesterdurchschnitte über die Gesamtdauer anzeigen.</div>
                          													<div className={styles.tagsContainer3}>
                            														<div className={styles.fach} />
                            														<div className={styles.tagesthemenAmount}>
                              															<div className={styles.tagsContainer}>
                                																<div className={styles.tagesthemenAmount}>
                                  																	<div className={styles.tagsContainer}>
                                    																		<div className={styles.blocktyp2}>
                                      																			<div className={styles.badge}>Öffentliches Recht</div>
                                    																		</div>
                                    																		<div className={styles.fach} />
                                  																	</div>
                                																</div>
                                																<div className={styles.fach} />
                              															</div>
                            														</div>
                          													</div>
                        												</div>
                        												<div className={styles.erledigtWrapper2}>
                          													<div className={styles.erledigt}>erledigt</div>
                          													<div className={styles.iconCheck2} />
                        												</div>
                      											</div>
                      											<div className={styles.radiobutton3} />
                      											<div className={styles.radiobutton3} />
                      											<div className={styles.radiobutton3} />
                    										</div>
                    										<div className={styles.radioGroup2}>
                      											<div className={styles.radiobutton6}>
                        												<div className={styles.radio} />
                        												<div className={styles.fieldContent}>
                          													<div className={styles.description}>Semesterdurchschnitte über die Gesamtdauer anzeigen.</div>
                          													<div className={styles.tagsContainer6}>
                            														<div className={styles.fach} />
                            														<div className={styles.tagesthemenAmount}>
                              															<div className={styles.tagsContainer}>
                                																<div className={styles.tagesthemenAmount}>
                                  																	<div className={styles.tagsContainer}>
                                    																		<div className={styles.blocktyp3}>
                                      																			<div className={styles.badge}>Strafrecht</div>
                                    																		</div>
                                    																		<div className={styles.fach} />
                                  																	</div>
                                																</div>
                                																<div className={styles.fach} />
                              															</div>
                            														</div>
                          													</div>
                        												</div>
                        												<div className={styles.erledigtWrapper2}>
                          													<div className={styles.erledigt}>erledigt</div>
                          													<div className={styles.iconCheck2} />
                        												</div>
                      											</div>
                      											<div className={styles.radiobutton7} />
                      											<div className={styles.radiobutton3} />
                      											<div className={styles.radiobutton3} />
                      											<div className={styles.radiobutton3} />
                    										</div>
                  									</div>
                  									</div>
                  									</div>
                  									<div className={styles.scrollBarContainer}>
                    										<img className={styles.progressIcon} alt="" />
                  									</div>
                  									</div>
                  									<div className={styles.buttonRowFooter}>
                    										<div className={styles.alertdialogfooter}>
                      											<div className={styles.button}>
                        												<div className={styles.erledigt}>Zurück</div>
                      											</div>
                    										</div>
                    										<div className={styles.alertdialogfooter2}>
                      											<div className={styles.button}>
                        												<div className={styles.erledigt}>{`Speichern & Schließen`}</div>
                      											</div>
                      											<div className={styles.button5}>
                        												<div className={styles.erledigt}>Weiter</div>
                        												<img className={styles.iconCheck} alt="" />
                      											</div>
                    										</div>
                  									</div>
                  									</div>
                  									<div className={styles.headerNoMenu}>
                    										<img className={styles.logoContainerIcon} alt="" />
                    										<div className={styles.navigationmenu} />
                    										<div className={styles.avatar}>
                      											<div className={styles.cn}>CN</div>
                    										</div>
                  									</div>
                  									</div>);
                								};
                								
                								export default LernplanProzessBase as FunctionComponent;



## schritt 18

import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.contentHeader}>
              							<div className={styles.contentHeader2}>
                								<div className={styles.schritt7Alt2Header}>
                  									<div className={styles.typographyH1}>
                    										<div className={styles.thisIsHeading}>Lernblöcke für Öffentliches Recht</div>
                  									</div>
                  									<div className={styles.counterMitGewichtung}>
                    										<div className={styles.dialogHeader}>
                      											<div className={styles.tagsContainer}>
                        												<div className={styles.tagesthemenAmount}>
                          													<div className={styles.tagsContainer}>
                            														<div className={styles.blocktyp}>
                              															<div className={styles.badge}>Gewichtung 30%</div>
                            														</div>
                            														<div className={styles.fach} />
                          													</div>
                        												</div>
                        												<div className={styles.fach} />
                      											</div>
                    										</div>
                    										<div className={styles.itemcontentParent}>
                      											<div className={styles.itemcontent}>
                        												<div className={styles.gesamt}>gesamt</div>
                        												<div className={styles.div}>600</div>
                      											</div>
                      											<div className={styles.itemcontent}>
                        												<div className={styles.gesamt}>verbraucht</div>
                        												<div className={styles.div}>450</div>
                      											</div>
                      											<div className={styles.itemcontent}>
                        												<div className={styles.gesamt}>verfügbar</div>
                        												<div className={styles.div}>150</div>
                      											</div>
                      											<div className={styles.dayProgress}>
                        												<div className={styles.progressDescription}>75% verbraucht</div>
                        												<div className={styles.progressBar}>
                          													<div className={styles.track} />
                        												</div>
                      											</div>
                    										</div>
                    										<div className={styles.itemActions} />
                  									</div>
                								</div>
              							</div>
            						</div>
            						<img className={styles.lineIcon} alt="" />
            						<div className={styles.mainContentWrapper}>
              							<div className={styles.mainContentWrapper2}>
                								<div className={styles.navigationmenuPopover}>
                  									<div className={styles.navigationmenuMenuLink}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>BGB Allgemeiner Teil</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>BGB BT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                								</div>
                								<div className={styles.navigationmenuMenuLink17}>
                  									<div className={styles.menuItemHolder}>
                    										<img className={styles.iconPencil} alt="" />
                    										<div className={styles.bgbAllgemeinerTeil}>URGs anpassen</div>
                  									</div>
                								</div>
                								<div className={styles.themaUndAufgabenWrapper}>
                  									<div className={styles.themaUndAufgaben}>
                    										<div className={styles.kapitelberschrift}>
                      											<div className={styles.lernplanKapitelMasterHeader}>
                        												<div className={styles.lernblockTitel}>
                          													<div className={styles.erstelleLernblckeUnd}>Erstelle Lernblöcke und bringe alle Themen darin unter.</div>
                        												</div>
                      											</div>
                    										</div>
                    										<div className={styles.themaUndAufgabenParent}>
                      											<div className={styles.themaUndAufgaben2}>
                        												<div className={styles.kapitelberschrift2}>
                          													<div className={styles.lernplanKapitelMasterHeader}>
                            														<div className={styles.lernblockTitel}>
                              															<div className={styles.erstelleLernblckeUnd}>Meine Themen</div>
                            														</div>
                          													</div>
                          													<div className={styles.navigationmenuMenuLink18}>
                            														<div className={styles.menuItemHolder}>
                              															<img className={styles.iconPencil} alt="" />
                              															<div className={styles.bgbAllgemeinerTeil}>Themen anpassen</div>
                            														</div>
                          													</div>
                        												</div>
                        												<div className={styles.tagesthemenAmount}>
                          													<div className={styles.aufgabenContainer}>
                            														<div className={styles.lernblock}>
                              															<img className={styles.buttonminusIcon} alt="" />
                              															<div className={styles.lernblockTitel3}>
                                																<div className={styles.erstelleLernblckeUnd}>Rechtsgeschäftslehre</div>
                                																<div className={styles.frameParent}>
                                  																	<div className={styles.itemParent}>
                                    																		<div className={styles.item}>
                                      																			<div className={styles.checkbox}>
                                        																				<div className={styles.checkbox2} />
                                        																				<div className={styles.fieldContent}>
                                          																					<div className={styles.label}>Aufgabe</div>
                                        																				</div>
                                      																			</div>
                                      																			<div className={styles.buttonParent}>
                                        																				<div className={styles.button}>
                                          																					<div className={styles.button2}>!</div>
                                        																				</div>
                                        																				<div className={styles.button}>
                                          																					<div className={styles.button2}>!</div>
                                        																				</div>
                                      																			</div>
                                      																			<div className={styles.itemcontent4}>
                                        																				<div className={styles.itemTitle}>Aufgabentitel</div>
                                        																				<div className={styles.itemDescriptionGoes}>Aufgabenbeschreibung</div>
                                      																			</div>
                                    																		</div>
                                    																		<div className={styles.button5}>
                                      																			<img className={styles.iconTrash} alt="" />
                                    																		</div>
                                  																	</div>
                                  																	<div className={styles.itemParent}>
                                    																		<div className={styles.item}>
                                      																			<div className={styles.checkbox}>
                                        																				<div className={styles.checkbox2} />
                                        																				<div className={styles.fieldContent}>
                                          																					<div className={styles.label}>Aufgabe</div>
                                        																				</div>
                                      																			</div>
                                      																			<div className={styles.buttonParent}>
                                        																				<div className={styles.button}>
                                          																					<div className={styles.button2}>!</div>
                                        																				</div>
                                        																				<div className={styles.button}>
                                          																					<div className={styles.button2}>!</div>
                                        																				</div>
                                      																			</div>
                                      																			<div className={styles.itemcontent4}>
                                        																				<div className={styles.itemTitle}>Aufgabentitel</div>
                                        																				<div className={styles.itemDescriptionGoes}>Aufgabenbeschreibung</div>
                                      																			</div>
                                    																		</div>
                                    																		<div className={styles.button5}>
                                      																			<img className={styles.iconTrash} alt="" />
                                    																		</div>
                                  																	</div>
                                  																	<div className={styles.itemParent}>
                                    																		<div className={styles.item}>
                                      																			<div className={styles.checkbox}>
                                        																				<div className={styles.checkbox2} />
                                        																				<div className={styles.fieldContent}>
                                          																					<div className={styles.label}>Aufgabe</div>
                                        																				</div>
                                      																			</div>
                                      																			<div className={styles.buttonParent}>
                                        																				<div className={styles.button}>
                                          																					<div className={styles.button2}>!</div>
                                        																				</div>
                                        																				<div className={styles.button}>
                                          																					<div className={styles.button2}>!</div>
                                        																				</div>
                                      																			</div>
                                      																			<div className={styles.itemcontent4}>
                                        																				<div className={styles.itemTitle}>Aufgabentitel</div>
                                        																				<div className={styles.itemDescriptionGoes}>Aufgabenbeschreibung</div>
                                      																			</div>
                                    																		</div>
                                    																		<div className={styles.button5}>
                                      																			<img className={styles.iconTrash} alt="" />
                                    																		</div>
                                  																	</div>
                                  																	<div className={styles.button16}>
                                    																		<img className={styles.iconPencil} alt="" />
                                    																		<div className={styles.gesamt}>Neue Aufgabe</div>
                                  																	</div>
                                																</div>
                              															</div>
                            														</div>
                            														<div className={styles.lernblock}>
                              															<img className={styles.buttonminusIcon} alt="" />
                              															<div className={styles.lernblockTitel3}>
                                																<div className={styles.erstelleLernblckeUnd}>Anfechtung</div>
                                																<div className={styles.frameParent}>
                                  																	<div className={styles.itemParent}>
                                    																		<div className={styles.item}>
                                      																			<div className={styles.checkbox}>
                                        																				<div className={styles.checkbox2} />
                                        																				<div className={styles.fieldContent}>
                                          																					<div className={styles.label}>Aufgabe</div>
                                        																				</div>
                                      																			</div>
                                      																			<div className={styles.buttonParent}>
                                        																				<div className={styles.button}>
                                          																					<div className={styles.button2}>!</div>
                                        																				</div>
                                        																				<div className={styles.button}>
                                          																					<div className={styles.button2}>!</div>
                                        																				</div>
                                      																			</div>
                                      																			<div className={styles.itemcontent4}>
                                        																				<div className={styles.itemTitle}>Aufgabentitel</div>
                                        																				<div className={styles.itemDescriptionGoes}>Aufgabenbeschreibung</div>
                                      																			</div>
                                    																		</div>
                                    																		<div className={styles.button5}>
                                      																			<img className={styles.iconTrash} alt="" />
                                    																		</div>
                                  																	</div>
                                  																	<div className={styles.itemParent}>
                                    																		<div className={styles.item}>
                                      																			<div className={styles.checkbox}>
                                        																				<div className={styles.checkbox2} />
                                        																				<div className={styles.fieldContent}>
                                          																					<div className={styles.label}>Aufgabe</div>
                                        																				</div>
                                      																			</div>
                                      																			<div className={styles.buttonParent}>
                                        																				<div className={styles.button}>
                                          																					<div className={styles.button2}>!</div>
                                        																				</div>
                                        																				<div className={styles.button}>
                                          																					<div className={styles.button2}>!</div>
                                        																				</div>
                                      																			</div>
                                      																			<div className={styles.itemcontent4}>
                                        																				<div className={styles.itemTitle}>Aufgabentitel</div>
                                        																				<div className={styles.itemDescriptionGoes}>Aufgabenbeschreibung</div>
                                      																			</div>
                                    																		</div>
                                    																		<div className={styles.button5}>
                                      																			<img className={styles.iconTrash} alt="" />
                                    																		</div>
                                  																	</div>
                                  																	<div className={styles.button16}>
                                    																		<img className={styles.iconPencil} alt="" />
                                    																		<div className={styles.gesamt}>Neue Aufgabe</div>
                                  																	</div>
                                																</div>
                              															</div>
                            														</div>
                            														<div className={styles.button28}>
                              															<div className={styles.button29}>Neues Thema hinzufügen</div>
                              															<img className={styles.iconPencil} alt="" />
                            														</div>
                          													</div>
                        												</div>
                      											</div>
                      											<img className={styles.themaUndAufgabenIcon} alt="" />
                      											<div className={styles.themaUndAufgaben3}>
                        												<div className={styles.kapitelberschrift3}>
                          													<div className={styles.lernplanKapitelMasterHeader}>
                            														<div className={styles.lernblockTitel}>
                              															<div className={styles.erstelleLernblckeUnd}>Meine Lernblöcke</div>
                            														</div>
                          													</div>
                        												</div>
                      											</div>
                    										</div>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button30}>
              							<div className={styles.button29}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter2}>
            						<div className={styles.button30}>
              							<div className={styles.button29}>{`Speichern & Schließen`}</div>
            						</div>
            						<div className={styles.button34}>
              							<div className={styles.button29}>Weiter</div>
              							<img className={styles.iconPencil} alt="" />
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
    		</div>);
};

export default LernplanProzessBase as FunctionComponent;


## schritt 18.1

import { FunctionComponent } from 'react';
import styles from './Lernblock.module.css';


const Lernblock = () => {
  	return (
    		<div className={styles.lernblock}>
      			<div className={styles.leftDayParent}>
        				<div className={styles.leftDay} />
        				<div className={styles.leftDay} />
        				<div className={styles.leftDay} />
      			</div>
      			<div className={styles.lernblockTitel}>
        				<div className={styles.lernblockTitel2}>
          					<div className={styles.itemcontent}>
            						<div className={styles.lernblockDerGre}>Lernblock der Größe</div>
          					</div>
          					<img className={styles.buttonwrapperIcon} alt="" />
        				</div>
      			</div>
    		</div>);
};

export default Lernblock as FunctionComponent;

## Notizen

das ist der body zu lernblöcke, weil im schritt 18 ist eine größere Lücke und schritt 18.1 soll diese lücke schließen

## schritt 18.2

import { FunctionComponent } from 'react';
import styles from './LernblockTitel.module.css';


const LernblockTitel = () => {
  	return (
    		<div className={styles.lernblockTitel}>
      			<div className={styles.rechtsgeschftslehre}>Rechtsgeschäftslehre</div>
      			<div className={styles.frameParent}>
        				<div className={styles.itemParent}>
          					<div className={styles.item}>
            						<div className={styles.checkbox}>
              							<div className={styles.checkbox2} />
              							<div className={styles.fieldContent}>
                								<div className={styles.label}>Aufgabe</div>
              							</div>
            						</div>
            						<div className={styles.buttonParent}>
              							<div className={styles.button}>
                								<div className={styles.button2}>!</div>
              							</div>
              							<div className={styles.button}>
                								<div className={styles.button2}>!</div>
              							</div>
            						</div>
            						<div className={styles.itemcontent}>
              							<div className={styles.itemTitle}>Aufgabentitel</div>
              							<div className={styles.itemDescriptionGoes}>Aufgabenbeschreibung</div>
            						</div>
          					</div>
          					<div className={styles.button5}>
            						<img className={styles.iconTrash} alt="" />
          					</div>
        				</div>
        				<div className={styles.itemParent}>
          					<div className={styles.item}>
            						<div className={styles.checkbox}>
              							<div className={styles.checkbox2} />
              							<div className={styles.fieldContent}>
                								<div className={styles.label}>Aufgabe</div>
              							</div>
            						</div>
            						<div className={styles.buttonParent}>
              							<div className={styles.button}>
                								<div className={styles.button2}>!</div>
              							</div>
              							<div className={styles.button}>
                								<div className={styles.button2}>!</div>
              							</div>
            						</div>
            						<div className={styles.itemcontent}>
              							<div className={styles.itemTitle}>Aufgabentitel</div>
              							<div className={styles.itemDescriptionGoes}>Aufgabenbeschreibung</div>
            						</div>
          					</div>
          					<div className={styles.button5}>
            						<img className={styles.iconTrash} alt="" />
          					</div>
        				</div>
        				<div className={styles.itemParent}>
          					<div className={styles.item}>
            						<div className={styles.checkbox}>
              							<div className={styles.checkbox2} />
              							<div className={styles.fieldContent}>
                								<div className={styles.label}>Aufgabe</div>
              							</div>
            						</div>
            						<div className={styles.buttonParent}>
              							<div className={styles.button}>
                								<div className={styles.button2}>!</div>
              							</div>
              							<div className={styles.button}>
                								<div className={styles.button2}>!</div>
              							</div>
            						</div>
            						<div className={styles.itemcontent}>
              							<div className={styles.itemTitle}>Aufgabentitel</div>
              							<div className={styles.itemDescriptionGoes}>Aufgabenbeschreibung</div>
            						</div>
          					</div>
          					<div className={styles.button5}>
            						<img className={styles.iconTrash} alt="" />
          					</div>
        				</div>
        				<div className={styles.button16}>
          					<img className={styles.iconPlus} alt="" />
          					<div className={styles.neueAufgabe}>Neue Aufgabe</div>
        				</div>
      			</div>
    		</div>);
};

export default LernblockTitel as FunctionComponent;

## Notizen 

und dieser schritt soll in die lücke von 18.1

## schritt 19 

import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<img className={styles.lineIcon} alt="" />
            						<div className={styles.mainContentWrapper}>
              							<div className={styles.mainContentWrapper2}>
                								<div className={styles.navigationmenuPopover}>
                  									<div className={styles.navigationmenuMenuLink}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>BGB Allgemeiner Teil</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>Schuldrecht AT</div>
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.bgbAllgemeinerTeil}>BGB BT</div>
                    										</div>
                  									</div>
                								</div>
                								<div className={styles.navigationmenuMenuLink4}>
                  									<div className={styles.menuItemHolder}>
                    										<img className={styles.iconPencil} alt="" />
                    										<div className={styles.bgbAllgemeinerTeil}>URGs anpassen</div>
                  									</div>
                								</div>
                								<div className={styles.themaUndAufgabenWrapper}>
                  									<div className={styles.themaUndAufgaben}>
                    										<div className={styles.kapitelberschrift}>
                      											<div className={styles.lernplanKapitelMasterHeader}>
                        												<div className={styles.lernblockTitel}>
                          													<div className={styles.einteilungInLernplanblcke}>Einteilung in Lernplanblöcke</div>
                        												</div>
                      											</div>
                    										</div>
                    										<div className={styles.aufgabenContainerWrapper}>
                      											<div className={styles.aufgabenContainer}>
                        												<div className={styles.lernblock}>
                          													<div className={styles.lernblockTitel2}>
                            														<div className={styles.lernblockTitel3}>
                              															<div className={styles.itemcontent}>
                                																<div className={styles.blockgre}>Blockgröße</div>
                              															</div>
                              															<div className={styles.buttongroupSelection}>
                                																<img className={styles.buttonIcon} alt="" />
                                																<div className={styles.button}>
                                  																	<div className={styles.bgbAllgemeinerTeil}>3/3</div>
                                																</div>
                                																<div className={styles.button3}>
                                  																	<img className={styles.iconPlus} alt="" />
                                																</div>
                              															</div>
                              															<img className={styles.buttonwrapperIcon} alt="" />
                            														</div>
                          													</div>
                        												</div>
                        												<div className={styles.button4}>
                          													<div className={styles.button5}>Neuen Lernplanblock erstellen</div>
                          													<img className={styles.iconPencil} alt="" />
                        												</div>
                      											</div>
                    										</div>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button6}>
              							<div className={styles.button5}>Zurück</div>
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter2}>
            						<div className={styles.button6}>
              							<div className={styles.button5}>{`Speichern & Schließen`}</div>
            						</div>
            						<div className={styles.button10}>
              							<div className={styles.button5}>Weiter</div>
              							<img className={styles.iconPencil} alt="" />
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
    		</div>);
};

export default LernplanProzessBase as FunctionComponent;


## Notizen

wenn man nun für alle unterrechtsgebiete und themen eine blöck erstellt hat, dann geht man zum nächsten rechtsgebiet und so weiter bis man fertig ist. die letze frage die noch bleibt wie die blöcke dann den tagen zu geordnet wird. 

## Fortschritt

| Schritt | Status | Datum |
|---------|--------|-------|
| 6 | Ausstehend | - |
| 7 | Ausstehend | - |
| 8 | Ausstehend | - |
| 9 | Ausstehend | - |
| 10 | Ausstehend | - |

