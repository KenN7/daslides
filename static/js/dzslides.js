
// <!-- {{{{ dzslides core
// #
// #
// #     __  __  __       .  __   ___  __
// #    |  \  / /__` |    | |  \ |__  /__`
// #    |__/ /_ .__/ |___ | |__/ |___ .__/ core :€
// #
// #
// # The following block of code is not supposed to be edited.
// # But if you want to change the behavior of these slides,
// # feel free to hack it!
// #
// -->

  var Dz = {
    remoteWindows: [],
    idx: -1,
    step: 0,
    html: null,
    slides: null,
    progressBar : null,
    params: {
      autoplay: "1"
    }
  };

  Dz.init = function() {
    document.body.className = "loaded";
    this.slides = Array.prototype.slice.call($$("body > section"));
    this.progressBar = $("#progress-bar");
    this.html = document.body.parentNode;
    this.setupParams();
    this.onhashchange();
    this.setupTouchEvents();
    this.onresize();
    this.setupView();
  }

  Dz.setupParams = function() {
    var p = window.location.search.substr(1).split('&');
    p.forEach(function(e, i, a) {
      var keyVal = e.split('=');
      Dz.params[keyVal[0]] = decodeURIComponent(keyVal[1]);
    });
  // Specific params handling
    if (!+this.params.autoplay)
      $$.forEach($$("video"), function(v){ v.controls = true });
  }

  Dz.onkeydown = function(aEvent) {
    // Don't intercept keyboard shortcuts
    if (aEvent.altKey
      || aEvent.ctrlKey
      || aEvent.metaKey
      || aEvent.shiftKey) {
      return;
    }
    if ( aEvent.keyCode == 37 // left arrow
      || aEvent.keyCode == 38 // up arrow
      || aEvent.keyCode == 33 // page up
    ) {
      aEvent.preventDefault();
      this.back();
    }
    if ( aEvent.keyCode == 39 // right arrow
      || aEvent.keyCode == 40 // down arrow
      || aEvent.keyCode == 34 // page down
    ) {
      aEvent.preventDefault();
      this.forward();
    }
    if (aEvent.keyCode == 35) { // end
      aEvent.preventDefault();
      this.goEnd();
    }
    if (aEvent.keyCode == 36) { // home
      aEvent.preventDefault();
      this.goStart();
    }
    if (aEvent.keyCode == 32) { // space
      aEvent.preventDefault();
      this.toggleContent();
    }
    if (aEvent.keyCode == 70) { // f
      aEvent.preventDefault();
      this.goFullscreen();
    }
    if (aEvent.keyCode == 79    //o
     || aEvent.keyCode == 27    //Esc
    ) {
      aEvent.preventDefault();
      this.toggleView();
    }
  }

  /* Touch Events */

  Dz.setupTouchEvents = function() {
    var orgX, newX;
    var tracking = false;

    var db = document.body;
    db.addEventListener("touchstart", start.bind(this), false);
    db.addEventListener("touchmove", move.bind(this), false);

    function start(aEvent) {
      aEvent.preventDefault();
      tracking = true;
      orgX = aEvent.changedTouches[0].pageX;
    }

    function move(aEvent) {
      if (!tracking) return;
      newX = aEvent.changedTouches[0].pageX;
      if (orgX - newX > 100) {
        tracking = false;
        this.forward();
      } else {
        if (orgX - newX < -100) {
          tracking = false;
          this.back();
        }
      }
    }
  }

  Dz.setupView = function() {
    document.body.addEventListener("click", function ( e ) {
      if (!Dz.html.classList.contains("view")) return;
      if (!e.target || e.target.nodeName != "SECTION") return;

      Dz.html.classList.remove("view");
      Dz.setCursor(Dz.slides.indexOf(e.target) + 1);
    }, false);
  }

  /* Adapt the size of the slides to the window */

  Dz.onresize = function() {
    var db = document.body;
    var sx = db.clientWidth / window.innerWidth;
    var sy = db.clientHeight / window.innerHeight;
    var transform = "scale(" + (1/Math.max(sx, sy)) + ")";
    db.style.transform = transform;
    db.style.marginTop = -db.clientHeight / 2 + "px";
    db.style.marginLeft = -db.clientWidth / 2 + "px";
  }


  Dz.getNotes = function(aIdx) {
    var s = $("section:nth-of-type(" + aIdx + ")");
    var d = s.$("[role='note']");
    return d ? d.innerHTML : "";
  }

  Dz.getVideos = function(aIdx) {
    var s = $("section:nth-of-type(" + aIdx + ")");
    var v = s.$$("video");
    return v.length;
  }

  Dz.onmessage = function(aEvent) {
    var argv = aEvent.data.split(" "), argc = argv.length;
    console.log('template got:'+aEvent.data); //DEBUG
    argv.forEach(function(e, i, a) { a[i] = decodeURIComponent(e) });
    var win = aEvent.source;
    if (argv[0] === "REGISTER" && argc === 1) {
      this.remoteWindows.push(win);
      this.postMsg(win, "REGISTERED", document.title, this.slides.length);
      this.postMsg(win, "CURSOR", this.idx + "." + this.step);
      return;
    }
    if (argv[0] === "BACK" && argc === 1)
      this.back();
    if (argv[0] === "FORWARD" && argc === 1)
      this.forward();
    if (argv[0] === "START" && argc === 1)
      this.goStart();
    if (argv[0] === "END" && argc === 1)
      this.goEnd();
    if (argv[0] === "TOGGLE_CONTENT" && argc === 1)
      this.toggleContent();
    if (argv[0] === "TOGGLEVID" && argc === 2)
      this.toggleVideo(argv[1]);
    if (argv[0] === "SET_CURSOR" && argc === 2)
      window.location.hash = "#" + argv[1];
    if (argv[0] === "GET_CURSOR" && argc === 1)
      this.postMsg(win, "CURSOR", this.idx + "." + this.step);
    if (argv[0] === "GET_NOTES" && argc === 1)
      this.postMsg(win, "NOTES", this.getNotes(this.idx));
    if (argv[0] === "GET_VIDEOS" && argc === 1)
      this.postMsg(win, "VIDEOS", this.getVideos(this.idx));
  }

  Dz.toggleVideo = function(num) {
    var s = $("section[aria-selected]");
    if (s) {
      var video = s.$$("video");
      var selectedvid = video[num]
      if (selectedvid) {
        if (selectedvid.ended || selectedvid.paused) {
          selectedvid.play();
        } else {
          selectedvid.pause();
        }
      }
    }
  }

  Dz.toggleContent = function() {
    var s = $("section[aria-selected]");
    if (s) {
      var videos = s.$$("video");
      if (videos) {
        $$.forEach(videos,
        function(v){
            if (v.ended || v.paused) {
              v.play();
            } else {
              v.pause();
            }
        });
      }
    }
  }

  Dz.setCursor = function(aIdx, aStep) {
    // If the user change the slide number in the URL bar, jump
    // to this slide.
    aStep = (aStep != 0 && typeof aStep !== "undefined") ? "." + aStep : ".0";
    window.location.hash = "#" + aIdx + aStep;
  }

  Dz.onhashchange = function() {
    var cursor = window.location.hash.split("#"),
        newidx = 1,
        newstep = 0;
    if (cursor.length == 2) {
      newidx = ~~cursor[1].split(".")[0];
      newstep = ~~cursor[1].split(".")[1];
      if (newstep > Dz.slides[newidx - 1].$$('.next').length) {
        newstep = 0;
        newidx++;
      }
    }
    this.setProgress(newidx, newstep);
    if (newidx != this.idx) {
      this.setSlide(newidx);
    }
    //if (newstep != this.step) {
    this.setIncremental(newstep);
    //}
    for (var i = 0; i < this.remoteWindows.length; i++) {
      this.postMsg(this.remoteWindows[i], "CURSOR", this.idx + "." + this.step);
    }
  }

  Dz.back = function() {
    if (this.idx == 1) { //reached first slide
      return;
    }
    if ( this.step == 0 )  {
        this.setCursor(this.idx - 1,
                         this.slides[this.idx - 2].$$('.next').length);
    } else {
    this.setCursor(this.idx,
                     this.step - 1);
                     // goes back to last next of prev slide and not last active next
                     // this prevents unseen item to not be there when going back
                     // this.slides[this.idx - 2].$$('.next[active]').length);
    }
  }

  Dz.forward = function() {
    if (this.idx >= this.slides.length && //if reached end
        this.step >= this.slides[this.idx - 1].$$('.next').length) {
        console.log('end of slides..')
        return;
    }
    if (this.html.classList.contains("view") ||
        this.step >= this.slides[this.idx - 1].$$('.next').length) {
      this.setCursor(this.idx + 1,
                     this.slides[this.idx].$$('.next[active]').length);
    } else {
      this.setCursor(this.idx, this.step + 1);
    }
  }

  Dz.goStart = function() {
    this.setCursor(1, 0);
  }

  Dz.goEnd = function() {
    var lastIdx = this.slides.length;
    var lastStep = this.slides[lastIdx - 1].$$('.next').length;
    this.setCursor(lastIdx, lastStep);
  }

  Dz.toggleView = function() {
    this.html.classList.toggle("view");

    if (this.html.classList.contains("view")) {
      $("section[aria-selected]").scrollIntoView(true);
    }
  }

  Dz.setSlide = function(aIdx) {
    this.idx = aIdx;
    var old = $("section[aria-selected]");
    var next = $("section:nth-of-type("+ this.idx +")");
    // If a Video is present in this new slide, play it.
    // If a Video is present in the previous slide, stop it.
    if (old) {
      old.removeAttribute("aria-selected");
      var videos = old.$$("video");
      if (videos) {
        $$.forEach(videos,
        function(v){
          v.pause();
        });
      }
    }
    if (next) {
      next.setAttribute("aria-selected", "true");
      if (this.html.classList.contains("view")) {
        next.scrollIntoView();
      } else {
        var videos = next.$$("video");
        if (videos && !!+this.params.autoplay) {
          $$.forEach(videos,
          function(v){
            v.play();
          });
        }
      }
    } else {
      // That should not happen
      this.idx = -1;
      // console.warn("Slide doesn't exist.");
    }
  }

  Dz.setIncremental = function(aStep) {
    this.step = aStep;
    if (!this.slides[this.idx - 1]) return; //if no more slides return
    var incrementals = Array.prototype.slice.call(this.slides[this.idx - 1].$$('.next')).sort(function(a, b) {
            return Number(a.getAttribute('next-order')) - Number(b.getAttribute('next-order'));
          });
    //console.log(incrementals)
    /*
    var next = incrementals[this.step - 1];
    var prev = incrementals[this.step];
    console.log("step:"+aStep+" old:"+oldStep);
    if (next && aStep > oldStep) { //go forward in steps
      next.setAttribute('active', true);
      if (aStep - oldStep > 1) { // check if step is more than 1, in that case
        var i;                   // activates all intermediate steps to keep logic of slides
        for (i = 0; i < this.step - 1; i++) {
          var interIncrementals = incrementals[i];
          interIncrementals.setAttribute('active', true);
        }
      }
    }
    else if (prev && aStep < oldStep) { //go backwards in steps only if didnt change slide
      prev.removeAttribute('active');
      if ( oldStep - aStep > 1) { // check if step is more than 1, in that case
        var i;                   // deactivates all intermediate steps to keep logic of slides
        console.log(oldStep - aStep)
        for (i = oldStep; i > aStep ; i--) {
          var interIncrementals = incrementals[i - 1];
          interIncrementals.removeAttribute('active');
        }
      }
    } else {
      this.setCursor(this.idx, 0);
    }
    return next;*/
    for (i = 0; i < incrementals.length ; i++) {
      var interIncrementals = incrementals[i];
      if (i < aStep) {
        interIncrementals.setAttribute('active', true);
      } else {
        interIncrementals.removeAttribute('active');
      }
    }
  }

  Dz.goFullscreen = function() {
    var html = $('html'),
        requestFullscreen = html.requestFullscreen || html.requestFullScreen || html.mozRequestFullScreen || html.webkitRequestFullScreen;
    if (requestFullscreen) {
      requestFullscreen.apply(html);
    }
  }

  Dz.setProgress = function(aIdx, aStep) {
    var slide = $("section:nth-of-type("+ aIdx +")");
    if (!slide)
      return;
    var steps = slide.$$('.next').length + 1,
        slideSize = 100 / (this.slides.length - 1),
        stepSize = slideSize / steps;
    this.progressBar.style.width = ((aIdx - 1) * slideSize + aStep * stepSize) + '%';
  }

  Dz.postMsg = function(aWin, aMsg) { // [arg0, [arg1...]]
    aMsg = [aMsg];
    for (var i = 2; i < arguments.length; i++)
      aMsg.push(encodeURIComponent(arguments[i]));
    aWin.postMessage(aMsg.join(" "), "*");
  }

  function init() {
    Dz.init();
    window.onkeydown = Dz.onkeydown.bind(Dz);
    window.onresize = Dz.onresize.bind(Dz);
    window.onhashchange = Dz.onhashchange.bind(Dz);
    window.onmessage = Dz.onmessage.bind(Dz);

    //setup video players with plyr.io
    const players = Plyr.setup('.js-player');
    //videoSync(players);
  }

/* stuff to play around ? */
  // function videoSync(players) {
  //     players.forEach( function(elt) {
  //           elt.on('play', event => {
  //               console.log(event.detail.plyr);
  //               console.log("dffdfgdfg");
  //               console.log(event.srcElement);
  //
  //       });
  //   });
  // }

  window.onload = init;

  // Helpers
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {

      // closest thing possible to the ECMAScript 5 internal IsCallable
      // function
      if (typeof this !== "function")
      throw new TypeError(
        "Function.prototype.bind - what is trying to be fBound is not callable"
      );

      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP = function () {},
          fBound = function () {
            return fToBind.apply( this instanceof fNOP ? this : oThis || window,
                   aArgs.concat(Array.prototype.slice.call(arguments)));
          };

      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();

      return fBound;
    };
  }

  var $ = (HTMLElement.prototype.$ = function(aQuery) {
    return this.querySelector(aQuery);
  }).bind(document);

  var $$ = (HTMLElement.prototype.$$ = function(aQuery) {
    return this.querySelectorAll(aQuery);
  }).bind(document);

  $$.forEach = function(nodeList, fun) {
    Array.prototype.forEach.call(nodeList, fun);
  }
