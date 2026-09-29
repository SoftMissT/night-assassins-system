const SYSTEM_ID = "night-assassins";

Hooks.once("init", () => {
  console.log(
    `${SYSTEM_ID} | ${game.i18n.format("NAS.Init", { version: game.system.version })}`,
  );
});
