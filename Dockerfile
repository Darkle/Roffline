# The playwright:focal image gives us ubuntu focal, python3.8, pip, node 16 & npm
FROM mcr.microsoft.com/playwright@sha256:17febf6e675b3c706cab5e53684b05eb358a06b0aaaf3b0e6ba7f3b149b41681

WORKDIR /usr/src/app

RUN pip install gallery-dl
RUN pip install yt-dlp
RUN apt install -y ffmpeg

EXPOSE 8080

COPY . .

# --loglevel=error for hiding the annoying NPM WARN messages
RUN npm install --loglevel=error

# IMPORTANT: `ENV NODE_ENV=production` needs to come AFTER `RUN npm install` as setting NODE_ENV to production means
#   npm wont install the dev-dependencies, which we need for the build task below (RUN npm run build)
ENV NODE_ENV=production

RUN npm run build

# This is just to make the node dotenv module happy in the app. The .env file variables are passed into docker via the --env-file flag
RUN touch .env


# https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/docker/bootstrap-using-node.md
CMD ["node", "-r", "./env-checker.cjs", "./boot.js"]