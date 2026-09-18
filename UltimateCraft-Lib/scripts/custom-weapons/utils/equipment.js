import { EquipmentSlot } from "@minecraft/server";

/**
 * Ottiene il componente di equipaggiamento di un'entità/giocatore
 * Funzione di supporto interna per non ripetere codice.
 */
function getEquippable(entity) {
    return entity.getComponent("equippable");
}

/**
 * Ottiene l'oggetto nella mano principale del giocatore
 * @param {Player} player 
 * @returns {ItemStack | undefined} L'oggetto impugnato, o undefined se la mano è vuota
 */
export function getMainhand(player) {
    const equippable = getEquippable(player);
    return equippable ? equippable.getEquipment(EquipmentSlot.Mainhand) : undefined;
}

/**
 * Ottiene l'oggetto nella mano secondaria (scudo/totem)
 * @param {Player} player 
 * @returns {ItemStack | undefined}
 */
export function getOffhand(player) {
    const equippable = getEquippable(player);
    return equippable ? equippable.getEquipment(EquipmentSlot.Offhand) : undefined;
}

/**
 * Verifica rapidamente se il giocatore ha in mano (principale) un'arma specifica
 * @param {Player} player 
 * @param {string} itemTypeId - L'ID dell'arma (es. "mio_addon:spada_del_caos")
 * @returns {boolean}
 */
export function isHolding(player, itemTypeId) {
    const item = getMainhand(player);
    return item !== undefined && item.typeId === itemTypeId;
}

/**
 * Imposta un oggetto in uno slot specifico (es. per aggiornare la durabilità o dare l'arma)
 * @param {Player} player 
 * @param {EquipmentSlot} slot - Es: EquipmentSlot.Mainhand
 * @param {ItemStack} itemStack - L'oggetto da inserire
 */
export function setEquipment(player, slot, itemStack) {
    const equippable = getEquippable(player);
    if (equippable) {
        equippable.setEquipment(slot, itemStack);
    }
}

/**
 * Ottiene tutta l'armatura attualmente indossata
 * @param {Player} player 
 * @returns {Object} Un oggetto contenente head, chest, legs e feet
 */
export function getArmor(player) {
    const equippable = getEquippable(player);
    if (!equippable) return {};

    return {
        head: equippable.getEquipment(EquipmentSlot.Head),
        chest: equippable.getEquipment(EquipmentSlot.Chest),
        legs: equippable.getEquipment(EquipmentSlot.Legs),
        feet: equippable.getEquipment(EquipmentSlot.Feet)
    };
}
