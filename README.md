# Everywear Marketplace

Everywear is a MERN marketplace storefront built with React, Express, and MongoDB. It includes customer accounts, shopping cart and checkout flows, and a role-protected admin console. The original static website is preserved in `legacy-site/`.

## Features

- Product search, category and price filters, availability filters, and sorting
- Persistent cart and wishlist
- Customer registration, sign-in, sign-out, and private order history
- Admin dashboard for product management and order status updates
- MongoDB-backed catalog, accounts, carts, and orders
- Responsive storefront and admin views

Checkout records demo orders but does not process payments.

## Requirements

- Node.js 20 or newer
- Docker Desktop, or a local MongoDB server
- Git, if cloning the source from a remote repository

## Run on a New Computer

1. Clone the repository and enter its folder:

	```powershell
	git clone <your-repository-url>
	cd <repository-folder>
	```

2. Install the locked dependencies from the project root:

	```powershell
	npm ci
	```

3. Start MongoDB with Docker:

	```powershell
	docker compose up -d
	```

	Alternatively, run MongoDB locally at `mongodb://127.0.0.1:27017`.

4. Create a private server environment file:

	```powershell
	Copy-Item server/.env.example server/.env
	```

5. Edit `server/.env`. Set a unique, randomly generated `JWT_SECRET`, an admin email, and an admin password of at least 12 characters. Do not upload this file or share its values.

6. Create the administrator account:

	```powershell
	npm run admin:create
	```

	This command uses the admin values in `server/.env`. Public registration creates customer accounts only.

7. Start the client and API:

	```powershell
	npm run dev
	```

8. Open [http://localhost:5000/](http://localhost:5000/). In development, the API redirects the root URL to Vite at `http://localhost:5173/`.

The API is available at `http://localhost:5000/api`; its health endpoint is `/api/health`. On its first connection, the server seeds an empty database with the starter catalog.

## Publish the Source

This project currently has no `.gitignore`. Do not use `git add .` until you add an ignore file or carefully review the staged files. Never commit `server/.env`, `node_modules/`, or `client/dist/`.

To stage only source, assets, and setup files:

```powershell
git init
git add README.md package.json package-lock.json docker-compose.yml
git add client/index.html client/package.json client/src client/public/assets
git add server/package.json server/src server/.env.example
git add legacy-site
git status --short
```

Review `git status --short` and confirm `server/.env` is not listed before committing. Then create an empty repository with your Git hosting provider and connect it:

```powershell
git commit -m "Add Everywear marketplace"
git branch -M main
git remote add origin <your-repository-url>
git push -u origin main
```

## Deploy

The Express server serves the built React app and API from the same origin. On a Node.js host with HTTPS and a reachable MongoDB database:

1. Set `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `CLIENT_ORIGIN` in the host's private environment settings. Use your deployed site origin for `CLIENT_ORIGIN` and a MongoDB Atlas connection string for `MONGO_URI` if using Atlas.
2. Install dependencies and build the client:

	```powershell
	npm ci
	npm run build
	```

3. Create the initial administrator account once:

	```powershell
	npm run admin:create
	```

4. Start the application with:

	```powershell
	npm start
	```

The production session cookie requires HTTPS. Do not use the development fallback JWT secret in production. The included Docker Compose database is intended for local development; use a managed or secured MongoDB instance for a public deployment.

## Useful Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite client and Express API together |
| `npm run build` | Build the React client into `client/dist/` |
| `npm start` | Start Express and serve the built client |
| `npm run seed` | Replace the MongoDB catalog with the starter products |
| `npm run admin:create` | Create or reset the configured administrator account |

`npm run seed` replaces the catalog, including products added through the admin console. It does not remove accounts or create an administrator.

## Workspace Layout

- `client/` React and Vite storefront, account pages, and admin console
- `server/` Express API, Mongoose models, authentication, and catalog seed data
- `client/public/assets/` product images and original storefront artwork
- `legacy-site/` archived original HTML website
- `docker-compose.yml` local MongoDB service and persistent data volume

## Accounts and Security

Passwords are hashed with bcrypt. Login sessions use HttpOnly cookies, order history is limited to the signed-in customer, and admin APIs require the administrator role. Password reset and payment processing are not implemented.