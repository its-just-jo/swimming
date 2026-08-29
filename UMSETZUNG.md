# Arbeitspakete

Reihenfolge nach Abschnitt 10 der Spezifikation: **erst Datenmodell und Rechenkern samt
Tests, dann UI.** Die Pakete sind so geschnitten, dass jedes für sich abnehmbar ist.

**Grundregeln für die gesamte Umsetzung**

1. Keine Rechenlogik in React-Komponenten. Alles Rechnende liegt in `/src/model/`.
2. Keine Rechtsgröße als Literal außerhalb von `konstanten.ts`. Rechenfunktionen bekommen
   `Rechtsgroessen` als Parameter übergeben.
3. Die vorhandenen Tests sind die Spezifikation. **Erwartungswerte nicht anpassen, um Tests
   grün zu bekommen.** Weicht die Implementierung ab, ist zuerst von Hand nachzurechnen; der
   Rechenweg steht jeweils im Testkommentar. Ergibt sich, dass der Test falsch ist, gehört
   die Korrektur mit neuer Herleitung in den Kommentar.
4. Neue Tests ergänzen, nicht ersetzen. Jede in `ARCHITEKTUR.md` Abschnitt 1 getroffene
   Festlegung braucht mindestens einen Test.
5. Kein `any`, kein `@ts-ignore`. `strict` und `noUncheckedIndexedAccess` bleiben an.
6. Nach jedem Paket: `npm run typecheck && npm test`.

---

## Phase 1 — Rechenkern

### AP 1 · Einkommensteuer
`src/model/steuer/einkommensteuer.ts` · Test: `einkommensteuer.test.ts` (17 Fälle)

Grundtarif nach § 32a EStG aus den Tarifzonen in `konstanten.ts`, nicht hart kodiert.
Abrundung des zvE **und** des Ergebnisses auf volle Euro (§ 32a Abs. 1 Satz 6 EStG).
Solidaritätszuschlag als `min(5,5 % × ESt, 11,9 % × (ESt − Freigrenze))`, nie negativ.
Grenzbelastung numerisch über 1 € Differenz — nicht analytisch, damit Freigrenzen und
Zonensprünge korrekt erfasst werden.

`zuVersteuerndesEinkommen` ist die gemeinsame Veranlagung aus Abschnitt 4.4:
Lohn abzüglich Arbeitnehmer-Pauschbetrag und Vorsorgeaufwendungen, zuzüglich Gewinn
abzüglich Übungsleiterfreibetrag, zuzüglich Lehreinkünfte, abzüglich DRV-Pflichtbeiträge
und Sonderausgaben-Pauschbetrag.

**Abnahme:** alle Fälle grün, insbesondere Stetigkeit und Monotonie des Tarifs.

### AP 2 · Sozialversicherung
`src/model/steuer/sozialversicherung.ts` · Test: `sozialversicherung.test.ts` (12 Fälle)

Arbeitnehmeranteile je Zweig mit **eigener** Beitragsbemessungsgrenze (KV/PV 66.150,
RV/ALV 96.600). Kinderlosenzuschlag zur Pflegeversicherung trägt der Beschäftigte allein.

Die drei KV-Wege nach `ARCHITEKTUR.md` 1.1 — das ist das fachlich heikelste Paket:
- `gkv_pflicht`: `kvAufSelbstaendigkeit` liefert **0**, solange nicht hauptberuflich.
- `gkv_freiwillig`: Beitrag auf den vom Lohn nicht ausgeschöpften Teil der BBG, voller Satz.
- `pkv`: Arbeitgeberzuschuss = `min(halber PKV-Beitrag, halber GKV-Höchstbeitrag)`.

`istHauptberuflichSelbstaendig` prüft **beide** Indizien getrennt und meldet sie einzeln —
die UI zeigt, welches Indiz greift.

### AP 3 · Umsatzsteuer und § 19 UStG
`src/model/steuer/umsatzsteuer.ts` · Test: `umsatzsteuer.test.ts` (8 Fälle)

