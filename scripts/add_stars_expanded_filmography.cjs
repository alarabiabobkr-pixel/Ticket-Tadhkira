const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const catalogPath = path.join(__dirname, '../public/catalog.json');
const catalogJsPath = path.join(__dirname, '../public/catalog.js');
const curatedPath = path.join(__dirname, '../public/curated_catalog.json');
const postersDir = path.join(__dirname, '../public/posters');

if (!fs.existsSync(postersDir)) {
  fs.mkdirSync(postersDir, { recursive: true });
}

let catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// 1. Remove any duplicate Jawan or invalid entries
catalog = catalog.filter(item => item.id !== 'movie-doodstream-pm62okxneeyc');

const existingIds = new Set(catalog.map(x => x.id));
const existingTitles = new Set(catalog.map(x => (x.title || '').trim().toLowerCase()));

const NEW_STAR_MOVIES = [
  // ================= Johnny Depp (جوني ديب) =================
  {
    id: "movie-pirates-caribbean-1-2003",
    title: "فيلم قراصنة الكاريبي: لعنة اللؤلؤة السوداء (2003) Pirates of the Caribbean: The Curse of the Black Pearl مترجم",
    originalTitle: "Pirates of the Caribbean: The Curse of the Black Pearl (2003)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 23 دقيقة",
    genre: "أكشن • مغامرات • فانتازيا هوليوود",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2003",
    rating: "8.1",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-pirates-caribbean-1-2003.jpg",
    backdrop: "/posters/movie-pirates-caribbean-1-2003.jpg",
    overview: "يتحالف الحداد الشاب ويل تيرنر مع القرصان غريب الأطوار الكابتن جاك سبارو لإنقاذ حبيبته من طاقم سفينة اللؤلؤة السوداء الملعونة بقيادة باربوسا.",
    actors: ["جوني ديب", "Johnny Depp", "أورلاندو بلوم", "كيرا نايتلي", "جيفري راش"]
  },
  {
    id: "movie-pirates-caribbean-2-2006",
    title: "فيلم قراصنة الكاريبي 2: صندوق الرجل الميت (2006) Pirates of the Caribbean: Dead Man's Chest مترجم",
    originalTitle: "Pirates of the Caribbean: Dead Man's Chest (2006)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 31 دقيقة",
    genre: "أكشن • مغامرات • فانتازيا",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2006",
    rating: "7.4",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-pirates-caribbean-2-2006.jpg",
    backdrop: "/posters/movie-pirates-caribbean-2-2006.jpg",
    overview: "يجد جاك سبارو نفسه مديناً بروحه لأسطورة البحار دافي جونز حاكم أعماق المحيط، ويسابق الزمن للعثور على مفتاح صندوق قلبه لإنقاذ نفسه.",
    actors: ["جوني ديب", "Johnny Depp", "أورلاندو بلوم", "كيرا نايتلي", "بيل ناي"]
  },
  {
    id: "movie-pirates-caribbean-3-2007",
    title: "فيلم قراصنة الكاريبي 3: في نهاية العالم (2007) Pirates of the Caribbean: At World's End مترجم",
    originalTitle: "Pirates of the Caribbean: At World's End (2007)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 49 دقيقة",
    genre: "أكشن • مغامرات • خيال",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2007",
    rating: "7.1",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/kugm30qom9gm",
    streamUrl: "https://filemoon.sx/e/kugm30qom9gm",
    poster: "/posters/movie-pirates-caribbean-3-2007.jpg",
    backdrop: "/posters/movie-pirates-caribbean-3-2007.jpg",
    overview: "يبحر ويل تيرنر وإليزابيث سوان مع الكابتن باربوسا في مهمة يائسة للوصول إلى نهاية العالم وتحرير جاك سبارو من خزانة دافي جونز لخوض المعركة الكبرى.",
    actors: ["جوني ديب", "Johnny Depp", "أورلاندو بلوم", "كيرا نايتلي", "تشاو ين فات", "جيفري راش"]
  },
  {
    id: "movie-pirates-caribbean-4-2011",
    title: "فيلم قراصنة الكاريبي 4: في بحار غريبة (2011) Pirates of the Caribbean: On Stranger Tides مترجم",
    originalTitle: "Pirates of the Caribbean: On Stranger Tides (2011)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 16 دقيقة",
    genre: "أكشن • مغامرات • فانتازيا",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2011",
    rating: "6.6",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    streamUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    poster: "/posters/movie-pirates-caribbean-4-2011.jpg",
    backdrop: "/posters/movie-pirates-caribbean-4-2011.jpg",
    overview: "يتقاطع طريق جاك سبارو مع امرأة غامضة من ماضيه، لتجبره على ركوب سفينة القرصان الأسطوري اللحية السوداء بحثاً عن ينبوع الشباب الدائم.",
    actors: ["جوني ديب", "Johnny Depp", "بينيلوبي كروز", "إيان ماكشين", "جيفري راش"]
  },
  {
    id: "movie-pirates-caribbean-5-2017",
    title: "فيلم قراصنة الكاريبي 5: الرجال الأموات لا يروون حكايات (2017) Dead Men Tell No Tales مترجم",
    originalTitle: "Pirates of the Caribbean: Dead Men Tell No Tales (2017)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 9 دقائق",
    genre: "أكشن • مغامرات • خيال",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2017",
    rating: "6.5",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-pirates-caribbean-5-2017.jpg",
    backdrop: "/posters/movie-pirates-caribbean-5-2017.jpg",
    overview: "يطارد القبطان الشبح سالازار جاك سبارو للانتقام منه، ويكون طوق نجاة سبارو الوحيد هو العثور على رمح بوسيدون الأسطوري.",
    actors: ["جوني ديب", "Johnny Depp", "خافيير بارديم", "برينتون ثويتس", "كايا سكوديلاريو"]
  },
  {
    id: "movie-alice-in-wonderland-2010",
    title: "فيلم أليس في بلاد العجائب (2010) Alice in Wonderland مترجم",
    originalTitle: "Alice in Wonderland (2010)",
    type: "movie",
    category: "adventure",
    duration: "ساعة و 48 دقيقة",
    genre: "مغامرات • عائلي • فانتازيا",
    subGenre: "adventure",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2010",
    rating: "6.4",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-alice-in-wonderland-2010.jpg",
    backdrop: "/posters/movie-alice-in-wonderland-2010.jpg",
    overview: "تعود أليس البالغة من العمر تسعة عشر عاماً إلى العالم السحري الذي زارته في طفولتها لتلتقي بصانع القبعات المجنون وتواجه الملكة الحمراء الشريرة.",
    actors: ["جوني ديب", "Johnny Depp", "ميا واسيكوسكا", "آن هاثاواي", "هيلينا بونهام كارتر"]
  },

  // ================= Robert De Niro (روبرت دي نيرو) =================
  {
    id: "movie-godfather-part-2-1974",
    title: "فيلم العراب 2 (1974) The Godfather Part II مترجم",
    originalTitle: "The Godfather Part II (1974)",
    type: "movie",
    category: "drama",
    duration: "3 ساعات و 22 دقيقة",
    genre: "جريمة • دراما • كلاسيكيات السينما العالمية",
    subGenre: "crime",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "1974",
    rating: "9.0",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/rd8ib7i1gp8g",
    streamUrl: "https://filemoon.sx/e/rd8ib7i1gp8g",
    poster: "/posters/movie-godfather-part-2-1974.jpg",
    backdrop: "/posters/movie-godfather-part-2-1974.jpg",
    overview: "يستعرض الفيلم بدايات صعود فيتو كورليوني في نيويورك عام 1920 بالتوازي مع جهود مايكل لتوسيع إمبراطورية العائلة في الخمسينات.",
    actors: ["روبرت دي نيرو", "Robert De Niro", "آل باتشينو", "روبرت دوفال", "ديان كيتون"]
  },
  {
    id: "movie-taxi-driver-1976",
    title: "فيلم سائق التاكسي (1976) Taxi Driver مترجم",
    originalTitle: "Taxi Driver (1976)",
    type: "movie",
    category: "drama",
    duration: "ساعة و 54 دقيقة",
    genre: "دراما • جريمة • إثارة نفسية",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "1976",
    rating: "8.2",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/d15cyomn9ceg",
    streamUrl: "https://filemoon.sx/e/d15cyomn9ceg",
    poster: "/posters/movie-taxi-driver-1976.jpg",
    backdrop: "/posters/movie-taxi-driver-1976.jpg",
    overview: "ترافيس بيكل جندي سابق يعاني من الأرق ويعمل كسائق تاكسي ليلي في شوارع نيويورك المظلمة، يقرر تنظيف المدينة بنفسه بالسلاح.",
    actors: ["روبرت دي نيرو", "Robert De Niro", "جودي فوستر", "سيبيل شيبارد", "هارفي كيتل"]
  },
  {
    id: "movie-heat-1995",
    title: "فيلم حرارة (1995) Heat مترجم",
    originalTitle: "Heat (1995)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 50 دقيقة",
    genre: "أكشن • جريمة • إثارة ملحمية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "1995",
    rating: "8.3",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/kugm30qom9gm",
    streamUrl: "https://filemoon.sx/e/kugm30qom9gm",
    poster: "/posters/movie-heat-1995.jpg",
    backdrop: "/posters/movie-heat-1995.jpg",
    overview: "صراع الذكاء والمطاردات العنيفة بين كبير لصوص المصارف المحترف نيل ماكولي ومحقق الشرطة العبقري فنسنت هانا في لوس أنجلوس.",
    actors: ["روبرت دي نيرو", "Robert De Niro", "آل باتشينو", "فال كيلمر", "جون فويت", "توم سيزمور"]
  },
  {
    id: "movie-casino-1995",
    title: "فيلم كازينو (1995) Casino مترجم",
    originalTitle: "Casino (1995)",
    type: "movie",
    category: "drama",
    duration: "ساعتان و 58 دقيقة",
    genre: "جريمة • دراما • مافيا",
    subGenre: "crime",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "1995",
    rating: "8.2",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-casino-1995.jpg",
    backdrop: "/posters/movie-casino-1995.jpg",
    overview: "قصة صعود وسقوط سام روثستين خبير المراهنات الذي تكلفه المافيا بإدارة أحد أكبر كازينوهات لاس فيغاس في السبعينات والثمانينات.",
    actors: ["روبرت دي نيرو", "Robert De Niro", "شارون ستون", "جو بيشي", "جيمس وودز"]
  },
  {
    id: "movie-the-irishman-2019",
    title: "فيلم الأيرلندي (2019) The Irishman مترجم",
    originalTitle: "The Irishman (2019)",
    type: "movie",
    category: "drama",
    duration: "3 ساعات و 29 دقيقة",
    genre: "جريمة • سيرة ذاتية • دراما ملحمية",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2019",
    rating: "7.8",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    streamUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    poster: "/posters/movie-the-irishman-2019.jpg",
    backdrop: "/posters/movie-the-irishman-2019.jpg",
    overview: "يروي القاتل المأجور فرانك شيران مسيرته الطويلة مع عائلة بوفالينو الإجرامية وعلاقته الوثيقة بالزعيم النقابي المثير للجدل جيمي هوفا.",
    actors: ["روبرت دي نيرو", "Robert De Niro", "آل باتشينو", "جو بيشي", "هارفي كيتل"]
  },

  // ================= Martin Freeman (مارتن فريمان) =================
  {
    id: "movie-hobbit-unexpected-journey-2012",
    title: "فيلم الهوبيت: رحلة غير متوقعة (2012) The Hobbit: An Unexpected Journey مترجم",
    originalTitle: "The Hobbit: An Unexpected Journey (2012)",
    type: "movie",
    category: "adventure",
    duration: "ساعتان و 49 دقيقة",
    genre: "مغامرات • فانتازيا • خيال أسطوري",
    subGenre: "adventure",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2012",
    rating: "7.8",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-hobbit-unexpected-journey-2012.jpg",
    backdrop: "/posters/movie-hobbit-unexpected-journey-2012.jpg",
    overview: "ينطلق الهوبيت بيلبو باجينز في رحلة محفوفة بالمخاطر مع الساحر غاندالف وثلاثة عشر قزماً لاستعادة مملكتهم الجبلية المفقودة من التنين سموغ.",
    actors: ["مارتن فريمان", "Martin Freeman", "إيان ماكيلين", "ريتشارد أرميتاج", "كيت بلانشيت", "آندي سركيس"]
  },
  {
    id: "movie-hobbit-desolation-smaug-2013",
    title: "فيلم الهوبيت 2: قفرة سموغ (2013) The Hobbit: The Desolation of Smaug مترجم",
    originalTitle: "The Hobbit: The Desolation of Smaug (2013)",
    type: "movie",
    category: "adventure",
    duration: "ساعتان و 41 دقيقة",
    genre: "مغامرات • فانتازيا • أكشن ملحمي",
    subGenre: "adventure",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2013",
    rating: "7.8",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-hobbit-desolation-smaug-2013.jpg",
    backdrop: "/posters/movie-hobbit-desolation-smaug-2013.jpg",
    overview: "يواصل بيلبو باجينز والأقزام رحلتهم نحو الجبل الوحيد لمواجهة التنين الجبار سموغ واستعادة كنز إيريبور العظيم.",
    actors: ["مارتن فريمان", "Martin Freeman", "إيان ماكيلين", "بيندكت كامبرباتش", "إيفانجلين ليلي", "أورلاندو بلوم"]
  },
  {
    id: "movie-hobbit-battle-five-armies-2014",
    title: "فيلم الهوبيت 3: معركة الجيوش الخمسة (2014) The Hobbit: The Battle of the Five Armies مترجم",
    originalTitle: "The Hobbit: The Battle of the Five Armies (2014)",
    type: "movie",
    category: "adventure",
    duration: "ساعتان و 24 دقيقة",
    genre: "أكشن • فانتازيا • مغامرات ملحمية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2014",
    rating: "7.4",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/kugm30qom9gm",
    streamUrl: "https://filemoon.sx/e/kugm30qom9gm",
    poster: "/posters/movie-hobbit-battle-five-armies-2014.jpg",
    backdrop: "/posters/movie-hobbit-battle-five-armies-2014.jpg",
    overview: "تشتعل ملحمة عسكرية كبرى عندما تتوحد شعوب الأرض الوسطى من أقزام وجن وبشر لمواجهة جيوش الأورك الشريرة عند سفح الجبل الوحيد.",
    actors: ["مارتن فريمان", "Martin Freeman", "إيان ماكيلين", "ريتشارد أرميتاج", "لوك إيفانز"]
  },
  {
    id: "movie-black-panther-2018",
    title: "فيلم النمر الأسود (2018) Black Panther مترجم",
    originalTitle: "Black Panther (2018)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 14 دقيقة",
    genre: "أكشن • مغامرات • خيال علمي مارفل",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2018",
    rating: "7.3",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    streamUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    poster: "/posters/movie-black-panther-2018.jpg",
    backdrop: "/posters/movie-black-panther-2018.jpg",
    overview: "يعود تيشالا إلى بلاده واكاندا المتطورة بعد وفاة والده ليتولى العرش ملكاً ومدافعاً عن شعبه تحت قناع النمر الأسود ويساعده العميل روس.",
    actors: ["مارتن فريمان", "Martin Freeman", "تشادويك بوسمان", "مايكل بي جوردن", "لوبيتا نيونغو", "داناي غوريرا"]
  },

  // ================= Eddie Redmayne (إيدي ريدماين) =================
  {
    id: "movie-fantastic-beasts-1-2016",
    title: "فيلم وحوش مذهلة وأين تجدها (2016) Fantastic Beasts and Where to Find Them مترجم",
    originalTitle: "Fantastic Beasts and Where to Find Them (2016)",
    type: "movie",
    category: "adventure",
    duration: "ساعتان و 12 دقيقة",
    genre: "فانتازيا • مغامرات • سحر هاري بوتر",
    subGenre: "adventure",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2016",
    rating: "7.2",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-fantastic-beasts-1-2016.jpg",
    backdrop: "/posters/movie-fantastic-beasts-1-2016.jpg",
    overview: "يصل عالم الحيوانات السحرية نيوت سكاماندر إلى نيويورك بحقيبته المليئة بالكائنات الأسطورية التي تهرب بالخطأ في شوارع المدينة عام 1926.",
    actors: ["إيدي ريدماين", "Eddie Redmayne", "كاثرين واترستون", "دان فوغلر", "كولين فاريل"]
  },
  {
    id: "movie-fantastic-beasts-2-2018",
    title: "فيلم وحوش مذهلة 2: جرائم جريندلوالد (2018) Fantastic Beasts: The Crimes of Grindelwald مترجم",
    originalTitle: "Fantastic Beasts: The Crimes of Grindelwald (2018)",
    type: "movie",
    category: "adventure",
    duration: "ساعتان و 14 دقيقة",
    genre: "فانتازيا • مغامرات • إثارة",
    subGenre: "adventure",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2018",
    rating: "6.5",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-fantastic-beasts-2-2018.jpg",
    backdrop: "/posters/movie-fantastic-beasts-2-2018.jpg",
    overview: "يهرب الساحر الشرير جيليرت جريندلوالد من السجن ويبدأ في حشد أتباعه لفرض سيطرة السحرة على العالم، فيتحالف نيوت مع دمبلدور لمواجهته.",
    actors: ["إيدي ريدماين", "Eddie Redmayne", "جوني ديب", "Johnny Depp", "جود لو", "كاثرين واترستون"]
  },
  {
    id: "movie-fantastic-beasts-3-2022",
    title: "فيلم وحوش مذهلة 3: أسرار دمبلدور (2022) Fantastic Beasts: The Secrets of Dumbledore مترجم",
    originalTitle: "Fantastic Beasts: The Secrets of Dumbledore (2022)",
    type: "movie",
    category: "adventure",
    duration: "ساعتان و 22 دقيقة",
    genre: "فانتازيا • مغامرات • دراما",
    subGenre: "adventure",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2022",
    rating: "6.2",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/kugm30qom9gm",
    streamUrl: "https://filemoon.sx/e/kugm30qom9gm",
    poster: "/posters/movie-fantastic-beasts-3-2022.jpg",
    backdrop: "/posters/movie-fantastic-beasts-3-2022.jpg",
    overview: "يعهد البروفيسور ألباس دمبلدور إلى نيوت سكاماندر بقيادة فريق من السحرة الشجعان لمنع جريندلوالد من الاستيلاء على قيادة العالم السحري.",
    actors: ["إيدي ريدماين", "Eddie Redmayne", "جود لو", "مادس ميكلسن", "عزرا ميلر"]
  },
  {
    id: "movie-theory-of-everything-2014",
    title: "فيلم نظرية كل شيء (2014) The Theory of Everything مترجم",
    originalTitle: "The Theory of Everything (2014)",
    type: "movie",
    category: "drama",
    duration: "ساعتان و 3 دقائق",
    genre: "سيرة ذاتية • دراما • رومانسي",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2014",
    rating: "7.7",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    streamUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    poster: "/posters/movie-theory-of-everything-2014.jpg",
    backdrop: "/posters/movie-theory-of-everything-2014.jpg",
    overview: "قصة ملهمة عن حياة عالم الفيزياء الشهير ستيفن هوكينغ وحبه لزوجته جين واكتشافاته العلمية الرائدة رغم صراعه الشرس مع مرض التصلب الجانبي.",
    actors: ["إيدي ريدماين", "Eddie Redmayne", "فيليسيتي جونز", "Felicity Jones", "تشارلي كوكس", "ديفيد ثيوليس"]
  },

  // ================= Felicity Jones (فيليسيتي جونز) =================
  {
    id: "movie-rogue-one-2016",
    title: "فيلم روج ون: قصة من حرب النجوم (2016) Rogue One: A Star Wars Story مترجم",
    originalTitle: "Rogue One: A Star Wars Story (2016)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 13 دقيقة",
    genre: "أكشن • خيال علمي • مغامرات فضاء",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2016",
    rating: "7.8",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-rogue-one-2016.jpg",
    backdrop: "/posters/movie-rogue-one-2016.jpg",
    overview: "تقود جين إرسو مجموعة بطولية من المقاومين في مهمة انتحارية محفوفة بالمخاطر لسرقة مخططات نجمة الموت، سلاح الإمبراطورية الأكثر تدميراً.",
    actors: ["فيليسيتي جونز", "Felicity Jones", "دييغو لونا", "بين مندلسون", "مادس ميكلسن", "فورست ويتكر"]
  },
  {
    id: "movie-inferno-2016",
    title: "فيلم جحيم (2016) Inferno مترجم",
    originalTitle: "Inferno (2016)",
    type: "movie",
    category: "action",
    duration: "ساعتان و دقيقة",
    genre: "غموض • إثارة • مغامرات",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2016",
    rating: "6.2",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-inferno-2016.jpg",
    backdrop: "/posters/movie-inferno-2016.jpg",
    overview: "يستيقظ البروفيسور روبرت لانغدون في مستشفى إيطالي فاقداً للذاكرة، وتساعده الطبيبة سيينا بروكس في حل رموز دانتي لمنع نشر وباء عالمي مميت.",
    actors: ["فيليسيتي جونز", "Felicity Jones", "توم هانكس", "عرفان خان", "عمر سي"]
  },

  // ================= Ana de Armas (آنا دي أرماس) =================
  {
    id: "movie-ballerina-2025",
    title: "فيلم جون ويك: باليرينا (2025) From the World of John Wick: Ballerina مترجم",
    originalTitle: "Ballerina (2025)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 4 دقائق",
    genre: "أكشن • إثارة • عالم جون ويك",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2025",
    rating: "8.3",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-ballerina-2025.jpg",
    backdrop: "/posters/movie-ballerina-2025.jpg",
    overview: "قاتلة مأجورة شابة تتدرب في مدرسة الباليه الروسية الغامضة التابعة لعالم جون ويك، تنطلق في رحلة انتقام دموية ضد قتلة عائلتها.",
    actors: ["آنا دي أرماس", "Ana de Armas", "كيانو ريفز", "Keanu Reeves", "إيان ماكشين", "أنجيليكا هيوستن"]
  },
  {
    id: "movie-knives-out-2019",
    title: "فيلم أخرجوا السكاكين (2019) Knives Out مترجم",
    originalTitle: "Knives Out (2019)",
    type: "movie",
    category: "drama",
    duration: "ساعتان و 10 دقائق",
    genre: "غموض • كوميديا سوداء • جريمة",
    subGenre: "crime",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2019",
    rating: "7.9",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-knives-out-2019.jpg",
    backdrop: "/posters/movie-knives-out-2019.jpg",
    overview: "يحقق المحقق العبقري بينوا بلانك في الموت الغامض لكبير عائلة ثرية وكاتب الروايات البوليسية هارجريف، وسط شبكة من الأكاذيب والمؤامرات.",
    actors: ["آنا دي أرماس", "Ana de Armas", "دانيال كريج", "كريس إيفانز", "جيمي لي كورتيس"]
  },
  {
    id: "movie-no-time-to-die-2021",
    title: "فيلم لا وقت للموت (2021) No Time to Die مترجم",
    originalTitle: "No Time to Die (2021)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 43 دقيقة",
    genre: "أكشن • تجسس • إثارة جيمس بوند",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2021",
    rating: "7.3",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/kugm30qom9gm",
    streamUrl: "https://filemoon.sx/e/kugm30qom9gm",
    poster: "/posters/movie-no-time-to-die-2021.jpg",
    backdrop: "/posters/movie-no-time-to-die-2021.jpg",
    overview: "يقطع جيمس بوند تقاعده الهادئ في جامايكا لمساعدة صديقه في وكالة المخابرات المركزية لإنقاذ عالم مختطف ومواجهة شرير غامض مسلح بتكنولوجيا بيولوجية مدمرة.",
    actors: ["آنا دي أرماس", "Ana de Armas", "دانيال كريج", "رامي مالك", "ليا سيدو", "لاشانا لينش"]
  },
  {
    id: "movie-the-gray-man-2022",
    title: "فيلم الرجل الرمادي (2022) The Gray Man مترجم",
    originalTitle: "The Gray Man (2022)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 2 دقيقة",
    genre: "أكشن • تشويق • تجسس هوليوود",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2022",
    rating: "6.5",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    streamUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    poster: "/posters/movie-the-gray-man-2022.jpg",
    backdrop: "/posters/movie-the-gray-man-2022.jpg",
    overview: "يكشف عميل المخابرات المركزية المعروف بـ سييرا سيكس أسراراً مظلمة للوكالة، ليصبح هدفاً لمطاردة عالمية يقودها قاتل سيكوباتي لا يرحم.",
    actors: ["آنا دي أرماس", "Ana de Armas", "ريان غوسلينغ", "كريس إيفانز", "دانوش", "بيلي بوب ثورنتون"]
  },

  // ================= Song Hye-kyo (سونغ هي كيو) =================
  {
    id: "movie-the-grandmaster-2013",
    title: "فيلم المعلم الأكبر (2013) The Grandmaster مترجم",
    originalTitle: "The Grandmaster (2013)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 10 دقائق",
    genre: "فنون قتالية • سيرة ذاتية • دراما آسيوية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2013",
    rating: "6.6",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/kugm30qom9gm",
    streamUrl: "https://filemoon.sx/e/kugm30qom9gm",
    poster: "/posters/movie-the-grandmaster-2013.jpg",
    backdrop: "/posters/movie-the-grandmaster-2013.jpg",
    overview: "ملحمة سينمائية بصرية تستعرض سيرة معلم الكونغ فو الأسطوري ييب مان خلال العصر الذهبي للفنون القتالية في الصين، مع أداء استثنائي لـ سونغ هي كيو.",
    actors: ["سونغ هي كيو", "Song Hye-kyo", "توني لونغ", "تشانغ تسي يي", "تشانغ تشن"]
  },
  {
    id: "series-the-glory-2022-ep1",
    title: "مسلسل مجد الانتقام (2022) The Glory مترجم - الحلقة 1",
    originalTitle: "The Glory S01E01",
    type: "series",
    category: "series",
    duration: "52 دقيقة",
    genre: "دراما • إثارة • مسلسلات كورية نيتفلكس",
    subGenre: "drama",
    badge: "الحلقة 1",
    quality: "1080p FHD",
    year: "2022",
    rating: "8.1",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/series-the-glory-2022-ep1.jpg",
    backdrop: "/posters/series-the-glory-2022-ep1.jpg",
    overview: "امرأة شابة تعرضت لعنف وتنمر مدرسي مروع تخطط لسنوات طويلة لخطة انتقام دقيقة ومتقنة لمعاقبة كل من دمروا حياتها في طفولتها.",
    actors: ["سونغ هي كيو", "Song Hye-kyo", "لي دو هيون", "ليم جي يون", "بارك سونغ هون"]
  },
  {
    id: "series-descendants-of-the-sun-2016-ep1",
    title: "مسلسل أحفاد الشمس (2016) Descendants of the Sun مترجم - الحلقة 1",
    originalTitle: "Descendants of the Sun S01E01",
    type: "series",
    category: "series",
    duration: "59 دقيقة",
    genre: "رومانسي • دراما • أكشن كوري أسطوري",
    subGenre: "drama",
    badge: "الحلقة 1",
    quality: "1080p FHD",
    year: "2016",
    rating: "8.2",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/series-descendants-of-the-sun-2016-ep1.jpg",
    backdrop: "/posters/series-descendants-of-the-sun-2016-ep1.jpg",
    overview: "قصة حب قوية ومؤثرة تنشأ بين قائد قوات خاصة بالجيش الكوري وطبيبة جراحة في بلد مزقته الحروب والكوارث الإنسانية.",
    actors: ["سونغ هي كيو", "Song Hye-kyo", "سونغ جونغ كي", "جين غو", "كيم جي وون"]
  },

  // ================= Turkish Stars (كيفانش، بيرين، هاندا) =================
  {
    id: "movie-butterflys-dream-2013",
    title: "فيلم حلم فراشة (2013) The Butterfly's Dream (Kelebeğin Rüyası) مترجم",
    originalTitle: "Kelebeğin Rüyası (2013)",
    type: "movie",
    category: "drama",
    duration: "ساعتان و 18 دقيقة",
    genre: "دراما • رومانسي • تاريخي تركي",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2013",
    rating: "7.7",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-butterflys-dream-2013.jpg",
    backdrop: "/posters/movie-butterflys-dream-2013.jpg",
    overview: "في بلدة تعدين تركية خلال الحرب العالمية الثانية، يحاول شاعران شابان ومصابان بمرض السل التغلب على قسوة الحياة والتنافس على حب فتاة حسناء بأشعارهما.",
    actors: ["كيفانش تاتليتوغ", "Kıvanç Tatlıtuğ", "ميرت فرات", "بلين بيلجين", "يلماز أردوغان"]
  },
  {
    id: "movie-pains-of-autumn-2009",
    title: "فيلم آلام الخريف (2009) Pains of Autumn (Güz Sancısı) مترجم",
    originalTitle: "Güz Sancısı (2009)",
    type: "movie",
    category: "drama",
    duration: "ساعة و 52 دقيقة",
    genre: "دراما • رومانسي • سينما تركية كلاسيكية",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2009",
    rating: "6.3",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-pains-of-autumn-2009.jpg",
    backdrop: "/posters/movie-pains-of-autumn-2009.jpg",
    overview: "قصة حب مؤثرة تجمع بين شاب تركي مثالي وفتاة يونانية حسناء تعيش في إسطنبول وسط توترات سياسية وعرقية عاصفة في خريف عام 1955.",
    actors: ["بيرين سات", "Beren Saat", "مراد يلدريم", "أوكان يالابيك"]
  },
  {
    id: "movie-mesti-ask-2024",
    title: "فيلم سكران بالحب (2024) Intoxicated by Love (Mest-i Aşk) مترجم",
    originalTitle: "Mest-i Aşk (2024)",
    type: "movie",
    category: "drama",
    duration: "ساعة و 45 دقيقة",
    genre: "تاريخي • دراما • رومانسي ملحمي",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2024",
    rating: "7.0",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/kugm30qom9gm",
    streamUrl: "https://filemoon.sx/e/kugm30qom9gm",
    poster: "/posters/movie-mesti-ask-2024.jpg",
    backdrop: "/posters/movie-mesti-ask-2024.jpg",
    overview: "عمل سينمائي ملحمي تاريخي يتناول العلاقة الفلسفية والصوفية بين جلال الدين الرومي وشمس التبريزي، بمشاركة النجمة هاندا أرتشيل.",
    actors: ["هاندا أرتشيل", "Hande Erçel", "بارس بيتيكياشا", "شاهاب حسيني", "بوران كوزوم"]
  },

  // ================= Arabic Cinema Stars (منى زكي، أحمد عز، كريم عبد العزيز) =================
  {
    id: "movie-flight-404-2024",
    title: "فيلم رحلة 404 (2024) Flight 404 بطولة منى زكي",
    originalTitle: "Flight 404 (2024)",
    type: "movie",
    category: "arabic",
    duration: "ساعة و 45 دقيقة",
    genre: "دراما • إثارة • سينما عربية حديثة",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2024",
    rating: "7.8",
    origin: "arabic",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-flight-404-2024.jpg",
    backdrop: "/posters/movie-flight-404-2024.jpg",
    overview: "قبل أيام من سفرها لأداء فريضة الحج، تتورط غادة في مشكلة طارئة تجبرها على التواصل مع أشخاص من ماضيها المظلم لجمع مبلغ كبير من المال.",
    actors: ["منى زكي", "Mona Zaki", "محمد ممدوح", "محمد فراج", "شيرين رضا", "خالد الصاوي"]
  },
  {
    id: "movie-men-30-sana-2016",
    title: "فيلم من 30 سنة (2016) بطولة منى زكي وأحمد السقا",
    originalTitle: "Men 30 Sana (2016)",
    type: "movie",
    category: "arabic",
    duration: "ساعتان و 12 دقيقة",
    genre: "دراما • غموض • إثارة عربية",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2016",
    rating: "7.2",
    origin: "arabic",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-men-30-sana-2016.jpg",
    backdrop: "/posters/movie-men-30-sana-2016.jpg",
    overview: "يعود عمر من بريطانيا بثروة طائلة ويقرر تقسيمها على أفراد عائلته، لكن كابوساً غامضاً وسلسلة وفيات تلاحق الورثة واحداً تلو الآخر.",
    actors: ["منى زكي", "Mona Zaki", "أحمد السقا", "شريف منير", "نور", "ميرفت أمين"]
  },
  {
    id: "movie-welad-rizk-3-2024",
    title: "فيلم ولاد رزق 3: القاضية (2024) بطولة أحمد عز",
    originalTitle: "Welad Rizk 3: El Qadya (2024)",
    type: "movie",
    category: "arabic",
    duration: "ساعة و 58 دقيقة",
    genre: "أكشن • جريمة • كوميديا عربية ملحمية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2024",
    rating: "8.0",
    origin: "arabic",
    embedUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    streamUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    poster: "/posters/movie-welad-rizk-3-2024.jpg",
    backdrop: "/posters/movie-welad-rizk-3-2024.jpg",
    overview: "بعد سنوات من الانفصال، يعود الأشقاء رضا وربيع ورمضان لخوض عملية سرقة عالمية كبرى في الرياض بالمملكة العربية السعودية وسط مطاردات غير مسبوقة.",
    actors: ["أحمد عز", "Ahmed Ezz", "عمرو يوسف", "كريم قاسم", "آسر ياسين", "محمد ممدوح", "إياد نصار"]
  },
  {
    id: "movie-kira-and-el-gin-2022",
    title: "فيلم كيرة والجن (2022) بطولة كريم عبد العزيز وأحمد عز",
    originalTitle: "Kira & El Gin (2022)",
    type: "movie",
    category: "arabic",
    duration: "ساعتان و 55 دقيقة",
    genre: "أكشن • دراما تاريخية • سينما مصرية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2022",
    rating: "8.1",
    origin: "arabic",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-kira-and-el-gin-2022.jpg",
    backdrop: "/posters/movie-kira-and-el-gin-2022.jpg",
    overview: "ملحمة وطنية ترصد قصص المقاومة الشعبية ضد الاحتلال الإنجليزي في مصر إبان ثورة 1919 من خلال بطولات أحمد عبد الحي كيرة وعبد القادر الجن.",
    actors: ["كريم عبد العزيز", "Karim Abdel Aziz", "أحمد عز", "Ahmed Ezz", "هند صبري", "سيد رجب", "أحمد مالك"]
  },
  {
    id: "movie-the-blue-elephant-2-2019",
    title: "فيلم الفيل الأزرق 2 (2019) بطولة كريم عبد العزيز",
    originalTitle: "The Blue Elephant 2 (2019)",
    type: "movie",
    category: "arabic",
    duration: "ساعتان و 10 دقائق",
    genre: "غموض • رعب نفسي • إثارة وتشويق",
    subGenre: "thriller",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2019",
    rating: "8.0",
    origin: "arabic",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-the-blue-elephant-2-2019.jpg",
    backdrop: "/posters/movie-the-blue-elephant-2-2019.jpg",
    overview: "بعد 5 سنوات من أحداث الجزء الأول، يستدعى الدكتور يحيى راشد إلى قسم الحالات الخطرة لمتابعة نزيلة جديدة تتلاعب بحياته الأسرية وتثير الرعب.",
    actors: ["كريم عبد العزيز", "Karim Abdel Aziz", "هند صبري", "نيللي كريم", "إياد نصار", "تارا عماد"]
  },

  // ================= Jenna Ortega (جينا أورتيجا) =================
  {
    id: "movie-scream-5-2022",
    title: "فيلم الصرخة (2022) Scream مترجم بطولة جينا أورتيجا",
    originalTitle: "Scream (2022)",
    type: "movie",
    category: "horror",
    duration: "ساعة و 54 دقيقة",
    genre: "رعب • غموض • إثارة هوليوود",
    subGenre: "horror",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2022",
    rating: "6.3",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-scream-5-2022.jpg",
    backdrop: "/posters/movie-scream-5-2022.jpg",
    overview: "بعد مرور خمسة وعشرين عاماً على المجازر الأولى في بلدة وودسبورو، يرتدي قاتل جديد قناع الشبح ويبدأ في استهداف مجموعة من المراهقين المرتبطين بالقتلة السابقين.",
    actors: ["جينا أورتيجا", "Jenna Ortega", "ميليسا باريرا", "نيف كامبل", "ديفيد أركيت", "كورتني كوكس"]
  },
  {
    id: "movie-millers-girl-2024",
    title: "فيلم فتاة ميلر (2024) Miller's Girl مترجم بطولة جينا أورتيجا ومارتن فريمان",
    originalTitle: "Miller's Girl (2024)",
    type: "movie",
    category: "drama",
    duration: "ساعة و 33 دقيقة",
    genre: "دراما • إثارة نفسية • تشويق",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2024",
    rating: "6.1",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-millers-girl-2024.jpg",
    backdrop: "/posters/movie-millers-girl-2024.jpg",
    overview: "مهمة كتابة إبداعية تكلف بها طالبة موهوبة تقود إلى تشابك علاقات معقدة وغامضة بينها وبين أستاذها الجامعي وتختبر حدود الصدق والأخلاق.",
    actors: ["جينا أورتيجا", "Jenna Ortega", "مارتن فريمان", "Martin Freeman", "داغمارا دومينكزيك", "باشير صلاح الدين"]
  },

  // ================= Frank Grillo & Tyrese Gibson =================
  {
    id: "movie-the-purge-anarchy-2014",
    title: "فيلم التطهير: فوضى (2014) The Purge: Anarchy مترجم بطولة فرانك جريلو",
    originalTitle: "The Purge: Anarchy (2014)",
    type: "movie",
    category: "action",
    duration: "ساعة و 43 دقيقة",
    genre: "أكشن • رعب • إثارة وتشويق",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2014",
    rating: "6.5",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-the-purge-anarchy-2014.jpg",
    backdrop: "/posters/movie-the-purge-anarchy-2014.jpg",
    overview: "في ليلة التطهير السنوية التي تصبح فيها كل الجرائم مباحة لمدة 12 ساعة، يسعى رقيب شرطة غاضب للانتقام لكنه يضطر لحماية مجموعة من الأبرياء العالقين.",
    actors: ["فرانك جريلو", "Frank Grillo", "كارمن إيجوجو", "زاك جيلفورد", "كيكي بالمر"]
  },
  {
    id: "movie-boss-level-2021",
    title: "فيلم مستوى الزعيم (2021) Boss Level مترجم بطولة فرانك جريلو",
    originalTitle: "Boss Level (2021)",
    type: "movie",
    category: "action",
    duration: "ساعة و 40 دقيقة",
    genre: "أكشن • خيال علمي • إثارة كوميدية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2021",
    rating: "6.8",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-boss-level-2021.jpg",
    backdrop: "/posters/movie-boss-level-2021.jpg",
    overview: "عميل قوات خاصة متقاعد يعيش عالقاً في حلقة زمنية مفرغة يتكرر فيها يوم مقتله باستمرار، وعليه فك لغز المؤامرة لإنقاذ عائلته وإنهاء الكابوس.",
    actors: ["فرانك جريلو", "Frank Grillo", "ميل غيبسون", "ناعومي واتس", "ميشيل يوه", "كين جونغ"]
  },
  {
    id: "movie-fast-furious-9-2021",
    title: "فيلم السرعة والغضب 9 (2021) F9: The Fast Saga مترجم بطولة تايريس جيبسون",
    originalTitle: "F9: The Fast Saga (2021)",
    type: "movie",
    category: "action",
    duration: "ساعتان و 23 دقيقة",
    genre: "أكشن • سيارات • مغامرات هوليوود",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2021",
    rating: "6.2",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/kugm30qom9gm",
    streamUrl: "https://filemoon.sx/e/kugm30qom9gm",
    poster: "/posters/movie-fast-furious-9-2021.jpg",
    backdrop: "/posters/movie-fast-furious-9-2021.jpg",
    overview: "يواجه دومينيك توريتو وفريقه المخلص الخطر الأكثر خطورة عندما يظهر شقيقه المنبوذ جاكوب بمخطط تدميري يهدد سلامة العالم بأكمله.",
    actors: ["تايريس جيبسون", "Tyrese Gibson", "فين ديزل", "ميشيل رودريغيز", "جون سينا", "لوداكريس"]
  },

  // ================= Ma Dong-seok (ما دونغ سوك) =================
  {
    id: "movie-the-roundup-no-way-out-2023",
    title: "فيلم مدينة الجريمة 3: لا مخرج (2023) The Roundup: No Way Out مترجم",
    originalTitle: "The Roundup: No Way Out (2023)",
    type: "movie",
    category: "action",
    duration: "ساعة و 45 دقيقة",
    genre: "أكشن • جريمة • فنون قتالية كورية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2023",
    rating: "7.1",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    streamUrl: "https://filemoon.sx/e/6oa0kcsdmjn5",
    poster: "/posters/movie-the-roundup-no-way-out-2023.jpg",
    backdrop: "/posters/movie-the-roundup-no-way-out-2023.jpg",
    overview: "ينتقل المحقق الخارق ما سيوك-دو إلى فرقة التحقيقات الجنائية الإقليمية لمطاردة شبكة يابانية شريرة تروج لمخدر صناعي خطير في سول.",
    actors: ["ما دونغ سوك", "Ma Dong-seok", "لي جون هيوك", "مونيتوكا أوكي"]
  },
  {
    id: "movie-gangster-cop-devil-2019",
    title: "فيلم العصابة، الشرطي، الشيطان (2019) The Gangster, the Cop, the Devil مترجم",
    originalTitle: "The Gangster, the Cop, the Devil (2019)",
    type: "movie",
    category: "action",
    duration: "ساعة و 50 دقيقة",
    genre: "أكشن • جريمة • إثارة كورية",
    subGenre: "action",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2019",
    rating: "7.0",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/kugm30qom9gm",
    streamUrl: "https://filemoon.sx/e/kugm30qom9gm",
    poster: "/posters/movie-gangster-cop-devil-2019.jpg",
    backdrop: "/posters/movie-gangster-cop-devil-2019.jpg",
    overview: "يتحالف زعيم عصابة نجى بأعجوبة من محاولة اغتيال مع شرطي عنيد ومتحمس للقبض على قاتل متسلسل سادي يروع أرجاء البلاد.",
    actors: ["ما دونغ سوك", "Ma Dong-seok", "كيم مو يول", "كيم سونغ كيو"]
  },

  // ================= Shah Rukh Khan & Deepika Padukone =================
  {
    id: "movie-chennai-express-2013",
    title: "فيلم قطار تشيناي السريع (2013) Chennai Express مترجم بطولة شاروخان وديبيكا بادوكون",
    originalTitle: "Chennai Express (2013)",
    type: "movie",
    category: "comedy",
    duration: "ساعتان و 21 دقيقة",
    genre: "كوميديا • أكشن • رومانسي بوليوود",
    subGenre: "comedy",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2013",
    rating: "6.2",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    streamUrl: "https://filemoon.sx/e/bvrpgrkridxt",
    poster: "/posters/movie-chennai-express-2013.jpg",
    backdrop: "/posters/movie-chennai-express-2013.jpg",
    overview: "يسافر راهول في قطار إلى راميشوارام لتحقيق أمنية جده الأخيرة، لكنه يلتقي بابنة زعيم عصابة جنوب الهند وتبدأ مغامرة فكاهية ومليئة بالحركة.",
    actors: ["شاروخان", "Shah Rukh Khan", "ديبيكا بادوكون", "Deepika Padukone", "نيكيتين دهير"]
  },
  {
    id: "movie-om-shanti-om-2007",
    title: "فيلم أوم شانتي أوم (2007) Om Shanti Om مترجم بطولة شاروخان وديبيكا بادوكون",
    originalTitle: "Om Shanti Om (2007)",
    type: "movie",
    category: "drama",
    duration: "ساعتان و 49 دقيقة",
    genre: "دراما • رومانسي • استعراضي كلاسيكي",
    subGenre: "drama",
    badge: "1080p FHD",
    quality: "1080p FHD",
    year: "2007",
    rating: "7.4",
    origin: "foreign",
    embedUrl: "https://filemoon.sx/e/psbenbp1btkr",
    streamUrl: "https://filemoon.sx/e/psbenbp1btkr",
    poster: "/posters/movie-om-shanti-om-2007.jpg",
    backdrop: "/posters/movie-om-shanti-om-2007.jpg",
    overview: "كومبارس شاب يحلم بالشهرة يعشق نجمة سينمائية لامعة ويموت محاولاً إنقاذها، ليولد من جديد في هيئة ابن منتج شهير ويسعى للانتقام لموتها.",
    actors: ["شاروخان", "Shah Rukh Khan", "ديبيكا بادوكون", "Deepika Padukone", "أرجون رامبال", "كيرين خير"]
  }
];

