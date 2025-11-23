// src/pages/vreme-harta/data.js
// MOCK backend (cu straturi)
export function getSereData() {
    return [
      {
        id: "g1",
        nume: "Sera Spanac",
        suprafata: 120,
        lungime: 20,
        latime: 6,
        cultura: "spanac",
        boardId: "e663ac91d3824a2c",
        dataRecoltarii: "2025-09-10",
        straturi: [
          { nume: "Strat A", suprafata: 40, zile: 18 },
          { nume: "Strat B", suprafata: 30, zile: 22 },
          { nume: "Strat C", suprafata: 90, zile: 5 },
        ],
      },
      {
        id: "g2",
        nume: "Sera Roșii",
        suprafata: 240,
        lungime: 30,
        latime: 8,
        cultura: "roșii",
        boardId: "b123456789abcdef",
        dataRecoltarii: "2025-08-15",
        straturi: [
          { nume: "Strat A", suprafata: 100, zile: 7 },
          { nume: "Strat B", suprafata: 80, zile: 12 },
          { nume: "Strat C", suprafata: 90, zile: 5 },
        ],
      },
      {
        id: "g3",
        nume: "Sera Ardei",
        suprafata: 180,
        lungime: 30,
        latime: 6,
        cultura: "ardei",
        boardId: "c123456789abcdef",
        dataRecoltarii: "2025-08-20",
        straturi: [
          { nume: "Strat A", suprafata: 70, zile: 11 },
          { nume: "Strat B", suprafata: 50, zile: 14 },
          { nume: "Strat C", suprafata: 90, zile: 5 },
        ],
      },
    ];
  }
  