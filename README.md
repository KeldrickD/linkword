# LinkWord

A Farcaster Frame mini-app that challenges users to find the hidden link between words. Built with Next.js and the Farcaster Frame SDK.

## Features

- Daily word puzzles with hidden connections
- Hint system with free and paid options
- Stats tracking and leaderboards
- Streak system with milestone celebrations
- NFT rewards for solving puzzles

## Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with the following variables:
```env
NEXT_PUBLIC_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

3. Run the development server:
```bash
npm run dev
```

## Deployment

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Deploy to Vercel:
- Connect your GitHub repository to Vercel
- Set the following environment variables:
  - `NEXT_PUBLIC_URL`: Your Vercel deployment URL
  - `NEXTAUTH_URL`: Same as NEXT_PUBLIC_URL
  - `NEXTAUTH_SECRET`: A random string for session encryption

## Testing

To test the mini-app:
1. Open the Warpcast Mini App Developer Tools: https://warpcast.com/~/developers
2. Scroll down to the "Preview Mini App" tool
3. Enter your Vercel deployment URL
4. Click "Preview" to test your mini app

## License

MIT

# Farcaster Mini Apps (formerly Frames) Quickstart by Neynar 🪐

A Farcaster Mini Apps quickstart npx script.

This is a [NextJS](https://nextjs.org/) + TypeScript + React app.

## Guide

Check out [this Neynar docs page](https://docs.neynar.com/docs/create-farcaster-miniapp-in-60s) for a simple guide on how to create a Farcaster Mini App in less than 60 seconds!

## Getting Started

To create a new mini app project, run:
```{bash}
npx @neynar/create-farcaster-mini-app@latest
```

To run the project:
```{bash}
cd <PROJECT_NAME>
npm run dev
```

### Importing the CLI
To invoke the CLI directly in JavaScript, add the npm package to your project and use the following import statement:
```{javascript}
import { init } from '@neynar/create-farcaster-mini-app';
```

## Deploying to Vercel
For projects that have made minimal changes to the quickstart template, deploy to vercel by running:
```{bash}
npm run deploy:vercel
```

## Building for Production

To create a production build, run:
```{bash}
npm run build
```

The above command will generate a `.env` file based on the `.env.local` file and user input. Be sure to configure those environment variables on your hosting platform.

## Developing Script Locally

This section is only for working on the script and template. If you simply want to create a mini app and _use_ the template, this section is not for you.

### Recommended: Using `npm link` for Local Development

To iterate on the CLI and test changes in a generated app without publishing to npm:

1. In your installer/template repo (this repo), run:
   ```bash
   npm link
   ```
   This makes your local version globally available as a symlinked package.


1. Now, when you run:
   ```bash
   npx @neynar/create-farcaster-mini-app
   ```
   ...it will use your local changes (including any edits to `init.js` or other files) instead of the published npm version.

### Alternative: Running the Script Directly

You can also run the script directly for quick iteration:

```bash
node ./bin/index.js
```

However, this does not fully replicate the npx install flow and may not catch all issues that would occur in a real user environment.

### Environment Variables and Scripts

If you update environment variable handling, remember to replicate any changes in the `dev`, `build`, and `deploy` scripts as needed. The `build` and `deploy` scripts may need further updates and are less critical for most development workflows.

