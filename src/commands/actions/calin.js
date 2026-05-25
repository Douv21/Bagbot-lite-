const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadGuildConfig } = require('../../utils/leveling');
const { addBalance } = require('../../utils/economy');

module.exports = {
  name: 'calin',
  data: new SlashCommandBuilder()
    .setName('calin')
    .setDescription('Faire un câlin à quelqu\'un')
    .addUserOption(option => option.setName('cible').setDescription('Personne à câliner (optionnel)').setRequired(false))
    .setDMPermission(true),

  async execute(interaction) {
    await interaction.deferReply();
    
    const config = loadGuildConfig(interaction.guildId);
    const actionConfig = config?.actions?.commands?.['calin'] || { enabled: true, rewardMin: 5, rewardMax: 15, messages: [] };
    if (actionConfig.enabled === false) return interaction.editReply({ content: '❌ Action désactivée', ephemeral: true });

    let target = interaction.options.getUser('cible');
    if (!target) {
      if (interaction.guild) {
        const members = await interaction.guild.members.fetch({ limit: 100 });
        const randomMember = members.filter(m => m.id !== interaction.user.id).random();
        target = randomMember ? randomMember.user : interaction.user;
      } else {
        target = interaction.user;
      }
    }

    const author = interaction.user;
    const minReward = actionConfig.rewardMin || 5;
    const maxReward = actionConfig.rewardMax || 15;
    const reward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
    
    // Only give money in guild, not in DM
    let newBalance = reward;
    if (interaction.guild) {
      newBalance = await addBalance(interaction.guild.id, author.id, reward);
    }

    let message;
    if (actionConfig.messages && actionConfig.messages.length > 0) {
      message = actionConfig.messages[Math.floor(Math.random() * actionConfig.messages.length)];
    } else {
      message = `${author} fait un câlin à ${target} !`;
    }

    const embed = new EmbedBuilder()
      .setTitle('🤗 Câlin')
      .setDescription(`${message}\n\n💰 +${reward} BAG`)
      .setColor(0x8B0000)
      .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
      .setFooter({ text: `Nouveau solde: ${newBalance} BAG` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
