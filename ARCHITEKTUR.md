# Lösungsarchitektur — Szenario-Rechner „Ausstiegspfad Schwimmkurse"

Stand: 29.08.2026 · Rechtsstand der Konstanten: **2025** · Vorbereitet zur Umsetzung durch ein nachfolgendes Modell

---

## 1. Befunde aus der Spezifikationsanalyse

Die Spezifikation ist ungewöhnlich präzise und trifft die richtigen Themen. Elf Punkte
brauchen dennoch eine Entscheidung, bevor Code entsteht — sechs davon sind fachlich
folgenreich. Sie stehen hier vollständig, weil das Werkzeug erklärtermaßen
falsifizierbar sein soll und eine stillschweigend getroffene Annahme genau das verhindert.

### 1.1 Kritisch: Die KV-Kante ist im Kern eine andere als beschrieben

Die Spezifikation schreibt (3.6): *„Solange das Hauptjob-Brutto über der
Beitragsbemessungsgrenze liegt, bleiben die Nebeneinkünfte beitragsfrei. Fällt es
darunter, werden sie beitragspflichtig."*

Das gilt so **nur für freiwillig gesetzlich Versicherte**. Für Pflichtversicherte — der
von dir angegebene Status — ist es falsch: Ihre selbstständigen Nebeneinkünfte sind
**unabhängig von der Beitragsbemessungsgrenze beitragsfrei**. Die Beitragsbemessungsgrenze
ist für sie schlicht keine Kante.

Die tatsächlich entscheidende Kante ist eine andere: **§ 5 Abs. 5 SGB V,
Hauptberuflichkeit**. Übersteigt die Selbstständigkeit die Anstellung nach *Zeit* oder
nach *Einkommen*, entfällt die Versicherungspflicht in der Beschäftigung — und dann wird
auf einen Schlag das gesamte Einkommen beitragspflichtig. Genau dieser Umschlag droht bei
den Stufen 60 % und 50 %, also dort, wo die Spezifikation zu Recht die Entscheidung
verortet — nur über einen anderen Mechanismus.

Zwei weitere Punkte gehören dazu:

- Bei **85.000 € Bruttogrundgehalt** liegt das Entgelt über der Jahresarbeitsentgeltgrenze
  (2025: 73.800 €). Eine echte Pflichtversicherung ist dann rechtlich nicht möglich; die
  Mitgliedschaft ist regelmäßig freiwillig. Das Modell schaltet den Status **nicht
  stillschweigend um**, sondern rechnet wie angegeben und setzt die Warnung
  `jaeg_ueberschritten`. **Das ist vor der ersten ernsthaften Nutzung zu klären** — es ist
  die Variable mit dem größten Hebel im ganzen Modell.
- Bei Reduktion auf 60 % (51.000 €) fällt das Entgelt unter die JAEG, und die
  Pflichtversicherung entsteht (oder lebt wieder auf). Der Status ist also nicht konstant,
  sondern selbst eine Funktion der Reduktionsstufe.

**Umsetzung:** Alle drei Wege (`gkv_pflicht`, `gkv_freiwillig`, `pkv`) sind im Rechenkern
implementiert und getestet, Default `gkv_pflicht`. Der Umschalter kostet wenig und macht
genau die Unsicherheit sichtbar, die hier zählt.

### 1.2 Kritisch: Gewerbesteuer ohne § 35 EStG überzeichnet die Rechtsform „Gewerbe"

Die Spezifikation nennt Hebesatz und Freibetrag, nicht aber die **Steuerermäßigung nach
§ 35 EStG**: das 4,0-fache des Gewerbesteuer-Messbetrags wird auf die Einkommensteuer
angerechnet. Bis rund 400 % Hebesatz ist die Gewerbesteuer damit nahezu vollständig
neutralisiert. Ohne die Anrechnung würde das Werkzeug die Rechtsformfrage dramatisieren,
die faktisch fast folgenlos ist. Modelliert und getestet (`gewerbesteuer.test.ts`).

