FROM node:20-alpine AS build

WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
ARG VITE_SERVER_BASEURL
ENV VITE_SERVER_BASEURL=$VITE_SERVER_BASEURL
RUN pnpm build:h5

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/build/h5 /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
