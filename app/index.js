/**
 * Main JS file for project.
 */

// Define globals that are added through the config.json file, here like this:
/* global $ */
'use strict';

// Dependencies

// Use jQuery because its on the page and we are lazy, and laoding in the data
// is a bit expensive.

// Filter category buttons
$('#filter-category button').on('click', e => {
  e.preventDefault();
  let $this = $(e.currentTarget);

  // Class
  $('#filter-category button').removeClass('active');
  $this.addClass('active');

  filterExecutives();
});

// Show list types
$('#show-list-type button').on('click', e => {
  e.preventDefault();
  let $this = $(e.currentTarget);

  // Class
  $('#show-list-type button').removeClass('active');
  $this.addClass('active');

  filterExecutives();
});

// Filter
function filterExecutives() {
  // Get current filters
  let categoryFilter = $('#filter-category button.active').data('value');
  let listFilter = $('#show-list-type button.active').data('value');

  // Remove mark
  $('.executive').removeClass('filtered');

  // Filter category first
  if (categoryFilter) {
    $(`.executive:not([data-category="${categoryFilter}"])`).addClass(
      'filtered'
    );
  }

  // Remove titles
  $('.sub-list-title').addClass('filtered');

  // Filter list
  if (listFilter === 'top-female') {
    $('.female-executive-title').removeClass('filtered');
    $('.executive:not(.executive-female)').addClass('filtered');
  }
  else if (listFilter === 'top-non-ceo') {
    $('.non-ceo-title').removeClass('filtered');
    $('.executive:not(.executive-non-ceo)').addClass('filtered');
  }
  else {
    $('.ceo-title').removeClass('filtered');
    $('.executive:not(.executive-ceo)').addClass('filtered');
  }

  // Hide filtered
  $('.executive.filtered,.sub-list-title.filtered').slideUp('fast');
  $('.executive:not(.filtered),.sub-list-title:not(.filtered)').slideDown(
    'fast'
  );
}
