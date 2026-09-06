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

Vollständig umgesetzt: Rechenkern (Steuern, Sozialversicherung, Produkte, Kapazität,
Gewinn, Simulation, Sensitivität, Break-even, Warnungen), Persistenzschicht
(localStorage mit Nur-Speicher-Rückfall, Migration, Export/Import) und Oberfläche
(Eingabeformulare, sechs Kennzahlen mit Herleitung, sechs Diagramme, Warnungen,
Szenarienverwaltung mit Presets und Vergleich). Alle Tests grün, `tsc --noEmit`
und `vite build` fehlerfrei.

Architektur und fachliche Festlegungen: [`ARCHITEKTUR.md`](./ARCHITEKTUR.md)
Arbeitspakete: [`UMSETZUNG.md`](./UMSETZUNG.md)

## Deploy

Der Build ist vollständig statisch und ohne Netzwerkzugriff zur Laufzeit — keine externen
Fonts, keine Tracker, keine API-Calls. Persistenz ausschließlich in `localStorage`.

### GitHub Pages (automatisch)

`.github/workflows/pages.yml` baut und veröffentlicht bei jedem Push auf den Default-Branch.
Pull Requests werden nur geprüft, nicht veröffentlicht; ein manueller Lauf ist über
*Actions → GitHub Pages → Run workflow* möglich.

**Einmalige Einrichtung, nicht automatisierbar:**
Repository → *Settings* → *Pages* → *Build and deployment* → *Source*: **GitHub Actions**.
Ohne diese Einstellung schlägt der Schritt `deploy-pages` fehl.

Der Workflow gliedert sich in zwei Jobs:

| Job | Inhalt | Blockiert das Deployment? |
|---|---|---|
| `pruefen` | `npm ci`, Typecheck, Tests, Build | **ja**, alle drei |
| `veroeffentlichen` | Upload und Deployment nach Pages | — |

AP 11 ist abgenommen: der Rechenkern ist vollständig implementiert, ein roter Test
verhindert das Deployment.

Der Trigger enthält neben `main` derzeit noch den Branch
`claude/spec-analysis-architecture-lljhu6`, weil das Repository bislang keinen
`main`-Branch hat. Diese Zeile entfernen, sobald nach `main` zusammengeführt wurde.

### Beliebiger Webspace

`npm run build`, dann den Inhalt von `dist/` hochladen. Kein Server, keine Datenbank.
`base: './'` in `vite.config.ts` erzeugt relative Pfade, ein Unterverzeichnis wie
`https://<user>.github.io/<repo>/` funktioniert damit ohne weitere Konfiguration.

## Struktur

```
src/model/       Rechenkern — reine Funktionen, ohne React
src/persistenz/  localStorage, Migration, JSON-Export
src/state/       Zustand mit Undo/Redo
src/ui/          Oberfläche
```

Rechenlogik gehört ausschließlich in `src/model/`, niemals in Komponenten.
