const cheerio = require('cheerio');
const rp = require('request-promise');

async function get_project_json(url) {

    var html = await rp(url);
    var $ = cheerio.load(html);
    var script = $('head > script').html();
    var script_lines = script.split('\n');

    // First line of script is "FIG_CACHE = window.FIG_CACHE || {};"
    // We avoid screwing up with defining FIG_CACHE outside eval loop
    var FIG_CACHE = {};
    for (var i=1; i < script_lines.length; i++) {
        eval(script_lines[i]); // don't ever do this lol
    }

    return FIG_CACHE
}

var project_url = "https://www.fig.co/campaigns/kingdoms-and-castles";

get_project_json(project_url)
    .then((json) => { console.log(json); })
    .catch((err) => { console.log(err); });
