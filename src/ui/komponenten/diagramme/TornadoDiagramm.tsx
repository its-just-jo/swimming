/**
 * Tornado-Diagramm (Sensitivitaetsanalyse) — laut Spezifikation die
 * wichtigste Ansicht: "Welche Variable kippt das Modell am schnellsten?".
 * Volles Modell je Auslenkung, keine Naeherung (sensitivitaet.ts).
 */
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { euro } from '../../../model/format';
import { berechneSensitivitaet, type Bezugsgroesse } from '../../../model/sensitivitaet';
import type { Szenario } from '../../../model/typen';

const FARBE_NEGATIV = '#8a6320';
const FARBE_POSITIV = '#3d5a6c';

export function TornadoDiagramm({ szenario }: { readonly szenario: Szenario }) {
  const [bezug, setBezug] = useState<Bezugsgroesse>('letztes_jahr');
  const zeilen = useMemo(() => berechneSensitivitaet(szenario, bezug), [szenario, bezug]);

  const daten = zeilen.map((z) => ({
    label: z.label,
    ausschlag: z.bei_plus20 - z.basiswert,
    ausschlagMinus: z.bei_minus20 - z.basiswert,
    spannweite: z.spannweite,
  }));

  return (
    <div className="diagramm-karte">
      <div className="diagramm-karte__kopf">
        <h3>Sensitivitaet (Tornado)</h3>
        <select value={bezug} onChange={(e) => setBezug(e.target.value as Bezugsgroesse)}>
          <option value="letztes_jahr">Letztes Jahr</option>
          <option value="summe_horizont">Summe ueber Horizont</option>
        </select>
      </div>
      <p className="diagramm-karte__hinweis">
        ±20 % Auslenkung je Variable, volles Modell neu gerechnet. Sortiert nach Spannweite.
      </p>
      <ResponsiveContainer width="100%" height={Math.max(220, daten.length * 32)}>
        <BarChart data={daten} layout="vertical" margin={{ left: 24, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--linie)" />
          <XAxis type="number" tickFormatter={(w: number) => euro(w)} />
          <YAxis type="category" dataKey="label" width={190} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(wert: number) => euro(wert)} />
          <Bar dataKey="ausschlagMinus" stackId="tornado" isAnimationActive={false}>
            {daten.map((d, i) => (
              <Cell key={i} fill={d.ausschlagMinus < 0 ? FARBE_NEGATIV : FARBE_POSITIV} />
            ))}
          </Bar>
          <Bar dataKey="ausschlag" stackId="tornado" isAnimationActive={false}>
            {daten.map((d, i) => (
              <Cell key={i} fill={d.ausschlag >= 0 ? FARBE_POSITIV : FARBE_NEGATIV} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
