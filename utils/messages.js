const moment = require("moment");

function formatMessage(username, text) {
  return {
    username,
    text,
    time:moment().format("h:mm a") //format the time
  };
}

module.exports = formatMessage;