Umgekehrt gibt es eine Wechselwirkung, die die Spezifikation nicht sieht: Unterrichtende
Tätigkeit ist nach § 18 EStG freiberuflich — **aber** der Einsatz von Fremdlehrkräften kann
nach der Vervielfältigungstheorie in die Gewerblichkeit führen, wenn nicht mehr
eigenverantwortlich unterrichtet wird. Das Preset „Mit Fremdlehrkraft" kann also die
Rechtsform kippen. Das Werkzeug weist darauf hin, entscheidet aber nicht.

### 1.3 Kritisch: Vorsteuer auf die Beckenmiete entscheidet über die Härte der USt-Pflicht

Die Spezifikation rechnet die Umsatzsteuer korrekt als Erlösminderung (Netto = Brutto/1,19).
Sie erwähnt die Gegenseite nicht: den **Vorsteuerabzug**. Der ist hier untypisch schwach,
weil der größte Kostenblock — die Beckenmiete kommunaler Bäder — häufig **ohne
Umsatzsteuer** abgerechnet wird. Es gibt dann keine Vorsteuer zurückzuholen.

Ergebnis: Der Wechsel in die Umsatzsteuerpflicht kostet nahezu die vollen 16 % des
Bruttoerlöses, nicht die häufig unterstellten „paar Prozent netto". Der Default ist deshalb
bewusst pessimistisch (`vorsteuerabzug: false`), je Kostenposition umschaltbar.

### 1.4 Kritisch: Verluste der Anfangsjahre sind ein Vorteil, kein Nullwert

Die Einmalinvestitionen fallen früh, die Erlöse spät. In den ersten Jahren entsteht
regelmäßig ein **Verlust**. Weil gemeinsam mit dem Gehalt veranlagt wird, mindert dieser
Verlust das zu versteuernde Einkommen und führt bei einer Grenzbelastung von rund 47 % zu
einer erheblichen Steuererstattung.

Ein Rechenkern, der den Gewinn bei null abschneidet, verliert genau diesen Effekt und macht
die Anlaufphase künstlich teurer. **Der Gewinn darf nicht auf ≥ 0 begrenzt werden.** Als
Arbeitspaket-Abnahmekriterium festgehalten (AP 9).

### 1.5 Kritisch: Übungsleiterpauschale ist kein Freibetrag auf das eigene Geschäft

