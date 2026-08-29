# Arbeitsregeln für dieses Repository

Szenario-Rechner „Ausstiegspfad Schwimmkurse". Statische Website, kein Backend,
Persistenz ausschließlich in `localStorage`. Oberfläche und Bezeichner deutsch.

**Vor der Arbeit lesen:** [`ARCHITEKTUR.md`](./ARCHITEKTUR.md) (fachliche Festlegungen und
Befunde) und [`UMSETZUNG.md`](./UMSETZUNG.md) (Arbeitspakete in Reihenfolge).

## Harte Regeln

1. **Keine Rechenlogik in React-Komponenten.** Alles Rechnende liegt in `/src/model/` als
   reine, testbare Funktion.
2. **Keine Rechtsgröße als Literal außerhalb von `src/model/konstanten.ts`.** Rechenfunktionen
   bekommen `Rechtsgroessen` als Parameter — kein globaler Zugriff. Nur so kann die
   Sensitivitätsanalyse Rechtsgrößen variieren.
3. **Die vorhandenen Tests sind die Spezifikation.** Erwartungswerte nicht anpassen, um Tests
   grün zu bekommen. Jeder Erwartungswert ist von Hand gerechnet, der Rechenweg steht im
   Testkommentar. Weicht die Implementierung ab: erst nachrechnen. Ist wirklich der Test
   falsch, gehört die Korrektur mit neuer Herleitung in den Kommentar.
4. **Kein `any`, kein `@ts-ignore`.** `strict`, `noUncheckedIndexedAccess` und
   `exactOptionalPropertyTypes` bleiben an.
5. **Zur Laufzeit kein Netzwerk.** Keine externen Fonts, keine CDN-Skripte, keine Tracker,
   keine API-Calls. Bibliotheken werden gebündelt.
6. **Nicht stillschweigend deckeln oder glätten.** Kapazitätsüberschreitung, gerissene
   USt-Schwelle und Statuswechsel werden gemeldet, nicht wegkorrigiert. Das Werkzeug soll
   falsifizieren, nicht bestätigen.
7. **Gewinn nicht auf ≥ 0 begrenzen.** Verluste der Anlaufjahre mindern über die gemeinsame
   Veranlagung das zu versteuernde Einkommen — dieser Effekt ist gewollt und erheblich.

## Nach jeder Änderung

```bash
npm run typecheck && npm test
```

## Nicht bauen

Login, Mehrbenutzerfähigkeit, Backend, Datenbank, PDF-Export, Buchhaltung,
Teilnehmerverwaltung, Steuerberatung.
