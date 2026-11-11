/**
 * Every tuning number in one place, so the first playtest can adjust them
 * without hunting through the code. Distances are world units (the squid is
 * about 1.3 units tall), times are seconds.
 */
export const TUNING = {
  squid: {
    topSpeed: 4.5,
    accelRate: 4.5, // how fast velocity eases toward the wanted velocity
    driftRate: 4, // how fast it glides to a stop with no input
    stopBelow: 0.12, // speed under which a drifting squid is at rest
    arriveRadius: 1.6, // slows down when this close to a touch target
    deadZone: 0.35, // hovers when the finger is this close
    radius: 0.55,
  },
  walls: {
    pushRate: 10, // how much of the penetration is removed per second
    slide: 0.85, // share of the into-wall velocity removed on contact
  },
  bump: {
    speedShare: 0.5, // more than half of top speed into a wall
    spinTime: 0.45,
    lockTime: 0.35, // control returns after this (spec: < 0.5 s)
    cooldown: 0.8,
    bounce: 0.45,
  },
  sparkles: {
    density: 0.02, // drifting sparkles per square unit of zone
    fallSpeed: 0.3,
    sway: 0.25,
    magnetRadius: 1.9, // about one squid-width plus the squid's own radius
    collectRadius: 0.55,
    magnetSpeed: 9,
    respawnMin: 1.5,
    respawnMax: 7.5, // spec: new sparkles within about 10 s
  },
  meter: {
    toFill: 15,
  },
  pulse: {
    cooldown: 1.0,
    smallReach: 3.6,
    bigReach: 10.8, // about 3x the small reach
    smallDuration: 0.7,
    bigDuration: 1.3,
    lightTime: 3.5, // how long the area stays lit after a pulse
  },
  hints: {
    moveFadeAfter: 1.0, // seconds of movement
    glowShowAfter: 30,
    idleReturn: 20,
  },
  dumbo: {
    followDistance: 1.8,
    speed: 4.2,
    catchUpDistance: 6,
    catchUpSpeed: 11,
    pointAfter: 2, // seconds of squid stillness
    stillSpeed: 0.35,
  },
} as const;
