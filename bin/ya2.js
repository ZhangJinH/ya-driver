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
  .description('Create a new project powered by ya-driver.')
  .option('-F, --force', 'Force overwrite target directory')
  .action((projectName, cmd) => {
    const options = normalizeOpts(projectName, cmd);
    require('../lib/create')(options);
  });

program
  .command('serve [project-name]')
  .description('Serve project in development mode with zero config.')
  .option('-P, --port [value]', 'Server port') // Server port
  .option('-R, --mock-port [value]', 'Mock port') // Mock port
  .option('-M, --mock', 'Setup mock server') // with the mock server setup
  .option('-C, --compat', 'Running on loose mode(remove strict flag)') // 兼容模式
  .action((projectName, cmd) => {
    const options = normalizeOpts(projectName, cmd);
    require('../lib/serve')(options);
  });

program
  .command('build [project-name]')
  .description('Build project in production mode with zero config')
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
