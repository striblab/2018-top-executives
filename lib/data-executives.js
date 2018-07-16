/**
 * Module configuration for getting the list of executives from
 * Data UI.  To be used in the "build-data" process in "gulp-html"
 */

// Dependencies
const _ = require('lodash');
const path = require('path');
const fs = require('fs-extra');
const csv = require('d3-dsv').dsvFormat(',');
require('dotenv').load();

// Configuration to hand to build-data
module.exports = {
  executives: {
    remote: true,
    source: `${
      process.env.DATA_UI_LOCATION
    }/api/v01/officer_salary/?publishyear__in=2017,2018&limit=0&username=${
      process.env.DATA_UI_USERNAME
    }&api_key=${process.env.DATA_UI_API_KEY}`,
    // Only once a day
    ttl: 1000 * 60 * 60 * 24,
    type: 'json',
    postprocess: transformExecutives,
    publishYear: 2018,
    headshots: path.join(__dirname, '..', 'assets', 'images', 'executives'),
    headshotFormat: 'jpg',
    dataOutput: path.join(__dirname, '..', 'data', 'build')
  }
};

// Transform function for executive
function transformExecutives(data, options) {
  if (!data || !data.objects) {
    throw new Error(
      'Unable to find data or objects from Executives Data UI API.'
    );
  }

  // Group by officer_id
  let officers = _.groupBy(data.objects, e => {
    return e.officerid.id;
  });

  // Reformat officers
  officers = _.map(officers, o => {
    let officer = _.omit(o[0].officerid, ['coid']);
    officer.company = o[0].officerid.coid;

    // Salaries
    officer.salaries = {};
    _.each(o, s => {
      officer.salaries[s.publishyear] = _.omit(s, ['officerid']);
    });

    return officer;
  });

  // Remove any officers that don't have current year
  officers = _.filter(officers, o => {
    if (!o.salaries[options.publishYear]) {
      return false;
    }

    return true;
  });

  // Look for images
  officers = officers.map(o => {
    let p = path.join(options.headshots, `${o.id}.${options.headshotFormat}`);
    o.hasimage = fs.existsSync(p);
    return o;
  });

  // Sanity check totals
  officers.forEach(o => {
    _.each(o.salaries, s => {
      let calculatedTotal = _.sum(
        _.filter([
          s.salary,
          s.bonus,
          s.nonequityipc,
          s.allothertotal,
          s.stockexpense,
          s.sharesvesting
        ])
      );
      if (calculatedTotal !== s.calculated_total_value) {
        console.warn(
          `[${o.id}] [${s.publishyear}]: Total mismatch | data-ui: ${
            s.calculated_total_value
          } | manual sum: ${s.calculated_total_value}`
        );
      }
    });
  });

  // Split into ceo and non-ceo
  let groups = _.groupBy(officers, o => {
    return o.salaries[options.publishYear].ceo &&
      !~[0, '0', null, undefined, ''].indexOf(
        o.salaries[options.publishYear].ceo
      )
      ? 'ceo'
      : 'nonceo';
  });

  // Rank
  _.each(groups, group => {
    [options.publishYear - 1, options.publishYear].forEach(year => {
      let totals = _
        .sortBy(
          _.uniq(
            _.map(group, o => {
              return o.salaries[year]
                ? o.salaries[year].calculated_total_value
                : -1;
            })
          )
        )
        .reverse();

      // Match up
      _.map(group, o => {
        if (o.salaries[year]) {
          o.salaries[year].rank =
            totals.indexOf(o.salaries[year].calculated_total_value) + 1;
        }

        return o;
      });

      // Sort by current year rank
      group = _.sortBy(group, o => {
        return o.salaries[year] ? o.salaries[year].rank : 999999999;
      });
    });
  });

  // Other output
  outputPrint(groups.ceo, options);

  return groups;
}

// Output print file, csv
function outputPrint(ceos, options = {}) {
  fs.mkdirpSync(options.dataOutput);

  let output = ceos.map(o => {
    let c = o.company;
    let s = o.salaries[options.publishYear];
    let sPast = o.salaries[options.publishYear - 1];

    return {
      rank: s.rank,
      name: `${
        o.salut && !o.salut.match(/(mr|ms|mrs)/i) ? o.salut + ' ' : ''
      }${_.filter([o.first, o.middle, o.last]).join(' ')}${
        o.lineage ? ', ' + o.lineage : ''
      }`,
      title: s.title,
      company: c.name,
      stock: c.stocksymbol,
      total_pay: s.calculated_total_value,
      [`total_pay_${options.publishYear - 1}`]: sPast
        ? sPast.calculated_total_value
        : undefined,
      percent_change: sPast
        ? Math.round(
          ((s.calculated_total_value - sPast.calculated_total_value) /
              sPast.calculated_total_value) *
              100 *
              100
        ) / 100
        : undefined,
      salary: s.salary,
      bonus: _.sum(_.filter([s.bonus, s.nonequityipc])) || 0,
      misc: s.allothertotal,
      stock_expense: s.stockexpense,
      shares_vesting: s.sharesvesting,
      combined_stock_awards:
        _.sum(_.filter([s.stockexpense, s.sharesvesting])) || 0,
      one_year_return: s.stockchange,
      ceo_pay_ratio: s.ceopayratio,
      median_employee_pay: s.medianemployeepay
    };
  });

  // Sort
  output = _.sortBy(output, 'rank');

  // Top 50
  output = _.take(output, 50);

  // Save
  fs.writeFileSync(
    path.join(
      options.dataOutput,
      `${new Date().toISOString().split('T')[0]}-ceos.csv`
    ),
    csv.format(output)
  );
}
