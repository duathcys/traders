/* 트레더 (TRA:TOGETHER) - 소분 예약
   홈 → 정육/수산 목록 → 상품 상세(소분 수량 선택) → 예약 확인 팝업 → 장바구니(소분 금액) → 품목별 QR */

/* ---------- 설정 ---------- */
const CANCEL_NOTICE = '예약 후 취소하시면 취소 수수료가 부과돼요.';
const AUTH_KEY = 'traders_auth_v1';

/* price: 상품 판매가 / portions: 모집 완료에 필요한 총 소분 수 */
const PRODUCTS = [
  {id:1, type:'정육', name:'호주산 냉장 안심 2.5kg', price:55800, portions:5, emoji:'🥩', cls:''},
  {id:2, type:'수산', name:'생연어 필렛 2.0kg',     price:49800, portions:4, emoji:'🐟', cls:'fish'},
  {id:3, type:'정육', name:'한우 불고기 1.0kg',     price:32800, portions:4, emoji:'🍖', cls:'beef'},
  {id:4, type:'수산', name:'손질 새우 1.0kg',       price:24900, portions:3, emoji:'🦐', cls:'fish'},
  {id:5, type:'신선식품', category:'과일류', name:'국내산 사과 2kg', price:19900, portions:5, emoji:'🍎', cls:'fresh'},
  {id:6, type:'신선식품', category:'과일류', name:'제주 감귤 3kg', price:17900, portions:4, emoji:'🍊', cls:'fresh'},
  {id:7, type:'신선식품', category:'뿌리채소·고구마·호박류', name:'햇 밤고구마', weight:'5kg', regularPrice:29800, price:19040, discount:36, price100g:381, rating:4.7, reviewCount:351, portions:5, emoji:'🍠', cls:'fresh'},
  {id:8, type:'신선식품', category:'뿌리채소·고구마·호박류', name:'감자', weight:'5kg', regularPrice:25900, price:11840, discount:54, price100g:237, rating:4.7, reviewCount:668, portions:5, emoji:'🥔', cls:'fresh'},
  {id:9, type:'신선식품', category:'뿌리채소·고구마·호박류', name:'햇연근(흙연근)', weight:'3kg', regularPrice:39900, price:19984, discount:49, price100g:666, rating:4.8, reviewCount:146, portions:5, emoji:'🪷', cls:'fresh'},
  {id:10, type:'신선식품', category:'뿌리채소·고구마·호박류', name:'미니양배추', weight:'5입', regularPrice:9980, price:8982, discount:10, price100g:299, rating:5.0, reviewCount:17, portions:5, emoji:'🥬', cls:'fresh'},
  {id:11, type:'신선식품', category:'뿌리채소·고구마·호박류', name:'국내산 단호박', weight:'10kg (8~12개)', regularPrice:29800, price:16800, discount:43, price100g:null, rating:4.4, reviewCount:65, portions:5, emoji:'🎃', cls:'fresh'},
  {id:12, type:'신선식품', category:'뿌리채소·고구마·호박류', name:'국내산 미니단호박', weight:'5kg (12~17개)', regularPrice:29800, price:15800, discount:46, price100g:null, rating:4.6, reviewCount:457, portions:5, emoji:'🎃', cls:'fresh'},
  {id:13, type:'신선식품', category:'뿌리채소·고구마·호박류', name:'호풍미 고구마', weight:'5kg', regularPrice:29800, price:23800, discount:20, price100g:476, rating:4.5, reviewCount:73, portions:5, emoji:'🍠', cls:'fresh'},
  {id:14, type:'신선식품', category:'뿌리채소·고구마·호박류', name:'아삭달콤한 햇당근', weight:'5kg', regularPrice:19900, price:12800, discount:35, price100g:256, rating:4.8, reviewCount:828, portions:5, emoji:'🥕', cls:'fresh'},
  {id:15, type:'신선식품', category:'뿌리채소·고구마·호박류', name:'우엉대', weight:'3kg (10~15개)', regularPrice:29850, price:21980, discount:26, price100g:733, rating:4.8, reviewCount:87, portions:5, emoji:'🥕', cls:'fresh'},
  {id:16, type:'신선식품', category:'뿌리채소·고구마·호박류', name:'장마', weight:'5kg', regularPrice:89800, price:59900, discount:33, price100g:1198, rating:4.7, reviewCount:16, portions:5, emoji:'🥔', cls:'fresh'},
  {id:17, type:'신선식품', category:'뿌리채소·고구마·호박류', name:'고흥 햇 통마늘', weight:'3kg (약 45~50개)', regularPrice:35400, price:21500, discount:39, price100g:717, rating:4.6, reviewCount:122, portions:5, emoji:'🧄', cls:'fresh'},
  {id:18, type:'신선식품', category:'뿌리채소·고구마·호박류', name:'국내산 아이스 군고구마', weight:'900g', regularPrice:14980, price:12980, discount:13, price100g:1442, rating:4.8, reviewCount:89, portions:5, emoji:'🍠', cls:'fresh'},
  {id:19, type:'신선식품', category:'버섯류', name:'국산품종 설원버섯', weight:'1.8kg', regularPrice:22410, price:18800, discount:16, price100g:1044, rating:4.5, reviewCount:131, portions:5, emoji:'🍄', cls:'fresh'},
  {id:20, type:'신선식품', category:'버섯류', name:'참송이버섯', weight:'1kg', regularPrice:null, price:32800, discount:null, price100g:3280, rating:3.5, reviewCount:7, portions:5, emoji:'🍄', cls:'fresh'},
  {id:21, type:'신선식품', category:'버섯류', name:'귀리로 키운 동충하초버섯', weight:'170g × 4입', regularPrice:null, price:17980, discount:null, price100g:2644, rating:null, reviewCount:null, portions:5, emoji:'🍄', cls:'fresh'},
  {id:22, type:'신선식품', category:'버섯류', name:'고기맛이 나는 느타리버섯', weight:'1.8kg', regularPrice:23880, price:19800, discount:17, price100g:1100, rating:null, reviewCount:null, portions:5, emoji:'🍄', cls:'fresh'},
  {id:23, type:'신선식품', category:'버섯류', name:'국내산 신품종 노랑느타리버섯', weight:'1kg', regularPrice:null, price:22800, discount:null, price100g:2280, rating:null, reviewCount:null, portions:5, emoji:'🍄', cls:'fresh'},
  {id:24, type:'신선식품', category:'신선 채소·샐러드류', name:'창녕 다진마늘', weight:'1.6kg (400g × 4팩)', regularPrice:35100, price:19800, discount:43, price100g:1238, rating:4.8, reviewCount:828, portions:5, emoji:'🧄', cls:'fresh'},
  {id:25, type:'신선식품', category:'신선 채소·샐러드류', name:'모닝샐러드', weight:'700g (100g × 7입)', regularPrice:13260, price:8980, discount:32, price100g:1283, rating:4.7, reviewCount:298, portions:5, emoji:'🥗', cls:'fresh'},
  {id:26, type:'신선식품', category:'신선 채소·샐러드류', name:'눈꽃양배추', weight:'1.4kg (200g × 7입)', regularPrice:12180, price:11800, discount:3, price100g:843, rating:4.0, reviewCount:5, portions:5, emoji:'🥬', cls:'fresh'},
  {id:27, type:'신선식품', category:'신선 채소·샐러드류', name:'7가지 채소 모둠쌈', weight:'1kg', regularPrice:13800, price:8700, discount:36, price100g:870, rating:4.8, reviewCount:486, portions:5, emoji:'🥬', cls:'fresh'},
  {id:28, type:'신선식품', category:'신선 채소·샐러드류', name:'청도미나리', weight:'2kg', regularPrice:37800, price:27800, discount:26, price100g:1390, rating:4.7, reviewCount:31, portions:5, emoji:'🌿', cls:'fresh'},
  {id:29, type:'신선식품', category:'신선 채소·샐러드류', name:'추부 깻잎(절임소스 증정)', weight:'1kg', regularPrice:34800, price:29400, discount:15, price100g:2940, rating:3.9, reviewCount:9, portions:5, emoji:'🌿', cls:'fresh'},
  {id:30, type:'신선식품', category:'신선 채소·샐러드류', name:'국내산 셀러리', weight:'2kg', regularPrice:12980, price:9980, discount:23, price100g:499, rating:4.0, reviewCount:124, portions:5, emoji:'🥬', cls:'fresh'},
  {id:31, type:'신선식품', category:'신선 채소·샐러드류', name:'주스용 비트', weight:'3kg', regularPrice:10980, price:8980, discount:18, price100g:299, rating:4.8, reviewCount:127, portions:5, emoji:'🫜', cls:'fresh'},
  {id:32, type:'신선식품', category:'신선 채소·샐러드류', name:'착즙용 케일', weight:'1kg', regularPrice:null, price:9980, discount:null, price100g:null, rating:5.0, reviewCount:24, portions:5, emoji:'🥬', cls:'fresh'},
  {id:33, type:'신선식품', category:'신선 채소·샐러드류', name:'샬롯', weight:'500g', regularPrice:null, price:11800, discount:null, price100g:2360, rating:4.0, reviewCount:5, portions:5, emoji:'🧅', cls:'fresh'},
  {id:34, type:'정육', category:'스테이크·캠핑용 육류', name:'헤비앤텐더 토마호크 캠핑팩', weight:'500g', regularPrice:59000, price:36800, discount:37, price100g:7360, rating:5.0, reviewCount:219, portions:5, emoji:'🥩', cls:'beef'},
  {id:35, type:'정육', category:'스테이크·캠핑용 육류', name:'헤비앤텐더 티본스테이크 캠핑팩', weight:'500g', regularPrice:58000, price:40950, discount:29, price100g:8190, rating:5.0, reviewCount:8, portions:5, emoji:'🥩', cls:'beef'},
  {id:36, type:'정육', category:'스테이크·캠핑용 육류', name:'헤비앤텐더 엘본스테이크 캠핑팩', weight:'500g', regularPrice:57000, price:40050, discount:29, price100g:8010, rating:5.0, reviewCount:1, portions:5, emoji:'🥩', cls:'beef'},
  {id:37, type:'정육', category:'돼지고기·한돈', name:'수육용 국내산 금한돈 앞다리', weight:'2kg', regularPrice:null, price:33800, discount:null, price100g:1690, rating:4.8, reviewCount:532, portions:5, emoji:'🥓', cls:'beef'},
  {id:38, type:'정육', category:'돼지고기·한돈', name:'온가족 삼겹살 구이용(캐나다산)', weight:'2.4kg', regularPrice:47519, price:36800, discount:22, price100g:1533, rating:4.1, reviewCount:28, portions:5, emoji:'🥓', cls:'beef'},
  {id:39, type:'정육', category:'돼지고기·한돈', name:'캠핑용 국내산 금한돈 삼겹살', weight:'1.5kg', regularPrice:47700, price:43800, discount:8, price100g:2920, rating:4.8, reviewCount:330, portions:5, emoji:'🥓', cls:'beef'},
  {id:40, type:'정육', category:'돼지고기·한돈', name:'캠핑용 국내산 금한돈 돈목심', weight:'1.5kg', regularPrice:47700, price:43800, discount:8, price100g:2920, rating:4.3, reviewCount:7, portions:5, emoji:'🥓', cls:'beef'},
  {id:41, type:'정육', category:'돼지고기·한돈', name:'도드람한돈 특수부위 스페셜 모둠', weight:'1.7kg', regularPrice:38000, price:29800, discount:21, price100g:1753, rating:4.7, reviewCount:307, portions:5, emoji:'🥓', cls:'beef'},
  {id:42, type:'정육', category:'돼지고기·한돈', name:'온가족 한돈 돼지갈비 찜용', weight:'2.4kg', regularPrice:46500, price:34800, discount:25, price100g:1450, rating:4.5, reviewCount:181, portions:5, emoji:'🍖', cls:'beef'},
  {id:43, type:'정육', category:'돼지고기·한돈', name:'청정돈 한입 냉동 삼겹살', weight:'2kg', regularPrice:null, price:null, discount:null, price100g:1499, rating:4.5, reviewCount:190, portions:5, emoji:'🥓', cls:'beef', availability:'판매 종료'},
  {id:44, type:'정육', category:'돼지고기·한돈', name:'한돈 돼지갈비 모둠 세트', weight:'미표기', regularPrice:null, price:49800, discount:null, price100g:2264, rating:null, reviewCount:null, portions:5, emoji:'🍖', cls:'beef'},
  {id:45, type:'정육', category:'한우·소고기', name:'몸보신 곰탕용 한우 모둠 곰거리', weight:'3kg', regularPrice:32000, price:23400, discount:26, price100g:780, rating:4.9, reviewCount:2026, portions:5, emoji:'🥩', cls:'beef'},
  {id:46, type:'정육', category:'한우·소고기', name:'한우 알스지 수육·전골용', weight:'800g', regularPrice:24980, price:22800, discount:8, price100g:2850, rating:4.8, reviewCount:466, portions:5, emoji:'🥩', cls:'beef'},
  {id:47, type:'정육', category:'한우·소고기', name:'한우 통 사태살', weight:'2kg', regularPrice:97600, price:70700, discount:27, price100g:3535, rating:4.8, reviewCount:251, portions:5, emoji:'🥩', cls:'beef'},
  {id:48, type:'정육', category:'한우·소고기', name:'한우 육마카세', weight:'900g', regularPrice:null, price:134200, discount:null, price100g:14911, rating:5.0, reviewCount:24, portions:5, emoji:'🥩', cls:'beef'},
  {id:49, type:'정육', category:'한우·소고기', name:'한우 구이의 정석(등심·채끝·갈비살)', weight:'600g', regularPrice:80000, price:79100, discount:1, price100g:13183, rating:4.7, reviewCount:85, portions:5, emoji:'🥩', cls:'beef'},
  {id:50, type:'정육', category:'한우·소고기', name:'한우 금바구니 구이 세트', weight:'1kg', regularPrice:160000, price:147400, discount:7, price100g:14740, rating:4.8, reviewCount:68, portions:5, emoji:'🥩', cls:'beef'},
  {id:51, type:'정육', category:'수입육·양고기', name:'냉동 양꼬치(어깨살)', weight:'400g', regularPrice:18400, price:16500, discount:10, price100g:4125, rating:5.0, reviewCount:2, portions:5, emoji:'🍢', cls:'beef'},
  {id:52, type:'정육', category:'수입육·양고기', name:'미국산 생 LA갈비 냉장구이', weight:'800g', regularPrice:67800, price:47600, discount:29, price100g:5950, rating:4.7, reviewCount:40, portions:5, emoji:'🍖', cls:'beef'},
  {id:53, type:'정육', category:'수입육·양고기', name:'달링다운 와규 홈파티팩', weight:'600g', regularPrice:50000, price:39800, discount:20, price100g:6633, rating:4.1, reviewCount:22, portions:5, emoji:'🥩', cls:'beef'},
  {id:54, type:'정육', category:'양념육·갈비·제육볶음', name:'포천이동 양념 소갈비', weight:'1.5kg', regularPrice:65000, price:49980, discount:23, price100g:3332, rating:4.4, reviewCount:275, portions:5, emoji:'🍖', cls:'beef'},
  {id:55, type:'정육', category:'양념육·갈비·제육볶음', name:'양념우대갈비 캠핑 세트', weight:'800g', regularPrice:78000, price:59800, discount:23, price100g:1977, rating:4.4, reviewCount:8, portions:5, emoji:'🍖', cls:'beef'},
  {id:56, type:'정육', category:'양념육·갈비·제육볶음', name:'동물복지 간장·고추장 제육볶음', weight:'2.4kg', regularPrice:45000, price:34800, discount:22, price100g:1450, rating:4.9, reviewCount:296, portions:5, emoji:'🍲', cls:'beef'},
  {id:57, type:'정육', category:'양념육·갈비·제육볶음', name:'춘천 닭갈비 순한맛', weight:'1kg', regularPrice:29000, price:26500, discount:8, price100g:2650, rating:4.9, reviewCount:102, portions:5, emoji:'🍗', cls:'beef'},
  {id:58, type:'정육', category:'양념육·갈비·제육볶음', name:'원조 춘천닭갈비 매운맛', weight:'1kg', regularPrice:29000, price:26500, discount:8, price100g:2650, rating:5.0, reviewCount:97, portions:5, emoji:'🍗', cls:'beef'},
  {id:59, type:'정육', category:'양념육·갈비·제육볶음', name:'강원도청정돼지 생돼지갈비', weight:'1.9kg', regularPrice:42900, price:33900, discount:20, price100g:1784, rating:4.5, reviewCount:64, portions:5, emoji:'🍖', cls:'beef'},
  {id:60, type:'정육', category:'양념육·갈비·제육볶음', name:'강원도청정돼지 생제육볶음', weight:'1.6kg', regularPrice:29900, price:21900, discount:26, price100g:1369, rating:4.8, reviewCount:116, portions:5, emoji:'🍲', cls:'beef'},
  {id:61, type:'정육', category:'양념육·갈비·제육볶음', name:'남영돈 양념돼지갈비', weight:'1.6kg', regularPrice:45000, price:33800, discount:24, price100g:2113, rating:5.0, reviewCount:5, portions:5, emoji:'🍖', cls:'beef'},
  {id:62, type:'정육', category:'닭고기·닭 특수부위', name:'올품 IQF 냉동 닭발', weight:'2.4kg', regularPrice:26000, price:18900, discount:27, price100g:788, rating:4.9, reviewCount:61, portions:5, emoji:'🍗', cls:'beef'},
  {id:63, type:'정육', category:'닭고기·닭 특수부위', name:'올품 IQF 냉동 닭가슴살', weight:'2.4kg', regularPrice:33000, price:24000, discount:27, price100g:1000, rating:5.0, reviewCount:20, portions:5, emoji:'🍗', cls:'beef'},
  {id:64, type:'정육', category:'닭고기·닭 특수부위', name:'올품 IQF 냉동 닭안심', weight:'2.4kg', regularPrice:33000, price:24000, discount:27, price100g:1000, rating:null, reviewCount:null, portions:5, emoji:'🍗', cls:'beef'},
  {id:65, type:'수산', category:'회·해산물·프리미엄 수산물', name:'흑산도 자연산 홍어', weight:'300g', regularPrice:45900, price:22112, discount:51, price100g:7371, rating:4.6, reviewCount:52, portions:5, emoji:'🐟', cls:'fish'},
  {id:66, type:'수산', category:'회·해산물·프리미엄 수산물', name:'자연산 거제 돌멍게', weight:'2kg (12~18미)', regularPrice:39800, price:26010, discount:34, price100g:1301, rating:5.0, reviewCount:40, portions:5, emoji:'🦪', cls:'fish'},
  {id:67, type:'수산', category:'회·해산물·프리미엄 수산물', name:'명인 명품 백굴비', weight:'1.8kg (10미)', regularPrice:42980, price:35082, discount:18, price100g:1949, rating:4.3, reviewCount:44, portions:5, emoji:'🐟', cls:'fish'},
  {id:68, type:'수산', category:'회·해산물·프리미엄 수산물', name:'국산 생새우', weight:'1kg (35~45미)', regularPrice:33900, price:29500, discount:12, price100g:2950, rating:4.2, reviewCount:29, portions:5, emoji:'🦐', cls:'fish'},
  {id:69, type:'수산', category:'회·해산물·프리미엄 수산물', name:'홈마카세 우니세트(단새우·성게알·감태)', weight:'미표기', regularPrice:43800, price:34900, discount:20, price100g:null, rating:4.6, reviewCount:170, portions:5, emoji:'🍣', cls:'fish'},
  {id:70, type:'수산', category:'회·해산물·프리미엄 수산물', name:'참다랑어 2번 뱃살', weight:'900g', regularPrice:138000, price:92000, discount:33, price100g:10222, rating:4.6, reviewCount:78, portions:5, emoji:'🐟', cls:'fish'},
  {id:71, type:'수산', category:'조개류·꽃게·골뱅이', name:'자연산 거제 바위굴(하프쉘)', weight:'1kg (3~4미)', regularPrice:29800, price:20900, discount:29, price100g:null, rating:2.5, reviewCount:2, portions:5, emoji:'🦪', cls:'fish'},
  {id:72, type:'수산', category:'조개류·꽃게·골뱅이', name:'서해안 가을 생물 꽃게', weight:'2kg (5~10미)', regularPrice:44850, price:29900, discount:33, price100g:null, rating:3.7, reviewCount:458, portions:5, emoji:'🦀', cls:'fish'},
  {id:73, type:'수산', category:'조개류·꽃게·골뱅이', name:'서해안 제철 참소라', weight:'2kg (12~15미/kg)', regularPrice:null, price:null, discount:null, price100g:1225, rating:4.5, reviewCount:76, portions:5, emoji:'🐚', cls:'fish', availability:'일시 품절'},
  {id:74, type:'수산', category:'조개류·꽃게·골뱅이', name:'남해안 홍가리비', weight:'5kg', regularPrice:32120, price:28900, discount:10, price100g:578, rating:4.7, reviewCount:265, portions:5, emoji:'🦪', cls:'fish'},
  {id:75, type:'수산', category:'조개류·꽃게·골뱅이', name:'동해안 골뱅이살(무침소스 증정)', weight:'700g', regularPrice:31500, price:28500, discount:9, price100g:4071, rating:5.0, reviewCount:4, portions:5, emoji:'🐚', cls:'fish'},
  {id:76, type:'수산', category:'조개류·꽃게·골뱅이', name:'마요꽃게구이', weight:'1.2kg (4미)', regularPrice:42800, price:36800, discount:14, price100g:null, rating:5.0, reviewCount:2, portions:5, emoji:'🦀', cls:'fish'},
  {id:77, type:'수산', category:'조개류·꽃게·골뱅이', name:'서해바다 절단꽃게(냉동)', weight:'2kg (8~10미)', regularPrice:29980, price:25500, discount:14, price100g:1275, rating:3.6, reviewCount:80, portions:5, emoji:'🦀', cls:'fish'},
  {id:78, type:'수산', category:'조개류·꽃게·골뱅이', name:'자연산 냉동 대하세트', weight:'1kg (약 20미)', regularPrice:null, price:null, discount:null, price100g:3560, rating:4.2, reviewCount:6, portions:5, emoji:'🦐', cls:'fish', availability:'일시 품절'},
  {id:79, type:'수산', category:'전복·장어·문어', name:'완도활전복(대)', weight:'1.4kg (19~22미)', regularPrice:105000, price:57000, discount:45, price100g:4071, rating:4.8, reviewCount:23, portions:5, emoji:'🐚', cls:'fish'},
  {id:80, type:'수산', category:'전복·장어·문어', name:'완도활전복(특대)', weight:'1.4kg (14~17미)', regularPrice:135000, price:64930, discount:51, price100g:4638, rating:4.8, reviewCount:113, portions:5, emoji:'🐚', cls:'fish'},
  {id:81, type:'수산', category:'전복·장어·문어', name:'프리미엄 황제전복', weight:'1.92kg (12마리)', regularPrice:148000, price:128000, discount:13, price100g:null, rating:5.0, reviewCount:4, portions:5, emoji:'🐚', cls:'fish'},
  {id:82, type:'수산', category:'전복·장어·문어', name:'국산 자포니카 생 민물장어', weight:'2kg (손질 전)', regularPrice:70630, price:50750, discount:28, price100g:2538, rating:4.8, reviewCount:63, portions:5, emoji:'🐟', cls:'fish'},
  {id:83, type:'수산', category:'전복·장어·문어', name:'자연산 생 바다장어', weight:'2kg (손질 전)', regularPrice:53590, price:38510, discount:28, price100g:1926, rating:4.5, reviewCount:11, portions:5, emoji:'🐟', cls:'fish'},
  {id:84, type:'수산', category:'전복·장어·문어', name:'국산 데친문어', weight:'약 2.4kg', regularPrice:94800, price:85100, discount:10, price100g:null, rating:4.6, reviewCount:12, portions:5, emoji:'🐙', cls:'fish'},
  {id:85, type:'수산', category:'전복·장어·문어', name:'국산 데친문어', weight:'약 2kg', regularPrice:84800, price:74480, discount:12, price100g:null, rating:5.0, reviewCount:91, portions:5, emoji:'🐙', cls:'fish'},
  {id:86, type:'수산', category:'간고등어·냉동 생선', name:'안동간고등어살 세트', weight:'1.8kg (120g × 15)', regularPrice:49800, price:44800, discount:10, price100g:null, rating:5.0, reviewCount:6, portions:5, emoji:'🐟', cls:'fish'},
  {id:87, type:'수산', category:'간고등어·냉동 생선', name:'안동간고등어 세트', weight:'1.8kg (900g × 2)', regularPrice:49800, price:44800, discount:10, price100g:null, rating:4.3, reviewCount:7, portions:5, emoji:'🐟', cls:'fish'},
  {id:88, type:'수산', category:'간고등어·냉동 생선', name:'서해바다 냉동 덕자병어 특대', weight:'1.2~1.8kg (2마리)', regularPrice:null, price:59800, discount:null, price100g:null, rating:5.0, reviewCount:6, portions:5, emoji:'🐟', cls:'fish'},
  {id:89, type:'수산', category:'간고등어·냉동 생선', name:'서해바다 냉동 덕자병어 왕왕', weight:'약 2kg (1마리)', regularPrice:null, price:99800, discount:null, price100g:null, rating:null, reviewCount:null, portions:5, emoji:'🐟', cls:'fish'},
  {id:90, type:'수산', category:'제주 수산물·선물세트', name:'서귀포수협 제주 냉동 갈치(왕)', weight:'900g (450g × 2팩)', regularPrice:93500, price:88000, discount:5, price100g:9778, rating:5.0, reviewCount:3, portions:5, emoji:'🐟', cls:'fish'},
  {id:91, type:'수산', category:'제주 수산물·선물세트', name:'서귀포수협 제주 냉동 갈치(특대)', weight:'700g (350g × 2팩)', regularPrice:63000, price:58000, discount:7, price100g:8286, rating:5.0, reviewCount:1, portions:5, emoji:'🐟', cls:'fish'},
  {id:92, type:'수산', category:'제주 수산물·선물세트', name:'서귀포수협 제주 냉동 옥돔(특대)', weight:'800g (400g × 2팩)', regularPrice:87000, price:80000, discount:8, price100g:10000, rating:3.4, reviewCount:3, portions:5, emoji:'🐟', cls:'fish'},
  {id:93, type:'수산', category:'제주 수산물·선물세트', name:'서귀포수협 제주 냉동 옥돔(대)', weight:'600g (300g × 2팩)', regularPrice:74200, price:68000, discount:8, price100g:11333, rating:5.0, reviewCount:1, portions:5, emoji:'🐟', cls:'fish'},
  {id:94, type:'수산', category:'제주 수산물·선물세트', name:'제주 옥돔·갈치 세트', weight:'1.3kg', regularPrice:120000, price:110000, discount:8, price100g:8462, rating:5.0, reviewCount:4, portions:5, emoji:'🐟', cls:'fish'}
];
const FRESH_PRODUCTS = PRODUCTS.filter(p => p.type === '신선식품');
const MEAT_SEAFOOD_PRODUCTS = PRODUCTS.filter(p => ['정육','수산'].includes(p.type));
const FRESH_CATEGORIES = ['전체','뿌리채소·고구마·호박류','버섯류','신선 채소·샐러드류','과일류'];
const MEAT_CATEGORIES = ['전체','스테이크·캠핑용 육류','돼지고기·한돈','한우·소고기','수입육·양고기','양념육·갈비·제육볶음','닭고기·닭 특수부위'];
const SEAFOOD_CATEGORIES = ['전체','회·해산물·프리미엄 수산물','조개류·꽃게·골뱅이','전복·장어·문어','간고등어·냉동 생선','제주 수산물·선물세트'];
const SPLIT_REVIEW_EXAMPLES = {
  '뿌리채소·고구마·호박류':'대용량이라 망설였는데 필요한 만큼 나눠 담을 수 있어 부담이 줄었어요.',
  '버섯류':'한 번에 다 쓰기 어려운 버섯을 나눠 받아 신선할 때 요리하기 좋았어요.',
  '신선 채소·샐러드류':'여러 채소를 조금씩 받아 샐러드와 반찬으로 알차게 활용했어요.',
  '과일류':'가족이 먹을 만큼만 나눠 받아 보관하기 편했어요.',
  '스테이크·캠핑용 육류':'캠핑 인원수에 맞춰 나눠 구매하니 다양한 부위를 부담 없이 즐겼어요.',
  '돼지고기·한돈':'대용량 돼지고기를 필요한 양만 받아 냉동실 자리를 아낄 수 있었어요.',
  '한우·소고기':'구이와 국거리용을 나눠 받아 메뉴에 맞춰 쓰기 편했어요.',
  '수입육·양고기':'평소 망설이던 고기도 소분으로 맛볼 수 있어 좋았어요.',
  '양념육·갈비·제육볶음':'양념육을 한 끼 분량으로 받아 간편하게 조리했어요.',
  '닭고기·닭 특수부위':'닭고기를 필요한 만큼 나눠 받아 요리별로 활용하기 좋았어요.',
  '회·해산물·프리미엄 수산물':'프리미엄 해산물을 소량씩 나눠 특별한 식사로 즐겼어요.',
  '조개류·꽃게·골뱅이':'손질이 번거로운 해산물을 필요한 만큼 받아 여러 요리에 썼어요.',
  '전복·장어·문어':'양이 많은 수산물을 나눠 받아 신선할 때 요리하기 좋았어요.',
  '간고등어·냉동 생선':'한 끼씩 나눠 보관하니 냉동 생선 꺼내 쓰기가 편했어요.',
  '제주 수산물·선물세트':'다양한 제주 수산물을 나눠 받아 가족 식탁에 알차게 올렸어요.'
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
const unitPrice = p => Math.round(p.price / p.portions);                 // 1소분 가격
const calc = (p, q) => Math.round(p.price / p.portions * q);             // 가격 ÷ 인원 × 구매 소분 수
const byId = id => PRODUCTS.find(p => p.id === +id);

const state = { view:'share-home', stack:[], tab:'전체', freshCategory:'전체', productCategory:'전체', searchQuery:'', product:null, qty:1, cart:[], pending:[], waitlist:[], rounds:[], modal:null };
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
const cartTotal = () => state.cart.reduce((a, c) => a + c.price, 0);

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
async function syncSharedData({quiet=false}={}){
  const roundsPromise=dbRequest('share_round_progress?select=*&order=created_at.desc');
  const ownPromise=state.session?Promise.all([
    dbRequest('share_orders?select=*&status=eq.confirmed&order=created_at.desc'),
    dbRequest('share_orders?select=*&status=eq.pending&order=created_at.desc'),
    dbRequest('share_waitlist?select=*&status=eq.waiting&order=created_at.asc')
  ]):Promise.resolve([[],[],[]]);
  const [rounds,own]=await Promise.all([roundsPromise,ownPromise]);
  const wasPending=new Set(state.pending.map(x=>x.oid));
  state.rounds=rounds||[];
  // A confirmed order is eligible for QR only if its cohort itself is filled.
  // This prevents stale or inconsistent order status from exposing a pickup QR.
  const filledRoundIds=new Set((rounds||[]).filter(r=>r.status==='filled'&&Number(r.joined_qty)>=Number(r.group_size)).map(r=>r.id));
  state.cart=(own[0]||[]).filter(x=>filledRoundIds.has(x.round_id)).map(x=>({oid:x.public_code,pid:x.product_id,qty:x.qty,price:x.amount,roundId:x.round_id,createdAt:x.created_at}));
  state.pending=(own[1]||[]).map(x=>({oid:x.public_code,pid:x.product_id,qty:x.qty,price:x.amount,roundId:x.round_id,createdAt:x.created_at}));
  state.waitlist=(own[2]||[]).map(x=>({wid:x.id,pid:x.product_id,qty:x.qty,price:x.amount,createdAt:x.created_at}));
  const newlyConfirmed=state.cart.some(x=>wasPending.has(x.oid));
  const newlyPromoted=state.pending.some(x=>!wasPending.has(x.oid));
  if(!quiet&&newlyConfirmed) toast('모집이 완료되어 장바구니에 담겼어요');
  else if(!quiet&&newlyPromoted) toast('대기 순서가 되어 모집에 참여됐어요');
  syncHomeAuth();
  if(['detail','categories','fresh-list','meat-list','search','cart','account'].includes(state.view)) render();
}

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
  <a data-a="account">${ic('user')}<span>마이페이지</span></a></footer>`;

/* ---------- 1. 홈 & 카테고리 ---------- */
function vShareHome(){
  return `
  <div class="sh-top"><button class="back" data-a="exit" aria-label="트레이더스 홈">${ic('back')}</button>
    <div class="brand">TRADERS <span>SHARE</span></div>${cartBtn()}</div>
  <button class="sh-search" data-a="search-open">${ic('search')}<span>상품명, 카테고리를 검색해보세요</span></button>
  <div class="hero"><div><b>필요한 만큼만,<br>소분 예약!</b><p>대용량 정육·수산을 원하는 만큼</p></div><div class="e">🥩</div></div>
  <div class="cats">${CATS.map(c=>`<button data-a="cat" data-v="${c[1]}" data-on="${c[2]}"><i>${ic(c[0])}</i>${c[1]}</button>`).join('')}</div>
  <div class="sec-t">지금 많이 찾는 상품</div>
  <div class="pop">${PRODUCTS.slice(0,2).map(p=>`
    <button data-a="detail" data-v="${p.id}"><div class="im ${p.cls}">${p.emoji}</div>
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
      <div class="im ${p.cls}">${p.emoji}<span class="tag ${round?'':'off'}">${p.availability|| (round ? '모집중' : '마감')}</span></div>
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

/* ---------- 3. 상세 & 소분 수량 선택 ---------- */
function vDetail(){
  const p = state.product, round=currentRound(state.product), r = round?remain(p):p.portions;
  const q = Math.min(Math.max(1, state.qty), Math.max(1, r));
  const pending=state.pending.find(x=>x.pid===p.id), waiting=state.waitlist.find(x=>x.pid===p.id);
  state.qty = q;
  return `${head('소분 예약')}
  <div class="d-img ${p.cls}">${p.emoji}<span class="tag">${p.portions}인 소분</span></div>
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
      <p>“${SPLIT_REVIEW_EXAMPLES[p.category]||'필요한 만큼 나눠 받아 보관과 활용이 편했어요.'}”</p></div>
    <div class="note" style="margin:14px 0 0">ⓘ 전체 소분 모집이 완료된 뒤 장바구니와 수령 QR이 생성돼요.</div>
  </div>
  <div class="cta">${pending
    ? `<button class="btn" data-a="ask-cancel" data-v="${pending.oid}">모집 대기 취소하기</button>`
    : round
      ? `<button class="btn" data-a="ask-reserve">소분 모집 참여하기 · ${won(calc(p,q))}</button>`
      : `<div class="cta-actions"><button class="btn" data-a="${waiting?'leave-wait':'join-wait'}" data-v="${p.id}">${waiting?'대기 취소하기':'마감 대기 신청하기'}</button><button class="linkrow" data-a="start-round" data-v="${p.id}">같은 상품 새 소분 모집 시작하기 ›</button></div>`}</div>`;
}

/* ---------- 4. 장바구니 ---------- */
function vCart(){
  if(!state.cart.length) return `${head('장바구니', false)}
    <div class="empty"><i>${ic('cart')}</i><b>확정된 예약이 없어요</b><p>소분 모집이 완료되면 장바구니와 QR이 생성돼요.</p>
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
  const email = state.session?.user?.email || '';
  return `${head('마이페이지', false)}
  <div class="account-top"><div class="account-avatar">${ic('user')}</div><div><span>회원</span><b>${email}</b></div></div>
  <div class="account-stats"><div>예약<b>${state.cart.length}건</b></div><div>모집중<b>${state.pending.length}건</b></div><div>대기<b>${state.waitlist.length}건</b></div></div>
  <div class="account-section"><h2>모집 참여 중</h2>${state.pending.length?state.pending.map(x=>{const p=byId(x.pid),r=state.rounds.find(y=>+y.product_id===x.pid);return `<div class="account-order"><b>${p.name}</b><span>${x.qty}소분 · ${r?`모집 ${r.joined_qty}/${r.group_size}`:'다른 이용자 참여 대기 중'}</span><button data-a="ask-cancel" data-v="${x.oid}">참여 취소</button></div>`;}).join(''):'<p class="mini">참여 중인 모집이 없어요.</p>'}</div>
  <div class="account-section"><h2>마감 대기</h2>${state.waitlist.length?state.waitlist.map(x=>`<div class="account-order"><b>${byId(x.pid).name}</b><span>${x.qty}소분 · 다음 모집 대기</span><button data-a="leave-wait" data-v="${x.pid}">대기 취소</button></div>`).join(''):'<p class="mini">대기 신청한 상품이 없어요.</p>'}</div>
  <div class="account-section"><h2>마이페이지</h2><button data-a="cart">확정된 예약 / QR 보기 <span>${state.cart.length}건　›</span></button><button data-a="share-home">소분 상품 보기 <span>›</span></button><button data-a="logout">로그아웃 <span>›</span></button></div>`;
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
  if(m.type === 'confirm'){
    const p = state.product, q = state.qty;
    return `<div class="overlay" data-a="overlay"><div class="dialog">
      <h3>모집에 참여하시겠어요?</h3>
      <div class="d-sum"><b>${p.name}</b><span>${p.portions}인 소분 중 ${q}소분</span><strong>${won(calc(p,q))}</strong></div>
      <p class="warn">전체 모집이 완료되면 장바구니와 QR이 발급돼요.</p>
      <div class="d-btns"><button class="ghost" data-a="close">취소</button><button class="ok" data-a="confirm-reserve">참여하기</button></div></div></div>`;
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
  const v = {'share-home':vShareHome, categories:vCategories, 'fresh-list':vFreshList, 'meat-list':vMeatList, search:vSearch, detail:vDetail, cart:vCart, visit:vVisit, login:()=>vAuth(false), signup:()=>vAuth(true), account:vAccount}[state.view];
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
async function joinCurrentRound(){
  if(!requireLogin()) return;
  const p=state.product, q=state.qty;
  try{
    await dbRpc('join_share',{p_product_id:p.id,p_qty:q,p_amount:calc(p,q)});
    await syncSharedData({quiet:true}); state.modal=null;
    const confirmed=state.cart.some(x=>x.pid===p.id);
    state.view=confirmed?'cart':'account'; render(); top0();
    toast(confirmed?'모집이 완료되어 예약과 QR이 발급됐어요':'모집 참여 완료! 전체 수량이 모이면 확정돼요');
  }catch(error){toast(error.message||'모집 참여에 실패했어요');}
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
    await dbRpc('start_share_round',{p_product_id:p.id,p_group_size:p.portions});
    await syncSharedData({quiet:true});
    const already=( )=>state.pending.some(x=>x.pid===p.id)||state.cart.some(x=>x.pid===p.id);
    if(currentRound(p)&&!already()){
      try{const q=Math.min(state.qty,remain(p));await dbRpc('join_share',{p_product_id:p.id,p_qty:q,p_amount:calc(p,q)});}
      catch(error){if(error.message!=='ALREADY_JOINED'&&error.message!=='ROUND_CLOSED')throw error;}
    }
    await syncSharedData({quiet:true});
    if(!currentRound(p)&&!already()&&!state.waitlist.some(x=>x.pid===p.id)){
      await dbRpc('join_share_waitlist',{p_product_id:p.id,p_qty:state.qty,p_amount:calc(p,state.qty)});
      await syncSharedData({quiet:true});
    }
    state.view=state.cart.some(x=>x.pid===p.id)?'cart':'account';render();top0();
    toast(state.cart.some(x=>x.pid===p.id)?'모집이 완료되어 예약과 QR이 발급됐어요':state.pending.some(x=>x.pid===p.id)?'새 소분 모집에 참여했어요':'다음 소분 모집 대기 신청이 완료됐어요');
  }catch(error){await syncSharedData().catch(()=>{});render();toast(error.message==='ROUND_CLOSED'?'대기자가 먼저 모집을 완료했어요':error.message||'새 모집을 시작하지 못했어요');}
}
async function cancelSharedOrder(){
  const code=state.modal?.oid;
  try{const result=await dbRpc('cancel_share',{p_public_code:code});state.modal=null;await syncSharedData({quiet:true});render();toast(result?.waiter_promoted?'취소된 자리를 대기자가 이어받았어요':'참여가 취소됐어요');}
  catch(error){toast(error.message||'취소에 실패했어요');}
}

document.addEventListener('click', e => {
  if(e.target.closest('[data-a="auth-entry"]')){ state.view=state.session?'account':'login'; render(); return; }
  if(e.target.closest('#go-tra')){ e.preventDefault(); state.stack = []; state.view = 'share-home'; render(); top0(); return; }
  const el = e.target.closest('[data-a]'); if(!el) return;
  if(el.dataset.a === 'overlay' && e.target !== el) return;     // 팝업 바깥(배경)을 눌렀을 때만 닫기
  e.stopPropagation();
  if(el.disabled) return;
  const a = el.dataset.a, v = el.dataset.v;
  switch(a){
    case 'back': back(); break;
    case 'exit': state.stack = []; state.modal = null; syncHomeAuth(); show('home'); break;
    case 'login': state.view='login'; render(); break;
    case 'signup': state.view='signup'; render(); break;
    case 'account': state.view=state.session?'account':'login'; render(); break;
    case 'share-home': state.view='share-home'; render(); break;
    case 'logout': state.session=null; state.cart=[]; state.pending=[]; state.waitlist=[]; localStorage.removeItem(AUTH_KEY); syncHomeAuth(); state.view='share-home'; render(); toast('로그아웃했어요'); break;
    case 'home-tab': state.stack = []; go('share-home', false); break;
    case 'cat-tab': go('categories'); break;
    case 'cat':
      if(el.dataset.on !== 'true'){ toast('준비 중이에요'); break; }
      state.tab='전체'; go(v==='신선식품'?'fresh-list':'meat-list'); break;
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
    case 'leave-wait': dbRpc('leave_share_waitlist',{p_product_id:+v}).then(()=>syncSharedData({quiet:true})).then(()=>{render();toast('대기가 취소됐어요');}).catch(error=>toast(error.message||'대기 취소에 실패했어요')); break;
    case 'start-round': startNewRound(); break;
    case 'confirm-reserve': joinCurrentRound(); break;
    case 'cart': state.modal = null; go('cart'); break;
    case 'shop': state.tab = '전체'; state.stack = ['share-home']; state.view = 'categories'; render(); top0(); break;
    case 'qr': state.modal = {type:'qr', oid:v}; render(); break;
    case 'ask-cancel': state.modal = {type:'cancel', oid:v}; render(); break;
    case 'confirm-cancel': cancelSharedOrder(); break;
    case 'close': case 'overlay': state.modal = null; render(); break;
    case 'visit': go('visit'); break;
  }
});

document.addEventListener('submit', e => {
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

// 다른 사용자의 모집 참여와 모집 완료를 반영하기 위해 공개 모집 상태와 내 예약을 주기적으로 동기화합니다.
syncSharedData({quiet:true}).catch(()=>{});
setInterval(()=>{
  if(document.visibilityState==='visible') syncSharedData().catch(()=>{});
},7000);
window.addEventListener('focus',()=>syncSharedData({quiet:true}).catch(()=>{}));
