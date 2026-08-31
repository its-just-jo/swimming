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
| `pruefen` | `npm ci`, Typecheck, Tests, Build | Typecheck und Build: **ja**. Tests: **noch nicht** |
| `veroeffentlichen` | Upload und Deployment nach Pages | — |

Die Tests laufen bewusst noch nicht blockierend, weil der Rechenkern erst implementiert wird
und 69 der 78 Tests absichtlich rot sind (siehe [`UMSETZUNG.md`](./UMSETZUNG.md), AP 1–11).
Ihr Ergebnis erscheint in der Zusammenfassung jedes Laufs.

> **Nach Abnahme von AP 11:** `continue-on-error: true` im Schritt *Tests* entfernen. Ab
> diesem Zeitpunkt muss ein roter Test das Deployment verhindern.

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
