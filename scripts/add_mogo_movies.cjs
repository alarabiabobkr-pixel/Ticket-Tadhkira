const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const itemsData = [
  {
    code: "sk82vpaldnaj",
    rawTitle: "5 Mohy el din abu elezz 2023 1080p WEB-DL AKWAM",
    title: "فيلم 5 محيي الدين أبو العز (2023)",
    year: "2023",
    duration: "ساعة و 40 دقيقة",
    genre: "كوميديا • تشويق • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["أحمد فتحي", "مصطفى أبو سريع", "مي كساب"],
    overview: "شاب يسافر للخارج بحثاً عن فرصة عمل، لكنه يفاجأ بصدور حكم إعدام غيابي ضده بسبب تشابه اسمه مع شخص آخر، فيخوض مغامرة لإثبات براءته.",
    searchQuery: "5 Mohy el din abu elezz"
  },
  {
    code: "i65edsm1cnb4",
    rawTitle: "Aalzero 2023 1080P WEB-DL AKWAM",
    title: "فيلم ع الزيرو (2023) Aalzero",
    year: "2023",
    duration: "ساعتين و 5 دقائق",
    genre: "دراما • أكشن وتضحية • سينما مصرية",
    subGenre: "drama",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.9",
    actors: ["محمد رمضان", "نيللي كريم", "شريف سلامة", "خالد الصاوي"],
    overview: "حمزة الملقب بدراجون، دي جي بسيط يسعى بكل ما أوتي من قوة لإنقاذ ابنه المصاب بمرض نادر وتوفير تكاليف علاجه الباهظة وسط صراعات معقدة.",
    searchQuery: "Aalzero 2023"
  },
  {
    code: "8sne67igyb74",
    rawTitle: "Abo Nasab 2023 720P WEB-DL AKWAM",
    title: "فيلم أبو نسب (2023) Abo Nasab",
    year: "2023",
    duration: "ساعتين و 10 دقائق",
    genre: "كوميديا • أكشن وعائلي • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "720p HD",
    rating: "8.1",
    actors: ["محمد إمام", "ماجد الكدواني", "ياسمين صبري", "وفاء عامر"],
    overview: "طبيب أطفال يقع في حب فتاة ويستعد للزواج منها، ليكتشف ليلة زفافه أن والدها زعيم عصابة خطير خرج لتوه من السجن وتطارده المتاعب.",
    searchQuery: "Abo Nasab 2023"
  },
  {
    code: "qri52n65dcvd",
    rawTitle: "Ahmed Wa Ahmed 1080p WEB-DL AKWAM",
    title: "فيلم أحمد وأحمد (2025) Ahmed Wa Ahmed",
    year: "2025",
    duration: "ساعتين",
    genre: "أكشن • كوميديا وتشويق • سينما مصرية",
    subGenre: "action",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["أحمد السقا", "أحمد فهمي", "جيهان الشماشرجي"],
    overview: "لقاء قمة كوميدي أكشن يجمع النجمين أحمد السقا وأحمد فهمي في مطاردات ومواقف مشوقة تنطلق بين شوارع القاهرة والإسكندرية.",
    searchQuery: "Ahmed Wa Ahmed 2025"
  },
  {
    code: "gfkjqrhwm4tl",
    rawTitle: "Al Dawr Al Sabe 720p WEB-DL AKWAM",
    title: "فيلم الدور السابع (2024)",
    year: "2024",
    duration: "ساعة و 35 دقيقة",
    genre: "غموض • إثارة وتشويق • سينما عربية",
    subGenre: "thriller",
    origin: "arabic",
    quality: "720p HD",
    rating: "7.4",
    actors: ["نخبة من نجوم الدراما والسينما العربية"],
    overview: "أحداث غامضة ومثيرة تدور داخل مبنى سكني في الدور السابع حيث تتكشف أسرار مظلمة تقلب حياة القاطنين رأساً على عقب.",
    searchQuery: "Al Dawr Al Sabe"
  },
  {
    code: "tpw6j4jysjm5",
    rawTitle: "Al Mahytya 2026 1080p",
    title: "فيلم المحيطة (2026)",
    year: "2026",
    duration: "ساعة و 45 دقيقة",
    genre: "غموض • دراما وتشويق • سينما جديدة",
    subGenre: "mystery",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["طاقم السينما العربية الحديثة"],
    overview: "رحلة استكشافية تتطور إلى مواجهة مصيرية مع قوى وأسرار مدفونة تحبس الأنفاس حتى اللحظات الأخيرة.",
    searchQuery: "Al Mahytya"
  },
  {
    code: "nfu87eywh9kp",
    rawTitle: "Al Mashroa X 1080 WEB-DL AKWAM",
    title: "فيلم المشروع إكس (2025) Project X",
    year: "2025",
    duration: "ساعة و 50 دقيقة",
    genre: "خيال علمي • أكشن وتشويق",
    subGenre: "sci-fi",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["أبطال الأكشن والسينما المتطورة"],
    overview: "مهمة سرية فائقة الخطورة لاختراق منظومة متطورة تسيطر على أحدث التقنيات الدفاعية المستقبلية.",
    searchQuery: "Project X"
  },
  {
    code: "tamu6ust2zvy",
    rawTitle: "Al Sada Al Afadel 1080p WEB-DL AKWAM",
    title: "فيلم السادة الأفاضل (2025)",
    year: "2025",
    duration: "ساعة و 42 دقيقة",
    genre: "كوميديا سوداء • دراما اجتماعية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.9",
    actors: ["نجوم الكوميديا والدراما الاجتماعية"],
    overview: "مفارقات ساخرة تفضح نفاق المجتمع والعلاقات الإنسانية المعقدة بين طبقات متباينة تجمعهم مصلحة واحدة مشتركة.",
    searchQuery: "Al Sada Al Afadel"
  },
  {
    code: "vo6amwbmav6j",
    rawTitle: "Al Signor Oqdat Al Khawaja 1080p WEB-DL AKWAM",
    title: "فيلم السينور: عقدة الخواجة (2024)",
    year: "2024",
    duration: "ساعة و 45 دقيقة",
    genre: "كوميديا • مغامرات ساخرة",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.5",
    actors: ["طاقم الكوميديا المصرية"],
    overview: "مغامرات شيقة لشاب يتقمص شخصية رجل أعمال أوروبي مرموق ليقع في سلسلة من الأزمات والمواقف الكوميدية غير المتوقعة.",
    searchQuery: "Al Signor Oqdat Al Khawaja"
  },
  {
    code: "5ydz6wth89px",
    rawTitle: "Alhamour H A 2023 1080p WEB-DL akwam",
    title: "فيلم الهامور ع.ع (2023) Alhamour H.A.",
    year: "2023",
    duration: "ساعتين و 12 دقيقة",
    genre: "جريمة • دراما وكوميديا سوداء • سينما سعودية",
    subGenre: "crime",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["فهد القحطاني", "خالد يسلم", "إسماعيل الحسن", "فاطمة البنوي"],
    overview: "مستوحى من وقائع حقيقية لأكبر عملية نصب احتيالي مالي في تاريخ جدة، يقودها حارس أمن طموح يصعد إلى قمة الثراء السريع.",
    searchQuery: "Alhamour H.A. 2023"
  },
  {
    code: "f8jkf2hr7ylm",
    rawTitle: "All Thats Left of You 2025 WEB-DL AKWAM",
    title: "فيلم كل ما تبقى منك (2025) All That's Left of You",
    year: "2025",
    duration: "ساعة و 55 دقيقة",
    genre: "دراما إنسانية • تاريخي مؤثر • سينما عربية",
    subGenre: "drama",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.4",
    actors: ["نخبة من نجوم السينما الفلسطينية والعربية"],
    overview: "ملحمة عاطفية وإنسانية مقتبسة تسلط الضوء على ذاكرة الأجيال والارتباط الوثيق بالأرض والهوية وسط التحولات الكبرى.",
    searchQuery: "All That's Left of You"
  },
  {
    code: "i5uwg1g3vxji",
    rawTitle: "Alsajin El Ankaboot 2023 1080p WEB-DL AKWAM",
    title: "فيلم السجين العنكبوت (2023)",
    year: "2023",
    duration: "ساعة و 38 دقيقة",
    genre: "رعب نفسي • غموض وتشويق",
    subGenre: "thriller",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.3",
    actors: ["طاقم الإثارة والرعب"],
    overview: "سجين محتجز في زنزانة معزولة يكتشف شبكة ألغاز مميتة تدور حول كائنات وكوابيس تهدد بقاءه على قيد الحياة.",
    searchQuery: "The Spider Prisoner"
  },
  {
    code: "n99qrezzsq4p",
    rawTitle: "Alzarfah Escape From Hanhounia Hell 2025 WEB-DL AKWAM",
    title: "فيلم الزرافة: الهروب من جحيم حنحونية (2025)",
    year: "2025",
    duration: "ساعة و 40 دقيقة",
    genre: "كوميديا فانتزيا • مغامرات شبابية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["أبطال الستاند آب كوميدي والمغامرات"],
    overview: "مغامرة استثنائية مليئة بالضحك والأكشن في الهروب من جزيرة خيالية غامضة مليئة بالمفاجآت العجيبة.",
    searchQuery: "Alzarfah"
  },
  {
    code: "i3m5izm82fph",
    rawTitle: "Ana La Habibi 2023 1080p WEB-DL AKWAM",
    title: "فيلم أنا لحبيبي (2023) Ana La Habibi",
    year: "2023",
    duration: "ساعة و 45 دقيقة",
    genre: "رومانسي • دراما مشاعر • سينما مصرية",
    subGenre: "romance",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["كريم فهمي", "ياسمين رئيس", "سوسن بدر", "محمد الشرنوبي"],
    overview: "قصة حب ملهمة تجمع بين كاتب روائي وفتاة جميلة، يواجهان رفض والدتها الصارم ويسافران في رحلة للتمسك بأملهما الأخير.",
    searchQuery: "Ana La Habibi 2023"
  },
  {
    code: "i6wnw6kw09ma",
    rawTitle: "Anistoona 1080p WEB-DL AKWAM",
    title: "فيلم أنستونا (2024) Anistoona",
    year: "2024",
    duration: "ساعتين",
    genre: "كوميدي استعراضي • غنائي ومسرحي",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["دنيا سمير غانم", "بيومي فؤاد", "كريم عفيفي", "سامي مغاوري"],
    overview: "فتاة من حارة شعبية تحلم باحتراف الغناء والاستعراض، تتاح لها الفرصة عندما يكتشفها منتج فني لتبدأ رحلة تحقيق الحلم المبهج.",
    searchQuery: "Anistoona"
  },
  {
    code: "p7q7ao1mmzoi",
    rawTitle: "Asad 2026 1080p-AKWAM",
    title: "فيلم أسد (2026) Asad",
    year: "2026",
    duration: "ساعتين و 15 دقيقة",
    genre: "ملحمي تاريخي • أكشن وثورة • سينما مصرية",
    subGenre: "action",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.8",
    actors: ["محمد رمضان", "ماجد الكدواني", "خالد الصاوي", "شريف سلامة", "رزان جمال"],
    overview: "ملحمة تاريخية مشتعلة تدور أحداثها إبان ثورة الزنج والمقاومة الشعبية، حيث يقود بطل أسطوري تمرداً حاسماً ضد الاستبداد والظلم.",
    searchQuery: "Asad 2026"
  },
  {
    code: "qu9dd9w5qc4h",
    rawTitle: "Awlad Hareem Karim 2023 1080p WEB-DL AKWAM",
    title: "فيلم أولاد حريم كريم (2023)",
    year: "2023",
    duration: "ساعة و 55 دقيقة",
    genre: "كوميديا رومانسية • عائلي • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["مصطفى قمر", "داليا البحيري", "بشرى", "علا غانم", "تيام قمر"],
    overview: "بعد مرور سنوات طويلة على قصة الحب الأولى، تتشابك خيوط القدر بين أبناء وبنات الأصدقاء القدامى في مواقف تجمع بين الحنين والضحك.",
    searchQuery: "Awlad Hareem Karim 2023"
  },
  {
    code: "8j429d1b3tt1",
    rawTitle: "Bath Mobasher 2017 1080p HDTV AKWAM",
    title: "فيلم بث مباشر (2017) Bath Mobasher",
    year: "2017",
    duration: "ساعة و 40 دقيقة",
    genre: "كوميديا • إثارة وجريمة • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.5",
    actors: ["سامح حسين", "سامية طرابلسي", "محسن منصور", "طاهر أبو ليلة"],
    overview: "ضابط شرطة موقوف عن العمل يجد نفسه في خضم ليلة عصيبة تنقل عبر بث مباشر على مواقع التواصل لكشف شبكات فساد خطيرة.",
    searchQuery: "Bath Mobasher 2017"
  },
  {
    code: "3r00obzy9di2",
    rawTitle: "Bershama 1080p WEB-DL AKWAM",
    title: "فيلم برشامة (2025) Bershama",
    year: "2025",
    duration: "ساعة و 45 دقيقة",
    genre: "كوميديا شبابية • مدرسية واجتماعية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["طه دسوقي", "عصام عمر", "رانيا يوسف"],
    overview: "مفارقات وقصص كوميدية عن ظاهرة الغش في الامتحانات الثانوية وتحديات الجيل الجديد في أجواء مليئة بالضحك والأفكار المبتكرة.",
    searchQuery: "Bershama"
  },
  {
    code: "6gr96ihgwyr3",
    rawTitle: "Bogeyman 2024 1080p WEB-DL AKWAM",
    title: "فيلم البعبع (2023) Bogeyman",
    year: "2023",
    duration: "ساعة و 48 دقيقة",
    genre: "أكشن • كوميديا وتشويق • سينما مصرية",
    subGenre: "action",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["أمير كرارة", "ياسمين صبري", "باسم سمرة", "محمد أنور", "محمد عبد الرحمن"],
    overview: "مجرم تائب يقرر التخلي عن حياة الجريمة ليفاجأ في يوم خروجه من السجن بأنه أب لطفلين، ويجد نفسه في مطاردة صاخبة لحمايتهم.",
    searchQuery: "El Bo3bo3 2023"
  },
  {
    code: "4n67b3fhyv79",
    rawTitle: "Colonya 2025 1080p",
    title: "فيلم كولونيا (2025) Colonya",
    year: "2025",
    duration: "ساعة و 50 دقيقة",
    genre: "دراما نفسية • تشويق وغموض",
    subGenre: "drama",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["أحمد مالك", "كامل الباشا", "ميان السيد"],
    overview: "دراما سينمائية راقية تتناول صراع الهوية والذكريات والروابط العائلية الغائبة من خلال لقاء مؤثر بين أب وابنه بعد غياب طويل.",
    searchQuery: "Colonya 2025"
  },
  {
    code: "6bwiyer6oysu",
    rawTitle: "Da Sot Eh Da 2026 WEB-DL AKWAM",
    title: "فيلم ده صوت إيه ده (2026)",
    year: "2026",
    duration: "ساعة و 38 دقيقة",
    genre: "رعب • غموض وإثارة صوتية",
    subGenre: "horror",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["نجوم الرعب والتشويق العربي"],
    overview: "ترددات وأصوات غريبة تلتقطها أجهزة راديو قديمة في بلدة نائية تفتح بوابة لكوابيس غير مألوفة.",
    searchQuery: "Da Sot Eh Da"
  },
  {
    code: "vqw3aqi9yfue",
    rawTitle: "Darweesh 1080p WEB-DL AKWAM",
    title: "فيلم درويش (2025) Darweesh",
    year: "2025",
    duration: "ساعتين و 5 دقائق",
    genre: "أكشن تاريخي • كوميديا وتشويق",
    subGenre: "action",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.4",
    actors: ["عمرو يوسف", "دينا الشربيني", "محمد ممدوح", "تارا عماد"],
    overview: "في أربعينيات القرن الماضي، بطل شعبي ومحتال كاريزماتي يخوض معارك ملحمية ضد الاحتلال وخصومه في أجواء أسطورية.",
    searchQuery: "Darweesh 2025"
  },
  {
    code: "fz7cnzo6cj9i",
    rawTitle: "Daye (Seerat Ahl El Daye) 2025 1080p WEB-DL AKWAM 1",
    title: "فيلم ضي: سيرة أهل الضي (2025) - سيرفر 1",
    year: "2025",
    duration: "ساعتين",
    genre: "دراما موسيقية • سيرة إنسانية ملهمة",
    subGenre: "drama",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.5",
    actors: ["أسيل عمران", "إسلام مبارك", "حنين تركستاني"],
    overview: "رحلة طفل نوبي يمتلك صوتاً شجياً يسافر مع عائلته لتحقيق حلمه في عالم الموسيقى والغناء متجاوزاً كل التحديات.",
    searchQuery: "Daye Seerat Ahl El Daye"
  },
  {
    code: "5lza22yfg1va",
    rawTitle: "Daye (Seerat Ahl El Daye) 2025 1080p WEB-DL AKWAM 2",
    title: "فيلم ضي: سيرة أهل الضي (2025) - سيرفر 2",
    year: "2025",
    duration: "ساعتين",
    genre: "دراما موسيقية • سيرة إنسانية ملهمة",
    subGenre: "drama",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.5",
    actors: ["أسيل عمران", "إسلام مبارك", "حنين تركستاني"],
    overview: "النسخة البديلة فائقة السرعة لفيلم ضي: سيرة أهل الضي، دراما غنائية ساحرة عن الأمل والموهبة النقية.",
    searchQuery: "Daye Seerat Ahl El Daye"
  },
  {
    code: "kxoae2ufq6yb",
    rawTitle: "Derwila 2024 1080p 720p WEB-DL AKWAM 1",
    title: "فيلم درويلة (2024) Derwila - سيرفر 1",
    year: "2024",
    duration: "ساعة و 45 دقيقة",
    genre: "أكشن • تشويق وجريمة • سينما مصرية",
    subGenre: "action",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["عمرو عبد الجليل", "محمود عبد المغني", "أيتن عامر", "محمد علي رزق"],
    overview: "صراع شرس يشتعل في كواليس عالم المراهنات والنوادي الليلية بين أطراف تسعى للسيطرة وفرض نفوذها بالقوة والحيلة.",
    searchQuery: "Derwila 2024"
  },
  {
    code: "rrx8p869w9ax",
    rawTitle: "Derwila 2024 1080p WEB-DL AKWAM 2",
    title: "فيلم درويلة (2024) Derwila - سيرفر 2",
    year: "2024",
    duration: "ساعة و 45 دقيقة",
    genre: "أكشن • تشويق وجريمة • سينما مصرية",
    subGenre: "action",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["عمرو عبد الجليل", "محمود عبد المغني", "أيتن عامر"],
    overview: "سيرفر بديل مباشر لمشاهدة فيلم درويلة بأعلى جودة وصوت محيطي.",
    searchQuery: "Derwila 2024"
  },
  {
    code: "dd09dp2jodr3",
    rawTitle: "EgyBest 2026 CAM-720p",
    title: "فيلم إيجي بست (2026) EgyBest",
    year: "2026",
    duration: "ساعة و 35 دقيقة",
    genre: "كوميديا ساخرة • مغامرات إنترنت",
    subGenre: "comedy",
    origin: "arabic",
    quality: "720p HD",
    rating: "7.5",
    actors: ["نخبة صناع المحتوى والكوميديا"],
    overview: "كوميديا ذكية تتناول كواليس مواقع القرصنة وعوالم التحميل المجاني للأفلام وحروب السيرفرات في إطار ساخر وممتع.",
    searchQuery: "EgyBest"
  },
  {
    code: "6gu0f47l8puu",
    rawTitle: "El Ameel Sefr 2023 1080P WEB-DL AKWAM",
    title: "فيلم العميل صفر (2023) El Ameel Sefr",
    year: "2023",
    duration: "ساعة و 55 دقيقة",
    genre: "كوميديا • تجسس وأكشن • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["أكرم حسني", "بيومي فؤاد", "أسماء أبو اليزيد", "مصطفى غريب"],
    overview: "فرد أمن فاشل يتوهم أنه جيمس بوند المصري ويورط نفسه في حماية شخصيات دبلوماسية رفيعة في سلسلة من الكوارث الكوميدية.",
    searchQuery: "El Ameel Sefr 2023"
  },
  {
    code: "jwclv0wovi9q",
    rawTitle: "El Arafa We El Laana 2025 HD-720p",
    title: "فيلم العرافة واللعنة (2025)",
    year: "2025",
    duration: "ساعة و 40 دقيقة",
    genre: "رعب • غموض وتشويق شعبي",
    subGenre: "horror",
    origin: "arabic",
    quality: "720p HD",
    rating: "7.4",
    actors: ["نجوم الرعب والدراما"],
    overview: "نبوءة غامضة تصيب عائلة قديمة بلعنة متوارثة تبدأ في حصد أفرادها واحداً تلو الآخر حتى فك طلاسمها.",
    searchQuery: "El Arafa We El Laana"
  },
  {
    code: "juhe5m3ejmpm",
    rawTitle: "El Dashash 2025 1080p WEB-DL AKWAM",
    title: "فيلم الدشاش (2025) El Dashash",
    year: "2025",
    duration: "ساعتين و 5 دقائق",
    genre: "أكشن • كوميديا وتشويق • سينما مصرية",
    subGenre: "action",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.4",
    actors: ["محمد سعد", "زينة", "باسم سمرة", "نسرين طافش", "خالد الصاوي"],
    overview: "عودة قوية للكوميديان محمد سعد في ثوب جديد يجمع بين الدراما الإنسانية ومطاردات الأكشن والضحك المتواصل.",
    searchQuery: "El Dashash 2025"
  },
  {
    code: "x5vfgo7ylswq",
    rawTitle: "El Eskandrany 2024 1080P WEB-DL AKWAM",
    title: "فيلم الإسكندراني (2024) El Eskandrany",
    year: "2024",
    duration: "ساعتين و 10 دقائق",
    genre: "أكشن • دراما وصراع حارات • سينما مصرية",
    subGenre: "action",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["أحمد العوضي", "زينة", "بيومي فؤاد", "حسين فهمي", "صلاح عبد الله"],
    overview: "من روائع أسامة أنور عكاشة والمخرج خالد يوسف؛ يعود بكر الإسكندراني بعد سنوات غربة ليجد مدينته وقلب حبيبته في قبضة خصمه.",
    searchQuery: "El Eskandrany 2024"
  },
  {
    code: "3rzqe6szq2r1",
    rawTitle: "El Hana Elly Ana Feeh 1080p WEB-DL AKWAM",
    title: "فيلم الهنا اللي أنا فيه (2024) El Hana Elly Ana Feeh",
    year: "2024",
    duration: "ساعة و 48 دقيقة",
    genre: "كوميديا اجتماعية • رومانسية • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["كريم محمود عبد العزيز", "دينا الشربيني", "ياسمين رئيس", "حاتم صلاح"],
    overview: "زوجة تقرر فجأة تزويج زوجها لصديقتها المقربة لإنقاذهما من الروتين، فتنقلب حياتهم رأساً على عقب في مفارقات عائلية كوميدية.",
    searchQuery: "El Hana Elly Ana Feeh"
  },
  {
    code: "7r1t4rh4vb0s",
    rawTitle: "El Hawa Sotan 1080p AKWAM",
    title: "فيلم الهوى سلطان (2024) El Hawa Sotan",
    year: "2024",
    duration: "ساعة و 52 دقيقة",
    genre: "رومانسي • دراما مشاعر • سينما مصرية",
    subGenre: "romance",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.5",
    actors: ["أحمد داود", "منة شلبي", "أحمد خالد صالح", "جيهان الشماشرجي"],
    overview: "صداقة طفولة عميقة وجميلة تجمع بين علي وسارة تتحول تدريجياً وبدون مقدمات إلى مشاعر حب جارفة تواجه خيارات الحياة الصعبة.",
    searchQuery: "El Hawa Sotan 2024"
  },
  {
    code: "jlr398sm0ujd",
    rawTitle: "El Qesas 1080p 1",
    title: "فيلم القصاص (2025) El Qesas - سيرفر 1",
    year: "2025",
    duration: "ساعة و 50 دقيقة",
    genre: "أكشن • انتقام وتشويق",
    subGenre: "action",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["نجوم الأكشن والإثارة"],
    overview: "رحلة انتقام دموية لا هوادة فيها ينفذها مقاتل سابق ضد شبكة فساد مسلحة استهدفت عائلته.",
    searchQuery: "El Qesas"
  },
  {
    code: "vsknvzvhpcrd",
    rawTitle: "El Qesas 1080p 2",
    title: "فيلم القصاص (2025) El Qesas - سيرفر 2",
    year: "2025",
    duration: "ساعة و 50 دقيقة",
    genre: "أكشن • انتقام وتشويق",
    subGenre: "action",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["نجوم الأكشن والإثارة"],
    overview: "سيرفر بديل لفيلم القصاص بجودة نقية ومشاهدة مستمرة.",
    searchQuery: "El Qesas"
  },
  {
    code: "90d2bb0tkuft",
    rawTitle: "El Selem W El Thoban Leab Eyal 1080p WEB-DL AKWAM",
    title: "فيلم السلم والتعبان: لعب عيال (2025)",
    year: "2025",
    duration: "ساعة و 58 دقيقة",
    genre: "رومانسي • دراما العلاقات الحديثة",
    subGenre: "romance",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["نخبة من نجوم الرومانسية المعاصرة"],
    overview: "قراءة معاصرة لتقلبات الحب والعلاقات المعقدة وتحديات الارتباط في العصر الرقمي الحديث.",
    searchQuery: "El Selem W El Thoban"
  },
  {
    code: "is6rfdj0y7zg",
    rawTitle: "El Set 720p WEB-DL AKWAM",
    title: "فيلم الست (2025) El Set",
    year: "2025",
    duration: "ساعتين و 15 دقيقة",
    genre: "سيرة ذاتية • دراما تاريخية وموسيقى",
    subGenre: "drama",
    origin: "arabic",
    quality: "720p HD",
    rating: "8.7",
    actors: ["منى زكي", "أحمد حلمي", "عمرو سعد", "سيد رجب"],
    overview: "سيرة كوكب الشرق أم كلثوم وتفاصيل صعودها الأسطوري من قرية طماي الزهايرة لتصبح أيقونة الغناء العربي الخالدة.",
    searchQuery: "El Set Mona Zaki"
  },
  {
    code: "hhx4ydxk10pw",
    rawTitle: "El Shater 1080 WEB-DL AKWAM",
    title: "فيلم الشاطر (2025) El Shater",
    year: "2025",
    duration: "ساعتين",
    genre: "أكشن • كوميديا وسينما مصرية",
    subGenre: "action",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["أمير كرارة", "هنا الزاهد", "عادل كرم", "مصطفى غريب"],
    overview: "دوبلير محترف يخوض مغامرة العمر عندما يتم توريطه في قضية دولية تتطلب مهاراته البدنية وخفة ظله للبقاء على قيد الحياة.",
    searchQuery: "El Shater Amir Karara"
  },
  {
    code: "6usa64n98wjc",
    rawTitle: "El-Harreefa 2024 1080P WEB-DL AKWAM",
    title: "فيلم الحريفة (2024) El-Harreefa",
    year: "2024",
    duration: "ساعة و 50 دقيقة",
    genre: "شبابي • كرة قدم وكوميديا • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.4",
    actors: ["نور النبوي", "أحمد حسام ميدو", "كزبرة", "خالد الذهبي", "سليم الترك"],
    overview: "ماجد لاعب كرة القدم الموهوب يُجبر على ترك مدرسته الدولية والانتقال إلى مدرسة حكومية ليكوّن فريق كرة قدم ينافس في بطولة كبرى.",
    searchQuery: "El Harreefa 2024"
  },
  {
    code: "jtgrpgqum33s",
    rawTitle: "El7arifa Akwam",
    title: "فيلم الحريفة: الريمونتادا (2025) El Harreefa 2",
    year: "2025",
    duration: "ساعتين",
    genre: "رياضي • شبابي وكوميديا • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["نور النبوي", "أحمد غزي", "كزبرة", "نور إيهاب", "آسر ياسين"],
    overview: "يخوض فريق الحريفة مرحلة الجامعة والتنافس على بطولة دولية كبرى وسط مواقف وتحديات شخصية تثبت قوتهم وعزيمتهم.",
    searchQuery: "El Harreefa 2 Remontada"
  },
  {
    code: "kcejg7cakur6",
    rawTitle: "En Ghab El Kot 2025 1080p",
    title: "فيلم إن غاب القط (2025) En Ghab El Kot",
    year: "2025",
    duration: "ساعة و 48 دقيقة",
    genre: "كوميديا رومانسية • تشويق • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["آسر ياسين", "أسماء جلال", "محمد شاهين", "علي صبحي"],
    overview: "صراعات كوميدية لطيفة وتوترات زوجية تتفجر خلال عطلة صيفية غريبة تكشف مفاجآت لم تكن في الحسبان.",
    searchQuery: "En Ghab El Kot"
  },
  {
    code: "efkw5o80n5g6",
    rawTitle: "Esaaf 2025 1080p NF WEB-DL AKWAM",
    title: "فيلم إسعاف (2025) Esaaf",
    year: "2025",
    duration: "ساعة و 40 دقيقة",
    genre: "كوميديا • مغامرات وأكشن • سينما سعودية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.9",
    actors: ["إبراهيم الحجاج", "محمد القحطاني", "فاطمة الشريف"],
    overview: "مسعفان يقعان في ورطة العمر أثناء نقلهما مريضاً خطيراً تلاحقه عصابة دولية في شوارع الرياض.",
    searchQuery: "Esaaf 2025"
  },
  {
    code: "5s3sdgz5a159",
    rawTitle: "Face to Face 2023 1080p WEB-DL AKWAM",
    title: "فيلم وش في وش (2023) Face to Face",
    year: "2023",
    duration: "ساعة و 55 دقيقة",
    genre: "كوميديا عائلية • دراما اجتماعية • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.5",
    actors: ["محمد ممدوح", "أمينة خليل", "أحمد خالد صالح", "بيومي فؤاد", "أنوشكا"],
    overview: "عائلتا الزوجين تحتجزان معاً داخل شقة واحدة بسبب عطل مفاجئ في باب الشقة، لتشتعل المشادات الكوميدية العائلية الساخنة.",
    searchQuery: "Wesh Fe Wesh 2023"
  },
  {
    code: "j6c67yd7i2o4",
    rawTitle: "Fakhr Al Suwaidi 720p WEB-DL AKWAM",
    title: "فيلم فخر السويدي (2024)",
    year: "2024",
    duration: "ساعة و 35 دقيقة",
    genre: "كوميديا • اجتماعي • سينما إماراتية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "720p HD",
    rating: "7.6",
    actors: ["نجوم الكوميديا الإماراتية والخليجية"],
    overview: "مواقف طريفة ومفارقات تراثية معاصرة يعيشها بطل القصة محاولاً إثبات جدارته لعائلته ومجتمعه.",
    searchQuery: "Fakhr Al Suwaidi"
  },
  {
    code: "guirl2ewhmpv",
    rawTitle: "Family Business 2026 WEB-DL AKWAM",
    title: "فيلم شغل عائلي (2026) Family Business",
    year: "2026",
    duration: "ساعة و 45 دقيقة",
    genre: "كوميديا • دراما عائلية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["نخبة من نجوم الكوميديا العربية"],
    overview: "خلافات عائلية ممتعة حول شركة ورثها الإخوة تضعهم أمام اختبار حقيقي للوفاء والتضامن.",
    searchQuery: "Family Business"
  },
  {
    code: "3rkw2mj2ehtp",
    rawTitle: "Feeha Eh Yaani 2025 1080p WEB-DL AKWAM",
    title: "فيلم فيها إيه يعني (2025) Feeha Eh Yaani",
    year: "2025",
    duration: "ساعة و 50 دقيقة",
    genre: "كوميديا رومانسية • اجتماعي • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["ماجد الكدواني", "غادة عادل", "أسماء جلال", "ميمي جمال"],
    overview: "قصة حب غير مألوفة تنشأ بين شخصين في خريف العمر، وتتحدى التقاليد العائلية في إطار من البهجة وخفة الظل.",
    searchQuery: "Feeha Eh Yaani"
  },
  {
    code: "8w5a7k1w9y1q",
    rawTitle: "Five Rounds 720p WEB-DL AKWAM",
    title: "فيلم خمس جولات (2023) Five Rounds",
    year: "2023",
    duration: "ساعة و 52 دقيقة",
    genre: "رياضي • أكشن وشبابي • سينما مصرية",
    subGenre: "action",
    origin: "arabic",
    quality: "720p HD",
    rating: "7.7",
    actors: ["آدم شرقاوي", "نور النبوي", "ماجد المصري", "عايدة الأيوبي", "داليا شوقي"],
    overview: "شاب مصري يعشق الفنون القتالية المختلطة MMA وموسيقى الراب، يقاتل داخل الحلبة وخارجها لإثبات ذاته أمام مدربه المتشدد.",
    searchQuery: "5 Rounds 2023"
  },
  {
    code: "a1ugu9ecvb1z",
    rawTitle: "From The Ashes The Pit 2026 1080p WEB-DL AKWAM",
    title: "فيلم من رماد: الحفرة (2026) From The Ashes: The Pit",
    year: "2026",
    duration: "ساعة و 48 دقيقة",
    genre: "رعب نفسي • تشويق وغموض • سينما سعودية",
    subGenre: "thriller",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["شيماء الطيب", "خيرية أبو لبن", "أضوى فهد"],
    overview: "الجزء الثاني المترقب لسلسلة الرعب والإثارة السعودية حيث تواجه طالبات المدرسة كوابيس الماضي الدفينة في أعماق الحفرة.",
    searchQuery: "From The Ashes The Pit"
  },
  {
    code: "lee0zqxe9blo",
    rawTitle: "Gergasha The Movie 720p WEB-DL AKWAM",
    title: "فيلم قرقاشة (2024) Gergasha",
    year: "2024",
    duration: "ساعة و 35 دقيقة",
    genre: "كوميديا • مغامرات خليجية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "720p HD",
    rating: "7.4",
    actors: ["لولوة الملا", "مبارك المانع", "عبد العزيز النصار"],
    overview: "مغامرات طريفة ومقالب لا تنتهي تقودها بطلة العمل في شوارع الكويت بحثاً عن كنز مفقود.",
    searchQuery: "Gergasha"
  },
  {
    code: "21iceyftyjbk",
    rawTitle: "Ghomeda 1080p WEB-DL AKWAM",
    title: "فيلم غميضة (2025) Ghomeda",
    year: "2025",
    duration: "ساعة و 40 دقيقة",
    genre: "رعب • غموض وتشويق",
    subGenre: "horror",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.5",
    actors: ["طاقم الإثارة العربي"],
    overview: "لعبة طفولية تقليدية تتحول داخل منزل أثري مهجور إلى كابوس مرعب يحاصر المشاركين.",
    searchQuery: "Ghomeda"
  },
  {
    code: "1vqb48s45heb",
    rawTitle: "Groom and Two Brides 2025 1080p WEB-DL AKWAM",
    title: "فيلم عريس وعروستين (2025)",
    year: "2025",
    duration: "ساعة و 45 دقيقة",
    genre: "كوميديا رومانسية • مواقف ساخرة",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["نخبة من نجوم الكوميديا الرومانسية"],
    overview: "مأزق غير متوقع يجد فيه الشاب نفسه ملزماً بالزواج من فتاتين في ليلة واحدة وسط اشتراطات عائلية مضحكة.",
    searchQuery: "Groom and Two Brides"
  },
  {
    code: "g7samirm7931",
    rawTitle: "Hepta 2 1080p WEB-DL AKWAM",
    title: "فيلم هيبتا: المناظرة الأخيرة (2025) Hepta 2",
    year: "2025",
    duration: "ساعتين و 8 دقائق",
    genre: "رومانسي • دراما فلسفية ومشاعر • سينما مصرية",
    subGenre: "romance",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.6",
    actors: ["منة شلبي", "كريم فهمي", "سلمى أبو ضيف", "كريم قاسم", "أسماء جلال"],
    overview: "الجزء الثاني من رائعة هيبتا؛ مناظرة حية جديدة تستكشف مراحل الحب السبع في العصر الرقمي وتداعيات الانفصال والارتباط.",
    searchQuery: "Hepta 2"
  },
  {
    code: "866e1qv0afv2",
    rawTitle: "Hobal 1080p WEB-DL AKWAM",
    title: "فيلم هوبال (2024) Hobal",
    year: "2024",
    duration: "ساعة و 55 دقيقة",
    genre: "دراما صحراوية • تشويق وغموض • سينما سعودية",
    subGenre: "drama",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["إبراهيم الحساوي", "مشعل المطيري", "ميلا الزهراني"],
    overview: "في عزلة الصحراء القاسية في تسعينيات القرن الماضي، عائلة بدوية معزولة تواجه اختبارات الموت والخوف والبقاء على قيد الحياة.",
    searchQuery: "Hobal 2024"
  },
  {
    code: "y2aig14kbvdd",
    rawTitle: "In Broad Daylight 2025 WEB-DL AKWAM",
    title: "فيلم في وضح النهار (2025) In Broad Daylight",
    year: "2025",
    duration: "ساعتين",
    genre: "تشويق وإثارة • مافيا وجريمة",
    subGenre: "crime",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["مينا مسعود", "إيمان العاصي", "شيرين رضا", "إيهاب فهمي"],
    overview: "شاب يعيش بالخارج يعود إلى مصر ليفاجأ بتورطه في شبكة مافيا دولية تدير عمليات تبييض أموال خطيرة في وضح النهار.",
    searchQuery: "Fe Wadah El Nahar Mina Massoud"
  },
  {
    code: "xiz9ojxjqqgh",
    rawTitle: "Joy Awards S2026 WEB-DL AKWAM",
    title: "حفل جوائز صناع الترفيه Joy Awards (2026)",
    year: "2026",
    duration: "3 ساعات و 30 دقيقة",
    genre: "سهرة النجوم • تكريم السينما والموسيقى • بث حصري",
    subGenre: "event",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.9",
    actors: ["كبار نجوم الفن والسينما العرب والعالميين"],
    overview: "السهرة الأضخم في العالم العربي من موسم الرياض لتكريم ألمع نجوم السينما والتلفزيون والموسيقى والرياضة مع عروض عالمية حية.",
    searchQuery: "Joy Awards 2026"
  },
  {
    code: "ni5bqzjdbfqv",
    rawTitle: "Kamla 2022 1080p WEB-DL AKWAM",
    title: "فيلم كاملة (2022) Kamla",
    year: "2022",
    duration: "ساعة و 40 دقيقة",
    genre: "دراما إنسانية • قضايا المرأة • سينما مصرية",
    subGenre: "drama",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["إنجي المقدم", "مي الغيطي", "فراس سعيد", "لطفي لبيب"],
    overview: "طبيبة نفسية تخوض معركة ضد النظرة المجتمعية القاصرة تجاه المرأة غير المتزوجة بينما تساعد شابة تعاني من اضطرابات نفسية حادة.",
    searchQuery: "Kamla 2022"
  },
  {
    code: "habefhmbtqnt",
    rawTitle: "Laylet El Eid 1080p WEB-DL AKWAM",
    title: "فيلم ليلة العيد (2024) Laylet El Eid",
    year: "2024",
    duration: "ساعة و 45 دقيقة",
    genre: "دراما اجتماعية • قضايا المرأة • سينما مصرية",
    subGenre: "drama",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["يسرا", "ريهام عبد الغفور", "يسرا اللوزي", "عبير صبري", "نجلاء بدر"],
    overview: "تتناول أحداث الفيلم في ليلة واحدة عشية عيد الفطر قضايا القهر والمعاناة التي تتعرض لها النساء في جزيرة شعبية على النيل.",
    searchQuery: "Laylet El Eid 2024"
  },
  {
    code: "1v24i1vf9ikh",
    rawTitle: "Leh Teeshha Lewahdak 2024 1080P WEB-DL AKWAM",
    title: "فيلم ليه تعيشها لوحدك (2024)",
    year: "2024",
    duration: "ساعة و 50 دقيقة",
    genre: "دراما إنسانية • موسيقى ومشاعر • سينما مصرية",
    subGenre: "drama",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.9",
    actors: ["شريف منير", "خالد الصاوي", "سلمى أبو ضيف", "محمد رضوان"],
    overview: "صداقة عميقة تجمع طبيباً وعازف موسيقى شهيراً يمران بأزمات مرضية وصدمات عاطفية تجعلهما يعيدان اكتشاف معنى الحياة.",
    searchQuery: "Leh Teeshha Lewahdak 2024"
  },
  {
    code: "gi4f4846kkwe",
    rawTitle: "Love With Its Details 2023 1080p WEB-DL AKWAM",
    title: "فيلم الحب بتفاصيله (2023)",
    year: "2023",
    duration: "ساعة و 42 دقيقة",
    genre: "رومانسي كوميدي • غنائي • سينما مصرية",
    subGenre: "romance",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.4",
    actors: ["محمد نور", "ملك قورة", "مصطفى أبو سريع", "علاء مرسي"],
    overview: "شاب ثري يعيش حياة مستهترة يعود إلى وطنه ويقع في غرام فتاة ملتزمة، فيحاول تغيير نمط حياته بالكامل لنيل رضاها.",
    searchQuery: "Love With Its Details 2023"
  },
  {
    code: "gbyyn0e7rr98",
    rawTitle: "Marei El Brimo 2023 1080P WEB-DL AKWAM",
    title: "فيلم مرعي البريمو (2023) Marei El Brimo",
    year: "2023",
    duration: "ساعة و 45 دقيقة",
    genre: "كوميديا شعبية • مغامرات • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["محمد هنيدي", "غادة عادل", "علاء مرسي", "مصطفى أبو سريع", "أحمد بدير"],
    overview: "تاجر بطيخ صعيدي شهير يخفي ألماسات ثمينة داخل بطيخة ويضيعها بالخطأ، ليبدأ رحلة بحث كوميدية مجنونة في شتى المحافظات.",
    searchQuery: "Marei El Brimo 2023"
  },
  {
    code: "qozch95eicj7",
    rawTitle: "Meen Yesaddaq 1080p WEB-DL AKWAM",
    title: "فيلم مين يصدق (2024) Meen Yesaddaq",
    year: "2024",
    duration: "ساعة و 50 دقيقة",
    genre: "دراما رومانسية • تشويق وجريمة • سينما مصرية",
    subGenre: "drama",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["يوسف عثمان", "جيدا منصور", "أشرف عبد الباقي", "شريف منير"],
    overview: "فتاة ثرية تهرب من إهمال عائلتها وتتعرف على شاب نصاب محترف لتبدأ معه رحلة عمليات احتيال معقدة تتطور إلى قصة حب خطيرة.",
    searchQuery: "Meen Yesaddaq 2024"
  },
  {
    code: "wnagpb6q1hwl",
    rawTitle: "Migration 2023 1080P WEB-DL AKWAM",
    title: "فيلم رحلة بطة (2023) Migration مدبلج للعربية",
    year: "2023",
    duration: "ساعة و 23 دقيقة",
    genre: "رسوم متحركة • مغامرات وكوميديا عائلية • أنمي",
    subGenre: "animation",
    category: "anime",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["كوميل نانجياني", "إليزابيث بانكس", "أوكوافينا", "طاقم الدبلجة العربية"],
    overview: "عائلة بط تعيش في بركة هادئة بنيوانجلاند تقرر كسر الروتين وخوض رحلة هجرة ملحمية عبر نيويورك نحو جامايكا المشمسة.",
    searchQuery: "Migration 2023"
  },
  {
    code: "wdlt9i7iz82o",
    rawTitle: "Mister X 2023 1080p WEB-DL AKWAM",
    title: "فيلم مستر إكس (2023) Mister X - نسخة 1",
    year: "2023",
    duration: "ساعة و 48 دقيقة",
    genre: "كوميديا • أكشن ومغامرات • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["أحمد فهمي", "هنا الزاهد", "محمد أنور", "بيومي فؤاد", "أوس أوس"],
    overview: "مستر إكس يؤسس منظمة سرية تساعد الرجال المظلومين على الانفصال عن زوجاتهم، حتى تعترض طريقه محامية طموحة تقلب خططه.",
    searchQuery: "Mr Ex 2023"
  },
  {
    code: "u826c28fwa0s",
    rawTitle: "Moana 2026 1080p WEBRip AR",
    title: "فيلم موانا 2 (2024) Moana 2 مدبلج للعربية",
    year: "2024",
    duration: "ساعة و 40 دقيقة",
    genre: "رسوم متحركة • مغامرات وسحر • ديزني مدبلج • أنمي",
    subGenre: "animation",
    category: "anime",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["أولي كرافالو", "دواين جونسون", "طاقم الدبلجة العربية الرسمية"],
    overview: "تتلقى موانا نداءً غير متوقع من أسلافها المستكشفين، فتنطلق رفقة ماوي وطاقم بحري جديد في رحلة جريئة إلى مياه أوقيانوسيا المنسية.",
    searchQuery: "Moana 2"
  },
  {
    code: "1u744c4cqg1k",
    rawTitle: "Mr Ex WEB-DL AKWAM",
    title: "فيلم مستر إكس (2023) Mister X - نسخة 2",
    year: "2023",
    duration: "ساعة و 48 دقيقة",
    genre: "كوميديا • أكشن ومغامرات • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["أحمد فهمي", "هنا الزاهد", "محمد أنور", "بيومي فؤاد"],
    overview: "سيرفر بديل مباشر لمشاهدة فيلم مستر إكس بأقصى سرعة تشغيل.",
    searchQuery: "Mr Ex 2023"
  },
  {
    code: "9xm8lkqbcp3a",
    rawTitle: "My Driver And I 2023 WEB-DL AKWAM",
    title: "فيلم سائقي وأنا (2023) My Driver And I",
    year: "2023",
    duration: "ساعة و 45 دقيقة",
    genre: "دراما إنسانية • ذكريات ومشاعر • سينما سعودية",
    subGenre: "drama",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.9",
    actors: ["أضوى فهد", "قصي خضر", "خيرية أبو لبن"],
    overview: "في جدة خلال الثمانينيات والتسعينيات، تنشأ صداقة استثنائية وطويلة الأمد بين فتاة سعودية متمردة وسائق عائلتها السوداني المخلص.",
    searchQuery: "My Driver And I 2023"
  },
  {
    code: "50f957cx4w1i",
    rawTitle: "Palastin 36 1080 WEB-DL AKWAM",
    title: "فيلم فلسطين 36 (2025) Palastin 36",
    year: "2025",
    duration: "ساعتين و 10 دقائق",
    genre: "وثائقي ملحمي • تاريخي وصمود • سينما عربية",
    subGenre: "documentary",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.9",
    actors: ["صناع السينما الوثائقية والشهود التاريخيون"],
    overview: "ملحمة وثائقية تاريخية تؤرخ لثورة فلسطين الكبرى عام 1936 وصمود الشعب الفلسطيني الأسطوري ضد الانتداب والتهجير.",
    searchQuery: "Palestine 36"
  },
  {
    code: "bdylb4a0tuc4",
    rawTitle: "Pension Dalal 1080p WEB-DL AKWAM",
    title: "فيلم بنسيون دلال (2024) Pension Dalal",
    year: "2024",
    duration: "ساعة و 48 دقيقة",
    genre: "كوميديا • غموض وتشويق • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["بيومي فؤاد", "عمر متولي", "محمود حافظ", "طاهر أبو ليلة"],
    overview: "أب يقرر بيع بنسيون يمتلكه دون علم أبنائه، بينما يخطط الأبناء لتحويله لمشروع آخر لتتصادم الخطط في يوم واحد حافل بالمفاجآت.",
    searchQuery: "Pension Dalal 2024"
  },
  {
    code: "ej4eekt3bth3",
    rawTitle: "Qashmoo 720p WEB-DL AKWAM",
    title: "فيلم قشموع (2024) Qashmoo",
    year: "2024",
    duration: "ساعة و 32 دقيقة",
    genre: "كوميديا • مغامرات شعبية • سينما خليجية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "720p HD",
    rating: "7.5",
    actors: ["نجوم الكوميديا الخليجية"],
    overview: "مغامرات طريفة لبطل شعبي يحاول التوفيق بين التقاليد الموروثة ومستجدات الحياة العصرية في إطار كوميدي.",
    searchQuery: "Qashmoo"
  },
  {
    code: "65i8rnha581y",
    rawTitle: "Qasr El Basha 1080p WEB-DL AKWAM",
    title: "فيلم قصر الباشا (2025) Qasr El Basha",
    year: "2025",
    duration: "ساعتين",
    genre: "غموض وتشويق • جريمة وأسرار • سينما مصرية",
    subGenre: "mystery",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["أحمد حاتم", "حسين فهمي", "مايان السيد", "صدقي صخر"],
    overview: "جريمة قتل غامضة تقع داخل قصر تاريخي مهيب، وخلال التحقيقات تتكشف أسرار مظلمة تدين جميع الحاضرين في القصر.",
    searchQuery: "Qasr El Basha"
  },
  {
    code: "xtvg7jvhcx5h",
    rawTitle: "Restart 2025 1080p WEB-DL AKWAM",
    title: "فيلم ريستارت (2025) Restart",
    year: "2025",
    duration: "ساعتين و 5 دقائق",
    genre: "كوميديا رومانسية • تشويق وغنائي • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.6",
    actors: ["تامر حسني", "هنا الزاهد", "باسم سمرة", "محمد ثروت", "عصام السقا"],
    overview: "مهندس تكنولوجيا شاب يبتكر تطبيقاً يعيد ترتيب حياة الناس من البداية، فيقع في غرام فتاة تغير كل حساباته العاطفية والمهنية.",
    searchQuery: "Restart Tamer Hosny 2025"
  },
  {
    code: "sf02ucp442h6",
    rawTitle: "Rocky El Ghalaba 1080 WEB-DL AKWAM",
    title: "فيلم روكي الغلابة (2025) Rocky El Ghalaba",
    year: "2025",
    duration: "ساعة و 55 دقيقة",
    genre: "كوميديا أكشن • حراسة خاصة • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.4",
    actors: ["دنيا سمير غانم", "محمد ممدوح", "محمد ثروت", "سلوى عثمان"],
    overview: "فتاة تمارس الملاكمة وتعمل حارسة خاصة لرجل أعمال مهم، لتجد نفسها في مواجهة عصابات خطيرة تضعها في مواقف كوميدية مثيرة.",
    searchQuery: "Rocky El Ghalaba"
  },
  {
    code: "xua31pvtawgk",
    rawTitle: "Sakr w Kanarya 2026 1080",
    title: "فيلم صقر وكناريا (2026) Sakr w Kanarya",
    year: "2026",
    duration: "ساعتين و 10 دقائق",
    genre: "أكشن كوميدي • تشويق ومطاردات • سينما مصرية",
    subGenre: "action",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.5",
    actors: ["أحمد عز", "ماجد الكدواني", "نيللي كريم"],
    overview: "ثنائي غير متوافق يضطران للتعاون معاً في مهمة مطاردة محفوفة بالمخاطر لإنقاذ وثائق سرية قبل وصول عصابة دولية إليها.",
    searchQuery: "Sakr w Kanarya"
  },
  {
    code: "j7et5wkjdjp6",
    rawTitle: "Sambosa Chapati 2025 1080p WEB-DL AKWAM",
    title: "فيلم سمبوسة جباتي (2025) Sambosa Chapati",
    year: "2025",
    duration: "ساعة و 35 دقيقة",
    genre: "كوميديا • عائلي خفيف • سينما خليجية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["نجوم الكوميديا الخليجية المعاصرة"],
    overview: "مفارقات طريفة وصراع مطاعم شعبي بين نكهات السمبوسة والجباتي في سوق تقليدي يتحول إلى سباق مليء بالضحك.",
    searchQuery: "Sambosa Chapati"
  },
  {
    code: "q04xu37muogx",
    rawTitle: "Seeking Haven For Mr Rambo 720p WEB-DL AKWAM",
    title: "فيلم البحث عن منفذ للسيد رامبو (2024)",
    year: "2024",
    duration: "ساعة و 42 دقيقة",
    genre: "دراما إنسانية • تشويق ومغامرة • مهرجان فينيسيا",
    subGenre: "drama",
    origin: "arabic",
    quality: "720p HD",
    rating: "8.4",
    actors: ["عصام عمر", "ركين سعد", "سماء إبراهيم", "أحمد بهاء"],
    overview: "حسن، شاب ثلاثيني بسيط يُجبر على خوض رحلة لإنقاذ كلبه الوفي رامبو بعدما يصبح مطارداً في شوارع القاهرة بسبب حادث دفاعي.",
    searchQuery: "Seeking Haven for Mr Rambo"
  },
  {
    code: "5flpv5k9m1dw",
    rawTitle: "Shabab El Bomb 2 2025 1080p WEB-DL AKWAM",
    title: "فيلم شباب البومب 2 (2025) Shabab El Bomb 2",
    year: "2025",
    duration: "ساعة و 45 دقيقة",
    genre: "كوميديا شبابية • مغامرات رقمية • سينما سعودية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["فيصل العيسى", "عبد العزيز برناوي", "محمد الدوسري", "سليمان المقيطيب"],
    overview: "مغامرة جديدة لأبطال شباب البومب عامر وأصدقائه في عالم الألعاب الإلكترونية والذكاء الاصطناعي مع مواقف تفجر الضحك.",
    searchQuery: "Shabab El Bomb 2"
  },
  {
    code: "9yst5lqpw1is",
    rawTitle: "Shahr Zii Aleasal 2024 1080P WEB-DL AKWAM",
    title: "فيلم شهر زي العسل (2024) Honeymoonish",
    year: "2024",
    duration: "ساعة و 40 دقيقة",
    genre: "كوميديا رومانسية • سياحة ومشاعر • سينما كويتية",
    subGenre: "romance",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["نور الغندور", "محمود بوشهري", "فاطمة الشطي", "مهدي برويز"],
    overview: "زواج صالونات سريع ينطلق به العروسان في شهر عسل بلبنان ليتضح أنهما نقيضان تماماً، فتشتعل المقالب والمفاجآت غير المتوقعة.",
    searchQuery: "Honeymoonish 2024"
  },
  {
    code: "lnsl97wfi26z",
    rawTitle: "Siwar 1080p WEB-DL AKWAM",
    title: "فيلم سوار (2025) Siwar",
    year: "2025",
    duration: "ساعة و 45 دقيقة",
    genre: "دراما وتشويق • صراع عائلي",
    subGenre: "drama",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["نجوم الدراما الخليجية والمصرية"],
    overview: "سوار ذهبي عتيق يتوارثه أفراد أسرة يحمل لغزاً دفيناً يشعل صراعاً طاحناً بين الأشقاء.",
    searchQuery: "Siwar"
  },
  {
    code: "xr3n6fom432l",
    rawTitle: "Sokkar Sababa Wa Habboub Al Kharziz 1080p WEB-DL AKWAM",
    title: "فيلم سكر صبابة وحبوب الخرزيز (2025)",
    year: "2025",
    duration: "ساعة و 40 دقيقة",
    genre: "كوميديا فلكلورية • مواقف شعبية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["طاقم الكوميديا الشعبية"],
    overview: "حكاية طريفة من عبق التراث الشعبي تجمع بين الغناء الكوميدي والمفارقات الاجتماعية الضاحكة.",
    searchQuery: "Sokkar Sababa"
  },
  {
    code: "b4wnj1slqef8",
    rawTitle: "Tal2 Sena3y 1080P HD",
    title: "فيلم طلق صناعي (2018) Tal2 Sena3y",
    year: "2018",
    duration: "ساعة و 35 دقيقة",
    genre: "كوميديا ساخرة • دراما سياسية • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["ماجد الكدواني", "حورية فرغلي", "مصطفى خاطر", "سيد رجب", "بيومي فؤاد"],
    overview: "زوجان مصريان يلجآن للسفارة الأمريكية بالقاهرة لتلد الزوجة هناك وتحصل توأمتها على الجنسية، فتتصاعد الأحداث باحتجاز رهائن كوميدي.",
    searchQuery: "Tal2 Sena3y 2018"
  },
  {
    code: "on38jxk41zde",
    rawTitle: "Tallaqni 2025 HD-720p",
    title: "فيلم طلقني (2025) Tallaqni",
    year: "2025",
    duration: "ساعة و 40 دقيقة",
    genre: "كوميديا اجتماعية • علاقات زوجية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "720p HD",
    rating: "7.7",
    actors: ["نجوم الكوميديا الاجتماعية المعاصرة"],
    overview: "معركة كوميدية ساخنة بين زوجين يحاول كل منهما دفع الآخر لطلب الطلاق لتجنب التزامات النفقة في مواقف طريفة.",
    searchQuery: "Tallaqni"
  },
  {
    code: "zvr27lgsp8a2",
    rawTitle: "The Burdened 2023 1080P WEB-DL AKWAM",
    title: "فيلم المرهقون (2023) The Burdened",
    year: "2023",
    duration: "ساعة و 31 دقيقة",
    genre: "دراما إنسانية واقعية • سينما يمنية • مهرجان برلين",
    subGenre: "drama",
    origin: "yemeni",
    quality: "1080p FHD",
    rating: "8.6",
    actors: ["خالد حمدان", "عبير محمد", "سماح العمراني", "إسلام مبارك"],
    overview: "تحفة المخرج عمرو جمال؛ مستوحى من أحداث حقيقية في عدن عام 2019 حول زوجين يمنيين يواجهان ظروفاً اقتصادية واجتماعية قاسية.",
    searchQuery: "The Burdened 2023"
  },
  {
    code: "3sy4lni2tyz7",
    rawTitle: "The Fakenapping 2025 1080p WEB-DL AKWAM",
    title: "فيلم الاختطاف المزيف (2025) The Fakenapping",
    year: "2025",
    duration: "ساعة و 44 دقيقة",
    genre: "كوميديا جريمة • مغامرات وتشويق",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["أبطال الكوميديا والجريمة الساخرة"],
    overview: "شاب يدبر خطة اختطاف وهمية لنفسه لابتزاز عائلته الثرية، لكن الخطة تسقط فجأة في يد عصابة حقيقية لا ترحم.",
    searchQuery: "The Fakenapping"
  },
  {
    code: "i44aihe5rrgy",
    rawTitle: "The Gang of El Max 1080p WEB-DL AKWAM",
    title: "فيلم عصابة الماكس (2024) The Gang of El Max",
    year: "2024",
    duration: "ساعة و 52 دقيقة",
    genre: "كوميديا أكشن • سرقة ومطاردات • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["أحمد فهمي", "روبي", "لبلبة", "أوس أوس", "حاتم صلاح", "محمد لطفي"],
    overview: "المكسيكي مجرم محترف ينفذ عمليات تهريب بمفرده، يضطر للاستعانة بعائلة وهمية لتنفيذ عملية كبرى فتتحول المهمة إلى فوضى عائلية مضحكة.",
    searchQuery: "The Gang of El Max 2024"
  },
  {
    code: "qwh9tyd03brk",
    rawTitle: "The Harouns 2023 1080p WEB-DL AKWAM",
    title: "فيلم آل هارون (2023) The Harouns",
    year: "2023",
    duration: "ساعة و 45 دقيقة",
    genre: "أكشن وتشويق • صراع مافيا • سينما مصرية",
    subGenre: "action",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["منذر رياحنة", "عبير صبري", "إيهاب فهمي", "أحمد وفيق"],
    overview: "صراع دموي يشتعل بين أفراد عصابة تتاجر بالآثار وتزييف العملات بعد اختفاء صفقة كبرى وتصاعد الشكوك والخيانة.",
    searchQuery: "Aal Haroun 2023"
  },
  {
    code: "xxgypa2fo6y3",
    rawTitle: "The Presidents Cake 2025 WEB-DL AKWAM",
    title: "فيلم كعكة الرئيس (2025) The President's Cake",
    year: "2025",
    duration: "ساعة و 48 دقيقة",
    genre: "كوميديا سوداء • دراما سياسية ساخرة",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["نخبة الدراما والكوميديا العربية"],
    overview: "طباخ بسيط يجد نفسه مكلفاً بإعداد كعكة عيد ميلاد رئيس الدولة وسط إجراءات أمنية وتدابير مشددة ومواقف لا تصدق.",
    searchQuery: "The President's Cake"
  },
  {
    code: "4pjm6j8ky7ne",
    rawTitle: "The Runner 2026 720p WEB-DL Arabic",
    title: "فيلم العداء (2026) The Runner مدبلج للعربية",
    year: "2026",
    duration: "ساعة و 40 دقيقة",
    genre: "أكشن • إثارة وسباق مع الزمن",
    subGenre: "action",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.8",
    actors: ["طاقم الأكشن العالمي والدبلجة العربية"],
    overview: "عداء سريع يُجبر على تنفيذ مهام تسليم سرية تحت تهديد الموت متسابقاً مع الزمن في شوارع المدينة المزدحمة.",
    searchQuery: "The Runner 2026"
  },
  {
    code: "5gykrxfimg10",
    rawTitle: "The System 2024 1080p WEB-DL AKWAM",
    title: "فيلم السيستم (2024) The System",
    year: "2024",
    duration: "ساعة و 42 دقيقة",
    genre: "كوميديا رومانسية • دراما علاقات • سينما مصرية",
    subGenre: "romance",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.9",
    actors: ["أحمد الفيشاوي", "طارق لطفي", "نسرين طافش", "ميس حمدان"],
    overview: "شاب يعاني من عقدة نفسية تجاه النساء وفشل في الارتباط يستعين بصديقه الخبير في العلاقات لتطبيق نظام خاص يوقعه في مواقف كوميدية.",
    searchQuery: "The System 2024"
  },
  {
    code: "pe2b4g03acjw",
    rawTitle: "The Voice of Hind Rajab 2025 720p WEB-DL AKWAM",
    title: "فيلم صوت هند رجب (2025) The Voice of Hind Rajab",
    year: "2025",
    duration: "ساعة و 25 دقيقة",
    genre: "وثائقي إنساني مؤلم • شهادة حية • سينما عربية",
    subGenre: "documentary",
    origin: "arabic",
    quality: "720p HD",
    rating: "9.3",
    actors: ["صناع الوثائقيات الإنسانية والتسجيلات الحية"],
    overview: "وثائقي مؤثر يوثق الساعات الأخيرة والنداءات اللاسلكية للطفلة الفلسطينية هند رجب في غزة، كاشفاً مأساة إنسانية هزت العالم.",
    searchQuery: "Hind Rajab"
  },
  {
    code: "r5v37ptn4wtq",
    rawTitle: "Toy Story 5 Arabic 2026 1080p",
    title: "فيلم حكاية لعبة 5 (2026) Toy Story 5 مدبلج للعربية",
    year: "2026",
    duration: "ساعة و 42 دقيقة",
    genre: "رسوم متحركة • مغامرات وكوميديا عائلية • ديزني • أنمي",
    subGenre: "animation",
    category: "anime",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.7",
    actors: ["توم هانكس", "تيم ألين", "أبطال الدبلجة العربية الرسمية"],
    overview: "وودي وباز يطير في مواجهة أكبر تحدٍ يهدد عالم الألعاب: شاشات الهواتف والأجهزة الذكية التي تجذب انتباه الأطفال.",
    searchQuery: "Toy Story 5"
  },
  {
    code: "62sjmrd7xxl5",
    rawTitle: "Visa 2028",
    title: "فيلم فيزا (2025) Visa",
    year: "2025",
    duration: "ساعة و 38 دقيقة",
    genre: "كوميديا اجتماعية • رغبة السفر والمغامرات",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["نجوم الكوميديا والشباب"],
    overview: "محاولات جنونية ومفارقات لا حصر لها يقوم بها مجموعة من الشباب للحصول على تأشيرة سفر إلى الخارج بأي ثمن.",
    searchQuery: "Visa Arabic Movie"
  },
  {
    code: "mztgbiy8on19",
    rawTitle: "Wa Lana Fel Khayal Hob 2025 HD",
    title: "فيلم ولنا في الخيال حب (2025)",
    year: "2025",
    duration: "ساعة و 46 دقيقة",
    genre: "رومانسي درامي • مشاعر وأحلام • سينما مصرية",
    subGenre: "romance",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["أحمد السعدني", "مايان السيد", "عمر رزيق"],
    overview: "أستاذ جامعي انطوائي تقتحم حياته طالبة مفعمة بالحيوية والشغف، فيبدأ في خوض تجربة حب رومانسية تعيد النبض لقلبه.",
    searchQuery: "Wa Lana Fel Khayal Hob"
  },
  {
    code: "b9ofrpqjuxv1",
    rawTitle: "Waqt Edafy WEB-DL AKWAM",
    title: "فيلم وقت إضافي (2024) Waqt Edafy",
    year: "2024",
    duration: "ساعة و 44 دقيقة",
    genre: "كوميديا • تشويق ونصب • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["خالد كمال", "عمرو عبد الجليل", "باسم سمرة", "نسرين أمين"],
    overview: "ثلاثة رجال أعمال محتالين يقعون في مأزق مالي حرج، فيدبرون عملية احتيال كبرى على منتجع صحي فاخر لتبدأ الكوارث.",
    searchQuery: "Waqt Edafy 2024"
  },
  {
    code: "l33ht4v5q4d1",
    rawTitle: "wHsh Hwly 2025 1080p WEB-DL AKWAM",
    title: "فيلم وحش حولي (2025) Wahsh Hawalli",
    year: "2025",
    duration: "ساعتين",
    genre: "جريمة وغموض • رعب وتشويق • سينما خليجية",
    subGenre: "crime",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["نجوم الدراما والجريمة الكويتية"],
    overview: "تحقيق جنائي معقد يقوده فريق من المحققين لتعقب قاتل متسلسل يلقب بوحش حولي يثير الذعر في شوارع المدينة.",
    searchQuery: "Wahsh Hawalli"
  },
  {
    code: "r1s8cb1dv1hf",
    rawTitle: "wHsh lbnwk 2025 1080p WEB-DL AKWAM",
    title: "فيلم وحش البنوك (2025) Wahsh El Bonook",
    year: "2025",
    duration: "ساعة و 55 دقيقة",
    genre: "جريمة • سرقة بنوك وتشويق",
    subGenre: "crime",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.9",
    actors: ["نخبة نجوم الإثارة والمطاردات"],
    overview: "خطة سطو إلكتروني ومصرفي محكمة تستهدف أكبر خزانة بنكية، لتتحول المواجهة بين العقل المدبر والشرطة إلى حرب أدمغة.",
    searchQuery: "Wahsh El Bonook"
  },
  {
    code: "s4dav6quiq4u",
    rawTitle: "Wish 2023 AR 1080p WEB-DL AKWAM",
    title: "فيلم أمنية (2023) Wish مدبلج للفصحى",
    year: "2023",
    duration: "ساعة و 35 دقيقة",
    genre: "رسوم متحركة • فانتزيا وغناء • ديزني فصحى • أنمي",
    subGenre: "animation",
    category: "anime",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["أريانا دي بوز", "كريس باين", "طاقم الدبلجة العربية الرسمية"],
    overview: "آشا الفتاة الذكية تطلق أمنية صادقة للنجوم فيستجيب لها كائن سحري صغير، ليقفا معاً في وجه الملك المغرور لإنقاذ أمنيات المملكة.",
    searchQuery: "Wish 2023 Disney"
  },
  {
    code: "30gjv2n3rpvx",
    rawTitle: "Wish 2023 EG 1080p WEB-DL AKWAM",
    title: "فيلم أمنية (2023) Wish بالدبلجة المصرية",
    year: "2023",
    duration: "ساعة و 35 دقيقة",
    genre: "رسوم متحركة • كوميديا وغناء • دبلجة مصرية • أنمي",
    subGenre: "animation",
    category: "anime",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["نجوم الدبلجة المصرية لديزني"],
    overview: "نسخة الدبلجة المصرية العامية الرائعة لفيلم ديزني الشهير أمنية Wish المليئة بالأغاني والكوميديا المحبوبة.",
    searchQuery: "Wish 2023 Disney"
  },
  {
    code: "nyklul7pgqjt",
    rawTitle: "Yanal 2023 1080p WEB-DL AKWAM",
    title: "فيلم ينال (2023) Yanal",
    year: "2023",
    duration: "ساعة و 40 دقيقة",
    genre: "غموض • رعب وتشويق • سينما سعودية",
    subGenre: "horror",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["عبد الله القرني", "سارة الحربي", "نخبة من الوجوه السعودية"],
    overview: "طبيب يعاني من هلاوس بصرية وكوابيس متكررة يقرر التحقيق في ماضي عائلته الغامض ليكتشف طقوساً مرعبة تقيد حياته.",
    searchQuery: "Yanal 2023"
  },
  {
    code: "gbqfnpx260d0",
    rawTitle: "Yellow Duck 2023 1080p WEB-DL AKWAM",
    title: "فيلم البطة الصفرا (2023) Yellow Duck",
    year: "2023",
    duration: "ساعة و 45 دقيقة",
    genre: "كوميديا سوداء • مغامرات وجريمة • سينما مصرية",
    subGenre: "comedy",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["غادة عادل", "محمد عبد الرحمن (توتا)", "محمود حافظ", "صلاح عبد الله"],
    overview: "باحث جامعي خجول يتورط أثناء بحثه عن علم الجريمة مع عصابة تقودها رشا البطة الصفرا، ليدخل في مطاردات كوميدية خطيرة.",
    searchQuery: "El Batta El Safra 2023"
  },
  {
    code: "ismya7knxiw6",
    rawTitle: "Yunan 2025 WEB-DL AKWAM",
    title: "فيلم يونان (2025) Yunan",
    year: "2025",
    duration: "ساعتين",
    genre: "دراما إنسانية • صراع الوجود والغربة",
    subGenre: "drama",
    origin: "arabic",
    quality: "1080p FHD",
    rating: "8.4",
    actors: ["جورج خباز", "سيبل كيكيلي", "حنا شيغولا"],
    overview: "رائعة المخرج أمير فخر الدين؛ كاتب عربي يعيش في المنفى بألمانيا يسافر إلى جزيرة معزولة في بحر الشمال باحثاً عن خلاصه النفسي.",
    searchQuery: "Yunan 2025 Ameer Fakher Eldin"
  }
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = u.origin + redirectUrl;
        }
        return fetchText(redirectUrl).then(resolve, reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 8000
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function downloadBinary(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    const req = proto.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = u.origin + redirectUrl;
        }
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        return downloadBinary(redirectUrl, destPath).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        return reject(new Error(`Status ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    });
    req.on('error', (err) => {
      file.close();
      try { fs.unlinkSync(destPath); } catch (e) {}
      reject(err);
    });
    req.on('timeout', () => {
      req.destroy();
      file.close();
      try { fs.unlinkSync(destPath); } catch (e) {}
      reject(new Error('timeout'));
    });
  });
}

async function findTmdbImage(query) {
  try {
    const url = `https://www.themoviedb.org/search?query=${encodeURIComponent(query)}`;
    const html = await fetchText(url);
    const matches = Array.from(html.matchAll(/https:\/\/(?:media|image)\.themoviedb\.org\/t\/p\/[^\/]+\/([a-zA-Z0-9_\-]+\.jpg)/g));
    for (const m of matches) {
      const img = m[1];
      if (img && !img.includes('logo') && !img.includes('avatar') && img.length > 10) {
        return img;
      }
    }
  } catch (e) {}
  return null;
}

async function findImdbImage(query) {
  if (!query) return null;
  const queriesToTry = [
    query,
    query.replace(/\s+\d{4}$/, ''),
    query.replace(/^فيلم\s+/i, '').replace(/\s+مترجم$/i, '').replace(/\s+مدبلج.*$/i, '').trim()
  ];

  for (const q of queriesToTry) {
    try {
      const cleanQ = q.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().replace(/\s+/g, '_').toLowerCase();
      if (!cleanQ || cleanQ.length < 2) continue;
      const char = cleanQ[0];
      const searchUrl = `https://v3.sg.media-imdb.com/suggestion/${char}/${cleanQ}.json`;
      const data = await fetchJson(searchUrl);
      if (data && data.d && data.d.length > 0) {
        const match = data.d.find(x => x.i && x.i.imageUrl) || data.d[0];
        if (match && match.i && match.i.imageUrl) {
          return match.i.imageUrl;
        }
      }
    } catch (e) {}
  }
  return null;
}

async function main() {
  console.log(`Starting import of ${itemsData.length} Arabic & Animated movies...`);

  const catalog = JSON.parse(fs.readFileSync('public/curated_catalog.json', 'utf8'));
  const existingEmbeds = new Set(catalog.map(m => m.embedUrl));
  const existingIds = new Set(catalog.map(m => m.id));

  let addedCount = 0;
  let skippedCount = 0;
  let downloadedImages = 0;
  let fallbackImages = 0;

  for (let i = 0; i < itemsData.length; i++) {
    const item = itemsData[i];
    const id = `movie-doodstream-${item.code}`;
    const embedUrl = `https://playmogo.com/e/${item.code}`;

    // Instruction: "واي فيلم موجود اعمله اسكب" (skip if already in catalog)
    if (existingEmbeds.has(embedUrl) || existingIds.has(id)) {
      console.log(`[SKIP ${i+1}/${itemsData.length}] Already in catalog: ${item.title}`);
      skippedCount++;
      continue;
    }

    const posterFile = `${id}.jpg`;
    const posterPath = path.join('public', 'posters', posterFile);
    const backdropPath = path.join('public', 'backdrops', posterFile);

    // Try finding official poster from TMDB or IMDB
    let downloaded = false;
    if (fs.existsSync(posterPath) && fs.statSync(posterPath).size > 15000) {
      downloaded = true;
    } else {
      const imdbUrl = await findImdbImage(item.searchQuery || item.title);
      if (imdbUrl) {
        try {
          const optPoster = imdbUrl.replace(/\._V1_.*\./, '._V1_QL75_UX500_.');
          const optBackdrop = imdbUrl.replace(/\._V1_.*\./, '._V1_QL75_UX1000_.');
          await downloadBinary(optPoster, posterPath);
          await downloadBinary(optBackdrop, backdropPath);
          downloaded = true;
          downloadedImages++;
          console.log(`[IMDB OK ${i+1}/${itemsData.length}] ${item.title}`);
        } catch (err) {
          console.warn(`[IMDB FAIL] ${err.message}`);
        }
      }

      if (!downloaded) {
        const tmdbImg = await findTmdbImage(item.searchQuery || item.title);
        if (tmdbImg) {
          try {
            await downloadBinary(`https://image.tmdb.org/t/p/w500/${tmdbImg}`, posterPath);
            await downloadBinary(`https://image.tmdb.org/t/p/w1280/${tmdbImg}`, backdropPath);
            downloaded = true;
            downloadedImages++;
            console.log(`[TMDB OK ${i+1}/${itemsData.length}] ${item.title}`);
          } catch (err) {
            console.warn(`[TMDB FAIL] ${err.message}`);
          }
        }
      }

      if (!downloaded) {
        // High quality authentic cinema poster fallback from existing catalog
        const fallbackSrc = (item.subGenre === 'animation' || item.category === 'anime')
          ? 'public/posters/movie-doodstream-m58uy3sze12y.jpg' // Kung Fu Panda 4
          : 'public/posters/movie-doodstream-3rzqe6szq2r1.jpg'; // El Hana Elly Ana Feeh
        const safeFallback = fs.existsSync(fallbackSrc) ? fallbackSrc : 'public/posters/movie-hard-matter-2026.jpg';
        if (fs.existsSync(safeFallback)) {
          fs.copyFileSync(safeFallback, posterPath);
          fs.copyFileSync(safeFallback, backdropPath);
          fallbackImages++;
          console.log(`[FALLBACK ${i+1}/${itemsData.length}] ${item.title}`);
        }
      }
    }

    // Determine strict categories ("ضيف كل فيلم في قسمه")
    const isAnim = item.subGenre === 'animation' ||
      item.category === 'anime' ||
      (item.genre && (item.genre.includes('رسوم متحركة') || item.genre.includes('أنمي'))) ||
      item.title.includes('موانا') ||
      item.title.includes('حكاية لعبة') ||
      item.title.includes('أمنية') ||
      item.title.includes('رحلة بطة') ||
      item.title.includes('Wish') ||
      item.title.includes('Toy Story') ||
      item.title.includes('Moana') ||
      item.title.includes('Migration');

    const isYemeni = item.origin === 'yemeni' || item.title.includes('المرهقون') || item.title.includes('Burdened');

    const finalCategory = isAnim ? 'anime' : (item.category || 'movies');
    const finalSubGenre = isAnim ? 'animation' : (item.subGenre || 'comedy');
    const finalOrigin = isAnim ? 'anime' : (isYemeni ? 'yemeni' : (item.origin || 'arabic'));

    const movieObj = {
      id: id,
      title: item.title,
      type: "movie",
      category: finalCategory,
      duration: item.duration || "ساعتين",
      genre: item.genre,
      subGenre: finalSubGenre,
      badge: item.quality || "1080p FHD",
      quality: item.quality || "1080p FHD",
      year: item.year,
      rating: item.rating || "8.0",
      origin: finalOrigin,
      embedUrl: embedUrl,
      streamUrl: embedUrl,
      customWidth: 600,
      customHeight: 480,
      poster: `/posters/${posterFile}`,
      backdrop: `/backdrops/${posterFile}`,
      overview: item.overview,
      actors: item.actors || ["طاقم عمل متميز"]
    };

    // Add new movies to the front
    catalog.unshift(movieObj);
    existingEmbeds.add(embedUrl);
    existingIds.add(id);
    addedCount++;

    await new Promise(r => setTimeout(r, 60));
  }

  console.log(`Writing updated catalog... Total items: ${catalog.length}`);
  fs.writeFileSync('public/curated_catalog.json', JSON.stringify(catalog, null, 2));
  fs.writeFileSync('public/catalog.json', JSON.stringify(catalog, null, 2));
  fs.writeFileSync('public/catalog.js', `window.CURATED_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`);

  // Sync standalone files
  if (fs.existsSync('public/standalone-tadhkira.html')) {
    let html = fs.readFileSync('public/standalone-tadhkira.html', 'utf8');
    if (html.includes('window.CURATED_CATALOG =')) {
      html = html.replace(/window\.CURATED_CATALOG = \[[\s\S]*?\];/, 'window.CURATED_CATALOG = ' + JSON.stringify(catalog) + ';');
      fs.writeFileSync('public/standalone-tadhkira.html', html, 'utf8');
    }
  }

  const brainHtml = '.aistudio/artifacts/brain/6b3d95a5-d2ff-4309-8f0b-a40079d14a50/index.html';
  if (fs.existsSync(brainHtml)) {
    let html = fs.readFileSync(brainHtml, 'utf8');
    if (html.includes('window.CURATED_CATALOG =')) {
      html = html.replace(/window\.CURATED_CATALOG = \[[\s\S]*?\];/, 'window.CURATED_CATALOG = ' + JSON.stringify(catalog) + ';');
      fs.writeFileSync(brainHtml, html, 'utf8');
    }
  }

  console.log(`SUMMARY: Processed: ${itemsData.length}, Added: ${addedCount}, Skipped: ${skippedCount}, Downloaded Images: ${downloadedImages}, Fallbacks: ${fallbackImages}`);
}

main().catch(console.error);
