/* Constellation grid for the case-page CTA: a mesh of points held by springs.
   Moving the cursor pushes points away (harder when you move fast); they spring back.
   Colours follow the site theme; pauses off-screen; static for reduced motion. */
(function(){
  var host=document.querySelector('[data-constellation]');
  if(!host)return;
  var sec=host.parentElement;
  var canvas=document.createElement('canvas');host.appendChild(canvas);
  var ctx=canvas.getContext('2d');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W=0,H=0,nodes=[],cols=0,rows=0,raf=null,visible=true,last=0;
  var mouse={x:-1e4,y:-1e4,px:-1e4,py:-1e4,r:200};
  var SP=55,LINK=75,LINK2=LINK*LINK;
  var ink='255,255,255',accent='154,157,255';

  function readTheme(){
    var cs=getComputedStyle(sec);
    var c=document.createElement('span');c.style.color=cs.color;document.body.appendChild(c);
    var m=getComputedStyle(c).color.match(/\d+/g);c.remove();
    if(m)ink=m[0]+','+m[1]+','+m[2];
    var dark=document.documentElement.getAttribute('data-theme')==='dark'||(!document.documentElement.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme: dark)').matches);
    accent=dark?'79,83,214':'154,157,255';
  }
  function resize(){
    var r=sec.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    W=r.width;H=r.height;canvas.width=W*dpr;canvas.height=H*dpr;
    canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
    SP=W<600?44:55;
    cols=Math.ceil(W/SP)+1;rows=Math.ceil(H/SP)+1;nodes=[];
    for(var i=0;i<cols;i++)for(var j=0;j<rows;j++){
      var x=i*SP,y=j*SP;
      nodes.push({x:x,y:y,bx:x,by:y,vx:0,vy:0,r:Math.random()*1.2+1.2,p:Math.random()*6.28,
        l:(i*7).toString(16).toUpperCase()+':'+(j*11).toString(16).toUpperCase()});
    }
  }
  function draw(dt){
    ctx.clearRect(0,0,W,H);
    var mvx=(mouse.x-mouse.px)/(dt*1000||1),mvy=(mouse.y-mouse.py)/(dt*1000||1);
    mouse.px=mouse.x;mouse.py=mouse.y;
    var speed=Math.min(8,Math.sqrt(mvx*mvx+mvy*mvy));
    var i,n;
    for(i=0;i<nodes.length;i++){
      n=nodes[i];n.p+=dt*3;
      if(reduce)continue;
      var dx=mouse.x-n.x,dy=mouse.y-n.y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<mouse.r&&d>0){
        var f=(1-d/mouse.r)*(1500+speed*150),a=Math.atan2(dy,dx);
        n.vx-=Math.cos(a)*f*dt;n.vy-=Math.sin(a)*f*dt;
      }
      n.vx+=(n.bx-n.x)*18*dt;n.vy+=(n.by-n.y)*18*dt;
      n.vx*=.82;n.vy*=.82;
      n.x+=n.vx*dt*60;n.y+=n.vy*dt*60;
    }
    /* links: only neighbours within two grid cells, so it stays fast */
    ctx.lineWidth=.7;
    for(i=0;i<cols;i++)for(var j=0;j<rows;j++){
      n=nodes[i*rows+j];
      for(var di=0;di<=2;di++)for(var dj=-2;dj<=2;dj++){
        if(di===0&&dj<=0)continue;
        var ii=i+di,jj=j+dj;if(ii>=cols||jj<0||jj>=rows)continue;
        var m=nodes[ii*rows+jj],x=n.x-m.x,y=n.y-m.y,q=x*x+y*y;
        if(q<LINK2){
          ctx.strokeStyle='rgba('+ink+','+((1-Math.sqrt(q)/LINK)*.2).toFixed(3)+')';
          ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(m.x,m.y);ctx.stroke();
        }
      }
    }
    ctx.font='8px "JetBrains Mono",ui-monospace,monospace';
    for(i=0;i<nodes.length;i++){
      n=nodes[i];
      var ex=mouse.x-n.x,ey=mouse.y-n.y,dd=Math.sqrt(ex*ex+ey*ey),near=dd<mouse.r;
      var al=near?.95:.28+Math.sin(n.p)*.1;
      ctx.fillStyle='rgba('+(near?accent:ink)+','+al.toFixed(3)+')';
      ctx.beginPath();ctx.arc(n.x,n.y,Math.max(.5,near?n.r*2.2:n.r+Math.sin(n.p)*.3),0,6.283);ctx.fill();
      if(dd<90){
        var pr=((n.p*20)%30)+4;
        ctx.strokeStyle='rgba('+accent+','+((1-pr/34)*.45).toFixed(3)+')';ctx.lineWidth=1;
        ctx.beginPath();ctx.arc(n.x,n.y,pr,0,6.283);ctx.stroke();ctx.lineWidth=.7;
        ctx.fillStyle='rgba('+accent+',.85)';ctx.fillText(n.l,n.x+10,n.y-10);
      }
    }
  }
  function frame(t){
    raf=null;if(!visible||document.hidden)return;
    var dt=last?Math.min((t-last)/1000,.05):.016;last=t;
    draw(dt);raf=requestAnimationFrame(frame);
  }
  function start(){if(!raf&&!reduce){last=0;raf=requestAnimationFrame(frame);}}

  readTheme();resize();draw(.016);
  sec.addEventListener('pointermove',function(e){var r=sec.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;},{passive:true});
  sec.addEventListener('pointerleave',function(){mouse.x=mouse.y=mouse.px=mouse.py=-1e4;});
  addEventListener('resize',function(){resize();if(reduce)draw(.016);});
  new MutationObserver(function(){readTheme();if(reduce)draw(.016);}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if('IntersectionObserver' in window)new IntersectionObserver(function(en){visible=en[0].isIntersecting;if(visible)start();}).observe(sec);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)start();});
  start();
})();
