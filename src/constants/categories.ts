export interface CategoryDefinition {
  id: number;
  icon: string;
  rule: 'need' | 'want';
  names: [string, string, string, string, string, string]; // ckb, ar, en, kmr, fa, tr
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 0,
    icon: 'house',
    rule: 'need',
    names: [
      'کرێی خانوو یان قیست',
      'إيجار أو قسط السكن',
      'Rent / housing installment',
      'Kirê an qista xanî',
      'اجاره یا قسط مسکن',
      'Kira veya konut taksiti'
    ]
  },
  {
    id: 1,
    icon: 'zap',
    rule: 'need',
    names: [
      'کارەبا و مۆلیدە',
      'الكهرباء والمولدة',
      'Electricity & generator',
      'Elektrîk û jeneratore',
      'برق و ژنراتور',
      'Elektrik ve jeneratör'
    ]
  },
  {
    id: 2,
    icon: 'droplets',
    rule: 'need',
    names: [
      'ئاو',
      'الماء',
      'Water',
      'Av',
      'آب',
      'Su'
    ]
  },
  {
    id: 3,
    icon: 'flame',
    rule: 'need',
    names: [
      'گاز و نەوت (گەرمکردنەوە)',
      'الغاز ونفط التدفئة',
      'Gas & heating fuel',
      'Gaz û mazot (germkirin)',
      'گاز و نفت گرمایش',
      'Gaz ve ısıtma yakıtı'
    ]
  },
  {
    id: 4,
    icon: 'wifi',
    rule: 'need',
    names: [
      'ئینتەرنێت',
      'الإنترنت',
      'Internet',
      'Înternet',
      'اینترنت',
      'İnternet'
    ]
  },
  {
    id: 5,
    icon: 'smartphone',
    rule: 'need',
    names: [
      'مۆبایل و کارت',
      'الهاتف والرصيد',
      'Mobile & credit',
      'Mobîl û kontor',
      'موبایل و شارژ',
      'Mobil ve kontör'
    ]
  },
  {
    id: 6,
    icon: 'shopping-cart',
    rule: 'need',
    names: [
      'خواردن و بازاڕ',
      'الطعام والبقالة',
      'Groceries',
      'Xwarin û bazar',
      'خواربار',
      'Market alışverişi'
    ]
  },
  {
    id: 7,
    icon: 'wheat',
    rule: 'need',
    names: [
      'نان و نانەوایی',
      'الخبز والمخبوزات',
      'Bread & bakery',
      'Nan û nanvanî',
      'نان و نانوایی',
      'Ekmek ve fırın'
    ]
  },
  {
    id: 8,
    icon: 'drumstick',
    rule: 'need',
    names: [
      'گۆشت و مریشک',
      'اللحوم والدجاج',
      'Meat & poultry',
      'Goşt û mirîşk',
      'گوشت و مرغ',
      'Et ve tavuk'
    ]
  },
  {
    id: 9,
    icon: 'apple',
    rule: 'need',
    names: [
      'میوە و سەوزە',
      'الفواكه والخضار',
      'Fruit & vegetables',
      'Fêkî û sebze',
      'میوه و سبزی',
      'Meyve ve sebze'
    ]
  },
  {
    id: 10,
    icon: 'coffee',
    rule: 'want',
    names: [
      'ڕێستۆران و کافێ',
      'مطاعم ومقاهي',
      'Restaurants & cafes',
      'Xwaringeh û kafe',
      'رستوران و کافه',
      'Restoran ve kafe'
    ]
  },
  {
    id: 11,
    icon: 'fuel',
    rule: 'need',
    names: [
      'بەنزین',
      'البنزين',
      'Car fuel',
      'Benzîn',
      'بنزین',
      'Benzin'
    ]
  },
  {
    id: 12,
    icon: 'car-taxi-front',
    rule: 'need',
    names: [
      'گواستنەوە و تاکسی',
      'النقل والتاكسي',
      'Transport & taxi',
      'Veguhastin û texsî',
      'حمل‌ونقل و تاکسی',
      'Ulaşım ve taksi'
    ]
  },
  {
    id: 13,
    icon: 'wrench',
    rule: 'need',
    names: [
      'چاککردنەوەی ئوتومبێل',
      'صيانة السيارة',
      'Car maintenance',
      'Tamîra erebeyê',
      'تعمیر خودرو',
      'Araç bakımı'
    ]
  },
  {
    id: 14,
    icon: 'car',
    rule: 'need',
    names: [
      'قیستی ئوتومبێل',
      'قسط السيارة',
      'Car installment',
      'Qista erebeyê',
      'قسط خودرو',
      'Araç taksiti'
    ]
  },
  {
    id: 15,
    icon: 'pill',
    rule: 'need',
    names: [
      'دەرمان و دکتۆر',
      'الأدوية والطبيب',
      'Medicine & doctor',
      'Derman û doktor',
      'دارو و پزشک',
      'İlaç ve doktor'
    ]
  },
  {
    id: 16,
    icon: 'shirt',
    rule: 'want',
    names: [
      'جلوبەرگ',
      'الملابس',
      'Clothing',
      'Cil û berg',
      'پوشاک',
      'Giyim'
    ]
  },
  {
    id: 17,
    icon: 'spray-can',
    rule: 'need',
    names: [
      'پێداویستی ماڵ',
      'مستلزمات المنزل',
      'Household supplies',
      'Pêdiviyên malê',
      'لوازم خانه',
      'Ev gereçleri'
    ]
  },
  {
    id: 18,
    icon: 'sofa',
    rule: 'want',
    names: [
      'کەلوپەل و کارەبایی',
      'أثاث وأجهزة',
      'Furniture & appliances',
      'Mobîlya û alavên elektrîkê',
      'مبلمان و لوازم برقی',
      'Mobilya ve elektronik'
    ]
  },
  {
    id: 19,
    icon: 'hammer',
    rule: 'need',
    names: [
      'چاککردنەوەی ماڵ',
      'صيانة المنزل',
      'Home repairs',
      'Tamîra malê',
      'تعمیرات منزل',
      'Ev onarımı'
    ]
  },
  {
    id: 20,
    icon: 'graduation-cap',
    rule: 'need',
    names: [
      'قوتابخانە و خوێندن',
      'المدرسة والدراسة',
      'School & tuition',
      'Dibistan û xwendin',
      'مدرسه و تحصیل',
      'Okul ve eğitim'
    ]
  },
  {
    id: 21,
    icon: 'baby',
    rule: 'need',
    names: [
      'منداڵان',
      'الأطفال',
      'Children',
      'Zarok',
      'کودکان',
      'Çocuklar'
    ]
  },
  {
    id: 22,
    icon: 'gift',
    rule: 'want',
    names: [
      'هەدیە و بۆنەکان',
      'الهدايا والمناسبات',
      'Gifts & occasions',
      'Diyarî û merasîm',
      'هدیه و مناسبت‌ها',
      'Hediye ve davetler'
    ]
  },
  {
    id: 23,
    icon: 'hand-heart',
    rule: 'need',
    names: [
      'یارمەتی دایک و باوک و خزم',
      'مساعدة الأهل',
      'Family support',
      'Alîkariya dê û bav û xizman',
      'کمک به خانواده و بستگان',
      'Aile desteği'
    ]
  },
  {
    id: 24,
    icon: 'heart-handshake',
    rule: 'want',
    names: [
      'زەکات و خێر',
      'الزكاة والصدقات',
      'Charity & zakat',
      'Zekat û xêr',
      'زکات و صدقه',
      'Zekât ve hayır'
    ]
  },
  {
    id: 25,
    icon: 'plane',
    rule: 'want',
    names: [
      'گەشت و پیکنیک',
      'السفر والرحلات',
      'Travel & picnics',
      'Rêwîtî û pîknîk',
      'سفر و پیک‌نیک',
      'Seyahat ve piknik'
    ]
  },
  {
    id: 26,
    icon: 'gamepad-2',
    rule: 'want',
    names: [
      'خۆشی و کات بەسەربردن',
      'الترفيه',
      'Entertainment',
      'Dilxweşî',
      'تفریح',
      'Eğlence'
    ]
  },
  {
    id: 27,
    icon: 'scissors',
    rule: 'want',
    names: [
      'جوانکاری و ڕیشتاشین',
      'العناية الشخصية',
      'Personal care & barber',
      'Xemla kesane û berber',
      'آرایشگر و مراقبت شخصی',
      'Kişisel bakım ve berber'
    ]
  },
  {
    id: 28,
    icon: 'shield-check',
    rule: 'need',
    names: [
      'بیمە',
      'التأمين',
      'Insurance',
      'Bîme',
      'بیمه',
      'Sigorta'
    ]
  },
  {
    id: 29,
    icon: 'credit-card',
    rule: 'need',
    names: [
      'قەرز',
      'الديون',
      'Debt repayment',
      'Deyn',
      'بدهی',
      'Borç'
    ]
  },
  {
    id: 30,
    icon: 'refresh-cw',
    rule: 'want',
    names: [
      'کۆمەڵە (جەمعیە)',
      'الجمعية',
      'Rotating savings circle',
      'Komele (cemiyet)',
      'صندوق دوره‌ای',
      'Altın günü'
    ]
  },
  {
    id: 31,
    icon: 'package',
    rule: 'want',
    names: [
      'خەرجی تر',
      'أخرى',
      'Other',
      'Yên din',
      'سایر',
      'Diğer'
    ]
  }
];

export const NEED_CATEGORY_IDS = CATEGORIES.filter(c => c.rule === 'need').map(c => c.id);
