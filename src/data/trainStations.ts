export interface TrainStation {
  id: string;
  nameEn: string;
  nameHe: string;
  transliteration: string;
  region: 'tel_aviv' | 'haifa_north' | 'jerusalem' | 'sharon' | 'south';
  image?: string;
  bgImage?: string;
  unpointedHe?: string;
  spokenHe?: string;
  ttsText?: string;
  speechText?: string;
  nameAr?: string;
  line?: string;
  customBg?: string;
}

export const ISRAEL_RAILWAYS_STATIONS: TrainStation[] = [
  { id: 'tel-aviv-savidor', nameEn: "Tel Aviv – Savidor Center", nameHe: "תֵּל אָבִיב – סָבִידוֹר מֶרְכָּז", transliteration: "Tel Aviv – Savidor Merkaz", region: 'tel_aviv', image: '/stations/tel-aviv-savidor.webp', bgImage: '/stations/tel-aviv-savidor.webp' },
  { id: 'tel-aviv-hashalom', nameEn: "Tel Aviv – HaShalom", nameHe: "תֵּל אָבִיב – הַשָּׁלוֹם", transliteration: "Tel Aviv – HaShalom", region: 'tel_aviv', image: '/stations/tel-aviv-hashalom.webp', bgImage: '/stations/tel-aviv-hashalom.webp' },
  { id: 'tel-aviv-univ', nameEn: "Tel Aviv – University – Expo", nameHe: "תֵּל אָבִיב – הָאוּנִיבֶרְסִיטָה – אֶקְסְפּוֹ", transliteration: "Tel Aviv – HaUniversita – Expo", region: 'tel_aviv', image: '/stations/tel-aviv-university-expo.webp', bgImage: '/stations/tel-aviv-university-expo.webp' },
  { id: 'tel-aviv-hahagana', nameEn: "Tel Aviv – HaHagana", nameHe: "תֵּל אָבִיב – הַהֲגָנָה", transliteration: "Tel Aviv – HaHagana", region: 'tel_aviv', image: '/stations/tel-aviv-hahaganah.webp', bgImage: '/stations/tel-aviv-hahaganah.webp' },
  { id: 'ben-gurion-airport', nameEn: "Ben Gurion Airport", nameHe: "נְמַל הַתְּעוּפָה בֶּן גּוּרְיוֹן", transliteration: "Nemal HaTeufa Ben Gurion", region: 'tel_aviv', image: '/stations/ben-gurion-airport.webp', bgImage: '/stations/ben-gurion-airport.webp' },
  { id: 'jerusalem-navon', nameEn: "Jerusalem – Yitzhak Navon", nameHe: "יְרוּשָׁלַיִם – יִצְחָק נָבוֹן", transliteration: "Jerusalem – Yitzhak Navon", region: 'jerusalem', image: '/stations/jerusalem-yitzchak-navon.webp', bgImage: '/stations/jerusalem-yitzchak-navon.webp' },
  { id: 'haifa-merkaz', nameEn: "Haifa Center – Hashmona", nameHe: "חֵיפָה מֶרְכָּז – הַשְּׁמוֹנָה", transliteration: "Haifa Center – Hashmona", region: 'haifa_north', image: '/stations/haifa-center-hashmona.webp', bgImage: '/stations/haifa-center-hashmona.webp' },
  { id: 'haifa-carmel', nameEn: "Haifa – Hof HaCarmel", nameHe: "חֵיפָה – חוֹף הַכַּרְמֶל", transliteration: "Haifa – Hof HaCarmel", region: 'haifa_north', image: '/stations/haifa-hof-hacarmel.webp', bgImage: '/stations/haifa-hof-hacarmel.webp' },
  { id: 'haifa-bat-galim', nameEn: "Haifa – Bat Galim", nameHe: "חֵיפָה – בַּת גַּלִּים", transliteration: "Haifa – Bat Galim", region: 'haifa_north', image: '/stations/haifa-bat-galim.webp', bgImage: '/stations/haifa-bat-galim.webp' },
  { id: 'lev-hamifrats', nameEn: "HaMifratz Central", nameHe: "מֶרְכָּזִית הַמִּפְרָץ", transliteration: "HaMifratz Central", region: 'haifa_north', image: '/stations/hamifratz-central.webp', bgImage: '/stations/hamifratz-central.webp' },
  { id: 'hutsot-hamifrats', nameEn: "Hutsot HaMifrats", nameHe: "חוּצוֹת הַמִּפְרָץ", transliteration: "Hutsot HaMifrats", region: 'haifa_north', image: '/stations/hutzot-hamifrats.webp', bgImage: '/stations/hutzot-hamifrats.webp' },
  { id: 'kiryat-motzkin', nameEn: "Kiryat Motzkin", nameHe: "קִרְיַת מוֹצְקִין", transliteration: "Kiryat Motzkin", region: 'haifa_north', image: '/stations/kiryat-motzkin.webp', bgImage: '/stations/kiryat-motzkin.webp' },
  { id: 'kiryat-haim', nameEn: "Kiryat Haim", nameHe: "קִרְיַת חַיִּים", transliteration: "Kiryat Haim", region: 'haifa_north', image: '/stations/kiryat-hayim.webp', bgImage: '/stations/kiryat-hayim.webp' },
  { id: 'akko', nameEn: "Acre", nameHe: "עַכּוֹ", transliteration: "Acre", region: 'haifa_north', image: '/stations/acre.webp', bgImage: '/stations/acre.webp' },
  { id: 'nahariya', nameEn: "Nahariya", nameHe: "נַהֲרִיָּה", transliteration: "Nahariya", region: 'haifa_north', image: '/stations/nahariya.webp', bgImage: '/stations/nahariya.webp' },
  { id: 'karmiel', nameEn: "Karmiel", nameHe: "כַּרְמִיאֵל", transliteration: "Karmiel", region: 'haifa_north', image: '/stations/karmiel.webp', bgImage: '/stations/karmiel.webp' },
  { id: 'ahihud', nameEn: "Ahihud", nameHe: "אֲחִיהוּד", transliteration: "Ahihud", region: 'haifa_north', image: '/stations/ahihud.webp', bgImage: '/stations/ahihud.webp' },
  { id: 'afula', nameEn: "Afula", nameHe: "עֲפוּלָה", transliteration: "Afula", region: 'haifa_north', image: '/stations/afula.webp', bgImage: '/stations/afula.webp' },
  { id: 'bet-shean', nameEn: "Beit She'an – David Levy", nameHe: "בֵּית שְׁאָן – דָּוִד לֵוִי", transliteration: "Beit She'an – David Levy", region: 'haifa_north', image: '/stations/beit-shean.webp', bgImage: '/stations/beit-shean.webp' },
  { id: 'yokneam', nameEn: "Yokneam – Kfar Yehoshua", nameHe: "יָקְנְעָם – כְּפַר יְהוֹשֻׁעַ", transliteration: "Yokneam – Kfar Yehoshua", region: 'haifa_north', image: '/stations/yokneam.webp', bgImage: '/stations/yokneam.webp' },
  { id: 'atlit', nameEn: "Atlit", nameHe: "עַתְלִית", transliteration: "Atlit", region: 'haifa_north', image: '/stations/atlit.webp', bgImage: '/stations/atlit.webp' },
  { id: 'binyamina', nameEn: "Binyamina", nameHe: "בִּנְיָמִינָה", transliteration: "Binyamina", region: 'sharon', image: '/stations/binyamina.webp', bgImage: '/stations/binyamina.webp' },
  { id: 'caesarea', nameEn: "Caesarea – Pardes Hanna", nameHe: "קֵיסָרְיָה – פַּרְדֵּס חַנָּה", transliteration: "Caesarea – Pardes Hanna", region: 'sharon', image: '/stations/caesaria-pardes-hanna.webp', bgImage: '/stations/caesaria-pardes-hanna.webp' },
  { id: 'hadera-west', nameEn: "Hadera – West", nameHe: "חֲדֵרָה – מַעֲרָב", transliteration: "Hadera – West", region: 'sharon', image: '/stations/hadera-west.webp', bgImage: '/stations/hadera-west.webp' },
  { id: 'hadera-east', nameEn: "Hadera – East", nameHe: "חֲדֵרָה – מִזְרָח", transliteration: "Hadera – East", unpointedHe: "חדרה - מזרח", spokenHe: "חֲדֵרָה – מִזְרָח", ttsText: "חֲדֵרָה – מִזְרָח", speechText: "חֲדֵרָה – מִזְרָח", nameAr: "الخضيرة - شرق", line: "Eastern Railway / המסילה המזרחית", region: 'sharon', image: '/stations/hadera-east.webp', bgImage: '/stations/hadera-east.webp' },
  { id: 'netanya', nameEn: "Netanya", nameHe: "נְתַנְיָה", transliteration: "Netanya", region: 'sharon', image: '/stations/netanya.webp', bgImage: '/stations/netanya.webp' },
  { id: 'netanya-sapir', nameEn: "Netanya – Sapir", nameHe: "נְתַנְיָה – סַפִּיר", transliteration: "Netanya – Sapir", region: 'sharon', image: '/stations/netanya-sapir.webp', bgImage: '/stations/netanya-sapir.webp' },
  { id: 'beit-yehoshua', nameEn: "Beit Yehoshua", nameHe: "בֵּית יְהוֹשֻׁעַ", transliteration: "Beit Yehoshua", region: 'sharon', image: '/stations/beit-yehoshua.webp', bgImage: '/stations/beit-yehoshua.webp' },
  { id: 'herzliya', nameEn: "Herzliya", nameHe: "הֶרְצְלִיָּה", transliteration: "Herzliya", region: 'sharon', image: '/stations/hertzliya.webp', bgImage: '/stations/hertzliya.webp' },
  { id: 'raanana-south', nameEn: "Ra'anana – South", nameHe: "רַעֲנַנָּה – דָּרוֹם", transliteration: "Ra'anana – South", region: 'sharon', image: '/stations/raanana-south.webp', bgImage: '/stations/raanana-south.webp' },
  { id: 'raanana-west', nameEn: "Ra'anana – West", nameHe: "רַעֲנַנָּה – מַעֲרָב", transliteration: "Ra'anana – West", region: 'sharon', image: '/stations/raanana-west.webp', bgImage: '/stations/raanana-west.webp' },
  { id: 'hod-hasharon', nameEn: "Hod HaSharon – Sokolov", nameHe: "הוֹד הַשָּׁרוֹן – סוֹקוֹלוֹב", transliteration: "Hod HaSharon – Sokolov", region: 'sharon', image: '/stations/hod-hasharon-sokolov.webp', bgImage: '/stations/hod-hasharon-sokolov.webp' },
  { id: 'kfar-saba', nameEn: "Kfar Saba – Nordau", nameHe: "כְּפַר סַבָּא – נוֹרְדָאוּ", transliteration: "Kfar Saba – Nordau", region: 'sharon', image: '/stations/kfar-saba-nordau.webp', bgImage: '/stations/kfar-saba-nordau.webp' },
  { id: 'rosh-haayin', nameEn: "Rosh HaAyin – North", nameHe: "רֹאשׁ הָעַיִן – צָפוֹן", transliteration: "Rosh HaAyin – Tsafon", region: 'sharon', image: '/stations/rosh-haayin-north.webp', bgImage: '/stations/rosh-haayin-north.webp' },
  { id: 'shomron-tayyiba', nameEn: "Shomron – Tayyiba", nameHe: "שׁוֹמְרוֹן – טַיִּבֶּה", transliteration: "Shomron – Tayyiba", unpointedHe: "שומרון - טייבה", spokenHe: "שׁוֹמְרוֹן – טַיִּבֶּה", ttsText: "שׁוֹמְרוֹן – טַיִּבֶּה", speechText: "שׁוֹמְרוֹן – טַיִּבֶּה", nameAr: "السامرة - الطيبة", line: "Eastern Railway / המסילה המזרחית", region: 'sharon', image: '/stations/shomron-tayyiba.webp', bgImage: '/stations/shomron-tayyiba.webp' },
  { id: 'petah-tikva-aryeh', nameEn: "Petah Tikva – Kiryat Aryeh", nameHe: "פֶּתַח תִּקְוָה – קִרְיַת אַרְיֵה", transliteration: "Petah Tikva – Kiryat Aryeh", region: 'tel_aviv', image: '/stations/petah-tikva-kiryat-aryeh.webp', bgImage: '/stations/petah-tikva-kiryat-aryeh.webp' },
  { id: 'petah-tikva-sgula', nameEn: "Petah Tikva – Sgula", nameHe: "פֶּתַח תִּקְוָה – סְגֻלָּה", transliteration: "Petah Tikva – Sgula", region: 'tel_aviv', image: '/stations/petah-tikva-sgula.webp', bgImage: '/stations/petah-tikva-sgula.webp' },
  { id: 'lod', nameEn: "Lod", nameHe: "לוֹד", transliteration: "Lod", region: 'tel_aviv', image: '/stations/lod.webp', bgImage: '/stations/lod.webp' },
  { id: 'lod-aviv', nameEn: "Lod – Ganei Aviv", nameHe: "לוֹד – גַּנֵּי אָבִיב", transliteration: "Lod – Ganei Aviv", region: 'tel_aviv', image: '/stations/lod-ganei-aviv.webp', bgImage: '/stations/lod-ganei-aviv.webp' },
  { id: 'beer-yakov', nameEn: "Be'er Ya'akov", nameHe: "בְּאֵר יַעֲקֹב", transliteration: "Be'er Ya'akov", region: 'tel_aviv', image: '/stations/beer-yaakov.webp', bgImage: '/stations/beer-yaakov.webp' },
  { id: 'ramla', nameEn: "Ramla", nameHe: "רַמְלָה", transliteration: "Ramla", region: 'tel_aviv', image: '/stations/ramla.webp', bgImage: '/stations/ramla.webp' },
  { id: 'modiin-center', nameEn: "Modi'in – Center", nameHe: "מוֹדִיעִין – מֶרְכָּז", transliteration: "Modi'in – Center", region: 'jerusalem', image: '/stations/modiin-center.webp', bgImage: '/stations/modiin-center.webp' },
  { id: 'modiin-paatei', nameEn: "Pa'atei Modi'in", nameHe: "פַּאֲתֵי מוֹדִיעִין", transliteration: "Pa'atei Modi'in", region: 'jerusalem', image: '/stations/paatei-modiin.webp', bgImage: '/stations/paatei-modiin.webp' },
  { id: 'rehovot', nameEn: "Rehovot", nameHe: "רְחוֹבוֹת", transliteration: "Rehovot", region: 'tel_aviv', image: '/stations/rehovot.webp', bgImage: '/stations/rehovot.webp' },
  { id: 'mazkeret-batya', nameEn: "Mazkeret Batya", nameHe: "מַזְכֶּרֶת בָּתְיָה", transliteration: "Mazkeret Batya", region: 'tel_aviv', image: '/stations/mazkeret-batya.webp', bgImage: '/stations/mazkeret-batya.webp' },
  { id: 'kiryat-malakhi-yoav', nameEn: "Kiryat Mal'akhi – Yoav", nameHe: "קִרְיַת מַלְאָכִי – יוֹאָב", transliteration: "Kiryat Mal'akhi – Yoav", region: 'south', image: '/stations/kiryat-malachi-yoav.webp', bgImage: '/stations/kiryat-malachi-yoav.webp' },
  { id: 'yavne-east', nameEn: "Yavne – East", nameHe: "יַבְנֶה – מִזְרָח", transliteration: "Yavne – Mizrach", region: 'tel_aviv', image: '/stations/yavne-east.webp', bgImage: '/stations/yavne-east.webp' },
  { id: 'yavne-west', nameEn: "Yavne – West", nameHe: "יַבְנֶה – מַעֲרָב", transliteration: "Yavne Maarav", region: 'tel_aviv', image: '/stations/yavne-west.webp', bgImage: '/stations/yavne-west.webp' },
  { id: 'ashdod', nameEn: "Ashdod – Ad Halom – Metropol", nameHe: "אַשְׁדּוֹד – עַד הֲלוֹם – מֶטְרוֹפּוֹל", transliteration: "Ashdod – Ad Halom – Metropol", region: 'south', image: '/stations/ashdod.webp', bgImage: '/stations/ashdod.webp' },
  { id: 'ashkelon', nameEn: "Ashkelon", nameHe: "אַשְׁקְלוֹן", transliteration: "Ashkelon", region: 'south', image: '/stations/ashkelon.webp', bgImage: '/stations/ashkelon.webp' },
  { id: 'sderot', nameEn: "Sderot", nameHe: "שְׂדֵרוֹת", transliteration: "Sderot", region: 'south', image: '/stations/sderot.webp', bgImage: '/stations/sderot.webp' },
  { id: 'netivot', nameEn: "Netivot", nameHe: "נְתִיבוֹת", transliteration: "Netivot", region: 'south', image: '/stations/netivot.webp', bgImage: '/stations/netivot.webp' },
  { id: 'ofakim', nameEn: "Ofakim", nameHe: "אוֹפָקִים", transliteration: "Ofakim", region: 'south', image: '/stations/ofakim.webp', bgImage: '/stations/ofakim.webp' },
  { id: 'beer-sheva-center', nameEn: "Be’er Sheva – Center", nameHe: "בְּאֵר שֶׁבַע – מֶרְכָּז", transliteration: "Be'er Sheva Merkaz", region: 'south', image: '/stations/beer-sheva-center.webp', bgImage: '/stations/beer-sheva-center.webp' },
  { id: 'beer-sheva-north', nameEn: "Beer Sheva – North / University", nameHe: "בְּאֵר שֶׁבַע – צָפוֹן / אוּנִיבֶרְסִיטָה", transliteration: "Beer Sheva – North / University", region: 'south', image: '/stations/beer-sheva-north-university.webp', bgImage: '/stations/beer-sheva-north-university.webp' },
  { id: 'dimona', nameEn: "Dimona", nameHe: "דִּימוֹנָה", transliteration: "Dimona", region: 'south', image: '/stations/dimona.webp', bgImage: '/stations/dimona.webp' },
  { id: 'holon-wolfson', nameEn: "Holon – Wolfson", nameHe: "חוֹלוֹן – וֻולְפְסוֹן", transliteration: "Holon – Wolfson", region: 'tel_aviv', image: '/stations/holon-wolfson.webp', bgImage: '/stations/holon-wolfson.webp' },
  { id: 'bat-yam-yoseftal', nameEn: "Bat Yam – Eli Cohen – Yoseftal", nameHe: "בַּת יָם – אֵלִי כֹּהֵן – יוֹסֶפְטַל", transliteration: "Bat Yam – Eli Cohen – Yoseftal", region: 'tel_aviv', image: '/stations/bat-yam-eli-cohen-yoseftal.webp', bgImage: '/stations/bat-yam-eli-cohen-yoseftal.webp' },
  { id: 'bat-yam-komemiyut', nameEn: "Bat Yam – Komemiyut", nameHe: "בַּת יָם – קוֹמְמִיּוּת", transliteration: "Bat Yam – Komemiyut", region: 'tel_aviv', image: '/stations/bat-yam-komemiyut.webp', bgImage: '/stations/bat-yam-komemiyut.webp' },
  { id: 'holon-junction', nameEn: "Holon Junction", nameHe: "צֹמֶת חוֹלוֹן", transliteration: "Tsomet Holon", region: 'tel_aviv', image: '/stations/holon-junction.webp', bgImage: '/stations/holon-junction.webp' },
  { id: 'rishon-dayan', nameEn: "Rishon LeZion – Moshe Dayan", nameHe: "רִאשׁוֹן לְצִיּוֹן – מֹשֶׁה דַּיָּן", transliteration: "Rishon LeZion – Moshe Dayan", region: 'tel_aviv', image: '/stations/rishon-letziyon-moshe-dayan.webp', bgImage: '/stations/rishon-letziyon-moshe-dayan.webp' },
  { id: 'rishon-harishonim', nameEn: "Rishon LeZion – HaRishonim", nameHe: "רִאשׁוֹן לְצִיּוֹן – הָרִאשׁוֹנִים", transliteration: "Rishon LeZion – HaRishonim", region: 'tel_aviv', image: '/stations/rishon-letziyon-harishonim.webp', bgImage: '/stations/rishon-letziyon-harishonim.webp' },
  { id: 'kfar-habad', nameEn: "Kfar Chabad", nameHe: "כְּפַר חֲבַּד", transliteration: "Kfar Chabad", region: 'tel_aviv', image: '/stations/kfar-chabad.webp', bgImage: '/stations/kfar-chabad.webp' },
  { id: 'bnei-brak-hayal', nameEn: "Bnei Brak – Ramat HaHayal", nameHe: "בְּנֵי בְּרַק – רָמַת הַחַיָּל", transliteration: "Bnei Brak – Ramat HaHayal", region: 'tel_aviv', image: '/stations/bnei-brak-ramat-hachayal.webp', bgImage: '/stations/bnei-brak-ramat-hachayal.webp' },
  { id: 'beit-shemesh', nameEn: "Beit Shemesh", nameHe: "בֵּית שֶׁמֶשׁ", transliteration: "Beit Shemesh", region: 'jerusalem', image: '/stations/beit-shemesh.webp', bgImage: '/stations/beit-shemesh.webp' },
  { id: 'tira-kochav-yair', nameEn: "Tira – Kochav Ya'ir", nameHe: "טִירָה – כּוֹכַב יָאִיר", transliteration: "Tira – Kochav Ya'ir", region: 'sharon' },
  { id: 'lehavim-rahat', nameEn: "Lehavim – Rahat", nameHe: "לְהָבִים – רַהַט", transliteration: "Lehavim – Rahat", region: 'south', customBg: 'bg-blue-600' },
  { id: 'migdal-haemek-kfar-baruch', nameEn: "Migdal HaEmek – Kfar Baruch", nameHe: "מִגְדַּל הָעֵמֶק – כְּפַר בָּרוּךְ", transliteration: "Migdal HaEmek – Kfar Baruch", region: 'haifa_north' },
  { id: 'kiryat-gat', nameEn: "Kiryat Gat", nameHe: "קִרְיַת גַּת", transliteration: "Kiryat Gat", region: 'south', customBg: 'bg-blue-600' },
];
