export type Landmark = { id: string; name: string };
export type Neighborhood = { id: string; name: string; landmarks: Landmark[] };
export type District = { id: string; name: string; neighborhoods: Neighborhood[] };
export type Region = { id: string; name: string; districts: District[] };
export type City = { id: string; name: string; regions: Region[] };
export type Country = {
  id: string;
  name: string;
  flag: string;
  cities: City[];
};

export const countries: Country[] = [
  {
    id: 'ci',
    name: 'Côte d\'Ivoire',
    flag: '🇨🇮',
    cities: [
      {
        id: 'abidjan',
        name: 'Abidjan',
        regions: [
          {
            id: 'abj-sud',
            name: 'Sud Communal',
            districts: [
              {
                id: 'plateau',
                name: 'Plateau',
                neighborhoods: [
                  { id: 'plateau-centre', name: 'Centre', landmarks: [
                    { id: 'plateau-tour', name: 'Tour de l\'Échangeur' },
                    { id: 'plateau-mairie', name: 'Mairie du Plateau' },
                  ]},
                ],
              },
              {
                id: 'cocody',
                name: 'Cocody',
                neighborhoods: [
                  { id: 'cocody-riviera', name: 'Riviera', landmarks: [
                    { id: 'riviera-palma', name: 'Centre commercial Palma' },
                  ]},
                  { id: 'cocody-angré', name: 'Angré', landmarks: [
                    { id: 'angre-total', name: 'Station Total Angré' },
                  ]},
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bouake',
        name: 'Bouaké',
        regions: [
          {
            id: 'bk-centre',
            name: 'Centre',
            districts: [
              {
                id: 'bk-airport',
                name: 'Aéroport',
                neighborhoods: [
                  { id: 'bk-airport-nord', name: 'Nord Aéroport', landmarks: [
                    { id: 'bk-aeroport-gare', name: 'Gare de Bouaké' },
                  ]},
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'sn',
    name: 'Sénégal',
    flag: '🇸🇳',
    cities: [
      {
        id: 'dakar',
        name: 'Dakar',
        regions: [
          {
            id: 'dk-peninsula',
            name: 'Péninsule',
            districts: [
              {
                id: 'plateau-dkr',
                name: 'Plateau',
                neighborhoods: [
                  { id: 'plateau-dkr-centre', name: 'Centre', landmarks: [
                    { id: 'plateau-dkr-place', name: 'Place de l\'Indépendance' },
                  ]},
                ],
              },
              {
                id: 'medina-dkr',
                name: 'Médina',
                neighborhoods: [
                  { id: 'medina-dkr-centre', name: 'Centre Médina', landmarks: [
                    { id: 'medina-dkr-marche', name: 'Marché de Médina' },
                  ]},
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'thies',
        name: 'Thiès',
        regions: [
          {
            id: 'th-centre',
            name: 'Centre',
            districts: [
              {
                id: 'th-centre-ville',
                name: 'Centre-ville',
                neighborhoods: [
                  { id: 'th-cv-nord', name: 'Nord', landmarks: [
                    { id: 'th-cv-gare', name: 'Gare de Thiès' },
                  ]},
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ng',
    name: 'Nigeria',
    flag: '🇳🇬',
    cities: [
      {
        id: 'lagos',
        name: 'Lagos',
        regions: [
          {
            id: 'lg-island',
            name: 'Island',
            districts: [
              {
                id: 'victoria-island',
                name: 'Victoria Island',
                neighborhoods: [
                  { id: 'vi-centre', name: 'VI Centre', landmarks: [
                    { id: 'vi-eko-hotel', name: 'Eko Hotel' },
                  ]},
                ],
              },
              {
                id: 'lekki',
                name: 'Lekki',
                neighborhoods: [
                  { id: 'lekki-phase1', name: 'Phase 1', landmarks: [
                    { id: 'lekki-mall', name: 'Lekki Mall' },
                  ]},
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'abuja',
        name: 'Abuja',
        regions: [
          {
            id: 'ab-municipal',
            name: 'Municipal Area Council',
            districts: [
              {
                id: 'ab-wuse',
                name: 'Wuse',
                neighborhoods: [
                  { id: 'wuse-2', name: 'Wuse 2', landmarks: [
                    { id: 'wuse-market', name: 'Wuse Market' },
                  ]},
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ke',
    name: 'Kenya',
    flag: '🇰🇪',
    cities: [
      {
        id: 'nairobi',
        name: 'Nairobi',
        regions: [
          {
            id: 'nb-central',
            name: 'Central',
            districts: [
              {
                id: 'westlands',
                name: 'Westlands',
                neighborhoods: [
                  { id: 'westlands-centre', name: 'Centre', landmarks: [
                    { id: 'westlands-sarit', name: 'Sarit Centre' },
                  ]},
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'gh',
    name: 'Ghana',
    flag: '🇬🇭',
    cities: [
      {
        id: 'accra',
        name: 'Accra',
        regions: [
          {
            id: 'acc-greater',
            name: 'Greater Accra',
            districts: [
              {
                id: 'osu',
                name: 'Osu',
                neighborhoods: [
                  { id: 'osu-centre', name: 'Centre', landmarks: [
                    { id: 'osu-oxford', name: 'Oxford Street' },
                  ]},
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export function findCountry(id: string) {
  return countries.find((c) => c.id === id);
}
export function findCity(countryId: string, cityId: string) {
  return findCountry(countryId)?.cities.find((c) => c.id === cityId);
}
export function findRegion(countryId: string, cityId: string, regionId: string) {
  return findCity(countryId, cityId)?.regions.find((r) => r.id === regionId);
}
export function findDistrict(countryId: string, cityId: string, regionId: string, districtId: string) {
  return findRegion(countryId, cityId, regionId)?.districts.find((d) => d.id === districtId);
}
