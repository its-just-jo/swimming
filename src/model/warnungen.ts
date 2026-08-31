/**
 * Warnsystem, Abschnitt 5. "Auffaellig, nicht dezent."
 *
 * Regelwerk als reine Funktion ueber dem Ergebnis. Warnungen werden nicht in
 * den Rechenfunktionen erzeugt, sondern nachgelagert aus dem Ergebnisobjekt
 * abgeleitet — so bleibt das Regelwerk an einer Stelle pruefbar und die
 * Sensitivitaetsanalyse muss es nicht mitrechnen.
 *
 * Stufen: 'kritisch' (gedecktes Rot), 'grenzwert' (Bernstein), 'hinweis'.
 */

import { mitUeberschreibungen, MODELL_KONSTANTEN, rechtsgroessenFuer } from './konstanten';
import { istHauptberuflichSelbstaendig } from './steuer/sozialversicherung';
import type { Ergebnis, JahresErgebnis, Szenario, Warnung } from './typen';

function pruefeJahr(szenario: Szenario, jahr: JahresErgebnis): Warnung[] {
  const warnungen: Warnung[] = [];

  if (jahr.kapazitaet.ueberschreitung) {
    warnungen.push({
      code: 'kapazitaet_ueberschritten',
      stufe: 'kritisch',
      titel: 'Wasserkapazitaet ueberschritten',
      text: `Im Jahr ${jahr.kalenderjahr} uebersteigt die benoetigte Wasserzeit (${jahr.kapazitaet.benoetigtGesamt.toFixed(1)} h) die verfuegbare Kapazitaet (${jahr.kapazitaet.verfuegbarGesamt.toFixed(1)} h). Die Zahlen zeigen den geplanten, nicht den kapazitaetsgedeckelten Wert.`,
      jahr: jahr.kalenderjahr,
      ankerAbschnitt: 'wasser',
    });
  }

  const hauptberuflich = istHauptberuflichSelbstaendig({
    stundenSelbstaendigkeit: jahr.zeit.wasserstunden + jahr.zeit.vorbereitung + jahr.zeit.anfahrt,
    stundenAnstellung: jahr.zeit.hauptjobStunden,
    gewinn: jahr.gewinn.gewinnVorSteuern,
    bruttolohn: jahr.anstellung.bruttoGesamt,
  });
  if (hauptberuflich.hauptberuflich) {
    warnungen.push({
      code: 'hauptberuflich_selbstaendig',
      stufe: 'grenzwert',
      titel: 'Hauptberuflichkeit droht (§ 5 Abs. 5 SGB V)',
      text: `Im Jahr ${jahr.kalenderjahr} spricht ${hauptberuflich.grundZeit ? 'das Zeitindiz' : ''}${hauptberuflich.grundZeit && hauptberuflich.grundEinkommen ? ' und ' : ''}${hauptberuflich.grundEinkommen ? 'das Einkommensindiz' : ''} fuer eine hauptberufliche Selbststaendigkeit. Damit kann die Pflichtversicherung in der Anstellung entfallen — das gesamte Einkommen wuerde beitragspflichtig.`,
      jahr: jahr.kalenderjahr,
      ankerAbschnitt: 'anstellung',
    });
  }

  if (szenario.steuer.kleinunternehmer && !jahr.kleinunternehmerAktiv) {
    warnungen.push({
      code: 'ust_schwelle_gerissen',
      stufe: 'grenzwert',
      titel: 'Kleinunternehmergrenze gerissen',
      text: `Im Jahr ${jahr.kalenderjahr} greift die Kleinunternehmerregelung (§ 19 UStG) nicht mehr — der Umsatz ist umsatzsteuerpflichtig geworden, ein automatischer Rueckwechsel ist nicht vorgesehen.`,
      jahr: jahr.kalenderjahr,
      ankerAbschnitt: 'steuer',
    });
  }

  if (jahr.anstellung.sv.ueberJaeg) {
    warnungen.push({
      code: 'jaeg_ueberschritten',
      stufe: 'grenzwert',
      titel: 'Jahresarbeitsentgeltgrenze ueberschritten',
      text: `Im Jahr ${jahr.kalenderjahr} liegt das Bruttoentgelt ueber der JAEG — eine echte Pflichtversicherung ist rechtlich regelmaessig nicht mehr moeglich, die Mitgliedschaft ist dann freiwillig. Der KV-Status ist vor Nutzung zu pruefen.`,
      jahr: jahr.kalenderjahr,
      ankerAbschnitt: 'anstellung',
    });
  }

  if (jahr.zeit.ueberSchwelle) {
    warnungen.push({
      code: 'wochenbelastung_ueber_schwelle',
      stufe: 'grenzwert',
      titel: 'Wochenbelastung ueber der Schwelle',
      text: `Im Jahr ${jahr.kalenderjahr} liegt die Wochenbelastung bei ${jahr.zeit.gesamtProWoche.toFixed(1)} h und damit ueber der konfigurierten Schwelle von ${szenario.simulation.wochenbelastungWarnschwelle} h.`,
      jahr: jahr.kalenderjahr,
      ankerAbschnitt: 'wasser',
    });
  }

  const dbSumme = jahr.gewinn.deckungsbeitragSumme;
  if (dbSumme > 0) {
    for (const p of jahr.produkte) {
      if (p.deckungsbeitrag / dbSumme > MODELL_KONSTANTEN.klumpenrisikoSchwelle) {
        warnungen.push({
          code: 'klumpenrisiko_produkt',
          stufe: 'hinweis',
          titel: 'Klumpenrisiko einzelnes Produkt',
          text: `Im Jahr ${jahr.kalenderjahr} traegt "${p.bezeichnung}" mehr als ${Math.round(MODELL_KONSTANTEN.klumpenrisikoSchwelle * 100)} % des Deckungsbeitrags. Faellt dieses Produkt weg, kippt das Ergebnis deutlich.`,
          jahr: jahr.kalenderjahr,
          ankerAbschnitt: 'produkte',
        });
      }
    }
  }

  return warnungen;
}

