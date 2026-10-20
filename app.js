/* 트레더 (TRA:TOGETHER) - 소분 예약
   홈 → 정육/수산 목록 → 상품 상세(소분 수량 선택) → 예약 확인 팝업 → 장바구니(소분 금액) → 품목별 QR */

/* ---------- 설정 ---------- */
const CANCEL_NOTICE = 'QR 발급 후 취소 시 수수료가 발생해요. QR 발급 전에는 수수료가 없어요.';
const CANCEL_FEE_RATE = 0.10;
const CANCEL_FEE_MIN = 1000;
const CANCEL_FEE_MAX = 3500;
const AUTH_KEY = 'traders_auth_v1';

/* price: 상품 판매가 / portions: 모집 완료에 필요한 총 소분 수 */
let PRODUCTS = [];

let FRESH_PRODUCTS = [];
let MEAT_SEAFOOD_PRODUCTS = [];
let FRESH_CATEGORIES = ['전체'];
let MEAT_CATEGORIES = ['전체'];
let SEAFOOD_CATEGORIES = ['전체'];
const SPLIT_REVIEW_EXAMPLES = {
  '뿌리채소·고구마·호박류':[
    '고구마 한 상자는 늘 남겼는데, 몇 개씩 나눠 오니 찌는 날에 맞춰 쓰기 딱 좋았어요.',
    '호박은 조금만 필요할 때가 많아서 소분이 반가웠어요. 남은 재료 걱정도 덜했고요.',
    '받은 양이 한 번에 요리하기 부담 없는 정도라 보관할 자리도 많이 차지하지 않았어요.'
  ],
  '버섯류':[
    '버섯은 종류별로 조금씩 쓰고 싶었는데 필요한 만큼 담아 전골 한 번 해 먹기 좋았어요.',
    '한 팩을 다 못 써서 시들 때가 많았는데, 이번엔 볶음 요리에 쓰고 깔끔하게 끝냈어요.',
    '버섯 여러 종류를 조금씩 맛볼 수 있어서 다음엔 어떤 걸 살지 고르기도 편했어요.'
  ],
  '신선 채소·샐러드류':[
    '샐러드 채소를 큰 봉지로 사면 마지막엔 남았는데, 먹을 만큼이라 신선할 때 다 썼어요.',
    '채소 몇 가지를 조금씩 받아 반찬이랑 샐러드에 나눠 쓰니 장보기 구성이 알찼어요.',
    '양배추를 통째로 사기 망설였는데 필요한 양만 받아 냉장고 공간이 여유로워졌어요.'
  ],
  '과일류':[
    '과일 한 박스는 다 먹기 전에 무를까 걱정됐는데 가족이 먹는 속도에 맞춰 살 수 있어요.',
    '여러 과일을 조금씩 받아 간식으로 먹어봤어요. 한 종류만 잔뜩 사는 것보다 좋네요.',
    '주말에 먹을 만큼만 받아 보관이 간단했어요. 다음 장보기 때도 이용하고 싶어요.'
  ],
  '스테이크·캠핑용 육류':[
    '캠핑 인원에 맞춰 고기를 준비할 수 있어 남기지 않았어요. 부위도 나눠 고를 수 있어 좋았습니다.',
    '스테이크는 양이 많아 망설였는데 한 끼에 맞는 양이라 집에서 굽기 부담 없었어요.',
    '캠핑용으로 필요한 만큼만 챙겨 가니 아이스박스 공간도 아끼고 준비가 한결 편했어요.'
  ],
  '돼지고기·한돈':[
    '삼겹살을 한 번 먹을 분량으로 받아 냉동실에서 꺼내기 편했어요. 포장도 정돈돼 있었습니다.',
    '대용량 가격은 괜찮아도 보관이 걱정이었는데, 필요한 양만 살 수 있어 만족스러워요.',
    '구이용으로 한 번, 볶음용으로 한 번 쓰기 알맞은 양이라 남김없이 요리했어요.'
  ],
  '한우·소고기':[
    '구이용을 조금만 사고 싶었는데 소분으로 맞춰 살 수 있어 특별한 저녁에 잘 먹었어요.',
    '국거리와 구이용을 필요한 만큼 골라 살 수 있어 메뉴 계획 세우기가 편했습니다.',
    '한우는 가격도 양도 부담스러웠는데 한 끼 분량으로 나눠 구매하니 시도하기 좋았어요.'
  ],
  '수입육·양고기':[
    '양고기를 많이 사기엔 부담됐는데 둘이 먹을 만큼이라 처음 맛보기에 좋았어요.',
    '평소 잘 안 사던 부위를 소량으로 골라봤어요. 다음엔 다른 조리법으로도 먹어보려 해요.',
    '한 번 구워 먹기 좋은 양이라 남은 고기를 오래 보관할 걱정이 없었어요.'
  ],
  '양념육·갈비·제육볶음':[
    '양념육은 한 끼에 다 못 먹을 때가 있었는데 가족 수에 맞는 양이라 편했어요.',
    '퇴근 후 별도 재료를 많이 준비하지 않아도 돼서 저녁 메뉴로 빠르게 만들었습니다.',
    '갈비를 넉넉히 사기 망설였는데 필요한 만큼만 준비할 수 있어 주말 식사에 잘 썼어요.'
  ],
  '닭고기·닭 특수부위':[
    '닭고기를 요리별로 나눠 쓸 수 있어요. 한 팩을 해동했다가 남기는 일이 줄었습니다.',
    '닭 특수부위는 양이 많으면 어쩌나 했는데 소량으로 맛볼 수 있어 좋았어요.',
    '한 번 조리하기 알맞은 양이라 닭볶음탕 재료 준비가 간단했어요.'
  ],
  '회·해산물·프리미엄 수산물':[
    '회를 큰 구성으로 사기 부담스러웠는데 둘이 먹을 만큼이라 주말 저녁에 알맞았어요.',
    '해산물을 여러 종류 조금씩 준비해 식탁을 차려봤어요. 남는 재료 없이 먹기 좋았습니다.',
    '특별한 날 먹으려고 필요한 양만 골랐어요. 양 조절이 돼서 다음에도 이용할 생각이에요.'
  ],
  '조개류·꽃게·골뱅이':[
    '조개를 한가득 사면 손질과 보관이 걱정됐는데 한 번 끓일 양이라 편했어요.',
    '꽃게를 몇 마리만 준비할 수 있어 가족끼리 먹기 좋았어요. 남은 재료가 없어 깔끔하네요.',
    '손질할 양이 많지 않아 해물 요리 준비가 수월했어요. 필요한 만큼 고를 수 있는 점이 좋았습니다.'
  ],
  '전복·장어·문어':[
    '전복을 많이 사기엔 부담됐는데 필요한 개수만큼 골라 요리할 수 있어 좋았어요.',
    '장어는 양 조절이 어려웠는데 한 끼 먹기 좋은 양이라 준비하기 편했습니다.',
    '문어를 한 번에 다 쓰지 않아도 돼서 좋았어요. 남은 양을 보관할 걱정이 줄었습니다.'
  ],
  '간고등어·냉동 생선':[
    '생선은 한 번 먹을 양씩 꺼낼 수 있어 편해요. 냉동실에서 자리도 덜 차지했습니다.',
    '간고등어를 필요한 끼니 수에 맞춰 구매했어요. 매번 큰 포장을 뜯지 않아도 되네요.',
    '생선 반찬이 필요할 때 한 팩씩 꺼내 쓰니 식단 준비가 간단해졌어요.'
  ],
  '제주 수산물·선물세트':[
    '선물세트는 구성이 커서 망설였는데 가족이 먹을 양만 준비할 수 있어 좋았어요.',
    '제주 수산물을 몇 가지 조금씩 맛볼 수 있어 구성 고르는 재미가 있었습니다.',
    '한 번에 많이 먹기 어려운 품목이라 필요한 만큼 나눠 살 수 있는 점이 실용적이에요.'
  ]
};
const CATS = [
  ['leaf','신선식품',true],['meat','정육/수산',true],['bowl','가공식품',false],['snow','냉동식품',false],
  ['bread','베이커리',false],['drink','음료/주류',false],['soap','생활용품',false],['paw','반려동물',false]
];

