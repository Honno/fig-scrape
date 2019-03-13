const cheerio = require('cheerio');
const rp = require('request-promise');
const fs = require('fs-extra');

const SITE_URL = "https://www.fig.co";
const CAMPAIGNS_SLUG = "campaigns";

const DUMP_FOLDER = "dump";

async function get_project_dict(url) {
    var html = await rp(url);

    var $ = cheerio.load(html);
    var script = $('head > script').html();

    var dict = eval_script(script);

    return dict;
}

async function dump_project_data(url) {
    var dict = await get_project_dict(url);
    var file_location = DUMP_FOLDER + '/' + dict["campaign_slug"] + ".json";

    await fs.writeFile(file_location, JSON.stringify(dict, null, 2), 'utf8');
}

async function get_all_project_slugs() {
    var html = await rp(SITE_URL + '/' + CAMPAIGNS_SLUG);

    var $ = cheerio.load(html);
    var script = $('head > script').eq(2).html(); // 3rd script instance holds FIG_CACHE

    var dict = eval_script(script);
    var campaigns = dict["published_campaigns"];
    var campaign_slugs = campaigns.map(obj => obj["slug"]);

    return campaign_slugs;
}

async function projects_dump() {
    var dump_folder_exist = await fs.exists(DUMP_FOLDER);
    if(!dump_folder_exist) {
        await fs.mkdir(DUMP_FOLDER);
    }

    var campaigns_slugs = await get_all_project_slugs();

    for(var i in campaigns_slugs) {
        var url = SITE_URL + '/' + CAMPAIGNS_SLUG + '/' + campaigns_slugs[i];
        dump_project_data(url)
            .then(() => console.log(url + " scraped!"))
            .catch((err) => {
                   console.log(url + "  not scraped :(");
                   console.log(err);
            });
    }
}

projects_dump()
    .catch((err) => {
        console.log("Something went wrong D:");
        console.log(err);
    });

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
