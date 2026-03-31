import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { Client, Collection, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import 'dotenv/config';
import * as googleCalendar from "./googleCalendar.mjs";
import { dirname, parseDate, dateRegex, sessionRegex, parseSession, eveningDateRegex } from "./helpers.mjs";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
    try {
        if (message.author.bot) return;
        console.log("Message received.");

        if (process.env.DEBUG == "true" && message.channelId === process.env.DISCORD_DEBUG_TARGET_CHANNEL_ID) {
            console.log("Debug mode is enabled and test channel is used. Ignoring channel and author check.");
        }
        else {
            if (message.channelId !== process.env.DISCORD_TARGET_CHANNEL_ID) {
                console.log("Channel doesn't match");
                return;
            }
            if (!process.env.DISCORD_TARGET_AUTHOR_IDS.split(',').includes(message.author.id)) {
                console.log("Author doesn't match");
                return;
            }
        }
        console.log("Channel and author correct");

        const doneDates = [];
        console.log("Complex dates:"); // (or sessions)

        const sessionStrings = message.content.match(sessionRegex);

        if (sessionStrings === null) {
            console.log("No complex dates found.");
        } else {
            console.log("Found these dates in the message:");
            console.log(sessionStrings);

            console.log("Those parse to the following dates:");
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

        console.log("Simple dates:");
        console.log("Evening:");
        await handleSimpleDates(true, message.content, doneDates);
        console.log("Non-evening:");
        await handleSimpleDates(false, message.content, doneDates);
    } catch (err) {
        console.error(`Error: ${err}`);
    }
});

async function handleSimpleDates(evening, input, doneDates) {
    let dateStrings;
    if (evening) {
        dateStrings = input.match(eveningDateRegex);
    } else {
        dateStrings = input.match(dateRegex);
    }

    if (dateStrings === null) {
        console.log("No dates found.");
        return;
    }

    // Filter out dates that were already covered by the complex check
    dateStrings = dateStrings.filter(e => !doneDates.some(e2 => {
        const date = parseDate(e);
        const doneDate = [date.getDate(), date.getMonth()];
        return JSON.stringify(doneDate) === JSON.stringify(e2);
    }));

    if (dateStrings.length === 0) {
        console.log("No simple dates found.");
    } else {
        console.log("Found these dates in the message:");
        console.log(dateStrings);

        const dates = [];
        for (const dateStr of dateStrings) {
            const date = parseDate(dateStr);
            const doneDate = [date.getDate(), date.getMonth()];
            doneDates.push(doneDate);
            dates.push(date);
        }

        for (let date of dates) {
            const startDateTime = new Date(date.getTime());
            const endDateTime = new Date(date.getTime());
            if (evening) {
                startDateTime.setHours(19);
                startDateTime.setMinutes(0);
                endDateTime.setHours(21);
                endDateTime.setMinutes(15);
            } else {
                startDateTime.setHours(13);
                startDateTime.setMinutes(30);
                endDateTime.setHours(15);
                endDateTime.setMinutes(45);
            }
            await googleCalendar.createEvent(process.env.CALENDAR_ID, startDateTime, endDateTime);
        }
    }
}

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
            console.log("Channel doesn't match");
            return;
        }
        if (process.env.LOCK !== "true") {
            console.log("Lock disabled. Skipping author check.")
        } else {
            if (!process.env.DISCORD_TARGET_AUTHOR_IDS.split(',').includes(interaction.member.id)) {
                console.log("Author doesn't match");
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

client.on('error', err => {
    console.error('Client error:', err);
});

client.on('shardError', err => {
    console.error('Shard error:', err);
});

process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', err => {
    console.error('Unhandled Rejection:', err);
});

client.login(process.env.DISCORD_APP_TOKEN);
