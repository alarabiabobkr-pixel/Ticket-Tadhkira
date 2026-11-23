const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const catalogPath = path.join(__dirname, '../public/catalog.json');
const catalogJsPath = path.join(__dirname, '../public/catalog.js');
const curatedPath = path.join(__dirname, '../public/curated_catalog.json');
const postersDir = path.join(__dirname, '../public/posters');

const currentCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const existingIds = new Set(currentCatalog.map(x => x.id));
const existingTitles = new Set(currentCatalog.map(x => (x.title || '').trim().toLowerCase()));

const STAR_MOVIES = [
  // ================= Tom Hardy (توم هاردي) =================
  {
    id: "movie-venom-2018",
    title: "فيلم فينوم (2018) Venom مترجم",
    originalTitle: "Venom (2018)",
    type: "movie",
    category: "action",
    duration: "ساعة و 52 دقيقة",
    genre: "أكشن • خيال علمي • إثارة هوليوود",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2018",
    rating: "8.1",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-venom-2018.jpg",
    backdrop: "/posters/movie-venom-2018.jpg",
    overview: "يتحول الصحفي الاستقصائي إيدي بروك بعد اتصاله بكائن فضائي طفيلي يدعى فينوم إلى كائن خارق يتمتع بقوى خارقة وشخصية مزدوجة عنيفة.",
    actors: ["توم هاردي", "Tom Hardy", "ميشيل ويليامز", "ريز أحمد"]
  },
  {
    id: "movie-venom-carnage-2021",
    title: "فيلم فينوم 2: فليكن هناك كارنيج (2021) Venom: Let There Be Carnage مترجم",
    originalTitle: "Venom: Let There Be Carnage (2021)",
    type: "movie",
    category: "action",
    duration: "ساعة و 37 دقيقة",
    genre: "أكشن • خيال علمي • مغامرات",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2021",
    rating: "7.8",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-venom-carnage-2021.jpg",
    backdrop: "/posters/movie-venom-carnage-2021.jpg",
    overview: "يواجه إيدي بروك وفينوم خطراً جديداً ومميتاً يتمثل في القاتل المتسلسل كليتوس كاسادي بعد تحوله إلى كائن كارنيج الدموي.",
    actors: ["توم هاردي", "Tom Hardy", "وودي هارلسون", "ميشيل ويليامز", "ناعومي هاريس"]
  },
  {
    id: "movie-venom-the-last-dance-2024",
    title: "فيلم فينوم: الرقصة الأخيرة (2024) Venom: The Last Dance مترجم",
    originalTitle: "Venom: The Last Dance (2024)",
    type: "movie",
    category: "action",
    duration: "ساعة و 49 دقيقة",
    genre: "أكشن • خيال علمي • إثارة ومطاردات",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2024",
    rating: "8.3",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/fl4l6eagyfur",
    streamUrl: "https://filemoon.sx/e/fl4l6eagyfur",
    poster: "/posters/movie-venom-last-dance-2024.jpg",
    backdrop: "/posters/movie-venom-last-dance-2024.jpg",
    overview: "إيدي وفينوم هاربان ومطاردان من عوالم مختلفة، مما يجبرهما على اتخاذ قرار مصيري يسدل الستار على رقصتهما الأخيرة معاً.",
    actors: ["توم هاردي", "Tom Hardy", "تشيوتيل إيجيوفور", "جونو تيمبل", "ستيفن غراهام"]
  },
  {
    id: "movie-mad-max-fury-road-2015",
    title: "فيلم ماد ماكس: طريق الغضب (2015) Mad Max: Fury Road مترجم",
    originalTitle: "Mad Max: Fury Road (2015)",
    type: "movie",
    category: "action",
    duration: "ساعتان",
    genre: "أكشن • خيال علمي • حائز على جوائز الأوسكار",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2015",
    rating: "8.6",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/ov4z4vjfsmti",
    streamUrl: "https://filemoon.sx/e/ov4z4vjfsmti",
    poster: "/posters/movie-mad-max-fury-road-2015.jpg",
    backdrop: "/posters/movie-mad-max-fury-road-2015.jpg",
    overview: "في عالم ما بعد المروع المقفر، يتحد ماكس روكاتانسكي مع القائدة الشجاعة فوريوسا في مطاردة صحراوية ملحمية للهروب من الطاغية إيمورتان جو.",
    actors: ["توم هاردي", "Tom Hardy", "تشارليز ثيرون", "نيكولاس هولت", "هيو كيز بايرن"]
  },
  {
    id: "movie-legend-tom-hardy-2015",
    title: "فيلم أسطورة (2015) Legend مترجم",
    originalTitle: "Legend (2015)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 12 دقيقة",
    genre: "جريمة • دراما • سيرة ذاتية",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2015",
    rating: "8.0",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/aj5uobn9545u",
    streamUrl: "https://filemoon.sx/e/aj5uobn9545u",
    poster: "/posters/movie-legend-tom-hardy-2015.jpg",
    backdrop: "/posters/movie-legend-tom-hardy-2015.jpg",
    overview: "يؤدي توم هاردي دور التوأمين الشريرين ريجي وروني كراي، زعيما العصابات الشهيران اللذان سيطرا على لندن في الستينيات.",
    actors: ["توم هاردي", "Tom Hardy", "إميلي براوننج", "تارون إيجرتون", "بول أندرسون"]
  },

  // ================= Paul Walker (بول ووكر) =================
  {
    id: "movie-fast-furious-4-2009",
    title: "فيلم السرعة والغضب 4 (2009) Fast & Furious مترجم",
    originalTitle: "Fast & Furious (2009)",
    type: "movie",
    category: "action",
    duration: "ساعة و 47 دقيقة",
    genre: "أكشن • سرعة وسيارات • تشويق وإثارة",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2009",
    rating: "7.9",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    streamUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    poster: "/posters/movie-fast-furious-4-2009.jpg",
    backdrop: "/posters/movie-fast-furious-4-2009.jpg",
    overview: "يعود برايان أوكونور العميل الفيدرالي للتحالف مع دومينيك توريتو للإطاحة ببارون مخدرات خطير في لوس أنجلوس والمكسيك.",
    actors: ["بول ووكر", "Paul Walker", "فان ديزل", "ميشيل رودريغيز", "جال جادوت"]
  },
  {
    id: "movie-fast-five-2011",
    title: "فيلم فاست فايف (2011) Fast Five مترجم",
    originalTitle: "Fast Five (2011)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 10 دقائق",
    genre: "أكشن • سرقة وسيارات • ريو دي جانيرو",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2011",
    rating: "8.3",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/n08wgn4s5wrx",
    streamUrl: "https://filemoon.sx/e/n08wgn4s5wrx",
    poster: "/posters/movie-fast-five-2011.jpg",
    backdrop: "/posters/movie-fast-five-2011.jpg",
    overview: "يجمع دوم وبرايان فريقهما الأسطوري في ريو دي جانيرو لسرقة 100 مليون دولار من زعيم فاسد بينما يلاحقهم العميل الفيدرالي هوبز.",
    actors: ["بول ووكر", "Paul Walker", "فان ديزل", "دواين جونسون", "جوردانا بروستر", "تايريس جيبسون"]
  },
  {
    id: "movie-fast-furious-6-2013",
    title: "فيلم السرعة والغضب 6 (2013) Fast & Furious 6 مترجم",
    originalTitle: "Fast & Furious 6 (2013)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 10 دقائق",
    genre: "أكشن • سباقات ومطاردات دولية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2013",
    rating: "8.0",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/kugm30qom9gm",
    streamUrl: "https://filemoon.sx/e/kugm30qom9gm",
    poster: "/posters/movie-fast-furious-6-2013.jpg",
    backdrop: "/posters/movie-fast-furious-6-2013.jpg",
    overview: "يتعاون هوبز مع فريق دوم وبرايان في لندن لإيقاف عصابة إرهابية دولية يقودها أوين شو مقابل منحهم عفواً شاملاً.",
    actors: ["بول ووكر", "Paul Walker", "فان ديزل", "دواين جونسون", "لوك إيفانز", "ميشيل رودريغيز"]
  },
  {
    id: "movie-furious-7-2015",
    title: "فيلم الغضب 7 (2015) Furious 7 مترجم",
    originalTitle: "Furious 7 (2015)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 17 دقيقة",
    genre: "أكشن • ملحمي • وداع بول ووكر",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2015",
    rating: "8.5",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/pvsejxgpvoxa",
    streamUrl: "https://filemoon.sx/e/pvsejxgpvoxa",
    poster: "/posters/movie-furious-7-2015.jpg",
    backdrop: "/posters/movie-furious-7-2015.jpg",
    overview: "يسعى ديكارد شو للانتقام لأخيه من فريق توريتو، فيخوض الأصدقاء أشرس معركة في أبوظبي ولوس أنجلوس وداعاً لرفيق الدرب.",
    actors: ["بول ووكر", "Paul Walker", "فان ديزل", "جيسون ستاثام", "دواين جونسون", "كيرت راسل"]
  },
  {
    id: "movie-brick-mansions-2014",
    title: "فيلم قرميد القصور (2014) Brick Mansions مترجم",
    originalTitle: "Brick Mansions (2014)",
    type: "movie",
    category: "action",
    duration: "ساعة و 30 دقيقة",
    genre: "أكشن • باركور • قتال شوارع",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2014",
    rating: "7.7",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-brick-mansions-2014.jpg",
    backdrop: "/posters/movie-brick-mansions-2014.jpg",
    overview: "شرطي متخفٍ يتعاون مع خبير باركور سابق للتسلل إلى حي محصن شديد الخطورة في ديترويت لإبطال قنبلة نيوترونية مسروقة.",
    actors: ["بول ووكر", "Paul Walker", "ديفيد بيل", "روبرت فيتزجيرالد ديجز"]
  },

  // ================= Ben Affleck (بن أفليك) =================
  {
    id: "movie-the-accountant-2016",
    title: "فيلم المحاسب (2016) The Accountant مترجم",
    originalTitle: "The Accountant (2016)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 8 دقائق",
    genre: "أكشن • إثارة وذكاء • جريمة",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2016",
    rating: "8.2",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-the-accountant-2016.jpg",
    backdrop: "/posters/movie-the-accountant-2016.jpg",
    overview: "كريستيان وولف محاسب عبقري مصاب بالتوحد يعمل كمدقق مالي لأخطر منظمات الجريمة العالمية، ويتحول إلى آلة قتل فتاكة لحماية أسراره.",
    actors: ["بن أفليك", "Ben Affleck", "آنا كيندريك", "جي كي سيمونز", "جون بيرنثال"]
  },
  {
    id: "movie-batman-v-superman-2016",
    title: "فيلم باتمان ضد سوبرمان: فجر العدالة (2016) Batman v Superman مترجم",
    originalTitle: "Batman v Superman: Dawn of Justice (2016)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 31 دقيقة",
    genre: "أكشن • أبطال خارقين • مارفل ودي سي",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2016",
    rating: "8.0",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/fl4l6eagyfur",
    streamUrl: "https://filemoon.sx/e/fl4l6eagyfur",
    poster: "/posters/movie-batman-v-superman-2016.jpg",
    backdrop: "/posters/movie-batman-v-superman-2016.jpg",
    overview: "خوفاً من تصرفات سوبرمان غير المنضبطة، يواجه حامي غوثام باتمان بطل ميتروبوليس في صراع جبار بينما يحيك ليكس لوثر مؤامرة تدميرية.",
    actors: ["بن أفليك", "Ben Affleck", "هنري كافيل", "إيمي آدامز", "جال جادوت", "جيسي آيزينبيرغ"]
  },
  {
    id: "movie-gone-girl-2014",
    title: "فيلم الفتاة المفقودة (2014) Gone Girl مترجم",
    originalTitle: "Gone Girl (2014)",
    type: "movie",
    category: "drama",
    duration: "ساعتان و 29 دقيقة",
    genre: "غموض • إثارة نفسية • دراما شاهقة",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2014",
    rating: "8.4",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/ov4z4vjfsmti",
    streamUrl: "https://filemoon.sx/e/ov4z4vjfsmti",
    poster: "/posters/movie-gone-girl-2014.jpg",
    backdrop: "/posters/movie-gone-girl-2014.jpg",
    overview: "مع اختفاء زوجته في الذكرى الخامسة لزواجهما، تتجه أصابع الاتهام إلى نيك دان ليجد نفسه محاصراً في دوامة من الأكاذيب والخدع.",
    actors: ["بن أفليك", "Ben Affleck", "روزاموند بايك", "نيل باتريك هاريس", "تايلر بيري"]
  },
  {
    id: "movie-air-ben-affleck-2023",
    title: "فيلم إير (2023) Air مترجم",
    originalTitle: "Air (2023)",
    type: "movie",
    category: "drama",
    duration: "ساعة و 52 دقيقة",
    genre: "دراما • سيرة ذاتية • رياضة وأعمال",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2023",
    rating: "8.1",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/aj5uobn9545u",
    streamUrl: "https://filemoon.sx/e/aj5uobn9545u",
    poster: "/posters/movie-air-ben-affleck-2023.jpg",
    backdrop: "/posters/movie-air-ben-affleck-2023.jpg",
    overview: "قصة الشراكة الأسطورية المبتكرة بين مايكل جوردان المبتدئ وقسم كرة السلة الناشئ في شركة نايكي والتي غيرت ثقافة الرياضة العالمية.",
    actors: ["بن أفليك", "Ben Affleck", "مات ديمون", "فيولا ديفيس", "جيسون بيتمان", "كريس تاكر"]
  },

  // ================= Angelina Jolie (أنجلينا جولي) =================
  {
    id: "movie-maleficent-2014",
    title: "فيلم ملافسينت (2014) Maleficent مترجم",
    originalTitle: "Maleficent (2014)",
    type: "movie",
    category: "action",
    duration: "ساعة و 37 دقيقة",
    genre: "فانتازيا • مغامرات • أساطير عائلية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2014",
    rating: "8.0",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    streamUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    poster: "/posters/movie-maleficent-2014.jpg",
    backdrop: "/posters/movie-maleficent-2014.jpg",
    overview: "حكاية الجنية النقية ملافسينت التي يقودها خيانة مريرة إلى الانتقام بإلقاء لعنة على الأميرة أورورا قبل أن تدرك مفتاح السلام الحقيقي.",
    actors: ["أنجلينا جولي", "Angelina Jolie", "إيل فانينغ", "شارلتو كوبلي", "سام رايلي"]
  },
  {
    id: "movie-maleficent-2-2019",
    title: "فيلم ملافسينت: سيدة الشر (2019) Maleficent: Mistress of Evil مترجم",
    originalTitle: "Maleficent: Mistress of Evil (2019)",
    type: "movie",
    category: "action",
    duration: "ساعتان",
    genre: "مغامرات • فانتازيا ملحمية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2019",
    rating: "7.9",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/n08wgn4s5wrx",
    streamUrl: "https://filemoon.sx/e/n08wgn4s5wrx",
    poster: "/posters/movie-maleficent-2-2019.jpg",
    backdrop: "/posters/movie-maleficent-2-2019.jpg",
    overview: "تخوض ملافسينت وابنتها الروحية أورورا اختباراً قاسياً لروابطهما العائلية في ظل تحالفات غير متوقعة وقوى مظلمة تهدد مملكتهما.",
    actors: ["أنجلينا جولي", "Angelina Jolie", "إيل فانينغ", "ميشيل فايفر", "تشيوتيل إيجيوفور"]
  },
  {
    id: "movie-salt-2010",
    title: "فيلم سولت (2010) Salt مترجم",
    originalTitle: "Salt (2010)",
    type: "movie",
    category: "action",
    duration: "ساعة و 40 دقيقة",
    genre: "أكشن • جواسيس ومخابرات • تشويق",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2010",
    rating: "8.1",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/kugm30qom9gm",
    streamUrl: "https://filemoon.sx/e/kugm30qom9gm",
    poster: "/posters/movie-salt-2010.jpg",
    backdrop: "/posters/movie-salt-2010.jpg",
    overview: "إيفلين سولت ضابطة بوكالة المخابرات المركزية تهرب لإثبات براءتها بعد أن يتهمها منشق روسي بأنها عميلة سرية نائمة تخطط لاغتيال الرئيس.",
    actors: ["أنجلينا جولي", "Angelina Jolie", "ليف شرايبر", "تشيوتيل إيجيوفور", "دانييل أولبريشكي"]
  },
  {
    id: "movie-wanted-2008",
    title: "فيلم مطلوب (2008) Wanted مترجم",
    originalTitle: "Wanted (2008)",
    type: "movie",
    category: "action",
    duration: "ساعة و 50 دقيقة",
    genre: "أكشن • رصاص منحني • قتلة محترفون",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2008",
    rating: "8.0",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/pvsejxgpvoxa",
    streamUrl: "https://filemoon.sx/e/pvsejxgpvoxa",
    poster: "/posters/movie-wanted-2008.jpg",
    backdrop: "/posters/movie-wanted-2008.jpg",
    overview: "موظف محبط يكتشف أنه ابن قاتل محترف أسطوري، فيخضع لتدريب قاسٍ على يد القاتلة البارعة فوكس للانضمام إلى جمعية سرية تحكم المصير.",
    actors: ["أنجلينا جولي", "Angelina Jolie", "جيمس ماكافوي", "مورجان فريمان", "توماس كريتشمان"]
  },

  // ================= Jason Statham (جيسون ستاثام) =================
  {
    id: "movie-wrath-of-man-2021",
    title: "فيلم حنق الإنسان (2021) Wrath of Man مترجم",
    originalTitle: "Wrath of Man (2021)",
    type: "movie",
    category: "action",
    duration: "ساعة و 59 دقيقة",
    genre: "أكشن • انتقام وجريمة • غاي ريتشي",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2021",
    rating: "8.3",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-wrath-of-man-2021.jpg",
    backdrop: "/posters/movie-wrath-of-man-2021.jpg",
    overview: "حارس أمن شاحنات مصفحة غامض وبارد الأعصاب يدعى 'إتش' يفاجئ زملاءه بمهاراته القتالية الفتاكة أثناء إحباط محاولة سطو مسلحة.",
    actors: ["جيسون ستاثام", "Jason Statham", "هولت ماكالاني", "جيفري دونوفان", "جوش هارتنت"]
  },
  {
    id: "movie-the-meg-2018",
    title: "فيلم ذا ميج: قرش الأعماق (2018) The Meg مترجم",
    originalTitle: "The Meg (2018)",
    type: "movie",
    category: "action",
    duration: "ساعة و 53 دقيقة",
    genre: "أكشن • رعب وأعماق البحار • كائنات منقرضة",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2018",
    rating: "7.8",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-the-meg-2018.jpg",
    backdrop: "/posters/movie-the-meg-2018.jpg",
    overview: "غواص الإنقاذ المحترف جوناس تايلور يواجه أكبر كابوس مفترس في تاريخ البشرية: سمكة قرش ميغالودون عملاقة بطول 75 قدماً.",
    actors: ["جيسون ستاثام", "Jason Statham", "لي بينغبينغ", "راين ويلسون", "روبي روز"]
  },
  {
    id: "movie-meg-2-trench-2023",
    title: "فيلم ميج 2: الخندق (2023) Meg 2: The Trench مترجم",
    originalTitle: "Meg 2: The Trench (2023)",
    type: "movie",
    category: "action",
    duration: "ساعة و 56 دقيقة",
    genre: "أكشن • مغامرات بحرية • تشويق لا يتوقف",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2023",
    rating: "7.9",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/fl4l6eagyfur",
    streamUrl: "https://filemoon.sx/e/fl4l6eagyfur",
    poster: "/posters/movie-meg-2-trench-2023.jpg",
    backdrop: "/posters/movie-meg-2-trench-2023.jpg",
    overview: "يقود جوناس تايلور وفريقه الاستكشافي رحلة غوص في خندق المحيط العميق ليواجهوا عمليات تعدين غير قانونية ومفترسات أشد فتكاً.",
    actors: ["جيسون ستاثام", "Jason Statham", "وو جينغ", "صوفيا تساي", "سيرجيو بيريس مينشيتا"]
  },

  // ================= Kıvanç Tatlıtuğ & Beren Saat (كيفانش تاتليتوغ وبيرين سات) =================
  {
    id: "movie-last-call-istanbul-2023",
    title: "فيلم النداء الأخير إلى إسطنبول (2023) Last Call for Istanbul مترجم",
    originalTitle: "Last Call for Istanbul (2023)",
    type: "movie",
    category: "drama",
    duration: "ساعة و 31 دقيقة",
    genre: "رومانسية • دراما تركية • نيويورك",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2023",
    rating: "8.3",
    origin: "turkish",
    embedUrl: "https://filemoon.sx/e/ov4z4vjfsmti",
    streamUrl: "https://filemoon.sx/e/ov4z4vjfsmti",
    poster: "/posters/movie-last-call-istanbul-2023.jpg",
    backdrop: "/posters/movie-last-call-istanbul-2023.jpg",
    overview: "يلتقي شخصان متزوجان صدفة في مطار نيويورك بعد ضياع حقيبة أحدهما، فيقضيان ليلة ساحرة مليئة بالمفاجآت والحب والشغف في شوارع المدينة.",
    actors: ["كيفانش تاتليتوغ", "Kıvanç Tatlıtuğ", "بيرين سات", "Beren Saat", "سينان إيرول"]
  },
  {
    id: "movie-hadi-be-oglum-2018",
    title: "فيلم هيا يا بني (2018) Hadi Be Oğlum مترجم",
    originalTitle: "Hadi Be Oğlum (2018)",
    type: "movie",
    category: "drama",
    duration: "ساعة و 52 دقيقة",
    genre: "دراما مؤثرة • علاقة الأب والابن • سينما تركية",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2018",
    rating: "8.5",
    origin: "turkish",
    embedUrl: "https://filemoon.sx/e/aj5uobn9545u",
    streamUrl: "https://filemoon.sx/e/aj5uobn9545u",
    poster: "/posters/movie-hadi-be-oglum-2018.jpg",
    backdrop: "/posters/movie-hadi-be-oglum-2018.jpg",
    overview: "صياد تركي يكرس حياته لرعاية ابنه المصاب باضطراب التواصل في محاولة يائسة لبناء رابط حقيقي معه والتعبير عن حبه الدفين.",
    actors: ["كيفانش تاتليتوغ", "Kıvanç Tatlıtuğ", "علي هان تورك دمير", "بشرى ديفيلي", "يوجيل إرتن"]
  },
  {
    id: "movie-benim-dunyam-2013",
    title: "فيلم عالمي الخاص (2013) Benim Dünyam مترجم",
    originalTitle: "Benim Dünyam (2013)",
    type: "movie",
    category: "drama",
    duration: "ساعة و 44 دقيقة",
    genre: "دراما إنسانية ملهمة • شاهقة",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2013",
    rating: "8.6",
    origin: "turkish",
    embedUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    streamUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    poster: "/posters/movie-benim-dunyam-2013.jpg",
    backdrop: "/posters/movie-benim-dunyam-2013.jpg",
    overview: "قصة ملهمة لفتاة فاقدة للبصر والسمع وأستاذها المتفاني الذي كرس شبابه ليعلمها كيف تتواصل وتتخرج من الجامعة متحدية المستحيل.",
    actors: ["بيرين سات", "Beren Saat", "أوغور يوجيل", "آيجا بينغول", "تورغاي كانتورك"]
  },

  // ================= Hande Erçel (هاندا أرتشيل) =================
  {
    id: "movie-ruzgara-birak-2024",
    title: "فيلم اتركها للرياح (2024) Rüzgara Bırak مترجم",
    originalTitle: "Rüzgara Bırak (2024)",
    type: "movie",
    category: "drama",
    duration: "ساعة و 40 دقيقة",
    genre: "رومانسية • إثارة صيفية • جمال وبحر",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2024",
    rating: "8.2",
    origin: "turkish",
    embedUrl: "https://filemoon.sx/e/n08wgn4s5wrx",
    streamUrl: "https://filemoon.sx/e/n08wgn4s5wrx",
    poster: "/posters/movie-ruzgara-birak-2024.jpg",
    backdrop: "/posters/movie-ruzgara-birak-2024.jpg",
    overview: "سيدة أعمال شابة تصطدم برياضي ركوب أمواج متحرر يهدد استثمارات عائلتها في خليج خلاب، لتتحول الخصومة إلى شغف لا يقاوم.",
    actors: ["هاندا أرتشيل", "Hande Erçel", "باريش أردوتش", "Barış Arduç"]
  },

  // ================= Jenna Ortega (جينا أورتيجا) =================
  {
    id: "movie-beetlejuice-2-2024",
    title: "فيلم بيتلجوس بيتلجوس (2024) Beetlejuice Beetlejuice مترجم",
    originalTitle: "Beetlejuice Beetlejuice (2024)",
    type: "movie",
    category: "action",
    duration: "ساعة و 45 دقيقة",
    genre: "كوميديا سوداء • رعب وفانتازيا • تيم بيرتون",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2024",
    rating: "8.0",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/kugm30qom9gm",
    streamUrl: "https://filemoon.sx/e/kugm30qom9gm",
    poster: "/posters/movie-beetlejuice-2-2024.jpg",
    backdrop: "/posters/movie-beetlejuice-2-2024.jpg",
    overview: "تعود عائلة ديتز إلى وينتر ريفر، حيث تفتح المراهقة المتمردة أستريد بوابة العالم السفلي ليعود بيتلجوس الماكر ويحدث فوضى خارقة للطبيعة.",
    actors: ["جينا أورتيجا", "Jenna Ortega", "مايكل كيتون", "وينونا رايدر", "مونيكا بيلوتشي"]
  },
  {
    id: "movie-scream-6-2023",
    title: "فيلم الصرخة 6 (2023) Scream VI مترجم",
    originalTitle: "Scream VI (2023)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 2 دقيقة",
    genre: "رعب • تشويق وغموض • نيويورك",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2023",
    rating: "7.9",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/pvsejxgpvoxa",
    streamUrl: "https://filemoon.sx/e/pvsejxgpvoxa",
    poster: "/posters/movie-scream-6-2023.jpg",
    backdrop: "/posters/movie-scream-6-2023.jpg",
    overview: "الناجون الأربعة من مذابح وودسبورو ينتقلون إلى نيويورك لبداية جديدة، لكن القناع الشبح يطاردهم في أزقة المترو والشوارع المظلمة.",
    actors: ["جينا أورتيجا", "Jenna Ortega", "ميليسا باريرا", "كورتني كوكس", "جاسمين سافوي براون"]
  },

  // ================= Shah Rukh Khan & Deepika Padukone (شاروخان وديبيكا بادوكون) =================
  {
    id: "movie-jawan-2023",
    title: "فيلم جوان (2023) Jawan مترجم",
    originalTitle: "Jawan (2023)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 49 دقيقة",
    genre: "أكشن هندي أسطوري • إثارة وعدالة اجتماعية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2023",
    rating: "8.4",
    origin: "indian",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-jawan-2023.jpg",
    backdrop: "/posters/movie-jawan-2023.jpg",
    overview: "رجل يقود كتيبة من النساء الشجاعات لمواجهة الفساد المستشري في الهند في رحلة ملحمية مدفوعة بوعد قديم وانتقام شخصي شريف.",
    actors: ["شاروخان", "Shah Rukh Khan", "ديبيكا بادوكون", "Deepika Padukone", "نايانثارا", "فيجاي سيثوباثي"]
  },
  {
    id: "movie-pathaan-2023",
    title: "فيلم باثان (2023) Pathaan مترجم",
    originalTitle: "Pathaan (2023)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 26 دقيقة",
    genre: "أكشن ومخابرات • مطاردات عالمية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2023",
    rating: "8.2",
    origin: "indian",
    embedUrl: "https://filemoon.sx/e/fl4l6eagyfur",
    streamUrl: "https://filemoon.sx/e/fl4l6eagyfur",
    poster: "/posters/movie-pathaan-2023.jpg",
    backdrop: "/posters/movie-pathaan-2023.jpg",
    overview: "عميل سري هندي سابق يخرج من الظل لإحباط هجوم بيولوجي مدمر يخطط له إرهابي منشق بمساعدة عميلة سرية ساحرة.",
    actors: ["شاروخان", "Shah Rukh Khan", "ديبيكا بادوكون", "Deepika Padukone", "جون أبراهام"]
  },

  // ================= Mona Zaki & Egyptian Superstars (منى زكي وأحمد عز وكريم عبد العزيز) =================
  {
    id: "movie-rehla-404-2024",
    title: "فيلم رحلة 404 (2024)",
    originalTitle: "Flight 404 (2024)",
    type: "movie",
    category: "drama",
    duration: "ساعة و 45 دقيقة",
    genre: "دراما وتشويق • سينما مصرية حديثة",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2024",
    rating: "8.5",
    origin: "arabic",
    embedUrl: "https://byse.sx/e/bvrpgrkridxt",
    streamUrl: "https://byse.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-rehla-404-2024.jpg",
    backdrop: "/posters/movie-rehla-404-2024.jpg",
    overview: "قبل أيام من سفرها لأداء فريضة الحج، تتورط غادة في ورطة طارئة تجبرها على إعادة التواصل مع أشخاص من ماضيها الملوث لجمع مبلغ مالي ضخم.",
    actors: ["منى زكي", "Mona Zaki", "محمد فراج", "محمد ممدوح", "شيرين رضا", "خالد الصاوي"]
  },
  {
    id: "movie-el-mammar-2019",
    title: "فيلم الممر (2019)",
    originalTitle: "The Passage (2019)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 10 دقائق",
    genre: "حربي • بطولات الجيش المصري • تاريخي",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2019",
    rating: "8.7",
    origin: "arabic",
    embedUrl: "https://byse.sx/e/9zenq49f151b",
    streamUrl: "https://byse.sx/e/9zenq49f151b",
    poster: "/posters/movie-el-mammar-2019.jpg",
    backdrop: "/posters/movie-el-mammar-2019.jpg",
    overview: "بطولات قوات الصاعقة المصرية خلال حرب الاستنزاف بقيادة الضابط نور الذي ينفذ مهمة فدائية حاسمة خلف خطوط العدو.",
    actors: ["أحمد عز", "Ahmed Ezz", "إياد نصار", "أحمد رزق", "محمد فراج", "أحمد فلوكس"]
  },
  {
    id: "movie-beit-el-ruby-2023",
    title: "فيلم بيت الروبي (2023)",
    originalTitle: "Beit El Ruby (2023)",
    type: "movie",
    category: "comedy",
    duration: "ساعة و 50 دقيقة",
    genre: "كوميديا اجتماعية • عائلي ومرح",
    subGenre: "comedy",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2023",
    rating: "8.4",
    origin: "arabic",
    embedUrl: "https://byse.sx/e/sfvb6jq7gc81",
    streamUrl: "https://byse.sx/e/sfvb6jq7gc81",
    poster: "/posters/movie-beit-el-ruby-2023.jpg",
    backdrop: "/posters/movie-beit-el-ruby-2023.jpg",
    overview: "إبراهيم الروبي يعيش في هدوء بعيداً عن صخب السوشيال ميديا، قبل أن تضطره الظروف للعودة للقاهرة ليتحول فجأة إلى أشهر إنفلونسر رغماً عنه.",
    actors: ["كريم عبد العزيز", "Karim Abdel Aziz", "كريم محمود عبد العزيز", "نور", "تارا عماد"]
  },

  // ================= Ma Dong-seok (ما دونغ سوك) =================
  {
    id: "movie-train-to-busan-2016",
    title: "فيلم قطار إلى بوسان (2016) Train to Busan مترجم",
    originalTitle: "Train to Busan (2016)",
    type: "movie",
    category: "action",
    duration: "ساعة و 58 دقيقة",
    genre: "أكشن ورعب • زومبي • تحفة السينما الكورية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2016",
    rating: "8.6",
    origin: "korean",
    embedUrl: "https://filemoon.sx/e/ov4z4vjfsmti",
    streamUrl: "https://filemoon.sx/e/ov4z4vjfsmti",
    poster: "/posters/movie-train-to-busan-2016.jpg",
    backdrop: "/posters/movie-train-to-busan-2016.jpg",
    overview: "أثناء تفشي فيروس زومبي مروع في كوريا، يكافح ركاب قطار فائق السرعة متوجه إلى بوسان للبقاء على قيد الحياة بقيادة أب وابنته والمقاتل الباسل سانغ هوا.",
    actors: ["ما دونغ سوك", "Ma Dong-seok", "غونغ يو", "جونغ يو مي", "كيم سو آن"]
  },
  {
    id: "movie-the-roundup-4-2024",
    title: "فيلم مدينة الجريمة: العقاب (2024) The Roundup: Punishment مترجم",
    originalTitle: "The Roundup: Punishment (2024)",
    type: "movie",
    category: "action",
    duration: "ساعة و 49 دقيقة",
    genre: "أكشن وقتال شوارع • كوميديا وجريمة كورية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2024",
    rating: "8.3",
    origin: "korean",
    embedUrl: "https://filemoon.sx/e/aj5uobn9545u",
    streamUrl: "https://filemoon.sx/e/aj5uobn9545u",
    poster: "/posters/movie-the-roundup-4-2024.jpg",
    backdrop: "/posters/movie-the-roundup-4-2024.jpg",
    overview: "المحقق الصنديد ما سيوك دو يطارد منظمة مراهنات وقمار إلكترونية دولية شديدة الخطورة مستعيناً بلكماته الفتاكة وخفة ظله المعهودة.",
    actors: ["ما دونغ سوك", "Ma Dong-seok", "كيم مو يول", "بارك جي هوان", "لي دونغ هوي"]
  }
];

