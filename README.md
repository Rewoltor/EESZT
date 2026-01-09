# EESZT Medical Data Tools

This project contains a suite of tools designed to interact with the Hungarian National eHealth Infrastructure (EESZT). It enables users to automate the downloading of medical documents and visualize their health data, such as blood test results.

## Project Structure

- **`extension/`**: A Chrome Extension that automates the downloading of medical PDF documents from the EESZT portal.
- **`Web App/`**: A React-based web application (built with Vite) for visualizing extracted medical data.
- **`Legacy/`**: Contains legacy scripts and data processing tools (Python scripts for PDF parsing, etc.).

## Getting Started

### 1. Chrome Extension
The extension automates the retrieval of patient documents.
- **Installation**:
  1. Open Chrome and navigate to `chrome://extensions`.
  2. Enable "Developer mode".
  3. Click "Load unpacked" and select the `extension/` directory.
- **Usage**:
  - Navigate to the EESZT patient portal.
  - The extension will assist in automating document downloads (see extension popup for details).

### 2. Web Application
The web app provides a dashboard for viewing health metrics.
- **Setup**:
  ```bash
  cd "Web App"
  npm install
  ```
- **Development**:
  ```bash
  npm run dev
  ```
- **Build**:
  ```bash
  npm run build
  ```

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
