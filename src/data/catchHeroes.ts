import { TORAH_IMAGE_URL, DREIDEL_IMAGE_URL, JELLY_DONUT_IMAGE_URL, FRUIT_IMAGE_URL } from '../constants/assets';

export interface CatchHero {
  id: string;
  nameEn: string;
  nameHe: string;
  spokenHe?: string;
  ttsText?: string;
  speechText?: string;
  hebrew?: string;
  emoji: string;
  image?: string;
  title: string;
  color: string;
  bgLight: string;
  borderColor: string;
  description: string;
  alignment?: 'hero' | 'villain' | 'holiday' | 'kosher_food';
}

export interface CatchHeroMove {
  nameEn: string;
  spokenEn: string;
  emoji?: string;
  image?: string;
  power: number;
}

export const CATCH_HOLIDAYS: CatchHero[] = [
  {
    id: 'sigd',
    nameEn: 'Sigd',
    nameHe: 'סיגד',
    emoji: '☂️',
    title: 'Festival of Unity & Gathering',
    color: '#9333EA',
    bgLight: '#FAF5FF',
    borderColor: '#E9D5FF',
    description: 'A beautiful Beta Israel holiday of community gathering, prayers, and colorful umbrellas!',
    alignment: 'holiday',
  },
  {
    id: 'shabbat',
    nameEn: 'Shabbat',
    nameHe: 'שַׁבָּת',
    spokenHe: 'שַׁבָּת',
    ttsText: 'שַׁבָּת',
    speechText: 'שַׁבָּת',
    hebrew: 'שַׁבָּת',
    emoji: '🕯️',
    title: 'Day of Rest',
    color: '#0284C7',
    bgLight: '#F0F9FF',
    borderColor: '#BAE6FD',
    description: 'The weekly day of rest and peace with candles and challah!',
    alignment: 'holiday',
  },
  {
    id: 'rosh-hashanah',
    nameEn: 'Rosh Hashanah',
    nameHe: 'ראש השנה',
    emoji: '🍎',
    title: 'Jewish New Year',
    color: '#D97706',
    bgLight: '#FFFBEB',
    borderColor: '#FDE68A',
    description: 'The sweet new year with apples, honey, and the shofar horn!',
    alignment: 'holiday',
  },
  {
    id: 'yom-kippur',
    nameEn: 'Yom Kippur',
    nameHe: 'יוֹם כִּפּוּר',
    spokenHe: 'יוֹם כִּפּוּר',
    ttsText: 'יוֹם כִּפּוּר',
    speechText: 'יוֹם כִּפּוּר',
    hebrew: 'יוֹם כִּפּוּר',
    emoji: '🕊️',
    title: 'Day of Atonement',
    color: '#0D9488',
    bgLight: '#F0FDFA',
    borderColor: '#99F6E4',
    description: 'A day of forgiveness, peace, and wearing white clothes!',
    alignment: 'holiday',
  },
  {
    id: 'sukkot',
    nameEn: 'Sukkot',
    nameHe: 'סֻכּוֹת',
    spokenHe: 'סֻכּוֹת',
    ttsText: 'סֻכּוֹת',
    speechText: 'סֻכּוֹת',
    hebrew: 'סֻכּוֹת',
    emoji: '🛖',
    title: 'Feast of Booths',
    color: '#16A34A',
    bgLight: '#F0FDF4',
    borderColor: '#BBF7D0',
    description: 'Building leafy Sukkah huts and waving the four species!',
    alignment: 'holiday',
  },
  {
    id: 'simchat-torah',
    nameEn: 'Simchat Torah',
    nameHe: 'שמחת תורה',
    emoji: '📜',
    title: 'Torah Joy',
    color: '#8B5CF6',
    bgLight: '#F5F3FF',
    borderColor: '#DDD6FE',
    description: 'Dancing with Torah scrolls and starting again from Beresheet!',
    alignment: 'holiday',
  },
  {
    id: 'hanukkah',
    nameEn: 'Hanukkah',
    nameHe: 'חֲנֻכָּה',
    spokenHe: 'חֲנֻכָּה',
    ttsText: 'חֲנֻכָּה',
    speechText: 'חֲנֻכָּה',
    hebrew: 'חֲנֻכָּה',
    emoji: '🕎',
    title: 'Festival of Lights',
    color: '#0284C7',
    bgLight: '#F0F9FF',
    borderColor: '#BAE6FD',
    description: 'Lighting the Menorah for eight nights and spinning dreidels!',
    alignment: 'holiday',
  },
  {
    id: 'tu-bishvat',
    nameEn: 'Tu BiShvat',
    nameHe: 'ט"ו בִּשְׁבָט',
    emoji: '🌳',
    title: 'New Year for Trees',
    color: '#15803D',
    bgLight: '#F0FDF4',
    borderColor: '#BBF7D0',
    description: 'Planting saplings and celebrating the birthday of the trees!',
    alignment: 'holiday',
  },
  {
    id: 'purim',
    nameEn: 'Purim',
    nameHe: 'פורים',
    emoji: '🎭',
    title: 'Joyous Costumes',
    color: '#E11D48',
    bgLight: '#FFF1F2',
    borderColor: '#FECDD3',
    description: 'Dressing up, shaking groggers, and eating sweet hamantaschen!',
    alignment: 'holiday',
  },
  {
    id: 'passover',
    nameEn: 'Passover',
    nameHe: 'פֶּסַח',
    spokenHe: 'פֶּסַח',
    ttsText: 'פֶּסַח',
    speechText: 'פֶּסַח',
    hebrew: 'פֶּסַח',
    emoji: '🫓',
    title: 'Festival of Freedom',
    color: '#B45309',
    bgLight: '#FFFBEB',
    borderColor: '#FDE68A',
    description: 'Crunchy matzah, the Seder table, and retelling the Exodus!',
    alignment: 'holiday',
  },
  {
    id: 'yom-haatzmaut',
    nameEn: 'Yom Ha’atzmaut',
    nameHe: 'יום העצמאות',
    emoji: '🇮🇱',
    title: 'Israel Independence',
    color: '#0284C7',
    bgLight: '#F0F9FF',
    borderColor: '#BAE6FD',
    description: 'Celebrating Israel’s birthday with blue and white flags!',
    alignment: 'holiday',
  },
  {
    id: 'lag-baomer',
    nameEn: 'Lag BaOmer',
    nameHe: 'לַג בָּעוֹמֶר',
    spokenHe: 'לַג בָּעוֹמֶר',
    ttsText: 'לַג בָּעוֹמֶר',
    speechText: 'לַג בָּעוֹמֶר',
    hebrew: 'לַג בָּעוֹמֶר',
    emoji: '🔥',
    title: 'Campfire Day',
    color: '#EA580C',
    bgLight: '#FFF7ED',
    borderColor: '#FFEDD5',
    description: 'Lighting evening bonfires and roasting campfire marshmallows!',
    alignment: 'holiday',
  },
  {
    id: 'yom-yerushalayim',
    nameEn: 'Yom Yerushalayim',
    nameHe: 'יום ירושלים',
    emoji: '🦁',
    title: 'Jerusalem Day',
    color: '#0284C7',
    bgLight: '#F0F9FF',
    borderColor: '#BAE6FD',
    description: 'Celebrating Jerusalem the golden eternal city with flag dances!',
    alignment: 'holiday',
  },
  {
    id: 'shavuot',
    nameEn: 'Shavuot',
    nameHe: 'שבועות',
    emoji: '🧀',
    title: 'Feast of Weeks',
    color: '#EAB308',
    bgLight: '#FEFCE8',
    borderColor: '#FEF08A',
    description: 'Receiving the Torah at Mount Sinai with flowers and dairy treats!',
    alignment: 'holiday',
  },
];

