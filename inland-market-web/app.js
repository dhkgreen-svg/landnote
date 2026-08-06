/* ==========================================================================
   MINMUL NARA (민물나라) - Freshwater Fish Market Engine (14 Languages)
   ========================================================================== */

// 1. Language Dictionary with Minmul Nara Branding
const TRANSLATIONS = {
  ko: {
    annBadge: "민물나라 10kg 11만 / 20kg 20만",
    ticker: "민물나라 - 소양호 & 남한강 자연산 붕어 · 잉어! 10kg(11만원) & 20kg(20만원 대용량특가) 전국 100% 무료배송",
    brandSub: "붕어 · 잉어 산지직송 전문몰 (Freshwater Fish Market)",
    lblCart: "장바구니",
    heroHeading: '민물나라 <span class="highlight-text">붕어 & 잉어</span><br>10kg 11만원 / 20kg 20만원!',
    heroDesc: '대한민국 맑은 강과 호수의 신선함 그대로! 부담없는 10kg(11만원)부터 대용량 20kg(20만원)까지 붕어만, 잉어만, 반반 구성과 맞춤 손질로 직송합니다.',
    btnAddBox: "장바구니 담기",
    productSecTitle: "민물나라 붕어 · 잉어 추천 상품",
    optHalfTitle: "☯️ 반반 혼합 (추천)",
    optHalfSub: "붕어 50% + 잉어 50%",
    optCrucianTitle: "🐟 붕어만 100%",
    optCrucianSub: "붕어만 구성",
    optCarpTitle: "🐟 잉어만 100%",
    optCarpSub: "잉어만 구성",
    cutRaw: "원물 그대로 (Whole Live / 生物) [가공비: +0원]",
    cutCurry: "🇧🇩 커리용 토막 손질 (Rui Curry Cut) [가공비 연동]",
    cutClean: "🇵🇭/🇮🇩 튀김·구이용 통생선 내장세척 (Cleaned Whole) [가공비 연동]",
    cutKorean: "🇰🇷 한국인 찌개/보양식 손질 (Korean Stew Cut) [가공비 연동]"
  },
  en: {
    annBadge: "MINMUL NARA 10kg 110k / 20kg 200k",
    ticker: "Minmul Nara - Wild Carp & Crucian 10kg (110,000 KRW) & 20kg (200,000 KRW)! Free delivery nationwide.",
    brandSub: "Fresh Carp & Crucian Direct Market [Minmul Nara]",
    lblCart: "Cart",
    heroHeading: 'Minmul Nara <span class="highlight-text">Carp & Crucian</span><br>10kg 110k / 20kg 200k KRW!',
    heroDesc: 'Choose 10kg (110k) or Bulk 20kg (200k)! Crucian only, Carp only, or Half & Half. Custom cut included.',
    btnAddBox: "Add to Cart",
    productSecTitle: "Minmul Nara Recommended Packages",
    optHalfTitle: "☯️ Half & Half Mix (Recommended)",
    optHalfSub: "Crucian 50% + Carp 50%",
    optCrucianTitle: "🐟 Crucian Carp Only 100%",
    optCrucianSub: "Crucian Only",
    optCarpTitle: "🐟 Carp Only 100%",
    optCarpSub: "Carp Only",
    cutRaw: "Whole Live / Uncut [Fee: +0 KRW]",
    cutCurry: "🇧🇩 Curry Cut (Chop Cut) [Fee Linked]",
    cutClean: "🇵🇭/🇮🇩 Cleaned Whole (Gutted for Fry) [Fee Linked]",
    cutKorean: "🇰🇷 Korean Stew / Healthy Cut [Fee Linked]"
  },
  hi: {
    annBadge: "मिनमुल नारा 10kg 110k / 20kg 200k",
    ticker: "मिनमुल नारा - ताज़ा प्राकृतिक मछली 10 किग्रा (110,000 वॉन) और 20 किग्रा (200,000 वॉन)! मुफ़्त डिलीवरी।",
    brandSub: "ताज़ा मछली सीधी बिक्री बाज़ार [मिनमुल नारा]",
    lblCart: "कार्ट",
    heroHeading: 'मिनमुल नारा <span class="highlight-text">ताज़ा मछली</span><br>10 किग्रा 110k / 20 किग्रा 200k वॉन!',
    heroDesc: 'अपनी पसंद चुनें: 10 किग्रा (110k) या 20 किग्रा (200k)! केवल क्रूसियन, केवल कार्प, या आधा-आधा।',
    btnAddBox: "कार्ट में जोड़ें",
    productSecTitle: "अनुशंसित पैकेज विकल्प",
    optHalfTitle: "☯️ आधा और आधा मिक्स (अनुशंसित)",
    optHalfSub: "क्रूसियन 50% + कार्प 50%",
    optCrucianTitle: "🐟 केवल क्रूसियन मछली 100%",
    optCrucianSub: "केवल क्रूसियन",
    optCarpTitle: "🐟 केवल कार्प मछली 100%",
    optCarpSub: "केवल कार्प",
    cutRaw: "पूरी ताज़ा मछली [शुल्क: +0 वॉन]",
    cutCurry: "🇧🇩 करी कट (Fish Curry Cut) [शुल्क लागू]",
    cutClean: "🇵🇭/🇮🇩 साफ़ की हुई पूरी मछली [शुल्क लागू]",
    cutKorean: "🇰🇷 कोरियाई सूप कट [शुल्क लागू]"
  },
  ms: {
    annBadge: "MINMUL NARA 10kg 110k / 20kg 200k",
    ticker: "Minmul Nara - Ikan Mas Segar 10kg (110,000 Won) & 20kg (200,000 Won)! Penghantaran percuma.",
    brandSub: "Pasar Direct Ikan Mas & Crucian [Minmul Nara]",
    lblCart: "Troli",
    heroHeading: 'Minmul Nara <span class="highlight-text">Ikan Segar</span><br>10kg 110k / 20kg 200k Won!',
    heroDesc: 'Pilihan 10kg (110k) atau 20kg (200k)! Pilihan Crucian sahaja, Ikan Mas sahaja, atau Campur Separuh.',
    btnAddBox: "Tambah ke Troli",
    productSecTitle: "Pilihan Pakej Pilihan",
    optHalfTitle: "☯️ Campur Separuh (Disyorkan)",
    optHalfSub: "Crucian 50% + Ikan Mas 50%",
    optCrucianTitle: "🐟 Hanya Crucian 100%",
    optCrucianSub: "Crucian Sahaja",
    optCarpTitle: "🐟 Hanya Ikan Mas 100%",
    optCarpSub: "Ikan Mas Sahaja",
    cutRaw: "Ikan Utuh Segar [Caj: +0 Won]",
    cutCurry: "🇧🇩 Potong Kari / Gulai [Caj Berangkai]",
    cutClean: "🇵🇭/🇮🇩 Bersih Sisik & Perut (Goreng) [Caj Berangkai]",
    cutKorean: "🇰🇷 Potongan Sup Herbal Korea [Caj Berangkai]"
  },
  th: {
    annBadge: "มินมุล นารา 10kg 110k / 20kg 200k",
    ticker: "Minmul Nara - ปลาสด 10 กก. (110,000 วอน) และ 20 กก. (200,000 วอน)! จัดส่งฟรีทั่วเกาหลี 100%",
    brandSub: "ตลาดสดปลาไนและปลาคาร์ป 10kg / 20kg [Minmul Nara]",
    lblCart: "ตะกร้าสินค้า",
    heroHeading: 'Minmul Nara <span class="highlight-text">ปลาไนและปลาคาร์ปสด</span><br>10 กก. 110,000 / 20 กก. 200,000 วอน!',
    heroDesc: 'เลือกได้ตามงบ: 10 กก. (110,000 วอน) หรือ 20 กก. สดสุดคุ้ม (200,000 วอน)! บริการตัดแต่งฟรี/ตามตัวเลือก',
    btnAddBox: "เพิ่มลงในตะกร้า",
    productSecTitle: "เลือกแพ็คเกจแนะนำ",
    optHalfTitle: "☯️ ผสมอย่างละครึ่ง (แนะนำ)",
    optHalfSub: "ปลาไน 50% + ปลาคาร์ป 50%",
    optCrucianTitle: "🐟 ปลาไนล้วน 100%",
    optCrucianSub: "ปลาไนล้วน",
    optCarpTitle: "🐟 ปลาคาร์ปล้วน 100%",
    optCarpSub: "ปลาคาร์ปล้วน",
    cutRaw: "สดทั้งตัว (ยังไม่ตัดแต่ง) [ค่าตัด: +0 วอน]",
    cutCurry: "🇧🇩 หั่นชิ้นสำหรับแกง/ต้มยำ [ตามขนาด]",
    cutClean: "🇵🇭/🇮🇩 ถอดเกล็ดและเครื่องใน (ทอด) [ตามขนาด]",
    cutKorean: "🇰🇷 ชิ้นสำหรับต้มซุปเกาหลี [ตามขนาด]"
  },
  mn: {
    annBadge: "MINMUL NARA 10кг 110к / 20кг 200к",
    ticker: "Minmul Nara - Шинэхэн загас 10кг (110,000 вон) ба 20кг (200,000 вон)! Үнэгүй хүргэлт.",
    brandSub: "Загасны шууд худалдааны зах [Minmul Nara]",
    lblCart: "Сагс",
    heroHeading: 'Minmul Nara <span class="highlight-text">Шинэхэн Загас</span><br>10кг 110к / 20кг 200к вон!',
    heroDesc: 'Боломжийн 10кг (110к) эсвэл их хэмжээний 20кг (200к)! Зөвхөн хэлтэг, зөвхөн цурхай эсвэл тал хувиар.',
    btnAddBox: "Сагсанд хийх",
    productSecTitle: "Санал болгож буй сонголтууд",
    optHalfTitle: "☯️ Холимог 50% + 50% (Зөвлөмж)",
    optHalfSub: "Хэлтэг 50% + Цурхай 50%",
    optCrucianTitle: "🐟 Зөвхөн Хэлтэг загас 100%",
    optCrucianSub: "Зөвхөн Хэлтэг",
    optCarpTitle: "🐟 Зөвхөн Цурхай загас 100%",
    optCarpSub: "Зөвхөн Цурхай",
    cutRaw: "Бүтнээр нь (Амьдаар нь) [+0 вон]",
    cutCurry: "🇧🇩 Шөл болон карид зориулж хэрчсэн",
    cutClean: "🇵🇭/🇮🇩 Цэવэрлэж арилгасан (Шархад)",
    cutKorean: "🇰🇷 Солонгос шөлний зориулалттай"
  },
  vi: {
    annBadge: "MINMUL NARA 10kg 110k / 20kg 200k",
    ticker: "Minmul Nara - Cá chép & Cá diếc 10kg (110.000 Won) & 20kg (200.000 Won)! Miễn phí giao hàng.",
    brandSub: "Chợ Cá Chép & Cá Diếc Tươi 10kg/20kg [Minmul Nara]",
    lblCart: "Giỏ hàng",
    heroHeading: 'Minmul Nara <span class="highlight-text">Cá Tươi</span><br>10kg 110k Won / 20kg 200k Won!',
    heroDesc: 'Lựa chọn gói 10kg (110k) vừa ăn hoặc 20kg (200k) tiết kiệm! Cá diếc 100%, cá chép 100% hoặc nửa này nửa kia.',
    btnAddBox: "Thêm Vào Giỏ Hàng",
    productSecTitle: "Các Gói Sản Phẩm Gợi Ý",
    optHalfTitle: "☯️ Nửa Nửa Hỗn Hợp (Khuyên Dùng)",
    optHalfSub: "Cá diếc 50% + Cá chép 50%",
    optCrucianTitle: "🐟 100% Cá Diếc",
    optCrucianSub: "Chỉ cá diếc",
    optCarpTitle: "🐟 100% Cá Chép",
    optCarpSub: "Chỉ cá chép",
    cutRaw: "Nguyên con tươi sống [Phí: +0 Won]",
    cutCurry: "🇧🇩 Cắt khúc nấu cà ri / nấu canh",
    cutClean: "🇵🇭/🇮🇩 Làm sạch vảy và nội tạng (Chiên)",
    cutKorean: "🇰🇷 Cắt khúc nấu canh lẩu kiểu Hàn"
  },
  id: {
    annBadge: "MINMUL NARA 10kg 110k / 20kg 200k",
    ticker: "Minmul Nara - Ikan Tawar Segar 10kg (110.000 Won) & 20kg (200.000 Won)! Gratis Ongkir.",
    brandSub: "Pasar Ikan Mas & Crucian Carp Direct [Minmul Nara]",
    lblCart: "Keranjang",
    heroHeading: 'Minmul Nara <span class="highlight-text">Ikan Segar</span><br>10kg 110rb / 20kg 200rb Won!',
    heroDesc: 'Pilih 10kg (110rb) hemat atau 20kg (200rb) porsi besar! Ikan Mas saja, Crucian saja, atau Campur.',
    btnAddBox: "Tambah ke Keranjang",
    productSecTitle: "Pilihan Paket Rekomendasi",
    optHalfTitle: "☯️ Campur Setengah (Direkomendasikan)",
    optHalfSub: "Crucian 50% + Ikan Mas 50%",
    optCrucianTitle: "🐟 Hanya Crucian 100%",
    optCrucianSub: "Hanya Crucian",
    optCarpTitle: "🐟 Hanya Ikan Mas 100%",
    optCarpSub: "Hanya Ikan Mas",
    cutRaw: "Utuh Segar [Biaya: +0 Won]",
    cutCurry: "🇧🇩 Potong Gulai / Kari",
    cutClean: "🇵🇭/🇮🇩 Bersih Sisik & Jeroan (Goreng)",
    cutKorean: "🇰🇷 Potongan Sup Herbal Korea"
  },
  tl: {
    annBadge: "MINMUL NARA 10kg 110k / 20kg 200k",
    ticker: "Minmul Nara - Sariwang Isda 10kg (110,000 KRW) & 20kg (200,000 KRW)! Libreng Shipping sa buong Korea.",
    brandSub: "Carp & Crucian Carp Direct Market [Minmul Nara]",
    lblCart: "Kariton",
    heroHeading: 'Minmul Nara <span class="highlight-text">Sariwang Isda</span><br>10kg 110k / 20kg 200k KRW!',
    heroDesc: 'Pumili sa 10kg (110k) o sakto sa Dorm na 20kg (200k)! Crucian lang, Carp lang, o Half & Half.',
    btnAddBox: "Idagdag sa Kariton",
    productSecTitle: "Mga Paketeng Inirerekomenda",
    optHalfTitle: "☯️ Half & Half Mix (Inirerekomenda)",
    optHalfSub: "Crucian 50% + Carp 50%",
    optCrucianTitle: "🐟 Crucian Carp Lang 100%",
    optCrucianSub: "Crucian Lang",
    optCarpTitle: "🐟 Carp Lang 100%",
    optCarpSub: "Carp Lang",
    cutRaw: "Buong Isda (Buhay) [Bayad: +0 Won]",
    cutCurry: "🇧🇩 Hiwang Pangkari / Pang-sabaw",
    cutClean: "🇵🇭/🇮🇩 Malinis ang kaliskis at bituka (Pang-prito)",
    cutKorean: "🇰🇷 Hiwang Pampakuluan sa Sabaw"
  },
  la: {
    annBadge: "MINMUL NARA 10kg 110k / 20kg 200k",
    ticker: "Minmul Nara - ປານ້ຳຈືດສົດ 10kg (110,000 ວອນ) & 20kg (200,000 ວອນ)! ສົ່ງຟຣີ 100%.",
    brandSub: "ຕະຫຼາດປານ້ຳຈືດ 10kg/20kg [Minmul Nara]",
    lblCart: "ກະຕ່າ",
    heroHeading: 'Minmul Nara <span class="highlight-text">ປານ້ຳຈືດສົດ</span><br>10kg 110,000 / 20kg 200,000 ວອນ!',
    heroDesc: 'ເລືອກໄດ້ 10kg (110,000 ວອນ) ຫຼື 20kg (200,000 ວອນ)! ປາໄນ 100%, ປາຄາບ 100% ຫຼື ຢ່າງລະເຄິ່ງ.',
    btnAddBox: "ເພີ່ມເຂົ້າກະຕ່າ",
    productSecTitle: "ເລືອກແພັກເກັດແນະນຳ",
    optHalfTitle: "☯️ ຢ່າງລະເຄິ່ງ (ແນະນຳ)",
    optHalfSub: "ປາໄນ 50% + ປາຄາບ 50%",
    optCrucianTitle: "🐟 ປາໄນ 100%",
    optCrucianSub: "ປາໄນ 100%",
    optCarpTitle: "🐟 ປາຄາບ 100%",
    optCarpSub: "ປາຄາບ 100%",
    cutRaw: "ປາສົດທັງໂຕ [ຄ່າຄົວ: +0 ວອນ]",
    cutCurry: "🇧🇩 ຕັດເປັນບ່ອນສຳລັບແກງ/ຕົ້ມ",
    cutClean: "🇵🇭/🇮🇩 ອະນາໄມຂີ້ປາ (ສຳລັບທອດ)",
    cutKorean: "🇰🇷 ຕັດສຳລັບຕົ້ມຊຸບເກົາຫຼີ"
  },
  my: {
    annBadge: "MINMUL NARA ၁၀kg ၁၁၀k / ၂၀kg ၂၀၀k",
    ticker: "Minmul Nara - ငါးလတ်ဆတ် ၁၀ ကီလို (၁၁၀,၀၀၀ ဝမ်) နှင့် ၂၀ ကီလို (၂၀၀,၀၀၀ ဝမ်)! ပို့ဆောင်ခ အခမဲ့။",
    brandSub: "ငါးလတ်ဆတ် တိုက်ရိုက် ရောင်းဝယ်ရေး ၁၀kg/၂၀kg [Minmul Nara]",
    lblCart: "စျေးဝယ်လှည်း",
    heroHeading: 'Minmul Nara <span class="highlight-text">ငါးလတ်ဆတ်</span><br>၁၀ ကီလို ၁၁၀k / ၂၀ ကီလို ၂၀၀k ဝမ်!',
    heroDesc: '၁၀ ကီလို (၁၁၀,၀၀၀ ဝမ်) သို့မဟုတ် ၂၀ ကီလို (၂၀၀,၀၀၀ ဝမ်) စိတ်ကြိုက် ရွေးချယ်နိုင်ပါသည်။',
    btnAddBox: "လှည်းထဲထည့်မည်",
    productSecTitle: "အထူး ရွေးချယ်မှုများ",
    optHalfTitle: "☯️ တစ်ဝက်စီ ရောနှောမှု (အထူးညွှန်းဆို)",
    optHalfSub: "ငါးသင်း ၅၀% + ငါးခူ ၅၀%",
    optCrucianTitle: "🐟 ငါးသင်း သီးသန့် ၁၀၀%",
    optCrucianSub: "ငါးသင်း သီးသန့်",
    optCarpTitle: "🐟 ငါးခူ သီးသန့် ၁၀၀%",
    optCarpSub: "ငါးခူ သီးသန့်",
    cutRaw: "အကောင်လိုက် [ပိုင်းဖြတ်ခ: +၀ ဝမ်]",
    cutCurry: "🇧🇩 ဟင်းချက်ရန် အတုံး ပိုင်းဖြတ်ခြင်း",
    cutClean: "🇵🇭/🇮🇩 အကြေးခွံနှင့် ကလီစာ ဆေးကြောခြင်း",
    cutKorean: "🇰🇷 ကိုရီးယား စတိုင် စွပ်ပြုတ် ချက်ရန်"
  },
  zh_tw: {
    annBadge: "民物나라 10kg 11 萬 / 20kg 20 萬韓元",
    ticker: "民物나라 - 野生淡水魚 10kg(11萬韓元) & 20kg(20萬韓元大容量特惠)！全韓免運費。",
    brandSub: "淡水魚 10kg/20kg 產地直送 [민물나라]",
    lblCart: "購物車",
    heroHeading: '민물나라 <span class="highlight-text">野生鯽魚與鯉魚</span><br>10kg 11萬 / 20kg 20萬韓元！',
    heroDesc: '無負擔 10kg(11萬) 或大容量 20kg(20萬)！全鯽魚、全鯉魚或各半組合包郵直送。',
    btnAddBox: "加入購物車",
    productSecTitle: "推薦規格選項",
    optHalfTitle: "☯️ 各半混合（推薦）",
    optHalfSub: "鯽魚 50% + 鯉魚 50%",
    optCrucianTitle: "🐟 100% 純鯽魚",
    optCrucianSub: "純鯽魚組合",
    optCarpTitle: "🐟 100% 純鯉魚",
    optCarpSub: "純鯉魚組合",
    cutRaw: "整條活魚（未宰殺）[加工費: +0 韓元]",
    cutCurry: "🇧🇩 咖哩/煮湯切塊處理",
    cutClean: "🇵🇭/🇮🇩 去鱗去內臟整條（煎炸）",
    cutKorean: "🇰🇷 韓式鮮魚湯切塊"
  },
  zh_cn: {
    annBadge: "民物나라 10kg 11 万 / 20kg 20 万韩元",
    ticker: "民物나라 - 野生淡水鱼 10kg(11万韩元) & 20kg(20万韩元大容量特惠)！全韩免运费。",
    brandSub: "淡水鱼 10kg/20kg 产地直送 [민물나라]",
    lblCart: "购物车",
    heroHeading: '민물나라 <span class="highlight-text">野生鲫鱼与鲤鱼</span><br>10kg 11万 / 20kg 20万韩元！',
    heroDesc: '无负担 10kg(11万) 或大容量 20kg(20万)！全鲫鱼、全鲤鱼或各半组合包邮直送。',
    btnAddBox: "加入购物车",
    productSecTitle: "推荐规格选项",
    optHalfTitle: "☯️ 各半混合（推荐）",
    optHalfSub: "鲫鱼 50% + 鲤鱼 50%",
    optCrucianTitle: "🐟 100% 纯鲫鱼",
    optCrucianSub: "纯鲫鱼组合",
    optCarpTitle: "🐟 100% 纯鲤鱼",
    optCarpSub: "纯鲤鱼组合",
    cutRaw: "整条活鱼（未宰杀）[加工费: +0 韩元]",
    cutCurry: "🇧🇩 咖喱/煮汤切块处理",
    cutClean: "🇵🇭/🇮🇩 去鳞去内脏整条（煎炸）",
    cutKorean: "🇰🇷 韩式鲜鱼汤切块"
  },
  bn: {
    annBadge: "মিনমুল নারা ১০ কেজি ১১০k / ২০ কেজি ২০০k ওন",
    ticker: "মিনমুল নারা - তাজা মাছ ১০ কেজি (১১০,০০০ ওন) এবং ২০ কেজি (২০০,০০০ ওন)! সম্পূর্ণ ফ্রি শিপিং।",
    brandSub: "রুই ও কার্প মাছ ১০/২০ কেজি ডাইরেክት মার্কেট [Minmul Nara]",
    lblCart: "কার্ট",
    heroHeading: 'মিনমুল নারা <span class="highlight-text">তাজা রুই ও কার্প</span><br>১০ কেজি ১১০k / ২০ কেজি ২০০k ওন!',
    heroDesc: '১০ কেজি (১১০,০০০ ওন) বা ২০ কেজি (২০০,০০০ ওন)! রুই মাছ, পুটি কার্প বা হাফ হাফ মিক্স।',
    btnAddBox: "কার্টে যোগ করুন",
    productSecTitle: "বিশেষ প্যাকেজ অপশন",
    optHalfTitle: "☯️ হাফ হাফ মিক্স (বিশেষ প্রস্তাবিত)",
    optHalfSub: "পুটি কার্প ৫০% + রুই ৫০%",
    optCrucianTitle: "🐟 ১০০% পুটি কার্প",
    optCrucianSub: "শুধুমাত্র পুটি কার্প",
    optCarpTitle: "🐟 ১০০% রুই মাছ",
    optCarpSub: "শুধুমাত্র রুই মাছ",
    cutRaw: "সম্পূর্ণ অক্ষত (আস্ত তাজা) [ফি: +০ ওন]",
    cutCurry: "🇧🇩 রুই কারি কাটিং (টুকরো কাটিং)",
    cutClean: "🇵🇭/🇮🇩 আশ ও নাড়িভুঁড়ি পরিষ্কার (ভাজার জন্য)",
    cutKorean: "🇰🇷 কোরিয়ান স্যুপ কাটিং"
  }
};