/* ---------- 유틸 ---------- */
const $ = s => document.querySelector(s);
const won = n => n.toLocaleString('ko-KR') + '원';
const escapeHtml = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic = n => `<svg class="ic"><use href="#i-${n}"/></svg>`;
const productVisual = p => +p.id===3
  ? `<img class="product-photo" src="assets/hanwoo-bulgogi-1kg.png" alt="${escapeHtml(p.name)}">`
  : p.emoji;
const unitPrice = p => Math.round(p.price / p.portions);                 // 1소분 가격
const calc = (p, q) => Math.round(p.price / p.portions * q);             // 가격 ÷ 인원 × 구매 소분 수
const byId = id => PRODUCTS.find(p => +p.id === +id);

const state = { view:'root-home', stack:[], navTab:'home', tab:'전체', freshCategory:'전체', productCategory:'전체', searchQuery:'', product:null, qty:1, cart:[], issued:[], completed:[], pending:[], waitlist:[], rounds:[], community:[], modal:null };
let communityLoadVersion=0;
let sharedSyncVersion=0;
try { state.session = JSON.parse(localStorage.getItem(AUTH_KEY)) || null; } catch(e) { state.session = null; }

function syncHomeAuth(){
  const entry = $('.login'); if(!entry) return;
  entry.dataset.a = state.session ? 'account' : 'auth-entry';
  entry.innerHTML = state.session ? '로그인됐어요 <b>마이페이지 열기</b>' : '<u>로그인하고</u> <b>혜택 받기</b>';
}
syncHomeAuth();

const currentRound = p => p.price && !p.availability ? state.rounds.find(r => +r.product_id === p.id && r.status === 'open') : null;
const latestRound = p => state.rounds.find(r => +r.product_id === p.id);
const remain = p => { const r=currentRound(p); return r ? Math.max(0, r.group_size-r.joined_qty) : 0; };
const cartTotal = () => [...state.cart,...state.issued].reduce((a, c) => a + c.price, 0);
const cancellationFee = amount => Math.min(CANCEL_FEE_MAX, Math.max(CANCEL_FEE_MIN, Math.round(amount * CANCEL_FEE_RATE)));

function authHeaders(){
  const cfg=window.TRADERS_SUPABASE||{};
  return {'apikey':cfg.anonKey||'', 'Authorization':`Bearer ${state.session?.access_token||cfg.anonKey||''}`, 'Content-Type':'application/json'};
}
async function dbRequest(path, options={}, retry=true){
  const cfg=window.TRADERS_SUPABASE||{};
  if(!cfg.url||!cfg.anonKey) throw new Error('Supabase 설정이 없어요.');
  const response=await fetch(cfg.url.replace(/\/$/,'')+'/rest/v1/'+path,{...options,headers:{...authHeaders(),...(options.headers||{})}});
  const raw=await response.text(); let data=null;
  try{data=raw?JSON.parse(raw):null;}catch(e){data={message:raw};}
  if(response.status===401 && retry && state.session?.refresh_token){
    const refreshed=await fetch(cfg.url.replace(/\/$/,'')+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'apikey':cfg.anonKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:state.session.refresh_token})});
    if(refreshed.ok){const session=await refreshed.json();state.session={...session,user:session.user};localStorage.setItem(AUTH_KEY,JSON.stringify(state.session));return dbRequest(path,options,false);}
    state.session=null;localStorage.removeItem(AUTH_KEY);syncHomeAuth();
  }
  if(!response.ok) throw new Error(data?.message||data?.hint||data?.details||'공유 DB 요청에 실패했어요. supabase-setup.sql을 먼저 적용했는지 확인해 주세요.');
  return data;
}
const dbRpc=(name,args)=>dbRequest(`rpc/${name}`,{method:'POST',body:JSON.stringify(args)});
async function loadProducts(){
  const rows=await dbRequest('products?select=*&is_active=eq.true&order=id.asc');
  PRODUCTS=(rows||[]).map(row=>({...row,regularPrice:row.regular_price,price100g:row.price_100g,reviewCount:row.review_count}));
  FRESH_PRODUCTS=PRODUCTS.filter(p=>p.type==='신선식품');
  MEAT_SEAFOOD_PRODUCTS=PRODUCTS.filter(p=>['정육','수산'].includes(p.type));
  const uniqueCategories=items=>['전체',...new Set(items.map(p=>p.category).filter(Boolean))];
  FRESH_CATEGORIES=uniqueCategories(FRESH_PRODUCTS);
  MEAT_CATEGORIES=uniqueCategories(MEAT_SEAFOOD_PRODUCTS.filter(p=>p.type==='정육'));
  SEAFOOD_CATEGORIES=uniqueCategories(MEAT_SEAFOOD_PRODUCTS.filter(p=>p.type==='수산'));
  if(!state.modal&&!['community','root-home'].includes(state.view)) render();
  return PRODUCTS;
}
async function loadCommunity(){
  const version=++communityLoadVersion;
  const rows=await dbRpc('list_product_suggestions',{});
  if(version!==communityLoadVersion) return state.community;
  state.community=rows||[];
  if(state.view==='community'){
    const list=$('#community-suggestions');
    if(list) list.innerHTML=communitySuggestionsHTML();
  }
  return state.community;
}
async function submitSuggestion(form){
  if(!requireLogin()) return;
  const data=new FormData(form), productName=String(data.get('product_name')||'').trim(), details=String(data.get('details')||'').trim();
  if(!productName) return toast('추천할 상품명을 입력해 주세요');
  const submitButton=form.querySelector('[type="submit"]');
  submitButton.disabled=true;
  submitButton.textContent='등록 중…';
  try{
    const rows=await dbRequest('product_suggestions?select=id,product_name,details,created_at',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({user_id:state.session.user.id,product_name:productName,details})});
    const created=rows?.[0];
    if(!created?.id) throw new Error('등록 결과를 확인하지 못했어요. 목록을 새로고침해 확인해 주세요.');
    communityLoadVersion++;
    state.community=[{...created,vote_count:0,voted_by_me:false},...state.community.filter(item=>item.id!==created.id)];
    const list=$('#community-suggestions');
    if(list&&state.view==='community') list.innerHTML=communitySuggestionsHTML();
    form.reset();
    toast('상품 추천을 등록했어요');
  }catch(error){
    toast(error.message||'상품 추천을 등록하지 못했어요');
  }finally{
    submitButton.disabled=false;
    submitButton.textContent='상품 추천하기';
  }
}
async function toggleSuggestionVote(id){
  if(!requireLogin()) return;
  const item=state.community.find(x=>x.id===id);if(!item)return;
  try{
    const uid=encodeURIComponent(state.session.user.id), sid=encodeURIComponent(id);
    if(item.voted_by_me) await dbRequest(`suggestion_votes?suggestion_id=eq.${sid}&user_id=eq.${uid}`,{method:'DELETE'});
    else await dbRequest('suggestion_votes',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({suggestion_id:id,user_id:state.session.user.id})});
    await loadCommunity();
  }catch(error){toast(error.message||'투표를 반영하지 못했어요');}
}
async function syncSharedData({quiet=false}={}){
  const syncVersion=++sharedSyncVersion;
  const roundsPromise=dbRequest('share_round_progress?select=*&order=created_at.desc');
  const ownPromise=state.session?Promise.all([
    dbRequest('share_orders?select=*&status=eq.confirmed&order=created_at.desc'),
    dbRequest('share_orders?select=*&status=eq.pending&order=created_at.desc'),
    dbRequest('share_orders?select=*&status=eq.barcode_issued'),
    dbRequest('share_orders?select=*&status=eq.completed'),
    dbRequest('share_waitlist?select=*&status=eq.waiting&order=created_at.asc')
  ]):Promise.resolve([[],[],[],[],[]]);
  const [rounds,own]=await Promise.all([roundsPromise,ownPromise]);
  // Ignore an older poll if a newer refresh has already started. Otherwise a
  // slow response can put a cancelled waitlist row back into the rendered UI.
  if(syncVersion!==sharedSyncVersion) return;
  const wasPending=new Set(state.pending.map(x=>x.oid));
  state.rounds=rounds||[];
  // A confirmed order is eligible for QR only if its cohort itself is filled.
  // This prevents stale or inconsistent order status from exposing a pickup QR.
  const filledRoundIds=new Set((rounds||[]).filter(r=>r.status==='filled'&&Number(r.joined_qty)>=Number(r.group_size)).map(r=>String(r.id)));
  const orderView=x=>({oid:x.public_code,pid:x.product_id,qty:x.qty,price:x.amount,roundId:x.round_id,createdAt:x.created_at,barcodeIssuedAt:x.barcode_issued_at,completedAt:x.completed_at});
  state.cart=(own[0]||[]).filter(x=>filledRoundIds.has(String(x.round_id))).map(orderView);
  state.pending=(own[1]||[]).map(x=>({oid:x.public_code,pid:x.product_id,qty:x.qty,price:x.amount,roundId:x.round_id,createdAt:x.created_at}));
  state.issued=(own[2]||[]).filter(x=>filledRoundIds.has(String(x.round_id))).map(orderView);
  state.completed=(own[3]||[]).map(orderView);
  state.waitlist=(own[4]||[]).map(x=>({wid:x.id,pid:x.product_id,qty:x.qty,price:x.amount,createdAt:x.created_at}));
  const newlyConfirmed=state.cart.some(x=>wasPending.has(x.oid));
  const newlyPromoted=state.pending.some(x=>!wasPending.has(x.oid));
  if(!quiet&&newlyConfirmed){
    const order=state.cart.find(x=>wasPending.has(x.oid));
    if(!state.modal&&order){state.modal={type:'success',oid:order.oid};render();}
    toast('모집이 완료되어 예약이 확정됐어요');
  }
  else if(!quiet&&newlyPromoted) showShareAlert('대기 순서가 되어 모집에 참여됐어요');
  syncHomeAuth();
  if(!state.modal&&['detail','categories','fresh-list','meat-list','search','reserve','cart','account'].includes(state.view)) render();
}