/**
 * Vollstaendiges Regelwerk. Reihenfolge = Anzeigereihenfolge, kritisch zuerst.
 *
 *  kapazitaet_ueberschritten        benoetigte > verfuegbare Wasserstunden
 *  kein_hallenbad_ganzjahresumsatz  kein Hallenbadzugang, aber Ganzjahresprodukte aktiv
 *  hauptberuflich_selbstaendig      § 5 Abs. 5 SGB V — Statuswechsel droht
 *  ust_schwelle_gerissen            § 19 UStG Grenze ueberschritten
 *  bbg_unterschritten               nur bei kvStatus 'gkv_freiwillig' relevant
 *  jaeg_ueberschritten              Entgelt ueber JAEG, KV-Status pruefen
 *  deckungsgrad_unter_100           Luecke wird nicht geschlossen
 *  wochenbelastung_ueber_schwelle   ueber der konfigurierten Schwelle
 *  klumpenrisiko_produkt            > 60 % des DB aus einem Produkt
 *  uebungsleiter_unvereinbar        § 3 Nr. 26 EStG neben gewerblichem Modell
 *  rechtsgroessen_ungeprueft        Dauerhinweis, solange nicht quittiert
 */
export function ermittleWarnungen(szenario: Szenario, ergebnis: Ergebnis): readonly Warnung[] {
  const warnungen: Warnung[] = [];

  if (
    !szenario.wasser.hallenbadzugang &&
    szenario.produkte.some((p) => p.aktiv && (p.saison === 'ganzjahr' || p.saison === 'halle'))
  ) {
    warnungen.push({
      code: 'kein_hallenbad_ganzjahresumsatz',
      stufe: 'kritisch',
      titel: 'Kein Hallenbadzugang',
      text: 'Ganzjahres- und Hallenprodukte liefern ohne Hallenbadzugang keinen Erloes. Diese Produkte tragen aktuell 0 EUR zum Ergebnis bei, obwohl sie aktiv sind.',
      ankerAbschnitt: 'wasser',
    });
  }

  if (szenario.steuer.uebungsleiterpauschale && szenario.produkte.some((p) => p.aktiv)) {
    warnungen.push({
      code: 'uebungsleiter_unvereinbar',
      stufe: 'kritisch',
      titel: 'Uebungsleiterpauschale unvereinbar mit eigenen Kursprodukten',
      text: '§ 3 Nr. 26 EStG setzt eine Taetigkeit im Dienst einer gemeinnuetzigen Koerperschaft voraus. Auf Kurse auf eigene Rechnung ist die Pauschale nicht anwendbar — auch nicht anteilig.',
      ankerAbschnitt: 'steuer',
    });
  }

  if (szenario.anstellung.kvStatus === 'gkv_freiwillig') {
    const rg = mitUeberschreibungen(
      rechtsgroessenFuer(szenario.simulation.rechtsstand),
      szenario.rechtlicheUeberschreibungen,
    );
    for (const jahr of ergebnis.jahre) {
      if (jahr.anstellung.bruttoGesamt < rg.bbgKvPv) {
        warnungen.push({
          code: 'bbg_unterschritten',
          stufe: 'hinweis',
          titel: 'Bruttoentgelt unter der Beitragsbemessungsgrenze',
          text: `Im Jahr ${jahr.kalenderjahr} schoepft das Arbeitsentgelt die Beitragsbemessungsgrenze nicht mehr aus — bei freiwilliger Versicherung werden Nebeneinkuenfte in Hoehe des Restraums beitragspflichtig.`,
          jahr: jahr.kalenderjahr,
          ankerAbschnitt: 'anstellung',
        });
      }
    }
  }

  for (const jahr of ergebnis.jahre) {
    warnungen.push(...pruefeJahr(szenario, jahr));
  }

  const letztesJahr = ergebnis.jahre[ergebnis.jahre.length - 1];
  if (letztesJahr && letztesJahr.deckungsgrad < 1) {
    warnungen.push({
      code: 'deckungsgrad_unter_100',
      stufe: 'hinweis',
      titel: 'Luecke bleibt am Ende des Horizonts offen',
      text: `Im letzten Jahr des Horizonts (${letztesJahr.kalenderjahr}) deckt das Szenario ${Math.round(letztesJahr.deckungsgrad * 100)} % des Vollzeit-Baseline-Nettos. Die Luecke schliesst sich ueber den betrachteten Zeitraum nicht vollstaendig.`,
      jahr: letztesJahr.kalenderjahr,
      ankerAbschnitt: 'produkte',
    });
  }

  warnungen.push({
    code: 'rechtsgroessen_ungeprueft',
    stufe: 'hinweis',
    titel: 'Rechtsgroessen vor Nutzung pruefen',
    text: 'Die hinterlegten Rechtsgroessen (Rechtsstand 2025) sind Platzhalter mit belastbarer, aber nicht in jedem Fall amtlich verifizierter Quelle. Vor produktiver Nutzung gegen die Primaerquelle pruefen (siehe "Rechtliche Parameter").',
    ankerAbschnitt: 'rechtliche-parameter',
  });

  const reihenfolge: Record<Warnung['code'], number> = {
    kapazitaet_ueberschritten: 0,
    kein_hallenbad_ganzjahresumsatz: 1,
    uebungsleiter_unvereinbar: 2,
    hauptberuflich_selbstaendig: 3,
    ust_schwelle_gerissen: 4,
    bbg_unterschritten: 5,
    jaeg_ueberschritten: 6,
    deckungsgrad_unter_100: 7,
    wochenbelastung_ueber_schwelle: 8,
    klumpenrisiko_produkt: 9,
    rechtsgroessen_ungeprueft: 10,
  };
  return [...warnungen].sort((a, b) => (reihenfolge[a.code] ?? 99) - (reihenfolge[b.code] ?? 99));
}
