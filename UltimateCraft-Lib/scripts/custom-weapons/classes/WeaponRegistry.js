import { world, system, EquipmentSlot } from "@minecraft/server";
import { getMainhand, setEquipment } from "../utils/equipment.js";
import { WeaponEvent } from "./WeaponEvent.js";

// Mappa che conterrà tutte le armi registrate tramite il WeaponBuilder
const weapons = new Map();

/**
 * Genera la barra del cooldown per la action bar.
 */
function getProgressBar(current, max, bars = 20) {
    const fill = Math.round((current / max) * bars);
    const empty = bars - fill;
    return `§8§l${"|".repeat(fill)}§0§l${"|".repeat(empty)}`; 
}

export class WeaponRegistry {
    /**
     * Registra un WeaponBuilder nel motore centrale.
     * @param {Object} weaponBuilder L'arma costruita.
     */
    static register(weaponBuilder) {
        weapons.set(weaponBuilder.id, weaponBuilder);
    }
}

// ==========================================
// IL MOTORE (GIRA IN BACKGROUND AUTOMATICAMENTE)
// ==========================================

// 1. GESTIONE AUREE PASSIVE E COOLDOWN UI
system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const held = getMainhand(player);
        if (!held) continue;

        const weapon = weapons.get(held.typeId);
        if (!weapon) continue;

        // --- Gestione Automatica della UI del Cooldown ---
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

        // --- Esecuzione Aura Passiva ---
        if (weapon.passiveTick) {
            weapon.passiveTick(player, system.currentTick);
            
            // Notifica il sistema che un tick passivo è avvenuto
            WeaponEvent.afterEvents.passiveTick.trigger({
                player: player, 
                item: held, 
                slot: EquipmentSlot.Mainhand, 
                rarity: weapon.rarity, 
                tick: system.currentTick
            });
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

    const eventData = { 
        player: attacker, 
        target: target, 
        item: held, 
        slot: EquipmentSlot.Mainhand, 
        rarity: weapon.rarity 
    };

    // --- BEFORE EVENT: Controlla se l'attacco è stato annullato da qualche altro script ---
    const isCanceled = WeaponEvent.beforeEvents.basicAttack.trigger(eventData);
    if (isCanceled) return;

    // --- ESECUZIONE ATTACCO ARMA ---
    if (weapon.onHit) {
        // Passiamo WeaponEvent all'arma in modo che, se entra un colpo critico, possa triggerare WeaponEvent.afterEvents.chanceAttack
        weapon.onHit(attacker, target, held, WeaponEvent); 
    }

    // --- AFTER EVENT: Notifica che l'attacco è andato a buon fine ---
    WeaponEvent.afterEvents.basicAttack.trigger(eventData);
});

// 3. GESTIONE ABILITÀ (CLICK DESTRO)
world.afterEvents.itemUse.subscribe((ev) => {
    const player = ev.source;
    if (player.typeId !== "minecraft:player") return;

    const held = getMainhand(player);
    if (!held) return;

    const weapon = weapons.get(held.typeId);
    if (!weapon || !weapon.activeAbility) return;

    // --- Controllo automatico del Cooldown ---
    const cooldownEnd = held.getDynamicProperty("active_cd_end");
    if (cooldownEnd && system.currentTick < cooldownEnd) {
        player.dimension.playSound("note.bass", player.location, { pitch: 0.4 });
        return;
    }

    const eventData = { 
        player: player, 
        item: held, 
        slot: EquipmentSlot.Mainhand, 
        rarity: weapon.rarity 
    };

    // --- BEFORE EVENT: Controlla se l'abilità è stata annullata ---
    const isCanceled = WeaponEvent.beforeEvents.abilityUse.trigger(eventData);
    if (isCanceled) return; // Bloccato! Niente consumo di cooldown o durabilità

    // --- CONSUMO AUTOMATICO DURABILITÀ & IMPOSTAZIONE COOLDOWN ---
    if (weapon.durabilityCost > 0) {
        const durability = held.getComponent("durability");
        if (durability) {
            durability.damage += weapon.durabilityCost;
            if (durability.damage >= durability.maxDurability) {
                player.dimension.playSound("random.break", player.location);
                setEquipment(player, EquipmentSlot.Mainhand, undefined); 
            } else {
                held.setDynamicProperty("active_cd_end", system.currentTick + weapon.cooldownTicks);
                setEquipment(player, EquipmentSlot.Mainhand, held);
            }
        }
    } else if (weapon.cooldownTicks > 0) {
        held.setDynamicProperty("active_cd_end", system.currentTick + weapon.cooldownTicks);
        setEquipment(player, EquipmentSlot.Mainhand, held);
    }

    // --- ESECUZIONE ABILITÀ ---
    weapon.activeAbility(player, held);

    // --- AFTER EVENT: Notifica che l'abilità è stata lanciata con successo ---
    WeaponEvent.afterEvents.abilityUse.trigger(eventData);
});
