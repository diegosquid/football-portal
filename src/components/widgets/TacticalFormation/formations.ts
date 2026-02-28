import type { FormationId, PositionCoord } from "./types";

/**
 * Coordenadas predefinidas para cada formação.
 * x: 0-100 (esquerda → direita)
 * y: 0-100 (gol próprio → gol adversário)
 * Ordem: GK, defensores L→R, meias L→R, atacantes L→R
 */
export const formations: Record<FormationId, PositionCoord[]> = {
  "4-3-3": [
    { x: 50, y: 6, label: "GK" },
    { x: 15, y: 25, label: "LE" },
    { x: 38, y: 20, label: "ZAG" },
    { x: 62, y: 20, label: "ZAG" },
    { x: 85, y: 25, label: "LD" },
    { x: 25, y: 48, label: "MC" },
    { x: 50, y: 42, label: "VOL" },
    { x: 75, y: 48, label: "MC" },
    { x: 20, y: 72, label: "PE" },
    { x: 50, y: 78, label: "CA" },
    { x: 80, y: 72, label: "PD" },
  ],

  "4-4-2": [
    { x: 50, y: 6, label: "GK" },
    { x: 15, y: 25, label: "LE" },
    { x: 38, y: 20, label: "ZAG" },
    { x: 62, y: 20, label: "ZAG" },
    { x: 85, y: 25, label: "LD" },
    { x: 12, y: 48, label: "ME" },
    { x: 38, y: 45, label: "MC" },
    { x: 62, y: 45, label: "MC" },
    { x: 88, y: 48, label: "MD" },
    { x: 35, y: 75, label: "CA" },
    { x: 65, y: 75, label: "CA" },
  ],

  "4-2-3-1": [
    { x: 50, y: 6, label: "GK" },
    { x: 15, y: 25, label: "LE" },
    { x: 38, y: 20, label: "ZAG" },
    { x: 62, y: 20, label: "ZAG" },
    { x: 85, y: 25, label: "LD" },
    { x: 35, y: 40, label: "VOL" },
    { x: 65, y: 40, label: "VOL" },
    { x: 20, y: 60, label: "ME" },
    { x: 50, y: 57, label: "MEI" },
    { x: 80, y: 60, label: "MD" },
    { x: 50, y: 80, label: "CA" },
  ],

  "4-1-4-1": [
    { x: 50, y: 6, label: "GK" },
    { x: 15, y: 25, label: "LE" },
    { x: 38, y: 20, label: "ZAG" },
    { x: 62, y: 20, label: "ZAG" },
    { x: 85, y: 25, label: "LD" },
    { x: 50, y: 37, label: "VOL" },
    { x: 12, y: 55, label: "ME" },
    { x: 38, y: 52, label: "MC" },
    { x: 62, y: 52, label: "MC" },
    { x: 88, y: 55, label: "MD" },
    { x: 50, y: 78, label: "CA" },
  ],

  "3-5-2": [
    { x: 50, y: 6, label: "GK" },
    { x: 25, y: 22, label: "ZAG" },
    { x: 50, y: 19, label: "ZAG" },
    { x: 75, y: 22, label: "ZAG" },
    { x: 10, y: 48, label: "ALE" },
    { x: 35, y: 42, label: "MC" },
    { x: 50, y: 48, label: "VOL" },
    { x: 65, y: 42, label: "MC" },
    { x: 90, y: 48, label: "ALD" },
    { x: 35, y: 75, label: "CA" },
    { x: 65, y: 75, label: "CA" },
  ],

  "3-4-3": [
    { x: 50, y: 6, label: "GK" },
    { x: 25, y: 22, label: "ZAG" },
    { x: 50, y: 19, label: "ZAG" },
    { x: 75, y: 22, label: "ZAG" },
    { x: 12, y: 46, label: "ME" },
    { x: 38, y: 42, label: "MC" },
    { x: 62, y: 42, label: "MC" },
    { x: 88, y: 46, label: "MD" },
    { x: 20, y: 72, label: "PE" },
    { x: 50, y: 78, label: "CA" },
    { x: 80, y: 72, label: "PD" },
  ],

  "5-3-2": [
    { x: 50, y: 6, label: "GK" },
    { x: 8, y: 28, label: "ALE" },
    { x: 28, y: 22, label: "ZAG" },
    { x: 50, y: 19, label: "ZAG" },
    { x: 72, y: 22, label: "ZAG" },
    { x: 92, y: 28, label: "ALD" },
    { x: 25, y: 48, label: "MC" },
    { x: 50, y: 45, label: "VOL" },
    { x: 75, y: 48, label: "MC" },
    { x: 35, y: 75, label: "CA" },
    { x: 65, y: 75, label: "CA" },
  ],

  "5-4-1": [
    { x: 50, y: 6, label: "GK" },
    { x: 8, y: 28, label: "ALE" },
    { x: 28, y: 22, label: "ZAG" },
    { x: 50, y: 19, label: "ZAG" },
    { x: 72, y: 22, label: "ZAG" },
    { x: 92, y: 28, label: "ALD" },
    { x: 12, y: 52, label: "ME" },
    { x: 38, y: 48, label: "MC" },
    { x: 62, y: 48, label: "MC" },
    { x: 88, y: 52, label: "MD" },
    { x: 50, y: 78, label: "CA" },
  ],

  "4-4-2-diamond": [
    { x: 50, y: 6, label: "GK" },
    { x: 15, y: 25, label: "LE" },
    { x: 38, y: 20, label: "ZAG" },
    { x: 62, y: 20, label: "ZAG" },
    { x: 85, y: 25, label: "LD" },
    { x: 50, y: 36, label: "VOL" },
    { x: 25, y: 48, label: "MC" },
    { x: 75, y: 48, label: "MC" },
    { x: 50, y: 60, label: "MEI" },
    { x: 35, y: 78, label: "CA" },
    { x: 65, y: 78, label: "CA" },
  ],

  "4-3-2-1": [
    { x: 50, y: 6, label: "GK" },
    { x: 15, y: 25, label: "LE" },
    { x: 38, y: 20, label: "ZAG" },
    { x: 62, y: 20, label: "ZAG" },
    { x: 85, y: 25, label: "LD" },
    { x: 25, y: 42, label: "MC" },
    { x: 50, y: 38, label: "VOL" },
    { x: 75, y: 42, label: "MC" },
    { x: 30, y: 62, label: "SA" },
    { x: 70, y: 62, label: "SA" },
    { x: 50, y: 80, label: "CA" },
  ],
};
