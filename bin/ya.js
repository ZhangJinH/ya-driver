#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const { log } = require('../utils/log');
const normalizeOpts = require('../utils/cli-args');

program
  .version(require('../package').version)
  .usage('<command> [options]');

program
  .command('create <project-name>')
  .description('create a new project powered by ya-driver.')
  .action((projectName, cmd) => {
    const options = normalizeOpts(projectName, cmd);
    require('../lib/create')(options);
  });

program
  .command('serve [project-name]')
  .description('serve project in development mode with zero config.')
  .option('-P, --port [value]', 'Server port') // Server port
  .action((projectName, cmd) => {
    const options = normalizeOpts(projectName, cmd);
    require('../lib/serve')(options);
  });

program
  .command('build [project-name]')
  .description('build project in production mode with zero config')
  .option('-K, --sdk', 'Output the sdk version') // 输出sdk版本
  .option('-D, --app-domain <value>', 'The serve app dmain')
  .option('-C, --cdn-domain [value]', 'The serve app cdn dmain')
  .option('-N, --app-name [value]', 'App name,should always the same with package.json name field')
  .option('-E, --app-env <value>', 'Deploy env name, reference http://doc.yazuosoft.com/pages/viewpage.action?pageId=3015211')
  .action((projectName, cmd) => {
    const options = normalizeOpts(projectName, cmd);
    require('../lib/build')(options);
  });

program
  .command('acc [project-name]')
  .description('Accelerate project local deploy speed')
  .action((projectName, cmd) => {
    const options = normalizeOpts(projectName, cmd);
    require('../lib/acc')(options);
  });

// add some useful info on help
program.on('--help', () => {
  log();
  log(`  Run ${chalk.cyanBright(`ya <command> --help`)} for detailed usage of given command.`);
  log();
});

program.parse(process.argv);
