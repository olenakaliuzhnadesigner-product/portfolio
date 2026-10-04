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
    /* scrolling down past the first screen also reveals the contacts */
    addEventListener('scroll',function(){if(!opened&&scrollY>innerHeight*.12)reveal();},{passive:true});
  }

  /* ---- 2. Door video scrub ---- */
  var door=document.getElementById('door');
  if(!door)return;
  var video=door.querySelector('.door-video'),title=door.querySelector('.door-title'),
      tag=door.querySelector('.door-tag'),hint=door.querySelector('.door-hint'),bar=door.querySelector('.door-bar i');
  var duration=0,target=0,current=0,seeking=false,pending=null,raf=null;

  video.addEventListener('loadedmetadata',function(){duration=video.duration||0;});
  video.addEventListener('loadeddata',function(){duration=video.duration||0;door.classList.add('ready');if(reduce)video.currentTime=duration*.92;});
  /* iOS will not buffer a video that was never played */
  var p=video.play();if(p&&p.then)p.then(function(){video.pause();}).catch(function(){});
  video.addEventListener('seeked',function(){seeking=false;if(pending!==null){var t=pending;pending=null;seek(t);}});
  function seek(t){if(seeking){pending=t;return;}seeking=true;video.currentTime=t;}

  function readScroll(){
    var r=door.getBoundingClientRect(),range=r.height-innerHeight;
    target=range>0?clamp(-r.top/range,0,1):0;
  }
  function paint(){
    current+=(target-current)*.18;
    if(Math.abs(target-current)<.0005)current=target;
    if(duration>0)seek(current*duration);
    video.style.transform='scale('+(1+current*.06)+')';
    var t=1-clamp(current/.35,0,1);
    title.style.opacity=t;title.style.transform='translateY('+((1-t)*-24)+'px) scale('+(.96+t*.04)+')';title.style.filter='blur('+((1-t)*10)+'px)';
    var g=clamp((current-.82)/.18,0,1);
    tag.style.opacity=g;tag.style.transform='translateY('+((1-g)*20)+'px) scale('+(.97+g*.03)+')';tag.style.filter='blur('+((1-g)*8)+'px)';
    hint.style.opacity=current>.01?0:1;
    bar.style.transform='scaleX('+current+')';
  }
  function frame(){raf=null;paint();if(Math.abs(target-current)>.0005)raf=requestAnimationFrame(frame);}
  function kick(){readScroll();if(!raf)raf=requestAnimationFrame(frame);}
  if(reduce){title.style.opacity=0;tag.style.opacity=1;}
  else{addEventListener('scroll',kick,{passive:true});addEventListener('resize',kick);kick();}
})();
