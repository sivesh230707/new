# Deployment & Release Guide for GitHub Installer

Follow these simple, step-by-step instructions to build the Windows installer, publish it as a GitHub Release, update your landing page, and host it for free on GitHub Pages.

---

## Step 1: Build the Windows Installer (.exe)

Run this single command in the project root:

```bash
npm run build:win
```

This compiles the React frontend, builds the Electron main process, and generates the installer in the `release/` folder:
* **Installer Path**: `release/GitHub-Installer-Setup.exe`

---

## Step 2: Upload to GitHub Releases

1. On GitHub, open your repository: `https://github.com/sivesh230707/new`
2. In the right sidebar, click **Releases** &rarr; **Draft a new release** (or go to `https://github.com/sivesh230707/new/releases/new`).
3. Fill in the release details:
   * **Tag version**: `v1.0.0` (click *Create new tag: v1.0.0 on publish*)
   * **Release title**: `GitHub Installer v1.0.0`
   * **Description**: A short summary (e.g., "Initial release of GitHub Installer for Windows").
4. In the **Attach binaries** section (drag and drop box), upload:
   * `release/GitHub-Installer-Setup.exe`
5. Click **Publish release**.

---

## Step 3: Replace `DOWNLOAD_URL` in the Landing Page

1. Open `landing/index.html`.
2. Locate line 316 near the top of the `<script>` tag:
   ```javascript
   const DOWNLOAD_URL = "https://github.com/sivesh230707/new/releases/latest/download/GitHub-Installer-Setup.exe";
   ```
3. If using your own repository name or username, update it to match your GitHub repository.
4. Save the file.

---

## Step 4: Publish the Landing Page on GitHub Pages

You can host the landing page completely free on GitHub Pages:

### Method A: Using the `landing/` folder in GitHub repository settings
1. Push your repository to GitHub (see Git steps below).
2. Go to your repository on GitHub &rarr; **Settings** &rarr; **Pages** (under "Code and automation").
3. Under **Build and deployment**:
   * **Source**: `Deploy from a branch`
   * **Branch**: Select `main` and choose the `/landing` or `/(root)` folder (if deploying from root, you can place `landing/index.html` at repository root or use a GitHub Actions Pages workflow).
4. Click **Save**. Within 1–2 minutes, your website will be live at:
   `https://sivesh230707.github.io/new/`

### Method B: Free Instant Hosting on Netlify (Drag & Drop)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop the `landing/` folder onto the page.
3. Your landing page is live instantly with an SSL certificate and custom domain support.
