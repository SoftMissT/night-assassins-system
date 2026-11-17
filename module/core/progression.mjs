export const ATTRIBUTE_IDS = Object.freeze(['vit', 'dex', 'for', 'car', 'fdv', 'int', 'sab']);
export const MAX_SLAYER_LEVEL = 14;
export const ORIGINS = Object.freeze({
    origem_artista_marcial: {
        name: 'Artista Marcial',
        d12: 1,
        pdv: 16,
        pdr: 10,
        hab1: 'Corpo de Diamante',
        hab6: 'Oito Portões',
    },
    origem_civilizado: {
        name: 'Civilizado',
        d12: 2,
        pdv: 10,
        pdr: 5,
        hab1: 'Rede de Informantes',
        hab6: 'Controle de Multidão',
    },
    origem_corsario: {
        name: 'Corsário',
        d12: 3,
        pdv: 14,
        pdr: 7,
        hab1: 'Jūken-Ryū',
        hab6: 'Pólvora',
    },
    origem_criado_ex_hashira: {
        name: 'Criado por Ex-Hashira',
        d12: 4,
        pdv: 12,
        pdr: 9,
        hab1: 'Memória do Mestre',
        hab6: 'Forma Secreta',
    },
    origem_descendente_perdido: {
        name: 'Descendente Perdido',
        d12: 5,
        pdv: 12,
        pdr: 10,
        hab1: 'Ressonância Sanguínea',
        hab6: 'Marca Latente',
    },
    origem_estrangeiro: {
        name: 'Estrangeiro',
        d12: 6,
        pdv: 13,
        pdr: 8,
        hab1: 'Ritmo Desconhecido',
        hab6: 'Adaptação Cultural',
    },
    origem_isolado: {
        name: 'Isolado',
        d12: 7,
        pdv: 16,
        pdr: 4,
        hab1: 'Pele Grossa',
        hab6: 'Segundo Fôlego',
    },
    origem_militar: {
        name: 'Militar',
        d12: 8,
        pdv: 13,
        pdr: 6,
        hab1: 'Ordem de Campo',
        hab6: 'Fogo de Cobertura',
    },
    origem_monge: {
        name: 'Monge',
        d12: 9,
        pdv: 12,
        pdr: 14,
        hab1: 'Chama Interna',
        hab6: 'Mantra de Proteção',
    },
    origem_ninja: {
        name: 'Ninja',
        d12: 10,
        pdv: 13,
        pdr: 14,
        hab1: 'Passo Fantasma',
        hab6: 'Ponto Cego',
    },
    origem_samurai: { name: 'Samurai', d12: 11, pdv: 14, pdr: 6, hab1: 'Bushidō', hab6: 'Iaidō' },
    origem_tsuguko: {
        name: 'Tsuguko',
        d12: 12,
        pdv: 12,
        pdr: 16,
        hab1: 'Herança Viva',
        hab6: 'Sucessão Perfeita',
    },
    vanilla_aldeao: {
        name: 'Aldeão', roll: [13, 14], pdv: 12, pdr: 2,
        hab1: 'Artesão', hab6: 'Rolamento',
        effect1: 'Faça reparos em armas e equipamentos com 1d20 + DEX + SAB contra CD 12.',
        effect6: 'Uma vez por combate, ao ser alvo de um Kekkijutsu, pode usar uma defesa de 1d20 + DEX + metade de FOR.',
    },
    vanilla_civilizado: {
        name: 'Civilizado', roll: [15, 16], pdv: 12, pdr: 1,
        hab1: 'Versatilidade', hab6: 'Malícia',
        effect1: 'Uma vez por combate, transfira pontos entre PDV e PDR, até seu nível de personagem.',
        effect6: 'Gaste 1 PDR para reduzir o acerto de um ataque surpresa contra um aliado em CAR ou DEX, à sua escolha.',
    },
    vanilla_criado_exterminador: {
        name: 'Criado por Exterminador', roll: [17, 18], pdv: 11, pdr: 2,
        hab1: 'Investigação', hab6: 'Ímpeto',
        effect1: '+2 em testes noturnos para localizar Onis ou perceber atividade deles, a critério do mestre.',
        effect6: '+1 em iniciativa quando houver mais de um inimigo em cena.',
    },
    vanilla_isolado: {
        name: 'Isolado', roll: [19], pdv: 14, pdr: 1,
        hab1: 'Sobrevivência', hab6: 'Ferocidade',
        effect1: 'Uma vez por combate, ao chegar a 0 PDV, use uma reação e teste 1d20 + VIT. Com 10 ou mais, fique com 1 PDV.',
        effect6: 'Sem aliados no combate, pode receber +2 no acerto e −2 na defesa até o início do próximo turno.',
    },
    vanilla_descendente: {
        name: 'Descendente', roll: [20], pdv: 11, pdr: 3,
        hab1: 'Determinação', hab6: 'Marca Especial',
        effect1: 'Uma vez por sessão, escolha um teste de FDV para fazer com vantagem.',
        effect6: 'Pode despertar a Marca a partir de Hinoto. Ao ativá-la, recebe também 10 PDV e 4 PDR temporários até o fim do combate.',
    },
    vanilla_tsuguko: {
        name: 'Tsuguko', roll: [21], pdv: 10, pdr: 3,
        hab1: 'Treinamento aprimorado', hab6: 'Imortal',
        effect1: 'Receba 20% a mais de Ienes por missão e preferência narrativa para liderar, a critério do mestre.',
        effect6: 'Ao chegar a 0 PDV, pode fazer o teste de VIT com +1 por aliado do grupo.',
    },
    vanilla_mestre_uma_coisa: {
        name: 'Mestre de Uma Coisa Só', roll: [22], pdv: 10, pdr: 3,
        hab1: 'Especialista', hab6: 'Fragmentado',
        effect1: 'Domine a primeira Forma da Respiração. Uma vez por combate, pode pagar em PDV o custo em PDR dessa Forma. Esses PDV só voltam com descanso longo em Casa de Glicínias ou Base Slayer.',
        effect6: 'Uma vez por sessão, rerrole um teste falho fora de combate. Declare antes de o mestre narrar a consequência.',
        milestones: [
            { level: 5, name: 'Criar a primeira variação da Forma com o mestre' },
            { level: 7, name: 'Criar a segunda variação da Forma com o mestre' },
            { level: 9, name: 'Criar uma técnica exclusiva com o mestre' },
        ],
    },
});
export const GIFTS = Object.freeze({
    sem_habilidade: { name: 'Sem Habilidade', roll: [1, 26] },
    tato_sensitivo: { name: 'Tato Sensitivo', roll: [27, 36] },
    vanilla_tato_agucado: {
        name: 'Tato Aguçado', roll: [37],
        effect: '+1 ao esquivar ou bloquear ataques surpresa físicos ou à distância contra você.',
    },
    audicao_sobrenatural: { name: 'Audição Sobrenatural', roll: [38, 47] },
    vanilla_audicao_agucada: { name: 'Audição Aguçada', roll: [48], effect: '+1 em testes de Carisma.' },
    visao_agucada: { name: 'Visão Aguçada', roll: [49, 58] },
    vanilla_visao_agucada: { name: 'Visão Aguçada', roll: [59], effect: '+1 no Acerto ao atacar.' },
    olfato_sobrenatural: { name: 'Olfato Sobrenatural', roll: [60, 69] },
    vanilla_olfato_agucado: { name: 'Olfato Aguçado', roll: [70], effect: '+1 em testes de Percepção que envolvam olfato.' },
    metamorfose_carnivora: { name: 'Metamorfose Carnívora', roll: [71, 80] },
    vanilla_transformacao_demoniaca: {
        name: 'Transformação Demoníaca', roll: [81],
        effect: 'Com uma Ação de Ataque, acerte uma mordida em um Oni (1d20 + FOR ou DEX) para ganhar +1 em um atributo à escolha até o fim do combate. Não acumula. Outras habilidades dependem do mestre.',
    },
    tsuyoi: { name: 'Tsuyoi', roll: [82, 91] },
    marechi: { name: 'Marechi', roll: [92, 97] },
    vanilla_marechi: { name: 'Marechi', effect: '+1 PDR máximo por nível de personagem, desde o nível 1.' },
    oketsu: { name: 'Ōketsu', roll: [99] },
    marca_do_destino: { name: 'Marca do Destino', roll: [100] },
});

