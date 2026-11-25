import React, { useMemo, useState } from 'react';
import { useDbCollection } from '../useFirebase.js';
import { ManualButton } from '../manual/Manual.jsx';
import { weekLabel } from '../components/EvalEditors.jsx';
import SisakuAdmin from './SisakuAdmin.jsx';
import { CAR_COLOR, ymd, md, periodText, asList, sortShops } from './common.js';
import './sisaku.css';

// ===== 施策一覧 =====
// LINE で届く施策（期間限定・ベース）を、販路ごと・キャリアごとに見る画面。登録は管理者だけ（SisakuAdmin）。
// 保存場所（au-data-base）
//   sisaku/shops/{id}                = { name, order }             販路の一覧
//   sisaku/current/{販路id}          = { week, savedAt, by, items } いま表示する施策（最新の週）
//   sisaku/history/{販路id}/{週}     = 同じ形                       過去の週（保存のたびに残る）
//   items/{id} = { kind: 'limited'|'base', cat: 'pt'|'dev', carrier: 'au'|'UQ'|'au・UQ', title,
//                  rows: [{ label, v, cond }], conds, notes, start, end, open（終了未定）,
//                  chg: '変更なし'|'新規'|'変更'|'増額'|'減額'|'終了', chgText, ended（終了した施策：トピックスだけに出す） }

function ItemCard({ it }) {
  const color = CAR_COLOR[it.carrier] || CAR_COLOR['au・UQ'];
  const per = periodText(it);
  const changed = it.chg && it.chg !== '変更なし';
  return (
    <article className={`sk-card ${changed ? 'chg' : ''}`}>
      <div className="sk-card-bar" style={{ background: color }} />
      <div className="sk-card-body">
        <div className="sk-card-top">
          <b className="sk-card-title">{it.title}</b>
          {changed && <span className="sk-pill chg">{it.chg}</span>}
          <span className="sk-pill" style={{ background: `${color}18`, color }}>{it.carrier}</span>
        </div>
        {per && <span className="sk-period">期間 {per}</span>}
        {(it.rows || []).map((r, i) => (
          <div key={i} className="sk-row">
            {r.label && <span className="sk-row-l">{r.label}</span>}
            <b className="sk-row-v">{r.v}</b>
            {r.cond && <span className="sk-row-c">← {r.cond}</span>}
          </div>
        ))}
        {it.conds && <div className="sk-conds"><span>条件</span><p>{it.conds}</p></div>}
        {it.notes && <div className="sk-notes"><b>注意　</b>{it.notes}</div>}
      </div>
    </article>
  );
}

