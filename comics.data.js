// comics.data.js — single source of truth for pages
const COMICS = {
  1: { image: '/comics/changa1.png', date: '2025-10-01', title: 'Chica Mob Quarterly' },
  2: { image: '/comics/changa2.png', date: '2025-10-02', title: 'Cass' },
  3: { image: '/comics/changa3.png', date: '2025-10-03', title: 'David' },
  4: { image: '/comics/changa4.png', date: '2025-10-04', title: 'Kathy' },
  5: { image: '/comics/changa5.png', date: '2025-10-05', title: 'Lee' },
  6: { image: '/comics/changa6.png', date: '2025-10-06', title: 'Maisy' },
  7: { image: '/comics/changa7.png', date: '2025-10-07', title: 'Matt' },
  8: { image: '/comics/changa8.png', date: '2025-10-08', title: 'Chicas Assemble' },
  9: { image: '/comics/changa9.png', date: '2025-10-09', title: 'The Beach' },
  10: { image: '/comics/changa10.png', date: '2025-10-10', title: 'The Beach Criminal' },
  11: { image: '/comics/changa11.png', date: '2025-10-11', title: 'Justice is "Served", Much Like a Volleyball on the Beach' },
  12: { image: '/comics/changa12.png', date: '2025-10-12', title: 'A Song at the Beach' },
  13: { image: '/comics/changa13.png', date: '2025-10-13', title: 'The Dark Stallion' },
  14: { image: '/comics/changa14.png', date: '2025-10-14', title: 'A Lesson from Lee' },
  15: { image: '/comics/changa15.png', date: '2025-10-15', title: "Kathy's Memory" },
  16: { image: '/comics/changa16.png', date: '2025-10-16', title: "The Dark Potion" },
  17: { image: '/comics/changa17.png', date: '2025-10-17', title: "The Secret of Variety Coffee" },
  18: { image: '/comics/changa18.png', date: '2025-10-18', title: "Time to Relax" },
  19: { image: '/comics/changa19.png', date: '2025-10-19', title: "Order Up!" },
  20: { image: '/comics/changa20.png', date: '2025-10-20', title: "Cass's Big Question" },
  21: { image: '/comics/changa21.png', date: '2025-10-21', title: "David's Diagnosis" },
  22: { image: '/comics/changa22.png', date: '2025-10-22', title: "Maisy's Medication Malfunction" },
  23: { image: '/comics/changa23.png', date: '2025-10-23', title: "A Quiet Reflection" },
  24: { image: '/comics/changa24.png', date: '2025-10-24', title: "Matt's Miscalculation" },
  25: { image: '/comics/changa25.png', date: '2025-10-25', title: "Chicos Nuevos" }
};

// Expose to browser and Node
if (typeof window !== 'undefined') window.CHICA_COMICS = COMICS;
if (typeof module !== 'undefined' && module.exports) module.exports = COMICS;
