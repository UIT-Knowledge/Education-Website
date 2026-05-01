const fs = require('fs');
const path = require('path');

// This script builds the project by copying necessary files to a 'dist' folder
// and replacing environment variables in supabase.js during build
// It reads from process.env (Vercel) or a local .env file

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Files and directories to copy
const filesToCopy = [
    'index.html', 'helloworld.html',
    'styles.css', 'helloworld.css',
    'script.js', 'helloworld.js', 'supabase.js',
    'favicon.ico', 'favicon.png', 'robots.txt', 'sitemap.xml'
];

const dirsToCopy = ['assets'];

// Copy files
filesToCopy.forEach(file => {
    const src = path.join(__dirname, file);
    const dest = path.join(distDir, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
    }
});

// Copy directories (recursive)
function copyDirSync(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

dirsToCopy.forEach(dir => {
    copyDirSync(path.join(__dirname, dir), path.join(distDir, dir));
});

console.log('Static files copied to dist/');

const supabaseJsPath = path.join(distDir, 'supabase.js');
const envPath = path.join(__dirname, '.env');

let envVars = { ...process.env };

// Simple .env parser to avoid dependencies
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            envVars[key.trim()] = value.join('=').trim();
        }
    });
}

let content = fs.readFileSync(supabaseJsPath, 'utf8');

if (!envVars.SUPABASE_URL || !envVars.SUPABASE_ANON_KEY) {
    console.warn('WARNING: SUPABASE_URL and SUPABASE_ANON_KEY are not set in environment. Deploying with local values or placeholders.');
} else {
    const url = envVars.SUPABASE_URL;
    const key = envVars.SUPABASE_ANON_KEY;

    content = content.replace(/const SUPABASE_URL = '.*';/, `const SUPABASE_URL = '${url}';`);
    content = content.replace(/const SUPABASE_ANON_KEY = '.*';/, `const SUPABASE_ANON_KEY = '${key}';`);

    fs.writeFileSync(supabaseJsPath, content);
    console.log('Successfully injected environment variables into dist/supabase.js');
}
