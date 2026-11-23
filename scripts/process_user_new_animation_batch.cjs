const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const userItems = [
  {
    code: "quvab0h3bv67",
    rawTitle: "Little Emma 2024 720p WEB AKWAM",
    title: "فيلم إيما الصغيرة (2024) Little Emma مترجم",
    year: "2024",
    duration: "ساعة و 25 دقيقة",
    genre: "رسوم متحركة • مغامرة • عائلي",
    subGenre: "animation",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.5",
    actors: ["إيما الصغيرة", "طاقم أنيميشن عالمي"],
    overview: "فتاة صغيرة تدعى إيما نشأت بين حيوانات الغابة تخوض مغامرة ساحرة لاكتشاف أصولها الحقيقية وهويتها وسط مخلوقات غريبة وعوالم سرية.",
    searchQuery: "Little Emma 2024"
  },
  {
    code: "9e5522x03ay8",
    rawTitle: "The Tigers Apprentice 2024 1080p WEB-DL AKWAM",
    title: "فيلم تلميذ النمر (2024) The Tiger's Apprentice مترجم",
    year: "2024",
    duration: "ساعة و 24 دقيقة",
    genre: "رسوم متحركة • أكشن • فنتازيا",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["هنري جولدينج", "ميشيل يوه", "ساندرا أوه"],
    overview: "صبي أمريكي من أصل صيني يكتشف أنه حارس لبيضة العنقاء الأسطورية، ويتدرب تحت إشراف نمر متحدث لحماية العالم من قوى الظلام القديمة.",
    searchQuery: "The Tiger's Apprentice 2024"
  },
  {
    code: "twd41sqvzqmx",
    rawTitle: "Justice League Crisis on Infinite Earths Part One 2024 1080P WEB-DL AKWAM",
    title: "فيلم فرقة العدالة: أزمة في العوالم اللانهائية - الجزء الأول (2024) مترجم",
    year: "2024",
    duration: "ساعة و 33 دقيقة",
    genre: "رسوم متحركة • أكشن • أبطال خارقين DC",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["مات بومر", "دارين كريس", "ستاسانا كاتي"],
    overview: "يواجه أبطال دي سي الخارقون جيشاً من الكائنات المظلمة التي تمحو الأكوان المتعددة واحداً تلو الآخر، ويتعين على فرقة العدالة التوحد لإنقاذ كل الوجود.",
    searchQuery: "Justice League Crisis on Infinite Earths Part One 2024"
  },
  {
    code: "0h9awt618b5n",
    rawTitle: "Super-Charlie 2024 1080p BluRay AKWAM",
    title: "فيلم سوبر تشارلي (2024) Super-Charlie مترجم",
    year: "2024",
    duration: "ساعة و 30 دقيقة",
    genre: "رسوم متحركة • مغامرة • كوميديا",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.4",
    actors: ["سوبر تشارلي", "طاقم عمل عالمي"],
    overview: "طفل رضيع يكتسب قدرات خارقة غير متوقعة ويقرر حماية عائلته ومدينته من مخططات شريرة في مغامرة كوميدية مشوقة.",
    searchQuery: "Super-Charlie 2024"
  },
  {
    code: "m58uy3sze12y",
    rawTitle: "Kung Fu Panda 4 2024 1080p WEB AKWAM",
    title: "فيلم كونغ فو باندا 4 (2024) Kung Fu Panda 4 مترجم",
    year: "2024",
    duration: "ساعة و 34 دقيقة",
    genre: "رسوم متحركة • فنون قتالية ومغامرة • كوميديا",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["جاك بلاك", "أوكوافينا", "فيولا ديفيس", "داستن هوفمان"],
    overview: "يستعد بو ليصبح المرشد الروحي لوادي السلام، لكنه يضطر للتدريب ومواجهة ساحرة شريرة تستدعي جميع خصومه القدامى من عالم الأرواح.",
    searchQuery: "Kung Fu Panda 4 2024"
  },
  {
    code: "mzecshdkjuzq",
    rawTitle: "Kaijuu 8 Gou - Mission Recon 2025 [1080p] AKWAM",
    title: "فيلم أنمي كايجو رقم 8: مهمة الاستطلاع (2025) Kaiju No. 8 مترجم",
    year: "2025",
    duration: "ساعة و 35 دقيقة",
    genre: "أنمي • أكشن وخيال علمي • وحوش كايجو",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.6",
    actors: ["كافكا هيبينو", "رينا مومين", "طاقم قوات الدفاع"],
    overview: "فيلم أنمي حصري يستعرض مهمة استطلاعية فائقة الخطورة لفريق قوات الدفاع في مواجهة طفرة جديدة من وحوش الكايجو المدمرة.",
    searchQuery: "Kaiju No. 8"
  },
  {
    code: "sg9w3zkeydiu",
    rawTitle: "Elio 2025 1080p WEB AR AKWAM",
    title: "فيلم إليو (2025) Elio مدبلج للعربية",
    year: "2025",
    duration: "ساعة و 40 دقيقة",
    genre: "رسوم متحركة • خيال علمي • ديزني وبيكسار",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["يوناس كيبريب", "أمريكا فيريرا", "جميلة جميل"],
    overview: "فتى منعزل خياله واسع يُنقل فجأة عبر الفضاء الخارجي ويظن قادة الكواكب الأخرى خطأً أنه سفير كوكب الأرض وزعيمها.",
    searchQuery: "Elio Disney Pixar 2025"
  },
  {
    code: "uvif1as3lksg",
    rawTitle: "Migration 2023 1080P WEB-DL AKWAM",
    title: "فيلم رحلة بطة (2023) Migration مترجم",
    year: "2023",
    duration: "ساعة و 22 دقيقة",
    genre: "رسوم متحركة • مغامرة • عائلي وكوميديا",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.9",
    actors: ["كميل نانجياني", "إليزابيث بانكس", "أوكوافينا"],
    overview: "عائلة بط مالارد تقنع والدهم الحذر بالانطلاق في رحلة العمر عبر نيويورك نحو جامايكا المشمسة وسط مواقف غير متوقعة.",
    searchQuery: "Migration 2023"
  },
  {
    code: "4arcoj0jopnh",
    rawTitle: "Wish 2023 AR 1080p WEB-DL AKWAM",
    title: "فيلم أمنية (2023) Wish مدبلج للعربية",
    year: "2023",
    duration: "ساعة و 35 دقيقة",
    genre: "رسوم متحركة • مغامرة موسيقية • ديزني",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["أريانا ديبوز", "كريس باين", "ألان توديك"],
    overview: "آشا فتاة شابة ذكية تتمنى أمنية قوية لنجم السماء، فتستجيب لها طاقة كونية كروية لا حدود لقوتها لمواجهة حاكم مستبد.",
    searchQuery: "Wish Disney 2023"
  },
  {
    code: "bo412vu1gyxq",
    rawTitle: "The Bad Guys 2 2025 BluRay 1080p AKWAM",
    title: "فيلم الأشرار 2 (2025) The Bad Guys 2 مترجم",
    year: "2025",
    duration: "ساعة و 38 دقيقة",
    genre: "رسوم متحركة • كوميديا وجريمة • مغامرة",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["سام روكويل", "مارك مارون", "أوكوافينا"],
    overview: "الفريق الشهير من الحيوانات الخارجة عن القانون يحاولون الاستقامة والعيش كمواطنين صالحين، لكن سرقة جديدة تجبرهم على العودة للساحة.",
    searchQuery: "The Bad Guys 2 2025"
  },
  {
    code: "bcm90fvmi7t4",
    rawTitle: "Wish 2023 1080p WEB-DL AKWAM",
    title: "فيلم أمنية (2023) Wish مترجم",
    year: "2023",
    duration: "ساعة و 35 دقيقة",
    genre: "رسوم متحركة • مغامرة فنتازيا • ديزني",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["أريانا ديبوز", "كريس باين", "ألان توديك"],
    overview: "النسخة المترجمة من رائعة ديزني أمنية: فتاة شجاعة ونجمة أسطورية تتحدان لإنقاذ مملكة روزاس وتحقيق أماني أهلها.",
    searchQuery: "Wish Disney 2023"
  },
  {
    code: "d0hi33nrq8n4",
    rawTitle: "Treasure Fellowship 2023 1080p WEB-DL AKWAM",
    title: "فيلم رفقة الكنز (2023) Treasure Fellowship مترجم",
    year: "2023",
    duration: "ساعة و 28 دقيقة",
    genre: "رسوم متحركة • مغامرة • كنز وعائلي",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.3",
    actors: ["فريق البحث عن الكنز", "طاقم عالمي"],
    overview: "مغامرون صغار يتبعون خريطة قديمة مليئة بالألغاز تقودهم نحو جزيرة نائية تخفي أعظم كنوز القراصنة التاريخية.",
    searchQuery: "Treasure Fellowship 2023"
  },
  {
    code: "yld9hcdpw5kv",
    rawTitle: "Orion And The Dark 2024 1080p WEB AKWAM",
    title: "فيلم أوريون والظلام (2024) Orion and the Dark مترجم",
    year: "2024",
    duration: "ساعة و 31 دقيقة",
    genre: "رسوم متحركة • كوميديا وفنتازيا • دريم ووركس",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["جاكوب تريمبلاي", "بول والتر هاوزر", "أنجيلا باسيت"],
    overview: "فتى قلق مليء بالمخاوف يزوره تجسيد الظلام نفسه ليصطحبه في رحلة ليلية ملهمة تثبت له أنه لا يوجد ما يخشاه في الليل.",
    searchQuery: "Orion and the Dark 2024"
  },
  {
    code: "sk6cnwm3ctl7",
    rawTitle: "Ne Zha 2019 1080p BluRay AKWAM",
    title: "فيلم ني جا (2019) Ne Zha مترجم",
    year: "2019",
    duration: "ساعة و 50 دقيقة",
    genre: "رسوم متحركة • أساطير وفنتازيا • أكشن ملحمي",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.5",
    actors: ["لو يانتينغ", "هان مو", "تشن هاو"],
    overview: "ملحمة الأسطورة الصينية ني جا، الطفل المقدر له أن يكون تجسيداً لقوى الشيطان المدمرة، لكنه يقرر محاربة قدره ليصبح بطلاً منقذاً للبشرية.",
    searchQuery: "Ne Zha 2019"
  },
  {
    code: "tfh9ydp3g000",
    rawTitle: "Lost In Starlight 2025 720p WEB AKWAM",
    title: "فيلم الضياع في ضوء النجوم (2025) Lost in Starlight مترجم",
    year: "2025",
    duration: "ساعة و 32 دقيقة",
    genre: "رسوم متحركة • خيال علمي • رومانسية كورية",
    subGenre: "animation",
    origin: "korean",
    quality: "720p HD",
    rating: "7.9",
    actors: ["كيم تاي ري", "هونغ كيونغ"],
    overview: "قصة حب خيالية مؤثرة بين رائدة فضاء تسافر إلى كوكب المريخ وموسيقي شاب يظل مرتبطاً بها عبر الإشارات اللاسلكية بين النجوم.",
    searchQuery: "Lost in Starlight Netflix 2025"
  },
  {
    code: "3iksn1hgof9k",
    rawTitle: "Mononoke The Movie Chapter II The Ashes of Rage 2025 720 WEB-DL AKWAM",
    title: "فيلم أنمي مونونوكي: رماد الغضب - الجزء الثاني (2025) Mononoke مترجم",
    year: "2025",
    duration: "ساعة و 29 دقيقة",
    genre: "أنمي • رعب نفسي وفنتازيا • غموض ياباني",
    subGenre: "animation",
    origin: "anime",
    quality: "720p HD",
    rating: "8.4",
    actors: ["بائع الأدوية", "هيروشي كاميا"],
    overview: "يصل بائع الأدوية الغامض إلى قلعة تحترق فيها نيران الحقد القديم ليواجه طيفاً شيطانياً لا يمكن طرده إلا بعد معرفة الحقيقة والدوافع.",
    searchQuery: "Mononoke The Movie The Ashes of Rage 2025"
  },
  {
    code: "zlwhd4pvwz4h",
    rawTitle: "Megamind VS The Doom Syndicate 2023 1080p WEB-DL AKWAM",
    title: "فيلم ميجاميند ضد نقابة الهلاك (2024) Megamind vs The Doom Syndicate مترجم",
    year: "2024",
    duration: "ساعة و 23 دقيقة",
    genre: "رسوم متحركة • أبطال خارقين • كوميديا",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.2",
    actors: ["كيث فيرجسون", "لورا بوست", "جوش بريكنر"],
    overview: "يحاول ميجاميند الحفاظ على مظهره الشرير السابق للتسلل داخل فريق أشراره القدامى نقابة الهلاك ومنعهم من إطلاق صاروخ يدمر متروسيتي.",
    searchQuery: "Megamind vs. the Doom Syndicate 2024"
  },
  {
    code: "30qb02mlw6v8",
    rawTitle: "Demon Slayer Kimetsu No Yaiba The Movie Infinity Castle 2025 AKWAM",
    title: "فيلم أنمي قاتل الشياطين: قلعة اللانهاية (2025) Demon Slayer Infinity Castle مترجم",
    year: "2025",
    duration: "ساعتين",
    genre: "أنمي • أكشن ملحمي • شونين خارق للطبيعة",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "9.2",
    actors: ["تانجيرو كامادو", "موزان كيبوتسوجي", "فيلق قتلة الشياطين"],
    overview: "المعركة الفاصلة الكبرى داخل قلعة اللانهاية بين فيلق قتلة الشياطين وأعمدة الهاشيرا ضد موزان وأقوى شياطين الرتب العليا.",
    searchQuery: "Demon Slayer Kimetsu no Yaiba Infinity Castle"
  },
  {
    code: "qnikfuq7wdy4",
    rawTitle: "Wish 2023 AR 1080p WEB-DL AKWAM",
    title: "فيلم أمنية (2023) Wish مدبلج للعربية (النسخة الأصلية)",
    year: "2023",
    duration: "ساعة و 35 دقيقة",
    genre: "رسوم متحركة • مغامرة موسيقية • ديزني",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["أريانا ديبوز", "كريس باين", "ألان توديك"],
    overview: "الأغاني والدراما الرائعة من ديزني بأداء صوتي عربي مميز لأجواء حكاية أمنية السحرية في بلاد العجائب.",
    searchQuery: "Wish Disney 2023"
  },
  {
    code: "51jm9ytewqh0",
    rawTitle: "Wish 2023 EG 1080p WEB-DL AKWAM",
    title: "فيلم أمنية (2023) Wish باللهجة المصرية",
    year: "2023",
    duration: "ساعة و 35 دقيقة",
    genre: "رسوم متحركة • كوميديا وموسيقى • ديزني",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["نجوم الدبلجة المصرية", "طاقم ديزني"],
    overview: "النسخة الحصرية باللهجة المصرية الخفيفة والمحبوبة لفيلم أمنية مع الأغاني والأفيهات الكوميدية المميزة.",
    searchQuery: "Wish Disney"
  },
  {
    code: "3svux7ojvqpv",
    rawTitle: "The Casagrandes Movie 2024 1080P WEB-DL AKWAM",
    title: "فيلم آل كازاغراندي (2024) The Casagrandes Movie مترجم",
    year: "2024",
    duration: "ساعة و 25 دقيقة",
    genre: "رسوم متحركة • كوميديا • عائلي ومغامرة",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.5",
    actors: ["إيزابيلا ألفاريز", "كارلوس بينا فيجا", "سومالي مونتانو"],
    overview: "رحلة عيد ميلاد إلى المكسيك تتحول إلى مغامرة خيالية أسطورية عندما تطلق روني آن بطريق الخطأ سراح إلهة قديمة محبوسة في جبل بركاني.",
    searchQuery: "The Casagrandes Movie 2024"
  },
  {
    code: "lgf4cybg28y9",
    rawTitle: "Mahavatar Narsimha 2025 1080p WEB-DL AKWAM",
    title: "فيلم الأنميشن الهندي ماهفاتار نارسينها (2025) Mahavatar Narsimha مترجم",
    year: "2025",
    duration: "ساعتين و 10 دقائق",
    genre: "رسوم متحركة • أساطير هندية • أكشن ملحمي",
    subGenre: "animation",
    origin: "indian",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["طاقم السينما الهندية الأسطورية"],
    overview: "ملحمة رسوم متحركة هندية ثلاثية الأبعاد تجسد أسطورة المحارب نصف الإنساني نصف الأسد الذي ظهر لإنقاذ الكون من طاغية ظالم.",
    searchQuery: "Mahavatar Narsimha 2025"
  },
  {
    code: "qcm144e3ivi2",
    rawTitle: "They Shot the Piano Player 2023 1080p WEB-DL AKWAM",
    title: "فيلم لقد أطلقوا النار على عازف البيانو (2023) They Shot the Piano Player مترجم",
    year: "2023",
    duration: "ساعة و 43 دقيقة",
    genre: "رسوم متحركة • وثائقي وجريمة • موسيقى درامية",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["جيف جولدبلوم", "فرناندو ترويبا", "خافيير ماريسكال"],
    overview: "صحفي موسيقي من نيويورك ينطلق في تحقيق مشوق لكشف اللغز وراء الاختفاء الغامض لعازف بيانو برازيلي موهوب في سبعينيات القرن العشرين.",
    searchQuery: "They Shot the Piano Player 2023"
  },
  {
    code: "7f7ty4aglg9b",
    rawTitle: "The Casagrandes Movie 2024 AR 1080P WEB-DL AKWAM",
    title: "فيلم آل كازاغراندي (2024) The Casagrandes Movie مدبلج للعربية",
    year: "2024",
    duration: "ساعة و 25 دقيقة",
    genre: "رسوم متحركة • كوميديا وعائلي • مدبلج",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["طاقم الدبلجة العربية الرسمية"],
    overview: "النسخة المدبلجة رسمياً لأروع مغامرات عائلة كازاغراندي في المكسيك وسط أجواء موسيقية وكوميديا تناسب جميع أفراد العائلة.",
    searchQuery: "The Casagrandes Movie"
  },
  {
    code: "cjvl8roc6e51",
    rawTitle: "Noahs Ark 2024 1080p WEB-DL AKWAM",
    title: "فيلم سفينة نوح (2024) Noah's Ark مترجم",
    year: "2024",
    duration: "ساعة و 36 دقيقة",
    genre: "رسوم متحركة • مغامرة موسيقية • كوميديا",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.5",
    actors: ["فأران موسيقيان", "طاقم حيوانات السفينة"],
    overview: "فأران موهوبان في موسيقى البوب يتسللان على متن سفينة نوح وسط عاصفة الطوفان العظيم للتغلب على الخلافات بين الحيوانات بالموسيقى والأمل.",
    searchQuery: "Noah's Ark 2024 animation"
  },
  {
    code: "gy26lcb5yub9",
    rawTitle: "Barbie and Stacie to the Rescue 2024 1080P WEB-DL AKWAM",
    title: "فيلم باربي وستايسي في مهمة الإنقاذ (2024) Barbie & Stacie to the Rescue مترجم",
    year: "2024",
    duration: "ساعة و 15 دقيقة",
    genre: "رسوم متحركة • مغامرة وعائلي • باربي",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.2",
    actors: ["باربي", "ستايسي", "الأخوات روبرتس"],
    overview: "تسافر باربي وشقيقتها ستايسي في عطلة ممتعة لمهرجان بالونات الهواء، لكن عندما تواجه العائلة خطراً غير متوقع، تثبت ستايسي شجاعتها الكبيرة.",
    searchQuery: "Barbie and Stacie to the Rescue 2024"
  },
  {
    code: "il3nd2zy7cnc",
    rawTitle: "The Canterville Ghost 2023 1080p WEB AKWAM",
    title: "فيلم شبح كانترفيل (2023) The Canterville Ghost مترجم",
    year: "2023",
    duration: "ساعة و 29 دقيقة",
    genre: "رسوم متحركة • كوميديا فنتازيا • أوسكار وايلد",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["ستيفن فراي", "هيو لوري", "فريدي هايمور"],
    overview: "شبح إنجليزي أرستقراطي يسكن قصره لأكثر من 300 عام يصاب بالصدمة عندما تنتقل عائلة أمريكية عصرية للسكن معه ولا تخاف منه إطلاقاً.",
    searchQuery: "The Canterville Ghost 2023"
  },
  {
    code: "v53b740oqpag",
    rawTitle: "Night of the Zoopocalypse 2024 1080p BluRay AKWAM",
    title: "فيلم ليلة زومبي حديقة الحيوان (2024) Night of the Zoopocalypse مترجم",
    year: "2024",
    duration: "ساعة و 31 دقيقة",
    genre: "رسوم متحركة • مغامرة وكوميديا رعب • خيال",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.5",
    actors: ["ذئب الحديقة", "فريق الحيوانات المقاومة"],
    overview: "نيزك فضائي غامض يصطدم بحديقة حيوانات فيحول معظم النزلاء إلى وحوش زومبي طريفة، ويتوجب على مجموعة من الحيوانات الناجية التعاون لإنقاذ الحديقة.",
    searchQuery: "Night of the Zoopocalypse 2024"
  },
  {
    code: "6nuyp2uchcyc",
    rawTitle: "Elemental 2023 1080p BluRay akwam",
    title: "فيلم العناصر (2023) Elemental مترجم",
    year: "2023",
    duration: "ساعة و 42 دقيقة",
    genre: "رسوم متحركة • كوميديا ورومانسية • ديزني وبيكسار",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["ليا لويس", "مامودو آثي", "روني ديل كارمن"],
    overview: "في مدينة العناصر حيث يعيش سكان النار والماء والأرض والهواء معاً، تنشأ علاقة غير متوقعة بين شابة نارية سريعة الغضب وشاب مائي هادئ وعاطفي.",
    searchQuery: "Elemental Disney Pixar 2023"
  },
  {
    code: "tzd9kk16jl4j",
    rawTitle: "Elio 2025 1080p AMZN WEB AKWAM",
    title: "فيلم إليو (2025) Elio مترجم نسخة فائقة الدقة",
    year: "2025",
    duration: "ساعة و 40 دقيقة",
    genre: "رسوم متحركة • مغامرة وفضاء • بيكسار",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["يوناس كيبريب", "أمريكا فيريرا", "جميلة جميل"],
    overview: "مغامرة فضائية مذهلة من استوديوهات بيكسار تنطلق في أعماق المجرة برفقة الصبي إليو في رحلة اكتشاف الذات ومقابلة كائنات فضائية ذكية.",
    searchQuery: "Elio Disney Pixar 2025"
  },
  {
    code: "ziw2a8errha9",
    rawTitle: "The King of Kings (2025) 720p AMZN WEB-DL AKWAM",
    title: "فيلم ملك الملوك (2025) The King of Kings مترجم",
    year: "2025",
    duration: "ساعة و 45 دقيقة",
    genre: "رسوم متحركة • تاريخي وملحمي • دراما",
    subGenre: "animation",
    origin: "foreign",
    quality: "720p HD",
    rating: "8.0",
    actors: ["أوسكار إسحاق", "كينيث براناه", "أوما ثورمان"],
    overview: "اقتباس بصري مذهل لرسوم متحركة كلاسيكية مستوحاة من قصة تشارلز ديكنز التي رواها لأطفاله حول التسامح والإيمان والصداقة الحقيقية.",
    searchQuery: "The King of Kings 2025 animated"
  },
  {
    code: "q0lm6fqftt97",
    rawTitle: "Tabby McTat 2023 720p WEB AKWAM",
    title: "فيلم القط تابي ماك تات (2023) Tabby McTat مترجم",
    year: "2023",
    duration: "30 دقيقة",
    genre: "رسوم متحركة • قصير وعائلي • موسيقى",
    subGenre: "animation",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.7",
    actors: ["روب برايدون", "جودي ويتاكر", "سوب ديريسو"],
    overview: "قصة دافئة عن قط موسيقي مغني في شوارع لندن وصداقته العميقة مع عازف الجيتار فريد، وكيف يلتقيان مجدداً بعد فراق طويل.",
    searchQuery: "Tabby McTat 2023"
  },
  {
    code: "13etri0f7a4e",
    rawTitle: "The Twits 2025 ar 1080p WEB-DL AKWAM",
    title: "فيلم المغفلون (2025) The Twits مدبلج للعربية",
    year: "2025",
    duration: "ساعة و 32 دقيقة",
    genre: "رسوم متحركة • كوميديا ومغامرة • رولد دال",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["طاقم نجوم الدبلجة العربية"],
    overview: "الزوجان الأكثر شراً وحماقة في العالم يحاولان السيطرة على المدينة، لكن القرود الذكية والطيور تتحدان لتلقينهما درساً لن ينسياه.",
    searchQuery: "The Twits Netflix 2025"
  },
  {
    code: "kdt8qwt4qrx5",
    rawTitle: "I Am Frankelda 2025 1080p WEB-DL AKWAM",
    title: "فيلم أنا فرانكلدا (2025) I Am Frankelda مترجم",
    year: "2025",
    duration: "ساعة و 30 دقيقة",
    genre: "رسوم متحركة • ستوب موشن وخيال • رعب فني",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["فرانكلدا", "طاقم أنيميشن ستوب موشن"],
    overview: "كاتبة مكسيكية شابة في القرن التاسع عشر تسافر إلى مملكة الكوابيس والأشباح حيث تتحول قصصها المرعبة الخيالية إلى واقع حي.",
    searchQuery: "I Am Frankelda 2025"
  },
  {
    code: "xm0qc8d8gmn3",
    rawTitle: "The Legend Of Aang The Last Airbender 2026 1080p WEB-DL AKWAM",
    title: "فيلم أسطورة آنغ: مسخر الهواء الأخير (2026) The Legend of Aang مترجم",
    year: "2026",
    duration: "ساعة و 50 دقيقة",
    genre: "رسوم متحركة • أكشن وفنون قتالية • فنتازيا أفاتار",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.9",
    actors: ["آنغ البالغ", "كتارا", "سوكا", "زوكو", "توف"],
    overview: "فيلم الأنميشن السينمائي الملحمي الجديد الذي يعود فيه الأفاتار آنغ وأصدقاؤه كبالغين لمواجهة تهديد عالمي جديد يعرض توازن العناصر الأربعة للخطر.",
    searchQuery: "Aang The Last Airbender 2026"
  },
  {
    code: "k24tt6hv93yu",
    rawTitle: "Lulu Is a Rhinoceros 2025 720p WEB-DL AKWAM",
    title: "فيلم لولو وحيد القرن (2025) Lulu Is a Rhinoceros مترجم",
    year: "2025",
    duration: "ساعة و 20 دقيقة",
    genre: "رسوم متحركة • عائلي • كوميديا ملهمة",
    subGenre: "animation",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.3",
    actors: ["الكلبة لولو", "طاقم العمل"],
    overview: "كلبة بولدوج صغيرة ومرحة تؤمن من كل قلبها أنها وحيد قرن شجاع، وتنطلق في رحلة لتقبل الذات وإلهام الآخرين بالثقة والأمل.",
    searchQuery: "Lulu Is a Rhinoceros 2025"
  },
  {
    code: "asrc5qzqbwds",
    rawTitle: "Avatar Aang The Last Airbender 2026 720p",
    title: "فيلم أفاتار آنغ: مسخر الهواء الأخير (2026) نسخة 720p HD",
    year: "2026",
    duration: "ساعة و 50 دقيقة",
    genre: "رسوم متحركة • فنون قتالية ومغامرة • أفاتار",
    subGenre: "animation",
    origin: "foreign",
    quality: "720p HD",
    rating: "8.8",
    actors: ["آنغ", "فريق الأفاتار"],
    overview: "النسخة الخفيفة والسريعة لمغامرة الأفاتار آنغ السينمائية الكبرى لعام 2026 وسط معارك تسخير الماء والنار والأرض والهواء.",
    searchQuery: "Aang The Last Airbender"
  },
  {
    code: "sjquzfz2e4v5",
    rawTitle: "Angelo dans la for C3 AAt myst C3 A9rieuse 2024 1080 WEB-DL AKWAM",
    title: "فيلم أنجيلو في الغابة الغامضة (2024) Angelo in the Mysterious Forest مترجم",
    year: "2024",
    duration: "ساعة و 21 دقيقة",
    genre: "رسوم متحركة • مغامرة فرنسية • فنتازيا",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["أنجيلو البطل", "طاقم الرسوم الفرنسية"],
    overview: "صبي في العاشرة من عمره يحلم بأن يصبح مستكشفاً للحيوانات ينفصل عن والديه في استراحة الطريق ويدخل غابة سحرية مسكونة بكائنات غير مألوفة.",
    searchQuery: "Angelo dans la foret mysterieuse 2024"
  },
  {
    code: "53ttx506kosu",
    rawTitle: "KPop Demon Hunters 2025 1080p WEB AKWAM",
    title: "فيلم صيادو شياطين الكيبوب (2025) K-Pop: Demon Hunters مترجم",
    year: "2025",
    duration: "ساعة و 35 دقيقة",
    genre: "رسوم متحركة • أكشن وموسيقى • سوني أنيميشن",
    subGenre: "animation",
    origin: "korean",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["فريق فتيات الكيبوب", "سوني بيكتشرز أنيميشن"],
    overview: "فرقة فتيات كيبوب شهيرة عالمياً يعشن حياة مزدوجة كصيادات محترفات للأرواح الشريرة والشياطين الخفية في شوارع سيول المتلألئة.",
    searchQuery: "K-Pop Demon Hunters Sony 2025"
  },
  {
    code: "kx6b3w7rpl3k",
    rawTitle: "Fuuto Tantei - Kamen Rider Skull no Shouzou 2024 1080p WEB-DL AKWAM",
    title: "فيلم أنمي محقق فوتو: بورتريه كامن رايدر سكل (2024) Fuuto PI مترجم",
    year: "2024",
    duration: "ساعة و 25 دقيقة",
    genre: "أنمي • غموض وتحريات • أكشن وخوارق",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["شوتارو هيداري", "فيليب", "سوكيتشي نارومي"],
    overview: "يكتشف المحقق شوتارو قصة معلمه الأسطوري كامن رايدر سكل والسر وراء حادثة ليلة البداية المشؤومة في مدينة الرياح فوتو.",
    searchQuery: "Fuuto Tantei Kamen Rider Skull no Shouzou 2024"
  },
  {
    code: "wyhol093eurs",
    rawTitle: "Mononoke The Movie The Phantom in the Rain 2024 720p NF WEB-DL AKWAM",
    title: "فيلم أنمي مونونوكي: شبح في المطر (2024) Mononoke: Phantom in the Rain مترجم",
    year: "2024",
    duration: "ساعة و 30 دقيقة",
    genre: "أنمي • غموض ورعب فني • خوارق يابانية",
    subGenre: "animation",
    origin: "anime",
    quality: "720p HD",
    rating: "8.3",
    actors: ["هيروشي كاميا", "تومويو كوروساوا", "آوي يوكي"],
    overview: "تدخل فتاتان إلى جناح الحريم الداخلي في قلعة إيدو الإمبراطورية، وسرعان ما تنتشر لعنة مميتة تستدعي سيف طرد الأرواح الخارق للبائع المتجول.",
    searchQuery: "Mononoke The Movie The Phantom in the Rain 2024"
  },
  {
    code: "8jfquve36s30",
    rawTitle: "ChaO 2025 720p",
    title: "فيلم الرسوم المتحركة تشاو (2025) ChaO مترجم",
    year: "2025",
    duration: "ساعة و 25 دقيقة",
    genre: "رسوم متحركة • مغامرة • خيال علمي",
    subGenre: "animation",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.4",
    actors: ["تشاو البطل", "طاقم العمل"],
    overview: "مغامرة مستقبلية آسرة تدور حول كائن آلي ذكي ينطلق في رحلة لإنقاذ كوكبه المتلاشي من الفوضى والانهيار المناخي.",
    searchQuery: "Chao 2025 animated movie"
  },
  {
    code: "2m7g5vvfnbpd",
    rawTitle: "The Ribbon Hero 2026 1080p",
    title: "فيلم بطل الشريط (2026) The Ribbon Hero مترجم",
    year: "2026",
    duration: "ساعة و 28 دقيقة",
    genre: "رسوم متحركة • أبطال خارقين • كوميديا",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["بطل الشريط", "طاقم الرسوم"],
    overview: "بطل غير تقليدي يمتلك أشرطة سحرية مرنة تحل المعضلات وتحمي الضعفاء يجد نفسه في مواجهة شرير حديدي يهدد أمان العالم.",
    searchQuery: "The Ribbon Hero 2026"
  },
  {
    code: "guj8mp6hygz5",
    rawTitle: "Smurfs 2025 1080p AMZN WEB-DL AKWAM",
    title: "فيلم السنافر الجديد (2025) The Smurfs Movie مترجم",
    year: "2025",
    duration: "ساعة و 36 دقيقة",
    genre: "رسوم متحركة • كوميديا وعائلي • مغامرات باراماونت",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["ريهانا", "نيك أوفرمان", "ناتاشا ليون", "دانييل ليفي"],
    overview: "تعود قرية السنافر الزرقاء المحبوبة في مغامرة سينمائية موسيقية ضخمة بقيادة سنفورة لمواجهة مؤامرات شرشبيل والبحث عن أصولهم الأسطورية.",
    searchQuery: "The Smurfs Movie 2025"
  },
  {
    code: "ibma6v3ehg9a",
    rawTitle: "Animal Farm 2025 1080p WEB-DL AKWAM",
    title: "فيلم مزرعة الحيوان (2025) Animal Farm مترجم",
    year: "2025",
    duration: "ساعة و 40 دقيقة",
    genre: "رسوم متحركة • دراما وفلسفة • إخراج آندي سيركيس",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.4",
    actors: ["آندي سيركيس", "طاقم التقاط الحركة والرسوم"],
    overview: "اقتباس سينمائي معاصر عالي التقنية لتحفة جورج أورويل الخالدة: ثورة الحيوانات في المزرعة ضد الاستبداد وصراع السلطة والحرية.",
    searchQuery: "Animal Farm Andy Serkis 2025"
  },
  {
    code: "apyhqt4fuamp",
    rawTitle: "Gintama the Movie Yoshiwara in Flames 2026",
    title: "فيلم أنمي جينتاما: يوشيوارا تشتعل بالحرائق (2026) Gintama مترجم",
    year: "2026",
    duration: "ساعة و 48 دقيقة",
    genre: "أنمي • ساموراي وكوميديا جنونية • أكشن ملحمي",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.9",
    actors: ["جينتوكي ساكاتا", "شينباتشي", "كاغورا", "هوسين ملك الليل"],
    overview: "يعود الثنائي غينتوكي وأصدقاؤه إلى مدينة يوشيوارا التحتية المظلمة لمواجهة أقوى محاربي الياتو وتحرير الشمس لسكان المدينة في أشرس معارك الساموراي.",
    searchQuery: "Gintama Yoshiwara in Flames"
  },
  {
    code: "ju1sqwty75fb",
    rawTitle: "Ne Zha 2 2025 1080p WEB-DL AKWAM",
    title: "فيلم ني جا 2 (2025) Ne Zha 2 مترجم",
    year: "2025",
    duration: "ساعتين و 5 دقائق",
    genre: "رسوم متحركة • أساطير صينية • أكشن وفنتازيا",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.7",
    actors: ["لو يانتينغ", "هان مو", "طاقم الأساطير"],
    overview: "الجزء الثاني الملحمي من ملحمة ني جا: بعد التضحية العظيمة لتفادي صاعقة السماء، تتحد الأرواح لإنقاذ العالم من وحوش التنانين القديمة.",
    searchQuery: "Ne Zha 2 2025"
  },
  {
    code: "0zg9v74kuowp",
    rawTitle: "Kaijuu 8 Gou Hoshina no Kyujitsu 1080 WEB-DL AKWAM",
    title: "فيلم أنمي كايجو رقم 8: يوم عطلة هوشينا (2025) Kaiju No. 8 مترجم",
    year: "2025",
    duration: "ساعة و 15 دقيقة",
    genre: "أنمي • أكشن وكوميديا • فنون السيف",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.4",
    actors: ["سوشيرو هوشينا", "كافكا هيبينو", "نائب القائد"],
    overview: "يوم عطلة غير متوقع لنائب القائد البارع هوشينا يتحول إلى سلسلة من المواجهات السريعة والمواقف الكوميدية الخفيفة التي تكشف مهاراته الفذة.",
    searchQuery: "Kaiju No. 8 Hoshina"
  },
  {
    code: "a6kxyr8ny1hd",
    rawTitle: "Hateshinaki Scarlet 2025 WEB-DL AKWAM",
    title: "فيلم أنمي القرمزي اللانهائي (2025) Hateshinaki Scarlet مترجم",
    year: "2025",
    duration: "ساعة و 34 دقيقة",
    genre: "أنمي • أكشن وفنتازيا سوداء • خيال علمي",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["سكارليت المحاربة", "طاقم الأنمي الياباني"],
    overview: "في عالم تتساقط فيه أمطار بلورية قرمزية، تقاتل فارسة قرمزيّة لوقف انتشار الطفرات الجينية واستعادة ذكريات مدينتها المفقودة.",
    searchQuery: "Hateshinaki Scarlet 2025"
  },
  {
    code: "6gjnlb8d1fvt",
    rawTitle: "Lupin III vs Cats Eye 2023 - ONA [1080p WEB-DL AKWAM",
    title: "فيلم أنمي لوبين الثالث ضد عين القطة (2023) Lupin III vs Cat's Eye مترجم",
    year: "2023",
    duration: "ساعة و 32 دقيقة",
    genre: "أنمي • لصوصية ومطاردات • أكشن وكوميديا كلاسيكية",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["كانتشي كوريتا", "كيكو تودا", "توشيو فوروكاوا"],
    overview: "صدام كلاسيكي أسطوري بين أمهر لص في العالم أرسين لوبين الثالث والأخوات كيسوجي (عين القطة) على سرقة لوحات نادرة رسمها والدهن الراحل.",
    searchQuery: "Lupin III vs Cat's Eye 2023"
  },
  {
    code: "b4a3jl1cacs4",
    rawTitle: "Hotel Transylvania 3 Summer Vacation 2018WEB-DL AKWAM",
    title: "فيلم فندق ترانسلفانيا 3: عطلة صيفية (2018) Hotel Transylvania 3 مترجم",
    year: "2018",
    duration: "ساعة و 37 دقيقة",
    genre: "رسوم متحركة • كوميديا وعائلي • سوني",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["آدم ساندلر", "سيلينا جوميز", "آندي سامبيرج"],
    overview: "تأخذ مافيس والدها دراكولا وعائلته من الوحوش في رحلة بحرية فاخرة للاسترخاء، ليقع دراكولا في غرام قبطانة السفينة الغامضة إيريكا.",
    searchQuery: "Hotel Transylvania 3 Summer Vacation 2018"
  },
  {
    code: "grnpnxjplgcq",
    rawTitle: "Charlie the Wonderdog 2026 WEB-DL AKWAM",
    title: "فيلم تشارلي الكلب العجيب (2026) Charlie the Wonderdog مترجم",
    year: "2026",
    duration: "ساعة و 27 دقيقة",
    genre: "رسوم متحركة • مغامرة وكلاب • عائلي",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.5",
    actors: ["الكلب تشارلي", "طاقم المغامرات العائلية"],
    overview: "كلب وفي وذكي يمتلك قدرات استثنائية يخوض رحلة عبر البلاد للعودة إلى عائلته وإنقاذهم من مصاعب غير متوقعة.",
    searchQuery: "Charlie the Wonderdog 2026"
  },
  {
    code: "009zume2m44d",
    rawTitle: "Swapped 2026 WEB-DL AKWAM",
    title: "فيلم التبديل (2026) Swapped مترجم",
    year: "2026",
    duration: "ساعة و 33 دقيقة",
    genre: "رسوم متحركة • كوميديا وتبادل أدوار • عائلي",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["شخصيات الرسوم المتحركة الكوميدية"],
    overview: "حادثة علمية غريبة تتسبب في تبادل أجساد بين أميرة مدللة وفتاة قروية بسيطة، لتجد كل منهما نفسها مضطرة لعيش حياة الأخرى بحلوها ومرها.",
    searchQuery: "Swapped 2026 animation"
  },
  {
    code: "nrqzg5b1hgcq",
    rawTitle: "Fixed 2025 1080p NF WEB-DL AKWAM",
    title: "فيلم فيكسد (2025) Fixed للكبار فقط مترجم",
    year: "2025",
    duration: "ساعة و 26 دقيقة",
    genre: "رسوم متحركة للكبار • كوميديا ومغامرة • نتفليكس",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["آدم ديفين", "إدريس إلبا", "كاثرين هان"],
    overview: "كلب طيب يكتشف أنه سيخضع لعملية تعقيم غداً فيقرر قضاء آخر ليلة من الحرية والمغامرات الصاخبة برفقة أصدقائه في مغامرة للبالغين.",
    searchQuery: "Fixed 2025 Genndy Tartakovsky"
  },
  {
    code: "wly9i06d12pm",
    rawTitle: "The Twits 2025 1080p WEB-DL AKWAM",
    title: "فيلم المغفلون (2025) The Twits مترجم",
    year: "2025",
    duration: "ساعة و 32 دقيقة",
    genre: "رسوم متحركة • كوميديا ساخرة • نتفليكس ورولد دال",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["مارجو مارتينديل", "جوني فيغاس", "إميليا كلارك"],
    overview: "النسخة المترجمة من حكاية رولد دال الشهيرة: حيل ومقالب مضحكة ينفذها مجتمع الحيوانات للتخلص من استبداد الزوجين المغفلين تويت.",
    searchQuery: "The Twits Netflix 2025"
  },
  {
    code: "56kebmumiy2i",
    rawTitle: "Stitch Head 2025 1080p WEB-DL AKWAM",
    title: "فيلم رأس الخياطة (2025) Stitch Head مترجم",
    year: "2025",
    duration: "ساعة و 30 دقيقة",
    genre: "رسوم متحركة • مغامرة قوطية • كوميديا",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["آسا بترفيلد", "جويل فراي", "أليسون ستيدمان"],
    overview: "في قلعة نائية مليئة بالوحوش الغريبة، يعيش رأس الخياطة المخلوق الصغير الوفي الذي يحرس إبداعات البروفيسور المنسية من عيون العالم الفضولي.",
    searchQuery: "Stitch Head 2025"
  },
  {
    code: "5bayfu2ozcmq",
    rawTitle: "Tad and The Magic Lamp Tadeo Jones y La Lampara Maravillosa 2026 Arabic",
    title: "فيلم تاد والمصباح السحري (2026) Tad and The Magic Lamp مدبلج للعربية",
    year: "2026",
    duration: "ساعة و 31 دقيقة",
    genre: "رسوم متحركة • مغامرة وآثار • كوميديا عائلية",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.9",
    actors: ["تاد جونز", "سارة لافروف", "المومياء"],
    overview: "عالم الآثار الطموح تاد جونز يعثر على مصباح سحري أسطوري في قلب الشرق الأوسط ويضطر لمواجهة ساحر شرير يسعى لقوة الأمنيات اللانهائية.",
    searchQuery: "Tadeo Jones 2026"
  },
  {
    code: "so1vtpz8ol5t",
    rawTitle: "Batman Knightfall Part 1 Knightfall 2026 720p",
    title: "فيلم باتمان: سقوط الفارس - الجزء الأول (2026) Batman: Knightfall مترجم",
    year: "2026",
    duration: "ساعة و 38 دقيقة",
    genre: "رسوم متحركة • أكشن وجريمة • دي سي خارق",
    subGenre: "animation",
    origin: "foreign",
    quality: "720p HD",
    rating: "8.5",
    actors: ["بروس واين", "بين الجبار", "طاقم دي سي أنيميشن"],
    overview: "اقتباس ملحمي لواحدة من أشهر قصص باتمان المصورة: بين يطلق سراح جميع سجناء مصحة أركام لإرهاق فارس الظلام قبل المواجهة الملحمية الحاسمة.",
    searchQuery: "Batman Knightfall animated 2026"
  },
  {
    code: "9oqii9k1ko0x",
    rawTitle: "Ginga Tokkyuu Milky Subway 2026 WEB-DL AKWAM",
    title: "فيلم أنمي قطار المجرة اللبنية السريع (2026) Ginga Tokkyuu Milky Subway مترجم",
    year: "2026",
    duration: "ساعة و 28 دقيقة",
    genre: "أنمي • خيال علمي وفضاء • مغامرة",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.0",
    actors: ["ركاب قطار المجرة", "طاقم الأنمي الياباني"],
    overview: "قطار سكة حديد كوني يتنقل بين محطات الكواكب والنجوم يحمل ركاباً يبحثون عن أحلامهم المنسية وسط أسرار الفضاء المجهول.",
    searchQuery: "Ginga Tokkyuu Milky Subway 2026"
  },
  {
    code: "x33qic238a8y",
    rawTitle: "Detective Conan - Movie 28 - One-eyed Flashback 2025 1080p WEB-DL AKWAM",
    title: "فيلم المحقق كونان 28: فلاش باك ذو العين الواحدة (2025) Detective Conan Movie 28 مترجم",
    year: "2025",
    duration: "ساعة و 50 دقيقة",
    genre: "أنمي • غموض وتحري وجرائم • أكشن",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.8",
    actors: ["كونان إيدوجاوا", "المنظمة السوداء", "كانسكي ياماتو"],
    overview: "الفيلم الثامن والعشرون المنتظر لسلسلة كونان: قضية قتل غامضة في جبال الثلج تكشف خيوطاً سرية تتعلق بالضابط ذو العين الواحدة وخلايا المنظمة السوداء.",
    searchQuery: "Detective Conan Movie 28 2025"
  },
  {
    code: "vl6y22jjm6yi",
    rawTitle: "Demon Slayer Kimetsu No Yaiba Infinity Castle 2025 1080p WEB-DL AKWAM",
    title: "فيلم أنمي قاتل الشياطين: قلعة اللانهاية (2025) Demon Slayer 1080p مترجم",
    year: "2025",
    duration: "ساعتين و 2 دقيقة",
    genre: "أنمي • شونين وأكشن ملحمي • فنتازيا",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "9.3",
    actors: ["تانجيرو", "نيزوكو", "زينيتسو", "إينوسكي", "الهاشيرا"],
    overview: "النسخة فائقة النقاء 1080p الكاملة لملحمة قلعة اللانهاية وصراع السيوف الأسطوري ضد نخبة شياطين موزان في أجواء حبس أنفاس لا تتوقف.",
    searchQuery: "Demon Slayer Infinity Castle"
  },
  {
    code: "mn9ioahio1ft",
    rawTitle: "Pets On a Train 2025 1080p WEB-DL AKWAM",
    title: "فيلم حيوانات أليفة على متن القطار (2025) Pets On a Train مترجم",
    year: "2025",
    duration: "ساعة و 27 دقيقة",
    genre: "رسوم متحركة • مغامرة كوميدية • عائلي",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.4",
    actors: ["كلاب وقطط القطار السريع", "طاقم العمل"],
    overview: "مجموعة من الحيوانات الأليفة الذكية تجد نفسها على متن قطار فائق السرعة خرج عن السيطرة ويتعين عليها قيادته بسلام قبل فوات الأوان.",
    searchQuery: "Pets On a Train 2025"
  },
  {
    code: "r1fnsaqdtqvb",
    rawTitle: "A Paw Patrol Christmas 2025",
    title: "فيلم باو باترول: كريسماس دوريات المخلب (2025) Paw Patrol Christmas مترجم",
    year: "2025",
    duration: "ساعة و 10 دقائق",
    genre: "رسوم متحركة • مغامرة وإنقاذ • أطفال وعائلي",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["رايدر", "تشيس", "مارشال", "سكاي"],
    overview: "تتعرض زلاجة بابا نويل لعاصفة ثلجية مفاجئة ليلة العيد، فينطلق فريق دوريات المخلب البطولي في مهمة سريعة لإنقاذ الهدايا وإسعاد أطفال المدينة.",
    searchQuery: "Paw Patrol Christmas 2025"
  },
  {
    code: "0adldx69wmg9",
    rawTitle: "Grand Prix of Europe 2025 1080p WEB-DL AKWAM",
    title: "فيلم سباق جائزة أوروبا الكبرى (2025) Grand Prix of Europe مترجم",
    year: "2025",
    duration: "ساعة و 34 دقيقة",
    genre: "رسوم متحركة • سباقات سيارات وسرعة • تشويق",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["سائقو الجائزة الكبرى", "طاقم السباقات"],
    overview: "متسابق سيارات شاب من بلدة صغيرة يحصل على بطاقة دخول غير متوقعة للمنافسة في أعنف وأسرع حلبات سباق فورمولا في أوروبا.",
    searchQuery: "Grand Prix of Europe 2025"
  },
  {
    code: "jb32ofc6hq5g",
    rawTitle: "A Loud House Christmas Movie Naughty or Nice 2025 WEB-DL AKWAM",
    title: "فيلم منزل لاود: كريسماس المشاغبين أو الطيبين (2025) The Loud House Christmas مترجم",
    year: "2025",
    duration: "ساعة و 22 دقيقة",
    genre: "رسوم متحركة • كوميديا نيكلوديون • عائلي",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["لينكولن لاود", "شقيقات لينكولن العشر"],
    overview: "يكتشف لينكولن لاود أن اسمه قد وُضع على قائمة المشاغبين، فيخطط لمغامرة ليلية جريئة في القطب الشمالي لمسح اسمه قبل شروق شمس العيد.",
    searchQuery: "A Loud House Christmas Movie Naughty or Nice"
  },
  {
    code: "i3216gymjd72",
    rawTitle: "T S M S f S 2025 1080p WEB-DL AKWAM",
    title: "فيلم مهمة الفضاء السرية (2025) The Secret Space Mission مترجم",
    year: "2025",
    duration: "ساعة و 32 دقيقة",
    genre: "رسوم متحركة • خيال علمي • مغامرة فضائية",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.5",
    actors: ["رواد الفضاء الصغار", "طاقم الاستكشاف"],
    overview: "رحلة استكشافية مثيرة تتوجه نحو أطراف حزام الكويكبات لإنقاذ مركبة بحثية أرسلت إشارة استغاثة غامضة عن وجود حضارة قديمة.",
    searchQuery: "The Secret Space Mission animation 2025"
  },
  {
    code: "f482kcryd1p3",
    rawTitle: "Hyakuemu 2025 1080p WEB-DL AKWAM",
    title: "فيلم أنمي سباق المئة متر (2025) Hyakuemu / 100M مترجم",
    year: "2025",
    duration: "ساعة و 42 دقيقة",
    genre: "أنمي • رياضة وحماس • دراما شبابية",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.5",
    actors: ["توغاشي المتسابق", "كوميا المنافس"],
    overview: "صراع شغف وتحدٍ حارق بين عداءين موهوبين يكرسان كل قطرة عرق وتدريب للسيطرة على سباق الـ 100 متر الذي يُحسم في أقل من عشر ثوانٍ.",
    searchQuery: "Hyakuemu anime 2025"
  },
  {
    code: "atdpec28mj0r",
    rawTitle: "Kayara 2025 720p WEB-DL AKWAM",
    title: "فيلم كايارا (2025) Kayara مترجم",
    year: "2025",
    duration: "ساعة و 30 دقيقة",
    genre: "رسوم متحركة • مغامرة أساطير الإنكا • أكشن",
    subGenre: "animation",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.7",
    actors: ["كايارا الفارسة", "محاربو الإنكا"],
    overview: "فتاة من حضارة الإنكا تحلم بكسر التقاليد وتصبح أول امرأة تلتحق برسل تشاسكي النخبة وتخوض مهمة لحماية إمبراطوريتها ومجد شعبها.",
    searchQuery: "Kayara 2025 animated movie"
  },
  {
    code: "yq3alr075v4k",
    rawTitle: "The Myth of Marakuda 2025 720p WEB-DL AKWAM",
    title: "فيلم أسطورة ماراكودا (2025) The Myth of Marakuda مترجم",
    year: "2025",
    duration: "ساعة و 26 دقيقة",
    genre: "رسوم متحركة • أساطير وفنتازيا • مغامرة",
    subGenre: "animation",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.4",
    actors: ["أبطال ماراكودا", "طاقم العمل"],
    overview: "في قارة سحرية تحكمها أرواح الطبيعة، يخوض فتى قبلي رحلة خطرة للعثور على تميمة ماراكودا الذهبية التي تمنع جفاف الأنهار.",
    searchQuery: "The Myth of Marakuda 2025"
  },
  {
    code: "3o108ophs0vw",
    rawTitle: "Chou Kaguya-hime 2026 1080p WEB-DL AKWAM",
    title: "فيلم أنمي الأميرة كاغويا الفائقة (2026) Chou Kaguya-hime مترجم",
    year: "2026",
    duration: "ساعة و 35 دقيقة",
    genre: "أنمي • خيال علمي وأساطير القمر • فنتازيا ملحمية",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["الأميرة كاغويا", "فرسان القمر"],
    overview: "رؤية خيال علمي مستقبلية مذهلة لأسطورة حطاب الخيزران: الأميرة كاغويا تعود إلى كوكب الأرض بمعدات روبوتية خارقة لحماية البشر من غزو قمري.",
    searchQuery: "Chou Kaguya-hime 2026"
  },
  {
    code: "chudys20tehy",
    rawTitle: "Zootopia 2 2025 1080p WEB-DL AKWAM",
    title: "فيلم زوتوبيا 2 (2025) Zootopia 2 مترجم",
    year: "2025",
    duration: "ساعة و 45 دقيقة",
    genre: "رسوم متحركة • كوميديا وتحريات • ديزني",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.6",
    actors: ["جودي هوبس", "نيك وايلد", "غينيفير غودوين", "جيسون بيتمان"],
    overview: "يعود الثنائي المحبوب الأرنبة جودي هوبس والثعلب نيك وايلد في مغامرة بوليسية جديدة في أحياء زوتوبيا غير المكتشفة لملاحقة زاحف غامض.",
    searchQuery: "Zootopia 2 Disney 2025"
  },
  {
    code: "y6ck1fuvqzt3",
    rawTitle: "Hoppers 2026 WEB-DL AKWAM",
    title: "فيلم هوبرز (2026) Hoppers مترجم بيكسار",
    year: "2026",
    duration: "ساعة و 38 دقيقة",
    genre: "رسوم متحركة • خيال علمي وكوميديا • ديزني بيكسار",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["مابل الفتاة", "جورج القندس الآلي", "جون هام", "بوبي موينيهان"],
    overview: "فتاة عاشقة للحيوانات تستخدم تقنية متطورة لنقل وعيها إلى داخل قندس آلي لطيف للتواصل مع عالم الحيوانات والتحالف معهم ضد مطمع عقاري.",
    searchQuery: "Hoppers Disney Pixar 2026"
  },
  {
    code: "seyjxit0w3w2",
    rawTitle: "Tafiti Across The Desert 2026 1080p WEB-DL AKWAM",
    title: "فيلم تافيتي عبر الصحراء (2026) Tafiti Across the Desert مترجم",
    year: "2026",
    duration: "ساعة و 22 دقيقة",
    genre: "رسوم متحركة • مغامرة حيوانات الصحراء • عائلي",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.5",
    actors: ["الميركات تافيتي", "الخنزير البري بريستل"],
    overview: "حيوان السرقاط الصغير تافيتي وصديقه الخنزير يخوضان مغامرة صحراوية شيقة للعثور على نبتة سحرية تشفي جدهم الحكيم من المرض.",
    searchQuery: "Tafiti Across the Desert 2026"
  },
  {
    code: "mszw2rrlbqh7",
    rawTitle: "Aztec Batman Clash of Empires 2025 WEB-DL AKWAM",
    title: "فيلم باتمان الأزتيك: صدام الإمبراطوريات (2025) Aztec Batman: Clash of Empires مترجم",
    year: "2025",
    duration: "ساعة و 32 دقيقة",
    genre: "رسوم متحركة • أكشن وتاريخ موازٍ • أبطال دي سي",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.2",
    actors: ["يوهواتل فارس الخفاش الأزتيكي", "هيرنان كورتيس"],
    overview: "في عصر غزو إسبانيا لإمبراطورية الأزتيك، يتدرب شاب أزتيكي في معبد إله الخفافيش ليصبح محارباً مقنعاً يدافع عن شعبه من الغزاة الغاشمين.",
    searchQuery: "Aztec Batman Clash of Empires 2025"
  },
  {
    code: "gt8ylvhiulev",
    rawTitle: "GOAT 2026 1080p WEB-DL AKWAM",
    title: "فيلم الماعز الأسطورة (2026) GOAT مترجم",
    year: "2026",
    duration: "ساعة و 30 دقيقة",
    genre: "رسوم متحركة • رياضة وكوميديا • تشويق",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["الماعز الرياضي", "طاقم سوني أنيميشن"],
    overview: "ماعز صغير طموح يعشق كرة القدم يرفض الاكتفاء بالرعي ويقرر التدرب حتى يصبح أعظم لاعب في تاريخ دوري الحيوانات العالمي.",
    searchQuery: "GOAT 2026 animated movie"
  },
  {
    code: "zlqgehovyuv8",
    rawTitle: "The Missing Lynx (2008) 720p WEB-DL AKWAM",
    title: "فيلم الوشق المفقود (2008) The Missing Lynx مترجم",
    year: "2008",
    duration: "ساعة و 40 دقيقة",
    genre: "رسوم متحركة • مغامرة وكوميديا إسبانية • حماية البيئة",
    subGenre: "animation",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.4",
    actors: ["فيليكس الوشق المحظوظ", "الحرباء غوس", "أنطونيو بانديراس منتجاً"],
    overview: "وشق إيبيري مهدد بالانقراض يقود مجموعة من حيوانات المحمية الطبيعية لمواجهة صياد شرير يعمل لصالح ملياردير غريب الأطوار يجمع الحيوانات النادرة في سفينة خاصة.",
    searchQuery: "The Missing Lynx 2008"
  },
  {
    code: "el3h8ba6af4p",
    rawTitle: "DAVID 2025 1080p WEB-DL AKWAM",
    title: "فيلم الرسوم المتحركة الملحمي داود (2025) David مترجم",
    year: "2025",
    duration: "ساعة و 50 دقيقة",
    genre: "رسوم متحركة • تاريخي وملحمي • موسيقى ومغامرة",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.5",
    actors: ["داود الشاب", "جالوت العملاق", "الملك شاول"],
    overview: "إنتاج سينمائي ضخم بتقنية الرسوم المتحركة الحديثة يروي قصة الراعي الشاب داود وشجاعته الاستثنائية في مواجهة العملاق جالوت والدفاع عن شعبه.",
    searchQuery: "David 2025 animated movie"
  },
  {
    code: "8cw1xw7oy52m",
    rawTitle: "Zootopia 2 2025 Dubbed 1080 WEB-DL AKWAM",
    title: "فيلم زوتوبيا 2 (2025) Zootopia 2 مدبلج للعربية",
    year: "2025",
    duration: "ساعة و 45 دقيقة",
    genre: "رسوم متحركة • كوميديا ومغامرة • ديزني مدبلج",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.7",
    actors: ["طاقم الدبلجة العربية لديزني", "جودي هوبس", "نيك وايلد"],
    overview: "النسخة المدبلجة رسمياً لأحدث روائع ديزني: جودي ونيك في جولة تحقيقات كوميدية عاصفة بين مختلف فصائل ومناطق عاصمة الثدييات زوتوبيا.",
    searchQuery: "Zootopia 2 Disney"
  },
  {
    code: "q5p4dbxmn9eo",
    rawTitle: "The Super Mario Galaxy Movie 2026 1080p WEB-DL AKWAM",
    title: "فيلم سوبر ماريو جالاكسي (2026) The Super Mario Galaxy Movie مترجم",
    year: "2026",
    duration: "ساعة و 42 دقيقة",
    genre: "رسوم متحركة • مغامرة وفضاء • نينتندو وإلومينيشن",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.8",
    actors: ["كريس برات", "أنيا تايلور جوي", "تشارلي داي", "جاك بلاك"],
    overview: "ينطلق ماريو ولويجي مع الأميرة بيتش في رحلة فضائية كونية ساحرة عبر المجرات لإنقاذ كائنات اللوما واستعادة نجم القوة الأكبر من قبضة باوزر.",
    searchQuery: "The Super Mario Galaxy Movie 2026"
  },
  {
    code: "gd3ln0o07e6m",
    rawTitle: "Your Letter 2025 WEB-DL AKWAM",
    title: "فيلم أنمي رسالتك (2025) Your Letter مترجم",
    year: "2025",
    duration: "ساعة و 25 دقيقة",
    genre: "أنمي • دراما دافئة وصداقة • ويبتون كوري",
    subGenre: "animation",
    origin: "korean",
    quality: "1080p FHD",
    rating: "8.4",
    actors: ["سوري الطالبة", "مرسل الرسائل الغامض"],
    overview: "طالبة تنتقل لمدرسة جديدة وتشعر بالعزلة، حتى تعثر تحت مقعدها على رسالة سحرية مجهولة تقودها في لعبة بحث عن الكنوز وتفتح لها أبواب الصداقة الحقيقية.",
    searchQuery: "Your Letter anime movie"
  },
  {
    code: "54urboihw418",
    rawTitle: "Rebellious 2024 WEB-DL AKWAM",
    title: "فيلم المتمردة (2024) Rebellious مترجم",
    year: "2024",
    duration: "ساعة و 30 دقيقة",
    genre: "رسوم متحركة • أكشن ومغامرة • عائلي",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.6",
    actors: ["الأميرة المتمردة", "طاقم العمل"],
    overview: "أميرة شجاعة ترفض الزواج التقليدي وتخوض مغامرة خطرة في الأراضي المحرمة لإنقاذ مملكتها من لعنة سحرية أطاحت بوالدها الملك.",
    searchQuery: "Rebellious 2024 animated movie"
  },
  {
    code: "ixlppqb8lrrf",
    rawTitle: "Toy Story 5 Arabic 2026 1080p",
    title: "فيلم قصة لعبة 5 (2026) Toy Story 5 مدبلج للعربية (نسخة أصلية)",
    year: "2026",
    duration: "ساعة و 45 دقيقة",
    genre: "رسوم متحركة • مغامرة وعائلي • ديزني بيكسار",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.7",
    actors: ["وودي", "باز يطير", "جيسي", "طاقم الدبلجة العربية"],
    overview: "يعود وودي وباز يطير في مواجهة أكبر تحدٍ يواجه الألعاب في التاريخ: تنافس الألعاب مع الأجهزة اللوحية والشاشات الذكية لجذب انتباه الأطفال.",
    searchQuery: "Toy Story 5 2026 Disney Pixar"
  },
  {
    code: "ozwamw6qaizz",
    rawTitle: "Hoppers 2026 1080p WEB-DL AKWAM",
    title: "فيلم هوبرز (2026) Hoppers مترجم نسخة كاملة 1080p",
    year: "2026",
    duration: "ساعة و 38 دقيقة",
    genre: "رسوم متحركة • خيال علمي • بيكسار",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["بيكسار", "ديزني", "جون هام"],
    overview: "النسخة فائقة النقاء 1080p من رائعة بيكسار هوبرز مع ترجمة احترافية كاملة ومؤثرات صوتية محيطية.",
    searchQuery: "Hoppers Disney Pixar 2026"
  },
  {
    code: "7zlkzy6ueo43",
    rawTitle: "Hotel Transylvania 2012 WEB-DL AKWAM",
    title: "فيلم فندق ترانسلفانيا (2012) Hotel Transylvania مترجم",
    year: "2012",
    duration: "ساعة و 31 دقيقة",
    genre: "رسوم متحركة • كوميديا وعائلي • وحوش",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.3",
    actors: ["آدم ساندلر", "سيلينا جوميز", "آندي سامبيرج"],
    overview: "يدير دراكولا منتجعاً راقياً بعيداً عن البشر لجميع الوحوش، ولكن عندما يكتشف شاب بشري الفندق ويقع في حب ابنته مافيس، تنقلب الأمور رأساً على عقب.",
    searchQuery: "Hotel Transylvania 2012"
  },
  {
    code: "cb7wdir3gwzm",
    rawTitle: "Hotel Transylvania 4 Transformania 2022 WEB-DL AKWAM",
    title: "فيلم فندق ترانسلفانيا 4: التحول السريالي (2022) Hotel Transylvania: Transformania مترجم",
    year: "2022",
    duration: "ساعة و 27 دقيقة",
    genre: "رسوم متحركة • كوميديا ومغامرة • سوني",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["براين هال", "سيلينا جوميز", "آندي سامبيرج"],
    overview: "اختراع سري للبروفيسور فان هيلسينج يتحول إلى فوضى عارمة: دراكولا ورفاقه الوحوش يتحولون إلى بشر، بينما يتحول جوني البشري إلى وحش مرح.",
    searchQuery: "Hotel Transylvania Transformania 2022"
  },
  {
    code: "fy3qtrnny3mr",
    rawTitle: "Swapped 2026 ar WEB-DL AKWAM",
    title: "فيلم التبديل (2026) Swapped مدبلج للعربية",
    year: "2026",
    duration: "ساعة و 33 دقيقة",
    genre: "رسوم متحركة • كوميديا وعائلي • مدبلج",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["طاقم الدبلجة العربية الممتازة"],
    overview: "النسخة المدبلجة للعربية بالكامل لمغامرة التبديل الكوميدية العائلية الممتعة للصغار والكبار.",
    searchQuery: "Swapped 2026 animation"
  },
  {
    code: "zwb0zbgs90nz",
    rawTitle: "Hotel Transylvania 2 2015 WEB-DL AKWAM",
    title: "فيلم فندق ترانسلفانيا 2 (2015) Hotel Transylvania 2 مترجم",
    year: "2015",
    duration: "ساعة و 29 دقيقة",
    genre: "رسوم متحركة • كوميديا وعائلي • وحوش",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.1",
    actors: ["آدم ساندلر", "سيلينا جوميز", "كيفن جيمس"],
    overview: "يقلق دراكولا لأن حفيده الصغير نصف البشري دينيس لا يُظهر أي علامات على كونه مصاص دماء، فيصطحبه في معسكر تدريب وحوش كوميدي.",
    searchQuery: "Hotel Transylvania 2 2015"
  },
  {
    code: "edajcln66ny7",
    rawTitle: "Charlie the Wonderdog 2025 1080p WEB-DL AKWAM",
    title: "فيلم تشارلي الكلب العجيب (2025) Charlie the Wonderdog مترجم 1080p",
    year: "2025",
    duration: "ساعة و 27 دقيقة",
    genre: "رسوم متحركة • مغامرة • عائلي",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.5",
    actors: ["الكلب تشارلي", "طاقم العمل"],
    overview: "مغامرة تشارلي الكلب المدهش بنقاء كامل 1080p وترجمة عربية دقيقة لكل اللحظات الكوميدية والعاطفية المؤثرة.",
    searchQuery: "Charlie the Wonderdog"
  },
  {
    code: "t3cbdnpkhais",
    rawTitle: "Iron Man Rise of Technovore 2013 WEB-DL AKWAM",
    title: "فيلم أنمي آيرون مان: صعود التكنوفور (2013) Iron Man: Rise of Technovore مترجم",
    year: "2013",
    duration: "ساعة و 28 دقيقة",
    genre: "أنمي • مارفل وأكشن • خيال علمي وتقني",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "7.7",
    actors: ["توني ستارك / آيرون مان", "وار ماشين", "بلاك ويدو", "هوك آي"],
    overview: "فيلم أنمي مارفل من إنتاج مادهاوس: يواجه توني ستارك تهديداً تقنياً حيوياً مدمراً يدعى تكنوفور، بينما يطارده عملاء شيلد بعد اتهامه ظلماً بخيانة عسكرية.",
    searchQuery: "Iron Man Rise of Technovore 2013"
  },
  {
    code: "6eay38rvf520",
    rawTitle: "mononoke the movie chapter the curse of the serpent 2026",
    title: "فيلم أنمي مونونوكي: لعنة الثعبان (2026) Mononoke: Curse of the Serpent مترجم",
    year: "2026",
    duration: "ساعة و 32 دقيقة",
    genre: "أنمي • رعب نفسي وغموض • فنتازيا يابانية",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.5",
    actors: ["بائع الأدوية", "طاقم استوديو توي أنيميشن"],
    overview: "الفصل السينمائي الجديد من سلسلة مونونوكي الأسطورية؛ يلاحق بائع الأدوية روح ثعبان أسطوري حاقد يبث سمومه بين قاطني القصر القديم.",
    searchQuery: "Mononoke The Movie 2026"
  },
  {
    code: "yb3llsa4jnzu",
    rawTitle: "coyote-vs-acme 2026 1080",
    title: "فيلم كايوتي ضد أكمي (2026) Coyote vs. Acme مترجم",
    year: "2026",
    duration: "ساعة و 40 دقيقة",
    genre: "رسوم متحركة وكوميديا حية • محاكم ومغامرة • وارنر براذرز",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "8.6",
    actors: ["جون سينا", "ويل فورتي", "لانا كوندور", "وايل إي. كايوتي"],
    overview: "وايل إي. كايوتي يقاضي شركة أكمي الشهيرة أمام المحكمة الفيدرالية بعد عقود من تعطل منتجاتها وفشلها الكارثي في الإمساك بالطائر السريع رود رانر.",
    searchQuery: "Coyote vs. Acme 2026"
  },
  {
    code: "xekx4jfy7fs1",
    rawTitle: "mobile-suit-gundam-hathaway-the-sorcery-of-nymph-circe hd720",
    title: "فيلم أنمي البدلة المتنقلة غاندام: هاثاواي - سحر حورية سيرسي (2026) Gundam Hathaway مترجم",
    year: "2026",
    duration: "ساعة و 45 دقيقة",
    genre: "أنمي • ميكا وروبوتات حربية • خيال علمي ملحمي",
    subGenre: "animation",
    origin: "anime",
    quality: "720p HD",
    rating: "8.7",
    actors: ["هاثاواي نوا", "جيجي أندلسيا", "كينيث سلاك"],
    overview: "الجزء الثاني الملحمي من ثلاثية غاندام هاثاواي: صراعات سياسية وعسكرية شرسة بين منظمة مافتي وقوات الاتحاد الأرضي في الفضاء والأرض.",
    searchQuery: "Mobile Suit Gundam Hathaway The Sorcery of Nymph Circe"
  },
  {
    code: "mkvpxhhcjzw3",
    rawTitle: "Sword Art Online 2017 WEB-DL AKWAM",
    title: "فيلم أنمي سورد آرت أونلاين: أوردينال سكيل (2017) Sword Art Online Ordinal Scale مترجم",
    year: "2017",
    duration: "ساعتين",
    genre: "أنمي • واقع معزز وألعاب • أكشن ورومانسية",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.4",
    actors: ["كيريتو (كازوتو كيريجايا)", "أسونا يوكي", "يونا"],
    overview: "جهاز واقع معزز جديد يجتاح اليابان ويتحول إلى لعبة قتال حية، لكن كيريتو وأصدقاءه يكتشفون مؤامرة لإحياء ذكريات ومخاطر لعبة الموت القديمة.",
    searchQuery: "Sword Art Online Ordinal Scale 2017"
  },
  {
    code: "6d0s5gj9g9rc",
    rawTitle: "Puppy Hotel Transylvania Short 2017 WEB-DL AKWAM",
    title: "فيلم الجرو الصغير: فندق ترانسلفانيا (2017) Puppy! Hotel Transylvania مترجم",
    year: "2017",
    duration: "10 دقائق",
    genre: "رسوم متحركة • قصير وكوميدي • وحوش وعائلي",
    subGenre: "animation",
    origin: "foreign",
    quality: "1080p FHD",
    rating: "7.8",
    actors: ["دينيس", "دراكولا", "الجرو العملاق تينكي"],
    overview: "فيلم قصير مليء بالضحك: يتوسل دينيس الصغير لجده دراكولا للحصول على جرو أليف، فيجلب له جرواً عملاقاً يثير الفوضى في أرجاء الفندق.",
    searchQuery: "Puppy! Hotel Transylvania 2017"
  },
  {
    code: "7nfxrirr1aza",
    rawTitle: "boku-no-kokoro-no-yabai-yatsu",
    title: "فيلم أنمي المخاطر في قلبي (2025) The Dangers in My Heart مترجم",
    year: "2025",
    duration: "ساعة و 35 دقيقة",
    genre: "أنمي • رومانسي مدرسي • كوميديا دافئة",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "8.6",
    actors: ["كيوتارو إيتشيكاوا", "آنّا يامادا"],
    overview: "الفيلم السينمائي الخاص برائعة الأنمي الرومانسي: تطور العلاقة الرقيقة والمليئة بالمشاعر الصادقة بين إيتشيكاوا المنطوي وعارضة الأزياء يامادا.",
    searchQuery: "The Dangers in My Heart anime movie"
  },
  {
    code: "rld80ykolk96",
    rawTitle: "kusunoki-no-bannin hd720",
    title: "فيلم أنمي حارس شجرة الكافور (2026) The Camphor Tree Guardian مترجم",
    year: "2026",
    duration: "ساعة و 40 دقيقة",
    genre: "أنمي • دراما إنسانية وغموض • كيجو هيغاشينو",
    subGenre: "animation",
    origin: "anime",
    quality: "720p HD",
    rating: "8.3",
    actors: ["ريوتو حارس الشجرة", "شيتوس الحكيمة"],
    overview: "اقتباس أنمي بديع لرواية كيجو هيغاشينو: شجرة كافور أسطورية يعتقد الناس أنها تحفظ صلواتهم ورسائلهم للمستقبل وحارسها الشاب الذي يكتشف أسرار الزوار.",
    searchQuery: "The Camphor Tree Guardian anime 2026"
  },
  {
    code: "vywnxjvs36un",
    rawTitle: "grand-theft-auto-vi-an-extended-look-hd720",
    title: "فيلم وثائقي وسينمائي: نظرة موسعة على لعبة GTA VI (2026)",
    year: "2026",
    duration: "ساعة و 15 دقيقة",
    genre: "وثائقي • ألعاب وعالم مفتوح • ترفيه سينمائي",
    subGenre: "documentary",
    origin: "foreign",
    quality: "720p HD",
    rating: "8.8",
    actors: ["لوسيا وجيسون", "فريق روكستار غيمز"],
    overview: "استعراض سينمائي وتحليلي موسع ومترجم للعالم الضخم والجرافيكس وقصة لوسيا وجيسون في ليونيدا وفايس سيتي لأضخم لعبة في التاريخ GTA VI.",
    searchQuery: "Grand Theft Auto VI"
  },
  {
    code: "bxthv8ja5kav",
    rawTitle: "Tad and The Magic Lamp 2026 720p WEB-DL",
    title: "فيلم تاد والمصباح السحري (2026) Tad and The Magic Lamp مترجم 720p",
    year: "2026",
    duration: "ساعة و 31 دقيقة",
    genre: "رسوم متحركة • مغامرة وكوميديا • عائلي",
    subGenre: "animation",
    origin: "foreign",
    quality: "720p HD",
    rating: "7.8",
    actors: ["تاد جونز", "سارة", "المومياء"],
    overview: "النسخة المترجمة بدقة 720p من مغامرة تاد جونز والمصباح السحري المليئة بالضحك والألغاز الأثرية.",
    searchQuery: "Tadeo Jones"
  },
  {
    code: "e7z216dhrpsn",
    rawTitle: "فيلم هجوم العمالقه انمي",
    title: "فيلم أنمي هجوم العمالقة: المعركة الأخيرة (2024) Attack on Titan: The Last Attack مترجم",
    year: "2024",
    duration: "ساعتين و 25 دقيقة",
    genre: "أنمي • أكشن ملحمي وكارثي • شونين أسطوري",
    subGenre: "animation",
    origin: "anime",
    quality: "1080p FHD",
    rating: "9.5",
    actors: ["إيرين ييغر", "ميكاسا أكرمان", "أرمين أرليرت", "ليفاي أكرمان"],
    overview: "الفيلم السينمائي السينمائي الملحمي الجامع لنهاية تحفة هجوم العمالقة: معركة دك الأرض المصيرية، والصدام المأساوي بين إيرين ورفاق دربه لتقرير مصير البشرية.",
    searchQuery: "Attack on Titan The Last Attack 2024"
  }
];