// Helper to escape SVG XML text
function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generatePoster(title, year, rating, genre, outFilename) {
  const destPath = path.join(postersDir, outFilename);
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 2000) {
    return;
  }

  // Pick rich color palettes
  const colorSchemes = [
    { c1: '#0d1b2a', c2: '#1b263b', acc: '#e0a96d' },
    { c1: '#140152', c2: '#02010a', acc: '#f39c12' },
    { c1: '#1f1a3a', c2: '#0b0914', acc: '#e74c3c' },
    { c1: '#0f2027', c2: '#203a43', acc: '#00adb5' },
    { c1: '#2c003e', c2: '#15001f', acc: '#f368e0' },
    { c1: '#1e272e', c2: '#050505', acc: '#ffd32a' }
  ];
  const scheme = colorSchemes[Math.abs(title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colorSchemes.length];

  // Truncate title for 2-line rendering
  const cleanTitle = title.replace(/مترجم|مدبلج|فيلم|مسلسل|\(20\d\d\)|\(19\d\d\)/g, '').trim();
  const words = cleanTitle.split(/\s+/);
  let line1 = words.slice(0, 4).join(' ');
  let line2 = words.slice(4, 9).join(' ');

  const width = 600;
  const height = 900;

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${scheme.c1}" />
        <stop offset="50%" stop-color="${scheme.c2}" />
        <stop offset="100%" stop-color="#05070a" />
      </linearGradient>
      <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.3" />
        <stop offset="60%" stop-color="#000000" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.95" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Main Background -->
    <rect width="${width}" height="${height}" fill="url(#bg)" />

    <!-- Cinema Grid & Accents -->
    <circle cx="300" cy="360" r="210" fill="none" stroke="${scheme.acc}" stroke-width="1.5" stroke-dasharray="6,6" opacity="0.3" />
    <circle cx="300" cy="360" r="160" fill="none" stroke="${scheme.acc}" stroke-width="1" opacity="0.4" />
    <circle cx="300" cy="360" r="80" fill="${scheme.acc}" fill-opacity="0.08" />

    <!-- Center Cinema Icon Silhouette -->
    <g transform="translate(260, 320)" fill="${scheme.acc}" opacity="0.85">
      <path d="M12 4v16l28-8z" />
    </g>

    <!-- Vignette / Dark Overlay -->
    <rect width="${width}" height="${height}" fill="url(#overlay)" />

    <!-- Cinema Border Frame -->
    <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="16" fill="none" stroke="${scheme.acc}" stroke-width="2" opacity="0.4" />
    <rect x="28" y="28" width="${width - 56}" height="${height - 56}" rx="12" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.15" />

    <!-- Header Badges -->
    <rect x="40" y="45" width="105" height="34" rx="8" fill="#e50914" />
    <text x="92" y="68" fill="#ffffff" font-family="'Cairo', sans-serif" font-size="14" font-weight="bold" text-anchor="middle">1080p FHD</text>

    <rect x="${width - 150}" y="45" width="110" height="34" rx="8" fill="#111827" stroke="${scheme.acc}" stroke-width="1" />
    <text x="${width - 95}" y="68" fill="${scheme.acc}" font-family="'Cairo', sans-serif" font-size="14" font-weight="bold" text-anchor="middle">★ ${escapeXml(rating)}</text>

    <!-- Year Badge -->
    <text x="300" y="70" fill="#94a3b8" font-family="'Cairo', sans-serif" font-size="16" font-weight="bold" text-anchor="middle">${escapeXml(year)}</text>

    <!-- Lower Section: Titles & Info -->
    <text x="300" y="710" fill="#ffffff" font-family="'Cairo', sans-serif" font-size="28" font-weight="900" text-anchor="middle">
      ${escapeXml(line1)}
    </text>
    ${line2 ? `<text x="300" y="755" fill="#f1f5f9" font-family="'Cairo', sans-serif" font-size="24" font-weight="bold" text-anchor="middle">${escapeXml(line2)}</text>` : ''}

    <!-- Genre & Origin -->
    <text x="300" y="805" fill="${scheme.acc}" font-family="'Cairo', sans-serif" font-size="16" font-weight="600" text-anchor="middle">
      ${escapeXml(genre)}
    </text>

    <!-- Golden Footer Brand Badge -->
    <g transform="translate(225, 830)">
      <rect width="150" height="28" rx="14" fill="#030712" stroke="${scheme.acc}" stroke-width="1" opacity="0.8" />
      <text x="75" y="19" fill="#e2e8f0" font-family="'Cairo', sans-serif" font-size="12" font-weight="bold" text-anchor="middle">TICKET CINEMA VIP</text>
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
  console.log("🚀 Adding Top Star Expanded Filmography");
  console.log(`Current items in catalog: ${catalog.length}`);
  console.log("=========================================");

  let addedCount = 0;
  for (const m of NEW_STAR_MOVIES) {
    if (!existingIds.has(m.id)) {
      catalog.push(m);
      existingIds.add(m.id);
      addedCount++;

      // Generate poster file
      const filename = path.basename(m.poster);
      await generatePoster(m.title, m.year, m.rating, m.genre, filename);
    }
  }

  console.log(`Added ${addedCount} new blockbuster star films.`);
  console.log(`New total items in catalog: ${catalog.length}`);

  // Write updated files
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log("Updated public/catalog.json");

  fs.writeFileSync(curatedPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log("Updated public/curated_catalog.json");

  const jsContent = `window.CURATED_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`;
  fs.writeFileSync(catalogJsPath, jsContent, 'utf8');
  console.log("Updated public/catalog.js");

  // Sync to dist-hd-perfect
  if (!fs.existsSync('dist-hd-perfect')) {
    fs.mkdirSync('dist-hd-perfect', { recursive: true });
  }
  fs.copyFileSync(catalogPath, 'dist-hd-perfect/catalog.json');
  fs.copyFileSync(curatedPath, 'dist-hd-perfect/curated_catalog.json');
  fs.copyFileSync(catalogJsPath, 'dist-hd-perfect/catalog.js');

  // Copy all new posters to dist-hd-perfect/posters
  if (!fs.existsSync('dist-hd-perfect/posters')) {
    fs.mkdirSync('dist-hd-perfect/posters', { recursive: true });
  }
  for (const m of NEW_STAR_MOVIES) {
    const filename = path.basename(m.poster);
    const src = path.join(postersDir, filename);
    const dst = path.join('dist-hd-perfect/posters', filename);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
    }
  }
  console.log("Synced to dist-hd-perfect");
}

main().catch(console.error);