// 2. Fixed Package Products Data for Display Grid
const PACKAGES = [
  {
    id: "pkg-10kg-half",
    name: "☯️ [10kg 반반] 붕어 5kg + 잉어 5kg",
    desc: "부담없는 10kg 알뜰 구성! 붕어 5kg + 잉어 5kg 반반 세트. (기본 110,000원 + 손질 가공비 연동)",
    basePrice: 110000,
    weight: "10kg",
    badge: "👍 10kg 인기",
    badgeType: "today",
    icon: "fa-scale-balanced"
  },
  {
    id: "pkg-20kg-half",
    name: "🔥 [20kg 대용량 반반] 붕어 10kg + 잉어 10kg",
    desc: "2만원 할인 혜택! 붕어 10kg + 잉어 10kg 대용량 알뜰 구성. (기본 200,000원 + 손질 가공비 연동)",
    basePrice: 200000,
    weight: "20kg",
    badge: "🔥 BEST 2만원 할인",
    badgeType: "today",
    icon: "fa-boxes-packing"
  },
  {
    id: "pkg-10kg-crucian",
    name: "🐟 [10kg 붕어만] 토종 붕어 10kg",
    desc: "붕어만 10kg 꽉 채운 부담없는 수량. (기본 110,000원 + 손질 가공비 연동)",
    basePrice: 110000,
    weight: "10kg",
    badge: "🌿 붕어 10kg",
    badgeType: "reserve",
    icon: "fa-fish-fins"
  },
  {
    id: "pkg-20kg-carp",
    name: "🇧🇩 [20kg 잉어만] 대형 잉어 20kg",
    desc: "커리용 최적! 대형 잉어만 20kg 대용량 박스. (기본 200,000원 + 손질 가공비 연동)",
    basePrice: 200000,
    weight: "20kg",
    badge: "🇧🇩 잉어 20kg",
    badgeType: "b2b",
    icon: "fa-fish"
  }
];

