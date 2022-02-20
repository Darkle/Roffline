# The playwirght:focal image gives us ubuntu focal, python3.8, pip, node 16 & npm
FROM mcr.microsoft.com/playwright@sha256:17febf6e675b3c706cab5e53684b05eb358a06b0aaaf3b0e6ba7f3b149b41681

RUN pip install gallery-dl
RUN pip install yt-dlp
RUN apt install -y ffmpeg

ENV NODE_ENV=production

COPY . .

RUN npm ci


# https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/docker/bootstrap-using-node.md
CMD ["node", "-r", "./env-checker.cjs", "./boot.js"]