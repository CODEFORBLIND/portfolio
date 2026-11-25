
# Neural Cellular Automata Portfolio

An interactive developer portfolio built with **Next.js**, **TypeScript**, and **Tailwind CSS**, featuring a scroll-driven **Neural Cellular Automata (NCA)** background powered by **ONNX Runtime Web**.

## Overview

- **Scroll-Linked NCA Tree:** Growing and rewinding a 64×64, 16-channel cellular automata network (`node_tree_thick.onnx`) in sync with page scroll depth.
- **Interactive Regeneration:** Dragging across the canvas perturbs cells in the network, triggering self-healing inference steps to reconstruct the structure.
- **Career & Project Timeline:** Showcases education, experience, leadership, and AI/ML & agentic projects with GitHub links and active-card focus.
- **Contact Node:** Includes one-click email copying, profile links, and resume download support.

## Project Structure

```
nca-project/
├── training/          # NCA model training experiments & assets
└── ui/                # Next.js portfolio application
    ├── app/
    │   ├── components/
    │   │   └── CanvasNCA.tsx
    │   └── page.tsx
    └── public/
        ├── models/    # ONNX model weights (e.g., node_tree_thick.onnx)
        └── ort/       # ONNX Runtime Web WASM assets

```

## Getting Started

1. Navigate to the `ui` directory and install dependencies:
```bash
cd ui
npm install

```


2. Run the development server:
```bash
npm run dev

```


3. Open [http://localhost:3000](http://localhost:3000) in your browser.

*(Note: Place your resume PDF in `ui/public/` with the filename referenced in `ContactNode` if using the download button.)*

## Tech Stack

* **Framework:** Next.js, React, TypeScript
* **Styling & Motion:** Tailwind CSS, Framer Motion
* **Inference:** ONNX Runtime Web (WASM)

```

To add it to your repository from `~/nca-project`:

```bash
cat << 'EOF' > README.md
# Neural Cellular Automata Portfolio

An interactive developer portfolio built with **Next.js**, **TypeScript**, and **Tailwind CSS**, featuring a scroll-driven **Neural Cellular Automata (NCA)** background powered by **ONNX Runtime Web**.

## Overview

- **Scroll-Linked NCA Tree:** Growing and rewinding a 64×64, 16-channel cellular automata network (`node_tree_thick.onnx`) in sync with page scroll depth.
- **Interactive Regeneration:** Dragging across the canvas perturbs cells in the network, triggering self-healing inference steps to reconstruct the structure.
- **Career & Project Timeline:** Showcases education, experience, leadership, and AI/ML & agentic projects with GitHub links and active-card focus.
- **Contact Node:** Includes one-click email copying, profile links, and resume download support.

## Project Structure

```text
nca-project/
├── training/          # NCA model training experiments & assets
└── ui/                # Next.js portfolio application
    ├── app/
    │   ├── components/
    │   │   └── CanvasNCA.tsx
    │   └── page.tsx
    └── public/
        ├── models/    # ONNX model weights (e.g., node_tree_thick.onnx)
        └── ort/       # ONNX Runtime Web WASM assets

```

## Getting Started

1. Navigate to the `ui` directory and install dependencies:
```bash
cd ui
npm install

```


2. Run the development server:
```bash
npm run dev

```


3. Open [http://localhost:3000](http://localhost:3000) in your browser.

*(Note: Place your resume PDF in `ui/public/` with the filename referenced in `ContactNode` if using the download button.)*

## Tech Stack

* **Framework:** Next.js, React, TypeScript
* **Styling & Motion:** Tailwind CSS, Framer Motion
* **Inference:** ONNX Runtime Web (WASM)
EOF
git add README.md
git commit -m "Add project README"
git push origin main

```
