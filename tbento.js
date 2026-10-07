(function(){
  var wall=document.querySelector('[data-reveal]');if(!wall)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  wall.classList.add('tb-anim');
  var done=false;
  function show(){if(done)return;done=true;wall.classList.add('is-in');
    removeEventListener('scroll',check);removeEventListener('resize',check);}
  function check(){var r=wall.getBoundingClientRect();
    if(r.top<innerHeight*0.85&&r.bottom>0)show();}
  addEventListener('scroll',check,{passive:true});addEventListener('resize',check);
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(en,ob){if(en[0].isIntersecting){show();ob.disconnect();}},{threshold:.1}).observe(wall);
  }
  requestAnimationFrame(check);
  setTimeout(show,4000);
})();
