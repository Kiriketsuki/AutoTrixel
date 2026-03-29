# TrKixel

A web-based triangle-pixel art engine that renders images using triangular pixels instead of traditional square pixels. Create and manipulate unique triangle-based pixel art through an interactive web interface.

![Screenshot of TrKixel](/src/assets/screenshot.png)

## 🎨 Features

-   **Triangle-Pixel Rendering**: Unique artistic effects using triangular grid patterns instead of square pixels
-   **Interactive Canvas**: Real-time drawing surface with pan, zoom, and color selection
-   **Image Processing**: Convert traditional images (PNG, JPG) to triangle-pixel format
-   **Background Tracing**: Import reference images and adjust their position/opacity to trace designs
-   **Detail Mode**: Subdivide individual trixels for finer details and intricate patterns
-   **Export & Save**: Output your art in various formats and resolutions

## 🚀 Technology Stack

-   **Framework**: Vue 3.5.21 with Composition API (`<script setup>` SFCs)
-   **Build Tool**: Vite 7.1.7
-   **Routing**: Vue Router 4.5.1
-   **Styling**: Tailwind CSS 4.1.13

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
/
├── src/
│   ├── components/       # Vue components for UI and canvas interaction
│   ├── logic/            # Core triangle-pixel rendering and generation logic
│   ├── assets/           # Static assets
│   ├── App.vue           # Root component
│   ├── main.js           # Application entry point
│   └── style.css         # Global styles
├── public/               # Static assets served directly
├── index.html            # HTML entry point
└── vite.config.js        # Vite configuration
```

## 🎯 Core Concepts

### 1. Triangle Pixels

The fundamental rendering unit - triangular shapes instead of square pixels that create unique artistic effects through triangular grid patterns.

### 2. Canvas System

Interactive drawing surface providing real-time rendering with mouse/touch interaction for drawing and editing triangle pixels.

### 3. Image Processing

Convert traditional images to triangle-pixel format by analyzing pixel data and mapping to a triangular grid.

### 4. Export/Save

Output triangle-pixel art in various formats with configurable resolution and triangle density.

## 🔧 Development

### Adding New Features

1. **Rendering Logic**: Add/update logic in `src/logic/createTrKixel.js`
2. **UI Components**: Create/update Vue components in `src/components/`
3. **Styling**: Use Tailwind utilities in component templates
4. **Testing**: Test across different browsers and devices

### Performance Optimization

-   Use Canvas API efficiently for triangle rendering
-   Optimize drawing loops to minimize redraws
-   Handle device pixel ratio for high-DPI displays
-   Implement `requestAnimationFrame` for smooth animations

## 📋 Coding Standards

-   Use Vue 3 Composition API with `<script setup>` syntax
-   Follow single-file component (SFC) structure
-   Apply Tailwind CSS utility classes for styling
-   Keep components focused and modular
-   Maintain consistent triangle geometry calculations

## 🌿 Branching & Versioning

### Branch Structure

-   **`main`**: Primary development branch (latest stable development code)
-   **`release`**: Production-ready code (deployed to production)

### Branch Naming

-   Feature branches: `feature/{feature_name}`
-   Bug fix branches: `bug/{bug_fix}`

### Versioning: `YY.MM.minor.patch`

-   **YY.MM**: Year and month (e.g., `25.11` for November 2025)
-   **minor**: Feature counter (increments with each feature)
-   **patch**: Bug fix counter (increments with each bug fix)

Example: `25.11.2.3` = November 2025, 2 features, 3 bug fixes

### Release Schedule

Whenever I feel like it.

## 🧪 Testing

-   Test rendering across different browsers (Chrome, Firefox, Safari, Edge)
-   Verify triangle geometry calculations
-   Test color processing and image conversion
-   Test on various devices and screen resolutions

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please follow the branching strategy and coding standards outlined above.

---

Built with ❤️ using Vue 3 and Vite
