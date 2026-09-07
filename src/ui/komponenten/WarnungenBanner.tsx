/**
 * Warnungen gebuendelt darstellen (AP 24, design.md 6): aus vielen
 * jahresbezogenen Karten wird je Code eine Karte mit verdichteter
 * Jahresangabe. Stufe traegt links ein 3-px-Streifen und ein Symbol vor dem
 * Titel — nie Farbe allein (harte Regel 9). Der Fliesstext bleibt in
 * Textfarbe, nur die Ueberschrift darf die Stufenfarbe tragen (design.md
 * 6.2) — durchgehend eingefaerbte Absaetze sind schlechter lesbar und nutzen
 * sich als Signal ab. `rechtsgroessen_ungeprueft` ist ein Dauerhinweis und
 * gehoert nicht hierher, sondern in den Fussbereich (design.md 6.3, App.tsx).
 */
import { useState } from 'react';
import { buendleWarnungen } from '../../model/warnungen';
import type { GebuendelteWarnung, Warnung, WarnStufe } from '../../model/typen';

const STUFEN_SYMBOL: Record<WarnStufe, string> = { kritisch: '⛔', grenzwert: '⚠', hinweis: 'ℹ' };

function springeZuAnker(ankerAbschnitt: string | undefined) {
  if (!ankerAbschnitt) return;
  const ziel = document.getElementById(ankerAbschnitt);
  ziel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function WarnungsKarte({ warnung }: { readonly warnung: GebuendelteWarnung }) {
  const [jahreOffen, setJahreOffen] = useState(false);

  return (
    <div className={`warnung warnung--${warnung.stufe}`}>
      <div className="warnung__kopf">
        <strong className="warnung__titel">
          <span aria-hidden="true">{STUFEN_SYMBOL[warnung.stufe]}</span> {warnung.titel}
        </strong>
        {warnung.jahresLabel && <span className="warnung__jahr">{warnung.jahresLabel}</span>}
      </div>
      <p>{warnung.text}</p>
      <div className="warnung__aktionen">
        {warnung.ankerAbschnitt && (
          <button type="button" className="knopf knopf--klein" onClick={() => springeZuAnker(warnung.ankerAbschnitt)}>
            Zum Feld
          </button>
        )}
        {warnung.details.length > 0 && (
          <button type="button" className="knopf knopf--klein" onClick={() => setJahreOffen((o) => !o)} aria-expanded={jahreOffen}>
            Jahre {jahreOffen ? '▴' : '▾'}
          </button>
        )}
      </div>
      {jahreOffen && (
        <ul className="warnung__jahresliste">
          {warnung.details.map((d) => (
            <li key={d.jahr}>
              <span className="zahl">{d.jahr}</span> {d.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WarnungenBanner({ warnungen }: { readonly warnungen: readonly Warnung[] }) {
  const gebuendelt = buendleWarnungen(warnungen.filter((w) => w.code !== 'rechtsgroessen_ungeprueft'));
  if (gebuendelt.length === 0) return null;

  return (
    <div className="warnungen-liste" role="region" aria-label="Warnungen">
      {gebuendelt.map((w) => (
        <WarnungsKarte key={w.code} warnung={w} />
      ))}
    </div>
  );
}
