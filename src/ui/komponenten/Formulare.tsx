/**
 * Generische Formular-Bausteine: ein Satz Skalarfelder gebunden an einen
 * Objektpfad, sowie eine wiederholbare Liste (Produkte, Fixkosten,
 * Investitionen) mit Hinzufuegen/Entfernen. Keine Rechenlogik — nur Bindung
 * der Feldkonfiguration an den Reducer-Pfad.
 *
 * Feldsichtbarkeit (design.md 7): ein Feld, das ein anderer Schalter
 * strukturell wirkungslos macht, wird standardmaessig ausgeblendet — nicht
 * geloescht, der Wert bleibt erhalten. Am Fuss jeder Feldgruppe zeigt ein
 * Umschalter die Anzahl und blendet sie bei Bedarf gedaempft wieder ein.
 */
import type { Dispatch } from 'react';
import type { Szenario } from '../../model/typen';
import type { Aktion } from '../../state/szenarioReducer';
import type { Feldkonfiguration } from '../feldKonfiguration';
import { Feld } from './Feld';

function alsRecord(wert: unknown): Record<string, unknown> {
  return wert as unknown as Record<string, unknown>;
}

function sichtbarkeitAufteilen(
  felder: readonly Feldkonfiguration[],
  szenario: Szenario,
  zeile: Record<string, unknown>,
): { readonly sichtbar: readonly Feldkonfiguration[]; readonly ausgeblendet: readonly Feldkonfiguration[] } {
  const sichtbar: Feldkonfiguration[] = [];
  const ausgeblendet: Feldkonfiguration[] = [];
  for (const f of felder) {
    (!f.sichtbarWenn || f.sichtbarWenn(szenario, zeile) ? sichtbar : ausgeblendet).push(f);
  }
  return { sichtbar, ausgeblendet };
}

export function UmschalterZeile({
  anzahl,
  eingeblendet,
  onUmschalten,
}: {
  readonly anzahl: number;
  readonly eingeblendet: boolean;
  readonly onUmschalten: () => void;
}) {
  if (anzahl === 0) return null;
  return (
    <p className="abschnitt__hinweis">
      {anzahl} Feld{anzahl === 1 ? '' : 'er'} ohne Wirkung {eingeblendet ? 'eingeblendet' : 'ausgeblendet'}
      <button type="button" className="knopf knopf--klein" onClick={onUmschalten}>
        {eingeblendet ? 'ausblenden' : 'einblenden'}
      </button>
    </p>
  );
}

export interface SkalarFelderProps {
  readonly basisPfad: string;
  readonly objekt: unknown;
  readonly felder: readonly Feldkonfiguration[];
  readonly dispatch: Dispatch<Aktion>;
  readonly szenario: Szenario;
  readonly eingeblendet: boolean;
  readonly onEinblenden: () => void;
}

export function SkalarFelder({ basisPfad, objekt, felder, dispatch, szenario, eingeblendet, onEinblenden }: SkalarFelderProps) {
  const daten = alsRecord(objekt);
  const { sichtbar, ausgeblendet } = sichtbarkeitAufteilen(felder, szenario, daten);
  const anzuzeigen = eingeblendet ? felder : sichtbar;
  return (
    <div className="feld-raster">
      {anzuzeigen.map((f) => (
        <Feld
          key={f.schluessel}
          konfig={f}
          wert={daten[f.schluessel]}
          onAendern={(wert) => dispatch({ typ: 'setze', pfad: `${basisPfad}.${f.schluessel}`, wert })}
          gedaempft={eingeblendet && ausgeblendet.includes(f)}
        />
      ))}
      <UmschalterZeile anzahl={ausgeblendet.length} eingeblendet={eingeblendet} onUmschalten={onEinblenden} />
    </div>
  );
}

export interface ArrayFelderProps {
  readonly basisPfad: string;
  readonly items: readonly { readonly id: string }[];
  readonly felder: readonly Feldkonfiguration[];
  readonly dispatch: Dispatch<Aktion>;
  readonly onLoeschen: (id: string) => void;
  readonly onHinzufuegen: () => void;
  readonly beschriftung: (item: unknown, index: number) => string;
  readonly hinzufuegenBeschriftung: string;
  readonly leerHinweis: string;
  readonly szenario: Szenario;
  readonly eingeblendet: boolean;
  readonly onEinblenden: () => void;
}

export function ArrayFelder({
  basisPfad,
  items,
  felder,
  dispatch,
  onLoeschen,
  onHinzufuegen,
  beschriftung,
  hinzufuegenBeschriftung,
  leerHinweis,
  szenario,
  eingeblendet,
  onEinblenden,
}: ArrayFelderProps) {
  const zeilen = items.map((item, index) => {
    const daten = alsRecord(item);
    return { item, index, daten, ...sichtbarkeitAufteilen(felder, szenario, daten) };
  });
  const ausgeblendetGesamt = zeilen.reduce((summe, z) => summe + z.ausgeblendet.length, 0);

  return (
    <div className="array-liste">
      {items.length === 0 && <p className="array-liste__leer">{leerHinweis}</p>}
      {zeilen.map(({ item, index, daten, sichtbar, ausgeblendet }) => (
        <div className="array-eintrag" key={item.id}>
          <div className="array-eintrag__kopf">
            <strong>{beschriftung(item, index)}</strong>
            <button type="button" className="knopf knopf--klein knopf--gefahr" onClick={() => onLoeschen(item.id)}>
              Entfernen
            </button>
          </div>
          <div className="feld-raster">
            {(eingeblendet ? felder : sichtbar).map((f) => (
              <Feld
                key={f.schluessel}
                konfig={f}
                wert={daten[f.schluessel]}
                onAendern={(wert) => dispatch({ typ: 'setze', pfad: `${basisPfad}.${index}.${f.schluessel}`, wert })}
                gedaempft={eingeblendet && ausgeblendet.includes(f)}
              />
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="knopf" onClick={onHinzufuegen}>
        + {hinzufuegenBeschriftung}
      </button>
      <UmschalterZeile anzahl={ausgeblendetGesamt} eingeblendet={eingeblendet} onUmschalten={onEinblenden} />
    </div>
  );
}
