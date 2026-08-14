const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');
const search = `console.log(\`Server running on http://localhost:\${PORT}\`);`;
const replace = `
    console.log(\`Server running on http://localhost:\${PORT}\`);
    // Redirect console.log and console.error to a file for debugging
    const util = require('util');
    const logFile = fs.createWriteStream('./server_debug.log', { flags: 'a' });
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = function () {
      logFile.write(util.format.apply(null, arguments) + '\\n');
      originalLog.apply(console, arguments);
    };
    console.error = function () {
      logFile.write('ERROR: ' + util.format.apply(null, arguments) + '\\n');
      originalError.apply(console, arguments);
    };
    console.warn = function () {
      logFile.write('WARN: ' + util.format.apply(null, arguments) + '\\n');
      originalWarn.apply(console, arguments);
    };
`;
code = code.replace(search, replace);
fs.writeFileSync('server.ts', code);
