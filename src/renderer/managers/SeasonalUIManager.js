import stateService from '../StateService.js';

class SeasonalUIManager {
  constructor() {
    // Try to load user preference first, otherwise check if it's Christmas season
    this.christmasActive = stateService.get('christmasEffectActive') ?? this.isChristmasSeason();
    this.newYearActive = stateService.get('newYearEffectActive') ?? this.isNewYearSeason(); // New
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

  isNewYearSeason() {
    const today = new Date();
    const month = today.getMonth(); // 0-indexed
    const day = today.getDate();

    // New Year season: December 31st to January 6th (inclusive)
    // December (month 11), January (month 0)
    if (month === 11 && day === 31) { // Dec 31st
      return true;
    }
    if (month === 0 && day >= 1 && day <= 6) { // Jan 1st to Jan 6th
      return true;
    }
    return false;
  }

  isNewYearEffectActive() {
    return this.newYearActive;
  }

  setNewYearEffect(enabled) {
    this.newYearActive = enabled;
    stateService.set('newYearEffectActive', enabled);
  }
}

export default SeasonalUIManager;