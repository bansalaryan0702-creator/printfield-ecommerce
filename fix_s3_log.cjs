const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "console.warn(`[Upload Restore] Failed to recover ${req.params.filename} from S3:`, s3Err.message);",
  "// console.warn(`[Upload Restore] Failed to recover ${req.params.filename} from S3:`, s3Err.message);"
);

fs.writeFileSync('server.ts', code);