function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1900);
}
function showShareAlert(message){
  state.modal={type:'share-alert',message};
  $('#layer').innerHTML=modalHTML();
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
  if(state.stack.length){
    state.view = state.stack.pop();
    if(state.view==='root-home'){
      state.navTab='home';
      state.modal=null;
      show('home');
      top0();
      return;
    }
    if(state.view==='share-home'&&!state.navTab) state.navTab='home';
    render();
  }else{ state.navTab='home';state.view='root-home';show('home'); }
  top0();
}
function navigateTab(view,tab){
  state.navTab=tab;
  if(state.view===view){ render(); return; }
  go(view);
}

/* ---------- 공통 조각 ---------- */
const cartBtn = () => {const count=state.cart.length+state.issued.length;return `<button class="cart-btn" data-a="cart" aria-label="장바구니">${ic('cart')}${count ? `<em>${count}</em>` : ''}</button>`;};
const head = (title, withCart = true) => `
  <div class="sh-top"><button class="back" data-a="back" aria-label="뒤로">${ic('back')}</button>
  <h1>${title}</h1>${withCart ? cartBtn() : ''}</div>`;
const shareTab = () => `<footer class="tab share">
  <a data-a="home-tab" class="${state.navTab==='home'?'on':''}">${ic('home')}<span>홈</span></a>
  <a data-a="community-tab" class="${state.navTab==='community'?'on':''}">${ic('together')}<span>커뮤니티</span></a>
  <a data-a="reserve-tab" class="${state.navTab==='reserve'?'on':''}">${ic('grid')}<span>소분 예약</span></a>
  <a data-a="account-tab" class="${state.navTab==='account'?'on':''}">${ic('user')}<span>마이페이지</span></a></footer>`;

/* ---------- 1. 홈 & 카테고리 ---------- */
function vShareHome(){
  return `
  <div class="sh-top"><button class="back" data-a="exit" aria-label="트레이더스 홈">${ic('back')}</button>
    <div class="brand">TRADERS <span>TOGETHER</span></div>${cartBtn()}</div>
  <button class="sh-search" data-a="search-open">${ic('search')}<span>상품명, 카테고리를 검색해보세요</span></button>
  <div class="hero"><div><b>필요한 만큼만,<br>소분 예약!</b><p>대용량 정육·수산을 원하는 만큼</p></div><div class="e">🥩</div></div>
  <div class="cats">${CATS.map(c=>`<button data-a="cat" data-v="${c[1]}" data-on="${c[2]}"><i>${ic(c[0])}</i>${c[1]}</button>`).join('')}</div>
  <div class="sec-t">지금 많이 찾는 상품</div>
  <div class="pop">${[PRODUCTS.find(p=>+p.id===3),PRODUCTS.find(p=>+p.id===1)].filter(Boolean).map(p=>`
    <button data-a="detail" data-v="${p.id}"><div class="im ${p.cls}">${productVisual(p)}</div>
    <span class="mini">${p.name}</span><b>1소분 ${won(unitPrice(p))}</b></button>`).join('')}</div>
  ${shareTab('home')}`;
}

/* ---------- 2. 카테고리별 상품 목록 ---------- */
function productCards(items){
  return items.map(p=>{
    const available=Number.isFinite(p.price)&&p.price>0&&!p.availability;
    const r = remain(p);
    const round = currentRound(p);
    return `<div class="card" ${available?`data-a="detail" data-v="${p.id}"`:''}>
      <div class="im ${p.cls}">${productVisual(p)}<span class="tag ${round?'':'off'}">${p.availability|| (round ? '모집중' : '마감')}</span></div>
      <div class="info"><b>${p.name}</b>
        ${p.weight?`<span class="mini">${p.weight}</span><br>`:''}
        ${available?`<span class="price">${won(p.price)}</span>${p.discount?` <span class="discount">${p.discount}% 할인</span>`:''}<br>`:`<span class="unavailable">${p.availability||'판매 정보 없음'}</span><br>`}
        ${p.regularPrice?`<span class="old">${won(p.regularPrice)}</span> `:''}<span class="mini">${available?`1소분 ${won(unitPrice(p))}`:''}${p.price100g?`${available?' · ':''}100g ${won(p.price100g)}`:''}</span><br>
        ${p.rating!==null&&p.rating!==undefined?`<span class="rating">★ ${p.rating.toFixed(1)} <span class="mini">(${p.reviewCount??0} 리뷰)</span></span><br>`:''}
        ${available?`<span class="pill">${round ? `모집 ${round.joined_qty}/${round.group_size}소분` : `모집 마감 · 대기 ${latestRound(p)?.waiting_count||0}명`}</span><button class="btn sm" data-a="detail" data-v="${p.id}">상품 보기</button>`:''}</div></div>`;
  }).join('');
}
function vCategories(){
  const available=CATS.filter(c=>c[2]);
  return `${head('카테고리')}
  <div class="sec-t">소분 상품 카테고리</div>
  <div class="cats category-picker">${available.map(c=>`<button data-a="cat" data-v="${c[1]}" data-on="true"><i>${ic(c[0])}</i>${c[1]}</button>`).join('')}</div>
  ${shareTab('share')}`;
}
function vFreshList(){
  const items=FRESH_PRODUCTS.filter(p=>state.freshCategory==='전체'||p.category===state.freshCategory);
  return `${head('신선식품')}
  <div class="tabs fresh-tabs">${FRESH_CATEGORIES.map(c=>`<button class="${state.freshCategory===c?'on':''}" data-a="fresh-category" data-v="${c}">${c}</button>`).join('')}</div>
  <div class="sec-t">${state.freshCategory==='전체'?'신선식품 소분 상품':state.freshCategory}</div>
  <div class="list">${productCards(items)}</div>
  ${shareTab('share')}`;
}
function vMeatList(){
  const categories=state.tab==='수산'?SEAFOOD_CATEGORIES:state.tab==='정육'?MEAT_CATEGORIES:['전체',...MEAT_CATEGORIES.slice(1),...SEAFOOD_CATEGORIES.slice(1)];
  const items=MEAT_SEAFOOD_PRODUCTS.filter(p=>(state.tab==='전체'||p.type===state.tab)&&(state.productCategory==='전체'||p.category===state.productCategory));
  const tabs=['전체','정육','수산'];
  return `${head('정육/수산')}
  <div class="tabs">${tabs.map(t=>`<button class="${state.tab===t?'on':''}" data-a="tab" data-v="${t}">${t}</button>`).join('')}</div>
  <div class="tabs fresh-tabs">${categories.map(c=>`<button class="${state.productCategory===c?'on':''}" data-a="product-category" data-v="${c}">${c}</button>`).join('')}</div>
  <div class="list">${productCards(items)}</div>
  ${shareTab('share')}`;
}
function searchProducts(query){
  const q=query.trim().toLocaleLowerCase('ko-KR');
  if(!q) return [];
  const normalized=q.replace(/\s/g,'');
  const meatSeafoodAlias=normalized==='정육/수산'||normalized==='정육수산';
  return PRODUCTS.filter(p=>{
    const fields=[p.name,p.category,p.type,p.weight].filter(Boolean).join(' ').toLocaleLowerCase('ko-KR');
    return meatSeafoodAlias?['정육','수산'].includes(p.type):fields.includes(q);
  });
}
function searchResultsHTML(q){
  const results=searchProducts(q);
  return q?`<div class="sec-t">“${escapeHtml(q)}” 검색 결과 ${results.length}개</div>
    ${results.length?`<div class="list">${productCards(results)}</div>`:'<div class="search-empty">검색 결과가 없어요.<br>상품명이나 카테고리를 다시 확인해 주세요.</div>'}`
    :'<div class="search-empty">상품명 또는 카테고리를 입력해 주세요.<br><span>예: 고구마, 버섯류, 정육, 수산</span></div>';
}
function vSearch(){
  const q=state.searchQuery.trim();
  return `${head('상품 검색',false)}
  <form class="product-search" data-search-form>
    <label for="product-search-input">${ic('search')}</label>
    <input id="product-search-input" name="q" type="search" placeholder="상품명, 카테고리를 검색해보세요" value="${escapeHtml(q)}" autocomplete="off">
    <button type="button" data-a="search-clear" aria-label="검색어 지우기" ${q?'':'hidden'}>×</button>
  </form>
  <div id="search-results">${searchResultsHTML(q)}</div>
  ${shareTab('share')}`;
}