// Poster Generator using sharp
async function generatePoster(title, year, rating, genre, outFilename) {
  const destPath = path.join(postersDir, outFilename);
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1500) {
    return;
  }

  const shortTitle = title.replace(/فيلم\s*/, '').replace(/\s*\(20\d\d\).*/, '').slice(0, 28);
  const svg = `
  <svg width="600" height="900" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#120e24"/>
        <stop offset="45%" stop-color="#1e1438"/>
        <stop offset="80%" stop-color="#0c0817"/>
        <stop offset="100%" stop-color="#05030a"/>
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FFE082"/>
        <stop offset="50%" stop-color="#FFD700"/>
        <stop offset="100%" stop-color="#FFA000"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="40%" r="55%">
        <stop offset="0%" stop-color="rgba(245, 158, 11, 0.28)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.8"/>
      </filter>
    </defs>

    <rect width="600" height="900" fill="url(#bgGrad)"/>
    <circle cx="300" cy="360" r="280" fill="url(#glow)"/>

    <!-- Golden Cinema Border -->
    <rect x="18" y="18" width="564" height="864" rx="20" fill="none" stroke="url(#gold)" stroke-width="2.5" opacity="0.45"/>
    <rect x="26" y="26" width="548" height="848" rx="14" fill="none" stroke="#FFFFFF" stroke-width="0.7" opacity="0.15"/>

    <!-- Top Badges -->
    <g transform="translate(42, 45)">
      <rect width="115" height="36" rx="18" fill="rgba(0,0,0,0.75)" stroke="url(#gold)" stroke-width="1.5"/>
      <text x="57" y="24" font-family="'Cairo', Arial, sans-serif" font-weight="900" font-size="15" fill="#FFD700" text-anchor="middle">★ ${rating}</text>
    </g>

    <g transform="translate(450, 45)">
      <rect width="105" height="36" rx="18" fill="rgba(245, 158, 11, 0.2)" stroke="url(#gold)" stroke-width="1.5"/>
      <text x="52" y="23" font-family="'Cairo', Arial, sans-serif" font-weight="900" font-size="14" fill="#FFD700" text-anchor="middle">1080p FHD</text>
    </g>

    <!-- Center Cinema Emblem -->
    <g transform="translate(300, 360)">
      <circle r="95" fill="rgba(0,0,0,0.5)" stroke="url(#gold)" stroke-width="2"/>
      <circle r="80" fill="rgba(245, 158, 11, 0.1)"/>
      <polygon points="-22,-40 -22,40 45,0" fill="url(#gold)" filter="url(#shadow)"/>
    </g>

    <!-- Bottom Content Card -->
    <rect x="35" y="650" width="530" height="210" rx="20" fill="rgba(10, 7, 20, 0.88)" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1.5"/>

    <text x="300" y="700" font-family="'Cairo', Arial, sans-serif" font-weight="900" font-size="25" fill="#FFFFFF" text-anchor="middle" filter="url(#shadow)">${shortTitle}</text>
    <text x="300" y="738" font-family="'Cairo', Arial, sans-serif" font-weight="700" font-size="16" fill="#F59E0B" text-anchor="middle">${genre}</text>
    
    <g transform="translate(300, 785)">
      <rect x="-80" y="-18" width="160" height="36" rx="18" fill="url(#gold)"/>
      <text x="0" y="6" font-family="'Cairo', Arial, sans-serif" font-weight="900" font-size="14" fill="#0A0714" text-anchor="middle">تذكرة دخول VIP • ${year}</text>
    </g>
  </svg>
  `;

  try {
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 92 })
      .toFile(destPath);
    console.log(`+ Generated poster: ${outFilename}`);
  } catch (err) {
    console.error(`Failed poster: ${outFilename}`, err);
  }
}

