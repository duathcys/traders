/* 트레더 (TRA:TOGETHER) - 소분 예약
   홈 → 정육/수산 목록 → 상품 상세(소분 수량 선택) → 예약 확인 팝업 → 장바구니(소분 금액) → 품목별 QR */

/* ---------- 설정 ---------- */
const CANCEL_NOTICE = '예약 후 취소하시면 취소 수수료가 부과돼요.';
const KEY = 'traders_cart_v1';

/* price: 상품 전체 가격 / portions: 몇 인 소분인지 / left: 매장에 남은 소분 수 */
const PRODUCTS = [
  {id:1, type:'정육', name:'호주산 냉장 안심 2.5kg', price:55800, portions:5, left:3, emoji:'🥩', cls:''},
  {id:2, type:'수산', name:'생연어 필렛 2.0kg',     price:49800, portions:4, left:4, emoji:'🐟', cls:'fish'},
  {id:3, type:'정육', name:'한우 불고기 1.0kg',     price:32800, portions:4, left:2, emoji:'🍖', cls:'beef'},
  {id:4, type:'수산', name:'손질 새우 1.0kg',       price:24900, portions:3, left:3, emoji:'🦐', cls:'fish'}
];
const CATS = [
  ['leaf','신선식품',true],['meat','정육/수산',true],['bowl','가공식품',false],['snow','냉동식품',false],
  ['bread','베이커리',false],['drink','음료/주류',false],['soap','생활용품',false],['paw','반려동물',false]
];

/* ---------- 유틸 ---------- */
const $ = s => document.querySelector(s);
const won = n => n.toLocaleString('ko-KR') + '원';
const ic = n => `<svg class="ic"><use href="#i-${n}"/></svg>`;
const unitPrice = p => Math.round(p.price / p.portions);                 // 1소분 가격
const calc = (p, q) => Math.round(p.price / p.portions * q);             // 가격 ÷ 인원 × 구매 소분 수
const byId = id => PRODUCTS.find(p => p.id === +id);

function loadCart(){ try{ return JSON.parse(localStorage.getItem(KEY)) || []; }catch(e){ return []; } }
function saveCart(){ try{ localStorage.setItem(KEY, JSON.stringify(state.cart)); }catch(e){} }

const state = { view:'share-home', stack:[], tab:'전체', product:null, qty:1, cart:loadCart(), modal:null };

const reserved = p => state.cart.filter(c => c.pid === p.id).reduce((a, c) => a + c.qty, 0);
const remain = p => Math.max(0, p.left - reserved(p));
const cartTotal = () => state.cart.reduce((a, c) => a + c.price, 0);

function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1900);
}
function qrSvg(text){
  try{ const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({cellSize:4, margin:2, scalable:true}); }
  catch(e){ return '<p class="mini">QR 생성에 실패했어요</p>'; }
}

/* ---------- 화면 전환 ---------- */
function top0(){ document.querySelectorAll('.screen').forEach(e => e.scrollTop = 0); }
function show(name){ $('#s-home').classList.toggle('active', name === 'home'); $('#s-share').classList.toggle('active', name !== 'home'); }
function go(view, push = true){ if(push) state.stack.push(state.view); state.view = view; render(); top0(); }
function back(){
  if(state.stack.length){ state.view = state.stack.pop(); render(); }
  else { show('home'); state.view = 'share-home'; }
  top0();
}

/* ---------- 공통 조각 ---------- */
const cartBtn = () => `<button class="cart-btn" data-a="cart" aria-label="장바구니">${ic('cart')}${state.cart.length ? `<em>${state.cart.length}</em>` : ''}</button>`;
const head = (title, withCart = true) => `
  <div class="sh-top"><button class="back" data-a="back" aria-label="뒤로">${ic('back')}</button>
  <h1>${title}</h1>${withCart ? cartBtn() : ''}</div>`;
const shareTab = on => `<footer class="tab share">
  <a data-a="home-tab" class="${on==='home'?'on':''}">${ic('home')}<span>홈</span></a>
  <a data-a="cat-tab">${ic('grid')}<span>카테고리</span></a>
  <a class="${on==='share'?'on':''}">${ic('together')}<span>소분 예약</span></a>
  <a data-a="exit">${ic('user')}<span>마이페이지</span></a></footer>`;

