FROM node:18

WORKDIR /usr/src/app

# Copia apenas os manifests primeiro
COPY package*.json ./

# Instala dependências
RUN npm install

# Agora copia o código (sem sobrescrever node_modules)
COPY . .

EXPOSE 5000
CMD ["npm", "start"]
