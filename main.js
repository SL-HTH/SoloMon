// https://bulbapedia.bulbagarden.net/wiki/Experience
// Type effectiveness https://unrealitymag.com/wp-content/uploads/2014/11/rby-rules.jpg
// Music ref. Scythe - メモリーデイズ

/*
  TODO:
  -Code
  --Z-index
  ---3 draw loops in order
  --Collision all layers. Current only 0

  -Water animation

  -Map
  --World map and shops/residential
*/

const ini = {
  WIDTH: 160,
  HEIGHT: 144,
  SCALE: 3,

  SS: 8,
  GN: 0
};

const assets = {
  toLoad: 15,
  loaded: 0,

  imgs: [],
  maps: [],
  snds: [],
  diag: []
};

/** @type {CanvasRenderingContext2D} */
let ctx = null;
let cnv = null;

const ll = console.log;
let span = null;


let keys = [];
const keyHandler = e => {
  e.preventDefault();
  keys[e.keyCode] = (e.type == "keydown");
}

let solids = {
  // Invisible
  16:true,
  // Mountain border
  70:true,
  71:true,
  72:true,
  102:true,
  104:true,
  134:true,
  135:true,
  136:true,

  // Rock/Dirt Border
  85: true,
  86: true,
  87: true,
  117:true,
  118:true,
  119:true,
  149:true,
  150:true,
  151:true,

  // Sphere railing
  167:true,
  199:true,
  231:true,
  232:true,

  // Tree stack
  196:true,
  197:true,
  228:true,
  229:true,

  // Tree Bark
  224:true,
  225:true,
  226:true,
  227:true,

  // Signs
  // -metal
  233:true,
  234:true,
  265:true,
  266:true,
  // -wood
  235:true,
  236:true,
  267:true,
  268:true,

  // Small Bush and Rock
  256:true,
  257:true,

  // Metal Fence
  416:true,
  417:true,
  448:true,
  449:true,
  450:true, // Pole
  480:true,
  512:true,
  513:true,
  514:true,

  // Wood Fence
  419:true,
  420:true,
  421:true,
  451:true,
  452:true,
  483:true,
  515:true,
  516:true,
  517:true,

  // Furniture
  // 0
  424:true, // screen
  425:true,
  428:true, // leg
  429:true,
  // 1
  454:true,
  455:true,
  456:true,
  457:true,
  458:true,
  459:true,
  460:true,
  461:true,
  462:true,
  463:true,
  464:true,
  467:true,
  468:true,
  // 2
  494:true, // table
  495:true,
  496:true,
  // 3
  518:true,
  519:true,
  520:true,
  521:true,
  522:true, // mini table
  523:true,
  524:true,
  525:true,
  529:true, // Flower face
  530:true,

  // Buildings
  559:true, // window
  576:true,
  577:true,
  578:true,
  579:true,
  580:true,
  581:true,
  582:true,
  583:true,
  584:true,
  585:true,
  586:true,
  587:true,
  588:true,
  589:true,
  590:true,

  // Bottom roof
  608:true,
  609:true,
  610:true,
  611:true,
  612:true,
  613:true,
  614:true,
  615:true,
  616:true,
  617:true,
  618:true,
  619:true,
  620:true,
  621:true,
  622:true,

  // -Middle
  640:true,
  641:true,
  642:true,
  643:true,
  644:true,
  645:true,
  646:true,
  647:true,
  648:true,
  649:true,
  650:true,
  651:true,
  652:true,
  653:true,
  654:true,

  // Doors
  704:true,
  705:true,
  706:true,
  707:true,
  708:true,
  709:true,
  710:true,
  711:true,
  // -Glass
  712:true,
  713:true,
  714:true,
  715:true,
  716:true,
  717:true,
  718:true,
  719:true,

  // NPC
  783:true, // Mon slime
  784:true, // Mon lucha
  787:true, // Haris
  788:true,
  809:true, // Ghost
  810:true,
  811:true, // Bandit
  812:true,
  813:true, // Girl purple
  814:true,
  815:true, // Mon black
  816:true, // Mon dog
  817:true, // Man bald
  818:true,
  841:true, // Mon ghost blue
  874:true, // Scientist
  875:true,
  876:true, // Saanton
  877:true

};


let stateStack = null;
function StateHandler(){
  this.states = [];

  this.push = function(state){
    if(state){
      this.states.push(state);
      state.onEnter();
    }
  }
  this.pop = function(){
    if (this.states.length > 0)
        this.states.pop().onExit();
  }

  this.init = function(){
    if (this.states.length > 0)
      this.states[this.states.length-1].init();
  }
  this.update = function(dt){
    if (this.states.length > 0)
      this.states[this.states.length-1].update(dt);
  }
  this.render = function(label=false){
    if (this.states.length > 0){
      if (this.states[this.states.length-1].label){
        this.states[this.states.length-2].render();
      }
      if (this.states.length >= 3 && this.states[this.states.length-2].label){
        this.states[this.states.length-3].render();
      }
      if (this.states.length >= 4 && this.states[this.states.length-3].label){
        this.states[this.states.length-4].render();
      }
      this.states[this.states.length-1].render();
    }
  }

  this.length = function(){
    return this.states.length;
  }
}

function State(){
  this.timer = 0;

  this.onEnter = function(){}
  this.init = function(){}
  this.update = function(dt){}
  this.render = function(){}
  this.onExit = function(){}

  this.gameobjects = [];
  this.current_map = null;

  this.label = false;

  this.cam = {
    x: 0,
    y: 0,
    focus: null,

    shake_timer: 0,
    shake_speed: 0.2,
    shake_done: true,

    set: function(){
      ctx.save();
      ctx.translate(-this.x * ini.SCALE,-this.y * ini.SCALE);
    },
    unset: function(){
      ctx.restore();
    },

    update: function(obj){
      this.x = obj.x - (ini.WIDTH * 0.5 - ini.SS);
      this.y = obj.y - (ini.HEIGHT * 0.5 - ini.SS);
    },
    shake: function(x_factor, y_factor, dt, duration){
      this.shake_timer += dt;
    }
  };

  this.build_map = function(map=null){
    if (!map){ll("No map");return;}

    assets.maps[map].gameobjects = [];

    let layers = assets.maps[map].layers;

    let ss_cols = assets.maps[map].tilesets[0].imagewidth / assets.maps[map].tilewidth;

    for (let i in layers){
      for (let j in layers[i].data){
        let current = layers[i].data[j];

        let sprite = null;
        let xx = -1;
        let yy = -1;

        let sx = 0;
        let sy = 0;
        let sw = ini.SS;
        let sh = ini.SS;

        

        if (current != 0) {
          xx = ((j % assets.maps[map].width) | 0) * ini.SS;
          yy = ((j / assets.maps[map].width) | 0) * ini.SS;

          sx = (((current-1) % ss_cols) | 0) * ini.SS;
          sy = (((current-1) / ss_cols) | 0) * ini.SS;

          sprite = checkTileType(current-1, xx, yy, i, map);

          if (sprite){
            sprite.sx = sx;
            sprite.sy = sy;
            assets.maps[map].gameobjects.push(sprite);
          }

        }
      }
    }
  }
}

