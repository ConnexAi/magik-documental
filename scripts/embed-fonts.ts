import fs from "fs";
import path from "path";

const fontBase = path.join(
  process.cwd(),
  "node_modules/pdfmake/build/fonts/Roboto"
);

const fonts = {
  regular: fs.readFileSync(path.join(fontBase, "Roboto-Regular.ttf")).toString("base64"),
  medium: fs.readFileSync(path.join(fontBase, "Roboto-Medium.ttf")).toString("base64"),
  italic: fs.readFileSync(path.join(fontBase, "Roboto-Italic.ttf")).toString("base64"),
  mediumItalic: fs.readFileSync(path.join(fontBase, "Roboto-MediumItalic.ttf")).toString("base64"),
};

const content = `// Auto-generado por scripts/embed-fonts.ts — NO editar manualmente
export const ROBOTO_FONTS = {
  regular: "${fonts.regular}",
  medium: "${fonts.medium}",
  italic: "${fonts.italic}",
  mediumItalic: "${fonts.mediumItalic}",
};
`;

fs.writeFileSync(path.join(process.cwd(), "lib/pdf-fonts.ts"), content);
console.log("Fuentes embebidas correctamente en lib/pdf-fonts.ts");
