# EESZT Document Downloader Extension

This Chrome Extension works in tandem with the EESZT portal to facilitate the bulk downloading of medical records.

## Installation

1.  **Build/Prepare**: No build step is required as this is a vanilla JS extension.
2.  **Load in Chrome**:
    *   Open Chrome and go to `chrome://extensions/`.
    *   Toggle **Developer mode** on (top right).
    *   Click **Load unpacked**.
    *   Select this `extension/` directory.

## Features

-   **Popup Interface**: Provides controls to start/configure downloads.
-   **Content Script**: Interacts with the EESZT DOM to trigger downloads.
-   **Background Service**: Manages download states and prevents popup blocking issues.
