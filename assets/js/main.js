(function(w,d) {

	var $animationWrapper = $(".animation-wrapper");


	var onLoadWidth = getClientWidth();
	var canvasSizeRatio = getCanvasSizeRatio();

	function getClientWidth() {
		return w.innerWidth
				|| d.documentElement.clientWidth
				|| d.body.clientWidth;
	}

	function getClientHeight() {
		return w.innerHeight
				|| d.documentElement.clientHeight
				|| d.body.clientHeight;
	}

	function getCanvasSizeRatio() {
		var stickyWrapper = $animationWrapper.find('.sticky-wrapper');

		var stickyWrapperHeight = stickyWrapper.height();
		var clientHeight = getClientHeight();

		return stickyWrapperHeight / clientHeight;
	}

	/**
	 * By Ken Fyrstenberg Nilsen
	 *
	 * drawImageProp(context, image [, x, y, width, height [,offsetX, offsetY]])
	 *
	 * If image and context are only arguments rectangle will equal canvas
	*/
	function drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {

	    if (arguments.length === 2) {
	        x = y = 0;
	        w = ctx.canvas.width;
	        h = ctx.canvas.height;
	    }

	    // default offset is center
	    offsetX = typeof offsetX === "number" ? offsetX : 0.5;
	    offsetY = typeof offsetY === "number" ? offsetY : 0.5;

	    // keep bounds [0.0, 1.0]
	    if (offsetX < 0) offsetX = 0;
	    if (offsetY < 0) offsetY = 0;
	    if (offsetX > 1) offsetX = 1;
	    if (offsetY > 1) offsetY = 1;

	    var iw = img.width,
	        ih = img.height,
	        r = Math.min(w / iw, h / ih),
	        nw = iw * r,   // new prop. width
	        nh = ih * r,   // new prop. height
	        cx, cy, cw, ch, ar = 1;

	    // decide which gap to fill    
	    if (nw < w) ar = w / nw;                             
	    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
	    nw *= ar;
	    nh *= ar;

	    // calc source rectangle
	    cw = iw / (nw / w);
	    ch = ih / (nh / h);

	    cx = (iw - cw) * offsetX;
	    cy = (ih - ch) * offsetY;

	    // make sure source rectangle is valid
	    if (cx < 0) cx = 0;
	    if (cy < 0) cy = 0;
	    if (cw > iw) cw = iw;
	    if (ch > ih) ch = ih;

	    // fill image in dest. rectangle
	    ctx.drawImage(img, cx, cy, cw, ch,  x, y, w, h);
	}

	var waitForFinalEvent = (function () {
	  var timers = {};
	  return function (callback, ms, uniqueId) {
	    if (!uniqueId) {
	      uniqueId = "Don't call this twice without a uniqueId";
	    }
	    if (timers[uniqueId]) {
	      clearTimeout (timers[uniqueId]);
	    }
	    timers[uniqueId] = setTimeout(callback, ms);
	  };
	})();

	function resizeVideo () {
		var $videoWrapper = $animationWrapper.find('.video-wrapper');
		// var resizedWidth = getClientWidth();
		// var adjustmentAmount = resizedWidth / onLoadWidth;

		// console.log("adjustment amount: ", adjustmentAmount);

		var scaleValue = "0.980282, 0.980282";

		$videoWrapper.css({
		  '-webkit-transform' : 'scale(' + scaleValue + ') translate3d(0px, -50%, 0px)',
		  '-moz-transform'    : 'scale(' + scaleValue + ') translate3d(0px, -50%, 0px)',
		  '-ms-transform'     : 'scale(' + scaleValue + ') translate3d(0px, -50%, 0px)',
		  '-o-transform'      : 'scale(' + scaleValue + ') translate3d(0px, -50%, 0px)',
		  'transform'         : 'scale(' + scaleValue + ') translate3d(0px, -50%, 0px)'
		});

	};

	function canvasImageLoader(container) {
		var _this = this;
		var $wrapper = container.find('.video-wrapper');
		var $canvas = container.find('canvas');
		var canvas = $canvas[0];
		var currLayerPos = 0;

		if (canvas == null || typeof canvas === 'undefined') {
			return;
		}

		canvas.setAttribute("width", $wrapper.outerWidth());
		canvas.setAttribute("height", $wrapper.outerHeight());

		_this.rotateOnScroll = false;
		_this.document = $(d);
		_this.images = [];
		_this.layers = [];
		_this.canvas = canvas;
		_this.context = canvas.getContext("2d");
		_this.activeLayer;
		_this.initOffset = $canvas.offset().top;
		_this.scrollOffset = 50;

		function handleScroll(e) {
			var self = _this;
			var target = e.target;
			var $target = $(target);
			var docScrollTop = self.document.scrollTop();


			if (docScrollTop > (self.initOffset + self.scrollOffset)) {
				self.rotateOnScroll = false;
			}
			else if ($target.is('canvas') || $target.closest('canvas').length == 1)
		    {
		        self.rotateOnScroll = true;
		    }

			if (e.wheelDelta < 0 || e.detail < 0) {
				currLayerPos++;

				if (currLayerPos > self.layers.length) {
					currLayerPos = self.layers.length;
				}

				if (currLayerPos === self.layers.length) {
					self.rotateOnScroll = false;
				}

				self.actions.goToFrame(currLayerPos);
			}
			else if (e.wheelDelta > 0 || e.detail > 0) {
				currLayerPos--;

				if (currLayerPos < 0) {
					currLayerPos = 0;
				}

				if (currLayerPos === 0) {
					self.rotateOnScroll = false;
				}

				self.actions.goToFrame(currLayerPos);
			}

			if (self.rotateOnScroll) {
				e.preventDefault();
			}
		}

		function getMaxLayersCount() {
			return _this.layers.length;
		}

		_this.actions =  {
			setActiveLayer: function(layer) {
				if (layer < 0 || layer > _this.layers.length) {
					return;
				}

				_this.activeLayer = _this.layers[layer];
			},

			getActiveLayer: function() {
				return _this.activeLayer;
			},

			addImages: function(images) {
				_this.images = images;
			},

			addLayer: function(layer) {
				_this.layers.push(layer);
			},

			addOverlayLayer: function(imagePath) {

			},

			buildLayers: function(images) {

				for (var i = 0, len = images.length; i < len; i++) {

					var layer = {
						image: images[i],
						id: "image-" + i,
						render: function(canvas, ctx) {
						  	ctx.save();
							ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
					    	drawImageProp(ctx, this.image, 0, 0, canvas.clientWidth, canvas.clientHeight);
					    	ctx.restore();
						}
					};

					_this.actions.addLayer(layer);
				}
			},

			bindEvents: function() {
				_this.canvas.addEventListener('mousewheel', handleScroll.bind(this));
				_this.canvas.addEventListener('DOMMouseScroll', handleScroll.bind(this));
			},

			goToFrame: function(layerPos) {
				var activeLayer = _this.layers[layerPos];
				var context = _this.context;

				if (activeLayer == null || typeof activeLayer === 'undefined') {
					return;
				}

				_this.activeLayer = _this.layers[layerPos];
				_this.activeLayer.render(canvas, context);
			},

			render: function() {
				var context = _this.context;

				_this.layers[0].render(canvas, context);
				_this.actions.setActiveLayer(0);
			}
		};

		return _this.actions;
	};

	resizeVideo();

	var images = $animationWrapper.find('.lazy-images > img');
	var canvasPrep = new canvasImageLoader($animationWrapper);

	canvasPrep.buildLayers(images);
	// canvasPrep.addOverlayLayer(embeddedImagePath);
	canvasPrep.bindEvents();
	canvasPrep.render();

	$(w).resize(function () {
	    waitForFinalEvent(resizeVideo, 500, "video-resize");
	});

}(window, document))