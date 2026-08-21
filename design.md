# Together Daily — Mobile Interface Design

**Together Daily** is a private, two-person relationship journal designed for a couple to contribute to the same daily space from separate phones. The layout is optimized for portrait phones and one-handed use: primary actions are within the lower half of the screen, key entries are short and approachable, and deeper reflection lives behind deliberate taps rather than competing with the daily check-in.

> The app’s purpose is to make appreciation, practical coordination, private conversation, and shared memories feel like one calm daily ritual.

## Screen List and Primary Content

| Screen | Primary content | Main actions |
|---|---|---|
| Welcome and pairing | Privacy explanation, sign-in state, private invite code | Create a couple space, join a partner’s space |
| Today | Date, cover photo, shared relationship pulse, completion progress, daily question, fast actions | Change cover, log a mood, answer the question, add a note, open a feature |
| Daily Check-in | Mood, energy, personal highlight, gratitude, appreciation answer, personal love note | Save one partner’s contribution; reveal both answers when each person has responded |
| Shared Log | Shared highlight, timeline events, meal plan, water tracker, daily notes, pinned items | Add an event or note, update shared highlight, check water and meal items |
| Relationship | Mood frequency, check-in streak, connection tracker, mutual habits, anniversaries | Mark a habit, review trend, set or update a relationship goal |
| Messages | Private paired chat, gentle reactions, love poke, quick composer | Send a message, react, send a love poke; refreshes automatically while open |
| Love Notes | Current and saved notes, optional pin, sentiment color | Write a note, pin a favorite, react to a note |
| Intimacy | Consent-forward, private spicy prompts and private-for-two notes | Browse an opt-in prompt, save a boundary-aware note, dismiss a prompt |
| Questions | Daily appreciation question, deeper connection prompts, archived answers | Answer today’s prompt, select a deeper prompt, revisit shared answers |
| Memories | Photo grid, captions, dates, authors and cover image selection | Upload photos, add captions, select today’s cover image |
| To-dos | Shared and assigned items, reminders, completion status | Add, assign, complete, or carry a task forward |
| Settings | Couple display settings, anniversary, theme, notification preferences, data template/export | Update the shared identity, manage invite state, view the cleared template rules |

## Key User Flows

| Goal | Flow |
|---|---|
| Start a shared space | Partner one signs in → creates the couple space → copies the private invite code → partner two signs in and enters it → both land on Today. |
| Complete the daily ritual | Open Today → select a mood and energy → add a highlight and gratitude → answer the daily appreciation question → write an optional note → both contributions become visible when saved. |
| Share a memory | Open Memories → tap Add photo → choose from the device library → add a caption → save → choose it as the cover if desired. |
| Coordinate the day | Open To-dos or Shared Log → add a task, meal item, note, or timeline event → optionally assign it → partner sees the update after automatic refresh. |
| Have a private conversation | Open Messages → type in the composer → send → each participant sees new messages as the thread refreshes; Love Poke uses a distinct, lightweight message treatment. |
| Explore intimate connection safely | Open Intimacy → read an opt-in prompt or save a note → both people can remove their own entries; all language encourages mutual consent and comfort. |

## Data Model and Daily Behavior

The import structure establishes a strong base: settings, daily logs, messages, question library, habits, love notes, date ideas, and tracking data will be represented as reusable templates rather than seeded personal history. The exported cleaned template will preserve the schema while replacing personal names, dates, messages, entries, images, completion histories, and identifiers with neutral placeholders or empty collections.

| Data domain | Daily behavior |
|---|---|
| Daily log | A fresh log is created for the current local calendar date on first open; it starts from the template’s empty fields and selected daily question. |
| Daily question | The prompt selection rotates through the supplied question bank before repeating. Both people have separate answer fields. |
| Mood and energy | Each partner submits their own mood and energy rating. The shared frequency view aggregates saved check-ins by date. |
| Tasks | Incomplete daily tasks can be carried forward by an explicit user action; completed tasks remain on the original day. |
| Habits and water | Checkmarks are scoped to the day and create history for the frequency/streak view. |
| Photos and cover | Photo files are stored separately from log records. Any saved photo may be selected as a day’s cover. |
| Chat and notes | Messages and notes remain in chronological shared history; they are not wiped by the next-day rollover. |

## Privacy and Interaction Principles

The app will use authenticated accounts and a couple-space membership check so shared records are visible only to the paired partners. The first release will use automatic data refresh for conversation and collaborative updates, providing a responsive shared experience without exposing entries outside the couple space. Private, adult-oriented content will be clearly separated under an **Intimacy** area, remain optional, and use consent-forward language rather than assumptions.

## Color Choices

| Role | Color | Use |
|---|---|---|
| Night plum | `#281C32` | Primary text, deep header surfaces, intimate/private moments |
| Orchid | `#8D5BA6` | Main actions, active controls, partner-neutral accent |
| Rose | `#D56B88` | Appreciation moments, reactions, soft highlights |
| Blush | `#FDF3F6` | Primary screen background and gentle cards |
| Lavender mist | `#F1EAF7` | Secondary cards, selected states, trend charts |
| Sage | `#6F9277` | Completed tasks, steady connection, wellness states |
| Warm gold | `#D69A3E` | Streaks, special dates, positive milestone moments |
| Slate | `#665F6B` | Supporting text and inactive controls |

The visual direction is warm, editorial, and personal rather than overtly decorative. Large rounded cards, restrained shadows, readable type, deliberate empty space, and clear accessibility contrast should make the product feel close to a first-party iOS journal while retaining its unique shared relationship focus.
