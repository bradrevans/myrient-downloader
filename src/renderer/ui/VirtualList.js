/**
 * @file Implements a virtualized list for rendering large datasets efficiently.
 * @class
 */
export default class VirtualList {
    /**
     * Creates an instance of VirtualList.
     * @param {HTMLElement} container - The scrollable container element for the list.
     * @param {object} options - The options for the virtual list.
     * @param {Array<object>} [options.items=[]] - The full list of items to render.
     * @param {function(object): HTMLElement} options.rowRenderer - A function that takes an item and returns the DOM element for its row.
     * @param {number} options.rowHeight - The fixed height of each row in pixels.
     * @param {number} [options.spacing=0] - The space between rows in pixels.
     */
    constructor(container, { items = [], rowRenderer, rowHeight, spacing = 0 }) {
        this.container = container;
        this.allItems = items; // Store the original, unfiltered list
        this.items = items;
        this.rowRenderer = rowRenderer;
        this.rowHeight = rowHeight;
        this.spacing = spacing;
        this.renderedItems = new Map(); // Stores the DOM node for each rendered item's index
        this._calculateTotalHeight();

        this.container.style.position = 'relative';
        this.container.style.overflowY = 'auto';

        this.content = document.createElement('div');
        this.content.style.height = `${this.totalHeight}px`;
        this.content.style.position = 'relative';
        this.container.innerHTML = '';
        this.container.appendChild(this.content);

        this.onScroll = this.onScroll.bind(this);
        this.container.addEventListener('scroll', this.onScroll);

        this.render();
    }
    /**
     * Calculates the total height of the scrollable content area.
     * @private
     */
    _calculateTotalHeight() {
        if (!this.items || this.items.length === 0) {
            this.totalHeight = 0;
            return;
        }
        this.totalHeight = this.items.length * this.rowHeight + (this.items.length - 1) * this.spacing;
    }

    /**
     * Renders the visible items in the list based on the current scroll position.
     * It adds new visible items to the DOM and removes items that are no longer visible.
     */
    render() {
        if (!this.items) return;
        const scrollTop = this.container.scrollTop;
        const containerHeight = this.container.clientHeight;
        const rowHeightWithSpacing = this.rowHeight + this.spacing;

        const startIndex = Math.max(0, Math.floor(scrollTop / rowHeightWithSpacing));
        const endIndex = Math.min(this.items.length - 1, startIndex + Math.ceil(containerHeight / rowHeightWithSpacing));

        const visibleIndices = new Set();
        for (let i = startIndex; i <= endIndex; i++) {
            visibleIndices.add(i);
        }

        // Remove items that are no longer visible
        for (const [index, node] of this.renderedItems.entries()) {
            if (!visibleIndices.has(index)) {
                this.content.removeChild(node);
                this.renderedItems.delete(index);
            }
        }

        // Add new items that are now visible
        for (let i = startIndex; i <= endIndex; i++) {
            if (!this.renderedItems.has(i)) {
                const item = this.items[i];
                const node = this.rowRenderer(item);
                node.style.position = 'absolute';
                node.style.top = `${i * rowHeightWithSpacing}px`;
                node.style.width = '100%';
                node.style.height = `${this.rowHeight}px`;

                this.content.appendChild(node);
                this.renderedItems.set(i, node);
            }
        }
    }

    /**
     * Handles the scroll event on the container, triggering a re-render.
     */
    onScroll() {
        requestAnimationFrame(() => this.render());
    }

    /**
     * Cleans up event listeners when the list is no longer needed.
     */
    destroy() {
        this.container.removeEventListener('scroll', this.onScroll);
        this.container.innerHTML = '';
        this.renderedItems.clear();
    }

      /**
       * Updates the currently displayed items and re-renders the list.
       * @param {Array<object>} itemsToDisplay - The new list of items to display.
       */
      displayItems(itemsToDisplay) {
        this.items = itemsToDisplay;
        this._calculateTotalHeight();
        this.content.style.height = `${this.totalHeight}px`;
    
        for (const node of this.renderedItems.values()) {
          if (node.parentNode === this.content) {
            this.content.removeChild(node);
          }
        }
        this.renderedItems.clear();
        this.render();
      }
    
      /**
       * Updates the master list of items and re-renders.
       * @param {Array<object>} newItems - The new master list of items.
       */
      updateItems(newItems) {
        this.allItems = newItems;
        this.displayItems(newItems);
      }
    
      /**
       * Filters the list based on a search query and triggers a re-render.
       * @param {string} query - The search query.
       */
      search(query) {
        const lowerCaseQuery = query.toLowerCase();
        let filteredItems;
        if (!query) {
          filteredItems = this.allItems;
        } else {
          filteredItems = this.allItems.filter(item => {
            const name = (item.name_raw || item.name || item.tag || '').toLowerCase();
            return name.includes(lowerCaseQuery);
          });
        }
        this.displayItems(filteredItems);
      }}