export const CATCH_HEROES: CatchHero[] = [
  {
    id: 'noah_and_naamah',
    nameEn: 'Noah & Naamah',
    nameHe: 'נוח ונעמה',
    emoji: '⛵',
    title: 'Multi Animal Attack',
    color: '#2563EB',
    bgLight: '#EFF6FF',
    borderColor: '#93C5FD',
    description: 'They attack with two animals at a time from the Ark!',
    alignment: 'hero',
  },
  {
    id: 'moses',
    nameEn: 'Moses',
    nameHe: 'משה',
    emoji: '🌊',
    title: 'Plague Attack',
    color: '#7C3AED',
    bgLight: '#F5F3FF',
    borderColor: '#C4B5FD',
    description: 'Unleashes the famous plagues of Egypt in battle!',
    alignment: 'hero',
  },
  {
    id: 'abraham_and_sarah',
    nameEn: 'Abraham & Sarah',
    nameHe: 'אברהם ושרה',
    emoji: '⛺',
    title: 'Tent of Kindness',
    color: '#D97706',
    bgLight: '#FEF3C7',
    borderColor: '#FDE68A',
    description: 'Attacks with welcoming hospitality and starry night skies!',
    alignment: 'hero',
  },
  {
    id: 'david',
    nameEn: 'King David',
    nameHe: 'דוד המלך',
    emoji: '👑',
    title: 'Harp & Sling',
    color: '#059669',
    bgLight: '#ECFDF5',
    borderColor: '#A7F3D0',
    description: 'Battles with courage, harp melodies, and smooth stones!',
    alignment: 'hero',
  },
  {
    id: 'miriam',
    nameEn: 'Miriam',
    nameHe: 'מרים',
    emoji: '🪘',
    title: 'Song & Water',
    color: '#DB2777',
    bgLight: '#FDF2F8',
    borderColor: '#FBCFE8',
    description: 'Leads with joyful tambourines and miraculous water springs!',
    alignment: 'hero',
  },
  {
    id: 'judah_maccabee',
    nameEn: 'Judah Maccabee',
    nameHe: 'יהודה המכבי',
    emoji: '🛡️',
    title: 'Hammer of Faith',
    color: '#2563EB',
    bgLight: '#EFF6FF',
    borderColor: '#93C5FD',
    description: 'Battles with pure oil, spinning dreidel, and Torah power!',
    alignment: 'hero',
  },
  {
    id: 'shifra_and_puah',
    nameEn: 'Shifra & Puah',
    nameHe: 'שפרה ופועה',
    spokenHe: 'שִׁפְרָה וּפוּעָה',
    emoji: '👶',
    title: 'Brave Midwives',
    color: '#EC4899',
    bgLight: '#FDF2F8',
    borderColor: '#FBCFE8',
    description: 'Protect newborn children with bravery, gentle coos, and honey!',
    alignment: 'hero',
  },
  {
    id: 'yael',
    nameEn: 'Yael',
    nameHe: 'יעל',
    spokenHe: 'יָעֵל',
    emoji: '⛺',
    title: 'Heroine of the Tent',
    color: '#10B981',
    bgLight: '#ECFDF5',
    borderColor: '#A7F3D0',
    description: 'Heroine who saved Israel with warm milk and tent pegs!',
    alignment: 'hero',
  },
];

