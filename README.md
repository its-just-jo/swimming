# Szenario-Rechner — Ausstiegspfad Schwimmkurse

Einzelnutzer-Werkzeug zur Durchrechnung einer schrittweisen Reduktion einer Vollzeitstelle,
finanziert über Schwimmkurse, Aquafitness und Lehraufträge.

Das Werkzeug **berät nicht, es rechnet und warnt**. Jede Zahl ist auf sichtbare Annahmen
zurückführbar.

> **Kein Ersatz für Steuer- oder Rechtsberatung.** Die Anwendung rechnet mit vereinfachten
> Steuerformeln und Schätzwerten. Alle hinterlegten Rechtsgrößen (Rechtsstand 2025) sind vor
> Verwendung zu prüfen — sie tragen in `src/model/konstanten.ts` jeweils Quelle und den
> Marker `// vor Nutzung verifizieren`.

## Setup

```bash
npm install
npm run dev        # Entwicklungsserver
npm test           # Rechenkern-Tests
npm run typecheck  # TypeScript ohne Emit
npm run build      # statischer Build nach dist/
```

Voraussetzung: Node 20 oder neuer.

## Stand

Datenmodell, Rechtsgrößen, Defaults, Presets und Formatierung sind fertig. Der Rechenkern
liegt als dokumentierte Signaturen mit einem Testgerüst vor: **78 Tests, davon 69 bewusst
rot** — sie sind die ausführbare Spezifikation der noch zu schreibenden Implementierung.

Architektur und fachliche Festlegungen: [`ARCHITEKTUR.md`](./ARCHITEKTUR.md)
Arbeitspakete: [`UMSETZUNG.md`](./UMSETZUNG.md)

## Deploy

Der Build ist vollständig statisch und ohne Netzwerkzugriff zur Laufzeit — keine externen
Fonts, keine Tracker, keine API-Calls. Persistenz ausschließlich in `localStorage`.

**GitHub Pages:** `npm run build`, dann `dist/` veröffentlichen. `base: './'` in
`vite.config.ts` erzeugt relative Pfade, ein Unterverzeichnis wie
`https://<user>.github.io/<repo>/` funktioniert damit ohne weitere Konfiguration.

**Beliebiger Webspace:** Inhalt von `dist/` hochladen. Kein Server, keine Datenbank.

## Struktur

```
src/model/       Rechenkern — reine Funktionen, ohne React
src/persistenz/  localStorage, Migration, JSON-Export
src/state/       Zustand mit Undo/Redo
src/ui/          Oberfläche
```

Rechenlogik gehört ausschließlich in `src/model/`, niemals in Komponenten.
