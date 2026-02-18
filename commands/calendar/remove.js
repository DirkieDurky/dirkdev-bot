import { SlashCommandBuilder } from 'discord.js';
import { parseSingleDate, formatDate } from '../../helpers.mjs';
import * as googleCalendar from "../../googleCalendar.mjs";
import 'dotenv/config';

export const data = new SlashCommandBuilder().setName('remove').setDescription('Removes a session from the calendar')
    .addStringOption((option) => option.setName("date").setDescription("The date to remove all sessions from").setRequired(true));

export async function execute(interaction) {
    console.log(`Remove command executed with date: ${interaction.options.getString("date")}`)
    const date = parseSingleDate(interaction.options.getString("date"));
    console.log(`Parsed date: ${formatDate(date)}`);

    const startDateTime = new Date(date.getTime());
    startDateTime.setHours(0);
    startDateTime.setMinutes(0);

    const endDateTime = new Date(startDateTime.getTime());
    endDateTime.setDate(startDateTime.getDate() + 1);
    const removedAmount = await googleCalendar.clearDays(process.env.CALENDAR_ID, startDateTime, endDateTime);
    await interaction.reply(`Removed ${removedAmount ?? 0} session${removedAmount == 1 ? "" : "s"}`);
}
