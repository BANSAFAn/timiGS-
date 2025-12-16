# TimiGS - Intelligent Activity Tracker

![TimiGS Banner](https://via.placeholder.com/1200x400?text=TimiGS+Activity+Tracker)

**TimiGS** is a modern, privacy-focused PC activity tracking application built with **Tauri v2**, **Rust**, and **Vue 3**. It helps you understand how you spend your time on your computer by tracking active windows, generating detailed analytics, and visualizing your productivity trends.

> **Privacy First**: All data is stored locally on your machine in an SQLite database. No personal data is ever sent to the cloud unless you explicitly choose to sync it.

---

## 🚀 Key Features

*   **Real-time Tracking**: Automatically detects the active window and tracks the duration of usage.
*   **Detailed Dashboard**: View your daily summary, top used applications, and active sessions in real-time.
*   **Analytics & Charts**: Visualize your data with beautiful Donut, Pie, and Bar charts.
*   **Timeline View**: Browse your activity history day-by-day with granular session details.
*   **Privacy & Security**: Native SQLite database encryption support and 100% local operation.
*   **Cross-Platform Technology**: Built on the robust Tauri framework for high performance and low resource usage.
*   **Internationalization (i18n)**: Fully localized interface (currently supports English and Ukrainian).
*   **Dark & Light Modes**: Choose the theme that fits your workflow.

---

## 🛠️ Technology Stack

*   **Core**: [Tauri v2](https://v2.tauri.app/) (Rust)
*   **Frontend**: [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **State Management**: [Pinia](https://pinia.vuejs.org/)
*   **Database**: [SQLite](https://www.sqlite.org/) (via `rusqlite`)
*   **Visualizations**: [Chart.js](https://www.chartjs.org/) + [vue-chartjs](https://vue-chartjs.org/)
*   **Styling**: Custom CSS with Glassmorphism design system

---

## 💻 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js** (v18 or newer) - [Download](https://nodejs.org/)
2.  **Rust** (latest stable) - [Download](https://www.rust-lang.org/tools/install)
3.  **C++ Build Tools** (Visual Studio Build Tools for Windows) - Required for compiling Rust native modules.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/timigs.git
    cd timigs
    ```

2.  **Install frontend dependencies**:
    ```bash
    npm install
    ```

---

## 🏃‍♂️ How to Run

### Development Mode
To start the application in development mode with hot-reloading:

```bash
npm run tauri dev
```
*   This will start the Vite server at `http://localhost:1420`.
*   It will compile the Rust backend and launch the application window.

### Production Build
To build the optimized executable and installer for your operating system:

```bash
npm run tauri build
```
*   The output artifacts (installers) will be located in `src-tauri/target/release/bundle/`.

---

## 🌍 Localization (Adding a Translation)

TimiGS uses `vue-i18n` for localization. To add a new language (e.g., Spanish):

1.  **Create a Locale File**:
    *   Navigate to `src/locales/`.
    *   Create a new file named `es.json` (for Spanish).
    *   Copy the content from `en.json` and translate the values.

    ```json
    {
      "dashboard": {
        "title": "Panel de Control",
        ...
      }
    }
    ```

2.  **Register the Language**:
    *   Open `src/i18n.ts`.
    *   Import your new locale file.
    *   Add it to the `messages` object.

    ```typescript
    import es from './locales/es.json';

    const i18n = createI18n({
      // ...
      messages: {
        en,
        uk,
        es // Add this line
      }
    });
    ```

3.  **Update Settings UI**:
    *   Open `src/views/Settings.vue`.
    *   Add a new option to the language selector.

    ```html
    <select class="select" v-model="localSettings.language" @change="updateSettings">
      <option value="en">English</option>
      <option value="uk">Українська</option>
      <option value="es">Español</option> <!-- Add this line -->
    </select>
    ```

---

## 📂 Project Structure

```
timigs/
├── src/                    # Frontend (Vue 3)
│   ├── assets/            # Images and static assets
│   ├── components/        # Reusable UI components
│   ├── locales/           # Translation JSON files
│   ├── stores/            # Pinia state stores
│   ├── styles/            # Global CSS variables & themes
│   ├── views/             # Main application pages
│   ├── App.vue            # Root component
│   └── main.ts            # Entry point
│
├── src-tauri/              # Backend (Rust)
│   ├── src/
│   │   ├── commands.rs    # Tauri commands (Frontend <-> Backend)
│   │   ├── db.rs          # Database schema & queries
│   │   ├── tracker.rs     # Active window tracking logic
│   │   └── lib.rs         # Application entry & setup
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
│
└── package.json            # Node.js dependencies
```