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
  { name:"석영 집중 주문",              limit:7, materials:{"탈틴 농장 일반 석영":3}, keyOnly:true },
  { name:"마법 거미줄 집중 주문",       limit:7, materials:{"탈틴 농장 일반 마법 거미줄":3}, keyOnly:true },
  { name:"고무 집중 주문",              limit:7, materials:{"탈틴 농장 일반 고무":6}, keyOnly:true },
  { name:"붉은 배 집중 주문",           limit:7, materials:{"탈틴 농장 일반 붉은 배":6}, keyOnly:true },
  { name:"재스민 집중 주문",            limit:9, materials:{"탈틴 농장 일반 재스민":9}, upgOnly:true },
  { name:"오크라 집중 주문",            limit:9, materials:{"탈틴 농장 일반 오크라":12}, upgOnly:true },
  { name:"블랙베리 집중 주문",          limit:10, materials:{"탈틴 농장 일반 블랙베리":18}, upgOnly:true },
  { name:"코리브 계곡 여행 가이드의 주문", limit:3, materials:{"탈틴 농장 자색 원단":2,"탈틴 농장 강력 접착제":2}, keyOnly:true },
  { name:"탈틴 화가의 주문",            limit:3, materials:{"탈틴 농장 블랙베리 주스":2,"탈틴 농장 레드문 귀걸이":2}, keyOnly:true },
  { name:"티르 코네일 주민의 주문",     limit:10, materials:{"탈틴 농장 일반 고무":3,"탈틴 농장 일반 블랙베리":6}, upgOnly:true },
  { name:"반호르 대장장이의 주문",      limit:10, materials:{"탈틴 농장 일반 붉은 배":2,"탈틴 농장 일반 석영":2}, upgOnly:true },
  { name:"드래곤 유적 고고학자의 주문", limit:10, materials:{"탈틴 농장 일반 오크라":4,"탈틴 농장 일반 마법 거미줄":2}, upgOnly:true },
  { name:"던바튼 학교 선생님의 주문",   limit:10, materials:{"탈틴 농장 일반 블랙베리":7,"탈틴 농장 일반 재스민":5}, upgOnly:true },
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
  { name:"카브 항구 의상 디자이너의 주문", limit:5, materials:{"탈틴 농장 블랙베리 주스":2,"탈틴 농장 재스민 향수":1,"탈틴 농장 꽃무늬 원피스":1}, rewardRange:[1,2] },
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
  const questCards = DELIVERY_QUESTS.map(q => {
    const cost = Object.entries(q.materials).reduce((s,[k,v]) => s + (prices[k]||0)*v, 0);
    const missing = Object.keys(q.materials).filter(k => !prices[k]);
    const range = q.rewardRange || [1,1];
    const isFixed = range[0] === range[1];
    const keyOnly = !!q.keyOnly;   // 열쇠만 보상
    const upgOnly = !!q.upgOnly;   // 업그레이드 템만 보상

    let rangeLabel = "";
    if (keyOnly) rangeLabel = "열쇠 1개 고정";
    else if (upgOnly) rangeLabel = "업그레이드 템 1개";
    else if (isFixed) rangeLabel = "열쇠·업템 각 1개 고정";
    else rangeLabel = `열쇠 ${range[0]} ~ ${range[1]}개 / 업템 ${range[0]} ~ ${range[1]}개`;

    const missingHtml = missing.length ? `<div class="warn">⚠️ 매물없음: ${missing.map(m=>m.replace("탈틴 농장 ","")).join(", ")}</div>` : "";

    const safeId = q.name.replace(/[^a-zA-Z0-9가-힣]/g, "_");

    // 열쇠 섹션
    const keySection = keyOnly || (!upgOnly)
      ? `<div class="sim-col">
          <div class="sim-label">🗝️ 열쇠 개수</div>
          <div class="rbtn-group"><span class="fixed-badge">1개 고정</span></div>
        </div>`
      : "";

    // 업그레이드 템 섹션
    const upgTypeOpts = Object.entries(UPGRADE_ITEMS)
      .map(([k,v]) => `<label class="rbtn"><input type="radio" name="upg_type_${safeId}" value="${v}" ${k==="벽돌"?"checked":""}> ${k}(${v/10000}만G)</label>`).join("");
    const upgSection = upgOnly || (!keyOnly)
      ? `<div class="sim-col wide">
          <div class="sim-label">🧱 업그레이드 템 종류</div>
          <div class="rbtn-group">${upgTypeOpts}</div>
          <div class="sim-label" style="margin-top:8px">🔢 업그레이드 템 개수</div>
          <div class="rbtn-group"><span class="fixed-badge">1개 고정</span></div>
        </div>`
      : "";

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
    <div class="sim-body" id="sim_${safeId}" data-cost="${cost}" data-key-only="${keyOnly}" data-upg-only="${upgOnly}">
      ${keySection}
      ${upgSection}
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

  const shoppingRows = Object.entries(SHOPPING_LIST).map(([name, cnt]) => {
    const p = prices[name] || 0;
    return `<tr><td>${name}</td><td class="num">${p ? fmt(p)+" G" : "매물없음"}</td><td class="num">${cnt}개</td><td class="num">${fmt(p*cnt)} G</td></tr>`;
  }).join("");
  const shoppingTotal = Object.entries(SHOPPING_LIST).reduce((s,[k,v]) => s+(prices[k]||0)*v, 0);

  const IMG_BASE = "https://raw.githubusercontent.com/RedMacaron/Mabi-NewCalculator/main/images/";
  const itemImg = (name) => {
    const encoded = encodeURIComponent(name + ".png");
    return `<img src="${IMG_BASE}${encoded}" onerror="this.style.display='none'" style="width:28px;height:28px;object-fit:contain;margin-right:8px;vertical-align:middle;">`;
  };

  const farmBasic = CATEGORIES["기본 생산품"].map(item => {
    const p = prices[item] || 0;
    return `<div class="item-row">${itemImg(item)}<span>${item.replace("탈틴 농장 ","")}</span><strong>${fmt(p)} G</strong></div>`;
  }).join("");

  const makeCatHtml = (catName) => CATEGORIES[catName].map(item => {
    const p = prices[item] || 0;
    return `<div class="item-row">${itemImg(item)}<span>${item.replace("탈틴 농장 ","")}</span><strong>${fmt(p)} G</strong></div>`;
  }).join("");

  const specialHtml = SPECIAL_ITEMS.map(item => {
    const p = prices[item] || 0;
    const safeItemName = item.replace(/[^a-zA-Z0-9가-힣]/g, "_");
    return `<div class="item-row" id="spec_row_${safeItemName}">${itemImg(item)}<span>${item}</span><strong id="spec_price_${safeItemName}">${p ? fmt(p)+" G" : "매물없음"}</strong></div>`;
  }).join("");

  // 그래프용 체크박스 옵션 생성
  const farmCats = ["기본 생산품","풍요로운 마법의 솥","부드러운 마법의 솥","반짝이는 마법의 솥","섬세한 마법의 솥"];
  const farmGraphItems = farmCats.flatMap(c => CATEGORIES[c]);
  const graphFarmOpts = farmGraphItems.map(item =>
    `<label class="graph-chk"><input type="checkbox" name="graph_item" value="${item}"> ${item.replace("탈틴 농장 ","")}</label>`
  ).join("");
  const graphSpecialOpts = SPECIAL_ITEMS.map(item =>
    `<label class="graph-chk"><input type="checkbox" name="graph_item" value="${item}"> ${item}</label>`
  ).join("");

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
.info-bar { display:flex; align-items:center; gap:12px; margin-bottom:12px; font-size:12px; color:var(--text2); flex-wrap:wrap; }
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
.graph-chk { display:inline-flex; align-items:center; gap:4px; background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:12px; padding:3px 10px; cursor:pointer; font-size:12px; white-space:nowrap; }
.graph-chk input { accent-color:var(--accent); }
.graph-chk:has(input:checked) { background:rgba(0,255,200,0.12); border-color:var(--accent); color:var(--accent); }
select { background: #3f404d; border: 1px solid var(--border); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px; }
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

<!-- 섹션 0: 납품 손익 분석 -->
<h2>🏆 납품 퀘스트 손익 분석</h2>
<div class="info-bar">
  <button class="refresh-btn" onclick="location.reload()">🔄 탈농템 새로고침</button>
  <span>조회: ${fetchedAt} | 열쇠 25,000G / 업템: 벽돌 1만·철판 2만·도료 3만·유리 4만</span>
</div>
${questCards}

<hr>

<!-- 섹션 1: 6티어 재료 -->
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

<!-- 섹션 2: 장바구니 -->
<h2>🔍 개별 품목 검색 (장바구니)</h2>
<div class="cart-form">
  <input type="text" id="cart-name" placeholder="아이템 이름">
  <input type="number" id="cart-cnt" value="1" min="1">
  <button class="btn-primary" onclick="cartAdd()">추가 ➕</button>
</div>
<div id="cart-list"></div>
<div style="margin-top:8px;display:flex;gap:8px;">
  <button class="btn-primary" onclick="cartCalc()">🔎 견적 확인</button>
  <button class="btn-secondary" onclick="cartClear()">🗑️ 목록 비우기</button>
</div>
<div id="cart-result"></div>

<hr>

<!-- 섹션 3: 물물교환 참고표 -->
<h2>📚 물물교환 재료 참고표</h2>
<p style="color:var(--text2);font-size:13px;margin-bottom:12px;">
  💡 6티어는 본인 특화는 자급, 나머지는 경매장 구매 추천!<br>
  그랜마 상인 + 윌리엄or교역파트너 부유선(6티어탈농만루트) + 임프의 고급 보증서(필수!) → 탈틴 or 티르코네일 판매
</p>
<div class="tab-btns">
  <button class="tab-btn active" onclick="switchTab('tab2',this)">🛠️ 6티어 탈농만 루트</button>
  <button class="tab-btn" onclick="switchTab('tab1',this)">📚 기존 표준 루트</button>
</div>
<div id="tab2" class="tab-content active">
  <div class="ref-grid">
    <div class="ref-section">
      <h4>🧪 포션 &amp; 목공</h4>
      <p>생명력 500 포션 <strong>14개</strong></p><p>정령의 리큐르 <strong>7개</strong></p>
      <p>최고급 나무장작 <strong>9개</strong></p><p>특급 나무장작 <strong>9개</strong></p><p>중급 나무장작 <strong>35개</strong></p>
      <p>건초더미 <strong>9개</strong></p><p>독묻은 와이번 볼트 <strong>9개</strong></p>
      <br><p style="color:var(--accent);font-size:12px;">🛒 윌리엄or교역파트너 + 부유선 (페라→칼리다→오아시스→카루)</p>
      <table style="margin-top:6px;font-size:12px;">
        <tr><th>교역소</th><th>4T</th><th>5T</th><th>6T</th></tr>
        <tr><td>페라</td><td>7개</td><td>3개</td><td>-</td></tr>
        <tr><td>칼리다</td><td>7개</td><td>3개</td><td>-</td></tr>
        <tr><td>오아시스</td><td>7개</td><td>3개</td><td>2개</td></tr>
        <tr><td>카루</td><td>7개</td><td>3개</td><td>3개</td></tr>
      </table>
    </div>
    <div class="ref-section">
      <h4>🧵 방직 &amp; 공학</h4>
      <p>고급 옷감 <strong>28개</strong></p><p>최고급 옷감 <strong>35개</strong></p>
      <p>튼튼한 고리 <strong>3개</strong></p><p>고급 실크 <strong>28개</strong></p><p>고급 가죽 끈 <strong>35개</strong></p>
      <p>마력이 깃든 나무장작 <strong>15개</strong></p><p>뮤턴트 <strong>3개</strong></p>
      <p>에너지 증폭 장치 <strong>6개</strong></p><p>스핀 기어 <strong>7개</strong></p><p>에메랄드 퓨즈 <strong>7개</strong></p>
    </div>
    <div class="ref-section">
      <h4>💎 제련 &amp; 기타</h4>
      <p>은판 <strong>14개</strong></p><p>미스릴 대못 <strong>9개</strong></p>
      <p>반짝이 종이 <strong>35개</strong></p><p>마법의 깃털펜 <strong>15개</strong></p>
      <p>조화의 코스모스 퍼퓸 <strong>6개</strong></p><p>펫 놀이세트 <strong>3개</strong></p><p>인조 잔디 <strong>7개</strong></p>
      <br><p style="color:var(--accent);font-size:12px;">[희귀 재료]</p>
      <p>탈틴 농장 달콤 케이크 <strong>3개</strong></p><p>탈틴 농장 레드문 귀걸이 <strong>3개</strong></p>
      <p>탈틴 농장 천연 고무 <strong>3개</strong></p><p>탈틴 농장 재스민 향수 <strong>2개</strong></p>
      <p>탈틴 농장 장식용 크리스탈 검 <strong>2개</strong></p>
    </div>
  </div>
</div>
<div id="tab1" class="tab-content">
  <div class="ref-grid">
    <div class="ref-section">
      <h4>🧪 포션 &amp; 목공</h4>
      <p>생명력 500 포션 <strong>14개</strong></p><p>정령의 리큐르 <strong>7개</strong></p>
      <p>최고급 나무장작 <strong>9개</strong></p><p>특급 나무장작 <strong>9개</strong></p><p>중급 나무장작 <strong>35개</strong></p>
      <p>건초더미 <strong>9개</strong></p><p>독묻은 와이번 볼트 <strong>9개</strong></p>
      <br><p style="color:var(--accent);font-size:12px;">🛒 구매순서: 페라→칼리다→오아시스→카루</p>
      <table style="margin-top:6px;font-size:12px;">
        <tr><th>교역소</th><th>4T</th><th>5T</th><th>6T</th></tr>
        <tr><td>페라</td><td>7개</td><td>3개</td><td>2개</td></tr>
        <tr><td>칼리다</td><td>-</td><td>3개</td><td>2개</td></tr>
        <tr><td>오아시스</td><td>7개</td><td>3개</td><td>2개</td></tr>
        <tr><td>카루</td><td>7개</td><td>3개</td><td>3개</td></tr>
      </table>
    </div>
    <div class="ref-section">
      <h4>🧵 방직 &amp; 공학</h4>
      <p>고급 옷감 <strong>28개</strong></p><p>최고급 옷감 <strong>35개</strong></p>
      <p>튼튼한 고리 <strong>3개</strong></p><p>고급 실크 <strong>28개</strong></p>
      <p>마력이 깃든 나무장작 <strong>15개</strong></p><p>뮤턴트 <strong>3개</strong></p>
      <p>에너지 증폭 장치 <strong>6개</strong></p><p>스핀 기어 <strong>7개</strong></p>
    </div>
    <div class="ref-section">
      <h4>💎 제련 &amp; 기타</h4>
      <p>은판 <strong>14개</strong></p><p>미스릴 대못 <strong>9개</strong></p>
      <p>반짝이 종이 <strong>35개</strong></p><p>마법의 깃털펜 <strong>15개</strong></p>
      <p>조화의 코스모스 퍼퓸 <strong>6개</strong></p><p>펫 놀이세트 <strong>3개</strong></p>
      <br><p style="color:var(--accent);font-size:12px;">[희귀 재료]</p>
      <p>탈틴 농장 달콤 케이크 <strong>3개</strong></p><p>탈틴 농장 레드문 귀걸이 <strong>3개</strong></p>
      <p>탈틴 농장 천연 고무 <strong>3개</strong></p><p>탈틴 농장 재스민 향수 <strong>2개</strong></p>
      <p>탈틴 농장 장식용 크리스탈 검 <strong>2개</strong></p>
      <p>남동판 <strong>2개</strong></p><p>백연판 <strong>2개</strong></p>
      <p>산딸기 크림 소스 박스 <strong>2개</strong></p><p>루멘 시럽 <strong>2개</strong></p>
    </div>
  </div>
</div>

<hr>

<!-- 섹션 4: 아르바이트 -->
<h2>🕊️ 아르바이트 보상 받기 목록</h2>
<p>관청: 잡보 아무거나 | 식료품: 낙지 | 의류점: <strong>튼튼한 고리</strong> (1순위) / 물교용 방직 재료 (2순위) | 힐러: 생명력 500 포션 | 서점: 마법의 깃털펜</p>

<hr>

<!-- 섹션 5: 탈농 시세 -->
<h2>📈 탈틴 농장 실시간 시세</h2>
<div class="info-bar"><span>경매장 최저가 기준 | 조회: ${fetchedAt}</span></div>
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

<!-- 섹션 6: 특화 채집 -->
<h2>💎 특화 채집 실시간 시세</h2>
<div class="info-bar">
  <button class="special-refresh-btn" id="btn-special-refresh" onclick="refreshSpecialClient()">⚡ 특화채집 시세만 새로고침</button>
  <span id="special-status-text">특화채집은 위 버튼을 누를 때만 실시간 갱신됩니다.</span>
</div>
<div class="grid-4">${specialHtml}</div>

<hr>

<!-- 섹션 7: 납품 퀘스트 계산기 -->
<h2>📦 생활 협회 납품 퀘스트 계산기</h2>
<p style="color:var(--text2);font-size:13px;margin-bottom:10px;">진행하려는 퀘스트를 체크하고 견적을 확인하세요.</p>
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

<!-- 섹션 8: 시세 변동 그래프 -->
<h2>📊 시세 변동 추이</h2>
<p style="color:var(--text2);font-size:13px;margin-bottom:12px;">1분마다 수집 | 최대 14일치 조회 가능 (데이터는 배포 후 1분부터 쌓임)</p>
<div style="display:flex;gap:10px;margin-bottom:10px;align-items:center;flex-wrap:wrap;">
  <select id="graph-hours">
    <option value="3">최근 3시간</option>
    <option value="6">최근 6시간</option>
    <option value="24" selected>최근 24시간</option>
    <option value="72">최근 3일</option>
    <option value="168">최근 7일</option>
    <option value="336">최근 14일</option>
  </select>
  <button class="btn-primary" onclick="loadGraph()">📈 조회</button>
  <button class="btn-secondary" onclick="graphCheckAll(true)">전체 선택</button>
  <button class="btn-secondary" onclick="graphCheckAll(false)">전체 해제</button>
</div>
<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;">
  <div>
    <div style="font-size:12px;color:var(--accent);margin-bottom:6px;">🌾 탈틴 농장 (가공품)</div>
    <div class="graph-check-group" id="graph-checks-farm" style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:600px;">${graphFarmOpts}</div>
  </div>
  <div>
    <div style="font-size:12px;color:var(--accent);margin-bottom:6px;">💎 특화 채집</div>
    <div class="graph-check-group" id="graph-checks-special" style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;">${graphSpecialOpts}</div>
  </div>
</div>
<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px;">
  <canvas id="priceChart" height="80"></canvas>
  <p id="graph-empty" style="text-align:center;color:var(--text2);padding:20px;display:none;">데이터가 없습니다. 아이템을 선택하고 조회해보세요.</p>
</div>

<hr>
<p style="color:var(--text2);font-size:12px;text-align:center;">Data based on NEXON Open API</p>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script>
const PRICES = ${JSON.stringify(prices)};
const QUESTS = ${JSON.stringify(DELIVERY_QUESTS)};
const UPGRADE_ITEMS = ${JSON.stringify(UPGRADE_ITEMS)};
const KEY_VALUE = ${KEY_VALUE};
const fmt = n => Number(n).toLocaleString("ko-KR");

// ── 탭 전환 ──
function switchTab(id, btn) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  btn.classList.add("active");
}

// ── 보상 시뮬레이터 ──
document.addEventListener("change", function(e) {
  if (!e.target.matches("input[type=radio]")) return;
  const simBody = e.target.closest(".sim-body");
  if (simBody) updateSim(simBody);
});
function updateSim(simBody) {
  const cost = parseInt(simBody.dataset.cost) || 0;
  const keyOnly = simBody.dataset.keyOnly === "true";
  const upgOnly = simBody.dataset.upgOnly === "true";

  let reward = 0;
  if (keyOnly) {
    reward = KEY_VALUE;
  } else if (upgOnly) {
    const upgTypeVal = parseInt(simBody.querySelector('input[name^="upg_type_"]:checked')?.value || 10000);
    reward = upgTypeVal;
  } else {
    const keyVal = parseInt(simBody.querySelector('input[name^="key_"]:checked')?.value || 1);
    const upgTypeVal = parseInt(simBody.querySelector('input[name^="upg_type_"]:checked')?.value || 10000);
    const upgCntVal = parseInt(simBody.querySelector('input[name^="upg_cnt_"]:checked')?.value || 1);
    reward = KEY_VALUE * keyVal + upgTypeVal * upgCntVal;
  }

  const profit = reward - cost;
  const color = profit > 0 ? "#00ffc8" : profit < 0 ? "#ff6b6b" : "#ffd166";
  const label = profit > 0 ? "🟢 +" + fmt(profit) + " G" : profit < 0 ? "🔴 " + fmt(profit) + " G" : "⚪ 0 G";
  const rewardEl = simBody.querySelector('[id^="reward_"]');
  const profitEl = simBody.querySelector('[id^="profit_"]');
  if (rewardEl) rewardEl.innerHTML = "보상 합계 <strong>" + fmt(reward) + " G</strong>";
  if (profitEl) { profitEl.textContent = label; profitEl.style.color = color; }
}
document.querySelectorAll(".sim-body").forEach(updateSim);

// ── 특화 채집 새로고침 ──
async function refreshSpecialClient() {
  const btn = document.getElementById("btn-special-refresh");
  const status = document.getElementById("special-status-text");
  btn.disabled = true;
  btn.innerText = "🔄 수집 중...";
  status.innerText = "특화 채집 19종 시세 수집 중...";
  try {
    const res = await fetch("/api/refresh-special");
    if (res.ok) {
      const newPrices = await res.json();
      Object.assign(PRICES, newPrices);
      for (const [item, price] of Object.entries(newPrices)) {
        const safeId = item.replace(/[^a-zA-Z0-9가-힣]/g, "_");
        const el = document.getElementById("spec_price_" + safeId);
        if (el) el.innerText = price ? fmt(price) + " G" : "매물없음";
      }
      status.innerText = "✨ 갱신 완료!";
    } else { status.innerText = "❌ 서버 오류"; }
  } catch { status.innerText = "❌ 네트워크 오류"; }
  finally { btn.disabled = false; btn.innerText = "⚡ 특화채집 시세만 새로고침"; }
}

// ── 장바구니 ──
let cart = JSON.parse(localStorage.getItem("mabi_cart") || "[]");
function saveCart() { localStorage.setItem("mabi_cart", JSON.stringify(cart)); }
function renderCart() {
  const el = document.getElementById("cart-list");
  if (!cart.length) { el.innerHTML = ""; return; }
  el.innerHTML = cart.map((item, i) =>
    \`<div class="cart-item"><span>\${item.name} × \${item.cnt}개</span><button class="del-btn" onclick="cartDel(\${i})">삭제</button></div>\`
  ).join("");
}
function cartAdd() {
  const name = document.getElementById("cart-name").value.trim();
  const cnt = parseInt(document.getElementById("cart-cnt").value) || 1;
  if (!name) return;
  cart.push({ name, cnt }); saveCart(); renderCart();
  document.getElementById("cart-name").value = "";
}
function cartDel(i) { cart.splice(i, 1); saveCart(); renderCart(); }
function cartClear() { cart = []; saveCart(); renderCart(); document.getElementById("cart-result").innerHTML = ""; }
async function cartCalc() {
  if (!cart.length) return;
  const res = document.getElementById("cart-result");
  res.innerHTML = "<p style='color:var(--text2)'>조회 중...</p>";
  const rows = await Promise.all(cart.map(async item => {
    const p = await fetchPriceClient(item.name);
    return { name: item.name, cnt: item.cnt, price: p };
  }));
  const total = rows.reduce((s, r) => s + r.price * r.cnt, 0);
  res.innerHTML = \`<div class="metric-box"><div class="m-label">장바구니 총액</div><div class="m-val">\${fmt(total)} G</div></div>
    <table><thead><tr><th>아이템</th><th class="num">최저가</th><th class="num">수량</th><th class="num">합계</th></tr></thead>
    <tbody>\${rows.map(r => \`<tr><td>\${r.name}</td><td class="num">\${r.price ? fmt(r.price)+" G":"매물없음"}</td><td class="num">\${r.cnt}개</td><td class="num">\${fmt(r.price*r.cnt)} G</td></tr>\`).join("")}</tbody></table>\`;
}

// ── 납품 퀘스트 계산기 ──
function buildQuestChecks() {
  const grid = document.getElementById("quest-check-grid");
  grid.innerHTML = QUESTS.map(q => {
    const tags = Object.entries(q.materials).map(([k,v]) =>
      \`<span class="mat-tag">\${k.replace("탈틴 농장 ","")} \${v}개</span>\`).join("");
    return \`<div class="quest-check-card">
      <label><input type="checkbox" id="chk_\${q.name}" checked> \${q.name} (납품 \${q.limit}회)</label>
      <div class="mat-tags">\${tags}</div></div>\`;
  }).join("");
}
function checkAll(val) { QUESTS.forEach(q => { const el = document.getElementById("chk_"+q.name); if(el) el.checked = val; }); }
async function calcQuests() {
  const multiplier = parseInt(document.getElementById("multiplier").value) || 1;
  const selected = QUESTS.filter(q => document.getElementById("chk_"+q.name)?.checked);
  if (!selected.length) { alert("퀘스트를 선택해주세요!"); return; }
  const agg = {};
  selected.forEach(q => Object.entries(q.materials).forEach(([mat, cnt]) => { agg[mat] = (agg[mat]||0) + cnt * q.limit * multiplier; }));
  const res = document.getElementById("quest-result");
  res.innerHTML = "<p style='color:var(--text2)'>조회 중...</p>";
  const rows = await Promise.all(Object.entries(agg).map(async ([name, cnt]) => {
    const p = PRICES[name] || await fetchPriceClient(name);
    return { name, cnt, price: p };
  }));
  const total = rows.reduce((s,r) => s + r.price * r.cnt, 0);
  res.innerHTML = \`<div class="metric-box"><div class="m-label">총 예상 구매 비용</div><div class="m-val">\${fmt(total)} G</div></div>
    <table><thead><tr><th>재료명</th><th class="num">최저가</th><th class="num">필요 수량</th><th class="num">합계</th></tr></thead>
    <tbody>\${rows.map(r => \`<tr><td>\${r.name}</td><td class="num">\${r.price?fmt(r.price)+" G":"매물없음"}</td><td class="num">\${r.cnt}개</td><td class="num">\${fmt(r.price*r.cnt)} G</td></tr>\`).join("")}</tbody></table>\`;
}

// ── 그래프 ──
const CHART_COLORS = [
  "#00ffc8","#ff6b6b","#ffd166","#74b9ff","#a29bfe",
  "#fd79a8","#55efc4","#fdcb6e","#e17055","#81ecec",
  "#6c5ce7","#fab1a0","#00cec9","#ff7675","#dfe6e9"
];
let chartInstance = null;

function graphCheckAll(val) {
  document.querySelectorAll('input[name="graph_item"]').forEach(el => el.checked = val);
}

async function loadGraph() {
  const selected = [...document.querySelectorAll('input[name="graph_item"]:checked')].map(el => el.value);
  const hours = document.getElementById("graph-hours").value;
  const emptyEl = document.getElementById("graph-empty");
  const canvas = document.getElementById("priceChart");

  if (!selected.length) { alert("아이템을 하나 이상 선택해주세요!"); return; }

  emptyEl.style.display = "none";
  canvas.style.display = "block";

  // 배치 API로 한 번에 조회 (서브리퀘스트 1회만 사용)
  let grouped = {};
  try {
    const res = await fetch("/api/history/batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: selected, hours })
    });
    grouped = await res.json();
  } catch { emptyEl.style.display = "block"; canvas.style.display = "none"; return; }

  const allData = selected.map(item => ({ item, rows: grouped[item] || [] }));

  if (allData.every(d => !d.rows.length)) {
    emptyEl.style.display = "block"; canvas.style.display = "none"; return;
  }

  // 공통 시간 라벨 (가장 많은 데이터 기준)
  const longest = allData.reduce((a, b) => a.rows.length > b.rows.length ? a : b);
  const labels = longest.rows.map(r => {
    const d = new Date(r.recorded_at + "Z");
    return d.toLocaleString("ko-KR", { month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", timeZone:"Asia/Seoul" });
  });

  // 각 아이템 데이터셋 생성
  const datasets = allData.filter(d => d.rows.length > 0).map((d, i) => ({
    label: d.item.replace("탈틴 농장 ",""),
    data: d.rows.map(r => r.price),
    borderColor: CHART_COLORS[i % CHART_COLORS.length],
    backgroundColor: "transparent",
    borderWidth: 2,
    pointRadius: d.rows.length > 200 ? 0 : 2,
    tension: 0.3,
  }));

  // 고정 툴팁 패널 (차트 아래 고정, 스크롤 가능)
  let tooltipEl = document.getElementById("chart-tooltip");
  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.id = "chart-tooltip";
    tooltipEl.style.cssText = "display:none;background:#1e2130;border:1px solid #4a4d5e;border-radius:8px;padding:10px 14px;font-size:12px;color:#e0e0e0;max-height:400px;overflow-y:auto;min-width:220px;scrollbar-width:thin;scrollbar-color:#4a4d5e #1e2130;margin-top:8px;";
    canvas.parentNode.insertAdjacentElement("afterend", tooltipEl);
  }

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(canvas, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color:"#e0e0e0", boxWidth:12 } },
        tooltip: {
          enabled: false,
          external(context) {
            const { chart, tooltip } = context;
            if (tooltip.opacity === 0) return;
            const idx = tooltip.dataPoints[0]?.dataIndex;
            const title = tooltip.title[0] || "";
            const lines = chart.data.datasets.map(ds => {
              const val = ds.data[idx];
              if (val === undefined || val === null) return "";
              return \`<div style="display:flex;justify-content:space-between;gap:16px;padding:2px 0;">
                <span style="color:\${ds.borderColor}">● \${ds.label}</span>
                <span style="font-weight:bold;">\${val.toLocaleString("ko-KR")} G</span>
              </div>\`;
            }).filter(Boolean).join("");
            tooltipEl.style.display = "block";
            tooltipEl.innerHTML = \`<div style="font-size:11px;color:#aaa;margin-bottom:6px;font-weight:bold;">\${title}</div>\${lines}\`;
          }
        }
      },
      scales: {
        x: { ticks: { color:"#aaa", maxTicksLimit:12 }, grid: { color:"rgba(255,255,255,0.05)" } },
        y: { ticks: { color:"#aaa", callback: v => v.toLocaleString("ko-KR")+" G" }, grid: { color:"rgba(255,255,255,0.05)" } }
      }
    }
  });
}

// ── 단건 조회 ──
async function fetchPriceClient(itemName) {
  try {
    const res = await fetch("/api/price?item=" + encodeURIComponent(itemName));
    const data = await res.json();
    return data.price || 0;
  } catch { return 0; }
}

// ── 초기화 ──
renderCart();
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

    // 특화 채집 수동 갱신
    if (url.pathname === "/api/refresh-special") {
      const prices = await refreshSpecialPrices(apiKey, env.MABI_CACHE);
      return new Response(JSON.stringify(prices), {
        headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 단건 가격 조회
    if (url.pathname === "/api/price") {
      const item = url.searchParams.get("item");
      if (!item) return new Response(JSON.stringify({ price: 0 }), { headers: { "content-type": "application/json" } });
      const price = await fetchPrice(item, apiKey);
      return new Response(JSON.stringify({ price }), {
        headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 그래프용 시계열 조회
    if (url.pathname === "/api/history") {
      const item = url.searchParams.get("item");
      const hours = parseInt(url.searchParams.get("hours") || "24");
      if (!item || !env.MABI_DB) return new Response(JSON.stringify([]), { headers: { "content-type": "application/json" } });
      try {
        const rows = await env.MABI_DB.prepare(
          `SELECT recorded_at, price FROM prices WHERE item_name = ? AND recorded_at >= datetime('now', '-${hours} hours') ORDER BY recorded_at ASC`
        ).bind(item).all();
        return new Response(JSON.stringify(rows.results), {
          headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch { return new Response(JSON.stringify([]), { headers: { "content-type": "application/json" } }); }
    }

    // 그래프용 배치 시계열 조회 (아이템 여러 개를 D1 쿼리 한 번으로 처리)
    if (url.pathname === "/api/history/batch") {
      if (!env.MABI_DB) return new Response(JSON.stringify({}), { headers: { "content-type": "application/json" } });
      try {
        const body = await request.json();
        const items = body.items || [];
        const hours = parseInt(body.hours || "24");
        if (!items.length) return new Response(JSON.stringify({}), { headers: { "content-type": "application/json" } });

        // 기간별 샘플링 간격 (읽기 행 수 절감)
        // 3시간/6시간: 매 포인트, 24시간: 5분마다 1개, 3일: 15분마다, 7일: 30분마다, 14일: 1시간마다
        let interval = 3; // 기본 3분 (Cron 주기)
        if (hours >= 336) interval = 60;
        else if (hours >= 168) interval = 30;
        else if (hours >= 72) interval = 15;
        else if (hours >= 24) interval = 6;

        const placeholders = items.map(() => "?").join(",");
        const rows = await env.MABI_DB.prepare(
          `SELECT item_name, recorded_at, price FROM prices
           WHERE item_name IN (${placeholders})
             AND recorded_at >= datetime('now', '-${hours} hours')
             AND CAST(strftime('%M', recorded_at) AS INTEGER) % ${interval} = 0
           ORDER BY item_name, recorded_at ASC`
        ).bind(...items).all();

        const grouped = {};
        items.forEach(item => { grouped[item] = []; });
        rows.results.forEach(r => { if (grouped[r.item_name]) grouped[r.item_name].push({ recorded_at: r.recorded_at, price: r.price }); });

        return new Response(JSON.stringify(grouped), {
          headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch(e) { return new Response(JSON.stringify({}), { headers: { "content-type": "application/json" } }); }
    }

    // 메인 페이지
    const prices = await fetchAutoPrices(apiKey, env.MABI_CACHE);
    const now = new Date().toLocaleTimeString("ko-KR", { hour:"2-digit", minute:"2-digit", second:"2-digit", timeZone:"Asia/Seoul" });
    const html = buildPage(prices, now);
    return new Response(html, { headers: { "content-type": "text/html;charset=UTF-8" } });
  },

  // ── Cron Trigger: 1분마다 시세 수집 → D1 저장 ──
  // 탈농(~40개)과 특화(19개)를 번갈아 수집해서 서브리퀘스트 50회 제한 회피
  async scheduled(event, env) {
    const apiKey = env.NEXON_API_KEY;
    if (!apiKey || !env.MABI_DB) return;

    // 테이블 초기화 (문장 분리)
    await env.MABI_DB.exec(`CREATE TABLE IF NOT EXISTS prices (id INTEGER PRIMARY KEY AUTOINCREMENT, item_name TEXT NOT NULL, price INTEGER NOT NULL, recorded_at DATETIME DEFAULT (datetime('now')))`);
    await env.MABI_DB.exec(`CREATE INDEX IF NOT EXISTS idx_item_time ON prices(item_name, recorded_at)`);

    // 짝수/홀수 분으로 4분할 수집 (한 번에 최대 21개로 CPU 부하 절감)
    // 분 % 4 == 0: 탈농 기본 생산품 (21개)
    // 분 % 4 == 1: 특화 채집 (19개)
    // 분 % 4 == 2: 탈농 가공품 (20개)
    // 분 % 4 == 3: 특화 채집 (19개)
    const minute = new Date().getUTCMinutes();
    const slot = minute % 4;

    let targetItems = [];
    if (slot === 0) {
      targetItems = [...CATEGORIES["기본 생산품"]];
    } else if (slot === 1) {
      targetItems = [...SPECIAL_ITEMS];
    } else if (slot === 2) {
      targetItems = [
        ...CATEGORIES["풍요로운 마법의 솥"],
        ...CATEGORIES["부드러운 마법의 솥"],
        ...CATEGORIES["반짝이는 마법의 솥"],
        ...CATEGORIES["섬세한 마법의 솥"],
      ];
    } else {
      targetItems = [...SPECIAL_ITEMS];
    }

    // 5개씩 병렬 조회
    const priceMap = {};
    const chunkSize = 5;
    for (let i = 0; i < targetItems.length; i += chunkSize) {
      const chunk = targetItems.slice(i, i + chunkSize);
      const results = await Promise.all(chunk.map(async item => [item, await fetchPrice(item, apiKey)]));
      results.forEach(([item, price]) => { priceMap[item] = price; });
    }

    // D1 배치 insert
    const stmt = env.MABI_DB.prepare("INSERT INTO prices (item_name, price) VALUES (?, ?)");
    const batch = Object.entries(priceMap).map(([item, price]) => stmt.bind(item, price));
    await env.MABI_DB.batch(batch);

    // KV 캐시 갱신 (기존 캐시에 머지)
    if (env.MABI_CACHE) {
      try {
        const existing = await env.MABI_CACHE.get("all_prices");
        const merged = existing ? { ...JSON.parse(existing), ...priceMap } : priceMap;
        await env.MABI_CACHE.put("all_prices", JSON.stringify(merged));
      } catch {}
    }

    // 14일 이상 된 데이터 자동 삭제 — 매일 자정(UTC 0시)에만 실행
    const utcHour = new Date().getUTCHours();
    const utcMinute = new Date().getUTCMinutes();
    if (utcHour === 0 && utcMinute < 3) {
      await env.MABI_DB.exec("DELETE FROM prices WHERE recorded_at < datetime('now', '-14 days')");
    }
  }
};