export const CATCH_VILLAINS: CatchHero[] = [
  {
    id: 'snake',
    nameEn: 'The Snake',
    nameHe: 'הנחש',
    emoji: '🐍',
    title: 'Tricky Serpent',
    color: '#EF4444',
    bgLight: '#FEF2F2',
    borderColor: '#FCA5A5',
    description: 'Tempts with fruit and crafty words!',
    alignment: 'villain',
  },
  {
    id: 'pharaoh',
    nameEn: 'Pharaoh',
    nameHe: 'פַּרְעֹה',
    spokenHe: 'פַּרְעֹה',
    ttsText: 'פַּרְעֹה',
    speechText: 'פַּרְעֹה',
    hebrew: 'פַּרְעֹה',
    emoji: '👑',
    title: 'Stubborn King',
    color: '#DC2626',
    bgLight: '#FEF2F2',
    borderColor: '#F87171',
    description: 'Builds heavy pyramids and drives royal chariots!',
    alignment: 'villain',
  },
  {
    id: 'antiochus',
    nameEn: 'King Antiochus',
    nameHe: 'אנטיוכוס המלך',
    spokenHe: 'אַנְטִיּוֹכוּס הַמֶּלֶךְ',
    ttsText: 'אַנְטִיּוֹכוּס הַמֶּלֶךְ',
    speechText: 'אַנְטִיּוֹכוּס הַמֶּלֶךְ',
    hebrew: 'אַנְטִיּוֹכוּס הַמֶּלֶךְ',
    emoji: '🐘',
    title: 'Tyrant King',
    color: '#B91C1C',
    bgLight: '#FEF2F2',
    borderColor: '#EF4444',
    description: 'Marches into battle with soldiers and war elephants!',
    alignment: 'villain',
  },
  {
    id: 'goliath',
    nameEn: 'Goliath',
    nameHe: 'גלית',
    spokenHe: 'גֹּלְיָת',
    emoji: '👹',
    title: 'Giant Warrior',
    color: '#991B1B',
    bgLight: '#FEF2F2',
    borderColor: '#DC2626',
    description: 'Stomps with bronze armor and giant spears!',
    alignment: 'villain',
  },
  {
    id: 'haman',
    nameEn: 'Haman',
    nameHe: 'המן',
    emoji: '🦹',
    title: 'Wicked Chancellor',
    color: '#7F1D1D',
    bgLight: '#FEF2F2',
    borderColor: '#B91C1C',
    description: 'Plots sneaky decrees in Shushan!',
    alignment: 'villain',
  },
  {
    id: 'holofernes',
    nameEn: 'Holofernes',
    nameHe: 'הוֹלוֹפֶרְנֶס',
    spokenHe: 'הוֹלוֹפֶרְנֶס',
    ttsText: 'הוֹלוֹפֶרְנֶס',
    speechText: 'הוֹלוֹפֶרְנֶס',
    hebrew: 'הוֹלוֹפֶרְנֶס',
    emoji: '⚔️',
    title: 'Oppressive General',
    color: '#881337',
    bgLight: '#FFF1F2',
    borderColor: '#FDA4AF',
    description: 'Leads a besieging army against Bethulia!',
    alignment: 'villain',
  },
  {
    id: 'sisera',
    nameEn: 'General Sisera',
    nameHe: 'סיסרא',
    spokenHe: 'סִיסְרָא',
    emoji: '🛞',
    title: 'Canaanite General',
    color: '#B91C1C',
    bgLight: '#FEF2F2',
    borderColor: '#EF4444',
    description: 'Commands 900 iron war chariots in battle!',
    alignment: 'villain',
  },
  {
    id: 'king-og',
    nameEn: 'King Og',
    nameHe: 'עוג המלך',
    spokenHe: 'עוֹג הַמֶּלֶךְ',
    emoji: '🏔️',
    title: 'Giant King of Bashan',
    color: '#7F1D1D',
    bgLight: '#FEF2F2',
    borderColor: '#991B1B',
    description: 'Giant ruler with an iron bedstead who throws entire mountains!',
    alignment: 'villain',
  },
];

export const CATCH_KOSHER_FOODS: CatchHero[] = [
  {
    id: 'kosher-chicken',
    nameEn: 'Kosher Chicken',
    nameHe: 'Kosher Chicken',
    spokenHe: 'Kosher Chicken',
    emoji: '🍗',
    title: 'Crispy Fowl',
    color: '#D97706',
    bgLight: '#FFFBEB',
    borderColor: '#FDE68A',
    description: 'Delicious kosher chicken attacking with eggs, drumstick, chicken nuggets, and schnitzel!',
    alignment: 'kosher_food',
  },
  {
    id: 'all-beef-hot-dog',
    nameEn: 'All-Beef Hot Dog',
    nameHe: 'All-Beef Hot Dog',
    spokenHe: 'All-Beef Hot Dog',
    emoji: '🌭',
    title: 'Ballpark Favorite',
    color: '#EF4444',
    bgLight: '#FEF2F2',
    borderColor: '#FCA5A5',
    description: 'Juicy all-beef kosher hot dog loaded with ballpark sports energy!',
    alignment: 'kosher_food',
  },
  {
    id: 'falafel',
    nameEn: 'Falafel',
    nameHe: 'Falafel',
    spokenHe: 'Falafel',
    ttsText: 'Falafel',
    speechText: 'Falafel',
    hebrew: 'Falafel',
    emoji: '🧆',
    title: 'Crispy Chickpea Balls',
    color: '#16A34A',
    bgLight: '#F0FDF4',
    borderColor: '#BBF7D0',
    description: 'Golden fried chickpea balls spiced with cumin and cilantro!',
    alignment: 'kosher_food',
  },
  {
    id: 'shakshuka',
    nameEn: 'Shakshuka',
    nameHe: 'שַׁקְשׁוּקָה',
    spokenHe: 'שַׁקְשׁוּקָה',
    ttsText: 'שַׁקְשׁוּקָה',
    speechText: 'שַׁקְשׁוּקָה',
    hebrew: 'שַׁקְשׁוּקָה',
    emoji: '🍳',
    title: 'Sizzling Skillet',
    color: '#EA580C',
    bgLight: '#FFF7ED',
    borderColor: '#FFEDD5',
    description: 'Poached eggs in a spicy tomato and red pepper sauce!',
    alignment: 'kosher_food',
  },
  {
    id: 'hummus',
    nameEn: 'חוּמוּס',
    nameHe: 'חוּמוּס',
    spokenHe: 'חוּמוּס',
    ttsText: 'חוּמוּס',
    speechText: 'חוּמוּס',
    hebrew: 'חוּמוּס',
    emoji: '🥣',
    title: 'Creamy Chickpea Dip',
    color: '#D97706',
    bgLight: '#FFFBEB',
    borderColor: '#FDE68A',
    description: 'Smooth creamy chickpea puree with olive oil and paprika!',
    alignment: 'kosher_food',
  },
  {
    id: 'pita',
    nameEn: 'Pita',
    nameHe: 'Pita',
    spokenHe: 'Pita',
    emoji: '🥙',
    title: 'Fluffy Pocket Bread',
    color: '#B45309',
    bgLight: '#FFFBEB',
    borderColor: '#FDE68A',
    description: 'Soft and fluffy baked pocket bread ready for falafel!',
    alignment: 'kosher_food',
  },
  {
    id: 'shawarma',
    nameEn: 'Shawarma',
    nameHe: 'Shawarma',
    spokenHe: 'Shawarma',
    emoji: '🥙',
    title: 'Rotisserie Spiced Meat',
    color: '#881337',
    bgLight: '#FFF1F2',
    borderColor: '#FECDD3',
    description: 'Flavorful sliced meat turned on a vertical spit!',
    alignment: 'kosher_food',
  },
  {
    id: 'jelly-donut',
    nameEn: 'Jelly Donut',
    nameHe: 'Jelly Donut',
    spokenHe: 'Jelly Donut',
    emoji: '🍩',
    image: JELLY_DONUT_IMAGE_URL,
    title: 'Sweet Sufganiyah',
    color: '#E11D48',
    bgLight: '#FFF1F2',
    borderColor: '#FECDD3',
    description: 'Golden fried donut filled with sweet strawberry jelly!',
    alignment: 'kosher_food',
  },
  {
    id: 'hamantasch',
    nameEn: 'Hamantasch',
    nameHe: 'אֹזֶן הָמָן',
    spokenHe: 'אֹזֶן הָמָן',
    ttsText: 'אֹזֶן הָמָן',
    speechText: 'אֹזֶן הָמָן',
    hebrew: 'אֹזֶן הָמָן',
    emoji: '🥟',
    title: 'Three-Cornered Pastry',
    color: '#7C3AED',
    bgLight: '#F5F3FF',
    borderColor: '#DDD6FE',
    description: 'Sweet Purim triangle pastry filled with chocolate or jam!',
    alignment: 'kosher_food',
  },
  {
    id: 'israeli-salad',
    nameEn: 'Israeli Salad',
    nameHe: 'Israeli Salad',
    spokenHe: 'Israeli Salad',
    emoji: '🥗',
    title: 'Fresh Diced Salad',
    color: '#16A34A',
    bgLight: '#F0FDF4',
    borderColor: '#BBF7D0',
    description: 'Finely diced fresh cucumbers and tomatoes with lemon juice!',
    alignment: 'kosher_food',
  },
  {
    id: 'challah',
    nameEn: 'Challah',
    nameHe: 'חַלָּה',
    spokenHe: 'חַלָּה',
    ttsText: 'חַלָּה',
    speechText: 'חַלָּה',
    hebrew: 'חַלָּה',
    emoji: '🍞',
    title: 'Braided Shabbat Bread',
    color: '#D97706',
    bgLight: '#FFFBEB',
    borderColor: '#FDE68A',
    description: 'Rich braided golden egg bread for Shabbat and festive meals!',
    alignment: 'kosher_food',
  },
  {
    id: 'cholent',
    nameEn: 'Cholent',
    nameHe: 'Cholent',
    spokenHe: 'Cholent',
    emoji: '🍲',
    title: 'Slow-Cooked Sabbath Stew',
    color: '#B45309',
    bgLight: '#FFFBEB',
    borderColor: '#FDE68A',
    description: 'Warm slow-cooked stew with meat, potatoes, beans, and barley!',
    alignment: 'kosher_food',
  },
];

