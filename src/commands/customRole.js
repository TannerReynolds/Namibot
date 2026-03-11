const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const prisma = require("../utils/prismaClient");
const { colors, emojis } = require("../config.json");
const c = require("../config.json");
const log = require("../utils/log");
const { sendReply } = require("../utils/sendReply");

// ---- Helpers ---------------------------------------------------------------

function parseHexColors(input) {
  if (!input) return [];
  const parts = input.split(",").map((s) => s.trim().replace(/^#/g, ""));
  const norm = parts
    .filter(Boolean)
    .slice(0, 3) // primary, secondary, tertiary (holographic)
    .map((h) => {
      if (/^[0-9a-f]{3}$/i.test(h)) {
        // expand to 6
        h = h.split("").map((c) => c + c).join("");
      }
      if (!/^[0-9a-f]{6}$/i.test(h)) {
        throw new Error("Invalid hex color");
      }
      return "#" + h.toLowerCase();
    });
  return norm;
}

function hexToInt(hex) {
  return parseInt(hex.replace("#", ""), 16);
}

function ensurePngUnderLimit(attachment, maxBytes) {
  if (!attachment) return null;
  const isPng =
    (attachment.contentType && attachment.contentType.includes("png")) ||
    (attachment.name && attachment.name.toLowerCase().endsWith(".png"));
  if (!isPng) throw new Error("Icon must be a PNG image.");
  if (typeof attachment.size === "number" && attachment.size > maxBytes) {
    throw new Error(
      `Icon is too large. Max size is ${(maxBytes / 1024) | 0}KB.`
    );
  }
  return attachment.url; // discord.js accepts a URL/Buffer/etc for setIcon
}

async function getOrCreateMemberRecord(userID, guildId) {
  try {
    return await prisma.member.upsert({
      where: { userID_guildId: { userID, guildId } },
      update: {},
      create: { userID, guildId },
    });
  } catch (e) {
    log.error(`Prisma upsert (ensure) failed: ${e}`);
    throw e;
  }
}

/**
 * Manually PATCH role colors via HTTP API (gradient/holographic).
 * Uses snake_case fields per the HTTP API: colors.primary_color, etc.
 * Requires MANAGE_ROLES and the guild feature ENHANCED_ROLE_COLORS for gradients.
 */
async function patchRoleColorsHTTP({ guildId, roleId, colorsArr, reason }) {
  if (!Array.isArray(colorsArr) || colorsArr.length === 0) return;

  const body = {
    colors: {
      primary_color: hexToInt(colorsArr[0]),
      // Only send secondary/tertiary if provided
      ...(colorsArr[1] ? { secondary_color: hexToInt(colorsArr[1]) } : {}),
      ...(colorsArr[2] ? { tertiary_color: hexToInt(colorsArr[2]) } : {}),
    },
  };

  // Prefer global fetch (Node 18+). If your runtime is older, install undici or node-fetch.
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/roles/${roleId}`,
    {
      method: "PATCH",
      headers: {
        "Authorization": `Bot ${c.token}`,
        "Content-Type": "application/json",
        // optional audit log reason
        ...(reason ? { "X-Audit-Log-Reason": encodeURIComponent(reason) } : {}),
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} while setting role colors: ${text || res.statusText}`
    );
  }
}

// ---- Command ---------------------------------------------------------------

