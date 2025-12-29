# tuval.space - Collaborative Pixel Board Platform

A real-time collaborative pixel art platform where users receive daily pixel quotas to place pixels on boards with change history tracking and Google authentication.

## Features

- **Daily Pixel Quota System**: Members receive a configurable number of pixels per day
- **Pixel Carry-Over**: Unused pixels accumulate up to 3X the daily quota
- **Multiple Boards**: Each user can create and manage up to 10 boards
- **Real-time Updates**: See changes from other users instantly
- **Change History**: Track all modifications with automatic 8-hour merging
- **Guest Access**: Browse all boards without authentication (read-only)
- **Google Authentication**: Simple and secure login

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Firestore + Authentication)
- **Routing**: React Router v6
- **Icons**: react-icons
- **Deployment**: GitHub Pages via GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled
- Google OAuth configured in Firebase

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tuval.space.git
cd tuval.space
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Fill in your Firebase configuration in `.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the wizard
3. Enable Google Analytics (optional)

### 2. Enable Authentication

1. Navigate to Authentication > Sign-in method
2. Enable Google provider
3. Add your domain to authorized domains

### 3. Create Firestore Database

1. Navigate to Firestore Database
2. Click "Create database"
3. Start in production mode (we'll add security rules)
4. Choose a location close to your users

### 4. Deploy Security Rules

Copy the security rules from `firestore.rules` to your Firebase console:

```bash
firebase deploy --only firestore:rules
```

Or manually copy them in the Firebase Console under Firestore > Rules.

## Configuration

### App Settings

Configure the app behavior in `.env`:

- `VITE_DEFAULT_PIXEL_QUOTA`: Daily pixel allocation per user (default: 100)
- `VITE_MAX_PIXEL_ACCUMULATION`: Maximum quota multiplier (default: 3)
- `VITE_MAX_BOARDS_PER_USER`: Maximum boards per user (default: 10)
- `VITE_MAX_BOARD_PIXELS`: Maximum total pixels per board (default: 400,000)
- `VITE_CHANGE_MERGE_WINDOW_HOURS`: Auto-merge window in hours (default: 8)
- `VITE_DEFAULT_BOARD_WIDTH`: Default board width for new users (default: 365)
- `VITE_DEFAULT_BOARD_HEIGHT`: Default board height for new users (default: 100)

### Board Dimensions

When creating a board, ensure `width × height ≤ 400,000` pixels.

The default board created for new users uses `VITE_DEFAULT_BOARD_WIDTH × VITE_DEFAULT_BOARD_HEIGHT` (default: 365 × 100 = 36,500 pixels).

Examples:
- 365 × 100 = 36,500 pixels ✓ (default)
- 632 × 632 = 399,424 pixels ✓
- 1000 × 400 = 400,000 pixels ✓
- 1000 × 1000 = 1,000,000 pixels ✗ (exceeds limit)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests with Jest
- `npm run storybook` - Start Storybook

### Code Quality

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for git hooks
- **lint-staged** for pre-commit checks
- **commitlint** for conventional commits

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: restructure code
test: add tests
chore: update dependencies
```

## Project Structure

```
tuval.space/
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   └── ...          # Feature components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Firebase and utilities
│   ├── pages/           # Page components
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript types
│   ├── App.tsx          # Root component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── .github/             # GitHub Actions workflows
└── ...config files
```

## Deployment

### GitHub Pages

1. Update `vite.config.ts` with your repository name:
```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ...
});
```

2. Push to the `main` branch - GitHub Actions will automatically:
   - Run linting and tests
   - Build the project
   - Deploy to GitHub Pages

3. Enable GitHub Pages in repository settings:
   - Settings > Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` / `root`

The site will be available at `https://yourusername.github.io/tuval.space/`

## Testing

### Unit Tests

```bash
npm test
```

### Component Tests

```bash
npm test -- --coverage
```

### Storybook

```bash
npm run storybook
```

Browse components at [http://localhost:6006](http://localhost:6006)

## Architecture

### Data Models

- **User**: Authentication, pixel quota, board ownership
- **Board**: Canvas dimensions, pixel data, metadata
- **Pixel**: Color, placement user, timestamp
- **Change**: History tracking, merging, dismissal

### Firestore Collections

```
users/{uid}
  - username, email, pixelQuota, lastQuotaReset, boards[]

boards/{boardId}
  - name, ownerId, width, height, maxPixels, createdAt
  
  pixels/{rowIndex}
    - [array of pixel objects]
  
  changes/{changeId}
    - userId, username, timestamp, pixels[], mergedWith[], isDismissed
```

### Key Features Implementation

#### Pixel Quota System
- Daily reset at midnight UTC
- Automatic carry-over up to 3X daily quota
- Shared across all boards (not per-board)

#### Change Merging
- Auto-merge changes by same user within 8 hours
- Individual dismissal of change entries
- Persistent per-user preferences

#### Real-time Updates
- Firestore real-time listeners for boards and changes
- Optimistic UI updates with rollback
- Toast notifications for errors

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/new-feature`
3. Commit changes: `git commit -m 'feat: add new feature'`
4. Push to branch: `git push origin feat/new-feature`
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review Firebase console for backend issues

---

**Built with** ❤️ **using React, TypeScript, and Firebase**


