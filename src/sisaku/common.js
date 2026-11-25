// ===== 施策一覧で共通に使うもの =====
export const DEFAULT_SHOPS = { joshin: { name: 'ジョーシン', order: 1 }, edion: { name: 'エディオン', order: 2 } };
export const CAR_COLOR = { au: '#c2410c', UQ: '#2d5ba8', 'au・UQ': '#7a5a48' };
export const ymd = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const md = (s) => { if (!s) return ''; const [, m, d] = s.split('-'); return `${Number(m)}/${Number(d)}`; };
// 期間の表示（期間限定だけ）：「11/24〜11/30」「11/24〜 終了未定」
export const periodText = (it) => {
  if (!it || it.kind !== 'limited') return '';
  if (!it.start && !it.end && !it.open) return '';
  return `${it.start ? md(it.start) : ''}〜${it.open || !it.end ? ' 終了未定' : md(it.end)}`;
};
export const asList = (o) => Object.entries(o || {}).filter(([, v]) => v).map(([id, v]) => ({ id, ...v }));
// 販路の並び（最初から入っている2つ＋管理者が足したもの）
export const sortShops = (shops) => asList({ ...DEFAULT_SHOPS, ...shops }).filter((s) => s.name && !s.hidden).sort((a, b) => (a.order || 99) - (b.order || 99));
