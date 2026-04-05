FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./
COPY src ./src

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

EXPOSE 5173
CMD ["npm", "run", "dev"]
