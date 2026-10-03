/* Generative tree for the About-page CTA.
   A tree grows branch by branch, blossoms, holds, fades and regrows as a new one.
   Vanilla canvas; pauses off-screen; static full tree for reduced motion. */
(function(){
  var host=document.querySelector('[data-tree]');
  if(!host)return;
  var canvas=document.createElement('canvas');
  canvas.setAttribute('aria-hidden','true');
  host.appendChild(canvas);
  var ctx=canvas.getContext('2d');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W=0,H=0,dpr=1,nodes=[],particles=[],state='grow',timer=0,alpha=1,visible=true,raf=null,last=0;
  var mouse={x:.5,tx:.5};
  var bend=0,bendV=0,drag=null; /* drag the tree: it leans, then springs back and shakes */
  var MAX_DEPTH=9,GROW=0.045,HOLD=900,FADE=110,WAIT=40;

  function rnd(a,b){return a+Math.random()*(b-a);}
  function rootX(){return W<760?W*.5:W*.72;}

  function build(){
    nodes=[];
    var trunk=Math.min(H*.2,W*.15);
    (function add(parent,depth,angle,len,width){
      var n={p:parent,d:depth,a:angle,len:len,w:width,g:0,sway:rnd(0,6.28),kids:[]};
      nodes.push(n);if(parent)parent.kids.push(n);
      if(depth>=MAX_DEPTH||len<4)return n;
      var count=depth<2?2:(Math.random()<.18?3:2);
      if(depth>5&&Math.random()<.12)count=1;
      for(var i=0;i<count;i++){
        var spread=rnd(.24,.52)*(i===0?-1:1)*(count===3&&i===1?0:1);
        add(n,depth+1,angle+spread+rnd(-.08,.08),len*rnd(.68,.8),Math.max(.5,width*.68));
      }
      return n;
    })(null,0,-Math.PI/2+rnd(-.06,.06),trunk,Math.max(4,W/170));
    nodes[0].g=0;
  }
  function resize(){
    var r=host.getBoundingClientRect();
    dpr=Math.min(devicePixelRatio||1,2);
    W=Math.max(1,r.width);H=Math.max(1,r.height);
    canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function seedParticles(){
    particles=[];var n=W<760?26:50;
    for(var i=0;i<n;i++)particles.push({x:Math.random()*W,y:Math.random()*H,r:rnd(.4,1.6),v:rnd(.08,.35),o:rnd(.15,.6),t:rnd(0,6.28)});
  }
  function lerpColor(t){ // warm white trunk → lavender tips
    var a=[237,235,230],b=[154,157,255];
    return 'rgb('+Math.round(a[0]+(b[0]-a[0])*t)+','+Math.round(a[1]+(b[1]-a[1])*t)+','+Math.round(a[2]+(b[2]-a[2])*t)+')';
  }
  function draw(time){
    ctx.clearRect(0,0,W,H);
    /* particles */
    for(var i=0;i<particles.length;i++){
      var p=particles[i];
      if(!reduce){p.y-=p.v;p.t+=.02;if(p.y<-4){p.y=H+4;p.x=Math.random()*W;}}
      ctx.globalAlpha=p.o*(.6+.4*Math.sin(p.t));
      ctx.fillStyle='#C9CBFF';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill();
    }
    /* tree */
    mouse.x+=(mouse.tx-mouse.x)*.04;
    var wind=(mouse.x-.5)*.18;
    var target=drag?drag.pull:0;
    bendV+=(target-bend)*(drag?.12:.055);bendV*=drag?.7:.9;bend+=bendV;
    var shake=Math.min(1,Math.abs(bendV)*6);
    ctx.globalAlpha=alpha;ctx.lineCap='round';
    var t=time*.001;
    for(var k=0;k<nodes.length;k++){
      var n=nodes[k];
      var ang=n.a+(n.p?n.p._da:0);
      var da=(n.p?n.p._da:0)+(reduce?0:Math.sin(t*.9+n.sway)*.012*n.d)+wind*n.d*.035+bend*(.05+n.d*.045)+(reduce?0:shake*Math.sin(t*28+n.sway*3)*.05*(n.d/MAX_DEPTH));
      n._da=da;ang=n.a+da;
      var sx=n.p?n.p._ex:rootX(),sy=n.p?n.p._ey:H+2;
      var L=n.len*n.g;
      var ex=sx+Math.cos(ang)*L,ey=sy+Math.sin(ang)*L;
      n._ex=ex;n._ey=ey;
      if(n.g<=0)continue;
      ctx.strokeStyle=lerpColor(n.d/MAX_DEPTH);
      ctx.lineWidth=n.w;
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
      if(!n.kids.length&&n.g>=1){ // blossom
        ctx.fillStyle='rgba(154,157,255,.9)';ctx.shadowColor='rgba(154,157,255,.9)';ctx.shadowBlur=8;
        ctx.beginPath();ctx.arc(ex,ey,1.6,0,6.283);ctx.fill();ctx.shadowBlur=0;
      }
    }
    ctx.globalAlpha=1;
  }
  function step(){
    if(state==='grow'){
      var done=true;
      for(var k=0;k<nodes.length;k++){
        var n=nodes[k];
        if(n.g>=1)continue;
        if(!n.p||n.p.g>=1){n.g=Math.min(1,n.g+GROW*(1+n.d*.08));}
        done=false;
      }
      if(done){state='hold';timer=0;}
    }else if(state==='hold'){if(++timer>HOLD){state='fade';timer=0;}}
    else if(state==='fade'){alpha=Math.max(0,1-(++timer)/FADE);if(alpha<=0){state='wait';timer=0;}}
    else if(state==='wait'){if(++timer>WAIT){build();alpha=1;state='grow';}}
  }
  function frame(time){
    raf=null;
    if(!visible||document.hidden)return;
    var steps=last?Math.min(4,Math.round((time-last)/16.7)):1;last=time;
    for(var i=0;i<Math.max(1,steps);i++)step();
    draw(time);
    raf=requestAnimationFrame(frame);
  }
  function start(){if(!raf&&!reduce){last=0;raf=requestAnimationFrame(frame);}}

  resize();seedParticles();build();
  if(reduce){nodes.forEach(function(n){n.g=1;});draw(0);}
  addEventListener('resize',function(){resize();seedParticles();if(reduce)draw(0);});
  host.parentElement.addEventListener('pointermove',function(e){var r=host.getBoundingClientRect();mouse.tx=(e.clientX-r.left)/r.width;},{passive:true});
  host.parentElement.addEventListener('pointerleave',function(){mouse.tx=.5;});
  var sec=host.parentElement;
  sec.addEventListener('pointerdown',function(e){
    if(e.button>0||e.target.closest('a,button,.mail,input'))return;
    drag={x:e.clientX,pull:bend,id:e.pointerId};
    try{sec.setPointerCapture(e.pointerId);}catch(_){}
    sec.classList.add('tree-dragging');start();
  });
  sec.addEventListener('pointermove',function(e){
    if(!drag||e.pointerId!==drag.id)return;
    var dx=(e.clientX-drag.x)/Math.max(260,W*.3);
    drag.pull=Math.max(-1.1,Math.min(1.1,dx));
  });
  function release(e){if(!drag||(e&&e.pointerId!==drag.id))return;drag=null;sec.classList.remove('tree-dragging');}
  sec.addEventListener('pointerup',release);sec.addEventListener('pointercancel',release);
  sec.addEventListener('lostpointercapture',release);
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(en){visible=en[0].isIntersecting;if(visible)start();}).observe(host);
  }
  document.addEventListener('visibilitychange',function(){if(!document.hidden)start();});
  start();
})();
