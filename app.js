/* 트레더 (TRA:TOGETHER) - 소분 예약 & 공동구매 플로우
   1 홈&카테고리 → 2 상품 목록/상세정보 → 3 소분 예약·공동구매 → 4 예약하기 → 5 매장 방문·수령 */

const PRODUCTS = [
  {id:1, type:'정육', name:'호주산 냉장 안심 2.5kg', price:55800, orig:69800, unit:'100g당 2,232원', emoji:'🥩', cls:''},
  {id:2, type:'수산', name:'생연어 필렛 2.0kg',     price:49800, orig:62800, unit:'100g당 2,490원', emoji:'🐟', cls:'fish'},
  {id:3, type:'정육', name:'한우 불고기 1.0kg',     price:32800, orig:38800, unit:'100g당 3,280원', emoji:'🍖', cls:'beef'}
];
const CATS = [
  ['🥬','신선식품'],['🥩','정육/수산'],['🍱','가공식품'],['❄️','냉동식품'],
  ['🥐','베이커리'],['🥤','음료/주류'],['🧴','생활용품'],['🐶','반려동물']
];
// 공동구매 할인 구간 (인원 → 할인율)
const TIERS = [[2,10],[4,15],[6,20],[8,26]];
const DATES = ['10.26 (월)','10.27 (화)','10.28 (수)'];
const TIMES = ['10:00','12:00','14:00','16:00'];

const $ = s => document.querySelector(s);
const won = n => n.toLocaleString('ko-KR') + '원';
const rate = n => (TIERS.filter(t => n >= t[0]).pop() || [0,0])[1];

const state = {
  view:'share-home', stack:[],
  tab:'전체', product:null, people:4, date:DATES[0], time:TIMES[1]
};

/* ---------- 화면 전환 ---------- */
function show(name){ $('#s-home').classList.toggle('active', name==='home'); $('#s-share').classList.toggle('active', name!=='home'); }
function go(view, push=true){
  if(push) state.stack.push(state.view);
  state.view = view; render(); scrollTo(0,0);
}
function back(){
  if(state.stack.length){ state.view = state.stack.pop(); render(); }
  else { show('home'); state.view='share-home'; }
  scrollTo(0,0);
}

/* ---------- 공통 조각 ---------- */
const head = (title, withBack=true) => `
  <div class="sh-top">${withBack?'<button class="back" data-a="back" aria-label="뒤로">‹</button>':''}
  <h1>${title}</h1></div>`;
const bar = n => `<div class="stepbar">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</div>`;
const shareTab = on => `<footer class="tab share">
  <a data-a="home-tab" class="${on==='home'?'on':''}">🏠<span>홈</span></a>
  <a data-a="cat-tab"><span style="font-size:18px">▦</span><span>카테고리</span></a>
  <a class="${on==='share'?'on':''}">🤝<span>소분/공동구매</span></a>
  <a data-a="exit">👤<span>마이페이지</span></a></footer>`;

/* ---------- 1. 홈 & 카테고리 ---------- */
function vShareHome(){
  return `
  <div class="sh-top"><button class="back" data-a="exit" aria-label="트레이더스 홈">‹</button>
    <div class="brand">TRADERS <span>SHARE</span></div></div>
  <div class="sh-search">상품명, 카테고리를 검색해보세요</div>
  <div class="hero"><div><b>지금, 함께 구매하면<br>더 좋은 혜택!</b><p>공동구매로 더 큰 할인을!</p></div><div class="e">🥩</div></div>
  <div class="cats">${CATS.map(c=>`<button data-a="cat" data-v="${c[1]}"><i>${c[0]}</i>${c[1]}</button>`).join('')}</div>
  <div class="sec-t">지금 많이 찾는 상품</div>
  <div class="pop">${PRODUCTS.filter(p=>p.id<3).map(p=>`
    <button data-a="detail" data-v="${p.id}"><div class="im ${p.cls}">${p.emoji}</div>
    <span class="mini">${p.name}</span><b>${won(p.price)}</b></button>`).join('')}</div>
  ${shareTab('home')}`;
}