export default function SisakuPage({ user, isAdmin, onBack }) {
  const [shopsRaw] = useDbCollection('sisaku/shops');
  const [current] = useDbCollection('sisaku/current');
  const shops = useMemo(() => sortShops(shopsRaw), [shopsRaw]);
  const [shopId, setShopId] = useState('');
  const shop = shops.find((s) => s.id === shopId) || shops[0];
  const [history] = useDbCollection(`sisaku/history/${shop ? shop.id : '_'}`);
  const [car, setCar] = useState('au');
  const [tab, setTab] = useState('limited');
  const [week, setWeek] = useState(''); // '' = 最新
  const [hist, setHist] = useState(false);
  const [admin, setAdmin] = useState(false);

  if (admin && isAdmin) return <SisakuAdmin user={user} shops={shops} current={current} defaultShop={shop && shop.id} onClose={() => setAdmin(false)} />;

  const latest = (shop && current[shop.id]) || null;
  const snap = week ? history[week] : latest;
  const today = ymd();
  const all = asList(snap && snap.items);
  // 終了日が過ぎた期間限定は出さない
  const live = all.filter((it) => !it.ended && !(it.kind === 'limited' && !it.open && it.end && it.end < today));
  const mine = live.filter((it) => it.carrier === car || it.carrier === 'au・UQ');
  const list = mine.filter((it) => it.kind === tab);
  const topics = all.filter((it) => it.chg && it.chg !== '変更なし' && (it.carrier === car || it.carrier === 'au・UQ'));
  const pt = list.filter((it) => it.cat !== 'dev');
  const dev = list.filter((it) => it.cat === 'dev');
  const weeks = Object.keys(history || {}).sort().reverse();
  const shownWeek = week || (latest && latest.week) || '';

  return (
    <div className="page sk">
      <header className="hdr">
        <div className="logo"><div className="logo-mark">au</div><h1>施策一覧</h1></div>
        <div className="hdr-right"><button className="btn-back" onClick={onBack}>← ホーム</button><ManualButton screen="sisaku" /></div>
      </header>
      <div className="sk-bar">
        <div className="sk-wrap">
          <div className="sk-week">
            <div className="sk-week-t">
              <b>{shownWeek ? `${weekLabel(shownWeek)}の施策` : 'まだ登録がありません'}</b>
              <small>{shop ? shop.name : ''}{snap && snap.savedAt ? `・${md(ymd(new Date(snap.savedAt)))} 更新` : ''}</small>
            </div>
            {weeks.length > 0 && <button className="sk-histbtn" onClick={() => setHist(true)}>過去の週</button>}
            {isAdmin && <button className="sk-admbtn" onClick={() => setAdmin(true)}>＋ 施策を登録</button>}
          </div>
          <div className="sk-pick">
            {shops.map((s) => <button key={s.id} className={`sk-shop ${shop && shop.id === s.id ? 'on' : ''}`} onClick={() => { setShopId(s.id); setWeek(''); }}>{s.name}</button>)}
            <span className="sk-sep" />
            {['au', 'UQ'].map((c) => <button key={c} className={`sk-car ${car === c ? 'on' : ''}`} style={car === c ? { background: CAR_COLOR[c], borderColor: CAR_COLOR[c] } : null} onClick={() => setCar(c)}>{c}</button>)}
          </div>
          <div className="sk-tabs">
            {[['limited', '期間限定'], ['base', 'ベース']].map(([id, label]) => (
              <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}<small>{mine.filter((it) => it.kind === id).length}件</small></button>
            ))}
          </div>
        </div>
      </div>
      {week && <div className="sk-past"><span>過去の週の施策を表示しています</span><button onClick={() => setWeek('')}>最新に戻る</button></div>}

      <main className="sk-main">
        <div className="sk-wrap sk-list">
          {!week && topics.length > 0 && (
            <section className="sk-topics">
              <div className="sk-topics-h"><b>今週のトピックス</b><small>先週から変わった施策 {topics.length}件</small></div>
              {topics.map((it) => (
                <div key={it.id} className="sk-topic">
                  <div className="sk-topic-top"><span className="sk-pill chg">{it.chg}</span><b>{it.title}</b><small>{it.kind === 'limited' ? '期間限定' : 'ベース'}</small></div>
                  {it.chgText && <p>{it.chgText}</p>}
                </div>
              ))}
            </section>
          )}
          {pt.length > 0 && <div className="sk-sec"><b>{tab === 'limited' ? '期間限定の施策' : 'ポイント・対抗施策'}</b><small>{pt.length}件</small></div>}
          {pt.map((it) => <ItemCard key={it.id} it={it} />)}
          {dev.length > 0 && <div className="sk-sec"><b>端末施策</b><small>{dev.length}件</small></div>}
          {dev.map((it) => <ItemCard key={it.id} it={it} />)}
          {!list.length && <div className="sk-empty">{snap ? 'この販路・キャリアの施策はありません' : 'この販路の施策はまだ登録されていません'}</div>}
          <p className="sk-foot">LINE で届いた内容を管理者が登録しています。数字や条件は、迷ったら必ず社員さんに確認してください。</p>
        </div>
      </main>

      {hist && (
        <div className="sk-sheet-bg" onClick={(e) => e.target === e.currentTarget && setHist(false)}>
          <div className="sk-sheet" role="dialog" aria-label="過去の週の施策">
            <div className="sk-handle" />
            <b>過去の週の施策（{shop ? shop.name : ''}）</b>
            <button className={`sk-wk ${!week ? 'on' : ''}`} onClick={() => { setWeek(''); setHist(false); }}><span><b>{latest && latest.week ? weekLabel(latest.week) : '最新'}</b><small>いま表示している最新の施策</small></span><em>最新</em></button>
            {weeks.filter((w) => !latest || w !== latest.week).map((w) => (
              <button key={w} className={`sk-wk ${week === w ? 'on' : ''}`} onClick={() => { setWeek(w); setHist(false); }}><span><b>{weekLabel(w)}</b><small>{history[w] && history[w].savedAt ? `${md(ymd(new Date(history[w].savedAt)))} 更新` : ''}</small></span></button>
            ))}
            <button className="sk-close" onClick={() => setHist(false)}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}
