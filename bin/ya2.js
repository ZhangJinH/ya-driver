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
    const options = normalizeOpts(projectName, cmd, {
      command: 'create'
    });
    require('../lib/create')(options);
  });

program
  .command('serve [project-name]')
  .description('Serve project in development mode with zero config.')
  .option('-P, --port [value]', 'Server port') // Server port
  .option('-R, --mock-port [value]', 'Mock port') // Mock port
  .option('-M, --mock', 'Setup mock server') // with the mock server setup
  .action((projectName, cmd) => {
    const options = normalizeOpts(projectName, cmd, {
      command: 'serve'
    });
    require('../lib/serve')(options);
  });

program
  .command('build [project-name]')
  .description('Build project in production mode with zero config.')
  .option('-K, --sdk', 'Output the sdk version') // 输出sdk版本
  .option('-D, --app-domain <value>', 'The serve app dmain')
  .option('-C, --cdn-domain [value]', 'The serve app cdn dmain')
  .option('-N, --app-name [value]', 'App name,should always the same with package.json name field')
  .option('-E, --app-env <value>', 'Deploy env name, reference http://doc.yazuosoft.com/pages/viewpage.action?pageId=3015211')
  .action((projectName, cmd) => {
    const options = normalizeOpts(projectName, cmd, {
      command: 'build'
    });
    require('../lib/build')(options);
  });

program
  .command('acc [project-name]')
  .description('Accelerate project local deploy speed.')
  .option('-M, --max-effect', 'Create dll file include all third dependencies')
  .action((projectName, cmd) => {
    const options = normalizeOpts(projectName, cmd, {
      command: 'acc'
    });
    require('../lib/acc')(options);
  });

program
  .command('deps [project-name]')
  .description('Install local dependencies powered by yarn add npm fallback.')
  .action((projectName, cmd) => {
    const options = normalizeOpts(projectName, cmd, {
      command: 'deps'
    });
    require('../lib/deps')(options);
  });

program
  .command('eslint [project-name]')
  .description('Install recommend eslint scheme.')
  .action((projectName, cmd) => {
    const options = normalizeOpts(projectName, cmd, {
      command: 'eslint'
    });
    require('../lib/eslint')(options);
  });

program
  .command('test [project-name]')
  .option('-M, --mode <value>', 'Run mode') // production or development
  .description('Run unit test powered by karma.')
  .action((projectName, cmd) => {
    const options = normalizeOpts(projectName, cmd, {
      command: 'test'
    });
    require('../lib/test')(options);
  });

program
  .command('api [project-name]')
  .option('-N, --node [value]', 'Given a node binary path power JSDoc')
  .description('Generate api documents powered by JSDoc.')
  .action((projectName, cmd) => {
    const options = normalizeOpts(projectName, cmd, {
      command: 'api'
    });
    require('../lib/api')(options);
  });

// add some useful info on help
program.on('--help', () => {
  log();
  log(`  Run ${chalk.cyanBright(`ya <command> --help`)} for detailed usage of given command.`);
  log();
});

program.parse(process.argv);
