module.exports = function (window) {
    "use strict";

    require('./css/i-chart.css'); // <-- define your own itag-name here

    var itagCore = require('itags.core')(window),
        itagName = 'i-chart', // <-- define your own itag-name here
        DOCUMENT = window.document,
        ITSA = window.ITSA,
        AUTO_EXPAND_DELAY = 200,
        SVG_HEIGHT = 5120, // 5*1024
        charts = [],
        Itag, autoExpandCharts, registerChart, unregisterChart;

    if (!window.ITAGS[itagName]) {

        registerChart = function(iscroller) {
            charts.push(iscroller);
        };

        unregisterChart = function(iscroller) {
            charts.remove(iscroller);
        };

        autoExpandCharts = function() {
            ITSA.later(function() {
                var len = charts.length,
                    i;
                for (i=0; i<len; i++) {
                    charts[i].fitSizes();
                }
            }, AUTO_EXPAND_DELAY, true);
        };

        Itag = DOCUMENT.defineItag(itagName, {
            attrs: {
                'x-axis-label': 'string',
                'y-axis-label': 'string',
                legend: 'boolean',
                'data-values': 'string'
            },

            init: function() {
                var element = this,
                    designNode = element.getItagContainer(),
                    sectionNodes = designNode.getAll('>section'),
                    dataNode = designNode.getHTML(sectionNodes),
                    series;

                if (!element.model.series) {
                    // when initializing: make sure NOT to overrule model-properties that already
                    // might have been defined when modeldata was bound. Therefore, use `defineWhenUndefined`
                    try {
                        series = JSON.parseWithDate(dataNode);
                    }
                    catch(err) {
                        console.warn(err);
                        series = [];
                    }
                    element.defineWhenUndefined('series', series); // sets element.model.someprop = somevalue; when not defined yet
                }
                // the sectionNondes should contain the attribute `is`.
                // these properties will be used during syncing:
                // is="header"
                // is="footer"
                // is="x-axis"
                // is="y-axis"
                // is="x2-axis"
                // is="y2-axis"
                sectionNodes.forEach(function(sectionNode) {
                    var is = sectionNode.getAttr('is');
                    is && element.defineWhenUndefined(is, sectionNode.getHTML()); // sets element.model.someprop = somevalue; when not defined yet
                });
                element.itagReady().then(function() {
                    registerChart(element);
                });
            },

            render: function() {
                var element = this;
                element.setData('_container', element.append('<section></section>'));
            },

            sync: function() {
                var element = this,
                    container = element.getData('_container'),
                    model = element.model,
                    content = '';
                if (model.title) {
                    content += '<section is="title">'+model.title+'</section>';
                }
                content += '<section is="chart">'+element.renderGraph()+'</section>';
                if (model.footer) {
                    content += '<section is="footer">'+model.footer+'</section>';
                }
                container.setHTML(content);
                if (!element.hasData('_firstSync')) {
                    element.setData('_firstSync', true);
                    element.fitSizes();
                }
                element.createSeries();
            },

            renderGraph: function() {
                return '<p>i-chart cannot be used directly: you need a speudoClass</p>';
            },

            createSeries: function() {
                // needs to be done AFTER the dom has the svg-area, because some types need to calculate its sizes
                // in oder to be able to set the series at the right position
            },

            getViewBoxWidth: function() {
                var element = this,
                    svgNode = element.getSVGNode();
                return Math.round((svgNode.svgWidth/element.getSVGHeight())*element.getViewBoxHeight());
            },

            getViewBoxHeight: function() {
                return SVG_HEIGHT;
            },

            getSVGHeight: function() {
                var element = this,
                    svgNode = element.getSVGNode();
                return svgNode ? svgNode.svgHeight : 0;
            },

            getSVGNode: function () {
                var element = this,
                    svgNode;
                if (!element.hasData('_svgNode')) {
                    svgNode = element.getElement('svg');
                    svgNode && (element.setData('_svgNode', svgNode));
                }
                return element.getData('_svgNode');
            },

            fitSizes: function() {
console.warn(this.getSVGHeight());
                var element = this,
                    svgNode = element.getSVGNode();
                svgNode && svgNode.setAttr('viewBox', '0 0 '+element.getViewBoxWidth()+' '+element.getViewBoxHeight());
            },

            destroy: function() {
                var element = this;
                unregisterChart(element);
            }

        });

        autoExpandCharts();
        window.ITAGS[itagName] = Itag;
    }

    return window.ITAGS[itagName];
};
