#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Read shared head content from external file
let sharedHead;
try {
  sharedHead = fs.readFileSync("shared_head.html", "utf8");
} catch (error) {
  console.error("Error reading shared_head.html:", error.message);
  process.exit(1);
}

// Page-specific configurations
const pageConfigs = {
  "index.html": { title: "Main : Luke Howard" },
  "about/index.html": { title: "About : Luke Howard" },
  "diary/index.html": { title: "Diary : Luke Howard" },
  "discography/index.html": { title: "Discography : Luke Howard" },
  "books/28-transcriptions/index.html": {
    title: "28 transcriptions : Luke Howard",
  },
  "links/index.html": { title: "Links : Luke Howard" },
  "contact/index.html": { title: "Contact : Luke Howard" },
  "music/solo/index.html": { title: "Solo : Luke Howard" },
  "music/duo/index.html": { title: "Duo : Luke Howard" },
  "music/trio/index.html": { title: "Trio : Luke Howard" },
  "music/remixed/index.html": { title: "Remixed : Luke Howard" },
};

function processHtmlFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(process.cwd(), filePath);
  const config = pageConfigs[relativePath] || { title: "Luke Howard" };

  // Replace {{SHARED_HEAD}} placeholder with actual shared head content
  const processedContent = content.replace(
    "{{SHARED_HEAD}}",
    sharedHead.replace("{{TITLE}}", config.title)
  );

  // Create output path in dist directory
  const outputPath = path.join("dist", relativePath);
  const outputDir = path.dirname(outputPath);

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Write the processed content to dist directory
  fs.writeFileSync(outputPath, processedContent);
  console.log(`Processed: ${relativePath} → ${outputPath}`);
}

function findHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (item.endsWith(".html") && item !== "shared_head.html") {
      files.push(fullPath);
    }
  }

  return files;
}

function copyStaticFiles() {
  console.log("Copying static files to dist...");

  // Copy all files except HTML, JS, JSON, TOML, MD files
  const items = fs.readdirSync(".");

  for (const item of items) {
    const fullPath = path.join(".", item);
    const stat = fs.statSync(fullPath);

    if (
      stat.isDirectory() &&
      item !== "dist" &&
      item !== "about" &&
      item !== "books" &&
      item !== "contact" &&
      item !== "diary" &&
      item !== "discography" &&
      item !== "links" &&
      item !== "music"
    ) {
      // Copy entire directories (like files/, etc.) but exclude HTML directories
      copyDirectory(fullPath, path.join("dist", item));
    } else if (
      stat.isFile() &&
      !item.match(/\.(html|json|toml|md)$/) &&
      !item.startsWith(".") &&
      item !== "build.js" &&
      item !== "shared_head.html"
    ) {
      // Copy individual files (like favicon.ico, random-image.js, _headers, etc.) but exclude HTML files (they're processed separately), hidden files, config files, build scripts, and template files
      fs.copyFileSync(fullPath, path.join("dist", item));
      console.log(`Copied: ${item}`);
    }
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Main build process
console.log("Building static site with shared head content...");

// Clean dist directory
if (fs.existsSync("dist")) {
  fs.rmSync("dist", { recursive: true });
}

// Process HTML files
const htmlFiles = findHtmlFiles(".");
htmlFiles.forEach(processHtmlFile);

// Copy static files
copyStaticFiles();

console.log(`Processed ${htmlFiles.length} HTML files`);
console.log("Build complete!");
