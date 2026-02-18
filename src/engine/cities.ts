import type { ProGameState, LocationName, DrugName, AssetType } from './types';
import { DISTRICT_MAP } from './constants';
import {
  CITIES,
  CITY_MAP,
} from './pro-constants';

/**
 * Check if the player meets the unlock requirements for a city.
 */
export function meetsUnlockRequirements(state: ProGameState, location: LocationName): boolean {
  const city = CITY_MAP[location];
  if (!city) return true; // NYC districts are always available

  const { assets: requiredAssets } = city.unlockRequirements;

  // Check all required assets are owned
  return requiredAssets.every((assetType: AssetType) =>
    state.assets.some((a) => a.type === assetType)
  );
}

/**
 * Check if the player can travel to a destination.
 */
export function canTravelTo(state: ProGameState, destination: LocationName): boolean {
  if (destination === state.currentDistrict) return false;
  return meetsUnlockRequirements(state, destination);
}

/**
 * Get the effective travel cost after Plane reduction.
 */
export function getEffectiveTravelCost(state: ProGameState, destination: LocationName): number {
  const city = CITY_MAP[destination];
  if (!city) return 0; // NYC districts are free

  // Plane eliminates all inter-city travel costs
  if (state.assets.some((a) => a.type === 'Plane')) {
    return 0;
  }

  return city.travelCost;
}

/**
 * Get all available destinations from the current location.
 */
export function getAvailableDestinations(state: ProGameState): LocationName[] {
  const destinations: LocationName[] = [];

  // NYC districts (always available, except current)
  const districts: LocationName[] = ['Bronx', 'Ghetto', 'Central Park', 'Manhattan', 'Coney Island', 'Brooklyn'];
  for (const d of districts) {
    if (d !== state.currentDistrict) {
      destinations.push(d);
    }
  }

  // Cities (if requirements met)
  for (const city of CITIES) {
    if (city.name !== state.currentDistrict && meetsUnlockRequirements(state, city.name)) {
      destinations.push(city.name);
    }
  }

  return destinations;
}

/**
 * Get the price modifier for a drug at a location.
 * Returns 1.0 for NYC districts (no modification).
 */
export function getPriceModifier(location: LocationName, drug: DrugName): number {
  const city = CITY_MAP[location];
  if (!city) return 1.0; // NYC districts use base prices

  return city.priceModifiers[drug] ?? 1.0;
}

/**
 * Get the danger level for a location.
 */
export function getLocationDangerLevel(location: LocationName): number {
  // Check if it's a city
  const city = CITY_MAP[location];
  if (city) return city.dangerLevel;

  // Check if it's a district
  const district = DISTRICT_MAP[location as keyof typeof DISTRICT_MAP];
  if (district) return district.dangerLevel;

  return 1; // fallback
}

/**
 * Check if a location is an inter-city destination (not NYC district).
 */
export function isCity(location: LocationName): boolean {
  return location === 'Miami' || location === 'Los Angeles' || location === 'Medellin';
}
