import stateService from '../StateService.js';

class SeasonalUIManager {
    constructor() {
        // Try to load user preference first, otherwise check if it's Christmas season
        this.christmasActive = stateService.get('christmasEffectActive') ?? this.isChristmasSeason();
    }

    isChristmasSeason() {
        const today = new Date();
        const month = today.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
        const day = today.getDate();

        // Christmas season: December 1st to December 30th (inclusive)
        if (month === 11 && day >= 1 && day <= 30) {
            return true;
        }
        return false;
    }

    isChristmasEffectActive() {
        return this.christmasActive;
    }

    setChristmasEffect(enabled) {
        this.christmasActive = enabled;
        stateService.set('christmasEffectActive', enabled);
    }
}

export default SeasonalUIManager;