export function catalogName(id, entry) {
    if (!entry) return '';
    if (id === 'sem_habilidade') return entry.name;
    return `${entry.name} (${id.startsWith('vanilla_') ? 'vanilla' : 'autoral'})`;
}

export function originMilestones(origin, level) {
    if (!origin) return [];
    return [
        { level: 1, name: origin.hab1, effect: origin.effect1 },
        { level: 6, name: origin.hab6, effect: origin.effect6 },
        ...(origin.milestones ?? []),
    ].sort((a, b) => a.level - b.level).map((entry) => ({ ...entry, unlocked: level >= entry.level }));
}
export function classRank(level) {
    if (level >= 12) return 'SS';
    if (level >= 11) return 'S';
    if (level >= 8) return 'A';
    if (level >= 6) return 'B';
    if (level >= 4) return 'C';
    return null;
}
export function snapshotLevel(level) {
    if (level >= 7) return 7;
    if (level >= 3) return 3;
    return 1;
}
export function attributeSnapshots(base, gain3 = '', gain7 = '') {
    const s1 = Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, Number(base?.[id]) || 0]));
    const s3 = { ...s1 };
    if (ATTRIBUTE_IDS.includes(gain3)) s3[gain3] += 1;
    const s7 = { ...s3 };
    if (ATTRIBUTE_IDS.includes(gain7)) s7[gain7] += 1;
    return { 1: s1, 3: s3, 7: s7 };
}
export function currentAttributes(level, snapshots) {
    return { ...snapshots[snapshotLevel(level)] };
}
export function giftBonusPerLevel(gift, level) {
    const pdv = gift === 'tsuyoi' ? (level >= 12 ? 4 : level >= 6 ? 3 : 2) : 0;
    const pdr = gift === 'marechi' || gift === 'vanilla_marechi' ? 1 : gift === 'oketsu' ? 2 : 0;
    return { pdv, pdr };
}
export function slayerMaxResources({ level, origin, snapshots, gift = '', level14 = '' }) {
    const o = typeof origin === 'string' ? ORIGINS[origin] : origin;
    if (!o) return { pdv: null, pdr: null };
    const n = Math.max(1, Math.min(MAX_SLAYER_LEVEL, Math.trunc(Number(level) || 1)));
    const hab = giftBonusPerLevel(gift, n);
    let pdv = 0;
    let pdr = 0;
    for (let i = 1; i <= n; i++) {
        const snap = snapshots[snapshotLevel(i)];
        pdv += o.pdv + snap.vit + hab.pdv;
        pdr += (i === 1 ? o.pdr : 1) + snap.fdv + hab.pdr;
    }
    if (n === MAX_SLAYER_LEVEL) {
        const s7 = snapshots[7];
        if (level14 === 'pdv') pdv += s7.vit * 3;
        if (level14 === 'pdr') pdr += s7.fdv * 2;
    }
    return { pdv, pdr };
}
export function folegoMax(fdv) {
    return 2 + (Number(fdv) || 0);
}
