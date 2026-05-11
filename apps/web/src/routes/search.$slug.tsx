import type { components } from "@repo/core";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenCheck, ChevronLeft, Settings, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNetworkState } from "react-use";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { useSearchStream } from "@/modules/search/hooks/use-search-stream";
import { useSearchBySlug } from "@/modules/search/queries/use-search";

type VerseResult = components["schemas"]["VerseResult"];

export const Route = createFileRoute("/search/$slug")({
  component: SearchPage,
});

const STEP_MESSAGES: Record<string, string> = {
  searching_quran: "Searching the Quran…",
  fetching_metadata: "Gathering verse details…",
  ranking: "Preparing your results…",
  pending: "Preparing your search…",
  processing: "Searching the Quran…",
};

function SearchPage() {
  const { slug } = Route.useParams();
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [pendingSaveAyah, setPendingSaveAyah] = useState<string | null>(null);
  const offlineToastShownRef = useRef(false);
  const network = useNetworkState();
  const online = network.online ?? true;
  const wasCacheHit =
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(`search-cache-hit-${slug}`) === "1";

  /* Primary: SSE real-time stream */
  const stream = useSearchStream(slug, !wasCacheHit);

  /*
   * Fallback polling:
   * - Only enabled when SSE connection is lost (not running alongside a healthy stream)
   * - Stops once complete/failed
   */
  const isStreamDone =
    stream.status === "complete" || stream.status === "failed";
  const pollEnabled =
    wasCacheHit ||
    stream.connectionLost ||
    (stream.status === "idle" && !isStreamDone);
  const query = useSearchBySlug(slug, pollEnabled);

  /* Source of truth: prefer SSE results when complete, else polling data */
  const searchData = query.data;
  const topic = searchData?.topic ?? "";

  const currentStatus =
    stream.status !== "idle" && stream.status !== "pending"
      ? stream.status
      : (searchData?.status ?? "pending");

  /* Prefer SSE payload; if complete but stream omitted results, use GET body */
  const results =
    stream.results && stream.results.length > 0
      ? stream.results
      : (searchData?.results ?? null);

  /* Connection lost + polling error = definitive failure */
  const isDefinitelyFailed =
    currentStatus === "failed" || (stream.connectionLost && query.isError);

  const isLoading =
    !isDefinitelyFailed &&
    currentStatus !== "complete" &&
    currentStatus !== "failed";

  const stepMessage =
    STEP_MESSAGES[stream.step ?? currentStatus] ?? "Searching…";

  /* One-time toast per slug when offline with cached results */
  useEffect(() => {
    const sessionKey = `offline-toast-${slug}`;
    if (online) {
      offlineToastShownRef.current = false;
      return;
    }
    if (
      query.isSuccess &&
      !offlineToastShownRef.current &&
      !sessionStorage.getItem(sessionKey)
    ) {
      offlineToastShownRef.current = true;
      sessionStorage.setItem(sessionKey, "1");
      toast.message("You're offline — viewing cached results");
    }
  }, [online, query.isSuccess, slug]);

  function handleSaveVerse(ayahKey: string) {
    const isLoggedIn = Boolean(localStorage.getItem("access_token"));
    if (!isLoggedIn) {
      setPendingSaveAyah(ayahKey);
      setLoginSheetOpen(true);
    }
    /* If logged in, VerseCard handles the save action directly */
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <div className="relative flex flex-col gap-y-2 md:flex-row md:justify-center">
          <Button
            className="left-0 self-start md:absolute"
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link to="/">
                <ChevronLeft />
                New Search
              </Link>
            }
          />

          <h1 className="relative">
            Showing <span className="font-bold">5 results </span>of:
          </h1>
        </div>

        <span className="text-balance text-center font-medium font-sans text-2xl italic">
          “I needed some guide to always be grateful towards that I already
          have”
        </span>
      </section>

      <section className="relative mt-8">
        <div className="pointer-events-none absolute inset-x-3 top-0 h-12 bg-linear-to-b from-card to-transparent sm:inset-x-6" />
        <div className="pointer-events-none absolute inset-x-3 bottom-0 h-14 bg-linear-to-t from-card to-transparent sm:inset-x-6" />

        <Card className="max-h-[60svh] overflow-y-auto py-8 font-sans sm:px-7">
          <CardHeader className="flex flex-col items-center gap-4 italic">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <h1 className="font-medium text-xl">Surah 79 (An-Nazi'at)</h1>

              <span className="rounded-3xl border border-border bg-secondary px-3 py-1 font-medium">
                79 : 8
              </span>
            </div>

            <a
              href="https://quran.com/79/8"
              target="_blank"
              rel="noreferrer noopener"
              className="text-center text-secondary-foreground underline transition-all hover:text-muted-foreground"
            >
              quran.com reference
            </a>
          </CardHeader>

          <CardContent className="space-y-8 pt-4">
            <Separator />
            <div className="flex flex-col items-stretch gap-4 text-center">
              <span className="text-[32px]">قلوب يومئذ واجفة</span>
              <span>
                “(Some) hearts that Day will shake with fear and anxiety.”
              </span>

              <div className="flex flex-col flex-wrap justify-center gap-3 sm:flex-row">
                <Button variant="outline" size="lg">
                  Share
                  <Share2 />
                </Button>
                <Button variant="outline" size="lg">
                  Save Verse
                  <BookOpenCheck />
                </Button>
                <Button variant="outline" size="lg">
                  Settings
                  <Settings />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-1 text-xs lg:text-sm">
              <h2 className="font-medium text-muted-foreground">
                Why this verse
              </h2>
              <p className="leading-relaxed">
                The verse describes hearts trembling with fear and anxiety on
                the Day of Judgment, directly illustrating the experience of
                anxiety.
              </p>
            </div>

            <Separator />

            <div className="space-y-1 text-xs lg:text-sm">
              <h2 className="font-medium text-muted-foreground">Tafsir</h2>
              <p className="leading-6 tracking-[0.18px]">
                The Tafsir of Surat An-Nazi`at (Chapter - 79) Which was revealed
                in Makkah بِسْمِ اللَّهِ الرَّحْمَـنِ الرَّحِيمِ In the Name of Allah, the Most
                Gracious, the Most Merciful. Swearing by Five Characteristics
                that the Day of Judgement will occur Ibn Mas`ud, Ibn `Abbas,
                Masruq, Sa`id bin Jubayr, Abu Salih, Abu Ad-Duha and As-Suddi
                all said, وَالنَّـزِعَـتِ غَرْقاً (By those who pull out, drowning.)
                "These are the angels who remove the souls from the Children of
                Adam." Among them are those whose souls are removed by the
                angels with difficulty, as if he is being drowned during its
                removal. There are those people whose souls the angels remove
                with ease, as if they were unraveling him (i.e., his soul from
                him) due to their briskness. This is the meaning of Allah's
                statement, وَالنَّـشِطَـتِ نَشْطاً (By those who free briskly.) This has
                been mentioned by Ibn `Abbas. In reference to Allah's statement,
                وَالسَّـبِحَـتِ سَبْحاً (And by the swimmers, swimming.) Ibn Mas`ud said,
                "They are the angels." Similar statements have been reported
                from `Ali, Mujahid, Sa`id bin Jubayr, and Abu Salih. Concerning
                Allah's statement, فَالسَّـبِقَـتِ سَبْقاً (And by the racers, racing.)
                It has been narrated from `Ali, Masruq, Mujahid, Abu Salih, and
                Al-Hasan Al-Basri that this means the angels. Then Allah says,
                فَالْمُدَبِّرَتِ أَمْراً (And by those who arrange affairs.) `Ali, Mujahid,
                `Ata', Abu Salih, Al-Hasan, Qatadah, Ar-Rabi` bin Anas, and
                As-Suddi all said, "They are the angels." Al-Hasan added, "They
                control the affairs from the heaven to the earth, meaning by the
                command of their Lord, the Mighty and Majestic." The Description
                of the Day of Judgement, the People, and what They will say Then
                Allah says, يَوْمَ تَرْجُفُ الرَّاجِفَةُ - تَتْبَعُهَا الرَّادِفَةُ (On the Day the
                Rajifah shakes, followed by the Radifah.) Ibn `Abbas said,
                "These are the two blasts (of the Trumpet) -- the first and the
                second." Mujahid, Al-Hasan, Qatadah, Ad-Dahhak and others have
                made similar statements. It has been reported from Mujahid that
                he said, "In reference to the first, it is the statement of
                Allah, يَوْمَ تَرْجُفُ الرَّاجِفَةُ (On the Day the Rajifah shakes,) This is
                similar to Allah's statement, يَوْمَ تَرْجُفُ الاٌّرْضُ وَالْجِبَالُ (On the Day
                the earth and the mountains shake.) (73:14) The second is
                Ar-Radifah, and it is like the Allah's statement, وَحُمِلَتِ الاٌّرْضُ
                وَالْجِبَالُ فَدُكَّتَا دَكَّةً وَحِدَةً (And the earth and mountains shall be
                removed from their places, and crushed with a single crushing.)
                (69:14)" Concerning Allah's statement, قُلُوبٌ يَوْمَئِذٍ وَاجِفَةٌ (Hearts
                that Day will tremble.) Ibn `Abbas said, "This means afraid."
                Mujahid and Qatadah also said this. أَبْصَـرُهَا خَـشِعَةٌ (Their vision
                humiliated.) meaning, the eyes of the people. It means that the
                eyes will be lowly and disgraced from what they will witness of
                terrors. Allah then says, يَقُولُونَ أَءِنَّا لَمَرْدُودُونَ فِى الْحَـفِرَةِ (They
                say: "Shall we indeed be brought back from Al-Hafirah") meaning,
                the idolators of the Quraysh and whoever rejects the Hereafter
                as they did. They consider the occurrence of the resurrection
                after being placed in Al-Hafirah -- which are the graves -- as
                something farfetched. This has been said by Mujahid. They feel
                that this is something impossible after the destruction of their
                physical bodies and the disintegration of their bones and their
                decaying. Thus, Allah says, أَءِذَا كُنَّا عِظَـٰمًا نَّخِرَةً (Even after we
                are bones Nakhirah) It has also been recited: (نَاخِرَةً) (Nakhirah)
                Ibn `Abbas, Mujahid and Qatadah, all said, "This means decayed."
                Ibn `Abbas said, "It is the bone when it has decayed and air
                enters into it." Concerning their saying, تِلْكَ إِذاً كَرَّةٌ خَـسِرَةٌ (It
                would in that case be a return with loss.) (79:12) Muhammad bin
                Ka`b said that the Quraysh said, "If Allah brings us back to
                life after we die, then surely we will be losers." Allah then
                says, فَإِنَّمَا هِىَ زَجْرَةٌ وَحِدَةٌ - فَإِذَا هُم بِالسَّاهِرَةِ (But it will be only
                a single Zajrah. When behold, they are at As-Sahirah.) meaning,
                this is a matter that is from Allah that will not occur twice,
                nor will there be any opportunity to affirm it or verify it. The
                people will be standing and looking. This will be when Allah
                commands the angel Israfil to blow into the Sur, which will be
                the blowing of the resurrection. At that time the first people
                and the last people will all be standing before their Lord
                looking. This is as Allah says, يَوْمَ يَدْعُوكُمْ فَتَسْتَجِيبُونَ بِحَمْدِهِ
                وَتَظُنُّونَ إِن لَّبِثْتُمْ إِلاَّ قَلِيلاً (On the Day when He will call you, and
                you will answer with His praise and obedience, and you will
                think that you have stayed but a little while!) (17:52) Allah
                has also said, وَمَآ أَمْرُنَآ إِلاَّ وَحِدَةٌ كَلَمْحٍ بِالْبَصَرِ (And our
                commandment is but one as the twinkling of an eye.) (54:50)
                Allah also says, وَمَآ أَمْرُ السَّاعَةِ إِلاَّ كَلَمْحِ الْبَصَرِ أَوْ هُوَ أَقْرَبُ (And
                the matter of the Hour is not but as a twinkling of the eye, or
                even nearer.) (16:77) Allah then says, فَإِذَا هُم بِالسَّاهِرَةِ (When
                behold, they are at As-Sahirah.) Ibn `Abbas said, "As-Sahirah
                means the entire earth." Sa`id bin Jubayr, Qatadah and Abu Salih
                have all said this as well. `Ikrimah, Al-Hasan, Ad-Dahhak, and
                Ibn Zayd have all said, "As-Sahirah means the face of the
                earth." Mujahid said, "They will be at its (the earth's) lowest
                part, and they will be brought out to highest part." Then he
                said, "As-Sahirah is a level place." Ar-Rabi` bin Anas said,
                فَإِذَا هُم بِالسَّاهِرَةِ (When behold, they are at As-Sahirah.) "Allah
                says, يَوْمَ تُبَدَّلُ الاٌّرْضُ غَيْرَ الاٌّرْضِ وَالسَّمَـوَتُ وَبَرَزُواْ للَّهِ الْوَاحِدِ الْقَهَّارِ
                (On the Day when the earth will be changed to another earth and
                so will be the heavens, and they will appear before Allah, the
                One, the Irresistible.) (14:48) and He says, وَيَسْـَلُونَكَ عَنِ الْجِبَالِ
                فَقُلْ يَنسِفُهَا رَبِّى نَسْفاً - فَيَذَرُهَا قَاعاً صَفْصَفاً - لاَّ تَرَى فِيهَا عِوَجاً وَلا
                أَمْتاً (And they ask you concerning the mountains: say, "My Lord
                will blast them and scatter them as particles of dust. Then He
                shall leave them as a level smooth plain.You will see therein
                nothing crooked or curved.) (20:105-107) and Allah says, " وَيَوْمَ
                نُسَيِّرُ الْجِبَالَ وَتَرَى الاٌّرْضَ بَارِزَةً (And the Day We shall cause the
                mountains to pass away, and you will see the earth as a leveled
                plain.) (18:47) and the earth will be brought forth which will
                have mountains upon it, and it will not be considered from this
                earth (of this life). It will be an earth that no sin will be
                performed on it, nor will any blood be shed upon it."
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">5</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </section>
    </>
  );
}