// Vocabulary animal pairs for Noah & Naamah's Multi Animal Attack
const NOAH_ANIMAL_PAIRS = [
  { nameEn: 'Two Horses', spokenEn: 'Two horses!', emoji: '🐴🐴' },
  { nameEn: 'Two Sheep', spokenEn: 'Two sheep!', emoji: '🐑🐑' },
  { nameEn: 'Two Goats', spokenEn: 'Two goats!', emoji: '🐐🐐' },
  { nameEn: 'Two Lions', spokenEn: 'Two lions!', emoji: '🦁🦁' },
  { nameEn: 'Two Dogs', spokenEn: 'Two dogs!', emoji: '🐶🐶' },
  { nameEn: 'Two Bunnies', spokenEn: 'Two bunnies!', emoji: '🐰🐰' },
  { nameEn: 'Two Camels', spokenEn: 'Two camels!', emoji: '🐪🐪' },
  { nameEn: 'Two Birds', spokenEn: 'Two birds!', emoji: '🐦🐦' },
  { nameEn: 'Two Frogs', spokenEn: 'Two frogs!', emoji: '🐸🐸' },
  { nameEn: 'Two Monkeys', spokenEn: 'Two monkeys!', emoji: '🐒🐒' },
  { nameEn: 'Two Cows', spokenEn: 'Two cows!', emoji: '🐮🐮' },
  { nameEn: 'Two Elephants', spokenEn: 'Two elephants!', emoji: '🐘🐘' },
];

// Plagues for Moses' Plague Attack
const MOSES_PLAGUES = [
  { nameEn: 'Blood Attack', spokenEn: 'Blood!', emoji: '🩸' },
  { nameEn: 'Frog Attack', spokenEn: 'Frog!', emoji: '🐸' },
  { nameEn: 'Lice Attack', spokenEn: 'Lice!', emoji: '🐜' },
  { nameEn: 'Wild Animals', spokenEn: 'Wild animals!', emoji: '🦁' },
  { nameEn: 'Hail Attack', spokenEn: 'Hail!', emoji: '🧊' },
  { nameEn: 'Locust Attack', spokenEn: 'Locusts!', emoji: '🦗' },
  { nameEn: 'Darkness Attack', spokenEn: 'Darkness!', emoji: '🌑' },
];

// Abraham & Sarah attacks
const ABRAHAM_ATTACKS = [
  { nameEn: 'Star Count', spokenEn: 'Count the stars!', emoji: '🌟' },
  { nameEn: 'Fresh Bread', spokenEn: 'Fresh bread!', emoji: '🍞' },
  { nameEn: 'Open Tent', spokenEn: 'Welcome guests!', emoji: '⛺' },
  { nameEn: 'Kindness Beam', spokenEn: 'Kindness beam!', emoji: '✨' },
];

// King David attacks
const DAVID_ATTACKS = [
  { nameEn: 'Smooth Stone', spokenEn: 'Smooth stone!', emoji: '🪨' },
  { nameEn: 'Harp Melody', spokenEn: 'Sweet harp music!', emoji: '🪕' },
  { nameEn: 'Crown Sparkle', spokenEn: 'Crown sparkle!', emoji: '👑' },
  { nameEn: 'Brave Heart', spokenEn: 'Brave heart!', emoji: '🦁' },
];