/* ---------- 1. 홈 & 카테고리 ---------- */
function vShareHome(){
  return `
  <div class="sh-top"><button class="back" data-a="exit" aria-label="트레이더스 홈">${ic('back')}</button>
    <div class="brand">TRADERS <span>SHARE</span></div>${cartBtn()}</div>
  <div class="sh-search">상품명, 카테고리를 검색해보세요</div>
  <div class="hero"><div><b>필요한 만큼만,<br>소분 예약!</b><p>대용량 정육·수산을 원하는 만큼</p></div><div class="e">🥩</div></div>
  <div class="cats">${CATS.map(c=>`<button data-a="cat" data-v="${c[1]}" data-on="${c[2]}"><i>${ic(c[0])}</i>${c[1]}</button>`).join('')}</div>
  <div class="sec-t">지금 많이 찾는 상품</div>
  <div class="pop">${PRODUCTS.slice(0,2).map(p=>`
    <button data-a="detail" data-v="${p.id}"><div class="im ${p.cls}">${p.emoji}</div>
    <span class="mini">${p.name}</span><b>1소분 ${won(unitPrice(p))}</b></button>`).join('')}</div>
  ${shareTab('home')}`;
}

/* ---------- 2. 상품 목록 ---------- */
function vList(){
  const items = PRODUCTS.filter(p => state.tab === '전체' || p.type === state.tab);
  return `${head('정육/수산')}
  <div class="tabs">${['전체','정육','수산'].map(t=>`<button class="${state.tab===t?'on':''}" data-a="tab" data-v="${t}">${t}</button>`).join('')}</div>
  <div class="list">${items.map(p=>{
    const r = remain(p);
    return `<div class="card" data-a="detail" data-v="${p.id}">
      <div class="im ${p.cls}">${p.emoji}<span class="tag ${r?'':'off'}">${r ? p.portions+'인 소분' : '마감'}</span></div>
      <div class="info"><b>${p.name}</b>
        <span class="price">1소분 ${won(unitPrice(p))}</span><br>
        <span class="mini">총 ${won(p.price)} · ${p.portions}인 소분</span><br>
        <span class="pill">${r ? `남은 소분 ${r}/${p.portions}` : '소분 마감'}</span>
        <button class="btn sm" data-a="detail" data-v="${p.id}" ${r?'':'disabled'}>소분 예약하기</button></div></div>`;}).join('')}</div>
  ${shareTab('share')}`;
}

/* ---------- 3. 상세 & 소분 수량 선택 ---------- */
function vDetail(){
  const p = state.product, r = remain(p);
  const q = Math.min(Math.max(1, state.qty), Math.max(1, r));
  state.qty = q;
  return `${head('소분 예약')}
  <div class="d-img ${p.cls}">${p.emoji}<span class="tag">${p.portions}인 소분</span></div>
  <div class="d-body">
    <h2>${p.name}</h2>
    <div class="d-price">${won(p.price)}</div>
    <div class="chips"><span>${p.portions}인 소분</span><span>1소분 ${won(unitPrice(p))}</span><span>남은 ${r}소분</span></div>

    <div class="box"><h3>소분 수량 선택</h3>
      <div class="row">
        <div class="stepper"><button data-a="qty-dec" ${q<=1?'disabled':''}>−</button><span class="big">${q}소분</span><button data-a="qty-inc" ${q>=r?'disabled':''}>+</button></div>
        <span class="mini">최대 ${r}소분</span></div>
      <p class="mini" style="margin-top:10px">혼자서도 여러 소분을 예약할 수 있어요.</p>
      <div class="calc"><span>${won(p.price)} ÷ ${p.portions}인 × ${q}소분</span><b>${won(calc(p,q))}</b></div>
    </div>
    <div class="note" style="margin:14px 0 0">ⓘ 예약하면 소분된 금액으로 장바구니에 담겨요. 당일 매장에서 QR로 수령해요.</div>
  </div>
  <div class="cta"><button class="btn" data-a="ask-reserve" ${r<1?'disabled':''}>${r<1?'소분 마감':`소분 예약하기 · ${won(calc(p,q))}`}</button></div>`;
}