function TestState(){
  let self = new State();

  self.onEnter = function(){
    ll("ONENTER");
  }
  self.onExit = function(){
    ll("onexit");
  }

  self.init = function(){
    ll("init");
  }
  self.update = function(dt){
    ll("update");
  }
  self.render = function(){
    ll("render");
  }

  return self;
}

function StartScreenState(){
  let self = new State();

  self.txt_solomon = null;
  self.txt_start = null;
  self.txt_hth = null;

  self.onEnter = function(){
    this.txt_solomon = new GameObject(0,0);
    this.txt_solomon.sx = 8;
    this.txt_solomon.sy = 0;
    this.txt_solomon.sw = 72;
    this.txt_solomon.sh = 16;

    this.txt_solomon.x = 44;
    this.txt_solomon.y = -16;
    this.txt_solomon.w = 72;
    this.txt_solomon.h = 16;

    this.txt_solomon.target_x = 44;
    this.txt_solomon.target_y = 32;

    this.txt_solomon.complete = false;

    this.txt_solomon.update = function(dt){
      if (this.y < this.target_y)this.y++;
      else {
        this.y = this.target_y;
        this.complete = true;
      }
    }

    this.txt_start = new GameObject(0,0);
    this.txt_start.sx = 80;
    this.txt_start.sy = 0;
    this.txt_start.sw = 48;
    this.txt_start.sh = 8;

    this.txt_start.x = 56;
    this.txt_start.y = 152;
    this.txt_start.w = 48;
    this.txt_start.h = 8;

    this.txt_start.target_x = 56;
    this.txt_start.target_y = 104;

    this.txt_start.complete = false;

    this.txt_start.update = function(dt){
      if (this.y > this.target_y)this.y--;
      else {
        this.y = this.target_y;
        this.complete = true;
      }
    }


    this.txt_hth = new GameObject(0,0);
    this.txt_hth.sx = 80;
    this.txt_hth.sy = 8;
    this.txt_hth.sw = 112;
    this.txt_hth.sh = 8;

    this.txt_hth.x = 132;
    this.txt_hth.y = 132;
    this.txt_hth.w = 112;
    this.txt_hth.h = 8;

    this.txt_hth.target_x = 24;
    this.txt_hth.target_y = 104;

    this.txt_hth.complete = false;

    this.txt_hth.update = function(dt){
      if (this.x > this.target_x)this.x-=2;
      else {
        this.x = this.target_x;
        this.complete = true;
      }
    }
  }

  self.update = function(dt){
    if (!this.txt_solomon.complete && !this.txt_start.complete && !this.txt_hth.complete){
      this.txt_solomon.update(dt);
      this.txt_start.update(dt);
      this.txt_hth.update(dt);
    }
    else {
      if (keys[90]){
        stateStack.pop();
        stateStack.push(PlayState());
      }
    }
  }

  self.render = function(){
    this.txt_solomon.draw();
    this.txt_start.draw();
    this.txt_hth.draw();
  }

  return self;
}

function GenderState(){
  let self = new State();

  self.onEnter = function(){
    stateStack.push(OptionLabelState(["boy", "girl"],[
      ()=>{
        ini.GN=1;
        stateStack.pop();
        stateStack.pop();
        stateStack.push(PlayState());
      },
      ()=>{
        ini.GN=0;
        stateStack.pop();
        stateStack.pop();
        stateStack.push(PlayState());
      }, 
    ],
    1, 11));
  }

  self.render = function(){
    ctx.drawImage(
      assets.imgs['main'],
      152,120,ini.SS*2,ini.SS*2,
      20*ini.SCALE,88*ini.SCALE, ini.SS*2*ini.SCALE,ini.SS*2*ini.SCALE
    );
    ctx.drawImage(
      assets.imgs['main'],
      200,120,ini.SS*2,ini.SS*2,
      112*ini.SCALE,88*ini.SCALE, ini.SS*2*ini.SCALE,ini.SS*2*ini.SCALE
    );
  }

  return self;
}

function PlayState(map="world"){
  let self = new State();

  self.current_map = map;

  let room = false;

  self.cam.focus = 'player';

  self.onEnter = function(){
    this.build_map(this.current_map);

    for (const o of assets.maps[this.current_map].gameobjects){
      if (o.id =="player"){
        stateStack.push(RoomState('haris_lab', o));
        break;
      }
    }
  }

  self.update = function(dt){
    this.timer += dt;

    for (const o of assets.maps[this.current_map].gameobjects){
      o.shouldUpdate && o.update(dt);

      if (this.cam.focus == o.id){
        this.cam.update(o);
      }
    }
    
  }
  self.render = function(){
    this.cam.set();
    //console.time('drawing');
    for (const o of assets.maps[this.current_map].gameobjects){
      if (o.shouldDraw){
        if (o.z_index == 0)
          o.draw();
      }
    }
    for (const o of assets.maps[this.current_map].gameobjects){
      if (o.shouldDraw){
        if (o.z_index == 1)
          o.draw();
      }
    }
    for (const o of assets.maps[this.current_map].gameobjects){
      if (o.shouldDraw){
        if (o.z_index == 2)
          o.draw();
      }
    }
    //console.timeEnd('drawing');
    this.cam.unset();
  }

  return self;
}

function RoomState(map="no_map", player_ptr=null){
  let self = new State();

  self.current_map = map;

  let player_prev_x = player_ptr ? player_ptr.x : null;
  let player_prev_y = player_ptr ? player_ptr.y : null;
  self.player = null;

  self.cam.focus = 'player';

  self.spoke_haris = false;

  self.onEnter = function(){
    this.build_map(this.current_map);

    /*for (const o of assets.maps[this.current_map].gameobjects){
      if (o.id == 'player')player_ptr.items.push('cookcie');
    }*/
  }

  self.update = function(dt){
    this.timer += dt;

    //if (this.timer >= 4)stateStack.pop();

    for (const o of assets.maps[this.current_map].gameobjects){
      if (o.shouldUpdate)o.update(dt);

      this.map_specific_update(o, dt);

      if (this.cam.focus == o.id){
        this.cam.update(o);
      }
    }
  }

  self.map_specific_update = function(o, dt){
    if (this.current_map == "haris_lab" && !this.spoke_haris){
      if (o.id == "player" && o.spoke_haris){
        this.spoke_haris = true;

        for (const o of assets.maps[this.current_map].gameobjects){
          if (
            o.tile_id == 874 || 
            o.tile_id == 875 || 
            o.tile_id == 842 || 
            o.tile_id == 843  
          ){
            o.shouldDraw = false;
          }
        }
      }
    }
  }

  self.render = function(){
    this.cam.set();
    //console.time('drawing');
    for (const o of assets.maps[this.current_map].gameobjects){
      if (o.shouldDraw){
        if (o.z_index == 0)
          o.draw();
      }
    }
    for (const o of assets.maps[this.current_map].gameobjects){
      if (o.shouldDraw){
        if (o.z_index == 1)
          o.draw();
      }
    }
    for (const o of assets.maps[this.current_map].gameobjects){
      if (o.shouldDraw){
        if (o.z_index == 2)
          o.draw();
      }
    }
    for (const o of assets.maps[this.current_map].gameobjects){
      if (o.shouldDraw){
        if (o.z_index >= 3)
          o.draw();
      }
    }
    //console.timeEnd('drawing');
    this.cam.unset();
  }

  return self;
}

