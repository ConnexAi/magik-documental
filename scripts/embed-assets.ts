import fs from "fs";
import path from "path";

const fontBase = path.join(process.cwd(), "public/fonts");

const logoSvg = fs.readFileSync(
  path.join(process.cwd(), "public/assets/logo_magik.svg")
).toString("base64");

const firmaSvg = fs.readFileSync(
  path.join(process.cwd(), "public/assets/firma_londoño.svg")
).toString("base64");

const regular = fs.readFileSync(path.join(fontBase, "Roboto-Regular.ttf")).toString("base64");
const medium = fs.readFileSync(path.join(fontBase, "Roboto-Medium.ttf")).toString("base64");
const italic = fs.readFileSync(path.join(fontBase, "Roboto-Italic.ttf")).toString("base64");
const mediumItalic = fs.readFileSync(path.join(fontBase, "Roboto-MediumItalic.ttf")).toString("base64");

const content = `// Auto-generado por scripts/embed-assets.ts — NO editar manualmente
export const ROBOTO_FONTS = {
  regular: "${regular}",
  medium: "${medium}",
  italic: "${italic}",
  mediumItalic: "${mediumItalic}",
};

export const MAGIK_LOGO_SVG_BASE64 = "${logoSvg}";
export const MAGIK_FIRMA_SVG_BASE64 = "${firmaSvg}";
`;

fs.writeFileSync(path.join(process.cwd(), "lib/pdf-fonts.ts"), content);
console.log("Assets embebidos correctamente en lib/pdf-fonts.ts");
