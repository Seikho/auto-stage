const resolve = require('path').resolve;
const exec = require('child_process').exec;
const hapi = require('hapi');
const Promise = require('bluebird');
const fs = require('fs');

var gitRemote = 'origin';
var gitBranch = 'master';
var projectLocation = '';
var stagingProcess;
var killStaging;

var web = new hapi.Server();

function configure(projectPath, options) {
    options = options || {};
    var port = options.port || 3000;

    if (options.remote) gitRemote = options.remote;
    if (options.branch) gitBranch = options.branch;

    projectLocation = projectPath;

    web.connection({ port });

    web.route({
        method: 'POST',
        path: '/',
        handler: (request, reply) => {
            var event = request.headers['X-Github-Event'] || request.headers['x-github-event'] || '';
            console.log('Received Github Event:', event);
            if (event !== 'push') return reply('');

            var branch = request.payload.ref.split('/').slice(-1)[0].trim();

            if (branch !== gitBranch) {
                console.log(`Branch pushed was ${branch}, not ${gitBranch}`);
                console.log('Will not stage');
                return;
            }
            stagingProcess = stage();
        }
    });

    web.start(() => console.log('Server listening on port', port));

    stagingProcess = stage();
}

function stage() {
    return pullLatest()
        .then(() => installDeps())
        .then(() => {
            if (typeof killStaging === 'function') {
                console.log('Killing existing staging process');
                killStaging();
            }
            return true;
        })
        .then(() => setTimeout(() => { stagingProcess = startApp()}, 2000));
}

function installDeps() {
    console.log('Installing Node deps...')
    return run('npm install --production')
        .then(() => {
            console.log('Completed');
            return true;
        });
}

function startApp() {
    var stdout = msg => console.log(msg.toString().trim());
    var stderr = msg => console.log('ERROR:', stderr);
    console.log('Attempting to start application');
    
    var child = run('npm start', { stdout, stderr });
    
    killStaging = child.kill;
    
    return child;
}

function pullLatest() {
    console.log('Pulling latest code from source...')
    return run(`git pull ${gitRemote} ${gitBranch}`)
        .then(() => {
            console.log('Completed');
            return true;
        });
}

function run(command, options) {
    options = options || {};
    var res, rej;
    
    var child = exec(command, { cwd: projectLocation }, (error, stderr, stdout) => {

    });

    var promise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
        
        child.on('close', rawCode => {
            var code = Number(rawCode);
            console.log(command, 'terminated with', code);
            if (code !== 0) return reject(`Failed during ${command}. Exited with ${code}`);
            resolve(code);
        });
        
        child.on('error', () => { /* NOOP */ });

        if (typeof options.error === 'function') {
            child.on('error', options.error);
        }

        if (typeof options.stdout === 'function') {
            child.stdout.on('data', options.stdout);
        }

        if (typeof options.stderr === 'function') {
            child.stderr.on('data', options.stderr);
        }


    });

    promise.kill = () => {
        res(0);
        child.kill();
    }

    return promise;
}

module.exports = configure;