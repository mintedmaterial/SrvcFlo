Welcome to React Router + Cloudflare Workers!
Deploy to Cloudflare

React Router Starter Template Preview

A modern, production-ready template for building full-stack React applications using React Router and the Cloudflare Vite plugin.

Features
🚀 Server-side rendering
⚡️ Hot Module Replacement (HMR)
📦 Asset bundling and optimization
🔄 Data loading and mutations
🔒 TypeScript by default
🎉 TailwindCSS for styling
📖 React Router docs
Getting Started
Outside of this repo, you can start a new project with this template using C3 (the create-cloudflare CLI):

npm create cloudflare@latest -- --template=cloudflare/templates/react-router-starter-template
A live public deployment of this template is available at https://react-router-starter-template.templates.workers.dev

Installation
Install the dependencies:

npm install
Development
Start the development server with HMR:

npm run dev
Your application will be available at http://localhost:5173.

Typegen
Generate types for your Cloudflare bindings in wrangler.json:

npm run typegen
Building for Production
Create a production build:

npm run build
Previewing the Production Build
Preview the production build locally:

npm run preview
Deployment
If you don't have a Cloudflare account, create one here! Go to your Workers dashboard to see your free custom Cloudflare Workers subdomain on *.workers.dev.

Once that's done, you can build your app:

npm run build
And deploy it:

npm run deploy
To deploy a preview URL:

npx wrangler versions upload
You can then promote a version to production after verification or roll it out progressively.

npx wrangler versions deploy
Styling
This template comes with Tailwind CSS already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

Built with ❤️ using React Router.