`nettoAusBrutto` mindert den Erlös, es wird **nichts aufgeschlagen**.
`kleinunternehmerVerlauf` ist eine Zustandsmaschine über die Jahre: Vorjahresgrenze wirkt
zum Folgejahr, die 100.000-€-Grenze sofort im laufenden Jahr. Kein automatischer
Rückwechsel in die Regelung.

### AP 4 · Gewerbesteuer
`src/model/steuer/gewerbesteuer.ts` · Test: `gewerbesteuer.test.ts` (5 Fälle)

Gewerbeertrag auf volle 100 € abrunden, Freibetrag 24.500 €, Messzahl 3,5 %,
Gewerbesteuer = Messbetrag × Hebesatz/100. Anrechnung nach § 35 EStG: **doppelt begrenzt**
auf das 4,0-fache des Messbetrags *und* auf die tatsächlich gezahlte Gewerbesteuer *und* auf
die anrechenbare Einkommensteuer.

### AP 5 · Rentenversicherungspflicht
`src/model/steuer/rentenversicherung.ts` · Tests neu zu schreiben

18,6 % auf den Gewinn, gedeckelt auf die BBG RV/ALV abzüglich bereits verbeitragtem
Arbeitsentgelt. Befreiung als Existenzgründer (§ 6 Abs. 1a SGB VI, befristet) und bei
Unterschreiten der Geringfügigkeitsgrenze (556 €/Monat = 6.672 €/Jahr Gewinn).
Bei negativem Gewinn: kein Beitrag, keine negative Größe.

### AP 6 · Anstellung
`src/model/anstellung.ts` · Test: `anstellung.test.ts` (8 Fälle)

Bonusformel exakt wie in `ARCHITEKTUR.md` 1.7 Nr. 1. Gehaltssteigerung als
`1,025^jahrIndex` auf Grundgehalt **und** Bonus.

### AP 7 · Produkte und Deckungsbeitrag
`src/model/produkte.ts` · Test: `produkte.test.ts` (13 Fälle)

Formeln aus Spezifikation 4.2. Zu beachten: Pauschale ignoriert die Auslastung; parallele
Kurse erhöhen Erlös und Zeit gleichermaßen; ZPP-Aufschlag nur bei `zppFaehig`; ohne
Hallenbadzugang liefern Ganzjahres- und Hallenprodukte **null**; Preis- und Mietindex
wirken getrennt.

### AP 8 · Kapazität und Zeitbudget
`src/model/kapazitaet.ts`, `src/model/zeitbudget.ts` · Tests: `kapazitaet.test.ts` (4),
`zeitbudget.test.ts` (4)

Verfügbare Stunden je Saison, Hallenbad erst ab `hallenbadAbMonat`. Fremdlehrkraft-Stunden
erhöhen die Kapazität und belasten das eigene Budget nicht — getrennt führen.
**Bei Überschreitung nicht deckeln**, sondern `ueberschreitung: true` setzen.

### AP 9 · Gewinn und Gesamtnetto
`src/model/gewinn.ts` · Tests neu zu schreiben

Reihenfolge steht im Dateikopf. Die Steuerlast der Selbstständigkeit ist die **Differenz**
zwischen der Veranlagung mit und ohne Gewinn — nicht ein Durchschnittssatz auf den Gewinn.

**Kritisch (`ARCHITEKTUR.md` 1.4): Der Gewinn darf nicht auf ≥ 0 begrenzt werden.** Ein
Verlust mindert das zu versteuernde Einkommen und erzeugt eine Erstattung. Dafür ist ein
eigener Test zu schreiben: Verlustjahr → `zusaetzlicheEinkommensteuer` ist negativ.

### AP 10 · Rente, Lehre, Simulation
`src/model/rente.ts`, `lehre.ts`, `simulation.ts` · Tests neu zu schreiben

