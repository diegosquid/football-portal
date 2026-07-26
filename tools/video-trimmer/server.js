const express = require("express");
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3099;
const PROJECT_DIR = path.resolve(__dirname, "../..");
const TEMP_DIR = path.join(__dirname, "tmp");

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/tmp", express.static(TEMP_DIR));

// Serve videos from generated dir too
app.use("/generated", express.static(path.join(PROJECT_DIR, "generated")));

// Download YouTube video
app.post("/api/download", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  try {
    const id = `yt-${Date.now()}`;
    const outPath = path.join(TEMP_DIR, `${id}.mp4`);

    console.log(`Downloading: ${url}`);
    execSync(
      `yt-dlp -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" --merge-output-format mp4 -o "${outPath}" "${url}"`,
      { stdio: "inherit", timeout: 120000 }
    );

    if (!fs.existsSync(outPath)) {
      return res.status(500).json({ error: "Download failed" });
    }

    // Get duration
    const duration = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${outPath}"`
    )
      .toString()
      .trim();

    // Get dimensions
    const dims = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${outPath}"`
    )
      .toString()
      .trim();
    const [width, height] = dims.split(",").map(Number);

    console.log(`Downloaded: ${outPath} (${duration}s, ${width}x${height})`);
    res.json({
      id,
      path: outPath,
      url: `/tmp/${id}.mp4`,
      duration: parseFloat(duration),
      width,
      height,
    });
  } catch (err) {
    console.error("Download error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Load local video
app.post("/api/load-local", (req, res) => {
  const { filePath } = req.body;
  const resolved = path.resolve(PROJECT_DIR, filePath);

  if (!fs.existsSync(resolved)) {
    return res.status(404).json({ error: "File not found" });
  }

  const id = `local-${Date.now()}`;
  const destPath = path.join(TEMP_DIR, `${id}.mp4`);
  fs.copyFileSync(resolved, destPath);

  const duration = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${resolved}"`
  )
    .toString()
    .trim();

  const dims = execSync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${resolved}"`
  )
    .toString()
    .trim();
  const [width, height] = dims.split(",").map(Number);

  res.json({
    id,
    path: resolved,
    url: `/tmp/${id}.mp4`,
    duration: parseFloat(duration),
    width,
    height,
  });
});

// Trim + crop video
app.post("/api/trim", (req, res) => {
  const { sourceUrl, startTime, endTime, crop, slug, aspectRatio } = req.body;

  if (!sourceUrl) return res.status(400).json({ error: "sourceUrl required" });

  // Resolve source path
  let sourcePath;
  if (sourceUrl.startsWith("/tmp/")) {
    sourcePath = path.join(TEMP_DIR, path.basename(sourceUrl));
  } else {
    sourcePath = path.join(__dirname, "..", "..", sourceUrl.replace(/^\//, ""));
  }

  if (!fs.existsSync(sourcePath)) {
    return res.status(404).json({ error: "Source not found: " + sourcePath });
  }

  const outName = slug
    ? `${slug}-bg-video.mp4`
    : `trimmed-${Date.now()}.mp4`;
  const outPath = path.join(TEMP_DIR, outName);

  const filters = [];

  // Trim args
  const timeArgs = [];
  if (startTime != null) timeArgs.push("-ss", String(startTime));
  if (endTime != null) timeArgs.push("-to", String(endTime));

  // Crop filter: {x, y, w, h} are percentages (0-1)
  if (crop && crop.w && crop.h) {
    filters.push(
      `crop=iw*${crop.w}:ih*${crop.h}:iw*${crop.x}:ih*${crop.y}`
    );
  }

  // Scale based on aspect ratio
  const ratio = aspectRatio || 9/16;
  if (ratio <= 1) {
    // Vertical or square: scale width to 1080
    filters.push("scale=1080:-2");
  } else {
    // Horizontal (4:3, 16:9): scale to 1920 width
    filters.push("scale=1920:-2");
  }

  const filterStr = filters.join(",");
  const cmd = [
    "ffmpeg", "-y",
    ...timeArgs,
    "-i", sourcePath,
    "-vf", filterStr,
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-an", // no audio (bg video is muted)
    outPath,
  ];

  console.log("Running:", cmd.join(" "));

  try {
    execSync(cmd.join(" "), { stdio: "inherit", timeout: 120000 });

    const duration = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${outPath}"`
    )
      .toString()
      .trim();

    res.json({
      url: `/tmp/${outName}`,
      path: outPath,
      duration: parseFloat(duration),
      filename: outName,
    });
  } catch (err) {
    console.error("Trim error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Copy to project (save as bg-video for a slug)
app.post("/api/save", (req, res) => {
  const { trimmedUrl, slug } = req.body;
  if (!trimmedUrl || !slug) {
    return res.status(400).json({ error: "trimmedUrl and slug required" });
  }

  const sourcePath = path.join(TEMP_DIR, path.basename(trimmedUrl));
  if (!fs.existsSync(sourcePath)) {
    return res.status(404).json({ error: "Trimmed file not found" });
  }

  const destDir = path.join(
    PROJECT_DIR,
    "generated",
    "remotion-shorts",
    slug
  );
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  const destPath = path.join(destDir, "bg-video.mp4");
  fs.copyFileSync(sourcePath, destPath);

  // Also copy to remotion public assets
  const remotionAssetsDir = path.join(
    PROJECT_DIR,
    "video-studio",
    "public",
    "renders",
    slug
  );
  if (!fs.existsSync(remotionAssetsDir))
    fs.mkdirSync(remotionAssetsDir, { recursive: true });
  fs.copyFileSync(sourcePath, path.join(remotionAssetsDir, "bg-video.mp4"));

  console.log(`Saved bg-video to ${destPath}`);
  res.json({ path: destPath, remotionPath: `renders/${slug}/bg-video.mp4` });
});

// List recent articles for slug picker
app.get("/api/articles", (req, res) => {
  const articlesDir = path.join(PROJECT_DIR, "content", "articles");
  const files = fs
    .readdirSync(articlesDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const stat = fs.statSync(path.join(articlesDir, f));
      const content = fs.readFileSync(path.join(articlesDir, f), "utf8");
      const titleMatch = content.match(/^title:\s*"([^"]+)"/m);
      return {
        slug: f.replace(".mdx", ""),
        title: titleMatch ? titleMatch[1] : f,
        mtime: stat.mtimeMs,
      };
    })
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 20);

  res.json(files);
});

app.listen(PORT, () => {
  console.log(`\n  Video Trimmer running at http://localhost:${PORT}\n`);
});