function LabelState(text="no text", speed=0.1, x=1, y=15, cb=null, frame_type=0, f_w=18, f_h=2, snd=null){
  let self = new State();

  self.label = true;

  self.x = x;
  self.y = y;
  self.text = TextGenerator(text, x, y);
  self.speed = speed;
  self.current_index = 0;
  self.done = false;

  self.frame_type = frame_type;
  self.f_w = f_w > 0 ? f_w : 1;
  self.f_h = f_h > 0 ? f_h : 1;

  self.speed_change_timer = 0;

  self.onEnter = function(){
    if (snd){
      assets.snds[snd].play();
    }
  }
  self.onExit = function(){
    if (snd){
      assets.snds[snd].pause();
      assets.snds[snd].currentTime = 0;
    }
  }

  self.update = function(dt) {
    this.timer += dt;
    this.speed_change_timer += dt;

    if (this.timer >= this.speed && !this.done) {
      this.timer = 0;

      if (this.current_index < this.text.length){
        this.current_index++;
      }
      else {
        this.done = true;
      }
    }

    if (this.speed >= 0.05 && keys[90] && this.speed_change_timer >= 0.5)this.speed = 0.02;
    
    if (this.done && keys[90]) {
      assets.snds["snd_accept"].currentTime = 0;
      assets.snds["snd_accept"].play();
      if (cb)stateStack.push(cb());
      else stateStack.pop();
    }

  }

  self.render = function() {
    if (this.frame_type != null)self.draw_frame();
    this.draw_text();
  }

  self.draw_frame = function(){
    // TL
    ctx.drawImage(
      assets.imgs['main'],
      frame_type * 24, 216, 
      ini.SS,ini.SS,
      (this.x - 1) * 8 * ini.SCALE, (this.y - 1) * 8 * ini.SCALE, 
      ini.SS * ini.SCALE, ini.SS * ini.SCALE
    );
    // TT
    ctx.drawImage(
      assets.imgs['main'],
      frame_type * 24 + 8, 216, 
      ini.SS,ini.SS,
      this.x * 8 * ini.SCALE, (this.y - 1) * 8 * ini.SCALE, 
      ini.SS * this.f_w * ini.SCALE, ini.SS * ini.SCALE
    );
    // TR
    ctx.drawImage(
      assets.imgs['main'],
      frame_type * 24 + 16, 216, 
      ini.SS,ini.SS,
      ((this.x - 1) * 8 + (this.f_w + 1) * 8) * ini.SCALE, (this.y - 1) * 8 * ini.SCALE, 
      ini.SS * ini.SCALE, ini.SS * ini.SCALE
    );

    // ML
    ctx.drawImage(
      assets.imgs['main'],
      frame_type * 24, 216 + 8, 
      ini.SS,ini.SS,
      (this.x - 1) * 8 * ini.SCALE, (this.y) * 8 * ini.SCALE, 
      ini.SS * ini.SCALE, ini.SS * this.f_h * ini.SCALE
    );
    // MM
    ctx.drawImage(
      assets.imgs['main'],
      frame_type * 24 + 8, 216 + 8, 
      ini.SS,ini.SS,
      this.x * 8 * ini.SCALE, this.y * 8 * ini.SCALE, 
      ini.SS * this.f_w * ini.SCALE, ini.SS * this.f_h * ini.SCALE
    );
    // MR
    ctx.drawImage(
      assets.imgs['main'],
      frame_type * 24 + 16, 216 + 8, 
      ini.SS,ini.SS,
      (this.x + this.f_w) * 8 * ini.SCALE, (this.y) * 8 * ini.SCALE, 
      ini.SS * ini.SCALE, ini.SS * this.f_h * ini.SCALE
    );

    // BL
    ctx.drawImage(
      assets.imgs['main'],
      frame_type * 24, 216 + 16, 
      ini.SS,ini.SS,
      (this.x - 1) * 8 * ini.SCALE, (this.y + this.f_h) * 8 * ini.SCALE, 
      ini.SS * ini.SCALE, ini.SS * ini.SCALE
    );
    // BM
    ctx.drawImage(
      assets.imgs['main'],
      frame_type * 24 + 8, 216 + 16, 
      ini.SS,ini.SS,
      this.x * 8 * ini.SCALE, (this.y + this.f_h) * 8 * ini.SCALE, 
      ini.SS * this.f_w * ini.SCALE, ini.SS * ini.SCALE
    );
    // BR
    ctx.drawImage(
      assets.imgs['main'],
      frame_type * 24 + 16, 216 + 16, 
      ini.SS,ini.SS,
      (this.x + this.f_w)  * ini.SS * ini.SCALE, (this.y + this.f_h) * 8 * ini.SCALE, 
      ini.SS * ini.SCALE, ini.SS * ini.SCALE
    );
  }

  self.draw_text = function(){
    for (let i = 0; i < this.current_index; i++){
      let c = this.text[i];
      ctx.drawImage(
        assets.imgs['main'],
        c.sx,c.sy,c.sw,c.sh,
        c.x * ini.SCALE,c.y * ini.SCALE,c.w * ini.SCALE,c.h * ini.SCALE
      );
    }
  }

  return self;
}

/*function OptionLabelState(labels=[], callbacks=[],frame_type=0, c_width=6, ly=15, height=2, x_o=5,y_o=0){
  let self = LabelState();

  self.label = true;
  self.frame_type = frame_type;

  self.choice_actions = [];
  self.labels = [...labels];
  self.texts = [];

  self.c_width = c_width;
  self.ly = ly;
  self.height = height;
  self.x_o = x_o;
  self.y_o = y_o;

  self.current_selection = 0;
  self.c_ix = (x_o - 1) * ini.SS;
  self.c_iy = ly * ini.SS;
  self.c_x = (x_o - 1) * ini.SS;
  self.c_y = ly * ini.SS;

  self.input_delay = 0.2;

  self.onEnter = function(){
    for (let i = 0; i < labels.length; i++){
      this.choice_actions[labels[i]] = callbacks[i];
      this.texts[i] = TextGenerator(
        labels[i].toString(), 
        (i%this.height*this.c_width) + this.x_o, 
        this.ly + (i/this.height|0)
      );
    }
  }

  self.update = function(dt){
    this.timer += dt;

    if (this.timer >= this.input_delay){
      if (keys[37]){
        if (this.c_x - this.c_width * ini.SS >= this.c_ix)
          this.c_x -= this.c_width * ini.SS;
        this.timer = 0;
      }
      if (keys[38]){
        if (this.c_y + ini.SS >)
        this.timer = 0;
      }
      if (keys[39]){
        if (this.c_x + this.c_width * ini.SS <= this.c_ix + this.c_width * ini.SS)
          this.c_x += this.c_width * ini.SS;
        this.timer = 0;
      }
      if (keys[40]){
        this.timer = 0;
      }

    }
    
  }

  self.render = function(){
    if (this.frame_type != null)self.draw_frame();
    this.draw_text();
    this.draw_caret();
  }

  self.draw_text = function(){
    for (let i = 0; i < this.texts.length; i++){
      for (let j = 0; j < this.texts[i].length; j++){
        let c = this.texts[i][j];

        ctx.drawImage(
          assets.imgs['main'],
          c.sx,c.sy, ini.SS, ini.SS,
          c.x * ini.SCALE,c.y * ini.SCALE, ini.SS * ini.SCALE, ini.SS * ini.SCALE,
        )
      }
    }
  }

  self.draw_caret = function(){
    ctx.drawImage(
      assets.imgs['main'],
      216, 240, ini.SS, ini.SS,
      this.c_x * ini.SCALE, this.c_y * ini.SCALE, ini.SS * ini.SCALE, ini.SS * ini.SCALE
    )
  }

  return self;
}*/