Zweistufige Zeitachse nach `ARCHITEKTUR.md` 2.2. `baselineSzenario` setzt
`beschaeftigungsgrad: 1,0` und deaktiviert **jede** selbstständige Tätigkeit.
Leistungsziel: unter 20 ms je vollständigem Durchlauf — mit einem Test absichern.

### AP 11 · Sensitivität, Break-even, Warnungen
`sensitivitaet.ts`, `breakeven.ts`, `warnungen.ts` · Tests neu zu schreiben

Tornado rechnet das **vollständige** Modell je Auslenkung neu; keine analytische Näherung,
sonst gehen genau die Schwelleneffekte verloren, um die es geht. Break-even iteriert über
den Netto-Deckungsbeitrag (Fixpunkt, max. 20 Schritte, Abbruch bei < 1 €). Warnungen
werden nachgelagert aus dem Ergebnisobjekt abgeleitet, nicht in den Rechenfunktionen erzeugt.

---

## Phase 2 — Persistenz

### AP 12 · Speicher, Migration, Export
`src/persistenz/*` · Tests neu zu schreiben

Schema wie in Spezifikation 6. Jeder Zugriff in `try/catch`; bei nicht verfügbarem Speicher
Nur-Speicher-Modus, **sichtbar gemeldet**, Export bleibt möglich. Schreibvorgänge gedrosselt
(400 ms) **plus Flush bei `visibilitychange` und `pagehide`** — ohne diesen Flush geht die
letzte Änderung beim Schließen des Tabs verloren. Import legt stets ein **neues** Szenario an.
Test mit einem localStorage-Stub, der wirft.

---

## Phase 3 — Oberfläche

### AP 13 · Rahmen, Eingabespalte, Zustand
Zweispaltig ab 900 px, darunter gestapelt. Eingaben in aufklappbaren Abschnitten,
„Rechtliche Parameter" eingeklappt. Jedes Feld mit Label, Einheit, Min/Max, Kurzhilfe und
Auszeichnung als Schätzwert oder Rechtsgröße (`FeldMeta` in `typen.ts`). Reducer mit
Undo/Redo. Zahlenfelder mit `inputMode="decimal"` und Komma als Dezimaltrennzeichen.

### AP 14 · Kennzahlenleiste und Herleitung
Sechs Kennzahlen nach Spezifikation 5, auf dem Handy fixiert. Jede per Klick aufklappbar
mit vollständigem Rechenweg und Annahmen — `herleitung.ts` liest dafür nur das
Ergebnisobjekt.

### AP 15 · Diagramme
Sechs Ansichten nach Spezifikation 5, Recharts gebündelt (kein CDN). Der **Tornado ist die
wichtigste Ansicht** und gehört an prominente Stelle. Bei der Cashflow-Grafik ist die
gleichmäßige Verteilung der Jahresabgaben an der Grafik auszuweisen.

### AP 16 · Warnungen, Szenarienverwaltung, Presets
Warnungen auffällig, nicht dezent: kritisch in gedecktem Rot, Grenzwerte in Bernstein, mit
Sprung zum auslösenden Eingabefeld. Anlegen, benennen, duplizieren, löschen, umbenennen;
bis zu drei Szenarien nebeneinander mit farblich markierten Abweichungen; Zurücksetzen je
Bereich und global.

---

## Phase 4 — Lieferung

### AP 17 · README, Beispiel-JSON, Deploy
`README.md` mit Setup und Deploy-Anleitung (vorhanden, bei Bedarf ergänzen),
`beispiel-szenario.json` gegen die fertige Export-Funktion erneuern, GitHub-Pages-Workflow.
Rechtshinweis im Fußbereich bleibt dauerhaft sichtbar und darf nicht ausblendbar sein.

---

## Was ausdrücklich **nicht** gebaut wird

Login, Mehrbenutzerfähigkeit, Backend, Datenbank, PDF-Export, Buchhaltungsfunktionen,
Teilnehmerverwaltung, Steuerberatung.
