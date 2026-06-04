// =========================================================
// 마비노기 물교 & 경매장 계산기 - Cloudflare Workers
// API 키는 wrangler secret put NEXON_API_KEY 로 설정
// =========================================================

// ── 데이터 정의 ────────────────────────────────────────────
const SHOPPING_LIST = {
  "탈틴 농장 달콤 케이크": 3,
  "탈틴 농장 레드문 귀걸이": 3,
  "탈틴 농장 천연 고무": 3,
  "탈틴 농장 재스민 향수": 2,
  "탈틴 농장 장식용 크리스탈 검": 2,
  "남동판": 2,
  "백연판": 2,
  "산딸기 크림 소스 박스": 2,
  "루멘 시럽": 2,
};

const CATEGORIES = {
  "기본 생산품": [
    "탈틴 농장 일반 블랙베리","탈틴 농장 고급 블랙베리","탈틴 농장 최고급 블랙베리",
    "탈틴 농장 일반 오크라","탈틴 농장 고급 오크라","탈틴 농장 최고급 오크라",
    "탈틴 농장 일반 재스민","탈틴 농장 고급 재스민","탈틴 농장 최고급 재스민",
    "탈틴 농장 일반 붉은 배","탈틴 농장 고급 붉은 배","탈틴 농장 최고급 붉은 배",
    "탈틴 농장 일반 고무","탈틴 농장 고급 고무","탈틴 농장 최고급 고무",
    "탈틴 농장 일반 마법 거미줄","탈틴 농장 고급 마법 거미줄","탈틴 농장 최고급 마법 거미줄",
    "탈틴 농장 일반 석영","탈틴 농장 고급 석영","탈틴 농장 최고급 석영",
  ],
  "풍요로운 마법의 솥": [
    "탈틴 농장 블랙베리 주스","탈틴 농장 달콤 케이크","탈틴 농장 붉은 배 잼",
    "탈틴 농장 별무늬 샐러드","탈틴 농장 재스민 향수",
  ],
  "부드러운 마법의 솥": [
    "탈틴 농장 자색 원단","탈틴 농장 꽃무늬 원피스","탈틴 농장 방수 원단",
    "탈틴 농장 강화 섬유","탈틴 농장 이브닝 드레스",
  ],
  "반짝이는 마법의 솥": [
    "탈틴 농장 레드문 귀걸이","탈틴 농장 퓨어 블러썸 머리핀","탈틴 농장 석영 파우더",
    "탈틴 농장 미드나잇 펄 페인트","탈틴 농장 장식용 크리스탈 검",
  ],
  "섬세한 마법의 솥": [
    "탈틴 농장 강력 접착제","탈틴 농장 천연 고무","탈틴 농장 누름꽃 공예 함",
    "탈틴 농장 황혼의 류트","탈틴 농장 새벽의 활",
  ],
};

