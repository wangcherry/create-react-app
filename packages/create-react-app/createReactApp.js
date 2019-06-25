/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// create-react-app is installed globally on people's computers. This means
// that it is extremely difficult to have them upgrade the version and
// because there's only one global version installed, it is very prone to
// breaking changes.
//
// The only job of create-react-app is to init the repository and then
// forward all the commands to the local version of create-react-app.
//
// If you need to add a new command, please add it to the scripts/ folder.
//
// The only reason to modify this file is to add more warnings and
// troubleshooting information for the `create-react-app` command.
//
// Do not make breaking changes! We absolutely don't want to have to
// tell people to update their global version of create-react-app.
//
// Also be careful with new language features.
// This file must work on Node 6+.
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

'use strict';

const chalk = require('chalk');
const commander = require('commander');
const envinfo = require('envinfo');
const execSync = require('child_process').execSync;
const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');
const semver = require('semver');
const spawn = require('cross-spawn');
const validateProjectName = require('validate-npm-package-name');

const packageJson = require('./package.json');

// These files should be allowed to remain on a failed install,
// but then silently removed during the next create.
const errorLogFilePatterns = [
  'npm-debug.log',
  'yarn-error.log',
  'yarn-debug.log',
];

// template type
const templateTypeMap = {
  full: 'git@git.yx.netease.com:sharkR/react-template-full.git',
  web: 'git@git.yx.netease.com:sharkR/react-template-web.git',
  npm: 'git@git.yx.netease.com:sharkR/react-template-npm.git',
};
let templateType;
let templateGit;

let projectName;

const program = new commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action(name => {
    projectName = name;
  })
  .option('--type <type>', 'set template type', 'full')
  .option('--verbose', 'print additional logs')
  .option('--info', 'print environment debug info')
  .option(
    '--scripts-version <alternative-package>',
    'use a non-standard version of react-scripts'
  )
  .option('--use-npm')
  .option('--use-pnp')
  .allowUnknownOption()
  .on('--help', () => {
    console.log(`    Only ${chalk.green('<project-directory>')} is required.`);
    console.log();
    console.log(`    A template type ${chalk.cyan('--type')} can be set:`);
    console.log(
      `      - ${chalk.green('full')}: Default template, include server & web`
    );
    console.log(`      - ${chalk.green('web')}: only web template`);
    console.log(
      `      - ${chalk.green('npm')}: include server & web for package`
    );
    console.log();
    console.log(
      `    A custom ${chalk.cyan('--scripts-version')} can be one of:`
    );
    console.log(`      - a specific npm version: ${chalk.green('0.8.2')}`);
    console.log(`      - a specific npm tag: ${chalk.green('@next')}`);
    console.log(
      `      - a custom fork published on npm: ${chalk.green(
        'my-react-scripts'
      )}`
    );
    console.log(
      `      - a local path relative to the current working directory: ${chalk.green(
        'file:../my-react-scripts'
      )}`
    );
    console.log(
      `      - a .tgz archive: ${chalk.green(
        'https://mysite.com/my-react-scripts-0.8.2.tgz'
      )}`
    );
    console.log(
      `      - a .tar.gz archive: ${chalk.green(
        'https://mysite.com/my-react-scripts-0.8.2.tar.gz'
      )}`
    );
    console.log(
      `    It is not needed unless you specifically want to use a fork.`
    );
    console.log();
    console.log(
      `    If you have any problems, do not hesitate to file an issue:`
    );
    console.log(
      `      ${chalk.cyan(
        'https://github.com/facebook/create-react-app/issues/new'
      )}`
    );
    console.log();
  })
  .parse(process.argv);

if (program.info) {
  console.log(chalk.bold('\nEnvironment Info:'));
  return envinfo
    .run(
      {
        System: ['OS', 'CPU'],
        Binaries: ['Node', 'npm', 'Yarn'],
        Browsers: ['Chrome', 'Edge', 'Internet Explorer', 'Firefox', 'Safari'],
        npmPackages: ['react', 'react-dom', '@sharkR/react-scripts'],
        npmGlobalPackages: ['@sharkR/create-react-app'],
      },
      {
        duplicates: true,
        showNotFound: true,
      }
    )
    .then(console.log);
}

