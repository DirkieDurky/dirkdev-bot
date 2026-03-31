import { SlashCommandBuilder } from 'discord.js';
import { parseSingleDate, formatDate, formatDateShort, formatDateTime } from '../../helpers.mjs';
import * as googleCalendar from "../../googleCalendar.mjs";
import 'dotenv/config';

export const data = new SlashCommandBuilder().setName('add').setDescription('Adds a session to the calendar')
    .addStringOption((option) => option.setName("date").setDescription("The date to add a session at").setRequired(true));

export async function execute(interaction) {
    console.log(`Add command executed with date: ${interaction.options.getString("date")}`)
    const parseInfo = parseSingleDate(interaction.options.getString("date"), true);
    const isSession = parseInfo[0];

    if (!isSession) {
        const startDateTime = parseInfo[1];
        const endDateTime = parseInfo[2];
        console.log(`Parsed session: From ${formatDateTime(startDateTime)} to ${formatDateTime(endDateTime)} on ${formatDateShort(startDateTime)}`);
        await googleCalendar.createEvent(process.env.CALENDAR_ID, startDateTime, endDateTime);
        await interaction.reply(`Added session from ${formatDateTime(startDateTime)} to ${formatDateTime(endDateTime)} on ${formatDateShort(startDateTime)}`);
    } else {
        const session = parseInfo[1];
        const startDateTime = session[0];
        const endDateTime = session[1];
        await googleCalendar.createEvent(process.env.CALENDAR_ID, startDateTime, endDateTime);
        await interaction.reply(`Added session at ${formatDateShort(startDateTime)} from ${formatDateTime(startDateTime)} to ${formatDateTime(endDateTime)}`);
    }
}
