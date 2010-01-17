﻿/*
---
script: mooml.js
description: Mooml is a Mootools based version of Jaml which makes HTML generation easy and pleasurable.
jaml: Mooml is based on Ed Spencer's Jaml (http://edspencer.github.com/jaml)
url: http://github.com/eneko/mooml
license: MIT-style

authors:
- Eneko Alonso (http://enekoalonso.com)

provides:
- mooml

requires:
- core/1.2.4:Class
- core/1.2.4:Elements
- core/1.2.4:Array

...
*/

Mooml = new (new Class({

	templates: {},

	engine: {
		nodeStack: []
	},

	tags: [
		"html", "head", "body", "script", "meta", "title", "link", "script",
		"div", "p", "span", "a", "img", "br", "hr",
		"table", "tr", "th", "td", "thead", "tbody",
		"ul", "ol", "li",
		"dl", "dt", "dd",
		"h1", "h2", "h3", "h4", "h5", "h6", "h7",
		"form", "input", "label"
	],

	/**
	 * @constructor
	 * Initializes the engine
	 */
	initialize: function() {
		this.initEngine();
	},

	/**
	 * Registers a new template for later use
	 * @param {String} name The name of the template
	 * @param {Function} code The code function of the template
	 */
	register: function(name, code) {
		this.templates[name] = function(data) {
			return this.evaluate(code, data);
		}.bind(this);
	},

	/**
	 * Evaluates a registered template
	 * @param {String} name The name of the template to evaluate
	 * @param {Object|Array} data Optional data object or array of objects
	 */
	render: function(name, data) {
		return this.templates[name](data);
	},

	/**
	 * Evaluates a Mooml template
	 * @param {function} code The code function of the template
	 * @param {Object|Array} data Optional data object or array of objects
	 */
	evaluate: function(code, data) {
		// List of elements returned by evaluating the template
		var elements = [];

		// All elements generated during the evaluation of the template
		var nodes = [];

		// Add a new node list to the stack (allows nested templates)
		this.engine.nodeStack.push(nodes);

		// If data is an array, render the template X times
		// If data is not an array or is not present, render the template once
		$splat(data || {}).each(function(params) {

			// Evaluate the whole template code in the scope of the engine
			with (this.engine) {
				eval('(' + code + ')(params)');
			}
			//console.log('Mooml: nodes:', nodes, nodes.length, this.engine.nodeStack.length);

			// Save only the root elements (other elements will be child of those)
			elements.extend(new Elements(nodes.filter(function(node) {
				return node.parentNode === null;
			})));
			nodes.empty();

		}.bind(this));

		// Remove the node list from the stack
		this.engine.nodeStack.pop();

		// If template has multiple root elements, return an array, otherwise return an element
		return (elements.length > 1) ? elements : elements.shift();
	},

	/**
	 * Initializes the engine generating a javascript function for every html
	 * tag that can be used on the template.
	 * Template tag functions can receive options for the element, child 
	 * elements and html code as parameters.
	 * initEngine can be called by the user in case of adding additional tags.
	 */
	initEngine: function() {

		// For every html, generate a function on the engine object (div(), span(), p(), etc).
		this.tags.each(function(tag) {

			// If user calls initEngine, avoid generating existing functions
			if (this.engine[tag]) return;

			this.engine[tag] = function() {
				//console.log('Mooml: rendering tag: ', tag);

				// Get the node list for the current template being rendered
				var nodes = this.nodeStack.getLast();

				// Create the element for the current tag
				var el = new Element(tag);


				// For each argument passed to the tag function, check type and proceed
				$each(arguments, function(argument, index) {

					//console.log('Mooml: argument', index, ': ', argument, '(', $type(argument), ')');
					switch ($type(argument)) {

						// elements or arrays of elements are adopted as children of the current element
						case "array":
						case "element":
						case "collection": {
							el.adopt(argument);
							break;
						}

						// strings are adopted as html
						case "string": {
							el.getChildren().each(function(child) { nodes.erase(child) });
							el.set('html', el.get('html') + argument);
							break;
						}

						// object arguments are options passed to the element (attributes, events, styles...)
						case "object": {
							el.set(argument); 
							break;
						}

						// other arguments types are ignored
					}

				});


				// Add the element to the node list
				nodes.push(el);
				return el;
			}

		}.bind(this));
	}

}))();
