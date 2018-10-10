const axios = require('axios');

const reliable_multicast = peers => (uri, data) => Promise.all([...peers].map(
    peer => axios.post(`http://${peer}${uri}`, data)
        .catch(e => {
            switch (e.code) {
            case 'ECONNREFUSED':
                console.log(chalk.black.bgYellow(`WARN: ${peer} seems to be down, will try on next round.`));
                break;

            default:
                console.log(`Error on ${peer}${uri}: ${e}`);
            }
        })
));

const reliable_receive = cb => ({ data } = {}) => cb(data);

module.exports = { reliable_multicast, reliable_receive };
