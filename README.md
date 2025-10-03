# Cloning lukehoward.com into Static Files

This project uses a static snapshot of [lukehoward.com](https://www.lukehoward.com/) as the source of truth.
The site is mirrored with `wget` and committed to Git for deployment via Cloudflare Workers/Pages.

## Mirror with wget

Mirror the live site into flat files with:

```bash
wget --mirror --convert-links --adjust-extension --page-requisites --no-parent \
     --execute robots=off \
     --domains=lukehoward.com,www.lukehoward.com \
     --reject-regex '\?.*' \
     https://www.lukehoward.com/
```

This will create a folder called www.lukehoward.com/ in your working directory containing all HTML, CSS, JS, and images.

## Test Locally

After building the site:

```bash
# Build the static site
npm run build

# Serve the built site
npm run serve
# then open http://localhost:8007
```

## Home Page random Images

The original PHP site generates random images on each page load. To convert this to a static site:

1. **Collected all possible images** by making 200 requests to the live site:

```bash
# Script to collect random images from lukehoward.com
for i in {1..200}; do
    curl -s "https://www.lukehoward.com/" | \
    grep -A 2 "img-container" | \
    grep -o 'files/gimgs/[^'\'']*' >> collected_images.txt
done
sort collected_images.txt | uniq > unique_images.txt
```

2. **Downloaded all 132 unique images** to the local `files/gimgs/` folder:

```bash
while IFS= read -r image_path; do
    filename=$(basename "$image_path")
    curl -s "https://www.lukehoward.com/$image_path" -o "files/gimgs/$filename"
done < unique_images.txt
```

3. **Created JavaScript random selection** in `random-image.js`:

```javascript
const images = [
  "1_L1000535-Edit.jpg",
  "1_L1000682.jpg",
  // ... 132 total images
];

function getRandomImage() {
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
}

function setRandomImage() {
  const imgContainer = document.getElementById("img-container");
  if (imgContainer) {
    const img = imgContainer.querySelector("img");
    if (img) {
      const randomImage = getRandomImage();
      img.src = "files/gimgs/" + randomImage;
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  setRandomImage();
});
```

4. **Updated HTML** to include the JavaScript:

```html
<script src="random-image.js"></script>
```

Now each page load shows a different random image from the original PHP site's collection, but works entirely as a static site.

## Cloudflare Pages Deployment

This site is configured to deploy automatically to [Cloudflare Pages](https://developers.cloudflare.com/workers/) via Git push.

### Setup

1. **Install Wrangler CLI** (if not already installed):

```bash
npm install -g wrangler
```

2. **Login to Cloudflare**:

```bash
wrangler login
```

3. **Deploy to Cloudflare Pages**:

```bash
wrangler pages deploy
```

### Automatic Git Deployment

The site uses a simple macro replacement system for shared `<head>` content:

- **Template files**: HTML files contain `{{SHARED_HEAD}}` placeholder
- **Shared head file**: `shared_head.html` contains the actual head content (easily editable)
- **Build process**: `build.js` reads `shared_head.html` and replaces the placeholder with actual head content
- **Page-specific titles**: Each page gets its appropriate title from `pageConfigs`

### Editing Shared Head Content

To modify the shared head content (meta tags, CSS, analytics, etc.):

1. **Edit `shared_head.html`** - This file contains all the shared head content
2. **Run the build** - The changes will be applied to all pages
3. **Deploy** - Push to Git to deploy the changes

### Manual Build

To test the build process locally:

```bash
# Build the static site
npm run build

# Serve the built site (recommended - shows final result)
npm run serve
# Open http://localhost:8007

# OR serve from source (for development - shows templates)
npm run dev
# Open http://localhost:8000 (shows {{SHARED_HEAD}} placeholders)
```

### Git Integration

When you push to your connected Git repository, Cloudflare Pages will:

1. Run `node build.js` to process HTML files
2. Replace `{{SHARED_HEAD}}` with shared content
3. Deploy the static site globally via Cloudflare's CDN

This provides the simplest possible solution for shared head content without complex build tools or frameworks.
