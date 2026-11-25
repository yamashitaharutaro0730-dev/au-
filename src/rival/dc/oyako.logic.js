// 親子割を使った場合の最安（他社比較 > 料金表の下に出す表）
// AI生成のサンプル（canvas）から移したロジック。PC用（oyako.tpl）とスマホ用（oyakoSp.tpl：上下2段）で同じロジックを使う
// 料金・条件を直すときは、下の B の中だけを書きかえる（2026年11月24日時点・AI生成（要確認））
import { DCLogic } from "./DcView.jsx";

export default class OyakoLogic extends DCLogic {
  renderVals() {
    const st = this.state || {};
    // [ブランド, 色, 文字色, 列]
    // 列：{ camp 割引の名前, who 対象, plan, data, normal 通常の割引後, base 月額, lines 通常の割引, oyako [名前,額]（なければ null）,
    //       after 最安, term 期間, end 期間後, accept 受付, conds 条件, note, bonus / bonusSub / bonusText 特典 }
    const B = [
      ['docomo', '#c8102e', '#fff', [
        { camp: 'ドコモ親子割', who: '子ども（5〜15歳）', plan: 'スマホデビュー プランU15', data: '20GBまで', normal: '2,728', base: '3,278', lines: [['dカードお支払割（GOLD以上）', 550]], oyako: ['ドコモ親子割（U15・5〜20GB）', 1870], after: '858', term: '最大12か月', end: '2,728円', accept: '受付期間は公式で確認',
          conds: [['対象', '申込み時点で5〜15歳。スマホデビュープランU15（個人契約）'], ['条件', '同じファミリー割引グループに、ドコモMAX・ドコモ ポイ活MAX・ahamo の回線があること'], ['ほか', '1人1回線まで']], note: '5GBまでの月も、親子割 1,100円引きと dカード GOLD で 858円。' },
        { camp: 'ドコモ親子割（家族）', who: '親など家族', plan: 'ドコモMAX', data: '無制限', normal: '5,148', base: '8,448', lines: [['みんなドコモ割（3回線以上）', 1210], ['ドコモ光セット割', 1210], ['dカードお支払割（GOLD以上）', 550], ['ドコモでんきセット割', 110], ['長期利用割（20年以上）', 220]], oyako: ['ドコモ親子割（家族）', 550], after: '4,598', term: '最大12か月', end: '5,148円', accept: '受付期間は公式で確認',
          conds: [['対象', '親子割（U15）を使う子どもと、同じファミリー割引グループの家族'], ['プラン', 'ドコモMAX・ドコモ ポイ活MAX・ahamo'], ['ほか', '1回線につき1回まで']], note: '家族の割引は 550円。UQ・ワイモバイルは家族も 1,100円引き。' },
        { camp: 'ドコモ親子割（家族）', who: '親など家族', plan: 'ahamo', data: '30GB', normal: '2,970', base: '2,970', lines: [], oyako: ['ドコモ親子割（家族）', 550], after: '2,420', term: '最大12か月', end: '2,970円', accept: '受付期間は公式で確認',
          conds: [['対象', '親子割（U15）を使う子どもと、同じファミリー割引グループの家族'], ['プラン', 'ahamo も対象'], ['ほか', '1回線につき1回まで']], note: 'ahamo は12/1から 40GB 3,135円の段階制に変わる（要確認）。' },
      ]],
      ['au', '#eb5505', '#fff', [
        { camp: '親子割なし（年齢別プラン）', who: '子ども（5〜18歳）', plan: 'U18バリュー プラン', data: '3GBまで', normal: '1,078', base: '2,398', lines: [['auスマートバリュー', 550], ['家族割プラス（3人以上）', 550], ['au PAYカードお支払い割', 220]], oyako: null, after: '1,078', term: '通年のプラン', end: '22歳まで同じ（3GB超〜20GBは 2,728円）', accept: 'いつでも申込みできる',
          conds: [['対象', '申込み時点で5〜18歳'], ['割引', '家族割プラスが2人なら 220円引き。auスマートバリューは家のネット・電話の加入が必要'], ['ほか', '23歳になる月の翌月からは 3GB超〜20GB の料金']], note: 'au は期間限定の親子割の発表なし（11/24時点）。子どもはU18バリュープラン、親は UQ 親子応援割と比べて提案する。' },
      ]],
      ['SoftBank', '#ffffff', '#4a4a4a', [
        { camp: '2027年度の学割', who: '子ども', plan: '［確認中］', data: '', normal: '－', base: '－', lines: [], oyako: null, after: '確認中', term: '', end: '－', accept: '確認中',
          conds: [['状態', '2027年度の親子割・学割はまだ確認できていない']], note: 'わかったら管理者が登録する。' },
      ]],
      ['Rakuten Mobile', '#bf0a5a', '#fff', [
        { camp: '最強青春割', who: '13〜22歳', plan: '最強プラン', data: '3GBまで', normal: '968', base: '1,078', lines: [['最強家族プログラム', 110]], oyako: ['最強青春割', 110], after: '858', term: '22歳まで', end: '23歳の誕生日の月から 968円', accept: '通年（エントリーが必要）',
          conds: [['対象', '13〜22歳'], ['条件', '最強青春割へのエントリーが必要。1人1回'], ['ほか', '家族割（最強家族プログラム）と一緒に使える']], note: '割引は小さい。つながりやすさと家族の合計で比べる。' },
      ]],
      ['UQ mobile', '#ffffff', '#1f4ba5', [
        { camp: 'UQ親子応援割', who: '子ども（5〜18歳）と家族', plan: 'トクトク プラン2', data: '30GBまで', normal: '2,728', base: '4,048', lines: [['自宅セット割', 1100], ['au PAYカードお支払い割', 220]], oyako: ['UQ親子応援割', 1100], after: '1,628', term: '12か月', end: '2,728円（5GB以下の月は 1,628円）', accept: '11/19〜 終了未定',
          conds: [['対象', '5〜18歳のお子さまと、同じ自宅セット割・家族セット割グループの家族（10回線まで）'], ['条件', '受付期間中に対象プランへ加入（新規・MNP・プラン変更・番号移行）'], ['ほか', '適用中は「5GB以下で1,100円引き」はつかない']], note: '子どもも親も、同じ 1,628円まで下がる。' },
        { camp: 'UQ親子応援割', who: '子ども（5〜18歳）と家族', plan: 'コミコミ プランバリュー', data: '35GB', normal: '3,168', base: '3,828', lines: [], oyako: ['UQ親子応援割', 1100], after: '2,728', term: '12か月', end: '3,828円', accept: '11/19〜 終了未定', bonus: '＋300GB', bonusSub: '3年間使える', bonusText: 'データ容量 300GB 追加（3年間使える。コミコミプランバリュー（親子応援プラン）として適用）',
          conds: [['対象', '5〜18歳のお子さまと、同じグループの家族（10回線まで）'], ['条件', '受付期間中に対象プランへ加入（新規・MNP・プラン変更・番号移行）']], note: '上の表の「13か月間 660円引き」と一緒に使えるかは要確認。ここでは入れていない。' },
      ]],
      ['Y!mobile', '#c8102e', '#fff', [
        { camp: 'ワイモバ親子割', who: '子ども（5〜18歳）と家族', plan: 'シンプル3 M', data: '30GB', normal: '1,958', base: '4,378', lines: [['おうち割 光セット(A)', 1650], ['PayPayカード割（ゴールド）', 770]], oyako: ['ワイモバ親子割', 1100], after: '858', term: '1年間', end: '1,958円',  accept: '11/18〜 終了未定',
          conds: [['対象', '申込み時点で5〜18歳のお子さまと、同じ家族割引グループの家族'], ['条件', '新規（MNP・番号移行をふくむ）またはプラン変更'], ['ほか', 'シンプル3 S は対象外']], note: '子どもも親も 858円。UQ と比べるときは、家の合計で見る。' },
        { camp: 'ワイモバ親子割', who: '子ども（5〜18歳）と家族', plan: 'シンプル3 L', data: '35GB', normal: '3,058', base: '5,478', lines: [['おうち割 光セット(A)', 1650], ['PayPayカード割（ゴールド）', 770]], oyako: ['ワイモバ親子割', 1100], after: '1,958', term: '1年間', end: '3,058円', accept: '11/18〜 終了未定',
          conds: [['対象', '申込み時点で5〜18歳のお子さまと、同じ家族割引グループの家族'], ['条件', '新規（MNP・番号移行をふくむ）またはプラン変更'], ['ほか', 'シンプル3 S は対象外']], note: '' },
      ]],
    ];
    const flat = [];
    B.forEach(([brand, bg, fg, cols]) => cols.forEach((c) => flat.push({ brand, bg, fg, c })));
    // 表をつくる。BB：入れる会社、off：flat の何番目からか、sp：スマホ用（上下2段・高さは中身なり）
    const build = (BB, off, sp) => {
      const n = BB.reduce((a, b) => a + b[3].length, 0);
      const z = (v) => (sp ? Math.round(v * 1.3) : v) + 'px';
      const rows = sp ? '64px 92px 92px 112px 76px 28px 112px 60px 84px 76px' : '56px 70px 64px 84px 64px 26px 100px 52px 64px 56px';
      const gridStyle = `display:grid;grid-template-columns:${sp ? 124 : 132}px repeat(${n}, minmax(0,1fr));grid-template-rows:${rows};${sp ? '' : 'height:100%'}`;
      const cells = [];
      const lab = (t, sub) => cells.push({ text: t, sub: sub || '', hasSub: !!sub, subStyle: 'display:block;font-size:' + z(11.5) + ';font-weight:700;margin-top:2px', style: 'background:#1f3d9c;color:#fff;font-weight:900;font-size:' + (sp ? '17px' : '16px') + ';display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;line-height:1.2;' + (sp ? 'word-break:keep-all;' : '') });
      const base = 'background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border-left:1px solid #c9c9c9;border-top:1px solid #dcdcdc;padding:4px 4px;min-width:0;overflow:hidden;overflow-wrap:anywhere;';
      const first = [];
      BB.forEach(([, , , cols]) => cols.forEach((c, j) => first.push(j === 0)));
      const edge = (k) => (first[k] ? 'border-left:6px solid #1f3d9c;' : '');
      const list = [];
      BB.forEach(([, , , cols]) => cols.forEach((c) => list.push(c)));
      const each = (fn) => list.forEach((c, k) => fn(c, k));
      lab('');
      BB.forEach(([name, bg, fg, cols]) => cells.push({ text: name, hasSub: false, style: `grid-column:span ${cols.length};background:${bg};color:${fg};font-weight:900;font-size:${sp ? (cols.length === 1 ? '19px' : '26px') : '22px'};line-height:1.1;text-align:center;display:flex;align-items:center;justify-content:center;border-radius:14px 14px 0 0;border-left:6px solid #1f3d9c` }));
      lab('割引の名前');
      each((c, k) => cells.push({ text: c.camp, hasSub: false, style: base + edge(k) + 'font-weight:800;font-size:' + z(13.5) + ';line-height:1.3;color:' + (c.oyako ? '#145c2b' : '#555') }));
      lab('対象');
      each((c, k) => cells.push({ text: c.who, hasSub: false, style: base + edge(k) + 'font-weight:700;font-size:' + z(12.5) + ';line-height:1.35' }));
      lab('プラン');
      each((c, k) => cells.push({ text: c.plan, sub: c.data, hasSub: !!c.data, subStyle: 'display:block;font-size:' + z(11) + ';font-weight:800;color:#fff;background:#2a8fd6;border-radius:5px;padding:1px 6px;margin-top:4px', style: base + edge(k) + 'font-weight:800;font-size:' + z(14) + ';line-height:1.3' }));
      lab('通常の割引後', '親子割なし');
      each((c, k) => cells.push({ text: c.normal, sub: c.normal === '－' ? '' : '円', hasSub: c.normal !== '－', subStyle: 'font-size:' + z(11) + ';font-weight:800;color:#555', style: base + edge(k) + 'flex-direction:row;align-items:baseline;gap:1px;font-weight:900;font-size:' + z(20) + ';color:#555' }));
      cells.push({ text: '▼', hasSub: false, style: 'background:#1f3d9c;color:#1d7a3a;font-size:18px;display:flex;align-items:center;justify-content:center' });
      each((c, k) => cells.push({ text: '▼', hasSub: false, style: 'background:#fff;color:#1d7a3a;font-size:16px;display:flex;align-items:center;justify-content:center;border-left:1px solid #c9c9c9;' + edge(k) }));
      lab('親子割を使うと', '最安');
      each((c, k) => {
        const ok = /\d/.test(c.after);
        const idx = off + k;
        cells.push({ open: () => this.setState({ pop: idx }), text: c.after, sub: ok ? '円' : '', hasSub: ok, subStyle: 'font-size:' + z(13) + ';font-weight:800;color:#c8102e;margin-left:1px',
          style: base + edge(k) + 'cursor:pointer;flex-direction:row;align-items:baseline;justify-content:center;background:' + (c.oyako ? '#d9f2e1' : (ok ? '#f3f4f6' : '#ffffff')) + ';font-weight:900;font-size:' + (ok ? (sp ? '31px' : z(30)) : z(17)) + ';color:' + (ok ? '#c8102e' : '#555') + (sp ? ';white-space:nowrap;letter-spacing:-0.5px' : '') });
      });
      lab('期間');
      each((c, k) => cells.push({ text: c.term || '－', hasSub: false, style: base + edge(k) + 'font-weight:800;font-size:' + z(13.5) }));
      lab('特典', 'データ増量など');
      each((c, k) => cells.push({ text: c.bonus || '－', sub: c.bonusSub || '', hasSub: !!c.bonusSub, subStyle: 'display:block;font-size:' + z(11) + ';font-weight:700;color:#145c2b;margin-top:2px', style: base + edge(k) + 'font-weight:900;font-size:' + (c.bonus ? z(17) : z(14)) + ';color:' + (c.bonus ? '#145c2b' : '#999') + ';background:' + (c.bonus ? '#eaf7ee' : '#fff') }));
      lab('受付');
      // スマホは「11/19〜 終了未定」をスペースのところで改行する（「終了未／定」と切れないように）
      each((c, k) => cells.push({ text: c.accept, hasSub: false, style: base + edge(k) + (sp && /\s/.test(c.accept) ? 'word-break:keep-all;' : '') + 'font-weight:700;font-size:' + z(12) + ';line-height:1.35;color:' + (/終了未定|〜/.test(c.accept) ? '#b42318' : '#333') }));
      return { gridStyle, cells: cells.map((x) => ({ open: () => {}, ...x })) };
    };
    const all = build(B, 0, false);
    const topB = B.slice(0, 3);
    const topN = topB.reduce((a, b) => a + b[3].length, 0);
    const top = build(topB, 0, true);
    const bot = build(B.slice(3), topN, true);
    const f = flat[st.pop];
    let pop = { lines: [], conds: [] };
    if (f) {
      const c = f.c;
      const yen = (v) => v.toLocaleString();
      const lines = c.lines.map(([k, v]) => ({ k, v: yen(v), bg: 'transparent', fg: '#333', vc: '#1f3d9c', w: 700 }));
      if (c.oyako) lines.push({ k: c.oyako[0], v: yen(c.oyako[1]), bg: '#eaf7ee', fg: '#145c2b', vc: '#1d7a3a', w: 900 });
      pop = {
        brand: f.brand, camp: c.camp, plan: c.plan + (c.data ? '（' + c.data + '）' : ''), who: c.who,
        bg: f.bg === '#ffffff' ? '#f2f2f2' : f.bg, fg: f.bg === '#ffffff' ? f.fg : '#fff',
        base: c.base, lines, after: c.after, term: c.term, end: c.end,
        conds: c.conds.map(([k, v]) => ({ k, v })).concat([{ k: '受付', v: c.accept }]), note: c.note, hasNote: !!c.note,
        bonus: c.bonusText || '', hasBonus: !!c.bonusText,
      };
    }
    return { gridStyle: all.gridStyle, cells: all.cells, gridTop: top.gridStyle, cellsTop: top.cells, gridBot: bot.gridStyle, cellsBot: bot.cells,
      hasPop: !!f, pop, popTop: (st.pop >= topN ? 1100 : 220) + 'px', close: () => this.setState({ pop: null }) };
  }
}