// Miriam attacks
const MIRIAM_ATTACKS = [
  { nameEn: 'Tambourine Song', spokenEn: 'Tambourine song!', emoji: '🪘' },
  { nameEn: 'Miriam Well', spokenEn: 'Cool fresh water!', emoji: '💧' },
  { nameEn: 'Red Sea Dance', spokenEn: 'Dance of joy!', emoji: '💃' },
  { nameEn: 'Watchful Care', spokenEn: 'Watchful care!', emoji: '👀' },
];

// Judah Maccabee attacks
const JUDAH_ATTACKS: CatchHeroMove[] = [
  { nameEn: 'Pure Oil', spokenEn: 'Pure oil!', emoji: '🏺', power: 25 },
  { nameEn: 'Spinning Dreidel', spokenEn: 'Spinning dreidel!', image: DREIDEL_IMAGE_URL, power: 30 },
  { nameEn: 'Holy Torah', spokenEn: 'Torah power!', image: TORAH_IMAGE_URL, power: 35 },
  { nameEn: 'Menorah Light', spokenEn: 'Light of Maccabees!', emoji: '🕎', power: 40 },
];

export const getAllMovesForCatchHero = (heroId: string): CatchHeroMove[] => {
  if (heroId === 'noah_and_naamah') {
    return NOAH_ANIMAL_PAIRS.map((pair, idx) => ({
      nameEn: pair.nameEn,
      spokenEn: pair.spokenEn,
      emoji: pair.emoji,
      power: 25 + (idx % 3) * 5,
    }));
  }

  if (heroId === 'moses') {
    return MOSES_PLAGUES.map((plague, idx) => ({
      nameEn: plague.nameEn,
      spokenEn: plague.spokenEn,
      emoji: plague.emoji,
      power: 25 + (idx % 4) * 5,
    }));
  }

  return getMovesForCatchHero(heroId);
};

