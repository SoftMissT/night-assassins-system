import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { WEAPONS, weaponItemData } from '../module/core/weapons.mjs';

const output = new URL('../build/compendium/armas-cacador/', import.meta.url);
mkdirSync(output, { recursive: true });

const documents = new Map();
for (const weapon of WEAPONS) {
    const id = createHash('sha256').update(`night-assassins:weapon:${weapon.id}`).digest('hex').slice(0, 16);
    if (documents.has(id)) throw new Error(`ID duplicado no compêndio de armas: ${weapon.id}`);
    documents.set(id, { _id: id, _key: `!items!${id}`, ...weaponItemData(weapon), effects: [] });
}

for (const [id, item] of documents) {
    writeFileSync(new URL(`${id}.json`, output), JSON.stringify(item, null, 2) + '\n');
}
for (const entry of readdirSync(output, { withFileTypes: true })) {
    if (!entry.isFile() || !/^[a-f0-9]{16}\.json$/.test(entry.name)) {
        throw new Error(`Arquivo inesperado na saída gerada do compêndio: ${entry.name}`);
    }
    if (!documents.has(entry.name.slice(0, -5))) unlinkSync(new URL(entry.name, output));
}
console.log(`${documents.size} armas nativas prontas para compilar.`);
