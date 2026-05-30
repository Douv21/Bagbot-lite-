const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getBalance, addBalance, setBalance } = require('../utils/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('boutique')
    .setDescription('Affiche la boutique du serveur'),

  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      // Get shop configuration from guild config file
      const configPath = path.join(__dirname, '../../configs', `${interaction.guildId}.json`);
      
      if (!fs.existsSync(configPath)) {
        await interaction.editReply({ content: '❌ La boutique n\'est pas configurée pour ce serveur.' });
        return;
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      if (!config.shop || !config.shop.enabled || !config.shop.items || config.shop.items.length === 0) {
        await interaction.editReply({ content: '❌ La boutique est désactivée ou vide.' });
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

      // Generate select menu for items
      const generateSelectMenu = (page) => {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = shopItems.slice(start, end);

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('buy_item')
          .setPlaceholder('Sélectionner un item à acheter...');

        pageItems.forEach((item, index) => {
          const option = new StringSelectMenuOptionBuilder()
            .setLabel(`${item.name} - ${item.price} ${currencyName}`)
            .setDescription(item.description || 'Pas de description')
            .setValue(`${start + index}`);
          selectMenu.addOptions(option);
        });

        return selectMenu;
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
      const message = await interaction.editReply({
        embeds: [generateEmbed(currentPage)],
        components: [
          new ActionRowBuilder().addComponents(generateSelectMenu(currentPage)),
          generateButtons(currentPage)
        ]
      });

      // Create collector for button interactions
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType,
        time: 60000 // 1 minute
      });

      collector.on('collect', async (i) => {
        if (i.customId === 'prev') {
          currentPage--;
          await i.update({
            embeds: [generateEmbed(currentPage)],
            components: [
              new ActionRowBuilder().addComponents(generateSelectMenu(currentPage)),
              generateButtons(currentPage)
            ]
          });
        } else if (i.customId === 'next') {
          currentPage++;
          await i.update({
            embeds: [generateEmbed(currentPage)],
            components: [
              new ActionRowBuilder().addComponents(generateSelectMenu(currentPage)),
              generateButtons(currentPage)
            ]
          });
        } else if (i.customId === 'buy_item') {
          const itemIndex = parseInt(i.values[0]);
          const item = shopItems[itemIndex];
          
          if (!item) {
            await i.reply({ content: '❌ Item introuvable.', ephemeral: true });
            return;
          }

          const userBalance = await getBalance(interaction.guildId, i.user.id);
          
          if (userBalance < item.price) {
            await i.reply({ content: `❌ Solde insuffisant. Vous avez ${userBalance} ${currencyName}, mais il faut ${item.price} ${currencyName}.`, ephemeral: true });
            return;
          }

          // Process purchase
          await setBalance(interaction.guildId, i.user.id, userBalance - item.price);

          let successMessage = `✅ Vous avez acheté **${item.name}** pour ${item.price} ${currencyName} !`;

          if (item.type === 'role' || item.type === 'temp_role') {
            const role = await interaction.guild.roles.fetch(item.role).catch(() => null);
            if (role) {
              await i.member.roles.add(role);
              if (item.type === 'temp_role') {
                // Remove role after specified time (if duration is set)
                const duration = item.duration || 3600000; // Default 1 hour
                setTimeout(async () => {
                  await i.member.roles.remove(role).catch(() => {});
                }, duration);
              }
            }
          } else if (item.type === 'xp') {
            const { addXP } = require('../utils/economy');
            addXP(interaction.guildId, i.user.id, item.xp);
            successMessage += `\n✨ +${item.xp} XP ajoutés !`;
          }

          await i.reply({ content: successMessage, ephemeral: true });
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
          await message.edit({ components: [] }).catch(() => {});
        }
      });

    } catch (error) {
      console.error('Error executing boutique command:', error);
      await interaction.editReply({ content: '❌ Une erreur est survenue lors de l\'affichage de la boutique.' }).catch(() => {});
    }
  }
};
