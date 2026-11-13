/** Shared Foundry-side roll helpers: every mechanical roll waits for Dice So Nice before the result is used. */
export const SYSTEM_ID = "night-assassins";

/**
 * Evaluate `formula`, post it to chat and wait for the 3D animation (blueprint invariant).
 * `messageMode` (v14: key of CONFIG.ChatMessage.modes; `rollMode` is deprecated) defaults to the core setting.
 */
export async function rollToChat(formula, actor, flavor, { messageMode } = {}) {
  const roll = await new foundry.dice.Roll(formula).evaluate();
  const message = await roll.toMessage({ speaker: ChatMessage.implementation.getSpeaker({ actor }), flavor }, { messageMode: messageMode || undefined });
  await game.dice3d?.waitFor3DAnimationByMessageID?.(message?.id);
  return roll;
}

/** HTML card in chat with the same visibility as the roll it belongs to. */
export async function postCard(actor, content, messageMode) {
  const data = { speaker: ChatMessage.implementation.getSpeaker({ actor }), content };
  if (messageMode && messageMode in CONFIG.ChatMessage.modes) ChatMessage.implementation.applyMode(data, messageMode);
  return ChatMessage.implementation.create(data);
}

/** <select> with the chat visibility modes (v14 CONFIG.ChatMessage.modes); current = core setting. */
export function messageModeField(name = "messageMode") {
  const current = game.settings.get("core", "messageMode");
  const options = Object.entries(CONFIG.ChatMessage.modes).filter(([id]) => id !== "ic")
    .map(([id, m]) => `<option value="${id}" ${id === current ? "selected" : ""}>${game.i18n.localize(m.label)}</option>`).join("");
  return `<label class="nas-dialog-field">Visibilidade<select name="${name}">${options}</select></label>`;
}

/** Plain chat notice (no roll) for decisions the GM should see. */
export async function chatNotice(actor, html) {
  return ChatMessage.implementation.create({ speaker: ChatMessage.implementation.getSpeaker({ actor }), content: html });
}

/** True when the current user may pick instead of rolling: GM always; players only if the GM enabled the setting. */
export function canChoose(settingKey) {
  return game.user.isGM || Boolean(game.settings.get(SYSTEM_ID, settingKey));
}
