
// <!-- {{{{ d6slides core
// #
// #
// #     __     __       .  __   ___  __
// #    |  \   /__` |    | |  \ |__  /__`
// #    |__/ 6 .__/ |___ | |__/ |___ .__/ core 
// #
// # An ES6 rework of dzslides
// #
// # The following block of code is not supposed to be edited.
// # unless you want to change the behavior of the slides.
// #
// -->
// import Plyr from '../plyr/plyr.min.js'

class D6Slides {
    constructor() {
        this.remoteWindows = [],
        this.idx = -1,
        this.step = 0,
        this.html = null,
        this.slides = null,
        this.progressBar = null,
        this.params = {
          autoplay: "1"
        }
        this.init()
    }

    init() {
        document.getElementById('slides').className = "loaded"
        this.slides = Array.prototype.slice.call($$("#slides > section"))
        this.progressBar = $("#progress-bar")
        this.html = document.getElementById('viewport')
        //this.html = document.body.parentNode
        this.setupParams()
        this.onHashChange()
        this.setupTouchEvents()
        this.onResize()
        this.setupView()
    }

    setupParams() {
        const p = window.location.search.substr(1).split('&')
        p.forEach((e, i, a) => {
            let keyVal = e.split('=')
            this.params[keyVal[0]] = decodeURIComponent(keyVal[1])
        })
        // Specific params handling
        if (!this.params.autoplay) {
            $$("video").forEach((v) => { v.controls = true })
        }
    }


    onKeyDown(aEvent) {
        // Don't intercept keyboard shortcuts
        if (aEvent.altKey 
            || aEvent.ctrlKey
            || aEvent.metaKey
            || aEvent.shiftKey) {
            return
        }
        else if ( aEvent.keyCode == 37 // left arrow
            || aEvent.keyCode == 38 // up arrow
            || aEvent.keyCode == 33) { //page up
            aEvent.preventDefault()
            this.back()
        }
        else if ( aEvent.keyCode == 39 // right arrow
            || aEvent.keyCode == 40 // down arrow
            || aEvent.keyCode == 34) { // page down
            aEvent.preventDefault()
            this.forward()
        }
        else if (aEvent.keyCode == 35) { // end
            aEvent.preventDefault()
            this.goEnd()
        }
        else if (aEvent.keyCode == 36) { // home
           aEvent.preventDefault()
            this.goStart()
        }
        else if (aEvent.keyCode == 32) { // space
            aEvent.preventDefault()
            this.toggleContent()
        }
        else if (aEvent.keyCode == 70) { // f
            aEvent.preventDefault()
            this.goFullscreen()
        }
        else if (aEvent.keyCode == 79    //o
           || aEvent.keyCode == 27) {   //Esc
            aEvent.preventDefault()
            this.toggleView()
        }
    }

  /* Touch Events */
    setupTouchEvents() {
        let orgX, newX
        let tracking = false

        let start = (aEvent) => {
          aEvent.preventDefault()
          tracking = true
          orgX = aEvent.changedTouches[0].pageX
        }

        let move = (aEvent) => {
          if (!tracking) return
          newX = aEvent.changedTouches[0].pageX
          if (orgX - newX > 100) {
            tracking = false
            this.forward()
          } else {
            if (orgX - newX < -100) {
              tracking = false
              this.back()
            }
          }
        }
        document.body.addEventListener("touchstart", start, false)
        document.body.addEventListener("touchmove", move, false)
    }

    setupView() {
        document.body.addEventListener("click", (e) => {
            if (!this.html.classList.contains("view")) return
            if (!e.target || e.target.nodeName != "SECTION") return

            this.html.classList.remove("view")
            this.setCursor(this.slides.indexOf(e.target) + 1)
        }, false)
    }

  /* Adapt the size of the slides to the window */

    onResize() {
        const sx = document.getElementById('slides').clientWidth / window.innerWidth
        const sy = document.getElementById('slides').clientHeight / window.innerHeight
        const transform = "scale(" + (1/Math.max(sx, sy)) + ")"
        document.getElementById('slides').style.transform = transform
        document.getElementById('slides').style.marginTop = -document.getElementById('slides').clientHeight / 2 + "px"
        document.getElementById('slides').style.marginLeft = -document.getElementById('slides').clientWidth / 2 + "px"
    }

