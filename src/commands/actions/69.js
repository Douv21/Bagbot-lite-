const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadGuildConfig } = require('../../utils/leveling');
const { addBalance, addXP, getLevel, getXPToNextLevel } = require('../../utils/economy');

module.exports = {
  name: '69',
  data: new SlashCommandBuilder()
    .setName('69')
    .setDescription('Position 69 avec quelqu\'un')
    .addUserOption(option => option.setName('cible').setDescription('Personne (optionnel)').setRequired(false))
    .setDMPermission(true),

  async execute(interaction) {
    await interaction.deferReply();
    
    const config = loadGuildConfig(interaction.guild.id);
    
    if (!config?.actions?.enabled) return interaction.editReply({ content: '❌ Actions désactivées', ephemeral: true });
    const actionConfig = config.actions.commands?.['69'];
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
    const xpReward = Math.floor(reward / 2); // XP is half of the balance reward
    const newXP = addXP(interaction.guild.id, author.id, xpReward);
    const level = getLevel(interaction.guild.id, author.id);
    const xpToNextLevel = getXPToNextLevel(interaction.guild.id, author.id);

    let message;
    if (actionConfig.messages && actionConfig.messages.length > 0) {
      message = actionConfig.messages[Math.floor(Math.random() * actionConfig.messages.length)];
    } else {
      message = `${author} fait un 69 avec ${target} !`;
    }

    const embed = new EmbedBuilder()
      .setTitle('🔞 69')
      .setDescription(`${message}\n\n💰 +${reward} BAG\n✨ +${xpReward} XP`)
      .setColor(0x8B0000)
      .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
      .setFooter({ text: `Nouveau solde: ${newBalance} BAG | Niveau ${level} (${newXP}/${xpToNextLevel} XP)` })
      .setTimestamp();

    let targetChannel = interaction.channel;
    if (actionConfig.channel) targetChannel = await interaction.guild.channels.fetch(actionConfig.channel).catch(() => interaction.channel);

    if (targetChannel.id !== interaction.channel.id) {
      await interaction.editReply({ content: '✅ Action envoyée !' });
      await targetChannel.send({ embeds: [embed] });
    } else {
      await interaction.editReply({ embeds: [embed] });
    }
  }
};