function OptionLabelState(labels=[], cbs=[], height=1, width=6, x=1, y=15){
  let self = new State();

  let frame = LabelState("null",null,x,y,null,0,18,2);

  self.labels = [];
  self.cbs=[...cbs];

  self.label = true;

  self.height = height;
  self.width = width;
  self.x = x;
  self.y = y;

  self.cursor = new GameObject(x*ini.SS, y*ini.SS);
  self.cursor.sx = 216;
  self.cursor.sy = 240;
  self.cooldown = 0.3;
  self.cursor_limx = width/height-1>>0;

  self.onEnter = function(){
    if (labels.length > 0){
      for (let i = 0; i < labels.length; i++){
        this.labels.push(TextGenerator(labels[i].toString(), (((i/this.height)|0)*this.width) + x+1, /*(i%this.height | 0) +*/ y));
      }
    }
  }

  self.update = function(dt){
    this.timer += dt;

    let index = (this.cursor.x-8%48) / 48 | 0;

    if (this.timer >= this.cooldown){
      if (keys[39]){
        this.timer = 0;
        this.cursor.x+=this.width*ini.SS;

        if (this.cursor.x > this.width*ini.SS * this.height + ini.SS)
          this.cursor.x = this.width*ini.SS * this.height + ini.SS;
        else {
          assets.snds["snd_accept"].currentTime = 0;
          assets.snds["snd_accept"].play();
        }
      }
      else if (keys[37]){
        this.timer = 0;
        this.cursor.x-=this.width*ini.SS;

        if (this.cursor.x < this.x*ini.SS)
          this.cursor.x = this.x*ini.SS;
        else {
          assets.snds["snd_accept"].currentTime = 0;
          assets.snds["snd_accept"].play();
        }

      }

      if (keys[90]){
        assets.snds["snd_accept"].currentTime = 0;
        assets.snds["snd_accept"].play();
        this.cbs[index]();
      }
    }
  }

  self.render = function(){
    frame.draw_frame();
    this.draw_text();
    this.cursor.draw();
  }

  self.draw_text = function(){
    for (let i = 0; i < this.labels.length; i++){
      for (let j = 0; j < this.labels[i].length; j++){
        let l = this.labels[i][j];

        ctx.drawImage(
          assets.imgs['main'], 
          l.sx, l.sy, l.sw, l.sh,
          l.x * ini.SCALE, l.y * ini.SCALE, l.w * ini.SCALE, l.h * ini.SCALE
        );

      }
    }
  }

  return self;
}

function BattleOptionState(){
  let self = LabelState();

  self.label = true;

  self.options = ["fight", "pkmn", "items", "run"];
  self.texts = [];

  self.functions = [
    ()=>{ll("F")},
    ()=>{ll("P")},
    ()=>{ll("I")},
    ()=>{ll("R")},
  ];

  self.o_x = 5;

  self.input_delay = 0.2;

  self.current_choice = 0;
  self.c_ix = 4 * ini.SS;
  self.c_iy = 15 * ini.SS;
  self.c_x = 4 * ini.SS;
  self.c_y = 15 * ini.SS;
  self.c_row = 0;
  self.c_col = 0;

  self.onEnter = function(){
    for (let i = 0; i < this.options.length; i++){
      this.texts[i] = TextGenerator(
        this.options[i].toString(),
        (i%2 * 6)  + this.o_x,
        15 + (i/2 | 0)
      );
    }
  }

  self.update = function(dt){
    this.timer += dt;

    if (this.timer >= this.input_delay){
      if (keys[37]){
        if (this.c_x > this.c_ix){
          this.c_col = 0;
          this.c_x -= (8*6);
        }
        this.timer = 0;
      }
      else if (keys[39]){
        if (this.c_x <= this.c_ix){
          this.c_col = 1;
          this.c_x += (8*6);
        }
        this.timer = 0;
      }

      if (keys[38]){
        this.timer = 0;

        if (this.c_y == this.c_iy + 8){
          this.c_row = 0;
          this.c_y -= 8;
        }
      }
      else if (keys[40]){
        this.timer = 0;

        if (this.c_y == this.c_iy){
          this.c_row = 1;
          this.c_y += 8;
        }
      }

      if (keys[90]){
        this.timer = 0;
        
        let index = 0;

        // Fight
        if (this.c_col == 0 && this.c_row == 0){
          this.functions[0]();
        }
        //PKMN
        else if (this.c_col == 1 && this.c_row == 0){
          this.functions[1]();
        }
        // Items
        else if (this.c_col == 0 && this.c_row == 1) {
          this.functions[2]();
        }
        // Run
        else if (this.c_col == 1 && this.c_row == 1) {
          this.functions[3]();
          stateStack.push(LabelState("got away safely!_", 0.1, 1, 15, ()=>{
            stateStack.pop();
            stateStack.pop();
            stateStack.pop();
          }));
        }
      }
    }

    //span.innerText = `${this.c_row} : ${this.c_col}`;
    
  }

  self.render = function(){
    this.draw_frame();
    this.draw_text();
    this.draw_caret();
  }

  self.draw_text = function(){
    for (let i = 0; i < this.texts.length; i++){
      for (let j = 0; j < this.texts[i].length; j++){
        let c = this.texts[i][j];
        ctx.drawImage(
          assets.imgs['main'],
          c.sx, c.sy, ini.SS, ini.SS,
          c.x * ini.SCALE, c.y * ini.SCALE, ini.SS * ini.SCALE, ini.SS * ini.SCALE
        );
      }
    }
  }

  self.draw_caret = function(){
    ctx.drawImage(
      assets.imgs['main'],
      216, 240, ini.SS, ini.SS,
      this.c_x * ini.SCALE, this.c_y * ini.SCALE, ini.SS * ini.SCALE, ini.SS * ini.SCALE
    );
  }

  return self;
}

