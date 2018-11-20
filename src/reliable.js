const axios = require('axios');
const chalk = require('chalk');

const reliableMulticast = peers => (uri, data) => Promise.all([...peers].map(
  peer => axios.post(`http://${peer}${uri}`, data)
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
