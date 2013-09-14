(function(Risk) {
    'use strict';

    function fill_array(size, f) {
        var f_args = Array.prototype.slice.call(arguments, 2);
        var a = [];
        for (var i = 0; i < size; i++) {
            a.push(f(f_args));
        }
        return a;
    };

    function percent_format(num, width_in) {
        var width = 2;
        if (typeof width_in !== 'undefined' ) {
            width = width_in;
        }

        if (num >= 1) {
            return num.toFixed(width - 1);
        }
        else {
            return num.toFixed(width).slice(1);
        }
    };

    Risk.BASE_SIMULATION_COUNT = 1000;

    Risk.roll_die = function (sides) {
        return Math.floor((Math.random() * sides) + 1);
    };

    Risk.simulate = function (a_count, d_count, a_sides, d_sides, s_count) {

        var iterations = typeof s_count === 'undefined' ? Risk.BASE_SIMULATION_COUNT : s_count

        var result = {
            defender: {},
            attacker: {},
            count: iterations
        };

        for (var i = 0; i < iterations; i++) {
            var attackers = a_count
            var defenders = d_count

            // Execute the combat until one side is defeated.
            while (attackers > 0 && defenders > 0) {

                var num_a_dice = attackers > 2 ? 3 : attackers
                var num_d_dice = defenders > 1 ? 2 : 1

                var a_dice = fill_array(num_a_dice, Risk.roll_die, a_sides).sort().reverse();
                var d_dice = fill_array(num_d_dice, Risk.roll_die, d_sides).sort().reverse();

                var min_dice = Math.min(num_a_dice, num_d_dice);
                var attack_hits = 0;
                var defend_hits = 0;
                for (var j = 0; j < min_dice; j++) {
                    if (a_dice[j] > d_dice[j]) {
                        attack_hits += 1
                    }
                    else {
                        defend_hits += 1
                    }
                }

                attackers -= defend_hits
                defenders -= attack_hits
            }

            // Record the result of the combat.
            if (attackers <= 0 ) {
                if (defenders in result.defender) {
                    result.defender[defenders] += 1
                }
                else {
                    result.defender[defenders] = 1
                }
            }
            else if (defenders <= 0) {
                if (attackers in result.attacker) {
                    result.attacker[attackers] += 1
                }
                else {
                    result.attacker[attackers] = 1
                }
            }
        }
        return result;
    };

    Risk.render = function(result) {

        // Process the data.

        // Find the range of values.
        var max_attack_key = 1;
        for (var property in result.attacker) {
            if (result.attacker.hasOwnProperty(property)) {
                var num = parseInt(property);
                if (num > max_attack_key) {
                    max_attack_key = num;
                }
            }
        }
        var max_defend_key = 1;
        for (var property in result.defender) {
            if (result.defender.hasOwnProperty(property)) {
                var num = parseInt(property);
                if (num > max_defend_key) {
                    max_defend_key = num;
                }
            }
        }

        // Normalize the data.
        var data = [];
        for (var i = max_defend_key; i > 0; i--) {
            var value = i in result.defender ? result.defender[i] : 0;
            data.push({
                count: value / result.count,
                label: 'd+' + i
            });
            // data.push(value);
        }
        for (var i = 1; i <= max_attack_key; i++) {
            var value = i in result.attacker ? result.attacker[i] : 0;
            data.push({
                count: value / result.count,
                label: 'a+' + i
            });
            // data.push(value);
        }

        console.log(data);


        // Insert the style for the chart.

        d3.select('body').append('style').text(
            '.chart rect { stroke: white; }\n' +
            '.chart .attacker { fill: red; }\n' +
            '.chart .defender { fill: steelblue; }'
        );


        // Generate the chart.

        var height = 400;
        var bar_width = 30;
        var width = data.length * bar_width;

        var chart = d3.select('body').append('svg')
            .attr('class', 'chart')
            .attr('width', width)
            .attr('height', height);

        var x = d3.scale.linear()
            .domain([0, data.length])
            .range([0, width]);

        var y = d3.scale.linear()
            .domain([0, 1])
            .range([0, height]);

        chart.selectAll('rect')
            .data(data)
          .enter().append('rect')
            .attr('x', function(d, i) { return x(i); })
            .attr('y', function(d) { return height / 2 - y(d.count) })
            .attr('height', function(d) { return y(d.count) })
            .attr('width', bar_width)
            .attr('class', function(d, i) { return i < max_defend_key ? 'defender' : 'attacker' });

        chart.selectAll('text')
            .data(data)
          .enter().append('svg:text')
            .attr('x', function(d, i) { return x(i) + bar_width / 2; })
            .attr('y', function(d) { return height / 2 - y(d.count) })
            .attr('style', 'font-size: 12; font-family: Helvetica, sans-serif')
            .attr('text-anchor', 'middle')
            .text(function(d) { return percent_format(d.count); })
            .attr('fill', 'black');

        chart.selectAll('text.yaxis')
            .data(data)
          .enter().append('svg:text')
            .attr('x', function(d, i) { return x(i) + bar_width / 2; })
            .attr('y', height / 2 + 10)
            .attr('style', 'font-size: 12; font-family: Helvetica, sans-serif')
            .attr('text-anchor', 'middle')
            .text(function(d) { return d.label; })
            .attr('fill', 'black')
            .attr('class', 'yaxis');

    };

}(typeof exports === 'undefined' ? this['Risk'] = {} : exports));