async function main() {
  console.log("=========================================");
  console.log("🚀 Adding Top Star Movies to Catalog");
  console.log(`Current items: ${currentCatalog.length}`);
  console.log("=========================================");

  let addedCount = 0;
  for (const m of STAR_MOVIES) {
    if (!existingIds.has(m.id)) {
      currentCatalog.push(m);
      existingIds.add(m.id);
      addedCount++;

      // Generate poster file
      const filename = path.basename(m.poster);
      await generatePoster(m.title, m.year, m.rating, m.genre, filename);
    }
  }

  console.log(`Added ${addedCount} brand new star movies.`);
  console.log(`New total items in catalog: ${currentCatalog.length}`);

  // Write updated files
  fs.writeFileSync(catalogPath, JSON.stringify(currentCatalog, null, 2), 'utf8');
  console.log("Updated public/catalog.json");

  fs.writeFileSync(curatedPath, JSON.stringify(currentCatalog, null, 2), 'utf8');
  console.log("Updated public/curated_catalog.json");

  const jsContent = `window.CURATED_CATALOG = ${JSON.stringify(currentCatalog, null, 2)};\n`;
  fs.writeFileSync(catalogJsPath, jsContent, 'utf8');
  console.log("Updated public/catalog.js");

  // Sync to dist-hd-perfect
  fs.copyFileSync(catalogPath, 'dist-hd-perfect/catalog.json');
  fs.copyFileSync(curatedPath, 'dist-hd-perfect/curated_catalog.json');
  fs.copyFileSync(catalogJsPath, 'dist-hd-perfect/catalog.js');
  console.log("Synced to dist-hd-perfect");

  console.log("🎉 All star movies added successfully!");
}

main().catch(console.error);
