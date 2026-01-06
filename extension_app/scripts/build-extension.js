const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT_DIR = path.join(__dirname, '../out');

function main() {
    console.log('Building Next.js app...');

    // 1. Build
    try {
        execSync('npx next build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (e) {
        console.error('Build failed');
        process.exit(1);
    }

    console.log('Post-processing for Chrome Extension...');

    // 2. Rename _next to next first
    const oldNextDir = path.join(OUT_DIR, '_next');
    const newNextDir = path.join(OUT_DIR, 'next');
    if (fs.existsSync(oldNextDir)) {
        fs.renameSync(oldNextDir, newNextDir);
        console.log('Renamed _next directory to next');
    }

    // 3. Force Remove known problem directories and files
    const problems = ['_not-found', '_not-found.html']; // Add any other _ folders Next.js might make on root
    for (const p of problems) {
        const pPath = path.join(OUT_DIR, p);
        if (fs.existsSync(pPath)) {
            fs.rmSync(pPath, { recursive: true, force: true });
            console.log(`Force removed: ${p}`);
        }
    }

    // 4. Recursive Clean: Remove remaining files starting with "_"
    cleanDirectory(OUT_DIR);

    // 5. Update HTML references
    updateHtmlReferences(OUT_DIR);

    console.log('Extension build complete in ./out');
}

function cleanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file.startsWith('.')) continue; // Skip .DS_Store

        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            cleanDirectory(filePath);
        } else {
            if (file.startsWith('_')) {
                console.log(`Removing restricted file: ${filePath}`);
                fs.unlinkSync(filePath);
            }
        }
    }
}

function updateHtmlReferences(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        if (file.startsWith('.')) continue;

        const filePath = path.join(dir, file);
        try {
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                updateHtmlReferences(filePath);
            } else if (file.endsWith('.html')) {
                let content = fs.readFileSync(filePath, 'utf-8');
                const regex = /\/_next\//g;

                if (regex.test(content)) {
                    content = content.replace(regex, '/next/');
                    fs.writeFileSync(filePath, content);
                    console.log(`Updated references in ${file}`);
                }
            }
        } catch (e) {
            console.warn(`Skipping file ${file}: ${e.message}`);
        }
    }
}

main();
