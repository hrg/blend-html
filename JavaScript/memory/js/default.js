var decks = [
   { name: 'salta, argentina', dir: 'Argentina', thumbnail: '/photos/Argentina/17.jpg' },
   { name: 'china street food', dir: 'China', thumbnail: '/photos/China/21.jpg' },
   { name: 'india: jaipur to agra', dir: 'India', thumbnail: '/photos/India/03.jpg' },
   { name: 'yucatan, mexico', dir: 'Mexico', thumbnail: '/photos/Mexico/07.jpg' },
   { name: 'zoo animals', dir: 'Zoo', thumbnail: '/photos/Zoo/14.jpg' }
];

var MemoryApp = (function () {
   'use strict';
   var size = 16;
   var sizeStyle = "smallGame";
   var maxpics = 32;
   var gameRunning = false;
   var cardOpen = null;
   var time = 0;
   var timer;
   var s4;
   var s6;
   var s8;
   var attempts = 0;
   var found = 0;
   var foundDisp;
   var attDisp;
   var timeDisp;
   var template;
   var popupImage;
   var popupHolder;
   var gameGrid;
   var currentCardSet = 'zoo';
   var currentCards = [];

   function activated() {
      WinJS.UI.processAll().then(function(){
         s4 = document.getElementById("size4x4");
         s6 = document.getElementById("size6x6");
         s8 = document.getElementById("size8x8");
         s4.addEventListener("click", gameSize, false);
         s6.addEventListener("click", gameSize, false);
         s8.addEventListener("click", gameSize, false);

         var deckList = document.querySelector('#deckList');
         var selectDeckButton = document.querySelector('#selectCards');
         selectDeckButton.addEventListener('click', showDeckSelector);

         var start = document.getElementById("startGame");
         if (start) {
            start.onclick = runGame;
         }
         var stop = document.getElementById("stopGame");
         if (stop) {
            stop.onclick = stopGame;
         }

         template = document.getElementById("cardTemplate");

         popupImage = document.getElementById("popupImage");
         popupHolder = document.getElementById("popupHolder");
         popupHolder.addEventListener("click", closeImageView, false);

         foundDisp = document.getElementById("foundDisplay");
         attDisp = document.getElementById("attemptsDisplay");
         timeDisp = document.getElementById("timeDisplay");

         // Expose functions globally
         window.updateClock = updateClock;
         window.resetCards = resetCards;
         window.gameTag1 = null;
         window.gameTag2 = null;

         buildCards();
      });
   }

   function closeImageView() {
      removeClass(popupHolder, "openImagePopup");
   }

   function makePictureArray() {
      var pics = new Array();
      for (var i = 0; i < maxpics; i++) {
         pics[i] = getDefaultURL(i);
      }
      return pics;
   }

   function removeAllChildren(element) {
      if (element.hasChildNodes()) {
         while (element.childNodes.length > 0) {
            element.removeChild(element.firstChild);
         }
      }
   }

   function buildCards() {
   // Assumption: game grid size is a power of 2
      var stride = Math.sqrt(size);

      // Make picture selection
      var pics = makePictureArray();
      var sel = new Array();
      for (var i = 0; i < size / 2; i++) {
         var idx = parseInt(Math.random() * pics.length);
         sel[i] = pics[idx];
         // remove the used pic
         pics.splice(idx, 1);
      }

      // get an array with the card content
      var content = new Array();
      for (var i = 0; i < size / 2; i++) {
         content[i] = sel[i];
         content[i + size / 2] = sel[i];
      }

      var gameBoard = document.querySelector('#gameBoard');
      removeAllChildren(gameBoard);
      var gameGrid = document.createElement("div");
      gameGrid.id = "gameGrid";
      addClass(gameGrid, sizeStyle);
      gameBoard.appendChild(gameGrid);

      for (var i=0; i<size; i++) {
         var item = document.createElement("div");
         item.className = "gameItem";
         item.addEventListener("click", cardClicked, false);
         setClosed(item);

         var r = parseInt(Math.random() * content.length);

         // Add image
         insertTemplate(item, template);
         var walker = document.createTreeWalker(item, NodeFilter.SHOW_ELEMENT, imgFilter, false);
         while (walker.nextNode())
            walker.currentNode.setAttribute("src", content[r]);
      
         // Add path to ease styling
         var walker = document.createTreeWalker(item, NodeFilter.SHOW_ELEMENT, pFilter, false);
         while (walker.nextNode())
            walker.currentNode.innerText = content[r];

         item.contentIndex = content[r];
         content.splice(r, 1);
         gameGrid.appendChild(item);
      }
   }

   function imgFilter(node) {
      if (node.tagName == "IMG") //filter IMG elements
         return NodeFilter.FILTER_ACCEPT
      else
         return NodeFilter.FILTER_SKIP
   }

   function pFilter(node) {
      if (node.tagName == "P") //filter IMG elements
            return NodeFilter.FILTER_ACCEPT
         else
            return NodeFilter.FILTER_SKIP
   }

   function insertTemplate(parent, templateParent) {
      if (templateParent.children && templateParent.children.length >= 1) {
         var tchild = templateParent.children[0].cloneNode(true);
         parent.appendChild(tchild);
      } 
   }

   function gameSize() {
      document.size.size4x4.checked = false;
      document.size.size6x6.checked = false;
      document.size.size8x8.checked = false;

      var newsize = 16;
      var gSize = "smallGame";
         if (this.name == "size4x4") {
            document.size.size4x4.checked = true;
            newsize = 16;
         gSize = "smallGame";
      }
      if (this.name == "size6x6") {
         document.size.size6x6.checked = true;
         newsize = 36;
         gSize = "mediumGame";
      }
      if (this.name == "size8x8") {
         document.size.size8x8.checked = true;
         newsize = 64;
         gSize = "largeGame";
      }
      if (!gameRunning == true) {
         size = newsize;
         sizeStyle = gSize;
         buildCards();
      }
   }
   
   function stopGame() {
      if (!gameRunning)
         return;
      gameRunning = false;
      foundDisp.innerText = "0";
      found = 0;
      attDisp.innerText = "0";
      attempts = 0;
      clearInterval(timer);
      timeDisp.innerText = "00:00";
      s4.disabled = false;
      s6.disabled = false;
      s8.disabled = false;
   }

   function runGame() {
      //don't do anything if game already running
      if (gameRunning == true)
         return;
      window.gameTag1 = null;
      window.gameTag2 = null;
      cardOpen = null;
      gameRunning = true;
      buildCards();
      timeDisp.innerText = "00:00";
      time = 0;
      foundDisp.innerText = "0";
      found = 0;
      attDisp.innerText = "0";
      attempts = 0;
      timer = setInterval("updateClock()", 1000);
      s4.disabled = true;
      s6.disabled = true;
      s8.disabled = true;
   }

   function getDefaultURL(i) {
      var idx = i+1;
      if (idx<1)
         idx = 1;
      if (idx>32)
         idx = 32;
      var result = "/photos/" + currentCardSet + "/";
      if (idx < 10)
         result = result + "0";
      result = result + idx.toString() + ".jpg";
      return result;
   }

   function updateClock() {
      time = time + 1;
      var mins = parseInt(time / 60);
      var secs = time - mins * 60;

      mins = mins.toString();
      secs = secs.toString();

      if (mins.length < 2)
         mins = "0" + mins;
      if (secs.length < 2)
         secs = "0" + secs;

      timeDisp.innerText = mins + ":" + secs;
   }

   function cardClicked() {

      // If an open card is clicked, bring up the full size popup
      if (this.cardFoundFlag || cardOpen === this) {
         popupImage.setAttribute("src", this.contentIndex);
         popupHolder.style.display = "block";
         addClass(popupHolder, "openImagePopup");
         return;
      }

      // don't do anything if no game is running, or a move is in play...
      if (!gameRunning || window.gameTag1 !=null || window.gameTag2 != null)
         return;
      
      if (cardOpen == null) {
         setOpen(this);
         cardOpen = this;
      } else {
         if (this.contentIndex == cardOpen.contentIndex) {
            setFound(this);
            setFound(cardOpen);
            this.cardFoundFlag = true;
            cardOpen.cardFoundFlag = true;
            cardOpen = null;
            found++;
            foundDisp.innerText = found;
            updateAttempts();
            if (found == size / 2) {
               gameRunning = false;
               clearInterval(timer);
               foundDisp.innerText = "ALL!";
            }
         } else {
            setOpen(this);
            // Hack to get around insulation of these functions
            window.gameTag1 = this;
            window.gameTag2 = cardOpen;
            setTimeout("resetCards()", 1100);
            cardOpen = null;
            updateAttempts();
         }
      }
   }

   function setOpen(el) {
      removeClass(el, "closedCard");
      addClass(el, "openCard");
   }

   function setClosed(el) {
      removeClass(el, "openCard");
      addClass(el, "closedCard");
   }

   function setFound(el) {
      removeClass(el, "openCard");
      removeClass(el, "closedCard");
      addClass(el, "foundCard");
   }

   function resetCardStyles(el) {
         removeClass(el, "openCard");
         removeClass(el, "foundCard");
         addClass(el, "closedCard");
   }

   function updateAttempts() {
         attempts++;
         attDisp.innerText = attempts;
   }

   function resetAllCards() {
         buildCards();
   }

   function resetCards() {
      setClosed(window.gameTag1);
      setClosed(window.gameTag2);
      window.gameTag1 = null;
      window.gameTag2 = null;
   }

   function showDeckSelector() {
      var deckSelectorFlyout = document.querySelector('#deckSelectionFlyout');
      removeClass(deckSelectorFlyout, 'hidden');
      addClass(deckSelectorFlyout, 'shown');
   }

   function deckSelected(eventObject) {
      var deckSelectorFlyout = document.querySelector('#deckSelectionFlyout');
      var deckIndex = eventObject.detail.itemIndex;
      if ( deckIndex < 0 || deckIndex >= window.decks.length) {
         removeClass(deckSelectorFlyout, 'shown');
         addClass(deckSelectorFlyout, 'hidden');
            return;
      }
      var deck = window.decks[deckIndex];
      currentCardSet = deck.dir;
      buildCards();
      removeClass(deckSelectorFlyout, 'shown');
      addClass(deckSelectorFlyout, 'hidden');
   }

   function loadCardsFromDeck(deckName) {
      for (var i = 0; i < 32; i++) {
         var path = '/photos/' + deckName + '/';
         if (i < 10) {
            path = path + '0';
         }
         path = path + i + '.jpg';
         currentCards[i] = path;
      }
      var deckSelectorFlyout = document.querySelector('#deckSelectionFlyout');
      removeClass(deckSelectorFlyout, 'shown');
      addClass(deckSelectorFlyout, 'hidden');
   }

   //////////////////////////////////////////////////////////////////////////////////////////////////////
   // Utilities
   //
   //////////////////////////////////////////////////////////////////////////////////////////////////////
   function hasClass(el, className) {
      // authors can pass in either an element object or an ID
      el = (typeof (el) == 'object') ? el : document.getElementById(el);

      // no need to continue if there's no className
      if (!el.className) return false;

      // iterate through all the classes
      var classArray = el.className.split(' ');
      for (var i = 0; i < classArray.length; i++) {
         if (className == classArray[i]) return true; // found? return true
      }

      // if we're still here, the class does not exist
      return false;
   }

   function addClass(el, className) {
      // authors can pass in either an element object or an ID
      el = (typeof (el) == 'object') ? el : document.getElementById(el);

      // simply append the className to the string
      el.className += ' ' + className;
      return;
   }

   function removeClass(el, className) {
      // authors can pass in either an element object or an ID
      el = (typeof (el) == 'object') ? el : document.getElementById(el);

      // if the class doesn't exist, there's no need to remove it
      if (!hasClass(el, className)) return;

      // iterate through all the classes
      var classArray = el.className.split(' ');
      for (var i = 0; i < classArray.length; i++) {

         // found it!
         if (className == classArray[i]) {
            classArray.splice(i, 1); // remove it
            i--; // decrement so we don't skip over any future occurences
         }
      }

      // reassign the className
      el.className = classArray.join(' ');
      return;
   }

   WinJS.Application.onactivated = function (e) {
      if (e.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
         activated();
      }
   }

   WinJS.Application.start();
});

var theMemoryApp = new MemoryApp();