§ 3 Nr. 26 EStG setzt eine Tätigkeit *im Dienst* einer gemeinnützigen Körperschaft voraus.
Auf Kurse, die auf eigene Rechnung mit angemieteter Beckenzeit durchgeführt werden, ist sie
**nicht anwendbar** — nicht einmal anteilig. Die Spezifikation ahnt das („schließt sich
gegenseitig aus"), formuliert es aber als weichen Hinweis. Das Modell behandelt den Schalter
als hartes Entweder-oder mit Warnung `uebungsleiter_unvereinbar`, sobald er zusammen mit
eigenen Kursprodukten aktiv ist.

### 1.6 Wichtig: Rentenpunkte aus Selbstständigkeit kosten das Doppelte

Abschnitt 4.6 verlangt, die entgangenen Entgeltpunkte mit den Pflichtbeiträgen aus der
Selbstständigkeit gegenzurechnen. Dabei geht ein Effekt unter, der die Rechnung dreht: Als
Angestellter trägst du 9,3 %, den Rest der Arbeitgeber. Als selbstständiger Lehrer nach
§ 2 SGB VI trägst du **18,6 % allein**. Jeder Entgeltpunkt aus der Selbstständigkeit kostet
dich also doppelt so viel wie einer aus der Anstellung. Die Kennzahl weist das aus.

### 1.7 Sechs Stellen, an denen die Spezifikation schweigt

| # | Offene Stelle | Getroffene Festlegung | Begründung |
|---|---|---|---|
| 1 | Formel der Bonus-Skalierung | `faktor = max(0, 1 − (1 − grad) / skalierung)` | Die naheliegende Variante `bonus × grad × skalierung` würde den Bonus schon bei Vollzeit kürzen. Die gewählte Formel liefert bei Vollzeit den vollen Bonus, bei Skalierung 1,0 exakt proportionales Verhalten und darunter den geforderten überproportionalen Abfall. Lesart: ein Prozentpunkt Reduktion kostet 1/Skalierung Prozentpunkte Bonus. |
| 2 | Wirkt die Auslastung auf eine Pauschale? | **Nein.** | Eine Firmenpauschale wird unabhängig von der Teilnehmerzahl gezahlt. Andernfalls würde das BGM-Produkt systematisch unterschätzt. |
| 3 | Bedeutung von „Kurse parallel" | Erhöht Erlös **und** Wasserzeit gleichermaßen | Eine Lehrkraft kann keine zwei Gruppen gleichzeitig betreuen. Wer echte Parallelität will, setzt das Produkt auf `fremdlehrkraft`. |
| 4 | Wirkung der Ausfallquote | Standardmäßig auf **Kapazität und Erlös**, umschaltbar | Entspricht dem pessimistischen Grundton der Spezifikation. Der Schalter verhindert die Doppelzählung, wenn Ausfälle tatsächlich nachgeholt werden. |
| 5 | Zuordnung Wochen → Monate | Freibad = Mai–September, Halle = übrige Monate; die konfigurierten aktiven Wochen bleiben maßgeblich und werden anteilig verteilt | Nötig für die Monats-Cashflow-Ansicht. Die Nutzereingabe wird nicht überschrieben, nur verteilt. |
| 6 | Verhältnis Kleinunternehmer ↔ USt-Pflicht | Kleinunternehmerregelung geht vor, solange sie greift | Beide Schalter stehen per Default auf „an". Effektive USt = `umsatzsteuerpflichtig && !kleinunternehmer`. |

Zwei Punkte bleiben bewusst **offen und werden in der Oberfläche als solche markiert**:

- **„Davon Samstag: 4 h"** hat in der Spezifikation keine Rechenwirkung. Vorschlag: eine
  eigene Kennzahl „Wochenendbelastung", keine Verrechnung. Umgesetzt als Datenfeld ohne
  Rechenwirkung, bis du entscheidest.
- **Startdatum außerhalb des Januars** erzeugt ein Rumpfjahr auf der Kursseite, während das
  Gehalt ganzjährig weiterläuft. Steuerjahr bleibt das Kalenderjahr. Default `2026-01-01`
  umgeht die Frage.

---

## 2. Technische Entscheidungen

### 2.1 Stack: Vite + React + TypeScript

Die Spezifikation verlangt eine begründete Entscheidung. Der Einzeldatei-Build scheidet aus,
weil er drei ausdrückliche Anforderungen bricht: Unit-Tests für den Rechenkern, strikte
Trennung von `/src/model/` und UI, sowie ein Migrationspfad für gespeicherte Szenarien.

Das Ergebnis bleibt trotzdem vollständig statisch: `base: './'` erzeugt relative
Asset-Pfade, der Build läuft unter `https://<user>.github.io/<repo>/` genauso wie von
beliebigem Webspace. Zur Laufzeit gibt es keinen Netzwerkzugriff — keine externen Fonts
(Systemschriften mit `font-variant-numeric: tabular-nums`), keine Tracker, keine API-Calls.
Recharts wird gebündelt ausgeliefert, nicht von einem CDN geladen.

Verifiziert: `tsc --noEmit` fehlerfrei, `vite build` erzeugt 144 kB JS (46 kB gzip).

### 2.2 Zweistufige Zeitachse

Die zentrale Architekturentscheidung. Steuern sind progressiv und **jahresbezogen**,
Cashflow ist **monatlich**. Beides in einem Durchlauf zu rechnen führt zwangsläufig zu
falscher Progression.

```
Stufe A  Monatliche Rohströme         Erlöse, Miete, Honorare, Fixkosten,
         aus Produkten und            Investitionen — keine Steuern
         Saisonkalender
              │
Stufe B  Aggregation je Kalenderjahr  Erst hier: Einkommensteuer, Gewerbe-
                                      steuer, DRV — gemeinsam mit dem Gehalt
              │
Stufe C  Rücktragung auf Monate       Abgaben gleichmäßig verteilt (Abgrenzung,
         für die Cashflow-Ansicht     nicht Vorauszahlungstermin) — an der
                                      Grafik ausgewiesen
```

### 2.3 Herleitung ohne Instrumentierung

Jede Kennzahl soll per Klick ihren vollständigen Rechenweg zeigen. Der naheliegende Weg —
die Rechenfunktionen protokollieren ihre Schritte mit — ist hier falsch: Die
Sensitivitätsanalyse ruft das Gesamtmodell rund 25-mal je Interaktion auf, und
String-Erzeugung im heißen Pfad wäre teuer.

Stattdessen tragen die **Ergebnisobjekte alle Zwischenwerte** (siehe `typen.ts`), und
`herleitung.ts` ist eine reine Sicht darauf. Nebeneffekt: Die Herleitung kann gar nicht vom
tatsächlichen Rechenweg abweichen, weil sie dieselben Werte liest.

### 2.4 Zustand ohne Bibliothek

`useReducer` plus ein begrenzter Undo-Stapel (50 Zustände, Zusammenfassung
aufeinanderfolgender Änderungen am selben Feld innerhalb von 800 ms). Redux oder Zustand
wären zusätzliche Abhängigkeit ohne Gegenwert: ein Nutzer, ein Zustandsbaum, keine
asynchronen Effekte.

### 2.5 Leistungsbudget

`berechneSzenario` muss unter **20 ms** bleiben, damit die Sensitivitätsanalyse
(25 Durchläufe) unter 500 ms fertig ist und die Oberfläche live mitläuft. Konkret heißt das:
keine Objekterzeugung je Monat in inneren Schleifen, keine Formatierung im Rechenkern, keine
`JSON.parse(JSON.stringify(...))`-Kopien. Reicht das nicht, ist ein Web Worker der nächste
Schritt — nicht eine Vereinfachung der Rechnung.

---

## 3. Modulschnitt

```
src/
  model/                      Rechenkern — rein, testbar, ohne React
    typen.ts                  Datenmodell, keine Logik            [fertig]
    konstanten.ts             Rechtsgrößen 2025 mit Quellen        [fertig]
    defaults.ts               Startwerte aus der Spezifikation     [fertig]
    presets.ts                Die sechs Presets als Transformationen [fertig]
    format.ts                 de-DE-Formatierung                   [fertig, getestet]
    steuer/
      einkommensteuer.ts      § 32a, Soli, KiSt, Grenzbelastung
      sozialversicherung.ts   AN-Beiträge, KV-Status, § 5 Abs. 5 SGB V
      umsatzsteuer.ts         § 19 als Zustandsmaschine, Netto aus Brutto
      gewerbesteuer.ts        Messbetrag, Hebesatz, § 35 Anrechnung
      rentenversicherung.ts   § 2 SGB VI, Befreiungstatbestände
    anstellung.ts             Brutto/Netto je Stufe, Bonusskalierung
    produkte.ts               Deckungsbeitrag je Produkt
    kapazitaet.ts             Saisonkalender, Bedarf gegen Angebot
    zeitbudget.ts             Wochenbelastung
    lehre.ts                  Lehrauftrag, Professurpfad
    gewinn.ts                 Gewinn und Gesamtnetto
    rente.ts                  Entgeltpunkte, Rentendifferenz
    simulation.ts             Orchestrierung über 10 Jahre
    sensitivitaet.ts          Tornado
    breakeven.ts              Benötigte Kurse je Stufe
    warnungen.ts              Regelwerk
    herleitung.ts             Sicht auf die Ergebnisobjekte
    __tests__/                78 Tests, davon 69 noch rot
  persistenz/
    speicher.ts               localStorage mit Nur-Speicher-Rückfall
    migration.ts              Versionskette
    exportImport.ts           JSON-Datei, kein Netzwerk
  state/
    szenarioReducer.ts        Zustand mit Undo/Redo
  ui/
    App.tsx, stil.css         Rahmen und Gestaltungsgrundlage
```

**Regel:** Keine Rechenlogik in Komponenten. Keine Rechtsgröße als Literal außerhalb von
`konstanten.ts`. Alle Rechenfunktionen nehmen `Rechtsgroessen` als Parameter — es gibt
keinen globalen Zugriff, damit die Sensitivitätsanalyse Rechtsgrößen variieren kann.

---

## 4. Verlässlichkeit der Rechtsgrößen

Rechtsstand **2025**, weil dort belastbare Werte mit Quelle benennbar sind. Für einen
Zehnjahreshorizont ist das Basisjahr ohnehin zweitrangig — fortgeschrieben wird so oder so.

**Hohe Verlässlichkeit** (nachgerechnet oder strukturell geprüft):
Grundtarif § 32a EStG 2025 — die Stetigkeit an allen drei Zonengrenzen ist als Test
hinterlegt und geht auf; Beitragsbemessungsgrenzen 66.150 / 96.600 €, JAEG 73.800 €;
Beitragssätze KV 14,6 %, PV 3,6 %, RV 18,6 %, ALV 2,6 %; § 19 UStG mit 25.000 / 100.000 €
(Neuregelung zum 01.01.2025); Gewerbesteuer-Freibetrag 24.500 €, Messzahl 3,5 %,
Anrechnung 4,0-fach; Übungsleiterpauschale 3.000 €.

**Vor Nutzung zwingend zu prüfen** (plausibel, aber nicht mit letzter Sicherheit):
Solidaritätszuschlag-Freigrenze 19.950 €; durchschnittlicher GKV-Zusatzbeitrag 2,5 %;
Durchschnittsentgelt 50.493 € und Rentenwert 40,79 €; **Hebesatz Tettnang 360 %** — reiner
Platzhalter, bitte bei der Gemeinde erfragen.

Jede Konstante trägt in `konstanten.ts` Jahr, Fundstelle und den Marker
`// vor Nutzung verifizieren`.

---

## 5. Risiken

| Risiko | Wirkung | Umgang |
|---|---|---|
| KV-Status faktisch unklar (siehe 1.1) | Größter Einzelhebel im Modell; entscheidet über Stufe 60 % | Alle drei Wege implementiert, Warnung bei JAEG-Überschreitung, Sensitivität weist den Effekt aus |
| Ohne Hallenbadzugang trägt kein Ganzjahresmodell | Das Basisszenario steht und fällt damit | Ganzjahresprodukte liefern ohne Zugang **null** Erlös; harte Warnung; eigenes Preset |
| Kapazität wird still überschritten | Stille Fortrechnung wäre der schwerste Modellfehler | Rechenkern deckelt nicht, sondern meldet; UI zeigt geplant und kapazitätsgedeckelt nebeneinander |
| Beckenmiete steigt schneller als die Preise | Der Deckungsbeitrag je Stunde erodiert über zehn Jahre | Getrennte Indizes, als Test abgesichert; Sensitivität macht es sichtbar |
| Klumpenrisiko einzelner Produkte | Ein wegbrechender BGM-Kunde kippt das Modell | Warnung ab 60 % Deckungsbeitragsanteil |
| localStorage nicht verfügbar | Datenverlust ohne Vorwarnung | Nur-Speicher-Modus, dauerhaft sichtbar gemeldet, Export bleibt möglich |

---

## 6. Stand der Vorbereitung

**Fertig und verifiziert:** Projektgerüst (`tsc --noEmit` fehlerfrei, `vite build`
erfolgreich), vollständiges Typmodell, Rechtsgrößen 2025 mit Quellen, Defaults und Presets
aus der Spezifikation, Formatierung mit grünen Tests, Signaturen und dokumentierte
Rechenregeln für den gesamten Rechenkern.

**Testgerüst:** 78 Tests, davon 9 grün (`format`) und **69 bewusst rot** — sie sind die
ausführbare Spezifikation des Rechenkerns. Jeder Erwartungswert ist von Hand gerechnet und
der Rechenweg steht im Kommentar, damit ein Fehler in der Implementierung nicht versehentlich
in den Test wandert.

Die Arbeitspakete stehen in `UMSETZUNG.md`.
