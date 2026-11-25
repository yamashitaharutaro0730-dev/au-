// ===== LINE で届いた施策の文を、施策ごとに分ける =====
// 書き方がいつも同じとはかぎらないので、次の手がかりで分ける。分けられなかった行は unparsed に返す。
//   区切り線（_ _ _ / ＿＿＿ / ---）     → 施策の区切り
//   【au】【UQ】                         → キャリア
//   ■端末施策 など（■で始まる行）        → 区分（「端末」をふくめば端末施策、それ以外はポイント・対抗施策）
//   ・〇〇                               → 施策の名前（後ろに金額があれば、それも1行目の金額にする）
//   内容：〇〇                           → 金額
//   条件→〇〇                           → 条件（端末施策なら、直前の金額の条件）
//   〇〇→実質〇円                        → 端末名と金額（端末施策）
//   実質〇円→MNP、アップ                 → 金額と条件
//   機種変更→〇〇値引き                  → ラベルつきの金額
//   ※〇〇 / ⚠〇〇                        → 注意
//   一番上の店名（ジョーシン / エディオン販路 など） → 販路の候補

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu;
const MONEY = /(pt|ｐｔ|円|値引|ポイント|一括)/i;
const DEVICE = /^(iphone|pixel|ピクセル|galaxy|ギャラクシー|xperia|エクスペリア|aquos|アクオス|arrows|redmi|moto|oppo|google|ipad|zenfone)/i;
const LABEL_WORDS = /^(機種変更|機変|新規|MNP|アップ|U18|U12|保証あり|保証なし)/i;

const clean = (s) => String(s || '').replace(EMOJI, '').replace(/　/g, '　').trim();
const isSep = (s) => s.length >= 3 && /^[\s_＿\-－―─━=＝]+$/.test(s);
const tidy = (s) => clean(s)
  .replace(/\s*→\s*/g, '→')
  .replace(/\bsim\b/gi, 'SIM').replace(/新sim/gi, '新SIM')
  .replace(/\bu(12|18|22)\b/gi, 'U$1')
  .replace(/^pixel\s*/i, 'Pixel ').replace(/^ピクセル\s*/, 'Pixel ')
  .replace(/^galaxy\s*/i, 'Galaxy ').replace(/^iphone\s*/i, 'iPhone ')
  .replace(/\s{2,}/g, ' ')
  .replace(/[、,，。\s]+$/, '');

const carrierOf = (s) => {
  const t = s.toLowerCase();
  if (t.includes('au') && t.includes('uq')) return 'au・UQ';
  if (t.includes('uq')) return 'UQ';
  if (t.includes('au')) return 'au';
  return '';
};

// 「名前　金額」を分ける。全角スペースがあればそこで、なければ「数字・最大・実質・一括」で始まる手前のスペースで
const splitNameValue = (s) => {
  const ok = (a, b) => a && b && MONEY.test(b) && !MONEY.test(a);
  const fw = s.indexOf('　');
  if (fw > 0) {
    const a = s.slice(0, fw).trim(); const b = s.slice(fw + 1).trim();
    if (ok(a, b)) return [a, b];
  }
  const re = /[\s　]+(?=(最大|実質|一括|約)?\s*[\d,]+)/g;
  let m;
  while ((m = re.exec(s))) {
    const a = s.slice(0, m.index).trim(); const b = s.slice(m.index).trim();
    if (ok(a, b)) return [a, b];
  }
  return null;
};

