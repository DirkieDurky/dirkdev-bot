import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once(Events.ClientReady, c => console.log('ready', c.user.id));
client.ws.on('INTERACTION_CREATE', p => console.log('raw', p));
client.on(Events.InteractionCreate, i => console.log('dispatched', i.type, i.isChatInputCommand?.() ? i.commandName : '(not chat)'));
await client.login(process.env.DISCORD_APP_TOKEN);