// State
let currentLang = "ko";
let selectedWeight = "10kg";
let basePrice = 110000;
let selectedRatio = "half";
let boxQty = 1;
let cart = [];

// DOM Load
document.addEventListener("DOMContentLoaded", () => {
  renderPackagesGrid();
  updateCartBadge();
  calculateMainPrice();
  startLiveTicker();
});

function startLiveTicker() {
  const tickerEl = document.getElementById("ticker-text");
  if (!tickerEl) return;
  setInterval(() => {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ko;
    tickerEl.textContent = t.ticker;
  }, 5000);
}

// Select Weight (10kg vs 20kg)
function selectWeight(weightVal, priceVal) {
  selectedWeight = weightVal;
  basePrice = priceVal;

  const buttons = document.querySelectorAll(".weight-btn");
  buttons.forEach(btn => btn.classList.remove("active"));

  if (weightVal === "10kg") {
    buttons[0].classList.add("active");
  } else {
    buttons[1].classList.add("active");
  }

  calculateMainPrice();
}

// Dynamic Price Calculation
function calculateMainPrice() {
  const cutSelect = document.getElementById("main-cut-select");
  if (!cutSelect) return;

  const cutVal = cutSelect.value;
  let feePerBox = 0;

  if (cutVal !== "raw") {
    feePerBox = selectedWeight === "10kg" ? 5000 : 10000;
  }

  const singleBoxPrice = basePrice + feePerBox;
  const grandTotal = singleBoxPrice * boxQty;

  const displayPriceEl = document.getElementById("calc-display-price");
  if (displayPriceEl) {
    displayPriceEl.innerHTML = `${grandTotal.toLocaleString()}<span class="won" id="txt-won">원</span>`;
  }

  const priceDetailEl = document.getElementById("calc-price-detail");
  if (priceDetailEl) {
    priceDetailEl.textContent = `(${selectedWeight} ${boxQty}박스: 기본 ${(basePrice*boxQty).toLocaleString()}원 + 가공비 ${(feePerBox*boxQty).toLocaleString()}원)`;
  }
}