/* ---------- 4. 장바구니 ---------- */
function vCart(){
  if(!state.cart.length) return `${head('장바구니', false)}
    <div class="empty"><i>${ic('cart')}</i><b>장바구니가 비어 있어요</b><p>소분 예약한 상품이 여기에 담겨요.</p>
    <button class="btn" style="max-width:220px;margin:18px auto 0" data-a="shop">소분 상품 보러가기</button></div>`;
  return `${head('장바구니', false)}
  <div class="cart-list">${state.cart.map(c=>{
    const p = byId(c.pid);
    return `<div class="c-item">
      <div class="c-top"><div class="r-img ${p.cls}">${p.emoji}</div>
        <div class="c-info"><b>${p.name}</b>
          <span class="mini">${p.portions}인 소분 중 ${c.qty}소분 · 오늘 방문</span>
          <span class="mini">예약번호 ${c.oid}</span>
          <div class="c-price">${won(c.price)}</div></div></div>
      <div class="c-btns"><button class="qrb" data-a="qr" data-v="${c.oid}">${ic('qr')}QR 보기</button>
        <button class="cancel" data-a="ask-cancel" data-v="${c.oid}">예약 취소</button></div></div>`;}).join('')}</div>
  <div class="sum"><div class="row"><span>예약 ${state.cart.length}건</span><span>소분 합계</span></div>
    <div class="row" style="margin-top:6px"><span class="mini">QR은 품목별로 발급돼요</span><b class="big">${won(cartTotal())}</b></div></div>
  <button class="linkrow" data-a="visit">매장 소분 공간 안내 보기 ›</button>
  <p class="mini" style="padding:0 20px 10px">${CANCEL_NOTICE}</p>
  <div class="cta"><button class="btn" data-a="shop">쇼핑 계속하기</button></div>`;
}

/* ---------- 5. 매장 소분 공간 안내 ---------- */
function vVisit(){
  return `${head('매장 내 소분 공간 안내')}
  <div class="zone"><div>소분 Zone<small>함께 나누는 더 든든한 장보기</small></div></div>
  <div class="eq">
    <div><i>${ic('bench')}</i>작업대<br>소분 작업 공간</div><div><i>${ic('scale')}</i>전자저울<br>정확한 중량 측정</div>
    <div><i>${ic('box')}</i>포장 용기<br>개별 포장 제공</div><div><i>${ic('print')}</i>라벨 출력기<br>상품명·소분일자 표시</div></div>
  <div class="how"><h4>이렇게 운영돼요</h4><ul>
    <li><b>1</b>당일 매장 방문 후 소분 Zone으로 이동</li><li><b>2</b>장바구니의 품목별 QR을 직원에게 제시</li><li><b>3</b>예약한 만큼 소분·포장 후 수령</li></ul></div>
  <p class="mini" style="padding:0 20px 10px">※ 일부 상품은 사전 포장 형태로 제공될 수 있습니다.</p>
  <div class="cta"><button class="btn" data-a="cart">장바구니로 가기</button></div>`;
}