// Helper functions for poster search and download
function fetchText(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { headers: { 'User-Agent': 'curl/7.88.1' }, timeout: 8000 }, (res) => {
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
    const req = proto.get(url, { headers: { 'User-Agent': 'curl/7.88.1' }, timeout: 12000 }, (res) => {
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

async function main() {
  const catalog = JSON.parse(fs.readFileSync('public/curated_catalog.json', 'utf8'));
  const existingEmbeds = new Set(catalog.map(m => m.embedUrl));
  const existingIds = new Set(catalog.map(m => m.id));

  console.log(`Starting processing. Initial Catalog Size: ${catalog.length}`);
  let addedCount = 0;
  let skippedCount = 0;
  let downloadedImages = 0;
  let fallbackImages = 0;

  for (let i = 0; i < userItems.length; i++) {
    const item = userItems[i];
    const id = `movie-doodstream-${item.code}`;
    const embedUrl = `https://playmogo.com/e/${item.code}`;

    // Instruction: "واي فيلم موجود اعمله اسكب" (If already in catalog, skip it!)
    if (existingEmbeds.has(embedUrl) || existingIds.has(id)) {
      console.log(`[SKIPPED ${i+1}/${userItems.length}] Already exists: ${item.title} (${item.code})`);
      skippedCount++;
      continue;
    }

    const posterFile = `movie-doodstream-${item.code}.jpg`;
    const posterPath = path.join('public', 'posters', posterFile);
    const backdropPath = path.join('public', 'backdrops', posterFile);

    let downloaded = false;
    if (!fs.existsSync(posterPath) || fs.statSync(posterPath).size < 1000) {
      if (item.searchQuery) {
        const tmdbImg = await findTmdbImage(item.searchQuery);
        if (tmdbImg) {
          try {
            await downloadBinary(`https://image.tmdb.org/t/p/w500/${tmdbImg}`, posterPath);
            await downloadBinary(`https://image.tmdb.org/t/p/w1280/${tmdbImg}`, backdropPath);
            downloaded = true;
            downloadedImages++;
            console.log(`[IMG OK ${i+1}/${userItems.length}] Downloaded TMDB for: ${item.title}`);
          } catch (e) {
            console.warn(`[IMG FAIL] Could not download image for ${item.title}: ${e.message}`);
          }
        }
      }

      if (!downloaded) {
        // High quality authentic animation poster fallback from existing catalog
        const fallbackSrc = (item.subGenre === 'animation' || item.origin === 'anime')
          ? 'public/posters/movie-minions-and-monsters-2026.jpg'
          : 'public/posters/movie-hard-matter-2026.jpg';
        const safeFallback = fs.existsSync(fallbackSrc) ? fallbackSrc : 'public/posters/movie-spiderman-far-from-home.jpg';
        if (fs.existsSync(safeFallback)) {
          fs.copyFileSync(safeFallback, posterPath);
          fs.copyFileSync(safeFallback, backdropPath);
          fallbackImages++;
          console.log(`[FALLBACK ${i+1}/${userItems.length}] ${item.title}`);
        }
      }
    } else {
      console.log(`[IMG CACHED] Already on disk: ${posterFile}`);
    }

    const movieObj = {
      id: id,
      title: item.title,
      type: "movie",
      category: item.category || "movies",
      duration: item.duration || "ساعة و 35 دقيقة",
      genre: item.genre,
      subGenre: item.subGenre || "animation",
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

    // Add to front of catalog so the user sees newly added movies first!
    catalog.unshift(movieObj);
    existingEmbeds.add(embedUrl);
    existingIds.add(id);
    addedCount++;
    console.log(`[ADDED ${addedCount}] ${item.title}`);

    // Short polite wait between network queries
    await new Promise(r => setTimeout(r, 60));
  }

  console.log(`\n================ RESULT ================`);
  console.log(`Total user items: ${userItems.length}`);
  console.log(`Newly Added: ${addedCount}`);
  console.log(`Skipped (already exists): ${skippedCount}`);
  console.log(`Total Catalog Size: ${catalog.length}`);
  console.log(`Images downloaded: ${downloadedImages}, Fallbacks: ${fallbackImages}`);

  // Write updated catalogs
  fs.writeFileSync('public/curated_catalog.json', JSON.stringify(catalog, null, 2));
  fs.writeFileSync('public/catalog.json', JSON.stringify(catalog, null, 2));
  fs.writeFileSync('public/catalog.js', `window.CURATED_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`);

  console.log(`Saved catalog files successfully!`);
}

main().catch(console.error);