function vCommunity(){
  return `${head('커뮤니티',false)}
  <section class="community-intro"><b>같이 소분하고 싶은 상품을 추천해 주세요</b><p>추천하고 좋아요를 눌러 다음 소분 상품을 함께 골라요.</p></section>
  <form class="community-form" data-community-form>
    <label for="suggestion-name">소분하고 싶은 상품</label>
    <input id="suggestion-name" name="product_name" maxlength="100" placeholder="예: 대용량 견과류 세트" required>
    <textarea name="details" maxlength="240" rows="2" placeholder="상품 정보나 추천 이유를 적어주세요 (선택)"></textarea>
    <button class="btn" type="submit">상품 추천하기</button>
  </form>
  <div class="community-list-head"><b>상품 추천 / 투표</b><button data-a="community-refresh">새로고침</button></div>
  <div id="community-suggestions">${communitySuggestionsHTML()}</div>
  ${shareTab()}`;
}
function communitySuggestionsHTML(){
  return state.community.length?`<div class="community-list">${state.community.map((item,index)=>`<article class="suggestion-card">
    <div class="suggestion-rank">${index+1}</div><div class="suggestion-body"><b>${escapeHtml(item.product_name)}</b>${item.details?`<p>${escapeHtml(item.details)}</p>`:''}<small>${new Date(item.created_at).toLocaleDateString('ko-KR')}</small></div>
    <button class="vote-btn ${item.voted_by_me?'voted':''}" data-a="suggestion-vote" data-v="${item.id}" aria-label="좋아요 투표">♥ <span>${item.vote_count||0}</span></button>
  </article>`).join('')}</div>`:'<div class="search-empty">아직 추천된 상품이 없어요.<br>첫 번째 상품을 추천해 보세요.</div>';
}

/* ---------- 3. 상세 & 소분 수량 선택 ---------- */
function vDetail(){
  const p = state.product, round=currentRound(state.product), r = round?remain(p):p.portions;
  const reviewExamples=SPLIT_REVIEW_EXAMPLES[p.category]||['필요한 만큼 나눠 받아 보관과 활용이 편했어요.','한 번에 다 쓰기 알맞은 양이라 남김 없이 요리했어요.','대용량 구매가 부담스러웠는데 필요한 분량만 고를 수 있어 좋았어요.'];
  const reviewExample=reviewExamples[(Number(p.id)||0)%reviewExamples.length];
  const q = Math.min(Math.max(1, state.qty), Math.max(1, r));
  const pending=state.pending.find(x=>x.pid===p.id), waiting=state.waitlist.find(x=>x.pid===p.id);
  state.qty = q;
  return `${head('소분 예약')}
  <div class="d-img ${p.cls}">${productVisual(p)}<span class="tag">${p.portions}인 소분</span></div>
  <div class="d-body">
    ${p.category?`<div class="mini">${p.category}${p.weight?` · ${p.weight}`:''}</div>`:''}
    <h2>${p.name}</h2>
    <div class="d-price">${won(p.price)}${p.discount?` <span class="off">${p.discount}% 할인</span>`:''}</div>
    ${p.regularPrice?`<div class="mini"><span class="old">${won(p.regularPrice)}</span> 정상가</div>`:''}
    <div class="chips"><span>${p.portions}인 소분</span><span>1소분 ${won(unitPrice(p))}</span><span>${round?`모집 ${round.joined_qty}/${round.group_size}`:`대기 ${latestRound(p)?.waiting_count||0}명`}</span></div>
    ${p.price100g?`<div class="mini">100g당 ${won(p.price100g)}</div>`:''}
    ${p.rating?`<div class="review-summary">★ ${p.rating.toFixed(1)} <span class="mini">제공된 상품 평점 · 리뷰 ${p.reviewCount}개</span></div>`:''}

    <div class="box"><h3>소분 수량 선택</h3>
      <div class="row">
        <div class="stepper"><button data-a="qty-dec" ${q<=1?'disabled':''}>−</button><span class="big">${q}소분</span><button data-a="qty-inc" ${q>=r?'disabled':''}>+</button></div>
        <span class="mini">최대 ${r}소분</span></div>
      <p class="mini" style="margin-top:10px">${round?'모든 소분 수량이 모이면 예약이 확정돼요.':'새 모집을 시작하거나 대기할 소분 수량을 선택해 주세요.'}</p>
      <div class="calc"><span>${won(p.price)} ÷ ${p.portions}인 × ${q}소분</span><b>${won(calc(p,q))}</b></div>
    </div>
    <div class="review-box"><div class="review-title"><b>소분 후기 예시</b><span>화면 예시 · 실제 구매 후기 아님</span></div>
      <p>“${reviewExample}”</p></div>
    <div class="note" style="margin:14px 0 0">ⓘ 전체 소분 모집이 완료된 뒤 장바구니와 수령 QR이 생성돼요.</div>
  </div>
  <div class="cta">${pending
    ? `<button class="btn" data-a="ask-cancel" data-v="${pending.oid}">모집 대기 취소하기</button>`
    : round
      ? `<button class="btn" data-a="ask-reserve">소분 모집 참여하기 · ${won(calc(p,q))}</button>`
      : `<div class="cta-actions">
        <button class="btn cta-choice" data-a="${waiting?'leave-wait':'join-wait'}" data-v="${p.id}"><b>${waiting?'대기 취소':'마감 대기 신청'}</b><span>${waiting?'대기 신청을 취소해요':'다음 모집 순서를 기다려요'}</span></button>
        <button class="btn cta-choice cta-choice-secondary" data-a="start-round" data-v="${p.id}"><b>새 모집 시작</b><span>새 모임을 열고 참여해요</span></button>
      </div>`}</div>`;
}