export const getMovesForCatchHero = (heroId: string, returnAll = false): CatchHeroMove[] => {
  if (returnAll) {
    return getAllMovesForCatchHero(heroId);
  }

  if (heroId === 'noah_and_naamah') {
    // Pick 4 random distinct animal pairs
    const shuffled = [...NOAH_ANIMAL_PAIRS].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, 4);
    return picked.map((pair, idx) => ({
      nameEn: pair.nameEn,
      spokenEn: pair.spokenEn,
      emoji: pair.emoji,
      power: 25 + (idx % 3) * 5,
    }));
  }

  if (heroId === 'moses') {
    // Pick 4 random distinct plague attacks
    const shuffled = [...MOSES_PLAGUES].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, 4);
    return picked.map((plague, idx) => ({
      nameEn: plague.nameEn,
      spokenEn: plague.spokenEn,
      emoji: plague.emoji,
      power: 25 + idx * 5,
    }));
  }

  if (heroId === 'abraham_and_sarah') {
    return ABRAHAM_ATTACKS.map((atk, idx) => ({
      ...atk,
      power: 25 + idx * 5,
    }));
  }

  if (heroId === 'david') {
    return DAVID_ATTACKS.map((atk, idx) => ({
      ...atk,
      power: 25 + idx * 5,
    }));
  }

  if (heroId === 'miriam') {
    return MIRIAM_ATTACKS.map((atk, idx) => ({
      ...atk,
      power: 25 + idx * 5,
    }));
  }

  if (heroId === 'judah_maccabee') {
    return JUDAH_ATTACKS;
  }

  if (heroId === 'shifra_and_puah' || heroId === 'shifra-puah') {
    return [
      { nameEn: 'Gentle Coo', spokenEn: 'Gentle coo!', emoji: '🍼', power: 25 },
      { nameEn: 'Honey Drops', spokenEn: 'Honey drops!', emoji: '🍯', power: 30 },
      { nameEn: 'Royal House', spokenEn: 'Royal house blessing!', emoji: '👑', power: 35 },
      { nameEn: 'Protective Shield', spokenEn: 'Protective shield!', emoji: '🛡️', power: 25 },
    ];
  }

  if (heroId === 'yael') {
    return [
      { nameEn: 'Bowl of Milk', spokenEn: 'Warm bowl of milk!', emoji: '🥛', power: 30 },
      { nameEn: 'Soft Blanket', spokenEn: 'Soft warm blanket!', emoji: '🛏️', power: 25 },
      { nameEn: 'Tent Peg Strike', spokenEn: 'Tent peg strike!', emoji: '🔨', power: 35 },
      { nameEn: 'Song of Victory', spokenEn: 'Song of victory!', emoji: '🎶', power: 25 },
    ];
  }

  // Check Villains as fallback
  if (heroId === 'snake') {
    return [
      { nameEn: 'Fruit', spokenEn: 'Fruit attack!', image: FRUIT_IMAGE_URL, power: 30 },
      { nameEn: 'Sly Whispers', spokenEn: 'Sly whispers!', emoji: '💬', power: 25 },
      { nameEn: 'Belly Crawl', spokenEn: 'Belly crawl!', emoji: '🍃', power: 20 },
      { nameEn: 'Eden Trick', spokenEn: 'Eden trick!', emoji: '🌳', power: 35 },
    ];
  }

  if (heroId === 'pharaoh') {
    return [
      { nameEn: 'Heavy Bricks', spokenEn: 'Heavy bricks!', emoji: '🧱', power: 30 },
      { nameEn: 'Royal Chariots', spokenEn: 'Royal chariots!', emoji: '🛞', power: 35 },
      { nameEn: 'Stubborn Heart', spokenEn: 'Stubborn heart!', emoji: '🖤', power: 25 },
      { nameEn: 'Pyramid Wall', spokenEn: 'Pyramid wall!', emoji: '🔺', power: 25 },
    ];
  }

  if (heroId === 'antiochus') {
    return [
      { nameEn: 'Soldiers', spokenEn: 'Soldiers march!', emoji: '⚔️', power: 30 },
      { nameEn: 'War Elephants', spokenEn: 'War elephants!', emoji: '🐘', power: 35 },
      { nameEn: 'Harsh Decrees', spokenEn: 'Harsh decrees!', emoji: '📜', power: 25 },
      { nameEn: 'Crown Boast', spokenEn: 'Crown boast!', emoji: '👑', power: 20 },
    ];
  }

  if (heroId === 'goliath') {
    return [
      { nameEn: 'Heavy Spear', spokenEn: 'Heavy spear!', emoji: '🗡️', power: 35 },
      { nameEn: 'Bronze Armor', spokenEn: 'Bronze armor!', emoji: '🛡️', power: 25 },
      { nameEn: 'Loud Boast', spokenEn: 'Loud boast!', emoji: '📢', power: 20 },
      { nameEn: 'Giant Step', spokenEn: 'Giant step!', emoji: '👣', power: 30 },
    ];
  }

  if (heroId === 'haman') {
    return [
      { nameEn: 'Sneaky Decree', spokenEn: 'Sneaky decree!', emoji: '📜', power: 30 },
      { nameEn: 'Greedy Plot', spokenEn: 'Greedy plot!', emoji: '💰', power: 25 },
      { nameEn: 'Noisy Grogger', spokenEn: 'Noisy grogger!', emoji: '🪇', power: 20 },
      { nameEn: 'Three-Cornered Hat', spokenEn: 'Hat trick!', emoji: '📐', power: 35 },
    ];
  }

  if (heroId === 'holofernes') {
    return [
      { nameEn: 'Siege Army', spokenEn: 'Siege army!', emoji: '🛡️', power: 30 },
      { nameEn: 'Salty Cheese', spokenEn: 'Salty cheese!', emoji: '🧀', power: 25 },
      { nameEn: 'Wine Feast', spokenEn: 'Wine feast!', emoji: '🍷', power: 20 },
      { nameEn: 'Brass Helmet', spokenEn: 'Brass helmet!', emoji: '🪖', power: 35 },
    ];
  }

  if (heroId === 'sisera') {
    return [
      { nameEn: '900 Iron Chariots', spokenEn: 'Nine hundred iron chariots!', emoji: '🛞', power: 35 },
      { nameEn: 'Heavy Armor', spokenEn: 'Heavy armor!', emoji: '🛡️', power: 25 },
      { nameEn: 'Kishon River Mud', spokenEn: 'Kishon river mud!', emoji: '🌊', power: 20 },
      { nameEn: 'Chariot Charge', spokenEn: 'Chariot charge!', emoji: '⚔️', power: 30 },
    ];
  }

  if (heroId === 'king-og' || heroId === 'king_og') {
    return [
      { nameEn: 'Iron Bedstead', spokenEn: 'Nine cubit iron bedstead!', emoji: '🛞', power: 30 },
      { nameEn: 'Mountain Throw', spokenEn: 'Uprooted mountain throw!', emoji: '🏔️', power: 35 },
      { nameEn: 'Giant Stomp', spokenEn: 'Giant stomp!', emoji: '👣', power: 25 },
      { nameEn: 'Ant Ring Trap', spokenEn: 'Ant collar trap!', emoji: '🐜', power: 20 },
    ];
  }

  // HOLIDAYS ATTACK MOVES (attacking using their known symbols)
  if (heroId === 'shabbat') {
    return [
      { nameEn: 'Shabbat Candles', spokenEn: 'Shabbat candles glow!', emoji: '🕯️', power: 30 },
      { nameEn: 'Braided Challah', spokenEn: 'Sweet braided challah!', emoji: '🍞', power: 25 },
      { nameEn: 'Kiddush Cup', spokenEn: 'Silver Kiddush cup!', emoji: '🍷', power: 25 },
      { nameEn: 'Shabbat Shalom', spokenEn: 'Shabbat Shalom peace!', emoji: '✨', power: 35 },
    ];
  }

  if (heroId === 'rosh-hashanah') {
    return [
      { nameEn: 'Apple', spokenEn: 'Dip apples in sweet honey!', emoji: '🍎', power: 30 },
      { nameEn: 'Shofar', spokenEn: 'Wake-up Shofar blast!', image: 'https://i.imgur.com/Dh395S4.png', power: 35 },
      { nameEn: 'Round Challah', spokenEn: 'Round challah circle!', image: 'https://i.imgur.com/yImjlDc.png', power: 25 },
      { nameEn: 'Pomegranate', spokenEn: 'Pomegranate blessing!', image: 'https://i.imgur.com/replFwL.png', power: 25 },
      { nameEn: 'Honey', spokenEn: 'Sweet golden honey!', emoji: '🍯', power: 25 },
    ];
  }

  if (heroId === 'yom-kippur') {
    return [
      { nameEn: 'Tekiah Gedolah', spokenEn: 'Great Shofar blast!', emoji: '📯', power: 35 },
      { nameEn: 'Dove of Peace', spokenEn: 'Gentle dove of peace!', emoji: '🕊️', power: 30 },
      { nameEn: 'White Clothes', spokenEn: 'Pure white garments!', emoji: '🤍', power: 25 },
      { nameEn: 'Forgiving Heart', spokenEn: 'Heart of forgiveness!', emoji: '✨', power: 25 },
    ];
  }

  if (heroId === 'sukkot') {
    return [
      { nameEn: 'Sukkah Hut', spokenEn: 'Outdoor leafy Sukkah!', emoji: '🛖', power: 30 },
      { nameEn: 'Yellow Etrog', spokenEn: 'Fragrant golden Etrog!', emoji: '🍋', power: 25 },
      { nameEn: 'Waving Lulav', spokenEn: 'Wave the tall Lulav!', emoji: '🌿', power: 35 },
      { nameEn: 'Starry Schach', spokenEn: 'Stars through leafy roof!', emoji: '⭐', power: 25 },
    ];
  }

  if (heroId === 'simchat-torah') {
    return [
      { nameEn: 'Dancing Hakafot', spokenEn: 'Joyful dancing with the Torah!', image: TORAH_IMAGE_URL, power: 35 },
      { nameEn: 'Torah Flag', spokenEn: 'Wave the colorful flag!', emoji: '🚩', power: 25 },
      { nameEn: 'Sweet Apple Topper', spokenEn: 'Apple topped flag!', emoji: '🍎', power: 25 },
      { nameEn: 'Beresheet Roll', spokenEn: 'Roll the Torah to Beresheet!', emoji: '📜', power: 30 },
    ];
  }

  if (heroId === 'hanukkah') {
    return [
      { nameEn: 'Menorah Light', spokenEn: 'Eight blazing lights!', emoji: '🕎', power: 35 },
      { nameEn: 'Spinning Dreidel', spokenEn: 'Spin the great dreidel!', image: DREIDEL_IMAGE_URL, power: 30 },
      { nameEn: 'Crispy Latkes', spokenEn: 'Sizzling hot latkes!', emoji: '🥔', power: 25 },
      { nameEn: 'Jelly Donut', spokenEn: 'Sweet jelly sufganiyah!', image: JELLY_DONUT_IMAGE_URL, power: 25 },
    ];
  }

  if (heroId === 'tu-bishvat') {
    return [
      { nameEn: 'Green Tree Sapling', spokenEn: 'Plant a young green tree!', emoji: '🌳', power: 30 },
      { nameEn: 'Figs & Dates', spokenEn: 'Sweet figs and chewy dates!', emoji: '🌴', power: 25 },
      { nameEn: 'Golden Olives', spokenEn: 'Pure olive oil!', emoji: '🫒', power: 25 },
      { nameEn: 'Seven Species', spokenEn: 'Gifts of the holy land!', emoji: '🌾', power: 35 },
    ];
  }

  if (heroId === 'purim') {
    return [
      { nameEn: 'Hamantaschen Cookie', spokenEn: 'Sweet triangle hamantaschen!', emoji: '📐', power: 30 },
      { nameEn: 'Noisy Grogger', spokenEn: 'Spin the loud grogger!', emoji: '🪇', power: 35 },
      { nameEn: 'Costumes & Masks', spokenEn: 'Silly dress up costume!', emoji: '🎭', power: 25 },
      { nameEn: 'Mishloach Manot', spokenEn: 'Gift basket for friends!', emoji: '🧺', power: 25 },
    ];
  }

  if (heroId === 'passover') {
    return [
      { nameEn: 'Crunchy Matzah', spokenEn: 'Crunchy flat matzah!', emoji: '🫓', power: 30 },
      { nameEn: 'Seder Plate', spokenEn: 'Passover Seder plate symbols!', emoji: '🍽️', power: 35 },
      { nameEn: 'Elijah Cup', spokenEn: 'Cup of the prophet Elijah!', emoji: '🍷', power: 25 },
      { nameEn: 'Afikoman Search', spokenEn: 'Search for the hidden Afikoman!', emoji: '🎁', power: 25 },
    ];
  }

  if (heroId === 'yom-haatzmaut') {
    return [
      { nameEn: 'Blue & White Flag', spokenEn: 'Wave the Israeli flag!', emoji: '🇮🇱', power: 35 },
      { nameEn: 'Star of David', spokenEn: 'Shining Star of David!', emoji: '✡️', power: 30 },
      { nameEn: 'Falafel in Pita', spokenEn: 'Tasty hot falafel!', emoji: '🧆', power: 25 },
      { nameEn: 'Hope Anthem', spokenEn: 'Sing Hatikvah with hope!', emoji: '🎶', power: 25 },
    ];
  }

  if (heroId === 'lag-baomer') {
    return [
      { nameEn: 'Campfire Flame', spokenEn: 'Blazing evening campfire!', emoji: '🔥', power: 35 },
      { nameEn: 'Toy Bow & Arrow', spokenEn: 'Target bow and arrow!', emoji: '🏹', power: 30 },
      { nameEn: 'Toasted Marshmallow', spokenEn: 'Sweet toasted marshmallow!', emoji: '🍡', power: 25 },
      { nameEn: 'Campfire Potato', spokenEn: 'Hot potato from the coals!', emoji: '🥔', power: 25 },
    ];
  }

  if (heroId === 'yom-yerushalayim') {
    return [
      { nameEn: 'Western Wall Kotel', spokenEn: 'Holy Western Wall stones!', emoji: '🧱', power: 30 },
      { nameEn: 'Jerusalem Lion', spokenEn: 'Mighty lion of Jerusalem!', emoji: '🦁', power: 35 },
      { nameEn: 'City of Gold', spokenEn: 'Golden walls of Jerusalem!', emoji: '👑', power: 25 },
      { nameEn: 'Flag Dance Parade', spokenEn: 'Joyous dancing flag parade!', emoji: '🇮🇱', power: 25 },
    ];
  }

  if (heroId === 'shavuot') {
    return [
      { nameEn: 'Ten Commandments', spokenEn: 'Two tablets of the Torah!', emoji: '📜', power: 35 },
      { nameEn: 'Mount Sinai Blooms', spokenEn: 'Mountain carpeted in flowers!', emoji: '⛰️', power: 30 },
      { nameEn: 'Creamy Cheesecake', spokenEn: 'Sweet creamy cheesecake!', emoji: '🍰', power: 25 },
      { nameEn: 'Torat Chaim', spokenEn: 'Torah of life and light!', emoji: '✨', power: 25 },
    ];
  }

  // KOSHER FOOD ATTACK MOVES
  if (heroId === 'kosher-chicken' || heroId === 'kosher_chicken') {
    return [
      { nameEn: 'Fresh Eggs', spokenEn: 'Fresh eggs attack!', emoji: '🥚', power: 25 },
      { nameEn: 'Chicken Drumstick', spokenEn: 'Crispy drumstick attack!', emoji: '🍗', power: 30 },
      { nameEn: 'Chicken Nuggets', spokenEn: 'Golden chicken nuggets!', emoji: '🧆', power: 30 },
      { nameEn: 'Crispy Schnitzel', spokenEn: 'Crispy schnitzel strike!', emoji: '🥩', power: 35 },
    ];
  }

  if (heroId === 'all-beef-hot-dog' || heroId === 'all_beef_hot_dog') {
    return [
      { nameEn: 'Baseball Fastball', spokenEn: 'Baseball fastball pitch!', emoji: '⚾', power: 25 },
      { nameEn: 'Baseball Bat Swing', spokenEn: 'Baseball bat swing!', emoji: '🏏', power: 30 },
      { nameEn: 'Stadium Mustard', spokenEn: 'Stadium mustard blast!', emoji: '🌭', power: 30 },
      { nameEn: 'Home Run Slam', spokenEn: 'Home run slam!', emoji: '🧢', power: 35 },
    ];
  }

  if (heroId === 'falafel') {
    return [
      { nameEn: 'Crispy Chickpea Ball', spokenEn: 'Crispy chickpea ball!', emoji: '🧆', power: 25 },
      { nameEn: 'Tahini Drizzle', spokenEn: 'Creamy tahini drizzle!', emoji: '🥣', power: 30 },
      { nameEn: 'Spicy Harissa', spokenEn: 'Spicy harissa kick!', emoji: '🌶️', power: 30 },
      { nameEn: 'Crunchy Pickle', spokenEn: 'Crunchy pickle slice!', emoji: '🥒', power: 35 },
    ];
  }

  if (heroId === 'shakshuka') {
    return [
      { nameEn: 'Sizzling Sauce', spokenEn: 'Sizzling tomato sauce!', emoji: '🍅', power: 25 },
      { nameEn: 'Poached Yolk Burst', spokenEn: 'Poached yolk burst!', emoji: '🍳', power: 30 },
      { nameEn: 'Paprika Spice Blast', spokenEn: 'Paprika spice blast!', emoji: '🌶️', power: 30 },
      { nameEn: 'Crusty Bread Dip', spokenEn: 'Crusty bread dip!', emoji: '🍞', power: 35 },
    ];
  }

  if (heroId === 'hummus') {
    return [
      { nameEn: 'Smooth Chickpea Dip', spokenEn: 'Smooth chickpea dip!', emoji: '🥣', power: 25 },
      { nameEn: 'Olive Oil Swirl', spokenEn: 'Olive oil swirl!', emoji: '🫒', power: 30 },
      { nameEn: 'Paprika Sprinkle', spokenEn: 'Paprika sprinkle!', emoji: '🌶️', power: 30 },
      { nameEn: 'Pine Nut Crunch', spokenEn: 'Pine nut crunch!', emoji: '🌰', power: 35 },
    ];
  }

  if (heroId === 'pita') {
    return [
      { nameEn: 'Pocket Bread Puff', spokenEn: 'Pocket bread puff!', emoji: '🥙', power: 25 },
      { nameEn: 'Warm Steam', spokenEn: 'Warm steam blast!', emoji: '♨️', power: 30 },
      { nameEn: 'Whole Wheat Shield', spokenEn: 'Whole wheat shield!', emoji: '🌾', power: 30 },
      { nameEn: 'Pita Pocket Stuff', spokenEn: 'Pita pocket stuff!', emoji: '🥙', power: 35 },
    ];
  }

  if (heroId === 'shawarma') {
    return [
      { nameEn: 'Rotisserie Spin', spokenEn: 'Rotisserie spin!', emoji: '🌀', power: 25 },
      { nameEn: 'Sliced Meat Blast', spokenEn: 'Sliced meat blast!', emoji: '🥩', power: 30 },
      { nameEn: 'Amba Mango Drizzle', spokenEn: 'Amba mango drizzle!', emoji: '🥭', power: 30 },
      { nameEn: 'Wrapped Laffa', spokenEn: 'Wrapped laffa roll!', emoji: '🌯', power: 35 },
    ];
  }

  if (heroId === 'jelly-donut' || heroId === 'jelly_donut') {
    return [
      { nameEn: 'Powdered Sugar Cloud', spokenEn: 'Powdered sugar cloud!', emoji: '☁️', power: 25 },
      { nameEn: 'Jelly Burst', spokenEn: 'Strawberry jelly burst!', emoji: '🍓', power: 30 },
      { nameEn: 'Fried Dough Rush', spokenEn: 'Fried dough rush!', image: JELLY_DONUT_IMAGE_URL, power: 30 },
      { nameEn: 'Sweet Glaze Splash', spokenEn: 'Sweet glaze splash!', emoji: '🍯', power: 35 },
    ];
  }

  if (heroId === 'hamantasch') {
    return [
      { nameEn: 'Poppy Seed Filling', spokenEn: 'Poppy seed filling!', emoji: '🖤', power: 25 },
      { nameEn: 'Chocolate Pocket', spokenEn: 'Chocolate pocket!', emoji: '🍫', power: 30 },
      { nameEn: 'Apricot Jam', spokenEn: 'Apricot jam splash!', emoji: '🍑', power: 30 },
      { nameEn: 'Triangle Corner', spokenEn: 'Triangle corner shield!', emoji: '📐', power: 35 },
    ];
  }

  if (heroId === 'israeli-salad' || heroId === 'israeli_salad') {
    return [
      { nameEn: 'Diced Cucumber Crunch', spokenEn: 'Diced cucumber crunch!', emoji: '🥒', power: 25 },
      { nameEn: 'Juicy Tomato Slice', spokenEn: 'Juicy tomato slice!', emoji: '🍅', power: 30 },
      { nameEn: 'Zesty Lemon Squeeze', spokenEn: 'Zesty lemon squeeze!', emoji: '🍋', power: 30 },
      { nameEn: 'Fresh Parsley Toss', spokenEn: 'Fresh parsley toss!', emoji: '🌿', power: 35 },
    ];
  }

  if (heroId === 'challah') {
    return [
      { nameEn: 'Golden Braid', spokenEn: 'Golden braided challah!', emoji: '🥖', power: 25 },
      { nameEn: 'Sesame Seed Shower', spokenEn: 'Sesame seed shower!', emoji: '⚪', power: 30 },
      { nameEn: 'Warm Honey Dip', spokenEn: 'Warm honey dip!', emoji: '🍯', power: 30 },
      { nameEn: 'Soft Slice Hug', spokenEn: 'Soft challah slice!', emoji: '🍞', power: 35 },
    ];
  }

  if (heroId === 'cholent') {
    return [
      { nameEn: 'Tender Potato Chunk', spokenEn: 'Tender potato chunk!', emoji: '🥔', power: 25 },
      { nameEn: 'Kishke Slice', spokenEn: 'Kishke slice!', emoji: '🥖', power: 30 },
      { nameEn: 'Slow Heat Simmer', spokenEn: 'Slow heat simmer!', emoji: '♨️', power: 30 },
      { nameEn: 'Overnight Stew Blast', spokenEn: 'Overnight stew blast!', emoji: '🍲', power: 35 },
    ];
  }

  return [];
};

