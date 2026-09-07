/**
 * Tornado-Diagramm (Sensitivitaetsanalyse) — laut Spezifikation die
 * wichtigste Ansicht: "Welche Variable kippt das Modell am schnellsten?".
 * Volles Modell je Auslenkung, keine Naeherung (sensitivitaet.ts).
 */
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { euro } from '../../../model/format';
import { berechneSensitivitaet, type Bezugsgroesse } from '../../../model/sensitivitaet';
import type { Szenario } from '../../../model/typen';
import { TabellenUmschalter } from './TabellenUmschalter';

export function TornadoDiagramm({ szenario }: { readonly szenario: Szenario }) {
  const [bezug, setBezug] = useState<Bezugsgroesse>('letztes_jahr');
  const [tabelle, setTabelle] = useState(false);
  const zeilen = useMemo(() => berechneSensitivitaet(szenario, bezug), [szenario, bezug]);

  const daten = zeilen.map((z) => ({
    label: z.label,
    ausschlag: z.bei_plus20 - z.basiswert,
    ausschlagMinus: z.bei_minus20 - z.basiswert,
    spannweite: z.spannweite,
  }));
  const staerkste = daten[0];

  return (
    <div className="diagramm-karte">
      <div className="diagramm-karte__kopf">
        <h3>{staerkste ? `${staerkste.label} hat den größten Einfluss auf das Ergebnis` : 'Sensitivität (Tornado)'}</h3>
        <div className="diagramm-karte__werkzeuge">
          <select value={bezug} onChange={(e) => setBezug(e.target.value as Bezugsgroesse)}>
            <option value="letztes_jahr">Letztes Jahr</option>
            <option value="summe_horizont">Summe ueber Horizont</option>
          </select>
          <TabellenUmschalter offen={tabelle} onUmschalten={() => setTabelle((t) => !t)} />
        </div>
      </div>
      <p className="diagramm-karte__hinweis">
        ±20 % Auslenkung je Variable, volles Modell neu gerechnet. Sortiert nach Spannweite.
      </p>
      {tabelle ? (
        <div className="diagramm-tabelle-wrapper">
          <table className="diagramm-tabelle">
            <thead>
              <tr>
                <th>Variable</th>
                <th className="zahl">bei −20 %</th>
                <th className="zahl">bei +20 %</th>
                <th className="zahl">Spannweite</th>
              </tr>
            </thead>
            <tbody>
              {daten.map((d) => (
                <tr key={d.label}>
                  <td>{d.label}</td>
                  <td className="zahl">{euro(d.ausschlagMinus)}</td>
                  <td className="zahl">{euro(d.ausschlag)}</td>
                  <td className="zahl">{euro(d.spannweite)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(220, daten.length * 32)}>
          <BarChart data={daten} layout="vertical" margin={{ left: 24, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--linie)" horizontal={false} />
            <XAxis type="number" tickFormatter={(w: number) => euro(w)} />
            <YAxis type="category" dataKey="label" width={190} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(wert: number) => euro(wert)} />
            <ReferenceLine x={0} stroke="var(--divergierend-mitte)" strokeWidth={2} />
            <Bar dataKey="ausschlagMinus" stackId="tornado" isAnimationActive={false}>
              {daten.map((d, i) => (
                <Cell key={i} fill={d.ausschlagMinus < 0 ? 'var(--divergierend-negativ)' : 'var(--divergierend-positiv)'} />
              ))}
            </Bar>
            <Bar dataKey="ausschlag" stackId="tornado" isAnimationActive={false}>
              {daten.map((d, i) => (
                <Cell key={i} fill={d.ausschlag >= 0 ? 'var(--divergierend-positiv)' : 'var(--divergierend-negativ)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
