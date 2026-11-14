import { TanachBookItem } from '../types';

export const NEVIIM_BOOKS_DATA: TanachBookItem[] = [
  {
    id: 'joshua',
    nameEn: 'Joshua',
    nameHe: 'יהושע',
    transliteration: 'Yehoshua',
    section: 'neviim',
    categoryEn: 'Early Prophets',
    categoryHe: 'נביאים ראשונים',
    chaptersCount: 24,
    emoji: '🎺',
    color: '#d97706',
    bgLight: '#fffbeb',
    authorOrTradition: 'Joshua',
    summary: 'Joshua leads the children of Israel across the Jordan River into the Promised Land of milk and honey. Shofars sound around the stone walls of Jericho, and Joshua famously commands the sun and moon to stand still at the Valley of Ayalon!',
    famousStories: [
      'Crossing the Jordan River on dry land into the Land of Israel',
      'The march around Jericho and the sounding of the Shofars',
      'The Sun and Moon standing still over the Valley of Ayalon',
      'Caleb receiving the mountain city of Hebron with great strength'
    ],
    keyLesson: '“Chazak Ve’ematz” — Be strong and courageous! Always trust in Hashem and step forward with bravery to help your community.',
    famousVerse: {
      he: 'חזק ואמץ אל-תערץ ואל-תחת כי עמך ה׳ אלקיך בכל אשר תלך',
      transliteration: 'Chazak ve’ematz, al ta’arotz ve’al techat, ki imcha Hashem Elokecha be-chol asher telech!',
      en: 'Be strong and courageous! Do not be terrified or discouraged, for Hashem your God is with you wherever you go!',
      source: 'Joshua 1:9'
    },
    heroLinks: [
      { id: 'joshua', nameEn: 'Joshua', emoji: '🎺' },
      { id: 'caleb', nameEn: 'Caleb', emoji: '🍇' },
      { id: 'rahab', nameEn: 'Rahab', emoji: '🎗️' }
    ]
  },
  {
    id: 'judges',
    nameEn: 'Judges',
    nameHe: 'שופטים',
    transliteration: 'Shoftim',
    section: 'neviim',
    categoryEn: 'Early Prophets',
    categoryHe: 'נביאים ראשונים',
    chaptersCount: 21,
    emoji: '⚖️',
    color: '#0284c7',
    bgLight: '#f0f9ff',
    authorOrTradition: 'Samuel the Prophet',
    summary: 'Inspiring judges and leaders protect the people of Israel! Deborah leads with wisdom and sings of victory under her palm tree, Gideon wins with torches and shofars carrying only 300 helpers, and Samson displays astonishing physical strength.',
    famousStories: [
      'Deborah the prophetess leading and singing under the palm tree',
      'Gideon testing the water and leading his 300 brave helpers',
      'Samson’s riddle of sweet honey from the lion and his mighty deeds',
      'Yael opening her tent with kindness and bravery'
    ],
    keyLesson: 'Anyone can stand up to do what is right. True strength comes from wisdom, justice, and standing together.',
    famousVerse: {
      he: 'ואהביו כצאת השמש בגברתו',
      transliteration: 'Ve-ohavav ke-tzet ha-shemesh bigvurato!',
      en: 'May those who love goodness shine brightly like the sun rising in full strength!',
      source: 'Judges 5:31'
    },
    heroLinks: [
      { id: 'deborah', nameEn: 'Deborah', emoji: '🌴' },
      { id: 'gideon', nameEn: 'Gideon', emoji: '🏺' },
      { id: 'samson', nameEn: 'Samson', emoji: '🦁' },
      { id: 'yael', nameEn: 'Yael', emoji: '⛺' }
    ]
  },
  {
    id: 'samuel',
    nameEn: 'Samuel',
    nameHe: 'שמואל',
    transliteration: 'Shmuel',
    section: 'neviim',
    categoryEn: 'Early Prophets (I & II Samuel)',
    categoryHe: 'נביאים ראשונים',
    chaptersCount: 55,
    emoji: '👑',
    color: '#8b5cf6',
    bgLight: '#f5f3ff',
    authorOrTradition: 'Samuel, Gad the Seer & Nathan',
    summary: 'Hannah prays from her deepest heart at Shiloh, young Samuel hears Hashem calling in the quiet night (“Hineini!”), and gentle shepherd boy David defeats giant Goliath with faith, anointing him as the beloved King of Israel.',
    famousStories: [
      'Hannah’s quiet, heartfelt prayer that inspired all Jewish prayer',
      'Young Samuel answering Hashem’s call: “Speak, for Your servant listens!”',
      'Young David confronting Goliath with a slingshot, pebble, and faith',
      'The beautiful lifelong friendship and loyalty of David and Jonathan'
    ],
    keyLesson: 'Hashem looks at what is in our hearts, not outside appearance. A true friend loves at all times, and humility conquers giants.',
    famousVerse: {
      he: 'כי האדם יראה לעינים וה׳ יראה ללבב',
      transliteration: 'Ki ha-adam yir’eh la-einayim, va-Hashem yir’eh la-levav!',
      en: 'Humans look at outward appearance, but Hashem looks at the heart!',
      source: 'I Samuel 16:7'
    },
    heroLinks: [
      { id: 'hannah', nameEn: 'Hannah', emoji: '🙏' },
      { id: 'samuel', nameEn: 'Samuel', emoji: '📜' },
      { id: 'david', nameEn: 'King David', emoji: '👑' },
      { id: 'jonathan', nameEn: 'Jonathan', emoji: '🏹' }
    ]
  },
  {
    id: 'kings',
    nameEn: 'Kings',
    nameHe: 'מלכים',
    transliteration: 'Melachim',
    section: 'neviim',
    categoryEn: 'Early Prophets (I & II Kings)',
    categoryHe: 'נביאים ראשונים',
    chaptersCount: 47,
    emoji: '🏛️',
    color: '#ca8a04',
    bgLight: '#fefce8',
    authorOrTradition: 'Jeremiah the Prophet',
    summary: 'King Solomon builds the magnificent Holy Temple (Beit HaMikdash) in Jerusalem with his legendary wisdom. Elijah the Prophet brings rain at Mount Carmel, hears the “still small voice” of Hashem, and rides to heaven in a fiery chariot!',
    famousStories: [
      'King Solomon’s wisdom and building the Holy Temple in Jerusalem',
      'Elijah the Prophet bringing fire and rain at Mount Carmel',
      'Hashem speaking not in the earthquake or fire, but in the “still small voice”',
      'Elisha multiplying the jug of oil and healing with kindness'
    ],
    keyLesson: 'True greatness is listening to the still, gentle voice of kindness and conscience in your heart.',
    famousVerse: {
      he: 'ואחר האש קול דממה דקה',
      transliteration: 'Ve-achar ha-esh, kol demamah dakah!',
      en: 'And after the fire, a still, small voice of gentle whisper.',
      source: 'I Kings 19:12'
    },
    heroLinks: [
      { id: 'king-solomon', nameEn: 'King Solomon', emoji: '🏛️' },
      { id: 'elijah', nameEn: 'Elijah the Prophet', emoji: '🔥' },
      { id: 'elisha', nameEn: 'Elisha', emoji: '🏺' }
    ]
  },
  {
    id: 'isaiah',
    nameEn: 'Isaiah',
    nameHe: 'ישעיהו',
    transliteration: 'Yeshayahu',
    section: 'neviim',
    categoryEn: 'Later Prophets',
    categoryHe: 'נביאים אחרונים',
    chaptersCount: 66,
    emoji: '🕊️',
    color: '#059669',
    bgLight: '#ecfdf5',
    authorOrTradition: 'Isaiah the Prophet',
    summary: 'Isaiah shares uplifting visions of universal world peace, where wolves dwell peacefully with lambs, swords are beaten into garden tools, and comfort fills Jerusalem: “Nachamu, Nachamu Ami” (Be comforted, My people)!',
    famousStories: [
      'The vision of world peace: the wolf living peacefully with the lamb',
      'Turning swords into plowshares and spears into pruning hooks',
      'The Seven Haftarot of Comfort read every summer after Tisha B’Av',
      'The heavenly angels calling: “Kadosh, Kadosh, Kadosh!”'
    ],
    keyLesson: 'Never stop working for peace and kindness. Every gentle deed and warm word brings our world closer to harmony.',
    famousVerse: {
      he: 'וכתתו חרבותם לאתים וחניתותיהם למזמרות',
      transliteration: 'Ve-chit’tu charvotam le-ittim, va-chanitoteihem le-mazmerot!',
      en: 'They shall beat their swords into plowshares, and their spears into pruning hooks!',
      source: 'Isaiah 2:4'
    },
    heroLinks: [
      { id: 'isaiah', nameEn: 'Isaiah', emoji: '🕊️' }
    ]
  },
  {
    id: 'jeremiah',
    nameEn: 'Jeremiah',
    nameHe: 'ירמיהו',
    transliteration: 'Yirmiyahu',
    section: 'neviim',
    categoryEn: 'Later Prophets',
    categoryHe: 'נביאים אחרונים',
    chaptersCount: 52,
    emoji: '💧',
    color: '#0284c7',
    bgLight: '#f0f9ff',
    authorOrTradition: 'Jeremiah the Prophet',
    summary: 'Jeremiah speaks with deep compassion and love, reminding people to protect orphans, widows, and strangers. He purchases a field as an eternal promise of return, assuring that children will joyfully come home to their borders.',
    famousStories: [
      'Buying the field in Anathoth as an unbreakable promise of return',
      'The potter gently shaping the clay on the turning wheel',
      'Rachel weeping for her children, and Hashem comforting her: “They shall return!”',
      'The letter of encouragement sent to the exiles in Babylon'
    ],
    keyLesson: 'Hope is unbreakable. No matter how dark things seem, loving kindness and bright renewal always follow.',
    famousVerse: {
      he: 'ויש-תקוה לאחריתך נאם-ה׳ ושבו בנים לגבולם',
      transliteration: 'Ve-yesh tikvah le-acharithyech ne’um Hashem, ve-shavu vanim ligvulam!',
      en: 'There is hope for your future, says Hashem, and your children shall return to their borders!',
      source: 'Jeremiah 31:16'
    },
    heroLinks: [
      { id: 'jeremiah', nameEn: 'Jeremiah', emoji: '📜' }
    ]
  },
  {
    id: 'ezekiel',
    nameEn: 'Ezekiel',
    nameHe: 'יחזקאל',
    transliteration: 'Yechezkel',
    section: 'neviim',
    categoryEn: 'Later Prophets',
    categoryHe: 'נביאים אחרונים',
    chaptersCount: 48,
    emoji: '🌟',
    color: '#7c3aed',
    bgLight: '#f5f3ff',
    authorOrTradition: 'Ezekiel the Prophet',
    summary: 'By the Chebar River, Ezekiel sees breathtaking celestial visions of the heavenly Chariot (Merkavah) and the famous Valley of Dry Bones, where dry branches and bones come alive with fresh breath, symbolizing the rebirth of hope and spirit!',
    famousStories: [
      'The celestial Chariot vision and angels glowing like rainbows',
      'The Valley of Dry Bones coming alive with fresh breath and new life',
      'Joining two wooden sticks into one, representing unity of the people',
      'The vision of sweet healing waters flowing from the Holy Temple'
    ],
    keyLesson: 'Renewal is always possible! New spirit, joy, and hope can blossom even in the most quiet and difficult places.',
    famousVerse: {
      he: 'ונתתי לכם לב חדש ורוח חדשה אתן בקרבכם',
      transliteration: 'Ve-natati lachem lev chadash, ve-ru’ach chadashah etten bekirbechem!',
      en: 'A new heart I will give you, and a new spirit I will put within you!',
      source: 'Ezekiel 36:26'
    },
    heroLinks: [
      { id: 'ezekiel', nameEn: 'Ezekiel', emoji: '🌟' }
    ]
  },
  {
    id: 'hosea',
    nameEn: 'Hosea',
    nameHe: 'הושע',
    transliteration: 'Hoshea',
    section: 'neviim',
    categoryEn: 'Minor Prophets (Trei Asar)',
    categoryHe: 'תרי עשר',
    chaptersCount: 14,
    emoji: '🌱',
    color: '#059669',
    bgLight: '#ecfdf5',
    authorOrTradition: 'Hosea the Prophet',
    summary: 'Hosea speaks of Hashem’s deep, unbreakable love for the people of Israel, comparing it to a devoted family that never gives up. He promises that like fresh dew bringing green shoots to life, forgiveness and healing will blossom!',
    famousStories: [
      'The prophecy of healing dew and blooming lilies in Israel',
      'Calling the people to return to Hashem with sincere words of prayer',
      'The vision of peace where birds and animals live in safety'
    ],
    keyLesson: 'Hashem’s love is unconditional and patient. No matter how far we wander, sincere repentance and good deeds welcome us home.',
    famousVerse: {
      he: 'אהיה כטל לישראל יפרח כשושנה',
      transliteration: 'Ehehva ka-tal le-Yisrael, yifrach ka-shoshannah!',
      en: 'I will be like dew to Israel; they shall blossom like the rose!',
      source: 'Hosea 14:6'
    },
    heroLinks: [
      { id: 'hosea', nameEn: 'Hosea', emoji: '🌱' }
    ]
  },
  {
    id: 'joel',
    nameEn: 'Joel',
    nameHe: 'יואל',
    transliteration: 'Yoel',
    section: 'neviim',
    categoryEn: 'Minor Prophets (Trei Asar)',
    categoryHe: 'תרי עשר',
    chaptersCount: 4,
    emoji: '🌾',
    color: '#d97706',
    bgLight: '#fffbeb',
    authorOrTradition: 'Joel the Prophet',
    summary: 'Joel calls on everyone to come together in unity, blow the Shofar, and pray. He foretells a glorious era when Hashem’s spirit is poured upon all children and elders, filling the mountains with sweet milk, honey, and streams of water.',
    famousStories: [
      'Blowing the Shofar on Mount Zion to gather the community',
      'The promise that Hashem’s spirit will inspire young and old alike',
      'The mountains flowing with sweet juice and hills overflowing with milk'
    ],
    keyLesson: 'When a community gathers in unity and prayer, Hashem responds with abundance and peace.',
    famousVerse: {
      he: 'והיה אחרי-כן אשפוך את-רוחי על-כל-בשר',
      transliteration: 'Ve-hayah acharei-chen eshpoch et-ruchi al-kol-basar!',
      en: 'Afterward, I will pour out My spirit upon all people!',
      source: 'Joel 3:1'
    },
    heroLinks: [
      { id: 'joel', nameEn: 'Joel', emoji: '🌾' }
    ]
  },
  {
    id: 'amos',
    nameEn: 'Amos',
    nameHe: 'עמוס',
    transliteration: 'Amos',
    section: 'neviim',
    categoryEn: 'Minor Prophets (Trei Asar)',
    categoryHe: 'תרי עשר',
    chaptersCount: 9,
    emoji: '🌊',
    color: '#0284c7',
    bgLight: '#f0f9ff',
    authorOrTradition: 'Amos the Shepherd',
    summary: 'Amos, a humble shepherd and fig grower from Tekoa, speaks out boldly for fairness and charity! He famously calls for justice to roll down like mighty waters and kindness like an ever-flowing stream.',
    famousStories: [
      'The shepherd from Tekoa standing up for fairness and honesty',
      'Demanding equal kindness for the poor and vulnerable in society',
      'The vision of sweet vineyards and gardens rebuilt in joy'
    ],
    keyLesson: 'True faith means treating everyone with fairness, protecting the weak, and making justice stream like water.',
    famousVerse: {
      he: 'ויגל כמים משפט וצדקה כנחל איתן',
      transliteration: 'Ve-yiggal ka-mayim mishpat, u-ztzedakah ke-nachal eitan!',
      en: 'Let justice roll down like waters, and righteousness like a mighty stream!',
      source: 'Amos 5:24'
    },
    heroLinks: [
      { id: 'amos', nameEn: 'Amos', emoji: '🐏' }
    ]
  },
  {
    id: 'obadiah',
    nameEn: 'Obadiah',
    nameHe: 'עבדיה',
    transliteration: 'Ovadiah',
    section: 'neviim',
    categoryEn: 'Minor Prophets (Trei Asar)',
    categoryHe: 'תרי עשר',
    chaptersCount: 1,
    emoji: '🏔️',
    color: '#7c3aed',
    bgLight: '#f5f3ff',
    authorOrTradition: 'Obadiah the Prophet',
    summary: 'The shortest book in the Tanach (only 21 verses)! Obadiah teaches that pride and arrogance cannot protect anyone, promising that Mount Zion will remain a holy haven of peace and justice.',
    famousStories: [
      'Standing up against arrogance and ill-treatment of neighbors',
      'The promise of sanctuary and peace on Mount Zion in Jerusalem'
    ],
    keyLesson: 'Humility and loyalty to neighbors bring true shelter and enduring strength.',
    famousVerse: {
      he: 'ובהר ציון תהיה פליטה והיה קדש',
      transliteration: 'U-ve-Har Tzion tihyeh feleitah ve-hayah kodesh!',
      en: 'On Mount Zion there shall be deliverance, and it shall be holy!',
      source: 'Obadiah 1:17'
    },
    heroLinks: [
      { id: 'obadiah', nameEn: 'Obadiah', emoji: '📜' }
    ]
  },
  {
    id: 'jonah',
    nameEn: 'Jonah',
    nameHe: 'יונה',
    transliteration: 'Yonah',
    section: 'neviim',
    categoryEn: 'Minor Prophets (Trei Asar)',
    categoryHe: 'תרי עשר',
    chaptersCount: 4,
    emoji: '🐋',
    color: '#0d9488',
    bgLight: '#f0fdfa',
    authorOrTradition: 'Jonah the Prophet',
    summary: 'Jonah tries to sail across the sea, but a stormy wave leads him into the belly of a great fish! After praying from the deep, Jonah arrives in Nineveh, where the entire city repents, demonstrating Hashem’s love for all creation.',
    famousStories: [
      'Jonah’s stormy voyage and the giant friendly fish',
      'Jonah’s prayer from the depths of the sea',
      'The entire city of Nineveh turning around through good deeds',
      'The lesson of the fast-growing Kikayon plant giving shade'
    ],
    keyLesson: 'Hashem loves and cares for every person and creature in the world, and second chances are always possible.',
    famousVerse: {
      he: 'ואני בקול תודה אזבחה-לך אשר נדרתי אשלמה',
      transliteration: 'Va-ani be-kol todah ezbechah-lach, asher nadarti ashalemah!',
      en: 'With a voice of thanksgiving I will sing to You; salvation comes from Hashem!',
      source: 'Jonah 2:10'
    },
    heroLinks: [
      { id: 'jonah', nameEn: 'Jonah', emoji: '🐋' }
    ]
  },
  {
    id: 'micah',
    nameEn: 'Micah',
    nameHe: 'מיכה',
    transliteration: 'Michah',
    section: 'neviim',
    categoryEn: 'Minor Prophets (Trei Asar)',
    categoryHe: 'תרי עשר',
    chaptersCount: 7,
    emoji: '⚖️',
    color: '#16a34a',
    bgLight: '#f0fdf4',
    authorOrTradition: 'Micah of Moresheth',
    summary: 'Micah shares the 3 golden pillars of life: do justice, love kindness (chesed), and walk humbly! He envisions a tranquil world where everyone sits peacefully under their own fig tree and vine without fear.',
    famousStories: [
      'Teaching the three fundamental golden rules of Jewish life',
      'Visions of peace where every family rests safely under their vine and fig tree',
      'Tashlich prayer inspiration: casting mistakes into the depth of the sea'
    ],
    keyLesson: 'What does Hashem ask of us? Only to do justice, love kindness, and walk modestly!',
    famousVerse: {
      he: 'מה ה׳ דורש ממך: כי אם-עשות משפט ואהבת חסד והצנע לכת',
      transliteration: 'Mah Hashem doresh mimcha: ki im asot mishpat ve-ahavat chesed ve-hatzne’a lechet!',
      en: 'What does Hashem require of you? To do justice, love kindness, and walk humbly!',
      source: 'Micah 6:8'
    },
    heroLinks: [
      { id: 'micah', nameEn: 'Micah', emoji: '⚖️' }
    ]
  },
  {
    id: 'nahum',
    nameEn: 'Nahum',
    nameHe: 'נחום',
    transliteration: 'Nachum',
    section: 'neviim',
    categoryEn: 'Minor Prophets (Trei Asar)',
    categoryHe: 'תרי עשר',
    chaptersCount: 3,
    emoji: '🕊️',
    color: '#2563eb',
    bgLight: '#eff6ff',
    authorOrTradition: 'Nahum the Elkoshite',
    summary: 'Nahum brings comforting words of peace to Jerusalem (“Nachum” means comfort!), announcing that hardship is passing and that messengers of good news are running joyfully over the mountains.',
    famousStories: [
      'The feet of good messengers bringing joyful news across the mountains',
      'Reassuring the people that Hashem is a stronghold in times of trouble'
    ],
    keyLesson: 'Hashem is a cozy stronghold and protector for everyone who trusts in Him.',
    famousVerse: {
      he: 'טוב ה׳ למעוז ביום צרה וידע חסי בו',
      transliteration: 'Tov Hashem le-ma’oz be-yom tzarah, ve-yode’a chosei vo!',
      en: 'Hashem is good, a stronghold in the day of trouble; He knows those who trust in Him!',
      source: 'Nahum 1:7'
    },
    heroLinks: [
      { id: 'nahum', nameEn: 'Nahum', emoji: '🕊️' }
    ]
  },
  {
    id: 'habakkuk',
    nameEn: 'Habakkuk',
    nameHe: 'חבקוק',
    transliteration: 'Chavakuk',
    section: 'neviim',
    categoryEn: 'Minor Prophets (Trei Asar)',
    categoryHe: 'תרי עשר',
    chaptersCount: 3,
    emoji: '🛡️',
    color: '#dc2626',
    bgLight: '#fef2f2',
    authorOrTradition: 'Habakkuk the Prophet',
    summary: 'Habakkuk stands atop a watchtower to ask deep questions about why difficult things happen. Hashem answers that the righteous person lives with steady faith and trust (“Tzaddik be-emunato yichyeh”).',
    famousStories: [
      'Standing watch upon the tower looking for truth and light',
      'Writing a clear vision upon tablets so everyone can read and run with it',
      'A joyful song of gratitude even when fig trees do not blossom'
    ],
    keyLesson: 'Emunah (faith and trust) gives us wings of strength to climb like deer on high mountains.',
    famousVerse: {
      he: 'וצדיק באמונתו יחיה',
      transliteration: 'Ve-tzaddik be-emunato yichyeh!',
      en: 'The righteous person shall live by faith and trust!',
      source: 'Habakkuk 2:4'
    },
    heroLinks: [
      { id: 'habakkuk', nameEn: 'Habakkuk', emoji: '🛡️' }
    ]
  },
  {
    id: 'zephaniah',
    nameEn: 'Zephaniah',
    nameHe: 'צפניה',
    transliteration: 'Tzfanyah',
    section: 'neviim',
    categoryEn: 'Minor Prophets (Trei Asar)',
    categoryHe: 'תרי עשר',
    chaptersCount: 3,
    emoji: '🎶',
    color: '#e11d48',
    bgLight: '#fff1f2',
    authorOrTradition: 'Zephaniah, descendant of King Hezekiah',
    summary: 'Zephaniah encourages the humble and kind-hearted, promising a bright day when all nations speak with clear speech, singing songs of joy together in Jerusalem.',
    famousStories: [
      'Calling upon the humble to practice righteousness and kindness',
      'The promise that Hashem rejoices over His people with singing',
      'Bringing back all dispersed families with honor and praise'
    ],
    keyLesson: 'Humility and gentle speech create harmony among all people.',
    famousVerse: {
      he: 'ישיש עליך בשמחה יגיל עליך ברנה',
      transliteration: 'Yasiss alayich be-simchah, yagil alayich be-rinnah!',
      en: 'Hashem will rejoice over you with joy; He will delight in you with singing!',
      source: 'Zephaniah 3:17'
    },
    heroLinks: [
      { id: 'zephaniah', nameEn: 'Zephaniah', emoji: '🎶' }
    ]
  },
  {
    id: 'haggai',
    nameEn: 'Haggai',
    nameHe: 'חגי',
    transliteration: 'Chaggai',
    section: 'neviim',
    categoryEn: 'Minor Prophets (Trei Asar)',
    categoryHe: 'תרי עשר',
    chaptersCount: 2,
    emoji: '🧱',
    color: '#ca8a04',
    bgLight: '#fefce8',
    authorOrTradition: 'Haggai the Prophet',
    summary: 'Haggai inspires the pioneers returning from Babylon to rebuild the Second Temple in Jerusalem, assuring them that peace and blessing will rest upon their honest labor!',
    famousStories: [
      'Encouraging Zerubbabel and Joshua the High Priest to lay the Temple foundation',
      'The promise that the beauty and peace of the rebuilt Temple will exceed expectations'
    ],
    keyLesson: 'Building something meaningful starts with taking the very first brave step together.',
    famousVerse: {
      he: 'גדול יהיה כבוד הבית הזה... ובמקום הזה אתן שלום',
      transliteration: 'Gadol yihyeh kevod ha-bayit ha-zeh... u-va-makom ha-zeh etten shalom!',
      en: 'The glory of this House shall be great, and in this place I will give peace!',
      source: 'Haggai 2:9'
    },
    heroLinks: [
      { id: 'haggai', nameEn: 'Haggai', emoji: '🧱' }
    ]
  },
  {
    id: 'zechariah',
    nameEn: 'Zechariah',
    nameHe: 'זכריה',
    transliteration: 'Zecharyah',
    section: 'neviim',
    categoryEn: 'Minor Prophets (Trei Asar)',
    categoryHe: 'תרי עשר',
    chaptersCount: 14,
    emoji: '🕎',
    color: '#0284c7',
    bgLight: '#f0f9ff',
    authorOrTradition: 'Zechariah the Prophet',
    summary: 'Zechariah shares glowing visions of the golden Menorah and olive branches, uttering the world-famous message read on Hanukkah: “Not by might, nor by power, but by My Spirit, says Hashem!”',
    famousStories: [
      'The vision of the golden Menorah flanked by two living olive trees',
      'Jerusalem’s streets filled with boys and girls playing joyfully in safety',
      'Visions of colorful horses patrolling the world in peace'
    ],
    keyLesson: '“Love truth and peace!” (Zechariah 8:19). Spirit, light, and gentleness overcome all obstacles.',
    famousVerse: {
      he: 'לא בחיל ולא בכח כי אם-ברוחי אמר ה׳ צבאות',
      transliteration: 'Lo ve-chayil ve-lo ve-cho’ach, ki im be-ruchi, amar Hashem Tzva’ot!',
      en: 'Not by might nor by power, but by My Spirit, says Hashem!',
      source: 'Zechariah 4:6'
    },
    heroLinks: [
      { id: 'zechariah', nameEn: 'Zechariah', emoji: '🕎' }
    ]
  },
  {
    id: 'malachi',
    nameEn: 'Malachi',
    nameHe: 'מלאכי',
    transliteration: 'Malachi',
    section: 'neviim',
    categoryEn: 'Minor Prophets (Trei Asar)',
    categoryHe: 'תרי עשר',
    chaptersCount: 3,
    emoji: '☀️',
    color: '#eab308',
    bgLight: '#fefce8',
    authorOrTradition: 'Malachi the Prophet',
    summary: 'The final book of Nevi’im! Malachi reminds us that we all have one Father and creator, urging kindness in family life and foretelling that Eliyahu (Elijah) will turn the hearts of parents to children and children to parents.',
    famousStories: [
      '“Have we not all one Father?” — teaching universal brotherhood',
      'The sun of righteousness rising with healing in its wings',
      'Sending Elijah the Prophet to connect the hearts of generations in love'
    ],
    keyLesson: 'Strong, loving family bonds and respect for parents and elders illuminate the world.',
    famousVerse: {
      he: 'והשיב לב-אבות על-בנים ולב בנים על-אבותם',
      transliteration: 'Ve-heshiv lev-avot al-banim, ve-lev banim al-avotam!',
      en: 'He shall turn the hearts of parents to their children, and the hearts of children to their parents!',
      source: 'Malachi 3:24'
    },
    heroLinks: [
      { id: 'malachi', nameEn: 'Malachi', emoji: '☀️' }
    ]
  }
];