const DELIVERY_QUESTS = [
  { name:"두갈드 아일 목수의 주문",      limit:7, materials:{"탈틴 농장 일반 블랙베리":1,"탈틴 농장 자색 원단":2,"탈틴 농장 붉은 배 잼":2} },
  { name:"슬리아브 퀼린 광부의 주문",    limit:7, materials:{"탈틴 농장 일반 오크라":1,"탈틴 농장 강력 접착제":1,"탈틴 농장 방수 원단":2} },
  { name:"레자르 양조장 관리인의 주문",  limit:7, materials:{"탈틴 농장 일반 재스민":2,"탈틴 농장 레드문 귀걸이":2,"탈틴 농장 달콤 케이크":1} },
  { name:"탈틴 괴짜 연금술사의 주문",   limit:7, materials:{"탈틴 농장 일반 붉은 배":1,"탈틴 농장 블랙베리 주스":1,"탈틴 농장 석영 파우더":2} },
  { name:"케안 항구 선원의 주문",        limit:7, materials:{"탈틴 농장 일반 고무":2,"탈틴 농장 천연 고무":1,"탈틴 농장 별무늬 샐러드":1} },
  { name:"센마이 상점가 점원의 주문",    limit:7, materials:{"탈틴 농장 일반 마법 거미줄":2,"탈틴 농장 꽃무늬 원피스":1,"탈틴 농장 누름꽃 공예 함":1} },
  { name:"반호르 시계 장인의 주문",      limit:7, materials:{"탈틴 농장 일반 석영":1,"탈틴 농장 퓨어 블러썸 머리핀":1,"탈틴 농장 강화 섬유":1} },
  { name:"이멘 마하 인테리어 전문가의 주문", limit:5, materials:{"탈틴 농장 자색 원단":1,"탈틴 농장 미드나잇 펄 페인트":2,"탈틴 농장 방수 원단":1}, rewardRange:[1,2] },
  { name:"음유시인 캠프 방랑자의 주문",  limit:5, materials:{"탈틴 농장 퓨어 블러썸 머리핀":2,"탈틴 농장 황혼의 류트":1,"탈틴 농장 석영 파우더":1}, rewardRange:[1,2] },
  { name:"던바튼 주민의 주문",           limit:5, materials:{"탈틴 농장 레드문 귀걸이":1,"탈틴 농장 새벽의 활":1,"탈틴 농장 누름꽃 공예 함":1}, rewardRange:[1,2] },
  { name:"오스나 사일 산지기의 주문",    limit:5, materials:{"탈틴 농장 달콤 케이크":1,"탈틴 농장 이브닝 드레스":2,"탈틴 농장 붉은 배 잼":2}, rewardRange:[1,2] },
  { name:"티르코네일 보부상의 주문",     limit:5, materials:{"탈틴 농장 강력 접착제":2,"탈틴 농장 장식용 크리스탈 검":1,"탈틴 농장 천연 고무":2}, rewardRange:[1,2] },
  { name:"카브 항구 의상 디상이어의 주문", limit:5, materials:{"탈틴 농장 블랙베리 주스":2,"탈틴 농장 재스민 향수":1,"탈틴 농장 꽃무늬 원피스":1}, rewardRange:[1,2] },
  { name:"케안 항구 무역 사무원의 주문", limit:5, materials:{"탈틴 농장 별무늬 샐러드":2,"탈틴 농장 새벽의 활":2,"탈틴 농장 이브닝 드레스":2}, rewardRange:[1,3] },
  { name:"아브네아 상점가 점원의 주문",  limit:5, materials:{"탈틴 농장 강화 섬유":2,"탈틴 농장 장식용 크리스탈 검":2,"탈틴 농장 황혼의 류트":2}, rewardRange:[1,3] },
  { name:"타라 '큰손'의 주문",           limit:5, materials:{"탈틴 농장 이브닝 드레스":2,"탈틴 농장 미드나잇 펄 페인트":2,"탈틴 농장 재스민 향수":2}, rewardRange:[1,3] },
  { name:"라흐 왕성 시종의 주문",        limit:5, materials:{"탈틴 농장 재스민 향수":2,"탈틴 농장 장식용 크리스탈 검":2,"탈틴 농장 새벽의 활":2}, rewardRange:[1,3] },
];

const UPGRADE_ITEMS = { "벽돌":10000, "철판":20000, "도료":30000, "유리":40000 };
const KEY_VALUE = 25000;

const SPECIAL_ITEMS = [
  "노랑망태버섯","설련화","브리움 우유","카넬리안","여울 이삭",
  "아벤츄린","밀키쿼츠","남동석","악마의 손가락","산딸기",
  "적철석","신비한 깃털","루멘 플랜트","힐웬 광정","실리엔 응축핵",
  "월광 당근","백연석","마력 심재핵","빛나는 양털"
];

// ── API 헬퍼 ───────────────────────────────────────────────
async function fetchPrice(itemName, apiKey) {
  const url = `https://open.api.nexon.com/mabinogi/v1/auction/list?item_name=${encodeURIComponent(itemName)}`;
  try {
    const res = await fetch(url, { headers: { "x-nxopen-api-key": apiKey, "accept": "application/json" } });
    if (!res.ok) return 0;
    const data = await res.json();
    const items = data.auction_item || [];
    if (!items.length) return 0;
    items.sort((a, b) => a.auction_price_per_unit - b.auction_price_per_unit);
    return items[0].auction_price_per_unit;
  } catch { return 0; }
}

