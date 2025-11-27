# PDF Chapter Splitter

<p align="center">
  <img src="public/image.png" alt="PDF Chapter Splitter Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Extract and split chapters from PDF documents with ease</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#keyboard-shortcuts">Keyboard Shortcuts</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## ✨ Features

- **🔒 100% Client-Side** - Your files never leave your device. All processing happens in your browser using WebAssembly and JavaScript.
- **📑 Smart Chapter Detection** - Automatically detects chapters from PDF bookmarks, table of contents, or text patterns.
- **🎯 Selective Extraction** - Choose specific chapters, sections, or page ranges to extract.
- **📦 Flexible Download Options**:
  - Download chapters as individual PDF files
  - Merge selected chapters into a single PDF with bookmarks
- **👁️ Live Preview** - Preview chapter pages before downloading with thumbnail generation.
- **⌨️ Keyboard Navigation** - Full keyboard support for power users.
- **🌳 Hierarchical Selection** - Select parent chapters to automatically include all sub-chapters.
- **📱 Responsive Design** - Works beautifully on desktop and mobile devices.

## 🎬 Demo

![PDF Chapter Splitter Screenshot](public/image2.png)

Try it live: [pdfchaptersplitter.com](https://pdfchaptersplitter.com)

## 🚀 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/r4z33n4l1/pdf-splitter-content.git
   cd pdf-splitter-content
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Copy the PDF.js worker to public folder**
   ```bash
   cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📖 Usage

1. **Upload a PDF** - Drag and drop or click to browse for a PDF file
2. **Browse Chapters** - The app automatically detects and displays the chapter structure
3. **Select Chapters** - Click to select individual chapters or parent chapters (which selects all children)
4. **Preview** - Click the eye icon or press `Enter` to preview any chapter
5. **Download** - Choose to download as individual files or merge into a single PDF

### View Modes

- **All Chapters** - Browse the complete chapter tree
- **Selected Only** - View only the chapters you've selected for download

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `↑` `↓` | Navigate through chapters |
| `Space` | Toggle chapter selection |
| `Enter` | Open chapter preview |
| `Esc` | Close preview modal |
| `←` `→` | Navigate in preview mode |
| `⌘/Ctrl + O` | Open file dialog |
| `⌘/Ctrl + A` | Select all chapters |
| `⌘/Ctrl + D` | Download individual files |
| `⌘/Ctrl + Shift + D` | Download merged PDF |

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **PDF Parsing**: [PDF.js](https://mozilla.github.io/pdf.js/) (Mozilla)
- **PDF Manipulation**: [pdf-lib](https://pdf-lib.js.org/)
- **Fonts**: [Crimson Pro](https://fonts.google.com/specimen/Crimson+Pro), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

## 📁 Project Structure

```
pdf-pro/
├── app/
│   ├── components/
│   │   └── PDFSplitter.tsx    # Main application component
│   ├── lib/
│   │   └── pdf-utils.ts       # PDF processing utilities
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout with metadata
│   └── page.tsx               # Home page
├── public/
│   ├── image.png              # Logo/favicon
│   ├── image2.png             # Open Graph image
│   ├── pdf.worker.min.mjs     # PDF.js worker
│   └── manifest.json          # PWA manifest
└── package.json
```

## 🔧 Configuration

### Environment Variables

No environment variables are required - everything runs client-side!

### Customization

- **Theme Colors**: Edit CSS variables in `app/globals.css`
- **Fonts**: Modify font imports in `app/layout.tsx`
- **Chapter Detection**: Adjust patterns in `app/lib/pdf-utils.ts`

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
5. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Add comments for complex logic
- Test with various PDF types (with/without bookmarks)
- Ensure keyboard accessibility

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Razeen Ali**

- Website: [razeenali.com](https://razeenali.com)
- GitHub: [@r4z33n4l1](https://github.com/r4z33n4l1)
- LinkedIn: [razeenali](https://linkedin.com/in/razeenali)

## 🙏 Acknowledgments

- [Mozilla PDF.js](https://mozilla.github.io/pdf.js/) for the excellent PDF parsing library
- [pdf-lib](https://pdf-lib.js.org/) for PDF manipulation capabilities
- The open source community for inspiration and tools

---

<p align="center">
  Made with ❤️ by <a href="https://razeenali.com">Razeen Ali</a>
</p>

<p align="center">
  <a href="https://github.com/r4z33n4l1/pdf-splitter-content/stargazers">⭐ Star this repo</a> if you find it useful!
</p>
