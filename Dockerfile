FROM node:16-alpine

# create destination directory
RUN mkdir -p /usr/app/
WORKDIR /usr/app/

# update and install dependency
RUN apk update && apk upgrade

# copy the app, note .dockerignore
COPY . /usr/app/
RUN npm install

# ENV NODE_ENV production
# start the app
CMD [ "npm", "run", "start" ]