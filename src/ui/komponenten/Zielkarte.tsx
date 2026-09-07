/**
 * Zielkarte (AP 26, design.md 4.4/4.5): oberstes Element, ersetzt die
 * bislang nackte Kennzahlenleiste als alleinstehenden Einstieg — sie steht
 * jetzt direkt darunter, als zweite Zeile derselben Ebene 1 (design.md 3).
 *
 * Vier Zielarten teilen sich denselben Ablauf: Eingabe waehlen, `loeseZiel`
 * liefert ein oder — bei Z3 (Nettoziel), je Reduktionsstufe — mehrere
 * Ergebnisse, die Statuszeile meldet Punkt und Text (nie Farbe allein,
 * harte Regel 9), "Vorschlag ansehen" oeffnet die Vorher-Nachher-Tabelle.
 * Nichts davon schreibt ins Szenario, bis "Uebernehmen" geklickt wird —
 * eine einzige Reducer-Aktion, ein Strg+Z macht sie vollstaendig rueckgaengig
 * (design.md 4.5, harte Regel 8).
 */
import { useEffect, useMemo, useState, type Dispatch } from 'react';
import { euro, stunden, zahl } from '../../model/format';
import { MODELL_KONSTANTEN } from '../../model/konstanten';
import { berechneJahr } from '../../model/simulation';
import type { Id, Szenario, Zielart, ZielEingabe, ZielErgebnis, ZielStatus, ZielZyklenAenderung } from '../../model/typen';
import { loeseZiel, wendeVorschlagAn } from '../../model/ziel';
import type { Aktion } from '../../state/szenarioReducer';
import { Hilfe } from './Hilfe';

const ZIELARTEN: readonly { readonly art: Zielart; readonly label: string }[] = [
  { art: 'reduktion', label: 'Reduktion' },
  { art: 'zeitpunkt', label: 'Zeitpunkt' },
  { art: 'nettoziel', label: 'Nettoziel' },
  { art: 'zeitbudget', label: 'Zeitbudget' },
];

const STUFEN = MODELL_KONSTANTEN.reduktionsstufen;

const STATUS_KLASSE: Record<ZielStatus, string> = {
  erreicht: 'erreicht',
  knapp: 'grenzwert',
  unerreichbar: 'kritisch',
  kein_ziel: 'neutral',
};

/** Kurzform des Status fuer die reduzierte Drei-Kachel-Leiste auf dem Handy (design.md 11). */
const STATUS_KURZ: Record<ZielStatus, string> = {
  erreicht: 'Trägt',
  knapp: 'Knapp',
  unerreichbar: 'Trägt nicht',
  kein_ziel: 'Kein Ziel',
};

export interface ZielStatusKurz {
  readonly klasse: string;
  readonly text: string;
}

const BESCHRAENKUNGS_TEXT: Record<'kapazitaet' | 'wochenbelastung' | 'zeithorizont', string> = {
  kapazitaet: 'die Kapazität',
  wochenbelastung: 'das Zeitbudget',
  zeithorizont: 'der Zeithorizont',
};

function statusText(ergebnis: ZielErgebnis | null): string {
  if (!ergebnis) return 'Ziel wählen, um einen Vorschlag zu erhalten.';
  if (ergebnis.status === 'erreicht') {
    return `Trägt ab Januar ${ergebnis.kalenderjahr}.`;
  }
  if (ergebnis.status === 'knapp') {
    return `Trägt ab Januar ${ergebnis.kalenderjahr} — nur knapp innerhalb der Leitplanken.`;
  }
  // unerreichbar
  const beschraenkung = ergebnis.bindendeBeschraenkung ? BESCHRAENKUNGS_TEXT[ergebnis.bindendeBeschraenkung] : null;
  const basis = beschraenkung ? `Trägt im Horizont nicht. Bindend ist ${beschraenkung}.` : 'Trägt im Horizont nicht.';
  if (!ergebnis.staerksterHebel || ergebnis.staerksterHebel.wirkung === 0) return basis;
  const hebel = ergebnis.staerksterHebel;
  const richtung = hebel.wirkung > 0 ? 'weniger' : 'mehr';
  return `${basis} Stärkster Hebel: ${hebel.label} — 20 % ${richtung} schließen ${euro(Math.abs(hebel.wirkung))} der Lücke.`;
}

