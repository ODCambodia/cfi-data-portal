import TelegramBot from 'node-telegram-bot-api';
import UserDAO from '../database/user.js';

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const loginCommands = ['/login', '/login@cfi_authorize_bot'];

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  const user = msg.from;
  let type = null;

  if (chatId.toString() === process.env.CFI_GROUP_CHAT_ID) {
    type = 'cfi';
  } else if (chatId.toString() === process.env.CFR_GROUP_CHAT_ID) {
    type = 'cfr';
  }

  const isLoginRequest = loginCommands.includes(messageText) && !msg.from.is_bot && type !== null;

  if (isLoginRequest) {
    bot.sendMessage(chatId, 'Received your message, Waiting for admin approval');
    const payload = { user_id: user.id, username: user.username, firstname: user.first_name || null, lastname: user.last_name || null, type };
    UserDAO.insert(payload);
    console.log(UserDAO);
  }

});

export default bot;
