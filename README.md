# Moderation
### Custom moderation bot for the Learn Japanese and Car Community Discord servers

![init](https://cdn.tokyo.jp/giq4A)

## Self Hosting
Self hosting is not supported at the moment

## Features
#### Many of these features are optional and may be turned off in the config.json file

 * Message edit and delete logs *with* attachment support
 * Slash commands with required fields. Moderators will never need to memorize syntax, so syntax will never be a problem for mods. Also requires mods to always input a reason for their actions.

![syntax](https://cdn.tokyo.jp/CCgFl)

 * Anti-discord server advertisement. Automatically warns users, tells them to DM the owners for partnerships, and times them out for 10 minutes to prevent spam.
 * Kicks accounts newer than 7 days, bans them for spam joining after recieving warnings
 * Designed to be mobile friendly. Placing IDs and user mentions from logs **outside** of embeds, so that mods on mobile devices can quickly and easily get the information they need copied to their clipboard

![embed1](https://cdn.tokyo.jp/o4cuJ)

 * Ban appeal system
   
   ![bappeal](https://cdn.tokyo.jp/p11js)
   ![bappeal2](https://cdn.tokyo.jp/NLA4S)
   
 * Turtlemode, slowmode but only for individuals, not channel-wide
 * Mutes via mute role
 * Warning system, automatically logged kicks, mutes, bans, turtlemodes

![warns](https://cdn.tokyo.jp/sqeNm)

 * Role management via commands
 * Staff role checking, so that moderators do not need ban, kick, manage_anything permissions in order to moderate the server
 * Command cooldowns to stop abuse of the bot to mass ban/kick members
 * Nitro role selector. Configure nitro roles and allow people to pick out which ones they want from a dropdown

![nitro](https://cdn.tokyo.jp/bKlK9)
   
 * sendDM command to send users DMs from the bot
 * User inputs via mentions, user IDs, usernames, and tags

![usrmen1](https://cdn.tokyo.jp/yF2Kl)
![usrmen2](https://cdn.tokyo.jp/cm9Qu)
![usrmen3](https://cdn.tokyo.jp/7DueK)
![usrmen4](https://cdn.tokyo.jp/VdbG0)
   
 * Duration input in both English and Japanese (Kanji)

![jp](https://cdn.tokyo.jp/XpvIc)

 * Fun/Misc. commands can be used in any channel by staff members, but normal members are told to instead run the command in your bot command channel

![funmisc](https://cdn.tokyo.jp/4cO9P)


 * Bulk message deletes (Ex: Banning a user and deleting their messages on ban) are logged in a human readable format either online or sent via file in your secondary-logs channel

![bulk](https://cdn.tokyo.jp/IbsOJ)

 * Highlighter: Choose words and phrases and the bot will alert you (A maximum of once per 10 minutes) every time that word or phrase is said in the server!

![hl1](https://cdn.tokyo.jp/q1dGX)
![hl2](https://cdn.tokyo.jp/3Z3BO)

 * Allow users to see the banned words of a server using the /bannedwords command

![bw](https://cdn.tokyo.jp/SFBAZ)