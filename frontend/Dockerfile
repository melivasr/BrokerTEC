FROM node:20-alpine AS build

WORKDIR /app
COPY . .

# COPY package*.json ./
RUN npm install

RUN npm run build

# Servidor web ligero para servir build
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
