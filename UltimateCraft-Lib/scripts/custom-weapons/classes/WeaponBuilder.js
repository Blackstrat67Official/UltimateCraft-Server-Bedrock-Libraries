export class WeaponBuilder {
    constructor(id) {
        this.id = id;
        this.rarity = "common";
        this.worksInOffhand = false; // Di base, le armi funzionano solo nella mano principale
        this.passiveEffects = [];    // Array per gli effetti pozione passivi
        
        // Callbacks degli eventi
        this.passiveTick = null;
        this.onHit = null;
        this.onHurt = null;          // Nuova logica per i danni subiti
        
        // Dati abilità attiva
        this.activeAbility = null;
        this.cooldownTicks = 0;
        this.durabilityCost = 0;
    }

    // Imposta la rarità dell'arma
    setRarity(rarity) {
        this.rarity = rarity;
        return this;
    }

    // Permette all'arma di funzionare anche nella mano secondaria
    allowOffhand(allow = true) {
        this.worksInOffhand = allow;
        return this;
    }

    // Aggiunge un effetto pozione che viene applicato costantemente finché impugnata
    addPassiveEffect(name, duration = 40, amplifier = 0, showParticles = false) {
        this.passiveEffects.push({ name, duration, amplifier, showParticles });
        return this;
    }

    // Funzione chiamata ogni X tick
    setPassiveAura(callback) {
        this.passiveTick = callback;
        return this;
    }

    // Funzione chiamata quando colpisci un'entità
    setOnHit(callback) {
        this.onHit = callback;
        return this;
    }

    // Funzione chiamata quando il giocatore subisce un danno
    setOnHurt(callback) {
        this.onHurt = callback;
        return this;
    }

    // Funzione chiamata al Click Destro
    setActiveAbility(cooldownTicks, durabilityCost, callback) {
        this.cooldownTicks = cooldownTicks;
        this.durabilityCost = durabilityCost;
        this.activeAbility = callback;
        return this;
    }
}