// 자동 업데이트 대상인 일반 탈농템 시세만 조회 (약 45개로 서브리퀘스트 제한 우회)
async function fetchAutoPrices(apiKey, kv) {
  let price_map = {};
  if (kv) {
    try {
      const cached = await kv.get("all_prices");
      if (cached) price_map = JSON.parse(cached);
    } catch {}
  }

  const autoItems = new Set();
  for (const items of Object.values(CATEGORIES)) items.forEach(i => autoItems.add(i));
  for (const q of DELIVERY_QUESTS) Object.keys(q.materials).forEach(i => autoItems.add(i));
  Object.keys(SHOPPING_LIST).forEach(i => {
    if (!SPECIAL_ITEMS.includes(i)) autoItems.add(i);
  });

  const items = [...autoItems];
  const chunkSize = 5;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const results = await Promise.all(chunk.map(async item => [item, await fetchPrice(item, apiKey)]));
    results.forEach(([item, price]) => { if (price > 0 || !price_map[item]) price_map[item] = price; });
  }

  if (kv) {
    try { await kv.put("all_prices", JSON.stringify(price_map)); } catch {}
  }
  return price_map;
}

// 수동 버튼 클릭 시 호출될 특화 채집 19개 아이템 전용 새로고침 로직
async function refreshSpecialPrices(apiKey, kv) {
  let price_map = {};
  if (kv) {
    try {
      const cached = await kv.get("all_prices");
      if (cached) price_map = JSON.parse(cached);
    } catch {}
  }

  const chunkSize = 5;
  for (let i = 0; i < SPECIAL_ITEMS.length; i += chunkSize) {
    const chunk = SPECIAL_ITEMS.slice(i, i + chunkSize);
    const results = await Promise.all(chunk.map(async item => [item, await fetchPrice(item, apiKey)]));
    results.forEach(([item, price]) => { if (price > 0 || !price_map[item]) price_map[item] = price; });
  }

  if (kv) {
    try { await kv.put("all_prices", JSON.stringify(price_map)); } catch {}
  }
  return price_map;
}

// ── 유틸 ───────────────────────────────────────────────────
const fmt = n => Number(n).toLocaleString("ko-KR");

