/* Case-study section nav: highlights the section currently on screen. */
(function(){
  var nav=document.querySelector('.case-nav');if(!nav)return;
  var links=[].slice.call(nav.querySelectorAll('a'));
  var secs=links.map(function(a){return document.getElementById(a.getAttribute('href').slice(1));});
  function update(){
    var y=innerHeight*.35,cur=-1;
    secs.forEach(function(s,i){if(s&&s.getBoundingClientRect().top<y)cur=i;});
    links.forEach(function(a,i){if(i===cur)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
  }
  addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();
})();
