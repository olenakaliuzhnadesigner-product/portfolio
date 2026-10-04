/* Contact page
   1) "Let's work together": click the headline (or scroll down a little)
      and it dissolves into the full list of contacts.
   2) Door video: the section is tall and its inner frame sticks to the screen,
      so scrolling scrubs the video forward and back. The first phrase blurs
      away, the second one comes into focus at the end. */
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(v,a,b){return Math.min(b,Math.max(a,v));}

  /* ---- 1. Let's work together ---- */
  var lw=document.getElementById('lw'),open=document.getElementById('lw-open'),done=document.getElementById('lw-done');
  if(lw&&open){
    var opened=false;
    function reveal(){
      if(opened)return;opened=true;
      lw.classList.add('clicked');open.setAttribute('aria-expanded','true');
      setTimeout(function(){lw.classList.add('done');done.setAttribute('aria-hidden','false');},reduce?0:500);
    }
    open.addEventListener('click',reveal);
    /* the block is pinned while you scroll through it: a short scroll turns
       the headline into the contacts, which then stay on screen */
    function onScroll(){var r=lw.getBoundingClientRect(),range=r.height-innerHeight;
      if(!opened&&((range>0&&-r.top>range*.18)||(range<=0&&scrollY>40)))reveal();}
    addEventListener('scroll',onScroll,{passive:true});onScroll();
  }

  /* ---- 2. Doors: a corridor of doors that swing open as you scroll ---- */
  var door=document.getElementById('door');
  if(!door)return;
  var cv=door.querySelector('.door-canvas'),ctx=cv.getContext('2d'),title=door.querySelector('.door-title'),
      tag=door.querySelector('.door-tag'),hint=door.querySelector('.door-hint'),bar=door.querySelector('.door-bar i');
  var W=0,H=0,target=0,current=0,raf=null,N=7,GAP=1.6,motes=[];
  for(var m=0;m<70;m++)motes.push({x:Math.random()*2-1,y:Math.random()*2.2-1.2,z:Math.random()*N*GAP+0.5,s:Math.random()*.6+.4});
  function size(){var dpr=Math.min(devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  function proj(x,y,z,cam){var d=z-cam;if(d<.05)return null;var f=Math.min(W,H*1.15)*.62/d;return [W/2+x*f,H*.52+y*f,d];}
  function quad(pts,fill,stroke,lw){
    if(pts.some(function(p){return!p;}))return;
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(var i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||1;ctx.stroke();}
  }
  function draw(p){
    var cam=p*(N-1)*GAP+(-1.2)*(1-p);
    var bg=ctx.createRadialGradient(W/2,H*.55,0,W/2,H*.55,Math.max(W,H)*.8);
    bg.addColorStop(0,'#141a2c');bg.addColorStop(1,'#05070d');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    /* final light at the end of the corridor */
    var endZ=N*GAP+.6,ep=proj(0,-.2,endZ,cam);
    if(ep){var r=Math.min(W,H)*(.25+p*p*1.6)/Math.max(.4,ep[2]*.35);
      var g=ctx.createRadialGradient(ep[0],ep[1],0,ep[0],ep[1],r);
      g.addColorStop(0,'rgba(255,226,170,'+(.35+p*.6)+')');g.addColorStop(.35,'rgba(255,190,120,'+(.15+p*.25)+')');g.addColorStop(1,'rgba(255,170,90,0)');
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
    /* floor lines */
    ctx.lineWidth=1;
    for(var k=-3;k<=3;k++){var a=proj(k*.45,1,cam+.3,cam),b=proj(k*.18,1,endZ,cam);if(a&&b){ctx.strokeStyle='rgba(180,190,220,.06)';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}}
    /* doors, far to near */
    for(var i=N-1;i>=0;i--){
      var z=(i+1)*GAP;if(z-cam<.12)continue;
      var depth=z-cam,fog=Math.max(0,Math.min(1,1-(depth-1)/(N*GAP)));
      var open=Math.max(0,Math.min(1,(cam-(z-3.2))/1.6));open=open*open*(3-2*open);
      var ang=open*1.35,hw=.55,top=-1.15,bot=1;
      /* light spilling from the opened doorway */
      if(open>0){var c=proj(0,-.1,z+.01,cam);if(c){var rr=(c[2]>0?Math.min(W,H)*.9/c[2]:0)*.9;
        var lg=ctx.createRadialGradient(c[0],c[1],0,c[0],c[1],rr);lg.addColorStop(0,'rgba(255,214,150,'+(.25*open*fog)+')');lg.addColorStop(1,'rgba(255,214,150,0)');ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);}}
      /* wall around the doorway */
      var o=[proj(-hw,top,z,cam),proj(hw,top,z,cam),proj(hw,bot,z,cam),proj(-hw,bot,z,cam)];
      if(o.some(function(q){return!q;}))continue;
      ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.moveTo(o[0][0],o[0][1]);ctx.lineTo(o[3][0],o[3][1]);ctx.lineTo(o[2][0],o[2][1]);ctx.lineTo(o[1][0],o[1][1]);ctx.closePath();
      ctx.fillStyle='rgba(8,10,18,'+(.55+.4*fog)+')';ctx.fill('evenodd');ctx.restore();
      /* warm light behind an open doorway */
      if(open>0){var dg=ctx.createLinearGradient(0,o[0][1],0,o[3][1]);
        dg.addColorStop(0,'rgba(255,236,200,'+(.55*open*fog)+')');dg.addColorStop(1,'rgba(255,180,110,'+(.35*open*fog)+')');quad(o,dg);}
      /* closed doorway glow (crack of light under / between leaves) */
      if(open<1){quad(o,'rgba(10,13,24,'+(.85*(1-open))+')');
        var cy1=proj(0,top+.04,z,cam),cy2=proj(0,bot,z,cam);
        if(cy1&&cy2){ctx.strokeStyle='rgba(255,210,140,'+(.55*fog*(1-open))+')';ctx.lineWidth=Math.max(1,2/depth);ctx.beginPath();ctx.moveTo(cy1[0],cy1[1]);ctx.lineTo(cy2[0],cy2[1]);ctx.stroke();}
        var b1=proj(-hw,bot,z,cam),b2=proj(hw,bot,z,cam);
        if(b1&&b2){ctx.strokeStyle='rgba(255,200,130,'+(.4*fog*(1-open))+')';ctx.lineWidth=Math.max(1,2.5/depth);ctx.beginPath();ctx.moveTo(b1[0],b1[1]);ctx.lineTo(b2[0],b2[1]);ctx.stroke();}}
      /* two leaves swinging toward the viewer */
      [-1,1].forEach(function(s){
        var hx=s*hw,ex=hx-s*Math.cos(ang)*hw,ez=z-Math.sin(ang)*hw;
        var leaf=[proj(hx,top,z,cam),proj(ex,top,ez,cam),proj(ex,bot,ez,cam),proj(hx,bot,z,cam)];
        var shade=Math.round(18+open*28);
        quad(leaf,'rgba('+shade+','+(shade+4)+','+(shade+16)+','+(.92*fog+.08)+')','rgba(255,220,160,'+(.08+.35*open)*fog+')',1);
        var kn=proj(hx-s*Math.cos(ang)*hw*.82,.02,z-Math.sin(ang)*hw*.82,cam);
        if(kn){ctx.fillStyle='rgba(255,215,150,'+(.6*fog)+')';ctx.beginPath();ctx.arc(kn[0],kn[1],Math.max(1,3/kn[2]),0,6.283);ctx.fill();}
      });
      quad(o,null,'rgba(255,220,170,'+(.12+.25*fog)+')',Math.max(1,1.6/depth));
    }
    /* drifting dust in the light */
    for(var j=0;j<motes.length;j++){var mo=motes[j],q=proj(mo.x,mo.y,mo.z,cam);if(!q)continue;
      ctx.fillStyle='rgba(255,226,180,'+(Math.min(1,.8/q[2])*.6)+')';ctx.beginPath();ctx.arc(q[0],q[1],Math.max(.5,mo.s*1.8/q[2]),0,6.283);ctx.fill();}
    if(p>.85){ctx.fillStyle='rgba(255,226,180,'+((p-.85)/.15*.18)+')';ctx.fillRect(0,0,W,H);}
    var vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  }
  var navEl=document.querySelector('.nav');
  function navTone(){var r=door.getBoundingClientRect();if(navEl)navEl.classList.toggle('nav-on-dark',r.top<64&&r.bottom>64);}
  addEventListener('scroll',navTone,{passive:true});navTone();
  function readScroll(){var r=door.getBoundingClientRect(),range=r.height-innerHeight;target=range>0?clamp(-r.top/range,0,1):0;}
  function paint(){
    current+=(target-current)*.12;if(Math.abs(target-current)<.0005)current=target;
    draw(current);
    var t=1-clamp(current/.3,0,1);
    title.style.opacity=t;title.style.transform='translateY('+((1-t)*-24)+'px) scale('+(.96+t*.04)+')';title.style.filter='blur('+((1-t)*10)+'px)';
    var g=clamp((current-.8)/.2,0,1);
    tag.style.opacity=g;tag.style.transform='translateY('+((1-g)*20)+'px) scale('+(.97+g*.03)+')';tag.style.filter='blur('+((1-g)*8)+'px)';
    hint.style.opacity=current>.01?0:1;bar.style.transform='scaleX('+current+')';
  }
  function frame(){raf=null;paint();if(Math.abs(target-current)>.0005)raf=requestAnimationFrame(frame);}
  function kick(){readScroll();if(!raf)raf=requestAnimationFrame(frame);}
  size();
  if(reduce){draw(.9);title.style.opacity=0;tag.style.opacity=1;addEventListener('resize',function(){size();draw(.9);});}
  else{addEventListener('scroll',kick,{passive:true});addEventListener('resize',function(){size();kick();paint();});readScroll();current=target;paint();}
})();
