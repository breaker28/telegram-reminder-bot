# Telegram Reminder Bot — Full Setup Guide (No Coding Experience Needed)

Follow every step in order. Don't skip any — each one depends on the last.

---

## PART 1 — Create Your Bot on Telegram

1. Open Telegram (phone or desktop).
2. In the search bar, type **@BotFather** and open the official BotFather chat (it has a blue checkmark).
3. Tap **Start**.
4. Send this command: `/newbot`
5. BotFather will ask for a **name** for your bot (this is just the display name, e.g. "My Reminder Bot"). Type it and send.
6. BotFather will ask for a **username** — it must be unique and end in "bot" (e.g. `akshay_reminder_bot`). Type it and send.
7. BotFather will reply with a message containing your **bot token** — a long string like:
   `123456789:AAExampleTokenxxxxxxxxxxxxxxxxxxx`
8. **Copy this token and save it somewhere safe** (like a notes app). Anyone with this token can control your bot, so don't share it publicly.

---

## PART 2 — Install the Tools on Your Computer

1. Go to https://nodejs.org
2. Download the **LTS version** (the one recommended for most users).
3. Run the installer, click Next through all steps, accept defaults, finish installation.
4. To confirm it installed correctly:
   - **Windows:** Press the Windows key, type `cmd`, open Command Prompt.
   - **Mac:** Open Spotlight (Cmd+Space), type `Terminal`, open it.
   - Type: `node -v` and press Enter. You should see a version number like `v20.11.0`. If you see an error, restart your computer and try again.

---

## PART 3 — Set Up the Bot Files

1. Download the project files (I've attached them below this guide).
2. Extract/place them into a folder, e.g. `telegram-reminder-bot` on your Desktop.
3. Open Command Prompt (Windows) or Terminal (Mac).
4. Navigate into that folder. Type `cd ` (with a space after) then drag the folder into the terminal window — it will auto-fill the path. Press Enter.
   - Example result: `cd C:\Users\YourName\Desktop\telegram-reminder-bot`
5. Find the file named `.env.example` inside the folder. Make a copy of it and rename the copy to exactly: `.env` (no ".example", nothing else).
6. Open `.env` in Notepad (Windows) or TextEdit (Mac).
7. Replace `paste_your_bot_token_here` with the token BotFather gave you in Part 1. Save and close.

---

## PART 4 — Install Dependencies

1. In the same Command Prompt/Terminal window (still inside the project folder), type:
   ```
   npm install
   ```
2. Press Enter. Wait — this downloads the small libraries the bot needs. It's done when you see your cursor blinking again with no errors in red.

---

## PART 5 — Run the Bot

1. In the same window, type:
   ```
   node bot.js
   ```
2. Press Enter. You should see: `Bot is running and polling for messages...`
3. Leave this window open — closing it stops the bot.
4. Go to Telegram, search for your bot by the username you created in Part 1, open the chat, and tap **Start** (or send `/start`).
5. You should get a welcome message back. Your bot is live.

---

## PART 6 — Using the Bot

- **Set a daily reminder:**
  `/remind 20:00 Study Java`
  → Sends "Study Java" every day at 8:00 PM (24-hour format, so 8 PM = 20:00).

- **See all reminders:**
  `/list`

- **Delete a reminder:**
  `/delremind 3` (use the ID number shown in /list)

- **Add a simple task (no time attached):**
  `/task Finish assignment`

- **See tasks:**
  `/tasks`

- **Mark a task done:**
  `/donetask 2`

---

## PART 7 — Keep It Running 24/7 (Important!)

Right now, the bot only works while that Command Prompt/Terminal window is open on your computer. If you close it, shut down your PC, or lose internet, reminders stop.

To keep it running permanently, deploy it to a free hosting service:

### Option: Railway.app (recommended, free tier)
1. Go to https://railway.app and sign up (you can use your GitHub or Google account).
2. You'll need a GitHub account to upload your project — sign up free at https://github.com if you don't have one.
3. On GitHub, create a **New Repository** (name it e.g. `telegram-reminder-bot`), keep it Private.
4. Upload your project folder's files to that repository (GitHub's website has an "upload files" drag-and-drop option — no coding commands needed).
5. Back in Railway, click **New Project** → **Deploy from GitHub repo** → select your repository.
6. Railway will detect it's a Node.js project and start building it automatically.
7. In Railway's project settings, go to **Variables** and add one:
   - Key: `BOT_TOKEN`
   - Value: (paste your token from Part 1)
8. Railway will deploy and run `node bot.js` automatically, 24/7, in the cloud — no computer needed to stay on.

Once deployed on Railway, you can close your own computer entirely and the bot keeps running and sending reminders.

---

## Troubleshooting

- **"npm install" gives errors:** Make sure Node.js installed correctly (Part 2, step 4). Restart your computer and try again.
- **Bot doesn't respond on Telegram:** Make sure the terminal still shows "Bot is running..." with no red error text. If it crashed, re-run `node bot.js`.
- **Reminder didn't arrive:** Time must be exact 24-hour format (e.g. `09:05`, not `9:5am`). Also make sure your computer/Railway deployment was actually running at that time.