// ── HTML 빌더 ──────────────────────────────────────────────
function buildPage(prices, fetchedAt) {
  // 섹션0: 납품 손익
  const questCards = DELIVERY_QUESTS.map(q => {
    const cost = Object.entries(q.materials).reduce((s,[k,v]) => s + (prices[k]||0)*v, 0);
    const missing = Object.keys(q.materials).filter(k => !prices[k]);
    const range = q.rewardRange || [1,1];
    const isFixed = range[0] === range[1];
    const rangeLabel = isFixed ? "열쇠·업템 각 1개 고정" : `열쇠 ${range[0]} ~ ${range[1]}개 / 업템 ${range[0]} ~ ${range[1]}개`;
    const missingHtml = missing.length ? `<div class="warn">⚠️ 매물없음: ${missing.map(m=>m.replace("탈틴 농장 ","")).join(", ")}</div>` : "";

    const keyOpts = isFixed ? `<span class="fixed-badge">1개 고정</span>` :
      Array.from({length: range[1]-range[0]+1}, (_,i) => range[0]+i)
        .map(n => `<label class="rbtn"><input type="radio" name="key_${q.name}" value="${n}" ${n===range[0]?"checked":""}> ${n}개</label>`).join("");

    const upgTypeOpts = Object.entries(UPGRADE_ITEMS)
      .map(([k,v]) => `<label class="rbtn"><input type="radio" name="upg_type_${q.name}" value="${v}" ${k==="벽돌"?"checked":""}> ${k}(${v/10000}만G)</label>`).join("");

    const upgCntOpts = isFixed ? `<span class="fixed-badge">1개 고정</span>` :
      Array.from({length: range[1]-range[0]+1}, (_,i) => range[0]+i)
        .map(n => `<label class="rbtn"><input type="radio" name="upg_cnt_${q.name}" value="${n}" ${n===range[0]?"checked":""}> ${n}개</label>`).join("");

    const safeId = q.name.replace(/[^a-zA-Z0-9가-힣]/g, "_");

    return `
<div class="quest-card">
  <div class="quest-header">
    <div class="quest-name">
      <strong>${q.name}</strong>
      <div class="mat-tags" style="margin-top:5px;">${Object.entries(q.materials).map(([k,v]) => `<span class="mat-tag">${k.replace("탈틴 농장 ","")} <b>${v}개</b></span>`).join("")}</div>
      ${missingHtml}
    </div>
    <div class="quest-meta"><span class="meta-label">납품 횟수</span><strong>${q.limit}회</strong></div>
    <div class="quest-meta"><span class="meta-label">1회 재료비</span><strong>${fmt(cost)} G</strong></div>
    <div class="quest-meta"><span class="meta-label">보상 범위</span><strong>${rangeLabel}</strong></div>
  </div>
  <details class="sim-details">
    <summary>🎲 보상 시뮬레이터</summary>
    <div class="sim-body" id="sim_${safeId}" data-cost="${cost}">
      <div class="sim-col">
        <div class="sim-label">🗝️ 열쇠 개수</div>
        <div class="rbtn-group" data-group="key_${safeId}">${keyOpts}</div>
      </div>
      <div class="sim-col wide">
        <div class="sim-label">🧱 업그레이드 템 종류</div>
        <div class="rbtn-group" data-group="upg_type_${safeId}">${upgTypeOpts.replace(/name="upg_type_[^"]+"/g, `name="upg_type_${safeId}"`)}</div>
        <div class="sim-label" style="margin-top:8px">🔢 업그레이드 템 개수</div>
        <div class="rbtn-group" data-group="upg_cnt_${safeId}">${upgCntOpts.replace(/name="upg_cnt_[^"]+"/g, `name="upg_cnt_${safeId}"`)}</div>
      </div>
      <div class="sim-col result-col" id="result_${safeId}">
        <div class="sim-label">📊 결과</div>
        <div>재료비 <strong>${fmt(cost)} G</strong></div>
        <div id="reward_${safeId}">보상 합계 <strong>—</strong></div>
        <div id="profit_${safeId}" class="profit-big">—</div>
      </div>
    </div>
  </details>
</div>`;
  }).join("");

  // 섹션1: 6티어 재료 목록
  const shoppingRows = Object.entries(SHOPPING_LIST).map(([name, cnt]) => {
    const p = prices[name] || 0;
    return `<tr><td>${name}</td><td class="num">${p ? fmt(p)+" G" : "매물없음"}</td><td class="num">${cnt}개</td><td class="num">${fmt(p*cnt)} G</td></tr>`;
  }).join("");
  const shoppingTotal = Object.entries(SHOPPING_LIST).reduce((s,[k,v]) => s+(prices[k]||0)*v, 0);

  // 섹션5: 탈농 시세
  const IMG_BASE = "https://raw.githubusercontent.com/RedMacaron/Mabi-NewCalculator/main/images/";
  const itemImg = (name) => {
    const encoded = encodeURIComponent(name + ".png");
    return `<img src="${IMG_BASE}${encoded}" onerror="this.style.display='none'" style="width:28px;height:28px;object-fit:contain;margin-right:8px;vertical-align:middle;">`;
  };

  const farmBasic = CATEGORIES["기본 생산품"].map(item => {
    const p = prices[item] || 0;
    return `<div class="item-row">${itemImg(item)}<span>${item.replace("탈틴 농장 ","")}</span><strong>${fmt(p)} G</strong></div>`;
  }).join("");

  const makeCatHtml = (catName) => {
    return CATEGORIES[catName].map(item => {
      const p = prices[item] || 0;
      return `<div class="item-row">${itemImg(item)}<span>${item.replace("탈틴 농장 ","")}</span><strong>${fmt(p)} G</strong></div>`;
    }).join("");
  };

  // 섹션6: 특화 채집 시세 카드화 로직 (id속성 추가 부여)
  const specialHtml = SPECIAL_ITEMS.map(item => {
    const p = prices[item] || 0;
    const safeItemName = item.replace(/[^a-zA-Z0-9가-힣]/g, "_");
    return `<div class="item-row" id="spec_row_${safeItemName}">${itemImg(item)}<span>${item}</span><strong id="spec_price_${safeItemName}">${p ? fmt(p)+" G" : "매물없음"}</strong></div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>💰 마비노기 물교 &amp; 경매장 계산기</title>
<style>
:root {
  --bg: #1a1c24; --card: #2d303d; --border: #4a4d5e;
  --text: #e0e0e0; --text2: #aaaaaa; --accent: #00ffc8;
  --red: #ff6b6b; --yellow: #ffd166;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); color: var(--text); font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; font-size: 14px; line-height: 1.6; }
.container { max-width: 1200px; margin: 0 auto; padding: 20px 16px; }
h1 { font-size: 24px; color: #fff; margin-bottom: 24px; }
h2 { font-size: 18px; color: #fff; margin: 32px 0 12px; padding-bottom: 6px; border-bottom: 1px solid var(--border); }
h3 { font-size: 15px; color: var(--accent); margin: 16px 0 8px; }
.info-bar { display:flex; align-items:center; gap:12px; margin-bottom:12px; font-size:12px; color:var(--text2); }
.refresh-btn { background: var(--card); border: 1px solid var(--border); color: var(--text); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; }
.refresh-btn:hover { background: var(--border); }
.special-refresh-btn { background: #1f3d37; border: 1px solid var(--accent); color: var(--accent); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; }
.special-refresh-btn:hover { background: var(--accent); color: #000; }
hr { border: none; border-top: 1px solid var(--border); margin: 28px 0; }

.quest-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 10px; overflow: hidden; }
.quest-header { display: grid; grid-template-columns: 3fr 1fr 1.5fr 1.5fr; gap: 12px; padding: 12px 16px; align-items: start; }
.quest-name strong { font-size: 14px; color: #fff; }
.warn { font-size: 11px; color: var(--red); margin-top: 2px; }
.meta-label { display: block; font-size: 11px; color: var(--text2); margin-bottom: 2px; }
.quest-meta strong { font-size: 14px; color: #fff; }

.sim-details summary { padding: 8px 16px; cursor: pointer; font-size: 13px; color: var(--accent); background: rgba(0,0,0,0.2); user-select: none; }
.sim-details summary:hover { background: rgba(0,0,0,0.3); }
.sim-body { display: flex; gap: 16px; padding: 14px 16px; flex-wrap: wrap; }
.sim-col { min-width: 120px; }
.sim-col.wide { flex: 1; min-width: 200px; }
.sim-col.result-col { min-width: 160px; background: rgba(0,0,0,0.2); border-radius: 6px; padding: 10px; }
.sim-label { font-size: 12px; color: var(--text2); margin-bottom: 6px; }
.rbtn-group { display: flex; flex-wrap: wrap; gap: 6px; }
.rbtn { display: inline-flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 16px; padding: 4px 10px; cursor: pointer; font-size: 12px; }
.rbtn input { accent-color: var(--accent); }
.fixed-badge { font-size: 12px; color: var(--text2); padding: 4px 8px; }
.profit-big { font-size: 18px; font-weight: bold; margin-top: 8px; }

table { width: 100%; border-collapse: collapse; margin-top: 8px; }
th { background: #31333f; color: #fff; padding: 8px 12px; text-align: left; font-size: 13px; }
td { padding: 7px 12px; border-bottom: 1px solid var(--border); font-size: 13px; }
td.num { text-align: right; }
tr:hover td { background: rgba(255,255,255,0.03); }
.total-row { background: rgba(0,255,200,0.05); font-weight: bold; }

.item-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-radius: 6px; background: rgba(150,150,150,0.08); margin-bottom: 4px; }
.item-row span { flex: 1; }
.item-row strong { color: #fff; white-space: nowrap; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.cat-block { margin-bottom: 16px; }

.tab-btns { display: flex; gap: 8px; margin-bottom: 16px; }
.tab-btn { padding: 8px 18px; border: 1px solid var(--border); border-radius: 6px; background: var(--card); color: var(--text); cursor: pointer; font-size: 13px; }
.tab-btn.active { background: var(--accent); color: #000; border-color: var(--accent); font-weight: bold; }
.tab-content { display: none; }
.tab-content.active { display: block; }
.ref-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.ref-section h4 { color: var(--accent); margin-bottom: 8px; font-size: 14px; }
.ref-section p { color: var(--text2); font-size: 13px; margin-bottom: 2px; }
.ref-section strong { color: #fff; }

.cart-form { display: flex; gap: 8px; margin-bottom: 12px; align-items: flex-end; }
.cart-form input[type=text] { flex: 1; background: #3f404d; border: 1px solid var(--border); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px; }
.cart-form input[type=number] { width: 80px; background: #3f404d; border: 1px solid var(--border); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px; }
.btn-primary { background: var(--accent); color: #000; border: none; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px; }
.btn-primary:hover { opacity: 0.85; }
.btn-secondary { background: var(--card); border: 1px solid var(--border); color: var(--text); padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; }
.cart-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border); }
.cart-item span { flex: 1; }
.del-btn { background: #4a1a1a; color: var(--red); border: none; padding: 2px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; }
#cart-result { margin-top: 12px; }
.metric-box { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 12px 18px; display: inline-block; margin-right: 10px; margin-bottom: 8px; }
.metric-box .m-label { font-size: 11px; color: var(--text2); }
.metric-box .m-val { font-size: 22px; font-weight: bold; color: var(--accent); }

.quest-check-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.quest-check-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; }
.quest-check-card label { cursor: pointer; font-size: 14px; color: #fff; }
.mat-tags { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; }
.mat-tag { background: rgba(150,150,150,0.1); border: 1px solid rgba(150,150,150,0.2); border-radius: 12px; padding: 3px 10px; font-size: 12px; color: #aaa; }
.multiplier-row { display: flex; align-items: center; gap: 10px; margin: 12px 0; }
.multiplier-row label { font-size: 13px; }
.multiplier-row input { width: 80px; background: #3f404d; border: 1px solid var(--border); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 13px; }

@media (max-width: 700px) {
  .quest-header { grid-template-columns: 1fr 1fr; }
  .ref-grid, .quest-check-grid { grid-template-columns: 1fr; }
  .grid-3, .grid-4 { grid-template-columns: 1fr 1fr; }
  .grid-2 { grid-template-columns: 1fr; }
}
</style>
</head>
<body>
<div class="container">
<h1>💰 마비노기 물교 &amp; 경매장 계산기</h1>

<h2>🏆 납품 퀘스트 손익 분석</h2>
<div class="info-bar">
  <button class="refresh-btn" onclick="location.reload()">🔄 탈농템 새로고침</button>
  <span>조회: ${fetchedAt} | 열쇠 25,000G / 업템: 벽돌 1만·철판 2만·도료 3만·유리 4만</span>
</div>
${questCards}

<hr>

<h2>📅 이번 주 물교 6티어 재료</h2>
<table>
  <thead><tr><th>아이템</th><th class="num">최저가</th><th class="num">수량</th><th class="num">합계</th></tr></thead>
  <tbody>
    ${shoppingRows}
    <tr class="total-row"><td colspan="3">총 합계</td><td class="num">${fmt(shoppingTotal)} G</td></tr>
    <tr class="total-row"><td colspan="3">1/N (절반)</td><td class="num">${fmt(Math.floor(shoppingTotal/2))} G</td></tr>
  </tbody>
</table>

<hr>

<h2>📈 탈틴 농장 실시간 시세</h2>
<h3>기본 생산품</h3>
<div class="grid-3">${farmBasic}</div>
<div class="grid-2" style="margin-top:16px;">
  <div>
    <div class="cat-block"><h3>풍요로운 마법의 솥</h3>${makeCatHtml("풍요로운 마법의 솥")}</div>
    <div class="cat-block"><h3>반짝이는 마법의 솥</h3>${makeCatHtml("반짝이는 마법의 솥")}</div>
  </div>
  <div>
    <div class="cat-block"><h3>부드러운 마법의 솥</h3>${makeCatHtml("부드러운 마법의 솥")}</div>
    <div class="cat-block"><h3>섬세한 마법의 솥</h3>${makeCatHtml("섬세한 마법의 솥")}</div>
  </div>
</div>

<hr>

<h2>💎 특화 채집 실시간 시세</h2>
<div class="info-bar">
  <button class="special-refresh-btn" id="btn-special-refresh" onclick="refreshSpecialClient()">⚡ 특화채집 시세만 새로고침</button>
  <span id="special-status-text">특화채집은 위 버튼을 누를 때만 실시간 갱신됩니다.</span>
</div>
<div class="grid-4">${specialHtml}</div>

<hr>

<h2>📦 생활 협회 납품 퀘스트 계산기</h2>
<div style="display:flex;gap:8px;margin-bottom:10px;">
  <button class="btn-primary" onclick="checkAll(true)">전체 선택</button>
  <button class="btn-secondary" onclick="checkAll(false)">전체 해제</button>
</div>
<div class="quest-check-grid" id="quest-check-grid"></div>
<div class="multiplier-row">
  <label>계산 배수:</label>
  <input type="number" id="multiplier" value="1" min="1">
</div>
<button class="btn-primary" onclick="calcQuests()">🚀 견적 확인하기</button>
<div id="quest-result" style="margin-top:14px;"></div>

<hr>
<p style="color:var(--text2);font-size:12px;text-align:center;">Data based on NEXON Open API</p>
</div>

<script>
const PRICES = ${JSON.stringify(prices)};
const QUESTS = ${JSON.stringify(DELIVERY_QUESTS)};
const UPGRADE_ITEMS = ${JSON.stringify(UPGRADE_ITEMS)};
const KEY_VALUE = ${KEY_VALUE};

const fmt = n => Number(n).toLocaleString("ko-KR");

// 클라이언트 사이드 비동기 특화 채집 새로고침 기능
async function refreshSpecialClient() {
  const btn = document.getElementById("btn-special-refresh");
  const status = document.getElementById("special-status-text");
  btn.disabled = true;
  btn.innerText = "🔄 시세 수집 중 (약 5초)...";
  status.innerText = "넥슨 open API에서 특화 채집 19종을 따로 수집하고 있습니다...";

  try {
    const res = await fetch("/api/refresh-special");
    if (res.ok) {
      const newPrices = await res.json();
      Object.assign(PRICES, newPrices);
      
      // 화면의 특화 채집 가격 요소 동적 갱신
      for (const [item, price] of Object.entries(newPrices)) {
        const safeId = item.replace(/[^a-zA-Z0-9가-힣]/g, "_");
        const priceEl = document.getElementById("spec_price_" + safeId);
        if (priceEl) {
          priceEl.innerText = price ? fmt(price) + " G" : "매물없음";
        }
      }
      status.innerText = "✨ 특화 채집 시세 갱신 완료!";
    } else {
      status.innerText = "❌ 갱신 중 서버 오류가 발생했습니다.";
    }
  } catch (e) {
    status.innerText = "❌ 네트워크 연결 오류가 발생했습니다.";
  } finally {
    btn.disabled = false;
    btn.innerText = "⚡ 특화채집 시세만 새로고침";
  }
}

// ── 보상 시뮬레이터 ──
document.addEventListener("change", function(e) {
  const input = e.target;
  if (!input.matches("input[type=radio]")) return;
  const simBody = input.closest(".sim-body");
  if (!simBody) return;
  updateSim(simBody);
});

function updateSim(simBody) {
  const id = simBody.id.replace("sim_", "");
  const cost = parseInt(simBody.dataset.cost) || 0;

  const keyInput = simBody.querySelector('input[name^="key_"]:checked');
  const upgTypeInput = simBody.querySelector('input[name^="upg_type_"]:checked');
  const upgCntInput = simBody.querySelector('input[name^="upg_cnt_"]:checked');

  const keyVal = keyInput ? parseInt(keyInput.value) : 1;
  const upgTypeVal = upgTypeInput ? parseInt(upgTypeInput.value) : 10000;
  const upgCntVal = upgCntInput ? parseInt(upgCntInput.value) : 1;

  const reward = KEY_VALUE * keyVal + upgTypeVal * upgCntVal;
  const profit = reward - cost;
  const color = profit > 0 ? "#00ffc8" : profit < 0 ? "#ff6b6b" : "#ffd166";
  const label = profit > 0 ? "🟢 +" + fmt(profit) + " G" : profit < 0 ? "🔴 " + fmt(profit) + " G" : "⚪ 0 G";

  const rewardEl = simBody.querySelector('[id^="reward_"]');
  const profitEl = simBody.querySelector('[id^="profit_"]');
  if (rewardEl) rewardEl.innerHTML = "보상 합계 <strong>" + fmt(reward) + " G</strong>";
  if (profitEl) { profitEl.textContent = label; profitEl.style.color = color; }
}

document.querySelectorAll(".sim-body").forEach(updateSim);

function buildQuestChecks() {
  const grid = document.getElementById("quest-check-grid");
  grid.innerHTML = QUESTS.map(q => {
    const tags = Object.entries(q.materials).map(([k,v]) =>
      \`<span class="mat-tag">\${k.replace("탈틴 농장 ","")} \${v}개</span>\`).join("");
    return \`<div class="quest-check-card">
      <label><input type="checkbox" id="chk_\${q.name}" checked> \${q.name} (납품 \${q.limit}회)</label>
      <div class="mat-tags">\${tags}</div>
    </div>\`;
  }).join("");
}
function checkAll(val) {
  QUESTS.forEach(q => { const el = document.getElementById("chk_"+q.name); if(el) el.checked = val; });
}
async function calcQuests() {
  const multiplier = parseInt(document.getElementById("multiplier").value) || 1;
  const selected = QUESTS.filter(q => document.getElementById("chk_"+q.name)?.checked);
  if (!selected.length) { alert("퀘스트를 선택해주세요!"); return; }

  const agg = {};
  selected.forEach(q => {
    Object.entries(q.materials).forEach(([mat, cnt]) => {
      agg[mat] = (agg[mat] || 0) + cnt * q.limit * multiplier;
    });
  });

  const res = document.getElementById("quest-result");
  res.innerHTML = "<p style='color:var(--text2)'>조회 중...</p>";
  const rows = await Promise.all(Object.entries(agg).map(async ([name, cnt]) => {
    const p = PRICES[name] || await fetchPriceClient(name);
    return { name, cnt, price: p };
  }));
  const total = rows.reduce((s,r) => s + r.price * r.cnt, 0);
  res.innerHTML = \`
    <div class="metric-box"><div class="m-label">총 예상 구매 비용</div><div class="m-val">\${fmt(total)} G</div></div>
    <table><thead><tr><th>재료명</th><th class="num">최저가</th><th class="num">필요 수량</th><th class="num">합계</th></tr></thead>
    <tbody>\${rows.map(r => \`<tr><td>\${r.name}</td><td class="num">\${r.price ? fmt(r.price)+" G" : "매물없음"}</td><td class="num">\${r.cnt}개</td><td class="num">\${fmt(r.price*r.cnt)} G</td></tr>\`).join("")}</tbody></table>\`;
}

async function fetchPriceClient(itemName) {
  try {
    const res = await fetch("/api/price?item=" + encodeURIComponent(itemName));
    const data = await res.json();
    return data.price || 0;
  } catch { return 0; }
}

buildQuestChecks();
</script>
</body>
</html>`;
}

// ── API 라우터 ─────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const apiKey = env.NEXON_API_KEY;

    // /api/refresh-special — 특화 채집 19개만 수동 갱신하는 비동기 API 엔드포인트
    if (url.pathname === "/api/refresh-special") {
      const prices = await refreshSpecialPrices(apiKey, env.MABI_CACHE);
      return new Response(JSON.stringify(prices), {
        headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (url.pathname === "/api/price") {
      const item = url.searchParams.get("item");
      if (!item) return new Response(JSON.stringify({ price: 0 }), { headers: { "content-type": "application/json" } });
      const price = await fetchPrice(item, apiKey);
      return new Response(JSON.stringify({ price }), {
        headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 메인 로딩 시에는 오직 탈농템+쇼핑리스트만 자동 조회하여 50회 하드리밋 절대 방지
    const prices = await fetchAutoPrices(apiKey, env.MABI_CACHE);
    const now = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Seoul" });
    const html = buildPage(prices, now);

    return new Response(html, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }
};
