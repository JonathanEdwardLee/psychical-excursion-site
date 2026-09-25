const gt="0.6.0";const ri="pex-local";const y={entries:"entries",media:"media",progress:"progress",settings:"settings"};function ie(n){const e=typeof n.updatedAt=="number"?n.updatedAt:n.createdAt;return{id:n.id,type:n.type,createdAt:n.createdAt,updatedAt:e,note:typeof n.note=="string"?n.note:"",audioId:n.audioId??null,audioMimeType:n.audioMimeType??null,audioByteLength:n.audioByteLength??null,syncState:n.syncState??"LOCAL",localSafeAt:n.localSafeAt??e,syncVersion:typeof n.syncVersion=="number"?n.syncVersion:1,remoteVersion:n.remoteVersion??null,remoteFileId:n.remoteFileId??null,remoteMediaFileId:n.remoteMediaFileId??null,syncErrorCode:n.syncErrorCode??null,pexDay:n.pexDay??null,phaseId:n.phaseId??null}}class U extends Error{code;recoverable;constructor(e,t,a=!0){super(t),this.name="AppError",this.code=e,this.recoverable=a}}function tn(n){return{day:n,unlocked:!0,visitedAt:null,completedAt:null}}function Me(n){return{day:n.day,unlocked:!0,visitedAt:typeof n.visitedAt=="number"?n.visitedAt:null,completedAt:typeof n.completedAt=="number"?n.completedAt:null}}function O(n){return new Promise((e,t)=>{n.onsuccess=()=>e(n.result),n.onerror=()=>t(n.error??new Error("indexeddb-request-failed"))})}function L(n){return new Promise((e,t)=>{n.oncomplete=()=>e(),n.onerror=()=>t(n.error??new Error("indexeddb-transaction-failed")),n.onabort=()=>t(n.error??new Error("indexeddb-transaction-aborted"))})}function be(n){const e=n instanceof DOMException?n.name:"",t=n instanceof Error?n.message:String(n);return e==="QuotaExceededError"||/quota/i.test(t)?new U("quota-exceeded","This browser does not have enough space to save. Export existing entries if you can, then free space and retry."):new U("save-failed","The local save did not complete. Your entry was not discarded silently; retry the save.")}class si{constructor(e=globalThis.indexedDB??null){this.factory=e}factory;assertAvailable(){if(!this.factory)throw new U("indexeddb-unavailable","IndexedDB is not available in this browser, so journal entries cannot be stored locally.",!1)}async open(){this.assertAvailable();try{const e=this.factory.open(ri,3);e.onupgradeneeded=i=>{const o=e.result,r=e.transaction;if(o.objectStoreNames.contains(y.entries)){if(i.oldVersion<2){const s=r.objectStore(y.entries);s.indexNames.contains("syncState")||s.createIndex("syncState","syncState")}}else{const s=o.createObjectStore(y.entries,{keyPath:"id"});s.createIndex("createdAt","createdAt"),s.createIndex("type","type"),s.createIndex("syncState","syncState")}o.objectStoreNames.contains(y.media)||o.createObjectStore(y.media,{keyPath:"id"}).createIndex("entryId","entryId",{unique:!0}),o.objectStoreNames.contains(y.progress)||o.createObjectStore(y.progress,{keyPath:"day"}),o.objectStoreNames.contains(y.settings)||o.createObjectStore(y.settings,{keyPath:"key"})};const t=await O(e);return await this.ensureSeed(t)&&(await this.migrateLegacyEntries(t),await this.bumpSchemaRecord(t)),t}catch(e){throw e instanceof U?e:new U("indexeddb-open-failed","The local database could not be opened.",!1)}}async ensureSeed(e){const t=e.transaction([y.progress,y.settings],"readwrite"),a=t.objectStore(y.progress),i=t.objectStore(y.settings);for(let s=1;s<=60;s+=1){const l=await O(a.get(s));l?a.put(Me(l)):a.put(tn(s))}const o=await O(i.get("schema"));let r=!1;return o?o.schemaVersion<3&&(r=!0):i.put({key:"schema",schemaVersion:3,appVersion:gt,createdAt:Date.now()}),await L(t),r}async bumpSchemaRecord(e){const t=e.transaction(y.settings,"readwrite"),a=t.objectStore(y.settings),i=await O(a.get("schema"));i&&a.put({...i,schemaVersion:3,appVersion:gt}),await L(t)}async migrateLegacyEntries(e){const t=e.transaction(y.entries,"readwrite"),a=t.objectStore(y.entries),i=await O(a.getAll());for(const o of i)o.syncState===void 0&&a.put(ie(o));await L(t)}async listEntries(){const e=await this.open();try{const t=e.transaction(y.entries,"readonly"),a=t.objectStore(y.entries),i=await O(a.getAll());return await L(t),i.map(o=>ie(o)).sort((o,r)=>r.createdAt-o.createdAt)}finally{e.close()}}async getEntry(e){const t=await this.open();try{const a=t.transaction([y.entries,y.media],"readonly"),i=await O(a.objectStore(y.entries).get(e));if(!i)return await L(a),null;const o=ie(i);let r=null;return o.audioId&&(r=await O(a.objectStore(y.media).get(o.audioId))??null),await L(a),{entry:o,media:r}}finally{t.close()}}async saveCapture(e){const t=await this.open(),a=e.createdAt,i=ie({id:e.id,type:e.type,createdAt:a,updatedAt:a,note:e.note.trim(),audioId:e.audio?.id??null,audioMimeType:e.audio?.mimeType??null,audioByteLength:e.audio?e.audio.blob.size:null,syncState:e.syncState??"LOCAL",localSafeAt:a,syncVersion:e.syncVersion??1,remoteVersion:e.remoteVersion??null,remoteFileId:e.remoteFileId??null,remoteMediaFileId:e.remoteMediaFileId??null,syncErrorCode:null,pexDay:e.pexDay??null,phaseId:e.phaseId??null});try{const o=t.transaction(e.audio?[y.entries,y.media]:y.entries,"readwrite");if(o.objectStore(y.entries).put(i),e.audio){const r={id:e.audio.id,entryId:i.id,mimeType:e.audio.mimeType,blob:e.audio.blob,byteLength:e.audio.blob.size,createdAt:e.createdAt};o.objectStore(y.media).put(r)}return await L(o),i}catch(o){throw be(o)}finally{t.close()}}async updateNote(e,t){const a=await this.open();try{const i=a.transaction(y.entries,"readwrite"),o=i.objectStore(y.entries),r=await O(o.get(e));if(!r)throw new U("save-failed","That entry is no longer in local storage.");const s=ie(r),l=ie({...s,note:t.trim(),updatedAt:Date.now(),syncVersion:s.syncVersion+1,syncState:s.syncState==="SYNCED"?"PENDING_SYNC":s.syncState});return o.put(l),await L(i),l}catch(i){throw i instanceof U?i:be(i)}finally{a.close()}}async updateSyncState(e,t){const a=await this.open();try{const i=a.transaction(y.entries,"readwrite"),o=i.objectStore(y.entries),r=await O(o.get(e));if(!r)throw new U("save-failed","That entry is no longer in local storage.");const s=ie({...r,...t,updatedAt:Date.now()});return o.put(s),await L(i),s}catch(i){throw i instanceof U?i:be(i)}finally{a.close()}}async deleteEntry(e){const t=await this.open();try{const a=t.transaction([y.entries,y.media],"readwrite"),i=await O(a.objectStore(y.entries).get(e));i?.audioId&&a.objectStore(y.media).delete(i.audioId),a.objectStore(y.entries).delete(e),await L(a)}catch{throw new U("delete-failed","The entry could not be deleted. It should still be present in the journal.")}finally{t.close()}}async listProgress(){const e=await this.open();try{const t=e.transaction(y.progress,"readonly"),a=await O(t.objectStore(y.progress).getAll());return await L(t),a.map(i=>Me(i)).sort((i,o)=>i.day-o.day)}finally{e.close()}}async getDayProgress(e){const t=await this.open();try{const a=t.transaction(y.progress,"readonly"),i=await O(a.objectStore(y.progress).get(e));return await L(a),i?Me(i):tn(e)}finally{t.close()}}async writeDayProgress(e,t){const a=await this.open();try{const i=a.transaction([y.progress,y.settings],"readwrite"),o=i.objectStore(y.progress),r=Me(await O(o.get(e))??tn(e)),s=t(r);return o.put(s),i.objectStore(y.settings).put({key:"resumeDay",value:e}),await L(i),s}catch(i){throw be(i)}finally{a.close()}}async markDayVisited(e){return this.writeDayProgress(e,t=>({...t,unlocked:!0,visitedAt:Date.now()}))}async completeDay(e){return this.writeDayProgress(e,t=>({...t,unlocked:!0,visitedAt:t.visitedAt??Date.now(),completedAt:Date.now()}))}async undoDayCompletion(e){return this.writeDayProgress(e,t=>({...t,unlocked:!0,completedAt:null}))}async loadResumeDay(){return this.getSetting("resumeDay")}async getSetting(e){const t=await this.open();try{const a=t.transaction(y.settings,"readonly"),i=await O(a.objectStore(y.settings).get(e));return await L(a),i?.value}finally{t.close()}}async setSetting(e,t){const a=await this.open();try{const i=a.transaction(y.settings,"readwrite");i.objectStore(y.settings).put({key:e,value:t}),await L(i)}catch(i){throw be(i)}finally{a.close()}}async getSchemaInfo(){const e=await this.open();try{const t=e.transaction(y.settings,"readonly"),a=await O(t.objectStore(y.settings).get("schema"));return await L(t),a}finally{e.close()}}async savePersistenceReport(e){await this.setSetting("persistenceReport",e)}async loadPersistenceReport(){return this.getSetting("persistenceReport")}async exportBundle(){const e=await this.open();try{const t=e.transaction([y.entries,y.media],"readonly"),a=await O(t.objectStore(y.entries).getAll()),i=await O(t.objectStore(y.media).getAll());return await L(t),{entries:a.sort((o,r)=>o.createdAt-r.createdAt),media:i}}finally{e.close()}}}const va=new si;function li(){typeof window>"u"||"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").then(n=>{n.addEventListener("updatefound",()=>{const e=n.installing;e&&e.addEventListener("statechange",()=>{e.state==="installed"&&navigator.serviceWorker.controller&&document.dispatchEvent(new CustomEvent("pex-sw-update"))})})})})}async function hi(n=navigator.storage){const e=[],t=!!n,a=typeof n?.persist=="function";let i=null,o=!1,r=null,s=null,l=null;if(!t)e.push("navigator.storage is not present. Persistence cannot be requested in this browser.");else{if(typeof n?.persisted=="function")try{i=await n.persisted()}catch{e.push("storage.persisted() threw; treated as unknown.")}else e.push("storage.persisted() is not present.");if(typeof n?.estimate=="function")try{const d=await n.estimate();s=typeof d.usage=="number"?d.usage:null,l=typeof d.quota=="number"?d.quota:null}catch{e.push("storage.estimate() threw.")}else e.push("storage.estimate() is not present.");if(a&&i!==!0){o=!0;try{r=await n.persist(),r!==!0&&e.push("persist() returned a non-true result. The UI must not claim persistence was granted.")}catch{r=!1,e.push("persist() threw. Persistence is not claimed.")}}else a?(r=!0,e.push("Storage was already marked persisted before this request.")):e.push("storage.persist() is not present.")}const h={inspectedAt:Date.now(),storageApiPresent:t,persistApiPresent:a,persistedBeforeRequest:i,persistRequestAttempted:o,persistGranted:r,estimateUsageBytes:s,estimateQuotaBytes:l,notes:e};try{await va.savePersistenceReport(h)}catch{e.push("The persistence report could not be stored in IndexedDB.")}return h}const Ta="pex-theme";function Qn(){try{const n=localStorage.getItem(Ta);if(n==="bedtime"||n==="light")return n}catch{}return"light"}function Xn(n=Qn()){const e=document.documentElement;e.dataset.theme=n;const t=n==="bedtime"?"#0c0c0b":"#f7f5ef",a=document.querySelector('meta[name="theme-color"]');a&&a.setAttribute("content",t);try{localStorage.setItem(Ta,n)}catch{}return n}function ci(){const n=Qn()==="bedtime"?"light":"bedtime";return Xn(n)}const ka=`# Move Your Attention: Focused Attention and Body Awareness Meditation

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

Deliberately attending to the body can make normally quiet sensations more noticeable.

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

A traditional energy practitioner might describe increased qi, prana, or subtle-energy movement. Those words name a model, not a demonstrated substance in the laboratory sense. A tingling forearm is still a tingling forearm whether we call it qi, attention, or nerves.

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

When you are ready for sleep, [**Relax the body**](/body-scan-meditation/#nighttime-body-release).

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

We turned attention backward toward dreams that were disappearing.

We turned attention toward unusual details.

We attached attention to recognition.

We turned attention inward toward the body.

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

At bedtime, [**Relax the body**](/body-scan-meditation/#nighttime-body-release).

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
`,di=`# Remember Your Dreams: Dream Recall Techniques and Research

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

Sleep itself is also a difficult environment for ordinary waking memory. Dreaming can be richly detailed while it is happening and still leave little behind once the brain shifts into wake-oriented processing. Reviews of dreaming and the sleeping brain treat that disappearance as a memory problem, not as proof that nothing occurred.[1]

Think of a dream as a message written in disappearing ink. Morning is when we learn how to read it before the page clears.

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

Start with whatever arrives: an image, a place, a voice, a person, a color, a body sensation, an emotion, a sentence, or a single absurd fact.

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

So we begin here. Tonight you sleep, you dream, morning comes—and instead of immediately leaving that world behind, you turn toward it.

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
`,Zn="nighttime-body-release",ui="A Nighttime Body Release",yt="relax-the-body",mi="Relax the body",Cn=`/body-scan-meditation/#${Zn}`,et="pex:attention-instrument",pi={[ui]:Zn,References:"references"};function gi(n){return pi[n]}const yi={[yt]:{id:yt,href:Cn,label:mi}};function fi(n=window.location.hash){const t=n.replace(/^#/,"").split("?")[0]||"/",[a,i=""]=t.split("#");return{path:(a&&a.startsWith("/")?a:`/${a??""}`)||"/",fragment:i}}const Ia="Remember Your Dreams: Dream Recall Techniques and Research",xa="/dream-recall/",bi=xa,Nn=["Summary","Experiment","Intention"];function Aa(n){return Nn.includes(n)}function On(n){const e=n.match(/^#{2,3}\s+(.*)$/);if(!e)return null;const t=e[1].trim();return Aa(t)?t:null}function Sa(n){const e=n.trim();return!e||e==="---"||n.startsWith("## ")||n.startsWith("### ")||n.startsWith("> ")||n.trim()===et||/^\d+\.\s/.test(n)||/^-\s/.test(n)}function S(n){const e=n.replace(/\r\n/g,`
`).trim().split(`
`);if(!e[0]?.startsWith("# "))throw new Error("Chapter manuscript must begin with a top-level heading");const t=e[0].slice(2).trim(),a=[],i=[];let o=1,r=!1;for(;o<e.length;){const s=e[o];if(r){const c=s.trim();c&&i.push(c),o+=1;continue}if(!s.trim()){o+=1;continue}if(s.trim()==="---"){a.push({kind:"rule"}),o+=1;continue}if(s.trim()===et){a.push({kind:"attention"}),o+=1;continue}if(On(s)){const c=vi(e,o);a.push(c.block),o=c.nextIndex,o<e.length&&e[o].trim()==="---"&&(o+=1);continue}if(s.startsWith("## ")){const c=s.slice(3).trim();if(c==="References"){r=!0,o+=1;continue}a.push({kind:"heading",text:c}),o+=1;continue}if(s.startsWith("### ")){a.push({kind:"subheading",text:s.slice(4).trim()}),o+=1;continue}if(s.startsWith("> ")){const c=[];for(;o<e.length&&e[o].startsWith("> ");)c.push(e[o].slice(2).trim()),o+=1;a.push({kind:"quote",text:c.join(" ")});continue}if(/^\d+\.\s/.test(s)){const c=[];for(;o<e.length&&/^\d+\.\s/.test(e[o]);)c.push(e[o].replace(/^\d+\.\s+/,"").trim()),o+=1;a.push({kind:"list",items:c,ordered:!0});continue}if(/^-\s/.test(s)){const c=[];for(;o<e.length&&/^-\s/.test(e[o]);)c.push(e[o].replace(/^-\s+/,"").trim()),o+=1;a.push({kind:"list",items:c,ordered:!1});continue}const h=[];for(;o<e.length;){const c=e[o];if(Sa(c)&&c.trim()!==""||!c.trim())break;h.push(c.trim()),o+=1}const d=h.join(" ");d.startsWith("**")&&d.endsWith("**")&&!d.slice(2,-2).includes("**")?a.push({kind:"emphasis",text:d.slice(2,-2)}):d&&a.push({kind:"paragraph",text:d})}return{title:t,blocks:a,references:i}}function wi(n,e,t){const a=[];let i=e;for(;i<n.length;){const o=n[i];if(t(o))break;if(!o.trim()){i+=1;continue}if(o.trim()==="---"){a.push({kind:"rule"}),i+=1;continue}if(o.trim()===et){a.push({kind:"attention"}),i+=1;continue}if(o.startsWith("### ")){const l=o.slice(4).trim();if(!Aa(l)){a.push({kind:"subheading",text:l}),i+=1;continue}}if(o.startsWith("> ")){const l=[];for(;i<n.length&&n[i].startsWith("> ");)l.push(n[i].slice(2).trim()),i+=1;a.push({kind:"quote",text:l.join(" ")});continue}if(/^\d+\.\s/.test(o)){const l=[];for(;i<n.length&&/^\d+\.\s/.test(n[i]);)l.push(n[i].replace(/^\d+\.\s+/,"").trim()),i+=1;a.push({kind:"list",items:l,ordered:!0});continue}if(/^-\s/.test(o)){const l=[];for(;i<n.length&&/^-\s/.test(n[i]);)l.push(n[i].replace(/^-\s+/,"").trim()),i+=1;a.push({kind:"list",items:l,ordered:!1});continue}const r=[];for(;i<n.length;){const l=n[i];if(t(l)||!l.trim()||Sa(l)&&l.trim()!=="")break;r.push(l.trim()),i+=1}const s=r.join(" ");s.startsWith("**")&&s.endsWith("**")&&!s.slice(2,-2).includes("**")?a.push({kind:"emphasis",text:s.slice(2,-2)}):s&&a.push({kind:"paragraph",text:s})}return{blocks:a,nextIndex:i}}function vi(n,e){const t=[];let a=e;for(const i of Nn){if(On(n[a]??"")!==i)throw new Error(`Practice component must use ${Nn.join(", then ")} headings`);a+=1;const r=wi(n,a,s=>!!(s.startsWith("## ")||On(s)||s.trim()==="---"));t.push({label:i,blocks:r.blocks}),a=r.nextIndex}return{block:{kind:"practice",parts:t},nextIndex:a}}let an=null;function Ti(){return an||(an=S(di)),an}const Pn="Move Your Attention: Focused Attention and Body Awareness Meditation",ki="/attention-body-awareness/",ft=ki,Ii="PEX-IMPLEMENTATION-PLACEHOLDER";let on=null;function Le(){const n=ka.trim();return!n||n.includes(Ii)?!1:n.startsWith(`# ${Pn}`)}function xi(){if(!Le())throw new Error("Chapter 5 manuscript has not been supplied by PEX_PRIMARY");return on||(on=S(ka)),on}const Ai=[{id:"landing",title:"A Free Researched Guidebook for Lucid Dreaming and Out-of-Body Practice",path:"/",legacyHashes:["#/","#"],description:"A free researched guidebook for dream recall, attention, lucid dreaming, and out-of-body practice. Public pages use aggregate analytics. Journal entries stay on this device."},{id:"home",title:"Psychical Excursion: Lucid Dreaming, Meditation, Visualization & OBE Research",path:"/psychical-excursion/",legacyHashes:[],description:"A free researched practice guide for lucid dreaming, meditation, visualization, and out-of-body experience. Public pages use aggregate analytics. Journal entries stay on this device."},{id:"chapter01",title:"Remember Your Dreams: Dream Recall Techniques and Research",path:"/dream-recall/",legacyHashes:["#/you-are-dreaming-remember"],description:"Dream recall techniques and research for noticing and remembering more of the night’s dreams."},{id:"chapter02",title:"Notice Your Dreams: Dream Awareness, Patterns and Dream Signs",path:"/dream-awareness-signs/",legacyHashes:["#/you-are-dreaming-notice"],description:"How to notice dream awareness, repeating patterns, and dream signs without forcing a story onto the night."},{id:"chapter03",title:"Recognize the Dream: Lucid Dreaming, Reality Checks and Dream Signs",path:"/lucid-dreaming-reality-checks/",legacyHashes:["#/you-are-dreaming-recognize"],description:"Lucid dreaming practice that uses reality checks and dream signs to recognize the dream while it is happening."},{id:"chapter04",title:"Feel the Body: Body Scan Meditation and Deep Relaxation",path:"/body-scan-meditation/",legacyHashes:["#/feel-the-body"],description:"Body scan meditation and deep relaxation as a way to feel the body before sleep-edge practice."},{id:"chapter05",title:"Move Your Attention: Focused Attention and Body Awareness Meditation",path:"/attention-body-awareness/",legacyHashes:["#/move-your-attention"],description:"Focused attention and body-awareness meditation for moving attention through the body without forcing results."},{id:"chapter06",title:"Build the Current: Tingling, Energy Sensations and Focused Attention",path:"/energy-sensations-meditation/",legacyHashes:["#/build-the-current"],description:"Tingling and energy-like sensations as objects of focused attention, kept distinct from interpretation."},{id:"chapter07",title:"Quiet the Mind: Meditation Techniques for Sleep and Dream Awareness",path:"/meditation-for-lucid-dreaming/",legacyHashes:["#/quiet-the-mind"],description:"Meditation techniques that quiet mental noise around sleep so dream awareness can be noticed."},{id:"chapter08",title:"See the Image: Visualization, Mental Imagery and Hypnagogic Imagery",path:"/visualization-hypnagogic-imagery/",legacyHashes:["#/see-the-image"],description:"Visualization and hypnagogic imagery as they appear near sleep, including how images form and fade."},{id:"chapter09",title:"Watch the Edge: Hypnagogia and the Transition Into Lucid Dreaming",path:"/hypnagogia-lucid-dreaming/",legacyHashes:["#/watch-the-edge"],description:"Watching hypnagogia and the sleep-edge transition without treating every image as a finished dream."},{id:"chapter10",title:"Let the Body Sleep: The “Mind Awake, Body Asleep” Route to Lucid Dreaming",path:"/mind-awake-body-asleep/",legacyHashes:["#/let-the-body-sleep"],description:"The mind-awake, body-asleep route to lucid dreaming, including how awareness and the sleeping body can diverge."},{id:"chapter11",title:"Move Without Moving: Motor Imagery, Dream Movement and Sleep-Onset Practice",path:"/motor-imagery-lucid-dreaming/",legacyHashes:["#/move-without-moving"],description:"Motor imagery and imagined movement while the physical body stays still, as sleep-onset practice."},{id:"chapter12",title:"Feel the Shift: Vibrations, Floating and Out-of-Body Sensations Near Sleep",path:"/out-of-body-sensations-sleep/",legacyHashes:["#/feel-the-shift"],description:"Vibrations, floating, and out-of-body sensations near sleep, tracked as changes in bodily self rather than a single event."},{id:"chapter13",title:"Know the Threshold: How to Recognize When Waking Imagery Becomes a Dream",path:"/entering-a-lucid-dream/",legacyHashes:["#/know-the-threshold"],description:"How to notice the threshold where waking imagery begins to continue as a dream, without diagnosing a sleep stage."},{id:"chapter14",title:"Stabilize the Dream: Lucid Dream Stabilization Techniques and Research",path:"/lucid-dream-stabilization/",legacyHashes:["#/stabilize-the-dream"],description:"Lucid dream stabilization techniques and research, keeping lucidity, stability, and control distinct."},{id:"chapter15",title:"Explore the Dream: Lucid Dream Experiments, Dream Control and Research",path:"/lucid-dream-experiments/",legacyHashes:["#/explore-the-dream"],description:"Lucid dream experiments that keep exploration, dream control, and externally verified facts distinct."},{id:"chapter16",title:"Loosen the Body: Body Ownership, Self-Location and Out-of-Body Experience",path:"/out-of-body-experience-body-ownership/",legacyHashes:["#/loosen-the-body"],description:"How body ownership, self-location, perspective, and vestibular-motor experience can loosen independently near sleep, without treating an OBE as proven literal separation."},{id:"chapter17",title:"Cross the Threshold: Astral Projection, OBE Techniques and Lucid Dreaming",path:"/astral-projection-obe-techniques/",legacyHashes:["#/cross-the-threshold"],description:"Astral projection, OBE techniques, and lucid-dreaming entry methods compared at the sleep-edge threshold, without treating rope or roll-out methods as proven separation."},{id:"chapter18",title:"Test the Experience: Can Lucid Dreams and Out-of-Body Experiences Be Verified?",path:"/testing-out-of-body-experiences/",legacyHashes:["#/test-the-experience"],description:"How to test lucid-dream and out-of-body claims with pre-specified hidden targets, without treating vividness as proof or AWARE as a final verdict."},{id:"chapter19",title:"Compare the Maps: Lucid Dreaming vs. Astral Projection, OBE and Sleep Paralysis",path:"/lucid-dreaming-vs-astral-projection/",legacyHashes:["#/compare-the-maps"],description:"A comparison of lucid dreaming, sleep paralysis, out-of-body experience, and astral projection as overlapping maps, not as one proven state or established travel."},{id:"chapter20",title:"Floating in Space: Sun, Moon, Planets and the Science of Sleep & Dreams",path:"/sun-moon-planets-sleep-dreams/",legacyHashes:["#/watch-the-sky"],description:"How sunlight, lunar cycles, tropical-zodiac geometry, and planetary claims relate to sleep and dreams, keeping observation, history, correlation, and symbolism distinct."},{id:"chapter21",title:"Notice the Coincidence: Synchronicity, Recurring Dreams, Shared Dreams and Pattern Recognition",path:"/synchronicity-recurring-shared-dreams/",legacyHashes:["#/notice-the-coincidence"],description:"How to record synchronicity, recurring dream characters and places, and shared-dream reports without treating coincidence as destiny or dream telepathy as established."},{id:"chapter22",title:"Return. Record. Repeat: The Best Bedtime Routine for Lucid Dreaming and Astral Projection",path:"/lucid-dreaming-astral-projection-bedtime-routine/",legacyHashes:["#/return-record-repeat"],description:"A sleep-protecting bedtime loop for lucid dreaming and astral-projection practice: record first, choose one induction, keep one affirmation, and review thirty nights honestly."}],nt={pages:Ai},Ge=nt.pages,tt=nt.pages.find(n=>n.id==="landing"),at=nt.pages.find(n=>n.id==="home");tt.title;const We=tt.path;tt.description;const Si=at.title,Be=at.path;at.description;function Ue(n){if(!n)return We;const e=n.split("?")[0]||"/",t=e.startsWith("/")?e:`/${e}`;return t==="/"||t==="/index.html"?We:t.endsWith("/")?t:`${t}/`}function Ei(n){return Ge.find(e=>e.id===n)}function Ri(n){const e=Ue(n);return Ge.find(t=>t.path===e)}function Ea(n){return Ei(n==="home"?"home":n)}function Mi(n){return`${n} | Psychical Excursion`}function Di(n){const e=n.trim();return!e||e==="#"||e==="#/"?"#/":e}function Ra(n){if(!n.startsWith("#/"))return null;const e=n.replace(/^#/,"");if(!e||e==="/")return{path:We,fragment:""};if(!e.startsWith("/"))return null;const t=e.split("?")[0]||"/",[a,i=""]=t.split("#"),o=Di(`#${a||"/"}`),r=Ge.find(s=>s.legacyHashes.includes(o));return r?{path:r.path,fragment:i}:null}const Ci=`# Notice Your Dreams: Dream Awareness, Patterns and Dream Signs

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

Dream research gives a second reason those recurrences are worth noticing. The **continuity hypothesis** treats a large part of dream content as connected to recent and ongoing waking life: concerns, people, places, and unfinished business tend to reappear, often in rearranged form.[7] That is a description of patterning, not a license to decide that every repeating image is a message from elsewhere.

The useful move is simpler. Notice the habit. Record it. Leave the metaphysics for later, when you have more than a hunch.

## Four Ways a Dream Gives Itself Away

Stephen LaBerge and other lucid-dream researchers have used categories for dream signs that are useful without turning this into a taxonomy lesson.[4]

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

Paul Tholey developed what he called the **reflection technique** for lucid dreaming. During waking life, he repeatedly questioned whether he was awake or dreaming, especially when something unusual occurred.[2][3]

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

Reality testing is a legitimate lucid-dream induction technique, but studies have not shown that simply performing lots of reality checks reliably produces lucid dreams. In a large 2020 study comparing induction methods, the number of daytime reality tests did not significantly predict lucid dreaming success. MILD and SSILD showed stronger results.[1] An earlier systematic review of induction methods likewise found mixed and often modest effects, with cognitive techniques such as MILD among the more promising approaches rather than a guaranteed method.[5]

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

In Tenzin Wangyal Rinpoche's presentation of Bön dream yoga, practitioners cultivate awareness of waking experience itself as dreamlike.[6]

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

[5] Stumbrys, T., Erlacher, D., Schädlich, M., & Schredl, M. “Induction of Lucid Dreams: A Systematic Review of Evidence.” *Consciousness and Cognition* 21, no. 3 (2012): 1456–1475. https://doi.org/10.1016/j.concog.2012.07.003

[6] Tenzin Wangyal Rinpoche. *The Tibetan Yogas of Dream and Sleep*. Revised and updated edition. Shambhala, 2022.

[7] Schredl, M., & Hofmann, F. “Continuity Between Waking Activities and Dream Activities.” *Consciousness and Cognition* 12, no. 2 (2003): 298–308. https://doi.org/10.1016/S1053-8100(02)00072-7
`,bt="Notice Your Dreams: Dream Awareness, Patterns and Dream Signs",Ni="/dream-awareness-signs/",wt=Ni;let rn=null;function Oi(){return rn||(rn=S(Ci)),rn}const Ma=`# Recognize the Dream: Lucid Dreaming, Reality Checks and Dream Signs

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

Fortunately, we already have plenty.

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

So MILD deserves our attention. It does not deserve mythology.

When the later chapters collapse many techniques into one nightly loop, this same recognition skill is still the cognitive core. We do not need a second copy of that routine here. We need the habit: a cue appears, and you remember what you meant to do.

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
`,Ln="Recognize the Dream: Lucid Dreaming, Reality Checks and Dream Signs",Pi="/lucid-dreaming-reality-checks/",vt=Pi,Li="PEX-IMPLEMENTATION-PLACEHOLDER";let sn=null;function Wi(){const n=Ma.trim();return!n||n.includes(Li)?!1:n.startsWith(`# ${Ln}`)}function Bi(){if(!Wi())throw new Error("Chapter 3 manuscript has not been supplied by PEX_PRIMARY");return sn||(sn=S(Ma)),sn}const Fi=`# Feel the Body: Body Scan Meditation and Deep Relaxation

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

Laboratory research on somatosensory attention shows that directing attention toward a particular part of the body can alter the processing of touch and bodily sensation associated with that location.[1] Interoception—the sensing of the body's internal condition—is a related, ordinary capacity. It is not a mystical faculty, and it is not proof of a second body. It is simply one of the ways the nervous system keeps track of what is happening inside the organism.[4]

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

It grew out of work by physician Edmund Jacobson in the early twentieth century and has since been adapted into many shorter forms.[3]

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

A growing body of randomized research suggests that progressive muscle relaxation can improve subjective sleep quality in adults. A 2026 systematic review and meta-analysis including thirty-one randomized trials found overall improvement in reported sleep quality, although heterogeneity was high and effects varied substantially across studies and populations.[2] That is a reason to treat PMR as a useful sleep-compatible skill, not as a guaranteed sleep drug.

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

So this chapter really begins two practices.

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

[3] Jacobson, E. *Progressive Relaxation*. University of Chicago Press, 1938.

[4] Craig, A. D. “How Do You Feel? Interoception: The Sense of the Physiological Condition of the Body.” *Nature Reviews Neuroscience* 3 (2002): 655–666. https://doi.org/10.1038/nrn894
`,Tt="Feel the Body: Body Scan Meditation and Deep Relaxation",zi="/body-scan-meditation/",kt=zi;let ln=null;function Hi(){return ln||(ln=S(Fi)),ln}const Yi=`# Build the Current: Tingling, Energy Sensations and Focused Attention

We moved attention.

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

You may discover that moving attention is easier than holding broad attention. That difference is useful when attention is later asked to remain still.

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

Tonight, when you are ready for sleep, [**Relax the body**](/body-scan-meditation/#nighttime-body-release).

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

We began by feeling the body.

Then we learned to release it.

Then we made attention mobile.

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

At bedtime, [**Relax the body**](/body-scan-meditation/#nighttime-body-release), perform one gentle circuit, and then ask:

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
`,It="Build the Current: Tingling, Energy Sensations and Focused Attention",qi="/energy-sensations-meditation/",xt=qi;let hn=null;function ji(){return hn||(hn=S(Yi)),hn}const _i=`# Quiet the Mind: Meditation Techniques for Sleep and Dream Awareness

In the last few chapters, attention has been something you deliberately moved. You learned to notice sensations in the body, shift attention from one location to another, and finally connect those movements into larger circuits. That raises a different question: what happens when you stop moving attention and ask it to remain in one place?

This is one of the basic problems meditation has been exploring for a very long time. It is also surprisingly difficult. Choose something simple—the sensation of breathing at the nose, the weight of one hand, a quiet sound, or a particular point in the body—and decide to keep your attention there. Before long, you will probably discover that you have been thinking about something completely different. The interesting moment is not the distraction itself. It is the instant when you realize that your attention has wandered.

Researchers studying mind-wandering sometimes call that recognition **meta-awareness**: awareness of what your own mind is currently doing. Experiments distinguish between periods when people are absorbed in mind-wandering without realizing it and moments when they catch themselves doing it. That distinction matters here because the ability to notice the drift gives you an opportunity to redirect attention deliberately.[1]

The practical skill in this chapter is therefore not “having no thoughts.” It is becoming increasingly familiar with the cycle of **remaining, wandering, recognizing, and returning**.

## Training Attention Rather Than Eliminating Thought

Focused-attention meditation is one of the clearest research models for this process. A practitioner selects an object—often the breath—and attempts to maintain attention on it. When another thought, sensation, memory, or sound captures attention, the task is to recognize the distraction and return to the intended object. Reviews of meditation research suggest that this kind of practice can improve aspects of sustained attention, although studies vary considerably in their methods, populations, and effect sizes.[2]

That qualification is worth keeping. Meditation is sometimes presented as if the scientific question has already been settled and a few minutes of daily practice will reliably transform attention, memory, mood, stress, and brain structure all at once. The evidence is more modest. Some controlled studies and reviews report improvements in sustained attention and reductions in mind-wandering, while results vary according to the kind of meditation, duration of training, participant experience, and the task used to measure attention.[2]

For our purposes, we do not need a sweeping claim. The smaller observation is enough: deliberately maintaining attention is a trainable task, and repeatedly recognizing distraction is part of that training.

This also changes what counts as a successful practice session. If your mind wanders twenty times and you recognize it twenty times, you have not spent the session failing twenty times. You have repeatedly exercised the moment of recognition and return. Over time, you can pay attention to whether distractions are recognized more quickly, whether attention remains stable for longer periods, and whether returning becomes easier.

That is more useful than trying to manufacture an empty mind.

## Why Fighting Thoughts Usually Does Not Help

When people first attempt mental quiet, an obvious strategy is to suppress thoughts: *I am going to stop thinking.* The problem is that monitoring whether a forbidden thought has returned requires keeping some representation of that thought active. Research on thought suppression has repeatedly found what are sometimes called ironic or rebound effects. Meta-analyses suggest that after people deliberately suppress a thought, the thought can become more accessible afterward, although the magnitude of the effect depends on the experimental conditions.[3]

Meditation does not require you to accept every thought as meaningful, nor does it require you to follow it. It simply gives you another option besides following or fighting.

Suppose you are attending to the feeling of your hand and suddenly remember an email you need to answer. You can notice that the email thought appeared without beginning to compose the response mentally. Return attention to the hand. If the thought is genuinely important, it will still be possible to deal with it when the practice ends.

This distinction—between **having a thought** and **continuing the thought**—is one of the most practical things meditation can teach.

The same principle applies to sensations. An itch does not automatically require scratching. A sound does not automatically require identifying its source. A sensation elsewhere in the body does not automatically require moving attention toward it. Sometimes you will move, scratch, investigate, or stop the exercise because something genuinely needs attention. Immobility is not the prize. The experiment is noticing the usually automatic transition from stimulus to attention to reaction.

## From Moving Attention to Holding It

Movement itself was the exercise. You traced attention through the body and experimented with longer circuits. Now try using that work as an entry point into stillness.

Run one slow circuit through the body. Once the circuit is complete, choose one location along it and stop there. Instead of immediately moving onward, examine what happens to the sensation over time.

This is more interesting than it first sounds because bodily sensation is not perfectly constant. A point that initially feels obvious may fade after several seconds. Another sensation may replace it. The area may seem to pulse, spread, shrink, warm, tingle, or become difficult to locate precisely. Some of those changes may reflect actual changes in bodily signals; others may reflect changes in attention and perception. We do not need to decide which explanation applies to every sensation in order to observe the instability.

Stay with the point long enough to notice change.

This is a useful bridge between the earlier body exercises and meditation because the object of attention is already familiar. You are not being asked to adopt a new belief system or imagine a special meditative condition. You are taking a skill you already practiced—directing attention toward bodily sensation—and changing one variable: movement stops.

The experiment becomes: **how stable can attention remain when its target stays the same?**

## Focused Attention and Open Monitoring

Meditation research often distinguishes **focused-attention meditation** from **open-monitoring meditation**. In focused attention, one object is deliberately selected and competing stimuli are repeatedly allowed to pass without becoming the new target. In open monitoring, attention is less narrowly attached to one object. The practitioner instead observes changing sensations, thoughts, emotions, and sounds as they enter and leave awareness.[4]

The two approaches should not simply be treated as beginner and advanced versions of the same thing. They place different demands on attention and appear to produce partly different cognitive effects. Experimental comparisons have found differences in how focused-attention and open-monitoring practices influence attentional processing, and recent work continues to investigate whether the sequence in which novices learn them matters.[4][5]

For this guidebook, focused attention comes first for a practical reason: it gives us something concrete to train. Choose an object and learn to recognize when attention has left it. Once that becomes familiar, briefly remove the fixed object and observe the larger field.

Try it.

Attend to your breathing for several minutes without deliberately changing the breath. When you notice that attention has wandered, return to the physical sensation of breathing.

Then release the breath as the assigned target.

For perhaps thirty seconds, do not select anything.

A sound appears. Notice it.

A body sensation becomes prominent. Notice it.

A thought begins. Notice that.

Another sound replaces the first.

Instead of asking *Can I keep attention here?*, the question becomes *Can I remain aware of what changes without automatically pursuing each change?*

Focused attention trains stability around a selected object. Open monitoring investigates awareness when no single object is privileged. Both are useful, and learning their difference by experience is more valuable than memorizing terminology.

## Relaxation Is Not the Same as Attention

Meditation is also commonly confused with relaxation. They often overlap, but they are not identical.

You can lie comfortably in bed with every muscle relaxed while your thoughts race through tomorrow's problems. You can also maintain highly stable attention while sitting upright and feeling completely alert. Focused-attention practice may become calming, but relaxation is not the measurement we are interested in here.

What matters for the later parts of this book is the combination of **physical ease and continuing awareness**.

That becomes important because we are eventually going to investigate the boundary between ordinary waking consciousness and sleep. If every reduction in mental activity simply produces unconscious sleep, there is not much to observe. The useful skill is learning to reduce unnecessary activity while remaining interested in what is happening.

That does not mean fighting sleep. When you are tired, sleep is valuable and should win. It means learning, while awake, what relaxed but stable attention feels like so that later experiments have a familiar starting point.

## Meditation and Brainwaves

Meditation is frequently explained online using a simple brainwave ladder. Beta is ordinary thinking, alpha is relaxation, theta is deep meditation, and gamma is sometimes presented as an advanced or even enlightened state.

The actual neuroscience does not support such a clean hierarchy.

EEG studies measure oscillatory activity occurring across several frequency ranges at the same time. Reviews of meditation research have reported changes involving alpha, theta, beta, gamma, and other measures, but the pattern depends on the meditation technique, participant experience, task, recording method, comparison condition, and analysis being used. A 2025 systematic review of focused-attention meditation specifically emphasized substantial heterogeneity across the EEG and MEG literature rather than identifying one universal electrophysiological signature.[6]

That is why an interesting measurement should not become a spiritual thermometer. An increase in a particular EEG frequency does not by itself tell us how “deep” someone's meditation was. Even meditation categories that sound similar can involve different attentional strategies.

The better measurements for this chapter remain behavioral and experiential: how long can you maintain the intended target, how quickly do you recognize mind-wandering, how easily can you return, and what differences do you notice between focused attention and open observation?

Those questions are less glamorous than buying a brainwave headband, but they tell us much more directly whether the skill we are trying to develop is changing.

## Meditation, Concentration, and Gnosis

The attempt to stabilize attention is not unique to modern mindfulness practice. Buddhist contemplative traditions contain extensive concentration and awareness practices. Yogic traditions include related forms of concentration and meditation. Western ceremonial and occult traditions have their own terminology, including **gnosis**, trance, contemplation, and one-pointed concentration.

These terms should not be treated as interchangeable names for a single neurological state. They developed within different traditions, with different purposes and explanatory systems. Some describe religious goals that go far beyond attentional training.

What interests us here is the component that can be investigated without accepting any particular metaphysics: deliberate control of attention and changes in awareness that accompany sustained practice.

If later experience becomes unusual, we can examine that experience then.

For now, there is plenty to learn simply by sitting still and watching what attention does.

## Attention and Dreaming

There is also a useful connection back to the dream practice.

During ordinary waking life, people frequently become absorbed in thought without immediately noticing that attention has left the surrounding environment. Then there is a moment of recognition: *I was somewhere else mentally.*

Lucid dreaming contains a much more dramatic form of state recognition. A person who has been accepting the dream as ordinary suddenly recognizes the condition they are already experiencing: *I am dreaming.*

These are not the same cognitive event, and meditation should not be presented as a guaranteed route to lucid dreaming. But both make **recognizing your present mental state** interesting.

So when you catch yourself emerging from a long period of mind-wandering during the day, occasionally use that interruption as a dream cue. Instead of mechanically asking *Am I dreaming?*, actually investigate.

Look at your surroundings.

Read something twice.

Notice your hands.

Remember what you were doing immediately before this moment and how you arrived where you are.

Then answer.

The aim is not to develop the habit of saying “no.” The aim is to develop the habit of **checking the state you are already inside**.

That practice belongs naturally beside meditation because this chapter is ultimately about the same broader capacity we have been building from the beginning: recognizing where attention is and choosing what to do next.

## Summary

The goal of mental quiet is not to eliminate every thought. A more useful skill is attentional stability: selecting an object, recognizing when attention has wandered, and returning deliberately.

Focused-attention meditation trains this cycle directly. Open monitoring changes the task by removing the single assigned object and observing whatever becomes prominent. Research treats these as related but distinguishable meditation approaches, and evidence suggests meditation can improve aspects of sustained attention, though results vary and should not be exaggerated.[2][4]

Thoughts, sensations, and sounds will continue to occur. Their appearance does not require following them or suppressing them. The experiment is discovering how much choice exists between something appearing in awareness and attention becoming absorbed by it.

This chapter also establishes a skill we will need shortly: remaining relaxed and observant while doing very little. In the next stages, that same stability will be used to investigate internal imagery and eventually the transition toward sleep.

## Experiment

If you are practicing near bedtime, begin with [**Relax the body**](/body-scan-meditation/#nighttime-body-release). Then perform one slow circuit from [**Build the Current**](/energy-sensations-meditation/) and allow the movement of attention to stop.

Choose a single object of attention. The physical sensation of natural breathing is useful, but a body point, steady sound, or simple repeated word also works. Spend several minutes remaining with that object. Each time you notice that attention has moved elsewhere, briefly recognize what captured it and return.

Do not count distractions as mistakes. If you want to measure anything, notice whether you begin recognizing them sooner.

Then release the assigned object for a short period. Instead of selecting the next thing to attend to, observe the changing field of experience. Notice sensations, sounds, thoughts, and the visual field behind closed eyes as they become prominent and fade.

Finally compare three experiences you have now practiced:

**moving attention, holding attention, and observing attention.**

They sound similar when described abstractly. They often feel quite different when you actually perform them.

During the following day, when you unexpectedly realize that your mind has wandered, occasionally use the moment as a reality check. Ask **Am I dreaming?** and investigate before answering.

## Intention

**I notice where my attention goes, and I return deliberately.**

## References

**[1]** Chin, M. S., Schooler, J. W., Smallwood, J., & Smilek, D. *Self-caught methodologies for measuring mind wandering with meta-awareness: A systematic review.* Consciousness and Cognition, 2023. https://pubmed.ncbi.nlm.nih.gov/36640586/

**[2]** Roy, A., & Subramanya, P. *The impact of meditation on sustained attention in nonclinical population: An extensive review.* Journal of Ayurveda and Integrative Medicine, 2025. https://pubmed.ncbi.nlm.nih.gov/40043592/

**[3]** Wang, D. A., Hagger, M. S., & Chatzisarantis, N. L. D. *Ironic Effects of Thought Suppression: A Meta-Analysis.* Perspectives on Psychological Science, 2020. https://pubmed.ncbi.nlm.nih.gov/32286932/

**[4]** Lippelt, D. P., Hommel, B., & Colzato, L. S. *Focused attention, open monitoring and loving kindness meditation: effects on attention, conflict monitoring, and creativity — A review.* Frontiers in Psychology, 2014. https://pubmed.ncbi.nlm.nih.gov/25295025/

**[5]** Ishikawa, H., Muta, T., Abe, T., Imajo, N., & Koshikawa, F. *The individual and sequential effect of focused attention and open monitoring meditation on mindfulness skills.* PLOS ONE, 2025.

**[6]** Lieberman, J. M., McConnell, P. A., Estarellas, M., & Sacchet, M. D. *Neurophysiological mechanisms of focused attention meditation: A scoping systematic review.* Imaging Neuroscience, 2025. https://pubmed.ncbi.nlm.nih.gov/40800838/
`,At="Quiet the Mind: Meditation Techniques for Sleep and Dream Awareness",Gi="/meditation-for-lucid-dreaming/",St=Gi;let cn=null;function Ui(){return cn||(cn=S(_i)),cn}const Vi=`# See the Image: Visualization, Mental Imagery and Hypnagogic Imagery

Close your eyes and picture a basketball.

That instruction sounds simple until you ask what *picture* means.

Maybe an orange ball appears immediately, complete with black channels, pebbled rubber, highlights, shadows, and a clear sense of depth. Maybe you get something much weaker: a vague round form, a suggestion of orange, or a momentary outline that disappears when you try to inspect it. Maybe you do not see anything at all, but you still know perfectly well what a basketball looks like. You can describe it, rotate it mentally, imagine holding it, and predict how its black lines would move as the ball turns.

Those are not necessarily the same ability.

Casual discussions of visualization often treat mental imagery as a single scale running from weak to vivid. Research on aphantasia—the reported absence or near-absence of voluntary visual imagery—has made that picture much more complicated. People differ not only in how vivid their internal pictures feel, but in the kinds of mental representation available to them. Researchers have found distinctions between object imagery and spatial imagery, between visual and other sensory imagery, and between people who rely heavily on visual experience and people who solve the same tasks through spatial, verbal, or analytic strategies.[1][2]

Before trying to improve imagery, then, it helps to find out what you already have.

## What Does “Visualize” Mean?

The word *visualize* is convenient because it compresses several different experiences into one instruction. Two people can follow the same instruction while having very different internal experiences.

One person might report something approaching ordinary sight, though usually less stable and less detailed. Another might experience faint imagery that feels more like a memory than a picture. Someone else may have spatial structure without visible surfaces: they know the ball is round and know where it is positioned, but there is no orange sphere floating in an internal visual field.

Aphantasia is usually defined around absent or severely reduced voluntary visual imagery while awake, but even that category appears to contain substantial variation. Research suggests that it is probably not one single phenomenon. People can differ in object imagery, spatial imagery, other sensory modalities, involuntary imagery, memory, face recognition, and the cognitive strategies they use.[1][2]

That makes introspection useful here, but introspection needs specific questions.

Instead of asking only **Can I see it?**, ask whether you can sense its shape, locate it in space, rotate it, change its size, imagine its color, inspect surface detail, feel its texture, imagine its weight, hear what happens when it hits the floor, or predict what it will look like after it rotates even if you never consciously see the rotation.

A single answer to “How good is your visualization?” hides all of that.

## Object Imagery and Spatial Imagery

Researchers have long distinguished between **object imagery** and **spatial imagery**. Object imagery concerns properties such as shape, color, appearance, and visual detail. Spatial imagery concerns position, orientation, distance, transformation, navigation, and relations among things.

The distinction becomes especially interesting in people with very weak visual imagery.

Studies of mental rotation have found that people reporting aphantasia can still solve rotation problems successfully. In a 2024 study using three-dimensional block shapes and rotating human figures, participants with aphantasia were slower but more accurate than control participants. Both groups still showed the familiar increase in response time as the amount of required rotation increased. The groups appeared to differ partly in strategy: typical imagers favored object-based mental rotation more often, while aphantasic participants reported greater use of analytic approaches.[3]

An earlier study of a person with acquired aphantasia found something similar. Although the participant could no longer consciously generate ordinary voluntary object imagery, he could still perform some spatial transformations during mental-rotation tasks.[4]

This creates a useful possibility: you may be manipulating an internal representation without *seeing* it in the way you expected.

That is why the basketball is a better experiment than asking yourself to produce some generic “mental picture.”

## The Basketball

Take a real basketball if one is available and look at it for a minute.

Do not merely identify it as *basketball*. Inspect it. Notice the particular orange. Look at the small raised texture covering the surface. Follow one black channel and see how it curves around the sphere. Notice where channels intersect. Look at the highlight created by the room lighting and the darker side facing away from the light.

Pick it up. Feel the texture against your fingertips and palm. Notice its weight. Turn it slowly. Watch a black line disappear around one side and return from the other. Bounce it once and pay attention to the impact, the rebound, and the sound.

Now close your eyes.

Do not immediately judge the result. Ask what remains.

Can you see orange? Can you see a round edge? Do the black lines appear? Is there shading? Does it occupy a definite location? If there is no picture, can you nevertheless point toward where you imagine the ball to be?

Now rotate it and try to follow one black channel while the ball turns.

There are several possible experiences here. You might clearly see the line moving. You might get intermittent flashes. You might know where the line should be without seeing it. You might reason through the rotation almost mathematically.

All of those observations tell you something. They are not interchangeable, but neither does only one count as imagination.

## Strip Away the Surface

Now remove most of the basketball's detail.

Imagine a cube. It has no special texture and no meaningful history. It is simply a three-dimensional solid.

Give the front face one mark so that orientation can be tracked. Rotate the cube ninety degrees to the right. Tip it forward. Turn it upside down. Move it above your head. Bring it closer. Make it twice as large.

Then try a pyramid. Then a sphere.

Simple solids are useful because they reduce the amount of stored surface detail available from memory. They make spatial structure easier to isolate.

If the cube remains easy to manipulate while color and texture imagery are weak, spatial imagery may be doing more of the work. If you can produce richly detailed surfaces but have difficulty rotating the object, your profile may be different.

Research on imagery extremes supports taking these differences seriously. Studies have reported distinct object and spatial imagery profiles rather than one universal imagery ability.[1]

You do not need a diagnosis. You need better questions than one vague score for visualization.

## Imagination Is Not Only Visual

Natural imagination is usually multisensory.

Think again about the basketball. Vision may be only one part of the representation. You may be able to imagine the rough rubber against your hands, the hollow sound of a bounce in a gymnasium, the muscular movement involved in throwing it, or the pressure of catching it.

Research on aphantasia has found substantial variation here as well. Some people with weak visual imagery report relatively preserved imagery in sound, touch, movement, smell, or other modalities, while others report reduced imagery across several sensory systems. Large-sample work has identified both selectively visual and broader multisensory forms of aphantasia.[2]

So if a visual image remains weak, try the other channels rather than treating them as consolation prizes.

Imagine the ball dropping into your hands. Where do your fingers go? How heavy is it? What would happen if you pushed downward with your right hand? Imagine one bounce.

You may discover that motion, touch, sound, and spatial prediction are much more immediate than visual appearance.

That is information about the way your mind represents experience.

## Can Imagery Be Trained?

This is where the research becomes less tidy.

There are many visualization systems that assume repeated practice will make internal pictures brighter and more controllable. Individual reports—including my own experience—suggest that imagery can sometimes change substantially with practice.

Controlled studies give a more complicated answer.

In one experiment, participants practiced imagining colored visual patterns for about an hour a day across five consecutive days. Researchers measured imagery strength partly by how strongly a mental image influenced later binocular-rivalry perception. Training did not produce an overall increase in that measure of imagery strength. What did improve was **metacognition**: participants became better at knowing when their own imagery was relatively strong or weak.[5]

That finding is more interesting than it may initially sound. Practice may improve your ability to recognize and work with the imagery you actually have even when it does not simply turn up a global vividness knob.

Other training studies have found changes in more specific forms of imagery. For example, four weeks of training involving positive imagined future events increased the reported vividness of positive prospective imagery compared with a control condition in one study of older adults.[6]

These studies are not testing exactly the same thing. Five days imagining colored gratings is not the same intervention as weeks of emotionally meaningful future-event imagery, and neither is the same thing as months or years of informal visualization practice.

So the useful conclusion is not that imagery definitely can or cannot be trained. The evidence tells us that **different imagery abilities may respond differently to different forms of practice**.

That makes experimentation worthwhile without making the outcome a promise.

## Image Streaming

One visualization practice that became influential outside academic psychology is **Image Streaming**, developed and promoted by Win Wenger.

The basic procedure is unusual in one important way: instead of silently trying harder to produce a picture, the practitioner describes aloud whatever sensory impressions are present. Wenger recommended speaking to another person or into a recorder and describing emerging imagery in rapid, concrete sensory language—colors, shapes, textures, positions, motion, sound, touch, and other details.[7]

Weak impressions count. A smear of grey can be described. A line can be described. A texture can be described. An uncertain shape can be described before you know what it is.

The method shifts the job from **make a good picture** to **report what is actually happening**.

Wenger attached much larger theories and claims to Image Streaming, including claims about intelligence, creativity, subconscious processing, and how much of the brain is involved in different modes of thought.[7] Those claims require evidence of their own. They are not necessary in order to experiment with the underlying procedure.

The practical exercise is simpler: notice whatever sensory impression is present, describe it before judging it, and see what happens next.

That distinction mattered in my own practice.

## From Blackness to Form

When I normally close my eyes, I do not begin with vivid internal pictures. I usually see blackness.

At times there has been something more like grey fog or interference, as though something might be present behind darkness and haze. When I practiced imagery regularly—including Image Streaming and related exercises—I began noticing changes.

First there were vague shapes. Then forms that resembled line drawings: grey lines against a black background.

With more practice, the imagery could become considerably more detailed. At the strongest point of that practice, I sometimes saw detailed eyes that appeared three-dimensional, still grey against black rather than full-color pictures.

Something else happened that I found particularly interesting. When I realized too directly that an image was there—when attention seemed to grab it—the image would often fade. With practice, more images appeared, even though individual ones could remain fragile.

That is one person's experience, not a rule about what another person should see. But it gives us several questions that can actually be tested.

Does practice alter what appears? Do simple forms emerge before detailed forms? Does spontaneous imagery behave differently from deliberate imagery? What happens when attention turns directly toward a fragile image?

Those questions take us into a different kind of observation.

## Stop Making the Image

Up to this point, most of the exercises have been constructive. You tried to generate a basketball. You rotated solids. You deliberately added touch, color, motion, or sound.

Now stop.

Close your eyes and do not choose an object. Simply examine the visual field.

Calling it *blackness* may already be too simple. Look carefully. Is the darkness uniform? Is there grain? Grey haze? Tiny points? Movement? Faint patches? Lines? Color? Momentary flashes? Nothing you can distinguish at all?

None of these answers needs to become something else.

Visual experience with closed eyes can include elementary phenomena generated within the visual system. **Phosphenes**, for example, are perceptions of light without corresponding external light stimulation, and retinal dark noise and afterimages are also studied visual phenomena.[8]

That does not mean every point, pattern, haze, or internally generated image should be called a phosphene. It simply means that closing the eyes does not necessarily reduce visual experience to a perfectly empty black screen.

Observe before naming.

## When Noise Becomes an Image

There is an interesting boundary here.

Suppose you notice a grey patch. For several seconds it is just a patch. Then it seems to develop an edge. The edge suggests a curve. The curve begins to resemble something.

At what point did visual noise become an image?

Did you construct it deliberately? Did your brain recognize structure in ambiguous material? Did something spontaneous emerge? Can you even tell?

This is one of the most useful questions in the chapter because perception itself involves interpretation. Human vision is especially good at finding meaningful forms in incomplete information. Faces are a familiar example: relatively little structure can be enough for us to perceive eyes, mouths, or facial configurations.

That does not make a spontaneously appearing face meaningless. It tells us something about the machinery doing the seeing.

The useful question is not immediately **What does this image mean?**

First ask **How did it appear?**

## Voluntary and Involuntary Imagery

Researchers often distinguish voluntary imagery from imagery that arises without deliberate construction, but even *involuntary imagery* covers several different phenomena.

Dream imagery is not necessarily the same thing as spontaneous waking imagery. A visual afterimage is different again. Hypnagogic imagery at the edge of sleep may operate under different conditions from all of them.

This matters in aphantasia research because it has sometimes been assumed that people who lack voluntary imagery nevertheless retain involuntary imagery because many report visual dreams. A 2024 analysis argues that this is too broad and that different involuntary forms should be investigated separately rather than assumed to rise and fall together.[9]

The same principle works well as a personal experiment.

Do not use your ability to picture a basketball to predict what your dreams should look like. Do not use vivid dreams to assume that deliberate visualization should be easy. Do not assume that a spontaneous image appearing behind closed eyes is equivalent to deliberately constructing one.

Observe each ability on its own.

## The Image That Disappears

Fragile imagery creates one more puzzle.

Sometimes an image appears spontaneously and seems relatively stable until you recognize what is happening. Then the act of inspection appears to disturb it.

I experienced this repeatedly with the detailed grey imagery that began appearing during practice. The instant I thought something like *there it is*, it could vanish.

There are several possible ways to think about that, and at this point it is better not to choose one prematurely. Perhaps a fragile representation is disrupted when attention changes strategy. Perhaps naming and analyzing the image recruits processes different from those involved while it was forming. Perhaps the apparent pattern partly reflects memory and expectation.

Rather than deciding, test it.

When something begins to form, compare different kinds of attention. Look directly at it. Then, another time, allow it to remain near the center of awareness without mentally naming it. Try attending to the whole field instead of one detail. See whether any method changes how long the image remains.

You are no longer simply asking whether you can visualize. You are studying the conditions under which imagery forms, changes, and disappears.

## Toward the Edge

Eventually another variable begins changing everything: sleep.

As wakefulness gives way to sleep, imagery can become more spontaneous, thought can lose its ordinary logical structure, bodily sensation can change, and brief scenes or perceptual fragments may arise without deliberate construction.

That transition has its own name and its own research literature. Distinguishing two things is enough for tonight:

**the image you build**

and

**the image that arrives.**

Learning to recognize the difference gives us somewhere much more interesting to go.

## Summary

Mental imagery is not one simple ability. Object appearance, spatial transformation, movement, touch, sound, verbal knowledge, and conscious visual vividness can vary independently.

People with little or no voluntary visual imagery can still perform many spatial and reasoning tasks successfully, sometimes by using strategies that differ from those of vivid visualizers. Research therefore gives us good reason not to define imagination solely by the brightness of an internal picture.

Imagery training remains an open question rather than a settled promise. Some controlled work has found improvements in imagery-related metacognition without increases in general imagery strength, while other targeted training has increased vividness for particular kinds of imagery.

The most useful approach is observational.

Find out what you can deliberately construct. Find out what you can manipulate without seeing. Find out which sensory channels are strongest. Then stop constructing and observe what appears on its own.

## Experiment

Do this in two parts.

### Part One — Construct

Use a basketball if you have access to one.

Study it first. Examine its orange color, black channels, texture, curvature, highlights, weight, and movement.

Close your eyes and attempt to represent it.

Do not give yourself one score called *visualization ability*. Record the dimensions separately:

- color;
- surface detail;
- outline;
- depth;
- stability;
- spatial position;
- ability to rotate it;
- ability to alter its size;
- imagined touch;
- imagined weight;
- imagined sound;
- imagined motion.

Now repeat the spatial portion with a cube, sphere, and pyramid.

Rotate each one. Move it nearer and farther away. Tip it. Change its size.

Notice whether manipulating the object is easier or harder than seeing its surface.

### Part Two — Receive

Later, sit or lie comfortably and close your eyes.

Do not deliberately picture anything.

Observe the visual field for several minutes. Begin with literal description: black, grey, grain, points, haze, lines, shapes, color, movement, or nothing distinguishable.

If something begins forming, do not rush to identify it. Notice how structure develops.

If an image appears spontaneously, observe whether it feels as though you constructed it or discovered it.

Then experiment gently with attention. Does inspecting it closely strengthen it? Does it disappear? Does broad attention help it remain? Can you change it deliberately after it appears?

Record what happened without deciding in advance what *should* have happened.

Repeat the experiment on different days.

The interesting measurement is not whether your imagery becomes more impressive. It is whether you become better at observing how your own imagery works.

## Intention

**I observe what I can create, what I can move, and what appears on its own.**

## References

**[1]** Palermo, L., Boccia, M., Piccardi, L., & Nori, R. *Congenital lack and extraordinary ability in object and spatial imagery: An investigation on sub-types of aphantasia and hyperphantasia.* Consciousness and Cognition, 2022. https://pubmed.ncbi.nlm.nih.gov/35691243/

**[2]** Dawes, A. J., Keogh, R., & Pearson, J. *Multisensory subtypes of aphantasia: Mental imagery as supramodal perception in reverse.* Neuroscience Research, 2024. https://pubmed.ncbi.nlm.nih.gov/38029861/

**[3]** Kay, L., Keogh, R., & Pearson, J. *Slower but more accurate mental rotation performance in aphantasia linked to differences in cognitive strategies.* Consciousness and Cognition, 2024. https://pubmed.ncbi.nlm.nih.gov/38657474/

**[4]** Zhao, B., Della Sala, S., Zeman, A., & Gherri, E. *Spatial transformation in mental rotation tasks in aphantasia.* Psychonomic Bulletin & Review, 2022. https://pubmed.ncbi.nlm.nih.gov/35680760/

**[5]** Rademaker, R. L., & Pearson, J. *Training Visual Imagery: Improvements of Metacognition, but not Imagery Strength.* Frontiers in Psychology, 2012. https://pubmed.ncbi.nlm.nih.gov/22787452/

**[6]** Murphy, S. E., O'Donoghue, M. C., Drazich, E. H. S., Blackwell, S. E., Nobre, A. C., & Holmes, E. A. *Imagining a brighter future: the effect of positive imagery training on mood, prospective mental imagery and emotional bias in older adults.* Psychiatry Research, 2015. https://pubmed.ncbi.nlm.nih.gov/26235478/

**[7]** Wenger, W. *Image Streaming* and associated training materials, Win Wenger Archives. https://winwenger.com/resources/cps-techniques/image-streaming/

**[8]** Salari, V., Scholkmann, F., Vimal, R. L. P., Császár, N., Aslani, M., & Bókkon, I. *Phosphenes, retinal discrete dark noise, negative afterimages and retinogeniculate projections: A new explanatory framework based on endogenous ocular luminescence.* Progress in Retinal and Eye Research, 2017. https://pubmed.ncbi.nlm.nih.gov/28729002/

**[9]** Krempel, R., & Monzel, M. *Aphantasia and involuntary imagery.* Consciousness and Cognition, 2024. https://pubmed.ncbi.nlm.nih.gov/38564857/
`,Et="See the Image: Visualization, Mental Imagery and Hypnagogic Imagery",Ji="/visualization-hypnagogic-imagery/",Rt=Ji;let dn=null;function Ki(){return dn||(dn=S(Vi)),dn}const $i=`# Watch the Edge: Hypnagogia and the Transition Into Lucid Dreaming

Every night you cross a boundary that is surprisingly difficult to locate.

At one moment you are awake. Later, you are asleep. It is tempting to imagine a clean dividing line between the two, but sleep research gives us a more complicated picture. Sleep onset is a process in which different parts of waking experience change at different rates. Responsiveness to the outside world declines. Thoughts become less organized. Brain rhythms change. Muscle activity changes. Internally generated sensations and imagery may become more prominent. Yet some awareness can persist through portions of that transition.[1]

This makes the edge of sleep an unusually useful place to observe consciousness changing in real time.

You already know some of the skills needed for this. You have practiced relaxing the body without making relaxation itself the goal. You have practiced moving attention, holding it still, and noticing when attention wanders. You have deliberately constructed imagery and then stopped constructing it to see what appeared on its own.

Now add one new variable.

Let yourself fall asleep.

The experiment is not to make something unusual happen. Sleep onset is already happening. The interesting question is whether you can notice some of the changes while they occur.

## Falling Asleep Is a Process

Sleep laboratories usually classify sleep using physiological measurements such as EEG, eye movements, and muscle activity. Standard scoring systems divide sleep into stages, beginning with N1, the light transitional stage between wakefulness and more established non-REM sleep.

That classification is extremely useful, but subjective consciousness does not necessarily obey the boundary as neatly as a chart does.

A large systematic review of sleep onset found substantial variation in how researchers define the transition itself. Physiological, behavioral, and subjective markers do not always occur simultaneously. N1 in particular may behave less like a stable destination than a fluctuating period in which wake-like and sleep-like features coexist.[1]

That means the question **When did I fall asleep?** can have several answers.

When did you stop responding reliably to the room?

When did your thinking become dream-like?

When did you stop feeling the body clearly?

When did EEG activity meet a laboratory definition of sleep?

When did you stop knowing you were lying in bed?

Those moments may be close together, but they do not have to be identical.

For the purposes of observation, that ambiguity is useful. Instead of trying to identify one exact instant called *sleep*, watch the sequence.

## When Thought Changes Shape

The earliest sign may not be visual at all.

You might still feel awake while your thinking starts behaving differently.

Ordinary waking thought is often goal-directed. You are planning tomorrow, remembering something that happened, rehearsing a conversation, or deliberately following an idea. Near sleep onset, that organization can loosen.

One thought connects to another for no obvious reason. A sentence begins and loses its destination. A memory becomes mixed with something invented. You may briefly accept an absurd connection that would have seemed obviously strange a minute earlier.

Laboratory research on light sleep has found reports becoming more unrealistic and more prone to sudden leaps compared with waking thought.[2] Other sleep-onset research describes a gradual transformation of waking mentation into increasingly perceptual and dream-like experience.[3]

This gives you a marker that is easy to miss if you are waiting only for pictures.

Ask occasionally:

**Does my thinking still behave like waking thought?**

You do not need to answer in words every few seconds. The question is simply something to recognize.

Sometimes the first sign of the edge is not an image.

It is when thought stops explaining itself.

## When Imagery Stops Waiting for You

Earlier, we separated deliberate imagery from imagery that seemed to appear on its own. Sleep onset pushes much further in the second direction.

Researchers have repeatedly awakened people during the transition into sleep and asked what had just been happening in their experience. Reports include simple visual patterns, objects, landscapes, people, movement, sounds, and increasingly dream-like scenes.[3]

Fine-grained work by Hori, Hayashi, and colleagues divided the ordinary waking-to-sleep transition into more stages than the broad N1 category used in standard sleep scoring. When participants were awakened during different parts of that progression, the reported imagery changed along with EEG patterns. Certain landscape-like experiences appeared relatively early, while more dream-like images and people became more common later in the transition.[3]

This should not be turned into a rigid sequence that everyone must reproduce. The important observation is that **the character of imagery can change as sleep deepens**.

Something else makes these experiences especially interesting.

In a well-known fMRI study, researchers repeatedly awakened sleeping participants during the sleep-onset period and collected verbal reports of what they had just seen. Machine-learning models trained on brain responses to ordinary waking visual stimuli were able to identify categories of reported sleep imagery from patterns of activity in visual cortical areas.[4]

In other words, imagery arising around sleep onset is not merely a poetic metaphor for thought becoming dreamy. It can involve activity in neural systems that are also involved in waking visual perception.

That helps explain why a spontaneous sleep-onset image may feel different from deliberately trying to picture the basketball.

You may stop feeling like the person making an image.

The image simply happens.

## The Outside World Does Not Vanish All at Once

As internal experience becomes stronger, the external world generally becomes less effective at capturing attention.

Again, this appears to happen progressively.

Studies of behavioral responsiveness during sleep onset find increasing lapses and failures to respond as sleep deepens.[1] Experiments measuring brain responses to external tones also show changes when hypnagogic imagery is occurring.[5]

At the same time, brain imaging during drowsy eye closures has shown widespread co-activation in visual, auditory, and somatosensory cortices even while responsiveness to external stimulation is declining.[6]

That combination is fascinating.

The outside world is becoming less dominant, while internally generated sensory activity can remain rich.

Subjectively, this might feel like the room slowly losing priority.

You may still hear the fan.

Then the fan is simply part of the background.

Then perhaps there is an internal voice, sound, or scene that seems more important than the actual room.

Eventually you may no longer be comparing internal and external experience at all.

You are simply somewhere.

## Microdreams

Some sleep-onset experiences are so brief that calling them full dreams feels excessive.

Researcher Tore Nielsen has used the term **microdreams** for very short dream-like experiences occurring near the boundary between waking and sleep.[7]

A microdream might contain an image, movement, action, person, phrase, or miniature scene. It may last only long enough for something to happen before waking awareness returns.

Imagine that you are lying in bed thinking about nothing in particular.

Suddenly you are reaching for a cup on a kitchen counter.

Your hand touches it.

Then you realize that your actual hand has not moved.

You are back in bed.

For a moment, however, you were not deliberately imagining a kitchen. You had entered a tiny event.

This is an important transition from deliberate imagery.

A spontaneous image is something that appears.

A microdream can be something you are briefly **inside**.

The boundary is not always clear. That uncertainty is part of what makes sleep onset worth observing.

## Yesterday Can Leak Into the Edge

Hypnagogic imagery is not necessarily random.

One of the classic demonstrations came from studies in which people repeatedly played the computer game *Tetris*. Around sleep onset, participants began reporting stereotyped visual imagery related to falling game pieces. Remarkably, similar reports occurred in amnesic patients who could not consciously remember having played the game.[8]

Later experimental work likewise found that recent experience could influence images and sounds reported during daytime sleep onset.[9]

This phenomenon is sometimes discussed as part of the broader **day residue** of dreaming: material from waking experience reappearing in sleep-related mentation.

More recent work suggests the transformation is not necessarily a simple replay. Visual aspects of a recent experience can persist into hypnagogic imagery while emotional properties may change differently as sleep deepens.[10]

So if an image from your day suddenly appears, notice the connection without assuming it is a literal memory.

Sleep seems capable of taking pieces of waking experience and recombining them.

You may be watching that process begin.

## Sounds From Nowhere

Hypnagogia is not only visual.

People also report words, voices, music, noises, and other auditory experiences during sleep onset. Some are extremely brief: a name, a knock, a phrase, or a sound that seems clear enough to make you wonder whether it occurred in the room.

Research comparing hypnagogic verbal experiences with later REM dreams has found differences in their form. Sleep-onset verbal experiences can sometimes be short and direct rather than extended conversations.[3]

Again, the goal is not to produce them.

If sound appears, notice its character.

Did it seem spatially located?

Did it resemble your own inner speech?

Did it sound like somebody else?

Was it one word or an ongoing conversation?

Did it surprise you back into fuller wakefulness?

The same distinction applies.

There is a difference between **imagining a voice deliberately** and **hearing a voice-like event that appeared without being requested**.

Both are internal experiences.

They do not necessarily feel alike.

## The Body at the Edge

The body is changing too.

One of the most familiar sleep-onset events is the **hypnic jerk**, also called a sleep start: a sudden involuntary muscle contraction occurring around the transition into sleep. Hypnic jerks are widely described as benign sleep-wake transition phenomena, although their frequency and intensity vary.[11]

Sometimes the movement is accompanied by a sensation of falling or sudden loss of support.

You may also notice more gradual changes. The body's location can become less vivid. A limb may feel unusually heavy, light, large, small, distant, or difficult to place precisely. Movement may become something imagined rather than something actually performed.

These observations become important later because reports surrounding lucid dreams, sleep paralysis, contemplative sleep practices, and out-of-body experiences often include dramatic changes in bodily sensation.

We do not need to decide in advance what every sensation means.

First establish a simpler fact:

**your ordinary waking sense of the body is not perfectly constant while you fall asleep.**

Watch what changes.

## The Moment You Notice

There is a recurring problem with observing sleep onset.

You notice that something unusual is happening.

And the noticing wakes you up.

A scene was forming.

Then:

*Oh. I'm seeing it.*

Gone.

A thought had become dream-like.

Then:

*I'm falling asleep.*

You are awake again.

This resembles the fragile imagery from earlier, but now another factor is involved. Sleep itself is unstable at this boundary. Increasing alertness can move you back toward waking.

This makes the attentional work from **Quiet the Mind** particularly useful.

The skill is not intense concentration.

It is recognition without immediately turning recognition into activity.

You can know that something is happening without interrogating it.

You may eventually find a difference between:

**noticing**

and

**grabbing.**

That distinction is difficult to explain in advance. It is much easier to discover while doing it.

## Knowing You Are Falling Asleep

This is where the earlier dream work begins reconnecting with the body-and-attention work.

Lucid dreaming depends on recognizing a state that normally goes unquestioned. Meditation research uses the related concept of **meta-awareness** for noticing the current condition of one's own mind.

A 2024 study involving 635 participants found associations among frequent lucid dreaming, particular meditation practices, mindfulness characteristics, and meta-awareness. The results do not establish that meditation simply causes lucid dreams, but they strengthen the idea that awareness of one's current mental state is relevant to both practices.[12]

At the sleep edge, the experiment becomes unusually direct.

Can you recognize:

**thought is changing**

without fully waking?

Can you recognize:

**an image arrived**

without trying to control it?

Can you recognize:

**the room is fading**

while still remembering that you are lying there?

Even a few seconds of that recognition are interesting.

You are attempting to watch a transition that normally removes the watcher.

## Traditional Maps of Conscious Sleep

Scientific sleep research is not the first system to take an interest in maintaining awareness around sleep.

Indian and Tibetan contemplative traditions contain practices involving sleep, dreams, and continuity of awareness. The terms, goals, and philosophical frameworks differ substantially among traditions, so they should not be collapsed into one modern technique.

**Yoga Nidra**, for example, has multiple historical forms and modern adaptations. Contemporary clinical literature often uses the name for guided practices involving deep physical relaxation and continuing awareness. Modern studies have investigated Yoga Nidra for sleep quality, stress, and related outcomes, although protocols vary considerably and much of the clinical evidence remains methodologically heterogeneous.[13]

Indo-Tibetan dream and sleep yogas place dream awareness within a much larger contemplative system. In *The Tibetan Yogas of Dream and Sleep*, Tenzin Wangyal Rinpoche describes practices for cultivating awareness through waking, falling asleep, dreaming, and sleep itself. Within that tradition, maintaining awareness during these transitions serves contemplative purposes that go beyond simply producing lucid dreams.[14]

These traditional maps and modern sleep science ask different kinds of questions.

A sleep laboratory can measure EEG, muscle tone, eye movements, responsiveness, and brain activity.

A contemplative tradition may ask what happens to awareness itself and whether it can remain continuous through changing states.

Those approaches do not need to be forced into one explanation before either can be useful.

They can be compared through experience.

## Do Not Hold the Edge Still

There is a paradox here.

If you become fascinated by a hypnagogic image and try to freeze it, you may return toward waking.

If you monitor yourself every few seconds to ask whether you are asleep yet, you may remain too alert to see much of the transition.

So the skill is not to hold the edge still.

The edge moves.

Let it.

Your job is closer to riding alongside it for as long as awareness happens to remain.

Notice the first strange thought.

Notice when a picture seems to construct itself.

Notice when a sound appears.

Notice when the body feels different.

Notice when the room seems farther away.

And if you wake completely, nothing went wrong.

You have simply found the edge from the other side.

## Summary

Sleep onset is not one clean switch between waking and sleeping. Research describes a heterogeneous transition in which physiology, responsiveness, cognition, imagery, bodily experience, and subjective awareness change progressively and not always at the same rate.

Hypnagogic experience can include visual imagery, sounds, altered thought, bodily sensations, and extremely brief dream-like events. Recent waking experience can influence these contents, but the result may be transformed rather than replayed literally.

The practical skill developed in the previous chapters now becomes useful in a new environment. Relax the body. Allow attention to become quieter. Stop deliberately manufacturing imagery. Then observe what begins happening as sleep takes over more of the process.

You are no longer asking only what you can imagine.

You are watching what consciousness does while waking organization begins to loosen.

## Experiment

Practice this when you would ordinarily be going to sleep. If you start fighting sleep, let sleep win.

Begin with [**Relax the body**](/body-scan-meditation/#nighttime-body-release) if that is useful, then allow your breathing to continue naturally.

Do not deliberately construct an image.

Do not try to determine the exact instant you become asleep.

Instead, observe the transition.

Notice which channel changes first:

- thought;
- visual imagery;
- sound;
- body sensation;
- sense of movement;
- awareness of the room;
- sense of where you are.

If a thought becomes strange or discontinuous, notice it.

If imagery appears, notice whether you are watching an image or have briefly become part of a scene.

If a sound occurs, notice whether it seemed internal, external, or impossible to classify.

If the body changes, notice the quality of the change.

If you suddenly become more awake because you recognized what was happening, remember whatever came immediately before that recognition.

The next morning, write down the sequence rather than only the most dramatic event.

For example:

**ordinary thought → disconnected phrase → grey image → brief scene → recognized it → awake**

or:

**body heavy → room faded → falling sensation → jerk → awake**

Different nights may produce different sequences.

After several attempts, look for recurring transitions.

The goal is not to remain conscious all night.

The experiment is simpler:

**How much of the edge can you observe?**

## Intention

**I notice the transition as waking experience changes into sleep.**

## References

**[1]** D'Rozario, A. L., et al. *The neurophysiologic landscape of the sleep onset: a systematic review.* Sleep Medicine Reviews, 2023.

**[2]** Kjaer, T. W., Law, I., Wiltschiøtz, G., Paulson, O. B., & Madsen, P. L. *Regional cerebral blood flow during light sleep—a H2(15)O-PET study.* Journal of Sleep Research, 2002.

**[3]** Hori, T., Hayashi, M., & Morikawa, T. Sleep-onset EEG and hypnagogic imagery research, summarized in: Waters, F., et al. *The hypnagogic state: A brief update.* 2022.

**[4]** Horikawa, T., Tamaki, M., Miyawaki, Y., & Kamitani, Y. *Neural decoding of visual imagery during sleep.* Science, 2013.

**[5]** Michida, N., Hayashi, M., & Hori, T. *Effects of hypnagogic imagery on the event-related potential to external tone stimuli.* Sleep, 2005.

**[6]** Ong, J. L., et al. *Co-activated yet disconnected—Neural correlates of eye closures when trying to stay awake.* NeuroImage, 2015.

**[7]** Nielsen, T. *Microdream neurophenomenology.* Neuroscience of Consciousness, 2017.

**[8]** Stickgold, R., Malia, A., Maguire, D., Roddenberry, D., & O'Connor, M. *Replaying the game: hypnagogic images in normals and amnesics.* Science, 2000.

**[9]** Wamsley, E. J., et al. *Experience-dependent induction of hypnagogic images during daytime naps: a combined behavioural and EEG study.* Journal of Sleep Research, 2011.

**[10]** Picard-Deland, C., et al. *Imagetic and affective measures of memory reverberation diverge at sleep onset in association with theta rhythm.* 2022.

**[11]** Cuellar, N. G., Whisenant, D., & Stanton, M. P. *Hypnic Jerks: A Scoping Literature Review.* Sleep Medicine Clinics, 2015.

**[12]** Gerhardt, E., & Baird, B. *Frequent Lucid Dreaming Is Associated with Meditation Practice Styles, Meta-Awareness, and Trait Mindfulness.* Brain Sciences, 2024.

**[13]** Musto, S., & Vallerand, A. H. *Exploring the uses of yoga nidra: An integrative review.* Journal of Nursing Scholarship, 2023.

**[14]** Wangyal Rinpoche, T. *The Tibetan Yogas of Dream and Sleep.* Snow Lion.
`,Mt="Watch the Edge: Hypnagogia and the Transition Into Lucid Dreaming",Qi="/hypnagogia-lucid-dreaming/",Dt=Qi;let un=null;function Xi(){return un||(un=S($i)),un}const Zi=`# Let the Body Sleep: The “Mind Awake, Body Asleep” Route to Lucid Dreaming

There is a phrase that appears constantly in discussions of lucid dreaming, meditation, sleep paralysis, and out-of-body experience:

**mind awake, body asleep.**

It is a useful phrase as long as we do not mistake it for a precise description of physiology.

The sleeping body is not simply an awake body whose switch has been turned off. Muscle tone, voluntary movement, sensory processing, body position, vestibular information, dreaming, and conscious awareness are regulated through overlapping but partly separable systems. Sleep gives us several natural examples of those systems falling out of their ordinary waking arrangement.

During REM sleep, for example, the brain can be highly active while most skeletal muscles are strongly inhibited. During sleep paralysis, a person can be aware of the room while voluntary movement remains temporarily unavailable. During dreams, you may run, jump, fall, fly, or turn around even though your physical body performs none of those large movements.

That creates a useful question for us:

**What happens when the body you normally use as the center of experience stops behaving like a fixed reference point?**

## Movement and Awareness Are Not One System

While awake, movement feels simple.

You decide to raise your arm.

Your arm rises.

Because intention and movement occur so closely together, it is easy to experience them as one event.

They are not.

Motor commands have to be generated, routed through the nervous system, coordinated with posture and balance, and carried out by muscles. At the same time, sensory systems continuously inform the brain about the body's position, pressure against surfaces, movement of joints, tension in muscles, orientation relative to gravity, and internal bodily conditions.

Your ordinary sense of *having a body right here* depends on that stream of information being integrated successfully.

Sleep changes the arrangement.

REM sleep provides one of the clearest examples. It combines active brain states and vivid dreaming with a powerful reduction in ordinary skeletal muscle tone. Contemporary neuroscience links this atonia to brainstem circuits that recruit inhibitory pathways descending toward spinal motor neurons.[1][2]

You may dream of sprinting down a hallway while your physical legs remain almost completely still.

The movement in the dream is real as experience.

The corresponding large physical movement is suppressed.

That tells us something important before we go any further:

**felt movement and physical movement are not identical.**

## Why REM Has Atonia

REM sleep is sometimes called paradoxical sleep because several of its features seem contradictory.

The EEG can resemble an activated brain state.

Dreaming can be vivid.

The eyes make rapid movements.

Yet most postural muscles lose much of their normal tone.

Current models place an important part of this motor suppression in the brainstem. Glutamatergic neurons in the sublaterodorsal region of the pons activate inhibitory neurons farther down in the medulla and spinal pathways, reducing the activity of motor neurons that would otherwise activate skeletal muscles.[1][2]

The system is not absolute.

Small twitches can still occur.

Breathing continues.

Eye muscles remain active.

Some muscles involved in essential functions are regulated differently.

But the general effect is powerful enough that the actions of most dreams remain largely internal.

There is also a useful reverse case. In REM sleep behavior disorder, normal REM atonia is impaired and people can physically enact dream movements. That disorder gives sleep researchers another way to study how important the atonia system normally is.[3]

In ordinary REM sleep, however, imagined movement is largely separated from overt movement.

That separation is the next comparison: movement that is felt without matching physical action.

## When Awareness Returns Before Movement

Sleep paralysis gives us another variation.

A person becomes aware during the transition into or out of sleep but temporarily cannot perform ordinary voluntary movement.

The experience can be surprisingly clear.

You know where the bed is.

You may see the room.

You may know who you are.

You may be able to control your breathing or move the eyes.

But when you try to move an arm or sit up, nothing happens.

Contemporary sleep research generally interprets isolated sleep paralysis as a dissociated sleep-wake state involving REM-related muscle atonia together with waking or partly waking awareness.[4]

That does not mean every feature of a sleep-paralysis episode is completely explained. The experience can include imagery, sounds, pressure, sensed presence, floating, movement sensations, or other phenomena that deserve their own examination.

But paralysis itself establishes the central point dramatically:

**awareness can be present while ordinary voluntary movement is not.**

You do not need to experience sleep paralysis to learn from that fact.

## The Body You Feel

Close your eyes right now and locate your left hand without moving it.

You probably can.

How?

You are not visually examining it.

Instead, several sensory systems contribute to an internal representation of where the hand is.

**Proprioception** provides information about the position and movement of joints and muscles.

The **vestibular system** contributes information about head movement, orientation, balance, and gravity.

Touch tells you where the body contacts clothing, bedding, or furniture.

**Interoception** includes signals arising from inside the body, such as heartbeat, breathing, pressure, temperature, and other internal conditions.

Vision usually helps coordinate all of this while you are awake.

The resulting body experience feels so immediate that it is easy to forget it is being continuously constructed.

Usually that construction is remarkably stable.

Near sleep, it can become less so.

A hand that felt clearly located a minute ago may become vague.

The boundary between an arm and the mattress may become difficult to identify.

A limb may feel unusually heavy or strangely light.

The body may seem larger, smaller, stretched, tilted, distant, or incomplete.

You may feel perfectly ordinary.

Any of these results is useful.

The experiment is noticing that the felt body is an active representation rather than a permanent background object.

## Floating, Rocking, Falling, Spinning

One group of sleep-related experiences is particularly relevant here.

Researchers studying sleep paralysis have repeatedly identified a cluster of **vestibular-motor experiences**. These include sensations of floating, flying, spinning, falling, rocking, moving without physical movement, and changes in the apparent location of the self.[5]

These experiences are interesting because the vestibular system normally helps answer extremely basic questions:

Which way is up?

Am I moving?

Am I still?

Where is my head relative to gravity?

If the signals used to answer those questions are being integrated differently during a sleep transition, the resulting experience can become unusual very quickly.

Suppose you are lying completely still but suddenly feel as if you are rocking.

There is an immediate conflict.

Touch from the mattress says one thing.

The movement experience says another.

Which one does the brain trust?

Most of the time the contradiction disappears almost immediately as full waking orientation returns.

Sometimes it does not.

That is where things become especially interesting.

## Where Am I?

An out-of-body experience, in its basic descriptive sense, is an experience in which the apparent location of the self seems displaced from the physical body.

That definition describes the experience without deciding what ultimately causes it.

Someone may feel located near the ceiling.

They may experience rising out of bed.

They may feel as though they are standing somewhere else in the room.

Some reports include seeing the physical body from an external perspective; others involve only the strong feeling of being located elsewhere.

Scientific work on OBEs has examined vestibular processing, multisensory body representation, neurological conditions, sleep paralysis, lucid dreaming, and sleep-state transitions. A recent scoping review identified research spanning spontaneous experiences, deliberately attempted experiences, sleep-related episodes, and experimentally or neurologically associated cases.[6]

One proposed family of explanations involves disruption in the normal binding of visual, vestibular, proprioceptive, and body-location information. Sleep-paralysis research is especially interesting because vestibular-motor hallucinations and OBEs tend to cluster together.[5]

A 2024 theoretical model proposes another connection: some sleep-related OBEs may occur when awareness is maintained through unusual transitions involving REM sleep. The authors explicitly present this as a model requiring further testing, rather than a settled description of all OBEs.[7]

That is a good place to leave the question for now.

The experience is real as experience.

Its interpretation remains open to investigation.

## Someone Is Here

Sleep paralysis also produces a very different family of experiences.

Instead of feeling that *you* are moving, you may feel that **someone else is present**.

Research has repeatedly distinguished these “intruder” experiences from vestibular-motor experiences. The intruder cluster can include a sensed presence, footsteps, voices, figures, shadows, pressure, fear, or the conviction that another being is nearby.[8]

The distinction matters.

Floating and sensed presence can happen during the same episode, but they do not appear to be merely two descriptions of the same sensation.

Studies of their spatial qualities have even found systematic differences. Intruder experiences tend to be perceived nearby, often close to the body, while vestibular-motor experiences can involve movement far beyond the immediate surroundings.[9]

Across history and cultures, people have interpreted sensed-presence experiences in many different ways.

That history is worth studying.

But first observe the structure of the experience itself.

Was there an image?

A sound?

A feeling of proximity?

A bodily pressure?

Fear first?

Presence first?

Did you actually perceive a figure, or simply know that something was there?

These distinctions are more informative than immediately assigning the experience a cause.

## Fear Changes the Experience

Sleep paralysis can be frightening.

That fact is not incidental.

Older survey research found strong relationships among sensed presence, fear, and the elaboration of additional hallucination-like experiences during sleep paralysis.[10]

This makes sense at a basic level.

Imagine waking unable to move.

You do not yet know why.

The room is dark.

The body feels wrong.

A sound occurs.

The mind searches for an explanation.

Whatever interpretation appears first may shape what follows.

Fear can therefore become part of the phenomenon rather than merely a reaction afterward.

This is another place where the earlier attention training matters.

An unexpected sensation does not automatically require an immediate conclusion.

Notice first.

Interpret later.

## Can You Feel Movement Without Moving?

There is a simple experiment that exposes how flexible movement representation already is while completely awake.

Keep one hand still.

Imagine turning the palm upward.

Do not actually move it.

Now imagine closing the fingers.

Imagine reaching toward an object.

Imagine throwing a ball.

Something happened.

There was no overt movement, yet some representation of movement occurred.

This is usually called **motor imagery** or **kinesthetic imagery**, depending on what aspect is emphasized.

People vary greatly in how vivid it feels.

For one person it may be almost entirely conceptual.

For another, the imagined motion carries a surprisingly strong bodily sensation.

At the sleep edge, the difference between these experiences may become less obvious.

A movement can begin as imagination and then feel as if it happened.

A dream movement can feel entirely physical even though the physical body did not perform it.

A floating sensation can arrive without any deliberate imagery at all.

Those experiences deserve their own look rather than being forced into one label tonight.

## Conscious Entry Into Sleep

Contemplative traditions have also explored the possibility of reducing bodily activity while maintaining some degree of awareness.

Yoga Nidra is one important example, although the term covers multiple historical traditions and contemporary practices.

Modern forms often involve lying still while attention moves through body sensations, breathing, imagery, or guided stages of relaxation. Scientific studies have investigated Yoga Nidra as both a relaxation intervention and a possible unusual state around the boundary between waking and sleep.

The physiological findings are not yet simple.

One polysomnographic investigation reported patterns interpreted as **local sleep** during Yoga Nidra: sleep-like electrophysiological activity occurring in some brain regions while other patterns did not correspond neatly to ordinary global sleep.[11]

Other contemporary scholarship has connected Yoga Nidra with the broader Indo-Tibetan and yogic question of whether awareness can remain present through sleep onset or even portions of dreamless sleep. The proposal is scientifically intriguing but remains difficult to establish, especially because subjective reports of awareness must eventually be related to objective sleep-stage measurements.[12]

Clinical research on Yoga Nidra is also growing, including studies of sleep quality and insomnia, but recent systematic reviews continue to find substantial differences among protocols and methodological limitations in the available evidence.[13]

So there are several questions here rather than one conclusion.

Can the body become deeply relaxed while attention remains stable?

Can parts of the brain enter sleep-like activity while experience remains reportable?

Can awareness persist through conventional physiological sleep?

Where exactly would that awareness be measured?

Those are excellent experimental questions.

## Letting the Body Become Unimportant

There is a practical problem with all of this.

The more often you check whether your body is asleep, the more attention you give the body.

Try lying completely still and asking every ten seconds:

*Can I move yet?*

You probably remain very aware of your limbs.

The useful skill is almost the opposite.

Let the body become boring.

Feel the mattress.

Feel the weight.

Notice the hands.

Notice the feet.

Then stop checking them.

If a sensation appears, notice it.

If a limb seems to disappear from awareness, let it.

If you suddenly feel unusually heavy or light, observe that.

If nothing unusual happens, that is also information.

You are not trying to force paralysis.

You are observing what happens when ordinary bodily monitoring is allowed to fade.

## Do Not Confuse Stillness With Paralysis

It is worth making one distinction especially clear.

Choosing not to move is not sleep paralysis.

Deep relaxation is not REM atonia.

Imagining that the body is asleep does not prove that the brain has entered a particular sleep stage.

These experiences may feel related from the inside, but they are not physiologically interchangeable.

That distinction actually makes the experiment more interesting.

Instead of chasing a label, you can observe what specifically changes:

muscle effort;

touch;

body location;

movement intention;

imagined movement;

vestibular sensation;

awareness of the room;

awareness of the body.

Then compare.

## The Body Can Fade Before You Do

Eventually, if you lie still long enough while falling asleep, something subtle may happen.

The body stops being the most important thing in experience.

You are not necessarily paralyzed.

You may still be able to move instantly if you choose.

But attention is no longer continually confirming the body's boundaries.

There may be imagery.

There may be a scene.

There may be imagined movement.

There may simply be nothing remarkable except growing sleep.

What matters is the shift in reference.

During ordinary waking life, the body is usually the center around which experience is organized.

Near sleep, that organization becomes more flexible.

That is the doorway into our next question.

If the physical body is still...

**what does it mean to move?**

## Summary

The ordinary waking relationship among intention, physical movement, body sensation, self-location, and awareness can change substantially during sleep.

REM sleep normally suppresses most skeletal muscle activity even while vivid movement can occur in dreams. Sleep paralysis demonstrates that awareness can sometimes coexist with REM-related motor atonia. Vestibular-motor experiences show that sensations of movement, floating, spinning, or altered self-location can occur without corresponding large physical movements.

These phenomena should not all be treated as one state.

They provide different examples of the same broader lesson:

**the body you experience, the body you move, and the awareness observing both are related but not identical.**

The practical experiment is not to force sleep paralysis or an out-of-body experience.

It is to become more precise about what changes as the body becomes less dominant during sleep onset.

## Experiment

Practice while going to sleep normally.

Begin with [**Relax the body**](/body-scan-meditation/#nighttime-body-release) if useful.

Let your attention move briefly through the body.

Notice where your hands are.

Notice the feet.

Notice where the back meets the mattress.

Notice the weight of the head.

Then stop repeatedly checking.

Allow the body to become less interesting.

As sleep approaches, occasionally notice whether any of the following have changed:

- the clarity of your hands or feet;
- the apparent size of a limb;
- pressure against the mattress;
- heaviness or lightness;
- the sense of where your body ends;
- the apparent location of your head or body;
- rocking, floating, spinning, rising, or falling;
- imagined movement;
- actual voluntary movement;
- awareness of the room.

If you feel movement while physically still, notice the difference between the sensation and actual muscular movement.

If you become aware of being unable to move, first notice the state rather than immediately struggling against it. Observe what is present: body sensation, breathing, imagery, sound, location, emotion, and awareness.

Do not try to produce paralysis.

Do not remain awake simply to keep checking.

Let sleep proceed.

The next morning, record the sequence.

You might write:

**feet clear → hands vague → body heavy → imagined rolling → asleep**

or:

**body ordinary → image appeared → falling sensation → jerk → awake**

or simply:

**nothing unusual noticed → slept**

All three are useful observations.

The question is not whether something dramatic happened.

The question is:

**What happened to the body as waking control became less important?**

## Intention

**I let the body become quiet, and I notice what remains.**

## References

**[1]** Luppi, P.-H., et al. *Which structure generates paradoxical (REM) sleep: The brainstem, the hypothalamus, the amygdala or the cortex?* Sleep Medicine Reviews, 2024.

**[2]** Luppi, P.-H., et al. *Neuronal network controlling REM sleep.* 2024.

**[3]** Current reviews of REM sleep behavior disorder and REM sleep without atonia.

**[4]** Contemporary clinical reviews of recurrent isolated sleep paralysis and REM-wake dissociation.

**[5]** Cheyne, J. A., & Girard, T. A. *The body unbound: vestibular-motor hallucinations and out-of-body experiences.* Cortex, 2009.

**[6]** Moix, J., et al. *Out of body experiences: Scoping review.* Explore, 2025.

**[7]** Baird, B., et al. *Out-of-body experiences in relation to lucid dreaming and sleep paralysis: A theoretical review and conceptual model.* Neuroscience & Biobehavioral Reviews, 2024.

**[8]** Girard, T. A., & Cheyne, J. A. Research on vestibular-motor and intruder hallucinations associated with sleep paralysis.

**[9]** Cheyne, J. A., & Girard, T. A. *Spatial characteristics of hallucinations associated with sleep paralysis.* 2006.

**[10]** Cheyne, J. A., Newby-Clark, I. R., & Rueffer, S. D. *Relations among hypnagogic and hypnopompic experiences associated with sleep paralysis.* Journal of Sleep Research, 1999.

**[11]** Datta, K., et al. *Electrophysiological Evidence of Local Sleep During Yoga Nidra Practice.* Frontiers in Neurology, 2022.

**[12]** Datta, K., et al. *Conscious entry into sleep: Yoga Nidra and accessing subtler states of consciousness.* 2023.

**[13]** Recent systematic reviews of Yoga Nidra interventions for sleep and insomnia.
`,Ct="Let the Body Sleep: The “Mind Awake, Body Asleep” Route to Lucid Dreaming",eo="/mind-awake-body-asleep/",Nt=eo;let mn=null;function no(){return mn||(mn=S(Zi)),mn}const to=`# Move Without Moving: Motor Imagery, Dream Movement and Sleep-Onset Practice

Raise one hand.

Turn the palm upward.

Close the fingers.

Now put the hand back where it was.

Do the same thing again, but this time do not move.

Imagine turning the palm upward.

Imagine the fingers closing.

Something still happened.

Your physical hand remained still, yet some representation of movement occurred. Perhaps you saw the hand turning. Perhaps you felt the movement faintly through the wrist and fingers. Perhaps there was no sensory experience at all and you simply knew the sequence.

This difference matters.

We examined what happens when the physical body becomes less dominant during sleep. Now we can ask the next question:

**What exactly is moving when movement is experienced without overt movement?**

The answer is more complicated than “the brain thinks you moved.”

Movement can be planned, represented, visually imagined, kinesthetically imagined, felt as self-motion, dreamed, or physically executed. Those processes overlap, but they are not interchangeable.

Learning to distinguish them gives us another way to study the boundary between waking imagination and dream experience.

## Movement Begins Before Motion

Physical movement does not begin when a muscle visibly contracts.

Before the hand rises, the nervous system has already selected an action, organized a sequence, predicted some of its consequences, and coordinated the movement with the body's current position.

Motor control therefore includes more than the final physical act.

This helps explain why you can rehearse an action internally.

**Motor imagery** usually refers to mentally simulating an action without overtly performing it. Researchers study it in sports, rehabilitation, skill learning, brain-computer interfaces, and basic neuroscience.

For many years, one influential idea was that motor imagery closely reproduces the neural processes involved in actually performing the movement, with the final physical output withheld.

There is substantial evidence for overlap between imagined and executed movement.

But newer research suggests that simple equivalence is too strong.

A large meta-analysis comparing hundreds of neuroimaging studies found that motor imagery also relies heavily on frontal and parietal systems associated with working memory and executive processing. Depending on how the comparison was performed, motor imagery overlapped with those cognitive networks at least as strongly as it overlapped with actual movement execution.[1]

Imagining movement therefore appears to be an active construction.

You are not merely sending a normal movement command and stopping it at the last second.

You are maintaining and organizing an internal action.

## Seeing Movement and Feeling Movement

There are several ways to imagine the same action.

Imagine reaching for a glass.

You might see yourself doing it from outside, almost like watching a movie.

That is one form of **visual motor imagery**.

You might instead imagine the view through your own eyes as your arm moves toward the glass.

That is another visual perspective.

Or you might concentrate on the feeling of the movement itself: the shoulder beginning to rotate, the elbow extending, the weight of the arm shifting, the fingers preparing to open.

That is closer to **kinesthetic motor imagery**.

The distinction is important because visual and kinesthetic imagery can respond differently to experience.

In one 2025 experiment, researchers trained people either by physically practicing hand-gesture sequences without vision or by watching the movements. Physical practice later improved subjective kinesthetic imagery, while observational practice improved visual imagery.[2]

What you have actually *done* with your body may therefore shape the kind of movement you can later represent internally.

This gives us a very simple way to study motor imagery:

move first;

then remember the movement.

## Move Once, Then Remember the Movement

Slowly turn your right hand from palm down to palm up.

Do it again.

Pay attention to more than the appearance.

Notice the sensation around the wrist.

Notice whether the forearm rotates.

Notice where the fingertips travel.

Notice changes in pressure where the arm contacts a surface.

Notice the beginning and end of the movement.

Now stop.

Keep the physical hand still.

Reproduce the movement internally.

Do not worry about whether you can see it.

Ask instead:

Can you feel the rotation?

Can you anticipate the final position?

Do you sense the fingers changing orientation?

Does the imagined movement have speed?

Does it have effort?

Could you stop halfway?

Could you reverse it?

These are different questions from the basketball exercise.

There we were interested in the representation of an object.

Here the object is your own moving body.

## The Imagined Body

Now increase the scale.

Imagine raising your arm.

Imagine bending one knee.

Imagine rolling onto your left side.

Imagine sitting upright.

Imagine standing from a chair.

Do not actually perform the movements.

Notice what your mind supplies.

For some movements you may see a body.

For others there may be a strong kinesthetic sensation.

For others there may simply be a sequence of locations:

lying down;

turning;

sitting;

standing.

People differ considerably in how action imagery is represented. Visual imagery, kinesthetic imagery, proprioceptive expectation, spatial knowledge, and verbal strategies can all contribute.

This connects directly to the earlier discussion of aphantasia.

Weak visual imagery does not automatically mean that every other representation of action is absent. Visual and kinesthetic imagery can dissociate. At the same time, studies also indicate substantial individual variation, so kinesthetic imagery should not be assumed to remain intact in everyone whose visual imagery is weak.

Again, one label hides several abilities.

Instead of asking:

**Can I imagine myself moving?**

ask:

**What part of the movement can I represent?**

## Imagined Movement Is Not Fake Movement

There is an odd tendency to call physical movement *real* and imagined movement *not real*.

That wording becomes confusing very quickly.

If you imagine lifting your hand, the physical hand did not rise.

That is straightforward.

But the imagining itself still occurred.

It required attention, representation, memory, prediction, and perhaps visual or bodily sensation.

Neuroscience consistently finds that motor imagery recruits organized brain activity rather than doing nothing.[1]

The important distinction is therefore not:

**real movement versus fake movement.**

It is:

**overt physical movement versus internally represented movement.**

Both are real events.

Only one moves the hand across the room.

## When the World Makes You Feel Movement

There is another useful comparison.

You can sometimes feel yourself moving even when you are physically stationary.

Researchers call this **vection**: an illusion of self-motion in the absence of corresponding physical movement through space.[3]

A familiar example occurs on a stationary train.

The train beside you begins moving.

For a moment, you feel as though your own train has started rolling.

Nothing in your deliberate imagination created that sensation.

Your perceptual system inferred movement from the available sensory evidence.

Vection can be induced in laboratories using moving visual fields and virtual environments. Researchers measure whether it occurs, how long it takes to begin, how long it lasts, and how intense the self-motion feels.[3]

The phenomenon is also multisensory. Visual information is powerful, but auditory, tactile, biomechanical, and vestibular cues can contribute to perceived self-motion.[4]

This gives us another important distinction.

You can:

physically move;

deliberately imagine movement;

or experience movement because the brain inferred self-motion from sensory information.

Those are already three different ways to “move.”

Sleep adds more.

## Rocking While Still

Think back to that loss of physical dominance.

Near sleep, some people report rocking, floating, sinking, turning, rising, or falling while their physical body remains still.

These experiences can resemble deliberate motor imagery, but they often differ in one crucial way:

they were not requested.

You did not think:

*Now I will imagine rocking.*

The rocking arrived.

That places it closer to the distinction we made with visual imagery.

There is:

**movement you construct**

and

**movement that appears.**

Sometimes the difference is obvious.

Sometimes it is not.

You may begin by deliberately imagining that you are rolling over and then, somewhere in the transition toward sleep, the movement starts to feel self-sustaining.

At first:

**I am imagining myself turning.**

Later:

**I am turning.**

The physical body may not have changed position at all.

What changed was the relationship between intention and experience.

## The Borderlands of Action

Research on sleep onset gives us evidence that movement imagery becomes increasingly important as reflective waking thought declines.

In one study, researchers awakened participants at different physiologically monitored points during sleep onset and analyzed their reports. As the transition progressed, reflective thinking decreased while **motor imagery increased**. Participants increasingly described interaction with internally generated scenes rather than merely thinking about them.[5]

This is a remarkable change.

During ordinary waking imagination, you may think:

*I am imagining walking.*

Closer to dreaming, the reflective commentary becomes weaker.

There may simply be:

walking.

The imagined world no longer needs the sentence explaining that it is imagined.

That may be one of the most important transitions in this guide.

## From Movement Imagery to a Microdream

Suppose you are lying in bed.

You deliberately imagine taking three steps.

You feel almost nothing.

You try again.

The first step is conceptual.

The second has a faint sense of motion.

Then you lose the thread.

A moment later you are walking toward a door somewhere else.

For several seconds there is no effort to generate the experience.

Then you realize:

*I was just walking.*

And the scene disappears.

Where did motor imagery end and the microdream begin?

There may not be a clean answer.

That boundary is exactly what you are learning to observe.

The useful question is not whether the experience meets a perfect category.

Ask:

**When did I stop directing it?**

## Movement Without a Visible Body

Another interesting possibility is movement without a clearly represented body.

You may feel yourself moving forward without seeing legs.

You may feel rising without seeing a torso.

You may turn without any visible room rotating around you.

This is not as strange as it initially sounds.

Ordinary self-motion perception already combines vestibular information, visual motion, proprioception, touch, and expectations about where the body is located.[4]

A complete visual model of the body is not always necessary for the sensation of motion.

This becomes useful later when examining experiences described as floating, separating, rolling out, rising, or traveling.

Before attaching an interpretation, ask something simpler:

Was there a visible body?

Was there only motion?

Was there a viewpoint moving through space?

Was there simply a change in location?

Those are different experiences.

## What Is Actually Moving?

The phrase **I moved** can hide several possibilities.

The physical body moved.

The imagined body moved.

Your visual viewpoint moved.

Your apparent location moved.

You felt acceleration without location changing.

A dream character representing you moved.

A scene changed while you remained apparently stationary.

These differences matter because later experiences can become very convincing.

Suppose you feel yourself rise upward from bed.

It may be tempting to jump immediately from experience to explanation.

Instead ask:

What precisely changed?

Did the mattress disappear?

Did your apparent viewpoint rise?

Did you feel acceleration?

Did you see the room?

Did you see your body?

Did the movement begin deliberately?

Could you stop it?

Did it become a dream scene?

Good phenomenology keeps the question open longer.

## Training Kinesthetic Resolution

We learned not to score imagery only by brightness.

The same principle applies here.

Do not rate motor imagery only as:

good;

bad.

Instead inspect dimensions.

How clearly can you represent:

direction;

speed;

effort;

joint position;

weight;

balance;

acceleration;

contact;

sequence;

start and stop;

whole-body orientation?

A movement may be visually poor but kinesthetically strong.

Another may be spatially clear but have no sense of effort.

Another may simply be known.

That gives you a much better baseline for noticing later changes near sleep.

## Practice Changes Representation

Motor imagery is trainable in at least some respects, but the effect depends on the practice and the measure used.

As noted earlier, physical and observational practice appear to strengthen different dimensions of imagery.[2]

That result also warns us against making imagery too abstract.

If you want to study the internal experience of rolling onto your side, actually roll onto your side first.

Pay attention.

Then return to your original position and imagine the same movement.

If you want to study sitting up, sit up physically.

Then rehearse it internally.

Real movement supplies information.

The experiment is what remains when the physical action stops.

## Do Not Turn This Into a Struggle

There is one practical trap.

People sometimes try so hard to create a convincing internal movement that they tense the physical body.

That defeats the comparison.

The useful question is not:

**Can I make the imagined movement incredibly powerful?**

It is:

**Can I tell what my body is doing and what my representation of the body is doing?**

If the physical shoulder tightens while you imagine rolling, notice that.

Reduce the effort.

If nothing kinesthetic appears, do not force it.

Use what is available.

Visualize.

Know the sequence.

Remember the physical movement.

Then observe.

The ability to distinguish subtle differences is more useful here than intensity.

## When Movement Takes Over

Eventually you may encounter an experience that no longer feels like motor imagery at all.

You are walking.

Turning.

Falling.

Floating.

Reaching.

Running.

Perhaps you remember that the physical body is lying in bed.

Perhaps you do not.

This is where deliberate motor imagery begins connecting with dreams, lucid dreams, sleep-related self-motion, and later out-of-body-style experiences.

The important skill is already familiar:

notice the transition.

You began by learning to deliberately move attention.

Then you learned to hold it still.

By now you can tell a constructed image from one that appears, and you have watched thought and the felt body loosen near sleep. The next comparison is simpler: **movement itself no longer requiring physical motion**.

## Summary

Movement is not one event.

Physical execution, movement planning, visual motor imagery, kinesthetic imagery, illusory self-motion, sleep-onset movement, and dream movement overlap but are not identical.

Motor imagery recruits systems involved in action representation as well as substantial cognitive-control and working-memory processes. Visual and kinesthetic imagery can also respond differently to prior physical and observational experience.

Ordinary perception already demonstrates that convincing self-motion can occur while the physical body remains stationary. Sleep onset takes this separation further: reflective waking thought tends to decrease while internally experienced action and motor imagery can increase.

The practical goal is therefore not to pretend that imagined movement equals physical movement.

It is to become precise about how internally represented movement feels before sleep begins changing the relationship.

## Experiment

Do this in three parts.

### Part One — Move, Then Remember

Choose a simple movement.

Turn one hand from palm down to palm up.

Perform it slowly several times.

Notice:

- joint position;
- muscle tension;
- direction;
- speed;
- pressure;
- beginning;
- midpoint;
- endpoint.

Then keep the hand physically still.

Reproduce the movement internally.

Ask:

Did I see it?

Did I feel it?

Did I simply know the movement?

Could I stop halfway?

Could I reverse it?

Could I change its speed?

Repeat with another simple movement.

### Part Two — Move the Whole Body Without Moving

Lie or sit comfortably.

Remain physically still.

Imagine:

rolling onto your side;

sitting upright;

standing;

taking three steps;

turning around.

For each movement, notice the dominant representation.

Is it:

visual;

kinesthetic;

vestibular;

spatial;

conceptual;

or mixed?

Do not try to make the experience dramatic.

Notice its structure.

### Part Three — Stop Directing

When going to sleep normally, let deliberate movement imagery go.

Do not continue rehearsing movements indefinitely.

Watch what happens naturally.

If movement appears—rocking, floating, falling, turning, walking, reaching, or something else—notice whether you can identify a change from:

**I am imagining movement**

to

**movement is happening.**

If the movement becomes part of a scene, notice whether there was a moment when you stopped directing the action.

If nothing happens, sleep.

The next morning, record the sequence as precisely as possible.

For example:

**imagined rolling → faint body sensation → lost awareness → dream of walking**

or:

**body still → spontaneous rocking → noticed it → woke**

or:

**motor imagery stayed conceptual → slept**

All are useful.

The central question is:

**What moved, and when did I stop making it move?**

## Intention

**I notice the difference between moving, imagining movement, and movement that arises on its own.**

## References

**[1]** *Greater neural overlap between motor imagery and working memory than with movement execution: A meta-analytic comparison.* 2026.

**[2]** Peters, C. M., Scott, M. W., Jin, R., Ma, M., Kraeutner, S. N., & Hodges, N. J. *Evidence for the dependence of visual and kinesthetic motor imagery on isolated visual and motor practice.* Consciousness and Cognition, 2025.

**[3]** Kooijman, L., Berti, S., Asadi, H., Nahavandi, S., & Keshavarz, B. *Measuring vection: a review and critical evaluation of different methods for quantifying illusory self-motion.* Behavior Research Methods, 2024.

**[4]** Riecke, B. E., Murovec, B., Campos, J. L., & Keshavarz, B. *Beyond the Eye: Multisensory Contributions to the Sensation of Illusory Self-Motion (Vection).* 2023.

**[5]** Speth, J., Frenzel, C., & Voss, U. *The borderlands of waking: Quantifying the transition from reflective thought to hallucination in sleep onset.* Consciousness and Cognition, 2016.
`,Ot="Move Without Moving: Motor Imagery, Dream Movement and Sleep-Onset Practice",ao="/motor-imagery-lucid-dreaming/",Pt=ao;let pn=null;function io(){return pn||(pn=S(to)),pn}const oo=`# Feel the Shift: Vibrations, Floating and Out-of-Body Sensations Near Sleep

There may be a moment, somewhere between lying in bed and finding yourself fully inside a dream, when the ordinary relationship between you and your body begins to change.

That sentence can sound more mysterious than it needs to.

Perhaps your hands seem unusually large or strangely distant. Perhaps the bed feels as if it has tilted even though nothing moved. You may feel heavy, light, stretched, compressed, floating, rocking, falling, spinning, or gently turning. Sometimes a vibration or buzzing sensation appears. Sometimes there is no dramatic sensation at all. The physical body simply becomes less important while another scene grows clearer.

People exploring lucid dreaming, sleep paralysis, meditation, hypnagogia, and out-of-body experience have described variations of these events for a long time. Different traditions explain them differently. Some speak of an astral or subtle body. Some describe consciousness separating from the physical body. Sleep researchers may instead discuss vestibular sensations, dream imagery, REM-related phenomena, multisensory integration, or changes in the brain's representation of the body.

We do not have to settle that argument tonight.

There is a more immediate question we can actually investigate:

**Which part of the bodily self shifts first?**

That turns out to be a surprisingly complicated question, because neuroscience does not treat the ordinary feeling of *being here in my body* as a single thing.

Researchers studying bodily self-consciousness commonly distinguish several related experiences. **Body ownership** is the feeling that this body belongs to me. **Self-location** is the feeling of where *I* am located. **First-person perspective** is the position from which the world seems to be perceived. **Agency** is the feeling that I am causing an action. Researchers also study body image and the brain's continuously updated representation of the body's position, shape, and possibilities for movement. These components usually cooperate so smoothly that we experience one ordinary embodied self. Experiments and neurological observations show, however, that they can be altered somewhat independently.

That gives us a different way to approach unusual sleep-edge experiences.

Instead of asking only, **Did I leave my body?**, we can first ask what actually changed.

Did the body feel different?

Did you feel movement even though the physical body remained still?

Did the place from which you seemed to be observing move?

Did your sense of where *you* were located change?

Did another body seem to replace the physical one?

Or did the body remain perfectly ordinary until it simply stopped occupying much of your attention?

Those are not necessarily the same event.

## The body your brain keeps building

The body we experience is not merely the body as measured by a ruler.

Your nervous system is constantly combining information from vision, touch, proprioception, balance, movement, and signals arising inside the body. From that changing stream of information it maintains a remarkably stable answer to several questions: Where is my body? Which sensations belong to it? Which movements am I making? Where am I looking from? Where am *I*?

Laboratory body-illusion experiments demonstrate how flexible this construction can be. When visual, tactile, or movement information is manipulated carefully, people can experience changes in ownership toward a rubber hand, virtual body, or other representation. Conflicting sensory information can also alter aspects of body schema and perceived bodily location. Modern research continues to support multisensory integration as a central part of body ownership and the larger bodily sense of self.

None of this proves that every unusual sleep experience is an illusion.

It tells us something more useful: **the feeling of being located inside a particular body is an active process.**

And active processes can change.

Sleep provides especially unusual conditions for that process. Vision of the physical room may disappear. Voluntary movement decreases. External sensory information becomes less dominant. Internally generated images and sensations can become increasingly vivid. The vestibular system—the network involved in balance, orientation, acceleration, and the position of the head and body in space—is especially relevant because vestibular information contributes to self-location and first-person perspective.

So when someone drifting toward sleep reports floating upward, falling through the mattress, rotating, rolling, rocking, or moving without physically moving, we do not need to dismiss the report because the physical body remained in bed.

They experienced movement.

The unresolved question is what kind of event that movement represents.

## The famous vibrations

If you spend enough time reading out-of-body literature, sooner or later you meet **the vibrations**.

Accounts vary enormously. People describe buzzing, humming, electrical sensations, waves, trembling, roaring, pulsing, static, or an internal vibration that seems to involve the entire body. Some traditions treat these sensations as an important transitional stage.

I recognize part of that vocabulary from my own attention practice. Long before trying to classify it scientifically, I described the sensations I could produce or amplify through focused bodily attention as something like soft vibrating electricity—fuzzy, tingling, occasionally spark-like. That experience is real in the modest but important sense that it is something I can feel.

Its explanation is another matter.

Hypnagogia—the transitional territory around sleep onset—can include vivid sensory experiences, including bodily sensations, imagery, sounds, and alterations in ordinary perception. The literature does not establish one universal vibration that marks a specific metaphysical transition.

That distinction matters because expectation is powerful.

If you have been told that a violent electrical surge must occur before an out-of-body experience, you may spend nights waiting for one. Then a quiet transition happens and you miss it because nothing matched the story.

Or you experience a spectacular buzzing sensation and immediately decide that something profound must be happening.

Maybe it is.

But intensity is not the same thing as information.

**Drama is not depth.**

A subtle shift in self-location may tell you more about what is changing than an enormous burst of sensation.

## Movement without movement

We practiced intentional movement while the physical body remained still. Here we begin listening for movement that appears on its own.

Reports associated with sleep transitions and sleep paralysis include floating, flying, falling, rotation, illusory locomotion, and other vestibular-motor experiences. Researchers have repeatedly found that these experiences form a recognizable cluster, and out-of-body experiences can occur within the same family of altered bodily and spatial sensations.

The interesting part is that movement can change before everything else does.

Imagine lying in bed with your ordinary sense of the room still mostly intact. Your body feels approximately where it should be. Then you distinctly feel yourself rocking.

Nothing physical rocks.

A few moments later you feel as if you are rotating slightly.

Then perhaps the location of *you* starts to become ambiguous.

That sequence is different from immediately seeing yourself from above. It suggests that the vestibular-motor layer changed first.

Another night might unfold differently:

Your body becomes extremely heavy.

Your hands fade from awareness.

A scene begins appearing behind closed eyes.

The scene becomes spatial rather than merely visual.

Then, almost without noticing when it happened, you are looking *from inside it*.

There was no vibration.

No floating.

No dramatic separation.

And yet the relationship among body, location, and perspective changed substantially.

That is exactly why we are beginning to track sequences rather than collecting a checklist of supposedly required signs.

## Where are you?

Self-location is one of the strangest pieces of the puzzle because under ordinary conditions we rarely notice it.

Where are *you* right now?

The obvious answer seems to be: here.

But where exactly is *here*?

Behind your eyes?

Inside your head?

Throughout the body?

Somewhere around the chest?

The question becomes less silly when that ordinary certainty shifts.

Studies of bodily self-consciousness distinguish the location attributed to the self from ownership of the physical body and from first-person visual perspective. Experimental manipulations and neurological observations can alter these relationships, which is one reason out-of-body phenomena have become scientifically interesting rather than remaining only philosophical or occult questions.

An experience therefore does not need to begin with seeing your physical body from somewhere else.

A change in location may be much quieter.

You may simply feel slightly above where you expected to be.

Or beside yourself.

Or extended beyond the normal boundaries of the body.

Or centered in an emerging dream environment while physical bodily sensations continue faintly in the background.

This gives us another useful distinction:

**Where does the body seem to be, and where do you seem to be?**

For most waking life those answers coincide.

At the sleep edge, perhaps they do not always have to.

## Perspective can move too

Self-location and perspective are closely related, but they are not identical.

You can imagine looking at yourself from across the room while still feeling located inside your body. That is a change in imagined perspective without a corresponding change in self-location.

A stronger transition might involve the felt center of perception moving with the viewpoint.

This becomes particularly interesting as imagery becomes more immersive.

Earlier chapters treated hypnagogic images as something to notice without chasing. Then we practiced allowing the body to recede and producing movement internally. Eventually an image may cease to feel like a picture being watched from bed.

It becomes somewhere.

Instead of seeing a hallway, you are looking **down** the hallway.

Instead of imagining a room, objects have spatial relationships around you.

Instead of constructing the scene deliberately, you discover yourself already occupying it.

At that point asking whether you are entering a lucid dream, an out-of-body experience, or another altered state may be less useful than first noticing the transition itself.

What changed first?

The image?

The body?

Your location?

The viewpoint?

The sense of movement?

## Ownership: does this still feel like my body?

Body ownership asks a different question.

Even if your perspective or location seems to change, the physical body may continue to feel completely yours.

Conversely, body ownership itself can become strange.

A hand can feel enormous, distant, numb, misplaced, duplicated, or difficult to locate. The body's apparent proportions may distort. Dream bodies can appear that do not correspond exactly to waking anatomy. Experimental research shows that body ownership is sensitive to the consistency of visual, tactile, proprioceptive, and motor information, and recent work continues to show that ownership and other components of bodily self-consciousness interact without simply collapsing into one process.

This helps us avoid a common conceptual shortcut.

Feeling detached from the physical body does not automatically mean that self-location has moved somewhere else.

Feeling located somewhere else does not automatically mean that ownership of the physical body disappeared.

Feeling another body does not by itself establish what that body is.

The experience and the explanation remain separate.

A traditional subtle-body model may interpret this as awareness transferring into another vehicle.

A lucid-dream model may interpret it as an emerging dream body.

A neuroscience model may emphasize changing multisensory body representation.

These models ask overlapping questions, but they are not interchangeable conclusions.

We can use the experience as data before deciding which map explains it best.

## The person who may or may not be in the room

Another phenomenon deserves its own category because it is easy to mix it together with bodily transitions: **felt presence**.

A felt presence is the compelling impression that another person or entity is nearby despite inadequate ordinary sensory evidence. It has been reported in sleep paralysis, neurological conditions, extreme endurance situations, bereavement, spiritual practice, and other circumstances. Modern reviews treat it as an important phenomenon in its own right rather than reducing every occurrence to the same explanation.

Sleep-paralysis research is particularly useful here because it has historically distinguished **intruder** experiences—presence, fear, visual or auditory impressions of another being—from **vestibular-motor** experiences such as floating, flying, movement, and out-of-body sensations. These categories can occur together, but research has found reasons to treat them as distinguishable patterns.

So if you feel yourself floating and simultaneously sense someone standing beside the bed, record both.

Do not automatically turn them into one event.

**Movement:** floating upward.

**Presence:** someone seems nearby.

**Emotion:** fear.

Those are observations.

“An entity pulled me from my body” is already an interpretation.

Maybe that interpretation will eventually deserve serious consideration. But first preserve what actually happened.

The distinction becomes especially valuable because fear can rapidly organize ambiguous experiences into a story. A presence feels threatening; then every unusual sensation becomes evidence of the threat.

Curiosity gives us another option.

What happened first?

## Sometimes almost nothing happens

The quiet transition may be the easiest one to overlook.

Imagine noticing the breath.

Then the body becomes less distinct.

You are not numb exactly. Nothing dramatic happens. You simply stop receiving—or stop attending strongly to—the usual stream of bodily information.

Thoughts become looser.

Images become more autonomous.

A place begins to form.

And suddenly you realize that the bed is no longer the center of experience.

That deserves just as much attention as vibrating violently or feeling yourself shoot through a ceiling.

Perhaps more.

If the purpose of this experiment is to learn how consciousness reorganizes around sleep, then spectacular effects are not the goal.

Recognition is.

We are learning the grammar of transition.

## Find your sequence

A single strange night gives us a story.

Several nights may begin giving us a pattern.

Suppose your notes repeatedly look like this:

**hands become clear → body becomes heavy → buzzing → rocking → viewpoint shifts → scene forms**

Someone else's sequence might be:

**body fades → fragments of imagery → room disappears → dream body appears**

Another person might record:

**falling sensation → fear → wake up**

And another:

**nothing noticeable → suddenly lucid inside a dream**

None of these needs to be declared superior.

The useful discovery is that the transition may have structure.

Once you know the early pieces of your own sequence, later chapters can ask whether you can remain calm enough to recognize when the threshold is approaching.

That is different from memorizing somebody else's signs.

It is learning your door.

## Summary

The ordinary sense of being a self inside a body is composed of several cooperating processes rather than one indivisible sensation. Research distinguishes body ownership, agency, self-location, first-person perspective, and representations of the body's position and form. These usually align, but experiments, neurological conditions, dream states, and sleep-transition experiences show that they can shift in different ways.

Sleep-edge experiences may therefore involve several different kinds of change. There may be tingling or vibration, vestibular sensations such as floating or turning, fading awareness of the physical body, changes in apparent self-location, a shift of first-person perspective, altered body ownership, or the emergence of a dream environment. A sensed presence belongs in the record too, but it should not automatically be treated as the same phenomenon as vestibular movement.

There is no established universal signal that proves a particular extraordinary transition has occurred.

**Drama is not depth.**

The useful question is simpler:

**What changed first?**

## Experiment

### Map the Shift

For several nights, continue the relaxation, attention, sleep-edge observation, and nonphysical movement practices you already have. Do not try to manufacture every sensation described here, and do not stay up to hunt for a spectacular one. Your experiment is to discover what actually happens in your experience. Sleep still comes first.

When something begins to change, notice it without immediately naming what the whole event means.

Track six categories:

**Body sensation** — tingling, vibration, pressure, heaviness, lightness, warmth, fading, expansion, contraction, or another bodily change.

**Movement** — rocking, falling, floating, spinning, turning, rising, sinking, or movement that occurs while the physical body remains still.

**Self-location** — where *you* seem to be.

**Perspective** — the apparent point from which you perceive the scene.

**Body ownership** — whether the physical body still feels unquestionably yours, becomes distant, changes shape, or another body becomes prominent.

**Environment** — whether you remain aware of the bedroom, encounter imagery, or find yourself inside a stable scene.

Do not force yourself to analyze all six while the experience is happening. Stay with the transition.

Record the sequence afterward.

For example:

**hands clear → body heavy → buzzing → rocking → viewpoint shifts → scene**

Or:

**imagery → body fades → scene surrounds me → dream body appears**

Or simply:

**nothing obvious → dream**

After several attempts, compare the records.

Which category usually changes first?

Which changes tend to follow one another?

Which dramatic sensations lead nowhere?

Which subtle ones tend to appear just before a larger transition?

You are not trying to prove a theory yet.

You are learning the sequence of your own experience.

## Intention

**I notice what changes, what stays, and how the experience reorganizes.**

## References

**[1]** Blanke, O. “Multisensory brain mechanisms of bodily self-consciousness.” *Nature Reviews Neuroscience* 13 (2012): 556–571.
**[2]** Serino, A., et al. “Bodily ownership and self-location: components of bodily self-consciousness.” *Consciousness and Cognition* 22 (2013).
**[3]** Zito, G., et al. “A systematic review and meta-analysis on the neural correlates of bodily self-consciousness.” 2025.
**[4]** Lopez, C. “The vestibular system: a spatial reference for bodily self-consciousness.” *Frontiers in Integrative Neuroscience*.
**[5]** Haar Horowitz, A., et al. “The hypnagogic state: A brief update.” *Journal of Sleep Research*.
**[6]** Cheyne, J. A., and Girard, T. A. “The body unbound: vestibular-motor hallucinations and out-of-body experiences.” *Cortex*.
**[7]** Barnby, J. M., et al. “The felt-presence experience: from cognition to the clinic.” *The Lancet Psychiatry* (2023).
`,Lt="Feel the Shift: Vibrations, Floating and Out-of-Body Sensations Near Sleep",ro="/out-of-body-sensations-sleep/",Wt=ro;let gn=null;function so(){return gn||(gn=S(oo)),gn}const lo=`# Know the Threshold: How to Recognize When Waking Imagery Becomes a Dream

At some point every night, you fall asleep.

That sounds like the easiest boundary in the world to recognize.

You are awake. Then you are asleep.

Except that when researchers actually study the transition, the boundary becomes surprisingly difficult to locate.

A sleep technician can score changes in brain activity, eye movements, and muscle tone. A person lying in bed has a different problem. From inside the experience, falling asleep does not necessarily feel like crossing a line.

You may still believe you are awake after measurable sleep has begun.

You may hear part of the room while simultaneously experiencing internally generated imagery.

You may be deliberately imagining something and then discover that it has begun behaving without you.

You may become immersed in a scene without noticing exactly when it stopped being an image.

Or you may dream that you woke up.

This chapter asks a practical question:

**How do you recognize that the experience has crossed from ordinary waking imagination into something sleep is now generating for you?**

The answer is probably not one signal.

It is a pattern.

## Sleep does not arrive all at once

The conventional sleep stages are useful scientific classifications, but lived experience does not always line up neatly with them.

Sleep researchers typically distinguish wakefulness, N1, N2, N3, and rapid eye movement sleep. N1 is often described as the light transitional stage between waking and more established sleep.

It would be convenient if entering N1 produced a recognizable internal bell.

It does not.

A recent review of the sleep-onset period emphasizes that the descent into sleep involves changing electrophysiology, cognition, sensory processing, and responsiveness that do not necessarily transform at the same instant.[1]

Even the simple question **Am I asleep?** can become unreliable.

Research on subjective sleep perception has found that healthy sleepers commonly report feeling awake around sleep onset even when polysomnography indicates that sleep has already begun. That feeling can continue into the first non-REM sleep cycle.[2]

This is worth remembering whenever you think:

*Nothing happened. I was awake the whole time.*

Maybe you were.

Maybe part of the period had already crossed into sleep.

Without laboratory recording, we should not pretend to know which stage occurred.

But we can learn to recognize changes in the experience itself.

## The outside world loses priority

One useful part of the transition is not that external sensation instantly disappears, but that it becomes less dominant.

Sleep does not simply turn the senses off.

The sleeping brain continues processing some information from the environment, especially salient or meaningful signals, while reducing the degree to which ordinary incoming information reaches conscious awareness.[3]

That helps explain a familiar experience.

You are lying in bed and still know that a fan is running.

Then you notice an image.

For a while the fan and the image coexist.

Eventually the image has somewhere to go. There is a room, a road, a face, a conversation.

At some point the fan has disappeared from awareness.

The fan may still be running.

What changed was priority.

The internal environment became more compelling than the external one.

That is one possible threshold clue.

It is not proof of a particular sleep stage.

It is evidence that attention is reorganizing.

## Thought begins behaving differently

Earlier in the night, thought usually feels like something you are doing.

You think about tomorrow.

You remember a conversation.

You deliberately imagine a place.

As drowsiness increases, thought may become less obedient.

A sentence takes an unexpected turn.

A familiar person's name appears for no obvious reason.

An image arrives that you did not request.

A thought begins logically and ends somewhere absurd.

You briefly accept something that would have seemed obviously strange thirty seconds earlier.

Research on hypnagogia has documented these changes in sleep-onset cognition. Sleep-onset imagery can include visual scenes, sounds, bodily experiences, fragments of memory, and increasingly dreamlike combinations. Researchers sometimes use the term **microdream** for very short dreamlike experiences occurring around this boundary.[4]

The useful feature is not merely that imagery appeared.

You can create imagery while completely awake.

What becomes interesting is **autonomy**.

The experience begins contributing something you did not deliberately supply.

You imagine a hallway.

Then a door opens that you did not decide to open.

Someone walks through it.

They say something unexpected.

Now the experiment has changed.

## From construction to discovery

This distinction has been building for several chapters.

There is an image you construct.

Then there is an image that appears.

There is movement you imagine.

Then there is movement that begins happening.

There is a bodily sensation you intentionally amplify.

Then there is a shift that arrives on its own.

The threshold may be recognizable when the balance changes from **construction** toward **discovery**.

While awake, you usually know what comes next because you are generating it.

Near sleep, you begin finding out what comes next.

That difference may be subtle.

Suppose you deliberately imagine walking down a staircase.

Step one is intentional.

Step two is intentional.

Step three becomes vague.

Then you notice wallpaper.

You did not choose wallpaper.

The stairs turn.

You had not decided that they would.

Someone is waiting at the bottom.

For a few seconds you are no longer practicing imagery.

You are somewhere.

Then you notice what happened and wake yourself.

The important event was not the staircase.

It was the transfer of authorship.

## The strange disappearance of surprise

There is another clue that something has changed.

Dreams are often remarkably tolerant of nonsense.

A room from childhood connects to a building you visited last week. A person has somebody else's face. You are suddenly in another city. A dog begins talking.

While fully awake, those events would demand explanation.

In dreams, they often do not.

During the transition, you may notice a smaller version of the same effect.

An impossible image appears and, for a moment, you accept it.

Only afterward do you think:

*That made absolutely no sense.*

This temporary reduction in reflective monitoring may be another sign that waking cognition is loosening.

It also explains why recognizing the threshold is difficult.

The very mental function that would say **This is getting dreamlike** may be becoming less active at exactly the moment you need it.

That is why the goal is not intense concentration.

It is familiarity.

## Feeling awake does not prove wakefulness

This deserves emphasis because it can prevent a great deal of unnecessary frustration.

The subjective conviction **I was awake** is not always a perfect measurement of physiological state.

Research reviewing subjective-objective sleep differences found that even good sleepers frequently experience periods of objectively measured sleep as wakefulness near sleep onset.[2]

The reverse problem is possible too.

You may be dreaming that you are awake.

A **false awakening** is a dream in which you believe you have awakened. The bedroom may look convincing. You may get out of bed, check the time, begin your morning routine, or think about the dream you just had.

Then you wake again.

False awakenings are particularly useful for this project because they demonstrate something simple:

**The feeling of being awake is itself something the mind can simulate.**

That does not mean you should distrust waking life.

It means that around sleep, confidence alone is not always enough to classify an experience.

## Sleep paralysis complicates the map

Sleep paralysis creates another especially confusing boundary condition.

The person may feel awake and aware of the bedroom while voluntary movement remains inhibited. Vivid imagery, sensed presence, pressure, fear, sounds, or vestibular sensations may occur.

Because consciousness feels clear, the natural conclusion can be:

**I was fully awake but my body was asleep.**

That description may be phenomenologically accurate—it captures what the event felt like—but it should not automatically be turned into a precise physiological claim.

In a small laboratory study that captured episodes of sleep paralysis and false awakening, their EEG characteristics were closer to dreaming sleep than ordinary waking and showed features intermediate between REM sleep and wakefulness.[5]

The study was tiny, so it should not become a universal theory.

Its real value here is caution.

The border can feel clearer from the inside than it actually is.

## Lucidity is another threshold, not necessarily the same threshold

Lucid dreaming introduces a different event.

A person is dreaming and becomes aware:

**This is a dream.**

That is not identical to noticing sleep onset.

Some lucid dreams begin after the dream is already well established. The person may have no memory of crossing into sleep at all.

Modern electrophysiological research continues to associate lucid dreaming predominantly with REM sleep, while finding specific changes in brain-network activity and connectivity compared with ordinary REM dreaming.[6]

So several thresholds may exist in one night.

The body begins sleeping.

External awareness weakens.

Dream imagery becomes immersive.

A dream scene stabilizes.

Metacognition returns.

Lucidity begins.

These events do not have to occur at once.

Recognition can be of sleep onset, of a dream, or of both. They are not the same event.

You are not trying to locate one mystical gate.

You are learning several transitions.

## Mixed states are possible

Sleep and wakefulness are useful categories, but biology is not always obligated to respect our neat labels.

Research increasingly recognizes that features associated with waking and sleeping can coexist in unusual configurations. Reviews of sleep-related dissociative states discuss phenomena such as lucid dreaming, false awakening, sleep paralysis, and parasomnias partly in terms of mixed or dissociated features of ordinary sleep and wake states.[7]

A 2025 exploratory sleep-laboratory study recorded a very small number of lucid dreams, sleep paralysis episodes, out-of-body experiences, and false awakenings. Those events showed electrophysiological characteristics distinct from ordinary waking while sharing features with both N1 and REM sleep.[8]

Again, the sample was much too small to create a universal map.

But it reinforces the larger lesson.

**Threshold experiences may be mixtures rather than clean switches.**

That makes your own observation more interesting, not less.

## Do not diagnose yourself with a sleep stage

By this point it may be tempting to build a chart:

buzzing equals N1;

floating equals REM;

imagery equals dreaming;

paralysis equals REM;

vibration equals out-of-body experience.

Do not do that.

Subjective sensations are not a home polysomnograph.

The same kind of sensation may appear in different circumstances. Different people may experience the same physiological transition differently. A sensation can also be influenced by expectation, body position, anxiety, previous practice, environment, and memory.

Unless you are being recorded with appropriate equipment, saying **I entered N1 at this exact moment** is usually stronger than the evidence permits.

Instead use phenomenological language.

**External sound became less important.**

**An image appeared by itself.**

**My imagined movement became spontaneous.**

**The bedroom disappeared.**

**I felt awake but could not move.**

**I believed I had awakened and later discovered I was dreaming.**

Those reports preserve information.

The theory can come later.

## A threshold is easier to recognize backward

There is an annoying feature of transitions: often the best evidence that you crossed one appears after the crossing.

You suddenly realize:

*That image was no longer under my control.*

Or:

*For a few seconds I forgot that I was lying in bed.*

Or:

*I had become part of the scene.*

The realization itself may wake you.

That is fine.

Recognition does not have to begin perfectly.

The first skill is simply noticing afterward that a change occurred.

With repetition, recognition may move earlier.

First:

**I was dreaming.**

Later:

**I just started dreaming.**

Eventually, perhaps:

**Something is changing now.**

That progression is enough.

## The threshold is a cluster

We asked which part of experience shifts first.

This chapter adds another question:

**When do several shifts begin to agree?**

Imagine the following:

Your physical body becomes less distinct.

External sounds remain present but no longer matter much.

Imagery arrives without deliberate construction.

A sense of movement appears.

The image becomes a place.

Events continue without being directed.

You briefly stop evaluating whether any of this makes sense.

No single item proves that you are asleep.

Together, however, they describe a meaningful transition.

That is the kind of threshold we can learn.

Not a magic vibration.

Not one EEG frequency.

Not one visual flash.

A convergence.

## What happens when you notice it?

The usual reaction to recognizing something unusual is excitement.

*It's happening.*

Heart rate feels stronger.

Attention snaps back toward the body.

You check whether you can still feel your hands.

You evaluate the experience.

And the threshold collapses.

This is not failure.

It is information.

You have just discovered that recognition itself can alter the state you are trying to observe.

Recognizing a state can itself change it. For now, noticing the threshold is enough.

Do not immediately grab it.

Do not try to force it deeper.

Recognize what has changed and allow the experience to continue if it does.

The skill is recognition before intervention.

## Summary

Sleep onset is not experienced as one universal internal switch. Physiological staging, subjective awareness, sensory processing, thought, imagery, bodily experience, and responsiveness can change at different rates.

People may feel awake after measurable sleep has begun. External information can continue to be processed while becoming less dominant. Sleep-onset thought can shift from deliberate, waking-style cognition toward spontaneous imagery, fictive movement, unusual associations, and short dreamlike experiences.

False awakenings show that the sense of being awake can occur inside a dream. Sleep paralysis likewise demonstrates that subjective wakefulness, bodily immobility, dreamlike perception, and REM-related physiology can appear in confusing combinations.

Lucid dreaming introduces another threshold: realizing that an ongoing experience is a dream. That event need not coincide with sleep onset.

The practical lesson is:

**The threshold is a pattern, not a signal.**

Look for several changes beginning to converge—less external priority, greater internal autonomy, altered bodily experience, immersive space, spontaneous movement, reduced reflective control, and the emergence of events you discover rather than deliberately construct.

Do not diagnose a sleep stage from sensation alone.

Notice the transition.

## Experiment

### Catch the Crossing

For the next several nights, begin exactly as you normally would. Protect ordinary sleep. This experiment is not a reason to stay awake for hours, repeatedly interrupt sleep, or chase an experience after you are tired of practicing.

As you become drowsy, occasionally ask one quiet question:

**Am I still making this happen?**

Do not answer analytically for long.

Instead notice three parts of the transition.

### The outside

Notice what is happening to the room.

Can you still hear ordinary sounds?

Do they seem close or distant?

Are you actively listening to them, or have they moved into the background?

Does awareness of the bed remain continuous, or do you periodically forget it?

### The inside

Notice what is happening to thought and imagery.

Are you deliberately constructing thoughts?

Are fragments appearing unexpectedly?

Does imagery remain something you watch, or is it becoming a place?

Do events continue without your deciding what happens next?

### The observer

Notice what happens to the part of you that knows what is going on.

Are you still evaluating everything?

Did you briefly accept something strange without questioning it?

Did you suddenly realize that several seconds had passed inside an experience you were no longer directing?

Did you believe you had awakened?

Did you recognize that you were dreaming?

If you notice a transition, resist the urge to test everything immediately.

Let it continue.

Afterward, record the sequence.

For example:

**fan audible → random image → image becomes room → forgot bed → noticed transition → woke**

or:

**imagined walking → spontaneous movement → scene continues → realized I was dreaming**

or:

**felt awake → could not move → heard room → sensed figure → woke normally**

or:

**no recognizable threshold → slept**

Over several attempts, compare your reports.

Which changes tend to appear together?

Which one usually alerts you?

Which signals merely wake you without developing further?

Most importantly:

**What tells you that you have stopped constructing the experience and started discovering it?**

## Intention

**I recognize when the experience begins to continue on its own.**

## References

**[1]** *Embracing sleep-onset complexity.* Review of the neural, cognitive, and sensory dynamics of the human sleep-onset period, 2024.

**[2]** Stephan, A. M., & Siclari, F. *Reconsidering sleep perception in insomnia: from misperception to mismeasurement.* Journal of Sleep Research, 2023.

**[3]** *Sensory gating and gaining in sleep: the balance between the protection of sleep and the safeness of life.* Journal of Sleep Research, 2024.

**[4]** Nielsen, T. *Microdream neurophenomenology.* Neuroscience of Consciousness, 2017/2018.

**[5]** Mainieri, G., et al. *Are sleep paralysis and false awakenings different from REM sleep and from lucid REM sleep? A spectral EEG analysis.* Journal of Clinical Sleep Medicine, 2021.

**[6]** Demirel, Ç., et al. *Electrophysiological Correlates of Lucid Dreaming: Sensor and Source Level Signatures.* Journal of Neuroscience, 2025.

**[7]** *Awake or Sleeping? Maybe Both… A Review of Sleep-Related Dissociative States.* 2023.

**[8]** *Exploratory study of non-ordinary states of consciousness during sleep show distinct electrophysiological features from wakefulness and canonical sleep stages.* 2025.
`,Bt="Know the Threshold: How to Recognize When Waking Imagery Becomes a Dream",ho="/entering-a-lucid-dream/",Ft=ho;let yn=null;function co(){return yn||(yn=S(lo)),yn}const uo=`# Stabilize the Dream: Lucid Dream Stabilization Techniques and Research

Becoming lucid can feel like the finish line.

It is not.

Sometimes the moment you realize **this is a dream**, the whole thing starts disappearing.

The scene goes dim.

The ground loses detail.

Your dream body becomes faint.

You become intensely aware of the physical body in bed.

Or you simply wake up.

This can make lucid dreaming seem fragile, as though lucidity itself is what destroys the dream.

That conclusion is too simple.

Laboratory research has verified lucid awareness during ordinary REM sleep, and lucid dreamers can remain asleep long enough to make planned eye-movement signals, answer questions from researchers, hold information in mind, and perform simple calculations.[1] Lucidity does not automatically equal awakening.

But lucidity also does not automatically produce a stable dream.

That gives us three different abilities to keep separate:

**Lucidity** — knowing that you are dreaming.

**Stability** — remaining in the dream with enough continuity to keep experiencing it.

**Control** — deliberately influencing what happens.

They can overlap.

They do not have to.

A person may know they are dreaming but have very little control. A dream may remain vivid and stable without obeying the dreamer's intentions. Someone may influence a small part of the dream while the larger scene continues doing whatever it wants.

A 2026 review of lucid-dream control makes this distinction explicit. Lucidity does not reliably produce control, and the mechanisms and effectiveness of dream-control strategies remain poorly understood.[2]

That is a useful correction before we start talking about stabilization techniques.

The goal of this chapter is not to give you a magic move.

It is to learn what kind of instability you are actually dealing with, and then test what helps.

## What exactly is fading?

People often say:

**The dream was collapsing.**

But several different things may be happening.

The visual scene may become dark while touch and movement remain vivid.

Lucidity may fade while the dream itself continues normally.

The scene may change abruptly, which can feel like a failure even though dreaming continues.

Your dream body may become difficult to feel.

The physical body may suddenly become more noticeable.

You may have a false awakening and believe the dream ended when it actually changed form.

Or you may truly wake up.

These are different outcomes.

If you treat all of them as **the dream ended**, you lose useful information.

Suppose your vision goes black but you can still feel dream hands.

That is not the same as waking.

Suppose you stop remembering that you are dreaming but continue having a vivid dream.

That is loss of lucidity, not loss of the dream.

Suppose the room disappears and a different scene forms.

That may be a transition rather than a collapse.

Stabilization begins with diagnosis in the ordinary sense of the word: **what changed?**

Not a medical diagnosis.

An observational one.

## Lucidity is not control

Lucid dreaming is usually defined by insight: while dreaming, you know that you are dreaming.

Control is something else.

Researchers have measured multiple dimensions of lucid experience rather than treating lucidity as one all-or-nothing property. The Lucidity and Consciousness in Dreams scale, for example, distinguishes insight, control, thought, realism, memory, dissociation, and emotion.[3]

That matters because dreamers often assume:

**If I am really lucid, I should be able to control everything.**

Research does not support that expectation.

A large international study likewise found that awareness of dreaming and the ability to influence dream content do not occur together in everyone.[4]

The dream may be lucid and still resist you.

That is not failed lucidity.

It is a different variable.

The 2026 review on dream control describes both deliberate, goal-directed control and more implicit forms in which expectation may influence what develops without a clear act of command.[2]

This is useful for stabilization because trying to dominate the scene may not be the same thing as staying in it.

Sometimes the best intervention may be smaller.

Touch the wall.

Look at the floor.

Keep walking.

Ask a question.

Notice what the dream is already giving you.

## The old stabilization tricks

Lucid-dream literature has long recommended techniques such as rubbing the dream hands together, spinning the dream body, touching nearby objects, staring at detail, or repeating phrases such as **clarity now** or **this is a dream**.

Some of these techniques have at least limited experimental history.

An older Lucidity Institute experiment compared three responses when lucid dreams began to fade:

- spinning;
- rubbing the dream hands together;
- continuing the current dream activity.

In that small study, spinning and hand-rubbing were associated with more reports of continued dreaming than simply continuing as before.[5]

The result is interesting.

It is not definitive.

The sample was small, the outcomes were based on retrospective dream reports, and the work has not become a large, modern, replicated body of evidence.

So we should not turn it into:

**Spinning works.**

A better statement is:

**Spinning and hand-rubbing have preliminary evidence worth testing.**

That is a very different claim.

## Why might sensory engagement help?

There is a plausible idea behind these techniques.

Lucid dreaming depends on internally generated perception that can feel vivid enough to be experienced as a world. A modern neurocognitive framework proposes that attentional control and multisensory integration help maintain lucid experience by balancing internally generated models against incoming sensory information.[6]

This does not prove that touching dream objects stabilizes dreams.

But it gives us a reasonable hypothesis.

If attention becomes strongly organized around internally generated visual, tactile, vestibular, and motor information, perhaps the dream remains the dominant experiential model for longer.

That would make several traditional techniques variations on the same basic strategy:

**engage the dream as a sensory environment.**

Rubbing hands emphasizes touch and movement.

Spinning emphasizes vestibular and motor sensation.

Looking closely emphasizes visual detail.

Listening emphasizes auditory content.

Walking or touching the ground recruits body and spatial information.

Speaking aloud may reinforce intention and orientation.

The important point is that the proposed mechanism is broader than any one ritual.

And it is still a hypothesis.

## Dreams already contain convincing sensation

We do not need to assume that sensory vividness inside dreams is weak.

Dreams commonly include visual, motor, emotional, and bodily experience that is accepted as real while it is happening.[7]

Researchers have also demonstrated that people in lucid REM dreams can perceive some external questions and respond deliberately without fully waking.[1]

This tells us that the sleeping mind can maintain a rich internally generated scene while still processing limited outside information.

A 2024 systematic review of sensory stimulation during sleep found that outside stimuli can sometimes alter dream content, but the results vary widely across methods and studies.[8]

That variability is important.

The sleeping brain is not simply sealed off.

But it is not an open microphone either.

External and internal information compete and interact in complex ways.

For stabilization, the practical question becomes:

**What keeps the dream environment winning that competition for your attention?**

## Start with the smallest intervention

When something exciting happens in a lucid dream, there is a temptation to immediately perform a dramatic test.

Fly.

Teleport.

Summon someone.

Change the entire landscape.

That may work.

It may also overload the moment with effort and expectation.

We do not yet have strong evidence that large acts of dream control are the best way to preserve lucidity or dream continuity.

So begin with the smallest useful intervention.

If the scene is stable, you may not need to stabilize anything.

Just continue.

If vision weakens, touch something.

If attention becomes scattered, examine one nearby object.

If lucidity begins fading, state a simple fact:

**I am dreaming.**

If you feel disconnected from the dream body, walk, touch the ground, or rub your hands.

If the scene disappears but movement remains, continue moving gently rather than immediately concluding that you woke up.

The principle is:

**Respond to the problem you actually have.**

## Touch

Touch is a good first experiment because it is simple and local.

Feel a wall.

Run your hand along a table.

Pick up an object.

Rub your hands together.

Notice texture, pressure, temperature, friction, resistance.

Do not merely perform the motion.

Attend to what the dream supplies.

Does the surface feel rough?

Smooth?

Warm?

Impossible?

Does touching it make the rest of the scene clearer?

Does nothing happen?

The answer matters more than the technique.

The old hand-rubbing experiment is interesting partly because it asks the dreamer to produce a vivid tactile and motor experience when the scene is fading.[5]

We can test that without assuming the original explanation is correct.

## Look closely

Visual attention is another natural anchor.

Instead of staring at the entire dream environment, choose one small feature.

A crack in the pavement.

Letters on a sign.

The grain of wood.

A person's eyes.

Your own hands.

You are not trying to prove that detail creates dream stability.

You are asking whether deliberate visual engagement helps *your* dream remain coherent.

There is also a practical advantage.

Looking closely gives attention a task that stays inside the dream.

It reduces the urge to check the sleeping body or wonder whether you are about to wake.

That may matter even if the mechanism is psychological rather than physiological.

## Move

Movement can preserve involvement with the dream body.

Walk.

Turn slowly.

Touch the floor.

Reach for an object.

If the scene is already unstable, violent movement may be unnecessary.

Spinning deserves to remain in the experiment because of its historical result, but it should not automatically be the first tool.[5]

Spinning may also change the scene completely.

That is not necessarily bad.

But it means the outcome should be recorded carefully.

Did the original dream stabilize?

Did a new dream scene appear?

Did you wake?

Did you enter darkness?

Did you have a false awakening?

These are different results.

## Speak

Dream speech can serve two purposes.

It may help maintain lucidity:

**I am dreaming.**

And it may direct attention:

**Look at the room.**

**Feel the floor.**

**Stay here.**

There is no strong evidence that special phrases possess unique power.

Use plain language.

The phrase is a cue, not an incantation.

This matches what we learned earlier about intention.

The useful part is where attention goes.

## Do not confuse scene change with waking

One of the most useful stabilization skills may be simply waiting a moment.

A visual scene can disappear without the entire dream ending.

Older lucid-dream reports describe periods of darkness followed by another scene, sometimes after continued movement or spinning.[5]

False awakenings create another complication.

You may believe you woke in bed, only to discover later that the bedroom itself was part of the dream.

So when a lucid dream appears to end, do not panic.

Observe.

Can you still feel movement?

Can you still hear something?

Can you touch anything?

Does another scene form?

If you appear to wake, check the environment once before assuming the experiment is over.

This is not a command to distrust waking life.

It is a practical response to a documented dream phenomenon.

## Control can fail while the dream remains excellent

Dream control has limits.

In one study, lucid dreamers were asked to recreate a recently viewed waking scene inside a dream. Even when dreamers knew their recreated scene was inaccurate, they often could not simply correct the dream imagery to match memory.[9]

That is a useful lesson.

The dream is not necessarily a graphics program waiting for commands.

You may possess insight and intention while the environment still behaves autonomously.

The 2026 review emphasizes this variability and the need for much better standardized research on dream-control strategies.[2]

This suggests a healthier approach to stabilization:

Do not measure success by obedience.

Measure whether the experience remained available for observation and interaction.

A stubborn dream can still be a stable dream.

## Excitement is not automatically the enemy

Many lucid dreamers report waking soon after becoming excited.

That has produced common advice to **stay calm**.

Reasonable.

But we should be careful not to turn another common report into a universal law.

Lucid dreaming occurs during activated REM sleep, and physiological studies do not support the simple idea that lucidity is merely waking intrusion that must be kept at the lowest possible arousal level.[6]

The practical issue may be abrupt shifts of attention rather than emotion itself.

You realize you are dreaming.

Then you think about waking.

Then you check the body.

Then the dream loses priority.

That sequence feels different from simply being delighted inside the dream.

So instead of:

**Do not get excited.**

Try:

**Keep the excitement inside the dream.**

Laugh.

Touch something.

Keep moving.

Look around.

Use the energy as part of the scene rather than as a reason to monitor the bed.

This is an experimental suggestion, not a settled mechanism.

## Stability has several dimensions

A lucid dream can be stable in one way and unstable in another.

Track at least four dimensions:

**Scene stability** — does the environment remain coherent?

**Lucidity stability** — do you continue knowing that you are dreaming?

**Body stability** — does the dream body remain available for movement and touch?

**Goal stability** — do you remember what you intended to do?

This last one matters.

You may stay lucid for a while but forget every waking intention you brought into the dream.

That is not loss of lucidity.

It is loss of prospective memory.

The distinction will become important later when we begin testing experiences instead of merely having them.

## Stabilization is not domination

There is a subtle trap in the word **stabilize**.

It can sound as though the dream is an unruly object that must be forced to stay still.

But dreams are dynamic.

Scenes change.

Characters arrive.

Space behaves strangely.

Narratives jump.

Stability does not mean freezing the dream.

It means preserving enough continuity to remain present and aware while the dream continues evolving.

You do not need to stop the river.

You need to stay in it.

## Summary

Lucidity, stability, and control are different properties of dream experience.

Knowing that you are dreaming does not guarantee that the dream will remain stable, and a stable lucid dream does not guarantee control over its content.

Research on lucid-dream control remains limited. A 2026 review concludes that control strategies are still poorly understood and need systematic testing.[2] An older small experiment found that spinning and hand-rubbing were associated with greater dream continuation than simply continuing the previous activity, but the evidence is preliminary.[5]

A plausible framework emphasizes attentional control and multisensory integration in maintaining lucid experience.[6] This gives sensory engagement a reasonable scientific hypothesis without proving any single technique.

When a lucid dream begins changing, first identify what is actually unstable: the scene, lucidity, the dream body, memory for your goal, or the dream itself.

Then use the smallest appropriate intervention.

Touch.

Look closely.

Move.

Speak.

Explore the dream as it is before trying to explain what it is.

Continue interacting with the dream.

And record what happens.

The purpose is not to learn a magic stabilization trick.

It is to discover which forms of engagement help your dreaming mind remain available for exploration.

## Experiment

### Stay in the Scene

Across several lucid dreams, test one intervention at a time when the dream begins to fade or when lucidity first appears.

Do not force a technique into a dream that already feels stable.

Record the intervention and the outcome.

### Touch

Touch a nearby surface or rub your dream hands together.

Notice friction, texture, temperature, pressure, and movement.

Then observe:

Did the scene become clearer?

Did the dream continue unchanged?

Did the scene change?

Did you wake?

### Look

Choose one nearby visual detail and study it.

Notice shape, texture, edges, color, writing, or small imperfections.

Observe whether attention to detail changes the dream.

### Move

Walk, turn, touch the floor, or deliberately use the dream body.

On a separate attempt, if appropriate, test spinning.

Record whether the original scene continued, a new scene appeared, darkness occurred, a false awakening followed, or you woke physically.

### Speak

Say one simple sentence:

**I am dreaming.**

or:

**Stay with the scene.**

Then return attention to the environment.

Do not repeat phrases mechanically unless repetition itself becomes part of the experience.

### No intervention

When possible, include a comparison condition.

Notice that the dream is fading and simply continue what you were doing.

This gives you something to compare against the active techniques.

For every attempt, record four things:

**Scene** — stable, faded, changed, or disappeared.

**Lucidity** — remained, weakened, or was lost.

**Dream body** — vivid, weak, absent, or changed.

**Outcome** — continued dream, new dream scene, false awakening, physical awakening, or uncertain.

After several lucid dreams, compare the results.

Do not ask only:

**Which trick worked?**

Ask:

**What kind of instability was happening, and what kind of engagement changed it?**

## Intention

**I stay with the dream by engaging what is already here.**

## References

**[1]** Konkoly, K. R., et al. “Real-time dialogue between experimenters and dreamers during REM sleep.” *Current Biology* 31 (2021): 1417–1427.e6.

**[2]** Bonamino, C., & Peters, E. “Lucid Dream Control: Mechanisms, Challenges and Future Directions.” *Journal of Sleep Research* (2026).

**[3]** Voss, U., et al. “Measuring consciousness in dreams: the lucidity and consciousness in dreams scale.” *Consciousness and Cognition* (2013).

**[4]** “Lucid Dreaming: Not Just Awareness, but Agency.” 2025.

**[5]** LaBerge, S. “Prolonging Lucid Dreams.” Lucidity Institute experiment report.

**[6]** Simor, P., Bogdány, T., & Peigneux, P. “Predictive coding, multisensory integration, and attentional control: A multicomponent framework for lucid dreaming.” *Proceedings of the National Academy of Sciences* 119 (2022): e2123418119.

**[7]** Takeuchi, T., et al. “What are the neural mechanisms and physiological functions of dreams?” *Neuroscience Research* (2023).

**[8]** “Influencing dreams through sensory stimulation: A systematic review.” 2024.

**[9]** “Partial memory reinstatement while (lucid) dreaming to change the dream environment.” *Consciousness and Cognition* (2020).
`,zt="Stabilize the Dream: Lucid Dream Stabilization Techniques and Research",mo="/lucid-dream-stabilization/",Ht=mo;let fn=null;function po(){return fn||(fn=S(uo)),fn}const go=`# Explore the Dream: Lucid Dream Experiments, Dream Control and Research

Once a lucid dream becomes stable enough to stay inside, a new problem appears.

What do you do with it?

The obvious answer is:

Anything.

Fly.

Open doors.

Talk to people.

Walk through walls.

Ask impossible questions.

Visit somewhere familiar.

Visit somewhere that does not exist.

Change the weather.

Change yourself.

Stand still and watch.

Lucid dreams can feel like environments designed for experimentation because the dreamer may know the situation is a dream while still experiencing a convincing world around them.

But exploration becomes more useful when we separate three things that are easy to mix together:

**what the dream gives you;**

**what you deliberately change;**

and **what you later claim the experience means.**

Those are not the same thing.

This chapter is about exploring before explaining.

## Bring one question, not an entire agenda

Lucid dreamers commonly enter dreams intending to perform specific actions.

Survey research involving hundreds of lucid dreamers found that people often plan things such as flying, speaking with dream characters, or carrying out other predetermined goals. They do not always remember those intentions once lucid, and even when they remember them, the dream environment may interfere.[1]

That makes prospective memory part of lucid exploration.

You can become lucid and still forget why you wanted to become lucid.

So keep the waking goal small.

One question.

One place.

One observation.

One experiment.

Instead of:

**Tonight I will become lucid, stabilize the dream, find my childhood home, interview three people, fly to the Moon, solve a problem, test telepathy, and remember everything.**

Try:

**When I become lucid, I will ask one dream character what they are doing here.**

Or:

**I will examine one unfamiliar room carefully.**

Or:

**I will ask the dream to show me something unexpected.**

A smaller goal is easier to remember, and memory is part of the experiment.

## Exploration is not control

Lucidity, stability, and control are separate.

Now we add another distinction.

**Exploration is not control.**

You can explore something without making it obey you.

This matters because dream control is inconsistent. A 2026 review describes deliberate, goal-directed control as only one form of influence and emphasizes that lucid dream control remains poorly understood.[2]

A dream may resist your request.

A door may open somewhere you did not expect.

A character may refuse to answer.

You may try to create a beach and get a parking lot.

You may ask to fly and remain stubbornly two feet above the ground.

That does not necessarily ruin the experiment.

It may improve it.

If every event is deliberately authored, there is less to investigate.

Exploration begins where the dream surprises you.

## Look before changing

A useful habit is to spend a few moments observing the dream before editing it.

What is already here?

Notice architecture.

Weather.

Light.

Distance.

Sound.

Texture.

People.

Your own body.

Objects that seem ordinary.

Objects that make no sense.

Do not immediately repair inconsistencies.

If a staircase leads into the ceiling, look at it.

If the room is somehow both your childhood kitchen and a train station, notice that before choosing which one it should become.

Dreams often combine memory fragments, expectations, associations, and invented material into scenes that feel coherent while they are happening.

The unexplained detail may be more interesting than the detail you deliberately create.

## Ask dream characters simple questions

Dream characters are especially tempting experimental subjects.

They may look familiar or unfamiliar.

They may behave predictably.

They may surprise you.

In a classic small study, experienced lucid dreamers were instructed to give dream characters cognitive tasks. Some dream characters produced rhymes, verses, written responses, and other apparently organized behavior, while arithmetic performance was relatively poor.[3]

That is fascinating.

It does not establish that dream characters are independent minds.

The experiment tells us that dream cognition can generate responses that surprise the lucid dreamer and can display forms of organized behavior.

That alone is worth investigating.

Ask straightforward questions.

**Who are you?**

**What are you doing?**

**Where are we?**

**Show me something interesting.**

**What should I notice?**

Then listen.

Do not decide in advance whether the answer comes from another being, your unconscious, memory, expectation, imagination, or some mixture.

Record the answer first.

Interpret later.

## Surprise is data

One of the most interesting qualities of dreams is that they can produce events that feel unplanned.

You ask a character a question and receive an answer you would not have consciously chosen.

You open a door and find a landscape you were not imagining a moment earlier.

You look at your hand and discover seven fingers.

You ask for your childhood bedroom and get a place that resembles it but contains unfamiliar furniture.

The surprise is real as an experience.

The explanation remains open.

This distinction protects curiosity.

If every surprising dream response is immediately labeled **just imagination**, investigation stops.

If every surprising response is immediately labeled **external intelligence**, investigation also stops.

A better question is:

**What happened that I did not expect?**

That is something you can actually record.

## Memory inside dreams is unreliable in useful ways

Lucid dreaming can include access to waking memories, but that access is imperfect.

One experiment asked lucid dreamers to recreate a waking scene they had viewed shortly before sleep. Even when the dreamers succeeded in changing the dream toward the remembered scene, the recreations were often substantially inaccurate. Some dreamers recognized the inaccuracies while still dreaming but could not simply correct them.[4]

That finding is extremely useful.

It tells us that:

**remembering something and accurately reconstructing it are different abilities.**

The same caution applies when a dream seems to reveal a forgotten detail.

Perhaps it does reproduce something accurately.

Perhaps it creates something plausible.

Perhaps it blends several memories.

The dream itself does not provide the verification.

Waking comparison does.

## The dream can incorporate waking intentions

Dreams are not isolated from what happened before sleep.

Learning, recent experiences, emotionally important material, and deliberate cues can influence later dream content.

A 2026 pilot study found that targeted dream incubation at sleep onset could bias later REM dreams toward the incubated theme in some participants.[5]

Other research using targeted memory reactivation has shown that learned material can be reactivated during REM sleep and that cues can affect later task-related dream content.[6]

This gives us a scientifically grounded reason to experiment with intention.

If you spend the evening thinking about a place, question, problem, image, or activity, it may influence what later appears in dreams.

But influence is not transmission from an outside source.

It means waking material can participate in dream construction.

That is useful enough.

## Dreams may participate in problem solving

People have told stories about creative solutions arriving in dreams for centuries.

Research is beginning to test parts of that idea experimentally.

A 2026 study used sound cues associated with unsolved puzzles during REM sleep in frequent lucid dreamers. The cues increased dreams related to the corresponding puzzles. In a post-hoc analysis, participants whose dreams became more related to the cued puzzle also showed improved later puzzle solving.[7]

That is promising.

It is not proof that dreams contain hidden perfect solutions.

It suggests that dreaming can participate in ongoing cognitive processing.

This gives us another exploration method.

Bring a problem into the dream.

Do not demand an answer.

Investigate what appears.

Ask a character.

Look for a representation.

Let the dream transform the problem.

Then return to waking life and test whether anything useful emerged.

The test happens awake.

## A dream answer is not an external fact

This may be the most important rule in the chapter.

Suppose you ask:

**What is inside a sealed box in another room?**

A dream character answers:

**A red key.**

That answer is dream data.

It is not yet information about the box.

If you wake up and open the box and find a red key, now you have an interesting comparison.

If the box contains a blue marble, you also have useful information.

The point is not to forbid extraordinary possibilities.

It is to design the observation so extraordinary possibilities can actually be evaluated.

Without waking verification, the claim remains:

**I dreamed that the answer was a red key.**

That statement is solid.

**There was a red key in the box** requires additional evidence.

Exploration becomes stronger when it respects that difference.

## Reality monitoring matters

Psychologists use the term **reality monitoring** for the ability to distinguish information that came from external perception from information generated internally.

Research has reported positive associations between dream lucidity and waking reality-monitoring performance.[8] More recent electrophysiological work likewise found associations between trait lucidity and source-memory accuracy.[9]

These findings do not mean lucid dreamers are immune to memory error.

They reinforce the importance of source.

Where did this information come from?

Did you see it while awake?

Remember it?

Imagine it?

Dream it?

Infer it afterward?

Keeping those categories separate makes the record more valuable.

## Interactive dreaming changes what is possible experimentally

Dream research once depended almost entirely on reports given after waking.

That creates an obvious problem.

Memory changes.

Details disappear.

Narratives get reorganized.

In 2021, researchers across four independent laboratories demonstrated two-way communication with lucid dreamers during verified REM sleep. Some sleeping participants correctly perceived questions, held information in working memory, performed simple calculations, and deliberately answered using eye movements or facial signals.[10]

This is an important development because it shows that dream experience can sometimes be queried while it is happening.

It does not tell us what every dream means.

It gives researchers a better experimental window.

The same spirit belongs in personal exploration:

ask clear questions;

record clear observations;

avoid adding more certainty than the method can support.

## Let the dream refuse

Control culture teaches that a lucid dream should obey.

Exploration allows refusal.

If you ask a character to answer and they walk away, follow if you want.

If a door will not open, inspect it.

If flying fails, notice how it fails.

If the scene changes when you ask a question, record the change.

Resistance may be part of the phenomenon.

Do not automatically overpower it.

The purpose is not to prove mastery.

It is to find out what the experience does.

## Explore the senses

Do not limit exploration to vision.

Touch a surface.

Listen for distant sound.

Smell something.

Taste something.

Notice gravity.

Notice temperature.

Notice pain or its absence.

Notice the dream body.

Notice whether objects have weight.

Notice whether text remains stable when reread.

Notice whether mirrors behave normally.

These are not paranormal tests.

They are phenomenological ones.

You are learning the properties of the experience.

## Explore identity

The environment is only part of the dream.

You can also explore the dreamer.

Who are you in this scene?

Do you have your ordinary body?

Your ordinary age?

Your ordinary memories?

Do you know where you live?

Do you remember the sleeping body?

Do you feel located behind the dream eyes?

Can perspective move?

Can the dream body change while lucidity remains?

Earlier chapters explored body ownership and self-location near the threshold.

Lucid dreams let you continue that investigation from inside a more complete environment.

## Ask open questions

Questions shape exploration.

Compare:

**Show me my spirit guide.**

with:

**Show me something I have not noticed.**

The first question already supplies an interpretation.

The second leaves more room for surprise.

Compare:

**Take me to a past life.**

with:

**Show me a life that feels unfamiliar.**

Again, the second preserves the experience without deciding what it is.

This does not ban spiritual interpretation.

It postpones interpretation long enough to preserve the observation.

You can apply whatever model you want afterward.

First find out what happened.

## Do not turn every dream into homework

Exploration does not need to make dreams productive.

Sometimes fly because flying is fun.

Sometimes talk to someone because you miss them.

Sometimes stand in the rain.

Sometimes eat impossible food.

Sometimes do nothing useful at all.

Curiosity is enough.

The guidebook is not trying to convert sleep into another workplace.

The experimental method matters because it helps us distinguish discovery from assumption.

Play still belongs in discovery.

## Summary

Lucid dreaming creates an unusual opportunity: the dreamer may know the environment is a dream while still being able to observe it, interact with it, remember waking intentions, and sometimes make deliberate choices.

Exploration is different from control.

A dream that resists your plans may still provide rich material for investigation.

Lucid dreamers often plan actions but do not always remember or successfully execute them.[1] Dream characters can produce surprising and organized responses, but those responses do not establish that the characters are independent minds.[3] Waking memories can be reconstructed inaccurately even when the lucid dreamer recognizes the error.[4]

Waking intentions and experimental cues can influence later dream content.[5][6] Recent work also suggests that REM dreaming can participate in problem-solving processes under controlled conditions.[7]

None of this turns dream content into automatically verified information about waking reality.

The reliable sequence is:

**experience → record → interpret → verify when verification is possible.**

Explore before you explain.

## Experiment

### One Question

Before sleep, choose one small exploration goal.

Write it down.

Keep it simple enough to remember.

Examples:

**Ask one dream character what they are doing.**

**Explore one unfamiliar room.**

**Look closely at your dream body.**

**Ask to see something unexpected.**

**Bring one creative problem into the dream.**

If you become lucid, stabilize only if stabilization is needed.

Then carry out the one exploration.

### Observe first

Before changing anything, notice what is already present.

Record afterward:

- environment;
- dream body;
- characters;
- sensory details;
- unusual features;
- emotional tone.

### Ask

If your experiment involves a character or the dream itself, ask one clear question.

Record the response as closely as possible after waking.

Do not improve it.

Do not make it more profound.

### Separate surprise from interpretation

Write two lines:

**Unexpected:** what happened that you did not deliberately plan.

**Interpretation:** what you think it might mean.

Keep them separate.

### Check memory

If the dream reproduces a waking place, person, object, text, or factual detail, compare it after waking.

Record:

**match**

**partial match**

**mismatch**

or:

**cannot verify**

Do not change the dream report after learning the waking answer.

### External verification

If you deliberately design a test involving information that could be checked in waking life, record the target before sleep when possible.

After waking, record the dream result before checking the target.

Then compare.

A match is interesting.

A mismatch is interesting.

A vague answer is vague.

Do not score ambiguity as success.

### Problem exploration

If you bring a creative problem into the dream, do not ask only whether the dream gave you a solution.

Ask:

Did it change how the problem was represented?

Did it produce a new association?

Did a character suggest something?

Did you wake with a useful idea?

Then test the idea while awake.

Across several attempts, look for the difference between:

**what you intended;**

**what you remembered;**

**what you controlled;**

**what surprised you;**

and **what survived waking verification.**

## Intention

**I explore what appears before deciding what it means.**

## References

**[1]** Stumbrys, T., et al. “The phenomenology of lucid dreaming: an online survey.” *American Journal of Psychology* (2014).

**[2]** Bonamino, C., & Peters, E. “Lucid Dream Control: Mechanisms, Challenges and Future Directions.” *Journal of Sleep Research* (2026).

**[3]** Tholey, P. “Consciousness and abilities of dream characters observed during lucid dreaming.” *Perceptual and Motor Skills* 68 (1989): 567–578.

**[4]** Mallett, R., & De Koninck, J. “Partial memory reinstatement while (lucid) dreaming to change the dream environment.” *Consciousness and Cognition* 83 (2020): 102974.

**[5]** Haar Horowitz, A., et al. “Targeted dream incubation at sleep onset can influence later dream content in REM sleep: a pilot study.” *Frontiers in Sleep* (2026).

**[6]** Abdellahi, M. E. A., et al. “Targeted memory reactivation in human REM sleep elicits detectable reactivation.” *eLife* 12 (2023): e84324.

**[7]** Konkoly, K. R., et al. “Creative problem-solving after experimentally provoking dreams of unsolved puzzles during REM sleep.” (2026).

**[8]** Loo, M.-R., & Cheng, S.-K. “Dream lucidity positively correlates with reality monitoring.” *Consciousness and Cognition* (2022).

**[9]** Loo, M.-R., & Cheng, S.-K. “The roles of recollection and familiarity in the positive association between dream lucidity and reality monitoring: Evidence from ERPs and EEG.” *Consciousness and Cognition* 136 (2025): 103947.

**[10]** Konkoly, K. R., et al. “Real-time dialogue between experimenters and dreamers during REM sleep.” *Current Biology* 31 (2021): 1417–1427.e6.
`,Yt="Explore the Dream: Lucid Dream Experiments, Dream Control and Research",yo="/lucid-dream-experiments/",qt=yo;let bn=null;function fo(){return bn||(bn=S(go)),bn}const bo=`# Loosen the Body: Body Ownership, Self-Location and Out-of-Body Experience

Most of the time, being located inside your body feels so obvious that it barely seems like an experience.

You do not wake up in the morning and consciously calculate:

**These hands are mine.**

**I am located behind these eyes.**

**The world is being seen from here.**

**When I move, this body moves with me.**

Those facts arrive already assembled.

But the assembly is not as simple as it feels.

Research on bodily self-consciousness increasingly treats the ordinary sense of embodiment as a construction made from several partly separable processes: body ownership, self-location, first-person perspective, agency, proprioception, touch, vision, and vestibular information about movement and gravity.[1]

That matters for this project because many experiences described near lucid dreaming, sleep paralysis, and out-of-body experience involve one or more of those components changing.

A person may feel that the body is distant.

Or enormous.

Or absent.

Or floating.

Or turning.

Or located somewhere else.

Or seen from another perspective.

The useful question is not immediately:

**Did I leave my body?**

The earlier question is:

**Which part of the ordinary body model changed?**

## The body you experience is a model

Your physical body is real.

Your experience of that body is constructed.

Those statements are compatible.

The brain continually combines vision, touch, proprioception, movement, internal bodily signals, and vestibular information into a working model of where the body is and which sensations belong to it.

Experiments can interfere with that integration.

The best-known example is the rubber hand illusion.

A person's real hand is hidden. A visible fake hand is placed nearby. When the real and fake hands are stroked in matching ways, many participants begin to experience some degree of ownership over the artificial hand.[2]

The hand did not physically move into the rubber object.

What changed was the experience of ownership.

That simple illusion tells us something important.

**Feeling that a body part is mine is an achievement of perception, not merely a logical conclusion.**

## Ownership is not the same as location

The ordinary bodily self contains multiple components.

One influential framework distinguishes at least:

**Body ownership** — this body or body part feels like mine.

**Self-location** — I feel located here.

**First-person perspective** — the world seems to be perceived from this point.

Research suggests these components can be manipulated separately and may depend on partly distinct neural systems.[1]

That distinction becomes useful around unusual states.

You might still feel that the dream body is yours while your perspective seems to float above it.

You might feel located somewhere in the room while the physical body remains clearly visible elsewhere.

You might lose the body almost entirely while perspective continues.

You might feel motion without having a clear visual perspective at all.

Instead of forcing all of those into one category, separate them.

The map becomes clearer.

## Full-body illusions move the apparent self

Researchers have extended body-ownership experiments beyond hands.

In full-body illusion studies, participants may view a virtual or filmed body while receiving synchronized visual and tactile stimulation. Under some conditions, people report increased identification with the seen body and changes in where they feel themselves to be located.[3]

In a landmark 2007 experiment, participants saw their own bodies from a displaced visual perspective while receiving synchronized touch. Their self-location shifted toward the seen virtual body.[4]

Another 2007 experiment produced an illusion in which participants experienced themselves as located outside their physical bodies while viewing the body from behind.[5]

These laboratory illusions are not identical to spontaneous out-of-body experiences.

They matter because they demonstrate that **self-location can be experimentally shifted by manipulating multisensory information**.

The feeling of being located exactly where the physical body is located is powerful.

It is not completely rigid.

## Perspective can loosen too

Normally, self-location and visual perspective agree.

You feel located where you see from.

But they can separate.

A person may feel located in one place while experiencing a visual perspective associated with another location.

Neurological reports and experimental work have repeatedly implicated the temporoparietal junction and nearby multisensory systems in experiences involving altered self-location and perspective.[6]

Again, this is not a final theory of every OBE.

It tells us that the experience of **where I am** and **where I see from** depends on neural processes that can be disturbed or experimentally manipulated.

For practice, that means you can observe these dimensions independently.

Where is the body?

Where is the sense of self?

Where is the viewpoint?

Are they still in the same place?

## The vestibular system matters

There is another ingredient that appears repeatedly in unusual body experiences.

The vestibular system helps represent head position, acceleration, movement, and orientation relative to gravity.

It contributes to the experience of:

up;

down;

turning;

falling;

floating;

rising;

being still;

and moving through space.

A review of vestibular contributions to bodily self-consciousness argues that vestibular information plays an important role in self-location and first-person perspective because it anchors the body to a spatial and gravitational reference frame.[7]

That makes several common sleep-edge sensations immediately interesting.

Floating.

Rocking.

Spinning.

Falling backward.

Rising upward.

Being pulled.

Turning inside the body.

These experiences do not have to be dismissed.

They also do not have to be treated as proof of literal separation.

They can first be described as **vestibular-motor experiences**.

That gives us something precise to investigate.

## Sleep paralysis contains a useful clue

Out-of-body reports sometimes occur during sleep paralysis.

Sleep paralysis is especially interesting because the person may feel aware while voluntary movement remains inhibited and dreamlike perception can intrude into the apparent bedroom.

Research on sleep-paralysis experiences has identified a cluster of vestibular-motor phenomena including floating, flying, falling, spinning, and apparent movement outside the physical body.[8]

A 2024 theoretical review examining links among out-of-body experiences, lucid dreaming, and sleep paralysis similarly highlights unusual bodily experiences, vibrations, altered gravity, and vestibular-motor hallucinations as overlapping features.[9]

These overlaps do not prove that all three states are the same.

They suggest shared mechanisms may contribute to some experiences.

The useful move is comparison.

When floating appears during sleep onset, lucid dreaming, sleep paralysis, or an OBE report, what stays the same?

What changes?

## Out-of-body experience is a description before it is an explanation

The phrase **out-of-body experience** describes a particular kind of experience.

It often includes some combination of:

feeling located outside the physical body;

seeing or sensing the physical body from elsewhere;

a shifted first-person perspective;

floating or movement;

a strong sense of reality;

and sometimes a feeling of separation or return.

The phrase does not, by itself, settle what caused the experience.

A 2025 scoping review examined 87 publications on OBEs and found that experiences occur in varied contexts: spontaneous episodes, sleep-related states, deliberate induction attempts, neurological conditions, and other situations.[10]

The review also notes that several explanatory frameworks remain in circulation, including physiological, psychological, and non-local consciousness interpretations.[10]

That is exactly the kind of uncertainty we want to preserve.

The experience can be taken seriously without pretending the explanation is settled.

## A strong sense of reality is still phenomenology

People often report that an OBE felt **more real than a dream**.

That is important data about the experience.

It is not automatically evidence for one ontology.

Dreams, false awakenings, hallucinations, psychedelic states, and ordinary waking perception can all carry powerful reality qualities.

The relevant report is:

**It felt completely real.**

Then ask:

What happened?

Where did perspective seem to be?

Was the physical body seen?

Was movement felt?

Was the environment accurate?

Was anything later verifiable?

The reality feeling belongs in the record.

The explanation belongs in the analysis.

## Loosening is not leaving

The title of this section is deliberate.

**Loosen the body.**

Not:

**Escape the body.**

Not:

**Prove the astral body.**

Not:

**Separate consciousness from matter.**

Loosening means reducing the automatic assumption that ownership, location, perspective, and movement must remain fused exactly as they are during ordinary waking.

You are learning to notice when those components become flexible.

That is already extraordinary enough.

If a later experience supports a stronger interpretation, it can be evaluated later.

There is no advantage in deciding early.

## Start with ownership

Before sleep, notice the ordinary sense that the physical body belongs to you.

Do not philosophize.

Feel it.

Hands.

Feet.

Face.

Chest.

The whole body's outline.

Then become curious about what happens as attention softens.

Does ownership remain equally strong everywhere?

Do the hands fade first?

Do the legs become vague?

Does the body seem larger or smaller?

Does it become difficult to locate individual parts?

Does the body remain yours while becoming spatially indistinct?

These differences matter.

A body can become faint without becoming alien.

## Then notice location

Ask a stranger question:

**Where do I feel located?**

Do not answer with anatomy.

Notice the experience.

Many people will initially report something like the head, face, eyes, chest, or the body as a whole.

There is no correct answer.

Now notice whether that location changes as you approach sleep.

Does the center feel lower?

Higher?

Wider?

Less definite?

Does it seem to move without the physical body moving?

Earlier chapters trained attention and imagined movement.

Here the target is self-location itself.

## Perspective is another variable

With eyes closed, visual perspective can become ambiguous.

If imagery forms, ask:

Where is the scene being seen from?

Are you still looking from the physical eyes?

Does the scene seem in front of the face?

Around you?

Are you inside it?

Above it?

Behind yourself?

Do not force a third-person view.

If perspective shifts spontaneously, notice it.

A useful report is:

**The viewpoint moved upward while the body still felt below me.**

That contains more information than:

**I almost projected.**

## Movement without physical movement

Vestibular-motor sensations deserve their own category because they are so common in transition reports.

You may feel:

rocking;

swaying;

rotation;

falling;

floating;

lifting;

sliding;

being pulled;

being pushed;

or moving through space.

Earlier, you practiced imagined movement.

Now ask whether the movement still feels imagined.

Did you deliberately create the rocking?

Did it begin continuing on its own?

Did a stable direction appear?

Did self-location move with it?

Did perspective move?

Did ownership change?

The more carefully these components are separated, the more useful the record becomes.

## Do not chase vibrations

Some traditions and OBE communities place enormous emphasis on vibrations.

Vibration reports are real as reports.

They can involve buzzing, trembling, electrical feelings, internal shaking, or whole-body intensity.

But they are not required.

They are not a certificate.

A quiet shift in self-location may be more relevant than dramatic vibration.

A person may have a vivid OBE without a remembered vibration phase.

Another may experience strong vibration and simply fall asleep.

Earlier we established:

**Drama is not depth.**

Keep that rule.

## Try reducing the physical body's priority

If the physical body remains overwhelmingly present, do not fight it.

Instead reduce how much work you give it.

Let the body be still.

Allow contact with the mattress to remain.

Do not repeatedly check fingers, breathing, or position unless comfort or safety requires it.

Move attention toward internally generated spatial experience.

Where does imagined movement happen?

Where is the scene?

Where is the sense of self?

The goal is not numbness.

It is reduced priority.

The physical body can remain present while another spatial model becomes more compelling.

## Let contradictions exist

You may briefly experience two locations.

Part of you knows the body is in bed.

Another part feels as if it is standing somewhere else.

Do not rush to resolve the contradiction.

Mixed states are possible.

The brain does not need to honor our preferred categories every second.

Observe both.

**Body in bed.**

**Self near the door.**

Interesting.

What happens next?

## Do not manufacture danger

Nothing in this practice requires:

sleep deprivation;

breath restriction;

hyperventilation;

pain;

drugs;

supplements;

fasting;

extreme posture;

or forcing sleep paralysis.

Protect sleep.

If practice becomes uncomfortable, stop and sleep normally.

The target is observation of naturally changing bodily self-experience.

Not endurance.

## What would count as stronger evidence?

Suppose you experience yourself floating above the bed and seeing the room.

That is already a meaningful subjective event.

A stronger external claim requires stronger evidence.

Did the room contain details you already knew?

Were there inaccuracies?

Was there information you could not have known?

Was the target selected in advance?

Was the report written before checking?

Could chance, memory, inference, or prior exposure explain the result?

Those questions belong later in **Test the Experience**.

For now, preserve the event without upgrading it.

## Traditional maps can wait

Different traditions describe separation using different models.

Astral body.

Subtle body.

Dream body.

Soul.

Double.

Energy body.

Vehicle of consciousness.

Those frameworks are historically and culturally interesting.

They may also shape expectation.

This section does not need to choose among them.

First learn what your experience actually does.

Does ownership loosen?

Does location shift?

Does perspective detach?

Does movement become autonomous?

Does a complete environment appear?

The map comes after the territory.

## Summary

Ordinary embodiment feels unified, but research suggests it depends on several partly separable processes.

Body ownership is the experience that a body or body part is mine.

Self-location is the experience of where I am.

First-person perspective is the location from which the world seems to be perceived.

Vestibular processing contributes information about movement, orientation, and gravity.

Laboratory experiments using rubber-hand and full-body illusions show that ownership and self-location can be altered through multisensory manipulation.[2][3][4][5]

Neurological and experimental research implicates multisensory and vestibular processing, including regions around the temporoparietal junction, in altered self-location and perspective.[6][7]

Sleep paralysis and sleep-related OBE reports frequently include vestibular-motor experiences such as floating, falling, spinning, flying, and apparent movement outside the physical body.[8][9]

The 2025 OBE scoping review concludes that OBEs are heterogeneous and occur across many contexts, while several competing explanatory frameworks remain unresolved.[10]

The practical lesson is simple:

**Loosen the components before deciding what they mean.**

Notice ownership.

Notice location.

Notice perspective.

Notice movement.

Notice when they stop agreeing.

## Experiment

### Loosen the Map

Practice only when you are already comfortable and ready for ordinary sleep.

Do not prolong the exercise if you become frustrated or overtired.

Begin by noticing the physical body normally.

Then track four dimensions.

### Ownership

Ask:

**What still feels clearly mine?**

Notice hands, feet, face, chest, and whole-body outline.

Record whether ownership feels:

clear;

faint;

expanded;

contracted;

fragmented;

or unchanged.

### Location

Ask:

**Where do I feel located?**

Do not answer intellectually.

Notice the felt center.

If it changes, record the direction and sequence.

### Perspective

If imagery or a scene appears, ask:

**Where is this being perceived from?**

Record whether perspective feels:

at the physical eyes;

in front of the body;

above;

behind;

inside another scene;

or unclear.

### Movement

Notice any spontaneous vestibular-motor experience.

Record:

rocking;

turning;

floating;

falling;

lifting;

sliding;

pulling;

pushing;

or none.

Also record whether you intentionally began the movement or it appeared autonomously.

### Compare the components

Afterward, write a short sequence.

For example:

**body heavy → hands fade → rocking starts → self feels higher → scene appears**

or:

**body clear → buzzing → no location shift → slept**

or:

**floating → viewpoint near ceiling → body still felt below → woke**

or:

**no unusual body change → slept normally**

Do not score one sequence as superior.

Across several attempts, ask:

**Which component loosens first for me—ownership, location, perspective, or movement?**

And:

**Do those components usually move together, or can they separate?**

## Intention

**I notice where the sense of body ends and where the experience begins to reorganize.**

## References

**[1]** Serino, A., et al. “Bodily ownership and self-location: components of bodily self-consciousness.” *Consciousness and Cognition* 22 (2013): 1239–1252. DOI: 10.1016/j.concog.2013.08.013.

**[2]** Golaszewski, S., et al. “Neural mechanisms underlying the Rubber Hand Illusion: A systematic review of related neurophysiological studies.” *Brain and Behavior* 11 (2021): e02124. DOI: 10.1002/brb3.2124.

**[3]** Pia, L., et al. “Full body illusion and cognition: A systematic review of the literature.” *Neuroscience & Biobehavioral Reviews* 143 (2022): 104926. DOI: 10.1016/j.neubiorev.2022.104926.

**[4]** Lenggenhager, B., Tadi, T., Metzinger, T., & Blanke, O. “Video ergo sum: manipulating bodily self-consciousness.” *Science* 317 (2007): 1096–1099. DOI: 10.1126/science.1143439.

**[5]** Ehrsson, H. H. “The experimental induction of out-of-body experiences.” *Science* 317 (2007): 1048. DOI: 10.1126/science.1142175.

**[6]** Blanke, O., Ortigue, S., Landis, T., & Seeck, M. “Stimulating illusory own-body perceptions.” *Nature* 419 (2002): 269–270. DOI: 10.1038/419269a.

**[7]** Lopez, C., et al. “The vestibular system: a spatial reference for bodily self-consciousness.” *Frontiers in Integrative Neuroscience* 8 (2014): 31. DOI: 10.3389/fnint.2014.00031.

**[8]** Cheyne, J. A., & Girard, T. A. “The body unbound: vestibular-motor hallucinations and out-of-body experiences.” *Cortex* 45 (2009): 201–215. DOI: 10.1016/j.cortex.2007.05.002.

**[9]** “Out-of-body experiences in relation to lucid dreaming and sleep paralysis: A theoretical review and conceptual model.” *Neuroscience & Biobehavioral Reviews* (2024): 105770. DOI: 10.1016/j.neubiorev.2024.105770.

**[10]** “Out of body experiences: Scoping review.” *EXPLORE* 21 (2025): 103196. DOI: 10.1016/j.explore.2025.103196.
`,jt="Loosen the Body: Body Ownership, Self-Location and Out-of-Body Experience",wo="/out-of-body-experience-body-ownership/",_t=wo;let wn=null;function vo(){return wn||(wn=S(bo)),wn}const To=`# Cross the Threshold: Astral Projection, OBE Techniques and Lucid Dreaming

If you search for **astral projection techniques**, you will find a remarkable number of instructions.

Imagine a rope.

Roll out of the body.

Float upward.

Climb an invisible ladder.

Visualize an elevator.

Wait for vibrations.

Sit up without moving.

Wake the mind while the body sleeps.

Become lucid and leave the dream.

Some writers treat these as completely different methods.

Others treat them as variations of the same event.

Science is not yet in a position to settle that argument.

What it can do is help us separate the parts.

The research term **out-of-body experience**, or OBE, describes the subjective experience of being located outside the physical body. The traditional phrase **astral projection** usually adds a stronger interpretation: consciousness or an “astral body” is believed to leave the physical body and travel independently.[1][2]

Lucid dreaming is different again. In a lucid dream, you know you are dreaming while the dream continues.

Yet the boundaries are not perfectly clean.

A 2024 theoretical review argues that sleep-related OBEs, lucid dreams, and sleep paralysis may share aspects of REM-state dissociation and wake-sleep transition processes while remaining phenomenologically distinguishable.[3]

A 2025 scoping review likewise found that OBEs occur in many contexts, may happen spontaneously or be deliberately induced, and can be facilitated by experiences such as lucid dreaming or sleep paralysis.[4]

That gives us a useful practical position.

You do not need to decide what astral projection **is** before testing what people mean by an astral-projection **technique**.

## The techniques are trying to solve the same problem

Most induction methods attempt some version of this:

**keep awareness while the ordinary body model becomes less dominant.**

That is the bridge connecting much of the material we have already practiced.

Dream recall keeps experience available after waking.

Reality checks and MILD train recognition.

Meditation trains attention.

Visualization develops internally generated imagery.

Sleep-edge observation helps you notice when perception becomes autonomous.

Imagined movement trains motor imagery without physical movement.

Body-schema work separates ownership, location, perspective, and motion.

Stabilization helps you remain inside an internally generated environment.

Astral-projection methods often combine several of these skills and then give the transition a different name.

## “Astral projection” is a historical model

The phrase belongs to occult and psychical-research traditions rather than modern sleep science.

Twentieth-century astral-projection literature described a subtle or astral body that could separate from the physical body, sometimes while remaining connected by a “silver cord.” Writers such as Oliver Fox, Sylvan Muldoon, and Hereward Carrington described deliberate methods involving sleep, visualization, dream awareness, imagined movement, and apparent separation.[2][5]

These sources matter historically because many modern online methods descend from them.

They are not controlled evidence that an astral body exists.

That distinction lets us keep the useful experimental material without silently inheriting the metaphysics.

## Out-of-body experience is the neutral description

Modern researchers generally use **out-of-body experience** to describe the phenomenology rather than asserting a mechanism.

The 2025 scoping review analyzed 87 publications and found substantial variation in OBE circumstances, phenomenology, precipitating conditions, deliberate induction, and interpretation.[4]

The review includes physiological, psychological, and non-local consciousness hypotheses.

No single explanation closes the field.

So when the practice produces:

**I felt myself rise out of the body,**

record that.

Do not automatically rewrite it as:

**I proved my consciousness left my brain.**

Do not automatically rewrite it as:

**nothing happened because it was only a hallucination.**

The first sentence preserves the experience.

The later explanation remains testable.

## Lucid dreaming gives us the strongest induction evidence

If the goal is to maintain awareness while sleep and dreaming develop, lucid-dream research offers the best experimental foundation.

A 2012 systematic review found that no lucid-dream induction technique worked reliably on demand, although several were promising.[6]

A newer systematic review of the following decade found stronger evidence for the Mnemonic Induction of Lucid Dreams, or MILD, while also identifying SSILD and other methods as promising but still in need of replication.[7]

The International Lucid Dream Induction Study tested combinations of reality testing, Wake Back to Bed, MILD, SSILD, and a hybrid method in 355 participants. MILD and SSILD performed similarly in that study, and better dream recall and quickly returning to sleep predicted success.[8]

Laboratory work combining Wake Back to Bed with MILD has also produced lucid dreams, including signal-verified lucid dreams, although success depends strongly on timing and procedure.[9][10]

Why does this matter in a chapter about astral projection?

Because many “projection” methods occur at exactly the same boundary:

**awareness continues while waking sensory dominance decreases and dreamlike experience becomes autonomous.**

That does not prove the resulting states are identical.

It gives us a better-controlled doorway to compare.

## Route 1: Recognize the dream, then change the experiment

One route begins with ordinary lucid dreaming.

Become lucid.

Stabilize.

Then stop treating the dream environment as the only possible frame.

Notice the dream body.

Notice self-location.

Ask whether perspective can move independently.

Try floating upward.

Lie down inside the dream.

Close the dream eyes.

Ask for an out-of-body experience.

Or simply observe whether the scene changes when attention turns toward the sleeping body.

Some practitioners describe this as moving from lucid dreaming into astral projection.

Research does not currently establish that a literal transition between ontological realms occurred.

But the sequence is useful because the lucid state gives you enough awareness to study the change.

Record the exact transition.

**Lucid dream → body sensation returns → floating → bedroom-like scene**

is better evidence than:

**I projected.**

## Route 2: Wake-initiated lucid dreaming

Another route tries to preserve awareness directly through sleep onset.

In lucid-dream terminology, this family is often called **wake-initiated lucid dreaming**, or WILD.

The principle is familiar:

relax the body;

maintain light awareness;

observe hypnagogia;

avoid repeatedly checking the physical body;

allow internally generated imagery or movement to become autonomous;

recognize the transition without interrupting it.

This is very close to many traditional astral-projection instructions.

The major practical difference is usually the interpretation of what happens next.

A lucid-dream framework says:

**the dream formed while awareness continued.**

An astral-projection framework may say:

**the subtle body separated while awareness continued.**

The experience may initially look similar.

The explanatory claim is different.

## Route 3: Imagined movement

Older astral-projection manuals frequently use imagined motion.

Flying.

Rising in an elevator.

Rocking.

Rolling.

Climbing.

Modern practitioners add techniques such as an imagined rope.

These methods are plausible as attentional and vestibular-motor exercises because motor imagery can occur without physical movement, and altered visual-vestibular integration can experimentally shift self-location and produce OBE-like sensations.[11]

A 2024 mixed-reality experiment used combined visual and vestibular stimulation to induce elevated self-location, disembodiment, and lightness in healthy participants.[11]

That does not validate a rope technique.

It tells us why imagined motion deserves careful observation.

The important question is not:

**Did I imagine rolling hard enough?**

It is:

**When did the movement stop feeling deliberately imagined and start behaving like autonomous experience?**

That is the threshold skill.

## Route 4: The roll-out

A common practitioner method is to wait until the physical body feels asleep or extremely distant, then attempt to roll sideways without moving the physical muscles.

This is not the same as actually rolling in bed.

The action is performed in the imagined, dream, or felt body.

If nothing happens, stop.

If the imagined roll becomes vivid, continue observing.

Possible outcomes include:

nothing;

ordinary imagery;

a lucid dream scene;

a sensation of rotation;

a false awakening;

sleep paralysis;

an OBE-like experience;

or waking up.

Do not classify the result before you experience it.

## Route 5: The rope or climbing method

The imagined-rope method is another version of internal movement.

Imagine that your nonphysical or dream hands grasp a rope above you.

Climb without moving the physical arms.

The useful component is not the rope as a magical object.

The useful component is sustained motor and tactile imagery directed away from the ordinary body's resting position.

If you have weak visual imagery, that is fine.

Do not picture the rope.

Feel grip.

Pull.

Alternate hands.

Notice upward motion.

If the experience becomes autonomous, reduce deliberate effort.

The rope is a scaffold for attention.

Not evidence.

## Route 6: Floating or rising

Some people find upward movement easier than climbing.

Imagine lightness.

Imagine the center of self rising.

Imagine the mattress moving downward instead.

Or simply attend to any spontaneous floating sensation that already appears.

This route aligns with the vestibular-motor qualities often reported in OBEs and sleep-related transitions.[3][11]

Again, the useful event is the change in self-location or motion.

Not the story attached to it.

## Route 7: Sleep paralysis as a transition

Sleep paralysis sometimes contains a striking combination:

awareness;

REM-related muscle atonia;

bedroom imagery;

sensed presence;

vibrations;

floating or movement sensations;

and sometimes OBE-like experience.

That makes it tempting to use sleep paralysis deliberately.

Do not.

There is no need to induce paralysis.

If it occurs naturally, recognize it.

The body is temporarily unable to perform ordinary voluntary movement because REM atonia has persisted into awareness.

Breathe normally.

Do not struggle violently.

If you are comfortable experimenting, shift attention away from attempting physical movement and toward dreamlike movement, imagery, or self-location.

If you are frightened, focus on waking and ordinary movement.

The experiment is optional.

Sleep paralysis is not a required doorway.

## Route 8: MILD and SSILD as indirect entry

Not every threshold attempt has to happen consciously from the beginning.

MILD uses prospective memory and intention to recognize a later dream.

SSILD cycles attention among visual, auditory, and bodily sensations before sleep.

Both have empirical support for increasing lucid dreaming in some conditions.[7][8]

That makes them useful indirect tools.

You might use MILD with an intention such as:

**When I recognize the dream, I notice where I feel located.**

Or use SSILD as a gentle sensory practice before sleep without expecting immediate separation.

The technique creates an opportunity.

The later experiment determines what you do with it.

## Wake Back to Bed: useful, but protect sleep

Wake Back to Bed, or WBTB, is common in lucid-dream and astral-projection communities.

The idea is to sleep for several hours, wake briefly, practice an induction method, then return to sleep when REM sleep is more likely.

Research shows that timing matters.

Laboratory studies combining WBTB with MILD have produced lucid dreams, but earlier interruption can reduce success, and procedures that excessively disturb sleep are not automatically better.[9][10]

So the rule remains:

**protect sleep first.**

Do not repeatedly set alarms all night.

Do not turn chronic sleep deprivation into a technique.

If WBTB harms your sleep, it is a bad method for you.

## Vibrations are optional

Many astral-projection accounts describe vibrations as a sign that separation is near.

The sensations may be intense.

Buzzing.

Electrical waves.

Internal trembling.

Rapid pulsing.

Whole-body oscillation.

They are worth recording.

They are not a requirement.

Current research does not establish a specific vibration signature that confirms an OBE or astral projection.

A dramatic vibration followed by waking is still a vibration followed by waking.

A quiet shift in self-location followed by a complete OBE-like scene is still an OBE-like experience.

Do not chase the special effect.

## Do not move too early

There is a recurring problem across these techniques.

You notice something interesting.

Then you check whether it worked.

You move the physical hand.

You open the physical eyes.

You test the mattress.

The threshold collapses.

If the experience begins continuing on its own, let it continue.

Use the minimum intervention required.

Remember the earlier rule:

**recognition before intervention.**

Then:

**stability before ambition.**

## A complete scene changes the task

Once a stable environment forms, stop inducing.

You are no longer trying to cross the threshold.

You are inside an experience.

Orient.

Look.

Touch.

Move.

Check lucidity.

Check self-location.

Notice whether a physical body is present, remembered, visible, or irrelevant.

Then explore.

Trying to keep “separating” after a complete scene has formed may simply destabilize the state.

## What would distinguish an OBE from a lucid dream?

There is no universally accepted one-question test.

Phenomenologically, sleep-related OBEs often emphasize apparent separation, displaced self-location, seeing the physical body, or perceiving from a location outside it.

Lucid dreams emphasize awareness that one is dreaming.

But overlap exists.

A person might have both at once.

The 2024 review specifically argues that these states may share sleep-state mechanisms while retaining phenomenological differences.[3]

So record dimensions rather than forcing a label:

Was I aware I was dreaming?

Did I feel outside the physical body?

Did I see the physical body?

Where was my viewpoint?

Did I experience a dream environment?

Did I believe I was awake?

Did I verify that afterward?

The label can wait.

## What would count as evidence for literal separation?

This is where the standard changes.

A vivid experience is evidence that the experience happened.

It is not automatically evidence that perception occurred independently of the physical sensory system.

A stronger test needs information.

A target.

A procedure decided in advance.

A report recorded before checking.

Controls against guessing, prior knowledge, sensory leakage, and retrospective interpretation.

That belongs in the next research stage.

Astral projection is easiest to believe when the experience is powerful.

It is easiest to study when the claim is specific.

## Summary

Astral projection is a traditional term that generally implies consciousness or a subtle body leaving the physical body.

Out-of-body experience is a more neutral research term describing the subjective experience of being located outside the physical body.

Lucid dreaming is the awareness that one is dreaming while the dream continues.

These categories overlap in sleep-related reports but should not be treated as identical.[3][4]

Scientific evidence is strongest for lucid-dream induction. MILD has the most consistent support among cognitive lucid-dream techniques, while SSILD and combined Wake Back to Bed procedures also have promising evidence under specific conditions.[6][7][8][9][10]

Evidence for deliberate OBE induction is much thinner.

Traditional astral-projection methods such as rolling out, climbing an imagined rope, rising, floating, or visualizing upward movement can be treated as experiments in motor imagery, body-schema loosening, and vestibular-like experience rather than as proven mechanisms of literal separation.

The threshold method is:

**maintain awareness;**

**let the ordinary body model lose priority;**

**notice when imagined experience becomes autonomous;**

**stabilize what appears;**

**record before interpreting.**

## Experiment

### Choose One Door

Do not combine every technique in one attempt.

Choose one route for several sessions before comparing.

### Lucid route

Use your normal lucid-dream practice.

When lucid:

stabilize;

notice the dream body;

notice self-location;

then ask whether perspective or location can shift independently.

Record whether the result remained a lucid dream, became OBE-like, changed scenes, or ended.

### Imagined movement route

At a comfortable sleep edge, choose one simple internal movement:

**roll**

**rise**

**float**

or:

**climb**

Do not move the physical body deliberately.

Notice the exact point at which the movement:

remains voluntary imagery;

becomes unusually vivid;

begins continuing on its own;

changes self-location;

produces a scene;

or disappears.

### Sleep-edge route

Remain lightly aware while hypnagogia develops.

Do not force imagery.

If movement, vibration, or a scene appears, observe before intervening.

Record the transition sequence.

### MILD / SSILD route

Use one evidence-supported lucid-dream induction method rather than mixing several.

If using MILD, choose one simple future intention.

If using SSILD, cycle gently through visual, auditory, and bodily sensation according to the method, then allow sleep.

Do not treat wakefulness itself as success.

### Natural sleep-paralysis route

Only if sleep paralysis occurs spontaneously and you feel calm:

notice the state;

avoid forceful physical struggle;

shift attention toward internally generated movement or imagery;

stop if the experience becomes frightening.

Never deliberately deprive yourself of sleep to induce paralysis.

### Record the crossing

After each attempt, write:

**method**

**sleep context**

**first unusual change**

**ownership**

**self-location**

**perspective**

**movement**

**dream awareness**

**physical-body awareness**

**environment**

**outcome**

Then write one final line:

**What happened before I named it?**

## Intention

**I recognize the threshold, choose one method, and observe what the experience becomes.**

## References

**[1]** Cambridge Dictionary. “Astral projection.” Cambridge University Press. Definition describes the belief that consciousness leaves the physical body and travels in an astral plane.

**[2]** “Astral Projection.” *Encyclopedia of Occultism and Parapsychology*, Encyclopedia.com. Historical overview of astral-projection terminology and literature.

**[3]** Campillo-Ferrer, T., et al. “Out-of-body experiences in relation to lucid dreaming and sleep paralysis: A theoretical review and conceptual model.” *Neuroscience & Biobehavioral Reviews* 163 (2024): 105770. DOI: 10.1016/j.neubiorev.2024.105770.

**[4]** Moix, J., et al. “Out of body experiences: Scoping review.” *EXPLORE* 21 (2025): 103196. DOI: 10.1016/j.explore.2025.103196.

**[5]** “Out-of-the-Body Travel.” *Encyclopedia of Occultism and Parapsychology*, Encyclopedia.com. Historical discussion of Oliver Fox, Sylvan Muldoon, Hereward Carrington, lucid-dream transitions, and imagined-movement methods.

**[6]** Stumbrys, T., Erlacher, D., Schädlich, M., & Schredl, M. “Induction of lucid dreams: A systematic review of evidence.” *Consciousness and Cognition* 21 (2012): 1456–1475. DOI: 10.1016/j.concog.2012.07.003.

**[7]** Tan, S., Fan, J., & Wei, D. “A systematic review of new empirical data on lucid dream induction techniques.” *Journal of Sleep Research* (2023). PMID: 36408823.

**[8]** Aspy, D. J. “Findings From the International Lucid Dream Induction Study.” *Frontiers in Psychology* 11 (2020): 1746. DOI: 10.3389/fpsyg.2020.01746.

**[9]** Erlacher, D., & Stumbrys, T. “Wake Up, Work on Dreams, Back to Bed and Lucid Dream: A Sleep Laboratory Study.” *Frontiers in Psychology* 11 (2020): 1383. PMID: 32670163.

**[10]** Erlacher, D., et al. “Combining Wake-Up-Back-to-Bed with Cognitive Induction Techniques: Does Earlier Sleep Interruption Reduce Lucid Dream Induction Rate?” (2022). PMID: 35645242.

**[11]** Chancel, M., et al. “Out-of-body illusion induced by visual-vestibular stimulation.” *iScience* 27 (2024): 108547. DOI: 10.1016/j.isci.2023.108547.
`,Gt="Cross the Threshold: Astral Projection, OBE Techniques and Lucid Dreaming",ko="/astral-projection-obe-techniques/",Ut=ko;let vn=null;function Io(){return vn||(vn=S(To)),vn}const xo=`# Test the Experience: Can Lucid Dreams and Out-of-Body Experiences Be Verified?

Some experiences are convincing before they are verified.

A lucid dream can feel completely real.

An out-of-body experience can feel completely real.

A false awakening can feel completely real.

A memory can feel certain and still be wrong.

That does not make the experience worthless.

It means **certainty of experience and certainty of explanation are different things.**

Earlier, we practiced noticing what happened before deciding what it meant.

Now we make the next move.

We test.

## First decide what kind of claim you are making

Consider three statements:

**I felt myself floating above my body.**

**I saw my bedroom from above.**

**I correctly perceived a hidden image while my physical eyes could not see it.**

The first is a report of subjective experience.

The second adds a claim about perceived environment.

The third adds a claim that can be independently checked.

Those require different standards of evidence.

The first can be honestly reported from memory.

The second can be compared with known room details.

The third needs an experimental target and a method that prevents ordinary access to the answer.

Most confusion around unusual experiences begins when those levels are blended together.

## Lucid dreaming shows that subjective states can be objectively marked

Lucid dreaming gives us one of the best examples of how an unusual private experience can become experimentally accessible.

In 1981, Stephen LaBerge and colleagues demonstrated that lucid dreamers could perform pre-agreed eye-movement signals while remaining in unequivocal REM sleep.[1]

The dreamer experienced lucidity internally.

The eye signal created an external timestamp.

That did not prove every claim made inside a lucid dream.

It verified something specific:

**the person was in REM sleep and signaled that they knew they were dreaming.**

That distinction is the heart of good experimental design.

A measurement does not need to prove everything.

It needs to test the claim it was designed to test.

## Real-time dream communication raised the standard further

In 2021, researchers from four independent laboratories showed that some lucid dreamers could receive questions from experimenters and respond while still asleep in REM.[2]

Participants correctly answered some spoken or flashed questions using eye movements or facial signals.

They could perform simple calculations.

They could process novel information.

They could communicate from inside the dream state.

This is remarkable.

It also demonstrates what strong evidence looks like.

The researchers did not ask:

**Did something amazing happen?**

They created specific inputs.

They established specific response signals.

They recorded physiological sleep state.

They compared correct and incorrect answers.

The claim became narrow enough to test.

## Verification becomes stronger when the target is outside the experience

Suppose you have an OBE-like experience and see a red book on top of a cabinet.

If the book was already there and you had seen it before, the experience may have reconstructed a known detail.

If you did not remember seeing it, memory may still have played a role.

If someone placed the book there after you went to sleep and you had no ordinary access to that information, the claim becomes more interesting.

Now suppose the target is not simply a red book.

A computer randomly selects one image from a large set after you are asleep.

The image is displayed where it cannot be seen from the bed.

No one interacting with you knows the selected image.

You record your description before anyone reveals the target.

Now the test is much stronger.

Each design decision removes an ordinary explanation.

## Hidden targets are an old idea

Researchers have used hidden visual targets in attempts to test claims of perception during near-death experiences and OBEs.

The logic is straightforward.

Place a target where it can only be seen from an unusual elevated viewpoint.

If someone later reports an OBE and identifies the target accurately, compare the report with what was actually displayed.

This sounds simple.

In practice it is difficult.

The person must have the relevant experience.

They must direct attention toward the target.

They must remember the information.

They must survive or wake.

Researchers must confirm that the target was actually present.

The target must not leak through ordinary channels.

And enough trials are needed to distinguish a real effect from coincidence.

## AWARE tested this during cardiac arrest

The AWARE studies attempted to investigate awareness during cardiac arrest using prospective methods.

The first AWARE study included objective visual and auditory tests alongside interviews with cardiac-arrest survivors.[3]

A small proportion of survivors reported explicit memories or awareness associated with resuscitation. One case included verifiable auditory and visual details from the resuscitation period.

But the hidden-target problem remained difficult because so few participants survived, remembered an experience, and had been in a location where a target test could meaningfully occur.

AWARE II expanded the effort across multiple hospitals and included audiovisual testing plus EEG and cerebral oxygen monitoring during CPR.[4]

Among interviewed survivors, some reported experiences suggestive of consciousness.

Nobody identified the visual image.

One participant identified the auditory stimulus.

The correct way to report that is exactly what happened.

Not:

**AWARE proved consciousness leaves the body.**

Not:

**AWARE disproved every OBE claim.**

The visual target produced no identification in that sample.

The auditory test produced one identification.

The physiological recordings also showed that organized EEG activity could sometimes emerge during prolonged CPR.

Different findings answer different questions.

## A failed target test is still useful

Suppose your hidden target was a blue triangle.

You experienced floating above the room.

You confidently recorded:

**yellow circle.**

That is not a failed night.

It is a result.

If you rewrite the report after seeing the answer, the experiment becomes worthless.

If you decide that yellow was “close enough” because both are shapes, the experiment becomes weaker.

If you keep the miss, you are doing science.

The point of a test is to give reality a chance to disagree with you.

## Decide the success rule before the attempt

This prevents one of the easiest forms of self-deception.

Imagine a target set containing:

red triangle;

blue square;

green star;

yellow circle.

Before sleep, define success:

**exact color and exact shape.**

Now there is little room for reinterpretation.

If your report says:

**green star**

and the target is green star, that is a hit.

If your report says:

**green light, maybe a flower or star**

and the target is green star, the result is suggestive but less clean.

If your report says:

**something bright**

almost any target could be made to fit.

Specificity matters.

## Randomization matters

If you always use the same target for several nights, memory and expectation contaminate the test.

Use a pool of possible targets.

Select one randomly.

Better still, let software select it.

The larger and more distinct the target set, the lower the chance of an accidental exact match.

Do not choose the answer yourself after deciding what you hope to see.

## Blinding matters

A person can unintentionally reveal information.

Tone of voice.

Facial expression.

Where they look.

When they hesitate.

A comment made before sleep.

A device notification.

If another person prepares the target, avoid interacting about the answer until your report is complete.

A stronger design is **double-blind**:

the participant does not know the target;

the person collecting the report does not know the target either.

Only after the report is locked is the target revealed.

You do not need a laboratory to understand why this helps.

It reduces leakage.

## Timestamp the report

Memory is editable.

We do not experience memory as editing.

We usually experience it as remembering.

That makes time-stamped reports valuable.

Immediately after waking or ending the attempt, record:

what happened;

what you perceived;

how confident you are;

and your exact target guess.

Then stop.

Do not research the target.

Do not walk into the room.

Do not ask anyone.

Lock the report first.

A note with an automatic timestamp is better than remembering later what you “definitely wrote down.”

## Separate description from scoring

Write the raw description before trying to make it match anything.

For example:

**I saw something tall and dark with a bright white mark near the top. It felt rectangular.**

Then reveal the target.

If the target is a black playing card with a white moon, compare them.

Do not rewrite:

**I saw the moon card.**

You did not.

You saw what you recorded.

The raw report is the data.

## Confidence is data too

Record confidence before checking.

**20%**

**50%**

**90%**

Now you can ask whether your strongest experiences are actually more accurate.

Maybe they are.

Maybe confidence and accuracy are unrelated.

That is an interesting result.

A powerful sense of reality may predict something.

Or it may not.

Do not assume.

Measure.

## Repetition matters more than one spectacular hit

Suppose you correctly identify a hidden target once.

Interesting.

Now repeat.

Extraordinary claims become stronger when performance survives repeated trials.

One dramatic event is vulnerable to:

chance;

memory contamination;

target leakage;

flexible scoring;

selective reporting;

and coincidence.

Twenty preregistered attempts with a clear scoring rule tell us far more than one legendary night.

## Keep misses

This rule deserves its own section.

People remember hits.

People forget misses.

This creates a distorted personal database.

If you attempt a target experiment twenty times and remember only the two striking matches, the method will look far more effective than it was.

Keep every attempt.

Including:

nothing happened;

fell asleep;

lucid dream but forgot target;

OBE-like event but never looked;

wrong target;

vague answer;

exact hit.

The denominator matters.

## Do not move the goalposts

Suppose the target is **elephant**.

You report:

**large gray object.**

That might be interesting.

But if your success criterion was exact identification, it is not an exact hit.

Do not change the scoring rule after seeing the target.

This is why researchers preregister hypotheses and analysis plans.

You can imitate the principle informally:

write the rule first.

Then obey it.

## A lucid dream can be verified without verifying dream content

This is another essential distinction.

A lucid dream can be physiologically verified using REM recording and pre-agreed signals.[1]

That verifies lucidity during sleep.

It does not establish that every dream perception corresponds to something outside the dream.

Likewise, real-time communication can verify that a sleeping lucid dreamer heard a question and answered correctly.[2]

That proves information crossed between the laboratory and the dreamer under those conditions.

It does not prove telepathy.

The verified claim is narrower.

Narrow claims are a strength.

## Personal experiments can still be rigorous

You probably do not have a sleep laboratory.

You do not need one to improve the quality of your personal evidence.

A useful personal protocol can include:

a target selected without your knowledge;

a sufficiently large target pool;

an exact success rule;

a timestamped report;

no target checking before recording;

every trial retained;

and a later comparison.

This will not produce laboratory-grade evidence by itself.

It will produce much better evidence than memory and enthusiasm alone.

## Avoid dangerous verification

Do not use risky conditions to make an experiment feel more serious.

Do not attempt targets while driving.

Do not use heights.

Do not restrict oxygen.

Do not induce cardiac events.

Do not take unknown drugs.

Do not deprive yourself of sleep repeatedly.

Do not arrange situations where failure to wake creates danger.

A good experiment reduces confounds.

It does not increase physical risk.

## Verification can also test ordinary questions

Not every experiment needs to test paranormal perception.

You can test:

Does MILD increase my lucid-dream rate?

Does a later alarm improve lucidity or only reduce sleep?

Does SSILD work better for me than MILD?

Does imagined rolling produce more vestibular sensations than imagined floating?

Does strong vibration predict a successful transition?

Does dream stabilization actually extend my lucid dreams?

Does confidence predict target accuracy?

Does practicing dream recall improve remembered detail?

These questions are easier to test and can teach you how to run cleaner experiments before attempting extraordinary ones.

## What would change your mind?

This may be the most important experimental question.

Before testing, ask:

**What result would count against my current belief?**

If the answer is:

**nothing,**

you are not running a test.

You are performing a ritual of confirmation.

That may still have personal meaning.

It is not verification.

A test must allow failure.

## Skepticism and wonder can cooperate

Skepticism does not require contempt.

Wonder does not require credulity.

You can have an extraordinary experience and investigate it carefully.

You can remain open to a non-local interpretation and still demand controls.

You can favor a neurological explanation and still admit when evidence does not fit comfortably.

The experiment is where those attitudes meet.

The question is not:

**Which side am I on?**

It is:

**What observation would help distinguish the models?**

## Summary

Lucid dreaming provides a clear example of subjective experience becoming objectively testable.

Pre-agreed eye signals verified lucid awareness during REM sleep decades ago.[1]

Modern experiments have gone further, demonstrating two-way communication between researchers and some lucid dreamers during polysomnographically verified REM sleep.[2]

Out-of-body and near-death claims are harder to verify because the relevant experiences are unpredictable and external target tests are difficult to implement.

Prospective cardiac-arrest studies such as AWARE and AWARE II have attempted hidden audiovisual testing.[3][4]

AWARE II reported no identification of the visual image among interviewed survivors and one identification of an auditory stimulus.[4]

These results neither establish literal separation nor close the question.

They demonstrate how unusual claims can be converted into specific tests.

The basic method is:

**define the claim;**

**hide the target;**

**set the success rule first;**

**prevent ordinary information leakage;**

**record before checking;**

**keep every attempt;**

**repeat.**

A vivid experience deserves to be recorded.

An external claim deserves to be tested.

## Experiment

### Make It Falsifiable

Choose one modest question.

Do not begin with the hardest possible paranormal claim.

Examples:

**Does MILD increase my lucid-dream rate over my normal baseline?**

**Does imagined rolling produce more autonomous movement than imagined floating?**

**Can I identify a hidden target above chance across repeated attempts?**

### Write the rule first

Before the attempt, record:

**question**

**method**

**target pool if applicable**

**success criterion**

**number of planned attempts**

**what counts as a miss**

Do not edit those rules after seeing results.

### Hide the answer

If testing external information, arrange the target so you cannot know it normally.

Prefer random selection.

Avoid target leakage.

If possible, keep the person collecting your report blind to the answer too.

### Record before checking

Immediately afterward record:

**experience**

**exact perception or guess**

**confidence**

**whether lucidity occurred**

**whether an OBE-like state occurred**

**whether the target was actually sought**

Then lock the record.

### Reveal

Only after the report is complete, reveal the target or outcome.

Score according to the rule you wrote beforehand.

### Keep the denominator

Record every planned attempt.

Success.

Failure.

No experience.

Forgotten target.

Vague answer.

Wrong answer.

Exact hit.

### Repeat

One attempt creates a story.

Repeated controlled attempts create evidence.

After the planned series, ask:

**Did the result differ from what chance, memory, expectation, or ordinary perception could reasonably explain?**

And:

**What result would make me revise my interpretation?**

## Intention

**I record the experience honestly and test only the claims the evidence can answer.**

## References

**[1]** LaBerge, S., Nagel, L. E., Dement, W. C., & Zarcone, V. P. Jr. “Lucid dreaming verified by volitional communication during REM sleep.” *Perceptual and Motor Skills* 52 (1981): 727–732. DOI: 10.2466/pms.1981.52.3.727.

**[2]** Konkoly, K. R., et al. “Real-time dialogue between experimenters and dreamers during REM sleep.” *Current Biology* 31 (2021): 1417–1427.e6. DOI: 10.1016/j.cub.2021.01.026.

**[3]** Parnia, S., et al. “AWARE—AWAreness during REsuscitation—a prospective study.” *Resuscitation* 85 (2014): 1799–1805. DOI: 10.1016/j.resuscitation.2014.09.004.

**[4]** Parnia, S., et al. “AWAreness during REsuscitation - II: A multi-center study of consciousness and awareness in cardiac arrest.” *Resuscitation* 191 (2023): 109903. DOI: 10.1016/j.resuscitation.2023.109903.

**[5]** Parnia, S., Waller, D. G., Yeates, R., & Fenwick, P. “A qualitative and quantitative study of the incidence, features and aetiology of near death experiences in cardiac arrest survivors.” *Resuscitation* 48 (2001): 149–156. DOI: 10.1016/S0300-9572(00)00328-2.
`,Vt="Test the Experience: Can Lucid Dreams and Out-of-Body Experiences Be Verified?",Ao="/testing-out-of-body-experiences/",Jt=Ao;let Tn=null;function So(){return Tn||(Tn=S(xo)),Tn}const Eo=`# Compare the Maps: Lucid Dreaming vs. Astral Projection, OBE and Sleep Paralysis

By this point, the same night can acquire several names.

You know you are dreaming.

Then the bedroom appears.

You think you woke up.

You cannot move.

You feel yourself floating.

You see the bed from somewhere else.

You call it a lucid dream.

Someone else calls it sleep paralysis.

Someone else calls it an out-of-body experience.

Someone else calls it astral projection.

Maybe several descriptions apply.

Maybe only one does.

The mistake is assuming the labels all answer the same question.

They do not.

A **lucid dream** tells us something about awareness.

A **false awakening** tells us something about what you believe happened.

**Sleep paralysis** tells us something about motor state during a sleep-wake transition.

An **out-of-body experience** tells us something about self-location and perspective.

**Astral projection** usually adds an interpretation about what left the body and where it went.

These are different dimensions.

That is why the map becomes more useful when we stop asking:

**Which one is real?**

and start asking:

**What exactly happened?**

## Lucid dreaming is about knowing

The defining feature of a lucid dream is simple:

**you know you are dreaming while the dream continues.**

That definition does not require control.

It does not require flying.

It does not require vividness.

It does not require seeing the sleeping body.

Lucid dreams have been objectively verified during REM sleep using pre-agreed eye signals, and modern laboratory work has demonstrated real-time communication with some lucid dreamers during verified REM.[1][2]

The important variable is metacognitive awareness.

**I know this is a dream.**

Everything else can vary.

## A false awakening is about believing you woke up

A false awakening is a dream in which you believe you have awakened.

You may sit up.

Check the clock.

Walk into another room.

Start the morning.

Then something strange happens.

Or you wake again.

False awakenings can be remarkably ordinary.

That is what makes them useful.

A bizarre dream may trigger suspicion.

A perfect imitation of your bedroom may not.

Sleep-laboratory evidence suggests false awakenings can occupy a state with electrophysiological features intermediate between ordinary REM sleep and wakefulness, similar in some respects to sleep paralysis.[3]

Phenomenologically, however, the important point is straightforward:

**you thought you were awake, but you were still dreaming.**

That makes false awakenings excellent training grounds for reality checks.

## Sleep paralysis is about being awake enough to notice atonia

During REM sleep, much of the skeletal musculature is normally inhibited.

This prevents most dream movement from becoming physical movement.

In sleep paralysis, awareness returns or persists while that motor inhibition remains.

You try to move.

The body does not respond normally.

The experience may be brief.

It may also contain vivid dreamlike perception:

a sensed presence;

voices;

figures;

pressure;

movement;

floating;

or the apparent bedroom.

A 2023 review found a consistent positive relationship between lucid dreaming and sleep paralysis across much of the available literature, while emphasizing important differences in emotional tone and perceived control.[4]

Sleep paralysis is often frightening.

Lucid dreaming is more often experienced as controllable or desirable.

They can overlap.

They are not the same thing.

## An OBE is about where you feel located

An out-of-body experience is usually defined by a shift in self-location.

You feel as if **you** are somewhere other than the physical body's ordinary location.

That may include:

floating above the body;

viewing the body from elsewhere;

moving through the room;

being located near the ceiling;

or simply feeling displaced without seeing the physical body.

A 2024 theoretical review of sleep-related OBEs argues that they may be facilitated by maintaining consciousness during transitions into REM sleep and examines their relationship to lucid dreaming and sleep paralysis.[5]

The same review also emphasizes phenomenological differences.

That is important.

An OBE is not defined by knowing you are dreaming.

It is defined by the experience of being located outside the physical body.

You could theoretically have:

an OBE with lucidity;

an OBE without dream lucidity;

sleep paralysis with an OBE;

a lucid dream without any OBE;

or a false awakening followed by an OBE-like transition.

The dimensions can combine.

## Astral projection is an interpretation as well as an experience label

In ordinary usage, **astral projection** often describes an experience similar to an OBE.

But the phrase usually carries more metaphysical baggage.

It commonly implies that consciousness, a subtle body, an astral body, or some nonphysical aspect of the person actually separates from the physical body and travels independently.

That is a stronger claim than:

**I experienced myself outside my body.**

The experience may be identical.

The interpretation changes.

This distinction is not an attempt to ban the astral model.

It is an attempt to keep the claim visible.

If you say:

**I had an OBE-like experience,**

you are describing phenomenology.

If you say:

**my astral body literally traveled away from my physical body,**

you are proposing an explanation.

The second claim needs additional evidence.

## The same event can support several descriptions

Imagine this sequence.

You are lying in bed.

You become aware that you cannot move.

You hear a buzzing sound.

You feel yourself rise upward.

The bedroom becomes vivid.

You see what looks like your body below.

You realize something unusual is happening.

How should we classify it?

Sleep paralysis?

Possibly. You experienced awareness with apparent motor paralysis.

OBE?

Possibly. Self-location shifted away from the physical body.

Lucid dream?

Possibly, if you recognized that the experience was dream-generated or knew you were dreaming.

False awakening?

Possibly, if you believed you had physically awakened into the bedroom scene before recognizing otherwise.

Astral projection?

That depends on the explanatory model you apply.

The sequence does not have to choose one box.

## Research also finds the experiences correlated

A survey study of 974 people found that lucid dreaming, sleep paralysis, false awakenings and OBE reports were positively correlated in frequency.[6]

People who experienced one were more likely to report others.

That does not prove they are one state.

It suggests shared vulnerability, shared sleep architecture, shared recall factors, or transitions among related states may be involved.

A 2025 scoping review of 87 OBE publications likewise found that sleep paralysis and lucid dreaming can facilitate OBEs in some reports and induction contexts.[7]

Think of neighboring countries.

Crossing a border does not mean the countries are identical.

It means travel between them is possible.

## REM sleep is not one perfectly sealed state

The simple textbook picture says:

awake;

then asleep;

then REM;

then awake again.

Real physiology is messier.

Features associated with wakefulness and sleep can coexist.

A 2023 review of sleep-related dissociative states describes mixed or dissociated states in which components of ordinary wakefulness, NREM sleep and REM sleep can appear together.[8]

That provides a useful framework for:

lucid dreaming;

false awakening;

sleep paralysis;

and perhaps some sleep-related OBEs.

The brain may not switch every system at exactly the same moment.

Awareness can change before motor state.

Motor atonia can persist after awareness rises.

Dream imagery can continue into apparent waking.

Self-location can reorganize while the physical body remains still.

The borders blur because the underlying systems can blur.

## Similarity does not erase differences

There is a temptation to reduce everything to one master explanation.

**All OBEs are lucid dreams.**

Or:

**All lucid dreams are astral travel.**

Or:

**Sleep paralysis explains all of it.**

Those claims go beyond the evidence.

The 2024 OBE review was specifically designed to examine both overlap and phenomenological differences among sleep-related OBEs, lucid dreaming and sleep paralysis.[5]

The experiences share features.

They also have distinguishing characteristics.

Good maps show both.

## Compare awareness

Ask:

**Did I know I was dreaming?**

If yes, lucidity was present.

If no, the experience might still have been vivid, unusual, OBE-like, or dream-generated.

Do not retroactively assign lucidity simply because the experience was strange.

Lucidity is knowing.

## Compare movement

Ask:

**Could I move the physical body?**

If you were trying to move physically and could not, sleep paralysis may have been present.

If you were moving freely in an internally generated body while the physical body remained asleep, that is different.

If you never attempted physical movement, motor state may be unknown.

Unknown is allowed.

## Compare self-location

Ask:

**Where did I feel located?**

Inside the physical body?

Inside a dream body?

Above the bed?

Across the room?

Nowhere definite?

Everywhere?

Self-location is one of the strongest dimensions for distinguishing an OBE-like experience from an ordinary lucid dream.

## Compare perspective

Ask:

**Where did perception seem to come from?**

The physical eyes?

A dream body?

A point above the room?

A third-person view?

No clear viewpoint?

Perspective and self-location often agree.

They do not always have to.

## Compare the physical body

Ask:

**Was the physical body part of the experience?**

You may:

feel it;

forget it;

see it;

remember it abstractly;

feel two bodies;

or have no bodily representation at all.

Seeing a body on the bed is often associated with classic OBE reports.

It is not required for every OBE definition.

## Compare the environment

Ask:

**What kind of place was I in?**

Ordinary dream environment?

Exact bedroom?

Bedroom with errors?

Completely unfamiliar place?

Apparently waking environment?

A scene that changed instantly?

An environment can feel like your bedroom and still be a false awakening or dream reconstruction.

The feeling of familiarity is not verification.

Compare after waking.

## Compare emotional tone

Sleep paralysis is often associated with fear.

Lucid dreaming is often associated with positive emotion and perceived control.

That contrast appears in the review literature.[4]

But emotion does not define the state.

A lucid dream can be terrifying.

Sleep paralysis can be calm.

An OBE can be peaceful, frightening, or emotionally neutral.

Use emotion as one dimension, not a diagnosis.

## Compare control

Ask:

**What could I influence?**

Nothing?

Attention only?

Dream body?

Environment?

Physical body?

Control is not the same as lucidity.

We learned that earlier.

It is also not the same as OBE.

You can experience displaced self-location without controlling the environment.

Or control a lucid dream while feeling completely embodied inside the dream body.

## Compare the transition

The transition may tell you more than the destination.

Did you:

recognize an ordinary dream?

wake into paralysis?

remain aware through sleep onset?

roll out of a sleeping-body sensation?

float upward?

experience a false awakening?

open dream eyes into a new scene?

A carefully recorded sequence can reveal how states connect.

The label at the end may conceal that information.

## Compare what happened afterward

How did the experience end?

Physical awakening?

Another dream?

False awakening?

Loss of lucidity?

Return to the body?

Sudden disappearance?

Gradual merging with physical sensation?

People often use the phrase **returned to my body**.

Record that phenomenology.

Also record what objectively happened:

**I next remember opening my physical eyes in bed.**

Both descriptions can coexist without being identical claims.

## Paranormal interpretation and sleep phenomena are associated

Research also finds associations between sleep variables and ostensibly paranormal experiences and beliefs.

A preregistered scoping review of 44 studies found positive associations among factors such as sleep paralysis, lucid dreaming, nightmares and hypnagogic hallucinations and reports or beliefs involving ghosts, spirits and near-death experiences.[9]

This does not show that sleep causes every paranormal belief.

It does show that unusual sleep experiences can influence how people interpret extraordinary events.

Culture matters too.

If you know the language of sleep paralysis, you may interpret immobility and a sensed presence one way.

If your tradition describes spirit attack, you may use another map.

If you study astral projection, floating sensations may immediately become separation.

The raw experience and the cultural model interact.

## Maps are useful because they are incomplete

A map is not useless because it simplifies.

It is useful because it emphasizes certain features.

The lucid-dream map emphasizes metacognition and dream state.

The sleep-paralysis map emphasizes REM atonia intruding into awareness.

The OBE map emphasizes self-location and perspective.

The astral map emphasizes nonphysical travel.

Traditional dream-yoga maps may emphasize recognition, illusion, awareness and continuity of consciousness.

A neurological map may emphasize multisensory integration, predictive processing and state dissociation.

Each map directs attention differently.

The problem begins when one map is mistaken for the territory itself.

## You can carry more than one map

You do not need to settle the ontology tonight.

You can write:

**Phenomenology: floating above bed, seeing body, room vivid.**

**Sleep map: awareness during a REM-like transition; possible paralysis/false-awakening overlap.**

**OBE map: displaced self-location and externalized perspective.**

**Astral interpretation: possible separation experience.**

**Verification: room details mostly matched; no hidden target tested.**

That record preserves far more information than:

**Definitely astral projection.**

It also preserves more information than:

**Just a dream.**

Curiosity survives precision.

## Summary

Lucid dreaming, false awakening, sleep paralysis, out-of-body experience and astral projection describe overlapping but different aspects of unusual sleep and body experience.

**Lucid dreaming** is defined by knowing you are dreaming.

**False awakening** is dreaming that you woke up.

**Sleep paralysis** involves awareness while normal voluntary movement remains inhibited around sleep-wake transitions.

**Out-of-body experience** describes a felt displacement of self-location outside the physical body.

**Astral projection** usually adds the interpretation that a nonphysical aspect of the person has actually separated and traveled.

Research finds correlations and transitions among lucid dreaming, sleep paralysis, false awakenings and OBE reports.[4][5][6][7]

Sleep physiology also supports the broader idea that mixed or dissociated sleep-wake states can occur rather than every component switching together.[3][8]

Overlap does not mean identity.

A useful record compares:

**awareness;**

**movement;**

**self-location;**

**perspective;**

**physical-body representation;**

**environment;**

**emotion;**

**control;**

**transition;**

**ending.**

Describe the territory first.

Then compare the maps.

## Experiment

### Map One Experience Five Ways

Choose one unusual dream, sleep-paralysis episode, false awakening, OBE-like event, or threshold experience.

Prefer a fresh experience.

Write the raw sequence before applying labels.

### Lucid-dream map

Ask:

**Did I know I was dreaming?**

**When did I know?**

**Did lucidity remain stable?**

Do not count later hindsight as in-dream lucidity.

### Sleep-paralysis map

Ask:

**Did I believe I was awake?**

**Did I attempt physical movement?**

**Was movement inhibited?**

**Were dreamlike perceptions present in the apparent room?**

### OBE map

Ask:

**Where did I feel located?**

**Where was the viewpoint?**

**Was the physical body seen, felt, remembered, or absent?**

### Astral-projection map

Without deciding whether the model is true, ask:

**Which features would an astral-projection tradition interpret as separation or travel?**

Write the interpretation separately from the raw report.

### Verification map

Ask:

**What external details could actually be checked?**

**Were they known beforehand?**

**Were any targets hidden?**

**What matched?**

**What did not?**

### Compare

Now place the labels side by side.

More than one may describe the event.

Some may not.

Write:

**Best phenomenological description:**

Then:

**Possible interpretations:**

Then:

**What remains unknown:**

Across several experiences, look for recurring transitions.

Do you move from paralysis into lucidity?

From false awakening into lucidity?

From lucid dream into OBE-like self-location?

From body vibration directly into ordinary waking?

Your personal map should become more detailed over time, not more dogmatic.

## Intention

**I describe the experience first and let each map explain only what it actually explains.**

## References

**[1]** LaBerge, S., Nagel, L. E., Dement, W. C., & Zarcone, V. P. Jr. “Lucid dreaming verified by volitional communication during REM sleep.” *Perceptual and Motor Skills* 52 (1981): 727–732. DOI: 10.2466/pms.1981.52.3.727.

**[2]** Konkoly, K. R., et al. “Real-time dialogue between experimenters and dreamers during REM sleep.” *Current Biology* 31 (2021): 1417–1427.e6. DOI: 10.1016/j.cub.2021.01.026.

**[3]** Mainieri, G., et al. “Are sleep paralysis and false awakenings different from REM sleep and from lucid REM sleep? A spectral EEG analysis.” *Journal of Clinical Sleep Medicine* 17 (2021): 719–727. DOI: 10.5664/jcsm.9056.

**[4]** Stefani, A., et al. “Sleep Paralysis and Lucid Dreaming—Between Waking and Dreaming: A Review about Two Extraordinary States.” *Journal of Clinical Medicine* 12 (2023): 3437.

**[5]** Campillo-Ferrer, T., et al. “Out-of-body experiences in relation to lucid dreaming and sleep paralysis: A theoretical review and conceptual model.” *Neuroscience & Biobehavioral Reviews* 163 (2024): 105770. DOI: 10.1016/j.neubiorev.2024.105770.

**[6]** Raduga, M., Kuyava, O., & Sevcenko, N. “Is there a relation among REM sleep dissociated phenomena, like lucid dreaming, sleep paralysis, out-of-body experiences, and false awakening?” *Medical Hypotheses* 144 (2020): 110169. DOI: 10.1016/j.mehy.2020.110169.

**[7]** Moix, J., et al. “Out of body experiences: Scoping review.” *EXPLORE* 21 (2025): 103196. DOI: 10.1016/j.explore.2025.103196.

**[8]** “Awake or Sleeping? Maybe Both… A Review of Sleep-Related Dissociative States.” (2023). PMID: 37373570.

**[9]** “Associations between sleep variables and ostensibly paranormal experiences and paranormal beliefs: A scoping review.” (2023). PMID: 37070349.
`,Kt="Compare the Maps: Lucid Dreaming vs. Astral Projection, OBE and Sleep Paralysis",Ro="/lucid-dreaming-vs-astral-projection/",$t=Ro;let kn=null;function Mo(){return kn||(kn=S(Eo)),kn}const Do=`# Floating in Space: Sun, Moon, Planets and the Science of Sleep & Dreams

Human beings slept under the sky long before we invented blackout curtains, electric lights, clocks, phone screens, alarm schedules, or apps that tell us when the Moon is full.

The sky was the clock.

Sunrise meant something.

Sunset meant something.

Moonlight changed the usable night.

Seasons changed the length of day.

Planets wandered against the stars slowly enough to become calendars, omens, gods, symbols, and eventually coordinates.

So it is reasonable to ask:

**Does any of this still affect us?**

The answer is not one answer.

For the Sun, the evidence is overwhelming.

For the Moon, the evidence is intriguing and inconsistent.

For solar and geomagnetic activity, some associations exist, but many proposed mechanisms remain uncertain.

For planetary positions used in astrology, controlled predictive evidence is much weaker.

That makes this a perfect subject for us.

The sky contains several different questions that people often blend into one.

We will separate them.

## The Sun is not subtle

The strongest celestial influence on human sleep is also the most obvious.

Light.

Human circadian timing is synchronized to the external light-dark cycle.

Light reaching the eyes influences the brain through pathways that include intrinsically photosensitive retinal ganglion cells containing melanopsin. These cells contribute to non-visual responses to light including circadian phase resetting, melatonin regulation, alertness, and sleep-wake timing.[1][2]

The effect depends on more than whether a light is simply on or off.

Timing matters.

Intensity matters.

Duration matters.

Spectrum matters.

Your recent light history matters.

The Sun does not need astrology to affect you.

It enters through the eyes.

## Morning and evening light do different things

Your circadian clock is not a stopwatch.

It can be shifted by when light arrives.

Broadly speaking, light exposure at different biological times can move circadian phase in different directions.

This is why bright evening light can delay sleep timing, while appropriately timed morning light can help advance it.

Modern indoor life complicates the system.

We may spend much of the day under relatively dim indoor light, then surround ourselves with electric light late into the evening.

That pattern is almost the reverse of the natural contrast between bright day and dark night.

An international expert consensus on light exposure recommends substantially brighter daytime light and much lower light exposure in the evening and during sleep to support circadian physiology, wakefulness, and sleep.[2]

This is not mystical influence.

It is sensory biology.

## The Sun reaches dreams indirectly

The Sun does not need to appear in your dream to influence the conditions that produce dreaming.

Light affects circadian timing.

Circadian timing affects when sleep occurs.

Sleep timing affects the distribution of REM and NREM sleep.

Dream recall depends partly on when you wake and what sleep stage or mental state you wake from.

So solar light can influence the architecture surrounding dreams without “sending” dream content.

That distinction matters.

A sunrise may alter sleep timing.

That is different from claiming the Sun inserted a symbol into a dream.

## Seasons change the temporal environment

The length and timing of daylight change through the year.

At higher latitudes, those seasonal changes become dramatic.

Human sleep and chronotype are shaped by biology, social schedules, artificial light, and the natural light environment.

Research across populations links environmental timing variables such as sunset and photoperiod with differences in morningness-eveningness.[3]

Season may also change sensitivity to evening light because daytime light exposure itself changes how strongly the circadian system responds later.[4]

So when you compare your own dream or sleep data across months, do not assume January and June are equivalent backgrounds.

The sky changed.

Your schedule probably did too.

## The Moon is more complicated

The Moon is close enough, bright enough, and rhythmically obvious enough that human cultures have tracked it for millennia.

Its synodic cycle is about 29.5 days.

The full moon is visually dramatic.

It also inspires a staggering quantity of folklore.

That creates a research problem.

If people expect the full moon to affect sleep, expectation itself can contaminate self-report.

Researchers therefore need designs that separate actual lunar phase from knowledge and expectation.

Some studies report lunar effects.

Others do not.

## A laboratory study found sleep changes near the full moon

A widely discussed 2013 study reanalyzed sleep-laboratory data according to lunar phase.

Participants and researchers had not originally been studying the Moon.

Around the full moon, the analysis reported lower NREM delta activity, longer sleep-onset time, shorter total sleep, lower subjective sleep quality, and lower melatonin levels.[5]

Because the participants were indoors under controlled laboratory conditions and the lunar analysis was retrospective, ordinary visible moonlight was not an obvious explanation.

The result suggested the possibility of an endogenous circalunar influence.

It was interesting.

It was not the final word.

## Field research found later and shorter sleep before full moon

In 2021, researchers studied sleep using wrist actimetry in Indigenous Toba/Qom communities in Argentina with different access to electricity, as well as university students in a highly urbanized U.S. setting.[6]

Across settings, sleep tended to begin later and become shorter in the nights leading up to the full moon.

The authors proposed that evening moonlight may historically have extended nighttime activity and that artificial light could partly mimic or preserve similar timing patterns in modern environments.

This is especially interesting because it suggests the Moon may influence behavior through ordinary light rather than requiring a mysterious force.

But the pattern also appeared in urban environments where moonlight was less behaviorally important.

So the mechanism is not completely settled.

## Other sleep studies have also found lunar associations

Some smaller observational and sleep-laboratory studies have reported lower sleep efficiency, less deep sleep, delayed REM onset, or shorter sleep near the full moon.[7]

Other analyses have failed to reproduce meaningful effects.

That inconsistency is important.

If a phenomenon is small, variable among individuals, dependent on environment, or sensitive to analysis choices, one study can easily look stronger than the total evidence eventually supports.

The correct phrase is not:

**The full moon definitely ruins human sleep.**

It is:

**Several studies have reported lunar associations with sleep, but the literature remains mixed.**

## Dream recall does not appear to follow the full moon reliably

Sleep and dream recall are related but not identical.

A diary study involving 196 participants tracked dreams over many nights and found no association between the full moon and dream recall.[8]

That matters because popular belief often bundles together:

full moon;

strange sleep;

intense dreams;

more dreams;

better dream recall.

Those are separate claims.

A lunar effect on one sleep variable would not automatically establish an effect on dream content or recall.

## If the Moon affects sleep, why?

There are several possible classes of explanation.

### Moonlight

Before electric lighting, bright moonlight could extend evening activity.

This has a clear physical pathway:

light reaches the eye;

behavior shifts;

sleep timing changes.

### Endogenous circalunar timing

Some organisms possess biological rhythms linked to lunar cycles.

Whether humans retain a meaningful endogenous circalunar oscillator is much less clear.

The 2013 laboratory result and some longitudinal observations keep the question open.[5][9]

### Gravitational or tidal mechanisms

The Moon produces measurable tides on Earth.

That fact alone does not establish a meaningful tidal effect on human sleep or dream processes.

A mechanism must still operate at the scale of human biology and be demonstrated.

### Expectation

People know when a full moon is visible.

They may sleep differently because the environment is brighter, because behavior changes, or because they expect something unusual.

Expectation is not fraud.

It is another causal pathway.

## The Moon may affect people differently

One reason lunar research is difficult is that averaging can hide individual patterns.

A 2021 review argued that human sleep-wake, menstrual, and mood-related cycles may sometimes synchronize temporarily with lunar cycles in heterogeneous ways rather than producing one uniform population effect.[9]

That is an interesting hypothesis.

It also creates a danger.

If every person's pattern is allowed to be different after the data are seen, almost any result can be explained.

So individualized analysis is useful only when the rule is specified clearly enough to test.

This will matter in the experiment.

## Solar activity is different from sunlight

The Sun affects Earth through more than visible daylight.

Solar flares and coronal mass ejections can disturb Earth's magnetosphere.

These events contribute to what is called **space weather**.

Researchers have investigated whether changes in geomagnetic activity correlate with biological variables.

A 2026 review describes reported associations involving cardiovascular and autonomic measures and discusses proposed mechanisms involving melatonin, cryptochrome-related magnetosensitivity, calcium signaling, and other pathways.[10]

But the same review emphasizes that causal pathways are not established and that neurological and psychological associations remain preliminary.[10]

That is a useful boundary.

Interesting is not established.

## Geomagnetism and melatonin have been studied

Human studies have reported associations between geomagnetic disturbance and melatonin patterns, including work at high latitudes where geomagnetic variability is strong.[11]

These studies are provocative because melatonin is directly relevant to sleep timing.

But association does not establish that ordinary geomagnetic fluctuations meaningfully control your dreams.

There are many possible confounders:

season;

light;

latitude;

weather;

sleep schedule;

stress;

measurement timing;

and multiple comparisons.

If the effect exists, its size and practical significance still need clarification.

## Space weather is not astrology

This distinction is easy to lose.

Solar wind interacting with Earth's magnetic environment is a physical process.

A claim that Mars entering a zodiac sign changes your dream symbolism is an astrological interpretation.

Those claims have completely different evidence requirements.

The fact that one celestial phenomenon has a demonstrated physical pathway does not validate another.

We should not argue:

**The Sun affects circadian rhythm, therefore astrology works.**

That would be like saying:

**Rain affects mood, therefore every weather proverb is scientifically verified.**

One true mechanism does not transfer credibility automatically.

## Planets unquestionably influence the Solar System

Jupiter has gravity.

Saturn has gravity.

Mars has gravity.

Their positions are real.

Orbital resonances are real.

Tides and perturbations are real.

Astronomy can predict planetary positions with extraordinary precision.

The unresolved question is not whether planets physically exist or exert forces.

The question is whether their positions provide a meaningful, demonstrated predictor of individual human psychology, sleep, dreams, or life events in the way astrological systems commonly claim.

That is a different question.

## Controlled tests of natal astrology have not shown reliable personality prediction

One of the best-known controlled tests was published in *Nature* in 1985.

The experiment was designed with input from astrologers and scientists and tested whether natal charts could accurately describe personality traits under double-blind conditions.[12]

The results did not support the tested astrological predictions.

Later double-blind work comparing computer-generated natal-chart personality descriptions with standard psychological profiles likewise found that participants could identify genuine psychological profiles more successfully than astrological ones.[13]

This does not erase astrology's cultural, symbolic, historical, or personal meaning.

It means that **predictive claims about personality from planetary positions have not performed reliably in controlled tests.**

## Symbolic usefulness is not the same as physical causation

A map can be useful without being a force.

Tarot imagery can provoke reflection without the cards physically controlling events.

A myth can organize experience without being literal history.

Astrology can provide language, ritual, metaphor, timing practices, and symbolic association.

Those are psychological and cultural functions.

They should not be confused with demonstrated celestial causation.

You may discover that a particular planetary symbol helps you set an intention before sleep.

That is an effect of the practice.

It does not prove the planet transmitted the content.

## The astronomy clock should stay honest

Our Sky Clock already treats the sky observationally.

That is the right direction.

It should tell us what is happening in the sky without silently telling us what the sky means.

Moon phase.

Sun position.

Planetary positions.

Season.

Perhaps astronomical events.

Those are observations.

Interpretation belongs to the reader and to the experiment.

This is especially important because expectation can create patterns.

If the interface says:

**Mars energy is intense tonight, expect conflict dreams,**

we have contaminated the observation before sleep even begins.

A cleaner instrument says:

**Mars is here.**

Then you compare later.

## Why does the Sky Clock say “Sun in Virgo”?

Our header already contains a small historical puzzle.

It shows the Sun and Moon beside zodiac signs.

If the Sun falls inside the Virgo sector, the tooltip says:

**Sun in Virgo.**

That phrase sounds astrological.

The calculation underneath it is astronomical.

The Sky Clock computes the Sun's geocentric ecliptic longitude and maps that longitude onto the **tropical zodiac**: twelve equal sectors of thirty degrees each.

That basic twelve-part geometry has ancient roots.

Babylonian astronomers divided the ecliptic into twelve thirty-degree signs for measurement and prediction of celestial motion.[14][15]

The system later became one of the foundations of Greek and Roman astrology.

So the same grid became two things at once:

a coordinate system;

and a symbolic language.

That is why a modern astronomy engine can truthfully compute a zodiacal sign without making an astrological prediction.

## Sign is not exactly the same thing as constellation

This is where the history gets fun.

The astronomical constellations are irregular patches of sky.

The zodiacal **signs** are equal thirty-degree divisions.

They once corresponded much more closely.

Precession slowly changed the alignment between the seasonal equinox-based zodiac and the background stars.[16]

Our Sky Clock uses the **tropical** zodiac.

Its zero point is tied to the vernal equinox and the seasonal year rather than attempting to make the sign boundaries follow the modern constellation boundaries.

So:

**Sun in Virgo**

means:

**the Sun's tropical ecliptic longitude currently lies in the thirty-degree sector traditionally named Virgo.**

It does not necessarily mean the Sun is physically inside the modern IAU boundaries of the constellation Virgo.

That single phrase carries Babylonian mathematics, Greek astronomy, seasonal timekeeping, and centuries of astrology in its pocket.

## Virgo used to say “harvest” before it said “personality type”

Virgo has accumulated many stories.

Its brightest star, Spica, takes its name from the Latin for an ear of wheat.

Historical images connect the constellation and sign with a maiden, grain, harvest, seasonal transition, and agricultural calendars.[17][18]

In some Islamic zodiac imagery, Virgo became **al-sunbula**, “the ear of corn,” and was sometimes represented by a male figure associated with Mercury harvesting grain.[18]

That does not prove that being born under Virgo makes someone analytical.

It does show that zodiac symbolism originally grew in a world where watching the sky helped organize seasons, agriculture, ritual, and time.

The symbolism was attached to actual observations.

The interpretation kept growing.

## Astrology inherited an astronomical machine

This may be the most generous way to approach astrology historically.

The ancient sky-watchers were not staring at imaginary objects.

They were measuring real celestial cycles.

The zodiac provided a repeatable coordinate system.

The planets genuinely moved through it.

Retrograde motion genuinely appeared.

The Moon genuinely changed phase.

Seasons genuinely changed.

Astrology added another question:

**What do those movements mean for life below?**

Late Babylonian traditions connected astronomical observations with omens.

Hellenistic astrology expanded the system toward individual horoscopes.

Ptolemy later tied the tropical zodiac and planetary qualities partly to seasonal reasoning.[15][19]

The predictive astronomy became extremely successful.

The predictive astrology did not acquire the same modern evidential support.

But historically they grew together.

The Sky Clock lets us look directly at the point before those paths completely separated.

## The old universe was built in planetary layers

Modern astronomy imagines planets as worlds moving through physical space.

Many older cosmologies imagined the heavens as **spheres**.

Earth occupied the center.

The Moon, Mercury, Venus, Sun, Mars, Jupiter, and Saturn formed successive celestial regions.

Those spheres were not merely locations.

They could represent levels of being.

Ancient and late-antique philosophical and religious systems sometimes imagined the soul descending through them into embodiment or ascending back through them toward the divine.[20]

In accounts associated with Numenius and preserved by Macrobius, the descending soul acquires different capacities while passing through the planetary spheres: Saturn, Jupiter, Mars, the Sun, Venus, Mercury, and finally the Moon.[20]

Hermetic materials likewise connect cosmic ascent with the seven planetary spheres and their governing powers.[21]

So the idea of **traveling through planetary realms** is much older than modern astral-projection books.

It sits near the roots of Western esotericism.

## Occult planets are not always physical planets

This distinction becomes essential.

When an occult text says **the sphere of Mars**, it may not mean:

**fly 225 million kilometers and land next to Olympus Mons.**

It may mean a spiritual, psychic, symbolic, initiatory, or subtle realm associated with Mars.

Theosophical writers later developed elaborate models of astral and mental planes, planetary chains, and nonphysical globes associated with planets.[22]

Whether we believe those maps or not, they are not simply failed astronomy.

They are claims about a different kind of geography.

That gives us two radically different questions:

**Can consciousness experience a realm symbolized as Mars?**

and:

**Can consciousness acquire verifiable information from the physical planet Mars without ordinary sensory contact?**

Those are not the same experiment.

## So where does consciousness go when we travel?

Science does not currently have evidence that consciousness literally detaches from the nervous system and moves through external space during dreams or OBEs.

What it does have is a growing understanding of how the brain represents:

self-location;

perspective;

distance;

direction;

landmarks;

routes;

and entire spatial environments.

Human navigation depends on interacting networks including hippocampal, entorhinal, retrosplenial, parahippocampal, parietal, and frontal systems.[23]

Dreaming and imagination can recombine memory, spatial representation, visual construction, emotion, and prediction into internally generated experiences that feel like places.[24][25]

That means the scientific answer to:

**Where did I go?**

may sometimes be:

**into a spatial world generated by consciousness.**

That sounds less disappointing to me than people sometimes make it sound.

A world does not become psychologically trivial because it was generated.

Dream cities can have distance.

Dream rooms can have geometry.

You can get lost.

You can fly over terrain.

You can remember where a door was.

The mind can make an **elsewhere**.

## Can you travel to the Moon?

As an experience?

Absolutely worth trying.

A lucid dream can contain the Moon.

An OBE-like state can contain the experience of moving toward the Moon.

You can set the intention:

**Take me to the Moon.**

Then observe what happens.

Do you rocket through black space?

Arrive instantly?

See a scientifically familiar lunar surface?

Find an impossible city?

Meet someone?

Become the Moon?

Wake up?

Nothing?

All of those are legitimate phenomenological results.

But if you later say:

**I literally visited the physical Moon,**

the evidence standard changes.

Now we need information that could not reasonably have come from prior knowledge, expectation, inference, media exposure, or chance.

That is the lesson from **Test the Experience**.

Adventure first.

Ontology second.

Verification when possible.

## Can you travel to another planet?

The same rule applies.

Lucid-dream and OBE traditions contain claims of distant travel.

Robert Monroe's later writings and the culture that developed around his work describe movement into nonphysical locales rather than treating every journey as ordinary geographic travel.[26]

The Monroe Institute itself says it has no hard data that Moon phase helps produce OBEs, which is a useful reminder that even a tradition enthusiastic about expanded consciousness does not need to claim every celestial correlation.[27]

A useful experiment would be:

**Go to Jupiter.**

Not because you expect to stand physically on a gas giant.

Because the request tests what the experience does with an impossible destination.

Does “Jupiter” become:

clouds;

a mythological god;

a giant planet;

a city;

a color;

a feeling;

a completely unexpected environment?

That tells us something about the construction of internal worlds.

A stronger remote-perception experiment would require a hidden target associated with a real spacecraft image, coordinate, or astronomical fact that you do not know in advance.

That would be much harder.

And much more interesting if it worked.

## The superpower question

This book began with a childish-sounding desire that I do not think is childish at all.

**Can I learn to do something that feels impossible?**

Remember dreams.

Become lucid.

Stay aware while the body falls asleep.

Move without moving.

Change self-location.

Enter an internally generated world deliberately.

Test information.

Those are already strange abilities.

Maybe the mistake is demanding that every superpower become supernatural before we allow ourselves to be impressed.

If you learn to close your eyes in bed and later find yourself consciously standing on the Moon in a stable, explorable world, something extraordinary happened.

The open question is **what kind of extraordinary thing it was**.

That is enough reason to keep exploring.

## The most interesting experiment is partly blind

Suppose you want to know whether your dream life changes with lunar phase.

Do not stare at the Moon calendar every night and then decide whether the dream felt “full-moon-ish.”

Record the dream first.

Record sleep quality.

Record bedtime.

Record wake time.

Record lucid dreaming.

Record unusual body sensations.

Record emotional intensity.

Then add the celestial information afterward.

Better still, analyze a batch of nights at once.

This reduces expectation.

## Planetary experiments need even stronger discipline

If you want to explore astrology personally, the same principle applies.

Choose the claim before looking at the data.

For example:

**Dreams will contain more aggressive conflict during a defined Mars transit.**

That is at least testable.

Now define:

what counts as conflict;

which transit;

what dates;

how many nights;

how dreams are scored;

and whether the scorer knows the transit dates.

If you read the transit first and then search the dream for a match, the experiment is almost guaranteed to produce meaning.

Humans are excellent pattern finders.

That is not an insult.

It is one of our defining abilities.

It is also why blinding helps.

## Correlation can be worth finding even without mechanism

Suppose your data genuinely show that you sleep twenty minutes less in the three nights before the full moon.

You do not need to know why before reporting it.

Maybe moonlight changes behavior.

Maybe an endogenous cycle exists.

Maybe another environmental factor tracks the cycle.

First establish the pattern.

Mechanism comes next.

Likewise, if no pattern appears, keep that result.

The sky does not owe us a correlation.

## Beware of enormous search spaces

Celestial data offer almost unlimited variables.

Sunrise.

Sunset.

Day length.

Moon phase.

Moon illumination.

Moonrise.

Moonset.

Lunar distance.

Planet positions.

Planetary aspects.

Retrogrades.

Geomagnetic indices.

Solar flares.

Seasons.

Meteor showers.

If you compare every variable with every possible dream feature, some correlations will appear by chance.

That is why the hypothesis should come before the analysis.

A large enough sky can explain anything after the fact.

## Start with the strongest mechanisms

If you want better sleep and dream practice, begin where evidence is strongest.

Daytime light.

Evening darkness.

Stable sleep timing.

Enough sleep.

Then explore the Moon.

Then explore geomagnetic or planetary patterns if you are curious.

Do not reverse the evidence hierarchy.

A Saturn transit is not a substitute for sleep hygiene.

## Summary

The sky contains several different kinds of influence and several different kinds of claim.

**Sunlight** has a strong, well-established biological pathway into human circadian rhythms, melatonin, alertness, and sleep timing through ocular light reception and melanopsin-linked systems.[1][2]

**Seasonal daylight** changes the timing environment and can influence chronotype and sensitivity to evening light.[3][4]

**Lunar phase** has been associated with sleep timing and sleep architecture in several laboratory and field studies, including later and shorter sleep before the full moon in a large field study.[5][6][7]

But lunar findings are inconsistent, mechanisms remain unsettled, and a diary study found no full-moon effect on dream recall.[8]

**Solar and geomagnetic activity** have emerging associations with some physiological outcomes, but causal mechanisms and neurological or psychological effects remain preliminary.[10][11]

**Planetary astrology** is culturally and symbolically rich, but controlled double-blind studies have not demonstrated reliable personality prediction from natal planetary positions.[12][13]

**The zodiac in the Sky Clock** is an ancient astronomical coordinate tradition: twelve equal thirty-degree sectors along the ecliptic, later layered with astrological symbolism.[14][15] “Sun in Virgo” is therefore a real coordinate statement inside a tropical-zodiac convention, not an automatic personality prediction.

**Planetary travel** has deep roots in philosophical, Hermetic, and occult traditions that imagined ascent through celestial or nonphysical planetary spheres.[20][21][22] Modern consciousness research can explain internally generated spatial worlds and altered self-location, but has not established that lucid dreamers or OBE experiencers literally travel through physical interplanetary space.[23][24][25]

That still leaves a wonderful experiment: deliberately travel to the Moon or a planet as an experience, then distinguish what was experienced from anything claimed about the external world.

So:

**observe the sky;**

**identify the proposed mechanism;**

**separate physical influence from symbolic interpretation;**

**record before explaining;**

**test one claim at a time.**

## Experiment

### Track the Sky Without Cheating

Run this experiment for at least one lunar cycle if practical.

Do not sacrifice sleep to complete it.

### Record the night first

Before checking celestial data in the morning, record:

**bedtime**

**estimated sleep onset**

**wake time**

**sleep quality**

**dream recall**

**lucidity**

**dream emotional intensity**

**unusual body or OBE-like sensations**

**one-sentence dream theme**

If you already know the Moon phase, that is fine.

Do not pretend you do not.

Just avoid adding extra interpretation before recording.

### Add the Sun

Record:

**approximate daylight exposure**

**first substantial light exposure after waking**

**bright evening light**

**sunset timing if relevant**

Look first for obvious relationships between light timing and sleep.

### Add the Moon

After the sleep record is complete, add:

**lunar phase**

**approximate illumination**

**whether bright moonlight was actually visible during your evening**

Do not treat “full moon” as the only category.

Look at the whole cycle.

### Add solar or geomagnetic conditions only later

If you are curious, add a recognized solar or geomagnetic index after several weeks of records.

Do not search for every possible space-weather variable.

Choose one.

Write the hypothesis before comparing.

### Add one planetary claim

If you want to test an astrological claim, choose exactly one in advance.

Define:

**planetary condition**

**predicted dream or sleep feature**

**scoring rule**

**time window**

Then record nights without changing the rule.

If possible, score the dream feature before revealing whether the planetary condition was present.

### Read the Sky Clock historically

On several nights, look at the compact header only after you have recorded the night.

Note:

**Sun sign shown**

**Moon sign shown**

**next full moon**

Remember that the Sun/Moon signs are tropical thirty-degree ecliptic sectors, not personality verdicts.

Choose one sign occasionally and look up its historical astronomical or occult associations **after** recording your dream.

Ask whether knowing the symbolism beforehand changes what you notice.

### Travel somewhere impossible

On a lucid-dream or sleep-edge attempt, choose one destination:

**the Moon**

**Mars**

**Jupiter**

or another celestial target.

Use a simple intention:

**Take me to the Moon.**

Do not pre-write the expected scenery.

If a stable experience develops, explore before interpreting.

Record:

**how travel happened**

**what the destination looked like**

**whether it resembled known astronomy**

**what was surprising**

**what could actually be checked later**

Treat the journey as phenomenology unless independent information can be verified.

### Compare

At the end of the chosen period, ask:

**What effect was largest?**

**What repeated?**

**What disappeared when expectation was removed?**

**What has a plausible mechanism?**

**What is only a correlation?**

**What was not supported?**

Do not rescue a failed prediction by inventing a new rule afterward.

## Intention

**I watch the sky, record the night, and separate what I observe from what I expect.**

## References

**[1]** Prayag, A. S., Münch, M., Aeschbach, D., Chellappa, S. L., & Gronfier, C. “Light Modulation of Human Clocks, Wake, and Sleep.” *Clocks & Sleep* 1 (2019): 193–208. DOI: 10.3390/clockssleep1010017.

**[2]** Brown, T. M., et al. “Recommendations for daytime, evening, and nighttime indoor light exposure to best support physiology, sleep, and wakefulness in healthy adults.” *PLOS Biology* 20 (2022): e3001571. DOI: 10.1371/journal.pbio.3001571.

**[3]** Randler, C., et al. “Latitude affects Morningness-Eveningness: evidence for the environment hypothesis based on a systematic review.” *Scientific Reports* 7 (2017): 39976. PMID: 28045131.

**[4]** “Seasonal Variation in the Responsiveness of the Melanopsin System to Evening Light: Why We Should Report Season When Collecting Data in Human Sleep and Circadian Studies.” (2023). PMID: 37987395.

**[5]** Cajochen, C., Altanay-Ekici, S., Münch, M., Frey, S., Knoblauch, V., & Wirz-Justice, A. “Evidence that the lunar cycle influences human sleep.” *Current Biology* 23 (2013): 1485–1488. DOI: 10.1016/j.cub.2013.06.029.

**[6]** Casiraghi, L., et al. “Moonstruck sleep: Synchronization of human sleep with the moon cycle under field conditions.” *Science Advances* 7 (2021): eabe0465. DOI: 10.1126/sciadv.abe0465.

**[7]** “Association between lunar phase and sleep characteristics.” (2014). PMID: 25266502.

**[8]** Schredl, M., Fulda, S., & Reinhard, I. “Dream recall and the full moon.” *Perceptual and Motor Skills* 102 (2006): 17–18. DOI: 10.2466/pms.102.1.17-18.

**[9]** Wehr, T. A., & Helfrich-Förster, C. “Longitudinal observations call into question the scientific consensus that humans are unaffected by lunar cycles.” *BioEssays* 43 (2021): e2100054. DOI: 10.1002/bies.202100054.

**[10]** Maghrabi, A. H., & Maghrabi, M. A. “The sun-earth-health connection: a short review of potential mechanisms and implications.” *International Journal of Biometeorology* 70 (2026): 61. DOI: 10.1007/s00484-026-03134-3.

**[11]** “Geomagnetic activity influences the melatonin secretion at latitude 70 degrees N.” (2001). PMID: 11774869.

**[12]** Carlson, S. “A double-blind test of astrology.” *Nature* 318 (1985): 419–425. DOI: 10.1038/318419a0.

**[13]** Wyman, A. J., & Vyse, S. “Science versus the stars: a double-blind test of the validity of the NEO Five-Factor Inventory and computer-generated astrological natal charts.” *Journal of General Psychology* 135 (2008): 287–300. DOI: 10.3200/GENP.135.3.287-300.

**[14]** Leverington, D. *Babylon to Voyager and Beyond: A History of Planetary Astronomy.* Cambridge University Press. Discussion of Babylonian ecliptic longitude and the twelve thirty-degree zodiacal signs.

**[15]** Rochberg, F. “Science and Ancient Mesopotamia.” In *The Cambridge History of Science*. Discussion of the fixed twelve-sign, thirty-degree zodiac and its use in Late Babylonian astronomical and astrological practice.

**[16]** Longair, M. S. “From Ptolemy to Kepler—the Copernican revolution.” In *Theoretical Concepts in Physics*. Cambridge University Press. Discussion of Hipparchus and precession of the equinoxes.

**[17]** Ridpath, I. *Stars and Planets Guide.* Cambridge University Press. Historical note on Spica, the brightest star of Virgo, whose name refers to an ear of wheat.

**[18]** Carboni, S. *Following the Stars: Images of the Zodiac in Islamic Art.* Metropolitan Museum of Art. Historical discussion of Virgo/al-sunbula, the ear of corn, and Mercury-associated harvest imagery.

**[19]** Ribeiro, L. C. “Is astrology universal? Early modern globalization and the disruption of traditional knowledge.” *British Journal for the History of Science* 58 (2025): 425–445. Discussion of Ptolemaic tropical-zodiac and seasonal reasoning.

**[20]** Stanford Encyclopedia of Philosophy. “Numenius.” Discussion of Macrobius' account of the soul's descent through the seven planetary spheres and the capacities associated with them.

**[21]** Burns, D. and related scholarship on *The Discourse on the Eighth and Ninth*, discussed in *The Nag Hammadi Codices and their Ancient Readers*. Cambridge University Press. Discussion of Hermetic cosmic ascent, seven spheres, planets, and archons.

**[22]** Leadbeater, C. W. *The Inner Life.* Historical Theosophical primary source describing planetary chains and nonphysical globes. Use as evidence of occult belief history, not scientific evidence.

**[23]** Ekstrom, A. D., Huffman, D. J., & Starrett, M. “Interacting networks of brain regions underlie human spatial navigation: a review and novel synthesis of the literature.” *Journal of Neurophysiology* 118 (2017): 3328–3344. DOI: 10.1152/jn.00531.2017.

**[24]** Arbib, M. A. “From spatial navigation via visual construction to episodic memory and imagination.” *Biological Cybernetics* 114 (2020): 139–167. DOI: 10.1007/s00422-020-00829-7.

**[25]** de Perrois, N., et al. “Learning beyond sensations: How dreams organize neuronal representations.” *Neuroscience & Biobehavioral Reviews* (2023): 105508. DOI: 10.1016/j.neubiorev.2023.105508.

**[26]** Monroe, R. A. *Journeys Out of the Body* (1971), *Far Journeys* (1985), and *Ultimate Journey* (1994). Primary-source practitioner accounts of OBEs and nonphysical locales; not controlled evidence of literal travel.

**[27]** The Monroe Institute. “FAQs.” The Institute states it has no hard data that weather or Moon phase significantly affects OBE induction.
`,Qt="Floating in Space: Sun, Moon, Planets and the Science of Sleep & Dreams",Co="/sun-moon-planets-sleep-dreams/",Xt=Co;let In=null;function No(){return In||(In=S(Do)),In}const Oo=`# Notice the Coincidence: Synchronicity, Recurring Dreams, Shared Dreams and Pattern Recognition

Sometimes the weirdest part is not the dream.

It is what happens afterward.

You dream about an old friend.

The next day they contact you.

You keep seeing the same number.

A phrase appears in a dream and then turns up in a book.

The same impossible hallway returns for years.

A stranger in one dream appears again in another.

Two people wake up and discover that both dreamed about a train station.

You find this book at exactly the moment you were asking the question it seems to answer.

Coincidence?

Pattern recognition?

Selective attention?

Memory?

Shared culture?

Synchronicity?

Something stranger?

Good.

Do not decide yet.

## “You were meant to see this” is psychologically powerful

There is a reason that sentence works.

It changes the frame.

A random encounter becomes a possible message.

Once the possibility is introduced, attention searches for confirming detail.

That does not require deception.

Human cognition is built to detect relevance.

We constantly decide:

what matters;

what can be ignored;

what belongs together;

what predicts something else;

what might be a threat;

what might be an opportunity.

A statement like:

**Maybe this is for you.**

turns attention toward connection.

Then connection becomes easier to notice.

## The algorithm can be the mechanism

Suppose a platform shows you a message that seems uncannily appropriate.

There may be a very ordinary explanation.

The system knows what you clicked.

What you watched.

What you paused on.

What similar people engaged with.

What subject you searched.

The message feels improbable because you experienced the result.

You did not experience the thousands of filtering steps that produced it.

That does not make the moment meaningless.

It changes the causal story.

A machine can create a coincidence-like experience without intending anything mystical.

That is worth remembering when the world seems to answer immediately.

## But ordinary causation does not erase personal meaning

Imagine that you accidentally open a book to a sentence you desperately needed.

The page did not need supernatural guidance to matter.

Meaning can arise from the relationship between an event and the person experiencing it.

This is close to what Carl Jung meant by **synchronicity**: meaningful coincidence that is experienced as connected without an obvious ordinary causal link.

Modern Jungian writing still treats synchronicity primarily as a concept about meaningful coincidence and subjective significance, not as a simple laboratory law that every striking coincidence proves.[1]

That distinction is useful.

A coincidence can matter to you before you know why it happened.

## The RAW trick: change the model and watch reality reorganize

Robert Anton Wilson loved this territory.

One of his famous exercises asks the reader to spend time looking for a particular object—traditionally a quarter—and notice how reality suddenly seems full of opportunities to find it.

Then the reader is encouraged to try different explanatory models.

Maybe you noticed quarters because selective attention changed.

Maybe consciousness somehow attracted them.

Maybe both stories change how you behave.

The important move is not to rush toward the preferred explanation.

It is to notice that **the model changes the experienced world**.

That is exactly what happens when you begin tracking dream signs.

## Attention creates a new world of evidence

Buy a particular car.

Suddenly that car is everywhere.

Learn a new word.

You hear it three times that week.

Decide that owls are meaningful.

Owls begin appearing.

The world did not necessarily generate more owls.

Your filtering changed.

Psychologists study selective attention, salience, confirmation bias, frequency judgments, and memory effects that can produce this kind of experience.

The effect is not fake.

You really are noticing more.

The error begins only if you assume:

**I noticed more, therefore the external frequency must have increased.**

Those are different measurements.

## Coincidence needs a denominator

Suppose you think of someone and they call five minutes later.

That feels extraordinary.

Now ask:

How many people did you think about this month who did not call?

How many calls arrived when you had not just thought about the caller?

How many almost-matches did you forget?

The dramatic hit is memorable.

The denominator is boring.

The denominator is also where probability lives.

This is why **Test the Experience** insisted on retaining misses.

Synchronicity deserves the same discipline.

## Recurring dreams are real phenomena

Recurring dreams do not require paranormal explanation.

Research defines recurrent dreams as dreams that repeat over time while preserving a similar theme or even substantial content.

Studies find recurring themes such as pursuit, threat, falling, aggression, confrontation, and other emotionally loaded situations.[2]

The important word is **repeat**.

The dream system can revisit material.

That alone makes recurring dream characters and places worth tracking.

## Dream life is not random noise

Research generally supports some form of continuity between waking life and dream life.

Activities, concerns, emotional relationships, and personally important material can be incorporated into dreams.[3]

Not perfectly.

Not literally.

Not every night.

Dreams distort.

Combine.

Transform.

Move people into wrong places.

Merge time periods.

But waking life leaves fingerprints.

That means a recurring place may be related to:

memory;

emotion;

habit;

fear;

desire;

identity;

or unfinished concern.

It might also simply be a useful setting your dreaming mind reuses.

## Dream characters are constrained too

Dream characters can transform in bizarre ways.

Yet research suggests those transformations are not completely arbitrary.

Character and object changes often follow associative constraints rather than becoming absolutely anything at random.[4]

That gives recurring characters an interesting status.

The same figure may return because it occupies a stable place in memory or emotional life.

Or a different-looking figure may repeatedly play the same role.

Teacher.

Pursuer.

Guide.

Ex-partner.

Stranger.

Child.

Authority.

Someone who always knows more than you.

Track role as well as appearance.

## A recurring character is not automatically an independent being

If the same dream character appears repeatedly and seems intelligent, surprising, or autonomous, the experience can become convincing quickly.

You ask a question.

The character says something you did not expect.

They remember a previous dream.

They tell you where to meet next time.

That is extraordinary phenomenology.

It is not yet proof that the character exists independently of the dreamer.

Human cognition can generate speech, social prediction, memory fragments, personalities, and responses outside conscious planning.

The surprise is real.

The ontology remains open.

## Recurring places may be even more interesting

A place can return without returning exactly.

The same mall.

The same city.

The same hotel.

The same school.

The same impossible house.

The same road that does not exist when you are awake.

The same train station.

Sometimes the geometry seems stable.

You know what is around the corner.

A room exists where you remembered it.

A street continues from a previous dream.

This can feel less like dreaming and more like revisiting.

That feeling deserves to be recorded carefully.

## Dreams can maintain identifiable continuity

Research on dream coherence has found that characters, objects, locations, and emotions can provide enough continuity for judges to distinguish intact dream narratives from artificially spliced ones.[5]

Other newer work shows that coherence is not universal and that some dreams contain scene changes so complete that judges cannot reliably tell whether different segments belonged together.[6]

That combination is useful.

Dream worlds can be coherent.

They can also fragment dramatically.

A recurring place should therefore be tracked rather than assumed.

## Build a map before building a mythology

If a place returns, draw it.

Do not improve it.

Do not fill in missing streets.

Mark:

what you actually saw;

where you entered;

what was left;

what was right;

who was present;

what changed;

what stayed stable.

If the next dream returns there, add another layer.

Over months, you may discover:

a stable map;

a family of similar places;

or the illusion of continuity created by memory after waking.

All three are interesting.

## Shared dream places are reported

People do report experiences they describe as **mutual** or **shared dreams**.

A peer-reviewed descriptive study analyzed 102 reports of mutual dreaming while explicitly bracketing the question of whether the dreams were objectively shared.[7]

Most involved two people.

The dreamers were often friends, relatives, or partners.

Many reports contained highly similar settings, themes, characters, events, or objects.

Some occurred while the participants were sleeping in different places.

That is enough to establish something modest:

**mutual dreaming is a recognizable class of human report.**

It does not establish that two people entered one objectively existing dream environment.

## Similar people can dream similar things for ordinary reasons

Close people share enormous amounts of material.

Conversations.

Movies.

Rooms.

Arguments.

Plans.

Fears.

Friends.

Routines.

Symbols.

Jokes.

If two partners dream about their shared apartment on the same night, that is not surprising.

If two friends planning a trip both dream of airports, also not surprising.

Shared context raises the baseline probability of shared content.

That needs to be considered before calling a match paranormal.

## Independent recording changes everything

Suppose two people wake and immediately talk.

One says:

**I dreamed we were at a station.**

The other says:

**Wait. I was somewhere with tracks.**

Now both memories can shift.

The conversation creates a shared narrative.

A better protocol is:

do not talk;

write separately;

timestamp both reports;

then compare.

That simple change makes the result much more interesting.

## Dream telepathy has a controversial research history

Laboratory researchers have attempted to test whether information can influence dream content without ordinary sensory contact.

The best-known experiments occurred at the Maimonides Dream Laboratory, where an external “sender” focused on randomly selected target images while a sleeping participant was awakened from REM and reported dreams.

Some of those studies reported significant correspondences between target material and dream content.

The findings became famous.

They also became controversial.

## Replication did not always succeed

A later attempt by Edward Belvedere and David Foulkes to replicate one of the Maimonides procedures failed to reproduce the original result.[8]

That matters.

A phenomenon that survives only in one laboratory is much harder to treat as established.

Later dream-ESP experiments and meta-analyses have produced mixed interpretations, with supporters arguing for small above-chance effects and critics pointing to methodological variation, publication bias, scoring flexibility, and inconsistent replication.

This is exactly the sort of literature where neither:

**telepathy is proven**

nor:

**nothing interesting ever happened**

is an adequate summary.

## Shared place is a stronger claim than shared theme

Two people dreaming about water is weak.

Two people independently recording:

**a circular room with red tile, three black doors, a broken clock, and a woman named Anna**

would be much more interesting.

Specificity matters.

So does prior probability.

So does whether the participants discussed the target beforehand.

The stronger the shared-place claim, the more detail we should demand.

## Repeated characters can be treated the same way

Suppose you repeatedly meet someone you do not recognize from waking life.

Do not immediately decide that they are:

a spirit;

a guide;

a deceased person;

another dreamer;

an autonomous intelligence.

Start a dossier.

Appearance.

Name.

Voice.

Location.

Behavior.

What they know.

What changes.

What remains stable.

Whether they remember previous meetings.

Whether information they give can later be checked.

The more remarkable the character becomes, the more useful precise records become.

## Meaning can arrive before explanation

There is also a personal layer that should not be sacrificed to methodology.

Sometimes a coincidence changes you.

It gives courage.

It feels like permission.

It closes a chapter.

It makes you call someone.

It makes you notice what you have been avoiding.

The psychological effect is real regardless of the external mechanism.

You do not need to prove cosmic causation before asking:

**What did this coincidence make visible?**

That may be the most useful question.

## But meaning can become self-sealing

The danger arrives when every outcome confirms the theory.

You ask the universe for a raven.

You see a raven.

Confirmation.

You do not see a raven.

Maybe the absence itself is the message.

Now the idea cannot fail.

That is not an experiment.

If you want to test external coincidence, define the rule.

What counts?

What does not?

How long is the window?

How many attempts?

What result would make you less confident?

Keep the door open both ways.

## Maybe finding this page is a coincidence

You could have arrived here through search.

A recommendation.

A link.

A typo.

An algorithm.

A friend.

Curiosity.

Maybe you were already thinking about dreams.

Maybe you were asking whether coincidences mean anything.

Maybe the timing feels uncanny.

I am not going to tell you that you were destined to find this page.

That would be an easy trick.

I will tell you something more useful:

**notice what feels meaningful about finding it.**

Then ask why.

The answer may teach you something whether the cause was cosmic or computational.

## Summary

Coincidences become powerful when events feel connected by meaning rather than obvious causation.

Jung called this synchronicity.[1]

Selective attention, salience, memory, expectation, probability, and confirmation processes can all increase how often patterns seem to appear once we begin looking for them.

Recurring dreams are established phenomena, and dream research shows continuity with waking concerns as well as recurring or constrained characters, objects, locations, and emotions.[2][3][4][5]

Recurring dream places can feel persistent enough to map, but stable dream geography has not been established as an external world.

Reports of mutual/shared dreams exist and have been studied descriptively, especially among emotionally connected people.[7]

That research does not establish that two people literally entered one objective dream space.

Dream-telepathy experiments have a long and controversial history, including positive findings and failed replications.[8]

So the practical rule is:

**notice the pattern;**

**record before discussing;**

**keep misses;**

**compare specific details;**

**separate meaning from mechanism;**

**let extraordinary claims become more precise, not less.**

## Experiment

### Make the Coincidence Earn It

Run these as separate experiments.

Do not combine every strange thing into one theory.

### Choose a symbol

Pick one neutral target you do not normally track.

A quarter.

A yellow umbrella.

A fox.

The number 37.

Write it down.

For one week, notice every clear occurrence.

Also record roughly how much you deliberately searched for it.

At the end ask:

**Did the world change, or did my attention change?**

You may not be able to tell.

That is the point.

### Track recurring characters

Create a recurring-character record.

For each appearance note:

**appearance**

**name**

**role**

**voice**

**location**

**what they knew**

**whether they referred to a previous dream**

**whether anything they said could later be checked**

Do not merge similar characters unless the evidence supports it.

### Map recurring places

If a place returns, sketch it immediately after waking.

Mark only remembered features.

On the next visit, draw again before looking at the old map.

Then compare.

Look for:

stable geometry;

stable landmarks;

changed rooms;

repeated entrances;

recurring inhabitants;

and reconstruction after waking.

### Try a mutual-dream protocol

Only with a willing partner.

Before sleep, choose either:

a simple meeting place;

or a random target that neither person discusses further.

Examples:

**meet at a red train station**

or use a randomly selected image sealed from both participants until morning.

Sleep normally.

Do not sacrifice sleep.

On waking:

do not communicate;

record independently;

timestamp both reports;

then compare.

Score specific matches before discussing interpretations.

### Compare characters and places

If both people report overlap, compare:

**setting**

**objects**

**characters**

**events**

**phrases**

**sequence**

**emotion**

A vague thematic similarity is weaker than a rare specific detail.

Do not upgrade a weak match after conversation.

### Keep the misses

No dream.

Wrong place.

Different character.

No target remembered.

Record them all.

The denominator protects you from building a universe out of highlights.

### Ask what it meant anyway

After the scoring is complete, ask a different question:

**Why did this particular coincidence matter to me?**

That question does not require paranormal proof.

Meaning and mechanism can be investigated separately.

## Intention

**I notice what repeats, record it before explaining it, and let the pattern earn its meaning.**

## References

**[1]** Roesler, C., & Reefschläger, G. I. “Jungian psychotherapy, spirituality, and synchronicity: Theory, applications, and evidence base.” *Psychotherapy* 59 (2022): 339–350. DOI: 10.1037/pst0000402.

**[2]** “The content of recurrent dreams in young adolescents.” *Consciousness and Cognition* (2015). Recurrent dreams preserve themes/content across time; common themes include confrontation, aggression, falling, and pursuit.

**[3]** Schredl, M., & Hofmann, F. “Continuity between waking activities and dream activities.” *Consciousness and Cognition* 12 (2003): 298–308. DOI: 10.1016/S1053-8100(02)00072-7.

**[4]** Rittenhouse, C. D., Stickgold, R., & Hobson, J. A. “Constraint on the Transformation of Characters, Objects, and Settings in Dream Reports.” *Consciousness and Cognition* 3 (1994): 100–113. DOI: 10.1006/ccog.1994.1007.

**[5]** Stickgold, R., Rittenhouse, C. D., & Hobson, J. A. “Dream Splicing: A New Technique for Assessing Thematic Coherence in Subjective Reports of Mental Activity.” *Consciousness and Cognition* 3 (1994): 114–128. DOI: 10.1006/ccog.1994.1008.

**[6]** “The lack of thematic continuity in dreams with scene and plot discontinuities.” *Sleep* (2024/2025). PMID: 39811396.

**[7]** McNamara, P., Dietrich-Egensteiner, L., & Teed, B. “Mutual dreaming.” Peer-reviewed descriptive content analysis of 102 reports of mutual dreams; University of Minnesota research record.

**[8]** Belvedere, E., & Foulkes, D. “Telepathy and Dreams: A Failure to Replicate.” *Perceptual and Motor Skills* 33 (1971): 783–789. DOI: 10.2466/pms.1971.33.3.783.

**[9]** Wilson, R. A. *Prometheus Rising.* Quarter-finding / reality-tunnel exercises. Primary-source cultural influence; not experimental evidence of manifestation.
`,Zt="Notice the Coincidence: Synchronicity, Recurring Dreams, Shared Dreams and Pattern Recognition",Po="/synchronicity-recurring-shared-dreams/",ea=Po;let xn=null;function Lo(){return xn||(xn=S(Oo)),xn}const Wo=`# Return. Record. Repeat: The Best Bedtime Routine for Lucid Dreaming and Astral Projection

We have spent this book learning individual skills.

Remember dreams.

Notice patterns.

Recognize dreams.

Feel the body.

Move attention.

Build sensation.

Quiet the mind.

See imagery.

Watch the sleep edge.

Let the body sleep.

Move without moving.

Feel the shift.

Recognize the threshold.

Stabilize.

Explore.

Loosen self-location.

Cross.

Test.

Compare.

Float in space.

Notice coincidence.

Now stop collecting techniques.

Use them.

The final practice is deliberately simple.

You do not need to perform every exercise every night.

You need a sequence that can become familiar enough that your future sleeping mind recognizes it.

## The best routine protects sleep first

Do not destroy sleep in order to explore sleep.

Chronic sleep loss makes dream practice worse, not better.

It harms attention.

Mood.

Memory.

Judgment.

And the ability to return to sleep.

The lucid-dream induction literature repeatedly points toward procedures that work **within** healthy sleep rather than replacing it.

If a technique regularly leaves you exhausted, shorten it or stop.

The first rule is:

**sleep enough to have something to explore.**

## Daylight is part of tonight's practice

The bedtime routine actually begins after waking.

Get meaningful daytime light.

Especially earlier in the day when practical.

Keep evening light calmer and dimmer than daytime.

The circadian system responds to the contrast.

The Sun does not need to be mystical to help dream practice.

It helps organize sleep.

## Record before you move

Morning practice may be more important than people expect.

When you wake from a dream:

stay still for a moment;

keep the eyes closed if comfortable;

recover the last scene;

then move backward through the dream.

Where were you before that?

Who was there?

What happened just before the ending?

Then record.

A few words are enough to preserve a dream that would otherwise disappear.

Dream recall matters because an unremembered lucid dream is functionally lost to the experiment.

In the International Lucid Dream Induction Study, better general dream recall predicted successful lucid-dream induction.[1]

So the dream journal is not merely an archive.

It trains access to the state you are trying to study.

## During the day, notice anomalies

Do not spend all day mechanically checking whether reality is real.

That can become annoying and meaningless.

Instead, use **situational awareness**.

When something resembles a dream sign:

a strange coincidence;

an impossible event;

a recurring person;

an odd reflection;

a familiar dream place;

a sudden emotional discontinuity;

ask:

**Could this be a dream?**

Then actually inspect the situation.

Read something twice.

Look at your hands.

Remember how you arrived here.

Ask what happened five minutes ago.

The point is not the ritual.

The point is interrupting automatic acceptance.

## Choose one experiment before bed

Do not go to sleep wanting to:

become lucid;

astral project;

visit the Moon;

find a shared dream station;

meet a guide;

test a hidden target;

control the dream;

and solve your childhood all in one night.

Choose one.

Examples:

**Recognize the dream.**

**Remain aware through the transition.**

**Notice self-location.**

**Visit the Moon.**

**Ask one question.**

**Find the recurring station.**

A single intention gives prospective memory a cleaner job.

## MILD gives us the strongest cognitive foundation

The newer systematic review of lucid-dream induction research identifies MILD as the cognitive technique with the strongest current empirical support.[2]

The method is built around prospective memory:

**remembering to remember later.**

You are training the future sleeping mind to recognize a cue.

The basic sequence is:

remember a recent dream;

identify the point where you could have recognized it;

imagine yourself back inside the dream;

see yourself noticing that it is a dream;

set the intention to recognize the next dream.

This is more precise than repeating:

**I will lucid dream.**

## The affirmation should describe the event

The most useful affirmation in this book is not a command for a result.

It describes the transition we want to recognize.

Use:

**My body sleeps. I remain aware. I recognize the transition and calmly enter.**

That sentence has four jobs.

**My body sleeps.**

No struggle.

No forcing.

The body is allowed to do what bodies do.

**I remain aware.**

Attention continues lightly.

Not rigidly.

**I recognize the transition.**

This is prospective memory.

When imagery, movement, self-location, or dream experience becomes autonomous, recognize it.

**I calmly enter.**

Do not celebrate too early.

Do not check the physical body.

Do not break the state by asking whether it worked.

Enter.

## If you prefer classic MILD wording, use it

For nights focused purely on lucid dreaming, an even simpler intention is appropriate:

**Next time I am dreaming, I remember that I am dreaming.**

This closely matches the logic of MILD.

You can rehearse a recent dream while repeating it.

See yourself encounter the dream sign.

See yourself recognize it.

Then let sleep come.

## Do not stack MILD and SSILD automatically

The International Lucid Dream Induction Study compared MILD, SSILD, and a hybrid combining both.[1]

MILD and SSILD performed similarly.

The hybrid did not outperform the individual methods.

That is a useful lesson.

More technique is not automatically more effective.

Choose one induction method for the night.

Give it enough sessions to judge.

Then compare.

## SSILD is a valid alternate route

If MILD feels too verbal or effortful, SSILD may suit you better.

SSILD cycles attention among:

visual experience behind closed eyes;

sound;

and bodily sensation.

The practice is gentle.

Notice.

Move on.

Do not force unusual sensations.

The 2023 systematic review identifies SSILD as promising while noting that replication is still more limited than for MILD.[2]

Use SSILD as its own method.

Not as another task piled onto everything else.

## WBTB is optional, not nightly punishment

Wake Back to Bed can improve the opportunity for lucid-dream induction because later sleep contains more REM.

Laboratory studies combining WBTB and MILD have successfully induced lucid dreams.[3]

Timing matters.

A 2022 sleep-laboratory study found that interrupting sleep earlier reduced induction rates compared with later REM-oriented awakenings.[4]

So:

do not repeatedly wake yourself all night;

do not turn poor sleep into discipline;

do not assume earlier is better.

If you use WBTB, use it occasionally and protect total sleep.

A practical approach is:

sleep normally for several hours;

wake naturally or with one planned later alarm;

remain awake only long enough to recover a dream and perform the chosen induction method;

return to sleep promptly.

In the International Lucid Dream Induction Study, being able to fall asleep within about ten minutes after the technique predicted success.[1]

That is another reason not to turn WBTB into a long midnight ceremony.

## The physical setup should disappear

Comfort matters because the eventual goal is to stop attending to the physical body.

Use a position you can actually fall asleep in.

There is no scientifically privileged astral-projection posture.

Back.

Side.

Whatever works.

Do not choose discomfort because a book told you suffering is spiritual.

Once settled:

make ordinary adjustments;

then stop checking.

Let the bed become background.

## Release the body in order

Use the body-scan skills from earlier.

Jaw.

Eyes.

Tongue.

Shoulders.

Hands.

Belly.

Hips.

Legs.

Feet.

Do not demand numbness.

Do not force paralysis.

Do not chase heaviness.

The target is reduced interference.

If the body feels comfortable enough to be forgotten, the practice is working.

## Use attention lightly

Rigid concentration can keep you awake.

No concentration can turn into unconscious sleep immediately.

The useful middle is **light continuity**.

You may hold:

the affirmation;

the breath;

a point of sensation;

a simple imagined movement;

or passive observation of hypnagogia.

If thought wanders, return gently.

Do not restart the entire ritual.

## Let hypnagogia become autonomous

At first, imagery is something you make.

Then something changes.

A face appears you did not design.

A voice says something unexpected.

A scene continues when you stop directing it.

A movement carries itself.

Earlier we called this the transfer of authorship.

This is one of the most useful threshold markers in the whole book.

When the experience begins continuing on its own:

**reduce effort.**

The doorway is opening.

## If movement helps, choose one movement

Do not climb a rope while rolling sideways while imagining an elevator while vibrating.

Pick one.

**Float.**

**Roll.**

**Rise.**

**Climb.**

Perform the movement internally.

Do not move the physical muscles deliberately.

Notice whether the imagined movement:

stays imagined;

becomes tactile;

becomes vestibular;

changes self-location;

or produces a complete scene.

If nothing happens, let it go.

## Vibrations are not required

You may feel:

buzzing;

pulsing;

electric waves;

internal shaking;

floating;

rocking;

or nothing dramatic at all.

Do not grade the attempt by special effects.

Current evidence does not identify a vibration requirement for lucid dreaming or OBE.

The important event is functional:

**did awareness continue into an autonomous experience?**

## When the scene forms, stop inducing

This is one of the easiest mistakes.

You finally arrive.

Then you keep trying to arrive.

Once a complete environment forms:

look;

touch;

move;

orient.

Stabilize first.

Then remember the experiment.

The induction phase is over.

## Use one inside-state intention

Once stable, use a second simple line:

**I stay with the experience and explore before I explain.**

This protects against two opposite failures.

The first is waking yourself through excitement.

The second is deciding what everything means before seeing what it does.

Explore.

Then interpret.

## If the physical body returns, do not panic

You may suddenly feel:

the mattress;

a hand;

breathing;

the face;

the room.

That does not mean the attempt failed.

Attention may oscillate between body and internally generated experience.

Do not fight.

If the dream/OBE-like environment remains available, move attention back gently.

If waking becomes dominant, wake normally.

Record.

## Sleep paralysis is never required

Do not attempt to force it.

If it happens naturally:

recognize it;

breathe normally;

remember that REM-related atonia is temporary;

choose whether you want to experiment.

If calm, shift attention toward dream movement, imagery, or self-location.

If frightened, focus on waking.

There is no achievement badge for staying in an unpleasant state.

## What about astral projection specifically?

Traditional astral-projection methods emphasize separation.

Roll out.

Float up.

Climb.

Sit up without moving.

Feel the subtle body.

Those methods fit naturally into this routine after the body has lost priority and autonomous experience has begun.

Use them as **experiments in self-location and internally experienced movement**.

If the resulting state feels exactly like leaving the body, record that honestly.

But the routine does not need to tell you what happened ontologically.

That question remains open to testing.

## The strongest routine is a loop

Here it is without commentary.

### Morning

**Wake still.**

**Recover the dream backward.**

**Record immediately.**

**Mark dream signs, recurring characters, places, and anomalies.**

### Day

**Get meaningful daylight.**

**Protect tonight's sleep.**

**When something dreamlike or anomalous happens, ask: Could this be a dream?**

### Before bed

**Choose one experiment.**

**Choose MILD or SSILD—not both by default.**

If using MILD:

**Recall a recent dream.**

**Identify a dream sign.**

**Rehearse becoming lucid.**

Repeat:

**My body sleeps. I remain aware. I recognize the transition and calmly enter.**

### In bed

**Get comfortable.**

**Release the body.**

**Keep attention light.**

**Let imagery develop.**

**Notice when the experience begins continuing on its own.**

If useful:

**float, roll, rise, or climb.**

### At the threshold

**Recognize before intervening.**

**Reduce effort.**

**Do not check the physical body.**

### Inside

**Stabilize.**

**Look.**

**Touch.**

**Move.**

Then:

**I stay with the experience and explore before I explain.**

Perform **one** experiment.

### On return

**Do not analyze yet.**

**Record first.**

**What happened?**

**What was surprising?**

**What can be checked?**

**What repeated?**

Then interpret.

## The weekly rhythm

You do not need maximum effort every night.

A sustainable routine may look like:

most nights:

dream recall;

one intention;

normal sleep.

Occasional nights:

MILD or SSILD with a later natural awakening or one carefully timed WBTB.

Rarely:

more elaborate target experiments or partner protocols.

The goal is continuity.

Not exhaustion.

## Measure the practice by opportunities, not mythology

Track:

dreams remembered;

lucid dreams;

conscious sleep transitions;

OBE-like experiences;

successful stabilization;

experiments remembered;

verified target attempts;

sleep quality;

and nights where nothing happened.

Those are useful measurements.

Do not score:

**felt spiritual enough.**

Do not count ambiguous events as successes simply because you wanted progress.

A practice improves when its records get cleaner.

## What if nothing happens for weeks?

Keep the routine smaller.

Protect sleep.

Keep recalling dreams.

Use one technique.

Do not escalate into:

sleep deprivation;

supplements;

unknown drugs;

hyperventilation;

extreme fasting;

pain;

fear;

or compulsive checking.

Lucid-dream induction is not perfectly reliable even in research settings.[2]

Failure on a given night is normal.

The practice is probabilistic.

## What if it works?

Do not immediately make it more complicated.

Repeat the successful conditions.

Time.

Sleep context.

Technique.

Dream sign.

Body position if relevant.

Transition sensations.

What you did once inside.

Build your own evidence.

One success is a story.

Repeated success is a method.

## The actual superpower

Maybe you eventually decide that astral projection is literal travel.

Maybe you decide it is a form of lucid dreaming.

Maybe your answer remains unresolved.

The practical achievement exists either way.

You learned to remember more of the night.

You learned to notice when experience becomes strange.

You learned to carry intention into dreams.

You learned to remain conscious at the boundary of sleep.

You learned that the felt body can reorganize.

You learned to enter internally generated worlds without immediately waking.

You learned to test extraordinary claims instead of merely believing them.

That is already an unusual set of abilities.

## Return

Every excursion ends.

Come back.

Feel the bed.

Move the fingers.

Open the eyes when ready.

Do not treat return as failure.

Return is part of the method.

## Record

Write before the experience becomes a story.

Use plain language.

Separate:

**what happened;**

**what you thought it meant;**

**what could be verified.**

Record misses too.

## Repeat

The final instruction is not:

**believe.**

It is:

**repeat.**

The experiment becomes valuable over time.

One night is dramatic.

A hundred nights can teach you something.

## Summary

The most evidence-supported lucid-dream induction methods currently include MILD, with SSILD also showing promising results.[1][2]

Dream recall predicts lucid-induction success, and quickly returning to sleep after an induction technique also appears useful.[1]

Wake Back to Bed can improve lucid-dream opportunities when combined with techniques such as MILD, but timing matters, and earlier or excessive sleep interruption can reduce success.[3][4]

No scientific literature currently establishes a reliable method for literal astral separation.

So the best overall practice combines the strongest evidence with the phenomenological skills developed throughout this guide:

**protect sleep;**

**remember dreams;**

**set one intention;**

**use one induction method;**

**relax the body;**

**maintain light awareness;**

**recognize autonomous experience;**

**use one imagined movement if helpful;**

**stabilize before exploring;**

**record before interpreting;**

**repeat.**

The core bedtime affirmation is:

**My body sleeps. I remain aware. I recognize the transition and calmly enter.**

Inside the experience:

**I stay with the experience and explore before I explain.**

## Experiment

### The Thirty-Night Practice

Use the routine for thirty nights if it remains comfortable and does not harm sleep.

Thirty nights is not a magical number.

It is long enough to collect useful personal data.

### Keep the core stable

Do not change the entire method every night.

Choose one primary induction technique:

**MILD**

or:

**SSILD**

Use it consistently enough to judge.

### Record five outcomes

Each morning record:

**dream recall**

**lucidity**

**conscious transition**

**OBE-like experience**

**sleep quality**

Optional:

**experiment completed**

**target result**

**recurring character/place**

### Use WBTB selectively

Do not schedule it every night by default.

If you wake naturally later in the night, that may be enough.

If using an alarm, use one planned awakening and protect total sleep.

### Keep one affirmation

Use:

**My body sleeps. I remain aware. I recognize the transition and calmly enter.**

Do not rotate through twenty affirmations.

Train recognition.

### Keep one inside-state instruction

If you enter a stable experience:

**I stay with the experience and explore before I explain.**

Then perform the night's single experiment.

### Review weekly

At the end of each week ask:

**What preceded my best nights?**

**What damaged sleep?**

**Which technique produced more opportunities?**

**What transition signs repeated?**

**Did confidence match results?**

Adjust one variable at a time.

### End honestly

At the end of thirty nights, summarize:

**what improved;**

**what did not;**

**what remains unexplained;**

**what you want to test next.**

Then either continue the routine or simplify it.

The goal is not to graduate from curiosity.

The goal is to become better at using it.

## Intention

**My body sleeps. I remain aware. I recognize the transition and calmly enter.**

## References

**[1]** Aspy, D. J. “Findings From the International Lucid Dream Induction Study.” *Frontiers in Psychology* 11 (2020): 1746. DOI: 10.3389/fpsyg.2020.01746.

**[2]** Tan, S., Fan, J., & Wei, D. “A systematic review of new empirical data on lucid dream induction techniques.” *Journal of Sleep Research* 32 (2023): e13786. DOI: 10.1111/jsr.13786.

**[3]** Erlacher, D., & Stumbrys, T. “Wake Up, Work on Dreams, Back to Bed and Lucid Dream: A Sleep Laboratory Study.” *Frontiers in Psychology* 11 (2020): 1383. DOI: 10.3389/fpsyg.2020.01383.

**[4]** Erlacher, D., et al. “Combining Wake-Up-Back-to-Bed with Cognitive Induction Techniques: Does Earlier Sleep Interruption Reduce Lucid Dream Induction Rate?” (2022). PMID: 35645242.

**[5]** LaBerge, S., Nagel, L. E., Dement, W. C., & Zarcone, V. P. Jr. “Lucid dreaming verified by volitional communication during REM sleep.” *Perceptual and Motor Skills* 52 (1981): 727–732. DOI: 10.2466/pms.1981.52.3.727.

**[6]** Konkoly, K. R., et al. “Real-time dialogue between experimenters and dreamers during REM sleep.” *Current Biology* 31 (2021): 1417–1427.e6. DOI: 10.1016/j.cub.2021.01.026.
`,Bo="Return. Record. Repeat: The Best Bedtime Routine for Lucid Dreaming and Astral Projection",Fo="/lucid-dreaming-astral-projection-bedtime-routine/",zo=Fo;let An=null;function Ho(){return An||(An=S(Wo)),An}function Yo(){return(navigator.userAgent??"").includes("jsdom")}let Fe=null;function it(){return Fe?.pathname??window.location.pathname}function ot(){return Fe?.hash??window.location.hash}function qo(){return Ue(it())}function jo(n=ot()){return!n||n==="#"||n.startsWith("#/")?fi(n).fragment:n.replace(/^#/,"")}function _o(n){let e;e=Ra(ot())?.path??Ue(it());const t=Ri(e);return t?t.id==="landing"?"landing":t.id==="home"||t.id==="chapter05"&&!Le()?"home":t.id:"home"}function Da(){const n=ot(),e=it(),t=n.startsWith("#/")?Ra(n):null,a=window.location.search;if(t){const i=`${t.path}${a}${t.fragment?`#${t.fragment}`:""}`;if(Fe={pathname:t.path,hash:t.fragment?`#${t.fragment}`:""},!Yo()&&t.path!==Ue(e))return window.location.replace(i),!0;window.history.replaceState(null,"",i)}else n.startsWith("#/")&&(Fe={pathname:Be,hash:""},window.history.replaceState(null,"",`${Be}${a}`));return!1}let Ca=null;function Go(n){return Ca!==n}function Uo(n){Ca=n}function Sn(){typeof history<"u"&&"scrollRestoration"in history&&(history.scrollRestoration="manual"),document.documentElement.scrollTop=0,document.body.scrollTop=0;const n=navigator.userAgent??"";typeof window.scrollTo=="function"&&n.length>0&&!n.includes("jsdom")&&window.scrollTo(0,0)}function Vo(n,e){if(!e)return;const t=n.querySelector(`[id="${e}"]`);if(!t)return;t.closest(".guidebook-section")?.classList.add("is-visible");const a=navigator.userAgent??"";if(typeof t.scrollIntoView=="function"&&a.length>0&&!a.includes("jsdom")){const i=typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;t.scrollIntoView({behavior:i?"auto":"smooth",block:"start"})}t.focus({preventScroll:!0})}let na=null;function Jo(){return qo()}function Ko(){const n=Jo();if(n===na)return;na=n;const e=window.gtag;typeof e=="function"&&e("event","page_view",{page_title:document.title,page_location:`${window.location.origin}${n}`,page_path:n})}const $o=new Uint32Array(256);for(let n=0;n<256;n+=1){let e=n;for(let t=0;t<8;t+=1)e=e&1?3988292384^e>>>1:e>>>1;$o[n]=e>>>0}Promise.resolve();const Qo={days:[{day:1,phaseId:"remember",title:"CATCH THE DREAM",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Start with recall. Do not try to change your dreams yet. Catch what is already there."]},{heading:"PRACTICE",paragraphs:["When you wake, stay quiet for a moment before reaching for your phone or beginning the day.","Ask:","What was happening just before I woke?","Take the first thing that appears:","an image","a place","a person","a feeling","a phrase","a movement","Record it immediately.","A fragment is enough.","If you remember that you were dreaming but nothing else, write:","Dreamed. No details.","Do not fill in missing pieces."]},{heading:"AFFIRMATION",paragraphs:["I remember my dreams when I wake."]},{heading:"RESEARCH NOTE",paragraphs:["Keeping a dream log can improve dream recall, and retrospective estimates may underestimate how often people actually remember dreams.","Source:","Aspy, 2016 — Consciousness and Cognition","https://pubmed.ncbi.nlm.nih.gov/27023923/"]}],source:"canonical-packet"},{day:2,phaseId:"remember",title:"REMEMBER ON CUE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Practice remembering something at the moment you intend to remember it."]},{heading:"PRACTICE",paragraphs:["Choose two ordinary events that will probably happen today.","For example:","When I open the refrigerator, I remember to touch the handle twice.","When I turn off a light, I remember to look at my hand.","Choose your own cues.","Do not set reminders.","Let the event itself trigger the memory."]},{heading:"TONIGHT",paragraphs:["As you settle into bed, use waking as tomorrow’s cue:","When I wake, I remember my dream.","Say it slowly a few times, then sleep normally."]},{heading:"AFFIRMATION",paragraphs:["When I wake, I remember."]},{heading:"RESEARCH NOTE",paragraphs:["Prospective memory—remembering to carry out an intention in the future—is one of the cognitive mechanisms used in MILD, a well-studied lucid-dream induction technique.","Source:","Erlacher & Stumbrys, 2020 — Frontiers in Psychology","https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.01383/full"]}],source:"canonical-packet"},{day:3,phaseId:"remember",title:"RELEASE THE BODY",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Learn the difference between holding tension and letting it go."]},{heading:"PRACTICE",paragraphs:["Get comfortable.","Move through these areas one at a time:","hands","arms","shoulders","jaw","abdomen","legs","feet","For each area:","1. Gently tense it for about three seconds.","2. Release it completely.","3. Feel the difference for a few seconds.","Keep the tension mild.","After the feet, let the whole body rest for one minute without doing anything else."]},{heading:"AFFIRMATION",paragraphs:["My body releases effort easily."]},{heading:"RESEARCH NOTE",paragraphs:["A 2026 systematic review and meta-analysis of 31 randomized trials found that progressive muscle relaxation improved subjective sleep quality, although results varied across studies and populations.","Source:","Donato et al., 2026 — Journal of Psychosomatic Research","https://pubmed.ncbi.nlm.nih.gov/41633054/"]}],source:"canonical-packet"},{day:4,phaseId:"remember",title:"FOLLOW THE BREATH",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Hold attention on one simple physical sensation."]},{heading:"PRACTICE",paragraphs:["Settle somewhere comfortable for about five minutes.","Let your breathing happen naturally.","Choose one place where the breath is easy to feel:","the nostrils","the chest","the abdomen","Keep your attention there.","When you notice that your mind has wandered, return to the same physical sensation.","Do not change the breath.","Do not try to stop thoughts.","Just return."]},{heading:"AFFIRMATION",paragraphs:["My attention returns gently."]},{heading:"RESEARCH NOTE",paragraphs:["Focused-attention practices are commonly defined by choosing one object—such as the sensation of breathing—recognizing distraction, and returning attention to that object.","Source:","Lutz et al., 2008 — Trends in Cognitive Sciences","https://pmc.ncbi.nlm.nih.gov/articles/PMC2693206/"]}],source:"canonical-packet"},{day:5,phaseId:"feel",title:"FIND A POINT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Begin tactile imagery: using attention and imagination to recreate the sense of touch without continuing the physical touch."]},{heading:"PRACTICE",paragraphs:["Choose one small point in the center of your palm.","Touch it lightly with one fingertip for several seconds.","Notice the location.","Remove your finger.","Keep your eyes closed and place your attention on the same point.","Recreate the memory of contact.","Try different versions if they help:","a fingertip pressing lightly","warmth at the point","a tiny pulse","a soft tap","You are not trying to produce a particular sensation.","Try the image and notice how it feels.","Repeat with the other hand."]},{heading:"AFFIRMATION",paragraphs:["I can place my attention precisely."]},{heading:"RESEARCH NOTE",paragraphs:["In a human neural-recording study, imagined touch produced body-part-specific responses that partly overlapped with responses to actual touch.","Source:","Chivukula et al., 2021 — eLife","https://elifesciences.org/articles/61646"]}],source:"canonical-packet"},{day:6,phaseId:"feel",title:"TRACE A LINE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Move imagined touch instead of holding it in one place."]},{heading:"PRACTICE",paragraphs:["Use one fingertip to slowly trace a line from the center of your wrist to the tip of your middle finger.","Repeat the physical trace two or three times.","Then stop touching.","Close your eyes.","Recreate the same moving path internally:","wrist","palm","finger","fingertip","Then reverse it.","Experiment with an image that makes the movement easy to follow:","a fingertip","a soft brush","a pencil eraser","a narrow stream of water","Keep the path slow enough to feel where your attention is moving.","Repeat on the other hand."]},{heading:"AFFIRMATION",paragraphs:["I can move my attention deliberately."]},{heading:"RESEARCH NOTE",paragraphs:["Tactile imagery can preserve information about where on the body an imagined touch is occurring, rather than producing only a vague general response.","Source:","Chivukula et al., 2021 — eLife","https://elifesciences.org/articles/61646"]}],source:"canonical-packet"},{day:7,phaseId:"feel",title:"STIR",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Turn the moving line into continuous motion."]},{heading:"PRACTICE",paragraphs:["Choose a small area in the center of one palm.","With a fingertip from the other hand, slowly draw a small circle there several times.","Stop touching.","Close your eyes.","Continue the same circle in imagination.","Keep it slow.","After a minute, reverse direction.","Then try changing the imagined contact:","a fingertip","a rounded brush","a small ball","a swirl of warm water","Use whichever version makes the circular motion easiest to follow.","Repeat with the other hand."]},{heading:"AFFIRMATION",paragraphs:["My attention can create continuous motion."]},{heading:"RESEARCH NOTE",paragraphs:["Imagined touch is studied as a real form of sensory cognition, but the neural response may reflect several processes—including attention, sensory anticipation, memory, and imagery itself.","Source:","Chivukula et al., 2021 — eLife","https://elifesciences.org/articles/61646"]}],source:"canonical-packet"},{day:8,phaseId:"feel",title:"BRUSH THE HAND",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Widen the moving sensation."]},{heading:"PRACTICE",paragraphs:["Hold one hand open.","Imagine a soft brush moving from the wrist, across the palm, and out through the fingertips.","Bring it back the same way.","Keep the motion slow.","Try changing the width of the imagined brush:","one finger wide","three fingers wide","the full width of the palm","You can physically brush the path once first if that helps.","Then remove the physical touch and continue in imagination.","Repeat with the other hand."]},{heading:"AFFIRMATION",paragraphs:["I can widen the path of my attention."]},{heading:"RESEARCH NOTE",paragraphs:["Imagined touch can preserve information about both body location and the character of the imagined contact.","Source:","Chivukula et al., 2021 — eLife","https://elifesciences.org/articles/61646"]}],source:"canonical-packet"},{day:9,phaseId:"feel",title:"WORK THE FINGERS",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Make the imagined movement more precise."]},{heading:"PRACTICE",paragraphs:["Choose one hand.","Move imagined touch slowly through the thumb from base to tip.","Then the index finger.","Then the middle finger.","Continue through the ring finger and little finger.","Reverse direction.","Now sweep through all five fingers together.","Try switching between:","one finger","two fingers","the whole hand","Repeat with the other hand."]},{heading:"AFFIRMATION",paragraphs:["I can separate and combine areas of attention."]},{heading:"RESEARCH NOTE",paragraphs:["Somatosensory imagery can be represented with body-part specificity rather than as one undifferentiated bodily sensation.","Source:","Chivukula et al., 2021 — eLife","https://elifesciences.org/articles/61646"]}],source:"canonical-packet"},{day:10,phaseId:"feel",title:"WORK THE FEET",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Transfer the same skill to a different part of the body."]},{heading:"PRACTICE",paragraphs:["Start with one foot.","Choose a point on the sole and touch it briefly.","Remove the touch and recreate it in imagination.","Then try:","a line from heel to toes","a small circle in the center of the sole","a broad brush across the whole foot","Move through the toes one at a time.","Then repeat with the other foot.","Use whatever imagined contact makes the path easiest to follow."]},{heading:"AFFIRMATION",paragraphs:["My attention reaches any part of my body."]},{heading:"RESEARCH NOTE",paragraphs:["Body-focused imagery is not limited to the hands; imagined touch can be organized around distinct body locations.","Source:","Chivukula et al., 2021 — eLife","https://elifesciences.org/articles/61646"]}],source:"canonical-packet"},{day:11,phaseId:"feel",title:"DRAW UP THE ARM",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Extend the imagined path across a whole limb."]},{heading:"PRACTICE",paragraphs:["Start at the fingertips of one hand.","Imagine a narrow line of contact moving slowly through:","fingers","palm","wrist","forearm","elbow","upper arm","shoulder","Then bring it back down.","Do not jump between areas.","Keep one continuous path.","Try a fingertip, brush, stream of water, or any image that makes the movement easy to follow.","Repeat on the other arm."]},{heading:"AFFIRMATION",paragraphs:["My attention moves smoothly through my body."]},{heading:"RESEARCH NOTE",paragraphs:["Motor and sensory imagery both rely on internal representations of the body and can preserve information about movement and location without overt movement.","Source:","Hurst & Boe, 2022 — Frontiers in Human Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC9815148/"]}],source:"canonical-packet"},{day:12,phaseId:"feel",title:"DRAW UP THE LEG",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Make the path longer and vary its width."]},{heading:"PRACTICE",paragraphs:["Start at the toes of one foot.","Imagine a narrow line moving through:","foot","ankle","lower leg","knee","thigh","hip","Then return to the toes.","Repeat several times.","Now make the imagined contact wider.","Instead of a thin line, imagine a broad sweep moving through the whole leg.","Repeat with the other leg."]},{heading:"AFFIRMATION",paragraphs:["I can narrow and widen my attention."]},{heading:"RESEARCH NOTE",paragraphs:["Kinesthetic and somatosensory imagery can represent both movement and bodily location without requiring the movement to occur physically.","Source:","Hurst & Boe, 2022 — Frontiers in Human Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC9815148/"]}],source:"canonical-packet"},{day:13,phaseId:"feel",title:"MOVE THROUGH, NOT OVER",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Shift from surface touch to three-dimensional movement."]},{heading:"PRACTICE",paragraphs:["Choose one hand and forearm.","Instead of imagining contact moving across the skin, imagine something passing through the whole space of the hand.","Try:","a soft sponge moving through it","a wave passing through it","a warm current traveling from fingertips to elbow","a sphere slowly moving along the arm","Keep the physical arm still.","You do not need to visualize anatomy.","Just imagine movement through volume instead of across a surface.","Repeat on the other side."]},{heading:"AFFIRMATION",paragraphs:["I can imagine movement through space inside my body."]},{heading:"RESEARCH NOTE",paragraphs:["A 2025 preregistered study directly compared body-scan practice with guided imagery while measuring interoception-related outcomes.","Source:","Schwerdtfeger et al., 2025 — Applied Psychology: Health and Well-Being","https://iaap-journals.onlinelibrary.wiley.com/doi/10.1111/aphw.70073"]}],source:"canonical-packet"},{day:14,phaseId:"feel",title:"THE FULL CIRCUIT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Link the separate body exercises into one continuous route."]},{heading:"PRACTICE",paragraphs:["Lie or sit comfortably.","Begin at the feet.","Move imagined sensation slowly through:","feet","legs","hips","torso","shoulders","arms","hands","back to the shoulders","neck","head","Then reverse the route.","Use a line, brush, wave, current, or any other image that stays easy to follow.","Do not rush through areas just to complete the circuit.","Keep the movement continuous."]},{heading:"AFFIRMATION",paragraphs:["I can move awareness through my whole body."]},{heading:"RESEARCH NOTE",paragraphs:["Scientific models of bodily awareness treat the sense of the body as an integration of multiple signals, including touch, proprioception, vision, and vestibular information.","Source:","Pfeiffer, Serino & Blanke, 2014 — Frontiers in Integrative Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC4028995/"]}],source:"canonical-packet"},{day:15,phaseId:"hold",title:"HOLD ONE POINT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Stay with one simple sensation longer than before."]},{heading:"PRACTICE",paragraphs:["Choose one physical sensation:","breath at the nostrils","pressure where your hands touch","contact between your body and the chair or bed","Stay with that one point for about seven minutes.","When attention drifts, return to the same place.","Do not try to stop thought.","The practice is:","find it","lose it","find it again"]},{heading:"AFFIRMATION",paragraphs:["I can hold my attention where I choose."]},{heading:"RESEARCH NOTE",paragraphs:["Focused-attention practice is commonly described as selecting one object, noticing distraction, and returning attention to that object.","Source:","Lutz et al., 2008 — Trends in Cognitive Sciences","https://pmc.ncbi.nlm.nih.gov/articles/PMC2693206/"]}],source:"canonical-packet"},{day:16,phaseId:"hold",title:"CATCH THE DRIFT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Notice the moment you realize your attention has moved."]},{heading:"PRACTICE",paragraphs:["Use the same kind of single-point focus as yesterday.","When you realize you have been thinking about something else, say one word silently:","drift","Then return.","Do not analyze the thought.","Do not restart the timer.","Do not judge how long you were gone.","Just catch the change and come back."]},{heading:"AFFIRMATION",paragraphs:["I notice when my attention moves."]},{heading:"RESEARCH NOTE",paragraphs:["Meta-awareness means becoming aware of the current state or contents of your own mind; this kind of self-monitoring is relevant to recognizing when a dream is a dream.","Source:","Baird, Mota-Rolim & Dresler, 2019 — Neuroscience & Biobehavioral Reviews","https://pmc.ncbi.nlm.nih.gov/articles/PMC6451677/"]}],source:"canonical-packet"},{day:17,phaseId:"hold",title:"OPEN THE FIELD",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Stop choosing one object and notice the whole field instead."]},{heading:"PRACTICE",paragraphs:["Begin with one minute of attention on the breath.","Then stop selecting.","For about five minutes, let these come and go:","sounds","body sensations","darkness behind the eyes","thoughts","images","Do not follow any one thing for long.","If a thought carries you away, notice it and reopen the field."]},{heading:"AFFIRMATION",paragraphs:["I can notice without following."]},{heading:"RESEARCH NOTE",paragraphs:["Researchers distinguish focused attention from open monitoring, where awareness stays broad instead of resting on one fixed object.","Source:","Lutz et al., 2008 — Trends in Cognitive Sciences","https://pmc.ncbi.nlm.nih.gov/articles/PMC2693206/"]}],source:"canonical-packet"},{day:18,phaseId:"hold",title:"NARROW / WIDE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Change the size of your attention on purpose."]},{heading:"PRACTICE",paragraphs:["For about four minutes, alternate every thirty seconds:","NARROW","Choose one tiny point in one hand.","WIDE","Feel the whole body at once.","Then spend about two minutes with sound:","NARROW","Choose one specific sound.","WIDE","Listen to the entire sound field.","Move back and forth deliberately."]},{heading:"AFFIRMATION",paragraphs:["I can narrow and widen awareness."]},{heading:"RESEARCH NOTE",paragraphs:["Focused and open-monitoring practices use different attentional operations, making deliberate shifts in scope a useful exercise in attention control.","Source:","Lutz et al., 2008 — Trends in Cognitive Sciences","https://pmc.ncbi.nlm.nih.gov/articles/PMC2693206/"]}],source:"canonical-packet"},{day:19,phaseId:"hold",title:"KEEP THE MOTION ALIVE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Sustain one imagined sensation without changing techniques."]},{heading:"PRACTICE",paragraphs:["Choose one image from Days 5–14:","a brush","a circle","a wave","a line","a current","Run it through one hand or forearm for about five minutes.","When the imagined movement disappears, restart it where you lost it.","Keep the physical body still.","Do not switch to a different image because the first one fades."]},{heading:"AFFIRMATION",paragraphs:["I can sustain an imagined sensation."]},{heading:"RESEARCH NOTE",paragraphs:["Mental imagery can recruit some of the same sensory systems involved in perception, including body-part-specific responses during imagined touch.","Source:","Chivukula et al., 2021 — eLife","https://elifesciences.org/articles/61646"]}],source:"canonical-packet"},{day:20,phaseId:"hold",title:"HOLD TWO LAYERS",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Keep one light background anchor while another sensation moves in the foreground."]},{heading:"PRACTICE",paragraphs:["Get comfortable.","Keep a light awareness of natural breathing.","At the same time, imagine a brush moving slowly from one hand up the arm and back.","Let the imagined movement stay in the foreground.","Let the breath remain in the background.","If one disappears, restore it and continue.","Do not worry if attention shifts back and forth at first.","Three to five minutes is enough."]},{heading:"AFFIRMATION",paragraphs:["I can remain aware of more than one layer."]},{heading:"RESEARCH NOTE",paragraphs:["Dividing attention across concurrent streams can create interference, so this exercise does not require perfect parallel attention.","Source:","Wahn & Sinnett, 2019 — Multisensory Research","https://pubmed.ncbi.nlm.nih.gov/31059470/"]}],source:"canonical-packet"},{day:21,phaseId:"hold",title:"CARRY A THREAD INTO SLEEP",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Keep one very light thread of awareness while you allow sleep to happen."]},{heading:"TONIGHT",paragraphs:["Do this at your normal bedtime.","Choose one simple thread:","the breath","a slow circle in one palm","a slow brushing motion along one hand","Keep it gentle.","You are not trying to stay awake.","You are not waiting for anything unusual.","Let yourself fall asleep normally while occasionally remembering the thread.","If it disappears, let it disappear.","If you notice it again, resume lightly."]},{heading:"AFFIRMATION",paragraphs:["I remain aware as I relax into sleep."]},{heading:"RESEARCH NOTE",paragraphs:["Hypnagogia is a transitional state between wakefulness and sleep in which spontaneous sensory experiences and unusual thought can occur.","Source:","Ghibellini & Meier, 2023 — Journal of Sleep Research","https://pmc.ncbi.nlm.nih.gov/articles/PMC10078162/"]}],source:"canonical-packet"},{day:22,phaseId:"recognize",title:"FIND THE IMPOSSIBLE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Use your own dreams to find the kinds of details that can reveal a dream."]},{heading:"PRACTICE",paragraphs:["Read a few recent dream fragments.","Choose three details that would have been unusual, impossible, or out of place if they happened while awake.","For example:","a person somewhere they should not be","a room arranged incorrectly","impossible movement","technology behaving strangely","a sudden location change","someone appearing who is no longer alive","Use your own examples.","If recent recall is sparse, use any older dream you remember clearly."]},{heading:"TONIGHT",paragraphs:["Choose one of your dream signs and remember it before sleep."]},{heading:"AFFIRMATION",paragraphs:["I notice when something does not make sense."]},{heading:"RESEARCH NOTE",paragraphs:["MILD commonly uses unusual or impossible details from remembered dreams as cues for recognizing that one is dreaming.","Source:","Erlacher & Stumbrys, 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7332853/"]}],source:"canonical-packet"},{day:23,phaseId:"recognize",title:"REMEMBER THE FUTURE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Train an intention to return when a future cue appears."]},{heading:"PRACTICE",paragraphs:["Choose two natural events that are likely to happen today.","For example:","When I walk through my front door, I remember to look closely at my surroundings.","When my phone rings, I remember what I intended to do.","Do not set reminders.","Let the event itself trigger the memory."]},{heading:"TONIGHT",paragraphs:["Use one simple intention:","When something unusual happens in a dream, I remember to notice it."]},{heading:"AFFIRMATION",paragraphs:["I remember when the moment arrives."]},{heading:"RESEARCH NOTE",paragraphs:["Prospective memory is the ability to remember an intended action when a future cue occurs, and it is central to MILD.","Source:","Tan & Fan, 2023 — Journal of Sleep Research","https://doi.org/10.1111/jsr.13786"]}],source:"canonical-packet"},{day:24,phaseId:"recognize",title:"QUESTION THE STATE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Ask whether you might be dreaming only when there is a reason to ask."]},{heading:"PRACTICE",paragraphs:["A few times today, when something feels genuinely odd, repetitive, surprising, or dreamlike, stop.","Ask:","Could I be dreaming?","Then perform one simple test.","Try either:","read a short piece of text or a clock, look away, then read it again","or","gently close your nose and see whether breathing still feels possible","Do not perform checks constantly.","The question matters more than the ritual."]},{heading:"AFFIRMATION",paragraphs:["When something is strange, I question my state."]},{heading:"RESEARCH NOTE",paragraphs:["Reality testing is widely used in lucid-dream practice, but evidence for it as a stand-alone induction method is weaker than for MILD.","Source:","Tan & Fan, 2023 — Journal of Sleep Research","https://doi.org/10.1111/jsr.13786"]}],source:"canonical-packet"},{day:25,phaseId:"recognize",title:"REHEARSE RECOGNITION",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Practice becoming lucid inside a dream you already remember."]},{heading:"PRACTICE",paragraphs:["Do this before bedtime, but not while trying to fall asleep.","Recall one recent dream.","Choose one dream sign from it.","Imagine the dream again.","When the dream sign appears in imagination, stop and think:","This is a dream.","Then continue imagining the same dream while knowing that you are dreaming.","Repeat the sequence a few times."]},{heading:"AFFIRMATION",paragraphs:["When I am dreaming, I remember that I am dreaming."]},{heading:"RESEARCH NOTE",paragraphs:["MILD combines prospective intention with mental rehearsal of recognizing a dream sign in a remembered dream.","Source:","Erlacher & Stumbrys, 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7332853/"]}],source:"canonical-packet"},{day:26,phaseId:"recognize",title:"CARRY THE INTENTION TO SLEEP",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Take yesterday’s recognition exercise to the edge of sleep."]},{heading:"TONIGHT",paragraphs:["Get comfortable and prepare to sleep normally.","Recall one dream sign.","Briefly imagine recognizing it and thinking:","This is a dream.","Repeat only until the intention feels clear.","Then stop rehearsing.","Let sleep come.","Do not force the phrase for long periods."]},{heading:"AFFIRMATION",paragraphs:["The next time I dream, I remember I am dreaming."]},{heading:"RESEARCH NOTE",paragraphs:["In a large field study, participants who returned to sleep relatively quickly after induction practice were more likely to report lucid dreams.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7379166/"]}],source:"canonical-packet"},{day:27,phaseId:"recognize",title:"USE A NATURAL AWAKENING",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Use a remembered dream immediately if you wake from one naturally."]},{heading:"TONIGHT",paragraphs:["If you wake from a dream during the night or early morning:","stay comfortable","recall the dream","choose one dream sign","imagine returning to the dream","rehearse recognizing the sign","set the intention to notice the next dream","return to sleep","Do not set an alarm for this exercise.","If you do not wake naturally, use Day 26 at bedtime instead."]},{heading:"AFFIRMATION",paragraphs:["When I return to dreaming, I remember."]},{heading:"RESEARCH NOTE",paragraphs:["MILD is especially well suited to practice after awakening from a remembered dream because the dream can be used immediately for rehearsal.","Source:","Erlacher & Stumbrys, 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7332853/"]}],source:"canonical-packet"},{day:28,phaseId:"recognize",title:"WAKE INSIDE THE DREAM",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Turn waking itself into a recognition cue."]},{heading:"PRACTICE",paragraphs:["Each time you genuinely wake from sleep or a nap today, pause before getting absorbed in the day.","Ask:","Am I fully awake?","Perform one calm state check.","Then continue normally.","Do not repeat this every time you stand up or enter a room.","Use waking as the cue."]},{heading:"AFFIRMATION",paragraphs:["When I wake, I check where I am."]},{heading:"RESEARCH NOTE",paragraphs:["False awakenings have been recorded in sleep laboratories and show physiological characteristics closer to dreaming than ordinary wakefulness.","Source:","Mainieri et al., 2021 — Journal of Clinical Sleep Medicine","https://pubmed.ncbi.nlm.nih.gov/33283752/"]}],source:"canonical-packet"},{day:29,phaseId:"recognize",title:"REHEARSE THE FIRST LUCID MOMENT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Practice what you will do in the first few seconds after recognizing a dream."]},{heading:"PRACTICE",paragraphs:["Close your eyes and imagine that you suddenly realize:","This is a dream.","Then rehearse only the first few seconds.","Pause.","Look closely at one nearby object.","Touch one surface if you can.","Stay with the scene instead of immediately trying to control everything.","Repeat the short rehearsal a few times."]},{heading:"TONIGHT",paragraphs:["If you become lucid, use the same response."]},{heading:"AFFIRMATION",paragraphs:["When I become lucid, I stay present."]},{heading:"RESEARCH NOTE",paragraphs:["Lucid dreaming can be objectively verified in sleep laboratories using deliberate eye-movement signals during sleep.","Source:","Baird, Mota-Rolim & Dresler, 2019 — Neuroscience & Biobehavioral Reviews","https://pmc.ncbi.nlm.nih.gov/articles/PMC6451677/"]}],source:"canonical-packet"},{day:30,phaseId:"recognize",title:"FULL RECOGNITION NIGHT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Combine the complete recognition method."]},{heading:"TONIGHT",paragraphs:["At normal bedtime:","1. Recall a recent dream.","2. Choose one dream sign.","3. Imagine recognizing it.","4. Form the intention to notice the next dream.","5. Let sleep come naturally.","If you wake naturally from a dream later, repeat the sequence once.","Do not set an alarm.","Do not extend wakefulness.","Perform the method and let the night unfold."]},{heading:"AFFIRMATION",paragraphs:["When I am dreaming, I recognize the dream."]},{heading:"RESEARCH NOTE",paragraphs:["In the International Lucid Dream Induction Study, stronger dream recall predicted better induction outcomes, and successful MILD practice was not associated with reduced sleep quality in that sample.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7379166/"]}],source:"canonical-packet"},{day:31,phaseId:"observe",title:"WATCH THE DARK",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Observe the visual field behind closed eyes without trying to create anything."]},{heading:"PRACTICE",paragraphs:["At bedtime or during a comfortable rest, close your eyes.","Let them remain relaxed.","Notice the darkness behind your eyelids.","Do not search for shapes.","Do not name every flicker.","Do not try to make a picture.","Just watch.","If imagery begins, let it change by itself."]},{heading:"AFFIRMATION",paragraphs:["I can watch without interfering."]},{heading:"RESEARCH NOTE",paragraphs:["Hypnagogia is the transition from wakefulness toward sleep, and spontaneous visual imagery can occur during that period.","Source:","Ghibellini & Meier, 2023 — Journal of Sleep Research","https://pmc.ncbi.nlm.nih.gov/articles/PMC10078162/"]}],source:"canonical-packet"},{day:32,phaseId:"observe",title:"LISTEN INWARD",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Observe the auditory field without straining to hear."]},{heading:"PRACTICE",paragraphs:["Lie comfortably with your eyes closed.","Begin with ordinary sounds around you.","Then notice quieter sounds:","your breathing","fabric moving","distant background noise","faint internal sound if present","Do not search for unusual sounds.","Do not invent them.","Let hearing stay open."]},{heading:"AFFIRMATION",paragraphs:["I can listen without searching."]},{heading:"RESEARCH NOTE",paragraphs:["Auditory experiences are a documented part of hypnagogia, although visual and kinesthetic experiences are reported more often.","Source:","Ghibellini & Meier, 2023 — Journal of Sleep Research","https://pmc.ncbi.nlm.nih.gov/articles/PMC10078162/"]}],source:"canonical-packet"},{day:33,phaseId:"observe",title:"FEEL THE WHOLE FIELD",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Observe the body without trying to change it."]},{heading:"PRACTICE",paragraphs:["Lie still enough to notice the body as one field.","Do not brush, stir, or trace.","Notice:","contact with the bed or chair","weight","temperature","breathing","position","Let the body feel however it feels."]},{heading:"AFFIRMATION",paragraphs:["I can observe my body without changing it."]},{heading:"RESEARCH NOTE",paragraphs:["Kinesthetic and body-related experiences are among the most commonly reported forms of hypnagogic experience.","Source:","Ghibellini & Meier, 2023","https://www.sciencedirect.com/science/article/pii/S1053810023001198"]}],source:"canonical-packet"},{day:34,phaseId:"observe",title:"THREE CHANNELS",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Move attention through vision, hearing, and body sensation."]},{heading:"PRACTICE",paragraphs:["Close your eyes.","For about twenty seconds:","watch the visual field.","Then:","listen to the auditory field.","Then:","feel the bodily field.","Repeat the cycle several times.","Do not search for unusual content in any channel.","Just move attention."]},{heading:"AFFIRMATION",paragraphs:["I can move awareness through my senses."]},{heading:"RESEARCH NOTE",paragraphs:["SSILD is a lucid-dream induction method built around cycling attention through visual, auditory, and bodily sensations.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.01746/full"]}],source:"canonical-packet"},{day:35,phaseId:"observe",title:"LIGHTER CYCLES",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Make the same sensory cycle less effortful."]},{heading:"PRACTICE",paragraphs:["Repeat yesterday’s sequence:","watch","listen","feel","This time, do not concentrate hard.","Touch each channel lightly with attention, then move on.","After several slower cycles, let the transitions become easier and less deliberate.","When you finish, stop the exercise and sleep normally."]},{heading:"AFFIRMATION",paragraphs:["My awareness can move without effort."]},{heading:"RESEARCH NOTE",paragraphs:["SSILD performed similarly to MILD in one large field study, but researchers have not established exactly why sensory cycling may help.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7379166/"]}],source:"canonical-packet"},{day:36,phaseId:"observe",title:"LET IMAGERY FORM",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Notice the difference between imagery you create and imagery that appears on its own."]},{heading:"PRACTICE",paragraphs:["Begin with one familiar imagined object or tactile motion for about one minute.","For example:","a circle in the palm","a brush across the hand","a simple object","Then stop creating it.","Remain quietly attentive.","If an image, sound, phrase, or movement-like impression appears without deliberate construction, observe it without developing it.","Do not chase it."]},{heading:"AFFIRMATION",paragraphs:["I can notice what arises on its own."]},{heading:"RESEARCH NOTE",paragraphs:["A common feature of hypnagogic imagery is that it can appear spontaneously as deliberate control over thought decreases.","Source:","Ghibellini & Meier, 2023 — Journal of Sleep Research","https://pmc.ncbi.nlm.nih.gov/articles/PMC10078162/"]}],source:"canonical-packet"},{day:37,phaseId:"observe",title:"NOTICE THE BODY MAP",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Observe your sense of body position while remaining physically still."]},{heading:"PRACTICE",paragraphs:["Lie comfortably.","Keep a light awareness of:","where your hands seem to be","where your feet seem to be","the outline of your body","up and down","left and right","Do not correct any change with movement unless you are uncomfortable.","If everything feels completely ordinary, continue observing."]},{heading:"AFFIRMATION",paragraphs:["I can observe my sense of position."]},{heading:"RESEARCH NOTE",paragraphs:["Scientific models of bodily self-consciousness treat self-location as an integration of touch, proprioceptive, visual, and vestibular information.","Source:","Pfeiffer, Serino & Blanke, 2014 — Frontiers in Integrative Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC4028995/"]}],source:"canonical-packet"},{day:38,phaseId:"observe",title:"OBSERVE THE TRANSITION",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Combine passive observation as sleep begins."]},{heading:"TONIGHT",paragraphs:["At your normal bedtime:","1. Watch the visual field briefly.","2. Listen briefly.","3. Feel the body briefly.","4. Stop cycling.","5. Let attention become passive.","6. Allow sleep to come.","If a spontaneous image, sound, phrase, or movement-like impression appears, observe it without chasing it.","Do not try to stay awake.","Do not wait for a specific event."]},{heading:"AFFIRMATION",paragraphs:["I remain curious as sleep begins."]},{heading:"RESEARCH NOTE",paragraphs:["Sleep onset is a gradual transition rather than an instant switch, and internally generated sensory experiences can emerge before conventional sleep is fully established.","Source:","Ghibellini & Meier, 2023 — Journal of Sleep Research","https://pmc.ncbi.nlm.nih.gov/articles/PMC10078162/"]}],source:"canonical-packet"},{day:39,phaseId:"move",title:"ROCK",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Create a simple whole-body movement in imagination while the body stays still."]},{heading:"PRACTICE",paragraphs:["Lie comfortably.","Imagine your whole body rocking gently from side to side.","Keep the movement small and slow:","left","center","right","center","Do not watch yourself from outside.","Feel the motion from inside.","If it helps, physically rock once or twice first.","Then stop moving and recreate the same motion internally."]},{heading:"AFFIRMATION",paragraphs:["I can imagine movement without moving."]},{heading:"RESEARCH NOTE",paragraphs:["Motor imagery is the mental simulation of movement without overt action, and it recruits several brain systems also involved in actual movement.","Source:","Hurst & Boe, 2022 — Frontiers in Human Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC9815148/"]}],source:"canonical-packet"},{day:40,phaseId:"move",title:"ROLL",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Add rotation."]},{heading:"PRACTICE",paragraphs:["Lie still.","Imagine the whole body slowly rolling to one side as if turning over in bed.","Do not move any muscles.","Continue the imagined roll farther than a normal physical turn.","Then reverse direction.","Stay in first-person perspective.","You do not need to picture the room clearly.","Focus on the felt rotation."]},{heading:"AFFIRMATION",paragraphs:["I can feel imagined rotation."]},{heading:"RESEARCH NOTE",paragraphs:["Kinesthetic imagery focuses on the felt qualities of movement rather than simply seeing movement from the outside.","Source:","Krüger, Hegele & Rieger, 2024 — Psychological Research","https://link.springer.com/article/10.1007/s00426-022-01771-y"]}],source:"canonical-packet"},{day:41,phaseId:"move",title:"GLIDE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Move sideways without rotating."]},{heading:"PRACTICE",paragraphs:["Imagine your whole body drifting several inches to the left while staying level.","Return to center.","Then drift to the right.","Imagine a platform sliding smoothly beneath you.","Keep the movement horizontal.","Do not intentionally move your head or eyes.","Repeat slowly."]},{heading:"AFFIRMATION",paragraphs:["I can move my sense of position."]},{heading:"RESEARCH NOTE",paragraphs:["Vestibular processing contributes to perceived self-motion, self-location, and spatial orientation.","Source:","Pfeiffer, Serino & Blanke, 2014 — Frontiers in Integrative Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC4028995/"]}],source:"canonical-packet"},{day:42,phaseId:"move",title:"FLOAT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Move vertically."]},{heading:"PRACTICE",paragraphs:["Imagine the whole body becoming lighter and rising a few inches.","Pause.","Then settle back down.","Repeat slowly:","rise","pause","settle","Do not force a picture of the room below you.","Prioritize the felt movement.","If it helps, imagine:","water lifting you","an elevator rising","a platform moving upward","or simple upward motion"]},{heading:"AFFIRMATION",paragraphs:["I can imagine rising and settling."]},{heading:"RESEARCH NOTE",paragraphs:["Vestibular and multisensory signals contribute to self-motion, self-location, and first-person perspective.","Source:","Pfeiffer, Serino & Blanke, 2014","https://pmc.ncbi.nlm.nih.gov/articles/PMC4028995/"]}],source:"canonical-packet"},{day:43,phaseId:"move",title:"REACH WITHOUT MOVING",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Extend an imagined movement beyond normal physical range."]},{heading:"PRACTICE",paragraphs:["Choose one arm.","Keep it completely still.","Imagine reaching toward an object or point beyond comfortable physical reach.","Feel the movement through:","shoulder","arm","hand","fingers","Then return.","Next, reach farther than the physical arm could actually extend.","Try upward.","Try outward.","Do not worry about anatomical realism.","Follow the intended movement."]},{heading:"AFFIRMATION",paragraphs:["My imagined movement is not limited by physical range."]},{heading:"RESEARCH NOTE",paragraphs:["Motor imagery can represent intended actions and their sensory consequences even when the movement is not physically performed.","Source:","Hurst & Boe, 2022 — Frontiers in Human Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC9815148/"]}],source:"canonical-packet"},{day:44,phaseId:"move",title:"MOVE TOWARD A POINT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Move your sense of position instead of only moving a limb."]},{heading:"PRACTICE",paragraphs:["Choose one simple destination:","the door","the ceiling","the foot of the bed","a corner of the room","Keep your physical body still.","Imagine your point of view moving toward that location.","Do not picture yourself traveling from outside.","Move from first-person perspective.","Return to your starting point.","Repeat."]},{heading:"AFFIRMATION",paragraphs:["I can move my point of view in imagination."]},{heading:"RESEARCH NOTE",paragraphs:["Researchers distinguish self-location—the felt place where “I” am—from body ownership, the feeling that a body belongs to me.","Source:","Blanke, 2012 — Nature Reviews Neuroscience","https://www.nature.com/articles/nrn3292"]}],source:"canonical-packet"},{day:45,phaseId:"move",title:"SUSTAIN ONE MOTION",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Choose one movement and stay with it."]},{heading:"PRACTICE",paragraphs:["Pick whichever motion from the last six days feels easiest:","rock","roll","glide","float","reach","move toward a point","Repeat only that motion for about five minutes.","Do not switch because attention wanders.","Restore the same motion and continue.","As it becomes familiar, use less effort while keeping the movement clear."]},{heading:"AFFIRMATION",paragraphs:["I can sustain imagined motion."]},{heading:"RESEARCH NOTE",paragraphs:["Imagined and executed movement share some neural systems, but mental movement is not identical to physical movement.","Source:","Hurst & Boe, 2022 — Frontiers in Human Neuroscience","https://pmc.ncbi.nlm.nih.gov/articles/PMC9815148/"]}],source:"canonical-packet"},{day:46,phaseId:"move",title:"LET THE MOTION LEAD",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Begin the motion deliberately, then interfere less."]},{heading:"PRACTICE",paragraphs:["At bedtime or during a relaxed session:","1. Relax the body.","2. Choose your strongest imagined movement.","3. Create it deliberately for a short time.","4. Gradually use less effort to maintain it.","5. Notice whether it continues, fades, changes, or stops.","If the movement changes, do not immediately rebuild the original version.","Follow what is already happening."]},{heading:"AFFIRMATION",paragraphs:["I can begin the motion and then let it change."]},{heading:"RESEARCH NOTE",paragraphs:["Floating, spinning, and other movement-without-movement sensations are described as vestibular-motor experiences in some sleep-paralysis and OBE research.","Source:","Cheyne & Girard, 2009 — Cortex","https://pubmed.ncbi.nlm.nih.gov/18621363/"]}],source:"canonical-packet"},{day:47,phaseId:"attempt",title:"BUILD THE SEQUENCE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Combine the skills you have trained into one simple bedtime sequence."]},{heading:"TONIGHT",paragraphs:["At your normal bedtime:","1. Relax the body.","2. Choose one light anchor:","breath","palm circle","or whole-body sensation","3. Briefly notice:","visual field","sound","body","4. Choose one motion from MOVE.","5. Sustain it gently.","6. Use less effort.","7. Allow sleep.","Do not add extra techniques."]},{heading:"AFFIRMATION",paragraphs:["I know the sequence and let it unfold."]},{heading:"RESEARCH NOTE",paragraphs:["Current sleep-related OBE research focuses more on transitions among waking, dreaming, and REM-related states than on one specific “exit” technique.","Source:","Campillo-Ferrer et al., 2024 — Neuroscience & Biobehavioral Reviews","https://pubmed.ncbi.nlm.nih.gov/38880408/"]}],source:"canonical-packet"},{day:48,phaseId:"attempt",title:"NATURAL AWAKENING ATTEMPT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Try the same sequence after a natural awakening."]},{heading:"TONIGHT",paragraphs:["If you wake naturally during the night or early morning and still feel sleepy:","stay comfortable","recall the dream if one is present","use one light anchor","choose one familiar motion","reduce effort","return to sleep","Do not set an alarm for this exercise.","If you do not wake naturally, use Day 47 at bedtime."]},{heading:"AFFIRMATION",paragraphs:["When I wake naturally, I can return with awareness."]},{heading:"RESEARCH NOTE",paragraphs:["Later-night sleep contains more REM than early-night sleep, which is one reason lucid-dream induction research often uses late-sleep awakenings.","Source:","Erlacher & Stumbrys, 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7332853/"]}],source:"canonical-packet"},{day:49,phaseId:"attempt",title:"SHORTEN THE SEQUENCE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["See how much of the method you can remove."]},{heading:"TONIGHT",paragraphs:["Use only:","relax","one anchor","one motion","reduce effort","sleep","Do not cycle through every sense.","Do not repeat several affirmations.","Do not change motions.","Keep the sequence small."]},{heading:"AFFIRMATION",paragraphs:["I can hold the same intention with less effort."]},{heading:"RESEARCH NOTE",paragraphs:["In lucid-dream induction studies, returning to sleep relatively quickly after practice has been associated with better outcomes.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7379166/"]}],source:"canonical-packet"},{day:50,phaseId:"attempt",title:"LUCID DREAM BRIDGE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["If lucidity appears, use movement instead of trying to control the entire dream."]},{heading:"TONIGHT",paragraphs:["If you become lucid:","pause","let the dream continue","choose one familiar motion:","roll","rise","float","or move toward a point","Perform it from first-person perspective.","Notice what changes.","If no lucid dream occurs, use the shortened bedtime sequence from Day 49."]},{heading:"AFFIRMATION",paragraphs:["When I become lucid, I can explore movement deliberately."]},{heading:"RESEARCH NOTE",paragraphs:["Lucid dreams and sleep-related OBEs are treated as distinct experiences in current research, even though both can occur around REM-related and sleep-transition states.","Source:","Campillo-Ferrer et al., 2024 — Neuroscience & Biobehavioral Reviews","https://pubmed.ncbi.nlm.nih.gov/38880408/"]}],source:"canonical-packet"},{day:51,phaseId:"attempt",title:"TIMED ATTEMPT",optional:!0,optionalNote:"Optional timing experiment. Skip it without penalty.",sections:[{heading:"TODAY",paragraphs:["Test whether late-sleep timing changes the experience."]},{heading:"TONIGHT",paragraphs:["This exercise is optional.","Skip it if you are short on sleep, have difficulty returning to sleep, or need uninterrupted rest.","If you choose to try it:","Set an alarm for about six hours after you expect to fall asleep.","When you wake, stay up only briefly.","Keep yourself sleepy.","Use one short intention:","I remain aware as I return to sleep.","Return to bed.","Then use:","relax","one anchor","one motion","reduce effort","sleep","If you skip the alarm, use the same compressed sequence at a natural awakening or at bedtime."]},{heading:"AFFIRMATION",paragraphs:["I return to sleep with light awareness."]},{heading:"RESEARCH NOTE",paragraphs:["In one sleep-laboratory study, lucid dreams occurred more often when MILD was practiced after about six hours of sleep than during control conditions.","Source:","Erlacher & Stumbrys, 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7332853/"]}],source:"canonical-packet"},{day:52,phaseId:"attempt",title:"STRENGTHEN THE THREAD",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Test a slightly stronger awareness anchor."]},{heading:"TONIGHT",paragraphs:["Choose one anchor that requires a little more active tracking:","count breaths from 1 to 10","or","trace one slow tactile path repeatedly","Keep the anchor for several minutes.","Then add one familiar motion.","After the motion is clear, reduce effort.","Do not try to stay awake indefinitely."]},{heading:"AFFIRMATION",paragraphs:["I can keep a light thread of awareness."]},{heading:"RESEARCH NOTE",paragraphs:["In one large field study, lucid-dream induction was more successful among participants who fell asleep within 10 minutes of completing the technique.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7379166/"]}],source:"canonical-packet"},{day:53,phaseId:"attempt",title:"LIGHTEN THE THREAD",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Test the opposite: less effort."]},{heading:"TONIGHT",paragraphs:["Do not count.","Do not cycle senses.","Do not rehearse several movements.","Relax.","Choose one simple motion.","Make it faint.","Let thoughts and imagery drift around it.","If the motion disappears, do not immediately rebuild it.","Rest."]},{heading:"AFFIRMATION",paragraphs:["I do not have to force the transition."]},{heading:"RESEARCH NOTE",paragraphs:["Sleep onset naturally involves decreasing deliberate control over thought and imagery.","Source:","Ghibellini & Meier, 2023 — Journal of Sleep Research","https://pmc.ncbi.nlm.nih.gov/articles/PMC10078162/"]}],source:"canonical-packet"},{day:54,phaseId:"attempt",title:"COMMIT TO ONE ROUTE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Choose one route and stay with it."]},{heading:"TONIGHT",paragraphs:["Pick one:","SENSORY","one tactile anchor","→ whole-body sensation","→ one motion","OBSERVATION","watch / listen / feel","→ let imagery arise","→ one motion","LUCID","MILD","→ recognize the dream","→ one motion","NATURAL AWAKENING","wake from a dream","→ stay comfortable","→ one motion","→ return to sleep","MINIMAL","relax","→ one motion","Choose before the attempt.","Do not switch routes because nothing happens immediately."]},{heading:"AFFIRMATION",paragraphs:["I stay with one method."]},{heading:"RESEARCH NOTE",paragraphs:["Current research does not identify one universal induction pathway for sleep-related OBEs.","Source:","Moix et al., 2025 — EXPLORE","https://pubmed.ncbi.nlm.nih.gov/40540759/"]}],source:"canonical-packet"},{day:55,phaseId:"learn-your-door",title:"CHOOSE THE EASIEST ENTRY",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Begin with the route that takes the least effort to start."]},{heading:"TONIGHT",paragraphs:["Choose one entry based on your own experience:","SENSORY","one tactile anchor","OBSERVATION","watch, listen, or feel","LUCID","MILD intention","MOTION","one familiar imagined movement","NATURAL AWAKENING","use the method only if you wake from a dream","Choose the easiest one to begin.","Not the most dramatic.","Use that entry for a few minutes.","Then add one familiar motion if it fits.","Reduce effort and allow sleep."]},{heading:"AFFIRMATION",paragraphs:["I begin with what comes naturally."]},{heading:"RESEARCH NOTE",paragraphs:["In lucid-dream induction research, general dream recall and the ability to return to sleep efficiently have predicted outcomes better than prior experience with induction techniques.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7379166/"]}],source:"canonical-packet"},{day:56,phaseId:"learn-your-door",title:"REMOVE ONE STEP",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Simplify the route you chose yesterday."]},{heading:"TONIGHT",paragraphs:["Repeat the same route.","Remove one part you do not seem to need.","For example:","sensory anchor","→ motion","observation","→ motion","MILD","→ sleep","natural awakening","→ motion","Do not replace the removed step with something new.","Try the simpler version and let sleep come."]},{heading:"AFFIRMATION",paragraphs:["I use only what I need."]},{heading:"RESEARCH NOTE",paragraphs:["More complicated induction procedures do not automatically outperform simpler ones; in one large study, combining MILD and SSILD did not improve results over either method alone.","Source:","Aspy et al., 2020 — Frontiers in Psychology","https://pmc.ncbi.nlm.nih.gov/articles/PMC7379166/"]}],source:"canonical-packet"},{day:57,phaseId:"learn-your-door",title:"HOLD ONE INTENTION",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Replace procedural thinking with one clear intention."]},{heading:"TONIGHT",paragraphs:["Choose one sentence before you begin.","For example:","I remain aware as sleep begins.","When I dream, I recognize it.","I follow the movement.","I return to sleep with awareness.","Choose one.","Then stop giving yourself instructions.","Use the simplest version of your method."]},{heading:"AFFIRMATION",paragraphs:["My intention stays simple."]},{heading:"RESEARCH NOTE",paragraphs:["MILD works through prospective intention and rehearsal rather than through endlessly repeating a phrase.","Source:","Tan & Fan, 2023 — Journal of Sleep Research","https://doi.org/10.1111/jsr.13786"]}],source:"canonical-packet"},{day:58,phaseId:"learn-your-door",title:"FOLLOW THE FIRST CHANGE",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["When something changes, stop adding technique."]},{heading:"TONIGHT",paragraphs:["Use your personal method.","If something begins to change naturally:","imagery","sound","body sense","movement","dream scene","self-location","lucidity","stop adding steps.","Follow the change already happening.","If nothing changes, continue lightly and sleep."]},{heading:"AFFIRMATION",paragraphs:["When the state changes, I follow it."]},{heading:"RESEARCH NOTE",paragraphs:["Current models of sleep-related OBEs emphasize transitions among waking, REM-related, lucid-dream, and sleep-paralysis states rather than one universal induction mechanism.","Source:","Campillo-Ferrer et al., 2024 — Neuroscience & Biobehavioral Reviews","https://pubmed.ncbi.nlm.nih.gov/38880408/"]}],source:"canonical-packet"},{day:59,phaseId:"learn-your-door",title:"ONE ENTRY, ONE ACTION",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Reduce the method to two parts."]},{heading:"TONIGHT",paragraphs:["Choose:","ONE ENTRY","and","ONE ACTION","Examples:","palm sensation","→ float","breath","→ roll","MILD","→ recognize","visual field","→ rise","natural awakening","→ move toward a point","Use only those two parts.","No second technique.","No rescue sequence.","No restart unless you become fully awake."]},{heading:"AFFIRMATION",paragraphs:["I use one entry and one action."]},{heading:"RESEARCH NOTE",paragraphs:["A 2025 scoping review found that OBEs can occur spontaneously, be self-induced, or arise through different methods rather than one universal pathway.","Source:","Moix et al., 2025 — EXPLORE","https://pubmed.ncbi.nlm.nih.gov/40540759/"]}],source:"canonical-packet"},{day:60,phaseId:"learn-your-door",title:"INDEPENDENT ATTEMPT",optional:!1,optionalNote:null,sections:[{heading:"TODAY",paragraphs:["Use the method without adding anything because this is Day 60."]},{heading:"TONIGHT",paragraphs:["Choose your own:","time","entry","anchor, if any","movement, if any","MILD intention, if any","point where you stop trying and sleep","Keep it simple.","Perform one attempt.","Then sleep."]},{heading:"AFFIRMATION",paragraphs:["I know how to continue."]},{heading:"RESEARCH NOTE",paragraphs:["Morning dream recall varies substantially between people and can also change from night to night with sleep patterns and other factors.","Source:","Elce et al., 2025 — Communications Psychology","https://pubmed.ncbi.nlm.nih.gov/39966517/"]}],source:"canonical-packet"}]};function m(n,e={},t=[]){const a=document.createElement(n);for(const[i,o]of Object.entries(e))if(!(o===void 0||o===!1)){if(o===!0){a.setAttribute(i,"");continue}if(i==="class"){a.className=o;continue}a.setAttribute(i,o)}for(const i of t)a.append(i);return a}function Xo(n){return document.createTextNode(n)}const we={recorder:null,recordingActive:!1,starting:!1,recordingStartedAt:null};function Zo(){we.recorder?.release(),we.recorder=null,we.recordingActive=!1,we.starting=!1,we.recordingStartedAt=null}const ta=["Remember a dream fragment when you wake","Practice remembering at everyday cues","Release tension in the body","Follow the breath for five minutes","Focus on one small point in your palm","Trace a slow line on your hand","Stir sensation in the center of your palm","Brush attention across one open hand","Work attention through each finger","Work attention through one foot","Draw attention up one arm","Draw attention up one leg","Move attention through the arm, not over it","Run the full attention circuit once","Hold one physical sensation steady","Catch when attention starts to drift","Open attention to a wider field","Alternate narrow and wide attention","Keep a chosen motion alive in attention","Hold two layers of sensation at once","Carry a thread of attention into sleep","Look for something gently impossible","Rehearse remembering tomorrow’s intention","Question whether you are awake or dreaming","Rehearse recognizing the dream state","Carry your intention as you fall asleep","Use a natural night waking if one comes","Practice waking inside the dream","Rehearse the first moment of lucidity","Run a full recognition practice tonight","Watch the dark behind closed eyes","Listen inward without naming sounds","Feel the whole body field at once","Notice sight, sound, and body together","Let attention move in lighter cycles","Let imagery form without forcing it","Notice how the body is mapped in mind","Observe the edge between wake and sleep","Rock attention gently in the body","Roll attention through the body","Glide attention smoothly","Float attention with less effort","Reach toward a point without moving","Move attention toward one point","Sustain one small motion in attention","Let the motion lead your attention","Build a short sequence of motions","Try one attempt after a natural awakening","Shorten your sequence to the essentials","Bridge from lucid dream back to calm wakefulness","Try one timed attempt window","Strengthen one thread of intention","Lighten the same thread of intention","Commit to one entry route for tonight","Choose the easiest entry you know","Remove one step from your routine","Hold one clear intention only","Follow the first change you notice","One entry, one action, then stop","Choose your own simple attempt, then sleep"];new Set(Qo.days.map(n=>n.title));if(ta.length!==60)throw new Error(`Expected 60 plain titles, got ${ta.length}`);const Na=173.1446326846693,Oa=14959787069098932e-8,H=.017453292519943295,ze=57.29577951308232,er=365.24217,aa=new Date("2000-01-01T12:00:00Z"),K=2*Math.PI,ee=3600*(180/Math.PI),ue=484813681109536e-20,Pa=10800*60,nr=2*Pa,tr=Pa/Math.PI,ar=-.17-5*Math.log10(tr),ia=29.530588,ir=24*3600,or=6378.1366,rr=or/Oa,La=81.30056,rt=.0002959122082855911,Wn=2825345909524226e-22,Bn=8459715185680659e-23,Fn=1292024916781969e-23,zn=1524358900784276e-23;function Wa(n){if(n!==!0&&n!==!1)throw console.trace(),`Value is not boolean: ${n}`;return n}function te(n){if(!Number.isFinite(n))throw console.trace(),`Value is not a finite number: ${n}`;return n}function ce(n){return n-Math.floor(n)}function sr(n,e){const t=n.x*n.x+n.y*n.y+n.z*n.z;if(Math.abs(t)<1e-8)throw"AngleBetween: first vector is too short.";const a=e.x*e.x+e.y*e.y+e.z*e.z;if(Math.abs(a)<1e-8)throw"AngleBetween: second vector is too short.";const i=(n.x*e.x+n.y*e.y+n.z*e.z)/Math.sqrt(t*a);return i<=-1?180:i>=1?0:ze*Math.acos(i)}var g;(function(n){n.Sun="Sun",n.Moon="Moon",n.Mercury="Mercury",n.Venus="Venus",n.Earth="Earth",n.Mars="Mars",n.Jupiter="Jupiter",n.Saturn="Saturn",n.Uranus="Uranus",n.Neptune="Neptune",n.Pluto="Pluto",n.SSB="SSB",n.EMB="EMB",n.Star1="Star1",n.Star2="Star2",n.Star3="Star3",n.Star4="Star4",n.Star5="Star5",n.Star6="Star6",n.Star7="Star7",n.Star8="Star8"})(g||(g={}));const lr=[g.Star1,g.Star2,g.Star3,g.Star4,g.Star5,g.Star6,g.Star7,g.Star8],hr=[{ra:0,dec:0,dist:0},{ra:0,dec:0,dist:0},{ra:0,dec:0,dist:0},{ra:0,dec:0,dist:0},{ra:0,dec:0,dist:0},{ra:0,dec:0,dist:0},{ra:0,dec:0,dist:0},{ra:0,dec:0,dist:0}];function cr(n){const e=lr.indexOf(n);return e>=0?hr[e]:null}function st(n){const e=cr(n);return e&&e.dist>0?e:null}var X;(function(n){n[n.From2000=0]="From2000",n[n.Into2000=1]="Into2000"})(X||(X={}));const Q={Mercury:[[[[4.40250710144,0,0],[.40989414977,1.48302034195,26087.9031415742],[.050462942,4.47785489551,52175.8062831484],[.00855346844,1.16520322459,78263.70942472259],[.00165590362,4.11969163423,104351.61256629678],[.00034561897,.77930768443,130439.51570787099],[7583476e-11,3.71348404924,156527.41884944518]],[[26087.90313685529,0,0],[.01131199811,6.21874197797,26087.9031415742],[.00292242298,3.04449355541,52175.8062831484],[.00075775081,6.08568821653,78263.70942472259],[.00019676525,2.80965111777,104351.61256629678]]],[[[.11737528961,1.98357498767,26087.9031415742],[.02388076996,5.03738959686,52175.8062831484],[.01222839532,3.14159265359,0],[.0054325181,1.79644363964,78263.70942472259],[.0012977877,4.83232503958,104351.61256629678],[.00031866927,1.58088495658,130439.51570787099],[7963301e-11,4.60972126127,156527.41884944518]],[[.00274646065,3.95008450011,26087.9031415742],[.00099737713,3.14159265359,0]]],[[[.39528271651,0,0],[.07834131818,6.19233722598,26087.9031415742],[.00795525558,2.95989690104,52175.8062831484],[.00121281764,6.01064153797,78263.70942472259],[.00021921969,2.77820093972,104351.61256629678],[4354065e-11,5.82894543774,130439.51570787099]],[[.0021734774,4.65617158665,26087.9031415742],[.00044141826,1.42385544001,52175.8062831484]]]],Venus:[[[[3.17614666774,0,0],[.01353968419,5.59313319619,10213.285546211],[.00089891645,5.30650047764,20426.571092422],[5477194e-11,4.41630661466,7860.4193924392],[3455741e-11,2.6996444782,11790.6290886588],[2372061e-11,2.99377542079,3930.2096962196],[1317168e-11,5.18668228402,26.2983197998],[1664146e-11,4.25018630147,1577.3435424478],[1438387e-11,4.15745084182,9683.5945811164],[1200521e-11,6.15357116043,30639.856638633]],[[10213.28554621638,0,0],[.00095617813,2.4640651111,10213.285546211],[7787201e-11,.6247848222,20426.571092422]]],[[[.05923638472,.26702775812,10213.285546211],[.00040107978,1.14737178112,20426.571092422],[.00032814918,3.14159265359,0]],[[.00287821243,1.88964962838,10213.285546211]]],[[[.72334820891,0,0],[.00489824182,4.02151831717,10213.285546211],[1658058e-11,4.90206728031,20426.571092422],[1378043e-11,1.12846591367,11790.6290886588],[1632096e-11,2.84548795207,7860.4193924392],[498395e-11,2.58682193892,9683.5945811164],[221985e-11,2.01346696541,19367.1891622328],[237454e-11,2.55136053886,15720.8387848784]],[[.00034551041,.89198706276,10213.285546211]]]],Earth:[[[[1.75347045673,0,0],[.03341656453,4.66925680415,6283.0758499914],[.00034894275,4.62610242189,12566.1516999828],[3417572e-11,2.82886579754,3.523118349],[3497056e-11,2.74411783405,5753.3848848968],[3135899e-11,3.62767041756,77713.7714681205],[2676218e-11,4.41808345438,7860.4193924392],[2342691e-11,6.13516214446,3930.2096962196],[1273165e-11,2.03709657878,529.6909650946],[1324294e-11,.74246341673,11506.7697697936],[901854e-11,2.04505446477,26.2983197998],[1199167e-11,1.10962946234,1577.3435424478],[857223e-11,3.50849152283,398.1490034082],[779786e-11,1.17882681962,5223.6939198022],[99025e-10,5.23268072088,5884.9268465832],[753141e-11,2.53339052847,5507.5532386674],[505267e-11,4.58292599973,18849.2275499742],[492392e-11,4.20505711826,775.522611324],[356672e-11,2.91954114478,.0673103028],[284125e-11,1.89869240932,796.2980068164],[242879e-11,.34481445893,5486.777843175],[317087e-11,5.84901948512,11790.6290886588],[271112e-11,.31486255375,10977.078804699],[206217e-11,4.80646631478,2544.3144198834],[205478e-11,1.86953770281,5573.1428014331],[202318e-11,2.45767790232,6069.7767545534],[126225e-11,1.08295459501,20.7753954924],[155516e-11,.83306084617,213.299095438]],[[6283.0758499914,0,0],[.00206058863,2.67823455808,6283.0758499914],[4303419e-11,2.63512233481,12566.1516999828]],[[8721859e-11,1.07253635559,6283.0758499914]]],[[],[[.00227777722,3.4137662053,6283.0758499914],[3805678e-11,3.37063423795,12566.1516999828]]],[[[1.00013988784,0,0],[.01670699632,3.09846350258,6283.0758499914],[.00013956024,3.05524609456,12566.1516999828],[308372e-10,5.19846674381,77713.7714681205],[1628463e-11,1.17387558054,5753.3848848968],[1575572e-11,2.84685214877,7860.4193924392],[924799e-11,5.45292236722,11506.7697697936],[542439e-11,4.56409151453,3930.2096962196],[47211e-10,3.66100022149,5884.9268465832],[85831e-11,1.27079125277,161000.6857376741],[57056e-11,2.01374292245,83996.84731811189],[55736e-11,5.2415979917,71430.69561812909],[174844e-11,3.01193636733,18849.2275499742],[243181e-11,4.2734953079,11790.6290886588]],[[.00103018607,1.10748968172,6283.0758499914],[1721238e-11,1.06442300386,12566.1516999828]],[[4359385e-11,5.78455133808,6283.0758499914]]]],Mars:[[[[6.20347711581,0,0],[.18656368093,5.0503710027,3340.6124266998],[.01108216816,5.40099836344,6681.2248533996],[.00091798406,5.75478744667,10021.8372800994],[.00027744987,5.97049513147,3.523118349],[.00010610235,2.93958560338,2281.2304965106],[.00012315897,.84956094002,2810.9214616052],[8926784e-11,4.15697846427,.0172536522],[8715691e-11,6.11005153139,13362.4497067992],[6797556e-11,.36462229657,398.1490034082],[7774872e-11,3.33968761376,5621.8429232104],[3575078e-11,1.6618650571,2544.3144198834],[4161108e-11,.22814971327,2942.4634232916],[3075252e-11,.85696614132,191.4482661116],[2628117e-11,.64806124465,3337.0893083508],[2937546e-11,6.07893711402,.0673103028],[2389414e-11,5.03896442664,796.2980068164],[2579844e-11,.02996736156,3344.1355450488],[1528141e-11,1.14979301996,6151.533888305],[1798806e-11,.65634057445,529.6909650946],[1264357e-11,3.62275122593,5092.1519581158],[1286228e-11,3.06796065034,2146.1654164752],[1546404e-11,2.91579701718,1751.539531416],[1024902e-11,3.69334099279,8962.4553499102],[891566e-11,.18293837498,16703.062133499],[858759e-11,2.4009381194,2914.0142358238],[832715e-11,2.46418619474,3340.5951730476],[83272e-10,4.49495782139,3340.629680352],[712902e-11,3.66335473479,1059.3819301892],[748723e-11,3.82248614017,155.4203994342],[723861e-11,.67497311481,3738.761430108],[635548e-11,2.92182225127,8432.7643848156],[655162e-11,.48864064125,3127.3133312618],[550474e-11,3.81001042328,.9803210682],[55275e-10,4.47479317037,1748.016413067],[425966e-11,.55364317304,6283.0758499914],[415131e-11,.49662285038,213.299095438],[472167e-11,3.62547124025,1194.4470102246],[306551e-11,.38052848348,6684.7479717486],[312141e-11,.99853944405,6677.7017350506],[293198e-11,4.22131299634,20.7753954924],[302375e-11,4.48618007156,3532.0606928114],[274027e-11,.54222167059,3340.545116397],[281079e-11,5.88163521788,1349.8674096588],[231183e-11,1.28242156993,3870.3033917944],[283602e-11,5.7688543494,3149.1641605882],[236117e-11,5.75503217933,3333.498879699],[274033e-11,.13372524985,3340.6797370026],[299395e-11,2.78323740866,6254.6266625236]],[[3340.61242700512,0,0],[.01457554523,3.60433733236,3340.6124266998],[.00168414711,3.92318567804,6681.2248533996],[.00020622975,4.26108844583,10021.8372800994],[3452392e-11,4.7321039319,3.523118349],[2586332e-11,4.60670058555,13362.4497067992],[841535e-11,4.45864030426,2281.2304965106]],[[.00058152577,2.04961712429,3340.6124266998],[.00013459579,2.45738706163,6681.2248533996]]],[[[.03197134986,3.76832042431,3340.6124266998],[.00298033234,4.10616996305,6681.2248533996],[.00289104742,0,0],[.00031365539,4.4465105309,10021.8372800994],[34841e-9,4.7881254926,13362.4497067992]],[[.00217310991,6.04472194776,3340.6124266998],[.00020976948,3.14159265359,0],[.00012834709,1.60810667915,6681.2248533996]]],[[[1.53033488271,0,0],[.1418495316,3.47971283528,3340.6124266998],[.00660776362,3.81783443019,6681.2248533996],[.00046179117,4.15595316782,10021.8372800994],[8109733e-11,5.55958416318,2810.9214616052],[7485318e-11,1.77239078402,5621.8429232104],[5523191e-11,1.3643630377,2281.2304965106],[382516e-10,4.49407183687,13362.4497067992],[2306537e-11,.09081579001,2544.3144198834],[1999396e-11,5.36059617709,3337.0893083508],[2484394e-11,4.9254563992,2942.4634232916],[1960195e-11,4.74249437639,3344.1355450488],[1167119e-11,2.11260868341,5092.1519581158],[1102816e-11,5.00908403998,398.1490034082],[899066e-11,4.40791133207,529.6909650946],[992252e-11,5.83861961952,6151.533888305],[807354e-11,2.10217065501,1059.3819301892],[797915e-11,3.44839203899,796.2980068164],[740975e-11,1.49906336885,2146.1654164752]],[[.01107433345,2.03250524857,3340.6124266998],[.00103175887,2.37071847807,6681.2248533996],[128772e-9,0,0],[.0001081588,2.70888095665,10021.8372800994]],[[.00044242249,.47930604954,3340.6124266998],[8138042e-11,.86998389204,6681.2248533996]]]],Jupiter:[[[[.59954691494,0,0],[.09695898719,5.06191793158,529.6909650946],[.00573610142,1.44406205629,7.1135470008],[.00306389205,5.41734730184,1059.3819301892],[.00097178296,4.14264726552,632.7837393132],[.00072903078,3.64042916389,522.5774180938],[.00064263975,3.41145165351,103.0927742186],[.00039806064,2.29376740788,419.4846438752],[.00038857767,1.27231755835,316.3918696566],[.00027964629,1.7845459182,536.8045120954],[.0001358973,5.7748104079,1589.0728952838],[8246349e-11,3.5822792584,206.1855484372],[8768704e-11,3.63000308199,949.1756089698],[7368042e-11,5.0810119427,735.8765135318],[626315e-10,.02497628807,213.299095438],[6114062e-11,4.51319998626,1162.4747044078],[4905396e-11,1.32084470588,110.2063212194],[5305285e-11,1.30671216791,14.2270940016],[5305441e-11,4.18625634012,1052.2683831884],[4647248e-11,4.69958103684,3.9321532631],[3045023e-11,4.31676431084,426.598190876],[2609999e-11,1.56667394063,846.0828347512],[2028191e-11,1.06376530715,3.1813937377],[1764763e-11,2.14148655117,1066.49547719],[1722972e-11,3.88036268267,1265.5674786264],[1920945e-11,.97168196472,639.897286314],[1633223e-11,3.58201833555,515.463871093],[1431999e-11,4.29685556046,625.6701923124],[973272e-11,4.09764549134,95.9792272178]],[[529.69096508814,0,0],[.00489503243,4.2208293947,529.6909650946],[.00228917222,6.02646855621,7.1135470008],[.00030099479,4.54540782858,1059.3819301892],[.0002072092,5.45943156902,522.5774180938],[.00012103653,.16994816098,536.8045120954],[6067987e-11,4.42422292017,103.0927742186],[5433968e-11,3.98480737746,419.4846438752],[4237744e-11,5.89008707199,14.2270940016]],[[.00047233601,4.32148536482,7.1135470008],[.00030649436,2.929777887,529.6909650946],[.00014837605,3.14159265359,0]]],[[[.02268615702,3.55852606721,529.6909650946],[.00109971634,3.90809347197,1059.3819301892],[.00110090358,0,0],[8101428e-11,3.60509572885,522.5774180938],[6043996e-11,4.25883108339,1589.0728952838],[6437782e-11,.30627119215,536.8045120954]],[[.00078203446,1.52377859742,529.6909650946]]],[[[5.20887429326,0,0],[.25209327119,3.49108639871,529.6909650946],[.00610599976,3.84115365948,1059.3819301892],[.00282029458,2.57419881293,632.7837393132],[.00187647346,2.07590383214,522.5774180938],[.00086792905,.71001145545,419.4846438752],[.00072062974,.21465724607,536.8045120954],[.00065517248,5.9799588479,316.3918696566],[.00029134542,1.67759379655,103.0927742186],[.00030135335,2.16132003734,949.1756089698],[.00023453271,3.54023522184,735.8765135318],[.00022283743,4.19362594399,1589.0728952838],[.00023947298,.2745803748,7.1135470008],[.00013032614,2.96042965363,1162.4747044078],[970336e-10,1.90669633585,206.1855484372],[.00012749023,2.71550286592,1052.2683831884],[7057931e-11,2.18184839926,1265.5674786264],[6137703e-11,6.26418240033,846.0828347512],[2616976e-11,2.00994012876,1581.959348283]],[[.0127180152,2.64937512894,529.6909650946],[.00061661816,3.00076460387,1059.3819301892],[.00053443713,3.89717383175,522.5774180938],[.00031185171,4.88276958012,536.8045120954],[.00041390269,0,0]]]],Saturn:[[[[.87401354025,0,0],[.11107659762,3.96205090159,213.299095438],[.01414150957,4.58581516874,7.1135470008],[.00398379389,.52112032699,206.1855484372],[.00350769243,3.30329907896,426.598190876],[.00206816305,.24658372002,103.0927742186],[792713e-9,3.84007056878,220.4126424388],[.00023990355,4.66976924553,110.2063212194],[.00016573588,.43719228296,419.4846438752],[.00014906995,5.76903183869,316.3918696566],[.0001582029,.93809155235,632.7837393132],[.00014609559,1.56518472,3.9321532631],[.00013160301,4.44891291899,14.2270940016],[.00015053543,2.71669915667,639.897286314],[.00013005299,5.98119023644,11.0457002639],[.00010725067,3.12939523827,202.2533951741],[5863206e-11,.23656938524,529.6909650946],[5227757e-11,4.20783365759,3.1813937377],[6126317e-11,1.76328667907,277.0349937414],[5019687e-11,3.17787728405,433.7117378768],[459255e-10,.61977744975,199.0720014364],[4005867e-11,2.24479718502,63.7358983034],[2953796e-11,.98280366998,95.9792272178],[387367e-10,3.22283226966,138.5174968707],[2461186e-11,2.03163875071,735.8765135318],[3269484e-11,.77492638211,949.1756089698],[1758145e-11,3.2658010994,522.5774180938],[1640172e-11,5.5050445305,846.0828347512],[1391327e-11,4.02333150505,323.5054166574],[1580648e-11,4.37265307169,309.2783226558],[1123498e-11,2.83726798446,415.5524906121],[1017275e-11,3.71700135395,227.5261894396],[848642e-11,3.1915017083,209.3669421749]],[[213.2990952169,0,0],[.01297370862,1.82834923978,213.299095438],[.00564345393,2.88499717272,7.1135470008],[.00093734369,1.06311793502,426.598190876],[.00107674962,2.27769131009,206.1855484372],[.00040244455,2.04108104671,220.4126424388],[.00019941774,1.2795439047,103.0927742186],[.00010511678,2.7488034213,14.2270940016],[6416106e-11,.38238295041,639.897286314],[4848994e-11,2.43037610229,419.4846438752],[4056892e-11,2.92133209468,110.2063212194],[3768635e-11,3.6496533078,3.9321532631]],[[.0011644133,1.17988132879,7.1135470008],[.00091841837,.0732519584,213.299095438],[.00036661728,0,0],[.00015274496,4.06493179167,206.1855484372]]],[[[.04330678039,3.60284428399,213.299095438],[.00240348302,2.85238489373,426.598190876],[.00084745939,0,0],[.00030863357,3.48441504555,220.4126424388],[.00034116062,.57297307557,206.1855484372],[.0001473407,2.11846596715,639.897286314],[9916667e-11,5.79003188904,419.4846438752],[6993564e-11,4.7360468972,7.1135470008],[4807588e-11,5.43305312061,316.3918696566]],[[.00198927992,4.93901017903,213.299095438],[.00036947916,3.14159265359,0],[.00017966989,.5197943111,426.598190876]]],[[[9.55758135486,0,0],[.52921382865,2.39226219573,213.299095438],[.01873679867,5.2354960466,206.1855484372],[.01464663929,1.64763042902,426.598190876],[.00821891141,5.93520042303,316.3918696566],[.00547506923,5.0153261898,103.0927742186],[.0037168465,2.27114821115,220.4126424388],[.00361778765,3.13904301847,7.1135470008],[.00140617506,5.70406606781,632.7837393132],[.00108974848,3.29313390175,110.2063212194],[.00069006962,5.94099540992,419.4846438752],[.00061053367,.94037691801,639.897286314],[.00048913294,1.55733638681,202.2533951741],[.00034143772,.19519102597,277.0349937414],[.00032401773,5.47084567016,949.1756089698],[.00020936596,.46349251129,735.8765135318],[9796004e-11,5.20477537945,1265.5674786264],[.00011993338,5.98050967385,846.0828347512],[208393e-9,1.52102476129,433.7117378768],[.00015298404,3.0594381494,529.6909650946],[6465823e-11,.17732249942,1052.2683831884],[.00011380257,1.7310542704,522.5774180938],[3419618e-11,4.94550542171,1581.959348283]],[[.0618298134,.2584351148,213.299095438],[.00506577242,.71114625261,206.1855484372],[.00341394029,5.79635741658,426.598190876],[.00188491195,.47215589652,220.4126424388],[.00186261486,3.14159265359,0],[.00143891146,1.40744822888,7.1135470008]],[[.00436902572,4.78671677509,213.299095438]]]],Uranus:[[[[5.48129294297,0,0],[.09260408234,.89106421507,74.7815985673],[.01504247898,3.6271926092,1.4844727083],[.00365981674,1.89962179044,73.297125859],[.00272328168,3.35823706307,149.5631971346],[.00070328461,5.39254450063,63.7358983034],[.00068892678,6.09292483287,76.2660712756],[.00061998615,2.26952066061,2.9689454166],[.00061950719,2.85098872691,11.0457002639],[.0002646877,3.14152083966,71.8126531507],[.00025710476,6.11379840493,454.9093665273],[.0002107885,4.36059339067,148.0787244263],[.00017818647,1.74436930289,36.6485629295],[.00014613507,4.73732166022,3.9321532631],[.00011162509,5.8268179635,224.3447957019],[.0001099791,.48865004018,138.5174968707],[9527478e-11,2.95516862826,35.1640902212],[7545601e-11,5.236265824,109.9456887885],[4220241e-11,3.23328220918,70.8494453042],[40519e-9,2.277550173,151.0476698429],[3354596e-11,1.0654900738,4.4534181249],[2926718e-11,4.62903718891,9.5612275556],[349034e-10,5.48306144511,146.594251718],[3144069e-11,4.75199570434,77.7505439839],[2922333e-11,5.35235361027,85.8272988312],[2272788e-11,4.36600400036,70.3281804424],[2051219e-11,1.51773566586,.1118745846],[2148602e-11,.60745949945,38.1330356378],[1991643e-11,4.92437588682,277.0349937414],[1376226e-11,2.04283539351,65.2203710117],[1666902e-11,3.62744066769,380.12776796],[1284107e-11,3.11347961505,202.2533951741],[1150429e-11,.93343589092,3.1813937377],[1533221e-11,2.58594681212,52.6901980395],[1281604e-11,.54271272721,222.8603229936],[1372139e-11,4.19641530878,111.4301614968],[1221029e-11,.1990065003,108.4612160802],[946181e-11,1.19253165736,127.4717966068],[1150989e-11,4.17898916639,33.6796175129]],[[74.7815986091,0,0],[.00154332863,5.24158770553,74.7815985673],[.00024456474,1.71260334156,1.4844727083],[9258442e-11,.4282973235,11.0457002639],[8265977e-11,1.50218091379,63.7358983034],[915016e-10,1.41213765216,149.5631971346]]],[[[.01346277648,2.61877810547,74.7815985673],[623414e-9,5.08111189648,149.5631971346],[.00061601196,3.14159265359,0],[9963722e-11,1.61603805646,76.2660712756],[992616e-10,.57630380333,73.297125859]],[[.00034101978,.01321929936,74.7815985673]]],[[[19.21264847206,0,0],[.88784984413,5.60377527014,74.7815985673],[.03440836062,.32836099706,73.297125859],[.0205565386,1.7829515933,149.5631971346],[.0064932241,4.52247285911,76.2660712756],[.00602247865,3.86003823674,63.7358983034],[.00496404167,1.40139935333,454.9093665273],[.00338525369,1.58002770318,138.5174968707],[.00243509114,1.57086606044,71.8126531507],[.00190522303,1.99809394714,1.4844727083],[.00161858838,2.79137786799,148.0787244263],[.00143706183,1.38368544947,11.0457002639],[.00093192405,.17437220467,36.6485629295],[.00071424548,4.24509236074,224.3447957019],[.00089806014,3.66105364565,109.9456887885],[.00039009723,1.66971401684,70.8494453042],[.00046677296,1.39976401694,35.1640902212],[.00039025624,3.36234773834,277.0349937414],[.00036755274,3.88649278513,146.594251718],[.00030348723,.70100838798,151.0476698429],[.00029156413,3.180563367,77.7505439839],[.00022637073,.72518687029,529.6909650946],[.00011959076,1.7504339214,984.6003316219],[.00025620756,5.25656086672,380.12776796]],[[.01479896629,3.67205697578,74.7815985673]]]],Neptune:[[[[5.31188633046,0,0],[.0179847553,2.9010127389,38.1330356378],[.01019727652,.48580922867,1.4844727083],[.00124531845,4.83008090676,36.6485629295],[.00042064466,5.41054993053,2.9689454166],[.00037714584,6.09221808686,35.1640902212],[.00033784738,1.24488874087,76.2660712756],[.00016482741,7727998e-11,491.5579294568],[9198584e-11,4.93747051954,39.6175083461],[899425e-10,.27462171806,175.1660598002]],[[38.13303563957,0,0],[.00016604172,4.86323329249,1.4844727083],[.00015744045,2.27887427527,38.1330356378]]],[[[.03088622933,1.44104372644,38.1330356378],[.00027780087,5.91271884599,76.2660712756],[.00027623609,0,0],[.00015355489,2.52123799551,36.6485629295],[.00015448133,3.50877079215,39.6175083461]]],[[[30.07013205828,0,0],[.27062259632,1.32999459377,38.1330356378],[.01691764014,3.25186135653,36.6485629295],[.00807830553,5.18592878704,1.4844727083],[.0053776051,4.52113935896,35.1640902212],[.00495725141,1.5710564165,491.5579294568],[.00274571975,1.84552258866,175.1660598002],[.0001201232,1.92059384991,1021.2488945514],[.00121801746,5.79754470298,76.2660712756],[.00100896068,.3770272493,73.297125859],[.00135134092,3.37220609835,39.6175083461],[7571796e-11,1.07149207335,388.4651552382]]]]};function dr(n){var e,t,a,i,o,r,s;const l=2e3+(n-14)/er;return l<-500?(e=(l-1820)/100,-20+32*e*e):l<500?(e=l/100,t=e*e,a=e*t,i=t*t,o=t*a,r=a*a,10583.6-1014.41*e+33.78311*t-5.952053*a-.1798452*i+.022174192*o+.0090316521*r):l<1600?(e=(l-1e3)/100,t=e*e,a=e*t,i=t*t,o=t*a,r=a*a,1574.2-556.01*e+71.23472*t+.319781*a-.8503463*i-.005050998*o+.0083572073*r):l<1700?(e=l-1600,t=e*e,a=e*t,120-.9808*e-.01532*t+a/7129):l<1800?(e=l-1700,t=e*e,a=e*t,i=t*t,8.83+.1603*e-.0059285*t+13336e-8*a-i/1174e3):l<1860?(e=l-1800,t=e*e,a=e*t,i=t*t,o=t*a,r=a*a,s=a*i,13.72-.332447*e+.0068612*t+.0041116*a-37436e-8*i+121272e-10*o-1699e-10*r+875e-12*s):l<1900?(e=l-1860,t=e*e,a=e*t,i=t*t,o=t*a,7.62+.5737*e-.251754*t+.01680668*a-.0004473624*i+o/233174):l<1920?(e=l-1900,t=e*e,a=e*t,i=t*t,-2.79+1.494119*e-.0598939*t+.0061966*a-197e-6*i):l<1941?(e=l-1920,t=e*e,a=e*t,21.2+.84493*e-.0761*t+.0020936*a):l<1961?(e=l-1950,t=e*e,a=e*t,29.07+.407*e-t/233+a/2547):l<1986?(e=l-1975,t=e*e,a=e*t,45.45+1.067*e-t/260-a/718):l<2005?(e=l-2e3,t=e*e,a=e*t,i=t*t,o=t*a,63.86+.3345*e-.060374*t+.0017275*a+651814e-9*i+2373599e-11*o):l<2050?(e=l-2e3,62.92+.32217*e+.005589*e*e):l<2150?(e=(l-1820)/100,-20+32*e*e-.5628*(2150-l)):(e=(l-1820)/100,-20+32*e*e)}let ur=dr;function oa(n){return n+ur(n)/86400}class re{constructor(e){if(e instanceof re){this.date=e.date,this.ut=e.ut,this.tt=e.tt;return}const t=1e3*3600*24;if(e instanceof Date&&Number.isFinite(e.getTime())){this.date=e,this.ut=(e.getTime()-aa.getTime())/t,this.tt=oa(this.ut);return}if(Number.isFinite(e)){this.date=new Date(aa.getTime()+e*t),this.ut=e,this.tt=oa(this.ut);return}throw"Argument must be a Date object, an AstroTime object, or a numeric UTC Julian date."}static FromTerrestrialTime(e){let t=new re(e);for(;;){const a=e-t.tt;if(Math.abs(a)<1e-12)return t;t=t.AddDays(a)}}toString(){return this.date.toISOString()}AddDays(e){return new re(this.ut+e)}}function mr(n,e,t){return new re(n.ut+t*(e.ut-n.ut))}function B(n){return n instanceof re?n:new re(n)}function pr(n){function e(p){return p%nr*ue}const t=n.tt/36525,a=e(128710479305e-5+t*1295965810481e-4),i=e(335779.526232+t*17395272628478e-4),o=e(107226070369e-5+t*1602961601209e-3),r=e(450160.398036-t*69628905431e-4);let s=Math.sin(r),l=Math.cos(r),h=(-172064161-174666*t)*s+33386*l,d=(92052331+9086*t)*l+15377*s,c=2*(i-o+r);return s=Math.sin(c),l=Math.cos(c),h+=(-13170906-1675*t)*s-13696*l,d+=(5730336-3015*t)*l-4587*s,c=2*(i+r),s=Math.sin(c),l=Math.cos(c),h+=(-2276413-234*t)*s+2796*l,d+=(978459-485*t)*l+1374*s,c=2*r,s=Math.sin(c),l=Math.cos(c),h+=(2074554+207*t)*s-698*l,d+=(-897492+470*t)*l-291*s,s=Math.sin(a),l=Math.cos(a),h+=(1475877-3633*t)*s+11817*l,d+=(73871-184*t)*l-1924*s,{dpsi:-135e-6+h*1e-7,deps:388e-6+d*1e-7}}function Ba(n){var e=n.tt/36525,t=((((-434e-10*e-576e-9)*e+.0020034)*e-1831e-7)*e-46.836769)*e+84381.406;return t/3600}var De;function Fa(n){if(!De||Math.abs(De.tt-n.tt)>1e-6){const e=pr(n),t=Ba(n),a=t+e.deps/3600;De={tt:n.tt,dpsi:e.dpsi,deps:e.deps,ee:e.dpsi*Math.cos(t*H)/15,mobl:t,tobl:a}}return De}function gr(n,e){const t=n*H,a=Math.cos(t),i=Math.sin(t);return[e[0],e[1]*a-e[2]*i,e[1]*i+e[2]*a]}function yr(n,e){return gr(Ba(n),e)}function fr(n){const e=n.tt/36525;function t(w,k){const R=[];let C;for(C=0;C<=k-w;++C)R.push(0);return{min:w,array:R}}function a(w,k,R,C){const P=[];for(let Z=0;Z<=k-w;++Z)P.push(t(R,C));return{min:w,array:P}}function i(w,k,R){const C=w.array[k-w.min];return C.array[R-C.min]}function o(w,k,R,C){const P=w.array[k-w.min];P.array[R-P.min]=C}let r,s,l,h,d,c,p,b,f,T,D,N,F,z,Y,V,fe,le,lt,Ke,ht,ct,$e,dt=a(-6,6,1,4),ut=a(-6,6,1,4);function Ie(w,k){return i(dt,w,k)}function xe(w,k){return i(ut,w,k)}function Ae(w,k,R){return o(dt,w,k,R)}function Se(w,k,R){return o(ut,w,k,R)}function mt(w,k,R,C,P){P(w*R-k*C,k*R+w*C)}function E(w){return Math.sin(K*w)}p=e*e,f=0,$e=0,D=0,N=3422.7;var Ee=E(.19833+.05611*e),Qe=E(.27869+.04508*e),Xe=E(.16827-.36903*e),Ze=E(.34734-5.37261*e),en=E(.10498-5.37899*e),Re=E(.42681-.41855*e),ii=E(.14943-5.37511*e);for(le=.84*Ee+.31*Qe+14.27*Xe+7.26*Ze+.28*en+.24*Re,lt=2.94*Ee+.31*Qe+14.27*Xe+9.34*Ze+1.12*en+.83*Re,Ke=-6.4*Ee-1.89*Re,ht=.21*Ee+.31*Qe+14.27*Xe-88.7*Ze-15.3*en+.24*Re-1.86*ii,ct=le-Ke,b=-3332e-9*E(.59734-5.37261*e)-539e-9*E(.35498-5.37899*e)-64e-9*E(.39943-5.37511*e),F=K*ce(.60643382+1336.85522467*e-313e-8*p)+le/ee,z=K*ce(.37489701+1325.55240982*e+2565e-8*p)+lt/ee,Y=K*ce(.99312619+99.99735956*e-44e-8*p)+Ke/ee,V=K*ce(.25909118+1342.2278298*e-892e-8*p)+ht/ee,fe=K*ce(.82736186+1236.85308708*e-397e-8*p)+ct/ee,d=1;d<=4;++d){switch(d){case 1:l=z,s=4,h=1.000002208;break;case 2:l=Y,s=3,h=.997504612-.002495388*e;break;case 3:l=V,s=4,h=1.000002708+139.978*b;break;case 4:l=fe,s=6,h=1;break;default:throw`Internal error: I = ${d}`}for(Ae(0,d,1),Ae(1,d,Math.cos(l)*h),Se(0,d,0),Se(1,d,Math.sin(l)*h),c=2;c<=s;++c)mt(Ie(c-1,d),xe(c-1,d),Ie(1,d),xe(1,d),(w,k)=>(Ae(c,d,w),Se(c,d,k)));for(c=1;c<=s;++c)Ae(-c,d,Ie(c,d)),Se(-c,d,-xe(c,d))}function pt(w,k,R,C){for(var P={x:1,y:0},Z=[0,w,k,R,C],J=1;J<=4;++J)Z[J]!==0&&mt(P.x,P.y,Ie(Z[J],J),xe(Z[J],J),(nn,he)=>(P.x=nn,P.y=he));return P}function u(w,k,R,C,P,Z,J,nn){var he=pt(P,Z,J,nn);f+=w*he.y,$e+=k*he.y,D+=R*he.x,N+=C*he.x}u(13.902,14.06,-.001,.2607,0,0,0,4),u(.403,-4.01,.394,.0023,0,0,0,3),u(2369.912,2373.36,.601,28.2333,0,0,0,2),u(-125.154,-112.79,-.725,-.9781,0,0,0,1),u(1.979,6.98,-.445,.0433,1,0,0,4),u(191.953,192.72,.029,3.0861,1,0,0,2),u(-8.466,-13.51,.455,-.1093,1,0,0,1),u(22639.5,22609.07,.079,186.5398,1,0,0,0),u(18.609,3.59,-.094,.0118,1,0,0,-1),u(-4586.465,-4578.13,-.077,34.3117,1,0,0,-2),u(3.215,5.44,.192,-.0386,1,0,0,-3),u(-38.428,-38.64,.001,.6008,1,0,0,-4),u(-.393,-1.43,-.092,.0086,1,0,0,-6),u(-.289,-1.59,.123,-.0053,0,1,0,4),u(-24.42,-25.1,.04,-.3,0,1,0,2),u(18.023,17.93,.007,.1494,0,1,0,1),u(-668.146,-126.98,-1.302,-.3997,0,1,0,0),u(.56,.32,-.001,-.0037,0,1,0,-1),u(-165.145,-165.06,.054,1.9178,0,1,0,-2),u(-1.877,-6.46,-.416,.0339,0,1,0,-4),u(.213,1.02,-.074,.0054,2,0,0,4),u(14.387,14.78,-.017,.2833,2,0,0,2),u(-.586,-1.2,.054,-.01,2,0,0,1),u(769.016,767.96,.107,10.1657,2,0,0,0),u(1.75,2.01,-.018,.0155,2,0,0,-1),u(-211.656,-152.53,5.679,-.3039,2,0,0,-2),u(1.225,.91,-.03,-.0088,2,0,0,-3),u(-30.773,-34.07,-.308,.3722,2,0,0,-4),u(-.57,-1.4,-.074,.0109,2,0,0,-6),u(-2.921,-11.75,.787,-.0484,1,1,0,2),u(1.267,1.52,-.022,.0164,1,1,0,1),u(-109.673,-115.18,.461,-.949,1,1,0,0),u(-205.962,-182.36,2.056,1.4437,1,1,0,-2),u(.233,.36,.012,-.0025,1,1,0,-3),u(-4.391,-9.66,-.471,.0673,1,1,0,-4),u(.283,1.53,-.111,.006,1,-1,0,4),u(14.577,31.7,-1.54,.2302,1,-1,0,2),u(147.687,138.76,.679,1.1528,1,-1,0,0),u(-1.089,.55,.021,0,1,-1,0,-1),u(28.475,23.59,-.443,-.2257,1,-1,0,-2),u(-.276,-.38,-.006,-.0036,1,-1,0,-3),u(.636,2.27,.146,-.0102,1,-1,0,-4),u(-.189,-1.68,.131,-.0028,0,2,0,2),u(-7.486,-.66,-.037,-.0086,0,2,0,0),u(-8.096,-16.35,-.74,.0918,0,2,0,-2),u(-5.741,-.04,0,-9e-4,0,0,2,2),u(.255,0,0,0,0,0,2,1),u(-411.608,-.2,0,-.0124,0,0,2,0),u(.584,.84,0,.0071,0,0,2,-1),u(-55.173,-52.14,0,-.1052,0,0,2,-2),u(.254,.25,0,-.0017,0,0,2,-3),u(.025,-1.67,0,.0031,0,0,2,-4),u(1.06,2.96,-.166,.0243,3,0,0,2),u(36.124,50.64,-1.3,.6215,3,0,0,0),u(-13.193,-16.4,.258,-.1187,3,0,0,-2),u(-1.187,-.74,.042,.0074,3,0,0,-4),u(-.293,-.31,-.002,.0046,3,0,0,-6),u(-.29,-1.45,.116,-.0051,2,1,0,2),u(-7.649,-10.56,.259,-.1038,2,1,0,0),u(-8.627,-7.59,.078,-.0192,2,1,0,-2),u(-2.74,-2.54,.022,.0324,2,1,0,-4),u(1.181,3.32,-.212,.0213,2,-1,0,2),u(9.703,11.67,-.151,.1268,2,-1,0,0),u(-.352,-.37,.001,-.0028,2,-1,0,-1),u(-2.494,-1.17,-.003,-.0017,2,-1,0,-2),u(.36,.2,-.012,-.0043,2,-1,0,-4),u(-1.167,-1.25,.008,-.0106,1,2,0,0),u(-7.412,-6.12,.117,.0484,1,2,0,-2),u(-.311,-.65,-.032,.0044,1,2,0,-4),u(.757,1.82,-.105,.0112,1,-2,0,2),u(2.58,2.32,.027,.0196,1,-2,0,0),u(2.533,2.4,-.014,-.0212,1,-2,0,-2),u(-.344,-.57,-.025,.0036,0,3,0,-2),u(-.992,-.02,0,0,1,0,2,2),u(-45.099,-.02,0,-.001,1,0,2,0),u(-.179,-9.52,0,-.0833,1,0,2,-2),u(-.301,-.33,0,.0014,1,0,2,-4),u(-6.382,-3.37,0,-.0481,1,0,-2,2),u(39.528,85.13,0,-.7136,1,0,-2,0),u(9.366,.71,0,-.0112,1,0,-2,-2),u(.202,.02,0,0,1,0,-2,-4),u(.415,.1,0,.0013,0,1,2,0),u(-2.152,-2.26,0,-.0066,0,1,2,-2),u(-1.44,-1.3,0,.0014,0,1,-2,2),u(.384,-.04,0,0,0,1,-2,-2),u(1.938,3.6,-.145,.0401,4,0,0,0),u(-.952,-1.58,.052,-.013,4,0,0,-2),u(-.551,-.94,.032,-.0097,3,1,0,0),u(-.482,-.57,.005,-.0045,3,1,0,-2),u(.681,.96,-.026,.0115,3,-1,0,0),u(-.297,-.27,.002,-9e-4,2,2,0,-2),u(.254,.21,-.003,0,2,-2,0,-2),u(-.25,-.22,.004,.0014,1,3,0,-2),u(-3.996,0,0,4e-4,2,0,2,0),u(.557,-.75,0,-.009,2,0,2,-2),u(-.459,-.38,0,-.0053,2,0,-2,2),u(-1.298,.74,0,4e-4,2,0,-2,0),u(.538,1.14,0,-.0141,2,0,-2,-2),u(.263,.02,0,0,1,1,2,0),u(.426,.07,0,-6e-4,1,1,-2,-2),u(-.304,.03,0,3e-4,1,-1,2,0),u(-.372,-.19,0,-.0027,1,-1,-2,2),u(.418,0,0,0,0,0,4,0),u(-.33,-.04,0,0,3,0,2,0);function q(w,k,R,C,P){return w*pt(k,R,C,P).y}T=0,T+=q(-526.069,0,0,1,-2),T+=q(-3.352,0,0,1,-4),T+=q(44.297,1,0,1,-2),T+=q(-6,1,0,1,-4),T+=q(20.599,-1,0,1,0),T+=q(-30.598,-1,0,1,-2),T+=q(-24.649,-2,0,1,0),T+=q(-2,-2,0,1,-2),T+=q(-22.571,0,1,1,-2),T+=q(10.985,0,-1,1,-2),f+=.82*E(.7736-62.5512*e)+.31*E(.0466-125.1025*e)+.35*E(.5785-25.1042*e)+.66*E(.4591+1335.8075*e)+.64*E(.313-91.568*e)+1.14*E(.148+1331.2898*e)+.21*E(.5918+1056.5859*e)+.44*E(.5784+1322.8595*e)+.24*E(.2275-5.7374*e)+.28*E(.2965+2.6929*e)+.33*E(.3132+6.3368*e),r=V+$e/ee;let oi=(1.000002708+139.978*b)*(18518.511+1.189+D)*Math.sin(r)-6.24*Math.sin(3*r)+T;return{geo_eclip_lon:K*ce((F+f/ee)/K),geo_eclip_lat:Math.PI/(180*3600)*oi,distance_au:ee*rr/(.999953253*N)}}function za(n,e){return[n.rot[0][0]*e[0]+n.rot[1][0]*e[1]+n.rot[2][0]*e[2],n.rot[0][1]*e[0]+n.rot[1][1]*e[1]+n.rot[2][1]*e[2],n.rot[0][2]*e[0]+n.rot[1][2]*e[1]+n.rot[2][2]*e[2]]}function Ha(n,e,t){const a=br(e,t);return za(a,n)}function br(n,e){const t=n.tt/36525;let a=84381.406,i=((((-951e-10*t+132851e-9)*t-.00114045)*t-1.0790069)*t+5038.481507)*t,o=((((3337e-10*t-467e-9)*t-.00772503)*t+.0512623)*t-.025754)*t+a,r=((((-56e-9*t+170663e-9)*t-.00121197)*t-2.3814292)*t+10.556403)*t;a*=ue,i*=ue,o*=ue,r*=ue;const s=Math.sin(a),l=Math.cos(a),h=Math.sin(-i),d=Math.cos(-i),c=Math.sin(-o),p=Math.cos(-o),b=Math.sin(r),f=Math.cos(r),T=f*d-h*b*p,D=f*h*l+b*p*d*l-s*b*c,N=f*h*s+b*p*d*s+l*b*c,F=-b*d-h*f*p,z=-b*h*l+f*p*d*l-s*f*c,Y=-b*h*s+f*p*d*s+l*f*c,V=h*c,fe=-c*d*l-s*p,le=-c*d*s+p*l;if(e===X.Into2000)return new He([[T,D,N],[F,z,Y],[V,fe,le]]);if(e===X.From2000)return new He([[T,F,V],[D,z,fe],[N,Y,le]]);throw"Invalid precess direction"}function wr(n,e,t){const a=vr(e,t);return za(a,n)}function vr(n,e){const t=Fa(n),a=t.mobl*H,i=t.tobl*H,o=t.dpsi*ue,r=Math.cos(a),s=Math.sin(a),l=Math.cos(i),h=Math.sin(i),d=Math.cos(o),c=Math.sin(o),p=d,b=-c*r,f=-c*s,T=c*l,D=d*r*l+s*h,N=d*s*l-r*h,F=c*h,z=d*r*h-s*l,Y=d*s*h+r*l;if(e===X.From2000)return new He([[p,T,F],[b,D,z],[f,N,Y]]);if(e===X.Into2000)return new He([[p,b,f],[T,D,N],[F,z,Y]]);throw"Invalid precess direction"}class M{constructor(e,t,a,i){this.x=e,this.y=t,this.z=a,this.t=i}Length(){return Math.hypot(this.x,this.y,this.z)}}class ne{constructor(e,t,a,i,o,r,s){this.x=e,this.y=t,this.z=a,this.vx=i,this.vy=o,this.vz=r,this.t=s}}class Tr{constructor(e,t,a){this.lat=te(e),this.lon=te(t),this.dist=te(a)}}class He{constructor(e){this.rot=e}}class kr{constructor(e,t,a){this.vec=e,this.elat=te(t),this.elon=te(a)}}function Ir(n,e,t){const a=n.x,i=n.y*e+n.z*t,o=-n.y*t+n.z*e,r=Math.hypot(a,i);let s=0;r>0&&(s=ze*Math.atan2(i,a),s<0&&(s+=360));let l=ze*Math.atan2(o,r),h=new M(a,i,o,n.t);return new kr(h,l,s)}function ge(n){const e=Fa(n.t),t=[n.x,n.y,n.z],a=Ha(t,n.t,X.From2000),[i,o,r]=wr(a,n.t,X.From2000),s=new M(i,o,r,n.t),l=e.tobl*H;return Ir(s,Math.cos(l),Math.sin(l))}function ye(n){const e=B(n),t=fr(e),a=t.distance_au*Math.cos(t.geo_eclip_lat),i=[a*Math.cos(t.geo_eclip_lon),a*Math.sin(t.geo_eclip_lon),t.distance_au*Math.sin(t.geo_eclip_lat)],o=yr(e,i),r=Ha(o,e,X.Into2000);return new M(r[0],r[1],r[2],e)}function Ya(n){const e=B(n),t=1e-5,a=e.AddDays(-t),i=e.AddDays(+t),o=ye(a),r=ye(i);return new ne((o.x+r.x)/2,(o.y+r.y)/2,(o.z+r.z)/2,(r.x-o.x)/(2*t),(r.y-o.y)/(2*t),(r.z-o.z)/(2*t),e)}function xr(n){const e=B(n),t=Ya(e),a=1+La;return new ne(t.x/a,t.y/a,t.z/a,t.vx/a,t.vy/a,t.vz/a,e)}function pe(n,e,t){let a=1,i=0;for(let o of n){let r=0;for(let[l,h,d]of o)r+=l*Math.cos(h+e*d);let s=a*r;t&&(s%=K),i+=s,a*=e}return i}function En(n,e){let t=1,a=0,i=0,o=0;for(let r of n){let s=0,l=0;for(let[h,d,c]of r){let p=d+e*c;s+=h*c*Math.sin(p),o>0&&(l+=h*Math.cos(p))}i+=o*a*l-t*s,a=t,t*=e,++o}return i}const Te=365250,Hn=0,Yn=1,qn=2;function jn(n){return new W(n[0]+44036e-11*n[1]-190919e-12*n[2],-479966e-12*n[0]+.917482137087*n[1]-.397776982902*n[2],.397776982902*n[1]+.917482137087*n[2])}function qa(n,e,t){const a=t*Math.cos(e),i=Math.cos(n),o=Math.sin(n);return[a*i,a*o,t*Math.sin(e)]}function ke(n,e){const t=e.tt/Te,a=pe(n[Hn],t,!0),i=pe(n[Yn],t,!1),o=pe(n[qn],t,!1),r=qa(a,i,o);return jn(r).ToAstroVector(e)}function _n(n,e){const t=e/Te,a=pe(n[Hn],t,!0),i=pe(n[Yn],t,!1),o=pe(n[qn],t,!1),r=En(n[Hn],t),s=En(n[Yn],t),l=En(n[qn],t),h=Math.cos(a),d=Math.sin(a),c=Math.cos(i),p=Math.sin(i),b=+(l*c*h)-o*p*h*s-o*c*d*r,f=+(l*c*d)-o*p*d*s+o*c*h*r,T=+(l*p)+o*c*s,D=qa(a,i,o),N=[b/Te,f/Te,T/Te],F=jn(D),z=jn(N);return new se(e,F,z)}function Ce(n,e,t,a){const i=a/(a+rt),o=ke(Q[t],e);n.x+=i*o.x,n.y+=i*o.y,n.z+=i*o.z}function Ar(n){const e=new M(0,0,0,n);return Ce(e,n,g.Jupiter,Wn),Ce(e,n,g.Saturn,Bn),Ce(e,n,g.Uranus,Fn),Ce(e,n,g.Neptune,zn),e}const Gn=51,Sr=29200,me=146,$=201,oe=[[-73e4,[-26.118207232108,-14.376168177825,3.384402515299],[.0016339372163656,-.0027861699588508,-.0013585880229445]],[-700800,[41.974905202127,-.448502952929,-12.770351505989],[.00073458569351457,.0022785014891658,.00048619778602049]],[-671600,[14.706930780744,44.269110540027,9.353698474772],[-.00210001479998,.00022295915939915,.00070143443551414]],[-642400,[-29.441003929957,-6.43016153057,6.858481011305],[.00084495803960544,-.0030783914758711,-.0012106305981192]],[-613200,[39.444396946234,-6.557989760571,-13.913760296463],[.0011480029005873,.0022400006880665,.00035168075922288]],[-584e3,[20.2303809507,43.266966657189,7.382966091923],[-.0019754081700585,.00053457141292226,.00075929169129793]],[-554800,[-30.65832536462,2.093818874552,9.880531138071],[61010603013347e-18,-.0031326500935382,-.00099346125151067]],[-525600,[35.737703251673,-12.587706024764,-14.677847247563],[.0015802939375649,.0021347678412429,.00019074436384343]],[-496400,[25.466295188546,41.367478338417,5.216476873382],[-.0018054401046468,.0008328308359951,.00080260156912107]],[-467200,[-29.847174904071,10.636426313081,12.297904180106],[-.00063257063052907,-.0029969577578221,-.00074476074151596]],[-438e3,[30.774692107687,-18.236637015304,-14.945535879896],[.0020113162005465,.0019353827024189,-20937793168297e-19]],[-408800,[30.243153324028,38.656267888503,2.938501750218],[-.0016052508674468,.0011183495337525,.00083333973416824]],[-379600,[-27.288984772533,18.643162147874,14.023633623329],[-.0011856388898191,-.0027170609282181,-.00049015526126399]],[-350400,[24.519605196774,-23.245756064727,-14.626862367368],[.0024322321483154,.0016062008146048,-.00023369181613312]],[-321200,[34.505274805875,35.125338586954,.557361475637],[-.0013824391637782,.0013833397561817,.00084823598806262]],[-292e3,[-23.275363915119,25.818514298769,15.055381588598],[-.0016062295460975,-.0023395961498533,-.00024377362639479]],[-262800,[17.050384798092,-27.180376290126,-13.608963321694],[.0028175521080578,.0011358749093955,-.00049548725258825]],[-233600,[38.093671910285,30.880588383337,-1.843688067413],[-.0011317697153459,.0016128814698472,.00084177586176055]],[-204400,[-18.197852930878,31.932869934309,15.438294826279],[-.0019117272501813,-.0019146495909842,-19657304369835e-18]],[-175200,[8.528924039997,-29.618422200048,-11.805400994258],[.0031034370787005,.0005139363329243,-.00077293066202546]],[-146e3,[40.94685725864,25.904973592021,-4.256336240499],[-.00083652705194051,.0018129497136404,.0008156422827306]],[-116800,[-12.326958895325,36.881883446292,15.217158258711],[-.0021166103705038,-.001481442003599,.00017401209844705]],[-87600,[-.633258375909,-30.018759794709,-9.17193287495],[.0032016994581737,-.00025279858672148,-.0010411088271861]],[-58400,[42.936048423883,20.344685584452,-6.588027007912],[-.00050525450073192,.0019910074335507,.00077440196540269]],[-29200,[-5.975910552974,40.61180995846,14.470131723673],[-.0022184202156107,-.0010562361130164,.00033652250216211]],[0,[-9.875369580774,-27.978926224737,-5.753711824704],[.0030287533248818,-.0011276087003636,-.0012651326732361]],[29200,[43.958831986165,14.214147973292,-8.808306227163],[-.00014717608981871,.0021404187242141,.00071486567806614]],[58400,[.67813676352,43.094461639362,13.243238780721],[-.0022358226110718,-.00063233636090933,.00047664798895648]],[87600,[-18.282602096834,-23.30503958666,-1.766620508028],[.0025567245263557,-.0019902940754171,-.0013943491701082]],[116800,[43.873338744526,7.700705617215,-10.814273666425],[.00023174803055677,.0022402163127924,.00062988756452032]],[146e3,[7.392949027906,44.382678951534,11.629500214854],[-.002193281545383,-.00021751799585364,.00059556516201114]],[175200,[-24.981690229261,-16.204012851426,2.466457544298],[.001819398914958,-.0026765419531201,-.0013848283502247]],[204400,[42.530187039511,.845935508021,-12.554907527683],[.00065059779150669,.0022725657282262,.00051133743202822]],[233600,[13.999526486822,44.462363044894,9.669418486465],[-.0021079296569252,.00017533423831993,.00069128485798076]],[262800,[-29.184024803031,-7.371243995762,6.493275957928],[.00093581363109681,-.0030610357109184,-.0012364201089345]],[292e3,[39.831980671753,-6.078405766765,-13.909815358656],[.0011117769689167,.0022362097830152,.00036230548231153]],[321200,[20.294955108476,43.417190420251,7.450091985932],[-.0019742157451535,.00053102050468554,.00075938408813008]],[350400,[-30.66999230216,2.318743558955,9.973480913858],[45605107450676e-18,-.0031308219926928,-.00099066533301924]],[379600,[35.626122155983,-12.897647509224,-14.777586508444],[.0016015684949743,.0021171931182284,.00018002516202204]],[408800,[26.133186148561,41.232139187599,5.00640132622],[-.0017857704419579,.00086046232702817,.00080614690298954]],[438e3,[-29.57674022923,11.863535943587,12.631323039872],[-.00072292830060955,-.0029587820140709,-.000708242964503]],[467200,[29.910805787391,-19.159019294,-15.013363865194],[.0020871080437997,.0018848372554514,-38528655083926e-18]],[496400,[31.375957451819,38.050372720763,2.433138343754],[-.0015546055556611,.0011699815465629,.00083565439266001]],[525600,[-26.360071336928,20.662505904952,14.414696258958],[-.0013142373118349,-.0026236647854842,-.00042542017598193]],[554800,[22.599441488648,-24.508879898306,-14.484045731468],[.0025454108304806,.0014917058755191,-.00030243665086079]],[584e3,[35.877864013014,33.894226366071,-.224524636277],[-.0012941245730845,.0014560427668319,.00084762160640137]],[613200,[-21.538149762417,28.204068269761,15.321973799534],[-.001731211740901,-.0021939631314577,-.0001631691327518]],[642400,[13.971521374415,-28.339941764789,-13.083792871886],[.0029334630526035,.00091860931752944,-.00059939422488627]],[671600,[39.526942044143,28.93989736011,-2.872799527539],[-.0010068481658095,.001702113288809,.00083578230511981]],[700800,[-15.576200701394,34.399412961275,15.466033737854],[-.0020098814612884,-.0017191109825989,70414782780416e-18]],[73e4,[4.24325283709,-30.118201690825,-10.707441231349],[.0031725847067411,.0001609846120227,-.00090672150593868]]];class W{constructor(e,t,a){this.x=e,this.y=t,this.z=a}clone(){return new W(this.x,this.y,this.z)}ToAstroVector(e){return new M(this.x,this.y,this.z,e)}static zero(){return new W(0,0,0)}quadrature(){return this.x*this.x+this.y*this.y+this.z*this.z}add(e){return new W(this.x+e.x,this.y+e.y,this.z+e.z)}sub(e){return new W(this.x-e.x,this.y-e.y,this.z-e.z)}incr(e){this.x+=e.x,this.y+=e.y,this.z+=e.z}decr(e){this.x-=e.x,this.y-=e.y,this.z-=e.z}mul(e){return new W(e*this.x,e*this.y,e*this.z)}div(e){return new W(this.x/e,this.y/e,this.z/e)}mean(e){return new W((this.x+e.x)/2,(this.y+e.y)/2,(this.z+e.z)/2)}neg(){return new W(-this.x,-this.y,-this.z)}}class se{constructor(e,t,a){this.tt=e,this.r=t,this.v=a}clone(){return new se(this.tt,this.r,this.v)}sub(e){return new se(this.tt,this.r.sub(e.r),this.v.sub(e.v))}}function Er(n){let[e,[t,a,i],[o,r,s]]=n;return new se(e,new W(t,a,i),new W(o,r,s))}function Ne(n,e,t,a){const i=a/(a+rt),o=_n(Q[t],e);return n.r.incr(o.r.mul(i)),n.v.incr(o.v.mul(i)),o}function ve(n,e,t){const a=t.sub(n),i=a.quadrature();return a.mul(e/(i*Math.sqrt(i)))}class Ve{constructor(e){let t=new se(e,new W(0,0,0),new W(0,0,0));this.Jupiter=Ne(t,e,g.Jupiter,Wn),this.Saturn=Ne(t,e,g.Saturn,Bn),this.Uranus=Ne(t,e,g.Uranus,Fn),this.Neptune=Ne(t,e,g.Neptune,zn),this.Jupiter.r.decr(t.r),this.Jupiter.v.decr(t.v),this.Saturn.r.decr(t.r),this.Saturn.v.decr(t.v),this.Uranus.r.decr(t.r),this.Uranus.v.decr(t.v),this.Neptune.r.decr(t.r),this.Neptune.v.decr(t.v),this.Sun=new se(e,t.r.mul(-1),t.v.mul(-1))}Acceleration(e){let t=ve(e,rt,this.Sun.r);return t.incr(ve(e,Wn,this.Jupiter.r)),t.incr(ve(e,Bn,this.Saturn.r)),t.incr(ve(e,Fn,this.Uranus.r)),t.incr(ve(e,zn,this.Neptune.r)),t}}class Je{constructor(e,t,a,i){this.tt=e,this.r=t,this.v=a,this.a=i}clone(){return new Je(this.tt,this.r.clone(),this.v.clone(),this.a.clone())}}class ja{constructor(e,t){this.bary=e,this.grav=t}}function Ye(n,e,t,a){return new W(e.x+n*(t.x+n*a.x/2),e.y+n*(t.y+n*a.y/2),e.z+n*(t.z+n*a.z/2))}function ra(n,e,t){return new W(e.x+n*t.x,e.y+n*t.y,e.z+n*t.z)}function Un(n,e){const t=n-e.tt,a=new Ve(n),i=Ye(t,e.r,e.v,e.a),o=a.Acceleration(i).mean(e.a),r=Ye(t,e.r,e.v,o),s=e.v.add(o.mul(t)),l=a.Acceleration(r),h=new Je(n,r,s,l);return new ja(a,h)}const Rr=[];function _a(n,e){const t=Math.floor(n);return t<0?0:t>=e?e-1:t}function Vn(n){const e=Er(n),t=new Ve(e.tt),a=e.r.add(t.Sun.r),i=e.v.add(t.Sun.v),o=t.Acceleration(a),r=new Je(e.tt,a,i,o);return new ja(t,r)}function Mr(n,e){const t=oe[0][0];if(e<t||e>oe[Gn-1][0])return null;const a=_a((e-t)/Sr,Gn-1);if(!n[a]){const o=n[a]=[];o[0]=Vn(oe[a]).grav,o[$-1]=Vn(oe[a+1]).grav;let r,s=o[0].tt;for(r=1;r<$-1;++r)o[r]=Un(s+=me,o[r-1]).grav;s=o[$-1].tt;var i=[];for(i[$-1]=o[$-1],r=$-2;r>0;--r)i[r]=Un(s-=me,i[r+1]).grav;for(r=$-2;r>0;--r){const l=r/($-1);o[r].r=o[r].r.mul(1-l).add(i[r].r.mul(l)),o[r].v=o[r].v.mul(1-l).add(i[r].v.mul(l)),o[r].a=o[r].a.mul(1-l).add(i[r].a.mul(l))}}return n[a]}function sa(n,e,t){let a=Vn(n);const i=Math.ceil((e-a.grav.tt)/t);for(let o=0;o<i;++o)a=Un(o+1===i?e:a.grav.tt+t,a.grav);return a}function Ga(n,e){let t,a,i;const o=Mr(Rr,n.tt);if(o){const r=_a((n.tt-o[0].tt)/me,$-1),s=o[r],l=o[r+1],h=s.a.mean(l.a),d=Ye(n.tt-s.tt,s.r,s.v,h),c=ra(n.tt-s.tt,s.v,h),p=Ye(n.tt-l.tt,l.r,l.v,h),b=ra(n.tt-l.tt,l.v,h),f=(n.tt-s.tt)/me;t=d.mul(1-f).add(p.mul(f)),a=c.mul(1-f).add(b.mul(f))}else{let r;n.tt<oe[0][0]?r=sa(oe[0],n.tt,-me):r=sa(oe[Gn-1],n.tt,+me),t=r.grav.r,a=r.grav.v,i=r.bary}return i||(i=new Ve(n.tt)),t=t.sub(i.Sun.r),a=a.sub(i.Sun.v),new ne(t.x,t.y,t.z,a.x,a.y,a.z,n)}function ae(n,e){var t=B(e);if(n in Q)return ke(Q[n],t);if(n===g.Pluto){const r=Ga(t);return new M(r.x,r.y,r.z,t)}if(n===g.Sun)return new M(0,0,0,t);if(n===g.Moon){var a=ke(Q.Earth,t),i=ye(t);return new M(a.x+i.x,a.y+i.y,a.z+i.z,t)}if(n===g.EMB){const r=ke(Q.Earth,t),s=ye(t),l=1+La;return new M(r.x+s.x/l,r.y+s.y/l,r.z+s.z/l,t)}if(n===g.SSB)return Ar(t);const o=st(n);if(o){const r=new Tr(o.dec,15*o.ra,o.dist);return Gr(r,t)}throw`HelioVector: Unknown body "${n}"`}function Dr(n,e){let t=e,a=0;for(let i=0;i<10;++i){const o=n(t),r=o.Length()/Na;if(r>1)throw"Object is too distant for light-travel solver.";const s=e.AddDays(-r);if(a=Math.abs(s.tt-t.tt),a<1e-9)return o;t=s}throw`Light-travel time solver did not converge: dt = ${a}`}class Cr{constructor(e,t,a,i){this.observerBody=e,this.targetBody=t,this.aberration=a,this.observerPos=i}Position(e){this.aberration&&(this.observerPos=ae(this.observerBody,e));const t=ae(this.targetBody,e);return new M(t.x-this.observerPos.x,t.y-this.observerPos.y,t.z-this.observerPos.z,e)}}function Nr(n,e,t,a){Wa(a);const i=B(n);if(st(t)){const s=ae(t,i);if(a){const h=Pr(e,i),d=new M(s.x-h.x,s.y-h.y,s.z-h.z,i),c=Na/d.Length();return new M(d.x+h.vx/c,d.y+h.vy/c,d.z+h.vz/c,i)}const l=ae(e,i);return new M(s.x-l.x,s.y-l.y,s.z-l.z,i)}let o;a?o=new M(0,0,0,i):o=ae(e,i);const r=new Cr(e,t,a,o);return Dr(s=>r.Position(s),i)}function qe(n,e,t){Wa(t);const a=B(e);switch(n){case g.Earth:return new M(0,0,0,a);case g.Moon:return ye(a);default:const i=Nr(a,g.Earth,n,t);return i.t=a,i}}function Or(n,e){return new ne(n.r.x,n.r.y,n.r.z,n.v.x,n.v.y,n.v.z,e)}function Pr(n,e){const t=B(e);switch(n){case g.Sun:return new ne(0,0,0,0,0,0,t);case g.SSB:const a=new Ve(t.tt);return new ne(-a.Sun.r.x,-a.Sun.r.y,-a.Sun.r.z,-a.Sun.v.x,-a.Sun.v.y,-a.Sun.v.z,t);case g.Mercury:case g.Venus:case g.Earth:case g.Mars:case g.Jupiter:case g.Saturn:case g.Uranus:case g.Neptune:const i=_n(Q[n],t.tt);return Or(i,t);case g.Pluto:return Ga(t);case g.Moon:case g.EMB:const o=_n(Q.Earth,t.tt),r=n==g.Moon?Ya(t):xr(t);return new ne(r.x+o.r.x,r.y+o.r.y,r.z+o.r.z,r.vx+o.v.x,r.vy+o.v.y,r.vz+o.v.z,t);default:if(st(n)){const s=ae(n,t);return new ne(s.x,s.y,s.z,0,0,0,t)}throw`HelioState: Unsupported body "${n}"`}}function Lr(n,e,t,a,i){let o=(i+t)/2-a,r=(i-t)/2,s=a,l;if(o==0){if(r==0||(l=-s/r,l<-1||l>1))return null}else{let c=r*r-4*o*s;if(c<=0)return null;let p=Math.sqrt(c),b=(-r+p)/(2*o),f=(-r-p)/(2*o);if(-1<=b&&b<=1){if(-1<=f&&f<=1)return null;l=b}else if(-1<=f&&f<=1)l=f;else return null}let h=n+l*e,d=(2*o*l+r)/e;return{t:h,df_dt:d}}function Wr(n,e,t,a){const i=te(a&&a.dt_tolerance_seconds||1),o=Math.abs(i/ir);let r=a&&a.init_f1||n(e),s=a&&a.init_f2||n(t),l=NaN,h=0,d=a&&a.iter_limit||20,c=!0;for(;;){if(++h>d)throw"Excessive iteration in Search()";let p=mr(e,t,.5),b=p.ut-e.ut;if(Math.abs(b)<o)return p;c?l=n(p):c=!0;let f=Lr(p.ut,t.ut-p.ut,r,l,s);if(f){let T=B(f.t),D=n(T);if(f.df_dt!==0){if(Math.abs(D/f.df_dt)<o)return T;let N=1.2*Math.abs(D/f.df_dt);if(N<b/10){let F=T.AddDays(-N),z=T.AddDays(+N);if((F.ut-e.ut)*(F.ut-t.ut)<0&&(z.ut-e.ut)*(z.ut-t.ut)<0){let Y=n(F),V=n(z);if(Y<0&&V>=0){r=Y,s=V,e=F,t=z,l=D,c=!1;continue}}}}}if(r<0&&l>=0){t=p,s=l;continue}if(l<0&&s>=0){e=p,r=l;continue}return null}}function Br(n){let e=n;for(;e<=-180;)e+=360;for(;e>180;)e-=360;return e}function Fr(n){for(;n<0;)n+=360;for(;n>=360;)n-=360;return n}function zr(n,e,t){if(n===g.Earth||e===g.Earth)throw"The Earth does not have a longitude as seen from itself.";const a=B(t),i=qe(n,a,!1),o=ge(i),r=qe(e,a,!1),s=ge(r);return Fr(o.elon-s.elon)}function Jn(n,e){if(n===g.Sun)throw"Cannot calculate heliocentric longitude of the Sun.";const t=ae(n,e);return ge(t).elon}function Hr(n,e,t,a){let i,o=0,r=0,s=0;switch(n){case g.Mercury:i=-.6,o=4.98,r=-4.88,s=3.02;break;case g.Venus:e<163.6?(i=-4.47,o=1.03,r=.57,s=.13):(i=.98,o=-1.02);break;case g.Mars:i=-1.52,o=1.6;break;case g.Jupiter:i=-9.4,o=.5;break;case g.Uranus:i=-7.19,o=.25;break;case g.Neptune:i=-6.87;break;case g.Pluto:i=-1,o=4;break;default:throw`VisualMagnitude: unsupported body ${n}`}const l=e/100;let h=i+l*(o+l*(r+l*s));return h+=5*Math.log10(t*a),h}function Yr(n,e,t,a,i){const o=ge(a),r=H*28.06,s=H*(169.51+382e-7*i.tt),l=H*o.elat,h=H*o.elon,d=Math.asin(Math.sin(l)*Math.cos(r)-Math.cos(l)*Math.sin(r)*Math.sin(h-s)),c=Math.sin(Math.abs(d));let p=-9+.044*n;return p+=c*(-2.6+1.2*c),p+=5*Math.log10(e*t),{mag:p,ring_tilt:ze*d}}function qr(n,e,t){let a=n*H,i=a*a,o=i*i,r=-12.717+1.49*Math.abs(a)+.0431*o;const s=385000.6/Oa;let l=t/s;return r+=5*Math.log10(e*l),r}class jr{constructor(e,t,a,i,o,r,s,l){this.time=e,this.mag=t,this.phase_angle=a,this.helio_dist=i,this.geo_dist=o,this.gc=r,this.hc=s,this.ring_tilt=l,this.phase_fraction=(1+Math.cos(H*a))/2}}function _r(n,e){if(n===g.Earth)throw"The illumination of the Earth is not defined.";const t=B(e),a=ke(Q.Earth,t);let i,o,r,s;n===g.Sun?(r=new M(-a.x,-a.y,-a.z,t),o=new M(0,0,0,t),i=0):(n===g.Moon?(r=ye(t),o=new M(a.x+r.x,a.y+r.y,a.z+r.z,t)):(o=ae(n,e),r=new M(o.x-a.x,o.y-a.y,o.z-a.z,t)),i=sr(r,o));let l=r.Length(),h=o.Length(),d;if(n===g.Sun)s=ar+5*Math.log10(l);else if(n===g.Moon)s=qr(i,h,l);else if(n===g.Saturn){const c=Yr(i,h,l,r,t);s=c.mag,d=c.ring_tilt}else s=Hr(n,i,h,l);return new jr(t,s,i,h,l,r,o,d)}function Ua(n){return zr(g.Moon,g.Sun,n)}function Va(n,e,t){function a(p){let b=Ua(p);return Br(b-n)}te(n),te(t);const i=1.5,o=B(e);let r=a(o),s,l,h;if(t<0){if(r<0&&(r+=360),s=-(ia*r)/360,h=s+i,h<t)return null;l=Math.max(t,s-i)}else{if(r>0&&(r-=360),s=-(ia*r)/360,l=s-i,l>t)return null;h=Math.min(t,s+i)}const d=o.AddDays(l),c=o.AddDays(h);return Wr(a,d,c,{dt_tolerance_seconds:.1})}var la;(function(n){n[n.Pericenter=0]="Pericenter",n[n.Apocenter=1]="Apocenter"})(la||(la={}));function Gr(n,e){e=B(e);const t=n.lat*H,a=n.lon*H,i=n.dist*Math.cos(t);return new M(i*Math.cos(a),i*Math.sin(a),n.dist*Math.sin(t),e)}var ha;(function(n){n.Penumbral="penumbral",n.Partial="partial",n.Annular="annular",n.Total="total"})(ha||(ha={}));var ca;(function(n){n[n.Invalid=0]="Invalid",n[n.Ascending=1]="Ascending",n[n.Descending=-1]="Descending"})(ca||(ca={}));const Ja="☉",Ka="☽",da="︎",Ur=[{body:g.Mercury,glyph:"☿",name:"Mercury"},{body:g.Venus,glyph:"♀",name:"Venus"},{body:g.Mars,glyph:"♂",name:"Mars"},{body:g.Jupiter,glyph:"♃",name:"Jupiter"},{body:g.Saturn,glyph:"♄",name:"Saturn"},{body:g.Uranus,glyph:"♅",name:"Uranus"},{body:g.Neptune,glyph:"♆",name:"Neptune"}];function Vr(n){const e=(n%360+360)%360;return e<22.5||e>=337.5?"New Moon":e<67.5?"Waxing crescent":e<112.5?"First quarter":e<157.5?"Waxing gibbous":e<202.5?"Full Moon":e<247.5?"Waning gibbous":e<292.5?"Last quarter":"Waning crescent"}const Jr=[{angle:0,name:"New Moon"},{angle:90,name:"First quarter"},{angle:180,name:"Full Moon"},{angle:270,name:"Last quarter"}];function Kr(n){return new Intl.DateTimeFormat(void 0,{dateStyle:"medium",timeStyle:"short"}).format(n)}function $r(n){return new Intl.DateTimeFormat(void 0,{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"}).format(n)}function Qr(n,e){const t=Jn(n,e),a=B(e).AddDays(3);let o=Jn(n,a)-t;return o>180&&(o-=360),o<-180&&(o+=360),o>=0?"direct":"retrograde"}function $a(n){let e=null;const t=B(n);for(const a of Jr){const i=Va(a.angle,t,40);if(!i)continue;const o=i.date.getTime()-t.date.getTime();o<0||(!e||o<e.ms)&&(e={name:a.name,at:i.date.toISOString(),ms:o})}return e}function Xr(n){const e=B(n),t=Va(180,e,45);return!t||t.date.getTime()<e.date.getTime()-1e3?null:t.date}function Zr(n){const e=[],t=$a(n);return t&&e.push({label:`Moon · ${t.name}`,at:t.at}),e.slice(0,4)}function es(n,e){const t=B(n),a=null,i=ge(qe(g.Sun,t,!0)).elon,o={glyph:Ja,accessibleLabel:"Sun",eclipticLongitudeDeg:i,horizon:null,riseSet:null},r=_r(g.Moon,t),s=Ua(t),l=ge(qe(g.Moon,t,!0)).elon,h={glyph:Ka,accessibleLabel:"Moon",phaseName:Vr(s),illuminationPercent:Math.round(r.phase_fraction*1e3)/10,phaseAngleDeg:Math.round(r.phase_angle*10)/10,eclipticLongitudeDeg:Math.round(l*100)/100,nextPrimaryPhase:$a(t),horizon:null,riseSet:null},d=Ur.map(c=>{const p=Jn(c.body,t);return{glyph:c.glyph,name:c.name,accessibleLabel:c.name,eclipticLongitudeDeg:Math.round(p*100)/100,motion:Qr(c.body,t),horizon:null,riseSet:null}});return{computedAt:n.toISOString(),localTimeLabel:Kr(n),utcTimeLabel:$r(n),sun:o,moon:h,planets:d,events:Zr(t),locationUsed:!!a}}function ns(n,e){return es(n)}let Rn=null;function ts(){Rn&&clearInterval(Rn),Rn=null}const as=`
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

The route is practical. We begin by remembering dreams and training attention, then move through body awareness, visualization, hypnagogia, lucid dreaming, altered self-location, out-of-body techniques, verification, competing explanations, the larger sky we are already floating through, strange coincidences, and finally a repeatable nightly practice.

You do not need to believe the same thing at the end that you believed at the beginning. You only need to become a better observer of your own experience.

## Why “Psychical”?

I'll admit that the name did not arrive in a bolt of revelation.

I was looking for words related to astral projection that weren't already attached to somebody else's domain name.

But *Psychical Excursion* grew on me.

It sounds a little old-fashioned. A little adventurous. Maybe slightly ridiculous.

I like all three.

The word *psychical* also has an interesting history. In the late nineteenth century, researchers formed organizations devoted to “psychical research” in an attempt to investigate disputed questions about mind, perception, unusual experiences, and claims that seemed to sit outside ordinary explanations. The Society for Psychical Research, founded in 1882, explicitly framed its work as inquiry rather than required belief.[1]

That posture appeals to me.

Something strange is claimed. Don't worship it, and don't laugh it out of the room either.

Look at it. Ask questions. Try what can actually be tried.

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

Why? What does extreme stress do to our perception of time? What happens to consciousness around sleep, trauma, anesthesia, meditation, and death? Are extraordinary experiences entirely products of the brain, and is that distinction even as simple as it sounds? Could consciousness ever exist or operate independently of the physical body?

Those questions are much larger than this guide can settle. They are still excellent reasons to explore.

## What This Book Actually Does

Each section takes one piece of the larger question and slows it down enough to examine.

We will look at research where research can answer something.

We will look at historical, religious, occult, and contemplative traditions when they offer useful maps.

We will practice.

We will record what happens.

And when a claim becomes testable, we will try to make the test cleaner rather than the story bigger.

The book gradually moves from ordinary skills toward stranger territory.

Dream recall becomes dream recognition.

Body awareness becomes altered self-location.

Visualization becomes autonomous imagery.

Lucid dreaming becomes a laboratory.

Out-of-body techniques become something we can compare with lucid dreaming, sleep paralysis, and body-schema research.

The Sun, Moon, planets, synchronicity, recurring places, and shared-dream reports become things to investigate without granting them automatic authority.

At the end, the many techniques collapse back into one repeatable practice.

The point is not to collect twenty-three beliefs.

The point is to become more skillful at noticing what consciousness actually does.

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

When we reach the strange collection of techniques people have used to attempt out-of-body experiences, we'll try those too.

Carefully.

Curiously.

Without pretending beforehand that we know what the result means.

By then, you will also have a way to test unusual experiences, compare competing maps, notice recurring patterns without surrendering to them, and return to one simple nightly routine.

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

`,is="An experiment in dreams, consciousness, energy, and out-of-body experience";function os(n){const e=n.trim(),t=e.match(/^#\s+(.+)\n+/);if(!t)throw new Error("Guidebook manuscript must begin with a top-level heading");const a=t[1].trim(),o=e.slice(t[0].length).split(/\n## /),r=ua(o[0]??""),s=[];let l=[];for(let h=1;h<o.length;h+=1){const d=o[h],c=d.indexOf(`
`),p=(c===-1?d:d.slice(0,c)).trim(),b=c===-1?"":d.slice(c+1);if(p==="References"){l=rs(b);continue}s.push({heading:p,paragraphs:ua(b)})}return{openingHeading:a,openingParagraphs:r,sections:s,references:l}}function ua(n){return n.split(/\n---\n/).flatMap(e=>e.split(/\n\n+/)).map(e=>e.replace(/\n/g," ").trim()).filter(Boolean)}function rs(n){return n.split(/\n+/).map(e=>e.trim()).filter(Boolean)}let Mn=null;function Qa(){return Mn||(Mn=os(as)),Mn}function ma(n){return n.replace(/[.,;:!?)]+$/u,"")}function je(n,e={}){const{linkCitations:t=!0}=e,a=m("span",{class:"guidebook-rich-text"}),i=String.raw`\[(?:[^\]]+)\]\((?:pex:[a-z0-9-]+|#\/[^)\s]+|\/[a-z0-9-/#]+)\)`,o=t?new RegExp(`(${i}|\\*\\*[^*]+\\*\\*|\\*[^*]+\\*|\\[\\d+\\]|https:\\/\\/\\S+|doi:10\\.\\S+)`,"gi"):new RegExp(`(${i}|\\*\\*[^*]+\\*\\*|\\*[^*]+\\*|https:\\/\\/\\S+|doi:10\\.\\S+)`,"gi");let r=0;for(const s of n.matchAll(o)){const l=s.index??0;l>r&&a.append(n.slice(r,l));const h=s[0],d=h.match(/^\[([^\]]+)\]\((pex:[a-z0-9-]+|#\/[^)\s]+|\/[a-z0-9-/#]+)\)$/i);if(d){const c=d[1],p=d[2],b=p.toLowerCase().startsWith("pex:")?p.slice(4).toLowerCase():"",f=b?yi[b]:void 0,T=f?.href??(p===Cn||p.endsWith(`#${Zn}`)?Cn:p),D=m("a",{href:T,class:"guidebook-pex-link","data-pex-link":f?.id}),N=c.match(/^\*\*(.+)\*\*$/);N?D.append(m("strong",{},[N[1]])):D.append(c),a.append(D)}else if(h.startsWith("**"))a.append(m("strong",{},[h.slice(2,-2)]));else if(h.startsWith("*"))a.append(m("em",{},[h.slice(1,-1)]));else if(/^\[\d+\]$/.test(h)&&t){const c=h.slice(1,-1);a.append(m("a",{href:`#ref-${c}`,class:"guidebook-citation"},[h]))}else if(h.toLowerCase().startsWith("doi:10.")){const c=ma(h.slice(4));a.append(m("a",{href:`https://doi.org/${c}`,class:"guidebook-doi",rel:"noreferrer"},[h]))}else if(h.toLowerCase().startsWith("https://")){const c=ma(h);a.append(m("a",{href:c,class:"guidebook-external",rel:"noreferrer"},[h]))}else a.append(h);r=l+h.length}return r<n.length&&a.append(n.slice(r)),a.childNodes.length||a.append(n),a}function Kn(n,e){const t=m("p",{});return t.append(je(n,e)),t}function Xa(n){const e=n.match(/^(?:\*\*)?\[(\d+)\](?:\*\*)?\s*(.*)$/),t=e?.[1]??"0",a=e?.[2]??n,i=m("li",{id:`ref-${t}`,class:"guidebook-reference-item"}),o=m("span",{class:"guidebook-ref-num"},[`[${t}] `]);return i.append(o,je(a,{linkCitations:!1})),i.tabIndex=-1,i}function ss(n){for(const e of n.querySelectorAll("a.guidebook-citation"))e.addEventListener("click",t=>{const i=(e.getAttribute("href")??"").match(/^#ref-(\d+)$/);if(!i)return;const o=n.querySelector(`#ref-${i[1]}`);if(!o)return;t.preventDefault();const r=typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;o.scrollIntoView({behavior:r?"auto":"smooth",block:"start"}),o.focus({preventScroll:!0})});for(const e of n.querySelectorAll("a.guidebook-pex-link"))e.addEventListener("click",t=>{const a=e.getAttribute("href")??"";let i="",o=!0;try{const l=new URL(a,window.location.href);i=l.hash.replace(/^#/,"");const h=window.location.pathname.replace(/\/?$/,"/"),d=l.pathname.replace(/\/?$/,"/");o=d===h||d==="/"||a.startsWith("#")}catch{i=a.includes("#")?a.split("#").pop()??"":""}if(!i||i.startsWith("/")||!o)return;const r=n.querySelector(`[id="${i}"]`);if(!r)return;t.preventDefault(),r.closest(".guidebook-section")?.classList.add("is-visible");const s=typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;r.scrollIntoView({behavior:s?"auto":"smooth",block:"start"}),r.focus({preventScroll:!0})})}function Oe(n){return m("section",{class:n?"guidebook-section pex-reveal is-visible":"guidebook-section pex-reveal"})}function ls(n){const e=Qa(),t=m("article",{class:"guidebook-article"});let a=Oe(!0);t.append(a),a.append(m("p",{class:"guidebook-subtitle"},[is]),m("h1",{class:"guidebook-opening-title"},[Si]),m("p",{class:"guidebook-opening-heading"},[e.openingHeading]),...e.openingParagraphs.map(i=>Kn(i)));for(const i of e.sections){a=Oe(!1),t.append(a),a.append(m("h2",{class:"guidebook-section-title"},[i.heading]));for(const o of i.paragraphs){if(o.startsWith("**")&&o.endsWith("**")){a.append(m("p",{class:"guidebook-emphasis-line"},[o.slice(2,-2)]));continue}a.append(Kn(o))}}if(e.references.length){a=Oe(!1),t.append(a),a.append(m("h2",{class:"guidebook-section-title",id:"references"},["References"]));const i=m("ul",{class:"guidebook-references"});for(const o of e.references)i.append(Xa(o));a.append(i)}a=Oe(!1),t.append(a),a.append(m("p",{class:"guidebook-next"},[m("a",{href:xa,class:"guidebook-next-link",id:"guidebook-next-chapter"},[Ia,m("span",{class:"guidebook-next-arrow","aria-hidden":"true"},[" →"])])])),n.append(t)}const hs="My body sleeps. I remain aware. I recognize the transition and calmly enter.",cs="A researched, practical journey through dream recall, attention, lucid dreaming, sleep-edge states, out-of-body experience, verification, strange coincidences, and the question of how far consciousness can go.",ds="Read Psychical Excursion",Pe={innerSeconds:180,midSeconds:240,outerSeconds:300,breatheSeconds:96},_=500,G=500;function v(n,e={}){const t=document.createElementNS("http://www.w3.org/2000/svg",n);for(const[a,i]of Object.entries(e))t.setAttribute(a,i);return t}function A(n,e){const t=(e-90)*Math.PI/180;return[_+n*Math.cos(t),G+n*Math.sin(t)]}function Za(n,e,t=0){return Array.from({length:n},(a,i)=>A(e,360/n*i+t).join(",")).join(" ")}function pa(n,e,t,a=0){const i=[];for(let o=0;o<n;o+=1)i.push(A(e,360/n*o+a).join(",")),i.push(A(t,360/n*o+180/n+a).join(","));return i.join(" ")}function Dn(n,e,t,a){return[A(t,n),A((e+t)/2,n-a),A(e,n),A((e+t)/2,n+a)].map(i=>i.join(",")).join(" ")}function us(n,e,t,a){return[A(t,n),A(e,n-a),A(e,n+a)].map(i=>i.join(",")).join(" ")}function j(n,e,t,a,i){n.append(v("polygon",{class:i,points:Za(e,t,a)}))}function ms(){return typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}function ei(){const n=ms(),e=m("figure",{class:n?"pex-attention-instrument is-static":"pex-attention-instrument"});e.setAttribute("role","img"),e.setAttribute("aria-label","Original Psychical Excursion attention instrument: nested thin-line geometry around a fixed center. Looking toward the center is optional. Seeing no afterimage or mental picture is not required.");const t=v("svg",{viewBox:"0 0 1000 1000",focusable:"false"});t.style.setProperty("--pex-attention-inner",`${Pe.innerSeconds}s`),t.style.setProperty("--pex-attention-mid",`${Pe.midSeconds}s`),t.style.setProperty("--pex-attention-outer",`${Pe.outerSeconds}s`),t.style.setProperty("--pex-attention-breathe",`${Pe.breatheSeconds}s`);const a=v("g",{class:"pex-attention-layer pex-attention-beyond"});a.append(v("polygon",{class:"pex-attention-line pex-attention-faintest",points:Za(36,486,5)})),a.append(v("circle",{class:"pex-attention-line pex-attention-faintest",cx:String(_),cy:String(G),r:"478"}));for(let h=0;h<72;h+=1){const d=h*5,c=A(468,d),p=A(h%6===0?492:484,d);a.append(v("line",{class:"pex-attention-line pex-attention-faintest",x1:c[0].toFixed(2),y1:c[1].toFixed(2),x2:p[0].toFixed(2),y2:p[1].toFixed(2)}))}const i=v("g",{class:"pex-attention-layer pex-attention-spin-outer"});i.append(v("circle",{class:"pex-attention-line pex-attention-strong",cx:String(_),cy:String(G),r:"438"})),i.append(v("circle",{class:"pex-attention-line",cx:String(_),cy:String(G),r:"418"}));for(let h=0;h<144;h+=1){const d=h*2.5,c=h%12===0,p=h%4===0,b=A(c?398:p?406:410,d),f=A(438,d);i.append(v("line",{class:c?"pex-attention-line pex-attention-strong":"pex-attention-line pex-attention-fine",x1:b[0].toFixed(2),y1:b[1].toFixed(2),x2:f[0].toFixed(2),y2:f[1].toFixed(2)}))}for(let h=0;h<8;h+=1){const d=h*45;i.append(v("polygon",{class:"pex-attention-line",points:Dn(d,442,462,3.2)}));const c=A(h%2===0?454:448,d);i.append(v("circle",{class:"pex-attention-fill pex-attention-fine",cx:c[0].toFixed(2),cy:c[1].toFixed(2),r:h%2===0?"2.1":"1.3"}))}for(const h of[18,138,258])i.append(v("path",{class:"pex-attention-line pex-attention-arc",d:ps(394,h,h+84)}));const o=v("g",{class:"pex-attention-layer pex-attention-spin-mid"});for(const h of[372,344,316,288])o.append(v("circle",{class:"pex-attention-line",cx:String(_),cy:String(G),r:String(h)}));j(o,12,372,0,"pex-attention-line pex-attention-soft"),j(o,12,372,15,"pex-attention-line pex-attention-soft");for(let h=0;h<24;h+=1)o.append(v("polygon",{class:"pex-attention-line",points:Dn(h*15,300,368,5.4)}));for(let h=0;h<36;h+=1)o.append(v("polygon",{class:"pex-attention-line pex-attention-fine",points:us(h*10,248,286,3.6)}));for(let h=0;h<24;h+=1){const d=h*15,c=A(132,d),p=A(h%2===0?368:316,d);o.append(v("line",{class:h%2===0?"pex-attention-line":"pex-attention-line pex-attention-fine",x1:c[0].toFixed(2),y1:c[1].toFixed(2),x2:p[0].toFixed(2),y2:p[1].toFixed(2)}))}const r=v("g",{class:"pex-attention-layer pex-attention-breathe"});j(r,8,236,0,"pex-attention-line pex-attention-strong"),j(r,8,236,22.5,"pex-attention-line"),j(r,6,204,0,"pex-attention-line"),j(r,6,204,30,"pex-attention-line"),j(r,4,176,0,"pex-attention-line pex-attention-soft"),j(r,4,176,45,"pex-attention-line pex-attention-soft"),r.append(v("polygon",{class:"pex-attention-line",points:pa(16,220,148,0)})),r.append(v("polygon",{class:"pex-attention-line pex-attention-fine",points:pa(12,190,126,15)}));for(const h of[168,148,128])r.append(v("circle",{class:"pex-attention-line pex-attention-fine",cx:String(_),cy:String(G),r:String(h)}));const s=v("g",{class:"pex-attention-layer pex-attention-spin-inner"});for(let h=0;h<12;h+=1){const[d,c]=A(34,h*30);s.append(v("circle",{class:"pex-attention-line",cx:d.toFixed(2),cy:c.toFixed(2),r:"34"}))}for(let h=0;h<8;h+=1)s.append(v("polygon",{class:"pex-attention-line pex-attention-fine",points:Dn(h*45+22.5,58,108,8)}));j(s,16,96,0,"pex-attention-line pex-attention-fine"),j(s,8,72,0,"pex-attention-line"),s.append(v("circle",{class:"pex-attention-line",cx:String(_),cy:String(G),r:"54"}));for(let h=0;h<32;h+=1){const d=h*11.25,c=A(46,d),p=A(h%4===0?70:62,d);s.append(v("line",{class:"pex-attention-line pex-attention-fine",x1:c[0].toFixed(2),y1:c[1].toFixed(2),x2:p[0].toFixed(2),y2:p[1].toFixed(2)}))}const l=v("g",{class:"pex-attention-layer pex-attention-center"});return l.append(v("circle",{class:"pex-attention-line pex-attention-strong",cx:String(_),cy:String(G),r:"18"})),l.append(v("circle",{class:"pex-attention-line pex-attention-fine",cx:String(_),cy:String(G),r:"8"})),l.append(v("circle",{class:"pex-attention-fill pex-attention-center-point",cx:String(_),cy:String(G),r:"2.2"})),t.append(a,i,o,r,s,l),e.append(t),e}function ps(n,e,t){const a=A(n,e),i=A(n,t),o=t-e>180?1:0;return`M ${a[0].toFixed(2)} ${a[1].toFixed(2)} A ${n} ${n} 0 ${o} 1 ${i[0].toFixed(2)} ${i[1].toFixed(2)}`}function gs(n){const e=ei(),t=m("article",{class:"guidebook-article guidebook-landing"},[m("h1",{class:"visually-hidden"},["Psychical Excursion"]),m("div",{class:"guidebook-landing-mandala"},[e]),m("p",{class:"guidebook-landing-affirmation"},[hs]),m("p",{class:"guidebook-book-entry"},[m("a",{href:Be,class:"guidebook-next-link guidebook-book-entry-link",id:"guidebook-enter-book"},[ds,m("span",{class:"guidebook-next-arrow","aria-hidden":"true"},[" →"])])]),m("p",{class:"guidebook-landing-synopsis"},[cs])]);n.append(t)}function de(n){return m("section",{class:n?"guidebook-section pex-reveal is-visible":"guidebook-section pex-reveal"})}function ni(n,e,t="guidebook-section-subheading"){for(const a of e){if(a.kind==="emphasis"){n.append(m("p",{class:"guidebook-emphasis-line"},[a.text]));continue}if(a.kind==="quote"){const i=m("blockquote",{class:"guidebook-pull"});i.append(je(a.text)),n.append(i);continue}if(a.kind==="list"){const i=m(a.ordered?"ol":"ul",{class:"guidebook-steps"});for(const o of a.items){const r=m("li",{});r.append(je(o)),i.append(r)}n.append(i);continue}if(a.kind==="rule"){n.append(m("hr",{class:"guidebook-rule"}));continue}if(!(a.kind==="heading"||a.kind==="practice"||a.kind==="attention")){if(a.kind==="subheading"){n.append(m("h3",{class:t},[a.text]));continue}n.append(Kn(a.text))}}}function ys(n){const e=m("section",{class:"guidebook-practice-part"});return e.append(m("h2",{class:"guidebook-practice-label"},[n.label])),ni(e,n.blocks,"guidebook-practice-subheading"),e}function fs(n){return m("nav",{class:"guidebook-prev","aria-label":"Previous reading"},[m("a",{href:n.href,class:"guidebook-prev-link",id:n.id},[m("span",{class:"guidebook-prev-arrow","aria-hidden":"true"},["← "]),n.title])])}function x(n,e,t={}){const a=m("article",{class:"guidebook-article guidebook-chapter"});let i=de(!0);a.append(i),t.previous&&i.append(fs(t.previous)),i.append(m("h1",{class:"guidebook-chapter-title"},[e.title]));for(const o of e.blocks){if(o.kind==="heading"){i=de(!1),a.append(i);const r=m("h2",{class:"guidebook-section-title"},[o.text]),s=gi(o.text);s&&(r.id=s,r.tabIndex=-1),i.append(r);continue}if(o.kind==="practice"){i=de(!1),a.append(i);const r=m("aside",{class:"guidebook-practice","aria-label":"Summary, experiment, and intention"});for(const s of o.parts)r.append(ys(s));i.append(r);continue}if(o.kind==="attention"){i=de(!1),a.append(i),i.append(ei());continue}ni(i,[o])}if(e.references.length){i=de(!1),a.append(i),i.append(m("h2",{class:"guidebook-section-title",id:"references"},["References"]));const o=m("ul",{class:"guidebook-references"});for(const r of e.references)o.append(Xa(r));i.append(o)}t.next&&(i=de(!1),a.append(i),i.append(m("p",{class:"guidebook-next"},[m("a",{href:t.next.href,class:"guidebook-next-link",id:t.next.id},[t.next.title,m("span",{class:"guidebook-next-arrow","aria-hidden":"true"},[" →"])])]))),n.append(a)}function I(n,e){const t=document.createElementNS("http://www.w3.org/2000/svg",n);for(const[a,i]of Object.entries(e))t.setAttribute(a,i);return t}function bs(n){const e=m("div",{class:`pex-ambient pex-ambient-${n}`,"aria-hidden":"true"}),t=I("svg",{viewBox:"0 0 1200 900",focusable:"false"}),a=I("g",{class:"pex-ambient-spin pex-ambient-spin-slow"});a.append(I("circle",{class:"pex-ambient-arc",cx:"620",cy:"430",r:"318"}),I("circle",{class:"pex-ambient-arc pex-ambient-arc-faint",cx:"620",cy:"430",r:"214"}),I("circle",{class:"pex-ambient-point",cx:"938",cy:"430",r:"2.2"}),I("circle",{class:"pex-ambient-point",cx:"406",cy:"238",r:"1.6"}));const i=I("g",{class:"pex-ambient-spin pex-ambient-spin-mid"});i.append(I("ellipse",{class:"pex-ambient-arc",cx:"580",cy:"400",rx:"430",ry:"168"}),I("path",{class:"pex-ambient-arc pex-ambient-arc-partial",d:"M220 520 C 380 220, 820 180, 1040 470"}),I("circle",{class:"pex-ambient-point",cx:"1010",cy:"400",r:"1.8"}));const o=I("g",{class:"pex-ambient-axis"});if(o.append(I("line",{class:"pex-ambient-line",x1:"600",y1:"40",x2:"600",y2:"860"}),I("line",{class:"pex-ambient-line pex-ambient-line-soft",x1:"80",y1:"390",x2:"1120",y2:"510"})),t.append(o,a,i),n==="memory"){const r=I("g",{class:"pex-ambient-memory-forms"});r.append(I("ellipse",{class:"pex-ambient-form pex-ambient-form-a",cx:"430",cy:"360",rx:"92",ry:"48"}),I("ellipse",{class:"pex-ambient-form pex-ambient-form-b",cx:"760",cy:"500",rx:"70",ry:"110"}),I("circle",{class:"pex-ambient-form pex-ambient-form-c",cx:"620",cy:"280",r:"36"})),t.append(r)}if(n==="notice"||n==="recognize"){const r=I("g",{class:"pex-ambient-notice-align"});r.append(I("path",{class:"pex-ambient-arc pex-ambient-align-a",d:"M260 300 C 480 220, 700 240, 940 360"}),I("path",{class:"pex-ambient-arc pex-ambient-align-b",d:"M300 620 C 520 420, 760 380, 980 520"}),I("circle",{class:"pex-ambient-point pex-ambient-align-point",cx:"640",cy:"390",r:"2.4"})),n==="recognize"&&r.append(I("circle",{class:"pex-ambient-form pex-ambient-recognize-ring",cx:"640",cy:"390",r:"5.5"})),t.append(r)}if(n==="body"){const r=I("g",{class:"pex-ambient-body-forms"});r.append(I("ellipse",{class:"pex-ambient-form pex-ambient-form-a",cx:"620",cy:"318",rx:"36",ry:"48"}),I("ellipse",{class:"pex-ambient-form pex-ambient-form-b",cx:"620",cy:"468",rx:"58",ry:"92"}),I("circle",{class:"pex-ambient-point",cx:"620",cy:"390",r:"1.8"})),t.append(r)}return e.append(t),e}const ws=[{name:"Aries",glyph:"♈︎"},{name:"Taurus",glyph:"♉︎"},{name:"Gemini",glyph:"♊︎"},{name:"Cancer",glyph:"♋︎"},{name:"Leo",glyph:"♌︎"},{name:"Virgo",glyph:"♍︎"},{name:"Libra",glyph:"♎︎"},{name:"Scorpio",glyph:"♏︎"},{name:"Sagittarius",glyph:"♐︎"},{name:"Capricorn",glyph:"♑︎"},{name:"Aquarius",glyph:"♒︎"},{name:"Pisces",glyph:"♓︎"}];function ga(n){const e=(n%360+360)%360;return ws[Math.floor(e/30)%12]}function vs(n){const e=new Intl.DateTimeFormat(void 0,{month:"short",day:"numeric"}).format(n),t=new Intl.DateTimeFormat(void 0,{hour:"numeric",minute:"2-digit"}).format(n),a=new Intl.DateTimeFormat(void 0,{month:"long",day:"numeric",hour:"numeric",minute:"2-digit"}).format(n);return{date:e,time:t,spoken:a}}function ya(n,e,t,a){const i=n==="sun"?`Sun in ${t}`:`Moon in ${t}`;return m("span",{class:"sky-widget-pair",tabindex:"0",role:"img","aria-label":i,"data-sky-body":n},[m("span",{class:"sky-widget-body","aria-hidden":"true"},[e]),m("span",{class:"sky-widget-sign","aria-hidden":"true"},[a]),m("span",{class:"sky-widget-tip","aria-hidden":"true"},[i])])}function Ts(){const n=new Date,e=ns(n),t=ga(e.sun.eclipticLongitudeDeg),a=ga(e.moon.eclipticLongitudeDeg),i=Xr(n),o=i?vs(i):null,r=o?`Sun in ${t.name}. Moon in ${a.name}. Next full moon ${o.spoken}.`:`Sun in ${t.name}. Moon in ${a.name}.`,s=o?m("span",{class:"sky-widget-full"},[m("span",{class:"sky-widget-full-label"},["Full Moon · "]),m("span",{class:"sky-widget-full-when"},[`${o.date} · ${o.time}`])]):m("span",{class:"sky-widget-full"},["Full Moon"]);return m("div",{class:"sky-widget-compact",role:"group","aria-label":r},[ya("sun",`${Ja}${da}`,t.name,t.glyph),ya("moon",`${Ka}${da}`,a.name,a.glyph),s])}function ks(){return Ge.filter(n=>n.id!=="landing").map((n,e)=>({number:String(e+1).padStart(2,"0"),title:n.id==="home"?Qa().openingHeading:n.title,path:n.path,id:n.id}))}const fa="guidebook-chapter-panel",Is="guidebook-chapter-trigger";let _e=null;function ti(){_e?.abort(),_e=null}function xs(){return typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}function As(){const n=document.createElementNS("http://www.w3.org/2000/svg","svg");n.setAttribute("viewBox","0 0 24 24"),n.setAttribute("aria-hidden","true"),n.setAttribute("class","guidebook-chapter-icon"),n.setAttribute("focusable","false");const e=document.createElementNS("http://www.w3.org/2000/svg","polygon");e.setAttribute("points","12,0.4 23.6,12 12,23.6 0.4,12"),e.setAttribute("class","guidebook-chapter-icon-diamond");const t=document.createElementNS("http://www.w3.org/2000/svg","polygon");t.setAttribute("points","6.2,6.2 17.8,6.2 17.8,17.8 6.2,17.8"),t.setAttribute("class","guidebook-chapter-icon-square");const a=document.createElementNS("http://www.w3.org/2000/svg","circle");return a.setAttribute("cx","12"),a.setAttribute("cy","12"),a.setAttribute("r","1.1"),a.setAttribute("class","guidebook-chapter-icon-point"),n.append(e,t,a),n}function ba(n,e,t,a){n.classList.toggle("is-open",a),e.setAttribute("aria-expanded",a?"true":"false"),e.setAttribute("aria-label",a?"Close chapter menu":"Open chapter menu"),t.hidden=!a,a&&t.querySelector("[aria-current='page']")?.scrollIntoView({block:"nearest",behavior:xs()?"auto":"smooth"})}function Ss(n){ti();const e=Ea(n),t=ks(),a=m("button",{type:"button",id:Is,class:"guidebook-chapter-trigger","aria-expanded":"false","aria-controls":fa,"aria-label":"Open chapter menu"},[As()]),i=m("ol",{class:"guidebook-chapter-list"});for(const h of t){const d=h.path===e?.path,c=m("a",{href:h.path,class:"guidebook-chapter-link",...d?{"aria-current":"page"}:{}},[m("span",{class:"guidebook-chapter-number"},[h.number]),m("span",{class:"guidebook-chapter-menu-title"},[h.title])]);i.append(m("li",{class:"guidebook-chapter-item"},[c]))}const o=m("div",{id:fa,class:"guidebook-chapter-panel",hidden:!0},[i]),r=m("nav",{class:"guidebook-chapter-nav","aria-label":"Book chapters"},[o,a]);_e=new AbortController;const{signal:s}=_e,l=(h=!1)=>{a.getAttribute("aria-expanded")==="true"&&(ba(r,a,o,!1),h&&a.focus())};return a.addEventListener("click",h=>{h.stopPropagation();const d=a.getAttribute("aria-expanded")!=="true";ba(r,a,o,d)},{signal:s}),document.addEventListener("keydown",h=>{h.key==="Escape"&&l(!0)},{signal:s}),document.addEventListener("pointerdown",h=>{const d=h.target;!(d instanceof Node)||r.contains(d)||l()},{signal:s}),r}function Es(n){return n==="chapter01"?"memory":n==="chapter02"?"notice":n==="chapter03"?"recognize":n==="chapter04"?"body":"orbit"}function Rs(n){const e=Ea(n);return e?Mi(e.title):"Psychical Excursion"}function Ms(n,e){Xn(),document.title=Rs(e),n.replaceChildren();const t=m("a",{class:"skip-link",href:"#main"},["Skip to content"]),a=Es(e),i=bs(a),o=Cs(),r=m("header",{class:"app-header guidebook-header"},[m("a",{href:We,class:"brand-link","aria-label":"Psychical Excursion home"},[m("img",{class:"brand-logo brand-logo-light",src:"/brand/pex-logo-primary.svg",alt:"",width:"220",height:"52",decoding:"async"}),m("img",{class:"brand-logo brand-logo-reverse",src:"/brand/pex-logo-primary-reverse.svg",alt:"",width:"220",height:"52",decoding:"async"})]),m("div",{class:"header-tools guidebook-tools"},[Ts(),m("span",{class:"guidebook-tools-rule","aria-hidden":"true"}),o])]),s=m("div",{id:"live-status",class:"visually-hidden","aria-live":"polite"}),l=m("main",{id:"main",class:"main-stage guidebook-main",tabindex:"-1","data-guidebook-page":e}),h=m("footer",{class:"site-footer guidebook-footer"},[m("p",{class:"attribution"},[Xo("Website by "),m("a",{href:"https://hoopsnakedesigns.com/",rel:"noreferrer"},["Hoopsnake Designs"])])]),d=m("div",{class:"app-frame guidebook-frame","data-ambient":a},e==="landing"?[r,s,l,h]:[r,s,l,h,Ss(e)]);return n.append(t,i,d),{main:l}}function Ds(n){ss(n)}function Cs(){const n=Qn()==="bedtime",e=m("button",{type:"button",id:"theme-light-dark",class:"theme-switch",role:"switch",dir:"ltr","aria-checked":n?"true":"false","aria-label":"Dark appearance"},[m("span",{class:"theme-switch-track","aria-hidden":"true",dir:"ltr"},[m("span",{class:"theme-switch-thumb"})])]);return e.addEventListener("click",()=>{const a=ci()==="bedtime";e.setAttribute("aria-checked",a?"true":"false")}),e}const $n=[];function ai(){for(;$n.length;)$n.pop()?.()}function Ns(){return typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}function Os(n){ai();const e=[...n.querySelectorAll(".pex-reveal")];if(e.length===0)return;if(Ns()||typeof IntersectionObserver!="function"){for(const a of e)a.classList.add("is-visible");return}e[0]?.classList.add("is-visible");const t=new IntersectionObserver(a=>{for(const i of a)i.isIntersecting&&(i.target.classList.add("is-visible"),t.unobserve(i.target))},{threshold:.08,rootMargin:"0px 0px -10% 0px"});for(const a of e)t.observe(a);$n.push(()=>t.disconnect())}const wa=[];function Ps(){for(;wa.length;)wa.pop()?.()}async function Ls(n){{if(Da())return;Zo(),ts(),Ps(),ai(),ti();const e=_o(),t=jo(),a=Go(e);a&&!t&&Sn(),Uo(e);const{main:i}=Ms(n,e),o={href:Be,title:"Introduction",id:"guidebook-prev-home"};if(e==="chapter01"?x(i,Ti(),{previous:o,next:{href:wt,title:bt,id:"guidebook-next-chapter-2"}}):e==="chapter02"?x(i,Oi(),{previous:{href:bi,title:Ia,id:"guidebook-prev-chapter-1"},next:{href:vt,title:Ln,id:"guidebook-next-chapter-3"}}):e==="chapter03"?x(i,Bi(),{previous:{href:wt,title:bt,id:"guidebook-prev-chapter-2"},next:{href:kt,title:Tt,id:"guidebook-next-chapter-4"}}):e==="chapter04"?x(i,Hi(),{previous:{href:vt,title:Ln,id:"guidebook-prev-chapter-3"},next:Le()?{href:ft,title:Pn,id:"guidebook-next-chapter-5"}:void 0}):e==="chapter05"&&Le()?x(i,xi(),{previous:{href:kt,title:Tt,id:"guidebook-prev-chapter-4"},next:{href:xt,title:It,id:"guidebook-next-chapter-6"}}):e==="chapter06"?x(i,ji(),{previous:{href:ft,title:Pn,id:"guidebook-prev-chapter-5"},next:{href:St,title:At,id:"guidebook-next-chapter-7"}}):e==="chapter07"?x(i,Ui(),{previous:{href:xt,title:It,id:"guidebook-prev-chapter-6"},next:{href:Rt,title:Et,id:"guidebook-next-chapter-8"}}):e==="chapter08"?x(i,Ki(),{previous:{href:St,title:At,id:"guidebook-prev-chapter-7"},next:{href:Dt,title:Mt,id:"guidebook-next-chapter-9"}}):e==="chapter09"?x(i,Xi(),{previous:{href:Rt,title:Et,id:"guidebook-prev-chapter-8"},next:{href:Nt,title:Ct,id:"guidebook-next-chapter-10"}}):e==="chapter10"?x(i,no(),{previous:{href:Dt,title:Mt,id:"guidebook-prev-chapter-9"},next:{href:Pt,title:Ot,id:"guidebook-next-chapter-11"}}):e==="chapter11"?x(i,io(),{previous:{href:Nt,title:Ct,id:"guidebook-prev-chapter-10"},next:{href:Wt,title:Lt,id:"guidebook-next-chapter-12"}}):e==="chapter12"?x(i,so(),{previous:{href:Pt,title:Ot,id:"guidebook-prev-chapter-11"},next:{href:Ft,title:Bt,id:"guidebook-next-chapter-13"}}):e==="chapter13"?x(i,co(),{previous:{href:Wt,title:Lt,id:"guidebook-prev-chapter-12"},next:{href:Ht,title:zt,id:"guidebook-next-chapter-14"}}):e==="chapter14"?x(i,po(),{previous:{href:Ft,title:Bt,id:"guidebook-prev-chapter-13"},next:{href:qt,title:Yt,id:"guidebook-next-chapter-15"}}):e==="chapter15"?x(i,fo(),{previous:{href:Ht,title:zt,id:"guidebook-prev-chapter-14"},next:{href:_t,title:jt,id:"guidebook-next-chapter-16"}}):e==="chapter16"?x(i,vo(),{previous:{href:qt,title:Yt,id:"guidebook-prev-chapter-15"},next:{href:Ut,title:Gt,id:"guidebook-next-chapter-17"}}):e==="chapter17"?x(i,Io(),{previous:{href:_t,title:jt,id:"guidebook-prev-chapter-16"},next:{href:Jt,title:Vt,id:"guidebook-next-chapter-18"}}):e==="chapter18"?x(i,So(),{previous:{href:Ut,title:Gt,id:"guidebook-prev-chapter-17"},next:{href:$t,title:Kt,id:"guidebook-next-chapter-19"}}):e==="chapter19"?x(i,Mo(),{previous:{href:Jt,title:Vt,id:"guidebook-prev-chapter-18"},next:{href:Xt,title:Qt,id:"guidebook-next-chapter-20"}}):e==="chapter20"?x(i,No(),{previous:{href:$t,title:Kt,id:"guidebook-prev-chapter-19"},next:{href:ea,title:Zt,id:"guidebook-next-chapter-21"}}):e==="chapter21"?x(i,Lo(),{previous:{href:Xt,title:Qt,id:"guidebook-prev-chapter-20"},next:{href:zo,title:Bo,id:"guidebook-next-chapter-22"}}):e==="chapter22"?x(i,Ho(),{previous:{href:ea,title:Zt,id:"guidebook-prev-chapter-21"}}):e==="landing"?gs(i):ls(i),Os(i),Ds(n),Ko(),t)Vo(n,t);else if(a){Sn();const r=navigator.userAgent??"";typeof requestAnimationFrame=="function"&&r.length>0&&!r.includes("jsdom")&&requestAnimationFrame(()=>Sn())}return}}function Ws(){const n=document.getElementById("app");if(!n)throw new Error("Missing #app");return n}async function Bs(){Xn(),li();const n=Ws(),e=()=>{Ls(n)};if(!Da()){window.addEventListener("popstate",e),window.addEventListener("hashchange",()=>{window.location.hash.startsWith("#/")&&e()}),e();try{await va.open(),await hi()}catch{}}}Bs();
