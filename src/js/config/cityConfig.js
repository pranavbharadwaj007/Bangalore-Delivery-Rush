export const CITY_CONFIG = {
    // City dimensions
    gridSize: 40,
    blockSize: 20,
    buildingDensity: 0.3,

    // Colors
    colors: {
        ground: '#3a5a40',
        sky: '#87ceeb',
        buildings: {
            residential: '#d4d4d4',
            commercial: '#4a90e2',
            tech: '#2c3e50',
            landmark: '#ffd700',
            traditional: '#8b4513'
        },
        road: '#4a4a4a',
        itBuildings: [
            0x90caf9,  // Light blue glass
            0x80deea,  // Teal glass
            0x81d4fa,  // Blue glass
            0x4fc3f7   // Darker blue glass
        ],
        roads: {
            main: 0x424242,
            secondary: 0x616161,
            markings: 0xffffff
        }
    },

    // Landmarks
    landmarks: [
        {
            name: 'Vidhana Soudha',
            position: { x: 0, z: 0 },
            scale: { x: 60, y: 80, z: 40 },
            architecture: {
                style: 'neo-dravidian',
                features: ['Central dome', 'Ornate columns', 'Grand steps']
            },
            description: 'The seat of Karnataka\'s state legislature, an imposing example of neo-Dravidian architecture.',
            features: [
                'Granite facade',
                'Four-story building',
                'Central dome with state emblem',
                'Wide flight of steps'
            ]
        },
        {
            name: 'Bangalore Palace',
            position: { x: -100, z: -100 },
            scale: { x: 50, y: 40, z: 50 },
            architecture: {
                style: 'tudor',
                features: ['Tudor towers', 'Fortified walls', 'Courtyard']
            },
            description: 'A royal palace built in Tudor architectural style, inspired by England\'s Windsor Castle.',
            features: [
                'Tudor style architecture',
                'Extensive gardens',
                'Wooden interiors',
                'Gothic windows'
            ]
        },
        {
            name: 'UB City',
            position: { x: 100, z: 100 },
            scale: { x: 40, y: 120, z: 40 },
            architecture: {
                style: 'modern',
                features: ['Glass facade', 'Sky bridge', 'Helipad']
            },
            description: 'Luxury commercial complex and Bangalore\'s first luxury mall.',
            features: [
                'High-end retail stores',
                'Fine dining restaurants',
                'Office spaces',
                'Luxury apartments'
            ]
        },
        {
            name: "Cubbon Park",
            type: "park",
            position: { x: -20, z: -30 },
            scale: { x: 100, y: 1, z: 100 },
            description: "Historic park with rich flora, museums and government buildings",
            features: {
                trees: ["rain-trees", "bamboo", "cassia"],
                structures: ["bandstand", "library", "museum"],
                paths: true
            }
        },
        {
            name: "Lalbagh",
            type: "park",
            position: { x: 60, z: 60 },
            scale: { x: 120, y: 1, z: 120 },
            description: "Botanical garden with historic glasshouse and diverse plant species",
            features: {
                trees: ["tropical", "medicinal", "ornamental"],
                structures: ["glasshouse", "lake", "rock-formation"],
                paths: true
            }
        }
    ],

    // Commercial Areas
    commercialAreas: [
        {
            name: 'MG Road',
            position: { x: 50, z: 0 },
            length: 200,
            width: 40,
            density: 0.8
        },
        {
            name: 'Brigade Road',
            position: { x: 70, z: 50 },
            length: 150,
            width: 30,
            density: 0.7
        },
        {
            name: "Commercial Street",
            position: { x: -15, z: -5 },
            length: 50,
            width: 8,
            description: "Historic shopping area with traditional and modern shops",
            features: ["traditional-shops", "street-vendors", "narrow-lanes"]
        }
    ],

    // Tech Parks
    techParks: [
        {
            name: 'Electronic City',
            position: { x: -150, z: 150 },
            scale: { x: 200, y: 100, z: 200 },
            buildings: 15
        },
        {
            name: 'Manyata Tech Park',
            position: { x: 150, z: -150 },
            scale: { x: 180, y: 80, z: 180 },
            buildings: 12
        }
    ],

    // Lakes
    lakes: [
        {
            name: "Ulsoor Lake",
            position: { x: 40, z: 20 },
            scale: { x: 80, y: 1, z: 60 },
            description: "Historic lake with boating facilities",
            features: ["islands", "walking-track", "temple"]
        }
    ],

    // Roads
    roads: {
        main: [
            {
                name: "MG Road",
                start: { x: -50, z: -15 },
                end: { x: 50, z: -15 },
                width: 12
            },
            {
                name: "Brigade Road",
                start: { x: 20, z: -50 },
                end: { x: 20, z: 20 },
                width: 10
            },
            {
                name: "Commercial Street",
                start: { x: -15, z: -30 },
                end: { x: -15, z: 20 },
                width: 8
            }
        ],
        metro: [
            {
                line: "Purple Line",
                stations: ["Majestic", "MG Road", "Indiranagar"],
                color: "#800080",
                elevated: true
            },
            {
                line: "Green Line",
                stations: ["Majestic", "Mantri Square", "Yeshwantpur"],
                color: "#008000",
                elevated: true
            }
        ]
    },

    // Vegetation
    vegetation: {
        trees: [
            {
                type: "rain-tree",
                frequency: 0.3,
                scale: { min: 10, max: 15 }
            },
            {
                type: "gulmohar",
                frequency: 0.2,
                scale: { min: 8, max: 12 }
            },
            {
                type: "banyan",
                frequency: 0.1,
                scale: { min: 15, max: 20 }
            }
        ],
        parks: [
            {
                name: "Cubbon Park",
                density: 0.8,
                types: ["rain-tree", "bamboo", "flowering"]
            },
            {
                name: "Lalbagh",
                density: 0.9,
                types: ["tropical", "medicinal", "ornamental"]
            }
        ]
    },

    // Environment settings
    environment: {
        sunPosition: { x: 100, y: 100, z: 50 },
        sunColor: 0xffffff,
        sunIntensity: 1.0,
        ambientLight: {
            skyColor: 0x87ceeb,
            groundColor: 0x404040,
            intensity: 0.6
        },
        fog: {
            color: 0xd7e1e9,
            density: 0.002
        }
    }
}; 