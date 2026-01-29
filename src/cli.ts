import { Command } from "commander";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const program = new Command();

const PLUGIN_NAME = "opencode-channels-plugin";
const CONFIG_TEMPLATE = {
  enabled: true,
  defaultChannel: "telegram",
  telegram: {
    botToken: "YOUR_BOT_TOKEN",
    chatId: "YOUR_CHAT_ID",
    parseMode: "Markdown",
  },
  notifications: {
    onPermission: true,
    onComplete: true,
    onError: true,
    onIdle: false,
  },
  timeout: 300,
};

function getConfigPaths(global: boolean) {
  const base = global
    ? join(homedir(), ".config", "opencode")
    : join(process.cwd(), ".opencode");
  return {
    dir: base,
    opencode: join(base, "opencode.json"),
    channels: join(base, "channels.json"),
  };
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function readJson(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function writeJson(path: string, data: unknown) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function install(options: { global?: boolean; project?: boolean }) {
  const global = options.project ? false : true;
  const paths = getConfigPaths(global);
  const scope = global ? "global" : "project";

  console.log(`Installing ${PLUGIN_NAME} (${scope})...\n`);

  // Ensure config directory exists
  ensureDir(paths.dir);

  // Update opencode.json
  let config = readJson(paths.opencode) || {};
  const plugins = (config.plugin as string[]) || [];

  if (!plugins.includes(PLUGIN_NAME)) {
    plugins.push(PLUGIN_NAME);
    config.plugin = plugins;
    writeJson(paths.opencode, config);
    console.log(`✓ Added to ${paths.opencode}`);
  } else {
    console.log(`✓ Already in ${paths.opencode}`);
  }

  // Create channels.json if not exists
  if (!existsSync(paths.channels)) {
    writeJson(paths.channels, CONFIG_TEMPLATE);
    console.log(`✓ Created ${paths.channels}`);
  } else {
    console.log(`✓ Config exists: ${paths.channels}`);
  }

  console.log(`
Next steps:
1. Get Telegram bot token from @BotFather
2. Get chat ID from @userinfobot
3. Update ${paths.channels} with your credentials
`);
}

function initConfig(options: { global?: boolean; project?: boolean }) {
  const global = options.project ? false : true;
  const paths = getConfigPaths(global);

  ensureDir(paths.dir);

  if (existsSync(paths.channels)) {
    console.log(`Config already exists: ${paths.channels}`);
    return;
  }

  writeJson(paths.channels, CONFIG_TEMPLATE);
  console.log(`Created ${paths.channels}`);
  console.log(`
Next steps:
1. Get Telegram bot token from @BotFather
2. Get chat ID from @userinfobot
3. Update config with your credentials
`);
}

function uninstall(options: { global?: boolean; project?: boolean }) {
  const global = options.project ? false : true;
  const paths = getConfigPaths(global);

  if (!existsSync(paths.opencode)) {
    console.log("opencode.json not found");
    return;
  }

  const config = readJson(paths.opencode);
  if (!config) {
    console.log("Failed to read opencode.json");
    return;
  }

  const plugins = (config.plugin as string[]) || [];
  const idx = plugins.indexOf(PLUGIN_NAME);

  if (idx === -1) {
    console.log("Plugin not found in config");
    return;
  }

  plugins.splice(idx, 1);
  config.plugin = plugins;
  writeJson(paths.opencode, config);
  console.log(`Removed ${PLUGIN_NAME} from ${paths.opencode}`);
}

program
  .name(PLUGIN_NAME)
  .description("Channels plugin for OpenCode - Telegram/Slack/Discord notifications")
  .version("0.1.1");

program
  .command("install")
  .description("Install plugin to OpenCode config")
  .option("-p, --project", "Install to project (.opencode/) instead of global")
  .action(install);

program
  .command("init")
  .description("Create channels.json config template")
  .option("-p, --project", "Create in project (.opencode/) instead of global")
  .action(initConfig);

program
  .command("uninstall")
  .description("Remove plugin from OpenCode config")
  .option("-p, --project", "Remove from project config instead of global")
  .action(uninstall);

program.parse();