/* ---------- 4. 장바구니 ---------- */
function vCart(){
  const orders=[...state.cart.map(c=>({...c,orderState:'confirmed'})),...state.issued.map(c=>({...c,orderState:'barcode_issued'}))];
  if(!orders.length) return `${head('장바구니', false)}
    <div class="empty"><i>${ic('cart')}</i><b>진행 중인 예약이 없어요</b><p>소분 모집이 완료되면 장바구니와 QR이 생성돼요.</p>
    <button class="btn" style="max-width:220px;margin:18px auto 0" data-a="shop">소분 상품 보러가기</button></div>`;
  return `${head('장바구니', false)}
  <div class="cart-list">${orders.map(c=>{
    const p = byId(c.pid);
    return `<div class="c-item">
      <div class="c-top"><div class="r-img ${p.cls}">${productVisual(p)}</div>
        <div class="c-info"><b>${p.name}</b>
          <span class="mini">${p.portions}인 소분 중 ${c.qty}소분 · ${c.orderState==='barcode_issued'?'바코드 발급 완료':'오늘 방문'}</span>
          <span class="mini">예약번호 ${c.oid}</span>
          <div class="c-price">${won(c.price)}</div></div></div>
      ${c.orderState==='barcode_issued'?`<p class="pickup-status">바코드 발급 완료 · 결제 후 수령을 완료해 주세요.</p><div class="c-btns"><button class="qrb" data-a="ask-complete" data-v="${c.oid}">수령 완료 처리</button></div>`:`<div class="c-btns"><button class="qrb" data-a="qr" data-v="${c.oid}">${ic('qr')}QR 보기</button>
        <button class="cancel" data-a="ask-cancel" data-v="${c.oid}">예약 취소</button></div>`}</div>`;}).join('')}</div>
  <div class="sum"><div class="row"><span>진행 중 예약 ${orders.length}건</span><span>소분 합계</span></div>
    <div class="row" style="margin-top:6px"><span class="mini">QR 사용 후에는 다시 사용할 수 없어요</span><b class="big">${won(cartTotal())}</b></div></div>
  <p class="mini" style="padding:0 20px 10px">${CANCEL_NOTICE}</p>
  <div class="cta"><button class="btn" data-a="home-tab">쇼핑 계속하기</button></div>`;
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

/* ---------- 로그인 / 회원가입 ---------- */
function vAuth(signup = false){
  return `${head(signup ? '회원가입' : '로그인', false)}
  <div class="auth-brand"><b><span>e</span>mart</b></div>
  <form class="auth-form" data-auth-form="${signup?'signup':'login'}">
    ${signup ? '<label>이름<input name="name" autocomplete="name" placeholder="이름" required></label>' : ''}
    <label>이메일<input name="email" type="email" autocomplete="email" placeholder="이메일 주소" required></label>
    <label>비밀번호<input name="password" type="password" autocomplete="${signup?'new-password':'current-password'}" minlength="8" placeholder="비밀번호 (8자 이상)" required></label>
    ${signup ? '<label>비밀번호 확인<input name="passwordConfirm" type="password" autocomplete="new-password" minlength="8" placeholder="비밀번호 확인" required></label>' : ''}
    <button class="auth-submit" type="submit">${signup?'회원가입':'로그인'}</button>
  </form>
  <div class="auth-links">${signup ? '이미 계정이 있나요? <button data-a="login">로그인</button>' : '계정이 없나요? <button data-a="signup">통합 회원가입</button>'}</div>
  <p class="auth-note">이메일과 비밀번호로 안전하게 로그인해요.</p>`;
}
function vAccount(){
  const user=state.session?.user||{}, email=user.email||'';
  const name=user.user_metadata?.name||user.user_metadata?.full_name||email.split('@')[0]||'회원';
  const displayName=name.length>20?`${name.slice(0,20)}…`:name;
  return `<header class="mypage-header">
    <button data-a="back" aria-label="뒤로">${ic('back')}</button><button data-a="root-home" aria-label="트레이더스 홈">${ic('home')}</button>
    <h1>마이페이지</h1><button data-a="search-open" aria-label="검색">${ic('search')}</button><button data-a="account-menu" aria-label="메뉴">${ic('menu')}</button>
  </header>
  <section class="mypage-profile">
    <div class="mypage-avatar">${ic('user')}</div><div><span>${escapeHtml(displayName)}</span><b>${escapeHtml(email)}</b></div>
  </section>
  <section class="membership-cards" aria-label="멤버십">
    <article class="membership-card"><b>트레이더스 멤버십</b><span><i>T</i> 가입하고 다양한 혜택을 만나보세요</span></article>
    <article class="membership-card membership-emart"><b>이마트 포인트</b><span><i>e</i> 포인트 적립과 사용 안내</span></article>
  </section>
  <section class="mypage-stats">
    <div><i>▣</i><span>쿠폰</span><b>0개</b></div><div><i>♥</i><span>리뷰</span><b>0개</b></div><div><i>▤</i><span>영수증</span><b>0개</b></div>
  </section>
  <section class="mypage-section"><h2>혜택&amp;멤버십</h2>
    <button><i class="benefit-icon stamp">e</i><span>e스탬프</span><b>0/3</b><em>›</em></button>
    <button><i class="benefit-icon uni">U</i><span>유니버스클럽</span><em>›</em></button>
    <button><i class="benefit-icon traders">TR</i><span>트레이더스클럽</span><em>›</em></button>
    <button><i class="benefit-icon reward">₩</i><span>리워드 링크</span><em>›</em></button>
  </section>
  <section class="mypage-section my-activity" id="my-activity"><h2>내 활동</h2>
    <button data-a="community-tab"><span>커뮤니티 활동</span><em>›</em></button>
    <button data-a="account-settings"><span>계정 정보</span><em>›</em></button>
    <button data-a="logout"><span>로그아웃</span><em>›</em></button>
  </section>
  ${shareTab()}`;
}
function vReserve(){
  return `${head('소분 예약')}
  <section class="reserve-intro"><b>내 소분 예약</b><p>참여 중인 모집과 확정된 예약을 확인하세요.</p></section>
  <div class="reserve-shortcuts">
    <button data-a="reserve-section" data-v="pending-reservations">모집 참여 <b>${state.pending.length}건</b></button>
    <button data-a="reserve-section" data-v="waitlist-reservations">마감 대기 <b>${state.waitlist.length}건</b></button>
    <button data-a="cart">진행 중 <b>${state.cart.length+state.issued.length}건</b></button>
  </div>
  <section class="reserve-section" id="pending-reservations"><h2>모집 참여 중</h2>
    ${state.pending.length?state.pending.map(x=>{const p=byId(x.pid),r=state.rounds.find(y=>+y.product_id===x.pid);return `<div class="account-order"><button class="account-order-product" data-a="product-detail" data-v="${p.id}" aria-label="${escapeHtml(p.name)} 상품 상세 보기"><b>${escapeHtml(p.name)}</b><span>${x.qty}소분 · ${r?`모집 ${r.joined_qty}/${r.group_size}`:'다른 이용자 참여 대기 중'}</span><em>상품 상세 보기 ›</em></button><button data-a="ask-cancel" data-v="${x.oid}">참여 취소</button></div>`;}).join(''):'<p class="mini">참여 중인 모집이 없어요.</p>'}
  </section>
  <section class="reserve-section" id="waitlist-reservations"><h2>마감 대기</h2>
    ${state.waitlist.length?state.waitlist.map(x=>`<div class="account-order"><b>${escapeHtml(byId(x.pid).name)}</b><span>${x.qty}소분 · 다음 모집 대기</span><button data-a="leave-wait" data-v="${x.pid}">대기 취소</button></div>`).join(''):'<p class="mini">대기 신청한 상품이 없어요.</p>'}
  </section>
  <section class="reserve-section"><h2>확정된 예약</h2>
    ${state.cart.length||state.issued.length?`<p class="mini">진행 중인 예약과 QR은 장바구니에서 확인할 수 있어요.</p><button class="btn" data-a="cart">진행 중 예약 보기</button>`:'<p class="mini">진행 중인 예약이 없어요.</p>'}
  </section>
  <section class="reserve-section" id="completed-reservations"><h2>이용 완료</h2>
    ${state.completed.length?state.completed.map(x=>{const p=byId(x.pid);return `<div class="account-order"><b>${escapeHtml(p.name)}</b><span>${x.qty}소분 · 수령 완료 · ${won(x.price)}</span></div>`;}).join(''):'<p class="mini">완료된 이용 내역이 없어요.</p>'}
  </section>
  <button class="linkrow" data-a="home-tab">소분 상품 둘러보기 ›</button>
  ${shareTab()}`;
}
async function submitAuth(form){
  const cfg = window.TRADERS_SUPABASE || {};
  if(!cfg.url || !cfg.anonKey){ toast('Supabase anon/publishable key를 설정해 주세요'); return; }
  const data = new FormData(form), email = String(data.get('email')||'').trim(), password = String(data.get('password')||'');
  const signup = form.dataset.authForm === 'signup';
  if(signup && password !== data.get('passwordConfirm')){ toast('비밀번호가 서로 달라요'); return; }
  const button = form.querySelector('[type="submit"]'); button.disabled = true; button.textContent = '처리 중…';
  try {
    const endpoint = signup ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password';
    const response = await fetch(cfg.url.replace(/\/$/, '') + endpoint, {method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.anonKey},body:JSON.stringify(signup ? {email,password,data:{name:data.get('name')}} : {email,password})});
    const result = await response.json();
    if(!response.ok) throw new Error(result.msg || result.message || result.error_description || result.error || '인증에 실패했어요');
    if(signup && !result.access_token){ toast('가입 확인 메일을 보냈어요. 이메일을 확인해 주세요.'); state.view='login'; render(); return; }
    state.session = {access_token:result.access_token,refresh_token:result.refresh_token,user:result.user};
    localStorage.setItem(AUTH_KEY, JSON.stringify(state.session)); syncHomeAuth(); state.view='account'; render();
    try{await syncSharedData({quiet:true});toast(signup?'회원가입이 완료됐어요':'로그인됐어요');}
    catch(error){toast(`로그인됐어요. 공유 DB 설정을 확인해 주세요: ${error.message}`);}
  } catch(error){
    const message = error.message || '';
    toast(/rate.?limit|too many/i.test(message)
      ? '인증 메일 발송 한도에 도달했어요. 잠시 후 다시 시도하거나 이메일 발송 서비스를 설정해 주세요.'
      : message || '요청을 처리하지 못했어요');
    button.disabled=false; button.textContent=signup?'회원가입':'로그인';
  }
}

