import { SlashCommandBuilder } from 'discord.js';
import { parseSingleDate, formatDate } from '../../helpers.mjs';
import * as googleCalendar from "../../googleCalendar.mjs";
import 'dotenv/config';

export const data = new SlashCommandBuilder().setName('removeall').setDescription('Removes all sessions within a range (inclusive on both sides) from the calendar.')
    .addStringOption((option) => option.setName("from-date").setDescription("The starting date of the range").setRequired(true))
    .addStringOption((option) => option.setName("to-date").setDescription("The end date of the range").setRequired(true));

export async function execute(interaction) {
    console.log(`Removeall command executed with dates: ${interaction.options.getString("from-date")}, ${interaction.options.getString("to-date")}`)
    const fromDate = parseSingleDate(interaction.options.getString("from-date"));
    const toDate = parseSingleDate(interaction.options.getString("to-date"));
    console.log(`Parsed dates: ${formatDate(fromDate)}, ${formatDate(toDate)}`);

    const startDateTime = new Date(fromDate.getTime());
    startDateTime.setHours(0);
    startDateTime.setMinutes(0);

    const endDateTime = new Date(toDate.getTime());
    endDateTime.setHours(0);
    endDateTime.setMinutes(0);
    endDateTime.setDate(endDateTime.getDate() + 1);

    const removedAmount = await googleCalendar.clearDays(process.env.CALENDAR_ID, startDateTime, endDateTime);
    await interaction.reply(`Removed ${removedAmount ?? 0} session${removedAmount == 1 ? "" : "s"} `);
}
