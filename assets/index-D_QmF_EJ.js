const Zn="0.6.0";const Zt="pex-local";const y={entries:"entries",media:"media",progress:"progress",settings:"settings"};function te(n){const e=typeof n.updatedAt=="number"?n.updatedAt:n.createdAt;return{id:n.id,type:n.type,createdAt:n.createdAt,updatedAt:e,note:typeof n.note=="string"?n.note:"",audioId:n.audioId??null,audioMimeType:n.audioMimeType??null,audioByteLength:n.audioByteLength??null,syncState:n.syncState??"LOCAL",localSafeAt:n.localSafeAt??e,syncVersion:typeof n.syncVersion=="number"?n.syncVersion:1,remoteVersion:n.remoteVersion??null,remoteFileId:n.remoteFileId??null,remoteMediaFileId:n.remoteMediaFileId??null,syncErrorCode:n.syncErrorCode??null,pexDay:n.pexDay??null,phaseId:n.phaseId??null}}class j extends Error{code;recoverable;constructor(e,t,a=!0){super(t),this.name="AppError",this.code=e,this.recoverable=a}}function Xe(n){return{day:n,unlocked:!0,visitedAt:null,completedAt:null}}function Ne(n){return{day:n.day,unlocked:!0,visitedAt:typeof n.visitedAt=="number"?n.visitedAt:null,completedAt:typeof n.completedAt=="number"?n.completedAt:null}}function N(n){return new Promise((e,t)=>{n.onsuccess=()=>e(n.result),n.onerror=()=>t(n.error??new Error("indexeddb-request-failed"))})}function D(n){return new Promise((e,t)=>{n.oncomplete=()=>e(),n.onerror=()=>t(n.error??new Error("indexeddb-transaction-failed")),n.onabort=()=>t(n.error??new Error("indexeddb-transaction-aborted"))})}function be(n){const e=n instanceof DOMException?n.name:"",t=n instanceof Error?n.message:String(n);return e==="QuotaExceededError"||/quota/i.test(t)?new j("quota-exceeded","This browser does not have enough space to save. Export existing entries if you can, then free space and retry."):new j("save-failed","The local save did not complete. Your entry was not discarded silently; retry the save.")}class ea{constructor(e=globalThis.indexedDB??null){this.factory=e}factory;assertAvailable(){if(!this.factory)throw new j("indexeddb-unavailable","IndexedDB is not available in this browser, so journal entries cannot be stored locally.",!1)}async open(){this.assertAvailable();try{const e=this.factory.open(Zt,3);e.onupgradeneeded=o=>{const i=e.result,r=e.transaction;if(i.objectStoreNames.contains(y.entries)){if(o.oldVersion<2){const s=r.objectStore(y.entries);s.indexNames.contains("syncState")||s.createIndex("syncState","syncState")}}else{const s=i.createObjectStore(y.entries,{keyPath:"id"});s.createIndex("createdAt","createdAt"),s.createIndex("type","type"),s.createIndex("syncState","syncState")}i.objectStoreNames.contains(y.media)||i.createObjectStore(y.media,{keyPath:"id"}).createIndex("entryId","entryId",{unique:!0}),i.objectStoreNames.contains(y.progress)||i.createObjectStore(y.progress,{keyPath:"day"}),i.objectStoreNames.contains(y.settings)||i.createObjectStore(y.settings,{keyPath:"key"})};const t=await N(e);return await this.ensureSeed(t)&&(await this.migrateLegacyEntries(t),await this.bumpSchemaRecord(t)),t}catch(e){throw e instanceof j?e:new j("indexeddb-open-failed","The local database could not be opened.",!1)}}async ensureSeed(e){const t=e.transaction([y.progress,y.settings],"readwrite"),a=t.objectStore(y.progress),o=t.objectStore(y.settings);for(let s=1;s<=60;s+=1){const l=await N(a.get(s));l?a.put(Ne(l)):a.put(Xe(s))}const i=await N(o.get("schema"));let r=!1;return i?i.schemaVersion<3&&(r=!0):o.put({key:"schema",schemaVersion:3,appVersion:Zn,createdAt:Date.now()}),await D(t),r}async bumpSchemaRecord(e){const t=e.transaction(y.settings,"readwrite"),a=t.objectStore(y.settings),o=await N(a.get("schema"));o&&a.put({...o,schemaVersion:3,appVersion:Zn}),await D(t)}async migrateLegacyEntries(e){const t=e.transaction(y.entries,"readwrite"),a=t.objectStore(y.entries),o=await N(a.getAll());for(const i of o)i.syncState===void 0&&a.put(te(i));await D(t)}async listEntries(){const e=await this.open();try{const t=e.transaction(y.entries,"readonly"),a=t.objectStore(y.entries),o=await N(a.getAll());return await D(t),o.map(i=>te(i)).sort((i,r)=>r.createdAt-i.createdAt)}finally{e.close()}}async getEntry(e){const t=await this.open();try{const a=t.transaction([y.entries,y.media],"readonly"),o=await N(a.objectStore(y.entries).get(e));if(!o)return await D(a),null;const i=te(o);let r=null;return i.audioId&&(r=await N(a.objectStore(y.media).get(i.audioId))??null),await D(a),{entry:i,media:r}}finally{t.close()}}async saveCapture(e){const t=await this.open(),a=e.createdAt,o=te({id:e.id,type:e.type,createdAt:a,updatedAt:a,note:e.note.trim(),audioId:e.audio?.id??null,audioMimeType:e.audio?.mimeType??null,audioByteLength:e.audio?e.audio.blob.size:null,syncState:e.syncState??"LOCAL",localSafeAt:a,syncVersion:e.syncVersion??1,remoteVersion:e.remoteVersion??null,remoteFileId:e.remoteFileId??null,remoteMediaFileId:e.remoteMediaFileId??null,syncErrorCode:null,pexDay:e.pexDay??null,phaseId:e.phaseId??null});try{const i=t.transaction(e.audio?[y.entries,y.media]:y.entries,"readwrite");if(i.objectStore(y.entries).put(o),e.audio){const r={id:e.audio.id,entryId:o.id,mimeType:e.audio.mimeType,blob:e.audio.blob,byteLength:e.audio.blob.size,createdAt:e.createdAt};i.objectStore(y.media).put(r)}return await D(i),o}catch(i){throw be(i)}finally{t.close()}}async updateNote(e,t){const a=await this.open();try{const o=a.transaction(y.entries,"readwrite"),i=o.objectStore(y.entries),r=await N(i.get(e));if(!r)throw new j("save-failed","That entry is no longer in local storage.");const s=te(r),l=te({...s,note:t.trim(),updatedAt:Date.now(),syncVersion:s.syncVersion+1,syncState:s.syncState==="SYNCED"?"PENDING_SYNC":s.syncState});return i.put(l),await D(o),l}catch(o){throw o instanceof j?o:be(o)}finally{a.close()}}async updateSyncState(e,t){const a=await this.open();try{const o=a.transaction(y.entries,"readwrite"),i=o.objectStore(y.entries),r=await N(i.get(e));if(!r)throw new j("save-failed","That entry is no longer in local storage.");const s=te({...r,...t,updatedAt:Date.now()});return i.put(s),await D(o),s}catch(o){throw o instanceof j?o:be(o)}finally{a.close()}}async deleteEntry(e){const t=await this.open();try{const a=t.transaction([y.entries,y.media],"readwrite"),o=await N(a.objectStore(y.entries).get(e));o?.audioId&&a.objectStore(y.media).delete(o.audioId),a.objectStore(y.entries).delete(e),await D(a)}catch{throw new j("delete-failed","The entry could not be deleted. It should still be present in the journal.")}finally{t.close()}}async listProgress(){const e=await this.open();try{const t=e.transaction(y.progress,"readonly"),a=await N(t.objectStore(y.progress).getAll());return await D(t),a.map(o=>Ne(o)).sort((o,i)=>o.day-i.day)}finally{e.close()}}async getDayProgress(e){const t=await this.open();try{const a=t.transaction(y.progress,"readonly"),o=await N(a.objectStore(y.progress).get(e));return await D(a),o?Ne(o):Xe(e)}finally{t.close()}}async writeDayProgress(e,t){const a=await this.open();try{const o=a.transaction([y.progress,y.settings],"readwrite"),i=o.objectStore(y.progress),r=Ne(await N(i.get(e))??Xe(e)),s=t(r);return i.put(s),o.objectStore(y.settings).put({key:"resumeDay",value:e}),await D(o),s}catch(o){throw be(o)}finally{a.close()}}async markDayVisited(e){return this.writeDayProgress(e,t=>({...t,unlocked:!0,visitedAt:Date.now()}))}async completeDay(e){return this.writeDayProgress(e,t=>({...t,unlocked:!0,visitedAt:t.visitedAt??Date.now(),completedAt:Date.now()}))}async undoDayCompletion(e){return this.writeDayProgress(e,t=>({...t,unlocked:!0,completedAt:null}))}async loadResumeDay(){return this.getSetting("resumeDay")}async getSetting(e){const t=await this.open();try{const a=t.transaction(y.settings,"readonly"),o=await N(a.objectStore(y.settings).get(e));return await D(a),o?.value}finally{t.close()}}async setSetting(e,t){const a=await this.open();try{const o=a.transaction(y.settings,"readwrite");o.objectStore(y.settings).put({key:e,value:t}),await D(o)}catch(o){throw be(o)}finally{a.close()}}async getSchemaInfo(){const e=await this.open();try{const t=e.transaction(y.settings,"readonly"),a=await N(t.objectStore(y.settings).get("schema"));return await D(t),a}finally{e.close()}}async savePersistenceReport(e){await this.setSetting("persistenceReport",e)}async loadPersistenceReport(){return this.getSetting("persistenceReport")}async exportBundle(){const e=await this.open();try{const t=e.transaction([y.entries,y.media],"readonly"),a=await N(t.objectStore(y.entries).getAll()),o=await N(t.objectStore(y.media).getAll());return await D(t),{entries:a.sort((i,r)=>i.createdAt-r.createdAt),media:o}}finally{e.close()}}}const vt=new ea;function na(){typeof window>"u"||"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").then(n=>{n.addEventListener("updatefound",()=>{const e=n.installing;e&&e.addEventListener("statechange",()=>{e.state==="installed"&&navigator.serviceWorker.controller&&document.dispatchEvent(new CustomEvent("pex-sw-update"))})})})})}async function ta(n=navigator.storage){const e=[],t=!!n,a=typeof n?.persist=="function";let o=null,i=!1,r=null,s=null,l=null;if(!t)e.push("navigator.storage is not present. Persistence cannot be requested in this browser.");else{if(typeof n?.persisted=="function")try{o=await n.persisted()}catch{e.push("storage.persisted() threw; treated as unknown.")}else e.push("storage.persisted() is not present.");if(typeof n?.estimate=="function")try{const d=await n.estimate();s=typeof d.usage=="number"?d.usage:null,l=typeof d.quota=="number"?d.quota:null}catch{e.push("storage.estimate() threw.")}else e.push("storage.estimate() is not present.");if(a&&o!==!0){i=!0;try{r=await n.persist(),r!==!0&&e.push("persist() returned a non-true result. The UI must not claim persistence was granted.")}catch{r=!1,e.push("persist() threw. Persistence is not claimed.")}}else a?(r=!0,e.push("Storage was already marked persisted before this request.")):e.push("storage.persist() is not present.")}const h={inspectedAt:Date.now(),storageApiPresent:t,persistApiPresent:a,persistedBeforeRequest:o,persistRequestAttempted:i,persistGranted:r,estimateUsageBytes:s,estimateQuotaBytes:l,notes:e};try{await vt.savePersistenceReport(h)}catch{e.push("The persistence report could not be stored in IndexedDB.")}return h}const Tt="pex-theme";function Dn(){try{const n=localStorage.getItem(Tt);if(n==="bedtime"||n==="light")return n}catch{}return"light"}function On(n=Dn()){const e=document.documentElement;e.dataset.theme=n;const t=n==="bedtime"?"#0c0c0b":"#f7f5ef",a=document.querySelector('meta[name="theme-color"]');a&&a.setAttribute("content",t);try{localStorage.setItem(Tt,n)}catch{}return n}function aa(){const n=Dn()==="bedtime"?"light":"bedtime";return On(n)}const oa=new Uint32Array(256);for(let n=0;n<256;n+=1){let e=n;for(let t=0;t<8;t+=1)e=e&1?3988292384^e>>>1:e>>>1;oa[n]=e>>>0}Promise.resolve();const ia={days:[{day:1,phaseId:"remember",title:"CATCH THE DREAM",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Start with recall. Do not try to change your dreams yet. Catch what is already there."]},{heading:"PRACTICE",paragraphs:["When you wake, stay quiet for a moment before reaching for your phone or beginning the day.","Ask:","What was happening just before I woke?","Take the first thing that appears:","an image","a place","a person","a feeling","a phrase","a movement","Record it immediately.","A fragment is enough.","If you remember that you were dreaming but nothing else, write:","Dreamed. No details.","Do not fill in missing pieces."]},{heading:"AFFIRMATION",paragraphs:["I remember my dreams when I wake."]},{heading:"RESEARCH NOTE",paragraphs:["Keeping a dream log can improve dream recall, and retrospective estimates may underestimate how often people actually remember dreams.","Source:","Aspy, 2016 — Consciousness and Cognition","https://pubmed.ncbi.nlm.nih.gov/27023923/"]}],source:"canonical-packet"},{day:2,phaseId:"remember",title:"REMEMBER ON CUE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Practice remembering something at the moment you intend to remember it."]},{heading:"PRACTICE",paragraphs:["Choose two ordinary events that will probably happen today.","For example:","When I open the refrigerator, I remember to touch the handle twice.","When I turn off a light, I remember to look at my hand.","Choose your own cues.","Do not set reminders.","Let the event itself trigger the memory."]},{heading:"TONIGHT",paragraphs:["As you settle into bed, use waking as tomorrow’s cue:","When I wake, I remember my dream.","Say it slowly a few times, then sleep normally."]},{heading:"AFFIRMATION",paragraphs:["When I wake, I remember."]},{heading:"RESEARCH NOTE",paragraphs:["Prospective memory—remembering to carry out an intention in the future—is one of the cognitive mechanisms used in MILD, a well-studied lucid-dream induction technique.","Source:","Erlacher & Stumbrys, 2020 — Frontiers in Psychology","https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.01383/full"]}],source:"canonical-packet"},{day:3,phaseId:"remember",title:"RELEASE THE BODY",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Learn the difference between holding tension and letting it go."]},{heading:"PRACTICE",paragraphs:["Get comfortable.","Move through these areas one at a time:","hands","arms","shoulders","jaw","abdomen","legs","feet","For each area:","1. Gently tense it for about three seconds.","2. Release it completely.","3. Feel the difference for a few seconds.","Keep the tension mild.","After the feet, let the whole body rest for one minute without doing anything else."]},{heading:"AFFIRMATION",paragraphs:["My body releases effort easily."]},{heading:"RESEARCH NOTE",paragraphs:["A 2026 systematic review and meta-analysis of 31 randomized trials found that progressive muscle relaxation improved subjective sleep quality, although results varied across studies and populations.","Source:","Donato et al., 2026 — Journal of Psychosomatic Research","https://pubmed.ncbi.nlm.nih.gov/41633054/"]}],source:"canonical-packet"},{day:4,phaseId:"remember",title:"FOLLOW THE BREATH",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Hold attention on one simple physical sensation."]},{heading:"PRACTICE",paragraphs:["Settle somewhere comfortable for about five minutes.","Let your breathing happen naturally.","Choose one place where the breath is easy to feel:","the nostrils","the chest","the abdomen","Keep your attention there.","When you notice that your mind has wandered, return to the same physical sensation.","Do not change the breath.","Do not try to stop thoughts.","Just return."]},{heading:"AFFIRMATION",paragraphs:["My attention returns gently."]},{heading:"RESEARCH NOTE",paragraphs:["Focused-attention practices are commonly defined by choosing one object—such as the sensation of breathing—recognizing distraction, and returning attention to that object.","Source:","Lutz et al., 2008 — Trends in Cognitive Sciences","https://pmc.ncbi.nlm.nih.gov/articles/PMC2693206/"]}],source:"canonical-packet"},{day:5,phaseId:"feel",title:"FIND A POINT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Begin tactile imagery: using attention and imagination to recreate the sense of touch without continuing the physical touch."]},{heading:"PRACTICE",paragraphs:["Choose one small point in the center of your palm.","Touch it lightly with one fingertip for several seconds.","Notice the location.","Remove your finger.","Keep your eyes closed and place your attention on the same point.","Recreate the memory of contact.","Try different versions if they help:","a fingertip pressing lightly","warmth at the point","a tiny pulse","a soft tap","You are not trying to produce a particular sensation.","Try the image and notice how it feels.","Repeat with the other hand."]},{heading:"AFFIRMATION",paragraphs:["I can place my attention precisely."]},{heading:"RESEARCH NOTE",paragraphs:["In a human neural-recording study, imagined touch produced body-part-specific responses that partly overlapped with responses to actual touch.","Source:","Chivukula et al., 2021 — eLife","https://elifesciences.org/articles/61646"]}],source:"canonical-packet"},{day:6,phaseId:"feel",title:"TRACE A LINE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Move imagined touch instead of holding it in one place."]},{heading:"PRACTICE",paragraphs:["Use one fingertip to slowly trace a line from the center of your wrist to the tip of your middle finger.","Repeat the physical trace two or three times.","Then stop touching.","Close your eyes.","Recreate the same moving path internally:","wrist","palm","finger","fingertip","Then reverse it.","Experiment with an image that makes the movement easy to follow:","a fingertip","a soft brush","a pencil eraser","a narrow stream of water","Keep the path slow enough to feel where your attention is moving.","Repeat on the other hand."]},{heading:"AFFIRMATION",paragraphs:["I can move my attention deliberately."]},{heading:"RESEARCH NOTE",paragraphs:["Tactile imagery can preserve information about where on the body an imagined touch is occurring, rather than producing only a vague general response.","Source:","Chivukula et al., 2021 — eLife","https://elifesciences.org/articles/61646"]}],source:"canonical-packet"},{day:7,phaseId:"feel",title:"STIR",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Turn the moving line into continuous motion."]},{heading:"PRACTICE",paragraphs:["Choose a small area in the center of one palm.","With a fingertip from the other hand, slowly draw a small circle there several times.","Stop touching.","Close your eyes.","Continue the same circle in imagination.","Keep it slow.","After a minute, reverse direction.","Then try changing the imagined contact:","a fingertip","a rounded brush","a small ball","a swirl of warm water","Use whichever version makes the circular motion easiest to follow.","Repeat with the other hand."]},{heading:"AFFIRMATION",paragraphs:["My attention can create continuous motion."]},{heading:"RESEARCH NOTE",paragraphs:["Imagined touch is studied as a real form of sensory cognition, but the neural response may reflect several processes—including attention, sensory anticipation, memory, and imagery itself.","Source:","Chivukula et al., 2021 — eLife","https://elifesciences.org/articles/61646"]}],source:"canonical-packet"},{day:8,phaseId:"feel",title:"BRUSH THE HAND",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Widen the moving sensation."]},{heading:"PRACTICE",paragraphs:["Hold one hand open.","Imagine a soft brush moving from the wrist, across the palm, and out through the fingertips.","Bring it back the same way.","Keep the motion slow.","Try changing the width of the imagined brush:","one finger wide","three fingers wide","the full width of the palm","You can physically brush the path once first if that helps.","Then remove the physical touch and continue in imagination.","Repeat with the other hand."]},{heading:"AFFIRMATION",paragraphs:["I can widen the path of my attention."]},{heading:"RESEARCH NOTE",paragraphs:["Imagined touch can preserve information about both body location and the character of the imagined contact.","Source:","Chivukula et al., 2021 — eLife","https://elifesciences.org/articles/61646"]}],source:"canonical-packet"},{day:9,phaseId:"feel",title:"WORK THE FINGERS",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Make the imagined movement more precise."]},{heading:"PRACTICE",paragraphs:["Choose one hand.","Move imagined touch slowly through the thumb from base to tip.","Then the index finger.","Then the middle finger.","Continue through the ring finger and little finger.","Reverse direction.","Now sweep through all five fingers together.","Try switching between:","one finger","two fingers","the whole hand","Repeat with the other hand."]},{heading:"AFFIRMATION",paragraphs:["I can separate and combine areas of attention."]},{heading:"RESEARCH NOTE",paragraphs:["Somatosensory imagery can be represented with body-part specificity rather than as one undifferentiated bodily sensation.","Source:","Chivukula et al., 2021 — eLife","https://elifesciences.org/articles/61646"]}],source:"canonical-packet"},{day:10,phaseId:"feel",title:"WORK THE FEET",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Transfer the same skill to a different part of the body."]},{heading:"PRACTICE",paragraphs:["Start with one foot.","Choose a point on the sole and touch it briefly.","Remove the touch and recreate it in imagination.","Then try:","a line from heel to toes","a small circle in the center of the sole","a broad brush across the whole foot","Move through the toes one at a time.","Then repeat with the other foot.","Use whatever imagined contact makes the path easiest to follow."]},{heading:"AFFIRMATION",paragraphs:["My attention reaches any part of my body."]},{heading:"RESEARCH NOTE",paragraphs:["Body-focused imagery is not limited to the hands; imagined touch can be organized around distinct body locations.","Source:","Chivukula et al., 2021 — eLife","https://elifesciences.org/articles/61646"]}],source:"canonical-packet"},{day:11,phaseId:"feel",title:"DRAW UP THE ARM",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Extend the imagined path across a whole limb."]},{heading:"PRACTICE",paragraphs:["Start at the fingertips of one hand.","Imagine a narrow line of contact moving slowly through:","fingers","palm","wrist","forearm","elbow","upper arm","shoulder","Then bring it back down.","Do not jump between areas.","Keep one continuous path.","Try a fingertip, brush, stream of water, or any image that makes the movement easy to follow.","Repeat on the other arm."]},{heading:"AFFIRMATION",paragraphs:["My attention moves smoothly through my body."]},{heading:"RESEARCH NOTE",paragraphs:["Motor and sensory imagery both rely on internal representations of the body and can preserve information about movement and location without overt movement.","Source:","Hurst & Boe, 2022 — Frontiers in Human Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC9815148/"]}],source:"canonical-packet"},{day:12,phaseId:"feel",title:"DRAW UP THE LEG",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Make the path longer and vary its width."]},{heading:"PRACTICE",paragraphs:["Start at the toes of one foot.","Imagine a narrow line moving through:","foot","ankle","lower leg","knee","thigh","hip","Then return to the toes.","Repeat several times.","Now make the imagined contact wider.","Instead of a thin line, imagine a broad sweep moving through the whole leg.","Repeat with the other leg."]},{heading:"AFFIRMATION",paragraphs:["I can narrow and widen my attention."]},{heading:"RESEARCH NOTE",paragraphs:["Kinesthetic and somatosensory imagery can represent both movement and bodily location without requiring the movement to occur physically.","Source:","Hurst & Boe, 2022 — Frontiers in Human Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC9815148/"]}],source:"canonical-packet"},{day:13,phaseId:"feel",title:"MOVE THROUGH, NOT OVER",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Shift from surface touch to three-dimensional movement."]},{heading:"PRACTICE",paragraphs:["Choose one hand and forearm.","Instead of imagining contact moving across the skin, imagine something passing through the whole space of the hand.","Try:","a soft sponge moving through it","a wave passing through it","a warm current traveling from fingertips to elbow","a sphere slowly moving along the arm","Keep the physical arm still.","You do not need to visualize anatomy.","Just imagine movement through volume instead of across a surface.","Repeat on the other side."]},{heading:"AFFIRMATION",paragraphs:["I can imagine movement through space inside my body."]},{heading:"RESEARCH NOTE",paragraphs:["A 2025 preregistered study directly compared body-scan practice with guided imagery while measuring interoception-related outcomes.","Source:","Schwerdtfeger et al., 2025 — Applied Psychology: Health and Well-Being","https://iaap-journals.onlinelibrary.wiley.com/doi/10.1111/aphw.70073"]}],source:"canonical-packet"},{day:14,phaseId:"feel",title:"THE FULL CIRCUIT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Link the separate body exercises into one continuous route."]},{heading:"PRACTICE",paragraphs:["Lie or sit comfortably.","Begin at the feet.","Move imagined sensation slowly through:","feet","legs","hips","torso","shoulders","arms","hands","back to the shoulders","neck","head","Then reverse the route.","Use a line, brush, wave, current, or any other image that stays easy to follow.","Do not rush through areas just to complete the circuit.","Keep the movement continuous."]},{heading:"AFFIRMATION",paragraphs:["I can move awareness through my whole body."]},{heading:"RESEARCH NOTE",paragraphs:["Scientific models of bodily awareness treat the sense of the body as an integration of multiple signals, including touch, proprioception, vision, and vestibular information.","Source:","Pfeiffer, Serino & Blanke, 2014 — Frontiers in Integrative Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC4028995/"]}],source:"canonical-packet"},{day:15,phaseId:"hold",title:"HOLD ONE POINT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Stay with one simple sensation longer than before."]},{heading:"PRACTICE",paragraphs:["Choose one physical sensation:","breath at the nostrils","pressure where your hands touch","contact between your body and the chair or bed","Stay with that one point for about seven minutes.","When attention drifts, return to the same place.","Do not try to stop thought.","The practice is:","find it","lose it","find it again"]},{heading:"AFFIRMATION",paragraphs:["I can hold my attention where I choose."]},{heading:"RESEARCH NOTE",paragraphs:["Focused-attention practice is commonly described as selecting one object, noticing distraction, and returning attention to that object.","Source:","Lutz et al., 2008 — Trends in Cognitive Sciences","https://pmc.ncbi.nlm.nih.gov/articles/PMC2693206/"]}],source:"canonical-packet"},{day:16,phaseId:"hold",title:"CATCH THE DRIFT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Notice the moment you realize your attention has moved."]},{heading:"PRACTICE",paragraphs:["Use the same kind of single-point focus as yesterday.","When you realize you have been thinking about something else, say one word silently:","drift","Then return.","Do not analyze the thought.","Do not restart the timer.","Do not judge how long you were gone.","Just catch the change and come back."]},{heading:"AFFIRMATION",paragraphs:["I notice when my attention moves."]},{heading:"RESEARCH NOTE",paragraphs:["Meta-awareness means becoming aware of the current state or contents of your own mind; this kind of self-monitoring is relevant to recognizing when a dream is a dream.","Source:","Baird, Mota-Rolim & Dresler, 2019 — Neuroscience & Biobehavioral Reviews","https://pmc.ncbi.nlm.nih.gov/articles/PMC6451677/"]}],source:"canonical-packet"},{day:17,phaseId:"hold",title:"OPEN THE FIELD",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Stop choosing one object and notice the whole field instead."]},{heading:"PRACTICE",paragraphs:["Begin with one minute of attention on the breath.","Then stop selecting.","For about five minutes, let these come and go:","sounds","body sensations","darkness behind the eyes","thoughts","images","Do not follow any one thing for long.","If a thought carries you away, notice it and reopen the field."]},{heading:"AFFIRMATION",paragraphs:["I can notice without following."]},{heading:"RESEARCH NOTE",paragraphs:["Researchers distinguish focused attention from open monitoring, where awareness stays broad instead of resting on one fixed object.","Source:","Lutz et al., 2008 — Trends in Cognitive Sciences","https://pmc.ncbi.nlm.nih.gov/articles/PMC2693206/"]}],source:"canonical-packet"},{day:18,phaseId:"hold",title:"NARROW / WIDE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Change the size of your attention on purpose."]},{heading:"PRACTICE",paragraphs:["For about four minutes, alternate every thirty seconds:","NARROW","Choose one tiny point in one hand.","WIDE","Feel the whole body at once.","Then spend about two minutes with sound:","NARROW","Choose one specific sound.","WIDE","Listen to the entire sound field.","Move back and forth deliberately."]},{heading:"AFFIRMATION",paragraphs:["I can narrow and widen awareness."]},{heading:"RESEARCH NOTE",paragraphs:["Focused and open-monitoring practices use different attentional operations, making deliberate shifts in scope a useful exercise in attention control.","Source:","Lutz et al., 2008 — Trends in Cognitive Sciences","https://pmc.ncbi.nlm.nih.gov/articles/PMC2693206/"]}],source:"canonical-packet"},{day:19,phaseId:"hold",title:"KEEP THE MOTION ALIVE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Sustain one imagined sensation without changing techniques."]},{heading:"PRACTICE",paragraphs:["Choose one image from Days 5–14:","a brush","a circle","a wave","a line","a current","Run it through one hand or forearm for about five minutes.","When the imagined movement disappears, restart it where you lost it.","Keep the physical body still.","Do not switch to a different image because the first one fades."]},{heading:"AFFIRMATION",paragraphs:["I can sustain an imagined sensation."]},{heading:"RESEARCH NOTE",paragraphs:["Mental imagery can recruit some of the same sensory systems involved in perception, including body-part-specific responses during imagined touch.","Source:","Chivukula et al., 2021 — eLife","https://elifesciences.org/articles/61646"]}],source:"canonical-packet"},{day:20,phaseId:"hold",title:"HOLD TWO LAYERS",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Keep one light background anchor while another sensation moves in the foreground."]},{heading:"PRACTICE",paragraphs:["Get comfortable.","Keep a light awareness of natural breathing.","At the same time, imagine a brush moving slowly from one hand up the arm and back.","Let the imagined movement stay in the foreground.","Let the breath remain in the background.","If one disappears, restore it and continue.","Do not worry if attention shifts back and forth at first.","Three to five minutes is enough."]},{heading:"AFFIRMATION",paragraphs:["I can remain aware of more than one layer."]},{heading:"RESEARCH NOTE",paragraphs:["Dividing attention across concurrent streams can create interference, so this exercise does not require perfect parallel attention.","Source:","Wahn & Sinnett, 2019 — Multisensory Research","https://pubmed.ncbi.nlm.nih.gov/31059470/"]}],source:"canonical-packet"},{day:21,phaseId:"hold",title:"CARRY A THREAD INTO SLEEP",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Keep one very light thread of awareness while you allow sleep to happen."]},{heading:"TONIGHT",paragraphs:["Do this at your normal bedtime.","Choose one simple thread:","the breath","a slow circle in one palm","a slow brushing motion along one hand","Keep it gentle.","You are not trying to stay awake.","You are not waiting for anything unusual.","Let yourself fall asleep normally while occasionally remembering the thread.","If it disappears, let it disappear.","If you notice it again, resume lightly."]},{heading:"AFFIRMATION",paragraphs:["I remain aware as I relax into sleep."]},{heading:"RESEARCH NOTE",paragraphs:["Hypnagogia is a transitional state between wakefulness and sleep in which spontaneous sensory experiences and unusual thought can occur.","Source:","Ghibellini & Meier, 2023 — Journal of Sleep Research","https://pmc.ncbi.nlm.nih.gov/articles/PMC10078162/"]}],source:"canonical-packet"},{day:22,phaseId:"recognize",title:"FIND THE IMPOSSIBLE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Use your own dreams to find the kinds of details that can reveal a dream."]},{heading:"PRACTICE",paragraphs:["Read a few recent dream fragments.","Choose three details that would have been unusual, impossible, or out of place if they happened while awake.","For example:","a person somewhere they should not be","a room arranged incorrectly","impossible movement","technology behaving strangely","a sudden location change","someone appearing who is no longer alive","Use your own examples.","If recent recall is sparse, use any older dream you remember clearly."]},{heading:"TONIGHT",paragraphs:["Choose one of your dream signs and remember it before sleep."]},{heading:"AFFIRMATION",paragraphs:["I notice when something does not make sense."]},{heading:"RESEARCH NOTE",paragraphs:["MILD commonly uses unusual or impossible details from remembered dreams as cues for recognizing that one is dreaming.","Source:","Erlacher & Stumbrys, 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7332853/"]}],source:"canonical-packet"},{day:23,phaseId:"recognize",title:"REMEMBER THE FUTURE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Train an intention to return when a future cue appears."]},{heading:"PRACTICE",paragraphs:["Choose two natural events that are likely to happen today.","For example:","When I walk through my front door, I remember to look closely at my surroundings.","When my phone rings, I remember what I intended to do.","Do not set reminders.","Let the event itself trigger the memory."]},{heading:"TONIGHT",paragraphs:["Use one simple intention:","When something unusual happens in a dream, I remember to notice it."]},{heading:"AFFIRMATION",paragraphs:["I remember when the moment arrives."]},{heading:"RESEARCH NOTE",paragraphs:["Prospective memory is the ability to remember an intended action when a future cue occurs, and it is central to MILD.","Source:","Tan & Fan, 2023 — Journal of Sleep Research","https://doi.org/10.1111/jsr.13786"]}],source:"canonical-packet"},{day:24,phaseId:"recognize",title:"QUESTION THE STATE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Ask whether you might be dreaming only when there is a reason to ask."]},{heading:"PRACTICE",paragraphs:["A few times today, when something feels genuinely odd, repetitive, surprising, or dreamlike, stop.","Ask:","Could I be dreaming?","Then perform one simple test.","Try either:","read a short piece of text or a clock, look away, then read it again","or","gently close your nose and see whether breathing still feels possible","Do not perform checks constantly.","The question matters more than the ritual."]},{heading:"AFFIRMATION",paragraphs:["When something is strange, I question my state."]},{heading:"RESEARCH NOTE",paragraphs:["Reality testing is widely used in lucid-dream practice, but evidence for it as a stand-alone induction method is weaker than for MILD.","Source:","Tan & Fan, 2023 — Journal of Sleep Research","https://doi.org/10.1111/jsr.13786"]}],source:"canonical-packet"},{day:25,phaseId:"recognize",title:"REHEARSE RECOGNITION",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Practice becoming lucid inside a dream you already remember."]},{heading:"PRACTICE",paragraphs:["Do this before bedtime, but not while trying to fall asleep.","Recall one recent dream.","Choose one dream sign from it.","Imagine the dream again.","When the dream sign appears in imagination, stop and think:","This is a dream.","Then continue imagining the same dream while knowing that you are dreaming.","Repeat the sequence a few times."]},{heading:"AFFIRMATION",paragraphs:["When I am dreaming, I remember that I am dreaming."]},{heading:"RESEARCH NOTE",paragraphs:["MILD combines prospective intention with mental rehearsal of recognizing a dream sign in a remembered dream.","Source:","Erlacher & Stumbrys, 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7332853/"]}],source:"canonical-packet"},{day:26,phaseId:"recognize",title:"CARRY THE INTENTION TO SLEEP",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Take yesterday’s recognition exercise to the edge of sleep."]},{heading:"TONIGHT",paragraphs:["Get comfortable and prepare to sleep normally.","Recall one dream sign.","Briefly imagine recognizing it and thinking:","This is a dream.","Repeat only until the intention feels clear.","Then stop rehearsing.","Let sleep come.","Do not force the phrase for long periods."]},{heading:"AFFIRMATION",paragraphs:["The next time I dream, I remember I am dreaming."]},{heading:"RESEARCH NOTE",paragraphs:["In a large field study, participants who returned to sleep relatively quickly after induction practice were more likely to report lucid dreams.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7379166/"]}],source:"canonical-packet"},{day:27,phaseId:"recognize",title:"USE A NATURAL AWAKENING",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Use a remembered dream immediately if you wake from one naturally."]},{heading:"TONIGHT",paragraphs:["If you wake from a dream during the night or early morning:","stay comfortable","recall the dream","choose one dream sign","imagine returning to the dream","rehearse recognizing the sign","set the intention to notice the next dream","return to sleep","Do not set an alarm for this exercise.","If you do not wake naturally, use Day 26 at bedtime instead."]},{heading:"AFFIRMATION",paragraphs:["When I return to dreaming, I remember."]},{heading:"RESEARCH NOTE",paragraphs:["MILD is especially well suited to practice after awakening from a remembered dream because the dream can be used immediately for rehearsal.","Source:","Erlacher & Stumbrys, 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7332853/"]}],source:"canonical-packet"},{day:28,phaseId:"recognize",title:"WAKE INSIDE THE DREAM",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Turn waking itself into a recognition cue."]},{heading:"PRACTICE",paragraphs:["Each time you genuinely wake from sleep or a nap today, pause before getting absorbed in the day.","Ask:","Am I fully awake?","Perform one calm state check.","Then continue normally.","Do not repeat this every time you stand up or enter a room.","Use waking as the cue."]},{heading:"AFFIRMATION",paragraphs:["When I wake, I check where I am."]},{heading:"RESEARCH NOTE",paragraphs:["False awakenings have been recorded in sleep laboratories and show physiological characteristics closer to dreaming than ordinary wakefulness.","Source:","Mainieri et al., 2021 — Journal of Clinical Sleep Medicine","https://pubmed.ncbi.nlm.nih.gov/33283752/"]}],source:"canonical-packet"},{day:29,phaseId:"recognize",title:"REHEARSE THE FIRST LUCID MOMENT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Practice what you will do in the first few seconds after recognizing a dream."]},{heading:"PRACTICE",paragraphs:["Close your eyes and imagine that you suddenly realize:","This is a dream.","Then rehearse only the first few seconds.","Pause.","Look closely at one nearby object.","Touch one surface if you can.","Stay with the scene instead of immediately trying to control everything.","Repeat the short rehearsal a few times."]},{heading:"TONIGHT",paragraphs:["If you become lucid, use the same response."]},{heading:"AFFIRMATION",paragraphs:["When I become lucid, I stay present."]},{heading:"RESEARCH NOTE",paragraphs:["Lucid dreaming can be objectively verified in sleep laboratories using deliberate eye-movement signals during sleep.","Source:","Baird, Mota-Rolim & Dresler, 2019 — Neuroscience & Biobehavioral Reviews","https://pmc.ncbi.nlm.nih.gov/articles/PMC6451677/"]}],source:"canonical-packet"},{day:30,phaseId:"recognize",title:"FULL RECOGNITION NIGHT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Combine the complete recognition method."]},{heading:"TONIGHT",paragraphs:["At normal bedtime:","1. Recall a recent dream.","2. Choose one dream sign.","3. Imagine recognizing it.","4. Form the intention to notice the next dream.","5. Let sleep come naturally.","If you wake naturally from a dream later, repeat the sequence once.","Do not set an alarm.","Do not extend wakefulness.","Perform the method and let the night unfold."]},{heading:"AFFIRMATION",paragraphs:["When I am dreaming, I recognize the dream."]},{heading:"RESEARCH NOTE",paragraphs:["In the International Lucid Dream Induction Study, stronger dream recall predicted better induction outcomes, and successful MILD practice was not associated with reduced sleep quality in that sample.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7379166/"]}],source:"canonical-packet"},{day:31,phaseId:"observe",title:"WATCH THE DARK",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Observe the visual field behind closed eyes without trying to create anything."]},{heading:"PRACTICE",paragraphs:["At bedtime or during a comfortable rest, close your eyes.","Let them remain relaxed.","Notice the darkness behind your eyelids.","Do not search for shapes.","Do not name every flicker.","Do not try to make a picture.","Just watch.","If imagery begins, let it change by itself."]},{heading:"AFFIRMATION",paragraphs:["I can watch without interfering."]},{heading:"RESEARCH NOTE",paragraphs:["Hypnagogia is the transition from wakefulness toward sleep, and spontaneous visual imagery can occur during that period.","Source:","Ghibellini & Meier, 2023 — Journal of Sleep Research","https://pmc.ncbi.nlm.nih.gov/articles/PMC10078162/"]}],source:"canonical-packet"},{day:32,phaseId:"observe",title:"LISTEN INWARD",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Observe the auditory field without straining to hear."]},{heading:"PRACTICE",paragraphs:["Lie comfortably with your eyes closed.","Begin with ordinary sounds around you.","Then notice quieter sounds:","your breathing","fabric moving","distant background noise","faint internal sound if present","Do not search for unusual sounds.","Do not invent them.","Let hearing stay open."]},{heading:"AFFIRMATION",paragraphs:["I can listen without searching."]},{heading:"RESEARCH NOTE",paragraphs:["Auditory experiences are a documented part of hypnagogia, although visual and kinesthetic experiences are reported more often.","Source:","Ghibellini & Meier, 2023 — Journal of Sleep Research","https://pmc.ncbi.nlm.nih.gov/articles/PMC10078162/"]}],source:"canonical-packet"},{day:33,phaseId:"observe",title:"FEEL THE WHOLE FIELD",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Observe the body without trying to change it."]},{heading:"PRACTICE",paragraphs:["Lie still enough to notice the body as one field.","Do not brush, stir, or trace.","Notice:","contact with the bed or chair","weight","temperature","breathing","position","Let the body feel however it feels."]},{heading:"AFFIRMATION",paragraphs:["I can observe my body without changing it."]},{heading:"RESEARCH NOTE",paragraphs:["Kinesthetic and body-related experiences are among the most commonly reported forms of hypnagogic experience.","Source:","Ghibellini & Meier, 2023","https://www.sciencedirect.com/science/article/pii/S1053810023001198"]}],source:"canonical-packet"},{day:34,phaseId:"observe",title:"THREE CHANNELS",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Move attention through vision, hearing, and body sensation."]},{heading:"PRACTICE",paragraphs:["Close your eyes.","For about twenty seconds:","watch the visual field.","Then:","listen to the auditory field.","Then:","feel the bodily field.","Repeat the cycle several times.","Do not search for unusual content in any channel.","Just move attention."]},{heading:"AFFIRMATION",paragraphs:["I can move awareness through my senses."]},{heading:"RESEARCH NOTE",paragraphs:["SSILD is a lucid-dream induction method built around cycling attention through visual, auditory, and bodily sensations.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.01746/full"]}],source:"canonical-packet"},{day:35,phaseId:"observe",title:"LIGHTER CYCLES",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Make the same sensory cycle less effortful."]},{heading:"PRACTICE",paragraphs:["Repeat yesterday’s sequence:","watch","listen","feel","This time, do not concentrate hard.","Touch each channel lightly with attention, then move on.","After several slower cycles, let the transitions become easier and less deliberate.","When you finish, stop the exercise and sleep normally."]},{heading:"AFFIRMATION",paragraphs:["My awareness can move without effort."]},{heading:"RESEARCH NOTE",paragraphs:["SSILD performed similarly to MILD in one large field study, but researchers have not established exactly why sensory cycling may help.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7379166/"]}],source:"canonical-packet"},{day:36,phaseId:"observe",title:"LET IMAGERY FORM",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Notice the difference between imagery you create and imagery that appears on its own."]},{heading:"PRACTICE",paragraphs:["Begin with one familiar imagined object or tactile motion for about one minute.","For example:","a circle in the palm","a brush across the hand","a simple object","Then stop creating it.","Remain quietly attentive.","If an image, sound, phrase, or movement-like impression appears without deliberate construction, observe it without developing it.","Do not chase it."]},{heading:"AFFIRMATION",paragraphs:["I can notice what arises on its own."]},{heading:"RESEARCH NOTE",paragraphs:["A common feature of hypnagogic imagery is that it can appear spontaneously as deliberate control over thought decreases.","Source:","Ghibellini & Meier, 2023 — Journal of Sleep Research","https://pmc.ncbi.nlm.nih.gov/articles/PMC10078162/"]}],source:"canonical-packet"},{day:37,phaseId:"observe",title:"NOTICE THE BODY MAP",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Observe your sense of body position while remaining physically still."]},{heading:"PRACTICE",paragraphs:["Lie comfortably.","Keep a light awareness of:","where your hands seem to be","where your feet seem to be","the outline of your body","up and down","left and right","Do not correct any change with movement unless you are uncomfortable.","If everything feels completely ordinary, continue observing."]},{heading:"AFFIRMATION",paragraphs:["I can observe my sense of position."]},{heading:"RESEARCH NOTE",paragraphs:["Scientific models of bodily self-consciousness treat self-location as an integration of touch, proprioceptive, visual, and vestibular information.","Source:","Pfeiffer, Serino & Blanke, 2014 — Frontiers in Integrative Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC4028995/"]}],source:"canonical-packet"},{day:38,phaseId:"observe",title:"OBSERVE THE TRANSITION",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Combine passive observation as sleep begins."]},{heading:"TONIGHT",paragraphs:["At your normal bedtime:","1. Watch the visual field briefly.","2. Listen briefly.","3. Feel the body briefly.","4. Stop cycling.","5. Let attention become passive.","6. Allow sleep to come.","If a spontaneous image, sound, phrase, or movement-like impression appears, observe it without chasing it.","Do not try to stay awake.","Do not wait for a specific event."]},{heading:"AFFIRMATION",paragraphs:["I remain curious as sleep begins."]},{heading:"RESEARCH NOTE",paragraphs:["Sleep onset is a gradual transition rather than an instant switch, and internally generated sensory experiences can emerge before conventional sleep is fully established.","Source:","Ghibellini & Meier, 2023 — Journal of Sleep Research","https://pmc.ncbi.nlm.nih.gov/articles/PMC10078162/"]}],source:"canonical-packet"},{day:39,phaseId:"move",title:"ROCK",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Create a simple whole-body movement in imagination while the body stays still."]},{heading:"PRACTICE",paragraphs:["Lie comfortably.","Imagine your whole body rocking gently from side to side.","Keep the movement small and slow:","left","center","right","center","Do not watch yourself from outside.","Feel the motion from inside.","If it helps, physically rock once or twice first.","Then stop moving and recreate the same motion internally."]},{heading:"AFFIRMATION",paragraphs:["I can imagine movement without moving."]},{heading:"RESEARCH NOTE",paragraphs:["Motor imagery is the mental simulation of movement without overt action, and it recruits several brain systems also involved in actual movement.","Source:","Hurst & Boe, 2022 — Frontiers in Human Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC9815148/"]}],source:"canonical-packet"},{day:40,phaseId:"move",title:"ROLL",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Add rotation."]},{heading:"PRACTICE",paragraphs:["Lie still.","Imagine the whole body slowly rolling to one side as if turning over in bed.","Do not move any muscles.","Continue the imagined roll farther than a normal physical turn.","Then reverse direction.","Stay in first-person perspective.","You do not need to picture the room clearly.","Focus on the felt rotation."]},{heading:"AFFIRMATION",paragraphs:["I can feel imagined rotation."]},{heading:"RESEARCH NOTE",paragraphs:["Kinesthetic imagery focuses on the felt qualities of movement rather than simply seeing movement from the outside.","Source:","Krüger, Hegele & Rieger, 2024 — Psychological Research","https://link.springer.com/article/10.1007/s00426-022-01771-y"]}],source:"canonical-packet"},{day:41,phaseId:"move",title:"GLIDE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Move sideways without rotating."]},{heading:"PRACTICE",paragraphs:["Imagine your whole body drifting several inches to the left while staying level.","Return to center.","Then drift to the right.","Imagine a platform sliding smoothly beneath you.","Keep the movement horizontal.","Do not intentionally move your head or eyes.","Repeat slowly."]},{heading:"AFFIRMATION",paragraphs:["I can move my sense of position."]},{heading:"RESEARCH NOTE",paragraphs:["Vestibular processing contributes to perceived self-motion, self-location, and spatial orientation.","Source:","Pfeiffer, Serino & Blanke, 2014 — Frontiers in Integrative Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC4028995/"]}],source:"canonical-packet"},{day:42,phaseId:"move",title:"FLOAT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Move vertically."]},{heading:"PRACTICE",paragraphs:["Imagine the whole body becoming lighter and rising a few inches.","Pause.","Then settle back down.","Repeat slowly:","rise","pause","settle","Do not force a picture of the room below you.","Prioritize the felt movement.","If it helps, imagine:","water lifting you","an elevator rising","a platform moving upward","or simple upward motion"]},{heading:"AFFIRMATION",paragraphs:["I can imagine rising and settling."]},{heading:"RESEARCH NOTE",paragraphs:["Vestibular and multisensory signals contribute to self-motion, self-location, and first-person perspective.","Source:","Pfeiffer, Serino & Blanke, 2014","https://pmc.ncbi.nlm.nih.gov/articles/PMC4028995/"]}],source:"canonical-packet"},{day:43,phaseId:"move",title:"REACH WITHOUT MOVING",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Extend an imagined movement beyond normal physical range."]},{heading:"PRACTICE",paragraphs:["Choose one arm.","Keep it completely still.","Imagine reaching toward an object or point beyond comfortable physical reach.","Feel the movement through:","shoulder","arm","hand","fingers","Then return.","Next, reach farther than the physical arm could actually extend.","Try upward.","Try outward.","Do not worry about anatomical realism.","Follow the intended movement."]},{heading:"AFFIRMATION",paragraphs:["My imagined movement is not limited by physical range."]},{heading:"RESEARCH NOTE",paragraphs:["Motor imagery can represent intended actions and their sensory consequences even when the movement is not physically performed.","Source:","Hurst & Boe, 2022 — Frontiers in Human Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC9815148/"]}],source:"canonical-packet"},{day:44,phaseId:"move",title:"MOVE TOWARD A POINT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Move your sense of position instead of only moving a limb."]},{heading:"PRACTICE",paragraphs:["Choose one simple destination:","the door","the ceiling","the foot of the bed","a corner of the room","Keep your physical body still.","Imagine your point of view moving toward that location.","Do not picture yourself traveling from outside.","Move from first-person perspective.","Return to your starting point.","Repeat."]},{heading:"AFFIRMATION",paragraphs:["I can move my point of view in imagination."]},{heading:"RESEARCH NOTE",paragraphs:["Researchers distinguish self-location—the felt place where “I” am—from body ownership, the feeling that a body belongs to me.","Source:","Blanke, 2012 — Nature Reviews Neuroscience","https://www.nature.com/articles/nrn3292"]}],source:"canonical-packet"},{day:45,phaseId:"move",title:"SUSTAIN ONE MOTION",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Choose one movement and stay with it."]},{heading:"PRACTICE",paragraphs:["Pick whichever motion from the last six days feels easiest:","rock","roll","glide","float","reach","move toward a point","Repeat only that motion for about five minutes.","Do not switch because attention wanders.","Restore the same motion and continue.","As it becomes familiar, use less effort while keeping the movement clear."]},{heading:"AFFIRMATION",paragraphs:["I can sustain imagined motion."]},{heading:"RESEARCH NOTE",paragraphs:["Imagined and executed movement share some neural systems, but mental movement is not identical to physical movement.","Source:","Hurst & Boe, 2022 — Frontiers in Human Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC9815148/"]}],source:"canonical-packet"},{day:46,phaseId:"move",title:"LET THE MOTION LEAD",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Begin the motion deliberately, then interfere less."]},{heading:"PRACTICE",paragraphs:["At bedtime or during a relaxed session:","1. Relax the body.","2. Choose your strongest imagined movement.","3. Create it deliberately for a short time.","4. Gradually use less effort to maintain it.","5. Notice whether it continues, fades, changes, or stops.","If the movement changes, do not immediately rebuild the original version.","Follow what is already happening."]},{heading:"AFFIRMATION",paragraphs:["I can begin the motion and then let it change."]},{heading:"RESEARCH NOTE",paragraphs:["Floating, spinning, and other movement-without-movement sensations are described as vestibular-motor experiences in some sleep-paralysis and OBE research.","Source:","Cheyne & Girard, 2009 — Cortex","https://pubmed.ncbi.nlm.nih.gov/18621363/"]}],source:"canonical-packet"},{day:47,phaseId:"attempt",title:"BUILD THE SEQUENCE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Combine the skills you have trained into one simple bedtime sequence."]},{heading:"TONIGHT",paragraphs:["At your normal bedtime:","1. Relax the body.","2. Choose one light anchor:","breath","palm circle","or whole-body sensation","3. Briefly notice:","visual field","sound","body","4. Choose one motion from MOVE.","5. Sustain it gently.","6. Use less effort.","7. Allow sleep.","Do not add extra techniques."]},{heading:"AFFIRMATION",paragraphs:["I know the sequence and let it unfold."]},{heading:"RESEARCH NOTE",paragraphs:["Current sleep-related OBE research focuses more on transitions among waking, dreaming, and REM-related states than on one specific “exit” technique.","Source:","Campillo-Ferrer et al., 2024 — Neuroscience & Biobehavioral Reviews","https://pubmed.ncbi.nlm.nih.gov/38880408/"]}],source:"canonical-packet"},{day:48,phaseId:"attempt",title:"NATURAL AWAKENING ATTEMPT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Try the same sequence after a natural awakening."]},{heading:"TONIGHT",paragraphs:["If you wake naturally during the night or early morning and still feel sleepy:","stay comfortable","recall the dream if one is present","use one light anchor","choose one familiar motion","reduce effort","return to sleep","Do not set an alarm for this exercise.","If you do not wake naturally, use Day 47 at bedtime."]},{heading:"AFFIRMATION",paragraphs:["When I wake naturally, I can return with awareness."]},{heading:"RESEARCH NOTE",paragraphs:["Later-night sleep contains more REM than early-night sleep, which is one reason lucid-dream induction research often uses late-sleep awakenings.","Source:","Erlacher & Stumbrys, 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7332853/"]}],source:"canonical-packet"},{day:49,phaseId:"attempt",title:"SHORTEN THE SEQUENCE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["See how much of the method you can remove."]},{heading:"TONIGHT",paragraphs:["Use only:","relax","one anchor","one motion","reduce effort","sleep","Do not cycle through every sense.","Do not repeat several affirmations.","Do not change motions.","Keep the sequence small."]},{heading:"AFFIRMATION",paragraphs:["I can hold the same intention with less effort."]},{heading:"RESEARCH NOTE",paragraphs:["In lucid-dream induction studies, returning to sleep relatively quickly after practice has been associated with better outcomes.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7379166/"]}],source:"canonical-packet"},{day:50,phaseId:"attempt",title:"LUCID DREAM BRIDGE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["If lucidity appears, use movement instead of trying to control the entire dream."]},{heading:"TONIGHT",paragraphs:["If you become lucid:","pause","let the dream continue","choose one familiar motion:","roll","rise","float","or move toward a point","Perform it from first-person perspective.","Notice what changes.","If no lucid dream occurs, use the shortened bedtime sequence from Day 49."]},{heading:"AFFIRMATION",paragraphs:["When I become lucid, I can explore movement deliberately."]},{heading:"RESEARCH NOTE",paragraphs:["Lucid dreams and sleep-related OBEs are treated as distinct experiences in current research, even though both can occur around REM-related and sleep-transition states.","Source:","Campillo-Ferrer et al., 2024 — Neuroscience & Biobehavioral Reviews","https://pubmed.ncbi.nlm.nih.gov/38880408/"]}],source:"canonical-packet"},{day:51,phaseId:"attempt",title:"TIMED ATTEMPT",optional:!0,optionalNote:"Optional timing experiment. Skip it without penalty.",sections:[{heading:"TODAY",paragraphs:["Test whether late-sleep timing changes the experience."]},{heading:"TONIGHT",paragraphs:["This exercise is optional.","Skip it if you are short on sleep, have difficulty returning to sleep, or need uninterrupted rest.","If you choose to try it:","Set an alarm for about six hours after you expect to fall asleep.","When you wake, stay up only briefly.","Keep yourself sleepy.","Use one short intention:","I remain aware as I return to sleep.","Return to bed.","Then use:","relax","one anchor","one motion","reduce effort","sleep","If you skip the alarm, use the same compressed sequence at a natural awakening or at bedtime."]},{heading:"AFFIRMATION",paragraphs:["I return to sleep with light awareness."]},{heading:"RESEARCH NOTE",paragraphs:["In one sleep-laboratory study, lucid dreams occurred more often when MILD was practiced after about six hours of sleep than during control conditions.","Source:","Erlacher & Stumbrys, 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7332853/"]}],source:"canonical-packet"},{day:52,phaseId:"attempt",title:"STRENGTHEN THE THREAD",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Test a slightly stronger awareness anchor."]},{heading:"TONIGHT",paragraphs:["Choose one anchor that requires a little more active tracking:","count breaths from 1 to 10","or","trace one slow tactile path repeatedly","Keep the anchor for several minutes.","Then add one familiar motion.","After the motion is clear, reduce effort.","Do not try to stay awake indefinitely."]},{heading:"AFFIRMATION",paragraphs:["I can keep a light thread of awareness."]},{heading:"RESEARCH NOTE",paragraphs:["In one large field study, lucid-dream induction was more successful among participants who fell asleep within 10 minutes of completing the technique.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7379166/"]}],source:"canonical-packet"},{day:53,phaseId:"attempt",title:"LIGHTEN THE THREAD",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Test the opposite: less effort."]},{heading:"TONIGHT",paragraphs:["Do not count.","Do not cycle senses.","Do not rehearse several movements.","Relax.","Choose one simple motion.","Make it faint.","Let thoughts and imagery drift around it.","If the motion disappears, do not immediately rebuild it.","Rest."]},{heading:"AFFIRMATION",paragraphs:["I do not have to force the transition."]},{heading:"RESEARCH NOTE",paragraphs:["Sleep onset naturally involves decreasing deliberate control over thought and imagery.","Source:","Ghibellini & Meier, 2023 — Journal of Sleep Research","https://pmc.ncbi.nlm.nih.gov/articles/PMC10078162/"]}],source:"canonical-packet"},{day:54,phaseId:"attempt",title:"COMMIT TO ONE ROUTE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Choose one route and stay with it."]},{heading:"TONIGHT",paragraphs:["Pick one:","SENSORY","one tactile anchor","→ whole-body sensation","→ one motion","OBSERVATION","watch / listen / feel","→ let imagery arise","→ one motion","LUCID","MILD","→ recognize the dream","→ one motion","NATURAL AWAKENING","wake from a dream","→ stay comfortable","→ one motion","→ return to sleep","MINIMAL","relax","→ one motion","Choose before the attempt.","Do not switch routes because nothing happens immediately."]},{heading:"AFFIRMATION",paragraphs:["I stay with one method."]},{heading:"RESEARCH NOTE",paragraphs:["Current research does not identify one universal induction pathway for sleep-related OBEs.","Source:","Moix et al., 2025 — EXPLORE","https://pubmed.ncbi.nlm.nih.gov/40540759/"]}],source:"canonical-packet"},{day:55,phaseId:"learn-your-door",title:"CHOOSE THE EASIEST ENTRY",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Begin with the route that takes the least effort to start."]},{heading:"TONIGHT",paragraphs:["Choose one entry based on your own experience:","SENSORY","one tactile anchor","OBSERVATION","watch, listen, or feel","LUCID","MILD intention","MOTION","one familiar imagined movement","NATURAL AWAKENING","use the method only if you wake from a dream","Choose the easiest one to begin.","Not the most dramatic.","Use that entry for a few minutes.","Then add one familiar motion if it fits.","Reduce effort and allow sleep."]},{heading:"AFFIRMATION",paragraphs:["I begin with what comes naturally."]},{heading:"RESEARCH NOTE",paragraphs:["In lucid-dream induction research, general dream recall and the ability to return to sleep efficiently have predicted outcomes better than prior experience with induction techniques.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7379166/"]}],source:"canonical-packet"},{day:56,phaseId:"learn-your-door",title:"REMOVE ONE STEP",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Simplify the route you chose yesterday."]},{heading:"TONIGHT",paragraphs:["Repeat the same route.","Remove one part you do not seem to need.","For example:","sensory anchor","→ motion","observation","→ motion","MILD","→ sleep","natural awakening","→ motion","Do not replace the removed step with something new.","Try the simpler version and let sleep come."]},{heading:"AFFIRMATION",paragraphs:["I use only what I need."]},{heading:"RESEARCH NOTE",paragraphs:["More complicated induction procedures do not automatically outperform simpler ones; in one large study, combining MILD and SSILD did not improve results over either method alone.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7379166/"]}],source:"canonical-packet"},{day:57,phaseId:"learn-your-door",title:"HOLD ONE INTENTION",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Replace procedural thinking with one clear intention."]},{heading:"TONIGHT",paragraphs:["Choose one sentence before you begin.","For example:","I remain aware as sleep begins.","When I dream, I recognize it.","I follow the movement.","I return to sleep with awareness.","Choose one.","Then stop giving yourself instructions.","Use the simplest version of your method."]},{heading:"AFFIRMATION",paragraphs:["My intention stays simple."]},{heading:"RESEARCH NOTE",paragraphs:["MILD works through prospective intention and rehearsal rather than through endlessly repeating a phrase.","Source:","Tan & Fan, 2023 — Journal of Sleep Research","https://doi.org/10.1111/jsr.13786"]}],source:"canonical-packet"},{day:58,phaseId:"learn-your-door",title:"FOLLOW THE FIRST CHANGE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["When something changes, stop adding technique."]},{heading:"TONIGHT",paragraphs:["Use your personal method.","If something begins to change naturally:","imagery","sound","body sense","movement","dream scene","self-location","lucidity","stop adding steps.","Follow the change already happening.","If nothing changes, continue lightly and sleep."]},{heading:"AFFIRMATION",paragraphs:["When the state changes, I follow it."]},{heading:"RESEARCH NOTE",paragraphs:["Current models of sleep-related OBEs emphasize transitions among waking, REM-related, lucid-dream, and sleep-paralysis states rather than one universal induction mechanism.","Source:","Campillo-Ferrer et al., 2024 — Neuroscience & Biobehavioral Reviews","https://pubmed.ncbi.nlm.nih.gov/38880408/"]}],source:"canonical-packet"},{day:59,phaseId:"learn-your-door",title:"ONE ENTRY, ONE ACTION",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Reduce the method to two parts."]},{heading:"TONIGHT",paragraphs:["Choose:","ONE ENTRY","and","ONE ACTION","Examples:","palm sensation","→ float","breath","→ roll","MILD","→ recognize","visual field","→ rise","natural awakening","→ move toward a point","Use only those two parts.","No second technique.","No rescue sequence.","No restart unless you become fully awake."]},{heading:"AFFIRMATION",paragraphs:["I use one entry and one action."]},{heading:"RESEARCH NOTE",paragraphs:["A 2025 scoping review found that OBEs can occur spontaneously, be self-induced, or arise through different methods rather than one universal pathway.","Source:","Moix et al., 2025 — EXPLORE","https://pubmed.ncbi.nlm.nih.gov/40540759/"]}],source:"canonical-packet"},{day:60,phaseId:"learn-your-door",title:"INDEPENDENT ATTEMPT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Use the method without adding anything because this is Day 60."]},{heading:"TONIGHT",paragraphs:["Choose your own:","time","entry","anchor, if any","movement, if any","MILD intention, if any","point where you stop trying and sleep","Keep it simple.","Perform one attempt.","Then sleep."]},{heading:"AFFIRMATION",paragraphs:["I know how to continue."]},{heading:"RESEARCH NOTE",paragraphs:["Morning dream recall varies substantially between people and can also change from night to night with sleep patterns and other factors.","Source:","Elce et al., 2025 — Communications Psychology","https://pubmed.ncbi.nlm.nih.gov/39966517/"]}],source:"canonical-packet"}]};function m(n,e={},t=[]){const a=document.createElement(n);for(const[o,i]of Object.entries(e))if(!(i===void 0||i===!1)){if(i===!0){a.setAttribute(o,"");continue}if(o==="class"){a.className=i;continue}a.setAttribute(o,i)}for(const o of t)a.append(o);return a}function ra(n){return document.createTextNode(n)}const we={recorder:null,recordingActive:!1,starting:!1,recordingStartedAt:null};function sa(){we.recorder?.release(),we.recorder=null,we.recordingActive=!1,we.starting=!1,we.recordingStartedAt=null}const et=["Remember a dream fragment when you wake","Practice remembering at everyday cues","Release tension in the body","Follow the breath for five minutes","Focus on one small point in your palm","Trace a slow line on your hand","Stir sensation in the center of your palm","Brush attention across one open hand","Work attention through each finger","Work attention through one foot","Draw attention up one arm","Draw attention up one leg","Move attention through the arm, not over it","Run the full attention circuit once","Hold one physical sensation steady","Catch when attention starts to drift","Open attention to a wider field","Alternate narrow and wide attention","Keep a chosen motion alive in attention","Hold two layers of sensation at once","Carry a thread of attention into sleep","Look for something gently impossible","Rehearse remembering tomorrow’s intention","Question whether you are awake or dreaming","Rehearse recognizing the dream state","Carry your intention as you fall asleep","Use a natural night waking if one comes","Practice waking inside the dream","Rehearse the first moment of lucidity","Run a full recognition practice tonight","Watch the dark behind closed eyes","Listen inward without naming sounds","Feel the whole body field at once","Notice sight, sound, and body together","Let attention move in lighter cycles","Let imagery form without forcing it","Notice how the body is mapped in mind","Observe the edge between wake and sleep","Rock attention gently in the body","Roll attention through the body","Glide attention smoothly","Float attention with less effort","Reach toward a point without moving","Move attention toward one point","Sustain one small motion in attention","Let the motion lead your attention","Build a short sequence of motions","Try one attempt after a natural awakening","Shorten your sequence to the essentials","Bridge from lucid dream back to calm wakefulness","Try one timed attempt window","Strengthen one thread of intention","Lighten the same thread of intention","Commit to one entry route for tonight","Choose the easiest entry you know","Remove one step from your routine","Hold one clear intention only","Follow the first change you notice","One entry, one action, then stop","Choose your own simple attempt, then sleep"];new Set(ia.days.map(n=>n.title));if(et.length!==60)throw new Error(`Expected 60 plain titles, got ${et.length}`);const It=173.1446326846693,kt=14959787069098932e-8,W=.017453292519943295,Le=57.29577951308232,la=365.24217,nt=new Date("2000-01-01T12:00:00Z"),$=2*Math.PI,X=3600*(180/Math.PI),de=484813681109536e-20,At=10800*60,ha=2*At,ca=At/Math.PI,da=-.17-5*Math.log10(ca),tt=29.530588,ua=24*3600,ma=6378.1366,pa=ma/kt,xt=81.30056,Pn=.0002959122082855911,dn=2825345909524226e-22,un=8459715185680659e-23,mn=1292024916781969e-23,pn=1524358900784276e-23;function St(n){if(n!==!0&&n!==!1)throw console.trace(),`Value is not boolean: ${n}`;return n}function ee(n){if(!Number.isFinite(n))throw console.trace(),`Value is not a finite number: ${n}`;return n}function le(n){return n-Math.floor(n)}function ga(n,e){const t=n.x*n.x+n.y*n.y+n.z*n.z;if(Math.abs(t)<1e-8)throw"AngleBetween: first vector is too short.";const a=e.x*e.x+e.y*e.y+e.z*e.z;if(Math.abs(a)<1e-8)throw"AngleBetween: second vector is too short.";const o=(n.x*e.x+n.y*e.y+n.z*e.z)/Math.sqrt(t*a);return o<=-1?180:o>=1?0:Le*Math.acos(o)}var p;(function(n){n.Sun="Sun",n.Moon="Moon",n.Mercury="Mercury",n.Venus="Venus",n.Earth="Earth",n.Mars="Mars",n.Jupiter="Jupiter",n.Saturn="Saturn",n.Uranus="Uranus",n.Neptune="Neptune",n.Pluto="Pluto",n.SSB="SSB",n.EMB="EMB",n.Star1="Star1",n.Star2="Star2",n.Star3="Star3",n.Star4="Star4",n.Star5="Star5",n.Star6="Star6",n.Star7="Star7",n.Star8="Star8"})(p||(p={}));const ya=[p.Star1,p.Star2,p.Star3,p.Star4,p.Star5,p.Star6,p.Star7,p.Star8],fa=[{ra:0,dec:0,dist:0},{ra:0,dec:0,dist:0},{ra:0,dec:0,dist:0},{ra:0,dec:0,dist:0},{ra:0,dec:0,dist:0},{ra:0,dec:0,dist:0},{ra:0,dec:0,dist:0},{ra:0,dec:0,dist:0}];function ba(n){const e=ya.indexOf(n);return e>=0?fa[e]:null}function Fn(n){const e=ba(n);return e&&e.dist>0?e:null}var J;(function(n){n[n.From2000=0]="From2000",n[n.Into2000=1]="Into2000"})(J||(J={}));const K={Mercury:[[[[4.40250710144,0,0],[.40989414977,1.48302034195,26087.9031415742],[.050462942,4.47785489551,52175.8062831484],[.00855346844,1.16520322459,78263.70942472259],[.00165590362,4.11969163423,104351.61256629678],[.00034561897,.77930768443,130439.51570787099],[7583476e-11,3.71348404924,156527.41884944518]],[[26087.90313685529,0,0],[.01131199811,6.21874197797,26087.9031415742],[.00292242298,3.04449355541,52175.8062831484],[.00075775081,6.08568821653,78263.70942472259],[.00019676525,2.80965111777,104351.61256629678]]],[[[.11737528961,1.98357498767,26087.9031415742],[.02388076996,5.03738959686,52175.8062831484],[.01222839532,3.14159265359,0],[.0054325181,1.79644363964,78263.70942472259],[.0012977877,4.83232503958,104351.61256629678],[.00031866927,1.58088495658,130439.51570787099],[7963301e-11,4.60972126127,156527.41884944518]],[[.00274646065,3.95008450011,26087.9031415742],[.00099737713,3.14159265359,0]]],[[[.39528271651,0,0],[.07834131818,6.19233722598,26087.9031415742],[.00795525558,2.95989690104,52175.8062831484],[.00121281764,6.01064153797,78263.70942472259],[.00021921969,2.77820093972,104351.61256629678],[4354065e-11,5.82894543774,130439.51570787099]],[[.0021734774,4.65617158665,26087.9031415742],[.00044141826,1.42385544001,52175.8062831484]]]],Venus:[[[[3.17614666774,0,0],[.01353968419,5.59313319619,10213.285546211],[.00089891645,5.30650047764,20426.571092422],[5477194e-11,4.41630661466,7860.4193924392],[3455741e-11,2.6996444782,11790.6290886588],[2372061e-11,2.99377542079,3930.2096962196],[1317168e-11,5.18668228402,26.2983197998],[1664146e-11,4.25018630147,1577.3435424478],[1438387e-11,4.15745084182,9683.5945811164],[1200521e-11,6.15357116043,30639.856638633]],[[10213.28554621638,0,0],[.00095617813,2.4640651111,10213.285546211],[7787201e-11,.6247848222,20426.571092422]]],[[[.05923638472,.26702775812,10213.285546211],[.00040107978,1.14737178112,20426.571092422],[.00032814918,3.14159265359,0]],[[.00287821243,1.88964962838,10213.285546211]]],[[[.72334820891,0,0],[.00489824182,4.02151831717,10213.285546211],[1658058e-11,4.90206728031,20426.571092422],[1378043e-11,1.12846591367,11790.6290886588],[1632096e-11,2.84548795207,7860.4193924392],[498395e-11,2.58682193892,9683.5945811164],[221985e-11,2.01346696541,19367.1891622328],[237454e-11,2.55136053886,15720.8387848784]],[[.00034551041,.89198706276,10213.285546211]]]],Earth:[[[[1.75347045673,0,0],[.03341656453,4.66925680415,6283.0758499914],[.00034894275,4.62610242189,12566.1516999828],[3417572e-11,2.82886579754,3.523118349],[3497056e-11,2.74411783405,5753.3848848968],[3135899e-11,3.62767041756,77713.7714681205],[2676218e-11,4.41808345438,7860.4193924392],[2342691e-11,6.13516214446,3930.2096962196],[1273165e-11,2.03709657878,529.6909650946],[1324294e-11,.74246341673,11506.7697697936],[901854e-11,2.04505446477,26.2983197998],[1199167e-11,1.10962946234,1577.3435424478],[857223e-11,3.50849152283,398.1490034082],[779786e-11,1.17882681962,5223.6939198022],[99025e-10,5.23268072088,5884.9268465832],[753141e-11,2.53339052847,5507.5532386674],[505267e-11,4.58292599973,18849.2275499742],[492392e-11,4.20505711826,775.522611324],[356672e-11,2.91954114478,.0673103028],[284125e-11,1.89869240932,796.2980068164],[242879e-11,.34481445893,5486.777843175],[317087e-11,5.84901948512,11790.6290886588],[271112e-11,.31486255375,10977.078804699],[206217e-11,4.80646631478,2544.3144198834],[205478e-11,1.86953770281,5573.1428014331],[202318e-11,2.45767790232,6069.7767545534],[126225e-11,1.08295459501,20.7753954924],[155516e-11,.83306084617,213.299095438]],[[6283.0758499914,0,0],[.00206058863,2.67823455808,6283.0758499914],[4303419e-11,2.63512233481,12566.1516999828]],[[8721859e-11,1.07253635559,6283.0758499914]]],[[],[[.00227777722,3.4137662053,6283.0758499914],[3805678e-11,3.37063423795,12566.1516999828]]],[[[1.00013988784,0,0],[.01670699632,3.09846350258,6283.0758499914],[.00013956024,3.05524609456,12566.1516999828],[308372e-10,5.19846674381,77713.7714681205],[1628463e-11,1.17387558054,5753.3848848968],[1575572e-11,2.84685214877,7860.4193924392],[924799e-11,5.45292236722,11506.7697697936],[542439e-11,4.56409151453,3930.2096962196],[47211e-10,3.66100022149,5884.9268465832],[85831e-11,1.27079125277,161000.6857376741],[57056e-11,2.01374292245,83996.84731811189],[55736e-11,5.2415979917,71430.69561812909],[174844e-11,3.01193636733,18849.2275499742],[243181e-11,4.2734953079,11790.6290886588]],[[.00103018607,1.10748968172,6283.0758499914],[1721238e-11,1.06442300386,12566.1516999828]],[[4359385e-11,5.78455133808,6283.0758499914]]]],Mars:[[[[6.20347711581,0,0],[.18656368093,5.0503710027,3340.6124266998],[.01108216816,5.40099836344,6681.2248533996],[.00091798406,5.75478744667,10021.8372800994],[.00027744987,5.97049513147,3.523118349],[.00010610235,2.93958560338,2281.2304965106],[.00012315897,.84956094002,2810.9214616052],[8926784e-11,4.15697846427,.0172536522],[8715691e-11,6.11005153139,13362.4497067992],[6797556e-11,.36462229657,398.1490034082],[7774872e-11,3.33968761376,5621.8429232104],[3575078e-11,1.6618650571,2544.3144198834],[4161108e-11,.22814971327,2942.4634232916],[3075252e-11,.85696614132,191.4482661116],[2628117e-11,.64806124465,3337.0893083508],[2937546e-11,6.07893711402,.0673103028],[2389414e-11,5.03896442664,796.2980068164],[2579844e-11,.02996736156,3344.1355450488],[1528141e-11,1.14979301996,6151.533888305],[1798806e-11,.65634057445,529.6909650946],[1264357e-11,3.62275122593,5092.1519581158],[1286228e-11,3.06796065034,2146.1654164752],[1546404e-11,2.91579701718,1751.539531416],[1024902e-11,3.69334099279,8962.4553499102],[891566e-11,.18293837498,16703.062133499],[858759e-11,2.4009381194,2914.0142358238],[832715e-11,2.46418619474,3340.5951730476],[83272e-10,4.49495782139,3340.629680352],[712902e-11,3.66335473479,1059.3819301892],[748723e-11,3.82248614017,155.4203994342],[723861e-11,.67497311481,3738.761430108],[635548e-11,2.92182225127,8432.7643848156],[655162e-11,.48864064125,3127.3133312618],[550474e-11,3.81001042328,.9803210682],[55275e-10,4.47479317037,1748.016413067],[425966e-11,.55364317304,6283.0758499914],[415131e-11,.49662285038,213.299095438],[472167e-11,3.62547124025,1194.4470102246],[306551e-11,.38052848348,6684.7479717486],[312141e-11,.99853944405,6677.7017350506],[293198e-11,4.22131299634,20.7753954924],[302375e-11,4.48618007156,3532.0606928114],[274027e-11,.54222167059,3340.545116397],[281079e-11,5.88163521788,1349.8674096588],[231183e-11,1.28242156993,3870.3033917944],[283602e-11,5.7688543494,3149.1641605882],[236117e-11,5.75503217933,3333.498879699],[274033e-11,.13372524985,3340.6797370026],[299395e-11,2.78323740866,6254.6266625236]],[[3340.61242700512,0,0],[.01457554523,3.60433733236,3340.6124266998],[.00168414711,3.92318567804,6681.2248533996],[.00020622975,4.26108844583,10021.8372800994],[3452392e-11,4.7321039319,3.523118349],[2586332e-11,4.60670058555,13362.4497067992],[841535e-11,4.45864030426,2281.2304965106]],[[.00058152577,2.04961712429,3340.6124266998],[.00013459579,2.45738706163,6681.2248533996]]],[[[.03197134986,3.76832042431,3340.6124266998],[.00298033234,4.10616996305,6681.2248533996],[.00289104742,0,0],[.00031365539,4.4465105309,10021.8372800994],[34841e-9,4.7881254926,13362.4497067992]],[[.00217310991,6.04472194776,3340.6124266998],[.00020976948,3.14159265359,0],[.00012834709,1.60810667915,6681.2248533996]]],[[[1.53033488271,0,0],[.1418495316,3.47971283528,3340.6124266998],[.00660776362,3.81783443019,6681.2248533996],[.00046179117,4.15595316782,10021.8372800994],[8109733e-11,5.55958416318,2810.9214616052],[7485318e-11,1.77239078402,5621.8429232104],[5523191e-11,1.3643630377,2281.2304965106],[382516e-10,4.49407183687,13362.4497067992],[2306537e-11,.09081579001,2544.3144198834],[1999396e-11,5.36059617709,3337.0893083508],[2484394e-11,4.9254563992,2942.4634232916],[1960195e-11,4.74249437639,3344.1355450488],[1167119e-11,2.11260868341,5092.1519581158],[1102816e-11,5.00908403998,398.1490034082],[899066e-11,4.40791133207,529.6909650946],[992252e-11,5.83861961952,6151.533888305],[807354e-11,2.10217065501,1059.3819301892],[797915e-11,3.44839203899,796.2980068164],[740975e-11,1.49906336885,2146.1654164752]],[[.01107433345,2.03250524857,3340.6124266998],[.00103175887,2.37071847807,6681.2248533996],[128772e-9,0,0],[.0001081588,2.70888095665,10021.8372800994]],[[.00044242249,.47930604954,3340.6124266998],[8138042e-11,.86998389204,6681.2248533996]]]],Jupiter:[[[[.59954691494,0,0],[.09695898719,5.06191793158,529.6909650946],[.00573610142,1.44406205629,7.1135470008],[.00306389205,5.41734730184,1059.3819301892],[.00097178296,4.14264726552,632.7837393132],[.00072903078,3.64042916389,522.5774180938],[.00064263975,3.41145165351,103.0927742186],[.00039806064,2.29376740788,419.4846438752],[.00038857767,1.27231755835,316.3918696566],[.00027964629,1.7845459182,536.8045120954],[.0001358973,5.7748104079,1589.0728952838],[8246349e-11,3.5822792584,206.1855484372],[8768704e-11,3.63000308199,949.1756089698],[7368042e-11,5.0810119427,735.8765135318],[626315e-10,.02497628807,213.299095438],[6114062e-11,4.51319998626,1162.4747044078],[4905396e-11,1.32084470588,110.2063212194],[5305285e-11,1.30671216791,14.2270940016],[5305441e-11,4.18625634012,1052.2683831884],[4647248e-11,4.69958103684,3.9321532631],[3045023e-11,4.31676431084,426.598190876],[2609999e-11,1.56667394063,846.0828347512],[2028191e-11,1.06376530715,3.1813937377],[1764763e-11,2.14148655117,1066.49547719],[1722972e-11,3.88036268267,1265.5674786264],[1920945e-11,.97168196472,639.897286314],[1633223e-11,3.58201833555,515.463871093],[1431999e-11,4.29685556046,625.6701923124],[973272e-11,4.09764549134,95.9792272178]],[[529.69096508814,0,0],[.00489503243,4.2208293947,529.6909650946],[.00228917222,6.02646855621,7.1135470008],[.00030099479,4.54540782858,1059.3819301892],[.0002072092,5.45943156902,522.5774180938],[.00012103653,.16994816098,536.8045120954],[6067987e-11,4.42422292017,103.0927742186],[5433968e-11,3.98480737746,419.4846438752],[4237744e-11,5.89008707199,14.2270940016]],[[.00047233601,4.32148536482,7.1135470008],[.00030649436,2.929777887,529.6909650946],[.00014837605,3.14159265359,0]]],[[[.02268615702,3.55852606721,529.6909650946],[.00109971634,3.90809347197,1059.3819301892],[.00110090358,0,0],[8101428e-11,3.60509572885,522.5774180938],[6043996e-11,4.25883108339,1589.0728952838],[6437782e-11,.30627119215,536.8045120954]],[[.00078203446,1.52377859742,529.6909650946]]],[[[5.20887429326,0,0],[.25209327119,3.49108639871,529.6909650946],[.00610599976,3.84115365948,1059.3819301892],[.00282029458,2.57419881293,632.7837393132],[.00187647346,2.07590383214,522.5774180938],[.00086792905,.71001145545,419.4846438752],[.00072062974,.21465724607,536.8045120954],[.00065517248,5.9799588479,316.3918696566],[.00029134542,1.67759379655,103.0927742186],[.00030135335,2.16132003734,949.1756089698],[.00023453271,3.54023522184,735.8765135318],[.00022283743,4.19362594399,1589.0728952838],[.00023947298,.2745803748,7.1135470008],[.00013032614,2.96042965363,1162.4747044078],[970336e-10,1.90669633585,206.1855484372],[.00012749023,2.71550286592,1052.2683831884],[7057931e-11,2.18184839926,1265.5674786264],[6137703e-11,6.26418240033,846.0828347512],[2616976e-11,2.00994012876,1581.959348283]],[[.0127180152,2.64937512894,529.6909650946],[.00061661816,3.00076460387,1059.3819301892],[.00053443713,3.89717383175,522.5774180938],[.00031185171,4.88276958012,536.8045120954],[.00041390269,0,0]]]],Saturn:[[[[.87401354025,0,0],[.11107659762,3.96205090159,213.299095438],[.01414150957,4.58581516874,7.1135470008],[.00398379389,.52112032699,206.1855484372],[.00350769243,3.30329907896,426.598190876],[.00206816305,.24658372002,103.0927742186],[792713e-9,3.84007056878,220.4126424388],[.00023990355,4.66976924553,110.2063212194],[.00016573588,.43719228296,419.4846438752],[.00014906995,5.76903183869,316.3918696566],[.0001582029,.93809155235,632.7837393132],[.00014609559,1.56518472,3.9321532631],[.00013160301,4.44891291899,14.2270940016],[.00015053543,2.71669915667,639.897286314],[.00013005299,5.98119023644,11.0457002639],[.00010725067,3.12939523827,202.2533951741],[5863206e-11,.23656938524,529.6909650946],[5227757e-11,4.20783365759,3.1813937377],[6126317e-11,1.76328667907,277.0349937414],[5019687e-11,3.17787728405,433.7117378768],[459255e-10,.61977744975,199.0720014364],[4005867e-11,2.24479718502,63.7358983034],[2953796e-11,.98280366998,95.9792272178],[387367e-10,3.22283226966,138.5174968707],[2461186e-11,2.03163875071,735.8765135318],[3269484e-11,.77492638211,949.1756089698],[1758145e-11,3.2658010994,522.5774180938],[1640172e-11,5.5050445305,846.0828347512],[1391327e-11,4.02333150505,323.5054166574],[1580648e-11,4.37265307169,309.2783226558],[1123498e-11,2.83726798446,415.5524906121],[1017275e-11,3.71700135395,227.5261894396],[848642e-11,3.1915017083,209.3669421749]],[[213.2990952169,0,0],[.01297370862,1.82834923978,213.299095438],[.00564345393,2.88499717272,7.1135470008],[.00093734369,1.06311793502,426.598190876],[.00107674962,2.27769131009,206.1855484372],[.00040244455,2.04108104671,220.4126424388],[.00019941774,1.2795439047,103.0927742186],[.00010511678,2.7488034213,14.2270940016],[6416106e-11,.38238295041,639.897286314],[4848994e-11,2.43037610229,419.4846438752],[4056892e-11,2.92133209468,110.2063212194],[3768635e-11,3.6496533078,3.9321532631]],[[.0011644133,1.17988132879,7.1135470008],[.00091841837,.0732519584,213.299095438],[.00036661728,0,0],[.00015274496,4.06493179167,206.1855484372]]],[[[.04330678039,3.60284428399,213.299095438],[.00240348302,2.85238489373,426.598190876],[.00084745939,0,0],[.00030863357,3.48441504555,220.4126424388],[.00034116062,.57297307557,206.1855484372],[.0001473407,2.11846596715,639.897286314],[9916667e-11,5.79003188904,419.4846438752],[6993564e-11,4.7360468972,7.1135470008],[4807588e-11,5.43305312061,316.3918696566]],[[.00198927992,4.93901017903,213.299095438],[.00036947916,3.14159265359,0],[.00017966989,.5197943111,426.598190876]]],[[[9.55758135486,0,0],[.52921382865,2.39226219573,213.299095438],[.01873679867,5.2354960466,206.1855484372],[.01464663929,1.64763042902,426.598190876],[.00821891141,5.93520042303,316.3918696566],[.00547506923,5.0153261898,103.0927742186],[.0037168465,2.27114821115,220.4126424388],[.00361778765,3.13904301847,7.1135470008],[.00140617506,5.70406606781,632.7837393132],[.00108974848,3.29313390175,110.2063212194],[.00069006962,5.94099540992,419.4846438752],[.00061053367,.94037691801,639.897286314],[.00048913294,1.55733638681,202.2533951741],[.00034143772,.19519102597,277.0349937414],[.00032401773,5.47084567016,949.1756089698],[.00020936596,.46349251129,735.8765135318],[9796004e-11,5.20477537945,1265.5674786264],[.00011993338,5.98050967385,846.0828347512],[208393e-9,1.52102476129,433.7117378768],[.00015298404,3.0594381494,529.6909650946],[6465823e-11,.17732249942,1052.2683831884],[.00011380257,1.7310542704,522.5774180938],[3419618e-11,4.94550542171,1581.959348283]],[[.0618298134,.2584351148,213.299095438],[.00506577242,.71114625261,206.1855484372],[.00341394029,5.79635741658,426.598190876],[.00188491195,.47215589652,220.4126424388],[.00186261486,3.14159265359,0],[.00143891146,1.40744822888,7.1135470008]],[[.00436902572,4.78671677509,213.299095438]]]],Uranus:[[[[5.48129294297,0,0],[.09260408234,.89106421507,74.7815985673],[.01504247898,3.6271926092,1.4844727083],[.00365981674,1.89962179044,73.297125859],[.00272328168,3.35823706307,149.5631971346],[.00070328461,5.39254450063,63.7358983034],[.00068892678,6.09292483287,76.2660712756],[.00061998615,2.26952066061,2.9689454166],[.00061950719,2.85098872691,11.0457002639],[.0002646877,3.14152083966,71.8126531507],[.00025710476,6.11379840493,454.9093665273],[.0002107885,4.36059339067,148.0787244263],[.00017818647,1.74436930289,36.6485629295],[.00014613507,4.73732166022,3.9321532631],[.00011162509,5.8268179635,224.3447957019],[.0001099791,.48865004018,138.5174968707],[9527478e-11,2.95516862826,35.1640902212],[7545601e-11,5.236265824,109.9456887885],[4220241e-11,3.23328220918,70.8494453042],[40519e-9,2.277550173,151.0476698429],[3354596e-11,1.0654900738,4.4534181249],[2926718e-11,4.62903718891,9.5612275556],[349034e-10,5.48306144511,146.594251718],[3144069e-11,4.75199570434,77.7505439839],[2922333e-11,5.35235361027,85.8272988312],[2272788e-11,4.36600400036,70.3281804424],[2051219e-11,1.51773566586,.1118745846],[2148602e-11,.60745949945,38.1330356378],[1991643e-11,4.92437588682,277.0349937414],[1376226e-11,2.04283539351,65.2203710117],[1666902e-11,3.62744066769,380.12776796],[1284107e-11,3.11347961505,202.2533951741],[1150429e-11,.93343589092,3.1813937377],[1533221e-11,2.58594681212,52.6901980395],[1281604e-11,.54271272721,222.8603229936],[1372139e-11,4.19641530878,111.4301614968],[1221029e-11,.1990065003,108.4612160802],[946181e-11,1.19253165736,127.4717966068],[1150989e-11,4.17898916639,33.6796175129]],[[74.7815986091,0,0],[.00154332863,5.24158770553,74.7815985673],[.00024456474,1.71260334156,1.4844727083],[9258442e-11,.4282973235,11.0457002639],[8265977e-11,1.50218091379,63.7358983034],[915016e-10,1.41213765216,149.5631971346]]],[[[.01346277648,2.61877810547,74.7815985673],[623414e-9,5.08111189648,149.5631971346],[.00061601196,3.14159265359,0],[9963722e-11,1.61603805646,76.2660712756],[992616e-10,.57630380333,73.297125859]],[[.00034101978,.01321929936,74.7815985673]]],[[[19.21264847206,0,0],[.88784984413,5.60377527014,74.7815985673],[.03440836062,.32836099706,73.297125859],[.0205565386,1.7829515933,149.5631971346],[.0064932241,4.52247285911,76.2660712756],[.00602247865,3.86003823674,63.7358983034],[.00496404167,1.40139935333,454.9093665273],[.00338525369,1.58002770318,138.5174968707],[.00243509114,1.57086606044,71.8126531507],[.00190522303,1.99809394714,1.4844727083],[.00161858838,2.79137786799,148.0787244263],[.00143706183,1.38368544947,11.0457002639],[.00093192405,.17437220467,36.6485629295],[.00071424548,4.24509236074,224.3447957019],[.00089806014,3.66105364565,109.9456887885],[.00039009723,1.66971401684,70.8494453042],[.00046677296,1.39976401694,35.1640902212],[.00039025624,3.36234773834,277.0349937414],[.00036755274,3.88649278513,146.594251718],[.00030348723,.70100838798,151.0476698429],[.00029156413,3.180563367,77.7505439839],[.00022637073,.72518687029,529.6909650946],[.00011959076,1.7504339214,984.6003316219],[.00025620756,5.25656086672,380.12776796]],[[.01479896629,3.67205697578,74.7815985673]]]],Neptune:[[[[5.31188633046,0,0],[.0179847553,2.9010127389,38.1330356378],[.01019727652,.48580922867,1.4844727083],[.00124531845,4.83008090676,36.6485629295],[.00042064466,5.41054993053,2.9689454166],[.00037714584,6.09221808686,35.1640902212],[.00033784738,1.24488874087,76.2660712756],[.00016482741,7727998e-11,491.5579294568],[9198584e-11,4.93747051954,39.6175083461],[899425e-10,.27462171806,175.1660598002]],[[38.13303563957,0,0],[.00016604172,4.86323329249,1.4844727083],[.00015744045,2.27887427527,38.1330356378]]],[[[.03088622933,1.44104372644,38.1330356378],[.00027780087,5.91271884599,76.2660712756],[.00027623609,0,0],[.00015355489,2.52123799551,36.6485629295],[.00015448133,3.50877079215,39.6175083461]]],[[[30.07013205828,0,0],[.27062259632,1.32999459377,38.1330356378],[.01691764014,3.25186135653,36.6485629295],[.00807830553,5.18592878704,1.4844727083],[.0053776051,4.52113935896,35.1640902212],[.00495725141,1.5710564165,491.5579294568],[.00274571975,1.84552258866,175.1660598002],[.0001201232,1.92059384991,1021.2488945514],[.00121801746,5.79754470298,76.2660712756],[.00100896068,.3770272493,73.297125859],[.00135134092,3.37220609835,39.6175083461],[7571796e-11,1.07149207335,388.4651552382]]]]};function wa(n){var e,t,a,o,i,r,s;const l=2e3+(n-14)/la;return l<-500?(e=(l-1820)/100,-20+32*e*e):l<500?(e=l/100,t=e*e,a=e*t,o=t*t,i=t*a,r=a*a,10583.6-1014.41*e+33.78311*t-5.952053*a-.1798452*o+.022174192*i+.0090316521*r):l<1600?(e=(l-1e3)/100,t=e*e,a=e*t,o=t*t,i=t*a,r=a*a,1574.2-556.01*e+71.23472*t+.319781*a-.8503463*o-.005050998*i+.0083572073*r):l<1700?(e=l-1600,t=e*e,a=e*t,120-.9808*e-.01532*t+a/7129):l<1800?(e=l-1700,t=e*e,a=e*t,o=t*t,8.83+.1603*e-.0059285*t+13336e-8*a-o/1174e3):l<1860?(e=l-1800,t=e*e,a=e*t,o=t*t,i=t*a,r=a*a,s=a*o,13.72-.332447*e+.0068612*t+.0041116*a-37436e-8*o+121272e-10*i-1699e-10*r+875e-12*s):l<1900?(e=l-1860,t=e*e,a=e*t,o=t*t,i=t*a,7.62+.5737*e-.251754*t+.01680668*a-.0004473624*o+i/233174):l<1920?(e=l-1900,t=e*e,a=e*t,o=t*t,-2.79+1.494119*e-.0598939*t+.0061966*a-197e-6*o):l<1941?(e=l-1920,t=e*e,a=e*t,21.2+.84493*e-.0761*t+.0020936*a):l<1961?(e=l-1950,t=e*e,a=e*t,29.07+.407*e-t/233+a/2547):l<1986?(e=l-1975,t=e*e,a=e*t,45.45+1.067*e-t/260-a/718):l<2005?(e=l-2e3,t=e*e,a=e*t,o=t*t,i=t*a,63.86+.3345*e-.060374*t+.0017275*a+651814e-9*o+2373599e-11*i):l<2050?(e=l-2e3,62.92+.32217*e+.005589*e*e):l<2150?(e=(l-1820)/100,-20+32*e*e-.5628*(2150-l)):(e=(l-1820)/100,-20+32*e*e)}let va=wa;function at(n){return n+va(n)/86400}class oe{constructor(e){if(e instanceof oe){this.date=e.date,this.ut=e.ut,this.tt=e.tt;return}const t=1e3*3600*24;if(e instanceof Date&&Number.isFinite(e.getTime())){this.date=e,this.ut=(e.getTime()-nt.getTime())/t,this.tt=at(this.ut);return}if(Number.isFinite(e)){this.date=new Date(nt.getTime()+e*t),this.ut=e,this.tt=at(this.ut);return}throw"Argument must be a Date object, an AstroTime object, or a numeric UTC Julian date."}static FromTerrestrialTime(e){let t=new oe(e);for(;;){const a=e-t.tt;if(Math.abs(a)<1e-12)return t;t=t.AddDays(a)}}toString(){return this.date.toISOString()}AddDays(e){return new oe(this.ut+e)}}function Ta(n,e,t){return new oe(n.ut+t*(e.ut-n.ut))}function P(n){return n instanceof oe?n:new oe(n)}function Ia(n){function e(g){return g%ha*de}const t=n.tt/36525,a=e(128710479305e-5+t*1295965810481e-4),o=e(335779.526232+t*17395272628478e-4),i=e(107226070369e-5+t*1602961601209e-3),r=e(450160.398036-t*69628905431e-4);let s=Math.sin(r),l=Math.cos(r),h=(-172064161-174666*t)*s+33386*l,d=(92052331+9086*t)*l+15377*s,c=2*(o-i+r);return s=Math.sin(c),l=Math.cos(c),h+=(-13170906-1675*t)*s-13696*l,d+=(5730336-3015*t)*l-4587*s,c=2*(o+r),s=Math.sin(c),l=Math.cos(c),h+=(-2276413-234*t)*s+2796*l,d+=(978459-485*t)*l+1374*s,c=2*r,s=Math.sin(c),l=Math.cos(c),h+=(2074554+207*t)*s-698*l,d+=(-897492+470*t)*l-291*s,s=Math.sin(a),l=Math.cos(a),h+=(1475877-3633*t)*s+11817*l,d+=(73871-184*t)*l-1924*s,{dpsi:-135e-6+h*1e-7,deps:388e-6+d*1e-7}}function Et(n){var e=n.tt/36525,t=((((-434e-10*e-576e-9)*e+.0020034)*e-1831e-7)*e-46.836769)*e+84381.406;return t/3600}var Ce;function Rt(n){if(!Ce||Math.abs(Ce.tt-n.tt)>1e-6){const e=Ia(n),t=Et(n),a=t+e.deps/3600;Ce={tt:n.tt,dpsi:e.dpsi,deps:e.deps,ee:e.dpsi*Math.cos(t*W)/15,mobl:t,tobl:a}}return Ce}function ka(n,e){const t=n*W,a=Math.cos(t),o=Math.sin(t);return[e[0],e[1]*a-e[2]*o,e[1]*o+e[2]*a]}function Aa(n,e){return ka(Et(n),e)}function xa(n){const e=n.tt/36525;function t(w,I){const S=[];let R;for(R=0;R<=I-w;++R)S.push(0);return{min:w,array:S}}function a(w,I,S,R){const C=[];for(let Q=0;Q<=I-w;++Q)C.push(t(S,R));return{min:w,array:C}}function o(w,I,S){const R=w.array[I-w.min];return R.array[S-R.min]}function i(w,I,S,R){const C=w.array[I-w.min];C.array[S-C.min]=R}let r,s,l,h,d,c,g,b,f,T,M,F,L,H,Y,G,fe,re,Un,Ge,$n,Vn,Ue,Kn=a(-6,6,1,4),Jn=a(-6,6,1,4);function Ae(w,I){return o(Kn,w,I)}function xe(w,I){return o(Jn,w,I)}function Se(w,I,S){return i(Kn,w,I,S)}function Ee(w,I,S){return i(Jn,w,I,S)}function Qn(w,I,S,R,C){C(w*S-I*R,I*S+w*R)}function x(w){return Math.sin($*w)}g=e*e,f=0,Ue=0,M=0,F=3422.7;var Re=x(.19833+.05611*e),$e=x(.27869+.04508*e),Ve=x(.16827-.36903*e),Ke=x(.34734-5.37261*e),Je=x(.10498-5.37899*e),Me=x(.42681-.41855*e),Qt=x(.14943-5.37511*e);for(re=.84*Re+.31*$e+14.27*Ve+7.26*Ke+.28*Je+.24*Me,Un=2.94*Re+.31*$e+14.27*Ve+9.34*Ke+1.12*Je+.83*Me,Ge=-6.4*Re-1.89*Me,$n=.21*Re+.31*$e+14.27*Ve-88.7*Ke-15.3*Je+.24*Me-1.86*Qt,Vn=re-Ge,b=-3332e-9*x(.59734-5.37261*e)-539e-9*x(.35498-5.37899*e)-64e-9*x(.39943-5.37511*e),L=$*le(.60643382+1336.85522467*e-313e-8*g)+re/X,H=$*le(.37489701+1325.55240982*e+2565e-8*g)+Un/X,Y=$*le(.99312619+99.99735956*e-44e-8*g)+Ge/X,G=$*le(.25909118+1342.2278298*e-892e-8*g)+$n/X,fe=$*le(.82736186+1236.85308708*e-397e-8*g)+Vn/X,d=1;d<=4;++d){switch(d){case 1:l=H,s=4,h=1.000002208;break;case 2:l=Y,s=3,h=.997504612-.002495388*e;break;case 3:l=G,s=4,h=1.000002708+139.978*b;break;case 4:l=fe,s=6,h=1;break;default:throw`Internal error: I = ${d}`}for(Se(0,d,1),Se(1,d,Math.cos(l)*h),Ee(0,d,0),Ee(1,d,Math.sin(l)*h),c=2;c<=s;++c)Qn(Ae(c-1,d),xe(c-1,d),Ae(1,d),xe(1,d),(w,I)=>(Se(c,d,w),Ee(c,d,I)));for(c=1;c<=s;++c)Se(-c,d,Ae(c,d)),Ee(-c,d,-xe(c,d))}function Xn(w,I,S,R){for(var C={x:1,y:0},Q=[0,w,I,S,R],U=1;U<=4;++U)Q[U]!==0&&Qn(C.x,C.y,Ae(Q[U],U),xe(Q[U],U),(Qe,se)=>(C.x=Qe,C.y=se));return C}function u(w,I,S,R,C,Q,U,Qe){var se=Xn(C,Q,U,Qe);f+=w*se.y,Ue+=I*se.y,M+=S*se.x,F+=R*se.x}u(13.902,14.06,-.001,.2607,0,0,0,4),u(.403,-4.01,.394,.0023,0,0,0,3),u(2369.912,2373.36,.601,28.2333,0,0,0,2),u(-125.154,-112.79,-.725,-.9781,0,0,0,1),u(1.979,6.98,-.445,.0433,1,0,0,4),u(191.953,192.72,.029,3.0861,1,0,0,2),u(-8.466,-13.51,.455,-.1093,1,0,0,1),u(22639.5,22609.07,.079,186.5398,1,0,0,0),u(18.609,3.59,-.094,.0118,1,0,0,-1),u(-4586.465,-4578.13,-.077,34.3117,1,0,0,-2),u(3.215,5.44,.192,-.0386,1,0,0,-3),u(-38.428,-38.64,.001,.6008,1,0,0,-4),u(-.393,-1.43,-.092,.0086,1,0,0,-6),u(-.289,-1.59,.123,-.0053,0,1,0,4),u(-24.42,-25.1,.04,-.3,0,1,0,2),u(18.023,17.93,.007,.1494,0,1,0,1),u(-668.146,-126.98,-1.302,-.3997,0,1,0,0),u(.56,.32,-.001,-.0037,0,1,0,-1),u(-165.145,-165.06,.054,1.9178,0,1,0,-2),u(-1.877,-6.46,-.416,.0339,0,1,0,-4),u(.213,1.02,-.074,.0054,2,0,0,4),u(14.387,14.78,-.017,.2833,2,0,0,2),u(-.586,-1.2,.054,-.01,2,0,0,1),u(769.016,767.96,.107,10.1657,2,0,0,0),u(1.75,2.01,-.018,.0155,2,0,0,-1),u(-211.656,-152.53,5.679,-.3039,2,0,0,-2),u(1.225,.91,-.03,-.0088,2,0,0,-3),u(-30.773,-34.07,-.308,.3722,2,0,0,-4),u(-.57,-1.4,-.074,.0109,2,0,0,-6),u(-2.921,-11.75,.787,-.0484,1,1,0,2),u(1.267,1.52,-.022,.0164,1,1,0,1),u(-109.673,-115.18,.461,-.949,1,1,0,0),u(-205.962,-182.36,2.056,1.4437,1,1,0,-2),u(.233,.36,.012,-.0025,1,1,0,-3),u(-4.391,-9.66,-.471,.0673,1,1,0,-4),u(.283,1.53,-.111,.006,1,-1,0,4),u(14.577,31.7,-1.54,.2302,1,-1,0,2),u(147.687,138.76,.679,1.1528,1,-1,0,0),u(-1.089,.55,.021,0,1,-1,0,-1),u(28.475,23.59,-.443,-.2257,1,-1,0,-2),u(-.276,-.38,-.006,-.0036,1,-1,0,-3),u(.636,2.27,.146,-.0102,1,-1,0,-4),u(-.189,-1.68,.131,-.0028,0,2,0,2),u(-7.486,-.66,-.037,-.0086,0,2,0,0),u(-8.096,-16.35,-.74,.0918,0,2,0,-2),u(-5.741,-.04,0,-9e-4,0,0,2,2),u(.255,0,0,0,0,0,2,1),u(-411.608,-.2,0,-.0124,0,0,2,0),u(.584,.84,0,.0071,0,0,2,-1),u(-55.173,-52.14,0,-.1052,0,0,2,-2),u(.254,.25,0,-.0017,0,0,2,-3),u(.025,-1.67,0,.0031,0,0,2,-4),u(1.06,2.96,-.166,.0243,3,0,0,2),u(36.124,50.64,-1.3,.6215,3,0,0,0),u(-13.193,-16.4,.258,-.1187,3,0,0,-2),u(-1.187,-.74,.042,.0074,3,0,0,-4),u(-.293,-.31,-.002,.0046,3,0,0,-6),u(-.29,-1.45,.116,-.0051,2,1,0,2),u(-7.649,-10.56,.259,-.1038,2,1,0,0),u(-8.627,-7.59,.078,-.0192,2,1,0,-2),u(-2.74,-2.54,.022,.0324,2,1,0,-4),u(1.181,3.32,-.212,.0213,2,-1,0,2),u(9.703,11.67,-.151,.1268,2,-1,0,0),u(-.352,-.37,.001,-.0028,2,-1,0,-1),u(-2.494,-1.17,-.003,-.0017,2,-1,0,-2),u(.36,.2,-.012,-.0043,2,-1,0,-4),u(-1.167,-1.25,.008,-.0106,1,2,0,0),u(-7.412,-6.12,.117,.0484,1,2,0,-2),u(-.311,-.65,-.032,.0044,1,2,0,-4),u(.757,1.82,-.105,.0112,1,-2,0,2),u(2.58,2.32,.027,.0196,1,-2,0,0),u(2.533,2.4,-.014,-.0212,1,-2,0,-2),u(-.344,-.57,-.025,.0036,0,3,0,-2),u(-.992,-.02,0,0,1,0,2,2),u(-45.099,-.02,0,-.001,1,0,2,0),u(-.179,-9.52,0,-.0833,1,0,2,-2),u(-.301,-.33,0,.0014,1,0,2,-4),u(-6.382,-3.37,0,-.0481,1,0,-2,2),u(39.528,85.13,0,-.7136,1,0,-2,0),u(9.366,.71,0,-.0112,1,0,-2,-2),u(.202,.02,0,0,1,0,-2,-4),u(.415,.1,0,.0013,0,1,2,0),u(-2.152,-2.26,0,-.0066,0,1,2,-2),u(-1.44,-1.3,0,.0014,0,1,-2,2),u(.384,-.04,0,0,0,1,-2,-2),u(1.938,3.6,-.145,.0401,4,0,0,0),u(-.952,-1.58,.052,-.013,4,0,0,-2),u(-.551,-.94,.032,-.0097,3,1,0,0),u(-.482,-.57,.005,-.0045,3,1,0,-2),u(.681,.96,-.026,.0115,3,-1,0,0),u(-.297,-.27,.002,-9e-4,2,2,0,-2),u(.254,.21,-.003,0,2,-2,0,-2),u(-.25,-.22,.004,.0014,1,3,0,-2),u(-3.996,0,0,4e-4,2,0,2,0),u(.557,-.75,0,-.009,2,0,2,-2),u(-.459,-.38,0,-.0053,2,0,-2,2),u(-1.298,.74,0,4e-4,2,0,-2,0),u(.538,1.14,0,-.0141,2,0,-2,-2),u(.263,.02,0,0,1,1,2,0),u(.426,.07,0,-6e-4,1,1,-2,-2),u(-.304,.03,0,3e-4,1,-1,2,0),u(-.372,-.19,0,-.0027,1,-1,-2,2),u(.418,0,0,0,0,0,4,0),u(-.33,-.04,0,0,3,0,2,0);function z(w,I,S,R,C){return w*Xn(I,S,R,C).y}T=0,T+=z(-526.069,0,0,1,-2),T+=z(-3.352,0,0,1,-4),T+=z(44.297,1,0,1,-2),T+=z(-6,1,0,1,-4),T+=z(20.599,-1,0,1,0),T+=z(-30.598,-1,0,1,-2),T+=z(-24.649,-2,0,1,0),T+=z(-2,-2,0,1,-2),T+=z(-22.571,0,1,1,-2),T+=z(10.985,0,-1,1,-2),f+=.82*x(.7736-62.5512*e)+.31*x(.0466-125.1025*e)+.35*x(.5785-25.1042*e)+.66*x(.4591+1335.8075*e)+.64*x(.313-91.568*e)+1.14*x(.148+1331.2898*e)+.21*x(.5918+1056.5859*e)+.44*x(.5784+1322.8595*e)+.24*x(.2275-5.7374*e)+.28*x(.2965+2.6929*e)+.33*x(.3132+6.3368*e),r=G+Ue/X;let Xt=(1.000002708+139.978*b)*(18518.511+1.189+M)*Math.sin(r)-6.24*Math.sin(3*r)+T;return{geo_eclip_lon:$*le((L+f/X)/$),geo_eclip_lat:Math.PI/(180*3600)*Xt,distance_au:X*pa/(.999953253*F)}}function Mt(n,e){return[n.rot[0][0]*e[0]+n.rot[1][0]*e[1]+n.rot[2][0]*e[2],n.rot[0][1]*e[0]+n.rot[1][1]*e[1]+n.rot[2][1]*e[2],n.rot[0][2]*e[0]+n.rot[1][2]*e[1]+n.rot[2][2]*e[2]]}function Nt(n,e,t){const a=Sa(e,t);return Mt(a,n)}function Sa(n,e){const t=n.tt/36525;let a=84381.406,o=((((-951e-10*t+132851e-9)*t-.00114045)*t-1.0790069)*t+5038.481507)*t,i=((((3337e-10*t-467e-9)*t-.00772503)*t+.0512623)*t-.025754)*t+a,r=((((-56e-9*t+170663e-9)*t-.00121197)*t-2.3814292)*t+10.556403)*t;a*=de,o*=de,i*=de,r*=de;const s=Math.sin(a),l=Math.cos(a),h=Math.sin(-o),d=Math.cos(-o),c=Math.sin(-i),g=Math.cos(-i),b=Math.sin(r),f=Math.cos(r),T=f*d-h*b*g,M=f*h*l+b*g*d*l-s*b*c,F=f*h*s+b*g*d*s+l*b*c,L=-b*d-h*f*g,H=-b*h*l+f*g*d*l-s*f*c,Y=-b*h*s+f*g*d*s+l*f*c,G=h*c,fe=-c*d*l-s*g,re=-c*d*s+g*l;if(e===J.Into2000)return new He([[T,M,F],[L,H,Y],[G,fe,re]]);if(e===J.From2000)return new He([[T,L,G],[M,H,fe],[F,Y,re]]);throw"Invalid precess direction"}function Ea(n,e,t){const a=Ra(e,t);return Mt(a,n)}function Ra(n,e){const t=Rt(n),a=t.mobl*W,o=t.tobl*W,i=t.dpsi*de,r=Math.cos(a),s=Math.sin(a),l=Math.cos(o),h=Math.sin(o),d=Math.cos(i),c=Math.sin(i),g=d,b=-c*r,f=-c*s,T=c*l,M=d*r*l+s*h,F=d*s*l-r*h,L=c*h,H=d*r*h-s*l,Y=d*s*h+r*l;if(e===J.From2000)return new He([[g,T,L],[b,M,H],[f,F,Y]]);if(e===J.Into2000)return new He([[g,b,f],[T,M,F],[L,H,Y]]);throw"Invalid precess direction"}class E{constructor(e,t,a,o){this.x=e,this.y=t,this.z=a,this.t=o}Length(){return Math.hypot(this.x,this.y,this.z)}}class Z{constructor(e,t,a,o,i,r,s){this.x=e,this.y=t,this.z=a,this.vx=o,this.vy=i,this.vz=r,this.t=s}}class Ma{constructor(e,t,a){this.lat=ee(e),this.lon=ee(t),this.dist=ee(a)}}class He{constructor(e){this.rot=e}}class Na{constructor(e,t,a){this.vec=e,this.elat=ee(t),this.elon=ee(a)}}function Ca(n,e,t){const a=n.x,o=n.y*e+n.z*t,i=-n.y*t+n.z*e,r=Math.hypot(a,o);let s=0;r>0&&(s=Le*Math.atan2(o,a),s<0&&(s+=360));let l=Le*Math.atan2(i,r),h=new E(a,o,i,n.t);return new Na(h,l,s)}function pe(n){const e=Rt(n.t),t=[n.x,n.y,n.z],a=Nt(t,n.t,J.From2000),[o,i,r]=Ea(a,n.t,J.From2000),s=new E(o,i,r,n.t),l=e.tobl*W;return Ca(s,Math.cos(l),Math.sin(l))}function ge(n){const e=P(n),t=xa(e),a=t.distance_au*Math.cos(t.geo_eclip_lat),o=[a*Math.cos(t.geo_eclip_lon),a*Math.sin(t.geo_eclip_lon),t.distance_au*Math.sin(t.geo_eclip_lat)],i=Aa(e,o),r=Nt(i,e,J.Into2000);return new E(r[0],r[1],r[2],e)}function Ct(n){const e=P(n),t=1e-5,a=e.AddDays(-t),o=e.AddDays(+t),i=ge(a),r=ge(o);return new Z((i.x+r.x)/2,(i.y+r.y)/2,(i.z+r.z)/2,(r.x-i.x)/(2*t),(r.y-i.y)/(2*t),(r.z-i.z)/(2*t),e)}function Da(n){const e=P(n),t=Ct(e),a=1+xt;return new Z(t.x/a,t.y/a,t.z/a,t.vx/a,t.vy/a,t.vz/a,e)}function me(n,e,t){let a=1,o=0;for(let i of n){let r=0;for(let[l,h,d]of i)r+=l*Math.cos(h+e*d);let s=a*r;t&&(s%=$),o+=s,a*=e}return o}function Ze(n,e){let t=1,a=0,o=0,i=0;for(let r of n){let s=0,l=0;for(let[h,d,c]of r){let g=d+e*c;s+=h*c*Math.sin(g),i>0&&(l+=h*Math.cos(g))}o+=i*a*l-t*s,a=t,t*=e,++i}return o}const Te=365250,gn=0,yn=1,fn=2;function bn(n){return new O(n[0]+44036e-11*n[1]-190919e-12*n[2],-479966e-12*n[0]+.917482137087*n[1]-.397776982902*n[2],.397776982902*n[1]+.917482137087*n[2])}function Dt(n,e,t){const a=t*Math.cos(e),o=Math.cos(n),i=Math.sin(n);return[a*o,a*i,t*Math.sin(e)]}function Ie(n,e){const t=e.tt/Te,a=me(n[gn],t,!0),o=me(n[yn],t,!1),i=me(n[fn],t,!1),r=Dt(a,o,i);return bn(r).ToAstroVector(e)}function wn(n,e){const t=e/Te,a=me(n[gn],t,!0),o=me(n[yn],t,!1),i=me(n[fn],t,!1),r=Ze(n[gn],t),s=Ze(n[yn],t),l=Ze(n[fn],t),h=Math.cos(a),d=Math.sin(a),c=Math.cos(o),g=Math.sin(o),b=+(l*c*h)-i*g*h*s-i*c*d*r,f=+(l*c*d)-i*g*d*s+i*c*h*r,T=+(l*g)+i*c*s,M=Dt(a,o,i),F=[b/Te,f/Te,T/Te],L=bn(M),H=bn(F);return new ie(e,L,H)}function De(n,e,t,a){const o=a/(a+Pn),i=Ie(K[t],e);n.x+=o*i.x,n.y+=o*i.y,n.z+=o*i.z}function Oa(n){const e=new E(0,0,0,n);return De(e,n,p.Jupiter,dn),De(e,n,p.Saturn,un),De(e,n,p.Uranus,mn),De(e,n,p.Neptune,pn),e}const vn=51,Pa=29200,ue=146,V=201,ae=[[-73e4,[-26.118207232108,-14.376168177825,3.384402515299],[.0016339372163656,-.0027861699588508,-.0013585880229445]],[-700800,[41.974905202127,-.448502952929,-12.770351505989],[.00073458569351457,.0022785014891658,.00048619778602049]],[-671600,[14.706930780744,44.269110540027,9.353698474772],[-.00210001479998,.00022295915939915,.00070143443551414]],[-642400,[-29.441003929957,-6.43016153057,6.858481011305],[.00084495803960544,-.0030783914758711,-.0012106305981192]],[-613200,[39.444396946234,-6.557989760571,-13.913760296463],[.0011480029005873,.0022400006880665,.00035168075922288]],[-584e3,[20.2303809507,43.266966657189,7.382966091923],[-.0019754081700585,.00053457141292226,.00075929169129793]],[-554800,[-30.65832536462,2.093818874552,9.880531138071],[61010603013347e-18,-.0031326500935382,-.00099346125151067]],[-525600,[35.737703251673,-12.587706024764,-14.677847247563],[.0015802939375649,.0021347678412429,.00019074436384343]],[-496400,[25.466295188546,41.367478338417,5.216476873382],[-.0018054401046468,.0008328308359951,.00080260156912107]],[-467200,[-29.847174904071,10.636426313081,12.297904180106],[-.00063257063052907,-.0029969577578221,-.00074476074151596]],[-438e3,[30.774692107687,-18.236637015304,-14.945535879896],[.0020113162005465,.0019353827024189,-20937793168297e-19]],[-408800,[30.243153324028,38.656267888503,2.938501750218],[-.0016052508674468,.0011183495337525,.00083333973416824]],[-379600,[-27.288984772533,18.643162147874,14.023633623329],[-.0011856388898191,-.0027170609282181,-.00049015526126399]],[-350400,[24.519605196774,-23.245756064727,-14.626862367368],[.0024322321483154,.0016062008146048,-.00023369181613312]],[-321200,[34.505274805875,35.125338586954,.557361475637],[-.0013824391637782,.0013833397561817,.00084823598806262]],[-292e3,[-23.275363915119,25.818514298769,15.055381588598],[-.0016062295460975,-.0023395961498533,-.00024377362639479]],[-262800,[17.050384798092,-27.180376290126,-13.608963321694],[.0028175521080578,.0011358749093955,-.00049548725258825]],[-233600,[38.093671910285,30.880588383337,-1.843688067413],[-.0011317697153459,.0016128814698472,.00084177586176055]],[-204400,[-18.197852930878,31.932869934309,15.438294826279],[-.0019117272501813,-.0019146495909842,-19657304369835e-18]],[-175200,[8.528924039997,-29.618422200048,-11.805400994258],[.0031034370787005,.0005139363329243,-.00077293066202546]],[-146e3,[40.94685725864,25.904973592021,-4.256336240499],[-.00083652705194051,.0018129497136404,.0008156422827306]],[-116800,[-12.326958895325,36.881883446292,15.217158258711],[-.0021166103705038,-.001481442003599,.00017401209844705]],[-87600,[-.633258375909,-30.018759794709,-9.17193287495],[.0032016994581737,-.00025279858672148,-.0010411088271861]],[-58400,[42.936048423883,20.344685584452,-6.588027007912],[-.00050525450073192,.0019910074335507,.00077440196540269]],[-29200,[-5.975910552974,40.61180995846,14.470131723673],[-.0022184202156107,-.0010562361130164,.00033652250216211]],[0,[-9.875369580774,-27.978926224737,-5.753711824704],[.0030287533248818,-.0011276087003636,-.0012651326732361]],[29200,[43.958831986165,14.214147973292,-8.808306227163],[-.00014717608981871,.0021404187242141,.00071486567806614]],[58400,[.67813676352,43.094461639362,13.243238780721],[-.0022358226110718,-.00063233636090933,.00047664798895648]],[87600,[-18.282602096834,-23.30503958666,-1.766620508028],[.0025567245263557,-.0019902940754171,-.0013943491701082]],[116800,[43.873338744526,7.700705617215,-10.814273666425],[.00023174803055677,.0022402163127924,.00062988756452032]],[146e3,[7.392949027906,44.382678951534,11.629500214854],[-.002193281545383,-.00021751799585364,.00059556516201114]],[175200,[-24.981690229261,-16.204012851426,2.466457544298],[.001819398914958,-.0026765419531201,-.0013848283502247]],[204400,[42.530187039511,.845935508021,-12.554907527683],[.00065059779150669,.0022725657282262,.00051133743202822]],[233600,[13.999526486822,44.462363044894,9.669418486465],[-.0021079296569252,.00017533423831993,.00069128485798076]],[262800,[-29.184024803031,-7.371243995762,6.493275957928],[.00093581363109681,-.0030610357109184,-.0012364201089345]],[292e3,[39.831980671753,-6.078405766765,-13.909815358656],[.0011117769689167,.0022362097830152,.00036230548231153]],[321200,[20.294955108476,43.417190420251,7.450091985932],[-.0019742157451535,.00053102050468554,.00075938408813008]],[350400,[-30.66999230216,2.318743558955,9.973480913858],[45605107450676e-18,-.0031308219926928,-.00099066533301924]],[379600,[35.626122155983,-12.897647509224,-14.777586508444],[.0016015684949743,.0021171931182284,.00018002516202204]],[408800,[26.133186148561,41.232139187599,5.00640132622],[-.0017857704419579,.00086046232702817,.00080614690298954]],[438e3,[-29.57674022923,11.863535943587,12.631323039872],[-.00072292830060955,-.0029587820140709,-.000708242964503]],[467200,[29.910805787391,-19.159019294,-15.013363865194],[.0020871080437997,.0018848372554514,-38528655083926e-18]],[496400,[31.375957451819,38.050372720763,2.433138343754],[-.0015546055556611,.0011699815465629,.00083565439266001]],[525600,[-26.360071336928,20.662505904952,14.414696258958],[-.0013142373118349,-.0026236647854842,-.00042542017598193]],[554800,[22.599441488648,-24.508879898306,-14.484045731468],[.0025454108304806,.0014917058755191,-.00030243665086079]],[584e3,[35.877864013014,33.894226366071,-.224524636277],[-.0012941245730845,.0014560427668319,.00084762160640137]],[613200,[-21.538149762417,28.204068269761,15.321973799534],[-.001731211740901,-.0021939631314577,-.0001631691327518]],[642400,[13.971521374415,-28.339941764789,-13.083792871886],[.0029334630526035,.00091860931752944,-.00059939422488627]],[671600,[39.526942044143,28.93989736011,-2.872799527539],[-.0010068481658095,.001702113288809,.00083578230511981]],[700800,[-15.576200701394,34.399412961275,15.466033737854],[-.0020098814612884,-.0017191109825989,70414782780416e-18]],[73e4,[4.24325283709,-30.118201690825,-10.707441231349],[.0031725847067411,.0001609846120227,-.00090672150593868]]];class O{constructor(e,t,a){this.x=e,this.y=t,this.z=a}clone(){return new O(this.x,this.y,this.z)}ToAstroVector(e){return new E(this.x,this.y,this.z,e)}static zero(){return new O(0,0,0)}quadrature(){return this.x*this.x+this.y*this.y+this.z*this.z}add(e){return new O(this.x+e.x,this.y+e.y,this.z+e.z)}sub(e){return new O(this.x-e.x,this.y-e.y,this.z-e.z)}incr(e){this.x+=e.x,this.y+=e.y,this.z+=e.z}decr(e){this.x-=e.x,this.y-=e.y,this.z-=e.z}mul(e){return new O(e*this.x,e*this.y,e*this.z)}div(e){return new O(this.x/e,this.y/e,this.z/e)}mean(e){return new O((this.x+e.x)/2,(this.y+e.y)/2,(this.z+e.z)/2)}neg(){return new O(-this.x,-this.y,-this.z)}}class ie{constructor(e,t,a){this.tt=e,this.r=t,this.v=a}clone(){return new ie(this.tt,this.r,this.v)}sub(e){return new ie(this.tt,this.r.sub(e.r),this.v.sub(e.v))}}function Fa(n){let[e,[t,a,o],[i,r,s]]=n;return new ie(e,new O(t,a,o),new O(i,r,s))}function Oe(n,e,t,a){const o=a/(a+Pn),i=wn(K[t],e);return n.r.incr(i.r.mul(o)),n.v.incr(i.v.mul(o)),i}function ve(n,e,t){const a=t.sub(n),o=a.quadrature();return a.mul(e/(o*Math.sqrt(o)))}class qe{constructor(e){let t=new ie(e,new O(0,0,0),new O(0,0,0));this.Jupiter=Oe(t,e,p.Jupiter,dn),this.Saturn=Oe(t,e,p.Saturn,un),this.Uranus=Oe(t,e,p.Uranus,mn),this.Neptune=Oe(t,e,p.Neptune,pn),this.Jupiter.r.decr(t.r),this.Jupiter.v.decr(t.v),this.Saturn.r.decr(t.r),this.Saturn.v.decr(t.v),this.Uranus.r.decr(t.r),this.Uranus.v.decr(t.v),this.Neptune.r.decr(t.r),this.Neptune.v.decr(t.v),this.Sun=new ie(e,t.r.mul(-1),t.v.mul(-1))}Acceleration(e){let t=ve(e,Pn,this.Sun.r);return t.incr(ve(e,dn,this.Jupiter.r)),t.incr(ve(e,un,this.Saturn.r)),t.incr(ve(e,mn,this.Uranus.r)),t.incr(ve(e,pn,this.Neptune.r)),t}}class je{constructor(e,t,a,o){this.tt=e,this.r=t,this.v=a,this.a=o}clone(){return new je(this.tt,this.r.clone(),this.v.clone(),this.a.clone())}}class Ot{constructor(e,t){this.bary=e,this.grav=t}}function We(n,e,t,a){return new O(e.x+n*(t.x+n*a.x/2),e.y+n*(t.y+n*a.y/2),e.z+n*(t.z+n*a.z/2))}function ot(n,e,t){return new O(e.x+n*t.x,e.y+n*t.y,e.z+n*t.z)}function Tn(n,e){const t=n-e.tt,a=new qe(n),o=We(t,e.r,e.v,e.a),i=a.Acceleration(o).mean(e.a),r=We(t,e.r,e.v,i),s=e.v.add(i.mul(t)),l=a.Acceleration(r),h=new je(n,r,s,l);return new Ot(a,h)}const La=[];function Pt(n,e){const t=Math.floor(n);return t<0?0:t>=e?e-1:t}function In(n){const e=Fa(n),t=new qe(e.tt),a=e.r.add(t.Sun.r),o=e.v.add(t.Sun.v),i=t.Acceleration(a),r=new je(e.tt,a,o,i);return new Ot(t,r)}function Ha(n,e){const t=ae[0][0];if(e<t||e>ae[vn-1][0])return null;const a=Pt((e-t)/Pa,vn-1);if(!n[a]){const i=n[a]=[];i[0]=In(ae[a]).grav,i[V-1]=In(ae[a+1]).grav;let r,s=i[0].tt;for(r=1;r<V-1;++r)i[r]=Tn(s+=ue,i[r-1]).grav;s=i[V-1].tt;var o=[];for(o[V-1]=i[V-1],r=V-2;r>0;--r)o[r]=Tn(s-=ue,o[r+1]).grav;for(r=V-2;r>0;--r){const l=r/(V-1);i[r].r=i[r].r.mul(1-l).add(o[r].r.mul(l)),i[r].v=i[r].v.mul(1-l).add(o[r].v.mul(l)),i[r].a=i[r].a.mul(1-l).add(o[r].a.mul(l))}}return n[a]}function it(n,e,t){let a=In(n);const o=Math.ceil((e-a.grav.tt)/t);for(let i=0;i<o;++i)a=Tn(i+1===o?e:a.grav.tt+t,a.grav);return a}function Ft(n,e){let t,a,o;const i=Ha(La,n.tt);if(i){const r=Pt((n.tt-i[0].tt)/ue,V-1),s=i[r],l=i[r+1],h=s.a.mean(l.a),d=We(n.tt-s.tt,s.r,s.v,h),c=ot(n.tt-s.tt,s.v,h),g=We(n.tt-l.tt,l.r,l.v,h),b=ot(n.tt-l.tt,l.v,h),f=(n.tt-s.tt)/ue;t=d.mul(1-f).add(g.mul(f)),a=c.mul(1-f).add(b.mul(f))}else{let r;n.tt<ae[0][0]?r=it(ae[0],n.tt,-ue):r=it(ae[vn-1],n.tt,+ue),t=r.grav.r,a=r.grav.v,o=r.bary}return o||(o=new qe(n.tt)),t=t.sub(o.Sun.r),a=a.sub(o.Sun.v),new Z(t.x,t.y,t.z,a.x,a.y,a.z,n)}function ne(n,e){var t=P(e);if(n in K)return Ie(K[n],t);if(n===p.Pluto){const r=Ft(t);return new E(r.x,r.y,r.z,t)}if(n===p.Sun)return new E(0,0,0,t);if(n===p.Moon){var a=Ie(K.Earth,t),o=ge(t);return new E(a.x+o.x,a.y+o.y,a.z+o.z,t)}if(n===p.EMB){const r=Ie(K.Earth,t),s=ge(t),l=1+xt;return new E(r.x+s.x/l,r.y+s.y/l,r.z+s.z/l,t)}if(n===p.SSB)return Oa(t);const i=Fn(n);if(i){const r=new Ma(i.dec,15*i.ra,i.dist);return Za(r,t)}throw`HelioVector: Unknown body "${n}"`}function Wa(n,e){let t=e,a=0;for(let o=0;o<10;++o){const i=n(t),r=i.Length()/It;if(r>1)throw"Object is too distant for light-travel solver.";const s=e.AddDays(-r);if(a=Math.abs(s.tt-t.tt),a<1e-9)return i;t=s}throw`Light-travel time solver did not converge: dt = ${a}`}class Ya{constructor(e,t,a,o){this.observerBody=e,this.targetBody=t,this.aberration=a,this.observerPos=o}Position(e){this.aberration&&(this.observerPos=ne(this.observerBody,e));const t=ne(this.targetBody,e);return new E(t.x-this.observerPos.x,t.y-this.observerPos.y,t.z-this.observerPos.z,e)}}function za(n,e,t,a){St(a);const o=P(n);if(Fn(t)){const s=ne(t,o);if(a){const h=_a(e,o),d=new E(s.x-h.x,s.y-h.y,s.z-h.z,o),c=It/d.Length();return new E(d.x+h.vx/c,d.y+h.vy/c,d.z+h.vz/c,o)}const l=ne(e,o);return new E(s.x-l.x,s.y-l.y,s.z-l.z,o)}let i;a?i=new E(0,0,0,o):i=ne(e,o);const r=new Ya(e,t,a,i);return Wa(s=>r.Position(s),o)}function Ye(n,e,t){St(t);const a=P(e);switch(n){case p.Earth:return new E(0,0,0,a);case p.Moon:return ge(a);default:const o=za(a,p.Earth,n,t);return o.t=a,o}}function Ba(n,e){return new Z(n.r.x,n.r.y,n.r.z,n.v.x,n.v.y,n.v.z,e)}function _a(n,e){const t=P(e);switch(n){case p.Sun:return new Z(0,0,0,0,0,0,t);case p.SSB:const a=new qe(t.tt);return new Z(-a.Sun.r.x,-a.Sun.r.y,-a.Sun.r.z,-a.Sun.v.x,-a.Sun.v.y,-a.Sun.v.z,t);case p.Mercury:case p.Venus:case p.Earth:case p.Mars:case p.Jupiter:case p.Saturn:case p.Uranus:case p.Neptune:const o=wn(K[n],t.tt);return Ba(o,t);case p.Pluto:return Ft(t);case p.Moon:case p.EMB:const i=wn(K.Earth,t.tt),r=n==p.Moon?Ct(t):Da(t);return new Z(r.x+i.r.x,r.y+i.r.y,r.z+i.r.z,r.vx+i.v.x,r.vy+i.v.y,r.vz+i.v.z,t);default:if(Fn(n)){const s=ne(n,t);return new Z(s.x,s.y,s.z,0,0,0,t)}throw`HelioState: Unsupported body "${n}"`}}function qa(n,e,t,a,o){let i=(o+t)/2-a,r=(o-t)/2,s=a,l;if(i==0){if(r==0||(l=-s/r,l<-1||l>1))return null}else{let c=r*r-4*i*s;if(c<=0)return null;let g=Math.sqrt(c),b=(-r+g)/(2*i),f=(-r-g)/(2*i);if(-1<=b&&b<=1){if(-1<=f&&f<=1)return null;l=b}else if(-1<=f&&f<=1)l=f;else return null}let h=n+l*e,d=(2*i*l+r)/e;return{t:h,df_dt:d}}function ja(n,e,t,a){const o=ee(a&&a.dt_tolerance_seconds||1),i=Math.abs(o/ua);let r=a&&a.init_f1||n(e),s=a&&a.init_f2||n(t),l=NaN,h=0,d=a&&a.iter_limit||20,c=!0;for(;;){if(++h>d)throw"Excessive iteration in Search()";let g=Ta(e,t,.5),b=g.ut-e.ut;if(Math.abs(b)<i)return g;c?l=n(g):c=!0;let f=qa(g.ut,t.ut-g.ut,r,l,s);if(f){let T=P(f.t),M=n(T);if(f.df_dt!==0){if(Math.abs(M/f.df_dt)<i)return T;let F=1.2*Math.abs(M/f.df_dt);if(F<b/10){let L=T.AddDays(-F),H=T.AddDays(+F);if((L.ut-e.ut)*(L.ut-t.ut)<0&&(H.ut-e.ut)*(H.ut-t.ut)<0){let Y=n(L),G=n(H);if(Y<0&&G>=0){r=Y,s=G,e=L,t=H,l=M,c=!1;continue}}}}}if(r<0&&l>=0){t=g,s=l;continue}if(l<0&&s>=0){e=g,r=l;continue}return null}}function Ga(n){let e=n;for(;e<=-180;)e+=360;for(;e>180;)e-=360;return e}function Ua(n){for(;n<0;)n+=360;for(;n>=360;)n-=360;return n}function $a(n,e,t){if(n===p.Earth||e===p.Earth)throw"The Earth does not have a longitude as seen from itself.";const a=P(t),o=Ye(n,a,!1),i=pe(o),r=Ye(e,a,!1),s=pe(r);return Ua(i.elon-s.elon)}function kn(n,e){if(n===p.Sun)throw"Cannot calculate heliocentric longitude of the Sun.";const t=ne(n,e);return pe(t).elon}function Va(n,e,t,a){let o,i=0,r=0,s=0;switch(n){case p.Mercury:o=-.6,i=4.98,r=-4.88,s=3.02;break;case p.Venus:e<163.6?(o=-4.47,i=1.03,r=.57,s=.13):(o=.98,i=-1.02);break;case p.Mars:o=-1.52,i=1.6;break;case p.Jupiter:o=-9.4,i=.5;break;case p.Uranus:o=-7.19,i=.25;break;case p.Neptune:o=-6.87;break;case p.Pluto:o=-1,i=4;break;default:throw`VisualMagnitude: unsupported body ${n}`}const l=e/100;let h=o+l*(i+l*(r+l*s));return h+=5*Math.log10(t*a),h}function Ka(n,e,t,a,o){const i=pe(a),r=W*28.06,s=W*(169.51+382e-7*o.tt),l=W*i.elat,h=W*i.elon,d=Math.asin(Math.sin(l)*Math.cos(r)-Math.cos(l)*Math.sin(r)*Math.sin(h-s)),c=Math.sin(Math.abs(d));let g=-9+.044*n;return g+=c*(-2.6+1.2*c),g+=5*Math.log10(e*t),{mag:g,ring_tilt:Le*d}}function Ja(n,e,t){let a=n*W,o=a*a,i=o*o,r=-12.717+1.49*Math.abs(a)+.0431*i;const s=385000.6/kt;let l=t/s;return r+=5*Math.log10(e*l),r}class Qa{constructor(e,t,a,o,i,r,s,l){this.time=e,this.mag=t,this.phase_angle=a,this.helio_dist=o,this.geo_dist=i,this.gc=r,this.hc=s,this.ring_tilt=l,this.phase_fraction=(1+Math.cos(W*a))/2}}function Xa(n,e){if(n===p.Earth)throw"The illumination of the Earth is not defined.";const t=P(e),a=Ie(K.Earth,t);let o,i,r,s;n===p.Sun?(r=new E(-a.x,-a.y,-a.z,t),i=new E(0,0,0,t),o=0):(n===p.Moon?(r=ge(t),i=new E(a.x+r.x,a.y+r.y,a.z+r.z,t)):(i=ne(n,e),r=new E(i.x-a.x,i.y-a.y,i.z-a.z,t)),o=ga(r,i));let l=r.Length(),h=i.Length(),d;if(n===p.Sun)s=da+5*Math.log10(l);else if(n===p.Moon)s=Ja(o,h,l);else if(n===p.Saturn){const c=Ka(o,h,l,r,t);s=c.mag,d=c.ring_tilt}else s=Va(n,o,h,l);return new Qa(t,s,o,h,l,r,i,d)}function Lt(n){return $a(p.Moon,p.Sun,n)}function Ht(n,e,t){function a(g){let b=Lt(g);return Ga(b-n)}ee(n),ee(t);const o=1.5,i=P(e);let r=a(i),s,l,h;if(t<0){if(r<0&&(r+=360),s=-(tt*r)/360,h=s+o,h<t)return null;l=Math.max(t,s-o)}else{if(r>0&&(r-=360),s=-(tt*r)/360,l=s-o,l>t)return null;h=Math.min(t,s+o)}const d=i.AddDays(l),c=i.AddDays(h);return ja(a,d,c,{dt_tolerance_seconds:.1})}var rt;(function(n){n[n.Pericenter=0]="Pericenter",n[n.Apocenter=1]="Apocenter"})(rt||(rt={}));function Za(n,e){e=P(e);const t=n.lat*W,a=n.lon*W,o=n.dist*Math.cos(t);return new E(o*Math.cos(a),o*Math.sin(a),n.dist*Math.sin(t),e)}var st;(function(n){n.Penumbral="penumbral",n.Partial="partial",n.Annular="annular",n.Total="total"})(st||(st={}));var lt;(function(n){n[n.Invalid=0]="Invalid",n[n.Ascending=1]="Ascending",n[n.Descending=-1]="Descending"})(lt||(lt={}));const Wt="☉",Yt="☽",ht="︎",eo=[{body:p.Mercury,glyph:"☿",name:"Mercury"},{body:p.Venus,glyph:"♀",name:"Venus"},{body:p.Mars,glyph:"♂",name:"Mars"},{body:p.Jupiter,glyph:"♃",name:"Jupiter"},{body:p.Saturn,glyph:"♄",name:"Saturn"},{body:p.Uranus,glyph:"♅",name:"Uranus"},{body:p.Neptune,glyph:"♆",name:"Neptune"}];function no(n){const e=(n%360+360)%360;return e<22.5||e>=337.5?"New Moon":e<67.5?"Waxing crescent":e<112.5?"First quarter":e<157.5?"Waxing gibbous":e<202.5?"Full Moon":e<247.5?"Waning gibbous":e<292.5?"Last quarter":"Waning crescent"}const to=[{angle:0,name:"New Moon"},{angle:90,name:"First quarter"},{angle:180,name:"Full Moon"},{angle:270,name:"Last quarter"}];function ao(n){return new Intl.DateTimeFormat(void 0,{dateStyle:"medium",timeStyle:"short"}).format(n)}function oo(n){return new Intl.DateTimeFormat(void 0,{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"}).format(n)}function io(n,e){const t=kn(n,e),a=P(e).AddDays(3);let i=kn(n,a)-t;return i>180&&(i-=360),i<-180&&(i+=360),i>=0?"direct":"retrograde"}function zt(n){let e=null;const t=P(n);for(const a of to){const o=Ht(a.angle,t,40);if(!o)continue;const i=o.date.getTime()-t.date.getTime();i<0||(!e||i<e.ms)&&(e={name:a.name,at:o.date.toISOString(),ms:i})}return e}function ro(n){const e=P(n),t=Ht(180,e,45);return!t||t.date.getTime()<e.date.getTime()-1e3?null:t.date}function so(n){const e=[],t=zt(n);return t&&e.push({label:`Moon · ${t.name}`,at:t.at}),e.slice(0,4)}function lo(n,e){const t=P(n),a=null,o=pe(Ye(p.Sun,t,!0)).elon,i={glyph:Wt,accessibleLabel:"Sun",eclipticLongitudeDeg:o,horizon:null,riseSet:null},r=Xa(p.Moon,t),s=Lt(t),l=pe(Ye(p.Moon,t,!0)).elon,h={glyph:Yt,accessibleLabel:"Moon",phaseName:no(s),illuminationPercent:Math.round(r.phase_fraction*1e3)/10,phaseAngleDeg:Math.round(r.phase_angle*10)/10,eclipticLongitudeDeg:Math.round(l*100)/100,nextPrimaryPhase:zt(t),horizon:null,riseSet:null},d=eo.map(c=>{const g=kn(c.body,t);return{glyph:c.glyph,name:c.name,accessibleLabel:c.name,eclipticLongitudeDeg:Math.round(g*100)/100,motion:io(c.body,t),horizon:null,riseSet:null}});return{computedAt:n.toISOString(),localTimeLabel:ao(n),utcTimeLabel:oo(n),sun:i,moon:h,planets:d,events:so(t),locationUsed:!!a}}function ho(n,e){return lo(n)}let en=null;function co(){en&&clearInterval(en),en=null}const uo=`# You Are Dreaming. Remember.

Tonight, you are going to dream.

That sentence is less mystical than it sounds.

Sleep researchers can wake people from REM sleep and often collect vivid dream reports. They can also wake people from non-REM sleep and collect reports of thoughts, images, scenes, and other forms of experience there too.[1] Dreaming is not confined neatly to one little compartment of the night.

The strange part is what happens next.

Morning arrives.

You open your eyes.

And an entire world disappears.

Maybe you keep one piece.

A hallway.

A person you have not seen in twenty years.

A dog driving a car.

The feeling that something enormous just happened.

Then you reach for the day and even that begins to dissolve.

This is where our excursion starts.

Before lucid dreaming, before energy work, before the borderland between waking and sleep, before we try anything that anyone has ever called astral projection, we begin with a simpler skill:

**Remember.**

Not because remembering dreams proves anything supernatural.

Because an experience you cannot retrieve is very difficult to investigate.

## The Dream Is Closer Than It Feels

People vary enormously in how often they remember dreams.

Some remember them almost every morning. Others remember a dream once in a while and assume very little is happening during the rest of the night.

Research gives us a better reason to stay curious.

Dream reports can be collected after awakenings from several stages of sleep, and modern work suggests that the difference between frequent and infrequent dream recall has a lot to do with what happens around awakening and memory.[1][2]

One useful model is called the **arousal-retrieval model**.

The basic idea is surprisingly ordinary.

A dream can be occurring during sleep, yet the experience still needs a chance to cross into waking memory. Brief awakenings may help provide that chance. In sleep-laboratory research, frequent dream recallers have shown more and longer awakenings during the night than low recallers, especially from stage N2 sleep.[2]

That does not mean you need to wreck your sleep to remember dreams.

Sleep comes first.

It means the doorway matters.

The few moments when sleep becomes waking may be part of the memory process itself.

Think of a dream as a message written in disappearing ink.

Morning is when we learn how to read it before the page clears.

## Attention Changes the Experiment

There is another clue.

In a 2025 prospective study of 217 adults, morning dream recall was associated with several factors, including a person's attitude toward dreams, patterns of sleep, and individual differences in cognition.[3]

That does not prove that simply believing dreams are important creates dream memories.

It does suggest that interest, attention, sleep, memory, and recall are connected in ways worth using.

This feels familiar.

Buy a white car and white cars suddenly appear everywhere.

Learn a new word and hear it three times that week.

The cars were already there.

The word probably was too.

Something changed in what your mind selected.

Dream practice may work partly through a similar shift.

When dreams become important, waking becomes a retrieval opportunity instead of an immediate exit.

That is a small change.

It may also be the first real skill in this book.

## The First Seconds

Tomorrow morning, notice the first moment of waking.

Remain still for a few breaths.

Keep your eyes comfortable.

Let the day stay outside the room for a moment.

Then ask:

**What was just happening?**

Start with whatever arrives.

An image.

A place.

A voice.

A person.

A color.

A body sensation.

An emotion.

A sentence.

A single absurd fact.

Maybe you remember that you were trying to buy groceries inside a cathedral.

Good.

Stay with the cathedral.

Where were you standing?

Was anyone with you?

What happened just before that?

Dream memory sometimes returns backward, one piece pulling another piece behind it.

Follow the thread that appears.

A fragment counts.

A feeling counts.

The certainty that you dreamed something counts.

We are training retrieval, not grading the dream.

## Write the Small Thing

Keep something beside the bed that makes recording easy.

Paper works.

Your phone works.

A voice note works.

Use the method that creates the least distance between remembering and recording.

Then record what you have.

A full story is welcome.

Three words are enough to begin.

> red stairs — grandmother — rain

Those three words may preserve a dream that would otherwise vanish by breakfast.

They may also pull more material back while you write.

Dream-log research gives us a useful reason to take this seriously. Studies comparing retrospective estimates with prospective logs often find that people report more dreams when they record them as they occur rather than trying to estimate later how often they usually dream.[4][5]

One empirical study also found evidence that keeping a logbook can enhance dream recall, although diary format, motivation, and measurement complicate the picture.[4]

So we keep the claim modest.

Writing dreams down helps us capture dreams.

It may also strengthen recall.

Either result serves the experiment.

## One Important Difference

A dream journal can easily become literature.

That is enjoyable.

It is also a different activity.

At the beginning, accuracy matters more than elegance.

Record what comes back before improving the story.

Dreams are already very good at making themselves weird. They do not need our help.

If the dream contains a blue room, write blue room.

If you are unsure whether the room was blue or green, write blue/green.

If only the emotion remains, write the emotion.

This is fieldwork.

Later we can interpret, connect, laugh, speculate, or decide the talking raccoon represented unresolved childhood conflict.

First we collect the raccoon.

## Tell Yourself What You Do

Before sleep tonight, take a moment and direct your attention toward the morning.

Use simple language.

Present tense.

Something like:

**I remember my dreams.**

**My dreams become clear when I wake.**

**I wake and remember.**

Choose one that feels natural.

Say it quietly a few times while imagining the actual moment of waking and remembering something.

We are using language here as part of the experiment.

The interesting question is practical:

Does directing intention toward recall change what happens?

You can answer that only by trying it.

## Protect the Doorway

Morning habits can either preserve the doorway or fill it immediately.

Dream memory is fragile enough that new input can interfere with retrieval. Recent research on morning dream recall has found that susceptibility to interference helps predict whether people can recover dream content after waking.[3]

That gives us another practical reason to make the first few seconds simple.

Wake.

Remain still.

Remember.

Then reach for the world.

Your alarm, messages, weather, calendar, arguments, headlines, and everything else will still be waiting.

The dream has worse marketing.

Give it first access to you.

## You Are Already Practicing

There is something I like about beginning here.

We have not asked the universe for anything extraordinary yet.

We have not adopted a metaphysical system.

We have not decided whether consciousness can leave the body.

We are simply paying attention to an experience that already happens during sleep and learning how to carry more of it across the boundary into waking life.

That alone can become strange very quickly.

The more dreams you remember, the more you begin to see recurring places, impossible architecture, familiar people playing unfamiliar roles, emotional patterns, repeating problems, and certain kinds of absurdity that somehow feel perfectly reasonable while they are happening.

Eventually one of those patterns may become useful for lucid dreaming.

Research on lucid-dream induction gives us a concrete reason to care about recall first: stronger general dream recall predicts greater success with techniques such as MILD and SSILD.[6]

That makes intuitive sense.

Becoming aware inside dreams becomes easier to investigate when dreams are already becoming easier to retrieve.

So we begin here.

Tonight you sleep.

You dream.

Morning comes.

And instead of immediately leaving that world behind, you turn toward it.

**You are dreaming. Remember.**

---

## Try This

Tonight:

1. Place your recording method within easy reach.
2. As you settle into sleep, repeat a simple present-tense intention such as **I remember my dreams**.
3. Imagine yourself waking with a dream already in mind.

For the next several mornings, notice what changes.

Dream length matters less than recall itself.

One fragment is the beginning.

---

### Summary

Dream recall begins in the first moments after waking. Dreams can disappear quickly when attention moves immediately toward the day, so remembering them becomes easier when waking itself becomes part of the practice.

The goal is not to remember every dream perfectly. It is to strengthen the habit of turning attention toward whatever remains.

### Experiment

When you wake, stay still for a few moments if comfortable.

Before reaching for your phone or beginning the day, ask:

**What was I just experiencing?**

Let any image, person, place, feeling, sentence, or fragment return.

Start with whatever is there.

Follow it backward if more appears.

Record what you remember while it is still available, even if it is only one strange image or a few words.

### Intention

**When I wake, I remember my dreams.**

---

## References

[1] Nir, Y., & Tononi, G. “Dreaming and the Brain: From Phenomenology to Neurophysiology.” *Trends in Cognitive Sciences* 14, no. 2 (2010): 88–100. https://doi.org/10.1016/j.tics.2009.12.001

[2] van Wyk, M., Solms, M., & Lipinska, G. “Increased Awakenings From Non-rapid Eye Movement Sleep Explain Differences in Dream Recall Frequency in Healthy Individuals.” *Frontiers in Human Neuroscience* 13 (2019): 370. https://doi.org/10.3389/fnhum.2019.00370

[3] Elce, V., et al. “The Individual Determinants of Morning Dream Recall.” *Communications Psychology* 3 (2025): 25. https://doi.org/10.1038/s44271-025-00191-z

[4] Aspy, D. J. “Is Dream Recall Underestimated by Retrospective Measures and Enhanced by Keeping a Logbook? An Empirical Investigation.” *Consciousness and Cognition* 42 (2016): 181–203. https://doi.org/10.1016/j.concog.2016.03.015

[5] Aspy, D. J., Delfabbro, P., & Proeve, M. “Is Dream Recall Underestimated by Retrospective Measures and Enhanced by Keeping a Logbook? A Review.” *Consciousness and Cognition* 33 (2015): 364–374. https://doi.org/10.1016/j.concog.2015.02.005

[6] Aspy, D. J. “Findings From the International Lucid Dream Induction Study.” *Frontiers in Psychology* 11 (2020): 1746. https://doi.org/10.3389/fpsyg.2020.01746
`,Ln="nighttime-body-release",mo="A Nighttime Body Release",An="relax-the-body",po="Relax the body",xn=`#/feel-the-body#${Ln}`,Hn="pex:attention-instrument",go={[mo]:Ln,References:"references"};function yo(n){return go[n]}const fo={[An]:{id:An,href:xn,label:po}};function Wn(n=window.location.hash){const t=n.replace(/^#/,"").split("?")[0]||"/",[a,o=""]=t.split("#");return{path:(a&&a.startsWith("/")?a:`/${a??""}`)||"/",fragment:o}}const Yn="You Are Dreaming. Remember.",zn="/you-are-dreaming-remember",Bt=`#${zn}`,Sn=["Summary","Experiment","Intention"];function bo(n){return Sn.includes(n)}function En(n){if(!n.startsWith("### "))return null;const e=n.slice(4).trim();return bo(e)?e:null}function _t(n){const e=n.trim();return!e||e==="---"||n.startsWith("## ")||n.startsWith("### ")||n.startsWith("> ")||n.trim()===Hn||/^\d+\.\s/.test(n)||/^-\s/.test(n)}function ye(n){const e=n.replace(/\r\n/g,`
`).trim().split(`
`);if(!e[0]?.startsWith("# "))throw new Error("Chapter manuscript must begin with a top-level heading");const t=e[0].slice(2).trim(),a=[],o=[];let i=1,r=!1;for(;i<e.length;){const s=e[i];if(r){const c=s.trim();c&&o.push(c),i+=1;continue}if(!s.trim()){i+=1;continue}if(s.trim()==="---"){a.push({kind:"rule"}),i+=1;continue}if(s.trim()===Hn){a.push({kind:"attention"}),i+=1;continue}if(s.startsWith("## ")){const c=s.slice(3).trim();if(c==="References"){r=!0,i+=1;continue}a.push({kind:"heading",text:c}),i+=1;continue}if(En(s)){const c=vo(e,i);a.push(c.block),i=c.nextIndex,i<e.length&&e[i].trim()==="---"&&(i+=1);continue}if(s.startsWith("> ")){const c=[];for(;i<e.length&&e[i].startsWith("> ");)c.push(e[i].slice(2).trim()),i+=1;a.push({kind:"quote",text:c.join(" ")});continue}if(/^\d+\.\s/.test(s)){const c=[];for(;i<e.length&&/^\d+\.\s/.test(e[i]);)c.push(e[i].replace(/^\d+\.\s+/,"").trim()),i+=1;a.push({kind:"list",items:c,ordered:!0});continue}if(/^-\s/.test(s)){const c=[];for(;i<e.length&&/^-\s/.test(e[i]);)c.push(e[i].replace(/^-\s+/,"").trim()),i+=1;a.push({kind:"list",items:c,ordered:!1});continue}const h=[];for(;i<e.length;){const c=e[i];if(_t(c)&&c.trim()!==""||!c.trim())break;h.push(c.trim()),i+=1}const d=h.join(" ");d.startsWith("**")&&d.endsWith("**")&&!d.slice(2,-2).includes("**")?a.push({kind:"emphasis",text:d.slice(2,-2)}):d&&a.push({kind:"paragraph",text:d})}return{title:t,blocks:a,references:o}}function wo(n,e,t){const a=[];let o=e;for(;o<n.length;){const i=n[o];if(t(i))break;if(!i.trim()){o+=1;continue}if(i.trim()==="---"){a.push({kind:"rule"}),o+=1;continue}if(i.trim()===Hn){a.push({kind:"attention"}),o+=1;continue}if(i.startsWith("> ")){const l=[];for(;o<n.length&&n[o].startsWith("> ");)l.push(n[o].slice(2).trim()),o+=1;a.push({kind:"quote",text:l.join(" ")});continue}if(/^\d+\.\s/.test(i)){const l=[];for(;o<n.length&&/^\d+\.\s/.test(n[o]);)l.push(n[o].replace(/^\d+\.\s+/,"").trim()),o+=1;a.push({kind:"list",items:l,ordered:!0});continue}if(/^-\s/.test(i)){const l=[];for(;o<n.length&&/^-\s/.test(n[o]);)l.push(n[o].replace(/^-\s+/,"").trim()),o+=1;a.push({kind:"list",items:l,ordered:!1});continue}const r=[];for(;o<n.length;){const l=n[o];if(t(l)||!l.trim()||_t(l)&&l.trim()!=="")break;r.push(l.trim()),o+=1}const s=r.join(" ");s.startsWith("**")&&s.endsWith("**")&&!s.slice(2,-2).includes("**")?a.push({kind:"emphasis",text:s.slice(2,-2)}):s&&a.push({kind:"paragraph",text:s})}return{blocks:a,nextIndex:o}}function vo(n,e){const t=[];let a=e;for(const o of Sn){if(En(n[a]??"")!==o)throw new Error(`Practice component must use ### ${Sn.join(", then ### ")}`);a+=1;const r=wo(n,a,s=>!!(s.startsWith("## ")||En(s)||s.trim()==="---"));t.push({label:o,blocks:r.blocks}),a=r.nextIndex}return{block:{kind:"practice",parts:t},nextIndex:a}}let nn=null;function To(){return nn||(nn=ye(uo)),nn}const Io=`
# What Is a Psychical Excursion?

What if consciousness is capable of more than we normally ask it to do?

Most of us spend roughly a third of our lives asleep, yet we tend to treat that time as a blank space between useful parts of the day. We go to bed, disappear for a while, and hope we wake up rested.

But sometimes the blank space isn't blank.

You wake from a dream that feels more vivid than yesterday. You realize, while dreaming, that you're dreaming. You lie at the edge of sleep and notice your body becoming heavy while your thoughts are still strangely clear. You focus on one part of your body and feel warmth, tingling, pressure, or something you don't quite have a word for.

And then there are the bigger claims.

People have described leaving their bodies. Mystics and occultists have written about subtle bodies and other realms. Tibetan traditions developed practices for becoming aware inside dreams and using that awareness to investigate the mind itself. Modern lucid dreamers have learned to recognize dreams, deliberately change them, and even signal researchers from inside REM sleep.[2]

So what exactly is going on?

I don't know.

That's the fun part.

Psychical Excursion is an experiment in finding out what our own minds and bodies are capable of when we deliberately practice attention, dream awareness, relaxation, body awareness, lucid dreaming, and techniques associated with out-of-body experience.

The goal is not to convince you that astral projection is real.

The goal is not to convince you that it isn't.

The goal is to learn enough, practice enough, and pay enough attention that we have something more interesting to work with than an opinion.

## Why “Psychical”?

I'll admit that the name did not arrive in a bolt of revelation.

I was looking for words related to astral projection that weren't already attached to somebody else's domain name.

But *Psychical Excursion* grew on me.

It sounds a little old-fashioned. A little adventurous. Maybe slightly ridiculous.

I like all three.

The word *psychical* also has an interesting history. In the late nineteenth century, researchers formed organizations devoted to “psychical research” in an attempt to investigate disputed questions about mind, perception, unusual experiences, and claims that seemed to sit outside ordinary explanations. The Society for Psychical Research, founded in 1882, explicitly framed its work as inquiry rather than required belief.[1]

That posture appeals to me.

Something strange is claimed.

Don't worship it.

Don't laugh it out of the room either.

Look at it.

Ask questions.

Try what can actually be tried.

## I Want Psychic Super Powers

There is a very serious philosophical question underneath this project.

There is also a much simpler one:

What if this stuff is actually possible?

I want an adventure.

I think there may be more to this world than meets the eye, and I want to explore it. We spend years of our lives asleep. What if some of that time can become another place to learn?

What if it's a little like *The Matrix* and I can learn kung fu in my sleep?

I haven't managed that yet.

I have managed to become lucid inside dreams.

When I was a kid, before I knew the term *lucid dreaming*, I remember telling a classmate about a nightmare involving a bear. At some point I realized I could simply tell the bear to stop.

So I did.

It stopped.

Years later, after seeing *Waking Life*, I became interested in lucid dreaming deliberately. I tried techniques from the movie, but I didn't make real progress until I started working through Robert Bruce and Brian Mercer's *Mastering Astral Projection*.

Then things got interesting.

I learned to recognize that I was dreaming. I experimented with falling backward inside dreams without waking up. I tried flying.

My dream-flight career was not immediately impressive.

In one dream I was escaping an alligator infestation, took a heroic running leap, successfully became airborne, and flew directly into a light pole.

I woke up.

Another time I managed to levitate about a foot off the ground and could not get any higher. In another dream I could float but couldn't figure out how to go anywhere. Eventually I improved enough to have one of my favorite lucid dreams: riding Falkor from *The NeverEnding Story*.

Lucid dreaming can feel profound.

It can also be extremely funny.

More importantly, we do not have to take lucid dreaming on faith. Researchers have verified lucid awareness during REM sleep by arranging signals with lucid dreamers in advance and recording those signals while the participants remained asleep.[2]

That doesn't prove astral projection.

It proves something already strange enough to deserve our attention:

You can be asleep, dreaming, and know that you are dreaming.

What else can we learn to do from there?

## The Body Is Part of the Experiment

Dreams are only one part of this guide.

Another is learning to pay attention to the body in a way most of us rarely do.

I first explored this seriously in a weekly qigong class. One exercise involved feeling or imagining a ball of energy between the hands.

And I felt something.

For me, the sensation was like soft vibrating electricity—fuzzy, tingling, with occasional little sparks.

Later, the body-awareness exercises in *Mastering Astral Projection* helped me realize that I could produce or notice something similar in other parts of my body.

I could focus on my big toe and imagine an energy sponge moving back and forth inside it.

Toe. Foot. Calf. Thigh.

Eventually I could feel variations of that sensation through much of my body.

What was I actually feeling?

Qi?

Nerves?

Attention?

Expectation?

Interoception—the nervous system's processing of internal bodily signals?

Something else?

For now, I don't think we need to decide.

Modern research gives us perfectly ordinary reasons to take body awareness seriously. Interoception is a legitimate area of neuroscience and psychology, and research on mindfulness and related practices suggests that training attention can alter how people report and experience internal bodily signals.[3][4]

That doesn't mean the traditional idea of an “energy body” has been scientifically proven.

It means we have an interesting overlap.

Traditional systems say: direct consciousness into the body and learn to perceive subtler sensations.

Modern research says: attention and training can change our awareness of bodily signals.

Great.

Let's play with that.

Try something now if you want.

Hold one finger about an inch above the palm of your other hand. Slowly trace a small circle without touching the skin.

Keep doing it for a little while.

What do you notice?

Warmth?

Tingling?

Pressure?

The strange urge to insist that your finger is obviously doing absolutely nothing?

All valid results.

We will use the word *energy* sometimes in this guide because humans have used words like qi, prana, subtle energy, vital force, and many others to describe experiences associated with body awareness and directed attention.

For our purposes, we can begin much more modestly.

**Energy is the felt experience of directed consciousness in the body.**

That's a working definition.

We are allowed to change our minds.

## The Dreaming Mind

Some traditions go much further than simply becoming lucid.

Tenzin Wangyal Rinpoche's *The Tibetan Yogas of Dream and Sleep* presents dream and sleep practices from the Tibetan Bön tradition in which lucid dreaming becomes a setting for deeper investigation of identity, perception, and the nature of mind.[5]

What fascinated me when I first encountered this kind of material was how far the experiments could go.

Once you know you're dreaming, what happens if you become extremely large?

Extremely small?

Can you become something other than yourself?

Can you become multiple versions of yourself?

We spend our waking lives inside an apparently stable body and identity. Dreams may give us a laboratory where some of those assumptions become surprisingly flexible.

The spiritual explanations attached to these practices belong to the traditions that developed them. We can respect those traditions without pretending we've proven every claim they make.

We can also try the experiments.

That distinction will matter throughout this book.

## Out of Body

Lucid dreaming is strange, but it isn't my final question.

The question I keep returning to is the out-of-body experience.

Can consciousness ever seem to operate independently from the sleeping physical body?

And if it can, what does that actually mean?

I've had one experience that permanently made this question more interesting to me.

I was sleeping in a room with several other people during a two-day event when I became aware of a horribly annoying noise.

I remember wondering who was making it.

I sat up and looked around.

Everyone else appeared to be sleeping.

Then I realized why the sound was so loud.

It was my own snoring.

The realization immediately pulled me out of the experience, and I woke normally.

I am not offering that story as proof that my consciousness left my body. I don't know what happened.

But subjectively, I experienced myself as awake while my body was asleep deeply enough to be snoring.

That was enough to make me want to keep investigating.

I've also been in a serious car wreck in which the vehicle rolled completely over. During the event, time seemed to slow.

Why?

What does extreme stress do to our perception of time?

What happens to consciousness around sleep, trauma, anesthesia, meditation, and death?

Are extraordinary experiences entirely products of the brain?

Is that distinction even as simple as it sounds?

Could consciousness ever exist or operate independently of the physical body?

Those questions are much larger than this guide can settle.

But they are excellent reasons to explore.

## No Grades, No Gurus

This is not a certification program.

There is no correct number of days.

There is no streak to protect.

You don't fail because you didn't remember a dream last night.

You don't win because your hands started tingling on the first try.

Some people remember dreams easily. Some barely remember any. Some people become lucid unexpectedly. Others practice for a long time before it happens. Some people notice intense body sensations almost immediately. Other people wonder what everyone is talking about.

That's fine.

I am naturally inconsistent myself.

I jump between interests. Life gets in the way. Years ago, I was making steady progress with these practices when my child was born, and being a parent became more important than exploring dream worlds.

My child is grown now.

So I'm starting again.

This book is part guide and part field notebook for that return.

We'll explore science where science has something useful to say. We'll explore religious, occult, contemplative, and cultural traditions without flattening them into one thing. We'll look at techniques people claim work. We'll try some of them.

Sometimes the result may be dramatic.

Sometimes nothing will happen.

Nothing happening is still data.

## The Excursion

Robert Anton Wilson was another major influence on the way I approach questions like these.

One of the things I loved about *Prometheus Rising* was that ideas did not simply sit on the page waiting to be believed. The reader was given experiments—small ways to play with attention, expectation, belief, and perception.

That is the spirit I want here.

Don't just read about attention.

Try directing it.

Don't just read about dream recall.

See what happens when you begin treating dreams as something worth remembering.

Don't argue abstractly about whether body “energy” is real.

Spend a few minutes seeing what you can actually feel.

Don't decide whether lucid dreaming is possible.

Learn to become lucid.

And if we eventually reach the strange collection of techniques people have used to attempt out-of-body experiences?

We'll try those too.

Carefully.

Curiously.

Without pretending beforehand that we know what the result means.

I hope that by the end of this excursion you discover more about yourself—and maybe find a renewed love of life and what might be possible inside it.

Maybe you'll learn to remember your dreams.

Maybe you'll become lucid.

Maybe you'll develop a surprisingly vivid awareness of your body.

Maybe you'll encounter the strange borderland between waking and sleep.

Maybe you'll have an experience you call astral projection.

Maybe you won't.

The point is not to arrive with the correct belief.

The point is to go somewhere you haven't been before.

Let's see what happens.

---

## References

[1] “Society for Psychical Research.” *Nature* 158, 338 (1946). doi:10.1038/158338c0.

[2] LaBerge, S. P., Nagel, L. E., Dement, W. C., & Zarcone, V. P. Jr. “Lucid Dreaming Verified by Volitional Communication during REM Sleep.” *Perceptual and Motor Skills* 52, no. 3 (1981): 727–732. doi:10.2466/pms.1981.52.3.727.

[3] Gibson, J. “Mindfulness, Interoception, and the Body: A Contemporary Perspective.” *Frontiers in Psychology* (2019). doi:10.3389/fpsyg.2019.02012.

[4] Treves, I. N., et al. “A Meta-analysis of the Effects of Mindfulness Meditation Training on Self-reported Interoception.” *Scientific Reports* (2025). doi:10.1038/s41598-025-22661-4.

[5] Wangyal Rinpoche, Tenzin. *The Tibetan Yogas of Dream and Sleep: Practices for Awakening*. Edited by Mark Dahlby. Revised edition. Shambhala Publications, 2022. https://www.shambhala.com/the-tibetan-yogas-of-dream-and-sleep.html

`,ko="An experiment in dreams, consciousness, energy, and out-of-body experience";function Ao(n){const e=n.trim(),t=e.match(/^#\s+(.+)\n+/);if(!t)throw new Error("Guidebook manuscript must begin with a top-level heading");const a=t[1].trim(),i=e.slice(t[0].length).split(/\n## /),r=ct(i[0]??""),s=[];let l=[];for(let h=1;h<i.length;h+=1){const d=i[h],c=d.indexOf(`
`),g=(c===-1?d:d.slice(0,c)).trim(),b=c===-1?"":d.slice(c+1);if(g==="References"){l=xo(b);continue}s.push({heading:g,paragraphs:ct(b)})}return{openingHeading:a,openingParagraphs:r,sections:s,references:l}}function ct(n){return n.split(/\n---\n/).flatMap(e=>e.split(/\n\n+/)).map(e=>e.replace(/\n/g," ").trim()).filter(Boolean)}function xo(n){return n.split(/\n+/).map(e=>e.trim()).filter(Boolean)}let tn=null;function So(){return tn||(tn=Ao(Io)),tn}function dt(n){return n.replace(/[.,;:!?)]+$/u,"")}function ze(n,e={}){const{linkCitations:t=!0}=e,a=m("span",{class:"guidebook-rich-text"}),o=t?/(\[[^\]]+\]\((?:pex:[a-z0-9-]+|#\/[^)\s]+)\)|\*\*[^*]+\*\*|\*[^*]+\*|\[\d+\]|https:\/\/\S+|doi:10\.\S+)/gi:/(\[[^\]]+\]\((?:pex:[a-z0-9-]+|#\/[^)\s]+)\)|\*\*[^*]+\*\*|\*[^*]+\*|https:\/\/\S+|doi:10\.\S+)/gi;let i=0;for(const r of n.matchAll(o)){const s=r.index??0;s>i&&a.append(n.slice(i,s));const l=r[0],h=l.match(/^\[([^\]]+)\]\((pex:[a-z0-9-]+|#\/[^)\s]+)\)$/i);if(h){const d=h[1],c=h[2],g=c.toLowerCase().startsWith("pex:")?c.slice(4).toLowerCase():"",b=g?fo[g]:void 0,f=b?.href??(c===xn||c.endsWith(`#${Ln}`)?xn:c),T=m("a",{href:f,class:"guidebook-pex-link","data-pex-link":b?.id??An}),M=d.match(/^\*\*(.+)\*\*$/);M?T.append(m("strong",{},[M[1]])):T.append(d),a.append(T)}else if(l.startsWith("**"))a.append(m("strong",{},[l.slice(2,-2)]));else if(l.startsWith("*"))a.append(m("em",{},[l.slice(1,-1)]));else if(/^\[\d+\]$/.test(l)&&t){const d=l.slice(1,-1);a.append(m("a",{href:`#ref-${d}`,class:"guidebook-citation"},[l]))}else if(l.toLowerCase().startsWith("doi:10.")){const d=dt(l.slice(4));a.append(m("a",{href:`https://doi.org/${d}`,class:"guidebook-doi",rel:"noreferrer"},[l]))}else if(l.toLowerCase().startsWith("https://")){const d=dt(l);a.append(m("a",{href:d,class:"guidebook-external",rel:"noreferrer"},[l]))}else a.append(l);i=s+l.length}return i<n.length&&a.append(n.slice(i)),a.childNodes.length||a.append(n),a}function Rn(n,e){const t=m("p",{});return t.append(ze(n,e)),t}function qt(n){const e=n.match(/^\[(\d+)\]\s*(.*)$/),t=e?.[1]??"0",a=e?.[2]??n,o=m("li",{id:`ref-${t}`,class:"guidebook-reference-item"}),i=m("span",{class:"guidebook-ref-num"},[`[${t}] `]);return o.append(i,ze(a,{linkCitations:!1})),o.tabIndex=-1,o}function Eo(n){for(const e of n.querySelectorAll("a.guidebook-citation"))e.addEventListener("click",t=>{const o=(e.getAttribute("href")??"").match(/^#ref-(\d+)$/);if(!o)return;const i=n.querySelector(`#ref-${o[1]}`);if(!i)return;t.preventDefault();const r=typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;i.scrollIntoView({behavior:r?"auto":"smooth",block:"start"}),i.focus({preventScroll:!0})});for(const e of n.querySelectorAll("a.guidebook-pex-link"))e.addEventListener("click",t=>{const a=e.getAttribute("href")??"",o=a.startsWith("#")?a:"";if(!o.includes("#",1)&&!o.includes("#"))return;const i=o.replace(/^#/,"").split("#")[1];if(!i)return;const r=n.querySelector(`[id="${i}"]`);if(!r)return;t.preventDefault(),r.closest(".guidebook-section")?.classList.add("is-visible");const s=typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;r.scrollIntoView({behavior:s?"auto":"smooth",block:"start"}),r.focus({preventScroll:!0})})}function Pe(n){return m("section",{class:n?"guidebook-section pex-reveal is-visible":"guidebook-section pex-reveal"})}function Ro(n){const e=So(),t=m("article",{class:"guidebook-article"});let a=Pe(!0);t.append(a),a.append(m("p",{class:"guidebook-subtitle"},[ko]),m("h1",{class:"guidebook-opening-title"},[e.openingHeading]),...e.openingParagraphs.map(o=>Rn(o)));for(const o of e.sections){a=Pe(!1),t.append(a),a.append(m("h2",{class:"guidebook-section-title"},[o.heading]));for(const i of o.paragraphs){if(i.startsWith("**")&&i.endsWith("**")){a.append(m("p",{class:"guidebook-emphasis-line"},[i.slice(2,-2)]));continue}a.append(Rn(i))}}if(e.references.length){a=Pe(!1),t.append(a),a.append(m("h2",{class:"guidebook-section-title",id:"references"},["References"]));const o=m("ul",{class:"guidebook-references"});for(const i of e.references)o.append(qt(i));a.append(o)}a=Pe(!1),t.append(a),a.append(m("p",{class:"guidebook-next"},[m("a",{href:Bt,class:"guidebook-next-link",id:"guidebook-next-chapter"},[Yn,m("span",{class:"guidebook-next-arrow","aria-hidden":"true"},[" →"])])])),n.append(t)}const Fe={innerSeconds:180,midSeconds:240,outerSeconds:300,breatheSeconds:96},_=500,q=500;function v(n,e={}){const t=document.createElementNS("http://www.w3.org/2000/svg",n);for(const[a,o]of Object.entries(e))t.setAttribute(a,o);return t}function A(n,e){const t=(e-90)*Math.PI/180;return[_+n*Math.cos(t),q+n*Math.sin(t)]}function jt(n,e,t=0){return Array.from({length:n},(a,o)=>A(e,360/n*o+t).join(",")).join(" ")}function ut(n,e,t,a=0){const o=[];for(let i=0;i<n;i+=1)o.push(A(e,360/n*i+a).join(",")),o.push(A(t,360/n*i+180/n+a).join(","));return o.join(" ")}function an(n,e,t,a){return[A(t,n),A((e+t)/2,n-a),A(e,n),A((e+t)/2,n+a)].map(o=>o.join(",")).join(" ")}function Mo(n,e,t,a){return[A(t,n),A(e,n-a),A(e,n+a)].map(o=>o.join(",")).join(" ")}function B(n,e,t,a,o){n.append(v("polygon",{class:o,points:jt(e,t,a)}))}function No(){return typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}function Co(){const n=No(),e=m("figure",{class:n?"pex-attention-instrument is-static":"pex-attention-instrument"});e.setAttribute("role","img"),e.setAttribute("aria-label","Original Psychical Excursion attention instrument: nested thin-line geometry around a fixed center. Looking toward the center is optional. Seeing no afterimage or mental picture is not required.");const t=v("svg",{viewBox:"0 0 1000 1000",focusable:"false"});t.style.setProperty("--pex-attention-inner",`${Fe.innerSeconds}s`),t.style.setProperty("--pex-attention-mid",`${Fe.midSeconds}s`),t.style.setProperty("--pex-attention-outer",`${Fe.outerSeconds}s`),t.style.setProperty("--pex-attention-breathe",`${Fe.breatheSeconds}s`);const a=v("g",{class:"pex-attention-layer pex-attention-beyond"});a.append(v("polygon",{class:"pex-attention-line pex-attention-faintest",points:jt(36,486,5)})),a.append(v("circle",{class:"pex-attention-line pex-attention-faintest",cx:String(_),cy:String(q),r:"478"}));for(let h=0;h<72;h+=1){const d=h*5,c=A(468,d),g=A(h%6===0?492:484,d);a.append(v("line",{class:"pex-attention-line pex-attention-faintest",x1:c[0].toFixed(2),y1:c[1].toFixed(2),x2:g[0].toFixed(2),y2:g[1].toFixed(2)}))}const o=v("g",{class:"pex-attention-layer pex-attention-spin-outer"});o.append(v("circle",{class:"pex-attention-line pex-attention-strong",cx:String(_),cy:String(q),r:"438"})),o.append(v("circle",{class:"pex-attention-line",cx:String(_),cy:String(q),r:"418"}));for(let h=0;h<144;h+=1){const d=h*2.5,c=h%12===0,g=h%4===0,b=A(c?398:g?406:410,d),f=A(438,d);o.append(v("line",{class:c?"pex-attention-line pex-attention-strong":"pex-attention-line pex-attention-fine",x1:b[0].toFixed(2),y1:b[1].toFixed(2),x2:f[0].toFixed(2),y2:f[1].toFixed(2)}))}for(let h=0;h<8;h+=1){const d=h*45;o.append(v("polygon",{class:"pex-attention-line",points:an(d,442,462,3.2)}));const c=A(h%2===0?454:448,d);o.append(v("circle",{class:"pex-attention-fill pex-attention-fine",cx:c[0].toFixed(2),cy:c[1].toFixed(2),r:h%2===0?"2.1":"1.3"}))}for(const h of[18,138,258])o.append(v("path",{class:"pex-attention-line pex-attention-arc",d:Do(394,h,h+84)}));const i=v("g",{class:"pex-attention-layer pex-attention-spin-mid"});for(const h of[372,344,316,288])i.append(v("circle",{class:"pex-attention-line",cx:String(_),cy:String(q),r:String(h)}));B(i,12,372,0,"pex-attention-line pex-attention-soft"),B(i,12,372,15,"pex-attention-line pex-attention-soft");for(let h=0;h<24;h+=1)i.append(v("polygon",{class:"pex-attention-line",points:an(h*15,300,368,5.4)}));for(let h=0;h<36;h+=1)i.append(v("polygon",{class:"pex-attention-line pex-attention-fine",points:Mo(h*10,248,286,3.6)}));for(let h=0;h<24;h+=1){const d=h*15,c=A(132,d),g=A(h%2===0?368:316,d);i.append(v("line",{class:h%2===0?"pex-attention-line":"pex-attention-line pex-attention-fine",x1:c[0].toFixed(2),y1:c[1].toFixed(2),x2:g[0].toFixed(2),y2:g[1].toFixed(2)}))}const r=v("g",{class:"pex-attention-layer pex-attention-breathe"});B(r,8,236,0,"pex-attention-line pex-attention-strong"),B(r,8,236,22.5,"pex-attention-line"),B(r,6,204,0,"pex-attention-line"),B(r,6,204,30,"pex-attention-line"),B(r,4,176,0,"pex-attention-line pex-attention-soft"),B(r,4,176,45,"pex-attention-line pex-attention-soft"),r.append(v("polygon",{class:"pex-attention-line",points:ut(16,220,148,0)})),r.append(v("polygon",{class:"pex-attention-line pex-attention-fine",points:ut(12,190,126,15)}));for(const h of[168,148,128])r.append(v("circle",{class:"pex-attention-line pex-attention-fine",cx:String(_),cy:String(q),r:String(h)}));const s=v("g",{class:"pex-attention-layer pex-attention-spin-inner"});for(let h=0;h<12;h+=1){const[d,c]=A(34,h*30);s.append(v("circle",{class:"pex-attention-line",cx:d.toFixed(2),cy:c.toFixed(2),r:"34"}))}for(let h=0;h<8;h+=1)s.append(v("polygon",{class:"pex-attention-line pex-attention-fine",points:an(h*45+22.5,58,108,8)}));B(s,16,96,0,"pex-attention-line pex-attention-fine"),B(s,8,72,0,"pex-attention-line"),s.append(v("circle",{class:"pex-attention-line",cx:String(_),cy:String(q),r:"54"}));for(let h=0;h<32;h+=1){const d=h*11.25,c=A(46,d),g=A(h%4===0?70:62,d);s.append(v("line",{class:"pex-attention-line pex-attention-fine",x1:c[0].toFixed(2),y1:c[1].toFixed(2),x2:g[0].toFixed(2),y2:g[1].toFixed(2)}))}const l=v("g",{class:"pex-attention-layer pex-attention-center"});return l.append(v("circle",{class:"pex-attention-line pex-attention-strong",cx:String(_),cy:String(q),r:"18"})),l.append(v("circle",{class:"pex-attention-line pex-attention-fine",cx:String(_),cy:String(q),r:"8"})),l.append(v("circle",{class:"pex-attention-fill pex-attention-center-point",cx:String(_),cy:String(q),r:"2.2"})),t.append(a,o,i,r,s,l),e.append(t),e}function Do(n,e,t){const a=A(n,e),o=A(n,t),i=t-e>180?1:0;return`M ${a[0].toFixed(2)} ${a[1].toFixed(2)} A ${n} ${n} 0 ${i} 1 ${o[0].toFixed(2)} ${o[1].toFixed(2)}`}function he(n){return m("section",{class:n?"guidebook-section pex-reveal is-visible":"guidebook-section pex-reveal"})}function Gt(n,e){for(const t of e){if(t.kind==="emphasis"){n.append(m("p",{class:"guidebook-emphasis-line"},[t.text]));continue}if(t.kind==="quote"){const a=m("blockquote",{class:"guidebook-pull"});a.append(ze(t.text)),n.append(a);continue}if(t.kind==="list"){const a=m(t.ordered?"ol":"ul",{class:"guidebook-steps"});for(const o of t.items){const i=m("li",{});i.append(ze(o)),a.append(i)}n.append(a);continue}if(t.kind==="rule"){n.append(m("hr",{class:"guidebook-rule"}));continue}t.kind==="heading"||t.kind==="practice"||t.kind==="attention"||n.append(Rn(t.text))}}function Oo(n){const e=m("section",{class:"guidebook-practice-part"});return e.append(m("h2",{class:"guidebook-practice-label"},[n.label])),Gt(e,n.blocks),e}function Po(n){return m("nav",{class:"guidebook-prev","aria-label":"Previous reading"},[m("a",{href:n.href,class:"guidebook-prev-link",id:n.id},[m("span",{class:"guidebook-prev-arrow","aria-hidden":"true"},["← "]),n.title])])}function ce(n,e,t={}){const a=m("article",{class:"guidebook-article guidebook-chapter"});let o=he(!0);a.append(o),t.previous&&o.append(Po(t.previous)),o.append(m("h1",{class:"guidebook-chapter-title"},[e.title]));for(const i of e.blocks){if(i.kind==="heading"){o=he(!1),a.append(o);const r=m("h2",{class:"guidebook-section-title"},[i.text]),s=yo(i.text);s&&(r.id=s,r.tabIndex=-1),o.append(r);continue}if(i.kind==="practice"){o=he(!1),a.append(o);const r=m("aside",{class:"guidebook-practice","aria-label":"Summary, experiment, and intention"});for(const s of i.parts)r.append(Oo(s));o.append(r);continue}if(i.kind==="attention"){o=he(!1),a.append(o),o.append(Co());continue}Gt(o,[i])}if(e.references.length){o=he(!1),a.append(o),o.append(m("h2",{class:"guidebook-section-title",id:"references"},["References"]));const i=m("ul",{class:"guidebook-references"});for(const r of e.references)i.append(qt(r));o.append(i)}t.next&&(o=he(!1),a.append(o),o.append(m("p",{class:"guidebook-next"},[m("a",{href:t.next.href,class:"guidebook-next-link",id:t.next.id},[t.next.title,m("span",{class:"guidebook-next-arrow","aria-hidden":"true"},[" →"])])]))),n.append(a)}const Fo=`# You Are Dreaming. Notice.

Dreams get away with an astonishing amount.

A person who died years ago walks into the room.

Your house has six extra floors.

You are standing in a city that somehow feels like your childhood bedroom.

Your phone has seventeen buttons you have never seen before.

You flap your arms and begin to fly.

And your dreaming mind responds:

Sure.

Seems reasonable.

This may be one of the strangest things about dreaming.

The clue can be standing directly in front of us and we still miss it.

Learning to lucid dream is partly learning to notice the clue.

## The Clue Was Right There

A lucid dream begins when something changes in the dreamer's awareness.

The dream continues, but now there is another thought inside it:

**I am dreaming.**

That recognition is sometimes spontaneous. Other times something unusual triggers it.

Lucid-dream researchers and practitioners often call these clues **dream signs**.

A dream sign might be dramatic.

You are flying.

You meet someone who died years ago.

You breathe underwater.

Or it might be much quieter.

A room looks slightly wrong.

A familiar street leads somewhere impossible.

You feel an emotion that seems unusually intense.

Your hands look strange.

The chronology of the last few minutes makes absolutely no sense.

What matters is less the particular sign than what happens next.

Something unusual occurs.

And instead of drifting past it, awareness turns toward it.

**Notice.**

## Your Dreams Have Habits

Once you begin remembering dreams regularly, something interesting happens.

They stop looking completely random.

Certain places return.

Certain people return.

Certain situations repeat.

There may be recurring emotional states.

There may be physical impossibilities that your dreaming mind accepts every time.

You might repeatedly be late for something.

You might find yourself in schools you have not attended for decades.

Your house might routinely contain rooms that do not exist.

Technology may refuse to behave normally.

Animals may talk.

You may float.

You may be chased.

You may suddenly know how to do something impossible.

These recurring elements become your personal vocabulary of dreaming.

There is no universal dream sign that everyone needs to memorize.

Your dreams teach you their own habits.

This is one reason the dream journal matters.

It is more than storage.

It becomes evidence.

Read several of your dreams together and ask:

**What keeps happening here?**

You are looking for anything impossible, improbable, recurring, emotionally distinctive, or simply strange enough that waking-you would normally stop and examine it.

## Four Ways a Dream Gives Itself Away

Stephen LaBerge and other lucid-dream researchers have used categories for dream signs that are useful without turning this into a taxonomy lesson.

The categories are simple enough.

Sometimes the strangeness is **inside you**.

Your thoughts, emotions, sensations, memories, or perceptions behave differently than they normally do.

Sometimes the strangeness is in an **action**.

Someone performs the impossible.

A car drives vertically up a wall.

You jump and remain in the air.

Sometimes it is in **form**.

An object changes shape.

A person's face will not stay the same.

Your hands have too many fingers.

Sometimes it is the **context** itself.

You are forty-seven years old and sitting in your high-school classroom waiting for algebra to begin.

Nobody thinks this is unusual.

Including you.

That last part is important.

Dreams are extraordinarily good at supplying explanations for themselves.

The impossible thing happens and the mind immediately creates a reason it is perfectly ordinary.

That is the habit we are interrupting.

## Am I Dreaming?

When I was practicing lucid dreaming more seriously, I sometimes asked myself during the day:

**Am I dreaming?**

I did more than ask the question.

Sometimes I would stand there and imagine myself slowly hovering off the ground.

Not rocketing into the sky.

Just lifting.

A few inches would have been enough.

I obviously had no idea what hovering was supposed to feel like.

That became part of the experiment.

How exactly do you fly when you have never flown?

Later, in dreams, I had the same problem.

Sometimes I flapped my arms.

Sometimes I ran and jumped.

Sometimes I tried to move from somewhere around my solar plexus, as though there were some internal center I could push from.

For a while, hovering seemed like the most reasonable version.

I could sometimes get a little way off the ground.

Not exactly Superman.

But it was progress.

I still do not know whether imagining hovering while awake directly helped me hover in dreams.

Maybe it did.

Maybe repeatedly imagining the possibility simply made the idea more available when I was dreaming.

Maybe asking **Am I dreaming?** during waking life sometimes carried into sleep.

Maybe the whole thing worked through expectation.

Those possibilities are interesting enough.

The experiment does not require us to settle the mechanism first.

## Actually Ask the Question

There is an important difference between asking:

**Am I dreaming?**

and saying:

*Am I dreaming? Of course not. Moving on.*

The second one is nearly useless.

The practice only becomes interesting when, for a moment, you genuinely allow both possibilities.

Paul Tholey developed what he called the **reflection technique** for lucid dreaming. During waking life, he repeatedly questioned whether he was awake or dreaming, especially when something unusual occurred.

The purpose was larger than performing a trick.

He wanted to cultivate what he described as a critical attitude toward one's current state of consciousness.

Something strange happens.

Awareness wakes up a little.

**What is happening right now?**

That is a richer exercise than merely pressing a finger against your palm because an alarm told you to perform a reality check.

The technique becomes attention practice.

## How Did I Get Here?

One particularly good question is:

**How did I get here?**

Try it now.

Not philosophically.

Literally.

What were you doing five minutes ago?

What happened before that?

How did one event connect to the next?

Waking experience usually has continuity.

Dreams often counterfeit continuity.

You find yourself in a grocery store and somehow know you have been shopping for twenty minutes.

But were you?

Trace backward.

Maybe thirty seconds earlier you were on a boat.

Maybe there was no transition at all.

The dream simply supplied a new scene and the feeling that everything had always been this way.

That makes memory itself a useful thing to examine.

When you ask **How did I get here?**, you are looking for the seam.

## Reality Tests

There are many traditional reality tests in lucid-dream practice.

Read text, look away, then read it again.

Examine your hands.

Try to breathe while your nose is gently pinched.

Try a familiar light switch.

Ask whether anything in the environment is impossible.

Some of these work better than others for different people.

Research gives us a reason to keep our expectations modest.

Reality testing is a legitimate lucid-dream induction technique, but studies have not shown that simply performing lots of reality checks reliably produces lucid dreams. In a large 2020 study comparing induction methods, the number of daytime reality tests did not significantly predict lucid dreaming success. MILD and SSILD showed stronger results.[1]

That does not make reality testing useless.

It changes what I think is important about it.

The point is less:

**Perform the correct trick.**

The point is:

**Become someone who notices when reality deserves another look.**

## Attention Before Technique

Imagine this happens tomorrow.

You walk outside and see a deer standing in the middle of a parking lot.

That is possible.

But it is unusual.

Instead of merely thinking *huh, deer*, pause.

Look around.

Feel your feet.

Look at your hands.

Remember where you were ten minutes ago.

Ask:

**Am I dreaming?**

Actually consider it.

Then continue with your day.

Later you notice that a clock displays a strange number.

Pause again.

Someone says something that gives you a sudden feeling of déjà vu.

Pause.

You enter a room and momentarily forget why you came in.

Pause.

We are not trying to become suspicious of reality.

We are becoming interested in it.

Those are different things.

## The Dreamlike Day

Tibetan dream-yoga traditions approach this territory from a very different philosophical direction.

In Tenzin Wangyal Rinpoche's presentation of Bön dream yoga, practitioners cultivate awareness of waking experience itself as dreamlike.

Within that tradition, this is part of a much larger spiritual understanding of mind, appearance, attachment, and liberation.

We do not need to collapse that philosophy into modern lucid-dream science.

They are not the same system.

But the practical overlap is fascinating.

A modern lucid-dream technique says:

**Become more reflective about your state while awake so awareness may continue into dreams.**

Dream yoga asks the practitioner to examine ordinary experience with a similarly altered relationship to certainty and appearance.

Different maps.

A strangely similar invitation:

**Look again.**

## What Happens When You Practice Noticing?

There is another reason I like this exercise.

It remains useful even when you never become lucid that night.

You start examining attention itself.

How much of the day happens automatically?

How often do you move from one activity into another without noticing the transition?

How many familiar things do you actually look at?

How quickly does the mind explain something unexpected and return to business?

Try looking at your own hands as though you have never seen hands before.

They are bizarre.

Five jointed branches attached to a flexible pad of flesh.

You have probably been carrying them around all day without giving them much consideration.

Dreams may be strange.

Ordinary waking life has been getting away with quite a lot too.

## Your Dream Signs

Go back through several dreams you have recorded.

You are looking for repetition and impossibility.

Mark whatever catches your attention.

Maybe your dreams contain airports constantly.

Maybe you are always back at an old job.

Maybe elevators behave incorrectly.

Maybe you regularly encounter people from different eras of your life in the same place.

Maybe animals are unusually important.

Maybe gravity becomes optional.

Maybe the clue is emotional rather than visual.

Do not worry yet about what these things symbolize.

That is another question.

For now, their usefulness is simpler.

They are signs saying:

**Look here.**

Choose a few.

These become reminders during waking life.

If elevators repeatedly behave strangely in your dreams, let elevators become interesting while you are awake.

When you step into one:

**Am I dreaming?**

If flight is common in your dreams, occasionally imagine your feet becoming weightless.

If you repeatedly dream of a childhood home, let thoughts of that house become a cue.

Not because any of these objects possesses special power.

Because you are building a bridge between waking attention and dreaming attention.

## Notice

For the next several days, experiment with this.

Review your dream journal and find a few personal dream signs.

Then let unusual moments during waking life interrupt you.

Pause.

Look.

Remember how you arrived here.

Notice your body.

Notice the environment.

Ask:

**Am I dreaming?**

Give the question a real moment.

If you want to experiment further, imagine one impossible thing becoming possible.

Hover.

Float.

Move through a wall.

Change the color of the room.

Choose something playful enough that you actually remember doing it.

Then continue with your day.

The goal is not to convince yourself that you are dreaming while awake.

The goal is to become better at asking the question.

Because tonight, something impossible may happen.

A dead relative may walk into the kitchen.

The walls may change color.

You may discover an additional floor in your house.

You may begin floating three inches above the ground while trying desperately to remember whether flying requires arm flapping.

And perhaps this time, instead of accepting it immediately, another thought appears.

**Wait.**

Then:

**I am dreaming.**

That moment is where the next excursion begins.

---

## Try This

Look through several recent dreams.

Find three recurring or unusual elements.

Write them down.

Examples:

**Old school.**

**Impossible rooms.**

**Flying.**

During waking life, let anything resembling those signs become an invitation to notice.

---

### Summary

Dreams often contain recurring clues: impossible events, familiar places, unusual emotions, repeated situations, strange technology, people from another period of life, or details that simply do not behave as waking reality normally does.

Learning your own dream signs gives you something specific to notice rather than waiting for a dream to become obviously absurd.

### Experiment

Review several dreams you remember.

Choose one sign that appears more than once, or one category of sign that feels especially characteristic of your dreams.

During waking life, when something genuinely surprising, unusual, repetitive, or dreamlike catches your attention, pause for a moment and really notice it.

You are practicing the movement from automatic experience to curiosity.

### Intention

**I notice what is unusual.**

---

## References

[1] Aspy, D. J. “Findings From the International Lucid Dream Induction Study.” *Frontiers in Psychology* 11 (2020): 1746. https://doi.org/10.3389/fpsyg.2020.01746

[2] Tholey, P. “Techniques for Inducing and Manipulating Lucid Dreams.” *Perceptual and Motor Skills* 57 (1983): 79–90.

[3] Tholey, P. “Overview of the Development of Lucid Dream Research in Germany.” *Lucidity Letter* 8, no. 2 (1989).

[4] LaBerge, S., & Rheingold, H. *Exploring the World of Lucid Dreaming*. Ballantine Books, 1990.

[5] Stumbrys, T., Erlacher, D., Schädlich, M., & Schredl, M. “Induction of Lucid Dreams: A Systematic Review of Evidence.” *Consciousness and Cognition* 21, no. 3 (2012): 1456–1475.

[6] Tenzin Wangyal Rinpoche. *The Tibetan Yogas of Dream and Sleep*. Revised and updated edition. Shambhala, 2022.
`,Mn="You Are Dreaming. Notice.",Bn="/you-are-dreaming-notice",mt=`#${Bn}`;let on=null;function Lo(){return on||(on=ye(Fo)),on}const Ut=`# You Are Dreaming. Recognize.

Something impossible happens.

You notice it.

And then—

nothing.

You keep dreaming.

This is the part that fascinates me.

A dream can hand us evidence that would be astonishing in waking life.

A dead relative walks through the door.

The hallway leads into the ocean.

Gravity becomes negotiable.

The moon is sitting on the kitchen table.

We may even notice that something is strange.

And somehow the final thought still fails to arrive:

**I am dreaming.**

That tiny step is what we are going to practice now.

Remember.

Notice.

Recognize.

## Remembering the Future

Memory usually sounds like something pointed backward.

What did I have for breakfast?

Where did I leave my keys?

What was the name of that person?

But memory also points forward.

You leave the house thinking:

**When I pass the post office, I need to mail this letter.**

Hours later you see the post office.

Something happens.

The building becomes a cue.

The intention returns.

**The letter.**

Psychologists call this **prospective memory**: remembering to perform an intended action when the appropriate moment arrives.[1]

We use it constantly.

When I get home, I call my friend.

When the timer goes off, I check the oven.

When I see Sarah, I ask about the book.

Lucid-dream practice gives prospective memory a wonderfully strange assignment:

**When I am dreaming, I recognize that I am dreaming.**

The problem, obviously, is that dreams rarely announce themselves politely.

There is no notification.

No little bell.

No message saying:

> DREAM MODE ENABLED

So we need a cue.

Fortunately, Chapter 2 gave us plenty.

Dream signs.

## Turn the Clue Into a Reminder

Suppose you often dream about your old school.

Normally the school appears and the dream continues.

You walk through the halls.

You look for a classroom.

You discover there is apparently a roller coaster behind the cafeteria.

Completely ordinary dream behavior.

Now we give the school another job.

The school becomes a reminder.

**When I see this place, I recognize that I am dreaming.**

Or maybe your recurring sign is different.

A person.

A strange house.

Broken technology.

Being late.

Being chased.

Finding extra rooms.

Floating.

Driving a car that barely works.

Being somewhere you have not lived in twenty years.

The particular sign matters less than the connection you create with it.

You are taking something that already appears in your dreams and attaching an intention to it.

That is the basic territory of one of the most studied lucid-dream induction methods:

**Mnemonic Induction of Lucid Dreams**, usually shortened to **MILD**.

The name makes it sound much more complicated than it is.

## MILD

Stephen LaBerge developed MILD during his early lucid-dream research.

Versions of the technique vary, but the central process is remarkably simple.

You remember a dream.

You find something in it that could have told you that you were dreaming.

Then you mentally return to the dream.

This time, when the clue appears, you recognize it.

**I am dreaming.**

You rehearse that moment while forming the intention to recognize dreaming the next time it happens.

This is important.

MILD is sometimes reduced to repeating a sentence in bed.

The sentence matters.

The intention matters.

But there is another piece that I find more interesting:

**You rehearse the recognition.**

You are not merely wishing for a lucid dream.

You are practicing a future moment.

Research on prospective memory outside lucid dreaming gives us at least a reasonable cognitive comparison.

One method for strengthening prospective memory is an **implementation intention**:

When a particular situation occurs, perform a particular action.

A systematic review and meta-analysis found that these cue-and-response intentions improved prospective-memory performance, with combined verbal and imagery rehearsal producing a relatively larger effect than verbal intention alone.[1]

That research was not about lucid dreaming.

It does not prove that MILD works through exactly the same mechanism.

But the resemblance is hard to ignore.

Cue.

Intention.

Mental rehearsal.

Later recognition.

So instead of treating an intention as a magic phrase, we can treat it as something to practice.

## Re-enter the Dream

Take a dream you remember.

It does not need to be recent, although recent dreams have one advantage: the scene may still feel alive.

Find the moment where the dream gave itself away.

Maybe you were talking with someone who has been dead for years.

Maybe you were standing in your childhood home.

Maybe you jumped and remained suspended in the air.

Now close your eyes and rebuild that scene.

See what you saw.

Feel where your body seemed to be.

Notice the room.

The light.

The people.

The strange thing happens again.

But this time you respond differently.

You notice it.

Then recognition arrives.

**I am dreaming.**

Stay with that moment for a few seconds.

What does recognizing it feel like?

Surprise?

Excitement?

A sudden widening of attention?

Imagine the realization becoming clear while the dream remains around you.

Then imagine doing one simple thing deliberately.

Touch the wall.

Look at your hands.

Speak out loud.

Walk through a doorway.

Or perhaps—

float.

## My Hovering Experiment

When I was practicing lucid dreaming years ago, I sometimes stopped during waking life and asked myself:

**Am I dreaming?**

I also experimented with imagining myself slowly hovering off the ground.

I do not know whether that waking rehearsal caused anything later.

I cannot tell you that imagining hovering taught my dreaming brain how to hover.

But something about it still interests me.

When I eventually became lucid in dreams, flying was surprisingly difficult.

Apparently my dream body had not read the manual.

I tried flapping my arms.

I tried running and jumping.

I tried moving from somewhere around my solar plexus, as though that might be the engine.

Sometimes I could get into the air but not go anywhere.

Once I hovered about a foot off the ground.

Another time I managed to fly and immediately collided with a light pole.

Lucid dreaming preserves one's dignity only selectively.

But hovering became interesting because it was simple.

I did not need to imagine myself rocketing across the sky.

I could stand somewhere ordinary and entertain one small impossible movement.

My feet leave the ground.

I rise a few inches.

I remain there.

Even now I think it makes a good experiment.

Not because hovering has a special scientific status.

It does not.

And not because everyone should use the same imagined action.

The interesting part is the rehearsal.

During waking life I could imagine an impossible event while asking a sincere question about my state.

Later, dreams supplied impossible events of their own.

Was there a connection?

Maybe.

Expectation can clearly influence dreams in many ways, but that does not tell us exactly what happened in my particular case.

So I would rather keep the question open.

We can use rehearsal deliberately and see what happens.

## Ask the Question Like You Mean It

This brings us back to:

**Am I dreaming?**

It is probably the most famous lucid-dream question.

It is also very easy to make useless.

Imagine checking your phone ten times a day and asking:

**Am I dreaming?**

No.

Continue.

Two hours later:

**Am I dreaming?**

Obviously not.

Continue.

Eventually the words become another habit performed without attention.

That may miss the interesting part.

Studies of lucid-dream induction have produced mixed results for repetitive daytime **reality testing**.

In the large International Lucid Dream Induction Study, simply performing more reality tests during the day was not associated with more lucid dreams, and adding daytime reality testing did not significantly improve outcomes for participants using MILD with Wake-Back-to-Bed.[2]

That does not prove reality testing is useless.

Longer training periods and different forms of reflective practice remain open questions.

But it gives us a good reason to care about the quality of the question rather than the number of repetitions.

So when you ask:

**Am I dreaming?**

Stop.

For a few seconds, seriously consider that the answer might be yes.

Look around.

How did you get here?

What were you doing five minutes ago?

Does the sequence make sense?

Is anything physically impossible?

Is something subtly wrong?

Does the place match your memory of it?

Does your body feel ordinary?

Do words and numbers behave normally when you look away and look back?

And perhaps most importantly:

**What would convince me that this is a dream?**

You are not trying to prove that you are awake.

You are investigating your current state.

That difference matters to me.

One is a ritual.

The other is curiosity.

## Make Waking Life Strange for a Moment

There is a playful way to practice this.

Several times during the day, especially when something surprising, emotional, repetitive, or dreamlike happens, interrupt your automatic explanation of reality.

For a moment, imagine that this really is a dream.

Not metaphorically.

Literally entertain the possibility.

Look at the room differently.

Listen.

Feel the weight of your body.

Try to remember how you arrived here.

Notice the texture of whatever you are touching.

Then imagine doing your chosen impossible action.

For me, that might be hovering.

I do not need to actually jump off anything.

Please keep gravity experiments imaginary while awake.

I simply imagine the sensation:

My feet become light.

The pressure against the floor disappears.

My body rises.

And as it happens, the recognition is already there:

**I am dreaming.**

Then ordinary waking life continues.

We are rehearsing a relationship.

Unusual event.

Attention.

Recognition.

## Use Your Own Dream Signs

This becomes much more interesting when you use signs from your actual dreams.

Go back through several remembered dreams.

Choose one recurring element.

Maybe:

- your childhood home;
- school;
- someone who has died;
- impossible architecture;
- malfunctioning phones;
- strange animals;
- floating;
- driving;
- being lost;
- missing an appointment;
- an unusual emotional state.

Choose something that genuinely belongs to your dream life.

Then spend a minute imagining it.

See the school hallway.

Hear the voice.

Feel the strange room.

Let the familiar dream sign appear.

And attach recognition to it.

**When this appears, I recognize that I am dreaming.**

Or, using the present-oriented language we have been practicing:

**This is my dream sign. I recognize that I am dreaming.**

The wording matters less than the experience you build around it.

The sign appears.

Your attention changes.

Recognition follows.

## The Useful Awakening

MILD is often practiced after waking from a dream.

That makes intuitive sense.

You already have the material.

The dream is still nearby.

Instead of inventing a hypothetical dream, you can work with one that just happened.

This also connects with the structure of sleep.

REM periods generally become longer later in a typical night's sleep, making the later portion of the night attractive territory for lucid-dream research and practice.

Researchers have therefore often combined MILD with **Wake-Back-to-Bed**, or **WBTB**.

The name describes the procedure perfectly.

Wake up.

Remain awake for a period.

Return to bed.

In one sleep-laboratory study, participants were awakened after about six hours of sleep and practiced MILD before returning to sleep. Depending on the experimental condition, substantial numbers reported lucid dreams during the following morning sleep period, although the number confirmed using objective eye-signal criteria was lower.[3]

That is promising.

It is also a small study.

No induction method makes lucid dreams appear reliably on command.

A 2023 systematic review of empirical lucid-dream induction research nevertheless found MILD to be the most effective technique among the methods it reviewed.[4]

So MILD deserves our attention.

It does not deserve mythology.

## Sleep Is Part of the Experiment

There is a temptation with sleep practices to become ambitious.

Set alarms.

Wake repeatedly.

Try harder.

Sleep less.

Record everything.

Do more.

That is not the direction I want this book to take.

Sleep itself matters.

If a technique turns the night into a battle against sleep, something has gone wrong.

The International Lucid Dream Induction Study found an interesting relationship: participants were more likely to report lucid dreams when they returned to sleep relatively quickly after performing the induction technique.[2]

So lying awake for an hour desperately attempting to become lucid may be defeating the practical purpose.

We want enough awareness to form the intention.

Then we let sleep happen.

Natural awakenings are especially convenient.

If you wake from a dream during the night and still feel sleepy, you already have almost everything you need.

Remember the dream.

Find the sign.

Rehearse recognizing it.

Return to sleep.

No alarm required.

## Wake-Back-to-Bed Is Optional

If you want to experiment with WBTB deliberately, treat it as an occasional experiment rather than a nightly obligation.

Choose a night when you have enough time for sleep.

Wake later in the sleep period.

Keep the interruption calm.

Recall the dream if you have one.

Practice recognition.

Then return to bed while you are still able to become sleepy again.

Research protocols have sometimes used awakenings of thirty or sixty minutes.[3]

That tells us what researchers tested.

It does not mean you need to stay awake for an hour.

Our goal is not to reproduce a sleep laboratory in the bedroom.

If an intentional awakening leaves you wide awake, irritated, or short on sleep the next day, protect the sleep and simplify the experiment.

There is always another night.

Lucid dreaming is interesting.

Being exhausted at breakfast is less interesting.

## Recognition Is the Skill

I like MILD because beneath the acronym it is teaching something very ordinary.

Remember what you intend to do.

Notice the opportunity.

Do it.

Except the opportunity occurs inside a dream.

The strange part is not that we need some exotic mental power.

The strange part is that we can encounter impossible worlds every night and accept them without question.

So we are building a small interruption into that acceptance.

Something happens.

Wait.

I know this.

I have seen this kind of thing before.

**I am dreaming.**

That realization may arrive suddenly.

It may arrive quietly.

It may last three seconds before excitement wakes you up.

That still counts.

Recognition comes before control.

You do not need to fly.

You do not need to summon anyone.

You do not need to open a portal, leave your body, visit another realm, solve consciousness, or obtain the telephone number of the universe.

For now, recognize the state.

Everything else can come later.

We remembered the dream.

We learned its clues.

Now we give the clue a job.

**You are dreaming. Recognize.**

---

### Summary

Recognition connects a dream clue with a remembered intention.

MILD uses prospective memory, dream signs, intention, and mental rehearsal to practice a future moment: something unusual happens, attention changes, and the thought arrives—

**I am dreaming.**

The aim is not to repeat a question mechanically. It is to recognize the state when the opportunity appears.

### Experiment

Choose a dream you remember.

Find one moment that could have revealed the dream.

Close your eyes and reconstruct it.

Let the dream sign appear again.

This time, pause.

Recognize it.

**I am dreaming.**

Imagine that realization becoming clear while the dream continues.

Then perform one simple imagined action: touch something, speak, look carefully around you, or slowly hover a few inches from the ground.

If you wake naturally from a dream during the night, remember the dream, find its clue, rehearse recognition, and let yourself return to sleep.

During waking life, when something genuinely strange catches your attention, ask:

**Am I dreaming?**

Give the question a few sincere seconds.

### Intention

**When I am dreaming, I recognize that I am dreaming.**

---

## References

[1] Chen, X.-J., Wang, Y., Liu, L.-L., Cui, J.-F., Gan, M.-Y., Shum, D. H. K., & Chan, R. C. K. “The Effect of Implementation Intention on Prospective Memory: A Systematic and Meta-analytic Review.” *Psychiatry Research* 226, no. 1 (2015): 14–22. https://doi.org/10.1016/j.psychres.2015.01.011

[2] Aspy, D. J. “Findings From the International Lucid Dream Induction Study.” *Frontiers in Psychology* 11 (2020): 1746. https://doi.org/10.3389/fpsyg.2020.01746

[3] Erlacher, D., & Stumbrys, T. “Wake Up, Work on Dreams, Back to Bed and Lucid Dream: A Sleep Laboratory Study.” *Frontiers in Psychology* 11 (2020): 1383. https://doi.org/10.3389/fpsyg.2020.01383

[4] Tan, S., Fan, J., Sun, H., et al. “A Systematic Review of New Empirical Data on Lucid Dream Induction Techniques.” *Journal of Sleep Research* 32, no. 3 (2023): e13786. https://doi.org/10.1111/jsr.13786
`,Be="You Are Dreaming. Recognize.",_n="/you-are-dreaming-recognize",pt=`#${_n}`,Ho="PEX-IMPLEMENTATION-PLACEHOLDER";let rn=null;function Wo(){const n=Ut.trim();return!n||n.includes(Ho)?!1:n.startsWith(`# ${Be}`)}function Yo(){if(!Wo())throw new Error("Chapter 3 manuscript has not been supplied by PEX_PRIMARY");return rn||(rn=ye(Ut)),rn}const zo=`# Feel the Body.

Before we try to leave the body, perhaps we should spend some time finding it.

That sounds ridiculous.

We have been carrying one around all day.

Surely we know where it is.

But close your eyes for a moment.

Without moving your right hand, put all of your attention into your right thumb.

Not the idea of your thumb.

The sensation of it.

What tells you that it is there?

Pressure?

Warmth?

A pulse?

A faint buzzing?

The contact between skin and air?

Maybe almost nothing.

Now move your attention to your left big toe.

Again, do not move it.

Just find it from the inside.

Something interesting happens when we begin paying attention to the body this way.

Places that were almost absent from awareness become strangely vivid.

This is where I want to begin our next experiment.

Not with an energy system.

Not with chakras.

Not with an invisible second body.

Not even with the assumption that anything unusual is happening.

Just this:

**Put your attention somewhere in your body and notice what happens.**

## A Body You Usually Ignore

Most of the time, the body works quietly in the background.

You do not need to continuously monitor the pressure of your shirt against your shoulders.

You do not need to keep checking whether your left knee still exists.

Your brain has more useful things to do.

So sensation is selective.

Some signals become important.

Others disappear into the background.

Then attention changes the balance.

Laboratory research on somatosensory attention shows that directing attention toward a particular part of the body can alter the processing of touch and bodily sensation associated with that location.[1]

That does not mean attention creates every sensation we feel.

It means attention matters.

And that gives us something useful to experiment with.

If we are eventually going to explore sleep transitions, floating sensations, vibrations, imagined motion, lucid dreaming, or experiences people describe as leaving the body, then becoming more sensitive to the body we already experience seems like a reasonable place to start.

## My First Energy Exercise

One of the exercises that stayed with me came from qigong.

I would hold my hands in front of me as though I were holding a ball.

Then I would slowly move them closer together and farther apart.

After a while there could be a strange sensation between them.

Soft resistance.

Warmth.

Tingling.

Almost like a fuzzy electrical field.

If I moved my hands, the sensation seemed to move with them.

That is the kind of experience that invites an explanation immediately.

**Energy.**

Maybe.

Different traditions have developed very different explanations for sensations like these.

Qi.

Prana.

Vital energy.

Subtle bodies.

Biofields.

Nerve activity.

Circulation.

Attention.

Expectation.

Sensory processing.

Some of those explanations may eventually turn out to describe different pieces of the same thing.

Some may not.

At this stage, I do not think we need to decide.

The sensation itself is more interesting than the label.

Because after practicing with my hands, I began discovering that I could sometimes find a similar sensation elsewhere.

An arm.

A leg.

My torso.

It felt something like very soft vibrating electricity.

Tiny sparks.

A fuzzy internal buzzing.

And the curious part was that attention seemed involved.

If I concentrated on an area, sensation could become more noticeable.

So that became another experiment.

**Can I move attention through the body and notice a response?**

You can try the same question without needing to call the response energy.

## Find One Finger

Start with something small.

Close your eyes.

Let your hand rest comfortably.

Choose one finger.

Put your attention inside it.

Do not stare at it mentally as though you are looking at a photograph.

Try to feel its volume.

Where does the finger begin?

Where does it end?

Can you sense the fingertip?

The nail?

The joints?

The skin?

The center?

Now imagine your attention moving slowly from the base of the finger toward the tip.

Then back again.

Almost as though you were brushing through it from the inside.

You might feel warmth.

Tingling.

Pressure.

Pulsing.

A crawling sensation.

Heaviness.

Lightness.

You may discover that the finger suddenly feels enormous.

Or strangely distant.

Or completely ordinary.

You may feel nothing interesting at all.

All of those are usable observations.

The point is not to manufacture the correct sensation.

There is no correct sensation.

We are learning to notice.

## Attention Can Move

Now try something slightly larger.

Place your attention in one hand.

Then move it slowly through the wrist and into the forearm.

Pause.

Continue toward the elbow.

Then the upper arm.

Shoulder.

Across the chest.

Down the other arm.

You are not moving the physical body.

You are moving attention through your representation of it.

This distinction will become important later.

For now, the movement can be slow.

Imagine a brush.

A sponge.

A band of warmth.

A wave.

A point of light.

Or use no image at all.

Just feel your way through.

Some systems of energy work deliberately use tactile imagery like this because it gives attention something concrete to do.

I like that approach.

The metaphor does not need to be literally true to be useful.

If imagining a sponge moving through your forearm helps you notice your forearm more clearly, then the sponge has done its job.

## First Relax the Machine

There is another reason to learn the body this way.

It can help us relax it.

This has been one of the most useful practices for me at night.

When I want to settle down deeply, I do not simply tell myself:

**Relax.**

That instruction is too vague.

Instead I move through my body piece by piece.

I deliberately tense a group of muscles.

Then I let them go.

Feet.

Legs.

Hands.

Arms.

Stomach.

Shoulders.

Face.

Eventually I have intentionally tensed and released almost everything I can find.

By the end, the difference between tension and relaxation becomes much easier to recognize.

This practice has a name in psychology:

**progressive muscle relaxation**, or PMR.

It grew out of work by physician Edmund Jacobson in the early twentieth century and has since been adapted into many shorter forms.

The basic principle is beautifully simple.

First, feel tension deliberately.

Then feel its absence.

## Why Tense Before Relaxing?

Try relaxing your shoulders right now.

Maybe they moved.

Maybe they did not.

Now deliberately raise them slightly toward your ears.

Hold that tension briefly.

Notice it.

Then release them.

There is a contrast.

That contrast teaches something.

Sometimes we carry low levels of muscular tension so continuously that they stop registering as tension.

The jaw is slightly clenched.

The forehead is contracted.

The hands are doing unnecessary work.

The shoulders are lifted.

The stomach is braced.

We are accustomed to it.

Deliberately tightening a muscle makes the difference much easier to perceive when it releases.

That is the part of progressive relaxation I find useful.

You are not merely ordering the body to relax.

You are learning what relaxation feels like.

## A Nighttime Body Release

Here is the version I use.

Make yourself comfortable in bed.

Let the position be one you could actually fall asleep in.

There is no need to lie rigidly on your back because somebody's projection manual said so.

Sleep matters more than posture.

Start at one end of the body.

I usually find it easiest to move systematically so I do not have to think very much.

For example:

Feet.

Calves.

Thighs.

Buttocks and hips.

Abdomen.

Chest.

Hands.

Forearms.

Upper arms.

Shoulders.

Neck.

Jaw.

Eyes and forehead.

For each area, gently tense the muscles.

Enough to unmistakably feel the tension.

There is no prize for squeezing harder.

If something hurts, cramps, or should not be tensed because of an injury or medical condition, leave it alone and simply imagine that area softening.

Hold the tension briefly.

Then release it.

And pay attention to the release.

That last part matters.

Do not immediately race toward the next body part.

Notice what changed.

Heavy.

Warm.

Loose.

Soft.

Spreading.

Nothing dramatic.

Whatever is actually there.

Then move on.

## Feet

Curl your toes gently.

Feel the tension.

Release.

Let the feet become heavy.

## Legs

Tighten the calves gently.

Release.

Tense the thighs.

Release.

Feel how much work the legs can stop doing when there is nowhere to go.

## Hips and Stomach

Gently tense the muscles around the hips and buttocks.

Release.

Tighten the abdomen slightly.

Release.

Let the belly move naturally with breathing.

## Hands and Arms

Make gentle fists.

Notice the tension through the hands and forearms.

Release the fingers.

Let the hands become useless for a while.

Tense the arms gently.

Release.

## Shoulders

Lift the shoulders slightly.

Feel the effort.

Release them.

Sometimes they seem to drop farther than expected.

## Face

This one surprises me.

The face can be working very hard for absolutely no reason.

Gently tighten the jaw.

Release it.

Let the tongue rest.

Squeeze the eyes gently.

Release.

Wrinkle the forehead.

Release.

Then notice the whole face at once.

The expression can disappear.

No audience.

Nothing to perform.

## Then Stop Trying

This may be the most important part.

When you finish, you are finished.

You do not need to maintain perfect relaxation.

You do not need to check whether every muscle stayed relaxed.

You do not need to start over because your foot moved.

The practice is preparation for sleep.

Let sleep win.

A growing body of randomized research suggests that progressive muscle relaxation can improve subjective sleep quality in adults. A 2026 systematic review and meta-analysis including thirty-one randomized trials found overall improvement in reported sleep quality, although results varied substantially across studies and populations.[2]

Another recent meta-analysis similarly found an overall sleep-quality benefit while emphasizing substantial variation between the included studies.[3]

So there is legitimate evidence behind this simple practice.

That does not mean progressive relaxation guarantees sleep.

And it certainly does not establish that it produces lucid dreams or out-of-body experiences.

For our purposes, its usefulness is more basic.

It helps us learn the body.

It gives us a repeatable transition from ordinary activity toward rest.

And it makes physical tension easier to distinguish from subtler sensation.

That is enough.

## Relaxation and the Dream Work

There is another connection to what we have already been practicing.

Dream work happens while sleeping.

That sounds obvious, but it is remarkably easy to forget once we become excited about techniques.

If an exercise keeps us tense, analytical, frustrated, or awake for hours, then the exercise may be interfering with the very state we are trying to explore.

So this body practice has two possible endings.

Some nights you might relax the body and simply fall asleep.

Excellent.

Other nights you may reach the end of the sequence and still be comfortably awake.

That gives us another opportunity.

Instead of moving immediately, spend a little time feeling the relaxed body.

Where are your hands?

Where are your feet?

Without moving, can you locate them?

Do they feel exactly the same as they did before?

Perhaps.

Perhaps not.

The border between body awareness and sleep will become increasingly interesting later.

For now, just notice.

## The Body After Relaxation

After releasing the muscles, try moving attention through the body again.

Not the muscles.

Attention.

Start with one foot.

Move upward.

Leg.

Hip.

Torso.

Shoulder.

Arm.

Hand.

Then cross to the other side.

You may notice that the body feels different now.

Heavier.

Lighter.

Larger.

Smaller.

Less sharply defined.

Warm.

Buzzing.

Pulsing.

Quiet.

Some regions may seem to disappear from awareness entirely.

Again:

observation first.

If you feel a strong vibration, record that.

If you feel warmth, record warmth.

If you feel what you would personally describe as energy, write that.

But notice the difference between these two statements:

**I felt a vibrating sensation through both arms.**

and

**Energy left my astral body through my arms.**

The first reports an experience.

The second explains it.

Maybe someday we will have reasons to prefer one explanation over another.

For now, keeping those layers separate lets us investigate more honestly.

## What Does “Energy” Mean?

We are going to use the word **energy** in this book because the traditions we are exploring use it, and because many people naturally use it to describe these sensations.

But I want us to keep the quotation marks mentally available.

When I say **energy work**, I mean practices that direct attention, imagery and sensation through the body in ways that various traditions interpret as working with subtle energy.

I am not asking you to accept a particular physical substance called energy.

Nor am I asking you to reject that possibility before experimenting.

Feel first.

Name second.

Explain later.

That order will serve us well throughout Psychical Excursion.

## Try the Hands

Here is another simple experiment.

Lie down or sit comfortably.

Relax your shoulders.

Hold your hands a short distance apart.

Close your eyes if that helps.

Bring the palms slightly closer together.

Then farther apart.

Slowly.

Do not hunt for anything.

Notice temperature.

Air movement.

Muscular effort.

Tingling.

Pressure.

The sense of where each hand is.

Now imagine that there is a soft ball between the palms.

Compress it slightly.

Let it expand.

Move your hands around its edges.

Does the experience change?

Maybe you feel something striking.

Maybe the whole thing feels obviously imaginary.

Maybe it shifts from one to the other.

Good.

We are experimenting.

The goal is not to pass a belief test.

## There Is No Failure Sensation

I want to establish this early because it will matter later.

You do not need vibrations.

You do not need tingling.

You do not need warmth.

You do not need an energy rush.

You do not need your body to disappear.

There is no required sensation that proves you are progressing.

If you become good at deliberately locating attention in one foot and then deeply relaxing before sleep, you have already developed useful skills.

The spectacular sensations can take care of themselves.

Chasing them is probably the fastest way to become tense again.

## Two Skills at Once

So Chapter 4 really begins two practices.

During the day:

**feel the body deliberately.**

At night:

**release the body deliberately.**

They complement each other.

One increases attention.

The other reduces effort.

Later we are going to do something peculiar with both skills.

We will relax the physical body while keeping a thin thread of attention awake.

Then we will experiment with moving attention in ways that no longer require physical movement.

That is where some very strange territory begins.

We do not need to rush there.

Tonight we have enough to do.

Find the body.

Tense it.

Release it.

Feel what remains.

---

### Summary

Attention can make ordinarily unnoticed bodily sensations easier to perceive. We can use that ability to explore the body deliberately without deciding in advance whether sensations such as tingling, warmth, pressure or vibration represent nerves, attention, expectation, “energy,” or some combination we do not yet understand.

Progressive muscle relaxation adds a second skill: deliberately creating tension and then recognizing its release. Practiced gently at bedtime, it can help prepare the body for sleep while teaching the difference between muscular effort and subtler sensation.

### Experiment

Tonight, once you are comfortable in bed, move through your body one muscle group at a time.

Gently tense each area.

Pause long enough to recognize the tension.

Release it.

Notice the difference.

Continue until you have moved through the entire body.

When you finish, remain still for a moment.

Move your attention—not your muscles—from one foot slowly upward through the body.

Notice whatever is actually there.

Warmth.

Pressure.

Tingling.

Pulsing.

Heaviness.

Lightness.

Nothing unusual.

Do not search for the correct result.

Then let yourself sleep.

During the day, choose one finger, toe, hand or foot occasionally and practice locating it entirely through sensation without moving it.

### Intention

**I feel my body clearly. I release it completely.**

---

## References

[1] Gomez-Ramirez, M., Hysaj, K., & Niebur, E. “Neural Mechanisms of Selective Attention in the Somatosensory System.” *Journal of Neurophysiology* 116, no. 3 (2016): 1218–1231. https://doi.org/10.1152/jn.00637.2015

[2] Donato, K. O., Falcão, L., Nishizima, A., et al. “Progressive Muscle Relaxation Technique Improves Sleep Quality and Mental Health: A Systematic Review and Meta-analysis of Randomized Controlled Trials.” *Journal of Psychosomatic Research* 203 (2026): 112563. https://doi.org/10.1016/j.jpsychores.2026.112563

[3] “The Effects of Progressive Muscle Relaxation on Sleep Quality in Adults: A Systematic Review and Meta-analysis of Randomized Controlled Trials.” 2026. PubMed PMID 42625730.
`,Nn="Feel the Body.",qn="/feel-the-body",gt=`#${qn}`;let sn=null;function Bo(){return sn||(sn=ye(zo)),sn}const $t=`# Move Your Attention.

pex:attention-instrument

Look at the center.

Not at the whole design.

The center.

Around it, geometry turns so slowly that you may need a few seconds to decide whether anything is moving at all.

Rings inside rings.

Lines dividing circles.

Shapes repeating around a center that does not move.

Your eyes will probably wander.

That is fine.

Bring them back.

Center.

Again.

Center.

Stay there for a little while.

Then close your eyes.

What remains?

Maybe an afterimage.

Maybe a faint shape.

Maybe some color.

Maybe grainy light.

Maybe absolutely nothing but blackness.

That last possibility interests me personally.

When I close my eyes and someone tells me to visualize something, I generally do not see a detailed picture floating in the darkness.

Mostly I see darkness.

For years, instructions like:

**Picture a glowing ball of energy.**

were slightly mysterious to me.

Picture it where?

Apparently some people really can produce vivid internal pictures.

Other people get something faint.

Some people seem to know what they are imagining without actually seeing much of anything.

And some people report essentially no voluntary visual imagery at all.

So before we go any farther, I want to change the instruction.

You do not need to see the point.

**You only need some way of knowing where it is.**

Now put the point in the center of your right palm.

Do not move your hand.

Do not look at it.

Just locate the center of the palm from the inside.

There.

Hold your attention there for a few seconds.

Then begin moving it.

Palm.

Wrist.

Forearm.

Elbow.

Slowly.

Now reverse.

Elbow.

Forearm.

Wrist.

Palm.

Nothing physical moved.

But something did.

That is what we are going to investigate.

## Attention Has an Address

In the last chapter we learned that deliberately attending to the body can make normally quiet sensations more noticeable.

Now we are going to make the practice more precise.

Instead of merely asking:

**What can I feel?**

we are going to ask:

**Where can I put my attention?**

And then:

**Can I move it?**

This is not just poetic language.

The nervous system maintains organized representations of the body, including maps in somatosensory cortex that preserve relationships between different regions of the body.[1]

Your brain does not treat a touch on your thumb as interchangeable with a touch on your ankle.

Location matters.

Attention matters too.

A large body of tactile-attention research shows that touch presented at an attended body location tends to be detected more quickly and accurately than touch at an unattended location.[1]

So if you deliberately put your attention into one hand, that is not merely a metaphor for thinking about hands.

You are biasing processing toward a particular bodily location.

That gives us a useful starting point.

Not proof of subtle energy.

Not proof of an astral body.

Something simpler:

**Attention can be aimed at the body.**

And aimed attention changes experience.

## The Body Is More Than a Diagram

The phrase **body map** is useful, but it can also be misleading.

It makes me imagine a neat little human diagram somewhere inside the brain.

That is not really how this works.

The brain combines several kinds of information.

Where on the skin did something happen?

Where is that body part positioned?

How is the limb arranged?

Where is the body in external space?

Researchers studying spatial touch describe this as the integration of multiple location codes rather than one simple internal map.[2]

That becomes interesting very quickly.

Consider your right hand.

You know where it is even with your eyes closed.

Now cross your arms.

The hand has not changed anatomically.

But its position in external space has.

The nervous system has to reconcile those different kinds of information.

Our felt body is therefore already an active construction.

Most of the time this construction is so reliable that we never notice it happening.

Until we start experimenting with it.

## Move the Point

Let's make the first experiment very small.

Rest one hand comfortably.

Choose the center of the palm.

Place attention there.

Stay for a few seconds.

Now move toward the wrist.

Do it slowly enough that you can notice the route.

You might imagine a dot.

You might imagine a tiny pressure.

You might simply know:

**Here.**

Then:

**Here.**

Then:

**Here.**

Continue into the forearm.

Eventually reach the elbow.

Then reverse.

Do not rush.

Try to make the movement continuous.

If attention jumps directly from palm to elbow, slow it down and notice the places between.

This may feel almost trivial at first.

Then something peculiar can happen.

The location you attend to may become more noticeable than the surrounding areas.

Warmth.

A pulse.

Tingling.

Pressure.

A vague internal brightness that is not visual.

A fuzzy electrical feeling.

Or simply a clearer sense of location.

Maybe nothing changes.

That is useful too.

We are not trying to produce fireworks.

We are testing whether attention can acquire continuity as it moves through the body.

## You May Not Need Pictures

Mental imagery is often talked about as though it means seeing a movie behind your eyelids.

That is only one form of imagery.

Research on mental imagery includes visual, auditory, tactile, motor and other sensory forms.

And people differ enormously.

Aphantasia is the term now commonly used for markedly reduced or absent conscious visual imagery.

Recent research makes the picture more complicated than simply dividing humanity into visualizers and nonvisualizers.

Some people with visual aphantasia also report reduced imagery in touch, movement, sound, smell or other modalities.

Others appear to retain some forms of imagery while lacking others.

Researchers now describe aphantasia as heterogeneous rather than a single identical experience shared by everyone who has it.[3]

That matters for this book.

If I tell every reader:

**See a brilliant blue sphere in your palm,**

I may have accidentally turned an attention exercise into a test of visual imagery.

So we will use several possible routes.

You can:

**see it.**

Or:

**feel it.**

Or:

**imagine the movement.**

Or:

**know where it is.**

Or simply:

**decide where attention goes next.**

If one route does nothing for you, try another.

The experiment is attention.

The picture is optional.

## Imagining Touch

This becomes even more interesting when we stop treating tactile imagination as a weak substitute for visual imagination.

In a 2023 fMRI study, participants either experienced or imagined different vibrotactile sensations.

During imagined touch, researchers found activity in primary somatosensory cortex, including patterns that contained information about which type of tactile stimulus the participant was imagining.[4]

The imagined and actually perceived stimuli were not identical experiences.

But the study showed something important:

**Imagining touch can recruit sensory representations related to touch.**

That gives tactile imagination its own legitimacy.

You do not need to translate every exercise into pictures.

If imagining a brushing movement through your hand creates a clear tactile or spatial impression, that is already an imagery process.

And for what we are doing, it may be more useful than seeing a glowing ball.

## The Brush

Try this.

Choose one finger.

Imagine a soft brush moving from the base of the finger toward the fingertip.

Then back.

Again.

Slowly.

You do not need to see a brush.

You might feel an imaginary brushing motion.

You might trace the route mentally.

You might simply move attention in a straight line.

Base.

Tip.

Base.

Tip.

Continue for twenty or thirty seconds.

Then stop.

Compare that finger with the corresponding finger on the other hand.

Does one feel different?

More noticeable?

Warmer?

Larger?

Tingly?

Exactly the same?

Make the comparison before deciding what it means.

## Stir

Now take the center of your palm.

Instead of moving attention along a line, move it in a small circle.

Imagine that you are stirring the center of the hand.

Clockwise.

Then perhaps counterclockwise.

Again, the image itself is optional.

The important thing is that the location of attention moves around a small area.

You may discover that circles feel easier than straight lines.

Or harder.

Different shapes of attention may produce different subjective effects.

That is worth noticing.

## Sponge

The next exercise is stranger.

Instead of moving attention over the surface, imagine it moving through the whole volume of the hand.

From wrist toward fingertips.

Then back.

As though a soft sponge were passing through the hand from the inside.

This idea appears prominently in Robert Bruce's **New Energy Ways** system.

Bruce developed what he calls **tactile imaging** as an alternative to heavily visual energy-work instructions.

His exercises emphasize mobile body awareness and imagined tactile actions such as brushing, stirring, sponging and bouncing awareness through parts of the body.[5]

Bruce interprets these practices through an energy-body model.

That interpretation belongs to his system.

We do not need to accept or reject the model in order to borrow a very useful experimental idea:

**What happens when attention is given a tactile movement instead of a visual picture?**

So try the sponge.

Wrist to fingertips.

Fingertips to wrist.

Try to feel the entire hand being included rather than following one narrow line.

If the word **sponge** does nothing for you, replace it.

A wave.

A pressure front.

A scanner.

Warmth moving through tissue.

Or no metaphor at all.

Simply move broad attention through the hand.

## Point, Line, Volume

We have now done three different things.

A point.

A line.

A volume.

I like this progression because it gives attention geometry.

First:

**Here.**

Then:

**from here to there.**

Then:

**through this whole region.**

This will become important later when we begin experimenting with much larger movements.

Whole arms.

Whole legs.

The torso.

Perhaps the entire felt body.

For now, smaller regions are easier.

## Try the Feet

Hands are convenient because we use them constantly and can bring them into view.

Feet are different.

They spend much more of the day outside our visual attention.

That makes them interesting.

Without moving your feet, locate your right big toe.

Stay there.

Move attention slowly through the toe from base to tip.

Then another toe.

Then another.

Move across the sole.

Heel.

Arch.

Ball of the foot.

Top of the foot.

Ankle.

Try brushing.

Try stirring.

Try broad sponging.

Then compare the right foot with the left.

This is also a place where traditional energy-work systems often begin.

Bruce's system places substantial emphasis on stimulating the feet and legs before progressing into broader energy raising.[5]

His explanation is energetic.

Our experiment remains simpler:

Feet are distinct, richly innervated body regions that we can deliberately attend to.

Does sustained tactile attention change how clearly they are felt?

Try it.

## Does Sensation Follow Attention?

Here is the question I want you to keep returning to.

**Does sensation follow attention?**

Notice how carefully that is worded.

I am not asking:

**Can you move energy?**

That question already contains an explanation.

I want the earlier question first.

Suppose you brush attention repeatedly along your forearm.

After twenty seconds, the forearm tingles.

What happened?

Possibilities immediately appear.

Selective attention increased awareness of sensory activity already present.

Tactile imagination recruited sensory representations.

Small unnoticed muscle changes occurred.

Expectation influenced perception.

Circulation changed because of posture or tension.

A traditional energy practitioner might describe increased qi, prana, or subtle-energy movement.

There may be other possibilities.

A sensation alone cannot distinguish among them.

So record the observation first.

**Brushed attention from wrist to elbow for thirty seconds. Tingling became stronger near the wrist.**

That is useful data.

Then interpretation can remain provisional.

## Attention Without Effort

There is a trap here.

You may start concentrating so hard that your forehead tightens.

Your jaw clenches.

Your breath becomes shallow.

Your shoulders rise.

Then we have created the opposite of the state we want.

Attention does not need to mean strain.

See whether you can make it softer.

Instead of grabbing the palm with attention, rest attention there.

Instead of forcing a sensation to happen, become available to whatever sensation is already present.

This distinction will become increasingly important as we approach sleep.

The skills we want eventually have to survive relaxation.

## The Moving Geometry

Let's return to the visual.

Open your eyes.

Look again at the center of the geometric instrument.

The design is intentionally complex.

Rings within rings.

Radial divisions.

Repeated shapes.

Several structures moving on different slow cycles.

There is a lot available to look at.

But the exercise is not to inspect everything.

The complexity gives wandering attention somewhere to wander.

The center gives it somewhere to return.

Center.

Notice that you wandered.

Center.

Again.

Center.

This is very close to the basic logic of many focused-attention practices.

An object is chosen.

Attention moves away.

The movement is noticed.

Attention returns.

The return is not failure.

**The return is the practice.**

After a minute or so, close your eyes.

What happens?

Maybe the pattern remains briefly.

Maybe a complementary-color afterimage appears.

Maybe it breaks apart.

Maybe you see visual noise.

Maybe blackness arrives immediately.

Do not force a picture.

Just notice.

Then put the center in your palm.

That transition is the experiment I care about.

The object was outside you.

Now its function moves inside.

Not necessarily its appearance.

Its function.

**Center attention here.**

## If You See Nothing

This deserves its own section.

If you close your eyes and see blackness, you are still doing the experiment.

I find that important because so much occult, meditation and visualization literature assumes that phrases like:

**see the light**

or

**visualize your energy body**

describe something everyone can simply decide to do.

For some people they do.

For others, not really.

Research on aphantasia suggests that reduced imagery can extend across more than one sensory modality, while other people show more selective patterns.[3]

There is no reason to turn one person's imagery style into the definition of mental skill.

If you cannot see the geometric figure internally, try remembering its spatial organization.

You know there was a center.

You know rings surrounded it.

You know some parts rotated.

That knowledge exists even without a picture.

Now use the same relationship in the body.

Center of palm.

Surrounding hand.

Wrist beyond it.

Forearm beyond that.

You can work spatially.

Or tactilely.

Or conceptually.

The route matters more than the movie.

## Can Visualization Improve?

This question belongs to a later chapter in much more detail.

But I want to introduce it now because I have wondered about it myself.

If someone naturally experiences weak visual imagery, can practice make it stronger?

The answer is not yet as simple as I would like.

Imagery vividness varies tremendously among people, and aphantasia itself appears heterogeneous.[3]

Some visualization exercises may improve task performance, attention to visual detail, memory strategies, or the ability to manipulate spatial information without necessarily creating vivid picture-like experience.

So I do not want to promise:

**Practice this mandala and eventually you will see movies behind your eyelids.**

Maybe some readers will notice increased imagery.

Maybe others will become much better at spatial or tactile imagination while visual experience remains dark.

Both could represent useful learning.

Later we will explore visualization directly.

For now:

Do not use vividness as your score.

## Bounce

Once you can move attention slowly, try making the movement larger.

Right hand.

Left hand.

Back to right.

Back to left.

Not physically.

Attention only.

Can you alternate cleanly?

Now:

right foot.

Left foot.

Right foot.

Left foot.

Then:

both feet.

Both hands.

Feet.

Hands.

Bruce calls related practices **energy bouncing**, using awareness to move repeatedly through or between body regions.[5]

Again, we will keep his energetic interpretation separate from what we directly observe.

The exercise itself is fascinating.

It asks whether attention can become rhythmic and mobile while the body remains still.

That skill will matter later.

A lot.

## The Whole Arm

Now take what you learned with the hand and expand it.

Start at the fingertips.

Sponge attention through the hand.

Wrist.

Forearm.

Elbow.

Upper arm.

Shoulder.

Then reverse all the way back to fingertips.

Slowly.

Try the other side.

You may find one side much easier.

That is an observation.

You may find the hand vivid but the upper arm vague.

Observation.

You may feel a wave of tingling after several passes.

Observation.

You may lose the path entirely halfway through.

Also observation.

We are constructing an attentional route through the body.

## A Simple Circuit

Now combine several routes.

Right foot → right leg → hip.

Left foot → left leg → hip.

Right hand → arm → shoulder.

Left hand → arm → shoulder.

Then rest attention in the center of the torso for several breaths.

Do not worry about creating a perfect invisible circuit.

The practice is simply becoming able to place attention where you intend and move it deliberately.

That is already enough.

## Why This Might Matter Later

We are building these skills early because later practices become difficult to understand without them.

Eventually we will experiment with a deeply relaxed body while attention remains awake.

We will explore sensations of movement while the muscles stay still.

Rocking.

Floating.

Spinning.

Falling.

Rising.

Some people describe powerful vibrations.

Some describe changes in the felt boundary of the body.

Some interpret these experiences as the beginning of an out-of-body state.

Others explain them through sleep-transition physiology, body representation, vestibular processing or dream formation.

We are not there yet.

But this is preparation.

If you have never deliberately moved attention through your own body, instructions like:

**move out of your body**

are not especially useful.

So first:

Move attention through the body you can already feel.

## Keep the Dream Door Open

We are spending several chapters on body and energy work now.

That does not mean the dream practice has stopped.

You may not yet have had a lucid dream.

That is completely fine.

The earlier practices are still developing in the background.

Keep noticing dreams in the morning.

Keep noticing dream signs.

And occasionally, when something genuinely odd happens during the day, let the old question return:

**Am I dreaming?**

Not constantly.

Not mechanically.

Sincerely.

Tonight we will connect the two practices very lightly.

When you are ready for sleep, [**Relax the body**](#/feel-the-body#nighttime-body-release) using the Chapter 4 practice.

When the body has settled, move attention once from the center of one palm through the arm and back.

Then stop.

Ask:

**Am I dreaming?**

Once.

Let the question disappear as sleep comes.

In the morning, notice something else.

Did any unusual body sensation appear in a dream?

Floating?

Buzzing?

Heavy limbs?

Lightness?

Touch?

Movement?

Maybe not.

We are simply keeping both doors open.

## Do Not Chase Sensation

There is a temptation in energy work to turn dramatic sensation into a score.

More tingling means progress.

Vibration means success.

Nothing means failure.

I do not want to train that expectation.

If attention becomes clearer, that is progress.

If relaxation becomes easier, that is progress.

If you discover that tactile imagination works much better for you than visual imagery, that is useful.

If the entire exercise feels subtle and ordinary, you have still learned something.

Later, unusual sensations may become important.

For now, accuracy is more valuable than spectacle.

## Attention Is Becoming a Tool

Think about what we have done so far.

In Chapter 1, we turned attention backward toward dreams that were disappearing.

In Chapter 2, we turned attention toward unusual details.

In Chapter 3, we attached attention to recognition.

In Chapter 4, we turned attention inward toward the body.

Now we have made attention mobile.

Point.

Line.

Volume.

Hand.

Arm.

Foot.

Leg.

Across the body.

Without moving anything physical.

That does not sound like a superpower.

Yet.

But it is already a form of control we rarely practice deliberately.

And perhaps that is where a lot of supposedly extraordinary training begins.

Not with something supernatural.

With learning to do ordinary things on purpose.

---

### Summary

Attention can be directed toward particular locations on the body, and research shows that attended tactile locations receive preferential processing. Mental imagery also extends beyond visual pictures: imagining touch can recruit content-specific patterns in somatosensory cortex.

Traditional energy-work systems use this capacity deliberately through methods such as brushing, stirring, sponging and bouncing awareness. Those practices can be explored without assuming that the sensations they produce prove a particular energy model.

You do not need vivid visual imagery to practice. You can see the movement, feel it, imagine it, know where it is, or simply decide where attention goes next.

### Experiment

Begin with the PEx geometric attention object.

Rest your gaze gently near its fixed center for about a minute.

When attention wanders into the surrounding geometry, notice that and return to the center.

Then close your eyes.

Observe what remains.

An afterimage.

Color.

Shapes.

Visual noise.

Blackness.

Whatever is actually there.

Now transfer the function of that center into your right palm.

Hold attention there for several seconds.

Move it slowly:

**palm → wrist → forearm → elbow**

Then reverse:

**elbow → forearm → wrist → palm**

Try three forms of movement:

**Stir** — move attention in a small circle in the palm.

**Brush** — move a narrow line of attention along a finger or limb.

**Sponge** — move broad attention through the whole volume of the hand or forearm.

Compare the practiced side with the other side.

Notice sensation without deciding what caused it.

Later, try the same exercises with one foot.

At bedtime, [**Relax the body**](#/feel-the-body#nighttime-body-release).

When you are settled, move attention through one hand and arm once.

Then ask sincerely:

**Am I dreaming?**

Let the question go and let yourself sleep.

In the morning, notice whether unusual body sensations, movement, floating or buzzing appeared anywhere in your dreams.

### Intention

**I move my attention clearly through my body.**

---

## References

[1] Gomez-Ramirez, M., Hysaj, K., & Niebur, E. “Neural Mechanisms of Selective Attention in the Somatosensory System.” *Journal of Neurophysiology* 116, no. 3 (2016): 1218–1231. https://doi.org/10.1152/jn.00637.2015

[2] Badde, S., & Heed, T. “Towards Explaining Spatial Touch Perception: Weighted Integration of Multiple Location Codes.” *Cognitive Neuropsychology* 33, nos. 1–2 (2016): 26–47. https://doi.org/10.1080/02643294.2016.1168791

[3] Dawes, A. J., Keogh, R., & Pearson, J. “Multisensory Subtypes of Aphantasia: Mental Imagery as Supramodal Perception in Reverse.” *Neuroscience Research* 201 (2024): 50–59. https://doi.org/10.1016/j.neures.2023.11.009

[4] Nierhaus, T., Wesolek, S., Pach, D., et al. “Content Representation of Tactile Mental Imagery in Primary Somatosensory Cortex.” *eNeuro* 10, no. 6 (2023): ENEURO.0408-22.2023. https://doi.org/10.1523/ENEURO.0408-22.2023

[5] Bruce, Robert. *New Energy Ways, Version 2.* 1999. Sections on Mobile Body Awareness, Tactile Imaging, Energy Body Stimulation, Feet and Leg Development, Hand and Arm Development, and Energy Bounce Techniques.
`,_e="Move Your Attention.",jn="/move-your-attention",yt=`#${jn}`,_o="PEX-IMPLEMENTATION-PLACEHOLDER";let ln=null;function ke(){const n=$t.trim();return!n||n.includes(_o)?!1:n.startsWith(`# ${_e}`)}function qo(){if(!ke())throw new Error("Chapter 5 manuscript has not been supplied by PEX_PRIMARY");return ln||(ln=ye($t)),ln}const jo=`# Build the Current.

In the last chapter, we moved attention.

A point in the palm.

A line through the arm.

A broad sensation through the whole hand.

Now I want to connect those movements.

Instead of asking:

**Can attention move?**

we are going to ask:

**Can it keep moving?**

Put your attention in your right foot.

Find it.

Now move slowly upward.

Ankle.

Calf.

Knee.

Thigh.

Hip.

Into the lower torso.

Continue upward.

Chest.

Right shoulder.

Down the upper arm.

Elbow.

Forearm.

Hand.

Fingertips.

Pause.

Now reverse the entire route.

Fingertips.

Hand.

Forearm.

Elbow.

Upper arm.

Shoulder.

Chest.

Torso.

Hip.

Thigh.

Knee.

Calf.

Ankle.

Foot.

You have just made a circuit.

Nothing had to glow.

Nothing had to leave your body.

You did not need to believe in meridians, chakras, qi, prana, subtle bodies, nerve currents, or invisible electricity.

You simply gave attention a path.

Now something interesting becomes possible.

You can repeat it.

## From Movement to Current

A single pass is an event.

Repeated passes can begin to feel like something else.

A route.

A rhythm.

Perhaps eventually a current.

That word is useful because it does not tell us what is moving.

It could mean attention.

It could mean changing sensation.

It could describe expectation becoming more stable.

It could be a traditional practitioner's description of qi or prana.

It could refer to several things happening together.

For now, **current** means only this:

**a repeated, continuous movement of attention through the felt body.**

That is enough to work with.

## Different Maps

Humans have been drawing invisible maps of the body for a very long time.

Chinese traditions describe qi and channels or meridians.

Indian yogic traditions describe prana, nadis, chakras, and other structures.

Robert Bruce describes an energy body with pathways, exchange ports, and storage centers.

Modern neuroscience describes somatosensory maps, interoception, proprioception, autonomic regulation, and multiple interacting representations of the body.

These are not four different names for one proven anatomical system.

That would be too convenient.

They come from different histories.

They make different assumptions.

They were built for different purposes.

And they do not line up perfectly.

Good.

That means we have something to investigate.

Instead of asking:

**Which invisible diagram is the correct one?**

try a different question:

**What happens when I practice the movement that this map suggests?**

That turns a belief into an experiment.

## Qigong

Qigong gives us one of the clearest examples of coordinated attention, breath, posture, and movement.

The National Center for Complementary and Integrative Health describes qigong as a family of practices involving regulation of the mind, breath, and body posture or movement.[1]

Some forms are active.

Others are meditative and involve little physical movement.

Within traditional Chinese medicine, these practices are understood partly in terms of cultivating and regulating **qi**.

That is the traditional model.

We can respect that model without pretending that modern science has identified a substance called qi moving through anatomically verified meridians.

For us, qigong raises a useful practical question:

**What changes when attention, breath, and body awareness are deliberately coordinated?**

## The Breath Joins In

Try the circuit again.

Right foot.

Leg.

Pelvis.

Torso.

Shoulder.

Arm.

Hand.

This time, let the breath participate.

As you inhale comfortably, let attention travel upward through the body.

As you exhale, let it travel downward.

Do not take enormous breaths.

Do not hold your breath.

Do not try to inhale for a heroic number of seconds.

The breath should remain comfortable.

If the movement of attention takes longer than one breath, use several.

The route matters more than the count.

Slow voluntary breathing has measurable physiological effects of its own.

A systematic review and meta-analysis found that slow breathing changes heart-rate-variability measures associated with cardiac parasympathetic regulation, both during practice and under some conditions afterward.[2]

That is useful evidence.

But notice what it does **not** establish.

It does not show that breathing pumps qi through a meridian.

It tells us that deliberately changing breathing can influence measurable aspects of autonomic physiology.

That is already interesting enough.

## Do Not Translate Too Quickly

This is another rule I want to keep throughout Psychical Excursion.

When two systems describe experiences that sound similar, resist the urge to immediately declare them identical.

A qigong practitioner may describe qi settling into the lower dantian.

A yoga practitioner may describe prana.

A meditator may describe warmth, expansion, pressure, stillness, or internal movement.

A neuroscientist may discuss interoceptive attention and autonomic regulation.

Those descriptions may overlap in interesting ways.

But similarity is not identity.

Saying:

**These traditions may be attending to some of the same human experiences**

is much safer than saying:

**Qi is the vagus nerve.**

Or:

**Prana is electricity.**

Or:

**The lower dantian is this exact organ.**

Our job is to compare maps without flattening them.

## Two Rivers

Now try the body symmetrically.

Put attention in both feet.

If that is easy, let both sides rise together.

Feet.

Ankles.

Calves.

Knees.

Thighs.

Pelvis.

Torso.

Shoulders.

Arms.

Hands.

If attending to both sides simultaneously is confusing, do not force it.

Use:

right foot → right leg.

left foot → left leg.

torso.

right arm.

left arm.

The final route is similar.

The attentional method is different.

One person may experience bilateral attention naturally.

Another may need to alternate.

There is no reason to make divided attention into an entrance exam.

The experiment is whether the whole route becomes clearer with practice.

## Hands and Feet

Why do so many systems begin with hands and feet?

Traditional systems have their own answers.

Bruce, for example, emphasizes the hands and feet heavily in his **New Energy Ways** practice before larger whole-body work.[3]

There is also an ordinary practical reason.

Hands and feet are easy to distinguish from neighboring body regions.

We use them constantly.

They contain dense sensory information.

They are useful endpoints.

So let's use them.

Put attention in both feet.

Then move it upward through the legs.

Continue through the torso.

Send it outward through both shoulders.

Down the arms.

Into both hands.

Pause.

Now reverse:

hands.

Arms.

Shoulders.

Torso.

Pelvis.

Legs.

Feet.

That is one complete pass.

## Build the Route

Repeat it.

Slowly.

Again.

And again.

Do not increase speed yet.

Instead, notice whether the route becomes easier to follow.

On the first pass you may need to think:

**Where is my knee?**

By the fourth pass, perhaps attention moves through that region without much thought.

That difference matters.

We are training continuity.

At first, attention may feel like a flashlight jumping between isolated places.

Foot.

Knee.

Hip.

Hand.

With repetition, the gaps can become more interesting than the destinations.

Can you feel the path **between** ankle and knee?

Between shoulder and elbow?

Between pelvis and chest?

The current becomes continuous when the spaces between landmarks stop disappearing.

## What Is Interoception?

This is a good place for a scientific word.

**Interoception** broadly refers to the nervous system's processing of signals coming from inside the body.

Heartbeat.

Breathing.

Gut sensations.

Temperature.

Muscle and visceral states.

Signals related to arousal and internal regulation.

It is not identical to the tactile body-awareness practices we are doing, because our exercises also involve touch, proprioception, spatial attention, and imagined movement.

But the fields overlap.

And research suggests that body-focused contemplative training can change how people report their internal bodily awareness.

A 2025 meta-analysis of twenty-nine randomized controlled trials found a small-to-medium improvement in self-reported interoception following mindfulness and related interventions.[4]

That is worth taking seriously.

It means repeated attention to internal experience can change people's subjective relationship with bodily sensation.

But again, there is an important boundary.

Feeling more connected to bodily signals is not the same as proving that every bodily interpretation becomes objectively more accurate.

So:

**increased awareness is interesting.**

**Infallible body intuition is not established.**

## A Map Can Become Familiar

Imagine driving through an unfamiliar neighborhood.

At first every turn requires attention.

Left at the store.

Right at the light.

Second street.

Eventually, after enough repetition, the route becomes familiar.

Something similar may happen with body attention.

At first:

foot.

Calf.

Knee.

Thigh.

Eventually you may be able to sweep smoothly through the entire leg.

That does not mean a new physical channel has appeared.

It may mean you have developed a better attentional route.

But once the route becomes familiar, the subjective experience may feel increasingly flow-like.

And that is exactly where language gets dangerous.

Because a strong subjective sense of flow can make an explanation feel obvious.

**Something is definitely moving through me.**

Maybe.

But first record the simpler fact.

**Repeated attention through the same route became easier and produced a continuous sensation.**

That statement gives us much more room to think.

## The Lower Center

Many traditional systems place unusual importance on the lower abdomen.

In qigong traditions, the lower **dantian** is often treated as a central area of cultivation and storage.

Bruce's system also describes a major energy-storage area below the navel.[3]

Those systems developed separately enough that the resemblance is interesting.

But resemblance does not establish that they independently discovered a hidden anatomical organ.

So let's approach the area experimentally.

After moving attention up through both legs, stop around the lower abdomen.

Do not search for a tiny point.

Let attention become broad.

A region rather than a dot.

Notice breathing.

Movement.

Pressure.

Warmth.

Pulse.

Muscular tension.

Nothing special.

Stay there for a few breaths.

Then continue upward.

That is all.

We are learning what the region feels like before inheriting anyone else's explanation of it.

## Store Nothing

This is where I am going to depart slightly from some traditional language.

I do not want you to worry about whether you are correctly **storing energy**.

That immediately creates a success condition we cannot verify.

Instead:

At the end of a circuit, rest broad attention in the lower torso.

Feel.

Then stop trying.

If you experience warmth or density there, notice it.

If you do not, notice that.

The exercise still happened.

## Up and Down

Let's simplify the whole practice.

Feet.

Up through the legs.

Pelvis.

Torso.

Shoulders.

Arms.

Hands.

Then:

hands.

Arms.

Shoulders.

Torso.

Pelvis.

Legs.

Feet.

Up.

Down.

Up.

Down.

If breathing comfortably with the rhythm feels natural:

inhale upward.

Exhale downward.

If the opposite direction feels more natural:

use the opposite direction.

The body's comfort outranks the diagram.

No breath holding.

No dizziness.

No contest.

## Does Repetition Change the Sensation?

After several circuits, stop.

Do nothing.

This matters.

Do not immediately begin analyzing.

Let the body sit there.

How does it feel?

More vivid?

Warm?

Heavy?

Light?

Buzzing?

Expanded?

Quiet?

Do the hands feel larger?

Do the feet feel farther away?

Does the whole body feel unified?

Does nothing seem different?

All of these are possible observations.

The exercise is not successful because something dramatic happens.

The experiment is successful because you made a repeatable intervention and then observed the result.

## The Whole Body at Once

Now try something different.

Instead of moving attention, stop it.

Feel both hands.

Both feet.

Torso.

Head.

Everything you can include.

Do not scan.

Hold the whole body as one field of attention.

This may only work for a second.

Then one region dominates.

Or thought interrupts.

Or you lose the feet.

Fine.

Bring the whole body back.

Hands.

Feet.

Torso.

Head.

One field.

You may discover that moving attention is easier than holding broad attention.

That will become important in the next chapter.

## What Is the Current?

After practicing for several days, you might begin describing what you feel as a current.

I understand why.

Sometimes repeated body attention produces sensations that seem directional.

A wave.

A pulse.

A stream.

A spreading warmth.

A creeping or electrical feeling.

A pressure that seems to travel.

Traditional energy work gives these experiences names.

Modern physiology gives us possible contributing mechanisms.

Attention.

Sensory amplification.

Autonomic change.

Expectation.

Breathing effects.

Muscle relaxation.

Circulation.

Body-schema processes.

Imagined touch.

Maybe other things.

It would be easy to pick whichever explanation matches our preferences.

I would rather preserve the mystery a little longer.

So when I say:

**Build the current,**

I mean:

Make the pathway stable enough that something repeatable happens.

Then study what that something is.

## A Current Is Not a Tube

Suppose you perform the same circuit for a week.

Every night you reliably feel warmth move from your feet toward your torso.

That would be interesting.

It would tell us you can produce a repeatable experience using a specific attentional practice.

It would not automatically demonstrate a literal hidden tube connecting your feet to your abdomen.

This distinction matters because useful practices can survive uncertainty about their explanation.

The exercise does not become worthless just because we refuse to pretend we know exactly why it works.

In fact, I think it becomes more interesting.

## Breath, Attention, and State

Try comparing two versions of the same exercise.

During the day, perform three body circuits while breathing normally.

Later, when calm, perform three while breathing more slowly and comfortably.

Do they feel different?

Does slower breathing make attention easier to sustain?

Does it make sensation more obvious?

Does it make you sleepy?

More alert?

Nothing noticeable?

This gives us a way to separate parts of the practice.

Attention can be manipulated.

Breathing can be manipulated.

Posture can be manipulated.

Then we can ask which ingredients matter.

That is much more useful than treating a traditional package as one indivisible mystery.

## Keep the Dream Door Open

Our dream practice is still running quietly beside all of this.

Tonight, when you are ready for sleep, [**Relax the body**](#/feel-the-body#nighttime-body-release).

Then perform one gentle circuit.

Feet.

Legs.

Torso.

Arms.

Hands.

Back down.

Do not turn bedtime into an hour-long training session.

One circuit is enough.

Then stop.

Ask yourself:

**Where is my body when I am dreaming?**

Do not try to answer intellectually.

Let the question sit there.

Then sleep.

In the morning, when you remember a dream, notice the body.

Did you have hands?

Feet?

Weight?

Did you feel the ground?

Could you touch objects?

Were you floating?

Running?

Moving without effort?

Was there even a body at all?

Most of the time we remember what happened in a dream.

This time, also remember **what you were happening in.**

That may become useful later.

## Dream Bodies Are Strange

Think about a dream in which you ran.

You probably did not consciously construct every footstep.

Your dream body simply ran.

Maybe it climbed.

Flew.

Swam.

Fell.

Touched something.

Felt pain.

Moved through a room.

Yet your sleeping physical body remained somewhere else.

I am not making a metaphysical claim with that observation.

Dreaming already gives us an ordinary example of experiencing a body representation that does not map straightforwardly onto current physical movement.

That fact alone makes dream bodies worth studying.

Later, when we examine lucid dreams, false awakenings, sleep paralysis, vestibular sensations, and out-of-body experiences, this distinction will matter a great deal.

For now:

notice the dream body when you remember it.

## What If the Current Becomes Strong?

If body sensations become unusually intense, simplify.

You do not need to push through strong discomfort.

Return to ordinary breathing.

Open your eyes.

Move physically.

Stop the exercise.

We are training attention, not endurance.

Strong tingling or vibration is not automatically a higher level.

Quiet control is more useful than spectacle.

The body does not owe us fireworks.

## The Current Can Be Subtle

I want to emphasize this because repeated energy practices can create expectations.

You may imagine that one day the current will suddenly switch on like a power cable.

Maybe you will have a dramatic experience.

Maybe not.

A more subtle change may actually be more important.

You put attention in your foot and find it immediately.

You sweep through your leg smoothly.

You relax your shoulders without thinking about it.

You notice breathing becoming shallow before it becomes uncomfortable.

You detect tension earlier.

You can hold attention in the whole body for several seconds.

Those are real changes in skill.

They are less cinematic.

But if our larger goal is to maximize human potential, better control of attention and body awareness is already part of that project.

## From Motion to Stillness

We began Chapter 4 by feeling the body.

Then we learned to release it.

In Chapter 5 we made attention mobile.

Now we have connected those movements into larger circuits.

The next question is almost the opposite.

What happens when attention stops moving?

Can we place it somewhere and leave it there?

Can we stay with one sensation?

One point?

One breath?

One sound?

Can the body become quiet without the mind immediately filling the space?

That is where we are going next.

But first, build the route.

Let it become familiar.

Then stop.

Feel what remains.

---

### Summary

Repeated attention can turn isolated body sensations into stable routes.

Traditional systems describe those routes using models such as qi and meridians, prana and nadis, or subtle-energy pathways. Modern research instead examines processes including somatosensory attention, interoception, breathing, autonomic regulation, and body representation.

These maps should not be treated as interchangeable anatomy.

For our experiment, a **current** means a repeated and increasingly continuous pathway of attention through the felt body.

Slow breathing can alter measurable autonomic activity, and contemplative/body-focused training can improve people's reported awareness of internal bodily experience. Neither finding by itself proves a subtle-energy model.

### Experiment

Sit or lie comfortably.

Begin with the right side:

**right foot → leg → pelvis → torso → shoulder → arm → hand**

Then reverse.

Repeat on the left side.

Next try a bilateral route:

**both feet → legs → pelvis → torso → shoulders → arms → hands**

Then reverse:

**hands → arms → shoulders → torso → pelvis → legs → feet**

Repeat the full circuit five times.

Move slowly enough to feel the spaces between the landmarks.

If it feels comfortable, let the breath accompany the movement:

**inhale upward**

**exhale downward**

Use ordinary comfortable breaths.

Do not hold the breath or force depth.

After five circuits, stop completely.

For thirty seconds, simply feel the whole body.

Notice whether anything changed.

Warmth.

Tingling.

Pressure.

Heaviness.

Lightness.

Vibration.

A sense of continuity.

Nothing unusual.

Record the observation before deciding what caused it.

At bedtime, [**Relax the body**](#/feel-the-body#nighttime-body-release), perform one gentle circuit, and then ask:

**Where is my body when I am dreaming?**

Let the question go.

In the morning, if you remember a dream, notice whether you experienced hands, feet, weight, touch, floating, movement, or another kind of dream body.

### Intention

**I feel the whole body as one connected field of attention.**

---

## References

[1] National Center for Complementary and Integrative Health. “Qigong: What You Need To Know.” National Institutes of Health. Qigong is described as involving regulation of mind, breath, and body movement or posture, with both active and meditative forms. https://www.nccih.nih.gov/health/qigong-what-you-need-to-know

[2] Laborde, S., Allen, M. S., Borges, U., et al. “Effects of Voluntary Slow Breathing on Heart Rate and Heart Rate Variability: A Systematic Review and a Meta-analysis.” *Neuroscience & Biobehavioral Reviews* 138 (2022): 104711. https://doi.org/10.1016/j.neubiorev.2022.104711

[3] Bruce, Robert. *New Energy Ways, Version 2.* 1999. Sections on Mobile Body Awareness, Energy Raising, Full-Body Circuits, Energy Storage, and Energy Bounce Techniques.

[4] Treves, I. N., Chen, Y.-Y., Wilson, C. L., et al. “A Meta-analysis of the Effects of Mindfulness Meditation Training on Self-reported Interoception.” *Scientific Reports* 15 (2025): 38889. Twenty-nine randomized controlled trials, 2,191 participants; pooled improvement in self-reported interoception, Hedges' g = 0.31. https://doi.org/10.1038/s41598-025-22661-4
`,Vt="Build the Current.",Gn="/build-the-current",Go=`#${Gn}`;let hn=null;function Uo(){return hn||(hn=ye(jo)),hn}function k(n,e){const t=document.createElementNS("http://www.w3.org/2000/svg",n);for(const[a,o]of Object.entries(e))t.setAttribute(a,o);return t}function $o(n){const e=m("div",{class:`pex-ambient pex-ambient-${n}`,"aria-hidden":"true"}),t=k("svg",{viewBox:"0 0 1200 900",focusable:"false"}),a=k("g",{class:"pex-ambient-spin pex-ambient-spin-slow"});a.append(k("circle",{class:"pex-ambient-arc",cx:"620",cy:"430",r:"318"}),k("circle",{class:"pex-ambient-arc pex-ambient-arc-faint",cx:"620",cy:"430",r:"214"}),k("circle",{class:"pex-ambient-point",cx:"938",cy:"430",r:"2.2"}),k("circle",{class:"pex-ambient-point",cx:"406",cy:"238",r:"1.6"}));const o=k("g",{class:"pex-ambient-spin pex-ambient-spin-mid"});o.append(k("ellipse",{class:"pex-ambient-arc",cx:"580",cy:"400",rx:"430",ry:"168"}),k("path",{class:"pex-ambient-arc pex-ambient-arc-partial",d:"M220 520 C 380 220, 820 180, 1040 470"}),k("circle",{class:"pex-ambient-point",cx:"1010",cy:"400",r:"1.8"}));const i=k("g",{class:"pex-ambient-axis"});if(i.append(k("line",{class:"pex-ambient-line",x1:"600",y1:"40",x2:"600",y2:"860"}),k("line",{class:"pex-ambient-line pex-ambient-line-soft",x1:"80",y1:"390",x2:"1120",y2:"510"})),t.append(i,a,o),n==="memory"){const r=k("g",{class:"pex-ambient-memory-forms"});r.append(k("ellipse",{class:"pex-ambient-form pex-ambient-form-a",cx:"430",cy:"360",rx:"92",ry:"48"}),k("ellipse",{class:"pex-ambient-form pex-ambient-form-b",cx:"760",cy:"500",rx:"70",ry:"110"}),k("circle",{class:"pex-ambient-form pex-ambient-form-c",cx:"620",cy:"280",r:"36"})),t.append(r)}if(n==="notice"||n==="recognize"){const r=k("g",{class:"pex-ambient-notice-align"});r.append(k("path",{class:"pex-ambient-arc pex-ambient-align-a",d:"M260 300 C 480 220, 700 240, 940 360"}),k("path",{class:"pex-ambient-arc pex-ambient-align-b",d:"M300 620 C 520 420, 760 380, 980 520"}),k("circle",{class:"pex-ambient-point pex-ambient-align-point",cx:"640",cy:"390",r:"2.4"})),n==="recognize"&&r.append(k("circle",{class:"pex-ambient-form pex-ambient-recognize-ring",cx:"640",cy:"390",r:"5.5"})),t.append(r)}if(n==="body"){const r=k("g",{class:"pex-ambient-body-forms"});r.append(k("ellipse",{class:"pex-ambient-form pex-ambient-form-a",cx:"620",cy:"318",rx:"36",ry:"48"}),k("ellipse",{class:"pex-ambient-form pex-ambient-form-b",cx:"620",cy:"468",rx:"58",ry:"92"}),k("circle",{class:"pex-ambient-point",cx:"620",cy:"390",r:"1.8"})),t.append(r)}return e.append(t),e}const Vo=[{name:"Aries",glyph:"♈︎"},{name:"Taurus",glyph:"♉︎"},{name:"Gemini",glyph:"♊︎"},{name:"Cancer",glyph:"♋︎"},{name:"Leo",glyph:"♌︎"},{name:"Virgo",glyph:"♍︎"},{name:"Libra",glyph:"♎︎"},{name:"Scorpio",glyph:"♏︎"},{name:"Sagittarius",glyph:"♐︎"},{name:"Capricorn",glyph:"♑︎"},{name:"Aquarius",glyph:"♒︎"},{name:"Pisces",glyph:"♓︎"}];function ft(n){const e=(n%360+360)%360;return Vo[Math.floor(e/30)%12]}function Ko(n){const e=new Intl.DateTimeFormat(void 0,{month:"short",day:"numeric"}).format(n),t=new Intl.DateTimeFormat(void 0,{hour:"numeric",minute:"2-digit"}).format(n),a=new Intl.DateTimeFormat(void 0,{month:"long",day:"numeric",hour:"numeric",minute:"2-digit"}).format(n);return{date:e,time:t,spoken:a}}function bt(n,e,t,a){const o=n==="sun"?`Sun in ${t}`:`Moon in ${t}`;return m("span",{class:"sky-widget-pair",tabindex:"0",role:"img","aria-label":o,"data-sky-body":n},[m("span",{class:"sky-widget-body","aria-hidden":"true"},[e]),m("span",{class:"sky-widget-sign","aria-hidden":"true"},[a]),m("span",{class:"sky-widget-tip","aria-hidden":"true"},[o])])}function Jo(){const n=new Date,e=ho(n),t=ft(e.sun.eclipticLongitudeDeg),a=ft(e.moon.eclipticLongitudeDeg),o=ro(n),i=o?Ko(o):null,r=i?`Sun in ${t.name}. Moon in ${a.name}. Next full moon ${i.spoken}.`:`Sun in ${t.name}. Moon in ${a.name}.`,s=i?m("span",{class:"sky-widget-full"},[m("span",{class:"sky-widget-full-label"},["Full Moon · "]),m("span",{class:"sky-widget-full-when"},[`${i.date} · ${i.time}`])]):m("span",{class:"sky-widget-full"},["Full Moon"]);return m("div",{class:"sky-widget-compact",role:"group","aria-label":r},[bt("sun",`${Wt}${ht}`,t.name,t.glyph),bt("moon",`${Yt}${ht}`,a.name,a.glyph),s])}function Qo(n){return n==="chapter01"?"memory":n==="chapter02"?"notice":n==="chapter03"?"recognize":n==="chapter04"?"body":"orbit"}function Xo(n){return n==="chapter01"?`${Yn} · Psychical Excursion`:n==="chapter02"?`${Mn} · Psychical Excursion`:n==="chapter03"?`${Be} · Psychical Excursion`:n==="chapter04"?`${Nn} · Psychical Excursion`:n==="chapter05"?`${_e} · Psychical Excursion`:n==="chapter06"?`${Vt} · Psychical Excursion`:"Psychical Excursion"}function Zo(n,e){On(),document.title=Xo(e),n.replaceChildren();const t=m("a",{class:"skip-link",href:"#main"},["Skip to content"]),a=Qo(e),o=$o(a),i=ni(),r=m("header",{class:"app-header guidebook-header"},[m("a",{href:"#/",class:"brand-link","aria-label":"Psychical Excursion home"},[m("img",{class:"brand-logo brand-logo-light",src:"/brand/pex-logo-primary.svg",alt:"",width:"220",height:"52",decoding:"async"}),m("img",{class:"brand-logo brand-logo-reverse",src:"/brand/pex-logo-primary-reverse.svg",alt:"",width:"220",height:"52",decoding:"async"})]),m("div",{class:"header-tools guidebook-tools"},[Jo(),m("span",{class:"guidebook-tools-rule","aria-hidden":"true"}),i])]),s=m("div",{id:"live-status",class:"visually-hidden","aria-live":"polite"}),l=m("main",{id:"main",class:"main-stage guidebook-main",tabindex:"-1","data-guidebook-page":e}),h=m("footer",{class:"site-footer guidebook-footer"},[m("p",{class:"attribution"},[ra("Website by "),m("a",{href:"https://hoopsnakedesigns.com/",rel:"noreferrer"},["Hoopsnake Designs"])])]),d=m("div",{class:"app-frame guidebook-frame","data-ambient":a},[r,s,l,h]);return n.append(t,o,d),{main:l}}function ei(n){Eo(n)}function ni(){const n=Dn()==="bedtime",e=m("button",{type:"button",id:"theme-light-dark",class:"theme-switch",role:"switch",dir:"ltr","aria-checked":n?"true":"false","aria-label":"Dark appearance"},[m("span",{class:"theme-switch-track","aria-hidden":"true",dir:"ltr"},[m("span",{class:"theme-switch-thumb"})])]);return e.addEventListener("click",()=>{const a=aa()==="bedtime";e.setAttribute("aria-checked",a?"true":"false")}),e}function ti(n=window.location.hash){return Wn(n).path}function ai(n=window.location.hash){const e=ti(n);return e===zn?"chapter01":e===Bn?"chapter02":e===_n?"chapter03":e===qn?"chapter04":e===jn&&ke()?"chapter05":e===Gn?"chapter06":"home"}function oi(){const{path:n}=Wn();n==="/"||n===zn||n===Bn||n===_n||n===qn||n===jn&&ke()||n!==Gn&&window.history.replaceState(null,"",`${window.location.pathname}${window.location.search}#/`)}let Kt=null;function ii(n){return Kt!==n}function ri(n){Kt=n}function cn(){typeof history<"u"&&"scrollRestoration"in history&&(history.scrollRestoration="manual"),document.documentElement.scrollTop=0,document.body.scrollTop=0;const n=navigator.userAgent??"";typeof window.scrollTo=="function"&&n.length>0&&!n.includes("jsdom")&&window.scrollTo(0,0)}function si(n,e){if(!e)return;const t=n.querySelector(`[id="${e}"]`);if(!t)return;t.closest(".guidebook-section")?.classList.add("is-visible");const a=navigator.userAgent??"";if(typeof t.scrollIntoView=="function"&&a.length>0&&!a.includes("jsdom")){const o=typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;t.scrollIntoView({behavior:o?"auto":"smooth",block:"start"})}t.focus({preventScroll:!0})}const Cn=[];function Jt(){for(;Cn.length;)Cn.pop()?.()}function li(){return typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}function hi(n){Jt();const e=[...n.querySelectorAll(".pex-reveal")];if(e.length===0)return;if(li()||typeof IntersectionObserver!="function"){for(const a of e)a.classList.add("is-visible");return}e[0]?.classList.add("is-visible");const t=new IntersectionObserver(a=>{for(const o of a)o.isIntersecting&&(o.target.classList.add("is-visible"),t.unobserve(o.target))},{threshold:.08,rootMargin:"0px 0px -10% 0px"});for(const a of e)t.observe(a);Cn.push(()=>t.disconnect())}const wt=[];function ci(){for(;wt.length;)wt.pop()?.()}async function di(n){{oi(),sa(),co(),ci(),Jt();const e=ai(),t=Wn().fragment,a=ii(e);a&&!t&&cn(),ri(e);const{main:o}=Zo(n,e),i={href:"#/",title:"Introduction",id:"guidebook-prev-home"};if(e==="chapter01"?ce(o,To(),{previous:i,next:{href:mt,title:Mn,id:"guidebook-next-chapter-2"}}):e==="chapter02"?ce(o,Lo(),{previous:{href:Bt,title:Yn,id:"guidebook-prev-chapter-1"},next:{href:pt,title:Be,id:"guidebook-next-chapter-3"}}):e==="chapter03"?ce(o,Yo(),{previous:{href:mt,title:Mn,id:"guidebook-prev-chapter-2"},next:{href:gt,title:Nn,id:"guidebook-next-chapter-4"}}):e==="chapter04"?ce(o,Bo(),{previous:{href:pt,title:Be,id:"guidebook-prev-chapter-3"},next:ke()?{href:yt,title:_e,id:"guidebook-next-chapter-5"}:void 0}):e==="chapter05"&&ke()?ce(o,qo(),{previous:{href:gt,title:Nn,id:"guidebook-prev-chapter-4"},next:{href:Go,title:Vt,id:"guidebook-next-chapter-6"}}):e==="chapter06"?ce(o,Uo(),{previous:{href:yt,title:_e,id:"guidebook-prev-chapter-5"}}):Ro(o),hi(o),ei(n),t)si(n,t);else if(a){cn();const r=navigator.userAgent??"";typeof requestAnimationFrame=="function"&&r.length>0&&!r.includes("jsdom")&&requestAnimationFrame(()=>cn())}return}}function ui(){const n=document.getElementById("app");if(!n)throw new Error("Missing #app");return n}async function mi(){On(),na();const n=ui(),e=()=>{di(n)};window.addEventListener("hashchange",e),e();try{await vt.open(),await ta()}catch{}}mi();
