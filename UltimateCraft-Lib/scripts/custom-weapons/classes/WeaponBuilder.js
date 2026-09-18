export class WeaponBuilder {
    constructor(id) {
        this.id = id;
        this.rarity = "common";
        this.passiveTick = null;
        this.onHit = null;
        
        // Dati abilità attiva
        this.activeAbility = null;
        this.cooldownTicks = 0;
        this.durabilityCost = 0;
    }

    setRarity(rarity) {
        this.rarity = rarity;
        return this; // Permette di concatenare i metodi
    }

    // Funzione chiamata ogni X tick se il player ha l'arma in mano
    setPassiveAura(callback) {
        this.passiveTick = callback;
        return this;
    }

    // Funzione chiamata quando colpisci un'entità
    setOnHit(callback) {
        this.onHit = callback;
        return this;
    }

    // Funzione chiamata al Click Destro (gestisce in automatico Cooldown e Durabilità!)
    setActiveAbility(cooldownTicks, durabilityCost, callback) {
        this.cooldownTicks = cooldownTicks;
        this.durabilityCost = durabilityCost;
        this.activeAbility = callback;
        return this;
    }
}
