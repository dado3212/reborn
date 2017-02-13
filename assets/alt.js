window.onload = function() {
// module aliases
var Engine = Matter.Engine,
  Render = Matter.Render,
  World = Matter.World,
  Events = Matter.Events,
  Bodies = Matter.Bodies;

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
    wireframes: true,
  }
});

//add the walls
var offset = 5;
World.add(engine.world, [
  Bodies.rectangle(400, -offset, 800 + 2 * offset, 50, {
    isStatic: true
  }),
  Bodies.rectangle(400, 600 + offset, 800 + 2 * offset, 50, {
    isStatic: true
  }),
  Bodies.rectangle(800 + offset, 300, 50, 600 + 2 * offset, {
    isStatic: true
  }),
  Bodies.rectangle(-offset, 300, 50, 600 + 2 * offset, {
    isStatic: true
  })
]);

// add some ramps to the world for the bodies to roll down
World.add(engine.world, [
  Bodies.rectangle(340, 580, 700, 20, {
    isStatic: true,
    angle: Math.PI * 0.06
  })
]);

//add the player
var player = Bodies.rectangle(600, 520, 25, 25, {
  density: 0.1,
  friction: 0.6,
  frictionStatic: 0.2,
  frictionAir: 0.15,
  restitution: 0,
  ground: false,
  inertia: Infinity,
});

engine.world.gravity.y = 7;
engine.world.bounds = Matter.Bounds.create([{ x: 5, y: 5 }, { x: 795, y: 595 }])

var jump = 10;
var maxSpeed = 100;
var ground_acceleration = 1;
var air_acceleration = 0.4;

// Add the player to the world
World.add(engine.world, player);

// Keep track of key presses
var keys = [];
document.body.addEventListener("keydown", function(e) {
  keys[e.keyCode] = true;
});
document.body.addEventListener("keyup", function(e) {
  keys[e.keyCode] = false;
});

//at the start of a colision for player
Events.on(engine, "collisionStart", function(event) {
  console.log(event.pairs[0]);
  var pairs = event.pairs;
  for (var i = 0, j = pairs.length; i != j; ++i) {
    var pair = pairs[i];
    console.log(pair.collision.normal);
    if ((pair.bodyA === player || pair.bodyB === player) && Math.abs(pair.collision.normal.x) < 1) {
      player.ground = true;
    }
  }
});
//ongoing checks for collisions for player
Events.on(engine, "collisionActive", function(event) {
  var pairs = event.pairs
  for (var i = 0, j = pairs.length; i != j; ++i) {
    var pair = pairs[i];
    if ((pair.bodyA === player || pair.bodyB === player) && Math.abs(pair.collision.normal.x) < 1) {
      player.ground = true;
    }
  }
});
//at the end of a colision for player
Events.on(engine, 'collisionEnd', function(event) {
  var pairs = event.pairs;
  for (var i = 0, j = pairs.length; i != j; ++i) {
    var pair = pairs[i];
    if (pair.bodyA === player || pair.bodyB === player) {
      player.ground = false;
    }
  }
})

//main engine update loop
Events.on(engine, "beforeTick", function(event) {
  if (keys[32]) {console.log(player)};
  //jump
  var total_force = {
    x: 0,
    y: 0,
  }

  if (keys[38] && player.ground) {
    total_force.y = -jump;
  }
  //spin left and right
  if (keys[37] && player.speed < maxSpeed) {
    total_force.x -= (player.ground ? ground_acceleration : air_acceleration);
  } else if (keys[39] && player.speed < maxSpeed) {
    total_force.x += (player.ground ? ground_acceleration : air_acceleration);
  }
  player.force = total_force;
});

// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);
};
