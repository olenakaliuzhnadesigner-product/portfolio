/* Recommendations carousel — vanilla port of the "connected carousel".
   Active card in the middle, slim connected cards on the sides,
   autoplay with a progress tab, arrows / swipe / click to navigate. */
(function(){
  var root=document.querySelector('.tm');
  if(!root)return;
  var stage=root.querySelector('.tm-stage');
  var cards=[].slice.call(root.querySelectorAll('.tm-card'));
  var tabs=[].slice.call(root.querySelectorAll('.tm-tab'));
  var N=cards.length;if(!N)return;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INTERVAL=7000;
  var page=0,prevOff=cards.map(function(){return null;});
  var elapsed=0,last=null,raf=null,paused=false,inView=false;

  function tier(){var w=innerWidth;return w<768?'mobile':w<1120?'tablet':'desktop';}
  function active(){var t=tier();
    if(t==='desktop')return {w:762,h:513};
    if(t==='tablet')return {w:560,h:440};
    return {w:Math.min(340,innerWidth-56),h:490};
  }
  /* geometry: x,y = top-left relative to the stage centre */
  function geo(off,t,a){
    var hide=function(x,w,h){return {x:x,y:-h/2,w:w,h:h,o:0,z:0,pe:false};};
    if(off===0)return {x:-a.w/2,y:-a.h/2,w:a.w,h:a.h,o:1,z:1,pe:true};
    if(t==='mobile'){
      var pw=60,ph=410,g=16;
      if(off===-1)return {x:-a.w/2-g-pw,y:-ph/2,w:pw,h:ph,o:1,z:2,pe:true};
      if(off===1)return {x:a.w/2+g,y:-ph/2,w:pw,h:ph,o:1,z:2,pe:true};
      return hide(off<0?-a.w/2-220:a.w/2+220,pw,ph);
    }
    if(t==='tablet'){
      var sw=100,sh=340,g2=18;
      if(off===-1)return {x:-a.w/2-g2-sw,y:-sh/2,w:sw,h:sh,o:1,z:2,pe:true};
      if(off===1)return {x:a.w/2+g2,y:-sh/2,w:sw,h:sh,o:1,z:2,pe:true};
      return hide(off<0?-a.w/2-240:a.w/2+240,74,205);
    }
    switch(off){
      case -1:return {x:-506,y:-172,w:105,h:344,o:1,z:2,pe:true};
      case 1:return {x:401,y:-172,w:105,h:344,o:1,z:2,pe:true};
      case -2:return {x:-596,y:-102.5,w:74,h:205,o:1,z:2,pe:true};
      case 2:return {x:522,y:-102.5,w:74,h:205,o:1,z:2,pe:true};
      case -3:return hide(-720,74,205);
      case 3:return hide(646,74,205);
      default:return hide(off<0?-860:860,74,205);
    }
  }
  function offsetOf(i){
    var a=((page%N)+N)%N,d=i-a;
    if(d>N/2)d-=N;else if(d<=-N/2)d+=N;
    return d;
  }
  function layout(){
    var t=tier(),a=active(),ai=((page%N)+N)%N;
    root.style.setProperty('--aw',a.w+'px');root.style.setProperty('--ah',a.h+'px');
    stage.style.height=a.h+'px';
    cards.forEach(function(c,i){
      var off=offsetOf(i),g=geo(off,t,a);
      /* a card that wraps around from one end to the other jumps without animating */
      var jump=prevOff[i]!==null&&Math.abs(off-prevOff[i])>2;
      c.classList.toggle('no-anim',jump);
      c.style.transform='translate('+g.x+'px,'+g.y+'px)';
      c.style.width=g.w+'px';c.style.height=g.h+'px';
      c.style.opacity=g.o;c.style.zIndex=g.z;
      c.style.pointerEvents=g.pe?'auto':'none';
      c.dataset.off=off;
      c.classList.toggle('is-active',off===0);
      c.classList.toggle('neck-r',off===-1||(off===-2&&t==='desktop'));
      c.classList.toggle('neck-l',off===1||(off===2&&t==='desktop'));
      c.classList.toggle('neck-sm',Math.abs(off)===2);
      c.classList.toggle('from-l',off<0);
      c.setAttribute('aria-hidden',off===0?'false':'true');
      prevOff[i]=off;
      if(jump){void c.offsetWidth;}
    });
    tabs.forEach(function(b,i){
      var on=i===ai;b.setAttribute('aria-selected',on?'true':'false');b.tabIndex=on?0:-1;
      if(!on)b.style.setProperty('--p',0);
    });
  }
  function go(d){page+=d;elapsed=0;last=null;setProgress(0);layout();}
  function setProgress(p){var ai=((page%N)+N)%N;if(tabs[ai])tabs[ai].style.setProperty('--p',p);}

  function tick(ts){
    raf=null;
    if(paused||!inView||document.hidden||reduce){last=null;return;}
    if(last===null)last=ts;
    elapsed+=ts-last;last=ts;
    if(elapsed>=INTERVAL){go(1);}
    else setProgress(elapsed/INTERVAL);
    raf=requestAnimationFrame(tick);
  }
  function run(){if(!raf&&!reduce)raf=requestAnimationFrame(tick);}

  cards.forEach(function(c){
    c.addEventListener('click',function(){var o=+c.dataset.off;if(o)go(o);});
  });
  tabs.forEach(function(b,i){
    b.addEventListener('click',function(){var d=i-((page%N)+N)%N;if(d>N/2)d-=N;else if(d<-N/2)d+=N;go(d);run();});
  });
  root.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft'){e.preventDefault();go(-1);}
    else if(e.key==='ArrowRight'){e.preventDefault();go(1);}
  });
  root.addEventListener('mouseenter',function(){paused=true;});
  root.addEventListener('mouseleave',function(){paused=false;run();});
  root.addEventListener('focusin',function(){paused=true;});
  root.addEventListener('focusout',function(){paused=false;run();});

  /* swipe */
  var sx=null,sy=null;
  stage.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse')return;sx=e.clientX;sy=e.clientY;},{passive:true});
  stage.addEventListener('pointerup',function(e){
    if(sx===null)return;var dx=e.clientX-sx,dy=e.clientY-sy;sx=null;
    if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy))go(dx<0?1:-1);
  });

  if('IntersectionObserver' in window){
    new IntersectionObserver(function(en){inView=en[0].isIntersecting;if(inView)run();},{threshold:.35}).observe(root);
  }else{inView=true;}
  document.addEventListener('visibilitychange',function(){if(!document.hidden)run();});
  var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){cards.forEach(function(c){c.classList.add('no-anim');});layout();requestAnimationFrame(function(){cards.forEach(function(c){c.classList.remove('no-anim');});});},80);});

  root.classList.add('ready');
  layout();run();
})();
