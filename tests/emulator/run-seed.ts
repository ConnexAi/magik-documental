import { seed } from "./seed";

seed()
  .then(() => console.log("Semilla cargada en el emulador (demo-magik)"))
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
