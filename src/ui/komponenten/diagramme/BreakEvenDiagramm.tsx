/**
 * Break-even je Reduktionsstufe: benoetigte Wasserstunden pro Woche, um die
 * Luecke zur Vollzeit-Baseline zu schliessen (breakeven.ts).
 */
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { berechneBreakEven } from '../../../model/breakeven';
import { stunden } from '../../../model/format';
import type { Szenario } from '../../../model/typen';

export function BreakEvenDiagramm({ szenario, jahrIndex }: { readonly szenario: Szenario; readonly jahrIndex: number }) {
  const punkte = useMemo(() => berechneBreakEven(szenario, jahrIndex), [szenario, jahrIndex]);

  const daten = punkte.map((p) => ({
    stufe: `${Math.round(p.beschaeftigungsgrad * 100)} %`,
    stunden: Number.isFinite(p.benoetigteWasserstundenProWoche) ? Math.round(p.benoetigteWasserstundenProWoche * 10) / 10 : 0,
    erreichbar: Number.isFinite(p.benoetigteWasserstundenProWoche),
    imBudget: p.imZeitbudget,
  }));

  return (
    <div className="diagramm-karte">
      <h3>Break-even je Reduktionsstufe</h3>
      <p className="diagramm-karte__hinweis">
        Benoetigte eigene Wasserstunden pro Woche, um die Luecke zur Vollzeit-Baseline zu schliessen —
        nach Einkommensteuer und DRV-Beitrag.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={daten}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--linie)" />
          <XAxis dataKey="stufe" />
          <YAxis tickFormatter={(w: number) => stunden(w)} width={80} />
          <Tooltip formatter={(wert: number) => stunden(wert)} />
          <Bar dataKey="stunden" isAnimationActive={false}>
            {daten.map((d, i) => (
              <Cell key={i} fill={!d.erreichbar ? '#8c2f2f' : d.imBudget ? '#3d5a6c' : '#8a6320'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
