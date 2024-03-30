const { SlashCommandBuilder: DJSSlashCommandBuilder } = require("discord.js");

const AppIntegrationType = Object.freeze({
  // App is installable to servers
  GuildInstall: 0,

  // App is installable to users
  UserInstall: 1,
});

const InteractionContextType = Object.freeze({
  // Interaction can be used within servers
  Guild: 0,

  // Interaction can be used within DMs with the app's bot user
  BotDM: 1,

  // Interaction can be used within Group DMs and DMs other than the app's bot user
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
