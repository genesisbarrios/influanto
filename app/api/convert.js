// Next.js API routes must be inside /pages/api or /app/api (with App Router) and use the correct handler signature.
// For the App Router, use /app/api/convert/route.js and export POST as a named export.
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { nanoid } from 'nanoid';
import multer from 'multer';

const upload = multer({
  storage: multer.diskStorage({
    destination: '/tmp',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    },
  }),
});

// Helper to run ffmpeg
const convertAudio = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -y -i "${inputPath}" "${outputPath}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("FFmpeg error:", stderr);
        reject(error);
        return;
      }
      resolve();
    });
  });
};

// For Next.js App Router: use /app/api/convert/route.js and export POST
export async function POST(req) {
  return new Promise((resolve) => {
    upload.single('audioFile')(req, {}, async (err) => {
      if (err || !req.file) {
        resolve(
          new Response(JSON.stringify({ error: 'Error uploading file.' }), { status: 500 })
        );
        return;
      }

      const inputFilePath = req.file.path;
      const outputFileName = `converted_${nanoid()}.mp3`;
      const outputFilePath = `/tmp/${outputFileName}`;

      try {
        await convertAudio(inputFilePath, outputFilePath);
        const fileBuffer = await fs.readFile(outputFilePath);

        // Cleanup
        await fs.unlink(inputFilePath);
        await fs.unlink(outputFilePath);

        resolve(
          new Response(fileBuffer, {
            status: 200,
            headers: {
              'Content-Disposition': `attachment; filename="${outputFileName}"`,
              'Content-Type': 'audio/mpeg',
            },
          })
        );
      } catch (error) {
        console.error('Conversion error:', error);
        try { await fs.unlink(inputFilePath); } catch {}
        try { await fs.unlink(outputFilePath); } catch {}
        resolve(
          new Response(JSON.stringify({ error: 'Error converting audio.' }), { status: 500 })
        );
      }
    });
  });
}