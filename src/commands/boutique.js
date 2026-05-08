const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('boutique')
    .setDescription('Affiche la boutique du serveur'),

  async execute(interaction) {
    try {
      // Get shop configuration from guild config file
      const configPath = path.join(__dirname, '../../configs', `${interaction.guildId}.json`);
      
      if (!fs.existsSync(configPath)) {
        await interaction.reply({ content: '❌ La boutique n\'est pas configurée pour ce serveur.', ephemeral: true });
        return;
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      if (!config.shop || !config.shop.enabled || !config.shop.items || config.shop.items.length === 0) {
        await interaction.reply({ content: '❌ La boutique est désactivée ou vide.', ephemeral: true });
        return;
      }

      const shopItems = config.shop.items;
      const currencyName = config.shop.currencyName || 'BAG';
      const itemsPerPage = 5;
      let currentPage = 0;

      // Generate embed for current page
      const generateEmbed = (page) => {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = shopItems.slice(start, end);

        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('🛒 Boutique')
          .setDescription(`Achetez des items, rôles et XP avec vos ${currencyName} !`)
          .setTimestamp();

        if (pageItems.length === 0) {
          embed.addFields({ name: 'Aucun item', value: 'La boutique est vide.' });
        } else {
          pageItems.forEach((item, index) => {
            let value = `${item.description || 'Pas de description'}\n💰 Prix: ${item.price} ${currencyName}`;
            if (item.type === 'role' || item.type === 'temp_role') {
              value += `\n🎭 Rôle: <@&${item.role}>`;
            } else if (item.type === 'xp') {
              value += `\n✨ XP: ${item.xp}`;
            }
            embed.addFields({ name: `${start + index + 1}. ${item.name}`, value });
          });
        }

        embed.setFooter({ text: `Page ${page + 1}/${Math.ceil(shopItems.length / itemsPerPage)}` });
        return embed;
      };

      // Generate buttons for pagination
      const generateButtons = (page) => {
        const row = new ActionRowBuilder();
        
        const totalPages = Math.ceil(shopItems.length / itemsPerPage);
        
        row.addComponents(
          new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('◀ Précédent')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Suivant ▶')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages - 1)
        );

        return row;
      };

      // Send initial message
      const message = await interaction.reply({
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons(currentPage)],
        fetchReply: true
      });

      // Create collector for button interactions
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000 // 1 minute
      });

      collector.on('collect', async (i) => {
        if (i.customId === 'prev') {
          currentPage--;
        } else if (i.customId === 'next') {
          currentPage++;
        }

        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [generateButtons(currentPage)]
        });
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
          await message.edit({ components: [] });
        }
      });

    } catch (error) {
      console.error('Error executing boutique command:', error);
      await interaction.reply({ content: '❌ Une erreur est survenue lors de l\'affichage de la boutique.', ephemeral: true });
    }
  }
};
