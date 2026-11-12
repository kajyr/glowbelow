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
  dash: {
    speed: 10, // the burst, about twice the squid's top speed
    boostTime: 0.35, // the top speed eases back down over this long
    cooldown: 1, // usable again after this (spec: about 1 s)
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
    gatherAfterPoint: 1.2, // dumbo starts gathering this long after pointing
    // Only sparkles in a box around the squid that stays inside the visible
    // screen, so the child always sees dumbo at work.
    gatherRangeX: 7,
    gatherRangeY: 4.5,
    gatherSpeed: 2.4, // slower than the squid's 4.5
    gatherReach: 0.6,
    gatherPause: 1.0, // the little bounce after each pickup
    gatherInterval: 2.0, // at least this long between pickups
  },
  jelly: {
    speed: 0.6, // the squid swims at 4.5
    /** The model is drawn at this scale; the shapes below already include it. */
    scale: 0.5,
    bellRadius: 0.8,
    /** Bell centre above the jelly's position (the bell opening). */
    bellLift: 0.25,
    /** Where the four arms hang, across the bell (matches the model). */
    arms: [-0.45, -0.15, 0.18, 0.48],
    armLength: 2.75,
    armRadius: 0.25,
    grace: 2, // seconds after a touch before another can spill
    spill: 5, // stars that spill on a touch
    pushRate: 6, // share of the overlap removed per second by the bell
    bounce: 5, // speed the squid bounces away at when it touches the jelly (a bit over top speed)
  },
  firefly: {
    perGroup: 6,
    groupRadius: 1.2, // a group hovers in a cloud this wide; a pulse reaching it makes it join
    // The swarm centre trails behind and a little below the squid.
    followDistance: 2.2,
    followDrop: 0.4,
    speed: 4.4,
    catchUpDistance: 6,
    catchUpSpeed: 11,
    cloudRadius: 1.1, // loose cloud around the swarm centre
    memberSpeed: 12, // top speed of one firefly: above the centre's catch-up speed, so none is left behind
    memberRate: 4, // how quickly a firefly turns toward its spot
    separation: 0.35, // fireflies push apart when closer than this
    swirlTime: 1.2, // the giggly swirl when a group joins
    shapeAfter: 2, // seconds of squid stillness before the swarm makes a shape
    stillSpeed: 0.35,
    // Shapes, in world units around the squid.
    arrowDistance: 2.2, // the arrow's middle, from the squid toward the unlit thing
    arrowLength: 2.6,
    starRadius: 2.0,
    heartRadius: 2.1,
  },
  nautilus: {
    /** The model is drawn at this scale: about 1.5 times the squid. */
    scale: 0.85,
    // Bottom to top and back in about a minute, pauses included (the squid swims at 4.5).
    speed: 3.4,
    pauseTime: 3, // at the top and bottom of its path
    turnTime: 1.2, // easing into and out of a pause
    touchRadius: 1.1, // the shell, around its position
    meetTime: 2.5, // stops and looks at the squid when first met
    shedEvery: 0.8, // seconds between trail sparkles while it moves
    trailCap: 8, // never more trail sparkles than this at once
    trailLife: 10, // a trail sparkle counts toward the cap this long
    trailDrift: 0.35, // trail sparkles drift away behind it this fast
    callPause: 4, // waits this long at the squid's height when called
  },
} as const;
