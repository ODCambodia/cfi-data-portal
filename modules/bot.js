import TelegramBot from 'node-telegram-bot-api';
import UserDAO from '../database/user.js';

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const loginCommands = ['/login', '/login@cfi_authorize_bot', '/login@cfr_authorize_bot'];

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  const user = msg.from;
  console.log(JSON.stringify(msg));
  if (loginCommands.includes(messageText) && !msg.from.is_bot) {
    bot.sendMessage(chatId, 'Received your message, Waiting for admin approval');
    const payload = { user_id: user.id, username: user.username };
    UserDAO.insert(payload);
    console.log(UserDAO);
  }

});

export default bot;
