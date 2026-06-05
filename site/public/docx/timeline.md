# Timeline: Chronological Logbook

The **Timeline** acts as your micro-level productivity audit log. It maps every window focus switch and computer activity block sequentially throughout the day.

---

## Logbook Architecture

While the Dashboard aggregates metrics globally, the Timeline focuses on chronological resolution. It displays your day as a vertical flow of time-stamped cards:

```mermaid
timeline
    title Typical Daily Activity Flow
    09:00 : IDE opened (Work session begins)
    10:15 : Browser search (Researching docs)
    11:00 : Slack / Discord (Team check-in)
    12:30 : Media Player (Lunch break)
```

### Key Elements of a Timeline Entry
- **Time Anchors**: Displays the exact start and end times of each session down to the minute.
- **Application Iconry**: Automatically parses the executable to extract and render its system icon or show a category-based fallback.
- **Granular Window Metadata**: Displays the full window title (e.g., specific file name in VS Code or specific tab title in a web browser).
- **Duration Badge**: Shows the exact duration of the active window session.
- **Category Badge**: Color-coded labels matching your design system categories.

---

## Technical Features

### 1. Smart Session Merging
To prevent the timeline from being cluttered with hundreds of sub-second switches (e.g., when clicking through files or switching windows quickly), the Timeline store runs a **merging filter**:
- Switches shorter than **3 seconds** are categorized as transient noise and are automatically merged or omitted depending on your settings.
- If you switch away from an app and return to it within **10 seconds**, the tracking engine treats it as a single contiguous session.

### 2. Desktop Idle Detection
If keyboard and mouse inputs cease for more than **5 minutes** (customizable in settings):
- The active tracking loop is immediately suspended.
- A special "Idle / Away" block is inserted into the timeline.
- Once you return, tracking resumes seamlessly, protecting your database from recording false active hours.

---

## Data Privacy & Integrity

Because the timeline contains highly sensitive data (such as specific document titles or personal browser searches), it is stored exclusively in your local SQLite file. 

> [!CAUTION]
> Windows or document titles are never hashed or sent to a server. They remain fully legible to you on your machine, giving you complete audit control over your data.
