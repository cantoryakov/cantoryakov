import React, { useState, useRef, useLayoutEffect } from 'react';
import { Download } from 'lucide-react';
import { DownloadsTab } from '../types';
import { soundManager } from '../utils/audio';
import { ZoomableSvgFrame } from './ZoomableSvgFrame';

interface NavTabItem {
  id: DownloadsTab;
  label: string;
}

const DOWNLOAD_TABS: NavTabItem[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'font', label: 'Font' },
  { id: 'map', label: 'Map of Israel' },
  { id: 'railways', label: 'Israel Railways' },
  { id: 'plays', label: 'Plays' },
  { id: 'mixtape', label: 'Hip-Hop Mixtape' },
];

interface DownloadsSectionProps {
  activeTab: DownloadsTab;
  onSelectTab: (tab: DownloadsTab) => void;
}

export const DownloadsSection: React.FC<DownloadsSectionProps> = ({
  activeTab,
  onSelectTab,
}) => {

  // Sliding pill position for the Tanach-style navigation bar
  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pillStyle, setPillStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    ready: boolean;
  }>({ left: 0, top: 0, width: 0, height: 0, ready: false });

  useLayoutEffect(() => {
    const updatePill = () => {
      const container = navContainerRef.current;
      const activeBtn = tabButtonRefs.current[activeTab];
      if (!container || !activeBtn) return;

      setPillStyle({
        left: activeBtn.offsetLeft,
        top: activeBtn.offsetTop,
        width: activeBtn.offsetWidth,
        height: activeBtn.offsetHeight,
        ready: true,
      });
    };

    updatePill();
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [activeTab]);

  const handleSelectTab = (tab: DownloadsTab) => {
    onSelectTab(tab);
    soundManager.playPop();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-10 text-stone-900">
      {/* Navigation Bar styled like the Tanach page switcher */}
      <div className="flex justify-center">
        <div
          ref={navContainerRef}
          className="relative flex flex-wrap sm:flex-nowrap items-center justify-center gap-1 bg-amber-100/70 p-1.5 rounded-2xl border border-amber-200/90 max-w-full select-none"
          role="tablist"
          aria-label="Downloads navigation"
        >
          {pillStyle.ready && (
            <div
              aria-hidden="true"
              className="absolute bg-amber-500 rounded-xl shadow-xs transition-all duration-300 ease-out z-0"
              style={{
                left: `${pillStyle.left}px`,
                top: `${pillStyle.top}px`,
                width: `${pillStyle.width}px`,
                height: `${pillStyle.height}px`,
              }}
            />
          )}

          {DOWNLOAD_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabButtonRefs.current[tab.id] = el;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelectTab(tab.id)}
                className={`relative z-10 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-300 cursor-pointer whitespace-nowrap ${
                  isActive ? 'text-white' : 'text-amber-950 hover:text-amber-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Unboxed Editorial Content Directly on the Page Canvas */}
      <article className="downloads-content max-w-3xl mx-auto space-y-8 leading-relaxed">
        {/* ================= TAB 1: WELCOME ================= */}
        {activeTab === 'welcome' && (
          <div className="space-y-8">
            <header className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
                Downloads
              </h1>
              <p className="text-base sm:text-lg text-stone-700">
                Hello! This is the place where I put my &ldquo;ed tech&rdquo; materials and also… lower tech things. It&rsquo;s more for adults, but kids are welcome to check this stuff out too.
              </p>
            </header>

            <section className="pt-2 space-y-5">
              <h2 className="text-lg font-bold text-stone-900">What&rsquo;s Inside</h2>

              <dl className="space-y-2">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('font')}
                      className="text-base font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 cursor-pointer text-left"
                    >
                      Font (Akoderf)
                    </button>
                  </dt>
                  <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm sm:text-base text-stone-700">
                    This is my remix of the free font, Fredoka.
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('map')}
                      className="text-base font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 cursor-pointer text-left"
                    >
                      Map of Israel
                    </button>
                  </dt>
                  <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm sm:text-base text-stone-700">
                    A free vector map of Israel for classroom use. It&rsquo;s the first wall map of Israel for kids to ever include the full passenger heavy rail network alongside the usual dots, highways, and borders.
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('railways')}
                      className="text-base font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 cursor-pointer text-left"
                    >
                      Israel Railways
                    </button>
                  </dt>
                  <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm sm:text-base text-stone-700">
                   I made my own vector diagram of the Israel Railways network, in the style of vintage MTA subway maps.
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('plays')}
                      className="text-base font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 cursor-pointer text-left"
                    >
                      Plays
                    </button>
                  </dt>
                  <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm sm:text-base text-stone-700">
                    I&rsquo;ve written a few original &ldquo;shpiels&rdquo; for Jewish school use. You can have those, too!
                  </dd>
                </div>
              </dl>
            </section>

            <p className="text-base sm:text-lg text-stone-700">
              <strong className="font-bold text-stone-900">A note on AI:</strong> I have used AI tools (namely, Gemini and Google AI Studio) in building my resources, especially the web site coding side of things; but all materials found here are created and designed by me, using my brain and my fingers. Particularly, the plays are 100% handmade! I believe in judicious use of AI, to enhance creativity, not replace it.
            </p>
          </div>
        )}

        {/* ================= TAB 2: FONT ================= */}
        {activeTab === 'font' && (
          <div className="space-y-8">
            <header className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
                Akoderf
              </h1>
              <p className="text-base sm:text-lg text-stone-700">
                In 2011, Milena Brandão made Fredoka. It was a gorgeous, extremely friendly Latin script (i.e. English) typeface, with those lovely rounded edges that run great on a CriCut. In 2016, Ben Nathan joined the party and added a Hebrew component. In 2026, I rolled up my sleeves, downloaded the source files, and started messing around with Milena and Ben&rsquo;s font.
              </p>
              <p className="text-base sm:text-lg text-stone-700">
                My goal was to create a font that can be used for all things in my classroom: Display, worksheets, and especially printing gray text for tracing. I liked the Milena-Ben creation but I had some problems with it. If you&rsquo;re using Fredoka, and press ⌘B, the text becomes EXTREMELY thick. There is a &ldquo;Medium&rdquo; weight that is a much more reasonable alternative to the normal weight, but if you are using a basic sort of text editing program, you might not even have access to that weight. I rearranged the weights so Fredoka Medium became Akoderf Bold, and Fredoka Bold became Akoderf Black.
              </p>
              <p className="text-base sm:text-lg text-stone-700">
                Milena&rsquo;s capital B and Q are really weird, and she misplaced the apostrophe; Ben didn&rsquo;t include the roofs (top strokes) on yod, vav, or nun sofit; the numbers 1 and 4 and capital I weren&rsquo;t the shapes that little kids learn, so they were confused; underscores didn&rsquo;t connect, so making worksheets was harder than it should have been; the low descending Hebrew letters didn&rsquo;t drop down as low as they could have, exacerbating the vav/nun sofit and resh/kaf sofit problems; the geresh and gershayim (essential for Hebrew abbreviations and certain words like &ldquo;chips&rdquo;) were just wrong. I didn&rsquo;t like Milena&rsquo;s dollar sign, or Ben&rsquo;s ₪ symbol, so I changed those, too…
              </p>
              <p className="text-base sm:text-lg text-stone-700">
                Once I made some of my changes, I noticed that nikud placement was kind of messed up, so I could have tried to fix all of that, but instead, I chose to just blank out all of the nikud characters. There are no d&rsquo;geshim or nikud in Akoderf, and it&rsquo;s impossible to add them to text set in my font. This reflects my viewpoint that children learning conversational Hebrew should read the 22 consonants only, and learn the vowels by ear, like little Israeli kids.
              </p>
            </header>

            {/* Full-width README SVG and Google Drive Release Link */}
            <div className="space-y-6">
              <div className="border border-stone-300 bg-white p-1.5 sm:p-2">
                <ZoomableSvgFrame
                  src="/readme.svg"
                  alt="Akoderf font guide and specimen"
                  framed={false}
                />
              </div>
              <div>
                <a
                  href="https://drive.google.com/drive/folders/1wj_OByTbnaC7Xxc7PHzMgL0isOVRIw9o?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-xl sm:text-2xl font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 transition-colors"
                >
                  <Download className="w-6 h-6 shrink-0" />
                  <span>Download Akoderf (Google Drive)</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: MAP OF ISRAEL ================= */}
        {activeTab === 'map' && (
          <div className="space-y-8">
            <header className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
                Map of Israel
              </h1>
              <p className="text-base sm:text-lg text-stone-700">
                Do you have any idea how hard it is to make a map from scratch?! You have to use a program called{' '}
                <a
                  href="http://qgis.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 transition-colors"
                >
                  QGIS
                </a>
                . Shout out to Gary Sherman for his hard work, but he did not create something that was designed for ease of use. Anyway, I managed to make this thing. This map has:
              </p>
              <ul className="text-base sm:text-lg text-stone-700 space-y-2">
                <li>
                  <b>National borders.</b> You&rsquo;d think that would be simple, but it&rsquo;s not! And never mind the obvious thing, that I won&rsquo;t mention here. But there&rsquo;s also the UNDOF Zone. Publicly available world outline databases include the UNDOF Zone, a small area of land east of the Golan Heights, as part of Israel, but Israel doesn&rsquo;t claim it, and never has. It&rsquo;s just a wrong thing on worldwide mapping servers. I had to manually fix the border of the Golan Heights and Syria! By dragging points around on my screen!!!
                </li>
                <li>
                  <b>Bodies of water.</b> Including some of the smaller rivers. This is surprisingly complicated, too, because a lot of &ldquo;rivers&rdquo; you see on maps of Israel are actually wadis, meaning, they&rsquo;re usually dry. I don&rsquo;t want to show things that are dry so I had to do some research on which rivers are actually wet 12 months a year! Also, my imported data that claimed to show the line of the Jordan river, showed it starting way up in Lebanon, but this is wrong! It starts at Kibbutz Sde Nehemia. Nothing that seems simple is simple! Also, the Jordan River goes right along the border of Israel, so I had to make sure it wasn&rsquo;t obscured by the border line.
                </li>
                <li>
                  <b>Topography.</b> Hills and valleys and such. This comes from ArcGIS, which is owned by ESRI. Shout out to Jack Dangermond! He has a cool last name, too!
                </li>
                <li>
                  <b>Major highways.</b> This was pretty easy. The longest road is 90, which goes along the eastern border of the country. I also had room to label 40, which goes northwest from Eilat.
                </li>
                <li>
                  <b>Dead Sea and Kinneret.</b> I call it Kinneret rather than &ldquo;Sea of Galilee&rdquo; because it&rsquo;s not what a normal person in 2026 would call a &ldquo;sea.&rdquo; It&rsquo;s fresh water!
                </li>
                <li>
                  <b>Train tracks and stations!</b> I really, really like public transit so I was determined to show it on my map. Turns out there are 69 working passenger stations in Israel! That is a lot, right?? I downloaded the track information from an online database, and then I had to go about manually deleting parts of the track because there are actually a lot of freight lines, and I don&rsquo;t need to show that to the kids. The most interesting freight line goes from Dimona to Mishor Rotem, the terminus of the eleven-mile conveyor belt that brings potash up from the Dead Sea. I&rsquo;m not kidding! There&rsquo;s an eleven-mile long conveyor belt by the Dead Sea in Israel! Look it up if you don&rsquo;t believe me! I also removed the inactive Jerusalem/Malha line. It&rsquo;s been unused since 2020.
                </li>
                <li>
                  <b>Mountains.</b> Only one of which is a real mountain: Mount Hermon. The other is actually a mesa or &ldquo;
                  <a
                    href="https://youtu.be/6GAbc5uQXJo?si=VQ1uM-sUeGdCEE6v&t=13"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 transition-colors"
                  >
                    horst
                  </a>
                  &rdquo;: Masada. They both have cable cars,{' '}
                  <a
                    href="https://youtu.be/6GAbc5uQXJo?si=VQ1uM-sUeGdCEE6v&t=13"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 transition-colors"
                  >
                    of course
                  </a>
                  , because if there&rsquo;s one thing Israelis love building, it&rsquo;s cable cars!
                </li>
                <li>
                  <b>Places.</b> I have fifteen places marked: Jerusalem, Beer Sheva (&ldquo;the capital of the Negev&rdquo;), Haifa, Tel Aviv, Arad, Ein Gedi, Tiberias, Safed, Eilat, Sderot, Mitzpe Ramon, Netanya, Rosh HaNikra, Caesarea, Ashdod. I started with the main heavy hitters and filled in around where I had space. Arad is special to me because I studied Hebrew there for 9 months, in the mid 2000s. Ein Gedi, too; I spent a night at the kibbutz guest house, where I played a late night game of mini golf. The front desk people give you two clubs and two balls and tell you to go find the button to make the lights turn on. It was hard to find the button, and when we pressed it, nothing happened, so we thought maybe it was the wrong button. A few minutes later, the lights slowly came on.
                </li>
                <li>
                  <b>Airports.</b> There are THREE! count &rsquo;em, THREE airports in Israel for passengers! Ben Gurion (TLV), Haifa (HFA), and Ramon (ETM) down in Eilat.
                </li>
                <li>
                  <b>Kosher McDonald&rsquo;s branches.</b> This is a map for diaspora Jewish kids, and what is something that diaspora Jewish kids have a very complex relationship with? McDonald&rsquo;s. From early childhood we are told by the media that it is cool, it is great, it is wonderful to eat at McDonald&rsquo;s. But our religious authorities tell us it&rsquo;s forbidden. But guess what? If you go to Israel, you have a chance to eat KOSHER food at McDonald&rsquo;s! Actually, 84 chances. There are 84 locations, at press time, and they are all on this map. Fun fact: I had to spoof my IP address, in order to get into the Israeli McDonald&rsquo;s web site to make this list!
                </li>
                <li>
                  <b>Superland.</b> You know what else kids are interested in? Theme parks! Especially South Florida kids! So I added the biggest theme park in Israel: Superland, located in Rishon LeTziyon south of Tel Aviv. It has the{' '}
                  <a
                    href="https://rcdb.com/1559.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 transition-colors"
                  >
                    Kumba
                  </a>
                  , a roller coaster that goes nearly 50 mph with five inversions, and up to a height of 109 feet! Superland also has an{' '}
                  <a
                    href="https://commons.wikimedia.org/wiki/File:The_superland%27s_mascot.jpg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 transition-colors"
                  >
                    incredible, delightfully pre-AI mascot
                  </a>
                  .
                </li>
                <li>
                  <b>My Baby.</b> My Baby is another thing entirely. Somebody should write a book about My Baby. It takes up over 450,000 sq ft in a Druze village near Acre. It&rsquo;s right by the recently-built Ahihud Station but if you want to get there by transit, you have to catch the bus from Acre, not Ahihud. It started out as a little store for baby supplies, but somehow grew and grew and grew into… what? Something enormous! It pretends to be an airport, but it&rsquo;s not an airport. But it is airport themed. There is an actual plane that sits on the site, indoors I think. You can have birthday parties inside of the unmoving plane. You can pay for an Economy Class, Premium Class, or First Class birthday party. First Class parties include &ldquo;A giant mascot who joins the entertainment.&rdquo; Besides the plane/birthday party area, there is a mostly-indoor amusement park; a snow play area, including &ldquo;special penguins&rdquo; (?); an indoor zipline; an ice rink that is &ldquo;closed until further notice,&rdquo; although you can sign up for ice hockey lessons right now (?); a full bowling alley; two separate bumper car alleys; an outdoor &ldquo;sling shot&rdquo; that sends you 360 ft into the air; some kind of spherical movie theater thing, that is described as a &ldquo;9D Cinema&rdquo;; an entire shopping mall, which appears to have dozens of toy stores, clothing stores, a huge baby store (of course) and an entire working bike shop; numerous dining options including &ldquo;Moses&rdquo; (a burger joint), &ldquo;Rebar&rdquo; (a very unappetizingly named smoothie shop), and two separate locations of Mr. Corn, which serves corn (in giant bowls, with olives, scallions, and a mysterious, goopy sauce) that it claims it gets from Malaysia, which, if you do some searching around, is not a country that exports corn. (Israel has 37 branches of Mr. Corn.)
                </li>
              </ul>
              <p className="text-base sm:text-md text-stone-700">
                I had to use a lot of AI for this project. Google Gemini did not build the map or create any files for me. Rather, Gemini and I were in a constant, absolutely exhausting, back and forth, in which I took a screenshot of my project window, sent it to Gemini, and said &ldquo;What should I click on next?&rdquo; Gemini said something like: Click on the tiny button that looks like a sleepy mongoose, find the seventh tab on the left, scroll way down in the control view within that window, click on the button that says &ldquo;Check this box to make the labels in your map actually show up where you want them to show up,&rdquo; click OK and press save. And then I can&rsquo;t find the sleepy mongoose button, the seventh tab on the left is actually the third tab, the checkbox isn&rsquo;t where it is supposed to be, and when I finally find the checkbox, all of my labels actually disappear entirely. Also, pressing save does nothing unless you manually tell the program to write &ldquo;scratch layers&rdquo; to disk. If you are working, and the program constantly pushes you in this direction, if you are working in &ldquo;scratch layers,&rdquo; you lose absolutely all of your progress when you quit the program, regardless of how many times you press save.
              </p>
              <p className="text-base sm:text-lg text-stone-700">
                The full QGIS source files are available at the download link, so if you want, you can roll up your sleeves and make your own remix of this! Feel free! Have fun! Don’t use scratch layers!
              </p>
            </header>

            {/* Full-width sharp-edged map SVG artwork */}
            <div className="space-y-6">
              <ZoomableSvgFrame
                src="/mappy.svg"
                alt="Printable vector map of Israel"
              />
              <div>
                <a
                  href="https://drive.google.com/drive/folders/1HeNFRtR-NZzv-U_fDfWZQ7XKAkjikLH0?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-lg sm:text-xl font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 transition-colors"
                >
                  <Download className="w-5 h-5 shrink-0" />
                  <span>Download from Google Drive</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: ISRAEL RAILWAYS ================= */}
        {activeTab === 'railways' && (
          <div className="space-y-8">
            <header className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
                Israel Railways
              </h1>
              <p className="text-base sm:text-lg text-stone-700">
                I wanted to teach my students about the Israel Railways network. I printed out the official map, and started looking at it, and the more I looked, the less I liked. There are a lot of visual mistakes (like badly formed bubbles, or bubbles floating in space). A lot of stations have multiple bubbles that are not connected, so it&rsquo;s hard to even know how many stations you&rsquo;re looking at. The text is really small. There&rsquo;s a redundant line from Haifa to Karmiel that&rsquo;s just unnecessary. Holon Junction is literally in the Mediterranean Sea. It&rsquo;s hard to figure out how to get to one place from another. Station names are really, really, really unnecessarily long. I grew up in New York and when I was young I started reading the MTA subway map, so I knew what to do next: Open up Inkscape, put the offical map in a side window, and build something new from scratch! As ever, this is completely free to everyone. Please remix, reuse, edit, and adapt.
              </p>
            </header>

            {/* Full-width sharp-edged railmap SVG artwork */}
            <div className="space-y-6">
              <ZoomableSvgFrame
                src="/railmap.svg"
                alt="Israel Railways vector diagram"
              />
              <div>
                <a
                  href="https://drive.google.com/drive/folders/1HeNFRtR-NZzv-U_fDfWZQ7XKAkjikLH0?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-xl sm:text-2xl font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 transition-colors"
                >
                  <Download className="w-6 h-6 shrink-0" />
                  <span>Click here to download from Google Drive</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: PLAYS ================= */}
        {activeTab === 'plays' && (
          <div className="space-y-8">
            <header className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
                Plays
              </h1>
              <p className="text-base sm:text-lg text-stone-700">
                I wrote original plays for Hanukkah (our 3rd grade show) and Yom HaAtzmaut (our 4th grade show). I&rsquo;m very proud of both. And you can have them for free!
              </p>
              <p className="text-base sm:text-lg text-stone-700">
                <strong className="font-bold text-stone-900">HANUKKAH SHOW:</strong> I cast the Hellenistic Jews as an easily-swayed cheerleading squad; I added the Judith and Holofernes story, except Judith is a creative, bright young woman (possibly a cell phone hacker) and Holofernes is played by &ldquo;Holo&rdquo;, who is basically Cookie Monster. He stomps around the stage bellowing out: &ldquo;Yayin! G&rsquo;vina! Yayin! G&rsquo;vina!&rdquo; It&rsquo;s nonsense, of course, but there&rsquo;s something intuitive, for an American school, about having the foreigners (the soldiers and Holo) grimacing and bellowing simple words and phrases in Hebrew. There&rsquo;s also a reference to <a href="https://www.youtube.com/watch?v=cUusX1Js6R0" target="_blank" rel="noopener noreferrer" className="font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 transition-colors">this classic sketch</a>*. Did you know I&rsquo;m a Sesame Street fan? <small>(Did you know Bert was played by Frank Oz, the Yoda guy??)**</small>
              </p>
              <p className="text-base sm:text-lg text-stone-700">
                <strong className="font-bold text-stone-900">YOM HAATZMAUT SHOW:</strong> A time travel conceit starring PITA POWER, a character who has a magical time-traveling pita. Jokes include: The difficulty of saying &ldquo;Mesopotamia&rdquo;; &ldquo;Hungary&rdquo; sounds like &ldquo;hungry&rdquo;; Ben-Yehuda worked very, very slowly.
              </p>
            </header>

            <section className="pt-2 flex flex-col items-start gap-4">
              <a
                href="https://docs.google.com/document/d/1hF1XhN8IvBLXhIOxuQvuLbvcdarfdkw2sQoAg2vK47Y/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-xl sm:text-2xl font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 transition-colors"
              >
                <Download className="w-6 h-6 shrink-0" />
                <span>Download Hanukkah show</span>
              </a>
              <a
                href="https://docs.google.com/document/d/1pij0My5zrw9E_rY8Kq8n1B-LR-4Q0_ot96VY5g-5xOY/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-xl sm:text-2xl font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 transition-colors"
              >
                <Download className="w-6 h-6 shrink-0" />
                <span>Download Yom HaAtzmaut show</span>
              </a>
            </section>
              <p className="text-base sm:text-sm text-stone-700">
                *<b><a href="https://www.youtube.com/watch?v=cUusX1Js6R0" target="_blank" rel="noopener noreferrer" className="font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 transition-colors">Sesame Street: Bert And Ernie&rsquo;s Fish Call</a></b> is one of the greatest skits in media because it is at once immediately comprehensible and funny to a tiny child (I remember laughing when I was 5 years old, watching it for the first time) and also extremely strange to an adult, but also still funny. Ernie calls for fish and receives non-anthropomorphic, voiceless fish. Perfect for cooking. You can eat that kind of fish for dinner without guilt. Bert, on the other hand, calls for fish, and receives a fish, but his fish has golf ball eyes, an articulated mouth, and a comical voice. This is, yes, a fish (or maybe a small shark, but the point stands), but not a fish that can be eaten, for this fish appears to have a soul. Attempting to eat it would probably get Bert banned from the CTW studios, for moral turpitude! It&rsquo;s funny to a tiny child, it&rsquo;s also funny to an adult, but it&rsquo;s also really weird if you think about it! That&rsquo;s why it&rsquo;s so good! It is not, however, the greatest Bert and Ernie skit. That title goes to <a href="https://www.youtube.com/watch?v=JAuP6FxCOeM" target="_blank" rel="noopener noreferrer" className="font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 transition-colors">Ernie and Bert&rsquo;s TV Chair Battle</a>, the greatest 4 minutes in the history of entertainment. Bert (Frank Oz, the Yoda guy!) says: &ldquo;That&rsquo;s the way you&rsquo;re gonna be about it – that&rsquo;s the way you&rsquo;re gonna BE about it, Ernie – all right…&rdquo;; Ernie says, &ldquo;Oh ho. Oh ho, Bert!&rdquo;; &ldquo;Go away, go watch the window, good boy.&rdquo;; Bert imitating Ernie&rsquo;s laugh; Bert resorting to physical violence; Herry Monster, a literal blue monster, runs in from off screen, which neither Bert nor Ernie finds to be noteworthy at all, but the (nonexistent) elephant and (nonexistent) dinosaur ARE things that need to be investigated; Jerry Nelson&rsquo;s immortal &ldquo;Ha ha on you guys&rdquo;; Ernie&rsquo;s dawning realization that the fundamental problem is not the width of the chair at all, because two roommates and a monster actually can fit on it comfortably, but actually, the completely boring show that is on the TV screen; the amazing running joke of Bert&rsquo;s terrible taste in music, which is actually the last joke in the whole scene.
              </p>
              <p className="text-base sm:text-sm text-stone-700">
                **Not only did Frank Oz, the Yoda guy, perform the best role of his lifetime as Bert in Sesame Street, but also Mark Hamill, the Luke Skywalker guy, performed the best role of his lifetime in Batman: The Animated Series (and following spinoffs, movies, and video games) as The Joker. Both the Yoda guy and the Luke Skywalker guy performed much better roles voicing ornery, eccentric characters in children&rsquo;s media, but people mostly know them for Star Wars.
              </p>
        
          </div>
        )}

        {/* ================= TAB 6: HIP-HOP MIXTAPE ================= */}
        {activeTab === 'mixtape' && (
          <div className="space-y-8">
            <header className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
                Now That&rsquo;s What I Call T.A.N.A.C.H.
              </h1>
              <p className="text-base sm:text-lg text-stone-700">
                I&rsquo;m working on an educational hip-hop mixtape, kind of like, but actually completely different from, but also yes, kind of like, Hamilton. Except I’m going to mix and record everything entirely myself. The tracks will be from classic 1990s and 2000s songs. There will be a lot of in-jokes for hip hop heads, but also, it will be completely educational and rooted in the Torah and traditional exegesis. I’ll give away a few of my ideas for now:
              </p>
              <ul><li>I think T.A.N.A.C.H. stands for: "Theological Anthems: New Arrangements & Classic Hits". I will generate a little marketing campaign designed to look like the original NOW music compilation CD commercial.</li>
              <li>The in-universe producer of the whole disc is Conductor Miriam, a reference to Conductor Williams. The Torah says Miriam plays percussion, which in the hip-hop sphere, is analogous to music production.</li>
              <li>Young Avram and Sarai have a punk band called “Smashing Idols”. The title is based on Smashing Pumpkins, of course, but the musical track is actually Green Day ("Longview").</li>
              <li>Og, King of Bashan makes an appearance. So does Bilam’s female donkey ("The Aton"),</li>
              </ul>
            </header>
                          <p className="text-base sm:text-lg text-stone-700">
                That’s it for now! Check back later for more. I might actually make the music next summer.
              </p>

          </div>
        )}
      </article>
    </div>
  );
};
