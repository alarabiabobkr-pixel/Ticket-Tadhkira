const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const batchList = [
  {
    rawTitle: "The Aviator 2004 1080p BluRay AKWAM",
    code: "cjn5ely7ae3i",
    title: "فيلم الطيار (2004) The Aviator مترجم",
    year: "2004",
    duration: "ساعتين و 50 دقيقة",
    genre: "سيرة ذاتية • دراما • هوليوود",
    subGenre: "drama",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.4",
    actors: ["ليوناردو دي كابريو", "Leonardo DiCaprio", "كيت بلانشيت", "Cate Blanchett"],
    overview: "سيرة حياة الملياردير والطيار الأسطوري هاوارد هيوز وإنجازاته في عالم الطيران وصناعة السينما ومعاناته النفسية الخاصة.",
    searchQuery: "The Aviator 2004"
  },
  {
    rawTitle: "John Wick Chapter 4 2023 BluRay 1080p AKWAM",
    code: "ybl52mt5rjwd",
    title: "فيلم جون ويك 4 (2023) John Wick: Chapter 4 مترجم",
    year: "2023",
    duration: "ساعتين و 49 دقيقة",
    genre: "أكشن • تشويق وإثارة • جريمة",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.7",
    actors: ["كيانو ريفز", "Keanu Reeves", "دوني ين", "Donnie Yen", "بيل سكارسغارد"],
    overview: "يواجه جون ويك أكثر أعدائه فتكاً حتى الآن في معركة ملحمية حول العالم لكسب حريته من المجلس الأعلى للجريمة.",
    searchQuery: "John Wick Chapter 4"
  },
  {
    rawTitle: "Killers Of The Flower Moon 2023 1080p WEB-DL akwam",
    code: "5sslysnod9ct",
    title: "فيلم قتلة زهرة القمر (2023) Killers of the Flower Moon مترجم",
    year: "2023",
    duration: "3 ساعات و 26 دقيقة",
    genre: "جريمة • دراما • تاريخي",
    subGenre: "crime",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.5",
    actors: ["ليوناردو دي كابريو", "Leonardo DiCaprio", "روبرت دي نيرو", "Robert De Niro", "ليلي جلادستون"],
    overview: "تحقيق فيدرالي يقوده مكتب التحقيقات في سلسلة اغتيالات غامضة استهدفت أفراد قبيلة أوساج الغنية بالنفط في أوكلاهوما خلال عشرينيات القرن العشرين.",
    searchQuery: "Killers of the Flower Moon"
  },
  {
    rawTitle: "Tiger 3 2023 1080P WEB-DL AKWAM",
    code: "s78aw4npb1hc",
    title: "فيلم تايجر 3 (2023) Tiger 3 مترجم",
    year: "2023",
    duration: "ساعتين و 36 دقيقة",
    genre: "أكشن • إثارة • بوليوود",
    subGenre: "action",
    origin: "indian",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["سلمان خان", "Salman Khan", "كاترينا كيف", "Katrina Kaif", "عمران هاشمي"],
    overview: "ينطلق العميل السري تايجر وزوجته زويا في مهمة حياة أو موت لتبرئة اسميهما بعد اتهامهما بالخيانة الوطنية من قبل إرهابي خطير.",
    searchQuery: "Tiger 3 2023"
  },
  {
    rawTitle: "This Boys Life 1993 1080p BluRay AKWAM",
    code: "4oj3tn25hm6v",
    title: "فيلم حياة هذا الفتى (1993) This Boy's Life مترجم",
    year: "1993",
    duration: "ساعة و 55 دقيقة",
    genre: "دراما • سيرة ذاتية • كلاسيكيات",
    subGenre: "drama",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.9",
    actors: ["روبرت دي نيرو", "Robert De Niro", "ليوناردو دي كابريو", "Leonardo DiCaprio"],
    overview: "صراع عائلي محتدم بين فتى مراهق متمرد وزوج والدته الصارم والمتسلط في بلدة صغيرة نائية خلال الخمسينيات.",
    searchQuery: "This Boy's Life 1993"
  },
  {
    rawTitle: "Jawan Extended Cut 2023 1080p NF WEB-DL akwam us",
    code: "pm62okxneeyc",
    title: "فيلم جوان النسخة الكاملة (2023) Jawan Extended Cut مترجم",
    year: "2023",
    duration: "3 ساعات",
    genre: "أكشن • تشويق • بوليوود",
    subGenre: "action",
    origin: "indian",
    quality: "1080p FHD",
    rating: "8.4",
    actors: ["شاروخان", "Shah Rukh Khan", "ديبيكا بادوكون", "Deepika Padukone", "نايانتارا"],
    overview: "يقود رجل مدفوع برغبة عارمة في العدالة الاجتماعية جيشاً نسائياً لمعاقبة الفاسدين وتصحيح أخطاء المجتمع في مواجهة تاجر سلاح عديم الرحمة.",
    searchQuery: "Jawan 2023"
  },
  {
    rawTitle: "Dunki 2023 1080p WEB-DL AKWAM",
    code: "m21916f35m4g",
    title: "فيلم دانكي (2023) Dunki مترجم",
    year: "2023",
    duration: "ساعتين و 41 دقيقة",
    genre: "كوميديا • دراما • بوليوود",
    subGenre: "comedy",
    origin: "indian",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["شاروخان", "Shah Rukh Khan", "تابسي بانو", "Taapsee Pannu", "بومان إيراني"],
    overview: "رحلة ملحمية ومؤثرة لأربعة أصدقاء من البنجاب يسعون لتحقيق حلم الهجرة إلى إنجلترا عبر طريق غير شرعي محفوف بالمخاطر.",
    searchQuery: "Dunki 2023"
  },
  {
    rawTitle: "The Beekeeper 2024 1080p WEB AKWAM",
    code: "ao4nrwrk26dw",
    title: "فيلم النحال (2024) The Beekeeper مترجم",
    year: "2024",
    duration: "ساعة و 45 دقيقة",
    genre: "أكشن • تشويق وإثارة • انتقام",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["جيسون ستاثام", "Jason Statham", "إيمي رافر لامبمان", "جوش هاتشرسون"],
    overview: "حملة انتقامية ضارية يشنها عميل سابق في منظمة سرية نخبوية تدعى النحالون بعد انتحار صديقته المقربة إثر تعرضها لعملية احتيال إلكتروني واسعة.",
    searchQuery: "The Beekeeper 2024"
  },
  {
    rawTitle: "Revolutionary Road 2008 Bluray 1080p AKWAM",
    code: "933ibohiwxz0",
    title: "فيلم الطريق الثوري (2008) Revolutionary Road مترجم",
    year: "2008",
    duration: "ساعتين",
    genre: "دراما • رومانسي",
    subGenre: "drama",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["ليوناردو دي كابريو", "Leonardo DiCaprio", "كيت وينسلت", "Kate Winslet"],
    overview: "زوجان شابان في ضواحي كونيتيكت خلال الخمسينيات يكافحان للتأقلم مع واقعهما المحبط والروتين القاتل بينما يطمحان لحياة حرة ومختلفة في باريس.",
    searchQuery: "Revolutionary Road 2008"
  },
  {
    rawTitle: "Black Widow 2021 1080p Bluray AKWAM",
    code: "wnbcx2oynp88",
    title: "فيلم الأرملة السوداء (2021) Black Widow مترجم",
    year: "2021",
    duration: "ساعتين و 14 دقيقة",
    genre: "أكشن • خيال علمي • مارفل",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["سكارليت جوهانسون", "Scarlett Johansson", "فلورنس بيو", "Florence Pugh", "ديفيد هاربر"],
    overview: "تواجه ناتاشا رومانوف الأجزاء الأكثر قتامة في ماضيها عندما تنشأ مؤامرة خطيرة مرتبطة بأصول تدريبها كجاسوسة وقاتلة خارقة.",
    searchQuery: "Black Widow 2021"
  },
  {
    rawTitle: "Whats Eating Gilbert Grape 1993 1080p BluRay AKWAM",
    code: "86hfuss2h24m",
    title: "فيلم ما الذي يضايق غيلبرت غريب (1993) What's Eating Gilbert Grape مترجم",
    year: "1993",
    duration: "ساعة و 58 دقيقة",
    genre: "دراما • كلاسيكيات",
    subGenre: "drama",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["جوني ديب", "Johnny Depp", "ليوناردو دي كابريو", "Leonardo DiCaprio"],
    overview: "شاب مكافح يتحمل مسؤولية رعاية شقيقه المعاق ذهنياً ووالدته المفرطة في البدانة في بلدة ريفية هادئة تتغير حياته بعد لقاء فتاة متنقلة.",
    searchQuery: "What's Eating Gilbert Grape"
  },
  {
    rawTitle: "Detective Knight Redemption 2022 1080p WEB-DL AKWAM",
    code: "99qxu3w7gpob",
    title: "فيلم المحقق نايت: الفداء (2022) Detective Knight: Redemption مترجم",
    year: "2022",
    duration: "ساعة و 37 دقيقة",
    genre: "أكشن • إثارة • جريمة",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.2",
    actors: ["بروس ويليس", "Bruce Willis", "بول جوهانسون"],
    overview: "المحقق جيمس نايت يجد نفسه في خضم عملية هروب جماعي من السجن يقودها إرهابي متنكر في زي سانتا كلوز خلال موسم الأعياد.",
    searchQuery: "Detective Knight Redemption"
  },
  {
    rawTitle: "47 Ronin 2013 1080P BluRay AKWAM",
    code: "90fda5emqz6s",
    title: "فيلم 47 رونين (2013) 47 Ronin مترجم",
    year: "2013",
    duration: "ساعتين و 8 دقائق",
    genre: "أكشن • فنتازيا • ساموراي",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["كيانو ريفز", "Keanu Reeves", "هيرويوكي سانادا", "Hiroyuki Sanada"],
    overview: "مجموعة من الساموراي المنبوذين يسعون للانتقام لمقتل سيدهم وإعادة الشرف لأراضيهم بمساعدة محارب هجين غامض يمتلك قوى فريدة.",
    searchQuery: "47 Ronin 2013"
  },
  {
    rawTitle: "Sikandar 2025 720p NF WEB-DLl AKWAM",
    code: "3jk0zpwrttn1",
    title: "فيلم سيكندر (2025) Sikandar مترجم",
    year: "2025",
    duration: "ساعتين و 30 دقيقة",
    genre: "أكشن • إثارة • بوليوود",
    subGenre: "action",
    origin: "indian",
    quality: "720p HD",
    rating: "8.0",
    actors: ["سلمان خان", "Salman Khan", "رشميكا ماندانا", "Rashmika Mandanna"],
    overview: "ملحمة أكشن درامية ضخمة يقودها سلمان خان في مواجهة عائلات النفوذ وقوى الظلام لاستعادة العدالة والهيبة.",
    searchQuery: "Sikandar 2025"
  },
  {
    rawTitle: "Dont Look Up 2021 1080p WEB-DL AKWAM",
    code: "b15826wg31zh",
    title: "فيلم لا تنظروا إلى السماء (2021) Don't Look Up مترجم",
    year: "2021",
    duration: "ساعتين و 18 دقيقة",
    genre: "كوميديا • دراما • خيال علمي",
    subGenre: "comedy",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["ليوناردو دي كابريو", "Leonardo DiCaprio", "جينيفر لورنس", "ميريل ستريب"],
    overview: "عالما فلك متواضعان يقومان بجولة إعلامية لتحذير البشرية من اقتراب مذنب عميق سيؤدي إلى تدمير كوكب الأرض وسط سخرية ولامبالاة الإعلام والسياسيين.",
    searchQuery: "Don't Look Up 2021"
  },
  {
    rawTitle: "Star Trek II The Wrath of Khan 1982 1080p BluRay AKWAM",
    code: "0er6ahutpi9w",
    title: "فيلم ستار تريك 2: غضب خان (1982) Star Trek II مترجم",
    year: "1982",
    duration: "ساعة و 53 دقيقة",
    genre: "خيال علمي • مغامرة • كلاسيكيات",
    subGenre: "sci-fi",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["ويليام شاتنر", "ليونارد نيموي"],
    overview: "يواجه الأدميرال جيمس كيرك وطاقم سفينة إنتربرايز عدوهم اللدود خان نونين سينغ الذي يسعى للانتقام والسيطرة على سلاح كوني فتاك.",
    searchQuery: "Star Trek II The Wrath of Khan"
  },
  {
    rawTitle: "Speed 1994 1080p BluRay AKWAM",
    code: "mywb4rrvgh5x",
    title: "فيلم سرعة (1994) Speed مترجم",
    year: "1994",
    duration: "ساعة و 56 دقيقة",
    genre: "أكشن • تشويق وإثارة",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["كيانو ريفز", "Keanu Reeves", "ساندرا بولوك", "Sandra Bullock", "دنيس هوبر"],
    overview: "ضابط شرطة شجاع يحاول إنقاذ ركاب حافلة مدنية فخخها إرهابي مجنون بقنبلة ستنفجر إذا انخفضت سرعة الحافلة عن 50 ميلاً في الساعة.",
    searchQuery: "Speed 1994"
  },
  {
    rawTitle: "Yodha 2024 1080p WEB-DL AKWAM",
    code: "lsgzywv0vfoe",
    title: "فيلم يودها (2024) Yodha مترجم",
    year: "2024",
    duration: "ساعتين و 13 دقيقة",
    genre: "أكشن • تشويق • بوليوود",
    subGenre: "action",
    origin: "indian",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["سيدهارت مالهوترا", "راشي خانا", "ديشا باتاني"],
    overview: "جندي من القوات الخاصة الهندية يجد نفسه على متن طائرة ركاب مختطفة في مهمة مستحيلة لتحييد الإرهابيين وإنقاذ الركاب.",
    searchQuery: "Yodha 2024"
  },
  {
    rawTitle: "Murder Mubarak 2024 1080P WEB-DL AKWAM",
    code: "p4q5rr9seg7y",
    title: "فيلم مبارك الجريمة (2024) Murder Mubarak مترجم",
    year: "2024",
    duration: "ساعتين و 22 دقيقة",
    genre: "غموض • كوميديا • بوليوود",
    subGenre: "comedy",
    origin: "indian",
    quality: "1080p FHD",
    rating: "7.5",
    actors: ["بانكاج تريباثي", "سارة علي خان", "كاريشما كابور"],
    overview: "مفتش شرطة مخضرم ومرح يحقق في جريمة قتل غامضة تقع في نادٍ راقٍ للنخبة في دلهي حيث يحمل جميع الأعضاء أسراراً ودوافع خفية.",
    searchQuery: "Murder Mubarak 2024"
  },
  {
    rawTitle: "Gangs Of New York 2002 1080p BluRay AKWAM",
    code: "ou2c3588jfwb",
    title: "فيلم عصابات نيويورك (2002) Gangs of New York مترجم",
    year: "2002",
    duration: "ساعتين و 47 دقيقة",
    genre: "جريمة • دراما • تاريخي",
    subGenre: "crime",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.4",
    actors: ["ليوناردو دي كابريو", "Leonardo DiCaprio", "دانيال داي لويس", "كاميرون دياز"],
    overview: "شاب إيرلندي أمريكي يعود إلى حي فايف بوينتس بنيويورك عام 1862 للانتقام من زعيم عصابة شرس قتل والده في صراع دامي بين العصابات.",
    searchQuery: "Gangs of New York 2002"
  },
  {
    rawTitle: "Asteroid City 2023 1080p WEB-DL AKWAM",
    code: "uah2ispc6sqd",
    title: "فيلم مدينة الكويكبات (2023) Asteroid City مترجم",
    year: "2023",
    duration: "ساعة و 45 دقيقة",
    genre: "كوميديا • خيال علمي • دراما",
    subGenre: "comedy",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["سكارليت جوهانسون", "Scarlett Johansson", "توم هانكس", "جيسون شوارتزمان"],
    overview: "مؤتمر سنوي للشباب الفلكيين في بلدة صحراوية أمريكية عام 1955 يتعطل بشكل غير متوقع بسبب أحداث كونية غريبة تغير مجرى حياة الحاضرين.",
    searchQuery: "Asteroid City 2023"
  },
  {
    rawTitle: "Sikandar 2025 ar 720p NF WEB-DL AKWAM",
    code: "wx9j3m6j9x12",
    title: "فيلم سيكندر مدبلج (2025) Sikandar (Arabic) مدبلج للعربية",
    year: "2025",
    duration: "ساعتين و 30 دقيقة",
    genre: "أكشن • إثارة • بوليوود",
    subGenre: "action",
    origin: "indian",
    quality: "720p HD",
    rating: "8.0",
    actors: ["سلمان خان", "Salman Khan", "رشميكا ماندانا"],
    overview: "النسخة المدبلجة بالعربية لأحدث أفلام سلمان خان في مواجهة أعتى العصابات والمافيا.",
    searchQuery: "Sikandar 2025"
  },
  {
    rawTitle: "Sikandar 2025 720p WEB AKWAM",
    code: "z5tkeble4yyf",
    title: "فيلم سيكندر سيرفر 2 (2025) Sikandar (Server 2) مترجم",
    year: "2025",
    duration: "ساعتين و 30 دقيقة",
    genre: "أكشن • إثارة • بوليوود",
    subGenre: "action",
    origin: "indian",
    quality: "720p HD",
    rating: "8.0",
    actors: ["سلمان خان", "Salman Khan", "رشميكا ماندانا"],
    overview: "سيرفر مشاهدة إضافي فائق السرعة لفيلم الأكشن البوليوودي سيكندر للنجم سلمان خان.",
    searchQuery: "Sikandar 2025"
  },
  {
    rawTitle: "Undercover Rascals 2 2022 1080P WEB-DL AKWAM",
    code: "gg9oo4kx59ht",
    title: "فيلم الأوغاد المتخفون 2 (2022) Undercover Rascals 2 مترجم",
    year: "2022",
    duration: "ساعة و 32 دقيقة",
    genre: "كوميديا • جريمة",
    subGenre: "comedy",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.1",
    actors: ["طاقم عمل عالمي"],
    overview: "مغامرة كوميدية مشوقة ومطاردات طريفة لمجموعة من اللصوص المتنكرين.",
    searchQuery: "Undercover Rascals 2"
  },
  {
    rawTitle: "The Quick And The Dead 1995 720p BluRay AKWAM",
    code: "a6n5mdg2yl2t",
    title: "فيلم السريع والميت (1995) The Quick and the Dead مترجم",
    year: "1995",
    duration: "ساعة و 47 دقيقة",
    genre: "ويسترن • أكشن • كلاسيكيات",
    subGenre: "action",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.8",
    actors: ["شارون ستون", "جين هاكمان", "راسل كرو", "ليوناردو دي كابريو", "Leonardo DiCaprio"],
    overview: "رامية مسدسات غامضة تصل إلى بلدة حدودية نائية للمشاركة في مسابقة مبارزة قاتلة بهدف الانتقام لمقتل والدها.",
    searchQuery: "The Quick and the Dead 1995"
  },
  {
    rawTitle: "Kindling 2023 1080p WEB-DL AKWAM",
    code: "cuw3cbq4glv4",
    title: "فيلم كيندلينغ (2023) Kindling مترجم",
    year: "2023",
    duration: "ساعة و 28 دقيقة",
    genre: "دراما",
    subGenre: "drama",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.3",
    actors: ["جورج سومنر", "كونراد خان"],
    overview: "قصة مؤثرة عن مجموعة من الأصدقاء الشباب يلتفون حول صديقهم المصاب بمرض عضال لقضاء صيف لا ينسى.",
    searchQuery: "Kindling 2023"
  },
  {
    rawTitle: "A Minecraft Movie 2025 1080p AMZN WEB-DL AKWAM",
    code: "2hbbp6arewi1",
    title: "فيلم ماينكرافت (2025) A Minecraft Movie مترجم",
    year: "2025",
    duration: "ساعة و 50 دقيقة",
    genre: "مغامرة • كوميديا • عائلي",
    subGenre: "adventure",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["جاك بلاك", "جيسون موموا", "إيما مايرز"],
    overview: "أربعة غير متوافقين يسحبون إلى العالم الخارق الغامض والمكعب لماينكرافت ويتعين عليهم خوض مغامرات ملحمية لحمايته والعودة إلى عالمهم.",
    searchQuery: "A Minecraft Movie 2025"
  },
  {
    rawTitle: "Origenes secretos 2020 1080p WEB-DL AKWAM",
    code: "oyxw91s0bdhd",
    title: "فيلم أصول سرية (2020) Secret Origins مترجم",
    year: "2020",
    duration: "ساعة و 36 دقيقة",
    genre: "جريمة • إثارة • أبطال خارقين",
    subGenre: "crime",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.3",
    actors: ["خافيير ري", "فيرونيكا إتشيغوي"],
    overview: "قاتل متسلسل في مدريد يعيد إحياء قصص البدايات الأولى لأشهر أبطال الكوميكس الخارقين في جرائمه.",
    searchQuery: "Orígenes secretos 2020"
  },
  {
    rawTitle: "A Line Of Fire 2025 1080p WEB-DL AKWAM",
    code: "fos03ssnew0g",
    title: "فيلم خط النار (2025) A Line Of Fire مترجم",
    year: "2025",
    duration: "ساعة و 42 دقيقة",
    genre: "أكشن • تشويق وإثارة",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.4",
    actors: ["طاقم عمل عالمي"],
    overview: "صراع شرس ومواجهات نارية حابسة للأنفاس بين فرقة أمنية متخصصة ومجموعة مسلحة خطيرة.",
    searchQuery: "A Line Of Fire 2025"
  },
  {
    rawTitle: "mountainhead 2025 720p web AKWAM",
    code: "tcewm9rdyq2p",
    title: "فيلم رأس الجبل (2025) Mountainhead مترجم",
    year: "2025",
    duration: "ساعة و 35 دقيقة",
    genre: "إثارة • غموض",
    subGenre: "thriller",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.0",
    actors: ["طاقم عمل عالمي"],
    overview: "رحلة استكشاف جبلية تتحول إلى كابوس غامض بعد اختفاء أفراد الفريق واحداً تلو الآخر في ظروف مرعبة.",
    searchQuery: "Mountainhead 2025"
  },
  {
    rawTitle: "Constantine 2005 720 WEB-DL AKWAM",
    code: "r8xsxqgu0kr2",
    title: "فيلم قسطنطين (2005) Constantine مترجم",
    year: "2005",
    duration: "ساعتين و دقيقة",
    genre: "رعب • فنتازيا • أكشن",
    subGenre: "action",
    origin: "foreign",
    quality: "720p HD",
    rating: "8.2",
    actors: ["كيانو ريفز", "Keanu Reeves", "ريتشل وايز", "تيلدا سوينتون"],
    overview: "صياد الشياطين والخوارق جون قسطنطين يتعاون مع شرطية شجاعة للتحقيق في انتحار غامض لشقيقتها التوأم وكشف مؤامرة شيطانية.",
    searchQuery: "Constantine 2005"
  },
  {
    rawTitle: "O Menino que Matou Meus Pais 2021 1080p WEB-DL AKWAM",
    code: "03vg72dn5y1l",
    title: "فيلم الفتى الذي قتل والدي (2021) The Boy Who Killed My Parents مترجم",
    year: "2021",
    duration: "ساعة و 25 دقيقة",
    genre: "جريمة • دراما",
    subGenre: "crime",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.2",
    actors: ["كارلا دياز", "ليوناردو بيتينكورت"],
    overview: "دراما حقيقية عن واحدة من أشهر الجرائم القضائية المروعة في البرازيل من وجهة نظر المتهم دانييل كرافينهوس.",
    searchQuery: "O Menino que Matou Meus Pais"
  },
  {
    rawTitle: "Constantine 2005 1080p BluRay AKWAM",
    code: "pynx5ylt7zfu",
    title: "فيلم قسطنطين النسخة الفائقة (2005) Constantine (1080p) مترجم",
    year: "2005",
    duration: "ساعتين و دقيقة",
    genre: "رعب • فنتازيا • أكشن",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["كيانو ريفز", "Keanu Reeves", "ريتشل وايز", "تيلدا سوينتون"],
    overview: "النسخة فائقة الوضوح 1080p FHD لفيلم الأكشن والرعب الخارق قسطنطين بطولة النجم كيانو ريفز.",
    searchQuery: "Constantine 2005"
  },
  {
    rawTitle: "Marvins Room 1996 720p BluRay AKWAM",
    code: "f8uuy76j0s97",
    title: "فيلم غرفة مارفن (1996) Marvin's Room مترجم",
    year: "1996",
    duration: "ساعة و 38 دقيقة",
    genre: "دراما • كلاسيكيات",
    subGenre: "drama",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.7",
    actors: ["ميريل ستريب", "ديان كيتون", "ليوناردو دي كابريو", "Leonardo DiCaprio", "روبرت دي نيرو", "Robert De Niro"],
    overview: "شقيقتان منفصلتان منذ سنوات تجتمعان من جديد لمواجهة مرض خطير يهدد إحداهما بمساعدة ابن إحداهما المتمرد.",
    searchQuery: "Marvin's Room 1996"
  },
  {
    rawTitle: "Friday the 13th Part VI Jason Lives 1986 720 WEB-DL AKWAM",
    code: "p6ywsayrhsd6",
    title: "فيلم يوم الجمعة الثالث عشر 6 (1986) Jason Lives مترجم",
    year: "1986",
    duration: "ساعة و 26 دقيقة",
    genre: "رعب • تشويق • كلاسيكيات",
    subGenre: "horror",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.3",
    actors: ["توم ماثيوز", "جينيفر كوك"],
    overview: "يعود السفاح المقنع جيسون فورهيز إلى الحياة عن طريق الخطأ لمواصلة مجزرته الدموية في بحيرة كريستال ليك.",
    searchQuery: "Friday the 13th Part VI Jason Lives"
  },
  {
    rawTitle: "Werewolf by Night 2022 1080p WEB-DL AKWAM",
    code: "gr0k97g8z0li",
    title: "فيلم مستذئب في الليل (2022) Werewolf by Night مترجم",
    year: "2022",
    duration: "52 دقيقة",
    genre: "رعب • فنتازيا • مارفل",
    subGenre: "horror",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["غايل غارسيا برنال", "لورا دونيلي"],
    overview: "مجموعة سرية من صيادي الوحوش تجتمع في قلعة بلودستون بعد وفاة زعيمهم لخوض منافسة غامضة ومميتة للفوز بآثر سحري قوي.",
    searchQuery: "Werewolf by Night"
  },
  {
    rawTitle: "Mission Impossible - The Final Reckoning 2025 1080p AMZN WEB-DL AKWAM",
    code: "5dewfty6pfn1",
    title: "فيلم مهمة مستحيلة: الحساب النهائي (2025) Mission Impossible مترجم",
    year: "2025",
    duration: "ساعتين و 40 دقيقة",
    genre: "أكشن • تشويق وإثارة • تجسس",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.8",
    actors: ["توم كروز", "Tom Cruise", "هايلي أتويل", "فينغ راميز", "سايمون بيج"],
    overview: "إيثان هانت وفريقه في مهمتهم الأخطر على الإطلاق لمواجهة ذكاء اصطناعي فتاك يهدد مصير العالم بأكمله.",
    searchQuery: "Mission: Impossible - The Final Reckoning"
  },
  {
    rawTitle: "Sitaare Zameen Par 2025 1080p WEB-DL AKWAM",
    code: "09tynceu6ia2",
    title: "فيلم نجوم على الأرض 2 (2025) Sitaare Zameen Par مترجم",
    year: "2025",
    duration: "ساعتين و 25 دقيقة",
    genre: "دراما • عائلي • بوليوود",
    subGenre: "drama",
    origin: "indian",
    quality: "1080p FHD",
    rating: "8.6",
    actors: ["عامر خان", "Aamir Khan", "جينيليا ديسوزا"],
    overview: "الامتداد الروحي لفيلم نجوم على الأرض؛ قصة مؤثرة وملهمة عن اكتشاف إبداع وقدرات الأطفال والشباب ومساعدتهم على النجاح.",
    searchQuery: "Sitaare Zameen Par"
  },
  {
    rawTitle: "grand-theft-auto-vi-an-extended-look-hd720",
    code: "w8pro28q3ndm",
    title: "فيلم جي تي إيه 6: نظرة موسعة (2025) GTA VI Extended Look مترجم",
    year: "2025",
    duration: "ساعة و 15 دقيقة",
    genre: "وثائقي • ألعاب • إثارة",
    subGenre: "documentary",
    origin: "foreign",
    quality: "720p HD",
    rating: "8.5",
    actors: ["روكستار غيمز"],
    overview: "نظرة تفصيلية شاملة وموسعة لعالم لعبة الأكشن الأضخم في التاريخ GTA 6 وبيئتها ومدينة فايس سيتي.",
    searchQuery: "Grand Theft Auto VI"
  },
  {
    rawTitle: "Good Fortune 2025 1080p WEB-DL AKWAM",
    code: "bqxcxakolc7u",
    title: "فيلم حسن الحظ (2025) Good Fortune مترجم",
    year: "2025",
    duration: "ساعة و 44 دقيقة",
    genre: "كوميديا • فنتازيا",
    subGenre: "comedy",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["كيانو ريفز", "Keanu Reeves", "عزيز أنصاري", "سيث روجن"],
    overview: "ملاك طيب ذو نوايا حسنة لكنه غير مؤهل يتدخل في حياة رجلين لتغيير حظوظهما فيقع في سلسلة من المفارقات الكوميدية الخارقة.",
    searchQuery: "Good Fortune Keanu Reeves"
  },
  {
    rawTitle: "Friday the 13th Part VIII Jason Takes Manhattan 1989 720 WEB-DL AKWAM",
    code: "o3xgkn825hfq",
    title: "فيلم يوم الجمعة الثالث عشر 8: جيسون في مانهاتن (1989) مترجم",
    year: "1989",
    duration: "ساعة و 40 دقيقة",
    genre: "رعب • تشويق • كلاسيكيات",
    subGenre: "horror",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.0",
    actors: ["كين كيرزينغر", "جينسن داغيت"],
    overview: "يصعد القاتل المقنع جيسون فورهيز على متن سفينة ركاب متجهة إلى نيويورك ليحول رحلة الطلاب إلى حمام دم حتى شوارع مانهاتن.",
    searchQuery: "Friday the 13th Part VIII"
  },
  {
    rawTitle: "Dhurandhar The Revenge Raw and Undekha 2026 1080p WEB-DL AKWAM",
    code: "cr9t4gcdlahv",
    title: "فيلم ذوراندهار: الانتقام القاسي (2026) Dhurandhar The Revenge مترجم",
    year: "2026",
    duration: "ساعتين و 35 دقيقة",
    genre: "أكشن • جريمة • بوليوود",
    subGenre: "action",
    origin: "indian",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["رانفير سينغ", "Ranveer Singh", "سانجاي دوت", "أكشاي خانا"],
    overview: "النسخة القاسية الكاملة لملحمة التجسس والانتقام الاستخباراتي الهندي في عمق خطوط العدو.",
    searchQuery: "Dhurandhar Ranveer Singh"
  },
  {
    rawTitle: "The Matrix Resurrections 2021 1080p Bluray AKWAM",
    code: "1vw6uzfehddf",
    title: "فيلم ذا ماتريكس 4: الانبعاث (2021) The Matrix Resurrections مترجم",
    year: "2021",
    duration: "ساعتين و 28 دقيقة",
    genre: "خيال علمي • أكشن",
    subGenre: "sci-fi",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["كيانو ريفز", "Keanu Reeves", "كاري آن موس", "Carrie-Anne Moss", "يحيى عبد المتين"],
    overview: "يعود نيو إلى عالم الماتريكس من جديد بعد سنوات من العيش في وهم الحياة الطبيعية ليكتشف حقيقة واقعه ويقاتل مجدداً لتحرير البشرية.",
    searchQuery: "The Matrix Resurrections"
  },
  {
    rawTitle: "Rough Night 2017 720p BluRay AKWAM",
    code: "7lqxevahkj2q",
    title: "فيلم ليلة عصيبة (2017) Rough Night مترجم",
    year: "2017",
    duration: "ساعة و 41 دقيقة",
    genre: "كوميديا",
    subGenre: "comedy",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.2",
    actors: ["سكارليت جوهانسون", "Scarlett Johansson", "كيت ماكينون", "زوي كرافيتز"],
    overview: "حفلة توديع عزوبية تقيمها خمس صديقات في ميامي تأخذ منحنى مظلماً وكوميدياً بعد وفاة غير متوقعة للراقص المستأجر.",
    searchQuery: "Rough Night 2017"
  },
  {
    rawTitle: "Lost in Translation 2003 720p BluRay AKWAM",
    code: "vjf9c81qz7z5",
    title: "فيلم ضائع في الترجمة (2003) Lost in Translation مترجم",
    year: "2003",
    duration: "ساعة و 42 دقيقة",
    genre: "دراما • كوميديا رومانسية",
    subGenre: "drama",
    origin: "foreign",
    quality: "720p HD",
    rating: "8.4",
    actors: ["بيل موراي", "Bill Murray", "سكارليت جوهانسون", "Scarlett Johansson"],
    overview: "ممثل أمريكي مسن متعب وزوجة شابة مهملة يلتقيان في فندق فاخر بطوكيو وتنشأ بينهما رابطة إنسانية عميقة وغير عادية وسط غربة المدينة الصاخبة.",
    searchQuery: "Lost in Translation 2003"
  },
  {
    rawTitle: "Sing 2016 720p BluRay AKWAM",
    code: "9tulsp3m7w8o",
    title: "فيلم غنِ (2016) Sing مدبلج ومترجم",
    year: "2016",
    duration: "ساعة و 48 دقيقة",
    genre: "رسوم متحركة • كوميديا • عائلي",
    subGenre: "animation",
    origin: "foreign",
    quality: "720p HD",
    rating: "8.1",
    actors: ["ماثيو ماكونهي", "ريس ويذرسبون", "سكارليت جوهانسون", "Scarlett Johansson"],
    overview: "كوالا متفائل يقيم مسابقة غناء كبرى لإنقاذ مسرحه العريق من الإغلاق فيجذب حيوانات موهوبة تبحث عن فرصة العمر.",
    searchQuery: "Sing 2016"
  },
  {
    rawTitle: "In Isolation 2022 1080p WEB-DL AKWAM",
    code: "82ynhtkort4n",
    title: "فيلم في عزلة (2022) In Isolation مترجم",
    year: "2022",
    duration: "ساعة و 25 دقيقة",
    genre: "رعب • تشويق",
    subGenre: "horror",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.0",
    actors: ["طاقم عمل عالمي"],
    overview: "أربعة أصدقاء يحتفلون بعيد ميلاد في منزل ريفي منعزل قبل أن يقتحم غرباء غامضون المكان وتتحول ليلتهم إلى صراع دموي للبقاء.",
    searchQuery: "In Isolation 2022"
  },
  {
    rawTitle: "Kryptic 2024 720p AMZN WEB AKWAM",
    code: "u7tg42ars4dy",
    title: "فيلم كريبتيك (2024) Kryptic مترجم",
    year: "2024",
    duration: "ساعة و 34 دقيقة",
    genre: "خيال علمي • غموض",
    subGenre: "sci-fi",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.1",
    actors: ["طاقم عمل عالمي"],
    overview: "امرأة مصابة بفقدان الذاكرة تبحث عن وحش غامض في الغابات لتكتشف أسراراً خطيرة تهدد وجودها.",
    searchQuery: "Kryptic 2024"
  },
  {
    rawTitle: "The Jungle Book 2016 720p BluRay AKWAM",
    code: "hcrp76tii1k9",
    title: "فيلم كتاب الأدغال (2016) The Jungle Book مترجم",
    year: "2016",
    duration: "ساعة و 46 دقيقة",
    genre: "مغامرة • دراما • عائلي",
    subGenre: "adventure",
    origin: "foreign",
    quality: "720p HD",
    rating: "8.2",
    actors: ["نيل سيثي", "بيل موراي", "بن كينغسلي", "إدريس إلبا", "سكارليت جوهانسون", "Scarlett Johansson"],
    overview: "الطفل ماوكلي الذي ربته الذئاب في أدغال الهند يخوض رحلة شيقة لاكتشاف الذات بمساعدة الدب بالو والفهد باغيرا في مواجهة النمر الشرير شيرخان.",
    searchQuery: "The Jungle Book 2016"
  },
  {
    rawTitle: "Match Point 2005 720p BluRay AKWAM",
    code: "0lwrp4r7o43e",
    title: "فيلم نقطة المباراة (2005) Match Point مترجم",
    year: "2005",
    duration: "ساعتين و 4 دقائق",
    genre: "دراما • تشويق • رومانسي",
    subGenre: "drama",
    origin: "foreign",
    quality: "720p HD",
    rating: "8.0",
    actors: ["جوناثان ريس مايرز", "سكارليت جوهانسون", "Scarlett Johansson"],
    overview: "لاعب تنس سابق طموح يتزوج من عائلة بريطانية ثرية لكن هوسه بعشيقة صهره الأمريكية يقوده إلى ارتكاب جريمة لا تغتفر للحفاظ على مكانته.",
    searchQuery: "Match Point 2005"
  },
  {
    rawTitle: "Scoop 2006 720p BluRay AKWAM",
    code: "a8jnl4ruznt1",
    title: "فيلم سكوب (2006) Scoop مترجم",
    year: "2006",
    duration: "ساعة و 36 دقيقة",
    genre: "كوميديا • غموض",
    subGenre: "comedy",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.3",
    actors: ["وودي آلن", "سكارليت جوهانسون", "Scarlett Johansson", "هيو جاكمان"],
    overview: "طالبة صحافة أمريكية في لندن تتلقى طرف خيط من شبح صحفي راحل يقودها للتحقيق في هوية قاتل متسلسل من الطبقة الراقية.",
    searchQuery: "Scoop 2006"
  },
  {
    rawTitle: "Just Cause 1995 720p BluRay AKWAM",
    code: "3tm6ic42oibx",
    title: "فيلم قضية عادلة (1995) Just Cause مترجم",
    year: "1995",
    duration: "ساعة و 42 دقيقة",
    genre: "إثارة • غموض • جريمة",
    subGenre: "crime",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.5",
    actors: ["شون كونري", "Sean Connery", "لورنس فيشبورن", "سكارليت جوهانسون", "Scarlett Johansson"],
    overview: "أستاذ قانون بجامعة هارفارد يعارض عقوبة الإعدام يعاد إلى فلوريدا للتحقيق في قضية رجل محكوم عليه بالإعدام يدعي البراءة.",
    searchQuery: "Just Cause 1995"
  },
  {
    rawTitle: "One Last Shot 2026 720p",
    code: "kqg64cwt2a1r",
    title: "فيلم الطلقة الأخيرة (2026) One Last Shot مترجم",
    year: "2026",
    duration: "ساعة و 38 دقيقة",
    genre: "أكشن • إثارة وتشويق",
    subGenre: "action",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.8",
    actors: ["فرانك جريلو", "Frank Grillo", "تايريس جيبسون", "Tyrese Gibson"],
    overview: "مهمة انتحارية يقودها نخبة من المرتزقة لإنقاذ رهائن استراتيجيين داخل منشأة عسكرية محصنة قبل نفاد الوقت.",
    searchQuery: "Hard Matter One Last Shot"
  },
  {
    rawTitle: "Sing 2016 720p BluRay AKWAM (2)",
    code: "ygfb2td0hpyp",
    title: "فيلم غنِ سيرفر 2 (2016) Sing (Server 2) مترجم",
    year: "2016",
    duration: "ساعة و 48 دقيقة",
    genre: "رسوم متحركة • عائلي",
    subGenre: "animation",
    origin: "foreign",
    quality: "720p HD",
    rating: "8.1",
    actors: ["سكارليت جوهانسون", "Scarlett Johansson", "ماثيو ماكونهي"],
    overview: "سيرفر مشاهدة إضافي لفيلم الأنيميشن العائلي الشهير غنِ بجودة عالية 720p وبدون فواصل.",
    searchQuery: "Sing 2016"
  },
  {
    rawTitle: "Safety 2020 1080p WEB AKWAM",
    code: "n61n19ls74p1",
    title: "فيلم أمان (2020) Safety مترجم",
    year: "2020",
    duration: "ساعتين و 2 دقيقة",
    genre: "دراما • رياضي • سيرة ذاتية",
    subGenre: "drama",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["جاي هنتر كينغ", "كورين فوكس"],
    overview: "قصة حقيقية ملهمة للاعب كرة القدم الأمريكية راي مكيلراثبي الذي يتحدى كل الصعاب لتربية شقيقه الصغير البالغ من العمر 11 عاماً في الحرم الجامعي.",
    searchQuery: "Safety 2020"
  },
  {
    rawTitle: "The Replacements 2000 720p BluRay AKWAM",
    code: "fgakug5f3zoz",
    title: "فيلم البدلاء (2000) The Replacements مترجم",
    year: "2000",
    duration: "ساعة و 58 دقيقة",
    genre: "كوميديا • رياضي",
    subGenre: "comedy",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.6",
    actors: ["كيانو ريفز", "Keanu Reeves", "جين هاكمان", "Gene Hackman"],
    overview: "خلال إضراب لاعبي كرة القدم المحترفين، يقود المدرب الأسطوري والظهير المغمور شين فالكو فريقاً من البدلاء غير المتوقعين للفوز بالبطولة.",
    searchQuery: "The Replacements 2000"
  },
  {
    rawTitle: "Bill Ted Face the Music 1080p WEB-DL AKWAM",
    code: "fuudb36389od",
    title: "فيلم بيل وتيد يواجهان الموسيقى (2020) Bill & Ted مترجم",
    year: "2020",
    duration: "ساعة و 31 دقيقة",
    genre: "كوميديا • خيال علمي • مغامرة",
    subGenre: "comedy",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.4",
    actors: ["كيانو ريفز", "Keanu Reeves", "أليكس وينتر"],
    overview: "يتم تحذير الصديقين المحبوبين بيل وتيد من قبل زائر من المستقبل بأن لديهما مهلة زمنية قصيرة لتأليف أغنية ملحمية تنقذ الكون من الانهيار.",
    searchQuery: "Bill & Ted Face the Music"
  },
  {
    rawTitle: "We Bought A Zoo 2011 720p BluRay AKWAM",
    code: "sje5kpqyjssv",
    title: "فيلم اشترينا حديقة حيوان (2011) We Bought a Zoo مترجم",
    year: "2011",
    duration: "ساعتين و 4 دقائق",
    genre: "دراما • عائلي • كوميديا",
    subGenre: "comedy",
    origin: "foreign",
    quality: "720p HD",
    rating: "8.0",
    actors: ["مات ديمون", "Matt Damon", "سكارليت جوهانسون", "Scarlett Johansson"],
    overview: "أب أرمل ينتقل مع طفليه إلى الريف ويعيد افتتاح حديقة حيوانات متداعية مع فريق عمل مخلص ومتحمس لتكريم ذكرى زوجته الراحلة.",
    searchQuery: "We Bought a Zoo 2011"
  },
  {
    rawTitle: "Hitchcock 2012 720p BluRay AKWAM",
    code: "9shecs0kgl7m",
    title: "فيلم هيتشكوك (2012) Hitchcock مترجم",
    year: "2012",
    duration: "ساعة و 38 دقيقة",
    genre: "دراما • سيرة ذاتية",
    subGenre: "drama",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.6",
    actors: ["أنتوني هوبكنز", "Anthony Hopkins", "هيلين ميرين", "سكارليت جوهانسون", "Scarlett Johansson"],
    overview: "كواليس العلاقة المعقدة بين المخرج الأسطوري ألفريد هيتشكوك وزوجته ومعاونته ألما ريفيل أثناء تصوير فيلم الرعب الخالد سايكو عام 1960.",
    searchQuery: "Hitchcock 2012"
  },
  {
    rawTitle: "25 April 2015 720p WEBRip AKWAM",
    code: "90dpl8nfcl4v",
    title: "فيلم 25 أبريل (2015) 25 April مترجم",
    year: "2015",
    duration: "ساعة و 25 دقيقة",
    genre: "وثائقي • حربي • أنميشن",
    subGenre: "documentary",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.5",
    actors: ["طاقم عمل عالمي"],
    overview: "فيلم وثائقي متحرك مبتكر يروي أحداث معركة غاليبولي المأساوية عام 1915 من خلال رسائل ومذكرات ستة جنود وممرضات كانوا هناك.",
    searchQuery: "25 April 2015"
  },
  {
    rawTitle: "The Other Boleyn Girl 2008 720p BluRay AKWAM",
    code: "jqijsry6fe16",
    title: "فيلم فتاة بولين الأخرى (2008) The Other Boleyn Girl مترجم",
    year: "2008",
    duration: "ساعة و 55 دقيقة",
    genre: "تاريخي • دراما • رومانسي",
    subGenre: "drama",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.8",
    actors: ["ناتالي بورتمان", "Natalie Portman", "سكارليت جوهانسون", "Scarlett Johansson", "إريك بانا"],
    overview: "شقيقتان طموحتان تتنافسان على قلب وعرش الملك الإنجليزي هنري الثامن في صراع دامي من أجل السلطة والمكانة الملكية.",
    searchQuery: "The Other Boleyn Girl 2008"
  },
  {
    rawTitle: "Under the Skin 2013 720p BluRay AKWAM",
    code: "hrmrik30hqeo",
    title: "فيلم تحت الجلد (2013) Under the Skin مترجم",
    year: "2013",
    duration: "ساعة و 48 دقيقة",
    genre: "خيال علمي • إثارة • غموض",
    subGenre: "sci-fi",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.7",
    actors: ["سكارليت جوهانسون", "Scarlett Johansson"],
    overview: "كائن فضائي يتخذ شكل امرأة فاتنة تجوب شوارع اسكتلندا لاصطياد الرجال المعزولين لكنها تبدأ بالتعاطف التدريجي مع البشر.",
    searchQuery: "Under the Skin 2013"
  },
  {
    rawTitle: "The Island 2005 720p BluRay AKWAM",
    code: "v7lsaq1nbyog",
    title: "فيلم الجزيرة (2005) The Island مترجم",
    year: "2005",
    duration: "ساعتين و 16 دقيقة",
    genre: "أكشن • خيال علمي • تشويق",
    subGenre: "action",
    origin: "foreign",
    quality: "720p HD",
    rating: "8.0",
    actors: ["إيوان ماكغريغور", "سكارليت جوهانسون", "Scarlett Johansson"],
    overview: "رجل وامرأة يعيشان في مجمع مستقبلي معزول يكتشفان حقيقة مروعة بأنهما نسختان مستنسختان لتوفير أعضاء للأثرياء فيقرران الهروب.",
    searchQuery: "The Island 2005"
  },
  {
    rawTitle: "Secret Agent Dingledorf and His Trusty Dog Splat 2021 1080p WEB-DL AKWAM",
    code: "cl2st8nicrlk",
    title: "فيلم العميل السري دينغلدورف وكلبه سبلاط (2021) مترجم",
    year: "2021",
    duration: "ساعة و 29 دقيقة",
    genre: "كوميديا • عائلي • مغامرة",
    subGenre: "comedy",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.0",
    actors: ["طاقم عمل عالمي"],
    overview: "صبي ذكي يبلغ من العمر 10 سنوات وكلبه الوفي ينقذون بلدتهم من مخططات شريرة بواسطة أجهزة اختراع طريفة.",
    searchQuery: "Secret Agent Dingledorf"
  },
  {
    rawTitle: "The Spirit 2008 720p BluRay AKWAM",
    code: "1xz2y0h551dm",
    title: "فيلم الروح (2008) The Spirit مترجم",
    year: "2008",
    duration: "ساعة و 43 دقيقة",
    genre: "أكشن • خيال علمي • بطل خارق",
    subGenre: "action",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.1",
    actors: ["غابرييل ماخت", "صامويل إل جاكسون", "سكارليت جوهانسون", "Scarlett Johansson", "إيفا ميندز"],
    overview: "شرطي مبتدئ يعود من الموت بشخصية بطل مقنع يحمي مدينته سنترال سيتي من الشرير الأكبر الأخطبوط في عالم بصري نوير مذهل.",
    searchQuery: "The Spirit 2008"
  },
  {
    rawTitle: "Sweet November 2001 1080p WEBRip AKWAM",
    code: "lcu4v8vpmwch",
    title: "فيلم نوفمبر الحلو (2001) Sweet November مترجم",
    year: "2001",
    duration: "ساعتين",
    genre: "رومانسي • دراما",
    subGenre: "romance",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["كيانو ريفز", "Keanu Reeves", "تشارليز ثيرون", "Charlize Theron"],
    overview: "مدير إعلانات تنفيذي مهووس بالعمل يلتقي بامرأة شابة حرة الروح تغير نظرته للحياة خلال شهر نوفمبر واحد يحمل سراً مؤلماً.",
    searchQuery: "Sweet November 2001"
  },
  {
    rawTitle: "A Love Song for Bobby Long 2004 720p BluRay AKWAM",
    code: "b4ihbzte4124",
    title: "فيلم أغنية حب لبوبي لونغ (2004) مترجم",
    year: "2004",
    duration: "ساعتين",
    genre: "دراما",
    subGenre: "drama",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.5",
    actors: ["جون ترافولتا", "John Travolta", "سكارليت جوهانسون", "Scarlett Johansson"],
    overview: "فتاة شابة تعود إلى نيو أورلينز بعد وفاة والدتها لتفاجأ برجلين غريبين يعيشان في منزل والدتها الراحلة.",
    searchQuery: "A Love Song for Bobby Long"
  },
  {
    rawTitle: "Chain Reaction 1996 720p BluRay AKWAM",
    code: "g1x2kwmf6nvm",
    title: "فيلم تفاعل متسلسل (1996) Chain Reaction مترجم",
    year: "1996",
    duration: "ساعة و 47 دقيقة",
    genre: "أكشن • خيال علمي • تشويق",
    subGenre: "action",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.6",
    actors: ["كيانو ريفز", "Keanu Reeves", "مورغان فريمان", "Morgan Freeman", "راشيل وايز"],
    overview: "باحثان جامعيان يكتشفان طريقة لتوليد طاقة نظيفة غير محدودة قبل أن يدمر معملهما ويتم اتهامهما زوراً بالقتل والتجسس ليخوضا مطاردة فيدرالية ضارية.",
    searchQuery: "Chain Reaction 1996"
  },
  {
    rawTitle: "Dhurandhar 2025 1080p WEB-DL AKWAM",
    code: "429lujuhkzr8",
    title: "فيلم ذوراندهار (2025) Dhurandhar مترجم",
    year: "2025",
    duration: "ساعتين و 35 دقيقة",
    genre: "أكشن • تشويق • بوليوود",
    subGenre: "action",
    origin: "indian",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["رانفير سينغ", "Ranveer Singh", "سانجاي دوت"],
    overview: "مهمة استخباراتية سرية للمخابرات الهندية يقودها فريق نخبة لتفكيك أكبر شبكة إرهابية عابرة للحدود.",
    searchQuery: "Dhurandhar 2025"
  },
  {
    rawTitle: "Cocktail 2012720p WEB-DL AKWAM",
    code: "g9y8hd1nk1x7",
    title: "فيلم كوكتيل (2012) Cocktail مترجم",
    year: "2012",
    duration: "ساعتين و 22 دقيقة",
    genre: "رومانسي • كوميدي • بوليوود",
    subGenre: "romance",
    origin: "indian",
    quality: "720p HD",
    rating: "7.8",
    actors: ["سيف علي خان", "ديبيكا بادوكون", "Deepika Padukone", "ديانا بينتي"],
    overview: "مثلث حب معقد وعلاقة صداقة متشابكة بين شاب لعوب وفتاة جريئة حرة وصديقتها الخجولة المحافظة في لندن.",
    searchQuery: "Cocktail 2012 Deepika"
  },
  {
    rawTitle: "Exposed 2016 720p BluRay AKWAM",
    code: "s00ptyshnl70",
    title: "فيلم مكشوف (2016) Exposed مترجم",
    year: "2016",
    duration: "ساعة و 42 دقيقة",
    genre: "جريمة • غموض • تشويق",
    subGenre: "crime",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.4",
    actors: ["كيانو ريفز", "Keanu Reeves", "آنا دي أرماس", "Ana de Armas"],
    overview: "محقق شرطة يحقق في وفاة شريكه بينما تواجه امرأة لاتينية شابة ظواهر غريبة وميتافيزيقية ترتبط بالحادث.",
    searchQuery: "Exposed 2016 Keanu Reeves"
  },
  {
    rawTitle: "Babysitter Must Die 2021 1080p WEB-DL AKWAM",
    code: "22va9opkvp5m",
    title: "فيلم جليسة الأطفال يجب أن تموت (2021) مترجم",
    year: "2021",
    duration: "ساعة و 16 دقيقة",
    genre: "رعب • تشويق",
    subGenre: "horror",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.1",
    actors: ["رايلي فاندربيلت"],
    overview: "جليسة أطفال تستخدم مهاراتها الخاصة في البقاء والتخفي لحماية طفل بعد اقتحام عصابة مسلحة للمنزل لسرقة كنز مخبأ.",
    searchQuery: "The Babysitter Must Die"
  },
  {
    rawTitle: "The Watcher 2000 720p BluRay AKWAM",
    code: "bueyf283t1bm",
    title: "فيلم المراقب (2000) The Watcher مترجم",
    year: "2000",
    duration: "ساعة و 37 دقيقة",
    genre: "إثارة • غموض • جريمة",
    subGenre: "thriller",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.5",
    actors: ["كيانو ريفز", "Keanu Reeves", "جيمس سبادر", "ماريسا تومي"],
    overview: "عميل فيدرالي متقاعد ينتقل إلى شيكاغو بعد مطاردة مريرة مع قاتل متسلسل سيكوباتي مهووس به يقرر ملاحقته إلى مدينته الجديدة.",
    searchQuery: "The Watcher 2000 Keanu"
  },
  {
    rawTitle: "The Nanny Diaries 2007 720p BluRay AKWAM",
    code: "9wr2oh4kycoc",
    title: "فيلم يوميات المربية (2007) The Nanny Diaries مترجم",
    year: "2007",
    duration: "ساعة و 46 دقيقة",
    genre: "كوميديا • دراما • رومانسي",
    subGenre: "comedy",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.5",
    actors: ["سكارليت جوهانسون", "Scarlett Johansson", "كريس إيفانز", "Chris Evans"],
    overview: "خريجة جامعية تعمل كمربية لطفل مدلل لدى عائلة ثرية ومختلة في مانهاتن لتكتشف زيف المظاهر البراقة للطبقة المخملية.",
    searchQuery: "The Nanny Diaries 2007"
  },
  {
    rawTitle: "Keanu 2016 720p BluRay AKWAM",
    code: "cpqkd031fu1x",
    title: "فيلم كيانو (2016) Keanu مترجم",
    year: "2016",
    duration: "ساعة و 40 دقيقة",
    genre: "كوميديا • أكشن",
    subGenre: "comedy",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.5",
    actors: ["جوردان بيل", "كيغان-مايكل كي", "كيانو ريفز", "Keanu Reeves"],
    overview: "صديقان يتنكران في هيئة تجار مخدرات قتلة للتسلل إلى عصابة شوارع خطيرة واستعادة قطة صغيرة محبوبة تدعى كيانو.",
    searchQuery: "Keanu 2016"
  },
  {
    rawTitle: "Main Vaapas Aaunga 2026 HD",
    code: "7mz0uq6zwntd",
    title: "فيلم سأعود مجدداً (2026) Main Vaapas Aaunga مترجم",
    year: "2026",
    duration: "ساعتين و 15 دقيقة",
    genre: "دراما • إثارة • بوليوود",
    subGenre: "drama",
    origin: "indian",
    quality: "720p HD",
    rating: "7.7",
    actors: ["طاقم عمل بوليوود"],
    overview: "دراما هندية ملحمية عن الوفاء والعودة لتصفية الحسابات القديمة وحماية العائلة.",
    searchQuery: "Main Vaapas Aaunga"
  },
  {
    rawTitle: "Raja Shivaji 2026 HD-720p",
    code: "qasx90fod2gv",
    title: "فيلم راجا شيفاجي (2026) Raja Shivaji مترجم",
    year: "2026",
    duration: "ساعتين و 45 دقيقة",
    genre: "تاريخي • أكشن • بوليوود",
    subGenre: "action",
    origin: "indian",
    quality: "720p HD",
    rating: "8.3",
    actors: ["ريتيش ديشموخ"],
    overview: "ملحمة تاريخية حربية ضخمة تسرد سيرة البطل المحارب شاتراباتي شيفاجي مهراج وتأسيس إمبراطورية الماراثا.",
    searchQuery: "Raja Shivaji"
  },
  {
    rawTitle: "Words Of War 2025 720p HDTS AKWAM",
    code: "v0fszt1y4fgs",
    title: "فيلم كلمات الحرب (2025) Words Of War مترجم",
    year: "2025",
    duration: "ساعة و 48 دقيقة",
    genre: "حرب • دراما • سيرة ذاتية",
    subGenre: "drama",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.4",
    actors: ["ماكسيم خومياك"],
    overview: "قصة الصحفية الروسية الشجاعة آنا بوليتكوفسكايا ومعركتها لكشف الحقيقة وجرائم الحرب في الشيشان رغم التهديدات المستمرة.",
    searchQuery: "Words Of War 2025"
  },
  {
    rawTitle: "Those Who Walk Away 2022 1080p WEB-DL AKWAM",
    code: "9y0hxhbjxckq",
    title: "فيلم أولئك الذين يبتعدون (2022) مترجم",
    year: "2022",
    duration: "ساعة و 34 دقيقة",
    genre: "رعب",
    subGenre: "horror",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "6.9",
    actors: ["بو بيلينغسليا"],
    overview: "شابان في موعدهما الأول يقرران استكشاف منزل ريفي مهجور يقال إنه مسكون بكيان شرير يلتهم المتسللين.",
    searchQuery: "Those Who Walk Away"
  },
  {
    rawTitle: "The Gift 2000 720p BluRay AKWAM",
    code: "f7pgm6e89br5",
    title: "فيلم الهدية (2000) The Gift مترجم",
    year: "2000",
    duration: "ساعة و 51 دقيقة",
    genre: "غموض • إثارة • خارق للطبيعة",
    subGenre: "thriller",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.7",
    actors: ["كيت بلانشيت", "كيانو ريفز", "Keanu Reeves", "كاتي هولمز", "هيلاري سوانك"],
    overview: "أرملة تمتلك قدرات بصرية استباقية خارقة تُستدعى من قبل الشرطة للمساعدة في حل لغز اختفاء فتاة شابة من المجتمع الراقي.",
    searchQuery: "The Gift 2000"
  },
  {
    rawTitle: "The Perfect Score 2004 720p BluRay AKWAM",
    code: "5e1g3enrkcos",
    title: "فيلم الدرجة الكاملة (2004) The Perfect Score مترجم",
    year: "2004",
    duration: "ساعة و 33 دقيقة",
    genre: "كوميديا • جريمة • مراهقين",
    subGenre: "comedy",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.3",
    actors: ["كريس إيفانز", "Chris Evans", "سكارليت جوهانسون", "Scarlett Johansson"],
    overview: "ستة طلاب ثانوي يخططون لاقتحام مركز الامتحانات وسرقة إجابات اختبار SAT لضمان دخولهم أرقى الجامعات.",
    searchQuery: "The Perfect Score 2004"
  },
  {
    rawTitle: "Vicky Cristina Barcelona 2008 720p BluRay AKWAM",
    code: "hqiakozzcc1f",
    title: "فيلم فيكي كريستينا برشلونة (2008) مترجم",
    year: "2008",
    duration: "ساعة و 36 دقيقة",
    genre: "دراما • كوميديا رومانسية",
    subGenre: "romance",
    origin: "foreign",
    quality: "720p HD",
    rating: "8.0",
    actors: ["خافيير بارديم", "بينيلوبي كروز", "سكارليت جوهانسون", "Scarlett Johansson"],
    overview: "صديقتان أمريكيتان تقضيان إجازة الصيف في برشلونة وتقعان في حب رسام إسباني جذاب بينما تظهر زوجته السابقة العاطفية والمضطربة.",
    searchQuery: "Vicky Cristina Barcelona"
  },
  {
    rawTitle: "Small Town Hero 2019 1080p WEB-DL AKWAM",
    code: "trbxtyjdygwc",
    title: "فيلم بطل البلدة الصغيرة (2019) مترجم",
    year: "2019",
    duration: "ساعة و 42 دقيقة",
    genre: "دراما • جريمة",
    subGenre: "drama",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.1",
    actors: ["طاقم عمل عالمي"],
    overview: "مصارع سابق يسعى لإصلاح أخطاء ماضيه واستعادة ثقة عائلته وابنته في بلدة ريفية تواجه أزمات متتالية.",
    searchQuery: "Small Town Hero 2019"
  },
  {
    rawTitle: "The Uprising 2026 1080p WEB-DL720p",
    code: "mrata8u4eyjy",
    title: "فيلم الانتفاضة (2026) The Uprising مترجم",
    year: "2026",
    duration: "ساعة و 50 دقيقة",
    genre: "أكشن • خيال علمي • إثارة",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["طاقم عمل عالمي"],
    overview: "مقاومة شعبية تتشكل لمواجهة نظام سلطوي ذكائي يتحكم في مقدرات المدن المستقبلية.",
    searchQuery: "The Uprising 2026"
  },
  {
    rawTitle: "Dont Move 2026",
    code: "hejip8vm6ssw",
    title: "فيلم لا تتحرك (2026) Don't Move مترجم",
    year: "2026",
    duration: "ساعة و 32 دقيقة",
    genre: "رعب • إثارة وتشويق",
    subGenre: "horror",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.5",
    actors: ["كيلسي أسبيل", "فين ويتروك"],
    overview: "امرأة شابة يتم حقنها بمادة مهدئة ومشلّة للأعصاب من قبل قاتل متسلسل في غابة نائية، وعليها الهرب والقتال للبقاء قبل شلل جسدها الكامل في 20 دقيقة.",
    searchQuery: "Don't Move 2024"
  },
  {
    rawTitle: "Mutiny 2026 1080p",
    code: "74ok71q604py",
    title: "فيلم تمرد (2026) Mutiny مترجم",
    year: "2026",
    duration: "ساعة و 48 دقيقة",
    genre: "أكشن • تشويق وإثارة",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["جيسون ستاثام", "Jason Statham", "أنابيل واليس"],
    overview: "حارس شخصي سابق يجد نفسه متهماً زوراً باغتيال ملياردير صناعي، ويخوض مطاردة عالمية دامية لتبرئة نفسه وكشف شبكة فساد دولية.",
    searchQuery: "Mutiny Jason Statham"
  },
  {
    rawTitle: "Tom Clancys Jack Ryan Ghost War 2026 1080p WEB-DL AKWAM",
    code: "legrmdel5cz3",
    title: "فيلم جاك رايان: حرب الأشباح (2026) Jack Ryan مترجم",
    year: "2026",
    duration: "ساعتين و 10 دقائق",
    genre: "أكشن • تجسس • تشويق",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["جون كراسينسكي", "مايكل كيلي"],
    overview: "المحلل الاستخباراتي جاك رايان يخوض مهمة ميدانية مصيرية لمنع انقلاب عسكري سري واستخدام أسلحة محرمة دولياً.",
    searchQuery: "Jack Ryan Ghost War"
  },
  {
    rawTitle: "Tom Clancys Jack Ryan Ghost War 2026 1080p WEB-DL AKWAM (2)",
    code: "rwcmz7p0zi9c",
    title: "فيلم جاك رايان: حرب الأشباح سيرفر 2 (2026) مترجم",
    year: "2026",
    duration: "ساعتين و 10 دقائق",
    genre: "أكشن • تجسس",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["جون كراسينسكي", "مايكل كيلي"],
    overview: "سيرفر مشاهدة إضافي فائق السرعة لفيلم الإثارة والتجسس جاك رايان حرب الأشباح.",
    searchQuery: "Jack Ryan Ghost War"
  },
  {
    rawTitle: "Spider-Man Brand New Day 2026 1080p",
    code: "jqxas21h5fca",
    title: "فيلم سبايدرمان: يوم جديد تماماً (2026) Spider-Man مترجم",
    year: "2026",
    duration: "ساعتين و 25 دقيقة",
    genre: "أكشن • مغامرة • مارفل",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.7",
    actors: ["توم هولاند", "Tom Holland", "زندايا"],
    overview: "بيتر باركر يبدأ فصلاً جديداً تماماً في نيويورك بعد محو ذاكرة العالم عن هويته الحقيقية متحملاً أعباء البطل الخارق بمفرده.",
    searchQuery: "Spider-Man Brand New Day"
  },
  {
    rawTitle: "The Wrecking Crew 2026 1080p WEB-DL AKWAM",
    code: "8vrgun2z7x4c",
    title: "فيلم طاقم التخريب (2026) The Wrecking Crew مترجم",
    year: "2026",
    duration: "ساعة و 52 دقيقة",
    genre: "أكشن • كوميديا",
    subGenre: "action",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["ديف باوتيستا", "جيسون موموا"],
    overview: "أخوان غير شقيقين متنافران أحدهما شرطي والآخر مرتزق ينضمان معاً للتحقيق في مؤامرة اغتيال والدهما في هاواي.",
    searchQuery: "The Wrecking Crew 2026"
  },
  {
    rawTitle: "Oh What Fun 2025 1080p WEB-DL AKWAM",
    code: "u5le3mtpo1rw",
    title: "فيلم يا له من مرح (2025) Oh What Fun مترجم",
    year: "2025",
    duration: "ساعة و 46 دقيقة",
    genre: "كوميديا • عائلي",
    subGenre: "comedy",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["ميشيل فايفر", "فيليسيتي جونز", "Felicity Jones", "كلوي غرايس موريتز"],
    overview: "أم عائلية تنظم احتفالاً خرافياً بالكريسماس قبل أن تضيع وسط فوضى الاستعدادات لتبدأ عائلتها مغامرة مجنونة للبحث عنها.",
    searchQuery: "Oh What Fun 2025"
  },
  {
    rawTitle: "Black Box 2026 1080p BluRay",
    code: "8u3a9d10p7o5",
    title: "فيلم الصندوق الأسود (2026) Black Box مترجم",
    year: "2026",
    duration: "ساعتين و 9 دقائق",
    genre: "إثارة • غموض • طيران",
    subGenre: "thriller",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.9",
    actors: ["بيير نيني", "أندريه دوسولييه"],
    overview: "محلل صوتي بارع في وكالة سلامة الطيران يحقق في حادث تحطم مأساوي لطائرة ركاب جديدة ليكتشف تلاعباً خطيراً بالتسجيلات.",
    searchQuery: "Black Box Boîte noire"
  },
  {
    rawTitle: "Outcome 2026 WEB-DL AKWAM",
    code: "fo7whoh5vpd0",
    title: "فيلم المآل (2026) Outcome مترجم",
    year: "2026",
    duration: "ساعة و 54 دقيقة",
    genre: "كوميديا سوداء • دراما",
    subGenre: "comedy",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["كيانو ريفز", "Keanu Reeves", "جونا هيل", "كاميرون دياز"],
    overview: "نجم هوليوودي معتزل ومضطرب يواجه ابتزازاً بشريط فيديو غامض من ماضيه المظلم ويضطر إلى مواجهة شياطينه لإنقاذ سمعته.",
    searchQuery: "Outcome Keanu Reeves"
  },
  {
    rawTitle: "Oh What Fun 2025 1080p WEB-DL AKWAM (2)",
    code: "9c781u848vza",
    title: "فيلم يا له من مرح سيرفر 2 (2025) Oh What Fun (Server 2) مترجم",
    year: "2025",
    duration: "ساعة و 46 دقيقة",
    genre: "كوميديا • عائلي",
    subGenre: "comedy",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["ميشيل فايفر", "فيليسيتي جونز", "Felicity Jones"],
    overview: "سيرفر مشاهدة إضافي فائق السرعة وبدون إعلانات لفيلم الكوميديا العائلية يا له من مرح.",
    searchQuery: "Oh What Fun 2025"
  },
  {
    rawTitle: "Doing Life 2026 720",
    code: "kgetm45ax9ur",
    title: "فيلم قضاء المؤبد (2026) Doing Life مترجم",
    year: "2026",
    duration: "ساعة و 40 دقيقة",
    genre: "دراما • سجون • جريمة",
    subGenre: "drama",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.4",
    actors: ["طاقم عمل عالمي"],
    overview: "سجين محكوم عليه بالمؤبد يسعى للسلام الداخلي ومساعدة النزلاء الشباب على تجنب مصيره القاسي.",
    searchQuery: "Doing Life 2026"
  },
  {
    rawTitle: "Father Mother Sister Brother 2025 1080p BluRay",
    code: "ec5vepvo4kfb",
    title: "فيلم أب أم أخت أخ (2025) Father Mother Sister Brother مترجم",
    year: "2025",
    duration: "ساعة و 50 دقيقة",
    genre: "دراما • كوميديا",
    subGenre: "drama",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["كيت بلانشيت", "Cate Blanchett", "فيكي كريبس", "آدم درايفر"],
    overview: "ثلاث قصص منفصلة ولكن مترابطة تدور حول العلاقات الأسرية بين الآباء وأبنائهم البالغين عبر ثلاث دول مختلفة.",
    searchQuery: "Father Mother Sister Brother 2025"
  },
  {
    rawTitle: "Fall 2 Deadpoint 2026 720",
    code: "rp2zciumodmg",
    title: "فيلم السقوط 2: نقطة الموت (2026) Fall 2: Deadpoint مترجم",
    year: "2026",
    duration: "ساعة و 45 دقيقة",
    genre: "تشويق وإثارة • مغامرة بقاء",
    subGenre: "thriller",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.8",
    actors: ["طاقم عمل عالمي"],
    overview: "متسلقو جبال محترفون يعلقون على جرف صخري شاهق معزول في ظروف جوية عاصفة ويخوضون صراعاً مروعاً ضد الجاذبية والوقت.",
    searchQuery: "Fall 2 Deadpoint"
  },
  {
    rawTitle: "A Working Man 2025 720p WEB-DL AKWAM",
    code: "cztvxp4g1zj6",
    title: "فيلم رجل عامل (2025) A Working Man مترجم",
    year: "2025",
    duration: "ساعة و 39 دقيقة",
    genre: "أكشن • دراما",
    subGenre: "action",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.7",
    actors: ["فرانك جريلو", "Frank Grillo"],
    overview: "عامل بناء شريف ومحارب قديم يضطر لاستخدام مهاراته القتالية المميتة لحماية عائلته من عصابة مافيا تحاول ابتزازهم.",
    searchQuery: "A Working Man 2025 Frank Grillo"
  },
  {
    rawTitle: "legend-of-the-white-dragon 720",
    code: "idpb6ndta7p4",
    title: "فيلم أسطورة التنين الأبيض (2024) Legend of the White Dragon مترجم",
    year: "2024",
    duration: "ساعة و 56 دقيقة",
    genre: "أكشن • فنتازيا • خيال علمي",
    subGenre: "action",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.3",
    actors: ["جيسون ديفيد فرانك", "مايكل مادسن"],
    overview: "المحارب المنفي إريك ريد يعود إلى مدينته المدمرة لاستعادة قوى التنين الأبيض وحماية ما تبقى من شعبه من شر قديم.",
    searchQuery: "Legend of the White Dragon"
  },
  {
    rawTitle: "Bury the Devil 2026",
    code: "p7nhgjfwm2cv",
    title: "فيلم ادفن الشيطان (2026) Bury the Devil مترجم",
    year: "2026",
    duration: "ساعة و 38 دقيقة",
    genre: "رعب • إثارة وتشويق",
    subGenre: "horror",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.5",
    actors: ["طاقم عمل عالمي"],
    overview: "مجموعة من المنقبين في كهوف نائية يحررون دون قصد كياناً شيطانياً قديماً يتغذى على مخاوفهم الدفينة.",
    searchQuery: "Bury the Devil 2026"
  }
];

