const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const { PDFDocument } = require('pdf-lib');
const mammoth = require("mammoth");

// Use static ffmpeg binary for portability
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/converted", express.static(path.join(__dirname, "..", "converted")));

// Setup Directories
const uploadDir = path.join(__dirname, "..", "uploads");
const convertedDir = path.join(__dirname, "..", "converted");
[uploadDir, convertedDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
});
const upload = multer({ storage: storage });

// --- FORMAT DEFINITIONS & HELPERS ---
const IMAGE_FORMATS = new Set(["3fr","arw","avif","bmp","cr2","crw","cur","dcm","dcr","dds","dng","erf","exr","fax","fts","g3","g4","gif","gv","hdr","heic","heif","hrz","ico","iiq","ipl","jbg","jbig","jfi","jfif","jif","jnx","jp2","jpe","jpeg","jpg","jps","k25","kdc","mac","map","mef","mng","mrw","mtv","nef","nrw","orf","otb","pal","palm","pam","pbm","pcd","pct","pcx","pdb","pef","pes","pfm","pgm","pgx","picon","pict","pix","plasma","png","pnm","ppm","psd","pwp","raf","ras","rgb","rgba","rgbo","rgf","rla","rle","rw2","sct","sfw","sgi","six","sixel","sr2","srf","sun","svg","tga","tiff","tim","tm2","uyvy","viff","vips","wbmp","webp","wmz","wpg","x3f","xbm","xc","xcf","xpm","xv","xwd","yuv"]);
const VIDEO_FORMATS = new Set(["3g2","3gp","aaf","asf","av1","avchd","avi","cavs","divx","dv","f4v","flv","hevc","m2ts","m2v","m4v","mjpeg","mkv","mod","mov","mp4","mpeg","mpeg-2","mpg","mts","mxf","ogv","rm","rmvb","swf","tod","ts","vob","webm","wmv","wtv","xvid"]);
const AUDIO_FORMATS = new Set(["8svx","aac","ac3","aiff","amb","amr","ape","au","avr","caf","cdda","cvs","cvsd","cvu","dss","dts","dvms","fap","flac","fssd","gsm","gsrt","hcom","htk","ima","ircam","m4a","m4r","maud","mp2","mp3","nist","oga","ogg","opus","paf","prc","pvf","ra","sd2","shn","sln","smp","snd","sndr","sndt","sou","sph","spx","tak","tta","txw","vms","voc","vox","vqf","w64","wav","wma","wv","wve","xa"]);
const DOC_FORMATS = new Set(["abw","aw","csv","dbk","djvu","doc","docm","docx","dot","dotm","dotx","html","kwd","odt","oxps","pdf","rtf","sxw","txt","wps","xls","xlsx","xps"]);

function getCategory(ext) {
  if (IMAGE_FORMATS.has(ext)) return 'image';
  if (VIDEO_FORMATS.has(ext)) return 'video';
  if (AUDIO_FORMATS.has(ext)) return 'audio';
  if (DOC_FORMATS.has(ext)) return 'document';
  return 'unknown';
}