module.exports = {
  data: new SlashCommandBuilder()
    .setName("customrole")
    .setDescription("Create or edit a custom role for yourself")
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("What should your role be called?")
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription(
          "Provide a hex color or multiple (comma-separated). Examples: ff4d6b or #ff4d6b,00aa88"
        )
    )
    .addAttachmentOption((option) =>
      option
        .setName("icon")
        .setDescription("PNG icon under 256KB.")
    ),
  async execute(interaction) {
    log.debug("begin");
    await interaction.deferReply({ ephemeral: true });
    sendReply(interaction, "main", `${emojis.loading}  Loading Interaction...`);

    const configForGuild = c.guilds?.[interaction.guild.id];
    if (!configForGuild?.premiumMemberRoleID) {
      await sendReply(
        interaction,
        "error",
        `${emojis.error}  Premium role not configured for this server.`
      );
      log.debug("end");
      return;
    }

    const premiumMemberRoleID = configForGuild.premiumMemberRoleID;
    const guild = interaction.guild;
    const guildMe = guild.members.me;
    const member = interaction.member;

    // Gate: only Premium members can use it
    const isPremium = member.roles.cache.has(premiumMemberRoleID) || member.roles.cache.has('1410789111304028212') || member.roles.cache.has('1410789830815645876');
    if (!isPremium  && interaction.user.id !== "478044823882825748") {
      await sendReply(
        interaction,
        "error",
        `${emojis.error}  You must be a Premium member to use this command.`
      );
      log.debug("end");
      return;
    }

    // Options
    const nameInput = interaction.options.getString("name");
    const colorInput = interaction.options.getString("color");
    const iconAttachment = interaction.options.getAttachment("icon");

    if (!nameInput && !colorInput && !iconAttachment) {
      await sendReply(
        interaction,
        "error",
        `${emojis.error}  Provide at least one option: \`name\`, \`color\`, or \`icon\`.`
      );
      log.debug("end");
      return;
    }

    // Validate colors & icon
    let colorsArray = [];
    try {
      colorsArray = parseHexColors(colorInput);
    } catch {
      await sendReply(
        interaction,
        "error",
        `${emojis.error}  Invalid color format. Use hex like \`ff4d6b\` or \`#ff4d6b,00aa88\`.`
      );
      log.debug("end");
      return;
    }

    let iconUrl = null;
    try {
      // Role icons are 64×64 PNG, ≤256 KB (and require the server perk). :contentReference[oaicite:0]{index=0}
      iconUrl = ensurePngUnderLimit(iconAttachment, 256 * 1024);
    } catch (e) {
      await sendReply(interaction, "error", `${emojis.error}  ${e.message}`);
      log.debug("end");
      return;
    }

    const premiumRole = await guild.roles.fetch(premiumMemberRoleID).catch(() => null);
    if (!premiumRole) {
      await sendReply(
        interaction,
        "error",
        `${emojis.error}  Premium role not found in this server.`
      );
      log.debug("end");
      return;
    }

    // Ensure Member row exists
    await getOrCreateMemberRecord(interaction.user.id, guild.id);

    // Load any existing custom role
    let dbMember = await prisma.member.findUnique({
      where: { userID_guildId: { userID: interaction.user.id, guildId: guild.id } },
      select: { customRole: true },
    });

    let role = null;
    if (dbMember?.customRole) {
      role = await guild.roles.fetch(dbMember.customRole).catch(() => null);
      if (!role) dbMember = null; // stale DB
    }

    // Create role if missing
    if (!role) {
      role = await guild.roles.create({
        name: nameInput || `${interaction.user.username}'s Role`,
        reason: `Custom role for ${interaction.user.tag}`,
      });

      // Place exactly one above Premium; keep below bot's highest
      try {
        const desired = premiumRole.position + 1;
        const botTop = guildMe.roles.highest.position;
        const safePosition = Math.min(desired, botTop - 1);
        await role.setPosition(Math.max(safePosition, 1));
      } catch (e) {
        log.warn(`Could not set role position: ${e?.message || e}`);
      }
    }

    // Edits: name & icon via discord.js; colors via native API if needed
    try {
      if (nameInput) await role.setName(nameInput);
      if (iconUrl) {
        // Requires perk; throws if unavailable or too large.
        await role.setIcon(iconUrl);
      }
    } catch (e) {
      await sendReply(
        interaction,
        "warning",
        `${emojis.warning}  Role updated with partial changes: ${e?.message || e}`
      );
    }

    // COLORS:
    // Use native role.setColors if available; otherwise PATCH the HTTP API manually with snake_case fields.
    if (colorsArray.length) {
      const supportsEnhanced =
        Array.isArray(guild.features) &&
        guild.features.includes("ENHANCED_ROLE_COLORS"); // new guild feature flag. :contentReference[oaicite:1]{index=1}

      if (!supportsEnhanced && colorsArray.length > 1) {
        await sendReply(
          interaction,
          "error",
          `${emojis.error}  This server doesn't have Enhanced Role Styles enabled, so gradients aren't available.`
        );
        log.debug("end");
        return;
      }

      if (typeof role.setColors === "function") {
        // Modern discord.js path (camelCase -> API snake_case handled for you). :contentReference[oaicite:2]{index=2}
        const payload = { primaryColor: hexToInt(colorsArray[0]) };
        if (colorsArray[1]) payload.secondaryColor = hexToInt(colorsArray[1]);
        if (colorsArray[2]) payload.tertiaryColor = hexToInt(colorsArray[2]);
        await role.setColors(payload);
      } else {
        // Manual HTTP PATCH (snake_case fields inside "colors"). Docs reference "colors.primary_color". :contentReference[oaicite:3]{index=3}
        await patchRoleColorsHTTP({
          guildId: guild.id,
          roleId: role.id,
          colorsArr: colorsArray,
          reason: `Set custom role colors for ${interaction.user.tag}`,
        });
      }
    }

    // Assign role to the member
    try {
      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role);
      }
    } catch (e) {
      await sendReply(
        interaction,
        "error",
        `${emojis.error}  Couldn’t assign the role to you: ${e?.message || e}`
      );
      log.debug("end");
      return;
    }

    // Persist role ID in Prisma
    const customRoleID = role.id;
    try {
      await prisma.member.upsert({
        where: {
          userID_guildId: {
            userID: interaction.user.id,
            guildId: guild.id,
          },
        },
        update: { customRole: customRoleID },
        create: {
          userID: interaction.user.id,
          guildId: guild.id,
          customRole: customRoleID,
        },
      });
    } catch (e) {
      log.error(`Error upserting premium role ${e}`);
    }

    // Success
    const successEmbed = new EmbedBuilder()
      .setTitle(`Role Updated`)
      .setColor(colors.main)
      .setDescription(`${emojis.success}  Successfully updated your custom role!`)
      .setTimestamp();

    await interaction.channel.send({ embeds: [successEmbed] });
    sendReply(interaction, "success", `${emojis.success}  Interaction Complete`);
    log.debug("end");
  },
};