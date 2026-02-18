# Chinese Dialect Atlas (方音圖鑑)

> Professional Chinese dialect linguistics analysis and geographic visualization platform

[![Vue 3](https://img.shields.io/badge/Vue-3.5.20-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.3-646CFF?logo=vite)](https://vitejs.dev/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre%20GL-5.16-396CB2)](https://maplibre.org/)

**Live Demo:** [https://dialects.yzup.top](https://dialects.yzup.top)

**Documentation Language:** English | [中文](../README.md)

---

## Overview

The Chinese Dialect Atlas is a comprehensive web platform for exploring and analyzing Chinese dialect phonology. It combines powerful phonological query capabilities with interactive geographic visualization and advanced audio analysis tools.

**For detailed information, please refer to:**

- **[Architecture Documentation](./ARCHITECTURE.en.md)** - Technical architecture and system design
- **[API Reference](./API.en.md)** - Complete API documentation
- **[User Guide](./USER_GUIDE.en.md)** - How to use the platform
- **[Design System](./DESIGN_SYSTEM.en.md)** - Visual design guidelines
- **[Contributing Guide](./CONTRIBUTING.en.md)** - How to contribute

---

## Quick Start

```bash
# Clone repository
git clone <repository-url>

# Install dependencies
cd project
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Key Features

- 📝 **Phonological Query System** - 4 query modes (character, Middle Chinese, phoneme, tone)
- 🗺️ **Geographic Visualization** - Interactive maps with 10,000+ marker support
- 📊 **Phonology Matrix Analysis** - Complete sound system visualization
- 🎙️ **Praat Audio Analysis** - Professional acoustic analysis integration
- 🛠️ **Data Management Tools** - Character table validation, merging, conversion

---

## Technology Stack

- **Frontend:** Vue 3.5.20, Vite 7.1.3, Vue Router 4
- **Visualization:** MapLibre GL 5.16, ECharts 5.6, wavesurfer.js 7.12
- **State Management:** Custom reactive stores (no Vuex/Pinia)
- **Backend API:** JWT-based authentication, 27 API modules

---

## Documentation

### English Documentation
- [Architecture](./ARCHITECTURE.en.md)
- [API Reference](./API.en.md)
- [User Guide](./USER_GUIDE.en.md)
- [Design System](./DESIGN_SYSTEM.en.md)
- [Contributing](./CONTRIBUTING.en.md)

### 中文文檔
- [主 README](../README.md)
- [架構文檔](./ARCHITECTURE.md)
- [API 文檔](./API.md)
- [用戶指南](./USER_GUIDE.md)
- [設計系統](./DESIGN_SYSTEM.md)
- [貢獻指南](./CONTRIBUTING.md)

---

## License

ISC License

---

**Made with ❤️ for Chinese dialect research**