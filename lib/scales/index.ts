// 尺度レジストリ
// 新しい尺度を追加する場合:
// 1. lib/scales/<scale-id>.json を作成（Scaleスキーマに従う）
// 2. このファイルにimportとregisterの行を追加する

import type { Scale } from "../types";
import bigFiveS from "./big-five-s.json";
import bfi2jStudent from "./bfi-2-j-student.json";
import bfi2jCommunity from "./bfi-2-j-community.json";
import ecrGo from "./ecr-go.json";
import ecrRsMother from "./ecr-rs-mother.json";
import ecrRsFather from "./ecr-rs-father.json";
import ecrRsPartner from "./ecr-rs-partner.json";
import ecrRsFriend from "./ecr-rs-friend.json";
import bscsJ from "./bscs-j.json";
import scriJ from "./scri-j.json";

const scaleList: Scale[] = [
  bigFiveS as Scale,
  bfi2jStudent as Scale,
  bfi2jCommunity as Scale,
  ecrGo as Scale,
  ecrRsMother as Scale,
  ecrRsFather as Scale,
  ecrRsPartner as Scale,
  ecrRsFriend as Scale,
  bscsJ as Scale,
  scriJ as Scale,
];

export function getAllScales(): Scale[] {
  return scaleList;
}

export function getScaleById(id: string): Scale | undefined {
  return scaleList.find((s) => s.meta.id === id);
}
