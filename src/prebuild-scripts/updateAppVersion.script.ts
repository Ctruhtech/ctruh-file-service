import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import packageJson from "../../package.json";

// Promisify exec for better async handling
const execPromise = util.promisify(exec);

async function updateVersion() {
    let formattedDate;
    let gitSHA = "";

    try {
        const { stdout: hash } = await execPromise("/usr/bin/git rev-parse HEAD | cut -c 1-7");
        gitSHA = hash.trim();
        // Attempt to get the last commit date using git
        const { stdout } = await execPromise("/usr/bin/git log -1 --format=%cd --date=iso");
        const lastCommitDate = stdout.trim();

        // Format the last commit date to YYYY.MM.DD
        const date = new Date(lastCommitDate);
        formattedDate = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getDate().toString().padStart(2, "0")}`;
    } catch (error) {
        console.error("Failed to get last commit date from git. Falling back to the current date.");
        // If git fails, use the current date
        const now = new Date();
        formattedDate = `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getDate().toString().padStart(2, "0")}`;
    }

    // Update the version in package.json
    const newJSON = { ...packageJson, version: formattedDate, gitSHA };
    const filePath = path.join(process.cwd(), "/package.json");

    // Write the updated package.json back to disk
    fs.writeFileSync(filePath, JSON.stringify(newJSON, null, 2));

    try {
        // Format package.json using npx prettier
        await execPromise("npx prettier --write package.json");
        console.info(`Formatted package.json using Prettier.`);
    } catch (error) {
        console.error("Failed to format package.json using Prettier.");
    }

    console.info(`Version updated to ${formattedDate}`);
}

updateVersion().catch(err => console.error("Unexpected error:", err));
