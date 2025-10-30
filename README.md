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






Para poder correr el proyecto primero se deben tener instalados ciertos programas.\

## Requisitos previos.
1. Para correr la base de datos es necesario tener el Microsoft SQL Server, ya que los querys están pensados para este programa: [https://www.microsoft.com/es-es/sql-server/sql-server-downloads](https://www.microsoft.com/es-es/sql-server/sql-server-downloads) (se recomienda descargar el SQL Server 2022 Developer).
	* Se recomienda instalar el SQL Server Management Studio (SSMS) el cual posee una interfaz muy amigable para ver la base de datos.
	* Una vez se abre el SSMS para conectar al servidor es importante tener anotar o conocer los datos de Server name, Login, y Password, ya que con ellas se conectara el backend a la base de datos.
	* Como configuracion para conectar al servidor en Authentication debe seleccionarse la opcion de SQL Server Authentication, y en Encryption seleccionar Mandatory y seleccionar la casilla de Trust server certificate. 
	* Finalmente cree una base de datos y asignele un nombre, por ejemplo "BrokerTEC".

2. Para correr el backend(servidor y API Rest) es necesario instalar Node.js: [https://nodejs.org/en/download](https://nodejs.org/en/download)

3. Instalar algún editor de código, por ejemplo vscode: [https://code.visualstudio.com](https://code.visualstudio.com)

## Inicializacion de la pagina web.
Una vez se tiene listo este entorno de programas se puede descargar el zip del repositorio de GitHub: [https://github.com/melivasr/BrokerTEC](https://github.com/melivasr/BrokerTEC) \
Abra la carpeta del archivo en el editor de codigo, vscode en este caso. \
En la parte de backend modifique el archivo .env de ejemplo con sus datos de servidor de Microsoft SQL Server:
```
	DB_USER=<Login>
	DB_PASS=<Password>
	DB_HOST=<Server_name>
	DB_NAME=<Nombre_de_la_base_de_datos_creada>
	JWT_SECRET=<define_un_token_secreto>
	PORT=4000 #Puerto donde correrá el servidor backend por defecto 4000
``` 
Crear tablas para la base de datos: en una terminal en el /backend ejecute el comando node --env-file=.env runTablesCreation.js \
Poblar tablas con datos: en una terminal en el /backend ejecute el comando node --env-file=.env runSeed.js
Iniciar servidor: en una terminal en el /backend ejecute el comando node --env-file=.env server.js \
Luego inicialice una terminal en el directorio BrokerTEC, y corra el comando npm install y luego npm start, esto abrira una ventana en su navegador web con el login para la pagina. \
Si desea abrir mas ventanas de la pagina web, puede hacerlo al escribir en el buscador [http://localhost:3000](http://localhost:3000).


## Posibles fuentes de error y soluciones.
* Que el puerto 1433 que usa Microsoft SQL Server no este activo: Ir al Sql Server Configuration Manager->SQL Server Network Configuration->TCP/IP y verificar que esta en enabled, y luego dentro del TCP/IP->IIPAI y verificar que el puerto seleccionado sea el 1433.
* Que el servidor este apagado: Ir al Sql Server Configuration Manager->SQL Server Services->SQL Server(MSSQLSERVER) y verificar que esta corriendo.
* Movil sin acceso a la pagina o al api: Permitir acceso a los puertos seleccionados para el servidor(backend) como a la pagina(frontend), en este caso los puertos 4000 y 3000 respectivamenente: New-NetFirewallRule -DisplayName "BrokerTEC Node 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow y New-NetFirewallRule -DisplayName "BrokerTEC React 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

## Ejecutar y probar en un dispositivo móvil (desarrollo)

1. Asegúrate de que tu PC y tu móvil estén en la misma red Wi‑Fi.
2. Crea un archivo `.env.development.local` en la raiz del proyecto y dentro de este va el contenido `REACT_APP_API_URL=<tu_direccion_IP_donde_corre_el_frontend>` esta IP se muestra el ejecutar el `npm start` en la parte de  On Your Network:. \
3. Cierra y vuelve a correr el servidor en la carpeta `backend`. \ 
4. En la carpeta del frontend `BrokerTEC` vuelve a iniciar la pagina:
	```powershell
	npm start
	```
5. En tu móvil abre la URL que muestra On Your Network: ej. `http://192.168.18.114:3000`.

Nota: si el móvil no puede conectar, asegúrate de abrir los puertos 3000 y 4000 en el firewall de Windows o usa una herramienta como `localtunnel`/`ngrok`.