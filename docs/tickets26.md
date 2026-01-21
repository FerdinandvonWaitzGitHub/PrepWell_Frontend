# Ticket 26: Vollständige Dokumentation aller API-Calls

**Datum:** 21.01.2026
**Status:** Offen
**Priorität:** Mittel
**Abhängigkeiten:** -
**Output:** `docs/api-documentation.md`

---

## Ziel

Erstellung einer vollständigen, strukturierten Übersicht aller API-Calls (Supabase + localStorage-Sync), inklusive Requests, Responses und fachlicher Bedeutung.

## Scope

Alle aktuell verwendeten API-Calls im Projekt, gruppiert nach Feature:
- Auth (Authentifizierung)
- Calendar (Blocks, Sessions)
- Timer (Sessions, History)
- Content Plans / Themenlisten
- Settings
- Logbuch
- Check-In

Pro API-Call auszufüllen
1. Allgemeine Informationen
•	Name des API-Calls
•	Zweck / Beschreibung
o	Was macht der Call fachlich?
o	In welchem Kontext wird er aufgerufen?

2. Endpoint
•	URL
•	HTTP-Methode
o	GET / POST / PUT / PATCH / DELETE
•	Auth erforderlich
o	Ja / Nein
o	Wenn ja: Art der Authentifizierung

3. Request
•	Headers
o	Content-Type
o	Authorization
o	Weitere relevante Header
•	Request Body
o	Struktur (JSON)
o	Pflichtfelder
o	Optionale Felder
•	Beispiel-Request
{
  "exampleKey": "exampleValue"
}

4. Response
•	Response-Typ
o	JSON / Text / Status-only
•	Erfolgs-Response
o	HTTP-Status
o	Response Body
•	Beispiel-Response
{
  "result": "success",
  "data": {}
}

5. Fehlerfälle
•	Mögliche Error-Codes
o	400
o	401
o	403
o	404
o	500
•	Fehlerbedeutung
o	Wann tritt welcher Fehler auf?
•	Beispiel Error-Response
{
  "error": "Invalid input"
}
________________________________________
6. Abhängigkeiten
•	Welche anderen API-Calls oder Services sind abhängig?
•	Wird dieser Call:
o	Vor einem anderen Call benötigt?
o	Nach einem anderen Call ausgelöst?
________________________________________
7. Datenfluss
•	Welche Datenpakete werden gesendet?
•	Welche Datenpakete kommen zurück?
•	Wo werden die Response-Daten weiterverwendet?
o	Frontend State
o	Datenbank
o	Folge-Calls
________________________________________
8. Trigger
•	Wann wird der API-Call ausgelöst?
o	User-Aktion
o	Automatisch im Flow
o	Background-Process
________________________________________
9. Relevanz für Produkte / Modi
•	Welches Produkt nutzt diesen Call?
•	Welcher Modus?
o	Normal
o	Premium
o	Test
o	Sonstiges
________________________________________
10. Offene Punkte
•	Unklarheiten
•	To-dos
•	Rückfragen an Backend / Frontend
________________________________________
Akzeptanzkriterien
•	Alle API-Calls sind vollständig dokumentiert
•	Jeder Call enthält mindestens:
o	Endpoint
o	Request
o	Response
o	Zweck
•	Beispiele sind realistisch und aktuell
•	Keine Platzhalter mehr offen

