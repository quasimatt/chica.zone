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
  14: { image: '/comics/changa14.png', date: '2025-10-14', title: 'A Lesson from Lee'
};

// Expose to browser and Node
if (typeof window !== 'undefined') window.CHICA_COMICS = COMICS;
if (typeof module !== 'undefined' && module.exports) module.exports = COMICS;