/* ---------- 팝업 ---------- */
function modalHTML(){
  const m = state.modal; if(!m) return '';
  if(m.type === 'confirm'){
    const p = state.product, q = state.qty;
    return `<div class="overlay" data-a="overlay"><div class="dialog">
      <h3>정말 예약하시겠어요?</h3>
      <div class="d-sum"><b>${p.name}</b><span>${p.portions}인 소분 중 ${q}소분</span><strong>${won(calc(p,q))}</strong></div>
      <p class="warn">${CANCEL_NOTICE}</p>
      <div class="d-btns"><button class="ghost" data-a="close">취소</button><button class="ok" data-a="confirm-reserve">예약하기</button></div></div></div>`;
  }
  if(m.type === 'cancel'){
    return `<div class="overlay" data-a="overlay"><div class="dialog">
      <h3>예약을 취소하시겠어요?</h3><p class="warn">${CANCEL_NOTICE}</p>
      <div class="d-btns"><button class="ghost" data-a="close">돌아가기</button><button class="ok red" data-a="confirm-cancel">예약 취소</button></div></div></div>`;
  }
  if(m.type === 'qr'){
    const c = state.cart.find(x => x.oid === m.oid); if(!c) return '';
    const p = byId(c.pid);
    const payload = `TRADERS-SHARE|${c.oid}|P${p.id}|Q${c.qty}|${c.price}`;
    return `<div class="overlay" data-a="overlay"><div class="dialog qr-d">
      <h3>소분 수령 QR</h3>
      <div class="qr">${qrSvg(payload)}</div>
      <b class="qn">${p.name}</b>
      <p class="mini">${p.portions}인 소분 중 ${c.qty}소분 · ${won(c.price)}</p>
      <p class="mini">예약번호 ${c.oid}</p>
      <p class="warn" style="margin-top:10px">매장 소분 Zone에서 직원에게 이 QR을 보여주세요.</p>
      <div class="d-btns"><button class="ok" data-a="close">닫기</button></div></div></div>`;
  }
  return '';
}

/* ---------- 렌더 & 이벤트 ---------- */
function render(){
  const v = {'share-home':vShareHome, list:vList, detail:vDetail, cart:vCart, visit:vVisit}[state.view];
  $('#s-share').innerHTML = v();
  $('#layer').innerHTML = modalHTML();
  show('share');
}
function pick(id){ state.product = byId(id); state.qty = 1; }
function newOid(){ return 'TS' + Date.now().toString(36).toUpperCase().slice(-5) + Math.floor(Math.random()*36).toString(36).toUpperCase(); }

document.addEventListener('click', e => {
  if(e.target.closest('#go-tra')){ e.preventDefault(); state.stack = []; state.view = 'share-home'; render(); top0(); return; }
  const el = e.target.closest('[data-a]'); if(!el) return;
  if(el.dataset.a === 'overlay' && e.target !== el) return;     // 팝업 바깥(배경)을 눌렀을 때만 닫기
  e.stopPropagation();
  if(el.disabled) return;
  const a = el.dataset.a, v = el.dataset.v;
  switch(a){
    case 'back': back(); break;
    case 'exit': state.stack = []; state.modal = null; show('home'); break;
    case 'home-tab': state.stack = []; go('share-home', false); break;
    case 'cat-tab': state.tab = '전체'; go('list'); break;
    case 'cat': if(el.dataset.on === 'true'){ state.tab = '전체'; go('list'); } else toast('준비 중이에요'); break;
    case 'tab': state.tab = v; render(); break;
    case 'detail': pick(v); go('detail'); break;
    case 'qty-inc': state.qty = Math.min(remain(state.product), state.qty + 1); render(); break;
    case 'qty-dec': state.qty = Math.max(1, state.qty - 1); render(); break;
    case 'ask-reserve': state.modal = {type:'confirm'}; render(); break;
    case 'confirm-reserve': {
      const p = state.product, q = state.qty;
      if(q > remain(p)){ state.modal = null; render(); toast('남은 소분 수량이 부족해요'); break; }
      state.cart.push({oid:newOid(), pid:p.id, qty:q, price:calc(p,q)});
      saveCart(); state.modal = null; state.view = 'cart'; render(); top0(); toast('소분 금액으로 장바구니에 담았어요');
      break; }
    case 'cart': state.modal = null; go('cart'); break;
    case 'shop': state.tab = '전체'; state.stack = ['share-home']; state.view = 'list'; render(); top0(); break;
    case 'qr': state.modal = {type:'qr', oid:v}; render(); break;
    case 'ask-cancel': state.modal = {type:'cancel', oid:v}; render(); break;
    case 'confirm-cancel':
      state.cart = state.cart.filter(c => c.oid !== state.modal.oid); saveCart();
      state.modal = null; render(); toast('예약이 취소됐어요'); break;
    case 'close': case 'overlay': state.modal = null; render(); break;
    case 'visit': go('visit'); break;
  }
});
