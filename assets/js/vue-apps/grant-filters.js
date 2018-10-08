import $ from 'jquery';
import Vue from 'vue';
import debounce from 'lodash/debounce';

function init() {
    const mountEl = document.getElementById('js-grant-filters');
    if (!mountEl) {
        return;
    }
    new Vue({
        el: mountEl,
        delimiters: ['<%', '%>'],
        data() {
            // Populate data from global object (eg. to share server/client state)
            let PGS = window._PAST_GRANTS_SEARCH;
            let queryParams = PGS && PGS.queryParams ? PGS.queryParams : {};
            let existingFacets = PGS && PGS.facets ? PGS.facets : {};
            let existingSort = PGS && PGS.sort ? PGS.sort : {};
            let defaultFilters = {
                amount: '',
                year: '',
                programme: '',
                country: '',
                localAuthority: '',
                constituency: ''
            };
            return {
                defaultFilters,
                sort: Object.assign({}, existingSort),
                facets: Object.assign({}, existingFacets),
                filters: Object.assign({}, defaultFilters, queryParams),
                isCalculating: false,
                totalResults: PGS.totalResults || 0,
                searchError: false
            };
        },
        watch: {
            // Watch for changes to filters then make AJAX call
            filters: {
                handler: function() {
                    this.filterResults();
                },
                deep: true
            }
        },
        mounted: function() {
            // Enable inputs (they're disabled by default to avoid double inputs for non-JS users)
            $(this.$el)
                .find('[disabled]')
                .removeAttr('disabled');
        },
        methods: {
            // Create the sort parameters
            sortData: function(sortKey, currentDirection) {
                // Flip reverse it
                let direction = currentDirection === 'asc' ? 'desc' : 'asc';
                this.sort = {
                    type: sortKey,
                    direction: direction
                };
                this.filters.sort = `${sortKey}|${direction}`;
                this.filterResults();
            },

            // Generate CSS classes for sort links
            sortLinkClasses: function(sortKey) {
                const type = this.sort.type;
                const dir = this.sort.direction;
                return {
                    'is-active': type === sortKey,
                    'is-descending': type === sortKey && dir === 'desc',
                    'is-ascending': type === sortKey && dir === 'asc'
                };
            },

            getSortTitle: function(ascTitle, descTitle) {
                if (this.sort.direction === 'asc') {
                    return ascTitle;
                }
                return descTitle;
            },

            // Convert filters into URL-friendly state
            filtersToString: function() {
                return Object.keys(this.filters)
                    .map(key => {
                        return `${encodeURIComponent(key)}=${encodeURIComponent(this.filters[key])}`;
                    })
                    .join('&');
            },

            // Reset the filters back to their default state
            clearFilters: function(key) {
                if (key) {
                    this.filters[key] = this.defaultFilters[key];
                } else {
                    this.filters = Object.assign({}, this.defaultFilters);
                }
                this.filterResults();
            },

            // Push URL state (@TODO support back/forward nav)
            updateUrl: function() {
                if (window.history.pushState) {
                    const newURL = new URL(window.location.href);
                    newURL.search = `?${this.filtersToString()}`;
                    window.history.pushState({ path: newURL.href }, '', newURL.href);
                }
            },

            // Send the data to the AJAX endpoint and output the results to the page
            filterResults: debounce(function() {
                this.isCalculating = true;
                this.searchError = false;

                setTimeout(() => {
                    const $form = $(this.$el);
                    const url = $form.attr('action');
                    const urlWithParams = `${url}?${this.filtersToString()}`;
                    $.ajax({
                        url: urlWithParams,
                        dataType: 'json',
                        timeout: 20000
                    })
                        .then(response => {
                            // @TODO vue-ize this
                            $('#js-grant-results').html(response.resultsHtml);
                            this.totalResults = response.meta.totalResults;
                            this.facets = response.facets;
                            this.updateUrl();
                            this.isCalculating = false;
                        })
                        .catch(err => {
                            const error = err.responseJSON.error;
                            this.isCalculating = false;
                            if (error && error.code) {
                                this.searchError = error.code;
                            } else {
                                this.searchError = true;
                            }
                        });
                }, 500);
            }, 500)
        }
    });
}

export default {
    init
};