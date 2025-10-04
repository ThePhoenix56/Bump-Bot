
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

const bumpTasks = [];
let nextTaskId = 1;

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

async function doDiscordBump(token, guildId, channelId) {
  try {
    const url = 'https://discord.com/api/v9/interactions';

    const payload = {
      type: 2,
      application_id: '302050872383242240',
      guild_id: guildId,
      channel_id: channelId,
      session_id: '4a8aec5ee86f28f7aaa9ce4e4ad4c4f8',
      data: {
        version: '1051151064008769576',
        id: '947088344167366698',
        name: 'bump',
        type: 1,
        options: [],
        application_command: {
          id: '947088344167366698',
          application_id: '302050872383242240',
          version: '1051151064008769576',
          default_member_permissions: null,
          type: 1,
          nsfw: false,
          integration_types: null,
          name: 'bump',
          description: "Pushes your server to the top of all your server's tags and the front page",
          description_localized: 'Bump this server.',
          dm_permission: true,
          contexts: null
        },
        attachments: []
      },
      nonce: '1146562376921776128'
    };

    const cookieHeader =
      '__dcfduid=7e8817223ed711eeaad5ce8cf9c04b14; ' +
      '__sdcfduid=7e8817223ed711eeaad5ce8cf9c04b14d208c84adf3cb9e93ac872ddabb8c3bf6236d2d0697ec7a439989e3b487bacea; ' +
      '__cfruid=c952bd7f638ed51270271d3dd7946f6d2e8494b8-1692480575';

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
        Cookie: cookieHeader
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      console.warn(`Bump failed (status ${resp.status}) for guild=${guildId} channel=${channelId}`);
    }
  } catch (err) {
    console.error('Error doing Discord bump:', err);
  }
}

ipcMain.on('start-task', (event, { token, guildId, channelId }) => {
  const thisId = nextTaskId++;

  doDiscordBump(token, guildId, channelId);
  const intervalMs = 7270 * 1000;
  const intervalId = setInterval(() => {
    doDiscordBump(token, guildId, channelId);
  }, intervalMs);

  bumpTasks.push({ id: thisId, token, guildId, channelId, intervalId });

  BrowserWindow.getAllWindows().forEach((win) =>
    win.webContents.send(
      'tasks-updated',
      bumpTasks.map((t) => ({
        id: t.id,
        guildId: t.guildId,
        channelId: t.channelId
      }))
    )
  );
});


ipcMain.on('stop-task', (event, taskId) => {
  const idx = bumpTasks.findIndex((t) => t.id === taskId);
  if (idx !== -1) {
    clearInterval(bumpTasks[idx].intervalId);
    bumpTasks.splice(idx, 1);

    BrowserWindow.getAllWindows().forEach((win) =>
      win.webContents.send(
        'tasks-updated',
        bumpTasks.map((t) => ({
          id: t.id,
          guildId: t.guildId,
          channelId: t.channelId
        }))
      )
    );
  }
});


ipcMain.on('load-tokens', async (event) => {
  // change this to the directory where your bumpbot files are located
  const dir = 'CHANGETHISTOYOURDIRECTORY\\bumpbot';
  try {
    const [tokensData, serversData, channelsData] = await Promise.all([
      fs.readFile(path.join(dir, 'token.txt'), 'utf-8'),
      fs.readFile(path.join(dir, 'servers.txt'), 'utf-8'),
      fs.readFile(path.join(dir, 'channels.txt'), 'utf-8')
    ]);

    const tokens = tokensData
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l);
    const servers = serversData
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l);
    const channels = channelsData
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l);

    const items = [];
    for (let i = 0; i < tokens.length; i++) {
      if (!servers[i] || !channels[i]) continue;
      const token = tokens[i];
      if (bumpTasks.find((t) => t.token === token)) continue;

      items.push({
        token,
        guildId: servers[i],
        channelId: channels[i]
      });
    }

    const results = await Promise.all(
      items.map(async ({ token, guildId, channelId }) => {
        let userName = token;
        let serverName = guildId;
        let channelName = channelId;

        try {
          const userResp = await fetch('https://discord.com/api/v9/users/@me', {
            headers: { Authorization: token }
          });
          if (userResp.ok) {
            const u = await userResp.json();
            userName = `${u.username}#${u.discriminator}`;
          }
        } catch (_) {}

        try {
          const guildResp = await fetch(`https://discord.com/api/v9/guilds/${guildId}`, {
            headers: { Authorization: token }
          });
          if (guildResp.ok) {
            const g = await guildResp.json();
            serverName = g.name || guildId;
          }
        } catch (_) {}

        try {
          const chResp = await fetch(`https://discord.com/api/v9/channels/${channelId}`, {
            headers: { Authorization: token }
          });
          if (chResp.ok) {
            const c = await chResp.json();
            channelName = `#${c.name}` || channelId;
          }
        } catch (_) {}

        return { token, guildId, channelId, userName, serverName, channelName };
      })
    );

    event.sender.send('tokens-loaded', results);
  } catch (err) {
    console.error('Error loading tokens:', err);
    event.sender.send('tokens-loaded', []);
  }
});
