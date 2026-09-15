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
// Accepts many time formats and converts to a normalized "HH:MM" (24-hour).
// Examples that all work: 20:00, 20.00, 8pm, 8 pm, 8:00pm, 8.00 PM, 08:00, 9am, 9.30am
function parseTime(raw) {
  const str = raw.trim().toLowerCase().replace(/\s+/g, '');

  // Match optional hour, optional (: or .) + minutes, optional am/pm
  const match = str.match(/^(\d{1,2})(?:[:.](\d{2}))?(am|pm)?$/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3];

  if (minute > 59) return null;

  if (meridiem) {
    // 12-hour format with am/pm
    if (hour < 1 || hour > 12) return null;
    if (meridiem === 'am') {
      hour = (hour === 12) ? 0 : hour;
    } else {
      hour = (hour === 12) ? 12 : hour + 12;
    }
  } else {
    // 24-hour format, no am/pm given
    if (hour > 23) return null;
  }

  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm}`;
}

// ---------- Commands ----------

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
`👋 Welcome! Here's what I can do:

⏰ Daily reminders (time format is flexible — I'll auto-detect it):
/remind TIME Your message
Examples that all work:
/remind 20:00 Study Java
/remind 8pm Study Java
/remind 8:00pm Study Java
/remind 20.00 Study Java
I'll always confirm back the exact time I understood.

📋 View/delete reminders:
/list
/delremind ID

✅ Simple tasks (no time, just a to-do list):
/task Your task text
/tasks
/donetask ID

Your chat ID for reference: ${chatId}`);
});

// /remind 20:00 Study Java   (also accepts 8pm, 8:00pm, 20.00, 8.00 PM, etc.)
bot.onText(/\/remind (\S+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const rawTime = match[1];
  const text = match[2];

  const time = parseTime(rawTime);

  if (!time) {
    bot.sendMessage(chatId,
      `⚠️ Couldn't understand the time "${rawTime}".\n` +
      `Try formats like: 20:00, 20.00, 8pm, 8:00pm, 8.00 PM, 08:00`);
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

  // Show 12-hour version too so the user can double check it detected correctly
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const friendly = `${h12}:${String(m).padStart(2, '0')} ${period}`;

  bot.sendMessage(chatId,
    `✅ Got it — daily reminder confirmed for ${time} (${friendly}): "${text}" (ID: ${reminder.id})`);
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
