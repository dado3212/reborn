class Win {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw(ctx) {
    ctx.fillStyle = "#DDBB58";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Life {
  constructor(x, y, width, height, speed) {
    this.originalX = x;
    this.originalY = y;

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;

    this.colors = ["red", "#FF8888"];

    this.velX = 0;
    this.velY = 0;
    this.jumping = false;

    this.incorporeal = true;

    this.ticks = {};
  }

  draw(ctx) {
    ctx.fillStyle = this.colors[(this.incorporeal ? 1 : 0)];
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  reset() {
    this.x = this.originalX;
    this.y = this.originalY;
  }

  die(t) {
    this.colors = ["black", "#777777"];
    this.incorporeal = true;

    if (t in this.ticks)
      this.ticks[t].append("solidify");
    else
      this.ticks[t] = ["solidify"];

    if (0 in this.ticks)
      this.ticks[0].append("spectralize");
    else
      this.ticks[0] = ["spectralize"];
  }
}

var lives;

$(document).ready(function() {

  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;

  function intersect(a, b) {
    if (a.incorporeal || b.incorporeal) return false;
    if (a.x + a.width <= b.x) return false;
    if (a.x >= b.x + b.width) return false;
    if (a.y + a.height <= b.y) return false;
    if (a.y >= b.y + b.height) return false;

    return true;
  }

  function update() {
    // Handle updating the current player with relevant information
    playerActions = [];
    if (keys[38]) {
      playerActions.push("up");
    }

    if (keys[39]) {
      playerActions.push("right");
    }

    if (keys[37]) {
      playerActions.push("left");
    }

    if (keys[32]) {
      keys[32] = false;
      if (lives[0].incorporeal)
        playerActions.push("solidify");
      else
        playerActions.push("spectralize");
    }

    if (playerActions.length > 0) {
      lives[0].ticks[t] = playerActions;
    }

    // Erase the board
    ctx.clearRect(0,0,width,height);
    win.draw(ctx);

    // For each object, process its tick array
    for (var i = lives.length - 1; i >=0; i--) {
      var life = lives[i];

      if (t in life.ticks) {
        if (life.ticks[t].indexOf('up') >= 0) {
          if (!life.jumping) {
            life.jumping = true;
            life.velY = -life.speed*1.8;
          }
        }

        if (life.ticks[t].indexOf('right') >= 0) {
          if (life.velX < life.speed) {
            life.velX+=life.speed/3;
          }
        }

        if (life.ticks[t].indexOf('left') >= 0) {
          if (life.velX > -life.speed) {
            life.velX-=life.speed/3;
          }
        }

        if (life.ticks[t].indexOf('solidify') >= 0) {
          life.incorporeal = false;
        }

        if (life.ticks[t].indexOf('spectralize') >= 0) {
          life.incorporeal = true;
        }
      }

      if (life.y < height-life.height)
        life.velX *= Math.pow(friction, .7);
      else
        life.velX *= friction;
   
      if (life.y < height-life.height) {
        life.velY += gravity;
      }
    
      life.x += life.velX;
      life.y += life.velY;
      
      // Bounding
      if (life.x >= width-life.width) {
        life.x = width-life.width;
      } else if (life.x <= 0) {
        life.x = 0;
      }
    
      if (life.y >= height-life.height){
        life.y = height - life.height;
        life.jumping = false;
        life.velY = 0;
      }

      // Collision detecting
      for (var j = 0; j < lives.length; j++) {
        if (i != j) { // ignore yourself
          if (intersect(life, lives[j])) {
            // Bottom intersects something, get pushed up
            if (life.y + life.height < lives[j].y + lives[j].height) {
              life.y = lives[j].y - life.height;
              life.jumping = false;
              life.velY = 0;
            }
            // Top intersects something, get pushed down
            else if (life.y > lives[j].y) {
              life.y = lives[j].y + lives[j].height;
            }
            // Left intersects something, get pushed out right
            else if (life.x + life.width > lives[j].x + lives[j].width) {
              life.x = lives[j].x + lives[j].width;
            } 
            // Right intersects something, get pushed out right
            else if (life.x < lives[j].x) {
              life.x = lives[j].x - life.width;
            }
          }
        }
      }

      if (intersect(life, win)) {
        keys = []
        alert('You won, with ' + lives.length + ' bodies in ' + (performance.now() - startTime)/1000 + ' seconds.');
        console.log(JSON.stringify(lives));
        keys[82] = true;
      }

      life.draw(ctx);
    }

    // Handle new life
    if (keys[78]) {
      keys[78] = false;

      lives[0].die(t);
      for (var i = 0; i < lives.length; i++) {
        lives[i].reset();
      }
      lives.unshift(new Life(width/2, height - 15, 30, 30, 9));

      t = -1;
    }

    // handle restart
    if (keys[82]) {
      keys[82] = false;

      t = -1;
      startTime = performance.now();
      lives = [new Life(width/2, height - 15, 30, 30, 9)];
    }

    // handle soft reset
    if (keys[83]) {
      keys[83] = false;

      for (var i = 1; i < lives.length; i++) {
        lives[i].reset();
      }
      lives[0] = new Life(width/2, height - 15, 30, 30, 9);

      t = -1;
    }

    t += 1;
      
    requestAnimationFrame(update);
  }

  document.body.addEventListener("keydown", function(e) {
      keys[e.keyCode] = true;
  });

  document.body.addEventListener("keyup", function(e) {
      keys[e.keyCode] = false;
  });

  // Start the game
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var width = 800;
  var height = 600;
  var keys = [];
  var friction = 0.7;
  var gravity = 0.9;
  var t = 0;
  var win = new Win(200, 150, 20, 20);
  var startTime = performance.now();

  lives = [new Life(width/2, height - 15, 30, 30, 9)];

  canvas.width = width;
  canvas.height = height;

  lives[0].draw(ctx);

  update();
});