// Render Package Cards
function renderPackagesGrid() {
  const container = document.getElementById("products-grid");
  if (!container) return;

  container.innerHTML = PACKAGES.map(pkg => `
    <article class="product-card">
      <div class="card-img-wrap">
        <span class="badge-status ${pkg.badgeType}">${pkg.badge}</span>
        <i class="fa-solid ${pkg.icon} card-fish-icon"></i>
        <span class="badge-origin"><i class="fa-solid fa-location-dot"></i> 소양호/남한강 1급수</span>
      </div>
      <div class="card-body">
        <span class="card-category-tag">${pkg.weight} [민물나라]</span>
        <h3 class="card-title">${pkg.name}</h3>
        <p class="card-desc">${pkg.desc}</p>
        
        <div class="prep-tags-row">
          <span class="prep-mini-tag"><i class="fa-solid fa-check"></i> ${pkg.weight} 규격</span>
          <span class="prep-mini-tag"><i class="fa-solid fa-check"></i> 100% 무료배송</span>
          <span class="prep-mini-tag"><i class="fa-solid fa-check"></i> 가공비 자동 합산</span>
        </div>

        <div class="card-footer">
          <div class="card-price-box">
            <span class="price">${pkg.basePrice.toLocaleString()}원~</span>
            <span class="unit-sm">${pkg.weight}</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="quickSelectWeight('${pkg.weight}', ${pkg.basePrice})">
            <i class="fa-solid fa-cart-plus"></i> 선택 주문
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

function selectRatio(cardElem, ratioVal) {
  document.querySelectorAll(".ratio-card").forEach(c => c.classList.remove("active"));
  cardElem.classList.add("active");
  cardElem.querySelector('input[name="ratio-selection"]').checked = true;
  selectedRatio = ratioVal;
  calculateMainPrice();
}

function changeBoxQty(delta) {
  boxQty = Math.max(1, boxQty + delta);
  document.getElementById("box-qty-num").textContent = boxQty;
  calculateMainPrice();
}

function quickSelectWeight(weightVal, priceVal) {
  selectWeight(weightVal, priceVal);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Add Box to Cart
function addBoxToCart() {
  const cutSelect = document.getElementById("main-cut-select");
  const cutVal = cutSelect ? cutSelect.value : "raw";
  let feePerBox = 0;
  if (cutVal !== "raw") {
    feePerBox = selectedWeight === "10kg" ? 5000 : 10000;
  }

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ko;
  const cutNames = {
    raw: t.cutRaw,
    curry: t.cutCurry,
    clean: t.cutClean,
    korean: t.cutKorean
  };

  const ratioTexts = {
    half: "반반 혼합 (붕어50%+잉어50%)",
    crucian: "붕어만 100%",
    carp: "잉어만 100%"
  };

  const unitPrice = basePrice + feePerBox;

  const item = {
    cartId: Date.now(),
    name: `[민물나라 ${selectedWeight} ${ratioTexts[selectedRatio]}]`,
    weight: selectedWeight,
    cutName: cutNames[cutVal] || t.cutRaw,
    fee: feePerBox,
    pricePerBox: unitPrice,
    qty: boxQty,
    totalPrice: unitPrice * boxQty
  };

  cart.push(item);
  updateCartBadge();
  showToast(`${item.name} (${boxQty} Box) Added to Cart!`);
  openCart();
}

// Cart System
function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  const totalBoxes = cart.reduce((acc, item) => acc + item.qty, 0);
  badge.textContent = totalBoxes;
}

function openCart() {
  renderCartItems();
  document.getElementById("cart-drawer").classList.add("active");
}

function closeCart() {
  document.getElementById("cart-drawer").classList.remove("active");
}

function renderCartItems() {
  const container = document.getElementById("cart-items-container");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-msg">
        <i class="fa-solid fa-fish"></i>
        <p>Cart is empty / 장바구니가 비어있습니다.</p>
      </div>
    `;
    document.getElementById("cart-subtotal").textContent = "0원";
    document.getElementById("cart-shipping").textContent = "FREE (무료배송)";
    document.getElementById("cart-grand-total").textContent = "0원";
    return;
  }

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>
        <div class="cart-item-title">${item.name} (${item.qty} Box)</div>
        <div class="cart-item-sub">Cut: ${item.cutName} (가공비 ${item.fee.toLocaleString()}원)</div>
        <div class="cart-item-price">${item.totalPrice.toLocaleString()}원</div>
      </div>
      <button class="cart-item-remove" onclick="removeCartItem(${item.cartId})" title="Delete">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join("");

  document.getElementById("cart-subtotal").textContent = `${subtotal.toLocaleString()}원`;
  document.getElementById("cart-shipping").textContent = "FREE (무료배송)";
  document.getElementById("cart-grand-total").textContent = `${subtotal.toLocaleString()}원`;
}

