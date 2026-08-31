/**
 * Vollstaendiger Rechenweg zu einer Kennzahl (AP 14). Reine Anzeige des
 * Herleitungsobjekts aus src/model/herleitung.ts — keine eigene Berechnung.
 */
import { herleite, type Kennzahl } from '../../model/herleitung';
import type { JahresErgebnis, Szenario } from '../../model/typen';

export function HerleitungPanel({
  kennzahl,
  szenario,
  jahr,
  onSchliessen,
}: {
  readonly kennzahl: Kennzahl;
  readonly szenario: Szenario;
  readonly jahr: JahresErgebnis;
  readonly onSchliessen: () => void;
}) {
  const herleitung = herleite(kennzahl, szenario, jahr);

  return (
    <div className="herleitung-panel" role="region" aria-label={`Herleitung ${herleitung.kennzahl}`}>
      <header className="herleitung-panel__kopf">
        <h3>{herleitung.kennzahl}</h3>
        <button type="button" className="knopf knopf--klein" onClick={onSchliessen}>
          Schliessen
        </button>
      </header>
      <table className="herleitung-tabelle">
        <thead>
          <tr>
            <th>Schritt</th>
            <th>Formel</th>
            <th>Werte</th>
            <th>Ergebnis</th>
          </tr>
        </thead>
        <tbody>
          {herleitung.schritte.map((s, i) => (
            <tr key={i}>
              <td>{s.bezeichnung}</td>
              <td className="herleitung-tabelle__formel">{s.formel}</td>
              <td className="zahl">{s.werte}</td>
              <td className="zahl herleitung-tabelle__ergebnis">
                {s.ergebnis}
                {s.quelle && <span className="herleitung-tabelle__quelle"> ({s.quelle})</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="herleitung-annahmen">
        {herleitung.annahmen.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
    </div>
  );
}
