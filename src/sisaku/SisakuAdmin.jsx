import React, { useMemo, useState } from 'react';
import { dbSet, dbUpdateMany } from '../useFirebase.js';
import { showToast } from '../utils.js';
import { weekKey, weekLabel } from '../components/EvalEditors.jsx';
import { parseLine, firstNumber, itemKey, rowsSig } from './parseLine.js';
import { CAR_COLOR, ymd, periodText } from './common.js';

// ===== 施策の登録（管理者だけ） =====
// 1. 販路と週を選ぶ → 2. LINE の文を貼る → 3.「施策ごとに分ける」→ 4. 施策ごとに確かめて直す → 5. 保存
// 保存すると sisaku/current/{販路} を置きかえ、同じ内容を sisaku/history/{販路}/{週} にも残す。
const CHG = ['変更なし', '新規', '変更', '増額', '減額'];
const KIND_HINT = /増額|相対|限定|キャンペーン|上限|期間/;
const rowsToText = (rows) => (rows || []).map((r) => [r.label, r.v, r.cond].join('｜')).join('\n');
const textToRows = (t) => String(t || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const [a, b, c] = l.split(/[｜|]/).map((x) => (x || '').trim());
  return b === undefined ? { label: '', v: a, cond: '' } : { label: a, v: b, cond: c || '' };
});
const newId = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// 先週の施策と比べて「先週から」の初期値をつける
// first：その販路で初めての登録（比べる先週がない）→ 全部「変更なし」にして、トピックスを出さない
function compare(it, prevMap, first) {
  const old = prevMap[itemKey(it)];
  if (!old && first) return { chg: '変更なし', chgText: '', kind: KIND_HINT.test(it.title + it.notes) ? 'limited' : 'base', start: '', end: '', open: false };
  if (!old) return { chg: '新規', chgText: '今週から始まった施策', kind: KIND_HINT.test(it.title + it.notes) ? 'limited' : 'base', start: '', end: '', open: false };
  const keep = { kind: old.kind || 'base', start: old.start || '', end: old.end || '', open: !!old.open };
  if (rowsSig(old) === rowsSig(it)) return { chg: '変更なし', chgText: '', ...keep };
  const a = firstNumber(old.rows && old.rows[0] && old.rows[0].v);
  const b = firstNumber(it.rows && it.rows[0] && it.rows[0].v);
  const from = old.rows && old.rows[0] ? old.rows[0].v : '';
  const to = it.rows && it.rows[0] ? it.rows[0].v : '';
  const chg = a != null && b != null && a !== b ? (b > a ? '増額' : '減額') : '変更';
  return { chg, chgText: from && to && from !== to ? `${from} → ${to}` : '内容が変わりました', ...keep };
}

