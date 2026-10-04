/* Grid pulse: background for the Cases-page CTA (vanilla port of grid-pulse).
   A faint 24px grid; cells near the pointer light up in a hue that shifts
   down the section, then fade out. A few cells pulse on their own as well.
   Cells behind the headline and email are dimmed so the text stays readable.
   Pauses off-screen; draws nothing that moves for reduced motion. */
(function(){
  var host=document.querySelector('[data-grid-pulse]');
  if(!host)return;
  var sec=host.parentElement;
  var canvas=document.createElement('canvas');host.appendChild(canvas);
  var ctx=canvas.getContext('2d');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CELL=24,REACH=2.6,AMBIENT=2,MAX_LIT=180,HUE_TOP=60,HUE_SPAN=270,
      TINTS=[88,80,72,64,56],TINTS_DARK=[72,65,58,51,44],FAINT=.13,FADE=2.2,PAD=5,
      FADE_IN=160,FADE_OUT=750;
  var W=0,H=0,cols=0,rows=0,lit=new Map(),avoid=[],tints=TINTS_DARK,raf=null,visible=true,amb=null,lastCell=null;

  function readTheme(){
    var m=getComputedStyle(sec).color.match(/[\d.]+/g);
    if(!m)return;
    var lum=(.2126*m[0]+.7152*m[1]+.0722*m[2])/255;
    tints=lum>.5?TINTS_DARK:TINTS; /* light text = dark background */
  }
  function readAvoid(){
    var s=sec.getBoundingClientRect();avoid=[];
    sec.querySelectorAll('h2,.mail').forEach(function(el){
      var range=document.createRange();range.selectNodeContents(el);
      [].forEach.call(range.getClientRects(),function(r){
        if(r.width<2)return;
        avoid.push({l:r.left-s.left-PAD,t:r.top-s.top-PAD,r:r.right-s.left+PAD,b:r.bottom-s.top+PAD});
      });
    });
  }
  function resize(){
    var r=sec.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    W=r.width;H=r.height;canvas.width=W*dpr;canvas.height=H*dpr;
    canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
    cols=Math.ceil(W/CELL);rows=Math.ceil(H/CELL);readAvoid();
  }
  function dim(x,y){
    var cx=x+CELL/2,cy=y+CELL/2,k=1;
    for(var i=0;i<avoid.length;i++){var a=avoid[i];
      var dx=Math.max(a.l-cx,0,cx-a.r),dy=Math.max(a.t-cy,0,cy-a.b),d=Math.sqrt(dx*dx+dy*dy);
      if(d<CELL*FADE)k=Math.min(k,FAINT+(1-FAINT)*(d/(CELL*FADE)));}
    return k;
  }
  function light(c,r,strength,now){
    if(c<0||r<0||c>=cols||r>=rows)return;
    var key=c+','+r,cur=lit.get(key);
    if(cur&&cur.peak>=strength&&now-cur.t<FADE_IN)return;
    if(!cur&&lit.size>=MAX_LIT){var first=lit.keys().next().value;lit.delete(first);}
    lit.set(key,{c:c,r:r,t:now,peak:Math.max(strength,cur?cur.peak*.6:0),tint:tints[Math.floor(Math.random()*tints.length)]});
  }
  function burst(px,py,now,scale){
    var c0=Math.floor(px/CELL),r0=Math.floor(py/CELL),R=Math.ceil(REACH);
    for(var dc=-R;dc<=R;dc++)for(var dr=-R;dr<=R;dr++){
      var d=Math.sqrt(dc*dc+dr*dr);if(d>REACH)continue;
      light(c0+dc,r0+dr,(1-d/(REACH+.4))*(scale||1),now);
    }
    kick();
  }
  function draw(now){
    ctx.clearRect(0,0,W,H);
    lit.forEach(function(o,key){
      var age=Math.max(0,now-o.t),a;
      if(age<FADE_IN)a=Math.max(.05,age/FADE_IN);else a=1-(age-FADE_IN)/FADE_OUT;
      if(a<=0){lit.delete(key);return;}
      var x=o.c*CELL,y=o.r*CELL,hue=(HUE_TOP+(y/Math.max(1,H))*HUE_SPAN)%360;
      ctx.fillStyle='hsla('+hue.toFixed(0)+',85%,'+o.tint+'%,'+(a*o.peak*.75*dim(x,y)).toFixed(3)+')';
      ctx.fillRect(x+1,y+1,CELL-1,CELL-1);
    });
  }
  function frame(now){
    raf=null;if(!visible||document.hidden)return;
    draw(now);if(lit.size)raf=requestAnimationFrame(frame);
  }
  function kick(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame);}
  function ambient(){
    clearTimeout(amb);if(reduce)return;
    amb=setTimeout(function(){
      if(visible&&!document.hidden){var now=performance.now();
        for(var i=0;i<AMBIENT;i++)burst(Math.random()*W,Math.random()*H,now,.55);}
      ambient();
    },1400+Math.random()*1800);
  }
  function staticPattern(){ /* reduced motion: a few soft, still patches */
    var now=performance.now();FADE_OUT=1e12;
    for(var i=0;i<5;i++)burst(Math.random()*W,Math.random()*H,now-FADE_IN,.5);
    draw(now);
  }

  readTheme();resize();
  addEventListener('pointermove',function(e){
    if(reduce||!visible)return;
    var s=sec.getBoundingClientRect(),x=e.clientX-s.left,y=e.clientY-s.top;
    if(x<0||y<0||x>W||y>H)return;
    var cell=Math.floor(x/CELL)+','+Math.floor(y/CELL);
    if(cell===lastCell)return;lastCell=cell;
    burst(x,y,performance.now(),1);
  },{passive:true});
  var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){resize();if(reduce)staticPattern();},100);});
  if('ResizeObserver' in window)new ResizeObserver(function(){resize();if(reduce)staticPattern();}).observe(sec);
  new MutationObserver(readTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if('IntersectionObserver' in window)new IntersectionObserver(function(en){visible=en[0].isIntersecting;if(visible)readAvoid();kick();}).observe(sec);
  document.addEventListener('visibilitychange',kick);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(readAvoid);
  if(reduce)staticPattern();else ambient();
})();