export const KETUVIM_BOOKS_DATA: TanachBookItem[] = [
  {
    id: 'psalms',
    nameEn: 'Psalms',
    nameHe: 'תהילים',
    transliteration: 'Tehillim',
    section: 'ketuvim',
    categoryEn: 'Poetic Books (Sifrei Emet)',
    categoryHe: 'ספרי אמ״ת',
    chaptersCount: 150,
    emoji: '🎵',
    color: '#2563eb',
    bgLight: '#eff6ff',
    authorOrTradition: 'King David and Elders',
    summary: '150 inspiring songs of prayer, praise, and comfort composed by King David with his sweet harp! Includes Psalm 23 (“The Lord is my Shepherd, I shall not want”) and Psalm 150 (“Let everything that breathes praise Hashem!”).',
    famousStories: [
      'King David playing his sweet harp under starry skies',
      'Psalm 23: “The Lord is my shepherd, I shall not want”',
      'Psalm 121: “I lift up my eyes to the mountains, where does my help come from?”',
      'Psalm 150: Praising Hashem with shofar, harp, drums, strings, flutes, and cymbals!'
    ],
    keyLesson: 'Music, gratitude, and singing praise bring light and calm to every moment of our lives.',
    famousVerse: {
      he: 'כל הנשמה תהלל יה הללויה',
      transliteration: 'Kol ha-neshamah tehalel Yah, Halleluyah!',
      en: 'Let every single breath praise Hashem! Halleluyah!',
      source: 'Psalms 150:6'
    },
    heroLinks: [
      { id: 'king-david', nameEn: 'King David', emoji: '👑' }
    ]
  },
  {
    id: 'proverbs',
    nameEn: 'Proverbs',
    nameHe: 'משלי',
    transliteration: 'Mishlei',
    section: 'ketuvim',
    categoryEn: 'Poetic Books (Sifrei Emet)',
    categoryHe: 'ספרי אמ״ת',
    chaptersCount: 31,
    emoji: '💎',
    color: '#d97706',
    bgLight: '#fffbeb',
    authorOrTradition: 'King Solomon',
    summary: 'Sparkling wisdom and practical life lessons from King Solomon! Learn to choose good friends, speak kind words, honor parents, and cherish wisdom more than gold or rubies. Concludes with the famous Friday-night song “Eshet Chayil”.',
    famousStories: [
      'King Solomon teaching wisdom to travelers from around the world',
      'Wisdom described as a glorious Tree of Life (Etz Chaim)',
      'The celebration of family, generosity, and kindness in Eshet Chayil',
      'Learning diligence and teamwork from the industrious ant'
    ],
    keyLesson: 'Gentle words turn away anger; a good name and a kind heart are worth more than all the gold in the world.',
    famousVerse: {
      he: 'עץ-חיים היא למחזיקים בה ותמכיה מאשר',
      transliteration: 'Etz chaim hee la-machazikim bah, ve-tomcheha me’ushar!',
      en: 'It is a tree of life to those who grasp it, and all who uphold it are happy!',
      source: 'Proverbs 3:18'
    },
    heroLinks: [
      { id: 'king-solomon', nameEn: 'King Solomon', emoji: '🏛️' }
    ]
  },
  {
    id: 'job',
    nameEn: 'Job',
    nameHe: 'איוב',
    transliteration: 'Iyov',
    section: 'ketuvim',
    categoryEn: 'Poetic Books (Sifrei Emet)',
    categoryHe: 'ספרי אמ״ת',
    chaptersCount: 42,
    emoji: '🌈',
    color: '#0891b2',
    bgLight: '#ecfeff',
    authorOrTradition: 'Ancient Tradition',
    summary: 'A poetic masterpiece of faith and wonder. When Job faces challenges, Hashem shows him the breathtaking wonders of nature—mountain goats, ocean tides, soaring eagles, and starry constellations—and restores all his blessings twofold!',
    famousStories: [
      'Job remaining faithful and true in his integrity',
      'Hashem answering out of the whirlwind with the wonder of the cosmos',
      'Descriptions of horses running freely and eagles nesting high',
      'Job blessed with doubled health, wealth, and joyful family'
    ],
    keyLesson: 'Have faith in the majesty of creation. Even when things feel mysterious, love and blessing prevail.',
    famousVerse: {
      he: 'וה׳ ברך את-אחרית איוב מראשתו',
      transliteration: 'Va-Hashem berach et acharit Iyov me-reshito!',
      en: 'And Hashem blessed the later days of Job even more than his beginning!',
      source: 'Job 42:12'
    }
  },
  {
    id: 'song-of-songs',
    nameEn: 'Song of Songs',
    nameHe: 'שיר השירים',
    transliteration: 'Shir HaShirim',
    section: 'ketuvim',
    categoryEn: 'The Five Megillot',
    categoryHe: 'חמש מגלות',
    chaptersCount: 8,
    emoji: '🌷',
    color: '#e11d48',
    bgLight: '#fff1f2',
    authorOrTradition: 'King Solomon',
    holidayConnection: 'Read on Passover (Pesach)',
    summary: 'The holiest love song, comparing Hashem’s love for the Jewish people to springtime in the blossoming hills of Israel with singing birds, blooming flowers, sweet figs, and joyful young gazelles!',
    famousStories: [
      'Spring arriving in Israel: flowers appearing and birds singing songs',
      'The beloved leaping over mountains and hills like a graceful deer',
      'The garden filled with pomegranate blossoms, spices, and sweet water'
    ],
    keyLesson: 'Love, devotion, and kindness are the sweetest and most enduring forces in the universe.',
    famousVerse: {
      he: 'כי-הנה הסתו עבר הגשם חלף הלך לו הנצנים נראו בארץ',
      transliteration: 'Ki hineh ha-stav avar, ha-geshem chalaf halach lo, ha-nitzanim nir’u va’aretz!',
      en: 'For lo, the winter is past, the rain is over and gone; blossoms appear across the land!',
      source: 'Song of Songs 2:11-12'
    },
    heroLinks: [
      { id: 'king-solomon', nameEn: 'King Solomon', emoji: '🏛️' }
    ]
  },
  {
    id: 'ruth',
    nameEn: 'Ruth',
    nameHe: 'רות',
    transliteration: 'Rut',
    section: 'ketuvim',
    categoryEn: 'The Five Megillot',
    categoryHe: 'חמש מגלות',
    chaptersCount: 4,
    emoji: '🌾',
    color: '#ca8a04',
    bgLight: '#fefce8',
    authorOrTradition: 'Samuel the Prophet',
    holidayConnection: 'Read on Shavuot',
    summary: 'Ruth shows loyal, loving kindness (Chesed) to her mother-in-law Naomi: “Where you go I will go; your people will be my people!” She gleans barley in Boaz’s fields in Bethlehem and becomes the great-grandmother of King David!',
    famousStories: [
      'Ruth choosing to stay with Naomi: “Your people shall be my people!”',
      'Gleaning golden barley in Boaz’s welcoming harvest fields',
      'The community rejoicing at the marriage of Ruth and Boaz',
      'The birth of Oved, the grandfather of King David'
    ],
    keyLesson: 'Loving kindness (Chesed) transforms lives. Welcoming everyone warmly brings royalty and blessings into the world.',
    famousVerse: {
      he: 'כי אל-אשר תלכי אלך... עמך עמי ואלקיך אלקי',
      transliteration: 'Ki el asher telchi elech... amech ammi ve-Elokayich Elokay!',
      en: 'Wherever you go, I will go... your people shall be my people and your God my God!',
      source: 'Ruth 1:16'
    },
    heroLinks: [
      { id: 'ruth', nameEn: 'Ruth', emoji: '🌾' }
    ]
  },
  {
    id: 'lamentations',
    nameEn: 'Lamentations',
    nameHe: 'איכה',
    transliteration: 'Eichah',
    section: 'ketuvim',
    categoryEn: 'The Five Megillot',
    categoryHe: 'חמש מגלות',
    chaptersCount: 5,
    emoji: '🕯️',
    color: '#475569',
    bgLight: '#f8fafc',
    authorOrTradition: 'Jeremiah the Prophet',
    holidayConnection: 'Read on Tisha B’Av',
    summary: 'A poetic book remembering the ancient Holy Temple, filled with feelings of compassion and finishing with the beloved prayer sung in every synagogue: “Hashiveinu Hashem Elecha Venashuva” (Turn us back to You, Hashem, and we shall return)!',
    famousStories: [
      'Remembering Jerusalem with love and yearning',
      'The promise that Hashem’s mercies are renewed every single morning',
      'Singing Hashiveinu as we return the Torah scroll to the Ark'
    ],
    keyLesson: 'It is okay to feel sadness, but hope always returns. Yesterday’s tears become tomorrow’s rebuilding and joy.',
    famousVerse: {
      he: 'השיבנו ה׳ אליך ונשובה חדש ימינו כקדם',
      transliteration: 'Hashiveinu Hashem elecha venashuva, chadesh yameinu kekedem!',
      en: 'Turn us back to You, Hashem, and we shall return; renew our days as of old!',
      source: 'Lamentations 5:21'
    },
    heroLinks: [
      { id: 'jeremiah', nameEn: 'Jeremiah', emoji: '📜' }
    ]
  },
  {
    id: 'ecclesiastes',
    nameEn: 'Ecclesiastes',
    nameHe: 'קהלת',
    transliteration: 'Kohelet',
    section: 'ketuvim',
    categoryEn: 'The Five Megillot',
    categoryHe: 'חמש מגלות',
    chaptersCount: 12,
    emoji: '⏰',
    color: '#16a34a',
    bgLight: '#f0fdf4',
    authorOrTradition: 'King Solomon',
    holidayConnection: 'Read on Sukkot',
    summary: 'King Solomon’s reflections on life and time: “To everything there is a season, and a time to every purpose under heaven.” A time to plant, a time to dance, and finding joy in simple meals, good friends, and kind deeds!',
    famousStories: [
      'The timeless poem of seasons: a time to plant and a time to dance',
      'Two are better than one, because they have a good reward for their labor',
      'Finding pure happiness in a simple sukkah meal under the stars'
    ],
    keyLesson: 'Appreciate every season of life. Good friends and a warm, kind heart bring true happiness.',
    famousVerse: {
      he: 'לכל זמן ועת לכל-חפץ תחת השמים: עת לבכות ועת לשחוק',
      transliteration: 'Lakol zman, ve-et le-chol chefetz tachat ha-shamayim: et livkot ve-et lischok!',
      en: 'To everything there is a season: a time to weep, and a time to laugh; a time to dance!',
      source: 'Ecclesiastes 3:1-4'
    },
    heroLinks: [
      { id: 'king-solomon', nameEn: 'King Solomon', emoji: '🏛️' }
    ]
  },
  {
    id: 'esther',
    nameEn: 'Esther',
    nameHe: 'אסתר',
    transliteration: 'Ester',
    section: 'ketuvim',
    categoryEn: 'The Five Megillot',
    categoryHe: 'חמש מגלות',
    chaptersCount: 10,
    emoji: '🎭',
    color: '#9333ea',
    bgLight: '#faf5ff',
    authorOrTradition: 'Mordechai & Queen Esther',
    holidayConnection: 'Read on Purim',
    summary: 'Brave Queen Esther and wise uncle Mordechai save the Jewish people from wicked Haman in ancient Persia! We dress up in costumes, spin loud groggers, eat yummy hamantaschen, and deliver gifts to friends and the poor on Purim!',
    famousStories: [
      'Queen Esther courageously entering the king’s court to speak up for her people',
      'Mordechai riding through the city square on the royal horse',
      'The joyous celebration of Purim with feasts and gifts of food (Mishloach Manot)'
    ],
    keyLesson: 'Standing up courageously for what is right, protecting others, and spreading joy to all.',
    famousVerse: {
      he: 'ליהודים היתה אורה ושמחה וששון ויקר',
      transliteration: 'La-Yehudim hayetah orah ve-simchah ve-sason vi-ykar!',
      en: 'For the Jewish people there was light and gladness, joy and honor!',
      source: 'Esther 8:16'
    },
    heroLinks: [
      { id: 'queen-esther', nameEn: 'Queen Esther', emoji: '👑' },
      { id: 'mordechai', nameEn: 'Mordechai', emoji: '🐴' }
    ]
  },
  {
    id: 'daniel',
    nameEn: 'Daniel',
    nameHe: 'דניאל',
    transliteration: 'Daniel',
    section: 'ketuvim',
    categoryEn: 'Historical & Visionary Books',
    categoryHe: 'ספרי מעשה',
    chaptersCount: 12,
    emoji: '🦁',
    color: '#ea580c',
    bgLight: '#fff7ed',
    authorOrTradition: 'Daniel & The Great Assembly',
    summary: 'Young Daniel stands firm in his values in Babylon, keeping kosher and praying faithfully three times a day toward Jerusalem. When placed in the lions’ den, Hashem sends an angel to protect him and the lions act as gentle as kittens!',
    famousStories: [
      'Daniel and his friends eating healthy seeds and water, shining brighter than all',
      'Daniel safely sleeping among the lions in the lions’ den',
      'Interpreting the mysterious writing on the wall: Mene Mene Tekel Upharsin'
    ],
    keyLesson: 'Hold fast to your values and prayer, and never be afraid to do what is right.',
    famousVerse: {
      he: 'אלהי שלח מלאכה וסגר פם אריותא',
      transliteration: 'Elahi shelach mal’acheh usgar pum aryavata!',
      en: 'My God sent His angel and shut the lions’ mouths so they could not harm me!',
      source: 'Daniel 6:23'
    }
  },
  {
    id: 'ezra-nehemiah',
    nameEn: 'Ezra & Nehemiah',
    nameHe: 'עזרא ונחמיה',
    transliteration: 'Ezra ve-Nechemya',
    section: 'ketuvim',
    categoryEn: 'Historical Books (Return to Zion)',
    categoryHe: 'ספרי שיבת ציון',
    chaptersCount: 23,
    emoji: '🧱',
    color: '#4f46e5',
    bgLight: '#eef2ff',
    authorOrTradition: 'Ezra the Scribe & Nehemiah',
    summary: 'The joyful return to Zion! Ezra reads the Torah scroll aloud to cheering crowds by the Water Gate in Jerusalem, while Nehemiah leads the people in rebuilding Jerusalem’s stone walls and gates with tremendous teamwork!',
    famousStories: [
      'Ezra standing on a wooden tower reading Torah to men, women, and children',
      'The whole community celebrating Sukkot with great happiness',
      'Nehemiah leading the builders to finish Jerusalem’s walls in just 52 days!'
    ],
    keyLesson: 'Teamwork, unity, and love for Torah learning build strong, joyful communities.',
    famousVerse: {
      he: 'כי-חדות ה׳ היא מעזכם',
      transliteration: 'Ki chedvat Hashem hee ma’uzzchem!',
      en: 'For the joy of Hashem is your strength!',
      source: 'Nehemiah 8:10'
    }
  },
  {
    id: 'chronicles',
    nameEn: 'Chronicles',
    nameHe: 'דברי הימים',
    transliteration: 'Divrei HaYamim',
    section: 'ketuvim',
    categoryEn: 'Historical Grand Finale',
    categoryHe: 'ספרי דברי הימים',
    chaptersCount: 65,
    emoji: '📜',
    color: '#b91c1c',
    bgLight: '#fef2f2',
    authorOrTradition: 'Ezra the Scribe',
    summary: 'The majestic grand finale of the Tanach! It traces the family generations from Adam to King David, celebrates the glorious choral music of the Levites in the Holy Temple, and concludes with King Cyrus’s royal call: “Whoever among you of all His people... let him go up to Jerusalem!”',
    famousStories: [
      'The family genealogy connecting every generation from Adam to David',
      'The Levite choir singing with harps, trumpets, and cymbals in Jerusalem',
      'King Cyrus of Persia’s proclamation inviting everyone to return and rebuild'
    ],
    keyLesson: 'Every generation is an important link in our Jewish family chain. We carry forward the torch of light and joy.',
    famousVerse: {
      he: 'מי-בכם מכל-עמו ה׳ אלקיו עמו ויעל!',
      transliteration: 'Mi vachem mikol ammo, Hashem Elokav immo ve-ya’al!',
      en: 'Whoever among you of all His people, may Hashem be with him, and let him go up!',
      source: 'II Chronicles 36:23'
    },
    heroLinks: [
      { id: 'king-david', nameEn: 'King David', emoji: '👑' },
      { id: 'king-solomon', nameEn: 'King Solomon', emoji: '🏛️' }
    ]
  }
];