function EditCard({ it, onChange, onRemove }) {
  const [edit, setEdit] = useState(false);
  const set = (patch) => onChange({ ...it, ...patch });
  const color = CAR_COLOR[it.carrier] || CAR_COLOR['au・UQ'];
  const lim = it.kind === 'limited';
  return (
    <article className={`ska-card ${it.chg !== '変更なし' ? 'chg' : lim ? 'lim' : ''}`}>
      <div className="ska-top">
        <span className="sk-pill" style={{ background: `${color}18`, color }}>{it.carrier}</span>
        <span className="sk-pill gray">{it.cat === 'dev' ? '端末施策' : 'ポイント・対抗施策'}</span>
        <span className="sk-grow" />
        <button className="ska-mini" onClick={() => setEdit(!edit)}>{edit ? '閉じる' : '直す'}</button>
        <button className="ska-mini red" onClick={onRemove} aria-label={`${it.title}を消す`}>消す</button>
      </div>
      {!edit ? (
        <>
          <b className="ska-title">{it.title}</b>
          {(it.rows || []).map((r, i) => <div key={i} className="ska-row">{r.label && <span>{r.label}　</span>}<b>{r.v}</b>{r.cond && <span>　← {r.cond}</span>}</div>)}
          {it.conds && <div className="ska-small"><b>条件　</b>{it.conds}</div>}
          {it.notes && <div className="ska-small warn"><b>注意　</b>{it.notes}</div>}
        </>
      ) : (
        <div className="ska-form">
          <label>名前<input value={it.title} onChange={(e) => set({ title: e.target.value })} /></label>
          <div className="ska-2">
            <label>キャリア<select value={it.carrier} onChange={(e) => set({ carrier: e.target.value })}><option>au</option><option>UQ</option><option>au・UQ</option></select></label>
            <label>区分<select value={it.cat} onChange={(e) => set({ cat: e.target.value })}><option value="pt">ポイント・対抗施策</option><option value="dev">端末施策</option></select></label>
          </div>
          <label>金額（1行に1つ。「ラベル｜金額｜条件」の形。ラベル・条件はなくてもよい）<textarea rows={3} value={rowsToText(it.rows)} onChange={(e) => set({ rows: textToRows(e.target.value) })} /></label>
          <label>条件<textarea rows={2} value={it.conds || ''} onChange={(e) => set({ conds: e.target.value })} /></label>
          <label>注意<textarea rows={2} value={it.notes || ''} onChange={(e) => set({ notes: e.target.value })} /></label>
        </div>
      )}
      <div className="ska-seg">
        <button className={lim ? 'on lim' : ''} onClick={() => set({ kind: 'limited', start: it.start || ymd() })}>期間限定</button>
        <button className={!lim ? 'on' : ''} onClick={() => set({ kind: 'base' })}>ベース</button>
      </div>
      {lim && (
        <div className="ska-period">
          <label>期間<input type="date" value={it.start || ''} onChange={(e) => set({ start: e.target.value })} /></label>
          <span>〜</span>
          {!it.open && <input type="date" aria-label="終了日" value={it.end || ''} onChange={(e) => set({ end: e.target.value })} />}
          <div className="ska-seg sm">
            <button className={!it.open ? 'on' : ''} onClick={() => set({ open: false })}>終了日あり</button>
            <button className={it.open ? 'on' : ''} onClick={() => set({ open: true, end: '' })}>終了未定</button>
          </div>
          <small>{it.open ? '終了日が決まったら、あとから入れられます。それまでは「終了未定」と表示されます' : '終了日が過ぎたら、自動で一覧から消えます'}</small>
        </div>
      )}
      <div className="ska-chg">
        <span>先週から</span>
        {CHG.map((c) => <button key={c} className={it.chg === c ? 'on' : ''} onClick={() => set({ chg: c, chgText: c === '変更なし' ? '' : (it.chgText || '［変わった内容］') })}>{c}</button>)}
      </div>
      {it.chg !== '変更なし' && <label className="ska-chgtext">トピックスに出す内容<input value={it.chgText || ''} onChange={(e) => set({ chgText: e.target.value })} /></label>}
    </article>
  );
}

