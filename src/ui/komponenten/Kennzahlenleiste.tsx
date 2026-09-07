/**
 * Sechs Kennzahlen (Abschnitt 5), auf dem Handy fixiert (siehe stil.css).
 * Jede Kachel ist per Klick aufklappbar — HerleitungPanel zeigt darunter den
 * vollstaendigen Rechenweg zur zuletzt angeklickten Kennzahl.
 */
import { euro, euroMitVorzeichen, prozent, stunden } from '../../model/format';
import type { JahresErgebnis } from '../../model/typen';
import type { Kennzahl } from '../../model/herleitung';
import type { ZielStatusKurz } from './Zielkarte';

export interface KennzahlKachel {
  readonly kennzahl: Kennzahl;
  readonly titel: string;
  readonly wert: string;
  readonly auffaellig?: 'warnung' | 'grenzwert' | undefined;
}

function dbJeWasserstunde(jahr: JahresErgebnis): number {
  const stundenGesamt = jahr.produkte.reduce((s, p) => s + p.wasserzeitGesamt, 0);
  return stundenGesamt > 0 ? jahr.gewinn.deckungsbeitragSumme / stundenGesamt : 0;
}

function kacheln(jahr: JahresErgebnis): readonly KennzahlKachel[] {
  return [
    { kennzahl: 'gesamtnetto', titel: 'Gesamtnetto', wert: euro(jahr.gesamtnetto) },
    {
      kennzahl: 'differenz_baseline',
      titel: 'Luecke ggü. Baseline',
      wert: euroMitVorzeichen(-jahr.luecke),
      auffaellig: jahr.luecke > 0 ? 'grenzwert' : undefined,
    },
    {
      kennzahl: 'deckungsgrad',
      titel: 'Deckungsgrad',
      wert: prozent(jahr.deckungsgrad),
      auffaellig: jahr.deckungsgrad < 1 ? 'grenzwert' : undefined,
    },
    { kennzahl: 'db_je_wasserstunde', titel: 'DB je Wasserstunde', wert: euro(dbJeWasserstunde(jahr)) },
    {
      kennzahl: 'wochenbelastung',
      titel: 'Wochenbelastung',
      wert: stunden(jahr.zeit.gesamtProWoche),
      auffaellig: jahr.zeit.ueberSchwelle ? 'warnung' : undefined,
    },
    { kennzahl: 'rentendifferenz', titel: 'Rentendifferenz/Monat', wert: euroMitVorzeichen(jahr.rente.rentendifferenzProMonat) },
  ];
}

export function Kennzahlenleiste({
  jahr,
  ausgewaehlt,
  onAuswaehlen,
  zielStatus,
}: {
  readonly jahr: JahresErgebnis;
  readonly ausgewaehlt: Kennzahl | null;
  readonly onAuswaehlen: (k: Kennzahl) => void;
  /** Fuer die auf drei Werte reduzierte Leiste auf dem Handy (design.md 11) — nur dort sichtbar. */
  readonly zielStatus?: ZielStatusKurz | null;
}) {
  return (
    <div className="kennzahlenleiste">
      {kacheln(jahr).map((k) => (
        <button
          key={k.kennzahl}
          type="button"
          data-kennzahl={k.kennzahl}
          className={`kennzahl-kachel ${k.auffaellig ? `kennzahl-kachel--${k.auffaellig}` : ''} ${
            ausgewaehlt === k.kennzahl ? 'kennzahl-kachel--aktiv' : ''
          }`}
          onClick={() => onAuswaehlen(k.kennzahl)}
        >
          <span className="kennzahl-kachel__titel">{k.titel}</span>
          <span className="kennzahl-kachel__wert zahl">{k.wert}</span>
        </button>
      ))}
      {zielStatus && (
        <div className="kennzahl-kachel kennzahl-kachel--zielstatus" aria-hidden="true">
          <span className="kennzahl-kachel__titel">Ziel</span>
          <span className="kennzahl-kachel__wert kennzahl-kachel__wert--status">
            <span className={`status-punkt status-punkt--${zielStatus.klasse}`} />
            {zielStatus.text}
          </span>
        </div>
      )}
    </div>
  );
}