export interface TanachSectionInfo {
  id: 'torah' | 'neviim' | 'ketuvim';
  letter: string;
  nameEn: string;
  nameHe: string;
  transliteration: string;
  booksCount: number;
  emoji: string;
  color: string;
  description: string;
}

export const TANACH_SECTIONS: TanachSectionInfo[] = [
  {
    id: 'torah',
    letter: 'ת',
    nameEn: 'Torah',
    nameHe: 'תורה',
    transliteration: 'Torah (Teaching)',
    booksCount: 5,
    emoji: '📜',
    color: '#d97706',
    description: 'The 5 Books of Moses — Genesis, Exodus, Leviticus, Numbers, and Deuteronomy — containing all 54 weekly Parashot!'
  },
  {
    id: 'neviim',
    letter: 'נ',
    nameEn: 'Nevi’im',
    nameHe: 'נביאים',
    transliteration: 'Nevi’im (Prophets)',
    booksCount: 8,
    emoji: '🎺',
    color: '#0284c7',
    description: 'The 8 Books of the Prophets — from Joshua and Deborah to Samuel, Kings, Isaiah, Jeremiah, and Jonah!'
  },
  {
    id: 'ketuvim',
    letter: 'ך',
    nameEn: 'Ketuvim',
    nameHe: 'כתובים',
    transliteration: 'Ketuvim (Writings)',
    booksCount: 11,
    emoji: '💎',
    color: '#8b5cf6',
    description: 'The 11 Books of Writings — including Psalms, Proverbs, the 5 Megillot (Ruth, Esther, Song of Songs), Daniel, and Chronicles!'
  }
];
