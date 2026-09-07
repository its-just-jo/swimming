/**
 * Break-even je Reduktionsstufe: benoetigte Wasserstunden pro Woche, um die
 * Luecke zur Vollzeit-Baseline zu schliessen (breakeven.ts).
 */
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { berechneBreakEven } from '../../../model/breakeven';
import { stunden } from '../../../model/format';
import type { Szenario } from '../../../model/typen';
import { TabellenUmschalter } from './TabellenUmschalter';

export function BreakEvenDiagramm({ szenario, jahrIndex }: { readonly szenario: Szenario; readonly jahrIndex: number }) {
  const [tabelle, setTabelle] = useState(false);
  const punkte = useMemo(() => berechneBreakEven(szenario, jahrIndex), [szenario, jahrIndex]);

  const daten = punkte.map((p) => ({
    stufe: `${Math.round(p.beschaeftigungsgrad * 100)} %`,
    stunden: Number.isFinite(p.benoetigteWasserstundenProWoche) ? Math.round(p.benoetigteWasserstundenProWoche * 10) / 10 : 0,
    erreichbar: Number.isFinite(p.benoetigteWasserstundenProWoche),
    imBudget: p.imZeitbudget,
  }));

  const ersteUnerreichbar = daten.find((d) => !d.erreichbar);
  const ersteAusserBudget = daten.find((d) => d.erreichbar && !d.imBudget);
  const aussage = ersteUnerreichbar
    ? `Ab ${ersteUnerreichbar.stufe} nicht mehr erreichbar`
    : ersteAusserBudget
      ? `Ab ${ersteAusserBudget.stufe} außerhalb des Zeitbudgets`
      : 'Alle Reduktionsstufen liegen im Zeitbudget';

  return (
    <div className="diagramm-karte">
      <div className="diagramm-karte__kopf">
        <h3>{aussage}</h3>
        <TabellenUmschalter offen={tabelle} onUmschalten={() => setTabelle((t) => !t)} />
      </div>
      <p className="diagramm-karte__hinweis">
        Benoetigte eigene Wasserstunden pro Woche, um die Luecke zur Vollzeit-Baseline zu schliessen —
        nach Einkommensteuer und DRV-Beitrag.
      </p>
      {tabelle ? (
        <div className="diagramm-tabelle-wrapper">
          <table className="diagramm-tabelle">
            <thead>
              <tr>
                <th>Stufe</th>
                <th className="zahl">Benoetigte Wasserstunden/Woche</th>
              </tr>
            </thead>
            <tbody>
              {daten.map((d) => (
                <tr key={d.stufe}>
                  <td>{d.stufe}</td>
                  <td className="zahl">{d.erreichbar ? stunden(d.stunden) : 'nicht erreichbar'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={daten}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--linie)" vertical={false} />
            <XAxis dataKey="stufe" />
            <YAxis tickFormatter={(w: number) => stunden(w)} width={80} />
            <Tooltip formatter={(wert: number) => stunden(wert)} />
            <Bar dataKey="stunden" isAnimationActive={false}>
              {daten.map((d, i) => (
                <Cell key={i} fill={!d.erreichbar ? 'var(--kritisch-flaeche)' : d.imBudget ? 'var(--serie-1)' : 'var(--grenzwert-flaeche)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
