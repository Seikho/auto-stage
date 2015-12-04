# auto-stage

Automatically run your latest code after pushing to GitHub

### What does it do?
`auto-stage` will run a web server that will listen for GitHub web hooks.  
In particular, it will look for a `push` to a branch of your choosing.  
Once it sees a `push`, it will automatically:
1. `git pull {remote} {branch}`
2. `npm install`
3. stop the previous process 
4. `npm start` 

### Installation and Configuration
You will need to setup a `GitHub Webhook`.  
Go to your repo's `Settings` -> `Webhooks and services`

Ensure:
- the `Content type` is `application/json`
- the `Payload URL` is correct.
 - Note: if you do not choose a `port`, the default port is `3000`
- the web server will be publicly accessible
- the `projectPath` (see below) is a git repository and has `git pull` access to the remote code

Use it as a node_module:
```
npm install auto-stage --save
```   

### Usage
The module exports a single function which takes two parameters:
- `projectPath`: a relative or absolute path to your project from your `working directory`.
- `options`: A hash which accepts three optional values:
 - `port`: The desired port of the web server
 - `remote`: The git remote to use for use in `git pull`
 - `branch`: The remote branch for use in `git pull`
  
```javascript
const stage = require('auto-stage');
var options = {
    port: 8080,
    remote: 'origin',
    branch: 'staging'
};

stage('/projects/my-app', options); 
```

### Options


### TODO
- Use as a command line tool
- Use the `secret` as provided in the `Webhooks` configuration

### License
MIT