function BattleState(attacker="no one", music=null){
  let self = new State();

  self.sprite_pan_isDone = false;
  self.attack_label_isDone = false;
  self.attacker = attacker;
  self.currently = 'nothing';

  self.onEnter = function(){
    let sprite = new GameObject(8*20,0);
    sprite.sx = 40;
    sprite.sy = 16;
    sprite.sw = 16;
    sprite.sh = 16;

    sprite.w = 16;
    sprite.h = 16;

    sprite.target_x = 8*10;
    sprite.done = false;

    sprite.update = function(dt){
      if (this.x >= this.target_x && !this.done){
        this.x--;
      }
      else {
        this.x = this.target_x;
        this.done = true;
        self.sprite_pan_isDone = true;
      }
    }

    this.gameobjects.push(sprite);

    sprite = null;

    sprite = new GameObject(0,8*10)
    sprite.sx = 56;
    sprite.sy = 16;
    sprite.sw = 16;
    sprite.sh = 16;

    sprite.w = 16;
    sprite.h = 16;

    sprite.target_x = 8*10;
    sprite.done = false;

    sprite.update = function(dt){
      if (this.x <= this.target_x && !this.done){
        this.x++;
      }
      else {
        this.x = this.target_x;
        this.done = true;
      }
    }

    this.gameobjects.push(sprite);
  }

  self.update = function(dt){
    if (this.sprite_pan_isDone && !this.attack_label_isDone){
      stateStack.push(LabelState(`${this.attacker}#attacks!_`, 0.05, 1, 15, () => {
        this.currently = 'action';
        keys[90] = false;
        stateStack.pop();
      }));
      this.attack_label_isDone = true;
      
    }

    if (this.attack_label_isDone && this.currently == 'action'){
      this.currently = 'choosing';
      /*stateStack.push(OptionLabelState(
        ["fight", "pkmn", "item", "run"],
        [
          ()=>{ll('F')},
          ()=>{ll('P')},
          ()=>{ll('I')},
          ()=>{ll('R')}
        ]
      
        ));*/
      stateStack.push(BattleOptionState());
    }

    for (const o of this.gameobjects){
      o.update(dt);
    }
  }

  self.render = function(){
    for (const o of this.gameobjects){
      o.draw();
    }
  }

  return self;
}










function AnimationHandler(frame_set, delay=0.5){
  this.timer = 0;
  this.delay = delay;
  this.frame = frame_set[0];
  this.frame_index = 0;
  this.frame_set = frame_set;

  this.change = function(frame_set, delay = 0.5) {
    if (this.frame_set != frame_set){
      this.timer = 0;
      this.delay = delay;
      this.frame_index = 0;
      this.frame_set = frame_set;
      this.frame = this.frame_set[this.frame_index];
    }
  }

  this.update = function(dt) {
    this.timer += dt;

    if (this.timer >= this.delay) {
      this.timer = 0;

      this.frame_index = (this.frame_index == this.frame_set.length-1) ? 0 : this.frame_index + 1;
      this.frame = this.frame_set[this.frame_index];
    }
  }
}

function TextGenerator(text='no text', x=1, y=15){
  let txt_array = [];

  let letter = {
    x: 0,
    y: 0,
    w: ini.SS,
    h: ini.SS,

    sx: 0,
    sy: 240,
    sw: ini.SS,
    sh: ini.SS,

    char: '',

    start_x: x * ini.SS,
    start_y: y * ini.SS
  };

  let i = x;
  let j = y;

  for (const c of text.toUpperCase()){
    let l_o = null;

    // ABC
    if (c.charCodeAt(0) >= 65 && c.charCodeAt(0) <= 90){
      l_o = Object.create(letter);
      l_o.x = i++ * 8;
      l_o.y = j * 8;
      l_o.sx = (c.charCodeAt(0) % 65) * ini.SS;
      l_o.sy = 248;
      l_o.char = c;
    }
    // 123
    else if (c.charCodeAt(0) >= 48 && c.charCodeAt(0) <= 57){
      l_o = Object.create(letter);
      l_o.x = i++ * 8;
      l_o.y = j * 8;
      l_o.sx = (c.charCodeAt(0) % 48) * ini.SS;
      l_o.sy = 240;
    }
    else {
      switch(c){
        // Exclamation or w/e
        case '!': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 80;
          l_o.char = c;
        break;
        case '(': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 88;
          l_o.char = c;
        break;
        case ')': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 96;
          l_o.char = c;
        break;
        case '-': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 104;
          l_o.char = c;
        break;
        case '+': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 112;
          l_o.char = c;
        break;
        case '=': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 120;
          l_o.char = c;
        break;
        case '[': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 128;
          l_o.char = c;
        break;
        case ']': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 136;
          l_o.char = c;
        break;
        case ':': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 144;
          l_o.char = c;
        break;
        case ';': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 152;
          l_o.char = c;
        break;
        case '\"': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 160;
          l_o.char = c;
        break;
        case '\'': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 168;
          l_o.char = c;
        break;
        case ',': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 176;
          l_o.char = c;
        break;
        case '.': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 184;
          l_o.char = c;
        break;
        case '?': 
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 192;
          l_o.char = c;
        break;

        // Space and newline
        case ' ': 
          /*l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 200;
          l_o.char = c;*/
          i++;
        break;

        case '#':
          i = x;
          j++;
          break;

        // Arrows
        case '<':
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 200;
          l_o.char = c;
          break;
        case '^':
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 208;
          l_o.char = c;
          break;
        case '>':
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 216;
          l_o.char = c;
          break;
        case '_':
          l_o = Object.create(letter);
          l_o.x = i++ * 8;
          l_o.y = j * 8;
          l_o.sx = 224;
          l_o.char = c;
          break;
      }
    }

    if (l_o) txt_array.push(l_o);
  }

  return [...txt_array];
}

function setTile(map="no_map", x=0, y=0, layer=0, type=0){
  let data = assets.maps[map].layers[layer].data;
  let width = assets.maps[map].width;
  let ss_cols = assets.maps[map].tilesets[0].imagewidth / assets.maps[map].tilewidth;

  let _x = x / ini.SS | 0;
  let _y = y / ini.SS | 0;

  data[_x + _y * width] = type+1;

  let sprite = checkTileType(type, x, y, map);
  const prepare_sprite = () => {
    sprite.sx = ((sprite.tile_id % ss_cols) | 0) * ini.SS;
    sprite.sy = ((sprite.tile_id / ss_cols) | 0) * ini.SS;
  };

  if (sprite){
    for (let i = 0; i < assets.maps[map].gameobjects.length; i++){
      let o = assets.maps[map].gameobjects[i];

      if (o.x == x && o.y == y){
        prepare_sprite();
        assets.maps[map].gameobjects[i] = null;
        assets.maps[map].gameobjects[i] = sprite;
        break;
      }
    }
  }

}
function getTile(map="no_map", x=0, y=0, layer=0){
  let data = assets.maps[map].layers[layer].data;
  let width = assets.maps[map].width;
  let _x = x / ini.SS | 0;
  let _y = y / ini.SS | 0;

  return data[_x + _y * width];
}

