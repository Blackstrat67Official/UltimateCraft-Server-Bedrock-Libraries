/**
 * Classe base che emula il comportamento del "Signal" nativo di Minecraft.
 * Gestisce l'iscrizione, la rimozione e l'attivazione dei listener.
 */
class EventSignal {
    constructor() {
        this._listeners = new Set();
    }

    /**
     * Iscrive una funzione per ascoltare questo evento.
     * @param {Function} callback La funzione da eseguire quando l'evento viene attivato.
     * @returns {Function} La callback (utile se vuoi salvarla per fare unsubscribe in futuro).
     */
    subscribe(callback) {
        this._listeners.add(callback);
        return callback;
    }

    /**
     * Rimuove una funzione iscritta in precedenza.
     * @param {Function} callback La funzione esatta che avevi passato a subscribe.
     */
    unsubscribe(callback) {
        this._listeners.delete(callback);
    }

    /**
     * [Solo per uso Interno] Attiva l'evento per tutti i listener iscritti.
     * @param {Object} eventData I dati da passare alla callback.
     */
    _trigger(eventData) {
        for (const listener of this._listeners) {
            try {
                listener(eventData);
            } catch (e) {
                console.error(`[UltimateCraft Event] Errore in un listener:`, e);
            }
        }
    }

    /**
     * [Solo per uso Interno] Attiva un evento "Before" che può essere cancellato.
     * Ritorna true se l'evento può procedere, false se è stato cancellato da un listener.
     */
    _triggerCancellable(eventData) {
        // Aggiungiamo la proprietà 'cancel' in modo nativo
        const cancelableEvent = { ...eventData, cancel: false };
        
        for (const listener of this._listeners) {
            try {
                listener(cancelableEvent);
            } catch (e) {
                console.error(`[UltimateCraft BeforeEvent] Errore in un listener:`, e);
            }
        }
        
        // Se un listener ha impostato event.cancel = true, ritorniamo false (bloccato)
        return !cancelableEvent.cancel;
    }
}

/**
 * Oggetto principale dell'estensione.
 * Contiene tutti gli eventi personalizzati del server.
 */
export const UltimateCraftEvents = {
    /**
     * Eventi che si verificano DOPO che l'azione è già successa.
     * Sola lettura, non possono essere cancellati.
     */
    afterEvents: {
        // Quando un giocatore equipaggia, cambia o rimuove un titolo
        gameTitleChange: new EventSignal(),
        
        // Quando un giocatore avanza di livello / rank
        playerRankUp: new EventSignal(),
        
        // Quando un giocatore cambia un'impostazione dal pannello account
        playerSettingsChange: new EventSignal(),

        // Quando il giocatore completa una missione
        questCompleted: new EventSignal()
    },

    /**
     * Eventi che si verificano PRIMA che l'azione avvenga.
     * Possono essere cancellati impostando `event.cancel = true` all'interno della callback.
     */
    beforeEvents: {
        // Esempio: Prima che avvenga uno scambio (Trade) tra due giocatori
        playerTradeAccept: new EventSignal()
    }
};

/**
 * Usa questa classe per "sparare" gli eventi dall'interno dei tuoi sistemi.
 * (La teniamo separata per evitare che uno script a caso possa triggerare un evento 
 * in modo errato usando UltimateCraft.afterEvents.gameTitleChange._trigger).
 */
export const UltimateCraft = {
    triggerAfterEvent(eventName, eventData) {
        if (UltimateCraftEvents.afterEvents[eventName]) {
            UltimateCraftEvents.afterEvents[eventName]._trigger(eventData);
        }
    },

    triggerBeforeEvent(eventName, eventData) {
        if (UltimateCraftEvents.beforeEvents[eventName]) {
            return UltimateCraftEvents.beforeEvents[eventName]._triggerCancellable(eventData);
        }
        return true; // Se l'evento non esiste, procedi normalmente
    }
};
