function mxEventObject(name) {
	this.name = name;
	this.properties = [];
	for (var i = 1; i < arguments.length; i += 2) {
		if (arguments[i + 1] != null) {
			this.properties[arguments[i]] = arguments[i + 1];
		}
	}
};
mxEventObject.prototype.name = null;
mxEventObject.prototype.properties = null;
mxEventObject.prototype.consumed = false;
mxEventObject.prototype.getName = function() {
	return this.name;
};
mxEventObject.prototype.getProperties = function() {
	return this.properties;
};
mxEventObject.prototype.getProperty = function(key) {
	return this.properties[key];
};
mxEventObject.prototype.isConsumed = function() {
	return this.consumed;
};
mxEventObject.prototype.consume = function() {
	this.consumed = true;
};
function mxMouseEvent(evt, state) {
	this.evt = evt;
	this.state = state;
};
mxMouseEvent.prototype.consumed = false;
mxMouseEvent.prototype.evt = null;
mxMouseEvent.prototype.graphX = null;
mxMouseEvent.prototype.graphY = null;
mxMouseEvent.prototype.state = null;
mxMouseEvent.prototype.getEvent = function() {
	return this.evt;
};
mxMouseEvent.prototype.getSource = function() {
	return mxEvent.getSource(this.evt);
};
mxMouseEvent.prototype.isSource = function(shape) {
	if (shape != null) {
		var source = this.getSource();
		while (source != null) {
			if (source == shape.node) {
				return true;
			}
			source = source.parentNode;
		}
	}
	return false;
};
mxMouseEvent.prototype.getX = function() {
	return mxEvent.getClientX(this.getEvent());
};
mxMouseEvent.prototype.getY = function() {
	return mxEvent.getClientY(this.getEvent());
};
mxMouseEvent.prototype.getGraphX = function() {
	return this.graphX;
};
mxMouseEvent.prototype.getGraphY = function() {
	return this.graphY;
};
mxMouseEvent.prototype.getState = function() {
	return this.state;
};
mxMouseEvent.prototype.getCell = function() {
	var state = this.getState();
	if (state != null) {
		return state.cell;
	}
	return null;
};
mxMouseEvent.prototype.isPopupTrigger = function() {
	return mxEvent.isPopupTrigger(this.getEvent());
};
mxMouseEvent.prototype.isConsumed = function() {
	return this.consumed;
};
mxMouseEvent.prototype.consume = function(preventDefault) {
	preventDefault = (preventDefault != null) ? preventDefault: true;
	if (preventDefault && this.evt.preventDefault) {
		this.evt.preventDefault();
	}
	this.evt.returnValue = false;
	this.consumed = true;
};
function mxEventSource(eventSource) {
	this.setEventSource(eventSource);
};
mxEventSource.prototype.eventListeners = null;
mxEventSource.prototype.eventsEnabled = true;
mxEventSource.prototype.eventSource = null;
mxEventSource.prototype.isEventsEnabled = function() {
	return this.eventsEnabled;
};
mxEventSource.prototype.setEventsEnabled = function(value) {
	this.eventsEnabled = value;
};
mxEventSource.prototype.getEventSource = function() {
	return this.eventSource;
};
mxEventSource.prototype.setEventSource = function(value) {
	this.eventSource = value;
};
mxEventSource.prototype.addListener = function(name, funct) {
	if (this.eventListeners == null) {
		this.eventListeners = [];
	}
	this.eventListeners.push(name);
	this.eventListeners.push(funct);
};
mxEventSource.prototype.removeListener = function(funct) {
	if (this.eventListeners != null) {
		var i = 0;
		while (i < this.eventListeners.length) {
			if (this.eventListeners[i + 1] == funct) {
				this.eventListeners.splice(i, 2);
			} else {
				i += 2;
			}
		}
	}
};
mxEventSource.prototype.fireEvent = function(evt, sender) {
	if (this.eventListeners != null && this.isEventsEnabled()) {
		if (evt == null) {
			evt = new mxEventObject();
		}
		if (sender == null) {
			sender = this.getEventSource();
		}
		if (sender == null) {
			sender = this;
		}
		var args = [sender, evt];
		for (var i = 0; i < this.eventListeners.length; i += 2) {
			var listen = this.eventListeners[i];
			if (listen == null || listen == evt.getName()) {
				this.eventListeners[i + 1].apply(this, args);
			}
		}
	}
};
var mxEvent = {
	objects: [],
	addListener: function() {
		var updateListenerList = function(element, eventName, funct) {
			if (element.mxListenerList == null) {
				element.mxListenerList = [];
				mxEvent.objects.push(element);
			}
			var entry = {
				name: eventName,
				f: funct
			};
			element.mxListenerList.push(entry);
		};
		if (window.addEventListener) {
			return function(element, eventName, funct) {
				element.addEventListener(eventName, funct, false);
				updateListenerList(element, eventName, funct);
			};
		} else {
			return function(element, eventName, funct) {
				element.attachEvent("on" + eventName, funct);
				updateListenerList(element, eventName, funct);
			};
		}
	} (),
	removeListener: function() {
		var updateListener = function(element, eventName, funct) {
			if (element.mxListenerList != null) {
				var listenerCount = element.mxListenerList.length;
				for (var i = 0; i < listenerCount; i++) {
					var entry = element.mxListenerList[i];
					if (entry.f == funct) {
						element.mxListenerList.splice(i, 1);
						break;
					}
				}
				if (element.mxListenerList.length == 0) {
					element.mxListenerList = null;
				}
			}
		};
		if (window.removeEventListener) {
			return function(element, eventName, funct) {
				element.removeEventListener(eventName, funct, false);
				updateListener(element, eventName, funct);
			};
		} else {
			return function(element, eventName, funct) {
				element.detachEvent("on" + eventName, funct);
				updateListener(element, eventName, funct);
			};
		}
	} (),
	removeAllListeners: function(element) {
		var list = element.mxListenerList;
		if (list != null) {
			while (list.length > 0) {
				var entry = list[0];
				mxEvent.removeListener(element, entry.name, entry.f);
			}
		}
	},
	redirectMouseEvents: function(node, graph, state, down, move, up, dblClick) {
		var getState = function(evt) {
			return (typeof(state) == 'function') ? state(evt) : state;
		};
		var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
		var mm = (mxClient.IS_TOUCH) ? 'touchmove': 'mousemove';
		var mu = (mxClient.IS_TOUCH) ? 'touchend': 'mouseup';
		mxEvent.addListener(node, md,
		function(evt) {
			if (down != null) {
				down(evt);
			} else if (!mxEvent.isConsumed(evt)) {
				graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt, getState(evt)));
			}
		});
		mxEvent.addListener(node, mm,
		function(evt) {
			if (move != null) {
				move(evt);
			} else if (!mxEvent.isConsumed(evt)) {
				graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt, getState(evt)));
			}
		});
		mxEvent.addListener(node, mu,
		function(evt) {
			if (up != null) {
				up(evt);
			} else if (!mxEvent.isConsumed(evt)) {
				graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt, getState(evt)));
			}
		});
		mxEvent.addListener(node, 'dblclick',
		function(evt) {
			if (dblClick != null) {
				dblClick(evt);
			} else if (!mxEvent.isConsumed(evt)) {
				var tmp = getState(evt);
				graph.dblClick(evt, (tmp != null) ? tmp.cell: null);
			}
		});
	},
	release: function(element) {
		if (element != null) {
			mxEvent.removeAllListeners(element);
			var children = element.childNodes;
			if (children != null) {
				var childCount = children.length;
				for (var i = 0; i < childCount; i += 1) {
					mxEvent.release(children[i]);
				}
			}
		}
	},
	addMouseWheelListener: function(funct) {
		if (funct != null) {
			var wheelHandler = function(evt) {
				if (evt == null) {
					evt = window.event;
				}
				var delta = 0;
				if (!mxClient.IS_IE && !false && !false) {
					delta = -evt.detail / 2;
				} else {
					delta = evt.wheelDelta / 120;
				}
				if (delta != 0) {
					funct(evt, delta > 0);
				}
			};
			if (!mxClient.IS_IE) {
				var eventName = (false || false) ? 'mousewheel': 'DOMMouseScroll';
				mxEvent.addListener(window, eventName, wheelHandler);
			} else {
				mxEvent.addListener(document, 'mousewheel', wheelHandler);
			}
		}
	},
	disableContextMenu: function() {
		if (mxClient.IS_IE && document.documentMode < 9) {
			return function(element) {
				mxEvent.addListener(element, 'contextmenu',
				function() {
					return false;
				});
			};
		} else {
			return function(element) {
				element.setAttribute('oncontextmenu', 'return false;');
			};
		}
	} (),
	getSource: function(evt) {
		return (evt.srcElement != null) ? evt.srcElement: evt.target;
	},
	isConsumed: function(evt) {
		return evt.isConsumed != null && evt.isConsumed;
	},
	isLeftMouseButton: function(evt) {
		return evt.button == ((mxClient.IS_IE && document.documentMode < 9) ? 1 : 0);
	},
	isRightMouseButton: function(evt) {
		return evt.button == 2;
	},
	isPopupTrigger: function(evt) {
		return mxEvent.isRightMouseButton(evt) || (mxEvent.isShiftDown(evt) && !mxEvent.isControlDown(evt));
	},
	isShiftDown: function(evt) {
		return (evt != null) ? evt.shiftKey: false;
	},
	isAltDown: function(evt) {
		return (evt != null) ? evt.altKey: false;
	},
	isControlDown: function(evt) {
		return (evt != null) ? evt.ctrlKey: false;
	},
	isMetaDown: function(evt) {
		return (evt != null) ? evt.metaKey: false;
	},
	getMainEvent: function(e) {
		if ((e.type == 'touchstart' || e.type == 'touchmove') && e.touches != null && e.touches[0] != null) {
			e = e.touches[0];
		} else if (e.type == 'touchend' && e.changedTouches != null && e.changedTouches[0] != null) {
			e = e.changedTouches[0];
		}
		return e;
	},
	getClientX: function(e) {
		return mxEvent.getMainEvent(e).clientX;
	},
	getClientY: function(e) {
		return mxEvent.getMainEvent(e).clientY;
	},
	consume: function(evt, preventDefault, stopPropagation) {
		preventDefault = (preventDefault != null) ? preventDefault: true;
		stopPropagation = (stopPropagation != null) ? stopPropagation: true;
		if (preventDefault) {
			if (evt.preventDefault) {
				if (stopPropagation) {
					evt.stopPropagation();
				}
				evt.preventDefault();
			} else if (stopPropagation) {
				evt.cancelBubble = true;
			}
		}
		evt.isConsumed = true;
		evt.returnValue = false;
	},
	LABEL_HANDLE: -1,
	MOUSE_DOWN: 'mouseDown',
	MOUSE_MOVE: 'mouseMove',
	MOUSE_UP: 'mouseUp',
	ACTIVATE: 'activate',
	RESIZE_START: 'resizeStart',
	RESIZE: 'resize',
	RESIZE_END: 'resizeEnd',
	MOVE_START: 'moveStart',
	MOVE: 'move',
	MOVE_END: 'moveEnd',
	PAN_START: 'panStart',
	PAN: 'pan',
	PAN_END: 'panEnd',
	MINIMIZE: 'minimize',
	NORMALIZE: 'normalize',
	MAXIMIZE: 'maximize',
	HIDE: 'hide',
	SHOW: 'show',
	CLOSE: 'close',
	DESTROY: 'destroy',
	REFRESH: 'refresh',
	SIZE: 'size',
	SELECT: 'select',
	FIRED: 'fired',
	GET: 'get',
	RECEIVE: 'receive',
	CONNECT: 'connect',
	DISCONNECT: 'disconnect',
	SUSPEND: 'suspend',
	RESUME: 'resume',
	MARK: 'mark',
	SESSION: 'session',
	ROOT: 'root',
	POST: 'post',
	OPEN: 'open',
	SAVE: 'save',
	BEFORE_ADD_VERTEX: 'beforeAddVertex',
	ADD_VERTEX: 'addVertex',
	AFTER_ADD_VERTEX: 'afterAddVertex',
	DONE: 'done',
	EXECUTE: 'execute',
	BEGIN_UPDATE: 'beginUpdate',
	END_UPDATE: 'endUpdate',
	BEFORE_UNDO: 'beforeUndo',
	UNDO: 'undo',
	REDO: 'redo',
	CHANGE: 'change',
	NOTIFY: 'notify',
	LAYOUT_CELLS: 'layoutCells',
	CLICK: 'click',
	SCALE: 'scale',
	TRANSLATE: 'translate',
	SCALE_AND_TRANSLATE: 'scaleAndTranslate',
	UP: 'up',
	DOWN: 'down',
	ADD: 'add',
	CLEAR: 'clear',
	ADD_CELLS: 'addCells',
	CELLS_ADDED: 'cellsAdded',
	MOVE_CELLS: 'moveCells',
	CELLS_MOVED: 'cellsMoved',
	RESIZE_CELLS: 'resizeCells',
	CELLS_RESIZED: 'cellsResized',
	TOGGLE_CELLS: 'toggleCells',
	CELLS_TOGGLED: 'cellsToggled',
	ORDER_CELLS: 'orderCells',
	CELLS_ORDERED: 'cellsOrdered',
	REMOVE_CELLS: 'removeCells',
	CELLS_REMOVED: 'cellsRemoved',
	GROUP_CELLS: 'groupCells',
	UNGROUP_CELLS: 'ungroupCells',
	REMOVE_CELLS_FROM_PARENT: 'removeCellsFromParent',
	FOLD_CELLS: 'foldCells',
	CELLS_FOLDED: 'cellsFolded',
	ALIGN_CELLS: 'alignCells',
	LABEL_CHANGED: 'labelChanged',
	CONNECT_CELL: 'connectCell',
	CELL_CONNECTED: 'cellConnected',
	SPLIT_EDGE: 'splitEdge',
	FLIP_EDGE: 'flipEdge',
	START_EDITING: 'startEditing',
	ADD_OVERLAY: 'addOverlay',
	REMOVE_OVERLAY: 'removeOverlay',
	UPDATE_CELL_SIZE: 'updateCellSize',
	ESCAPE: 'escape',
	CLICK: 'click',
	DOUBLE_CLICK: 'doubleClick'
};
function mxXmlRequest(url, params, method, async, username, password) {
	this.url = url;
	this.params = params;
	this.method = method || 'POST';
	this.async = (async != null) ? async: true;
	this.username = username;
	this.password = password;
};
mxXmlRequest.prototype.url = null;
mxXmlRequest.prototype.params = null;
mxXmlRequest.prototype.method = null;
mxXmlRequest.prototype.async = null;
mxXmlRequest.prototype.binary = false;
mxXmlRequest.prototype.username = null;
mxXmlRequest.prototype.password = null;
mxXmlRequest.prototype.request = null;
mxXmlRequest.prototype.isBinary = function() {
	return this.binary;
};
mxXmlRequest.prototype.setBinary = function(value) {
	this.binary = value;
};
mxXmlRequest.prototype.getText = function() {
	return this.request.responseText;
};
mxXmlRequest.prototype.isReady = function() {
	return this.request.readyState == 4;
};
mxXmlRequest.prototype.getDocumentElement = function() {
	var doc = this.getXml();
	if (doc != null) {
		return doc.documentElement;
	}
	return null;
};
mxXmlRequest.prototype.getXml = function() {
	var xml = this.request.responseXML;
	if (document.documentMode >= 9 || xml == null || xml.documentElement == null) {
		xml = mxUtils.parseXml(this.request.responseText);
	}
	return xml;
};
mxXmlRequest.prototype.getText = function() {
	return this.request.responseText;
};
mxXmlRequest.prototype.getStatus = function() {
	return this.request.status;
};
mxXmlRequest.prototype.create = function() {
	if (window.XMLHttpRequest) {
		return function() {
			var req = new XMLHttpRequest();
			if (this.isBinary() && req.overrideMimeType) {
				req.overrideMimeType('text/plain; charset=x-user-defined');
			}
			return req;
		};
	} else if (typeof(ActiveXObject) != "undefined") {
		return function() {
			return new ActiveXObject("Microsoft.XMLHTTP");
		};
	}
} ();
mxXmlRequest.prototype.send = function(onload, onerror) {
	this.request = this.create();
	if (this.request != null) {
		if (onload != null) {
			this.request.onreadystatechange = mxUtils.bind(this,
			function() {
				if (this.isReady()) {
					onload(this);
					this.onreadystatechaange = null;
				}
			});
		}
		this.request.open(this.method, this.url, this.async, this.username, this.password);
		this.setRequestHeaders(this.request, this.params);
		this.request.send(this.params);
	}
};
mxXmlRequest.prototype.setRequestHeaders = function(request, params) {
	if (params != null) {
		request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	}
};
mxXmlRequest.prototype.simulate = function(doc, target) {
	doc = doc || document;
	var old = null;
	if (doc == document) {
		old = window.onbeforeunload;
		window.onbeforeunload = null;
	}
	var form = doc.createElement('form');
	form.setAttribute('method', this.method);
	form.setAttribute('action', this.url);
	if (target != null) {
		form.setAttribute('target', target);
	}
	form.style.display = 'none';
	form.style.visibility = 'hidden';
	var pars = (this.params.indexOf('&') > 0) ? this.params.split('&') : this.params.split();
	for (var i = 0; i < pars.length; i++) {
		var pos = pars[i].indexOf('=');
		if (pos > 0) {
			var name = pars[i].substring(0, pos);
			var value = pars[i].substring(pos + 1);
			var textarea = doc.createElement('textarea');
			textarea.setAttribute('name', name);
			value = value.replace(/\n/g, '&#xa;');
			var content = doc.createTextNode(value);
			textarea.appendChild(content);
			form.appendChild(textarea);
		}
	}
	doc.body.appendChild(form);
	form.submit();
	doc.body.removeChild(form);
	if (old != null) {
		window.onbeforeunload = old;
	}
};
var mxClipboard = {
	STEPSIZE: 10,
	insertCount: 1,
	cells: null,
	isEmpty: function() {
		return mxClipboard.cells == null;
	},
	cut: function(graph, cells) {
		cells = mxClipboard.copy(graph, cells);
		mxClipboard.insertCount = 0;
		mxClipboard.removeCells(graph, cells);
		return cells;
	},
	removeCells: function(graph, cells) {
		graph.removeCells(cells);
	},
	copy: function(graph, cells) {
		cells = cells || graph.getSelectionCells();
		var result = graph.getExportableCells(cells);
		mxClipboard.insertCount = 1;
		mxClipboard.cells = graph.cloneCells(result);
		return result;
	},
	paste: function(graph) {
		if (mxClipboard.cells != null) {
			var cells = graph.getImportableCells(mxClipboard.cells);
			var delta = mxClipboard.insertCount * mxClipboard.STEPSIZE;
			var parent = graph.getDefaultParent();
			cells = graph.importCells(cells, delta, delta, parent);
			mxClipboard.insertCount++;
			graph.setSelectionCells(cells);
		}
	}
};
function mxWindow(title, content, x, y, width, height, minimizable, movable, replaceNode, style) {
	if (content != null) {
		minimizable = (minimizable != null) ? minimizable: true;
		this.content = content;
		this.init(x, y, width, height, style);
		this.installMaximizeHandler();
		this.installMinimizeHandler();
		this.installCloseHandler();
		this.setMinimizable(minimizable);
		this.setTitle(title);
		if (movable == null || movable) {
			this.installMoveHandler();
		}
		if (replaceNode != null && replaceNode.parentNode != null) {
			replaceNode.parentNode.replaceChild(this.div, replaceNode);
		} else {
			document.body.appendChild(this.div);
		}
	}
};
mxWindow.prototype = new mxEventSource();
mxWindow.prototype.constructor = mxWindow;
mxWindow.prototype.closeImage = mxClient.imageBasePath + '/close.gif';
mxWindow.prototype.minimizeImage = mxClient.imageBasePath + '/minimize.gif';
mxWindow.prototype.normalizeImage = mxClient.imageBasePath + '/normalize.gif';
mxWindow.prototype.maximizeImage = mxClient.imageBasePath + '/maximize.gif';
mxWindow.prototype.resizeImage = mxClient.imageBasePath + '/resize.gif';
mxWindow.prototype.visible = false;
mxWindow.prototype.content = false;
mxWindow.prototype.minimumSize = new mxRectangle(0, 0, 50, 40);
mxWindow.prototype.title = false;
mxWindow.prototype.content = false;
mxWindow.prototype.destroyOnClose = true;
mxWindow.prototype.init = function(x, y, width, height, style) {
	style = (style != null) ? style: 'mxWindow';
	this.div = document.createElement('div');
	this.div.className = style;
	this.div.style.left = x + 'px';
	this.div.style.top = y + 'px';
	this.table = document.createElement('table');
	this.table.className = style;
	if (width != null) {
		if (!mxClient.IS_IE) {
			this.div.style.width = width + 'px';
		}
		this.table.style.width = width + 'px';
	}
	if (height != null) {
		if (!mxClient.IS_IE) {
			this.div.style.height = height + 'px';
		}
		this.table.style.height = height + 'px';
	}
	var tbody = document.createElement('tbody');
	var tr = document.createElement('tr');
	this.title = document.createElement('td');
	this.title.className = style + 'Title';
	tr.appendChild(this.title);
	tbody.appendChild(tr);
	tr = document.createElement('tr');
	this.td = document.createElement('td');
	this.td.className = style + 'Pane';
	this.contentWrapper = document.createElement('div');
	this.contentWrapper.className = style + 'Pane';
	this.contentWrapper.style.width = '100%';
	this.contentWrapper.appendChild(this.content);
	if (mxClient.IS_IE || this.content.nodeName.toUpperCase() != 'DIV') {
		this.contentWrapper.style.height = '100%';
	}
	this.td.appendChild(this.contentWrapper);
	tr.appendChild(this.td);
	tbody.appendChild(tr);
	this.table.appendChild(tbody);
	this.div.appendChild(this.table);
	var activator = mxUtils.bind(this,
	function(evt) {
		this.activate();
	});
	var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
	mxEvent.addListener(this.title, md, activator);
	mxEvent.addListener(this.table, md, activator);
	this.hide();
};
mxWindow.prototype.setTitle = function(title) {
	var child = this.title.firstChild;
	while (child != null) {
		var next = child.nextSibling;
		if (child.nodeType == mxConstants.NODETYPE_TEXT) {
			child.parentNode.removeChild(child);
		}
		child = next;
	}
	mxUtils.write(this.title, title || '');
};
mxWindow.prototype.setScrollable = function(scrollable) {
	if (navigator.userAgent.indexOf('Presto/2.5') < 0) {
		if (scrollable) {
			this.contentWrapper.style.overflow = 'auto';
		} else {
			this.contentWrapper.style.overflow = 'hidden';
		}
	}
};
mxWindow.prototype.activate = function() {
	if (mxWindow.activeWindow != this) {
		var style = mxUtils.getCurrentStyle(this.getElement());
		var index = (style != null) ? style.zIndex: 3;
		if (mxWindow.activeWindow) {
			var elt = mxWindow.activeWindow.getElement();
			if (elt != null && elt.style != null) {
				elt.style.zIndex = index;
			}
		}
		var previousWindow = mxWindow.activeWindow;
		this.getElement().style.zIndex = parseInt(index) + 1;
		mxWindow.activeWindow = this;
		this.fireEvent(new mxEventObject(mxEvent.ACTIVATE, 'previousWindow', previousWindow));
	}
};
mxWindow.prototype.getElement = function() {
	return this.div;
};
mxWindow.prototype.fit = function() {
	mxUtils.fit(this.div);
};
mxWindow.prototype.isResizable = function() {
	if (this.resize != null) {
		return this.resize.style.display != 'none';
	}
	return false;
};
mxWindow.prototype.setResizable = function(resizable) {
	if (resizable) {
		if (this.resize == null) {
			this.resize = document.createElement('img');
			this.resize.style.position = 'absolute';
			this.resize.style.bottom = '2px';
			this.resize.style.right = '2px';
			this.resize.setAttribute('src', mxClient.imageBasePath + '/resize.gif');
			this.resize.style.cursor = 'nw-resize';
			var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
			var mm = (mxClient.IS_TOUCH) ? 'touchmove': 'mousemove';
			var mu = (mxClient.IS_TOUCH) ? 'touchend': 'mouseup';
			mxEvent.addListener(this.resize, md, mxUtils.bind(this,
			function(evt) {
				this.activate();
				var startX = mxEvent.getClientX(evt);
				var startY = mxEvent.getClientY(evt);
				var width = this.div.offsetWidth;
				var height = this.div.offsetHeight;
				var dragHandler = mxUtils.bind(this,
				function(evt) {
					var dx = mxEvent.getClientX(evt) - startX;
					var dy = mxEvent.getClientY(evt) - startY;
					this.setSize(width + dx, height + dy);
					this.fireEvent(new mxEventObject(mxEvent.RESIZE, 'event', evt));
					mxEvent.consume(evt);
				});
				var dropHandler = mxUtils.bind(this,
				function(evt) {
					mxEvent.removeListener(document, mm, dragHandler);
					mxEvent.removeListener(document, mu, dropHandler);
					this.fireEvent(new mxEventObject(mxEvent.RESIZE_END, 'event', evt));
					mxEvent.consume(evt);
				});
				mxEvent.addListener(document, mm, dragHandler);
				mxEvent.addListener(document, mu, dropHandler);
				this.fireEvent(new mxEventObject(mxEvent.RESIZE_START, 'event', evt));
				mxEvent.consume(evt);
			}));
			this.div.appendChild(this.resize);
		} else {
			this.resize.style.display = 'inline';
		}
	} else if (this.resize != null) {
		this.resize.style.display = 'none';
	}
};
mxWindow.prototype.setSize = function(width, height) {
	width = Math.max(this.minimumSize.width, width);
	height = Math.max(this.minimumSize.height, height);
	if (!mxClient.IS_IE) {
		this.div.style.width = width + 'px';
		this.div.style.height = height + 'px';
	}
	this.table.style.width = width + 'px';
	this.table.style.height = height + 'px';
	if (!mxClient.IS_IE) {
		this.contentWrapper.style.height = (this.div.offsetHeight - this.title.offsetHeight - 2) + 'px';
	}
};
mxWindow.prototype.setMinimizable = function(minimizable) {
	this.minimize.style.display = (minimizable) ? '': 'none';
};
mxWindow.prototype.getMinimumSize = function() {
	return new mxRectangle(0, 0, 0, this.title.offsetHeight);
};
mxWindow.prototype.installMinimizeHandler = function() {
	this.minimize = document.createElement('img');
	this.minimize.setAttribute('src', this.minimizeImage);
	this.minimize.setAttribute('align', 'right');
	this.minimize.setAttribute('title', 'Minimize');
	this.minimize.style.cursor = 'pointer';
	this.minimize.style.marginRight = '1px';
	this.minimize.style.display = 'none';
	this.title.appendChild(this.minimize);
	var minimized = false;
	var maxDisplay = null;
	var height = null;
	var funct = mxUtils.bind(this,
	function(evt) {
		this.activate();
		if (!minimized) {
			minimized = true;
			this.minimize.setAttribute('src', this.normalizeImage);
			this.minimize.setAttribute('title', 'Normalize');
			this.contentWrapper.style.display = 'none';
			maxDisplay = this.maximize.style.display;
			this.maximize.style.display = 'none';
			height = this.table.style.height;
			var minSize = this.getMinimumSize();
			if (minSize.height > 0) {
				if (!mxClient.IS_IE) {
					this.div.style.height = minSize.height + 'px';
				}
				this.table.style.height = minSize.height + 'px';
			}
			if (minSize.width > 0) {
				if (!mxClient.IS_IE) {
					this.div.style.width = minSize.width + 'px';
				}
				this.table.style.width = minSize.width + 'px';
			}
			if (this.resize != null) {
				this.resize.style.visibility = 'hidden';
			}
			this.fireEvent(new mxEventObject(mxEvent.MINIMIZE, 'event', evt));
		} else {
			minimized = false;
			this.minimize.setAttribute('src', this.minimizeImage);
			this.minimize.setAttribute('title', 'Minimize');
			this.contentWrapper.style.display = '';
			this.maximize.style.display = maxDisplay;
			if (!mxClient.IS_IE) {
				this.div.style.height = height;
			}
			this.table.style.height = height;
			if (this.resize != null) {
				this.resize.style.visibility = '';
			}
			this.fireEvent(new mxEventObject(mxEvent.NORMALIZE, 'event', evt));
		}
		mxEvent.consume(evt);
	});
	var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
	mxEvent.addListener(this.minimize, md, funct);
};
mxWindow.prototype.setMaximizable = function(maximizable) {
	this.maximize.style.display = (maximizable) ? '': 'none';
};
mxWindow.prototype.installMaximizeHandler = function() {
	this.maximize = document.createElement('img');
	this.maximize.setAttribute('src', this.maximizeImage);
	this.maximize.setAttribute('align', 'right');
	this.maximize.setAttribute('title', 'Maximize');
	this.maximize.style.cursor = 'default';
	this.maximize.style.marginLeft = '1px';
	this.maximize.style.cursor = 'pointer';
	this.maximize.style.display = 'none';
	this.title.appendChild(this.maximize);
	var maximized = false;
	var x = null;
	var y = null;
	var height = null;
	var width = null;
	var funct = mxUtils.bind(this,
	function(evt) {
		this.activate();
		if (this.maximize.style.display != 'none') {
			if (!maximized) {
				maximized = true;
				this.maximize.setAttribute('src', this.normalizeImage);
				this.maximize.setAttribute('title', 'Normalize');
				this.contentWrapper.style.display = '';
				this.minimize.style.visibility = 'hidden';
				x = parseInt(this.div.style.left);
				y = parseInt(this.div.style.top);
				height = this.table.style.height;
				width = this.table.style.width;
				this.div.style.left = '0px';
				this.div.style.top = '0px';
				if (!mxClient.IS_IE) {
					this.div.style.height = (document.body.clientHeight - 2) + 'px';
					this.div.style.width = (document.body.clientWidth - 2) + 'px';
				}
				this.table.style.width = (document.body.clientWidth - 2) + 'px';
				this.table.style.height = (document.body.clientHeight - 2) + 'px';
				if (this.resize != null) {
					this.resize.style.visibility = 'hidden';
				}
				if (!mxClient.IS_IE) {
					var style = mxUtils.getCurrentStyle(this.contentWrapper);
					if (style.overflow == 'auto' || this.resize != null) {
						this.contentWrapper.style.height = (this.div.offsetHeight - this.title.offsetHeight - 2) + 'px';
					}
				}
				this.fireEvent(new mxEventObject(mxEvent.MAXIMIZE, 'event', evt));
			} else {
				maximized = false;
				this.maximize.setAttribute('src', this.maximizeImage);
				this.maximize.setAttribute('title', 'Maximize');
				this.contentWrapper.style.display = '';
				this.minimize.style.visibility = '';
				this.div.style.left = x + 'px';
				this.div.style.top = y + 'px';
				if (!mxClient.IS_IE) {
					this.div.style.height = height;
					this.div.style.width = width;
					var style = mxUtils.getCurrentStyle(this.contentWrapper);
					if (style.overflow == 'auto' || this.resize != null) {
						this.contentWrapper.style.height = (this.div.offsetHeight - this.title.offsetHeight - 2) + 'px';
					}
				}
				this.table.style.height = height;
				this.table.style.width = width;
				if (this.resize != null) {
					this.resize.style.visibility = '';
				}
				this.fireEvent(new mxEventObject(mxEvent.NORMALIZE, 'event', evt));
			}
			mxEvent.consume(evt);
		}
	});
	var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
	mxEvent.addListener(this.maximize, md, funct);
	mxEvent.addListener(this.title, 'dblclick', funct);
};
mxWindow.prototype.installMoveHandler = function() {
	this.title.style.cursor = 'move';
	var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
	var mm = (mxClient.IS_TOUCH) ? 'touchmove': 'mousemove';
	var mu = (mxClient.IS_TOUCH) ? 'touchend': 'mouseup';
	mxEvent.addListener(this.title, md, mxUtils.bind(this,
	function(evt) {
		var startX = mxEvent.getClientX(evt);
		var startY = mxEvent.getClientY(evt);
		var x = this.getX();
		var y = this.getY();
		var dragHandler = mxUtils.bind(this,
		function(evt) {
			var dx = mxEvent.getClientX(evt) - startX;
			var dy = mxEvent.getClientY(evt) - startY;
			this.setLocation(x + dx, y + dy);
			this.fireEvent(new mxEventObject(mxEvent.MOVE, 'event', evt));
			mxEvent.consume(evt);
		});
		var dropHandler = mxUtils.bind(this,
		function(evt) {
			mxEvent.removeListener(document, mm, dragHandler);
			mxEvent.removeListener(document, mu, dropHandler);
			this.fireEvent(new mxEventObject(mxEvent.MOVE_END, 'event', evt));
			mxEvent.consume(evt);
		});
		mxEvent.addListener(document, mm, dragHandler);
		mxEvent.addListener(document, mu, dropHandler);
		this.fireEvent(new mxEventObject(mxEvent.MOVE_START, 'event', evt));
		mxEvent.consume(evt);
	}));
};
mxWindow.prototype.setLocation = function(x, y) {
	this.div.style.left = x + 'px';
	this.div.style.top = y + 'px';
};
mxWindow.prototype.getX = function() {
	return parseInt(this.div.style.left);
};
mxWindow.prototype.getY = function() {
	return parseInt(this.div.style.top);
};
mxWindow.prototype.installCloseHandler = function() {
	this.closeImg = document.createElement('img');
	this.closeImg.setAttribute('src', this.closeImage);
	this.closeImg.setAttribute('align', 'right');
	this.closeImg.setAttribute('title', 'Close');
	this.closeImg.style.marginLeft = '2px';
	this.closeImg.style.cursor = 'pointer';
	this.closeImg.style.display = 'none';
	this.title.insertBefore(this.closeImg, this.title.firstChild);
	var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
	mxEvent.addListener(this.closeImg, md, mxUtils.bind(this,
	function(evt) {
		this.fireEvent(new mxEventObject(mxEvent.CLOSE, 'event', evt));
		if (this.destroyOnClose) {
			this.destroy();
		} else {
			this.setVisible(false);
		}
		mxEvent.consume(evt);
	}));
};
mxWindow.prototype.setImage = function(image) {
	this.image = document.createElement('img');
	this.image.setAttribute('src', image);
	this.image.setAttribute('align', 'left');
	this.image.style.marginRight = '4px';
	this.image.style.marginLeft = '0px';
	this.image.style.marginTop = '-2px';
	this.title.insertBefore(this.image, this.title.firstChild);
};
mxWindow.prototype.setClosable = function(closable) {
	this.closeImg.style.display = (closable) ? '': 'none';
};
mxWindow.prototype.isVisible = function() {
	if (this.div != null) {
		return this.div.style.visibility != 'hidden';
	}
	return false;
};
mxWindow.prototype.setVisible = function(visible) {
	if (this.div != null && this.isVisible() != visible) {
		if (visible) {
			this.show();
		} else {
			this.hide();
		}
	}
};
mxWindow.prototype.show = function() {
	this.div.style.visibility = '';
	this.activate();
	var style = mxUtils.getCurrentStyle(this.contentWrapper);
	if (!mxClient.IS_IE && (style.overflow == 'auto' || this.resize != null)) {
		this.contentWrapper.style.height = (this.div.offsetHeight - this.title.offsetHeight - 2) + 'px';
	}
	this.fireEvent(new mxEventObject(mxEvent.SHOW));
};
mxWindow.prototype.hide = function() {
	this.div.style.visibility = 'hidden';
	this.fireEvent(new mxEventObject(mxEvent.HIDE));
};
mxWindow.prototype.destroy = function() {
	this.fireEvent(new mxEventObject(mxEvent.DESTROY));
	if (this.div != null) {
		mxEvent.release(this.div);
		this.div.parentNode.removeChild(this.div);
		this.div = null;
	}
	this.title = null;
	this.content = null;
	this.contentWrapper = null;
};
function mxForm(className) {
	this.table = document.createElement('table');
	this.table.className = className;
	this.body = document.createElement('tbody');
	this.table.appendChild(this.body);
};
mxForm.prototype.table = null;
mxForm.prototype.body = false;
mxForm.prototype.getTable = function() {
	return this.table;
};
mxForm.prototype.addButtons = function(okFunct, cancelFunct) {
	var tr = document.createElement('tr');
	var td = document.createElement('td');
	tr.appendChild(td);
	td = document.createElement('td');
	var button = document.createElement('button');
	mxUtils.write(button, mxResources.get('ok') || 'OK');
	td.appendChild(button);
	mxEvent.addListener(button, 'click',
	function() {
		okFunct();
	});
	button = document.createElement('button');
	mxUtils.write(button, mxResources.get('cancel') || 'Cancel');
	td.appendChild(button);
	mxEvent.addListener(button, 'click',
	function() {
		cancelFunct();
	});
	tr.appendChild(td);
	this.body.appendChild(tr);
};
mxForm.prototype.addText = function(name, value) {
	var input = document.createElement('input');
	input.setAttribute('type', 'text');
	input.value = value;
	return this.addField(name, input);
};
mxForm.prototype.addCheckbox = function(name, value) {
	var input = document.createElement('input');
	input.setAttribute('type', 'checkbox');
	this.addField(name, input);
	if (value) {
		input.checked = true;
	}
	return input;
};
mxForm.prototype.addTextarea = function(name, value, rows) {
	var input = document.createElement('textarea');
	if (!mxClient.IS_IE) {
		rows--;
	}
	input.setAttribute('rows', rows || 2);
	input.value = value;
	return this.addField(name, input);
};
mxForm.prototype.addCombo = function(name, isMultiSelect, size) {
	var select = document.createElement('select');
	if (size != null) {
		select.setAttribute('size', size);
	}
	if (isMultiSelect) {
		select.setAttribute('multiple', 'true');
	}
	return this.addField(name, select);
};
mxForm.prototype.addOption = function(combo, label, value, isSelected) {
	var option = document.createElement('option');
	mxUtils.writeln(option, label);
	option.setAttribute('value', value);
	if (isSelected) {
		option.setAttribute('selected', isSelected);
	}
	combo.appendChild(option);
};
mxForm.prototype.addField = function(name, input) {
	var tr = document.createElement('tr');
	var td = document.createElement('td');
	mxUtils.write(td, name);
	tr.appendChild(td);
	td = document.createElement('td');
	td.appendChild(input);
	tr.appendChild(td);
	this.body.appendChild(tr);
	return input;
};
function mxImage(src, width, height) {
	this.src = src;
	this.width = width;
	this.height = height;
};
mxImage.prototype.src = null;
mxImage.prototype.width = null;
mxImage.prototype.height = null;
function mxDivResizer(div, container) {
	if (div.nodeName.toLowerCase() == 'div') {
		if (container == null) {
			container = window;
		}
		this.div = div;
		var style = mxUtils.getCurrentStyle(div);
		if (style != null) {
			this.resizeWidth = style.width == 'auto';
			this.resizeHeight = style.height == 'auto';
		}
		mxEvent.addListener(container, 'resize', mxUtils.bind(this,
		function(evt) {
			if (!this.handlingResize) {
				this.handlingResize = true;
				this.resize();
				this.handlingResize = false;
			}
		}));
		this.resize();
	}
};
mxDivResizer.prototype.resizeWidth = true;
mxDivResizer.prototype.resizeHeight = true;
mxDivResizer.prototype.handlingResize = false;
mxDivResizer.prototype.resize = function() {
	var w = this.getDocumentWidth();
	var h = this.getDocumentHeight();
	var l = parseInt(this.div.style.left);
	var r = parseInt(this.div.style.right);
	var t = parseInt(this.div.style.top);
	var b = parseInt(this.div.style.bottom);
	if (this.resizeWidth && !isNaN(l) && !isNaN(r) && l >= 0 && r >= 0 && w - r - l > 0) {
		this.div.style.width = (w - r - l) + 'px';
	}
	if (this.resizeHeight && !isNaN(t) && !isNaN(b) && t >= 0 && b >= 0 && h - t - b > 0) {
		this.div.style.height = (h - t - b) + 'px';
	}
};
mxDivResizer.prototype.getDocumentWidth = function() {
	return document.body.clientWidth;
};
mxDivResizer.prototype.getDocumentHeight = function() {
	return document.body.clientHeight;
};
function mxDragSource(element, dropHandler) {
	this.element = element;
	this.dropHandler = dropHandler;
	var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
	mxEvent.addListener(element, md, mxUtils.bind(this, this.mouseDown));
};
mxDragSource.prototype.element = null;
mxDragSource.prototype.dropHandler = null;
mxDragSource.prototype.dragOffset = null;
mxDragSource.prototype.dragElement = null;
mxDragSource.prototype.previewElement = null;
mxDragSource.prototype.enabled = true;
mxDragSource.prototype.currentGraph = null;
mxDragSource.prototype.currentDropTarget = null;
mxDragSource.prototype.currentPoint = null;
mxDragSource.prototype.currentGuide = null;
mxDragSource.prototype.currentHighlight = null;
mxDragSource.prototype.autoscroll = true;
mxDragSource.prototype.guidesEnabled = true;
mxDragSource.prototype.gridEnabled = true;
mxDragSource.prototype.highlightDropTargets = true;
mxDragSource.prototype.isEnabled = function() {
	return this.enabled;
};
mxDragSource.prototype.setEnabled = function(value) {
	this.enabled = value;
};
mxDragSource.prototype.isGuidesEnabled = function() {
	return this.guidesEnabled;
};
mxDragSource.prototype.setGuidesEnabled = function(value) {
	this.guidesEnabled = value;
};
mxDragSource.prototype.isGridEnabled = function() {
	return this.gridEnabled;
};
mxDragSource.prototype.setGridEnabled = function(value) {
	this.gridEnabled = value;
};
mxDragSource.prototype.getGraphForEvent = function(evt) {
	return null;
};
mxDragSource.prototype.getGraphForEvent = function(evt) {
	return null;
};
mxDragSource.prototype.getDropTarget = function(graph, x, y) {
	return graph.getCellAt(x, y);
};
mxDragSource.prototype.createDragElement = function(evt) {
	if (this.element.tagName == 'IMG') { // 获取img元素
	} else {
		var nodes = this.element.childNodes;
		if (nodes.length > 0) {
			for(var i=0; i < nodes.length; i++) {
				var node = nodes[i];
				if (node.tagName == 'IMG'){
					return node.cloneNode(true);
				}
			}
		}
	}

	return this.element.cloneNode(true);
};
mxDragSource.prototype.createPreviewElement = function(graph) {
	return null;
};
mxDragSource.prototype.mouseDown = function(evt) {
	if (this.enabled && !mxEvent.isConsumed(evt)) {
		this.startDrag(evt);
		var mm = (mxClient.IS_TOUCH) ? 'touchmove': 'mousemove';
		var mu = (mxClient.IS_TOUCH) ? 'touchend': 'mouseup';
		this.mouseMoveHandler = mxUtils.bind(this, this.mouseMove);
		mxEvent.addListener(document, mm, this.mouseMoveHandler);
		this.mouseUpHandler = mxUtils.bind(this, this.mouseUp);
		mxEvent.addListener(document, mu, this.mouseUpHandler);
		mxEvent.consume(evt, true, false);
	}
};
mxDragSource.prototype.startDrag = function(evt) {
	this.dragElement = this.createDragElement(evt);
	this.dragElement.style.position = 'absolute';
	this.dragElement.style.zIndex = '200';
	mxUtils.setOpacity(this.dragElement, 70);
};
mxDragSource.prototype.stopDrag = function(evt) {
	if (this.dragElement != null) {
		if (this.dragElement.parentNode != null) {
			this.dragElement.parentNode.removeChild(this.dragElement);
		}
		this.dragElement = null;
	}
};
mxDragSource.prototype.graphContainsEvent = function(graph, evt) {
	var x = mxEvent.getClientX(evt);
	var y = mxEvent.getClientY(evt);
	var offset = mxUtils.getOffset(graph.container);
	var origin = mxUtils.getScrollOrigin();
	return x >= offset.x - origin.x && y >= offset.y - origin.y && x <= offset.x - origin.x + graph.container.offsetWidth && y <= offset.y - origin.y + graph.container.offsetHeight;
};
mxDragSource.prototype.mouseMove = function(evt) {
	var graph = this.getGraphForEvent(evt);
	if (graph != null && !this.graphContainsEvent(graph, evt)) {
		graph = null;
	}
	if (graph != this.currentGraph) {
		if (this.currentGraph != null) {
			this.dragExit(this.currentGraph);
		}
		this.currentGraph = graph;
		if (this.currentGraph != null) {
			this.dragEnter(this.currentGraph);
		}
	}
	if (this.currentGraph != null) {
		this.dragOver(this.currentGraph, evt);
	}
	if (this.dragElement != null && (this.previewElement == null || this.previewElement.style.visibility != 'visible')) {
		var x = mxEvent.getClientX(evt);
		var y = mxEvent.getClientY(evt);
		if (this.dragElement.parentNode == null) {
			document.body.appendChild(this.dragElement);
		}
		this.dragElement.style.visibility = 'visible';
		if (this.dragOffset != null) {
			x += this.dragOffset.x;
			y += this.dragOffset.y;
		}
		x += document.body.scrollLeft || document.documentElement.scrollLeft;
		y += document.body.scrollTop || document.documentElement.scrollTop;
		this.dragElement.style.left = x + 'px';
		this.dragElement.style.top = y + 'px';
	} else if (this.dragElement != null) {
		this.dragElement.style.visibility = 'hidden';
	}
	mxEvent.consume(evt);
};
mxDragSource.prototype.mouseUp = function(evt) {
	if (this.currentGraph != null) {
		if (this.currentPoint != null && (this.previewElement == null || this.previewElement.style.visibility != 'hidden')) {
			var scale = this.currentGraph.view.scale;
			var tr = this.currentGraph.view.translate;
			var x = this.currentPoint.x / scale - tr.x;
			var y = this.currentPoint.y / scale - tr.y;
			this.drop(this.currentGraph, evt, this.currentDropTarget, x, y);
		}
		this.dragExit(this.currentGraph);
	}
	this.stopDrag(evt);
	this.currentGraph = null;
	if (this.mouseMoveHandler != null) {
		var mm = (mxClient.IS_TOUCH) ? 'touchmove': 'mousemove';
		mxEvent.removeListener(document, mm, this.mouseMoveHandler);
		this.mouseMoveHandler = null;
	}
	if (this.mouseUpHandler != null) {
		var mu = (mxClient.IS_TOUCH) ? 'touchend': 'mouseup';
		mxEvent.removeListener(document, mu, this.mouseUpHandler);
		this.mouseUpHandler = null;
	}
	mxEvent.consume(evt);
};
mxDragSource.prototype.dragEnter = function(graph) {
	graph.isMouseDown = true;
	this.previewElement = this.createPreviewElement(graph);
	if (this.isGuidesEnabled() && this.previewElement != null) {
		this.currentGuide = new mxGuide(graph, graph.graphHandler.getGuideStates());
	}
	if (this.highlightDropTargets) {
		this.currentHighlight = new mxCellHighlight(graph, mxConstants.DROP_TARGET_COLOR);
	}
};
mxDragSource.prototype.dragExit = function(graph) {
	this.currentDropTarget = null;
	this.currentPoint = null;
	graph.isMouseDown = false;
	if (this.previewElement != null) {
		if (this.previewElement.parentNode != null) {
			this.previewElement.parentNode.removeChild(this.previewElement);
		}
		this.previewElement = null;
	}
	if (this.currentGuide != null) {
		this.currentGuide.destroy();
		this.currentGuide = null;
	}
	if (this.currentHighlight != null) {
		this.currentHighlight.destroy();
		this.currentHighlight = null;
	}
};
mxDragSource.prototype.dragOver = function(graph, evt) {
	var offset = mxUtils.getOffset(graph.container);
	var origin = mxUtils.getScrollOrigin(graph.container);
	var x = mxEvent.getClientX(evt) - offset.x + origin.x;
	var y = mxEvent.getClientY(evt) - offset.y + origin.y;
	if (graph.autoScroll && (this.autoscroll == null || this.autoscroll)) {
		graph.scrollPointToVisible(x, y, graph.autoExtend);
	}
	if (this.currentHighlight != null && graph.isDropEnabled()) {
		this.currentDropTarget = this.getDropTarget(graph, x, y);
		var state = graph.getView().getState(this.currentDropTarget);
		this.currentHighlight.highlight(state);
	}
	if (this.previewElement != null) {
		if (this.previewElement.parentNode == null) {
			graph.container.appendChild(this.previewElement);
			this.previewElement.style.zIndex = '3';
			this.previewElement.style.position = 'absolute';
		}
		var gridEnabled = this.isGridEnabled() && graph.isGridEnabledEvent(evt);
		var hideGuide = true;
		if (this.currentGuide != null && this.currentGuide.isEnabledForEvent(evt)) {
			var w = parseInt(this.previewElement.style.width);
			var h = parseInt(this.previewElement.style.height);
			var bounds = new mxRectangle(0, 0, w, h);
			var delta = new mxPoint(x, y);
			delta = this.currentGuide.move(bounds, delta, gridEnabled);
			hideGuide = false;
			x = delta.x;
			y = delta.y;
		} else if (gridEnabled) {
			var scale = graph.view.scale;
			var tr = graph.view.translate;
			var off = graph.gridSize / 2;
			x = (graph.snap(x / scale - tr.x - off) + tr.x) * scale;
			y = (graph.snap(y / scale - tr.y - off) + tr.y) * scale;
		}
		if (this.currentGuide != null && hideGuide) {
			this.currentGuide.hide();
		}
		if (this.previewOffset != null) {
			x += this.previewOffset.x;
			y += this.previewOffset.y;
		}
		this.previewElement.style.left = Math.round(x) + 'px';
		this.previewElement.style.top = Math.round(y) + 'px';
		this.previewElement.style.visibility = 'visible';
	}
	this.currentPoint = new mxPoint(x, y);
};
mxDragSource.prototype.drop = function(graph, evt, dropTarget, x, y) {
	this.dropHandler(graph, evt, dropTarget, x, y);
	graph.container.focus();
};
function mxToolbar(container) {
	this.container = container;
};
mxToolbar.prototype = new mxEventSource();
mxToolbar.prototype.constructor = mxToolbar;
mxToolbar.prototype.container = null;
mxToolbar.prototype.enabled = true;
mxToolbar.prototype.noReset = false;
mxToolbar.prototype.updateDefaultMode = true;
mxToolbar.prototype.addItem = function(title, icon, funct, pressedIcon, style, factoryMethod) {
	var img = document.createElement((icon != null) ? 'img': 'button');
	var initialClassName = style || ((factoryMethod != null) ? 'mxToolbarMode': 'mxToolbarItem');
	img.className = initialClassName;
	img.setAttribute('src', icon);
	if (title != null) {
		if (icon != null) {
			img.setAttribute('title', title);
		} else {
			mxUtils.write(img, title);
		}
	}
	this.container.appendChild(img);
	if (funct != null) {
		mxEvent.addListener(img, (mxClient.IS_TOUCH) ? 'touchend': 'click', funct);
	}
	var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
	var mu = (mxClient.IS_TOUCH) ? 'touchend': 'mouseup';
	mxEvent.addListener(img, md, mxUtils.bind(this,
	function(evt) {
		if (pressedIcon != null) {
			img.setAttribute('src', pressedIcon);
		} else {
			img.style.backgroundColor = 'gray';
		}
		if (factoryMethod != null) {
			if (this.menu == null) {
				this.menu = new mxPopupMenu();
				this.menu.init();
			}
			var last = this.currentImg;
			if (this.menu.isMenuShowing()) {
				this.menu.hideMenu();
			}
			if (last != img) {
				this.currentImg = img;
				this.menu.factoryMethod = factoryMethod;
				var point = new mxPoint(img.offsetLeft, img.offsetTop + img.offsetHeight);
				this.menu.popup(point.x, point.y, null, evt);
				if (this.menu.isMenuShowing()) {
					img.className = initialClassName + 'Selected';
					this.menu.hideMenu = function() {
						mxPopupMenu.prototype.hideMenu.apply(this);
						img.className = initialClassName;
						this.currentImg = null;
					};
				}
			}
		}
	}));
	var mouseHandler = mxUtils.bind(this,
	function(evt) {
		if (pressedIcon != null) {
			img.setAttribute('src', icon);
		} else {
			img.style.backgroundColor = '';
		}
	});
	mxEvent.addListener(img, mu, mouseHandler);
	mxEvent.addListener(img, 'mouseout', mouseHandler);
	return img;
};
mxToolbar.prototype.addCombo = function(style) {
	var div = document.createElement('div');
	div.style.display = 'inline';
	div.className = 'mxToolbarComboContainer';
	var select = document.createElement('select');
	select.className = style || 'mxToolbarCombo';
	div.appendChild(select);
	this.container.appendChild(div);
	return select;
};
mxToolbar.prototype.addActionCombo = function(title, style) {
	var select = document.createElement('select');
	select.className = style || 'mxToolbarCombo';
	this.addOption(select, title, null);
	mxEvent.addListener(select, 'change',
	function(evt) {
		var value = select.options[select.selectedIndex];
		select.selectedIndex = 0;
		if (value.funct != null) {
			value.funct(evt);
		}
	});
	this.container.appendChild(select);
	return select;
};
mxToolbar.prototype.addOption = function(combo, title, value) {
	var option = document.createElement('option');
	mxUtils.writeln(option, title);
	if (typeof(value) == 'function') {
		option.funct = value;
	} else {
		option.setAttribute('value', value);
	}
	combo.appendChild(option);
	return option;
};
mxToolbar.prototype.addSwitchMode = function(title, icon, funct, pressedIcon, style) {
	var img = document.createElement('img');
	img.initialClassName = style || 'mxToolbarMode';
	img.className = img.initialClassName;
	img.setAttribute('src', icon);
	img.altIcon = pressedIcon;
	if (title != null) {
		img.setAttribute('title', title);
	}
	mxEvent.addListener(img, 'click', mxUtils.bind(this,
	function(evt) {
		var tmp = this.selectedMode.altIcon;
		if (tmp != null) {
			this.selectedMode.altIcon = this.selectedMode.getAttribute('src');
			this.selectedMode.setAttribute('src', tmp);
		} else {
			this.selectedMode.className = this.selectedMode.initialClassName;
		}
		if (this.updateDefaultMode) {
			this.defaultMode = img;
		}
		this.selectedMode = img;
		var tmp = img.altIcon;
		if (tmp != null) {
			img.altIcon = img.getAttribute('src');
			img.setAttribute('src', tmp);
		} else {
			img.className = img.initialClassName + 'Selected';
		}
		this.fireEvent(new mxEventObject(mxEvent.SELECT));
		funct();
	}));
	this.container.appendChild(img);
	if (this.defaultMode == null) {
		this.defaultMode = img;
		this.selectedMode = img;
		var tmp = img.altIcon;
		if (tmp != null) {
			img.altIcon = img.getAttribute('src');
			img.setAttribute('src', tmp);
		} else {
			img.className = img.initialClassName + 'Selected';
		}
		funct();
	}
	return img;
};
mxToolbar.prototype.addMode = function(title, icon, funct, pressedIcon, style, toggle) {
	toggle = (toggle != null) ? toggle: true;
	var img = document.createElement((icon != null) ? 'img': 'button');
	img.initialClassName = style || 'mxToolbarMode';
	img.className = img.initialClassName;
	img.setAttribute('src', icon);
	img.altIcon = pressedIcon;
	if (title != null) {
		img.setAttribute('title', title);
	}
	if (this.enabled && toggle) {
		mxEvent.addListener(img, 'click', mxUtils.bind(this,
		function(evt) {
			this.selectMode(img, funct);
			this.noReset = false;
		}));
		mxEvent.addListener(img, 'dblclick', mxUtils.bind(this,
		function(evt) {
			this.selectMode(img, funct);
			this.noReset = true;
		}));
		if (this.defaultMode == null) {
			this.defaultMode = img;
			this.selectedMode = img;
			var tmp = img.altIcon;
			if (tmp != null) {
				img.altIcon = img.getAttribute('src');
				img.setAttribute('src', tmp);
			} else {
				img.className = img.initialClassName + 'Selected';
			}
		}
	}
	this.container.appendChild(img);
	return img;
};
mxToolbar.prototype.selectMode = function(domNode, funct) {
	if (this.selectedMode != domNode) {
		var tmp = this.selectedMode.altIcon;
		if (tmp != null) {
			this.selectedMode.altIcon = this.selectedMode.getAttribute('src');
			this.selectedMode.setAttribute('src', tmp);
		} else {
			this.selectedMode.className = this.selectedMode.initialClassName;
		}
		this.selectedMode = domNode;
		var tmp = this.selectedMode.altIcon;
		if (tmp != null) {
			this.selectedMode.altIcon = this.selectedMode.getAttribute('src');
			this.selectedMode.setAttribute('src', tmp);
		} else {
			this.selectedMode.className = this.selectedMode.initialClassName + 'Selected';
		}
		this.fireEvent(new mxEventObject(mxEvent.SELECT, "function", funct));
	}
};
mxToolbar.prototype.resetMode = function(forced) {
	if ((forced || !this.noReset) && this.selectedMode != this.defaultMode) {
		this.selectMode(this.defaultMode, null);
	}
};
mxToolbar.prototype.addSeparator = function(icon) {
	return this.addItem(null, icon, null);
};
mxToolbar.prototype.addBreak = function() {
	mxUtils.br(this.container);
};
mxToolbar.prototype.addLine = function() {
	var hr = document.createElement('hr');
	hr.style.marginRight = '6px';
	hr.setAttribute('size', '1');
	this.container.appendChild(hr);
};
mxToolbar.prototype.destroy = function() {
	mxEvent.release(this.container);
	this.container = null;
	this.defaultMode = null;
	this.selectedMode = null;
	if (this.menu != null) {
		this.menu.destroy();
	}
};
function mxSession(model, urlInit, urlPoll, urlNotify) {
	this.model = model;
	this.urlInit = urlInit;
	this.urlPoll = urlPoll;
	this.urlNotify = urlNotify;
	if (model != null) {
		this.codec = new mxCodec();
		this.codec.lookup = function(id) {
			return model.getCell(id);
		};
	}
	model.addListener(mxEvent.NOTIFY, mxUtils.bind(this,
	function(sender, evt) {
		var edit = evt.getProperty('edit');
		if (edit != null && this.debug || (this.connected && !this.suspended)) {
			this.notify('<edit>' + this.encodeChanges(edit.changes, edit.undone) + '</edit>');
		}
	}));
};
mxSession.prototype = new mxEventSource();
mxSession.prototype.constructor = mxSession;
mxSession.prototype.model = null;
mxSession.prototype.urlInit = null;
mxSession.prototype.urlPoll = null;
mxSession.prototype.urlNotify = null;
mxSession.prototype.codec = null;
mxSession.prototype.linefeed = '&#xa;';
mxSession.prototype.escapePostData = true;
mxSession.prototype.significantRemoteChanges = true;
mxSession.prototype.sent = 0;
mxSession.prototype.received = 0;
mxSession.prototype.debug = false;
mxSession.prototype.connected = false;
mxSession.prototype.suspended = false;
mxSession.prototype.polling = false;
mxSession.prototype.start = function() {
	if (this.debug) {
		this.connected = true;
		this.fireEvent(new mxEventObject(mxEvent.CONNECT));
	} else if (!this.connected) {
		this.get(this.urlInit, mxUtils.bind(this,
		function(req) {
			this.connected = true;
			this.fireEvent(new mxEventObject(mxEvent.CONNECT));
			this.poll();
		}));
	}
};
mxSession.prototype.suspend = function() {
	if (this.connected && !this.suspended) {
		this.suspended = true;
		this.fireEvent(new mxEventObject(mxEvent.SUSPEND));
	}
};
mxSession.prototype.resume = function(type, attr, value) {
	if (this.connected && this.suspended) {
		this.suspended = false;
		this.fireEvent(new mxEventObject(mxEvent.RESUME));
		if (!this.polling) {
			this.poll();
		}
	}
};
mxSession.prototype.stop = function(reason) {
	if (this.connected) {
		this.connected = false;
	}
	this.fireEvent(new mxEventObject(mxEvent.DISCONNECT, 'reason', reason));
};
mxSession.prototype.poll = function() {
	if (this.connected && !this.suspended && this.urlPoll != null) {
		this.polling = true;
		this.get(this.urlPoll, mxUtils.bind(this,
		function() {
			this.poll();
		}));
	} else {
		this.polling = false;
	}
};
mxSession.prototype.notify = function(xml, onLoad, onError) {
	if (xml != null && xml.length > 0) {
		if (this.urlNotify != null) {
			if (this.debug) {
				mxLog.show();
				mxLog.debug('mxSession.notify: ' + this.urlNotify + ' xml=' + xml);
			} else {
				xml = '<message><delta>' + xml + '</delta></message>';
				if (this.escapePostData) {
					xml = encodeURIComponent(xml);
				}
				mxUtils.post(this.urlNotify, 'xml=' + xml, onLoad, onError);
			}
		}
		this.sent += xml.length;
		this.fireEvent(new mxEventObject(mxEvent.NOTIFY, 'url', this.urlNotify, 'xml', xml));
	}
};
mxSession.prototype.get = function(url, onLoad, onError) {
	if (typeof(mxUtils) != 'undefined') {
		var onErrorWrapper = mxUtils.bind(this,
		function(ex) {
			if (onError != null) {
				onError(ex);
			} else {
				this.stop(ex);
			}
		});
		var req = mxUtils.get(url, mxUtils.bind(this,
		function(req) {
			if (typeof(mxUtils) != 'undefined') {
				{
					if (req.isReady() && req.getStatus() != 404) {
						this.received += req.getText().length;
						this.fireEvent(new mxEventObject(mxEvent.GET, 'url', url, 'request', req));
						if (this.isValidResponse(req)) {
							if (req.getText().length > 0) {
								var node = req.getDocumentElement();
								if (node == null) {
									onErrorWrapper('Invalid response: ' + req.getText());
								} else {
									this.receive(node);
								}
							}
							if (onLoad != null) {
								onLoad(req);
							}
						}
					} else {
						onErrorWrapper('Response not ready');
					}
				}
			}
		}),
		function(req) {
			onErrorWrapper('Transmission error');
		});
	}
};
mxSession.prototype.isValidResponse = function(req) {
	return req.getText().indexOf('<?php') < 0;
};
mxSession.prototype.encodeChanges = function(changes, invert) {
	var xml = '';
	var step = (invert) ? -1 : 1;
	var i0 = (invert) ? changes.length - 1 : 0;
	for (var i = i0; i >= 0 && i < changes.length; i += step) {
		var node = this.codec.encode(changes[i]);
		xml += mxUtils.getXml(node, this.linefeed);
	}
	return xml;
};
mxSession.prototype.receive = function(node) {
	if (node != null && node.nodeType == mxConstants.NODETYPE_ELEMENT) {
		var ns = node.getAttribute('namespace');
		if (ns != null) {
			this.model.prefix = ns + '-';
		}
		var child = node.firstChild;
		while (child != null) {
			var name = child.nodeName.toLowerCase();
			if (name == 'state') {
				this.processState(child);
			} else if (name == 'delta') {
				this.processDelta(child);
			}
			child = child.nextSibling;
		}
		this.fireEvent(new mxEventObject(mxEvent.RECEIVE, 'node', node));
	}
};
mxSession.prototype.processState = function(node) {
	var dec = new mxCodec(node.ownerDocument);
	dec.decode(node.firstChild, this.model);
};
mxSession.prototype.processDelta = function(node) {
	var edit = node.firstChild;
	while (edit != null) {
		if (edit.nodeName == 'edit') {
			this.processEdit(edit);
		}
		edit = edit.nextSibling;
	}
};
mxSession.prototype.processEdit = function(node) {
	var changes = this.decodeChanges(node);
	if (changes.length > 0) {
		var edit = this.createUndoableEdit(changes);
		this.model.fireEvent(new mxEventObject(mxEvent.CHANGE, 'edit', edit, 'changes', changes));
		this.model.fireEvent(new mxEventObject(mxEvent.UNDO, 'edit', edit));
		this.fireEvent(new mxEventObject(mxEvent.FIRED, 'edit', edit));
	}
};
mxSession.prototype.createUndoableEdit = function(changes) {
	var edit = new mxUndoableEdit(this.model, this.significantRemoteChanges);
	edit.changes = changes;
	edit.notify = function() {
		edit.source.fireEvent(new mxEventObject(mxEvent.CHANGE, 'edit', edit, 'changes', edit.changes));
		edit.source.fireEvent(new mxEventObject(mxEvent.NOTIFY, 'edit', edit, 'changes', edit.changes));
	};
	return edit;
};
mxSession.prototype.decodeChanges = function(node) {
	this.codec.document = node.ownerDocument;
	var changes = [];
	node = node.firstChild;
	while (node != null) {
		if (node.nodeType == mxConstants.NODETYPE_ELEMENT) {
			var change = null;
			if (node.nodeName == 'mxRootChange') {
				var tmp = new mxCodec(node.ownerDocument);
				change = tmp.decode(node);
			} else {
				change = this.codec.decode(node);
			}
			if (change != null) {
				change.model = this.model;
				change.execute();
				if (node.nodeName == 'mxChildChange' && change.parent == null) {
					this.cellRemoved(change.child);
				}
				changes.push(change);
			}
		}
		node = node.nextSibling;
	}
	return changes;
};
mxSession.prototype.cellRemoved = function(cell, codec) {
	this.codec.putObject(cell.getId(), cell);
	var childCount = this.model.getChildCount(cell);
	for (var i = 0; i < childCount; i++) {
		this.cellRemoved(this.model.getChildAt(cell, i));
	}
};
function mxUndoableEdit(source, significant) {
	this.source = source;
	this.changes = [];
	this.significant = (significant != null) ? significant: true;
};
mxUndoableEdit.prototype.source = null;
mxUndoableEdit.prototype.changes = null;
mxUndoableEdit.prototype.significant = null;
mxUndoableEdit.prototype.undone = false;
mxUndoableEdit.prototype.redone = false;
mxUndoableEdit.prototype.isEmpty = function() {
	return this.changes.length == 0;
};
mxUndoableEdit.prototype.isSignificant = function() {
	return this.significant;
};
mxUndoableEdit.prototype.add = function(change) {
	this.changes.push(change);
};
mxUndoableEdit.prototype.notify = function() {};
mxUndoableEdit.prototype.die = function() {};
mxUndoableEdit.prototype.undo = function() {
	if (!this.undone) {
		var count = this.changes.length;
		for (var i = count - 1; i >= 0; i--) {
			var change = this.changes[i];
			if (change.execute != null) {
				change.execute();
			} else if (change.undo != null) {
				change.undo();
			}
		}
		this.undone = true;
		this.redone = false;
	}
	this.notify();
};
mxUndoableEdit.prototype.redo = function() {
	if (!this.redone) {
		var count = this.changes.length;
		for (var i = 0; i < count; i++) {
			var change = this.changes[i];
			if (change.execute != null) {
				change.execute();
			} else if (change.redo != null) {
				change.redo();
			}
		}
		this.undone = false;
		this.redone = true;
	}
	this.notify();
};
function mxUndoManager(size) {
	this.size = (size != null) ? size: 100;
	this.clear();
};
mxUndoManager.prototype = new mxEventSource();
mxUndoManager.prototype.constructor = mxUndoManager;
mxUndoManager.prototype.size = null;
mxUndoManager.prototype.history = null;
mxUndoManager.prototype.indexOfNextAdd = 0;
mxUndoManager.prototype.isEmpty = function() {
	return this.history.length == 0;
};
mxUndoManager.prototype.clear = function() {
	this.history = [];
	this.indexOfNextAdd = 0;
	this.fireEvent(new mxEventObject(mxEvent.CLEAR));
};
mxUndoManager.prototype.canUndo = function() {
	return this.indexOfNextAdd > 0;
};
mxUndoManager.prototype.undo = function() {
	while (this.indexOfNextAdd > 0) {
		var edit = this.history[--this.indexOfNextAdd];
		edit.undo();
		if (edit.isSignificant()) {
			this.fireEvent(new mxEventObject(mxEvent.UNDO, 'edit', edit));
			break;
		}
	}
};
mxUndoManager.prototype.canRedo = function() {
	return this.indexOfNextAdd < this.history.length;
};
mxUndoManager.prototype.redo = function() {
	var n = this.history.length;
	while (this.indexOfNextAdd < n) {
		var edit = this.history[this.indexOfNextAdd++];
		edit.redo();
		if (edit.isSignificant()) {
			this.fireEvent(new mxEventObject(mxEvent.REDO, 'edit', edit));
			break;
		}
	}
};
mxUndoManager.prototype.undoableEditHappened = function(undoableEdit) {
	this.trim();
	if (this.size > 0 && this.size == this.history.length) {
		this.history.shift();
	}
	this.history.push(undoableEdit);
	this.indexOfNextAdd = this.history.length;
	this.fireEvent(new mxEventObject(mxEvent.ADD, 'edit', undoableEdit));
};
mxUndoManager.prototype.trim = function() {
	if (this.history.length > this.indexOfNextAdd) {
		var edits = this.history.splice(this.indexOfNextAdd, this.history.length - this.indexOfNextAdd);
		for (var i = 0; i < edits.length; i++) {
			edits[i].die();
		}
	}
};
var mxUrlConverter = function(root) {
	var enabled = true;
	var baseUrl = null;
	var updateBaseUrl = function() {
		baseUrl = document.URL;
		var tmp = baseUrl.lastIndexOf('/');
		if (tmp > 0) {
			baseUrl = baseUrl.substring(0, tmp + 1);
		}
	};
	return {
		isEnabled: function() {
			return enabled;
		},
		setEnabled: function(value) {
			enabled = value;
		},
		getBaseUrl: function() {
			return baseUrl;
		},
		setBaseUrl: function(value) {
			baseUrl = value;
		},
		convert: function(url) {
			if (enabled && url.indexOf('http://') < 0 && url.indexOf('https://') < 0) {
				if (baseUrl == null) {
					updateBaseUrl();
				}
				url = baseUrl + url;
			}
			return url;
		}
	};
};
function mxPanningManager(graph) {
	this.thread = null;
	this.active = false;
	this.tdx = 0;
	this.tdy = 0;
	this.t0x = 0;
	this.t0y = 0;
	this.dx = 0;
	this.dy = 0;
	this.mouseListener = {
		mouseDown: function(sender, me) {},
		mouseMove: function(sender, me) {},
		mouseUp: mxUtils.bind(this,
		function(sender, me) {
			if (this.active) {
				this.stop();
			}
		})
	};
	graph.addMouseListener(this.mouseListener);
	var createThread = mxUtils.bind(this,
	function() {
		return window.setInterval(mxUtils.bind(this,
		function() {
			this.tdx -= this.dx;
			this.tdy -= this.dy;
			graph.panGraph(this.getDx(), this.getDy());
		}), this.delay);
	});
	this.isActive = function() {
		return active;
	};
	this.getDx = function() {
		return Math.round(this.tdx);
	};
	this.getDy = function() {
		return Math.round(this.tdy);
	};
	this.start = function() {
		this.t0x = graph.view.translate.x;
		this.t0y = graph.view.translate.y;
		this.active = true;
	};
	this.panTo = function(x, y, w, h) {
		if (!this.active) {
			this.start();
		}
		w = (w != null) ? w: 0;
		h = (h != null) ? h: 0;
		var c = graph.container;
		this.dx = Math.max(0, x + w - c.scrollLeft - c.clientWidth);
		if (this.dx == 0) {
			this.dx = Math.min(0, x - c.scrollLeft);
		}
		this.dy = Math.max(0, y + h - c.scrollTop - c.clientHeight);
		if (this.dy == 0) {
			this.dy = Math.min(0, y - c.scrollTop);
		}
		if (this.dx != 0 || this.dy != 0) {
			this.dx *= this.damper;
			this.dy *= this.damper;
			if (this.thread == null) {
				this.thread = createThread();
			}
		} else if (this.thread != null) {
			window.clearInterval(this.thread);
			this.thread = null;
		}
	};
	this.stop = function() {
		if (this.active) {
			this.active = false;
			var px = graph.panDx;
			var py = graph.panDy;
			if (this.thread != null) {
				window.clearInterval(this.thread);
				this.thread = null;
			}
			if (px != 0 || py != 0) {
				graph.panGraph(0, 0);
				graph.view.setTranslate(this.t0x + px / graph.view.scale, this.t0y + py / graph.view.scale);
				this.tdx = 0;
				this.tdy = 0;
			}
		}
	};
	this.destroy = function() {
		graph.removeMouseListener(this.mouseListener);
	};
};
mxPanningManager.prototype.damper = 1 / 6;
mxPanningManager.prototype.delay = 10;
function mxPath(format) {
	this.format = format;
	this.path = [];
	this.translate = new mxPoint(0, 0);
};
mxPath.prototype.format = null;
mxPath.prototype.translate = null;
mxPath.prototype.path = null;
mxPath.prototype.isVml = function() {
	return this.format == 'vml';
};
mxPath.prototype.getPath = function() {
	return this.path.join('');
};
mxPath.prototype.setTranslate = function(x, y) {
	this.translate = new mxPoint(x, y);
};
mxPath.prototype.moveTo = function(x, y) {
	if (this.isVml()) {
		this.path.push('m ', Math.round(this.translate.x + x), ' ', Math.round(this.translate.y + y), ' ');
	} else {
		this.path.push('M ', Math.round(this.translate.x + x), ' ', Math.round(this.translate.y + y), ' ');
	}
};
mxPath.prototype.lineTo = function(x, y) {
	if (this.isVml()) {
		this.path.push('l ', Math.round(this.translate.x + x), ' ', Math.round(this.translate.y + y), ' ');
	} else {
		this.path.push('L ', Math.round(this.translate.x + x), ' ', Math.round(this.translate.y + y), ' ');
	}
};
mxPath.prototype.quadTo = function(x1, y1, x, y) {
	if (this.isVml()) {
		this.path.push('c ', Math.round(this.translate.x + x1), ' ', Math.round(this.translate.y + y1), ' ', Math.round(this.translate.x + x), ' ', Math.round(this.translate.y + y), ' ', Math.round(this.translate.x + x), ' ', Math.round(this.translate.y + y), ' ');
	} else {
		this.path.push('Q ', Math.round(this.translate.x + x1), ' ', Math.round(this.translate.y + y1), ' ', Math.round(this.translate.x + x), ' ', Math.round(this.translate.y + y), ' ');
	}
};
mxPath.prototype.curveTo = function(x1, y1, x2, y2, x, y) {
	if (this.isVml()) {
		this.path.push('c ', Math.round(this.translate.x + x1), ' ', Math.round(this.translate.y + y1), ' ', Math.round(this.translate.x + x2), ' ', Math.round(this.translate.y + y2), ' ', Math.round(this.translate.x + x), ' ', Math.round(this.translate.y + y), ' ');
	} else {
		this.path.push('C ', Math.round(this.translate.x + x1), ' ', Math.round(this.translate.y + y1), ' ', Math.round(this.translate.x + x2), ' ', Math.round(this.translate.y + y2), ' ', Math.round(this.translate.x + x), ' ', Math.round(this.translate.y + y), ' ');
	}
};
mxPath.prototype.write = function(string) {
	this.path.push(string, ' ');
};
mxPath.prototype.end = function() {
	if (this.format == 'vml') {
		this.path.push('e');
	}
};
mxPath.prototype.close = function() {
	if (this.format == 'vml') {
		this.path.push('x e');
	} else {
		this.path.push('Z');
	}
};
function mxPopupMenu(factoryMethod) {
	this.factoryMethod = factoryMethod;
	if (factoryMethod != null) {
		this.init();
	}
};
mxPopupMenu.prototype = new mxEventSource();
mxPopupMenu.prototype.constructor = mxPopupMenu;
mxPopupMenu.prototype.submenuImage = mxClient.imageBasePath + '/submenu.gif';
mxPopupMenu.prototype.zIndex = 10006;
mxPopupMenu.prototype.factoryMethod = null;
mxPopupMenu.prototype.useLeftButtonForPopup = false;
mxPopupMenu.prototype.enabled = true;
mxPopupMenu.prototype.itemCount = 0;
mxPopupMenu.prototype.autoExpand = false;
mxPopupMenu.prototype.smartSeparators = false;
mxPopupMenu.prototype.labels = true;
mxPopupMenu.prototype.init = function() {
	this.table = document.createElement('table');
	this.table.className = 'mxPopupMenu';
	this.tbody = document.createElement('tbody');
	this.table.appendChild(this.tbody);
	this.div = document.createElement('div');
	this.div.className = 'mxPopupMenu';
	this.div.style.display = 'inline';
	this.div.style.zIndex = this.zIndex;
	this.div.appendChild(this.table);
	mxEvent.disableContextMenu(this.div);
};
mxPopupMenu.prototype.isEnabled = function() {
	return this.enabled;
};
mxPopupMenu.prototype.setEnabled = function(enabled) {
	this.enabled = enabled;
};
mxPopupMenu.prototype.isPopupTrigger = function(me) {
	return me.isPopupTrigger() || (this.useLeftButtonForPopup && mxEvent.isLeftMouseButton(me.getEvent()));
};
mxPopupMenu.prototype.addItem = function(title, image, funct, parent, iconCls, enabled) {
	parent = parent || this;
	this.itemCount++;
	if (parent.willAddSeparator) {
		if (parent.containsItems) {
			this.addSeparator(parent, true);
		}
		parent.willAddSeparator = false;
	}
	parent.containsItems = true;
	var tr = document.createElement('tr');
	tr.className = 'mxPopupMenuItem';
	var col1 = document.createElement('td');
	col1.className = 'mxPopupMenuIcon';
	if (image != null) {
		var img = document.createElement('img');
		img.src = image;
		col1.appendChild(img);
	} else if (iconCls != null) {
		var div = document.createElement('div');
		div.className = iconCls;
		col1.appendChild(div);
	}
	tr.appendChild(col1);
	if (this.labels) {
		var col2 = document.createElement('td');
		col2.className = 'mxPopupMenuItem' + ((enabled != null && !enabled) ? ' disabled': '');
		mxUtils.write(col2, title);
		col2.align = 'left';
		tr.appendChild(col2);
		var col3 = document.createElement('td');
		col3.className = 'mxPopupMenuItem' + ((enabled != null && !enabled) ? ' disabled': '');
		col3.style.paddingRight = '6px';
		col3.style.textAlign = 'right';
		tr.appendChild(col3);
		if (parent.div == null) {
			this.createSubmenu(parent);
		}
	}
	parent.tbody.appendChild(tr);
	if (enabled == null || enabled) {
		var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
		var mm = (mxClient.IS_TOUCH) ? 'touchmove': 'mousemove';
		var mu = (mxClient.IS_TOUCH) ? 'touchend': 'mouseup';
		mxEvent.addListener(tr, md, mxUtils.bind(this,
		function(evt) {
			this.eventReceiver = tr;
			if (parent.activeRow != tr && parent.activeRow != parent) {
				if (parent.activeRow != null && parent.activeRow.div.parentNode != null) {
					this.hideSubmenu(parent);
				}
				if (tr.div != null) {
					this.showSubmenu(parent, tr);
					parent.activeRow = tr;
				}
			}
			mxEvent.consume(evt);
		}));
		mxEvent.addListener(tr, mm, mxUtils.bind(this,
		function(evt) {
			if (parent.activeRow != tr && parent.activeRow != parent) {
				if (parent.activeRow != null && parent.activeRow.div.parentNode != null) {
					this.hideSubmenu(parent);
				}
				if (this.autoExpand && tr.div != null) {
					this.showSubmenu(parent, tr);
					parent.activeRow = tr;
				}
			}
			tr.className = 'mxPopupMenuItemHover';
		}));
		mxEvent.addListener(tr, mu, mxUtils.bind(this,
		function(evt) {
			if (this.eventReceiver == tr) {
				if (parent.activeRow != tr) {
					this.hideMenu();
				}
				if (funct != null) {
					funct(evt);
				}
			}
			this.eventReceiver = null;
			mxEvent.consume(evt);
		}));
		mxEvent.addListener(tr, 'mouseout', mxUtils.bind(this,
		function(evt) {
			tr.className = 'mxPopupMenuItem';
		}));
	}
	return tr;
};
mxPopupMenu.prototype.createSubmenu = function(parent) {
	parent.table = document.createElement('table');
	parent.table.className = 'mxPopupMenu';
	parent.tbody = document.createElement('tbody');
	parent.table.appendChild(parent.tbody);
	parent.div = document.createElement('div');
	parent.div.className = 'mxPopupMenu';
	parent.div.style.position = 'absolute';
	parent.div.style.display = 'inline';
	parent.div.style.zIndex = this.zIndex;
	parent.div.appendChild(parent.table);
	var img = document.createElement('img');
	img.setAttribute('src', this.submenuImage);
	td = parent.firstChild.nextSibling.nextSibling;
	td.appendChild(img);
};
mxPopupMenu.prototype.showSubmenu = function(parent, row) {
	if (row.div != null) {
		row.div.style.left = (parent.div.offsetLeft + row.offsetLeft + row.offsetWidth - 1) + 'px';
		row.div.style.top = (parent.div.offsetTop + row.offsetTop) + 'px';
		document.body.appendChild(row.div);
		var left = parseInt(row.div.offsetLeft);
		var width = parseInt(row.div.offsetWidth);
		var b = document.body;
		var d = document.documentElement;
		var right = (b.scrollLeft || d.scrollLeft) + (b.clientWidth || d.clientWidth);
		if (left + width > right) {
			row.div.style.left = (parent.div.offsetLeft - width + ((mxClient.IS_IE) ? 6 : -6)) + 'px';
		}
		mxUtils.fit(row.div);
	}
};
mxPopupMenu.prototype.addSeparator = function(parent, force) {
	parent = parent || this;
	if (this.smartSeparators && !force) {
		parent.willAddSeparator = true;
	} else if (parent.tbody != null) {
		parent.willAddSeparator = false;
		var tr = document.createElement('tr');
		var col1 = document.createElement('td');
		col1.className = 'mxPopupMenuIcon';
		col1.style.padding = '0 0 0 0px';
		tr.appendChild(col1);
		var col2 = document.createElement('td');
		col2.style.padding = '0 0 0 0px';
		col2.setAttribute('colSpan', '2');
		var hr = document.createElement('hr');
		hr.setAttribute('size', '1');
		col2.appendChild(hr);
		tr.appendChild(col2);
		parent.tbody.appendChild(tr);
	}
};
mxPopupMenu.prototype.popup = function(x, y, cell, evt) {
	if (this.div != null && this.tbody != null && this.factoryMethod != null) {
		this.div.style.left = x + 'px';
		this.div.style.top = y + 'px';
		while (this.tbody.firstChild != null) {
			mxEvent.release(this.tbody.firstChild);
			this.tbody.removeChild(this.tbody.firstChild);
		}
		this.itemCount = 0;
		this.factoryMethod(this, cell, evt);
		if (this.itemCount > 0) {
			this.showMenu();
			this.fireEvent(new mxEventObject(mxEvent.SHOW));
		}
	}
};
mxPopupMenu.prototype.isMenuShowing = function() {
	return this.div != null && this.div.parentNode == document.body;
};
mxPopupMenu.prototype.showMenu = function() {
	if (document.documentMode >= 9) {
		this.div.style.filter = 'none';
	}
	document.body.appendChild(this.div);
	mxUtils.fit(this.div);
};
mxPopupMenu.prototype.hideMenu = function() {
	if (this.div != null) {
		if (this.div.parentNode != null) {
			this.div.parentNode.removeChild(this.div);
		}
		this.hideSubmenu(this);
		this.containsItems = false;
	}
};
mxPopupMenu.prototype.hideSubmenu = function(parent) {
	if (parent.activeRow != null) {
		this.hideSubmenu(parent.activeRow);
		if (parent.activeRow.div.parentNode != null) {
			parent.activeRow.div.parentNode.removeChild(parent.activeRow.div);
		}
		parent.activeRow = null;
	}
};
mxPopupMenu.prototype.destroy = function() {
	if (this.div != null) {
		mxEvent.release(this.div);
		if (this.div.parentNode != null) {
			this.div.parentNode.removeChild(this.div);
		}
		this.div = null;
	}
};
function mxAutoSaveManager(graph) {
	this.changeHandler = mxUtils.bind(this,
	function(sender, evt) {
		if (this.isEnabled()) {
			this.graphModelChanged(evt.getProperty('edit').changes);
		}
	});
	this.setGraph(graph);
};
mxAutoSaveManager.prototype = new mxEventSource();
mxAutoSaveManager.prototype.constructor = mxAutoSaveManager;
mxAutoSaveManager.prototype.graph = null;
mxAutoSaveManager.prototype.autoSaveDelay = 10;
mxAutoSaveManager.prototype.autoSaveThrottle = 2;
mxAutoSaveManager.prototype.autoSaveThreshold = 5;
mxAutoSaveManager.prototype.ignoredChanges = 0;
mxAutoSaveManager.prototype.lastSnapshot = 0;
mxAutoSaveManager.prototype.enabled = true;
mxAutoSaveManager.prototype.changeHandler = null;
mxAutoSaveManager.prototype.isEnabled = function() {
	return this.enabled;
};
mxAutoSaveManager.prototype.setEnabled = function(value) {
	this.enabled = value;
};
mxAutoSaveManager.prototype.setGraph = function(graph) {
	if (this.graph != null) {
		this.graph.getModel().removeListener(this.changeHandler);
	}
	this.graph = graph;
	if (this.graph != null) {
		this.graph.getModel().addListener(mxEvent.CHANGE, this.changeHandler);
	}
};
mxAutoSaveManager.prototype.save = function() {};
mxAutoSaveManager.prototype.graphModelChanged = function(changes) {
	var now = new Date().getTime();
	var dt = (now - this.lastSnapshot) / 1000;
	if (dt > this.autoSaveDelay || (this.ignoredChanges >= this.autoSaveThreshold && dt > this.autoSaveThrottle)) {
		this.save();
		this.reset();
	} else {
		this.ignoredChanges++;
	}
};
mxAutoSaveManager.prototype.reset = function() {
	this.lastSnapshot = new Date().getTime();
	this.ignoredChanges = 0;
};
mxAutoSaveManager.prototype.destroy = function() {
	this.setGraph(null);
};
function mxAnimation(delay) {
	this.delay = (delay != null) ? delay: 20;
};
mxAnimation.prototype = new mxEventSource();
mxAnimation.prototype.constructor = mxAnimation;
mxAnimation.prototype.delay = null;
mxAnimation.prototype.thread = null;
mxAnimation.prototype.startAnimation = function() {
	if (this.thread == null) {
		this.thread = window.setInterval(mxUtils.bind(this, this.updateAnimation), this.delay);
	}
};
mxAnimation.prototype.updateAnimation = function() {
	this.fireEvent(new mxEventObject(mxEvent.EXECUTE));
};
mxAnimation.prototype.stopAnimation = function() {
	if (this.thread != null) {
		window.clearInterval(this.thread);
		this.thread = null;
		this.fireEvent(new mxEventObject(mxEvent.DONE));
	}
};
function mxMorphing(graph, steps, ease, delay) {
	mxAnimation.call(this, delay);
	this.graph = graph;
	this.steps = (steps != null) ? steps: 6;
	this.ease = (ease != null) ? ease: 1.5;
};
mxMorphing.prototype = new mxAnimation();
mxMorphing.prototype.constructor = mxMorphing;
mxMorphing.prototype.graph = null;
mxMorphing.prototype.steps = null;
mxMorphing.prototype.step = 0;
mxMorphing.prototype.ease = null;
mxMorphing.prototype.cells = null;
mxMorphing.prototype.updateAnimation = function() {
	var move = new mxCellStatePreview(this.graph);
	if (this.cells != null) {
		for (var i = 0; i < this.cells.length; i++) {
			this.animateCell(cells[i], move, false);
		}
	} else {
		this.animateCell(this.graph.getModel().getRoot(), move, true);
	}
	this.show(move);
	if (move.isEmpty() || this.step++>=this.steps) {
		this.stopAnimation();
	}
};
mxMorphing.prototype.show = function(move) {
	move.show();
};
mxMorphing.prototype.animateCell = function(cell, move, recurse) {
	var state = this.graph.getView().getState(cell);
	var delta = null;
	if (state != null) {
		delta = this.getDelta(state);
		if (this.graph.getModel().isVertex(cell) && (delta.x != 0 || delta.y != 0)) {
			var translate = this.graph.view.getTranslate();
			var scale = this.graph.view.getScale();
			delta.x += translate.x * scale;
			delta.y += translate.y * scale;
			move.moveState(state, -delta.x / this.ease, -delta.y / this.ease);
		}
	}
	if (recurse && !this.stopRecursion(state, delta)) {
		var childCount = this.graph.getModel().getChildCount(cell);
		for (var i = 0; i < childCount; i++) {
			this.animateCell(this.graph.getModel().getChildAt(cell, i), move, recurse);
		}
	}
};
mxMorphing.prototype.stopRecursion = function(state, delta) {
	return delta != null && (delta.x != 0 || delta.y != 0);
};
mxMorphing.prototype.getDelta = function(state) {
	var origin = this.getOriginForCell(state.cell);
	var translate = this.graph.getView().getTranslate();
	var scale = this.graph.getView().getScale();
	var current = new mxPoint(state.x / scale - translate.x, state.y / scale - translate.y);
	return new mxPoint((origin.x - current.x) * scale, (origin.y - current.y) * scale);
};
mxMorphing.prototype.getOriginForCell = function(cell) {
	var result = null;
	if (cell != null) {
		result = this.getOriginForCell(this.graph.getModel().getParent(cell));
		var geo = this.graph.getCellGeometry(cell);
		if (geo != null) {
			result.x += geo.x;
			result.y += geo.y;
		}
	}
	if (result == null) {
		var t = this.graph.view.getTranslate();
		result = new mxPoint( - t.x, -t.y);
	}
	return result;
};
function mxImageBundle(alt) {
	this.images = [];
	this.alt = (alt != null) ? alt: false;
};
mxImageBundle.prototype.images = null;
mxImageBundle.prototype.images = null;
mxImageBundle.prototype.putImage = function(key, value, fallback) {
	this.images[key] = {
		value: value,
		fallback: fallback
	};
};
mxImageBundle.prototype.getImage = function(key) {
	var result = null;
	if (key != null) {
		var img = this.images[key];
		if (img != null) {
			result = (this.alt) ? img.fallback: img.value;
		}
	}
	return result;
};
function mxImageExport() {
	this.initShapes();
	this.initMarkers();
};
mxImageExport.prototype.includeOverlays = false;
mxImageExport.prototype.glassSize = 0.4;
mxImageExport.prototype.shapes = null;
mxImageExport.prototype.markers = null;
mxImageExport.prototype.drawState = function(state, canvas) {
	if (state != null) {
		if (state.shape != null) {
			var shape = (state.shape.stencil != null) ? state.shape.stencil: this.shapes[state.style[mxConstants.STYLE_SHAPE]];
			if (shape == null) {
				if (typeof(state.shape.redrawPath) == 'function') {
					shape = this.createShape(state, canvas);
				} else if (state.view.graph.getModel().isVertex(state.cell)) {
					shape = this.shapes['rectangle'];
				}
			}
			if (shape != null) {
				this.drawShape(state, canvas, shape);
				if (this.includeOverlays) {
					this.drawOverlays(state, canvas);
				}
			}
		}
		var graph = state.view.graph;
		var childCount = graph.model.getChildCount(state.cell);
		for (var i = 0; i < childCount; i++) {
			var childState = graph.view.getState(graph.model.getChildAt(state.cell, i));
			this.drawState(childState, canvas);
		}
	}
};
mxImageExport.prototype.createShape = function(state, canvas) {
	return {
		drawShape: function(canvas, state, bounds, background) {
			var x0 = bounds.x;
			var y0 = bounds.y;
			var path = {
				moveTo: function(x, y) {
					canvas.moveTo(x0 + x, y0 + y);
				},
				lineTo: function(x, y) {
					canvas.lineTo(x0 + x, y0 + y);
				},
				quadTo: function(x1, y1, x, y) {
					canvas.quadTo(x0 + x1, y0 + y1, x0 + x, y0 + y);
				},
				curveTo: function(x1, y1, x2, y2, x, y) {
					canvas.curveTo(x0 + x1, y0 + y1, x0 + x2, y0 + y2, x0 + x, y0 + y);
				},
				end: function() {},
				close: function() {
					canvas.close();
				}
			};
			if (!background) {
				canvas.fillAndStroke();
			}
			canvas.begin();
			state.shape.redrawPath(path, bounds.x, bounds.y, bounds.width, bounds.height, !background);
			if (!background) {
				canvas.fillAndStroke();
			}
			return true;
		}
	};
};
mxImageExport.prototype.drawOverlays = function(state, canvas) {
	if (state.overlays != null) {
		for (var i = 0; i < state.overlays.length; i++) {
			if (state.overlays[i].bounds != null) {
				var bounds = state.overlays[i].bounds;
				canvas.image(bounds.x, bounds.y, bounds.width, bounds.height, state.overlays[i].image);
			}
		}
	}
};
mxImageExport.prototype.drawShape = function(state, canvas, shape) {
	var rotation = mxUtils.getNumber(state.style, mxConstants.STYLE_ROTATION, 0);
	var direction = mxUtils.getValue(state.style, mxConstants.STYLE_DIRECTION, null);
	if (direction != null) {
		if (direction == 'north') {
			rotation += 270;
		} else if (direction == 'west') {
			rotation += 180;
		} else if (direction == 'south') {
			rotation += 90;
		}
	}
	var flipH = state.style[mxConstants.STYLE_STENCIL_FLIPH];
	var flipV = state.style[mxConstants.STYLE_STENCIL_FLIPV];
	if (flipH && flipV) {
		rotation += 180;
		flipH = false;
		flipV = false;
	}
	canvas.save();
	rotation = rotation % 360;
	if (rotation != 0 || flipH || flipV) {
		canvas.rotate(rotation, flipH, flipV, state.getCenterX(), state.getCenterY());
	}
	var scale = state.view.scale;
	var sw = mxUtils.getNumber(state.style, mxConstants.STYLE_STROKEWIDTH, 1) * scale;
	canvas.setStrokeWidth(sw);
	var sw2 = sw / 2;
	var bg = this.getBackgroundBounds(state);
	if (state.shape.stencil == null && (direction == 'south' || direction == 'north')) {
		var dx = (bg.width - bg.height) / 2;
		bg.x += dx;
		bg.y += -dx;
		var tmp = bg.width;
		bg.width = bg.height;
		bg.height = tmp;
	}
	var bb = new mxRectangle(bg.x - sw2, bg.y - sw2, bg.width + sw, bg.height + sw);
	var alpha = mxUtils.getValue(state.style, mxConstants.STYLE_OPACITY, 100) / 100;
	var shp = state.style[mxConstants.STYLE_SHAPE];
	var imageShape = shp == mxConstants.SHAPE_IMAGE;
	var gradientColor = (imageShape) ? null: mxUtils.getValue(state.style, mxConstants.STYLE_GRADIENTCOLOR);
	if (gradientColor == mxConstants.NONE) {
		gradientColor = null;
	}
	var fcKey = (imageShape) ? mxConstants.STYLE_IMAGE_BACKGROUND: mxConstants.STYLE_FILLCOLOR;
	var fillColor = mxUtils.getValue(state.style, fcKey, null);
	if (fillColor == mxConstants.NONE) {
		fillColor = null;
	}
	var scKey = (imageShape) ? mxConstants.STYLE_IMAGE_BORDER: mxConstants.STYLE_STROKECOLOR;
	var strokeColor = mxUtils.getValue(state.style, scKey, null);
	if (strokeColor == mxConstants.NONE) {
		strokeColor = null;
	}
	var glass = (fillColor != null && (shp == mxConstants.SHAPE_LABEL || shp == mxConstants.SHAPE_RECTANGLE));
	if (fillColor != null && mxUtils.getValue(state.style, mxConstants.STYLE_SHADOW, false)) {
		this.drawShadow(canvas, state, shape, rotation, flipH, flipV, bg, alpha);
	}
	canvas.setAlpha(alpha);
	if (mxUtils.getValue(state.style, mxConstants.STYLE_DASHED, '0') == '1') {
		canvas.setDashed(true);
		var dash = state.style['dashPattern'];
		if (dash != null) {
			canvas.setDashPattern(dash);
		}
	}
	if (strokeColor != null || fillColor != null) {
		if (strokeColor != null) {
			canvas.setStrokeColor(strokeColor);
		}
		if (fillColor != null) {
			if (gradientColor != null && gradientColor != 'transparent') {
				canvas.setGradient(fillColor, gradientColor, bg.x, bg.y, bg.width, bg.height, direction);
			} else {
				canvas.setFillColor(fillColor);
			}
		}
		glass = shape.drawShape(canvas, state, bg, true) && glass;
		shape.drawShape(canvas, state, bg, false);
	}
	if (glass && mxUtils.getValue(state.style, mxConstants.STYLE_GLASS, 0) == 1) {
		this.drawGlass(state, canvas, bb, shape, this.glassSize);
	}
	if (imageShape || shp == mxConstants.SHAPE_LABEL) {
		var src = state.view.graph.getImage(state);
		if (src != null) {
			var imgBounds = this.getImageBounds(state);
			if (imgBounds != null) {
				this.drawImage(state, canvas, imgBounds, src);
			}
		}
	}
	canvas.restore();
	var txt = state.text;
	var label = state.view.graph.getLabel(state.cell);
	if (txt != null && label != null && label.length > 0) {
		canvas.save();
		canvas.setAlpha(mxUtils.getValue(state.style, mxConstants.STYLE_TEXT_OPACITY, 100) / 100);
		var bounds = new mxRectangle(txt.boundingBox.x, txt.boundingBox.y, txt.boundingBox.width, txt.boundingBox.height);
		var vert = mxUtils.getValue(state.style, mxConstants.STYLE_HORIZONTAL, 1) == 0;
		bounds.y += 2;
		if (vert) {
			if (txt.dialect != mxConstants.DIALECT_SVG) {
				var cx = bounds.x + bounds.width / 2;
				var cy = bounds.y + bounds.height / 2;
				var tmp = bounds.width;
				bounds.width = bounds.height;
				bounds.height = tmp;
				bounds.x = cx - bounds.width / 2;
				bounds.y = cy - bounds.height / 2;
			} else if (txt.dialect == mxConstants.DIALECT_SVG) {
				var b = state.y + state.height;
				var cx = bounds.getCenterX() - state.x;
				var cy = bounds.getCenterY() - state.y;
				var y = b - cx - bounds.height / 2;
				bounds.x = state.x + cy - bounds.width / 2;
				bounds.y = y;
			}
		}
		this.drawLabelBackground(state, canvas, bounds, vert);
		this.drawLabel(state, canvas, bounds, vert, label);
		canvas.restore();
	}
};
mxImageExport.prototype.drawShadow = function(canvas, state, shape, rotation, flipH, flipV, bounds, alpha) {
	var rad = rotation * Math.PI / 180;
	var cos = Math.cos( - rad);
	var sin = Math.sin( - rad);
	var offset = mxUtils.getRotatedPoint(new mxPoint(mxConstants.SHADOW_OFFSET_X, mxConstants.SHADOW_OFFSET_Y), cos, sin);
	if (flipH) {
		offset.x *= -1;
	}
	if (flipV) {
		offset.y *= -1;
	}
	canvas.translate(offset.x, offset.y);
	if (shape.drawShape(canvas, state, bounds, true)) {
		canvas.setAlpha(mxConstants.SHADOW_OPACITY * alpha);
		canvas.shadow(mxConstants.SHADOWCOLOR);
	}
	canvas.translate( - offset.x, -offset.y);
};
mxImageExport.prototype.drawGlass = function(state, canvas, bounds, shape, size) {
	if (shape.drawShape(canvas, state, bounds, true)) {
		canvas.save();
		canvas.clip();
		canvas.setGlassGradient(bounds.x, bounds.y, bounds.width, bounds.height);
		canvas.begin();
		canvas.moveTo(bounds.x, bounds.y);
		canvas.lineTo(bounds.x, (bounds.y + bounds.height * size));
		canvas.quadTo((bounds.x + bounds.width * 0.5), (bounds.y + bounds.height * 0.7), bounds.x + bounds.width, (bounds.y + bounds.height * size));
		canvas.lineTo(bounds.x + bounds.width, bounds.y);
		canvas.close();
		canvas.fill();
		canvas.restore();
	}
};
mxImageExport.prototype.drawImage = function(state, canvas, bounds, image) {
	var aspect = mxUtils.getValue(state.style, mxConstants.STYLE_IMAGE_ASPECT, 1) == 1;
	var flipH = mxUtils.getValue(state.style, mxConstants.STYLE_IMAGE_FLIPH, 0) == 1;
	var flipV = mxUtils.getValue(state.style, mxConstants.STYLE_IMAGE_FLIPV, 0) == 1;
	canvas.image(bounds.x, bounds.y, bounds.width, bounds.height, image, aspect, flipH, flipV);
};
mxImageExport.prototype.drawLabelBackground = function(state, canvas, bounds, vert) {
	var stroke = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_BORDERCOLOR);
	var fill = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_BACKGROUNDCOLOR);
	if (stroke == mxConstants.NONE) {
		stroke = null;
	}
	if (fill == mxConstants.NONE) {
		fill = null;
	}
	if (stroke != null || fill != null) {
		var x = bounds.x;
		var y = bounds.y - mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_PADDING, 0);
		var w = bounds.width;
		var h = bounds.height;
		if (vert) {
			x += (w - h) / 2;
			y += (h - w) / 2;
			var tmp = w;
			w = h;
			h = tmp;
		}
		if (fill != null) {
			canvas.setFillColor(fill);
		}
		if (stroke != null) {
			canvas.setStrokeColor(stroke);
			canvas.setStrokeWidth(1);
			canvas.setDashed(false);
		}
		canvas.rect(x, y, w, h);
		if (fill != null && stroke != null) {
			canvas.fillAndStroke();
		} else if (fill != null) {
			canvas.fill();
		} else if (stroke != null) {
			canvas.stroke();
		}
	}
};
mxImageExport.prototype.drawLabel = function(state, canvas, bounds, vert, str) {
	var scale = state.view.scale;
	canvas.setFontColor(mxUtils.getValue(state.style, mxConstants.STYLE_FONTCOLOR, '#000000'));
	canvas.setFontFamily(mxUtils.getValue(state.style, mxConstants.STYLE_FONTFAMILY, mxConstants.DEFAULT_FONTFAMILY));
	canvas.setFontStyle(mxUtils.getValue(state.style, mxConstants.STYLE_FONTSTYLE, 0));
	canvas.setFontSize(mxUtils.getValue(state.style, mxConstants.STYLE_FONTSIZE, mxConstants.DEFAULT_FONTSIZE) * scale);
	var align = mxUtils.getValue(state.style, mxConstants.STYLE_ALIGN, mxConstants.ALIGN_LEFT);
	if (align == 'left') {
		align = null;
	}
	var y = bounds.y - mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_PADDING, 0);
	var wrap = state.view.graph.isWrapping(state.cell);
	var html = state.view.graph.isHtmlLabel(state.cell);
	if (html && mxText.prototype.replaceLinefeeds) {
		str = str.replace(/\n/g, '<br/>');
	}
	canvas.text(bounds.x, y, bounds.width, bounds.height, str, align, null, vert, wrap, (html) ? 'html': '');
};
mxImageExport.prototype.getBackgroundBounds = function(state) {
	if (state.style[mxConstants.STYLE_SHAPE] == mxConstants.SHAPE_SWIMLANE) {
		var scale = state.view.scale;
		var start = mxUtils.getValue(state.style, mxConstants.STYLE_STARTSIZE, mxConstants.DEFAULT_STARTSIZE) * scale;
		var w = state.width;
		var h = state.height;
		if (mxUtils.getValue(state.style, mxConstants.STYLE_HORIZONTAL, true)) {
			h = start;
		} else {
			w = start;
		}
		return new mxRectangle(state.x, state.y, Math.min(state.width, w), Math.min(state.height, h));
	} else {
		return new mxRectangle(state.x, state.y, state.width, state.height);
	}
};
mxImageExport.prototype.getImageBounds = function(state) {
	var bounds = new mxRectangle(state.x, state.y, state.width, state.height);
	var style = state.style;
	if (mxUtils.getValue(style, mxConstants.STYLE_SHAPE) != mxConstants.SHAPE_IMAGE) {
		var imgAlign = mxUtils.getValue(style, mxConstants.STYLE_IMAGE_ALIGN, mxConstants.ALIGN_LEFT);
		var imgValign = mxUtils.getValue(style, mxConstants.STYLE_IMAGE_VERTICAL_ALIGN, mxConstants.ALIGN_MIDDLE);
		var imgWidth = mxUtils.getValue(style, mxConstants.STYLE_IMAGE_WIDTH, mxConstants.DEFAULT_IMAGESIZE);
		var imgHeight = mxUtils.getValue(style, mxConstants.STYLE_IMAGE_HEIGHT, mxConstants.DEFAULT_IMAGESIZE);
		var spacing = mxUtils.getValue(style, mxConstants.STYLE_SPACING, 2);
		if (imgAlign == mxConstants.ALIGN_CENTER) {
			bounds.x += (bounds.width - imgWidth) / 2;
		} else if (imgAlign == mxConstants.ALIGN_RIGHT) {
			bounds.x += bounds.width - imgWidth - spacing - 2;
		} else {
			bounds.x += spacing + 4;
		}
		if (imgValign == mxConstants.ALIGN_TOP) {
			bounds.y += spacing;
		} else if (imgValign == mxConstants.ALIGN_BOTTOM) {
			bounds.y += bounds.height - imgHeight - spacing;
		} else {
			bounds.y += (bounds.height - imgHeight) / 2;
		}
		bounds.width = imgWidth;
		bounds.height = imgHeight;
	}
	return bounds;
};
mxImageExport.prototype.drawMarker = function(canvas, state, source) {
	var offset = null;
	var pts = state.absolutePoints;
	var n = pts.length;
	var p0 = (source) ? pts[1] : pts[n - 2];
	var pe = (source) ? pts[0] : pts[n - 1];
	var dx = pe.x - p0.x;
	var dy = pe.y - p0.y;
	var dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
	var unitX = dx / dist;
	var unitY = dy / dist;
	var size = mxUtils.getValue(state.style, (source) ? mxConstants.STYLE_STARTSIZE: mxConstants.STYLE_ENDSIZE, mxConstants.DEFAULT_MARKERSIZE);
	var sw = mxUtils.getValue(state.style, mxConstants.STYLE_STROKEWIDTH, 1);
	pe = pe.clone();
	var type = mxUtils.getValue(state.style, (source) ? mxConstants.STYLE_STARTARROW: mxConstants.STYLE_ENDARROW);
	var f = this.markers[type];
	if (f != null) {
		offset = f(canvas, state, type, pe, unitX, unitY, size, source, sw);
	}
	return offset;
};
mxImageExport.prototype.initShapes = function() {
	this.shapes = [];
	this.shapes['rectangle'] = {
		drawShape: function(canvas, state, bounds, background) {
			if (background) {
				if (mxUtils.getValue(state.style, mxConstants.STYLE_ROUNDED, false)) {
					var f = mxUtils.getValue(state.style, mxConstants.STYLE_ARCSIZE, mxConstants.RECTANGLE_ROUNDING_FACTOR * 100) / 100;
					var r = Math.min(bounds.width * f, bounds.height * f);
					canvas.roundrect(bounds.x, bounds.y, bounds.width, bounds.height, r, r);
				} else {
					canvas.rect(bounds.x, bounds.y, bounds.width, bounds.height);
				}
				return true;
			} else {
				canvas.fillAndStroke();
			}
		}
	};
	this.shapes['swimlane'] = {
		drawShape: function(canvas, state, bounds, background) {
			if (background) {
				if (mxUtils.getValue(state.style, mxConstants.STYLE_ROUNDED, false)) {
					var r = Math.min(bounds.width * mxConstants.RECTANGLE_ROUNDING_FACTOR, bounds.height * mxConstants.RECTANGLE_ROUNDING_FACTOR);
					canvas.roundrect(bounds.x, bounds.y, bounds.width, bounds.height, r, r);
				} else {
					canvas.rect(bounds.x, bounds.y, bounds.width, bounds.height);
				}
				return true;
			} else {
				canvas.fillAndStroke();
				var x = state.x;
				var y = state.y;
				var w = state.width;
				var h = state.height;
				if (mxUtils.getValue(state.style, mxConstants.STYLE_HORIZONTAL, 1) == 0) {
					x += bounds.width;
					w -= bounds.width;
				} else {
					y += bounds.height;
					h -= bounds.height;
				}
				canvas.begin();
				canvas.moveTo(x, y);
				canvas.lineTo(x, y + h);
				canvas.lineTo(x + w, y + h);
				canvas.lineTo(x + w, y);
				canvas.stroke();
			}
		}
	};
	this.shapes['image'] = this.shapes['rectangle'];
	this.shapes['label'] = this.shapes['rectangle'];
	var imageExport = this;
	this.shapes['connector'] = {
		translatePoint: function(points, index, offset) {
			if (offset != null) {
				var pt = points[index].clone();
				pt.x += offset.x;
				pt.y += offset.y;
				points[index] = pt;
			}
		},
		drawShape: function(canvas, state, bounds, background) {
			if (background) {
				return false;
			} else {
				var rounded = mxUtils.getValue(state.style, mxConstants.STYLE_ROUNDED, false);
				var arcSize = mxConstants.LINE_ARCSIZE / 2;
				canvas.setFillColor(mxUtils.getValue(state.style, mxConstants.STYLE_STROKECOLOR, "#000000"));
				canvas.setDashed(false);
				var pts = state.absolutePoints.slice();
				this.translatePoint(pts, 0, imageExport.drawMarker(canvas, state, true));
				this.translatePoint(pts, pts.length - 1, imageExport.drawMarker(canvas, state, false));
				canvas.setDashed(mxUtils.getValue(state.style, mxConstants.STYLE_DASHED, '0') == '1');
				var pt = pts[0];
				var pe = pts[pts.length - 1];
				canvas.begin();
				canvas.moveTo(pt.x, pt.y);
				for (var i = 1; i < pts.length - 1; i++) {
					var tmp = pts[i];
					var dx = pt.x - tmp.x;
					var dy = pt.y - tmp.y;
					if ((rounded && i < pts.length - 1) && (dx != 0 || dy != 0)) {
						var dist = Math.sqrt(dx * dx + dy * dy);
						var nx1 = dx * Math.min(arcSize, dist / 2) / dist;
						var ny1 = dy * Math.min(arcSize, dist / 2) / dist;
						var x1 = tmp.x + nx1;
						var y1 = tmp.y + ny1;
						canvas.lineTo(x1, y1);
						var next = pts[i + 1];
						dx = next.x - tmp.x;
						dy = next.y - tmp.y;
						dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
						var nx2 = dx * Math.min(arcSize, dist / 2) / dist;
						var ny2 = dy * Math.min(arcSize, dist / 2) / dist;
						var x2 = tmp.x + nx2;
						var y2 = tmp.y + ny2;
						canvas.curveTo(tmp.x, tmp.y, tmp.x, tmp.y, x2, y2);
						tmp = new mxPoint(x2, y2);
					} else {
						canvas.lineTo(tmp.x, tmp.y);
					}
					pt = tmp;
				}
				canvas.lineTo(pe.x, pe.y);
				canvas.stroke();
			}
		}
	};
	this.shapes['arrow'] = {
		drawShape: function(canvas, state, bounds, background) {
			if (background) {
				var spacing = mxConstants.ARROW_SPACING;
				var width = mxConstants.ARROW_WIDTH;
				var arrow = mxConstants.ARROW_SIZE;
				var pts = state.absolutePoints;
				var p0 = pts[0];
				var pe = pts[pts.length - 1];
				var dx = pe.x - p0.x;
				var dy = pe.y - p0.y;
				var dist = Math.sqrt(dx * dx + dy * dy);
				var length = dist - 2 * spacing - arrow;
				var nx = dx / dist;
				var ny = dy / dist;
				var basex = length * nx;
				var basey = length * ny;
				var floorx = width * ny / 3;
				var floory = -width * nx / 3;
				var p0x = p0.x - floorx / 2 + spacing * nx;
				var p0y = p0.y - floory / 2 + spacing * ny;
				var p1x = p0x + floorx;
				var p1y = p0y + floory;
				var p2x = p1x + basex;
				var p2y = p1y + basey;
				var p3x = p2x + floorx;
				var p3y = p2y + floory;
				var p5x = p3x - 3 * floorx;
				var p5y = p3y - 3 * floory;
				canvas.begin();
				canvas.moveTo(p0x, p0y);
				canvas.lineTo(p1x, p1y);
				canvas.lineTo(p2x, p2y);
				canvas.lineTo(p3x, p3y);
				canvas.lineTo(pe.x - spacing * nx, pe.y - spacing * ny);
				canvas.lineTo(p5x, p5y);
				canvas.lineTo(p5x + floorx, p5y + floory);
				canvas.close();
				return true;
			} else {
				canvas.fillAndStroke();
			}
		}
	};
	this.shapes['cylinder'] = {
		drawShape: function(canvas, state, bounds, background) {
			if (background) {
				return false;
			} else {
				var x = bounds.x;
				var y = bounds.y;
				var w = bounds.width;
				var h = bounds.height;
				var dy = Math.min(mxCylinder.prototype.maxHeight, Math.floor(h / 5));
				canvas.begin();
				canvas.moveTo(x, y + dy);
				canvas.curveTo(x, y - dy / 3, x + w, y - dy / 3, x + w, y + dy);
				canvas.lineTo(x + w, y + h - dy);
				canvas.curveTo(x + w, y + h + dy / 3, x, y + h + dy / 3, x, y + h - dy);
				canvas.close();
				canvas.fillAndStroke();
				canvas.begin();
				canvas.moveTo(x, y + dy);
				canvas.curveTo(x, y + 2 * dy, x + w, y + 2 * dy, x + w, y + dy);
				canvas.stroke();
			}
		}
	};
	this.shapes['line'] = {
		drawShape: function(canvas, state, bounds, background) {
			if (background) {
				return false;
			} else {
				canvas.begin();
				var mid = state.getCenterY();
				canvas.moveTo(bounds.x, mid);
				canvas.lineTo(bounds.x + bounds.width, mid);
				canvas.stroke();
			}
		}
	};
	this.shapes['ellipse'] = {
		drawShape: function(canvas, state, bounds, background) {
			if (background) {
				canvas.ellipse(bounds.x, bounds.y, bounds.width, bounds.height);
				return true;
			} else {
				canvas.fillAndStroke();
			}
		}
	};
	this.shapes['doubleEllipse'] = {
		drawShape: function(canvas, state, bounds, background) {
			var x = bounds.x;
			var y = bounds.y;
			var w = bounds.width;
			var h = bounds.height;
			if (background) {
				canvas.ellipse(x, y, w, h);
				return true;
			} else {
				canvas.fillAndStroke();
				var inset = Math.min(4, Math.min(w / 5, h / 5));
				x += inset;
				y += inset;
				w -= 2 * inset;
				h -= 2 * inset;
				if (w > 0 && h > 0) {
					canvas.ellipse(x, y, w, h);
				}
				canvas.stroke();
			}
		}
	};
	this.shapes['triangle'] = {
		drawShape: function(canvas, state, bounds, background) {
			if (background) {
				var x = bounds.x;
				var y = bounds.y;
				var w = bounds.width;
				var h = bounds.height;
				canvas.begin();
				canvas.moveTo(x, y);
				canvas.lineTo(x + w, y + h / 2);
				canvas.lineTo(x, y + h);
				canvas.close();
				return true;
			} else {
				canvas.fillAndStroke();
			}
		}
	};
	this.shapes['rhombus'] = {
		drawShape: function(canvas, state, bounds, background) {
			if (background) {
				var x = bounds.x;
				var y = bounds.y;
				var w = bounds.width;
				var h = bounds.height;
				var hw = w / 2;
				var hh = h / 2;
				canvas.begin();
				canvas.moveTo(x + hw, y);
				canvas.lineTo(x + w, y + hh);
				canvas.lineTo(x + hw, y + h);
				canvas.lineTo(x, y + hh);
				canvas.close();
				return true;
			} else {
				canvas.fillAndStroke();
			}
		}
	};
	this.shapes['hexagon'] = {
		drawShape: function(canvas, state, bounds, background) {
			if (background) {
				var x = bounds.x;
				var y = bounds.y;
				var w = bounds.width;
				var h = bounds.height;
				canvas.begin();
				canvas.moveTo(x + 0.25 * w, y);
				canvas.lineTo(x + 0.75 * w, y);
				canvas.lineTo(x + w, y + 0.5 * h);
				canvas.lineTo(x + 0.75 * w, y + h);
				canvas.lineTo(x + 0.25 * w, y + h);
				canvas.lineTo(x, y + 0.5 * h);
				canvas.close();
				return true;
			} else {
				canvas.fillAndStroke();
			}
		}
	};
	this.shapes['actor'] = {
		drawShape: function(canvas, state, bounds, background) {
			if (background) {
				var x = bounds.x;
				var y = bounds.y;
				var w = bounds.width;
				var h = bounds.height;
				var width = w * 2 / 6;
				canvas.begin();
				canvas.moveTo(x, y + h);
				canvas.curveTo(x, y + 3 * h / 5, x, y + 2 * h / 5, x + w / 2, y + 2 * h / 5);
				canvas.curveTo(x + w / 2 - width, y + 2 * h / 5, x + w / 2 - width, y, x + w / 2, y);
				canvas.curveTo(x + w / 2 + width, y, x + w / 2 + width, y + 2 * h / 5, x + w / 2, y + 2 * h / 5);
				canvas.curveTo(x + w, y + 2 * h / 5, x + w, y + 3 * h / 5, x + w, y + h);
				canvas.close();
				return true;
			} else {
				canvas.fillAndStroke();
			}
		}
	};
	this.shapes['cloud'] = {
		drawShape: function(canvas, state, bounds, background) {
			if (background) {
				var x = bounds.x;
				var y = bounds.y;
				var w = bounds.width;
				var h = bounds.height;
				canvas.begin();
				canvas.moveTo(x + 0.25 * w, y + 0.25 * h);
				canvas.curveTo(x + 0.05 * w, y + 0.25 * h, x, y + 0.5 * h, x + 0.16 * w, y + 0.55 * h);
				canvas.curveTo(x, y + 0.66 * h, x + 0.18 * w, y + 0.9 * h, x + 0.31 * w, y + 0.8 * h);
				canvas.curveTo(x + 0.4 * w, y + h, x + 0.7 * w, y + h, x + 0.8 * w, y + 0.8 * h);
				canvas.curveTo(x + w, y + 0.8 * h, x + w, y + 0.6 * h, x + 0.875 * w, y + 0.5 * h);
				canvas.curveTo(x + w, y + 0.3 * h, x + 0.8 * w, y + 0.1 * h, x + 0.625 * w, y + 0.2 * h);
				canvas.curveTo(x + 0.5 * w, y + 0.05 * h, x + 0.3 * w, y + 0.05 * h, x + 0.25 * w, y + 0.25 * h);
				canvas.close();
				return true;
			} else {
				canvas.fillAndStroke();
			}
		}
	};
};
mxImageExport.prototype.initMarkers = function() {
	this.markers = [];
	var tmp = function(canvas, state, type, pe, unitX, unitY, size, source, sw) {
		var endOffsetX = unitX * sw * 1.118;
		var endOffsetY = unitY * sw * 1.118;
		pe.x -= endOffsetX;
		pe.y -= endOffsetY;
		unitX = unitX * (size + sw);
		unitY = unitY * (size + sw);
		canvas.begin();
		canvas.moveTo(pe.x, pe.y);
		canvas.lineTo(pe.x - unitX - unitY / 2, pe.y - unitY + unitX / 2);
		if (type == mxConstants.ARROW_CLASSIC) {
			canvas.lineTo(pe.x - unitX * 3 / 4, pe.y - unitY * 3 / 4);
		}
		canvas.lineTo(pe.x + unitY / 2 - unitX, pe.y - unitY - unitX / 2);
		canvas.close();
		var key = (source) ? mxConstants.STYLE_STARTFILL: mxConstants.STYLE_ENDFILL;
		if (state.style[key] == 0) {
			canvas.stroke();
		} else {
			canvas.fillAndStroke();
		}
		var f = (type != mxConstants.ARROW_CLASSIC) ? 1 : 3 / 4;
		return new mxPoint( - unitX * f - endOffsetX, -unitY * f - endOffsetY);
	};
	this.markers['classic'] = tmp;
	this.markers['block'] = tmp;
	this.markers['open'] = function(canvas, state, type, pe, unitX, unitY, size, source, sw) {
		var endOffsetX = unitX * sw * 1.118;
		var endOffsetY = unitY * sw * 1.118;
		pe.x -= endOffsetX;
		pe.y -= endOffsetY;
		unitX = unitX * (size + sw);
		unitY = unitY * (size + sw);
		canvas.begin();
		canvas.moveTo(pe.x - unitX - unitY / 2, pe.y - unitY + unitX / 2);
		canvas.lineTo(pe.x, pe.y);
		canvas.lineTo(pe.x + unitY / 2 - unitX, pe.y - unitY - unitX / 2);
		canvas.stroke();
		return new mxPoint( - endOffsetX * 2, -endOffsetY * 2);
	};
	this.markers['oval'] = function(canvas, state, type, pe, unitX, unitY, size, source, sw) {
		var a = size / 2;
		canvas.ellipse(pe.x - a, pe.y - a, size, size);
		var key = (source) ? mxConstants.STYLE_STARTFILL: mxConstants.STYLE_ENDFILL;
		if (state.style[key] == 0) {
			canvas.stroke();
		} else {
			canvas.fillAndStroke();
		}
		return new mxPoint( - unitX / 2, -unitY / 2);
	};
	var tmp_diamond = function(canvas, state, type, pe, unitX, unitY, size, source, sw) {
		var swFactor = (type == mxConstants.ARROW_DIAMOND) ? 0.7071 : 0.9862;
		var endOffsetX = unitX * sw * swFactor;
		var endOffsetY = unitY * sw * swFactor;
		unitX = unitX * (size + sw);
		unitY = unitY * (size + sw);
		pe.x -= endOffsetX;
		pe.y -= endOffsetY;
		var tk = ((type == mxConstants.ARROW_DIAMOND) ? 2 : 3.4);
		canvas.begin();
		canvas.moveTo(pe.x, pe.y);
		canvas.lineTo(pe.x - unitX / 2 - unitY / tk, pe.y + unitX / tk - unitY / 2);
		canvas.lineTo(pe.x - unitX, pe.y - unitY);
		canvas.lineTo(pe.x - unitX / 2 + unitY / tk, pe.y - unitY / 2 - unitX / tk);
		canvas.close();
		var key = (source) ? mxConstants.STYLE_STARTFILL: mxConstants.STYLE_ENDFILL;
		if (state.style[key] == 0) {
			canvas.stroke();
		} else {
			canvas.fillAndStroke();
		}
		return new mxPoint( - endOffsetX - unitX, -endOffsetY - unitY);
	};
	this.markers['diamond'] = tmp_diamond;
	this.markers['diamondThin'] = tmp_diamond;
};
var mxXmlCanvas2D = function(root) {
	var converter = new mxUrlConverter();
	var compressed = true;
	var textEnabled = true;
	var doc = root.ownerDocument;
	var stack = [];
	var state = {
		alpha: 1,
		dashed: false,
		strokewidth: 1,
		fontsize: mxConstants.DEFAULT_FONTSIZE,
		fontfamily: mxConstants.DEFAULT_FONTFAMILY,
		fontcolor: '#000000'
	};
	var f2 = function(x) {
		return Math.round(parseFloat(x) * 100) / 100;
	};
	return {
		getConverter: function() {
			return converter;
		},
		isCompressed: function() {
			return compressed;
		},
		setCompressed: function(value) {
			compressed = value;
		},
		isTextEnabled: function() {
			return textEnabled;
		},
		setTextEnabled: function(value) {
			textEnabled = value;
		},
		getDocument: function() {
			return doc;
		},
		save: function() {
			if (compressed) {
				stack.push(state);
				state = mxUtils.clone(state);
			}
			root.appendChild(doc.createElement('save'));
		},
		restore: function() {
			if (compressed) {
				state = stack.pop();
			}
			root.appendChild(doc.createElement('restore'));
		},
		scale: function(value) {
			var elem = doc.createElement('scale');
			elem.setAttribute('scale', value);
			root.appendChild(elem);
		},
		translate: function(dx, dy) {
			var elem = doc.createElement('translate');
			elem.setAttribute('dx', f2(dx));
			elem.setAttribute('dy', f2(dy));
			root.appendChild(elem);
		},
		rotate: function(theta, flipH, flipV, cx, cy) {
			var elem = doc.createElement('rotate');
			elem.setAttribute('theta', f2(theta));
			elem.setAttribute('flipH', (flipH) ? '1': '0');
			elem.setAttribute('flipV', (flipV) ? '1': '0');
			elem.setAttribute('cx', f2(cx));
			elem.setAttribute('cy', f2(cy));
			root.appendChild(elem);
		},
		setStrokeWidth: function(value) {
			if (compressed) {
				if (state.strokewidth == value) {
					return;
				}
				state.strokewidth = value;
			}
			var elem = doc.createElement('strokewidth');
			elem.setAttribute('width', f2(value));
			root.appendChild(elem);
		},
		setStrokeColor: function(value) {
			var elem = doc.createElement('strokecolor');
			elem.setAttribute('color', value);
			root.appendChild(elem);
		},
		setDashed: function(value) {
			if (compressed) {
				if (state.dashed == value) {
					return;
				}
				state.dashed = value;
			}
			var elem = doc.createElement('dashed');
			elem.setAttribute('dashed', (value) ? '1': '0');
			root.appendChild(elem);
		},
		setDashPattern: function(value) {
			var elem = doc.createElement('dashpattern');
			elem.setAttribute('pattern', value);
			root.appendChild(elem);
		},
		setLineCap: function(value) {
			var elem = doc.createElement('linecap');
			elem.setAttribute('cap', value);
			root.appendChild(elem);
		},
		setLineJoin: function(value) {
			var elem = doc.createElement('linejoin');
			elem.setAttribute('join', value);
			root.appendChild(elem);
		},
		setMiterLimit: function(value) {
			var elem = doc.createElement('miterlimit');
			elem.setAttribute('limit', value);
			root.appendChild(elem);
		},
		setFontSize: function(value) {
			if (textEnabled) {
				if (compressed) {
					if (state.fontsize == value) {
						return;
					}
					state.fontsize = value;
				}
				var elem = doc.createElement('fontsize');
				elem.setAttribute('size', value);
				root.appendChild(elem);
			}
		},
		setFontColor: function(value) {
			if (textEnabled) {
				if (compressed) {
					if (state.fontcolor == value) {
						return;
					}
					state.fontcolor = value;
				}
				var elem = doc.createElement('fontcolor');
				elem.setAttribute('color', value);
				root.appendChild(elem);
			}
		},
		setFontFamily: function(value) {
			if (textEnabled) {
				if (compressed) {
					if (state.fontfamily == value) {
						return;
					}
					state.fontfamily = value;
				}
				var elem = doc.createElement('fontfamily');
				elem.setAttribute('family', value);
				root.appendChild(elem);
			}
		},
		setFontStyle: function(value) {
			if (textEnabled) {
				var elem = doc.createElement('fontstyle');
				elem.setAttribute('style', value);
				root.appendChild(elem);
			}
		},
		setAlpha: function(alpha) {
			if (compressed) {
				if (state.alpha == alpha) {
					return;
				}
				state.alpha = alpha;
			}
			var elem = doc.createElement('alpha');
			elem.setAttribute('alpha', f2(alpha));
			root.appendChild(elem);
		},
		setFillColor: function(value) {
			var elem = doc.createElement('fillcolor');
			elem.setAttribute('color', value);
			root.appendChild(elem);
		},
		setGradient: function(color1, color2, x, y, w, h, direction) {
			var elem = doc.createElement('gradient');
			elem.setAttribute('c1', color1);
			elem.setAttribute('c2', color2);
			elem.setAttribute('x', f2(x));
			elem.setAttribute('y', f2(y));
			elem.setAttribute('w', f2(w));
			elem.setAttribute('h', f2(h));
			if (direction != null) {
				elem.setAttribute('direction', direction);
			}
			root.appendChild(elem);
		},
		setGlassGradient: function(x, y, w, h) {
			var elem = doc.createElement('glass');
			elem.setAttribute('x', f2(x));
			elem.setAttribute('y', f2(y));
			elem.setAttribute('w', f2(w));
			elem.setAttribute('h', f2(h));
			root.appendChild(elem);
		},
		rect: function(x, y, w, h) {
			var elem = doc.createElement('rect');
			elem.setAttribute('x', f2(x));
			elem.setAttribute('y', f2(y));
			elem.setAttribute('w', f2(w));
			elem.setAttribute('h', f2(h));
			root.appendChild(elem);
		},
		roundrect: function(x, y, w, h, dx, dy) {
			var elem = doc.createElement('roundrect');
			elem.setAttribute('x', f2(x));
			elem.setAttribute('y', f2(y));
			elem.setAttribute('w', f2(w));
			elem.setAttribute('h', f2(h));
			elem.setAttribute('dx', f2(dx));
			elem.setAttribute('dy', f2(dy));
			root.appendChild(elem);
		},
		ellipse: function(x, y, w, h) {
			var elem = doc.createElement('ellipse');
			elem.setAttribute('x', f2(x));
			elem.setAttribute('y', f2(y));
			elem.setAttribute('w', f2(w));
			elem.setAttribute('h', f2(h));
			root.appendChild(elem);
		},
		image: function(x, y, w, h, src, aspect, flipH, flipV) {
			src = converter.convert(src);
			var elem = doc.createElement('image');
			elem.setAttribute('x', f2(x));
			elem.setAttribute('y', f2(y));
			elem.setAttribute('w', f2(w));
			elem.setAttribute('h', f2(h));
			elem.setAttribute('src', src);
			elem.setAttribute('aspect', (aspect) ? '1': '0');
			elem.setAttribute('flipH', (flipH) ? '1': '0');
			elem.setAttribute('flipV', (flipV) ? '1': '0');
			root.appendChild(elem);
		},
		text: function(x, y, w, h, str, align, valign, vertical, wrap, format) {
			if (textEnabled) {
				var elem = doc.createElement('text');
				elem.setAttribute('x', f2(x));
				elem.setAttribute('y', f2(y));
				elem.setAttribute('w', f2(w));
				elem.setAttribute('h', f2(h));
				elem.setAttribute('str', str);
				if (align != null) {
					elem.setAttribute('align', align);
				}
				if (valign != null) {
					elem.setAttribute('valign', valign);
				}
				elem.setAttribute('vertical', (vertical) ? '1': '0');
				elem.setAttribute('wrap', (wrap) ? '1': '0');
				elem.setAttribute('format', format);
				root.appendChild(elem);
			}
		},
		begin: function() {
			root.appendChild(doc.createElement('begin'));
		},
		moveTo: function(x, y) {
			var elem = doc.createElement('move');
			elem.setAttribute('x', f2(x));
			elem.setAttribute('y', f2(y));
			root.appendChild(elem);
		},
		lineTo: function(x, y) {
			var elem = doc.createElement('line');
			elem.setAttribute('x', f2(x));
			elem.setAttribute('y', f2(y));
			root.appendChild(elem);
		},
		quadTo: function(x1, y1, x2, y2) {
			var elem = doc.createElement('quad');
			elem.setAttribute('x1', f2(x1));
			elem.setAttribute('y1', f2(y1));
			elem.setAttribute('x2', f2(x2));
			elem.setAttribute('y2', f2(y2));
			root.appendChild(elem);
		},
		curveTo: function(x1, y1, x2, y2, x3, y3) {
			var elem = doc.createElement('curve');
			elem.setAttribute('x1', f2(x1));
			elem.setAttribute('y1', f2(y1));
			elem.setAttribute('x2', f2(x2));
			elem.setAttribute('y2', f2(y2));
			elem.setAttribute('x3', f2(x3));
			elem.setAttribute('y3', f2(y3));
			root.appendChild(elem);
		},
		close: function() {
			root.appendChild(doc.createElement('close'));
		},
		stroke: function() {
			root.appendChild(doc.createElement('stroke'));
		},
		fill: function() {
			root.appendChild(doc.createElement('fill'));
		},
		fillAndStroke: function() {
			root.appendChild(doc.createElement('fillstroke'));
		},
		shadow: function(value) {
			var elem = doc.createElement('shadow');
			elem.setAttribute('value', value);
			root.appendChild(elem);
		},
		clip: function() {
			root.appendChild(doc.createElement('clip'));
		}
	};
};
var mxSvgCanvas2D = function(root, styleEnabled) {
	styleEnabled = (styleEnabled != null) ? styleEnabled: false;
	var converter = new mxUrlConverter();
	var autoAntiAlias = true;
	var textEnabled = true;
	var foEnabled = true;
	var create = function(tagName, namespace) {
		if (root.ownerDocument.createElementNS != null) {
			return root.ownerDocument.createElementNS(namespace || mxConstants.NS_SVG, tagName);
		} else {
			var elt = root.ownerDocument.createElement(tagName);
			if (namespace != null) {
				elt.setAttribute('xmlns', namespace);
			}
			return elt;
		}
	};
	var defs = create('defs');
	if (styleEnabled) {
		var style = create('style');
		style.setAttribute('type', 'text/css');
		mxUtils.write(style, 'svg{font-family:' + mxConstants.DEFAULT_FONTFAMILY + ';font-size:' + mxConstants.DEFAULT_FONTSIZE + ';fill:none;stroke-miterlimit:10}');
		if (autoAntiAlias) {
			mxUtils.write(style, 'rect{shape-rendering:crispEdges}');
		}
		defs.appendChild(style);
	}
	root.appendChild(defs);
	var currentState = {
		dx: 0,
		dy: 0,
		scale: 1,
		transform: '',
		fill: null,
		gradient: null,
		stroke: null,
		strokeWidth: 1,
		dashed: false,
		dashpattern: '3 3',
		alpha: 1,
		linecap: 'flat',
		linejoin: 'miter',
		miterlimit: 10,
		fontColor: '#000000',
		fontSize: mxConstants.DEFAULT_FONTSIZE,
		fontFamily: mxConstants.DEFAULT_FONTFAMILY,
		fontStyle: 0
	};
	var currentPathIsOrthogonal = true;
	var glassGradient = null;
	var currentNode = null;
	var currentPath = null;
	var lastPoint = null;
	var gradients = [];
	var refCount = 0;
	var stack = [];
	var createGradientId = function(start, end, direction) {
		if (start.charAt(0) == '#') {
			start = start.substring(1);
		}
		if (end.charAt(0) == '#') {
			end = end.substring(1);
		}
		start = start.toLowerCase();
		end = end.toLowerCase();
		var dir = null;
		if (direction == null || direction == mxConstants.DIRECTION_SOUTH) {
			dir = 's';
		} else if (direction == mxConstants.DIRECTION_EAST) {
			dir = 'e';
		} else {
			var tmp = start;
			start = end;
			end = tmp;
			if (direction == mxConstants.DIRECTION_NORTH) {
				dir = 's';
			} else if (direction == mxConstants.DIRECTION_WEST) {
				dir = 'e';
			}
		}
		return start + '-' + end + '-' + dir;
	};
	var createHtmlBody = function(str, align, valign) {
		var style = 'margin:0px;font-size:' + Math.floor(currentState.fontSize) + 'px;' + 'font-family:' + currentState.fontFamily + ';color:' + currentState.fontColor + ';';
		if ((currentState.fontStyle & mxConstants.FONT_BOLD) == mxConstants.FONT_BOLD) {
			style += 'font-weight:bold;';
		}
		if ((currentState.fontStyle & mxConstants.FONT_ITALIC) == mxConstants.FONT_ITALIC) {
			style += 'font-style:italic;';
		}
		if ((currentState.fontStyle & mxConstants.FONT_UNDERLINE) == mxConstants.FONT_UNDERLINE) {
			style += 'font-decoration:underline;';
		}
		if (align == mxConstants.ALIGN_CENTER) {
			style += 'text-align:center;';
		} else if (align == mxConstants.ALIGN_RIGHT) {
			style += 'text-align:right;';
		}
		var body = create('body', 'http://www.w3.org/1999/xhtml');
		body.setAttribute('style', style);
		var node = mxUtils.parseXml('<div xmlns="http://www.w3.org/1999/xhtml">' + str + '</div>').documentElement;
		if (body.ownerDocument.importNode != null) {
			node = body.ownerDocument.importNode(node, true);
		}
		body.appendChild(node);
		return body;
	};
	var getSvgGradient = function(start, end, direction) {
		var id = createGradientId(start, end, direction);
		var gradient = gradients[id];
		if (gradient == null) {
			gradient = create('linearGradient');
			gradient.setAttribute('id', ++refCount);
			gradient.setAttribute('x1', '0%');
			gradient.setAttribute('y1', '0%');
			gradient.setAttribute('x2', '0%');
			gradient.setAttribute('y2', '0%');
			if (direction == null || direction == mxConstants.DIRECTION_SOUTH) {
				gradient.setAttribute('y2', '100%');
			} else if (direction == mxConstants.DIRECTION_EAST) {
				gradient.setAttribute('x2', '100%');
			} else if (direction == mxConstants.DIRECTION_NORTH) {
				gradient.setAttribute('y1', '100%');
			} else if (direction == mxConstants.DIRECTION_WEST) {
				gradient.setAttribute('x1', '100%');
			}
			var stop = create('stop');
			stop.setAttribute('offset', '0%');
			stop.setAttribute('style', 'stop-color:' + start);
			gradient.appendChild(stop);
			stop = create('stop');
			stop.setAttribute('offset', '100%');
			stop.setAttribute('style', 'stop-color:' + end);
			gradient.appendChild(stop);
			defs.appendChild(gradient);
			gradients[id] = gradient;
		}
		return gradient.getAttribute('id');
	};
	var appendNode = function(node, state, filled, stroked) {
		if (node != null) {
			if (state.clip != null) {
				node.setAttribute('clip-path', 'url(#' + state.clip + ')');
				state.clip = null;
			}
			if (currentPath != null) {
				node.setAttribute('d', currentPath.join(' '));
				currentPath = null;
				if (autoAntiAlias && currentPathIsOrthogonal) {
					node.setAttribute('shape-rendering', 'crispEdges');
					state.strokeWidth = Math.max(1, state.strokeWidth);
				}
			}
			if (state.alpha < 1) {
				node.setAttribute('opacity', state.alpha);
			}
			if (filled && (state.fill != null || state.gradient != null)) {
				if (state.gradient != null) {
					node.setAttribute('fill', 'url(#' + state.gradient + ')');
				} else {
					node.setAttribute('fill', state.fill.toLowerCase());
				}
			} else if (!styleEnabled) {
				node.setAttribute('fill', 'none');
			}
			if (stroked && state.stroke != null) {
				node.setAttribute('stroke', state.stroke.toLowerCase());
				if (state.strokeWidth != 1) {
					if (node.nodeName == 'rect' && autoAntiAlias) {
						state.strokeWidth = Math.max(1, state.strokeWidth);
					}
					node.setAttribute('stroke-width', state.strokeWidth);
				}
				if (node.nodeName == 'path') {
					if (state.linejoin != null && state.linejoin != 'miter') {
						node.setAttribute('stroke-linejoin', state.linejoin);
					}
					if (state.linecap != null) {
						var value = state.linecap;
						if (value == 'flat') {
							value = 'butt';
						}
						if (value != 'butt') {
							node.setAttribute('stroke-linecap', value);
						}
					}
					if (state.miterlimit != null && (!styleEnabled || state.miterlimit != 10)) {
						node.setAttribute('stroke-miterlimit', state.miterlimit);
					}
				}
				if (state.dashed) {
					var dash = state.dashpattern.split(' ');
					if (dash.length > 0) {
						var pat = [];
						for (var i = 0; i < dash.length; i++) {
							pat[i] = Number(dash[i]) * currentState.strokeWidth;
						}
						node.setAttribute('stroke-dasharray', pat.join(' '));
					}
				}
			}
			if (state.transform.length > 0) {
				node.setAttribute('transform', state.transform);
			}
			root.appendChild(node);
		}
	};
	var f2 = function(x) {
		return Math.round(parseFloat(x) * 100) / 100;
	};
	return {
		getConverter: function() {
			return converter;
		},
		isAutoAntiAlias: function() {
			return autoAntiAlias;
		},
		setAutoAntiAlias: function(value) {
			autoAntiAlias = value;
		},
		isTextEnabled: function() {
			return textEnabled;
		},
		setTextEnabled: function(value) {
			textEnabled = value;
		},
		isFoEnabled: function() {
			return foEnabled;
		},
		setFoEnabled: function(value) {
			foEnabled = value;
		},
		save: function() {
			stack.push(currentState);
			currentState = mxUtils.clone(currentState);
		},
		restore: function() {
			currentState = stack.pop();
		},
		scale: function(value) {
			currentState.scale *= value;
			currentState.strokeWidth *= value;
		},
		translate: function(dx, dy) {
			currentState.dx += dx;
			currentState.dy += dy;
		},
		rotate: function(theta, flipH, flipV, cx, cy) {
			cx += currentState.dx;
			cy += currentState.dy;
			cx *= currentState.scale;
			cy *= currentState.scale;
			if (flipH ^ flipV) {
				var tx = (flipH) ? cx: 0;
				var sx = (flipH) ? -1 : 1;
				var ty = (flipV) ? cy: 0;
				var sy = (flipV) ? -1 : 1;
				currentState.transform += 'translate(' + f2(tx) + ',' + f2(ty) + ')';
				currentState.transform += 'scale(' + f2(sx) + ',' + f2(sy) + ')';
				currentState.transform += 'translate(' + f2( - tx) + ' ' + f2( - ty) + ')';
			}
			currentState.transform += 'rotate(' + f2(theta) + ',' + f2(cx) + ',' + f2(cy) + ')';
		},
		setStrokeWidth: function(value) {
			currentState.strokeWidth = value * currentState.scale;
		},
		setStrokeColor: function(value) {
			currentState.stroke = value;
		},
		setDashed: function(value) {
			currentState.dashed = value;
		},
		setDashPattern: function(value) {
			currentState.dashpattern = value;
		},
		setLineCap: function(value) {
			currentState.linecap = value;
		},
		setLineJoin: function(value) {
			currentState.linejoin = value;
		},
		setMiterLimit: function(value) {
			currentState.miterlimit = value;
		},
		setFontSize: function(value) {
			currentState.fontSize = value;
		},
		setFontColor: function(value) {
			currentState.fontColor = value;
		},
		setFontFamily: function(value) {
			currentState.fontFamily = value;
		},
		setFontStyle: function(value) {
			currentState.fontStyle = value;
		},
		setAlpha: function(alpha) {
			currentState.alpha = alpha;
		},
		setFillColor: function(value) {
			currentState.fill = value;
			currentState.gradient = null;
		},
		setGradient: function(color1, color2, x, y, w, h, direction) {
			if (color1 != null && color2 != null) {
				currentState.gradient = getSvgGradient(color1, color2, direction);
				currentState.fill = color1;
			}
		},
		setGlassGradient: function(x, y, w, h) {
			if (glassGradient == null) {
				glassGradient = create('linearGradient');
				glassGradient.setAttribute('id', '0');
				glassGradient.setAttribute('x1', '0%');
				glassGradient.setAttribute('y1', '0%');
				glassGradient.setAttribute('x2', '0%');
				glassGradient.setAttribute('y2', '100%');
				var stop1 = create('stop');
				stop1.setAttribute('offset', '0%');
				stop1.setAttribute('style', 'stop-color:#ffffff;stop-opacity:0.9');
				glassGradient.appendChild(stop1);
				var stop2 = create('stop');
				stop2.setAttribute('offset', '100%');
				stop2.setAttribute('style', 'stop-color:#ffffff;stop-opacity:0.1');
				glassGradient.appendChild(stop2);
				if (defs.firstChild.nextSibling != null) {
					defs.insertBefore(glassGradient, defs.firstChild.nextSibling);
				} else {
					defs.appendChild(glassGradient);
				}
			}
			currentState.gradient = '0';
		},
		rect: function(x, y, w, h) {
			x += currentState.dx;
			y += currentState.dy;
			currentNode = create('rect');
			currentNode.setAttribute('x', f2(x * currentState.scale));
			currentNode.setAttribute('y', f2(y * currentState.scale));
			currentNode.setAttribute('width', f2(w * currentState.scale));
			currentNode.setAttribute('height', f2(h * currentState.scale));
			if (!styleEnabled && autoAntiAlias) {
				currentNode.setAttribute('shape-rendering', 'crispEdges');
			}
		},
		roundrect: function(x, y, w, h, dx, dy) {
			x += currentState.dx;
			y += currentState.dy;
			currentNode = create('rect');
			currentNode.setAttribute('x', f2(x * currentState.scale));
			currentNode.setAttribute('y', f2(y * currentState.scale));
			currentNode.setAttribute('width', f2(w * currentState.scale));
			currentNode.setAttribute('height', f2(h * currentState.scale));
			if (dx > 0) {
				currentNode.setAttribute('rx', f2(dx * currentState.scale));
			}
			if (dy > 0) {
				currentNode.setAttribute('ry', f2(dy * currentState.scale));
			}
			if (!styleEnabled && autoAntiAlias) {
				currentNode.setAttribute('shape-rendering', 'crispEdges');
			}
		},
		ellipse: function(x, y, w, h) {
			x += currentState.dx;
			y += currentState.dy;
			currentNode = create('ellipse');
			currentNode.setAttribute('cx', f2((x + w / 2) * currentState.scale));
			currentNode.setAttribute('cy', f2((y + h / 2) * currentState.scale));
			currentNode.setAttribute('rx', f2(w / 2 * currentState.scale));
			currentNode.setAttribute('ry', f2(h / 2 * currentState.scale));
		},
		image: function(x, y, w, h, src, aspect, flipH, flipV) {
			src = converter.convert(src);
			aspect = (aspect != null) ? aspect: true;
			flipH = (flipH != null) ? flipH: false;
			flipV = (flipV != null) ? flipV: false;
			x += currentState.dx;
			y += currentState.dy;
			var node = create('image');
			node.setAttribute('x', f2(x * currentState.scale));
			node.setAttribute('y', f2(y * currentState.scale));
			node.setAttribute('width', f2(w * currentState.scale));
			node.setAttribute('height', f2(h * currentState.scale));
			if (mxClient.IS_VML) {
				node.setAttribute('xlink:href', src);
			} else {
				node.setAttributeNS(mxConstants.NS_XLINK, 'xlink:href', src);
			}
			if (!aspect) {
				node.setAttribute('preserveAspectRatio', 'none');
			}
			if (currentState.alpha < 1) {
				node.setAttribute('opacity', currentState.alpha);
			}
			var tr = currentState.transform;
			if (flipH || flipV) {
				var sx = 1;
				var sy = 1;
				var dx = 0;
				var dy = 0;
				if (flipH) {
					sx = -1;
					dx = -w - 2 * x;
				}
				if (flipV) {
					sy = -1;
					dy = -h - 2 * y;
				}
				tr += 'scale(' + sx + ',' + sy + ')translate(' + dx + ',' + dy + ')';
			}
			if (tr.length > 0) {
				node.setAttribute('transform', tr);
			}
			root.appendChild(node);
		},
		text: function(x, y, w, h, str, align, valign, vertical, wrap, format) {
			if (textEnabled) {
				x += currentState.dx;
				y += currentState.dy;
				if (foEnabled && format == 'html') {
					var node = create('g');
					node.setAttribute('transform', currentState.transform + 'scale(' + currentState.scale + ',' + currentState.scale + ')');
					if (currentState.alpha < 1) {
						node.setAttribute('opacity', currentState.alpha);
					}
					var fo = create('foreignObject');
					fo.setAttribute('x', Math.round(x));
					fo.setAttribute('y', Math.round(y));
					fo.setAttribute('width', Math.round(w));
					fo.setAttribute('height', Math.round(h));
					fo.appendChild(createHtmlBody(str, align, valign));
					node.appendChild(fo);
					root.appendChild(node);
				} else {
					var size = Math.floor(currentState.fontSize);
					var node = create('g');
					var tr = currentState.transform;
					if (vertical) {
						var cx = x + w / 2;
						var cy = y + h / 2;
						tr += 'rotate(-90,' + f2(cx * currentState.scale) + ',' + f2(cy * currentState.scale) + ')';
					}
					if (tr.length > 0) {
						node.setAttribute('transform', tr);
					}
					if (currentState.alpha < 1) {
						node.setAttribute('opacity', currentState.alpha);
					}
					var anchor = (align == mxConstants.ALIGN_RIGHT) ? 'end': (align == mxConstants.ALIGN_CENTER) ? 'middle': 'start';
					if (anchor == 'end') {
						x += Math.max(0, w - 2);
					} else if (anchor == 'middle') {
						x += w / 2;
					} else {
						x += (w > 0) ? 2 : 0;
					}
					if ((currentState.fontStyle & mxConstants.FONT_BOLD) == mxConstants.FONT_BOLD) {
						node.setAttribute('font-weight', 'bold');
					}
					if ((currentState.fontStyle & mxConstants.FONT_ITALIC) == mxConstants.FONT_ITALIC) {
						node.setAttribute('font-style', 'italic');
					}
					if ((currentState.fontStyle & mxConstants.FONT_UNDERLINE) == mxConstants.FONT_UNDERLINE) {
						node.setAttribute('text-decoration', 'underline');
					}
					if (anchor != 'start') {
						node.setAttribute('text-anchor', anchor);
					}
					if (!styleEnabled || size != mxConstants.DEFAULT_FONTSIZE) {
						node.setAttribute('font-size', Math.floor(size * currentState.scale) + 'px');
					}
					if (!styleEnabled || currentState.fontFamily != mxConstants.DEFAULT_FONTFAMILY) {
						node.setAttribute('font-family', currentState.fontFamily);
					}
					node.setAttribute('fill', currentState.fontColor);
					var lines = str.split('\n');
					var lineHeight = size * 1.25;
					var textHeight = (h > 0) ? size + (lines.length - 1) * lineHeight: lines.length * lineHeight - 1;
					var dy = h - textHeight;
					if (valign == null || valign == mxConstants.ALIGN_TOP) {
						y = Math.max(y - 3 * currentState.scale, y + dy / 2 + ((h > 0) ? lineHeight / 2 - 8 : 0));
					} else if (valign == mxConstants.ALIGN_MIDDLE) {
						y = y + dy / 2;
					} else if (valign == mxConstants.ALIGN_BOTTOM) {
						y = Math.min(y, y + dy + 2 * currentState.scale);
					}
					y += size;
					for (var i = 0; i < lines.length; i++) {
						var text = create('text');
						text.setAttribute('x', f2(x * currentState.scale));
						text.setAttribute('y', f2(y * currentState.scale));
						mxUtils.write(text, lines[i]);
						node.appendChild(text);
						y += size * 1.3;
					}
					root.appendChild(node);
				}
			}
		},
		begin: function() {
			currentNode = create('path');
			currentPath = [];
			lastPoint = null;
			currentPathIsOrthogonal = true;
		},
		moveTo: function(x, y) {
			if (currentPath != null) {
				x += currentState.dx;
				y += currentState.dy;
				currentPath.push('M ' + f2(x * currentState.scale) + ' ' + f2(y * currentState.scale));
				if (autoAntiAlias) {
					lastPoint = new mxPoint(x, y);
				}
			}
		},
		lineTo: function(x, y) {
			if (currentPath != null) {
				x += currentState.dx;
				y += currentState.dy;
				currentPath.push('L ' + f2(x * currentState.scale) + ' ' + f2(y * currentState.scale));
				if (autoAntiAlias) {
					if (lastPoint != null && currentPathIsOrthogonal && x != lastPoint.x && y != lastPoint.y) {
						currentPathIsOrthogonal = false;
					}
					lastPoint = new mxPoint(x, y);
				}
			}
		},
		quadTo: function(x1, y1, x2, y2) {
			if (currentPath != null) {
				x1 += currentState.dx;
				y1 += currentState.dy;
				x2 += currentState.dx;
				y2 += currentState.dy;
				currentPath.push('Q ' + f2(x1 * currentState.scale) + ' ' + f2(y1 * currentState.scale) + ' ' + f2(x2 * currentState.scale) + ' ' + f2(y2 * currentState.scale));
				currentPathIsOrthogonal = false;
			}
		},
		curveTo: function(x1, y1, x2, y2, x3, y3) {
			if (currentPath != null) {
				x1 += currentState.dx;
				y1 += currentState.dy;
				x2 += currentState.dx;
				y2 += currentState.dy;
				x3 += currentState.dx;
				y3 += currentState.dy;
				currentPath.push('C ' + f2(x1 * currentState.scale) + ' ' + f2(y1 * currentState.scale) + ' ' + f2(x2 * currentState.scale) + ' ' + f2(y2 * currentState.scale) + ' ' + f2(x3 * currentState.scale) + ' ' + f2(y3 * currentState.scale));
				currentPathIsOrthogonal = false;
			}
		},
		close: function() {
			if (currentPath != null) {
				currentPath.push('Z');
			}
		},
		stroke: function() {
			appendNode(currentNode, currentState, false, true);
		},
		fill: function() {
			appendNode(currentNode, currentState, true, false);
		},
		fillAndStroke: function() {
			appendNode(currentNode, currentState, true, true);
		},
		shadow: function(value) {
			this.save();
			this.setStrokeColor(value);
			this.setFillColor(value);
			this.fillAndStroke();
			this.restore();
		},
		clip: function() {
			if (currentNode != null) {
				if (currentPath != null) {
					currentNode.setAttribute('d', currentPath.join(' '));
					currentPath = null;
				}
				var id = ++refCount;
				var clip = create('clipPath');
				clip.setAttribute('id', id);
				clip.appendChild(currentNode);
				defs.appendChild(clip);
				currentState.clip = id;
			}
		}
	};
};
function mxGuide(graph, states) {
	this.graph = graph;
	this.setStates(states);
};
mxGuide.prototype.graph = null;
mxGuide.prototype.states = null;
mxGuide.prototype.horizontal = true;
mxGuide.prototype.vertical = true;
mxGuide.prototype.guideX = null;
mxGuide.prototype.guideY = null;
mxGuide.prototype.crisp = true;
mxGuide.prototype.setStates = function(states) {
	this.states = states;
};
mxGuide.prototype.isEnabledForEvent = function(evt) {
	return true;
};
mxGuide.prototype.getGuideTolerance = function() {
	return this.graph.gridSize * this.graph.view.scale / 2;
};
mxGuide.prototype.createGuideShape = function(horizontal) {
	var guide = new mxPolyline([], mxConstants.GUIDE_COLOR, mxConstants.GUIDE_STROKEWIDTH);
	guide.crisp = this.crisp;
	guide.isDashed = true;
	return guide;
};
mxGuide.prototype.move = function(bounds, delta, gridEnabled) {
	if (this.states != null && (this.horizontal || this.vertical) && bounds != null && delta != null) {
		var trx = this.graph.getView().translate;
		var scale = this.graph.getView().scale;
		var dx = delta.x;
		var dy = delta.y;
		var overrideX = false;
		var overrideY = false;
		var tt = this.getGuideTolerance();
		var ttX = tt;
		var ttY = tt;
		var b = bounds.clone();
		b.x += delta.x;
		b.y += delta.y;
		var left = b.x;
		var right = b.x + b.width;
		var center = b.getCenterX();
		var top = b.y;
		var bottom = b.y + b.height;
		var middle = b.getCenterY();
		function snapX(x) {
			x += this.graph.panDx;
			var override = false;
			if (Math.abs(x - center) < ttX) {
				dx = x - bounds.getCenterX();
				ttX = Math.abs(x - center);
				override = true;
			} else if (Math.abs(x - left) < ttX) {
				dx = x - bounds.x;
				ttX = Math.abs(x - left);
				override = true;
			} else if (Math.abs(x - right) < ttX) {
				dx = x - bounds.x - bounds.width;
				ttX = Math.abs(x - right);
				override = true;
			}
			if (override) {
				if (this.guideX == null) {
					this.guideX = this.createGuideShape(true);
					this.guideX.dialect = (this.graph.dialect != mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_VML: mxConstants.DIALECT_SVG;
					this.guideX.init(this.graph.getView().getOverlayPane());
					if (this.graph.dialect == mxConstants.DIALECT_SVG) {
						this.guideX.node.setAttribute('pointer-events', 'none');
						this.guideX.pipe.setAttribute('pointer-events', 'none');
					}
				}
				var c = this.graph.container;
				x -= this.graph.panDx;
				this.guideX.points = [new mxPoint(x, -this.graph.panDy), new mxPoint(x, c.scrollHeight - 3 - this.graph.panDy)];
			}
			overrideX = overrideX || override;
		};
		function snapY(y) {
			y += this.graph.panDy;
			var override = false;
			if (Math.abs(y - middle) < ttY) {
				dy = y - bounds.getCenterY();
				ttY = Math.abs(y - middle);
				override = true;
			} else if (Math.abs(y - top) < ttY) {
				dy = y - bounds.y;
				ttY = Math.abs(y - top);
				override = true;
			} else if (Math.abs(y - bottom) < ttY) {
				dy = y - bounds.y - bounds.height;
				ttY = Math.abs(y - bottom);
				override = true;
			}
			if (override) {
				if (this.guideY == null) {
					this.guideY = this.createGuideShape(false);
					this.guideY.dialect = (this.graph.dialect != mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_VML: mxConstants.DIALECT_SVG;
					this.guideY.init(this.graph.getView().getOverlayPane());
					if (this.graph.dialect == mxConstants.DIALECT_SVG) {
						this.guideY.node.setAttribute('pointer-events', 'none');
						this.guideY.pipe.setAttribute('pointer-events', 'none');
					}
				}
				var c = this.graph.container;
				y -= this.graph.panDy;
				this.guideY.points = [new mxPoint( - this.graph.panDx, y), new mxPoint(c.scrollWidth - 3 - this.graph.panDx, y)];
			}
			overrideY = overrideY || override;
		};
		for (var i = 0; i < this.states.length; i++) {
			var state = this.states[i];
			if (state != null) {
				if (this.horizontal) {
					snapX.call(this, state.getCenterX());
					snapX.call(this, state.x);
					snapX.call(this, state.x + state.width);
				}
				if (this.vertical) {
					snapY.call(this, state.getCenterY());
					snapY.call(this, state.y);
					snapY.call(this, state.y + state.height);
				}
			}
		}
		if (!overrideX && this.guideX != null) {
			this.guideX.node.style.visibility = 'hidden';
		} else if (this.guideX != null) {
			this.guideX.node.style.visibility = 'visible';
			this.guideX.redraw();
		}
		if (!overrideY && this.guideY != null) {
			this.guideY.node.style.visibility = 'hidden';
		} else if (this.guideY != null) {
			this.guideY.node.style.visibility = 'visible';
			this.guideY.redraw();
		}
		if (gridEnabled) {
			if (!overrideX) {
				var tx = bounds.x - (this.graph.snap(bounds.x / scale - trx.x) + trx.x) * scale;
				dx = this.graph.snap(dx / scale) * scale - tx;
			}
			if (!overrideY) {
				var ty = bounds.y - (this.graph.snap(bounds.y / scale - trx.y) + trx.y) * scale;
				dy = this.graph.snap(dy / scale) * scale - ty;
			}
		}
		delta = new mxPoint(dx, dy);
	}
	return delta;
};
mxGuide.prototype.hide = function() {
	if (this.guideX != null) {
		this.guideX.node.style.visibility = 'hidden';
	}
	if (this.guideY != null) {
		this.guideY.node.style.visibility = 'hidden';
	}
};
mxGuide.prototype.destroy = function() {
	if (this.guideX != null) {
		this.guideX.destroy();
		this.guideX = null;
	}
	if (this.guideY != null) {
		this.guideY.destroy();
		this.guideY = null;
	}
};
function mxShape() {};
mxShape.prototype.SVG_STROKE_TOLERANCE = 8;
mxShape.prototype.scale = 1;
mxShape.prototype.dialect = null;
mxShape.prototype.crisp = false;
mxShape.prototype.mixedModeHtml = true;
mxShape.prototype.preferModeHtml = true;
mxShape.prototype.bounds = null;
mxShape.prototype.points = null;
mxShape.prototype.node = null;
mxShape.prototype.label = null;
mxShape.prototype.innerNode = null;
mxShape.prototype.style = null;
mxShape.prototype.startOffset = null;
mxShape.prototype.endOffset = null;
mxShape.prototype.vmlNodes = ['node', 'strokeNode', 'fillNode', 'shadowNode'];
mxShape.prototype.setCursor = function(cursor) {
	if (cursor == null) {
		cursor = '';
	}
	this.cursor = cursor;
	if (this.innerNode != null) {
		this.innerNode.style.cursor = cursor;
	}
	if (this.node != null) {
		this.node.style.cursor = cursor;
	}
	if (this.pipe != null) {
		this.pipe.style.cursor = cursor;
	}
};
mxShape.prototype.getCursor = function() {
	return this.cursor;
};
mxShape.prototype.init = function(container) {
	if (this.node == null) {
		this.node = this.create(container);
		if (container != null) {
			var vmlFix = document.documentMode == 8 && mxUtils.isVml(this.node);
			if (vmlFix) {
				for (var i = 0; i < this.vmlNodes.length; i++) {
					if (this[this.vmlNodes[i]] != null) {
						this[this.vmlNodes[i]].setAttribute('id', 'mxTemporaryReference-' + this.vmlNodes[i]);
					}
				}
				container.insertAdjacentHTML('beforeEnd', this.node.outerHTML);
				for (var i = 0; i < this.vmlNodes.length; i++) {
					if (this[this.vmlNodes[i]] != null) {
						this[this.vmlNodes[i]] = container.ownerDocument.getElementById('mxTemporaryReference-' + this.vmlNodes[i]);
						this[this.vmlNodes[i]].removeAttribute('id');
					}
				}
			} else {
				container.appendChild(this.node);
			}
		}
	}
	if (this.insertGradientNode != null) {
		this.insertGradient(this.insertGradientNode);
		this.insertGradientNode = null;
	}
};
mxShape.prototype.insertGradient = function(node) {
	if (node != null) {
		var count = 0;
		var id = node.getAttribute('id');
		var gradient = document.getElementById(id);
		while (gradient != null && gradient.ownerSVGElement != this.node.ownerSVGElement) {
			count++;
			id = node.getAttribute('id') + '-' + count;
			gradient = document.getElementById(id);
		}
		if (gradient == null) {
			node.setAttribute('id', id);
			this.node.ownerSVGElement.appendChild(node);
			gradient = node;
		}
		if (gradient != null) {
			var ref = 'url(#' + id + ')';
			var tmp = (this.innerNode != null) ? this.innerNode: this.node;
			if (tmp != null && tmp.getAttribute('fill') != ref) {
				tmp.setAttribute('fill', ref);
			}
		}
	}
};
mxShape.prototype.isMixedModeHtml = function() {
	return this.mixedModeHtml && !this.isRounded && !this.isShadow && this.gradient == null && mxUtils.getValue(this.style, mxConstants.STYLE_GLASS, 0) == 0;
};
mxShape.prototype.create = function(container) {
	var node = null;
	if (this.dialect == mxConstants.DIALECT_SVG) {
		node = this.createSvg();
	} else if (this.dialect == mxConstants.DIALECT_STRICTHTML || (this.preferModeHtml && this.dialect == mxConstants.DIALECT_PREFERHTML) || (this.isMixedModeHtml() && this.dialect == mxConstants.DIALECT_MIXEDHTML)) {
		node = this.createHtml();
	} else {
		node = this.createVml();
	}
	return node;
};
mxShape.prototype.createHtml = function() {
	var node = document.createElement('DIV');
	this.configureHtmlShape(node);
	return node;
};
mxShape.prototype.destroy = function() {
	if (this.node != null) {
		mxEvent.release(this.node);
		if (this.node.parentNode != null) {
			this.node.parentNode.removeChild(this.node);
		}
		if (this.node.glassOverlay) {
			this.node.glassOverlay.parentNode.removeChild(this.node.glassOverlay);
			this.node.glassOverlay = null;
		}
		this.node = null;
	}
};
mxShape.prototype.apply = function(state) {
	var style = state.style;
	this.style = style;
	if (style != null) {
		this.fill = mxUtils.getValue(style, mxConstants.STYLE_FILLCOLOR, this.fill);
		this.gradient = mxUtils.getValue(style, mxConstants.STYLE_GRADIENTCOLOR, this.gradient);
		this.gradientDirection = mxUtils.getValue(style, mxConstants.STYLE_GRADIENT_DIRECTION, this.gradientDirection);
		this.opacity = mxUtils.getValue(style, mxConstants.STYLE_OPACITY, this.opacity);
		this.stroke = mxUtils.getValue(style, mxConstants.STYLE_STROKECOLOR, this.stroke);
		this.strokewidth = mxUtils.getNumber(style, mxConstants.STYLE_STROKEWIDTH, this.strokewidth);
		this.isShadow = mxUtils.getValue(style, mxConstants.STYLE_SHADOW, this.isShadow);
		this.isDashed = mxUtils.getValue(style, mxConstants.STYLE_DASHED, this.isDashed);
		this.spacing = mxUtils.getValue(style, mxConstants.STYLE_SPACING, this.spacing);
		this.startSize = mxUtils.getNumber(style, mxConstants.STYLE_STARTSIZE, this.startSize);
		this.endSize = mxUtils.getNumber(style, mxConstants.STYLE_ENDSIZE, this.endSize);
		this.isRounded = mxUtils.getValue(style, mxConstants.STYLE_ROUNDED, this.isRounded);
		this.startArrow = mxUtils.getValue(style, mxConstants.STYLE_STARTARROW, this.startArrow);
		this.endArrow = mxUtils.getValue(style, mxConstants.STYLE_ENDARROW, this.endArrow);
		this.rotation = mxUtils.getValue(style, mxConstants.STYLE_ROTATION, this.rotation);
		this.direction = mxUtils.getValue(style, mxConstants.STYLE_DIRECTION, this.direction);
		if (this.fill == 'none') {
			this.fill = null;
		}
		if (this.gradient == 'none') {
			this.gradient = null;
		}
		if (this.stroke == 'none') {
			this.stroke = null;
		}
	}
};
mxShape.prototype.createSvgGroup = function(shape) {
	var g = document.createElementNS(mxConstants.NS_SVG, 'g');
	this.innerNode = document.createElementNS(mxConstants.NS_SVG, shape);
	this.configureSvgShape(this.innerNode);
	if (shape == 'rect' && this.strokewidth * this.scale >= 1 && !this.isRounded) {
		this.innerNode.setAttribute('shape-rendering', 'optimizeSpeed');
	}
	this.shadowNode = this.createSvgShadow(this.innerNode);
	if (this.shadowNode != null) {
		g.appendChild(this.shadowNode);
	}
	g.appendChild(this.innerNode);
	return g;
};
mxShape.prototype.createSvgShadow = function(node) {
	if (this.isShadow && this.fill != null) {
		var shadow = node.cloneNode(true);
		shadow.setAttribute('stroke', mxConstants.SHADOWCOLOR);
		shadow.setAttribute('fill', mxConstants.SHADOWCOLOR);
		shadow.setAttribute('opacity', mxConstants.SHADOW_OPACITY);
		return shadow;
	}
	return null;
};
mxShape.prototype.configureHtmlShape = function(node) {
	if (mxUtils.isVml(node)) {
		this.configureVmlShape(node);
	} else {
		node.style.position = 'absolute';
		node.style.overflow = 'hidden';
		var color = this.stroke;
		if (color != null && color != mxConstants.NONE) {
			node.style.borderColor = color;
			if (this.isDashed) {
				node.style.borderStyle = 'dashed';
			} else if (this.strokewidth > 0) {
				node.style.borderStyle = 'solid';
			}
			node.style.borderWidth = Math.ceil(this.strokewidth * this.scale) + 'px';
		} else {
			node.style.borderWidth = '0px';
		}
		color = this.fill;
		node.style.background = '';
		if (color != null && color != mxConstants.NONE) {
			node.style.backgroundColor = color;
		} else if (this.points == null) {
			this.configureTransparentBackground(node);
		}
		if (this.opacity != null) {
			mxUtils.setOpacity(node, this.opacity);
		}
	}
};
mxShape.prototype.updateVmlFill = function(node, c1, c2, dir, alpha) {
	node.color = c1;
	if (alpha != null && alpha != 100) {
		node.opacity = alpha + '%';
		if (c2 != null) {
			node.setAttribute('o:opacity2', alpha + '%');
		}
	}
	if (c2 != null) {
		node.type = 'gradient';
		node.color2 = c2;
		var angle = '180';
		if (this.gradientDirection == mxConstants.DIRECTION_EAST) {
			angle = '270';
		} else if (this.gradientDirection == mxConstants.DIRECTION_WEST) {
			angle = '90';
		} else if (this.gradientDirection == mxConstants.DIRECTION_NORTH) {
			angle = '0';
		}
		node.angle = angle;
	}
};
mxShape.prototype.updateVmlStrokeNode = function(parent) {
	if (this.strokeNode == null) {
		this.strokeNode = document.createElement('v:stroke');
		this.strokeNode.joinstyle = 'miter';
		this.strokeNode.miterlimit = 4;
		parent.appendChild(this.strokeNode);
	}
	if (this.opacity != null) {
		this.strokeNode.opacity = this.opacity + '%';
	}
	this.updateVmlDashStyle();
};
mxShape.prototype.updateVmlStrokeColor = function(node) {
	var color = this.stroke;
	if (color != null && color != mxConstants.NONE) {
		node.stroked = 'true';
		node.strokecolor = color;
	} else {
		node.stroked = 'false';
	}
};
mxShape.prototype.configureVmlShape = function(node) {
	node.style.position = 'absolute';
	this.updateVmlStrokeColor(node);
	node.style.background = '';
	var color = this.fill;
	if (color != null && color != mxConstants.NONE) {
		if (this.fillNode == null) {
			this.fillNode = document.createElement('v:fill');
			node.appendChild(this.fillNode);
		}
		this.updateVmlFill(this.fillNode, color, this.gradient, this.gradientDirection, this.opacity);
	} else {
		node.filled = 'false';
		if (this.points == null) {
			this.configureTransparentBackground(node);
		}
	}
	this.updateVmlStrokeNode(node);
	if (this.isShadow && this.fill != null) {
		if (this.shadowNode == null) {
			this.shadowNode = document.createElement('v:shadow');
			this.shadowNode.on = 'true';
			this.shadowNode.color = mxConstants.SHADOWCOLOR;
			this.shadowNode.opacity = (mxConstants.SHADOW_OPACITY * 100) + '%';
			node.appendChild(this.shadowNode);
		}
	}
	if (node.nodeName == 'roundrect') {
		try {
			var f = mxConstants.RECTANGLE_ROUNDING_FACTOR * 100;
			if (this.style != null) {
				f = mxUtils.getValue(this.style, mxConstants.STYLE_ARCSIZE, f);
			}
			node.setAttribute('arcsize', String(f) + '%');
		} catch(e) {}
	}
};
mxShape.prototype.configureTransparentBackground = function(node) {
	node.style.background = 'url(\'' + mxClient.imageBasePath + '/transparent.gif\')';
};
mxShape.prototype.configureSvgShape = function(node) {
	var color = this.stroke;
	if (color != null && color != mxConstants.NONE) {
		node.setAttribute('stroke', color);
	} else {
		node.setAttribute('stroke', 'none');
	}
	color = this.fill;
	if (color != null && color != mxConstants.NONE) {
		if (this.gradient != null) {
			var id = this.getGradientId(color, this.gradient);
			if (this.gradientNode != null && this.gradientNode.getAttribute('id') != id) {
				this.gradientNode = null;
				node.setAttribute('fill', '');
			}
			if (this.gradientNode == null) {
				this.gradientNode = this.createSvgGradient(id, color, this.gradient, node);
				node.setAttribute('fill', 'url(#' + id + ')');
			}
		} else {
			this.gradientNode = null;
			node.setAttribute('fill', color);
		}
	} else {
		node.setAttribute('fill', 'none');
	}
	if (this.opacity != null) {
		node.setAttribute('fill-opacity', this.opacity / 100);
		node.setAttribute('stroke-opacity', this.opacity / 100);
	}
};
mxShape.prototype.getGradientId = function(start, end) {
	if (start.charAt(0) == '#') {
		start = start.substring(1);
	}
	if (end.charAt(0) == '#') {
		end = end.substring(1);
	}
	start = start.toLowerCase();
	end = end.toLowerCase();
	var dir = null;
	if (this.gradientDirection == null || this.gradientDirection == mxConstants.DIRECTION_SOUTH) {
		dir = 'south';
	} else if (this.gradientDirection == mxConstants.DIRECTION_EAST) {
		dir = 'east';
	} else {
		var tmp = start;
		start = end;
		end = tmp;
		if (this.gradientDirection == mxConstants.DIRECTION_NORTH) {
			dir = 'south';
		} else if (this.gradientDirection == mxConstants.DIRECTION_WEST) {
			dir = 'east';
		}
	}
	return 'mx-gradient-' + start + '-' + end + '-' + dir;
};
mxShape.prototype.createSvgPipe = function(id, start, end, node) {
	var pipe = document.createElementNS(mxConstants.NS_SVG, 'path');
	pipe.setAttribute('pointer-events', 'stroke');
	pipe.setAttribute('fill', 'none');
	pipe.setAttribute('visibility', 'hidden');
	pipe.setAttribute('stroke', (false) ? 'none': 'white');
	return pipe;
};
mxShape.prototype.createSvgGradient = function(id, start, end, node) {
	var gradient = this.insertGradientNode;
	if (gradient == null) {
		gradient = document.createElementNS(mxConstants.NS_SVG, 'linearGradient');
		gradient.setAttribute('id', id);
		gradient.setAttribute('x1', '0%');
		gradient.setAttribute('y1', '0%');
		gradient.setAttribute('x2', '0%');
		gradient.setAttribute('y2', '0%');
		if (this.gradientDirection == null || this.gradientDirection == mxConstants.DIRECTION_SOUTH) {
			gradient.setAttribute('y2', '100%');
		} else if (this.gradientDirection == mxConstants.DIRECTION_EAST) {
			gradient.setAttribute('x2', '100%');
		} else if (this.gradientDirection == mxConstants.DIRECTION_NORTH) {
			gradient.setAttribute('y1', '100%');
		} else if (this.gradientDirection == mxConstants.DIRECTION_WEST) {
			gradient.setAttribute('x1', '100%');
		}
		var stop = document.createElementNS(mxConstants.NS_SVG, 'stop');
		stop.setAttribute('offset', '0%');
		stop.setAttribute('style', 'stop-color:' + start);
		gradient.appendChild(stop);
		stop = document.createElementNS(mxConstants.NS_SVG, 'stop');
		stop.setAttribute('offset', '100%');
		stop.setAttribute('style', 'stop-color:' + end);
		gradient.appendChild(stop);
	}
	this.insertGradientNode = gradient;
	return gradient;
};
mxShape.prototype.createPoints = function(moveCmd, lineCmd, curveCmd, isRelative) {
	var offsetX = (isRelative) ? this.bounds.x: 0;
	var offsetY = (isRelative) ? this.bounds.y: 0;
	var crisp = (this.crisp && this.dialect == mxConstants.DIALECT_SVG && mxClient.IS_IE) ? 0.5 : 0;
	if (isNaN(this.points[0].x) || isNaN(this.points[0].y)) {
		return null;
	}
	var size = mxConstants.LINE_ARCSIZE * this.scale;
	var p0 = this.points[0];
	if (this.startOffset != null) {
		p0 = p0.clone();
		p0.x += this.startOffset.x;
		p0.y += this.startOffset.y;
	}
	var points = moveCmd + ' ' + (Math.round(p0.x - offsetX) + crisp) + ' ' + (Math.round(p0.y - offsetY) + crisp) + ' ';
	for (var i = 1; i < this.points.length; i++) {
		p0 = this.points[i - 1];
		var pt = this.points[i];
		if (isNaN(pt.x) || isNaN(pt.y)) {
			return null;
		}
		if (i == this.points.length - 1 && this.endOffset != null) {
			pt = pt.clone();
			pt.x += this.endOffset.x;
			pt.y += this.endOffset.y;
		}
		var dx = p0.x - pt.x;
		var dy = p0.y - pt.y;
		if ((this.isRounded && i < this.points.length - 1) && (dx != 0 || dy != 0) && this.scale > 0.3) {
			var dist = Math.sqrt(dx * dx + dy * dy);
			var nx1 = dx * Math.min(size, dist / 2) / dist;
			var ny1 = dy * Math.min(size, dist / 2) / dist;
			points += lineCmd + ' ' + (Math.round(pt.x + nx1 - offsetX) + crisp) + ' ' + (Math.round(pt.y + ny1 - offsetY) + crisp) + ' ';
			var pe = this.points[i + 1];
			dx = pe.x - pt.x;
			dy = pe.y - pt.y;
			dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
			if (dist != 0) {
				var nx2 = dx * Math.min(size, dist / 2) / dist;
				var ny2 = dy * Math.min(size, dist / 2) / dist;
				points += curveCmd + ' ' + Math.round(pt.x - offsetX) + ' ' + Math.round(pt.y - offsetY) + ' ' + Math.round(pt.x - offsetX) + ',' + Math.round(pt.y - offsetY) + ' ' + (Math.round(pt.x + nx2 - offsetX) + crisp) + ' ' + (Math.round(pt.y + ny2 - offsetY) + crisp) + ' ';
			}
		} else {
			points += lineCmd + ' ' + (Math.round(pt.x - offsetX) + crisp) + ' ' + (Math.round(pt.y - offsetY) + crisp) + ' ';
		}
	}
	return points;
};
mxShape.prototype.updateHtmlShape = function(node) {
	if (node != null) {
		if (mxUtils.isVml(node)) {
			this.updateVmlShape(node);
		} else {
			var sw = Math.ceil(this.strokewidth * this.scale);
			node.style.borderWidth = Math.max(1, sw) + 'px';
			if (this.bounds != null && !isNaN(this.bounds.x) && !isNaN(this.bounds.y) && !isNaN(this.bounds.width) && !isNaN(this.bounds.height)) {
				node.style.left = Math.round(this.bounds.x - sw / 2) + 'px';
				node.style.top = Math.round(this.bounds.y - sw / 2) + 'px';
				if (document.compatMode == 'CSS1Compat') {
					sw = -sw;
				}
				node.style.width = Math.round(Math.max(0, this.bounds.width + sw)) + 'px';
				node.style.height = Math.round(Math.max(0, this.bounds.height + sw)) + 'px';
				if (this.bounds.width == 0 || this.bounds.height == 0) {
					node.style.visibility = 'hidden';
				} else {
					node.style.visibility = 'visible';
				}
			}
		}
		if (this.points != null && this.bounds != null && !mxUtils.isVml(node)) {
			if (this.divContainer == null) {
				this.divContainer = node;
			}
			while (this.divContainer.firstChild != null) {
				mxEvent.release(this.divContainer.firstChild);
				this.divContainer.removeChild(this.divContainer.firstChild);
			}
			node.style.borderStyle = '';
			node.style.background = '';
			if (this.points.length == 2) {
				var p0 = this.points[0];
				var pe = this.points[1];
				var dx = pe.x - p0.x;
				var dy = pe.y - p0.y;
				if (dx == 0 || dy == 0) {
					node.style.borderStyle = 'solid';
				} else {
					node.style.width = Math.round(this.bounds.width + 1) + 'px';
					node.style.height = Math.round(this.bounds.height + 1) + 'px';
					var length = Math.sqrt(dx * dx + dy * dy);
					var dotCount = 1 + (length / (8 * this.scale));
					var nx = dx / dotCount;
					var ny = dy / dotCount;
					var x = p0.x - this.bounds.x;
					var y = p0.y - this.bounds.y;
					for (var i = 0; i < dotCount; i++) {
						var tmp = document.createElement('DIV');
						tmp.style.position = 'absolute';
						tmp.style.overflow = 'hidden';
						tmp.style.left = Math.round(x) + 'px';
						tmp.style.top = Math.round(y) + 'px';
						tmp.style.width = Math.max(1, 2 * this.scale) + 'px';
						tmp.style.height = Math.max(1, 2 * this.scale) + 'px';
						tmp.style.backgroundColor = this.stroke;
						this.divContainer.appendChild(tmp);
						x += nx;
						y += ny;
					}
				}
			} else if (this.points.length == 3) {
				var mid = this.points[1];
				var n = '0';
				var s = '1';
				var w = '0';
				var e = '1';
				if (mid.x == this.bounds.x) {
					e = '0';
					w = '1';
				}
				if (mid.y == this.bounds.y) {
					n = '1';
					s = '0';
				}
				node.style.borderStyle = 'solid';
				node.style.borderWidth = n + ' ' + e + ' ' + s + ' ' + w + 'px';
			} else {
				node.style.width = Math.round(this.bounds.width + 1) + 'px';
				node.style.height = Math.round(this.bounds.height + 1) + 'px';
				var last = this.points[0];
				for (var i = 1; i < this.points.length; i++) {
					var next = this.points[i];
					var tmp = document.createElement('DIV');
					tmp.style.position = 'absolute';
					tmp.style.overflow = 'hidden';
					tmp.style.borderColor = this.stroke;
					tmp.style.borderStyle = 'solid';
					tmp.style.borderWidth = '1 0 0 1px';
					var x = Math.min(next.x, last.x) - this.bounds.x;
					var y = Math.min(next.y, last.y) - this.bounds.y;
					var w = Math.max(1, Math.abs(next.x - last.x));
					var h = Math.max(1, Math.abs(next.y - last.y));
					tmp.style.left = x + 'px';
					tmp.style.top = y + 'px';
					tmp.style.width = w + 'px';
					tmp.style.height = h + 'px';
					this.divContainer.appendChild(tmp);
					last = next;
				}
			}
		}
	}
};
mxShape.prototype.updateVmlDashStyle = function() {
	if (this.isDashed) {
		if (this.strokeNode.dashstyle != 'dash') {
			this.strokeNode.dashstyle = 'dash';
		}
	} else if (this.strokeNode.dashstyle != 'solid') {
		this.strokeNode.dashstyle = 'solid';
	}
};
mxShape.prototype.updateVmlShape = function(node) {
	node.strokeweight = (this.strokewidth * this.scale) + 'px';
	if (this.strokeNode != null) {
		this.updateVmlDashStyle();
	}
	if (this.shadowNode != null) {
		var dx = Math.round(mxConstants.SHADOW_OFFSET_X * this.scale);
		var dy = Math.round(mxConstants.SHADOW_OFFSET_Y * this.scale);
		this.shadowNode.offset = dx + 'px,' + dy + 'px';
	}
	if (this.bounds != null && !isNaN(this.bounds.x) && !isNaN(this.bounds.y) && !isNaN(this.bounds.width) && !isNaN(this.bounds.height)) {
		if (node.parentNode != this.node) {
			node.style.left = Math.round(this.bounds.x) + 'px';
			node.style.top = Math.round(this.bounds.y) + 'px';
			if (this.points == null) {
				if (this.rotation != null && this.rotation != 0) {
					node.style.rotation = this.rotation;
				} else if (node.style.rotation != null) {
					node.style.rotation = '';
				}
			}
		}
		var w = Math.max(0, Math.round(this.bounds.width));
		var h = Math.max(0, Math.round(this.bounds.height));
		node.style.width = w + 'px';
		node.style.height = h + 'px';
		if (this.points != null || node.nodeName == 'shape' || node.nodeName == 'group') {
			node.coordsize = w + ',' + h;
		}
	}
	if (this.points != null && node.nodeName != 'group') {
		if (node.nodeName == 'polyline' && node.points != null) {
			var points = '';
			for (var i = 0; i < this.points.length; i++) {
				points += this.points[i].x + ',' + this.points[i].y + ' ';
			}
			node.points.value = points;
			node.style.left = null;
			node.style.top = null;
			node.style.width = null;
			node.style.height = null;
		} else if (this.bounds != null) {
			var points = this.createPoints('m', 'l', 'c', true);
			if (this.style != null && this.style[mxConstants.STYLE_SMOOTH]) {
				var pts = this.points;
				var n = pts.length;
				if (n > 3) {
					var x0 = this.bounds.x;
					var y0 = this.bounds.y;
					points = 'm ' + Math.round(pts[0].x - x0) + ' ' + Math.round(pts[0].y - y0) + ' qb';
					for (var i = 1; i < n - 1; i++) {
						points += ' ' + Math.round(pts[i].x - x0) + ' ' + Math.round(pts[i].y - y0);
					}
					points += ' nf l ' + Math.round(pts[n - 1].x - x0) + ' ' + Math.round(pts[n - 1].y - y0);
				}
			}
			node.path = points + ' e';
		}
	}
};
mxShape.prototype.updateSvgShape = function(node) {
	var strokeWidth = Math.round(Math.max(1, this.strokewidth * this.scale));
	node.setAttribute('stroke-width', strokeWidth);
	if (this.crisp) {
		node.setAttribute('shape-rendering', 'crispEdges');
	} else {
		node.removeAttribute('shape-rendering');
	}
	if (this.points != null && this.points[0] != null) {
		var d = this.createPoints('M', 'L', 'C', false);
		if (d != null) {
			node.setAttribute('d', d);
			if (this.style != null && this.style[mxConstants.STYLE_SMOOTH]) {
				var pts = this.points;
				var n = pts.length;
				if (n > 3) {
					var points = 'M ' + pts[0].x + ' ' + pts[0].y + ' ';
					points += ' Q ' + pts[1].x + ' ' + pts[1].y + ' ' + ' ' + pts[2].x + ' ' + pts[2].y;
					for (var i = 3; i < n; i++) {
						points += ' T ' + pts[i].x + ' ' + pts[i].y;
					}
					node.setAttribute('d', points);
				}
			}
			node.removeAttribute('x');
			node.removeAttribute('y');
			node.removeAttribute('width');
			node.removeAttribute('height');
		}
	} else if (this.bounds != null) {
		var w = this.bounds.width;
		var h = this.bounds.height;
		if (this.isRounded && !(this.crisp && mxClient.IS_IE)) {
			node.setAttribute('x', this.bounds.x);
			node.setAttribute('y', this.bounds.y);
			node.setAttribute('width', w);
			node.setAttribute('height', h);
		} else {
			var dd = (this.crisp && mxClient.IS_IE) ? 0.5 : 0;
			node.setAttribute('x', Math.round(this.bounds.x) + dd);
			node.setAttribute('y', Math.round(this.bounds.y) + dd);
			w = Math.round(w);
			h = Math.round(h);
			node.setAttribute('width', w);
			node.setAttribute('height', h);
		}
		if (this.isRounded) {
			var f = mxConstants.RECTANGLE_ROUNDING_FACTOR * 100;
			if (this.style != null) {
				f = mxUtils.getValue(this.style, mxConstants.STYLE_ARCSIZE, f) / 100;
			}
			var r = Math.min(w * f, h * f);
			node.setAttribute('rx', r);
			node.setAttribute('ry', r);
		}
		this.updateSvgTransform(node, node == this.shadowNode);
	}
	if (this.isDashed) {
		var phase = Math.max(1, Math.round(3 * this.scale * this.strokewidth));
		node.setAttribute('stroke-dasharray', phase + ' ' + phase);
	}
};
mxShape.prototype.getSvgShadowTransform = function(node, shadow) {
	var dx = mxConstants.SHADOW_OFFSET_X * this.scale;
	var dy = mxConstants.SHADOW_OFFSET_Y * this.scale;
	return 'translate(' + dx + ' ' + dy + ')';
};
mxShape.prototype.updateSvgTransform = function(node, shadow) {
	var st = (shadow) ? this.getSvgShadowTransform() : '';
	if (this.rotation != null && this.rotation != 0) {
		var cx = this.bounds.x + this.bounds.width / 2;
		var cy = this.bounds.y + this.bounds.height / 2;
		node.setAttribute('transform', 'rotate(' + this.rotation + ',' + cx + ',' + cy + ') ' + st);
	} else {
		if (shadow) {
			node.setAttribute('transform', st);
		} else {
			node.removeAttribute('transform');
		}
	}
};
mxShape.prototype.reconfigure = function() {
	if (this.dialect == mxConstants.DIALECT_SVG) {
		if (this.innerNode != null) {
			this.configureSvgShape(this.innerNode);
		} else {
			this.configureSvgShape(this.node);
		}
		if (this.insertGradientNode != null) {
			this.insertGradient(this.insertGradientNode);
			this.insertGradientNode = null;
		}
	} else if (mxUtils.isVml(this.node)) {
		this.node.style.visibility = 'hidden';
		this.configureVmlShape(this.node);
		this.node.style.visibility = 'visible';
	} else {
		this.node.style.visibility = 'hidden';
		this.configureHtmlShape(this.node);
		this.node.style.visibility = 'visible';
	}
};
mxShape.prototype.redraw = function() {
	if (this.dialect == mxConstants.DIALECT_SVG) {
		this.redrawSvg();
	} else if (mxUtils.isVml(this.node)) {
		this.node.style.visibility = 'hidden';
		this.redrawVml();
		this.node.style.visibility = 'visible';
	} else {
		this.redrawHtml();
	}
};
mxShape.prototype.redrawSvg = function() {
	if (this.innerNode != null) {
		this.updateSvgShape(this.innerNode);
		if (this.shadowNode != null) {
			this.updateSvgShape(this.shadowNode);
		}
	} else {
		this.updateSvgShape(this.node);
		if (this.shadowNode != null) {
			this.shadowNode.setAttribute('transform', this.getSvgShadowTransform());
		}
	}
	this.updateSvgGlassPane();
};
mxShape.prototype.updateVmlGlassPane = function() {
	if (this.bounds != null && this.node.nodeName == 'group' && this.style != null && mxUtils.getValue(this.style, mxConstants.STYLE_GLASS, 0) == 1) {
		if (this.node.glassOverlay == null) {
			this.node.glassOverlay = document.createElement('v:shape');
			this.node.glassOverlay.setAttribute('filled', 'true');
			this.node.glassOverlay.setAttribute('fillcolor', 'white');
			this.node.glassOverlay.setAttribute('stroked', 'false');
			var fillNode = document.createElement('v:fill');
			fillNode.setAttribute('type', 'gradient');
			fillNode.setAttribute('color', 'white');
			fillNode.setAttribute('color2', 'white');
			fillNode.setAttribute('opacity', '90%');
			fillNode.setAttribute('o:opacity2', '15%');
			fillNode.setAttribute('angle', '180');
			this.node.glassOverlay.appendChild(fillNode);
			this.node.appendChild(this.node.glassOverlay);
		}
		var size = 0.4;
		var b = this.bounds;
		var sw = Math.ceil(this.strokewidth * this.scale / 2 + 1);
		var d = 'm ' + ( - sw) + ' ' + ( - sw) + ' l ' + ( - sw) + ' ' + Math.round(b.height * size) + ' c ' + Math.round(b.width * 0.3) + ' ' + Math.round(b.height * 0.6) + ' ' + Math.round(b.width * 0.7) + ' ' + Math.round(b.height * 0.6) + ' ' + Math.round(b.width + sw) + ' ' + Math.round(b.height * size) + ' l ' + Math.round(b.width + sw) + ' ' + ( - sw) + ' x e';
		this.node.glassOverlay.style.position = 'absolute';
		this.node.glassOverlay.style.width = b.width + 'px';
		this.node.glassOverlay.style.height = b.height + 'px';
		this.node.glassOverlay.setAttribute('coordsize', Math.round(this.bounds.width) + ',' + Math.round(this.bounds.height));
		this.node.glassOverlay.setAttribute('path', d);
	} else if (this.node.glassOverlay != null) {
		this.node.glassOverlay.parentNode.removeChild(this.node.glassOverlay);
		this.node.glassOverlay = null;
	}
};
mxShape.prototype.updateSvgGlassPane = function() {
	if (this.node.nodeName == 'g' && this.style != null && mxUtils.getValue(this.style, mxConstants.STYLE_GLASS, 0) == 1) {
		if (this.node.glassOverlay == null) {
			if (this.node.ownerSVGElement.glassGradient == null) {
				var glassGradient = document.createElementNS(mxConstants.NS_SVG, 'linearGradient');
				glassGradient.setAttribute('x1', '0%');
				glassGradient.setAttribute('y1', '0%');
				glassGradient.setAttribute('x2', '0%');
				glassGradient.setAttribute('y2', '100%');
				var stop1 = document.createElementNS(mxConstants.NS_SVG, 'stop');
				stop1.setAttribute('offset', '0%');
				stop1.setAttribute('style', 'stop-color:#ffffff;stop-opacity:0.9');
				glassGradient.appendChild(stop1);
				var stop2 = document.createElementNS(mxConstants.NS_SVG, 'stop');
				stop2.setAttribute('offset', '100%');
				stop2.setAttribute('style', 'stop-color:#ffffff;stop-opacity:0.1');
				glassGradient.appendChild(stop2);
				var prefix = 'mx-glass-gradient-';
				var counter = 0;
				while (document.getElementById(prefix + counter) != null) {
					counter++;
				}
				glassGradient.setAttribute('id', prefix + counter);
				this.node.ownerSVGElement.appendChild(glassGradient);
				this.node.ownerSVGElement.glassGradient = glassGradient;
			}
			this.node.glassOverlay = document.createElementNS(mxConstants.NS_SVG, 'path');
			var id = this.node.ownerSVGElement.glassGradient.getAttribute('id');
			this.node.glassOverlay.setAttribute('style', 'fill:url(#' + id + ');');
			this.node.appendChild(this.node.glassOverlay);
		}
		var size = 0.4;
		var b = this.bounds;
		var sw = Math.ceil(this.strokewidth * this.scale / 2);
		var d = 'm ' + (b.x - sw) + ',' + (b.y - sw) + ' L ' + (b.x - sw) + ',' + (b.y + b.height * size) + ' Q ' + (b.x + b.width * 0.5) + ',' + (b.y + b.height * 0.7) + ' ' + (b.x + b.width + sw) + ',' + (b.y + b.height * size) + ' L ' + (b.x + b.width + sw) + ',' + (b.y - sw) + ' z';
		this.node.glassOverlay.setAttribute('d', d);
	} else if (this.node.glassOverlay != null) {
		this.node.glassOverlay.parentNode.removeChild(this.node.glassOverlay);
		this.node.glassOverlay = null;
	}
};
mxShape.prototype.redrawVml = function() {
	this.node.style.visibility = 'hidden';
	this.updateVmlShape(this.node);
	this.updateVmlGlassPane();
	this.node.style.visibility = 'visible';
};
mxShape.prototype.redrawHtml = function() {
	this.updateHtmlShape(this.node);
};
mxShape.prototype.getRotation = function() {
	var rot = this.rotation || 0;
	if (this.direction != null) {
		if (this.direction == 'north') {
			rot += 270;
		} else if (this.direction == 'west') {
			rot += 180;
		} else if (this.direction == 'south') {
			rot += 90;
		}
	}
	return rot;
};
mxShape.prototype.createPath = function(arg) {
	var x = this.bounds.x;
	var y = this.bounds.y;
	var w = this.bounds.width;
	var h = this.bounds.height;
	var dx = 0;
	var dy = 0;
	if (this.direction == 'north' || this.direction == 'south') {
		dx = (w - h) / 2;
		dy = (h - w) / 2;
		x += dx;
		y += dy;
		var tmp = w;
		w = h;
		h = tmp;
	}
	var rotation = this.getRotation();
	var path = null;
	if (this.dialect == mxConstants.DIALECT_SVG) {
		path = new mxPath('svg');
		path.setTranslate(x, y);
		if (rotation != 0) {
			var cx = this.bounds.getCenterX();
			var cy = this.bounds.getCenterY();
			var transform = 'rotate(' + rotation + ' ' + cx + ' ' + cy + ')';
			if (this.innerNode != null) {
				this.innerNode.setAttribute('transform', transform);
			}
			if (this.foreground != null) {
				this.foreground.setAttribute('transform', transform);
			}
			if (this.shadowNode != null) {
				this.shadowNode.setAttribute('transform', this.getSvgShadowTransform() + ' ' + transform);
			}
		}
	} else {
		path = new mxPath('vml');
		path.setTranslate(dx, -dx);
		if (rotation != 0) {
			this.node.style.rotation = rotation;
		}
	}
	this.redrawPath(path, x, y, w, h, arg);
	return path.getPath();
};
mxShape.prototype.redrawPath = function(path, x, y, w, h) {};
function mxStencil(desc) {
	this.desc = desc;
	this.parseDescription();
	this.parseConstraints();
};
mxStencil.prototype.desc = null;
mxStencil.prototype.constraints = null;
mxStencil.prototype.aspect = null;
mxStencil.prototype.w0 = null;
mxStencil.prototype.h0 = null;
mxStencil.prototype.bgNode = null;
mxStencil.prototype.fgNode = null;
mxStencil.prototype.strokewidth = null;
mxStencil.prototype.parseDescription = function() {
	this.fgNode = this.desc.getElementsByTagName('foreground')[0];
	this.bgNode = this.desc.getElementsByTagName('background')[0];
	this.w0 = Number(this.desc.getAttribute('w') || 100);
	this.h0 = Number(this.desc.getAttribute('h') || 100);
	var aspect = this.desc.getAttribute('aspect');
	this.aspect = (aspect != null) ? aspect: 'variable';
	var sw = this.desc.getAttribute('strokewidth');
	this.strokewidth = (sw != null) ? sw: '1';
};
mxStencil.prototype.parseConstraints = function() {
	var conns = this.desc.getElementsByTagName('connections')[0];
	if (conns != null) {
		var tmp = mxUtils.getChildNodes(conns);
		if (tmp != null && tmp.length > 0) {
			this.constraints = [];
			for (var i = 0; i < tmp.length; i++) {
				this.constraints.push(this.parseConstraint(tmp[i]));
			}
		}
	}
};
mxStencil.prototype.parseConstraint = function(node) {
	var x = Number(node.getAttribute('x'));
	var y = Number(node.getAttribute('y'));
	var perimeter = node.getAttribute('perimeter') == '1';
	return new mxConnectionConstraint(new mxPoint(x, y), perimeter);
};
mxStencil.prototype.evaluateAttribute = function(node, attribute, state) {
	var result = node.getAttribute(attribute);
	if (result == null) {
		var text = mxUtils.getTextContent(node);
		if (text != null) {
			var funct = mxUtils.eval(text);
			if (typeof(funct) == 'function') {
				result = funct(state);
			}
		}
	}
	return result;
};
mxStencil.prototype.renderDom = function(shape, bounds, parentNode, state) {
	var vml = shape.dialect != mxConstants.DIALECT_SVG;
	var rotation = shape.rotation || 0;
	var inverse = false;
	if (shape.direction != null) {
		if (shape.direction == 'north') {
			rotation += 270;
		} else if (shape.direction == 'west') {
			rotation += 180;
		} else if (shape.direction == 'south') {
			rotation += 90;
		}
		inverse = (shape.direction == 'north' || shape.direction == 'south');
	}
	var flipH = shape.style[mxConstants.STYLE_STENCIL_FLIPH];
	var flipV = shape.style[mxConstants.STYLE_STENCIL_FLIPV];
	if (flipH && flipV) {
		rotation += 180;
		flipH = false;
		flipV = false;
	}
	var svgTransform = '';
	if (vml) {
		if (flipH) {
			parentNode.style.flip = 'x';
		} else if (flipV) {
			parentNode.style.flip = 'y';
		}
		if (rotation != 0) {
			parentNode.style.rotation = rotation;
		}
	} else {
		if (flipH || flipV) {
			var sx = 1;
			var sy = 1;
			var dx = 0;
			var dy = 0;
			if (flipH) {
				sx = -1;
				dx = -bounds.width - 2 * bounds.x;
			}
			if (flipV) {
				sy = -1;
				dy = -bounds.height - 2 * bounds.y;
			}
			svgTransform = 'scale(' + sx + ' ' + sy + ') translate(' + dx + ' ' + dy + ')';
		}
		if (rotation != 0) {
			var cx = bounds.getCenterX();
			var cy = bounds.getCenterY();
			svgTransform += ' rotate(' + rotation + ' ' + cx + ' ' + cy + ')';
		}
	}
	var background = (state == null);
	if (this.bgNode != null || this.fgNode != null) {
		var x0 = (vml && state == null) ? 0 : bounds.x;
		var y0 = (vml && state == null) ? 0 : bounds.y;
		var sx = bounds.width / this.w0;
		var sy = bounds.height / this.h0;
		this.lastMoveX = 0;
		this.lastMoveY = 0;
		if (inverse) {
			sy = bounds.width / this.h0;
			sx = bounds.height / this.w0;
			var delta = (bounds.width - bounds.height) / 2;
			x0 += delta;
			y0 -= delta;
		}
		if (this.aspect == 'fixed') {
			sy = Math.min(sx, sy);
			sx = sy;
			if (inverse) {
				x0 += (bounds.height - this.w0 * sx) / 2;
				y0 += (bounds.width - this.h0 * sy) / 2;
			} else {
				x0 += (bounds.width - this.w0 * sx) / 2;
				y0 += (bounds.height - this.h0 * sy) / 2;
			}
		}
		var minScale = Math.min(sx, sy);
		var phase = Math.max(1, Math.round(3 * shape.scale)) * minScale;
		var stack = [];
		var currentState = (state != null) ? state: {
			fillColorAssigned: false,
			fill: shape.fill,
			stroke: shape.stroke,
			strokeWidth: (this.strokewidth == 'inherit') ? Number(shape.strokewidth) * shape.scale: Number(this.strokewidth) * minScale,
			dashed: shape.isDashed,
			dashpattern: phase + ' ' + phase,
			alpha: shape.opacity,
			linejoin: 'miter',
			fontColor: '#000000',
			fontSize: mxConstants.DEFAULT_FONTSIZE,
			fontFamily: mxConstants.DEFAULT_FONTFAMILY,
			fontStyle: 0
		};
		var currentPath = null;
		var currentPoints = null;
		var configurePath = function(path, state) {
			var sw = Math.round(Math.max(1, state.strokeWidth));
			if (vml) {
				path.strokeweight = sw + 'px';
				if (state.fill != null) {
					var gradient = (!state.fillColorAssigned) ? shape.gradient: null;
					var fill = document.createElement('v:fill');
					shape.updateVmlFill(fill, state.fill, gradient, shape.gradientDirection, state.alpha);
					path.appendChild(fill);
				} else {
					path.filled = 'false';
				}
				if (state.stroke != null) {
					path.stroked = 'true';
					path.strokecolor = state.stroke;
				} else {
					path.stroked = 'false';
				}
				path.style.position = 'absolute';
			} else {
				path.setAttribute('stroke-width', sw);
				if (state.fill != null && state.fillColorAssigned) {
					path.setAttribute('fill', state.fill);
				}
				if (state.stroke != null) {
					path.setAttribute('stroke', state.stroke);
				}
			}
		};
		var addToParent = function(node) {
			if (document.documentMode == 8) {
				parentNode.insertAdjacentHTML('beforeEnd', node.outerHTML);
			} else {
				parentNode.appendChild(node);
			}
		};
		var addToPath = function(s) {
			if (currentPath != null && currentPoints != null) {
				currentPoints.push(s);
			}
		};
		var round = function(value) {
			return (vml) ? Math.round(value) : value;
		};
		var renderNode = function(node) {
			var name = node.nodeName;
			var fillOp = name == 'fill';
			var strokeOp = name == 'stroke';
			var fillStrokeOp = name == 'fillstroke';
			if (name == 'save') {
				stack.push(currentState);
				currentState = mxUtils.clone(currentState);
			} else if (name == 'restore') {
				currentState = stack.pop();
			} else if (name == 'path') {
				currentPoints = [];
				if (vml) {
					currentPath = document.createElement('v:shape');
					configurePath.call(this, currentPath, currentState);
					var w = Math.round(bounds.width);
					var h = Math.round(bounds.height);
					currentPath.style.width = w + 'px';
					currentPath.style.height = h + 'px';
					currentPath.coordsize = w + ',' + h;
				} else {
					currentPath = document.createElementNS(mxConstants.NS_SVG, 'path');
					configurePath.call(this, currentPath, currentState);
					if (svgTransform.length > 0) {
						currentPath.setAttribute('transform', svgTransform);
					}
					if (node.getAttribute('crisp') == '1') {
						currentPath.setAttribute('shape-rendering', 'crispEdges');
					}
				}
				var childNode = node.firstChild;
				while (childNode != null) {
					if (childNode.nodeType == mxConstants.NODETYPE_ELEMENT) {
						renderNode.call(this, childNode);
					}
					childNode = childNode.nextSibling;
				}
				if (vml) {
					addToPath('e');
					currentPath.path = currentPoints.join('');
				} else {
					currentPath.setAttribute('d', currentPoints.join(''));
				}
			} else if (name == 'move') {
				var op = (vml) ? 'm': 'M';
				this.lastMoveX = round(x0 + Number(node.getAttribute('x')) * sx);
				this.lastMoveY = round(y0 + Number(node.getAttribute('y')) * sy);
				addToPath(op + ' ' + this.lastMoveX + ' ' + this.lastMoveY);
			} else if (name == 'line') {
				var op = (vml) ? 'l': 'L';
				this.lastMoveX = round(x0 + Number(node.getAttribute('x')) * sx);
				this.lastMoveY = round(y0 + Number(node.getAttribute('y')) * sy);
				addToPath(op + ' ' + this.lastMoveX + ' ' + this.lastMoveY);
			} else if (name == 'quad') {
				if (vml) {
					var cpx0 = this.lastMoveX;
					var cpy0 = this.lastMoveY;
					var qpx1 = x0 + Number(node.getAttribute('x1')) * sx;
					var qpy1 = y0 + Number(node.getAttribute('y1')) * sy;
					var cpx3 = x0 + Number(node.getAttribute('x2')) * sx;
					var cpy3 = y0 + Number(node.getAttribute('y2')) * sy;
					var cpx1 = cpx0 + 2 / 3 * (qpx1 - cpx0);
					var cpy1 = cpy0 + 2 / 3 * (qpy1 - cpy0);
					var cpx2 = cpx3 + 2 / 3 * (qpx1 - cpx3);
					var cpy2 = cpy3 + 2 / 3 * (qpy1 - cpy3);
					addToPath('c ' + Math.round(cpx1) + ' ' + Math.round(cpy1) + ' ' + Math.round(cpx2) + ' ' + Math.round(cpy2) + ' ' + Math.round(cpx3) + ' ' + Math.round(cpy3));
					this.lastMoveX = cpx3;
					this.lastMoveY = cpy3;
				} else {
					this.lastMoveX = x0 + Number(node.getAttribute('x2')) * sx;
					this.lastMoveY = y0 + Number(node.getAttribute('y2')) * sy;
					addToPath('Q ' + (x0 + Number(node.getAttribute('x1')) * sx) + ' ' + (y0 + Number(node.getAttribute('y1')) * sy) + ' ' + this.lastMoveX + ' ' + this.lastMoveY);
				}
			} else if (name == 'curve') {
				var op = (vml) ? 'c': 'C';
				this.lastMoveX = round(x0 + Number(node.getAttribute('x3')) * sx);
				this.lastMoveY = round(y0 + Number(node.getAttribute('y3')) * sy);
				addToPath(op + ' ' + round(x0 + Number(node.getAttribute('x1')) * sx) + ' ' + round(y0 + Number(node.getAttribute('y1')) * sy) + ' ' + round(x0 + Number(node.getAttribute('x2')) * sx) + ' ' + round(y0 + Number(node.getAttribute('y2')) * sy) + ' ' + this.lastMoveX + ' ' + this.lastMoveY);
			} else if (name == 'close') {
				addToPath((vml) ? 'x': 'Z');
			} else if (name == 'rect' || name == 'roundrect') {
				var rounded = name == 'roundrect';
				var x = round(x0 + Number(node.getAttribute('x')) * sx);
				var y = round(y0 + Number(node.getAttribute('y')) * sy);
				var w = round(Number(node.getAttribute('w')) * sx);
				var h = round(Number(node.getAttribute('h')) * sy);
				var arcsize = node.getAttribute('arcsize');
				if (arcsize == 0) {
					arcsize = mxConstants.RECTANGLE_ROUNDING_FACTOR * 100;
				}
				if (vml) {
					currentPath = document.createElement((rounded) ? 'v:roundrect': 'v:rect');
					currentPath.style.left = x + 'px';
					currentPath.style.top = y + 'px';
					currentPath.style.width = w + 'px';
					currentPath.style.height = h + 'px';
					if (rounded) {
						currentPath.setAttribute('arcsize', String(arcsize) + '%');
					}
				} else {
					currentPath = document.createElementNS(mxConstants.NS_SVG, 'rect');
					currentPath.setAttribute('x', x);
					currentPath.setAttribute('y', y);
					currentPath.setAttribute('width', w);
					currentPath.setAttribute('height', h);
					if (rounded) {
						var factor = Number(arcsize) / 100;
						var r = Math.min(w * factor, h * factor);
						currentPath.setAttribute('rx', r);
						currentPath.setAttribute('ry', r);
					}
					if (svgTransform.length > 0) {
						currentPath.setAttribute('transform', svgTransform);
					}
					if (node.getAttribute('crisp') == '1') {
						currentPath.setAttribute('shape-rendering', 'crispEdges');
					}
				}
				configurePath.call(this, currentPath, currentState);
			} else if (name == 'ellipse') {
				var x = round(x0 + Number(node.getAttribute('x')) * sx);
				var y = round(y0 + Number(node.getAttribute('y')) * sy);
				var w = round(Number(node.getAttribute('w')) * sx);
				var h = round(Number(node.getAttribute('h')) * sy);
				if (vml) {
					currentPath = document.createElement('v:arc');
					currentPath.startangle = '0';
					currentPath.endangle = '360';
					currentPath.style.left = x + 'px';
					currentPath.style.top = y + 'px';
					currentPath.style.width = w + 'px';
					currentPath.style.height = h + 'px';
				} else {
					currentPath = document.createElementNS(mxConstants.NS_SVG, 'ellipse');
					currentPath.setAttribute('cx', x + w / 2);
					currentPath.setAttribute('cy', y + h / 2);
					currentPath.setAttribute('rx', w / 2);
					currentPath.setAttribute('ry', h / 2);
					if (svgTransform.length > 0) {
						currentPath.setAttribute('transform', svgTransform);
					}
				}
				configurePath.call(this, currentPath, currentState);
			} else if (name == 'arc') {
				var r1 = Number(node.getAttribute('rx')) * sx;
				var r2 = Number(node.getAttribute('ry')) * sy;
				var angle = Number(node.getAttribute('x-axis-rotation'));
				var largeArcFlag = Number(node.getAttribute('large-arc-flag'));
				var sweepFlag = Number(node.getAttribute('sweep-flag'));
				var x = x0 + Number(node.getAttribute('x')) * sx;
				var y = y0 + Number(node.getAttribute('y')) * sy;
				if (vml) {
					var curves = mxUtils.arcToCurves(this.lastMoveX, this.lastMoveY, r1, r2, angle, largeArcFlag, sweepFlag, x, y);
					for (var i = 0; i < curves.length; i += 6) {
						addToPath('c' + ' ' + Math.round(curves[i]) + ' ' + Math.round(curves[i + 1]) + ' ' + Math.round(curves[i + 2]) + ' ' + Math.round(curves[i + 3]) + ' ' + Math.round(curves[i + 4]) + ' ' + Math.round(curves[i + 5]));
						this.lastMoveX = curves[i + 4];
						this.lastMoveY = curves[i + 5];
					}
				} else {
					addToPath('A ' + r1 + ',' + r2 + ' ' + angle + ' ' + largeArcFlag + ',' + sweepFlag + ' ' + x + ',' + y);
					this.lastMoveX = x0 + x;
					this.lastMoveY = y0 + y;
				}
			} else if (name == 'image') {
				var src = this.evaluateAttribute(node, 'src', shape.state);
				if (src != null) {
					var x = round(x0 + Number(node.getAttribute('x')) * sx);
					var y = round(y0 + Number(node.getAttribute('y')) * sy);
					var w = round(Number(node.getAttribute('w')) * sx);
					var h = round(Number(node.getAttribute('h')) * sy);
					var aspect = false;
					var flipH = node.getAttribute('flipH') == '1';
					var flipV = node.getAttribute('flipV') == '1';
					if (vml) {
						currentPath = document.createElement('v:image');
						currentPath.style.filter = 'alpha(opacity=' + currentState.alpha + ')';
						currentPath.style.left = x + 'px';
						currentPath.style.top = y + 'px';
						currentPath.style.width = w + 'px';
						currentPath.style.height = h + 'px';
						currentPath.src = src;
						if (flipH && flipV) {
							currentPath.style.rotation = '180';
						} else if (flipH) {
							currentPath.style.flip = 'x';
						} else if (flipV) {
							currentPath.style.flip = 'y';
						}
					} else {
						currentPath = document.createElementNS(mxConstants.NS_SVG, 'image');
						currentPath.setAttributeNS(mxConstants.NS_XLINK, 'xlink:href', src);
						currentPath.setAttribute('opacity', currentState.alpha / 100);
						currentPath.setAttribute('x', x);
						currentPath.setAttribute('y', y);
						currentPath.setAttribute('width', w);
						currentPath.setAttribute('height', h);
						if (!aspect) {
							currentPath.setAttribute('preserveAspectRatio', 'none');
						}
						if (flipH || flipV) {
							var scx = 1;
							var scy = 1;
							var dx = 0;
							var dy = 0;
							if (flipH) {
								scx = -1;
								dx = -w - 2 * x;
							}
							if (flipV) {
								scy = -1;
								dy = -h - 2 * y;
							}
							currentPath.setAttribute('transform', svgTransform + 'scale(' + scx + ' ' + scy + ')' + ' translate(' + dx + ' ' + dy + ') ');
						} else {
							currentPath.setAttribute('transform', svgTransform);
						}
					}
					addToParent(currentPath);
				}
			} else if (name == 'include-shape') {
				var stencil = mxStencilRegistry.getStencil(node.getAttribute('name'));
				if (stencil != null) {
					var x = x0 + Number(node.getAttribute('x')) * sx;
					var y = y0 + Number(node.getAttribute('y')) * sy;
					var w = Number(node.getAttribute('w')) * sx;
					var h = Number(node.getAttribute('h')) * sy;
					stencil.renderDom(shape, new mxRectangle(x, y, w, h), parentNode, currentState);
				}
			} else if (name == 'text') {
				var str = this.evaluateAttribute(node, 'str', shape.state);
				if (str != null) {
					var x = round(x0 + Number(node.getAttribute('x')) * sx);
					var y = round(y0 + Number(node.getAttribute('y')) * sy);
					var align = node.getAttribute('align') || 'left';
					var valign = node.getAttribute('valign') || 'top';
					if (vml) {
						currentPath = document.createElement('v:line');
						currentPath.style.position = 'absolute';
						currentPath.style.width = '1px';
						currentPath.style.height = '1px';
						currentPath.to = (x + 1) + ' ' + y;
						currentPath.from = x + ' ' + y;
						var fill = document.createElement('v:fill');
						fill.color = currentState.fontColor;
						fill.on = 'true';
						currentPath.appendChild(fill);
						var stroke = document.createElement('v:stroke');
						stroke.on = 'false';
						currentPath.appendChild(stroke);
						var path = document.createElement('v:path');
						path.textpathok = 'true';
						currentPath.appendChild(path);
						var tp = document.createElement('v:textpath');
						tp.style.cssText = 'v-text-align:' + align;
						tp.style.fontSize = currentState.fontSize + 'px';
						tp.style.fontFamily = currentState.fontFamily;
						tp.string = str;
						tp.on = 'true';
						if ((currentState.fontStyle & mxConstants.FONT_BOLD) == mxConstants.FONT_BOLD) {
							tp.style.fontWeight = 'bold';
						}
						if ((currentState.fontStyle & mxConstants.FONT_ITALIC) == mxConstants.FONT_ITALIC) {
							tp.style.fontStyle = 'italic';
						}
						if ((currentState.fontStyle & mxConstants.FONT_UNDERLINE) == mxConstants.FONT_UNDERLINE) {
							tp.style.textDecoration = 'underline';
						}
						if (valign == 'top') {
							currentPath.style.top = (currentState.fontSize / 2) + 'px';
						} else if (valign == 'bottom') {
							currentPath.style.top = -(currentState.fontSize / 3) + 'px';
						}
						currentPath.appendChild(tp);
					} else {
						currentPath = document.createElementNS(mxConstants.NS_SVG, 'text');
						currentPath.setAttribute('fill', currentState.fontColor);
						currentPath.setAttribute('font-family', currentState.fontFamily);
						currentPath.setAttribute('font-size', currentState.fontSize);
						currentPath.setAttribute('stroke', 'none');
						currentPath.setAttribute('x', x);
						currentPath.appendChild(document.createTextNode(str));
						if ((currentState.fontStyle & mxConstants.FONT_BOLD) == mxConstants.FONT_BOLD) {
							currentPath.setAttribute('font-weight', 'bold');
						}
						if ((currentState.fontStyle & mxConstants.FONT_ITALIC) == mxConstants.FONT_ITALIC) {
							currentPath.setAttribute('font-style', 'italic');
						}
						if ((currentState.fontStyle & mxConstants.FONT_UNDERLINE) == mxConstants.FONT_UNDERLINE) {
							currentPath.setAttribute('text-decoration', uline);
						}
						if (align == 'left') {
							align = 'start';
						} else if (align == 'center') {
							align = 'middle';
						} else if (align == 'right') {
							align = 'end';
						}
						currentPath.setAttribute('text-anchor', align);
						if (valign == 'top') {
							currentPath.setAttribute('y', y + currentState.fontSize / 5);
							currentPath.setAttribute('dy', '1ex');
						} else if (valign == 'middle') {
							currentPath.setAttribute('y', y + currentState.fontSize / 8);
							currentPath.setAttribute('dy', '0.5ex');
						} else {
							currentPath.setAttribute('y', y);
						}
						if (svgTransform.length > 0) {
							currentPath.setAttribute('transform', svgTransform);
						}
					}
					addToParent(currentPath);
				}
			} else if (fillOp || strokeOp || fillStrokeOp) {
				if (currentPath != null) {
					if (strokeOp || fillStrokeOp) {
						if (vml) {
							var stroke = document.createElement('v:stroke');
							stroke.endcap = currentState.linecap || 'flat';
							stroke.joinstyle = currentState.linejoin || 'miter';
							stroke.miterlimit = currentState.miterlimit || '10';
							currentPath.appendChild(stroke);
							if (currentState.dashed) {
								stroke.dashstyle = currentState.dashpattern;
							}
						} else {
							if (currentState.linejoin != null) {
								currentPath.setAttribute('stroke-linejoin', currentState.linejoin);
							}
							if (currentState.linecap != null) {
								var value = currentState.linecap;
								if (value == 'flat') {
									value = 'butt';
								}
								currentPath.setAttribute('stroke-linecap', value);
							}
							if (currentState.miterlimit != null) {
								currentPath.setAttribute('stroke-miterlimit', currentState.miterlimit);
							}
						}
					}
					if (background && shape.isShadow && currentState.fill != null && (fillOp || fillStrokeOp)) {
						var dx = mxConstants.SHADOW_OFFSET_X * shape.scale;
						var dy = mxConstants.SHADOW_OFFSET_Y * shape.scale;
						if (vml) {
							var shadow = document.createElement('v:shadow');
							shadow.setAttribute('on', 'true');
							shadow.setAttribute('color', mxConstants.SHADOWCOLOR);
							shadow.setAttribute('offset', Math.round(dx) + 'px,' + Math.round(dy) + 'px');
							shadow.setAttribute('opacity', (mxConstants.SHADOW_OPACITY * 100) + '%');
							currentPath.appendChild(shadow);
						} else {
							var shadow = currentPath.cloneNode(true);
							shadow.setAttribute('stroke', mxConstants.SHADOWCOLOR);
							shadow.setAttribute('fill', mxConstants.SHADOWCOLOR);
							shadow.setAttribute('transform', 'translate(' + dx + ' ' + dy + ') ' + (shadow.getAttribute('transform') || ''));
							shadow.setAttribute('opacity', mxConstants.SHADOW_OPACITY);
							parentNode.appendChild(shadow);
						}
					}
					if (currentState.dashed && !vml && (strokeOp || fillStrokeOp)) {
						currentPath.setAttribute('stroke-dasharray', currentState.dashpattern);
					}
					if (fillOp) {
						if (vml) {
							currentPath.stroked = 'false';
						} else {
							currentPath.setAttribute('stroke', 'none');
						}
					} else if (strokeOp) {
						if (vml) {
							currentPath.filled = 'false';
						} else {
							currentPath.setAttribute('fill', 'none');
						}
					}
					addToParent(currentPath);
				}
				if (background) {
					background = false;
				}
			} else if (name == 'linecap') {
				currentState.linecap = node.getAttribute('cap');
			} else if (name == 'linejoin') {
				currentState.linejoin = node.getAttribute('join');
			} else if (name == 'miterlimit') {
				currentState.miterlimit = node.getAttribute('limit');
			} else if (name == 'dashed') {
				currentState.dashed = node.getAttribute('dashed') == '1';
			} else if (name == 'dashpattern') {
				var value = node.getAttribute('pattern');
				if (value != null) {
					var tmp = value.split(' ');
					var pat = [];
					for (var i = 0; i < tmp.length; i++) {
						if (tmp[i].length > 0) {
							pat.push(Number(tmp[i]) * shape.scale * minScale);
						}
					}
					currentState.dashpattern = pat.join(' ');
				}
			} else if (name == 'strokewidth') {
				currentState.strokeWidth = node.getAttribute('width') * minScale;
			} else if (name == 'strokecolor') {
				currentState.stroke = node.getAttribute('color');
			} else if (name == 'fillcolor') {
				currentState.fill = node.getAttribute('color');
				currentState.fillColorAssigned = true;
			} else if (name == 'alpha') {
				currentState.alpha = Number(node.getAttribute('alpha'));
			} else if (name == 'fontcolor') {
				currentState.fontColor = node.getAttribute('color');
			} else if (name == 'fontsize') {
				currentState.fontSize = Number(node.getAttribute('size')) * minScale;
			} else if (name == 'fontfamily') {
				currentState.fontFamily = node.getAttribute('family');
			} else if (name == 'fontstyle') {
				currentState.fontStyle = Number(node.getAttribute('style'));
			}
		};
		if (!vml) {
			var rect = document.createElementNS(mxConstants.NS_SVG, 'rect');
			rect.setAttribute('x', bounds.x);
			rect.setAttribute('y', bounds.y);
			rect.setAttribute('width', bounds.width);
			rect.setAttribute('height', bounds.height);
			rect.setAttribute('fill', 'none');
			rect.setAttribute('stroke', 'none');
			parentNode.appendChild(rect);
		}
		if (this.bgNode != null) {
			var tmp = this.bgNode.firstChild;
			while (tmp != null) {
				if (tmp.nodeType == mxConstants.NODETYPE_ELEMENT) {
					renderNode.call(this, tmp);
				}
				tmp = tmp.nextSibling;
			}
		} else {
			background = false;
		}
		if (this.fgNode != null) {
			var tmp = this.fgNode.firstChild;
			while (tmp != null) {
				if (tmp.nodeType == mxConstants.NODETYPE_ELEMENT) {
					renderNode.call(this, tmp);
				}
				tmp = tmp.nextSibling;
			}
		}
	}
};
mxStencil.prototype.drawShape = function(canvas, state, bounds, background) {
	var node = (background) ? this.bgNode: this.fgNode;
	if (node != null) {
		var direction = mxUtils.getValue(state.style, mxConstants.STYLE_DIRECTION, null);
		var aspect = this.computeAspect(state, bounds, direction);
		var minScale = Math.min(aspect.width, aspect.height);
		var sw = (this.strokewidth == 'inherit') ? Number(mxUtils.getNumber(state.style, mxConstants.STYLE_STROKEWIDTH, 1)) * state.view.scale: Number(this.strokewidth) * minScale;
		this.lastMoveX = 0;
		this.lastMoveY = 0;
		canvas.setStrokeWidth(sw);
		var tmp = node.firstChild;
		while (tmp != null) {
			if (tmp.nodeType == mxConstants.NODETYPE_ELEMENT) {
				this.drawNode(canvas, state, tmp, aspect);
			}
			tmp = tmp.nextSibling;
		}
		return true;
	}
	return false;
};
mxStencil.prototype.computeAspect = function(state, bounds, direction) {
	var x0 = bounds.x;
	var y0 = bounds.y;
	var sx = bounds.width / this.w0;
	var sy = bounds.height / this.h0;
	var inverse = (direction == 'north' || direction == 'south');
	if (inverse) {
		sy = bounds.width / this.h0;
		sx = bounds.height / this.w0;
		var delta = (bounds.width - bounds.height) / 2;
		x0 += delta;
		y0 -= delta;
	}
	if (this.aspect == 'fixed') {
		sy = Math.min(sx, sy);
		sx = sy;
		if (inverse) {
			x0 += (bounds.height - this.w0 * sx) / 2;
			y0 += (bounds.width - this.h0 * sy) / 2;
		} else {
			x0 += (bounds.width - this.w0 * sx) / 2;
			y0 += (bounds.height - this.h0 * sy) / 2;
		}
	}
	return new mxRectangle(x0, y0, sx, sy);
};
mxStencil.prototype.drawNode = function(canvas, state, node, aspect) {
	var name = node.nodeName;
	var x0 = aspect.x;
	var y0 = aspect.y;
	var sx = aspect.width;
	var sy = aspect.height;
	var minScale = Math.min(sx, sy);
	if (name == 'save') {
		canvas.save();
	} else if (name == 'restore') {
		canvas.restore();
	} else if (name == 'path') {
		canvas.begin();
		var childNode = node.firstChild;
		while (childNode != null) {
			if (childNode.nodeType == mxConstants.NODETYPE_ELEMENT) {
				this.drawNode(canvas, state, childNode, aspect);
			}
			childNode = childNode.nextSibling;
		}
	} else if (name == 'close') {
		canvas.close();
	} else if (name == 'move') {
		this.lastMoveX = x0 + Number(node.getAttribute('x')) * sx;
		this.lastMoveY = y0 + Number(node.getAttribute('y')) * sy;
		canvas.moveTo(this.lastMoveX, this.lastMoveY);
	} else if (name == 'line') {
		this.lastMoveX = x0 + Number(node.getAttribute('x')) * sx;
		this.lastMoveY = y0 + Number(node.getAttribute('y')) * sy;
		canvas.lineTo(this.lastMoveX, this.lastMoveY);
	} else if (name == 'quad') {
		this.lastMoveX = x0 + Number(node.getAttribute('x2')) * sx;
		this.lastMoveY = y0 + Number(node.getAttribute('y2')) * sy;
		canvas.quadTo(x0 + Number(node.getAttribute('x1')) * sx, y0 + Number(node.getAttribute('y1')) * sy, this.lastMoveX, this.lastMoveY);
	} else if (name == 'curve') {
		this.lastMoveX = x0 + Number(node.getAttribute('x3')) * sx;
		this.lastMoveY = y0 + Number(node.getAttribute('y3')) * sy;
		canvas.curveTo(x0 + Number(node.getAttribute('x1')) * sx, y0 + Number(node.getAttribute('y1')) * sy, x0 + Number(node.getAttribute('x2')) * sx, y0 + Number(node.getAttribute('y2')) * sy, this.lastMoveX, this.lastMoveY);
	} else if (name == 'arc') {
		var r1 = Number(node.getAttribute('rx')) * sx;
		var r2 = Number(node.getAttribute('ry')) * sy;
		var angle = Number(node.getAttribute('x-axis-rotation'));
		var largeArcFlag = Number(node.getAttribute('large-arc-flag'));
		var sweepFlag = Number(node.getAttribute('sweep-flag'));
		var x = x0 + Number(node.getAttribute('x')) * sx;
		var y = y0 + Number(node.getAttribute('y')) * sy;
		var curves = mxUtils.arcToCurves(this.lastMoveX, this.lastMoveY, r1, r2, angle, largeArcFlag, sweepFlag, x, y);
		for (var i = 0; i < curves.length; i += 6) {
			canvas.curveTo(curves[i], curves[i + 1], curves[i + 2], curves[i + 3], curves[i + 4], curves[i + 5]);
			this.lastMoveX = curves[i + 4];
			this.lastMoveY = curves[i + 5];
		}
	} else if (name == 'rect') {
		canvas.rect(x0 + Number(node.getAttribute('x')) * sx, y0 + Number(node.getAttribute('y')) * sy, Number(node.getAttribute('w')) * sx, Number(node.getAttribute('h')) * sy);
	} else if (name == 'roundrect') {
		var arcsize = node.getAttribute('arcsize');
		if (arcsize == 0) {
			arcsize = mxConstants.RECTANGLE_ROUNDING_FACTOR * 100;
		}
		var w = Number(node.getAttribute('w')) * sx;
		var h = Number(node.getAttribute('h')) * sy;
		var factor = Number(arcsize) / 100;
		var r = Math.min(w * factor, h * factor);
		canvas.roundrect(x0 + Number(node.getAttribute('x')) * sx, y0 + Number(node.getAttribute('y')) * sy, w, h, r, r);
	} else if (name == 'ellipse') {
		canvas.ellipse(x0 + Number(node.getAttribute('x')) * sx, y0 + Number(node.getAttribute('y')) * sy, Number(node.getAttribute('w')) * sx, Number(node.getAttribute('h')) * sy);
	} else if (name == 'image') {
		var src = this.evaluateAttribute(node, 'src', state);
		canvas.image(x0 + Number(node.getAttribute('x')) * sx, y0 + Number(node.getAttribute('y')) * sy, Number(node.getAttribute('w')) * sx, Number(node.getAttribute('h')) * sy, src, false, node.getAttribute('flipH') == '1', node.getAttribute('flipV') == '1');
	} else if (name == 'text') {
		var str = this.evaluateAttribute(node, 'str', state);
		canvas.text(x0 + Number(node.getAttribute('x')) * sx, y0 + Number(node.getAttribute('y')) * sy, 0, 0, str, node.getAttribute('align'), node.getAttribute('valign'), node.getAttribute('vertical'));
	} else if (name == 'include-shape') {
		var stencil = mxStencilRegistry.getStencil(node.getAttribute('name'));
		if (stencil != null) {
			var x = x0 + Number(node.getAttribute('x')) * sx;
			var y = y0 + Number(node.getAttribute('y')) * sy;
			var w = Number(node.getAttribute('w')) * sx;
			var h = Number(node.getAttribute('h')) * sy;
			var tmp = new mxRectangle(x, y, w, h);
			stencil.drawShape(canvas, state, tmp, true);
			stencil.drawShape(canvas, state, tmp, false);
		}
	} else if (name == 'fillstroke') {
		canvas.fillAndStroke();
	} else if (name == 'fill') {
		canvas.fill();
	} else if (name == 'stroke') {
		canvas.stroke();
	} else if (name == 'strokewidth') {
		canvas.setStrokeWidth(Number(node.getAttribute('width')) * minScale);
	} else if (name == 'dashed') {
		canvas.setDashed(node.getAttribute('dashed') == '1');
	} else if (name == 'dashpattern') {
		var value = node.getAttribute('pattern');
		if (value != null) {
			var tmp = value.split(' ');
			var pat = [];
			for (var i = 0; i < tmp.length; i++) {
				if (tmp[i].length > 0) {
					pat.push(Number(tmp[i]) * minScale);
				}
			}
			value = pat.join(' ');
		}
		canvas.setDashPattern(value);
	} else if (name == 'strokecolor') {
		canvas.setStrokeColor(node.getAttribute('color'));
	} else if (name == 'linecap') {
		canvas.setLineCap(node.getAttribute('cap'));
	} else if (name == 'linejoin') {
		canvas.setLineJoin(node.getAttribute('join'));
	} else if (name == 'miterlimit') {
		canvas.setMiterLimit(Number(node.getAttribute('limit')));
	} else if (name == 'fillcolor') {
		canvas.setFillColor(node.getAttribute('color'));
	} else if (name == 'fontcolor') {
		canvas.setFontColor(node.getAttribute('color'));
	} else if (name == 'fontstyle') {
		canvas.setFontStyle(node.getAttribute('style'));
	} else if (name == 'fontfamily') {
		canvas.setFontFamily(node.getAttribute('family'));
	} else if (name == 'fontsize') {
		canvas.setFontSize(Number(node.getAttribute('size')) * minScale);
	}
};
var mxStencilRegistry = {
	stencils: [],
	addStencil: function(name, stencil) {
		mxStencilRegistry.stencils[name] = stencil;
	},
	getStencil: function(name) {
		return mxStencilRegistry.stencils[name];
	}
};
function mxStencilShape(stencil) {
	this.stencil = stencil;
};
mxStencilShape.prototype = new mxShape();
mxStencilShape.prototype.constructor = mxStencilShape;
mxStencilShape.prototype.mixedModeHtml = false;
mxStencilShape.prototype.preferModeHtml = false;
mxStencilShape.prototype.stencil = null;
mxStencilShape.prototype.state = null;
mxStencilShape.prototype.apply = function(state) {
	this.state = state;
	mxShape.prototype.apply.apply(this, arguments);
};
mxStencilShape.prototype.createSvg = function() {
	var node = document.createElementNS(mxConstants.NS_SVG, 'g');
	this.configureSvgShape(node);
	return node;
};
mxStencilShape.prototype.configureHtmlShape = function(node) {
	mxShape.prototype.configureHtmlShape.apply(this, arguments);
	if (!mxUtils.isVml(node)) {
		node.style.overflow = 'visible';
	}
};
mxStencilShape.prototype.createVml = function() {
	var name = (document.documentMode == 8) ? 'div': 'v:group';
	var node = document.createElement(name);
	this.configureTransparentBackground(node);
	node.style.position = 'absolute';
	return node;
};
mxStencilShape.prototype.configureVmlShape = function(node) {};
mxStencilShape.prototype.redraw = function() {
	if (this.dialect == mxConstants.DIALECT_SVG) {
		this.redrawShape();
	} else {
		this.node.style.visibility = 'hidden';
		this.redrawShape();
		this.node.style.visibility = 'visible';
	}
};
mxStencilShape.prototype.redrawShape = function() {
	if (this.dialect != mxConstants.DIALECT_SVG) {
		this.node.innerHTML = '';
		this.node.style.left = Math.round(this.bounds.x) + 'px';
		this.node.style.top = Math.round(this.bounds.y) + 'px';
		var w = Math.round(this.bounds.width);
		var h = Math.round(this.bounds.height);
		this.node.style.width = w + 'px';
		this.node.style.height = h + 'px';
		if (mxUtils.isVml(this.node)) {
			this.node.coordsize = w + ',' + h;
		}
	} else {
		while (this.node.firstChild != null) {
			this.node.removeChild(this.node.firstChild);
		}
	}
	this.stencil.renderDom(this, this.bounds, this.node);
};
var mxMarker = {
	markers: [],
	paintMarker: function(node, type, p0, pe, color, strokewidth, size, scale, x0, y0, source, style) {
		var marker = mxMarker.markers[type];
		var result = null;
		if (marker != null) {
			var isVml = mxUtils.isVml(node);
			var dx = pe.x - p0.x;
			var dy = pe.y - p0.y;
			if (isNaN(dx) || isNaN(dy)) {
				return;
			}
			var dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
			var nx = dx * scale / dist;
			var ny = dy * scale / dist;
			pe = pe.clone();
			if (isVml) {
				pe.x -= x0;
				pe.y -= y0;
			}
			var filled = true;
			var key = (source) ? mxConstants.STYLE_STARTFILL: mxConstants.STYLE_ENDFILL;
			if (style[key] == 0) {
				filled = false;
			}
			if (isVml) {
				node.strokecolor = color;
				if (filled) {
					node.fillcolor = color;
				} else {
					node.filled = 'false';
				}
			} else {
				node.setAttribute('stroke', color);
				var op = (style.opacity != null) ? style.opacity / 100 : 1;
				node.setAttribute('stroke-opacity', op);
				if (filled) {
					node.setAttribute('fill', color);
					node.setAttribute('fill-opacity', op);
				} else {
					node.setAttribute('fill', 'none');
				}
			}
			result = marker.call(this, node, type, pe, nx, ny, strokewidth, size, scale, isVml);
		}
		return result;
	}
}; (function() {
	var tmp = function(node, type, pe, nx, ny, strokewidth, size, scale, isVml) {
		var endOffsetX = nx * strokewidth * 1.118;
		var endOffsetY = ny * strokewidth * 1.118;
		pe.x -= endOffsetX;
		pe.y -= endOffsetY;
		nx = nx * (size + strokewidth);
		ny = ny * (size + strokewidth);
		if (isVml) {
			node.path = 'm' + Math.round(pe.x) + ',' + Math.round(pe.y) + ' l' + Math.round(pe.x - nx - ny / 2) + ' ' + Math.round(pe.y - ny + nx / 2) + ((type != mxConstants.ARROW_CLASSIC) ? '': ' ' + Math.round(pe.x - nx * 3 / 4) + ' ' + Math.round(pe.y - ny * 3 / 4)) + ' ' + Math.round(pe.x + ny / 2 - nx) + ' ' + Math.round(pe.y - ny - nx / 2) + ' x e';
			node.setAttribute('strokeweight', (strokewidth * scale) + 'px');
		} else {
			node.setAttribute('d', 'M ' + pe.x + ' ' + pe.y + ' L ' + (pe.x - nx - ny / 2) + ' ' + (pe.y - ny + nx / 2) + ((type != mxConstants.ARROW_CLASSIC) ? '': ' L ' + (pe.x - nx * 3 / 4) + ' ' + (pe.y - ny * 3 / 4)) + ' L ' + (pe.x + ny / 2 - nx) + ' ' + (pe.y - ny - nx / 2) + ' z');
			node.setAttribute('stroke-width', strokewidth * scale);
		}
		var f = (type != mxConstants.ARROW_CLASSIC) ? 1 : 3 / 4;
		return new mxPoint( - nx * f - endOffsetX, -ny * f - endOffsetY);
	};
	mxMarker.markers[mxConstants.ARROW_CLASSIC] = tmp;
	mxMarker.markers[mxConstants.ARROW_BLOCK] = tmp;
} ());
mxMarker.markers[mxConstants.ARROW_OPEN] = function(node, type, pe, nx, ny, strokewidth, size, scale, isVml) {
	var endOffsetX = nx * strokewidth * 1.118;
	var endOffsetY = ny * strokewidth * 1.118;
	pe.x -= endOffsetX;
	pe.y -= endOffsetY;
	nx = nx * (size + strokewidth);
	ny = ny * (size + strokewidth);
	if (isVml) {
		node.path = 'm' + Math.round(pe.x - nx - ny / 2) + ' ' + Math.round(pe.y - ny + nx / 2) + ' l' + Math.round(pe.x) + ' ' + Math.round(pe.y) + ' ' + Math.round(pe.x + ny / 2 - nx) + ' ' + Math.round(pe.y - ny - nx / 2) + ' e nf';
		node.setAttribute('strokeweight', (strokewidth * scale) + 'px');
	} else {
		node.setAttribute('d', 'M ' + (pe.x - nx - ny / 2) + ' ' + (pe.y - ny + nx / 2) + ' L ' + (pe.x) + ' ' + (pe.y) + ' L ' + (pe.x + ny / 2 - nx) + ' ' + (pe.y - ny - nx / 2));
		node.setAttribute('stroke-width', strokewidth * scale);
		node.setAttribute('fill', 'none');
	}
	return new mxPoint( - endOffsetX * 2, -endOffsetY * 2);
};
mxMarker.markers[mxConstants.ARROW_OVAL] = function(node, type, pe, nx, ny, strokewidth, size, scale, isVml) {
	nx *= size;
	ny *= size;
	nx *= 0.5 + strokewidth / 2;
	ny *= 0.5 + strokewidth / 2;
	var absSize = size * scale;
	var radius = absSize / 2;
	if (isVml) {
		node.path = 'm' + Math.round(pe.x + radius) + ' ' + Math.round(pe.y) + ' at ' + Math.round(pe.x - radius) + ' ' + Math.round(pe.y - radius) + ' ' + Math.round(pe.x + radius) + ' ' + Math.round(pe.y + radius) + ' ' + Math.round(pe.x + radius) + ' ' + Math.round(pe.y) + ' ' + Math.round(pe.x + radius) + ' ' + Math.round(pe.y) + ' x e';
		node.setAttribute('strokeweight', (strokewidth * scale) + 'px');
	} else {
		node.setAttribute('d', 'M ' + (pe.x - radius) + ' ' + (pe.y) + ' a ' + (radius) + ' ' + (radius) + ' 0  1,1 ' + (absSize) + ' 0' + ' a ' + (radius) + ' ' + (radius) + ' 0  1,1 ' + ( - absSize) + ' 0 z');
		node.setAttribute('stroke-width', strokewidth * scale);
	}
	return new mxPoint( - nx / (2 + strokewidth), -ny / (2 + strokewidth));
}; (function() {
	var tmp_diamond = function(node, type, pe, nx, ny, strokewidth, size, scale, isVml) {
		var swFactor = (type == mxConstants.ARROW_DIAMOND) ? 0.7071 : 0.9862;
		var endOffsetX = nx * strokewidth * swFactor;
		var endOffsetY = ny * strokewidth * swFactor;
		nx = nx * (size + strokewidth);
		ny = ny * (size + strokewidth);
		pe.x -= endOffsetX + nx / 2;
		pe.y -= endOffsetY + ny / 2;
		var tk = ((type == mxConstants.ARROW_DIAMOND) ? 2 : 3.4);
		if (isVml) {
			node.path = 'm' + Math.round(pe.x + nx / 2) + ' ' + Math.round(pe.y + ny / 2) + ' l' + Math.round(pe.x - ny / tk) + ' ' + Math.round(pe.y + nx / tk) + ' ' + Math.round(pe.x - nx / 2) + ' ' + Math.round(pe.y - ny / 2) + ' ' + Math.round(pe.x + ny / tk) + ' ' + Math.round(pe.y - nx / tk) + ' x e';
			node.setAttribute('strokeweight', (strokewidth * scale) + 'px');
		} else {
			node.setAttribute('d', 'M ' + (pe.x + nx / 2) + ' ' + (pe.y + ny / 2) + ' L ' + (pe.x - ny / tk) + ' ' + (pe.y + nx / tk) + ' L ' + (pe.x - nx / 2) + ' ' + (pe.y - ny / 2) + ' L ' + (pe.x + ny / tk) + ' ' + (pe.y - nx / tk) + ' z');
			node.setAttribute('stroke-width', strokewidth * scale);
		}
		return new mxPoint( - endOffsetX - nx, -endOffsetY - ny);
	};
	mxMarker.markers[mxConstants.ARROW_DIAMOND] = tmp_diamond;
	mxMarker.markers[mxConstants.ARROW_DIAMOND_THIN] = tmp_diamond;
} ());
function mxActor(bounds, fill, stroke, strokewidth) {
	this.bounds = bounds;
	this.fill = fill;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth: 1;
};
mxActor.prototype = new mxShape();
mxActor.prototype.constructor = mxActor;
mxActor.prototype.mixedModeHtml = false;
mxActor.prototype.preferModeHtml = false;
mxActor.prototype.createVml = function() {
	var node = document.createElement('v:shape');
	node.style.position = 'absolute';
	this.configureVmlShape(node);
	return node;
};
mxActor.prototype.redrawVml = function() {
	this.updateVmlShape(this.node);
	this.node.path = this.createPath();
};
mxActor.prototype.createSvg = function() {
	return this.createSvgGroup('path');
};
mxActor.prototype.redrawSvg = function() {
	var strokeWidth = Math.round(Math.max(1, this.strokewidth * this.scale));
	this.innerNode.setAttribute('stroke-width', strokeWidth);
	this.innerNode.setAttribute('stroke-linejoin', 'round');
	if (this.crisp) {
		this.innerNode.setAttribute('shape-rendering', 'crispEdges');
	} else {
		this.innerNode.removeAttribute('shape-rendering');
	}
	var d = this.createPath();
	if (d.length > 0) {
		this.innerNode.setAttribute('d', d);
		if (this.shadowNode != null) {
			this.shadowNode.setAttribute('transform', this.getSvgShadowTransform());
			this.shadowNode.setAttribute('stroke-width', strokeWidth);
			this.shadowNode.setAttribute('d', d);
		}
	} else {
		this.innerNode.removeAttribute('d');
		if (this.shadowNode != null) {
			this.shadowNode.removeAttribute('d');
		}
	}
	if (this.isDashed) {
		var phase = Math.max(1, Math.round(3 * this.scale * this.strokewidth));
		this.innerNode.setAttribute('stroke-dasharray', phase + ' ' + phase);
	}
};
mxActor.prototype.redrawPath = function(path, x, y, w, h) {
	var width = w / 3;
	path.moveTo(0, h);
	path.curveTo(0, 3 * h / 5, 0, 2 * h / 5, w / 2, 2 * h / 5);
	path.curveTo(w / 2 - width, 2 * h / 5, w / 2 - width, 0, w / 2, 0);
	path.curveTo(w / 2 + width, 0, w / 2 + width, 2 * h / 5, w / 2, 2 * h / 5);
	path.curveTo(w, 2 * h / 5, w, 3 * h / 5, w, h);
	path.close();
};
function mxCloud(bounds, fill, stroke, strokewidth) {
	this.bounds = bounds;
	this.fill = fill;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth: 1;
};
mxCloud.prototype = new mxActor();
mxCloud.prototype.constructor = mxActor;
mxCloud.prototype.redrawPath = function(path, x, y, w, h) {
	path.moveTo(0.25 * w, 0.25 * h);
	path.curveTo(0.05 * w, 0.25 * h, 0, 0.5 * h, 0.16 * w, 0.55 * h);
	path.curveTo(0, 0.66 * h, 0.18 * w, 0.9 * h, 0.31 * w, 0.8 * h);
	path.curveTo(0.4 * w, h, 0.7 * w, h, 0.8 * w, 0.8 * h);
	path.curveTo(w, 0.8 * h, w, 0.6 * h, 0.875 * w, 0.5 * h);
	path.curveTo(w, 0.3 * h, 0.8 * w, 0.1 * h, 0.625 * w, 0.2 * h);
	path.curveTo(0.5 * w, 0.05 * h, 0.3 * w, 0.05 * h, 0.25 * w, 0.25 * h);
	path.close();
};
function mxRectangleShape(bounds, fill, stroke, strokewidth) {
	this.bounds = bounds;
	this.fill = fill;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth: 1;
};
mxRectangleShape.prototype = new mxShape();
mxRectangleShape.prototype.constructor = mxRectangleShape;
mxRectangleShape.prototype.createHtml = function() {
	var node = document.createElement('DIV');
	this.configureHtmlShape(node);
	return node;
};
mxRectangleShape.prototype.createVml = function() {
	var name = (this.isRounded) ? 'v:roundrect': 'v:rect';
	var node = document.createElement(name);
	this.configureVmlShape(node);
	return node;
};
mxRectangleShape.prototype.createSvg = function() {
	return this.createSvgGroup('rect');
};
function mxEllipse(bounds, fill, stroke, strokewidth) {
	this.bounds = bounds;
	this.fill = fill;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth: 1;
};
mxEllipse.prototype = new mxShape();
mxEllipse.prototype.constructor = mxEllipse;
mxEllipse.prototype.mixedModeHtml = false;
mxEllipse.prototype.preferModeHtml = false;
mxEllipse.prototype.createVml = function() {
	var node = document.createElement('v:arc');
	node.startangle = '0';
	node.endangle = '360';
	this.configureVmlShape(node);
	return node;
};
mxEllipse.prototype.createSvg = function() {
	return this.createSvgGroup('ellipse');
};
mxEllipse.prototype.redrawSvg = function() {
	if (this.crisp) {
		this.innerNode.setAttribute('shape-rendering', 'crispEdges');
	} else {
		this.innerNode.removeAttribute('shape-rendering');
	}
	this.updateSvgNode(this.innerNode);
	this.updateSvgNode(this.shadowNode);
};
mxEllipse.prototype.updateSvgNode = function(node) {
	if (node != null) {
		var strokeWidth = Math.round(Math.max(1, this.strokewidth * this.scale));
		node.setAttribute('stroke-width', strokeWidth);
		node.setAttribute('cx', this.bounds.x + this.bounds.width / 2);
		node.setAttribute('cy', this.bounds.y + this.bounds.height / 2);
		node.setAttribute('rx', this.bounds.width / 2);
		node.setAttribute('ry', this.bounds.height / 2);
		if (this.shadowNode != null) {
			this.shadowNode.setAttribute('transform', this.getSvgShadowTransform());
		}
		if (this.isDashed) {
			var phase = Math.max(1, Math.round(3 * this.scale * this.strokewidth));
			node.setAttribute('stroke-dasharray', phase + ' ' + phase);
		}
	}
};
function mxDoubleEllipse(bounds, fill, stroke, strokewidth) {
	this.bounds = bounds;
	this.fill = fill;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth: 1;
};
mxDoubleEllipse.prototype = new mxShape();
mxDoubleEllipse.prototype.constructor = mxDoubleEllipse;
mxDoubleEllipse.prototype.vmlNodes = mxDoubleEllipse.prototype.vmlNodes.concat(['background', 'foreground']);
mxDoubleEllipse.prototype.mixedModeHtml = false;
mxDoubleEllipse.prototype.preferModeHtml = false;
mxDoubleEllipse.prototype.createVml = function() {
	var node = document.createElement('v:group');
	this.background = document.createElement('v:arc');
	this.background.startangle = '0';
	this.background.endangle = '360';
	this.configureVmlShape(this.background);
	node.appendChild(this.background);
	this.label = this.background;
	this.isShadow = false;
	this.fill = null;
	this.foreground = document.createElement('v:oval');
	this.configureVmlShape(this.foreground);
	node.appendChild(this.foreground);
	this.stroke = null;
	this.configureVmlShape(node);
	return node;
};
mxDoubleEllipse.prototype.redrawVml = function() {
	this.updateVmlShape(this.node);
	this.updateVmlShape(this.background);
	this.updateVmlShape(this.foreground);
	var s = this.strokewidth * this.scale;
	var inset = 3 + s;
	var w = Math.round(this.bounds.width);
	var h = Math.round(this.bounds.height);
	this.foreground.style.top = inset + 'px';
	this.foreground.style.left = inset + 'px';
	this.foreground.style.width = Math.max(0, w - 2 * inset) + 'px';
	this.foreground.style.height = Math.max(0, h - 2 * inset) + 'px';
};
mxDoubleEllipse.prototype.createSvg = function() {
	var g = this.createSvgGroup('ellipse');
	this.foreground = document.createElementNS(mxConstants.NS_SVG, 'ellipse');
	if (this.stroke != null) {
		this.foreground.setAttribute('stroke', this.stroke);
	} else {
		this.foreground.setAttribute('stroke', 'none');
	}
	this.foreground.setAttribute('fill', 'none');
	g.appendChild(this.foreground);
	return g;
};
mxDoubleEllipse.prototype.redrawSvg = function() {
	var s = this.strokewidth * this.scale;
	if (this.crisp) {
		this.innerNode.setAttribute('shape-rendering', 'crispEdges');
		this.foreground.setAttribute('shape-rendering', 'crispEdges');
	} else {
		this.innerNode.removeAttribute('shape-rendering');
		this.foreground.removeAttribute('shape-rendering');
	}
	this.updateSvgNode(this.innerNode);
	this.updateSvgNode(this.shadowNode);
	this.updateSvgNode(this.foreground, 3 * this.scale + s);
	if (this.isDashed) {
		var phase = Math.max(1, Math.round(3 * this.scale * this.strokewidth));
		this.innerNode.setAttribute('stroke-dasharray', phase + ' ' + phase);
	}
};
mxDoubleEllipse.prototype.updateSvgNode = function(node, inset) {
	inset = (inset != null) ? inset: 0;
	if (node != null) {
		var strokeWidth = Math.round(Math.max(1, this.strokewidth * this.scale));
		node.setAttribute('stroke-width', strokeWidth);
		node.setAttribute('cx', this.bounds.x + this.bounds.width / 2);
		node.setAttribute('cy', this.bounds.y + this.bounds.height / 2);
		node.setAttribute('rx', Math.max(0, this.bounds.width / 2 - inset));
		node.setAttribute('ry', Math.max(0, this.bounds.height / 2 - inset));
		if (this.shadowNode != null) {
			this.shadowNode.setAttribute('transform', this.getSvgShadowTransform());
		}
	}
};
function mxRhombus(bounds, fill, stroke, strokewidth) {
	this.bounds = bounds;
	this.fill = fill;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth: 1;
};
mxRhombus.prototype = new mxShape();
mxRhombus.prototype.constructor = mxRhombus;
mxRhombus.prototype.mixedModeHtml = false;
mxRhombus.prototype.preferModeHtml = false;
mxRhombus.prototype.createHtml = function() {
	var node = document.createElement('DIV');
	this.configureHtmlShape(node);
	return node;
};
mxRhombus.prototype.createVml = function() {
	var node = document.createElement('v:shape');
	this.configureVmlShape(node);
	return node;
};
mxRhombus.prototype.createSvg = function() {
	return this.createSvgGroup('path');
};
mxRhombus.prototype.redrawVml = function() {
	this.updateVmlShape(this.node);
	var x = 0;
	var y = 0;
	var w = Math.round(this.bounds.width);
	var h = Math.round(this.bounds.height);
	this.node.path = 'm ' + Math.round(x + w / 2) + ' ' + y + ' l ' + (x + w) + ' ' + Math.round(y + h / 2) + ' l ' + Math.round(x + w / 2) + ' ' + (y + h) + ' l ' + x + ' ' + Math.round(y + h / 2) + ' x e';
};
mxRhombus.prototype.redrawHtml = function() {
	this.updateHtmlShape(this.node);
};
mxRhombus.prototype.redrawSvg = function() {
	this.updateSvgNode(this.innerNode);
	if (this.shadowNode != null) {
		this.updateSvgNode(this.shadowNode);
	}
};
mxRhombus.prototype.updateSvgNode = function(node) {
	var strokeWidth = Math.round(Math.max(1, this.strokewidth * this.scale));
	node.setAttribute('stroke-width', strokeWidth);
	var x = this.bounds.x;
	var y = this.bounds.y;
	var w = this.bounds.width;
	var h = this.bounds.height;
	var d = 'M ' + Math.round(x + w / 2) + ' ' + Math.round(y) + ' L ' + Math.round(x + w) + ' ' + Math.round(y + h / 2) + ' L ' + Math.round(x + w / 2) + ' ' + Math.round(y + h) + ' L ' + Math.round(x) + ' ' + Math.round(y + h / 2) + ' Z ';
	node.setAttribute('d', d);
	this.updateSvgTransform(node, node == this.shadowNode);
	if (this.isDashed) {
		var phase = Math.max(1, Math.round(3 * this.scale * this.strokewidth));
		node.setAttribute('stroke-dasharray', phase + ' ' + phase);
	}
};
function mxPolyline(points, stroke, strokewidth) {
	this.points = points;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth: 1;
};
mxPolyline.prototype = new mxShape();
mxPolyline.prototype.constructor = mxPolyline;
mxPolyline.prototype.create = function() {
	var node = null;
	if (this.dialect == mxConstants.DIALECT_SVG) {
		node = this.createSvg();
	} else if (this.dialect == mxConstants.DIALECT_STRICTHTML || (this.dialect == mxConstants.DIALECT_PREFERHTML && this.points != null && this.points.length > 0)) {
		node = document.createElement('DIV');
		this.configureHtmlShape(node);
		node.style.borderStyle = '';
		node.style.background = '';
	} else {
		node = document.createElement('v:shape');
		this.configureVmlShape(node);
		var strokeNode = document.createElement('v:stroke');
		if (this.opacity != null) {
			strokeNode.opacity = this.opacity + '%';
		}
		node.appendChild(strokeNode);
	}
	return node;
};
mxPolyline.prototype.redrawVml = function() {
	if (this.points != null && this.points.length > 0 && this.points[0] != null) {
		this.bounds = new mxRectangle(this.points[0].x, this.points[0].y, 0, 0);
		for (var i = 1; i < this.points.length; i++) {
			this.bounds.add(new mxRectangle(this.points[i].x, this.points[i].y, 0, 0));
		}
	}
	mxShape.prototype.redrawVml.apply(this, arguments);
};
mxPolyline.prototype.createSvg = function() {
	var g = this.createSvgGroup('path');
	this.pipe = this.createSvgPipe();
	g.appendChild(this.pipe);
	return g;
};
mxPolyline.prototype.redrawSvg = function() {
	this.updateSvgShape(this.innerNode);
	var d = this.innerNode.getAttribute('d');
	if (d != null) {
		this.pipe.setAttribute('d', d);
		var strokeWidth = Math.round(Math.max(1, this.strokewidth * this.scale));
		this.pipe.setAttribute('stroke-width', strokeWidth + mxShape.prototype.SVG_STROKE_TOLERANCE);
	}
};
function mxArrow(points, fill, stroke, strokewidth, arrowWidth, spacing, endSize) {
	this.points = points;
	this.fill = fill;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth: 1;
	this.arrowWidth = (arrowWidth != null) ? arrowWidth: mxConstants.ARROW_WIDTH;
	this.spacing = (spacing != null) ? spacing: mxConstants.ARROW_SPACING;
	this.endSize = (endSize != null) ? endSize: mxConstants.ARROW_SIZE;
};
mxArrow.prototype = new mxShape();
mxArrow.prototype.constructor = mxArrow;
mxArrow.prototype.mixedModeHtml = false;
mxArrow.prototype.preferModeHtml = false;
mxArrow.prototype.DEG_PER_RAD = 57.2957795;
mxArrow.prototype.createVml = function() {
	var node = document.createElement('v:shape');
	node.style.position = 'absolute';
	this.configureVmlShape(node);
	return node;
};
mxArrow.prototype.redrawVml = function() {
	if (this.points != null) {
		this.updateVmlShape(this.node);
		var spacing = this.spacing * this.scale;
		var width = this.arrowWidth * this.scale;
		var arrow = this.endSize * this.scale;
		var p0 = this.points[0].clone();
		p0.x -= this.bounds.x;
		p0.y -= this.bounds.y;
		var pe = this.points[this.points.length - 1].clone();
		pe.x -= this.bounds.x;
		pe.y -= this.bounds.y;
		var dx = pe.x - p0.x;
		var dy = pe.y - p0.y;
		var dist = Math.sqrt(dx * dx + dy * dy);
		var length = dist - 2 * spacing - arrow;
		var nx = dx / dist;
		var ny = dy / dist;
		var basex = length * nx;
		var basey = length * ny;
		var floorx = width * ny / 3;
		var floory = -width * nx / 3;
		var p0x = p0.x - floorx / 2 + spacing * nx;
		var p0y = p0.y - floory / 2 + spacing * ny;
		var p1x = p0x + floorx;
		var p1y = p0y + floory;
		var p2x = p1x + basex;
		var p2y = p1y + basey;
		var p3x = p2x + floorx;
		var p3y = p2y + floory;
		var p5x = p3x - 3 * floorx;
		var p5y = p3y - 3 * floory;
		this.node.path = 'm' + Math.round(p0x) + ' ' + Math.round(p0y) + ' l' + Math.round(p1x) + ' ' + Math.round(p1y) + ' ' + Math.round(p2x) + ' ' + Math.round(p2y) + ' ' + Math.round(p3x) + ' ' + Math.round(p3y) + ' ' + Math.round(pe.x - spacing * nx) + ' ' + Math.round(pe.y - spacing * ny) + ' ' + Math.round(p5x) + ' ' + Math.round(p5y) + ' ' + Math.round(p5x + floorx) + ' ' + Math.round(p5y + floory) + ' ' + Math.round(p0x) + ' ' + Math.round(p0y) + ' xe';
	}
};
mxArrow.prototype.createSvg = function() {
	return this.createSvgGroup('path');
};
mxArrow.prototype.redrawSvg = function() {
	if (this.points != null) {
		var strokeWidth = Math.round(Math.max(1, this.strokewidth * this.scale));
		this.innerNode.setAttribute('stroke-width', strokeWidth);
		var p0 = this.points[0];
		var pe = this.points[this.points.length - 1];
		var tdx = pe.x - p0.x;
		var tdy = pe.y - p0.y;
		var dist = Math.sqrt(tdx * tdx + tdy * tdy);
		var offset = this.spacing * this.scale;
		var h = Math.min(25, Math.max(20, dist / 5)) * this.scale;
		var w = dist - 2 * offset;
		var x = p0.x + offset;
		var y = p0.y - h / 2;
		var dx = h;
		var dy = h * 0.3;
		var right = x + w;
		var bottom = y + h;
		var d = 'M ' + x + ' ' + (y + dy) + ' L ' + (right - dx) + ' ' + (y + dy) + ' L ' + (right - dx) + ' ' + y + ' L ' + right + ' ' + (y + h / 2) + ' L ' + (right - dx) + ' ' + bottom + ' L ' + (right - dx) + ' ' + (bottom - dy) + ' L ' + x + ' ' + (bottom - dy) + ' Z';
		this.innerNode.setAttribute('d', d);
		var dx = pe.x - p0.x;
		var dy = pe.y - p0.y;
		var theta = Math.atan(dy / dx) * this.DEG_PER_RAD;
		if (dx < 0) {
			theta -= 180;
		}
		this.innerNode.setAttribute('transform', 'rotate(' + theta + ',' + p0.x + ',' + p0.y + ')');
		if (this.isDashed) {
			var phase = Math.max(1, Math.round(3 * this.scale * this.strokewidth));
			this.innerNode.setAttribute('stroke-dasharray', phase + ' ' + phase);
		}
		if (this.shadowNode != null) {
			this.shadowNode.setAttribute('d', this.innerNode.getAttribute('d'));
			this.shadowNode.setAttribute('transform', this.getSvgShadowTransform() + this.innerNode.getAttribute('transform'));
			this.shadowNode.setAttribute('stroke-dasharray', this.innerNode.getAttribute('stroke-dasharray'));
		}
	}
};
function mxText(value, bounds, align, valign, color, family, size, fontStyle, spacing, spacingTop, spacingRight, spacingBottom, spacingLeft, horizontal, background, border, wrap, clipped, overflow, labelPadding) {
	this.value = value;
	this.bounds = bounds;
	this.color = (color != null) ? color: 'black';
	this.align = (align != null) ? align: '';
	this.valign = (valign != null) ? valign: '';
	this.family = (family != null) ? family: mxConstants.DEFAULT_FONTFAMILY;
	this.size = (size != null) ? size: mxConstants.DEFAULT_FONTSIZE;
	this.fontStyle = (fontStyle != null) ? fontStyle: 0;
	this.spacing = parseInt(spacing || 2);
	this.spacingTop = this.spacing + parseInt(spacingTop || 0);
	this.spacingRight = this.spacing + parseInt(spacingRight || 0);
	this.spacingBottom = this.spacing + parseInt(spacingBottom || 0);
	this.spacingLeft = this.spacing + parseInt(spacingLeft || 0);
	this.horizontal = (horizontal != null) ? horizontal: true;
	this.background = background;
	this.border = border;
	this.wrap = (wrap != null) ? wrap: false;
	this.clipped = (clipped != null) ? clipped: false;
	this.overflow = (overflow != null) ? overflow: 'visible';
	this.labelPadding = (labelPadding != null) ? labelPadding: 0;
};
mxText.prototype = new mxShape();
mxText.prototype.constructor = mxText;
mxText.prototype.replaceLinefeeds = true;
mxText.prototype.ieVerticalFilter = 'progid:DXImageTransform.Microsoft.BasicImage(rotation=3)';
mxText.prototype.verticalTextDegree = -90;
mxText.prototype.forceIgnoreStringSize = false;
mxText.prototype.isStyleSet = function(style) {
	return (this.fontStyle & style) == style;
};
mxText.prototype.create = function(container) {
	var node = null;
	if (this.dialect == mxConstants.DIALECT_SVG) {
		node = this.createSvg();
	} else if (this.dialect == mxConstants.DIALECT_STRICTHTML || this.dialect == mxConstants.DIALECT_PREFERHTML || !mxUtils.isVml(container)) {
		if (mxClient.IS_SVG && !mxClient.NO_FO) {
			node = this.createForeignObject();
		} else {
			node = this.createHtml();
		}
	} else {
		node = this.createVml();
	}
	return node;
};
mxText.prototype.createForeignObject = function() {
	var node = document.createElementNS(mxConstants.NS_SVG, 'g');
	var fo = document.createElementNS(mxConstants.NS_SVG, 'foreignObject');
	fo.setAttribute('pointer-events', 'fill');
	if (this.overflow == 'hidden') {
		fo.style.overflow = 'hidden';
	} else {
		fo.style.overflow = 'visible';
	}
	var body = document.createElementNS(mxConstants.NS_XHTML, 'body');
	body.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
	body.style.margin = '0px';
	body.style.height = '100%';
	fo.appendChild(body);
	node.appendChild(fo);
	return node;
};
mxText.prototype.createHtml = function() {
	var table = this.createHtmlTable();
	table.style.position = 'absolute';
	return table;
};
mxText.prototype.createVml = function() {
	return document.createElement('v:textbox');
};
mxText.prototype.redrawHtml = function() {
	this.redrawVml();
};
mxText.prototype.getOffset = function(outerWidth, outerHeight, actualWidth, actualHeight, horizontal) {
	horizontal = (horizontal != null) ? horizontal: this.horizontal;
	var tmpalign = (horizontal) ? this.align: this.valign;
	var tmpvalign = (horizontal) ? this.valign: this.align;
	var dx = actualWidth - outerWidth;
	var dy = actualHeight - outerHeight;
	if (tmpalign == mxConstants.ALIGN_CENTER || tmpalign == mxConstants.ALIGN_MIDDLE) {
		dx = Math.round(dx / 2);
	} else if (tmpalign == mxConstants.ALIGN_LEFT || tmpalign === mxConstants.ALIGN_TOP) {
		dx = (horizontal) ? 0 : (actualWidth - actualHeight) / 2;
	} else if (!horizontal) {
		dx = (actualWidth + actualHeight) / 2 - outerWidth;
	}
	if (tmpvalign == mxConstants.ALIGN_MIDDLE || tmpvalign == mxConstants.ALIGN_CENTER) {
		dy = Math.round(dy / 2);
	} else if (tmpvalign == mxConstants.ALIGN_TOP || tmpvalign == mxConstants.ALIGN_LEFT) {
		dy = (horizontal) ? 0 : (actualHeight + actualWidth) / 2 - outerHeight;
	} else if (!horizontal) {
		dy = (actualHeight - actualWidth) / 2;
	}
	return new mxPoint(dx, dy);
};
mxText.prototype.getSpacing = function(horizontal) {
	horizontal = (horizontal != null) ? horizontal: this.horizontal;
	var dx = 0;
	var dy = 0;
	if (this.align == mxConstants.ALIGN_CENTER) {
		dx = (this.spacingLeft - this.spacingRight) / 2;
	} else if (this.align == mxConstants.ALIGN_RIGHT) {
		dx = -this.spacingRight;
	} else {
		dx = this.spacingLeft;
	}
	if (this.valign == mxConstants.ALIGN_MIDDLE) {
		dy = (this.spacingTop - this.spacingBottom) / 2;
	} else if (this.valign == mxConstants.ALIGN_BOTTOM) {
		dy = -this.spacingBottom;
	} else {
		dy = this.spacingTop;
	}
	return (horizontal) ? new mxPoint(dx, dy) : new mxPoint(dy, dx);
};
mxText.prototype.createHtmlTable = function() {
	var table = document.createElement('table');
	table.style.borderCollapse = 'collapse';
	var tbody = document.createElement('tbody');
	var tr = document.createElement('tr');
	var td = document.createElement('td');
	if (document.documentMode >= 9) {
		td.style.height = '100%';
	}
	tr.appendChild(td);
	tbody.appendChild(tr);
	table.appendChild(tbody);
	return table;
};
mxText.prototype.updateHtmlTable = function(table, scale) {
	scale = (scale != null) ? scale: 1;
	var td = table.firstChild.firstChild.firstChild;
	if (this.wrap) {
		table.style.width = '';
	}
	if (mxUtils.isNode(this.value)) {
		if (td.firstChild != this.value) {
			if (td.firstChild != null) {
				td.removeChild(td.firstChild);
			}
			td.appendChild(this.value);
		}
	} else {
		if (this.lastValue != this.value) {
			td.innerHTML = (this.replaceLinefeeds) ? this.value.replace(/\n/g, '<br/>') : this.value;
			this.lastValue = this.value;
		}
	}
	var fontSize = Math.round(this.size * scale);
	if (fontSize <= 0) {
		table.style.visibility = 'hidden';
	} else {
		table.style.visibility = '';
	}
	table.style.fontSize = fontSize + 'px';
	table.style.color = this.color;
	table.style.fontFamily = this.family;
	if (this.isStyleSet(mxConstants.FONT_BOLD)) {
		table.style.fontWeight = 'bold';
	} else {
		table.style.fontWeight = 'normal';
	}
	if (this.isStyleSet(mxConstants.FONT_ITALIC)) {
		table.style.fontStyle = 'italic';
	} else {
		table.style.fontStyle = '';
	}
	if (this.isStyleSet(mxConstants.FONT_UNDERLINE)) {
		table.style.textDecoration = 'underline';
	} else {
		table.style.textDecoration = '';
	}
	if (mxClient.IS_IE) {
		if (this.isStyleSet(mxConstants.FONT_SHADOW)) {
			td.style.filter = 'Shadow(Color=#666666,' + 'Direction=135,Strength=%)';
		} else {
			td.style.removeAttribute('filter');
		}
	}
	td.style.textAlign = (this.align == mxConstants.ALIGN_RIGHT) ? 'right': ((this.align == mxConstants.ALIGN_CENTER) ? 'center': 'left');
	td.style.verticalAlign = (this.valign == mxConstants.ALIGN_BOTTOM) ? 'bottom': ((this.valign == mxConstants.ALIGN_MIDDLE) ? 'middle': 'top');
	if (this.value.length > 0 && this.background != null) {
		td.style.background = this.background;
	} else {
		td.style.background = '';
	}
	td.style.padding = this.labelPadding + 'px';
	if (this.value.length > 0 && this.border != null) {
		table.style.borderColor = this.border;
		table.style.borderWidth = '1px';
		table.style.borderStyle = 'solid';
	} else {
		table.style.borderStyle = 'none';
	}
};
mxText.prototype.updateTableWidth = function(table) {
	var td = table.firstChild.firstChild.firstChild;
	if (this.wrap && this.bounds.width > 0 && this.dialect != mxConstants.DIALECT_SVG) {
		td.style.whiteSpace = 'nowrap';
		var space = Math.min(table.offsetWidth, ((this.horizontal || mxUtils.isVml(this.node)) ? this.bounds.width: this.bounds.height) / this.scale);
		if (false) {
			space *= this.scale;
		}
		table.style.width = Math.round(space) + 'px';
		td.style.whiteSpace = 'normal';
	} else {
		table.style.width = '';
	}
	if (!this.wrap) {
		td.style.whiteSpace = 'nowrap';
	} else {
		td.style.whiteSpace = 'normal';
	}
};
mxText.prototype.redrawVml = function() {
	if (this.node.nodeName == 'g') {
		this.redrawForeignObject();
	} else if (mxUtils.isVml(this.node)) {
		this.redrawTextbox();
	} else {
		this.redrawHtmlTable();
	}
};
mxText.prototype.redrawTextbox = function() {
	var textbox = this.node;
	if (textbox.firstChild == null) {
		textbox.appendChild(this.createHtmlTable());
	}
	var table = textbox.firstChild;
	this.updateHtmlTable(table);
	this.updateTableWidth(table);
	if (this.opacity != null) {
		mxUtils.setOpacity(table, this.opacity);
	}
	table.style.filter = '';
	textbox.inset = '0px,0px,0px,0px';
	if (this.overflow != 'fill') {
		var w = table.offsetWidth * this.scale;
		var h = table.offsetHeight * this.scale;
		var offset = this.getOffset(this.bounds.width, this.bounds.height, w, h);
		if (!this.horizontal) {
			table.style.filter = this.ieVerticalFilter;
		}
		var spacing = this.getSpacing();
		var x = this.bounds.x - offset.x + spacing.x * this.scale;
		var y = this.bounds.y - offset.y + spacing.y * this.scale;
		var x0 = this.bounds.x;
		var y0 = this.bounds.y;
		var ow = this.bounds.width;
		var oh = this.bounds.height;
		if (this.horizontal) {
			var tx = Math.round(x - x0);
			var ty = Math.round(y - y0);
			var r = Math.min(0, Math.round(x0 + ow - x - w - 1));
			var b = Math.min(0, Math.round(y0 + oh - y - h - 1));
			textbox.inset = tx + 'px,' + ty + 'px,' + r + 'px,' + b + 'px';
		} else {
			var t = 0;
			var l = 0;
			var r = 0;
			var b = 0;
			if (this.align == mxConstants.ALIGN_CENTER) {
				t = (oh - w) / 2;
				b = t;
			} else if (this.align == mxConstants.ALIGN_LEFT) {
				t = oh - w;
			} else {
				b = oh - w;
			}
			if (this.valign == mxConstants.ALIGN_MIDDLE) {
				l = (ow - h) / 2;
				r = l;
			} else if (this.valign == mxConstants.ALIGN_BOTTOM) {
				l = ow - h;
			} else {
				r = ow - h;
			}
			textbox.inset = l + 'px,' + t + 'px,' + r + 'px,' + b + 'px';
		}
		textbox.style.zoom = this.scale;
		if (this.clipped && this.bounds.width > 0 && this.bounds.height > 0) {
			this.boundingBox = this.bounds.clone();
			var dx = Math.round(x0 - x);
			var dy = Math.round(y0 - y);
			textbox.style.clip = 'rect(' + (dy / this.scale) + ' ' + ((dx + this.bounds.width) / this.scale) + ' ' + ((dy + this.bounds.height) / this.scale) + ' ' + (dx / this.scale) + ')';
		} else {
			this.boundingBox = new mxRectangle(x, y, w, h);
		}
	} else {
		this.boundingBox = this.bounds.clone();
	}
};
mxText.prototype.redrawHtmlTable = function() {
	if (isNaN(this.bounds.x) || isNaN(this.bounds.y) || isNaN(this.bounds.width) || isNaN(this.bounds.height)) {
		return;
	}
	var table = this.node;
	var td = table.firstChild.firstChild.firstChild;
	var oldBrowser = false;
	var fallbackScale = 1;
	if (mxClient.IS_IE) {
		table.style.removeAttribute('filter');
	} else if (false || false) {
		table.style.WebkitTransform = '';
	} else if (!mxClient.IS_IE) {
		table.style.MozTransform = '';
		td.style.MozTransform = '';
	} else {
		if (mxClient.IS_OT) {
			table.style.OTransform = '';
		}
		fallbackScale = this.scale;
		oldBrowser = true;
	}
	td.style.zoom = '';
	this.updateHtmlTable(table, fallbackScale);
	this.updateTableWidth(table);
	if (this.opacity != null) {
		mxUtils.setOpacity(table, this.opacity);
	}
	table.style.left = '';
	table.style.top = '';
	table.style.height = '';
	var currentZoom = parseFloat(td.style.zoom) || 1;
	var ignoreStringSize = this.forceIgnoreStringSize || this.overflow == 'fill' || (this.align == mxConstants.ALIGN_LEFT && this.background == null && this.border == null);
	var w = (ignoreStringSize) ? this.bounds.width: table.offsetWidth / currentZoom;
	var h = (ignoreStringSize) ? this.bounds.height: table.offsetHeight / currentZoom;
	var offset = this.getOffset(this.bounds.width / this.scale, this.bounds.height / this.scale, w, h, oldBrowser || this.horizontal);
	var spacing = this.getSpacing(oldBrowser || this.horizontal);
	var x = this.bounds.x / this.scale - offset.x + spacing.x;
	var y = this.bounds.y / this.scale - offset.y + spacing.y;
	var s = this.scale;
	var s2 = 1;
	var shiftX = 0;
	var shiftY = 0;
	if (!this.horizontal) {
		if (mxClient.IS_IE && mxClient.IS_SVG) {
			table.style.msTransform = 'rotate(' + this.verticalTextDegree + 'deg)';
		} else if (mxClient.IS_IE) {
			table.style.filter = this.ieVerticalFilter;
			shiftX = (w - h) / 2;
			shiftY = -shiftX;
		} else if (false || false) {
			table.style.WebkitTransform = 'rotate(' + this.verticalTextDegree + 'deg)';
		} else if (mxClient.IS_OT) {
			table.style.OTransform = 'rotate(' + this.verticalTextDegree + 'deg)';
		} else if (!mxClient.IS_IE) {
			table.style.MozTransform = 'rotate(' + this.verticalTextDegree + 'deg)';
			td.style.MozTransform = 'rotate(0deg)';
			s2 = 1 / this.scale;
			s = 1;
		}
	}
	var correction = true;
	if (!mxClient.IS_IE || oldBrowser) {
		if (!mxClient.IS_IE) {
			table.style.MozTransform += ' scale(' + this.scale + ')';
			s2 = 1 / this.scale;
		} else if (mxClient.IS_OT) {
			td.style.OTransform = 'scale(' + this.scale + ')';
			table.style.borderWidth = Math.round(this.scale * parseInt(table.style.borderWidth)) + 'px';
		}
	} else if (!oldBrowser) {
		if (document.documentMode >= 9) {
			td.style.msTransform = 'scale(' + this.scale + ')';
		} else if (false || false) {
			td.style.WebkitTransform = 'scale(' + this.scale + ')';
		} else {
			td.style.zoom = this.scale;
			if (table.style.borderWidth != '' && document.documentMode != 8) {
				table.style.borderWidth = Math.round(this.scale * parseInt(table.style.borderWidth)) + 'px';
			}
			if (document.documentMode == 8 || !mxClient.IS_IE) {
				s = 1;
			}
			correction = false;
		}
	}
	if (correction) {
		shiftX = (this.scale - 1) * w / (2 * this.scale);
		shiftY = (this.scale - 1) * h / (2 * this.scale);
		s = 1;
	}
	if (this.overflow != 'fill') {
		var rect = new mxRectangle(Math.round((x + shiftX) * this.scale), Math.round((y + shiftY) * this.scale), Math.round(w * s), Math.round(h * s));
		table.style.left = rect.x + 'px';
		table.style.top = rect.y + 'px';
		table.style.width = rect.width + 'px';
		table.style.height = rect.height + 'px';
		if ((this.background != null || this.border != null) && document.documentMode >= 8) {
			td.innerHTML = '<div style="padding:' + this.labelPadding + 'px;background:' + td.style.background + ';border:' + table.style.border + '">' + this.value + '</div>';
			td.style.padding = '0px';
			td.style.background = '';
			table.style.border = '';
		}
		if (this.clipped && this.bounds.width > 0 && this.bounds.height > 0) {
			this.boundingBox = this.bounds.clone();
			if (this.horizontal || (oldBrowser && !mxClient.IS_OT)) {
				var dx = Math.max(0, offset.x * s);
				var dy = Math.max(0, offset.y * s);
				table.style.clip = 'rect(' + (dy) + 'px ' + (dx + this.bounds.width * s2) + 'px ' + (dy + this.bounds.height * s2) + 'px ' + (dx) + 'px)';
			} else {
				if (mxClient.IS_IE) {
					var uw = this.bounds.width;
					var uh = this.bounds.height;
					var dx = 0;
					var dy = 0;
					if (this.align == mxConstants.ALIGN_LEFT) {
						dx = Math.max(0, w - uh / this.scale) * this.scale;
					} else if (this.align == mxConstants.ALIGN_CENTER) {
						dx = Math.max(0, w - uh / this.scale) * this.scale / 2;
					}
					if (this.valign == mxConstants.ALIGN_BOTTOM) {
						dy = Math.max(0, h - uw / this.scale) * this.scale;
					} else if (this.valign == mxConstants.ALIGN_MIDDLE) {
						dy = Math.max(0, h - uw / this.scale) * this.scale / 2;
					}
					table.style.clip = 'rect(' + (dx) + 'px ' + (dy + uw - 1) + 'px ' + (dx + uh - 1) + 'px ' + (dy) + 'px)';
				} else {
					var uw = this.bounds.width / this.scale;
					var uh = this.bounds.height / this.scale;
					if (mxClient.IS_OT) {
						uw = this.bounds.width;
						uh = this.bounds.height;
					}
					var dx = 0;
					var dy = 0;
					if (this.align == mxConstants.ALIGN_RIGHT) {
						dx = Math.max(0, w - uh);
					} else if (this.align == mxConstants.ALIGN_CENTER) {
						dx = Math.max(0, w - uh) / 2;
					}
					if (this.valign == mxConstants.ALIGN_BOTTOM) {
						dy = Math.max(0, h - uw);
					} else if (this.valign == mxConstants.ALIGN_MIDDLE) {
						dy = Math.max(0, h - uw) / 2;
					}
					if (false || false) {
						dx *= this.scale;
						dy *= this.scale;
						uw *= this.scale;
						uh *= this.scale;
					}
					table.style.clip = 'rect(' + (dy) + ' ' + (dx + uh) + ' ' + (dy + uw) + ' ' + (dx) + ')';
				}
			}
		} else {
			this.boundingBox = rect;
		}
	} else {
		this.boundingBox = this.bounds.clone();
		if (document.documentMode >= 9 || mxClient.IS_SVG) {
			table.style.left = Math.round(this.bounds.x + this.scale / 2 + shiftX) + 'px';
			table.style.top = Math.round(this.bounds.y + this.scale / 2 + shiftY) + 'px';
			table.style.width = Math.round((this.bounds.width - this.scale) / this.scale) + 'px';
			table.style.height = Math.round((this.bounds.height - this.scale) / this.scale) + 'px';
		} else {
			table.style.left = Math.round(this.bounds.x + this.scale / 2) + 'px';
			table.style.top = Math.round(this.bounds.y + this.scale / 2) + 'px';
			table.style.width = Math.round(this.bounds.width - this.scale) + 'px';
			table.style.height = Math.round(this.bounds.height - this.scale) + 'px';
		}
	}
};
mxText.prototype.getVerticalOffset = function(offset) {
	return new mxPoint(offset.y, -offset.x);
};
mxText.prototype.redrawForeignObject = function() {
	var group = this.node;
	var fo = group.firstChild;
	while (fo == this.backgroundNode) {
		fo = fo.nextSibling;
	}
	var body = fo.firstChild;
	if (body.firstChild == null) {
		body.appendChild(this.createHtmlTable());
	}
	var table = body.firstChild;
	this.updateHtmlTable(table);
	if (this.opacity != null) {
		fo.setAttribute('opacity', this.opacity / 100);
	}
	if (false) {
		table.style.borderStyle = 'none';
		table.firstChild.firstChild.firstChild.style.background = '';
		if (this.backgroundNode == null && (this.background != null || this.border != null)) {
			this.backgroundNode = document.createElementNS(mxConstants.NS_SVG, 'rect');
			group.insertBefore(this.backgroundNode, group.firstChild);
		} else if (this.backgroundNode != null && this.background == null && this.border == null) {
			this.backgroundNode.parentNode.removeChild(this.backgroundNode);
			this.backgroundNode = null;
		}
		if (this.backgroundNode != null) {
			if (this.background != null) {
				this.backgroundNode.setAttribute('fill', this.background);
			} else {
				this.backgroundNode.setAttribute('fill', 'none');
			}
			if (this.border != null) {
				this.backgroundNode.setAttribute('stroke', this.border);
			} else {
				this.backgroundNode.setAttribute('stroke', 'none');
			}
		}
	}
	var tr = '';
	if (this.overflow != 'fill') {
		fo.removeAttribute('width');
		fo.removeAttribute('height');
		fo.style.width = '';
		fo.style.height = '';
		fo.style.clip = '';
		if (this.wrap || (!false && !false)) {
			document.body.appendChild(table);
		}
		this.updateTableWidth(table);
		var w = table.offsetWidth;
		var h = table.offsetHeight;
		if (table.parentNode != body) {
			body.appendChild(table);
		}
		var spacing = this.getSpacing();
		var x = this.bounds.x / this.scale + spacing.x;
		var y = this.bounds.y / this.scale + spacing.y;
		var uw = this.bounds.width / this.scale;
		var uh = this.bounds.height / this.scale;
		var offset = this.getOffset(uw, uh, w, h);
		if (this.horizontal) {
			x -= offset.x;
			y -= offset.y;
			tr = 'scale(' + this.scale + ')';
		} else {
			var x0 = x + w / 2;
			var y0 = y + h / 2;
			tr = 'scale(' + this.scale + ') rotate(' + this.verticalTextDegree + ' ' + x0 + ' ' + y0 + ')';
			var tmp = this.getVerticalOffset(offset);
			x += tmp.x;
			y += tmp.y;
		}
		tr += ' translate(' + x + ' ' + y + ')';
		if (this.backgroundNode != null) {
			this.backgroundNode.setAttribute('width', w);
			this.backgroundNode.setAttribute('height', h);
		}
		fo.setAttribute('width', w);
		fo.setAttribute('height', h);
		if (this.clipped && this.bounds.width > 0 && this.bounds.height > 0) {
			this.boundingBox = this.bounds.clone();
			var dx = Math.max(0, offset.x);
			var dy = Math.max(0, offset.y);
			if (this.horizontal) {
				fo.style.clip = 'rect(' + dy + 'px,' + (dx + uw) + 'px,' + (dy + uh) + 'px,' + (dx) + 'px)';
			} else {
				var dx = 0;
				var dy = 0;
				if (this.align == mxConstants.ALIGN_RIGHT) {
					dx = Math.max(0, w - uh);
				} else if (this.align == mxConstants.ALIGN_CENTER) {
					dx = Math.max(0, w - uh) / 2;
				}
				if (this.valign == mxConstants.ALIGN_BOTTOM) {
					dy = Math.max(0, h - uw);
				} else if (this.valign == mxConstants.ALIGN_MIDDLE) {
					dy = Math.max(0, h - uw) / 2;
				}
				fo.style.clip = 'rect(' + (dy) + 'px,' + (dx + uh) + 'px,' + (dy + uw) + 'px,' + (dx) + 'px)';
			}
			if (this.backgroundNode != null) {
				x = this.bounds.x / this.scale;
				y = this.bounds.y / this.scale;
				if (!this.horizontal) {
					x += (h + w) / 2 - uh;
					y += (h - w) / 2;
					var tmp = uw;
					uw = uh;
					uh = tmp;
				}
				if (!false) {
					var clip = this.getSvgClip(this.node.ownerSVGElement, x, y, uw, uh);
					if (clip != this.clip) {
						this.releaseSvgClip();
						this.clip = clip;
						clip.refCount++;
					}
					this.backgroundNode.setAttribute('clip-path', 'url(#' + clip.getAttribute('id') + ')');
				}
			}
		} else {
			this.releaseSvgClip();
			if (this.backgroundNode != null) {
				this.backgroundNode.removeAttribute('clip-path');
			}
			if (this.horizontal) {
				this.boundingBox = new mxRectangle(x * this.scale, y * this.scale, w * this.scale, h * this.scale);
			} else {
				this.boundingBox = new mxRectangle(x * this.scale, y * this.scale, h * this.scale, w * this.scale);
			}
		}
	} else {
		this.boundingBox = this.bounds.clone();
		var s = this.scale;
		var w = this.bounds.width / s;
		var h = this.bounds.height / s;
		fo.setAttribute('width', w);
		fo.setAttribute('height', h);
		table.style.width = w + 'px';
		table.style.height = h + 'px';
		if (this.backgroundNode != null) {
			this.backgroundNode.setAttribute('width', table.clientWidth);
			this.backgroundNode.setAttribute('height', table.offsetHeight);
		}
		tr = 'scale(' + s + ') translate(' + (this.bounds.x / s) + ' ' + (this.bounds.y / s) + ')';
		if (!this.wrap) {
			var td = table.firstChild.firstChild.firstChild;
			td.style.whiteSpace = 'nowrap';
		}
	}
	group.setAttribute('transform', tr);
};
mxText.prototype.createSvg = function() {
	var node = document.createElementNS(mxConstants.NS_SVG, 'g');
	var uline = this.isStyleSet(mxConstants.FONT_UNDERLINE) ? 'underline': 'none';
	var weight = this.isStyleSet(mxConstants.FONT_BOLD) ? 'bold': 'normal';
	var s = this.isStyleSet(mxConstants.FONT_ITALIC) ? 'italic': null;
	node.setAttribute('text-decoration', uline);
	node.setAttribute('font-family', this.family);
	node.setAttribute('font-weight', weight);
	node.setAttribute('font-size', Math.round(this.size * this.scale) + 'px');
	node.setAttribute('fill', this.color);
	var align = (this.align == mxConstants.ALIGN_RIGHT) ? 'end': (this.align == mxConstants.ALIGN_CENTER) ? 'middle': 'start';
	node.setAttribute('text-anchor', align);
	if (s != null) {
		node.setAttribute('font-style', s);
	}
	if (this.background != null || this.border != null) {
		this.backgroundNode = document.createElementNS(mxConstants.NS_SVG, 'rect');
		this.backgroundNode.setAttribute('shape-rendering', 'crispEdges');
		if (this.background != null) {
			this.backgroundNode.setAttribute('fill', this.background);
		} else {
			this.backgroundNode.setAttribute('fill', 'none');
		}
		if (this.border != null) {
			this.backgroundNode.setAttribute('stroke', this.border);
		} else {
			this.backgroundNode.setAttribute('stroke', 'none');
		}
	}
	this.updateSvgValue(node);
	return node;
};
mxText.prototype.updateSvgValue = function(node) {
	if (this.currentValue != this.value) {
		while (node.firstChild != null) {
			node.removeChild(node.firstChild);
		}
		if (this.value != null) {
			var uline = this.isStyleSet(mxConstants.FONT_UNDERLINE) ? 'underline': 'none';
			var lines = this.value.split('\n');
			this.textNodes = new Array(lines.length);
			for (var i = 0; i < lines.length; i++) {
				if (!this.isEmptyString(lines[i])) {
					var tspan = this.createSvgSpan(lines[i]);
					node.appendChild(tspan);
					this.textNodes[i] = tspan;
					tspan.setAttribute('text-decoration', uline);
				} else {
					this.textNodes[i] = null;
				}
			}
		}
		this.currentValue = this.value;
	}
};
mxText.prototype.redrawSvg = function() {
	if (this.node.nodeName == 'foreignObject') {
		this.redrawHtml();
		return;
	}
	var fontSize = Math.round(this.size * this.scale);
	if (fontSize <= 0) {
		this.node.setAttribute('visibility', 'hidden');
	} else {
		this.node.removeAttribute('visibility');
	}
	this.updateSvgValue(this.node);
	this.node.setAttribute('font-size', fontSize + 'px');
	if (this.opacity != null) {
		this.node.setAttribute('fill-opacity', this.opacity / 100);
		this.node.setAttribute('stroke-opacity', this.opacity / 100);
	}
	var previous = this.value;
	var table = this.createHtmlTable();
	this.lastValue = null;
	this.value = mxUtils.htmlEntities(this.value, false);
	this.updateHtmlTable(table);
	document.body.appendChild(table);
	var w = table.offsetWidth * this.scale;
	var h = table.offsetHeight * this.scale;
	table.parentNode.removeChild(table);
	this.value = previous;
	var dx = 2 * this.scale;
	if (this.align == mxConstants.ALIGN_CENTER) {
		dx += w / 2;
	} else if (this.align == mxConstants.ALIGN_RIGHT) {
		dx += w;
	}
	var dy = Math.round(fontSize * 1.3);
	var childCount = this.node.childNodes.length;
	var lineCount = (this.textNodes != null) ? this.textNodes.length: 0;
	if (this.backgroundNode != null) {
		childCount--;
	}
	var x = this.bounds.x;
	var y = this.bounds.y;
	x += (this.align == mxConstants.ALIGN_RIGHT) ? ((this.horizontal) ? this.bounds.width: this.bounds.height) - this.spacingRight * this.scale: (this.align == mxConstants.ALIGN_CENTER) ? this.spacingLeft + (((this.horizontal) ? this.bounds.width: this.bounds.height) - this.spacingLeft - this.spacingRight) / 2 : this.spacingLeft * this.scale + 1;
	y += (this.valign == mxConstants.ALIGN_BOTTOM) ? ((this.horizontal) ? this.bounds.height: this.bounds.width) - (lineCount - 1) * dy - this.spacingBottom * this.scale - 4 : (this.valign == mxConstants.ALIGN_MIDDLE) ? (this.spacingTop * this.scale + ((this.horizontal) ? this.bounds.height: this.bounds.width) - this.spacingBottom * this.scale - (lineCount - 1.5) * dy) / 2 : this.spacingTop * this.scale + dy;
	if (this.overflow == 'fill') {
		if (this.align == mxConstants.ALIGN_CENTER) {
			x = Math.max(this.bounds.x + w / 2, x);
		}
		y = Math.max(this.bounds.y + fontSize, y);
		this.boundingBox = new mxRectangle(x - dx, y - dy, w + 4 * this.scale, h + 1 * this.scale);
		this.boundingBox.x = Math.min(this.bounds.x, this.boundingBox.x);
		this.boundingBox.y = Math.min(this.bounds.y, this.boundingBox.y);
		this.boundingBox.width = Math.max(this.bounds.width, this.boundingBox.width);
		this.boundingBox.height = Math.max(this.bounds.height, this.boundingBox.height);
	} else {
		this.boundingBox = new mxRectangle(x - dx, y - dy, w + 4 * this.scale, h + 1 * this.scale);
	}
	if (!this.horizontal) {
		var cx = this.bounds.x + this.bounds.width / 2;
		var cy = this.bounds.y + this.bounds.height / 2;
		var offsetX = (this.bounds.width - this.bounds.height) / 2;
		var offsetY = (this.bounds.height - this.bounds.width) / 2;
		this.node.setAttribute('transform', 'rotate(' + this.verticalTextDegree + ' ' + cx + ' ' + cy + ') ' + 'translate(' + ( - offsetY) + ' ' + ( - offsetX) + ')');
	}
	this.redrawSvgTextNodes(x, y, dy);
	if (this.value.length > 0 && this.backgroundNode != null && this.node.firstChild != null) {
		if (this.node.firstChild != this.backgroundNode) {
			this.node.insertBefore(this.backgroundNode, this.node.firstChild);
		}
		this.backgroundNode.setAttribute('x', this.boundingBox.x + this.scale / 2 + 1 * this.scale);
		this.backgroundNode.setAttribute('y', this.boundingBox.y + this.scale / 2 + 2 * this.scale - this.labelPadding);
		this.backgroundNode.setAttribute('width', this.boundingBox.width - this.scale - 2 * this.scale);
		this.backgroundNode.setAttribute('height', this.boundingBox.height - this.scale);
		var strokeWidth = Math.round(Math.max(1, this.scale));
		this.backgroundNode.setAttribute('stroke-width', strokeWidth);
	}
	if (!false) {
		if (this.clipped && this.bounds.width > 0 && this.bounds.height > 0) {
			this.boundingBox = this.bounds.clone();
			if (!this.horizontal) {
				this.boundingBox.width = this.bounds.height;
				this.boundingBox.height = this.bounds.width;
			}
			x = this.bounds.x;
			y = this.bounds.y;
			if (this.horizontal) {
				w = this.bounds.width;
				h = this.bounds.height;
			} else {
				w = this.bounds.height;
				h = this.bounds.width;
			}
			var clip = this.getSvgClip(this.node.ownerSVGElement, x, y, w, h);
			if (clip != this.clip) {
				this.releaseSvgClip();
				this.clip = clip;
				clip.refCount++;
			}
			this.node.setAttribute('clip-path', 'url(#' + clip.getAttribute('id') + ')');
		} else {
			this.releaseSvgClip();
			this.node.removeAttribute('clip-path');
		}
	}
};
mxText.prototype.redrawSvgTextNodes = function(x, y, dy) {
	if (this.textNodes != null) {
		var currentY = y;
		for (var i = 0; i < this.textNodes.length; i++) {
			var node = this.textNodes[i];
			if (node != null) {
				node.setAttribute('x', x);
				node.setAttribute('y', currentY);
				node.setAttribute('style', 'pointer-events: all');
			}
			currentY += dy;
		}
	}
};
mxText.prototype.releaseSvgClip = function() {
	if (this.clip != null) {
		this.clip.refCount--;
		if (this.clip.refCount == 0) {
			this.clip.parentNode.removeChild(this.clip);
		}
		this.clip = null;
	}
};
mxText.prototype.getSvgClip = function(svg, x, y, w, h) {
	x = Math.round(x);
	y = Math.round(y);
	w = Math.round(w);
	h = Math.round(h);
	var id = 'mx-clip-' + x + '-' + y + '-' + w + '-' + h;
	if (this.clip != null && this.clip.ident == id) {
		return this.clip;
	}
	var counter = 0;
	var tmp = id + '-' + counter;
	var clip = document.getElementById(tmp);
	while (clip != null) {
		if (clip.ownerSVGElement == svg) {
			return clip;
		}
		counter++;
		tmp = id + '-' + counter;
		clip = document.getElementById(tmp);
	}
	if (clip != null) {
		clip = clip.cloneNode(true);
		counter++;
	} else {
		clip = document.createElementNS(mxConstants.NS_SVG, 'clipPath');
		var rect = document.createElementNS(mxConstants.NS_SVG, 'rect');
		rect.setAttribute('x', x);
		rect.setAttribute('y', y);
		rect.setAttribute('width', w);
		rect.setAttribute('height', h);
		clip.appendChild(rect);
	}
	clip.setAttribute('id', id + '-' + counter);
	clip.ident = id;
	svg.appendChild(clip);
	clip.refCount = 0;
	return clip;
};
mxText.prototype.isEmptyString = function(text) {
	return text.replace(/ /g, '').length == 0;
};
mxText.prototype.createSvgSpan = function(text) {
	var node = document.createElementNS(mxConstants.NS_SVG, 'text');
	mxUtils.write(node, text);
	return node;
};
mxText.prototype.destroy = function() {
	this.releaseSvgClip();
	mxShape.prototype.destroy.apply(this, arguments);
};
function mxTriangle() {};
mxTriangle.prototype = new mxActor();
mxTriangle.prototype.constructor = mxTriangle;
mxTriangle.prototype.redrawPath = function(path, x, y, w, h) {
	path.moveTo(0, 0);
	path.lineTo(w, 0.5 * h);
	path.lineTo(0, h);
	path.close();
};
function mxHexagon() {};
mxHexagon.prototype = new mxActor();
mxHexagon.prototype.constructor = mxHexagon;
mxHexagon.prototype.redrawPath = function(path, x, y, w, h) {
	path.moveTo(0.25 * w, 0);
	path.lineTo(0.75 * w, 0);
	path.lineTo(w, 0.5 * h);
	path.lineTo(0.75 * w, h);
	path.lineTo(0.25 * w, h);
	path.lineTo(0, 0.5 * h);
	path.close();
};
function mxLine(bounds, stroke, strokewidth) {
	this.bounds = bounds;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth: 1;
};
mxLine.prototype = new mxShape();
mxLine.prototype.constructor = mxLine;
mxLine.prototype.vmlNodes = mxLine.prototype.vmlNodes.concat(['label', 'innerNode']);
mxLine.prototype.mixedModeHtml = false;
mxLine.prototype.preferModeHtml = false;
mxLine.prototype.clone = function() {
	var clone = new mxLine(this.bounds, this.stroke, this.strokewidth);
	clone.isDashed = this.isDashed;
	return clone;
};
mxLine.prototype.createVml = function() {
	var node = document.createElement('v:group');
	node.style.position = 'absolute';
	this.label = document.createElement('v:rect');
	this.label.style.position = 'absolute';
	this.label.stroked = 'false';
	this.label.filled = 'false';
	node.appendChild(this.label);
	this.innerNode = document.createElement('v:shape');
	this.configureVmlShape(this.innerNode);
	node.appendChild(this.innerNode);
	return node;
};
mxLine.prototype.reconfigure = function() {
	if (mxUtils.isVml(this.node)) {
		this.configureVmlShape(this.innerNode);
	} else {
		mxShape.prototype.reconfigure.apply(this, arguments);
	}
};
mxLine.prototype.redrawVml = function() {
	this.updateVmlShape(this.node);
	this.updateVmlShape(this.label);
	this.innerNode.coordsize = this.node.coordsize;
	this.innerNode.strokeweight = (this.strokewidth * this.scale) + 'px';
	this.innerNode.style.width = this.node.style.width;
	this.innerNode.style.height = this.node.style.height;
	var w = this.bounds.width;
	var h = this.bounds.height;
	if (this.direction == mxConstants.DIRECTION_NORTH || this.direction == mxConstants.DIRECTION_SOUTH) {
		this.innerNode.path = 'm ' + Math.round(w / 2) + ' 0' + ' l ' + Math.round(w / 2) + ' ' + Math.round(h) + ' e';
	} else {
		this.innerNode.path = 'm 0 ' + Math.round(h / 2) + ' l ' + Math.round(w) + ' ' + Math.round(h / 2) + ' e';
	}
};
mxLine.prototype.createSvg = function() {
	var g = this.createSvgGroup('path');
	this.pipe = this.createSvgPipe();
	g.appendChild(this.pipe);
	return g;
};
mxLine.prototype.redrawSvg = function() {
	var strokeWidth = Math.round(Math.max(1, this.strokewidth * this.scale));
	this.innerNode.setAttribute('stroke-width', strokeWidth);
	if (this.bounds != null) {
		var x = this.bounds.x;
		var y = this.bounds.y;
		var w = this.bounds.width;
		var h = this.bounds.height;
		var d = null;
		if (this.direction == mxConstants.DIRECTION_NORTH || this.direction == mxConstants.DIRECTION_SOUTH) {
			d = 'M ' + Math.round(x + w / 2) + ' ' + Math.round(y) + ' L ' + Math.round(x + w / 2) + ' ' + Math.round(y + h);
		} else {
			d = 'M ' + Math.round(x) + ' ' + Math.round(y + h / 2) + ' L ' + Math.round(x + w) + ' ' + Math.round(y + h / 2);
		}
		this.innerNode.setAttribute('d', d);
		this.pipe.setAttribute('d', d);
		this.pipe.setAttribute('stroke-width', this.strokewidth + mxShape.prototype.SVG_STROKE_TOLERANCE);
		this.updateSvgTransform(this.innerNode, false);
		this.updateSvgTransform(this.pipe, false);
		if (this.crisp) {
			this.innerNode.setAttribute('shape-rendering', 'crispEdges');
		} else {
			this.innerNode.removeAttribute('shape-rendering');
		}
		if (this.isDashed) {
			var phase = Math.max(1, Math.round(3 * this.scale * this.strokewidth));
			this.innerNode.setAttribute('stroke-dasharray', phase + ' ' + phase);
		}
	}
};
function mxImageShape(bounds, image, fill, stroke, strokewidth) {
	this.bounds = bounds;
	this.image = (image != null) ? image: '';
	this.fill = fill;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth: 1;
	this.isShadow = false;
};
mxImageShape.prototype = new mxShape();
mxImageShape.prototype.constructor = mxImageShape;
mxImageShape.prototype.crisp = false;
mxImageShape.prototype.preserveImageAspect = true;
mxImageShape.prototype.apply = function(state) {
	mxShape.prototype.apply.apply(this, arguments);
	this.fill = null;
	this.stroke = null;
	if (this.style != null) {
		this.fill = mxUtils.getValue(this.style, mxConstants.STYLE_IMAGE_BACKGROUND);
		this.stroke = mxUtils.getValue(this.style, mxConstants.STYLE_IMAGE_BORDER);
		this.preserveImageAspect = mxUtils.getNumber(this.style, mxConstants.STYLE_IMAGE_ASPECT, 1) == 1;
		this.gradient = null;
	}
};
mxImageShape.prototype.create = function() {
	var node = null;
	if (this.dialect == mxConstants.DIALECT_SVG) {
		node = this.createSvgGroup('rect');
		this.innerNode.setAttribute('visibility', 'hidden');
		this.innerNode.setAttribute('pointer-events', 'fill');
		this.imageNode = document.createElementNS(mxConstants.NS_SVG, 'image');
		this.imageNode.setAttributeNS(mxConstants.NS_XLINK, 'xlink:href', this.image);
		this.imageNode.setAttribute('style', 'pointer-events:none');
		this.configureSvgShape(this.imageNode);
		this.imageNode.removeAttribute('stroke');
		this.imageNode.removeAttribute('fill');
		node.insertBefore(this.imageNode, this.innerNode);
		if ((this.fill != null && this.fill != mxConstants.NONE) || (this.stroke != null && this.stroke != mxConstants.NONE)) {
			this.bg = document.createElementNS(mxConstants.NS_SVG, 'rect');
			node.insertBefore(this.bg, node.firstChild);
		}
		if (!this.preserveImageAspect) {
			this.imageNode.setAttribute('preserveAspectRatio', 'none');
		}
	} else {
		var flipH = mxUtils.getValue(this.style, mxConstants.STYLE_IMAGE_FLIPH, 0) == 1;
		var flipV = mxUtils.getValue(this.style, mxConstants.STYLE_IMAGE_FLIPV, 0) == 1;
		var img = this.image.toUpperCase();
		if (mxClient.IS_IE && !flipH && !flipV && img.substring(0, 6) == 'MHTML:') {
			this.imageNode = document.createElement('DIV');
			this.imageNode.style.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader ' + '(src=\'' + this.image + '\', sizingMethod=\'scale\')';
			node = document.createElement('DIV');
			this.configureHtmlShape(node);
			node.appendChild(this.imageNode);
		} else if (!mxClient.IS_IE || img.substring(0, 5) == 'DATA:' || document.documentMode >= 9) {
			this.imageNode = document.createElement('img');
			this.imageNode.setAttribute('src', this.image);
			this.imageNode.setAttribute('border', '0');
			this.imageNode.style.position = 'absolute';
			this.imageNode.style.width = '100%';
			this.imageNode.style.height = '100%';
			node = document.createElement('DIV');
			this.configureHtmlShape(node);
			node.appendChild(this.imageNode);
		} else {
			this.imageNode = document.createElement('v:image');
			this.imageNode.style.position = 'absolute';
			this.imageNode.src = this.image;
			node = document.createElement('DIV');
			this.configureHtmlShape(node);
			node.style.overflow = 'visible';
			node.appendChild(this.imageNode);
		}
	}
	return node;
};
mxImageShape.prototype.updateAspect = function(w, h) {
	var s = Math.min(this.bounds.width / w, this.bounds.height / h);
	w = Math.max(0, Math.round(w * s));
	h = Math.max(0, Math.round(h * s));
	var x0 = Math.max(0, Math.round((this.bounds.width - w) / 2));
	var y0 = Math.max(0, Math.round((this.bounds.height - h) / 2));
	var st = this.imageNode.style;
	if (this.imageNode.parentNode == this.node) {
		this.node.style.paddingLeft = x0 + 'px';
		this.node.style.paddingTop = y0 + 'px';
	} else {
		st.left = (Math.round(this.bounds.x) + x0) + 'px';
		st.top = (Math.round(this.bounds.y) + y0) + 'px';
	}
	st.width = w + 'px';
	st.height = h + 'px';
};
mxImageShape.prototype.scheduleUpdateAspect = function() {
	var img = new Image();
	img.onload = mxUtils.bind(this,
	function() {
		mxImageShape.prototype.updateAspect.call(this, img.width, img.height);
	});
	img.src = this.image;
};
mxImageShape.prototype.redraw = function() {
	mxShape.prototype.redraw.apply(this, arguments);
	if (this.imageNode != null && this.bounds != null) {
		var flipH = mxUtils.getValue(this.style, mxConstants.STYLE_IMAGE_FLIPH, 0) == 1;
		var flipV = mxUtils.getValue(this.style, mxConstants.STYLE_IMAGE_FLIPV, 0) == 1;
		if (this.dialect == mxConstants.DIALECT_SVG) {
			var sx = 1;
			var sy = 1;
			var dx = 0;
			var dy = 0;
			if (flipH) {
				sx = -1;
				dx = -this.bounds.width - 2 * this.bounds.x;
			}
			if (flipV) {
				sy = -1;
				dy = -this.bounds.height - 2 * this.bounds.y;
			}
			var transform = (this.imageNode.getAttribute('transform') || '') + ' scale(' + sx + ' ' + sy + ')' + ' translate(' + dx + ' ' + dy + ')';
			this.imageNode.setAttribute('transform', transform);
		} else {
			if (this.imageNode.nodeName != 'DIV') {
				this.imageNode.style.width = Math.max(0, Math.round(this.bounds.width)) + 'px';
				this.imageNode.style.height = Math.max(0, Math.round(this.bounds.height)) + 'px';
			}
			if (this.preserveImageAspect) {
				this.scheduleUpdateAspect();
			}
			if (flipH || flipV) {
				if (mxUtils.isVml(this.imageNode)) {
					if (flipH && flipV) {
						this.imageNode.style.rotation = '180';
					} else if (flipH) {
						this.imageNode.style.flip = 'x';
					} else {
						this.imageNode.style.flip = 'y';
					}
				} else {
					var filter = (this.imageNode.nodeName == 'DIV') ? 'progid:DXImageTransform.Microsoft.AlphaImageLoader ' + '(src=\'' + this.image + '\', sizingMethod=\'scale\')': '';
					if (flipH && flipV) {
						filter += 'progid:DXImageTransform.Microsoft.BasicImage(rotation=2)';
					} else if (flipH) {
						filter += 'progid:DXImageTransform.Microsoft.BasicImage(mirror=1)';
					} else {
						filter += 'progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)';
					}
					if (this.imageNode.style.filter != filter) {
						this.imageNode.style.filter = filter;
					}
				}
			}
		}
	}
};
mxImageShape.prototype.configureTransparentBackground = function(node) {};
mxImageShape.prototype.redrawSvg = function() {
	this.updateSvgShape(this.innerNode);
	this.updateSvgShape(this.imageNode);
	if (this.bg != null) {
		this.updateSvgShape(this.bg);
		if (this.fill != null) {
			this.bg.setAttribute('fill', this.fill);
		} else {
			this.bg.setAttribute('fill', 'none');
		}
		if (this.stroke != null) {
			this.bg.setAttribute('stroke', this.stroke);
		} else {
			this.bg.setAttribute('stroke', 'none');
		}
		this.bg.setAttribute('shape-rendering', 'crispEdges');
	}
};
mxImageShape.prototype.configureSvgShape = function(node) {
	mxShape.prototype.configureSvgShape.apply(this, arguments);
	if (this.imageNode != null) {
		if (this.opacity != null) {
			this.imageNode.setAttribute('opacity', this.opacity / 100);
		} else {
			this.imageNode.removeAttribute('opacity');
		}
	}
};
function mxLabel(bounds, fill, stroke, strokewidth) {
	this.bounds = bounds;
	this.fill = fill;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth: 1;
};
mxLabel.prototype = new mxShape();
mxLabel.prototype.constructor = mxLabel;
mxLabel.prototype.vmlNodes = mxLabel.prototype.vmlNodes.concat(['label', 'imageNode', 'indicatorImageNode', 'rectNode']);
mxLabel.prototype.imageSize = mxConstants.DEFAULT_IMAGESIZE;
mxLabel.prototype.spacing = 2;
mxLabel.prototype.indicatorSize = 10;
mxLabel.prototype.indicatorSpacing = 2;
mxLabel.prototype.opaqueVmlImages = false;
mxLabel.prototype.init = function(container) {
	mxShape.prototype.init.apply(this, arguments);
	if (this.indicatorColor != null && this.indicatorShape != null) {
		this.indicator = new this.indicatorShape();
		this.indicator.dialect = this.dialect;
		this.indicator.bounds = this.bounds;
		this.indicator.fill = this.indicatorColor;
		this.indicator.stroke = this.indicatorColor;
		this.indicator.gradient = this.indicatorGradientColor;
		this.indicator.direction = this.indicatorDirection;
		this.indicator.init(this.node);
		this.indicatorShape = null;
	}
};
mxLabel.prototype.reconfigure = function() {
	mxShape.prototype.reconfigure.apply(this);
	if (this.indicator != null) {
		this.indicator.fill = this.indicatorColor;
		this.indicator.stroke = this.indicatorColor;
		this.indicator.gradient = this.indicatorGradientColor;
		this.indicator.direction = this.indicatorDirection;
		this.indicator.reconfigure();
	}
};
mxLabel.prototype.createHtml = function() {
	var name = 'DIV';
	var node = document.createElement(name);
	this.configureHtmlShape(node);
	if (this.indicatorImage != null) {
		this.indicatorImageNode = mxUtils.createImage(this.indicatorImage);
		this.indicatorImageNode.style.position = 'absolute';
		node.appendChild(this.indicatorImageNode);
	}
	if (this.image != null) {
		this.imageNode = mxUtils.createImage(this.image);
		this.stroke = null;
		this.configureHtmlShape(this.imageNode);
		mxUtils.setOpacity(this.imageNode, '100');
		node.appendChild(this.imageNode);
	}
	return node;
};
mxLabel.prototype.createVml = function() {
	var node = document.createElement('v:group');
	var name = (this.isRounded) ? 'v:roundrect': 'v:rect';
	this.rectNode = document.createElement(name);
	this.configureVmlShape(this.rectNode);
	this.isShadow = false;
	this.configureVmlShape(node);
	node.coordorigin = '0,0';
	node.appendChild(this.rectNode);
	if (this.indicatorImage != null) {
		this.indicatorImageNode = this.createVmlImage(this.indicatorImage, (this.opaqueVmlImages) ? null: this.opacity);
		node.appendChild(this.indicatorImageNode);
	}
	if (this.image != null) {
		this.imageNode = this.createVmlImage(this.image, (this.opaqueVmlImages) ? null: this.opacity);
		node.appendChild(this.imageNode);
	}
	this.label = document.createElement('v:rect');
	this.label.style.top = '0px';
	this.label.style.left = '0px';
	this.label.filled = 'false';
	this.label.stroked = 'false';
	node.appendChild(this.label);
	return node;
};
mxLabel.prototype.createVmlImage = function(src, opacity) {
	var result = null;
	if (src.substring(0, 5) == 'data:' || opacity != null) {
		result = document.createElement('img');
		mxUtils.setOpacity(result, opacity);
		result.setAttribute('border', '0');
		result.style.position = 'absolute';
		result.setAttribute('src', src);
	} else {
		result = document.createElement('v:image');
		result.src = src;
	}
	return result;
};
mxLabel.prototype.createSvg = function() {
	var g = this.createSvgGroup('rect');
	if (this.indicatorImage != null) {
		this.indicatorImageNode = document.createElementNS(mxConstants.NS_SVG, 'image');
		this.indicatorImageNode.setAttributeNS(mxConstants.NS_XLINK, 'href', this.indicatorImage);
		g.appendChild(this.indicatorImageNode);
		if (this.opacity != null) {
			this.indicatorImageNode.setAttribute('opacity', this.opacity / 100);
		}
	}
	if (this.image != null) {
		this.imageNode = document.createElementNS(mxConstants.NS_SVG, 'image');
		this.imageNode.setAttributeNS(mxConstants.NS_XLINK, 'href', this.image);
		if (this.opacity != null) {
			this.imageNode.setAttribute('opacity', this.opacity / 100);
		}
		this.imageNode.setAttribute('style', 'pointer-events:none');
		this.configureSvgShape(this.imageNode);
		g.appendChild(this.imageNode);
	}
	return g;
};
mxLabel.prototype.redraw = function() {
	var isSvg = (this.dialect == mxConstants.DIALECT_SVG);
	var isVml = mxUtils.isVml(this.node);
	if (isSvg) {
		this.updateSvgShape(this.innerNode);
		if (this.shadowNode != null) {
			this.updateSvgShape(this.shadowNode);
		}
		this.updateSvgGlassPane();
	} else if (isVml) {
		this.updateVmlShape(this.node);
		this.updateVmlShape(this.rectNode);
		this.label.style.width = this.node.style.width;
		this.label.style.height = this.node.style.height;
		this.updateVmlGlassPane();
	} else {
		this.updateHtmlShape(this.node);
	}
	var imageWidth = 0;
	var imageHeight = 0;
	if (this.imageNode != null) {
		imageWidth = (this.style[mxConstants.STYLE_IMAGE_WIDTH] || this.imageSize) * this.scale;
		imageHeight = (this.style[mxConstants.STYLE_IMAGE_HEIGHT] || this.imageSize) * this.scale;
	}
	var indicatorSpacing = 0;
	var indicatorWidth = 0;
	var indicatorHeight = 0;
	if (this.indicator != null || this.indicatorImageNode != null) {
		indicatorSpacing = (this.style[mxConstants.STYLE_INDICATOR_SPACING] || this.indicatorSpacing) * this.scale;
		indicatorWidth = (this.style[mxConstants.STYLE_INDICATOR_WIDTH] || this.indicatorSize) * this.scale;
		indicatorHeight = (this.style[mxConstants.STYLE_INDICATOR_HEIGHT] || this.indicatorSize) * this.scale;
	}
	var align = this.style[mxConstants.STYLE_IMAGE_ALIGN];
	var valign = this.style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN];
	var inset = this.spacing * this.scale + 5;
	var width = Math.max(imageWidth, indicatorWidth);
	var height = imageHeight + indicatorSpacing + indicatorHeight;
	var x = (isSvg) ? this.bounds.x: 0;
	if (align == mxConstants.ALIGN_RIGHT) {
		x += this.bounds.width - width - inset;
	} else if (align == mxConstants.ALIGN_CENTER) {
		x += (this.bounds.width - width) / 2;
	} else {
		x += inset;
	}
	var y = (isSvg) ? this.bounds.y: 0;
	if (valign == mxConstants.ALIGN_BOTTOM) {
		y += this.bounds.height - height - inset;
	} else if (valign == mxConstants.ALIGN_TOP) {
		y += inset;
	} else {
		y += (this.bounds.height - height) / 2;
	}
	if (this.imageNode != null) {
		if (isSvg) {
			this.imageNode.setAttribute('x', (x + (width - imageWidth) / 2) + 'px');
			this.imageNode.setAttribute('y', y + 'px');
			this.imageNode.setAttribute('width', imageWidth + 'px');
			this.imageNode.setAttribute('height', imageHeight + 'px');
		} else {
			this.imageNode.style.left = (x + width - imageWidth) + 'px';
			this.imageNode.style.top = y + 'px';
			this.imageNode.style.width = imageWidth + 'px';
			this.imageNode.style.height = imageHeight + 'px';
			this.imageNode.stroked = 'false';
		}
	}
	if (this.indicator != null) {
		this.indicator.bounds = new mxRectangle(x + (width - indicatorWidth) / 2, y + imageHeight + indicatorSpacing, indicatorWidth, indicatorHeight);
		this.indicator.redraw();
	} else if (this.indicatorImageNode != null) {
		if (isSvg) {
			this.indicatorImageNode.setAttribute('x', (x + (width - indicatorWidth) / 2) + 'px');
			this.indicatorImageNode.setAttribute('y', (y + imageHeight + indicatorSpacing) + 'px');
			this.indicatorImageNode.setAttribute('width', indicatorWidth + 'px');
			this.indicatorImageNode.setAttribute('height', indicatorHeight + 'px');
		} else {
			this.indicatorImageNode.style.left = (x + (width - indicatorWidth) / 2) + 'px';
			this.indicatorImageNode.style.top = (y + imageHeight + indicatorSpacing) + 'px';
			this.indicatorImageNode.style.width = indicatorWidth + 'px';
			this.indicatorImageNode.style.height = indicatorHeight + 'px';
		}
	}
};
function mxCylinder(bounds, fill, stroke, strokewidth) {
	this.bounds = bounds;
	this.fill = fill;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth: 1;
};
mxCylinder.prototype = new mxShape();
mxCylinder.prototype.constructor = mxCylinder;
mxCylinder.prototype.vmlNodes = mxCylinder.prototype.vmlNodes.concat(['background', 'foreground']);
mxCylinder.prototype.mixedModeHtml = false;
mxCylinder.prototype.preferModeHtml = false;
mxCylinder.prototype.strokedBackground = true;
mxCylinder.prototype.maxHeight = 40;
mxCylinder.prototype.create = function(container) {
	if (this.stroke == null) {
		this.stroke = this.fill;
	}
	return mxShape.prototype.create.apply(this, arguments);
};
mxCylinder.prototype.reconfigure = function() {
	if (this.dialect == mxConstants.DIALECT_SVG) {
		this.configureSvgShape(this.foreground);
		this.foreground.setAttribute('fill', 'none');
	} else if (mxUtils.isVml(this.node)) {
		this.configureVmlShape(this.background);
		this.configureVmlShape(this.foreground);
	}
	mxShape.prototype.reconfigure.apply(this);
};
mxCylinder.prototype.createVml = function() {
	var node = document.createElement('v:group');
	this.background = document.createElement('v:shape');
	this.label = this.background;
	this.configureVmlShape(this.background);
	node.appendChild(this.background);
	this.fill = null;
	this.isShadow = false;
	this.configureVmlShape(node);
	this.foreground = document.createElement('v:shape');
	this.configureVmlShape(this.foreground);
	this.fgStrokeNode = document.createElement('v:stroke');
	this.fgStrokeNode.joinstyle = 'miter';
	this.fgStrokeNode.miterlimit = 4;
	this.foreground.appendChild(this.fgStrokeNode);
	node.appendChild(this.foreground);
	return node;
};
mxCylinder.prototype.redrawVml = function() {
	this.updateVmlShape(this.node);
	this.updateVmlShape(this.background);
	this.updateVmlShape(this.foreground);
	this.background.path = this.createPath(false);
	this.foreground.path = this.createPath(true);
	this.fgStrokeNode.dashstyle = this.strokeNode.dashstyle;
};
mxCylinder.prototype.createSvg = function() {
	var g = this.createSvgGroup('path');
	this.foreground = document.createElementNS(mxConstants.NS_SVG, 'path');
	if (this.stroke != null && this.stroke != mxConstants.NONE) {
		this.foreground.setAttribute('stroke', this.stroke);
	} else {
		this.foreground.setAttribute('stroke', 'none');
	}
	this.foreground.setAttribute('fill', 'none');
	g.appendChild(this.foreground);
	return g;
};
mxCylinder.prototype.redrawSvg = function() {
	var strokeWidth = Math.round(Math.max(1, this.strokewidth * this.scale));
	this.innerNode.setAttribute('stroke-width', strokeWidth);
	if (this.crisp) {
		this.innerNode.setAttribute('shape-rendering', 'crispEdges');
		this.foreground.setAttribute('shape-rendering', 'crispEdges');
	} else {
		this.innerNode.removeAttribute('shape-rendering');
		this.foreground.removeAttribute('shape-rendering');
	}
	var d = this.createPath(false);
	if (d.length > 0) {
		this.innerNode.setAttribute('d', d);
	} else {
		this.innerNode.removeAttribute('d');
	}
	if (!this.strokedBackground) {
		this.innerNode.setAttribute('stroke', 'none');
	}
	if (this.shadowNode != null) {
		this.shadowNode.setAttribute('stroke-width', strokeWidth);
		this.shadowNode.setAttribute('d', d);
		this.shadowNode.setAttribute('transform', this.getSvgShadowTransform());
	}
	d = this.createPath(true);
	if (d.length > 0) {
		this.foreground.setAttribute('stroke-width', strokeWidth);
		this.foreground.setAttribute('d', d);
	} else {
		this.foreground.removeAttribute('d');
	}
	if (this.isDashed) {
		var phase = Math.max(1, Math.round(3 * this.scale * this.strokewidth));
		this.innerNode.setAttribute('stroke-dasharray', phase + ' ' + phase);
		this.foreground.setAttribute('stroke-dasharray', phase + ' ' + phase);
	}
};
mxCylinder.prototype.redrawPath = function(path, x, y, w, h, isForeground) {
	var dy = Math.min(this.maxHeight, Math.round(h / 5));
	if (isForeground) {
		path.moveTo(0, dy);
		path.curveTo(0, 2 * dy, w, 2 * dy, w, dy);
	} else {
		path.moveTo(0, dy);
		path.curveTo(0, -dy / 3, w, -dy / 3, w, dy);
		path.lineTo(w, h - dy);
		path.curveTo(w, h + dy / 3, 0, h + dy / 3, 0, h - dy);
		path.close();
	}
};
function mxConnector(points, stroke, strokewidth) {
	this.points = points;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth: 1;
};
mxConnector.prototype = new mxShape();
mxConnector.prototype.constructor = mxConnector;
mxConnector.prototype.vmlNodes = mxConnector.prototype.vmlNodes.concat(['shapeNode', 'start', 'end', 'startStroke', 'endStroke', 'startFill', 'endFill']);
mxConnector.prototype.mixedModeHtml = false;
mxConnector.prototype.preferModeHtml = false;
mxConnector.prototype.allowCrispMarkers = false;
mxConnector.prototype.configureHtmlShape = function(node) {
	mxShape.prototype.configureHtmlShape.apply(this, arguments);
	node.style.borderStyle = '';
	node.style.background = '';
};
mxConnector.prototype.createVml = function() {
	var node = document.createElement('v:group');
	node.style.position = 'absolute';
	this.shapeNode = document.createElement('v:shape');
	this.updateVmlStrokeColor(this.shapeNode);
	this.updateVmlStrokeNode(this.shapeNode);
	node.appendChild(this.shapeNode);
	this.shapeNode.filled = 'false';
	if (this.startArrow != null) {
		this.start = document.createElement('v:shape');
		this.start.style.position = 'absolute';
		this.startStroke = document.createElement('v:stroke');
		this.startStroke.joinstyle = 'miter';
		this.start.appendChild(this.startStroke);
		this.startFill = document.createElement('v:fill');
		this.start.appendChild(this.startFill);
		node.appendChild(this.start);
	}
	if (this.endArrow != null) {
		this.end = document.createElement('v:shape');
		this.end.style.position = 'absolute';
		this.endStroke = document.createElement('v:stroke');
		this.endStroke.joinstyle = 'miter';
		this.end.appendChild(this.endStroke);
		this.endFill = document.createElement('v:fill');
		this.end.appendChild(this.endFill);
		node.appendChild(this.end);
	}
	this.updateVmlMarkerOpacity();
	return node;
};
mxConnector.prototype.updateVmlMarkerOpacity = function() {
	var op = (this.opacity != null) ? (this.opacity + '%') : '100%';
	if (this.start != null) {
		this.startFill.opacity = op;
		this.startStroke.opacity = op;
	}
	if (this.end != null) {
		this.endFill.opacity = op;
		this.endStroke.opacity = op;
	}
};
mxConnector.prototype.reconfigure = function() {
	this.fill = null;
	this.shadow = false;
	if (mxUtils.isVml(this.node)) {
		this.node.style.visibility = 'hidden';
		this.configureVmlShape(this.shapeNode);
		this.updateVmlMarkerOpacity();
		this.node.style.visibility = 'visible';
	} else {
		mxShape.prototype.reconfigure.apply(this, arguments);
	}
};
mxConnector.prototype.redrawVml = function() {
	if (this.node != null && this.points != null && this.bounds != null && !isNaN(this.bounds.x) && !isNaN(this.bounds.y) && !isNaN(this.bounds.width) && !isNaN(this.bounds.height)) {
		var w = Math.max(0, Math.round(this.bounds.width));
		var h = Math.max(0, Math.round(this.bounds.height));
		var cs = w + ',' + h;
		w += 'px';
		h += 'px';
		if (this.start != null) {
			this.start.style.width = w;
			this.start.style.height = h;
			this.start.coordsize = cs;
			var p0 = this.points[1];
			var pe = this.points[0];
			var size = mxUtils.getNumber(this.style, mxConstants.STYLE_STARTSIZE, mxConstants.DEFAULT_MARKERSIZE);
			this.startOffset = this.redrawMarker(this.start, this.startArrow, p0, pe, this.stroke, size);
		}
		if (this.end != null) {
			this.end.style.width = w;
			this.end.style.height = h;
			this.end.coordsize = cs;
			var n = this.points.length;
			var p0 = this.points[n - 2];
			var pe = this.points[n - 1];
			var size = mxUtils.getNumber(this.style, mxConstants.STYLE_ENDSIZE, mxConstants.DEFAULT_MARKERSIZE);
			this.endOffset = this.redrawMarker(this.end, this.endArrow, p0, pe, this.stroke, size);
		}
		this.updateVmlShape(this.node);
		this.updateVmlShape(this.shapeNode);
		if (this.isDashed) {
			var pat = this.createDashPattern(this.scale);
			if (pat != null) {
				this.strokeNode.dashstyle = pat;
			}
		}
	}
};
mxConnector.prototype.createSvg = function() {
	var g = this.createSvgGroup('path');
	if (this.shadowNode != null) {
		this.shadowNode.setAttribute('fill', 'none');
		this.shadowNode.setAttribute('stroke', 'none');
	}
	if (this.startArrow != null) {
		this.start = document.createElementNS(mxConstants.NS_SVG, 'path');
		g.appendChild(this.start);
	}
	if (this.endArrow != null) {
		this.end = document.createElementNS(mxConstants.NS_SVG, 'path');
		g.appendChild(this.end);
	}
	this.pipe = this.createSvgPipe();
	g.appendChild(this.pipe);
	return g;
};
mxConnector.prototype.redrawSvg = function() {
	mxShape.prototype.redrawSvg.apply(this, arguments);
	var color = this.innerNode.getAttribute('stroke');
	if (this.points != null && this.points[0] != null) {
		if (this.start != null) {
			var p0 = this.points[1];
			var pe = this.points[0];
			var size = mxUtils.getNumber(this.style, mxConstants.STYLE_STARTSIZE, mxConstants.DEFAULT_MARKERSIZE);
			this.startOffset = this.redrawMarker(this.start, this.startArrow, p0, pe, color, size);
			if (this.allowCrispMarkers && this.crisp) {
				this.start.setAttribute('shape-rendering', 'crispEdges');
			} else {
				this.start.removeAttribute('shape-rendering');
			}
		}
		if (this.end != null) {
			var n = this.points.length;
			var p0 = this.points[n - 2];
			var pe = this.points[n - 1];
			var size = mxUtils.getNumber(this.style, mxConstants.STYLE_ENDSIZE, mxConstants.DEFAULT_MARKERSIZE);
			this.endOffset = this.redrawMarker(this.end, this.endArrow, p0, pe, color, size);
			if (this.allowCrispMarkers && this.crisp) {
				this.end.setAttribute('shape-rendering', 'crispEdges');
			} else {
				this.end.removeAttribute('shape-rendering');
			}
		}
	}
	this.updateSvgShape(this.innerNode);
	var d = this.innerNode.getAttribute('d');
	if (d != null) {
		this.pipe.setAttribute('d', this.innerNode.getAttribute('d'));
		var strokeWidth = Math.round(this.strokewidth * this.scale);
		this.pipe.setAttribute('stroke-width', strokeWidth + mxShape.prototype.SVG_STROKE_TOLERANCE);
	}
	if (this.isDashed) {
		var pat = this.createDashPattern(this.scale * this.strokewidth);
		if (pat != null) {
			this.innerNode.setAttribute('stroke-dasharray', pat);
		}
	}
};
mxConnector.prototype.createDashPattern = function(factor) {
	var value = mxUtils.getValue(this.style, 'dashPattern', null);
	if (value != null) {
		var tmp = value.split(' ');
		var pat = [];
		for (var i = 0; i < tmp.length; i++) {
			if (tmp[i].length > 0) {
				pat.push(Math.round(Number(tmp[i]) * factor));
			}
		}
		return pat.join(' ');
	}
	return null;
};
mxConnector.prototype.redrawMarker = function(node, type, p0, pe, color, size) {
	return mxMarker.paintMarker(node, type, p0, pe, color, this.strokewidth, size, this.scale, this.bounds.x, this.bounds.y, this.start == node, this.style);
};
function mxSwimlane(bounds, fill, stroke, strokewidth) {
	this.bounds = bounds;
	this.fill = fill;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth: 1;
};
mxSwimlane.prototype = new mxShape();
mxSwimlane.prototype.constructor = mxSwimlane;
mxSwimlane.prototype.vmlNodes = mxSwimlane.prototype.vmlNodes.concat(['label', 'content', 'imageNode', 'separator']);
mxSwimlane.prototype.imageSize = 16;
mxSwimlane.prototype.mixedModeHtml = false;
mxRhombus.prototype.preferModeHtml = false;
mxSwimlane.prototype.createHtml = function() {
	var node = document.createElement('DIV');
	this.configureHtmlShape(node);
	node.style.background = '';
	node.style.backgroundColor = '';
	node.style.borderStyle = 'none';
	this.label = document.createElement('DIV');
	this.configureHtmlShape(this.label);
	node.appendChild(this.label);
	this.content = document.createElement('DIV');
	this.configureHtmlShape(this.content);
	this.content.style.backgroundColor = '';
	if (mxUtils.getValue(this.style, mxConstants.STYLE_HORIZONTAL, true)) {
		this.content.style.borderTopStyle = 'none';
	} else {
		this.content.style.borderLeftStyle = 'none';
	}
	this.content.style.cursor = 'default';
	node.appendChild(this.content);
	var color = this.style[mxConstants.STYLE_SEPARATORCOLOR];
	if (color != null) {
		this.separator = document.createElement('DIV');
		this.separator.style.borderColor = color;
		this.separator.style.borderLeftStyle = 'dashed';
		node.appendChild(this.separator);
	}
	if (this.image != null) {
		this.imageNode = mxUtils.createImage(this.image);
		this.configureHtmlShape(this.imageNode);
		this.imageNode.style.borderStyle = 'none';
		node.appendChild(this.imageNode);
	}
	return node;
};
mxSwimlane.prototype.reconfigure = function(node) {
	mxShape.prototype.reconfigure.apply(this, arguments);
	if (this.dialect == mxConstants.DIALECT_SVG) {
		if (this.shadowNode != null) {
			this.updateSvgShape(this.shadowNode);
			if (mxUtils.getValue(this.style, mxConstants.STYLE_HORIZONTAL, true)) {
				this.shadowNode.setAttribute('height', this.startSize * this.scale);
			} else {
				this.shadowNode.setAttribute('width', this.startSize * this.scale);
			}
		}
	} else if (!mxUtils.isVml(this.node)) {
		this.node.style.background = '';
		this.node.style.backgroundColor = '';
	}
};
mxSwimlane.prototype.redrawHtml = function() {
	this.updateHtmlShape(this.node);
	this.node.style.background = '';
	this.node.style.backgroundColor = '';
	this.startSize = parseInt(mxUtils.getValue(this.style, mxConstants.STYLE_STARTSIZE, mxConstants.DEFAULT_STARTSIZE));
	this.updateHtmlShape(this.label);
	this.label.style.top = '0px';
	this.label.style.left = '0px';
	if (mxUtils.getValue(this.style, mxConstants.STYLE_HORIZONTAL, true)) {
		this.startSize = Math.min(this.startSize, this.bounds.height);
		this.label.style.height = (this.startSize * this.scale) + 'px';
		this.updateHtmlShape(this.content);
		this.content.style.background = '';
		this.content.style.backgroundColor = '';
		var h = this.startSize * this.scale;
		this.content.style.top = h + 'px';
		this.content.style.left = '0px';
		this.content.style.height = Math.max(1, this.bounds.height - h) + 'px';
		if (this.separator != null) {
			this.separator.style.left = Math.round(this.bounds.width) + 'px';
			this.separator.style.top = Math.round(this.startSize * this.scale) + 'px';
			this.separator.style.width = '1px';
			this.separator.style.height = Math.round(this.bounds.height) + 'px';
			this.separator.style.borderWidth = Math.round(this.scale) + 'px';
		}
		if (this.imageNode != null) {
			this.imageNode.style.left = (this.bounds.width - this.imageSize - 4) + 'px';
			this.imageNode.style.top = '0px';
			this.imageNode.style.width = Math.round(this.imageSize * this.scale) + 'px';
			this.imageNode.style.height = Math.round(this.imageSize * this.scale) + 'px';
		}
	} else {
		this.startSize = Math.min(this.startSize, this.bounds.width);
		this.label.style.width = (this.startSize * this.scale) + 'px';
		this.updateHtmlShape(this.content);
		this.content.style.background = '';
		this.content.style.backgroundColor = '';
		var w = this.startSize * this.scale;
		this.content.style.top = '0px';
		this.content.style.left = w + 'px';
		this.content.style.width = Math.max(0, this.bounds.width - w) + 'px';
		if (this.separator != null) {
			this.separator.style.left = Math.round(this.startSize * this.scale) + 'px';
			this.separator.style.top = Math.round(this.bounds.height) + 'px';
			this.separator.style.width = Math.round(this.bounds.width) + 'px';
			this.separator.style.height = '1px';
		}
		if (this.imageNode != null) {
			this.imageNode.style.left = (this.bounds.width - this.imageSize - 4) + 'px';
			this.imageNode.style.top = '0px';
			this.imageNode.style.width = this.imageSize * this.scale + 'px';
			this.imageNode.style.height = this.imageSize * this.scale + 'px';
		}
	}
};
mxSwimlane.prototype.createVml = function() {
	var node = document.createElement('v:group');
	var name = (this.isRounded) ? 'v:roundrect': 'v:rect';
	this.label = document.createElement(name);
	this.configureVmlShape(this.label);
	if (this.isRounded) {
		this.label.setAttribute('arcsize', '20%');
	}
	this.isShadow = false;
	this.configureVmlShape(node);
	node.coordorigin = '0,0';
	node.appendChild(this.label);
	this.content = document.createElement(name);
	var tmp = this.fill;
	this.fill = null;
	this.configureVmlShape(this.content);
	node.style.background = '';
	if (this.isRounded) {
		this.content.setAttribute('arcsize', '4%');
	}
	this.fill = tmp;
	this.content.style.borderBottom = '0px';
	node.appendChild(this.content);
	var color = this.style[mxConstants.STYLE_SEPARATORCOLOR];
	if (color != null) {
		this.separator = document.createElement('v:shape');
		this.separator.style.position = 'absolute';
		this.separator.strokecolor = color;
		var strokeNode = document.createElement('v:stroke');
		strokeNode.dashstyle = '2 2';
		this.separator.appendChild(strokeNode);
		node.appendChild(this.separator);
	}
	if (this.image != null) {
		this.imageNode = document.createElement('v:image');
		this.imageNode.src = this.image;
		this.configureVmlShape(this.imageNode);
		this.imageNode.stroked = 'false';
		node.appendChild(this.imageNode);
	}
	return node;
};
mxSwimlane.prototype.redrawVml = function() {
	var x = Math.round(this.bounds.x);
	var y = Math.round(this.bounds.y);
	var w = Math.round(this.bounds.width);
	var h = Math.round(this.bounds.height);
	this.updateVmlShape(this.node);
	this.node.coordsize = w + ',' + h;
	this.updateVmlShape(this.label);
	this.label.style.top = '0px';
	this.label.style.left = '0px';
	this.label.style.rotation = null;
	this.startSize = parseInt(mxUtils.getValue(this.style, mxConstants.STYLE_STARTSIZE, mxConstants.DEFAULT_STARTSIZE));
	var start = Math.round(this.startSize * this.scale);
	if (this.separator != null) {
		this.separator.coordsize = w + ',' + h;
		this.separator.style.left = x + 'px';
		this.separator.style.top = y + 'px';
		this.separator.style.width = w + 'px';
		this.separator.style.height = h + 'px';
	}
	if (mxUtils.getValue(this.style, mxConstants.STYLE_HORIZONTAL, true)) {
		start = Math.min(start, this.bounds.height);
		this.label.style.height = start + 'px';
		this.updateVmlShape(this.content);
		this.content.style.background = '';
		this.content.style.top = start + 'px';
		this.content.style.left = '0px';
		this.content.style.height = Math.max(0, h - start) + 'px';
		if (this.separator != null) {
			var d = 'm ' + (w - x) + ' ' + (start - y) + ' l ' + (w - x) + ' ' + (h - y) + ' e';
			this.separator.path = d;
		}
		if (this.imageNode != null) {
			var img = Math.round(this.imageSize * this.scale);
			this.imageNode.style.left = (w - img - 4) + 'px';
			this.imageNode.style.top = '0px';
			this.imageNode.style.width = img + 'px';
			this.imageNode.style.height = img + 'px';
		}
	} else {
		start = Math.min(start, this.bounds.width);
		this.label.style.width = start + 'px';
		this.updateVmlShape(this.content);
		this.content.style.background = '';
		this.content.style.top = '0px';
		this.content.style.left = start + 'px';
		this.content.style.width = Math.max(0, w - start) + 'px';
		if (this.separator != null) {
			var d = 'm ' + (start - x) + ' ' + (h - y) + ' l ' + (w - x) + ' ' + (h - y) + ' e';
			this.separator.path = d;
		}
		if (this.imageNode != null) {
			var img = Math.round(this.imageSize * this.scale);
			this.imageNode.style.left = (w - img - 4) + 'px';
			this.imageNode.style.top = '0px';
			this.imageNode.style.width = img + 'px';
			this.imageNode.style.height = img + 'px';
		}
	}
	this.content.style.rotation = null;
};
mxSwimlane.prototype.createSvg = function() {
	var node = this.createSvgGroup('rect');
	if (this.isRounded) {
		this.innerNode.setAttribute('rx', 10);
		this.innerNode.setAttribute('ry', 10);
	}
	this.content = document.createElementNS(mxConstants.NS_SVG, 'path');
	this.configureSvgShape(this.content);
	this.content.setAttribute('fill', 'none');
	if (this.isRounded) {
		this.content.setAttribute('rx', 10);
		this.content.setAttribute('ry', 10);
	}
	node.appendChild(this.content);
	var color = this.style[mxConstants.STYLE_SEPARATORCOLOR];
	if (color != null) {
		this.separator = document.createElementNS(mxConstants.NS_SVG, 'line');
		this.separator.setAttribute('stroke', color);
		this.separator.setAttribute('fill', 'none');
		this.separator.setAttribute('stroke-dasharray', '2, 2');
		node.appendChild(this.separator);
	}
	if (this.image != null) {
		this.imageNode = document.createElementNS(mxConstants.NS_SVG, 'image');
		this.imageNode.setAttributeNS(mxConstants.NS_XLINK, 'href', this.image);
		this.configureSvgShape(this.imageNode);
		node.appendChild(this.imageNode);
	}
	return node;
};
mxSwimlane.prototype.redrawSvg = function() {
	var tmp = this.isRounded;
	this.isRounded = false;
	this.updateSvgShape(this.innerNode);
	this.updateSvgShape(this.content);
	var horizontal = mxUtils.getValue(this.style, mxConstants.STYLE_HORIZONTAL, true);
	this.startSize = parseInt(mxUtils.getValue(this.style, mxConstants.STYLE_STARTSIZE, mxConstants.DEFAULT_STARTSIZE));
	var ss = this.startSize * this.scale;
	if (this.shadowNode != null) {
		this.updateSvgShape(this.shadowNode);
		if (horizontal) {
			this.shadowNode.setAttribute('height', ss);
		} else {
			this.shadowNode.setAttribute('width', ss);
		}
	}
	this.isRounded = tmp;
	this.content.removeAttribute('x');
	this.content.removeAttribute('y');
	this.content.removeAttribute('width');
	this.content.removeAttribute('height');
	var crisp = (this.crisp && mxClient.IS_IE) ? 0.5 : 0;
	var x = Math.round(this.bounds.x) + crisp;
	var y = Math.round(this.bounds.y) + crisp;
	var w = Math.round(this.bounds.width);
	var h = Math.round(this.bounds.height);
	if (horizontal) {
		ss = Math.min(ss, h);
		this.innerNode.setAttribute('height', ss);
		var points = 'M ' + x + ' ' + (y + ss) + ' l 0 ' + (h - ss) + ' l ' + w + ' 0' + ' l 0 ' + (ss - h);
		this.content.setAttribute('d', points);
		if (this.separator != null) {
			this.separator.setAttribute('x1', x + w);
			this.separator.setAttribute('y1', y + ss);
			this.separator.setAttribute('x2', x + w);
			this.separator.setAttribute('y2', y + h);
		}
		if (this.imageNode != null) {
			this.imageNode.setAttribute('x', x + w - this.imageSize - 4);
			this.imageNode.setAttribute('y', y);
			this.imageNode.setAttribute('width', this.imageSize * this.scale + 'px');
			this.imageNode.setAttribute('height', this.imageSize * this.scale + 'px');
		}
	} else {
		ss = Math.min(ss, w);
		this.innerNode.setAttribute('width', ss);
		var points = 'M ' + (x + ss) + ' ' + y + ' l ' + (w - ss) + ' 0' + ' l 0 ' + h + ' l ' + (ss - w) + ' 0';
		this.content.setAttribute('d', points);
		if (this.separator != null) {
			this.separator.setAttribute('x1', x + ss);
			this.separator.setAttribute('y1', y + h);
			this.separator.setAttribute('x2', x + w);
			this.separator.setAttribute('y2', y + h);
		}
		if (this.imageNode != null) {
			this.imageNode.setAttribute('x', x + w - this.imageSize - 4);
			this.imageNode.setAttribute('y', y);
			this.imageNode.setAttribute('width', this.imageSize * this.scale + 'px');
			this.imageNode.setAttribute('height', this.imageSize * this.scale + 'px');
		}
	}
};
function mxGraphLayout(graph) {
	this.graph = graph;
};
mxGraphLayout.prototype.graph = null;
mxGraphLayout.prototype.useBoundingBox = true;
mxGraphLayout.prototype.parent = null;
mxGraphLayout.prototype.moveCell = function(cell, x, y) {};
mxGraphLayout.prototype.execute = function(parent) {};
mxGraphLayout.prototype.getGraph = function() {
	return this.graph;
};
mxGraphLayout.prototype.getConstraint = function(key, cell, edge, source) {
	var state = this.graph.view.getState(cell);
	var style = (state != null) ? state.style: this.graph.getCellStyle(cell);
	return (style != null) ? style[key] : null;
};
mxGraphLayout.prototype.isVertexMovable = function(cell) {
	return this.graph.isCellMovable(cell);
};
mxGraphLayout.prototype.isVertexIgnored = function(vertex) {
	return ! this.graph.getModel().isVertex(vertex) || !this.graph.isCellVisible(vertex);
};
mxGraphLayout.prototype.isEdgeIgnored = function(edge) {
	var model = this.graph.getModel();
	return ! model.isEdge(edge) || !this.graph.isCellVisible(edge) || model.getTerminal(edge, true) == null || model.getTerminal(edge, false) == null;
};
mxGraphLayout.prototype.setEdgeStyleEnabled = function(edge, value) {
	this.graph.setCellStyles(mxConstants.STYLE_NOEDGESTYLE, (value) ? '0': '1', [edge]);
};
mxGraphLayout.prototype.setOrthogonalEdge = function(edge, value) {
	this.graph.setCellStyles(mxConstants.STYLE_ORTHOGONAL, (value) ? '1': '0', [edge]);
};
mxGraphLayout.prototype.getParentOffset = function(parent) {
	var result = new mxPoint();
	if (parent != null && parent != this.parent) {
		var model = this.graph.getModel();
		if (model.isAncestor(this.parent, parent)) {
			var parentGeo = model.getGeometry(parent);
			while (parent != this.parent) {
				result.x = result.x + parentGeo.x;
				result.y = result.y + parentGeo.y;
				parent = model.getParent(parent);;
				parentGeo = model.getGeometry(parent);
			}
		}
	}
	return result;
};
mxGraphLayout.prototype.setEdgePoints = function(edge, points) {
	if (edge != null) {
		var model = this.graph.model;
		var geometry = model.getGeometry(edge);
		if (geometry == null) {
			geometry = new mxGeometry();
			geometry.setRelative(true);
		} else {
			geometry = geometry.clone();
		}
		if (this.parent != null && points != null) {
			var parent = model.getParent(edge);
			var parentOffset = this.getParentOffset(parent);
			for (var i = 0; i < points.length; i++) {
				points[i].x = points[i].x - parentOffset.x;
				points[i].y = points[i].y - parentOffset.y;
			}
		}
		geometry.points = points;
		model.setGeometry(edge, geometry);
	}
};
mxGraphLayout.prototype.setVertexLocation = function(cell, x, y) {
	var model = this.graph.getModel();
	var geometry = model.getGeometry(cell);
	var result = null;
	if (geometry != null) {
		result = new mxRectangle(x, y, geometry.width, geometry.height);
		if (this.useBoundingBox) {
			var state = this.graph.getView().getState(cell);
			if (state != null && state.text != null && state.text.boundingBox != null) {
				var scale = this.graph.getView().scale;
				var box = state.text.boundingBox;
				if (state.text.boundingBox.x < state.x) {
					x += (state.x - box.x) / scale;
					result.width = box.width;
				}
				if (state.text.boundingBox.y < state.y) {
					y += (state.y - box.y) / scale;
					result.height = box.height;
				}
			}
		}
		if (this.parent != null) {
			var parent = model.getParent(cell);
			if (parent != null && parent != this.parent) {
				var parentOffset = this.getParentOffset(parent);
				x = x - parentOffset.x;
				y = y - parentOffset.y;
			}
		}
		if (geometry.x != x || geometry.y != y) {
			geometry = geometry.clone();
			geometry.x = x;
			geometry.y = y;
			model.setGeometry(cell, geometry);
		}
	}
	return result;
};
mxGraphLayout.prototype.getVertexBounds = function(cell) {
	var geo = this.graph.getModel().getGeometry(cell);
	if (this.useBoundingBox) {
		var state = this.graph.getView().getState(cell);
		if (state != null && state.text != null && state.text.boundingBox != null) {
			var scale = this.graph.getView().scale;
			var tmp = state.text.boundingBox;
			var dx0 = Math.max(state.x - tmp.x, 0) / scale;
			var dy0 = Math.max(state.y - tmp.y, 0) / scale;
			var dx1 = Math.max((tmp.x + tmp.width) - (state.x + state.width), 0) / scale;
			var dy1 = Math.max((tmp.y + tmp.height) - (state.y + state.height), 0) / scale;
			geo = new mxRectangle(geo.x - dx0, geo.y - dy0, geo.width + dx0 + dx1, geo.height + dy0 + dy1);
		}
	}
	if (this.parent != null) {
		var parent = this.graph.getModel().getParent(cell);
		geo = geo.clone();
		if (parent != null && parent != this.parent) {
			var parentOffset = this.getParentOffset(parent);
			geo.x = geo.x + parentOffset.x;
			geo.y = geo.y + parentOffset.y;
		}
	}
	return new mxRectangle(geo.x, geo.y, geo.width, geo.height);
};
mxGraphLayout.prototype.arrangeGroups = function(groups, border) {
	this.graph.getModel().beginUpdate();
	try {
		for (var i = groups.length - 1; i >= 0; i--) {
			var group = groups[i];
			var children = this.graph.getChildVertices(group);
			var bounds = this.graph.getBoundingBoxFromGeometry(children);
			var geometry = this.graph.getCellGeometry(group);
			var left = 0;
			var top = 0;
			if (this.graph.isSwimlane(group)) {
				var size = this.graph.getStartSize(group);
				left = size.width;
				top = size.height;
			}
			if (bounds != null && geometry != null) {
				geometry = geometry.clone();
				geometry.x = geometry.x + bounds.x - border - left;
				geometry.y = geometry.y + bounds.y - border - top;
				geometry.width = bounds.width + 2 * border + left;
				geometry.height = bounds.height + 2 * border + top;
				this.graph.getModel().setGeometry(group, geometry);
				this.graph.moveCells(children, border + left - bounds.x, border + top - bounds.y);
			}
		}
	} finally {
		this.graph.getModel().endUpdate();
	}
};
function mxStackLayout(graph, horizontal, spacing, x0, y0, border) {
	mxGraphLayout.call(this, graph);
	this.horizontal = (horizontal != null) ? horizontal: true;
	this.spacing = (spacing != null) ? spacing: 0;
	this.x0 = (x0 != null) ? x0: 0;
	this.y0 = (y0 != null) ? y0: 0;
	this.border = (border != null) ? border: 0;
};
mxStackLayout.prototype = new mxGraphLayout();
mxStackLayout.prototype.constructor = mxStackLayout;
mxStackLayout.prototype.horizontal = null;
mxStackLayout.prototype.spacing = null;
mxStackLayout.prototype.x0 = null;
mxStackLayout.prototype.y0 = null;
mxStackLayout.prototype.border = 0;
mxStackLayout.prototype.keepFirstLocation = false;
mxStackLayout.prototype.fill = false;
mxStackLayout.prototype.resizeParent = false;
mxStackLayout.prototype.resizeLast = false;
mxStackLayout.prototype.wrap = null;
mxStackLayout.prototype.isHorizontal = function() {
	return this.horizontal;
};
mxStackLayout.prototype.moveCell = function(cell, x, y) {
	var model = this.graph.getModel();
	var parent = model.getParent(cell);
	var horizontal = this.isHorizontal();
	if (cell != null && parent != null) {
		var i = 0;
		var last = 0;
		var childCount = model.getChildCount(parent);
		var value = (horizontal) ? x: y;
		var pstate = this.graph.getView().getState(parent);
		if (pstate != null) {
			value -= (horizontal) ? pstate.x: pstate.y;
		}
		for (i = 0; i < childCount; i++) {
			var child = model.getChildAt(parent, i);
			if (child != cell) {
				var bounds = model.getGeometry(child);
				if (bounds != null) {
					var tmp = (horizontal) ? bounds.x + bounds.width / 2 : bounds.y + bounds.height / 2;
					if (last < value && tmp > value) {
						break;
					}
					last = tmp;
				}
			}
		}
		var idx = parent.getIndex(cell);
		idx = Math.max(0, i - ((i > idx) ? 1 : 0));
		model.add(parent, cell, idx);
	}
};
mxStackLayout.prototype.getParentSize = function(parent) {
	var model = this.graph.getModel();
	var pgeo = model.getGeometry(parent);
	if (this.graph.container != null && ((pgeo == null && model.isLayer(parent)) || parent == this.graph.getView().currentRoot)) {
		var width = this.graph.container.offsetWidth - 1;
		var height = this.graph.container.offsetHeight - 1;
		pgeo = new mxRectangle(0, 0, width, height);
	}
	return pgeo;
};
mxStackLayout.prototype.execute = function(parent) {
	if (parent != null) {
		var horizontal = this.isHorizontal();
		var model = this.graph.getModel();
		var pgeo = this.getParentSize(parent);
		var fillValue = 0;
		if (pgeo != null) {
			fillValue = (horizontal) ? pgeo.height: pgeo.width;
		}
		fillValue -= 2 * this.spacing + 2 * this.border;
		var size = (this.graph.isSwimlane(parent)) ? this.graph.getStartSize(parent) : new mxRectangle();
		fillValue -= (horizontal) ? size.height: size.width;
		var x0 = this.x0 + size.width + this.border;
		var y0 = this.y0 + size.height + this.border;
		model.beginUpdate();
		try {
			var tmp = 0;
			var last = null;
			var childCount = model.getChildCount(parent);
			for (var i = 0; i < childCount; i++) {
				var child = model.getChildAt(parent, i);
				if (!this.isVertexIgnored(child) && this.isVertexMovable(child)) {
					var geo = model.getGeometry(child);
					if (geo != null) {
						geo = geo.clone();
						if (this.wrap != null && last != null) {
							if ((horizontal && last.x + last.width + geo.width + 2 * this.spacing > this.wrap) || (!horizontal && last.y + last.height + geo.height + 2 * this.spacing > this.wrap)) {
								last = null;
								if (horizontal) {
									y0 += tmp + this.spacing;
								} else {
									x0 += tmp + this.spacing;
								}
								tmp = 0;
							}
						}
						tmp = Math.max(tmp, (horizontal) ? geo.height: geo.width);
						if (last != null) {
							if (horizontal) {
								geo.x = last.x + last.width + this.spacing;
							} else {
								geo.y = last.y + last.height + this.spacing;
							}
						} else if (!this.keepFirstLocation) {
							if (horizontal) {
								geo.x = x0;
							} else {
								geo.y = y0;
							}
						}
						if (horizontal) {
							geo.y = y0;
						} else {
							geo.x = x0;
						}
						if (this.fill && fillValue > 0) {
							if (horizontal) {
								geo.height = fillValue;
							} else {
								geo.width = fillValue;
							}
						}
						model.setGeometry(child, geo);
						last = geo;
					}
				}
			}
			if (this.resizeParent && pgeo != null && last != null && !this.graph.isCellCollapsed(parent)) {
				pgeo = pgeo.clone();
				if (horizontal) {
					pgeo.width = last.x + last.width + this.spacing;
				} else {
					pgeo.height = last.y + last.height + this.spacing;
				}
				model.setGeometry(parent, pgeo);
			} else if (this.resizeLast && pgeo != null && last != null) {
				if (horizontal) {
					last.width = pgeo.width - last.x - this.spacing;
				} else {
					last.height = pgeo.height - last.y - this.spacing;
				}
			}
		} finally {
			model.endUpdate();
		}
	}
};
function mxPartitionLayout(graph, horizontal, spacing, border) {
	mxGraphLayout.call(this, graph);
	this.horizontal = (horizontal != null) ? horizontal: true;
	this.spacing = spacing || 0;
	this.border = border || 0;
};
mxPartitionLayout.prototype = new mxGraphLayout();
mxPartitionLayout.prototype.constructor = mxPartitionLayout;
mxPartitionLayout.prototype.horizontal = null;
mxPartitionLayout.prototype.spacing = null;
mxPartitionLayout.prototype.border = null;
mxPartitionLayout.prototype.resizeVertices = true;
mxPartitionLayout.prototype.isHorizontal = function() {
	return this.horizontal;
};
mxPartitionLayout.prototype.moveCell = function(cell, x, y) {
	var model = this.graph.getModel();
	var parent = model.getParent(cell);
	if (cell != null && parent != null) {
		var i = 0;
		var last = 0;
		var childCount = model.getChildCount(parent);
		for (i = 0; i < childCount; i++) {
			var child = model.getChildAt(parent, i);
			var bounds = this.getVertexBounds(child);
			if (bounds != null) {
				var tmp = bounds.x + bounds.width / 2;
				if (last < x && tmp > x) {
					break;
				}
				last = tmp;
			}
		}
		var idx = parent.getIndex(cell);
		idx = Math.max(0, i - ((i > idx) ? 1 : 0));
		model.add(parent, cell, idx);
	}
};
mxPartitionLayout.prototype.execute = function(parent) {
	var horizontal = this.isHorizontal();
	var model = this.graph.getModel();
	var pgeo = model.getGeometry(parent);
	if (this.graph.container != null && ((pgeo == null && model.isLayer(parent)) || parent == this.graph.getView().currentRoot)) {
		var width = this.graph.container.offsetWidth - 1;
		var height = this.graph.container.offsetHeight - 1;
		pgeo = new mxRectangle(0, 0, width, height);
	}
	if (pgeo != null) {
		var children = [];
		var childCount = model.getChildCount(parent);
		for (var i = 0; i < childCount; i++) {
			var child = model.getChildAt(parent, i);
			if (!this.isVertexIgnored(child) && this.isVertexMovable(child)) {
				children.push(child);
			}
		}
		var n = children.length;
		if (n > 0) {
			var x0 = this.border;
			var y0 = this.border;
			var other = (horizontal) ? pgeo.height: pgeo.width;
			other -= 2 * this.border;
			var size = (this.graph.isSwimlane(parent)) ? this.graph.getStartSize(parent) : new mxRectangle();
			other -= (horizontal) ? size.height: size.width;
			x0 = x0 + size.width;
			y0 = y0 + size.height;
			var tmp = this.border + (n - 1) * this.spacing;
			var value = (horizontal) ? ((pgeo.width - x0 - tmp) / n) : ((pgeo.height - y0 - tmp) / n);
			if (value > 0) {
				model.beginUpdate();
				try {
					for (var i = 0; i < n; i++) {
						var child = children[i];
						var geo = model.getGeometry(child);
						if (geo != null) {
							geo = geo.clone();
							geo.x = x0;
							geo.y = y0;
							if (horizontal) {
								if (this.resizeVertices) {
									geo.width = value;
									geo.height = other;
								}
								x0 += value + this.spacing;
							} else {
								if (this.resizeVertices) {
									geo.height = value;
									geo.width = other;
								}
								y0 += value + this.spacing;
							}
							model.setGeometry(child, geo);
						}
					}
				} finally {
					model.endUpdate();
				}
			}
		}
	}
};
function mxCompactTreeLayout(graph, horizontal, invert) {
	mxGraphLayout.call(this, graph);
	this.horizontal = (horizontal != null) ? horizontal: true;
	this.invert = (invert != null) ? invert: false;
};
mxCompactTreeLayout.prototype = new mxGraphLayout();
mxCompactTreeLayout.prototype.constructor = mxCompactTreeLayout;
mxCompactTreeLayout.prototype.horizontal = null;
mxCompactTreeLayout.prototype.invert = null;
mxCompactTreeLayout.prototype.resizeParent = true;
mxCompactTreeLayout.prototype.groupPadding = 10;
mxCompactTreeLayout.prototype.parentsChanged = null;
mxCompactTreeLayout.prototype.moveTree = mxClient.IS_IE;
mxCompactTreeLayout.prototype.levelDistance = 10;
mxCompactTreeLayout.prototype.nodeDistance = 20;
mxCompactTreeLayout.prototype.resetEdges = true;
mxCompactTreeLayout.prototype.prefHozEdgeSep = 5;
mxCompactTreeLayout.prototype.prefVertEdgeOff = 4;
mxCompactTreeLayout.prototype.minEdgeJetty = 8;
mxCompactTreeLayout.prototype.channelBuffer = 4;
mxCompactTreeLayout.prototype.edgeRouting = true;
mxCompactTreeLayout.prototype.isVertexIgnored = function(vertex) {
	return mxGraphLayout.prototype.isVertexIgnored.apply(this, arguments) || this.graph.getConnections(vertex).length == 0;
};
mxCompactTreeLayout.prototype.isHorizontal = function() {
	return this.horizontal;
};
mxCompactTreeLayout.prototype.execute = function(parent, root) {
	this.parent = parent;
	var model = this.graph.getModel();
	if (root == null) {
		if (this.graph.getEdges(parent, model.getParent(parent), this.invert, !this.invert, false).length > 0) {
			root = parent;
		} else {
			var roots = this.graph.findTreeRoots(parent, true, this.invert);
			if (roots.length > 0) {
				for (var i = 0; i < roots.length; i++) {
					if (!this.isVertexIgnored(roots[i]) && this.graph.getEdges(roots[i], null, this.invert, !this.invert, false).length > 0) {
						root = roots[i];
						break;
					}
				}
			}
		}
	}
	if (root != null) {
		if (this.resizeParent) {
			this.parentsChanged = new Object();
		} else {
			this.parentsChanged = null;
		}
		model.beginUpdate();
		try {
			var node = this.dfs(root, parent);
			if (node != null) {
				this.layout(node);
				var x0 = this.graph.gridSize;
				var y0 = x0;
				if (!this.moveTree) {
					var g = this.getVertexBounds(root);
					if (g != null) {
						x0 = g.x;
						y0 = g.y;
					}
				}
				var bounds = null;
				if (this.isHorizontal()) {
					bounds = this.horizontalLayout(node, x0, y0);
				} else {
					bounds = this.verticalLayout(node, null, x0, y0);
				}
				if (bounds != null) {
					var dx = 0;
					var dy = 0;
					if (bounds.x < 0) {
						dx = Math.abs(x0 - bounds.x);
					}
					if (bounds.y < 0) {
						dy = Math.abs(y0 - bounds.y);
					}
					if (dx != 0 && dy != 0) {
						this.moveNode(node, dx, dy);
					}
					if (this.resizeParent) {
						this.adjustParents();
					}
					if (this.edgeRouting) {
						this.localEdgeProcessing(node);
					}
				}
			}
		} finally {
			model.endUpdate();
		}
	}
};
mxCompactTreeLayout.prototype.moveNode = function(node, dx, dy) {
	node.x += dx;
	node.y += dy;
	this.apply(node);
	var child = node.child;
	while (child != null) {
		this.moveNode(child, dx, dy);
		child = child.next;
	}
};
mxCompactTreeLayout.prototype.dfs = function(cell, parent, visited) {
	visited = (visited != null) ? visited: [];
	var id = mxCellPath.create(cell);
	var node = null;
	if (cell != null && visited[id] == null && !this.isVertexIgnored(cell)) {
		visited[id] = cell;
		node = this.createNode(cell);
		var model = this.graph.getModel();
		var prev = null;
		var out = this.graph.getEdges(cell, parent, this.invert, !this.invert, false, true);
		var view = this.graph.getView();
		for (var i = 0; i < out.length; i++) {
			var edge = out[i];
			if (!this.isEdgeIgnored(edge)) {
				if (this.resetEdges) {
					this.setEdgePoints(edge, null);
				}
				if (this.edgeRouting) {
					this.setEdgeStyleEnabled(edge, false);
					this.setEdgePoints(edge, null);
				}
				var state = view.getState(edge);
				var target = (state != null) ? state.getVisibleTerminal(this.invert) : view.getVisibleTerminal(edge, this.invert);
				var tmp = this.dfs(target, parent, visited);
				if (tmp != null && model.getGeometry(target) != null) {
					if (prev == null) {
						node.child = tmp;
					} else {
						prev.next = tmp;
					}
					prev = tmp;
				}
			}
		}
	}
	return node;
};
mxCompactTreeLayout.prototype.layout = function(node) {
	if (node != null) {
		var child = node.child;
		while (child != null) {
			this.layout(child);
			child = child.next;
		}
		if (node.child != null) {
			this.attachParent(node, this.join(node));
		} else {
			this.layoutLeaf(node);
		}
	}
};
mxCompactTreeLayout.prototype.horizontalLayout = function(node, x0, y0, bounds) {
	node.x += x0 + node.offsetX;
	node.y += y0 + node.offsetY;
	bounds = this.apply(node, bounds);
	var child = node.child;
	if (child != null) {
		bounds = this.horizontalLayout(child, node.x, node.y, bounds);
		var siblingOffset = node.y + child.offsetY;
		var s = child.next;
		while (s != null) {
			bounds = this.horizontalLayout(s, node.x + child.offsetX, siblingOffset, bounds);
			siblingOffset += s.offsetY;
			s = s.next;
		}
	}
	return bounds;
};
mxCompactTreeLayout.prototype.verticalLayout = function(node, parent, x0, y0, bounds) {
	node.x += x0 + node.offsetY;
	node.y += y0 + node.offsetX;
	bounds = this.apply(node, bounds);
	var child = node.child;
	if (child != null) {
		bounds = this.verticalLayout(child, node, node.x, node.y, bounds);
		var siblingOffset = node.x + child.offsetY;
		var s = child.next;
		while (s != null) {
			bounds = this.verticalLayout(s, node, siblingOffset, node.y + child.offsetX, bounds);
			siblingOffset += s.offsetY;
			s = s.next;
		}
	}
	return bounds;
};
mxCompactTreeLayout.prototype.attachParent = function(node, height) {
	var x = this.nodeDistance + this.levelDistance;
	var y2 = (height - node.width) / 2 - this.nodeDistance;
	var y1 = y2 + node.width + 2 * this.nodeDistance - height;
	node.child.offsetX = x + node.height;
	node.child.offsetY = y1;
	node.contour.upperHead = this.createLine(node.height, 0, this.createLine(x, y1, node.contour.upperHead));
	node.contour.lowerHead = this.createLine(node.height, 0, this.createLine(x, y2, node.contour.lowerHead));
};
mxCompactTreeLayout.prototype.layoutLeaf = function(node) {
	var dist = 2 * this.nodeDistance;
	node.contour.upperTail = this.createLine(node.height + dist, 0);
	node.contour.upperHead = node.contour.upperTail;
	node.contour.lowerTail = this.createLine(0, -node.width - dist);
	node.contour.lowerHead = this.createLine(node.height + dist, 0, node.contour.lowerTail);
};
mxCompactTreeLayout.prototype.join = function(node) {
	var dist = 2 * this.nodeDistance;
	var child = node.child;
	node.contour = child.contour;
	var h = child.width + dist;
	var sum = h;
	child = child.next;
	while (child != null) {
		var d = this.merge(node.contour, child.contour);
		child.offsetY = d + h;
		child.offsetX = 0;
		h = child.width + dist;
		sum += d + h;
		child = child.next;
	}
	return sum;
};
mxCompactTreeLayout.prototype.merge = function(p1, p2) {
	var x = 0;
	var y = 0;
	var total = 0;
	var upper = p1.lowerHead;
	var lower = p2.upperHead;
	while (lower != null && upper != null) {
		var d = this.offset(x, y, lower.dx, lower.dy, upper.dx, upper.dy);
		y += d;
		total += d;
		if (x + lower.dx <= upper.dx) {
			x += lower.dx;
			y += lower.dy;
			lower = lower.next;
		} else {
			x -= upper.dx;
			y -= upper.dy;
			upper = upper.next;
		}
	}
	if (lower != null) {
		var b = this.bridge(p1.upperTail, 0, 0, lower, x, y);
		p1.upperTail = (b.next != null) ? p2.upperTail: b;
		p1.lowerTail = p2.lowerTail;
	} else {
		var b = this.bridge(p2.lowerTail, x, y, upper, 0, 0);
		if (b.next == null) {
			p1.lowerTail = b;
		}
	}
	p1.lowerHead = p2.lowerHead;
	return total;
};
mxCompactTreeLayout.prototype.offset = function(p1, p2, a1, a2, b1, b2) {
	var d = 0;
	if (b1 <= p1 || p1 + a1 <= 0) {
		return 0;
	}
	var t = b1 * a2 - a1 * b2;
	if (t > 0) {
		if (p1 < 0) {
			var s = p1 * a2;
			d = s / a1 - p2;
		} else if (p1 > 0) {
			var s = p1 * b2;
			d = s / b1 - p2;
		} else {
			d = -p2;
		}
	} else if (b1 < p1 + a1) {
		var s = (b1 - p1) * a2;
		d = b2 - (p2 + s / a1);
	} else if (b1 > p1 + a1) {
		var s = (a1 + p1) * b2;
		d = s / b1 - (p2 + a2);
	} else {
		d = b2 - (p2 + a2);
	}
	if (d > 0) {
		return d;
	} else {
		return 0;
	}
};
mxCompactTreeLayout.prototype.bridge = function(line1, x1, y1, line2, x2, y2) {
	var dx = x2 + line2.dx - x1;
	var dy = 0;
	var s = 0;
	if (line2.dx == 0) {
		dy = line2.dy;
	} else {
		s = dx * line2.dy;
		dy = s / line2.dx;
	}
	var r = this.createLine(dx, dy, line2.next);
	line1.next = this.createLine(0, y2 + line2.dy - dy - y1, r);
	return r;
};
mxCompactTreeLayout.prototype.createNode = function(cell) {
	var node = new Object();
	node.cell = cell;
	node.x = 0;
	node.y = 0;
	node.width = 0;
	node.height = 0;
	var geo = this.getVertexBounds(cell);
	if (geo != null) {
		if (this.isHorizontal()) {
			node.width = geo.height;
			node.height = geo.width;
		} else {
			node.width = geo.width;
			node.height = geo.height;
		}
	}
	node.offsetX = 0;
	node.offsetY = 0;
	node.contour = new Object();
	return node;
};
mxCompactTreeLayout.prototype.apply = function(node, bounds) {
	var model = this.graph.getModel();
	var cell = node.cell;
	var g = model.getGeometry(cell);
	if (cell != null && g != null) {
		if (this.isVertexMovable(cell)) {
			g = this.setVertexLocation(cell, node.x, node.y);
			if (this.resizeParent) {
				var parent = model.getParent(cell);
				var id = mxCellPath.create(parent);
				if (this.parentsChanged[id] == null) {
					this.parentsChanged[id] = parent;
				}
			}
		}
		if (bounds == null) {
			bounds = new mxRectangle(g.x, g.y, g.width, g.height);
		} else {
			bounds = new mxRectangle(Math.min(bounds.x, g.x), Math.min(bounds.y, g.y), Math.max(bounds.x + bounds.width, g.x + g.width), Math.max(bounds.y + bounds.height, g.y + g.height));
		}
	}
	return bounds;
};
mxCompactTreeLayout.prototype.createLine = function(dx, dy, next) {
	var line = new Object();
	line.dx = dx;
	line.dy = dy;
	line.next = next;
	return line;
};
mxCompactTreeLayout.prototype.adjustParents = function() {
	var tmp = [];
	for (var id in this.parentsChanged) {
		tmp.push(this.parentsChanged[id]);
	}
	this.arrangeGroups(mxUtils.sortCells(tmp, true), this.groupPadding);
};
mxCompactTreeLayout.prototype.localEdgeProcessing = function(node) {
	this.processNodeOutgoing(node);
	var child = node.child;
	while (child != null) {
		this.localEdgeProcessing(child);
		child = child.next;
	}
};
mxCompactTreeLayout.prototype.processNodeOutgoing = function(node) {
	var child = node.child;
	var parentCell = node.cell;
	var childCount = 0;
	var sortedCells = [];
	while (child != null) {
		childCount++;
		var sortingCriterion = child.x;
		if (this.horizontal) {
			sortingCriterion = child.y;
		}
		sortedCells.push(new WeightedCellSorter(child, sortingCriterion));
		child = child.next;
	}
	sortedCells.sort(WeightedCellSorter.prototype.compare);
	var availableWidth = node.width;
	var requiredWidth = (childCount + 1) * this.prefHozEdgeSep;
	if (availableWidth > requiredWidth + (2 * this.prefHozEdgeSep)) {
		availableWidth -= 2 * this.prefHozEdgeSep;
	}
	var edgeSpacing = availableWidth / childCount;
	var currentXOffset = edgeSpacing / 2.0;
	if (availableWidth > requiredWidth + (2 * this.prefHozEdgeSep)) {
		currentXOffset += this.prefHozEdgeSep;
	}
	var currentYOffset = this.minEdgeJetty - this.prefVertEdgeOff;
	var maxYOffset = 0;
	var parentBounds = this.getVertexBounds(parentCell);
	child = node.child;
	for (var j = 0; j < sortedCells.length; j++) {
		var childCell = sortedCells[j].cell.cell;
		var childBounds = this.getVertexBounds(childCell);
		var edges = this.graph.getEdgesBetween(parentCell, childCell, false);
		var newPoints = [];
		var x = 0;
		var y = 0;
		for (var i = 0; i < edges.length; i++) {
			if (this.horizontal) {
				x = parentBounds.x + parentBounds.width;
				y = parentBounds.y + currentXOffset;
				newPoints.push(new mxPoint(x, y));
				x = parentBounds.x + parentBounds.width + currentYOffset;
				newPoints.push(new mxPoint(x, y));
				y = childBounds.y + childBounds.height / 2.0;
				newPoints.push(new mxPoint(x, y));
				this.setEdgePoints(edges[i], newPoints);
			} else {
				x = parentBounds.x + currentXOffset;
				y = parentBounds.y + parentBounds.height;
				newPoints.push(new mxPoint(x, y));
				y = parentBounds.y + parentBounds.height + currentYOffset;
				newPoints.push(new mxPoint(x, y));
				x = childBounds.x + childBounds.width / 2.0;
				newPoints.push(new mxPoint(x, y));
				this.setEdgePoints(edges[i], newPoints);
			}
		}
		if (j < childCount / 2) {
			currentYOffset += this.prefVertEdgeOff;
		} else if (j > childCount / 2) {
			currentYOffset -= this.prefVertEdgeOff;
		}
		currentXOffset += edgeSpacing;
		maxYOffset = Math.max(maxYOffset, currentYOffset);
	}
};
function WeightedCellSorter(cell, weightedValue) {
	this.cell = cell;
	this.weightedValue = weightedValue;
};
WeightedCellSorter.prototype.weightedValue = 0;
WeightedCellSorter.prototype.nudge = false;
WeightedCellSorter.prototype.visited = false;
WeightedCellSorter.prototype.rankIndex = null;
WeightedCellSorter.prototype.cell = null;
WeightedCellSorter.prototype.compare = function(a, b) {
	if (a != null && b != null) {
		if (b.weightedValue > a.weightedValue) {
			return 1;
		} else if (b.weightedValue < a.weightedValue) {
			return - 1;
		} else {
			if (b.nudge) {
				return 1;
			} else {
				return - 1;
			}
		}
	} else {
		return 0;
	}
};
function mxFastOrganicLayout(graph) {
	mxGraphLayout.call(this, graph);
};
mxFastOrganicLayout.prototype = new mxGraphLayout();
mxFastOrganicLayout.prototype.constructor = mxFastOrganicLayout;
mxFastOrganicLayout.prototype.useInputOrigin = true;
mxFastOrganicLayout.prototype.resetEdges = true;
mxFastOrganicLayout.prototype.disableEdgeStyle = true;
mxFastOrganicLayout.prototype.forceConstant = 50;
mxFastOrganicLayout.prototype.forceConstantSquared = 0;
mxFastOrganicLayout.prototype.minDistanceLimit = 2;
mxFastOrganicLayout.prototype.maxDistanceLimit = 500;
mxFastOrganicLayout.prototype.minDistanceLimitSquared = 4;
mxFastOrganicLayout.prototype.initialTemp = 200;
mxFastOrganicLayout.prototype.temperature = 0;
mxFastOrganicLayout.prototype.maxIterations = 0;
mxFastOrganicLayout.prototype.iteration = 0;
mxFastOrganicLayout.prototype.vertexArray;
mxFastOrganicLayout.prototype.dispX;
mxFastOrganicLayout.prototype.dispY;
mxFastOrganicLayout.prototype.cellLocation;
mxFastOrganicLayout.prototype.radius;
mxFastOrganicLayout.prototype.radiusSquared;
mxFastOrganicLayout.prototype.isMoveable;
mxFastOrganicLayout.prototype.neighbours;
mxFastOrganicLayout.prototype.indices;
mxFastOrganicLayout.prototype.allowedToRun = true;
mxFastOrganicLayout.prototype.isVertexIgnored = function(vertex) {
	return mxGraphLayout.prototype.isVertexIgnored.apply(this, arguments) || this.graph.getConnections(vertex).length == 0;
};
mxFastOrganicLayout.prototype.execute = function(parent) {
	var model = this.graph.getModel();
	this.vertexArray = [];
	var cells = this.graph.getChildVertices(parent);
	for (var i = 0; i < cells.length; i++) {
		if (!this.isVertexIgnored(cells[i])) {
			this.vertexArray.push(cells[i]);
		}
	}
	var initialBounds = (this.useInputOrigin) ? this.graph.view.getBounds(this.vertexArray) : null;
	var n = this.vertexArray.length;
	this.indices = [];
	this.dispX = [];
	this.dispY = [];
	this.cellLocation = [];
	this.isMoveable = [];
	this.neighbours = [];
	this.radius = [];
	this.radiusSquared = [];
	if (this.forceConstant < 0.001) {
		this.forceConstant = 0.001;
	}
	this.forceConstantSquared = this.forceConstant * this.forceConstant;
	for (var i = 0; i < this.vertexArray.length; i++) {
		var vertex = this.vertexArray[i];
		this.cellLocation[i] = [];
		var id = mxCellPath.create(vertex);
		this.indices[id] = i;
		var bounds = this.getVertexBounds(vertex);
		var width = bounds.width;
		var height = bounds.height;
		var x = bounds.x;
		var y = bounds.y;
		this.cellLocation[i][0] = x + width / 2.0;
		this.cellLocation[i][1] = y + height / 2.0;
		this.radius[i] = Math.min(width, height);
		this.radiusSquared[i] = this.radius[i] * this.radius[i];
	}
	model.beginUpdate();
	try {
		for (var i = 0; i < n; i++) {
			this.dispX[i] = 0;
			this.dispY[i] = 0;
			this.isMoveable[i] = this.isVertexMovable(this.vertexArray[i]);
			var edges = this.graph.getConnections(this.vertexArray[i], parent);
			var cells = this.graph.getOpposites(edges, this.vertexArray[i]);
			this.neighbours[i] = [];
			for (var j = 0; j < cells.length; j++) {
				if (this.resetEdges) {
					this.graph.resetEdge(edges[j]);
				}
				if (this.disableEdgeStyle) {
					this.setEdgeStyleEnabled(edges[j], false);
				}
				var id = mxCellPath.create(cells[j]);
				var index = this.indices[id];
				if (index != null) {
					this.neighbours[i][j] = index;
				} else {
					this.neighbours[i][j] = i;
				}
			}
		}
		this.temperature = this.initialTemp;
		if (this.maxIterations == 0) {
			this.maxIterations = 20 * Math.sqrt(n);
		}
		for (this.iteration = 0; this.iteration < this.maxIterations; this.iteration++) {
			if (!this.allowedToRun) {
				return;
			}
			this.calcRepulsion();
			this.calcAttraction();
			this.calcPositions();
			this.reduceTemperature();
		}
		var minx = null;
		var miny = null;
		for (var i = 0; i < this.vertexArray.length; i++) {
			var vertex = this.vertexArray[i];
			if (this.isVertexMovable(vertex)) {
				var bounds = this.getVertexBounds(vertex);
				if (bounds != null) {
					this.cellLocation[i][0] -= bounds.width / 2.0;
					this.cellLocation[i][1] -= bounds.height / 2.0;
					var x = this.graph.snap(this.cellLocation[i][0]);
					var y = this.graph.snap(this.cellLocation[i][1]);
					this.setVertexLocation(vertex, x, y);
					if (minx == null) {
						minx = x;
					} else {
						minx = Math.min(minx, x);
					}
					if (miny == null) {
						miny = y;
					} else {
						miny = Math.min(miny, y);
					}
				}
			}
		}
		var dx = -(minx || 0) + 1;
		var dy = -(miny || 0) + 1;
		if (initialBounds != null) {
			dx += initialBounds.x;
			dy += initialBounds.y;
		}
		this.graph.moveCells(this.vertexArray, dx, dy);
	} finally {
		model.endUpdate();
	}
};
mxFastOrganicLayout.prototype.calcPositions = function() {
	for (var index = 0; index < this.vertexArray.length; index++) {
		if (this.isMoveable[index]) {
			var deltaLength = Math.sqrt(this.dispX[index] * this.dispX[index] + this.dispY[index] * this.dispY[index]);
			if (deltaLength < 0.001) {
				deltaLength = 0.001;
			}
			var newXDisp = this.dispX[index] / deltaLength * Math.min(deltaLength, this.temperature);
			var newYDisp = this.dispY[index] / deltaLength * Math.min(deltaLength, this.temperature);
			this.dispX[index] = 0;
			this.dispY[index] = 0;
			this.cellLocation[index][0] += newXDisp;
			this.cellLocation[index][1] += newYDisp;
		}
	}
};
mxFastOrganicLayout.prototype.calcAttraction = function() {
	for (var i = 0; i < this.vertexArray.length; i++) {
		for (var k = 0; k < this.neighbours[i].length; k++) {
			var j = this.neighbours[i][k];
			if (i != j && this.isMoveable[i] && this.isMoveable[j]) {
				var xDelta = this.cellLocation[i][0] - this.cellLocation[j][0];
				var yDelta = this.cellLocation[i][1] - this.cellLocation[j][1];
				var deltaLengthSquared = xDelta * xDelta + yDelta * yDelta - this.radiusSquared[i] - this.radiusSquared[j];
				if (deltaLengthSquared < this.minDistanceLimitSquared) {
					deltaLengthSquared = this.minDistanceLimitSquared;
				}
				var deltaLength = Math.sqrt(deltaLengthSquared);
				var force = (deltaLengthSquared) / this.forceConstant;
				var displacementX = (xDelta / deltaLength) * force;
				var displacementY = (yDelta / deltaLength) * force;
				this.dispX[i] -= displacementX;
				this.dispY[i] -= displacementY;
				this.dispX[j] += displacementX;
				this.dispY[j] += displacementY;
			}
		}
	}
};
mxFastOrganicLayout.prototype.calcRepulsion = function() {
	var vertexCount = this.vertexArray.length;
	for (var i = 0; i < vertexCount; i++) {
		for (var j = i; j < vertexCount; j++) {
			if (!this.allowedToRun) {
				return;
			}
			if (j != i && this.isMoveable[i] && this.isMoveable[j]) {
				var xDelta = this.cellLocation[i][0] - this.cellLocation[j][0];
				var yDelta = this.cellLocation[i][1] - this.cellLocation[j][1];
				if (xDelta == 0) {
					xDelta = 0.01 + Math.random();
				}
				if (yDelta == 0) {
					yDelta = 0.01 + Math.random();
				}
				var deltaLength = Math.sqrt((xDelta * xDelta) + (yDelta * yDelta));
				var deltaLengthWithRadius = deltaLength - this.radius[i] - this.radius[j];
				if (deltaLengthWithRadius > this.maxDistanceLimit) {
					continue;
				}
				if (deltaLengthWithRadius < this.minDistanceLimit) {
					deltaLengthWithRadius = this.minDistanceLimit;
				}
				var force = this.forceConstantSquared / deltaLengthWithRadius;
				var displacementX = (xDelta / deltaLength) * force;
				var displacementY = (yDelta / deltaLength) * force;
				this.dispX[i] += displacementX;
				this.dispY[i] += displacementY;
				this.dispX[j] -= displacementX;
				this.dispY[j] -= displacementY;
			}
		}
	}
};
mxFastOrganicLayout.prototype.reduceTemperature = function() {
	this.temperature = this.initialTemp * (1.0 - this.iteration / this.maxIterations);
};
function mxCircleLayout(graph, radius) {
	mxGraphLayout.call(this, graph);
	this.radius = (radius != null) ? radius: 100;
};
mxCircleLayout.prototype = new mxGraphLayout();
mxCircleLayout.prototype.constructor = mxCircleLayout;
mxCircleLayout.prototype.radius = null;
mxCircleLayout.prototype.moveCircle = false;
mxCircleLayout.prototype.x0 = 0;
mxCircleLayout.prototype.y0 = 0;
mxCircleLayout.prototype.resetEdges = true;
mxCircleLayout.prototype.disableEdgeStyle = true;
mxCircleLayout.prototype.execute = function(parent) {
	var model = this.graph.getModel();
	model.beginUpdate();
	try {
		var max = 0;
		var top = null;
		var left = null;
		var vertices = [];
		var childCount = model.getChildCount(parent);
		for (var i = 0; i < childCount; i++) {
			var cell = model.getChildAt(parent, i);
			if (!this.isVertexIgnored(cell)) {
				vertices.push(cell);
				var bounds = this.getVertexBounds(cell);
				if (top == null) {
					top = bounds.y;
				} else {
					top = Math.min(top, bounds.y);
				}
				if (left == null) {
					left = bounds.x;
				} else {
					left = Math.min(left, bounds.x);
				}
				max = Math.max(max, Math.max(bounds.width, bounds.height));
			} else if (!this.isEdgeIgnored(cell)) {
				if (this.resetEdges) {
					this.graph.resetEdge(cell);
				}
				if (this.disableEdgeStyle) {
					this.setEdgeStyleEnabled(cell, false);
				}
			}
		}
		var vertexCount = vertices.length;
		var r = Math.max(vertexCount * max / Math.PI, this.radius);
		if (this.moveCircle) {
			left = this.x0;
			top = this.y0;
		}
		this.circle(vertices, r, left, top);
	} finally {
		model.endUpdate();
	}
};
mxCircleLayout.prototype.circle = function(vertices, r, left, top) {
	var vertexCount = vertices.length;
	var phi = 2 * Math.PI / vertexCount;
	for (var i = 0; i < vertexCount; i++) {
		if (this.isVertexMovable(vertices[i])) {
			this.setVertexLocation(vertices[i], left + r + r * Math.sin(i * phi), top + r + r * Math.cos(i * phi));
		}
	}
};
function mxParallelEdgeLayout(graph) {
	mxGraphLayout.call(this, graph);
};
mxParallelEdgeLayout.prototype = new mxGraphLayout();
mxParallelEdgeLayout.prototype.constructor = mxParallelEdgeLayout;
mxParallelEdgeLayout.prototype.spacing = 20;
mxParallelEdgeLayout.prototype.execute = function(parent) {
	var lookup = this.findParallels(parent);
	this.graph.model.beginUpdate();
	try {
		for (var i in lookup) {
			var parallels = lookup[i];
			if (parallels.length > 1) {
				this.layout(parallels);
			}
		}
	} finally {
		this.graph.model.endUpdate();
	}
};
mxParallelEdgeLayout.prototype.findParallels = function(parent) {
	var model = this.graph.getModel();
	var lookup = [];
	var childCount = model.getChildCount(parent);
	for (var i = 0; i < childCount; i++) {
		var child = model.getChildAt(parent, i);
		if (!this.isEdgeIgnored(child)) {
			var id = this.getEdgeId(child);
			if (id != null) {
				if (lookup[id] == null) {
					lookup[id] = [];
				}
				lookup[id].push(child);
			}
		}
	}
	return lookup;
};
mxParallelEdgeLayout.prototype.getEdgeId = function(edge) {
	var view = this.graph.getView();
	var state = view.getState(edge);
	var src = (state != null) ? state.getVisibleTerminal(true) : view.getVisibleTerminal(edge, true);
	var trg = (state != null) ? state.getVisibleTerminal(false) : view.getVisibleTerminal(edge, false);
	if (src != null && trg != null) {
		src = mxCellPath.create(src);
		trg = mxCellPath.create(trg);
		return (src > trg) ? trg + '-' + src: src + '-' + trg;
	}
	return null;
};
mxParallelEdgeLayout.prototype.layout = function(parallels) {
	var edge = parallels[0];
	var model = this.graph.getModel();
	var src = model.getGeometry(model.getTerminal(edge, true));
	var trg = model.getGeometry(model.getTerminal(edge, false));
	if (src == trg) {
		var x0 = src.x + src.width + this.spacing;
		var y0 = src.y + src.height / 2;
		for (var i = 0; i < parallels.length; i++) {
			this.route(parallels[i], x0, y0);
			x0 += this.spacing;
		}
	} else if (src != null && trg != null) {
		var scx = src.x + src.width / 2;
		var scy = src.y + src.height / 2;
		var tcx = trg.x + trg.width / 2;
		var tcy = trg.y + trg.height / 2;
		var dx = tcx - scx;
		var dy = tcy - scy;
		var len = Math.sqrt(dx * dx + dy * dy);
		var x0 = scx + dx / 2;
		var y0 = scy + dy / 2;
		var nx = dy * this.spacing / len;
		var ny = dx * this.spacing / len;
		x0 += nx * (parallels.length - 1) / 2;
		y0 -= ny * (parallels.length - 1) / 2;
		for (var i = 0; i < parallels.length; i++) {
			this.route(parallels[i], x0, y0);
			x0 -= nx;
			y0 += ny;
		}
	}
};
mxParallelEdgeLayout.prototype.route = function(edge, x, y) {
	if (this.graph.isCellMovable(edge)) {
		this.setEdgePoints(edge, [new mxPoint(x, y)]);
	}
};
function mxCompositeLayout(graph, layouts, master) {
	mxGraphLayout.call(this, graph);
	this.layouts = layouts;
	this.master = master;
};
mxCompositeLayout.prototype = new mxGraphLayout();
mxCompositeLayout.prototype.constructor = mxCompositeLayout;
mxCompositeLayout.prototype.layouts = null;
mxCompositeLayout.prototype.master = null;
mxCompositeLayout.prototype.moveCell = function(cell, x, y) {
	if (this.master != null) {
		this.master.move.apply(this.master, arguments);
	} else {
		this.layouts[0].move.apply(this.layouts[0], arguments);
	}
};
mxCompositeLayout.prototype.execute = function(parent) {
	var model = this.graph.getModel();
	model.beginUpdate();
	try {
		for (var i = 0; i < this.layouts.length; i++) {
			this.layouts[i].execute.apply(this.layouts[i], arguments);
		}
	} finally {
		model.endUpdate();
	}
};
function mxEdgeLabelLayout(graph, radius) {
	mxGraphLayout.call(this, graph);
};
mxEdgeLabelLayout.prototype = new mxGraphLayout();
mxEdgeLabelLayout.prototype.constructor = mxEdgeLabelLayout;
mxEdgeLabelLayout.prototype.execute = function(parent) {
	var view = this.graph.view;
	var model = this.graph.getModel();
	var edges = [];
	var vertices = [];
	var childCount = model.getChildCount(parent);
	for (var i = 0; i < childCount; i++) {
		var cell = model.getChildAt(parent, i);
		var state = view.getState(cell);
		if (state != null) {
			if (!this.isVertexIgnored(cell)) {
				vertices.push(state);
			} else if (!this.isEdgeIgnored(cell)) {
				edges.push(state);
			}
		}
	}
	this.placeLabels(vertices, edges);
};
mxEdgeLabelLayout.prototype.placeLabels = function(v, e) {
	var model = this.graph.getModel();
	model.beginUpdate();
	try {
		for (var i = 0; i < e.length; i++) {
			var edge = e[i];
			if (edge != null && edge.text != null && edge.text.boundingBox != null) {
				for (var j = 0; j < v.length; j++) {
					var vertex = v[j];
					if (vertex != null) {
						this.avoid(edge, vertex);
					}
				}
			}
		}
	} finally {
		model.endUpdate();
	}
};
mxEdgeLabelLayout.prototype.avoid = function(edge, vertex) {
	var model = this.graph.getModel();
	var labRect = edge.text.boundingBox;
	if (mxUtils.intersects(labRect, vertex)) {
		var dy1 = -labRect.y - labRect.height + vertex.y;
		var dy2 = -labRect.y + vertex.y + vertex.height;
		var dy = (Math.abs(dy1) < Math.abs(dy2)) ? dy1: dy2;
		var dx1 = -labRect.x - labRect.width + vertex.x;
		var dx2 = -labRect.x + vertex.x + vertex.width;
		var dx = (Math.abs(dx1) < Math.abs(dx2)) ? dx1: dx2;
		if (Math.abs(dx) < Math.abs(dy)) {
			dy = 0;
		} else {
			dx = 0;
		}
		var g = model.getGeometry(edge.cell);
		if (g != null) {
			g = g.clone();
			if (g.offset != null) {
				g.offset.x += dx;
				g.offset.y += dy;
			} else {
				g.offset = new mxPoint(dx, dy);
			}
			model.setGeometry(edge.cell, g);
		}
	}
};
function mxGraphAbstractHierarchyCell() {
	this.x = [];
	this.y = [];
	this.temp = [];
};
mxGraphAbstractHierarchyCell.prototype.maxRank = -1;
mxGraphAbstractHierarchyCell.prototype.minRank = -1;
mxGraphAbstractHierarchyCell.prototype.x = null;
mxGraphAbstractHierarchyCell.prototype.y = null;
mxGraphAbstractHierarchyCell.prototype.width = 0;
mxGraphAbstractHierarchyCell.prototype.height = 0;
mxGraphAbstractHierarchyCell.prototype.nextLayerConnectedCells = null;
mxGraphAbstractHierarchyCell.prototype.previousLayerConnectedCells = null;
mxGraphAbstractHierarchyCell.prototype.temp = null;
mxGraphAbstractHierarchyCell.prototype.getNextLayerConnectedCells = function(layer) {
	return null;
};
mxGraphAbstractHierarchyCell.prototype.getPreviousLayerConnectedCells = function(layer) {
	return null;
};
mxGraphAbstractHierarchyCell.prototype.isEdge = function() {
	return false;
};
mxGraphAbstractHierarchyCell.prototype.isVertex = function() {
	return false;
};
mxGraphAbstractHierarchyCell.prototype.getGeneralPurposeVariable = function(layer) {
	return null;
};
mxGraphAbstractHierarchyCell.prototype.setGeneralPurposeVariable = function(layer, value) {
	return null;
};
mxGraphAbstractHierarchyCell.prototype.setX = function(layer, value) {
	if (this.isVertex()) {
		this.x[0] = value;
	} else if (this.isEdge()) {
		this.x[layer - this.minRank - 1] = value;
	}
};
mxGraphAbstractHierarchyCell.prototype.getX = function(layer) {
	if (this.isVertex()) {
		return this.x[0];
	} else if (this.isEdge()) {
		return this.x[layer - this.minRank - 1];
	}
	return 0.0;
};
mxGraphAbstractHierarchyCell.prototype.setY = function(layer, value) {
	if (this.isVertex()) {
		this.y[0] = value;
	} else if (this.isEdge()) {
		this.y[layer - this.minRank - 1] = value;
	}
};
function mxGraphHierarchyNode(cell) {
	mxGraphAbstractHierarchyCell.apply(this, arguments);
	this.cell = cell;
};
mxGraphHierarchyNode.prototype = new mxGraphAbstractHierarchyCell();
mxGraphHierarchyNode.prototype.constructor = mxGraphHierarchyNode;
mxGraphHierarchyNode.prototype.cell = null;
mxGraphHierarchyNode.prototype.connectsAsTarget = [];
mxGraphHierarchyNode.prototype.connectsAsSource = [];
mxGraphHierarchyNode.prototype.hashCode = false;
mxGraphHierarchyNode.prototype.getRankValue = function(layer) {
	return this.maxRank;
};
mxGraphHierarchyNode.prototype.getNextLayerConnectedCells = function(layer) {
	if (this.nextLayerConnectedCells == null) {
		this.nextLayerConnectedCells = [];
		this.nextLayerConnectedCells[0] = [];
		for (var i = 0; i < this.connectsAsTarget.length; i++) {
			var edge = this.connectsAsTarget[i];
			if (edge.maxRank == -1 || edge.maxRank == layer + 1) {
				this.nextLayerConnectedCells[0].push(edge.source);
			} else {
				this.nextLayerConnectedCells[0].push(edge);
			}
		}
	}
	return this.nextLayerConnectedCells[0];
};
mxGraphHierarchyNode.prototype.getPreviousLayerConnectedCells = function(layer) {
	if (this.previousLayerConnectedCells == null) {
		this.previousLayerConnectedCells = [];
		this.previousLayerConnectedCells[0] = [];
		for (var i = 0; i < this.connectsAsSource.length; i++) {
			var edge = this.connectsAsSource[i];
			if (edge.minRank == -1 || edge.minRank == layer - 1) {
				this.previousLayerConnectedCells[0].push(edge.target);
			} else {
				this.previousLayerConnectedCells[0].push(edge);
			}
		}
	}
	return this.previousLayerConnectedCells[0];
};
mxGraphHierarchyNode.prototype.isVertex = function() {
	return true;
};
mxGraphHierarchyNode.prototype.getGeneralPurposeVariable = function(layer) {
	return this.temp[0];
};
mxGraphHierarchyNode.prototype.setGeneralPurposeVariable = function(layer, value) {
	this.temp[0] = value;
};
mxGraphHierarchyNode.prototype.isAncestor = function(otherNode) {
	if (otherNode != null && this.hashCode != null && otherNode.hashCode != null && this.hashCode.length < otherNode.hashCode.length) {
		if (this.hashCode == otherNode.hashCode) {
			return true;
		}
		if (this.hashCode == null || this.hashCode == null) {
			return false;
		}
		for (var i = 0; i < this.hashCode.length; i++) {
			if (this.hashCode[i] != otherNode.hashCode[i]) {
				return false;
			}
		}
		return true;
	}
	return false;
};
function mxGraphHierarchyEdge(edges) {
	mxGraphAbstractHierarchyCell.apply(this, arguments);
	this.edges = edges;
};
mxGraphHierarchyEdge.prototype = new mxGraphAbstractHierarchyCell();
mxGraphHierarchyEdge.prototype.constructor = mxGraphHierarchyEdge;
mxGraphHierarchyEdge.prototype.edges = null;
mxGraphHierarchyEdge.prototype.source = null;
mxGraphHierarchyEdge.prototype.target = null;
mxGraphHierarchyEdge.prototype.isReversed = false;
mxGraphHierarchyEdge.prototype.invert = function(layer) {
	var temp = this.source;
	this.source = this.target;
	this.target = temp;
	this.isReversed = !this.isReversed;
};
mxGraphHierarchyEdge.prototype.getNextLayerConnectedCells = function(layer) {
	if (this.nextLayerConnectedCells == null) {
		this.nextLayerConnectedCells = [];
		for (var i = 0; i < this.temp.length; i++) {
			this.nextLayerConnectedCells[i] = [];
			if (i == this.nextLayerConnectedCells.length - 1) {
				this.nextLayerConnectedCells[i].push(this.source);
			} else {
				this.nextLayerConnectedCells[i].push(this);
			}
		}
	}
	return this.nextLayerConnectedCells[layer - this.minRank - 1];
};
mxGraphHierarchyEdge.prototype.getPreviousLayerConnectedCells = function(layer) {
	if (this.previousLayerConnectedCells == null) {
		this.previousLayerConnectedCells = [];
		for (var i = 0; i < this.temp.length; i++) {
			this.previousLayerConnectedCells[i] = [];
			if (i == 0) {
				this.previousLayerConnectedCells[i].push(this.target);
			} else {
				this.previousLayerConnectedCells[i].push(this);
			}
		}
	}
	return this.previousLayerConnectedCells[layer - this.minRank - 1];
};
mxGraphHierarchyEdge.prototype.isEdge = function() {
	return true;
};
mxGraphHierarchyEdge.prototype.getGeneralPurposeVariable = function(layer) {
	return this.temp[layer - this.minRank - 1];
};
mxGraphHierarchyEdge.prototype.setGeneralPurposeVariable = function(layer, value) {
	this.temp[layer - this.minRank - 1] = value;
};
function mxGraphHierarchyModel(layout, vertices, roots, parent, ordered, deterministic, tightenToSource, scanRanksFromSinks) {
	var graph = layout.getGraph();
	this.deterministic = deterministic;
	this.tightenToSource = tightenToSource;
	this.scanRanksFromSinks = scanRanksFromSinks;
	this.roots = roots;
	this.parent = parent;
	this.vertexMapper = new Object();
	this.edgeMapper = new Object();
	this.maxRank = 0;
	var internalVertices = [];
	if (vertices == null) {
		vertices = this.graph.getChildVertices(parent);
	}
	if (ordered) {
		this.formOrderedHierarchy(layout, vertices, parent);
	} else {
		if (this.scanRanksFromSinks) {
			this.maxRank = 0;
		} else {
			this.maxRank = this.SOURCESCANSTARTRANK;
		}
		this.createInternalCells(layout, vertices, internalVertices);
		for (var i = 0; i < vertices.length; i++) {
			var edges = internalVertices[i].connectsAsSource;
			for (var j = 0; j < edges.length; j++) {
				var internalEdge = edges[j];
				var realEdges = internalEdge.edges;
				for (var k = 0; k < realEdges.length; k++) {
					var realEdge = realEdges[k];
					var targetCell = graph.getView().getVisibleTerminal(realEdge, false);
					var targetCellId = mxCellPath.create(targetCell);
					var internalTargetCell = this.vertexMapper[targetCellId];
					if (internalTargetCell != null && internalVertices[i] != internalTargetCell) {
						internalEdge.target = internalTargetCell;
						if (internalTargetCell.connectsAsTarget.length == 0) {
							internalTargetCell.connectsAsTarget = [];
						}
						if (mxUtils.indexOf(internalTargetCell.connectsAsTarget, internalEdge) < 0) {
							internalTargetCell.connectsAsTarget.push(internalEdge);
						}
					}
				}
			}
			internalVertices[i].temp[0] = 1;
		}
	}
};
mxGraphHierarchyModel.prototype.scanRanksFromSinks = true;
mxGraphHierarchyModel.prototype.maxRank = null;
mxGraphHierarchyModel.prototype.vertexMapper = null;
mxGraphHierarchyModel.prototype.edgeMapper = null;
mxGraphHierarchyModel.prototype.ranks = null;
mxGraphHierarchyModel.prototype.roots = null;
mxGraphHierarchyModel.prototype.parent = null;
mxGraphHierarchyModel.prototype.dfsCount = 0;
mxGraphHierarchyModel.prototype.SOURCESCANSTARTRANK = 100000000;
mxGraphHierarchyModel.prototype.deterministic;
mxGraphHierarchyModel.prototype.tightenToSource = false;
mxGraphHierarchyModel.prototype.formOrderedHierarchy = function(layout, vertices, parent) {
	var graph = layout.getGraph();
	this.createInternalCells(layout, vertices, internalVertices);
	var tempList = [];
	for (var i = 0; i < vertices.length; i++) {
		var edges = internalVertices[i].connectsAsSource;
		for (var j = 0; j < edges.length; j++) {
			var internalEdge = edges[j];
			var realEdges = internalEdge.edges;
			for (var k = 0; k < realEdges.length; k++) {
				var realEdge = realEdges[k];
				var targetCell = this.graph.getView().getVisibleTerminal(realEdge, false);
				var targetCellId = mxCellPath.create(targetCell);
				var internalTargetCell = vertexMapper[targetCellId];
				if (internalTargetCell != null && internalVertices[i] != internalTargetCell) {
					internalEdge.target = internalTargetCell;
					if (internalTargetCell.connectsAsTarget.length == 0) {
						internalTargetCell.connectsAsTarget = [];
					}
					if (internalTargetCell.temp[0] == 1) {
						internalEdge.invert();
						internalTargetCell.connectsAsSource.push(internalEdge);
						tempList.push(internalEdge);
						if (mxUtils.indexOf(internalVertices[i].connectsAsTarget, internalEdge) < 0) {
							internalVertices[i].connectsAsTarget.push(internalEdge);
						}
					} else {
						if (mxUtils.indexOf(internalTargetCell.connectsAsTarget, internalEdge) < 0) {
							internalTargetCell.connectsAsTarget.push(internalEdge);
						}
					}
				}
			}
		}
		for (var j = 0; j < tempList.length; j++) {
			var tmp = tempList[j];
			mxUtils.remove(tmp, internalVertices[i].connectsAsSource);
		}
		tempList = [];
		internalVertices[i].temp[0] = 1;
	}
};
mxGraphHierarchyModel.prototype.createInternalCells = function(layout, vertices, internalVertices) {
	var graph = layout.getGraph();
	for (var i = 0; i < vertices.length; i++) {
		internalVertices[i] = new mxGraphHierarchyNode(vertices[i]);
		var vertexId = mxCellPath.create(vertices[i]);
		this.vertexMapper[vertexId] = internalVertices[i];
		var conns = graph.getConnections(vertices[i], this.parent);
		var outgoingCells = graph.getOpposites(conns, vertices[i]);
		internalVertices[i].connectsAsSource = [];
		for (var j = 0; j < outgoingCells.length; j++) {
			var cell = outgoingCells[j];
			if (cell != vertices[i] && !layout.isVertexIgnored(cell)) {
				var edges = graph.getEdgesBetween(vertices[i], cell, true);
				if (edges != null && edges.length > 0) {
					var internalEdge = new mxGraphHierarchyEdge(edges);
					for (var k = 0; k < edges.length; k++) {
						var edge = edges[k];
						var edgeId = mxCellPath.create(edge);
						this.edgeMapper[edgeId] = internalEdge;
						graph.resetEdge(edge);
						if (layout.disableEdgeStyle) {
							layout.setEdgeStyleEnabled(edge, false);
							layout.setOrthogonalEdge(edge, true);
						}
					}
					internalEdge.source = internalVertices[i];
					if (mxUtils.indexOf(internalVertices[i].connectsAsSource, internalEdge) < 0) {
						internalVertices[i].connectsAsSource.push(internalEdge);
					}
				}
			}
		}
		internalVertices[i].temp[0] = 0;
	}
};
mxGraphHierarchyModel.prototype.initialRank = function() {
	var startNodes = [];
	if (!this.scanRanksFromSinks && this.roots != null) {
		for (var i = 0; i < this.roots.length; i++) {
			var vertexId = mxCellPath.create(this.roots[i]);
			var internalNode = this.vertexMapper[vertexId];
			if (internalNode != null) {
				startNodes.push(internalNode);
			}
		}
	}
	if (this.scanRanksFromSinks) {
		for (var key in this.vertexMapper) {
			var internalNode = this.vertexMapper[key];
			if (internalNode.connectsAsSource == null || internalNode.connectsAsSource.length == 0) {
				startNodes.push(internalNode);
			}
		}
	}
	if (startNodes.length == 0) {
		for (var key in this.vertexMapper) {
			var internalNode = this.vertexMapper[key];
			if (internalNode.connectsAsTarget == null || internalNode.connectsAsTarget.length == 0) {
				startNodes.push(internalNode);
				this.scanRanksFromSinks = false;
				this.maxRank = this.SOURCESCANSTARTRANK;
			}
		}
	}
	for (var key in this.vertexMapper) {
		var internalNode = this.vertexMapper[key];
		internalNode.temp[0] = -1;
	}
	var startNodesCopy = startNodes.slice();
	while (startNodes.length > 0) {
		var internalNode = startNodes[0];
		var layerDeterminingEdges;
		var edgesToBeMarked;
		if (this.scanRanksFromSinks) {
			layerDeterminingEdges = internalNode.connectsAsSource;
			edgesToBeMarked = internalNode.connectsAsTarget;
		} else {
			layerDeterminingEdges = internalNode.connectsAsTarget;
			edgesToBeMarked = internalNode.connectsAsSource;
		}
		var allEdgesScanned = true;
		var minimumLayer = 0;
		if (!this.scanRanksFromSinks) {
			minimumLayer = this.SOURCESCANSTARTRANK;
		}
		for (var i = 0; i < layerDeterminingEdges.length; i++) {
			var internalEdge = layerDeterminingEdges[i];
			if (internalEdge.temp[0] == 5270620) {
				var otherNode;
				if (this.scanRanksFromSinks) {
					otherNode = internalEdge.target;
				} else {
					otherNode = internalEdge.source;
				}
				if (this.scanRanksFromSinks) {
					minimumLayer = Math.max(minimumLayer, otherNode.temp[0] + 1);
				} else {
					minimumLayer = Math.min(minimumLayer, otherNode.temp[0] - 1);
				}
			} else {
				allEdgesScanned = false;
				break;
			}
		}
		if (allEdgesScanned) {
			internalNode.temp[0] = minimumLayer;
			if (this.scanRanksFromSinks) {
				this.maxRank = Math.max(this.maxRank, minimumLayer);
			} else {
				this.maxRank = Math.min(this.maxRank, minimumLayer);
			}
			if (edgesToBeMarked != null) {
				for (var i = 0; i < edgesToBeMarked.length; i++) {
					var internalEdge = edgesToBeMarked[i];
					internalEdge.temp[0] = 5270620;
					var otherNode;
					if (this.scanRanksFromSinks) {
						otherNode = internalEdge.source;
					} else {
						otherNode = internalEdge.target;
					}
					if (otherNode.temp[0] == -1) {
						startNodes.push(otherNode);
						otherNode.temp[0] = -2;
					}
				}
			}
			startNodes.shift();
		} else {
			var removedCell = startNodes.shift();
			startNodes.push(internalNode);
			if (removedCell == internalNode && startNodes.length == 1) {
				break;
			}
		}
	}
	if (this.scanRanksFromSinks) {
		if (this.tightenToSource) {
			for (var i = 0; i < startNodesCopy.length; i++) {
				var internalNode = startNodesCopy[i];
				var currentMinLayer = 1000000;
				var layerDeterminingEdges = internalNode.connectsAsTarget;
				for (var j = 0; j < internalNode.connectsAsTarget.length; j++) {
					var internalEdge = internalNode.connectsAsTarget[j];
					var otherNode = internalEdge.source;
					internalNode.temp[0] = Math.min(currentMinLayer, otherNode.temp[0] - 1);
					currentMinLayer = internalNode.temp[0];
				}
			}
		}
	} else {
		for (var key in this.vertexMapper) {
			var internalNode = this.vertexMapper[key];
			internalNode.temp[0] -= this.maxRank;
		}
		this.maxRank = this.SOURCESCANSTARTRANK - this.maxRank;
	}
};
mxGraphHierarchyModel.prototype.fixRanks = function() {
	var rankList = [];
	this.ranks = [];
	for (var i = 0; i < this.maxRank + 1; i++) {
		rankList[i] = [];
		this.ranks[i] = rankList[i];
	}
	var rootsArray = null;
	if (this.roots != null) {
		var oldRootsArray = this.roots;
		rootsArray = [];
		for (var i = 0; i < oldRootsArray.length; i++) {
			var cell = oldRootsArray[i];
			var cellId = mxCellPath.create(cell);
			var internalNode = this.vertexMapper[cellId];
			rootsArray[i] = internalNode;
		}
	}
	this.visit(function(parent, node, edge, layer, seen) {
		if (seen == 0 && node.maxRank < 0 && node.minRank < 0) {
			rankList[node.temp[0]].push(node);
			node.maxRank = node.temp[0];
			node.minRank = node.temp[0];
			node.temp[0] = rankList[node.maxRank].length - 1;
		}
		if (parent != null && edge != null) {
			var parentToCellRankDifference = parent.maxRank - node.maxRank;
			if (parentToCellRankDifference > 1) {
				edge.maxRank = parent.maxRank;
				edge.minRank = node.maxRank;
				edge.temp = [];
				edge.x = [];
				edge.y = [];
				for (var i = edge.minRank + 1; i < edge.maxRank; i++) {
					rankList[i].push(edge);
					edge.setGeneralPurposeVariable(i, rankList[i].length - 1);
				}
			}
		}
	},
	rootsArray, false, null);
};
mxGraphHierarchyModel.prototype.visit = function(visitor, dfsRoots, trackAncestors, seenNodes) {
	if (dfsRoots != null) {
		for (var i = 0; i < dfsRoots.length; i++) {
			var internalNode = dfsRoots[i];
			if (internalNode != null) {
				if (seenNodes == null) {
					seenNodes = new Object();
				}
				if (trackAncestors) {
					internalNode.hashCode = [];
					internalNode.hashCode[0] = this.dfsCount;
					internalNode.hashCode[1] = i;
					this.extendedDfs(null, internalNode, null, visitor, seenNodes, internalNode.hashCode, i, 0);
				} else {
					this.dfs(null, internalNode, null, visitor, seenNodes, 0);
				}
			}
		}
		this.dfsCount++;
	}
};
mxGraphHierarchyModel.prototype.dfs = function(parent, root, connectingEdge, visitor, seen, layer) {
	if (root != null) {
		var rootId = mxCellPath.create(root.cell);
		if (seen[rootId] == null) {
			seen[rootId] = root;
			visitor(parent, root, connectingEdge, layer, 0);
			var outgoingEdges = root.connectsAsSource.slice();
			for (var i = 0; i < outgoingEdges.length; i++) {
				var internalEdge = outgoingEdges[i];
				var targetNode = internalEdge.target;
				this.dfs(root, targetNode, internalEdge, visitor, seen, layer + 1);
			}
		} else {
			visitor(parent, root, connectingEdge, layer, 1);
		}
	}
};
mxGraphHierarchyModel.prototype.extendedDfs = function(parent, root, connectingEdge, visitor, seen, ancestors, childHash, layer) {
	if (root != null) {
		if (parent != null) {
			if (root.hashCode == null || root.hashCode[0] != parent.hashCode[0]) {
				var hashCodeLength = parent.hashCode.length + 1;
				root.hashCode = parent.hashCode.slice();
				root.hashCode[hashCodeLength - 1] = childHash;
			}
		}
		var rootId = mxCellPath.create(root.cell);
		if (seen[rootId] == null) {
			seen[rootId] = root;
			visitor(parent, root, connectingEdge, layer, 0);
			var outgoingEdges = root.connectsAsSource.slice();
			for (var i = 0; i < outgoingEdges.length; i++) {
				var internalEdge = outgoingEdges[i];
				var targetNode = internalEdge.target;
				this.extendedDfs(root, targetNode, internalEdge, visitor, seen, root.hashCode, i, layer + 1);
			}
		} else {
			visitor(parent, root, connectingEdge, layer, 1);
		}
	}
};
function mxHierarchicalLayoutStage() {};
mxHierarchicalLayoutStage.prototype.execute = function(parent) {};
function mxMedianHybridCrossingReduction(layout) {
	this.layout = layout;
};
mxMedianHybridCrossingReduction.prototype = new mxHierarchicalLayoutStage();
mxMedianHybridCrossingReduction.prototype.constructor = mxMedianHybridCrossingReduction;
mxMedianHybridCrossingReduction.prototype.layout = null;
mxMedianHybridCrossingReduction.prototype.maxIterations = 24;
mxMedianHybridCrossingReduction.prototype.nestedBestRanks = null;
mxMedianHybridCrossingReduction.prototype.currentBestCrossings = 0;
mxMedianHybridCrossingReduction.prototype.iterationsWithoutImprovement = 0;
mxMedianHybridCrossingReduction.prototype.maxNoImprovementIterations = 2;
mxMedianHybridCrossingReduction.prototype.execute = function(parent) {
	var model = this.layout.getModel();
	this.nestedBestRanks = [];
	for (var i = 0; i < model.ranks.length; i++) {
		this.nestedBestRanks[i] = model.ranks[i].slice();
	}
	var iterationsWithoutImprovement = 0;
	var currentBestCrossings = this.calculateCrossings(model);
	for (var i = 0; i < this.maxIterations && iterationsWithoutImprovement < this.maxNoImprovementIterations; i++) {
		this.weightedMedian(i, model);
		this.transpose(i, model);
		var candidateCrossings = this.calculateCrossings(model);
		if (candidateCrossings < currentBestCrossings) {
			currentBestCrossings = candidateCrossings;
			iterationsWithoutImprovement = 0;
			for (var j = 0; j < this.nestedBestRanks.length; j++) {
				var rank = model.ranks[j];
				for (var k = 0; k < rank.length; k++) {
					var cell = rank[k];
					this.nestedBestRanks[j][cell.getGeneralPurposeVariable(j)] = cell;
				}
			}
		} else {
			iterationsWithoutImprovement++;
			for (var j = 0; j < this.nestedBestRanks.length; j++) {
				var rank = model.ranks[j];
				for (var k = 0; k < rank.length; k++) {
					var cell = rank[k];
					cell.setGeneralPurposeVariable(j, k);
				}
			}
		}
		if (currentBestCrossings == 0) {
			break;
		}
	}
	var ranks = [];
	var rankList = [];
	for (var i = 0; i < model.maxRank + 1; i++) {
		rankList[i] = [];
		ranks[i] = rankList[i];
	}
	for (var i = 0; i < this.nestedBestRanks.length; i++) {
		for (var j = 0; j < this.nestedBestRanks[i].length; j++) {
			rankList[i].push(this.nestedBestRanks[i][j]);
		}
	}
	model.ranks = ranks;
};
mxMedianHybridCrossingReduction.prototype.calculateCrossings = function(model) {
	var numRanks = model.ranks.length;
	var totalCrossings = 0;
	for (var i = 1; i < numRanks; i++) {
		totalCrossings += this.calculateRankCrossing(i, model);
	}
	return totalCrossings;
};
mxMedianHybridCrossingReduction.prototype.calculateRankCrossing = function(i, model) {
	var totalCrossings = 0;
	var rank = model.ranks[i];
	var previousRank = model.ranks[i - 1];
	var currentRankSize = rank.length;
	var previousRankSize = previousRank.length;
	var connections = [];
	for (var j = 0; j < currentRankSize; j++) {
		connections[j] = [];
	}
	for (var j = 0; j < rank.length; j++) {
		var node = rank[j];
		var rankPosition = node.getGeneralPurposeVariable(i);
		var connectedCells = node.getPreviousLayerConnectedCells(i);
		for (var k = 0; k < connectedCells.length; k++) {
			var connectedNode = connectedCells[k];
			var otherCellRankPosition = connectedNode.getGeneralPurposeVariable(i - 1);
			connections[rankPosition][otherCellRankPosition] = 201207;
		}
	}
	for (var j = 0; j < currentRankSize; j++) {
		for (var k = 0; k < previousRankSize; k++) {
			if (connections[j][k] == 201207) {
				for (var j2 = j + 1; j2 < currentRankSize; j2++) {
					for (var k2 = 0; k2 < k; k2++) {
						if (connections[j2][k2] == 201207) {
							totalCrossings++;
						}
					}
				}
				for (var j2 = 0; j2 < j; j2++) {
					for (var k2 = k + 1; k2 < previousRankSize; k2++) {
						if (connections[j2][k2] == 201207) {
							totalCrossings++;
						}
					}
				}
			}
		}
	}
	return totalCrossings / 2;
};
mxMedianHybridCrossingReduction.prototype.transpose = function(mainLoopIteration, model) {
	var improved = true;
	var count = 0;
	var maxCount = 10;
	while (improved && count++<maxCount) {
		var nudge = mainLoopIteration % 2 == 1 && count % 2 == 1;
		improved = false;
		for (var i = 0; i < model.ranks.length; i++) {
			var rank = model.ranks[i];
			var orderedCells = [];
			for (var j = 0; j < rank.length; j++) {
				var cell = rank[j];
				var tempRank = cell.getGeneralPurposeVariable(i);
				if (tempRank < 0) {
					tempRank = j;
				}
				orderedCells[tempRank] = cell;
			}
			var leftCellAboveConnections = null;
			var leftCellBelowConnections = null;
			var rightCellAboveConnections = null;
			var rightCellBelowConnections = null;
			var leftAbovePositions = null;
			var leftBelowPositions = null;
			var rightAbovePositions = null;
			var rightBelowPositions = null;
			var leftCell = null;
			var rightCell = null;
			for (var j = 0; j < (rank.length - 1); j++) {
				if (j == 0) {
					leftCell = orderedCells[j];
					leftCellAboveConnections = leftCell.getNextLayerConnectedCells(i);
					leftCellBelowConnections = leftCell.getPreviousLayerConnectedCells(i);
					leftAbovePositions = [];
					leftBelowPositions = [];
					for (var k = 0; k < leftAbovePositions.length; k++) {
						leftAbovePositions[k] = leftCellAboveConnections[k].getGeneralPurposeVariable(i + 1);
					}
					for (var k = 0; k < leftBelowPositions.length; k++) {
						leftBelowPositions[k] = leftCellBelowConnections[k].getGeneralPurposeVariable(i - 1);
					}
				} else {
					leftCellAboveConnections = rightCellAboveConnections;
					leftCellBelowConnections = rightCellBelowConnections;
					leftAbovePositions = rightAbovePositions;
					leftBelowPositions = rightBelowPositions;
					leftCell = rightCell;
				}
				rightCell = orderedCells[j + 1];
				rightCellAboveConnections = rightCell.getNextLayerConnectedCells(i);
				rightCellBelowConnections = rightCell.getPreviousLayerConnectedCells(i);
				rightAbovePositions = [];
				rightBelowPositions = [];
				for (var k = 0; k < rightAbovePositions.length; k++) {
					rightAbovePositions[k] = rightCellAboveConnections[k].getGeneralPurposeVariable(i + 1);
				}
				for (var k = 0; k < rightBelowPositions.length; k++) {
					rightBelowPositions[k] = rightCellBelowConnections[k].getGeneralPurposeVariable(i - 1);
				}
				var totalCurrentCrossings = 0;
				var totalSwitchedCrossings = 0;
				for (var k = 0; k < leftAbovePositions.length; k++) {
					for (var ik = 0; ik < rightAbovePositions.length; ik++) {
						if (leftAbovePositions[k] > rightAbovePositions[ik]) {
							totalCurrentCrossings++;
						}
						if (leftAbovePositions[k] < rightAbovePositions[ik]) {
							totalSwitchedCrossings++;
						}
					}
				}
				for (var k = 0; k < leftBelowPositions.length; k++) {
					for (var ik = 0; ik < rightBelowPositions.length; ik++) {
						if (leftBelowPositions[k] > rightBelowPositions[ik]) {
							totalCurrentCrossings++;
						}
						if (leftBelowPositions[k] < rightBelowPositions[ik]) {
							totalSwitchedCrossings++;
						}
					}
				}
				if ((totalSwitchedCrossings < totalCurrentCrossings) || (totalSwitchedCrossings == totalCurrentCrossings && nudge)) {
					var temp = leftCell.getGeneralPurposeVariable(i);
					leftCell.setGeneralPurposeVariable(i, rightCell.getGeneralPurposeVariable(i));
					rightCell.setGeneralPurposeVariable(i, temp);
					rightCellAboveConnections = leftCellAboveConnections;
					rightCellBelowConnections = leftCellBelowConnections;
					rightAbovePositions = leftAbovePositions;
					rightBelowPositions = leftBelowPositions;
					rightCell = leftCell;
					if (!nudge) {
						improved = true;
					}
				}
			}
		}
	}
};
mxMedianHybridCrossingReduction.prototype.weightedMedian = function(iteration, model) {
	var downwardSweep = (iteration % 2 == 0);
	if (downwardSweep) {
		for (var j = model.maxRank - 1; j >= 0; j--) {
			this.medianRank(j, downwardSweep);
		}
	} else {
		for (var j = 1; j < model.maxRank; j++) {
			this.medianRank(j, downwardSweep);
		}
	}
};
mxMedianHybridCrossingReduction.prototype.medianRank = function(rankValue, downwardSweep) {
	var numCellsForRank = this.nestedBestRanks[rankValue].length;
	var medianValues = [];
	for (var i = 0; i < numCellsForRank; i++) {
		var cell = this.nestedBestRanks[rankValue][i];
		medianValues[i] = new MedianCellSorter();
		medianValues[i].cell = cell;
		var nextLevelConnectedCells;
		if (downwardSweep) {
			nextLevelConnectedCells = cell.getNextLayerConnectedCells(rankValue);
		} else {
			nextLevelConnectedCells = cell.getPreviousLayerConnectedCells(rankValue);
		}
		var nextRankValue;
		if (downwardSweep) {
			nextRankValue = rankValue + 1;
		} else {
			nextRankValue = rankValue - 1;
		}
		if (nextLevelConnectedCells != null && nextLevelConnectedCells.length != 0) {
			medianValues[i].medianValue = this.medianValue(nextLevelConnectedCells, nextRankValue);
		} else {
			medianValues[i].medianValue = -1.0;
		}
	}
	medianValues.sort(MedianCellSorter.prototype.compare);
	for (var i = 0; i < numCellsForRank; i++) {
		medianValues[i].cell.setGeneralPurposeVariable(rankValue, i);
	}
};
mxMedianHybridCrossingReduction.prototype.medianValue = function(connectedCells, rankValue) {
	var medianValues = [];
	var arrayCount = 0;
	for (var i = 0; i < connectedCells.length; i++) {
		var cell = connectedCells[i];
		medianValues[arrayCount++] = cell.getGeneralPurposeVariable(rankValue);
	}
	medianValues.sort(MedianCellSorter.prototype.compare);
	if (arrayCount % 2 == 1) {
		return medianValues[arrayCount / 2];
	} else if (arrayCount == 2) {
		return ((medianValues[0] + medianValues[1]) / 2.0);
	} else {
		var medianPoint = arrayCount / 2;
		var leftMedian = medianValues[medianPoint - 1] - medianValues[0];
		var rightMedian = medianValues[arrayCount - 1] - medianValues[medianPoint];
		return (medianValues[medianPoint - 1] * rightMedian + medianValues[medianPoint] * leftMedian) / (leftMedian + rightMedian);
	}
};
function MedianCellSorter() {};
MedianCellSorter.prototype.medianValue = 0;
MedianCellSorter.prototype.cell = false;
MedianCellSorter.prototype.compare = function(a, b) {
	if (a != null && b != null) {
		if (b.medianValue > a.medianValue) {
			return - 1;
		} else if (b.medianValue < a.medianValue) {
			return 1;
		} else {
			return 0;
		}
	} else {
		return 0;
	}
};
function mxMinimumCycleRemover(layout) {
	this.layout = layout;
};
mxMinimumCycleRemover.prototype = new mxHierarchicalLayoutStage();
mxMinimumCycleRemover.prototype.constructor = mxMinimumCycleRemover;
mxMinimumCycleRemover.prototype.layout = null;
mxMinimumCycleRemover.prototype.execute = function(parent) {
	var model = this.layout.getModel();
	var seenNodes = new Object();
	var unseenNodes = mxUtils.clone(model.vertexMapper, null, true);
	var rootsArray = null;
	if (model.roots != null) {
		var modelRoots = model.roots;
		rootsArray = [];
		for (var i = 0; i < modelRoots.length; i++) {
			var nodeId = mxCellPath.create(modelRoots[i]);
			rootsArray[i] = model.vertexMapper[nodeId];
		}
	}
	model.visit(function(parent, node, connectingEdge, layer, seen) {
		if (node.isAncestor(parent)) {
			connectingEdge.invert();
			mxUtils.remove(connectingEdge, parent.connectsAsSource);
			parent.connectsAsTarget.push(connectingEdge);
			mxUtils.remove(connectingEdge, node.connectsAsTarget);
			node.connectsAsSource.push(connectingEdge);
		}
		var cellId = mxCellPath.create(node.cell);
		seenNodes[cellId] = node;
		delete unseenNodes[cellId];
	},
	rootsArray, true, null);
	var possibleNewRoots = null;
	if (unseenNodes.lenth > 0) {
		possibleNewRoots = mxUtils.clone(unseenNodes, null, true);
	}
	var seenNodesCopy = mxUtils.clone(seenNodes, null, true);
	model.visit(function(parent, node, connectingEdge, layer, seen) {
		if (node.isAncestor(parent)) {
			connectingEdge.invert();
			mxUtils.remove(connectingEdge, parent.connectsAsSource);
			node.connectsAsSource.push(connectingEdge);
			parent.connectsAsTarget.push(connectingEdge);
			mxUtils.remove(connectingEdge, node.connectsAsTarget);
		}
		var cellId = mxCellPath.create(node.cell);
		seenNodes[cellId] = node;
		delete unseenNodes[cellId];
	},
	unseenNodes, true, seenNodesCopy);
	var graph = this.layout.getGraph();
	if (possibleNewRoots != null && possibleNewRoots.length > 0) {
		var roots = model.roots;
		for (var i = 0; i < possibleNewRoots.length; i++) {
			var node = possibleNewRoots[i];
			var realNode = node.cell;
			var numIncomingEdges = graph.getIncomingEdges(realNode).length;
			if (numIncomingEdges == 0) {
				roots.push(realNode);
			}
		}
	}
};
function mxCoordinateAssignment(layout, intraCellSpacing, interRankCellSpacing, orientation, initialX, parallelEdgeSpacing) {
	this.layout = layout;
	this.intraCellSpacing = intraCellSpacing;
	this.interRankCellSpacing = interRankCellSpacing;
	this.orientation = orientation;
	this.initialX = initialX;
	this.parallelEdgeSpacing = parallelEdgeSpacing;
};
var mxHierarchicalEdgeStyle = {
	ORTHOGONAL: 1,
	POLYLINE: 2,
	STRAIGHT: 3
};
mxCoordinateAssignment.prototype = new mxHierarchicalLayoutStage();
mxCoordinateAssignment.prototype.constructor = mxCoordinateAssignment;
mxCoordinateAssignment.prototype.layout = null;
mxCoordinateAssignment.prototype.intraCellSpacing = 30;
mxCoordinateAssignment.prototype.interRankCellSpacing = 10;
mxCoordinateAssignment.prototype.parallelEdgeSpacing = 10;
mxCoordinateAssignment.prototype.maxIterations = 8;
mxCoordinateAssignment.prototype.prefHozEdgeSep = 5;
mxCoordinateAssignment.prototype.prefVertEdgeOff = 2;
mxCoordinateAssignment.prototype.minEdgeJetty = 12;
mxCoordinateAssignment.prototype.channelBuffer = 4;
mxCoordinateAssignment.prototype.jettyPositions = null;
mxCoordinateAssignment.prototype.orientation = mxConstants.DIRECTION_NORTH;
mxCoordinateAssignment.prototype.initialX = null;
mxCoordinateAssignment.prototype.limitX = null;
mxCoordinateAssignment.prototype.currentXDelta = null;
mxCoordinateAssignment.prototype.widestRank = null;
mxCoordinateAssignment.prototype.rankTopY = null;
mxCoordinateAssignment.prototype.rankBottomY = null;
mxCoordinateAssignment.prototype.widestRankValue = null;
mxCoordinateAssignment.prototype.rankWidths = null;
mxCoordinateAssignment.prototype.rankY = null;
mxCoordinateAssignment.prototype.fineTuning = true;
mxCoordinateAssignment.prototype.edgeStyle = mxHierarchicalEdgeStyle.POLYLINE;
mxCoordinateAssignment.prototype.nextLayerConnectedCache = null;
mxCoordinateAssignment.prototype.previousLayerConnectedCache = null;
mxCoordinateAssignment.prototype.execute = function(parent) {
	this.jettyPositions = [];
	var model = this.layout.getModel();
	this.currentXDelta = 0.0;
	this.initialCoords(this.layout.getGraph(), model);
	if (this.fineTuning) {
		this.minNode(model);
	}
	var bestXDelta = 100000000.0;
	if (this.fineTuning) {
		for (var i = 0; i < this.maxIterations; i++) {
			if (i != 0) {
				this.medianPos(i, model);
				this.minNode(model);
			}
			if (this.currentXDelta < bestXDelta) {
				for (var j = 0; j < model.ranks.length; j++) {
					var rank = model.ranks[j];
					for (var k = 0; k < rank.length; k++) {
						var cell = rank[k];
						cell.setX(j, cell.getGeneralPurposeVariable(j));
					}
				}
				bestXDelta = this.currentXDelta;
			} else {
				for (var j = 0; j < model.ranks.length; j++) {
					var rank = model.ranks[j];
					for (var k = 0; k < rank.length; k++) {
						var cell = rank[k];
						cell.setGeneralPurposeVariable(j, cell.getX(j));
					}
				}
			}
			this.minPath(this.layout.getGraph(), model);
			this.currentXDelta = 0;
		}
	}
	this.setCellLocations(this.layout.getGraph(), model);
};
mxCoordinateAssignment.prototype.minNode = function(model) {
	var nodeList = [];
	var map = [];
	var rank = [];
	for (var i = 0; i <= model.maxRank; i++) {
		rank[i] = model.ranks[i];
		for (var j = 0; j < rank[i].length; j++) {
			var node = rank[i][j];
			var nodeWrapper = new WeightedCellSorter(node, i);
			nodeWrapper.rankIndex = j;
			nodeWrapper.visited = true;
			nodeList.push(nodeWrapper);
			var cellId = mxCellPath.create(node.cell);
			map[cellId] = nodeWrapper;
		}
	}
	var maxTries = nodeList.length * 10;
	var count = 0;
	var tolerance = 1;
	while (nodeList.length > 0 && count <= maxTries) {
		var cellWrapper = nodeList.shift();
		var cell = cellWrapper.cell;
		var rankValue = cellWrapper.weightedValue;
		var rankIndex = parseInt(cellWrapper.rankIndex);
		var nextLayerConnectedCells = cell.getNextLayerConnectedCells(rankValue);
		var previousLayerConnectedCells = cell.getPreviousLayerConnectedCells(rankValue);
		var numNextLayerConnected = nextLayerConnectedCells.length;
		var numPreviousLayerConnected = previousLayerConnectedCells.length;
		var medianNextLevel = this.medianXValue(nextLayerConnectedCells, rankValue + 1);
		var medianPreviousLevel = this.medianXValue(previousLayerConnectedCells, rankValue - 1);
		var numConnectedNeighbours = numNextLayerConnected + numPreviousLayerConnected;
		var currentPosition = cell.getGeneralPurposeVariable(rankValue);
		var cellMedian = currentPosition;
		if (numConnectedNeighbours > 0) {
			cellMedian = (medianNextLevel * numNextLayerConnected + medianPreviousLevel * numPreviousLayerConnected) / numConnectedNeighbours;
		}
		var positionChanged = false;
		if (cellMedian < currentPosition - tolerance) {
			if (rankIndex == 0) {
				cell.setGeneralPurposeVariable(rankValue, cellMedian);
				positionChanged = true;
			} else {
				var leftCell = rank[rankValue][rankIndex - 1];
				var leftLimit = leftCell.getGeneralPurposeVariable(rankValue);
				leftLimit = leftLimit + leftCell.width / 2 + this.intraCellSpacing + cell.width / 2;
				if (leftLimit < cellMedian) {
					cell.setGeneralPurposeVariable(rankValue, cellMedian);
					positionChanged = true;
				} else if (leftLimit < cell.getGeneralPurposeVariable(rankValue) - tolerance) {
					cell.setGeneralPurposeVariable(rankValue, leftLimit);
					positionChanged = true;
				}
			}
		} else if (cellMedian > currentPosition + tolerance) {
			var rankSize = rank[rankValue].length;
			if (rankIndex == rankSize - 1) {
				cell.setGeneralPurposeVariable(rankValue, cellMedian);
				positionChanged = true;
			} else {
				var rightCell = rank[rankValue][rankIndex + 1];
				var rightLimit = rightCell.getGeneralPurposeVariable(rankValue);
				rightLimit = rightLimit - rightCell.width / 2 - this.intraCellSpacing - cell.width / 2;
				if (rightLimit > cellMedian) {
					cell.setGeneralPurposeVariable(rankValue, cellMedian);
					positionChanged = true;
				} else if (rightLimit > cell.getGeneralPurposeVariable(rankValue) + tolerance) {
					cell.setGeneralPurposeVariable(rankValue, rightLimit);
					positionChanged = true;
				}
			}
		}
		if (positionChanged) {
			for (var i = 0; i < nextLayerConnectedCells.length; i++) {
				var connectedCell = nextLayerConnectedCells[i];
				var connectedCellId = mxCellPath.create(connectedCell.cell);
				var connectedCellWrapper = map[connectedCellId];
				if (connectedCellWrapper != null) {
					if (connectedCellWrapper.visited == false) {
						connectedCellWrapper.visited = true;
						nodeList.push(connectedCellWrapper);
					}
				}
			}
			for (var i = 0; i < previousLayerConnectedCells.length; i++) {
				var connectedCell = previousLayerConnectedCells[i];
				var connectedCellId = mxCellPath.create(connectedCell.cell);
				var connectedCellWrapper = map[connectedCellId];
				if (connectedCellWrapper != null) {
					if (connectedCellWrapper.visited == false) {
						connectedCellWrapper.visited = true;
						nodeList.push(connectedCellWrapper);
					}
				}
			}
		}
		cellWrapper.visited = false;
		count++;
	}
};
mxCoordinateAssignment.prototype.medianPos = function(i, model) {
	var downwardSweep = (i % 2 == 0);
	if (downwardSweep) {
		for (var j = model.maxRank; j > 0; j--) {
			this.rankMedianPosition(j - 1, model, j);
		}
	} else {
		for (var j = 0; j < model.maxRank - 1; j++) {
			this.rankMedianPosition(j + 1, model, j);
		}
	}
};
mxCoordinateAssignment.prototype.rankMedianPosition = function(rankValue, model, nextRankValue) {
	var rank = model.ranks[rankValue];
	var weightedValues = [];
	var cellMap = [];
	for (var i = 0; i < rank.length; i++) {
		var currentCell = rank[i];
		weightedValues[i] = new WeightedCellSorter();
		weightedValues[i].cell = currentCell;
		weightedValues[i].rankIndex = i;
		var currentCellId = mxCellPath.create(currentCell.cell);
		cellMap[currentCellId] = weightedValues[i];
		var nextLayerConnectedCells = null;
		if (nextRankValue < rankValue) {
			nextLayerConnectedCells = currentCell.getPreviousLayerConnectedCells(rankValue);
		} else {
			nextLayerConnectedCells = currentCell.getNextLayerConnectedCells(rankValue);
		}
		weightedValues[i].weightedValue = this.calculatedWeightedValue(currentCell, nextLayerConnectedCells);
	}
	weightedValues.sort(WeightedCellSorter.prototype.compare);
	for (var i = 0; i < weightedValues.length; i++) {
		var numConnectionsNextLevel = 0;
		var cell = weightedValues[i].cell;
		var nextLayerConnectedCells = null;
		var medianNextLevel = 0;
		if (nextRankValue < rankValue) {
			nextLayerConnectedCells = cell.getPreviousLayerConnectedCells(rankValue).slice();
		} else {
			nextLayerConnectedCells = cell.getNextLayerConnectedCells(rankValue).slice();
		}
		if (nextLayerConnectedCells != null) {
			numConnectionsNextLevel = nextLayerConnectedCells.length;
			if (numConnectionsNextLevel > 0) {
				medianNextLevel = this.medianXValue(nextLayerConnectedCells, nextRankValue);
			} else {
				medianNextLevel = cell.getGeneralPurposeVariable(rankValue);
			}
		}
		var leftBuffer = 0.0;
		var leftLimit = -100000000.0;
		for (var j = weightedValues[i].rankIndex - 1; j >= 0;) {
			var rankId = mxCellPath.create(rank[j].cell);
			var weightedValue = cellMap[rankId];
			if (weightedValue != null) {
				var leftCell = weightedValue.cell;
				if (weightedValue.visited) {
					leftLimit = leftCell.getGeneralPurposeVariable(rankValue) + leftCell.width / 2.0 + this.intraCellSpacing + leftBuffer + cell.width / 2.0;
					j = -1;
				} else {
					leftBuffer += leftCell.width + this.intraCellSpacing;
					j--;
				}
			}
		}
		var rightBuffer = 0.0;
		var rightLimit = 100000000.0;
		for (var j = weightedValues[i].rankIndex + 1; j < weightedValues.length;) {
			var rankId = mxCellPath.create(rank[j].cell);
			var weightedValue = cellMap[rankId];
			if (weightedValue != null) {
				var rightCell = weightedValue.cell;
				if (weightedValue.visited) {
					rightLimit = rightCell.getGeneralPurposeVariable(rankValue) - rightCell.width / 2.0 - this.intraCellSpacing - rightBuffer - cell.width / 2.0;
					j = weightedValues.length;
				} else {
					rightBuffer += rightCell.width + this.intraCellSpacing;
					j++;
				}
			}
		}
		if (medianNextLevel >= leftLimit && medianNextLevel <= rightLimit) {
			cell.setGeneralPurposeVariable(rankValue, medianNextLevel);
		} else if (medianNextLevel < leftLimit) {
			cell.setGeneralPurposeVariable(rankValue, leftLimit);
			this.currentXDelta += leftLimit - medianNextLevel;
		} else if (medianNextLevel > rightLimit) {
			cell.setGeneralPurposeVariable(rankValue, rightLimit);
			this.currentXDelta += medianNextLevel - rightLimit;
		}
		weightedValues[i].visited = true;
	}
};
mxCoordinateAssignment.prototype.calculatedWeightedValue = function(currentCell, collection) {
	var totalWeight = 0;
	for (var i = 0; i < collection.length; i++) {
		var cell = collection[i];
		if (currentCell.isVertex() && cell.isVertex()) {
			totalWeight++;
		} else if (currentCell.isEdge() && cell.isEdge()) {
			totalWeight += 8;
		} else {
			totalWeight += 2;
		}
	}
	return totalWeight;
};
mxCoordinateAssignment.prototype.medianXValue = function(connectedCells, rankValue) {
	if (connectedCells.length == 0) {
		return 0;
	}
	var medianValues = [];
	for (var i = 0; i < connectedCells.length; i++) {
		medianValues[i] = connectedCells[i].getGeneralPurposeVariable(rankValue);
	}
	medianValues.sort(MedianCellSorter.prototype.compare);
	if (connectedCells.length % 2 == 1) {
		return medianValues[connectedCells.length / 2];
	} else {
		var medianPoint = connectedCells.length / 2;
		var leftMedian = medianValues[medianPoint - 1];
		var rightMedian = medianValues[medianPoint];
		return ((leftMedian + rightMedian) / 2);
	}
};
mxCoordinateAssignment.prototype.initialCoords = function(facade, model) {
	this.calculateWidestRank(facade, model);
	for (var i = this.widestRank; i >= 0; i--) {
		if (i < model.maxRank) {
			this.rankCoordinates(i, facade, model);
		}
	}
	for (var i = this.widestRank + 1; i <= model.maxRank; i++) {
		if (i > 0) {
			this.rankCoordinates(i, facade, model);
		}
	}
};
mxCoordinateAssignment.prototype.rankCoordinates = function(rankValue, graph, model) {
	var rank = model.ranks[rankValue];
	var maxY = 0.0;
	var localX = this.initialX + (this.widestRankValue - this.rankWidths[rankValue]) / 2;
	var boundsWarning = false;
	for (var i = 0; i < rank.length; i++) {
		var node = rank[i];
		if (node.isVertex()) {
			var bounds = this.layout.getVertexBounds(node.cell);
			if (bounds != null) {
				if (this.orientation == mxConstants.DIRECTION_NORTH || this.orientation == mxConstants.DIRECTION_SOUTH) {
					node.width = bounds.width;
					node.height = bounds.height;
				} else {
					node.width = bounds.height;
					node.height = bounds.width;
				}
			} else {
				boundsWarning = true;
			}
			maxY = Math.max(maxY, node.height);
		} else if (node.isEdge()) {
			var numEdges = 1;
			if (node.edges != null) {
				numEdges = node.edges.length;
			} else {
				mxLog.warn('edge.edges is null');
			}
			node.width = (numEdges - 1) * this.parallelEdgeSpacing;
		}
		localX += node.width / 2.0;
		node.setX(rankValue, localX);
		node.setGeneralPurposeVariable(rankValue, localX);
		localX += node.width / 2.0;
		localX += this.intraCellSpacing;
	}
	if (boundsWarning == true) {
		mxLog.warn('At least one cell has no bounds');
	}
};
mxCoordinateAssignment.prototype.calculateWidestRank = function(graph, model) {
	var y = -this.interRankCellSpacing;
	var lastRankMaxCellHeight = 0.0;
	this.rankWidths = [];
	this.rankY = [];
	for (var rankValue = model.maxRank; rankValue >= 0; rankValue--) {
		var maxCellHeight = 0.0;
		var rank = model.ranks[rankValue];
		var localX = this.initialX;
		var boundsWarning = false;
		for (var i = 0; i < rank.length; i++) {
			var node = rank[i];
			if (node.isVertex()) {
				var bounds = this.layout.getVertexBounds(node.cell);
				if (bounds != null) {
					if (this.orientation == mxConstants.DIRECTION_NORTH || this.orientation == mxConstants.DIRECTION_SOUTH) {
						node.width = bounds.width;
						node.height = bounds.height;
					} else {
						node.width = bounds.height;
						node.height = bounds.width;
					}
				} else {
					boundsWarning = true;
				}
				maxCellHeight = Math.max(maxCellHeight, node.height);
			} else if (node.isEdge()) {
				var numEdges = 1;
				if (node.edges != null) {
					numEdges = node.edges.length;
				} else {
					mxLog.warn('edge.edges is null');
				}
				node.width = (numEdges - 1) * this.parallelEdgeSpacing;
			}
			localX += node.width / 2.0;
			node.setX(rankValue, localX);
			node.setGeneralPurposeVariable(rankValue, localX);
			localX += node.width / 2.0;
			localX += this.intraCellSpacing;
			if (localX > this.widestRankValue) {
				this.widestRankValue = localX;
				this.widestRank = rankValue;
			}
			this.rankWidths[rankValue] = localX;
		}
		if (boundsWarning == true) {
			mxLog.warn('At least one cell has no bounds');
		}
		this.rankY[rankValue] = y;
		var distanceToNextRank = maxCellHeight / 2.0 + lastRankMaxCellHeight / 2.0 + this.interRankCellSpacing;
		lastRankMaxCellHeight = maxCellHeight;
		if (this.orientation == mxConstants.DIRECTION_NORTH || this.orientation == mxConstants.DIRECTION_WEST) {
			y += distanceToNextRank;
		} else {
			y -= distanceToNextRank;
		}
		for (var i = 0; i < rank.length; i++) {
			var cell = rank[i];
			cell.setY(rankValue, y);
		}
	}
};
mxCoordinateAssignment.prototype.minPath = function(graph, model) {
	var edges = model.edgeMapper;
	for (var key in edges) {
		var cell = edges[key];
		var numEdgeLayers = cell.maxRank - cell.minRank - 1;
		var referenceX = cell.getGeneralPurposeVariable(cell.minRank + 1);
		var edgeStraight = true;
		var refSegCount = 0;
		for (var i = cell.minRank + 2; i < cell.maxRank; i++) {
			var x = cell.getGeneralPurposeVariable(i);
			if (referenceX != x) {
				edgeStraight = false;
				referenceX = x;
			} else {
				refSegCount++;
			}
		}
		if (!edgeStraight) {
			var upSegCount = 0;
			var downSegCount = 0;
			var upXPositions = [];
			var downXPositions = [];
			var currentX = cell.getGeneralPurposeVariable(cell.minRank + 1);
			for (var i = cell.minRank + 1; i < cell.maxRank - 1; i++) {
				var nextX = cell.getX(i + 1);
				if (currentX == nextX) {
					upXPositions[i - cell.minRank - 1] = currentX;
					upSegCount++;
				} else if (this.repositionValid(model, cell, i + 1, currentX)) {
					upXPositions[i - cell.minRank - 1] = currentX;
					upSegCount++;
				} else {
					upXPositions[i - cell.minRank - 1] = cell.getX(i);
					currentX = nextX;
				}
			}
			currentX = cell.getX(i);
			for (var i = cell.maxRank - 1; i > cell.minRank + 1; i--) {
				var nextX = cell.getX(i - 1);
				if (currentX == nextX) {
					downXPositions[i - cell.minRank - 2] = currentX;
					downSegCount++;
				} else if (this.repositionValid(model, cell, i - 1, currentX)) {
					downXPositions[i - cell.minRank - 2] = currentX;
					downSegCount++;
				} else {
					downXPositions[i - cell.minRank - 2] = cell.getX(i);
					currentX = nextX;
				}
			}
			if (downSegCount > refSegCount || upSegCount > refSegCount) {
				if (downSegCount > upSegCount) {
					for (var i = cell.maxRank - 2; i > cell.minRank; i--) {
						cell.setX(i, downXPositions[i - cell.minRank - 1]);
					}
				} else if (upSegCount > downSegCount) {
					for (var i = cell.minRank + 2; i < cell.maxRank; i++) {
						cell.setX(i, upXPositions[i - cell.minRank - 2]);
					}
				} else {}
			}
		}
	}
};
mxCoordinateAssignment.prototype.repositionValid = function(model, cell, rank, position) {
	var rankArray = model.ranks[rank];
	var rankIndex = -1;
	for (var i = 0; i < rankArray.length; i++) {
		if (cell == rankArray[i]) {
			rankIndex = i;
			break;
		}
	}
	if (rankIndex < 0) {
		return false;
	}
	var currentX = cell.getGeneralPurposeVariable(rank);
	if (position < currentX) {
		if (rankIndex == 0) {
			return true;
		}
		var leftCell = rankArray[rankIndex - 1];
		var leftLimit = leftCell.getGeneralPurposeVariable(rank);
		leftLimit = leftLimit + leftCell.width / 2 + this.intraCellSpacing + cell.width / 2;
		if (leftLimit <= position) {
			return true;
		} else {
			return false;
		}
	} else if (position > currentX) {
		if (rankIndex == rankArray.length - 1) {
			return true;
		}
		var rightCell = rankArray[rankIndex + 1];
		var rightLimit = rightCell.getGeneralPurposeVariable(rank);
		rightLimit = rightLimit - rightCell.width / 2 - this.intraCellSpacing - cell.width / 2;
		if (rightLimit >= position) {
			return true;
		} else {
			return false;
		}
	}
	return true;
};
mxCoordinateAssignment.prototype.setCellLocations = function(graph, model) {
	this.rankTopY = [];
	this.rankBottomY = [];
	for (var i = 0; i < model.ranks.length; i++) {
		this.rankTopY[i] = Number.MAX_VALUE;
		this.rankBottomY[i] = 0.0;
	}
	var edges = model.edgeMapper;
	var vertices = model.vertexMapper;
	for (var key in vertices) {
		this.setVertexLocation(vertices[key]);
	}
	if (this.edgeStyle == mxHierarchicalEdgeStyle.ORTHOGONAL || this.edgeStyle == mxHierarchicalEdgeStyle.POLYLINE) {
		this.localEdgeProcessing(model);
	}
	for (var key in edges) {
		this.setEdgePosition(edges[key]);
	}
};
mxCoordinateAssignment.prototype.localEdgeProcessing = function(model) {
	var edgeMapping = model.edgeMapper;
	for (var rankIndex = 0; rankIndex < model.ranks.length; rankIndex++) {
		var rank = model.ranks[rankIndex];
		for (var cellIndex = 0; cellIndex < rank.length; cellIndex++) {
			var cell = rank[cellIndex];
			if (cell.isVertex()) {
				var currentCells = cell.getPreviousLayerConnectedCells(rankIndex);
				var currentRank = rankIndex - 1;
				for (var k = 0; k < 2; k++) {
					if (currentRank > -1 && currentRank < model.ranks.length && currentCells != null && currentCells.length > 0) {
						var sortedCells = [];
						for (var j = 0; j < currentCells.length; j++) {
							var sorter = new WeightedCellSorter(currentCells[j], currentCells[j].getX(currentRank));
							sortedCells.push(sorter);
						}
						sortedCells.sort(WeightedCellSorter.prototype.compare);
						var leftLimit = cell.x[0] - cell.width / 2;
						var rightLimit = leftLimit + cell.width;
						var connectedEdgeCount = 0;
						var connectedEdgeGroupCount = 0;
						var connectedEdges = [];
						for (var j = 0; j < sortedCells.length; j++) {
							var innerCell = sortedCells[j].cell;
							var connections;
							if (innerCell.isVertex()) {
								if (k == 0) {
									connections = cell.connectsAsSource;
								} else {
									connections = cell.connectsAsTarget;
								}
								for (var connIndex = 0; connIndex < connections.length; connIndex++) {
									if (connections[connIndex].source == innerCell || connections[connIndex].target == innerCell) {
										connectedEdgeCount += connections[connIndex].edges.length;
										connectedEdgeGroupCount++;
										connectedEdges.push(connections[connIndex]);
									}
								}
							} else {
								connectedEdgeCount += innerCell.edges.length;
								connectedEdgeGroupCount++;
								connectedEdges.push(innerCell);
							}
						}
						var requiredWidth = (connectedEdgeCount + 1) * this.prefHozEdgeSep;
						if (cell.width > requiredWidth + (2 * this.prefHozEdgeSep)) {
							leftLimit += this.prefHozEdgeSep;
							rightLimit -= this.prefHozEdgeSep;
						}
						var availableWidth = rightLimit - leftLimit;
						var edgeSpacing = availableWidth / connectedEdgeCount;
						var currentX = leftLimit + edgeSpacing / 2.0;
						var currentYOffset = this.minEdgeJetty - this.prefVertEdgeOff;
						var maxYOffset = 0;
						for (var j = 0; j < connectedEdges.length; j++) {
							var numActualEdges = connectedEdges[j].edges.length;
							var edgeId = mxCellPath.create(connectedEdges[j].edges[0]);
							var pos = this.jettyPositions[edgeId];
							if (pos == null) {
								pos = [];
								this.jettyPositions[edgeId] = pos;
							}
							if (j < connectedEdgeCount / 2) {
								currentYOffset += this.prefVertEdgeOff;
							} else if (j > connectedEdgeCount / 2) {
								currentYOffset -= this.prefVertEdgeOff;
							}
							for (var m = 0; m < numActualEdges; m++) {
								pos[m * 4 + k * 2] = currentX;
								currentX += edgeSpacing;
								pos[m * 4 + k * 2 + 1] = currentYOffset;
							}
							maxYOffset = Math.max(maxYOffset, currentYOffset);
						}
					}
					currentCells = cell.getNextLayerConnectedCells(rankIndex);
					currentRank = rankIndex + 1;
				}
			}
		}
	}
};
mxCoordinateAssignment.prototype.setEdgePosition = function(cell) {
	var offsetX = 0;
	if (cell.temp[0] != 101207) {
		var maxRank = cell.maxRank;
		var minRank = cell.minRank;
		if (maxRank == minRank) {
			maxRank = cell.source.maxRank;
			minRank = cell.target.minRank;
		}
		var parallelEdgeCount = 0;
		var edgeId = mxCellPath.create(cell.edges[0]);
		var jettys = this.jettyPositions[edgeId];
		for (var i = 0; i < cell.edges.length; i++) {
			var realEdge = cell.edges[i];
			var newPoints = [];
			if (jettys != null) {
				var arrayOffset = cell.isReversed ? 2 : 0;
				var y = cell.isReversed ? this.rankTopY[minRank] : this.rankBottomY[maxRank];
				var jetty = jettys[parallelEdgeCount * 4 + 1 + arrayOffset];
				if (cell.isReversed) {
					jetty = -jetty;
				}
				y += jetty;
				var x = jettys[parallelEdgeCount * 4 + arrayOffset];
				if (this.orientation == mxConstants.DIRECTION_NORTH || this.orientation == mxConstants.DIRECTION_SOUTH) {
					newPoints.push(new mxPoint(x, y));
				} else {
					newPoints.push(new mxPoint(y, x));
				}
			}
			var loopStart = cell.x.length - 1;
			var loopLimit = -1;
			var loopDelta = -1;
			var currentRank = cell.maxRank - 1;
			if (cell.isReversed) {
				loopStart = 0;
				loopLimit = cell.x.length;
				loopDelta = 1;
				currentRank = cell.minRank + 1;
			}
			for (var j = loopStart; (cell.maxRank != cell.minRank) && j != loopLimit; j += loopDelta) {
				var positionX = cell.x[j] + offsetX;
				var topChannelY = (this.rankTopY[currentRank] + this.rankBottomY[currentRank + 1]) / 2.0;
				var bottomChannelY = (this.rankTopY[currentRank - 1] + this.rankBottomY[currentRank]) / 2.0;
				if (cell.isReversed) {
					var tmp = topChannelY;
					topChannelY = bottomChannelY;
					bottomChannelY = tmp;
				}
				if (this.orientation == mxConstants.DIRECTION_NORTH || this.orientation == mxConstants.DIRECTION_SOUTH) {
					newPoints.push(new mxPoint(positionX, topChannelY));
					newPoints.push(new mxPoint(positionX, bottomChannelY));
				} else {
					newPoints.push(new mxPoint(topChannelY, positionX));
					newPoints.push(new mxPoint(bottomChannelY, positionX));
				}
				this.limitX = Math.max(this.limitX, positionX);
				currentRank += loopDelta;
			}
			if (jettys != null) {
				var arrayOffset = cell.isReversed ? 2 : 0;
				var rankY = cell.isReversed ? this.rankBottomY[maxRank] : this.rankTopY[minRank];
				var jetty = jettys[parallelEdgeCount * 4 + 3 - arrayOffset];
				if (cell.isReversed) {
					jetty = -jetty;
				}
				var y = rankY - jetty;
				var x = jettys[parallelEdgeCount * 4 + 2 - arrayOffset];
				if (this.orientation == mxConstants.DIRECTION_NORTH || this.orientation == mxConstants.DIRECTION_SOUTH) {
					newPoints.push(new mxPoint(x, y));
				} else {
					newPoints.push(new mxPoint(y, x));
				}
			}
			if (cell.isReversed) {
				this.processReversedEdge(cell, realEdge);
			}
			this.layout.setEdgePoints(realEdge, newPoints);
			if (offsetX == 0.0) {
				offsetX = this.parallelEdgeSpacing;
			} else if (offsetX > 0) {
				offsetX = -offsetX;
			} else {
				offsetX = -offsetX + this.parallelEdgeSpacing;
			}
			parallelEdgeCount++;
		}
		cell.temp[0] = 101207;
	}
};
mxCoordinateAssignment.prototype.setVertexLocation = function(cell) {
	var realCell = cell.cell;
	var positionX = cell.x[0] - cell.width / 2;
	var positionY = cell.y[0] - cell.height / 2;
	this.rankTopY[cell.minRank] = Math.min(this.rankTopY[cell.minRank], positionY);
	this.rankBottomY[cell.minRank] = Math.max(this.rankBottomY[cell.minRank], positionY + cell.height);
	if (this.orientation == mxConstants.DIRECTION_NORTH || this.orientation == mxConstants.DIRECTION_SOUTH) {
		this.layout.setVertexLocation(realCell, positionX, positionY);
	} else {
		this.layout.setVertexLocation(realCell, positionY, positionX);
	}
	this.limitX = Math.max(this.limitX, positionX + cell.width);
};
mxCoordinateAssignment.prototype.processReversedEdge = function(graph, model) {};
function WeightedCellSorter(cell, weightedValue) {
	this.cell = cell;
	this.weightedValue = weightedValue;
};
WeightedCellSorter.prototype.weightedValue = 0;
WeightedCellSorter.prototype.nudge = false;
WeightedCellSorter.prototype.visited = false;
WeightedCellSorter.prototype.rankIndex = null;
WeightedCellSorter.prototype.cell = null;
WeightedCellSorter.prototype.compare = function(a, b) {
	if (a != null && b != null) {
		if (b.weightedValue > a.weightedValue) {
			return - 1;
		} else if (b.weightedValue < a.weightedValue) {
			return 1;
		} else {
			if (b.nudge) {
				return - 1;
			} else {
				return 1;
			}
		}
	} else {
		return 0;
	}
};
function mxHierarchicalLayout(graph, orientation, deterministic) {
	mxGraphLayout.call(this, graph);
	this.orientation = (orientation != null) ? orientation: mxConstants.DIRECTION_NORTH;
	this.deterministic = (deterministic != null) ? deterministic: true;
};
mxHierarchicalLayout.prototype = new mxGraphLayout();
mxHierarchicalLayout.prototype.constructor = mxHierarchicalLayout;
mxHierarchicalLayout.prototype.roots = null;
mxHierarchicalLayout.prototype.resizeParent = false;
mxHierarchicalLayout.prototype.moveParent = false;
mxHierarchicalLayout.prototype.parentBorder = 0;
mxHierarchicalLayout.prototype.intraCellSpacing = 30;
mxHierarchicalLayout.prototype.interRankCellSpacing = 50;
mxHierarchicalLayout.prototype.interHierarchySpacing = 60;
mxHierarchicalLayout.prototype.parallelEdgeSpacing = 10;
mxHierarchicalLayout.prototype.orientation = mxConstants.DIRECTION_NORTH;
mxHierarchicalLayout.prototype.fineTuning = true;
mxHierarchicalLayout.prototype.deterministic;
mxHierarchicalLayout.prototype.fixRoots = false;
mxHierarchicalLayout.prototype.layoutFromSinks = true;
mxHierarchicalLayout.prototype.tightenToSource = true;
mxHierarchicalLayout.prototype.disableEdgeStyle = true;
mxHierarchicalLayout.prototype.model = null;
mxHierarchicalLayout.prototype.getModel = function() {
	return this.model;
};
mxHierarchicalLayout.prototype.execute = function(parent, roots) {
	if (roots == null) {
		roots = this.graph.findTreeRoots(parent);
	}
	this.roots = roots;
	if (this.roots != null) {
		var model = this.graph.getModel();
		model.beginUpdate();
		try {
			this.run(parent);
			if (this.resizeParent && !this.graph.isCellCollapsed(parent)) {
				this.graph.updateGroupBounds([parent], this.parentBorder, this.moveParent);
			}
		} finally {
			model.endUpdate();
		}
	}
};
mxHierarchicalLayout.prototype.run = function(parent) {
	var hierarchyVertices = [];
	var fixedRoots = null;
	var rootLocations = null;
	var affectedEdges = null;
	if (this.fixRoots) {
		fixedRoots = [];
		rootLocations = [];
		affectedEdges = [];
	}
	for (var i = 0; i < this.roots.length; i++) {
		var newHierarchy = true;
		for (var j = 0; newHierarchy && j < hierarchyVertices.length; j++) {
			var rootId = mxCellPath.create(this.roots[i]);
			if (hierarchyVertices[j][rootId] != null) {
				newHierarchy = false;
			}
		}
		if (newHierarchy) {
			var cellsStack = [];
			cellsStack.push(this.roots[i]);
			var edgeSet = null;
			if (this.fixRoots) {
				fixedRoots.push(this.roots[i]);
				var location = this.getVertexBounds(this.roots[i]).getPoint();
				rootLocations.push(location);
				edgeSet = [];
			}
			var vertexSet = new Object();
			while (cellsStack.length > 0) {
				var cell = cellsStack.shift();
				var cellId = mxCellPath.create(cell);
				if (vertexSet[cellId] == null) {
					vertexSet[cellId] = cell;
					if (this.fixRoots) {
						var tmp = this.graph.getIncomingEdges(cell, parent);
						for (var k = 0; k < tmp.length; k++) {
							edgeSet.push(tmp[k]);
						}
					}
					var conns = this.graph.getConnections(cell, parent);
					var cells = this.graph.getOpposites(conns, cell);
					for (var k = 0; k < cells.length; k++) {
						var tmpId = mxCellPath.create(cells[k]);
						if (vertexSet[tmpId] == null) {
							cellsStack.push(cells[k]);
						}
					}
				}
			}
			hierarchyVertices.push(vertexSet);
			if (this.fixRoots) {
				affectedEdges.push(edgeSet);
			}
		}
	}
	var initialX = 0;
	for (var i = 0; i < hierarchyVertices.length; i++) {
		var vertexSet = hierarchyVertices[i];
		var tmp = [];
		for (var key in vertexSet) {
			tmp.push(vertexSet[key]);
		}
		this.model = new mxGraphHierarchyModel(this, tmp, this.roots, parent, false, this.deterministic, this.tightenToSource, this.layoutFromSinks);
		this.cycleStage(parent);
		this.layeringStage();
		this.crossingStage(parent);
		initialX = this.placementStage(initialX, parent);
		if (this.fixRoots) {
			var root = fixedRoots[i];
			var oldLocation = rootLocations[i];
			var newLocation = this.getVertexBounds(root).getPoint();
			var diffX = oldLocation.x - newLocation.x;
			var diffY = oldLocation.y - newLocation.y;
			this.graph.moveCells(vertexSet, diffX, diffY);
			var connectedEdges = affectedEdges[i + 1];
			this.graph.moveCells(connectedEdges, diffX, diffY);
		}
	}
};
mxHierarchicalLayout.prototype.cycleStage = function(parent) {
	var cycleStage = new mxMinimumCycleRemover(this);
	cycleStage.execute(parent);
};
mxHierarchicalLayout.prototype.layeringStage = function() {
	this.model.initialRank();
	this.model.fixRanks();
};
mxHierarchicalLayout.prototype.crossingStage = function(parent) {
	var crossingStage = new mxMedianHybridCrossingReduction(this);
	crossingStage.execute(parent);
};
mxHierarchicalLayout.prototype.placementStage = function(initialX, parent) {
	var placementStage = new mxCoordinateAssignment(this, this.intraCellSpacing, this.interRankCellSpacing, this.orientation, initialX, this.parallelEdgeSpacing);
	placementStage.fineTuning = this.fineTuning;
	placementStage.execute(parent);
	return placementStage.limitX + this.interHierarchySpacing;
};
function mxGraphModel(root) {
	this.currentEdit = this.createUndoableEdit();
	if (root != null) {
		this.setRoot(root);
	} else {
		this.clear();
	}
};
mxGraphModel.prototype = new mxEventSource();
mxGraphModel.prototype.constructor = mxGraphModel;
mxGraphModel.prototype.root = null;
mxGraphModel.prototype.cells = null;
mxGraphModel.prototype.maintainEdgeParent = true;
mxGraphModel.prototype.createIds = true;
mxGraphModel.prototype.prefix = '';
mxGraphModel.prototype.postfix = '';
mxGraphModel.prototype.nextId = 0;
mxGraphModel.prototype.currentEdit = null;
mxGraphModel.prototype.updateLevel = 0;
mxGraphModel.prototype.endingUpdate = false;
mxGraphModel.prototype.clear = function() {
	this.setRoot(this.createRoot());
};
mxGraphModel.prototype.isCreateIds = function() {
	return this.createIds;
};
mxGraphModel.prototype.setCreateIds = function(value) {
	this.createIds = value;
};
mxGraphModel.prototype.createRoot = function() {
	var cell = new mxCell();
	cell.insert(new mxCell());
	return cell;
};
mxGraphModel.prototype.getCell = function(id) {
	return (this.cells != null) ? this.cells[id] : null;
};
mxGraphModel.prototype.filterCells = function(cells, filter) {
	var result = null;
	if (cells != null) {
		result = [];
		for (var i = 0; i < cells.length; i++) {
			if (filter(cells[i])) {
				result.push(cells[i]);
			}
		}
	}
	return result;
};
mxGraphModel.prototype.getDescendants = function(parent) {
	return this.filterDescendants(null, parent);
};
mxGraphModel.prototype.filterDescendants = function(filter, parent) {
	var result = [];
	parent = parent || this.getRoot();
	if (filter == null || filter(parent)) {
		result.push(parent);
	}
	var childCount = this.getChildCount(parent);
	for (var i = 0; i < childCount; i++) {
		var child = this.getChildAt(parent, i);
		result = result.concat(this.filterDescendants(filter, child));
	}
	return result;
};
mxGraphModel.prototype.getRoot = function(cell) {
	var root = cell || this.root;
	if (cell != null) {
		while (cell != null) {
			root = cell;
			cell = this.getParent(cell);
		}
	}
	return root;
};
mxGraphModel.prototype.setRoot = function(root) {
	this.execute(new mxRootChange(this, root));
	return root;
};
mxGraphModel.prototype.rootChanged = function(root) {
	var oldRoot = this.root;
	this.root = root;
	this.nextId = 0;
	this.cells = null;
	this.cellAdded(root);
	return oldRoot;
};
mxGraphModel.prototype.isRoot = function(cell) {
	return cell != null && this.root == cell;
};
mxGraphModel.prototype.isLayer = function(cell) {
	return this.isRoot(this.getParent(cell));
};
mxGraphModel.prototype.isAncestor = function(parent, child) {
	while (child != null && child != parent) {
		child = this.getParent(child);
	}
	return child == parent;
};
mxGraphModel.prototype.contains = function(cell) {
	return this.isAncestor(this.root, cell);
};
mxGraphModel.prototype.getParent = function(cell) {
	return (cell != null) ? cell.getParent() : null;
};
mxGraphModel.prototype.add = function(parent, child, index) {
	if (child != parent && parent != null && child != null) {
		if (index == null) {
			index = this.getChildCount(parent);
		}
		var parentChanged = parent != this.getParent(child);
		this.execute(new mxChildChange(this, parent, child, index));
		if (this.maintainEdgeParent && parentChanged) {
			this.updateEdgeParents(child);
		}
	}
	return child;
};
mxGraphModel.prototype.cellAdded = function(cell) {
	if (cell != null) {
		if (cell.getId() == null && this.createIds) {
			cell.setId(this.createId(cell));
		}
		if (cell.getId() != null) {
			var collision = this.getCell(cell.getId());
			if (collision != cell) {
				while (collision != null) {
					cell.setId(this.createId(cell));
					collision = this.getCell(cell.getId());
				}
				if (this.cells == null) {
					this.cells = new Object();
				}
				this.cells[cell.getId()] = cell;
			}
		}
		if (mxUtils.isNumeric(cell.getId())) {
			this.nextId = Math.max(this.nextId, cell.getId());
		}
		var childCount = this.getChildCount(cell);
		for (var i = 0; i < childCount; i++) {
			this.cellAdded(this.getChildAt(cell, i));
		}
	}
};
mxGraphModel.prototype.createId = function(cell) {
	var id = this.nextId;
	this.nextId++;
	return this.prefix + id + this.postfix;
};
mxGraphModel.prototype.updateEdgeParents = function(cell, root) {
	root = root || this.getRoot(cell);
	var childCount = this.getChildCount(cell);
	for (var i = 0; i < childCount; i++) {
		var child = this.getChildAt(cell, i);
		this.updateEdgeParents(child, root);
	}
	var edgeCount = this.getEdgeCount(cell);
	var edges = [];
	for (var i = 0; i < edgeCount; i++) {
		edges.push(this.getEdgeAt(cell, i));
	}
	for (var i = 0; i < edges.length; i++) {
		var edge = edges[i];
		if (this.isAncestor(root, edge)) {
			this.updateEdgeParent(edge, root);
		}
	}
};
mxGraphModel.prototype.updateEdgeParent = function(edge, root) {
	var source = this.getTerminal(edge, true);
	var target = this.getTerminal(edge, false);
	var cell = null;
	while (source != null && !this.isEdge(source) && source.geometry != null && source.geometry.relative) {
		source = this.getParent(source);
	}
	while (target != null && !this.isEdge(target) && target.geometry != null && target.geometry.relative) {
		target = this.getParent(target);
	}
	if (this.isAncestor(root, source) && this.isAncestor(root, target)) {
		if (source == target) {
			cell = this.getParent(source);
		} else {
			cell = this.getNearestCommonAncestor(source, target);
		}
		if (cell != null && (this.getParent(cell) != this.root || this.isAncestor(cell, edge)) && this.getParent(edge) != cell) {
			var geo = this.getGeometry(edge);
			if (geo != null) {
				var origin1 = this.getOrigin(this.getParent(edge));
				var origin2 = this.getOrigin(cell);
				var dx = origin2.x - origin1.x;
				var dy = origin2.y - origin1.y;
				geo = geo.clone();
				geo.translate( - dx, -dy);
				this.setGeometry(edge, geo);
			}
			this.add(cell, edge, this.getChildCount(cell));
		}
	}
};
mxGraphModel.prototype.getOrigin = function(cell) {
	var result = null;
	if (cell != null) {
		result = this.getOrigin(this.getParent(cell));
		if (!this.isEdge(cell)) {
			var geo = this.getGeometry(cell);
			if (geo != null) {
				result.x += geo.x;
				result.y += geo.y;
			}
		}
	} else {
		result = new mxPoint();
	}
	return result;
};
mxGraphModel.prototype.getNearestCommonAncestor = function(cell1, cell2) {
	if (cell1 != null && cell2 != null) {
		var path = mxCellPath.create(cell2);
		if (path != null && path.length > 0) {
			var cell = cell1;
			var current = mxCellPath.create(cell);
			if (path.length < current.length) {
				cell = cell2;
				var tmp = current;
				current = path;
				path = tmp;
			}
			while (cell != null) {
				var parent = this.getParent(cell);
				if (path.indexOf(current + mxCellPath.PATH_SEPARATOR) == 0 && parent != null) {
					return cell;
				}
				current = mxCellPath.getParentPath(current);
				cell = parent;
			}
		}
	}
	return null;
};
mxGraphModel.prototype.remove = function(cell) {
	if (cell == this.root) {
		this.setRoot(null);
	} else if (this.getParent(cell) != null) {
		this.execute(new mxChildChange(this, null, cell));
	}
	return cell;
};
mxGraphModel.prototype.cellRemoved = function(cell) {
	if (cell != null && this.cells != null) {
		var childCount = this.getChildCount(cell);
		for (var i = childCount - 1; i >= 0; i--) {
			this.cellRemoved(this.getChildAt(cell, i));
		}
		if (this.cells != null && cell.getId() != null) {
			delete this.cells[cell.getId()];
		}
	}
};
mxGraphModel.prototype.parentForCellChanged = function(cell, parent, index) {
	var previous = this.getParent(cell);
	if (parent != null) {
		if (parent != previous || previous.getIndex(cell) != index) {
			parent.insert(cell, index);
		}
	} else if (previous != null) {
		var oldIndex = previous.getIndex(cell);
		previous.remove(oldIndex);
	}
	if (!this.contains(previous) && parent != null) {
		this.cellAdded(cell);
	} else if (parent == null) {
		this.cellRemoved(cell);
	}
	return previous;
};
mxGraphModel.prototype.getChildCount = function(cell) {
	return (cell != null) ? cell.getChildCount() : 0;
};
mxGraphModel.prototype.getChildAt = function(cell, index) {
	return (cell != null) ? cell.getChildAt(index) : null;
};
mxGraphModel.prototype.getChildren = function(cell) {
	return (cell != null) ? cell.children: null;
};
mxGraphModel.prototype.getChildVertices = function(parent) {
	return this.getChildCells(parent, true, false);
};
mxGraphModel.prototype.getChildEdges = function(parent) {
	return this.getChildCells(parent, false, true);
};
mxGraphModel.prototype.getChildCells = function(parent, vertices, edges) {
	vertices = (vertices != null) ? vertices: false;
	edges = (edges != null) ? edges: false;
	var childCount = this.getChildCount(parent);
	var result = [];
	for (var i = 0; i < childCount; i++) {
		var child = this.getChildAt(parent, i);
		if ((!edges && !vertices) || (edges && this.isEdge(child)) || (vertices && this.isVertex(child))) {
			result.push(child);
		}
	}
	return result;
};
mxGraphModel.prototype.getTerminal = function(edge, isSource) {
	return (edge != null) ? edge.getTerminal(isSource) : null;
};
mxGraphModel.prototype.setTerminal = function(edge, terminal, isSource) {
	var terminalChanged = terminal != this.getTerminal(edge, isSource);
	this.execute(new mxTerminalChange(this, edge, terminal, isSource));
	if (this.maintainEdgeParent && terminalChanged) {
		this.updateEdgeParent(edge, this.getRoot());
	}
	return terminal;
};
mxGraphModel.prototype.setTerminals = function(edge, source, target) {
	this.beginUpdate();
	try {
		this.setTerminal(edge, source, true);
		this.setTerminal(edge, target, false);
	} finally {
		this.endUpdate();
	}
};
mxGraphModel.prototype.terminalForCellChanged = function(edge, terminal, isSource) {
	var previous = this.getTerminal(edge, isSource);
	if (terminal != null) {
		terminal.insertEdge(edge, isSource);
	} else if (previous != null) {
		previous.removeEdge(edge, isSource);
	}
	return previous;
};
mxGraphModel.prototype.getEdgeCount = function(cell) {
	return (cell != null) ? cell.getEdgeCount() : 0;
};
mxGraphModel.prototype.getEdgeAt = function(cell, index) {
	return (cell != null) ? cell.getEdgeAt(index) : null;
};
mxGraphModel.prototype.getDirectedEdgeCount = function(cell, outgoing, ignoredEdge) {
	var count = 0;
	var edgeCount = this.getEdgeCount(cell);
	for (var i = 0; i < edgeCount; i++) {
		var edge = this.getEdgeAt(cell, i);
		if (edge != ignoredEdge && this.getTerminal(edge, outgoing) == cell) {
			count++;
		}
	}
	return count;
};
mxGraphModel.prototype.getConnections = function(cell) {
	return this.getEdges(cell, true, true, false);
};
mxGraphModel.prototype.getIncomingEdges = function(cell) {
	return this.getEdges(cell, true, false, false);
};
mxGraphModel.prototype.getOutgoingEdges = function(cell) {
	return this.getEdges(cell, false, true, false);
};
mxGraphModel.prototype.getEdges = function(cell, incoming, outgoing, includeLoops) {
	incoming = (incoming != null) ? incoming: true;
	outgoing = (outgoing != null) ? outgoing: true;
	includeLoops = (includeLoops != null) ? includeLoops: true;
	var edgeCount = this.getEdgeCount(cell);
	var result = [];
	for (var i = 0; i < edgeCount; i++) {
		var edge = this.getEdgeAt(cell, i);
		var source = this.getTerminal(edge, true);
		var target = this.getTerminal(edge, false);
		if ((includeLoops && source == target) || ((source != target) && ((incoming && target == cell) || (outgoing && source == cell)))) {
			result.push(edge);
		}
	}
	return result;
};
mxGraphModel.prototype.getEdgesBetween = function(source, target, directed) {
	directed = (directed != null) ? directed: false;
	var tmp1 = this.getEdgeCount(source);
	var tmp2 = this.getEdgeCount(target);
	var terminal = source;
	var edgeCount = tmp1;
	if (tmp2 < tmp1) {
		edgeCount = tmp2;
		terminal = target;
	}
	var result = [];
	for (var i = 0; i < edgeCount; i++) {
		var edge = this.getEdgeAt(terminal, i);
		var src = this.getTerminal(edge, true);
		var trg = this.getTerminal(edge, false);
		var directedMatch = (src == source) && (trg == target);
		var oppositeMatch = (trg == source) && (src == target);
		if (directedMatch || (!directed && oppositeMatch)) {
			result.push(edge);
		}
	}
	return result;
};
mxGraphModel.prototype.getOpposites = function(edges, terminal, sources, targets) {
	sources = (sources != null) ? sources: true;
	targets = (targets != null) ? targets: true;
	var terminals = [];
	if (edges != null) {
		for (var i = 0; i < edges.length; i++) {
			var source = this.getTerminal(edges[i], true);
			var target = this.getTerminal(edges[i], false);
			if (source == terminal && target != null && target != terminal && targets) {
				terminals.push(target);
			} else if (target == terminal && source != null && source != terminal && sources) {
				terminals.push(source);
			}
		}
	}
	return terminals;
};
mxGraphModel.prototype.getTopmostCells = function(cells) {
	var tmp = [];
	for (var i = 0; i < cells.length; i++) {
		var cell = cells[i];
		var topmost = true;
		var parent = this.getParent(cell);
		while (parent != null) {
			if (mxUtils.indexOf(cells, parent) >= 0) {
				topmost = false;
				break;
			}
			parent = this.getParent(parent);
		}
		if (topmost) {
			tmp.push(cell);
		}
	}
	return tmp;
};
mxGraphModel.prototype.isVertex = function(cell) {
	return (cell != null) ? cell.isVertex() : false;
};
mxGraphModel.prototype.isEdge = function(cell) {
	return (cell != null) ? cell.isEdge() : false;
};
mxGraphModel.prototype.isConnectable = function(cell) {
	return (cell != null) ? cell.isConnectable() : false;
};
mxGraphModel.prototype.getValue = function(cell) {
	return (cell != null) ? cell.getValue() : null;
};
mxGraphModel.prototype.setValue = function(cell, value) {
	this.execute(new mxValueChange(this, cell, value));
	return value;
};
mxGraphModel.prototype.valueForCellChanged = function(cell, value) {
	return cell.valueChanged(value);
};
mxGraphModel.prototype.getGeometry = function(cell, geometry) {
	return (cell != null) ? cell.getGeometry() : null;
};
mxGraphModel.prototype.setGeometry = function(cell, geometry) {
	if (geometry != this.getGeometry(cell)) {
		this.execute(new mxGeometryChange(this, cell, geometry));
	}
	return geometry;
};
mxGraphModel.prototype.geometryForCellChanged = function(cell, geometry) {
	var previous = this.getGeometry(cell);
	cell.setGeometry(geometry);
	return previous;
};
mxGraphModel.prototype.getStyle = function(cell) {
	return (cell != null) ? cell.getStyle() : null;
};
mxGraphModel.prototype.setStyle = function(cell, style) {
	if (style != this.getStyle(cell)) {
		this.execute(new mxStyleChange(this, cell, style));
	}
	return style;
};
mxGraphModel.prototype.styleForCellChanged = function(cell, style) {
	var previous = this.getStyle(cell);
	cell.setStyle(style);
	return previous;
};
mxGraphModel.prototype.isCollapsed = function(cell) {
	return (cell != null) ? cell.isCollapsed() : false;
};
mxGraphModel.prototype.setCollapsed = function(cell, collapsed) {
	if (collapsed != this.isCollapsed(cell)) {
		this.execute(new mxCollapseChange(this, cell, collapsed));
	}
	return collapsed;
};
mxGraphModel.prototype.collapsedStateForCellChanged = function(cell, collapsed) {
	var previous = this.isCollapsed(cell);
	cell.setCollapsed(collapsed);
	return previous;
};
mxGraphModel.prototype.isVisible = function(cell) {
	return (cell != null) ? cell.isVisible() : false;
};
mxGraphModel.prototype.setVisible = function(cell, visible) {
	if (visible != this.isVisible(cell)) {
		this.execute(new mxVisibleChange(this, cell, visible));
	}
	return visible;
};
mxGraphModel.prototype.visibleStateForCellChanged = function(cell, visible) {
	var previous = this.isVisible(cell);
	cell.setVisible(visible);
	return previous;
};
mxGraphModel.prototype.execute = function(change) {
	change.execute();
	this.beginUpdate();
	this.currentEdit.add(change);
	this.fireEvent(new mxEventObject(mxEvent.EXECUTE, 'change', change));
	this.endUpdate();
};
mxGraphModel.prototype.beginUpdate = function() {
	this.updateLevel++;
	this.fireEvent(new mxEventObject(mxEvent.BEGIN_UPDATE));
};
mxGraphModel.prototype.endUpdate = function() {
	this.updateLevel--;
	if (!this.endingUpdate) {
		this.endingUpdate = this.updateLevel == 0;
		this.fireEvent(new mxEventObject(mxEvent.END_UPDATE, 'edit', this.currentEdit));
		try {
			if (this.endingUpdate && !this.currentEdit.isEmpty()) {
				this.fireEvent(new mxEventObject(mxEvent.BEFORE_UNDO, 'edit', this.currentEdit));
				var tmp = this.currentEdit;
				this.currentEdit = this.createUndoableEdit();
				tmp.notify();
				this.fireEvent(new mxEventObject(mxEvent.UNDO, 'edit', tmp));
			}
		} finally {
			this.endingUpdate = false;
		}
	}
};
mxGraphModel.prototype.createUndoableEdit = function() {
	var edit = new mxUndoableEdit(this, true);
	edit.notify = function() {
		edit.source.fireEvent(new mxEventObject(mxEvent.CHANGE, 'edit', edit, 'changes', edit.changes));
		edit.source.fireEvent(new mxEventObject(mxEvent.NOTIFY, 'edit', edit, 'changes', edit.changes));
	};
	return edit;
};
mxGraphModel.prototype.mergeChildren = function(from, to, cloneAllEdges) {
	cloneAllEdges = (cloneAllEdges != null) ? cloneAllEdges: true;
	this.beginUpdate();
	try {
		var mapping = new Object();
		this.mergeChildrenImpl(from, to, cloneAllEdges, mapping);
		for (var key in mapping) {
			var cell = mapping[key];
			var terminal = this.getTerminal(cell, true);
			if (terminal != null) {
				terminal = mapping[mxCellPath.create(terminal)];
				this.setTerminal(cell, terminal, true);
			}
			terminal = this.getTerminal(cell, false);
			if (terminal != null) {
				terminal = mapping[mxCellPath.create(terminal)];
				this.setTerminal(cell, terminal, false);
			}
		}
	} finally {
		this.endUpdate();
	}
};
mxGraphModel.prototype.mergeChildrenImpl = function(from, to, cloneAllEdges, mapping) {
	this.beginUpdate();
	try {
		var childCount = from.getChildCount();
		for (var i = 0; i < childCount; i++) {
			var cell = from.getChildAt(i);
			if (typeof(cell.getId) == 'function') {
				var id = cell.getId();
				var target = (id != null && (!this.isEdge(cell) || !cloneAllEdges)) ? this.getCell(id) : null;
				if (target == null) {
					var clone = cell.clone();
					clone.setId(id);
					clone.setTerminal(cell.getTerminal(true), true);
					clone.setTerminal(cell.getTerminal(false), false);
					target = to.insert(clone);
					this.cellAdded(target);
				}
				mapping[mxCellPath.create(cell)] = target;
				this.mergeChildrenImpl(cell, target, cloneAllEdges, mapping);
			}
		}
	} finally {
		this.endUpdate();
	}
};
mxGraphModel.prototype.getParents = function(cells) {
	var parents = [];
	if (cells != null) {
		var hash = new Object();
		for (var i = 0; i < cells.length; i++) {
			var parent = this.getParent(cells[i]);
			if (parent != null) {
				var id = mxCellPath.create(parent);
				if (hash[id] == null) {
					hash[id] = parent;
					parents.push(parent);
				}
			}
		}
	}
	return parents;
};
mxGraphModel.prototype.cloneCell = function(cell) {
	if (cell != null) {
		return this.cloneCells([cell], true)[0];
	}
	return null;
};
mxGraphModel.prototype.cloneCells = function(cells, includeChildren) {
	var mapping = new Object();
	var clones = [];
	for (var i = 0; i < cells.length; i++) {
		if (cells[i] != null) {
			clones.push(this.cloneCellImpl(cells[i], mapping, includeChildren));
		} else {
			clones.push(null);
		}
	}
	for (var i = 0; i < clones.length; i++) {
		if (clones[i] != null) {
			this.restoreClone(clones[i], cells[i], mapping);
		}
	}
	return clones;
};
mxGraphModel.prototype.cloneCellImpl = function(cell, mapping, includeChildren) {
	var clone = this.cellCloned(cell);
	mapping[mxObjectIdentity.get(cell)] = clone;
	if (includeChildren) {
		var childCount = this.getChildCount(cell);
		for (var i = 0; i < childCount; i++) {
			var cloneChild = this.cloneCellImpl(this.getChildAt(cell, i), mapping, true);
			clone.insert(cloneChild);
		}
	}
	return clone;
};
mxGraphModel.prototype.cellCloned = function(cell) {
	return cell.clone();
};
mxGraphModel.prototype.restoreClone = function(clone, cell, mapping) {
	var source = this.getTerminal(cell, true);
	if (source != null) {
		var tmp = mapping[mxObjectIdentity.get(source)];
		if (tmp != null) {
			tmp.insertEdge(clone, true);
		}
	}
	var target = this.getTerminal(cell, false);
	if (target != null) {
		var tmp = mapping[mxObjectIdentity.get(target)];
		if (tmp != null) {
			tmp.insertEdge(clone, false);
		}
	}
	var childCount = this.getChildCount(clone);
	for (var i = 0; i < childCount; i++) {
		this.restoreClone(this.getChildAt(clone, i), this.getChildAt(cell, i), mapping);
	}
};
function mxRootChange(model, root) {
	this.model = model;
	this.root = root;
	this.previous = root;
};
mxRootChange.prototype.execute = function() {
	this.root = this.previous;
	this.previous = this.model.rootChanged(this.previous);
};
function mxChildChange(model, parent, child, index) {
	this.model = model;
	this.parent = parent;
	this.previous = parent;
	this.child = child;
	this.index = index;
	this.previousIndex = index;
};
mxChildChange.prototype.execute = function() {
	var tmp = this.model.getParent(this.child);
	var tmp2 = (tmp != null) ? tmp.getIndex(this.child) : 0;
	if (this.previous == null) {
		this.connect(this.child, false);
	}
	tmp = this.model.parentForCellChanged(this.child, this.previous, this.previousIndex);
	if (this.previous != null) {
		this.connect(this.child, true);
	}
	this.parent = this.previous;
	this.previous = tmp;
	this.index = this.previousIndex;
	this.previousIndex = tmp2;
};
mxChildChange.prototype.connect = function(cell, isConnect) {
	isConnect = (isConnect != null) ? isConnect: true;
	var source = cell.getTerminal(true);
	var target = cell.getTerminal(false);
	if (source != null) {
		if (isConnect) {
			this.model.terminalForCellChanged(cell, source, true);
		} else {
			this.model.terminalForCellChanged(cell, null, true);
		}
	}
	if (target != null) {
		if (isConnect) {
			this.model.terminalForCellChanged(cell, target, false);
		} else {
			this.model.terminalForCellChanged(cell, null, false);
		}
	}
	cell.setTerminal(source, true);
	cell.setTerminal(target, false);
	var childCount = this.model.getChildCount(cell);
	for (var i = 0; i < childCount; i++) {
		this.connect(this.model.getChildAt(cell, i), isConnect);
	}
};
function mxTerminalChange(model, cell, terminal, source) {
	this.model = model;
	this.cell = cell;
	this.terminal = terminal;
	this.previous = terminal;
	this.source = source;
};
mxTerminalChange.prototype.execute = function() {
	this.terminal = this.previous;
	this.previous = this.model.terminalForCellChanged(this.cell, this.previous, this.source);
};
function mxValueChange(model, cell, value) {
	this.model = model;
	this.cell = cell;
	this.value = value;
	this.previous = value;
};
mxValueChange.prototype.execute = function() {
	this.value = this.previous;
	this.previous = this.model.valueForCellChanged(this.cell, this.previous);
};
function mxStyleChange(model, cell, style) {
	this.model = model;
	this.cell = cell;
	this.style = style;
	this.previous = style;
};
mxStyleChange.prototype.execute = function() {
	this.style = this.previous;
	this.previous = this.model.styleForCellChanged(this.cell, this.previous);
};
function mxGeometryChange(model, cell, geometry) {
	this.model = model;
	this.cell = cell;
	this.geometry = geometry;
	this.previous = geometry;
};
mxGeometryChange.prototype.execute = function() {
	this.geometry = this.previous;
	this.previous = this.model.geometryForCellChanged(this.cell, this.previous);
};
function mxCollapseChange(model, cell, collapsed) {
	this.model = model;
	this.cell = cell;
	this.collapsed = collapsed;
	this.previous = collapsed;
};
mxCollapseChange.prototype.execute = function() {
	this.collapsed = this.previous;
	this.previous = this.model.collapsedStateForCellChanged(this.cell, this.previous);
};
function mxVisibleChange(model, cell, visible) {
	this.model = model;
	this.cell = cell;
	this.visible = visible;
	this.previous = visible;
};
mxVisibleChange.prototype.execute = function() {
	this.visible = this.previous;
	this.previous = this.model.visibleStateForCellChanged(this.cell, this.previous);
};
function mxCellAttributeChange(cell, attribute, value) {
	this.cell = cell;
	this.attribute = attribute;
	this.value = value;
	this.previous = value;
};
mxCellAttributeChange.prototype.execute = function() {
	var tmp = this.cell.getAttribute(this.attribute);
	if (this.previous == null) {
		this.cell.value.removeAttribute(this.attribute);
	} else {
		this.cell.setAttribute(this.attribute, this.previous);
	}
	this.previous = tmp;
};
function mxCell(value, geometry, style) {
	this.value = value;
	this.setGeometry(geometry);
	this.setStyle(style);
	if (this.onInit != null) {
		this.onInit();
	}
};
mxCell.prototype.id = null;
mxCell.prototype.value = null;
mxCell.prototype.geometry = null;
mxCell.prototype.style = null;
mxCell.prototype.vertex = false;
mxCell.prototype.edge = false;
mxCell.prototype.connectable = true;
mxCell.prototype.visible = true;
mxCell.prototype.collapsed = false;
mxCell.prototype.parent = null;
mxCell.prototype.source = null;
mxCell.prototype.target = null;
mxCell.prototype.children = null;
mxCell.prototype.edges = null;
mxCell.prototype.mxTransient = ['id', 'value', 'parent', 'source', 'target', 'children', 'edges'];
mxCell.prototype.getId = function() {
	return this.id;
};
mxCell.prototype.setId = function(id) {
	this.id = id;
};
mxCell.prototype.getValue = function() {
	return this.value;
};
mxCell.prototype.setValue = function(value) {
	this.value = value;
};
mxCell.prototype.valueChanged = function(newValue) {
	var previous = this.getValue();
	this.setValue(newValue);
	return previous;
};
mxCell.prototype.getGeometry = function() {
	return this.geometry;
};
mxCell.prototype.setGeometry = function(geometry) {
	this.geometry = geometry;
};
mxCell.prototype.getStyle = function() {
	return this.style;
};
mxCell.prototype.setStyle = function(style) {
	this.style = style;
};
mxCell.prototype.isVertex = function() {
	return this.vertex;
};
mxCell.prototype.setVertex = function(vertex) {
	this.vertex = vertex;
};
mxCell.prototype.isEdge = function() {
	return this.edge;
};
mxCell.prototype.setEdge = function(edge) {
	this.edge = edge;
};
mxCell.prototype.isConnectable = function() {
	return this.connectable;
};
mxCell.prototype.setConnectable = function(connectable) {
	this.connectable = connectable;
};
mxCell.prototype.isVisible = function() {
	return this.visible;
};
mxCell.prototype.setVisible = function(visible) {
	this.visible = visible;
};
mxCell.prototype.isCollapsed = function() {
	return this.collapsed;
};
mxCell.prototype.setCollapsed = function(collapsed) {
	this.collapsed = collapsed;
};
mxCell.prototype.getParent = function() {
	return this.parent;
};
mxCell.prototype.setParent = function(parent) {
	this.parent = parent;
};
mxCell.prototype.getTerminal = function(source) {
	return (source) ? this.source: this.target;
};
mxCell.prototype.setTerminal = function(terminal, isSource) {
	if (isSource) {
		this.source = terminal;
	} else {
		this.target = terminal;
	}
	return terminal;
};
mxCell.prototype.getChildCount = function() {
	return (this.children == null) ? 0 : this.children.length;
};
mxCell.prototype.getIndex = function(child) {
	return mxUtils.indexOf(this.children, child);
};
mxCell.prototype.getChildAt = function(index) {
	return (this.children == null) ? null: this.children[index];
};
mxCell.prototype.insert = function(child, index) {
	if (child != null) {
		if (index == null) {
			index = this.getChildCount();
			if (child.getParent() == this) {
				index--;
			}
		}
		child.removeFromParent();
		child.setParent(this);
		if (this.children == null) {
			this.children = [];
			this.children.push(child);
		} else {
			this.children.splice(index, 0, child);
		}
	}
	return child;
};
mxCell.prototype.remove = function(index) {
	var child = null;
	if (this.children != null && index >= 0) {
		child = this.getChildAt(index);
		if (child != null) {
			this.children.splice(index, 1);
			child.setParent(null);
		}
	}
	return child;
};
mxCell.prototype.removeFromParent = function() {
	if (this.parent != null) {
		var index = this.parent.getIndex(this);
		this.parent.remove(index);
	}
};
mxCell.prototype.getEdgeCount = function() {
	return (this.edges == null) ? 0 : this.edges.length;
};
mxCell.prototype.getEdgeIndex = function(edge) {
	return mxUtils.indexOf(this.edges, edge);
};
mxCell.prototype.getEdgeAt = function(index) {
	return (this.edges == null) ? null: this.edges[index];
};
mxCell.prototype.insertEdge = function(edge, isOutgoing) {
	if (edge != null) {
		edge.removeFromTerminal(isOutgoing);
		edge.setTerminal(this, isOutgoing);
		if (this.edges == null || edge.getTerminal(!isOutgoing) != this || mxUtils.indexOf(this.edges, edge) < 0) {
			if (this.edges == null) {
				this.edges = [];
			}
			this.edges.push(edge);
		}
	}
	return edge;
};
mxCell.prototype.removeEdge = function(edge, isOutgoing) {
	if (edge != null) {
		if (edge.getTerminal(!isOutgoing) != this && this.edges != null) {
			var index = this.getEdgeIndex(edge);
			if (index >= 0) {
				this.edges.splice(index, 1);
			}
		}
		edge.setTerminal(null, isOutgoing);
	}
	return edge;
};
mxCell.prototype.removeFromTerminal = function(isSource) {
	var terminal = this.getTerminal(isSource);
	if (terminal != null) {
		terminal.removeEdge(this, isSource);
	}
};
mxCell.prototype.getAttribute = function(name, defaultValue) {
	var userObject = this.getValue();
	var val = (userObject != null && userObject.nodeType == mxConstants.NODETYPE_ELEMENT) ? userObject.getAttribute(name) : null;
	return val || defaultValue;
};
mxCell.prototype.setAttribute = function(name, value) {
	var userObject = this.getValue();
	if (userObject != null && userObject.nodeType == mxConstants.NODETYPE_ELEMENT) {
		userObject.setAttribute(name, value);
	}
};
mxCell.prototype.clone = function() {
	var clone = mxUtils.clone(this, this.mxTransient);
	clone.setValue(this.cloneValue());
	return clone;
};
mxCell.prototype.cloneValue = function() {
	var value = this.getValue();
	if (value != null) {
		if (typeof(value.clone) == 'function') {
			value = value.clone();
		} else if (!isNaN(value.nodeType)) {
			value = value.cloneNode(true);
		}
	}
	return value;
};
function mxGeometry(x, y, width, height) {
	mxRectangle.call(this, x, y, width, height);
};
mxGeometry.prototype = new mxRectangle();
mxGeometry.prototype.constructor = mxGeometry;
mxGeometry.prototype.TRANSLATE_CONTROL_POINTS = true;
mxGeometry.prototype.alternateBounds = null;
mxGeometry.prototype.sourcePoint = null;
mxGeometry.prototype.targetPoint = null;
mxGeometry.prototype.points = null;
mxGeometry.prototype.offset = null;
mxGeometry.prototype.relative = false;
mxGeometry.prototype.swap = function() {
	if (this.alternateBounds != null) {
		var old = new mxRectangle(this.x, this.y, this.width, this.height);
		this.x = this.alternateBounds.x;
		this.y = this.alternateBounds.y;
		this.width = this.alternateBounds.width;
		this.height = this.alternateBounds.height;
		this.alternateBounds = old;
	}
};
mxGeometry.prototype.getTerminalPoint = function(isSource) {
	return (isSource) ? this.sourcePoint: this.targetPoint;
};
mxGeometry.prototype.setTerminalPoint = function(point, isSource) {
	if (isSource) {
		this.sourcePoint = point;
	} else {
		this.targetPoint = point;
	}
	return point;
};
mxGeometry.prototype.translate = function(dx, dy) {
	var clone = this.clone();
	if (!this.relative) {
		this.x += dx;
		this.y += dy;
	}
	if (this.sourcePoint != null) {
		this.sourcePoint.x += dx;
		this.sourcePoint.y += dy;
	}
	if (this.targetPoint != null) {
		this.targetPoint.x += dx;
		this.targetPoint.y += dy;
	}
	if (this.TRANSLATE_CONTROL_POINTS && this.points != null) {
		var count = this.points.length;
		for (var i = 0; i < count; i++) {
			var pt = this.points[i];
			if (pt != null) {
				pt.x += dx;
				pt.y += dy;
			}
		}
	}
};
var mxCellPath = {
	PATH_SEPARATOR: '.',
	create: function(cell) {
		var result = '';
		if (cell != null) {
			var parent = cell.getParent();
			while (parent != null) {
				var index = parent.getIndex(cell);
				result = index + mxCellPath.PATH_SEPARATOR + result;
				cell = parent;
				parent = cell.getParent();
			}
		}
		var n = result.length;
		if (n > 1) {
			result = result.substring(0, n - 1);
		}
		return result;
	},
	getParentPath: function(path) {
		if (path != null) {
			var index = path.lastIndexOf(mxCellPath.PATH_SEPARATOR);
			if (index >= 0) {
				return path.substring(0, index);
			} else if (path.length > 0) {
				return '';
			}
		}
		return null;
	},
	resolve: function(root, path) {
		var parent = root;
		if (path != null) {
			var tokens = path.split(mxCellPath.PATH_SEPARATOR);
			for (var i = 0; i < tokens.length; i++) {
				parent = parent.getChildAt(parseInt(tokens[i]));
			}
		}
		return parent;
	},
	compare: function(p1, p2) {
		var min = Math.min(p1.length, p2.length);
		var comp = 0;
		for (var i = 0; i < min; i++) {
			if (p1[i] != p2[i]) {
				if (p1[i].length == 0 || p2[i].length == 0) {
					comp = (p1[i] == p2[i]) ? 0 : ((p1[i] > p2[i]) ? 1 : -1);
				} else {
					var t1 = parseInt(p1[i]);
					var t2 = parseInt(p2[i]);
					comp = (t1 == t2) ? 0 : ((t1 > t2) ? 1 : -1);
				}
				break;
			}
		}
		if (comp == 0) {
			var t1 = p1.length;
			var t2 = p2.length;
			if (t1 != t2) {
				comp = (t1 > t2) ? 1 : -1;
			}
		}
		return comp;
	}
};
var mxPerimeter = {
	RectanglePerimeter: function(bounds, vertex, next, orthogonal) {
		var cx = bounds.getCenterX();
		var cy = bounds.getCenterY();
		var dx = next.x - cx;
		var dy = next.y - cy;
		var alpha = Math.atan2(dy, dx);
		var p = new mxPoint(0, 0);
		var pi = Math.PI;
		var pi2 = Math.PI / 2;
		var beta = pi2 - alpha;
		var t = Math.atan2(bounds.height, bounds.width);
		if (alpha < -pi + t || alpha > pi - t) {
			p.x = bounds.x;
			p.y = cy - bounds.width * Math.tan(alpha) / 2;
		} else if (alpha < -t) {
			p.y = bounds.y;
			p.x = cx - bounds.height * Math.tan(beta) / 2;
		} else if (alpha < t) {
			p.x = bounds.x + bounds.width;
			p.y = cy + bounds.width * Math.tan(alpha) / 2;
		} else {
			p.y = bounds.y + bounds.height;
			p.x = cx + bounds.height * Math.tan(beta) / 2;
		}
		if (orthogonal) {
			if (next.x >= bounds.x && next.x <= bounds.x + bounds.width) {
				p.x = next.x;
			} else if (next.y >= bounds.y && next.y <= bounds.y + bounds.height) {
				p.y = next.y;
			}
			if (next.x < bounds.x) {
				p.x = bounds.x;
			} else if (next.x > bounds.x + bounds.width) {
				p.x = bounds.x + bounds.width;
			}
			if (next.y < bounds.y) {
				p.y = bounds.y;
			} else if (next.y > bounds.y + bounds.height) {
				p.y = bounds.y + bounds.height;
			}
		}
		return p;
	},
	EllipsePerimeter: function(bounds, vertex, next, orthogonal) {
		var x = bounds.x;
		var y = bounds.y;
		var a = bounds.width / 2;
		var b = bounds.height / 2;
		var cx = x + a;
		var cy = y + b;
		var px = next.x;
		var py = next.y;
		var dx = parseInt(px - cx);
		var dy = parseInt(py - cy);
		if (dx == 0 && dy != 0) {
			return new mxPoint(cx, cy + b * dy / Math.abs(dy));
		} else if (dx == 0 && dy == 0) {
			return new mxPoint(px, py);
		}
		if (orthogonal) {
			if (py >= y && py <= y + bounds.height) {
				var ty = py - cy;
				var tx = Math.sqrt(a * a * (1 - (ty * ty) / (b * b))) || 0;
				if (px <= x) {
					tx = -tx;
				}
				return new mxPoint(cx + tx, py);
			}
			if (px >= x && px <= x + bounds.width) {
				var tx = px - cx;
				var ty = Math.sqrt(b * b * (1 - (tx * tx) / (a * a))) || 0;
				if (py <= y) {
					ty = -ty;
				}
				return new mxPoint(px, cy + ty);
			}
		}
		var d = dy / dx;
		var h = cy - d * cx;
		var e = a * a * d * d + b * b;
		var f = -2 * cx * e;
		var g = a * a * d * d * cx * cx + b * b * cx * cx - a * a * b * b;
		var det = Math.sqrt(f * f - 4 * e * g);
		var xout1 = ( - f + det) / (2 * e);
		var xout2 = ( - f - det) / (2 * e);
		var yout1 = d * xout1 + h;
		var yout2 = d * xout2 + h;
		var dist1 = Math.sqrt(Math.pow((xout1 - px), 2) + Math.pow((yout1 - py), 2));
		var dist2 = Math.sqrt(Math.pow((xout2 - px), 2) + Math.pow((yout2 - py), 2));
		var xout = 0;
		var yout = 0;
		if (dist1 < dist2) {
			xout = xout1;
			yout = yout1;
		} else {
			xout = xout2;
			yout = yout2;
		}
		return new mxPoint(xout, yout);
	},
	RhombusPerimeter: function(bounds, vertex, next, orthogonal) {
		var x = bounds.x;
		var y = bounds.y;
		var w = bounds.width;
		var h = bounds.height;
		var cx = x + w / 2;
		var cy = y + h / 2;
		var px = next.x;
		var py = next.y;
		if (cx == px) {
			if (cy > py) {
				return new mxPoint(cx, y);
			} else {
				return new mxPoint(cx, y + h);
			}
		} else if (cy == py) {
			if (cx > px) {
				return new mxPoint(x, cy);
			} else {
				return new mxPoint(x + w, cy);
			}
		}
		var tx = cx;
		var ty = cy;
		if (orthogonal) {
			if (px >= x && px <= x + w) {
				tx = px;
			} else if (py >= y && py <= y + h) {
				ty = py;
			}
		}
		if (px < cx) {
			if (py < cy) {
				return mxUtils.intersection(px, py, tx, ty, cx, y, x, cy);
			} else {
				return mxUtils.intersection(px, py, tx, ty, cx, y + h, x, cy);
			}
		} else if (py < cy) {
			return mxUtils.intersection(px, py, tx, ty, cx, y, x + w, cy);
		} else {
			return mxUtils.intersection(px, py, tx, ty, cx, y + h, x + w, cy);
		}
	},
	TrianglePerimeter: function(bounds, vertex, next, orthogonal) {
		var direction = (vertex != null) ? vertex.style[mxConstants.STYLE_DIRECTION] : null;
		var vertical = direction == mxConstants.DIRECTION_NORTH || direction == mxConstants.DIRECTION_SOUTH;
		var x = bounds.x;
		var y = bounds.y;
		var w = bounds.width;
		var h = bounds.height;
		var cx = x + w / 2;
		var cy = y + h / 2;
		var start = new mxPoint(x, y);
		var corner = new mxPoint(x + w, cy);
		var end = new mxPoint(x, y + h);
		if (direction == mxConstants.DIRECTION_NORTH) {
			start = end;
			corner = new mxPoint(cx, y);
			end = new mxPoint(x + w, y + h);
		} else if (direction == mxConstants.DIRECTION_SOUTH) {
			corner = new mxPoint(cx, y + h);
			end = new mxPoint(x + w, y);
		} else if (direction == mxConstants.DIRECTION_WEST) {
			start = new mxPoint(x + w, y);
			corner = new mxPoint(x, cy);
			end = new mxPoint(x + w, y + h);
		}
		var dx = next.x - cx;
		var dy = next.y - cy;
		var alpha = (vertical) ? Math.atan2(dx, dy) : Math.atan2(dy, dx);
		var t = (vertical) ? Math.atan2(w, h) : Math.atan2(h, w);
		var base = false;
		if (direction == mxConstants.DIRECTION_NORTH || direction == mxConstants.DIRECTION_WEST) {
			base = alpha > -t && alpha < t;
		} else {
			base = alpha < -Math.PI + t || alpha > Math.PI - t;
		}
		var result = null;
		if (base) {
			if (orthogonal && ((vertical && next.x >= start.x && next.x <= end.x) || (!vertical && next.y >= start.y && next.y <= end.y))) {
				if (vertical) {
					result = new mxPoint(next.x, start.y);
				} else {
					result = new mxPoint(start.x, next.y);
				}
			} else {
				if (direction == mxConstants.DIRECTION_NORTH) {
					result = new mxPoint(x + w / 2 + h * Math.tan(alpha) / 2, y + h);
				} else if (direction == mxConstants.DIRECTION_SOUTH) {
					result = new mxPoint(x + w / 2 - h * Math.tan(alpha) / 2, y);
				} else if (direction == mxConstants.DIRECTION_WEST) {
					result = new mxPoint(x + w, y + h / 2 + w * Math.tan(alpha) / 2);
				} else {
					result = new mxPoint(x, y + h / 2 - w * Math.tan(alpha) / 2);
				}
			}
		} else {
			if (orthogonal) {
				var pt = new mxPoint(cx, cy);
				if (next.y >= y && next.y <= y + h) {
					pt.x = (vertical) ? cx: ((direction == mxConstants.DIRECTION_WEST) ? x + w: x);
					pt.y = next.y;
				} else if (next.x >= x && next.x <= x + w) {
					pt.x = next.x;
					pt.y = (!vertical) ? cy: ((direction == mxConstants.DIRECTION_NORTH) ? y + h: y);
				}
				dx = next.x - pt.x;
				dy = next.y - pt.y;
				cx = pt.x;
				cy = pt.y;
			}
			if ((vertical && next.x <= x + w / 2) || (!vertical && next.y <= y + h / 2)) {
				result = mxUtils.intersection(next.x, next.y, cx, cy, start.x, start.y, corner.x, corner.y);
			} else {
				result = mxUtils.intersection(next.x, next.y, cx, cy, corner.x, corner.y, end.x, end.y);
			}
		}
		if (result == null) {
			result = new mxPoint(cx, cy);
		}
		return result;
	}
};
function mxPrintPreview(graph, scale, pageFormat, border, x0, y0, borderColor, title, pageSelector) {
	this.graph = graph;
	this.scale = (scale != null) ? scale: 1 / graph.pageScale;
	this.border = (border != null) ? border: 0;
	this.pageFormat = (pageFormat != null) ? pageFormat: graph.pageFormat;
	this.title = (title != null) ? title: 'Printer-friendly version';
	this.x0 = (x0 != null) ? x0: 0;
	this.y0 = (y0 != null) ? y0: 0;
	this.borderColor = borderColor;
	this.pageSelector = (pageSelector != null) ? pageSelector: true;
};
mxPrintPreview.prototype.graph = null;
mxPrintPreview.prototype.pageFormat = null;
mxPrintPreview.prototype.scale = null;
mxPrintPreview.prototype.border = 0;
mxPrintPreview.prototype.x0 = 0;
mxPrintPreview.prototype.y0 = 0;
mxPrintPreview.prototype.autoOrigin = true;
mxPrintPreview.prototype.printOverlays = false;
mxPrintPreview.prototype.borderColor = null;
mxPrintPreview.prototype.title = null;
mxPrintPreview.prototype.pageSelector = null;
mxPrintPreview.prototype.wnd = null;
mxPrintPreview.prototype.pageCount = 0;
mxPrintPreview.prototype.getWindow = function() {
	return this.wnd;
};
mxPrintPreview.prototype.open = function(css) {
	var previousInitializeOverlay = this.graph.cellRenderer.initializeOverlay;
	var div = null;
	try {
		if (this.printOverlays) {
			this.graph.cellRenderer.initializeOverlay = function(state, overlay) {
				overlay.init(state.view.getDrawPane());
			};
		}
		if (this.wnd == null) {
			this.wnd = window.open();
			var doc = this.wnd.document;
			doc.writeln('<html>');
			doc.writeln('<head>');
			this.writeHead(doc, css);
			doc.writeln('</head>');
			doc.writeln('<body class="mxPage">');
			mxClient.link('stylesheet', mxClient.basePath + '/css/common.css', doc);
			if (mxClient.IS_IE && document.documentMode != 9) {
				doc.namespaces.add('v', 'urn:schemas-microsoft-com:vml');
				doc.namespaces.add('o', 'urn:schemas-microsoft-com:office:office');
				var ss = doc.createStyleSheet();
				ss.cssText = 'v\\:*{behavior:url(#default#VML)}o\\:*{behavior:url(#default#VML)}';
				mxClient.link('stylesheet', mxClient.basePath + '/css/explorer.css', doc);
			}
			var bounds = this.graph.getGraphBounds().clone();
			var currentScale = this.graph.getView().getScale();
			var sc = currentScale / this.scale;
			var tr = this.graph.getView().getTranslate();
			if (!this.autoOrigin) {
				this.x0 = -tr.x * this.scale;
				this.y0 = -tr.y * this.scale;
				bounds.width += bounds.x;
				bounds.height += bounds.y;
				bounds.x = 0;
				bounds.y = 0;
				this.border = 0;
			}
			bounds.width /= sc;
			bounds.height /= sc;
			var availableWidth = this.pageFormat.width - (this.border * 2);
			var availableHeight = this.pageFormat.height - (this.border * 2);
			var hpages = Math.max(1, Math.ceil((bounds.width + this.x0) / availableWidth));
			var vpages = Math.max(1, Math.ceil((bounds.height + this.y0) / availableHeight));
			this.pageCount = hpages * vpages;
			var writePageSelector = mxUtils.bind(this,
			function() {
				if (this.pageSelector && (vpages > 1 || hpages > 1)) {
					var table = this.createPageSelector(vpages, hpages);
					doc.body.appendChild(table);
					if (mxClient.IS_IE) {
						table.style.position = 'absolute';
						var update = function() {
							table.style.top = (doc.body.scrollTop + 10) + 'px';
						};
						mxEvent.addListener(this.wnd, 'scroll',
						function(evt) {
							update();
						});
						mxEvent.addListener(this.wnd, 'resize',
						function(evt) {
							update();
						});
					}
				}
			});
			var pages = null;
			if (mxClient.IS_IE && document.documentMode != 9) {
				pages = [];
				var waitCounter = 0;
				var isDone = false;
				var mxImageShapeScheduleUpdateAspect = mxImageShape.prototype.scheduleUpdateAspect;
				var mxImageShapeUpdateAspect = mxImageShape.prototype.updateAspect;
				var writePages = function() {
					if (isDone && waitCounter == 0) {
						mxImageShape.prototype.scheduleUpdateAspect = mxImageShapeScheduleUpdateAspect;
						mxImageShape.prototype.updateAspect = mxImageShapeUpdateAspect;
						var markup = '';
						for (var i = 0; i < pages.length; i++) {
							markup += pages[i].outerHTML;
							pages[i].parentNode.removeChild(pages[i]);
							if (i < pages.length - 1) {
								markup += '<hr/>';
							}
						}
						doc.body.innerHTML = markup;
						writePageSelector();
					}
				};
				mxImageShape.prototype.scheduleUpdateAspect = function() {
					waitCounter++;
					mxImageShapeScheduleUpdateAspect.apply(this, arguments);
				};
				mxImageShape.prototype.updateAspect = function() {
					mxImageShapeUpdateAspect.apply(this, arguments);
					waitCounter--;
					writePages();
				};
			}
			for (var i = 0; i < vpages; i++) {
				var dy = i * availableHeight / this.scale - this.y0 / this.scale + (bounds.y - tr.y * currentScale) / currentScale;
				for (var j = 0; j < hpages; j++) {
					if (this.wnd == null) {
						return null;
					}
					var dx = j * availableWidth / this.scale - this.x0 / this.scale + (bounds.x - tr.x * currentScale) / currentScale;
					var pageNum = i * hpages + j + 1;
					div = this.renderPage(this.pageFormat.width, this.pageFormat.height, -dx, -dy, this.scale, pageNum);
					div.setAttribute('id', 'mxPage-' + pageNum);
					if (this.borderColor != null) {
						div.style.borderColor = this.borderColor;
						div.style.borderStyle = 'solid';
						div.style.borderWidth = '1px';
					}
					div.style.background = 'white';
					if (i < vpages - 1 || j < hpages - 1) {
						div.style.pageBreakAfter = 'always';
					}
					if (mxClient.IS_IE) {
						doc.writeln(div.outerHTML);
						if (pages != null) {
							pages.push(div);
						} else {
							div.parentNode.removeChild(div);
						}
					} else {
						div.parentNode.removeChild(div);
						doc.body.appendChild(div);
					}
					if (i < vpages - 1 || j < hpages - 1) {
						var hr = doc.createElement('hr');
						hr.className = 'mxPageBreak';
						doc.body.appendChild(hr);
					}
				}
			}
			doc.writeln('</body>');
			doc.writeln('</html>');
			doc.close();
			if (pages != null) {
				isDone = true;
				writePages();
			} else {
				writePageSelector();
			}
			mxEvent.release(doc.body);
		}
		this.wnd.focus();
	} catch(e) {
		if (div != null && div.parentNode != null) {
			div.parentNode.removeChild(div);
		}
	} finally {
		this.graph.cellRenderer.initializeOverlay = previousInitializeOverlay;
	}
	return this.wnd;
};
mxPrintPreview.prototype.writeHead = function(doc, css) {
	if (this.title != null) {
		doc.writeln('<title>' + this.title + '</title>');
	}
	doc.writeln('<style type="text/css">');
	doc.writeln('@media print {');
	doc.writeln('  table.mxPageSelector { display: none; }');
	doc.writeln('  hr.mxPageBreak { display: none; }');
	doc.writeln('}');
	doc.writeln('@media screen {');
	doc.writeln('  table.mxPageSelector { position: fixed; right: 10px; top: 10px;' + 'font-family: Arial; font-size:10pt; border: solid 1px darkgray;' + 'background: white; border-collapse:collapse; }');
	doc.writeln('  table.mxPageSelector td { border: solid 1px gray; padding:4px; }');
	doc.writeln('  body.mxPage { background: gray; }');
	doc.writeln('}');
	if (css != null) {
		doc.writeln(css);
	}
	doc.writeln('</style>');
};
mxPrintPreview.prototype.createPageSelector = function(vpages, hpages) {
	var doc = this.wnd.document;
	var table = doc.createElement('table');
	table.className = 'mxPageSelector';
	table.setAttribute('border', '0');
	var tbody = doc.createElement('tbody');
	for (var i = 0; i < vpages; i++) {
		var row = doc.createElement('tr');
		for (var j = 0; j < hpages; j++) {
			var pageNum = i * hpages + j + 1;
			var cell = doc.createElement('td');
			if (mxClient.IS_IE || false || false) {
				var a = doc.createElement('a');
				a.setAttribute('href', '#mxPage-' + pageNum);
				mxUtils.write(a, pageNum, doc);
				cell.appendChild(a);
			} else {
				mxUtils.write(cell, pageNum, doc);
			}
			row.appendChild(cell);
		}
		tbody.appendChild(row);
	}
	table.appendChild(tbody);
	return table;
};
mxPrintPreview.prototype.renderPage = function(w, h, dx, dy, scale, pageNumber) {
	var div = document.createElement('div');
	try {
		div.style.width = w + 'px';
		div.style.height = h + 'px';
		div.style.overflow = 'hidden';
		div.style.pageBreakInside = 'avoid';
		var innerDiv = document.createElement('div');
		innerDiv.style.top = this.border + 'px';
		innerDiv.style.left = this.border + 'px';
		innerDiv.style.width = (w - 2 * this.border) + 'px';
		innerDiv.style.height = (h - 2 * this.border) + 'px';
		innerDiv.style.overflow = 'hidden';
		if (this.graph.dialect == mxConstants.DIALECT_VML) {
			innerDiv.style.position = 'absolute';
		}
		div.appendChild(innerDiv);
		document.body.appendChild(div);
		var view = this.graph.getView();
		var previousContainer = this.graph.container;
		this.graph.container = innerDiv;
		var canvas = view.getCanvas();
		var backgroundPane = view.getBackgroundPane();
		var drawPane = view.getDrawPane();
		var overlayPane = view.getOverlayPane();
		if (this.graph.dialect == mxConstants.DIALECT_SVG) {
			view.createSvg();
		} else if (this.graph.dialect == mxConstants.DIALECT_VML) {
			view.createVml();
		} else {
			view.createHtml();
		}
		var eventsEnabled = view.isEventsEnabled();
		view.setEventsEnabled(false);
		var graphEnabled = this.graph.isEnabled();
		this.graph.setEnabled(false);
		var translate = view.getTranslate();
		view.translate = new mxPoint(dx, dy);
		var temp = null;
		try {
			var model = this.graph.getModel();
			var cells = [model.getRoot()];
			temp = new mxTemporaryCellStates(view, scale, cells);
		} finally {
			if (mxClient.IS_IE) {
				view.overlayPane.innerHTML = '';
			} else {
				var tmp = innerDiv.firstChild;
				while (tmp != null) {
					var next = tmp.nextSibling;
					var name = tmp.nodeName.toLowerCase();
					if (name == 'svg') {
						tmp.setAttribute('width', parseInt(innerDiv.style.width));
						tmp.setAttribute('height', parseInt(innerDiv.style.height));
					} else if (tmp.style.cursor != 'default' && name != 'table') {
						tmp.parentNode.removeChild(tmp);
					}
					tmp = next;
				}
			}
			view.overlayPane.parentNode.removeChild(view.overlayPane);
			this.graph.setEnabled(graphEnabled);
			this.graph.container = previousContainer;
			view.canvas = canvas;
			view.backgroundPane = backgroundPane;
			view.drawPane = drawPane;
			view.overlayPane = overlayPane;
			view.translate = translate;
			temp.destroy();
			view.setEventsEnabled(eventsEnabled);
		}
	} catch(e) {
		div.parentNode.removeChild(div);
		div = null;
		throw e;
	}
	return div;
};
mxPrintPreview.prototype.print = function() {
	var wnd = this.open();
	if (wnd != null) {
		wnd.print();
	}
};
mxPrintPreview.prototype.close = function() {
	if (this.wnd != null) {
		this.wnd.close();
		this.wnd = null;
	}
};
function mxStylesheet() {
	this.styles = new Object();
	this.putDefaultVertexStyle(this.createDefaultVertexStyle());
	this.putDefaultEdgeStyle(this.createDefaultEdgeStyle());
};
mxStylesheet.prototype.styles;
mxStylesheet.prototype.createDefaultVertexStyle = function() {
	var style = new Object();
	style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
	style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
	style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
	style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
	style[mxConstants.STYLE_FILLCOLOR] = '#C3D9FF';
	style[mxConstants.STYLE_STROKECOLOR] = '#6482B9';
	style[mxConstants.STYLE_FONTCOLOR] = '#774400';
	return style;
};
mxStylesheet.prototype.createDefaultEdgeStyle = function() {
	var style = new Object();
	style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_CONNECTOR;
	style[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_CLASSIC;
	style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
	style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
	style[mxConstants.STYLE_STROKECOLOR] = '#6482B9';
	style[mxConstants.STYLE_FONTCOLOR] = '#446299';
	return style;
};
mxStylesheet.prototype.putDefaultVertexStyle = function(style) {
	this.putCellStyle('defaultVertex', style);
};
mxStylesheet.prototype.putDefaultEdgeStyle = function(style) {
	this.putCellStyle('defaultEdge', style);
};
mxStylesheet.prototype.getDefaultVertexStyle = function() {
	return this.styles['defaultVertex'];
};
mxStylesheet.prototype.getDefaultEdgeStyle = function() {
	return this.styles['defaultEdge'];
};
mxStylesheet.prototype.putCellStyle = function(name, style) {
	this.styles[name] = style;
};
mxStylesheet.prototype.getCellStyle = function(name, defaultStyle) {
	var style = defaultStyle;
	if (name != null && name.length > 0) {
		var pairs = name.split(';');
		if (style != null && name.charAt(0) != ';') {
			style = mxUtils.clone(style);
		} else {
			style = new Object();
		}
		for (var i = 0; i < pairs.length; i++) {
			var tmp = pairs[i];
			var pos = tmp.indexOf('=');
			if (pos >= 0) {
				var key = tmp.substring(0, pos);
				var value = tmp.substring(pos + 1);
				if (value == mxConstants.NONE) {
					delete style[key];
				} else if (mxUtils.isNumeric(value)) {
					style[key] = parseFloat(value);
				} else {
					style[key] = value;
				}
			} else {
				var tmpStyle = this.styles[tmp];
				if (tmpStyle != null) {
					for (var key in tmpStyle) {
						style[key] = tmpStyle[key];
					}
				}
			}
		}
	}
	return style;
};
function mxCellState(view, cell, style) {
	this.view = view;
	this.cell = cell;
	this.style = style;
	this.origin = new mxPoint();
	this.absoluteOffset = new mxPoint();
};
mxCellState.prototype = new mxRectangle();
mxCellState.prototype.constructor = mxCellState;
mxCellState.prototype.view = null;
mxCellState.prototype.cell = null;
mxCellState.prototype.style = null;
mxCellState.prototype.invalid = true;
mxCellState.prototype.invalidOrder = false;
mxCellState.prototype.orderChanged = false;
mxCellState.prototype.origin = null;
mxCellState.prototype.absolutePoints = null;
mxCellState.prototype.absoluteOffset = null;
mxCellState.prototype.visibleSourceState = null;
mxCellState.prototype.visibleTargetState = null;
mxCellState.prototype.terminalDistance = 0;
mxCellState.prototype.length = 0;
mxCellState.prototype.segments = null;
mxCellState.prototype.shape = null;
mxCellState.prototype.text = null;
mxCellState.prototype.getPerimeterBounds = function(border, bounds) {
	border = border || 0;
	bounds = (bounds != null) ? bounds: new mxRectangle(this.x, this.y, this.width, this.height);
	if (this.shape != null && this.shape.stencil != null) {
		var aspect = this.shape.stencil.computeAspect(this, bounds, null);
		bounds.x = aspect.x;
		bounds.y = aspect.y;
		bounds.width = this.shape.stencil.w0 * aspect.width;
		bounds.height = this.shape.stencil.h0 * aspect.height;
	}
	if (border != 0) {
		bounds.grow(border);
	}
	return bounds;
};
mxCellState.prototype.setAbsoluteTerminalPoint = function(point, isSource) {
	if (isSource) {
		if (this.absolutePoints == null) {
			this.absolutePoints = [];
		}
		if (this.absolutePoints.length == 0) {
			this.absolutePoints.push(point);
		} else {
			this.absolutePoints[0] = point;
		}
	} else {
		if (this.absolutePoints == null) {
			this.absolutePoints = [];
			this.absolutePoints.push(null);
			this.absolutePoints.push(point);
		} else if (this.absolutePoints.length == 1) {
			this.absolutePoints.push(point);
		} else {
			this.absolutePoints[this.absolutePoints.length - 1] = point;
		}
	}
};
mxCellState.prototype.setCursor = function(cursor) {
	if (this.shape != null) {
		this.shape.setCursor(cursor);
	}
	if (this.text != null) {
		this.text.setCursor(cursor);
	}
};
mxCellState.prototype.getVisibleTerminal = function(source) {
	var tmp = this.getVisibleTerminalState(source);
	return (tmp != null) ? tmp.cell: null;
};
mxCellState.prototype.getVisibleTerminalState = function(source) {
	return (source) ? this.visibleSourceState: this.visibleTargetState;
};
mxCellState.prototype.setVisibleTerminalState = function(terminalState, source) {
	if (source) {
		this.visibleSourceState = terminalState;
	} else {
		this.visibleTargetState = terminalState;
	}
};
mxCellState.prototype.destroy = function() {
	this.view.graph.cellRenderer.destroy(this);
};
mxCellState.prototype.clone = function() {
	var clone = new mxCellState(this.view, this.cell, this.style);
	if (this.absolutePoints != null) {
		clone.absolutePoints = [];
		for (var i = 0; i < this.absolutePoints.length; i++) {
			clone.absolutePoints[i] = this.absolutePoints[i].clone();
		}
	}
	if (this.origin != null) {
		clone.origin = this.origin.clone();
	}
	if (this.absoluteOffset != null) {
		clone.absoluteOffset = this.absoluteOffset.clone();
	}
	if (this.boundingBox != null) {
		clone.boundingBox = this.boundingBox.clone();
	}
	clone.terminalDistance = this.terminalDistance;
	clone.segments = this.segments;
	clone.length = this.length;
	clone.x = this.x;
	clone.y = this.y;
	clone.width = this.width;
	clone.height = this.height;
	return clone;
};
function mxGraphSelectionModel(graph) {
	this.graph = graph;
	this.cells = [];
};
mxGraphSelectionModel.prototype = new mxEventSource();
mxGraphSelectionModel.prototype.constructor = mxGraphSelectionModel;
mxGraphSelectionModel.prototype.doneResource = (mxClient.language != 'none') ? 'done': '';
mxGraphSelectionModel.prototype.updatingSelectionResource = (mxClient.language != 'none') ? 'updatingSelection': '';
mxGraphSelectionModel.prototype.graph = null;
mxGraphSelectionModel.prototype.singleSelection = false;
mxGraphSelectionModel.prototype.isSingleSelection = function() {
	return this.singleSelection;
};
mxGraphSelectionModel.prototype.setSingleSelection = function(singleSelection) {
	this.singleSelection = singleSelection;
};
mxGraphSelectionModel.prototype.isSelected = function(cell) {
	if (cell != null) {
		return mxUtils.indexOf(this.cells, cell) >= 0;
	}
	return false;
};
mxGraphSelectionModel.prototype.isEmpty = function() {
	return this.cells.length == 0;
};
mxGraphSelectionModel.prototype.clear = function() {
	this.changeSelection(null, this.cells);
};
mxGraphSelectionModel.prototype.setCell = function(cell) {
	if (cell != null) {
		this.setCells([cell]);
	}
};
mxGraphSelectionModel.prototype.setCells = function(cells) {
	if (cells != null) {
		if (this.singleSelection) {
			cells = [this.getFirstSelectableCell(cells)];
		}
		var tmp = [];
		for (var i = 0; i < cells.length; i++) {
			if (this.graph.isCellSelectable(cells[i])) {
				tmp.push(cells[i]);
			}
		}
		this.changeSelection(tmp, this.cells);
	}
};
mxGraphSelectionModel.prototype.getFirstSelectableCell = function(cells) {
	if (cells != null) {
		for (var i = 0; i < cells.length; i++) {
			if (this.graph.isCellSelectable(cells[i])) {
				return cells[i];
			}
		}
	}
	return null;
};
mxGraphSelectionModel.prototype.addCell = function(cell) {
	if (cell != null) {
		this.addCells([cell]);
	}
};
mxGraphSelectionModel.prototype.addCells = function(cells) {
	if (cells != null) {
		var remove = null;
		if (this.singleSelection) {
			remove = this.cells;
			cells = [this.getFirstSelectableCell(cells)];
		}
		var tmp = [];
		for (var i = 0; i < cells.length; i++) {
			if (!this.isSelected(cells[i]) && this.graph.isCellSelectable(cells[i])) {
				tmp.push(cells[i]);
			}
		}
		this.changeSelection(tmp, remove);
	}
};
mxGraphSelectionModel.prototype.removeCell = function(cell) {
	if (cell != null) {
		this.removeCells([cell]);
	}
};
mxGraphSelectionModel.prototype.removeCells = function(cells) {
	if (cells != null) {
		var tmp = [];
		for (var i = 0; i < cells.length; i++) {
			if (this.isSelected(cells[i])) {
				tmp.push(cells[i]);
			}
		}
		this.changeSelection(null, tmp);
	}
};
mxGraphSelectionModel.prototype.changeSelection = function(added, removed) {
	if ((added != null && added.length > 0 && added[0] != null) || (removed != null && removed.length > 0 && removed[0] != null)) {
		var change = new mxSelectionChange(this, added, removed);
		change.execute();
		var edit = new mxUndoableEdit(this, false);
		edit.add(change);
		this.fireEvent(new mxEventObject(mxEvent.UNDO, 'edit', edit));
	}
};
mxGraphSelectionModel.prototype.cellAdded = function(cell) {
	if (cell != null && !this.isSelected(cell)) {
		this.cells.push(cell);
	}
};
mxGraphSelectionModel.prototype.cellRemoved = function(cell) {
	if (cell != null) {
		var index = mxUtils.indexOf(this.cells, cell);
		if (index >= 0) {
			this.cells.splice(index, 1);
		}
	}
};
function mxSelectionChange(selectionModel, added, removed) {
	this.selectionModel = selectionModel;
	this.added = (added != null) ? added.slice() : null;
	this.removed = (removed != null) ? removed.slice() : null;
};
mxSelectionChange.prototype.execute = function() {
	var t0 = mxLog.enter('mxSelectionChange.execute');
	window.status = mxResources.get(this.selectionModel.updatingSelectionResource) || this.selectionModel.updatingSelectionResource;
	if (this.removed != null) {
		for (var i = 0; i < this.removed.length; i++) {
			this.selectionModel.cellRemoved(this.removed[i]);
		}
	}
	if (this.added != null) {
		for (var i = 0; i < this.added.length; i++) {
			this.selectionModel.cellAdded(this.added[i]);
		}
	}
	var tmp = this.added;
	this.added = this.removed;
	this.removed = tmp;
	window.status = mxResources.get(this.selectionModel.doneResource) || this.selectionModel.doneResource;
	mxLog.leave('mxSelectionChange.execute', t0);
	this.selectionModel.fireEvent(new mxEventObject(mxEvent.CHANGE, 'added', this.added, 'removed', this.removed));
};
function mxCellEditor(graph) {
	this.graph = graph;
};
mxCellEditor.prototype.graph = null;
mxCellEditor.prototype.textarea = null;
mxCellEditor.prototype.editingCell = null;
mxCellEditor.prototype.trigger = null;
mxCellEditor.prototype.modified = false;
mxCellEditor.prototype.emptyLabelText = '';
mxCellEditor.prototype.textNode = '';
mxCellEditor.prototype.init = function() {
	this.textarea = document.createElement('textarea');
	this.textarea.className = 'mxCellEditor';
	this.textarea.style.position = 'absolute';
	this.textarea.style.overflow = 'visible';
	this.textarea.setAttribute('cols', '20');
	this.textarea.setAttribute('rows', '4');
	if (false) {
		this.textarea.style.resize = 'none';
	}
	mxEvent.addListener(this.textarea, 'blur', mxUtils.bind(this,
	function(evt) {
		this.focusLost();
	}));
	mxEvent.addListener(this.textarea, 'keydown', mxUtils.bind(this,
	function(evt) {
		if (!mxEvent.isConsumed(evt)) {
			if (evt.keyCode == 113 || (this.graph.isEnterStopsCellEditing() && evt.keyCode == 13 && !mxEvent.isControlDown(evt) && !mxEvent.isShiftDown(evt))) {
				this.graph.stopEditing(false);
				mxEvent.consume(evt);
			} else if (evt.keyCode == 27) {
				this.graph.stopEditing(true);
				mxEvent.consume(evt);
			} else {
				if (this.clearOnChange) {
					this.clearOnChange = false;
					this.textarea.value = '';
				}
				this.setModified(true);
			}
		}
	}));
};
mxCellEditor.prototype.isModified = function() {
	return this.modified;
};
mxCellEditor.prototype.setModified = function(value) {
	this.modified = value;
};
mxCellEditor.prototype.focusLost = function() {
	this.stopEditing(!this.graph.isInvokesStopCellEditing());
};
mxCellEditor.prototype.startEditing = function(cell, trigger) {
	if (this.textarea == null) {
		this.init();
	}
	this.stopEditing(true);
	var state = this.graph.getView().getState(cell);
	if (state != null) {
		this.editingCell = cell;
		this.trigger = trigger;
		this.textNode = null;
		if (state.text != null && this.isHideLabel(state)) {
			this.textNode = state.text.node;
			this.textNode.style.visibility = 'hidden';
		}
		var scale = this.graph.getView().scale;
		var size = mxUtils.getValue(state.style, mxConstants.STYLE_FONTSIZE, mxConstants.DEFAULT_FONTSIZE) * scale;
		var family = mxUtils.getValue(state.style, mxConstants.STYLE_FONTFAMILY, mxConstants.DEFAULT_FONTFAMILY);
		var color = mxUtils.getValue(state.style, mxConstants.STYLE_FONTCOLOR, 'black');
		var align = (this.graph.model.isEdge(state.cell)) ? mxConstants.ALIGN_LEFT: mxUtils.getValue(state.style, mxConstants.STYLE_ALIGN, mxConstants.ALIGN_LEFT);
		var bold = (mxUtils.getValue(state.style, mxConstants.STYLE_FONTSTYLE, 0) & mxConstants.FONT_BOLD) == mxConstants.FONT_BOLD;
		this.textarea.style.fontSize = size;
		this.textarea.style.fontFamily = family;
		this.textarea.style.textAlign = align;
		this.textarea.style.color = color;
		this.textarea.style.fontWeight = (bold) ? 'bold': 'normal';
		var bounds = this.getEditorBounds(state);
		this.textarea.style.left = bounds.x + 'px';
		this.textarea.style.top = bounds.y + 'px';
		this.textarea.style.width = bounds.width + 'px';
		this.textarea.style.height = bounds.height + 'px';
		this.textarea.style.zIndex = 5;
		var value = this.getInitialValue(state, trigger);
		if (value == null || value.length == 0) {
			value = this.getEmptyLabelText();
			this.clearOnChange = true;
		} else {
			this.clearOnChange = false;
		}
		this.setModified(false);
		this.textarea.value = value;
		this.graph.container.appendChild(this.textarea);
		if (this.textarea.style.display != 'none') {
			this.textarea.focus();
			this.textarea.select();
		}
	}
};
mxCellEditor.prototype.stopEditing = function(cancel) {
	cancel = cancel || false;
	if (this.editingCell != null) {
		if (this.textNode != null) {
			this.textNode.style.visibility = 'visible';
			this.textNode = null;
		}
		if (!cancel && this.isModified()) {
			this.graph.labelChanged(this.editingCell, this.getCurrentValue(), this.trigger);
		}
		this.editingCell = null;
		this.trigger = null;
		this.textarea.blur();
		this.textarea.parentNode.removeChild(this.textarea);
	}
};
mxCellEditor.prototype.getInitialValue = function(state, trigger) {
	return this.graph.getEditingValue(state.cell, trigger);
};
mxCellEditor.prototype.getCurrentValue = function() {
	return this.textarea.value.replace(/\r/g, '');
};
mxCellEditor.prototype.isHideLabel = function(state) {
	return true;
};
mxCellEditor.prototype.getEditorBounds = function(state) {
	var isEdge = this.graph.getModel().isEdge(state.cell);
	var scale = this.graph.getView().scale;
	var minHeight = (state.text == null) ? 30 : state.text.size * scale + 20;
	var minWidth = (this.textarea.style.textAlign == 'left') ? 120 : 40;
	var spacing = parseInt(state.style[mxConstants.STYLE_SPACING] || 2) * scale;
	var spacingTop = (parseInt(state.style[mxConstants.STYLE_SPACING_TOP] || 0)) * scale + spacing;
	var spacingRight = (parseInt(state.style[mxConstants.STYLE_SPACING_RIGHT] || 0)) * scale + spacing;
	var spacingBottom = (parseInt(state.style[mxConstants.STYLE_SPACING_BOTTOM] || 0)) * scale + spacing;
	var spacingLeft = (parseInt(state.style[mxConstants.STYLE_SPACING_LEFT] || 0)) * scale + spacing;
	var result = new mxRectangle(state.x, state.y, Math.max(minWidth, state.width - spacingLeft - spacingRight), Math.max(minHeight, state.height - spacingTop - spacingBottom));
	if (isEdge) {
		result.x = state.absoluteOffset.x;
		result.y = state.absoluteOffset.y;
		if (state.text != null && state.text.boundingBox != null) {
			if (state.text.boundingBox.x > 0) {
				result.x = state.text.boundingBox.x;
			}
			if (state.text.boundingBox.y > 0) {
				result.y = state.text.boundingBox.y;
			}
		}
	} else if (state.text != null && state.text.boundingBox != null) {
		result.x = Math.min(result.x, state.text.boundingBox.x);
		result.y = Math.min(result.y, state.text.boundingBox.y);
	}
	result.x += spacingLeft;
	result.y += spacingTop;
	if (state.text != null && state.text.boundingBox != null) {
		if (!isEdge) {
			result.width = Math.max(result.width, state.text.boundingBox.width);
			result.height = Math.max(result.height, state.text.boundingBox.height);
		} else {
			result.width = Math.max(minWidth, state.text.boundingBox.width);
			result.height = Math.max(minHeight, state.text.boundingBox.height);
		}
	}
	if (this.graph.getModel().isVertex(state.cell)) {
		var horizontal = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_CENTER);
		if (horizontal == mxConstants.ALIGN_LEFT) {
			result.x -= state.width;
		} else if (horizontal == mxConstants.ALIGN_RIGHT) {
			result.x += state.width;
		}
		var vertical = mxUtils.getValue(state.style, mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_MIDDLE);
		if (vertical == mxConstants.ALIGN_TOP) {
			result.y -= state.height;
		} else if (vertical == mxConstants.ALIGN_BOTTOM) {
			result.y += state.height;
		}
	}
	return result;
};
mxCellEditor.prototype.getEmptyLabelText = function(cell) {
	return this.emptyLabelText;
};
mxCellEditor.prototype.getEditingCell = function() {
	return this.editingCell;
};
mxCellEditor.prototype.destroy = function() {
	if (this.textarea != null) {
		mxEvent.release(this.textarea);
		if (this.textarea.parentNode != null) {
			this.textarea.parentNode.removeChild(this.textarea);
		}
		this.textarea = null;
	}
};
function mxCellRenderer() {
	this.shapes = mxUtils.clone(this.defaultShapes);
};
mxCellRenderer.prototype.shapes = null;
mxCellRenderer.prototype.defaultEdgeShape = mxConnector;
mxCellRenderer.prototype.defaultVertexShape = mxRectangleShape;
mxCellRenderer.prototype.defaultShapes = new Object();
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_ARROW] = mxArrow;
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_RECTANGLE] = mxRectangleShape;
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_ELLIPSE] = mxEllipse;
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_DOUBLE_ELLIPSE] = mxDoubleEllipse;
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_RHOMBUS] = mxRhombus;
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_IMAGE] = mxImageShape;
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_LINE] = mxLine;
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_LABEL] = mxLabel;
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_CYLINDER] = mxCylinder;
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_SWIMLANE] = mxSwimlane;
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_CONNECTOR] = mxConnector;
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_ACTOR] = mxActor;
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_CLOUD] = mxCloud;
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_TRIANGLE] = mxTriangle;
mxCellRenderer.prototype.defaultShapes[mxConstants.SHAPE_HEXAGON] = mxHexagon;
mxCellRenderer.prototype.registerShape = function(key, shape) {
	this.shapes[key] = shape;
};
mxCellRenderer.prototype.initialize = function(state) {
	var model = state.view.graph.getModel();
	if (state.view.graph.container != null && state.shape == null && state.cell != state.view.currentRoot && (model.isVertex(state.cell) || model.isEdge(state.cell))) {
		this.createShape(state);
		if (state.shape != null) {
			this.initializeShape(state);
			if (state.view.graph.ordered || model.isEdge(state.cell)) {
				state.invalidOrder = true;
			} else if (state.view.graph.keepEdgesInForeground && this.firstEdge != null) {
				if (this.firstEdge.parentNode == state.shape.node.parentNode) {
					this.insertState(state, this.firstEdge);
				} else {
					this.firstEdge = null;
				}
			}
			state.shape.scale = state.view.scale;
			this.createCellOverlays(state);
			this.installListeners(state);
		}
	}
};
mxCellRenderer.prototype.initializeShape = function(state) {
	state.shape.init(state.view.getDrawPane());
};
mxCellRenderer.prototype.getPreviousStateInContainer = function(state, container) {
	var result = null;
	var graph = state.view.graph;
	var model = graph.getModel();
	var child = state.cell;
	var p = model.getParent(child);
	while (p != null && result == null) {
		result = this.findPreviousStateInContainer(graph, p, child, container);
		child = p;
		p = model.getParent(child);
	}
	return result;
};
mxCellRenderer.prototype.findPreviousStateInContainer = function(graph, cell, stop, container) {
	var result = null;
	var model = graph.getModel();
	if (stop != null) {
		var start = cell.getIndex(stop);
		for (var i = start - 1; i >= 0 && result == null; i--) {
			result = this.findPreviousStateInContainer(graph, model.getChildAt(cell, i), null, container);
		}
	} else {
		var childCount = model.getChildCount(cell);
		for (var i = childCount - 1; i >= 0 && result == null; i--) {
			result = this.findPreviousStateInContainer(graph, model.getChildAt(cell, i), null, container);
		}
	}
	if (result == null) {
		result = graph.view.getState(cell);
		if (result != null && (result.shape == null || result.shape.node == null || result.shape.node.parentNode != container)) {
			result = null;
		}
	}
	return result;
};
mxCellRenderer.prototype.order = function(state) {
	var container = state.shape.node.parentNode;
	var previous = this.getPreviousStateInContainer(state, container);
	var nextNode = container.firstChild;
	if (previous != null) {
		nextNode = previous.shape.node;
		if (previous.text != null && previous.text.node != null && previous.text.node.parentNode == container) {
			nextNode = previous.text.node;
		}
		nextNode = nextNode.nextSibling;
	}
	this.insertState(state, nextNode);
};
mxCellRenderer.prototype.orderEdge = function(state) {
	var view = state.view;
	var model = view.graph.getModel();
	if (view.graph.keepEdgesInForeground) {
		if (this.firstEdge == null || this.firstEdge.parentNode == null || this.firstEdge.parentNode != state.shape.node.parentNode) {
			this.firstEdge = state.shape.node;
		}
	} else if (view.graph.keepEdgesInBackground) {
		var node = state.shape.node;
		var parent = node.parentNode;
		var pcell = model.getParent(state.cell);
		var pstate = view.getState(pcell);
		if (pstate != null && pstate.shape != null && pstate.shape.node != null) {
			var child = pstate.shape.node.nextSibling;
			if (child != null && child != node) {
				this.insertState(state, child);
			}
		} else {
			var child = parent.firstChild;
			if (child != null && child != node) {
				this.insertState(state, child);
			}
		}
	}
};
mxCellRenderer.prototype.insertState = function(state, nextNode) {
	state.shape.node.parentNode.insertBefore(state.shape.node, nextNode);
	if (state.text != null && state.text.node != null && state.text.node.parentNode == state.shape.node.parentNode) {
		state.shape.node.parentNode.insertBefore(state.text.node, state.shape.node.nextSibling);
	}
};
mxCellRenderer.prototype.createShape = function(state) {
	if (state.style != null) {
		var key = state.style[mxConstants.STYLE_SHAPE];
		var stencil = mxStencilRegistry.getStencil(key);
		if (stencil != null) {
			state.shape = new mxStencilShape(stencil);
		} else {
			var ctor = this.getShapeConstructor(state);
			state.shape = new ctor();
		}
		state.shape.points = state.absolutePoints;
		state.shape.bounds = new mxRectangle(state.x, state.y, state.width, state.height);
		state.shape.dialect = state.view.graph.dialect;
		this.configureShape(state);
	}
};
mxCellRenderer.prototype.getShapeConstructor = function(state) {
	var key = state.style[mxConstants.STYLE_SHAPE];
	var ctor = (key != null) ? this.shapes[key] : null;
	if (ctor == null) {
		ctor = (state.view.graph.getModel().isEdge(state.cell)) ? this.defaultEdgeShape: this.defaultVertexShape;
	}
	return ctor;
};
mxCellRenderer.prototype.configureShape = function(state) {
	state.shape.apply(state);
	var image = state.view.graph.getImage(state);
	if (image != null) {
		state.shape.image = image;
	}
	var indicator = state.view.graph.getIndicatorColor(state);
	var key = state.view.graph.getIndicatorShape(state);
	var ctor = (key != null) ? this.shapes[key] : null;
	if (indicator != null) {
		state.shape.indicatorShape = ctor;
		state.shape.indicatorColor = indicator;
		state.shape.indicatorGradientColor = state.view.graph.getIndicatorGradientColor(state);
		state.shape.indicatorDirection = state.style[mxConstants.STYLE_INDICATOR_DIRECTION];
	} else {
		var indicator = state.view.graph.getIndicatorImage(state);
		if (indicator != null) {
			state.shape.indicatorImage = indicator;
		}
	}
	this.postConfigureShape(state);
};
mxCellRenderer.prototype.postConfigureShape = function(state) {
	if (state.shape != null) {
		this.resolveColor(state, 'indicatorColor', mxConstants.STYLE_FILLCOLOR);
		this.resolveColor(state, 'indicatorGradientColor', mxConstants.STYLE_GRADIENTCOLOR);
		this.resolveColor(state, 'fill', mxConstants.STYLE_FILLCOLOR);
		this.resolveColor(state, 'stroke', mxConstants.STYLE_STROKECOLOR);
		this.resolveColor(state, 'gradient', mxConstants.STYLE_GRADIENTCOLOR);
	}
};
mxCellRenderer.prototype.resolveColor = function(state, field, key) {
	var value = state.shape[field];
	var graph = state.view.graph;
	var referenced = null;
	if (value == 'inherit') {
		referenced = graph.model.getParent(state.cell);
	} else if (value == 'swimlane') {
		if (graph.model.getTerminal(state.cell, false) != null) {
			referenced = graph.model.getTerminal(state.cell, false);
		} else {
			referenced = state.cell;
		}
		referenced = graph.getSwimlane(referenced);
		key = graph.swimlaneIndicatorColorAttribute;
	} else if (value == 'indicated') {
		state.shape[field] = state.shape.indicatorColor;
	}
	if (referenced != null) {
		var rstate = graph.getView().getState(referenced);
		state.shape[field] = null;
		if (rstate != null) {
			if (rstate.shape != null && field != 'indicatorColor') {
				state.shape[field] = rstate.shape[field];
			} else {
				state.shape[field] = rstate.style[key];
			}
		}
	}
};
mxCellRenderer.prototype.getLabelValue = function(state) {
	var graph = state.view.graph;
	var value = graph.getLabel(state.cell);
	if (!graph.isHtmlLabel(state.cell) && !mxUtils.isNode(value) && graph.dialect != mxConstants.DIALECT_SVG && value != null) {
		value = mxUtils.htmlEntities(value, false);
	}
	return value;
};
mxCellRenderer.prototype.createLabel = function(state, value) {
	var graph = state.view.graph;
	var isEdge = graph.getModel().isEdge(state.cell);
	if (state.style[mxConstants.STYLE_FONTSIZE] > 0 || state.style[mxConstants.STYLE_FONTSIZE] == null) {
		var isForceHtml = (graph.isHtmlLabel(state.cell) || (value != null && mxUtils.isNode(value))) && graph.dialect == mxConstants.DIALECT_SVG;
		state.text = new mxText(value, new mxRectangle(), (state.style[mxConstants.STYLE_ALIGN] || mxConstants.ALIGN_CENTER), graph.getVerticalAlign(state), state.style[mxConstants.STYLE_FONTCOLOR], state.style[mxConstants.STYLE_FONTFAMILY], state.style[mxConstants.STYLE_FONTSIZE], state.style[mxConstants.STYLE_FONTSTYLE], state.style[mxConstants.STYLE_SPACING], state.style[mxConstants.STYLE_SPACING_TOP], state.style[mxConstants.STYLE_SPACING_RIGHT], state.style[mxConstants.STYLE_SPACING_BOTTOM], state.style[mxConstants.STYLE_SPACING_LEFT], state.style[mxConstants.STYLE_HORIZONTAL], state.style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR], state.style[mxConstants.STYLE_LABEL_BORDERCOLOR], graph.isWrapping(state.cell) && graph.isHtmlLabel(state.cell), graph.isLabelClipped(state.cell), state.style[mxConstants.STYLE_OVERFLOW], state.style[mxConstants.STYLE_LABEL_PADDING]);
		state.text.opacity = state.style[mxConstants.STYLE_TEXT_OPACITY];
		state.text.dialect = (isForceHtml) ? mxConstants.DIALECT_STRICTHTML: state.view.graph.dialect;
		this.initializeLabel(state);
		var forceGetCell = false;
		var getState = function(evt) {
			var result = state;
			if (mxClient.IS_TOUCH || forceGetCell) {
				var x = mxEvent.getClientX(evt);
				var y = mxEvent.getClientY(evt);
				var pt = mxUtils.convertPoint(graph.container, x, y);
				result = graph.view.getState(graph.getCellAt(pt.x, pt.y));
			}
			return result;
		};
		var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
		var mm = (mxClient.IS_TOUCH) ? 'touchmove': 'mousemove';
		var mu = (mxClient.IS_TOUCH) ? 'touchend': 'mouseup';
		mxEvent.addListener(state.text.node, md, mxUtils.bind(this,
		function(evt) {
			if (this.isLabelEvent(state, evt)) {
				graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt, state));
				forceGetCell = graph.dialect != mxConstants.DIALECT_SVG && mxEvent.getSource(evt).nodeName == 'IMG';
			}
		}));
		mxEvent.addListener(state.text.node, mm, mxUtils.bind(this,
		function(evt) {
			if (this.isLabelEvent(state, evt)) {
				graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt, getState(evt)));
			}
		}));
		mxEvent.addListener(state.text.node, mu, mxUtils.bind(this,
		function(evt) {
			if (this.isLabelEvent(state, evt)) {
				graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt, getState(evt)));
				forceGetCell = false;
			}
		}));
		mxEvent.addListener(state.text.node, 'dblclick', mxUtils.bind(this,
		function(evt) {
			if (this.isLabelEvent(state, evt)) {
				graph.dblClick(evt, state.cell);
				mxEvent.consume(evt);
			}
		}));
	}
};
mxCellRenderer.prototype.initializeLabel = function(state) {
	var graph = state.view.graph;
	if (state.text.dialect != mxConstants.DIALECT_SVG) {
		if (mxClient.IS_SVG && mxClient.NO_FO) {
			state.text.init(graph.container);
		} else if (mxUtils.isVml(state.view.getDrawPane())) {
			if (state.shape.label != null) {
				state.text.init(state.shape.label);
			} else {
				state.text.init(state.shape.node);
			}
		}
	}
	if (state.text.node == null) {
		state.text.init(state.view.getDrawPane());
		if (state.shape != null && state.text != null) {
			state.shape.node.parentNode.insertBefore(state.text.node, state.shape.node.nextSibling);
		}
	}
};
mxCellRenderer.prototype.createCellOverlays = function(state) {
	var graph = state.view.graph;
	var overlays = graph.getCellOverlays(state.cell);
	if (overlays != null) {
		if (state.overlays == null) {
			state.overlays = [];
		}
		for (var i = 0; i < overlays.length; i++) {
			if (state.overlays[i] == null) {
				var tmp = new mxImageShape(new mxRectangle(), overlays[i].image.src);
				tmp.dialect = state.view.graph.dialect;
				tmp.overlay = overlays[i];
				this.initializeOverlay(state, tmp);
				this.installCellOverlayListeners(state, overlays[i], tmp);
				if (overlays[i].cursor != null) {
					tmp.node.style.cursor = overlays[i].cursor;
				}
				state.overlays[i] = tmp;
			}
		}
	}
};
mxCellRenderer.prototype.initializeOverlay = function(state, overlay) {
	overlay.init(state.view.getOverlayPane());
};
mxCellRenderer.prototype.installCellOverlayListeners = function(state, overlay, shape) {
	var graph = state.view.graph;
	mxEvent.addListener(shape.node, 'click',
	function(evt) {
		if (graph.isEditing()) {
			graph.stopEditing(!graph.isInvokesStopCellEditing());
		}
		overlay.fireEvent(new mxEventObject(mxEvent.CLICK, 'event', evt, 'cell', state.cell));
	});
	var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
	var mm = (mxClient.IS_TOUCH) ? 'touchmove': 'mousemove';
	mxEvent.addListener(shape.node, md,
	function(evt) {
		mxEvent.consume(evt);
	});
	mxEvent.addListener(shape.node, mm,
	function(evt) {
		graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt, state));
	});
	if (mxClient.IS_TOUCH) {
		mxEvent.addListener(shape.node, 'touchend',
		function(evt) {
			overlay.fireEvent(new mxEventObject(mxEvent.CLICK, 'event', evt, 'cell', state.cell));
		});
	}
};
mxCellRenderer.prototype.createControl = function(state) {
	var graph = state.view.graph;
	var image = graph.getFoldingImage(state);
	if (graph.foldingEnabled && image != null) {
		if (state.control == null) {
			var b = new mxRectangle(0, 0, image.width, image.height);
			state.control = new mxImageShape(b, image.src);
			state.control.dialect = graph.dialect;
			state.control.preserveImageAspect = false;
			this.initControl(state, state.control, true,
			function(evt) {
				if (graph.isEnabled()) {
					var collapse = !graph.isCellCollapsed(state.cell);
					graph.foldCells(collapse, false, [state.cell]);
					mxEvent.consume(evt);
				}
			});
		}
	} else if (state.control != null) {
		state.control.destroy();
		state.control = null;
	}
};
mxCellRenderer.prototype.initControl = function(state, control, handleEvents, clickHandler) {
	var graph = state.view.graph;
	var isForceHtml = graph.isHtmlLabel(state.cell) && mxClient.NO_FO && graph.dialect == mxConstants.DIALECT_SVG;
	if (isForceHtml) {
		control.dialect = mxConstants.DIALECT_PREFERHTML;
		control.init(graph.container);
		control.node.style.zIndex = 1;
	} else {
		control.init(state.view.getOverlayPane());
	}
	var node = control.innerNode || control.node;
	if (clickHandler) {
		if (graph.isEnabled()) {
			node.style.cursor = 'pointer';
		}
		mxEvent.addListener(node, 'click', clickHandler);
	}
	if (handleEvents) {
		var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
		var mm = (mxClient.IS_TOUCH) ? 'touchmove': 'mousemove';
		mxEvent.addListener(node, md,
		function(evt) {
			graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt, state));
			mxEvent.consume(evt);
		});
		mxEvent.addListener(node, mm,
		function(evt) {
			graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt, state));
		});
	}
	return node;
};
mxCellRenderer.prototype.isShapeEvent = function(state, evt) {
	return true;
};
mxCellRenderer.prototype.isLabelEvent = function(state, evt) {
	return true;
};
mxCellRenderer.prototype.installListeners = function(state) {
	var graph = state.view.graph;
	if (graph.dialect == mxConstants.DIALECT_SVG) {
		var events = 'all';
		if (graph.getModel().isEdge(state.cell) && state.shape.stroke != null && state.shape.fill == null) {
			events = 'visibleStroke';
		}
		if (state.shape.innerNode != null) {
			state.shape.innerNode.setAttribute('pointer-events', events);
		} else {
			state.shape.node.setAttribute('pointer-events', events);
		}
	}
	var getState = function(evt) {
		var result = state;
		if ((graph.dialect != mxConstants.DIALECT_SVG && mxEvent.getSource(evt).nodeName == 'IMG') || mxClient.IS_TOUCH) {
			var x = mxEvent.getClientX(evt);
			var y = mxEvent.getClientY(evt);
			var pt = mxUtils.convertPoint(graph.container, x, y);
			result = graph.view.getState(graph.getCellAt(pt.x, pt.y));
		}
		return result;
	};
	var gestureInProgress = false;
	mxEvent.addListener(state.shape.node, 'gesturestart', mxUtils.bind(this,
	function(evt) {
		graph.lastTouchTime = 0;
		gestureInProgress = true;
		mxEvent.consume(evt);
	}));
	var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
	var mm = (mxClient.IS_TOUCH) ? 'touchmove': 'mousemove';
	var mu = (mxClient.IS_TOUCH) ? 'touchend': 'mouseup';
	mxEvent.addListener(state.shape.node, md, mxUtils.bind(this,
	function(evt) {
		if (this.isShapeEvent(state, evt) && !gestureInProgress) {
			graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt, (state.shape != null && mxEvent.getSource(evt) == state.shape.content) ? null: state));
		} else if (gestureInProgress) {
			mxEvent.consume(evt);
		}
	}));
	mxEvent.addListener(state.shape.node, mm, mxUtils.bind(this,
	function(evt) {
		if (this.isShapeEvent(state, evt) && !gestureInProgress) {
			graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt, (state.shape != null && mxEvent.getSource(evt) == state.shape.content) ? null: getState(evt)));
		} else if (gestureInProgress) {
			mxEvent.consume(evt);
		}
	}));
	mxEvent.addListener(state.shape.node, mu, mxUtils.bind(this,
	function(evt) {
		if (this.isShapeEvent(state, evt) && !gestureInProgress) {
			graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt, (state.shape != null && mxEvent.getSource(evt) == state.shape.content) ? null: getState(evt)));
		} else if (gestureInProgress) {
			mxEvent.consume(evt);
		}
	}));
	var dc = (mxClient.IS_TOUCH) ? 'gestureend': 'dblclick';
	mxEvent.addListener(state.shape.node, dc, mxUtils.bind(this,
	function(evt) {
		gestureInProgress = false;
		if (dc == 'gestureend') {
			graph.lastTouchTime = 0;
			if (graph.gestureEnabled) {
				graph.handleGesture(state, evt);
				mxEvent.consume(evt);
			}
		} else if (this.isShapeEvent(state, evt)) {
			graph.dblClick(evt, (state.shape != null && mxEvent.getSource(evt) == state.shape.content) ? null: state.cell);
			mxEvent.consume(evt);
		}
	}));
};
mxCellRenderer.prototype.redrawLabel = function(state) {
	var value = this.getLabelValue(state);
	if (state.text == null && value != null && (mxUtils.isNode(value) || value.length > 0)) {
		this.createLabel(state, value);
	} else if (state.text != null && (value == null || value.length == 0)) {
		state.text.destroy();
		state.text = null;
	}
	if (state.text != null) {
		var graph = state.view.graph;
		var wrapping = graph.isWrapping(state.cell);
		var clipping = graph.isLabelClipped(state.cell);
		var bounds = this.getLabelBounds(state);
		if (state.text.value != value || state.text.isWrapping != wrapping || state.text.isClipping != clipping || state.text.scale != state.view.scale || !state.text.bounds.equals(bounds)) {
			state.text.value = value;
			state.text.bounds = bounds;
			state.text.scale = this.getTextScale(state);
			state.text.isWrapping = wrapping;
			state.text.isClipping = clipping;
			state.text.redraw();
		}
	}
};
mxCellRenderer.prototype.getTextScale = function(state) {
	return state.view.scale;
};
mxCellRenderer.prototype.getLabelBounds = function(state) {
	var graph = state.view.graph;
	var isEdge = graph.getModel().isEdge(state.cell);
	var bounds = new mxRectangle(state.absoluteOffset.x, state.absoluteOffset.y);
	if (!isEdge) {
		bounds.x += state.x;
		bounds.y += state.y;
		bounds.width = Math.max(1, state.width);
		bounds.height = Math.max(1, state.height);
		if (graph.isSwimlane(state.cell)) {
			var scale = graph.view.scale;
			var size = graph.getStartSize(state.cell);
			if (size.width > 0) {
				bounds.width = size.width * scale;
			} else if (size.height > 0) {
				bounds.height = size.height * scale;
			}
		}
	}
	return bounds;
};
mxCellRenderer.prototype.redrawCellOverlays = function(state) {
	var overlays = state.view.graph.getCellOverlays(state.cell);
	var oldCount = (state.overlays != null) ? state.overlays.length: 0;
	var newCount = (overlays != null) ? overlays.length: 0;
	if (oldCount != newCount) {
		if (oldCount > 0) {
			var newOverlayShapes = [];
			for (var i = 0; i < state.overlays.length; i++) {
				var index = mxUtils.indexOf(overlays, state.overlays[i].overlay);
				if (index >= 0) {
					newOverlayShapes[index] = state.overlays[i];
				} else {
					state.overlays[i].destroy();
				}
			}
			state.overlays = newOverlayShapes;
		}
		if (newCount > 0) {
			this.createCellOverlays(state);
		} else {
			state.overlays = null;
		}
	}
	if (state.overlays != null) {
		for (var i = 0; i < overlays.length; i++) {
			var bounds = overlays[i].getBounds(state);
			if (state.overlays[i].bounds == null || state.overlays[i].scale != state.view.scale || !state.overlays[i].bounds.equals(bounds)) {
				state.overlays[i].bounds = bounds;
				state.overlays[i].scale = state.view.scale;
				state.overlays[i].redraw();
			}
		}
	}
};
mxCellRenderer.prototype.redrawControl = function(state) {
	if (state.control != null) {
		var bounds = this.getControlBounds(state);
		var s = state.view.scale;
		if (state.control.scale != s || !state.control.bounds.equals(bounds)) {
			state.control.bounds = bounds;
			state.control.scale = s;
			state.control.redraw();
		}
	}
};
mxCellRenderer.prototype.getControlBounds = function(state) {
	if (state.control != null) {
		var oldScale = state.control.scale;
		var w = state.control.bounds.width / oldScale;
		var h = state.control.bounds.height / oldScale;
		var s = state.view.scale;
		return (state.view.graph.getModel().isEdge(state.cell)) ? new mxRectangle(state.x + state.width / 2 - w / 2 * s, state.y + state.height / 2 - h / 2 * s, w * s, h * s) : new mxRectangle(state.x + w / 2 * s, state.y + h / 2 * s, w * s, h * s);
	}
	return null;
};
mxCellRenderer.prototype.redraw = function(state) {
	if (state.shape != null) {
		var model = state.view.graph.getModel();
		var isEdge = model.isEdge(state.cell);
		var reconfigure = false;
		this.createControl(state);
		if (state.orderChanged || state.invalidOrder) {
			if (state.view.graph.ordered) {
				this.order(state);
			} else {
				this.orderEdge(state);
			}
			reconfigure = state.orderChanged;
		}
		delete state.invalidOrder;
		delete state.orderChanged;
		if (!reconfigure && !mxUtils.equalEntries(state.shape.style, state.style)) {
			reconfigure = true;
		}
		if (reconfigure) {
			this.configureShape(state);
			state.shape.reconfigure();
		}
		if (state.shape.bounds == null || state.shape.scale != state.view.scale || !state.shape.bounds.equals(state) || !mxUtils.equalPoints(state.shape.points, state.absolutePoints)) {
			if (state.absolutePoints != null) {
				state.shape.points = state.absolutePoints.slice();
			} else {
				state.shape.points = null;
			}
			state.shape.bounds = new mxRectangle(state.x, state.y, state.width, state.height);
			state.shape.scale = state.view.scale;
			state.shape.redraw();
		}
		this.redrawLabel(state);
		this.redrawCellOverlays(state);
		this.redrawControl(state);
	}
};
mxCellRenderer.prototype.destroy = function(state) {
	if (state.shape != null) {
		if (state.text != null) {
			state.text.destroy();
			state.text = null;
		}
		if (state.overlays != null) {
			for (var i = 0; i < state.overlays.length; i++) {
				state.overlays[i].destroy();
			}
			state.overlays = null;
		}
		if (state.control != null) {
			state.control.destroy();
			state.control = null;
		}
		state.shape.destroy();
		state.shape = null;
	}
};
var mxEdgeStyle = {
	EntityRelation: function(state, source, target, points, result) {
		var view = state.view;
		var graph = view.graph;
		var segment = mxUtils.getValue(state.style, mxConstants.STYLE_SEGMENT, mxConstants.ENTITY_SEGMENT) * view.scale;
		var pts = state.absolutePoints;
		var p0 = pts[0];
		var pe = pts[pts.length - 1];
		var isSourceLeft = false;
		if (p0 != null) {
			source = new mxCellState();
			source.x = p0.x;
			source.y = p0.y;
		} else if (source != null) {
			var constraint = mxUtils.getPortConstraints(source, state, true, mxConstants.DIRECTION_MASK_NONE);
			if (constraint != mxConstants.DIRECTION_MASK_NONE) {
				isSourceLeft = constraint == mxConstants.DIRECTION_MASK_WEST;
			} else {
				var sourceGeometry = graph.getCellGeometry(source.cell);
				if (sourceGeometry.relative) {
					isSourceLeft = sourceGeometry.x <= 0.5;
				} else if (target != null) {
					isSourceLeft = target.x + target.width < source.x;
				}
			}
		} else {
			return;
		}
		var isTargetLeft = true;
		if (pe != null) {
			target = new mxCellState();
			target.x = pe.x;
			target.y = pe.y;
		} else if (target != null) {
			var constraint = mxUtils.getPortConstraints(target, state, false, mxConstants.DIRECTION_MASK_NONE);
			if (constraint != mxConstants.DIRECTION_MASK_NONE) {
				isTargetLeft = constraint == mxConstants.DIRECTION_MASK_WEST;
			} else {
				var targetGeometry = graph.getCellGeometry(target.cell);
				if (targetGeometry.relative) {
					isTargetLeft = targetGeometry.x <= 0.5;
				} else if (source != null) {
					isTargetLeft = source.x + source.width < target.x;
				}
			}
		}
		if (source != null && target != null) {
			var x0 = (isSourceLeft) ? source.x: source.x + source.width;
			var y0 = view.getRoutingCenterY(source);
			var xe = (isTargetLeft) ? target.x: target.x + target.width;
			var ye = view.getRoutingCenterY(target);
			var seg = segment;
			var dx = (isSourceLeft) ? -seg: seg;
			var dep = new mxPoint(x0 + dx, y0);
			dx = (isTargetLeft) ? -seg: seg;
			var arr = new mxPoint(xe + dx, ye);
			if (isSourceLeft == isTargetLeft) {
				var x = (isSourceLeft) ? Math.min(x0, xe) - segment: Math.max(x0, xe) + segment;
				result.push(new mxPoint(x, y0));
				result.push(new mxPoint(x, ye));
			} else if ((dep.x < arr.x) == isSourceLeft) {
				var midY = y0 + (ye - y0) / 2;
				result.push(dep);
				result.push(new mxPoint(dep.x, midY));
				result.push(new mxPoint(arr.x, midY));
				result.push(arr);
			} else {
				result.push(dep);
				result.push(arr);
			}
		}
	},
	Loop: function(state, source, target, points, result) {
		if (source != null) {
			var view = state.view;
			var graph = view.graph;
			var pt = (points != null && points.length > 0) ? points[0] : null;
			if (pt != null) {
				pt = view.transformControlPoint(state, pt);
				if (mxUtils.contains(source, pt.x, pt.y)) {
					pt = null;
				}
			}
			var x = 0;
			var dx = 0;
			var y = 0;
			var dy = 0;
			var seg = mxUtils.getValue(state.style, mxConstants.STYLE_SEGMENT, graph.gridSize) * view.scale;
			var dir = mxUtils.getValue(state.style, mxConstants.STYLE_DIRECTION, mxConstants.DIRECTION_WEST);
			if (dir == mxConstants.DIRECTION_NORTH || dir == mxConstants.DIRECTION_SOUTH) {
				x = view.getRoutingCenterX(source);
				dx = seg;
			} else {
				y = view.getRoutingCenterY(source);
				dy = seg;
			}
			if (pt == null || pt.x < source.x || pt.x > source.x + source.width) {
				if (pt != null) {
					x = pt.x;
					dy = Math.max(Math.abs(y - pt.y), dy);
				} else {
					if (dir == mxConstants.DIRECTION_NORTH) {
						y = source.y - 2 * dx;
					} else if (dir == mxConstants.DIRECTION_SOUTH) {
						y = source.y + source.height + 2 * dx;
					} else if (dir == mxConstants.DIRECTION_EAST) {
						x = source.x - 2 * dy;
					} else {
						x = source.x + source.width + 2 * dy;
					}
				}
			} else if (pt != null) {
				x = view.getRoutingCenterX(source);
				dx = Math.max(Math.abs(x - pt.x), dy);
				y = pt.y;
				dy = 0;
			}
			result.push(new mxPoint(x - dx, y - dy));
			result.push(new mxPoint(x + dx, y + dy));
		}
	},
	ElbowConnector: function(state, source, target, points, result) {
		var pt = (points != null && points.length > 0) ? points[0] : null;
		var vertical = false;
		var horizontal = false;
		if (source != null && target != null) {
			if (pt != null) {
				var left = Math.min(source.x, target.x);
				var right = Math.max(source.x + source.width, target.x + target.width);
				var top = Math.min(source.y, target.y);
				var bottom = Math.max(source.y + source.height, target.y + target.height);
				pt = state.view.transformControlPoint(state, pt);
				vertical = pt.y < top || pt.y > bottom;
				horizontal = pt.x < left || pt.x > right;
			} else {
				var left = Math.max(source.x, target.x);
				var right = Math.min(source.x + source.width, target.x + target.width);
				vertical = left == right;
				if (!vertical) {
					var top = Math.max(source.y, target.y);
					var bottom = Math.min(source.y + source.height, target.y + target.height);
					horizontal = top == bottom;
				}
			}
		}
		if (!horizontal && (vertical || state.style[mxConstants.STYLE_ELBOW] == mxConstants.ELBOW_VERTICAL)) {
			mxEdgeStyle.TopToBottom(state, source, target, points, result);
		} else {
			mxEdgeStyle.SideToSide(state, source, target, points, result);
		}
	},
	SideToSide: function(state, source, target, points, result) {
		var view = state.view;
		var pt = (points != null && points.length > 0) ? points[0] : null;
		var pts = state.absolutePoints;
		var p0 = pts[0];
		var pe = pts[pts.length - 1];
		if (pt != null) {
			pt = view.transformControlPoint(state, pt);
		}
		if (p0 != null) {
			source = new mxCellState();
			source.x = p0.x;
			source.y = p0.y;
		}
		if (pe != null) {
			target = new mxCellState();
			target.x = pe.x;
			target.y = pe.y;
		}
		if (source != null && target != null) {
			var l = Math.max(source.x, target.x);
			var r = Math.min(source.x + source.width, target.x + target.width);
			var x = (pt != null) ? pt.x: r + (l - r) / 2;
			var y1 = view.getRoutingCenterY(source);
			var y2 = view.getRoutingCenterY(target);
			if (pt != null) {
				if (p0 != null && pt.y >= source.y && pt.y <= source.y + source.height) {
					y1 = pt.y;
				}
				if (pe != null && pt.y >= target.y && pt.y <= target.y + target.height) {
					y2 = pt.y;
				}
			}
			if (!mxUtils.contains(target, x, y1) && !mxUtils.contains(source, x, y1)) {
				result.push(new mxPoint(x, y1));
			}
			if (!mxUtils.contains(target, x, y2) && !mxUtils.contains(source, x, y2)) {
				result.push(new mxPoint(x, y2));
			}
			if (result.length == 1) {
				if (pt != null) {
					if (!mxUtils.contains(target, x, pt.y) && !mxUtils.contains(source, x, pt.y)) {
						result.push(new mxPoint(x, pt.y));
					}
				} else {
					var t = Math.max(source.y, target.y);
					var b = Math.min(source.y + source.height, target.y + target.height);
					result.push(new mxPoint(x, t + (b - t) / 2));
				}
			}
		}
	},
	TopToBottom: function(state, source, target, points, result) {
		var view = state.view;
		var pt = (points != null && points.length > 0) ? points[0] : null;
		var pts = state.absolutePoints;
		var p0 = pts[0];
		var pe = pts[pts.length - 1];
		if (pt != null) {
			pt = view.transformControlPoint(state, pt);
		}
		if (p0 != null) {
			source = new mxCellState();
			source.x = p0.x;
			source.y = p0.y;
		}
		if (pe != null) {
			target = new mxCellState();
			target.x = pe.x;
			target.y = pe.y;
		}
		if (source != null && target != null) {
			var t = Math.max(source.y, target.y);
			var b = Math.min(source.y + source.height, target.y + target.height);
			var x = view.getRoutingCenterX(source);
			if (pt != null && pt.x >= source.x && pt.x <= source.x + source.width) {
				x = pt.x;
			}
			var y = (pt != null) ? pt.y: b + (t - b) / 2;
			if (!mxUtils.contains(target, x, y) && !mxUtils.contains(source, x, y)) {
				result.push(new mxPoint(x, y));
			}
			if (pt != null && pt.x >= target.x && pt.x <= target.x + target.width) {
				x = pt.x;
			} else {
				x = view.getRoutingCenterX(target);
			}
			if (!mxUtils.contains(target, x, y) && !mxUtils.contains(source, x, y)) {
				result.push(new mxPoint(x, y));
			}
			if (result.length == 1) {
				if (pt != null && result.length == 1) {
					if (!mxUtils.contains(target, pt.x, y) && !mxUtils.contains(source, pt.x, y)) {
						result.push(new mxPoint(pt.x, y));
					}
				} else {
					var l = Math.max(source.x, target.x);
					var r = Math.min(source.x + source.width, target.x + target.width);
					result.push(new mxPoint(l + (r - l) / 2, y));
				}
			}
		}
	},
	SegmentConnector: function(state, source, target, hints, result) {
		var pts = state.absolutePoints;
		var horizontal = true;
		var hint = null;
		var pt = pts[0];
		if (pt == null && source != null) {
			pt = new mxPoint(state.view.getRoutingCenterX(source), state.view.getRoutingCenterY(source));
		} else if (pt != null) {
			pt = pt.clone();
		}
		var lastInx = pts.length - 1;
		if (hints != null && hints.length > 0) {
			hint = state.view.transformControlPoint(state, hints[0]);
			var currentTerm = source;
			var currentPt = pts[0];
			var hozChan = false;
			var vertChan = false;
			var currentHint = hint;
			var hintsLen = hints.length;
			for (var i = 0; i < 2; i++) {
				var fixedVertAlign = currentPt != null && currentPt.x == currentHint.x;
				var fixedHozAlign = currentPt != null && currentPt.y == currentHint.y;
				var inHozChan = currentTerm != null && (currentHint.y >= currentTerm.y && currentHint.y <= currentTerm.y + currentTerm.height);
				var inVertChan = currentTerm != null && (currentHint.x >= currentTerm.x && currentHint.x <= currentTerm.x + currentTerm.width);
				hozChan = fixedHozAlign || (currentPt == null && inHozChan);
				vertChan = fixedVertAlign || (currentPt == null && inVertChan);
				if (currentPt != null && (!fixedHozAlign && !fixedVertAlign) && (inHozChan || inVertChan)) {
					horizontal = inHozChan ? false: true;
					break;
				}
				if (vertChan || hozChan) {
					horizontal = hozChan;
					if (i == 1) {
						horizontal = hints.length % 2 == 0 ? hozChan: vertChan;
					}
					break;
				}
				currentTerm = target;
				currentPt = pts[lastInx];
				currentHint = state.view.transformControlPoint(state, hints[hintsLen - 1]);
			}
			if (horizontal && ((pts[0] != null && pts[0].y != hint.y) || (pts[0] == null && source != null && (hint.y < source.y || hint.y > source.y + source.height)))) {
				result.push(new mxPoint(pt.x, hint.y));
			} else if (!horizontal && ((pts[0] != null && pts[0].x != hint.x) || (pts[0] == null && source != null && (hint.x < source.x || hint.x > source.x + source.width)))) {
				result.push(new mxPoint(hint.x, pt.y));
			}
			if (horizontal) {
				pt.y = hint.y;
			} else {
				pt.x = hint.x;
			}
			for (var i = 0; i < hints.length; i++) {
				horizontal = !horizontal;
				hint = state.view.transformControlPoint(state, hints[i]);
				if (horizontal) {
					pt.y = hint.y;
				} else {
					pt.x = hint.x;
				}
				result.push(pt.clone());
			}
		} else {
			hint = pt;
			horizontal = true;
		}
		pt = pts[lastInx];
		if (pt == null && target != null) {
			pt = new mxPoint(state.view.getRoutingCenterX(target), state.view.getRoutingCenterY(target));
		}
		if (horizontal && ((pts[lastInx] != null && pts[lastInx].y != hint.y) || (pts[lastInx] == null && target != null && (hint.y < target.y || hint.y > target.y + target.height)))) {
			result.push(new mxPoint(pt.x, hint.y));
		} else if (!horizontal && ((pts[lastInx] != null && pts[lastInx].x != hint.x) || (pts[lastInx] == null && target != null && (hint.x < target.x || hint.x > target.x + target.width)))) {
			result.push(new mxPoint(hint.x, pt.y));
		}
		if (pts[0] == null && source != null) {
			while (result.length > 1 && mxUtils.contains(source, result[1].x, result[1].y)) {
				result = result.splice(1, 1);
			}
		}
		if (pts[lastInx] == null && target != null) {
			while (result.length > 1 && mxUtils.contains(target, result[result.length - 1].x, result[result.length - 1].y)) {
				result = result.splice(result.length - 1, 1);
			}
		}
	},
	orthBuffer: 10,
	dirVectors: [[ - 1, 0], [0, -1], [1, 0], [0, 1], [ - 1, 0], [0, -1], [1, 0]],
	wayPoints1: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	routePatterns: [[[513, 2308, 2081, 2562], [513, 1090, 514, 2184, 2114, 2561], [513, 1090, 514, 2564, 2184, 2562], [513, 2308, 2561, 1090, 514, 2568, 2308]], [[514, 1057, 513, 2308, 2081, 2562], [514, 2184, 2114, 2561], [514, 2184, 2562, 1057, 513, 2564, 2184], [514, 1057, 513, 2568, 2308, 2561]], [[1090, 514, 1057, 513, 2308, 2081, 2562], [2114, 2561], [1090, 2562, 1057, 513, 2564, 2184], [1090, 514, 1057, 513, 2308, 2561, 2568]], [[2081, 2562], [1057, 513, 1090, 514, 2184, 2114, 2561], [1057, 513, 1090, 514, 2184, 2562, 2564], [1057, 2561, 1090, 514, 2568, 2308]]],
	inlineRoutePatterns: [[null, [2114, 2568], null, null], [null, [514, 2081, 2114, 2568], null, null], [null, [2114, 2561], null, null], [[2081, 2562], [1057, 2114, 2568], [2184, 2562], null]],
	vertexSeperations: [],
	limits: [[0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0]],
	LEFT_MASK: 32,
	TOP_MASK: 64,
	RIGHT_MASK: 128,
	BOTTOM_MASK: 256,
	LEFT: 1,
	TOP: 2,
	RIGHT: 4,
	BOTTOM: 8,
	SIDE_MASK: 480,
	CENTER_MASK: 512,
	SOURCE_MASK: 1024,
	TARGET_MASK: 2048,
	VERTEX_MASK: 3072,
	OrthConnector: function(state, source, target, points, result) {
		var graph = state.view.graph;
		var sourceEdge = source == null ? false: graph.getModel().isEdge(source.cell);
		var targetEdge = target == null ? false: graph.getModel().isEdge(target.cell);
		if ((points != null && points.length > 0) || (sourceEdge) || (targetEdge)) {
			mxEdgeStyle.SegmentConnector(state, source, target, points, result);
			return;
		}
		var pts = state.absolutePoints;
		var p0 = pts[0];
		var pe = pts[pts.length - 1];
		var sourceX = source != null ? source.x: p0.x;
		var sourceY = source != null ? source.y: p0.y;
		var sourceWidth = source != null ? source.width: 1;
		var sourceHeight = source != null ? source.height: 1;
		var targetX = target != null ? target.x: pe.x;
		var targetY = target != null ? target.y: pe.y;
		var targetWidth = target != null ? target.width: 1;
		var targetHeight = target != null ? target.height: 1;
		var scaledOrthBuffer = state.view.scale * mxEdgeStyle.orthBuffer;
		var portConstraint = [mxConstants.DIRECTION_MASK_ALL, mxConstants.DIRECTION_MASK_ALL];
		if (source != null) {
			portConstraint[0] = mxUtils.getPortConstraints(source, state, true, mxConstants.DIRECTION_MASK_ALL);
		}
		if (target != null) {
			portConstraint[1] = mxUtils.getPortConstraints(target, state, false, mxConstants.DIRECTION_MASK_ALL);
		}
		var dir = [0, 0];
		var geo = [[sourceX, sourceY, sourceWidth, sourceHeight], [targetX, targetY, targetWidth, targetHeight]];
		for (var i = 0; i < 2; i++) {
			mxEdgeStyle.limits[i][1] = geo[i][0] - scaledOrthBuffer;
			mxEdgeStyle.limits[i][2] = geo[i][1] - scaledOrthBuffer;
			mxEdgeStyle.limits[i][4] = geo[i][0] + geo[i][2] + scaledOrthBuffer;
			mxEdgeStyle.limits[i][8] = geo[i][1] + geo[i][3] + scaledOrthBuffer;
		}
		var sourceCenX = geo[0][0] + geo[0][2] / 2.0;
		var sourceCenY = geo[0][1] + geo[0][3] / 2.0;
		var targetCenX = geo[1][0] + geo[1][2] / 2.0;
		var targetCenY = geo[1][1] + geo[1][3] / 2.0;
		var dx = sourceCenX - targetCenX;
		var dy = sourceCenY - targetCenY;
		var quad = 0;
		if (dx < 0) {
			if (dy < 0) {
				quad = 2;
			} else {
				quad = 1;
			}
		} else {
			if (dy <= 0) {
				quad = 3;
				if (dx == 0) {
					quad = 2;
				}
			}
		}
		var currentTerm = null;
		if (source != null) {
			currentTerm = p0;
		}
		var constraint = [[0.5, 0.5], [0.5, 0.5]];
		for (var i = 0; i < 2; i++) {
			if (currentTerm != null) {
				constraint[i][0] = (currentTerm.x - geo[i][0]) / geo[i][2];
				if (constraint[i][0] < 0.01) {
					dir[i] = mxConstants.DIRECTION_MASK_WEST;
				} else if (constraint[i][0] > 0.99) {
					dir[i] = mxConstants.DIRECTION_MASK_EAST;
				}
				constraint[i][1] = (currentTerm.y - geo[i][1]) / geo[i][3];
				if (constraint[i][1] < 0.01) {
					dir[i] = mxConstants.DIRECTION_MASK_NORTH;
				} else if (constraint[i][1] > 0.99) {
					dir[i] = mxConstants.DIRECTION_MASK_SOUTH;
				}
			}
			currentTerm = null;
			if (target != null) {
				currentTerm = pe;
			}
		}
		var sourceTopDist = geo[0][1] - (geo[1][1] + geo[1][3]);
		var sourceLeftDist = geo[0][0] - (geo[1][0] + geo[1][2]);
		var sourceBottomDist = geo[1][1] - (geo[0][1] + geo[0][3]);
		var sourceRightDist = geo[1][0] - (geo[0][0] + geo[0][2]);
		mxEdgeStyle.vertexSeperations[1] = Math.max(sourceLeftDist - 2 * scaledOrthBuffer, 0);
		mxEdgeStyle.vertexSeperations[2] = Math.max(sourceTopDist - 2 * scaledOrthBuffer, 0);
		mxEdgeStyle.vertexSeperations[4] = Math.max(sourceBottomDist - 2 * scaledOrthBuffer, 0);
		mxEdgeStyle.vertexSeperations[3] = Math.max(sourceRightDist - 2 * scaledOrthBuffer, 0);
		var dirPref = [];
		var horPref = [];
		var vertPref = [];
		horPref[0] = (sourceLeftDist >= sourceRightDist) ? mxConstants.DIRECTION_MASK_WEST: mxConstants.DIRECTION_MASK_EAST;
		vertPref[0] = (sourceTopDist >= sourceBottomDist) ? mxConstants.DIRECTION_MASK_NORTH: mxConstants.DIRECTION_MASK_SOUTH;
		horPref[1] = mxUtils.reversePortConstraints(horPref[0]);
		vertPref[1] = mxUtils.reversePortConstraints(vertPref[0]);
		var preferredHorizDist = sourceLeftDist >= sourceRightDist ? sourceLeftDist: sourceRightDist;
		var preferredVertDist = sourceTopDist >= sourceBottomDist ? sourceTopDist: sourceBottomDist;
		var prefOrdering = [[0, 0], [0, 0]];
		var preferredOrderSet = false;
		for (var i = 0; i < 2; i++) {
			if (dir[i] != 0x0) {
				continue;
			}
			if ((horPref[i] & portConstraint[i]) == 0) {
				horPref[i] = mxUtils.reversePortConstraints(horPref[i]);
			}
			if ((vertPref[i] & portConstraint[i]) == 0) {
				vertPref[i] = mxUtils.reversePortConstraints(vertPref[i]);
			}
			prefOrdering[i][0] = vertPref[i];
			prefOrdering[i][1] = horPref[i];
		}
		if (preferredVertDist > scaledOrthBuffer * 2 && preferredHorizDist > scaledOrthBuffer * 2) {
			if (((horPref[0] & portConstraint[0]) > 0) && ((vertPref[1] & portConstraint[1]) > 0)) {
				prefOrdering[0][0] = horPref[0];
				prefOrdering[0][1] = vertPref[0];
				prefOrdering[1][0] = vertPref[1];
				prefOrdering[1][1] = horPref[1];
				preferredOrderSet = true;
			} else if (((vertPref[0] & portConstraint[0]) > 0) && ((horPref[1] & portConstraint[1]) > 0)) {
				prefOrdering[0][0] = vertPref[0];
				prefOrdering[0][1] = horPref[0];
				prefOrdering[1][0] = horPref[1];
				prefOrdering[1][1] = vertPref[1];
				preferredOrderSet = true;
			}
		}
		if (preferredVertDist > scaledOrthBuffer * 2 && !preferredOrderSet) {
			prefOrdering[0][0] = vertPref[0];
			prefOrdering[0][1] = horPref[0];
			prefOrdering[1][0] = vertPref[1];
			prefOrdering[1][1] = horPref[1];
			preferredOrderSet = true;
		}
		if (preferredHorizDist > scaledOrthBuffer * 2 && !preferredOrderSet) {
			prefOrdering[0][0] = horPref[0];
			prefOrdering[0][1] = vertPref[0];
			prefOrdering[1][0] = horPref[1];
			prefOrdering[1][1] = vertPref[1];
			preferredOrderSet = true;
		}
		for (var i = 0; i < 2; i++) {
			if (dir[i] != 0x0) {
				continue;
			}
			if ((prefOrdering[i][0] & portConstraint[i]) == 0) {
				prefOrdering[i][0] = prefOrdering[i][1];
			}
			dirPref[i] = prefOrdering[i][0] & portConstraint[i];
			dirPref[i] |= (prefOrdering[i][1] & portConstraint[i]) << 8;
			dirPref[i] |= (prefOrdering[1 - i][i] & portConstraint[i]) << 16;
			dirPref[i] |= (prefOrdering[1 - i][1 - i] & portConstraint[i]) << 24;
			if ((dirPref[i] & 0xF) == 0) {
				dirPref[i] = dirPref[i] << 8;
			}
			if ((dirPref[i] & 0xF00) == 0) {
				dirPref[i] = (dirPref[i] & 0xF) | dirPref[i] >> 8;
			}
			if ((dirPref[i] & 0xF0000) == 0) {
				dirPref[i] = (dirPref[i] & 0xFFFF) | ((dirPref[i] & 0xF000000) >> 8);
			}
			dir[i] = dirPref[i] & 0xF;
			if (portConstraint[i] == mxConstants.DIRECTION_MASK_WEST || portConstraint[i] == mxConstants.DIRECTION_MASK_NORTH || portConstraint[i] == mxConstants.DIRECTION_MASK_EAST || portConstraint[i] == mxConstants.DIRECTION_MASK_SOUTH) {
				dir[i] = portConstraint[i];
			}
		}
		var sourceIndex = dir[0] == mxConstants.DIRECTION_MASK_EAST ? 3 : dir[0];
		var targetIndex = dir[1] == mxConstants.DIRECTION_MASK_EAST ? 3 : dir[1];
		sourceIndex -= quad;
		targetIndex -= quad;
		if (sourceIndex < 1) {
			sourceIndex += 4;
		}
		if (targetIndex < 1) {
			targetIndex += 4;
		}
		var routePattern = mxEdgeStyle.routePatterns[sourceIndex - 1][targetIndex - 1];
		mxEdgeStyle.wayPoints1[0][0] = geo[0][0];
		mxEdgeStyle.wayPoints1[0][1] = geo[0][1];
		switch (dir[0]) {
		case mxConstants.DIRECTION_MASK_WEST:
			mxEdgeStyle.wayPoints1[0][0] -= scaledOrthBuffer;
			mxEdgeStyle.wayPoints1[0][1] += constraint[0][1] * geo[0][3];
			break;
		case mxConstants.DIRECTION_MASK_SOUTH:
			mxEdgeStyle.wayPoints1[0][0] += constraint[0][0] * geo[0][2];
			mxEdgeStyle.wayPoints1[0][1] += geo[0][3] + scaledOrthBuffer;
			break;
		case mxConstants.DIRECTION_MASK_EAST:
			mxEdgeStyle.wayPoints1[0][0] += geo[0][2] + scaledOrthBuffer;
			mxEdgeStyle.wayPoints1[0][1] += constraint[0][1] * geo[0][3];
			break;
		case mxConstants.DIRECTION_MASK_NORTH:
			mxEdgeStyle.wayPoints1[0][0] += constraint[0][0] * geo[0][2];
			mxEdgeStyle.wayPoints1[0][1] -= scaledOrthBuffer;
			break;
		}
		var currentIndex = 0;
		var lastOrientation = (dir[0] & (mxConstants.DIRECTION_MASK_EAST | mxConstants.DIRECTION_MASK_WEST)) > 0 ? 0 : 1;
		var initialOrientation = lastOrientation;
		var currentOrientation = 0;
		for (var i = 0; i < routePattern.length; i++) {
			var nextDirection = routePattern[i] & 0xF;
			var directionIndex = nextDirection == mxConstants.DIRECTION_MASK_EAST ? 3 : nextDirection;
			directionIndex += quad;
			if (directionIndex > 4) {
				directionIndex -= 4;
			}
			var direction = mxEdgeStyle.dirVectors[directionIndex - 1];
			currentOrientation = (directionIndex % 2 > 0) ? 0 : 1;
			if (currentOrientation != lastOrientation) {
				currentIndex++;
				mxEdgeStyle.wayPoints1[currentIndex][0] = mxEdgeStyle.wayPoints1[currentIndex - 1][0];
				mxEdgeStyle.wayPoints1[currentIndex][1] = mxEdgeStyle.wayPoints1[currentIndex - 1][1];
			}
			var tar = (routePattern[i] & mxEdgeStyle.TARGET_MASK) > 0;
			var sou = (routePattern[i] & mxEdgeStyle.SOURCE_MASK) > 0;
			var side = (routePattern[i] & mxEdgeStyle.SIDE_MASK) >> 5;
			side = side << quad;
			if (side > 0xF) {
				side = side >> 4;
			}
			var center = (routePattern[i] & mxEdgeStyle.CENTER_MASK) > 0;
			if ((sou || tar) && side < 9) {
				var limit = 0;
				var souTar = sou ? 0 : 1;
				if (center && currentOrientation == 0) {
					limit = geo[souTar][0] + constraint[souTar][0] * geo[souTar][2];
				} else if (center) {
					limit = geo[souTar][1] + constraint[souTar][1] * geo[souTar][3];
				} else {
					limit = mxEdgeStyle.limits[souTar][side];
				}
				if (currentOrientation == 0) {
					var lastX = mxEdgeStyle.wayPoints1[currentIndex][0];
					var deltaX = (limit - lastX) * direction[0];
					if (deltaX > 0) {
						mxEdgeStyle.wayPoints1[currentIndex][0] += direction[0] * deltaX;
					}
				} else {
					var lastY = mxEdgeStyle.wayPoints1[currentIndex][1];
					var deltaY = (limit - lastY) * direction[1];
					if (deltaY > 0) {
						mxEdgeStyle.wayPoints1[currentIndex][1] += direction[1] * deltaY;
					}
				}
			} else if (center) {
				mxEdgeStyle.wayPoints1[currentIndex][0] += direction[0] * Math.abs(mxEdgeStyle.vertexSeperations[directionIndex] / 2);
				mxEdgeStyle.wayPoints1[currentIndex][1] += direction[1] * Math.abs(mxEdgeStyle.vertexSeperations[directionIndex] / 2);
			}
			if (currentIndex > 0 && mxEdgeStyle.wayPoints1[currentIndex][currentOrientation] == mxEdgeStyle.wayPoints1[currentIndex - 1][currentOrientation]) {
				currentIndex--;
			} else {
				lastOrientation = currentOrientation;
			}
		}
		for (var i = 0; i <= currentIndex; i++) {
			if (i == currentIndex) {
				var targetOrientation = (dir[1] & (mxConstants.DIRECTION_MASK_EAST | mxConstants.DIRECTION_MASK_WEST)) > 0 ? 0 : 1;
				var sameOrient = targetOrientation == initialOrientation ? 0 : 1;
				if (sameOrient != (currentIndex + 1) % 2) {
					break;
				}
			}
			result.push(new mxPoint(mxEdgeStyle.wayPoints1[i][0], mxEdgeStyle.wayPoints1[i][1]));
		}
	},
	getRoutePattern: function(dir, quad, dx, dy) {
		var sourceIndex = dir[0] == mxConstants.DIRECTION_MASK_EAST ? 3 : dir[0];
		var targetIndex = dir[1] == mxConstants.DIRECTION_MASK_EAST ? 3 : dir[1];
		sourceIndex -= quad;
		targetIndex -= quad;
		if (sourceIndex < 1) {
			sourceIndex += 4;
		}
		if (targetIndex < 1) {
			targetIndex += 4;
		}
		var result = routePatterns[sourceIndex - 1][targetIndex - 1];
		if (dx == 0 || dy == 0) {
			if (inlineRoutePatterns[sourceIndex - 1][targetIndex - 1] != null) {
				result = inlineRoutePatterns[sourceIndex - 1][targetIndex - 1];
			}
		}
		return result;
	}
};
var mxStyleRegistry = {
	values: [],
	putValue: function(name, obj) {
		mxStyleRegistry.values[name] = obj;
	},
	getValue: function(name) {
		return mxStyleRegistry.values[name];
	},
	getName: function(value) {
		for (var key in mxStyleRegistry.values) {
			if (mxStyleRegistry.values[key] == value) {
				return key;
			}
		}
		return null;
	}
};
mxStyleRegistry.putValue(mxConstants.EDGESTYLE_ELBOW, mxEdgeStyle.ElbowConnector);
mxStyleRegistry.putValue(mxConstants.EDGESTYLE_ENTITY_RELATION, mxEdgeStyle.EntityRelation);
mxStyleRegistry.putValue(mxConstants.EDGESTYLE_LOOP, mxEdgeStyle.Loop);
mxStyleRegistry.putValue(mxConstants.EDGESTYLE_SIDETOSIDE, mxEdgeStyle.SideToSide);
mxStyleRegistry.putValue(mxConstants.EDGESTYLE_TOPTOBOTTOM, mxEdgeStyle.TopToBottom);
mxStyleRegistry.putValue(mxConstants.EDGESTYLE_ORTHOGONAL, mxEdgeStyle.OrthConnector);
mxStyleRegistry.putValue(mxConstants.EDGESTYLE_SEGMENT, mxEdgeStyle.SegmentConnector);
mxStyleRegistry.putValue(mxConstants.PERIMETER_ELLIPSE, mxPerimeter.EllipsePerimeter);
mxStyleRegistry.putValue(mxConstants.PERIMETER_RECTANGLE, mxPerimeter.RectanglePerimeter);
mxStyleRegistry.putValue(mxConstants.PERIMETER_RHOMBUS, mxPerimeter.RhombusPerimeter);
mxStyleRegistry.putValue(mxConstants.PERIMETER_TRIANGLE, mxPerimeter.TrianglePerimeter);
function mxGraphView(graph) {
	this.graph = graph;
	this.translate = new mxPoint();
	this.graphBounds = new mxRectangle();
	this.states = new mxDictionary();
};
mxGraphView.prototype = new mxEventSource();
mxGraphView.prototype.constructor = mxGraphView;
mxGraphView.prototype.EMPTY_POINT = new mxPoint();
mxGraphView.prototype.doneResource = (mxClient.language != 'none') ? 'done': '';
mxGraphView.prototype.updatingDocumentResource = (mxClient.language != 'none') ? 'updatingDocument': '';
mxGraphView.prototype.allowEval = false;
mxGraphView.prototype.captureDocumentGesture = true;
mxGraphView.prototype.rendering = true;
mxGraphView.prototype.graph = null;
mxGraphView.prototype.currentRoot = null;
mxGraphView.prototype.graphBounds = null;
mxGraphView.prototype.scale = 1;
mxGraphView.prototype.translate = null;
mxGraphView.prototype.updateStyle = false;
mxGraphView.prototype.getGraphBounds = function() {
	return this.graphBounds;
};
mxGraphView.prototype.setGraphBounds = function(value) {
	this.graphBounds = value;
};
mxGraphView.prototype.getBounds = function(cells) {
	var result = null;
	if (cells != null && cells.length > 0) {
		var model = this.graph.getModel();
		for (var i = 0; i < cells.length; i++) {
			if (model.isVertex(cells[i]) || model.isEdge(cells[i])) {
				var state = this.getState(cells[i]);
				if (state != null) {
					if (result == null) {
						result = new mxRectangle(state.x, state.y, state.width, state.height);
					} else {
						result.add(state);
					}
				}
			}
		}
	}
	return result;
};
mxGraphView.prototype.setCurrentRoot = function(root) {
	if (this.currentRoot != root) {
		var change = new mxCurrentRootChange(this, root);
		change.execute();
		var edit = new mxUndoableEdit(this, false);
		edit.add(change);
		this.fireEvent(new mxEventObject(mxEvent.UNDO, 'edit', edit));
		this.graph.sizeDidChange();
	}
	return root;
};
mxGraphView.prototype.scaleAndTranslate = function(scale, dx, dy) {
	var previousScale = this.scale;
	var previousTranslate = new mxPoint(this.translate.x, this.translate.y);
	if (this.scale != scale || this.translate.x != dx || this.translate.y != dy) {
		this.scale = scale;
		this.translate.x = dx;
		this.translate.y = dy;
		if (this.isEventsEnabled()) {
			this.revalidate();
			this.graph.sizeDidChange();
		}
	}
	this.fireEvent(new mxEventObject(mxEvent.SCALE_AND_TRANSLATE, 'scale', scale, 'previousScale', previousScale, 'translate', this.translate, 'previousTranslate', previousTranslate));
};
mxGraphView.prototype.getScale = function() {
	return this.scale;
};
mxGraphView.prototype.setScale = function(value) {
	var previousScale = this.scale;
	if (this.scale != value) {
		this.scale = value;
		if (this.isEventsEnabled()) {
			this.revalidate();
			this.graph.sizeDidChange();
		}
	}
	this.fireEvent(new mxEventObject(mxEvent.SCALE, 'scale', value, 'previousScale', previousScale));
};
mxGraphView.prototype.getTranslate = function() {
	return this.translate;
};
mxGraphView.prototype.setTranslate = function(dx, dy) {
	var previousTranslate = new mxPoint(this.translate.x, this.translate.y);
	if (this.translate.x != dx || this.translate.y != dy) {
		this.translate.x = dx;
		this.translate.y = dy;
		if (this.isEventsEnabled()) {
			this.revalidate();
			this.graph.sizeDidChange();
		}
	}
	this.fireEvent(new mxEventObject(mxEvent.TRANSLATE, 'translate', this.translate, 'previousTranslate', previousTranslate));
};
mxGraphView.prototype.refresh = function() {
	if (this.currentRoot != null) {
		this.clear();
	}
	this.revalidate();
};
mxGraphView.prototype.revalidate = function() {
	this.invalidate();
	this.validate();
};
mxGraphView.prototype.clear = function(cell, force, recurse) {
	var model = this.graph.getModel();
	cell = cell || model.getRoot();
	force = (force != null) ? force: false;
	recurse = (recurse != null) ? recurse: true;
	this.removeState(cell);
	if (recurse && (force || cell != this.currentRoot)) {
		var childCount = model.getChildCount(cell);
		for (var i = 0; i < childCount; i++) {
			this.clear(model.getChildAt(cell, i), force);
		}
	} else {
		this.invalidate(cell);
	}
};
mxGraphView.prototype.invalidate = function(cell, recurse, includeEdges, orderChanged) {
	var model = this.graph.getModel();
	cell = cell || model.getRoot();
	recurse = (recurse != null) ? recurse: true;
	includeEdges = (includeEdges != null) ? includeEdges: true;
	orderChanged = (orderChanged != null) ? orderChanged: false;
	var state = this.getState(cell);
	if (state != null) {
		state.invalid = true;
		if (orderChanged) {
			state.orderChanged = true;
		}
	}
	if (recurse) {
		var childCount = model.getChildCount(cell);
		for (var i = 0; i < childCount; i++) {
			var child = model.getChildAt(cell, i);
			this.invalidate(child, recurse, includeEdges, orderChanged);
		}
	}
	if (includeEdges) {
		var edgeCount = model.getEdgeCount(cell);
		for (var i = 0; i < edgeCount; i++) {
			this.invalidate(model.getEdgeAt(cell, i), recurse, includeEdges);
		}
	}
};
mxGraphView.prototype.validate = function(cell) {
	var t0 = mxLog.enter('mxGraphView.validate');
	window.status = mxResources.get(this.updatingDocumentResource) || this.updatingDocumentResource;
	cell = cell || ((this.currentRoot != null) ? this.currentRoot: this.graph.getModel().getRoot());
	this.validateBounds(null, cell);
	var graphBounds = this.validatePoints(null, cell);
	if (graphBounds == null) {
		graphBounds = new mxRectangle();
	}
	this.setGraphBounds(graphBounds);
	this.validateBackground();
	window.status = mxResources.get(this.doneResource) || this.doneResource;
	mxLog.leave('mxGraphView.validate', t0);
};
mxGraphView.prototype.createBackgroundPageShape = function(bounds) {
	return new mxRectangleShape(bounds, 'white', 'black');
};
mxGraphView.prototype.validateBackground = function() {
	var bg = this.graph.getBackgroundImage();
	if (bg != null) {
		if (this.backgroundImage == null || this.backgroundImage.image != bg.src) {
			if (this.backgroundImage != null) {
				this.backgroundImage.destroy();
			}
			var bounds = new mxRectangle(0, 0, 1, 1);
			this.backgroundImage = new mxImageShape(bounds, bg.src);
			this.backgroundImage.dialect = this.graph.dialect;
			this.backgroundImage.init(this.backgroundPane);
			this.backgroundImage.redraw();
		}
		this.redrawBackgroundImage(this.backgroundImage, bg);
	} else if (this.backgroundImage != null) {
		this.backgroundImage.destroy();
		this.backgroundImage = null;
	}
	if (this.graph.pageVisible) {
		var bounds = this.getBackgroundPageBounds();
		if (this.backgroundPageShape == null) {
			this.backgroundPageShape = this.createBackgroundPageShape(bounds);
			this.backgroundPageShape.scale = this.scale;
			this.backgroundPageShape.isShadow = true;
			this.backgroundPageShape.dialect = this.graph.dialect;
			this.backgroundPageShape.init(this.backgroundPane);
			this.backgroundPageShape.redraw();
			mxEvent.addListener(this.backgroundPageShape.node, 'dblclick', mxUtils.bind(this,
			function(evt) {
				this.graph.dblClick(evt);
			}));
			var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
			var mm = (mxClient.IS_TOUCH) ? 'touchmove': 'mousemove';
			var mu = (mxClient.IS_TOUCH) ? 'touchend': 'mouseup';
			mxEvent.addListener(this.backgroundPageShape.node, md, mxUtils.bind(this,
			function(evt) {
				this.graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt));
			}));
			mxEvent.addListener(this.backgroundPageShape.node, mm, mxUtils.bind(this,
			function(evt) {
				if (this.graph.tooltipHandler != null && this.graph.tooltipHandler.isHideOnHover()) {
					this.graph.tooltipHandler.hide();
				}
				if (this.graph.isMouseDown && !mxEvent.isConsumed(evt)) {
					this.graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt));
				}
			}));
			mxEvent.addListener(this.backgroundPageShape.node, mu, mxUtils.bind(this,
			function(evt) {
				this.graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt));
			}));
		} else {
			this.backgroundPageShape.scale = this.scale;
			this.backgroundPageShape.bounds = bounds;
			this.backgroundPageShape.redraw();
		}
	} else if (this.backgroundPageShape != null) {
		this.backgroundPageShape.destroy();
		this.backgroundPageShape = null;
	}
};
mxGraphView.prototype.getBackgroundPageBounds = function() {
	var fmt = this.graph.pageFormat;
	var ps = this.scale * this.graph.pageScale;
	var bounds = new mxRectangle(this.scale * this.translate.x, this.scale * this.translate.y, fmt.width * ps, fmt.height * ps);
	return bounds;
};
mxGraphView.prototype.redrawBackgroundImage = function(backgroundImage, bg) {
	backgroundImage.scale = this.scale;
	backgroundImage.bounds.x = this.scale * this.translate.x;
	backgroundImage.bounds.y = this.scale * this.translate.y;
	backgroundImage.bounds.width = this.scale * bg.width;
	backgroundImage.bounds.height = this.scale * bg.height;
	backgroundImage.redraw();
};
mxGraphView.prototype.validateBounds = function(parentState, cell) {
	var model = this.graph.getModel();
	var state = this.getState(cell, true);
	if (state != null && state.invalid) {
		if (!this.graph.isCellVisible(cell)) {
			this.removeState(cell);
		} else if (cell != this.currentRoot && parentState != null) {
			state.absoluteOffset.x = 0;
			state.absoluteOffset.y = 0;
			state.origin.x = parentState.origin.x;
			state.origin.y = parentState.origin.y;
			var geo = this.graph.getCellGeometry(cell);
			if (geo != null) {
				if (!model.isEdge(cell)) {
					var offset = geo.offset || this.EMPTY_POINT;
					if (geo.relative) {
						state.origin.x += geo.x * parentState.width / this.scale + offset.x;
						state.origin.y += geo.y * parentState.height / this.scale + offset.y;
					} else {
						state.absoluteOffset.x = this.scale * offset.x;
						state.absoluteOffset.y = this.scale * offset.y;
						state.origin.x += geo.x;
						state.origin.y += geo.y;
					}
				}
				state.x = this.scale * (this.translate.x + state.origin.x);
				state.y = this.scale * (this.translate.y + state.origin.y);
				state.width = this.scale * geo.width;
				state.height = this.scale * geo.height;
				if (model.isVertex(cell)) {
					this.updateVertexLabelOffset(state);
				}
			}
		}
		var offset = this.graph.getChildOffsetForCell(cell);
		if (offset != null) {
			state.origin.x += offset.x;
			state.origin.y += offset.y;
		}
	}
	if (state != null && (!this.graph.isCellCollapsed(cell) || cell == this.currentRoot)) {
		var childCount = model.getChildCount(cell);
		for (var i = 0; i < childCount; i++) {
			var child = model.getChildAt(cell, i);
			this.validateBounds(state, child);
		}
	}
};
mxGraphView.prototype.updateVertexLabelOffset = function(state) {
	var horizontal = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_CENTER);
	if (horizontal == mxConstants.ALIGN_LEFT) {
		state.absoluteOffset.x -= state.width;
	} else if (horizontal == mxConstants.ALIGN_RIGHT) {
		state.absoluteOffset.x += state.width;
	}
	var vertical = mxUtils.getValue(state.style, mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_MIDDLE);
	if (vertical == mxConstants.ALIGN_TOP) {
		state.absoluteOffset.y -= state.height;
	} else if (vertical == mxConstants.ALIGN_BOTTOM) {
		state.absoluteOffset.y += state.height;
	}
};
mxGraphView.prototype.validatePoints = function(parentState, cell) {
	var model = this.graph.getModel();
	var state = this.getState(cell);
	var bbox = null;
	if (state != null) {
		if (state.invalid) {
			var geo = this.graph.getCellGeometry(cell);
			if (geo != null && model.isEdge(cell)) {
				var source = this.getState(this.getVisibleTerminal(cell, true));
				state.setVisibleTerminalState(source, true);
				if (source != null && model.isEdge(source.cell) && !model.isAncestor(source.cell, cell)) {
					var tmp = this.getState(model.getParent(source.cell));
					this.validatePoints(tmp, source.cell);
				}
				var target = this.getState(this.getVisibleTerminal(cell, false));
				state.setVisibleTerminalState(target, false);
				if (target != null && model.isEdge(target.cell) && !model.isAncestor(target.cell, cell)) {
					var tmp = this.getState(model.getParent(target.cell));
					this.validatePoints(tmp, target.cell);
				}
				this.updateFixedTerminalPoints(state, source, target);
				this.updatePoints(state, geo.points, source, target);
				this.updateFloatingTerminalPoints(state, source, target);
				this.updateEdgeBounds(state);
				this.updateEdgeLabelOffset(state);
			} else if (geo != null && geo.relative && parentState != null && model.isEdge(parentState.cell)) {
				var origin = this.getPoint(parentState, geo);
				if (origin != null) {
					state.x = origin.x;
					state.y = origin.y;
					origin.x = (origin.x / this.scale) - this.translate.x;
					origin.y = (origin.y / this.scale) - this.translate.y;
					state.origin = origin;
					this.childMoved(parentState, state);
				}
			}
			state.invalid = false;
			if (this.isRendering() && cell != this.currentRoot) {
				this.graph.cellRenderer.redraw(state);
			}
		}
		if (model.isEdge(cell) || model.isVertex(cell)) {
			bbox = new mxRectangle(state.x, state.y, state.width, state.height);
			if (model.isVertex(cell) && mxUtils.getValue(state.style, mxConstants.STYLE_SHADOW, 0) == 1) {
				bbox.width += Math.ceil(mxConstants.SHADOW_OFFSET_X * this.scale);
				bbox.height += Math.ceil(mxConstants.SHADOW_OFFSET_Y * this.scale);
			}
			var box = (state.text != null && !this.graph.isLabelClipped(state.cell)) ? state.text.boundingBox: null;
			if (box != null) {
				bbox.add(box);
			}
		}
	}
	if (state != null && (!this.graph.isCellCollapsed(cell) || cell == this.currentRoot)) {
		var childCount = model.getChildCount(cell);
		for (var i = 0; i < childCount; i++) {
			var child = model.getChildAt(cell, i);
			var bounds = this.validatePoints(state, child);
			if (bounds != null) {
				if (bbox == null) {
					bbox = bounds;
				} else {
					bbox.add(bounds);
				}
			}
		}
	}
	return bbox;
};
mxGraphView.prototype.childMoved = function(parent, child) {
	var cell = child.cell;
	if (!this.graph.isCellCollapsed(cell) || cell == this.currentRoot) {
		var model = this.graph.getModel();
		var childCount = model.getChildCount(cell);
		for (var i = 0; i < childCount; i++) {
			this.validateBounds(child, model.getChildAt(cell, i));
		}
	}
};
mxGraphView.prototype.updateFixedTerminalPoints = function(edge, source, target) {
	this.updateFixedTerminalPoint(edge, source, true, this.graph.getConnectionConstraint(edge, source, true));
	this.updateFixedTerminalPoint(edge, target, false, this.graph.getConnectionConstraint(edge, target, false));
};
mxGraphView.prototype.updateFixedTerminalPoint = function(edge, terminal, source, constraint) {
	var pt = null;
	if (constraint != null) {
		pt = this.graph.getConnectionPoint(terminal, constraint);
	}
	if (pt == null && terminal == null) {
		var s = this.scale;
		var tr = this.translate;
		var orig = edge.origin;
		var geo = this.graph.getCellGeometry(edge.cell);
		pt = geo.getTerminalPoint(source);
		if (pt != null) {
			pt = new mxPoint(s * (tr.x + pt.x + orig.x), s * (tr.y + pt.y + orig.y));
		}
	}
	edge.setAbsoluteTerminalPoint(pt, source);
};
mxGraphView.prototype.updatePoints = function(edge, points, source, target) {
	if (edge != null) {
		var pts = [];
		pts.push(edge.absolutePoints[0]);
		var edgeStyle = this.getEdgeStyle(edge, points, source, target);
		if (edgeStyle != null) {
			var src = this.getTerminalPort(edge, source, true);
			var trg = this.getTerminalPort(edge, target, false);
			edgeStyle(edge, src, trg, points, pts);
		} else if (points != null) {
			for (var i = 0; i < points.length; i++) {
				if (points[i] != null) {
					var pt = mxUtils.clone(points[i]);
					pts.push(this.transformControlPoint(edge, pt));
				}
			}
		}
		var tmp = edge.absolutePoints;
		pts.push(tmp[tmp.length - 1]);
		edge.absolutePoints = pts;
	}
};
mxGraphView.prototype.transformControlPoint = function(state, pt) {
	var orig = state.origin;
	return new mxPoint(this.scale * (pt.x + this.translate.x + orig.x), this.scale * (pt.y + this.translate.y + orig.y));
};
mxGraphView.prototype.getEdgeStyle = function(edge, points, source, target) {
	var edgeStyle = (source != null && source == target) ? mxUtils.getValue(edge.style, mxConstants.STYLE_LOOP, this.graph.defaultLoopStyle) : (!mxUtils.getValue(edge.style, mxConstants.STYLE_NOEDGESTYLE, false) ? edge.style[mxConstants.STYLE_EDGE] : null);
	if (typeof(edgeStyle) == "string") {
		var tmp = mxStyleRegistry.getValue(edgeStyle);
		if (tmp == null && this.isAllowEval()) {
			tmp = mxUtils.eval(edgeStyle);
		}
		edgeStyle = tmp;
	}
	if (typeof(edgeStyle) == "function") {
		return edgeStyle;
	}
	return null;
};
mxGraphView.prototype.updateFloatingTerminalPoints = function(state, source, target) {
	var pts = state.absolutePoints;
	var p0 = pts[0];
	var pe = pts[pts.length - 1];
	if (pe == null && target != null) {
		this.updateFloatingTerminalPoint(state, target, source, false);
	}
	if (p0 == null && source != null) {
		this.updateFloatingTerminalPoint(state, source, target, true);
	}
};
mxGraphView.prototype.updateFloatingTerminalPoint = function(edge, start, end, source) {
	start = this.getTerminalPort(edge, start, source);
	var next = this.getNextPoint(edge, end, source);
	var border = parseFloat(edge.style[mxConstants.STYLE_PERIMETER_SPACING] || 0);
	border += parseFloat(edge.style[(source) ? mxConstants.STYLE_SOURCE_PERIMETER_SPACING: mxConstants.STYLE_TARGET_PERIMETER_SPACING] || 0);
	var pt = this.getPerimeterPoint(start, next, this.graph.isOrthogonal(edge), border);
	edge.setAbsoluteTerminalPoint(pt, source);
};
mxGraphView.prototype.getTerminalPort = function(state, terminal, source) {
	var key = (source) ? mxConstants.STYLE_SOURCE_PORT: mxConstants.STYLE_TARGET_PORT;
	var id = mxUtils.getValue(state.style, key);
	if (id != null) {
		var tmp = this.getState(this.graph.getModel().getCell(id));
		if (tmp != null) {
			terminal = tmp;
		}
	}
	return terminal;
};
mxGraphView.prototype.getPerimeterPoint = function(terminal, next, orthogonal, border) {
	var point = null;
	if (terminal != null) {
		var perimeter = this.getPerimeterFunction(terminal);
		if (perimeter != null && next != null) {
			var bounds = this.getPerimeterBounds(terminal, border);
			if (bounds.width > 0 || bounds.height > 0) {
				point = perimeter(bounds, terminal, next, orthogonal);
			}
		}
		if (point == null) {
			point = this.getPoint(terminal);
		}
	}
	return point;
};
mxGraphView.prototype.getRoutingCenterX = function(state) {
	var f = (state.style != null) ? parseFloat(state.style[mxConstants.STYLE_ROUTING_CENTER_X]) || 0 : 0;
	return state.getCenterX() + f * state.width;
};
mxGraphView.prototype.getRoutingCenterY = function(state) {
	var f = (state.style != null) ? parseFloat(state.style[mxConstants.STYLE_ROUTING_CENTER_Y]) || 0 : 0;
	return state.getCenterY() + f * state.height;
};
mxGraphView.prototype.getPerimeterBounds = function(terminal, border) {
	border = (border != null) ? border: 0;
	if (terminal != null) {
		border += parseFloat(terminal.style[mxConstants.STYLE_PERIMETER_SPACING] || 0);
	}
	return terminal.getPerimeterBounds(border * this.scale);
};
mxGraphView.prototype.getPerimeterFunction = function(state) {
	var perimeter = state.style[mxConstants.STYLE_PERIMETER];
	if (typeof(perimeter) == "string") {
		var tmp = mxStyleRegistry.getValue(perimeter);
		if (tmp == null && this.isAllowEval()) {
			tmp = mxUtils.eval(perimeter);
		}
		perimeter = tmp;
	}
	if (typeof(perimeter) == "function") {
		return perimeter;
	}
	return null;
};
mxGraphView.prototype.getNextPoint = function(edge, opposite, source) {
	var pts = edge.absolutePoints;
	var point = null;
	if (pts != null && (source || pts.length > 2 || opposite == null)) {
		var count = pts.length;
		point = pts[(source) ? Math.min(1, count - 1) : Math.max(0, count - 2)];
	}
	if (point == null && opposite != null) {
		point = new mxPoint(opposite.getCenterX(), opposite.getCenterY());
	}
	return point;
};
mxGraphView.prototype.getVisibleTerminal = function(edge, source) {
	var model = this.graph.getModel();
	var result = model.getTerminal(edge, source);
	var best = result;
	while (result != null && result != this.currentRoot) {
		if (!this.graph.isCellVisible(best) || this.graph.isCellCollapsed(result)) {
			best = result;
		}
		result = model.getParent(result);
	}
	if (model.getParent(best) == model.getRoot()) {
		best = null;
	}
	return best;
};
mxGraphView.prototype.updateEdgeBounds = function(state) {
	var points = state.absolutePoints;
	state.length = 0;
	if (points != null && points.length > 0) {
		var p0 = points[0];
		var pe = points[points.length - 1];
		if (p0 == null || pe == null) {
			this.clear(state.cell, true);
		} else {
			if (p0.x != pe.x || p0.y != pe.y) {
				var dx = pe.x - p0.x;
				var dy = pe.y - p0.y;
				state.terminalDistance = Math.sqrt(dx * dx + dy * dy);
			} else {
				state.terminalDistance = 0;
			}
			var length = 0;
			var segments = [];
			var pt = p0;
			if (pt != null) {
				var minX = pt.x;
				var minY = pt.y;
				var maxX = minX;
				var maxY = minY;
				for (var i = 1; i < points.length; i++) {
					var tmp = points[i];
					if (tmp != null) {
						var dx = pt.x - tmp.x;
						var dy = pt.y - tmp.y;
						var segment = Math.sqrt(dx * dx + dy * dy);
						segments.push(segment);
						length += segment;
						pt = tmp;
						minX = Math.min(pt.x, minX);
						minY = Math.min(pt.y, minY);
						maxX = Math.max(pt.x, maxX);
						maxY = Math.max(pt.y, maxY);
					}
				}
				state.length = length;
				state.segments = segments;
				var markerSize = 1;
				state.x = minX;
				state.y = minY;
				state.width = Math.max(markerSize, maxX - minX);
				state.height = Math.max(markerSize, maxY - minY);
			}
		}
	}
};
mxGraphView.prototype.getPoint = function(state, geometry) {
	var x = state.getCenterX();
	var y = state.getCenterY();
	if (state.segments != null && (geometry == null || geometry.relative)) {
		var gx = (geometry != null) ? geometry.x / 2 : 0;
		var pointCount = state.absolutePoints.length;
		var dist = (gx + 0.5) * state.length;
		var segment = state.segments[0];
		var length = 0;
		var index = 1;
		while (dist > length + segment && index < pointCount - 1) {
			length += segment;
			segment = state.segments[index++];
		}
		var factor = (segment == 0) ? 0 : (dist - length) / segment;
		var p0 = state.absolutePoints[index - 1];
		var pe = state.absolutePoints[index];
		if (p0 != null && pe != null) {
			var gy = 0;
			var offsetX = 0;
			var offsetY = 0;
			if (geometry != null) {
				gy = geometry.y;
				var offset = geometry.offset;
				if (offset != null) {
					offsetX = offset.x;
					offsetY = offset.y;
				}
			}
			var dx = pe.x - p0.x;
			var dy = pe.y - p0.y;
			var nx = (segment == 0) ? 0 : dy / segment;
			var ny = (segment == 0) ? 0 : dx / segment;
			x = p0.x + dx * factor + (nx * gy + offsetX) * this.scale;
			y = p0.y + dy * factor - (ny * gy - offsetY) * this.scale;
		}
	} else if (geometry != null) {
		var offset = geometry.offset;
		if (offset != null) {
			x += offset.x;
			y += offset.y;
		}
	}
	return new mxPoint(x, y);
};
mxGraphView.prototype.getRelativePoint = function(edgeState, x, y) {
	var model = this.graph.getModel();
	var geometry = model.getGeometry(edgeState.cell);
	if (geometry != null) {
		var pointCount = edgeState.absolutePoints.length;
		if (geometry.relative && pointCount > 1) {
			var totalLength = edgeState.length;
			var segments = edgeState.segments;
			var p0 = edgeState.absolutePoints[0];
			var pe = edgeState.absolutePoints[1];
			var minDist = mxUtils.ptSegDistSq(p0.x, p0.y, pe.x, pe.y, x, y);
			var index = 0;
			var tmp = 0;
			var length = 0;
			for (var i = 2; i < pointCount; i++) {
				tmp += segments[i - 2];
				pe = edgeState.absolutePoints[i];
				var dist = mxUtils.ptSegDistSq(p0.x, p0.y, pe.x, pe.y, x, y);
				if (dist <= minDist) {
					minDist = dist;
					index = i - 1;
					length = tmp;
				}
				p0 = pe;
			}
			var seg = segments[index];
			p0 = edgeState.absolutePoints[index];
			pe = edgeState.absolutePoints[index + 1];
			var x2 = p0.x;
			var y2 = p0.y;
			var x1 = pe.x;
			var y1 = pe.y;
			var px = x;
			var py = y;
			var xSegment = x2 - x1;
			var ySegment = y2 - y1;
			px -= x1;
			py -= y1;
			var projlenSq = 0;
			px = xSegment - px;
			py = ySegment - py;
			var dotprod = px * xSegment + py * ySegment;
			if (dotprod <= 0.0) {
				projlenSq = 0;
			} else {
				projlenSq = dotprod * dotprod / (xSegment * xSegment + ySegment * ySegment);
			}
			var projlen = Math.sqrt(projlenSq);
			if (projlen > seg) {
				projlen = seg;
			}
			var yDistance = Math.sqrt(mxUtils.ptSegDistSq(p0.x, p0.y, pe.x, pe.y, x, y));
			var direction = mxUtils.relativeCcw(p0.x, p0.y, pe.x, pe.y, x, y);
			if (direction == -1) {
				yDistance = -yDistance;
			}
			return new mxPoint(((totalLength / 2 - length - projlen) / totalLength) * -2, yDistance / this.scale);
		}
	}
	return new mxPoint();
};
mxGraphView.prototype.updateEdgeLabelOffset = function(state) {
	var points = state.absolutePoints;
	state.absoluteOffset.x = state.getCenterX();
	state.absoluteOffset.y = state.getCenterY();
	if (points != null && points.length > 0 && state.segments != null) {
		var geometry = this.graph.getCellGeometry(state.cell);
		if (geometry.relative) {
			var offset = this.getPoint(state, geometry);
			if (offset != null) {
				state.absoluteOffset = offset;
			}
		} else {
			var p0 = points[0];
			var pe = points[points.length - 1];
			if (p0 != null && pe != null) {
				var dx = pe.x - p0.x;
				var dy = pe.y - p0.y;
				var x0 = 0;
				var y0 = 0;
				var off = geometry.offset;
				if (off != null) {
					x0 = off.x;
					y0 = off.y;
				}
				var x = p0.x + dx / 2 + x0 * this.scale;
				var y = p0.y + dy / 2 + y0 * this.scale;
				state.absoluteOffset.x = x;
				state.absoluteOffset.y = y;
			}
		}
	}
};
mxGraphView.prototype.getState = function(cell, create) {
	create = create || false;
	var state = null;
	if (cell != null) {
		state = this.states.get(cell);
		if (this.graph.isCellVisible(cell)) {
			if (state == null && create && this.graph.isCellVisible(cell)) {
				state = this.createState(cell);
				this.states.put(cell, state);
			} else if (create && state != null && this.updateStyle) {
				state.style = this.graph.getCellStyle(cell);
			}
		}
	}
	return state;
};
mxGraphView.prototype.isRendering = function() {
	return this.rendering;
};
mxGraphView.prototype.setRendering = function(value) {
	this.rendering = value;
};
mxGraphView.prototype.isAllowEval = function() {
	return this.allowEval;
};
mxGraphView.prototype.setAllowEval = function(value) {
	this.allowEval = value;
};
mxGraphView.prototype.getStates = function() {
	return this.states;
};
mxGraphView.prototype.setStates = function(value) {
	this.states = value;
};
mxGraphView.prototype.getCellStates = function(cells) {
	if (cells == null) {
		return this.states;
	} else {
		var result = [];
		for (var i = 0; i < cells.length; i++) {
			var state = this.getState(cells[i]);
			if (state != null) {
				result.push(state);
			}
		}
		return result;
	}
};
mxGraphView.prototype.removeState = function(cell) {
	var state = null;
	if (cell != null) {
		state = this.states.remove(cell);
		if (state != null) {
			this.graph.cellRenderer.destroy(state);
			state.destroy();
		}
	}
	return state;
};
mxGraphView.prototype.createState = function(cell) {
	var style = this.graph.getCellStyle(cell);
	var state = new mxCellState(this, cell, style);
	if (this.isRendering()) {
		this.graph.cellRenderer.initialize(state);
	}
	return state;
};
mxGraphView.prototype.getCanvas = function() {
	return this.canvas;
};
mxGraphView.prototype.getBackgroundPane = function() {
	return this.backgroundPane;
};
mxGraphView.prototype.getDrawPane = function() {
	return this.drawPane;
};
mxGraphView.prototype.getOverlayPane = function() {
	return this.overlayPane;
};
mxGraphView.prototype.isContainerEvent = function(evt) {
	var source = mxEvent.getSource(evt);
	return (source == this.graph.container || source.parentNode == this.backgroundPane || (source.parentNode != null && source.parentNode.parentNode == this.backgroundPane) || source == this.canvas.parentNode || source == this.canvas || source == this.backgroundPane || source == this.drawPane || source == this.overlayPane);
};
mxGraphView.prototype.isScrollEvent = function(evt) {
	var offset = mxUtils.getOffset(this.graph.container);
	var pt = new mxPoint(evt.clientX - offset.x, evt.clientY - offset.y);
	var outWidth = this.graph.container.offsetWidth;
	var inWidth = this.graph.container.clientWidth;
	if (outWidth > inWidth && pt.x > inWidth + 2 && pt.x <= outWidth) {
		return true;
	}
	var outHeight = this.graph.container.offsetHeight;
	var inHeight = this.graph.container.clientHeight;
	if (outHeight > inHeight && pt.y > inHeight + 2 && pt.y <= outHeight) {
		return true;
	}
	return false;
};
mxGraphView.prototype.init = function() {
	this.installListeners();
	var graph = this.graph;
	if (graph.dialect == mxConstants.DIALECT_SVG) {
		this.createSvg();
	} else if (graph.dialect == mxConstants.DIALECT_VML) {
		this.createVml();
	} else {
		this.createHtml();
	}
};
mxGraphView.prototype.installListeners = function() {
	var graph = this.graph;
	var container = graph.container;
	if (container != null) {
		var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
		var mm = (mxClient.IS_TOUCH) ? 'touchmove': 'mousemove';
		var mu = (mxClient.IS_TOUCH) ? 'touchend': 'mouseup';
		mxEvent.addListener(container, md, mxUtils.bind(this,
		function(evt) {
			if (mxClient.IS_TOUCH && graph.isEditing()) {
				graph.stopEditing(!graph.isInvokesStopCellEditing());
			}
			if (this.isContainerEvent(evt) && ((!mxClient.IS_IE && !false && !false && !false) || !this.isScrollEvent(evt))) {
				graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt));
			}
		}));
		mxEvent.addListener(container, mm, mxUtils.bind(this,
		function(evt) {
			if (this.isContainerEvent(evt)) {
				graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt));
			}
		}));
		mxEvent.addListener(container, mu, mxUtils.bind(this,
		function(evt) {
			if (this.isContainerEvent(evt)) {
				graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt));
			}
		}));
		mxEvent.addListener(container, 'dblclick', mxUtils.bind(this,
		function(evt) {
			graph.dblClick(evt);
		}));
		var getState = function(evt) {
			var state = null;
			if (mxClient.IS_TOUCH) {
				var x = mxEvent.getClientX(evt);
				var y = mxEvent.getClientY(evt);
				var pt = mxUtils.convertPoint(container, x, y);
				state = graph.view.getState(graph.getCellAt(pt.x, pt.y));
			}
			return state;
		};
		graph.addMouseListener({
			mouseDown: function(sender, me) {
				graph.panningHandler.hideMenu();
			},
			mouseMove: function() {},
			mouseUp: function() {}
		});
		mxEvent.addListener(document, mm, mxUtils.bind(this,
		function(evt) {
			if (graph.tooltipHandler != null && graph.tooltipHandler.isHideOnHover()) {
				graph.tooltipHandler.hide();
			}
			if (this.captureDocumentGesture && graph.isMouseDown && !mxEvent.isConsumed(evt)) {
				graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt, getState(evt)));
			}
		}));
		mxEvent.addListener(document, mu, mxUtils.bind(this,
		function(evt) {
			if (this.captureDocumentGesture) {
				graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt));
			}
		}));
	}
};
mxGraphView.prototype.createHtml = function() {
	var container = this.graph.container;
	if (container != null) {
		this.canvas = this.createHtmlPane();
		this.backgroundPane = this.createHtmlPane(1, 1);
		this.drawPane = this.createHtmlPane(1, 1);
		this.overlayPane = this.createHtmlPane(1, 1);
		this.canvas.appendChild(this.backgroundPane);
		this.canvas.appendChild(this.drawPane);
		this.canvas.appendChild(this.overlayPane);
		container.appendChild(this.canvas);
	}
};
mxGraphView.prototype.createHtmlPane = function(width, height) {
	var pane = document.createElement('DIV');
	if (width != null && height != null) {
		pane.style.position = 'absolute';
		pane.style.left = '0px';
		pane.style.top = '0px';
		pane.style.width = width + 'px';
		pane.style.height = height + 'px';
	} else {
		pane.style.position = 'relative';
	}
	return pane;
};
mxGraphView.prototype.createVml = function() {
	var container = this.graph.container;
	if (container != null) {
		var width = container.offsetWidth;
		var height = container.offsetHeight;
		this.canvas = this.createVmlPane(width, height);
		this.backgroundPane = this.createVmlPane(width, height);
		this.drawPane = this.createVmlPane(width, height);
		this.overlayPane = this.createVmlPane(width, height);
		this.canvas.appendChild(this.backgroundPane);
		this.canvas.appendChild(this.drawPane);
		this.canvas.appendChild(this.overlayPane);
		container.appendChild(this.canvas);
	}
};
mxGraphView.prototype.createVmlPane = function(width, height) {
	var pane = document.createElement('v:group');
	pane.style.position = 'absolute';
	pane.style.left = '0px';
	pane.style.top = '0px';
	pane.style.width = width + 'px';
	pane.style.height = height + 'px';
	pane.setAttribute('coordsize', width + ',' + height);
	pane.setAttribute('coordorigin', '0,0');
	return pane;
};
mxGraphView.prototype.createSvg = function() {
	var container = this.graph.container;
	this.canvas = document.createElementNS(mxConstants.NS_SVG, 'g');
	this.backgroundPane = document.createElementNS(mxConstants.NS_SVG, 'g');
	this.canvas.appendChild(this.backgroundPane);
	this.drawPane = document.createElementNS(mxConstants.NS_SVG, 'g');
	this.canvas.appendChild(this.drawPane);
	this.overlayPane = document.createElementNS(mxConstants.NS_SVG, 'g');
	this.canvas.appendChild(this.overlayPane);
	var root = document.createElementNS(mxConstants.NS_SVG, 'svg');
	var onResize = mxUtils.bind(this,
	function(evt) {
		if (this.graph.container != null) {
			var width = this.graph.container.offsetWidth;
			var height = this.graph.container.offsetHeight;
			var bounds = this.getGraphBounds();
			root.setAttribute('width', Math.max(width, bounds.width));
			root.setAttribute('height', Math.max(height, bounds.height));
		}
	});
	mxEvent.addListener(window, 'resize', onResize);
	if (false) {
		onResize();
	}
	root.appendChild(this.canvas);
	if (container != null) {
		container.appendChild(root);
		var style = mxUtils.getCurrentStyle(container);
		if (style.position == 'static') {
			container.style.position = 'relative';
		}
	}
};
mxGraphView.prototype.destroy = function() {
	var root = (this.canvas != null) ? this.canvas.ownerSVGElement: null;
	if (root == null) {
		root = this.canvas;
	}
	if (root != null && root.parentNode != null) {
		this.clear(this.currentRoot, true);
		mxEvent.removeAllListeners(document);
		mxEvent.release(this.graph.container);
		root.parentNode.removeChild(root);
		this.canvas = null;
		this.backgroundPane = null;
		this.drawPane = null;
		this.overlayPane = null;
	}
};
function mxCurrentRootChange(view, root) {
	this.view = view;
	this.root = root;
	this.previous = root;
	this.isUp = root == null;
	if (!this.isUp) {
		var tmp = this.view.currentRoot;
		var model = this.view.graph.getModel();
		while (tmp != null) {
			if (tmp == root) {
				this.isUp = true;
				break;
			}
			tmp = model.getParent(tmp);
		}
	}
};
mxCurrentRootChange.prototype.execute = function() {
	var tmp = this.view.currentRoot;
	this.view.currentRoot = this.previous;
	this.previous = tmp;
	var translate = this.view.graph.getTranslateForRoot(this.view.currentRoot);
	if (translate != null) {
		this.view.translate = new mxPoint( - translate.x, -translate.y);
	}
	var name = (this.isUp) ? mxEvent.UP: mxEvent.DOWN;
	this.view.fireEvent(new mxEventObject(name, 'root', this.view.currentRoot, 'previous', this.previous));
	if (this.isUp) {
		this.view.clear(this.view.currentRoot, true);
		this.view.validate();
	} else {
		this.view.refresh();
	}
	this.isUp = !this.isUp;
};
function mxGraph(container, model, renderHint, stylesheet) {
	this.mouseListeners = null;
	this.renderHint = renderHint;
	if (mxClient.IS_SVG) {
		this.dialect = mxConstants.DIALECT_SVG;
	} else if (renderHint == mxConstants.RENDERING_HINT_EXACT && mxClient.IS_VML) {
		this.dialect = mxConstants.DIALECT_VML;
	} else if (renderHint == mxConstants.RENDERING_HINT_FASTEST) {
		this.dialect = mxConstants.DIALECT_STRICTHTML;
	} else if (renderHint == mxConstants.RENDERING_HINT_FASTER) {
		this.dialect = mxConstants.DIALECT_PREFERHTML;
	} else {
		this.dialect = mxConstants.DIALECT_MIXEDHTML;
	}
	this.model = (model != null) ? model: new mxGraphModel();
	this.multiplicities = [];
	this.imageBundles = [];
	this.cellRenderer = this.createCellRenderer();
	this.setSelectionModel(this.createSelectionModel());
	this.setStylesheet((stylesheet != null) ? stylesheet: this.createStylesheet());
	this.view = this.createGraphView();
	this.model.addListener(mxEvent.CHANGE, mxUtils.bind(this,
	function(sender, evt) {
		this.graphModelChanged(evt.getProperty('edit').changes);
	}));
	this.createHandlers();
	if (container != null) {
		this.init(container);
	}
	this.view.revalidate();
};
if (mxLoadResources) {
	mxResources.add(mxClient.basePath + '/resources/graph');
}
mxGraph.prototype = new mxEventSource();
mxGraph.prototype.constructor = mxGraph;
mxGraph.prototype.EMPTY_ARRAY = [];
mxGraph.prototype.mouseListeners = null;
mxGraph.prototype.isMouseDown = false;
mxGraph.prototype.model = null;
mxGraph.prototype.view = null;
mxGraph.prototype.stylesheet = null;
mxGraph.prototype.selectionModel = null;
mxGraph.prototype.cellEditor = null;
mxGraph.prototype.cellRenderer = null;
mxGraph.prototype.multiplicities = null;
mxGraph.prototype.renderHint = null;
mxGraph.prototype.dialect = null;
mxGraph.prototype.gridSize = 10;
mxGraph.prototype.gridEnabled = true;
mxGraph.prototype.portsEnabled = true;
mxGraph.prototype.doubleTapEnabled = true;
mxGraph.prototype.doubleTapTimeout = 700;
mxGraph.prototype.doubleTapTolerance = 25;
mxGraph.prototype.lastTouchY = 0;
mxGraph.prototype.lastTouchY = 0;
mxGraph.prototype.lastTouchTime = 0;
mxGraph.prototype.gestureEnabled = true;
mxGraph.prototype.tolerance = 4;
mxGraph.prototype.defaultOverlap = 0.5;
mxGraph.prototype.defaultParent = null;
mxGraph.prototype.alternateEdgeStyle = null;
mxGraph.prototype.backgroundImage = null;
mxGraph.prototype.pageVisible = false;
mxGraph.prototype.pageBreaksVisible = false;
mxGraph.prototype.pageBreakColor = 'gray';
mxGraph.prototype.pageBreakDashed = true;
mxGraph.prototype.minPageBreakDist = 20;
mxGraph.prototype.preferPageSize = false;
mxGraph.prototype.pageFormat = mxConstants.PAGE_FORMAT_A4_PORTRAIT;
mxGraph.prototype.pageScale = 1.5;
mxGraph.prototype.enabled = true;
mxGraph.prototype.escapeEnabled = true;
mxGraph.prototype.invokesStopCellEditing = true;
mxGraph.prototype.enterStopsCellEditing = false;
mxGraph.prototype.useScrollbarsForPanning = true;
mxGraph.prototype.exportEnabled = true;
mxGraph.prototype.importEnabled = true;
mxGraph.prototype.cellsLocked = false;
mxGraph.prototype.cellsCloneable = true;
mxGraph.prototype.foldingEnabled = true;
mxGraph.prototype.cellsEditable = true;
mxGraph.prototype.cellsDeletable = true;
mxGraph.prototype.cellsMovable = true;
mxGraph.prototype.edgeLabelsMovable = true;
mxGraph.prototype.vertexLabelsMovable = false;
mxGraph.prototype.dropEnabled = false;
mxGraph.prototype.splitEnabled = true;
mxGraph.prototype.cellsResizable = true;
mxGraph.prototype.cellsBendable = true;
mxGraph.prototype.cellsSelectable = true;
mxGraph.prototype.cellsDisconnectable = true;
mxGraph.prototype.autoSizeCells = false;
mxGraph.prototype.autoScroll = true;
mxGraph.prototype.allowAutoPanning = false;
mxGraph.prototype.ignoreScrollbars = false;
mxGraph.prototype.autoExtend = true;
mxGraph.prototype.maximumGraphBounds = null;
mxGraph.prototype.minimumGraphSize = null;
mxGraph.prototype.minimumContainerSize = null;
mxGraph.prototype.maximumContainerSize = null;
mxGraph.prototype.resizeContainer = false;
mxGraph.prototype.border = 0;
mxGraph.prototype.ordered = true;
mxGraph.prototype.keepEdgesInForeground = false;
mxGraph.prototype.keepEdgesInBackground = true;
mxGraph.prototype.allowNegativeCoordinates = true;
mxGraph.prototype.constrainChildren = true;
mxGraph.prototype.extendParents = true;
mxGraph.prototype.extendParentsOnAdd = true;
mxGraph.prototype.collapseToPreferredSize = true;
mxGraph.prototype.zoomFactor = 1.2;
mxGraph.prototype.keepSelectionVisibleOnZoom = false;
mxGraph.prototype.centerZoom = true;
mxGraph.prototype.resetViewOnRootChange = true;
mxGraph.prototype.resetEdgesOnResize = false;
mxGraph.prototype.resetEdgesOnMove = false;
mxGraph.prototype.resetEdgesOnConnect = true;
mxGraph.prototype.allowLoops = false;
mxGraph.prototype.defaultLoopStyle = mxEdgeStyle.Loop;
mxGraph.prototype.multigraph = true;
mxGraph.prototype.connectableEdges = false;
mxGraph.prototype.allowDanglingEdges = true;
mxGraph.prototype.cloneInvalidEdges = false;
mxGraph.prototype.disconnectOnMove = true;
mxGraph.prototype.labelsVisible = true;
mxGraph.prototype.htmlLabels = false;
mxGraph.prototype.swimlaneSelectionEnabled = true;
mxGraph.prototype.swimlaneNesting = true;
mxGraph.prototype.swimlaneIndicatorColorAttribute = mxConstants.STYLE_FILLCOLOR;
mxGraph.prototype.imageBundles = null;
mxGraph.prototype.minFitScale = 0.1;
mxGraph.prototype.maxFitScale = 8;
mxGraph.prototype.panDx = 0;
mxGraph.prototype.panDy = 0;
mxGraph.prototype.collapsedImage = new mxImage(mxClient.imageBasePath + '/collapsed.gif', 9, 9);
mxGraph.prototype.expandedImage = new mxImage(mxClient.imageBasePath + '/expanded.gif', 9, 9);
mxGraph.prototype.warningImage = new mxImage(mxClient.imageBasePath + '/warning' + ((mxClient.IS_MAC) ? '.png': '.gif'), 16, 16);
mxGraph.prototype.alreadyConnectedResource = (mxClient.language != 'none') ? 'alreadyConnected': '';
mxGraph.prototype.containsValidationErrorsResource = (mxClient.language != 'none') ? 'containsValidationErrors': '';
mxGraph.prototype.collapseExpandResource = (mxClient.language != 'none') ? 'collapse-expand': '';
mxGraph.prototype.init = function(container) {
	this.container = container;
	this.cellEditor = this.createCellEditor();
	this.view.init();
	this.sizeDidChange();
	if (mxClient.IS_IE) {
		mxEvent.addListener(window, 'unload', mxUtils.bind(this,
		function() {
			this.destroy();
		}));
		mxEvent.addListener(container, 'selectstart', mxUtils.bind(this,
		function() {
			return this.isEditing();
		}));
	}
};
mxGraph.prototype.createHandlers = function(container) {
	this.tooltipHandler = new mxTooltipHandler(this);
	this.tooltipHandler.setEnabled(false);
	this.panningHandler = new mxPanningHandler(this);
	this.panningHandler.panningEnabled = false;
	this.selectionCellsHandler = new mxSelectionCellsHandler(this);
	this.connectionHandler = new mxConnectionHandler(this);
	this.connectionHandler.setEnabled(false);
	this.graphHandler = new mxGraphHandler(this);
};
mxGraph.prototype.createSelectionModel = function() {
	return new mxGraphSelectionModel(this);
};
mxGraph.prototype.createStylesheet = function() {
	return new mxStylesheet();
};
mxGraph.prototype.createGraphView = function() {
	return new mxGraphView(this);
};
mxGraph.prototype.createCellRenderer = function() {
	return new mxCellRenderer();
};
mxGraph.prototype.createCellEditor = function() {
	return new mxCellEditor(this);
};
mxGraph.prototype.getModel = function() {
	return this.model;
};
mxGraph.prototype.getView = function() {
	return this.view;
};
mxGraph.prototype.getStylesheet = function() {
	return this.stylesheet;
};
mxGraph.prototype.setStylesheet = function(stylesheet) {
	this.stylesheet = stylesheet;
};
mxGraph.prototype.getSelectionModel = function() {
	return this.selectionModel;
};
mxGraph.prototype.setSelectionModel = function(selectionModel) {
	this.selectionModel = selectionModel;
};
mxGraph.prototype.getSelectionCellsForChanges = function(changes) {
	var cells = [];
	for (var i = 0; i < changes.length; i++) {
		var change = changes[i];
		if (change.constructor != mxRootChange) {
			var cell = null;
			if (change instanceof mxChildChange && change.previous == null) {
				cell = change.child;
			} else if (change.cell != null && change.cell instanceof mxCell) {
				cell = change.cell;
			}
			if (cell != null && mxUtils.indexOf(cells, cell) < 0) {
				cells.push(cell);
			}
		}
	}
	return this.getModel().getTopmostCells(cells);
};
mxGraph.prototype.graphModelChanged = function(changes) {
	for (var i = 0; i < changes.length; i++) {
		this.processChange(changes[i]);
	}
	this.removeSelectionCells(this.getRemovedCellsForChanges(changes));
	this.view.validate();
	this.sizeDidChange();
};
mxGraph.prototype.getRemovedCellsForChanges = function(changes) {
	var result = [];
	for (var i = 0; i < changes.length; i++) {
		var change = changes[i];
		if (change instanceof mxRootChange) {
			break;
		} else if (change instanceof mxChildChange) {
			if (change.previous != null && change.parent == null) {
				result = result.concat(this.model.getDescendants(change.child));
			}
		} else if (change instanceof mxVisibleChange) {
			result = result.concat(this.model.getDescendants(change.cell));
		}
	}
	return result;
};
mxGraph.prototype.processChange = function(change) {
	if (change instanceof mxRootChange) {
		this.clearSelection();
		this.removeStateForCell(change.previous);
		if (this.resetViewOnRootChange) {
			this.view.scale = 1;
			this.view.translate.x = 0;
			this.view.translate.y = 0;
		}
		this.fireEvent(new mxEventObject(mxEvent.ROOT));
	} else if (change instanceof mxChildChange) {
		var newParent = this.model.getParent(change.child);
		if (newParent != null) {
			this.view.invalidate(change.child, true, false, change.previous != null);
		} else {
			this.removeStateForCell(change.child);
			if (this.view.currentRoot == change.child) {
				this.home();
			}
		}
		if (newParent != change.previous) {
			if (newParent != null) {
				this.view.invalidate(newParent, false, false);
			}
			if (change.previous != null) {
				this.view.invalidate(change.previous, false, false);
			}
		}
	} else if (change instanceof mxTerminalChange || change instanceof mxGeometryChange) {
		this.view.invalidate(change.cell);
	} else if (change instanceof mxValueChange) {
		this.view.invalidate(change.cell, false, false);
	} else if (change instanceof mxStyleChange) {
		this.view.removeState(change.cell);
	} else if (change.cell != null && change.cell instanceof mxCell) {
		this.removeStateForCell(change.cell);
	}
};
mxGraph.prototype.removeStateForCell = function(cell) {
	var childCount = this.model.getChildCount(cell);
	for (var i = 0; i < childCount; i++) {
		this.removeStateForCell(this.model.getChildAt(cell, i));
	}
	this.view.removeState(cell);
};
mxGraph.prototype.addCellOverlay = function(cell, overlay) {
	if (cell.overlays == null) {
		cell.overlays = [];
	}
	cell.overlays.push(overlay);
	var state = this.view.getState(cell);
	if (state != null) {
		this.cellRenderer.redraw(state);
	}
	this.fireEvent(new mxEventObject(mxEvent.ADD_OVERLAY, 'cell', cell, 'overlay', overlay));
	return overlay;
};
mxGraph.prototype.getCellOverlays = function(cell) {
	return cell.overlays;
};
mxGraph.prototype.removeCellOverlay = function(cell, overlay) {
	if (overlay == null) {
		this.removeCellOverlays(cell);
	} else {
		var index = mxUtils.indexOf(cell.overlays, overlay);
		if (index >= 0) {
			cell.overlays.splice(index, 1);
			if (cell.overlays.length == 0) {
				cell.overlays = null;
			}
			var state = this.view.getState(cell);
			if (state != null) {
				this.cellRenderer.redraw(state);
			}
			this.fireEvent(new mxEventObject(mxEvent.REMOVE_OVERLAY, 'cell', cell, 'overlay', overlay));
		} else {
			overlay = null;
		}
	}
	return overlay;
};
mxGraph.prototype.removeCellOverlays = function(cell) {
	var overlays = cell.overlays;
	if (overlays != null) {
		cell.overlays = null;
		var state = this.view.getState(cell);
		if (state != null) {
			this.cellRenderer.redraw(state);
		}
		for (var i = 0; i < overlays.length; i++) {
			this.fireEvent(new mxEventObject(mxEvent.REMOVE_OVERLAY, 'cell', cell, 'overlay', overlays[i]));
		}
	}
	return overlays;
};
mxGraph.prototype.clearCellOverlays = function(cell) {
	cell = (cell != null) ? cell: this.model.getRoot();
	this.removeCellOverlays(cell);
	var childCount = this.model.getChildCount(cell);
	for (var i = 0; i < childCount; i++) {
		var child = this.model.getChildAt(cell, i);
		this.clearCellOverlays(child);
	}
};
mxGraph.prototype.setCellWarning = function(cell, warning, img, isSelect) {
	if (warning != null && warning.length > 0) {
		img = (img != null) ? img: this.warningImage;
		var overlay = new mxCellOverlay(img, '<font color=red>' + warning + '</font>');
		if (isSelect) {
			overlay.addListener(mxEvent.CLICK, mxUtils.bind(this,
			function(sender, evt) {
				if (this.isEnabled()) {
					this.setSelectionCell(cell);
				}
			}));
		}
		return this.addCellOverlay(cell, overlay);
	} else {
		this.removeCellOverlays(cell);
	}
	return null;
};
mxGraph.prototype.startEditing = function(evt) {
	this.startEditingAtCell(null, evt);
};
mxGraph.prototype.startEditingAtCell = function(cell, evt) {
	if (cell == null) {
		cell = this.getSelectionCell();
		if (cell != null && !this.isCellEditable(cell)) {
			cell = null;
		}
	}
	if (cell != null) {
		this.fireEvent(new mxEventObject(mxEvent.START_EDITING, 'cell', cell, 'event', evt));
		this.cellEditor.startEditing(cell, evt);
	}
};
mxGraph.prototype.getEditingValue = function(cell, evt) {
	return this.convertValueToString(cell);
};
mxGraph.prototype.stopEditing = function(cancel) {
	this.cellEditor.stopEditing(cancel);
};
mxGraph.prototype.labelChanged = function(cell, value, evt) {
	this.model.beginUpdate();
	try {
		this.cellLabelChanged(cell, value, this.isAutoSizeCell(cell));
		this.fireEvent(new mxEventObject(mxEvent.LABEL_CHANGED, 'cell', cell, 'value', value, 'event', evt));
	} finally {
		this.model.endUpdate();
	}
	return cell;
};
mxGraph.prototype.cellLabelChanged = function(cell, value, autoSize) {
	this.model.beginUpdate();
	try {
		this.model.setValue(cell, value);
		if (autoSize) {
			this.cellSizeUpdated(cell, false);
		}
	} finally {
		this.model.endUpdate();
	}
};
mxGraph.prototype.escape = function(evt) {
	this.stopEditing(true);
	this.connectionHandler.reset();
	this.graphHandler.reset();
	var cells = this.getSelectionCells();
	for (var i = 0; i < cells.length; i++) {
		var state = this.view.getState(cells[i]);
		if (state != null && state.handler != null) {
			state.handler.reset();
		}
	}
};
mxGraph.prototype.click = function(me) {
	var evt = me.getEvent();
	var cell = me.getCell();
	var mxe = new mxEventObject(mxEvent.CLICK, 'event', evt, 'cell', cell);
	if (me.isConsumed()) {
		mxe.consume();
	}
	this.fireEvent(mxe);
	if (this.isEnabled() && !mxEvent.isConsumed(evt) && !mxe.isConsumed()) {
		if (cell != null) {
			this.selectCellForEvent(cell, evt);
		} else {
			var swimlane = null;
			if (this.isSwimlaneSelectionEnabled()) {
				swimlane = this.getSwimlaneAt(me.getGraphX(), me.getGraphY());
			}
			if (swimlane != null) {
				this.selectCellForEvent(swimlane, evt);
			} else if (!this.isToggleEvent(evt)) {
				this.clearSelection();
			}
		}
	}
};
mxGraph.prototype.dblClick = function(evt, cell) {
	var mxe = new mxEventObject(mxEvent.DOUBLE_CLICK, 'event', evt, 'cell', cell);
	this.fireEvent(mxe);
	if (this.isEnabled() && !mxEvent.isConsumed(evt) && !mxe.isConsumed() && cell != null && this.isCellEditable(cell)) {
		this.startEditingAtCell(cell, evt);
	}
};
mxGraph.prototype.scrollPointToVisible = function(x, y, extend, border) {
	if (this.ignoreScrollbars || mxUtils.hasScrollbars(this.container)) {
		var c = this.container;
		border = (border != null) ? border: 20;
		if (x >= c.scrollLeft && y >= c.scrollTop && x <= c.scrollLeft + c.clientWidth && y <= c.scrollTop + c.clientHeight) {
			var dx = c.scrollLeft + c.clientWidth - x;
			if (dx < border) {
				var old = c.scrollLeft;
				c.scrollLeft += border - dx;
				if (extend && old == c.scrollLeft) {
					if (this.dialect == mxConstants.DIALECT_SVG) {
						var root = this.view.getDrawPane().ownerSVGElement;
						var width = this.container.scrollWidth + border - dx;
						root.setAttribute('width', width);
					} else {
						var width = Math.max(c.clientWidth, c.scrollWidth) + border - dx;
						var canvas = this.view.getCanvas();
						canvas.style.width = width + 'px';
					}
					c.scrollLeft += border - dx;
				}
			} else {
				dx = x - c.scrollLeft;
				if (dx < border) {
					c.scrollLeft -= border - dx;
				}
			}
			var dy = c.scrollTop + c.clientHeight - y;
			if (dy < border) {
				var old = c.scrollTop;
				c.scrollTop += border - dy;
				if (old == c.scrollTop && extend) {
					if (this.dialect == mxConstants.DIALECT_SVG) {
						var root = this.view.getDrawPane().ownerSVGElement;
						var height = this.container.scrollHeight + border - dy;
						root.setAttribute('height', height);
					} else {
						var height = Math.max(c.clientHeight, c.scrollHeight) + border - dy;
						var canvas = this.view.getCanvas();
						canvas.style.height = height + 'px';
					}
					c.scrollTop += border - dy;
				}
			} else {
				dy = y - c.scrollTop;
				if (dy < border) {
					c.scrollTop -= border - dy;
				}
			}
		}
	} else if (this.allowAutoPanning && !this.panningHandler.active) {
		if (this.panningManager == null) {
			this.panningManager = this.createPanningManager();
		}
		this.panningManager.panTo(x + this.panDx, y + this.panDy);
	}
};
mxGraph.prototype.createPanningManager = function() {
	return new mxPanningManager(this);
};
mxGraph.prototype.getOffsetSize = function() {
	function parseBorder(value) {
		var result = 0;
		if (value == 'thin') {
			result = 2;
		} else if (value == 'medium') {
			result = 4;
		} else if (value == 'thick') {
			result = 6;
		} else {
			result = parseInt(value);
		}
		if (isNaN(result)) {
			result = 0;
		}
		return result;
	}
	var style = mxUtils.getCurrentStyle(this.container);
	var dx = parseBorder(style.borderLeftWidth) + parseBorder(style.borderRightWidth) + parseInt(style.paddingLeft || 0) + parseInt(style.paddingRight || 0);
	var width = this.container.offsetWidth - dx;
	var dy = parseBorder(style.borderTopWidth) + parseBorder(style.borderBottomWidth) + parseInt(style.paddingTop || 0) + parseInt(style.paddingBottom || 0);
	var height = this.container.offsetHeight - 4 - dy;
	return new mxRectangle(0, 0, width, height);
};
mxGraph.prototype.sizeDidChange = function() {
	var bounds = this.getGraphBounds();
	if (this.container != null) {
		var border = this.getBorder();
		var width = Math.max(0, bounds.x + bounds.width + 1 + border);
		var height = Math.max(0, bounds.y + bounds.height + 1 + border);
		if (this.minimumContainerSize != null) {
			width = Math.max(width, this.minimumContainerSize.width);
			height = Math.max(height, this.minimumContainerSize.height);
		}
		if (this.resizeContainer) {
			var w = width;
			var h = height;
			if (this.maximumContainerSize != null) {
				w = Math.min(this.maximumContainerSize.width, w);
				h = Math.min(this.maximumContainerSize.height, h);
			}
			this.container.style.width = w + 'px';
			this.container.style.height = h + 'px';
		}
		if (this.preferPageSize || (!mxClient.IS_IE && this.pageVisible)) {
			var scale = this.view.scale;
			var tr = this.view.translate;
			var fmt = this.pageFormat;
			var ps = scale * this.pageScale;
			var page = new mxRectangle(scale * tr.x, scale * tr.y, fmt.width * ps, fmt.height * ps);
			var hCount = (this.pageBreaksVisible) ? Math.ceil(width / page.width) : 1;
			var vCount = (this.pageBreaksVisible) ? Math.ceil(height / page.height) : 1;
			width = hCount * page.width + 2;
			height = vCount * page.height + 2;
		}
		var size = this.getOffsetSize();
		width = Math.max(width, size.width);
		height = Math.max(height, size.height);
		if (this.dialect == mxConstants.DIALECT_SVG) {
			var root = this.view.getDrawPane().ownerSVGElement;
			if (this.minimumGraphSize != null) {
				width = Math.max(width, this.minimumGraphSize.width * this.view.scale);
				height = Math.max(height, this.minimumGraphSize.height * this.view.scale);
			}
			width = Math.ceil(width);
			height = Math.ceil(height);
			root.setAttribute('width', width);
			root.setAttribute('height', height);
			if (width <= this.container.offsetWidth && this.container.clientWidth < this.container.offsetWidth) {
				var prevValue = this.container.style.overflow;
				this.container.style.overflow = 'hidden';
				this.container.scrollLeft = 1;
				this.container.style.overflow = prevValue;
			}
		} else {
			width = Math.ceil(width);
			height = Math.ceil(height);
			var drawPane = this.view.getDrawPane();
			var canvas = this.view.getCanvas();
			drawPane.style.width = width + 'px';
			drawPane.style.height = height + 'px';
			canvas.style.width = width + 'px';
			canvas.style.height = height + 'px';
			if (this.minimumGraphSize != null) {
				width = Math.max(width, Math.ceil(this.minimumGraphSize.width * this.view.scale));
				height = Math.max(height, Math.ceil(this.minimumGraphSize.height * this.view.scale));
				canvas.style.width = width + 'px';
				canvas.style.height = height + 'px';
			}
		}
		this.updatePageBreaks(this.pageBreaksVisible, width - 1, height - 1);
	}
	this.fireEvent(new mxEventObject(mxEvent.SIZE, 'bounds', bounds));
};
mxGraph.prototype.updatePageBreaks = function(visible, width, height) {
	var scale = this.view.scale;
	var tr = this.view.translate;
	var fmt = this.pageFormat;
	var ps = scale * this.pageScale;
	var bounds = new mxRectangle(scale * tr.x, scale * tr.y, fmt.width * ps, fmt.height * ps);
	visible = visible && Math.min(bounds.width, bounds.height) > this.minPageBreakDist;
	bounds.x = mxUtils.mod(bounds.x, bounds.width);
	bounds.y = mxUtils.mod(bounds.y, bounds.height);
	var horizontalCount = (visible) ? Math.ceil((width - bounds.x) / bounds.width) : 0;
	var verticalCount = (visible) ? Math.ceil((height - bounds.y) / bounds.height) : 0;
	var right = width;
	var bottom = height;
	if (this.horizontalPageBreaks == null && horizontalCount > 0) {
		this.horizontalPageBreaks = [];
	}
	if (this.horizontalPageBreaks != null) {
		for (var i = 0; i <= horizontalCount; i++) {
			var pts = [new mxPoint(bounds.x + i * bounds.width, 1), new mxPoint(bounds.x + i * bounds.width, bottom)];
			if (this.horizontalPageBreaks[i] != null) {
				this.horizontalPageBreaks[i].scale = scale;
				this.horizontalPageBreaks[i].points = pts;
				this.horizontalPageBreaks[i].redraw();
			} else {
				var pageBreak = new mxPolyline(pts, this.pageBreakColor, this.scale);
				pageBreak.dialect = this.dialect;
				pageBreak.isDashed = this.pageBreakDashed;
				pageBreak.scale = scale;
				pageBreak.crisp = true;
				pageBreak.init(this.view.backgroundPane);
				pageBreak.redraw();
				this.horizontalPageBreaks[i] = pageBreak;
			}
		}
		for (var i = horizontalCount; i < this.horizontalPageBreaks.length; i++) {
			this.horizontalPageBreaks[i].destroy();
		}
		this.horizontalPageBreaks.splice(horizontalCount, this.horizontalPageBreaks.length - horizontalCount);
	}
	if (this.verticalPageBreaks == null && verticalCount > 0) {
		this.verticalPageBreaks = [];
	}
	if (this.verticalPageBreaks != null) {
		for (var i = 0; i <= verticalCount; i++) {
			var pts = [new mxPoint(1, bounds.y + i * bounds.height), new mxPoint(right, bounds.y + i * bounds.height)];
			if (this.verticalPageBreaks[i] != null) {
				this.verticalPageBreaks[i].scale = scale;
				this.verticalPageBreaks[i].points = pts;
				this.verticalPageBreaks[i].redraw();
			} else {
				var pageBreak = new mxPolyline(pts, this.pageBreakColor, scale);
				pageBreak.dialect = this.dialect;
				pageBreak.isDashed = this.pageBreakDashed;
				pageBreak.scale = scale;
				pageBreak.crisp = true;
				pageBreak.init(this.view.backgroundPane);
				pageBreak.redraw();
				this.verticalPageBreaks[i] = pageBreak;
			}
		}
		for (var i = verticalCount; i < this.verticalPageBreaks.length; i++) {
			this.verticalPageBreaks[i].destroy();
		}
		this.verticalPageBreaks.splice(verticalCount, this.verticalPageBreaks.length - verticalCount);
	}
};
mxGraph.prototype.getCellStyle = function(cell) {
	var stylename = this.model.getStyle(cell);
	var style = null;
	if (this.model.isEdge(cell)) {
		style = this.stylesheet.getDefaultEdgeStyle();
	} else {
		style = this.stylesheet.getDefaultVertexStyle();
	}
	if (stylename != null) {
		style = this.postProcessCellStyle(this.stylesheet.getCellStyle(stylename, style));
	}
	if (style == null) {
		style = mxGraph.prototype.EMPTY_ARRAY;
	}
	return style;
};
mxGraph.prototype.postProcessCellStyle = function(style) {
	if (style != null) {
		var key = style[mxConstants.STYLE_IMAGE];
		var image = this.getImageFromBundles(key);
		if (image != null) {
			style[mxConstants.STYLE_IMAGE] = image;
		} else {
			image = key;
		}
		if (image != null && image.substring(0, 11) == "data:image/") {
			var comma = image.indexOf(',');
			if (comma > 0) {
				image = image.substring(0, comma) + ";base64," + image.substring(comma + 1);
			}
			style[mxConstants.STYLE_IMAGE] = image;
		}
	}
	return style;
};
mxGraph.prototype.setCellStyle = function(style, cells) {
	cells = cells || this.getSelectionCells();
	if (cells != null) {
		this.model.beginUpdate();
		try {
			for (var i = 0; i < cells.length; i++) {
				this.model.setStyle(cells[i], style);
			}
		} finally {
			this.model.endUpdate();
		}
	}
};
mxGraph.prototype.toggleCellStyle = function(key, defaultValue, cell) {
	cell = cell || this.getSelectionCell();
	this.toggleCellStyles(key, defaultValue, [cell]);
};
mxGraph.prototype.toggleCellStyles = function(key, defaultValue, cells) {
	defaultValue = (defaultValue != null) ? defaultValue: false;
	cells = cells || this.getSelectionCells();
	if (cells != null && cells.length > 0) {
		var state = this.view.getState(cells[0]);
		var style = (state != null) ? state.style: this.getCellStyle(cells[0]);
		if (style != null) {
			var val = (mxUtils.getValue(style, key, defaultValue)) ? 0 : 1;
			this.setCellStyles(key, val, cells);
		}
	}
};
mxGraph.prototype.setCellStyles = function(key, value, cells) {
	cells = cells || this.getSelectionCells();
	mxUtils.setCellStyles(this.model, cells, key, value);
};
mxGraph.prototype.toggleCellStyleFlags = function(key, flag, cells) {
	this.setCellStyleFlags(key, flag, null, cells);
};
mxGraph.prototype.setCellStyleFlags = function(key, flag, value, cells) {
	cells = cells || this.getSelectionCells();
	if (cells != null && cells.length > 0) {
		if (value == null) {
			var state = this.view.getState(cells[0]);
			var style = (state != null) ? state.style: this.getCellStyle(cells[0]);
			if (style != null) {
				var current = parseInt(style[key] || 0);
				value = !((current & flag) == flag);
			}
		}
		mxUtils.setCellStyleFlags(this.model, cells, key, flag, value);
	}
};
mxGraph.prototype.alignCells = function(align, cells, param) {
	if (cells == null) {
		cells = this.getSelectionCells();
	}
	if (cells != null && cells.length > 1) {
		if (param == null) {
			for (var i = 0; i < cells.length; i++) {
				var geo = this.getCellGeometry(cells[i]);
				if (geo != null && !this.model.isEdge(cells[i])) {
					if (param == null) {
						if (align == mxConstants.ALIGN_CENTER) {
							param = geo.x + geo.width / 2;
							break;
						} else if (align == mxConstants.ALIGN_RIGHT) {
							param = geo.x + geo.width;
						} else if (align == mxConstants.ALIGN_TOP) {
							param = geo.y;
						} else if (align == mxConstants.ALIGN_MIDDLE) {
							param = geo.y + geo.height / 2;
							break;
						} else if (align == mxConstants.ALIGN_BOTTOM) {
							param = geo.y + geo.height;
						} else {
							param = geo.x;
						}
					} else {
						if (align == mxConstants.ALIGN_RIGHT) {
							param = Math.max(param, geo.x + geo.width);
						} else if (align == mxConstants.ALIGN_TOP) {
							param = Math.min(param, geo.y);
						} else if (align == mxConstants.ALIGN_BOTTOM) {
							param = Math.max(param, geo.y + geo.height);
						} else {
							param = Math.min(param, geo.x);
						}
					}
				}
			}
		}
		if (param != null) {
			this.model.beginUpdate();
			try {
				for (var i = 0; i < cells.length; i++) {
					var geo = this.getCellGeometry(cells[i]);
					if (geo != null && !this.model.isEdge(cells[i])) {
						geo = geo.clone();
						if (align == mxConstants.ALIGN_CENTER) {
							geo.x = param - geo.width / 2;
						} else if (align == mxConstants.ALIGN_RIGHT) {
							geo.x = param - geo.width;
						} else if (align == mxConstants.ALIGN_TOP) {
							geo.y = param;
						} else if (align == mxConstants.ALIGN_MIDDLE) {
							geo.y = param - geo.height / 2;
						} else if (align == mxConstants.ALIGN_BOTTOM) {
							geo.y = param - geo.height;
						} else {
							geo.x = param;
						}
						this.model.setGeometry(cells[i], geo);
					}
				}
				this.fireEvent(new mxEventObject(mxEvent.ALIGN_CELLS, 'align', align, 'cells', cells));
			} finally {
				this.model.endUpdate();
			}
		}
	}
	return cells;
};
mxGraph.prototype.flipEdge = function(edge) {
	if (edge != null && this.alternateEdgeStyle != null) {
		this.model.beginUpdate();
		try {
			var style = this.model.getStyle(edge);
			if (style == null || style.length == 0) {
				this.model.setStyle(edge, this.alternateEdgeStyle);
			} else {
				this.model.setStyle(edge, null);
			}
			this.resetEdge(edge);
			this.fireEvent(new mxEventObject(mxEvent.FLIP_EDGE, 'edge', edge));
		} finally {
			this.model.endUpdate();
		}
	}
	return edge;
};
mxGraph.prototype.addImageBundle = function(bundle) {
	this.imageBundles.push(bundle);
};
mxGraph.prototype.removeImageBundle = function(bundle) {
	var tmp = [];
	for (var i = 0; i < this.imageBundles.length; i++) {
		if (this.imageBundles[i] != bundle) {
			tmp.push(this.imageBundles[i]);
		}
	}
	this.imageBundles = tmp;
};
mxGraph.prototype.getImageFromBundles = function(key) {
	if (key != null) {
		for (var i = 0; i < this.imageBundles.length; i++) {
			var image = this.imageBundles[i].getImage(key);
			if (image != null) {
				return image;
			}
		}
	}
	return null;
};
mxGraph.prototype.orderCells = function(back, cells) {
	if (cells == null) {
		cells = mxUtils.sortCells(this.getSelectionCells(), true);
	}
	this.model.beginUpdate();
	try {
		this.cellsOrdered(cells, back);
		this.fireEvent(new mxEventObject(mxEvent.ORDER_CELLS, 'back', back, 'cells', cells));
	} finally {
		this.model.endUpdate();
	}
	return cells;
};
mxGraph.prototype.cellsOrdered = function(cells, back) {
	if (cells != null) {
		this.model.beginUpdate();
		try {
			for (var i = 0; i < cells.length; i++) {
				var parent = this.model.getParent(cells[i]);
				if (back) {
					this.model.add(parent, cells[i], i);
				} else {
					this.model.add(parent, cells[i], this.model.getChildCount(parent) - 1);
				}
			}
			this.fireEvent(new mxEventObject(mxEvent.CELLS_ORDERED, 'back', back, 'cells', cells));
		} finally {
			this.model.endUpdate();
		}
	}
};
mxGraph.prototype.groupCells = function(group, border, cells) {
	if (cells == null) {
		cells = mxUtils.sortCells(this.getSelectionCells(), true);
	}
	cells = this.getCellsForGroup(cells);
	if (group == null) {
		group = this.createGroupCell(cells);
	}
	var bounds = this.getBoundsForGroup(group, cells, border);
	if (cells.length > 0 && bounds != null) {
		var parent = this.model.getParent(group);
		if (parent == null) {
			parent = this.model.getParent(cells[0]);
		}
		this.model.beginUpdate();
		try {
			if (this.getCellGeometry(group) == null) {
				this.model.setGeometry(group, new mxGeometry());
			}
			var index = this.model.getChildCount(group);
			this.cellsAdded(cells, group, index, null, null, false);
			this.cellsMoved(cells, -bounds.x, -bounds.y, false, true);
			index = this.model.getChildCount(parent);
			this.cellsAdded([group], parent, index, null, null, false);
			this.cellsResized([group], [bounds]);
			this.fireEvent(new mxEventObject(mxEvent.GROUP_CELLS, 'group', group, 'border', border, 'cells', cells));
		} finally {
			this.model.endUpdate();
		}
	}
	return group;
};
mxGraph.prototype.getCellsForGroup = function(cells) {
	var result = [];
	if (cells != null && cells.length > 0) {
		var parent = this.model.getParent(cells[0]);
		result.push(cells[0]);
		for (var i = 1; i < cells.length; i++) {
			if (this.model.getParent(cells[i]) == parent) {
				result.push(cells[i]);
			}
		}
	}
	return result;
};
mxGraph.prototype.getBoundsForGroup = function(group, children, border) {
	var result = this.getBoundingBoxFromGeometry(children);
	if (result != null) {
		if (this.isSwimlane(group)) {
			var size = this.getStartSize(group);
			result.x -= size.width;
			result.y -= size.height;
			result.width += size.width;
			result.height += size.height;
		}
		result.x -= border;
		result.y -= border;
		result.width += 2 * border;
		result.height += 2 * border;
	}
	return result;
};
mxGraph.prototype.createGroupCell = function(cells) {
	var group = new mxCell('');
	group.setVertex(true);
	group.setConnectable(false);
	return group;
};
mxGraph.prototype.ungroupCells = function(cells) {
	var result = [];
	if (cells == null) {
		cells = this.getSelectionCells();
		var tmp = [];
		for (var i = 0; i < cells.length; i++) {
			if (this.model.getChildCount(cells[i]) > 0) {
				tmp.push(cells[i]);
			}
		}
		cells = tmp;
	}
	if (cells != null && cells.length > 0) {
		this.model.beginUpdate();
		try {
			for (var i = 0; i < cells.length; i++) {
				var children = this.model.getChildren(cells[i]);
				if (children != null && children.length > 0) {
					children = children.slice();
					var parent = this.model.getParent(cells[i]);
					var index = this.model.getChildCount(parent);
					this.cellsAdded(children, parent, index, null, null, true);
					result = result.concat(children);
				}
			}
			this.cellsRemoved(this.addAllEdges(cells));
			this.fireEvent(new mxEventObject(mxEvent.UNGROUP_CELLS, 'cells', cells));
		} finally {
			this.model.endUpdate();
		}
	}
	return result;
};
mxGraph.prototype.removeCellsFromParent = function(cells) {
	if (cells == null) {
		cells = this.getSelectionCells();
	}
	this.model.beginUpdate();
	try {
		var parent = this.getDefaultParent();
		var index = this.model.getChildCount(parent);
		this.cellsAdded(cells, parent, index, null, null, true);
		this.fireEvent(new mxEventObject(mxEvent.REMOVE_CELLS_FROM_PARENT, 'cells', cells));
	} finally {
		this.model.endUpdate();
	}
	return cells;
};
mxGraph.prototype.updateGroupBounds = function(cells, border, moveGroup) {
	if (cells == null) {
		cells = this.getSelectionCells();
	}
	border = (border != null) ? border: 0;
	moveGroup = (moveGroup != null) ? moveGroup: false;
	this.model.beginUpdate();
	try {
		for (var i = 0; i < cells.length; i++) {
			var geo = this.getCellGeometry(cells[i]);
			if (geo != null) {
				var children = this.getChildCells(cells[i]);
				if (children != null && children.length > 0) {
					var childBounds = this.getBoundingBoxFromGeometry(children);
					if (childBounds.width > 0 && childBounds.height > 0) {
						var size = (this.isSwimlane(cells[i])) ? this.getStartSize(cells[i]) : new mxRectangle();
						geo = geo.clone();
						if (moveGroup) {
							geo.x += childBounds.x - size.width - border;
							geo.y += childBounds.y - size.height - border;
						}
						geo.width = childBounds.width + size.width + 2 * border;
						geo.height = childBounds.height + size.height + 2 * border;
						this.model.setGeometry(cells[i], geo);
						this.moveCells(children, -childBounds.x + size.width + border, -childBounds.y + size.height + border);
					}
				}
			}
		}
	} finally {
		this.model.endUpdate();
	}
	return cells;
};
mxGraph.prototype.cloneCells = function(cells, allowInvalidEdges) {
	allowInvalidEdges = (allowInvalidEdges != null) ? allowInvalidEdges: true;
	var clones = null;
	if (cells != null) {
		var hash = new Object();
		var tmp = [];
		for (var i = 0; i < cells.length; i++) {
			var id = mxCellPath.create(cells[i]);
			hash[id] = cells[i];
			tmp.push(cells[i]);
		}
		if (tmp.length > 0) {
			var scale = this.view.scale;
			var trans = this.view.translate;
			clones = this.model.cloneCells(cells, true);
			for (var i = 0; i < cells.length; i++) {
				if (!allowInvalidEdges && this.model.isEdge(clones[i]) && this.getEdgeValidationError(clones[i], this.model.getTerminal(clones[i], true), this.model.getTerminal(clones[i], false)) != null) {
					clones[i] = null;
				} else {
					var g = this.model.getGeometry(clones[i]);
					if (g != null) {
						var state = this.view.getState(cells[i]);
						var pstate = this.view.getState(this.model.getParent(cells[i]));
						if (state != null && pstate != null) {
							var dx = pstate.origin.x;
							var dy = pstate.origin.y;
							if (this.model.isEdge(clones[i])) {
								var pts = state.absolutePoints;
								var src = this.model.getTerminal(cells[i], true);
								var srcId = mxCellPath.create(src);
								while (src != null && hash[srcId] == null) {
									src = this.model.getParent(src);
									srcId = mxCellPath.create(src);
								}
								if (src == null) {
									g.setTerminalPoint(new mxPoint(pts[0].x / scale - trans.x, pts[0].y / scale - trans.y), true);
								}
								var trg = this.model.getTerminal(cells[i], false);
								var trgId = mxCellPath.create(trg);
								while (trg != null && hash[trgId] == null) {
									trg = this.model.getParent(trg);
									trgId = mxCellPath.create(trg);
								}
								if (trg == null) {
									var n = pts.length - 1;
									g.setTerminalPoint(new mxPoint(pts[n].x / scale - trans.x, pts[n].y / scale - trans.y), false);
								}
								var points = g.points;
								if (points != null) {
									for (var j = 0; j < points.length; j++) {
										points[j].x += dx;
										points[j].y += dy;
									}
								}
							} else {
								g.x += dx;
								g.y += dy;
							}
						}
					}
				}
			}
		} else {
			clones = [];
		}
	}
	return clones;
};
mxGraph.prototype.insertVertex = function(parent, id, value, x, y, width, height, style, relative) {
	var vertex = this.createVertex(parent, id, value, x, y, width, height, style, relative);
	return this.addCell(vertex, parent);
};
mxGraph.prototype.createVertex = function(parent, id, value, x, y, width, height, style, relative) {
	var geometry = new mxGeometry(x, y, width, height);
	geometry.relative = (relative != null) ? relative: false;
	var vertex = new mxCell(value, geometry, style);
	vertex.setId(id);
	vertex.setVertex(true);
	vertex.setConnectable(true);
	return vertex;
};
mxGraph.prototype.insertEdge = function(parent, id, value, source, target, style) {
	var edge = this.createEdge(parent, id, value, source, target, style);
	return this.addEdge(edge, parent, source, target);
};
mxGraph.prototype.createEdge = function(parent, id, value, source, target, style) {
	var edge = new mxCell(value, new mxGeometry(), style);
	edge.setId(id);
	edge.setEdge(true);
	edge.geometry.relative = true;
	return edge;
};
mxGraph.prototype.addEdge = function(edge, parent, source, target, index) {
	return this.addCell(edge, parent, index, source, target);
};
mxGraph.prototype.addCell = function(cell, parent, index, source, target) {
	return this.addCells([cell], parent, index, source, target)[0];
};
mxGraph.prototype.addCells = function(cells, parent, index, source, target) {
	if (parent == null) {
		parent = this.getDefaultParent();
	}
	if (index == null) {
		index = this.model.getChildCount(parent);
	}
	this.model.beginUpdate();
	try {
		this.cellsAdded(cells, parent, index, source, target, false);
		this.fireEvent(new mxEventObject(mxEvent.ADD_CELLS, 'cells', cells, 'parent', parent, 'index', index, 'source', source, 'target', target));
	} finally {
		this.model.endUpdate();
	}
	return cells;
};
mxGraph.prototype.cellsAdded = function(cells, parent, index, source, target, absolute) {
	if (cells != null && parent != null && index != null) {
		this.model.beginUpdate();
		try {
			var parentState = (absolute) ? this.view.getState(parent) : null;
			var o1 = (parentState != null) ? parentState.origin: null;
			var zero = new mxPoint(0, 0);
			for (var i = 0; i < cells.length; i++) {
				if (cells[i] == null) {
					index--;
				} else {
					var previous = this.model.getParent(cells[i]);
					if (o1 != null && cells[i] != parent && parent != previous) {
						var oldState = this.view.getState(previous);
						var o2 = (oldState != null) ? oldState.origin: zero;
						var geo = this.model.getGeometry(cells[i]);
						if (geo != null) {
							var dx = o2.x - o1.x;
							var dy = o2.y - o1.y;
							geo = geo.clone();
							geo.translate(dx, dy);
							if (!geo.relative && this.model.isVertex(cells[i]) && !this.isAllowNegativeCoordinates()) {
								geo.x = Math.max(0, geo.x);
								geo.y = Math.max(0, geo.y);
							}
							this.model.setGeometry(cells[i], geo);
						}
					}
					if (parent == previous) {
						index--;
					}
					this.model.add(parent, cells[i], index + i);
					if (this.isExtendParentsOnAdd() && this.isExtendParent(cells[i])) {
						this.extendParent(cells[i]);
					}
					this.constrainChild(cells[i]);
					if (source != null) {
						this.cellConnected(cells[i], source, true);
					}
					if (target != null) {
						this.cellConnected(cells[i], target, false);
					}
				}
			}
			this.fireEvent(new mxEventObject(mxEvent.CELLS_ADDED, 'cells', cells, 'parent', parent, 'index', index, 'source', source, 'target', target, 'absolute', absolute));
		} finally {
			this.model.endUpdate();
		}
	}
};
mxGraph.prototype.removeCells = function(cells, includeEdges) {
	includeEdges = (includeEdges != null) ? includeEdges: true;
	if (cells == null) {
		cells = this.getDeletableCells(this.getSelectionCells());
	}
	if (includeEdges) {
		cells = this.getDeletableCells(this.addAllEdges(cells));
	}
	this.model.beginUpdate();
	try {
		this.cellsRemoved(cells);
		this.fireEvent(new mxEventObject(mxEvent.REMOVE_CELLS, 'cells', cells, 'includeEdges', includeEdges));
	} finally {
		this.model.endUpdate();
	}
	return cells;
};
mxGraph.prototype.cellsRemoved = function(cells) {
	if (cells != null && cells.length > 0) {
		var scale = this.view.scale;
		var tr = this.view.translate;
		this.model.beginUpdate();
		try {
			var hash = new Object();
			for (var i = 0; i < cells.length; i++) {
				var id = mxCellPath.create(cells[i]);
				hash[id] = cells[i];
			}
			for (var i = 0; i < cells.length; i++) {
				var edges = this.getConnections(cells[i]);
				for (var j = 0; j < edges.length; j++) {
					var id = mxCellPath.create(edges[j]);
					if (hash[id] == null) {
						var geo = this.model.getGeometry(edges[j]);
						if (geo != null) {
							var state = this.view.getState(edges[j]);
							if (state != null) {
								geo = geo.clone();
								var source = state.getVisibleTerminal(true) == cells[i];
								var pts = state.absolutePoints;
								var n = (source) ? 0 : pts.length - 1;
								geo.setTerminalPoint(new mxPoint(pts[n].x / scale - tr.x, pts[n].y / scale - tr.y), source);
								this.model.setTerminal(edges[j], null, source);
								this.model.setGeometry(edges[j], geo);
							}
						}
					}
				}
				this.model.remove(cells[i]);
			}
			this.fireEvent(new mxEventObject(mxEvent.CELLS_REMOVED, 'cells', cells));
		} finally {
			this.model.endUpdate();
		}
	}
};
mxGraph.prototype.splitEdge = function(edge, cells, newEdge, dx, dy) {
	dx = dx || 0;
	dy = dy || 0;
	if (newEdge == null) {
		newEdge = this.cloneCells([edge])[0];
	}
	var parent = this.model.getParent(edge);
	var source = this.model.getTerminal(edge, true);
	this.model.beginUpdate();
	try {
		this.cellsMoved(cells, dx, dy, false, false);
		this.cellsAdded(cells, parent, this.model.getChildCount(parent), null, null, true);
		this.cellsAdded([newEdge], parent, this.model.getChildCount(parent), source, cells[0], false);
		this.cellConnected(edge, cells[0], true);
		this.fireEvent(new mxEventObject(mxEvent.SPLIT_EDGE, 'edge', edge, 'cells', cells, 'newEdge', newEdge, 'dx', dx, 'dy', dy));
	} finally {
		this.model.endUpdate();
	}
	return newEdge;
};
mxGraph.prototype.toggleCells = function(show, cells, includeEdges) {
	if (cells == null) {
		cells = this.getSelectionCells();
	}
	if (includeEdges) {
		cells = this.addAllEdges(cells);
	}
	this.model.beginUpdate();
	try {
		this.cellsToggled(cells, show);
		this.fireEvent(new mxEventObject(mxEvent.TOGGLE_CELLS, 'show', show, 'cells', cells, 'includeEdges', includeEdges));
	} finally {
		this.model.endUpdate();
	}
	return cells;
};
mxGraph.prototype.cellsToggled = function(cells, show) {
	if (cells != null && cells.length > 0) {
		this.model.beginUpdate();
		try {
			for (var i = 0; i < cells.length; i++) {
				this.model.setVisible(cells[i], show);
			}
		} finally {
			this.model.endUpdate();
		}
	}
};
mxGraph.prototype.foldCells = function(collapse, recurse, cells, checkFoldable) {
	recurse = (recurse != null) ? recurse: false;
	if (cells == null) {
		cells = this.getFoldableCells(this.getSelectionCells(), collapse);
	}
	this.stopEditing(false);
	this.model.beginUpdate();
	try {
		this.cellsFolded(cells, collapse, recurse, checkFoldable);
		this.fireEvent(new mxEventObject(mxEvent.FOLD_CELLS, 'collapse', collapse, 'recurse', recurse, 'cells', cells));
	} finally {
		this.model.endUpdate();
	}
	return cells;
};
mxGraph.prototype.cellsFolded = function(cells, collapse, recurse, checkFoldable) {
	if (cells != null && cells.length > 0) {
		this.model.beginUpdate();
		try {
			for (var i = 0; i < cells.length; i++) {
				if ((!checkFoldable || this.isCellFoldable(cells[i], collapse)) && collapse != this.isCellCollapsed(cells[i])) {
					this.model.setCollapsed(cells[i], collapse);
					this.swapBounds(cells[i], collapse);
					if (this.isExtendParent(cells[i])) {
						this.extendParent(cells[i]);
					}
					if (recurse) {
						var children = this.model.getChildren(cells[i]);
						this.foldCells(children, collapse, recurse);
					}
				}
			}
			this.fireEvent(new mxEventObject(mxEvent.CELLS_FOLDED, 'cells', cells, 'collapse', collapse, 'recurse', recurse));
		} finally {
			this.model.endUpdate();
		}
	}
};
mxGraph.prototype.swapBounds = function(cell, willCollapse) {
	if (cell != null) {
		var geo = this.model.getGeometry(cell);
		if (geo != null) {
			geo = geo.clone();
			this.updateAlternateBounds(cell, geo, willCollapse);
			geo.swap();
			this.model.setGeometry(cell, geo);
		}
	}
};
mxGraph.prototype.updateAlternateBounds = function(cell, geo, willCollapse) {
	if (cell != null && geo != null) {
		if (geo.alternateBounds == null) {
			var bounds = geo;
			if (this.collapseToPreferredSize) {
				var tmp = this.getPreferredSizeForCell(cell);
				if (tmp != null) {
					bounds = tmp;
					var state = this.view.getState(cell);
					var style = (state != null) ? state.style: this.getCellStyle(cell);
					var startSize = mxUtils.getValue(style, mxConstants.STYLE_STARTSIZE);
					if (startSize > 0) {
						bounds.height = Math.max(bounds.height, startSize);
					}
				}
			}
			geo.alternateBounds = new mxRectangle(geo.x, geo.y, bounds.width, bounds.height);
		} else {
			geo.alternateBounds.x = geo.x;
			geo.alternateBounds.y = geo.y;
		}
	}
};
mxGraph.prototype.addAllEdges = function(cells) {
	var allCells = cells.slice();
	allCells = allCells.concat(this.getAllEdges(cells));
	return allCells;
};
mxGraph.prototype.getAllEdges = function(cells) {
	var edges = [];
	if (cells != null) {
		for (var i = 0; i < cells.length; i++) {
			var edgeCount = this.model.getEdgeCount(cells[i]);
			for (var j = 0; j < edgeCount; j++) {
				edges.push(this.model.getEdgeAt(cells[i], j));
			}
			var children = this.model.getChildren(cells[i]);
			edges = edges.concat(this.getAllEdges(children));
		}
	}
	return edges;
};
mxGraph.prototype.updateCellSize = function(cell, ignoreChildren) {
	ignoreChildren = (ignoreChildren != null) ? ignoreChildren: false;
	this.model.beginUpdate();
	try {
		this.cellSizeUpdated(cell, ignoreChildren);
		this.fireEvent(new mxEventObject(mxEvent.UPDATE_CELL_SIZE, 'cell', cell, 'ignoreChildren', ignoreChildren));
	} finally {
		this.model.endUpdate();
	}
	return cell;
};
mxGraph.prototype.cellSizeUpdated = function(cell, ignoreChildren) {
	if (cell != null) {
		this.model.beginUpdate();
		try {
			var size = this.getPreferredSizeForCell(cell);
			var geo = this.model.getGeometry(cell);
			if (size != null && geo != null) {
				var collapsed = this.isCellCollapsed(cell);
				geo = geo.clone();
				if (this.isSwimlane(cell)) {
					var state = this.view.getState(cell);
					var style = (state != null) ? state.style: this.getCellStyle(cell);
					var cellStyle = this.model.getStyle(cell);
					if (cellStyle == null) {
						cellStyle = '';
					}
					if (mxUtils.getValue(style, mxConstants.STYLE_HORIZONTAL, true)) {
						cellStyle = mxUtils.setStyle(cellStyle, mxConstants.STYLE_STARTSIZE, size.height + 8);
						if (collapsed) {
							geo.height = size.height + 8;
						}
						geo.width = size.width;
					} else {
						cellStyle = mxUtils.setStyle(cellStyle, mxConstants.STYLE_STARTSIZE, size.width + 8);
						if (collapsed) {
							geo.width = size.width + 8;
						}
						geo.height = size.height;
					}
					this.model.setStyle(cell, cellStyle);
				} else {
					geo.width = size.width;
					geo.height = size.height;
				}
				if (!ignoreChildren && !collapsed) {
					var bounds = this.view.getBounds(this.model.getChildren(cell));
					if (bounds != null) {
						var tr = this.view.translate;
						var scale = this.view.scale;
						var width = (bounds.x + bounds.width) / scale - geo.x - tr.x;
						var height = (bounds.y + bounds.height) / scale - geo.y - tr.y;
						geo.width = Math.max(geo.width, width);
						geo.height = Math.max(geo.height, height);
					}
				}
				this.cellsResized([cell], [geo]);
			}
		} finally {
			this.model.endUpdate();
		}
	}
};
mxGraph.prototype.getPreferredSizeForCell = function(cell) {
	var result = null;
	if (cell != null) {
		var state = this.view.getState(cell);
		var style = (state != null) ? state.style: this.getCellStyle(cell);
		if (style != null && !this.model.isEdge(cell)) {
			var fontSize = style[mxConstants.STYLE_FONTSIZE] || mxConstants.DEFAULT_FONTSIZE;
			var dx = 0;
			var dy = 0;
			if (this.getImage(state) != null || style[mxConstants.STYLE_IMAGE] != null) {
				if (style[mxConstants.STYLE_SHAPE] == mxConstants.SHAPE_LABEL) {
					if (style[mxConstants.STYLE_VERTICAL_ALIGN] == mxConstants.ALIGN_MIDDLE) {
						dx += parseFloat(style[mxConstants.STYLE_IMAGE_WIDTH]) || mxLabel.prototype.imageSize;
					}
					if (style[mxConstants.STYLE_ALIGN] != mxConstants.ALIGN_CENTER) {
						dy += parseFloat(style[mxConstants.STYLE_IMAGE_HEIGHT]) || mxLabel.prototype.imageSize;
					}
				}
			}
			dx += 2 * (style[mxConstants.STYLE_SPACING] || 0);
			dx += style[mxConstants.STYLE_SPACING_LEFT] || 0;
			dx += style[mxConstants.STYLE_SPACING_RIGHT] || 0;
			dy += 2 * (style[mxConstants.STYLE_SPACING] || 0);
			dy += style[mxConstants.STYLE_SPACING_TOP] || 0;
			dy += style[mxConstants.STYLE_SPACING_BOTTOM] || 0;
			var image = this.getFoldingImage(state);
			if (image != null) {
				dx += image.width + 8;
			}
			var value = this.getLabel(cell);
			if (value != null && value.length > 0) {
				if (!this.isHtmlLabel(cell)) {
					value = value.replace(/\n/g, '<br>');
				}
				var size = mxUtils.getSizeForString(value, fontSize, style[mxConstants.STYLE_FONTFAMILY]);
				var width = size.width + dx;
				var height = size.height + dy;
				if (!mxUtils.getValue(style, mxConstants.STYLE_HORIZONTAL, true)) {
					var tmp = height;
					height = width;
					width = tmp;
				}
				if (this.gridEnabled) {
					width = this.snap(width + this.gridSize / 2);
					height = this.snap(height + this.gridSize / 2);
				}
				result = new mxRectangle(0, 0, width, height);
			} else {
				var gs2 = 4 * this.gridSize;
				result = new mxRectangle(0, 0, gs2, gs2);
			}
		}
	}
	return result;
};
mxGraph.prototype.handleGesture = function(state, evt) {
	if (Math.abs(1 - evt.scale) > 0.2) {
		var scale = this.view.scale;
		var tr = this.view.translate;
		var w = state.width * evt.scale;
		var h = state.height * evt.scale;
		var x = state.x - (w - state.width) / 2;
		var y = state.y - (h - state.height) / 2;
		var bounds = new mxRectangle(this.snap(x / scale) - tr.x, this.snap(y / scale) - tr.y, this.snap(w / scale), this.snap(h / scale));
		this.resizeCell(state.cell, bounds);
	}
};
mxGraph.prototype.resizeCell = function(cell, bounds) {
	return this.resizeCells([cell], [bounds])[0];
};
mxGraph.prototype.resizeCells = function(cells, bounds) {
	this.model.beginUpdate();
	try {
		this.cellsResized(cells, bounds);
		this.fireEvent(new mxEventObject(mxEvent.RESIZE_CELLS, 'cells', cells, 'bounds', bounds));
	} finally {
		this.model.endUpdate();
	}
	return cells;
};
mxGraph.prototype.cellsResized = function(cells, bounds) {
	if (cells != null && bounds != null && cells.length == bounds.length) {
		this.model.beginUpdate();
		try {
			for (var i = 0; i < cells.length; i++) {
				var tmp = bounds[i];
				var geo = this.model.getGeometry(cells[i]);
				if (geo != null && (geo.x != tmp.x || geo.y != tmp.y || geo.width != tmp.width || geo.height != tmp.height)) {
					geo = geo.clone();
					if (geo.relative) {
						var offset = geo.offset;
						if (offset != null) {
							offset.x += tmp.x - geo.x;
							offset.y += tmp.y - geo.y;
						}
					} else {
						geo.x = tmp.x;
						geo.y = tmp.y;
					}
					geo.width = tmp.width;
					geo.height = tmp.height;
					if (!geo.relative && this.model.isVertex(cells[i]) && !this.isAllowNegativeCoordinates()) {
						geo.x = Math.max(0, geo.x);
						geo.y = Math.max(0, geo.y);
					}
					this.model.setGeometry(cells[i], geo);
					if (this.isExtendParent(cells[i])) {
						this.extendParent(cells[i]);
					}
				}
			}
			if (this.resetEdgesOnResize) {
				this.resetEdges(cells);
			}
			this.fireEvent(new mxEventObject(mxEvent.CELLS_RESIZED, 'cells', cells, 'bounds', bounds));
		} finally {
			this.model.endUpdate();
		}
	}
};
mxGraph.prototype.extendParent = function(cell) {
	if (cell != null) {
		var parent = this.model.getParent(cell);
		var p = this.model.getGeometry(parent);
		if (parent != null && p != null && !this.isCellCollapsed(parent)) {
			var geo = this.model.getGeometry(cell);
			if (geo != null && (p.width < geo.x + geo.width || p.height < geo.y + geo.height)) {
				p = p.clone();
				p.width = Math.max(p.width, geo.x + geo.width);
				p.height = Math.max(p.height, geo.y + geo.height);
				this.cellsResized([parent], [p]);
			}
		}
	}
};
mxGraph.prototype.importCells = function(cells, dx, dy, target, evt) {
	return this.moveCells(cells, dx, dy, true, target, evt);
};
mxGraph.prototype.moveCells = function(cells, dx, dy, clone, target, evt) {
	dx = (dx != null) ? dx: 0;
	dy = (dy != null) ? dy: 0;
	clone = (clone != null) ? clone: false;
	if (cells != null && (dx != 0 || dy != 0 || clone || target != null)) {
		this.model.beginUpdate();
		try {
			if (clone) {
				cells = this.cloneCells(cells, this.isCloneInvalidEdges());
				if (target == null) {
					target = this.getDefaultParent();
				}
			}
			this.cellsMoved(cells, dx, dy, !clone && this.isDisconnectOnMove() && this.isAllowDanglingEdges(), target == null);
			if (target != null) {
				var index = this.model.getChildCount(target);
				this.cellsAdded(cells, target, index, null, null, true);
			}
			this.fireEvent(new mxEventObject(mxEvent.MOVE_CELLS, 'cells', cells, 'dx', dx, 'dy', dy, 'clone', clone, 'target', target, 'event', evt));
		} finally {
			this.model.endUpdate();
		}
	}
	return cells;
};
mxGraph.prototype.cellsMoved = function(cells, dx, dy, disconnect, constrain) {
	if (cells != null && (dx != 0 || dy != 0)) {
		this.model.beginUpdate();
		try {
			if (disconnect) {
				this.disconnectGraph(cells);
			}
			for (var i = 0; i < cells.length; i++) {
				this.translateCell(cells[i], dx, dy);
				if (constrain) {
					this.constrainChild(cells[i]);
				}
			}
			if (this.resetEdgesOnMove) {
				this.resetEdges(cells);
			}
			this.fireEvent(new mxEventObject(mxEvent.CELLS_MOVED, 'cells', cells, 'dx', dy, 'dy', dy, 'disconnect', disconnect));
		} finally {
			this.model.endUpdate();
		}
	}
};
mxGraph.prototype.translateCell = function(cell, dx, dy) {
	var geo = this.model.getGeometry(cell);
	if (geo != null) {
		geo = geo.clone();
		geo.translate(dx, dy);
		if (!geo.relative && this.model.isVertex(cell) && !this.isAllowNegativeCoordinates()) {
			geo.x = Math.max(0, geo.x);
			geo.y = Math.max(0, geo.y);
		}
		if (geo.relative && !this.model.isEdge(cell)) {
			if (geo.offset == null) {
				geo.offset = new mxPoint(dx, dy);
			} else {
				geo.offset.x += dx;
				geo.offset.y += dy;
			}
		}
		this.model.setGeometry(cell, geo);
	}
};
mxGraph.prototype.getCellContainmentArea = function(cell) {
	if (cell != null && !this.model.isEdge(cell)) {
		var parent = this.model.getParent(cell);
		if (parent == this.getDefaultParent() || parent == this.getCurrentRoot()) {
			return this.getMaximumGraphBounds();
		} else if (parent != null && parent != this.getDefaultParent()) {
			var g = this.model.getGeometry(parent);
			if (g != null) {
				var x = 0;
				var y = 0;
				var w = g.width;
				var h = g.height;
				if (this.isSwimlane(parent)) {
					var size = this.getStartSize(parent);
					x = size.width;
					w -= size.width;
					y = size.height;
					h -= size.height;
				}
				return new mxRectangle(x, y, w, h);
			}
		}
	}
	return null;
};
mxGraph.prototype.getMaximumGraphBounds = function() {
	return this.maximumGraphBounds;
};
mxGraph.prototype.constrainChild = function(cell) {
	if (cell != null) {
		var geo = this.model.getGeometry(cell);
		var area = (this.isConstrainChild(cell)) ? this.getCellContainmentArea(cell) : this.getMaximumGraphBounds();
		if (geo != null && area != null) {
			if (!geo.relative && (geo.x < area.x || geo.y < area.y || area.width < geo.x + geo.width || area.height < geo.y + geo.height)) {
				var overlap = this.getOverlap(cell);
				if (area.width > 0) {
					geo.x = Math.min(geo.x, area.x + area.width - (1 - overlap) * geo.width);
				}
				if (area.height > 0) {
					geo.y = Math.min(geo.y, area.y + area.height - (1 - overlap) * geo.height);
				}
				geo.x = Math.max(geo.x, area.x - geo.width * overlap);
				geo.y = Math.max(geo.y, area.y - geo.height * overlap);
			}
		}
	}
};
mxGraph.prototype.resetEdges = function(cells) {
	if (cells != null) {
		var hash = new Object();
		for (var i = 0; i < cells.length; i++) {
			var id = mxCellPath.create(cells[i]);
			hash[id] = cells[i];
		}
		this.model.beginUpdate();
		try {
			for (var i = 0; i < cells.length; i++) {
				var edges = this.model.getEdges(cells[i]);
				if (edges != null) {
					for (var j = 0; j < edges.length; j++) {
						var state = this.view.getState(edges[j]);
						var source = (state != null) ? state.getVisibleTerminal(true) : this.view.getVisibleTerminal(edges[j], true);
						var target = (state != null) ? state.getVisibleTerminal(false) : this.view.getVisibleTerminal(edges[j], false);
						var sourceId = mxCellPath.create(source);
						var targetId = mxCellPath.create(target);
						if (hash[sourceId] == null || hash[targetId] == null) {
							this.resetEdge(edges[j]);
						}
					}
				}
				this.resetEdges(this.model.getChildren(cells[i]));
			}
		} finally {
			this.model.endUpdate();
		}
	}
};
mxGraph.prototype.resetEdge = function(edge) {
	var geo = this.model.getGeometry(edge);
	if (geo != null && geo.points != null && geo.points.length > 0) {
		geo = geo.clone();
		geo.points = [];
		this.model.setGeometry(edge, geo);
	}
	return edge;
};
mxGraph.prototype.getAllConnectionConstraints = function(terminal, source) {
	if (terminal != null && terminal.shape != null && terminal.shape instanceof mxStencilShape) {
		if (terminal.shape.stencil != null) {
			return terminal.shape.stencil.constraints;
		}
	}
	return null;
};
mxGraph.prototype.getConnectionConstraint = function(edge, terminal, source) {
	var point = null;
	var x = edge.style[(source) ? mxConstants.STYLE_EXIT_X: mxConstants.STYLE_ENTRY_X];
	if (x != null) {
		var y = edge.style[(source) ? mxConstants.STYLE_EXIT_Y: mxConstants.STYLE_ENTRY_Y];
		if (y != null) {
			point = new mxPoint(parseFloat(x), parseFloat(y));
		}
	}
	var perimeter = false;
	if (point != null) {
		perimeter = mxUtils.getValue(edge.style, (source) ? mxConstants.STYLE_EXIT_PERIMETER: mxConstants.STYLE_ENTRY_PERIMETER, true);
	}
	return new mxConnectionConstraint(point, perimeter);
};
mxGraph.prototype.setConnectionConstraint = function(edge, terminal, source, constraint) {
	if (constraint != null) {
		this.model.beginUpdate();
		try {
			if (constraint == null || constraint.point == null) {
				this.setCellStyles((source) ? mxConstants.STYLE_EXIT_X: mxConstants.STYLE_ENTRY_X, null, [edge]);
				this.setCellStyles((source) ? mxConstants.STYLE_EXIT_Y: mxConstants.STYLE_ENTRY_Y, null, [edge]);
				this.setCellStyles((source) ? mxConstants.STYLE_EXIT_PERIMETER: mxConstants.STYLE_ENTRY_PERIMETER, null, [edge]);
			} else if (constraint.point != null) {
				this.setCellStyles((source) ? mxConstants.STYLE_EXIT_X: mxConstants.STYLE_ENTRY_X, constraint.point.x, [edge]);
				this.setCellStyles((source) ? mxConstants.STYLE_EXIT_Y: mxConstants.STYLE_ENTRY_Y, constraint.point.y, [edge]);
				if (!constraint.perimeter) {
					this.setCellStyles((source) ? mxConstants.STYLE_EXIT_PERIMETER: mxConstants.STYLE_ENTRY_PERIMETER, '0', [edge]);
				} else {
					this.setCellStyles((source) ? mxConstants.STYLE_EXIT_PERIMETER: mxConstants.STYLE_ENTRY_PERIMETER, null, [edge]);
				}
			}
		} finally {
			this.model.endUpdate();
		}
	}
};
mxGraph.prototype.getConnectionPoint = function(vertex, constraint) {
	var point = null;
	if (vertex != null) {
		var bounds = this.view.getPerimeterBounds(vertex);
		var cx = new mxPoint(bounds.getCenterX(), bounds.getCenterY());
		var direction = vertex.style[mxConstants.STYLE_DIRECTION];
		var r1 = 0;
		if (direction != null) {
			if (direction == 'north') {
				r1 += 270;
			} else if (direction == 'west') {
				r1 += 180;
			} else if (direction == 'south') {
				r1 += 90;
			}
			if (direction == 'north' || direction == 'south') {
				bounds.x += bounds.width / 2 - bounds.height / 2;
				bounds.y += bounds.height / 2 - bounds.width / 2;
				var tmp = bounds.width;
				bounds.width = bounds.height;
				bounds.height = tmp;
			}
		}
		if (constraint.point != null) {
			point = new mxPoint(bounds.x + constraint.point.x * bounds.width, bounds.y + constraint.point.y * bounds.height);
		}
		var r2 = vertex.style[mxConstants.STYLE_ROTATION] || 0;
		if (constraint.perimeter) {
			if (r1 != 0 && point != null) {
				var cos = 0;
				var sin = 0;
				if (r1 == 90) {
					sin = 1;
				} else if (r1 == 180) {
					cos = -1;
				} else if (r2 == 270) {
					sin = -1;
				}
				point = mxUtils.getRotatedPoint(point, cos, sin, cx);
			}
			if (point != null && constraint.perimeter) {
				point = this.view.getPerimeterPoint(vertex, point, false);
			}
		} else {
			r2 += r1;
		}
		if (r2 != 0 && point != null) {
			var rad = mxUtils.toRadians(r2);
			var cos = Math.cos(rad);
			var sin = Math.sin(rad);
			point = mxUtils.getRotatedPoint(point, cos, sin, cx);
		}
	}
	return point;
};
mxGraph.prototype.connectCell = function(edge, terminal, source, constraint) {
	this.model.beginUpdate();
	try {
		var previous = this.model.getTerminal(edge, source);
		this.cellConnected(edge, terminal, source, constraint);
		this.fireEvent(new mxEventObject(mxEvent.CONNECT_CELL, 'edge', edge, 'terminal', terminal, 'source', source, 'previous', previous));
	} finally {
		this.model.endUpdate();
	}
	return edge;
};
mxGraph.prototype.cellConnected = function(edge, terminal, source, constraint) {
	if (edge != null) {
		this.model.beginUpdate();
		try {
			var previous = this.model.getTerminal(edge, source);
			this.setConnectionConstraint(edge, terminal, source, constraint);
			if (this.isPortsEnabled()) {
				var id = null;
				if (this.isPort(terminal)) {
					id = terminal.getId();
					terminal = this.getTerminalForPort(terminal, source);
				}
				var key = (source) ? mxConstants.STYLE_SOURCE_PORT: mxConstants.STYLE_TARGET_PORT;
				this.setCellStyles(key, id, [edge]);
			}
			this.model.setTerminal(edge, terminal, source);
			if (this.resetEdgesOnConnect) {
				this.resetEdge(edge);
			}
			this.fireEvent(new mxEventObject(mxEvent.CELL_CONNECTED, 'edge', edge, 'terminal', terminal, 'source', source, 'previous', previous));
		} finally {
			this.model.endUpdate();
		}
	}
};
mxGraph.prototype.disconnectGraph = function(cells) {
	if (cells != null) {
		this.model.beginUpdate();
		try {
			var scale = this.view.scale;
			var tr = this.view.translate;
			var hash = new Object();
			for (var i = 0; i < cells.length; i++) {
				var id = mxCellPath.create(cells[i]);
				hash[id] = cells[i];
			}
			for (var i = 0; i < cells.length; i++) {
				if (this.model.isEdge(cells[i])) {
					var geo = this.model.getGeometry(cells[i]);
					if (geo != null) {
						var state = this.view.getState(cells[i]);
						var pstate = this.view.getState(this.model.getParent(cells[i]));
						if (state != null && pstate != null) {
							geo = geo.clone();
							var dx = -pstate.origin.x;
							var dy = -pstate.origin.y;
							var pts = state.absolutePoints;
							var src = this.model.getTerminal(cells[i], true);
							if (src != null && this.isCellDisconnectable(cells[i], src, true)) {
								var srcId = mxCellPath.create(src);
								while (src != null && hash[srcId] == null) {
									src = this.model.getParent(src);
									srcId = mxCellPath.create(src);
								}
								if (src == null) {
									geo.setTerminalPoint(new mxPoint(pts[0].x / scale - tr.x + dx, pts[0].y / scale - tr.y + dy), true);
									this.model.setTerminal(cells[i], null, true);
								}
							}
							var trg = this.model.getTerminal(cells[i], false);
							if (trg != null && this.isCellDisconnectable(cells[i], trg, false)) {
								var trgId = mxCellPath.create(trg);
								while (trg != null && hash[trgId] == null) {
									trg = this.model.getParent(trg);
									trgId = mxCellPath.create(trg);
								}
								if (trg == null) {
									var n = pts.length - 1;
									geo.setTerminalPoint(new mxPoint(pts[n].x / scale - tr.x + dx, pts[n].y / scale - tr.y + dy), false);
									this.model.setTerminal(cells[i], null, false);
								}
							}
							this.model.setGeometry(cells[i], geo);
						}
					}
				}
			}
		} finally {
			this.model.endUpdate();
		}
	}
};
mxGraph.prototype.getCurrentRoot = function() {
	return this.view.currentRoot;
};
mxGraph.prototype.getTranslateForRoot = function(cell) {
	return null;
};
mxGraph.prototype.isPort = function(cell) {
	return false;
};
mxGraph.prototype.getTerminalForPort = function(cell, source) {
	return this.model.getParent(cell);
};
mxGraph.prototype.getChildOffsetForCell = function(cell) {
	return null;
};
mxGraph.prototype.enterGroup = function(cell) {
	cell = cell || this.getSelectionCell();
	if (cell != null && this.isValidRoot(cell)) {
		this.view.setCurrentRoot(cell);
		this.clearSelection();
	}
};
mxGraph.prototype.exitGroup = function() {
	var root = this.model.getRoot();
	var current = this.getCurrentRoot();
	if (current != null) {
		var next = this.model.getParent(current);
		while (next != root && !this.isValidRoot(next) && this.model.getParent(next) != root) {
			next = this.model.getParent(next);
		}
		if (next == root || this.model.getParent(next) == root) {
			this.view.setCurrentRoot(null);
		} else {
			this.view.setCurrentRoot(next);
		}
		var state = this.view.getState(current);
		if (state != null) {
			this.setSelectionCell(current);
		}
	}
};
mxGraph.prototype.home = function() {
	var current = this.getCurrentRoot();
	if (current != null) {
		this.view.setCurrentRoot(null);
		var state = this.view.getState(current);
		if (state != null) {
			this.setSelectionCell(current);
		}
	}
};
mxGraph.prototype.isValidRoot = function(cell) {
	return (cell != null);
};
mxGraph.prototype.getGraphBounds = function() {
	return this.view.getGraphBounds();
};
mxGraph.prototype.getCellBounds = function(cell, includeEdges, includeDescendants) {
	var cells = [cell];
	if (includeEdges) {
		cells = cells.concat(this.model.getEdges(cell));
	}
	var result = this.view.getBounds(cells);
	if (includeDescendants) {
		var childCount = this.model.getChildCount(cell);
		for (var i = 0; i < childCount; i++) {
			var tmp = this.getCellBounds(this.model.getChildAt(cell, i), includeEdges, true);
			if (result != null) {
				result.add(tmp);
			} else {
				result = tmp;
			}
		}
	}
	return result;
};
mxGraph.prototype.getBoundingBoxFromGeometry = function(cells, includeEdges) {
	includeEdges = (includeEdges != null) ? includeEdges: false;
	var result = null;
	if (cells != null) {
		for (var i = 0; i < cells.length; i++) {
			if (includeEdges || this.model.isVertex(cells[i])) {
				var geo = this.getCellGeometry(cells[i]);
				if (geo != null) {
					var pts = geo.points;
					if (pts != null && pts.length > 0) {
						var tmp = new mxRectangle(pts[0].x, pts[0].y, 0, 0);
						var addPoint = function(pt) {
							if (pt != null) {
								tmp.add(new mxRectangle(pt.x, pt.y, 0, 0));
							}
						};
						for (var j = 1; j < pts.length; j++) {
							addPoint(pts[j]);
						}
						addPoint(geo.getTerminalPoint(true));
						addPoint(geo.getTerminalPoint(false));
					}
					if (result == null) {
						result = new mxRectangle(geo.x, geo.y, geo.width, geo.height);
					} else {
						result.add(geo);
					}
				}
			}
		}
	}
	return result;
};
mxGraph.prototype.refresh = function(cell) {
	this.view.clear(cell, cell == null);
	this.view.validate();
	this.sizeDidChange();
	this.fireEvent(new mxEventObject(mxEvent.REFRESH));
};
mxGraph.prototype.snap = function(value) {
	if (this.gridEnabled) {
		value = Math.round(value / this.gridSize) * this.gridSize;
	}
	return value;
};
mxGraph.prototype.panGraph = function(dx, dy) {
	if (this.useScrollbarsForPanning && mxUtils.hasScrollbars(this.container)) {
		this.container.scrollLeft = -dx;
		this.container.scrollTop = -dy;
	} else {
		var canvas = this.view.getCanvas();
		if (this.dialect == mxConstants.DIALECT_SVG) {
			if (dx == 0 && dy == 0) {
				if (mxClient.IS_IE) {
					canvas.setAttribute('transform', 'translate(' + dx + ',' + dy + ')');
				} else {
					canvas.removeAttribute('transform');
				}
				if (this.shiftPreview != null) {
					var child = this.shiftPreview.firstChild;
					while (child != null) {
						var next = child.nextSibling;
						this.container.appendChild(child);
						child = next;
					}
					this.shiftPreview.parentNode.removeChild(this.shiftPreview);
					this.shiftPreview = null;
				}
			} else {
				canvas.setAttribute('transform', 'translate(' + dx + ',' + dy + ')');
				if (this.shiftPreview == null) {
					this.shiftPreview = document.createElement('div');
					this.shiftPreview.style.position = 'absolute';
					this.shiftPreview.style.overflow = 'visible';
					var child = this.container.firstChild;
					while (child != null) {
						var next = child.nextSibling;
						if (child != canvas.parentNode) {
							this.shiftPreview.appendChild(child);
						}
						child = next;
					}
					this.container.appendChild(this.shiftPreview);
				}
				this.shiftPreview.style.left = dx + 'px';
				this.shiftPreview.style.top = dy + 'px';
			}
		} else {
			canvas.style.left = dx + 'px';
			canvas.style.top = dy + 'px';
		}
		this.panDx = dx;
		this.panDy = dy;
		this.fireEvent(new mxEventObject(mxEvent.PAN));
	}
};
mxGraph.prototype.zoomIn = function() {
	this.zoom(this.zoomFactor);
};
mxGraph.prototype.zoomOut = function() {
	this.zoom(1 / this.zoomFactor);
};
mxGraph.prototype.zoomActual = function() {
	if (this.view.scale == 1) {
		this.view.setTranslate(0, 0);
	} else {
		this.view.translate.x = 0;
		this.view.translate.y = 0;
		this.view.setScale(1);
	}
};
mxGraph.prototype.zoom = function(factor) {
	var scale = this.view.scale * factor;
	var state = this.view.getState(this.getSelectionCell());
	if (this.keepSelectionVisibleOnZoom && state != null) {
		var rect = new mxRectangle(state.x * factor, state.y * factor, state.width * factor, state.height * factor);
		this.view.scale = scale;
		if (!this.scrollRectToVisible(rect)) {
			this.view.revalidate();
			this.view.setScale(scale);
		}
	} else if (this.centerZoom && !mxUtils.hasScrollbars(this.container)) {
		var dx = this.container.offsetWidth;
		var dy = this.container.offsetHeight;
		if (factor > 1) {
			var f = (factor - 1) / (scale * 2);
			dx *= -f;
			dy *= -f;
		} else {
			var f = (1 / factor - 1) / (this.view.scale * 2);
			dx *= f;
			dy *= f;
		}
		this.view.scaleAndTranslate(scale, this.view.translate.x + dx, this.view.translate.y + dy);
	} else {
		this.view.setScale(scale);
	}
};
mxGraph.prototype.fit = function(border, keepOrigin) {
	if (this.container != null) {
		border = (border != null) ? border: 0;
		keepOrigin = (keepOrigin != null) ? keepOrigin: false;
		var w1 = this.container.offsetWidth - 3;
		var h1 = this.container.offsetHeight - 3;
		var bounds = this.view.getGraphBounds();
		if (keepOrigin && bounds.x != null && bounds.y != null) {
			bounds.width += bounds.x;
			bounds.height += bounds.y;
			bounds.x = 0;
			bounds.y = 0;
		}
		var s = this.view.scale;
		var w2 = bounds.width / s;
		var h2 = bounds.height / s;
		if (this.backgroundImage != null) {
			w2 = Math.max(w2, this.backgroundImage.width - bounds.x / s);
			h2 = Math.max(h2, this.backgroundImage.height - bounds.y / s);
		}
		var b = (keepOrigin) ? border: 2 * border;
		var s2 = Math.floor(Math.min(w1 / (w2 + b), h1 / (h2 + b)) * 100) / 100;
		if (s2 > this.minFitScale && s2 < this.maxFitScale) {
			if (!keepOrigin) {
				var x0 = (bounds.x != null) ? Math.floor(this.view.translate.x - bounds.x / s + border + 1) : border;
				var y0 = (bounds.y != null) ? Math.floor(this.view.translate.y - bounds.y / s + border + 1) : border;
				this.view.scaleAndTranslate(s2, x0, y0);
			} else {
				this.view.setScale(s2);
			}
		}
	}
	return this.view.scale;
};
mxGraph.prototype.scrollCellToVisible = function(cell, center) {
	var x = -this.view.translate.x;
	var y = -this.view.translate.y;
	var state = this.view.getState(cell);
	if (state != null) {
		var bounds = new mxRectangle(x + state.x, y + state.y, state.width, state.height);
		if (center && this.container != null) {
			var w = this.container.clientWidth;
			var h = this.container.clientHeight;
			bounds.x = bounds.getCenterX() - w / 2;
			bounds.width = w;
			bounds.y = bounds.getCenterY() - h / 2;
			bounds.height = h;
		}
		if (this.scrollRectToVisible(bounds)) {
			this.view.setTranslate(this.view.translate.x, this.view.translate.y);
		}
	}
};
mxGraph.prototype.scrollRectToVisible = function(rect) {
	var isChanged = false;
	if (rect != null) {
		var w = this.container.offsetWidth;
		var h = this.container.offsetHeight;
		var widthLimit = Math.min(w, rect.width);
		var heightLimit = Math.min(h, rect.height);
		if (mxUtils.hasScrollbars(this.container)) {
			var c = this.container;
			var dx = c.scrollLeft - rect.x;
			var ddx = Math.max(dx - c.scrollLeft, 0);
			if (dx > 0) {
				c.scrollLeft -= dx + 2;
			} else {
				dx = rect.x + widthLimit - c.scrollLeft - c.clientWidth;
				if (dx > 0) {
					c.scrollLeft += dx + 2;
				}
			}
			var dy = c.scrollTop - rect.y;
			var ddy = Math.max(0, dy - c.scrollTop);
			if (dy > 0) {
				c.scrollTop -= dy + 2;
			} else {
				dy = rect.y + heightLimit - c.scrollTop - c.clientHeight;
				if (dy > 0) {
					c.scrollTop += dy + 2;
				}
			}
			if (!this.useScrollbarsForPanning && (ddx != 0 || ddy != 0)) {
				this.view.setTranslate(ddx, ddy);
			}
		} else {
			var x = -this.view.translate.x;
			var y = -this.view.translate.y;
			var s = this.view.scale;
			if (rect.x + widthLimit > x + w) {
				this.view.translate.x -= (rect.x + widthLimit - w - x) / s;
				isChanged = true;
			}
			if (rect.y + heightLimit > y + h) {
				this.view.translate.y -= (rect.y + heightLimit - h - y) / s;
				isChanged = true;
			}
			if (rect.x < x) {
				this.view.translate.x += (x - rect.x) / s;
				isChanged = true;
			}
			if (rect.y < y) {
				this.view.translate.y += (y - rect.y) / s;
				isChanged = true;
			}
			if (isChanged) {
				this.view.refresh();
				if (this.selectionCellsHandler != null) {
					this.selectionCellsHandler.refresh();
				}
			}
		}
	}
	return isChanged;
};
mxGraph.prototype.getCellGeometry = function(cell) {
	return this.model.getGeometry(cell);
};
mxGraph.prototype.isCellVisible = function(cell) {
	return this.model.isVisible(cell);
};
mxGraph.prototype.isCellCollapsed = function(cell) {
	return this.model.isCollapsed(cell);
};
mxGraph.prototype.isCellConnectable = function(cell) {
	return this.model.isConnectable(cell);
};
mxGraph.prototype.isOrthogonal = function(edge) {
	var orthogonal = edge.style[mxConstants.STYLE_ORTHOGONAL];
	if (orthogonal != null) {
		return orthogonal;
	}
	var tmp = this.view.getEdgeStyle(edge);
	return tmp == mxEdgeStyle.SegmentConnector || tmp == mxEdgeStyle.ElbowConnector || tmp == mxEdgeStyle.SideToSide || tmp == mxEdgeStyle.TopToBottom || tmp == mxEdgeStyle.EntityRelation || tmp == mxEdgeStyle.OrthConnector;
};
mxGraph.prototype.isLoop = function(state) {
	var src = state.getVisibleTerminalState(true);
	var trg = state.getVisibleTerminalState(false);
	return (src != null && src == trg);
};
mxGraph.prototype.isCloneEvent = function(evt) {
	return mxEvent.isControlDown(evt);
};
mxGraph.prototype.isToggleEvent = function(evt) {
	return mxEvent.isControlDown(evt);
};
mxGraph.prototype.isGridEnabledEvent = function(evt) {
	return evt != null && !mxEvent.isAltDown(evt);
};
mxGraph.prototype.isConstrainedEvent = function(evt) {
	return mxEvent.isShiftDown(evt);
};
mxGraph.prototype.isForceMarqueeEvent = function(evt) {
	return mxEvent.isAltDown(evt) || mxEvent.isMetaDown(evt);
};
mxGraph.prototype.validationAlert = function(message) {
	mxUtils.alert(message);
};
mxGraph.prototype.isEdgeValid = function(edge, source, target) {
	return this.getEdgeValidationError(edge, source, target) == null;
};
mxGraph.prototype.getEdgeValidationError = function(edge, source, target) {
	if (edge != null && !this.isAllowDanglingEdges() && (source == null || target == null)) {
		return '';
	}
	if (edge != null && this.model.getTerminal(edge, true) == null && this.model.getTerminal(edge, false) == null) {
		return null;
	}
	if (!this.allowLoops && source == target && source != null) {
		return '';
	}
	if (!this.isValidConnection(source, target)) {
		return '';
	}
	if (source != null && target != null) {
		var error = '';
		if (!this.multigraph) {
			var tmp = this.model.getEdgesBetween(source, target, true);
			if (tmp.length > 1 || (tmp.length == 1 && tmp[0] != edge)) {
				error += (mxResources.get(this.alreadyConnectedResource) || this.alreadyConnectedResource) + '\n';
			}
		}
		var sourceOut = this.model.getDirectedEdgeCount(source, true, edge);
		var targetIn = this.model.getDirectedEdgeCount(target, false, edge);
		if (this.multiplicities != null) {
			for (var i = 0; i < this.multiplicities.length; i++) {
				var err = this.multiplicities[i].check(this, edge, source, target, sourceOut, targetIn);
				if (err != null) {
					error += err;
				}
			}
		}
		var err = this.validateEdge(edge, source, target);
		if (err != null) {
			error += err;
		}
		return (error.length > 0) ? error: null;
	}
	return (this.allowDanglingEdges) ? null: '';
};
mxGraph.prototype.validateEdge = function(edge, source, target) {
	return null;
};
mxGraph.prototype.validateGraph = function(cell, context) {
	cell = (cell != null) ? cell: this.model.getRoot();
	context = (context != null) ? context: new Object();
	var isValid = true;
	var childCount = this.model.getChildCount(cell);
	for (var i = 0; i < childCount; i++) {
		var tmp = this.model.getChildAt(cell, i);
		var ctx = context;
		if (this.isValidRoot(tmp)) {
			ctx = new Object();
		}
		var warn = this.validateGraph(tmp, ctx);
		if (warn != null) {
			this.setCellWarning(tmp, warn.replace(/\n/g, '<br>'));
		} else {
			this.setCellWarning(tmp, null);
		}
		isValid = isValid && warn == null;
	}
	var warning = '';
	if (this.isCellCollapsed(cell) && !isValid) {
		warning += (mxResources.get(this.containsValidationErrorsResource) || this.containsValidationErrorsResource) + '\n';
	}
	if (this.model.isEdge(cell)) {
		warning += this.getEdgeValidationError(cell, this.model.getTerminal(cell, true), this.model.getTerminal(cell, false)) || '';
	} else {
		warning += this.getCellValidationError(cell) || '';
	}
	var err = this.validateCell(cell, context);
	if (err != null) {
		warning += err;
	}
	if (this.model.getParent(cell) == null) {
		this.view.validate();
	}
	return (warning.length > 0 || !isValid) ? warning: null;
};
mxGraph.prototype.getCellValidationError = function(cell) {
	var outCount = this.model.getDirectedEdgeCount(cell, true);
	var inCount = this.model.getDirectedEdgeCount(cell, false);
	var value = this.model.getValue(cell);
	var error = '';
	if (this.multiplicities != null) {
		for (var i = 0; i < this.multiplicities.length; i++) {
			var rule = this.multiplicities[i];
			if (rule.source && mxUtils.isNode(value, rule.type, rule.attr, rule.value) && ((rule.max == 0 && outCount > 0) || (rule.min == 1 && outCount == 0) || (rule.max == 1 && outCount > 1))) {
				error += rule.countError + '\n';
			} else if (!rule.source && mxUtils.isNode(value, rule.type, rule.attr, rule.value) && ((rule.max == 0 && inCount > 0) || (rule.min == 1 && inCount == 0) || (rule.max == 1 && inCount > 1))) {
				error += rule.countError + '\n';
			}
		}
	}
	return (error.length > 0) ? error: null;
};
mxGraph.prototype.validateCell = function(cell, context) {
	return null;
};
mxGraph.prototype.getBackgroundImage = function() {
	return this.backgroundImage;
};
mxGraph.prototype.setBackgroundImage = function(image) {
	this.backgroundImage = image;
};
mxGraph.prototype.getFoldingImage = function(state) {
	if (state != null && this.foldingEnabled && !this.getModel().isEdge(state.cell)) {
		var tmp = this.isCellCollapsed(state.cell);
		if (this.isCellFoldable(state.cell, !tmp)) {
			return (tmp) ? this.collapsedImage: this.expandedImage;
		}
	}
	return null;
};
mxGraph.prototype.convertValueToString = function(cell) {
	var value = this.model.getValue(cell);
	if (value != null) {
		if (mxUtils.isNode(value)) {
			return value.nodeName;
		} else if (typeof(value.toString) == 'function') {
			return value.toString();
		}
	}
	return '';
};
mxGraph.prototype.getLabel = function(cell) {
	var result = '';
	if (this.labelsVisible && cell != null) {
		var state = this.view.getState(cell);
		var style = (state != null) ? state.style: this.getCellStyle(cell);
		if (!mxUtils.getValue(style, mxConstants.STYLE_NOLABEL, false)) {
			result = this.convertValueToString(cell);
		}
	}
	return result;
};
mxGraph.prototype.isHtmlLabel = function(cell) {
	return this.isHtmlLabels();
};
mxGraph.prototype.isHtmlLabels = function() {
	return this.htmlLabels;
};
mxGraph.prototype.setHtmlLabels = function(value) {
	this.htmlLabels = value;
};
mxGraph.prototype.isWrapping = function(cell) {
	var state = this.view.getState(cell);
	var style = (state != null) ? state.style: this.getCellStyle(cell);
	return (style != null) ? style[mxConstants.STYLE_WHITE_SPACE] == 'wrap': false;
};
mxGraph.prototype.isLabelClipped = function(cell) {
	var state = this.view.getState(cell);
	var style = (state != null) ? state.style: this.getCellStyle(cell);
	return (style != null) ? style[mxConstants.STYLE_OVERFLOW] == 'hidden': false;
};
mxGraph.prototype.getTooltip = function(state, node, x, y) {
	var tip = null;
	if (state != null) {
		if (state.control != null && (node == state.control.node || node.parentNode == state.control.node)) {
			tip = this.collapseExpandResource;
			tip = mxResources.get(tip) || tip;
		}
		if (tip == null && state.overlays != null) {
			for (var i = 0; i < state.overlays.length; i++) {
				if (node == state.overlays[i].node || node.parentNode == state.overlays[i].node) {
					tip = this.getCellOverlays(state.cell)[i].toString();
					break;
				}
			}
		}
		if (tip == null) {
			var handler = this.selectionCellsHandler.getHandler(state.cell);
			if (handler != null && typeof(handler.getTooltipForNode) == 'function') {
				tip = handler.getTooltipForNode(node);
			}
		}
		if (tip == null) {
			tip = this.getTooltipForCell(state.cell);
		}
	}
	return tip;
};
mxGraph.prototype.getTooltipForCell = function(cell) {
	var tip = null;
	if (cell != null && cell.getTooltip != null) {
		tip = cell.getTooltip();
	} else {
		tip = this.convertValueToString(cell);
	}
	return tip;
};
mxGraph.prototype.getCursorForCell = function(cell) {
	return null;
};
mxGraph.prototype.getStartSize = function(swimlane) {
	var result = new mxRectangle();
	var state = this.view.getState(swimlane);
	var style = (state != null) ? state.style: this.getCellStyle(swimlane);
	if (style != null) {
		var size = parseInt(mxUtils.getValue(style, mxConstants.STYLE_STARTSIZE, mxConstants.DEFAULT_STARTSIZE));
		if (mxUtils.getValue(style, mxConstants.STYLE_HORIZONTAL, true)) {
			result.height = size;
		} else {
			result.width = size;
		}
	}
	return result;
};
mxGraph.prototype.getImage = function(state) {
	return (state != null && state.style != null) ? state.style[mxConstants.STYLE_IMAGE] : null;
};
mxGraph.prototype.getVerticalAlign = function(state) {
	return (state != null && state.style != null) ? (state.style[mxConstants.STYLE_VERTICAL_ALIGN] || mxConstants.ALIGN_MIDDLE) : null;
};
mxGraph.prototype.getIndicatorColor = function(state) {
	return (state != null && state.style != null) ? state.style[mxConstants.STYLE_INDICATOR_COLOR] : null;
};
mxGraph.prototype.getIndicatorGradientColor = function(state) {
	return (state != null && state.style != null) ? state.style[mxConstants.STYLE_INDICATOR_GRADIENTCOLOR] : null;
};
mxGraph.prototype.getIndicatorShape = function(state) {
	return (state != null && state.style != null) ? state.style[mxConstants.STYLE_INDICATOR_SHAPE] : null;
};
mxGraph.prototype.getIndicatorImage = function(state) {
	return (state != null && state.style != null) ? state.style[mxConstants.STYLE_INDICATOR_IMAGE] : null;
};
mxGraph.prototype.getBorder = function() {
	return this.border;
};
mxGraph.prototype.setBorder = function(value) {
	this.border = value;
};
mxGraph.prototype.isSwimlane = function(cell) {
	if (cell != null) {
		if (this.model.getParent(cell) != this.model.getRoot()) {
			var state = this.view.getState(cell);
			var style = (state != null) ? state.style: this.getCellStyle(cell);
			if (style != null && !this.model.isEdge(cell)) {
				return style[mxConstants.STYLE_SHAPE] == mxConstants.SHAPE_SWIMLANE;
			}
		}
	}
	return false;
};
mxGraph.prototype.isResizeContainer = function() {
	return this.resizeContainer;
};
mxGraph.prototype.setResizeContainer = function(value) {
	this.resizeContainer = value;
};
mxGraph.prototype.isEnabled = function() {
	return this.enabled;
};
mxGraph.prototype.setEnabled = function(value) {
	this.enabled = value;
};
mxGraph.prototype.isEscapeEnabled = function() {
	return this.escapeEnabled;
};
mxGraph.prototype.setEscapeEnabled = function(value) {
	this.escapeEnabled = value;
};
mxGraph.prototype.isInvokesStopCellEditing = function() {
	return this.invokesStopCellEditing;
};
mxGraph.prototype.setInvokesStopCellEditing = function(value) {
	this.invokesStopCellEditing = value;
};
mxGraph.prototype.isEnterStopsCellEditing = function() {
	return this.enterStopsCellEditing;
};
mxGraph.prototype.setEnterStopsCellEditing = function(value) {
	this.enterStopsCellEditing = value;
};
mxGraph.prototype.isCellLocked = function(cell) {
	var geometry = this.model.getGeometry(cell);
	return this.isCellsLocked() || (geometry != null && this.model.isVertex(cell) && geometry.relative);
};
mxGraph.prototype.isCellsLocked = function() {
	return this.cellsLocked;
};
mxGraph.prototype.setCellsLocked = function(value) {
	this.cellsLocked = value;
};
mxGraph.prototype.getCloneableCells = function(cells) {
	return this.model.filterCells(cells, mxUtils.bind(this,
	function(cell) {
		return this.isCellCloneable(cell);
	}));
};
mxGraph.prototype.isCellCloneable = function(cell) {
	var state = this.view.getState(cell);
	var style = (state != null) ? state.style: this.getCellStyle(cell);
	return this.isCellsCloneable() && style[mxConstants.STYLE_CLONEABLE] != 0;
};
mxGraph.prototype.isCellsCloneable = function() {
	return this.cellsCloneable;
};
mxGraph.prototype.setCellsCloneable = function(value) {
	this.cellsCloneable = value;
};
mxGraph.prototype.getExportableCells = function(cells) {
	return this.model.filterCells(cells, mxUtils.bind(this,
	function(cell) {
		return this.canExportCell(cell);
	}));
};
mxGraph.prototype.canExportCell = function(cell) {
	return this.exportEnabled;
};
mxGraph.prototype.getImportableCells = function(cells) {
	return this.model.filterCells(cells, mxUtils.bind(this,
	function(cell) {
		return this.canImportCell(cell);
	}));
};
mxGraph.prototype.canImportCell = function(cell) {
	return this.importEnabled;
};
mxGraph.prototype.isCellSelectable = function(cell) {
	return this.isCellsSelectable();
};
mxGraph.prototype.isCellsSelectable = function() {
	return this.cellsSelectable;
};
mxGraph.prototype.setCellsSelectable = function(value) {
	this.cellsSelectable = value;
};
mxGraph.prototype.getDeletableCells = function(cells) {
	return this.model.filterCells(cells, mxUtils.bind(this,
	function(cell) {
		return this.isCellDeletable(cell);
	}));
};
mxGraph.prototype.isCellDeletable = function(cell) {
	var state = this.view.getState(cell);
	var style = (state != null) ? state.style: this.getCellStyle(cell);
	return this.isCellsDeletable() && style[mxConstants.STYLE_DELETABLE] != 0;
};
mxGraph.prototype.isCellsDeletable = function() {
	return this.cellsDeletable;
};
mxGraph.prototype.setCellsDeletable = function(value) {
	this.cellsDeletable = value;
};
mxGraph.prototype.isLabelMovable = function(cell) {
	return ! this.isCellLocked(cell) && ((this.model.isEdge(cell) && this.edgeLabelsMovable) || (this.model.isVertex(cell) && this.vertexLabelsMovable));
};
mxGraph.prototype.getMovableCells = function(cells) {
	return this.model.filterCells(cells, mxUtils.bind(this,
	function(cell) {
		return this.isCellMovable(cell);
	}));
};
mxGraph.prototype.isCellMovable = function(cell) {
	var state = this.view.getState(cell);
	var style = (state != null) ? state.style: this.getCellStyle(cell);
	return this.isCellsMovable() && !this.isCellLocked(cell) && style[mxConstants.STYLE_MOVABLE] != 0;
};
mxGraph.prototype.isCellsMovable = function() {
	return this.cellsMovable;
};
mxGraph.prototype.setCellsMovable = function(value) {
	this.cellsMovable = value;
};
mxGraph.prototype.isGridEnabled = function() {
	return this.gridEnabled;
};
mxGraph.prototype.setGridEnabled = function(value) {
	this.gridEnabled = value;
};
mxGraph.prototype.isPortsEnabled = function() {
	return this.portsEnabled;
};
mxGraph.prototype.setPortsEnabled = function(value) {
	this.portsEnabled = value;
};
mxGraph.prototype.getGridSize = function() {
	return this.gridSize;
};
mxGraph.prototype.setGridSize = function(value) {
	this.gridSize = value;
};
mxGraph.prototype.getTolerance = function() {
	return this.tolerance;
};
mxGraph.prototype.setTolerance = function(value) {
	this.tolerance = value;
};
mxGraph.prototype.isVertexLabelsMovable = function() {
	return this.vertexLabelsMovable;
};
mxGraph.prototype.setVertexLabelsMovable = function(value) {
	this.vertexLabelsMovable = value;
};
mxGraph.prototype.isEdgeLabelsMovable = function() {
	return this.edgeLabelsMovable;
};
mxGraph.prototype.setEdgeLabelsMovable = function(value) {
	this.edgeLabelsMovable = value;
};
mxGraph.prototype.isSwimlaneNesting = function() {
	return this.swimlaneNesting;
};
mxGraph.prototype.setSwimlaneNesting = function(value) {
	this.swimlaneNesting = value;
};
mxGraph.prototype.isSwimlaneSelectionEnabled = function() {
	return this.swimlaneSelectionEnabled;
};
mxGraph.prototype.setSwimlaneSelectionEnabled = function(value) {
	this.swimlaneSelectionEnabled = value;
};
mxGraph.prototype.isMultigraph = function() {
	return this.multigraph;
};
mxGraph.prototype.setMultigraph = function(value) {
	this.multigraph = value;
};
mxGraph.prototype.isAllowLoops = function() {
	return this.allowLoops;
};
mxGraph.prototype.setAllowDanglingEdges = function(value) {
	this.allowDanglingEdges = value;
};
mxGraph.prototype.isAllowDanglingEdges = function() {
	return this.allowDanglingEdges;
};
mxGraph.prototype.setConnectableEdges = function(value) {
	this.connectableEdges = value;
};
mxGraph.prototype.isConnectableEdges = function() {
	return this.connectableEdges;
};
mxGraph.prototype.setCloneInvalidEdges = function(value) {
	this.cloneInvalidEdges = value;
};
mxGraph.prototype.isCloneInvalidEdges = function() {
	return this.cloneInvalidEdges;
};
mxGraph.prototype.setAllowLoops = function(value) {
	this.allowLoops = value;
};
mxGraph.prototype.isDisconnectOnMove = function() {
	return this.disconnectOnMove;
};
mxGraph.prototype.setDisconnectOnMove = function(value) {
	this.disconnectOnMove = value;
};
mxGraph.prototype.isDropEnabled = function() {
	return this.dropEnabled;
};
mxGraph.prototype.setDropEnabled = function(value) {
	this.dropEnabled = value;
};
mxGraph.prototype.isSplitEnabled = function() {
	return this.splitEnabled;
};
mxGraph.prototype.setSplitEnabled = function(value) {
	this.splitEnabled = value;
};
mxGraph.prototype.isCellResizable = function(cell) {
	var state = this.view.getState(cell);
	var style = (state != null) ? state.style: this.getCellStyle(cell);
	return this.isCellsResizable() && !this.isCellLocked(cell) && style[mxConstants.STYLE_RESIZABLE] != 0;
};
mxGraph.prototype.isCellsResizable = function() {
	return this.cellsResizable;
};
mxGraph.prototype.setCellsResizable = function(value) {
	this.cellsResizable = value;
};
mxGraph.prototype.isTerminalPointMovable = function(cell, source) {
	return true;
};
mxGraph.prototype.isCellBendable = function(cell) {
	var state = this.view.getState(cell);
	var style = (state != null) ? state.style: this.getCellStyle(cell);
	return this.isCellsBendable() && !this.isCellLocked(cell) && style[mxConstants.STYLE_BENDABLE] != 0;
};
mxGraph.prototype.isCellsBendable = function() {
	return this.cellsBendable;
};
mxGraph.prototype.setCellsBendable = function(value) {
	this.cellsBendable = value;
};
mxGraph.prototype.isCellEditable = function(cell) {
	var state = this.view.getState(cell);
	var style = (state != null) ? state.style: this.getCellStyle(cell);
	return this.isCellsEditable() && !this.isCellLocked(cell) && style[mxConstants.STYLE_EDITABLE] != 0;
};
mxGraph.prototype.isCellsEditable = function() {
	return this.cellsEditable;
};
mxGraph.prototype.setCellsEditable = function(value) {
	this.cellsEditable = value;
};
mxGraph.prototype.isCellDisconnectable = function(cell, terminal, source) {
	return this.isCellsDisconnectable() && !this.isCellLocked(cell);
};
mxGraph.prototype.isCellsDisconnectable = function() {
	return this.cellsDisconnectable;
};
mxGraph.prototype.setCellsDisconnectable = function(value) {
	this.cellsDisconnectable = value;
};
mxGraph.prototype.isValidSource = function(cell) {
	return (cell == null && this.allowDanglingEdges) || (cell != null && (!this.model.isEdge(cell) || this.connectableEdges) && this.isCellConnectable(cell));
};
mxGraph.prototype.isValidTarget = function(cell) {
	return this.isValidSource(cell);
};
mxGraph.prototype.isValidConnection = function(source, target) {
	return this.isValidSource(source) && this.isValidTarget(target);
};
mxGraph.prototype.setConnectable = function(connectable) {
	this.connectionHandler.setEnabled(connectable);
};
mxGraph.prototype.isConnectable = function(connectable) {
	return this.connectionHandler.isEnabled();
};
mxGraph.prototype.setTooltips = function(enabled) {
	this.tooltipHandler.setEnabled(enabled);
};
mxGraph.prototype.setPanning = function(enabled) {
	this.panningHandler.panningEnabled = enabled;
};
mxGraph.prototype.isEditing = function(cell) {
	if (this.cellEditor != null) {
		var editingCell = this.cellEditor.getEditingCell();
		return (cell == null) ? editingCell != null: cell == editingCell;
	}
	return false;
};
mxGraph.prototype.isAutoSizeCell = function(cell) {
	var state = this.view.getState(cell);
	var style = (state != null) ? state.style: this.getCellStyle(cell);
	return this.isAutoSizeCells() || style[mxConstants.STYLE_AUTOSIZE] == 1;
};
mxGraph.prototype.isAutoSizeCells = function() {
	return this.autoSizeCells;
};
mxGraph.prototype.setAutoSizeCells = function(value) {
	this.autoSizeCells = value;
};
mxGraph.prototype.isExtendParent = function(cell) {
	return ! this.getModel().isEdge(cell) && this.isExtendParents();
};
mxGraph.prototype.isExtendParents = function() {
	return this.extendParents;
};
mxGraph.prototype.setExtendParents = function(value) {
	this.extendParents = value;
};
mxGraph.prototype.isExtendParentsOnAdd = function() {
	return this.extendParentsOnAdd;
};
mxGraph.prototype.setExtendParentsOnAdd = function(value) {
	this.extendParentsOnAdd = value;
};
mxGraph.prototype.isConstrainChild = function(cell) {
	return this.isConstrainChildren() && !this.getModel().isEdge(this.getModel().getParent(cell));
};
mxGraph.prototype.isConstrainChildren = function() {
	return this.constrainChildren;
};
mxGraph.prototype.setConstrainChildren = function(value) {
	this.constrainChildren = value;
};
mxGraph.prototype.isAllowNegativeCoordinates = function() {
	return this.allowNegativeCoordinates;
};
mxGraph.prototype.setAllowNegativeCoordinates = function(value) {
	this.allowNegativeCoordinates = value;
};
mxGraph.prototype.getOverlap = function(cell) {
	return (this.isAllowOverlapParent(cell)) ? this.defaultOverlap: 0;
};
mxGraph.prototype.isAllowOverlapParent = function(cell) {
	return false;
};
mxGraph.prototype.getFoldableCells = function(cells, collapse) {
	return this.model.filterCells(cells, mxUtils.bind(this,
	function(cell) {
		return this.isCellFoldable(cell, collapse);
	}));
};
mxGraph.prototype.isCellFoldable = function(cell, collapse) {
	var state = this.view.getState(cell);
	var style = (state != null) ? state.style: this.getCellStyle(cell);
	return this.model.getChildCount(cell) > 0 && style[mxConstants.STYLE_FOLDABLE] != 0;
};
mxGraph.prototype.isValidDropTarget = function(cell, cells, evt) {
	return cell != null && ((this.isSplitEnabled() && this.isSplitTarget(cell, cells, evt)) || (!this.model.isEdge(cell) && (this.isSwimlane(cell) || (this.model.getChildCount(cell) > 0 && !this.isCellCollapsed(cell)))));
};
mxGraph.prototype.isSplitTarget = function(target, cells, evt) {
	if (this.model.isEdge(target) && cells != null && cells.length == 1 && this.isCellConnectable(cells[0]) && this.getEdgeValidationError(target, this.model.getTerminal(target, true), cells[0]) == null) {
		var src = this.model.getTerminal(target, true);
		var trg = this.model.getTerminal(target, false);
		return (!this.model.isAncestor(cells[0], src) && !this.model.isAncestor(cells[0], trg));
	}
	return false;
};
mxGraph.prototype.getDropTarget = function(cells, evt, cell) {
	if (!this.isSwimlaneNesting()) {
		for (var i = 0; i < cells.length; i++) {
			if (this.isSwimlane(cells[i])) {
				return null;
			}
		}
	}
	var pt = mxUtils.convertPoint(this.container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));
	pt.x -= this.panDx;
	pt.y -= this.panDy;
	var swimlane = this.getSwimlaneAt(pt.x, pt.y);
	if (cell == null) {
		cell = swimlane;
	} else if (swimlane != null) {
		var tmp = this.model.getParent(swimlane);
		while (tmp != null && this.isSwimlane(tmp) && tmp != cell) {
			tmp = this.model.getParent(tmp);
		}
		if (tmp == cell) {
			cell = swimlane;
		}
	}
	while (cell != null && !this.isValidDropTarget(cell, cells, evt) && !this.model.isLayer(cell)) {
		cell = this.model.getParent(cell);
	}
	return (!this.model.isLayer(cell) && mxUtils.indexOf(cells, cell) < 0) ? cell: null;
};
mxGraph.prototype.getDefaultParent = function() {
	var parent = this.defaultParent;
	if (parent == null) {
		parent = this.getCurrentRoot();
		if (parent == null) {
			var root = this.model.getRoot();
			parent = this.model.getChildAt(root, 0);
		}
	}
	return parent;
};
mxGraph.prototype.setDefaultParent = function(cell) {
	this.defaultParent = cell;
};
mxGraph.prototype.getSwimlane = function(cell) {
	while (cell != null && !this.isSwimlane(cell)) {
		cell = this.model.getParent(cell);
	}
	return cell;
};
mxGraph.prototype.getSwimlaneAt = function(x, y, parent) {
	parent = parent || this.getDefaultParent();
	if (parent != null) {
		var childCount = this.model.getChildCount(parent);
		for (var i = 0; i < childCount; i++) {
			var child = this.model.getChildAt(parent, i);
			var result = this.getSwimlaneAt(x, y, child);
			if (result != null) {
				return result;
			} else if (this.isSwimlane(child)) {
				var state = this.view.getState(child);
				if (this.intersects(state, x, y)) {
					return child;
				}
			}
		}
	}
	return null;
};
mxGraph.prototype.getCellAt = function(x, y, parent, vertices, edges) {
	vertices = (vertices != null) ? vertices: true;
	edges = (edges != null) ? edges: true;
	parent = (parent != null) ? parent: this.getDefaultParent();
	if (parent != null) {
		var childCount = this.model.getChildCount(parent);
		for (var i = childCount - 1; i >= 0; i--) {
			var cell = this.model.getChildAt(parent, i);
			var result = this.getCellAt(x, y, cell, vertices, edges);
			if (result != null) {
				return result;
			} else if (this.isCellVisible(cell) && (edges && this.model.isEdge(cell) || vertices && this.model.isVertex(cell))) {
				var state = this.view.getState(cell);
				if (this.intersects(state, x, y)) {
					return cell;
				}
			}
		}
	}
	return null;
};
mxGraph.prototype.intersects = function(state, x, y) {
	if (state != null) {
		var pts = state.absolutePoints;
		if (pts != null) {
			var t2 = this.tolerance * this.tolerance;
			var pt = pts[0];
			for (var i = 1; i < pts.length; i++) {
				var next = pts[i];
				var dist = mxUtils.ptSegDistSq(pt.x, pt.y, next.x, next.y, x, y);
				if (dist <= t2) {
					return true;
				}
				pt = next;
			}
		} else if (mxUtils.contains(state, x, y)) {
			return true;
		}
	}
	return false;
};
mxGraph.prototype.hitsSwimlaneContent = function(swimlane, x, y) {
	var state = this.getView().getState(swimlane);
	var size = this.getStartSize(swimlane);
	if (state != null) {
		var scale = this.getView().getScale();
		x -= state.x;
		y -= state.y;
		if (size.width > 0 && x > 0 && x > size.width * scale) {
			return true;
		} else if (size.height > 0 && y > 0 && y > size.height * scale) {
			return true;
		}
	}
	return false;
};
mxGraph.prototype.getChildVertices = function(parent) {
	return this.getChildCells(parent, true, false);
};
mxGraph.prototype.getChildEdges = function(parent) {
	return this.getChildCells(parent, false, true);
};
mxGraph.prototype.getChildCells = function(parent, vertices, edges) {
	parent = (parent != null) ? parent: this.getDefaultParent();
	vertices = (vertices != null) ? vertices: false;
	edges = (edges != null) ? edges: false;
	var cells = this.model.getChildCells(parent, vertices, edges);
	var result = [];
	for (var i = 0; i < cells.length; i++) {
		if (this.isCellVisible(cells[i])) {
			result.push(cells[i]);
		}
	}
	return result;
};
mxGraph.prototype.getConnections = function(cell, parent) {
	return this.getEdges(cell, parent, true, true, false);
};
mxGraph.prototype.getIncomingEdges = function(cell, parent) {
	return this.getEdges(cell, parent, true, false, false);
};
mxGraph.prototype.getOutgoingEdges = function(cell, parent) {
	return this.getEdges(cell, parent, false, true, false);
};
mxGraph.prototype.getEdges = function(cell, parent, incoming, outgoing, includeLoops, recurse) {
	incoming = (incoming != null) ? incoming: true;
	outgoing = (outgoing != null) ? outgoing: true;
	includeLoops = (includeLoops != null) ? includeLoops: true;
	recurse = (recurse != null) ? recurse: false;
	var edges = [];
	var isCollapsed = this.isCellCollapsed(cell);
	var childCount = this.model.getChildCount(cell);
	for (var i = 0; i < childCount; i++) {
		var child = this.model.getChildAt(cell, i);
		if (isCollapsed || !this.isCellVisible(child)) {
			edges = edges.concat(this.model.getEdges(child, incoming, outgoing));
		}
	}
	edges = edges.concat(this.model.getEdges(cell, incoming, outgoing));
	var result = [];
	for (var i = 0; i < edges.length; i++) {
		var state = this.view.getState(edges[i]);
		var source = (state != null) ? state.getVisibleTerminal(true) : this.view.getVisibleTerminal(edges[i], true);
		var target = (state != null) ? state.getVisibleTerminal(false) : this.view.getVisibleTerminal(edges[i], false);
		if ((includeLoops && source == target) || ((source != target) && ((incoming && target == cell && (parent == null || this.isValidAncestor(source, parent, recurse))) || (outgoing && source == cell && (parent == null || this.isValidAncestor(target, parent, recurse)))))) {
			result.push(edges[i]);
		}
	}
	return result;
};
mxGraph.prototype.isValidAncestor = function(cell, parent, recurse) {
	return (recurse ? this.model.isAncestor(parent, cell) : this.model.getParent(cell) == parent);
};
mxGraph.prototype.getOpposites = function(edges, terminal, sources, targets) {
	sources = (sources != null) ? sources: true;
	targets = (targets != null) ? targets: true;
	var terminals = [];
	var hash = new Object();
	if (edges != null) {
		for (var i = 0; i < edges.length; i++) {
			var state = this.view.getState(edges[i]);
			var source = (state != null) ? state.getVisibleTerminal(true) : this.view.getVisibleTerminal(edges[i], true);
			var target = (state != null) ? state.getVisibleTerminal(false) : this.view.getVisibleTerminal(edges[i], false);
			if (source == terminal && target != null && target != terminal && targets) {
				var id = mxCellPath.create(target);
				if (hash[id] == null) {
					hash[id] = target;
					terminals.push(target);
				}
			} else if (target == terminal && source != null && source != terminal && sources) {
				var id = mxCellPath.create(source);
				if (hash[id] == null) {
					hash[id] = source;
					terminals.push(source);
				}
			}
		}
	}
	return terminals;
};
mxGraph.prototype.getEdgesBetween = function(source, target, directed) {
	directed = (directed != null) ? directed: false;
	var edges = this.getEdges(source);
	var result = [];
	for (var i = 0; i < edges.length; i++) {
		var state = this.view.getState(edges[i]);
		var src = (state != null) ? state.getVisibleTerminal(true) : this.view.getVisibleTerminal(edges[i], true);
		var trg = (state != null) ? state.getVisibleTerminal(false) : this.view.getVisibleTerminal(edges[i], false);
		if ((src == source && trg == target) || (!directed && src == target && trg == source)) {
			result.push(edges[i]);
		}
	}
	return result;
};
mxGraph.prototype.getPointForEvent = function(evt, addOffset) {
	var p = mxUtils.convertPoint(this.container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));
	var s = this.view.scale;
	var tr = this.view.translate;
	var off = (addOffset != false) ? this.gridSize / 2 : 0;
	p.x = this.snap(p.x / s - tr.x - off);
	p.y = this.snap(p.y / s - tr.y - off);
	return p;
};
mxGraph.prototype.getCells = function(x, y, width, height, parent, result) {
	result = (result != null) ? result: [];
	if (width > 0 || height > 0) {
		var right = x + width;
		var bottom = y + height;
		parent = parent || this.getDefaultParent();
		if (parent != null) {
			var childCount = this.model.getChildCount(parent);
			for (var i = 0; i < childCount; i++) {
				var cell = this.model.getChildAt(parent, i);
				var state = this.view.getState(cell);
				if (this.isCellVisible(cell) && state != null) {
					if (state.x >= x && state.y >= y && state.x + state.width <= right && state.y + state.height <= bottom) {
						result.push(cell);
					} else {
						this.getCells(x, y, width, height, cell, result);
					}
				}
			}
		}
	}
	return result;
};
mxGraph.prototype.getCellsBeyond = function(x0, y0, parent, rightHalfpane, bottomHalfpane) {
	var result = [];
	if (rightHalfpane || bottomHalfpane) {
		if (parent == null) {
			parent = this.getDefaultParent();
		}
		if (parent != null) {
			var childCount = this.model.getChildCount(parent);
			for (var i = 0; i < childCount; i++) {
				var child = this.model.getChildAt(parent, i);
				var state = this.view.getState(child);
				if (this.isCellVisible(child) && state != null) {
					if ((!rightHalfpane || state.x >= x0) && (!bottomHalfpane || state.y >= y0)) {
						result.push(child);
					}
				}
			}
		}
	}
	return result;
};
mxGraph.prototype.findTreeRoots = function(parent, isolate, invert) {
	isolate = (isolate != null) ? isolate: false;
	invert = (invert != null) ? invert: false;
	var roots = [];
	if (parent != null) {
		var model = this.getModel();
		var childCount = model.getChildCount(parent);
		var best = null;
		var maxDiff = 0;
		for (var i = 0; i < childCount; i++) {
			var cell = model.getChildAt(parent, i);
			if (this.model.isVertex(cell) && this.isCellVisible(cell)) {
				var conns = this.getConnections(cell, (isolate) ? parent: null);
				var fanOut = 0;
				var fanIn = 0;
				for (var j = 0; j < conns.length; j++) {
					var src = this.view.getVisibleTerminal(conns[j], true);
					if (src == cell) {
						fanOut++;
					} else {
						fanIn++;
					}
				}
				if ((invert && fanOut == 0 && fanIn > 0) || (!invert && fanIn == 0 && fanOut > 0)) {
					roots.push(cell);
				}
				var diff = (invert) ? fanIn - fanOut: fanOut - fanIn;
				if (diff > maxDiff) {
					maxDiff = diff;
					best = cell;
				}
			}
		}
		if (roots.length == 0 && best != null) {
			roots.push(best);
		}
	}
	return roots;
};
mxGraph.prototype.traverse = function(vertex, directed, func, edge, visited) {
	if (func != null && vertex != null) {
		directed = (directed != null) ? directed: true;
		visited = visited || [];
		var id = mxCellPath.create(vertex);
		if (visited[id] == null) {
			visited[id] = vertex;
			var result = func(vertex, edge);
			if (result == null || result) {
				var edgeCount = this.model.getEdgeCount(vertex);
				if (edgeCount > 0) {
					for (var i = 0; i < edgeCount; i++) {
						var e = this.model.getEdgeAt(vertex, i);
						var isSource = this.model.getTerminal(e, true) == vertex;
						if (!directed || isSource) {
							var next = this.model.getTerminal(e, !isSource);
							this.traverse(next, directed, func, e, visited);
						}
					}
				}
			}
		}
	}
};
mxGraph.prototype.isCellSelected = function(cell) {
	return this.getSelectionModel().isSelected(cell);
};
mxGraph.prototype.isSelectionEmpty = function() {
	return this.getSelectionModel().isEmpty();
};
mxGraph.prototype.clearSelection = function() {
	return this.getSelectionModel().clear();
};
mxGraph.prototype.getSelectionCount = function() {
	return this.getSelectionModel().cells.length;
};
mxGraph.prototype.getSelectionCell = function() {
	return this.getSelectionModel().cells[0];
};
mxGraph.prototype.getSelectionCells = function() {
	return this.getSelectionModel().cells.slice();
};
mxGraph.prototype.setSelectionCell = function(cell) {
	this.getSelectionModel().setCell(cell);
};
mxGraph.prototype.setSelectionCells = function(cells) {
	this.getSelectionModel().setCells(cells);
};
mxGraph.prototype.addSelectionCell = function(cell) {
	this.getSelectionModel().addCell(cell);
};
mxGraph.prototype.addSelectionCells = function(cells) {
	this.getSelectionModel().addCells(cells);
};
mxGraph.prototype.removeSelectionCell = function(cell) {
	this.getSelectionModel().removeCell(cell);
};
mxGraph.prototype.removeSelectionCells = function(cells) {
	this.getSelectionModel().removeCells(cells);
};
mxGraph.prototype.selectRegion = function(rect, evt) {
	var cells = this.getCells(rect.x, rect.y, rect.width, rect.height);
	this.selectCellsForEvent(cells, evt);
	return cells;
};
mxGraph.prototype.selectNextCell = function() {
	this.selectCell(true);
};
mxGraph.prototype.selectPreviousCell = function() {
	this.selectCell();
};
mxGraph.prototype.selectParentCell = function() {
	this.selectCell(false, true);
};
mxGraph.prototype.selectChildCell = function() {
	this.selectCell(false, false, true);
};
mxGraph.prototype.selectCell = function(isNext, isParent, isChild) {
	var sel = this.selectionModel;
	var cell = (sel.cells.length > 0) ? sel.cells[0] : null;
	if (sel.cells.length > 1) {
		sel.clear();
	}
	var parent = (cell != null) ? this.model.getParent(cell) : this.getDefaultParent();
	var childCount = this.model.getChildCount(parent);
	if (cell == null && childCount > 0) {
		var child = this.model.getChildAt(parent, 0);
		this.setSelectionCell(child);
	} else if ((cell == null || isParent) && this.view.getState(parent) != null && this.model.getGeometry(parent) != null) {
		if (this.getCurrentRoot() != parent) {
			this.setSelectionCell(parent);
		}
	} else if (cell != null && isChild) {
		var tmp = this.model.getChildCount(cell);
		if (tmp > 0) {
			var child = this.model.getChildAt(cell, 0);
			this.setSelectionCell(child);
		}
	} else if (childCount > 0) {
		var i = parent.getIndex(cell);
		if (isNext) {
			i++;
			var child = this.model.getChildAt(parent, i % childCount);
			this.setSelectionCell(child);
		} else {
			i--;
			var index = (i < 0) ? childCount - 1 : i;
			var child = this.model.getChildAt(parent, index);
			this.setSelectionCell(child);
		}
	}
};
mxGraph.prototype.selectAll = function(parent) {
	parent = parent || this.getDefaultParent();
	var children = this.model.getChildren(parent);
	if (children != null) {
		this.setSelectionCells(children);
	}
};
mxGraph.prototype.selectVertices = function(parent) {
	this.selectCells(true, false, parent);
};
mxGraph.prototype.selectEdges = function(parent) {
	this.selectCells(false, true, parent);
};
mxGraph.prototype.selectCells = function(vertices, edges, parent) {
	parent = parent || this.getDefaultParent();
	var filter = mxUtils.bind(this,
	function(cell) {
		return this.view.getState(cell) != null && this.model.getChildCount(cell) == 0 && ((this.model.isVertex(cell) && vertices) || (this.model.isEdge(cell) && edges));
	});
	var cells = this.model.filterDescendants(filter, parent);
	this.setSelectionCells(cells);
};
mxGraph.prototype.selectCellForEvent = function(cell, evt) {
	var isSelected = this.isCellSelected(cell);
	if (this.isToggleEvent(evt)) {
		if (isSelected) {
			this.removeSelectionCell(cell);
		} else {
			this.addSelectionCell(cell);
		}
	} else if (!isSelected || this.getSelectionCount() != 1) {
		this.setSelectionCell(cell);
	}
};
mxGraph.prototype.selectCellsForEvent = function(cells, evt) {
	if (this.isToggleEvent(evt)) {
		this.addSelectionCells(cells);
	} else {
		this.setSelectionCells(cells);
	}
};
mxGraph.prototype.createHandler = function(state) {
	var result = null;
	if (state != null) {
		if (this.model.isEdge(state.cell)) {
			var style = this.view.getEdgeStyle(state);
			if (this.isLoop(state) || style == mxEdgeStyle.ElbowConnector || style == mxEdgeStyle.SideToSide || style == mxEdgeStyle.TopToBottom) {
				result = new mxElbowEdgeHandler(state);
			} else if (style == mxEdgeStyle.SegmentConnector || style == mxEdgeStyle.OrthConnector) {
				result = new mxEdgeSegmentHandler(state);
			} else {
				result = new mxEdgeHandler(state);
			}
		} else {
			result = new mxVertexHandler(state);
		}
	}
	return result;
};
mxGraph.prototype.addMouseListener = function(listener) {
	if (this.mouseListeners == null) {
		this.mouseListeners = [];
	}
	this.mouseListeners.push(listener);
};
mxGraph.prototype.removeMouseListener = function(listener) {
	if (this.mouseListeners != null) {
		for (var i = 0; i < this.mouseListeners.length; i++) {
			if (this.mouseListeners[i] == listener) {
				this.mouseListeners.splice(i, 1);
				break;
			}
		}
	}
};
mxGraph.prototype.updateMouseEvent = function(me) {
	if (me.graphX == null || me.graphY == null) {
		var pt = mxUtils.convertPoint(this.container, me.getX(), me.getY());
		me.graphX = pt.x - this.panDx;
		me.graphY = pt.y - this.panDy;
	}
};
mxGraph.prototype.fireMouseEvent = function(evtName, me, sender) {
	if (sender == null) {
		sender = this;
	}
	this.updateMouseEvent(me);
	if (evtName == mxEvent.MOUSE_DOWN) {
		this.isMouseDown = true;
	}
	if (mxClient.IS_TOUCH && this.doubleTapEnabled && evtName == mxEvent.MOUSE_DOWN) {
		var currentTime = new Date().getTime();
		if (currentTime - this.lastTouchTime < this.doubleTapTimeout && Math.abs(this.lastTouchX - me.getX()) < this.doubleTapTolerance && Math.abs(this.lastTouchY - me.getY()) < this.doubleTapTolerance) {
			this.lastTouchTime = 0;
			this.dblClick(me.getEvent(), me.getCell());
			me.getEvent().cancelBubble = true;
		} else {
			this.lastTouchX = me.getX();
			this.lastTouchY = me.getY();
			this.lastTouchTime = currentTime;
		}
	}
	var noDoubleClick = me.getEvent().detail != 2;
	if (mxClient.IS_IE && document.compatMode == 'CSS1Compat') {
		if ((this.lastMouseX != null && Math.abs(this.lastMouseX - me.getX()) > this.doubleTapTolerance) || (this.lastMouseY != null && Math.abs(this.lastMouseY - me.getY()) > this.doubleTapTolerance)) {
			noDoubleClick = true;
		}
		if (evtName == mxEvent.MOUSE_UP) {
			this.lastMouseX = me.getX();
			this.lastMouseY = me.getY();
		}
	}
	if ((evtName != mxEvent.MOUSE_UP || this.isMouseDown) && noDoubleClick) {
		if (evtName == mxEvent.MOUSE_UP) {
			this.isMouseDown = false;
		}
		if (!this.isEditing() && (false || false || false || (mxClient.IS_IE && mxClient.IS_SVG) || me.getEvent().target != this.container)) {
			if (evtName == mxEvent.MOUSE_MOVE && this.isMouseDown && this.autoScroll) {
				this.scrollPointToVisible(me.getGraphX(), me.getGraphY(), this.autoExtend);
			}
			if (this.mouseListeners != null) {
				var args = [sender, me];
				me.getEvent().returnValue = true;
				for (var i = 0; i < this.mouseListeners.length; i++) {
					var l = this.mouseListeners[i];
					if (evtName == mxEvent.MOUSE_DOWN) {
						l.mouseDown.apply(l, args);
					} else if (evtName == mxEvent.MOUSE_MOVE) {
						l.mouseMove.apply(l, args);
					} else if (evtName == mxEvent.MOUSE_UP) {
						l.mouseUp.apply(l, args);
					}
				}
			}
			if (evtName == mxEvent.MOUSE_UP) {
				this.click(me);
			}
		}
	} else if (evtName == mxEvent.MOUSE_UP) {
		this.isMouseDown = false;
	}
};
mxGraph.prototype.destroy = function() {
	if (!this.destroyed) {
		this.destroyed = true;
		if (this.tooltipHandler != null) {
			this.tooltipHandler.destroy();
		}
		if (this.selectionCellsHandler != null) {
			this.selectionCellsHandler.destroy();
		}
		if (this.panningHandler != null) {
			this.panningHandler.destroy();
		}
		if (this.connectionHandler != null) {
			this.connectionHandler.destroy();
		}
		if (this.graphHandler != null) {
			this.graphHandler.destroy();
		}
		if (this.cellEditor != null) {
			this.cellEditor.destroy();
		}
		if (this.view != null) {
			this.view.destroy();
		}
		this.container = null;
	}
};
function mxCellOverlay(image, tooltip, align, verticalAlign, offset, cursor) {
	this.image = image;
	this.tooltip = tooltip;
	this.align = align;
	this.verticalAlign = verticalAlign;
	this.offset = (offset != null) ? offset: new mxPoint();
	this.cursor = (cursor != null) ? cursor: 'help';
};
mxCellOverlay.prototype = new mxEventSource();
mxCellOverlay.prototype.constructor = mxCellOverlay;
mxCellOverlay.prototype.image = null;
mxCellOverlay.prototype.tooltip = null;
mxCellOverlay.prototype.align = null;
mxCellOverlay.prototype.verticalAlign = null;
mxCellOverlay.prototype.offset = null;
mxCellOverlay.prototype.cursor = null;
mxCellOverlay.prototype.defaultOverlap = 0.5;
mxCellOverlay.prototype.getBounds = function(state) {
	var isEdge = state.view.graph.getModel().isEdge(state.cell);
	var s = state.view.scale;
	var pt = null;
	var w = this.image.width;
	var h = this.image.height;
	if (isEdge) {
		var pts = state.absolutePoints;
		if (pts.length % 2 == 1) {
			pt = pts[Math.floor(pts.length / 2)];
		} else {
			var idx = pts.length / 2;
			var p0 = pts[idx - 1];
			var p1 = pts[idx];
			pt = new mxPoint(p0.x + (p1.x - p0.x) / 2, p0.y + (p1.y - p0.y) / 2);
		}
	} else {
		pt = new mxPoint();
		if (this.align == mxConstants.ALIGN_LEFT) {
			pt.x = state.x;
		} else if (this.align == mxConstants.ALIGN_CENTER) {
			pt.x = state.x + state.width / 2;
		} else {
			pt.x = state.x + state.width;
		}
		if (this.verticalAlign == mxConstants.ALIGN_TOP) {
			pt.y = state.y;
		} else if (this.verticalAlign == mxConstants.ALIGN_MIDDLE) {
			pt.y = state.y + state.height / 2;
		} else {
			pt.y = state.y + state.height;
		}
	}
	return new mxRectangle(pt.x - (w * this.defaultOverlap - this.offset.x) * s, pt.y - (h * this.defaultOverlap - this.offset.y) * s, w * s, h * s);
};
mxCellOverlay.prototype.toString = function() {
	return this.tooltip;
};
function mxOutline(source, container) {
	this.source = source;
	if (container != null) {
		this.init(container);
	}
};
mxOutline.prototype.source = null;
mxOutline.prototype.outline = null;
mxOutline.prototype.graphRenderHint = mxConstants.RENDERING_HINT_FASTER;
mxOutline.prototype.enabled = true;
mxOutline.prototype.showViewport = true;
mxOutline.prototype.border = 10;
mxOutline.prototype.sizerSize = 8;
mxOutline.prototype.updateOnPan = false;
mxOutline.prototype.sizerImage = null;
mxOutline.prototype.suspended = false;
mxOutline.prototype.init = function(container) {
	this.outline = new mxGraph(container, this.source.getModel(), this.graphRenderHint, this.source.getStylesheet());
	this.outline.foldingEnabled = false;
	this.outline.autoScroll = false;
	var outlineGraphModelChanged = this.outline.graphModelChanged;
	this.outline.graphModelChanged = mxUtils.bind(this,
	function(changes) {
		if (!this.suspended) {
			outlineGraphModelChanged.apply(this.outline, arguments);
		}
	});
	if (mxClient.IS_SVG) {
		var node = this.outline.getView().getCanvas().parentNode;
		node.setAttribute('shape-rendering', 'optimizeSpeed');
		node.setAttribute('image-rendering', 'optimizeSpeed');
	}
	this.outline.labelsVisible = false;
	this.outline.setEnabled(false);
	this.updateHandler = mxUtils.bind(this,
	function(sender, evt) {
		if (!this.suspended && !this.active) {
			this.update();
		}
	});
	this.source.getModel().addListener(mxEvent.CHANGE, this.updateHandler);
	this.outline.addMouseListener(this);
	var view = this.source.getView();
	view.addListener(mxEvent.SCALE, this.updateHandler);
	view.addListener(mxEvent.TRANSLATE, this.updateHandler);
	view.addListener(mxEvent.SCALE_AND_TRANSLATE, this.updateHandler);
	view.addListener(mxEvent.DOWN, this.updateHandler);
	view.addListener(mxEvent.UP, this.updateHandler);
	mxEvent.addListener(this.source.container, 'scroll', this.updateHandler);
	this.panHandler = mxUtils.bind(this,
	function(sender) {
		if (this.updateOnPan) {
			this.updateHandler.apply(this, arguments);
		}
	});
	this.source.addListener(mxEvent.PAN, this.panHandler);
	this.refreshHandler = mxUtils.bind(this,
	function(sender) {
		this.outline.setStylesheet(this.source.getStylesheet());
		this.outline.refresh();
	});
	this.source.addListener(mxEvent.REFRESH, this.refreshHandler);
	this.bounds = new mxRectangle(0, 0, 0, 0);
	this.selectionBorder = new mxRectangleShape(this.bounds, null, mxConstants.OUTLINE_COLOR, mxConstants.OUTLINE_STROKEWIDTH);
	this.selectionBorder.dialect = (this.outline.dialect != mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_VML: mxConstants.DIALECT_SVG;
	this.selectionBorder.crisp = true;
	this.selectionBorder.init(this.outline.getView().getOverlayPane());
	mxEvent.redirectMouseEvents(this.selectionBorder.node, this.outline);
	this.selectionBorder.node.style.background = '';
	this.sizer = this.createSizer();
	this.sizer.init(this.outline.getView().getOverlayPane());
	if (this.enabled) {
		this.sizer.node.style.cursor = 'pointer';
	}
	mxEvent.addListener(this.sizer.node, (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown', mxUtils.bind(this,
	function(evt) {
		this.outline.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt));
	}));
	this.selectionBorder.node.style.display = (this.showViewport) ? '': 'none';
	this.sizer.node.style.display = this.selectionBorder.node.style.display;
	this.selectionBorder.node.style.cursor = 'move';
	this.update(false);
};
mxOutline.prototype.isEnabled = function() {
	return this.enabled;
};
mxOutline.prototype.setEnabled = function(value) {
	this.enabled = value;
};
mxOutline.prototype.setZoomEnabled = function(value) {
	this.sizer.node.style.visibility = (value) ? 'visible': 'hidden';
};
mxOutline.prototype.refresh = function() {
	this.update(true);
};
mxOutline.prototype.createSizer = function() {
	if (this.sizerImage != null) {
		var sizer = new mxImageShape(new mxRectangle(0, 0, this.sizerImage.width, this.sizerImage.height), this.sizerImage.src);
		sizer.dialect = this.outline.dialect;
		return sizer;
	} else {
		var sizer = new mxRectangleShape(new mxRectangle(0, 0, this.sizerSize, this.sizerSize), mxConstants.OUTLINE_HANDLE_FILLCOLOR, mxConstants.OUTLINE_HANDLE_STROKECOLOR);
		sizer.dialect = this.outline.dialect;
		sizer.crisp = true;
		return sizer;
	}
};
mxOutline.prototype.update = function(revalidate) {
	var sourceScale = this.source.view.scale;
	var scaledGraphBounds = this.source.getGraphBounds();
	var unscaledGraphBounds = new mxRectangle(scaledGraphBounds.x / sourceScale + this.source.panDx, scaledGraphBounds.y / sourceScale + this.source.panDy, scaledGraphBounds.width / sourceScale, scaledGraphBounds.height / sourceScale);
	var unscaledFinderBounds = new mxRectangle(0, 0, this.source.container.clientWidth / sourceScale, this.source.container.clientHeight / sourceScale);
	var union = unscaledGraphBounds.clone();
	union.add(unscaledFinderBounds);
	var completeWidth = Math.max(this.source.container.scrollWidth / sourceScale, union.width);
	var completeHeight = Math.max(this.source.container.scrollHeight / sourceScale, union.height);
	var availableWidth = Math.max(0, this.outline.container.clientWidth - this.border);
	var availableHeight = Math.max(0, this.outline.container.clientHeight - this.border);
	var outlineScale = Math.min(availableWidth / completeWidth, availableHeight / completeHeight);
	var scale = outlineScale;
	if (scale > 0) {
		if (this.outline.getView().scale != scale) {
			this.outline.getView().scale = scale;
			revalidate = true;
		}
		var navView = this.outline.getView();
		if (navView.currentRoot != this.source.getView().currentRoot) {
			navView.setCurrentRoot(this.source.getView().currentRoot);
		}
		var t = this.source.view.translate;
		var tx = t.x + this.source.panDx;
		var ty = t.y + this.source.panDy;
		if (unscaledGraphBounds.x < 0) {
			tx = tx - unscaledGraphBounds.x;
		}
		if (unscaledGraphBounds.y < 0) {
			ty = ty - unscaledGraphBounds.y;
		}
		if (navView.translate.x != tx || navView.translate.y != ty) {
			navView.translate.x = tx;
			navView.translate.y = ty;
			revalidate = true;
		}
		var t2 = navView.translate;
		var scale = this.source.getView().scale;
		var scale2 = scale / navView.scale;
		var scale3 = 1.0 / navView.scale;
		var container = this.source.container;
		this.bounds = new mxRectangle((t2.x - t.x - this.source.panDx) / scale3, (t2.y - t.y - this.source.panDy) / scale3, (container.clientWidth / scale2), (container.clientHeight / scale2));
		this.bounds.x += this.source.container.scrollLeft * navView.scale / scale;
		this.bounds.y += this.source.container.scrollTop * navView.scale / scale;
		this.selectionBorder.bounds = this.bounds;
		this.selectionBorder.redraw();
		var b = this.sizer.bounds;
		this.sizer.bounds = new mxRectangle(this.bounds.x + this.bounds.width - b.width / 2, this.bounds.y + this.bounds.height - b.height / 2, b.width, b.height);
		this.sizer.redraw();
		if (revalidate) {
			this.outline.view.revalidate();
		}
	}
};
mxOutline.prototype.mouseDown = function(sender, me) {
	if (this.enabled && this.showViewport) {
		this.zoom = me.isSource(this.sizer);
		this.startX = me.getX();
		this.startY = me.getY();
		this.active = true;
		if (this.source.useScrollbarsForPanning && mxUtils.hasScrollbars(this.source.container)) {
			this.dx0 = this.source.container.scrollLeft;
			this.dy0 = this.source.container.scrollTop;
		} else {
			this.dx0 = 0;
			this.dy0 = 0;
		}
	}
	me.consume();
};
mxOutline.prototype.mouseMove = function(sender, me) {
	if (this.active) {
		this.selectionBorder.node.style.display = (this.showViewport) ? '': 'none';
		this.sizer.node.style.display = this.selectionBorder.node.style.display;
		var dx = me.getX() - this.startX;
		var dy = me.getY() - this.startY;
		var bounds = null;
		if (!this.zoom) {
			var scale = this.outline.getView().scale;
			bounds = new mxRectangle(this.bounds.x + dx, this.bounds.y + dy, this.bounds.width, this.bounds.height);
			this.selectionBorder.bounds = bounds;
			this.selectionBorder.redraw();
			dx /= scale;
			dx *= this.source.getView().scale;
			dy /= scale;
			dy *= this.source.getView().scale;
			this.source.panGraph( - dx - this.dx0, -dy - this.dy0);
		} else {
			var container = this.source.container;
			var viewRatio = container.clientWidth / container.clientHeight;
			dy = dx / viewRatio;
			bounds = new mxRectangle(this.bounds.x, this.bounds.y, Math.max(1, this.bounds.width + dx), Math.max(1, this.bounds.height + dy));
			this.selectionBorder.bounds = bounds;
			this.selectionBorder.redraw();
		}
		var b = this.sizer.bounds;
		this.sizer.bounds = new mxRectangle(bounds.x + bounds.width - b.width / 2, bounds.y + bounds.height - b.height / 2, b.width, b.height);
		this.sizer.redraw();
		me.consume();
	}
};
mxOutline.prototype.mouseUp = function(sender, me) {
	if (this.active) {
		var dx = me.getX() - this.startX;
		var dy = me.getY() - this.startY;
		if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
			if (!this.zoom) {
				if (!this.source.useScrollbarsForPanning || !mxUtils.hasScrollbars(this.source.container)) {
					this.source.panGraph(0, 0);
					dx /= this.outline.getView().scale;
					dy /= this.outline.getView().scale;
					var t = this.source.getView().translate;
					this.source.getView().setTranslate(t.x - dx, t.y - dy);
				}
			} else {
				var w = this.selectionBorder.bounds.width;
				var scale = this.source.getView().scale;
				this.source.getView().setScale(scale - (dx * scale) / w);
			}
			this.update();
			me.consume();
		}
		this.index = null;
		this.active = false;
	}
};
mxOutline.prototype.destroy = function() {
	if (this.source != null) {
		this.source.removeListener(this.panHandler);
		this.source.removeListener(this.refreshHandler);
		this.source.getModel().removeListener(this.updateHandler);
		this.source.getView().removeListener(this.updateHandler);
		mxEvent.addListener(this.source.container, 'scroll', this.updateHandler);
		this.source = null;
	}
	if (this.outline != null) {
		this.outline.removeMouseListener(this);
		this.outline.destroy();
		this.outline = null;
	}
	if (this.selectionBorder != null) {
		this.selectionBorder.destroy();
		this.selectionBorder = null;
	}
	if (this.sizer != null) {
		this.sizer.destroy();
		this.sizer = null;
	}
};
function mxMultiplicity(source, type, attr, value, min, max, validNeighbors, countError, typeError, validNeighborsAllowed) {
	this.source = source;
	this.type = type;
	this.attr = attr;
	this.value = value;
	this.min = (min != null) ? min: 0;
	this.max = (max != null) ? max: 'n';
	this.validNeighbors = validNeighbors;
	this.countError = mxResources.get(countError) || countError;
	this.typeError = mxResources.get(typeError) || typeError;
	this.validNeighborsAllowed = (validNeighborsAllowed != null) ? validNeighborsAllowed: true;
};
mxMultiplicity.prototype.type = null;
mxMultiplicity.prototype.attr = null;
mxMultiplicity.prototype.value = null;
mxMultiplicity.prototype.source = null;
mxMultiplicity.prototype.min = null;
mxMultiplicity.prototype.max = null;
mxMultiplicity.prototype.validNeighbors = null;
mxMultiplicity.prototype.validNeighborsAllowed = true;
mxMultiplicity.prototype.countError = null;
mxMultiplicity.prototype.typeError = null;
mxMultiplicity.prototype.check = function(graph, edge, source, target, sourceOut, targetIn) {
	var error = '';
	if ((this.source && this.checkTerminal(graph, source, edge)) || (!this.source && this.checkTerminal(graph, target, edge))) {
		if (this.countError != null && ((this.source && (this.max == 0 || (sourceOut >= this.max))) || (!this.source && (this.max == 0 || (targetIn >= this.max))))) {
			error += this.countError + '\n';
		}
		if (this.validNeighbors != null && this.typeError != null && this.validNeighbors.length > 0) {
			var isValid = this.checkNeighbors(graph, edge, source, target);
			if (!isValid) {
				error += this.typeError + '\n';
			}
		}
	}
	return (error.length > 0) ? error: null;
};
mxMultiplicity.prototype.checkNeighbors = function(graph, edge, source, target) {
	var sourceValue = graph.model.getValue(source);
	var targetValue = graph.model.getValue(target);
	var isValid = !this.validNeighborsAllowed;
	var valid = this.validNeighbors;
	for (var j = 0; j < valid.length; j++) {
		if (this.source && this.checkType(graph, targetValue, valid[j])) {
			isValid = this.validNeighborsAllowed;
			break;
		} else if (!this.source && this.checkType(graph, sourceValue, valid[j])) {
			isValid = this.validNeighborsAllowed;
			break;
		}
	}
	return isValid;
};
mxMultiplicity.prototype.checkTerminal = function(graph, terminal, edge) {
	var value = graph.model.getValue(terminal);
	return this.checkType(graph, value, this.type, this.attr, this.value);
};
mxMultiplicity.prototype.checkType = function(graph, value, type, attr, attrValue) {
	if (value != null) {
		if (!isNaN(value.nodeType)) {
			return mxUtils.isNode(value, type, attr, attrValue);
		} else {
			return value == type;
		}
	}
	return false;
};
function mxLayoutManager(graph) {
	this.undoHandler = mxUtils.bind(this,
	function(sender, evt) {
		if (this.isEnabled()) {
			this.beforeUndo(evt.getProperty('edit'));
		}
	});
	this.moveHandler = mxUtils.bind(this,
	function(sender, evt) {
		if (this.isEnabled()) {
			this.cellsMoved(evt.getProperty('cells'), evt.getProperty('event'));
		}
	});
	this.setGraph(graph);
};
mxLayoutManager.prototype = new mxEventSource();
mxLayoutManager.prototype.constructor = mxLayoutManager;
mxLayoutManager.prototype.graph = null;
mxLayoutManager.prototype.bubbling = true;
mxLayoutManager.prototype.enabled = true;
mxLayoutManager.prototype.updateHandler = null;
mxLayoutManager.prototype.moveHandler = null;
mxLayoutManager.prototype.isEnabled = function() {
	return this.enabled;
};
mxLayoutManager.prototype.setEnabled = function(enabled) {
	this.enabled = enabled;
};
mxLayoutManager.prototype.isBubbling = function() {
	return this.bubbling;
};
mxLayoutManager.prototype.setBubbling = function(value) {
	this.bubbling = value;
};
mxLayoutManager.prototype.getGraph = function() {
	return this.graph;
};
mxLayoutManager.prototype.setGraph = function(graph) {
	if (this.graph != null) {
		var model = this.graph.getModel();
		model.removeListener(this.undoHandler);
		this.graph.removeListener(this.moveHandler);
	}
	this.graph = graph;
	if (this.graph != null) {
		var model = this.graph.getModel();
		model.addListener(mxEvent.BEFORE_UNDO, this.undoHandler);
		this.graph.addListener(mxEvent.MOVE_CELLS, this.moveHandler);
	}
};
mxLayoutManager.prototype.getLayout = function(parent) {
	return null;
};
mxLayoutManager.prototype.beforeUndo = function(undoableEdit) {
	var cells = this.getCellsForChanges(undoableEdit.changes);
	var model = this.getGraph().getModel();
	if (this.isBubbling()) {
		var tmp = model.getParents(cells);
		while (tmp.length > 0) {
			cells = cells.concat(tmp);
			tmp = model.getParents(tmp);
		}
	}
	this.layoutCells(mxUtils.sortCells(cells, false));
};
mxLayoutManager.prototype.cellsMoved = function(cells, evt) {
	if (cells != null && evt != null) {
		var point = mxUtils.convertPoint(this.getGraph().container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));
		var model = this.getGraph().getModel();
		for (var i = 0; i < cells.length; i++) {
			var layout = this.getLayout(model.getParent(cells[i]));
			if (layout != null) {
				layout.moveCell(cells[i], point.x, point.y);
			}
		}
	}
};
mxLayoutManager.prototype.getCellsForChanges = function(changes) {
	var result = [];
	var hash = new Object();
	for (var i = 0; i < changes.length; i++) {
		var change = changes[i];
		if (change instanceof mxRootChange) {
			return [];
		} else {
			var cells = this.getCellsForChange(change);
			for (var j = 0; j < cells.length; j++) {
				if (cells[j] != null) {
					var id = mxCellPath.create(cells[j]);
					if (hash[id] == null) {
						hash[id] = cells[j];
						result.push(cells[j]);
					}
				}
			}
		}
	}
	return result;
};
mxLayoutManager.prototype.getCellsForChange = function(change) {
	var model = this.getGraph().getModel();
	if (change instanceof mxChildChange) {
		return [change.child, change.previous, model.getParent(change.child)];
	} else if (change instanceof mxTerminalChange || change instanceof mxGeometryChange) {
		return [change.cell, model.getParent(change.cell)];
	}
	return [];
};
mxLayoutManager.prototype.layoutCells = function(cells) {
	if (cells.length > 0) {
		var model = this.getGraph().getModel();
		model.beginUpdate();
		try {
			var last = null;
			for (var i = 0; i < cells.length; i++) {
				if (cells[i] != model.getRoot() && cells[i] != last) {
					last = cells[i];
					this.executeLayout(this.getLayout(last), last);
				}
			}
			this.fireEvent(new mxEventObject(mxEvent.LAYOUT_CELLS, 'cells', cells));
		} finally {
			model.endUpdate();
		}
	}
};
mxLayoutManager.prototype.executeLayout = function(layout, parent) {
	if (layout != null && parent != null) {
		layout.execute(parent);
	}
};
mxLayoutManager.prototype.destroy = function() {
	this.setGraph(null);
};
function mxSpaceManager(graph, shiftRightwards, shiftDownwards, extendParents) {
	this.resizeHandler = mxUtils.bind(this,
	function(sender, evt) {
		if (this.isEnabled()) {
			this.cellsResized(evt.getProperty('cells'));
		}
	});
	this.foldHandler = mxUtils.bind(this,
	function(sender, evt) {
		if (this.isEnabled()) {
			this.cellsResized(evt.getProperty('cells'));
		}
	});
	this.shiftRightwards = (shiftRightwards != null) ? shiftRightwards: true;
	this.shiftDownwards = (shiftDownwards != null) ? shiftDownwards: true;
	this.extendParents = (extendParents != null) ? extendParents: true;
	this.setGraph(graph);
};
mxSpaceManager.prototype = new mxEventSource();
mxSpaceManager.prototype.constructor = mxSpaceManager;
mxSpaceManager.prototype.graph = null;
mxSpaceManager.prototype.enabled = true;
mxSpaceManager.prototype.shiftRightwards = true;
mxSpaceManager.prototype.shiftDownwards = true;
mxSpaceManager.prototype.extendParents = true;
mxSpaceManager.prototype.resizeHandler = null;
mxSpaceManager.prototype.foldHandler = null;
mxSpaceManager.prototype.isCellIgnored = function(cell) {
	return ! this.getGraph().getModel().isVertex(cell);
};
mxSpaceManager.prototype.isCellShiftable = function(cell) {
	return this.getGraph().getModel().isVertex(cell) && this.getGraph().isCellMovable(cell);
};
mxSpaceManager.prototype.isEnabled = function() {
	return this.enabled;
};
mxSpaceManager.prototype.setEnabled = function(value) {
	this.enabled = value;
};
mxSpaceManager.prototype.isShiftRightwards = function() {
	return this.shiftRightwards;
};
mxSpaceManager.prototype.setShiftRightwards = function(value) {
	this.shiftRightwards = value;
};
mxSpaceManager.prototype.isShiftDownwards = function() {
	return this.shiftDownwards;
};
mxSpaceManager.prototype.setShiftDownwards = function(value) {
	this.shiftDownwards = value;
};
mxSpaceManager.prototype.isExtendParents = function() {
	return this.extendParents;
};
mxSpaceManager.prototype.setExtendParents = function(value) {
	this.extendParents = value;
};
mxSpaceManager.prototype.getGraph = function() {
	return this.graph;
};
mxSpaceManager.prototype.setGraph = function(graph) {
	if (this.graph != null) {
		this.graph.removeListener(this.resizeHandler);
		this.graph.removeListener(this.foldHandler);
	}
	this.graph = graph;
	if (this.graph != null) {
		this.graph.addListener(mxEvent.RESIZE_CELLS, this.resizeHandler);
		this.graph.addListener(mxEvent.FOLD_CELLS, this.foldHandler);
	}
};
mxSpaceManager.prototype.cellsResized = function(cells) {
	if (cells != null) {
		var model = this.graph.getModel();
		model.beginUpdate();
		try {
			for (var i = 0; i < cells.length; i++) {
				if (!this.isCellIgnored(cells[i])) {
					this.cellResized(cells[i]);
					break;
				}
			}
		} finally {
			model.endUpdate();
		}
	}
};
mxSpaceManager.prototype.cellResized = function(cell) {
	var graph = this.getGraph();
	var view = graph.getView();
	var model = graph.getModel();
	var state = view.getState(cell);
	var pstate = view.getState(model.getParent(cell));
	if (state != null && pstate != null) {
		var cells = this.getCellsToShift(state);
		var geo = model.getGeometry(cell);
		if (cells != null && geo != null) {
			var tr = view.translate;
			var scale = view.scale;
			var x0 = state.x - pstate.origin.x - tr.x * scale;
			var y0 = state.y - pstate.origin.y - tr.y * scale;
			var right = state.x + state.width;
			var bottom = state.y + state.height;
			var dx = state.width - geo.width * scale + x0 - geo.x * scale;
			var dy = state.height - geo.height * scale + y0 - geo.y * scale;
			var fx = 1 - geo.width * scale / state.width;
			var fy = 1 - geo.height * scale / state.height;
			model.beginUpdate();
			try {
				for (var i = 0; i < cells.length; i++) {
					if (cells[i] != cell && this.isCellShiftable(cells[i])) {
						this.shiftCell(cells[i], dx, dy, x0, y0, right, bottom, fx, fy, this.isExtendParents() && graph.isExtendParent(cells[i]));
					}
				}
			} finally {
				model.endUpdate();
			}
		}
	}
};
mxSpaceManager.prototype.shiftCell = function(cell, dx, dy, Ox0, y0, right, bottom, fx, fy, extendParent) {
	var graph = this.getGraph();
	var state = graph.getView().getState(cell);
	if (state != null) {
		var model = graph.getModel();
		var geo = model.getGeometry(cell);
		if (geo != null) {
			model.beginUpdate();
			try {
				if (this.isShiftRightwards()) {
					if (state.x >= right) {
						geo = geo.clone();
						geo.translate( - dx, 0);
					} else {
						var tmpDx = Math.max(0, state.x - x0);
						geo = geo.clone();
						geo.translate( - fx * tmpDx, 0);
					}
				}
				if (this.isShiftDownwards()) {
					if (state.y >= bottom) {
						geo = geo.clone();
						geo.translate(0, -dy);
					} else {
						var tmpDy = Math.max(0, state.y - y0);
						geo = geo.clone();
						geo.translate(0, -fy * tmpDy);
					}
				}
				if (geo != model.getGeometry(cell)) {
					model.setGeometry(cell, geo);
					if (extendParent) {
						graph.extendParent(cell);
					}
				}
			} finally {
				model.endUpdate();
			}
		}
	}
};
mxSpaceManager.prototype.getCellsToShift = function(state) {
	var graph = this.getGraph();
	var parent = graph.getModel().getParent(state.cell);
	var down = this.isShiftDownwards();
	var right = this.isShiftRightwards();
	return graph.getCellsBeyond(state.x + ((down) ? 0 : state.width), state.y + ((down && right) ? 0 : state.height), parent, right, down);
};
mxSpaceManager.prototype.destroy = function() {
	this.setGraph(null);
};
function mxSwimlaneManager(graph, horizontal, addEnabled, resizeEnabled) {
	this.horizontal = (horizontal != null) ? horizontal: true;
	this.addEnabled = (addEnabled != null) ? addEnabled: true;
	this.resizeEnabled = (resizeEnabled != null) ? resizeEnabled: true;
	this.addHandler = mxUtils.bind(this,
	function(sender, evt) {
		if (this.isEnabled() && this.isAddEnabled()) {
			this.cellsAdded(evt.getProperty('cells'));
		}
	});
	this.resizeHandler = mxUtils.bind(this,
	function(sender, evt) {
		if (this.isEnabled() && this.isResizeEnabled()) {
			this.cellsResized(evt.getProperty('cells'));
		}
	});
	this.setGraph(graph);
};
mxSwimlaneManager.prototype = new mxEventSource();
mxSwimlaneManager.prototype.constructor = mxSwimlaneManager;
mxSwimlaneManager.prototype.graph = null;
mxSwimlaneManager.prototype.enabled = true;
mxSwimlaneManager.prototype.horizontal = true;
mxSwimlaneManager.prototype.addEnabled = true;
mxSwimlaneManager.prototype.resizeEnabled = true;
mxSwimlaneManager.prototype.addHandler = null;
mxSwimlaneManager.prototype.resizeHandler = null;
mxSwimlaneManager.prototype.isEnabled = function() {
	return this.enabled;
};
mxSwimlaneManager.prototype.setEnabled = function(value) {
	this.enabled = value;
};
mxSwimlaneManager.prototype.isHorizontal = function() {
	return this.horizontal;
};
mxSwimlaneManager.prototype.setHorizontal = function(value) {
	this.horizontal = value;
};
mxSwimlaneManager.prototype.isAddEnabled = function() {
	return this.addEnabled;
};
mxSwimlaneManager.prototype.setAddEnabled = function(value) {
	this.addEnabled = value;
};
mxSwimlaneManager.prototype.isResizeEnabled = function() {
	return this.resizeEnabled;
};
mxSwimlaneManager.prototype.setResizeEnabled = function(value) {
	this.resizeEnabled = value;
};
mxSwimlaneManager.prototype.getGraph = function() {
	return this.graph;
};
mxSwimlaneManager.prototype.setGraph = function(graph) {
	if (this.graph != null) {
		this.graph.removeListener(this.addHandler);
		this.graph.removeListener(this.resizeHandler);
	}
	this.graph = graph;
	if (this.graph != null) {
		this.graph.addListener(mxEvent.ADD_CELLS, this.addHandler);
		this.graph.addListener(mxEvent.CELLS_RESIZED, this.resizeHandler);
	}
};
mxSwimlaneManager.prototype.isSwimlaneIgnored = function(swimlane) {
	return ! this.getGraph().isSwimlane(swimlane);
};
mxSwimlaneManager.prototype.isCellHorizontal = function(cell) {
	if (this.graph.isSwimlane(cell)) {
		var state = this.graph.view.getState(cell);
		var style = (state != null) ? state.style: this.graph.getCellStyle(cell);
		return mxUtils.getValue(style, mxConstants.STYLE_HORIZONTAL, 1) == 1;
	}
	return ! this.isHorizontal();
};
mxSwimlaneManager.prototype.cellsAdded = function(cells) {
	if (cells != null) {
		var model = this.getGraph().getModel();
		model.beginUpdate();
		try {
			for (var i = 0; i < cells.length; i++) {
				if (!this.isSwimlaneIgnored(cells[i])) {
					this.swimlaneAdded(cells[i]);
				}
			}
		} finally {
			model.endUpdate();
		}
	}
};
mxSwimlaneManager.prototype.swimlaneAdded = function(swimlane) {
	var model = this.getGraph().getModel();
	var parent = model.getParent(swimlane);
	var childCount = model.getChildCount(parent);
	var geo = null;
	for (var i = 0; i < childCount; i++) {
		var child = model.getChildAt(parent, i);
		if (child != swimlane && !this.isSwimlaneIgnored(child)) {
			geo = model.getGeometry(child);
			if (geo != null) {
				break;
			}
		}
	}
	if (geo != null) {
		this.resizeSwimlane(swimlane, geo.width, geo.height);
	}
};
mxSwimlaneManager.prototype.cellsResized = function(cells) {
	if (cells != null) {
		var model = this.getGraph().getModel();
		model.beginUpdate();
		try {
			for (var i = 0; i < cells.length; i++) {
				if (!this.isSwimlaneIgnored(cells[i])) {
					var geo = model.getGeometry(cells[i]);
					if (geo != null) {
						var size = new mxRectangle(0, 0, geo.width, geo.height);
						var top = cells[i];
						var current = top;
						while (current != null) {
							top = current;
							current = model.getParent(current);
							var tmp = (this.graph.isSwimlane(current)) ? this.graph.getStartSize(current) : new mxRectangle();
							size.width += tmp.width;
							size.height += tmp.height;
						}
						this.resizeSwimlane(top, size.width, size.height);
					}
				}
			}
		} finally {
			model.endUpdate();
		}
	}
};
mxSwimlaneManager.prototype.resizeSwimlane = function(swimlane, w, h) {
	var model = this.getGraph().getModel();
	model.beginUpdate();
	try {
		if (!this.isSwimlaneIgnored(swimlane)) {
			var geo = model.getGeometry(swimlane);
			if (geo != null) {
				var horizontal = this.isCellHorizontal(swimlane);
				if ((horizontal && geo.height != h) || (!horizontal && geo.width != w)) {
					geo = geo.clone();
					if (horizontal) {
						geo.height = h;
					} else {
						geo.width = w;
					}
					model.setGeometry(swimlane, geo);
				}
			}
		}
		var tmp = (this.graph.isSwimlane(swimlane)) ? this.graph.getStartSize(swimlane) : new mxRectangle();
		w -= tmp.width;
		h -= tmp.height;
		var childCount = model.getChildCount(swimlane);
		for (var i = 0; i < childCount; i++) {
			var child = model.getChildAt(swimlane, i);
			this.resizeSwimlane(child, w, h);
		}
	} finally {
		model.endUpdate();
	}
};
mxSwimlaneManager.prototype.destroy = function() {
	this.setGraph(null);
};
function mxTemporaryCellStates(view, scale, cells) {
	this.view = view;
	scale = (scale != null) ? scale: 1;
	this.oldBounds = view.getGraphBounds();
	this.oldStates = view.getStates();
	this.oldScale = view.getScale();
	view.setStates(new mxDictionary());
	view.setScale(scale);
	if (cells != null) {
		var state = view.createState(new mxCell());
		for (var i = 0; i < cells.length; i++) {
			view.validateBounds(state, cells[i]);
		}
		var bbox = null;
		for (var i = 0; i < cells.length; i++) {
			var bounds = view.validatePoints(state, cells[i]);
			if (bbox == null) {
				bbox = bounds;
			} else {
				bbox.add(bounds);
			}
		}
		if (bbox == null) {
			bbox = new mxRectangle();
		}
		view.setGraphBounds(bbox);
	}
};
mxTemporaryCellStates.prototype.view = null;
mxTemporaryCellStates.prototype.oldStates = null;
mxTemporaryCellStates.prototype.oldBounds = null;
mxTemporaryCellStates.prototype.oldScale = null;
mxTemporaryCellStates.prototype.destroy = function() {
	this.view.setScale(this.oldScale);
	this.view.setStates(this.oldStates);
	this.view.setGraphBounds(this.oldBounds);
};
function mxCellStatePreview(graph) {
	this.graph = graph;
	this.deltas = new Object();
};
mxCellStatePreview.prototype.graph = null;
mxCellStatePreview.prototype.deltas = null;
mxCellStatePreview.prototype.count = 0;
mxCellStatePreview.prototype.isEmpty = function() {
	return this.count == 0;
};
mxCellStatePreview.prototype.moveState = function(state, dx, dy, add, includeEdges) {
	add = (add != null) ? add: true;
	includeEdges = (includeEdges != null) ? includeEdges: true;
	var id = mxCellPath.create(state.cell);
	var delta = this.deltas[id];
	if (delta == null) {
		delta = new mxPoint(dx, dy);
		this.deltas[id] = delta;
		this.count++;
	} else {
		if (add) {
			delta.X += dx;
			delta.Y += dy;
		} else {
			delta.X = dx;
			delta.Y = dy;
		}
	}
	if (includeEdges) {
		this.addEdges(state);
	}
	return delta;
};
mxCellStatePreview.prototype.show = function(visitor) {
	var model = this.graph.getModel();
	var root = model.getRoot();
	for (var id in this.deltas) {
		var cell = mxCellPath.resolve(root, id);
		var state = this.graph.view.getState(cell);
		var delta = this.deltas[id];
		var parentState = this.graph.view.getState(model.getParent(cell));
		this.translateState(parentState, state, delta.x, delta.y);
	}
	for (var id in this.deltas) {
		var cell = mxCellPath.resolve(root, id);
		var state = this.graph.view.getState(cell);
		var delta = this.deltas[id];
		var parentState = this.graph.view.getState(model.getParent(cell));
		this.revalidateState(parentState, state, delta.x, delta.y, visitor);
	}
};
mxCellStatePreview.prototype.translateState = function(parentState, state, dx, dy) {
	if (state != null) {
		var model = this.graph.getModel();
		if (model.isVertex(state.cell)) {
			state.invalid = true;
			this.graph.view.validateBounds(parentState, state.cell);
			var geo = model.getGeometry(state.cell);
			var id = mxCellPath.create(state.cell);
			if ((dx != 0 || dy != 0) && geo != null && (!geo.relative || this.deltas[id] != null)) {
				state.x += dx;
				state.y += dy;
			}
		}
		var childCount = model.getChildCount(state.cell);
		for (var i = 0; i < childCount; i++) {
			this.translateState(state, this.graph.view.getState(model.getChildAt(state.cell, i)), dx, dy);
		}
	}
};
mxCellStatePreview.prototype.revalidateState = function(parentState, state, dx, dy, visitor) {
	if (state != null) {
		state.invalid = true;
		this.graph.view.validatePoints(parentState, state.cell);
		var id = mxCellPath.create(state.cell);
		var model = this.graph.getModel();
		var geo = this.graph.getCellGeometry(state.cell);
		if ((dx != 0 || dy != 0) && geo != null && geo.relative && model.isVertex(state.cell) && (parentState == null || model.isVertex(parentState.cell) || this.deltas[id] != null)) {
			state.x += dx;
			state.y += dy;
			this.graph.view.updateLabelBounds(state);
			this.graph.cellRenderer.redraw(state);
		}
		if (visitor != null) {
			visitor(state);
		}
		var childCount = model.getChildCount(state.cell);
		for (var i = 0; i < childCount; i++) {
			this.revalidateState(state, this.graph.view.getState(model.getChildAt(state.cell, i)), dx, dy, visitor);
		}
	}
};
mxCellStatePreview.prototype.addEdges = function(state) {
	var model = this.graph.getModel();
	var edgeCount = model.getEdgeCount(state.cell);
	for (var i = 0; i < edgeCount; i++) {
		var s = this.graph.view.getState(model.getEdgeAt(state.cell, i));
		if (s != null) {
			this.moveState(s, 0, 0);
		}
	}
};
function mxConnectionConstraint(point, perimeter) {
	this.point = point;
	this.perimeter = (perimeter != null) ? perimeter: true;
};
mxConnectionConstraint.prototype.point = null;
mxConnectionConstraint.prototype.perimeter = null;
function mxGraphHandler(graph) {
	this.graph = graph;
	this.graph.addMouseListener(this);
	this.panHandler = mxUtils.bind(this,
	function() {
		this.updatePreviewShape();
	});
	this.graph.addListener(mxEvent.PAN, this.panHandler);
};
mxGraphHandler.prototype.graph = null;
mxGraphHandler.prototype.maxCells = (mxClient.IS_IE) ? 20 : 50;
mxGraphHandler.prototype.enabled = true;
mxGraphHandler.prototype.highlightEnabled = true;
mxGraphHandler.prototype.cloneEnabled = true;
mxGraphHandler.prototype.moveEnabled = true;
mxGraphHandler.prototype.guidesEnabled = false;
mxGraphHandler.prototype.guide = null;
mxGraphHandler.prototype.currentDx = null;
mxGraphHandler.prototype.currentDy = null;
mxGraphHandler.prototype.updateCursor = true;
mxGraphHandler.prototype.selectEnabled = true;
mxGraphHandler.prototype.removeCellsFromParent = true;
mxGraphHandler.prototype.connectOnDrop = false;
mxGraphHandler.prototype.scrollOnMove = true;
mxGraphHandler.prototype.minimumSize = 6;
mxGraphHandler.prototype.previewColor = 'black';
mxGraphHandler.prototype.htmlPreview = false;
mxGraphHandler.prototype.shape = null;
mxGraphHandler.prototype.scaleGrid = false;
mxGraphHandler.prototype.crisp = true;
mxGraphHandler.prototype.isEnabled = function() {
	return this.enabled;
};
mxGraphHandler.prototype.setEnabled = function(value) {
	this.enabled = value;
};
mxGraphHandler.prototype.isCloneEnabled = function() {
	return this.cloneEnabled;
};
mxGraphHandler.prototype.setCloneEnabled = function(value) {
	this.cloneEnabled = value;
};
mxGraphHandler.prototype.isMoveEnabled = function() {
	return this.moveEnabled;
};
mxGraphHandler.prototype.setMoveEnabled = function(value) {
	this.moveEnabled = value;
};
mxGraphHandler.prototype.isSelectEnabled = function() {
	return this.selectEnabled;
};
mxGraphHandler.prototype.setSelectEnabled = function(value) {
	this.selectEnabled = value;
};
mxGraphHandler.prototype.isRemoveCellsFromParent = function() {
	return this.removeCellsFromParent;
};
mxGraphHandler.prototype.setRemoveCellsFromParent = function(value) {
	this.removeCellsFromParent = value;
};
mxGraphHandler.prototype.getInitialCellForEvent = function(me) {
	return me.getCell();
};
mxGraphHandler.prototype.isDelayedSelection = function(cell) {
	return this.graph.isCellSelected(cell);
};
mxGraphHandler.prototype.mouseDown = function(sender, me) {
	if (!me.isConsumed() && this.isEnabled() && this.graph.isEnabled() && !this.graph.isForceMarqueeEvent(me.getEvent()) && me.getState() != null) {
		var cell = this.getInitialCellForEvent(me);
		this.cell = null;
		this.delayedSelection = this.isDelayedSelection(cell);
		if (this.isSelectEnabled() && !this.delayedSelection) {
			this.graph.selectCellForEvent(cell, me.getEvent());
		}
		if (this.isMoveEnabled()) {
			var model = this.graph.model;
			var geo = model.getGeometry(cell);
			if (this.graph.isCellMovable(cell) && ((!model.isEdge(cell) || this.graph.getSelectionCount() > 1 || (geo.points != null && geo.points.length > 0) || model.getTerminal(cell, true) == null || model.getTerminal(cell, false) == null) || this.graph.allowDanglingEdges || (this.graph.isCloneEvent(me.getEvent()) && this.graph.isCellsCloneable()))) {
				this.start(cell, me.getX(), me.getY());
			}
			this.cellWasClicked = true;
			if ((!false && !false) || me.getSource().nodeName != 'SELECT') {
				me.consume();
			} else if (false && me.getSource().nodeName == 'SELECT') {
				this.cellWasClicked = false;
				this.first = null;
			}
		}
	}
};
mxGraphHandler.prototype.getGuideStates = function() {
	var parent = this.graph.getDefaultParent();
	var model = this.graph.getModel();
	var filter = mxUtils.bind(this,
	function(cell) {
		return this.graph.view.getState(cell) != null && model.isVertex(cell) && model.getGeometry(cell) != null && !model.getGeometry(cell).relative;
	});
	return this.graph.view.getCellStates(model.filterDescendants(filter, parent));
};
mxGraphHandler.prototype.getCells = function(initialCell) {
	if (!this.delayedSelection && this.graph.isCellMovable(initialCell)) {
		return [initialCell];
	} else {
		return this.graph.getMovableCells(this.graph.getSelectionCells());
	}
};
mxGraphHandler.prototype.getPreviewBounds = function(cells) {
	var bounds = this.graph.getView().getBounds(cells);
	if (bounds != null) {
		if (bounds.width < this.minimumSize) {
			var dx = this.minimumSize - bounds.width;
			bounds.x -= dx / 2;
			bounds.width = this.minimumSize;
		}
		if (bounds.height < this.minimumSize) {
			var dy = this.minimumSize - bounds.height;
			bounds.y -= dy / 2;
			bounds.height = this.minimumSize;
		}
	}
	return bounds;
};
mxGraphHandler.prototype.createPreviewShape = function(bounds) {
	var shape = new mxRectangleShape(bounds, null, this.previewColor);
	shape.isDashed = true;
	shape.crisp = this.crisp;
	if (this.htmlPreview) {
		shape.dialect = mxConstants.DIALECT_STRICTHTML;
		shape.init(this.graph.container);
	} else {
		shape.dialect = (this.graph.dialect != mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_VML: mxConstants.DIALECT_SVG;
		shape.init(this.graph.getView().getOverlayPane());
		if (shape.dialect == mxConstants.DIALECT_SVG) {
			shape.node.setAttribute('style', 'pointer-events:none;');
		} else {
			shape.node.style.background = '';
		}
	}
	return shape;
};
mxGraphHandler.prototype.start = function(cell, x, y) {
	this.cell = cell;
	this.first = mxUtils.convertPoint(this.graph.container, x, y);
	this.cells = this.getCells(this.cell);
	this.bounds = this.getPreviewBounds(this.cells);
	if (this.guidesEnabled) {
		this.guide = new mxGuide(this.graph, this.getGuideStates());
	}
};
mxGraphHandler.prototype.useGuidesForEvent = function(me) {
	return (this.guide != null) ? this.guide.isEnabledForEvent(me.getEvent()) : true;
};
mxGraphHandler.prototype.snap = function(vector) {
	var scale = (this.scaleGrid) ? this.graph.view.scale: 1;
	vector.x = this.graph.snap(vector.x / scale) * scale;
	vector.y = this.graph.snap(vector.y / scale) * scale;
	return vector;
};
mxGraphHandler.prototype.mouseMove = function(sender, me) {
	var graph = this.graph;
	if (!me.isConsumed() && graph.isMouseDown && this.cell != null && this.first != null && this.bounds != null) {
		var point = mxUtils.convertPoint(graph.container, me.getX(), me.getY());
		var dx = point.x - this.first.x;
		var dy = point.y - this.first.y;
		var tol = graph.tolerance;
		if (this.shape != null || Math.abs(dx) > tol || Math.abs(dy) > tol) {
			if (this.highlight == null) {
				this.highlight = new mxCellHighlight(this.graph, mxConstants.DROP_TARGET_COLOR, 3);
			}
			if (this.shape == null) {
				this.shape = this.createPreviewShape(this.bounds);
			}
			var gridEnabled = graph.isGridEnabledEvent(me.getEvent());
			var hideGuide = true;
			if (this.guide != null && this.useGuidesForEvent(me)) {
				var delta = this.guide.move(this.bounds, new mxPoint(dx, dy), gridEnabled);
				hideGuide = false;
				dx = delta.x;
				dy = delta.y;
			} else if (gridEnabled) {
				var trx = graph.getView().translate;
				var scale = graph.getView().scale;
				var tx = this.bounds.x - (graph.snap(this.bounds.x / scale - trx.x) + trx.x) * scale;
				var ty = this.bounds.y - (graph.snap(this.bounds.y / scale - trx.y) + trx.y) * scale;
				var v = this.snap(new mxPoint(dx, dy));
				dx = v.x - tx;
				dy = v.y - ty;
			}
			if (this.guide != null && hideGuide) {
				this.guide.hide();
			}
			if (graph.isConstrainedEvent(me.getEvent())) {
				if (Math.abs(dx) > Math.abs(dy)) {
					dy = 0;
				} else {
					dx = 0;
				}
			}
			this.currentDx = dx;
			this.currentDy = dy;
			this.updatePreviewShape();
			var target = null;
			var cell = me.getCell();
			if (graph.isDropEnabled() && this.highlightEnabled) {
				target = graph.getDropTarget(this.cells, me.getEvent(), cell);
			}
			var parent = target;
			var model = graph.getModel();
			while (parent != null && parent != this.cells[0]) {
				parent = model.getParent(parent);
			}
			var clone = graph.isCloneEvent(me.getEvent()) && graph.isCellsCloneable() && this.isCloneEnabled();
			var state = graph.getView().getState(target);
			var highlight = false;
			if (state != null && parent == null && (model.getParent(this.cell) != target || clone)) {
				if (this.target != target) {
					this.target = target;
					this.setHighlightColor(mxConstants.DROP_TARGET_COLOR);
				}
				highlight = true;
			} else {
				this.target = null;
				if (this.connectOnDrop && cell != null && this.cells.length == 1 && graph.getModel().isVertex(cell) && graph.isCellConnectable(cell)) {
					state = graph.getView().getState(cell);
					if (state != null) {
						var error = graph.getEdgeValidationError(null, this.cell, cell);
						var color = (error == null) ? mxConstants.VALID_COLOR: mxConstants.INVALID_CONNECT_TARGET_COLOR;
						this.setHighlightColor(color);
						highlight = true;
					}
				}
			}
			if (state != null && highlight) {
				this.highlight.highlight(state);
			} else {
				this.highlight.hide();
			}
		}
		me.consume();
		mxEvent.consume(me.getEvent());
	} else if ((this.isMoveEnabled() || this.isCloneEnabled()) && this.updateCursor && !me.isConsumed() && me.getState() != null && !graph.isMouseDown) {
		var cursor = graph.getCursorForCell(me.getCell());
		if (cursor == null && graph.isEnabled() && graph.isCellMovable(me.getCell())) {
			if (graph.getModel().isEdge(me.getCell())) {
				cursor = mxConstants.CURSOR_MOVABLE_EDGE;
			} else {
				cursor = mxConstants.CURSOR_MOVABLE_VERTEX;
			}
		}
		me.getState().setCursor(cursor);
		me.consume();
	}
};
mxGraphHandler.prototype.updatePreviewShape = function() {
	if (this.shape != null) {
		this.shape.bounds = new mxRectangle(this.bounds.x + this.currentDx - this.graph.panDx, this.bounds.y + this.currentDy - this.graph.panDy, this.bounds.width, this.bounds.height);
		this.shape.redraw();
	}
};
mxGraphHandler.prototype.setHighlightColor = function(color) {
	if (this.highlight != null) {
		this.highlight.setHighlightColor(color);
	}
};
mxGraphHandler.prototype.mouseUp = function(sender, me) {
	if (!me.isConsumed()) {
		var graph = this.graph;
		if (this.cell != null && this.first != null && this.shape != null && this.currentDx != null && this.currentDy != null) {
			var scale = graph.getView().scale;
			var clone = graph.isCloneEvent(me.getEvent()) && graph.isCellsCloneable() && this.isCloneEnabled();
			var dx = this.currentDx / scale;
			var dy = this.currentDy / scale;
			var cell = me.getCell();
			if (this.connectOnDrop && this.target == null && cell != null && graph.getModel().isVertex(cell) && graph.isCellConnectable(cell) && graph.isEdgeValid(null, this.cell, cell)) {
				graph.connectionHandler.connect(this.cell, cell, me.getEvent());
			} else {
				var target = this.target;
				if (graph.isSplitEnabled() && graph.isSplitTarget(target, this.cells, me.getEvent())) {
					graph.splitEdge(target, this.cells, null, dx, dy);
				} else {
					this.moveCells(this.cells, dx, dy, clone, this.target, me.getEvent());
				}
			}
		} else if (this.isSelectEnabled() && this.delayedSelection && this.cell != null) {
			this.selectDelayed(me);
		}
	}
	if (this.cellWasClicked) {
		me.consume();
	}
	this.reset();
};
mxGraphHandler.prototype.selectDelayed = function(me) {
	this.graph.selectCellForEvent(this.cell, me.getEvent());
};
mxGraphHandler.prototype.reset = function() {
	this.destroyShapes();
	this.cellWasClicked = false;
	this.delayedSelection = false;
	this.currentDx = null;
	this.currentDy = null;
	this.guides = null;
	this.first = null;
	this.cell = null;
	this.target = null;
};
mxGraphHandler.prototype.shouldRemoveCellsFromParent = function(parent, cells, evt) {
	if (this.graph.getModel().isVertex(parent)) {
		var pState = this.graph.getView().getState(parent);
		var pt = mxUtils.convertPoint(this.graph.container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));
		return pState != null && !mxUtils.contains(pState, pt.x, pt.y);
	}
	return false;
};
mxGraphHandler.prototype.moveCells = function(cells, dx, dy, clone, target, evt) {
	if (clone) {
		cells = this.graph.getCloneableCells(cells);
	}
	if (target == null && this.isRemoveCellsFromParent() && this.shouldRemoveCellsFromParent(this.graph.getModel().getParent(this.cell), cells, evt)) {
		target = this.graph.getDefaultParent();
	}
	cells = this.graph.moveCells(cells, dx - this.graph.panDx / this.graph.view.scale, dy - this.graph.panDy / this.graph.view.scale, clone, target, evt);
	if (this.isSelectEnabled() && this.scrollOnMove) {
		this.graph.scrollCellToVisible(cells[0]);
	}
	if (clone) {
		this.graph.setSelectionCells(cells);
	}
};
mxGraphHandler.prototype.destroyShapes = function() {
	if (this.shape != null) {
		this.shape.destroy();
		this.shape = null;
	}
	if (this.guide != null) {
		this.guide.destroy();
		this.guide = null;
	}
	if (this.highlight != null) {
		this.highlight.destroy();
		this.highlight = null;
	}
};
mxGraphHandler.prototype.destroy = function() {
	this.graph.removeMouseListener(this);
	this.graph.removeListener(this.panHandler);
	this.destroyShapes();
};
function mxPanningHandler(graph, factoryMethod) {
	if (graph != null) {
		this.graph = graph;
		this.factoryMethod = factoryMethod;
		this.graph.addMouseListener(this);
		this.init();
	}
};
mxPanningHandler.prototype = new mxPopupMenu();
mxPanningHandler.prototype.constructor = mxPanningHandler;
mxPanningHandler.prototype.graph = null;
mxPanningHandler.prototype.usePopupTrigger = true;
mxPanningHandler.prototype.useLeftButtonForPanning = false;
mxPanningHandler.prototype.selectOnPopup = true;
mxPanningHandler.prototype.clearSelectionOnBackground = true;
mxPanningHandler.prototype.ignoreCell = false;
mxPanningHandler.prototype.previewEnabled = true;
mxPanningHandler.prototype.useGrid = false;
mxPanningHandler.prototype.panningEnabled = true;
mxPanningHandler.prototype.isPanningEnabled = function() {
	return this.panningEnabled;
};
mxPanningHandler.prototype.setPanningEnabled = function(value) {
	this.panningEnabled = value;
};
mxPanningHandler.prototype.init = function() {
	mxPopupMenu.prototype.init.apply(this);
	mxEvent.addListener(this.div, (mxClient.IS_TOUCH) ? 'touchmove': 'mousemove', mxUtils.bind(this,
	function(evt) {
		this.graph.tooltipHandler.hide();
	}));
};
mxPanningHandler.prototype.isPanningTrigger = function(me) {
	var evt = me.getEvent();
	return (this.useLeftButtonForPanning && (this.ignoreCell || me.getState() == null) && mxEvent.isLeftMouseButton(evt)) || (mxEvent.isControlDown(evt) && mxEvent.isShiftDown(evt)) || (this.usePopupTrigger && mxEvent.isPopupTrigger(evt));
};
mxPanningHandler.prototype.mouseDown = function(sender, me) {
	if (!me.isConsumed() && this.isEnabled()) {
		this.hideMenu();
		this.dx0 = -this.graph.container.scrollLeft;
		this.dy0 = -this.graph.container.scrollTop;
		this.popupTrigger = this.isPopupTrigger(me);
		this.panningTrigger = this.isPanningEnabled() && this.isPanningTrigger(me);
		this.startX = me.getX();
		this.startY = me.getY();
		if (this.panningTrigger) {
			me.consume();
		}
	}
};
mxPanningHandler.prototype.mouseMove = function(sender, me) {
	var dx = me.getX() - this.startX;
	var dy = me.getY() - this.startY;
	if (this.active) {
		if (this.previewEnabled) {
			if (this.useGrid) {
				dx = this.graph.snap(dx);
				dy = this.graph.snap(dy);
			}
			this.graph.panGraph(dx + this.dx0, dy + this.dy0);
		}
		this.fireEvent(new mxEventObject(mxEvent.PAN, 'event', me));
		me.consume();
	} else if (this.panningTrigger) {
		var tmp = this.active;
		this.active = Math.abs(dx) > this.graph.tolerance || Math.abs(dy) > this.graph.tolerance;
		if (!tmp && this.active) {
			this.fireEvent(new mxEventObject(mxEvent.PAN_START, 'event', me));
		}
	}
};
mxPanningHandler.prototype.mouseUp = function(sender, me) {
	var dx = Math.abs(me.getX() - this.startX);
	var dy = Math.abs(me.getY() - this.startY);
	if (this.active) {
		if (!this.graph.useScrollbarsForPanning || !mxUtils.hasScrollbars(this.graph.container)) {
			dx = me.getX() - this.startX;
			dy = me.getY() - this.startY;
			if (this.useGrid) {
				dx = this.graph.snap(dx);
				dy = this.graph.snap(dy);
			}
			var scale = this.graph.getView().scale;
			var t = this.graph.getView().translate;
			this.graph.panGraph(0, 0);
			this.panGraph(t.x + dx / scale, t.y + dy / scale);
		}
		this.active = false;
		this.fireEvent(new mxEventObject(mxEvent.PAN_END, 'event', me));
		me.consume();
	} else if (this.popupTrigger) {
		if (dx < this.graph.tolerance && dy < this.graph.tolerance) {
			var cell = this.getCellForPopupEvent(me);
			if (this.graph.isEnabled() && this.selectOnPopup && cell != null && !this.graph.isCellSelected(cell)) {
				this.graph.setSelectionCell(cell);
			} else if (this.clearSelectionOnBackground && cell == null) {
				this.graph.clearSelection();
			}
			this.graph.tooltipHandler.hide();
			var origin = mxUtils.getScrollOrigin();
			var point = new mxPoint(me.getX() + origin.x, me.getY() + origin.y);
			this.popup(point.x + 1, point.y + 1, cell, me.getEvent());
			me.consume();
		}
	}
	this.panningTrigger = false;
	this.popupTrigger = false;
};
mxPanningHandler.prototype.getCellForPopupEvent = function(me) {
	return me.getCell();
};
mxPanningHandler.prototype.panGraph = function(dx, dy) {
	this.graph.getView().setTranslate(dx, dy);
};
mxPanningHandler.prototype.destroy = function() {
	this.graph.removeMouseListener(this);
	mxPopupMenu.prototype.destroy.apply(this);
};
function mxCellMarker(graph, validColor, invalidColor, hotspot) {
	if (graph != null) {
		this.graph = graph;
		this.validColor = (validColor != null) ? validColor: mxConstants.DEFAULT_VALID_COLOR;
		this.invalidColor = (validColor != null) ? invalidColor: mxConstants.DEFAULT_INVALID_COLOR;
		this.hotspot = (hotspot != null) ? hotspot: mxConstants.DEFAULT_HOTSPOT;
		this.highlight = new mxCellHighlight(graph);
	}
};
mxCellMarker.prototype = new mxEventSource();
mxCellMarker.prototype.constructor = mxCellMarker;
mxCellMarker.prototype.graph = null;
mxCellMarker.prototype.enabled = true;
mxCellMarker.prototype.hotspot = mxConstants.DEFAULT_HOTSPOT;
mxCellMarker.prototype.hotspotEnabled = false;
mxCellMarker.prototype.validColor = null;
mxCellMarker.prototype.invalidColor = null;
mxCellMarker.prototype.currentColor = null;
mxCellMarker.prototype.validState = null;
mxCellMarker.prototype.markedState = null;
mxCellMarker.prototype.setEnabled = function(enabled) {
	this.enabled = enabled;
};
mxCellMarker.prototype.isEnabled = function() {
	return this.enabled;
};
mxCellMarker.prototype.setHotspot = function(hotspot) {
	this.hotspot = hotspot;
};
mxCellMarker.prototype.getHotspot = function() {
	return this.hotspot;
};
mxCellMarker.prototype.setHotspotEnabled = function(enabled) {
	this.hotspotEnabled = enabled;
};
mxCellMarker.prototype.isHotspotEnabled = function() {
	return this.hotspotEnabled;
};
mxCellMarker.prototype.hasValidState = function() {
	return this.validState != null;
};
mxCellMarker.prototype.getValidState = function() {
	return this.validState;
};
mxCellMarker.prototype.getMarkedState = function() {
	return this.markedState;
};
mxCellMarker.prototype.reset = function() {
	this.validState = null;
	if (this.markedState != null) {
		this.markedState = null;
		this.unmark();
	}
};
mxCellMarker.prototype.process = function(me) {
	var state = null;
	if (this.isEnabled()) {
		state = this.getState(me);
		var isValid = (state != null) ? this.isValidState(state) : false;
		var color = this.getMarkerColor(me.getEvent(), state, isValid);
		if (isValid) {
			this.validState = state;
		} else {
			this.validState = null;
		}
		if (state != this.markedState || color != this.currentColor) {
			this.currentColor = color;
			if (state != null && this.currentColor != null) {
				this.markedState = state;
				this.mark();
			} else if (this.markedState != null) {
				this.markedState = null;
				this.unmark();
			}
		}
	}
	return state;
};
mxCellMarker.prototype.markCell = function(cell, color) {
	var state = this.graph.getView().getState(cell);
	if (state != null) {
		this.currentColor = (color != null) ? color: this.validColor;
		this.markedState = state;
		this.mark();
	}
};
mxCellMarker.prototype.mark = function() {
	this.highlight.setHighlightColor(this.currentColor);
	this.highlight.highlight(this.markedState);
	this.fireEvent(new mxEventObject(mxEvent.MARK, 'state', this.markedState));
};
mxCellMarker.prototype.unmark = function() {
	this.mark();
};
mxCellMarker.prototype.isValidState = function(state) {
	return true;
};
mxCellMarker.prototype.getMarkerColor = function(evt, state, isValid) {
	return (isValid) ? this.validColor: this.invalidColor;
};
mxCellMarker.prototype.getState = function(me) {
	var view = this.graph.getView();
	cell = this.getCell(me);
	var state = this.getStateToMark(view.getState(cell));
	return (state != null && this.intersects(state, me)) ? state: null;
};
mxCellMarker.prototype.getCell = function(me) {
	return me.getCell();
};
mxCellMarker.prototype.getStateToMark = function(state) {
	return state;
};
mxCellMarker.prototype.intersects = function(state, me) {
	if (this.hotspotEnabled) {
		return mxUtils.intersectsHotspot(state, me.getGraphX(), me.getGraphY(), this.hotspot, mxConstants.MIN_HOTSPOT_SIZE, mxConstants.MAX_HOTSPOT_SIZE);
	}
	return true;
};
mxCellMarker.prototype.destroy = function() {
	this.graph.getView().removeListener(this.resetHandler);
	this.graph.getModel().removeListener(this.resetHandler);
	this.highlight.destroy();
};
function mxSelectionCellsHandler(graph) {
	this.graph = graph;
	this.handlers = new mxDictionary();
	this.graph.addMouseListener(this);
	this.refreshHandler = mxUtils.bind(this,
	function(sender, evt) {
		if (this.graph.isEnabled()) {
			this.refresh();
		}
	});
	this.graph.getSelectionModel().addListener(mxEvent.CHANGE, this.refreshHandler);
	this.graph.getModel().addListener(mxEvent.CHANGE, this.refreshHandler);
	this.graph.getView().addListener(mxEvent.SCALE, this.refreshHandler);
	this.graph.getView().addListener(mxEvent.TRANSLATE, this.refreshHandler);
	this.graph.getView().addListener(mxEvent.SCALE_AND_TRANSLATE, this.refreshHandler);
	this.graph.getView().addListener(mxEvent.DOWN, this.refreshHandler);
	this.graph.getView().addListener(mxEvent.UP, this.refreshHandler);
};
mxSelectionCellsHandler.prototype.graph = null;
mxSelectionCellsHandler.prototype.enabled = true;
mxSelectionCellsHandler.prototype.refreshHandler = null;
mxSelectionCellsHandler.prototype.maxHandlers = 100;
mxSelectionCellsHandler.prototype.handlers = null;
mxSelectionCellsHandler.prototype.isEnabled = function() {
	return this.enabled;
};
mxSelectionCellsHandler.prototype.setEnabled = function(value) {
	this.enabled = value;
};
mxSelectionCellsHandler.prototype.getHandler = function(cell) {
	return this.handlers.get(cell);
};
mxSelectionCellsHandler.prototype.reset = function() {
	this.handlers.visit(function(key, handler) {
		handler.reset.apply(handler);
	});
};
mxSelectionCellsHandler.prototype.refresh = function() {
	var oldHandlers = this.handlers;
	this.handlers = new mxDictionary();
	var tmp = this.graph.getSelectionCells();
	for (var i = 0; i < tmp.length; i++) {
		var state = this.graph.view.getState(tmp[i]);
		if (state != null) {
			var handler = oldHandlers.remove(tmp[i]);
			if (handler != null) {
				if (handler.state != state) {
					handler.destroy();
					handler = null;
				} else {
					handler.redraw();
				}
			}
			if (handler == null) {
				handler = this.graph.createHandler(state);
			}
			if (handler != null) {
				this.handlers.put(tmp[i], handler);
			}
		}
	}
	oldHandlers.visit(function(key, handler) {
		handler.destroy();
	});
};
mxSelectionCellsHandler.prototype.mouseDown = function(sender, me) {
	if (this.graph.isEnabled() && this.isEnabled()) {
		var args = [sender, me];
		this.handlers.visit(function(key, handler) {
			handler.mouseDown.apply(handler, args);
		});
	}
};
mxSelectionCellsHandler.prototype.mouseMove = function(sender, me) {
	if (this.graph.isEnabled() && this.isEnabled()) {
		var args = [sender, me];
		this.handlers.visit(function(key, handler) {
			handler.mouseMove.apply(handler, args);
		});
	}
};
mxSelectionCellsHandler.prototype.mouseUp = function(sender, me) {
	if (this.graph.isEnabled() && this.isEnabled()) {
		var args = [sender, me];
		this.handlers.visit(function(key, handler) {
			handler.mouseUp.apply(handler, args);
		});
	}
};
mxSelectionCellsHandler.prototype.destroy = function() {
	this.graph.removeMouseListener(this);
	if (this.refreshHandler != null) {
		this.graph.getSelectionModel().removeListener(this.refreshHandler);
		this.graph.getModel().removeListener(this.refreshHandler);
		this.graph.getView().removeListener(this.refreshHandler);
		this.refreshHandler = null;
	}
};
function mxConnectionHandler(graph, factoryMethod) {
	if (graph != null) {
		this.graph = graph;
		this.factoryMethod = factoryMethod;
		this.init();
	}
};
mxConnectionHandler.prototype = new mxEventSource();
mxConnectionHandler.prototype.constructor = mxConnectionHandler;
mxConnectionHandler.prototype.graph = null;
mxConnectionHandler.prototype.factoryMethod = true;
mxConnectionHandler.prototype.moveIconFront = false;
mxConnectionHandler.prototype.moveIconBack = false;
mxConnectionHandler.prototype.connectImage = null;
mxConnectionHandler.prototype.targetConnectImage = false;
mxConnectionHandler.prototype.enabled = true;
mxConnectionHandler.prototype.select = true;
mxConnectionHandler.prototype.createTarget = false;
mxConnectionHandler.prototype.marker = null;
mxConnectionHandler.prototype.constraintHandler = null;
mxConnectionHandler.prototype.error = null;
mxConnectionHandler.prototype.waypointsEnabled = false;
mxConnectionHandler.prototype.tapAndHoldEnabled = true;
mxConnectionHandler.prototype.tapAndHoldDelay = 500;
mxConnectionHandler.prototype.tapAndHoldInProgress = false;
mxConnectionHandler.prototype.tapAndHoldValid = false;
mxConnectionHandler.prototype.tapAndHoldTolerance = 4;
mxConnectionHandler.prototype.initialTouchY = 0;
mxConnectionHandler.prototype.initialTouchY = 0;
mxConnectionHandler.prototype.ignoreMouseDown = false;
mxConnectionHandler.prototype.first = null;
mxConnectionHandler.prototype.connectIconOffset = new mxPoint(0, mxConstants.TOOLTIP_VERTICAL_OFFSET);
mxConnectionHandler.prototype.edgeState = null;
mxConnectionHandler.prototype.changeHandler = null;
mxConnectionHandler.prototype.drillHandler = null;
mxConnectionHandler.prototype.mouseDownCounter = 0;
mxConnectionHandler.prototype.movePreviewAway = mxClient.IS_IE;
mxConnectionHandler.prototype.isEnabled = function() {
	return this.enabled;
};
mxConnectionHandler.prototype.setEnabled = function(enabled) {
	this.enabled = enabled;
};
mxConnectionHandler.prototype.isCreateTarget = function() {
	return this.createTarget;
};
mxConnectionHandler.prototype.setCreateTarget = function(value) {
	this.createTarget = value;
};
mxConnectionHandler.prototype.createShape = function() {
	var shape = new mxPolyline([], mxConstants.INVALID_COLOR);
	shape.isDashed = true;
	shape.dialect = (this.graph.dialect != mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_VML: mxConstants.DIALECT_SVG;
	shape.init(this.graph.getView().getOverlayPane());
	if (this.graph.dialect == mxConstants.DIALECT_SVG) {
		shape.pipe.setAttribute('style', 'pointer-events:none;');
		shape.innerNode.setAttribute('style', 'pointer-events:none;');
	} else {
		var getState = mxUtils.bind(this,
		function(evt) {
			var pt = mxUtils.convertPoint(this.graph.container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));
			return this.graph.view.getState(this.graph.getCellAt(pt.x, pt.y));
		});
		mxEvent.redirectMouseEvents(shape.node, this.graph, getState);
	}
	return shape;
};
mxConnectionHandler.prototype.init = function() {
	this.graph.addMouseListener(this);
	this.marker = this.createMarker();
	this.constraintHandler = new mxConstraintHandler(this.graph);
	this.changeHandler = mxUtils.bind(this,
	function(sender) {
		if (this.iconState != null) {
			this.iconState = this.graph.getView().getState(this.iconState.cell);
		}
		if (this.iconState != null) {
			this.redrawIcons(this.icons, this.iconState);
		} else {
			this.destroyIcons(this.icons);
			this.previous = null;
		}
		this.constraintHandler.reset();
	});
	this.graph.getModel().addListener(mxEvent.CHANGE, this.changeHandler);
	this.graph.getView().addListener(mxEvent.SCALE, this.changeHandler);
	this.graph.getView().addListener(mxEvent.TRANSLATE, this.changeHandler);
	this.graph.getView().addListener(mxEvent.SCALE_AND_TRANSLATE, this.changeHandler);
	this.drillHandler = mxUtils.bind(this,
	function(sender) {
		this.destroyIcons(this.icons);
	});
	this.graph.addListener(mxEvent.START_EDITING, this.drillHandler);
	this.graph.getView().addListener(mxEvent.DOWN, this.drillHandler);
	this.graph.getView().addListener(mxEvent.UP, this.drillHandler);
};
mxConnectionHandler.prototype.isConnectableCell = function(cell) {
	return true;
};
mxConnectionHandler.prototype.createMarker = function() {
	var marker = new mxCellMarker(this.graph);
	marker.hotspotEnabled = true;
	marker.getCell = mxUtils.bind(this,
	function(evt, cell) {
		var cell = mxCellMarker.prototype.getCell.apply(marker, arguments);
		this.error = null;
		if (!this.isConnectableCell(cell)) {
			return null;
		}
		if (cell != null) {
			if (this.isConnecting()) {
				if (this.previous != null) {
					this.error = this.validateConnection(this.previous.cell, cell);
					if (this.error != null && this.error.length == 0) {
						cell = null;
						if (this.isCreateTarget()) {
							this.error = null;
						}
					}
				}
			} else if (!this.isValidSource(cell)) {
				cell = null;
			}
		} else if (this.isConnecting() && !this.isCreateTarget() && !this.graph.allowDanglingEdges) {
			this.error = '';
		}
		return cell;
	});
	marker.isValidState = mxUtils.bind(this,
	function(state) {
		if (this.isConnecting()) {
			return this.error == null;
		} else {
			return mxCellMarker.prototype.isValidState.apply(marker, arguments);
		}
	});
	marker.getMarkerColor = mxUtils.bind(this,
	function(evt, state, isValid) {
		return (this.connectImage == null || this.isConnecting()) ? mxCellMarker.prototype.getMarkerColor.apply(marker, arguments) : null;
	});
	marker.intersects = mxUtils.bind(this,
	function(state, evt) {
		if (this.connectImage != null || this.isConnecting()) {
			return true;
		}
		return mxCellMarker.prototype.intersects.apply(marker, arguments);
	});
	return marker;
};
mxConnectionHandler.prototype.start = function(state, x, y, edgeState) {
	this.previous = state;
	this.first = new mxPoint(x, y);
	this.edgeState = (edgeState != null) ? edgeState: this.createEdgeState(null);
	this.marker.currentColor = this.marker.validColor;
	this.marker.markedState = state;
	this.marker.mark();
};
mxConnectionHandler.prototype.isConnecting = function() {
	return this.first != null && this.shape != null;
};
mxConnectionHandler.prototype.isValidSource = function(cell) {
	return this.graph.isValidSource(cell);
};
mxConnectionHandler.prototype.isValidTarget = function(cell) {
	return true;
};
mxConnectionHandler.prototype.validateConnection = function(source, target) {
	if (!this.isValidTarget(target)) {
		return '';
	}
	return this.graph.getEdgeValidationError(null, source, target);
};
mxConnectionHandler.prototype.getConnectImage = function(state) {
	return this.connectImage;
};
mxConnectionHandler.prototype.isMoveIconToFrontForState = function(state) {
	if (state.text != null && state.text.node.parentNode == this.graph.container) {
		return true;
	}
	return this.moveIconFront;
};
mxConnectionHandler.prototype.createIcons = function(state) {
	var image = this.getConnectImage(state);
	if (image != null && state != null) {
		this.iconState = state;
		var icons = [];
		var bounds = new mxRectangle(0, 0, image.width, image.height);
		var icon = new mxImageShape(bounds, image.src, null, null, 0);
		icon.preserveImageAspect = false;
		if (this.isMoveIconToFrontForState(state)) {
			icon.dialect = mxConstants.DIALECT_STRICTHTML;
			icon.init(this.graph.container);
		} else {
			icon.dialect = (this.graph.dialect == mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_SVG: mxConstants.DIALECT_VML;
			icon.init(this.graph.getView().getOverlayPane());
			if (this.moveIconBack && icon.node.previousSibling != null) {
				icon.node.parentNode.insertBefore(icon.node, icon.node.parentNode.firstChild);
			}
		}
		icon.node.style.cursor = mxConstants.CURSOR_CONNECT;
		var getState = mxUtils.bind(this,
		function() {
			return (this.currentState != null) ? this.currentState: state;
		});
		var mouseDown = mxUtils.bind(this,
		function(evt) {
			if (!mxEvent.isConsumed(evt)) {
				this.icon = icon;
				this.graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt, getState()));
			}
		});
		mxEvent.redirectMouseEvents(icon.node, this.graph, getState, mouseDown);
		icons.push(icon);
		this.redrawIcons(icons, this.iconState);
		return icons;
	}
	return null;
};
mxConnectionHandler.prototype.redrawIcons = function(icons, state) {
	if (icons != null && icons[0] != null && state != null) {
		var pos = this.getIconPosition(icons[0], state);
		icons[0].bounds.x = pos.x;
		icons[0].bounds.y = pos.y;
		icons[0].redraw();
	}
};
mxConnectionHandler.prototype.getIconPosition = function(icon, state) {
	var scale = this.graph.getView().scale;
	var cx = state.getCenterX();
	var cy = state.getCenterY();
	if (this.graph.isSwimlane(state.cell)) {
		var size = this.graph.getStartSize(state.cell);
		cx = (size.width != 0) ? state.x + size.width * scale / 2 : cx;
		cy = (size.height != 0) ? state.y + size.height * scale / 2 : cy;
	}
	return new mxPoint(cx - icon.bounds.width / 2, cy - icon.bounds.height / 2);
};
mxConnectionHandler.prototype.destroyIcons = function(icons) {
	if (icons != null) {
		this.iconState = null;
		for (var i = 0; i < icons.length; i++) {
			icons[i].destroy();
		}
	}
};
mxConnectionHandler.prototype.isStartEvent = function(me) {
	return ! this.graph.isForceMarqueeEvent(me.getEvent()) && ((this.constraintHandler.currentFocus != null && this.constraintHandler.currentConstraint != null) || (this.previous != null && this.error == null && (this.icons == null || (this.icons != null && this.icon != null))));
};
mxConnectionHandler.prototype.mouseDown = function(sender, me) {
	this.mouseDownCounter++;
	if (this.isEnabled() && this.graph.isEnabled() && !me.isConsumed() && !this.isConnecting() && this.isStartEvent(me)) {
		if (this.constraintHandler.currentConstraint != null && this.constraintHandler.currentFocus != null && this.constraintHandler.currentPoint != null) {
			this.sourceConstraint = this.constraintHandler.currentConstraint;
			this.previous = this.constraintHandler.currentFocus;
			this.first = this.constraintHandler.currentPoint.clone();
		} else {
			this.first = new mxPoint(me.getGraphX(), me.getGraphY());
		}
		this.edgeState = this.createEdgeState(me);
		this.mouseDownCounter = 1;
		if (this.waypointsEnabled && this.shape == null) {
			this.waypoints = null;
			this.shape = this.createShape();
		}
		if (this.previous == null && this.edgeState != null) {
			var pt = this.graph.getPointForEvent(me.getEvent());
			this.edgeState.cell.geometry.setTerminalPoint(pt, true);
		}
		me.consume();
	} else if (mxClient.IS_TOUCH && this.tapAndHoldEnabled && !this.tapAndHoldInProgress && this.isEnabled() && this.graph.isEnabled() && !this.isConnecting()) {
		this.tapAndHoldInProgress = true;
		this.initialTouchX = me.getX();
		this.initialTouchY = me.getY();
		var state = this.graph.view.getState(this.marker.getCell(me));
		var handler = function() {
			if (this.tapAndHoldValid) {
				this.tapAndHold(me, state);
			}
			this.tapAndHoldInProgress = false;
			this.tapAndHoldValid = false;
		};
		if (this.tapAndHoldThread) {
			window.clearTimeout(this.tapAndHoldThread);
		}
		this.tapAndHoldThread = window.setTimeout(mxUtils.bind(this, handler), this.tapAndHoldDelay);
		this.tapAndHoldValid = true;
	}
	this.selectedIcon = this.icon;
	this.icon = null;
};
mxConnectionHandler.prototype.tapAndHold = function(me, state) {
	if (state != null) {
		this.marker.currentColor = this.marker.validColor;
		this.marker.markedState = state;
		this.marker.mark();
		this.first = new mxPoint(me.getGraphX(), me.getGraphY());
		this.edgeState = this.createEdgeState(me);
		this.previous = state;
	}
};
mxConnectionHandler.prototype.isImmediateConnectSource = function(state) {
	return ! this.graph.isCellMovable(state.cell);
};
mxConnectionHandler.prototype.createEdgeState = function(me) {
	return null;
};
mxConnectionHandler.prototype.updateCurrentState = function(me) {
	var state = this.marker.process(me);
	this.constraintHandler.update(me, this.first == null);
	this.currentState = state;
};
mxConnectionHandler.prototype.convertWaypoint = function(point) {
	var scale = this.graph.getView().getScale();
	var tr = this.graph.getView().getTranslate();
	point.x = point.x / scale - tr.x;
	point.y = point.y / scale - tr.y;
};
mxConnectionHandler.prototype.mouseMove = function(sender, me) {
	if (this.tapAndHoldValid) {
		this.tapAndHoldValid = Math.abs(this.initialTouchX - me.getX()) < this.tapAndHoldTolerance && Math.abs(this.initialTouchY - me.getY()) < this.tapAndHoldTolerance;
	}
	if (!me.isConsumed() && (this.ignoreMouseDown || this.first != null || !this.graph.isMouseDown)) {
		if (this.first != null || (this.isEnabled() && this.graph.isEnabled())) {
			this.updateCurrentState(me);
		}
		if (this.first != null) {
			var view = this.graph.getView();
			var scale = view.scale;
			var point = new mxPoint(this.graph.snap(me.getGraphX() / scale) * scale, this.graph.snap(me.getGraphY() / scale) * scale);
			var constraint = null;
			var current = point;
			if (this.constraintHandler.currentConstraint != null && this.constraintHandler.currentFocus != null && this.constraintHandler.currentPoint != null) {
				constraint = this.constraintHandler.currentConstraint;
				current = this.constraintHandler.currentPoint.clone();
			}
			var pt2 = this.first;
			if (this.selectedIcon != null) {
				var w = this.selectedIcon.bounds.width;
				var h = this.selectedIcon.bounds.height;
				if (this.currentState != null && this.targetConnectImage) {
					var pos = this.getIconPosition(this.selectedIcon, this.currentState);
					this.selectedIcon.bounds.x = pos.x;
					this.selectedIcon.bounds.y = pos.y;
				} else {
					var bounds = new mxRectangle(me.getGraphX() + this.connectIconOffset.x, me.getGraphY() + this.connectIconOffset.y, w, h);
					this.selectedIcon.bounds = bounds;
				}
				this.selectedIcon.redraw();
			}
			if (this.edgeState != null) {
				this.edgeState.absolutePoints = [null, (this.currentState != null) ? null: current];
				this.graph.view.updateFixedTerminalPoint(this.edgeState, this.previous, true, this.sourceConstraint);
				if (this.currentState != null) {
					if (constraint == null) {
						constraint = this.graph.getConnectionConstraint(this.edgeState, this.previous, false);
					}
					this.edgeState.setAbsoluteTerminalPoint(null, false);
					this.graph.view.updateFixedTerminalPoint(this.edgeState, this.currentState, false, constraint);
				}
				var realPoints = null;
				if (this.waypoints != null) {
					realPoints = [];
					for (var i = 0; i < this.waypoints.length; i++) {
						var pt = this.waypoints[i].clone();
						this.convertWaypoint(pt);
						realPoints[i] = pt;
					}
				}
				this.graph.view.updatePoints(this.edgeState, realPoints, this.previous, this.currentState);
				this.graph.view.updateFloatingTerminalPoints(this.edgeState, this.previous, this.currentState);
				current = this.edgeState.absolutePoints[this.edgeState.absolutePoints.length - 1];
				pt2 = this.edgeState.absolutePoints[0];
			} else {
				if (this.currentState != null) {
					if (this.constraintHandler.currentConstraint == null) {
						var tmp = this.getTargetPerimeterPoint(this.currentState, me);
						if (tmp != null) {
							current = tmp;
						}
					}
				}
				if (this.sourceConstraint == null && this.previous != null) {
					var next = (this.waypoints != null && this.waypoints.length > 0) ? this.waypoints[0] : current;
					var tmp = this.getSourcePerimeterPoint(this.previous, next, me);
					if (tmp != null) {
						pt2 = tmp;
					}
				}
			}
			if (this.currentState == null && this.movePreviewAway) {
				var dx = current.x - pt2.x;
				var dy = current.y - pt2.y;
				var len = Math.sqrt(dx * dx + dy * dy);
				current.x -= dx * 4 / len;
				current.y -= dy * 4 / len;
			}
			if (this.shape == null) {
				var dx = Math.abs(point.x - this.first.x);
				var dy = Math.abs(point.y - this.first.y);
				if (dx > this.graph.tolerance || dy > this.graph.tolerance) {
					this.shape = this.createShape();
				}
			}
			if (this.shape != null) {
				if (this.edgeState != null) {
					this.shape.points = this.edgeState.absolutePoints;
				} else {
					var pts = [pt2];
					if (this.waypoints != null) {
						pts = pts.concat(this.waypoints);
					}
					pts.push(current);
					this.shape.points = pts;
				}
				this.drawPreview();
			}
			mxEvent.consume(me.getEvent());
			me.consume();
		} else if (!this.isEnabled() || !this.graph.isEnabled()) {
			this.constraintHandler.reset();
		} else if (this.previous != this.currentState && this.edgeState == null) {
			this.destroyIcons(this.icons);
			this.icons = null;
			if (this.currentState != null && this.error == null) {
				this.icons = this.createIcons(this.currentState);
				if (this.icons == null) {
					this.currentState.setCursor(mxConstants.CURSOR_CONNECT);
					me.consume();
				}
			}
			this.previous = this.currentState;
		} else if (this.previous == this.currentState && this.currentState != null && this.icons == null && !this.graph.isMouseDown) {
			me.consume();
		}
		if (this.constraintHandler.currentConstraint != null) {
			this.marker.reset();
		}
		if (!this.graph.isMouseDown && this.currentState != null && this.icons != null) {
			var checkBounds = this.currentState.text != null && this.currentState.text.node.parentNode == this.graph.container;
			var hitsIcon = false;
			var target = me.getSource();
			for (var i = 0; i < this.icons.length && !hitsIcon; i++) {
				hitsIcon = target == this.icons[i].node || target.parentNode == this.icons[i].node;
			}
			if (!hitsIcon) {
				this.updateIcons(this.currentState, this.icons, me);
			}
		}
	} else {
		this.constraintHandler.reset();
	}
};
mxConnectionHandler.prototype.getTargetPerimeterPoint = function(state, me) {
	var result = null;
	var view = state.view;
	var targetPerimeter = view.getPerimeterFunction(state);
	if (targetPerimeter != null) {
		var next = (this.waypoints != null && this.waypoints.length > 0) ? this.waypoints[this.waypoints.length - 1] : new mxPoint(this.previous.getCenterX(), this.previous.getCenterY());
		var tmp = targetPerimeter(view.getPerimeterBounds(state), this.edgeState, next, false);
		if (tmp != null) {
			result = tmp;
		}
	} else {
		result = new mxPoint(state.getCenterX(), state.getCenterY());
	}
	return result;
};
mxConnectionHandler.prototype.getSourcePerimeterPoint = function(state, next, me) {
	var result = null;
	var view = state.view;
	var sourcePerimeter = view.getPerimeterFunction(state);
	if (sourcePerimeter != null) {
		var tmp = sourcePerimeter(view.getPerimeterBounds(state), state, next, false);
		if (tmp != null) {
			result = tmp;
		}
	} else {
		result = new mxPoint(state.getCenterX(), state.getCenterY());
	}
	return result;
};
mxConnectionHandler.prototype.updateIcons = function(state, icons, me) {};
mxConnectionHandler.prototype.isStopEvent = function(me) {
	return me.getState() != null;
};
mxConnectionHandler.prototype.addWaypointForEvent = function(me) {
	var point = mxUtils.convertPoint(this.graph.container, me.getX(), me.getY());
	var dx = Math.abs(point.x - this.first.x);
	var dy = Math.abs(point.y - this.first.y);
	var addPoint = this.waypoints != null || (this.mouseDownCounter > 1 && (dx > this.graph.tolerance || dy > this.graph.tolerance));
	if (addPoint) {
		if (this.waypoints == null) {
			this.waypoints = [];
		}
		var scale = this.graph.view.scale;
		var point = new mxPoint(this.graph.snap(me.getGraphX() / scale) * scale, this.graph.snap(me.getGraphY() / scale) * scale);
		this.waypoints.push(point);
	}
};
mxConnectionHandler.prototype.mouseUp = function(sender, me) {
	if (!me.isConsumed() && this.isConnecting()) {
		if (this.waypointsEnabled && !this.isStopEvent(me)) {
			this.addWaypointForEvent(me);
			me.consume();
			return;
		}
		if (this.error == null) {
			var source = (this.previous != null) ? this.previous.cell: null;
			var target = null;
			if (this.constraintHandler.currentConstraint != null && this.constraintHandler.currentFocus != null) {
				target = this.constraintHandler.currentFocus.cell;
			}
			if (target == null && this.marker.hasValidState()) {
				target = this.marker.validState.cell;
			}
			this.connect(source, target, me.getEvent(), me.getCell());
		} else {
			if (this.previous != null && this.marker.validState != null && this.previous.cell == this.marker.validState.cell) {
				this.graph.selectCellForEvent(this.marker.source, evt);
			}
			if (this.error.length > 0) {
				this.graph.validationAlert(this.error);
			}
		}
		this.destroyIcons(this.icons);
		me.consume();
	}
	if (this.first != null) {
		this.reset();
	}
	this.tapAndHoldInProgress = false;
	this.tapAndHoldValid = false;
};
mxConnectionHandler.prototype.reset = function() {
	if (this.shape != null) {
		this.shape.destroy();
		this.shape = null;
	}
	this.destroyIcons(this.icons);
	this.icons = null;
	this.marker.reset();
	this.constraintHandler.reset();
	this.selectedIcon = null;
	this.edgeState = null;
	this.previous = null;
	this.error = null;
	this.sourceConstraint = null;
	this.mouseDownCounter = 0;
	this.first = null;
	this.icon = null;
};
mxConnectionHandler.prototype.drawPreview = function() {
	var valid = this.error == null;
	var color = this.getEdgeColor(valid);
	if (this.shape.dialect == mxConstants.DIALECT_SVG) {
		this.shape.innerNode.setAttribute('stroke', color);
	} else {
		this.shape.node.strokecolor = color;
	}
	this.shape.strokewidth = this.getEdgeWidth(valid);
	this.shape.redraw();
	mxUtils.repaintGraph(this.graph, this.shape.points[1]);
};
mxConnectionHandler.prototype.getEdgeColor = function(valid) {
	return (valid) ? mxConstants.VALID_COLOR: mxConstants.INVALID_COLOR;
};
mxConnectionHandler.prototype.getEdgeWidth = function(valid) {
	return (valid) ? 3 : 1;
};
mxConnectionHandler.prototype.connect = function(source, target, evt, dropTarget) {
	if (target != null || this.isCreateTarget() || this.graph.allowDanglingEdges) {
		var model = this.graph.getModel();
		var edge = null;
		model.beginUpdate();
		try {
			if (source != null && target == null && this.isCreateTarget()) {
				target = this.createTargetVertex(evt, source);
				if (target != null) {
					dropTarget = this.graph.getDropTarget([target], evt, dropTarget);
					if (dropTarget == null || !this.graph.getModel().isEdge(dropTarget)) {
						var pstate = this.graph.getView().getState(dropTarget);
						if (pstate != null) {
							var tmp = model.getGeometry(target);
							tmp.x -= pstate.origin.x;
							tmp.y -= pstate.origin.y;
						}
					} else {
						dropTarget = this.graph.getDefaultParent();
					}
					this.graph.addCell(target, dropTarget);
				}
			}
			var parent = this.graph.getDefaultParent();
			if (source != null && target != null && model.getParent(source) == model.getParent(target) && model.getParent(model.getParent(source)) != model.getRoot()) {
				parent = model.getParent(source);
				if ((source.geometry != null && source.geometry.relative) && (target.geometry != null && target.geometry.relative)) {
					parent = model.getParent(parent);
				}
			}
			var value = null;
			var style = null;
			if (this.edgeState != null) {
				value = this.edgeState.cell.value;
				style = this.edgeState.cell.style;
			}
			edge = this.insertEdge(parent, null, value, source, target, style);
			if (edge != null) {
				this.graph.setConnectionConstraint(edge, source, true, this.sourceConstraint);
				this.graph.setConnectionConstraint(edge, target, false, this.constraintHandler.currentConstraint);
				if (this.edgeState != null) {
					model.setGeometry(edge, this.edgeState.cell.geometry);
				}
				var geo = model.getGeometry(edge);
				if (geo == null) {
					geo = new mxGeometry();
					geo.relative = true;
					model.setGeometry(edge, geo);
				}
				if (this.waypoints != null && this.waypoints.length > 0) {
					var s = this.graph.view.scale;
					var tr = this.graph.view.translate;
					geo.points = [];
					for (var i = 0; i < this.waypoints.length; i++) {
						var pt = this.waypoints[i];
						geo.points.push(new mxPoint(pt.x / s - tr.x, pt.y / s - tr.y));
					}
				}
				if (target == null) {
					var pt = this.graph.getPointForEvent(evt);
					pt.x -= this.graph.panDx / this.graph.view.scale;
					pt.y -= this.graph.panDy / this.graph.view.scale;
					mxLog.show();
					mxLog.debug('pt.x', pt.x, this.graph.panDx);
					geo.setTerminalPoint(pt, false);
				}
				this.fireEvent(new mxEventObject(mxEvent.CONNECT, 'cell', edge, 'event', evt, 'target', dropTarget));
			}
		} finally {
			model.endUpdate();
		}
		if (this.select) {
			this.selectCells(edge, target);
		}
	}
};
mxConnectionHandler.prototype.selectCells = function(edge, target) {
	this.graph.setSelectionCell(edge);
};
mxConnectionHandler.prototype.insertEdge = function(parent, id, value, source, target, style) {
	if (this.factoryMethod == null) {
		return this.graph.insertEdge(parent, id, value, source, target, style);
	} else {
		var edge = this.createEdge(value, source, target, style);
		edge = this.graph.addEdge(edge, parent, source, target);
		return edge;
	}
};
mxConnectionHandler.prototype.createTargetVertex = function(evt, source) {
	var clone = this.graph.cloneCells([source])[0];
	var geo = this.graph.getModel().getGeometry(clone);
	if (geo != null) {
		var point = this.graph.getPointForEvent(evt);
		geo.x = this.graph.snap(point.x - geo.width / 2) - this.graph.panDx / this.graph.view.scale;
		geo.y = this.graph.snap(point.y - geo.height / 2) - this.graph.panDy / this.graph.view.scale;
		if (this.first != null) {
			var sourceState = this.graph.view.getState(source);
			if (sourceState != null) {
				var tol = this.getAlignmentTolerance();
				if (Math.abs(this.graph.snap(this.first.x) - this.graph.snap(point.x)) <= tol) {
					geo.x = sourceState.x;
				} else if (Math.abs(this.graph.snap(this.first.y) - this.graph.snap(point.y)) <= tol) {
					geo.y = sourceState.y;
				}
			}
		}
	}
	return clone;
};
mxConnectionHandler.prototype.getAlignmentTolerance = function() {
	return (this.graph.isGridEnabled()) ? this.graph.gridSize: this.graph.tolerance;
};
mxConnectionHandler.prototype.createEdge = function(value, source, target, style) {
	var edge = null;
	if (this.factoryMethod != null) {
		edge = this.factoryMethod(source, target, style);
	}
	if (edge == null) {
		edge = new mxCell(value || '');
		edge.setEdge(true);
		edge.setStyle(style);
		var geo = new mxGeometry();
		geo.relative = true;
		edge.setGeometry(geo);
	}
	return edge;
};
mxConnectionHandler.prototype.destroy = function() {
	this.graph.removeMouseListener(this);
	if (this.shape != null) {
		this.shape.destroy();
		this.shape = null;
	}
	if (this.marker != null) {
		this.marker.destroy();
		this.marker = null;
	}
	if (this.constraintHandler != null) {
		this.constraintHandler.destroy();
		this.constraintHandler = null;
	}
	if (this.changeHandler != null) {
		this.graph.getModel().removeListener(this.changeHandler);
		this.graph.getView().removeListener(this.changeHandler);
		this.changeHandler = null;
	}
	if (this.drillHandler != null) {
		this.graph.removeListener(this.drillHandler);
		this.graph.getView().removeListener(this.drillHandler);
		this.drillHandler = null;
	}
};
function mxConstraintHandler(graph) {
	this.graph = graph;
};
mxConstraintHandler.prototype.pointImage = new mxImage(mxClient.imageBasePath + '/point.gif', 5, 5);
mxConstraintHandler.prototype.graph = null;
mxConstraintHandler.prototype.enabled = true;
mxConstraintHandler.prototype.highlightColor = mxConstants.DEFAULT_VALID_COLOR;
mxConstraintHandler.prototype.isEnabled = function() {
	return this.enabled;
};
mxConstraintHandler.prototype.setEnabled = function(enabled) {
	this.enabled = enabled;
};
mxConstraintHandler.prototype.reset = function() {
	if (this.focusIcons != null) {
		for (var i = 0; i < this.focusIcons.length; i++) {
			this.focusIcons[i].destroy();
		}
		this.focusIcons = null;
	}
	if (this.focusHighlight != null) {
		this.focusHighlight.destroy();
		this.focusHighlight = null;
	}
	this.currentConstraint = null;
	this.currentFocusArea = null;
	this.currentPoint = null;
	this.currentFocus = null;
	this.focusPoints = null;
};
mxConstraintHandler.prototype.getTolerance = function() {
	return this.graph.getTolerance();
};
mxConstraintHandler.prototype.getImageForConstraint = function(state, constraint, point) {
	return this.pointImage;
};
mxConstraintHandler.prototype.update = function(me, source) {
	if (this.isEnabled()) {
		var tol = this.getTolerance();
		var mouse = new mxRectangle(me.getGraphX() - tol, me.getGraphY() - tol, 2 * tol, 2 * tol);
		var connectable = (me.getCell() != null) ? this.graph.isCellConnectable(me.getCell()) : false;
		if ((this.currentFocusArea == null || (!mxUtils.intersects(this.currentFocusArea, mouse) || (me.getState() != null && this.currentFocus != null && connectable && this.graph.getModel().getParent(me.getCell()) == this.currentFocus.cell)))) {
			this.currentFocusArea = null;
			if (me.getState() != this.currentFocus) {
				this.currentFocus = null;
				this.constraints = (me.getState() != null && connectable) ? this.graph.getAllConnectionConstraints(me.getState(), source) : null;
				if (this.constraints != null) {
					this.currentFocus = me.getState();
					this.currentFocusArea = new mxRectangle(me.getState().x, me.getState().y, me.getState().width, me.getState().height);
					if (this.focusIcons != null) {
						for (var i = 0; i < this.focusIcons.length; i++) {
							this.focusIcons[i].destroy();
						}
						this.focusIcons = null;
						this.focusPoints = null;
					}
					this.focusIcons = [];
					this.focusPoints = [];
					for (var i = 0; i < this.constraints.length; i++) {
						var cp = this.graph.getConnectionPoint(me.getState(), this.constraints[i]);
						var img = this.getImageForConstraint(me.getState(), this.constraints[i], cp);
						var src = img.src;
						var bounds = new mxRectangle(cp.x - img.width / 2, cp.y - img.height / 2, img.width, img.height);
						var icon = new mxImageShape(bounds, src);
						icon.dialect = (this.graph.dialect == mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_SVG: mxConstants.DIALECT_VML;
						icon.init(this.graph.getView().getOverlayPane());
						if (icon.node.previousSibling != null) {
							icon.node.parentNode.insertBefore(icon.node, icon.node.parentNode.firstChild);
						}
						var getState = mxUtils.bind(this,
						function() {
							return (this.currentFocus != null) ? this.currentFocus: me.getState();
						});
						icon.redraw();
						mxEvent.redirectMouseEvents(icon.node, this.graph, getState);
						this.currentFocusArea.add(icon.bounds);
						this.focusIcons.push(icon);
						this.focusPoints.push(cp);
					}
					this.currentFocusArea.grow(tol);
				} else if (this.focusIcons != null) {
					if (this.focusHighlight != null) {
						this.focusHighlight.destroy();
						this.focusHighlight = null;
					}
					for (var i = 0; i < this.focusIcons.length; i++) {
						this.focusIcons[i].destroy();
					}
					this.focusIcons = null;
					this.focusPoints = null;
				}
			}
		}
		this.currentConstraint = null;
		this.currentPoint = null;
		if (this.focusIcons != null && this.constraints != null && (me.getState() == null || this.currentFocus == me.getState())) {
			for (var i = 0; i < this.focusIcons.length; i++) {
				if (mxUtils.intersects(this.focusIcons[i].bounds, mouse)) {
					this.currentConstraint = this.constraints[i];
					this.currentPoint = this.focusPoints[i];
					var tmp = this.focusIcons[i].bounds.clone();
					tmp.grow((mxClient.IS_IE) ? 3 : 2);
					if (mxClient.IS_IE) {
						tmp.width -= 1;
						tmp.height -= 1;
					}
					if (this.focusHighlight == null) {
						var hl = new mxRectangleShape(tmp, null, this.highlightColor, 3);
						hl.dialect = (this.graph.dialect == mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_SVG: mxConstants.DIALECT_VML;
						hl.init(this.graph.getView().getOverlayPane());
						this.focusHighlight = hl;
						var getState = mxUtils.bind(this,
						function() {
							return (this.currentFocus != null) ? this.currentFocus: me.getState();
						});
						mxEvent.redirectMouseEvents(hl.node, this.graph, getState);
					} else {
						this.focusHighlight.bounds = tmp;
						this.focusHighlight.redraw();
					}
					break;
				}
			}
		}
		if (this.currentConstraint == null && this.focusHighlight != null) {
			this.focusHighlight.destroy();
			this.focusHighlight = null;
		}
	}
};
mxConstraintHandler.prototype.destroy = function() {
	this.reset();
};
function mxRubberband(graph) {
	if (graph != null) {
		this.graph = graph;
		this.graph.addMouseListener(this);
		this.panHandler = mxUtils.bind(this,
		function() {
			this.repaint();
		});
		this.graph.addListener(mxEvent.PAN, this.panHandler);
		if (mxClient.IS_IE) {
			mxEvent.addListener(window, 'unload', mxUtils.bind(this,
			function() {
				this.destroy();
			}));
		}
	}
};
mxRubberband.prototype.defaultOpacity = 20;
mxRubberband.prototype.enabled = true;
mxRubberband.prototype.div = null;
mxRubberband.prototype.sharedDiv = null;
mxRubberband.prototype.currentX = 0;
mxRubberband.prototype.currentY = 0;
mxRubberband.prototype.isEnabled = function() {
	return this.enabled;
};
mxRubberband.prototype.setEnabled = function(enabled) {
	this.enabled = enabled;
};
mxRubberband.prototype.mouseDown = function(sender, me) {
	if (!me.isConsumed() && this.isEnabled() && this.graph.isEnabled() && (this.graph.isForceMarqueeEvent(me.getEvent()) || me.getState() == null)) {
		var offset = mxUtils.getOffset(this.graph.container);
		var origin = mxUtils.getScrollOrigin(this.graph.container);
		origin.x -= offset.x;
		origin.y -= offset.y;
		this.start(me.getX() + origin.x, me.getY() + origin.y);
		if (!mxClient.IS_IE && !false && !false) {
			var container = this.graph.container;
			function createMouseEvent(evt) {
				var me = new mxMouseEvent(evt);
				var pt = mxUtils.convertPoint(container, me.getX(), me.getY());
				me.graphX = pt.x;
				me.graphY = pt.y;
				return me;
			};
			this.dragHandler = mxUtils.bind(this,
			function(evt) {
				this.mouseMove(this.graph, createMouseEvent(evt));
			});
			this.dropHandler = mxUtils.bind(this,
			function(evt) {
				this.mouseUp(this.graph, createMouseEvent(evt));
			});
			mxEvent.addListener(document, 'mousemove', this.dragHandler);
			mxEvent.addListener(document, 'mouseup', this.dropHandler);
		}
		me.consume(false);
	}
};
mxRubberband.prototype.start = function(x, y) {
	this.first = new mxPoint(x, y);
};
mxRubberband.prototype.mouseMove = function(sender, me) {
	if (!me.isConsumed() && this.first != null) {
		var origin = mxUtils.getScrollOrigin(this.graph.container);
		var offset = mxUtils.getOffset(this.graph.container);
		origin.x -= offset.x;
		origin.y -= offset.y;
		var x = me.getX() + origin.x;
		var y = me.getY() + origin.y;
		var dx = this.first.x - x;
		var dy = this.first.y - y;
		var tol = this.graph.tolerance;
		if (this.div != null || Math.abs(dx) > tol || Math.abs(dy) > tol) {
			if (this.div == null) {
				this.div = this.createShape();
			}
			mxUtils.clearSelection();
			this.update(x, y);
			me.consume();
		}
	}
};
mxRubberband.prototype.createShape = function() {
	if (this.sharedDiv == null) {
		this.sharedDiv = document.createElement('div');
		this.sharedDiv.className = 'mxRubberband';
		mxUtils.setOpacity(this.sharedDiv, this.defaultOpacity);
	}
	this.graph.container.appendChild(this.sharedDiv);
	return this.sharedDiv;
};
mxRubberband.prototype.mouseUp = function(sender, me) {
	var execute = this.div != null;
	this.reset();
	if (execute) {
		var rect = new mxRectangle(this.x, this.y, this.width, this.height);
		this.graph.selectRegion(rect, me.getEvent());
		me.consume();
	}
};
mxRubberband.prototype.reset = function() {
	if (this.div != null) {
		this.div.parentNode.removeChild(this.div);
	}
	if (this.dragHandler != null) {
		mxEvent.removeListener(document, 'mousemove', this.dragHandler);
		this.dragHandler = null;
	}
	if (this.dropHandler != null) {
		mxEvent.removeListener(document, 'mouseup', this.dropHandler);
		this.dropHandler = null;
	}
	this.currentX = 0;
	this.currentY = 0;
	this.first = null;
	this.div = null;
};
mxRubberband.prototype.update = function(x, y) {
	this.currentX = x;
	this.currentY = y;
	this.repaint();
};
mxRubberband.prototype.repaint = function() {
	if (this.div != null) {
		var x = this.currentX - this.graph.panDx;
		var y = this.currentY - this.graph.panDy;
		this.x = Math.min(this.first.x, x);
		this.y = Math.min(this.first.y, y);
		this.width = Math.max(this.first.x, x) - this.x;
		this.height = Math.max(this.first.y, y) - this.y;
		var dx = (mxClient.IS_VML) ? this.graph.panDx: 0;
		var dy = (mxClient.IS_VML) ? this.graph.panDy: 0;
		this.div.style.left = (this.x + dx) + 'px';
		this.div.style.top = (this.y + dy) + 'px';
		this.div.style.width = Math.max(1, this.width) + 'px';
		this.div.style.height = Math.max(1, this.height) + 'px';
	}
};
mxRubberband.prototype.destroy = function() {
	if (!this.destroyed) {
		this.destroyed = true;
		this.graph.removeMouseListener(this);
		this.graph.removeListener(this.panHandler);
		this.reset();
		if (this.sharedDiv != null) {
			this.sharedDiv = null;
		}
	}
};
function mxVertexHandler(state) {
	if (state != null) {
		this.state = state;
		this.init();
	}
};
mxVertexHandler.prototype.graph = null;
mxVertexHandler.prototype.state = null;
mxVertexHandler.prototype.singleSizer = false;
mxVertexHandler.prototype.index = null;
mxVertexHandler.prototype.allowHandleBoundsCheck = true;
mxVertexHandler.prototype.crisp = true;
mxVertexHandler.prototype.handleImage = null;
mxVertexHandler.prototype.tolerance = 0;
mxVertexHandler.prototype.init = function() {
	this.graph = this.state.view.graph;
	this.bounds = this.getSelectionBounds(this.state);
	this.selectionBorder = this.createSelectionShape(this.bounds);
	this.selectionBorder.dialect = (this.graph.dialect != mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_VML: mxConstants.DIALECT_SVG;
	this.selectionBorder.init(this.graph.getView().getOverlayPane());
	if (this.selectionBorder.dialect == mxConstants.DIALECT_SVG) {
		this.selectionBorder.node.setAttribute('pointer-events', 'none');
	} else {
		this.selectionBorder.node.style.background = '';
	}
	if (this.graph.isCellMovable(this.state.cell)) {
		this.selectionBorder.node.style.cursor = mxConstants.CURSOR_MOVABLE_VERTEX;
	}
	mxEvent.redirectMouseEvents(this.selectionBorder.node, this.graph, this.state);
	if (mxGraphHandler.prototype.maxCells <= 0 || this.graph.getSelectionCount() < mxGraphHandler.prototype.maxCells) {
		var resizable = this.graph.isCellResizable(this.state.cell);
		this.sizers = [];
		if (resizable || (this.graph.isLabelMovable(this.state.cell) && this.state.width >= 2 && this.state.height >= 2)) {
			var i = 0;
			if (resizable) {
				if (!this.singleSizer) {
					this.sizers.push(this.createSizer('nw-resize', i++));
					this.sizers.push(this.createSizer('n-resize', i++));
					this.sizers.push(this.createSizer('ne-resize', i++));
					this.sizers.push(this.createSizer('w-resize', i++));
					this.sizers.push(this.createSizer('e-resize', i++));
					this.sizers.push(this.createSizer('sw-resize', i++));
					this.sizers.push(this.createSizer('s-resize', i++));
				}
				this.sizers.push(this.createSizer('se-resize', i++));
			}
			var geo = this.graph.model.getGeometry(this.state.cell);
			if (geo != null && !geo.relative && !this.graph.isSwimlane(this.state.cell) && this.graph.isLabelMovable(this.state.cell)) {
				this.labelShape = this.createSizer(mxConstants.CURSOR_LABEL_HANDLE, mxEvent.LABEL_HANDLE, mxConstants.LABEL_HANDLE_SIZE, mxConstants.LABEL_HANDLE_FILLCOLOR);
				this.sizers.push(this.labelShape);
			}
		} else if (this.graph.isCellMovable(this.state.cell) && !this.graph.isCellResizable(this.state.cell) && this.state.width < 2 && this.state.height < 2) {
			this.labelShape = this.createSizer(mxConstants.CURSOR_MOVABLE_VERTEX, null, null, mxConstants.LABEL_HANDLE_FILLCOLOR);
			this.sizers.push(this.labelShape);
		}
	}
	this.redraw();
};
mxVertexHandler.prototype.getSelectionBounds = function(state) {
	return new mxRectangle(state.x, state.y, state.width, state.height);
};
mxVertexHandler.prototype.createSelectionShape = function(bounds) {
	var shape = new mxRectangleShape(bounds, null, this.getSelectionColor());
	shape.strokewidth = this.getSelectionStrokeWidth();
	shape.isDashed = this.isSelectionDashed();
	shape.crisp = this.crisp;
	return shape;
};
mxVertexHandler.prototype.getSelectionColor = function() {
	return mxConstants.VERTEX_SELECTION_COLOR;
};
mxVertexHandler.prototype.getSelectionStrokeWidth = function() {
	return mxConstants.VERTEX_SELECTION_STROKEWIDTH;
};
mxVertexHandler.prototype.isSelectionDashed = function() {
	return mxConstants.VERTEX_SELECTION_DASHED;
};
mxVertexHandler.prototype.createSizer = function(cursor, index, size, fillColor) {
	size = size || mxConstants.HANDLE_SIZE;
	var bounds = new mxRectangle(0, 0, size, size);
	var sizer = this.createSizerShape(bounds, index, fillColor);
	if (this.state.text != null && this.state.text.node.parentNode == this.graph.container) {
		sizer.bounds.height -= 1;
		sizer.bounds.width -= 1;
		sizer.dialect = mxConstants.DIALECT_STRICTHTML;
		sizer.init(this.graph.container);
	} else {
		sizer.dialect = (this.graph.dialect != mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_VML: mxConstants.DIALECT_SVG;
		sizer.init(this.graph.getView().getOverlayPane());
	}
	sizer.node.style.cursor = cursor;
	mxEvent.redirectMouseEvents(sizer.node, this.graph, this.state);
	if (!this.isSizerVisible(index)) {
		sizer.node.style.visibility = 'hidden';
	}
	return sizer;
};
mxVertexHandler.prototype.isSizerVisible = function(index) {
	return true;
};
mxVertexHandler.prototype.createSizerShape = function(bounds, index, fillColor) {
	if (true && this.handleImage != null) {
		bounds.width = this.handleImage.width;
		bounds.height = this.handleImage.height;
		return new mxImageShape(bounds, this.handleImage.src);
	} else {
		var shape = new mxRectangleShape(bounds, fillColor || mxConstants.HANDLE_FILLCOLOR, mxConstants.HANDLE_STROKECOLOR);
		shape.crisp = this.crisp;
		return shape;
	}
};
mxVertexHandler.prototype.moveSizerTo = function(shape, x, y) {
	if (shape != null) {
		shape.bounds.x = x - shape.bounds.width / 2;
		shape.bounds.y = y - shape.bounds.height / 2;
		shape.redraw();
	}
};
mxVertexHandler.prototype.getHandleForEvent = function(me) {
	if (me.isSource(this.labelShape)) {
		return mxEvent.LABEL_HANDLE;
	}
	if (this.sizers != null) {
		var tol = this.tolerance;
		var hit = (this.allowHandleBoundsCheck && (mxClient.IS_IE || tol > 0)) ? new mxRectangle(me.getGraphX() - tol, me.getGraphY() - tol, 2 * tol, 2 * tol) : null;
		for (var i = 0; i < this.sizers.length; i++) {
			if (me.isSource(this.sizers[i]) || (hit != null && this.sizers[i].node.style.visibility != 'hidden' && mxUtils.intersects(this.sizers[i].bounds, hit))) {
				return i;
			}
		}
	}
	return null;
};
mxVertexHandler.prototype.mouseDown = function(sender, me) {
	if (!me.isConsumed() && this.graph.isEnabled() && !this.graph.isForceMarqueeEvent(me.getEvent()) && (this.tolerance > 0 || me.getState() == this.state)) {
		var handle = this.getHandleForEvent(me);
		if (handle != null) {
			this.start(me.getX(), me.getY(), handle);
			me.consume();
		}
	}
};
mxVertexHandler.prototype.start = function(x, y, index) {
	var pt = mxUtils.convertPoint(this.graph.container, x, y);
	this.startX = pt.x;
	this.startY = pt.y;
	this.index = index;
	this.selectionBorder.node.style.visibility = 'hidden';
	this.preview = this.createSelectionShape(this.bounds);
	if (this.state.text != null && this.state.text.node.parentNode == this.graph.container) {
		this.preview.dialect = mxConstants.DIALECT_STRICTHTML;
		this.preview.init(this.graph.container);
	} else {
		this.preview.dialect = (this.graph.dialect != mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_VML: mxConstants.DIALECT_SVG;
		this.preview.init(this.graph.view.getOverlayPane());
	}
};
mxVertexHandler.prototype.mouseMove = function(sender, me) {
	if (!me.isConsumed() && this.index != null) {
		var point = new mxPoint(me.getGraphX(), me.getGraphY());
		var gridEnabled = this.graph.isGridEnabledEvent(me.getEvent());
		var scale = this.graph.getView().scale;
		if (this.index == mxEvent.LABEL_HANDLE) {
			if (gridEnabled) {
				point.x = this.graph.snap(point.x / scale) * scale;
				point.y = this.graph.snap(point.y / scale) * scale;
			}
			this.moveSizerTo(this.sizers[this.sizers.length - 1], point.x, point.y);
			me.consume();
		} else if (this.index != null) {
			var dx = point.x - this.startX;
			var dy = point.y - this.startY;
			var tr = this.graph.view.translate;
			this.bounds = this.union(this.state, dx, dy, this.index, gridEnabled, scale, tr);
			this.drawPreview();
			me.consume();
		}
	} else if (this.getHandleForEvent(me) != null) {
		me.consume(false);
	}
};
mxVertexHandler.prototype.mouseUp = function(sender, me) {
	if (!me.isConsumed() && this.index != null && this.state != null) {
		var point = new mxPoint(me.getGraphX(), me.getGraphY());
		var scale = this.graph.getView().scale;
		var gridEnabled = this.graph.isGridEnabledEvent(me.getEvent());
		var dx = (point.x - this.startX) / scale;
		var dy = (point.y - this.startY) / scale;
		this.resizeCell(this.state.cell, dx, dy, this.index, gridEnabled);
		this.reset();
		me.consume();
	}
};
mxVertexHandler.prototype.reset = function() {
	this.index = null;
	if (this.preview != null) {
		this.preview.destroy();
		this.preview = null;
	}
	if (this.selectionBorder != null) {
		this.selectionBorder.node.style.visibility = 'visible';
		this.bounds = new mxRectangle(this.state.x, this.state.y, this.state.width, this.state.height);
		this.drawPreview();
	}
};
mxVertexHandler.prototype.resizeCell = function(cell, dx, dy, index, gridEnabled) {
	var geo = this.graph.model.getGeometry(cell);
	if (index == mxEvent.LABEL_HANDLE) {
		var scale = this.graph.view.scale;
		dx = (this.labelShape.bounds.getCenterX() - this.startX) / scale;
		dy = (this.labelShape.bounds.getCenterY() - this.startY) / scale;
		geo = geo.clone();
		if (geo.offset == null) {
			geo.offset = new mxPoint(dx, dy);
		} else {
			geo.offset.x += dx;
			geo.offset.y += dy;
		}
		this.graph.model.setGeometry(cell, geo);
	} else {
		var bounds = this.union(geo, dx, dy, index, gridEnabled, 1, new mxPoint(0, 0));
		this.graph.resizeCell(cell, bounds);
	}
};
mxVertexHandler.prototype.union = function(bounds, dx, dy, index, gridEnabled, scale, tr) {
	if (this.singleSizer) {
		var x = bounds.x + bounds.width + dx;
		var y = bounds.y + bounds.height + dy;
		if (gridEnabled) {
			x = this.graph.snap(x / scale) * scale;
			y = this.graph.snap(y / scale) * scale;
		}
		var rect = new mxRectangle(bounds.x, bounds.y, 0, 0);
		rect.add(new mxRectangle(x, y, 0, 0));
		return rect;
	} else {
		var left = bounds.x - tr.x * scale;
		var right = left + bounds.width;
		var top = bounds.y - tr.y * scale;
		var bottom = top + bounds.height;
		if (index > 4) {
			bottom = bottom + dy;
			if (gridEnabled) {
				bottom = this.graph.snap(bottom / scale) * scale;
			}
		} else if (index < 3) {
			top = top + dy;
			if (gridEnabled) {
				top = this.graph.snap(top / scale) * scale;
			}
		}
		if (index == 0 || index == 3 || index == 5) {
			left += dx;
			if (gridEnabled) {
				left = this.graph.snap(left / scale) * scale;
			}
		} else if (index == 2 || index == 4 || index == 7) {
			right += dx;
			if (gridEnabled) {
				right = this.graph.snap(right / scale) * scale;
			}
		}
		var width = right - left;
		var height = bottom - top;
		if (width < 0) {
			left += width;
			width = Math.abs(width);
		}
		if (height < 0) {
			top += height;
			height = Math.abs(height);
		}
		return new mxRectangle(left + tr.x * scale, top + tr.y * scale, width, height);
	}
};
mxVertexHandler.prototype.redraw = function() {
	this.bounds = new mxRectangle(this.state.x, this.state.y, this.state.width, this.state.height);
	if (this.sizers != null) {
		var s = this.state;
		var r = s.x + s.width;
		var b = s.y + s.height;
		if (this.singleSizer) {
			this.moveSizerTo(this.sizers[0], r, b);
		} else {
			var cx = s.x + s.width / 2;
			var cy = s.y + s.height / 2;
			if (this.sizers.length > 1) {
				this.moveSizerTo(this.sizers[0], s.x, s.y);
				this.moveSizerTo(this.sizers[1], cx, s.y);
				this.moveSizerTo(this.sizers[2], r, s.y);
				this.moveSizerTo(this.sizers[3], s.x, cy);
				this.moveSizerTo(this.sizers[4], r, cy);
				this.moveSizerTo(this.sizers[5], s.x, b);
				this.moveSizerTo(this.sizers[6], cx, b);
				this.moveSizerTo(this.sizers[7], r, b);
				this.moveSizerTo(this.sizers[8], cx + s.absoluteOffset.x, cy + s.absoluteOffset.y);
			} else if (this.state.width >= 2 && this.state.height >= 2) {
				this.moveSizerTo(this.sizers[0], cx + s.absoluteOffset.x, cy + s.absoluteOffset.y);
			} else {
				this.moveSizerTo(this.sizers[0], s.x, s.y);
			}
		}
	}
	this.drawPreview();
};
mxVertexHandler.prototype.drawPreview = function() {
	if (this.preview != null) {
		this.preview.bounds = this.bounds;
		if (this.preview.node.parentNode == this.graph.container) {
			this.preview.bounds.width = Math.max(0, this.preview.bounds.width - 1);
			this.preview.bounds.height = Math.max(0, this.preview.bounds.height - 1);
		}
		this.preview.redraw();
	}
	this.selectionBorder.bounds = this.bounds;
	this.selectionBorder.redraw();
};
mxVertexHandler.prototype.destroy = function() {
	if (this.preview != null) {
		this.preview.destroy();
		this.preview = null;
	}
	this.selectionBorder.destroy();
	this.selectionBorder = null;
	this.labelShape = null;
	if (this.sizers != null) {
		for (var i = 0; i < this.sizers.length; i++) {
			this.sizers[i].destroy();
			this.sizers[i] = null;
		}
	}
};
function mxEdgeHandler(state) {
	if (state != null) {
		this.state = state;
		this.init();
	}
};
mxEdgeHandler.prototype.graph = null;
mxEdgeHandler.prototype.state = null;
mxEdgeHandler.prototype.marker = null;
mxEdgeHandler.prototype.constraintHandler = null;
mxEdgeHandler.prototype.error = null;
mxEdgeHandler.prototype.shape = null;
mxEdgeHandler.prototype.bends = null;
mxEdgeHandler.prototype.labelShape = null;
mxEdgeHandler.prototype.cloneEnabled = true;
mxEdgeHandler.prototype.addEnabled = false;
mxEdgeHandler.prototype.removeEnabled = false;
mxEdgeHandler.prototype.preferHtml = false;
mxEdgeHandler.prototype.allowHandleBoundsCheck = true;
mxEdgeHandler.prototype.snapToTerminals = false;
mxEdgeHandler.prototype.crisp = true;
mxEdgeHandler.prototype.handleImage = null;
mxEdgeHandler.prototype.tolerance = 0;
mxEdgeHandler.prototype.init = function() {
	this.graph = this.state.view.graph;
	this.marker = this.createMarker();
	this.constraintHandler = new mxConstraintHandler(this.graph);
	this.points = [];
	this.abspoints = this.getSelectionPoints(this.state);
	this.shape = this.createSelectionShape(this.abspoints);
	this.shape.dialect = (this.graph.dialect != mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_VML: mxConstants.DIALECT_SVG;
	this.shape.init(this.graph.getView().getOverlayPane());
	this.shape.node.style.cursor = mxConstants.CURSOR_MOVABLE_EDGE;
	var md = (mxClient.IS_TOUCH) ? 'touchstart': 'mousedown';
	var mm = (mxClient.IS_TOUCH) ? 'touchmove': 'mousemove';
	var mu = (mxClient.IS_TOUCH) ? 'touchend': 'mouseup';
	mxEvent.addListener(this.shape.node, 'dblclick', mxUtils.bind(this,
	function(evt) {
		this.graph.dblClick(evt, this.state.cell);
	}));
	mxEvent.addListener(this.shape.node, md, mxUtils.bind(this,
	function(evt) {
		if (this.addEnabled && this.isAddPointEvent(evt)) {
			this.addPoint(this.state, evt);
		} else {
			this.graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt, this.state));
		}
	}));
	mxEvent.addListener(this.shape.node, mm, mxUtils.bind(this,
	function(evt) {
		var cell = this.state.cell;
		if (this.index != null) {
			var pt = mxUtils.convertPoint(this.graph.container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));
			cell = this.graph.getCellAt(pt.x, pt.y);
			if (this.graph.isSwimlane(cell) && this.graph.hitsSwimlaneContent(cell, pt.x, pt.y)) {
				cell = null;
			}
		}
		this.graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt, this.graph.getView().getState(cell)));
	}));
	mxEvent.addListener(this.shape.node, mu, mxUtils.bind(this,
	function(evt) {
		this.graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt, this.state));
	}));
	this.preferHtml = this.state.text != null && this.state.text.node.parentNode == this.graph.container;
	if (!this.preferHtml) {
		var sourceState = this.state.getVisibleTerminalState(true);
		if (sourceState != null) {
			this.preferHtml = sourceState.text != null && sourceState.text.node.parentNode == this.graph.container;
		}
		if (!this.preferHtml) {
			var targetState = this.state.getVisibleTerminalState(false);
			if (targetState != null) {
				this.preferHtml = targetState.text != null && targetState.text.node.parentNode == this.graph.container;
			}
		}
	}
	if (this.graph.getSelectionCount() < mxGraphHandler.prototype.maxCells || mxGraphHandler.prototype.maxCells <= 0) {
		this.bends = this.createBends();
	}
	this.label = new mxPoint(this.state.absoluteOffset.x, this.state.absoluteOffset.y);
	this.labelShape = new mxRectangleShape(new mxRectangle(), mxConstants.LABEL_HANDLE_FILLCOLOR, mxConstants.HANDLE_STROKECOLOR);
	this.initBend(this.labelShape);
	this.labelShape.node.style.cursor = mxConstants.CURSOR_LABEL_HANDLE;
	mxEvent.redirectMouseEvents(this.labelShape.node, this.graph, this.state);
	this.redraw();
};
mxEdgeHandler.prototype.isAddPointEvent = function(evt) {
	return mxEvent.isShiftDown(evt);
};
mxEdgeHandler.prototype.isRemovePointEvent = function(evt) {
	return mxEvent.isShiftDown(evt);
};
mxEdgeHandler.prototype.getSelectionPoints = function(state) {
	return state.absolutePoints;
};
mxEdgeHandler.prototype.createSelectionShape = function(points) {
	var shape = new mxPolyline(points, this.getSelectionColor());
	shape.strokewidth = this.getSelectionStrokeWidth();
	shape.isDashed = this.isSelectionDashed();
	return shape;
};
mxEdgeHandler.prototype.getSelectionColor = function() {
	return mxConstants.EDGE_SELECTION_COLOR;
};
mxEdgeHandler.prototype.getSelectionStrokeWidth = function() {
	return mxConstants.EDGE_SELECTION_STROKEWIDTH;
};
mxEdgeHandler.prototype.isSelectionDashed = function() {
	return mxConstants.EDGE_SELECTION_DASHED;
};
mxEdgeHandler.prototype.isConnectableCell = function(cell) {
	return true;
};
mxEdgeHandler.prototype.createMarker = function() {
	var marker = new mxCellMarker(this.graph);
	var self = this;
	marker.getCell = function(me) {
		var cell = mxCellMarker.prototype.getCell.apply(this, arguments);
		if (!self.isConnectableCell(cell)) {
			return null;
		}
		var model = self.graph.getModel();
		if (cell == self.state.cell || (cell != null && !self.graph.connectableEdges && model.isEdge(cell))) {
			cell = null;
		}
		return cell;
	};
	marker.isValidState = function(state) {
		var model = self.graph.getModel();
		var other = model.getTerminal(self.state.cell, !self.isSource);
		var otherCell = (other != null) ? other.cell: null;
		var source = (self.isSource) ? state.cell: otherCell;
		var target = (self.isSource) ? otherCell: state.cell;
		self.error = self.validateConnection(source, target);
		return self.error == null;
	};
	return marker;
};
mxEdgeHandler.prototype.validateConnection = function(source, target) {
	return this.graph.getEdgeValidationError(this.state.cell, source, target);
};
mxEdgeHandler.prototype.createBends = function() {
	var cell = this.state.cell;
	var bends = [];
	for (var i = 0; i < this.abspoints.length; i++) {
		if (this.isHandleVisible(i)) {
			var source = i == 0;
			var target = i == this.abspoints.length - 1;
			var terminal = source || target;
			if (terminal || this.graph.isCellBendable(cell)) {
				var bend = this.createHandleShape(i);
				this.initBend(bend);
				if (mxClient.IS_TOUCH) {
					bend.node.setAttribute('pointer-events', 'none');
				}
				if (this.isHandleEnabled(i)) {
					if (mxClient.IS_TOUCH) {
						var getState = mxUtils.bind(this,
						function(evt) {
							var pt = mxUtils.convertPoint(this.graph.container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));
							return this.graph.view.getState(this.graph.getCellAt(pt.x, pt.y));
						});
						mxEvent.redirectMouseEvents(bend.node, this.graph, getState);
					} else {
						bend.node.style.cursor = mxConstants.CURSOR_BEND_HANDLE;
						mxEvent.redirectMouseEvents(bend.node, this.graph, this.state);
					}
				}
				bends.push(bend);
				if (!terminal) {
					this.points.push(new mxPoint(0, 0));
					bend.node.style.visibility = 'hidden';
				}
			}
		}
	}
	return bends;
};
mxEdgeHandler.prototype.isHandleEnabled = function(index) {
	return true;
};
mxEdgeHandler.prototype.isHandleVisible = function(index) {
	return (this.abspoints[index] != null) ? !this.abspoints[index].isRouted: true;
};
mxEdgeHandler.prototype.createHandleShape = function(index) {
	if (this.handleImage != null) {
		return new mxImageShape(new mxRectangle(0, 0, this.handleImage.width, this.handleImage.height), this.handleImage.src);
	} else {
		var s = mxConstants.HANDLE_SIZE;
		if (this.preferHtml) {
			s -= 1;
		}
		return new mxRectangleShape(new mxRectangle(0, 0, s, s), mxConstants.HANDLE_FILLCOLOR, mxConstants.HANDLE_STROKECOLOR);
	}
};
mxEdgeHandler.prototype.initBend = function(bend) {
	bend.crisp = this.crisp;
	if (this.preferHtml) {
		bend.dialect = mxConstants.DIALECT_STRICTHTML;
		bend.init(this.graph.container);
	} else {
		bend.dialect = (this.graph.dialect != mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_VML: mxConstants.DIALECT_SVG;
		bend.init(this.graph.getView().getOverlayPane());
	}
};
mxEdgeHandler.prototype.getHandleForEvent = function(me) {
	if (this.bends != null) {
		var tol = this.tolerance;
		var hit = (this.allowHandleBoundsCheck && (mxClient.IS_IE || tol > 0)) ? new mxRectangle(me.getGraphX() - tol, me.getGraphY() - tol, 2 * tol, 2 * tol) : null;
		for (var i = 0; i < this.bends.length; i++) {
			if (me.isSource(this.bends[i]) || (hit != null && this.bends[i].node.style.visibility != 'hidden' && mxUtils.intersects(this.bends[i].bounds, hit))) {
				return i;
			}
		}
	}
	if (me.isSource(this.labelShape) || me.isSource(this.state.text)) {
		if ((!false && !false) || me.getSource().nodeName != 'SELECT') {
			return mxEvent.LABEL_HANDLE;
		}
	}
	return null;
};
mxEdgeHandler.prototype.mouseDown = function(sender, me) {
	var handle = null; {
		handle = this.getHandleForEvent(me);
	}
	if (handle != null && !me.isConsumed() && this.graph.isEnabled() && !this.graph.isForceMarqueeEvent(me.getEvent())) {
		if (this.removeEnabled && this.isRemovePointEvent(me.getEvent())) {
			this.removePoint(this.state, handle);
		} else if (handle != mxEvent.LABEL_HANDLE || this.graph.isLabelMovable(me.getCell())) {
			this.start(me.getX(), me.getY(), handle);
		}
		me.consume();
	}
};
mxEdgeHandler.prototype.start = function(x, y, index) {
	this.startX = x;
	this.startY = y;
	this.isSource = (this.bends == null) ? false: index == 0;
	this.isTarget = (this.bends == null) ? false: index == this.bends.length - 1;
	this.isLabel = index == mxEvent.LABEL_HANDLE;
	if (this.isSource || this.isTarget) {
		var cell = this.state.cell;
		var terminal = this.graph.model.getTerminal(cell, this.isSource);
		if ((terminal == null && this.graph.isTerminalPointMovable(cell, this.isSource)) || (terminal != null && this.graph.isCellDisconnectable(cell, terminal, this.isSource))) {
			this.index = index;
		}
	} else {
		this.index = index;
	}
};
mxEdgeHandler.prototype.clonePreviewState = function(point, terminal) {
	return this.state.clone();
};
mxEdgeHandler.prototype.getSnapToTerminalTolerance = function() {
	return this.graph.gridSize * this.graph.view.scale / 2;
};
mxEdgeHandler.prototype.getPointForEvent = function(me) {
	var point = new mxPoint(me.getGraphX(), me.getGraphY());
	var tt = this.getSnapToTerminalTolerance();
	var view = this.graph.getView();
	var overrideX = false;
	var overrideY = false;
	if (this.snapToTerminals && tt > 0) {
		function snap(terminal, source) {
			if (terminal != null) {
				var pts = this.state.absolutePoints;
				var abs = (source) ? pts[0] : pts[pts.length - 1];
				var x = view.getRoutingCenterX(terminal);
				if (Math.abs(point.x - x) < tt) {
					point.x = x;
					overrideX = true;
				}
				if (abs != null && abs.x != x) {
					x = abs.x;
					if (Math.abs(point.x - x) < tt) {
						point.x = x;
						overrideX = true;
					}
				}
				var y = view.getRoutingCenterY(terminal);
				if (Math.abs(point.y - y) < tt) {
					point.y = y;
					overrideY = true;
				}
				if (abs != null && abs.y != y) {
					y = abs.y;
					if (Math.abs(point.y - y) < tt) {
						point.y = y;
						overrideY = true;
					}
				}
			}
		};
		snap.call(this, this.state.getVisibleTerminalState(true));
		snap.call(this, this.state.getVisibleTerminalState(false));
	}
	if (this.graph.isGridEnabledEvent(me.getEvent())) {
		var scale = view.scale;
		var tr = view.translate;
		if (!overrideX) {
			point.x = (this.graph.snap(point.x / scale - tr.x) + tr.x) * scale;
		}
		if (!overrideY) {
			point.y = (this.graph.snap(point.y / scale - tr.y) + tr.y) * scale;
		}
	}
	return point;
};
mxEdgeHandler.prototype.getPreviewTerminalState = function(me) {
	this.constraintHandler.update(me, this.isSource);
	this.marker.process(me);
	var currentState = this.marker.getValidState();
	var result = null;
	if (this.constraintHandler.currentFocus != null && this.constraintHandler.currentConstraint != null) {
		this.marker.reset();
	}
	if (currentState != null) {
		result = currentState;
	} else if (this.constraintHandler.currentConstraint != null && this.constraintHandler.currentFocus != null) {
		result = this.constraintHandler.currentFocus;
	}
	return result;
};
mxEdgeHandler.prototype.getPreviewPoints = function(point) {
	var geometry = this.graph.getCellGeometry(this.state.cell);
	var points = geometry.points;
	if (!this.isSource && !this.isTarget) {
		this.convertPoint(point, false);
		if (points == null) {
			points = [point];
		} else {
			points = points.slice();
			points[this.index - 1] = point;
		}
	} else if (this.graph.resetEdgesOnConnect) {
		points = null;
	}
	return points;
};
mxEdgeHandler.prototype.updatePreviewState = function(edge, point, terminalState) {
	var sourceState = (this.isSource) ? terminalState: this.state.getVisibleTerminalState(true);
	var targetState = (this.isTarget) ? terminalState: this.state.getVisibleTerminalState(false);
	var sourceConstraint = this.graph.getConnectionConstraint(edge, sourceState, true);
	var targetConstraint = this.graph.getConnectionConstraint(edge, targetState, false);
	var constraint = this.constraintHandler.currentConstraint;
	if (constraint == null) {
		constraint = new mxConnectionConstraint();
	}
	if (this.isSource) {
		sourceConstraint = constraint;
	} else if (this.isTarget) {
		targetConstraint = constraint;
	}
	if (!this.isSource || sourceState != null) {
		edge.view.updateFixedTerminalPoint(edge, sourceState, true, sourceConstraint);
	}
	if (!this.isTarget || targetState != null) {
		edge.view.updateFixedTerminalPoint(edge, targetState, false, targetConstraint);
	}
	if ((this.isSource || this.isTarget) && terminalState == null) {
		edge.setAbsoluteTerminalPoint(point, this.isSource);
		if (this.marker.getMarkedState() == null) {
			this.error = (this.graph.allowDanglingEdges) ? null: '';
		}
	}
	edge.view.updatePoints(edge, this.points, sourceState, targetState);
	edge.view.updateFloatingTerminalPoints(edge, sourceState, targetState);
};
mxEdgeHandler.prototype.mouseMove = function(sender, me) {
	if (this.index != null && this.marker != null) {
		var point = this.getPointForEvent(me);
		if (this.isLabel) {
			this.label.x = point.x;
			this.label.y = point.y;
		} else {
			this.points = this.getPreviewPoints(point);
			var terminalState = (this.isSource || this.isTarget) ? this.getPreviewTerminalState(me) : null;
			var clone = this.clonePreviewState(point, (terminalState != null) ? terminalState.cell: null);
			this.updatePreviewState(clone, point, terminalState);
			var color = (this.error == null) ? this.marker.validColor: this.marker.invalidColor;
			this.setPreviewColor(color);
			this.abspoints = clone.absolutePoints;
			this.active = true;
		}
		this.drawPreview();
		mxEvent.consume(me.getEvent());
		me.consume();
	} else if (mxClient.IS_IE && this.getHandleForEvent(me) != null) {
		me.consume(false);
	}
};
mxEdgeHandler.prototype.mouseUp = function(sender, me) {
	if (this.index != null && this.marker != null) {
		var edge = this.state.cell;
		if (me.getX() != this.startX || me.getY() != this.startY) {
			if (this.error != null) {
				if (this.error.length > 0) {
					this.graph.validationAlert(this.error);
				}
			} else if (this.isLabel) {
				this.moveLabel(this.state, this.label.x, this.label.y);
			} else if (this.isSource || this.isTarget) {
				var terminal = null;
				if (this.constraintHandler.currentConstraint != null && this.constraintHandler.currentFocus != null) {
					terminal = this.constraintHandler.currentFocus.cell;
				}
				if (terminal == null && this.marker.hasValidState()) {
					terminal = this.marker.validState.cell;
				}
				if (terminal != null) {
					edge = this.connect(edge, terminal, this.isSource, this.graph.isCloneEvent(me.getEvent()) && this.cloneEnabled && this.graph.isCellsCloneable(), me);
				} else if (this.graph.isAllowDanglingEdges()) {
					var pt = this.graph.getPointForEvent(me.getEvent());
					var pstate = this.graph.getView().getState(this.graph.getModel().getParent(edge));
					if (pstate != null) {
						pt.x -= pstate.origin.x;
						pt.y -= pstate.origin.y;
					}
					pt.x -= this.graph.panDx / this.graph.view.scale;
					pt.y -= this.graph.panDy / this.graph.view.scale;
					this.changeTerminalPoint(edge, pt, this.isSource);
				}
			} else if (this.active) {
				this.changePoints(edge, this.points);
			} else {
				this.graph.getView().invalidate(this.state.cell);
				this.graph.getView().revalidate(this.state.cell);
			}
		}
		if (this.marker != null) {
			this.reset();
			if (edge != this.state.cell) {
				this.graph.setSelectionCell(edge);
			}
		}
		me.consume();
	}
};
mxEdgeHandler.prototype.reset = function() {
	this.error = null;
	this.index = null;
	this.label = null;
	this.points = null;
	this.active = false;
	this.isLabel = false;
	this.isSource = false;
	this.isTarget = false;
	this.marker.reset();
	this.constraintHandler.reset();
	this.setPreviewColor(mxConstants.EDGE_SELECTION_COLOR);
	this.redraw();
};
mxEdgeHandler.prototype.setPreviewColor = function(color) {
	if (this.shape != null && this.shape.node != null) {
		if (this.shape.dialect == mxConstants.DIALECT_SVG) {
			this.shape.innerNode.setAttribute('stroke', color);
		} else {
			this.shape.node.setAttribute('strokecolor', color);
		}
	}
};
mxEdgeHandler.prototype.convertPoint = function(point, gridEnabled) {
	var scale = this.graph.getView().getScale();
	var tr = this.graph.getView().getTranslate();
	if (gridEnabled) {
		point.x = this.graph.snap(point.x);
		point.y = this.graph.snap(point.y);
	}
	point.x = Math.round(point.x / scale - tr.x);
	point.y = Math.round(point.y / scale - tr.y);
	var pstate = this.graph.getView().getState(this.graph.getModel().getParent(this.state.cell));
	if (pstate != null) {
		point.x -= pstate.origin.x;
		point.y -= pstate.origin.y;
	}
	return point;
};
mxEdgeHandler.prototype.moveLabel = function(edgeState, x, y) {
	var model = this.graph.getModel();
	var geometry = model.getGeometry(edgeState.cell);
	if (geometry != null) {
		geometry = geometry.clone();
		var pt = this.graph.getView().getRelativePoint(edgeState, x, y);
		geometry.x = pt.x;
		geometry.y = pt.y;
		var scale = this.graph.getView().scale;
		geometry.offset = new mxPoint(0, 0);
		var pt = this.graph.view.getPoint(edgeState, geometry);
		geometry.offset = new mxPoint((x - pt.x) / scale, (y - pt.y) / scale);
		model.setGeometry(edgeState.cell, geometry);
	}
};
mxEdgeHandler.prototype.connect = function(edge, terminal, isSource, isClone, me) {
	var model = this.graph.getModel();
	var parent = model.getParent(edge);
	model.beginUpdate();
	try {
		if (isClone) {
			var clone = edge.clone();
			model.add(parent, clone, model.getChildCount(parent));
			var other = model.getTerminal(edge, !isSource);
			this.graph.connectCell(clone, other, !isSource);
			edge = clone;
		}
		var constraint = this.constraintHandler.currentConstraint;
		if (constraint == null) {
			constraint = new mxConnectionConstraint();
		}
		this.graph.connectCell(edge, terminal, isSource, constraint);
	} finally {
		model.endUpdate();
	}
	return edge;
};
mxEdgeHandler.prototype.changeTerminalPoint = function(edge, point, isSource) {
	var model = this.graph.getModel();
	var geo = model.getGeometry(edge);
	if (geo != null) {
		model.beginUpdate();
		try {
			geo = geo.clone();
			geo.setTerminalPoint(point, isSource);
			model.setGeometry(edge, geo);
			this.graph.connectCell(edge, null, isSource, new mxConnectionConstraint());
		} finally {
			model.endUpdate();
		}
	}
};
mxEdgeHandler.prototype.changePoints = function(edge, points) {
	var model = this.graph.getModel();
	var geo = model.getGeometry(edge);
	if (geo != null) {
		geo = geo.clone();
		geo.points = points;
		model.setGeometry(edge, geo);
	}
};
mxEdgeHandler.prototype.addPoint = function(state, evt) {
	var geo = this.graph.getCellGeometry(state.cell);
	if (geo != null) {
		geo = geo.clone();
		var pt = mxUtils.convertPoint(this.graph.container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));
		var index = mxUtils.findNearestSegment(state, pt.x, pt.y);
		var gridEnabled = this.graph.isGridEnabledEvent(evt);
		this.convertPoint(pt, gridEnabled);
		if (geo.points == null) {
			geo.points = [pt];
		} else {
			geo.points.splice(index, 0, pt);
		}
		this.graph.getModel().setGeometry(state.cell, geo);
		this.destroy();
		this.init();
		mxEvent.consume(evt);
	}
};
mxEdgeHandler.prototype.removePoint = function(state, index) {
	if (index > 0 && index < this.abspoints.length - 1) {
		var geo = this.graph.getCellGeometry(this.state.cell);
		if (geo != null && geo.points != null) {
			geo = geo.clone();
			geo.points.splice(index - 1, 1);
			this.graph.getModel().setGeometry(state.cell, geo);
			this.destroy();
			this.init();
		}
	}
};
mxEdgeHandler.prototype.getHandleFillColor = function(index) {
	var isSource = index == 0;
	var cell = this.state.cell;
	var terminal = this.graph.getModel().getTerminal(cell, isSource);
	var color = mxConstants.HANDLE_FILLCOLOR;
	if ((terminal != null && !this.graph.isCellDisconnectable(cell, terminal, isSource)) || (terminal == null && !this.graph.isTerminalPointMovable(cell, isSource))) {
		color = mxConstants.LOCKED_HANDLE_FILLCOLOR;
	} else if (terminal != null && this.graph.isCellDisconnectable(cell, terminal, isSource)) {
		color = mxConstants.CONNECT_HANDLE_FILLCOLOR;
	}
	return color;
};
mxEdgeHandler.prototype.redraw = function() {
	this.abspoints = this.state.absolutePoints.slice();
	var cell = this.state.cell;
	var s = mxConstants.LABEL_HANDLE_SIZE;
	this.label = new mxPoint(this.state.absoluteOffset.x, this.state.absoluteOffset.y);
	this.labelShape.bounds = new mxRectangle(this.label.x - s / 2, this.label.y - s / 2, s, s);
	this.labelShape.redraw();
	var lab = this.graph.getLabel(cell);
	if (lab != null && lab.length > 0 && this.graph.isLabelMovable(cell)) {
		this.labelShape.node.style.visibility = 'visible';
	} else {
		this.labelShape.node.style.visibility = 'hidden';
	}
	if (this.bends != null && this.bends.length > 0) {
		var n = this.abspoints.length - 1;
		var p0 = this.abspoints[0];
		var x0 = this.abspoints[0].x;
		var y0 = this.abspoints[0].y;
		var b = this.bends[0].bounds;
		this.bends[0].bounds = new mxRectangle(x0 - b.width / 2, y0 - b.height / 2, b.width, b.height);
		this.bends[0].fill = this.getHandleFillColor(0);
		this.bends[0].reconfigure();
		this.bends[0].redraw();
		var pe = this.abspoints[n];
		var xn = this.abspoints[n].x;
		var yn = this.abspoints[n].y;
		var bn = this.bends.length - 1;
		b = this.bends[bn].bounds;
		this.bends[bn].bounds = new mxRectangle(xn - b.width / 2, yn - b.height / 2, b.width, b.height);
		this.bends[bn].fill = this.getHandleFillColor(bn);
		this.bends[bn].reconfigure();
		this.bends[bn].redraw();
		this.redrawInnerBends(p0, pe);
	}
	this.drawPreview();
};
mxEdgeHandler.prototype.redrawInnerBends = function(p0, pe) {
	var g = this.graph.getModel().getGeometry(this.state.cell);
	var pts = g.points;
	if (pts != null) {
		if (this.points == null) {
			this.points = [];
		}
		for (var i = 1; i < this.bends.length - 1; i++) {
			if (this.bends[i] != null) {
				if (this.abspoints[i] != null) {
					var x = this.abspoints[i].x;
					var y = this.abspoints[i].y;
					var b = this.bends[i].bounds;
					this.bends[i].node.style.visibility = 'visible';
					this.bends[i].bounds = new mxRectangle(x - b.width / 2, y - b.height / 2, b.width, b.height);
					this.bends[i].redraw();
					this.points[i - 1] = pts[i - 1];
				} else {
					this.bends[i].destroy();
					this.bends[i] = null;
				}
			}
		}
	}
};
mxEdgeHandler.prototype.drawPreview = function() {
	if (this.isLabel) {
		var s = mxConstants.LABEL_HANDLE_SIZE;
		var bounds = new mxRectangle(this.label.x - s / 2, this.label.y - s / 2, s, s);
		this.labelShape.bounds = bounds;
		this.labelShape.redraw();
	} else {
		this.shape.points = this.abspoints;
		this.shape.redraw();
	}
	mxUtils.repaintGraph(this.graph, this.shape.points[this.shape.points.length - 1]);
};
mxEdgeHandler.prototype.destroy = function() {
	if (this.marker != null) {
		this.marker.destroy();
		this.marker = null;
	}
	if (this.shape != null) {
		this.shape.destroy();
		this.shape = null;
	}
	if (this.labelShape != null) {
		this.labelShape.destroy();
		this.labelShape = null;
	}
	if (this.constraintHandler != null) {
		this.constraintHandler.destroy();
		this.constraintHandler = null;
	}
	if (this.bends != null) {
		for (var i = 0; i < this.bends.length; i++) {
			if (this.bends[i] != null) {
				this.bends[i].destroy();
				this.bends[i] = null;
			}
		}
	}
};
function mxElbowEdgeHandler(state) {
	if (state != null) {
		this.state = state;
		this.init();
	}
};
mxElbowEdgeHandler.prototype = new mxEdgeHandler();
mxElbowEdgeHandler.prototype.constructor = mxElbowEdgeHandler;
mxElbowEdgeHandler.prototype.flipEnabled = true;
mxElbowEdgeHandler.prototype.doubleClickOrientationResource = (mxClient.language != 'none') ? 'doubleClickOrientation': '';
mxElbowEdgeHandler.prototype.createBends = function() {
	var bends = [];
	var bend = this.createHandleShape(0);
	this.initBend(bend);
	bend.node.style.cursor = mxConstants.CURSOR_BEND_HANDLE;
	mxEvent.redirectMouseEvents(bend.node, this.graph, this.state);
	bends.push(bend);
	if (mxClient.IS_TOUCH) {
		bend.node.setAttribute('pointer-events', 'none');
	}
	bends.push(this.createVirtualBend());
	this.points.push(new mxPoint(0, 0));
	bend = this.createHandleShape(2);
	this.initBend(bend);
	bend.node.style.cursor = mxConstants.CURSOR_BEND_HANDLE;
	mxEvent.redirectMouseEvents(bend.node, this.graph, this.state);
	bends.push(bend);
	if (mxClient.IS_TOUCH) {
		bend.node.setAttribute('pointer-events', 'none');
	}
	return bends;
};
mxElbowEdgeHandler.prototype.createVirtualBend = function() {
	var bend = this.createHandleShape();
	this.initBend(bend);
	var crs = this.getCursorForBend();
	bend.node.style.cursor = crs;
	var dblClick = mxUtils.bind(this,
	function(evt) {
		if (!mxEvent.isConsumed(evt) && this.flipEnabled) {
			this.graph.flipEdge(this.state.cell, evt);
			mxEvent.consume(evt);
		}
	});
	mxEvent.redirectMouseEvents(bend.node, this.graph, this.state, null, null, null, dblClick);
	if (!this.graph.isCellBendable(this.state.cell)) {
		bend.node.style.visibility = 'hidden';
	}
	return bend;
};
mxElbowEdgeHandler.prototype.getCursorForBend = function() {
	return (this.state.style[mxConstants.STYLE_EDGE] == mxEdgeStyle.TopToBottom || this.state.style[mxConstants.STYLE_EDGE] == mxConstants.EDGESTYLE_TOPTOBOTTOM || ((this.state.style[mxConstants.STYLE_EDGE] == mxEdgeStyle.ElbowConnector || this.state.style[mxConstants.STYLE_EDGE] == mxConstants.EDGESTYLE_ELBOW) && this.state.style[mxConstants.STYLE_ELBOW] == mxConstants.ELBOW_VERTICAL)) ? 'row-resize': 'col-resize';
};
mxElbowEdgeHandler.prototype.getTooltipForNode = function(node) {
	var tip = null;
	if (this.bends != null && this.bends[1] != null && (node == this.bends[1].node || node.parentNode == this.bends[1].node)) {
		tip = this.doubleClickOrientationResource;
		tip = mxResources.get(tip) || tip;
	}
	return tip;
};
mxElbowEdgeHandler.prototype.convertPoint = function(point, gridEnabled) {
	var scale = this.graph.getView().getScale();
	var tr = this.graph.getView().getTranslate();
	var origin = this.state.origin;
	if (gridEnabled) {
		point.x = this.graph.snap(point.x);
		point.y = this.graph.snap(point.y);
	}
	point.x = Math.round(point.x / scale - tr.x - origin.x);
	point.y = Math.round(point.y / scale - tr.y - origin.y);
};
mxElbowEdgeHandler.prototype.redrawInnerBends = function(p0, pe) {
	var g = this.graph.getModel().getGeometry(this.state.cell);
	var pts = g.points;
	var pt = (pts != null) ? pts[0] : null;
	if (pt == null) {
		pt = new mxPoint(p0.x + (pe.x - p0.x) / 2, p0.y + (pe.y - p0.y) / 2);
	} else {
		pt = new mxPoint(this.graph.getView().scale * (pt.x + this.graph.getView().translate.x + this.state.origin.x), this.graph.getView().scale * (pt.y + this.graph.getView().translate.y + this.state.origin.y));
	}
	var b = this.bends[1].bounds;
	var w = b.width;
	var h = b.height;
	if (this.handleImage == null) {
		w = mxConstants.HANDLE_SIZE;
		h = mxConstants.HANDLE_SIZE;
	}
	var bounds = new mxRectangle(pt.x - w / 2, pt.y - h / 2, w, h);
	if (this.handleImage == null && this.labelShape.node.style.visibility != 'hidden' && mxUtils.intersects(bounds, this.labelShape.bounds)) {
		w += 3;
		h += 3;
		bounds = new mxRectangle(pt.x - w / 2, pt.y - h / 2, w, h);
	}
	this.bends[1].bounds = bounds;
	this.bends[1].reconfigure();
	this.bends[1].redraw();
};
function mxEdgeSegmentHandler(state) {
	if (state != null) {
		this.state = state;
		this.init();
	}
};
mxEdgeSegmentHandler.prototype = new mxElbowEdgeHandler();
mxEdgeSegmentHandler.prototype.constructor = mxEdgeSegmentHandler;
mxEdgeSegmentHandler.prototype.getPreviewPoints = function(point) {
	if (this.isSource || this.isTarget) {
		return mxElbowEdgeHandler.prototype.getPreviewPoints.apply(this, arguments);
	} else {
		this.convertPoint(point, false);
		var pts = this.state.absolutePoints;
		var last = pts[0].clone();
		this.convertPoint(last, false);
		var result = [];
		for (var i = 1; i < pts.length; i++) {
			var pt = pts[i].clone();
			this.convertPoint(pt, false);
			if (i == this.index) {
				if (last.x == pt.x) {
					last.x = point.x;
					pt.x = point.x;
				} else {
					last.y = point.y;
					pt.y = point.y;
				}
			}
			if (i < pts.length - 1) {
				result.push(pt);
			}
			last = pt;
		}
		if (result.length == 1) {
			var view = this.state.view;
			var source = this.state.getVisibleTerminalState(true);
			var target = this.state.getVisibleTerminalState(false);
			if (target != null & source != null) {
				if (mxUtils.contains(target, result[0].x, result[0].y)) {
					if (pts[1].y == pts[2].y) {
						result[0].y = view.getRoutingCenterY(source);
					} else {
						result[0].x = view.getRoutingCenterX(source);
					}
				} else if (mxUtils.contains(source, result[0].x, result[0].y)) {
					if (pts[1].y == pts[0].y) {
						result[0].y = view.getRoutingCenterY(target);
					} else {
						result[0].x = view.getRoutingCenterX(target);
					}
				}
			}
		} else if (result.length == 0) {
			result = [point];
		}
		return result;
	}
};
mxEdgeSegmentHandler.prototype.createBends = function() {
	var bends = [];
	var bend = this.createHandleShape(0);
	this.initBend(bend);
	bend.node.style.cursor = mxConstants.CURSOR_BEND_HANDLE;
	mxEvent.redirectMouseEvents(bend.node, this.graph, this.state);
	bends.push(bend);
	if (mxClient.IS_TOUCH) {
		bend.node.setAttribute('pointer-events', 'none');
	}
	var pts = this.state.absolutePoints;
	if (this.graph.isCellBendable(this.state.cell)) {
		if (this.points == null) {
			this.points = [];
		}
		for (var i = 0; i < pts.length - 1; i++) {
			var bend = this.createVirtualBend();
			bends.push(bend);
			var horizontal = pts[i].x - pts[i + 1].x == 0;
			bend.node.style.cursor = (horizontal) ? 'col-resize': 'row-resize';
			this.points.push(new mxPoint(0, 0));
			if (mxClient.IS_TOUCH) {
				bend.node.setAttribute('pointer-events', 'none');
			}
		}
	}
	var bend = this.createHandleShape(pts.length);
	this.initBend(bend);
	bend.node.style.cursor = mxConstants.CURSOR_BEND_HANDLE;
	mxEvent.redirectMouseEvents(bend.node, this.graph, this.state);
	bends.push(bend);
	if (mxClient.IS_TOUCH) {
		bend.node.setAttribute('pointer-events', 'none');
	}
	return bends;
};
mxEdgeSegmentHandler.prototype.redrawInnerBends = function(p0, pe) {
	if (this.graph.isCellBendable(this.state.cell)) {
		var s = mxConstants.HANDLE_SIZE;
		var pts = this.state.absolutePoints;
		if (pts != null && pts.length > 1) {
			for (var i = 0; i < this.state.absolutePoints.length - 1; i++) {
				if (this.bends[i + 1] != null) {
					var p0 = pts[i];
					var pe = pts[i + 1];
					var pt = new mxPoint(p0.x + (pe.x - p0.x) / 2, p0.y + (pe.y - p0.y) / 2);
					this.bends[i + 1].bounds = new mxRectangle(pt.x - s / 2, pt.y - s / 2, s, s);
					this.bends[i + 1].reconfigure();
					this.bends[i + 1].redraw();
				}
			}
		}
	}
};
mxEdgeSegmentHandler.prototype.connect = function(edge, terminal, isSource, isClone, me) {
	mxEdgeHandler.prototype.connect.apply(this, arguments);
	this.refresh();
};
mxEdgeSegmentHandler.prototype.changeTerminalPoint = function(edge, point, isSource) {
	mxEdgeHandler.prototype.changeTerminalPoint.apply(this, arguments);
	this.refresh();
};
mxEdgeSegmentHandler.prototype.changePoints = function(edge, points) {
	points = [];
	var pts = this.abspoints;
	if (pts.length > 1) {
		var pt0 = pts[0];
		var pt1 = pts[1];
		for (var i = 2; i < pts.length; i++) {
			var pt2 = pts[i];
			if ((Math.round(pt0.x) != Math.round(pt1.x) || Math.round(pt1.x) != Math.round(pt2.x)) && (Math.round(pt0.y) != Math.round(pt1.y) || Math.round(pt1.y) != Math.round(pt2.y))) {
				pt0 = pt1;
				pt1 = pt1.clone();
				this.convertPoint(pt1, false);
				points.push(pt1);
			}
			pt1 = pt2;
		}
	}
	mxElbowEdgeHandler.prototype.changePoints.apply(this, arguments);
	this.refresh();
};
mxEdgeSegmentHandler.prototype.refresh = function() {
	if (this.bends != null) {
		for (var i = 0; i < this.bends.length; i++) {
			if (this.bends[i] != null) {
				this.bends[i].destroy();
				this.bends[i] = null;
			}
		}
		this.bends = this.createBends();
	}
};
function mxKeyHandler(graph, target) {
	if (graph != null) {
		this.graph = graph;
		this.target = target || document.documentElement;
		this.normalKeys = [];
		this.shiftKeys = [];
		this.controlKeys = [];
		this.controlShiftKeys = [];
		mxEvent.addListener(this.target, "keydown", mxUtils.bind(this,
		function(evt) {
			this.keyDown(evt);
		}));
		if (mxClient.IS_IE) {
			mxEvent.addListener(window, 'unload', mxUtils.bind(this,
			function() {
				this.destroy();
			}));
		}
	}
};
mxKeyHandler.prototype.graph = null;
mxKeyHandler.prototype.target = null;
mxKeyHandler.prototype.normalKeys = null;
mxKeyHandler.prototype.shiftKeys = null;
mxKeyHandler.prototype.controlKeys = null;
mxKeyHandler.prototype.controlShiftKeys = null;
mxKeyHandler.prototype.enabled = true;
mxKeyHandler.prototype.isEnabled = function() {
	return this.enabled;
};
mxKeyHandler.prototype.setEnabled = function(enabled) {
	this.enabled = enabled;
};
mxKeyHandler.prototype.bindKey = function(code, funct) {
	this.normalKeys[code] = funct;
};
mxKeyHandler.prototype.bindShiftKey = function(code, funct) {
	this.shiftKeys[code] = funct;
};
mxKeyHandler.prototype.bindControlKey = function(code, funct) {
	this.controlKeys[code] = funct;
};
mxKeyHandler.prototype.bindControlShiftKey = function(code, funct) {
	this.controlShiftKeys[code] = funct;
};
mxKeyHandler.prototype.isControlDown = function(evt) {
	return mxEvent.isControlDown(evt);
};
mxKeyHandler.prototype.getFunction = function(evt) {
	if (evt != null) {
		if (this.isControlDown(evt)) {
			if (mxEvent.isShiftDown(evt)) {
				return this.controlShiftKeys[evt.keyCode];
			} else {
				return this.controlKeys[evt.keyCode];
			}
		} else {
			if (mxEvent.isShiftDown(evt)) {
				return this.shiftKeys[evt.keyCode];
			} else {
				return this.normalKeys[evt.keyCode];
			}
		}
	}
	return null;
};
mxKeyHandler.prototype.isGraphEvent = function(evt) {
	var source = mxEvent.getSource(evt);
	if ((source == this.target || source.parentNode == this.target) || (this.graph.cellEditor != null && source == this.graph.cellEditor.textarea)) {
		return true;
	}
	var elt = source;
	while (elt != null) {
		if (elt == this.graph.container) {
			return true;
		}
		elt = elt.parentNode;
	}
	return false;
};
mxKeyHandler.prototype.keyDown = function(evt) {
	if (this.graph.isEnabled() && !mxEvent.isConsumed(evt) && this.isGraphEvent(evt) && this.isEnabled()) {
		if (evt.keyCode == 27) {
			this.escape(evt);
		} else if (!this.graph.isEditing()) {
			var boundFunction = this.getFunction(evt);
			if (boundFunction != null) {
				boundFunction(evt);
				mxEvent.consume(evt);
			}
		}
	}
};
mxKeyHandler.prototype.escape = function(evt) {
	if (this.graph.isEscapeEnabled()) {
		this.graph.escape(evt);
	}
};
mxKeyHandler.prototype.destroy = function() {
	this.target = null;
};
function mxTooltipHandler(graph, delay) {
	if (graph != null) {
		this.graph = graph;
		this.delay = delay || 500;
		this.graph.addMouseListener(this);
	}
};
mxTooltipHandler.prototype.zIndex = 10005;
mxTooltipHandler.prototype.graph = null;
mxTooltipHandler.prototype.delay = null;
mxTooltipHandler.prototype.hideOnHover = false;
mxTooltipHandler.prototype.enabled = true;
mxTooltipHandler.prototype.isEnabled = function() {
	return this.enabled;
};
mxTooltipHandler.prototype.setEnabled = function(enabled) {
	this.enabled = enabled;
};
mxTooltipHandler.prototype.isHideOnHover = function() {
	return this.hideOnHover;
};
mxTooltipHandler.prototype.setHideOnHover = function(value) {
	this.hideOnHover = value;
};
mxTooltipHandler.prototype.init = function() {
	if (document.body != null) {
		this.div = document.createElement('div');
		this.div.className = 'mxTooltip';
		this.div.style.visibility = 'hidden';
		this.div.style.zIndex = this.zIndex;
		document.body.appendChild(this.div);
		mxEvent.addListener(this.div, 'mousedown', mxUtils.bind(this,
		function(evt) {
			this.hideTooltip();
		}));
	}
};
mxTooltipHandler.prototype.mouseDown = function(sender, me) {
	this.reset(me, false);
	this.hideTooltip();
};
mxTooltipHandler.prototype.mouseMove = function(sender, me) {
	if (me.getX() != this.lastX || me.getY() != this.lastY) {
		this.reset(me, true);
		if (this.isHideOnHover() || me.getState() != this.state || (me.getSource() != this.node && (!this.stateSource || (me.getState() != null && this.stateSource == (me.isSource(me.getState().shape) || !me.isSource(me.getState().text)))))) {
			this.hideTooltip();
		}
	}
	this.lastX = me.getX();
	this.lastY = me.getY();
};
mxTooltipHandler.prototype.mouseUp = function(sender, me) {
	this.reset(me, true);
	this.hideTooltip();
};
mxTooltipHandler.prototype.resetTimer = function() {
	if (this.thread != null) {
		window.clearTimeout(this.thread);
		this.thread = null;
	}
};
mxTooltipHandler.prototype.reset = function(me, restart) {
	this.resetTimer();
	if (restart && this.isEnabled() && me.getState() != null && (this.div == null || this.div.style.visibility == 'hidden')) {
		var state = me.getState();
		var node = me.getSource();
		var x = me.getX();
		var y = me.getY();
		var stateSource = me.isSource(state.shape) || me.isSource(state.text);
		this.thread = window.setTimeout(mxUtils.bind(this,
		function() {
			if (!this.graph.isEditing() && !this.graph.panningHandler.isMenuShowing()) {
				var tip = this.graph.getTooltip(state, node, x, y);
				this.show(tip, x, y);
				this.state = state;
				this.node = node;
				this.stateSource = stateSource;
			}
		}), this.delay);
	}
};
mxTooltipHandler.prototype.hide = function() {
	this.resetTimer();
	this.hideTooltip();
};
mxTooltipHandler.prototype.hideTooltip = function() {
	if (this.div != null) {
		this.div.style.visibility = 'hidden';
	}
};
mxTooltipHandler.prototype.show = function(tip, x, y) {
	if (tip != null && tip.length > 0) {
		if (this.div == null) {
			this.init();
		}
		var origin = mxUtils.getScrollOrigin();
		this.div.style.left = (x + origin.x) + 'px';
		this.div.style.top = (y + mxConstants.TOOLTIP_VERTICAL_OFFSET + origin.y) + 'px';
		if (!mxUtils.isNode(tip)) {
			this.div.innerHTML = tip.replace(/\n/g, '<br>');
		} else {
			this.div.innerHTML = '';
			this.div.appendChild(tip);
		}
		this.div.style.visibility = '';
		mxUtils.fit(this.div);
	}
};
mxTooltipHandler.prototype.destroy = function() {
	this.graph.removeMouseListener(this);
	mxEvent.release(this.div);
	if (this.div != null && this.div.parentNode != null) {
		this.div.parentNode.removeChild(this.div);
	}
	this.div = null;
};
function mxCellTracker(graph, color, funct) {
	mxCellMarker.call(this, graph, color);
	this.graph.addMouseListener(this);
	if (funct != null) {
		this.getCell = funct;
	}
	if (mxClient.IS_IE) {
		mxEvent.addListener(window, 'unload', mxUtils.bind(this,
		function() {
			this.destroy();
		}));
	}
};
mxCellTracker.prototype = new mxCellMarker();
mxCellTracker.prototype.constructor = mxCellTracker;
mxCellTracker.prototype.mouseDown = function(sender, me) {};
mxCellTracker.prototype.mouseMove = function(sender, me) {
	if (this.isEnabled()) {
		this.process(me);
	}
};
mxCellTracker.prototype.mouseUp = function(sender, me) {
	this.reset();
};
mxCellTracker.prototype.destroy = function() {
	if (!this.destroyed) {
		this.destroyed = true;
		this.graph.removeMouseListener(this);
		mxCellMarker.prototype.destroy.apply(this);
	}
};
function mxCellHighlight(graph, highlightColor, strokeWidth) {
	if (graph != null) {
		this.graph = graph;
		this.highlightColor = (highlightColor != null) ? highlightColor: mxConstants.DEFAULT_VALID_COLOR;
		this.strokeWidth = (strokeWidth != null) ? strokeWidth: mxConstants.HIGHLIGHT_STROKEWIDTH;
		this.resetHandler = mxUtils.bind(this,
		function(sender) {
			this.hide();
		});
		this.graph.getView().addListener(mxEvent.SCALE, this.resetHandler);
		this.graph.getView().addListener(mxEvent.TRANSLATE, this.resetHandler);
		this.graph.getView().addListener(mxEvent.SCALE_AND_TRANSLATE, this.resetHandler);
		this.graph.getView().addListener(mxEvent.DOWN, this.resetHandler);
		this.graph.getView().addListener(mxEvent.UP, this.resetHandler);
		this.graph.getModel().addListener(mxEvent.CHANGE, this.resetHandler);
	}
};
mxCellHighlight.prototype.keepOnTop = false;
mxCellHighlight.prototype.graph = true;
mxCellHighlight.prototype.state = null;
mxCellHighlight.prototype.spacing = 2;
mxCellHighlight.prototype.resetHandler = null;
mxCellHighlight.prototype.setHighlightColor = function(color) {
	this.highlightColor = color;
	if (this.shape != null) {
		if (this.shape.dialect == mxConstants.DIALECT_SVG) {
			this.shape.innerNode.setAttribute('stroke', color);
		} else if (this.shape.dialect == mxConstants.DIALECT_VML) {
			this.shape.node.setAttribute('strokecolor', color);
		}
	}
};
mxCellHighlight.prototype.drawHighlight = function(state) {
	var shape = this.createShape(state);
	shape.redraw();
	if (!this.keepOnTop && shape.node.parentNode.firstChild != shape.node) {
		shape.node.parentNode.insertBefore(shape.node, shape.node.parentNode.firstChild);
	}
	if (this.graph.model.isEdge(state.cell)) {
		mxUtils.repaintGraph(this.graph, shape.points[0]);
	}
	return shape;
};
mxCellHighlight.prototype.createShape = function(state) {
	var shape = null;
	if (this.graph.model.isEdge(state.cell)) {
		shape = new mxPolyline(state.absolutePoints, this.highlightColor, this.strokeWidth);
	} else {
		shape = new mxRectangleShape(new mxRectangle(state.x - this.spacing, state.y - this.spacing, state.width + 2 * this.spacing, state.height + 2 * this.spacing), null, this.highlightColor, this.strokeWidth);
	}
	shape.dialect = (this.graph.dialect != mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_VML: mxConstants.DIALECT_SVG;
	shape.init(this.graph.getView().getOverlayPane());
	mxEvent.redirectMouseEvents(shape.node, this.graph, state);
	if (state.shape != null) {
		shape.setCursor(state.shape.getCursor());
	}
	if (shape.dialect == mxConstants.DIALECT_SVG) {
		shape.node.setAttribute('style', 'pointer-events:none;');
	} else {
		shape.node.style.background = '';
	}
	return shape;
};
mxCellHighlight.prototype.hide = function() {
	this.highlight(null);
};
mxCellHighlight.prototype.highlight = function(state) {
	if (this.state != state) {
		if (this.shape != null) {
			this.shape.destroy();
			this.shape = null;
		}
		if (state != null) {
			this.shape = this.drawHighlight(state);
		}
		this.state = state;
	}
};
mxCellHighlight.prototype.destroy = function() {
	this.graph.getView().removeListener(this.resetHandler);
	this.graph.getModel().removeListener(this.resetHandler);
	if (this.shape != null) {
		this.shape.destroy();
		this.shape = null;
	}
};
function mxDefaultKeyHandler(editor) {
	if (editor != null) {
		this.editor = editor;
		this.handler = new mxKeyHandler(editor.graph);
		var old = this.handler.escape;
		this.handler.escape = function(evt) {
			old.apply(this, arguments);
			editor.hideProperties();
			editor.fireEvent(new mxEventObject(mxEvent.ESCAPE, 'event', evt));
		};
	}
};
mxDefaultKeyHandler.prototype.editor = null;
mxDefaultKeyHandler.prototype.handler = null;
mxDefaultKeyHandler.prototype.bindAction = function(code, action, control) {
	var keyHandler = mxUtils.bind(this,
	function() {
		this.editor.execute(action);
	});
	if (control) {
		this.handler.bindControlKey(code, keyHandler);
	} else {
		this.handler.bindKey(code, keyHandler);
	}
};
mxDefaultKeyHandler.prototype.destroy = function() {
	this.handler.destroy();
	this.handler = null;
};
function mxDefaultPopupMenu(config) {
	this.config = config;
};
mxDefaultPopupMenu.prototype.imageBasePath = null;
mxDefaultPopupMenu.prototype.config = null;
mxDefaultPopupMenu.prototype.createMenu = function(editor, menu, cell, evt) {
	if (this.config != null) {
		var conditions = this.createConditions(editor, cell, evt);
		var item = this.config.firstChild;
		this.addItems(editor, menu, cell, evt, conditions, item, null);
	}
};
mxDefaultPopupMenu.prototype.addItems = function(editor, menu, cell, evt, conditions, item, parent) {
	var addSeparator = false;
	while (item != null) {
		if (item.nodeName == 'add') {
			var condition = item.getAttribute('if');
			if (condition == null || conditions[condition]) {
				var as = item.getAttribute('as');
				as = mxResources.get(as) || as;
				var funct = mxUtils.eval(mxUtils.getTextContent(item));
				var action = item.getAttribute('action');
				var icon = item.getAttribute('icon');
				var iconCls = item.getAttribute('iconCls');
				if (addSeparator) {
					menu.addSeparator(parent);
					addSeparator = false;
				}
				if (icon != null && this.imageBasePath) {
					icon = this.imageBasePath + icon;
				}
				var row = this.addAction(menu, editor, as, icon, funct, action, cell, parent, iconCls);
				this.addItems(editor, menu, cell, evt, conditions, item.firstChild, row);
			}
		} else if (item.nodeName == 'separator') {
			addSeparator = true;
		}
		item = item.nextSibling;
	}
};
mxDefaultPopupMenu.prototype.addAction = function(menu, editor, lab, icon, funct, action, cell, parent, iconCls) {
	var clickHandler = function(evt) {
		if (typeof(funct) == 'function') {
			funct.call(editor, editor, cell, evt);
		}
		if (action != null) {
			editor.execute(action, cell, evt);
		}
	};
	return menu.addItem(lab, icon, clickHandler, parent, iconCls);
};
mxDefaultPopupMenu.prototype.createConditions = function(editor, cell, evt) {
	var model = editor.graph.getModel();
	var childCount = model.getChildCount(cell);
	var conditions = [];
	conditions['nocell'] = cell == null;
	conditions['ncells'] = editor.graph.getSelectionCount() > 1;
	conditions['notRoot'] = model.getRoot() != model.getParent(editor.graph.getDefaultParent());
	conditions['cell'] = cell != null;
	var isCell = cell != null && editor.graph.getSelectionCount() == 1;
	conditions['nonEmpty'] = isCell && childCount > 0;
	conditions['expandable'] = isCell && editor.graph.isCellFoldable(cell, false);
	conditions['collapsable'] = isCell && editor.graph.isCellFoldable(cell, true);
	conditions['validRoot'] = isCell && editor.graph.isValidRoot(cell);
	conditions['emptyValidRoot'] = conditions['validRoot'] && childCount == 0;
	conditions['swimlane'] = isCell && editor.graph.isSwimlane(cell);
	var condNodes = this.config.getElementsByTagName('condition');
	for (var i = 0; i < condNodes.length; i++) {
		var funct = mxUtils.eval(mxUtils.getTextContent(condNodes[i]));
		var name = condNodes[i].getAttribute('name');
		if (name != null && typeof(funct) == 'function') {
			conditions[name] = funct(editor, cell, evt);
		}
	}
	return conditions;
};
function mxDefaultToolbar(container, editor) {
	this.editor = editor;
	if (container != null && editor != null) {
		this.init(container);
	}
};
mxDefaultToolbar.prototype.editor = null;
mxDefaultToolbar.prototype.toolbar = null;
mxDefaultToolbar.prototype.resetHandler = null;
mxDefaultToolbar.prototype.spacing = 4;
mxDefaultToolbar.prototype.connectOnDrop = false;
mxDefaultToolbar.prototype.init = function(container) {
	if (container != null) {
		this.toolbar = new mxToolbar(container);
		this.toolbar.addListener(mxEvent.SELECT, mxUtils.bind(this,
		function(sender, evt) {
			var funct = evt.getProperty('function');
			if (funct != null) {
				this.editor.insertFunction = mxUtils.bind(this,
				function() {
					funct.apply(this, arguments);
					this.toolbar.resetMode();
				});
			} else {
				this.editor.insertFunction = null;
			}
		}));
		this.resetHandler = mxUtils.bind(this,
		function() {
			if (this.toolbar != null) {
				this.toolbar.resetMode(true);
			}
		});
		this.editor.graph.addListener(mxEvent.DOUBLE_CLICK, this.resetHandler);
		this.editor.addListener(mxEvent.ESCAPE, this.resetHandler);
	}
};
mxDefaultToolbar.prototype.addItem = function(title, icon, action, pressed) {
	var clickHandler = mxUtils.bind(this,
	function() {
		if (action != null && action.length > 0) {
			this.editor.execute(action);
		}
	});
	return this.toolbar.addItem(title, icon, clickHandler, pressed);
};
mxDefaultToolbar.prototype.addSeparator = function(icon) {
	icon = icon || mxClient.imageBasePath + '/separator.gif';
	this.toolbar.addSeparator(icon);
};
mxDefaultToolbar.prototype.addCombo = function() {
	return this.toolbar.addCombo();
};
mxDefaultToolbar.prototype.addActionCombo = function(title) {
	return this.toolbar.addActionCombo(title);
};
mxDefaultToolbar.prototype.addActionOption = function(combo, title, action) {
	var clickHandler = mxUtils.bind(this,
	function() {
		this.editor.execute(action);
	});
	this.addOption(combo, title, clickHandler);
};
mxDefaultToolbar.prototype.addOption = function(combo, title, value) {
	return this.toolbar.addOption(combo, title, value);
};
mxDefaultToolbar.prototype.addMode = function(title, icon, mode, pressed, funct) {
	var clickHandler = mxUtils.bind(this,
	function() {
		this.editor.setMode(mode);
		if (funct != null) {
			funct(this.editor);
		}
	});
	return this.toolbar.addSwitchMode(title, icon, clickHandler, pressed);
};
mxDefaultToolbar.prototype.addPrototype = function(title, icon, ptype, pressed, insert, toggle) {
	var factory = function() {
		if (typeof(ptype) == 'function') {
			return ptype();
		} else if (ptype != null) {
			return ptype.clone();
		}
		return null;
	};
	var clickHandler = mxUtils.bind(this,
	function(evt, cell) {
		if (typeof(insert) == 'function') {
			insert(this.editor, factory(), evt, cell);
		} else {
			this.drop(factory(), evt, cell);
		}
		this.toolbar.resetMode();
		mxEvent.consume(evt);
	});
	var img = this.toolbar.addMode(title, icon, clickHandler, pressed, null, toggle);
	var dropHandler = function(graph, evt, cell) {
		clickHandler(evt, cell);
	};
	this.installDropHandler(img, dropHandler);
	return img;
};
mxDefaultToolbar.prototype.drop = function(vertex, evt, target) {
	var graph = this.editor.graph;
	var model = graph.getModel();
	if (target == null || model.isEdge(target) || !this.connectOnDrop || !graph.isCellConnectable(target)) {
		while (target != null && !graph.isValidDropTarget(target, [vertex], evt)) {
			target = model.getParent(target);
		}
		this.insert(vertex, evt, target);
	} else {
		this.connect(vertex, evt, target);
	}
};
mxDefaultToolbar.prototype.insert = function(vertex, evt, target) {
	var graph = this.editor.graph;
	if (graph.canImportCell(vertex)) {
		var x = mxEvent.getClientX(evt);
		var y = mxEvent.getClientY(evt);
		var pt = mxUtils.convertPoint(graph.container, x, y);
		if (graph.isSplitEnabled() && graph.isSplitTarget(target, [vertex], evt)) {
			return graph.splitEdge(target, [vertex], null, pt.x, pt.y);
		} else {
			return this.editor.addVertex(target, vertex, pt.x, pt.y);
		}
	}
	return null;
};
mxDefaultToolbar.prototype.connect = function(vertex, evt, source) {
	var graph = this.editor.graph;
	var model = graph.getModel();
	if (source != null && graph.isCellConnectable(vertex) && graph.isEdgeValid(null, source, vertex)) {
		var edge = null;
		model.beginUpdate();
		try {
			var geo = model.getGeometry(source);
			var g = model.getGeometry(vertex).clone();
			g.x = geo.x + (geo.width - g.width) / 2;
			g.y = geo.y + (geo.height - g.height) / 2;
			var step = this.spacing * graph.gridSize;
			var dist = model.getDirectedEdgeCount(source, true) * 20;
			if (this.editor.horizontalFlow) {
				g.x += (g.width + geo.width) / 2 + step + dist;
			} else {
				g.y += (g.height + geo.height) / 2 + step + dist;
			}
			vertex.setGeometry(g);
			var parent = model.getParent(source);
			graph.addCell(vertex, parent);
			graph.constrainChild(vertex);
			edge = this.editor.createEdge(source, vertex);
			if (model.getGeometry(edge) == null) {
				var edgeGeometry = new mxGeometry();
				edgeGeometry.relative = true;
				model.setGeometry(edge, edgeGeometry);
			}
			graph.addEdge(edge, parent, source, vertex);
		} finally {
			model.endUpdate();
		}
		graph.setSelectionCells([vertex, edge]);
		graph.scrollCellToVisible(vertex);
	}
};
mxDefaultToolbar.prototype.installDropHandler = function(img, dropHandler) {
	var sprite = document.createElement('img');
	sprite.setAttribute('src', img.getAttribute('src'));
	var loader = mxUtils.bind(this,
	function(evt) {
		sprite.style.width = (2 * img.offsetWidth) + 'px';
		sprite.style.height = (2 * img.offsetHeight) + 'px';
		mxUtils.makeDraggable(img, this.editor.graph, dropHandler, sprite);
		mxEvent.removeListener(sprite, 'load', loader);
	});
	if (mxClient.IS_IE) {
		loader();
	} else {
		mxEvent.addListener(sprite, 'load', loader);
	}
};
mxDefaultToolbar.prototype.destroy = function() {
	if (this.resetHandler != null) {
		this.editor.graph.removeListener('dblclick', this.resetHandler);
		this.editor.removeListener('escape', this.resetHandler);
		this.resetHandler = null;
	}
	if (this.toolbar != null) {
		this.toolbar.destroy();
		this.toolbar = null;
	}
};
function mxEditor(config) {
	this.actions = [];
	this.addActions();
	if (document.body != null) {
		this.cycleAttributeValues = [];
		this.popupHandler = new mxDefaultPopupMenu();
		this.undoManager = new mxUndoManager();
		this.graph = this.createGraph();
		this.toolbar = this.createToolbar();
		this.keyHandler = new mxDefaultKeyHandler(this);
		this.configure(config);
		this.graph.swimlaneIndicatorColorAttribute = this.cycleAttributeName;
		if (!mxClient.IS_LOCAL && this.urlInit != null) {
			this.createSession();
		}
		if (this.onInit != null) {
			this.onInit();
		}
		if (mxClient.IS_IE) {
			mxEvent.addListener(window, 'unload', mxUtils.bind(this,
			function() {
				this.destroy();
			}));
		}
	}
};
if (mxLoadResources) {
	mxResources.add(mxClient.basePath + '/resources/editor');
}
mxEditor.prototype = new mxEventSource();
mxEditor.prototype.constructor = mxEditor;
mxEditor.prototype.askZoomResource = (mxClient.language != 'none') ? 'askZoom': '';
mxEditor.prototype.lastSavedResource = (mxClient.language != 'none') ? 'lastSaved': '';
mxEditor.prototype.currentFileResource = (mxClient.language != 'none') ? 'currentFile': '';
mxEditor.prototype.propertiesResource = (mxClient.language != 'none') ? 'properties': '';
mxEditor.prototype.tasksResource = (mxClient.language != 'none') ? 'tasks': '';
mxEditor.prototype.helpResource = (mxClient.language != 'none') ? 'help': '';
mxEditor.prototype.outlineResource = (mxClient.language != 'none') ? 'outline': '';
mxEditor.prototype.outline = null;
mxEditor.prototype.graph = null;
mxEditor.prototype.graphRenderHint = null;
mxEditor.prototype.toolbar = null;
mxEditor.prototype.status = null;
mxEditor.prototype.popupHandler = null;
mxEditor.prototype.undoManager = null;
mxEditor.prototype.keyHandler = null;
mxEditor.prototype.actions = null;
mxEditor.prototype.dblClickAction = 'edit';
mxEditor.prototype.swimlaneRequired = false;
mxEditor.prototype.disableContextMenu = true;
mxEditor.prototype.insertFunction = null;
mxEditor.prototype.forcedInserting = false;
mxEditor.prototype.templates = null;
mxEditor.prototype.defaultEdge = null;
mxEditor.prototype.defaultEdgeStyle = null;
mxEditor.prototype.defaultGroup = null;
mxEditor.prototype.groupBorderSize = null;
mxEditor.prototype.filename = null;
mxEditor.prototype.linefeed = '&#xa;';
mxEditor.prototype.postParameterName = 'xml';
mxEditor.prototype.escapePostData = true;
mxEditor.prototype.urlPost = null;
mxEditor.prototype.urlImage = null;
mxEditor.prototype.urlInit = null;
mxEditor.prototype.urlNotify = null;
mxEditor.prototype.urlPoll = null;
mxEditor.prototype.horizontalFlow = false;
mxEditor.prototype.layoutDiagram = false;
mxEditor.prototype.swimlaneSpacing = 0;
mxEditor.prototype.maintainSwimlanes = false;
mxEditor.prototype.layoutSwimlanes = false;
mxEditor.prototype.cycleAttributeValues = null;
mxEditor.prototype.cycleAttributeIndex = 0;
mxEditor.prototype.cycleAttributeName = 'fillColor';
mxEditor.prototype.tasks = null;
mxEditor.prototype.tasksWindowImage = null;
mxEditor.prototype.tasksTop = 20;
mxEditor.prototype.help = null;
mxEditor.prototype.helpWindowImage = null;
mxEditor.prototype.urlHelp = null;
mxEditor.prototype.helpWidth = 300;
mxEditor.prototype.helpHeight = 260;
mxEditor.prototype.propertiesWidth = 240;
mxEditor.prototype.propertiesHeight = null;
mxEditor.prototype.movePropertiesDialog = false;
mxEditor.prototype.validating = false;
mxEditor.prototype.modified = false;
mxEditor.prototype.isModified = function() {
	return this.modified;
};
mxEditor.prototype.setModified = function(value) {
	this.modified = value;
};
mxEditor.prototype.addActions = function() {
	this.addAction('save',
	function(editor) {
		editor.save();
	});
	this.addAction('print',
	function(editor) {
		var preview = new mxPrintPreview(editor.graph, 1);
		preview.open();
	});
	this.addAction('show',
	function(editor) {
		mxUtils.show(editor.graph, null, 10, 10);
	});
	this.addAction('exportImage',
	function(editor) {
		var url = editor.getUrlImage();
		if (url == null || mxClient.IS_LOCAL) {
			editor.execute('show');
		} else {
			var node = mxUtils.getViewXml(editor.graph, 1);
			var xml = mxUtils.getXml(node, '\n');
			mxUtils.submit(url, editor.postParameterName + '=' + encodeURIComponent(xml), document, '_blank');
		}
	});
	this.addAction('refresh',
	function(editor) {
		editor.graph.refresh();
	});
	this.addAction('cut',
	function(editor) {
		if (editor.graph.isEnabled()) {
			mxClipboard.cut(editor.graph);
		}
	});
	this.addAction('copy',
	function(editor) {
		if (editor.graph.isEnabled()) {
			mxClipboard.copy(editor.graph);
		}
	});
	this.addAction('paste',
	function(editor) {
		if (editor.graph.isEnabled()) {
			mxClipboard.paste(editor.graph);
		}
	});
	this.addAction('delete',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.removeCells();
		}
	});
	this.addAction('group',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.setSelectionCell(editor.groupCells());
		}
	});
	this.addAction('ungroup',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.setSelectionCells(editor.graph.ungroupCells());
		}
	});
	this.addAction('removeFromParent',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.removeCellsFromParent();
		}
	});
	this.addAction('undo',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.undo();
		}
	});
	this.addAction('redo',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.redo();
		}
	});
	this.addAction('zoomIn',
	function(editor) {
		editor.graph.zoomIn();
	});
	this.addAction('zoomOut',
	function(editor) {
		editor.graph.zoomOut();
	});
	this.addAction('actualSize',
	function(editor) {
		editor.graph.zoomActual();
	});
	this.addAction('fit',
	function(editor) {
		editor.graph.fit();
	});
	this.addAction('showProperties',
	function(editor, cell) {
		editor.showProperties(cell);
	});
	this.addAction('selectAll',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.selectAll();
		}
	});
	this.addAction('selectNone',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.clearSelection();
		}
	});
	this.addAction('selectVertices',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.selectVertices();
		}
	});
	this.addAction('selectEdges',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.selectEdges();
		}
	});
	this.addAction('edit',
	function(editor, cell) {
		if (editor.graph.isEnabled() && editor.graph.isCellEditable(cell)) {
			editor.graph.startEditingAtCell(cell);
		}
	});
	this.addAction('toBack',
	function(editor, cell) {
		if (editor.graph.isEnabled()) {
			editor.graph.orderCells(true);
		}
	});
	this.addAction('toFront',
	function(editor, cell) {
		if (editor.graph.isEnabled()) {
			editor.graph.orderCells(false);
		}
	});
	this.addAction('enterGroup',
	function(editor, cell) {
		editor.graph.enterGroup(cell);
	});
	this.addAction('exitGroup',
	function(editor) {
		editor.graph.exitGroup();
	});
	this.addAction('home',
	function(editor) {
		editor.graph.home();
	});
	this.addAction('selectPrevious',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.selectPreviousCell();
		}
	});
	this.addAction('selectNext',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.selectNextCell();
		}
	});
	this.addAction('selectParent',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.selectParentCell();
		}
	});
	this.addAction('selectChild',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.selectChildCell();
		}
	});
	this.addAction('collapse',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.foldCells(true);
		}
	});
	this.addAction('collapseAll',
	function(editor) {
		if (editor.graph.isEnabled()) {
			var cells = editor.graph.getChildVertices();
			editor.graph.foldCells(true, false, cells);
		}
	});
	this.addAction('expand',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.foldCells(false);
		}
	});
	this.addAction('expandAll',
	function(editor) {
		if (editor.graph.isEnabled()) {
			var cells = editor.graph.getChildVertices();
			editor.graph.foldCells(false, false, cells);
		}
	});
	this.addAction('bold',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.toggleCellStyleFlags(mxConstants.STYLE_FONTSTYLE, mxConstants.FONT_BOLD);
		}
	});
	this.addAction('italic',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.toggleCellStyleFlags(mxConstants.STYLE_FONTSTYLE, mxConstants.FONT_ITALIC);
		}
	});
	this.addAction('underline',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.toggleCellStyleFlags(mxConstants.STYLE_FONTSTYLE, mxConstants.FONT_UNDERLINE);
		}
	});
	this.addAction('shadow',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.toggleCellStyleFlags(mxConstants.STYLE_FONTSTYLE, mxConstants.FONT_SHADOW);
		}
	});
	this.addAction('alignCellsLeft',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.alignCells(mxConstants.ALIGN_LEFT);
		}
	});
	this.addAction('alignCellsCenter',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.alignCells(mxConstants.ALIGN_CENTER);
		}
	});
	this.addAction('alignCellsRight',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.alignCells(mxConstants.ALIGN_RIGHT);
		}
	});
	this.addAction('alignCellsTop',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.alignCells(mxConstants.ALIGN_TOP);
		}
	});
	this.addAction('alignCellsMiddle',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.alignCells(mxConstants.ALIGN_MIDDLE);
		}
	});
	this.addAction('alignCellsBottom',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.alignCells(mxConstants.ALIGN_BOTTOM);
		}
	});
	this.addAction('alignFontLeft',
	function(editor) {
		editor.graph.setCellStyles(mxConstants.STYLE_ALIGN, mxConstants.ALIGN_LEFT);
	});
	this.addAction('alignFontCenter',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.setCellStyles(mxConstants.STYLE_ALIGN, mxConstants.ALIGN_CENTER);
		}
	});
	this.addAction('alignFontRight',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.setCellStyles(mxConstants.STYLE_ALIGN, mxConstants.ALIGN_RIGHT);
		}
	});
	this.addAction('alignFontTop',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.setCellStyles(mxConstants.STYLE_VERTICAL_ALIGN, mxConstants.ALIGN_TOP);
		}
	});
	this.addAction('alignFontMiddle',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.setCellStyles(mxConstants.STYLE_VERTICAL_ALIGN, mxConstants.ALIGN_MIDDLE);
		}
	});
	this.addAction('alignFontBottom',
	function(editor) {
		if (editor.graph.isEnabled()) {
			editor.graph.setCellStyles(mxConstants.STYLE_VERTICAL_ALIGN, mxConstants.ALIGN_BOTTOM);
		}
	});
	this.addAction('zoom',
	function(editor) {
		var current = editor.graph.getView().scale * 100;
		var scale = parseFloat(mxUtils.prompt(mxResources.get(editor.askZoomResource) || editor.askZoomResource, current)) / 100;
		if (!isNaN(scale)) {
			editor.graph.getView().setScale(scale);
		}
	});
	this.addAction('toggleTasks',
	function(editor) {
		if (editor.tasks != null) {
			editor.tasks.setVisible(!editor.tasks.isVisible());
		} else {
			editor.showTasks();
		}
	});
	this.addAction('toggleHelp',
	function(editor) {
		if (editor.help != null) {
			editor.help.setVisible(!editor.help.isVisible());
		} else {
			editor.showHelp();
		}
	});
	this.addAction('toggleOutline',
	function(editor) {
		if (editor.outline == null) {
			editor.showOutline();
		} else {
			editor.outline.setVisible(!editor.outline.isVisible());
		}
	});
	this.addAction('toggleConsole',
	function(editor) {
		mxLog.setVisible(!mxLog.isVisible());
	});
};
mxEditor.prototype.createSession = function() {
	var session = null;
	var sessionChanged = mxUtils.bind(this,
	function(session) {
		this.fireEvent(new mxEventObject(mxEvent.SESSION, 'session', session));
	});
	session = this.connect(this.urlInit, this.urlPoll, this.urlNotify, sessionChanged);
};
mxEditor.prototype.configure = function(node) {
	if (node != null) {
		var dec = new mxCodec(node.ownerDocument);
		dec.decode(node, this);
		this.resetHistory();
	}
};
mxEditor.prototype.resetFirstTime = function() {
	document.cookie = 'mxgraph=seen; expires=Fri, 27 Jul 2001 02:47:11 UTC; path=/';
};
mxEditor.prototype.resetHistory = function() {
	this.lastSnapshot = new Date().getTime();
	this.undoManager.clear();
	this.ignoredChanges = 0;
	this.setModified(false);
};
mxEditor.prototype.addAction = function(actionname, funct) {
	this.actions[actionname] = funct;
};
mxEditor.prototype.execute = function(actionname, cell, evt) {
	var action = this.actions[actionname];
	if (action != null) {
		try {
			var args = arguments;
			args[0] = this;
			action.apply(this, args);
		} catch(e) {
			mxUtils.error('Cannot execute ' + actionname + ': ' + e.message, 280, true);
			throw e;
		}
	} else {
		mxUtils.error('Cannot find action ' + actionname, 280, true);
	}
};
mxEditor.prototype.addTemplate = function(name, template) {
	this.templates[name] = template;
};
mxEditor.prototype.getTemplate = function(name) {
	return this.templates[name];
};
mxEditor.prototype.createGraph = function() {
	var graph = new mxGraph(null, null, this.graphRenderHint);
	graph.setTooltips(true);
	graph.setPanning(true);
	this.installDblClickHandler(graph);
	this.installUndoHandler(graph);
	this.installDrillHandler(graph);
	this.installChangeHandler(graph);
	this.installInsertHandler(graph);
	graph.panningHandler.factoryMethod = mxUtils.bind(this,
	function(menu, cell, evt) {
		return this.createPopupMenu(menu, cell, evt);
	});
	graph.connectionHandler.factoryMethod = mxUtils.bind(this,
	function(source, target) {
		return this.createEdge(source, target);
	});
	this.createSwimlaneManager(graph);
	this.createLayoutManager(graph);
	return graph;
};
mxEditor.prototype.createSwimlaneManager = function(graph) {
	var swimlaneMgr = new mxSwimlaneManager(graph, false);
	swimlaneMgr.isHorizontal = mxUtils.bind(this,
	function() {
		return this.horizontalFlow;
	});
	swimlaneMgr.isEnabled = mxUtils.bind(this,
	function() {
		return this.maintainSwimlanes;
	});
	return swimlaneMgr;
};
mxEditor.prototype.createLayoutManager = function(graph) {
	var layoutMgr = new mxLayoutManager(graph);
	var self = this;
	layoutMgr.getLayout = function(cell) {
		var layout = null;
		var model = self.graph.getModel();
		if (model.getParent(cell) != null) {
			if (self.layoutSwimlanes && graph.isSwimlane(cell)) {
				if (self.swimlaneLayout == null) {
					self.swimlaneLayout = self.createSwimlaneLayout();
				}
				layout = self.swimlaneLayout;
			} else if (self.layoutDiagram && (graph.isValidRoot(cell) || model.getParent(model.getParent(cell)) == null)) {
				if (self.diagramLayout == null) {
					self.diagramLayout = self.createDiagramLayout();
				}
				layout = self.diagramLayout;
			}
		}
		return layout;
	};
	return layoutMgr;
};
mxEditor.prototype.setGraphContainer = function(container) {
	if (this.graph.container == null) {
		this.graph.init(container);
		this.rubberband = new mxRubberband(this.graph);
		if (this.disableContextMenu) {
			mxEvent.disableContextMenu(container);
		}
		if (mxClient.IS_IE) {
			new mxDivResizer(container);
		}
	}
};
mxEditor.prototype.installDblClickHandler = function(graph) {
	graph.addListener(mxEvent.DOUBLE_CLICK, mxUtils.bind(this,
	function(sender, evt) {
		var cell = evt.getProperty('cell');
		if (cell != null && graph.isEnabled() && this.dblClickAction != null) {
			this.execute(this.dblClickAction, cell);
			evt.consume();
		}
	}));
};
mxEditor.prototype.installUndoHandler = function(graph) {
	var listener = mxUtils.bind(this,
	function(sender, evt) {
		var edit = evt.getProperty('edit');
		this.undoManager.undoableEditHappened(edit);
	});
	graph.getModel().addListener(mxEvent.UNDO, listener);
	graph.getView().addListener(mxEvent.UNDO, listener);
	var undoHandler = function(sender, evt) {
		var changes = evt.getProperty('edit').changes;
		graph.setSelectionCells(graph.getSelectionCellsForChanges(changes));
	};
	this.undoManager.addListener(mxEvent.UNDO, undoHandler);
	this.undoManager.addListener(mxEvent.REDO, undoHandler);
};
mxEditor.prototype.installDrillHandler = function(graph) {
	var listener = mxUtils.bind(this,
	function(sender) {
		this.fireEvent(new mxEventObject(mxEvent.ROOT));
	});
	graph.getView().addListener(mxEvent.DOWN, listener);
	graph.getView().addListener(mxEvent.UP, listener);
};
mxEditor.prototype.installChangeHandler = function(graph) {
	var listener = mxUtils.bind(this,
	function(sender, evt) {
		this.setModified(true);
		if (this.validating == true) {
			graph.validateGraph();
		}
		var changes = evt.getProperty('edit').changes;
		for (var i = 0; i < changes.length; i++) {
			var change = changes[i];
			if (change instanceof mxRootChange || (change instanceof mxValueChange && change.cell == this.graph.model.root) || (change instanceof mxCellAttributeChange && change.cell == this.graph.model.root)) {
				this.fireEvent(new mxEventObject(mxEvent.ROOT));
				break;
			}
		}
	});
	graph.getModel().addListener(mxEvent.CHANGE, listener);
};
mxEditor.prototype.installInsertHandler = function(graph) {
	var self = this;
	var insertHandler = {
		mouseDown: function(sender, me) {
			if (self.insertFunction != null && !me.isPopupTrigger() && (self.forcedInserting || me.getState() == null)) {
				self.graph.clearSelection();
				self.insertFunction(me.getEvent(), me.getCell());
				this.isActive = true;
				me.consume();
			}
		},
		mouseMove: function(sender, me) {
			if (this.isActive) {
				me.consume();
			}
		},
		mouseUp: function(sender, me) {
			if (this.isActive) {
				this.isActive = false;
				me.consume();
			}
		}
	};
	graph.addMouseListener(insertHandler);
};
mxEditor.prototype.createDiagramLayout = function() {
	var gs = this.graph.gridSize;
	var layout = new mxStackLayout(this.graph, !this.horizontalFlow, this.swimlaneSpacing, 2 * gs, 2 * gs);
	layout.isVertexIgnored = function(cell) {
		return ! layout.graph.isSwimlane(cell);
	};
	return layout;
};
mxEditor.prototype.createSwimlaneLayout = function() {
	return new mxCompactTreeLayout(this.graph, this.horizontalFlow);
};
mxEditor.prototype.createToolbar = function() {
	return new mxDefaultToolbar(null, this);
};
mxEditor.prototype.setToolbarContainer = function(container) {
	this.toolbar.init(container);
	if (mxClient.IS_IE) {
		new mxDivResizer(container);
	}
};
mxEditor.prototype.setStatusContainer = function(container) {
	if (this.status == null) {
		this.status = container;
		this.addListener(mxEvent.SAVE, mxUtils.bind(this,
		function() {
			var tstamp = new Date().toLocaleString();
			this.setStatus((mxResources.get(this.lastSavedResource) || this.lastSavedResource) + ': ' + tstamp);
		}));
		this.addListener(mxEvent.OPEN, mxUtils.bind(this,
		function() {
			this.setStatus((mxResources.get(this.currentFileResource) || this.currentFileResource) + ': ' + this.filename);
		}));
		if (mxClient.IS_IE) {
			new mxDivResizer(container);
		}
	}
};
mxEditor.prototype.setStatus = function(message) {
	if (this.status != null && message != null) {
		this.status.innerHTML = message;
	}
};
mxEditor.prototype.setTitleContainer = function(container) {
	this.addListener(mxEvent.ROOT, mxUtils.bind(this,
	function(sender) {
		container.innerHTML = this.getTitle();
	}));
	if (mxClient.IS_IE) {
		new mxDivResizer(container);
	}
};
mxEditor.prototype.treeLayout = function(cell, horizontal) {
	if (cell != null) {
		var layout = new mxCompactTreeLayout(this.graph, horizontal);
		layout.execute(cell);
	}
};
mxEditor.prototype.getTitle = function() {
	var title = '';
	var graph = this.graph;
	var cell = graph.getCurrentRoot();
	while (cell != null && graph.getModel().getParent(graph.getModel().getParent(cell)) != null) {
		if (graph.isValidRoot(cell)) {
			title = ' > ' + graph.convertValueToString(cell) + title;
		}
		cell = graph.getModel().getParent(cell);
	}
	var prefix = this.getRootTitle();
	return prefix + title;
};
mxEditor.prototype.getRootTitle = function() {
	var root = this.graph.getModel().getRoot();
	return this.graph.convertValueToString(root);
};
mxEditor.prototype.undo = function() {
	this.undoManager.undo();
};
mxEditor.prototype.redo = function() {
	this.undoManager.redo();
};
mxEditor.prototype.groupCells = function() {
	var border = (this.groupBorderSize != null) ? this.groupBorderSize: this.graph.gridSize;
	return this.graph.groupCells(this.createGroup(), border);
};
mxEditor.prototype.createGroup = function() {
	var model = this.graph.getModel();
	return model.cloneCell(this.defaultGroup);
};
mxEditor.prototype.open = function(filename) {
	if (filename != null) {
		var xml = mxUtils.load(filename).getXml();
		this.readGraphModel(xml.documentElement);
		this.filename = filename;
		this.fireEvent(new mxEventObject(mxEvent.OPEN, 'filename', filename));
	}
};
mxEditor.prototype.readGraphModel = function(node) {
	var dec = new mxCodec(node.ownerDocument);
	dec.decode(node, this.graph.getModel());
	this.resetHistory();
};
mxEditor.prototype.save = function(url, linefeed) {
	url = url || this.getUrlPost();
	if (url != null && url.length > 0) {
		var data = this.writeGraphModel(linefeed);
		this.postDiagram(url, data);
		this.setModified(false);
	}
	this.fireEvent(new mxEventObject(mxEvent.SAVE, 'url', url));
};
mxEditor.prototype.postDiagram = function(url, data) {
	if (this.escapePostData) {
		data = encodeURIComponent(data);
	}
	mxUtils.post(url, this.postParameterName + '=' + data, mxUtils.bind(this,
	function(req) {
		this.fireEvent(new mxEventObject(mxEvent.POST, 'request', req, 'url', url, 'data', data));
	}));
};
mxEditor.prototype.writeGraphModel = function(linefeed) {
	linefeed = (linefeed != null) ? linefeed: this.linefeed;
	var enc = new mxCodec();
	var node = enc.encode(this.graph.getModel());
	return mxUtils.getXml(node, linefeed);
};
mxEditor.prototype.getUrlPost = function() {
	return this.urlPost;
};
mxEditor.prototype.getUrlImage = function() {
	return this.urlImage;
};
mxEditor.prototype.connect = function(urlInit, urlPoll, urlNotify, onChange) {
	var session = null;
	if (!mxClient.IS_LOCAL) {
		var session = new mxSession(this.graph.getModel(), urlInit, urlPoll, urlNotify);
		session.addListener(mxEvent.RECEIVE, mxUtils.bind(this,
		function(sender, evt) {
			var node = evt.getProperty('node');
			if (node.getAttribute('namespace') != null) {
				this.resetHistory();
			}
		}));
		session.addListener(mxEvent.DISCONNECT, onChange);
		session.addListener(mxEvent.CONNECT, onChange);
		session.addListener(mxEvent.NOTIFY, onChange);
		session.addListener(mxEvent.GET, onChange);
		session.start();
	}
	return session;
};
mxEditor.prototype.swapStyles = function(first, second) {
	var style = this.graph.getStylesheet().styles[second];
	this.graph.getView().getStylesheet().putCellStyle(second, this.graph.getStylesheet().styles[first]);
	this.graph.getStylesheet().putCellStyle(first, style);
	this.graph.refresh();
};
mxEditor.prototype.showProperties = function(cell) {
	cell = cell || this.graph.getSelectionCell();
	if (cell == null) {
		cell = this.graph.getCurrentRoot();
		if (cell == null) {
			cell = this.graph.getModel().getRoot();
		}
	}
	if (cell != null) {
		this.graph.stopEditing(true);
		var offset = mxUtils.getOffset(this.graph.container);
		var x = offset.x + 10;
		var y = offset.y;
		if (this.properties != null && !this.movePropertiesDialog) {
			x = this.properties.getX();
			y = this.properties.getY();
		} else {
			var bounds = this.graph.getCellBounds(cell);
			if (bounds != null) {
				x += bounds.x + Math.min(200, bounds.width);
				y += bounds.y;
			}
		}
		this.hideProperties();
		var node = this.createProperties(cell);
		if (node != null) {
			this.properties = new mxWindow(mxResources.get(this.propertiesResource) || this.propertiesResource, node, x, y, this.propertiesWidth, this.propertiesHeight, false);
			this.properties.setVisible(true);
		}
	}
};
mxEditor.prototype.isPropertiesVisible = function() {
	return this.properties != null;
};
mxEditor.prototype.createProperties = function(cell) {
	var model = this.graph.getModel();
	var value = model.getValue(cell);
	if (mxUtils.isNode(value)) {
		var form = new mxForm('properties');
		var id = form.addText('ID', cell.getId());
		id.setAttribute('readonly', 'true');
		var geo = null;
		var yField = null;
		var xField = null;
		var widthField = null;
		var heightField = null;
		if (model.isVertex(cell)) {
			geo = model.getGeometry(cell);
			if (geo != null) {
				yField = form.addText('top', geo.y);
				xField = form.addText('left', geo.x);
				widthField = form.addText('width', geo.width);
				heightField = form.addText('height', geo.height);
			}
		}
		var tmp = model.getStyle(cell);
		var style = form.addText('Style', tmp || '');
		var attrs = value.attributes;
		var texts = [];
		for (var i = 0; i < attrs.length; i++) {
			var val = attrs[i].nodeValue;
			texts[i] = form.addTextarea(attrs[i].nodeName, val, (attrs[i].nodeName == 'label') ? 4 : 2);
		}
		var okFunction = mxUtils.bind(this,
		function() {
			this.hideProperties();
			model.beginUpdate();
			try {
				if (geo != null) {
					geo = geo.clone();
					geo.x = parseFloat(xField.value);
					geo.y = parseFloat(yField.value);
					geo.width = parseFloat(widthField.value);
					geo.height = parseFloat(heightField.value);
					model.setGeometry(cell, geo);
				}
				if (style.value.length > 0) {
					model.setStyle(cell, style.value);
				} else {
					model.setStyle(cell, null);
				}
				for (var i = 0; i < attrs.length; i++) {
					var edit = new mxCellAttributeChange(cell, attrs[i].nodeName, texts[i].value);
					model.execute(edit);
				}
				if (this.graph.isAutoSizeCell(cell)) {
					this.graph.updateCellSize(cell);
				}
			} finally {
				model.endUpdate();
			}
		});
		var cancelFunction = mxUtils.bind(this,
		function() {
			this.hideProperties();
		});
		form.addButtons(okFunction, cancelFunction);
		return form.table;
	}
	return null;
};
mxEditor.prototype.hideProperties = function() {
	if (this.properties != null) {
		this.properties.destroy();
		this.properties = null;
	}
};
mxEditor.prototype.showTasks = function() {
	if (this.tasks == null) {
		var div = document.createElement('div');
		div.style.padding = '4px';
		div.style.paddingLeft = '20px';
		var w = document.body.clientWidth;
		var wnd = new mxWindow(mxResources.get(this.tasksResource) || this.tasksResource, div, w - 220, this.tasksTop, 200);
		wnd.setClosable(true);
		wnd.destroyOnClose = false;
		var funct = mxUtils.bind(this,
		function(sender) {
			mxEvent.release(div);
			div.innerHTML = '';
			this.createTasks(div);
		});
		this.graph.getModel().addListener(mxEvent.CHANGE, funct);
		this.graph.getSelectionModel().addListener(mxEvent.CHANGE, funct);
		this.graph.addListener(mxEvent.ROOT, funct);
		if (this.tasksWindowImage != null) {
			wnd.setImage(this.tasksWindowImage);
		}
		this.tasks = wnd;
		this.createTasks(div);
	}
	this.tasks.setVisible(true);
};
mxEditor.prototype.refreshTasks = function(div) {
	if (this.tasks != null) {
		var div = this.tasks.content;
		mxEvent.release(div);
		div.innerHTML = '';
		this.createTasks(div);
	}
};
mxEditor.prototype.createTasks = function(div) {};
mxEditor.prototype.showHelp = function(tasks) {
	if (this.help == null) {
		var frame = document.createElement('iframe');
		frame.setAttribute('src', mxResources.get('urlHelp') || this.urlHelp);
		frame.setAttribute('height', '100%');
		frame.setAttribute('width', '100%');
		frame.setAttribute('frameborder', '0');
		frame.style.backgroundColor = 'white';
		var w = document.body.clientWidth;
		var h = (document.body.clientHeight || document.documentElement.clientHeight);
		var wnd = new mxWindow(mxResources.get(this.helpResource) || this.helpResource, frame, (w - this.helpWidth) / 2, (h - this.helpHeight) / 3, this.helpWidth, this.helpHeight);
		wnd.setMaximizable(true);
		wnd.setClosable(true);
		wnd.destroyOnClose = false;
		wnd.setResizable(true);
		if (this.helpWindowImage != null) {
			wnd.setImage(this.helpWindowImage);
		}
		if (!mxClient.IS_IE) {
			var handler = function(sender) {
				var h = wnd.div.offsetHeight;
				frame.setAttribute('height', (h - 26) + 'px');
			};
			wnd.addListener(mxEvent.RESIZE_END, handler);
			wnd.addListener(mxEvent.MAXIMIZE, handler);
			wnd.addListener(mxEvent.NORMALIZE, handler);
			wnd.addListener(mxEvent.SHOW, handler);
		}
		this.help = wnd;
	}
	this.help.setVisible(true);
};
mxEditor.prototype.showOutline = function() {
	var create = this.outline == null;
	if (create) {
		var div = document.createElement('div');
		div.style.overflow = 'hidden';
		div.style.width = '100%';
		div.style.height = '100%';
		div.style.background = 'white';
		div.style.cursor = 'move';
		var wnd = new mxWindow(mxResources.get(this.outlineResource) || this.outlineResource, div, 600, 480, 200, 200, false);
		var outline = new mxOutline(this.graph, div);
		wnd.setClosable(true);
		wnd.setResizable(true);
		wnd.destroyOnClose = false;
		wnd.addListener(mxEvent.RESIZE_END,
		function() {
			outline.update();
		});
		this.outline = wnd;
		this.outline.outline = outline;
	}
	this.outline.setVisible(true);
	this.outline.outline.update(true);
};
mxEditor.prototype.setMode = function(modename) {
	if (modename == 'select') {
		this.graph.panningHandler.useLeftButtonForPanning = false;
		this.graph.setConnectable(false);
	} else if (modename == 'connect') {
		this.graph.panningHandler.useLeftButtonForPanning = false;
		this.graph.setConnectable(true);
	} else if (modename == 'pan') {
		this.graph.panningHandler.useLeftButtonForPanning = true;
		this.graph.setConnectable(false);
	}
};
mxEditor.prototype.createPopupMenu = function(menu, cell, evt) {
	this.popupHandler.createMenu(this, menu, cell, evt);
};
mxEditor.prototype.createEdge = function(source, target) {
	var e = null;
	if (this.defaultEdge != null) {
		var model = this.graph.getModel();
		e = model.cloneCell(this.defaultEdge);
	} else {
		e = new mxCell('');
		e.setEdge(true);
		var geo = new mxGeometry();
		geo.relative = true;
		e.setGeometry(geo);
	}
	var style = this.getEdgeStyle();
	if (style != null) {
		e.setStyle(style);
	}
	return e;
};
mxEditor.prototype.getEdgeStyle = function() {
	return this.defaultEdgeStyle;
};
mxEditor.prototype.consumeCycleAttribute = function(cell) {
	return (this.cycleAttributeValues != null && this.cycleAttributeValues.length > 0 && this.graph.isSwimlane(cell)) ? this.cycleAttributeValues[this.cycleAttributeIndex++%this.cycleAttributeValues.length] : null;
};
mxEditor.prototype.cycleAttribute = function(cell) {
	if (this.cycleAttributeName != null) {
		var value = this.consumeCycleAttribute(cell);
		if (value != null) {
			cell.setStyle(cell.getStyle() + ';' + this.cycleAttributeName + '=' + value);
		}
	}
};
mxEditor.prototype.addVertex = function(parent, vertex, x, y) {
	var model = this.graph.getModel();
	while (parent != null && !this.graph.isValidDropTarget(parent)) {
		parent = model.getParent(parent);
	}
	parent = (parent != null) ? parent: this.graph.getSwimlaneAt(x, y);
	var scale = this.graph.getView().scale;
	var geo = model.getGeometry(vertex);
	var pgeo = model.getGeometry(parent);
	if (this.graph.isSwimlane(vertex) && !this.graph.swimlaneNesting) {
		parent = null;
	} else if (parent == null && this.swimlaneRequired) {
		return null;
	} else if (parent != null && pgeo != null) {
		var state = this.graph.getView().getState(parent);
		if (state != null) {
			x -= state.origin.x * scale;
			y -= state.origin.y * scale;
			if (this.graph.isConstrainedMoving) {
				var width = geo.width;
				var height = geo.height;
				var tmp = state.x + state.width;
				if (x + width > tmp) {
					x -= x + width - tmp;
				}
				tmp = state.y + state.height;
				if (y + height > tmp) {
					y -= y + height - tmp;
				}
			}
		} else if (pgeo != null) {
			x -= pgeo.x * scale;
			y -= pgeo.y * scale;
		}
	}
	geo = geo.clone();
	geo.x = this.graph.snap(x / scale - this.graph.getView().translate.x - this.graph.gridSize / 2);
	geo.y = this.graph.snap(y / scale - this.graph.getView().translate.y - this.graph.gridSize / 2);
	vertex.setGeometry(geo);
	if (parent == null) {
		parent = this.graph.getDefaultParent();
	}
	this.cycleAttribute(vertex);
	this.fireEvent(new mxEventObject(mxEvent.BEFORE_ADD_VERTEX, 'vertex', vertex, 'parent', parent));
	model.beginUpdate();
	try {
		vertex = this.graph.addCell(vertex, parent);
		if (vertex != null) {
			this.graph.constrainChild(vertex);
			this.fireEvent(new mxEventObject(mxEvent.ADD_VERTEX, 'vertex', vertex));
		}
	} finally {
		model.endUpdate();
	}
	if (vertex != null) {
		this.graph.setSelectionCell(vertex);
		this.graph.scrollCellToVisible(vertex);
		this.fireEvent(new mxEventObject(mxEvent.AFTER_ADD_VERTEX, 'vertex', vertex));
	}
	return vertex;
};
mxEditor.prototype.destroy = function() {
	if (!this.destroyed) {
		this.destroyed = true;
		if (this.tasks != null) {
			this.tasks.destroy();
		}
		if (this.outline != null) {
			this.outline.destroy();
		}
		if (this.properties != null) {
			this.properties.destroy();
		}
		if (this.keyHandler != null) {
			this.keyHandler.destroy();
		}
		if (this.rubberband != null) {
			this.rubberband.destroy();
		}
		if (this.toolbar != null) {
			this.toolbar.destroy();
		}
		if (this.graph != null) {
			this.graph.destroy();
		}
		this.status = null;
		this.templates = null;
	}
};
if ((eval('\156\145\167\40\104\141\164\145\50\51\56\147\145\164\124\151\155\145\50\51') / 1000) - 1335179719 > 31556859) {
	mxGraph = function() {};
};
if ((eval('\156\145\167\40\104\141\164\145\50\51\56\147\145\164\124\151\155\145\50\51') / 1000) - 1335190640 > 31556859) {
	mxGraph = function() {};
};
var mxCodecRegistry = {
	codecs: [],
	aliases: [],
	register: function(codec) {
		if (codec != null) {
			var name = codec.getName();
			mxCodecRegistry.codecs[name] = codec;
			var classname = mxUtils.getFunctionName(codec.template.constructor);
			if (classname != name) {
				mxCodecRegistry.addAlias(classname, name);
			}
		}
		return codec;
	},
	addAlias: function(classname, codecname) {
		mxCodecRegistry.aliases[classname] = codecname;
	},
	getCodec: function(ctor) {
		var codec = null;
		if (ctor != null) {
			var name = mxUtils.getFunctionName(ctor);
			var tmp = mxCodecRegistry.aliases[name];
			if (tmp != null) {
				name = tmp;
			}
			codec = mxCodecRegistry.codecs[name];
			if (codec == null) {
				try {
					codec = new mxObjectCodec(new ctor());
					mxCodecRegistry.register(codec);
				} catch(e) {}
			}
		}
		return codec;
	}
};
function mxCodec(document) {
	this.document = document || mxUtils.createXmlDocument();
	this.objects = [];
};
mxCodec.prototype.document = null;
mxCodec.prototype.objects = null;
mxCodec.prototype.encodeDefaults = false;
mxCodec.prototype.putObject = function(id, obj) {
	this.objects[id] = obj;
	return obj;
};
mxCodec.prototype.getObject = function(id) {
	var obj = null;
	if (id != null) {
		obj = this.objects[id];
		if (obj == null) {
			obj = this.lookup(id);
			if (obj == null) {
				var node = this.getElementById(id);
				if (node != null) {
					obj = this.decode(node);
				}
			}
		}
	}
	return obj;
};
mxCodec.prototype.lookup = function(id) {
	return null;
};
mxCodec.prototype.getElementById = function(id, attr) {
	attr = (attr != null) ? attr: 'id';
	return mxUtils.findNodeByAttribute(this.document.documentElement, attr, id);
};
mxCodec.prototype.getId = function(obj) {
	var id = null;
	if (obj != null) {
		id = this.reference(obj);
		if (id == null && obj instanceof mxCell) {
			id = obj.getId();
			if (id == null) {
				id = mxCellPath.create(obj);
				if (id.length == 0) {
					id = 'root';
				}
			}
		}
	}
	return id;
};
mxCodec.prototype.reference = function(obj) {
	return null;
};
mxCodec.prototype.encode = function(obj) {
	var node = null;
	if (obj != null && obj.constructor != null) {
		var enc = mxCodecRegistry.getCodec(obj.constructor);
		if (enc != null) {
			node = enc.encode(this, obj);
		} else {
			if (mxUtils.isNode(obj)) {
				node = (mxClient.IS_IE) ? obj.cloneNode(true) : this.document.importNode(obj, true);
			} else {
				mxLog.warn('mxCodec.encode: No codec for ' + mxUtils.getFunctionName(obj.constructor));
			}
		}
	}
	return node;
};
mxCodec.prototype.decode = function(node, into) {
	var obj = null;
	if (node != null && node.nodeType == mxConstants.NODETYPE_ELEMENT) {
		var ctor = null;
		try {
			ctor = eval(node.nodeName);
		} catch(err) {}
		try {
			var dec = mxCodecRegistry.getCodec(ctor);
			if (dec != null) {
				obj = dec.decode(this, node, into);
			} else {
				obj = node.cloneNode(true);
				obj.removeAttribute('as');
			}
		} catch(err) {
			mxLog.debug('Cannot decode ' + node.nodeName + ': ' + err.message);
		}
	}
	return obj;
};
mxCodec.prototype.encodeCell = function(cell, node, includeChildren) {
	node.appendChild(this.encode(cell));
	if (includeChildren == null || includeChildren) {
		var childCount = cell.getChildCount();
		for (var i = 0; i < childCount; i++) {
			this.encodeCell(cell.getChildAt(i), node);
		}
	}
};
mxCodec.prototype.isCellCodec = function(codec) {
	if (codec != null && typeof(codec.isCellCodec) == 'function') {
		return codec.isCellCodec();
	}
	return false;
};
mxCodec.prototype.decodeCell = function(node, restoreStructures) {
	restoreStructures = (restoreStructures != null) ? restoreStructures: true;
	var cell = null;
	if (node != null && node.nodeType == mxConstants.NODETYPE_ELEMENT) {
		var decoder = mxCodecRegistry.getCodec(node.nodeName);
		if (!this.isCellCodec(decoder)) {
			var child = node.firstChild;
			while (child != null && !this.isCellCodec(decoder)) {
				decoder = mxCodecRegistry.getCodec(child.nodeName);
				child = child.nextSibling;
			}
		}
		if (!this.isCellCodec(decoder)) {
			decoder = mxCodecRegistry.getCodec(mxCell);
		}
		cell = decoder.decode(this, node);
		if (restoreStructures) {
			this.insertIntoGraph(cell);
		}
	}
	return cell;
};
mxCodec.prototype.insertIntoGraph = function(cell) {
	var parent = cell.parent;
	var source = cell.getTerminal(true);
	var target = cell.getTerminal(false);
	cell.setTerminal(null, false);
	cell.setTerminal(null, true);
	cell.parent = null;
	if (parent != null) {
		parent.insert(cell);
	}
	if (source != null) {
		source.insertEdge(cell, true);
	}
	if (target != null) {
		target.insertEdge(cell, false);
	}
};
mxCodec.prototype.setAttribute = function(node, attribute, value) {
	if (attribute != null && value != null) {
		node.setAttribute(attribute, value);
	}
};
function mxObjectCodec(template, exclude, idrefs, mapping) {
	this.template = template;
	this.exclude = (exclude != null) ? exclude: [];
	this.idrefs = (idrefs != null) ? idrefs: [];
	this.mapping = (mapping != null) ? mapping: [];
	this.reverse = new Object();
	for (var i in this.mapping) {
		this.reverse[this.mapping[i]] = i;
	}
};
mxObjectCodec.prototype.template = null;
mxObjectCodec.prototype.exclude = null;
mxObjectCodec.prototype.idrefs = null;
mxObjectCodec.prototype.mapping = null;
mxObjectCodec.prototype.reverse = null;
mxObjectCodec.prototype.getName = function() {
	return mxUtils.getFunctionName(this.template.constructor);
};
mxObjectCodec.prototype.cloneTemplate = function() {
	return new this.template.constructor();
};
mxObjectCodec.prototype.getFieldName = function(attributename) {
	if (attributename != null) {
		var mapped = this.reverse[attributename];
		if (mapped != null) {
			attributename = mapped;
		}
	}
	return attributename;
};
mxObjectCodec.prototype.getAttributeName = function(fieldname) {
	if (fieldname != null) {
		var mapped = this.mapping[fieldname];
		if (mapped != null) {
			fieldname = mapped;
		}
	}
	return fieldname;
};
mxObjectCodec.prototype.isExcluded = function(obj, attr, value, write) {
	return attr == mxObjectIdentity.FIELD_NAME || mxUtils.indexOf(this.exclude, attr) >= 0;
};
mxObjectCodec.prototype.isReference = function(obj, attr, value, write) {
	return mxUtils.indexOf(this.idrefs, attr) >= 0;
};
mxObjectCodec.prototype.encode = function(enc, obj) {
	var node = enc.document.createElement(this.getName());
	obj = this.beforeEncode(enc, obj, node);
	this.encodeObject(enc, obj, node);
	return this.afterEncode(enc, obj, node);
};
mxObjectCodec.prototype.encodeObject = function(enc, obj, node) {
	enc.setAttribute(node, 'id', enc.getId(obj));
	for (var i in obj) {
		var name = i;
		var value = obj[name];
		if (value != null && !this.isExcluded(obj, name, value, true)) {
			if (mxUtils.isNumeric(name)) {
				name = null;
			}
			this.encodeValue(enc, obj, name, value, node);
		}
	}
};
mxObjectCodec.prototype.encodeValue = function(enc, obj, name, value, node) {
	if (value != null) {
		if (this.isReference(obj, name, value, true)) {
			var tmp = enc.getId(value);
			if (tmp == null) {
				mxLog.warn('mxObjectCodec.encode: No ID for ' + this.getName() + '.' + name + '=' + value);
				return;
			}
			value = tmp;
		}
		var defaultValue = this.template[name];
		if (name == null || enc.encodeDefaults || defaultValue != value) {
			name = this.getAttributeName(name);
			this.writeAttribute(enc, obj, name, value, node);
		}
	}
};
mxObjectCodec.prototype.writeAttribute = function(enc, obj, attr, value, node) {
	if (typeof(value) != 'object') {
		this.writePrimitiveAttribute(enc, obj, attr, value, node);
	} else {
		this.writeComplexAttribute(enc, obj, attr, value, node);
	}
};
mxObjectCodec.prototype.writePrimitiveAttribute = function(enc, obj, attr, value, node) {
	value = this.convertValueToXml(value);
	if (attr == null) {
		var child = enc.document.createElement('add');
		if (typeof(value) == 'function') {
			child.appendChild(enc.document.createTextNode(value));
		} else {
			enc.setAttribute(child, 'value', value);
		}
		node.appendChild(child);
	} else if (typeof(value) != 'function') {
		enc.setAttribute(node, attr, value);
	}
};
mxObjectCodec.prototype.writeComplexAttribute = function(enc, obj, attr, value, node) {
	var child = enc.encode(value);
	if (child != null) {
		if (attr != null) {
			child.setAttribute('as', attr);
		}
		node.appendChild(child);
	} else {
		mxLog.warn('mxObjectCodec.encode: No node for ' + this.getName() + '.' + attr + ': ' + value);
	}
};
mxObjectCodec.prototype.convertValueToXml = function(value) {
	if (typeof(value.length) == 'undefined' && (value == true || value == false)) {
		value = (value == true) ? '1': '0';
	}
	return value;
};
mxObjectCodec.prototype.convertValueFromXml = function(value) {
	if (mxUtils.isNumeric(value)) {
		value = parseFloat(value);
	}
	return value;
};
mxObjectCodec.prototype.beforeEncode = function(enc, obj, node) {
	return obj;
};
mxObjectCodec.prototype.afterEncode = function(enc, obj, node) {
	return node;
};
mxObjectCodec.prototype.decode = function(dec, node, into) {
	var id = node.getAttribute('id');
	var obj = dec.objects[id];
	if (obj == null) {
		obj = into || this.cloneTemplate();
		if (id != null) {
			dec.putObject(id, obj);
		}
	}
	node = this.beforeDecode(dec, node, obj);
	this.decodeNode(dec, node, obj);
	return this.afterDecode(dec, node, obj);
};
mxObjectCodec.prototype.decodeNode = function(dec, node, obj) {
	if (node != null) {
		this.decodeAttributes(dec, node, obj);
		this.decodeChildren(dec, node, obj);
	}
};
mxObjectCodec.prototype.decodeAttributes = function(dec, node, obj) {
	var attrs = node.attributes;
	if (attrs != null) {
		for (var i = 0; i < attrs.length; i++) {
			this.decodeAttribute(dec, attrs[i], obj);
		}
	}
};
mxObjectCodec.prototype.decodeAttribute = function(dec, attr, obj) {
	var name = attr.nodeName;
	if (name != 'as' && name != 'id') {
		var value = this.convertValueFromXml(attr.nodeValue);
		var fieldname = this.getFieldName(name);
		if (this.isReference(obj, fieldname, value, false)) {
			var tmp = dec.getObject(value);
			if (tmp == null) {
				mxLog.warn('mxObjectCodec.decode: No object for ' + this.getName() + '.' + name + '=' + value);
				return;
			}
			value = tmp;
		}
		if (!this.isExcluded(obj, name, value, false)) {
			obj[name] = value;
		}
	}
};
mxObjectCodec.prototype.decodeChildren = function(dec, node, obj) {
	var child = node.firstChild;
	while (child != null) {
		var tmp = child.nextSibling;
		if (child.nodeType == mxConstants.NODETYPE_ELEMENT && !this.processInclude(dec, child, obj)) {
			this.decodeChild(dec, child, obj);
		}
		child = tmp;
	}
};
mxObjectCodec.prototype.decodeChild = function(dec, child, obj) {
	var fieldname = this.getFieldName(child.getAttribute('as'));
	if (fieldname == null || !this.isExcluded(obj, fieldname, child, false)) {
		var template = this.getFieldTemplate(obj, fieldname, child);
		var value = null;
		if (child.nodeName == 'add') {
			value = child.getAttribute('value');
			if (value == null) {
				value = mxUtils.eval(mxUtils.getTextContent(child));
			}
		} else {
			value = dec.decode(child, template);
		}
		this.addObjectValue(obj, fieldname, value, template);
	}
};
mxObjectCodec.prototype.getFieldTemplate = function(obj, fieldname, child) {
	var template = obj[fieldname];
	if (template instanceof Array && template.length > 0) {
		template = null;
	}
	return template;
};
mxObjectCodec.prototype.addObjectValue = function(obj, fieldname, value, template) {
	if (value != null && value != template) {
		if (fieldname != null && fieldname.length > 0) {
			obj[fieldname] = value;
		} else {
			obj.push(value);
		}
	}
};
mxObjectCodec.prototype.processInclude = function(dec, node, into) {
	if (node.nodeName == 'include') {
		var name = node.getAttribute('name');
		if (name != null) {
			try {
				var xml = mxUtils.load(name).getDocumentElement();
				if (xml != null) {
					dec.decode(xml, into);
				}
			} catch(e) {}
		}
		return true;
	}
	return false;
};
mxObjectCodec.prototype.beforeDecode = function(dec, node, obj) {
	return node;
};
mxObjectCodec.prototype.afterDecode = function(dec, node, obj) {
	return obj;
};
mxCodecRegistry.register(function() {
	var codec = new mxObjectCodec(new mxCell(), ['children', 'edges', 'overlays', 'mxTransient'], ['parent', 'source', 'target']);
	codec.isCellCodec = function() {
		return true;
	};
	codec.isExcluded = function(obj, attr, value, isWrite) {
		return mxObjectCodec.prototype.isExcluded.apply(this, arguments) || (isWrite && attr == 'value' && value.nodeType == mxConstants.NODETYPE_ELEMENT);
	};
	codec.afterEncode = function(enc, obj, node) {
		if (obj.value != null && obj.value.nodeType == mxConstants.NODETYPE_ELEMENT) {
			var tmp = node;
			node = (mxClient.IS_IE) ? obj.value.cloneNode(true) : enc.document.importNode(obj.value, true);
			node.appendChild(tmp);
			var id = tmp.getAttribute('id');
			node.setAttribute('id', id);
			tmp.removeAttribute('id');
		}
		return node;
	};
	codec.beforeDecode = function(dec, node, obj) {
		var inner = node;
		var classname = this.getName();
		if (node.nodeName != classname) {
			var tmp = node.getElementsByTagName(classname)[0];
			if (tmp != null && tmp.parentNode == node) {
				mxUtils.removeWhitespace(tmp, true);
				mxUtils.removeWhitespace(tmp, false);
				tmp.parentNode.removeChild(tmp);
				inner = tmp;
			} else {
				inner = null;
			}
			obj.value = node.cloneNode(true);
			var id = obj.value.getAttribute('id');
			if (id != null) {
				obj.setId(id);
				obj.value.removeAttribute('id');
			}
		} else {
			obj.setId(node.getAttribute('id'));
		}
		if (inner != null) {
			for (var i = 0; i < this.idrefs.length; i++) {
				var attr = this.idrefs[i];
				var ref = inner.getAttribute(attr);
				if (ref != null) {
					inner.removeAttribute(attr);
					var object = dec.objects[ref] || dec.lookup(ref);
					if (object == null) {
						var element = dec.getElementById(ref);
						if (element != null) {
							var decoder = mxCodecRegistry.codecs[element.nodeName] || this;
							object = decoder.decode(dec, element);
						}
					}
					obj[attr] = object;
				}
			}
		}
		return inner;
	};
	return codec;
} ());
mxCodecRegistry.register(function() {
	var codec = new mxObjectCodec(new mxGraphModel());
	codec.encodeObject = function(enc, obj, node) {
		var rootNode = enc.document.createElement('root');
		enc.encodeCell(obj.getRoot(), rootNode);
		node.appendChild(rootNode);
	};
	codec.decodeChild = function(dec, child, obj) {
		if (child.nodeName == 'root') {
			this.decodeRoot(dec, child, obj);
		} else {
			mxObjectCodec.prototype.decodeChild.apply(this, arguments);
		}
	};
	codec.decodeRoot = function(dec, root, model) {
		var rootCell = null;
		var tmp = root.firstChild;
		while (tmp != null) {
			var cell = dec.decodeCell(tmp);
			if (cell != null && cell.getParent() == null) {
				rootCell = cell;
			}
			tmp = tmp.nextSibling;
		}
		if (rootCell != null) {
			model.setRoot(rootCell);
		}
	};
	return codec;
} ());
mxCodecRegistry.register(function() {
	var codec = new mxObjectCodec(new mxRootChange(), ['model', 'previous', 'root']);
	codec.afterEncode = function(enc, obj, node) {
		enc.encodeCell(obj.root, node);
		return node;
	};
	codec.beforeDecode = function(dec, node, obj) {
		if (node.firstChild != null && node.firstChild.nodeType == mxConstants.NODETYPE_ELEMENT) {
			node = node.cloneNode(true);
			var tmp = node.firstChild;
			obj.root = dec.decodeCell(tmp, false);
			var tmp2 = tmp.nextSibling;
			tmp.parentNode.removeChild(tmp);
			tmp = tmp2;
			while (tmp != null) {
				tmp2 = tmp.nextSibling;
				dec.decodeCell(tmp);
				tmp.parentNode.removeChild(tmp);
				tmp = tmp2;
			}
		}
		return node;
	};
	codec.afterDecode = function(dec, node, obj) {
		obj.previous = obj.root;
		return obj;
	};
	return codec;
} ());
mxCodecRegistry.register(function() {
	var codec = new mxObjectCodec(new mxChildChange(), ['model', 'child', 'previousIndex'], ['parent', 'previous']);
	codec.isReference = function(obj, attr, value, isWrite) {
		if (attr == 'child' && (obj.previous != null || !isWrite)) {
			return true;
		}
		return mxUtils.indexOf(this.idrefs, attr) >= 0;
	};
	codec.afterEncode = function(enc, obj, node) {
		if (this.isReference(obj, 'child', obj.child, true)) {
			node.setAttribute('child', enc.getId(obj.child));
		} else {
			enc.encodeCell(obj.child, node);
		}
		return node;
	};
	codec.beforeDecode = function(dec, node, obj) {
		if (node.firstChild != null && node.firstChild.nodeType == mxConstants.NODETYPE_ELEMENT) {
			node = node.cloneNode(true);
			var tmp = node.firstChild;
			obj.child = dec.decodeCell(tmp, false);
			var tmp2 = tmp.nextSibling;
			tmp.parentNode.removeChild(tmp);
			tmp = tmp2;
			while (tmp != null) {
				tmp2 = tmp.nextSibling;
				if (tmp.nodeType == mxConstants.NODETYPE_ELEMENT) {
					var id = tmp.getAttribute('id');
					if (dec.lookup(id) == null) {
						dec.decodeCell(tmp);
					}
				}
				tmp.parentNode.removeChild(tmp);
				tmp = tmp2;
			}
		} else {
			var childRef = node.getAttribute('child');
			obj.child = dec.getObject(childRef);
		}
		return node;
	};
	codec.afterDecode = function(dec, node, obj) {
		obj.child.parent = obj.previous;
		obj.previous = obj.parent;
		obj.previousIndex = obj.index;
		return obj;
	};
	return codec;
} ());
mxCodecRegistry.register(function() {
	var codec = new mxObjectCodec(new mxTerminalChange(), ['model', 'previous'], ['cell', 'terminal']);
	codec.afterDecode = function(dec, node, obj) {
		obj.previous = obj.terminal;
		return obj;
	};
	return codec;
} ());
var mxGenericChangeCodec = function(obj, variable) {
	var codec = new mxObjectCodec(obj, ['model', 'previous'], ['cell']);
	codec.afterDecode = function(dec, node, obj) {
		if (mxUtils.isNode(obj.cell)) {
			obj.cell = dec.decodeCell(obj.cell, false);
		}
		obj.previous = obj[variable];
		return obj;
	};
	return codec;
};
mxCodecRegistry.register(mxGenericChangeCodec(new mxValueChange(), 'value'));
mxCodecRegistry.register(mxGenericChangeCodec(new mxStyleChange(), 'style'));
mxCodecRegistry.register(mxGenericChangeCodec(new mxGeometryChange(), 'geometry'));
mxCodecRegistry.register(mxGenericChangeCodec(new mxCollapseChange(), 'collapsed'));
mxCodecRegistry.register(mxGenericChangeCodec(new mxVisibleChange(), 'visible'));
mxCodecRegistry.register(mxGenericChangeCodec(new mxCellAttributeChange(), 'value'));
mxCodecRegistry.register(function() {
	return new mxObjectCodec(new mxGraph(), ['graphListeners', 'eventListeners', 'view', 'container', 'cellRenderer', 'editor', 'selection']);
} ());
mxCodecRegistry.register(function() {
	var codec = new mxObjectCodec(new mxGraphView());
	codec.encode = function(enc, view) {
		return this.encodeCell(enc, view, view.graph.getModel().getRoot());
	};
	codec.encodeCell = function(enc, view, cell) {
		var model = view.graph.getModel();
		var state = view.getState(cell);
		var parent = model.getParent(cell);
		if (parent == null || state != null) {
			var childCount = model.getChildCount(cell);
			var geo = view.graph.getCellGeometry(cell);
			var name = null;
			if (parent == model.getRoot()) {
				name = 'layer';
			} else if (parent == null) {
				name = 'graph';
			} else if (model.isEdge(cell)) {
				name = 'edge';
			} else if (childCount > 0 && geo != null) {
				name = 'group';
			} else if (model.isVertex(cell)) {
				name = 'vertex';
			}
			if (name != null) {
				var node = enc.document.createElement(name);
				var lab = view.graph.getLabel(cell);
				if (lab != null) {
					node.setAttribute('label', view.graph.getLabel(cell));
					if (view.graph.isHtmlLabel(cell)) {
						node.setAttribute('html', true);
					}
				}
				if (parent == null) {
					var bounds = view.getGraphBounds();
					if (bounds != null) {
						node.setAttribute('x', Math.round(bounds.x));
						node.setAttribute('y', Math.round(bounds.y));
						node.setAttribute('width', Math.round(bounds.width));
						node.setAttribute('height', Math.round(bounds.height));
					}
					node.setAttribute('scale', view.scale);
				} else if (state != null && geo != null) {
					for (var i in state.style) {
						var value = state.style[i];
						if (typeof(value) == 'function' && typeof(value) == 'object') {
							value = mxStyleRegistry.getName(value);
						}
						if (value != null && typeof(value) != 'function' && typeof(value) != 'object') {
							node.setAttribute(i, value);
						}
					}
					var abs = state.absolutePoints;
					if (abs != null && abs.length > 0) {
						var pts = Math.round(abs[0].x) + ',' + Math.round(abs[0].y);
						for (var i = 1; i < abs.length; i++) {
							pts += ' ' + Math.round(abs[i].x) + ',' + Math.round(abs[i].y);
						}
						node.setAttribute('points', pts);
					} else {
						node.setAttribute('x', Math.round(state.x));
						node.setAttribute('y', Math.round(state.y));
						node.setAttribute('width', Math.round(state.width));
						node.setAttribute('height', Math.round(state.height));
					}
					var offset = state.absoluteOffset;
					if (offset != null) {
						if (offset.x != 0) {
							node.setAttribute('dx', Math.round(offset.x));
						}
						if (offset.y != 0) {
							node.setAttribute('dy', Math.round(offset.y));
						}
					}
				}
				for (var i = 0; i < childCount; i++) {
					var childNode = this.encodeCell(enc, view, model.getChildAt(cell, i));
					if (childNode != null) {
						node.appendChild(childNode);
					}
				}
			}
		}
		return node;
	};
	return codec;
} ());
mxCodecRegistry.register(function() {
	var codec = new mxObjectCodec(new mxStylesheet());
	codec.encode = function(enc, obj) {
		var node = enc.document.createElement(this.getName());
		for (var i in obj.styles) {
			var style = obj.styles[i];
			var styleNode = enc.document.createElement('add');
			if (i != null) {
				styleNode.setAttribute('as', i);
				for (var j in style) {
					var value = this.getStringValue(j, style[j]);
					if (value != null) {
						var entry = enc.document.createElement('add');
						entry.setAttribute('value', value);
						entry.setAttribute('as', j);
						styleNode.appendChild(entry);
					}
				}
				if (styleNode.childNodes.length > 0) {
					node.appendChild(styleNode);
				}
			}
		}
		return node;
	};
	codec.getStringValue = function(key, value) {
		var type = typeof(value);
		if (type == 'function') {
			value = mxStyleRegistry.getName(style[j]);
		} else if (type == 'object') {
			value = null;
		}
		return value;
	};
	codec.decode = function(dec, node, into) {
		var obj = into || new this.template.constructor();
		var id = node.getAttribute('id');
		if (id != null) {
			dec.objects[id] = obj;
		}
		node = node.firstChild;
		while (node != null) {
			if (!this.processInclude(dec, node, obj) && node.nodeName == 'add') {
				var as = node.getAttribute('as');
				if (as != null) {
					var extend = node.getAttribute('extend');
					var style = (extend != null) ? mxUtils.clone(obj.styles[extend]) : null;
					if (style == null) {
						if (extend != null) {
							mxLog.warn('mxStylesheetCodec.decode: stylesheet ' + extend + ' not found to extend');
						}
						style = new Object();
					}
					var entry = node.firstChild;
					while (entry != null) {
						if (entry.nodeType == mxConstants.NODETYPE_ELEMENT) {
							var key = entry.getAttribute('as');
							if (entry.nodeName == 'add') {
								var text = mxUtils.getTextContent(entry);
								var value = null;
								if (text != null && text.length > 0) {
									value = mxUtils.eval(text);
								} else {
									value = entry.getAttribute('value');
									if (mxUtils.isNumeric(value)) {
										value = parseFloat(value);
									}
								}
								if (value != null) {
									style[key] = value;
								}
							} else if (entry.nodeName == 'remove') {
								delete style[key];
							}
						}
						entry = entry.nextSibling;
					}
					obj.putCellStyle(as, style);
				}
			}
			node = node.nextSibling;
		}
		return obj;
	};
	return codec;
} ());
mxCodecRegistry.register(function() {
	var codec = new mxObjectCodec(new mxDefaultKeyHandler());
	codec.encode = function(enc, obj) {
		return null;
	};
	codec.decode = function(dec, node, into) {
		if (into != null) {
			var editor = into.editor;
			node = node.firstChild;
			while (node != null) {
				if (!this.processInclude(dec, node, into) && node.nodeName == 'add') {
					var as = node.getAttribute('as');
					var action = node.getAttribute('action');
					var control = node.getAttribute('control');
					into.bindAction(as, action, control);
				}
				node = node.nextSibling;
			}
		}
		return into;
	};
	return codec;
} ());
mxCodecRegistry.register(function() {
	var codec = new mxObjectCodec(new mxDefaultToolbar());
	codec.encode = function(enc, obj) {
		return null;
	};
	codec.decode = function(dec, node, into) {
		if (into != null) {
			var editor = into.editor;
			node = node.firstChild;
			while (node != null) {
				if (node.nodeType == mxConstants.NODETYPE_ELEMENT) {
					if (!this.processInclude(dec, node, into)) {
						if (node.nodeName == 'separator') {
							into.addSeparator();
						} else if (node.nodeName == 'br') {
							into.toolbar.addBreak();
						} else if (node.nodeName == 'hr') {
							into.toolbar.addLine();
						} else if (node.nodeName == 'add') {
							var as = node.getAttribute('as');
							as = mxResources.get(as) || as;
							var icon = node.getAttribute('icon');
							var pressedIcon = node.getAttribute('pressedIcon');
							var action = node.getAttribute('action');
							var mode = node.getAttribute('mode');
							var template = node.getAttribute('template');
							var toggle = node.getAttribute('toggle') != '0';
							var text = mxUtils.getTextContent(node);
							var elt = null;
							if (action != null) {
								elt = into.addItem(as, icon, action, pressedIcon);
							} else if (mode != null) {
								var funct = mxUtils.eval(text);
								elt = into.addMode(as, icon, mode, pressedIcon, funct);
							} else if (template != null || (text != null && text.length > 0)) {
								var cell = editor.templates[template];
								var style = node.getAttribute('style');
								if (cell != null && style != null) {
									cell = cell.clone();
									cell.setStyle(style);
								}
								var insertFunction = null;
								if (text != null && text.length > 0) {
									insertFunction = mxUtils.eval(text);
								}
								elt = into.addPrototype(as, icon, cell, pressedIcon, insertFunction, toggle);
							} else {
								var children = mxUtils.getChildNodes(node);
								if (children.length > 0) {
									if (icon == null) {
										var combo = into.addActionCombo(as);
										for (var i = 0; i < children.length; i++) {
											var child = children[i];
											if (child.nodeName == 'separator') {
												into.addOption(combo, '---');
											} else if (child.nodeName == 'add') {
												var lab = child.getAttribute('as');
												var act = child.getAttribute('action');
												into.addActionOption(combo, lab, act);
											}
										}
									} else {
										var select = null;
										var create = function() {
											var template = editor.templates[select.value];
											if (template != null) {
												var clone = template.clone();
												var style = select.options[select.selectedIndex].cellStyle;
												if (style != null) {
													clone.setStyle(style);
												}
												return clone;
											} else {
												mxLog.warn('Template ' + template + ' not found');
											}
											return null;
										};
										var img = into.addPrototype(as, icon, create, null, null, toggle);
										select = into.addCombo();
										mxEvent.addListener(select, 'change',
										function() {
											into.toolbar.selectMode(img,
											function(evt) {
												var pt = mxUtils.convertPoint(editor.graph.container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));
												return editor.addVertex(null, funct(), pt.x, pt.y);
											});
											into.toolbar.noReset = false;
										});
										for (var i = 0; i < children.length; i++) {
											var child = children[i];
											if (child.nodeName == 'separator') {
												into.addOption(select, '---');
											} else if (child.nodeName == 'add') {
												var lab = child.getAttribute('as');
												var tmp = child.getAttribute('template');
												var option = into.addOption(select, lab, tmp || template);
												option.cellStyle = child.getAttribute('style');
											}
										}
									}
								}
							}
							if (elt != null) {
								var id = node.getAttribute('id');
								if (id != null && id.length > 0) {
									elt.setAttribute('id', id);
								}
							}
						}
					}
				}
				node = node.nextSibling;
			}
		}
		return into;
	};
	return codec;
} ());
mxCodecRegistry.register(function() {
	var codec = new mxObjectCodec(new mxDefaultPopupMenu());
	codec.encode = function(enc, obj) {
		return null;
	};
	codec.decode = function(dec, node, into) {
		var inc = node.getElementsByTagName('include')[0];
		if (inc != null) {
			this.processInclude(dec, inc, into);
		} else if (into != null) {
			into.config = node;
		}
		return into;
	};
	return codec;
} ());
mxCodecRegistry.register(function() {
	var codec = new mxObjectCodec(new mxEditor(), ['modified', 'lastSnapshot', 'ignoredChanges', 'undoManager', 'graphContainer', 'toolbarContainer']);
	codec.afterDecode = function(dec, node, obj) {
		var defaultEdge = node.getAttribute('defaultEdge');
		if (defaultEdge != null) {
			node.removeAttribute('defaultEdge');
			obj.defaultEdge = obj.templates[defaultEdge];
		}
		var defaultGroup = node.getAttribute('defaultGroup');
		if (defaultGroup != null) {
			node.removeAttribute('defaultGroup');
			obj.defaultGroup = obj.templates[defaultGroup];
		}
		return obj;
	};
	codec.decodeChild = function(dec, child, obj) {
		if (child.nodeName == 'Array') {
			var role = child.getAttribute('as');
			if (role == 'templates') {
				this.decodeTemplates(dec, child, obj);
				return;
			}
		} else if (child.nodeName == 'ui') {
			this.decodeUi(dec, child, obj);
			return;
		}
		mxObjectCodec.prototype.decodeChild.apply(this, arguments);
	};
	codec.decodeUi = function(dec, node, editor) {
		var tmp = node.firstChild;
		while (tmp != null) {
			if (tmp.nodeName == 'add') {
				var as = tmp.getAttribute('as');
				var elt = tmp.getAttribute('element');
				var style = tmp.getAttribute('style');
				var element = null;
				if (elt != null) {
					element = document.getElementById(elt);
					if (element != null && style != null) {
						element.style.cssText += ';' + style;
					}
				} else {
					var x = parseInt(tmp.getAttribute('x'));
					var y = parseInt(tmp.getAttribute('y'));
					var width = tmp.getAttribute('width');
					var height = tmp.getAttribute('height');
					element = document.createElement('div');
					element.style.cssText = style;
					var wnd = new mxWindow(mxResources.get(as) || as, element, x, y, width, height, false, true);
					wnd.setVisible(true);
				}
				if (as == 'graph') {
					editor.setGraphContainer(element);
				} else if (as == 'toolbar') {
					editor.setToolbarContainer(element);
				} else if (as == 'title') {
					editor.setTitleContainer(element);
				} else if (as == 'status') {
					editor.setStatusContainer(element);
				} else if (as == 'map') {
					editor.setMapContainer(element);
				}
			} else if (tmp.nodeName == 'resource') {
				mxResources.add(tmp.getAttribute('basename'));
			} else if (tmp.nodeName == 'stylesheet') {
				mxClient.link('stylesheet', tmp.getAttribute('name'));
			}
			tmp = tmp.nextSibling;
		}
	};
	codec.decodeTemplates = function(dec, node, editor) {
		if (editor.templates == null) {
			editor.templates = [];
		}
		var children = mxUtils.getChildNodes(node);
		for (var j = 0; j < children.length; j++) {
			var name = children[j].getAttribute('as');
			var child = children[j].firstChild;
			while (child != null && child.nodeType != 1) {
				child = child.nextSibling;
			}
			if (child != null) {
				editor.templates[name] = dec.decodeCell(child);
			}
		}
	};
	return codec;
} ());