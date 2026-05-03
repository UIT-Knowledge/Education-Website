const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

// This script builds the project by:
// 1. Minifying CSS/JS from root to 'dist' using esbuild JS API
// 2. Copying other assets
// 3. Injecting environment variables into dist/supabase.js

const distDir = path.join(__dirname, 'dist');

// Ensure dist directory exists and is empty
if (fs.existsSync(distDir)) {
    console.log('Cleaning existing dist directory...');
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

console.log('Starting build process...');

async function runBuild() {
    // 1. Minify JS and CSS using esbuild JS API
    try {
        console.log('Minifying assets with esbuild...');
        const filesToMinify = [
            { in: 'styles.css', out: 'styles.css' },
            { in: 'script.js', out: 'script.js' },
            { in: 'supabase.js', out: 'supabase.js' },
            { in: 'helloworld.css', out: 'helloworld.css' },
            { in: 'helloworld.js', out: 'helloworld.js' }
        ];

        for (const file of filesToMinify) {
            const srcPath = path.join(__dirname, file.in);
            const destPath = path.join(distDir, file.out);
            
            if (fs.existsSync(srcPath)) {
                console.log(`- ${file.in} -> ${file.out}`);
                await esbuild.build({
                    entryPoints: [srcPath],
                    bundle: false, // Don't try to resolve assets/imports
                    minify: true,
                    outfile: destPath
                });
            }
        }
    } catch (error) {
        console.error('Error during minification:', error);
        process.exit(1);
    }

    // 2. Copy other files
    const filesToCopy = [
        'index.html', 'helloworld.html',
        'favicon.ico', 'favicon.png', 'robots.txt', 'sitemap.xml', 'sw.js'
    ];

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

    if (fs.existsSync(path.join(__dirname, 'assets'))) {
        copyDirSync(path.join(__dirname, 'assets'), path.join(distDir, 'assets'));
        console.log('Assets copied to dist/');
    }

    // 3. Inject Environment Variables
    const supabaseJsPath = path.join(distDir, 'supabase.js');
    const envPath = path.join(__dirname, '.env');

    let envVars = { ...process.env };

    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, ...value] = line.split('=');
            if (key && value) {
                envVars[key.trim()] = value.join('=').trim();
            }
        });
    }

    if (!fs.existsSync(supabaseJsPath)) {
        console.error('ERROR: dist/supabase.js not found after minification');
        process.exit(1);
    }

    let content = fs.readFileSync(supabaseJsPath, 'utf8');

    if (!envVars.SUPABASE_URL || !envVars.SUPABASE_ANON_KEY) {
        console.warn('WARNING: SUPABASE_URL and SUPABASE_ANON_KEY are not set in environment. Using placeholders if present.');
    } else {
        const url = envVars.SUPABASE_URL;
        const key = envVars.SUPABASE_ANON_KEY;

        // Use a more robust replacement since it might be minified
        content = content.replace(/const SUPABASE_URL\s*=\s*['"][^'"]*['"]\s*;?/, `const SUPABASE_URL='${url}';`);
        content = content.replace(/const SUPABASE_ANON_KEY\s*=\s*['"][^'"]*['"]\s*;?/, `const SUPABASE_ANON_KEY='${key}';`);

        fs.writeFileSync(supabaseJsPath, content);
        console.log('Successfully injected environment variables into dist/supabase.js');
    }

    console.log('Build completed successfully!');
}

runBuild();