    getNotes(aIdx) {
        const s = $("section:nth-of-type(" + aIdx + ")")
        const d = s.$("[role='note']")
        return d ? d.innerHTML : ""
    }

    getVideos(aIdx) {
        const s = $("section:nth-of-type(" + aIdx + ")")
        const v = s.$$("video")
        return v.length
    }

    onMessage(aEvent) {
        let argv = aEvent.data.split(" ")
        let argc = argv.length
        console.log('template got:'+aEvent.data) //DEBUG
        argv.forEach((e, i, a) => { a[i] = decodeURIComponent(e) })
        const win = aEvent.source
        if (argv[0] === "REGISTER" && argc === 1) {
            this.remoteWindows.push(win)
            this.postMsg(win, "REGISTERED", document.title, this.slides.length)
            this.postMsg(win, "CURSOR", this.idx + "." + this.step)
        }
        else if (argv[0] === "BACK" && argc === 1)
            this.back()
        else if (argv[0] === "FORWARD" && argc === 1)
            this.forward()
        else if (argv[0] === "START" && argc === 1)
            this.goStart()
        else if (argv[0] === "END" && argc === 1)
            this.goEnd()
        else if (argv[0] === "TOGGLE_CONTENT" && argc === 1)
            this.toggleContent()
        else if (argv[0] === "TOGGLEVID" && argc === 2)
            this.toggleVideo(argv[1])
        else if (argv[0] === "SET_CURSOR" && argc === 2)
            window.location.hash = "#" + argv[1]
        else if (argv[0] === "GET_CURSOR" && argc === 1)
            this.postMsg(win, "CURSOR", this.idx + "." + this.step)
        else if (argv[0] === "GET_NOTES" && argc === 1)
            this.postMsg(win, "NOTES", this.getNotes(this.idx))
        else if (argv[0] === "GET_VIDEOS" && argc === 1)
            this.postMsg(win, "VIDEOS", this.getVideos(this.idx))
    }

    toggleVideo(num) {
        try {
            const s = $("section[aria-selected]")
            const selectedvid = s.$$("video")[num]
            console.log('selectedvid', selectedvid) //TODO TEST
            if (selectedvid.ended || selectedvid.paused) {
                selectedvid.play()
            } else {
                selectedvid.pause()
            }
        } catch (e) {
            console.log(e)
        }
    }

    toggleContent() {
        try {
            const s = $("section[aria-selected]")
            const videos = s.$$("video")
            videos.forEach((v) => {
                if (v.ended || v.paused) {
                    v.play()
                } else {
                    v.pause()
                }
            })
        } catch (e) {
            console.error(e)
        }
    }

    setCursor(aIdx, aStep) {
        // If the user change the slide number in the URL bar, jump
        // to this slide.
        aStep = (aStep != 0 && typeof aStep !== "undefined") ? "." + aStep : ".0"
        window.location.hash = "#" + aIdx + aStep
    }

    onHashChange() {
        let cursor = window.location.hash.split("#")
        let newidx = 1
        let newstep = 0
        if (cursor.length == 2) {
            try {
                newidx = ~~cursor[1].split(".")[0]
                newstep = ~~cursor[1].split(".")[1]
                if (newstep > this.slides[newidx - 1].$$('.next').length) {
                    newstep = 0
                    newidx++
                }
            } catch (e) {
                console.log(e)
            }
        }
        this.setProgress(newidx, newstep)
        if (newidx != this.idx) {
            this.setSlide(newidx)
        }
        this.setIncremental(newstep)
        for (let i = 0; i < this.remoteWindows.length; i++) {
            this.postMsg(this.remoteWindows[i], "CURSOR", this.idx + "." + this.step)
        }
    }

    back() {
        if (this.idx == 1) { //reached first slide
            return
        }
        if ( this.step == 0 )  {
            this.setCursor(this.idx - 1, this.slides[this.idx - 2].$$('.next').length)
        } else {
            this.setCursor(this.idx, this.step - 1)
            // goes back to last next of prev slide and not last active next
            // this prevents unseen item to not be there when going back
            // this.slides[this.idx - 2].$$('.next[active]').length)
        }
    }

