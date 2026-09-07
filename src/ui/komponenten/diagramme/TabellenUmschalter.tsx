/**
 * Umschalter "als Tabelle" (design.md 10, Auflage 4) — jedes Diagramm bietet
 * eine gleichwertige Tabellenansicht. Erfuellt zugleich die Auflage aus 9.3
 * (Serie 3 erreicht auf Weiss nur 2,8:1 — Tabellenansicht macht das exakt lesbar).
 */
export function TabellenUmschalter({ offen, onUmschalten }: { readonly offen: boolean; readonly onUmschalten: () => void }) {
  return (
    <button type="button" className="knopf knopf--klein" onClick={onUmschalten} aria-pressed={offen}>
      {offen ? 'als Diagramm' : 'als Tabelle'}
    </button>
  );
}
