const fs = require("fs");
const path = require("path");

// Paths
const distPath = path.join(__dirname, "dist");
const jsFilePath = path.join(distPath, "index.js");
const dtsFilePath = path.join(distPath, "index.d.ts");
const modulePath = path.join(distPath, "tutorial-module", "index.js");

// File contents
const jsContent = 'export { TutorialModule } from "./tutorial-module/index";';
const dtsContent = 'export { TutorialModule } from "./tutorial-module/TutorialRoot";';

function validateDistFolder() {
    if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath);
        console.log("'dist' directory created.");
    } else {
        console.log("'dist' directory already exists.");
    }
}

// Generate the files
function generateIndexJsWithTypes() {
    // Check if ./tutorial-module/index.js exists
    if (fs.existsSync(modulePath)) {
        console.log("The './tutorial-module/index.js' file exists. Generating files...");
        // Write index.js
        fs.writeFile(jsFilePath, jsContent, err => {
            if (err) {
                console.error(`Error generating 'index.js': ${err.message}`);
            } else {
                console.log("'index.js' generated successfully.");
            }
        });

        // Write index.d.ts
        fs.writeFile(dtsFilePath, dtsContent, err => {
            if (err) {
                console.error(`Error generating 'index.d.ts': ${err.message}`);
            } else {
                console.log("'index.d.ts' generated successfully.");
            }
        });
    } else {
        console.log("The './tutorial-module/index.js' file does not exist. Files will not be generated.");
    }
}

function removeDependenciesFromPackage() {
    const packageJsonPath = path.join(__dirname, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    if (packageJson.dependencies && packageJson.dependencies["react-scripts"]) {
        delete packageJson.dependencies["react-scripts"];
        delete packageJson.dependencies["react-router"];
        delete packageJson.dependencies["react-router-dom"];
    }
    const destinationPath = path.join(distPath, "package.json");
    fs.writeFileSync(destinationPath, JSON.stringify(packageJson, null, 2));
    console.log("package.json copied");
}

function start() {
    removeDependenciesFromPackage();
    validateDistFolder();
    generateIndexJsWithTypes();
}

start();