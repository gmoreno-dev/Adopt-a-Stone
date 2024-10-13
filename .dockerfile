# Use uma imagem Node.js atualizada
FROM node:20-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia o package.json e package-lock.json
COPY package*.json ./

# Instala as dependências
RUN npm install --production

# Copia o restante do código
COPY . .

# Expõe a porta
EXPOSE 8080

# Define o comando para iniciar a aplicação
CMD [ "node", "server.js" ]