function checkTileType(type=0, xx, yy, zz, map=null){
  let tile = null;

  switch(type){
    case 0: break;

    // Invisible
    case 16:
      tile = new GameObject(xx, yy, zz);
      tile.shouldDraw = false;
      break;

    // Water
    case 76:
    case 79:
    case 82:
    case 108:
    case 111:
    case 114:
    case 140:
    case 143:
    case 146:
    case 172:
      tile = Water(xx,yy,zz, type);
      tile.shouldUpdate = true;
      break;

    case 499:
      tile = Player(xx, yy, zz);
      tile.current_map = map;
      tile.shouldUpdate = true;
      break;

    default:
      tile = new GameObject(xx, yy, zz);
      break;
  }

  if (tile)tile.tile_id = type;

  return tile;
}











function GameObject(x, y, z=0){
  this.id = 'object';

  this.tile_id = 0;

  this.x = x;
  this.y = y;
  this.w = ini.SS;
  this.h = ini.SS;

  this.sx = 0;
  this.sy = 0;
  this.sw = ini.SS;
  this.sh = ini.SS;

  this.animation = null;
  this.facing = 'dn';
  this.action = 'idle';

  this.target_x = x;
  this.target_y = y;
  this.speed = 2;
  this.tile_movement = ini.SS;
  this.is_moving = false;

  this.shouldUpdate = false;
  this.shouldDraw = true;

  this.current_map = null;

  this.z_index = z;

  this.init = function(){}
  this.update = function(dt){}
  this.draw = function(){
    if (!this.animation)
      ctx.drawImage(
        assets.imgs['main'],
        this.sx, this.sy, this.sw, this.sh,
        this.x*ini.SCALE, this.y*ini.SCALE, this.w*ini.SCALE, this.h*ini.SCALE
      );
    else 
      ctx.drawImage(
        assets.imgs['main'],
        (this.animation.frame % 32 | 0) * ini.SS, 
        (this.animation.frame / 32 | 0) * ini.SS, 
        this.sw, this.sh,
        this.x*ini.SCALE, this.y*ini.SCALE, this.w*ini.SCALE, this.h*ini.SCALE
      );
  }
}

function Player(x, y, z){
  let self = new GameObject(x, y, 1);

  self.id = "player";

  self.sx = ini.GN==0?200:152;
  self.sw = ini.SS * 2;
  self.sh = ini.SS * 2;
  self.w = ini.SS * 2;
  self.h = ini.SS * 2;

  self.items = ['ball'];
  self.monsters = [];

  //self.tile_movement *= 2;
  self.speed = 1;

  self.animation = new AnimationHandler([499], 0.3);

  if (ini.GN == 0){
    self.animations = {
      idle: {
        dn: [505],
        rt: [569],
        lt: [633],
        up: [697]
      },
      run: {
        dn: [507, 505, 509, 505],
        rt: [571, 569, 573, 569],
        lt: [635, 633, 637, 633],
        up: [699, 697, 701, 697]
      }
    };
  }
  else {
    self.animations = {
      idle: {
        dn: [499],
        rt: [563],
        lt: [627],
        up: [691]
      },
      run: {
        dn: [501, 499, 503, 499],
        rt: [565, 563, 567, 563],
        lt: [629, 627, 631, 627],
        up: [693, 691, 695, 691]
      }
    };
  }

  self.spoke_haris = false;


  self.grass_timer = 0;
  self.grass_timer_max = 1;

  self.room_timer = 0;
  self.room_timer_max = 1;

  self.select_timer = 0;
  self.select_timer_max = 1;

  self.teleport = false;
  

  self.handle_input = function(dt){
    this.select_timer += dt;

    if (keys[37] && !this.is_moving){
      this.target_x -= this.tile_movement;
      this.is_moving = true;

      this.facing = 'lt';
      this.action = "run";
    }
    else if (keys[39] && !this.is_moving){
      this.target_x += this.tile_movement;
      this.is_moving = true;

      this.facing = 'rt';
      this.action = "run";
    }

    if (keys[38] && !this.is_moving){
      this.target_y -= this.tile_movement;
      this.is_moving = true;

      this.facing = 'up';
      this.action = "run";
    }
    else if (keys[40] && !this.is_moving){
      this.target_y += this.tile_movement;
      this.is_moving = true;

      this.facing = 'dn';
      this.action = "run";
    }

    /*if (keys[90]){
      setTile(this.current_map, this.x,this.y+16,0,65)
    }*/

    if (keys[90] && this.select_timer >= this.select_timer_max){
      let tx = this.target_x;
      let ty = this.target_y;

      switch(this.facing){
        case 'up': break;
        case 'dn': 
          ty += ini.SS*2;
          break;
        case 'lt':
          tx-=ini.SS;
          ty+=ini.SS;
          break;
        case 'rt':
          tx+=ini.SS*2;
          ty+=ini.SS;
          break;
      }

      let selected_0 = getTile(this.current_map, tx, ty, 0)-1
      let selected_1 = getTile(this.current_map, tx, ty, 1)-1

      // NPCs
      if (
          selected_1 == 787 || selected_1 == 788 || // Haris
          selected_1 == 809 || selected_1 == 810 || // Ghost
          selected_1 == 811 || selected_1 == 812 || // Bandit
          selected_1 == 813 || selected_1 == 814 || // Girl
          selected_1 == 817 || selected_1 == 818 || // Baldy      
          selected_1 == 874 || selected_1 == 875 || // Science Guy
          selected_1 == 876 || selected_1 == 877    // Saanton
        ){
        
        // Spoke haris
        if (this.current_map == "haris_lab" && selected_1 == 787 || selected_1 == 788){
          this.spoke_haris = true;
          for (let layer = 0; layer < assets.maps['haris_lab'].layers.length; layer++){
            for (let i = 0; i < assets.maps['haris_lab'].layers[layer].data.length; i++){
              if (
                  assets.maps['haris_lab'].layers[layer].data[i]-1 == 874 ||
                  assets.maps['haris_lab'].layers[layer].data[i]-1 == 875
                ){
                  assets.maps['haris_lab'].layers[layer].data[i] = 23;
                }
            }
          }
        }
        this.select_timer = 0;
        for (let i = assets.diag['npc'][selected_1].length-1; i >= 0; i--){
          let text = assets.diag['npc'][selected_1][i];
          let frame = ini.GN;

          if (selected_1 == 787 || selected_1 == 788)frame = 2;
          
          stateStack.push(LabelState(text, 0.05, 1, 15, ()=>{
            stateStack.pop();
          }, frame))
        }
      }
      // Monster NPC
      else if (
        selected_1 == 783 || selected_1 == 784 || // Slime Lucha
        selected_1 == 815 || selected_1 == 816 || // Spook Dog
        selected_1 == 841                         // Blue ghost
      ){
        
        this.select_timer = 0;
        stateStack.push(LabelState(assets.diag['npc'][selected_1].diag, 0.07, 1, 15, ()=>{
          stateStack.pop();
        }, ini.GN, 18, 2, assets.diag['npc'][selected_1].snd));
      }

      // Signs
      else if (
        selected_0 == 265 || selected_0 == 266 || 
        selected_1 == 265 || selected_1 == 266 || 
        selected_0 == 267 || selected_0 == 268 || 
        selected_1 == 267 || selected_1 == 268  
      ){
        this.select_timer = 0;
        stateStack.push(LabelState("signs.json not#found xd_", 0.02,1,15,()=>{
          stateStack.pop();
        }));
      }
    }

    
  }
  self.handle_movement = function(dt){
    // Check collision
    

    // Check step tile
    // MOVE TO METHOD or SWITCH
    this.grass_timer += dt;
    this.room_timer += dt;

    if (getTile(this.current_map, this.x, this.y+ini.SS, 0)-1 == 161){
      if (Math.random() > 0.2 && this.grass_timer >= this.grass_timer_max){
        this.grass_timer = 0;
        stateStack.push(BattleState("Monster"));
      }
    }

    // Next town door
    if (!this.teleport && getTile(this.current_map, this.x, this.y+ini.SS, 0)-1 == 748){
      this.target_y -= ini.SS * 8;
      this.target_x= this.x;
      this.is_moving = true;
      this.teleport = true;

      //span.innerText = this.y + " " + this.target_y;
    }

    // Check city doors
    if (this.current_map == "world"){
      // Brown
      if (getTile(this.current_map, this.x, this.y+ini.SS, 0)-1 == 738 && this.room_timer >= this.room_timer_max){
        this.room_timer = 0;
        this.facing="dn";
        stateStack.push(RoomState('room_brown', this));
      }
      // Red
      else if (getTile(this.current_map, this.x, this.y+ini.SS, 0)-1 == 742 && this.room_timer >= this.room_timer_max){
        this.room_timer = 0;
        this.facing="dn";
        stateStack.push(RoomState('room_red', this));
      }
      // Gray
      else if (getTile(this.current_map, this.x, this.y+ini.SS, 0)-1 == 736 && this.room_timer >= this.room_timer_max){
        this.room_timer = 0;
        this.facing="dn";
        stateStack.push(RoomState('room_gray', this));
      }
    }

    else /*if (this.current_map == "room_brown")*/{
      if (getTile(this.current_map, this.x, this.y+ini.SS, 0)-1 == 752){
        stateStack.pop();
      }
    }

    // Handle movement
    if (this.target_x < this.x)this.x-=this.speed;
    if (this.target_x > this.x)this.x+=this.speed;
    if (this.target_y > this.y)this.y+=this.speed;
    if (this.target_y < this.y)this.y-=this.speed;
    if (this.target_x == this.x && this.target_y == this.y)this.is_moving = false;

    if (!keys[37]&&!keys[38]&&!keys[39]&&!keys[40]&&!this.moving)
      this.action = "idle";

    this.animation.change(this.animations[this.action][this.facing], 0.15);
  }
  self.check_col = function(){
    if (this.z_index < 2){
      if (
          solids[getTile(this.current_map, this.target_x, this.target_y+8, 0)-1] || 
          solids[getTile(this.current_map, this.target_x+8, this.target_y+8, 0)-1]
        ){
        this.target_x = this.x;
        this.target_y = this.y;
      }
      if (
        solids[getTile(this.current_map, this.target_x, this.target_y+8, 1)-1] || 
        solids[getTile(this.current_map, this.target_x+8, this.target_y+8, 1)-1]
      ){
        this.target_x = this.x;
        this.target_y = this.y;
      }

      // Check Mats
      if (
        getTile(this.current_map, this.target_x+8, this.target_y+8, 0)-1 == 720 || 
        getTile(this.current_map, this.target_x+8, this.target_y+8, 0)-1 == 721
      ) {
        if (this.current_map == 'haris_lab'){
          assets.snds['music_world_chill'].volume = 0.8;
          assets.snds['music_world_chill'].loop = true;
          assets.snds['music_world_chill'].play();
        }
        stateStack.pop();
      }
    }
  }

  self.update = function(dt){
    this.handle_input(dt);
    this.check_col();
    this.handle_movement(dt);

    this.animation.update(dt);
  }

  return self;
}

