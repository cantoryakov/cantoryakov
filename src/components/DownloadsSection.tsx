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
              <ZoomableSvgFrame
                src="/readme.svg"
                alt="Akoderf font guide and specimen"
                framed={false}
              />
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
 Do you have any idea how hard it is to make a map from scratch?! You have to use a program called <a href="http://qgis.org">QGIS</a>. Shout out to Gary Sherman for his hard work, but he did not create something that was designed for ease of use. Anyway, I managed to make this thing. This map has:
 <ul><li><b>National borders.</b> You’d think that would be simple, but it’s not! And never mind the obvious thing, that I won’t mention here. But there’s also the UNDOF Zone. Publicly available world outline databases include the UNDOF Zone, a small area of land east of the Golan Heights, as part of Israel, but Israel doesn’t claim it, and never has. It’s just a wrong thing on worldwide mapping servers. I had to manually fix the border of the Golan Heights and Syria! By dragging points around on my screen!!!</li>
 <li>Bodies of water. Including some of the smaller rivers. This is surprisingly complicated, too, because a lot of "rivers" you see on maps of Israel are actually wadis, meaning, they're usually dry. I don't want to show things that are dry so I had to do some research on which rivers are actually wet 12 months a year!</li>
 <li>a</li>
 <li>a</li>
 <li>a</li>
 
 
 </ul>
              </p>
              <p className="text-base sm:text-md text-stone-700">
                I had to use a lot of AI for this project. Google Gemini did not build the map or create any files for me. Rather, Gemini and I were in a constant, absolutely exhausting, back and forth, in which I took a screenshot of my project window, sent it to Gemini, and said &ldquo;What should I click on next?&rdquo; Gemini said something like, click on the tiny button that looks like a sleepy mongoose, find the seventh tab on the left, scroll way down in the control view within that window, click on the button that says &ldquo;Check this box to make the labels in your map actually show up where you want them to show up,&rdquo; click OK and press save. And then I can&rsquo;t find the sleepy mongoose button, the seventh tab on the left is actually the third tab, the checkbox isn&rsquo;t where it is supposed to be, and when I finally find the checkbox, all of my labels actually disappear entirely. Also, pressing save does nothing unless you manually tell the program to write &ldquo;scratch layers&rdquo; to disk. If you are working, and the program constantly pushes you in this direction, if you are working in &ldquo;scratch layers,&rdquo; you lose absolutely all of your progress when you quit the program, regardless of how many times you press save.
              </p>
              <p className="text-base sm:text-lg text-stone-700">
                In case you&rsquo;re wondering, I know Arad isn&rsquo;t usually a city taught to little kids, but I lived there for 8 months one time, so it&rsquo;s on my map! The full QGIS source files are available at the download link, so if you want, you can roll up your sleeves and make your own remix of this! Feel free! Have fun!
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
              <p className="text-base sm:text-md text-stone-700">
                *<b>Sesame Street: Bert And Ernie&rsquo;s Fish Call</b> is one of the greatest skits in media because it is at once immediately comprehensible and funny to a tiny child (I remember laughing when I was 5 years old, watching it for the first time) and also extremely strange to an adult, but also still funny. Ernie calls for fish and receives non-anthropomorphic, voiceless fish. Perfect for cooking. You can eat that kind of fish for dinner without guilt. Bert, on the other hand, calls for fish, and receives a fish, but his fish has golf ball eyes, an articulated mouth, and a comical voice. This is, yes, a fish (or maybe a small shark, but the point stands), but not a fish that can be eaten, for this fish appears to have a soul. Attempting to eat it would probably get Bert banned from the CTW studios, for moral turpitude! It&rsquo;s funny to a tiny child, it&rsquo;s also funny to an adult, but it&rsquo;s also really weird if you think about it! That&rsquo;s why it&rsquo;s so good! It is not, however, the greatest Bert and Ernie skit. <small>That title goes to <a href="https://www.youtube.com/watch?v=JAuP6FxCOeM" target="_blank" rel="noopener noreferrer" className="font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4 transition-colors">Ernie and Bert&rsquo;s TV Chair Battle</a>, the greatest 4 minutes in the history of entertainment. Bert (Frank Oz, the Yoda guy!) says: &ldquo;That&rsquo;s the way you&rsquo;re gonna be about it – that&rsquo;s the way you&rsquo;re gonna BE about it, Ernie – all right…&rdquo;; Ernie says, &ldquo;Oh ho. Oh ho, Bert!&rdquo;; &ldquo;Go away, go watch the window, good boy.&rdquo;; Bert imitating Ernie&rsquo;s laugh; Bert resorting to physical violence; Herry Monster, a literal blue monster, runs in from off screen, which neither Bert nor Ernie finds to be noteworthy at all, but the (nonexistent) elephant and (nonexistent) dinosaur ARE things that need to be investigated; Jerry Nelson&rsquo;s immortal &ldquo;Ha ha on you guys&rdquo;; Ernie&rsquo;s dawning realization that the fundamental problem is not the width of the chair at all, because two roommates and a monster actually can fit on it comfortably, but actually, the completely boring show that is on the TV screen; the amazing running joke of Bert&rsquo;s terrible taste in music, which is actually the last joke in the whole scene.</small>
              </p>
              <p className="text-base sm:text-md text-stone-700">
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
                I&rsquo;m working on an educational hip-hop mixtape, kind of like, but actually completely different from, but also yes, kind of like, Hamilton. There will be a lot of in-jokes for hip hop heads, but also, it will be completely educational and rooted in the Torah and traditional exegesis. Stay tuned for further updates!
              </p>
            </header>
          </div>
        )}
      </article>
    </div>
  );
};
