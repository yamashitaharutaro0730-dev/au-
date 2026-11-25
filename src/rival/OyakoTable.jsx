import React from 'react';
import { DcView, FitBox } from './dc/DcView.jsx';
import oyakoTpl from './dc/oyako.tpl.html?raw';
import oyakoSpTpl from './dc/oyakoSp.tpl.html?raw';
import OyakoLogic from './dc/oyako.logic.js';

// ===== 親子割を使った場合の最安（他社比較 > 料金表の下） =====
// narrow：スマホ幅のとき true（RivalPage の narrow をそのまま渡す）
export default function OyakoTable({ narrow }) {
  return (
    <section className="oy-wrap" style={{ marginTop: 28 }}>
      <div className="rv-title"><h2>親子割を使った場合の最安</h2><span className="rv-pill">2026年11月24日時点・税込</span></div>
      <div className="ev-note">お子さまがいるご家族向けに、親子割・学割を使ったときの最安です。緑の数字を押すと、何が引かれているかと使える条件が出ます。期間が終わると料金が上がるので、期間後の料金もいっしょに伝えてください。</div>
      {narrow
        ? <FitBox width={860} min={0.3}><DcView tpl={oyakoSpTpl} Logic={OyakoLogic} /></FitBox>
        : <FitBox width={1700} min={0.5}><DcView tpl={oyakoTpl} Logic={OyakoLogic} /></FitBox>}
      <div className="rv-ai-note">AI生成（要確認）：AIが2026年11月24日時点の公開情報をもとに作った表です。親子割は受付期間や条件が変わりやすいので、お客様に案内する前に各社の公式で確認してください。</div>
    </section>
  );
}
