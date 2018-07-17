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
  $('.executive,.non-ceo-title').removeClass('filtered');

  // Filter category first
  if (categoryFilter) {
    $(`.executive:not([data-category="${categoryFilter}"])`).addClass(
      'filtered'
    );
  }

  // Filter list
  if (listFilter === 'top-female') {
    $('.non-ceo-title').addClass('filtered');
    $('.executive.executive-non-ceo').addClass('filtered');
    $('.executive.executive-ceo:not([data-gender="F"])').addClass('filtered');
  }
  else if (listFilter === 'top-non-ceo') {
    $('.executive.executive-ceo').addClass('filtered');
  }
  else {
    $('.non-ceo-title').addClass('filtered');
    $('.executive.executive-non-ceo').addClass('filtered');
  }

  // Hide filtered
  $('.executive.filtered,.non-ceo-title.filtered').slideUp('fast');
  $('.executive:not(.filtered),.non-ceo-title:not(.filtered)').slideDown(
    'fast'
  );
}
