import { Client, Events, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import * as googleCalendar from "./googleCalendar.mjs";
import { formatDate } from "./helpers.mjs";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const calendarApi = await googleCalendar.authorizeGoogleAPI();

client.once(Events.ClientReady, (readyClient) => {
    console.log(formatDate(new Date()), "|", `Ready! Logged in as ${readyClient.user.tag}`);
});

const months = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

const now = new Date();
const currentYear = now.getFullYear();
function parseDate(date) {
    const split = date.split(' ');
    const month = months.indexOf(split[1]);
    let year = currentYear;
    if (month < now.getMonth()) {
        year++;
    }
    const day = split[0];
    return new Date(year, month, day);
};

client.on(Events.MessageCreate, async (message) => {
    try {
        if (message.author.bot) return;
        console.log(formatDate(new Date()), "|", "Message received.");

        if (process.env.DEBUG && message.channelId === process.env.DISCORD_DEBUG_TARGET_CHANNEL_ID) {
            console.log("Debug mode is enabled and test channel is used. Ignoring channel and author check.");
        }
        else {
            if (message.channelId !== process.env.DISCORD_TARGET_CHANNEL_ID) {
                console.log(formatDate(new Date()), "|", "Channel doesn't match");
                return;
            }
            if (message.author.id !== process.env.DISCORD_TARGET_AUTHOR_ID) {
                console.log(formatDate(new Date()), "|", "Author doesn't match");
                return;
            }
        }
        console.log(formatDate(new Date()), "|", "Channel and author correct");

        const dateRegex = new RegExp(`\\d{1,2} (${months.join("|")})`, "g");
        const dateStrings = message.content.match(dateRegex);

        if (dateStrings === null) {
            console.log(formatDate(new Date()), "|", "No dates found.");
            return;
        }

        console.log(formatDate(new Date()), "|", "Found these dates in the message:");
        console.log(formatDate(new Date()), "|", dateStrings);

        console.log(formatDate(new Date()), "|", "Those parse to the following dates:");
        const dates = [];
        for (const dateStr of dateStrings) {
            const date = parseDate(dateStr);
            dates.push(date);
            console.log(date.toString());
        }

        for (let date of dates) {
            const startDateTime = new Date(date.getTime());
            startDateTime.setHours(13);
            startDateTime.setMinutes(30);
            const endDateTime = new Date(date.getTime());
            endDateTime.setHours(15);
            endDateTime.setMinutes(45);
            await googleCalendar.createEvent(calendarApi, process.env.CALENDAR_ID, startDateTime, endDateTime);
        }
    } catch (err) {
        console.error(`Error: ${err}`);
    }
});

client.login(process.env.DISCORD_APP_TOKEN);
