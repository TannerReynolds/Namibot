const path = require("path");
const fs = require("fs");
const { EmbedBuilder } = require("discord.js");
const JishoAPI = require("unofficial-jisho-api");
const {
  SlashCommandBuilder,
  AppIntegrationType,
} = require("../utils/ExtSlashCmdBuilder");
const { colors, emojis } = require("../config.json");
const { sendReply } = require("../utils/sendReply.js");

const jisho = new JishoAPI();
const frequencyPath = path.join(__dirname, "..", "Frequencies.json");

let frequencyMap = null;

function loadFrequencyMap() {
  if (frequencyMap) return frequencyMap;

  if (!fs.existsSync(frequencyPath)) {
    throw new Error(`Frequency file not found: ${frequencyPath}`);
  }

  const raw = fs.readFileSync(frequencyPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Frequencies.json must contain an array");
  }

  const map = new Map();

  for (const item of parsed) {
    if (!item || typeof item.Word !== "string") continue;

    const word = item.Word.trim();
    const rank = Number(item.Rank);

    if (!word || !Number.isFinite(rank)) continue;
    if (!map.has(word)) map.set(word, rank);
  }

  frequencyMap = map;
  return frequencyMap;
}

function getRank(map, ...candidates) {
  if (!map) return null;

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") continue;
    const cleaned = candidate.trim();
    if (!cleaned) continue;

    const rank = map.get(cleaned);
    if (typeof rank === "number") return rank;
  }

  return null;
}

function truncate(text, max) {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

function getPrimaryJapaneseEntry(entry) {
  if (!entry || !Array.isArray(entry.japanese) || entry.japanese.length === 0) {
    return {};
  }

  const exactWord = entry.japanese.find((jp) => jp && jp.word);
  if (exactWord) return exactWord;

  const withReading = entry.japanese.find((jp) => jp && jp.reading);
  if (withReading) return withReading;

  return entry.japanese[0] || {};
}

function formatTitle(word, reading) {
  if (word && reading && word !== reading) return `${word} 【${reading}】`;
  return word || reading || "Unknown";
}

function formatDefinitions(senses) {
  if (!Array.isArray(senses) || senses.length === 0) {
    return "No definitions found.";
  }

  const sections = [];

  for (let i = 0; i < senses.length && sections.length < 5; i++) {
    const sense = senses[i];
    if (!sense) continue;

    const defs = Array.isArray(sense.english_definitions)
      ? sense.english_definitions.filter(Boolean).join(", ")
      : "";

    if (!defs) continue;

    const parts = Array.isArray(sense.parts_of_speech)
      ? sense.parts_of_speech.filter(Boolean).join(", ")
      : "";

    if (parts) {
      sections.push(`${i + 1}. *${parts}*\n${defs}`);
    } else {
      sections.push(`${i + 1}. ${defs}`);
    }
  }

  if (!sections.length) return "No definitions found.";

  return truncate(sections.join("\n\n"), 1024);
}

function formatTags(tags) {
  if (!Array.isArray(tags) || !tags.length) return null;
  const value = tags.filter(Boolean).join(", ");
  return value ? truncate(value, 1024) : null;
}

function formatJlpt(jlpt) {
  if (!Array.isArray(jlpt) || !jlpt.length) return null;
  const value = jlpt.filter(Boolean).join(", ");
  return value ? truncate(value, 1024) : null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("jisho")
    .setDescription("Look up a Japanese word and show its Jiten rank")
    .setIntegrationTypes(AppIntegrationType.UserInstall)
    .addStringOption((option) =>
      option
        .setName("word")
        .setDescription("The Japanese word to look up")
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const query = interaction.options.getString("word", true).trim();

    if (!query) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Please provide a word to look up`,
      );
    }

    let freqMap;

    try {
      freqMap = loadFrequencyMap();
    } catch (error) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Failed to load Frequencies.json: ${error.message}`,
      );
    }

    let result;

    try {
      result = await jisho.searchForPhrase(query);
    } catch (error) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Failed to contact Jisho: ${error.message}`,
      );
    }

    if (!result || !Array.isArray(result.data) || result.data.length === 0) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  No results found for \`${query}\``,
      );
    }

    const first = result.data[0];
    const jp = getPrimaryJapaneseEntry(first);
    const displayWord = jp.word || first.slug || query;
    const displayReading = jp.reading || displayWord;
    const definitions = formatDefinitions(first.senses);
    const jitenRank = getRank(freqMap, displayWord, first.slug, query);
    const tags = formatTags(first.tags);
    const jlpt = formatJlpt(first.jlpt);

    const embed = new EmbedBuilder()
      .setColor(colors.main)
      .setTitle(formatTitle(displayWord, displayReading))
      .addFields(
        {
          name: "Reading",
          value: truncate(displayReading || "Unknown", 1024),
          inline: true,
        },
        {
          name: "Jiten Rank",
          value: jitenRank ? `#${jitenRank}` : "Not found",
          inline: true,
        },
        {
          name: "Definitions",
          value: definitions,
        },
      );

    if (tags) {
      embed.addFields({
        name: "Tags",
        value: tags,
      });
    }

    if (jlpt) {
      embed.addFields({
        name: "JLPT",
        value: jlpt,
        inline: true,
      });
    }

    return interaction.editReply({ embeds: [embed] });
  },
};