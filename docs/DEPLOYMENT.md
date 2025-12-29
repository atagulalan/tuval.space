# Deployment Guide for tuval.space

This guide will walk you through deploying tuval.space to GitHub Pages with Firebase backend.

## Prerequisites

- Node.js 18+ installed
- A Firebase account
- A GitHub account
- Git installed

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `tuval-space` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Google**
3. Toggle "Enable"
4. Set a support email
5. Click "Save"
6. Go to **Settings** > **Authorized domains**
7. Add your GitHub Pages domain: `yourusername.github.io`

### 1.3 Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in production mode"
4. Select a location (choose one close to your target users)
5. Click "Enable"

### 1.4 Deploy Security Rules

You have two options to deploy the security rules:

**Option A: Using Firebase CLI**

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

**Option B: Manual Upload**

1. In Firebase Console, go to **Firestore Database** > **Rules**
2. Copy the contents of `firestore.rules`
3. Paste into the rules editor
4. Click "Publish"

### 1.5 Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (`</>`)
4. Register your app with a nickname
5. Copy the Firebase configuration values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

## Step 2: Local Development Setup

### 2.1 Clone and Install

```bash
# Clone your repository
git clone https://github.com/yourusername/tuval.space.git
cd tuval.space

# Install dependencies
npm install

# Initialize git hooks
npm run prepare
```

### 2.2 Configure Environment Variables

1. Create `.env` file in the root directory:

```bash
cp .env.example .env
```

2. Edit `.env` and fill in your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Customize app configuration
VITE_DEFAULT_PIXEL_QUOTA=100
VITE_MAX_PIXEL_ACCUMULATION=3
VITE_MAX_BOARDS_PER_USER=10
VITE_MAX_BOARD_PIXELS=400000
VITE_CHANGE_MERGE_WINDOW_HOURS=8
```

### 2.3 Test Locally

```bash
# Start development server
npm run dev

# The app should open at http://localhost:5173
```

## Step 3: GitHub Repository Setup

### 3.1 Update vite.config.ts

Update the `base` path in `vite.config.ts` to match your repository name:

```typescript
export default defineConfig({
  base: '/tuval.space/', // Change to '/your-repo-name/'
  // ... rest of config
});
```

Also update `basename` in `src/App.tsx`:

```typescript
<Router basename="/tuval.space"> {/* Change to '/your-repo-name/' */}
```

### 3.2 Push to GitHub

```bash
# Create repository on GitHub first, then:
git init
git add .
git commit -m "feat: initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/tuval.space.git
git push -u origin main
```

## Step 4: GitHub Pages Setup

### 4.1 Configure Repository Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click "New repository secret"
4. Add each Firebase configuration value as a secret:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### 4.2 Enable GitHub Pages

1. Go to **Settings** > **Pages**
2. Under "Source", select "GitHub Actions"
3. GitHub Actions workflow will automatically deploy on push to main

### 4.3 Trigger Deployment

Push any commit to the main branch:

```bash
git commit --allow-empty -m "chore: trigger deployment"
git push
```

Or go to **Actions** tab and manually trigger the workflow.

### 4.4 Monitor Deployment

1. Go to **Actions** tab in your repository
2. Click on the running workflow
3. Wait for all jobs to complete (green checkmarks)
4. Your site will be available at: `https://yourusername.github.io/tuval.space/`

## Step 5: Verify Deployment

1. Visit your deployed site
2. Try signing in with Google
3. Create a username
4. Test creating a board
5. Test placing pixels
6. Check change history

## Troubleshooting

### Authentication Issues

- **Error: "Unauthorized domain"**
  - Go to Firebase Console > Authentication > Settings > Authorized domains
  - Add your GitHub Pages domain

### Build Failures

- **Error: "Firebase configuration missing"**
  - Verify all secrets are correctly set in GitHub repository settings
  - Check secret names match exactly

### Routing Issues (404 on refresh)

- The `public/404.html` file handles SPA routing
- Ensure it's included in your deployment

### Firestore Permission Denied

- Verify security rules are deployed correctly
- Check Firebase Console > Firestore Database > Rules
- Rules should match the content of `firestore.rules`

## Maintenance

### Updating Firebase Configuration

If you need to change Firebase settings:

1. Update secrets in GitHub repository settings
2. Trigger a new deployment

### Updating App Configuration

To change pixel quotas or other app settings:

1. Update values in GitHub secrets (for production)
2. Update `.env` file (for local development)
3. Push changes to trigger redeployment

### Monitoring Usage

Firebase provides usage monitoring:

1. Go to Firebase Console
2. Check **Firestore Database** > **Usage** tab
3. Monitor read/write operations to stay within free tier limits

### Backup

Firestore data can be exported:

1. Go to Cloud Console (link in Firebase Console)
2. Navigate to Firestore
3. Use the Export/Import feature

## Custom Domain (Optional)

To use a custom domain like `tuval.space`:

1. Buy a domain from a domain registrar
2. In GitHub repository settings > Pages
3. Enter your custom domain
4. Update DNS records at your registrar:
   - Type: A
   - Host: @
   - Value: GitHub's IP addresses (shown in GitHub Pages settings)
   - Type: CNAME
   - Host: www
   - Value: yourusername.github.io
5. Update Firebase authorized domains to include your custom domain

## Production Checklist

- [ ] Firebase project created
- [ ] Authentication enabled with Google
- [ ] Firestore database created
- [ ] Security rules deployed
- [ ] Firebase configuration copied
- [ ] GitHub repository created
- [ ] Repository secrets configured
- [ ] GitHub Pages enabled
- [ ] Authorized domains configured in Firebase
- [ ] Deployment successful
- [ ] Site accessible and functional
- [ ] Authentication working
- [ ] Pixel placement working
- [ ] Change history working

## Support

For issues:
- Check Firebase Console for backend errors
- Check GitHub Actions logs for deployment errors
- Review browser console for frontend errors
- Check Firestore security rules for permission issues

---

**Congratulations!** Your tuval.space instance should now be live! 🎉