function VorschlagZeile({
  aenderung,
  abgewaehlt,
  onUmschalten,
}: {
  readonly aenderung: ZielZyklenAenderung;
  readonly abgewaehlt: boolean;
  readonly onUmschalten: () => void;
}) {
  const delta = aenderung.zyklenNachher - aenderung.zyklenVorher;
  return (
    <tr>
      <td>{aenderung.bezeichnung}</td>
      <td className="zahl">{zahl(aenderung.zyklenVorher)} Zyklen</td>
      <td className="zahl">{zahl(aenderung.zyklenNachher)} Zyklen</td>
      <td className="zahl">{delta === 0 ? '—' : delta > 0 ? `+${zahl(delta)}` : zahl(delta)}</td>
      <td>
        {!aenderung.veraenderbar ? (
          <span className="vorschlagpanel__fest">(fest)</span>
        ) : delta === 0 ? (
          <span className="vorschlagpanel__fest">—</span>
        ) : (
          <label className="vorschlagpanel__uebernehmen">
            <input type="checkbox" checked={abgewaehlt} onChange={onUmschalten} /> übernehmen
          </label>
        )}
      </td>
    </tr>
  );
}

export function Zielkarte({
  szenario,
  jahrIndex,
  dispatch,
  onStatusAendern,
}: {
  readonly szenario: Szenario;
  readonly jahrIndex: number;
  readonly dispatch: Dispatch<Aktion>;
  /** Fuer die reduzierte Kennzahlenleiste auf dem Handy (design.md 11). */
  readonly onStatusAendern?: (status: ZielStatusKurz | null) => void;
}) {
  const [zielArt, setZielArt] = useState<Zielart | null>(null);
  const [zielBeschaeftigungsgrad, setZielBeschaeftigungsgrad] = useState(0.8);
  const [zielJahrIndex, setZielJahrIndex] = useState(szenario.simulation.horizontJahre - 1);
  const [zielNetto, setZielNetto] = useState(40_000);
  const [maxWochenstunden, setMaxWochenstunden] = useState(szenario.leitplanken.wochenbelastungMax);
  const [stufenIndex, setStufenIndex] = useState(0);
  const [vorschlagOffen, setVorschlagOffen] = useState(false);
  const [abgewaehlt, setAbgewaehlt] = useState<ReadonlySet<Id>>(new Set());

  const ziel: ZielEingabe | null = useMemo(() => {
    if (!zielArt) return null;
    switch (zielArt) {
      case 'reduktion':
        return { art: 'reduktion', zielBeschaeftigungsgrad };
      case 'zeitpunkt':
        return { art: 'zeitpunkt', zielJahrIndex };
      case 'nettoziel':
        return { art: 'nettoziel', zielNetto };
      case 'zeitbudget':
        return { art: 'zeitbudget', maxWochenstunden };
    }
  }, [zielArt, zielBeschaeftigungsgrad, zielJahrIndex, zielNetto, maxWochenstunden]);

  const ergebnisse = useMemo(() => {
    if (!ziel) return [];
    return loeseZiel(szenario, ziel, jahrIndex);
  }, [szenario, ziel, jahrIndex]);

  const ergebnisIndex = zielArt === 'nettoziel' ? Math.min(stufenIndex, ergebnisse.length - 1) : 0;
  const ergebnis = ergebnisse[ergebnisIndex] ?? null;

  const vorschauSzenario = useMemo(() => {
    if (!ergebnis || ergebnis.jahrIndex === null) return null;
    return wendeVorschlagAn(szenario, ergebnis.zyklenAenderungen, ergebnis.beschaeftigungsgrad, abgewaehlt);
  }, [szenario, ergebnis, abgewaehlt]);

  const vorschauJahr = useMemo(() => {
    if (!vorschauSzenario || !ergebnis || ergebnis.jahrIndex === null) return null;
    return berechneJahr(vorschauSzenario, ergebnis.jahrIndex);
  }, [vorschauSzenario, ergebnis]);

  function waehleZielArt(art: Zielart) {
    setZielArt(art);
    setVorschlagOffen(false);
    setAbgewaehlt(new Set());
    setStufenIndex(0);
  }

  function oeffneVorschlag() {
    if (!ergebnis) return;
    const veraenderte = ergebnis.zyklenAenderungen.filter((a) => a.veraenderbar && a.zyklenNachher !== a.zyklenVorher);
    setAbgewaehlt(new Set(veraenderte.map((a) => a.produktId)));
    setVorschlagOffen(true);
  }

  function umschalten(produktId: Id) {
    setAbgewaehlt((bisher) => {
      const naechste = new Set(bisher);
      if (naechste.has(produktId)) naechste.delete(produktId);
      else naechste.add(produktId);
      return naechste;
    });
  }

  function uebernehmen() {
    if (!ergebnis) return;
    const neuesSzenario = wendeVorschlagAn(szenario, ergebnis.zyklenAenderungen, ergebnis.beschaeftigungsgrad, abgewaehlt);
    dispatch({ typ: 'vorschlag_uebernehmen', szenario: neuesSzenario });
    setVorschlagOffen(false);
  }

  const statusKlasse = ergebnis ? STATUS_KLASSE[ergebnis.status] : STATUS_KLASSE.kein_ziel;
  const veraenderbareZeilen = ergebnis?.zyklenAenderungen.filter((a) => a.veraenderbar && a.zyklenNachher !== a.zyklenVorher) ?? [];

  useEffect(() => {
    onStatusAendern?.({ klasse: statusKlasse, text: STATUS_KURZ[ergebnis?.status ?? 'kein_ziel'] });
    return () => onStatusAendern?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusKlasse, ergebnis?.status]);

  return (
    <div className="zielkarte">
      <div className="zielkarte__kopf">
        <span className="zielkarte__label">
          Ziel
          <Hilfe
            label="Ziel"
            text="Waehlt eine Zielart und rechnet rueckwaerts, welche Kursmenge sie erreicht — statt einzelne Werte zu tuefteln. Der Solver schlaegt vor, schreibt aber nichts ins Szenario, bis Uebernehmen geklickt wird."
          />
        </span>
        <div className="segmentsteuerung" role="group" aria-label="Zielart">
          {ZIELARTEN.map((z) => (
            <button
              key={z.art}
              type="button"
              className={`knopf knopf--klein ${zielArt === z.art ? 'knopf--aktiv' : ''}`}
              onClick={() => waehleZielArt(z.art)}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      {zielArt === 'reduktion' && (
        <div className="zielkarte__eingabe">
          <span className="feld__label">Beschäftigungsgrad</span>
          <div className="segmentsteuerung">
            {STUFEN.map((stufe) => (
              <button
                key={stufe}
                type="button"
                className={`knopf knopf--klein ${zielBeschaeftigungsgrad === stufe ? 'knopf--aktiv' : ''}`}
                onClick={() => setZielBeschaeftigungsgrad(stufe)}
              >
                {Math.round(stufe * 100)} %
              </button>
            ))}
          </div>
        </div>
      )}

      {zielArt === 'zeitpunkt' && (
        <div className="zielkarte__eingabe">
          <span className="feld__label">Zieljahr</span>
          <select
            value={zielJahrIndex}
            onChange={(e) => setZielJahrIndex(Number(e.target.value))}
          >
            {Array.from({ length: szenario.simulation.horizontJahre }, (_, i) => i).map((i) => (
              <option key={i} value={i}>
                {new Date(szenario.simulation.startdatum).getUTCFullYear() + i}
              </option>
            ))}
          </select>
        </div>
      )}

      {zielArt === 'nettoziel' && (
        <div className="zielkarte__eingabe">
          <span className="feld__label">Mindest-Nettobetrag</span>
          <input
            type="text"
            inputMode="decimal"
            className="zahl"
            value={zielNetto}
            onChange={(e) => {
              const wert = Number(e.target.value.replace(/\./g, '').replace(',', '.'));
              if (Number.isFinite(wert)) setZielNetto(wert);
            }}
          />
          <span className="feld__einheit">€/Jahr</span>
        </div>
      )}

      {zielArt === 'zeitbudget' && (
        <div className="zielkarte__eingabe">
          <span className="feld__label">Maximale Wochenbelastung</span>
          <input
            type="text"
            inputMode="decimal"
            className="zahl"
            value={maxWochenstunden}
            onChange={(e) => {
              const wert = Number(e.target.value.replace(/\./g, '').replace(',', '.'));
              if (Number.isFinite(wert)) setMaxWochenstunden(wert);
            }}
          />
          <span className="feld__einheit">h/Woche</span>
        </div>
      )}

      {zielArt === 'nettoziel' && ergebnisse.length > 0 && (
        <div className="zielkarte__stufen">
          {ergebnisse.map((e, i) => (
            <button
              key={e.beschaeftigungsgrad}
              type="button"
              className={`knopf knopf--klein ${i === ergebnisIndex ? 'knopf--aktiv' : ''}`}
              onClick={() => setStufenIndex(i)}
            >
              <span className={`status-punkt status-punkt--${STATUS_KLASSE[e.status]}`} aria-hidden="true" />
              {Math.round(e.beschaeftigungsgrad * 100)} %
            </button>
          ))}
        </div>
      )}

      <div className="zielkarte__status">
        <p className={`zielkarte__statuszeile zielkarte__statuszeile--${statusKlasse}`} aria-live="polite">
          <span className={`status-punkt status-punkt--${statusKlasse}`} aria-hidden="true" />
          {statusText(ergebnis)}
        </p>
        {ergebnis && ergebnis.jahrIndex !== null && (
          <p className="zielkarte__unterzeile">
            {zahl(Math.round(ergebnis.benoetigteKurseProJahr))} Kurse im Jahr · {stunden(ergebnis.benoetigteWasserzeitProJahr)}{' '}
            Wasserzeit · {stunden(ergebnis.wochenbelastung)}/Woche
          </p>
        )}
        {ergebnis && (
          <button type="button" className="knopf knopf--klein zielkarte__vorschlag-knopf" onClick={oeffneVorschlag}>
            Vorschlag ansehen
          </button>
        )}
      </div>

      {vorschlagOffen && ergebnis && (
        <div className="vorschlagpanel">
          <div className="vorschlagpanel__tabelle-wrapper">
            <table className="vorschlagpanel__tabelle">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th className="zahl">heute</th>
                  <th className="zahl">Vorschlag</th>
                  <th className="zahl">Δ</th>
                  <th>Übernehmen</th>
                </tr>
              </thead>
              <tbody>
                {ergebnis.zyklenAenderungen.map((a) => (
                  <VorschlagZeile
                    key={a.produktId}
                    aenderung={a}
                    abgewaehlt={abgewaehlt.has(a.produktId)}
                    onUmschalten={() => umschalten(a.produktId)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {vorschauJahr && (
            <p className="vorschlagpanel__vorschau">
              Vorschau bei aktueller Auswahl: Gesamtnetto {euro(vorschauJahr.gesamtnetto)}, Lücke{' '}
              {vorschauJahr.luecke <= 0 ? 'geschlossen' : `${euro(vorschauJahr.luecke)} offen`}.
            </p>
          )}

          <div className="vorschlagpanel__aktionen">
            <button type="button" className="knopf" onClick={uebernehmen} disabled={veraenderbareZeilen.length === 0 || abgewaehlt.size === 0}>
              Übernehmen
            </button>
            <button type="button" className="knopf knopf--klein" onClick={() => setVorschlagOffen(false)}>
              Schliessen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
