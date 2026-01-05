# OmniConvert ⚡🌌

**Il Convertitore Multi-Formato Definitivo con Anima Cyberpunk.**

OmniConvert è un'applicazione desktop professionale ad alte prestazioni, progettata per la conversione fluida di file tra oltre 300 formati. Costruita con **Electron** e **Node.js**, combina una robusta potenza di elaborazione nativa (FFmpeg, Sharp, PDF-Lib) con un'interfaccia utente futuristica e mozzafiato.

![Screenshot OmniConvert](public/logo.png)

## ✨ Funzionalità Chiave

- **🎨 Supporto Formati Universale**:

  - **Immagini**: JPG, PNG, WEBP, AVIF, TIFF, HEIC, GIF, SVG, ICO...
  - **Video**: MP4, WEBM, MKV, AVI, MOV, 3GP, HEVC...
  - **Audio**: MP3, WAV, FLAC, OGG, AAC, M4A...
  - **Documenti**: Conversione PDF <-> DOCX, HTML, TXT.
  - **Archivi**: Crea archivi ZIP, TAR, GZ istantaneamente.

- **🚀 Alte Prestazioni**: Costruito su moduli Node.js nativi per la massima velocità. Nessun caricamento su cloud richiesto per la maggior parte delle operazioni: i tuoi file rimangono privati.

- **💎 Estetica Cyberpunk**: Un'interfaccia completamente personalizzata in stile "Hollow Neon", con sfumature mesh, tipografia Orbitron ed effetti glassmorphism.

- **🔒 Privacy First**: Funziona come un'app portatile offline.

- **📦 Portatile & Installer**: Disponibile come installazione standard di Windows (`.exe`) o come app Portatile zero-installazione.

## 🛠️ Costruito Con

- **Core**: [Node.js](https://nodejs.org/), [Electron](https://www.electronjs.org/)
- **Frontend**: HTML5, CSS3 (Variabili, Mesh Gradients), Vanilla JS
- **Motori di Elaborazione**:
  - `fluent-ffmpeg` & `ffmpeg-static` (Media)
  - `sharp` (Elaborazione Immagini ad Alta Velocità)
  - `pdf-lib` & `mammoth` (Documenti)
  - `archiver` (Compressione)

## 📥 Installazione

1.  Scarica l'ultima release dalla pagina [Releases](releases).
2.  Esegui `OmniConvert Setup.exe` per installare, oppure usa direttamente la versione Portable.

## 🔧 Sviluppo

```bash
# Clona la repository
git clone https://github.com/CosmoNetinfo/OmniConvert.git

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev

# Compila per Windows
npm run dist
```

---

_Creato con ❤️ da CosmoNet.info_
