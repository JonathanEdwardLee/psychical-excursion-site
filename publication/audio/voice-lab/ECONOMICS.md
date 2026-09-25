# Production economics (estimates, not quotes)

Publication narration words: 63,509.

## OpenAI Cedar (`gpt-4o-mini-tts`)

OpenAI currently lists about **$0.60 / 1M text-input tokens** and **$12 / 1M audio-output tokens**, with a published **~$0.015 per minute** rule of thumb (model card / speech pricing, checked 2026-09-25). The speech endpoint often does **not** return per-request usage; billed minutes can rise if speech is slower.

Planning (150 wpm, 35% buffer, **not measured in this pass**):

- Chapter-only duration ~423 minutes
- Conservative API cash ≈ 423 × $0.015 × 1.35 ≈ **$8.57**
- Plus 25% regeneration/QC allowance ≈ **$10.71**

Pilot excerpt (~3–5 min) should stay well under the **$1** hard ceiling. This environment did **not** call the API, so there is **no billed receipt**.

## Local Chatterbox clone

Software/API cash may be **$0**. Still not free:

- Generation time: unmeasured here (weights not installed)
- Hardware: no GPU on the implementing VM; CPU Nano might work on an 8-core laptop
- Disk: checkpoint download not performed
- Founder QC: hours of listening for a full book — unknown, not zero
- Electricity: unallocated / unknown

ACX remains a **human-narration** retail path unless Audible later authorizes this title.
