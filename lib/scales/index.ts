// 尺度レジストリ
// 新しい尺度を追加する場合:
// 1. lib/scales/<scale-id>.json を作成（Scaleスキーマに従う）
// 2. このファイルにimportとregisterの行を追加する

import type { Scale } from "../types";
import bigFiveS from "./big-five-s.json";

const scaleList: Scale[] = [
  bigFiveS as Scale,
];

export function getAllScales(): Scale[] {
  return scaleList;
}

export function getScaleById(id: string): Scale | undefined {
  return scaleList.find((s) => s.meta.id === id);
}
