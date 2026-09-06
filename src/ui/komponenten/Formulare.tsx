/**
 * Generische Formular-Bausteine: ein Satz Skalarfelder gebunden an einen
 * Objektpfad, sowie eine wiederholbare Liste (Produkte, Fixkosten,
 * Investitionen) mit Hinzufuegen/Entfernen. Keine Rechenlogik — nur Bindung
 * der Feldkonfiguration an den Reducer-Pfad.
 */
import type { Dispatch } from 'react';
import type { Aktion } from '../../state/szenarioReducer';
import type { Feldkonfiguration } from '../feldKonfiguration';
import { Feld } from './Feld';

function alsRecord(wert: unknown): Record<string, unknown> {
  return wert as unknown as Record<string, unknown>;
}

export interface SkalarFelderProps {
  readonly basisPfad: string;
  readonly objekt: unknown;
  readonly felder: readonly Feldkonfiguration[];
  readonly dispatch: Dispatch<Aktion>;
}

export function SkalarFelder({ basisPfad, objekt, felder, dispatch }: SkalarFelderProps) {
  const daten = alsRecord(objekt);
  return (
    <div className="feld-raster">
      {felder.map((f) => (
        <Feld
          key={f.schluessel}
          konfig={f}
          wert={daten[f.schluessel]}
          onAendern={(wert) => dispatch({ typ: 'setze', pfad: `${basisPfad}.${f.schluessel}`, wert })}
        />
      ))}
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
}: ArrayFelderProps) {
  return (
    <div className="array-liste">
      {items.length === 0 && <p className="array-liste__leer">{leerHinweis}</p>}
      {items.map((item, index) => (
        <div className="array-eintrag" key={item.id}>
          <div className="array-eintrag__kopf">
            <strong>{beschriftung(item, index)}</strong>
            <button type="button" className="knopf knopf--klein knopf--gefahr" onClick={() => onLoeschen(item.id)}>
              Entfernen
            </button>
          </div>
          <div className="feld-raster">
            {felder.map((f) => (
              <Feld
                key={f.schluessel}
                konfig={f}
                wert={alsRecord(item)[f.schluessel]}
                onAendern={(wert) =>
                  dispatch({ typ: 'setze', pfad: `${basisPfad}.${index}.${f.schluessel}`, wert })
                }
              />
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="knopf" onClick={onHinzufuegen}>
        + {hinzufuegenBeschriftung}
      </button>
    </div>
  );
}
