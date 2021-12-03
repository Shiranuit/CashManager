FROM node:12.20.0

EXPOSE 4000

RUN  set -x \
  && apt update

WORKDIR /var/app

ADD entrypoint.sh /bin/entrypoint.sh
RUN chmod +x /bin/entrypoint.sh

ADD app.js .
ADD package-lock.json .
ADD package.json .

RUN npm install
ADD config.js .
ADD lib ./lib

ENTRYPOINT ["/bin/entrypoint.sh"]

CMD ["npm", "run", "start"]