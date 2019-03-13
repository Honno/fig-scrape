const cheerio = require('cheerio');
const rp = require('request-promise');
const fs = require('fs-extra');

const SITE_URL = "https://www.fig.co";
const CAMPAIGNS_SLUG = "/campaigns";

async function get_project_dict(url) {
    var html = await rp(url);

    var $ = cheerio.load(html);
    var script = $('head > script').html();

    var dict = eval_script(script);

    return dict;
}

async function dump_project_data(url) {
    var dict = await get_project_dict(project_url);
    await fs.writeFile("out.json", JSON.stringify(dict), 'utf8');
}

async function get_all_project_slugs() {
    var html = await rp(SITE_URL + CAMPAIGNS_SLUG);

    var $ = cheerio.load(html);
    var script = $('head > script').eq(2).html(); // 3rd script instance holds FIG_CACHE

    var dict = eval_script(script);
    var campaigns = dict["published_campaigns"];
    var campaign_slugs = campaigns.map(obj => obj["slug"]);

    return campaign_slugs;
}

get_all_project_slugs()
    .then((script) => console.log(script))
    .catch((err) => console.log(err));

/* Helpers */

function eval_script(script) {
    var script_lines = script.split('\n');
    // First line of script is "FIG_CACHE = window.FIG_CACHE || {};"
    // We avoid the window thing by defining FIG_CACHE outside eval loop
    var FIG_CACHE = {};
    for (var i=1; i < script_lines.length; i++) {
        eval(script_lines[i]); // don't ever do this lol
    }

    return FIG_CACHE;
}
