import { world, system, EquipmentSlot } from "@minecraft/server";
import { getMainhand, setEquipment } from "../../utils/equipment.js";
import { Event } from "../../classes/Event.js";

const weapons = new Map();

function getProgressBar(current, max, bars = 20) {
    const fill = Math.round((current / max) * bars);
    const empty = bars - fill;
    return `§8§l${"|".repeat(fill)}§0§l${"|".repeat(empty)}`; 
}

export class WeaponRegistry {
    // Registra un WeaponBuilder nel motore
    static register(weaponBuilder) {
        weapons.set(weaponBuilder.id, weaponBuilder);
    }
}

// === IL MOTORE (GIRA IN BACKGROUND) ===

// 1. GESTIONE AUREE PASSIVE E COOLDOWN UI
system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const held = getMainhand(player);
        if (!held) continue;

        const weapon = weapons.get(held.typeId);
        if (!weapon) continue;

        // Gestione Automatica della UI del Cooldown
        if (weapon.cooldownTicks > 0) {
            const cooldownEnd = held.getDynamicProperty("active_cd_end");
            if (cooldownEnd && system.currentTick < cooldownEnd) {
                const remaining = cooldownEnd - system.currentTick;
                const bar = getProgressBar(weapon.cooldownTicks - remaining, weapon.cooldownTicks, 20);
                const seconds = Math.ceil(remaining / 20);
                player.onScreenDisplay.setActionBar(`${bar} §r§8(${seconds}s)`);
            } else if (cooldownEnd && system.currentTick >= cooldownEnd) {
                player.onScreenDisplay.setActionBar(`§8§l${"|".repeat(20)} §r§4§lPRONTO!`);
                held.setDynamicProperty("active_cd_end", undefined);
                setEquipment(player, EquipmentSlot.Mainhand, held);
            }
        }

        // Esegue l'aura passiva definita nel builder
        if (weapon.passiveTick) {
            weapon.passiveTick(player, system.currentTick);
        }
    }
}, 2);

// 2. GESTIONE COLPI (ON HIT)
world.afterEvents.entityHitEntity.subscribe((ev) => {
    const { damagingEntity: attacker, hitEntity: target } = ev;
    if (attacker.typeId !== "minecraft:player") return;

    const held = getMainhand(attacker);
    if (!held) return;

    const weapon = weapons.get(held.typeId);
    if (!weapon) return;

    // Emette l'XP base in automatico!
    Event.emit("weaponOnBasicAttackEvent", { player: attacker, item: held, slot: EquipmentSlot.Mainhand, rarity: weapon.rarity });

    // Esegue la logica specifica dell'arma
    if (weapon.onHit) {
        // Passiamo anche l'Event per permettere di triggerare il drop XP passivo secondario
        weapon.onHit(attacker, target, held, Event); 
    }
});

// 3. GESTIONE ABILITÀ (CLICK DESTRO)
world.afterEvents.itemUse.subscribe((ev) => {
    const player = ev.source;
    if (player.typeId !== "minecraft:player") return;

    const held = getMainhand(player);
    if (!held) return;

    const weapon = weapons.get(held.typeId);
    if (!weapon || !weapon.activeAbility) return;

    // Controllo automatico del Cooldown
    const cooldownEnd = held.getDynamicProperty("active_cd_end");
    if (cooldownEnd && system.currentTick < cooldownEnd) {
        player.dimension.playSound("note.bass", player.location, { pitch: 0.4 });
        return;
    }

    // Consumo automatico della durabilità
    if (weapon.durabilityCost > 0) {
        const durability = held.getComponent("durability");
        if (durability) {
            durability.damage += weapon.durabilityCost;
            if (durability.damage >= durability.maxDurability) {
                player.dimension.playSound("random.break", player.location);
                setEquipment(player, EquipmentSlot.Mainhand, undefined); 
                return;
            } else {
                held.setDynamicProperty("active_cd_end", system.currentTick + weapon.cooldownTicks);
                setEquipment(player, EquipmentSlot.Mainhand, held);
            }
        }
    }

    // Emette l'XP dell'abilità in automatico!
    Event.emit("weaponOnAbilityAttackEvent", { player: player, item: held, slot: EquipmentSlot.Mainhand, rarity: weapon.rarity });

    // Esegue il potere vero e proprio
    weapon.activeAbility(player, held);
});
