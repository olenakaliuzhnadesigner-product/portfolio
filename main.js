(function(){
  var root=document.documentElement;
  function $(id){return document.getElementById(id);}

  /* theme toggle */
  var themeBtn=$('theme');
  function applyTheme(next){root.setAttribute('data-theme',next);try{localStorage.setItem('ok-theme',next);}catch(e){}}
  if(themeBtn)themeBtn.addEventListener('click',function(){
    var cur=root.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    var next=cur==='dark'?'light':'dark';
    var noMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!document.startViewTransition||noMotion){applyTheme(next);return;}
    var r=themeBtn.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    var max=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
    var t=document.startViewTransition(function(){applyTheme(next);});
    t.ready.then(function(){
      document.documentElement.animate(
        {clipPath:['circle(0px at '+x+'px '+y+'px)','circle('+max+'px at '+x+'px '+y+'px)']},
        {duration:500,easing:'ease-in-out',pseudoElement:'::view-transition-new(root)'});
    }).catch(function(){});
  });

  var fine=matchMedia('(pointer:fine)').matches;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* live size label on the hero selection */
  var sel=document.querySelector('.sel'),dim=$('dim');
  function measure(){if(sel&&dim){var r=sel.getBoundingClientRect();dim.textContent=Math.round(r.width)+' × '+Math.round(r.height);}}
  measure();addEventListener('resize',measure);if(document.fonts)document.fonts.ready.then(measure);

  /* "View case" multiplayer cursor over project cards */
  var follow=$('follow');
  if(follow&&fine&&!reduce){
    var x=0,y=0,tx=0,ty=0,raf=null;
    function loop(){x+=(tx-x)*.22;y+=(ty-y)*.22;follow.style.transform='translate('+x+'px,'+y+'px)';raf=(Math.abs(tx-x)+Math.abs(ty-y)>.3)?requestAnimationFrame(loop):null;}
    document.querySelectorAll('.case').forEach(function(card){
      card.addEventListener('mouseenter',function(e){x=tx=e.clientX;y=ty=e.clientY;follow.style.transform='translate('+x+'px,'+y+'px)';follow.classList.add('on');});
      card.addEventListener('mouseleave',function(){follow.classList.remove('on');});
      card.addEventListener('mousemove',function(e){tx=e.clientX;ty=e.clientY;if(!raf)raf=requestAnimationFrame(loop);},{passive:true});
    });
  }

  /* CV viewer */
  var view=$('cv-view'),last=null;
  if(view){
    var close=$('cv-close');
    function openCv(e){last=e.currentTarget;view.hidden=false;document.body.style.overflow='hidden';close.focus();}
    function closeCv(){view.hidden=true;document.body.style.overflow='';if(last)last.focus();}
    document.querySelectorAll('[data-cv]').forEach(function(b){b.addEventListener('click',openCv);});
    close.addEventListener('click',closeCv);
    view.addEventListener('click',function(e){if(e.target===view)closeCv();});
    addEventListener('keydown',function(e){if(e.key==='Escape'&&!view.hidden)closeCv();});
  }

  /* 3D flip title on case pages (Magic UI Text3DFlip, rotateDirection "top", stagger 30 ms from first) */
  var flipTitle=document.querySelector('.case-hero h1');
  if(flipTitle&&!reduce){
    var text=flipTitle.textContent.trim(),i=0;
    flipTitle.setAttribute('aria-label',text);
    flipTitle.innerHTML=text.split(' ').map(function(w){
      return '<span class="f3d-word" aria-hidden="true">'+Array.from(w).map(function(ch){
        var s='<span class="f3d" style="--i:'+(i++)+'"><span class="f3d-in"><span class="f3d-face">'+ch+'</span><span class="f3d-face f3d-top">'+ch+'</span></span></span>';
        return s;}).join('')+'</span>';
    }).join(' ');
    flipTitle.classList.add('f3d-ready');
    var flip=function(){flipTitle.classList.toggle('is-flipped');};
    setTimeout(flip,300);
    flipTitle.addEventListener('mouseenter',flip);
    flipTitle.addEventListener('touchstart',flip,{passive:true});
  }

  /* skills: cards rise in on scroll, chips cascade */
  var skCards=document.querySelectorAll('.sk-card');
  if(skCards.length&&!reduce&&'IntersectionObserver' in window){
    var skGrid=document.querySelector('.sk-grid');skGrid.classList.add('sk-anim');
    var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){var el=en.target,k=[].indexOf.call(skCards,el);setTimeout(function(){el.classList.add('in');},(k%2)*120);io.unobserve(el);}});},{threshold:.15});
    skCards.forEach(function(c){io.observe(c);});
    setTimeout(function(){skCards.forEach(function(c){c.classList.add('in');});},6000);
  }

  /* contact card */
  var cc=$('cc'),ccLast=null,ccTimer=null;
  if(cc){
    var tilt=cc.querySelector('.cc-tilt'),card=cc.querySelector('.cc-card');
    function ccOpen(e){
      ccLast=e&&e.currentTarget;clearTimeout(ccTimer);
      cc.hidden=false;void cc.offsetWidth;cc.classList.add('open');
      document.body.style.overflow='hidden';
      setTimeout(function(){var f=cc.querySelector('.cc-row');if(f)f.focus({preventScroll:true});},reduce?0:350);
    }
    function ccClose(){
      cc.classList.remove('open');document.body.style.overflow='';
      ccTimer=setTimeout(function(){cc.hidden=true;},reduce?0:450);
      if(ccLast)ccLast.focus({preventScroll:true});
    }
    document.querySelectorAll('[data-cc]').forEach(function(b){b.addEventListener('click',ccOpen);});
    cc.querySelectorAll('[data-cc-close]').forEach(function(b){b.addEventListener('click',ccClose);});
    addEventListener('keydown',function(e){
      if(cc.hidden)return;
      if(e.key==='Escape')ccClose();
      if(e.key==='Tab'){var f=card.querySelectorAll('a,button');var a=f[0],z=f[f.length-1];
        if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}
        else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}}
    });
    if(fine&&!reduce)cc.addEventListener('mousemove',function(e){
      var r=card.getBoundingClientRect(),x=(e.clientX-(r.left+r.width/2))/r.width,y=(e.clientY-(r.top+r.height/2))/r.height;
      tilt.style.transform='rotateY('+(x*10).toFixed(2)+'deg) rotateX('+(-y*8).toFixed(2)+'deg)';
    });
    if(fine)cc.addEventListener('mouseleave',function(){tilt.style.transform='';});
  }

  /* copy email */
  var copy=$('copy'),toast=$('toast'),mail=$('mail');
  /* side-cannon confetti, 3 s, brand-tinted */
  function cannons(){
    if(reduce||typeof window.confetti!=='function')return;
    var end=Date.now()+3000,colors=['#a786ff','#fd8bbc','#eca184','#f8deb1'];
    (function frame(){
      if(Date.now()>end)return;
      confetti({particleCount:2,angle:60,spread:55,startVelocity:60,origin:{x:0,y:.5},colors:colors,zIndex:60});
      confetti({particleCount:2,angle:120,spread:55,startVelocity:60,origin:{x:1,y:.5},colors:colors,zIndex:60});
      requestAnimationFrame(frame);
    })();
  }

  if(copy&&mail)copy.addEventListener('click',function(){
    cannons();
    function selectIt(){var r=document.createRange();r.selectNodeContents(mail);var s=getSelection();s.removeAllRanges();s.addRange(r);toast.textContent='Selected — press Ctrl/Cmd+C';}
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(mail.textContent).then(function(){toast.textContent='Copied';setTimeout(function(){toast.textContent='';},2000);},selectIt);
    }else selectIt();
  });
})();