if (typeof projectName === 'undefined') {
  console.error('Please specify the project directory:');
  console.log(
    `  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`
  );
  console.log();
  console.log('For example:');
  console.log(`  ${chalk.cyan(program.name())} ${chalk.green('my-react-app')}`);
  console.log();
  console.log(
    `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
  );
  process.exit(1);
}

if (program.type) {
  if (
    program.type === 'full' ||
    program.type === 'web' ||
    program.type === 'npm'
  ) {
    templateType = program.type;
    templateGit = templateTypeMap[templateType];
    console.log('Will create a template project');
  } else {
    console.error('Please set the correct template type (full | web | npm) : ');
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green(
        '<project-directory>'
      )} ${chalk.green('[options]')}`
    );
    console.log();
    console.log('For example:');
    console.log(
      `  ${chalk.cyan(program.name())} 'my-react-app' ${chalk.green(
        '--type=full'
      )}`
    );
    console.log();
    console.log(
      `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
    );
    process.exit(1);
  }
} else {
  templateType = 'full';
  templateGit = templateTypeMap[templateType];
  console.log('Will create a default template project inculde server & web');
  console.log('Equal:');
  console.log(
    `  ${chalk.cyan(program.name())} ${chalk.green(
      '<project-directory>'
    )} --type=${templateType}`
  );
}

function printValidationResults(results) {
  if (typeof results !== 'undefined') {
    results.forEach(error => {
      console.error(chalk.red(`  *  ${error}`));
    });
  }
}

createApp(
  projectName,
  program.verbose,
  program.scriptsVersion,
  program.useNpm,
  program.usePnp
);

function createApp(name, verbose, version, useNpm, usePnp) {
  const root = path.resolve(name);
  const appName = path.basename(root);

  checkAppName(appName);
  fs.ensureDirSync(name);
  if (!isSafeToCreateProjectIn(root, name)) {
    process.exit(1);
  }

  console.log(`Creating a new React app in ${chalk.green(root)}.`);
  console.log();

  execSync(`git clone ${templateGit} ${name}`);

  const useYarn = useNpm ? false : shouldUseYarn();
  process.chdir(root);
  if (!useYarn && !checkThatNpmCanReadCwd()) {
    process.exit(1);
  }

  if (!semver.satisfies(process.version, '>=8.10.0')) {
    console.log(
      chalk.yellow(
        `You are using Node ${
          process.version
        } so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
          `Please update to Node 8.10 or higher for a better, fully supported experience.\n`
      )
    );
    process.exit(1);
  }

  if (!useYarn) {
    const npmInfo = checkNpmVersion();
    if (!npmInfo.hasMinNpm) {
      if (npmInfo.npmVersion) {
        console.log(
          chalk.yellow(
            `You are using npm ${
              npmInfo.npmVersion
            } so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
              `Please update to npm 5 or higher for a better, fully supported experience.\n`
          )
        );
      }
      process.exit(1);
    }
  } else if (usePnp) {
    const yarnInfo = checkYarnVersion();
    if (!yarnInfo.hasMinYarnPnp) {
      if (yarnInfo.yarnVersion) {
        console.log(
          chalk.yellow(
            `You are using Yarn ${
              yarnInfo.yarnVersion
            } together with the --use-pnp flag, but Plug'n'Play is only supported starting from the 1.12 release.\n\n` +
              `Please update to Yarn 1.12 or higher for a better, fully supported experience.\n`
          )
        );
      }
      // 1.11 had an issue with webpack-dev-middleware, so better not use PnP with it (never reached stable, but still)
      usePnp = false;
    }
  }

  if (useYarn) {
    let yarnUsesDefaultRegistry = true;
    try {
      yarnUsesDefaultRegistry =
        execSync('yarnpkg config get registry')
          .toString()
          .trim() === 'https://registry.yarnpkg.com';
    } catch (e) {
      // ignore
    }
    if (yarnUsesDefaultRegistry) {
      // fs.copySync(
      //   require.resolve('./yarn.lock.cached'),
      //   path.join(root, 'yarn.lock')
      // );
    }
  }

  execSync(`rm -rf .git`);
  setConfig(root, useYarn);
}

function shouldUseYarn() {
  try {
    execSync('yarnpkg --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function checkNpmVersion() {
  let hasMinNpm = false;
  let npmVersion = null;
  try {
    npmVersion = execSync('npm --version')
      .toString()
      .trim();
    hasMinNpm = semver.gte(npmVersion, '5.0.0');
  } catch (err) {
    // ignore
  }
  return {
    hasMinNpm: hasMinNpm,
    npmVersion: npmVersion,
  };
}

function checkYarnVersion() {
  let hasMinYarnPnp = false;
  let yarnVersion = null;
  try {
    yarnVersion = execSync('yarnpkg --version')
      .toString()
      .trim();
    let trimmedYarnVersion = /^(.+?)[-+].+$/.exec(yarnVersion);
    if (trimmedYarnVersion) {
      trimmedYarnVersion = trimmedYarnVersion.pop();
    }
    hasMinYarnPnp = semver.gte(trimmedYarnVersion || yarnVersion, '1.12.0');
  } catch (err) {
    // ignore
  }
  return {
    hasMinYarnPnp: hasMinYarnPnp,
    yarnVersion: yarnVersion,
  };
}

function checkAppName(appName) {
  const validationResult = validateProjectName(appName);
  if (!validationResult.validForNewPackages) {
    console.error(
      `Could not create a project called ${chalk.red(
        `"${appName}"`
      )} because of npm naming restrictions:`
    );
    printValidationResults(validationResult.errors);
    printValidationResults(validationResult.warnings);
    process.exit(1);
  }

  // TODO: there should be a single place that holds the dependencies
  const dependencies = ['react', 'react-dom', '@sharkR/react-scripts'].sort();
  if (dependencies.indexOf(appName) >= 0) {
    console.error(
      chalk.red(
        `We cannot create a project called ${chalk.green(
          appName
        )} because a dependency with the same name exists.\n` +
          `Due to the way npm works, the following names are not allowed:\n\n`
      ) +
        chalk.cyan(dependencies.map(depName => `  ${depName}`).join('\n')) +
        chalk.red('\n\nPlease choose a different project name.')
    );
    process.exit(1);
  }
}

// If project only contains files generated by GH, it’s safe.
// Also, if project contains remnant error logs from a previous
// installation, lets remove them now.
// We also special case IJ-based products .idea because it integrates with CRA:
// https://github.com/facebook/create-react-app/pull/368#issuecomment-243446094
function isSafeToCreateProjectIn(root, name) {
  const validFiles = [
    '.DS_Store',
    'Thumbs.db',
    '.git',
    '.gitignore',
    '.idea',
    'README.md',
    'LICENSE',
    '.hg',
    '.hgignore',
    '.hgcheck',
    '.npmignore',
    'mkdocs.yml',
    'docs',
    '.travis.yml',
    '.gitlab-ci.yml',
    '.gitattributes',
  ];
  console.log();

  const conflicts = fs
    .readdirSync(root)
    .filter(file => !validFiles.includes(file))
    // IntelliJ IDEA creates module files before CRA is launched
    .filter(file => !/\.iml$/.test(file))
    // Don't treat log files from previous installation as conflicts
    .filter(
      file => !errorLogFilePatterns.some(pattern => file.indexOf(pattern) === 0)
    );

  if (conflicts.length > 0) {
    console.log(
      `The directory ${chalk.green(name)} contains files that could conflict:`
    );
    console.log();
    for (const file of conflicts) {
      console.log(`  ${file}`);
    }
    console.log();
    console.log(
      'Either try using a new directory name, or remove the files listed above.'
    );

    return false;
  }

  // Remove any remnant files from a previous installation
  const currentFiles = fs.readdirSync(path.join(root));
  currentFiles.forEach(file => {
    errorLogFilePatterns.forEach(errorLogFilePattern => {
      // This will catch `(npm-debug|yarn-error|yarn-debug).log*` files
      if (file.indexOf(errorLogFilePattern) === 0) {
        fs.removeSync(path.join(root, file));
      }
    });
  });
  return true;
}

function checkThatNpmCanReadCwd() {
  const cwd = process.cwd();
  let childOutput = null;
  try {
    // Note: intentionally using spawn over exec since
    // the problem doesn't reproduce otherwise.
    // `npm config list` is the only reliable way I could find
    // to reproduce the wrong path. Just printing process.cwd()
    // in a Node process was not enough.
    childOutput = spawn.sync('npm', ['config', 'list']).output.join('');
  } catch (err) {
    // Something went wrong spawning node.
    // Not great, but it means we can't do this check.
    // We might fail later on, but let's continue.
    return true;
  }
  if (typeof childOutput !== 'string') {
    return true;
  }
  const lines = childOutput.split('\n');
  // `npm config list` output includes the following line:
  // "; cwd = C:\path\to\current\dir" (unquoted)
  // I couldn't find an easier way to get it.
  const prefix = '; cwd = ';
  const line = lines.find(line => line.indexOf(prefix) === 0);
  if (typeof line !== 'string') {
    // Fail gracefully. They could remove it.
    return true;
  }
  const npmCWD = line.substring(prefix.length);
  if (npmCWD === cwd) {
    return true;
  }
  console.error(
    chalk.red(
      `Could not start an npm process in the right directory.\n\n` +
        `The current directory is: ${chalk.bold(cwd)}\n` +
        `However, a newly started npm process runs in: ${chalk.bold(
          npmCWD
        )}\n\n` +
        `This is probably caused by a misconfigured system terminal shell.`
    )
  );
  if (process.platform === 'win32') {
    console.error(
      chalk.red(`On Windows, this can usually be fixed by running:\n\n`) +
        `  ${chalk.cyan(
          'reg'
        )} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
        `  ${chalk.cyan(
          'reg'
        )} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
        chalk.red(`Try to run the above two lines in the terminal.\n`) +
        chalk.red(
          `To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/`
        )
    );
  }
  return false;
}

async function setConfig(root, useYarn) {
  const sharkConfPath =
    templateType === 'web'
      ? path.join(root, 'shark-conf.js')
      : path.join(root, 'web', 'shark-conf.js');
  const gitlabCiYmlPath = path.join(root, '.gitlab-ci.yml');
  const arr = [
    'Please enter the groupName in the git repository',
    'Please enter the productName in the git repository',
    'Please enter the contextPath of the application, default empty string',
    'Please enter the serviceCode of the application, default empty string',
  ];

  // git 仓库中的groupName，需配置
  const group =
    (await setConfigHandle(root, sharkConfPath, 'group', arr[0])) || '';
  // git 仓库中的productName，需配置
  const product =
    (await setConfigHandle(root, sharkConfPath, 'product', arr[1])) || '';
  // 应用的contextPath，需配置，没有填空字符串
  const contextPath =
    (await setConfigHandle(root, sharkConfPath, 'contextPath', arr[2])) || '';

  let sharkConf = fs.readFileSync(require.resolve('./shark-conf.js'), 'utf8');
  sharkConf = sharkConf
    .replace(
      /const group = .*;/,
      group ? `const group = '${group}';` : `const group = '';`
    )
    .replace(
      /const product = .*;/,
      product ? `const product = '${product}';` : `const product = '';`
    )
    .replace(
      /const contextPath = .*;/,
      contextPath
        ? `const contextPath = '${contextPath}';`
        : `const contextPath = '';`
    );
  fs.writeFileSync(sharkConfPath, sharkConf);

  // 应用的 serviceCode，需配置，没有填空字符串
  const serviceCode =
    (await setConfigHandle(root, gitlabCiYmlPath, 'SERVICE_CODE', arr[3])) ||
    '';

  let gitlabCiYmlConf = fs.readFileSync(
    require.resolve('./gitlab-ci.yml'),
    'utf8'
  );
  gitlabCiYmlConf = gitlabCiYmlConf
    .replace(/\$\{group\}/g, group)
    .replace(/\$\{product\}/g, product)
    .replace(/\$\{serviceCode\}/g, serviceCode);
  fs.writeFileSync(gitlabCiYmlPath, gitlabCiYmlConf);

  execSync(`git init`);
  execSync(
    `git remote add origin git@git.yx.netease.com:${group}/${product}.git`
  );
  install(useYarn);
}
async function setConfigHandle(root, confPath, conf, msg) {
  try {
    const answer = await inquirer.prompt({
      type: 'input',
      name: conf,
      message: msg,
      default: '',
    });
    if (!answer[conf]) {
      console.log(`You can set the ${conf} in ${chalk.green(confPath)}.`);
      console.log();
    } else {
      console.log(`You can modify the ${conf} in ${chalk.green(confPath)}.`);
      console.log();
    }
    return answer[conf];
  } catch (e) {
    console.log(e);
  }
}

function install(useYarn) {
  let command;
  let args = [];
  if (useYarn) {
    command = 'yarn';
  } else {
    command = 'npm';
    args = templateType === 'web' ? ['install'] : ['run', 'install'];
  }
  console.log('Installing packages. This might take a couple of minutes.');
  console.log();
  const child = spawn(command, args, { stdio: 'inherit' });
  child.on('close', code => {
    if (code !== 0) {
      console.log();
      console.log(
        `${chalk.red(command)} ${chalk.red(
          args.join(' ')
        )} failed, Please install manually`
      );
    }
  });
}