function removeCartItem(cartId) {
  cart = cart.filter(item => item.cartId !== cartId);
  updateCartBadge();
  renderCartItems();
  showToast("Item deleted.");
}

function checkoutAlert() {
  if (cart.length === 0) {
    showToast("Cart is empty.");
    return;
  }
  const grandTotal = document.getElementById("cart-grand-total").textContent;
  alert(`[민물나라 주문 접수 완료 / Minmul Nara Order Confirmed]\nTotal: ${grandTotal}\n\nBank Account: NongHyup (농협) 301-1234-5678-91 (민물나라 수산)\n\nOxygen packed & Free delivery to your doorstep!`);
  cart = [];
  updateCartBadge();
  closeCart();
  showToast("Order submitted successfully!");
}

function handleB2bSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("b2b-company").value;
  showToast(`${name}, Bulk Order Request Received!`);
  alert(`[Order Inquiry Complete / 대량 문의 접수 완료]\nThank you ${name}! We will contact you on WhatsApp / Phone within 30 mins.`);
  document.getElementById("b2b-form").reset();
}

function changeLanguage(langKey) {
  if (!TRANSLATIONS[langKey]) return;
  currentLang = langKey;

  const t = TRANSLATIONS[langKey];

  const map = {
    "ann-badge-text": t.annBadge,
    "ticker-text": t.ticker,
    "brand-sub-text": t.brandSub,
    "lbl-cart": t.lblCart,
    "hero-desc-txt": t.heroDesc,
    "btn-add-box-txt": t.btnAddBox,
    "product-sec-title": t.productSecTitle,
    "opt-half-title": t.optHalfTitle,
    "opt-half-sub": t.optHalfSub,
    "opt-crucian-title": t.optCrucianTitle,
    "opt-crucian-sub": t.optCrucianSub,
    "opt-carp-title": t.optCarpTitle,
    "opt-carp-sub": t.optCarpSub,
    "cut-opt-raw": t.cutRaw,
    "cut-opt-curry": t.cutCurry,
    "cut-opt-clean": t.cutClean,
    "cut-opt-korean": t.cutKorean
  };

  for (const [id, text] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  const heroHeading = document.getElementById("hero-heading-txt");
  if (heroHeading) heroHeading.innerHTML = t.heroHeading;

  calculateMainPrice();
  showToast(`Language switched to ${langKey.toUpperCase()}`);
}

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}
