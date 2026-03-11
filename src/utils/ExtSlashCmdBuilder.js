const { SlashCommandBuilder: DJSSlashCommandBuilder } = require("discord.js");

const AppIntegrationType = Object.freeze({
  GuildInstall: 0,

  UserInstall: 1,
});

const InteractionContextType = Object.freeze({
  Guild: 0,

  BotDM: 1,

  PrivateChannel: 2,
});

class SlashCommandBuilder extends DJSSlashCommandBuilder {
  _integrationTypes = [AppIntegrationType.GuildInstall];

  _contexts = [
    InteractionContextType.Guild,
    InteractionContextType.BotDM,
    InteractionContextType.PrivateChannel,
  ];

  get integrationTypes() {
    return this._integrationTypes;
  }

  get contexts() {
    return this._contexts;
  }

  setIntegrationTypes(...types) {
    this._integrationTypes = types;
    return this;
  }

  setContexts(...contexts) {
    this._contexts = contexts;
    return this;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      integration_types: this.integrationTypes,
      contexts: this.contexts,
    };
  }
}

module.exports = {
  AppIntegrationType,
  InteractionContextType,
  SlashCommandBuilder,
};
