# Use the latest LTS version of Node.js
FROM node:lts

# Create app directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy all the files and directories (except the node_modules folder)
COPY . /app 

# Expose the port on which the app will run
EXPOSE 80

# Start the app
CMD ["npm", "start"]
