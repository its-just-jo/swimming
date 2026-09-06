# Gestaltungs- und Bedienkonzept

Stand: 31.08.2026 · Gilt zusammen mit [`ARCHITEKTUR.md`](./ARCHITEKTUR.md) (fachliche
Festlegungen) und [`UMSETZUNG.md`](./UMSETZUNG.md) (Arbeitspakete).

Dieses Dokument ist verbindlich für alle UI-Arbeiten. Es ersetzt Abschnitt 8 der
ursprünglichen Spezifikation und ergänzt sie um Bedienlogik.

---

## 1. Ausgangslage — gemessen, nicht geschätzt

Die folgenden Zahlen stammen aus einem Lauf gegen den tatsächlichen Rechenkern
(Default-Szenario und Preset „Basis"). Sie begründen jeden Umbau in diesem Dokument.

| Befund | Messwert |
|---|---|
| Warnungen im Default-Szenario | **22** — davon 20 aus nur zwei Typen × 10 Jahre |
| Eingabefelder gesamt | **78** in 9 Abschnitten |
| Felder ohne jeden Hilfetext | **18** |
| Tooltip-Umsetzung | natives `title=` — ~1 s Verzögerung, auf Touchgeräten nicht erreichbar |
| Produkte, die im Jahr 2026 nichts liefern | **6 von 7** — obwohl in der Liste als „aktiv" geführt |
| Kurse pro Jahr als sichtbare Zahl | **existiert nicht** (2026: 3 Kurse, 2027: 18 — nirgends ablesbar) |

Der Kern des Problems ist nicht die Optik. Das Werkzeug beantwortet die vier
Kernfragen der Spezifikation nicht, obwohl der Rechenkern sie beantworten kann: Es
zeigt Parameter und Ergebnisse, aber es sagt nicht, **was zu tun ist**.

---

## 2. Leitidee: vom Parameter-Editor zum Zielrechner

> Der Nutzer bringt ein Ziel mit, nicht 78 Parameter. Das Werkzeug löst rückwärts auf
> und legt einen Vorschlag vor. Der Nutzer entscheidet, ob er ihn übernimmt.

Drei Regeln, die sich daraus für jede Gestaltungsentscheidung ableiten:

1. **Antwort vor Eingabe.** Die oberste Bildschirmfläche zeigt den Zielzustand und
   seine Erreichbarkeit — nicht ein Formular.
2. **Nichts Wirkungsloses zeigen.** Ein Feld, das das Ergebnis nachweislich nicht
   verändern kann, ist ausgeblendet. Eine Zahl ohne Wirkung ist eine Falschaussage
   über die eigene Wichtigkeit.
3. **Jede Zahl erklärt sich.** Nicht nur ihren Rechenweg (das leistet die Herleitung
   bereits), sondern auch ihr **Zustandekommen null** — warum ein Produkt nichts
   liefert, ist genauso wichtig wie sein Deckungsbeitrag.

Der nüchterne Charakter aus Spezifikation 8 bleibt. Die Verbesserung kommt aus
Handwerk — Hierarchie, Weißraum, Typografie, geprüfte Farben —, nicht aus Dekoration.
Weiterhin gilt: keine Verlaufsfarben, keine Erfolgs-Emojis, keine Illustrationen.

---

## 3. Informationsarchitektur: drei Ebenen

Heute steht alles gleichrangig nebeneinander. Künftig gibt es drei Ebenen mit
absteigender Häufigkeit der Nutzung.

```
┌──────────────────────────────────────────────────────────────────────┐
│ EBENE 1 — ZIEL              immer sichtbar, oberste Fläche           │
│ Zielwahl · Statuskarte · sechs Kennzahlen                            │
├───────────────────────────────┬──────────────────────────────────────┤
│ EBENE 2 — PLAN                │ EBENE 3 — WERKSTATT                  │
│ rechte Spalte, Standardsicht  │ linke Spalte, auf Wunsch             │
│                               │                                      │
│ Kursplan des Jahres           │ Leitplanken (Solver-Grenzen)         │
│ Warnungen, gebündelt          │ Produkte, Kosten, Steuerschalter     │
│ Diagramme                     │ Rechtliche Parameter (eingeklappt)   │
└───────────────────────────────┴──────────────────────────────────────┘
```

**Ebene 1** beantwortet: *Trägt mein Ziel, und ab wann?*
**Ebene 2** beantwortet: *Woraus besteht der Plan, und was steht ihm im Weg?*
**Ebene 3** beantwortet: *Welche Annahmen stecken dahinter?*

Auf dem Handy werden die Ebenen gestapelt; Ebene 1 bleibt als komprimierte Leiste
fixiert.

---

## 4. Umbau 1 — Zielmodus

Das Herzstück. Ersetzt das Tüfteln durch Rückwärtsauflösung.

### 4.1 Vier Zielarten, ein Verfahren

| Art | Eingabe | Ausgabe |
|---|---|---|
| **Z1 Reduktion** | „Ich will auf 80 %" | Benötigte Kurse, Wasserzeit, Zielmonat |
| **Z2 Zeitpunkt** | „Bis 2029 runter" | Tiefste Stufe, die bis dahin trägt |
| **Z3 Nettoziel** | „Mindestens 55.000 € netto" | Benötigte Kurse je Stufe |
| **Z4 Zeitbudget** | „Nie über 50 h/Woche" | Maximal mögliche Reduktion |

Alle vier laufen über dieselbe Rückwärtsauflösung. Die Zielart wird als
Segmentsteuerung gewählt; sichtbar ist immer nur das Eingabefeld der aktiven Art.

### 4.2 Das Verfahren

Ein **Mengenfaktor `m`** skaliert die Zyklen aller als *variabel* markierten Produkte.
Der Solver erfindet keine Produkte — er skaliert die vorhandenen innerhalb der
Leitplanken.

```
1  Stetige Suche:   m ∈ [0, m_max] per Bisektion, Zielfunktion = berechneSzenario
2  Monotonieprüfung: Kapazitätsdeckel, USt-Schwelle und Statuswechsel erzeugen
                     Sprünge. Ist die Zielfunktion nicht monoton, wird auf einen
                     Rasterlauf mit 60 Stützstellen umgeschaltet und das kleinste
                     zielerfüllende m genommen. Näherung wird nie unterstellt.
3  Ganzzahligkeit:  Kurse sind ganzzahlig. Aufsteigende Auffüllung nach
                     Deckungsbeitrag je Wasserstunde (absteigend), bis das Ziel
                     erreicht oder eine Leitplanke bindet.
4  Nachrechnung:    Das ganzzahlige Ergebnis wird ein letztes Mal vollständig
                     durchgerechnet. Berichtet wird ausschließlich dieser Lauf —
                     nie der stetige Zwischenwert.
```

Schritt 3 hat einen erwünschten Nebeneffekt: Der Vorschlag beginnt bei den
wirtschaftlichsten Kursen. Das ist zugleich die inhaltlich richtige Empfehlung.

### 4.3 Leitplanken — die Steuerung des Kursniveaus

Ohne Leitplanken schlägt der Solver Unsinn vor. Sie stehen in einem eigenen
Abschnitt „Leitplanken" **oberhalb** der Produktliste, weil sie den Vorschlag prägen.

**Je Produkt — eine dreiwertige Rolle, direkt in der Produktzeile:**

| Rolle | Bedeutung |
|---|---|
| `fest` | Der Solver ändert dieses Produkt nicht. Menge bleibt wie eingetragen. |
| `variabel` | Der Solver darf die Zyklen skalieren — bis `maxZyklenProJahr`. |
| `aus` | Kommt im Vorschlag nicht vor. |

Zusätzlich je Produkt: **Obergrenze Zyklen/Jahr** (Default = das Doppelte des
Eingetragenen). Damit lässt sich steuern, dass etwa Anfängerkurse beliebig wachsen
dürfen, Intensivkurse aber höchstens dreimal im Jahr stattfinden.

**Global:**

| Leitplanke | Default | Wirkung |
|---|---|---|
| Wasserstunden je Woche, max. | aus `wasser.wasserstundenProWoche` | harte Grenze |
| Wochenbelastung, max. | 55 h | harte Grenze |
| Samstagsstunden, max. | aus `wasser.davonSamstag` | harte Grenze |
| Fremdlehrkraft zulässig | nein | erlaubt dem Solver, Kapazität zuzukaufen |
| Kapazität einhalten | **immer an, nicht abschaltbar** | siehe unten |

Die Kapazitätsgrenze ist im Solver **hart**. Das steht nicht im Widerspruch zur Regel
„nicht stillschweigend deckeln": Diese Regel gilt für die Bewertung eines vom Nutzer
eingegebenen Szenarios — dort wird weiterhin ungedeckelt gerechnet und laut gewarnt.
Ein *Vorschlag*, der von vornherein unmöglich ist, wäre dagegen wertlos. Beides
zugleich gilt: Der Solver schlägt nichts Unmögliches vor, und er meldet ausdrücklich,
wenn das Ziel nur jenseits der Kapazität erreichbar wäre.

### 4.4 Die Zielkarte

Ersetzt die heutige nackte Kennzahlenleiste als oberstes Element.

```
┌────────────────────────────────────────────────────────────────────────┐
│  ZIEL   [Reduktion] [Zeitpunkt] [Nettoziel] [Zeitbudget]               │
│                                                                        │
│  Beschäftigungsgrad   [ 100 ][ 80 ][ 60 ][ 50 ]  ← Segmente            │
│                                                                        │
│  ●  Trägt ab März 2027                                                 │
│     18 Kurse im Jahr · 131 h Wasserzeit · 48,5 h/Woche                 │
│                                                     [ Vorschlag ansehen ]│
├────────────────────────────────────────────────────────────────────────┤
│ Gesamtnetto  Lücke      Deckungsgrad  DB/Stunde  Wochenlast  Kapazität │
│ 46.163 €     −7.724 €   86 %          105 €      48,5 h      45 %      │
└────────────────────────────────────────────────────────────────────────┘
```

**Statuszeile — vier Zustände**, jeweils Punkt + Text, nie Farbe allein:

| Zustand | Punkt | Text |
|---|---|---|
| Erreicht | `--status-erreicht` | „Trägt ab März 2027" |
| Knapp | `--status-grenzwert` | „Trägt ab 2029 — nur bei voller Kapazität" |
| Unerreichbar | `--status-kritisch` | „Trägt im Horizont nicht" |
| Kein Ziel gesetzt | `--text-3` | „Ziel wählen, um einen Vorschlag zu erhalten" |

Bei *unerreichbar* nennt die Karte **die bindende Beschränkung** und den stärksten
Hebel aus der Sensitivitätsanalyse:

> Trägt im Horizont nicht. Bindend ist das Zeitbudget (55 h/Woche ab 2028).
> Stärkster Hebel: Beckenmiete — 20 % weniger Miete schließen 2.900 € der Lücke.

Das ist der Punkt, an dem das Werkzeug tatsächlich berät, statt Zahlen abzulegen.

### 4.5 Übernehmen — nie ohne Zustimmung

„Vorschlag ansehen" öffnet ein Panel mit einer **Vorher-Nachher-Tabelle**:

```
Produkt                        heute      Vorschlag      Δ
Kinderschwimmkurs Anfänger     4 Zyklen   6 Zyklen      +2     [x] übernehmen
Aquafitness ohne ZPP           4 Zyklen   7 Zyklen      +3     [x] übernehmen
Erwachsene Nichtschwimmer      3 Zyklen   3 Zyklen       —     (fest)
Intensivkurs Ferien            3 Zyklen   0 Zyklen      −3     [ ] übernehmen
```

- Jede Zeile einzeln abwählbar. Abwählen rechnet die Vorschau sofort neu und zeigt,
  was das für den Zielstatus bedeutet.
- „Übernehmen" schreibt **eine einzige** Reducer-Aktion — ein `Strg+Z` macht den
  gesamten Vorschlag rückgängig.
- Ohne Klick auf „Übernehmen" ändert sich am Szenario nichts. Der Vorschlag ist bis
  dahin reine Vorschau.

---

## 5. Umbau 2 — Kursplan: was findet wann statt

Beantwortet Kernfrage 2 und beseitigt den schwersten Verständnisfehler: dass sechs
von sieben Produkten stumm sind, ohne dass die Oberfläche es sagt.

### 5.1 Kopfzeile mit den fehlenden Zahlen

```
Kursplan 2027        18 Kurse · 131 von 294 h Wasserzeit (45 %) · 5 von 7 Produkten aktiv
```

### 5.2 Produkttabelle mit Saisonband

```
Produkt                     Kurse  Wasserzeit    DB      DB/h   J F M A M J J A S O N D
Aquafitness ohne ZPP           4      30,0 h   4.500 €   150 €  ▓▓▓▓░░░░░▓▓▓
Kinderschwimmkurs Anfänger     4      30,0 h   1.467 €    49 €  ▓▓▓▓░░░░░▓▓▓
Intensivkurs Ferien            3      11,3 h   5.051 €   448 €  ░░░░▓▓▓▓▓░░░
─────────────────────────────────────────────────────────────────────────────
Aquafitness mit ZPP            —          —       —       —     startet 01/2028
BGM Firmenkurs                 —          —       —       —     startet 01/2028
```

**Die Begründungszeile ist der Kern dieses Umbaus.** Stumme Produkte werden nicht
versteckt und nicht als „0 €" ausgegeben, sondern mit ihrem Grund gezeigt:

| Grund | Anzeige |
|---|---|
| `inaktiv` | „deaktiviert" |
| `vor_startmonat` | „startet 01/2028" |
| `kein_hallenbad` | „kein Hallenbadzugang" — verlinkt auf den Schalter |
| `ausserhalb_saison` | „nur Freibadsaison" |

> **Rechenkern-Änderung erforderlich:** `ProduktErgebnis` braucht ein Feld
> `stummGrund: 'inaktiv' | 'vor_startmonat' | 'kein_hallenbad' | 'ausserhalb_saison' | null`.
> Ohne dieses Feld kann die UI den Grund nur raten — genau das soll sie nicht.

### 5.3 Kapazitätsbalken statt Diagramm

Über der Tabelle ein einzelner Balken, Freibad und Halle getrennt, mit Grenzmarke.
Bei Überschreitung: der Teil jenseits der Marke in `--status-kritisch`, mit Beschriftung
„23 h über Kapazität — nicht durchführbar". Ersetzt das heutige Kapazitätsdiagramm,
das dieselbe Information mit deutlich mehr Fläche zeigt.

---

## 6. Umbau 3 — Warnungen bündeln

Aus 22 Karten werden 4.

### 6.1 Bündelungsregel

```
buendleWarnungen(warnungen) → GebuendelteWarnung[]

GebuendelteWarnung {
  code, stufe, titel,
  jahre:        number[]      alle betroffenen Kalenderjahre
  jahresLabel:  string        verdichtet, siehe unten
  text:         string        ein Text, ohne Jahreszahl im Fließtext
  details:      { jahr, text }[]   die ursprünglichen jahresbezogenen Texte
  ankerAbschnitt?: string
}
```

**Verdichtung der Jahresangabe** — zusammenhängende Läufe werden zusammengezogen:

| Jahre | Label |
|---|---|
| 2026 | `2026` |
| 2026, 2027, 2028 | `2026–2028` |
| 2026, 2028, 2029, 2030 | `2026, 2028–2030` |
| mehr als 3 Gruppen | `2026–2035 · 8 Jahre` |
| alle Jahre des Horizonts | `alle Jahre` |

**Sortierung:** `kritisch` → `grenzwert` → `hinweis`, innerhalb der Stufe nach Anzahl
betroffener Jahre absteigend.

### 6.2 Darstellung

```
┌─┬──────────────────────────────────────────────────────────────────────┐
│▌│ ⚠  Bruttoentgelt über der JAEG                    alle Jahre    [ⓘ]  │
│ │    Eine echte Pflichtversicherung ist rechtlich regelmäßig nicht mehr │
│ │    möglich. Der KV-Status ist vor Nutzung zu prüfen.                  │
│ │                                            [ Zum Feld ]  [ Jahre ▾ ]  │
└─┴──────────────────────────────────────────────────────────────────────┘
```

- Der farbige Streifen links (3 px) und das Symbol tragen die Stufe. **Der Fließtext
  bleibt in Textfarbe** — durchgehend eingefärbte Absätze sind schlechter lesbar und
  nutzen sich als Signal ab.
- Die Überschrift darf die Stufenfarbe tragen; die dafür vorgesehenen Werte sind auf
  Kontrast geprüft (Abschnitt 9.3).
- „Jahre ▾" klappt die jahresweisen Einzeltexte auf — die heutige Information geht
  nicht verloren, sie ist nur nicht mehr die Voreinstellung.
- Der Warnblock steht **über** den Diagrammen, direkt unter der Zielkarte.

### 6.3 Sonderfall Dauerhinweise

`rechtsgroessen_ungeprueft` ist keine Warnung im eigentlichen Sinn, sondern ein
Dauerzustand. Er gehört nicht in die Warnliste, sondern als dezente Zeile in den
Fußbereich neben den Rechtshinweis — sonst stumpft die Liste ab.

---

## 7. Umbau 4 — nur zeigen, was wirkt

### 7.1 Regel

> Ein Feld wird ausgeblendet, wenn es das Ergebnis **nachweislich nicht verändern
> kann**, weil ein anderer Schalter es wirkungslos macht.

Ausgeblendet heißt **nicht gelöscht**: Der Wert bleibt erhalten und wirkt sofort
wieder, sobald die Bedingung erfüllt ist.

### 7.2 Sichtbarkeitsbedingungen

`Feldkonfiguration` erhält ein optionales Prädikat `sichtbarWenn(szenario, zeile)`.

| Feld | sichtbar nur wenn |
|---|---|
| `pkvBeitragProMonat` | `kvStatus === 'pkv'` |
| `kinderlosZuschlagPflege` | `kinderfreibetraege === 0` |
| `gewerbesteuerHebesatz` | `rechtsform === 'gewerbe'` |
| `drvBefreiungBisMonat` | `drvBefreiungExistenzgruender` |
| `aktiveWochenHalle`, `hallenbadAbMonat` | `hallenbadzugang` |
| `zppPreisaufschlag` | `zppFaehig` |
| `honorarFremdlehrkraftJeStunde` | `durchfuehrung === 'fremdlehrkraft'` |
| `teilnehmerJeKurs`, `preisJeTeilnehmer` | `abrechnung === 'je_teilnehmer'` |
| `pauschaleJeKurs` | `abrechnung === 'pauschale'` |
| `lvsJeSemester`, `satzJeLvs`, `startmonat` | `lehrauftragAktiv` |
| `professurBruttoProJahr`, `professurBeschaeftigungsgrad`, `professurStartjahr` | `professurAktiv` |
| `vorsteuerabzugsfaehig` (alle Kostenzeilen) | `steuer.vorsteuerabzug` |
| `kirchensteuersatz` (Rechtsgrößen) | `kirchensteuerpflichtig` |

Das entfernt im Default-Szenario **19 von 78 Feldern** aus der Sicht, ohne dass eine
einzige Rechengröße verlorengeht.

### 7.3 Der Umschalter

Am Fuß jedes Abschnitts, nicht als globale Einstellung:

```
                                          3 Felder ohne Wirkung ausgeblendet  [einblenden]
```

Eingeblendete wirkungslose Felder werden gedämpft dargestellt (`--text-3`, kein
Rahmen) und tragen den Hinweis, was sie aktivieren würde: *„wirkt erst bei
Rechtsform Gewerbe"*. Der Zustand des Umschalters wird je Abschnitt in
`app:einstellungen` gespeichert.

### 7.4 Abgrenzung

Nicht ausgeblendet werden Felder, die lediglich *aktuell null* sind. Ein Bonus von
0 € ist eine Aussage, keine Wirkungslosigkeit. Die Regel greift ausschließlich bei
struktureller Wirkungslosigkeit durch einen anderen Schalter.

---

## 8. Umbau 5 — echte Tooltips

### 8.1 Warum `title=` ersetzt werden muss

Das native Attribut öffnet nach etwa einer Sekunde, ist auf Touchgeräten gar nicht
erreichbar, lässt sich nicht gestalten, bricht lange Texte um und ist für
Screenreader unzuverlässig. Bei einem Werkzeug, dessen Felder Rechtsbegriffe tragen,
ist das die falsche Wahl.

### 8.2 Komponente `Hilfe`

- **Auslöser:** eigenes `ⓘ`-Schaltelement neben dem Label, 16 × 16 px, Trefferfläche
  24 × 24 px. Nicht das Label selbst — sonst ist die Hilfe per Tastatur nicht
  erreichbar und auf Touch nicht vom Fokussieren zu unterscheiden.
- **Öffnen:** Zeigergerät nach 150 ms Verweilen; Tastaturfokus sofort; Tippen sofort.
- **Schließen:** `Esc`, Klick außerhalb, Fokusverlust. Verweilen im Panel hält offen.
- **Position:** bevorzugt rechts, mit Kollisionsprüfung gegen den Viewport; auf dem
  Handy als Blatt am unteren Rand.
- **Breite:** max. 320 px. **Semantik:** `role="tooltip"`, `aria-describedby` am Feld.

### 8.3 Inhaltsregel — jeder Text hat drei Teile

```
1  Was ist das?            ein Satz, ohne Fachjargon
2  Was bewirkt es?         welche Kennzahl es verändert und in welche Richtung
3  Woher kommt der Wert?   nur bei Rechtsgrößen: Fundstelle und Stand
```

Beispiel für `auslastungsgrad`:

> Anteil der Plätze, die im Mittel tatsächlich belegt sind. Wirkt unmittelbar auf
> Erlös und Deckungsbeitrag — bei Pauschalabrechnung dagegen gar nicht.
> Schätzwert.

### 8.4 Die 18 fehlenden Texte

Verbindlich zu ergänzen:

| Feld | Text |
|---|---|
| `bezeichnung` | Freier Name. Erscheint in Kursplan, Diagrammen und Warnungen. |
| `kategorie` | Nur zur Gruppierung in Auswertungen. Ohne Rechenwirkung. |
| `aktiv` | Schaltet das Produkt aus der Rechnung. Werte bleiben erhalten. |
| `teilnehmerJeKurs` | Plätze je Kurs. Mit Auslastung und Preis ergibt sich der Erlös. |
| `preisJeTeilnehmer` | Bruttopreis für den **gesamten** Kurs, nicht je Einheit. |
| `pauschaleJeKurs` | Bruttopauschale je Kurs, unabhängig von der Teilnehmerzahl. Die Auslastung wirkt hier nicht. |
| `einheitenJeKurs` | Anzahl der Termine eines Kursdurchlaufs. Bestimmt die Wasserzeit. |
| `dauerJeEinheitMinuten` | Dauer eines Termins. Kürzere Termine erhöhen die Anfahrtszeit je Wasserstunde. |
| `beckenmieteJeStunde` | Mietsatz je Stunde und Bahn. Größter Kostenblock — und laut Sensitivität meist der stärkste Hebel. |
| `auslastungsgrad` | Anteil belegter Plätze im Mittel. Wirkt auf Erlös, nicht auf Kosten. |
| `zyklenProJahr` | Wie oft dieser Kurs im Jahr durchläuft. Zusammen mit „Kurse parallel" ergibt das die Kurszahl. |
| `betragProJahr` | Jahresbetrag brutto. Mindert den Gewinn und damit die Steuerlast. |
| `vorsteuerabzugsfaehig` | Ob aus diesem Betrag Vorsteuer gezogen werden kann. Bei kommunaler Beckenmiete meist nicht. |
| `indexiert` | Ob die Position mit der Inflation fortgeschrieben wird. |
| `kilometerProJahr` | Betrieblich gefahrene Kilometer. Mal Kilometersatz eine Betriebsausgabe. |
| `betrag` (Investition) | Einmalbetrag. Wirkt als Ausgabe **und** mindert den Gewinn im Monat der Zahlung. |
| `professurBruttoProJahr` | Bruttojahresgehalt der Professur. Ersetzt ab dem Startjahr die bisherige Anstellung. |
| `professurBeschaeftigungsgrad` | Umfang der Professur. 1,0 = volle Stelle. |

---

## 9. Visuelles System

### 9.1 Grundsätze

Nüchtern, dicht, ruhig. Verbessert wird durch Hierarchie und Weißraum, nicht durch
Farbe. Konkret: **Flächen statt Rahmen** (Karten heben sich durch Untergrund ab, nicht
durch Umrandung), **eine Akzentfarbe**, **Schatten nur bei Überlagerungen**.

### 9.2 Farbtokens

Beide Modi sind ausgewählt, nicht automatisch umgerechnet. Dunkelmodus folgt
`prefers-color-scheme` und wird zusätzlich per Umschalter überschrieben; die
Umschaltung muss in beide Richtungen gewinnen.

```css
:root {
  color-scheme: light;
  --plane:        #f7f7f5;   /* Seitengrund */
  --surface:      #ffffff;   /* Karte, Diagrammfläche */
  --surface-2:    #fbfbfa;   /* eingelassene Bereiche, Tabellenkopf */
  --linie:        #e4e2dd;   /* Haarlinie */
  --linie-stark:  #cbc8c1;   /* Achsen, Trennung tragender Bereiche */
  --text:         #1a1917;
  --text-2:       #56544f;   /* 7,6:1 — Label, Sekundärtext */
  --text-3:       #8a8781;   /* 3,6:1 — NUR Achsen, Einheiten, Fußnoten */
  --akzent:       #2a78d6;   /* Bedienelemente, Fokus */
  --akzent-text:  #256abf;   /* 5,4:1 — Akzent als Textfarbe */
  --akzent-weich: #eef4fd;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --plane: #121211;  --surface: #1c1c1a;  --surface-2: #232321;
    --linie: #2e2e2b;  --linie-stark: #43423e;
    --text: #f5f4f1;   --text-2: #b8b6ae;   --text-3: #8a8781;
    --akzent: #3987e5; --akzent-text: #3987e5; --akzent-weich: #172232;
  }
}
:root[data-theme="dark"] { /* identisch zum Block darüber */ }
```

**Status — fest, nie umgefärbt.** Immer mit Symbol und Text gepaart, nie Farbe allein:

| Rolle | Fläche/Symbol | Textvariante hell | Textvariante dunkel |
|---|---|---|---|
| kritisch | `#d03b3b` | `#8c2f2f` (8,2:1) | `#f08a8a` (7,1:1) |
| grenzwert | `#fab219` | `#8a6320` (5,4:1) | `#e0b04f` (8,5:1) |
| erreicht | `#0ca30c` | `#0d7a3d` (5,4:1) | `#4fbd7d` (7,2:1) |

Die Textvarianten sind zwingend, sobald Farbe auf Text liegt — `#fab219` erreicht auf
Weiß nur 1,8:1 und ist als Schriftfarbe unbrauchbar. Alle Werte oben sind nachgerechnet.

### 9.3 Diagrammpalette — geprüft

Kategoriale Belegung in **fester Reihenfolge**, nie zyklisch:

| Rolle | Hell | Dunkel |
|---|---|---|
| Serie 1 — Anstellung | `#2a78d6` | `#3987e5` |
| Serie 2 — Kurse | `#eb6834` | `#d95926` |
| Serie 3 — Lehre | `#1baf7a` | `#199e70` |

Gegen die tatsächlichen Flächen dieses Projekts validiert (`#ffffff` / `#1c1c1a`,
alle Paare): Helligkeitsband, Chroma, Farbfehlsichtigkeits-Trennung und
Normalsicht-Abstand bestehen in beiden Modi. **Eine Auflage:** Serie 3 erreicht auf
Weiß 2,8:1 — deshalb sind bei gestapelten Flächen **sichtbare Direktbeschriftungen
oder eine Tabellenansicht Pflicht**, nicht optional.

Mehr als drei Serien werden nicht eingeführt. Braucht eine Ansicht mehr, wird
gruppiert oder in kleine Vielfache zerlegt.

- **Sequenziell** (eine Größe, z. B. Deckungsbeitrag je Produkt): eine Hue, hell → dunkel.
- **Divergierend** (Tornado): Blau ↔ Rot mit **grauem** Mittelpunkt
  (`#f0efec` / `#383835`). Nie eine Farbe in der Mitte.
- **Niemals zwei y-Achsen.** Zwei Größen unterschiedlicher Skala werden zu zwei
  Diagrammen oder auf eine gemeinsame Basis indexiert.

### 9.4 Typografie

Systemschrift, keine externe Ladung (Laufzeitregel bleibt unberührt).

| Rolle | Größe | Gewicht | Zeilenhöhe |
|---|---|---|---|
| Zielstatus (Heldenzahl) | 34 px | 600 | 1,15 |
| Kennzahlwert | 26 px | 600 | 1,2 |
| Abschnittstitel | 16 px | 600 | 1,3 |
| Fließtext | 14 px | 400 | 1,45 |
| Formularlabel | 13 px | 500 | 1,3 |
| Hilfstext, Achsen | 12 px | 400 | 1,4 |

`font-variant-numeric: tabular-nums` gilt für **Tabellenspalten, Achsen und die
Kennzahlenleiste** — überall dort, wo Ziffern untereinander stehen. Freistehende
große Zahlen behalten proportionale Ziffern.

### 9.5 Raster, Radien, Bewegung

- Abstände: `4 · 8 · 12 · 16 · 24 · 32 · 48` — nichts dazwischen.
- Radien: 4 px Bedienelemente, 8 px Karten, 999 px Marken.
- Rahmen: 1 px Haarlinie. Schatten **nur** bei Überlagerungen
  (`0 4px 16px rgba(0,0,0,.12)`).
- Bewegung: 120 ms für Zeigerreaktionen, 180 ms für Panels, `ease-out`.
  Bei `prefers-reduced-motion: reduce` auf 0 ms.
- Fokus: `outline: 2px solid var(--akzent); outline-offset: 2px` — nie entfernt.

---

## 10. Diagramme

Sechs Ansichten bleiben, mit vier Auflagen:

1. **Der Tornado steht zuoberst.** Er ist laut Spezifikation die wichtigste Ansicht
   und beantwortet Kernfrage 4. Heute steht er zwischen anderen.
2. **Jedes Diagramm hat eine Aussage als Überschrift**, keine Gattungsbezeichnung.
   Nicht „Gesamtnetto über 10 Jahre", sondern „Die Lücke schließt sich ab 2029".
3. **Schwebeebene ist Pflicht** — Fadenkreuz mit Tooltip bei Linien und Flächen,
   Tooltip je Element bei Balken. Trefferflächen größer als die Marke.
4. **Tabellenansicht je Diagramm** über einen Umschalter „als Tabelle". Erfüllt
   zugleich die Auflage aus 9.3.

Weitere Vorgaben: dünne Marken, 2 px Linien, ≥ 8 px Punkte, 2 px Flächenspalt
zwischen gestapelten Segmenten, zurückgenommene Gitter- und Achsenlinien,
Direktbeschriftung statt Zahl an jedem Punkt.

Das **Kapazitätsdiagramm entfällt** und wird durch den Balken im Kursplan (5.3)
ersetzt — dieselbe Aussage auf einem Fünftel der Fläche.

---

## 11. Handy und Reaktionsfähigkeit

- Umbruch bei 900 px, wie bisher.
- Gestapelt: Zielkarte → Warnungen → Kursplan → Diagramme → Eingaben.
  **Die Eingaben rutschen ans Ende** — auf dem Handy wird gelesen, nicht konfiguriert.
- Fixiert am oberen Rand: eine auf **drei** Werte reduzierte Leiste (Gesamtnetto,
  Deckungsgrad, Zielstatus). Sechs Kacheln sind auf 375 px unlesbar.
- Trefferflächen mindestens 44 × 44 px. Zahlenfelder mit `inputMode="decimal"`.
- Tabellen scrollen in ihrem eigenen Container waagerecht; die Seite selbst nie.

---

## 12. Barrierefreiheit

- Kontrast: Fließtext ≥ 4,5:1, Bedienelemente und Grafik ≥ 3:1. Die Tokens in 9.2
  sind darauf geprüft; `--text-3` ist ausdrücklich **nicht** für Fließtext zugelassen.
- Zustand nie durch Farbe allein: Status trägt immer Symbol und Text, Diagramme
  tragen Legende und Direktbeschriftung.
- Vollständige Tastaturbedienung, sichtbarer Fokus, logische Reihenfolge.
- Warnungen als `role="region"` mit Beschriftung; der Zielstatus als
  `aria-live="polite"`, damit eine Änderung angesagt wird.
- `prefers-reduced-motion` wird respektiert.

---

## 13. Arbeitspakete

Reihenfolge nach Wirkung je Aufwand. AP 18 bis 20 sind Rechenkernarbeit und
gehören nach `/src/model/` — nicht in Komponenten.

| AP | Inhalt | Datei(en) | Abhängig von |
|---|---|---|---|
| **18** | `stummGrund` in `ProduktErgebnis` ergänzen und in `produkte.ts` setzen; Tests | `model/typen.ts`, `model/produkte.ts` | — |
| **19** | `buendleWarnungen` mit Jahresverdichtung; Tests für alle fünf Label-Fälle | `model/warnungen.ts` | — |
| **20** | Zielsolver: vier Zielarten, Leitplanken, Bisektion mit Monotonieprüfung, ganzzahlige Auffüllung; Tests | `model/ziel.ts` (neu) | 18 |
| **21** | Farbtokens, Typografie, Raster, Dunkelmodus | `ui/stil.css` | — |
| **22** | `Hilfe`-Komponente; `title=` ersetzen; 18 fehlende Texte | `ui/komponenten/Hilfe.tsx`, `ui/feldKonfiguration.ts` | 21 |
| **23** | `sichtbarWenn` in `Feldkonfiguration`; Umschalter je Abschnitt | `ui/feldKonfiguration.ts`, `ui/komponenten/Abschnitt.tsx` | 21 |
| **24** | Warnungen gebündelt darstellen, Jahre aufklappbar | `ui/komponenten/WarnungenBanner.tsx` | 19, 21 |
| **25** | Kursplan mit Saisonband, Begründungen, Kapazitätsbalken | `ui/komponenten/Kursplan.tsx` (neu) | 18, 21 |
| **26** | Zielkarte, Leitplanken-Abschnitt, Vorschlagspanel mit Übernehmen | `ui/komponenten/Zielkarte.tsx` (neu) | 20, 21 |
| **27** | Diagramme auf neue Palette, Schwebeebene, Tabellenansicht, Tornado nach oben | `ui/komponenten/diagramme/*` | 21 |
| **28** | Handy-Layout, reduzierte Leiste, Barrierefreiheitsdurchgang | alle | 21–27 |

Nach jedem Paket: `npm run typecheck && npm test`.

---

## 14. Was nicht gebaut wird

Über die Abgrenzung der ursprünglichen Spezifikation hinaus:

- **Keine Automatik ohne Zustimmung.** Der Solver schreibt nie selbsttätig ins Szenario.
- **Keine Erfolgsinszenierung.** Kein Konfetti, keine Emojis, keine Fortschrittsabzeichen.
  Ein erreichtes Ziel wird durch einen Punkt und einen Satz gemeldet.
- **Keine Onboarding-Tour.** Wer das Werkzeug öffnet, sieht sofort ein gerechnetes
  Szenario — das erklärt sich besser als eine Führung.
- **Keine vierte Diagrammserie**, keine zweite y-Achse, keine Regenbogenskalen.
- **Kein Verstecken schlechter Nachrichten.** Die Sichtbarkeitsregel aus Abschnitt 7
  gilt ausschließlich für strukturell wirkungslose Felder, niemals für ungünstige
  Ergebnisse oder Warnungen.
