# Deploying to Netlify

This guide provides step-by-step instructions for deploying your Next.js application to Netlify.

## Prerequisites
- A Netlify account (sign up at [netlify.com](https://netlify.com) if you don't have one)
- Your application code in a Git repository (GitHub, GitLab, or Bitbucket)

## Option 1: Deploy via Git

### 1. Prepare your repository
Make sure your repository includes:
- The `netlify.toml` file we created
- The `@netlify/plugin-nextjs` dependency

### 2. Connect to Netlify
1. Log in to your Netlify account
2. Click "Add new site" > "Import an existing project"
3. Connect to your Git provider (GitHub, GitLab, or Bitbucket)
4. Select your repository

### 3. Configure build settings
- Build command: `next build`
- Publish directory: `.next`
- Advanced build settings: Add the following environment variables if needed
  - NODE_VERSION: 18.x (or your preferred version)

### 4. Deploy
Click "Deploy site" and wait for the build to complete.

## Option 2: Manual Deploy (Drag and Drop)

### 1. Build your site locally
Run the following commands:
```bash
npm run build
```

### 2. Deploy to Netlify
1. Log in to your Netlify account
2. Go to "Sites"
3. Drag and drop the `.next` folder onto the Netlify UI where it says "Drag and drop your site folder here"

### Important Notes
- The manual deployment method doesn't support server-side rendering (SSR)
- For Next.js applications, the Git-based method is strongly recommended

## Environment Variables
If your application uses environment variables:
1. Go to "Site settings" > "Environment variables"
2. Add your variables (equivalent to your `.env` file)

## Custom Domain
To set up a custom domain:
1. Go to "Domain settings"
2. Click "Add custom domain"
3. Follow the instructions to configure DNS settings

## Troubleshooting
- **Build failures**: Check the build logs in Netlify
- **Missing dependencies**: Ensure all dependencies are in your package.json
- **API routes not working**: Ensure the Netlify Next.js plugin is properly configured

For more information, visit [Netlify Docs](https://docs.netlify.com/integrations/frameworks/next-js/). 