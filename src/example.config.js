const fs = require('fs').promises;

const config = {
  token: '.',
  clientId: '1104630573772841070',
  guildId: '1190156169961029774',
  botOwnerID: '478044823882825748',
  appealServer: 'https://discord.gg/wJhppSMHpG',
  colors: { 
    success: '#66de98', 
    error: '#FF6961', 
    main: '#6C4678',
    warning: '#f5f562'
  },
  emojis: {
    sent: '<:sent:1203188998097604608>',
    yes: '<:check:1203191199251300402>',
    no: '<:x_:1203191562084032594>',
    success: '<:check:1203191199251300402>',
    error: '<:x_:1203191562084032594>'
  },
  server: {
    enabled: true,
    port: 1746,
    url: 'https://learn.tokyo.jp/fern'
  },
  guilds: {
    '438650836512669699': {
      name: 'The Car Community',
      invite: 'https://discord.gg/cars',
      guildID: '438650836512669699',
      mainLogChannelID: '583434851852746776',
      secondaryLogChannelID: '655047046557859851',
      botCommandsChannelID: '438652906116481025',
      mailChannelID: '1202038197698449450',
      staffRoleID: '499564155884535808',
      muteRoleID: '819300268628770837',
      logs: {
        messageDelete: true,
        messageUpdate: true,
        messageDeleteBulk: true
      },
      features: {
        checkAccountAge: {
          enabled: true,
          days: 7
        },
        antiAds: {
          enabled: true,
          allowedInvites: ['https://discord.gg/cars', 'https://discord.gg/learnjapanese']
        },
        bannedWordFilter: true,
        fileTypeChecker: true,
        gifDetector: {
          enabled: true,
          allowedChannels: ['438653183464701963', '438652906116481025', '1197694320346665140']
        },
        hiddenLinkDetection: true,
        antiSpam: true,
        modMail: true,
        autoRole: {
          enabled: true,
          roles: ['573167869433610251']
        },
        levels: {
          enabled: false,
          levelUpMessage: 'You have leveled up to level {{level}}!',
          levelRoles: {
            '1': '1203186738898665533',
            '10': '1203186765289234523',
            '20': '1203186804828930108',
            '30': '1203186840639905832',
            '40': '1203186865398747166',
            '50': '1203186889637629983'
          }
        },
        nitroRoles: {
          enabled: true,
          roles: [
            { emoji: '', id: '' }
          ]
        },
        selfRoles: {
          enabled: false,
          roles: [
            { emoji: '', id: '' }
          ]
        }
      },
      commands: {
        dangerroles: true,
        unshort: true,
        purge: true,
        modmail: true,
        addhighlight: true,
        appeal: true,
        av: true,
        bam: true,
        ban: true,
        bannedwords: true,
        colorme: true,
        'Get Avatar': true,
        debugmode: true,
        delhighlight: true,
        delwarn: true,
        eval: true,
        gay: true,
        getlogpassword: true,
        giverole: true,
        highlights: true,
        id: true,
        kick: true,
        managenitrocolor: true,
        mute: true,
        newtag: true,
        t: true,
        deltag: true,
        tags: true,
        ping: true,
        realverification: true,
        removerole: true,
        rng: true,
        senddm: true,
        turtlemode: true,
        unban: true,
        unmute: true,
        unturtle: true,
        warn: true,
        warns: true
      }
    },
    '1061175459112550490': {
      name: 'Learn Japanese',
      invite: 'https://discord.gg/learnjapanese',
      guildID: '1061175459112550490',
      mainLogChannelID: '1083910377680687134',
      secondaryLogChannelID: '1193360741198217246',
      botCommandsChannelID: '1075661557247246357',
      mailChannelID: '1061182094266609724',
      staffRoleID: '1061181030813413468',
      muteRoleID: '1174259360541708299',
      logs: {
        messageDelete: true,
        messageUpdate: true
      },
      features: {
        checkAccountAge: {
          enabled: true,
          days: 7
        },
        antiAds: {
          enabled: true,
          allowedInvites: ['https://discord.gg/cars', 'https://discord.gg/learnjapanese']
        },
        bannedWordFilter: true,
        fileTypeChecker: true,
        gifDetector: {
          enabled: true,
          allowedChannels: ['438653183464701963', '438652906116481025', '1197694320346665140']
        },
        hiddenLinkDetection: true,
        antiSpam: true,
        modMail: true,
        autoRole: {
          enabled: true,
          roles: ['1087482841731956917']
        },
        levels: {
          enabled: true,
          levelUpMessage: 'You have leveled up to level {{level}}!',
          levelRoles: {
            '1': '1203186738898665533',
            '10': '1203186765289234523',
            '20': '1203186804828930108',
            '30': '1203186840639905832',
            '40': '1203186865398747166',
            '50': '1203186889637629983'
          }
        },
        nitroRoles: {
          enabled: true,
          roles: [
            { emoji: '', id: '' }
          ]
        },
        selfRoles: {
          enabled: false,
          roles: [
            { emoji: '', id: '' }
          ]
        }
      },
      commands: {
        dangerroles: true,
        unshort: true,
        purge: true,
        modmail: true,
        addhighlight: true,
        appeal: true,
        av: true,
        bam: true,
        ban: true,
        bannedwords: true,
        colorme: true,
        'Get Avatar': true,
        debugmode: true,
        delhighlight: true,
        delwarn: true,
        eval: true,
        gay: true,
        getlogpassword: true,
        giverole: true,
        highlights: true,
        id: true,
        kick: true,
        managenitrocolor: true,
        mute: true,
        newtag: true,
        t: true,
        deltag: true,
        tags: true,
        ping: true,
        realverification: true,
        removerole: true,
        rng: true,
        senddm: true,
        turtlemode: true,
        unban: true,
        unmute: true,
        unturtle: true,
        warn: true,
        warns: true
      }
    },
    '1190156169961029774': {
      name: 'Fern\'s Appeals',
      invite: 'https://discord.gg/JRqbHA5gbv',
      guildID: '1190156169961029774',
      mainLogChannelID: '1193380148104396963',
      secondaryLogChannelID: '1193380167142342667',
      botCommandsChannelID: '1190156171114446930',
      mailChannelID: '1190156171114446930',
      staffRoleID: '1193379997881217074',
      muteRoleID: '1193380020001964093',
      logs: {
        messageDelete: true,
        messageUpdate: true
      },
      features: {
        checkAccountAge: {
          enabled: true,
          days: 7
        },
        antiAds: {
          enabled: true,
          allowedInvites: ['https://discord.gg/JRqbHA5gbv']
        },
        bannedWordFilter: true,
        fileTypeChecker: true,
        gifDetector: {
          enabled: true,
          allowedChannels: ['438653183464701963', '438652906116481025', '1197694320346665140']
        },
        hiddenLinkDetection: true,
        antiSpam: true,
        modMail: true,
        autoRole: {
          enabled: false,
          roles: ['']
        },
        levels: {
          enabled: false,
          levelUpMessage: 'You have leveled up to level {{level}}!',
          levelRoles: {
            '1': '1203186738898665533',
            '10': '1203186765289234523',
            '20': '1203186804828930108',
            '30': '1203186840639905832',
            '40': '1203186865398747166',
            '50': '1203186889637629983'
          }
        },
        nitroRoles: {
          enabled: true,
          roles: [
            { emoji: '', id: '' }
          ]
        },
        selfRoles: {
          enabled: false,
          roles: [
            { emoji: '', id: '' }
          ]
        }
      },
      commands: {
        dangerroles: true,
        unshort: true,
        purge: true,
        modmail: true,
        addhighlight: true,
        appeal: true,
        av: true,
        bam: false,
        ban: true,
        bannedwords: true,
        colorme: true,
        'Get Avatar': true,
        debugmode: true,
        delhighlight: true,
        delwarn: true,
        eval: true,
        gay: true,
        getlogpassword: true,
        giverole: true,
        highlights: true,
        id: true,
        kick: true,
        managenitrocolor: true,
        mute: true,
        newtag: true,
        t: true,
        deltag: true,
        tags: true,
        ping: true,
        realverification: true,
        removerole: true,
        rng: true,
        senddm: true,
        turtlemode: true,
        unban: true,
        unmute: true,
        unturtle: true,
        warn: true,
        warns: true
      }
    }
  }
};

async function readData(path) {
  try {
    await fs.access(path);
    const data = await fs.readFile(path, 'utf8');
    console.log('File content:\n', data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('File does not exist.');
    } else {
      console.error('Error accessing or reading the file:', err);
    }
  }
}

module.exports = config;
