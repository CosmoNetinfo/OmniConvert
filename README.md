# OmniConvert

OmniConvert is a powerful, high-fidelity file conversion application designed with a premium aesthetic and ease of use in mind. It supports conversion between various formats including images, audio, and video.

## Features

- **Multi-Format Support**: Convert Images, Audio, and Video files.
- **Drag & Drop Interface**: Simple and intuitive file upload.
- **Premium Design**: sleek, glassmorphism-inspired UI.
- **Real-time Progress**: Visual feedback during file processing.

## Supported Formats

- **Images**: PNG, JPG, WEBP, GIF, TIFF, AVIF, HEIC
- **Audio**: MP3, WAV, OGG, FLAC, AAC, M4A
- **Video**: MP4, WEBM, AVI, MKV, MOV, FLV, WMV

## Prerequisites

- **Node.js**: Ensure Node.js is installed.
- **FFmpeg**: Required for Audio and Video conversion.
  - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html), extract, and add the `bin` folder to your System PATH environment variable.
  - **Mac**: `brew install ffmpeg`
  - **Linux**: `sudo apt install ffmpeg`

## Setup & Running

1.  **Install Dependencies**:

    ```bash
    npm install
    ```

2.  **Start the Server**:

    ```bash
    npm start
    ```

    Or for development with auto-restart:

    ```bash
    npm run dev
    ```

3.  **Access the App**:
    Open your browser and navigate to `http://localhost:3000`.

## Project Structure

- `public/`: Frontend files (HTML, CSS, JS).
- `server/`: Backend Logic (Node.js/Express).
- `uploads/`: Temporary storage for uploaded files.
- `converted/`: Storage for converted output files.