// Helper functions for poster search and download
function fetchText(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { headers: { 'User-Agent': 'curl/7.88.1' }, timeout: 10000 }, (res) => {
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

function downloadBinary(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    const req = proto.get(url, { headers: { 'User-Agent': 'curl/7.88.1' }, timeout: 15000 }, (res) => {
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

async function processBatch() {
  const catalog = JSON.parse(fs.readFileSync('public/curated_catalog.json', 'utf8'));
  const existingEmbeds = new Set(catalog.map(m => m.embedUrl));
  const existingIds = new Set(catalog.map(m => m.id));

  console.log(`Starting batch import. Current catalog size: ${catalog.length}`);
  let addedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < batchList.length; i++) {
    const item = batchList[i];
    const id = `movie-doodstream-${item.code}`;
    const embedUrl = `https://playmogo.com/e/${item.code}`;

    // Skip if already in catalog
    if (existingEmbeds.has(embedUrl) || existingIds.has(id)) {
      console.log(`[SKIP] Already exists: ${item.title}`);
      skippedCount++;
      continue;
    }

    const posterFile = `movie-doodstream-${item.code}.jpg`;
    const posterPath = path.join('public', 'posters', posterFile);
    const backdropPath = path.join('public', 'backdrops', posterFile);

    // Try finding TMDB image
    let tmdbImg = null;
    if (item.searchQuery) {
      tmdbImg = await findTmdbImage(item.searchQuery);
    }

    if (tmdbImg) {
      try {
        await downloadBinary(`https://image.tmdb.org/t/p/w500/${tmdbImg}`, posterPath);
        await downloadBinary(`https://image.tmdb.org/t/p/w1280/${tmdbImg}`, backdropPath);
        console.log(`[IMG OK] Downloaded poster for: ${item.title}`);
      } catch (err) {
        console.warn(`[IMG FAIL] Could not download image for ${item.title}: ${err.message}`);
      }
    } else {
      console.log(`[IMG N/A] No image found on TMDB for: ${item.searchQuery}`);
    }

    const movieObj = {
      id: id,
      title: item.title,
      type: "movie",
      category: "movies",
      duration: item.duration || "ساعتين",
      genre: item.genre,
      subGenre: item.subGenre || "action",
      badge: item.quality || "1080p FHD",
      quality: item.quality || "1080p FHD",
      year: item.year,
      rating: item.rating || "8.0",
      origin: item.origin || "foreign",
      embedUrl: embedUrl,
      streamUrl: embedUrl,
      customWidth: 600,
      customHeight: 480,
      poster: `/posters/${posterFile}`,
      backdrop: `/backdrops/${posterFile}`,
      overview: item.overview,
      actors: item.actors || ["طاقم عمل عالمي"]
    };

    // Add to catalog front
    catalog.unshift(movieObj);
    existingEmbeds.add(embedUrl);
    existingIds.add(id);
    addedCount++;
    console.log(`[ADDED ${addedCount}] ${item.title}`);

    // Polite delay for TMDB
    await new Promise(r => setTimeout(r, 120));
  }

  console.log(`Writing updated catalog... Total items: ${catalog.length}`);
  fs.writeFileSync('public/curated_catalog.json', JSON.stringify(catalog, null, 2));
  fs.writeFileSync('public/catalog.json', JSON.stringify(catalog, null, 2));
  fs.writeFileSync('public/catalog.js', `window.CURATED_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`);

  console.log(`SUCCESS! Added: ${addedCount}, Skipped: ${skippedCount}, Total Catalog: ${catalog.length}`);
}

processBatch().catch(console.error);
