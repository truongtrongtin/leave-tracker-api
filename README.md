## Description

Simple todo api with NestJs framework

## Running the app

You need to keep `node_modules` in host machine due to the dev tools Visual Studio Code relies on — packages such as `eslint` or `@types`, for example.

```bash
$ npm install
```

```bash
# Set up environment variables
$ cp .env.example .env
```

```bash
# Start containers
$ docker-compose up
```

```bash
# Update database with current database schema
$ docker-compose exec nest npx mikro-orm schema:update -r
```

Then go to http://localhost:3001/api

## Deployment

- Add secret variables for github CI/CD

```
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
SSH_HOST
SSH_USERNAME
SSH_KEY
```

- SSH into your VPS and make app folder

```bash
$ cd ~

$ mkdir learn-nestjs
```

- Replace all domain in `nginx.conf` and `nginx.second.conf` with your domain

- From local, copy all files in `deployment` folder and `.env` into app folder in VPS, remember to use `production` environment variables

```bash
$ scp -r deployment/ user@host:~/learn-nestjs

$ scp .env user@host:~/learn-nestjs
```

- Make a small change and push to github to build image to docker hub and auto get ssl certificate in container for you

- Remove current `nginx.conf` file, rename `nginx.second.conf` to `nginx.conf` and run

```bash
$ docker-compose restart nginx
```

- Update database schema

```bash
$ docker-compose exec nest npx mikro-orm schema:update -r
```

- Enjoy your https site

Read more here: https://www.digitalocean.com/community/tutorials/how-to-secure-a-containerized-node-js-application-with-nginx-let-s-encrypt-and-docker-compose