export function parseLine(text) {
  const items = [];
  const unparsed = [];
  let shop = '';
  let carrier = '';
  let cat = 'pt';
  let cur = null;
  const start = (title, extra = {}) => {
    cur = { title: tidy(title), carrier: carrier || '', cat, rows: [], conds: [], notes: [], ...extra };
    items.push(cur);
    return cur;
  };
  const lines = String(text || '').split(/\r?\n/);
  lines.forEach((raw, i) => {
    const warn = /^\s*(⚠|❗|‼|！！)/.test(raw);
    let t = clean(raw);
    if (!t) return;
    if (isSep(t)) { cur = null; return; }

    // 【au】【UQ】
    const br = t.match(/^【(.+?)】\s*(.*)$/);
    if (br) {
      const c = carrierOf(br[1]);
      if (c) { carrier = c; cur = null; }
      t = br[2].trim();
      if (!t) return;
    }
    // ■ 区分
    if (/^[■□◆◇●]/.test(t)) { cat = /端末|機種/.test(t) ? 'dev' : 'pt'; carrier = carrierOf(t) || carrier; cur = null; return; }
    // 一番上の店名・「〇〇販路」
    if (/販路\s*$/.test(t) || (!items.length && !shop && i < 3 && !MONEY.test(t) && !/[・→：:]/.test(t) && t.length <= 14)) {
      shop = t.replace(/販路\s*$/, '').trim();
      return;
    }
    // ・施策の名前
    if (/^[・･]/.test(t)) {
      const s = t.replace(/^[・･]\s*/, '');
      const nv = splitNameValue(s);
      start(nv ? nv[0] : s);
      if (nv) cur.rows.push({ label: '', v: tidy(nv[1]), cond: '' });
      return;
    }
    // 注意
    if (warn || /^(※|注意)/.test(t)) {
      const n = tidy(t.replace(/^(※|注意[:：]?)\s*/, ''));
      if (cur) cur.notes.push(n); else unparsed.push(t);
      return;
    }
    // 条件→
    const cm = t.match(/^条件\s*[→:：>＞]\s*(.*)$/);
    if (cm) {
      const c = tidy(cm[1]);
      if (!cur) { unparsed.push(t); return; }
      const last = cur.rows[cur.rows.length - 1];
      if (cur.cat === 'dev' && last && !last.cond) last.cond = c; else cur.conds.push(c);
      return;
    }
    // 内容：
    const vm = t.match(/^内容\s*[:：]\s*(.*)$/);
    if (vm) {
      if (!cur) { unparsed.push(t); return; }
      cur.rows.push({ label: '', v: tidy(vm[1]), cond: '' });
      return;
    }
    // A→B
    if (t.includes('→')) {
      const k = t.indexOf('→');
      const L = t.slice(0, k).trim();
      const R = t.slice(k + 1).trim();
      if (MONEY.test(L) && !MONEY.test(R) && cur) { cur.rows.push({ label: '', v: tidy(L), cond: tidy(R) }); return; }
      if (MONEY.test(R)) {
        if (LABEL_WORDS.test(L) && cur) { cur.rows.push({ label: tidy(L), v: tidy(R), cond: '' }); return; }
        if (cat === 'dev' || DEVICE.test(L)) { start(L); cur.rows.push({ label: '', v: tidy(R), cond: '' }); return; }
        if (cur) { cur.rows.push({ label: tidy(L), v: tidy(R), cond: '' }); return; }
      }
      if (cur) cur.conds.push(tidy(t)); else unparsed.push(t);
      return;
    }
    // 金額だけの行（「自宅セット割ネット　5,000pt」「10000pt付与」など）
    if (MONEY.test(t) && /\d/.test(t)) {
      if (!cur) {
        if (cat === 'dev') { const nv = splitNameValue(t); if (nv) { start(nv[0]); cur.rows.push({ label: '', v: tidy(nv[1]), cond: '' }); return; } }
        unparsed.push(t); return;
      }
      const nv = splitNameValue(t);
      if (nv) cur.rows.push({ label: tidy(nv[0]), v: tidy(nv[1]), cond: '' });
      else {
        const m = t.match(/^([^\d]*?[A-Za-zぁ-んァ-ヶ一-龠]+\d*[A-Za-z]*)\s*((?:一括|実質|最大)?\s*[\d,]+.*)$/);
        if (m && m[1] && DEVICE.test(m[1])) cur.rows.push({ label: tidy(m[1]), v: tidy(m[2]), cond: '' });
        else cur.rows.push({ label: '', v: tidy(t), cond: '' });
      }
      return;
    }
    // 端末名だけの行（端末施策の中）
    if ((cat === 'dev' || DEVICE.test(t)) && t.length <= 24 && !/[、。]/.test(t)) { start(t); return; }
    // それ以外：今の施策の条件に足す
    if (cur) cur.conds.push(tidy(t)); else unparsed.push(t);
  });

  // 同じ名前・キャリア・区分の施策が分かれて書かれていたら、1つにまとめる（例：Pixel 10a が2か所）
  const merged = [];
  items.filter((it) => it.title).forEach((it) => {
    const same = merged.find((m) => m.title === it.title && m.carrier === it.carrier && m.cat === it.cat);
    if (same) { same.rows.push(...it.rows); same.conds.push(...it.conds); same.notes.push(...it.notes); } else merged.push(it);
  });
  const out = merged
    .map((it) => ({
      title: it.title,
      carrier: it.carrier || 'au・UQ',
      cat: it.cat,
      rows: it.rows.length ? it.rows : [{ label: '', v: '［金額］', cond: '' }],
      conds: it.conds.join('\n'),
      notes: it.notes.join('\n'),
    }));
  return { shop, items: out, unparsed };
}

// 金額の最初の数字（増額・減額の判定用）
export const firstNumber = (s) => {
  const m = String(s || '').replace(/,/g, '').match(/\d+/);
  return m ? Number(m[0]) : null;
};

// 施策を見分けるキー（名前とキャリア）
export const itemKey = (it) => `${String(it.title || '').replace(/[\s　（）()]/g, '').toLowerCase()}|${it.carrier || ''}`;

// 行の中身を比べるための文字列
export const rowsSig = (it) => (it.rows || []).map((r) => `${r.label}:${r.v}:${r.cond}`).join('/');
