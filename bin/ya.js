#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const { log } = require('../utils/log');

program
  .version(require('../package').version)
  .usage('<command> [options]');

program
  .command('create <app-name>')
  .description('create a new project powered by ya-driver')
  .option('-m, --packageManager <command>', 'Use specified npm client when installing dependencies')
  .action((name, cmd) => {
    const options = cleanArgs(cmd);
    require('../lib/create')(name, options);
  });
// add some useful info on help
program.on('--help', () => {
  log();
  log(`  Run ${chalk.cyanBright(`ya <command> --help`)} for detailed usage of given command.`);
  log();
});

program.parse(process.argv);

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function cleanArgs (cmd) {
  const args = {};
  cmd.options.forEach(o => {
    const key = o.long.replace(/^--/, '');
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
      args[key] = cmd[key];
    }
  });
  return args;
}