function Door(x, y){
  let self = new GameObject(x, y);

  self.id = 'door';

  return self;
}

function Water(x, y, z=0, t_id){
  let self = new GameObject(x,y,z);

  ll(t_id)

  self.animation = new AnimationHandler([t_id,t_id+1,t_id+2], 0.3);

  self.update = function(dt){

    this.animation.update(dt);
  }

  return self;
}







const init = () => {
  ctx.imageSmoothingEnabled = false;
  window.onkeydown = keyHandler;
  window.onkeyup = keyHandler;
  init_btns();
  //span = document.querySelector('span');

  stateStack = new StateHandler();

  //stateStack.push(PlayState());
  // stateStack.push(StartScreenState());
  //stateStack.push(OptionLabelState(["Coon", "head"],[()=>ll(99), ()=>ll(67)]));

  stateStack.push(GenderState());

  ctx.font = "20px sans-serif";

  update(performance.now());
};

let now = -1;
let last = -1;
const update = ts => {
  now = ts;
  requestAnimationFrame(update);

  let dt = (now - last) / 1000;

  stateStack.update(dt);

  render();

  last = now;
};

const render = () => {
  ctx.clearRect(0,0,cnv.width,cnv.height);

  stateStack.render();

  //draw_grid();
};














window.onload = () => {
  cnv = document.querySelector('canvas');
  cnv.width = ini.WIDTH * ini.SCALE;
  cnv.height = ini.HEIGHT * ini.SCALE;
  ctx = cnv.getContext('2d');

  loadAssets();
};

const draw_grid = () => {
  for (let i = 0; i < ini.HEIGHT / ini.SS; i++){
    for (let j = 0; j < ini.WIDTH / ini.SS; j++) {
      ctx.strokeRect(j * ini.SS*ini.SCALE,i * ini.SS*ini.SCALE,ini.SS*ini.SCALE,ini.SS*ini.SCALE);
      
    }
  }
}

