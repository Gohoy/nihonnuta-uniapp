FROM node:20-alpine AS build

# Install git for husky/prepare scripts
RUN apk add --no-cache git

WORKDIR /app

# Copy all files first (needed for prepare scripts)
COPY . .

# Install dependencies, skip prepare hooks, then run init-baseFiles manually
RUN corepack enable && pnpm install --frozen-lockfile --ignore-scripts && pnpm init-baseFiles

ARG VITE_SERVER_BASEURL
ENV VITE_SERVER_BASEURL=$VITE_SERVER_BASEURL
RUN pnpm build:h5

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/build/h5 /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
