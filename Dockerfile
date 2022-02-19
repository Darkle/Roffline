# The playwirght:focal image gives us ubuntu focal, python3.8, pip, node 16 & npm
FROM mcr.microsoft.com/playwright@sha256:17febf6e675b3c706cab5e53684b05eb358a06b0aaaf3b0e6ba7f3b149b41681

RUN sudo pip install gallery-dl
RUN sudo pip install yt-dlp
RUN sudo apt install -y ffmpeg

COPY --chown=node:node . .

ENV NODE_ENV=production

RUN npm install
RUN npm run build

# https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/
USER node

# https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/docker/bootstrap-using-node.md
CMD ["node", "-r", "./env-checker.cjs", "./boot.js"]