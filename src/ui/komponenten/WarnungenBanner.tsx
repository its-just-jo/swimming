/**
 * Warnungen auffaellig darstellen, nicht dezent (AP 16): kritisch in
 * gedecktem Rot, Grenzwerte in Bernstein, mit Sprung zum ausloesenden Feld.
 */
import type { Warnung } from '../../model/typen';

function springeZuAnker(ankerAbschnitt: string | undefined) {
  if (!ankerAbschnitt) return;
  const ziel = document.getElementById(ankerAbschnitt);
  ziel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function WarnungenBanner({ warnungen }: { readonly warnungen: readonly Warnung[] }) {
  if (warnungen.length === 0) return null;

  return (
    <div className="warnungen-liste" role="region" aria-label="Warnungen">
      {warnungen.map((w, i) => (
        <div key={`${w.code}-${w.jahr ?? 'global'}-${i}`} className={`warnung warnung--${w.stufe}`}>
          <div className="warnung__kopf">
            <strong>{w.titel}</strong>
            {w.jahr && <span className="warnung__jahr">{w.jahr}</span>}
          </div>
          <p>{w.text}</p>
          {w.ankerAbschnitt && (
            <button type="button" className="knopf knopf--klein" onClick={() => springeZuAnker(w.ankerAbschnitt)}>
              Zum Eingabefeld
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
