/** @jsx React.DOM */
var FreshnessScale = React.createClass({
  getInitialState: function() {
    return {};
  },

  render: function() {
    // Freshness scale
    var freshnessScale = [];
    for (var i = 0; i < this.props.numItems; ++i) {
      var className = "freshnessLevel" + (i + 1);
      freshnessScale.push(<div className={ className } key={ i }></div>);
    }

    return (
      <div id="freshnessScale">
        <p>Freshness</p>
        <p>Scale</p>
        { freshnessScale }
      </div>
    );
  }
});

React.render(
  <FreshnessScale
    numItems="7" />, document.getElementById("freshnessScaleContainer")
);
