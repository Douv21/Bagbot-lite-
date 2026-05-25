const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadGuildConfig } = require('../../utils/leveling');
const { addBalance } = require('../../utils/economy');

module.exports = {
  name: 'reveiller',
  data: new SlashCommandBuilder()
    .setName('reveiller')
    .setDescription('Réveiller quelqu\'un')
    .addUserOption(option => option.setName('cible').setDescription('Personne (optionnel)').setRequired(false))
    .setDMPermission(true),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const config = loadGuildConfig(interaction.guild.id);
    
    if (!config?.actions?.enabled) return interaction.editReply({ content: '❌ Actions désactivées', ephemeral: true });
    const actionConfig = config.actions.commands?.['reveiller'];
    if (!actionConfig?.enabled) return interaction.editReply({ content: '❌ Action désactivée', ephemeral: true });

    let target = interaction.options.getUser('cible');
    if (!target) {
      const members = await interaction.guild.members.fetch({ limit: 100 });
      const randomMember = members.filter(m => m.id !== interaction.user.id).random();
      target = randomMember ? randomMember.user : interaction.user;
    }

    const author = interaction.user;
    const minReward = actionConfig.rewardMin || 5;
    const maxReward = actionConfig.rewardMax || 15;
    const reward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
    const newBalance = addBalance(interaction.guild.id, author.id, reward);

    let message;
    if (actionConfig.messages && actionConfig.messages.length > 0) {
      message = actionConfig.messages[Math.floor(Math.random() * actionConfig.messages.length)];
    } else {
      message = `${author} réveille ${target} !`;
    }

    const embed = new EmbedBuilder()
      .setTitle('⏰ Réveiller')
      .setDescription(`${message}\n\n💰 +${reward} BAG`)
      .setColor(0x8B0000)
      .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
      .setFooter({ text: `Nouveau solde: ${newBalance} BAG` })
      .setTimestamp();

    try {
      await interaction.user.send({ embeds: [embed] });
      await interaction.editReply({ content: '✅ Action envoyée en message privé !' });
    } catch {
      await interaction.editReply({ embeds: [embed] });
    }
  }
};
