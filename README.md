# Pixel Art Studio

A powerful, browser-based pixel art editor built with **React** and **Vite**. Create, paint, and explore pixel-level art with an intuitive interface, flexible tools, and responsive canvas layout.



## 🚀 Features

* **Dynamic Grid Canvas**
  A pixel grid that adapts to screen size, with scrollable overflow for high-resolution images.

* **Drawing Tools**
  Includes pen, eraser, fill, color picker, and customizable tools for pixel-perfect editing.

* **Real-Time Preview**
  Instant visual feedback thanks to React rendering and responsive layout.

* **Flexible Layout**
  Built with Tailwind CSS for modern styling, including rounded containers, shadow effects, and auto-resizing sections.

* **Tool Legend & Status Bar**
  Displays active tool and color, as well as pixel dimensions and canvas size stats.



## 🛠 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v16 or higher) or [Yarn](https://yarnpkg.com/)

### Installation & Running Locally

```bash
# Clone the repository
git clone https://github.com/siddhiipatell/Pixel-Art-Studio.git
cd Pixel-Art-Studio

# Install dependencies
npm install
# or
pnpm install
```

```bash
# Run the development server
npm run dev
# or
pnpm dev
```

Open your browser at `http://localhost:5173` (or whichever port Vite provides) to see it in action.

### Build for Production

```bash
npm run build
# or
pnpm build
```

This will generate optimized production files in the `dist` directory, ready for deployment.



## 🎨 Usage

Once the app is running, you'll see:

* A border-rounded section serving as the main canvas container.
* Canvas size information (e.g. `size × size • Xk pixels`).
* A legend displaying the current tool and color.
* A scrollable drawing area using `overflow-auto` and a height set with `calc(100vh - 220px)` for responsive design.
* A pixel grid where each cell reflects its own color and interactions through mouse/touch events.

Use your pointer to draw, erase, or fill cells. Pointer events (`onPointerDown`, `onPointerEnter`, `onPointerUp`, etc.) ensure smooth interaction across devices.



## ⚙️ Technologies

* **React** + **Vite** — Lightweight and fast development experience.
* **Tailwind CSS** — Utility-first styling for rapid UI building.
* **JavaScript / JSX** — Modern scripting and component logic.



## 🤝 Contributions

Contributions are welcome! Whether you want to refine tools, enhance performance, or add features like:

* Undo/Redo
* Image import/export (e.g., PNG)
* Animation support
* Customizable tool palettes
* Enhanced mobile support

...feel free to open issues or submit pull requests.



## 📜 License

© 2025 Siddhi Patel. All rights reserved.



## 📬 Contact

Built with care by [**Siddhi Patel**](https://github.com/siddhiipatell). Reach out via GitHub for bugs, features, or collaborations.