/* ---------- 팝업 ---------- */
function modalHTML(){
  const m = state.modal; if(!m) return '';
  if(m.type === 'share-alert'){
    return `<div class="overlay celebration-overlay" data-a="overlay"><div class="dialog celebration-dialog">
      <div class="celebration-burst" aria-hidden="true"><i>🎆</i><i>✨</i><i>🎇</i><i>✨</i><i>🎉</i><i>✨</i></div>
      <div class="celebration-icon" aria-hidden="true">🎊</div><h3>좋은 소식이에요!</h3>
      <p>${escapeHtml(m.message)}</p>
      <div class="d-btns"><button class="ok" data-a="close">확인</button></div></div></div>`;
  }
  if(m.type === 'notice'){
    return `<div class="overlay" data-a="overlay"><div class="dialog notice-dialog" role="alertdialog" aria-modal="true" aria-labelledby="notice-title" aria-describedby="notice-message">
      <div class="notice-icon" aria-hidden="true">!</div>
      <h3 id="notice-title">${escapeHtml(m.title)}</h3>
      <p id="notice-message" class="notice-copy">${escapeHtml(m.message)}</p>
      <div class="d-btns"><button class="ok" data-a="close">확인</button></div>
    </div></div>`;
  }
  if(m.type === 'success'){
    const c=state.cart.find(x=>x.oid===m.oid); if(!c) return '';
    const p=byId(c.pid);
    return `<div class="overlay success-overlay" data-a="overlay"><div class="dialog success-dialog" role="dialog" aria-modal="true" aria-labelledby="success-title">
      <div class="confetti" aria-hidden="true">${Array.from({length:24},(_,i)=>`<i style="--angle:${i*15}deg;--delay:${i*12}ms;--color:hsl(${i*47},85%,58%)"></i>`).join('')}</div>
      <div class="success-mark" aria-hidden="true">✓</div>
      <p class="success-kicker">모집 완료</p><h3 id="success-title">예약이 확정됐어요!</h3>
      <p class="success-copy">${escapeHtml(p.name)} ${c.qty}소분 예약과 수령 QR이 준비됐어요.</p>
      <div class="d-btns"><button class="ghost" data-a="close">나중에</button><button class="ok" data-a="success-qr" data-v="${escapeHtml(c.oid)}">QR 확인하기</button></div>
    </div></div>`;
  }
  if(m.type === 'confirm'){
    const p = state.product, q = state.qty;
    return `<div class="overlay" data-a="overlay"><div class="dialog">
      <h3>모집에 참여하시겠어요?</h3>
      <div class="d-sum"><b>${p.name}</b><span>${p.portions}인 소분 중 ${q}소분</span><strong>${won(calc(p,q))}</strong></div>
      <p class="warn">전체 모집이 완료되면 장바구니와 QR이 발급돼요.</p>
      <div class="d-btns"><button class="ghost" data-a="close">취소</button><button class="ok" data-a="confirm-reserve">참여하기</button></div></div></div>`;
  }
  if(m.type === 'cancel'){
    const c=state.cart.find(x=>x.oid===m.oid);
    const p=c&&byId(c.pid);
    const fee=c?cancellationFee(c.price):0;
    return `<div class="overlay" data-a="overlay"><div class="dialog">
      <h3>예약을 취소하시겠어요?</h3>
      ${c?`<div class="d-sum"><b>${escapeHtml(p?.name||'소분 예약')}</b><span>소분 금액 ${won(c.price)}</span><span>취소 수수료 (10%, 최소 ${won(CANCEL_FEE_MIN)} · 최대 ${won(CANCEL_FEE_MAX)})</span><strong>${won(fee)}</strong></div><p class="warn">QR 발급 후 취소라 수수료가 적용돼요. 현재 테스트 버전은 결제가 연결되지 않아 실제 청구는 되지 않아요.</p>`:`<p class="warn">QR 발급 전이라 취소 수수료는 없어요.</p>`}
      <div class="d-btns"><button class="ghost" data-a="close">돌아가기</button><button class="ok red" data-a="${c?'cancel-payment':'confirm-cancel'}">${c?'결제창으로 이동':'예약 취소'}</button></div></div></div>`;
  }
  if(m.type === 'cancel-payment'){
    const c=state.cart.find(x=>x.oid===m.oid); if(!c) return '';
    const fee=cancellationFee(c.price);
    const method=m.method||'card';
    const methods=[['card','💳','카드 결제'],['bank','🏦','계좌 이체'],['easy','✨','간편 결제']];
    return `<div class="overlay" data-a="overlay"><div class="dialog payment-dialog">
      <div class="payment-head"><button class="payment-back" data-a="back-cancel">‹</button><div><b>취소 수수료 결제</b><span>결제 화면</span></div><i>🔒</i></div>
      <p class="payment-label">결제 금액</p><strong class="payment-amount">${won(fee)}</strong>
      <div class="payment-breakdown"><span>소분 금액</span><b>${won(c.price)}</b><span>취소 수수료 (10%, 최소 ${won(CANCEL_FEE_MIN)} · 최대 ${won(CANCEL_FEE_MAX)})</span><b>${won(fee)}</b></div>
      <p class="payment-label">결제 수단</p><div class="payment-methods">${methods.map(([id,icon,label])=>`<button class="payment-method ${method===id?'selected':''}" data-a="payment-method" data-v="${id}"><span>${icon}</span><b>${label}</b><span class="payment-radio">${method===id?'●':'○'}</span></button>`).join('')}</div>
      <p class="payment-demo">UI 확인용 결제 화면이에요. 실제 결제는 되지 않지만, 결제하기를 누르면 예약 취소는 반영돼요.</p>
      <div class="d-btns"><button class="ghost" data-a="close">닫기</button><button class="ok" data-a="payment-demo">결제하기</button></div>
    </div></div>`;
  }
  if(m.type === 'payment-success'){
    const method=({card:'카드 결제',bank:'계좌 이체',easy:'간편 결제'})[m.method]||'카드 결제';
    return `<div class="overlay" data-a="overlay"><div class="dialog payment-success-dialog">
      <div class="payment-success-mark">✓</div><p class="payment-success-kicker">취소 완료</p><h3>예약이 취소됐어요</h3>
      <p class="payment-amount">${won(m.fee)}</p><p class="success-copy">취소 수수료 · ${method} 결제 화면 시뮬레이션</p>
      <p class="payment-demo">결제는 시뮬레이션이며 실제 청구되지 않았어요. 예약 취소는 반영됐어요.</p>
      <div class="d-btns"><button class="ok" data-a="close">확인</button></div>
    </div></div>`;
  }
  if(m.type === 'complete-order'){
    const c=state.issued.find(x=>x.oid===m.oid); if(!c) return '';
    const p=byId(c.pid);
    return `<div class="overlay" data-a="overlay"><div class="dialog">
      <h3>수령을 완료할까요?</h3><div class="d-sum"><b>${escapeHtml(p.name)}</b><span>${c.qty}소분 · ${won(c.price)}</span></div>
      <p class="warn">완료 처리하면 장바구니의 진행 중 목록에서 이용 완료 내역으로 이동해요.</p>
      <div class="d-btns"><button class="ghost" data-a="close">돌아가기</button><button class="ok" data-a="confirm-complete">수령 완료</button></div>
    </div></div>`;
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
      <p class="warn" style="margin-top:10px">QR을 스캔한 뒤, 예약 금액에 맞는 바코드를 상품에 부착해 주세요.</p>
      <div class="d-btns"><button class="ghost" data-a="cart">장바구니</button><button class="ok" data-a="barcode-issued" data-v="${escapeHtml(c.oid)}">바코드 발급 완료</button></div></div></div>`;
  }
  return '';
}

/* ---------- 렌더 & 이벤트 ---------- */
function render(){
  const v = {'share-home':vShareHome, categories:vCategories, 'fresh-list':vFreshList, 'meat-list':vMeatList, search:vSearch, community:vCommunity, reserve:vReserve, detail:vDetail, cart:vCart, visit:vVisit, login:()=>vAuth(false), signup:()=>vAuth(true), account:vAccount}[state.view];
  $('#s-share').innerHTML = v();
  $('#layer').innerHTML = modalHTML();
  syncHomeAuth();
  show('share');
}
function pick(id){ state.product = byId(id); state.qty = 1; }
function requireLogin(){
  if(state.session) return true;
  state.view='login'; render(); toast('공동 소분에 참여하려면 먼저 로그인해 주세요'); return false;
}
const isAlreadyJoinedError=error=>/ALREADY[_\s-]*JOINED/i.test(`${error?.code||''} ${error?.message||''}`);
function joinErrorNotice(error){
  const message=String(error?.message||'').toUpperCase();
  if(message.includes('NOT_ENOUGH_SPOTS')) return {
    title:'남은 수량이 부족해요',
    message:'다른 분의 신청이 먼저 반영됐어요. 최신 모집 현황을 불러왔으니 남은 수량을 확인해 주세요.'
  };
  if(message.includes('ROUND_CLOSED')) return {
    title:'모집이 마감됐어요',
    message:'다른 분이 먼저 신청해 모집이 마감됐어요. 모집 현황을 새로 확인해 주세요.'
  };
  if(isAlreadyJoinedError(error)) return {
    title:'이미 참여한 모집이에요',
    message:'같은 상품 모집에 이미 신청되어 있어요. 최신 상태를 불러왔으니 모집 참여 중 또는 장바구니에서 확인해 주세요.'
  };
  return null;
}
async function joinCurrentRound(){
  if(!requireLogin()) return;
  const p=state.product, q=state.qty;
  try{
    await dbRpc('join_share',{p_product_id:p.id,p_qty:q,p_amount:calc(p,q)});
    await syncSharedData({quiet:true}); state.modal=null;
    const confirmed=state.cart.some(x=>x.pid===p.id);
    state.navTab='reserve';state.view='reserve';render();top0();
    if(confirmed){const order=state.cart.find(x=>x.pid===p.id);if(order){state.modal={type:'success',oid:order.oid};render();}}
    toast(confirmed?'예약이 확정됐어요!':'모집 참여 완료! 전체 수량이 모이면 확정돼요');
  }catch(error){
    const notice=joinErrorNotice(error);
    if(!notice){toast(error.message||'모집 참여에 실패했어요');return;}
    state.modal=null;
    await syncSharedData({quiet:true}).catch(()=>{});
    const available=state.product?remain(state.product):0;
    if(available>0) state.qty=Math.min(state.qty,available);
    render();
    state.modal={type:'notice',...notice};
    render();
  }
}
async function addToWaitlist(){
  if(!requireLogin()) return;
  const p=state.product;
  try{await dbRpc('join_share_waitlist',{p_product_id:p.id,p_qty:state.qty,p_amount:calc(p,state.qty)});await syncSharedData({quiet:true});render();toast('공동 대기열에 등록됐어요');}
  catch(error){if(error.message==='ROUND_AVAILABLE'){await syncSharedData({quiet:true}).catch(()=>{});render();toast('새 모집이 열렸어요. 모집에 참여해 주세요');}else toast(error.message||'대기 등록에 실패했어요');}
}
async function startNewRound(){
  if(!requireLogin()) return;
  const p=state.product;
  try{
    const created=await dbRpc('start_share_round',{p_product_id:p.id,p_group_size:p.portions});
    const roundId=created?.id;
    await syncSharedData({quiet:true});
    const alreadyInNewRound=()=>state.pending.some(x=>x.pid===p.id&&x.roundId===roundId)||state.cart.some(x=>x.pid===p.id&&x.roundId===roundId);
    let joinedNewRound=false;
    let alreadyJoinedConflict=false;
    if(currentRound(p)?.id===roundId&&!alreadyInNewRound()){
      // Starting a round should leave at least one portion for another shopper;
      // otherwise this single action can fill the round and immediately issue a QR.
      const q=Math.min(Math.max(1,state.qty),remain(p)-1,p.portions-1);
      if(q>0){
        try{await dbRpc('join_share',{p_product_id:p.id,p_qty:q,p_amount:calc(p,q)});joinedNewRound=true;}
        catch(error){if(isAlreadyJoinedError(error)) alreadyJoinedConflict=true; else if(error.message!=='ROUND_CLOSED') throw error;}
      }
    }
    await syncSharedData({quiet:true});
    state.view=state.cart.some(x=>x.pid===p.id&&x.roundId===roundId)?'cart':'reserve';state.navTab='reserve';render();top0();
    const order=state.cart.find(x=>x.pid===p.id&&x.roundId===roundId);
    if(order){state.modal={type:'success',oid:order.oid};render();}
    if(alreadyJoinedConflict){state.modal={type:'notice',...joinErrorNotice({message:'ALREADY_JOINED'})};render();}
    const pendingOrder=state.pending.find(x=>x.pid===p.id&&x.roundId===roundId);
    if(pendingOrder&&!alreadyJoinedConflict) showShareAlert('대기 순서가 되어 새 소분 모집에 참여됐어요');
    else toast(order?'예약이 확정됐어요!':pendingOrder?'새 모집에 참여했어요. 다른 참여자를 기다려 주세요':state.waitlist.some(x=>x.pid===p.id)?'새 모집 자리가 부족해 대기 중이에요':joinedNewRound?'새 모집을 시작하고 참여했어요':'모집 자리가 부족해 참여하지 못했어요. 현황을 확인해 주세요');
  }catch(error){await syncSharedData().catch(()=>{});render();toast(error.message==='ROUND_CLOSED'?'대기자가 먼저 모집을 완료했어요':error.message||'새 모집을 시작하지 못했어요');}
}
async function cancelSharedOrder(){
  const modal=state.modal;
  const code=modal?.oid;
  const payment=modal?.type==='cancel-payment';
  const order=state.cart.find(x=>x.oid===code);
  try{
    const result=await dbRpc('cancel_share',{p_public_code:code});
    state.cart=state.cart.filter(x=>x.oid!==code);
    try{await syncSharedData({quiet:true});}catch(error){/* Keep the successful cancellation visible if refresh temporarily fails. */}
    state.modal=payment?{type:'payment-success',fee:cancellationFee(order?.price||0),method:modal.method||'card'}:null;
    render();
    if(!payment) toast(result?.waiter_promoted?'취소된 자리를 대기자가 이어받았어요':'참여가 취소됐어요');
  }
  catch(error){toast(error.message||'취소에 실패했어요');}
}
async function leaveSharedWaitlist(productId,button){
  const previousLabel=button.textContent;
  button.disabled=true;
  button.textContent='취소 중…';
  try{
    const removed=await dbRpc('leave_share_waitlist',{p_product_id:productId});
    if(removed===true){
      state.waitlist=state.waitlist.filter(item=>item.pid!==productId);
      state.modal={type:'notice',title:'대기 취소 완료',message:'마감 대기 신청이 취소되어 목록에서 삭제됐어요.'};
      render();
      // The RPC already confirmed the change; a refresh is only for any other
      // shared state and must not turn a successful cancellation into an error.
      await syncSharedData({quiet:true}).catch(()=>{});
      render();
      return;
    }

    await syncSharedData({quiet:true});
    if(state.pending.some(item=>item.pid===productId)){
      showShareAlert('대기 순서가 되어 이미 새 모집에 참여됐어요');
    }else if(state.waitlist.some(item=>item.pid===productId)){
      state.modal={type:'notice',title:'대기를 취소하지 못했어요',message:'대기 상태가 그대로예요. 잠시 후 다시 시도해 주세요.'};
      render();
    }else{
      state.modal={type:'notice',title:'대기 신청이 이미 처리됐어요',message:'마감 대기 목록을 최신 상태로 불러왔어요.'};
      render();
    }
  }catch(error){
    toast(error.message||'대기 취소에 실패했어요');
  }finally{
    button.disabled=false;
    button.textContent=previousLabel;
  }
}
async function markBarcodeIssued(code){
  try{
    await dbRpc('mark_share_barcode_issued',{p_public_code:code});
    const order=state.cart.find(x=>x.oid===code);
    state.cart=state.cart.filter(x=>x.oid!==code);
    if(order) state.issued=[{...order,barcodeIssuedAt:new Date().toISOString()},...state.issued];
    state.modal=null; render();
    await syncSharedData({quiet:true}).catch(()=>{}); render();
    toast('QR 사용이 완료됐어요. 바코드 발급 상태로 바뀌었어요');
  }catch(error){toast(error.message||'QR 사용 상태를 저장하지 못했어요');}
}
async function completeShareOrder(){
  const code=state.modal?.oid;
  try{
    await dbRpc('complete_share_order',{p_public_code:code});
    const order=state.issued.find(x=>x.oid===code);
    state.issued=state.issued.filter(x=>x.oid!==code);
    if(order) state.completed=[{...order,completedAt:new Date().toISOString()},...state.completed];
    state.modal=null; render();
    await syncSharedData({quiet:true}).catch(()=>{}); render();
    toast('이용 완료 내역에 저장했어요');
  }catch(error){toast(error.message||'수령 완료 처리에 실패했어요');}
}

document.addEventListener('click', e => {
  if(e.target.closest('[data-a="auth-entry"]')){ navigateTab(state.session?'account':'login','account'); return; }
  if(e.target.closest('#go-tra')){ e.preventDefault(); state.stack = ['root-home']; state.navTab='home'; state.view = 'share-home'; render(); top0(); return; }
  const el = e.target.closest('[data-a]'); if(!el) return;
  if(el.dataset.a === 'overlay' && e.target !== el) return;     // 팝업 바깥(배경)을 눌렀을 때만 닫기
  e.stopPropagation();
  if(el.disabled) return;
  const a = el.dataset.a, v = el.dataset.v;
  switch(a){
    case 'back': back(); break;
    case 'exit': state.stack = []; state.modal = null; state.view='root-home'; syncHomeAuth(); show('home'); break;
    case 'login': state.view='login'; render(); break;
    case 'signup': state.view='signup'; render(); break;
    case 'account': case 'account-tab': navigateTab(state.session?'account':'login','account'); break;
    case 'root-home': state.stack=[];state.view='root-home';state.navTab='home';show('home');top0();break;
    case 'share-home': navigateTab('share-home','home'); break;
    case 'logout': state.session=null; state.cart=[]; state.issued=[]; state.completed=[]; state.pending=[]; state.waitlist=[]; localStorage.removeItem(AUTH_KEY); syncHomeAuth(); state.navTab='home';state.view='share-home'; render(); toast('로그아웃했어요'); break;
    case 'home-tab': navigateTab('share-home','home'); break;
    case 'reserve-tab': navigateTab('reserve','reserve'); break;
    case 'community-tab':
      navigateTab('community','community');
      loadCommunity().catch(error=>toast(error.message||'커뮤니티를 불러오지 못했어요'));
      break;
    case 'cat':
      if(el.dataset.on !== 'true'){ toast('준비 중이에요'); break; }
      state.navTab='';state.tab='전체'; go(v==='신선식품'?'fresh-list':'meat-list'); break;
    case 'search-open': state.searchQuery=''; go('search'); $('#product-search-input')?.focus(); break;
    case 'search-clear': state.searchQuery=''; render(); $('#product-search-input')?.focus(); break;
    case 'tab': state.tab = v; state.productCategory='전체'; render(); break;
    case 'fresh-category': state.freshCategory = v; render(); break;
    case 'product-category': state.productCategory = v; render(); break;
    case 'detail': pick(v); go('detail'); break;
    case 'qty-inc': state.qty = Math.min(currentRound(state.product)?remain(state.product):state.product.portions, state.qty + 1); render(); break;
    case 'qty-dec': state.qty = Math.max(1, state.qty - 1); render(); break;
    case 'ask-reserve': state.modal = {type:'confirm'}; render(); break;
    case 'join-wait': addToWaitlist(); break;
    case 'leave-wait': leaveSharedWaitlist(+v,el); break;
    case 'start-round': startNewRound(); break;
    case 'confirm-reserve': joinCurrentRound(); break;
    case 'cart': state.modal = null; go('cart'); break;
    case 'shop': navigateTab('share-home','home'); break;
    case 'community-refresh': loadCommunity().catch(error=>toast(error.message||'목록을 새로고침하지 못했어요')); break;
    case 'account-menu': $('#my-activity')?.scrollIntoView({behavior:'smooth',block:'start'}); break;
    case 'account-settings': toast('계정 정보 설정은 준비 중이에요'); break;
    case 'reserve-section': document.getElementById(v)?.scrollIntoView({behavior:'smooth',block:'start'}); break;
    case 'product-detail': state.product=byId(+v); state.qty=1; if(state.product) go('detail'); break;
    case 'suggestion-vote': toggleSuggestionVote(v); break;
    case 'qr': state.modal = {type:'qr', oid:v}; render(); break;
    case 'success-qr': state.modal = {type:'qr', oid:v}; render(); break;
    case 'barcode-issued': markBarcodeIssued(v); break;
    case 'ask-complete': state.modal={type:'complete-order',oid:v}; render(); break;
    case 'confirm-complete': completeShareOrder(); break;
    case 'ask-cancel': state.modal = {type:'cancel', oid:v}; render(); break;
    case 'cancel-payment': state.modal = {type:'cancel-payment', oid:state.modal?.oid, method:'card'}; render(); break;
    case 'back-cancel': state.modal = {type:'cancel', oid:state.modal?.oid}; render(); break;
    case 'payment-method': {
      state.modal = {...state.modal, method:v};
      document.querySelectorAll('.payment-method').forEach(button=>{
        const selected=button.dataset.v===v;
        button.classList.toggle('selected',selected);
        const radio=button.querySelector('.payment-radio');
        if(radio) radio.textContent=selected?'●':'○';
      });
      break;
    }
    case 'payment-demo': el.disabled=true; el.textContent='처리 중…'; cancelSharedOrder(); break;
    case 'confirm-cancel': cancelSharedOrder(); break;
    case 'close': case 'overlay': state.modal = null; render(); break;
    case 'visit': go('visit'); break;
  }
});

document.addEventListener('submit', e => {
  const communityForm=e.target.closest('[data-community-form]');
  if(communityForm){e.preventDefault();submitSuggestion(communityForm);return;}
  const searchForm=e.target.closest('[data-search-form]');
  if(searchForm){ e.preventDefault(); return; }
  const form = e.target.closest('[data-auth-form]'); if(!form) return;
  e.preventDefault(); submitAuth(form);
});
document.addEventListener('input', e=>{
  if(e.target.id!=='product-search-input') return;
  state.searchQuery=e.target.value;
  $('#search-results').innerHTML=searchResultsHTML(state.searchQuery.trim());
  e.target.parentElement.querySelector('[data-a="search-clear"]').hidden=!state.searchQuery;
});

// 상품 목록은 Supabase products 테이블을 단일 기준으로 사용합니다.
loadProducts().then(()=>syncSharedData({quiet:true})).catch(error=>toast('상품 DB를 불러오지 못했어요. supabase-setup.sql을 적용해 주세요.'));
setInterval(()=>{
  if(document.visibilityState==='visible'){
    syncSharedData().catch(()=>{});
  }
},7000);
window.addEventListener('focus',()=>{
  loadProducts().catch(()=>{});
  syncSharedData({quiet:true}).catch(()=>{});
});
