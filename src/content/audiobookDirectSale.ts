/** Founder-approved direct-sale audiobook constants (PEX-DIRECT-SALE-001). */

export const AUDIOBOOK_TITLE = "Psychical Excursion — First Edition Audiobook";

export const AUDIOBOOK_PRICE_USD = 11.11;

export const AUDIOBOOK_PRICE_CENTS = 1111;

export const AUDIOBOOK_RUNTIME_LABEL = "approximately 6½ hours";

export const AUDIOBOOK_CHAPTER_COUNT = 23;

export const AUDIOBOOK_PATH = "/audiobook/";

export const AUDIOBOOK_SAMPLE_MP3_PATH = "/audiobook/sample/chapter-01.mp3";

/** Same-origin checkout entry; server creates Stripe Checkout Session and redirects. */
export const AUDIOBOOK_CHECKOUT_PATH = "/api/audiobook/checkout.php";

export const AUDIOBOOK_AI_NARRATION_LABEL =
  "First-edition audiobook narrated with AI — a note from Jonathan below.";

export const AUDIOBOOK_FOUNDER_NOTE_PARAGRAPHS: readonly string[] = [
  "Thank you for being here and considering my book.",
  "I wrote Psychical Excursion as an experiment for myself and for anyone else curious enough to try some of these researched techniques and see what happens.",
  "Personally, I love audiobooks, and I wanted to make this first edition available without waiting another year to record it myself. So I chose to use AI narration.",
  "I know AI narration isn’t for everyone. I actually like what it brings to this book. There’s something a little futuristic and surreal about hearing an artificial voice guide you through dreams, altered states, consciousness, and a subject that already sits somewhere between science and the strange.",
  "This is the first edition, and in a lot of ways I’m still testing the waters. If people enjoy it and the book finds an audience, I’d love to narrate a future edition myself.",
  "For now, listen to the free sample and decide whether this version feels right for you.",
  "I hope you enjoy the experiment.",
  "I’ll meet you in the dream realm.",
  "— Jonathan Lee",
];

export const AUDIOBOOK_BUYER_SUPPORT_LINES: readonly string[] = [
  "Digital audiobook download (ZIP with MP3 tracks).",
  "After successful payment, your download link appears on the confirmation page.",
  "If delivery fails, email support@psychicalexcursion.com with your receipt from Stripe.",
  "Refund policy: contact support@psychicalexcursion.com before public launch — founder must confirm final refund wording.",
];

/** Operator contract when the Chapter 1 MP3 is not committed (large binary). */
export const AUDIOBOOK_SAMPLE_OPERATOR_CONTRACT = {
  publicPath: AUDIOBOOK_SAMPLE_MP3_PATH,
  sourceTrackFile: "03-PEX-AUDIO-01-what-is-a-psychical-excursion.mp3",
  sourcePackage: "Founder-approved listening edition (PEX-DIRECT-SALE-001 / PR #96 Chapter 1 pacing)",
} as const;
