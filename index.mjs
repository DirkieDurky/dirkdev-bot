import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { Client, Collection, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import 'dotenv/config';
import * as googleCalendar from "./googleCalendar.mjs";
import { formatDate, dirname, parseDate, dateRegex, sessionRegex, parseSession } from "./helpers.mjs";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

client.once(Events.ClientReady, async (readyClient) => {
    console.log(formatDate(new Date()), "|", `Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
    try {
        if (message.author.bot) return;
        console.log(formatDate(new Date()), "|", "Message received.");

        if (process.env.DEBUG == "true" && message.channelId === process.env.DISCORD_DEBUG_TARGET_CHANNEL_ID) {
            console.log("Debug mode is enabled and test channel is used. Ignoring channel and author check.");
        }
        else {
            if (message.channelId !== process.env.DISCORD_TARGET_CHANNEL_ID) {
                console.log(formatDate(new Date()), "|", "Channel doesn't match");
                return;
            }
            if (!process.env.DISCORD_TARGET_AUTHOR_IDS.split(',').includes(message.author.id)) {
                console.log(formatDate(new Date()), "|", "Author doesn't match");
                return;
            }
        }
        console.log(formatDate(new Date()), "|", "Channel and author correct");

        const doneDates = [];
        console.log(formatDate(new Date()), "|", "Complex dates:");

        const sessionStrings = message.content.match(sessionRegex);

        if (sessionStrings === null) {
            console.log(formatDate(new Date()), "|", "No dates found.");
        } else {
            console.log(formatDate(new Date()), "|", "Found these dates in the message:");
            console.log(formatDate(new Date()), "|", sessionStrings);

            console.log(formatDate(new Date()), "|", "Those parse to the following dates:");
            const sessions = [];
            for (const sessionStr of sessionStrings) {
                const session = parseSession(sessionStr);
                sessions.push(session);
                const doneDate = [session[0].getDate(), session[0].getMonth()];
                if (doneDates.some(elem => {
                    return JSON.stringify(doneDate) === JSON.stringify(elem);
                })) continue;
                doneDates.push(doneDate);
                console.log(doneDates);
            }

            for (let session of sessions) {
                await googleCalendar.createEvent(process.env.CALENDAR_ID, session[0], session[1]);
            }
        }

        console.log(formatDate(new Date()), "|", "Simple dates:");

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
            const doneDate = [date.getDate(), date.getMonth()];
            if (doneDates.some(elem => {
                return JSON.stringify(doneDate) === JSON.stringify(elem);
            })) continue;
            doneDates.push(doneDate);
            dates.push(date);
            console.log(doneDates);
        }

        for (let date of dates) {
            const startDateTime = new Date(date.getTime());
            startDateTime.setHours(13);
            startDateTime.setMinutes(30);
            const endDateTime = new Date(date.getTime());
            endDateTime.setHours(15);
            endDateTime.setMinutes(45);
            await googleCalendar.createEvent(process.env.CALENDAR_ID, startDateTime, endDateTime);
        }

    } catch (err) {
        console.error(`Error: ${err}`);
    }
});

client.commands = new Collection();

const foldersPath = path.join(dirname(), 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await import(pathToFileURL(filePath).href);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (process.env.DEBUG === "true" && interaction.channelId === process.env.DISCORD_DEBUG_TARGET_CHANNEL_ID) {
        console.log("Debug mode is enabled and test channel is used. Ignoring channel and author check.");
    }
    else {
        if (interaction.channelId !== process.env.DISCORD_TARGET_CHANNEL_ID) {
            console.log(formatDate(new Date()), "|", "Channel doesn't match");
            return;
        }
        if (process.env.LOCK !== "true") {
            console.log("Lock disabled. Skipping author check.")
        } else {
            if (!process.env.DISCORD_TARGET_AUTHOR_IDS.split(',').includes(interaction.member.id)) {
                console.log(formatDate(new Date()), "|", "Author doesn't match");
                return;
            }
        }
    }

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral,
            });
        }
    }
});

client.login(process.env.DISCORD_APP_TOKEN);
