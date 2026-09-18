/**
 * Rappresenta un segnale di evento base (simile a quelli vanilla).
 * Utilizzato per gli "afterEvents" dove l'azione è già avvenuta.
 */
class Signal {
    constructor() {
        this.listeners = new Set();
    }

    /**
     * Iscrive una funzione per ascoltare questo evento.
     * @param {Function} callback La funzione da eseguire.
     * @returns {Function} Ritorna la callback (utile per l'unsubscribe).
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return callback;
    }

    /**
     * Rimuove un ascoltatore dall'evento.
     * @param {Function} callback La funzione precedentemente iscritta.
     */
    unsubscribe(callback) {
        this.listeners.delete(callback);
    }

    /**
     * [Uso Interno] Emette l'evento e notifica tutti gli iscritti.
     * @param {Object} eventData I dati dell'evento da passare alle callback.
     */
    trigger(eventData) {
        for (const listener of this.listeners) {
            try {
                listener(eventData);
            } catch (error) {
                console.error(`[WeaponEvent] Errore in un listener: ${error}`);
            }
        }
    }
}

/**
 * Rappresenta un segnale annullabile.
 * Utilizzato per i "beforeEvents". Se un listener imposta eventData.cancel = true,
 * l'esecuzione si interrompe e l'azione dell'arma verrà bloccata.
 */
class CancelableSignal extends Signal {
    trigger(eventData) {
        eventData.cancel = false; // Inizializza sempre a false
        
        for (const listener of this.listeners) {
            try {
                listener(eventData);
                // Se un listener ha annullato l'evento, smettiamo di notificare gli altri
                if (eventData.cancel) break;
            } catch (error) {
                console.error(`[WeaponEvent] Errore in un beforeListener: ${error}`);
            }
        }
        
        return eventData.cancel; // Ritorna lo stato finale di cancellazione
    }
}

/**
 * API Globale degli Eventi delle Armi.
 * Strutturata in modo identico agli eventi vanilla di Minecraft (@minecraft/server).
 */
export const WeaponEvent = {
    
    // === BEFORE EVENTS ===
    // Eventi che si attivano PRIMA dell'esecuzione dell'arma. Possono essere annullati.
    beforeEvents: {
        /**
         * Chiamato un attimo prima che un'arma esegua un attacco base.
         * Dati: { player, target, item, slot, rarity, cancel }
         */
        basicAttack: new CancelableSignal(),
        
        /**
         * Chiamato un attimo prima che un'abilità attiva venga lanciata.
         * Dati: { player, item, slot, rarity, cancel }
         */
        abilityUse: new CancelableSignal(),
    },

    // === AFTER EVENTS ===
    // Eventi che si attivano DOPO che l'azione è successa. Usati per generare XP, statistiche, ecc.
    afterEvents: {
        /**
         * Chiamato dopo che un attacco base a segno è stato registrato dal motore.
         * Dati: { player, item, slot, rarity }
         */
        basicAttack: new Signal(),
        
        /**
         * Chiamato quando una probabilità secondaria (es. 20% colpo critico) si attiva con successo.
         * Dati: { player, item, slot, rarity }
         */
        chanceAttack: new Signal(),
        
        /**
         * Chiamato dopo che l'abilità di un'arma è stata castata con successo.
         * Dati: { player, item, slot, rarity }
         */
        abilityUse: new Signal(),
        
        /**
         * Chiamato quando l'arma riceve un aggiornamento d'aura passiva (ogni X tick).
         * Dati: { player, item, slot, rarity, tick }
         */
        passiveTick: new Signal()
    }
};
