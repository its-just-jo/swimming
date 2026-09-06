/**
 * Monatlicher Cashflow eines Musterjahres plus kumulierter Verlauf.
 * Stufe C der zweistufigen Zeitachse: die Jahresabgaben sind gleichmaessig
 * auf die Monate zurueckgetragen (Abgrenzung, nicht Zahlungstermin) — das
 * weisen wir hier explizit aus (ARCHITEKTUR.md 2.2).
 */
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { euro } from '../../../model/format';
import type { JahresErgebnis, MonatsErgebnis } from '../../../model/typen';

const MONATSNAMEN = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export function CashflowDiagramm({ monate, jahr }: { readonly monate: readonly MonatsErgebnis[]; readonly jahr: JahresErgebnis }) {
  const daten = monate.map((m) => ({
    monat: MONATSNAMEN[m.kalendermonat - 1] ?? String(m.kalendermonat),
    cashflow: Math.round(m.cashflow),
    kumuliert: Math.round(m.kumuliert),
    abgaben: -Math.round(m.steuernUndAbgaben),
  }));

  return (
    <div className="diagramm-karte">
      <h3>Monatlicher Cashflow — Jahr {jahr.kalenderjahr}</h3>
      <p className="diagramm-karte__hinweis">
        Steuern, Gewerbesteuer und DRV-Beitrag sind als Abgrenzung gleichmaessig auf die zwoelf Monate
        verteilt (Balken "Abgaben"), nicht auf den tatsaechlichen Zahlungstermin.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={daten}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--linie)" />
          <XAxis dataKey="monat" />
          <YAxis tickFormatter={(w: number) => euro(w)} width={90} />
          <Tooltip formatter={(wert: number) => euro(wert)} />
          <Legend />
          <Bar dataKey="cashflow" name="Cashflow" fill="#3d5a6c" isAnimationActive={false} />
          <Bar dataKey="abgaben" name="davon Abgaben" fill="#8a6320" isAnimationActive={false} />
          <Line type="monotone" dataKey="kumuliert" name="Kumuliert" stroke="#1c1b19" strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