app.post("/api/convert", upload.single("file"), async (req, res) => {
  const file = req.file;
  
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const targetFormat = req.body.targetFormat.toLowerCase();
  const inputPath = file.path;
  
  let outputBaseName = path.parse(file.originalname).name;
  // Sanitize default name to be safe for URLs/FS but keep it recognizable
  outputBaseName = outputBaseName.replace(/[^a-z0-9\-_ ]/gi, '_');

  if (req.body.customName) {
      // Sanitize custom name
      outputBaseName = req.body.customName.replace(/[^a-z0-9\-_]/gi, '_');
  }
  
  const outputFilename = `${outputBaseName}.${targetFormat}`;
  const outputPath = path.join(convertedDir, outputFilename);
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  const category = getCategory(targetFormat);

  console.log(`[Job] Converting ${file.originalname} (${ext}) -> ${targetFormat} [${category}]`);

  try {
    // --------------------------------------------------------------------------------
    // 1. IMAGES
    // --------------------------------------------------------------------------------
    if (category === 'image') {
       const sharpFormats = ['jpg','jpeg','png','webp','gif','tiff','avif','heic'];
       if (sharpFormats.includes(targetFormat)) {
         try {
            await sharp(inputPath).toFormat(targetFormat === 'jpg' ? 'jpeg' : targetFormat).toFile(outputPath);
            return sendSuccess(res, outputFilename);
         } catch (e) { console.log("Sharp failed, falling back..."); }
       }
       convertWithFFmpeg(inputPath, targetFormat, outputPath, res, outputFilename);
       return;
    }

    // --------------------------------------------------------------------------------
    // 2. VIDEO & AUDIO
    // --------------------------------------------------------------------------------
    if (category === 'video' || category === 'audio') {
       convertWithFFmpeg(inputPath, targetFormat, outputPath, res, outputFilename);
       return;
    }

    // --------------------------------------------------------------------------------
    // 3. DOCUMENTS
    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    // 3. DOCUMENTS
    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    // 3. DOCUMENTS
    // --------------------------------------------------------------------------------
    if (category === 'document') {
        const fs = require('fs');
        
        // --- CASE: Image -> PDF ---
        if (targetFormat === 'pdf' && IMAGE_FORMATS.has(ext)) {
            try {
                const pdfDoc = await PDFDocument.create();
                const imageBytes = fs.readFileSync(inputPath);
                let image;
                if (ext === 'png') image = await pdfDoc.embedPng(imageBytes);
                else if (ext === 'jpg' || ext === 'jpeg') image = await pdfDoc.embedJpg(imageBytes);
                else {
                    const pngBuffer = await sharp(inputPath).png().toBuffer();
                    image = await pdfDoc.embedPng(pngBuffer);
                }
                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
                const pdfBytes = await pdfDoc.save();
                fs.writeFileSync(outputPath, pdfBytes);
                return sendSuccess(res, outputFilename);
            } catch (err) { return res.status(500).json({ error: "Image to PDF failed." }); }
        }

        // --- CASE: PDF -> DOCX (Text Extraction "Best Effort") ---
        if (ext === 'pdf' && (targetFormat === 'docx' || targetFormat === 'doc')) {
             try {
                 const pdfParse = require('pdf-parse');
                 const { Document, Packer, Paragraph, TextRun } = require('docx');
                 
                 const dataBuffer = fs.readFileSync(inputPath);
                 const pdfData = await pdfParse(dataBuffer);
                 
                 const lines = pdfData.text.split('\n');
                 const children = lines.map(line => 
                     new Paragraph({ children: [new TextRun(line)] })
                 );
                 
                 const doc = new Document({ sections: [{ properties: {}, children: children }] });
                 const buffer = await Packer.toBuffer(doc);
                 
                 const finalFilename = outputFilename.replace('.doc', '.docx');
                 const finalPath = path.join(convertedDir, finalFilename);
                 
                 fs.writeFileSync(finalPath, buffer);
                 return sendSuccess(res, finalFilename);
             } catch (err) { 
                 console.error("PDF-DOCX Error:", err);
                 return res.status(500).json({ error: "PDF to DOCX conversion failed: " + err.message }); 
             }
        }

        // --- CASE: DOCX -> PDF (via HTML) ---
        if (ext === 'docx' && targetFormat === 'pdf') {
            try {
                const result = await mammoth.convertToHtml({ path: inputPath });
                const pdf = require('html-pdf');
                return new Promise((resolve, reject) => {
                    pdf.create(result.value).toFile(outputPath, function(err, res2) {
                        if (err) return res.status(500).json({ error: "PDF engine failed." });
                        sendSuccess(res, outputFilename);
                        resolve();
                    });
                });
            } catch (err) { return res.status(500).json({ error: "DOCX to PDF failed." }); }
        }
        
        // --- CASE: DOCX -> HTML/TXT ---
        if (ext === 'docx') {
            try {
                if (targetFormat === 'html') {
                    const result = await mammoth.convertToHtml({ path: inputPath });
                    fs.writeFileSync(outputPath, result.value);
                    return sendSuccess(res, outputFilename);
                }
                if (targetFormat === 'txt') {
                    const result = await mammoth.extractRawText({ path: inputPath });
                    fs.writeFileSync(outputPath, result.value);
                    return sendSuccess(res, outputFilename);
                }
            } catch(e) { return res.status(500).json({ error: "DOCX parsing failed." }); }
        }

        // --- CASE: PDF -> TXT ---
        if (ext === 'pdf' && targetFormat === 'txt') {
             try {
                 const pdfParse = require('pdf-parse');
                 const dataBuffer = fs.readFileSync(inputPath);
                 const pdfData = await pdfParse(dataBuffer);
                 fs.writeFileSync(outputPath, pdfData.text);
                 return sendSuccess(res, outputFilename);
             } catch(err) { return res.status(500).json({ error: "PDF to Text failed." }); }
        }

        res.status(400).json({ error: "Conversion not supported in portable mode." });
        return;
    }

    // --------------------------------------------------------------------------------
    // 4. ARCHIVES
    // --------------------------------------------------------------------------------
    if (category === 'archive') {
         const archiver = require('archiver');
         const fs = require('fs');

         // Simple Case: Any File -> ZIP/TAR
         // We wrap the input file into an archive
         const output = fs.createWriteStream(outputPath);
         
         let archive;
         if (targetFormat === 'zip') archive = archiver('zip', { zlib: { level: 9 } });
         else if (targetFormat === 'tar') archive = archiver('tar');
         else if (targetFormat === 'tar.gz' || targetFormat === 'tgz') archive = archiver('tar', { gzip: true });
         else {
             return res.status(400).json({ error: "Only ZIP, TAR and TGZ outputs supported currently." });
         }

         output.on('close', function() {
             sendSuccess(res, outputFilename);
         });

         archive.on('error', function(err) {
             res.status(500).json({ error: err.message });
         });

         archive.pipe(output);
         archive.file(inputPath, { name: file.originalname });
         archive.finalize();
         return;
    }

    res.status(400).json({ error: "Format pair not fully supported in this version." });

  } catch (error) {
    console.error("Critical Error:", error);
    res.status(500).json({ error: "Server conversion error: " + error.message });
  }
});

function convertWithFFmpeg(input, format, output, res, filename) {
  ffmpeg(input)
    .toFormat(format)
    .on("end", () => sendSuccess(res, filename))
    .on("error", (err) => {
      console.error("FFmpeg Error:", err);
      res.status(500).json({ error: "Conversion failed: " + err.message });
    })
    .save(output);
}

function sendSuccess(res, filename) {
  res.json({
    success: true,
    downloadUrl: `/converted/${filename}`,
    filename: filename,
  });
}

// Cleanup routine (optional, runs every hour)
setInterval(() => {
    // Delete files older than 1 hour in uploads/converted
}, 3600000);

app.listen(port, () => {
  console.log(`OmniConvert server running at http://localhost:${port}`);
});
