# Protector Interaction — Product Design Brief

My Safety · 15 October 2026 · Final design direction; production implementation pending

## The idea

After completing their first task of the day, the user can send their elephant protector on a 30-minute journey. She returns with one affirmation. The app lets the user know she is back; tapping the elephant opens a conversation popup with her message.

The purpose is to encourage a useful daily step and provide a warm reason to return. Her message supports **you**: your steadiness, self-trust, and self-love. The elephant is a protector, and she uses the pronoun **she**.

## The experience, step by step

### 1. First task completed: invitation popup

Once the app successfully saves the user's first task completion that day, show an invitation in the existing **My list** experience.

Label: **Your first step today, done**

**A little journey for you**

“Your protector will bring back an affirmation to help you feel steady.”

Buttons: **Send your elephant** · **Later**

Timing note: **She’ll be back in 30 minutes.**

The invitation becomes available once per day, independent of the user's total task count. Later closes the popup and leaves the invitation available that day. The user can keep using the app.

### 2. Send her: journey popup

Tapping **Send your elephant** begins the journey and opens its confirmation popup.

**Your protector is on her way.**

“Receive an affirmation from your protector. Come back in 30 minutes.”

Countdown: **Back in 30:00**, decreasing from departure. Button: **Continue my day**.

The 30 minutes start at the moment she is sent. Show a small countdown in her area while she is away. Closing the popup, leaving the app, or refreshing does not restart the journey. The affirmation cannot open early.

### 3. She returns: reminder

After 30 minutes, restore the elephant to her usual place and show:

**Your elephant is back. She has something for you.**

Cue: **Tap your elephant**

Keep the affirmation hidden until the user taps her. The reminder appears inside the app. Users who enable supported notifications can also receive one return notification outside the app; opening it leads to the elephant on My list. Notification delivery still needs production integration.

The user does not need to return exactly on time. Her message is waiting when they next open the app.

### 4. Tap the elephant: affirmation conversation

Clicking or tapping the actual elephant opens a rounded conversation popup on the same screen, visually associated with her.

Label: **Your protector**

> You can build trust in yourself, one small choice at a time.

Button: **Close**

Show one short, prepared affirmation addressed to the user. No typing or reply is required. The message concerns self-trust, self-love, or feeling steady; it does not promise physical safety.

### 5. Close and continue

Close dismisses the conversation. Tapping the elephant again reopens that journey's same message.

Another day's first task completion can unlock another journey. There is no penalty for missing a day. An unread returned message remains available and is shown before another journey is offered, without building a backlog.

## Visual direction

Use a Finch-inspired rhythm: familiar companion, small daily ritual, anticipation, and a personal moment on return. Use My Safety's own existing lavender elephant, cream background, plum text, and sage buttons.

Keep the experience in **My list**, with existing navigation and tasks accessible after dismissing each popup. Use generous spacing, short copy, rounded boxes, and a clear main action. The affirmation should feel like a message from the elephant, using a speech-bubble treatment where space allows.

Reuse the existing elephant artwork. A brief CSS departure movement, return fade, and conversation opening are sufficient; animation is optional. Provide reduced-motion behavior, keyboard activation for the elephant, and accessible popup focus and closing controls.

## What needs to be built

1. **Interface:** invitation, journey, returned, and conversation states in the existing elephant area, following the four mockups.
2. **Daily trigger:** listen after a successful existing task completion and unlock once per user per day. Extra completions and repeated clicks must not create duplicate journeys.
3. **Saved journey:** retain the eligible day, departure time, return time, chosen affirmation, and read status per user. Keep the original return time across reopening and devices.
4. **Affirmations:** choose one message from a small prepared library when the journey starts and keep it fixed for that journey. Avoid recent repeats. AI generation is unnecessary.
5. **Return reminder:** derive the in-app state from the saved return time. Add optional notification scheduling and delivery for reminders outside the app. Avoid duplicate reminders or reminders after the message is read.

Store this feature's state separately from existing task data and provide an independent on/off switch. A journey or reminder failure must not prevent task completion or change task counts, progress, AI suggestions, confidence checks, or navigation.

## Keep it simple

The journey contains only an affirmation. It introduces no practical tasks, stories, resources, collections, favorites, points, streaks, milestones, or separate daily check-in.

Before release, verify the once-daily trigger, persistent 30-minute return time, no early message access, return reminder, tap-to-open conversation, Close and reopen behavior, and unchanged existing app behavior.

## Delivery status

The accompanying HTML files are the approved interactive design mockups. They are not connected to production accounts, task completion, persistent production storage, or push delivery. The supporting affirmation library is an editorial draft. Uploading this package does not integrate the feature into the production app.
