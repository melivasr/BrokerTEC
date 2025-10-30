FROM node:20-alpine

WORKDIR /app

# Copiamos package.json y package-lock.json
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos todo el backend
COPY . .

# Exponemos el puerto del backend
EXPOSE 3001

# Comando por defecto
CMD ["node", "server.js"]
