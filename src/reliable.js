const axios = require('axios');
const chalk = require('chalk');

const reliableMulticast = peers => (uri, data, method = 'post') => Promise.all([...peers].map(
  peer => axios({ url: `http://${peer}${uri}`, data, method })
    .catch((e) => {
      switch (e.code) {
        case 'ECONNREFUSED':
          console.log(chalk.black.bgYellow(`WARN: ${peer} seems to be down, will try on next round.`));
          break;

        default:
          console.log(`Error on ${peer}${uri}: ${e}`);
      }
    }),
));

const reliableReceive = cb => ({ data } = {}) => cb(data);

module.exports = { reliableMulticast, reliableReceive };
