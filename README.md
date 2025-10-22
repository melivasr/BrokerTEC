# BrokerTEC

BrokerTEC es una aplicación web que permite a usuarios comercian en la bolsa de valores. Más información en [el enunciado](Proyectos_CE_3101_S2_2025_Proyecto_1.pdf)

## Backend

Para correr el backend, se necesita `nodejs`. Para la base de datos, se necesita `docker` (o `podman`) y `docker-compose` (o `podman-compose`) si se corre en linux.

Configure `docker` o `podman`. Luego de clonar e ingresar al repositorio, inicialize la base de datos:

```
docker compose down -v && docker compose up --build
```

En windows, con SQL Server Studio, crear base de datos `BrokerTec` y usar [schema.sql](db/schema.sql) y [seed.sql](db/seed.sql) para generar datos semilla.

Luego inicie el servidor con `nodejs`:

```
cd backend
node server.js
```

# Frontend

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Ejecutar y probar en un dispositivo móvil (desarrollo)

1. Asegúrate de que tu PC y tu móvil estén en la misma red Wi‑Fi.
2. Crea un archivo `.env` a partir de `.env.example` y ajusta la IP de tu PC (ej. `REACT_APP_API_URL=http://192.168.18.114:4000`).
3. Arranca el backend (en la carpeta `backend`):
	```powershell
	node server.js
	```
4. En la carpeta del frontend (`broker-tec`) arranca el dev server exportando HOST=0.0.0.0 para exponer la interfaz de red:
	```powershell
	$env:HOST='0.0.0.0'
	npm start
	```
5. En tu móvil abre la URL que muestra CRA, p.ej. `http://192.168.18.114:3000`.

Nota: si el móvil no puede conectar, asegúrate de abrir los puertos 3000 y 4000 en el firewall de Windows o usa una herramienta como `localtunnel`/`ngrok`.
