import { SlashCommandBuilder } from 'discord.js';
import { parseSingleDate, formatDate } from '../../helpers.mjs';
import * as googleCalendar from "../../googleCalendar.mjs";
import 'dotenv/config';

export const data = new SlashCommandBuilder().setName('move').setDescription('Moves a session from one day to another')
    .addStringOption((option) => option.setName("from-date").setDescription("The date to move sessions from").setRequired(true))
    .addStringOption((option) => option.setName("to-date").setDescription("The date to move sessions to").setRequired(true));

export async function execute(interaction) {
    console.log(`Move command executed with dates: ${interaction.options.getString("from-date")}, ${interaction.options.getString("to-date")}`)
    const fromDate = parseSingleDate(interaction.options.getString("from-date"));
    const toDate = parseSingleDate(interaction.options.getString("to-date"));
    console.log(`Parsed dates: ${formatDate(fromDate)}, ${formatDate(toDate)}`);

    await googleCalendar.moveEvents(process.env.CALENDAR_ID, fromDate, toDate);
    await interaction.reply(`Moved sessions from ${formatDate(fromDate)} to ${formatDate(toDate)}`);
}
