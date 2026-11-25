import type { ReactNode } from "react";
import SeoContent, { JsonLd, type SeoFaq, type SeoLink, type SeoSection } from "@/components/SeoContent";

// Search content for the free tool pages: a crawlable explainer + FAQ under the
// tool, plus WebApplication, FAQPage and BreadcrumbList structured data so the
// pages can show up as rich results. Same pattern as the Metronome page.
// No "use client" — renders inside the client tool pages too.

const SITE = "https://www.influanto.com";

interface ToolEntry {
  name: string; // breadcrumb + app name
  appName: string;
  description: string; // WebApplication description
  category?: string;
  sections?: SeoSection[];
  faqs: SeoFaq[];
  related: SeoLink[];
}

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="link link-primary">{children}</a>
);

const steps = (items: ReactNode[]) => (
  <ol className="list-decimal pl-6 space-y-1">{items.map((it, i) => <li key={i}>{it}</li>)}</ol>
);

const ALL_TOOLS: SeoLink = { href: "/tools", label: "All free music tools" };

export const TOOL_SEO: Record<string, ToolEntry> = {
  "LUFS-Meter": {
    name: "LUFS Meter",
    appName: "Influanto LUFS Meter",
    description: "Free online LUFS meter: measures integrated, short-term and momentary loudness, loudness range (LRA) and true peak per ITU-R BS.1770-4 / EBU R128, and shows how Spotify, Apple Music and YouTube will normalize a track. Runs in the browser; files are never uploaded.",
    sections: [
      {
        heading: "How to Check the LUFS of a Song",
        body: steps([
          "Drop a WAV, MP3, AIFF, FLAC or M4A file onto the meter, or click to choose one.",
          "Read the integrated LUFS: that's the number streaming services use to normalize your track.",
          "Switch between short-term and momentary loudness on the graph to find the loudest and quietest sections, and click the graph to listen there.",
          "Check the streaming table to see how much Spotify, Apple Music and YouTube will turn the track down, and whether the true peak is too hot.",
        ]),
      },
      {
        heading: "What LUFS Should I Master To?",
        body: (
          <p>
            There&apos;s no single right number. Spotify and YouTube normalize to about -14 LUFS and Apple Music to about -16 LUFS, so a master
            louder than that just gets turned down. Many pop, hip hop and EDM masters still land between -9 and -6 LUFS integrated because
            that&apos;s the sound of the genre, while acoustic and classical music often sits around -16 to -20. Keep the true peak at or below
            -1 dBTP so the track doesn&apos;t distort after MP3 or AAC encoding. Need the tempo or key for your session notes too? Try the{" "}
            <A href="/BPM-Calculator">BPM calculator</A> and <A href="/Key-Finder">key finder</A>.
          </p>
        ),
      },
    ],
    faqs: [
      { q: "Is this LUFS meter free?", a: "Yes. The Influanto LUFS meter is free with no sign-up, and there's no limit on how many songs you can check." },
      { q: "Is my song uploaded anywhere?", a: "No. The audio is decoded and measured in your browser, so the file never leaves your device. That makes it safe for unreleased masters." },
      { q: "What is the difference between integrated, short-term and momentary LUFS?", a: "Integrated LUFS is the average loudness of the whole song and is what streaming services normalize to. Short-term loudness is measured over a 3-second window and momentary over 400 milliseconds, so they show how the loudness moves through the song." },
      { q: "What LUFS does Spotify use?", a: "Spotify normalizes to about -14 LUFS integrated by default (listeners can choose -11 or -19). Tracks louder than -14 are turned down; quieter tracks are only turned up if there's enough peak headroom." },
      { q: "What is true peak and why does it matter?", a: "True peak estimates the real peak level between digital samples. A track can read below 0 dBFS on a normal peak meter but still clip after MP3 or AAC encoding. Keeping true peak at or below -1 dBTP is a common safe target for streaming." },
      { q: "What is loudness range (LRA)?", a: "Loudness range measures how much the loudness varies across the song, in LU. Heavily compressed masters have a low LRA (often under 6 LU); dynamic music like jazz, film scores and classical has a higher one." },
    ],
    related: [
      { href: "/WAV-to-MP3", label: "WAV to MP3 converter" },
      { href: "/Metadata-Editor", label: "Music metadata editor" },
      { href: "/Key-Finder", label: "Song key finder" },
      ALL_TOOLS,
    ],
  },

  "WAV-to-MP3": {
    name: "WAV to MP3 Converter",
    appName: "Influanto WAV to MP3 Converter",
    description: "Free WAV to MP3 converter at 128, 192, 256 or 320 kbps. Converts several WAV, AIFF or FLAC files at once, in the browser, so music is never uploaded.",
    sections: [
      {
        heading: "How to Convert WAV to MP3",
        body: steps([
          "Pick a bitrate: 320 kbps for the best quality, or 256, 192 or 128 kbps for smaller files.",
          "Drop one or more WAV files (AIFF and FLAC work too) onto the converter.",
          "Download each MP3 as soon as it's done. Nothing is uploaded, so even big files convert quickly.",
        ]),
      },
    ],
    faqs: [
      { q: "Is this WAV to MP3 converter free?", a: "Yes. It's free with no sign-up, no watermark and no limit on the number of files." },
      { q: "Are my files uploaded to a server?", a: "No. The conversion runs in your browser, so your songs never leave your device. That makes it safe for unreleased music and demos." },
      { q: "What is the best bitrate for MP3?", a: "320 kbps is the highest MP3 quality and the best choice for sending songs, demos and DJ sets. 192 or 256 kbps still sound good at smaller sizes, and 128 kbps is fine for voice memos and previews." },
      { q: "Can I convert several WAV files at once?", a: "Yes. Drop as many files as you like and each one converts and gets its own download button." },
      { q: "Will converting WAV to MP3 lower the quality?", a: "Yes, a little: MP3 is a lossy format, so some detail is removed to make the file smaller. At 320 kbps the difference is hard to hear. Keep your WAV as the master, since converting an MP3 back to WAV won't restore the lost quality." },
      { q: "Should I upload WAV or MP3 to streaming services?", a: "Upload WAV (16-bit or 24-bit) to your distributor. Streaming services make their own compressed copies, so starting from an MP3 means the song gets compressed twice." },
    ],
    related: [
      { href: "/LUFS-Meter", label: "LUFS meter" },
      { href: "/Metadata-Editor", label: "MP3 tag editor" },
      { href: "/MP4-to-MOV", label: "MP4 to MOV converter" },
      ALL_TOOLS,
    ],
  },

  "MP4-to-MOV": {
    name: "MP4 to MOV Converter",
    appName: "Influanto MP4 to MOV Converter",
    description: "Free MP4 to MOV converter for Final Cut Pro, iMovie and QuickTime. Remuxes the video without re-encoding, so there's no quality loss, and runs in the browser with no upload.",
    sections: [
      {
        heading: "How to Convert MP4 to MOV",
        body: steps([
          "Drop one or more MP4 or M4V videos onto the converter.",
          "The video and audio streams are copied into a QuickTime MOV container as they are, usually in a few seconds.",
          "Download the MOV and open it in Final Cut Pro, iMovie or QuickTime Player.",
        ]),
      },
    ],
    faqs: [
      { q: "Is this MP4 to MOV converter free?", a: "Yes. It's free with no sign-up, no watermark and no file size limit beyond what your device's memory can handle." },
      { q: "Does converting MP4 to MOV lose quality?", a: "No. The converter doesn't re-encode anything; it moves the existing video and audio into a MOV container, so the result is bit-for-bit the same picture and sound." },
      { q: "Are my videos uploaded?", a: "No. Everything happens in your browser, so your videos never leave your device, and large files don't have to wait on an upload." },
      { q: "Why won't my MOV open in Final Cut Pro or QuickTime?", a: "QuickTime and Final Cut can't play some codecs, such as VP9 or AV1, inside a MOV. The converter warns you when a video uses one; re-export that video as H.264 or HEVC and convert it again." },
      { q: "What's the difference between MP4 and MOV?", a: "Both are containers that hold video and audio streams. MP4 is the universal standard for the web and phones; MOV is Apple's QuickTime format, which some Mac editing apps and workflows prefer." },
    ],
    related: [
      { href: "/WAV-to-MP3", label: "WAV to MP3 converter" },
      { href: "/Image-Privacy", label: "Remove photo location data" },
      ALL_TOOLS,
    ],
  },

  "Image-Privacy": {
    name: "Image Privacy Cleaner",
    appName: "Influanto Image Privacy Cleaner",
    description: "Free tool to view, edit or remove EXIF metadata and GPS location from JPEG photos before posting them online. Runs in the browser.",
    sections: [
      {
        heading: "How to Remove Location Data From a Photo",
        body: steps([
          "Upload a JPEG photo.",
          "See what metadata it carries: GPS location, camera model, date taken and more.",
          "Remove the location and camera data, or edit it, then download the cleaned photo.",
        ]),
      },
      {
        heading: "Why Remove EXIF Data Before Posting?",
        body: (
          <p>
            Phones save the exact GPS coordinates where a photo was taken, along with the device and the time. If you share the original file
            (by email, in a press kit, on a website or a forum), anyone can read that data, including where you live or record. Cleaning photos
            first is especially worth it for artists sharing behind-the-scenes shots or <A href="/epk">EPK</A> photos.
          </p>
        ),
      },
    ],
    faqs: [
      { q: "Is this EXIF remover free?", a: "Yes. It's free with no sign-up." },
      { q: "Does Instagram remove location data from photos?", a: "Most big social apps strip EXIF data when you upload, but files sent by email, messaging apps that keep the original, cloud links, websites and press kits usually keep it. Cleaning the photo yourself means you don't have to rely on each platform." },
      { q: "Which image formats are supported?", a: "JPEG photos, which is the format most phones and cameras save and where EXIF and GPS data is stored." },
      { q: "Does removing metadata change the photo's quality?", a: "No. Only the hidden metadata is changed; the picture itself stays the same." },
    ],
    related: [
      { href: "/Metadata-Editor", label: "Music metadata editor" },
      { href: "/MP4-to-MOV", label: "MP4 to MOV converter" },
      ALL_TOOLS,
    ],
  },

  "Metadata-Editor": {
    name: "Music Metadata Editor",
    appName: "Influanto Music Metadata Editor",
    description: "Free online music metadata editor: edit MP3 and WAV tags like title, artist, album, year, genre and cover art in the browser, then download the tagged file.",
    sections: [
      {
        heading: "How to Edit MP3 Metadata",
        body: steps([
          "Upload an MP3 or WAV file.",
          "Edit the title, artist, album and the other tags, and add cover art (MP3 only).",
          "Download the tagged file. It's ready to send to DJs, collaborators, blogs or playlist curators.",
        ]),
      },
      {
        heading: "Why Tag Your Music Before Sending It?",
        body: (
          <p>
            A file named &quot;final_v7_master.mp3&quot; with no artist or title is easy to lose in someone&apos;s downloads folder. Tagged files
            show your name, the song title and your artwork in every music app and DJ library. Converting from WAV first? Use the{" "}
            <A href="/WAV-to-MP3">WAV to MP3 converter</A>, then tag the MP3 here.
          </p>
        ),
      },
    ],
    faqs: [
      { q: "Is this MP3 tag editor free?", a: "Yes. It's free with no sign-up." },
      { q: "Can I add album art to an MP3?", a: "Yes. Upload an image and it's embedded as the MP3's front cover, so it shows up in music players." },
      { q: "Can I edit WAV metadata?", a: "Yes, you can edit WAV text tags like title and artist. Cover art isn't supported in WAV files, so use an MP3 if you need artwork embedded." },
      { q: "Do distributors use the metadata in my file?", a: "No. Distributors like DistroKid or TuneCore use the details you enter in their upload form. Embedded tags matter for files you send directly: to DJs, press, curators and collaborators." },
    ],
    related: [
      { href: "/WAV-to-MP3", label: "WAV to MP3 converter" },
      { href: "/LUFS-Meter", label: "LUFS meter" },
      { href: "/Image-Privacy", label: "Image privacy cleaner" },
      ALL_TOOLS,
    ],
  },

  "Tuner": {
    name: "Chromatic Tuner",
    appName: "Influanto Online Chromatic Tuner",
    description: "Free online chromatic tuner that uses your microphone to tune guitar, bass, ukulele, violin, voice or any instrument to A440, showing the note and how many cents sharp or flat it is.",
    sections: [
      {
        heading: "How to Use the Online Tuner",
        body: steps([
          "Press start and allow microphone access.",
          "Play one string or note at a time, letting it ring.",
          "Tune up if the needle is flat (left) and down if it's sharp (right), until it's centered on the note.",
        ]),
      },
      {
        heading: "Standard Tunings",
        body: (
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Guitar (standard):</strong> E A D G B E, from the thickest string to the thinnest.</li>
            <li><strong>Bass (4-string):</strong> E A D G.</li>
            <li><strong>Ukulele:</strong> G C E A.</li>
            <li><strong>Violin:</strong> G D A E.</li>
          </ul>
        ),
      },
    ],
    faqs: [
      { q: "Is this online tuner free?", a: "Yes. The tuner is free, with no app to download and no sign-up." },
      { q: "What instruments can I tune?", a: "Any instrument that plays a steady pitch: guitar, bass, ukulele, violin, cello, wind instruments and your voice. It's a chromatic tuner, so it detects all 12 notes." },
      { q: "What does cents sharp or flat mean?", a: "A cent is one hundredth of a semitone. The tuner shows how many cents your note is above (sharp) or below (flat) the nearest note; within about 5 cents sounds in tune to most listeners." },
      { q: "What reference pitch does the tuner use?", a: "Standard concert pitch, A4 = 440 Hz." },
      { q: "Why isn't the tuner picking up my instrument?", a: "Allow microphone access in your browser, get closer to the mic, play one note at a time and cut background noise. Low bass notes are easier to read from the 12th-fret harmonic." },
    ],
    related: [
      { href: "/Metronome", label: "Online metronome" },
      { href: "/Ear-Training", label: "Ear training" },
      { href: "/Key-Finder", label: "Song key finder" },
      ALL_TOOLS,
    ],
  },

  "Key-Finder": {
    name: "Song Key Finder",
    appName: "Influanto Song Key Finder",
    description: "Free online song key finder: upload a track or listen through the microphone to estimate its musical key and scale (major or minor).",
    sections: [
      {
        heading: "How to Find the Key of a Song",
        body: steps([
          "Upload an audio file, or press the mic button and play the song near your device.",
          "Press Detect Key. The finder analyzes which notes appear most and matches them to a key.",
          "Use the result to pick a scale for your melody, sample or remix, and check the match strength to see how confident it is.",
        ]),
      },
      {
        heading: "Why the Key Matters",
        body: (
          <p>
            Knowing the key lets you write melodies and toplines that fit, choose samples that won&apos;t clash, and mix songs harmonically in a DJ
            set. Pair it with the <A href="/BPM-Calculator">BPM calculator</A> to get the tempo too.
          </p>
        ),
      },
    ],
    faqs: [
      { q: "Is the key finder free?", a: "Yes. It's free with no sign-up." },
      { q: "How accurate is the key finder?", a: "It's an estimate. It works best on songs with clear harmony that stay in one key. Relative major and minor keys (like C major and A minor) share the same notes, so the result can land on either one." },
      { q: "Can I find the key of a song from my microphone?", a: "Yes. Press the mic button, play the song out loud near your device, then press Detect Key." },
      { q: "What does relative major and minor mean?", a: "Every major key has a relative minor that uses the same notes, three semitones lower: C major and A minor, G major and E minor, and so on. Listen to which chord feels like home to decide between them." },
    ],
    related: [
      { href: "/BPM-Calculator", label: "BPM calculator" },
      { href: "/Tuner", label: "Chromatic tuner" },
      { href: "/Synthfluanto", label: "Online synthesizer" },
      ALL_TOOLS,
    ],
  },

  "BPM-Calculator": {
    name: "BPM Calculator",
    appName: "Influanto BPM Calculator",
    description: "Free online BPM calculator: tap along to any song to find its tempo, or upload the audio to estimate its beats per minute.",
    sections: [
      {
        heading: "How to Find the BPM of a Song",
        body: steps([
          "Play the song and tap any key, or click, on every beat.",
          "After a few taps the BPM settles; keep tapping for a more precise reading.",
          "Or upload the audio file and let the calculator estimate the tempo for you.",
        ]),
      },
      {
        heading: "Using the BPM in Your Mix",
        body: (
          <p>
            Once you know the tempo, set your session&apos;s BPM to line up loops and samples, and use the{" "}
            <A href="/Reverb-and-Delay-Calculator">delay and reverb calculator</A> to get effect times that groove with the song. Practicing
            the part? Set the <A href="/Metronome">metronome</A> to the same tempo.
          </p>
        ),
      },
    ],
    faqs: [
      { q: "Is the BPM calculator free?", a: "Yes. It's free with no sign-up." },
      { q: "How does tap tempo work?", a: "It measures the time between your taps and averages it into beats per minute. The more evenly you tap, the more accurate the result." },
      { q: "Why does the BPM show half or double the real tempo?", a: "Songs can feel like they're in half time or double time. If you tap on every other beat you'll get half the BPM; tap on every beat (often the kick and snare together) for the usual tempo." },
      { q: "Can it detect the BPM from an audio file?", a: "Yes. Upload a track to get an estimate. It works best on beat-driven music like hip hop, pop and dance; songs with loose or changing tempos are better tapped." },
    ],
    related: [
      { href: "/Metronome", label: "Online metronome" },
      { href: "/Key-Finder", label: "Song key finder" },
      { href: "/Reverb-and-Delay-Calculator", label: "Delay & reverb calculator" },
      ALL_TOOLS,
    ],
  },

  "Reverb-and-Delay-Calculator": {
    name: "Delay & Reverb Time Calculator",
    appName: "Influanto Delay & Reverb Time Calculator",
    description: "Free delay and reverb time calculator: enter a BPM to get delay times in milliseconds for every note value, plus reverb pre-delay and decay times.",
    sections: [
      {
        heading: "How to Calculate Delay Time From BPM",
        body: (
          <>
            <p>
              One beat (a quarter note) lasts 60,000 ÷ BPM milliseconds. At 120 BPM that&apos;s 500 ms, so an eighth note is 250 ms and a
              half note is 1,000 ms. Dotted notes are 1.5 times as long, and triplets are two thirds as long.
            </p>
            <p>
              Enter your song&apos;s BPM and pick a note value, and the calculator does the math for every division, so your delays and reverb
              tails breathe with the groove instead of smearing it. Don&apos;t know the tempo? Find it with the{" "}
              <A href="/BPM-Calculator">BPM calculator</A>.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      { q: "What is the formula for delay time?", a: "Delay time in milliseconds = 60,000 ÷ BPM for a quarter note. Multiply by 2 for a half note, divide by 2 for an eighth, multiply by 1.5 for a dotted note, and by 2/3 for a triplet." },
      { q: "What is reverb pre-delay?", a: "Pre-delay is the gap between the dry sound and the start of the reverb. Setting it to a short note value keeps vocals and drums clear at the front while the reverb blooms behind them." },
      { q: "How do I set reverb decay to the tempo?", a: "Pick a decay time that ends on a note value, such as a half note or a whole bar, so the tail fades out before the next phrase instead of washing over it." },
      { q: "Is the delay calculator free?", a: "Yes. It's free with no sign-up." },
    ],
    related: [
      { href: "/BPM-Calculator", label: "BPM calculator" },
      { href: "/Metronome", label: "Online metronome" },
      { href: "/LUFS-Meter", label: "LUFS meter" },
      ALL_TOOLS,
    ],
  },

  "Ear-Training": {
    name: "Ear Training",
    appName: "Influanto Ear Training",
    description: "Free online ear training for musicians, producers and singers: pitch matching, interval recognition, chord recognition, and rhythm training.",
    sections: [
      {
        heading: "What You Can Practice",
        body: (
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Pitch matching:</strong> listen to a melody, sing it back and get scored on your accuracy.</li>
            <li><strong>Interval recognition:</strong> identify every interval from a minor 2nd to an octave.</li>
            <li><strong>Chord recognition:</strong> tell major, minor, major 7, minor 7 and dominant 7 chords apart.</li>
            <li><strong>Rhythm training:</strong> rhythm dictation, grooves, tempo, tapping, polyrhythms and beat building.</li>
          </ul>
        ),
      },
    ],
    faqs: [
      { q: "Is this ear training free?", a: "Yes. All the exercises are free in your browser, with no app to download." },
      { q: "How long does it take to train your ear?", a: "Most people notice progress in a few weeks of short daily sessions. Ten minutes a day is more effective than one long session a week." },
      { q: "Is ear training useful for producers?", a: "Yes. Recognizing intervals and chords by ear makes it faster to recreate ideas, find a sample's chords, write melodies that fit and mix with more confidence." },
      { q: "Can I practice singing in tune?", a: "Yes. Pitch matching plays a melody, listens through your microphone while you sing it back, and scores how close you were." },
    ],
    related: [
      { href: "/Tuner", label: "Chromatic tuner" },
      { href: "/Metronome", label: "Online metronome" },
      { href: "/Synthfluanto", label: "Online synthesizer" },
      ALL_TOOLS,
    ],
  },

  "Synthfluanto": {
    name: "Synthfluanto",
    appName: "Synthfluanto Online Synthesizer",
    description: "Free online synthesizer that runs in the browser, with oscillator waveforms, filters, effects, a live waveform view and recording.",
    sections: [
      {
        heading: "A Free Synthesizer in Your Browser",
        body: (
          <p>
            Synthfluanto is a synth you can play right here: choose oscillator waveforms, shape the sound with filters and effects, watch the
            waveform as you play and record your ideas. Play it with your mouse, touchscreen or computer keyboard. Want to know the key of the
            song you&apos;re playing along with? Use the <A href="/Key-Finder">key finder</A>.
          </p>
        ),
      },
    ],
    faqs: [
      { q: "Is Synthfluanto free?", a: "Yes. It's free to play in your browser, with nothing to download or install." },
      { q: "Can I play the synth with my computer keyboard?", a: "Yes. You can play notes with your computer keyboard, a mouse or a touchscreen." },
      { q: "Can I record what I play?", a: "Yes. Use the record button to capture your ideas." },
      { q: "Does it work on phones?", a: "Yes. It runs in modern mobile browsers. Use headphones or speakers for the best sound." },
    ],
    related: [
      { href: "/Ear-Training", label: "Ear training" },
      { href: "/Key-Finder", label: "Song key finder" },
      { href: "/Metronome", label: "Online metronome" },
      ALL_TOOLS,
    ],
  },
};

// WebApplication + BreadcrumbList structured data for a tool page
export function ToolSchema({ slug, name, appName, description, category = "MultimediaApplication" }: {
  slug: string; name: string; appName: string; description: string; category?: string;
}) {
  const url = `${SITE}/${slug}`;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: appName,
          url,
          description,
          applicationCategory: category,
          operatingSystem: "Web",
          browserRequirements: "Requires JavaScript",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          publisher: { "@type": "Organization", name: "Influanto", url: SITE },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Music Tools", item: `${SITE}/tools` },
            { "@type": "ListItem", position: 2, name, item: url },
          ],
        }}
      />
    </>
  );
}

export default function ToolSeo({ slug, className = "" }: { slug: keyof typeof TOOL_SEO; className?: string }) {
  const t = TOOL_SEO[slug];
  return (
    <>
      <SeoContent className={className} sections={t.sections} faqs={t.faqs} related={t.related} />
      <ToolSchema slug={slug} name={t.name} appName={t.appName} description={t.description} category={t.category} />
    </>
  );
}
