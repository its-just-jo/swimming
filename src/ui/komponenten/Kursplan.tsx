/**
 * Kursplan (AP 25, design.md 5): beantwortet "was findet wann statt" und
 * macht sichtbar, warum stumme Produkte 0 EUR liefern — statt es als blosse
 * "0 €" auszuweisen (harte Regel 6). Ersetzt das bisherige
 * Kapazitaetsdiagramm durch einen Balken mit demselben Informationsgehalt
 * auf deutlich weniger Flaeche (design.md 5.3/10).
 */
import { euro, prozent, stunden, zahl } from '../../model/format';
import { verfuegbareWasserstunden } from '../../model/kapazitaet';
import { ermittleAktiveMonate, kalenderVonSimulationsmonat } from '../../model/produkte';
import type { JahresErgebnis, Kursprodukt, ProduktErgebnis, Szenario } from '../../model/typen';

const MONATSBUCHSTABEN = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function springeZuAnker(ankerAbschnitt: string) {
  document.getElementById(ankerAbschnitt)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Anzeige nach design.md 5.2 — der Grund steht statt einer stillen "0 €". */
function stummText(produkt: ProduktErgebnis, konfig: Kursprodukt | undefined, startdatum: string): string {
  switch (produkt.stummGrund) {
    case 'inaktiv':
      return 'deaktiviert';
    case 'vor_startmonat': {
      if (!konfig) return 'startet noch nicht';
      const { kalenderjahr, kalendermonat } = kalenderVonSimulationsmonat(konfig.abMonat, startdatum);
      return `startet ${String(kalendermonat).padStart(2, '0')}/${kalenderjahr}`;
    }
    case 'kein_hallenbad':
      return 'kein Hallenbadzugang';
    case 'ausserhalb_saison':
      if (produkt.saison === 'freibad') return 'nur Freibadsaison';
      if (produkt.saison === 'halle') return 'nur Hallensaison';
      return 'ausserhalb der Saison';
    case null:
      return '';
  }
}

/** Formatiert eine Kurszahl: ganzzahlig, ausser bei unterjaehrigem Start. */
function kurszahl(wert: number): string {
  return zahl(wert, Number.isInteger(wert) ? 0 : 1);
}

function KapazitaetsBalken({
  label,
  benoetigt,
  verfuegbar,
}: {
  readonly label: string;
  readonly benoetigt: number;
  readonly verfuegbar: number;
}) {
  const ueberschritten = benoetigt > verfuegbar;
  const skala = Math.max(benoetigt, verfuegbar, 1);
  const normalBreite = (Math.min(benoetigt, verfuegbar) / skala) * 100;
  const ueberBreite = ueberschritten ? ((benoetigt - verfuegbar) / skala) * 100 : 0;
  const markePosition = (verfuegbar / skala) * 100;

  return (
    <div className="kapazitaetsbalken">
      <div className="kapazitaetsbalken__kopf">
        <span className="kapazitaetsbalken__label">{label}</span>
        <span className="kapazitaetsbalken__zahl zahl">
          {stunden(benoetigt)} von {stunden(verfuegbar)} ({prozent(verfuegbar > 0 ? benoetigt / verfuegbar : 0)})
        </span>
      </div>
      <div className="kapazitaetsbalken__spur">
        <div className="kapazitaetsbalken__fuellung" style={{ width: `${normalBreite}%` }} />
        {ueberschritten && (
          <div className="kapazitaetsbalken__ueber" style={{ left: `${normalBreite}%`, width: `${ueberBreite}%` }} />
        )}
        <div className="kapazitaetsbalken__marke" style={{ left: `${markePosition}%` }} />
      </div>
      {ueberschritten && (
        <p className="kapazitaetsbalken__hinweis">{stunden(benoetigt - verfuegbar)} über Kapazität — nicht durchführbar</p>
      )}
    </div>
  );
}

export function Kursplan({ szenario, jahr }: { readonly szenario: Szenario; readonly jahr: JahresErgebnis }) {
  const { produkte, kapazitaet } = jahr;
  const aktive = produkte.filter((p) => p.stummGrund === null);
  const stumm = produkte.filter((p) => p.stummGrund !== null);
  const kurseGesamt = produkte.reduce((s, p) => s + p.anzahlKurseProJahr, 0);

  const { hallenbadVerfuegbar } = verfuegbareWasserstunden(szenario.wasser, jahr.jahr);
  const produktNachId = new Map(szenario.produkte.map((p) => [p.id, p]));
  const startdatum = szenario.simulation.startdatum;

  return (
    <div className="diagramm-karte kursplan">
      <div className="kursplan__kopf">
        <h3>Kursplan {jahr.kalenderjahr}</h3>
        <p className="kursplan__kennzahlen">
          {zahl(Math.round(kurseGesamt))} Kurse · {stunden(kapazitaet.benoetigtGesamt)} von {stunden(kapazitaet.verfuegbarGesamt)} Wasserzeit (
          {prozent(kapazitaet.auslastungGesamt)}) · {aktive.length} von {produkte.length} Produkten aktiv
        </p>
      </div>

      <div className="kapazitaetsbalken-gruppe">
        <KapazitaetsBalken label="Freibad" benoetigt={kapazitaet.benoetigtFreibad} verfuegbar={kapazitaet.verfuegbarFreibad} />
        <KapazitaetsBalken label="Halle" benoetigt={kapazitaet.benoetigtHalle} verfuegbar={kapazitaet.verfuegbarHalle} />
        {kapazitaet.benoetigtFremd > 0 && (
          <p className="kapazitaetsbalken__fremd">
            + {stunden(kapazitaet.benoetigtFremd)} durch Fremdlehrkraefte — belasten die eigene Kapazitaet nicht.
          </p>
        )}
      </div>

      <div className="kursplan-tabelle-wrapper">
        <table className="kursplan-tabelle">
          <thead>
            <tr>
              <th>Produkt</th>
              <th className="zahl">Kurse</th>
              <th className="zahl">Wasserzeit</th>
              <th className="zahl">DB</th>
              <th className="zahl">DB/h</th>
              {MONATSBUCHSTABEN.map((buchstabe, i) => (
                <th key={i} className="kursplan-tabelle__monat" aria-hidden="true">
                  {buchstabe}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aktive.map((p) => {
              const konfig = produktNachId.get(p.produktId);
              const aktiveMonate = konfig
                ? new Set(
                    ermittleAktiveMonate(
                      konfig,
                      jahr.jahr,
                      startdatum,
                      hallenbadVerfuegbar,
                      szenario.wasser.aktiveWochenFreibad,
                      szenario.wasser.aktiveWochenHalle,
                    ),
                  )
                : new Set<number>();
              return (
                <tr key={p.produktId}>
                  <td>{p.bezeichnung}</td>
                  <td className="zahl">{kurszahl(p.anzahlKurseProJahr)}</td>
                  <td className="zahl">{stunden(p.wasserzeitGesamt)}</td>
                  <td className="zahl">{euro(p.deckungsbeitrag)}</td>
                  <td className="zahl">{euro(p.deckungsbeitragJeWasserstunde)}</td>
                  {MONATSBUCHSTABEN.map((_, i) => (
                    <td key={i} className="kursplan-tabelle__monat">
                      <span
                        className={`saisonzelle${aktiveMonate.has(i + 1) ? ' saisonzelle--aktiv' : ''}`}
                        aria-hidden="true"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}

            {stumm.length > 0 && (
              <tr className="kursplan-tabelle__trenner" aria-hidden="true">
                <td colSpan={5 + MONATSBUCHSTABEN.length} />
              </tr>
            )}

            {stumm.map((p) => (
              <tr key={p.produktId} className="kursplan-tabelle__stumm">
                <td>{p.bezeichnung}</td>
                <td className="zahl">—</td>
                <td className="zahl">—</td>
                <td className="zahl">—</td>
                <td className="zahl">—</td>
                <td colSpan={MONATSBUCHSTABEN.length} className="kursplan-tabelle__grund">
                  {p.stummGrund === 'kein_hallenbad' ? (
                    <button type="button" className="kursplan-tabelle__grund-link" onClick={() => springeZuAnker('wasser')}>
                      kein Hallenbadzugang
                    </button>
                  ) : (
                    stummText(p, produktNachId.get(p.produktId), startdatum)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