export default function SisakuAdmin({ user, shops, current, defaultShop, onClose }) {
  const [shopId, setShopId] = useState(defaultShop || (shops[0] && shops[0].id) || '');
  const [date, setDate] = useState(ymd());
  const [raw, setRaw] = useState('');
  const [items, setItems] = useState(null); // 分けた結果
  const [unparsed, setUnparsed] = useState([]);
  const [missing, setMissing] = useState([]); // 先週あって今週ない
  const [addShop, setAddShop] = useState('');
  const [saving, setSaving] = useState(false);
  const shop = shops.find((s) => s.id === shopId);
  const prev = (current && current[shopId]) || null;
  const prevItems = useMemo(() => Object.values((prev && prev.items) || {}).filter((x) => x && !x.ended), [prev]);
  const week = weekKey(date);

  const doParse = () => {
    if (!raw.trim()) return showToast('LINE の文を貼り付けてください');
    const r = parseLine(raw);
    if (r.shop) {
      const hit = shops.find((s) => r.shop.includes(s.name) || s.name.includes(r.shop));
      if (hit && hit.id !== shopId) { setShopId(hit.id); showToast(`文の先頭から販路を「${hit.name}」にしました`); }
    }
    const pShop = r.shop ? (shops.find((s) => r.shop.includes(s.name) || s.name.includes(r.shop)) || shop) : shop;
    const pItems = Object.values(((current && pShop && current[pShop.id]) || {}).items || {}).filter((x) => x && !x.ended);
    const prevMap = Object.fromEntries(pItems.map((x) => [itemKey(x), x]));
    const next = r.items.map((it) => ({ id: newId(), ...it, ...compare(it, prevMap, !pItems.length) }));
    const nextKeys = new Set(next.map(itemKey));
    setItems(next);
    setUnparsed(r.unparsed);
    setMissing(pItems.filter((x) => !nextKeys.has(itemKey(x))).map((x) => ({ ...x, decide: '' })));
  };

  const saveShop = async () => {
    const name = addShop.trim();
    if (!name) return;
    const id = 's' + Date.now().toString(36);
    await dbSet(`sisaku/shops/${id}`, { name, order: 10 + shops.length });
    setShopId(id); setAddShop(''); showToast(`販路「${name}」を追加しました`);
  };

  const save = async () => {
    if (!shopId) return showToast('販路を選んでください');
    if (!items || !items.length) return showToast('保存する施策がありません');
    const left = missing.filter((m) => !m.decide);
    if (left.length) return showToast('「今週の文にない施策」を、終了にするか残すか選んでください');
    setSaving(true);
    const out = {};
    items.forEach((it) => {
      const { id, ...v } = it;
      out[id] = { ...v, title: (v.title || '').trim(), start: v.kind === 'limited' ? (v.start || '') : '', end: v.kind === 'limited' && !v.open ? (v.end || '') : '', open: v.kind === 'limited' ? !!v.open : false };
    });
    missing.forEach((m) => {
      const { id, decide, ...v } = m;
      if (decide === 'keep') out[newId()] = { ...v, chg: '変更なし', chgText: '' };
      if (decide === 'end') out[newId()] = { ...v, ended: true, chg: '終了', chgText: '今週で終わった施策' };
    });
    const snap = { week, savedAt: Date.now(), by: (user && user.name) || '管理者', items: out };
    try {
      await dbUpdateMany({ [`sisaku/current/${shopId}`]: snap, [`sisaku/history/${shopId}/${week}`]: snap });
      showToast(`${shop ? shop.name : ''}の「${weekLabel(week)}」の施策を保存しました`);
      onClose();
    } catch (e) { showToast('保存できませんでした：' + e.message); }
    setSaving(false);
  };

  const upd = (i, v) => setItems(items.map((x, j) => (j === i ? v : x)));
  const nL = (items || []).filter((x) => x.kind === 'limited').length;

  return (
    <div className="page sk ska">
      <header className="hdr">
        <div className="logo"><div className="logo-mark">au</div><h1>施策の登録</h1></div>
        <div className="hdr-right"><button className="btn-back" onClick={onClose}>← 施策一覧</button></div>
      </header>
      <div className="ska-body">
        <section className="ska-left">
          <div className="ska-step"><b>1. 販路を選ぶ</b>
            <div className="ska-chips">
              {shops.map((s) => <button key={s.id} className={`sk-shop ${shopId === s.id ? 'on' : ''}`} onClick={() => setShopId(s.id)}>{s.name}</button>)}
            </div>
            <div className="ska-add"><input placeholder="販路を追加（例：ヤマダ）" value={addShop} onChange={(e) => setAddShop(e.target.value)} /><button onClick={saveShop}>追加</button></div>
          </div>
          <div className="ska-step"><b>2. どの週の施策か</b>
            <div className="ska-week"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="週の中の日付" /><span>{weekLabel(week)}</span></div>
          </div>
          <div className="ska-step grow"><b>3. LINE で届いた文をそのまま貼り付け</b>
            <textarea className="ska-raw" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={'ジョーシン\n_ _ _ _ _\n・スマバリ相対施策\n内容：3,000 or 5,000pt/台\n条件→スマバリor 自宅セット新規加入\n…'} />
          </div>
          <button className="ska-go" onClick={doParse}>施策ごとに分ける</button>
          <p className="ska-hint">「・」「【au】」「■端末施策」「条件→」などの書き方を手がかりに分けます。形式がいつもとちがっても、分けられなかった行は右の一番下に出るので、手で直せます。</p>
        </section>

        <section className="ska-right">
          <div className="ska-head"><b>4. 分けた結果を確かめて保存</b>{items && <small>{items.length}件（期間限定 {nL}件・ベース {items.length - nL}件）</small>}</div>
          {!items && <div className="sk-empty">左に貼り付けて「施策ごとに分ける」を押すと、ここに結果が出ます。<br />今の登録：{prev ? `${weekLabel(prev.week)}（${prevItems.length}件）` : 'なし'}</div>}
          {items && (
            <div className="ska-grid">
              {items.map((it, i) => <EditCard key={it.id} it={it} onChange={(v) => upd(i, v)} onRemove={() => setItems(items.filter((_, j) => j !== i))} />)}
              <button className="ska-addcard" onClick={() => setItems([...items, { id: newId(), title: '［施策の名前］', carrier: 'au', cat: 'pt', rows: [{ label: '', v: '［金額］', cond: '' }], conds: '', notes: '', kind: 'base', chg: '新規', chgText: '今週から始まった施策', start: '', end: '', open: false }])}>＋ 施策を手で足す</button>
              {missing.length > 0 && (
                <div className="ska-missing">
                  <b>先週にあって、今週の文にない施策</b>
                  {missing.map((m, i) => (
                    <div key={m.id || i} className="ska-mrow">
                      <span>{m.title}（{m.carrier}）{periodText(m) && `・${periodText(m)}`}</span>
                      <button className={m.decide === 'end' ? 'on' : ''} onClick={() => setMissing(missing.map((x, j) => (j === i ? { ...x, decide: 'end' } : x)))}>終了にする（トピックスに出す）</button>
                      <button className={m.decide === 'keep' ? 'on' : ''} onClick={() => setMissing(missing.map((x, j) => (j === i ? { ...x, decide: 'keep' } : x)))}>そのまま残す</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="ska-unparsed">
                <b>分けられなかった行</b>
                {!unparsed.length && <span>　なし</span>}
                {unparsed.map((l, i) => (
                  <div key={i} className="ska-mrow">
                    <span>{l}</span>
                    <button onClick={() => { setItems([...items, { id: newId(), title: l, carrier: 'au', cat: 'pt', rows: [{ label: '', v: '［金額］', cond: '' }], conds: '', notes: '', kind: 'base', chg: '新規', chgText: '今週から始まった施策', start: '', end: '', open: false }]); setUnparsed(unparsed.filter((_, j) => j !== i)); }}>施策に足す</button>
                    <button onClick={() => setUnparsed(unparsed.filter((_, j) => j !== i))}>消す</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="ska-foot">
            <span>保存すると、{shop ? shop.name : '［販路］'}の「{weekLabel(week)}」の施策として公開されます。前の週の施策は「過去の週」から見られます。</span>
            <button className="ska-cancel" onClick={() => { setItems(null); setUnparsed([]); setMissing([]); }}>やり直す</button>
            <button className="ska-save" disabled={saving} onClick={save}>{saving ? '保存中…' : 'この内容で保存'}</button>
          </div>
        </section>
      </div>
    </div>
  );
}