/* ---------- 2. 상품 목록(상세 정보 확인) ---------- */
function vList(){
  const items = PRODUCTS.filter(p => state.tab==='전체' || p.type===state.tab);
  return `${head('정육/수산')}
  <div class="tabs">${['전체','정육','수산'].map(t=>`<button class="${state.tab===t?'on':''}" data-a="tab" data-v="${t}">${t}</button>`).join('')}</div>
  <div class="filters"><span>소분 가능</span><span>공동구매 할인</span></div>
  <div class="list">${items.map(p=>{
    const pct = Math.round((1-p.price/p.orig)*100);
    return `<div class="card" data-a="detail" data-v="${p.id}">
      <div class="im ${p.cls}">${p.emoji}<span class="tag">소분 가능</span></div>
      <div class="info"><b>${p.name}</b><span class="old">${won(p.orig)}</span><br>
        <span class="price">${won(p.price)}</span> <span class="mini">(최대 ${pct}% 할인)</span><br>
        <span class="mini">${p.unit}</span><br><span class="pill">공동구매 시 최대 20% 할인</span>
        <button class="btn sm" data-a="reserve-direct" data-v="${p.id}">소분 예약하기</button></div></div>`;}).join('')}</div>
  ${shareTab('share')}`;
}

/* ---------- 3. 소분 예약 및 공동구매 (상세) ---------- */
function vDetail(){
  const p = state.product, r = rate(state.people);
  const pct = Math.round((1-p.price/p.orig)*100);
  const fill = Math.max(0, TIERS.findIndex(t=>t[0]>=state.people)) / (TIERS.length-1) * 100;
  const need = TIERS.find(t=>t[0]>state.people);
  return `${head('상품 상세')}
  <div class="d-img ${p.cls}">${p.emoji}<span class="tag">소분 가능</span></div>
  <div class="d-body">
    <h2>${p.name}</h2>
    <div class="d-price">${won(p.price)} <span class="off">${pct}% 할인</span></div>
    <div class="mini">(${p.unit})</div>
    <div class="chips"><span>👥 소분 가능</span><span>최소 2인</span><span>최대 8인</span></div>

    <div class="box"><h3>공동구매 할인 혜택</h3>
      <div class="bar"><div class="fill" style="width:${fill}%"></div>
        ${TIERS.map((t,i)=>`<div class="stop ${state.people>=t[0]?'on':''} ${t[0]===state.people?'cur':''}" style="left:${i/(TIERS.length-1)*100}%"><u>${t[0]}인</u><s>${t[1]}%</s></div>`).join('')}</div>
      <p class="hl">${r?`${state.people}인 모집 시 ${r}% 할인 적용!`:'2인 이상부터 할인이 적용돼요'}${need?`<br><span class="mini">${need[0]-state.people}명 더 모이면 ${need[1]}%</span>`:''}</p></div>

    <div class="box"><h3>소분 예약 · 참여 인원 선택</h3>
      <div class="pp">${[2,3,4,5,6,8].map(n=>`<button class="${state.people===n?'on':''}" data-a="people" data-v="${n}">${n}인</button>`).join('')}</div></div>
  </div>
  <div class="cta"><button class="btn" data-a="to-reserve">소분 예약하기</button></div>`;
}

