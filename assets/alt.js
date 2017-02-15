window.onload = function() {
// module aliases
var Engine = Matter.Engine,
  Render = Matter.Render,
  World = Matter.World,
  Events = Matter.Events,
  Bodies = Matter.Bodies,
  Body = Matter.Body;

// Key constants for readability
const KEY_UP = 38;
const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_SUICIDE = 88; // X
const KEY_Z = 90;
const KEY_CORPOREAL = 67; // C

// create an engine
var engine = Engine.create();

var render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: 800,
    height: 600,
    pixelRatio: 1,
    background: '#222',
    wireframeBackground: '#222',
    enabled: true,
    wireframes: false,
  }
});

//add the walls
var wallOptions = {
  isStatic: true,
  render: {
    fillStyle: '#222',
    strokeStyle: 'white',
    lineWidth: 1,
  },
}
var offset = 5;
World.add(engine.world, [
  Bodies.rectangle(400, -offset, 800 + 2 * offset, 50, wallOptions),
  Bodies.rectangle(400, 600 + offset, 800 + 2 * offset, 50, wallOptions),
  Bodies.rectangle(800 + offset, 300, 50, 600 + 2 * offset, wallOptions),
  Bodies.rectangle(-offset, 300, 50, 600 + 2 * offset, wallOptions)
]);

// add some ramps to the world for the bodies to roll down
World.add(engine.world, [
  Bodies.rectangle(340, 580, 700, 20, {
    isStatic: true,
    angle: Math.PI * 0.06,
    render: {
      fillStyle: '#222',
      strokeStyle: 'white',
      lineWidth: 1,
    }
  })
]);

// Player creation function
function createPlayer(spawn) {
  return Bodies.rectangle(spawn.x, spawn.y, 25, 25, {
    density: 0.05,
    friction: 0.1,
    frictionStatic: 0.1,
    frictionAir: 0,
    restitution: 0,
    ground: false,
    inertia: Infinity,
    render: {
      fillStyle: '#ddd',
      strokeStyle: 'white',
      lineWidth: 1,
    },
    // Custom parameters
    spawn: spawn,
    // Replay parameters
    corporeal: true,
    active: true,
    moveList: [],
  });
}

// Set up the world
engine.world.gravity.y = 3.3;
engine.world.bounds = Matter.Bounds.create([{ x: 5, y: 5 }, { x: 795, y: 595 }])

var jump = 1.9;
var maxSpeed = 4;
var acceleration = 0.5;

// Keep track of key presses
var keys = [];
document.body.addEventListener('keydown', function(e) {
  keys[e.keyCode] = true;
});
document.body.addEventListener('keyup', function(e) {
  keys[e.keyCode] = false;
});

// Set up general game
var lives = [createPlayer({x: 600, y: 520})];
World.add(engine.world, lives[0]);
var ticks = 0;

// Handle collisions
Events.on(engine, 'collisionStart', function(event) {
  var pairs = event.pairs;
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];

    if (Math.abs(pair.collision.normal.x) < 1) {
      var indexA = lives.indexOf(pair.bodyA);
      var indexB = lives.indexOf(pair.bodyB);

      // Need to examine pair.collision.normal.x and y
      if (indexA >= 0 && pair.bodyA.position.y < pair.bodyB.position.y) {
        lives[indexA].ground = true;
      }
      if (indexB >= 0  && pair.bodyB.position.y < pair.bodyA.position.y) {
        lives[indexB].ground = true;
      }
    }
  }
});

Events.on(engine, 'collisionActive', function(event) {
  var pairs = event.pairs
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];

    if (Math.abs(pair.collision.normal.x) < 1) {
      var indexA = lives.indexOf(pair.bodyA);
      var indexB = lives.indexOf(pair.bodyB);

      // Need to examine pair.collision.normal.x and y
      if (indexA >= 0 && pair.bodyA.position.y < pair.bodyB.position.y) {
        lives[indexA].ground = true;
      }
      if (indexB >= 0  && pair.bodyB.position.y < pair.bodyA.position.y) {
        lives[indexB].ground = true;
      }
    }
  }
});

Events.on(engine, 'collisionEnd', function(event) {
  var pairs = event.pairs;
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var indexA = lives.indexOf(pair.bodyA);
    var indexB = lives.indexOf(pair.bodyB);

    if (indexA >= 0) {
      lives[indexA].ground = false;
    }
    if (indexB >= 0) {
      lives[indexB].ground = false;
    }
  }
});

//main engine update loop
Events.on(engine, 'beforeTick', function(event) {
  var playerActions = [];

  // Handle recording moves for playback
  if (keys[KEY_UP]) {
    playerActions.push('jump');
  }
  if (keys[KEY_LEFT]) {
    playerActions.push('left');
  }
  if (keys[KEY_RIGHT]) {
    playerActions.push('right');
  }
  if (keys[KEY_CORPOREAL]) {
    playerActions.push('corporeal');
  }

  if (playerActions.length > 0) {
    lives[0].moveList[ticks] = playerActions;
  }

  console.log(lives[0].velocity);

  // Process stored moves
  for (var i = lives.length - 1; i >=0; i--) {
    var life = lives[i];
    if (ticks in life.moveList) {
      var total_force = {
        x: 0,
        y: 0,
      }
      if (life.moveList[ticks].indexOf('jump') >= 0 && life.ground) {
        total_force.y = -jump;
      }
      if (life.moveList[ticks].indexOf('left') >= 0 && Math.abs(life.velocity.x) < maxSpeed) {
        life.position.x -= acceleration;
      }
      if (life.moveList[ticks].indexOf('right') >= 0 && Math.abs(life.velocity.x) < maxSpeed) {
        life.position.x += acceleration;
      }

      Body.setVelocity(life, { x: 0, y: life.velocity.y });

      if (life.moveList[ticks].indexOf('corporeal') >= 0) {
        life.render.fillStyle = (life.corporeal ? 'transparent' : '#ddd');
        life.corporeal = !life.corporeal;
        keys[KEY_CORPOREAL] = false;
      }
    }
  }

  if (keys[KEY_SUICIDE]) {
    lives[0].active = false;
    lives.unshift(createPlayer({x: 600, y: 520}));
    World.add(engine.world, lives[0]);

    // Reset everyone
    for (var i = 0; i < lives.length; i++) {
      lives[i].velocity = { x: 0, y: 0 };
      lives[i].position = lives[i].spawn;
    }

    keys[KEY_SUICIDE] = false;

    ticks = -1;
  }

  ticks += 1;
});

// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);
};
