export const ONBOARDING_COUNTRIES = ['United States', 'Canada'];

export const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
    'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
    'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
    'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming',
];

export const CA_PROVINCES = [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
    'Quebec', 'Saskatchewan', 'Yukon',
];

export function regionOptionsFor(country) {
    return country === 'Canada' ? CA_PROVINCES : US_STATES;
}

export function regionLabelFor(country) {
    return country === 'Canada' ? 'Province' : 'State';
}

export function postalLabelFor(country) {
    return country === 'Canada' ? 'Postal Code' : 'ZIP Code';
}

export function postalPlaceholderFor(country) {
    return country === 'Canada' ? 'A1A 1A1' : '00000';
}

export function buildFullAddress({ addressStreet, addressCity, addressRegion, addressPostalCode }) {
    return [addressStreet, addressCity, [addressRegion, addressPostalCode].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', ');
}
