async function gifDetector(message) {
  if (message.attachments) {
    let hasGif = message.attachments.find(
      (a) => a.contentType.toLowerCase() === "image/gif"
    );
    let allowedChannels = ["438653183464701963", "438652906116481025"];
    let messageChannel = message.channel.id;
    if (allowedChannels.includes(messageChannel)) return;
    if (hasGif) {
      message.reply("Gif Detected, please no gifs").then((r) => {
        message.delete();
        setTimeout(() => {
          r.delete();
        }, 4000);
      });
    }
  }
}

module.exports = { gifDetector };
