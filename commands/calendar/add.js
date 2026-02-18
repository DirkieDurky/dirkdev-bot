import { SlashCommandBuilder } from 'discord.js';
import { parseSingleDate, formatDate } from '../../helpers.mjs';
import * as googleCalendar from "../../googleCalendar.mjs";
import 'dotenv/config';

export const data = new SlashCommandBuilder().setName('add').setDescription('Adds a session to the calendar')
    .addStringOption((option) => option.setName("date").setDescription("The date to add a session at").setRequired(true));

export async function execute(interaction) {
    console.log(`Add command executed with date: ${interaction.options.getString("date")}`)
    const date = parseSingleDate(interaction.options.getString("date"));
    console.log(`Parsed date: ${formatDate(date)}`);
    const startDateTime = new Date(date.getTime());
    startDateTime.setHours(13);
    startDateTime.setMinutes(30);
    const endDateTime = new Date(date.getTime());
    endDateTime.setHours(15);
    endDateTime.setMinutes(45);
    await googleCalendar.createEvent(process.env.CALENDAR_ID, startDateTime, endDateTime);
    await interaction.reply('Added session!');
}
