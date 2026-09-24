const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const templatePath = path.join(root, "template.json");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
const packageManifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

packageManifest.name = "together-daily";
template.files["package.json"] = `${JSON.stringify(packageManifest, null, 2)}\n`;
template.files["app.config.ts"] = fs.readFileSync(path.join(root, "app.config.ts"), "utf8");
delete template.files["app.json"];

fs.writeFileSync(templatePath, `${JSON.stringify(template, null, 2)}\n`);
