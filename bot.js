require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.BOT_TOKEN;
const DB_FILE = path.join(__dirname, 'data.json');

if (!TOKEN) {
  console.error('ERROR: BOT_TOKEN is missing. Add it to your .env file.');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// ---------- Simple JSON storage ----------
function loadData() {
  if (!fs.existsSync(DB_FILE)) {
    return { reminders: [], tasks: [], nextId: 1 };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let db = loadData();

// ---------- Helpers ----------
function isValidTime(str) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(str);
}

// ---------- Commands ----------

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
`👋 Welcome! Here's what I can do:

⏰ Daily reminders:
/remind HH:MM Your message
Example: /remind 20:00 Study Java

📋 View/delete reminders:
/list
/delremind ID

✅ Simple tasks (no time, just a to-do list):
/task Your task text
/tasks
/donetask ID

Your chat ID for reference: ${chatId}`);
});

// /remind 20:00 Study Java
bot.onText(/\/remind (\S+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const time = match[1];
  const text = match[2];

  if (!isValidTime(time)) {
    bot.sendMessage(chatId, '⚠️ Time must be in 24-hour HH:MM format, e.g. 08:00 or 20:30.');
    return;
  }

  const reminder = {
    id: db.nextId++,
    chatId,
    time,
    text
  };
  db.reminders.push(reminder);
  saveData(db);

  bot.sendMessage(chatId, `✅ Daily reminder set for ${time}: "${text}" (ID: ${reminder.id})`);
});

bot.onText(/\/list/, (msg) => {
  const chatId = msg.chat.id;
  const mine = db.reminders.filter(r => r.chatId === chatId);
  if (mine.length === 0) {
    bot.sendMessage(chatId, 'No reminders set yet. Use /remind HH:MM message to add one.');
    return;
  }
  const lines = mine
    .sort((a, b) => a.time.localeCompare(b.time))
    .map(r => `ID ${r.id} — ${r.time} — ${r.text}`);
  bot.sendMessage(chatId, '📋 Your reminders:\n\n' + lines.join('\n'));
});

bot.onText(/\/delremind (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const id = parseInt(match[1], 10);
  const before = db.reminders.length;
  db.reminders = db.reminders.filter(r => !(r.id === id && r.chatId === chatId));
  saveData(db);

  if (db.reminders.length < before) {
    bot.sendMessage(chatId, `🗑️ Deleted reminder ID ${id}.`);
  } else {
    bot.sendMessage(chatId, `⚠️ No reminder found with ID ${id}.`);
  }
});

// /task Buy groceries
bot.onText(/\/task (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

  const task = { id: db.nextId++, chatId, text };
  db.tasks.push(task);
  saveData(db);

  bot.sendMessage(chatId, `✅ Task added: "${text}" (ID: ${task.id})`);
});

bot.onText(/\/tasks/, (msg) => {
  const chatId = msg.chat.id;
  const mine = db.tasks.filter(t => t.chatId === chatId);
  if (mine.length === 0) {
    bot.sendMessage(chatId, 'No tasks yet. Use /task your text to add one.');
    return;
  }
  const lines = mine.map(t => `ID ${t.id} — ${t.text}`);
  bot.sendMessage(chatId, '📝 Your tasks:\n\n' + lines.join('\n'));
});

bot.onText(/\/donetask (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const id = parseInt(match[1], 10);
  const before = db.tasks.length;
  db.tasks = db.tasks.filter(t => !(t.id === id && t.chatId === chatId));
  saveData(db);

  if (db.tasks.length < before) {
    bot.sendMessage(chatId, `✅ Task ID ${id} marked done and removed.`);
  } else {
    bot.sendMessage(chatId, `⚠️ No task found with ID ${id}.`);
  }
});

// ---------- Cron: check every minute for due reminders ----------
cron.schedule('* * * * *', () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hh}:${mm}`;

  db.reminders
    .filter(r => r.time === currentTime)
    .forEach(r => {
      bot.sendMessage(r.chatId, `⏰ Reminder: ${r.text}`);
    });
});

console.log('Bot is running and polling for messages...');