    forward() {
        if (this.idx >= this.slides.length && //if reached end
            this.step >= this.slides[this.idx - 1].$$('.next').length) {
            console.log('end of slides..')
            return
        }
        if (this.html.classList.contains("view") ||
            this.step >= this.slides[this.idx - 1].$$('.next').length) {
            this.setCursor(this.idx + 1, this.slides[this.idx].$$('.next[active]').length)
        } else {
            this.setCursor(this.idx, this.step + 1)
        }
    }

    goStart() {
        this.setCursor(1, 0)
    }

    goEnd() {
        let lastIdx = this.slides.length
        let lastStep = this.slides[lastIdx - 1].$$('.next').length
        this.setCursor(lastIdx, lastStep)
  }

    toggleView() {
        this.html.classList.toggle("view")
        if (this.html.classList.contains("view")) {
            $("section[aria-selected]").scrollIntoView(true)
        }
    }

    setSlide(aIdx) {
        this.idx = aIdx
        const old = $("section[aria-selected]")
        const next = $("section:nth-of-type("+ this.idx +")")
        // If a Video is present in this new slide, play it.
        // If a Video is present in the previous slide, stop it.
        try {
            old.removeAttribute("aria-selected")
            old.$$("video").forEach((v) => {
                    v.pause() 
                })
        } catch (e) {
            if (!(e instanceof TypeError) && old !== null) {
                console.log(e)    
            }   
        }
        try {
            next.setAttribute("aria-selected", "true")
            if (this.html.classList.contains("view")) {
                next.scrollIntoView()
            } else {
                if (!!this.params.autoplay) {
                    next.$$("video").forEach((v) => {
                        v.play() 
                    })
                }
            }
        } catch (e) {
          // That should not happen
          this.idx = -1
          console.warn("Slide doesn't exist.", e)
        }
    }

    setIncremental(aStep) {
        this.step = aStep
        if (!this.slides[this.idx - 1]) return //if no more slides return
        const incrementals = Array.prototype.slice.call(this.slides[this.idx - 1].$$('.next')).sort((a, b) => {
                return Number(a.getAttribute('next-order')) - Number(b.getAttribute('next-order'))
            })
        for (let i = 0; i < incrementals.length ; i++) {
            let interIncrementals = incrementals[i]
            if (i < aStep) {
                interIncrementals.setAttribute('active', true)
            } else {
                interIncrementals.removeAttribute('active')
            }
        }
    }

    goFullscreen() {
        const html = $('html')
        const requestFullscreen = html.requestFullscreen || html.requestFullScreen 
            || html.mozRequestFullScreen || html.webkitRequestFullScreen
        if (requestFullscreen) {
          requestFullscreen.apply(html)
        }
    }

    setProgress(aIdx, aStep) {
        const slide = $("section:nth-of-type("+ aIdx +")")
        if (!slide)
          return
        const steps = slide.$$('.next').length + 1
        const slideSize = 100 / (this.slides.length - 1)
        const stepSize = slideSize / steps
        this.progressBar.style.width = ((aIdx - 1) * slideSize + aStep * stepSize) + '%'
      }

    postMsg(aWin, aMsg) { // [arg0, [arg1...]]
        aMsg = [aMsg]
        for (let i = 2; i < arguments.length; i++) {
            aMsg.push(encodeURIComponent(arguments[i]))
        }
        aWin.postMessage(aMsg.join(" "), "*")
    }
} //D6Slides class

function init() {
    const D6 = new D6Slides()
    window.onkeydown = D6.onKeyDown.bind(D6)
    window.onresize = D6.onResize.bind(D6)
    window.onhashchange = D6.onHashChange.bind(D6)
    window.onmessage = D6.onMessage.bind(D6)

    //setup video players with plyr.io
    const players = Plyr.setup('.js-player')
    //videoSync(players)
}
document.addEventListener("DOMContentLoaded", init);

// Helpers
const $ = (HTMLElement.prototype.$ = function(aQuery) {
            return this.querySelector(aQuery)
        }).bind(document)

const $$ = (HTMLElement.prototype.$$ = function(aQuery) {
            return this.querySelectorAll(aQuery)
        }).bind(document)

