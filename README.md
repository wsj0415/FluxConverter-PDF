# FluxConverter PDF ⚡

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?logo=tailwind-css)
![Gemini](https://img.shields.io/badge/AI-Gemini_Flash-8E75B2.svg)

**FluxConverter PDF** is a high-performance, cyber-industrial styled web application that converts PDF documents into high-quality images. It runs entirely in the browser using WebAssembly and Canvas, ensuring privacy and speed, enhanced by optional AI features for smart file organization.

![App Screenshot](https://via.placeholder.com/1200x600/050505/f59e0b?text=FluxConverter+Interface+Preview)

## ✨ Features

*   **Cyber-Industrial Aesthetics:** A unique, immersive interface offering both **Dark** and **Light** modes with motion effects and "glassmorphism" UI.
*   **Client-Side Processing:** All PDF rendering happens locally in your browser using `pdf.js`. No files are uploaded to a server for conversion.
*   **Granular Control:**
    *   Select specific pages to convert.
    *   Adjust output quality (compression).
    *   Set resolution density (1x up to 3x).
    *   Choose output format: JPEG, PNG, or WebP.
*   **Smart Selection:** Bulk select/deselect pages or pick individual pages visually from the grid.
*   **ZIP Archiving:** Automatically bundles converted images into a named ZIP file.
*   **AI Smart Renaming (Optional):** Uses Google Gemini 2.5 Flash to analyze the first page content and generate a concise, context-aware filename for your archive.

## 🛠️ Tech Stack

*   **Frontend:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS, Lucide React (Icons)
*   **PDF Engine:** PDF.js (v5.4+)
*   **AI Integration:** Google GenAI SDK (Gemini 2.5 Flash)
*   **Utilities:** JSZip, FileSaver

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/flux-converter-pdf.git
    cd flux-converter-pdf
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  (Optional) Set up your Google Gemini API Key for AI features:
    *   Create a `.env` file in the root directory.
    *   Add your key: `VITE_API_KEY=your_google_api_key_here`
    *   *Note: The app works perfectly without an API key; only the "Smart Rename" feature will be disabled.*

4.  Start the development server:
    ```bash
    npm run dev
    ```

## 🎨 Usage

1.  **Upload:** Drag and drop a PDF file into the "Flux Capacitor" drop zone.
2.  **Configure:** Adjust the format, quality, and density settings on the left panel.
3.  **Initiate:** Click "INITIATE SEQUENCE" to start rendering.
4.  **Select:** Click on generated thumbnails to select specific pages, or use the "Select All" button.
5.  **Smart Name (Optional):** Click the "Wand" icon to let AI generate a filename based on the document content.
6.  **Download:** Click the download button to receive your ZIP archive.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with high voltage and code.</sub>
</div>