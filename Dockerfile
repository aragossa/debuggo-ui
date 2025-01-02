FROM docker.io/library/node:18-alpine AS build
WORKDIR /app
COPY .env ./
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
FROM docker.io/library/nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