const loadAssets = () => {
  // Images
  assets.imgs['main'] = new Image();
  assets.imgs['main'].onerror = () => {
    ll(`sheet.png failed to load`);
  };
  assets.imgs['main'].onload = () => {
    loadHandler('sheet.png');
  };
  assets.imgs['main'].src = "sheet_refined.png";


  // Maps
  fetch('./test_refined.json')
    .then(res=>res.json())
    .then(data=>{
      assets.maps['world'] = {...data};
      loadHandler('test.json');
    })
    .catch(err=>ll(err));
  /*fetch('./test_room_1.json')
    .then(res=>res.json())
    .then(data=>{
      assets.maps['test_room_1'] = {...data};
      loadHandler('test_room_1.json');
    })
    .catch(err=>ll(err));
  fetch('./test_lab.json')
    .then(res=>res.json())
    .then(data=>{
      assets.maps['test_lab'] = {...data};
      loadHandler('test_lab.json');
    })
    .catch(err=>ll(err));*/

  fetch('./haris_lab.json')
    .then(res=>res.json())
    .then(data=>{
      assets.maps['haris_lab'] = { ...data };
      loadHandler('haris_lab.json');
    })
    .catch(err=>ll(err));

  fetch('./world.json')
    .then(res=>res.json())
    .then(data=>{
      assets.maps['world'] = { ...data };
      loadHandler('world.json');
    })
    .catch(err=>ll(err));

    // Rooms
    fetch('./room_brown.json')
      .then(res=>res.json())
      .then(data=>{
        assets.maps['room_brown'] = { ...data };
        loadHandler('room_brown.json');
      })
      .catch(err=>ll(err));
    fetch('./room_gray.json')
      .then(res=>res.json())
      .then(data=>{
        assets.maps['room_gray'] = { ...data };
        loadHandler('room_gray.json');
      })
      .catch(err=>ll(err));
    fetch('./room_red.json')
      .then(res=>res.json())
      .then(data=>{
        assets.maps['room_red'] = { ...data };
        loadHandler('room_red.json');
      })
      .catch(err=>ll(err));


    // Dialogue
    fetch('./diag_npc.json')
      .then(res=>res.json())
      .then(data=>{
        assets.diag['npc'] = { ...data };
        loadHandler("diag_npc.json");
      })
      .catch(err=>ll(err));

    // Audio
    assets.snds['snd_dog'] = new Audio();
    assets.snds['snd_dog'].onloadstart = function(){
      loadHandler("snd_dog.wav");
    };
    assets.snds['snd_dog'].onerror = function(){
      ll("Failed to load snd_dog");
    }
    assets.snds['snd_dog'].src="snd_dog.wav";
    assets.snds['music_world_chill'] = new Audio();
    assets.snds['music_world_chill'].onloadstart = function(){
      loadHandler("music_world_chill.mp3");
    };
    assets.snds['music_world_chill'].onerror = function(){
      ll("Failed to load music_world_chill");
    }
    assets.snds['music_world_chill'].src="music_world_chill.mp3";
    assets.snds['snd_slime'] = new Audio();
    assets.snds['snd_slime'].onloadstart = function(){
      loadHandler("snd_slime.wav");
    };
    assets.snds['snd_slime'].onerror = function(){
      ll("Failed to load snd_slime");
    }
    assets.snds['snd_slime'].src="snd_slime.wav";
    assets.snds['snd_lucha'] = new Audio();
    assets.snds['snd_lucha'].onloadstart = function(){
      loadHandler("snd_lucha.wav");
    };
    assets.snds['snd_lucha'].onerror = function(){
      ll("Failed to load snd_lucha");
    }
    assets.snds['snd_lucha'].src="snd_lucha.wav";
    assets.snds['snd_black'] = new Audio();
    assets.snds['snd_black'].onloadstart = function(){
      loadHandler("snd_black.wav");
    };
    assets.snds['snd_black'].onerror = function(){
      ll("Failed to load snd_black");
    }
    assets.snds['snd_black'].src="snd_black.wav";
    assets.snds['snd_random'] = new Audio();
    assets.snds['snd_random'].onloadstart = function(){
      loadHandler("snd_random.wav");
    };
    assets.snds['snd_random'].onerror = function(){
      ll("Failed to load snd_random");
    }
    assets.snds['snd_random'].src="snd_random.wav";
    assets.snds['snd_talk'] = new Audio();
    assets.snds['snd_talk'].onloadstart = function(){
      loadHandler("snd_talk.wav");
    };

    assets.snds['snd_accept'] = new Audio();
    assets.snds['snd_accept'].onloadstart = function(){
      loadHandler("snd_accept.wav");
    };
    assets.snds['snd_accept'].onerror = function(){
      ll("Failed to load snd_accept");
    }
    assets.snds['snd_accept'].src="snd_accept.wav";
};

const loadHandler = file => 
  ++assets.loaded >= assets.toLoad && init();

const init_btns = () => {
  document.getElementById("mute").onclick = function() {
    ini.MUTED = !ini.MUTED;

    this.src= ini.MUTED ? "https://raw.githubusercontent.com/SL-HTH/SGT-Bear/master/sound_off.png" : "https://raw.githubusercontent.com/SL-HTH/SGT-Bear/master/sound_on.png";

    if (ini.MUTED){
      assets.snds['music_world_chill'].volume = 0;
    }
    else {
      assets.snds['music_world_chill'].volume = 0.8;
    }
  };

  document.getElementById("zoom-in").onclick = () => {
    ini.SCALE = (ini.SCALE < 5) ? ini.SCALE + 1 : 5;
    cnv.width = ini.WIDTH * ini.SCALE;
    cnv.height = ini.HEIGHT * ini.SCALE;
    ctx.imageSmoothingEnabled = false;
  }
  document.getElementById("zoom-out").onclick = () => {
    ini.SCALE = (ini.SCALE > 1) ? ini.SCALE - 1 : 1;
    cnv.width = ini.WIDTH * ini.SCALE;
    cnv.height = ini.HEIGHT * ini.SCALE;
    ctx.imageSmoothingEnabled = false;
  }

  document.getElementById("btn-lt").ontouchstart = () => {
    keys[37]= true;
  }
  document.getElementById("btn-lt").ontouchmove = () => {
    keys[37]= true;
  }
  document.getElementById("btn-lt").ontouchend = () => {
    keys[37] = false;
  }

  document.getElementById("btn-up").ontouchstart = () => {
    keys[38]= true;
  }
  document.getElementById("btn-up").ontouchmove = () => {
    keys[38]= true;
  }
  document.getElementById("btn-up").ontouchend = () => {
    keys[38] = false;
  }

  document.getElementById("btn-rt").ontouchstart = () => {
    keys[39]= true;
  }
  document.getElementById("btn-rt").ontouchmove = () => {
    keys[39]= true;
  }
  document.getElementById("btn-rt").ontouchend = () => {
    keys[39] = false;
  }

  document.getElementById("btn-dn").ontouchstart = () => {
    keys[40]= true;
  }
  document.getElementById("btn-dn").ontouchmove = () => {
    keys[40]= true;
  }
  document.getElementById("btn-dn").ontouchend = () => {
    keys[40] = false;
  }

  document.getElementById("btn-a").ontouchstart = () => {
    keys[90]= true;
  }
  document.getElementById("btn-a").ontouchmove = () => {
    keys[90]= true;
  }
  document.getElementById("btn-a").ontouchend = () => {
    keys[90] = false;
  }

  document.getElementById("btn-b").ontouchstart = () => {
    keys[88]= true;
  }
  document.getElementById("btn-b").ontouchmove = () => {
    keys[88]= true;
  }
  document.getElementById("btn-b").ontouchend = () => {
    keys[88] = false;
  }
}

window.oncontextmenu = () => false;
