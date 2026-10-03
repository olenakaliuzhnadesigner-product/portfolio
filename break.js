/* Take a break: balloons that pop under the cursor or a finger.
   Vanilla port of the BalloonBackground React component. */
(function(){
  var canvas=document.getElementById('balloons');
  if(!canvas)return;
  var ctx=canvas.getContext('2d');
  if(!ctx)return;
  var counter=document.getElementById('popped'),popped=0;

  var W=0,H=0,balloons=[],particles=[];
  var mouse={x:-2000,y:-2000};
  var COUNT=innerWidth<640?16:30;
  var colors=[
    {base:'#ff2e63',light:'#ff6b8f',dark:'#9d0b2e'},
    {base:'#00d2ff',light:'#80eaff',dark:'#006a80'},
    {base:'#ffd700',light:'#fff080',dark:'#998100'},
    {base:'#9d50bb',light:'#c089d8',dark:'#4f285e'},
    {base:'#43e97b',light:'#a6f7c1',dark:'#1e6a38'},
    {base:'#ff9a9e',light:'#fecfef',dark:'#cc7a7e'},
    {base:'#00c9ff',light:'#92fe9d',dark:'#00607a'}
  ];
  var stringColor='rgba(255,255,255,.25)';
  function readTheme(){
    var dark=getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
    // light paper → dark strings, dark paper → light strings
    var c=dark.replace('#','');var lum=c.length>=6?(parseInt(c.slice(0,2),16)*.3+parseInt(c.slice(2,4),16)*.59+parseInt(c.slice(4,6),16)*.11):0;
    stringColor=lum>128?'rgba(0,0,0,.22)':'rgba(255,255,255,.25)';
  }
  readTheme();
  new MutationObserver(readTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',readTheme);

  function Particle(x,y,color){
    this.x=x;this.y=y;this.color=color;this.size=Math.random()*3+1;
    this.vx=(Math.random()-.5)*12;this.vy=(Math.random()-.5)*12;this.o=1;
  }
  Particle.prototype.update=function(){this.x+=this.vx;this.y+=this.vy;this.vy+=.2;this.o-=.025;};
  Particle.prototype.draw=function(){
    ctx.globalAlpha=Math.max(0,this.o);ctx.fillStyle=this.color;
    ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  };

  function Balloon(first){this.init(first);}
  Balloon.prototype.init=function(first){
    this.r=Math.random()*15+30;
    this.x=Math.random()*W;
    this.y=first?Math.random()*H:H+this.r+200;
    this.c=colors[Math.floor(Math.random()*colors.length)];
    this.speed=Math.random()+.4;
    this.wob=Math.random()*.02+.01;
    this.angle=Math.random()*Math.PI*2;
    this.popped=false;
    this.prevX=this.x;
    this.midY=this.r+40;this.endY=this.r+120;this.vMid=0;this.vEnd=0;
  };
  Balloon.prototype.path=function(r){
    ctx.beginPath();ctx.moveTo(0,r);
    ctx.bezierCurveTo(-r*1.2,r*.8,-r*1.3,-r*1.2,0,-r*1.2);
    ctx.bezierCurveTo(r*1.3,-r*1.2,r*1.2,r*.8,0,r);
    ctx.closePath();
  };
  Balloon.prototype.string=function(){
    var dx=this.x-this.prevX;this.prevX=this.x;
    this.vMid+=(this.r+40+Math.abs(dx)*8-this.midY)*.08;this.vMid*=.85;this.midY+=this.vMid;
    this.vEnd+=(this.r+120+Math.abs(dx)*14-this.endY)*.08;this.vEnd*=.85;this.vEnd+=.35;this.endY+=this.vEnd;
    var sway=Math.sin(this.angle*1.8)*6+dx*4;
    ctx.beginPath();ctx.moveTo(0,this.r+5);
    ctx.bezierCurveTo(sway,this.midY*.5,-sway,this.midY,sway*.6,this.endY);
    ctx.strokeStyle=stringColor;ctx.lineWidth=1.3;ctx.stroke();
  };
  Balloon.prototype.pop=function(){
    if(this.popped)return;
    this.popped=true;
    for(var i=0;i<20;i++)particles.push(new Particle(this.x,this.y,this.c.base));
    popped++;if(counter)counter.textContent=popped;
    var self=this;setTimeout(function(){self.init(false);},1000+Math.random()*1000);
  };
  Balloon.prototype.update=function(){
    if(this.popped)return;
    this.y-=this.speed;this.angle+=this.wob;this.x+=Math.sin(this.angle*.6)*.8;
    var dx=this.x-mouse.x,dy=this.y-this.r*.2-mouse.y;
    if(Math.sqrt(dx*dx+dy*dy)<this.r+10){this.pop();return;}
    if(this.y<-this.r-200)this.init(false);
    this.draw();
  };
  Balloon.prototype.draw=function(){
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(Math.sin(this.angle)*.06);
    this.string();
    this.path(this.r);
    var g=ctx.createRadialGradient(-this.r*.3,-this.r*.5,this.r*.1,0,0,this.r*1.5);
    g.addColorStop(0,this.c.light);g.addColorStop(.4,this.c.base);g.addColorStop(1,this.c.dark);
    ctx.fillStyle=g;ctx.globalAlpha=.92;ctx.fill();
    ctx.restore();
  };

  function resize(){
    var dpr=Math.min(window.devicePixelRatio||1,2);
    W=innerWidth;H=innerHeight;
    canvas.width=W*dpr;canvas.height=H*dpr;
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function spawn(){balloons=[];for(var i=0;i<COUNT;i++)balloons.push(new Balloon(true));}
  function frame(){
    ctx.clearRect(0,0,W,H);
    particles=particles.filter(function(p){return p.o>0;});
    particles.forEach(function(p){p.update();p.draw();});
    balloons.forEach(function(b){b.update();});
    requestAnimationFrame(frame);
  }
  function at(e){mouse.x=e.clientX;mouse.y=e.clientY;}
  function away(){mouse.x=mouse.y=-2000;}
  var lastW=innerWidth;
  addEventListener('resize',function(){resize();if(innerWidth!==lastW){lastW=innerWidth;spawn();}});
  addEventListener('pointermove',at,{passive:true});
  addEventListener('pointerdown',at,{passive:true});
  addEventListener('pointerup',function(e){if(e.pointerType!=='mouse')away();});
  document.addEventListener('pointerleave',away);
  resize();spawn();frame();
})();