/* ---------- 4. 소분 예약하기 ---------- */
function vReserve(){
  const p = state.product, r = rate(state.people);
  const per = Math.round(p.price*(1-r/100)/state.people/10)*10;
  return `${head('소분 예약하기')}
  <div class="r-prod"><div class="r-img ${p.cls}">${p.emoji}</div>
    <div><b style="font-size:14px">${p.name}</b><br><b>${won(p.price)}</b> <span class="mini">(${p.unit})</span><br>
    <span class="pill">공동구매 시 ${r||0}% 할인</span></div></div>
  <div class="field"><h4>선택한 인원</h4><div class="row">
    <div class="stepper"><button data-a="dec">−</button><span class="big">${state.people}인</span><button data-a="inc">+</button></div>
    <span class="mini">최소 2인 · 최대 8인</span></div></div>
  <div class="field" style="padding-top:0"><div class="row"><span class="mini">예상 1인당 금액<br>(공동구매 할인 적용 시)</span><span class="big">${won(per)}</span></div></div>
  <div class="field"><h4>방문일 선택</h4><div class="opts">${DATES.map(d=>`<button class="${state.date===d?'on':''}" data-a="date" data-v="${d}">${d}</button>`).join('')}</div></div>
  <div class="field"><h4>시간 선택</h4><div class="opts t4">${TIMES.map(t=>`<button class="${state.time===t?'on':''}" data-a="time" data-v="${t}">${t}</button>`).join('')}</div></div>
  <div class="note">ⓘ 예약이 완료되면 매장 방문 안내가 제공됩니다.</div>
  <div class="cta"><button class="btn" data-a="book">예약하기</button></div>`;
}

/* ---------- 5. 매장 방문 및 수령 ---------- */
function vVisit(){
  const p = state.product;
  return `${head('매장 내 소분 공간 안내')}
  <div class="done"><b>예약이 완료되었어요 ✔</b><br>${p.name} · ${state.people}인<br>${state.date} ${state.time} 방문</div>
  <div class="zone"><div>소분 Zone<small>함께 나누는 더 든든한 장보기</small></div></div>
  <div class="eq">
    <div><i>🏠</i>작업대<br>소분 작업 공간</div><div><i>⚖️</i>전자저울<br>정확한 중량 측정</div>
    <div><i>🧰</i>포장 용기<br>개별 포장 제공</div><div><i>🏷️</i>라벨 출력기<br>상품명·소분일자 표시</div></div>
  <div class="how"><h4>이렇게 운영돼요</h4><ul>
    <li><b>1</b>예약 시간에 매장 방문</li><li><b>2</b>소분 공간에서 상품 나누기</li><li><b>3</b>개별 포장 후 수령</li></ul></div>
  <div style="padding:0 16px"><button class="btn" data-a="zone-map">매장 소분 공간 위치 보기</button>
  <p class="mini" style="margin:10px 0 70px">※ 일부 상품은 사전 포장 형태로 제공될 수 있습니다.</p></div>
  <div class="cta"><button class="btn" data-a="exit">트레이더스 홈으로</button></div>`;
}

/* ---------- 렌더 & 이벤트 ---------- */
function render(){
  const v = {'share-home':vShareHome,list:vList,detail:vDetail,reserve:vReserve,visit:vVisit}[state.view];
  $('#s-share').innerHTML = v(); show('share');
}
function pick(id){ state.product = PRODUCTS.find(p=>p.id===+id); }

document.addEventListener('click', e=>{
  if(e.target.closest('#go-tra')){ e.preventDefault(); state.stack=[]; state.view='share-home'; render(); scrollTo(0,0); return; }
  const el = e.target.closest('[data-a]'); if(!el) return;
  e.stopPropagation();
  const a = el.dataset.a, v = el.dataset.v;
  switch(a){
    case 'back': back(); break;
    case 'exit': state.stack=[]; show('home'); break;
    case 'home-tab': state.stack=[]; go('share-home',false); break;
    case 'cat-tab': state.tab='전체'; go('list'); break;
    case 'cat': state.tab = v==='정육/수산' ? '전체' : '전체'; go('list'); break;
    case 'tab': state.tab=v; render(); break;
    case 'detail': pick(v); state.people=4; go('detail'); break;
    case 'reserve-direct': pick(v); state.people=4; go('reserve'); break;
    case 'people': state.people=+v; render(); break;
    case 'to-reserve': go('reserve'); break;
    case 'inc': state.people=Math.min(8,state.people+1); render(); break;
    case 'dec': state.people=Math.max(2,state.people-1); render(); break;
    case 'date': state.date=v; render(); break;
    case 'time': state.time=v; render(); break;
    case 'book': go('visit'); break;
    case 'zone-map': alert('매장 소분 공간 위치 지도는 추후 연결해 주세요.'); break;
  }
});
