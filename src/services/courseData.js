/**
 * Manhattan Woods Golf Club — Test Course Data
 * Back 9 confirmed from scorecard; Front 9 estimated from constraints
 * GPS: 41.069°N, 73.989°W | Altitude: 350ft | Gary Player Design, 1998
 */

export const MANHATTAN_WOODS = {
  id: 'manhattan-woods',
  name: 'Manhattan Woods Golf Club',
  location: 'West Nyack, NY',
  architect: 'Gary Player',
  year: 1998,
  par: 72,
  lat: 41.069,
  lon: -73.989,
  altitude_ft: 350,
  stimp_baseline: 10.5,
  rough_baseline: 2.5,
  tee_boxes: {
    black: { yardage: 7110, rating: 75.0, slope: 141, label: 'Black' },
    gold:  { yardage: 6645, rating: 72.8, slope: 136, label: 'Gold' },
    blue:  { yardage: 6180, rating: 70.5, slope: 130, label: 'Blue' },
    white: { yardage: 5520, rating: 67.8, slope: 121, label: 'White' },
  },
};

export const MANHATTAN_WOODS_HOLES = [
  { hole:1,  par:4, yds:{black:405,gold:378,blue:352,white:312}, hcp:9,  heading:35,  elev:8,   gsize:5600, shape:'round',  tiers:1, bunkers:3, water:false, ob:'right', fwWidth:36, trees:60 },
  { hole:2,  par:5, yds:{black:535,gold:500,blue:465,white:415}, hcp:5,  heading:310, elev:-12,  gsize:6200, shape:'oblong', tiers:2, bunkers:5, water:true,  ob:null,    fwWidth:34, trees:55 },
  { hole:3,  par:3, yds:{black:185,gold:165,blue:148,white:128}, hcp:15, heading:195, elev:-18,  gsize:4800, shape:'kidney', tiers:2, bunkers:4, water:false, ob:null,    fwWidth:0,  trees:70 },
  { hole:4,  par:4, yds:{black:440,gold:410,blue:380,white:340}, hcp:1,  heading:85,  elev:22,   gsize:5000, shape:'tiered', tiers:3, bunkers:5, water:false, ob:'left',  fwWidth:30, trees:65 },
  { hole:5,  par:4, yds:{black:390,gold:365,blue:340,white:300}, hcp:11, heading:155, elev:-5,   gsize:5400, shape:'round',  tiers:1, bunkers:3, water:false, ob:'right', fwWidth:38, trees:50 },
  { hole:6,  par:5, yds:{black:555,gold:520,blue:485,white:435}, hcp:7,  heading:270, elev:10,   gsize:6500, shape:'oblong', tiers:2, bunkers:6, water:true,  ob:'right', fwWidth:33, trees:55 },
  { hole:7,  par:4, yds:{black:415,gold:385,blue:358,white:318}, hcp:3,  heading:350, elev:28,   gsize:4600, shape:'tiered', tiers:3, bunkers:4, water:false, ob:'both',  fwWidth:29, trees:70 },
  { hole:8,  par:3, yds:{black:200,gold:180,blue:160,white:135}, hcp:17, heading:120, elev:-10,  gsize:5200, shape:'kidney', tiers:2, bunkers:3, water:true,  ob:null,    fwWidth:0,  trees:60 },
  { hole:9,  par:4, yds:{black:360,gold:338,blue:315,white:280}, hcp:13, heading:240, elev:-8,   gsize:5000, shape:'round',  tiers:1, bunkers:4, water:false, ob:'left',  fwWidth:35, trees:55 },
  { hole:10, par:4, yds:{black:456,gold:425,blue:395,white:355}, hcp:10, heading:165, elev:-15,  gsize:5500, shape:'oblong', tiers:2, bunkers:3, water:false, ob:null,    fwWidth:35, trees:60 },
  { hole:11, par:4, yds:{black:415,gold:388,blue:360,white:320}, hcp:12, heading:45,  elev:12,   gsize:5200, shape:'round',  tiers:1, bunkers:4, water:false, ob:'left',  fwWidth:33, trees:65 },
  { hole:12, par:3, yds:{black:181,gold:162,blue:145,white:120}, hcp:18, heading:280, elev:5,    gsize:4500, shape:'kidney', tiers:2, bunkers:3, water:false, ob:null,    fwWidth:0,  trees:70 },
  { hole:13, par:5, yds:{black:550,gold:515,blue:480,white:430}, hcp:4,  heading:200, elev:-20,  gsize:6000, shape:'tiered', tiers:3, bunkers:5, water:true,  ob:'right', fwWidth:32, trees:55 },
  { hole:14, par:4, yds:{black:460,gold:430,blue:400,white:360}, hcp:2,  heading:75,  elev:25,   gsize:4800, shape:'tiered', tiers:3, bunkers:5, water:false, ob:'both',  fwWidth:28, trees:70 },
  { hole:15, par:5, yds:{black:491,gold:460,blue:428,white:385}, hcp:14, heading:330, elev:8,    gsize:6400, shape:'oblong', tiers:2, bunkers:6, water:false, ob:'left',  fwWidth:36, trees:50 },
  { hole:16, par:4, yds:{black:453,gold:422,blue:392,white:352}, hcp:8,  heading:110, elev:-6,   gsize:5000, shape:'kidney', tiers:2, bunkers:4, water:false, ob:'right', fwWidth:31, trees:65 },
  { hole:17, par:3, yds:{black:198,gold:178,blue:158,white:130}, hcp:16, heading:225, elev:-30,  gsize:4200, shape:'tiered', tiers:2, bunkers:3, water:true,  ob:null,    fwWidth:0,  trees:45 },
  { hole:18, par:4, yds:{black:421,gold:395,blue:368,white:328}, hcp:6,  heading:305, elev:15,   gsize:5600, shape:'round',  tiers:2, bunkers:5, water:false, ob:'right', fwWidth:32, trees:60 },
];
